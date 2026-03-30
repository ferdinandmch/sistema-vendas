# Tasks: Deal Page

**Input**: Design documents from `/specs/010-deal-page/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Não há testes unitários para esta feature — a lógica de domínio não muda. Validação via quickstart.md (testes manuais). `pnpm test` passa sem regressões.

**Organization**: Tarefas agrupadas por user story para implementação e validação independentes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependências incompletas)
- **[Story]**: User story a que pertence a tarefa ([US1], [US2], [US3], [US4])
- Caminhos exatos de arquivo em todas as descrições

---

## Phase 1: Setup — Sem pacotes novos

**Purpose**: Nenhum pacote novo necessário — `@tanstack/react-query`, `shadcn/ui`, `lucide-react` e `next/link` já estão instalados. Esta phase confirma pré-condições.

- [ ] T001 [P] Confirm `@tanstack/react-query` and `lucide-react` present in `package.json` — nenhuma instalação adicional necessária
- [ ] T002 [P] Confirm `components/ui/skeleton.tsx` exists (shadcn Skeleton) — se ausente: `pnpm dlx shadcn@latest add skeleton`
- [ ] T002b [P] Confirm `components/ui/alert.tsx` exists (shadcn Alert) — se ausente: `pnpm dlx shadcn@latest add alert` — necessário para estados de erro em T011 e T012

**Checkpoint**: Todas as dependências disponíveis. `pnpm exec tsc --noEmit` limpo antes de iniciar.

---

## Phase 2: Foundational — Tipos, fetch functions e query keys

**Purpose**: Adicionar os tipos `Activity` e `StageHistoryEntry`, as funções `fetchDeal`, `fetchActivities`, `fetchHistory` e os query keys hierárquicos — prerequisitos bloqueantes para todas as user stories.

**CRITICAL**: Nenhuma user story pode começar antes desta fase estar completa.

- [ ] T003 [P] Add types `Activity`, `StageHistoryEntry` and functions `fetchDeal(id)`, `fetchActivities(dealId)`, `fetchHistory(dealId)` to `lib/pipeline/api.ts` — follow the existing `fetchDeals`/`fetchStages` pattern (throw on non-ok, extract from envelope); `fetchHistory` extracts `data.history`; `fetchActivities` extracts `data.activities`; `fetchDeal` extracts `data.deal`
- [ ] T004 [P] Extend `lib/query-keys.ts` — add `dealKeys.detail(id: string)` → `["deals", "detail", id]`; add `activityKeys` factory with `list(dealId: string)` → `["activities", "list", dealId]`; add `historyKeys` factory with `list(dealId: string)` → `["history", "list", dealId]` — follow `qk-factory-pattern` and `qk-hierarchical-organization`

**Checkpoint**: `lib/pipeline/api.ts` exporta `Activity`, `StageHistoryEntry`, `fetchDeal`, `fetchActivities`, `fetchHistory`. `lib/query-keys.ts` exporta `activityKeys` e `historyKeys`. `pnpm exec tsc --noEmit` sem erros nesses arquivos.

---

## Phase 3: User Story 1 — Navegar do board para a Deal Page (Priority: P1)

**Goal**: Usuário clica em um deal card no board (fora do grip handle) e é navegado para `/deals/:id`. A rota existe, é protegida por auth e exibe skeleton durante carregamento.

**Independent Test**: Acessar `/pipeline`. Clicar em um deal card (fora do ícone de grip). Verificar que a URL muda para `/deals/:id` e que a página exibe o skeleton de carregamento corretamente.

### Implementation for User Story 1

- [ ] T005 [P] [US1] Create stub `components/deal/DealPageClient.tsx` — "use client"; receives `id: string` prop; renders only `<DealPageSkeleton />` for now (full implementation em T013); este stub permite que `page.tsx` (T008) compile imediatamente sem erros TypeScript — substituído completamente em T013
- [ ] T006 [P] [US1] Update `components/pipeline/DealCard.tsx` — add `href?: string` prop; when `href` is provided, wrap `CardContent` children in `<Link href={href} className="block">` (Next.js `Link`); add `onClick={(e) => e.stopPropagation()}` to the grip button to prevent link activation during drag setup; add `cursor-pointer` to `Card` className when `href` is present
- [ ] T007 [P] [US1] Update `components/pipeline/PipelineColumn.tsx` — pass `` href={`/deals/${deal.id}`} `` to each `<DealCard>` rendered in the column
- [ ] T008 [P] [US1] Create `app/(private)/deals/[id]/page.tsx` — Server Component; call `requireAuthenticatedUser()` (auth gate, consistent with other private pages); extract `id` from `await params` (Next.js 16 async params); render `<DealPageClient id={id} />` wrapped in a container with back link `← Pipeline` pointing to `/pipeline` — depends on T005 stub existing
- [ ] T009 [P] [US1] Create `components/deal/DealPageSkeleton.tsx` — two-panel skeleton using shadcn `Skeleton`; left panel: `Skeleton` blocks replicating deal field rows; right panel: two `Skeleton` blocks (activities section top, history section bottom); use `grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6` matching the real layout

**Checkpoint**: Clicar em um deal card navega para `/deals/:id`. A rota existe e exibe o skeleton durante carregamento. Back link para `/pipeline` visível.

---

## Phase 4: User Story 2 — Visualizar dados principais do deal (Priority: P1)

**Goal**: Painel esquerdo da Deal Page exibe todos os campos do deal — empresa, contato, status, stage, próxima ação, notas, fonte, ICP, datas — com tratamento correto de campos nulos e status com cores distintas.

**Independent Test**: Acessar `/deals/:id` de um deal com todos os campos preenchidos. Verificar que cada campo aparece. Acessar um deal com campos opcionais vazios. Verificar que o layout não quebra.

### Implementation for User Story 2

- [ ] T010 [US2] Create `components/deal/DealMainInfo.tsx` — "use client"; receives `deal: Deal` prop; renders painel esquerdo com shadcn `Card`; exibe: `companyName` (título/heading), `contactName` (se não null), `contactDetails` (se não null), `status` como `Badge` (variant `default` para active, `secondary` para won, `destructive` para lost), stage name (`deal.stage.name`), `stageUpdatedAt` formatado, `nextAction` (se não null), `notes` (se não null), `source` (se não null), `icp` como badge "ICP" (se true), `createdAt` formatado; campos nulos não rendem linha vazia; use `Separator` entre grupos de campos; component is pure display (no queries)

**Checkpoint**: Painel esquerdo exibe todos os campos preenchidos corretamente. Campos nulos são omitidos. Status tem cores distintas via Badge variants.

---

## Phase 5: User Story 3 — Acompanhar histórico de stage (Priority: P1)

**Goal**: Seção inferior do painel direito exibe as movimentações do deal entre stages em ordem decrescente (mais recente primeiro), com stage de origem, stage de destino e data. Estado vazio e erro tratados independentemente.

**Independent Test**: Acessar `/deals/:id` de um deal que foi movido entre stages. Verificar que cada entrada mostra stage de origem → stage de destino e data, em ordem decrescente. Acessar deal sem histórico e verificar empty state.

### Implementation for User Story 3

- [ ] T011 [US3] Create `components/deal/DealStageHistory.tsx` — "use client"; receives `dealId: string` prop; calls `useQuery({ queryKey: historyKeys.list(dealId), queryFn: () => fetchHistory(dealId) })`; renders: loading state with `Skeleton` rows, error state with `Alert` (variant destructive, message "Não foi possível carregar o histórico."), empty state with message "Nenhuma movimentação registrada.", success state with list of entries; **reverse array before rendering**: `[...(history ?? [])].reverse()` to display most recent first (backend returns ASC); each entry shows `fromStage.name → toStage.name` + `changedAt` formatted; wrap in shadcn `Card` with `CardHeader`/`CardTitle` "Histórico de stage" and `CardContent`

**Checkpoint**: Seção de histórico exibe movimentações em ordem decrescente. Estado vazio correto. Erro exibe `Alert` sem derrubar a página.

---

## Phase 6: User Story 4 — Visualizar activities do deal (Priority: P1)

**Goal**: Seção superior do painel direito exibe as activities do deal em ordem decrescente (mais recente primeiro), com tipo, conteúdo e data. Estado vazio e erro tratados independentemente.

**Independent Test**: Acessar `/deals/:id` de um deal com activities. Verificar que tipo, conteúdo e data aparecem em ordem decrescente. Acessar deal sem activities e verificar empty state.

### Implementation for User Story 4

- [ ] T012 [US4] Create `components/deal/DealActivitiesList.tsx` — "use client"; receives `dealId: string` prop; calls `useQuery({ queryKey: activityKeys.list(dealId), queryFn: () => fetchActivities(dealId) })`; renders: loading state with `Skeleton` rows, error state with `Alert` (variant destructive, message "Não foi possível carregar as activities."), empty state with message "Nenhuma activity registrada.", success state with list ordered as returned by backend (already DESC); each entry shows type label (note→"Nota", call→"Ligação", meeting→"Reunião", followup→"Follow-up") as `Badge`, content (se não null), `createdAt` formatted; wrap in shadcn `Card` with `CardHeader`/`CardTitle` "Activities" and `CardContent`

**Checkpoint**: Seção de activities exibe interações em ordem decrescente. Estado vazio correto. Erro exibe `Alert` sem derrubar a página.

---

## Phase 7: Integration — Orchestrator DealPageClient

**Purpose**: Substituir o stub de T005 pela implementação completa, compondo o layout dois painéis. Depende de T008, T009, T010, T011, T012 estarem completos.

**CRITICAL**: T010 (DealMainInfo), T011 (DealStageHistory) e T012 (DealActivitiesList) devem estar completos antes desta fase.

- [ ] T013 [US1] Replace stub `components/deal/DealPageClient.tsx` with full implementation — "use client"; receives `id: string` prop; calls `useQuery({ queryKey: dealKeys.detail(id), queryFn: () => fetchDeal(id) })` for deal main data; renders `<DealPageSkeleton />` while `dealQuery.isLoading`; renders full-page error state (with back link to `/pipeline`) when `dealQuery.isError`; renders two-panel layout `<div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">` when deal loaded: left panel = `<DealMainInfo deal={dealQuery.data} />`, right panel = `<div className="flex flex-col gap-6"><DealActivitiesList dealId={id} /><DealStageHistory dealId={id} /></div>`; activities and history queries are fired independently inside their own components (not in DealPageClient)

