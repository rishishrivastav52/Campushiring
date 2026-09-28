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
    <main className="relative mx-auto grid max-w-5xl gap-12 px-5 py-14 md:grid-cols-[1.1fr_0.9fr] md:py-24">
      <div
        aria-hidden
        className="animate-float pointer-events-none absolute -top-8 right-0 -z-10 h-72 w-72 rounded-full bg-signal/10 blur-3xl"
      />
      <div className="max-w-[34rem]">
        <p className="animate-fade-up font-display text-[13px] font-medium text-signal">CampusHiring</p>
        <h1 className="animate-fade-up mt-3 font-display text-[40px] font-semibold leading-[1.08] tracking-tight md:text-[52px]">
          Every application, and every answer, on one screen.
        </h1>
        <p className="animate-fade-up mt-5 text-[16px] leading-relaxed text-mist" style={{ animationDelay: "100ms" }}>
          Companies publish a role in under a minute. Students apply with a CV link and watch the status change from
          received, to interview confirmed, to closed. Nobody has to send a follow-up email asking what happened.
        </p>

        <ul className="mt-10 divide-y divide-line border-y border-line">
          {[
            { Icon: Briefcase, title: "Post a role with pay in the open", body: "Title, location and salary are required, not optional." },
            { Icon: Search, title: "Search by role or city", body: "Students filter the board instead of scrolling it." },
            { Icon: ListChecks, title: "One click moves a candidate", body: "Accept or reject, and the student sees it immediately." },
          ].map(({ Icon, title, body }, i) => (
            <li key={title} className="animate-fade-up flex gap-4 py-4" style={{ animationDelay: `${200 + i * 90}ms` }}>
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-signal" aria-hidden />
              <div>
                <p className="text-[15px] font-medium">{title}</p>
                <p className="mt-0.5 text-[14px] text-mist">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="animate-fade-up md:pt-6" style={{ animationDelay: "150ms" }}>
        <AuthPanel />
      </div>
    </main>
  );
}
