"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Deal } from "@/lib/pipeline/api";

type Props = {
  deal: Deal;
};

const STATUS_VARIANT: Record<
  Deal["status"],
  "default" | "secondary" | "destructive"
> = {
  active: "default",
  won: "secondary",
  lost: "destructive",
};

const STATUS_LABEL: Record<Deal["status"], string> = {
  active: "Ativo",
  won: "Ganho",
  lost: "Perdido",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function DealMainInfo({ deal }: Props) {
  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        {/* Company name + status */}
        <div>
          <h1 className="text-xl font-bold leading-tight">{deal.companyName}</h1>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant={STATUS_VARIANT[deal.status]}>
              {STATUS_LABEL[deal.status]}
            </Badge>
            {deal.icp && (
              <Badge variant="outline" className="text-xs">
                ICP
              </Badge>
            )}
          </div>
        </div>

        <Separator />

        {/* Contact info */}
        {(deal.contactName != null || deal.contactDetails != null) && (
          <div className="space-y-1">
            {deal.contactName && (
              <div>
                <p className="text-xs text-muted-foreground">Contato</p>
                <p className="text-sm">{deal.contactName}</p>
              </div>
            )}
            {deal.contactDetails && (
              <div>
                <p className="text-xs text-muted-foreground">Detalhes</p>
                <p className="text-sm">{deal.contactDetails}</p>
              </div>
            )}
          </div>
        )}

        {/* Stage */}
        <div>
          <p className="text-xs text-muted-foreground">Stage atual</p>
          <p className="text-sm font-medium">{deal.stage.name}</p>
          <p className="text-xs text-muted-foreground">
            desde {formatDate(deal.stageUpdatedAt)}
          </p>
        </div>

        <Separator />

        {/* Next action */}
        {deal.nextAction && (
          <div>
            <p className="text-xs text-muted-foreground">Próxima ação</p>
            <p className="text-sm">{deal.nextAction}</p>
          </div>
        )}

        {/* Notes */}
        {deal.notes && (
          <div>
            <p className="text-xs text-muted-foreground">Notas</p>
            <p className="text-sm whitespace-pre-wrap">{deal.notes}</p>
          </div>
        )}

        {/* Source */}
        {deal.source && (
          <div>
            <p className="text-xs text-muted-foreground">Fonte</p>
            <p className="text-sm">{deal.source}</p>
          </div>
        )}

        <Separator />

        {/* Dates */}
        <div>
          <p className="text-xs text-muted-foreground">Criado em</p>
          <p className="text-sm">{formatDate(deal.createdAt)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
