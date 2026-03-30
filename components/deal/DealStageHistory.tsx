"use client";

import { useQuery } from "@tanstack/react-query";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchHistory } from "@/lib/pipeline/api";
import { historyKeys } from "@/lib/query-keys";

type Props = {
  dealId: string;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function DealStageHistory({ dealId }: Props) {
  const { data, isLoading, isError } = useQuery({
    queryKey: historyKeys.list(dealId),
    queryFn: () => fetchHistory(dealId),
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Histórico de stage</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}

        {isError && (
          <Alert variant="destructive">
            <AlertDescription>
              Não foi possível carregar o histórico.
            </AlertDescription>
          </Alert>
        )}

        {!isLoading && !isError && data && data.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhuma movimentação registrada.
          </p>
        )}

        {!isLoading && !isError && data && data.length > 0 && (
          <ul className="space-y-2">
            {[...data].reverse().map((entry) => (
              <li
                key={entry.id}
                className="flex flex-col gap-0.5 rounded-md border p-3 text-sm"
              >
                <span className="font-medium">
                  {entry.fromStage.name} → {entry.toStage.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(entry.changedAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
