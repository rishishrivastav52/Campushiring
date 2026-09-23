import Link from "next/link";
import { UserRound } from "lucide-react";
import { SignOutButton } from "./SignOutButton";

type Props = { who: string; context: string; profileHref?: string };

export function TopBar({ who, context, profileHref }: Props) {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-ink/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3.5">
        <Link href="/" className="font-display text-[17px] font-semibold tracking-tight">
          CampusHiring
        </Link>
        <div className="flex items-center gap-3">
          {profileHref && (
            <Link
              href={profileHref}
              className="inline-flex items-center gap-1.5 rounded-md border border-signal/40 bg-signal/10 px-3 py-1.5 text-[13px] font-medium text-signal hover:bg-signal/20"
            >
              <UserRound className="h-3.5 w-3.5" aria-hidden />
              Your profile
            </Link>
          )}
          <div className="hidden items-center divide-x divide-line text-[13px] text-mist sm:flex">
            <span className="pr-3 text-paper">{who}</span>
            <span className="pl-3">{context}</span>
          </div>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
