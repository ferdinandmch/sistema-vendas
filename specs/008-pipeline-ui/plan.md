# Implementation Plan: Pipeline UI

**Branch**: `008-pipeline-ui` | **Date**: 2026-03-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-pipeline-ui/spec.md`

## Summary

Implementar a primeira tela operacional do Fineo Pipeline: um board Kanban que exibe stages como colunas (ordenadas por `position`) e deals como cards (agrupados por `stage_id`). A feature consome as APIs existentes (`GET /api/stages`, `GET /api/deals`) e estabelece a infraestrutura de UI (Tailwind CSS, shadcn/ui, TanStack Query) que todas as features de frontend subsequentes irão utilizar.

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: Next.js 16 (App Router), Clerk v7, shadcn/ui + Tailwind CSS (a instalar), TanStack Query `@tanstack/react-query` (a instalar), lucide-react (a instalar com shadcn)
**Storage**: PostgreSQL via Prisma (somente leitura nesta feature — zero migrações)
**Testing**: Vitest — testes de contrato para query keys e agrupamento de dados; inspeção visual para estados de UI
**Target Platform**: Navegadores modernos (desktop-first, scroll lateral em telas estreitas)
**Project Type**: Next.js 16 App Router — Server Components para auth, Client Components para board interativo
**Performance Goals**: Board completo visível em ≤2 segundos; loading skeleton visível antes do conteúdo; carga única por sessão de página (sem refresh automático)
**Constraints**: Nenhuma mutação de domínio; board é somente leitura; estrutura de componentes deve suportar DnD futuro sem reescrita; ownership filtrado pelas APIs (não replicado no client)
**Scale/Scope**: Até 10 stages, até 50+ deals por usuário

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Status | Justificativa |
|---|---|---|
| I. Backend como fonte única de verdade | ✅ PASS | UI apenas lê dados; não executa mutações, não recalcula ownership, não interpreta posições |
| II. Persistência e auditabilidade obrigatórias | ✅ PASS | Feature é somente leitura — sem mutações, sem side effects de persistência |
| III. Sales engine orientado a estado | ✅ PASS | Board reflete estado atual dos deals; agrupamento por `stage_id` vem do backend |
| IV. Consistência transacional e ownership | ✅ PASS | Sem mutações atômicas necessárias; ownership já aplicado nas APIs |
| V. Contratos e validação centralizada | ✅ PASS | Consome contratos padronizados pela feature 007; sem novos endpoints |

**Resultado: 5/5 PASS — sem violações**

## Project Structure

### Documentation (this feature)

```text
specs/008-pipeline-ui/
├── plan.md              ← este arquivo
├── research.md          ← Phase 0
├── data-model.md        ← Phase 1
├── quickstart.md        ← Phase 1
├── contracts/           ← Phase 1
└── tasks.md             ← /speckit.tasks (próxima etapa)
```

### Source Code (novos arquivos desta feature)

```text
app/
└── (private)/
    └── pipeline/
        ├── page.tsx           ← Server Component (substituir placeholder, manter auth check)
        └── loading.tsx        ← Suspense fallback com BoardSkeleton

components/
└── pipeline/
    ├── PipelineBoard.tsx      ← "use client" — Client Component raiz do board
    ├── PipelineColumn.tsx     ← Componente de coluna (um stage)
    ├── DealCard.tsx           ← Componente de card (um deal)
    └── BoardSkeleton.tsx      ← Estado de loading (Skeleton shadcn)

lib/
└── query-keys.ts              ← Query key factory (stageKeys, dealKeys)

