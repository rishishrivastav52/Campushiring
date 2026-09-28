"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { ApplicationStatus, Role } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendStatusEmail } from "@/lib/email";
import { skillMatchPercent } from "@/lib/utils";

export type ActionResult = { ok: boolean; message: string };

/* ------------------------------------------------------------------ *
 * Session guard
 * ------------------------------------------------------------------ */

async function requireUser(role?: Role) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: Role } | undefined;

  if (!user?.id) redirect("/");
  if (role && user.role !== role) redirect("/");

  return { id: user.id as string, role: user.role as Role };
}

/* ------------------------------------------------------------------ *
 * Sign up — needed to get a real User row before anything else works
 * ------------------------------------------------------------------ */

export async function registerUser(formData: FormData): Promise<ActionResult> {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").toLowerCase().trim();
  const password = String(formData.get("password") || "");
  const role = String(formData.get("role") || "STUDENT") === "COMPANY" ? Role.COMPANY : Role.STUDENT;

  if (!name || !email || password.length < 6) {
    return { ok: false, message: "Enter a name, an email, and a password of at least 6 characters." };
  }

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return { ok: false, message: "That email already has an account. Sign in instead." };
  }

  await prisma.user.create({
    data: {
      name,
      email,
      password: await bcrypt.hash(password, 10),
      role,
      companyName: role === Role.COMPANY ? name : null,
    },
  });

  return { ok: true, message: "Account created. Sign in to continue." };
}

/* ------------------------------------------------------------------ *
 * 1. CreateJob — a company publishes a posting
 * ------------------------------------------------------------------ */

export async function createJob(formData: FormData): Promise<ActionResult> {
  const company = await requireUser(Role.COMPANY);

  const title = String(formData.get("title") || "").trim();
  const location = String(formData.get("location") || "").trim();
  const salary = String(formData.get("salary") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const employment = String(formData.get("employment") || "Full-time").trim();

  if (!title || !location || !salary) {
    return { ok: false, message: "Title, location and salary are required to publish a role." };
  }

  await prisma.job.create({
    data: {
      title,
      location,
      salary,
      employment,
      description: description || "No description provided yet.",
      companyId: company.id,
    },
  });

  revalidatePath("/company");
  revalidatePath("/student");
  return { ok: true, message: `Published ${title}.` };
}

export async function deleteJob(formData: FormData): Promise<ActionResult> {
  const company = await requireUser(Role.COMPANY);
  const jobId = String(formData.get("jobId") || "");

  // Scoping the delete by companyId makes ownership part of the query, so a
  // forged jobId can never touch another company's posting.
  const result = await prisma.job.deleteMany({ where: { id: jobId, companyId: company.id } });
  if (result.count === 0) return { ok: false, message: "That posting no longer exists." };

  revalidatePath("/company");
  revalidatePath("/student");
  return { ok: true, message: "Posting removed." };
}

/* ------------------------------------------------------------------ *
 * 2. FilterJobs — a student searches by title or location
 * ------------------------------------------------------------------ */

export async function filterJobs(query?: string, location?: string, employment?: string) {
  const q = (query || "").trim();
  const loc = (location || "").trim();
  const emp = (employment || "").trim();

  const where: any = { AND: [] as any[] };
  if (q) {
    where.AND.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { company: { is: { companyName: { contains: q, mode: "insensitive" } } } },
      ],
    });
  }
  if (loc) {
    where.AND.push({ location: { contains: loc, mode: "insensitive" } });
  }
  if (emp && emp !== "Any") {
    where.AND.push({ employment: emp });
  }

  return prisma.job.findMany({
    where: where.AND.length ? where : undefined,
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      location: true,
      salary: true,
      employment: true,
      description: true,
      createdAt: true,
      company: { select: { name: true, companyName: true } },
      _count: { select: { applications: true } },
    },
  });
}

