# Research: Deal Page

**Feature**: 010-deal-page
**Date**: 2026-03-30

---

## Decision 1 — Layout: dois painéis (left/right)

**Decision**: Layout em dois painéis — painel esquerdo com dados principais do deal (fixo), painel direito com activities empilhadas acima do histórico de stage.

**Rationale**: Definido no clarify (Q1 → B1). Padrão adotado por ferramentas de vendas como HubSpot e Linear: entidade principal sempre visível à esquerda enquanto o feed de eventos fica à direita. Mantém o contexto do deal enquanto o usuário percorre o histórico.

**Alternatives considered**: Coluna única (mais simples, mas menos escanável operacionalmente); top + duas colunas (mais fragmentado para esta quantidade de dados).

---

## Decision 2 — Rota: `app/(private)/deals/[id]/page.tsx` como Server Component

**Decision**: A rota `/deals/[id]` é implementada como Server Component dentro do layout privado existente. A autenticação é resolvida no servidor via `requireAuthenticatedUser()` — consistente com todas as outras rotas privadas.

**Rationale**: Seguindo `next-best-practices`: Server Components são o padrão para páginas do App Router. O `id` vem de `params` (async no Next.js 16). O layout privado já lida com header e QueryProvider — nenhum novo middleware necessário.

**Alternatives considered**: Client Component direto — rejeitado porque perde o benefício de resolver auth no servidor antes de renderizar qualquer coisa.

---

## Decision 3 — Query keys: factory pattern hierárquico

**Decision**: Estender `lib/query-keys.ts` com:
- `dealKeys.detail(id: string)` → `["deals", "detail", id]`
- `activityKeys.list(dealId: string)` → `["activities", "list", dealId]`
- `historyKeys.list(dealId: string)` → `["history", "list", dealId]`

**Rationale**: Seguindo `qk-factory-pattern` e `qk-hierarchical-organization` do TanStack Query best practices. Keys hierárquicas permitem invalidação granular futura (ex: invalidar só o detail de um deal sem afetar a list). Separar `activityKeys` e `historyKeys` em namespaces próprios evita colisão com `dealKeys`.

**Alternatives considered**: Usar strings simples — rejeitado porque viola `qk-array-structure` e impede invalidação hierárquica.

---

## Decision 4 — Queries paralelas independentes por seção

**Decision**: Três `useQuery` separados — deal detail, activities e history — disparados em paralelo dentro do `DealPageClient`. Cada query tem seu próprio `isLoading`, `isError` e `data`.

**Rationale**: Seguindo `parallel-use-queries` do TanStack Query best practices. Isolamento de falhas: se activities falhar, deal e history continuam funcionando (BR-005). Segue o padrão canônico de TanStack Query para recursos independentes.

**Alternatives considered**: `Promise.all` via `useQueries` — considerado, mas três `useQuery` separados são mais legíveis para recursos com tratamentos de erro distintos. `useQueries` seria preferido se o número de queries fosse dinâmico.

---

## Decision 5 — Fetch functions: estender `lib/pipeline/api.ts`

**Decision**: Adicionar `fetchDeal(id)`, `fetchActivities(dealId)` e `fetchHistory(dealId)` ao arquivo existente `lib/pipeline/api.ts`, onde o tipo `Deal` já está definido. Adicionar também os tipos `Activity` e `StageHistoryEntry` no mesmo arquivo.

**Rationale**: `Deal` já está em `lib/pipeline/api.ts`. Manter todos os tipos e fetchers do pipeline no mesmo módulo mantém coesão e evita imports circulares. O padrão de fetch já estabelecido (throw on non-ok, extract from envelope) é reutilizado sem alteração.

**Alternatives considered**: Novo arquivo `lib/deal/api.ts` — rejeitado para evitar fragmentação desnecessária de tipos que já co-habitam o módulo pipeline.

---

## Decision 6 — Componentes: diretório `components/deal/`

**Decision**: Criar diretório `components/deal/` com:
- `DealPageClient.tsx` — orchestrator ("use client"), dispara as 3 queries, compõe o layout dois painéis
- `DealMainInfo.tsx` — painel esquerdo, dados do deal
- `DealActivitiesList.tsx` — seção superior do painel direito
- `DealStageHistory.tsx` — seção inferior do painel direito
- `DealPageSkeleton.tsx` — skeleton de loading para o layout dois painéis

**Rationale**: Separar componentes por domínio (`deal/`) em vez de co-locar na rota segue o padrão já estabelecido em `components/pipeline/`. Facilita reutilização futura e mantém a rota `page.tsx` limpa.

**Alternatives considered**: Co-locar na rota `app/(private)/deals/[id]/` — válido, mas inconsistente com a estrutura existente.

---

## Decision 7 — Navegação do board: DealCard recebe `href` opcional

**Decision**: `DealCard` recebe prop `href?: string`. Quando presente, o corpo do card (exceto o grip handle) é envolvido em um `Link` do Next.js. O grip handle recebe `onClick={(e) => e.stopPropagation()}` para impedir navegação acidental durante o setup do drag.

**Rationale**: Preserva o contrato do `useDraggable` (o grip handle é o único elemento com `{...listeners}`) sem reescrever a lógica de DnD. Link nativo do Next.js garante prefetch automático e acessibilidade (`<a>` semântico). `PipelineColumn` passa `href={/deals/${deal.id}}` para cada DealCard.

**Alternatives considered**: `router.push` com `onClick` no Card — rejeitado porque perde o prefetch automático e a acessibilidade do `<a>` nativo.

---

## Decision 8 — Skeleton por seção com `Skeleton` do shadcn

**Decision**: `DealPageSkeleton` usa o componente `Skeleton` do shadcn para replicar o layout dos dois painéis durante o loading do deal principal. As seções de activities e history têm seus próprios skeletons menores exibidos durante o loading individual.

**Rationale**: Seguindo shadcn skill: "Use `Skeleton` for loading placeholders. No custom `animate-pulse` divs." O skeleton do layout completo reduz o layout shift percebido.

**Alternatives considered**: Spinner global — rejeitado porque não preserva o layout e causa mais layout shift.

---

## Decision 9 — Tratamento de erro por seção com `Alert` do shadcn

**Decision**: Cada seção (activities, history) usa `Alert` do shadcn com `variant="destructive"` para exibir erros de query independentes. O erro do deal principal (404 ou falha) exibe um estado de erro full-page com link de volta ao board.

**Rationale**: Seguindo shadcn skill: "Callouts use `Alert`. Don't build custom styled divs." O `Alert` mantém consistência visual com o design system. Erros isolados por seção implementam BR-005 (falhas secundárias não bloqueiam o deal principal).

**Alternatives considered**: `toast.error` — rejeitado para erros persistentes de seção. Toast é adequado para erros transitórios de mutação (já usado na feature 009), não para falhas de carregamento de dados.

---

## Decision 10 — Zero migrações, zero novos endpoints

**Decision**: Feature 010 não cria nenhuma migration de banco de dados e não cria nenhum novo API route. Consome exclusivamente os 3 endpoints existentes: `GET /api/deals/:id`, `GET /api/deals/:id/activities`, `GET /api/deals/:id/history`.

**Rationale**: Todos os dados necessários já estão disponíveis no backend e padronizados pela feature 007. A feature é puramente de UI — leitura de dados existentes. Zero impacto no banco ou nas APIs.

**Alternatives considered**: N/A — não há alternativa que mantenha o princípio I da constituição (backend como fonte única de verdade) e ainda assim crie nova lógica de domínio.
