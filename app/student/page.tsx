import { getServerSession } from "next-auth";
import { ExternalLink, Search } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { filterJobs, getMyApplications } from "@/app/actions";
import { ApplyForm } from "@/components/ApplyForm";
import { StatusPill } from "@/components/StatusPill";
import { TopBar } from "@/components/TopBar";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { searchParams: { q?: string; location?: string } };

export default async function StudentHub({ searchParams }: Props) {
  const session = await getServerSession(authOptions);
  const q = searchParams?.q ?? "";
  const location = searchParams?.location ?? "";

  const [jobs, applications] = await Promise.all([filterJobs(q, location), getMyApplications()]);
  const appliedJobIds = new Set(applications.map((a) => a.job.id));

  return (
    <>
      <TopBar who={session?.user?.name ?? "Student"} context="Job hub" />

      <main className="mx-auto max-w-5xl space-y-10 px-5 py-8">
        {/* Search is the primary job of this screen, so it leads. */}
        <form method="GET" className="panel p-5">
          <h1 className="font-display text-[22px] font-semibold tracking-tight">Find your next role</h1>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mist" aria-hidden />
              <input
                name="q"
                defaultValue={q}
                className="field pl-9"
                placeholder="Role, skill or company"
                aria-label="Search roles"
              />
            </div>
            <input
              name="location"
              defaultValue={location}
              className="field sm:max-w-[13rem]"
              placeholder="Location"
              aria-label="Filter by location"
            />
            <button type="submit" className="btn-primary shrink-0">
              Search
            </button>
          </div>
          {(q || location) && (
            <p className="mt-3 text-[13px] text-mist">
              {jobs.length} {jobs.length === 1 ? "role" : "roles"} matched. <a href="/student" className="text-signal hover:underline">Clear filters</a>
            </p>
          )}
        </form>

        <section>
          <h2 className="mb-3 font-display text-[17px] font-semibold">Open roles</h2>

          {jobs.length === 0 ? (
            <p className="panel p-5 text-[14px] text-mist">
              Nothing matched that search. Try a broader title, or clear the location field.
            </p>
          ) : (
            <ul className="divide-y divide-line border-y border-line">
              {jobs.map((job) => (
                <li key={job.id} className="py-5">
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <h3 className="text-[16px] font-medium">{job.title}</h3>
                    <p className="text-[13px] text-mist">{job.company.companyName || job.company.name}</p>
                    <p className="ml-auto text-[13px] text-mist">Posted {formatDate(job.createdAt)}</p>
                  </div>

                  <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-[13px]">
                    <div className="flex gap-1.5">
                      <dt className="text-mist">Location</dt>
                      <dd>{job.location}</dd>
                    </div>
                    <div className="flex gap-1.5">
                      <dt className="text-mist">Salary</dt>
                      <dd className="text-signal">{job.salary}</dd>
                    </div>
                    <div className="flex gap-1.5">
                      <dt className="text-mist">Type</dt>
                      <dd>{job.employment}</dd>
                    </div>
                    <div className="flex gap-1.5">
                      <dt className="text-mist">Applicants</dt>
                      <dd>{job._count.applications}</dd>
                    </div>
                  </dl>

                  <p className="mt-2 max-w-[62ch] text-[14px] leading-relaxed text-paper/80">{job.description}</p>

                  <div className="mt-4">
                    <ApplyForm jobId={job.id} alreadyApplied={appliedJobIds.has(job.id)} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-display text-[17px] font-semibold">Your applications</h2>
            <p className="text-[13px] text-mist">{applications.length} sent</p>
          </div>

          {applications.length === 0 ? (
            <p className="panel p-5 text-[14px] text-mist">
              Apply to a role above and its status appears here the moment the company responds.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem] border-collapse text-left">
                <thead>
                  <tr className="border-b border-line text-[13px] text-mist">
                    <th className="py-2.5 pr-4 font-medium">Role</th>
                    <th className="py-2.5 pr-4 font-medium">Company</th>
                    <th className="py-2.5 pr-4 font-medium">Salary</th>
                    <th className="py-2.5 pr-4 font-medium">Status</th>
                    <th className="py-2.5 pr-4 font-medium">Updated</th>
                    <th className="py-2.5 font-medium">CV</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {applications.map((app) => (
                    <tr key={app.id} className="text-[14px]">
                      <td className="py-3 pr-4 font-medium">{app.job.title}</td>
                      <td className="py-3 pr-4 text-mist">{app.job.company.companyName || app.job.company.name}</td>
                      <td className="py-3 pr-4 text-mist">{app.job.salary}</td>
                      <td className="py-3 pr-4">
                        <StatusPill status={app.status} />
                      </td>
                      <td className="py-3 pr-4 text-mist">{formatDate(app.updatedAt)}</td>
                      <td className="py-3">
                        <a
                          href={app.cvUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-signal hover:underline"
                        >
                          Open
                          <ExternalLink className="h-3 w-3" aria-hidden />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