providers/
└── QueryProvider.tsx          ← "use client" — TanStack QueryClientProvider
```

**Structure Decision**: Componentes de UI em `components/pipeline/` (colocation por feature, compatível com roadmap futuro). Providers em `providers/` separado para reutilização. Query keys em `lib/query-keys.ts` seguindo o factory pattern do TanStack.

## Domain Alignment

- **System Classification**: Auditable sales operating system / state machine
- **Affected Modules**: Module 5 UI (principal) + Module 0 Auth (autenticação da página)
- **State Transitions**: Nenhuma — feature é somente leitura; nenhuma transição de state é disparada
- **Ownership Model**: Ownership já aplicado nas APIs (`GET /api/deals` retorna apenas deals do usuário autenticado); UI não replica nem verifica ownership
- **Skills Used**: `shadcn-ui`, `web-design-guidelines`, `tanstack-query-best-practices`, `next-best-practices`, `clerk-nextjs-patterns`

## Phase 0: Research

### Decisão 1: Setup de UI — Tailwind CSS + shadcn/ui

**Situação**: O projeto não tem Tailwind CSS nem shadcn/ui. A constituição os lista como stack obrigatório. Esta feature é a primeira de UI — é o momento correto para o setup completo.

**Decisão**: Executar setup completo de Tailwind CSS + shadcn/ui no início da implementação, antes de qualquer componente.

**Sequência de setup**:
1. Instalar Tailwind CSS e configurar `tailwind.config.ts` e `postcss.config.mjs`
2. Inicializar shadcn/ui com `pnpm dlx shadcn@latest init`
3. Substituir CSS inline do `globals.css` por CSS variables do shadcn + variáveis de tema do projeto
4. Instalar componentes fundação: `card`, `badge`, `skeleton`

**Alternativa rejeitada**: Continuar com CSS inline — incompatível com shadcn/ui e bloquearia features de UI subsequentes.

---

### Decisão 2: TanStack Query — Provider e configuração

**Situação**: TanStack Query não está instalado. A constituição o lista como obrigatório para features com caching ou estado async de cliente.

**Decisão**: Instalar `@tanstack/react-query` e criar `QueryProvider` no layout `(private)` (não no root layout global), pois o board é a primeira feature client-side.

**Configuração de staleTime**: `Infinity` para stages e deals nesta feature — a spec define carga única por sessão (FR-010). Isso evita background refetch desnecessário. A feature 009 (DnD) introduzirá invalidação explícita após mutação.

**Query key factory** (seguindo `qk-factory-pattern`):

```typescript
// lib/query-keys.ts
export const stageKeys = {
  all: ['stages'] as const,
  list: () => [...stageKeys.all, 'list'] as const,
}

