# Quickstart: Pipeline Drag & Drop

**Feature**: 009-pipeline-dnd
**Date**: 2026-03-30

---

## Prerequisites

- Feature 008 (Pipeline UI) implemented and running
- At least 2 stages created via API
- At least 1 active deal in a stage

---

## Validation Steps

### Step 1 — Install packages
```bash
pnpm add @dnd-kit/core @dnd-kit/utilities
pnpm dlx shadcn@latest add sonner
```
✅ Verify: `@dnd-kit/core` and `sonner` appear in `package.json`

---

### Step 2 — Add Toaster to layout
✅ Verify: `<Toaster />` renders in `app/(private)/layout.tsx` (inspect DOM — `<ol>` or `<div>` with data-sonner-toaster)

---

### Step 3 — Drag a card to another column
1. Access `/pipeline`
2. Hover over an active deal card — verify grip icon (`⋮⋮`) appears
3. Click and drag the grip handle to another column
4. Release

✅ Verify:
- Card moves to destination column
- No page reload
- Network tab shows exactly one `POST /api/deals/:id/move` request

---

### Step 4 — Verify overlay effect during pending
1. Open Chrome DevTools → Network → set throttle to Slow 3G
2. Drag a card to another column
3. Observe the card in the destination column before the network response

✅ Verify: Card appears in destination column at reduced opacity until response returns

---

### Step 5 — Drop in same column (no-op)
1. Drag a card and drop it back on the same column

✅ Verify: Zero network requests (check Network tab); board unchanged

---

### Step 6 — Won/lost deal not draggable
1. Move a deal to a final stage via `POST /api/deals/:id/move` to a stage with `isFinal: true`
2. Reload `/pipeline`
3. Hover and attempt to drag the won/lost deal

✅ Verify: No grip handle visible; drag does not initiate

---

### Step 7 — Error rollback
1. Set DevTools to Offline mode
2. Drag a deal to another column

✅ Verify:
- Card briefly appears in destination (optimistic), then returns to source column
- Toast error appears: "Não foi possível mover o deal. Tente novamente."

---

### Step 8 — Keyboard accessibility
1. Tab to a draggable deal card grip handle
2. Press Space to start drag, arrow keys to move between columns, Space to drop

✅ Verify: Deal moves between columns using keyboard only

---

### Step 9 — Multiple deals, correct columns
1. Create 3 stages and 5 deals distributed via API
2. Drag deals between columns
3. Reload `/pipeline`

✅ Verify: After reload, deals remain in the columns they were moved to (backend persisted correctly)

---

### Step 10 — History verification
After moving a deal via drag, call:
```
GET /api/deals/:id/history
```
✅ Verify: Response includes a new `deal_stage_history` record reflecting the move
