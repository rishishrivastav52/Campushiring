import { BookmarkCheck, CheckCircle2, Clock, XCircle } from "lucide-react";
import { cn, statusLabel } from "@/lib/utils";

export function StatusPill({ status }: { status: string }) {
  const map = {
    APPLIED: { cls: "border-signal/40 bg-signal/10 text-signal", Icon: Clock },
    SHORTLISTED: { cls: "border-sky-400/40 bg-sky-400/10 text-sky-400", Icon: BookmarkCheck },
    INTERVIEW_CONFIRMED: { cls: "border-go/40 bg-go/10 text-go", Icon: CheckCircle2 },
    REJECTED: { cls: "border-stop/40 bg-stop/10 text-stop", Icon: XCircle },
  } as const;

  const { cls, Icon } = map[status as keyof typeof map] ?? map.APPLIED;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[12px] font-medium",
        cls,
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {statusLabel(status)}
    </span>
  );
}
