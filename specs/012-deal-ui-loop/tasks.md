# Tasks: Deal Management UI Loop

**Input**: Design documents from `/specs/012-deal-ui-loop/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Não há testes unitários novos para esta feature — lógica de domínio não muda. Validação via quickstart.md (testes manuais). `pnpm test` passa sem regressões.

**Organization**: Tarefas agrupadas por user story para implementação e validação independentes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependências incompletas)
- **[Story]**: User story a que pertence ([US1], [US2], [US3])
- Caminhos exatos de arquivo em todas as descrições

---

## Phase 1: Setup — Instalar Textarea

**Purpose**: Único componente shadcn não instalado que esta feature precisa.

- [ ] T001 Install shadcn Textarea — `pnpm dlx shadcn@latest add textarea` — confirmar `components/ui/textarea.tsx` criado

**Checkpoint**: `components/ui/textarea.tsx` existe. `pnpm exec tsc --noEmit` limpo.

---

## Phase 2: Foundational — Funções de API frontend

**Purpose**: Adicionar as 3 funções de API de escrita em `lib/pipeline/api.ts`. Bloqueia todas as user stories — nenhuma pode começar antes.

**CRITICAL**: Esta fase deve ser completamente concluída antes das fases de user story.

- [ ] T002 Add `createDeal`, `updateDeal`, `createActivity` to `lib/pipeline/api.ts` — seguir padrão existente de `moveDeal` (fetch + check ok + parse envelope + throw Error(message) em caso de erro); `createDeal(input: { companyName: string; stageId: string; contactName?: string; contactDetails?: string; source?: string; experiment?: string; notes?: string; icp?: boolean; nextAction?: string }): Promise<Deal>` → POST /api/deals; `updateDeal(id: string, input: { companyName?: string; contactName?: string|null; contactDetails?: string|null; source?: string|null; experiment?: string|null; notes?: string|null; icp?: boolean; nextAction?: string|null }): Promise<Deal>` → PUT /api/deals/:id; `createActivity(dealId: string, input: { type: ActivityType; content: string }): Promise<Activity>` → POST /api/deals/:id/activities; em cada on error: `const data = await res.json(); throw new Error(data.error.message)`

**Checkpoint**: `lib/pipeline/api.ts` exporta `createDeal`, `updateDeal`, `createActivity`. `pnpm exec tsc --noEmit` sem erros nesse arquivo.

---

## Phase 3: User Story 1 — Criar deal (Priority: P1)

**Goal**: Usuário acessa `/pipeline`, clica em "Novo deal", preenche o formulário compacto (empresa + stage) com opção de expandir para campos adicionais, e o card aparece na coluna correta do pipeline.

**Independent Test**: Acessar `/pipeline`. Clicar "Novo deal". Preencher empresa + stage. Salvar. Verificar card na coluna. Testar toggle "Mais informações". Testar validação sem empresa/stage.

### Implementation for User Story 1

- [ ] T003 [US1] Create `components/pipeline/DealFormDialog.tsx` — "use client"; props: `stages: Stage[]`, `onSuccess: () => void`, `trigger: ReactNode`; Dialog com `DialogTrigger`, `DialogContent`, `DialogHeader` (`DialogTitle` "Novo deal" + `DialogDescription`), `DialogFooter`; estado controlado: `name`, `stageId`, `expanded` (boolean, false por padrão), campos opcionais (`contactName`, `contactDetails`, `source`, `experiment`, `notes`, `icp` boolean, `nextAction`); formulário compacto: Input `companyName` (required) + Select `stageId` (required, mapeia `stages` em `SelectItem`); botão `variant="ghost" size="sm"` com `ChevronDown`/`ChevronUp` (lucide-react) para toggle `expanded`; campos opcionais em `div className={cn(!expanded && "hidden")}`: Input `contactName`, Input `contactDetails`, Input `source`, Input `experiment`, Textarea `notes` (min-h-[80px]), Switch `icp` com Label, Input `nextAction`; empty stages guard: se `stages.length === 0` exibir `Alert` com link `/settings/stages` em vez dos campos; submit via `useMutation` chamando `createDeal`; erro inline `p className="text-sm text-destructive"` acima do `DialogFooter`; on success: `onSuccess()` + `setOpen(false)` + reset state
- [ ] T004 [US1] Update `components/pipeline/PipelineBoard.tsx` — (1) importar `DealFormDialog` e `createDeal`; (2) adicionar header acima do `DndContext` com título "Pipeline" (já existe no page) e botão `"Novo deal"` que abre `DealFormDialog` — passar `stages={sortedStages}` e `onSuccess={() => queryClient.invalidateQueries({ queryKey: dealKeys.list() })}`; (3) atualizar mensagem do estado vazio de stages: substituir "Crie stages via API" por `<Link href="/settings/stages">` com texto "Crie stages em /settings/stages"; botão "Novo deal" fica desabilitado quando `stages.length === 0`

**Checkpoint**: Acessar `/pipeline`. Botão "Novo deal" visível. Criar "Acme Corp" no stage disponível. Card aparece no pipeline. Toggle "Mais informações" exibe campos opcionais. Validação bloqueia submit sem empresa ou stage.

---

## Phase 4: User Story 2 — Editar deal (Priority: P1)

**Goal**: Usuário na página de detalhe clica em "Editar", Dialog abre com todos os campos preenchidos, salva e detalhe + pipeline refletem imediatamente.

**Independent Test**: Acessar `/deals/:id`. Clicar "Editar". Verificar campos preenchidos. Alterar empresa. Salvar. Verificar atualização no detalhe. Voltar ao pipeline e verificar card.

### Implementation for User Story 2

- [ ] T005 [US2] Create `components/deal/DealEditDialog.tsx` — "use client"; props: `deal: Deal`, `open: boolean`, `onOpenChange: (open: boolean) => void`, `onSuccess: () => void`; Dialog controlado (sem trigger interno, sem `DialogTrigger`); estado inicializado com `deal.*` via `useEffect([open, deal])`; campos: Input `companyName` (required), Input `contactName`, Input `contactDetails`, Input `source`, Input `experiment`, Textarea `notes` (min-h-[80px]), Switch `icp` com Label "ICP", Input `nextAction`; sem campo de stage (apenas por DnD); submit via `useMutation` chamando `updateDeal(deal.id, data)`; erro inline `p className="text-sm text-destructive"` acima do `DialogFooter`; `DialogHeader` com `DialogTitle` "Editar deal" + `DialogDescription`; `DialogFooter`: Cancelar + Salvar; on success: `onSuccess()` (que invalida queries externamente) + `onOpenChange(false)`
- [ ] T006 [US2] Update `components/deal/DealPageClient.tsx` — (1) importar `DealEditDialog`, `Button` e adicionar estado `editOpen: boolean`; (2) no painel esquerdo (antes de `<DealMainInfo>`), adicionar linha com título do deal e botão `<Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>Editar</Button>`; (3) renderizar `<DealEditDialog deal={deal} open={editOpen} onOpenChange={setEditOpen} onSuccess={() => { void queryClient.invalidateQueries({ queryKey: dealKeys.detail(id) }); void queryClient.invalidateQueries({ queryKey: dealKeys.list() }); }} />`; importar `useQueryClient` de `@tanstack/react-query`

**Checkpoint**: Acessar `/deals/:id`. Botão "Editar" visível. Editar nome. Salvar. Página reflete novo nome. Voltar ao `/pipeline` e verificar card atualizado.

---

## Phase 5: User Story 3 — Registrar atividade (Priority: P1)

**Goal**: Usuário na página de detalhe vê formulário inline no topo das atividades, seleciona tipo, escreve conteúdo, clica "Registrar" e a atividade aparece imediatamente na lista.

**Independent Test**: Acessar `/deals/:id`. Verificar formulário inline visível. Selecionar tipo "Ligação". Preencher conteúdo. Clicar "Registrar". Atividade aparece no topo da lista. Testar validação sem conteúdo.

### Implementation for User Story 3

- [ ] T007 [US3] Create `components/deal/ActivityForm.tsx` — "use client"; props: `dealId: string`; estado: `type: ActivityType` (default "note"), `content: string` (default ""); Select de tipo com `SelectItem` para note/call/meeting/followup com labels em PT-BR (Nota/Ligação/Reunião/Follow-up); Textarea `content` (placeholder "Descreva a atividade...", rows=3, required); `p className="text-sm text-destructive"` para erro da API; Button "Registrar" (`disabled={mutation.isPending}`, texto "Registrando..." quando pending); `useMutation` chamando `createActivity(dealId, { type, content })`; validação client: `content.trim().length === 0` → setar erro inline sem chamar API; on success: reset state (`type → "note"`, `content → ""`, `error → null`) + `queryClient.invalidateQueries({ queryKey: activityKeys.list(dealId) })` + `queryClient.invalidateQueries({ queryKey: dealKeys.detail(dealId) })`
- [ ] T008 [US3] Update `components/deal/DealActivitiesList.tsx` — importar `ActivityForm`; dentro de `<CardContent>`, adicionar `<ActivityForm dealId={dealId} />` antes do bloco de loading/error/lista existente; adicionar `<Separator className="my-4" />` entre o form e a lista de atividades (importar `Separator` de `@/components/ui/separator`)

**Checkpoint**: Acessar `/deals/:id`. Formulário inline visível com select de tipo e textarea. Registrar "Ligação" com conteúdo. Atividade aparece no topo. Tentar registrar sem conteúdo → erro inline. Verificar que campo "Último toque" atualiza.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verificação final de tipos, regressões e validação completa.

- [ ] T009 [P] Run `pnpm exec tsc --noEmit` — verificar zero erros TypeScript nos arquivos modificados e criados: `lib/pipeline/api.ts`, `components/pipeline/PipelineBoard.tsx`, `components/pipeline/DealFormDialog.tsx`, `components/deal/DealPageClient.tsx`, `components/deal/DealEditDialog.tsx`, `components/deal/DealActivitiesList.tsx`, `components/deal/ActivityForm.tsx`
- [ ] T010 [P] Run `pnpm exec vitest run tests/unit/` — confirmar que todos os testes unitários existentes passam sem regressões
- [ ] T011 Execute todos os 9 passos do `specs/012-deal-ui-loop/quickstart.md` e confirmar que cada um passa

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Sem dependências — iniciar aqui
- **Phase 2 (Foundational)**: Depende de Phase 1 — T002 após T001
- **Phase 3 (US1)**: Depende de Phase 2 — T003 → T004 (sequenciais: T004 importa DealFormDialog de T003)
- **Phase 4 (US2)**: Depende de Phase 2 — T005 → T006 (sequenciais: T006 importa DealEditDialog de T005); independente de Phase 3
- **Phase 5 (US3)**: Depende de Phase 2 — T007 → T008 (sequenciais: T008 importa ActivityForm de T007); independente de Phases 3 e 4
- **Phase 6 (Polish)**: Depende de todas as fases anteriores

### Parallel Opportunities

```
Phase 1: T001
Phase 2: T002
Phase 3+4+5 (em paralelo após Phase 2):
  US1: T003 → T004
  US2: T005 → T006
  US3: T007 → T008
