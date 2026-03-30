"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createActivity, type ActivityType } from "@/lib/pipeline/api";
import { activityKeys, dealKeys } from "@/lib/query-keys";

const ACTIVITY_LABELS: Record<ActivityType, string> = {
  note: "Nota",
  call: "Ligação",
  meeting: "Reunião",
  followup: "Follow-up",
};

interface ActivityFormProps {
  dealId: string;
}

export function ActivityForm({ dealId }: ActivityFormProps) {
  const queryClient = useQueryClient();
  const [type, setType] = useState<ActivityType>("note");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => createActivity(dealId, { type, content }),
    onSuccess: () => {
      setType("note");
      setContent("");
      setError(null);
      void queryClient.invalidateQueries({ queryKey: activityKeys.list(dealId) });
      void queryClient.invalidateQueries({ queryKey: dealKeys.detail(dealId) });
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (content.trim().length === 0) {
      setError("Descreva a atividade antes de registrar.");
      return;
    }
    mutation.mutate();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="activity-type">Tipo</Label>
        <Select value={type} onValueChange={(v) => setType(v as ActivityType)}>
          <SelectTrigger id="activity-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(ACTIVITY_LABELS) as [ActivityType, string][]).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="activity-content">Descrição</Label>
        <Textarea
          id="activity-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Descreva a atividade..."
          rows={3}
          required
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={mutation.isPending} size="sm">
        {mutation.isPending ? "Registrando..." : "Registrar"}
      </Button>
    </form>
  );
}
