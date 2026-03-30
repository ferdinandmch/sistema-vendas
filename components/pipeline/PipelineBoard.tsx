"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  type DragEndEvent,
  type DragStartEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { BoardSkeleton } from "@/components/pipeline/BoardSkeleton";
import { DealCard } from "@/components/pipeline/DealCard";
import { PipelineColumn } from "@/components/pipeline/PipelineColumn";
import { fetchDeals, fetchStages, moveDeal, type Deal } from "@/lib/pipeline/api";
import { groupDealsByStage } from "@/lib/pipeline/group-deals";
import { dealKeys, stageKeys } from "@/lib/query-keys";

export function PipelineBoard() {
  const queryClient = useQueryClient();
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const [pendingDealId, setPendingDealId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor),
  );

  const stagesQuery = useQuery({
    queryKey: stageKeys.list(),
    queryFn: fetchStages,
  });

  const dealsQuery = useQuery({
    queryKey: dealKeys.list(),
    queryFn: fetchDeals,
  });

  const mutation = useMutation({
    mutationFn: ({ dealId, toStageId }: { dealId: string; toStageId: string }) =>
      moveDeal(dealId, toStageId),
    onMutate: async ({ dealId, toStageId }) => {
      await queryClient.cancelQueries({ queryKey: dealKeys.list() });
      const previousDeals = queryClient.getQueryData<Deal[]>(dealKeys.list());
      queryClient.setQueryData<Deal[]>(dealKeys.list(), (old) =>
        (old ?? []).map((d) =>
          d.id === dealId ? { ...d, stageId: toStageId } : d,
        ),
      );
      setPendingDealId(dealId);
      return { previousDeals };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(dealKeys.list(), context?.previousDeals);
      toast.error("Não foi possível mover o deal. Tente novamente.");
    },
    onSettled: () => {
      setPendingDealId(null);
      void queryClient.invalidateQueries({ queryKey: dealKeys.list() });
    },
  });

  const dealsByStage = useMemo(
    () => groupDealsByStage(dealsQuery.data ?? []),
    [dealsQuery.data],
  );

  const isLoading = stagesQuery.isLoading || dealsQuery.isLoading;

  function handleDragStart(event: DragStartEvent) {
    const deal = dealsQuery.data?.find((d) => d.id === event.active.id) ?? null;
    setActiveDeal(deal);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveDeal(null);

    if (!over || over.id === active.data.current?.stageId) {
      return;
    }

    mutation.mutate({
      dealId: String(active.id),
      toStageId: String(over.id),
    });
  }

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
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-4">
        {sortedStages.map((stage) => (
          <PipelineColumn
            key={stage.id}
            stage={stage}
            deals={dealsByStage[stage.id] ?? []}
            dealsError={dealsQuery.isError}
            pendingDealId={pendingDealId}
          />
        ))}
      </div>
      <DragOverlay>
        {activeDeal ? <DealCard deal={activeDeal} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
