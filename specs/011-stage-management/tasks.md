# Tasks: Stage Management CRUD + Ordering

**Input**: Design documents from `/specs/011-stage-management/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Não há testes unitários novos para esta feature — lógica de domínio não muda estruturalmente. Validação via quickstart.md (testes manuais). `pnpm test` passa sem regressões.

**Organization**: Tarefas agrupadas por user story para implementação e validação independentes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependências incompletas)
- **[Story]**: User story a que pertence ([US1], [US2], [US3], [US4])
- Caminhos exatos de arquivo em todas as descrições

---

## Phase 1: Setup — Dependências e shadcn components

**Purpose**: Instalar `@dnd-kit/sortable` (ausente) e os shadcn components necessários (Dialog, Switch, Select, Label, Input). `@dnd-kit/core` e `@dnd-kit/utilities` já estão instalados.

- [X] T001 Install `@dnd-kit/sortable` — `pnpm add @dnd-kit/sortable`; confirmar em `package.json`
- [X] T002 [P] Install shadcn Dialog — `pnpm dlx shadcn@latest add dialog` — se ausente em `components/ui/dialog.tsx`
- [X] T003 [P] Install shadcn Switch — `pnpm dlx shadcn@latest add switch` — se ausente em `components/ui/switch.tsx`
- [X] T004 [P] Install shadcn Select — `pnpm dlx shadcn@latest add select` — se ausente em `components/ui/select.tsx`
- [X] T005 [P] Install shadcn Label — `pnpm dlx shadcn@latest add label` — se ausente em `components/ui/label.tsx`
- [X] T006 [P] Install shadcn Input — `pnpm dlx shadcn@latest add input` — se ausente em `components/ui/input.tsx`

**Checkpoint**: `pnpm exec tsc --noEmit` limpo. Todos os componentes disponíveis em `components/ui/`.

---

## Phase 2: Foundational — Backend gaps + infraestrutura compartilhada

**Purpose**: Corrigir os gaps do backend existente e criar a infraestrutura compartilhada de frontend antes de qualquer user story. CRÍTICO: nenhuma user story pode começar antes desta fase estar completa.

**CRITICAL**: Esta fase deve ser completamente concluída antes das fases de user story.

- [X] T007 Add `DUPLICATE_FINAL_TYPE` error code and `duplicateFinalTypeError(type: string)` function to `lib/validation/api-error.ts` — `AppErrorCode` union + error factory; message: `"Já existe um stage com finalType '${type}'"`, status 409
- [X] T008 Update `stageHasDealsError` in `lib/validation/api-error.ts` to accept `count: number` param — change signature to `stageHasDealsError(count: number)` and message to `"Este stage tem ${count} deal(s) ativo(s). Mova-os antes de excluir."`, status 400; NOTA: mesmo arquivo que T007 — executar após T007
- [X] T009 [P] Add `reorderStagesSchema` and `ReorderStagesInput` to `lib/validation/stages.ts` — `z.object({ stages: z.array(z.object({ id: z.string(), position: z.number().int().positive() })).min(1) })`
- [X] T010 [P] Add `settingsStageKeys` to `lib/query-keys.ts` — `{ all: ["settings", "stages"] as const, list: () => [...settingsStageKeys.all, "list"] as const }`
- [X] T011 Create `lib/settings/api.ts` — export `fetchSettingsStages(): Promise<Stage[]>`, `createSettingsStage(input)`, `updateSettingsStage(id, input)`, `deleteSettingsStage(id): Promise<void>`, `reorderSettingsStages(stages: {id,position}[])`; seguir padrão existente de `lib/pipeline/api.ts` (throw on non-ok, extract from envelope); `deleteSettingsStage` extrai `error.message` do body em caso de erro para exibir na UI; importar tipo `Stage` de `lib/pipeline/api.ts`

**Checkpoint**: `lib/validation/api-error.ts` exporta `duplicateFinalTypeError` e `stageHasDealsError(count: number)` (com parâmetro). `lib/validation/stages.ts` exporta `reorderStagesSchema`. `lib/query-keys.ts` exporta `settingsStageKeys`. `lib/settings/api.ts` existe com `reorderSettingsStages` (sem typo). `pnpm exec tsc --noEmit` sem erros nesses arquivos.

---

## Phase 3: User Story 1 — Criar stage (Priority: P1)

**Goal**: Usuário acessa `/settings/stages`, vê a lista de stages existentes, clica em "Novo stage", preenche o Dialog modal e cria um novo stage que aparece imediatamente na lista e no pipeline board.

**Independent Test**: Acessar `/settings/stages`. Clicar em "Novo stage". Criar "Prospecção". Verificar que aparece na lista e em `/pipeline`. Tentar criar segundo stage `won` — verificar bloqueio.

### Implementation for User Story 1

- [X] T012 [US1] Update `createStage` in `lib/stages/stage-service.ts` — antes de `prisma.pipelineStage.create`, verificar se já existe stage com `finalType = data.finalType` quando `data.isFinal && data.finalType`; se existir, throw `duplicateFinalTypeError(data.finalType)`; usar `prisma.pipelineStage.findFirst({ where: { finalType: data.finalType } })`
- [X] T013 [P] [US1] Create `app/(private)/settings/stages/page.tsx` — Server Component; `await requireAuthenticatedUser()`; exportar `generateMetadata` com `title: "Stages | Fineo"`; render `<StagesPageClient />` wrapped em container com heading "Stages"
- [X] T014 [P] [US1] Create `components/settings/StageFormDialog.tsx` — "use client"; props: `stage?: Stage` (absent = create mode, present = edit mode), `onSuccess: () => void`, `trigger: ReactNode`, `currentCount?: number` (para calcular position no create mode); Dialog com `DialogTrigger`, `DialogContent`, `DialogHeader` (com `DialogTitle` e `DialogDescription` para acessibilidade), `DialogFooter`; campos com estado controlado: Input `name` (required), Switch `isFinal`, Select `finalType` (visível apenas se `isFinal = true` — usar `cn()` para condicional, options: won/lost); submit chama `createSettingsStage({ ...data, position: (currentCount ?? 0) + 1 })` em create mode ou `updateSettingsStage(stage.id, data)` em edit mode; exibe erro inline abaixo do formulário se API retornar erro (extraído de `Error.message`); usa `useMutation` internamente; on success: `onSuccess()` + `setOpen(false)`
- [X] T015 [P] [US1] Create `components/settings/StageList.tsx` — "use client"; props: `stages: Stage[]`, `onEdit: (stage: Stage) => void`, `onDelete: (id: string) => void`; lista básica (sem DnD ainda) com cada linha exibindo: `GripVertical` (cursor grab, `text-muted-foreground`, sem classes de sizing — shadcn gerencia), `Badge` variant `outline` com texto `#${stage.position}`, nome do stage em `text-sm font-medium`, `Badge` variant `secondary` com texto `Final: ${stage.finalType}` se `isFinal`, botão "Editar" (chama `onEdit`), **placeholder de exclusão**: `<Button variant="destructive" size="sm">Excluir</Button>` com `onClick={() => onDelete(stage.id)}` — será substituído por `StageDeleteButton` em T026; usar `cn()` para classes condicionais; estética "refined administrative minimalism": `divide-y divide-border` na lista (não `border-b` manual), `py-3 px-4` por linha, `text-muted-foreground` para elementos secundários
- [X] T016 [US1] Create `components/settings/StagesPageClient.tsx` — "use client"; `useQuery({ queryKey: settingsStageKeys.list(), queryFn: fetchSettingsStages })`; renderiza: header com título e `StageFormDialog` (modo create) como "Novo stage" button trigger — passar `currentCount={stages?.length ?? 0}` para cálculo de position (safe mesmo durante loading); loading state com `Skeleton` (replicar estrutura de linha); error state com `Alert` variant destructive; lista via `StageList` passando stages; on mutation success: `queryClient.invalidateQueries({ queryKey: settingsStageKeys.list() })` + `queryClient.invalidateQueries({ queryKey: stageKeys.list() })`; passa callbacks `onEdit` e `onDelete`; `onDelete` faz invalidação das queries
- [X] T017 [P] [US1] Update `app/(private)/layout.tsx` — adicionar link "Stages" no header ao lado do `UserButton`; usar `next/link`; estilo inline consistente com o restante do header existente

