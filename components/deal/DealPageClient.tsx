"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { DealActivitiesList } from "@/components/deal/DealActivitiesList";
import { DealEditDialog } from "@/components/deal/DealEditDialog";
import { DealMainInfo } from "@/components/deal/DealMainInfo";
import { DealPageSkeleton } from "@/components/deal/DealPageSkeleton";
import { DealStageHistory } from "@/components/deal/DealStageHistory";
import { Button } from "@/components/ui/button";
import { fetchDeal } from "@/lib/pipeline/api";
import { dealKeys } from "@/lib/query-keys";

type Props = {
  id: string;
};

export function DealPageClient({ id }: Props) {
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);

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

  const deal = dealQuery.data;

  return (
    <>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        {/* Left panel */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground truncate">
              {deal.companyName}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
              Editar
            </Button>
          </div>
          <DealMainInfo deal={deal} />
        </div>

        {/* Right panel */}
        <div className="flex flex-col gap-6">
          <DealActivitiesList dealId={id} />
          <DealStageHistory dealId={id} />
        </div>
      </div>

      <DealEditDialog
        deal={deal}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={() => {
          void queryClient.invalidateQueries({ queryKey: dealKeys.detail(id) });
          void queryClient.invalidateQueries({ queryKey: dealKeys.list() });
        }}
      />
    </>
  );
}
