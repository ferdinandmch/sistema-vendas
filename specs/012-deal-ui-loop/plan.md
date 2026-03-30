# Implementation Plan: Deal Management UI Loop

**Branch**: `012-deal-ui-loop` | **Date**: 2026-03-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/012-deal-ui-loop/spec.md`

## Summary

Fechar o loop mínimo viável do Fineo entregando três formulários de escrita — criar deal, editar deal e registrar atividade — todos 100% frontend. O backend está completo (APIs, services, schemas). Zero migrações. Zero novos endpoints. A feature instala apenas o componente `Textarea` do shadcn e cria 3 novos Client Components mais ajustes nos componentes existentes.

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: Next.js 16 App Router, TanStack Query v5, shadcn/ui, Clerk v7, lucide-react
**Storage**: PostgreSQL via Prisma — zero migrações (schema já tem tudo)
**Testing**: Vitest (testes unitários existentes); validação visual via quickstart.md
**Target Platform**: Desktop — formulários modais e inline em páginas existentes
**Performance Goals**: Feedback imediato pós-submit; invalidação de cache sem delay perceptível
**Constraints**: Backend como fonte única de verdade; sem optimistic update em criação/edição; stage não alterável via edição
**Scale/Scope**: Single-user; volume baixo por sessão

## Constitution Check

| Gate | Status | Notes |
|------|--------|-------|
| Backend é fonte única de verdade | ✅ PASS | Todas as mutações confirmadas pelo servidor antes de refletir na UI |
| Mutações definem side effects de persistência | ✅ PASS | `createActivity` atualiza `lastTouchAt` atomicamente no service existente |
| Sem hard-delete path para deals | ✅ PASS | Feature não toca em deleção |
| Mutações de stage definem fronteiras transacionais | ✅ PASS | Não há novas transações nesta feature |
| Auth, `owner_id` scoping e Clerk cobertos | ✅ PASS | Todas as APIs verificam `requireAuthenticatedUser()` + ownerId scoping existente |
| Contratos de API, validação e erros padronizados | ✅ PASS | Schemas Zod existentes; `errorResponse` helper já usado nas rotas |
| Skills de domínio listadas | ✅ PASS | frontend-design, shadcn-ui, next-best-practices, tanstack-query-best-practices, web-design-guidelines |

**Resultado: 7/7 PASS — sem violações.**

## Project Structure

### Documentation (this feature)

```text
specs/012-deal-ui-loop/
├── plan.md                    ← este arquivo
├── research.md                ← 8 decisões arquiteturais
├── data-model.md              ← tipos, payloads, query keys
├── quickstart.md              ← 10 passos de validação
├── contracts/
│   └── deal-ui-contracts.md  ← contratos dos 3 endpoints consumidos
└── tasks.md                   ← gerado por /speckit-tasks
```

### Source Code Changes

```text
# Arquivos modificados
lib/pipeline/api.ts                      ← + createDeal, updateDeal, createActivity
components/pipeline/PipelineBoard.tsx    ← + botão "Novo deal" + DealFormDialog
components/deal/DealPageClient.tsx       ← + botão "Editar" + DealEditDialog
components/deal/DealActivitiesList.tsx   ← + ActivityForm no topo da lista

