# Data Model: Activities de Deals

**Branch**: `005-deal-activities` | **Date**: 2026-03-27

## Enum: ActivityType (novo)

Tipo de atividade comercial registrada em um deal.

| Value    | Description                     |
|----------|---------------------------------|
| note     | Nota ou observacao              |
| call     | Ligacao telefonica              |
| meeting  | Reuniao presencial ou virtual   |
| followup | Follow-up ou acompanhamento     |

## Entity: Activity (novo)

Registro de interacao comercial vinculado a um deal. Append-only (sem edicao
ou exclusao nesta feature).

### Fields

| Field     | Type         | Nullable | Default   | Description                    |
|-----------|-------------|----------|-----------|--------------------------------|
| id        | String (CUID)| No      | cuid()    | Identificador unico            |
| dealId    | String       | No       | —         | FK para Deal                   |
| type      | ActivityType | No       | —         | Tipo da atividade              |
| content   | String       | Yes      | null      | Conteudo/descricao opcional    |
| createdAt | DateTime     | No       | now()     | Momento de criacao             |

### Relationships

| Relation | Target | Type    | onDelete | Description                       |
|----------|--------|---------|----------|-----------------------------------|
| deal     | Deal   | Many→One| Cascade  | Activity pertence a um deal       |

**onDelete Cascade**: Se um deal for removido (cenario futuro de hard delete
administrativo), activities associadas sao removidas junto. Nota: a
constituicao proibe hard delete de deals no fluxo normal.

### Indexes

| Index                    | Columns            | Purpose                           |
|--------------------------|--------------------|-----------------------------------|
| @@index([dealId, createdAt]) | dealId, createdAt | Otimiza listagem por deal ordenada |

### Table Mapping

- Model: `Activity`
- Table: `activities` (via `@@map("activities")`)
- Fields: snake_case mapping (`deal_id`, `created_at`)

## Entity: Deal (modificado)

### Fields Affected

| Field        | Type      | Change | Description                        |
|--------------|-----------|--------|------------------------------------|
| lastTouchAt  | DateTime? | Used   | Atualizado a cada nova activity    |

### New Relationship

| Relation   | Target   | Type     | Description                        |
|------------|----------|----------|------------------------------------|
| activities | Activity | One→Many | Deal tem muitas activities          |

**Nota**: lastTouchAt ja existe no modelo Deal (feature 003) como `DateTime?`
com default null. Nao precisa de migracao — apenas atualizado pelo service.

## Validation Rules

### createActivitySchema (Zod)

| Field   | Rule                                              |
|---------|---------------------------------------------------|
| type    | Obrigatorio. Enum: note, call, meeting, followup  |
| content | Opcional. String nullable. Se presente, min 1 char |

### Ownership

- Activity nao tem owner_id proprio
- Ownership enforced via deal.ownerId em toda operacao
- Pattern: `prisma.deal.findFirst({ where: { id: dealId, ownerId } })`
