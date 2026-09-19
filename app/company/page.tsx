import Link from "next/link";
import { getServerSession } from "next-auth";
import { ExternalLink, Mail, Trash2 } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { deleteJob, getCompanyBoard, updateApplicationStatus } from "@/app/actions";
import { CreateJobForm } from "@/components/CreateJobForm";
import { StatusPill } from "@/components/StatusPill";
import { TopBar } from "@/components/TopBar";
import { formatDate, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CompanyDashboard() {
  const session = await getServerSession(authOptions);
  const { jobs, applications } = await getCompanyBoard();

  const open = applications.filter((a) => a.status === "APPLIED");
  const decided = applications.filter((a) => a.status !== "APPLIED");
  const confirmed = applications.filter((a) => a.status === "INTERVIEW_CONFIRMED").length;

  const stats = [
    { label: "Live postings", value: jobs.length },
    { label: "Total applicants", value: applications.length },
    { label: "Waiting on you", value: open.length },
    { label: "Interviews confirmed", value: confirmed },
  ];

  return (
    <>
      <TopBar who={session?.user?.name ?? "Company"} context="Hiring dashboard" />

      <main className="mx-auto max-w-5xl space-y-10 px-5 py-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="panel p-4">
              <p className="font-display text-[22px] font-semibold">{s.value}</p>
              <p className="mt-0.5 text-[13px] text-mist">{s.label}</p>
            </div>
          ))}
        </div>

        <CreateJobForm />

        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-display text-[17px] font-semibold">Your postings</h2>
            <p className="text-[13px] text-mist">{jobs.length} live</p>
          </div>

          {jobs.length === 0 ? (
            <p className="panel p-5 text-[14px] text-mist">
              No roles yet. Publish one above and it appears on the student board straight away.
            </p>
          ) : (
            <ul className="divide-y divide-line border-y border-line">
              {jobs.map((job) => (
                <li key={job.id} className="flex flex-wrap items-center gap-x-6 gap-y-2 py-3.5">
                  <div className="min-w-[14rem] flex-1">
                    <p className="text-[15px] font-medium">{job.title}</p>
                    <p className="mt-0.5 text-[13px] text-mist">
                      {job.location} — {job.salary}
                    </p>
                  </div>
                  <p className="text-[13px] text-mist">{job._count.applications} applicants</p>
                  <p className="text-[13px] text-mist">Posted {formatDate(job.createdAt)}</p>
                  <form action={deleteJob}>
                    <input type="hidden" name="jobId" value={job.id} />
                    <button type="submit" className="btn-ghost hover:border-stop/60 hover:text-stop">
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      Remove
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-display text-[17px] font-semibold">Waiting on you</h2>
            <p className="text-[13px] text-mist">{open.length} to review</p>
          </div>

          {open.length === 0 ? (
            <p className="panel p-5 text-[14px] text-mist">Nothing in the queue. New applications land here.</p>
          ) : (
            <ul className="divide-y divide-line border-y border-line">
              {open.map((app) => (
                <li key={app.id} className="flex flex-wrap items-start gap-x-6 gap-y-3 py-4">
                  <div className="min-w-[15rem] flex-1">
                    <p className="text-[15px] font-medium">
                      <Link href={`/profile/${app.studentId}`} className="hover:text-signal hover:underline">
                        {app.student.name}
                      </Link>
                    </p>
                    <p className="mt-0.5 text-[13px] text-mist">
                      {app.student.email} — applied for {app.job.title}
                    </p>
                    {app.note && <p className="mt-1.5 text-[13px] text-paper/80">{app.note}</p>}
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <a
                        href={app.cvUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-signal hover:underline"
                      >
                        Open CV
                        <ExternalLink className="h-3 w-3" aria-hidden />
                      </a>
                      <a
                        href={`mailto:${app.student.email}?subject=${encodeURIComponent(`Your application for ${app.job.title}`)}`}
                        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-mist hover:text-paper"
                      >
                        <Mail className="h-3 w-3" aria-hidden />
                        Email candidate
                      </a>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:items-end">
                    <form action={updateApplicationStatus} className="flex flex-wrap items-end gap-2">
                      <input type="hidden" name="applicationId" value={app.id} />
                      <input type="hidden" name="status" value="INTERVIEW_CONFIRMED" />
                      <div>
                        <label className="label" htmlFor={`date-${app.id}`}>Date</label>
                        <input id={`date-${app.id}`} type="date" name="interviewDate" required className="field w-36" />
                      </div>
                      <div>
                        <label className="label" htmlFor={`time-${app.id}`}>Time</label>
                        <input id={`time-${app.id}`} type="time" name="interviewTime" required className="field w-28" />
                      </div>
                      <button type="submit" className="btn-ghost border-go/50 text-go hover:bg-go/10">
                        Confirm interview
                      </button>
                    </form>
                    <form action={updateApplicationStatus}>
                      <input type="hidden" name="applicationId" value={app.id} />
                      <input type="hidden" name="status" value="REJECTED" />
                      <button type="submit" className="btn-ghost border-stop/50 text-stop hover:bg-stop/10">
                        Reject
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {decided.length > 0 && (
          <section>
            <h2 className="mb-3 font-display text-[17px] font-semibold">Decided</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[34rem] border-collapse text-left">
                <thead>
                  <tr className="border-b border-line text-[13px] text-mist">
                    <th className="py-2.5 pr-4 font-medium">Candidate</th>
                    <th className="py-2.5 pr-4 font-medium">Role</th>
                    <th className="py-2.5 pr-4 font-medium">Status</th>
                    <th className="py-2.5 pr-4 font-medium">When</th>
                    <th className="py-2.5 font-medium">Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {decided.map((app) => (
                    <tr key={app.id} className="text-[14px]">
                      <td className="py-3 pr-4">
                        <Link href={`/profile/${app.studentId}`} className="font-medium hover:text-signal hover:underline">
                          {app.student.name}
                        </Link>
                        <span className="ml-2 text-[13px] text-mist">{app.student.email}</span>
                      </td>
                      <td className="py-3 pr-4 text-mist">{app.job.title}</td>
                      <td className="py-3 pr-4">
                        <StatusPill status={app.status} />
                      </td>
                      <td className="py-3 pr-4 text-mist">
                        {app.status === "INTERVIEW_CONFIRMED" && app.interviewAt ? formatDateTime(app.interviewAt) : "—"}
                      </td>
                      <td className="py-3">
                        {app.status === "REJECTED" ? (
                          <form action={updateApplicationStatus} className="flex flex-wrap items-end gap-2">
                            <input type="hidden" name="applicationId" value={app.id} />
                            <input type="hidden" name="status" value="INTERVIEW_CONFIRMED" />
                            <input type="date" name="interviewDate" required className="field w-32" aria-label="Interview date" />
                            <input type="time" name="interviewTime" required className="field w-24" aria-label="Interview time" />
                            <button type="submit" className="btn-ghost">Confirm interview</button>
                          </form>
                        ) : (
                          <form action={updateApplicationStatus}>
                            <input type="hidden" name="applicationId" value={app.id} />
                            <input type="hidden" name="status" value="REJECTED" />
                            <button type="submit" className="btn-ghost">Reject</button>
                          </form>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <p className="text-[13px] text-mist">
          Looking for roles instead?{" "}
          <Link href="/student" className="text-signal hover:underline">
            Open the student hub
          </Link>
        </p>
      </main>
    </>
  );
}
