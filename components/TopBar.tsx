import Link from "next/link";
import { SignOutButton } from "./SignOutButton";

export function TopBar({ who, context }: { who: string; context: string }) {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-ink/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3.5">
        <Link href="/" className="font-display text-[17px] font-semibold tracking-tight">
          CampusHiring
        </Link>
        <div className="flex items-center gap-4">
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