# Arquivos novos
components/pipeline/DealFormDialog.tsx   ← criar deal (compacto + expandível)
components/deal/DealEditDialog.tsx       ← editar deal (todos os campos)
components/deal/ActivityForm.tsx         ← formulário inline de atividade
```

## Domain Alignment

- **System Classification**: Fineo é um sales OS auditável. Esta feature adiciona a camada de entrada de dados ao pipeline e ao detalhe de deal — sem alterar o state machine subjacente.
- **Affected Modules**: Module 1 Core Pipeline (criar deal no board) + Module 5 UI (formulários de escrita)
- **State Transitions**: Nenhuma nova transição de estado. `createDeal` cria com `status: "active"`. `updateDeal` não altera status nem stage. `createActivity` não altera status.
- **Ownership Model**: `ownerId` aplicado pelo backend. Frontend envia apenas conteúdo — o servidor injeta `user.id` automaticamente via `requireAuthenticatedUser()`.
- **Skills Used**: `frontend-design`, `shadcn-ui`, `next-best-practices`, `tanstack-query-best-practices`, `web-design-guidelines`

## Architecture Decisions

### A. `DealFormDialog` — criar deal no pipeline

**Arquivo**: `components/pipeline/DealFormDialog.tsx`

- **Trigger**: Botão "Novo deal" no header do `PipelineBoard` (Client Component — acesso ao queryClient)
- **Stage select**: usa `stages` já disponíveis no cache `stageKeys.list()` do PipelineBoard via `useQueryClient().getQueryData` ou `useQuery` sem refetch
- **Empty stages guard**: se `stages.length === 0`, exibir `Alert` com link para `/settings/stages` em vez do formulário
- **Layout**:
  ```
  Dialog
  ├── DialogHeader: "Novo deal" + DialogDescription
  ├── form
  │   ├── Input companyName (obrigatório, required)
  │   ├── Select stageId (obrigatório)
  │   ├── Button ghost "Mais informações" com ChevronDown/Up
  │   ├── [expandido] Input contactName, Input contactDetails
  │   ├── [expandido] Input source, Input experiment
  │   ├── [expandido] Textarea notes
  │   ├── [expandido] Switch icp + Input nextAction
  │   ├── p.text-destructive (erro da API)
  │   └── DialogFooter: Cancelar + Salvar
  ```
- **On success**: `invalidateQueries({ queryKey: dealKeys.list() })` + `setOpen(false)` + reset form

### B. `DealEditDialog` — editar deal na página de detalhe

**Arquivo**: `components/deal/DealEditDialog.tsx`

- **Trigger**: Botão "Editar" no `DealPageClient`, no topo do painel esquerdo ao lado do nome da empresa
- **Pré-fill**: inicializa todos os campos com os valores atuais do `deal` recebido via prop
- **Sem campo de stage**: mudança de stage é exclusiva do DnD no pipeline
- **Layout**:
  ```
  Dialog
  ├── DialogHeader: "Editar deal" + DialogDescription
  ├── form — todos os campos preenchidos
  │   ├── Input companyName (obrigatório)
  │   ├── Input contactName, Input contactDetails
  │   ├── Input source, Input experiment
  │   ├── Textarea notes
  │   ├── Switch icp + Input nextAction
  │   ├── p.text-destructive (erro da API)
  │   └── DialogFooter: Cancelar + Salvar
  ```
- **On success**: `invalidateQueries({ queryKey: dealKeys.detail(deal.id) })` + `invalidateQueries({ queryKey: dealKeys.list() })` + `setOpen(false)`

### C. `ActivityForm` — formulário inline

**Arquivo**: `components/deal/ActivityForm.tsx`

- **Posição**: componente filho de `DealActivitiesList`, renderizado no topo antes da lista
- **Props**: `dealId: string`
- **Layout**:
  ```
  div.space-y-3
  ├── Select type (Nota/Ligação/Reunião/Follow-up) — defaultValue "note"
  ├── Textarea content (placeholder: "Descreva a atividade...", rows=3)
  ├── p.text-destructive (erro da API)
  └── Button "Registrar" (disabled durante isPending)
  ```
- **On success**: reset state (type → "note", content → "") + `invalidateQueries({ queryKey: activityKeys.list(dealId) })` + `invalidateQueries({ queryKey: dealKeys.detail(dealId) })`

### D. Funções de API em `lib/pipeline/api.ts`

```ts
// Adicionar ao arquivo existente:

export async function createDeal(input: {
  companyName: string; stageId: string;
  contactName?: string; contactDetails?: string; source?: string;
  experiment?: string; notes?: string; icp?: boolean; nextAction?: string;
}): Promise<Deal>
// POST /api/deals — on !ok: parse { error.message } e throw Error(message)

export async function updateDeal(id: string, input: {
  companyName?: string; contactName?: string | null; contactDetails?: string | null;
  source?: string | null; experiment?: string | null; notes?: string | null;
  icp?: boolean; nextAction?: string | null;
}): Promise<Deal>
// PUT /api/deals/:id — on !ok: parse { error.message } e throw Error(message)

export async function createActivity(dealId: string, input: {
  type: "note" | "call" | "meeting" | "followup";
  content: string;
}): Promise<Activity>
// POST /api/deals/:id/activities — on !ok: parse { error.message } e throw Error(message)
```

### E. Estética — refined administrative clarity

Seguindo a skill `frontend-design` (mesma direção da feature 011):
- **Formulários**: `space-y-4` entre campos, `Label` + `text-sm` acima de cada campo
- **Toggle expandir**: `Button variant="ghost" size="sm"` com `ChevronDown`/`ChevronUp` (lucide-react) + `cn()` para `hidden`/`block` nos campos opcionais
- **Erros API**: `text-sm text-destructive` logo abaixo do form body, acima dos botões
- **Loading**: botão desabilitado com texto "Salvando..." / "Registrando..."
- **Textarea**: `min-h-[80px]` para notas de deals; `rows=3` para atividades

## Complexity Tracking

Nenhuma violação da constituição. Feature 100% frontend sobre backend completo.
