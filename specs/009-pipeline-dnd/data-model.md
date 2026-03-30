# Data Model: Pipeline Drag & Drop

**Feature**: 009-pipeline-dnd
**Date**: 2026-03-30

---

## Overview

Esta feature não cria nenhuma entidade nova nem altera o schema do banco de dados. É uma camada de interação visual sobre entidades já existentes. Zero migrations.

---

## Entities consumed (read-only reference)

### Deal (existing — `lib/pipeline/api.ts`)

```ts
type Deal = {
  id: string;
  companyName: string;
  contactName: string | null;
  stageId: string;          // ← used as drag origin identifier
  status: DealStatus;       // ← "active" | "won" | "lost" — determines drag eligibility
  nextAction: string | null;
  ownerId: string;
  createdAt: string;
  stageUpdatedAt: string;
  stage: {
    id: string;
    name: string;
    position: number;
  };
};
```

**Drag rules derived from status**:
- `status === "active"` → draggable
- `status === "won"` or `"lost"` → `disabled: true` on `useDraggable` (FR-006)

### Stage (existing — `lib/pipeline/api.ts`)

```ts
type Stage = {
  id: string;             // ← used as drop zone identifier (toStageId)
  name: string;
  position: number;
  isFinal: boolean;
  finalType: "won" | "lost" | null;
  createdAt: string;
};
```

---

## New API function (frontend only)

### `moveDeal` — `lib/pipeline/api.ts`

```ts
async function moveDeal(dealId: string, toStageId: string): Promise<Deal>
```

- `POST /api/deals/${dealId}/move`
- Body: `{ toStageId }`
- Returns: updated `Deal` from backend envelope `{ deal: Deal }`
- Throws on non-ok response (consistent with existing `fetchStages` / `fetchDeals` pattern)

---

## DnD interaction state (frontend only, non-persistent)

These types represent ephemeral UI state in `PipelineBoard` — never persisted to the backend.

### ActiveDrag

```ts
type ActiveDrag = {
  deal: Deal;     // full deal being dragged — used by DragOverlay
}
// null when no drag is in progress
```

### PendingMove

```ts
// dealId being moved while mutation is in-flight
// null when no mutation is pending
type PendingDealId = string | null
```

The `pendingDealId` drives the `isPending` prop on DealCard, which applies `opacity-50` to communicate "awaiting backend confirmation" (spec: otimista com overlay).

---

## Query cache interaction

| Operation | Cache effect |
|-----------|-------------|
| `onMutate` | `cancelQueries(dealKeys.list())` + `setQueryData(dealKeys.list(), optimistic)` |
| `onError` | `setQueryData(dealKeys.list(), context.previousDeals)` — full rollback |
| `onSettled` | `invalidateQueries({ queryKey: dealKeys.list() })` — sync with backend |

Optimistic update applied to query cache maps `deal.stageId` to `toStageId` for the moved deal. The `stage` nested object is updated to reflect the new stageId. After `onSettled`, the backend's authoritative response replaces the optimistic data.