**Checkpoint**: Deal Page exibe layout dois painéis completo. Painel esquerdo mostra dados do deal. Painel direito mostra activities (topo) e histórico (baixo). Cada seção lida com seu próprio loading/erro.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Verificação final de tipos, regressões e validação completa da feature.

- [ ] T014 [P] Run `pnpm exec tsc --noEmit` — verify zero TypeScript errors across all modified and created files: `lib/pipeline/api.ts`, `lib/query-keys.ts`, `components/pipeline/DealCard.tsx`, `components/pipeline/PipelineColumn.tsx`, `app/(private)/deals/[id]/page.tsx`, `components/deal/DealPageClient.tsx`, `components/deal/DealMainInfo.tsx`, `components/deal/DealActivitiesList.tsx`, `components/deal/DealStageHistory.tsx`, `components/deal/DealPageSkeleton.tsx`
- [ ] T015 [P] Run `pnpm exec vitest run tests/unit/` — confirm all existing unit tests still pass (no regressions from Deal Page changes)
- [ ] T016 Execute all 10 validation steps from `specs/010-deal-page/quickstart.md` and confirm each passes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Sem dependências — iniciar aqui
- **Phase 2 (Foundational)**: Depende de Phase 1 — bloqueia todas as user stories
- **Phase 3 (US1)**: Depende de Phase 2 — T005 primeiro (stub, sem dependências além de T009); T006, T007, T008, T009 podem rodar em paralelo após T005
- **Phase 4 (US2)**: Depende de Phase 2 (tipo Deal) — T010 pode rodar em paralelo com T011/T012
- **Phase 5 (US3)**: Depende de Phase 2 (tipo StageHistoryEntry) — T011 pode rodar em paralelo com T010/T012
- **Phase 6 (US4)**: Depende de Phase 2 (tipo Activity) — T012 pode rodar em paralelo com T010/T011
- **Phase 7 (Integration)**: Depende de T008, T009, T010, T011, T012 completos — T013 é sequencial
- **Phase 8 (Polish)**: Depende de Phase 7 completa

