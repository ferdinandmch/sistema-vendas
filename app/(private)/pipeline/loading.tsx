import { BoardSkeleton } from "@/components/pipeline/BoardSkeleton";

export default function PipelineLoading() {
  return (
    <section>
      <div className="mb-6 h-7 w-28 animate-pulse rounded bg-muted" />
      <BoardSkeleton />
    </section>
  );
}
