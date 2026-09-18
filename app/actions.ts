"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { ApplicationStatus, Role } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendStatusEmail } from "@/lib/email";

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

export async function filterJobs(query?: string, location?: string) {
  const q = (query || "").trim();
  const loc = (location || "").trim();

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
  };
  const status = allowed[raw];
  if (!status) return { ok: false, message: "Unknown status." };

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

  await prisma.application.update({ where: { id: application.id }, data: { status } });

  if (status === ApplicationStatus.INTERVIEW_CONFIRMED || status === ApplicationStatus.REJECTED) {
    // Fire-and-forget: email is a nice-to-have, so a slow or failed send
    // should never hold up or break the status update itself.
    void sendStatusEmail(application.student.email, application.job.title, status);
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

  await prisma.user.update({
    where: { id: student.id },
    data: {
      headline: headline || null,
      bio: bio || null,
      skills: skills || null,
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