### Parallel Opportunities

```
Phase 1: [T001 ‖ T002 ‖ T002b]
Phase 2: [T003 ‖ T004]
Phase 3: T005 → [T006 ‖ T007 ‖ T008 ‖ T009]
Phases 4+5+6: [T010 ‖ T011 ‖ T012]  (podem rodar em paralelo com Phase 3 após T003)
Phase 7: T013
Phase 8: [T014 ‖ T015] → T016
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T002b)
2. Complete Phase 2: Foundational (T003–T004)
3. Complete Phase 3: US1 navigation (T005–T009)
4. Validar que a navegação do board para a Deal Page funciona (página existe, exibe skeleton)

### Incremental Delivery

1. Setup + Foundational (Phases 1–2)
2. US1: stub + navegação do board + rota (Phase 3) ← primeiro valor visível
3. US2: dados principais do deal (Phase 4) ← painel esquerdo funcional
4. US3 + US4: histórico + activities (Phases 5–6) ← painel direito funcional
5. Integration: DealPageClient completo substitui stub (Phase 7) ← página completa
6. Polish final (Phase 8)

---

## Notes

- [P] tasks = arquivos diferentes, sem dependências incompletas — podem ser paralelizados
- [Story] mapeia cada tarefa à user story correspondente para rastreabilidade
- T005 cria o stub de DealPageClient — **deve ser a primeira tarefa da Phase 3** para que T008 (page.tsx) compile sem erros TypeScript
- T013 é a tarefa de integração principal — substitui o stub de T005 com a implementação completa
- T006 requer atenção: o `Link` wrapper no DealCard deve coexistir com `useDraggable` sem interferência — o grip button para a propagação do evento de clique
- History vem do backend em ordem ASC — `[...history].reverse()` em `DealStageHistory.tsx` antes de renderizar (T011)
- Activities já vêm em DESC do backend — não precisam de reversão (T012)
- `pnpm exec tsc --noEmit` é o linter desta feature (Next.js 16 não tem `next lint`)
