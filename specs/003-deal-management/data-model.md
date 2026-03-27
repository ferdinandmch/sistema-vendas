# Data Model: 003-deal-management

**Branch**: `003-deal-management` | **Date**: 2026-03-26

## Enum: DealStatus

- `active` — Deal ativo no pipeline (unico valor nesta feature)

Preparado para extensao futura: archived, won, lost.

## Entity: Deal

Representa uma oportunidade de venda que transita pelo pipeline. Cada deal
pertence a um usuario (owner) e ocupa um stage.

### Fields

| Field              | Type              | Constraints                          | Description                              |
|--------------------|-------------------|--------------------------------------|------------------------------------------|
| `id`               | String (CUID)     | Primary key, auto-generated          | Identificador interno estavel            |
| `company_name`     | String            | Required, non-empty                  | Nome da empresa/oportunidade             |
| `contact_name`     | String?           | Nullable                             | Nome do contato principal                |
| `contact_details`  | String?           | Nullable                             | Detalhes de contato (telefone, email)    |
| `source`           | String?           | Nullable                             | Origem do lead                           |
| `experiment`       | String?           | Nullable                             | Experimento/campanha associada           |
| `notes`            | String?           | Nullable                             | Observacoes livres                       |
| `icp`              | Boolean           | Required, default: false             | Flag de Ideal Customer Profile           |
| `next_action`      | String?           | Nullable                             | Proxima acao planejada                   |
| `stage_id`         | String            | Required, FK → pipeline_stages.id    | Stage atual do deal no pipeline          |
| `stage_updated_at` | DateTime          | Required, default: now()             | Quando o deal entrou no stage atual      |
| `status`           | DealStatus        | Required, default: active            | Status de lifecycle do deal              |
| `last_touch_at`    | DateTime?         | Nullable                             | Ultimo contato (gerenciado por activities)|
| `owner_id`         | String            | Required, FK → users.id              | Proprietario do deal                     |
| `created_at`       | DateTime          | Auto-generated, default: now()       | Timestamp de criacao                     |
| `updated_at`       | DateTime          | Auto-updated                         | Timestamp de ultima modificacao          |

### Table Name

`deals`

### Relationships

- `stage_id` → `pipeline_stages.id` (many-to-one, required)
  - Um deal pertence a um stage. Um stage pode ter muitos deals.
  - onDelete: Restrict (impede delecao de stage com deals associados)
- `owner_id` → `users.id` (many-to-one, required)
  - Um deal pertence a um usuario. Um usuario pode ter muitos deals.
  - onDelete: Restrict (impede delecao de usuario com deals)

### Indexes

- `owner_id` — indice para otimizar listagem filtrada por owner
  (postgresql-optimization: toda query de deals filtra por owner_id)
- `stage_id` — indice implicito pela FK

### Constraints

- `company_name` MUST ser non-empty
- `stage_id` MUST referenciar um pipeline_stages.id existente
- `owner_id` MUST referenciar um users.id existente
- `status` MUST ser um valor valido do enum DealStatus
- `stage_updated_at` MUST ser definido na criacao

### Editable Fields (via update)

- company_name, contact_name, contact_details, source, experiment, notes, icp,
  next_action

### Protected Fields (read-only after creation)

- id, stage_id, owner_id, status, stage_updated_at, last_touch_at, created_at,
  updated_at

### Prisma Schema (expected)

```prisma
enum DealStatus {
  active
}

model Deal {
  id             String        @id @default(cuid())
  companyName    String        @map("company_name")
  contactName    String?       @map("contact_name")
  contactDetails String?       @map("contact_details")
  source         String?
  experiment     String?
  notes          String?
  icp            Boolean       @default(false)
  nextAction     String?       @map("next_action")
  stageId        String        @map("stage_id")
  stageUpdatedAt DateTime      @default(now()) @map("stage_updated_at")
  status         DealStatus    @default(active)
  lastTouchAt    DateTime?     @map("last_touch_at")
  ownerId        String        @map("owner_id")
  createdAt      DateTime      @default(now()) @map("created_at")
  updatedAt      DateTime      @updatedAt @map("updated_at")

  stage          PipelineStage @relation(fields: [stageId], references: [id], onDelete: Restrict)
  owner          User          @relation(fields: [ownerId], references: [id], onDelete: Restrict)

  @@index([ownerId])
  @@map("deals")
}
```

### Impact on Existing Models

- **PipelineStage**: Adicionar `deals Deal[]` para relacionamento reverso
- **User**: Adicionar `deals Deal[]` para relacionamento reverso

### Seed Data

Nenhum seed necessario para deals. Deals sao criados por usuarios autenticados.

### Validation Rules (from spec)

- **Create**: company_name required + non-empty, stage_id required + existente,
  icp default false, demais campos opcionais
- **Update**: Apenas campos editaveis. Todos opcionais. stage_id/owner_id/status
  excluidos do schema.
- **Delete**: Nao disponivel nesta feature

### PostgreSQL Considerations

- FK com onDelete Restrict impede delecao de stages ou usuarios com deals
- Indice em owner_id otimiza queries de listagem
- Enum DealStatus garante constraint de valor no banco
- camelCase no Prisma, snake_case no banco via @map (padrao do projeto)
