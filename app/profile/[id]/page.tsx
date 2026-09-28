import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getConnectionCount, getConnectionStatus, viewStudentProfile } from "@/app/actions";
import { Avatar } from "@/components/Avatar";
import { ConnectButton } from "@/components/ConnectButton";
import { TopBar } from "@/components/TopBar";

export const dynamic = "force-dynamic";

export default async function CandidateProfilePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const student = await viewStudentProfile(params.id);

  if (!student) notFound();

  const viewerRole = (session?.user as any)?.role;
  const backHref = viewerRole === "COMPANY" ? "/company" : "/student";
  const backLabel = viewerRole === "COMPANY" ? "Back to dashboard" : "Back to job hub";

  const [connectionCount, connectionStatus] = await Promise.all([
    getConnectionCount(student.id),
    viewerRole === "STUDENT" ? getConnectionStatus(student.id) : Promise.resolve(null),
  ]);

  const skills = (student.skills ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <>
      <TopBar who={session?.user?.name ?? ""} context="Candidate profile" />

      <main className="mx-auto max-w-2xl px-5 py-8">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 rounded-md border border-signal/40 bg-signal/10 px-3 py-1.5 text-[13px] font-medium text-signal hover:bg-signal/20"
        >
          ← {backLabel}
        </Link>

        <div className="panel mt-4 p-6">
          <div className="flex items-start gap-4">
            <Avatar name={student.name} size={56} />
            <div className="flex-1">
              <h1 className="font-display text-[22px] font-semibold tracking-tight">{student.name}</h1>
              {student.headline && <p className="mt-1 text-[14px] text-mist">{student.headline}</p>}
              <p className="mt-1 text-[13px] text-mist">{student.email}</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 text-[13px] text-mist">
                {student.hometown && <span>From {student.hometown}</span>}
                <span>
                  {connectionCount} connection{connectionCount === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          </div>

          {connectionStatus && (
            <div className="mt-4">
              <ConnectButton targetId={student.id} status={connectionStatus as any} />
            </div>
          )}

          {skills.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span key={skill} className="rounded-full border border-line px-2.5 py-1 text-[12px] text-paper/80">
                  {skill}
                </span>
              ))}
            </div>
          )}

          {student.bio && <p className="mt-5 max-w-[60ch] text-[14px] leading-relaxed text-paper/80">{student.bio}</p>}

          {student.experience && (
            <div className="mt-5">
              <p className="text-[13px] font-medium text-mist">Before this</p>
              <p className="mt-1 max-w-[60ch] text-[14px] leading-relaxed text-paper/80">{student.experience}</p>
            </div>
          )}

          {!student.headline && !student.bio && !student.experience && skills.length === 0 && (
            <p className="mt-5 text-[14px] text-mist">This candidate hasn't filled in their profile yet.</p>
          )}
        </div>
      </main>
    </>
  );
}
