import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Briefcase, ListChecks, Search } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { AuthPanel } from "@/components/AuthPanel";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (role === "COMPANY") redirect("/company");
  if (role === "STUDENT") redirect("/student");

  return (
    <main className="mx-auto grid max-w-5xl gap-12 px-5 py-14 md:grid-cols-[1.1fr_0.9fr] md:py-24">
      <div className="max-w-[34rem]">
        <p className="font-display text-[13px] font-medium text-signal">CampusHiring</p>
        <h1 className="mt-3 font-display text-[40px] font-semibold leading-[1.08] tracking-tight md:text-[52px]">
          Every application, and every answer, on one screen.
        </h1>
        <p className="mt-5 text-[16px] leading-relaxed text-mist">
          Companies publish a role in under a minute. Students apply with a CV link and watch the status change from
          received, to interview confirmed, to closed. Nobody has to send a follow-up email asking what happened.
        </p>

        <ul className="mt-10 divide-y divide-line border-y border-line">
          {[
            { Icon: Briefcase, title: "Post a role with pay in the open", body: "Title, location and salary are required, not optional." },
            { Icon: Search, title: "Search by role or city", body: "Students filter the board instead of scrolling it." },
            { Icon: ListChecks, title: "One click moves a candidate", body: "Accept or reject, and the student sees it immediately." },
          ].map(({ Icon, title, body }) => (
            <li key={title} className="flex gap-4 py-4">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-signal" aria-hidden />
              <div>
                <p className="text-[15px] font-medium">{title}</p>
                <p className="mt-0.5 text-[14px] text-mist">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="md:pt-6">
        <AuthPanel />
      </div>
    </main>
  );
}
