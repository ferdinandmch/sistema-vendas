"use client";

import { useQuery } from "@tanstack/react-query";

import { ActivityForm } from "@/components/deal/ActivityForm";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchActivities } from "@/lib/pipeline/api";
import type { ActivityType } from "@/lib/pipeline/api";
import { activityKeys } from "@/lib/query-keys";

type Props = {
  dealId: string;
};

const ACTIVITY_LABEL: Record<ActivityType, string> = {
  note: "Nota",
  call: "Ligação",
  meeting: "Reunião",
  followup: "Follow-up",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function DealActivitiesList({ dealId }: Props) {
  const { data, isLoading, isError } = useQuery({
    queryKey: activityKeys.list(dealId),
    queryFn: () => fetchActivities(dealId),
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Activities</CardTitle>
      </CardHeader>
      <CardContent>
        <ActivityForm dealId={dealId} />
        <Separator className="my-4" />

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
              Não foi possível carregar as activities.
            </AlertDescription>
          </Alert>
        )}

        {!isLoading && !isError && data && data.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhuma activity registrada.
          </p>
        )}

        {!isLoading && !isError && data && data.length > 0 && (
          <ul className="space-y-2">
            {data.map((activity) => (
              <li
                key={activity.id}
                className="flex flex-col gap-1 rounded-md border p-3 text-sm"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {ACTIVITY_LABEL[activity.type]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(activity.createdAt)}
                  </span>
                </div>
                {activity.content && (
                  <p className="text-sm">{activity.content}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
