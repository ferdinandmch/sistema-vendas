"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { settingsStageKeys, stageKeys } from "@/lib/query-keys";
import { deleteSettingsStage } from "@/lib/settings/api";

type Props = {
  stageId: string;
  onSuccess: () => void;
};

export function StageDeleteButton({ stageId, onSuccess }: Props) {
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => deleteSettingsStage(stageId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: settingsStageKeys.list() });
      void queryClient.invalidateQueries({ queryKey: stageKeys.list() });
      onSuccess();
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="destructive"
        size="sm"
        disabled={mutation.isPending}
        onClick={() => {
          setError(null);
          mutation.mutate();
        }}
      >
        {mutation.isPending ? "Excluindo..." : "Excluir"}
      </Button>
      {error && (
        <p className="text-xs text-destructive max-w-[200px] text-right">{error}</p>
      )}
    </div>
  );
}
