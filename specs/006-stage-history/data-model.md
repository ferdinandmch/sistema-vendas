# Data Model: Historico de Movimentacao de Deals

**Branch**: `006-stage-history` | **Date**: 2026-03-29

## Entity: DealStageHistory (existente, somente leitura)

Registro de transicao de stage de um deal. Criado automaticamente pela
feature 004 (stage-movement). Nenhuma alteracao de schema nesta feature.

### Fields

| Field       | Type     | Nullable | Default | Description                      |
|-------------|----------|----------|---------|----------------------------------|
| id          | String (CUID) | No | cuid()  | Identificador unico              |
| dealId      | String   | No       | —       | FK para Deal                     |
| fromStageId | String   | No       | —       | FK para PipelineStage (origem)   |
| toStageId   | String   | No       | —       | FK para PipelineStage (destino)  |
| changedAt   | DateTime | No       | now()   | Momento da transicao             |

### Relationships

| Relation  | Target        | Type     | onDelete | Description                     |
|-----------|---------------|----------|----------|---------------------------------|
| deal      | Deal          | Many→One | Cascade  | Historico pertence a um deal    |
| fromStage | PipelineStage | Many→One | Restrict | Stage de origem da transicao    |
| toStage   | PipelineStage | Many→One | Restrict | Stage de destino da transicao   |

### Indexes

| Index                         | Columns            | Purpose                            |
|-------------------------------|--------------------|------------------------------------|
| @@index([dealId, changedAt])  | dealId, changedAt  | Otimiza listagem por deal ordenada |

### Table Mapping

- Model: `DealStageHistory`
- Table: `deal_stage_history` (via `@@map("deal_stage_history")`)
- Fields: snake_case mapping (`deal_id`, `from_stage_id`, `to_stage_id`,
  `changed_at`)

## Entity: Deal (existente, nao modificado)

### Fields Utilized

| Field   | Type   | Usage                                    |
|---------|--------|------------------------------------------|
| id      | String | Identificar deal para consulta           |
| ownerId | String | Validar ownership antes de retornar dados |

## Entity: PipelineStage (existente, nao modificado)

### Fields Utilized

| Field | Type   | Usage                                    |
|-------|--------|------------------------------------------|
| id    | String | Identificar stage                        |
| name  | String | Enriquecer historico com nome legivel     |

## Response Shape

Cada registro de historico retornado pela API inclui stage embed:

```json
{
  "id": "clxyz...",
  "dealId": "clxyz...",
  "fromStageId": "clxyz...",
  "toStageId": "clxyz...",
  "changedAt": "2026-03-29T15:00:00.000Z",
  "fromStage": { "id": "clxyz...", "name": "Prospecting" },
  "toStage": { "id": "clxyz...", "name": "Proposal" }
}
```

## Schema Changes

Nenhuma. O modelo DealStageHistory ja existe com todas as relacoes e indices
necessarios. Nenhuma migracao necessaria.
