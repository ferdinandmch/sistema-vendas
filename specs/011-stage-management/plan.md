# Implementation Plan: Stage Management CRUD + Ordering

**Branch**: `011-stage-management` | **Date**: 2026-03-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/011-stage-management/spec.md`

## Summary

Implementar a página `/settings/stages` com CRUD completo de stages e reordenação por drag-and-drop. O backend recebe ajustes cirúrgicos (3 gaps de integridade + novo endpoint de reorder). O frontend é inteiramente novo: página de settings, lista sortável com DnD, Dialog modal para criar/editar, e link de navegação no layout privado.

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: Next.js 16 App Router, TanStack Query v5, shadcn/ui, @dnd-kit/core + @dnd-kit/utilities, Clerk v7, Zod, Prisma 6
**Storage**: PostgreSQL via Prisma — zero migrações (schema já tem tudo)
**Testing**: Vitest (testes unitários existentes); validação visual via quickstart.md
**Target Platform**: Desktop — página administrativa de configuração
**Performance Goals**: Operações de configuração são baixa frequência; responsividade imediata na UI
**Constraints**: Backend como fonte única de verdade; `position` sempre sequencial; stages globais (sem ownerId)
**Scale/Scope**: Single-user; volume máximo de ~20 stages

## Constitution Check

| Gate | Status | Notes |
|------|--------|-------|
| Backend é fonte única de verdade | ✅ PASS | Toda mutação vai ao backend; frontend sem lógica de domínio |
| Mutações definem side effects de persistência | ✅ PASS | Reorder é atômico via `$transaction`; delete renumera na mesma transação |
| Sem hard-delete path para deals | ✅ PASS | Feature não toca em deals |
| Mutações de stage definem fronteiras transacionais | ✅ PASS | Reorder e delete+renumber são transacionais |
| Auth, `owner_id` scoping e Clerk cobertos | ✅ PASS | `requireAuthenticatedUser()` em todas as rotas; stages são globais (sem ownerId por design) |
| Contratos de API, validação e erros padronizados | ✅ PASS | Zod schemas + errorResponse helper já estabelecidos |
| Skills de domínio listadas | ✅ PASS | frontend-design, shadcn-ui, next-best-practices, tanstack-query-best-practices |

**Resultado: 7/7 PASS — sem violações.**

## Project Structure

### Documentation (this feature)

```text
specs/011-stage-management/
├── plan.md              ← este arquivo
├── research.md          ← decisões arquiteturais
├── data-model.md        ← tipos frontend + query keys
├── quickstart.md        ← passos de validação
├── contracts/
│   └── stage-management-contracts.md  ← contratos dos endpoints
└── tasks.md             ← gerado por /speckit-tasks
```

### Source Code Changes

```text
# Arquivos modificados (backend — gaps de integridade)
lib/stages/stage-service.ts         ← deleteStage: deal count check + renumber positions
                                    ← createStage/updateStage: won/lost uniqueness check
lib/validation/stages.ts            ← reorderStagesSchema (novo)
app/api/stages/[id]/route.ts        ← DELETE já existente, ajuste na resposta de erro

# Arquivos novos (backend)
app/api/stages/reorder/route.ts     ← POST /api/stages/reorder

# Arquivos modificados (frontend)
app/(private)/layout.tsx            ← adiciona link de navegação para /settings/stages

