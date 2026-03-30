# Data Model: Deal Page

**Feature**: 010-deal-page
**Date**: 2026-03-30

---

## Tipos Existentes (reutilizados)

### `Deal` — já em `lib/pipeline/api.ts`

```ts
export type DealStatus = "active" | "won" | "lost";

export type Deal = {
  id: string;
  companyName: string;
  contactName: string | null;
  stageId: string;
  status: DealStatus;
  nextAction: string | null;
  ownerId: string;
  createdAt: string;
  stageUpdatedAt: string;
  stage: {
    id: string;
    name: string;
    position: number;
  };
};
```

**Nota**: O endpoint `GET /api/deals/:id` retorna o Deal com todos os campos. Os campos `contactDetails`, `source`, `experiment`, `notes` e `icp` estão no banco (schema Prisma) mas podem não estar incluídos na resposta atual. O plan.md irá confirmar o contrato exato do endpoint.

---

## Tipos Novos (a adicionar em `lib/pipeline/api.ts`)

### `Activity`

```ts
export type ActivityType = "note" | "call" | "meeting" | "followup";

export type Activity = {
  id: string;
  dealId: string;
  type: ActivityType;
  content: string | null;
  createdAt: string;
};
```

**Fonte**: `GET /api/deals/:id/activities` → `{ activities: Activity[] }`
**Ordenação**: cronológica decrescente (retornada pelo backend)

---

### `StageHistoryEntry`

```ts
export type StageHistoryEntry = {
  id: string;
  dealId: string;
  fromStageId: string;
  toStageId: string;
  changedAt: string;
  fromStage: {
    id: string;
    name: string;
  };
  toStage: {
    id: string;
    name: string;
  };
};
```

**Fonte**: `GET /api/deals/:id/history` → `{ history: StageHistoryEntry[] }`
**Ordenação**: cronológica decrescente (retornada pelo backend)
**Nota**: Os nomes dos stages (`fromStage.name`, `toStage.name`) precisam estar incluídos na resposta do endpoint. Verificar contrato em `contracts/`.

---

## Query Keys (a adicionar em `lib/query-keys.ts`)

```ts
// Extensão de dealKeys (já existente)
export const dealKeys = {
  all: ["deals"] as const,
  list: () => [...dealKeys.all, "list"] as const,
  detail: (id: string) => [...dealKeys.all, "detail", id] as const, // NOVO
};

// Novos key factories
export const activityKeys = {
  all: ["activities"] as const,
  list: (dealId: string) => [...activityKeys.all, "list", dealId] as const,
};

export const historyKeys = {
  all: ["history"] as const,
  list: (dealId: string) => [...historyKeys.all, "list", dealId] as const,
};
```

**Padrão**: `qk-factory-pattern` + `qk-hierarchical-organization` (TanStack Query best practices)

---

## Fetch Functions (a adicionar em `lib/pipeline/api.ts`)

```ts
export async function fetchDeal(id: string): Promise<Deal> {
  const res = await fetch(`/api/deals/${id}`);
  if (!res.ok) throw new Error("Failed to fetch deal");
  const data = (await res.json()) as { deal: Deal };
  return data.deal;
}

export async function fetchActivities(dealId: string): Promise<Activity[]> {
  const res = await fetch(`/api/deals/${dealId}/activities`);
  if (!res.ok) throw new Error("Failed to fetch activities");
  const data = (await res.json()) as { activities: Activity[] };
  return data.activities;
}

export async function fetchHistory(dealId: string): Promise<StageHistoryEntry[]> {
  const res = await fetch(`/api/deals/${dealId}/history`);
  if (!res.ok) throw new Error("Failed to fetch history");
  const data = (await res.json()) as { history: StageHistoryEntry[] };
  return data.history;
}
```

---

## Diagrama de Relacionamento (existente no banco)

```
Deal (1) ──── (N) Activity
Deal (1) ──── (N) DealStageHistory
DealStageHistory ──── (1) PipelineStage [fromStage]
DealStageHistory ──── (1) PipelineStage [toStage]
```

---

## Escopo desta feature

| Operação | Incluído |
|----------|----------|
| Leitura de Deal | ✅ |
| Leitura de Activities | ✅ |
| Leitura de Stage History | ✅ |
| Criação de Activity | ❌ fora de escopo |
| Edição de Deal | ❌ fora de escopo |
| Movimentação de Stage | ❌ fora de escopo (feature 009) |
| Migrações de banco | ❌ zero migrações |
