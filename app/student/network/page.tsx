import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMyNetwork } from "@/app/actions";
import { Avatar } from "@/components/Avatar";
import { ConnectButton } from "@/components/ConnectButton";
import { TopBar } from "@/components/TopBar";

export const dynamic = "force-dynamic";

export default async function NetworkPage() {
  const session = await getServerSession(authOptions);
  const { incoming, connections } = await getMyNetwork();

  return (
    <>
      <TopBar who={session?.user?.name ?? "Student"} context="My network" profileHref="/student/profile" feedHref="/feed" />

      <main className="mx-auto max-w-3xl space-y-10 px-5 py-8">
        <div>
          <Link
            href="/student"
            className="inline-flex items-center gap-1 rounded-md border border-signal/40 bg-signal/10 px-3 py-1.5 text-[13px] font-medium text-signal hover:bg-signal/20"
          >
            ← Back to job hub
          </Link>
          <h1 className="mt-4 font-display text-[22px] font-semibold tracking-tight">My network</h1>
        </div>

        {incoming.length > 0 && (
          <section>
            <h2 className="mb-3 font-display text-[17px] font-semibold">Invitations</h2>
            <ul className="divide-y divide-line border-y border-line">
              {incoming.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar name={p.name} />
                    <div>
                      <Link href={`/profile/${p.id}`} className="text-[15px] font-medium hover:text-signal hover:underline">
                        {p.name}
                      </Link>
                      {p.headline && <p className="text-[13px] text-mist">{p.headline}</p>}
                    </div>
                  </div>
                  <ConnectButton targetId={p.id} status="incoming" />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-display text-[17px] font-semibold">Connections</h2>
            <p className="text-[13px] text-mist">{connections.length}</p>
          </div>

          {connections.length === 0 ? (
            <p className="panel p-5 text-[14px] text-mist">
              No connections yet — visit a fellow applicant's profile from a job you've applied to and send a request.
            </p>
          ) : (
            <ul className="divide-y divide-line border-y border-line">
              {connections.map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-3.5">
                  <Avatar name={p.name} />
                  <div>
                    <Link href={`/profile/${p.id}`} className="text-[15px] font-medium hover:text-signal hover:underline">
                      {p.name}
                    </Link>
                    {p.headline && <p className="text-[13px] text-mist">{p.headline}</p>}
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
