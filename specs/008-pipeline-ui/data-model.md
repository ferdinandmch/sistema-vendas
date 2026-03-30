# Data Model: Pipeline UI

**Feature**: 008-pipeline-ui | **Date**: 2026-03-29

## Migrações de banco

**Nenhuma** — feature é somente leitura. Zero migrações de Prisma.

## Entidades consumidas (somente leitura)

### Stage (PipelineStage)

Retornado por `GET /api/stages` → `{ stages: Stage[] }`

```typescript
type Stage = {
  id: string
  name: string
  position: number
  isFinal: boolean
  finalType: "won" | "lost" | null
  createdAt: string // ISO 8601
}
```

**Ordenação para o board**: `stages.sort((a, b) => a.position - b.position)`

**Campos usados no board**:
- `id` — chave de agrupamento dos deals
- `name` — header da coluna
- `position` — ordem das colunas (backend define, UI respeita)

---

### Deal

Retornado por `GET /api/deals` → `{ deals: Deal[] }`

```typescript
type Deal = {
  id: string
  name: string
  companyName: string
  stageId: string
  status: "active" | "won" | "lost"
  value: number        // valor monetário — exibido no card (confirmado em clarify)
  ownerId: string
  contactName: string | null
  stage: {
    id: string
    name: string
    position: number
  }
  createdAt: string    // ISO 8601
  stageUpdatedAt: string
}
```

**Campos usados no DealCard**:
- `id` — chave React + `data-deal-id` para DnD futuro
- `name` — título do card
- `companyName` — subtítulo do card
- `status` — Badge colorido
- `value` — valor monetário formatado
- `stageId` — chave de agrupamento por coluna

**Campos ignorados no board nesta feature**:
- `contactName` — disponível mas não exibido nesta feature
- `ownerId` — irrelevante para exibição
- `stage` (embedded) — redundante; `stageId` é suficiente para agrupamento

---

## Estrutura derivada (client-side, sem persistência)

### BoardState (derivado em memória, nunca persistido)

```typescript
type BoardState = {
  stages: Stage[]                          // ordenadas por position
  dealsByStage: Record<string, Deal[]>     // chave = stage.id
}
```

**Derivação**:

```typescript
const dealsByStage = useMemo(() =>
  deals.reduce((acc, deal) => {
    if (!acc[deal.stageId]) acc[deal.stageId] = []
    acc[deal.stageId].push(deal)
    return acc
  }, {} as Record<string, Deal[]>),
  [deals]
)
```

**Nota BR-005**: Deals com `stageId` não encontrado nos stages carregados são silenciosamente omitidos — a filtragem ocorre naturalmente ao iterar `stages.map(s => dealsByStage[s.id] ?? [])`.
