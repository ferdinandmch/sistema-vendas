# Data Model: Movimentacao de Deal entre Stages

**Branch**: `004-stage-movement` | **Date**: 2026-03-27

## Changes to Existing Models

### DealStatus Enum (modified)

```prisma
enum DealStatus {
  active
  won    // NEW — deal movido para stage final com final_type=won
  lost   // NEW — deal movido para stage final com final_type=lost
}
```

**Migration required**: ALTER TYPE to add enum values.

### Deal Model (unchanged)

Nenhuma alteracao estrutural. Campos afetados pela movimentacao:
- `stageId` — atualizado para to_stage_id
- `stageUpdatedAt` — atualizado para DateTime da movimentacao
- `status` — atualizado para won/lost quando stage destino e final

## New Models

### DealStageHistory

Registro auditavel de cada movimentacao de stage de um deal.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | PK, cuid() | Identificador unico do registro |
| dealId | String | FK -> deals.id, NOT NULL | Deal que foi movido |
| fromStageId | String | FK -> pipeline_stages.id, NOT NULL | Stage de origem |
| toStageId | String | FK -> pipeline_stages.id, NOT NULL | Stage de destino |
| changedAt | DateTime | NOT NULL, default now() | Momento da movimentacao |

**Relationships**:
- `deal` -> Deal (many-to-one, onDelete: Cascade)
- `fromStage` -> PipelineStage (many-to-one, onDelete: Restrict)
- `toStage` -> PipelineStage (many-to-one, onDelete: Restrict)

**Indices**:
- `@@index([dealId, changedAt])` — otimiza queries de historico por deal ordenadas por tempo

**Constraints**:
- fromStageId e toStageId MUST NOT ser iguais (enforced no application level, nao no banco)
- Registros sao append-only — nenhuma operacao de update ou delete

### Expected Prisma Schema

```prisma
model DealStageHistory {
  id          String        @id @default(cuid())
  dealId      String        @map("deal_id")
  fromStageId String        @map("from_stage_id")
  toStageId   String        @map("to_stage_id")
  changedAt   DateTime      @default(now()) @map("changed_at")

  deal        Deal          @relation(fields: [dealId], references: [id], onDelete: Cascade)
  fromStage   PipelineStage @relation("FromStage", fields: [fromStageId], references: [id], onDelete: Restrict)
  toStage     PipelineStage @relation("ToStage", fields: [toStageId], references: [id], onDelete: Restrict)

  @@index([dealId, changedAt])
  @@map("deal_stage_history")
}
```

**Note**: Deal model needs `stageHistory DealStageHistory[]` relation added.
PipelineStage model needs `fromStageHistory DealStageHistory[] @relation("FromStage")`
and `toStageHistory DealStageHistory[] @relation("ToStage")` relations added.

## onDelete Decisions

| Relationship | onDelete | Rationale |
|-------------|----------|-----------|
| DealStageHistory -> Deal | Cascade | Se deal for removido (futuro), historico perde sentido. Porem, deals NAO sao deletados (BR-006 da feature 003). Cascade e safety net. |
| DealStageHistory -> PipelineStage (from/to) | Restrict | Impede deletar stage que participa de historico. Preserva auditabilidade. |
