"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronUp } from "lucide-react";
import { type ReactNode, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Textarea } from "@/components/ui/textarea";
import { createDeal, type Stage } from "@/lib/pipeline/api";
import { dealKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";

interface DealFormDialogProps {
  stages: Stage[];
  onSuccess: () => void;
  trigger: ReactNode;
}

const emptyForm = {
  companyName: "",
  stageId: "",
  contactName: "",
  contactDetails: "",
  source: "",
  experiment: "",
  notes: "",
  icp: false,
  nextAction: "",
};

export function DealFormDialog({ stages, onSuccess, trigger }: DealFormDialogProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      createDeal({
        companyName: form.companyName,
        stageId: form.stageId,
        contactName: form.contactName || undefined,
        contactDetails: form.contactDetails || undefined,
        source: form.source || undefined,
        experiment: form.experiment || undefined,
        notes: form.notes || undefined,
        icp: form.icp,
        nextAction: form.nextAction || undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dealKeys.list() });
      onSuccess();
      setOpen(false);
      setForm(emptyForm);
      setExpanded(false);
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.companyName.trim()) {
      setError("Nome da empresa é obrigatório.");
      return;
    }
    if (!form.stageId) {
      setError("Selecione um stage.");
      return;
    }
    mutation.mutate();
  }

  function handleOpenChange(value: boolean) {
    setOpen(value);
    if (!value) {
      setForm(emptyForm);
      setExpanded(false);
      setError(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo deal</DialogTitle>
          <DialogDescription>
            Adicione uma nova empresa ao pipeline.
          </DialogDescription>
        </DialogHeader>

        {stages.length === 0 ? (
          <Alert>
            <AlertDescription>
              Nenhum stage cadastrado.{" "}
              <a href="/settings/stages" className="underline">
                Crie stages em /settings/stages
              </a>{" "}
              antes de adicionar deals.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="companyName">Empresa *</Label>
              <Input
                id="companyName"
                value={form.companyName}
                onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                placeholder="Nome da empresa"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="stageId">Stage *</Label>
              <Select
                value={form.stageId}
                onValueChange={(value) => setForm((f) => ({ ...f, stageId: value }))}
              >
                <SelectTrigger id="stageId">
                  <SelectValue placeholder="Selecione um stage" />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? (
                <>
                  <ChevronUp className="mr-2 h-4 w-4" />
                  Menos informações
                </>
              ) : (
                <>
                  <ChevronDown className="mr-2 h-4 w-4" />
                  Mais informações
                </>
              )}
            </Button>

            <div className={cn("space-y-4", !expanded && "hidden")}>
              <div className="space-y-1.5">
                <Label htmlFor="contactName">Contato</Label>
                <Input
                  id="contactName"
                  value={form.contactName}
                  onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
                  placeholder="Nome do contato"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contactDetails">Detalhes do contato</Label>
                <Input
                  id="contactDetails"
                  value={form.contactDetails}
                  onChange={(e) => setForm((f) => ({ ...f, contactDetails: e.target.value }))}
                  placeholder="E-mail, telefone..."
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="source">Fonte</Label>
                <Input
                  id="source"
                  value={form.source}
                  onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
                  placeholder="LinkedIn, indicação..."
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="experiment">Experimento</Label>
                <Input
                  id="experiment"
                  value={form.experiment}
                  onChange={(e) => setForm((f) => ({ ...f, experiment: e.target.value }))}
                  placeholder="Campanha, teste A/B..."
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Observações sobre o deal..."
                  className="min-h-[80px]"
                />
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  id="icp"
                  checked={form.icp}
                  onCheckedChange={(checked) => setForm((f) => ({ ...f, icp: checked }))}
                />
                <Label htmlFor="icp">ICP (Ideal Customer Profile)</Label>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="nextAction">Próxima ação</Label>
                <Input
                  id="nextAction"
                  value={form.nextAction}
                  onChange={(e) => setForm((f) => ({ ...f, nextAction: e.target.value }))}
                  placeholder="O que fazer a seguir..."
                />
              </div>
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
        )}

        {stages.length === 0 && (
          <DialogFooter>
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Fechar
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
