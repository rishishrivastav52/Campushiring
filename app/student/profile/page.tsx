import Link from "next/link";
import { getServerSession } from "next-auth";
import { Eye } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { getMyProfile, getSavedJobs } from "@/app/actions";
import { ProfileForm } from "@/components/ProfileForm";
import { TopBar } from "@/components/TopBar";

export const dynamic = "force-dynamic";

export default async function StudentProfilePage() {
  const session = await getServerSession(authOptions);
  const [profile, saved] = await Promise.all([getMyProfile(), getSavedJobs()]);

  return (
    <>
      <TopBar who={session?.user?.name ?? "Student"} context="Your profile" />

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

        <section className="panel p-5">
          <ProfileForm
            headline={profile?.headline ?? null}
            bio={profile?.bio ?? null}
            skills={profile?.skills ?? null}
            experience={profile?.experience ?? null}
            hometown={profile?.hometown ?? null}
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
                <li key={id} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                  <div>
                    <p className="text-[15px] font-medium">{job.title}</p>
                    <p className="mt-0.5 text-[13px] text-mist">
                      {job.company.companyName || job.company.name} — {job.location} — {job.salary}
                    </p>
                  </div>
                  <Link href="/student" className="btn-ghost">
                    View in job hub
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
