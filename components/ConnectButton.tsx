"use client";

import { useFormStatus } from "react-dom";
import { Check, Clock, UserPlus } from "lucide-react";
import { respondToConnectionRequest, sendConnectionRequest } from "@/app/actions";

function SubmitBtn({ className, children }: { className: string; children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? "…" : children}
    </button>
  );
}

type Status = "self" | "none" | "sent" | "incoming" | "connected";

export function ConnectButton({ targetId, status }: { targetId: string; status: Status }) {
  if (status === "self") return null;

  if (status === "connected") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-go/40 bg-go/10 px-3 py-1.5 text-[13px] font-medium text-go">
        <Check className="h-3.5 w-3.5" aria-hidden />
        Connected
      </span>
    );
  }

  if (status === "sent") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-[13px] font-medium text-mist">
        <Clock className="h-3.5 w-3.5" aria-hidden />
        Pending
      </span>
    );
  }

  if (status === "incoming") {
    return (
      <div className="flex gap-2">
        <form action={respondToConnectionRequest}>
          <input type="hidden" name="requesterId" value={targetId} />
          <input type="hidden" name="action" value="accept" />
          <SubmitBtn className="btn-primary">Accept</SubmitBtn>
        </form>
        <form action={respondToConnectionRequest}>
          <input type="hidden" name="requesterId" value={targetId} />
          <input type="hidden" name="action" value="decline" />
          <SubmitBtn className="btn-ghost">Decline</SubmitBtn>
        </form>
      </div>
    );
  }

  return (
    <form action={sendConnectionRequest}>
      <input type="hidden" name="targetId" value={targetId} />
      <SubmitBtn className="btn-primary">
        <UserPlus className="h-3.5 w-3.5" aria-hidden />
        Connect
      </SubmitBtn>
    </form>
  );
}
