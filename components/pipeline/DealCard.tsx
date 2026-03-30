"use client";

import { useDraggable } from "@dnd-kit/core";
import { GripVertical } from "lucide-react";
import Link from "next/link";

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
  isPending?: boolean;
  href?: string;
};

export function DealCard({ deal, isPending = false, href }: Props) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: deal.id,
    data: { stageId: deal.stageId },
    disabled: deal.status !== "active" || !!isPending,
  });

  return (
    <Card
      ref={setNodeRef}
      data-deal-id={deal.id}
      className={`mb-2 select-none shadow-sm transition-opacity ${
        href ? "cursor-pointer" : "cursor-default"
      } ${isDragging ? "opacity-30" : isPending ? "opacity-50" : ""}`}
    >
      <CardContent className="relative p-3">
        {deal.status === "active" && !isPending && (
          <button
            {...listeners}
            {...attributes}
            className="absolute right-2 top-2 cursor-grab p-0.5 text-muted-foreground active:cursor-grabbing"
            tabIndex={0}
            aria-label="Arrastar deal"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}

        {href ? (
          <Link href={href} className="block">
            <p className="pr-6 text-sm font-semibold leading-tight">{deal.companyName}</p>

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
          </Link>
        ) : (
          <>
            <p className="pr-6 text-sm font-semibold leading-tight">{deal.companyName}</p>

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
          </>
        )}
      </CardContent>
    </Card>
  );
}
