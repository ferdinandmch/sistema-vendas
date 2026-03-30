# Research: Pipeline Drag & Drop

**Feature**: 009-pipeline-dnd
**Date**: 2026-03-30

---

## Decision 1: @dnd-kit packages

**Decision**: `@dnd-kit/core` + `@dnd-kit/utilities` only. `@dnd-kit/sortable` is NOT needed.

**Rationale**: Sorting within a column is out of scope. `@dnd-kit/core` provides all primitives: `DndContext`, `useDraggable`, `useDroppable`, `DragOverlay`. `@dnd-kit/utilities` provides `CSS.Transform.toString` for the drag ghost transform.

**Alternatives considered**:
- `react-beautiful-dnd` — deprecated, no longer maintained
- `@dnd-kit/sortable` — only needed for intra-column reordering, which is out of scope
- `react-dnd` — lower-level, more boilerplate, no accessibility story

---

## Decision 2: DnD context placement

**Decision**: `DndContext` wraps only the columns container inside `PipelineBoard` — not the whole page.

**Rationale**: Restricting the DnD boundary to the board prevents unintended drop targets in other page areas. `DndContext` also needs access to `useMutation` and query client, which are already available in `PipelineBoard`. Keeping the context co-located avoids prop drilling across distant components.

**Alternatives considered**:
- Context at page level (`pipeline/page.tsx`) — not a Client Component; would require extracting layout
- Separate `DndBoardContext` provider — unnecessary complexity for a single board

---

## Decision 3: useDraggable placement — inside DealCard

**Decision**: `useDraggable` is called inside `DealCard` directly. The grip handle (`GripVertical` icon) receives `listeners` and `attributes`. Cards with `status !== 'active'` pass `disabled: true` to `useDraggable`.

**Rationale**: DealCard already has all the data needed (`deal.id`, `deal.status`). Keeping the drag logic inside the component avoids creating a wrapper component (`DraggableDealCard`) that would add indirection. `useDraggable` with `disabled: true` is the `@dnd-kit` native way to make non-draggable items.

**Alternatives considered**:
- Wrapper component `DraggableDealCard` — adds a layer without meaningful benefit at this scale
- Passing listeners from PipelineColumn to DealCard as props — breaks component encapsulation

---

## Decision 4: useDroppable placement — inside PipelineColumn

**Decision**: `useDroppable({ id: stage.id })` is called inside `PipelineColumn`. The outer `div` gets `ref={setNodeRef}`. When `isOver` is true, the column receives a highlight border class.

**Rationale**: PipelineColumn already owns the column container div and the stage data. Adding `useDroppable` inside keeps the drop zone definition co-located with the visual target. No additional wrapper component needed.

**Alternatives considered**:
- Wrapper `DroppableColumn` — same outcome, more files

---

## Decision 5: Optimistic update strategy — queryClient.setQueryData + pendingDealId state

**Decision**: Use TanStack Query canonical optimistic update pattern (`mut-rollback-context`):
1. `onMutate`: cancel outgoing queries, snapshot `previousDeals`, apply optimistic update via `queryClient.setQueryData`, return `{ previousDeals }` as rollback context
2. `onError`: restore `previousDeals` via `queryClient.setQueryData(context.previousDeals)` + show toast
3. `onSettled`: `queryClient.invalidateQueries({ queryKey: dealKeys.list() })` to sync with backend

For the "pending overlay" effect (opacity on the card being moved): maintain a separate `pendingDealId: string | null` state in `PipelineBoard`. Set it in `onMutate`, clear in `onSettled`. Pass down via `PipelineColumn` to `DealCard` as `isPending` prop.

**Rationale**: The canonical TanStack Query pattern is correct for optimistic updates. Using `setQueryData` (instead of local state) means the board renders from a single source of truth (the query cache) at all times. The separate `pendingDealId` state is minimal extra state needed only for the visual overlay effect defined in spec.

**Alternatives considered**:
- Local `optimisticMoves` state replacing query data — duplicates state, diverges from TanStack Query patterns
- No optimistic update (pessimistic) — rejected by user (chose option C)
- Optimistic without rollback context — violates `mut-rollback-context` rule; leaves board inconsistent on error

---

## Decision 6: DragOverlay for smooth ghost card

**Decision**: Use `DragOverlay` from `@dnd-kit/core`. Track `activeDeal: Deal | null` state via `onDragStart`/`onDragEnd` in `PipelineBoard`. `DragOverlay` renders a static `<DealCard>` (with `isDragging` class for visual styling) as the drag ghost. The original card in its column becomes visually muted (`opacity-30`) while dragging.

**Rationale**: Without `DragOverlay`, @dnd-kit uses the original DOM node as the drag image, which can cause rendering artifacts. `DragOverlay` renders a clean floating copy. The original card at reduced opacity creates the "placeholder" visual that clarifies where the card came from.

**Alternatives considered**:
- No DragOverlay (native drag image) — poorer visual, rendering artifacts on scroll
- CSS `transform` on original card — complex positioning, conflicts with column overflow

---

## Decision 7: Toast library — sonner via shadcn

**Decision**: Install `sonner` via `pnpm dlx shadcn@latest add sonner`. Add `<Toaster />` to `app/(private)/layout.tsx`. Use `toast.error(...)` in `PipelineBoard` mutation's `onError`.

**Rationale**: Sonner is already the shadcn/ui default toast. Installing via shadcn generates the `components/ui/sonner.tsx` wrapper with project theme applied. `<Toaster />` in the private layout ensures it's available on all authenticated pages without adding to the public layout.

**Alternatives considered**:
- shadcn `toast` (old) — replaced by sonner in shadcn v2
- inline error state in board — non-dismissible, blocks the board visually

---

## Decision 8: move API function location

**Decision**: Add `moveDeal(dealId: string, toStageId: string): Promise<Deal>` to `lib/pipeline/api.ts` (existing file). Payload: `POST /api/deals/:id/move` with `{ toStageId }`.

**Rationale**: All pipeline API functions are already in `lib/pipeline/api.ts`. Adding `moveDeal` there is consistent and avoids creating a new file for a single function.

**Alternatives considered**:
- New `lib/pipeline/move-deal.ts` — unnecessary for a single function

---

## Decision 9: grip icon

**Decision**: `GripVertical` from `lucide-react` (already installed with shadcn). Added to the top-right corner of each DealCard's `CardContent`. Receives `{...listeners}` and `{...attributes}` from `useDraggable`. `cursor-grab active:cursor-grabbing` on handle.

**Rationale**: `lucide-react` is already in the project. `GripVertical` is the standard drag handle icon across design systems. Using an explicit handle (not full-card drag) was the user's choice (Q1) and avoids conflict with future click interactions (feature 010).

---

## Decision 10: no new database migrations

**Decision**: Zero migrations. This feature is pure frontend interaction consuming the existing `POST /api/deals/:id/move` endpoint.

**Rationale**: All backend logic was implemented in feature 004. No new fields, tables, or constraints are needed.