/* ------------------------------------------------------------------ *
 * 3. ApplyToJob — a student attaches their CV to a posting
 * ------------------------------------------------------------------ */

export async function applyToJob(formData: FormData): Promise<ActionResult> {
  const student = await requireUser(Role.STUDENT);

  const jobId = String(formData.get("jobId") || "");
  const cvUrl = String(formData.get("cvUrl") || "").trim();
  const note = String(formData.get("note") || "").trim();

  if (!jobId) return { ok: false, message: "Pick a role before applying." };
  if (!/^https?:\/\/\S+$/i.test(cvUrl)) {
    return { ok: false, message: "Add a public link to your CV, starting with http or https." };
  }

  const job = await prisma.job.findUnique({ where: { id: jobId }, select: { id: true, title: true } });
  if (!job) return { ok: false, message: "That role has been taken down." };

  const already = await prisma.application.findUnique({
    where: { jobId_studentId: { jobId, studentId: student.id } },
    select: { id: true },
  });
  if (already) return { ok: false, message: `You already applied to ${job.title}.` };

  await prisma.application.create({
    data: {
      jobId,
      studentId: student.id,
      cvUrl,
      note: note || null,
      status: ApplicationStatus.APPLIED,
    },
  });

  revalidatePath("/student");
  revalidatePath("/company");
  return { ok: true, message: `Applied to ${job.title}.` };
}

/* ------------------------------------------------------------------ *
 * 4. UpdateApplicationStatus — company accepts or rejects
 * ------------------------------------------------------------------ */

export async function updateApplicationStatus(formData: FormData): Promise<ActionResult> {
  const company = await requireUser(Role.COMPANY);

  const applicationId = String(formData.get("applicationId") || "");
  const raw = String(formData.get("status") || "");

  const allowed: Record<string, ApplicationStatus> = {
    INTERVIEW_CONFIRMED: ApplicationStatus.INTERVIEW_CONFIRMED,
    REJECTED: ApplicationStatus.REJECTED,
    APPLIED: ApplicationStatus.APPLIED,
    SHORTLISTED: ApplicationStatus.SHORTLISTED,
  };
  const status = allowed[raw];
  if (!status) return { ok: false, message: "Unknown status." };

  let interviewAt: Date | null = null;
  if (status === ApplicationStatus.INTERVIEW_CONFIRMED) {
    const dateStr = String(formData.get("interviewDate") || "");
    const timeStr = String(formData.get("interviewTime") || "");
    if (!dateStr || !timeStr) {
      return { ok: false, message: "Pick a date and time for the interview." };
    }
    const combined = new Date(`${dateStr}T${timeStr}`);
    if (Number.isNaN(combined.getTime())) {
      return { ok: false, message: "That date and time don't look valid." };
    }
    interviewAt = combined;
  }

  // Looked up first (rather than a blind updateMany) so we have the
  // candidate's email and the job title on hand to send the notification —
  // the nested job.companyId filter still keeps this scoped to the
  // company's own postings, so a forged applicationId matches nothing.
  const application = await prisma.application.findFirst({
    where: { id: applicationId, job: { companyId: company.id } },
    select: {
      id: true,
      job: { select: { title: true } },
      student: { select: { email: true } },
    },
  });

  if (!application) {
    return { ok: false, message: "That application is not on one of your postings." };
  }

  await prisma.application.update({
    where: { id: application.id },
    data: {
      status,
      // Clears any previously set slot the moment a candidate is un-confirmed
      // or rejected, so a stale interview time never lingers on the record.
      interviewAt: status === ApplicationStatus.INTERVIEW_CONFIRMED ? interviewAt : null,
    },
  });

  if (status === ApplicationStatus.INTERVIEW_CONFIRMED || status === ApplicationStatus.REJECTED) {
    // Fire-and-forget: email is a nice-to-have, so a slow or failed send
    // should never hold up or break the status update itself.
    void sendStatusEmail(application.student.email, application.job.title, status, interviewAt);
  }

  revalidatePath("/company");
  revalidatePath("/student");
  return {
    ok: true,
    message: status === ApplicationStatus.INTERVIEW_CONFIRMED ? "Interview confirmed." : "Candidate rejected.",
  };
}

