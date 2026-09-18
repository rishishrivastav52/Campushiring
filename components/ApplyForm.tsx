"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Send } from "lucide-react";
import { applyToJobAction } from "@/app/actions";
import { cn } from "@/lib/utils";

function Submit({ done }: { done: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending || done} className="btn-primary shrink-0">
      <Send className="h-3.5 w-3.5" aria-hidden />
      {done ? "Applied" : pending ? "Sending…" : "Apply"}
    </button>
  );
}

export function ApplyForm({ jobId, alreadyApplied }: { jobId: string; alreadyApplied: boolean }) {
  const [state, formAction] = useFormState(applyToJobAction, null);
  const done = alreadyApplied || Boolean(state?.ok);

  if (done) {
    return <p className="text-[13px] text-go">Applied. Track the reply in your applications table below.</p>;
  }

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="jobId" value={jobId} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          name="cvUrl"
          type="url"
          required
          className="field sm:max-w-sm"
          placeholder="https://drive.google.com/your-cv"
          aria-label="Link to your CV"
        />
        <input name="note" className="field" placeholder="One line on why you fit (optional)" aria-label="Short note" />
        <Submit done={done} />
      </div>
      {state && !state.ok && <p className={cn("text-[13px] text-stop")}>{state.message}</p>}
    </form>
  );
}
