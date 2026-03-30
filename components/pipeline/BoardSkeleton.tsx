import { Skeleton } from "@/components/ui/skeleton";

export function BoardSkeleton() {
  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex w-72 shrink-0 flex-col rounded-lg bg-muted/50 p-3"
        >
          {/* Column header skeleton */}
          <div className="mb-3 flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-6 rounded-full" />
          </div>

          {/* Card skeletons */}
          <div className="space-y-2">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