/* ------------------------------------------------------------------ *
 * Read helpers used by the dashboards
 * ------------------------------------------------------------------ */

export async function getCompanyBoard() {
  const company = await requireUser(Role.COMPANY);

  const [jobs, applications] = await Promise.all([
    prisma.job.findMany({
      where: { companyId: company.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        location: true,
        salary: true,
        createdAt: true,
        _count: { select: { applications: true } },
      },
    }),
    prisma.application.findMany({
      where: { job: { companyId: company.id } },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        status: true,
        cvUrl: true,
        note: true,
        interviewAt: true,
        createdAt: true,
        studentId: true,
        job: { select: { id: true, title: true, location: true } },
        student: { select: { name: true, email: true, headline: true } },
      },
    }),
  ]);

  return { jobs, applications };
}

export async function getMyApplications() {
  const student = await requireUser(Role.STUDENT);

  return prisma.application.findMany({
    where: { studentId: student.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      status: true,
      cvUrl: true,
      interviewAt: true,
      createdAt: true,
      updatedAt: true,
      job: {
        select: {
          id: true,
          title: true,
          location: true,
          salary: true,
          company: { select: { name: true, companyName: true } },
        },
      },
    },
  });
}

/* ------------------------------------------------------------------ *
 * Student profile — bio, skills, and a private view counter
 * ------------------------------------------------------------------ */

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const student = await requireUser(Role.STUDENT);

  const headline = String(formData.get("headline") || "").trim();
  const bio = String(formData.get("bio") || "").trim();
  const skills = String(formData.get("skills") || "").trim();
  const experience = String(formData.get("experience") || "").trim();
  const hometown = String(formData.get("hometown") || "").trim();
  const openToWork = formData.get("openToWork") === "on";

  await prisma.user.update({
    where: { id: student.id },
    data: {
      headline: headline || null,
      bio: bio || null,
      skills: skills || null,
      experience: experience || null,
      hometown: hometown || null,
      openToWork,
    },
  });

  revalidatePath("/student/profile");
  return { ok: true, message: "Profile updated." };
}

export async function getMyProfile() {
  const user = await requireUser();

  return prisma.user.findUnique({
    where: { id: user.id },
    select: {
      name: true,
      email: true,
      headline: true,
      bio: true,
      skills: true,
      experience: true,
      hometown: true,
      openToWork: true,
      profileViews: true,
    },
  });
}

// Loads a student's profile for someone else to view (a company checking out
// a candidate) and counts the visit — but only the count is ever stored, not
// who looked, so the student can see *that* they were viewed, never *by whom*.
export async function viewStudentProfile(studentId: string) {
  const viewer = await requireUser();

  const student = await prisma.user.findFirst({
    where: { id: studentId, role: Role.STUDENT },
    select: {
      id: true,
      name: true,
      email: true,
      headline: true,
      bio: true,
      skills: true,
      experience: true,
      hometown: true,
      openToWork: true,
    },
  });

  if (!student) return null;

  if (viewer.id !== student.id) {
    await prisma.user.update({
      where: { id: student.id },
      data: { profileViews: { increment: 1 } },
    });
  }

  return student;
}

/* ------------------------------------------------------------------ *
 * Saved jobs — a student's shortlist
 * ------------------------------------------------------------------ */

