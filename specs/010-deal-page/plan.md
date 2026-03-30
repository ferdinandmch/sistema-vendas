# Implementation Plan: Deal Page

**Branch**: `010-deal-page` | **Date**: 2026-03-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/010-deal-page/spec.md`

## Summary

Implementar a página de detalhe de um deal (`/deals/:id`) que exibe dados principais, activities e histórico de stage em layout dois painéis (dados à esquerda, activities + history à direita). A feature consome exclusivamente endpoints já existentes (`GET /api/deals/:id`, `/activities`, `/history`) via TanStack Query com queries paralelas e tratamento de erro por seção. Zero migrações, zero novos endpoints.

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: Next.js 16 App Router, TanStack Query v5, shadcn/ui, Clerk v7, lucide-react
**Storage**: PostgreSQL via Prisma (somente leitura nesta feature — zero migrações)
**Testing**: Vitest (testes unitários existentes); validação visual via quickstart.md
**Target Platform**: Navegadores web modernos (desktop — layout dois painéis responsivo)
**Performance Goals**: Página carrega dados em paralelo; sem bloqueio de uma seção por outra
**Constraints**: Backend como fonte única de verdade; sem lógica de domínio no frontend; sem novos endpoints
**Scale/Scope**: Single-user; volume de activities e history dentro do contexto de um deal individual

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| Backend é fonte única de verdade | ✅ PASS | Feature é 100% leitura; zero mutações no frontend |
| Mutações definem side effects de persistência | ✅ PASS | Nenhuma mutação nesta feature |
| Sem hard-delete path para deals | ✅ PASS | Feature apenas lê deals existentes |
| Mutações de stage definem fronteiras transacionais | ✅ PASS | N/A — nenhuma mutation de stage nesta feature |
| Auth, `owner_id` scoping e Clerk cobertos | ✅ PASS | `requireAuthenticatedUser()` no Server Component; todos os endpoints filtram por `owner_id` |
| Contratos de API, validação e erros padronizados | ✅ PASS | Consumindo contratos existentes (features 003, 005, 006 + envelope 007) |
| Skills de domínio listadas | ✅ PASS | shadcn-ui, web-design-guidelines, tanstack-query-best-practices, next-best-practices, clerk |

**Resultado: 7/7 PASS — sem violações.**

## Project Structure

### Documentation (this feature)

```text
specs/010-deal-page/
|-- plan.md              ← este arquivo
|-- research.md          ← 10 decisões arquiteturais
|-- data-model.md        ← tipos existentes + novos tipos + query keys
|-- quickstart.md        ← 10 passos de validação
|-- contracts/
|   `-- deal-page-queries.md  ← 3 contratos de endpoints consumidos
`-- tasks.md             ← gerado por /speckit-tasks (próxima etapa)
```

### Source Code Changes (repository root)

```text
# Arquivos modificados
lib/pipeline/api.ts          ← adiciona Activity, StageHistoryEntry, fetchDeal, fetchActivities, fetchHistory
lib/query-keys.ts            ← adiciona dealKeys.detail(id), activityKeys, historyKeys
components/pipeline/DealCard.tsx    ← adiciona prop href opcional + Link wrapper
components/pipeline/PipelineColumn.tsx  ← passa href para cada DealCard

# Arquivos novos
app/(private)/deals/[id]/page.tsx   ← Server Component: auth + passa id para client
components/deal/DealPageClient.tsx  ← "use client": 3 queries paralelas + layout dois painéis
components/deal/DealMainInfo.tsx    ← painel esquerdo: dados do deal
components/deal/DealActivitiesList.tsx  ← painel direito, topo: lista de activities
components/deal/DealStageHistory.tsx    ← painel direito, baixo: histórico de stage
components/deal/DealPageSkeleton.tsx    ← skeleton do layout dois painéis
```

## Domain Alignment

- **System Classification**: Auditable sales OS — a Deal Page é uma camada de leitura operacional detalhada, não um módulo de domínio.
- **Affected Modules**: Module 5 UI (nova rota e componentes de leitura); Module 1 Core Pipeline (consumindo deal detail); Module 2 Tracking (consumindo activities); Module 3 Audit (consumindo stage history).
- **State Transitions**: Nenhuma transição de estado nesta feature — leitura pura.
- **Ownership Model**: Clerk session cookie enviado automaticamente. Todos os endpoints verificam `owner_id === user.id`. O Server Component resolve auth antes de renderizar qualquer dado.
- **Skills Used**: `shadcn-ui`, `web-design-guidelines`, `tanstack-query-best-practices`, `next-best-practices`, `clerk`

## Architecture Decisions (summary — full rationale in research.md)

### A. Layout dois painéis (clarificação B1)

- **Painel esquerdo** (fixo, `w-80` ou `1fr`): `DealMainInfo` — todos os campos do deal
- **Painel direito** (`1.5fr`): `DealActivitiesList` empilhada acima de `DealStageHistory`
- Implementado com `grid grid-cols-1 lg:grid-cols-[320px_1fr]` ou equivalente Tailwind
- Responsivo: colapsa para coluna única em mobile

### B. Rota como Server Component

```
app/(private)/deals/[id]/page.tsx  →  Server Component
  requireAuthenticatedUser()       →  resolve auth no servidor
  params.id                        →  async (Next.js 16)
  <DealPageClient id={id} />       →  delega rendering ao client
```

### C. Query keys hierárquicos

```ts
dealKeys.detail(id)           → ["deals", "detail", id]
activityKeys.list(dealId)     → ["activities", "list", dealId]
historyKeys.list(dealId)      → ["history", "list", dealId]
```

### D. Queries paralelas com isolamento de erro

```tsx
// DealPageClient.tsx
const dealQuery    = useQuery({ queryKey: dealKeys.detail(id), queryFn: () => fetchDeal(id) })
const activitiesQ  = useQuery({ queryKey: activityKeys.list(id), queryFn: () => fetchActivities(id) })
const historyQ     = useQuery({ queryKey: historyKeys.list(id), queryFn: () => fetchHistory(id) })
```

- `dealQuery.isError` → erro full-page (deal não encontrado)
- `activitiesQ.isError` → `Alert` destructive apenas na seção de activities
- `historyQ.isError` → `Alert` destructive apenas na seção de history
- Cada seção tem seu próprio `Skeleton` durante loading

### E. Navegação do board

```tsx
// DealCard.tsx — prop href opcional
type Props = { deal: Deal; isPending?: boolean; href?: string }

// Link wrapper (quando href presente)
<Link href={href} className="block cursor-pointer" onClick={(e) => e.stopPropagation()}>
  {/* card body */}
</Link>
// Grip handle
<button {...listeners} {...attributes} onClick={(e) => e.stopPropagation()}>
  <GripVertical />
</button>
```

### F. Ordenação de history na UI

O backend retorna history em `ASC` (mais antigo primeiro). O componente `DealStageHistory` reverte o array antes de renderizar: `[...history].reverse()` para exibição decrescente (mais recente primeiro), conforme spec FR-003.

### G. Componentes shadcn utilizados

- `Card`, `CardHeader`, `CardTitle`, `CardContent` — estrutura dos painéis
- `Badge` — status do deal (active/won/lost)
- `Separator` — divisor entre seções
- `Skeleton` — loading placeholder por seção
- `Alert` — erro por seção (variant destructive)

### H. Zero migrações

Nenhuma migration de banco de dados. Feature consome exclusivamente endpoints existentes.

## Complexity Tracking

Nenhuma violação da constituição. Tabela não aplicável.
