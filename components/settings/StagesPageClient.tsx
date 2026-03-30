"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { settingsStageKeys, stageKeys } from "@/lib/query-keys";
import { fetchSettingsStages, reorderSettingsStages } from "@/lib/settings/api";
import type { Stage } from "@/lib/pipeline/api";
import { StageFormDialog } from "./StageFormDialog";
import { StageList } from "./StageList";

export function StagesPageClient() {
  const [editingStage, setEditingStage] = useState<Stage | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: stages, isLoading, isError } = useQuery({
    queryKey: settingsStageKeys.list(),
    queryFn: fetchSettingsStages,
  });

  function invalidateStages() {
    void queryClient.invalidateQueries({ queryKey: settingsStageKeys.list() });
    void queryClient.invalidateQueries({ queryKey: stageKeys.list() });
  }

  function handleEdit(stage: Stage) {
    setEditingStage(stage);
    setEditDialogOpen(true);
  }

  function handleEditDialogChange(open: boolean) {
    setEditDialogOpen(open);
    if (!open) setEditingStage(null);
  }

  const reorderMutation = useMutation({
    mutationFn: (reorderedStages: Stage[]) =>
      reorderSettingsStages(reorderedStages.map((s) => ({ id: s.id, position: s.position }))),
    onMutate: async (reorderedStages: Stage[]) => {
      await queryClient.cancelQueries({ queryKey: settingsStageKeys.list() });
      const previous = queryClient.getQueryData<Stage[]>(settingsStageKeys.list());
      queryClient.setQueryData(settingsStageKeys.list(), reorderedStages);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(settingsStageKeys.list(), context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: settingsStageKeys.list() });
      void queryClient.invalidateQueries({ queryKey: stageKeys.list() });
    },
  });

  return (
    <div className="space-y-6">
      <Link
        href="/pipeline"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Pipeline
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Stages</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure os stages do seu pipeline de vendas.
          </p>
        </div>
        <StageFormDialog
          currentCount={stages?.length ?? 0}
          onSuccess={invalidateStages}
          trigger={<Button size="sm">Novo stage</Button>}
        />
      </div>

      {isLoading && (
        <div className="divide-y divide-border rounded-md border">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <Skeleton className="size-4 shrink-0" />
              <Skeleton className="h-5 w-8 shrink-0" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>
            Erro ao carregar stages. Tente recarregar a página.
          </AlertDescription>
        </Alert>
      )}

      {stages && (
        <StageList
          stages={stages}
          onEdit={handleEdit}
          onDelete={invalidateStages}
          onReorder={(reordered) => reorderMutation.mutate(reordered)}
        />
      )}

      {editingStage && (
        <StageFormDialog
          key={editingStage.id}
          stage={editingStage}
          open={editDialogOpen}
          onOpenChange={handleEditDialogChange}
          onSuccess={() => {
            handleEditDialogChange(false);
            invalidateStages();
          }}
        />
      )}
    </div>
  );
}
