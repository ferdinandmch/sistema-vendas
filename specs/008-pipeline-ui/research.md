# Research: Pipeline UI

**Feature**: 008-pipeline-ui | **Date**: 2026-03-29

## D1 — Setup de UI: Tailwind CSS + shadcn/ui

**Decision**: Executar setup completo de Tailwind CSS + shadcn/ui como primeira fase da implementação.

**Rationale**: O projeto não possui Tailwind nem shadcn/ui. A constituição os lista como stack obrigatório. Esta é a primeira feature de UI — é o momento natural para estabelecer a infraestrutura de design do produto.

**Alternatives considered**:
- Manter CSS inline: rejeitado — incompatível com shadcn/ui e bloquearia features subsequentes
- Adicionar apenas Tailwind sem shadcn: rejeitado — constituição lista shadcn como obrigatório

**Install sequence**:
```bash
pnpm add tailwindcss postcss autoprefixer
pnpm dlx tailwindcss init -p
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add card badge skeleton
```

---

## D2 — TanStack Query: Provider e staleTime

**Decision**: Instalar `@tanstack/react-query`, criar `QueryProvider` no layout `(private)`, configurar `staleTime: Infinity` para stages e deals.

**Rationale**: Feature 008 define carga única por sessão (FR-010). `staleTime: Infinity` impede background refetch desnecessário. A feature 009 introduzirá invalidação explícita. `QueryProvider` no layout `(private)` isola o QueryClient das rotas públicas.

**Alternatives considered**:
- `staleTime: 0` (padrão): refetch em background frequente, desnecessário para carga única
- Provider no root layout global: contamina rotas públicas sem necessidade

**Install**:
```bash
pnpm add @tanstack/react-query
```

---

## D3 — RSC Boundaries: Server vs Client

**Decision**: `page.tsx` = Server Component (auth check). `PipelineBoard` = Client Component (`"use client"`). `loading.tsx` = Suspense fallback.

**Rationale**: O board precisa ser Client Component para suportar TanStack Query (hooks) e futuramente DnD (eventos de interação). A página permanece Server para auth check server-side com Clerk, conforme padrão estabelecido nas features anteriores.

**Gotcha previsto** (next-best-practices): Client Components não podem ser `async`. `PipelineBoard` usa `useQuery`, não `async/await`.

**Alternatives considered**:
- SSR com dehydration/hydration: mais performático, mas adiciona complexidade (QueryClient no server, `<HydrationBoundary>`) sem ganho justificado para carga única nesta feature.

---

## D4 — Agrupamento de deals: client-side com useMemo

**Decision**: Agrupar deals por `stageId` no Client Component via `useMemo` após receber os dados.

**Rationale**: Agrupamento é pura organização de exibição — não constitui lógica crítica de domínio (BR-002). `useMemo` evita recalcular a cada render. Deals com `stageId` inválido são silenciosamente ignorados (BR-005).

**Alternatives considered**:
- Agrupar no backend: adicionaria endpoint novo — fora de escopo da feature 007 (API refinada); viola o princípio de não criar endpoints desnecessários
- Derivar sem `useMemo`: re-agrupa a cada render mesmo sem mudança nos dados

---

## D5 — Erro independente por query

**Decision**: Cada query (stages, deals) tem seu próprio estado de `isError`. Falha em uma não bloqueia a outra.

**Rationale**: Alinhado com FR-005 e User Story 3 (Acceptance Scenario 3). Resiliente a falhas parciais. Feedback visual granular.

**Rendering matrix**:

| stages | deals | Resultado |
|---|---|---|
| loading | loading | BoardSkeleton full |
| success | loading | Colunas com Skeleton de cards |
| success | success | Board completo |
| success | error | Colunas com mensagem de erro |
| error | any | Mensagem de erro no board |

---

## D6 — DealCard preparado para DnD

**Decision**: `DealCard` é componente puro de exibição. `data-deal-id={deal.id}` no elemento raiz. Sem onClick ativo (FR-011).

**Rationale**: FR-009 exige estrutura pronta para DnD sem reestruturação. O wrapper de DnD (`@dnd-kit/core` Draggable) será adicionado em volta de `DealCard` na feature 009 — sem modificar o card internamente.

**Alternatives considered**:
- onClick para deal page: rejeitado — deal page é feature 010, não implementada ainda (FR-011)

---

## D7 — Componentes shadcn selecionados

| Elemento | Componente | Justificativa |
|---|---|---|
| Container do deal | `Card` + `CardContent` | Isolamento visual, bordas, shadow — padrão Kanban |
| Status do deal | `Badge` | Pill colorido semântico |
| Loading state | `Skeleton` | Placeholder animado no lugar de colunas/cards |
| Ícones | `lucide-react` | Instalado automaticamente com shadcn |

**Status → Badge variant mapping**:
- `active` → `default`
- `won` → `secondary` (customizar token para verde)
- `lost` → `destructive`
