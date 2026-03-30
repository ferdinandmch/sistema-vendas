"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { settingsStageKeys, stageKeys } from "@/lib/query-keys";
import { createSettingsStage, updateSettingsStage } from "@/lib/settings/api";
import type { Stage } from "@/lib/pipeline/api";

type Props = {
  stage?: Stage;
  onSuccess: () => void;
  trigger?: React.ReactNode;
  currentCount?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function StageFormDialog({
  stage,
  onSuccess,
  trigger,
  currentCount,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const [name, setName] = useState(stage?.name ?? "");
  const [isFinal, setIsFinal] = useState(stage?.isFinal ?? false);
  const [finalType, setFinalType] = useState<"won" | "lost" | "">(
    stage?.finalType ?? "",
  );
  const [error, setError] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const isEditMode = !!stage;

  useEffect(() => {
    if (open) {
      setName(stage?.name ?? "");
      setIsFinal(stage?.isFinal ?? false);
      setFinalType(stage?.finalType ?? "");
      setError(null);
    }
  }, [open, stage]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (isEditMode) {
        return updateSettingsStage(stage.id, {
          name,
          isFinal,
          finalType: isFinal ? (finalType as "won" | "lost") : null,
        });
      } else {
        return createSettingsStage({
          name,
          position: (currentCount ?? 0) + 1,
          isFinal,
          finalType: isFinal ? (finalType as "won" | "lost") : null,
        });
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: settingsStageKeys.list() });
      void queryClient.invalidateQueries({ queryKey: stageKeys.list() });
      handleOpenChange(false);
      onSuccess();
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  function handleOpenChange(value: boolean) {
    if (isControlled) {
      controlledOnOpenChange?.(value);
    } else {
      setInternalOpen(value);
    }
    if (!value) {
      setError(null);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    mutation.mutate();
  }

  const content = (
    <DialogContent className="sm:max-w-[420px]">
      <DialogHeader>
        <DialogTitle>{isEditMode ? "Editar stage" : "Novo stage"}</DialogTitle>
        <DialogDescription>
          {isEditMode
            ? "Altere o nome ou configuração deste stage."
            : "Preencha os dados do novo stage do pipeline."}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        <div className="space-y-2">
          <Label htmlFor="stage-name">Nome</Label>
          <Input
            id="stage-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Prospecção"
            required
          />
        </div>

        <div className="flex items-center gap-3">
          <Switch
            id="is-final"
            checked={isFinal}
            onCheckedChange={(checked) => {
              setIsFinal(checked);
              if (!checked) setFinalType("");
            }}
          />
          <Label htmlFor="is-final">Stage final</Label>
        </div>

        <div className={cn("space-y-2", !isFinal && "hidden")}>
          <Label htmlFor="final-type">Tipo de encerramento</Label>
          <Select
            value={finalType}
            onValueChange={(v) => setFinalType(v as "won" | "lost")}
          >
            <SelectTrigger id="final-type">
              <SelectValue placeholder="Selecionar tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="won">Ganho (won)</SelectItem>
              <SelectItem value="lost">Perdido (lost)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );

  if (trigger) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        {content}
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {content}
    </Dialog>
  );
}
