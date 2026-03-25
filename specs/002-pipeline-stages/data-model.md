# Data Model: 002-pipeline-stages

**Branch**: `002-pipeline-stages` | **Date**: 2026-03-25

## Entity: PipelineStage

Represents a stage (column) in the sales pipeline. Each stage defines a position
in the funnel and optionally marks a terminal state (won/lost).

### Fields

| Field        | Type          | Constraints                          | Description                              |
|--------------|---------------|--------------------------------------|------------------------------------------|
| `id`         | String (CUID) | Primary key, auto-generated          | Internal stable identifier               |
| `name`       | String        | Required, unique                     | Display name of the stage                |
| `position`   | Int           | Required, unique, positive           | Ordinal position in the pipeline         |
| `is_final`   | Boolean       | Required, default: false             | Whether this stage is terminal           |
| `final_type` | Enum (won/lost) | Nullable, required when is_final=true | Type of terminal outcome               |
| `created_at` | DateTime      | Auto-generated, default: now()       | Record creation timestamp                |
| `updated_at` | DateTime      | Auto-updated                         | Last modification timestamp              |

### Table Name

`pipeline_stages`

### Enum: FinalType

- `won` — Deal closed successfully
- `lost` — Deal closed unsuccessfully

### Constraints

- `name` MUST be unique across all stages
- `position` MUST be unique across all stages
- `final_type` MUST be non-null when `is_final = true`
- `final_type` MUST be null when `is_final = false`
- `position` MUST be a positive integer

### Relationships

- **Future**: `Deal.stage_id` → `PipelineStage.id` (one-to-many, not yet implemented)
- When deals exist, deletion of a stage with associated deals MUST be rejected

### Seed Data (8 default stages)

| position | name         | is_final | final_type |
|----------|--------------|----------|------------|
| 1        | Cold         | false    | null       |
| 2        | Warm         | false    | null       |
| 3        | Initial Call | false    | null       |
| 4        | Qualified    | false    | null       |
| 5        | Demo         | false    | null       |
| 6        | Negotiation  | false    | null       |
| 7        | Won          | true     | won        |
| 8        | Lost         | true     | lost       |

### Validation Rules (from spec)

- **Create**: `name` required + unique, `position` required + unique + positive, `is_final`/`final_type` consistency
- **Update**: Same rules as create; when `is_final` changes to `false`, backend clears `final_type` automatically
- **Delete**: Allowed only when no deals reference the stage (future constraint)

### PostgreSQL Considerations (from postgresql-code-review)

- Unique constraints on `name` and `position` enforce integrity at the database level, preventing race conditions
- `position` as integer allows efficient `ORDER BY` without index overhead for small datasets
- Enum type for `final_type` enforces valid values at the database level
- Consider adding a CHECK constraint: `(is_final = true AND final_type IS NOT NULL) OR (is_final = false AND final_type IS NULL)`
