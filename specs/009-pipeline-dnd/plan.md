# Implementation Plan: Pipeline Drag & Drop

**Branch**: `009-pipeline-dnd` | **Date**: 2026-03-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-pipeline-dnd/spec.md`

## Summary

Adicionar drag & drop ao board do pipeline para que o usuário possa mover deals entre stages visualmente. A interação captura `deal.id` e `toStageId` via `@dnd-kit/core` e dispara a mutação `POST /api/deals/:id/move` já existente via TanStack Query `useMutation`. O padrão é **otimista com overlay**: o deal se move imediatamente no cache com opacidade reduzida enquanto a confirmação do backend está pendente, e reverte com toast de erro se falhar. Zero migrações — feature puramente de UI.

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: Next.js 16 App Router, @dnd-kit/core, @dnd-kit/utilities, sonner, TanStack Query v5, shadcn/ui, Clerk v7
**Storage**: PostgreSQL via Prisma (somente leitura nesta feature — zero migrações)
**Testing**: Vitest (unit tests para lógica pura); testes visuais via quickstart.md
**Target Platform**: Web browsers modernos (desktop; touch é comportamento nativo do @dnd-kit)
**Performance Goals**: Feedback visual imediato ao drop; sem bloqueio do board durante mutação
**Constraints**: Backend como fonte única de verdade; sem lógica de domínio no frontend; `@dnd-kit` mandatório pela constituição
**Scale/Scope**: Single-user board; volume de deals/stages dentro do contexto de um pipeline individual

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| Backend é fonte única de verdade | ✅ PASS | Toda regra de domínio permanece no endpoint existente de move stage |
| Mutações definem side effects de persistência | ✅ PASS | `deal_stage_history` e `status` já tratados pelo backend (feature 004) |
| Sem hard-delete path para deals | ✅ PASS | Feature é read + mutation de stage; sem deleção |
| Mutações de stage definem fronteiras transacionais | ✅ PASS | A transação está no backend; frontend apenas dispara o endpoint |
| Auth, `owner_id` scoping e Clerk cobertos | ✅ PASS | O endpoint já exige Clerk auth e filtra por `owner_id`; sem novo middleware |
| Contratos de API, validação e erros padronizados | ✅ PASS | Consumindo contrato existente (feature 004 + 007); `moveDeal` lança em non-ok |
| Skills de domínio listadas | ✅ PASS | shadcn-ui, web-design-guidelines, tanstack-query-best-practices, next-best-practices, clerk |

**Resultado: 5/5 PASS — sem violações.**

## Project Structure

### Documentation (this feature)

```text
specs/009-pipeline-dnd/
|-- plan.md              ← este arquivo
|-- research.md          ← 10 decisões arquiteturais documentadas
|-- data-model.md        ← tipos existentes + novos tipos de estado DnD
|-- quickstart.md        ← 10 passos de validação
|-- contracts/
|   `-- move-deal-contract.md  ← contrato do endpoint consumido
`-- tasks.md             ← gerado por /speckit-tasks (próxima etapa)
```

### Source Code Changes (repository root)

```text
# Packages a instalar
@dnd-kit/core
@dnd-kit/utilities
sonner (via pnpm dlx shadcn@latest add sonner)

# Arquivos modificados
lib/pipeline/api.ts                           ← adiciona moveDeal()
components/pipeline/DealCard.tsx              ← adiciona grip handle + isDragging/isPending
components/pipeline/PipelineColumn.tsx        ← adiciona useDroppable + isOver highlight
components/pipeline/PipelineBoard.tsx         ← adiciona DndContext, DragOverlay, useMutation
app/(private)/layout.tsx                      ← adiciona <Toaster />

# Arquivos novos
(nenhum arquivo novo de componente — tudo integrado nos existentes)
```

## Domain Alignment

- **System Classification**: Auditable sales OS — o DnD é uma camada de interação, não um módulo de domínio.
- **Affected Modules**: Module 5 UI (interação do board); Module 1 Core Pipeline (consumindo move stage via API)
- **State Transitions**: Deal state transition continua exclusivamente no backend. O frontend espelha o resultado. A transição `stageId: A → B` ocorre via `POST /api/deals/:id/move` — não via mutação direta no frontend.
- **Ownership Model**: Clerk session cookie é enviado automaticamente com cada fetch. O endpoint de move já verifica `owner_id === user.id`. Nenhum novo controle de acesso necessário.
- **Skills Used**: `shadcn-ui`, `web-design-guidelines`, `tanstack-query-best-practices`, `next-best-practices`, `clerk`

## Architecture Decisions (summary — full rationale in research.md)

### A. Componentes modificados (não criados)

Toda a lógica de DnD é integrada nos componentes existentes:

- **`DealCard`**: recebe `useDraggable` internamente. Handle = `GripVertical` (lucide-react) com `{...listeners}` e `{...attributes}`. Cards com `status !== "active"` têm `disabled: true`. Props novas: `isDragging?: boolean`, `isPending?: boolean`.
- **`PipelineColumn`**: recebe `useDroppable({ id: stage.id })`. Prop nova: `isOver` aplicada via `setNodeRef` no container. Highlight: `border-primary/60 bg-primary/5` quando `isOver`. Prop nova: `pendingDealId?: string | null` — passada para cada DealCard.
- **`PipelineBoard`**: recebe `DndContext` + `DragOverlay`. Estado novo: `activeDeal: Deal | null` (para DragOverlay) e `pendingDealId: string | null` (para overlay de opacidade). `useMutation` com padrão canônico de `onMutate/onError/onSettled`.

### B. Fluxo de onDragEnd

```
onDragEnd(event):
  if (!over || over.id === active.data.current.stageId) → setActiveDeal(null), return
  dealId = active.id
  toStageId = over.id
  setActiveDeal(null)
  mutation.mutate({ dealId, toStageId })
```

### C. useMutation — padrão canônico TanStack Query

```
onMutate({ dealId, toStageId }):
  await queryClient.cancelQueries({ queryKey: dealKeys.list() })
  previousDeals = queryClient.getQueryData(dealKeys.list())
  queryClient.setQueryData(dealKeys.list(), old => old.map(
    d => d.id === dealId ? { ...d, stageId: toStageId } : d
  ))
  setPendingDealId(dealId)
  return { previousDeals }

onError(_err, _vars, context):
  queryClient.setQueryData(dealKeys.list(), context.previousDeals)
  toast.error("Não foi possível mover o deal. Tente novamente.")

onSettled():
  setPendingDealId(null)
  queryClient.invalidateQueries({ queryKey: dealKeys.list() })
```

### D. DragOverlay

- Estado `activeDeal` é setado no `onDragStart`
- `DragOverlay` renderiza `<DealCard deal={activeDeal} isDragging />` como ghost flutuante
- O card original recebe `opacity-30` via classe Tailwind quando `deal.id === activeDeal?.id`
- O card pendente na coluna de destino recebe `opacity-50` via `isPending` enquanto mutação corre

### E. Acessibilidade

`@dnd-kit/core` inclui `KeyboardSensor` e `PointerSensor` nativamente. O `DndContext` configura ambos. O handle recebe `{...attributes}` que inclui `role="button"` e `aria-roledescription` automáticos.

### F. Zero migrations

Nenhuma migration de banco de dados. A feature consome exclusivamente o endpoint `POST /api/deals/:id/move` (feature 004) e a query `GET /api/deals` (feature 008).

## Complexity Tracking

Nenhuma violação da constituição. Tabela não aplicável.
