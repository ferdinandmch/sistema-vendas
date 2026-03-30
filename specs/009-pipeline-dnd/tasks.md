# Tasks: Pipeline Drag & Drop

**Input**: Design documents from `/specs/009-pipeline-dnd/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Não há testes unitários para esta feature — a lógica de domínio não muda. Validação via quickstart.md (testes manuais). `pnpm test` passa sem regressões.

**Organization**: Tarefas agrupadas por user story para implementação e validação independentes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependências incompletas)
- **[Story]**: User story a que pertence a tarefa ([US1], [US2], [US3])
- Caminhos exatos de arquivo em todas as descrições

---

## Phase 1: Setup — Infraestrutura de DnD

**Purpose**: Instalar pacotes necessários e preparar o ambiente — prerequisitos para todos os componentes desta feature.

- [X] T001 [P] Install `@dnd-kit/core` and `@dnd-kit/utilities`: `pnpm add @dnd-kit/core @dnd-kit/utilities` — confirmar entradas em `package.json`
- [X] T002 [P] Install `sonner` via shadcn: `pnpm dlx shadcn@latest add sonner` — confirmar criação de `components/ui/sonner.tsx` e entrada de `sonner` em `package.json`
- [X] T003 Add `<Toaster />` to `app/(private)/layout.tsx` — import `Toaster` from `@/components/ui/sonner`; add `<Toaster />` just before the closing `</QueryProvider>` tag; confirmar que o componente está presente no DOM em `/pipeline`

**Checkpoint**: Pacotes instalados. `<Toaster />` visível no DOM (inspecionar: `[data-sonner-toaster]`).

---

## Phase 2: Foundational — Função de mutação

**Purpose**: Adicionar `moveDeal()` a `lib/pipeline/api.ts` — função que todos os componentes de DnD irão consumir via `useMutation`.

**CRITICAL**: A US1 não pode começar antes desta fase estar completa.

- [X] T004 Add `moveDeal(dealId: string, toStageId: string): Promise<Deal>` to `lib/pipeline/api.ts` — `POST /api/deals/${dealId}/move` with body `{ toStageId }` — throw on non-ok — extract `data.deal` from response envelope — follow the same pattern as `fetchStages`/`fetchDeals` already in the file

**Checkpoint**: `lib/pipeline/api.ts` exporta `moveDeal`. `pnpm exec tsc --noEmit` sem erros no arquivo.

---

## Phase 3: User Story 1 — Mover deal para outro stage (Priority: P1)

**Goal**: Usuário arrasta um deal pelo grip handle para outra coluna — o board chama `POST /api/deals/:id/move`, o card se move otimisticamente com overlay de opacidade, e o estado final reflete a resposta do backend.

**Independent Test**: Criar 2 stages e 1 deal no stage A. Acessar `/pipeline`. Arrastar pelo grip handle até o stage B. Verificar: (1) card aparece na coluna B com opacidade reduzida; (2) Network tab mostra exatamente 1 request `POST /api/deals/:id/move`; (3) após resposta, card aparece em opacidade normal na coluna B.

### Implementation for User Story 1

- [X] T005 [P] [US1] Update `components/pipeline/DealCard.tsx` to be draggable via grip handle — import `useDraggable` from `@dnd-kit/core` and `GripVertical` from `lucide-react`; add `isPending?: boolean` prop (passed from PipelineColumn); call `useDraggable({ id: deal.id, data: { stageId: deal.stageId }, disabled: deal.status !== 'active' || !!isPending })` — `isPending` doubles as both visual indicator AND drag-disabled guard (FR-007); destructure `isDragging` from the hook return value (not a prop — comes from `useDraggable().isDragging`); add grip handle element rendering `<GripVertical>` icon with `{...listeners}` and `{...attributes}`, `cursor-grab active:cursor-grabbing`, positioned at top-right of `CardContent`; apply `opacity-30` to Card root when `isDragging` (hook value); apply `opacity-50` to Card root when `isPending`; keep `cursor-default select-none` on the Card root (grip is the only drag trigger); **DragOverlay usage**: when rendered inside `<DragOverlay>`, `useDraggable().isDragging` is false — pass no extra props, the overlay card will render at full opacity as the ghost (this is correct behavior)
- [X] T006 [P] [US1] Update `components/pipeline/PipelineColumn.tsx` to be a drop zone — import `useDroppable` from `@dnd-kit/core`; call `useDroppable({ id: stage.id })`; apply `ref={setNodeRef}` to outer `div`; apply `border border-primary/50 bg-primary/5 transition-colors` to outer `div` when `isOver`; add `pendingDealId?: string | null` to `Props`; pass `isPending={deal.id === pendingDealId}` to each `<DealCard>`
- [X] T007 [US1] Update `components/pipeline/PipelineBoard.tsx` to orchestrate the full drag interaction — import `DndContext`, `DragOverlay`, `PointerSensor`, `KeyboardSensor`, `useSensor`, `useSensors` from `@dnd-kit/core`; import `useQueryClient` from `@tanstack/react-query`; import `useMutation` from `@tanstack/react-query`; import `moveDeal` from `@/lib/pipeline/api`; import `toast` from `sonner`; add `activeDeal: Deal | null` state (set in `onDragStart`, cleared in `onDragEnd`); add `pendingDealId: string | null` state; configure sensors with `PointerSensor` and `KeyboardSensor`; implement `onDragStart`: set `activeDeal` from `dealsQuery.data`; implement `onDragEnd`: (a) clear `activeDeal`, (b) if `!over` or `over.id === active.data.current.stageId` → return no-op [US2 guard], (c) otherwise call `mutation.mutate({ dealId: active.id, toStageId: over.id })`; implement `useMutation` with full canonical optimistic pattern: `onMutate` cancels `dealKeys.list()` queries + snapshots `previousDeals` + applies `queryClient.setQueryData` to move the deal optimistically + sets `pendingDealId`; `onError` restores `previousDeals` + calls `toast.error("Não foi possível mover o deal. Tente novamente.")`; `onSettled` clears `pendingDealId` + invalidates `dealKeys.list()`; wrap columns container in `<DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>`; add `<DragOverlay>` rendering `<DealCard deal={activeDeal} />` (no extra props — overlay card renders at full opacity as ghost) when `activeDeal` is set; pass `pendingDealId` to each `<PipelineColumn>`

**Checkpoint**: Board com DnD funcional. Arrastar um deal entre colunas atualiza o board. Overlay de opacidade visível durante mutação.

---

## Phase 4: User Story 2 — Soltar no mesmo stage (Priority: P1)

**Goal**: Usuário arrasta um deal e solta na mesma coluna — nenhuma chamada ao endpoint é disparada e o board permanece idêntico.

**Independent Test**: Arrastar um deal e soltar na mesma coluna. Verificar no Network tab: zero requests a `POST /api/deals/:id/move`. Board inalterado.

### Implementation for User Story 2

- [X] T008 [US2] Verify no-op guard in `components/pipeline/PipelineBoard.tsx` `onDragEnd` — confirm the guard `if (!over || over.id === active.data.current.stageId)` exists and returns early without calling `mutation.mutate`; verify `activeDeal` is cleared before returning; confirm via Network tab that no request fires when dropping in same column

**Checkpoint**: Zero network requests ao soltar deal na mesma coluna. Board permanece idêntico.

---

## Phase 5: User Story 3 — Falha na movimentação (Priority: P1)

**Goal**: O backend rejeita a operação — o board reverte ao estado anterior, o toast de erro é exibido, e o card fica disponível para novo arraste.

**Independent Test**: Ativar DevTools offline mode; arrastar um deal para outra coluna; verificar: (1) card reverte à coluna original; (2) toast "Não foi possível mover o deal. Tente novamente." aparece; (3) `pendingDealId` limpo (opacidade normal).

### Implementation for User Story 3

- [X] T009 [US3] Verify `useMutation` `onError` handler in `components/pipeline/PipelineBoard.tsx` — confirm `queryClient.setQueryData(dealKeys.list(), context?.previousDeals)` restores pre-mutation state; confirm `toast.error("Não foi possível mover o deal. Tente novamente.")` is called; confirm `pendingDealId` is cleared in `onSettled` (not `onError`, so it clears on both success and failure)
- [X] T010 [US3] Verify `DealCard.tsx` disabled state for closed deals — confirm `useDraggable` has `disabled: deal.status !== 'active' || !!isPending` (both guards: closed status AND pending mutation); verify that won/lost cards have no grip handle listeners active and do not initiate drag; test by inspecting a won/lost card: no `cursor-grab` on handle, drag does not start

**Checkpoint**: Board reverte corretamente após erro. Toast visível. Won/lost cards não arrastáveis.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verificação final de tipos, regressões e validação completa da feature.

- [X] T011 [P] Run `pnpm exec tsc --noEmit` — verify zero TypeScript errors across all modified files: `lib/pipeline/api.ts`, `components/pipeline/DealCard.tsx`, `components/pipeline/PipelineColumn.tsx`, `components/pipeline/PipelineBoard.tsx`, `app/(private)/layout.tsx`
- [X] T012 [P] Run `pnpm exec vitest run tests/unit/` — confirm all existing unit tests still pass (no regressions from DnD changes)
- [ ] T013 Execute all 10 validation steps from `specs/009-pipeline-dnd/quickstart.md` and confirm each passes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Sem dependências — iniciar aqui
- **Phase 2 (Foundational)**: Depende de Phase 1 — bloqueia todas as user stories
- **Phase 3 (US1)**: Depende de Phase 2 completa — T005 e T006 podem rodar em paralelo; T007 depende de T005 e T006
- **Phase 4 (US2)**: Depende de T007 completo — o guard já estará em PipelineBoard; esta fase é verificação/confirmação
- **Phase 5 (US3)**: Depende de T007 completo — os handlers já estarão em PipelineBoard; esta fase verifica os caminhos de erro
- **Phase 6 (Polish)**: Depende de Phases 3, 4, 5 completas

### User Story Dependencies

- **US1 (P1)**: Inicia após Phase 2 — entrega o fluxo completo de movimentação
- **US2 (P1)**: Inicia após US1 — verifica o guard no-op já implementado em T007
- **US3 (P1)**: Inicia após US1 — verifica os handlers de erro já implementados em T007

### Within Each Phase

- T001, T002 podem rodar em paralelo → T003 depende de T002 (sonner instalado)
- T004: fase 2 inteira, nenhuma dependência interna
- T005, T006 podem rodar em paralelo → T007 depende de ambos (imports de DealCard e PipelineColumn)
- T008: verificação do que T007 implementou
- T009, T010 podem rodar em paralelo (verificações independentes)
- T011, T012 podem rodar em paralelo → T013 depende de ambos

### Parallel Opportunities

```
Phase 1: [T001 ‖ T002] → T003
Phase 2: T004
Phase 3: [T005 ‖ T006] → T007
Phase 4: T008
Phase 5: [T009 ‖ T010]
Phase 6: [T011 ‖ T012] → T013
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T003)
2. Complete Phase 2: Foundational (T004)
3. Complete Phase 3: User Story 1 (T005–T007)
4. Validar US1 independentemente: arrastar deal entre colunas, observar overlay, verificar Network tab

### Incremental Delivery

1. Setup + Foundational (Phases 1–2)
2. US1: core drag interaction (Phase 3) ← primeiro valor visível
3. US2: verificar no-op na mesma coluna (Phase 4) ← integridade
4. US3: verificar rollback de erro (Phase 5) ← qualidade de produção
5. Polish final (Phase 6)

---

## Notes

- [P] tasks = arquivos diferentes, sem dependências incompletas — podem ser paralelizados
- [Story] mapeia cada tarefa à user story correspondente para rastreabilidade
- T007 é a tarefa mais complexa — implementa DndContext, DragOverlay, useMutation canonical, e os handlers onDragStart/onDragEnd/onMutate/onError/onSettled
- T005 implementa o grip handle (`GripVertical`) como única área de drag — decisão da clarificação Q1 (opção B) — preserva o card para click futuro (feature 010)
- T008/T009/T010 são verificações do que T007 implementa — podem ser executadas como checklist de revisão após T007
- `pnpm exec tsc --noEmit` é o linter desta feature (Next.js 16 não tem `next lint`)
