"use client";

import { useFormStatus } from "react-dom";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { toggleSaveJob } from "@/app/actions";
import { cn } from "@/lib/utils";

function Toggle({ saved }: { saved: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-pressed={saved}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[13px] font-medium transition-colors",
        saved ? "border-signal/50 bg-signal/10 text-signal" : "border-line text-mist hover:text-paper",
      )}
    >
      {saved ? <BookmarkCheck className="h-3.5 w-3.5" aria-hidden /> : <Bookmark className="h-3.5 w-3.5" aria-hidden />}
      {saved ? "Saved" : "Save"}
    </button>
  );
}

export function SaveJobButton({ jobId, saved }: { jobId: string; saved: boolean }) {
  return (
    <form action={toggleSaveJob}>
      <input type="hidden" name="jobId" value={jobId} />
      <Toggle saved={saved} />
    </form>
  );
}