# Arquivos novos (frontend)
app/(private)/settings/stages/page.tsx        ← Server Component: auth + render client
components/settings/StagesPageClient.tsx      ← "use client": orchestrador da página
components/settings/StageList.tsx             ← lista sortável com DnD (@dnd-kit)
components/settings/StageFormDialog.tsx       ← Dialog modal: criar e editar stage
components/settings/StageDeleteButton.tsx     ← botão de exclusão com feedback de erro inline
lib/settings/api.ts                           ← fetch functions para settings (stages CRUD + reorder)
lib/query-keys.ts                             ← adiciona settingsStageKeys
```

## Domain Alignment

- **System Classification**: Fineo é um sales OS auditável. Stage Management é a camada de configuração estrutural — não operacional.
- **Affected Modules**: Module 5 UI (nova rota de settings); Module 1 Core Pipeline (stages existentes recebem novos guards)
- **State Transitions**: Nenhuma transição de deal nesta feature. Stages mudam `position`, `name`, `isFinal`, `finalType`.
- **Ownership Model**: Stages são globais (sem `ownerId`). Auth requerida para todas as operações mas sem scoping por usuário.
- **Skills Used**: `frontend-design`, `shadcn-ui`, `web-design-guidelines`, `next-best-practices`, `tanstack-query-best-practices`, `postgresql-code-review`

## Architecture Decisions

### A. Backend: 3 gaps cirúrgicos antes do frontend

O backend de stages já está funcional (GET, POST, PUT, DELETE + Zod schemas). Faltam apenas:

1. **`deleteStage`**: verificar `_count.deals > 0` antes de deletar; se bloqueado retornar `STAGE_HAS_DEALS`; se permitido deletar + renumerar posições na mesma `$transaction`
2. **`createStage` / `updateStage`**: verificar unicidade de `won`/`lost` antes de persistir; retornar `DUPLICATE_FINAL_TYPE` se violado
3. **`POST /api/stages/reorder`**: novo endpoint + `reorderStages` service usando `$transaction` para atualizar todos os `position` atomicamente

### B. Novo endpoint: `POST /api/stages/reorder`

```ts
// Payload
{ stages: Array<{ id: string; position: number }> }

// Response 200
{ stages: Stage[] }

// Validação backend:
// - IDs devem existir
// - positions devem ser sequenciais (1..N sem gaps)
// - atualização em $transaction
```

### C. Renumeração após exclusão

```ts
// Após deletar stage na position P:
// Decrementar position de todos os stages com position > P
await prisma.$transaction([
  prisma.pipelineStage.delete({ where: { id } }),
  prisma.pipelineStage.updateMany({
    where: { position: { gt: deletedPosition } },
    data: { position: { decrement: 1 } },
  }),
])
```

### D. Validação won/lost única

```ts
// Em createStage e updateStage:
if (data.finalType) {
  const existing = await prisma.pipelineStage.findFirst({
    where: { finalType: data.finalType, id: { not: id } }, // id: undefined em create
  });
  if (existing) throw duplicateFinalTypeError(data.finalType);
}
```

### E. Frontend: página de settings com design refinado

Direção estética (via `frontend-design` skill): **refined administrative minimalism** — typografia clara com hierarquia forte, lista com linhas definidas, ações contextuais discretas. Nada de cards coloridos ou excesso de decoração. O usuário está configurando o sistema, não navegando conteúdo.

```
/settings/stages
├── Header: "Stages" + botão "Novo stage" (abre Dialog)
├── StageList: lista ordenada por position, cada linha com:
│   ├── GripVertical (drag handle, @dnd-kit)
│   ├── Badge position (#1, #2...)
│   ├── Nome do stage
│   ├── Badge "Final: won" ou "Final: lost" (se isFinal)
│   ├── Botão "Editar" (abre Dialog com dados preenchidos)
│   └── StageDeleteButton (delete com erro inline)
└── StageFormDialog: Dialog modal compartilhado para criar e editar
    ├── Input nome
    ├── Switch isFinal
    ├── Select finalType (visível apenas se isFinal = true)
    └── Botões Cancelar / Salvar
```

### F. TanStack Query: query keys e invalidação

```ts
// lib/query-keys.ts — novo
settingsStageKeys = {
  all: ["settings", "stages"] as const,
  list: () => [...settingsStageKeys.all, "list"] as const,
}

// Após criar/editar/excluir/reorder:
queryClient.invalidateQueries({ queryKey: settingsStageKeys.list() })
queryClient.invalidateQueries({ queryKey: stageKeys.list() }) // invalida pipeline board também
```

### G. Reorder: optimistic update + rollback

Mesmo padrão do DnD do pipeline board (feature 009):

```ts
// onMutate: reorder otimista no cache de settingsStageKeys.list()
// onError: rollback para ordem anterior
// onSettled: invalidate para sincronizar com servidor
```

### H. Navegação no layout privado

Adicionar link "Stages" (ou ícone de settings) no header do `app/(private)/layout.tsx`, apontando para `/settings/stages`. Manter estilo inline existente do layout.

### I. Shadcn componentes necessários

Já instalados: Card, Badge, Separator, Alert
A instalar: Dialog, Switch, Select, Label, Input (form)

## Complexity Tracking

Nenhuma violação da constituição. Feature de configuração sem complexidade de domínio nova.
