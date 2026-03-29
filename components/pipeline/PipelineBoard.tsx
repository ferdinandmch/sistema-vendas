"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { BoardSkeleton } from "@/components/pipeline/BoardSkeleton";
import { PipelineColumn } from "@/components/pipeline/PipelineColumn";
import { fetchDeals, fetchStages } from "@/lib/pipeline/api";
import { groupDealsByStage } from "@/lib/pipeline/group-deals";
import { dealKeys, stageKeys } from "@/lib/query-keys";

export function PipelineBoard() {
  const stagesQuery = useQuery({
    queryKey: stageKeys.list(),
    queryFn: fetchStages,
  });

  const dealsQuery = useQuery({
    queryKey: dealKeys.list(),
    queryFn: fetchDeals,
  });

  const dealsByStage = useMemo(
    () => groupDealsByStage(dealsQuery.data ?? []),
    [dealsQuery.data],
  );

  const isLoading = stagesQuery.isLoading || dealsQuery.isLoading;

  if (isLoading) {
    return <BoardSkeleton />;
  }

  if (stagesQuery.isError) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-center">
        <p className="text-sm font-medium text-destructive">
          Não foi possível carregar o pipeline. Tente novamente.
        </p>
      </div>
    );
  }

  const stages = stagesQuery.data ?? [];

  if (stages.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-sm font-medium">Nenhum stage cadastrado</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Crie stages via API antes de usar o pipeline visual.
        </p>
      </div>
    );
  }

  const sortedStages = [...stages].sort((a, b) => a.position - b.position);

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {sortedStages.map((stage) => (
        <PipelineColumn
          key={stage.id}
          stage={stage}
          deals={dealsByStage[stage.id] ?? []}
          dealsError={dealsQuery.isError}
        />
      ))}
    </div>
  );
}