export async function toggleSaveJob(formData: FormData): Promise<ActionResult> {
  const student = await requireUser(Role.STUDENT);
  const jobId = String(formData.get("jobId") || "");
  if (!jobId) return { ok: false, message: "Missing job." };

  const existing = await prisma.savedJob.findUnique({
    where: { jobId_studentId: { jobId, studentId: student.id } },
    select: { id: true },
  });

  if (existing) {
    await prisma.savedJob.delete({ where: { id: existing.id } });
    revalidatePath("/student");
    revalidatePath("/student/profile");
    return { ok: true, message: "Removed from saved jobs." };
  }

  await prisma.savedJob.create({ data: { jobId, studentId: student.id } });
  revalidatePath("/student");
  revalidatePath("/student/profile");
  return { ok: true, message: "Saved." };
}

export async function getSavedJobIds() {
  const student = await requireUser(Role.STUDENT);
  const rows = await prisma.savedJob.findMany({
    where: { studentId: student.id },
    select: { jobId: true },
  });
  return new Set(rows.map((r) => r.jobId));
}

export async function getSavedJobs() {
  const student = await requireUser(Role.STUDENT);

  return prisma.savedJob.findMany({
    where: { studentId: student.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      job: {
        select: {
          id: true,
          title: true,
          location: true,
          salary: true,
          employment: true,
          company: { select: { name: true, companyName: true } },
        },
      },
    },
  });
}

/* ------------------------------------------------------------------ *
 * Fellow applicants — visible only to students who've applied themselves
 * ------------------------------------------------------------------ */

export async function getFellowApplicants(jobId: string) {
  const student = await requireUser(Role.STUDENT);

  // Gated behind having applied yourself — nobody can browse a job's
  // applicant list without having skin in the game.
  const applied = await prisma.application.findUnique({
    where: { jobId_studentId: { jobId, studentId: student.id } },
    select: { id: true },
  });
  if (!applied) return [];

  const others = await prisma.application.findMany({
    where: { jobId, NOT: { studentId: student.id } },
    orderBy: { createdAt: "asc" },
    select: {
      student: { select: { id: true, name: true, headline: true } },
    },
  });

  // Only name and headline travel here — never email, CV link, or their
  // application status, so nobody's outcome leaks to their fellow applicants.
  return others.map((o) => o.student);
}

/* ------------------------------------------------------------------ *
 * useFormState adapters (client forms need a (prevState, formData) shape)
 * ------------------------------------------------------------------ */

export async function registerUserAction(_prev: ActionResult | null, formData: FormData) {
  return registerUser(formData);
}

export async function createJobAction(_prev: ActionResult | null, formData: FormData) {
  return createJob(formData);
}

export async function applyToJobAction(_prev: ActionResult | null, formData: FormData) {
  return applyToJob(formData);
}

export async function updateProfileAction(_prev: ActionResult | null, formData: FormData) {
  return updateProfile(formData);
}

/* ------------------------------------------------------------------ *
 * Suggested jobs — same area as the student's hometown, and at least a
 * 50% overlap between their stored skills and the job's text
 * ------------------------------------------------------------------ */