export const dealKeys = {
  all: ['deals'] as const,
  list: () => [...dealKeys.all, 'list'] as const,
}
```

**Alternativa rejeitada**: Strings avulsas como query keys — causa inconsistência em invalidações futuras (feature 009).

---

### Decisão 3: RSC Boundaries — Server vs Client Components

**Situação**: Next.js App Router mistura Server Components (RSC) e Client Components. O board precisa ser Client Component para suportar DnD no futuro (FR-009).

**Decisão**:
- `page.tsx` — Server Component: valida autenticação, renderiza `<PipelineBoard />` sem passar dados
- `PipelineBoard.tsx` — Client Component (`"use client"`): usa TanStack Query para buscar stages e deals independentemente
- `loading.tsx` — Server Component: Suspense fallback com `<BoardSkeleton />`

**Motivo**: Passar dados do Server para o Client via props é possível, mas força hidratação de payload potencialmente grande. O Client Component fetching com TanStack Query é mais resiliente, suporta loading/error states granulares e está alinhado com o padrão estabelecido na constituição.

**Gotcha do next-best-practices**: Nunca criar async Client Components — `PipelineBoard` usa `useQuery`, não `async/await`.

---

### Decisão 4: Agrupamento de deals por stage_id

**Situação**: A API retorna deals como lista plana. O board precisa de deals agrupados por coluna.

**Decisão**: Agrupar no Client Component com `useMemo` após receber os dados de ambas as queries. O agrupamento é pura organização de exibição (BR-002) — não constitui lógica crítica de domínio.

```typescript
const dealsByStage = useMemo(() => {
  if (!deals) return {}
  return deals.reduce((acc, deal) => {
    const key = deal.stageId
    if (!acc[key]) acc[key] = []
    acc[key].push(deal)
    return acc
  }, {} as Record<string, Deal[]>)
}, [deals])
```

**BR-005 compliance**: Deals com `stageId` sem correspondência em nenhum stage são simplesmente ignorados — nunca aparecem no board.

---

### Decisão 5: Tratamento de erro independente por query

**Situação**: Stages e deals são queries independentes. A falha de uma não deve bloquear a exibição da outra.

**Decisão**: Cada query tem seu próprio estado de `isError`. O componente de board renderiza:
- `isError` em stages → mensagem de erro no lugar das colunas
- `isError` em deals → colunas renderizadas, mas com mensagem de erro no lugar dos cards
- Ambos com erro → duas mensagens de erro independentes

**Alinhamento com spec**: FR-005, User Story 3 Acceptance Scenario 3.

---

### Decisão 6: Estrutura de DealCard para DnD futuro

**Situação**: FR-009 exige que o layout do board suporte drag & drop futuro sem reestruturação.

**Decisão**: `DealCard` recebe `deal` como prop e é um componente puro de exibição. O identificador `deal.id` fica disponível como `data-deal-id` no DOM. Quando a feature 009 chegar, o wrapper de DnD é adicionado fora de `DealCard`, não dentro — mantendo o card como componente de exibição limpo.

---

### Decisão 7: Componentes shadcn/ui para o board

| Elemento de UI | Componente shadcn |
|---|---|
| Deal card container | `Card`, `CardHeader`, `CardContent` |
| Status do deal | `Badge` (variant por status) |
| Loading das colunas | `Skeleton` |
| Ícones | `lucide-react` (instalado com shadcn) |

**Mapeamento de Badge por status**:
- `active` → variant `default` (azul/primário)
- `won` → variant `secondary` (verde via token customizado)
- `lost` → variant `destructive` (vermelho)

---

## Phase 1: Design e Contratos

### Data Model

Ver [data-model.md](./data-model.md) — sem novas entidades de banco. O board é derivado de dados existentes.

### API Contracts

Ver [contracts/api-contracts.md](./contracts/api-contracts.md) — sem novos endpoints. Consomem contratos existentes da feature 007.

### Componentes e Responsabilidades

#### `app/(private)/pipeline/page.tsx` (Server Component)

```
Responsabilidade: validar autenticação server-side → renderizar <PipelineBoard />
Sem passagem de dados para props → board fetcha autonomamente
Mantém: requireAuthenticatedUser() para segurança de rota
```

#### `app/(private)/pipeline/loading.tsx` (Server Component)

```
Responsabilidade: Suspense fallback da rota
Renderiza: <BoardSkeleton /> — N colunas de Skeleton
```

#### `providers/QueryProvider.tsx` ("use client")

```
Responsabilidade: Envolver (private)/layout.tsx com QueryClientProvider
QueryClient config: staleTime padrão = Infinity, gcTime = 5min
```

#### `components/pipeline/PipelineBoard.tsx` ("use client")

```
Inputs: nenhum (fetcha internamente)
Queries: useQuery(stageKeys.list()) + useQuery(dealKeys.list())
Lógica: groupDealsByStage(deals) com useMemo
Estados: loading (BoardSkeleton) | error (ErrorMessage) | success (colunas)
Output: <div> horizontal scrollável com N <PipelineColumn />
```

#### `components/pipeline/PipelineColumn.tsx`

```
Props: stage: Stage, deals: Deal[]
Output: header com nome do stage + lista de <DealCard /> ou EmptyColumn
```

#### `components/pipeline/DealCard.tsx`

```
Props: deal: Deal
Output: <Card> com name, company_name, status (Badge), value
Interação: nenhuma (FR-011) — sem onClick ativo
data-deal-id={deal.id} — preparado para DnD (FR-009)
```

#### `components/pipeline/BoardSkeleton.tsx`

```
Output: 3 colunas Skeleton simulando o board em loading
Usado em: loading.tsx e PipelineBoard enquanto queries pendentes
```

#### `lib/query-keys.ts`

```
Exports: stageKeys, dealKeys — factory pattern (qk-factory-pattern)
```

### Fluxo de dados completo

```
page.tsx (RSC)
  └─ requireAuthenticatedUser() ─── protege a rota
  └─ <PipelineBoard /> ────────────── Client Component

PipelineBoard ("use client")
  ├─ useQuery(stageKeys.list()) ──── GET /api/stages → { stages: Stage[] }
  ├─ useQuery(dealKeys.list()) ───── GET /api/deals → { deals: Deal[] }
  ├─ useMemo: groupDealsByStage ──── agrupa deals por stageId
  └─ renderiza stages.sort(position)
       └─ <PipelineColumn> por stage
             └─ <DealCard> por deal do stage
```

## Complexity Tracking

Nenhuma violação constitucional — tabela não aplicável.