**Checkpoint**: Acessar `/settings/stages` via link no header. Criar um stage via Dialog. Verificar que aparece na lista e no pipeline board. Tentar criar segundo `won` — erro exibido no Dialog.

---

## Phase 4: User Story 2 — Editar stage (Priority: P1)

**Goal**: Usuário clica em "Editar" em um stage existente, o Dialog modal abre com os dados preenchidos, o usuário altera nome ou configuração, salva, e a lista reflete imediatamente a mudança.

**Independent Test**: Criar stage "Cold". Clicar em "Editar". Alterar para "Prospecção". Salvar. Verificar lista e pipeline. Tentar editar para nome duplicado — verificar bloqueio.

### Implementation for User Story 2

- [X] T018 [US2] Update `updateStage` in `lib/stages/stage-service.ts` — antes de `prisma.pipelineStage.update`, verificar unicidade de `finalType`: quando `isFinal` vai ser `true` e `finalType` é fornecido, verificar `prisma.pipelineStage.findFirst({ where: { finalType, id: { not: id } } })`; se existir, throw `duplicateFinalTypeError(finalType)`
- [X] T019 [US2] Update `components/settings/StagesPageClient.tsx` — adicionar estado `editingStage: Stage | null`; no callback `onEdit` recebido pelo `StageList`, setar `editingStage`; renderizar `StageFormDialog` adicional com `stage={editingStage}` quando `editingStage !== null`; on success: resetar `editingStage` + invalidar queries