export async function getSuggestedJobs() {
  const student = await requireUser(Role.STUDENT);

  const profile = await prisma.user.findUnique({
    where: { id: student.id },
    select: { hometown: true, skills: true },
  });
  if (!profile?.hometown) return [];

  const candidates = await prisma.job.findMany({
    where: {
      location: { contains: profile.hometown, mode: "insensitive" },
      applications: { none: { studentId: student.id } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      title: true,
      location: true,
      salary: true,
      employment: true,
      company: { select: { name: true, companyName: true } },
      description: true,
    },
  });

  return candidates
    .map((job) => ({ ...job, match: skillMatchPercent(profile.skills, `${job.title} ${job.description}`) }))
    .filter((job) => job.match !== null && job.match >= 50)
    .sort((a, b) => (b.match ?? 0) - (a.match ?? 0));
}

/* ------------------------------------------------------------------ *
 * Withdraw an application — only while it's still pending, so a
 * candidate can't yank an application out from under a decision that's
 * already been made
 * ------------------------------------------------------------------ */

export async function withdrawApplication(formData: FormData): Promise<ActionResult> {
  const student = await requireUser(Role.STUDENT);
  const applicationId = String(formData.get("applicationId") || "");

  const result = await prisma.application.deleteMany({
    where: { id: applicationId, studentId: student.id, status: ApplicationStatus.APPLIED },
  });

  if (result.count === 0) {
    return { ok: false, message: "That application can no longer be withdrawn." };
  }

  revalidatePath("/student");
  revalidatePath("/company");
  return { ok: true, message: "Application withdrawn." };
}

/* ------------------------------------------------------------------ *
 * Duplicate a posting — saves retyping a near-identical role
 * ------------------------------------------------------------------ */

export async function duplicateJob(formData: FormData): Promise<ActionResult> {
  const company = await requireUser(Role.COMPANY);
  const jobId = String(formData.get("jobId") || "");

  const job = await prisma.job.findFirst({ where: { id: jobId, companyId: company.id } });
  if (!job) return { ok: false, message: "That posting no longer exists." };

  await prisma.job.create({
    data: {
      title: job.title,
      location: job.location,
      salary: job.salary,
      employment: job.employment,
      description: job.description,
      companyId: company.id,
    },
  });

  revalidatePath("/company");
  revalidatePath("/student");
  return { ok: true, message: `Duplicated ${job.title}.` };
}

/* ------------------------------------------------------------------ *
 * Connections — student-to-student, LinkedIn-style
 * ------------------------------------------------------------------ */

export async function getConnectionStatus(otherId: string) {
  const user = await requireUser();
  if (user.id === otherId) return "self" as const;

  const [sent, received] = await Promise.all([
    prisma.connection.findUnique({ where: { requesterId_receiverId: { requesterId: user.id, receiverId: otherId } } }),
    prisma.connection.findUnique({ where: { requesterId_receiverId: { requesterId: otherId, receiverId: user.id } } }),
  ]);

  if (sent?.status === "ACCEPTED" || received?.status === "ACCEPTED") return "connected" as const;
  if (sent) return "sent" as const;
  if (received) return "incoming" as const;
  return "none" as const;
}

export async function sendConnectionRequest(formData: FormData): Promise<ActionResult> {
  const user = await requireUser(Role.STUDENT);
  const targetId = String(formData.get("targetId") || "");
  if (!targetId || targetId === user.id) return { ok: false, message: "Can't connect with yourself." };

  const target = await prisma.user.findFirst({ where: { id: targetId, role: Role.STUDENT }, select: { id: true } });
  if (!target) return { ok: false, message: "That student no longer exists." };

  // If they'd already asked to connect, accept that instead of creating a
  // second, redundant request — mirrors how a mutual request resolves.
  const reverse = await prisma.connection.findUnique({
    where: { requesterId_receiverId: { requesterId: targetId, receiverId: user.id } },
  });
  if (reverse) {
    await prisma.connection.update({ where: { id: reverse.id }, data: { status: "ACCEPTED" } });
    revalidatePath(`/profile/${targetId}`);
    revalidatePath("/student/network");
    return { ok: true, message: "You're now connected." };
  }

  await prisma.connection.upsert({
    where: { requesterId_receiverId: { requesterId: user.id, receiverId: targetId } },
    update: {},
    create: { requesterId: user.id, receiverId: targetId, status: "PENDING" },
  });

  revalidatePath(`/profile/${targetId}`);
  revalidatePath("/student/network");
  return { ok: true, message: "Request sent." };
}

export async function respondToConnectionRequest(formData: FormData): Promise<ActionResult> {
  const user = await requireUser(Role.STUDENT);
  const requesterId = String(formData.get("requesterId") || "");
  const action = String(formData.get("action") || "");

  const conn = await prisma.connection.findUnique({
    where: { requesterId_receiverId: { requesterId, receiverId: user.id } },
  });
  if (!conn) return { ok: false, message: "That request no longer exists." };

  if (action === "accept") {
    await prisma.connection.update({ where: { id: conn.id }, data: { status: "ACCEPTED" } });
  } else {
    await prisma.connection.delete({ where: { id: conn.id } });
  }

  revalidatePath("/student/network");
  revalidatePath(`/profile/${requesterId}`);
  return { ok: true, message: action === "accept" ? "Connected." : "Request declined." };
}

export async function getMyNetwork() {
  const user = await requireUser(Role.STUDENT);

  const [incoming, connections] = await Promise.all([
    prisma.connection.findMany({
      where: { receiverId: user.id, status: "PENDING" },
      select: { requester: { select: { id: true, name: true, headline: true } } },
    }),
    prisma.connection.findMany({
      where: { status: "ACCEPTED", OR: [{ requesterId: user.id }, { receiverId: user.id }] },
      select: {
        requesterId: true,
        requester: { select: { id: true, name: true, headline: true } },
        receiver: { select: { id: true, name: true, headline: true } },
      },
    }),
  ]);

  return {
    incoming: incoming.map((i) => i.requester),
    connections: connections.map((c) => (c.requesterId === user.id ? c.receiver : c.requester)),
  };
}

export async function getConnectionCount(userId: string) {
  return prisma.connection.count({
    where: { status: "ACCEPTED", OR: [{ requesterId: userId }, { receiverId: userId }] },
  });
}


/* ------------------------------------------------------------------ *
 * Feed — posts, articles, likes and comments
 * ------------------------------------------------------------------ */

export async function createPost(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const title = String(formData.get("title") || "").trim().slice(0, 150);
  const content = String(formData.get("content") || "").trim();

  if (!content) return { ok: false, message: "Write something first." };
  if (content.length > 5000) return { ok: false, message: "Posts are limited to 5,000 characters." };

  await prisma.post.create({ data: { title: title || null, content, authorId: user.id } });
  revalidatePath("/feed");
  return { ok: true, message: title ? "Article published." : "Posted." };
}

export async function toggleLike(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const postId = String(formData.get("postId") || "");
  if (!postId) return { ok: false, message: "Missing post." };

  const existing = await prisma.postLike.findUnique({
    where: { postId_userId: { postId, userId: user.id } },
    select: { id: true },
  });

  if (existing) {
    await prisma.postLike.delete({ where: { id: existing.id } });
  } else {
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } });
    if (!post) return { ok: false, message: "That post was removed." };
    await prisma.postLike.create({ data: { postId, userId: user.id } });
  }

  revalidatePath("/feed");
  return { ok: true, message: existing ? "Unliked." : "Liked." };
}

