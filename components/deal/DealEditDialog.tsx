"use client";

import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { updateDeal, type Deal } from "@/lib/pipeline/api";

interface DealEditDialogProps {
  deal: Deal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DealEditDialog({ deal, open, onOpenChange, onSuccess }: DealEditDialogProps) {
  const [form, setForm] = useState({
    companyName: "",
    contactName: "",
    contactDetails: "",
    source: "",
    experiment: "",
    notes: "",
    icp: false,
    nextAction: "",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm({
        companyName: deal.companyName,
        contactName: deal.contactName ?? "",
        contactDetails: deal.contactDetails ?? "",
        source: deal.source ?? "",
        experiment: deal.experiment ?? "",
        notes: deal.notes ?? "",
        icp: deal.icp ?? false,
        nextAction: deal.nextAction ?? "",
      });
      setError(null);
    }
  }, [open, deal]);

  const mutation = useMutation({
    mutationFn: () =>
      updateDeal(deal.id, {
        companyName: form.companyName,
        contactName: form.contactName || null,
        contactDetails: form.contactDetails || null,
        source: form.source || null,
        experiment: form.experiment || null,
        notes: form.notes || null,
        icp: form.icp,
        nextAction: form.nextAction || null,
      }),
    onSuccess: () => {
      onSuccess();
      onOpenChange(false);
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
    mutation.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar deal</DialogTitle>
          <DialogDescription>
            Atualize as informações desta empresa.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-companyName">Empresa *</Label>
            <Input
              id="edit-companyName"
              value={form.companyName}
              onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
              placeholder="Nome da empresa"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-contactName">Contato</Label>
            <Input
              id="edit-contactName"
              value={form.contactName}
              onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
              placeholder="Nome do contato"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-contactDetails">Detalhes do contato</Label>
            <Input
              id="edit-contactDetails"
              value={form.contactDetails}
              onChange={(e) => setForm((f) => ({ ...f, contactDetails: e.target.value }))}
              placeholder="E-mail, telefone..."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-source">Fonte</Label>
            <Input
              id="edit-source"
              value={form.source}
              onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
              placeholder="LinkedIn, indicação..."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-experiment">Experimento</Label>
            <Input
              id="edit-experiment"
              value={form.experiment}
              onChange={(e) => setForm((f) => ({ ...f, experiment: e.target.value }))}
              placeholder="Campanha, teste A/B..."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-notes">Notas</Label>
            <Textarea
              id="edit-notes"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Observações sobre o deal..."
              className="min-h-[80px]"
            />
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="edit-icp"
              checked={form.icp}
              onCheckedChange={(checked) => setForm((f) => ({ ...f, icp: checked }))}
            />
            <Label htmlFor="edit-icp">ICP</Label>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-nextAction">Próxima ação</Label>
            <Input
              id="edit-nextAction"
              value={form.nextAction}
              onChange={(e) => setForm((f) => ({ ...f, nextAction: e.target.value }))}
              placeholder="O que fazer a seguir..."
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