**Checkpoint**: Editar nome de stage via Dialog. Pipeline reflete novo nome. Tentar editar para `won` quando já existe `won` — erro inline no Dialog.

---

## Phase 5: User Story 3 — Reordenar stages (Priority: P1)

**Goal**: Usuário arrasta um stage para nova posição na lista. A nova ordem persiste no banco e o pipeline reflete imediatamente.

**Independent Test**: Criar 3 stages. Arrastar o terceiro para a primeira posição. Recarregar `/settings/stages` e confirmar ordem persistida. Verificar `/pipeline` com colunas na nova ordem.

### Implementation for User Story 3

- [X] T020 [US3] Add `reorderStages` to `lib/stages/stage-service.ts` — função `reorderStages(input: ReorderStagesInput)`; usar `prisma.$transaction(input.stages.map(({ id, position }) => prisma.pipelineStage.update({ where: { id }, data: { position } })))`; retornar stages ordenados por position
- [X] T021 [US3] Create `app/api/stages/reorder/route.ts` — `POST` handler; `requireAuthenticatedUser()`; `parseAndValidate(request, reorderStagesSchema)`; chamar `reorderStages(data)`; retornar `NextResponse.json({ stages })`; tratar erros com `errorResponse`
- [X] T022 [US3] Update `components/settings/StageList.tsx` — substituir lista estática por lista sortável com `@dnd-kit/sortable`: `SortableContext` com `verticalListSortingStrategy`; cada item usa `useSortable({ id: stage.id })`; `DndContext` com `PointerSensor` e `KeyboardSensor`; GripVertical handle conectado a `listeners` e `attributes`; `onDragEnd` chama callback `onReorder(reorderedStages)`; manter visual limpo: item sendo arrastado com `opacity-50`
- [X] T023 [US3] Update `components/settings/StagesPageClient.tsx` — adicionar `useMutation` para reorder: `onMutate` aplica optimistic update no cache de `settingsStageKeys.list()` com nova ordem; `onError` faz rollback para ordem anterior; `onSettled` invalida `settingsStageKeys.list()` e `stageKeys.list()`; passar `onReorder` ao `StageList`

**Checkpoint**: Arrastar stage para nova posição. Recarregar página — ordem persiste. Pipeline board exibe colunas na nova ordem.

---

## Phase 6: User Story 4 — Excluir stage com segurança (Priority: P2)

**Goal**: Usuário tenta excluir um stage. Se tiver deals ativos, vê mensagem com contagem e exclusão é bloqueada. Se não tiver deals, stage é removido e posições são renumeradas.

**Independent Test**: Stage com 2 deals — tentar excluir — verificar mensagem "Este stage tem 2 deal(s) ativo(s)". Stage sem deals — excluir — verificar renumeração de posições.

### Implementation for User Story 4

- [X] T024 [US4] Update `deleteStage` in `lib/stages/stage-service.ts` — (1) buscar stage: `const existing = await prisma.pipelineStage.findUnique({ where: { id } })`; se null throw `stageNotFoundError()`; (2) verificar deals: `const count = await prisma.deal.count({ where: { stageId: id } })`; se `count > 0`, throw `stageHasDealsError(count)`; (3) deletar + renumerar atomicamente: `await prisma.$transaction([ prisma.pipelineStage.delete({ where: { id } }), prisma.pipelineStage.updateMany({ where: { position: { gt: existing.position } }, data: { position: { decrement: 1 } } }) ])` — `existing.position` capturado antes da transação; retornar void; (4) verificar `app/api/stages/[id]/route.ts`: DELETE handler deve retornar `new Response(null, { status: 204 })` no sucesso e `errorResponse(error)` no catch — ajustar se necessário
- [X] T025 [P] [US4] Create `components/settings/StageDeleteButton.tsx` — "use client"; props: `stageId: string`, `onSuccess: () => void`; `useMutation` chamando `deleteSettingsStage(stageId)`; on success: `onSuccess()`; on error: exibir mensagem de erro inline (extraída do Error.message — que contém o texto do backend); botão com variant destructive; sem Dialog de confirmação — erro inline é o guard
- [X] T026 [US4] Update `components/settings/StageList.tsx` — substituir delete placeholder por `<StageDeleteButton stageId={stage.id} onSuccess={() => onDelete(stage.id)} />`

