import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Deal } from "@/lib/pipeline/api";

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

type Props = {
  deal: Deal;
};

export function DealCard({ deal }: Props) {
  return (
    <Card
      data-deal-id={deal.id}
      className="mb-2 cursor-default select-none shadow-sm"
    >
      <CardContent className="p-3">
        <p className="text-sm font-semibold leading-tight">{deal.companyName}</p>

        {deal.contactName && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {deal.contactName}
          </p>
        )}

        <div className="mt-2 flex items-center gap-2">
          <Badge variant={STATUS_VARIANT[deal.status]} className="text-xs">
            {STATUS_LABEL[deal.status]}
          </Badge>
        </div>

        {deal.nextAction && (
          <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
            → {deal.nextAction}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
