import type { Deal } from "@/lib/pipeline/api";

export function groupDealsByStage(deals: Deal[]): Record<string, Deal[]> {
  return deals.reduce(
    (acc, deal) => {
      const key = deal.stageId;
      if (!acc[key]) acc[key] = [];
      acc[key].push(deal);
      return acc;
    },
    {} as Record<string, Deal[]>,
  );
}