**Checkpoint**: Stage com deals — exclusão bloqueada com mensagem correta. Stage sem deals — excluído e posições renumeradas sequencialmente (verificar via lista após exclusão).

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Verificação final de tipos, regressões e validação completa da feature.

- [X] T027 [P] Run `pnpm exec tsc --noEmit` — verificar zero erros TypeScript em todos os arquivos modificados e criados: `lib/validation/api-error.ts`, `lib/validation/stages.ts`, `lib/query-keys.ts`, `lib/settings/api.ts`, `lib/stages/stage-service.ts`, `app/api/stages/reorder/route.ts`, `app/(private)/settings/stages/page.tsx`, `components/settings/StagesPageClient.tsx`, `components/settings/StageList.tsx`, `components/settings/StageFormDialog.tsx`, `components/settings/StageDeleteButton.tsx`, `app/(private)/layout.tsx`
- [X] T028 [P] Run `pnpm exec vitest run tests/unit/` — confirmar que todos os testes unitários existentes passam sem regressões
- [ ] T029 Execute todos os 10 passos de validação do `specs/011-stage-management/quickstart.md` e confirmar que cada um passa

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Sem dependências — iniciar aqui; T002-T006 paralelos após T001
- **Phase 2 (Foundational)**: Depende de Phase 1 — T007 → T008 sequenciais (mesmo arquivo `api-error.ts`); T009 e T010 paralelos entre si e com T007/T008; T011 após T007+T008+T009+T010
- **Phase 3 (US1)**: Depende de Phase 2 — T012 primeiro (backend); T013-T017 após T012 (T013-T015 paralelos entre si; T016 após T015; T017 independente)
- **Phase 4 (US2)**: Depende de Phase 3 completa — T018 (backend) + T019 (frontend, depende de T016)
- **Phase 5 (US3)**: Depende de Phase 2 — T020 → T021 → T022 → T023
- **Phase 6 (US4)**: Depende de Phase 2 — T024 → T025 (paralelo) → T026
- **Phase 7 (Polish)**: Depende de Phase 6 completa

### Parallel Opportunities

```
Phase 1: T001 → [T002 ‖ T003 ‖ T004 ‖ T005 ‖ T006]
Phase 2: T007 → T008 (mesmo arquivo!) → [T009 ‖ T010] → T011
         (T009, T010 paralelos entre si, mas T011 depende de T007+T008 completos)
Phase 3: T012 → [T013 ‖ T014 ‖ T015 ‖ T017] → T016
Phases 4+5+6: podem rodar em paralelo após Phase 2
  US2: T018 → T019
  US3: T020 → T021 → T022 → T023
  US4: T024 → [T025] → T026
Phase 7: [T027 ‖ T028] → T029
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T006)
2. Complete Phase 2: Foundational (T007–T011)
3. Complete Phase 3: US1 — criar stage (T012–T017)
4. Validar que é possível criar stages pela UI e o pipeline reflete

### Incremental Delivery

1. Setup + Foundational (Phases 1–2)
2. US1: criar stage + página base (Phase 3) ← primeiro valor visível
3. US2: editar stage (Phase 4) ← ciclo completo de CRUD sem exclusão
4. US3: reordenação por DnD (Phase 5) ← pipeline configurável
5. US4: exclusão segura (Phase 6) ← feature completa
6. Polish final (Phase 7)

---

## Notes

- [P] tasks = arquivos diferentes, sem dependências incompletas
- T001 (`@dnd-kit/sortable`) é prerequisito de T022 — instalar primeiro
- T007 e T008 em `api-error.ts` são no mesmo arquivo — rodar sequencialmente ou com cuidado para não sobrescrever
- `stageHasDealsError` já existe em `api-error.ts` mas sem o parâmetro `count` — T008 atualiza a assinatura existente (breaking change interna)
- `StageFormDialog` é compartilhado por US1 (criar) e US2 (editar) via prop `stage?: Stage`
- Optimistic update de reorder (T023) segue o mesmo padrão canônico do DnD de deals (feature 009)
- Após qualquer mutação de stage: invalidar AMBOS `settingsStageKeys.list()` e `stageKeys.list()` para manter pipeline board sincronizado
