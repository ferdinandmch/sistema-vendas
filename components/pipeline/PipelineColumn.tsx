import { DealCard } from "@/components/pipeline/DealCard";
import type { Deal, Stage } from "@/lib/pipeline/api";

type Props = {
  stage: Stage;
  deals: Deal[];
  dealsError?: boolean;
};

export function PipelineColumn({ stage, deals, dealsError = false }: Props) {
  return (
    <div className="flex w-72 shrink-0 flex-col rounded-lg bg-muted/50 p-3">
      {/* Column header */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{stage.name}</h3>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {dealsError ? "—" : deals.length}
        </span>
      </div>

      {/* Column body */}
      <div className="flex-1">
        {dealsError ? (
          <p className="text-xs text-destructive">
            Não foi possível carregar os deals.
          </p>
        ) : deals.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Nenhum deal neste stage.
          </p>
        ) : (
          deals.map((deal) => <DealCard key={deal.id} deal={deal} />)
        )}
      </div>
    </div>
  );
}