export async function addComment(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const postId = String(formData.get("postId") || "");
  const content = String(formData.get("content") || "").trim();

  if (!content) return { ok: false, message: "Write a comment first." };
  if (content.length > 500) return { ok: false, message: "Comments are limited to 500 characters." };

  const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } });
  if (!post) return { ok: false, message: "That post was removed." };

  await prisma.comment.create({ data: { postId, content, authorId: user.id } });
  revalidatePath("/feed");
  return { ok: true, message: "Comment added." };
}

export async function deletePost(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const postId = String(formData.get("postId") || "");

  // Scoped by authorId, so only the author can delete their own post.
  const result = await prisma.post.deleteMany({ where: { id: postId, authorId: user.id } });
  if (result.count === 0) return { ok: false, message: "You can only delete your own posts." };

  revalidatePath("/feed");
  return { ok: true, message: "Post deleted." };
}

export async function getFeed() {
  const user = await requireUser();

  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      title: true,
      content: true,
      createdAt: true,
      authorId: true,
      author: { select: { id: true, name: true, role: true, companyName: true, headline: true } },
      likes: { where: { userId: user.id }, select: { id: true } },
      _count: { select: { likes: true, comments: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        take: 5,
        select: {
          id: true,
          content: true,
          author: { select: { id: true, name: true, role: true, companyName: true } },
        },
      },
    },
  });

  return { userId: user.id, role: user.role, posts };
}
