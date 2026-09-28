import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-slate1", className)} />;
}

// Shown instantly while a page's data loads, so navigation never looks frozen.
export function PageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="border-b border-line px-5 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-40" />
        </div>
      </div>
      <div className="mx-auto max-w-5xl space-y-8 px-5 py-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-28" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
