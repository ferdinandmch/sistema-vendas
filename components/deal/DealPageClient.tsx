"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { DealActivitiesList } from "@/components/deal/DealActivitiesList";
import { DealMainInfo } from "@/components/deal/DealMainInfo";
import { DealPageSkeleton } from "@/components/deal/DealPageSkeleton";
import { DealStageHistory } from "@/components/deal/DealStageHistory";
import { fetchDeal } from "@/lib/pipeline/api";
import { dealKeys } from "@/lib/query-keys";

type Props = {
  id: string;
};

export function DealPageClient({ id }: Props) {
  const dealQuery = useQuery({
    queryKey: dealKeys.detail(id),
    queryFn: () => fetchDeal(id),
  });

  if (dealQuery.isLoading) {
    return <DealPageSkeleton />;
  }

  if (dealQuery.isError || !dealQuery.data) {
    return (
      <div className="flex flex-col items-start gap-4">
        <p className="text-sm text-destructive">
          Deal não encontrado ou você não tem permissão para acessá-lo.
        </p>
        <Link href="/pipeline" className="text-sm text-muted-foreground hover:text-foreground">
          ← Voltar ao Pipeline
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
      {/* Left panel */}
      <DealMainInfo deal={dealQuery.data} />

      {/* Right panel */}
      <div className="flex flex-col gap-6">
        <DealActivitiesList dealId={id} />
        <DealStageHistory dealId={id} />
      </div>
    </div>
  );
}
