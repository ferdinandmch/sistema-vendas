# Research: Activities de Deals

**Branch**: `005-deal-activities` | **Date**: 2026-03-27

## Decision 1: Endpoint Structure

**Decision**: Activities como sub-resource de deals em
`/api/deals/[id]/activities` com GET (list) e POST (create) no mesmo route file.

**Rationale**: Segue padrao RESTful de sub-resources. Activities nao existem
fora do contexto de um deal. O deal_id vem da URL (params), nao do body.
Consistente com o padrao existente de `/api/deals/[id]/move`.

**Alternatives considered**:
- `/api/activities?dealId=xxx` — rejeitado: activities nao sao top-level
  entities e perderiam o contexto hierarquico.
- Endpoints separados para create e list — rejeitado: Next.js App Router
  suporta multiplos metodos no mesmo route.ts.

## Decision 2: Service Layer Separation

**Decision**: Novo modulo `lib/activities/activity-service.ts` separado do
deal-service.

**Rationale**: Activities sao entidade distinta com logica propria (criacao,
listagem, validacao de tipo). Manter no deal-service inflaria o modulo e
misturaria responsabilidades. O activity-service importa prisma e error
factories, mas nao depende de funcoes do deal-service.

**Alternatives considered**:
- Adicionar ao deal-service.ts — rejeitado: violaria single responsibility,
  deal-service ja tem 5 funcoes (listDeals, getDeal, createDeal, updateDeal,
  moveDeal).

## Decision 3: Transaction Strategy

**Decision**: Prisma interactive transaction (`$transaction(async (tx) => ...)`)
para criacao de activity + update de last_touch_at.

**Rationale**: Mesmo padrao usado em moveDeal() (feature 004). Garante
atomicidade: se o insert da activity ou o update do deal falhar, ambas
operacoes sao revertidas. Constituicao (Principio II) exige que "activity
creation MUST update last_touch_at".

**Alternatives considered**:
- Duas operacoes sequenciais sem transacao — rejeitado: violaria atomicidade
  constitucional. Possibilidade de activity sem touch ou touch sem activity.
- Trigger no banco — rejeitado: logica no application layer, nao no banco.

## Decision 4: ActivityType Enum

**Decision**: Enum Prisma `ActivityType` com valores: note, call, meeting,
followup.

**Rationale**: Tipos fixos e conhecidos. Enum garante integridade no nivel do
banco. Consistente com o padrao de DealStatus enum. Zod valida no backend
antes do Prisma.

**Alternatives considered**:
- String livre com validacao Zod apenas — rejeitado: sem constraint no banco,
  dados inconsistentes possiveis via acesso direto.
- Tabela de lookup para tipos — rejeitado: over-engineering para 4 tipos
  fixos. Pode ser migrado no futuro se necessario.

## Decision 5: Ownership Model

**Decision**: Activities herdam ownership do deal. Sem owner_id na tabela
activities. Ownership enforced via deal.owner_id em toda operacao.

**Rationale**: Activity e sub-resource do deal. Adicionar owner_id redundante
criaria inconsistencia potencial (activity com owner diferente do deal).
Pattern existente: deal_stage_history tambem nao tem owner_id.

**Alternatives considered**:
- owner_id direto na activity — rejeitado: redundante e risco de
  inconsistencia. Ownership ja garantida pelo deal.

## Decision 6: Listagem sem Paginacao

**Decision**: Listagem retorna todas as activities do deal sem paginacao.
Ordenacao por created_at DESC.

**Rationale**: Escala esperada: dezenas de activities por deal. Paginacao
adiciona complexidade desnecessaria neste momento. Pode ser adicionada em
feature futura (cursor-based pagination) se volume crescer.

**Alternatives considered**:
- Paginacao desde o inicio — rejeitado: premature optimization. Volume
  esperado nao justifica.

## Decision 7: Index Strategy

**Decision**: Indice composto `[dealId, createdAt]` na tabela activities.

**Rationale**: Query principal e `WHERE deal_id = ? ORDER BY created_at DESC`.
Indice composto cobre exatamente essa query, evitando sort em memoria.
Consistente com o padrao de DealStageHistory (`@@index([dealId, changedAt])`).

**Alternatives considered**:
- Indice apenas em deal_id — rejeitado: nao otimizaria a ordenacao.
- Sem indice adicional — rejeitado: listagem seria full scan + sort.

## Decision 8: Activities em Deals Finalizados

**Decision**: Permitido. Activities podem ser criadas em deals com qualquer
status (active, won, lost).

**Rationale**: Activities registram interacoes reais que acontecem mesmo apos
fechamento (follow-up pos-venda, nota de retrospectiva, ligacao de feedback).
Activity nao altera status do deal.

**Alternatives considered**:
- Bloquear em deals finalizados — rejeitado: limitaria uso legitimo. Status
  do deal e irrelevante para registro de interacao.
