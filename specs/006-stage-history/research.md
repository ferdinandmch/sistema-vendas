# Research: Historico de Movimentacao de Deals

**Branch**: `006-stage-history` | **Date**: 2026-03-29

## Decision 1: Endpoint structure

- **Decision**: `GET /api/deals/[id]/history` como sub-resource de deals
- **Rationale**: Segue o padrao estabelecido por activities
  (`/api/deals/[id]/activities`). Historico e subordinado ao deal.
- **Alternatives considered**: `/api/history?dealId=X` (top-level) — rejeitado
  porque historico nao existe fora do contexto de um deal.

## Decision 2: Service separation

- **Decision**: Novo modulo `lib/history/history-service.ts` separado do
  deal-service
- **Rationale**: Segue o padrao de activity-service. Historico e uma entidade
  distinta com logica de leitura propria. Mantém deal-service focado em
  mutacoes de deals.
- **Alternatives considered**: Adicionar funcao em deal-service — rejeitado
  para manter separacao de responsabilidades.

## Decision 3: Stage name enrichment strategy

- **Decision**: Usar Prisma include com select para retornar id e name dos
  stages de origem e destino em tempo real
- **Rationale**: Nomes de stages podem mudar (rename). Leitura em tempo real
  garante dados atualizados. O include resolve os joins automaticamente.
- **Alternatives considered**: Armazenar nomes redundantemente no historico —
  rejeitado porque violaria normalizacao e nomes podem ficar desatualizados.

## Decision 4: Ordering strategy

- **Decision**: changedAt ASC (mais antigo primeiro)
- **Rationale**: Historico e uma timeline de eventos — leitura natural e do
  inicio para o fim. Diferente de activities (DESC) onde o mais recente e
  mais relevante.
- **Alternatives considered**: DESC como activities — rejeitado porque timeline
  de transicoes faz mais sentido em ordem cronologica.

## Decision 5: No validation schema needed

- **Decision**: Nenhum schema Zod para body — endpoint e GET-only
- **Rationale**: Nao ha payload de entrada alem do dealId via URL params. Nao
  ha filtros ou query params nesta versao.
- **Alternatives considered**: Schema para query params (paginacao, filtros) —
  rejeitado, pois paginacao esta fora de escopo.

## Decision 6: No new Prisma migration

- **Decision**: Nenhuma alteracao no schema Prisma
- **Rationale**: DealStageHistory ja existe com todas as relacoes e indices
  necessarios. Relacoes fromStage e toStage ja estao definidas. Indice
  @@index([dealId, changedAt]) ja cobre a query de listagem.
- **Alternatives considered**: Nenhuma — schema esta completo.

## Decision 7: Index utilization

- **Decision**: Reutilizar indice existente @@index([dealId, changedAt])
- **Rationale**: O indice composto ja cobre WHERE dealId = ? ORDER BY
  changedAt ASC. Nenhum indice adicional necessario.
- **Alternatives considered**: Indice adicional — desnecessario.

## Decision 8: Response shape with stage embed

- **Decision**: Cada registro de historico inclui fromStage e toStage como
  objetos { id, name } embutidos
- **Rationale**: Permite que o frontend exiba nomes legiveis sem precisar de
  lookup adicional. Seleciona apenas id e name (nao o objeto completo do
  stage) para minimizar payload.
- **Alternatives considered**: Retornar apenas IDs e deixar frontend resolver
  — rejeitado porque viola principio de backend como fonte de verdade e
  geraria N+1 no frontend.