Phase 6: [T009 ‖ T010] → T011
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002)
3. Complete Phase 3: US1 — criar deal (T003–T004)
4. Validar que é possível criar deals pela UI e o pipeline reflete

### Incremental Delivery

1. Setup + Foundational (Phases 1–2)
2. US1: criar deal + botão no pipeline (Phase 3) ← primeiro valor visível
3. US2: editar deal na página de detalhe (Phase 4) ← ciclo CRUD sem exclusão
4. US3: registrar atividade inline (Phase 5) ← loop completo de trabalho diário
5. Polish final (Phase 6)

---

## Notes

- [P] tasks = arquivos diferentes, sem dependências incompletas
- T003 (DealFormDialog) é prerequisito direto de T004 — sequenciais no mesmo phase
- T005 (DealEditDialog) é prerequisito direto de T006 — sequenciais no mesmo phase
- T007 (ActivityForm) é prerequisito direto de T008 — sequenciais no mesmo phase
- Phases 3, 4, 5 são independentes entre si — podem ser implementadas em paralelo por agentes distintos após Phase 2
- Zero backend novo — todas as APIs já existem e foram verificadas
- `Textarea` (T001) é o único componente shadcn a instalar; todos os outros já estão disponíveis
- `createDeal`, `updateDeal`, `createActivity` em `lib/pipeline/api.ts` devem seguir o padrão exato de `moveDeal` existente no mesmo arquivo
- Estética: mesma direção "refined administrative clarity" da feature 011 — `space-y-4`, Labels claros, erros em `text-destructive`, loading states com `disabled`
