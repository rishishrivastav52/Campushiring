import Link from "next/link";
import { getServerSession } from "next-auth";
import { Eye } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { getMyApplications, getMyProfile, getSavedJobs } from "@/app/actions";
import { ApplyForm } from "@/components/ApplyForm";
import { SaveJobButton } from "@/components/SaveJobButton";
import { ProfileForm } from "@/components/ProfileForm";
import { TopBar } from "@/components/TopBar";

export const dynamic = "force-dynamic";

export default async function StudentProfilePage() {
  const session = await getServerSession(authOptions);
  const [profile, saved, applications] = await Promise.all([getMyProfile(), getSavedJobs(), getMyApplications()]);
  const appliedJobIds = new Set(applications.map((a) => a.job.id));

  const strengthFields = [
    { label: "headline", done: !!profile?.headline },
    { label: "skills", done: !!profile?.skills },
    { label: "about you", done: !!profile?.bio },
    { label: "past experience", done: !!profile?.experience },
    { label: "hometown", done: !!profile?.hometown },
  ];
  const strengthPct = strengthFields.filter((f) => f.done).length * 20;
  const missing = strengthFields.filter((f) => !f.done).map((f) => f.label);

  return (
    <>
      <TopBar who={session?.user?.name ?? "Student"} context="Your profile" networkHref="/student/network" feedHref="/feed" />

      <main className="mx-auto max-w-3xl space-y-10 px-5 py-8">
        <div>
          <Link
            href="/student"
            className="inline-flex items-center gap-1 rounded-md border border-signal/40 bg-signal/10 px-3 py-1.5 text-[13px] font-medium text-signal hover:bg-signal/20"
          >
            ← Back to job hub
          </Link>
          <h1 className="mt-2 font-display text-[22px] font-semibold tracking-tight">Your profile</h1>
          <p className="mt-1 text-[14px] text-mist">
            This is what a company sees when they open your name from an application.
          </p>
        </div>

        <div className="panel flex items-center gap-3 p-5">
          <Eye className="h-4 w-4 text-signal" aria-hidden />
          <p className="text-[14px]">
            <span className="font-semibold">{profile?.profileViews ?? 0}</span>{" "}
            <span className="text-mist">{profile?.profileViews === 1 ? "company has" : "companies have"} viewed your profile.</span>
          </p>
        </div>

        <div className="panel p-5">
          <div className="flex items-baseline justify-between">
            <p className="text-[14px] font-medium">Profile strength</p>
            <p className="font-display text-[15px] font-semibold text-signal">{strengthPct}%</p>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
            <div className="animate-grow h-full rounded-full bg-signal" style={{ width: `${strengthPct}%` }} />
          </div>
          <p className="mt-2 text-[13px] text-mist">
            {missing.length === 0 ? "All set — your profile is complete." : `Add ${missing.join(", ")} to strengthen it.`}
          </p>
        </div>

        <section className="panel p-5">
          <ProfileForm
            headline={profile?.headline ?? null}
            bio={profile?.bio ?? null}
            skills={profile?.skills ?? null}
            experience={profile?.experience ?? null}
            hometown={profile?.hometown ?? null}
            openToWork={profile?.openToWork ?? false}
          />
        </section>

        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-display text-[17px] font-semibold">Saved jobs</h2>
            <p className="text-[13px] text-mist">{saved.length} saved</p>
          </div>

          {saved.length === 0 ? (
            <p className="panel p-5 text-[14px] text-mist">
              Bookmark a role from the job hub and it shows up here.
            </p>
          ) : (
            <ul className="divide-y divide-line border-y border-line">
              {saved.map(({ id, job }) => (
                <li key={id} className="py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[15px] font-medium">{job.title}</p>
                      <p className="mt-0.5 text-[13px] text-mist">
                        {job.company.companyName || job.company.name} — {job.location} — {job.salary}
                      </p>
                    </div>
                    <SaveJobButton jobId={job.id} saved />
                  </div>
                  <div className="mt-3">
                    <ApplyForm jobId={job.id} alreadyApplied={appliedJobIds.has(job.id)} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
