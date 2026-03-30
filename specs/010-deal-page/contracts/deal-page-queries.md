# API Contracts: Deal Page Queries

**Feature**: 010-deal-page
**Date**: 2026-03-30
**Contract type**: Consumed (endpoints existentes das features 003, 005 e 006)

---

## 1. GET /api/deals/:id — Detalhe do deal

### Request

**Headers**: Clerk session cookie (automático)
**Path params**: `id` — UUID do deal

### Response — Success (200)

```json
{
  "deal": {
    "id": "cuid",
    "companyName": "Empresa X",
    "contactName": "João Silva",
    "contactDetails": "11 99999-0000",
    "source": "indicação",
    "experiment": null,
    "notes": "Cliente interessado em pacote enterprise",
    "icp": true,
    "nextAction": "Enviar proposta",
    "stageId": "cuid-stage",
    "stageUpdatedAt": "2026-03-28T10:00:00.000Z",
    "status": "active",
    "lastTouchAt": "2026-03-29T14:00:00.000Z",
    "ownerId": "user_clerk_id",
    "createdAt": "2026-03-20T09:00:00.000Z",
    "updatedAt": "2026-03-29T14:00:00.000Z",
    "stage": {
      "id": "cuid-stage",
      "name": "Qualificação",
      "position": 2
    }
  }
}
```

**Nota sobre campos opcionais**: `contactName`, `contactDetails`, `source`, `experiment`, `notes`, `nextAction`, `lastTouchAt` podem ser `null`. A UI deve tratar cada campo nulo com ausência visual adequada (não exibir linha vazia).

### Response — Errors

| Status | Code | Cenário |
|--------|------|---------|
| 401 | `UNAUTHORIZED` | Sem sessão Clerk válida |
| 404 | `NOT_FOUND` | Deal inexistente ou pertence a outro usuário |

---

## 2. GET /api/deals/:id/activities — Lista de activities

### Request

**Headers**: Clerk session cookie (automático)
**Path params**: `id` — UUID do deal

### Response — Success (200)

```json
{
  "activities": [
    {
      "id": "cuid",
      "dealId": "cuid-deal",
      "type": "call",
      "content": "Ligação de 20 min. Cliente confirmou interesse.",
      "createdAt": "2026-03-29T14:00:00.000Z"
    },
    {
      "id": "cuid-2",
      "dealId": "cuid-deal",
      "type": "note",
      "content": null,
      "createdAt": "2026-03-28T09:00:00.000Z"
    }
  ]
}
```

**Ordenação**: `createdAt DESC` — retornado pelo backend em ordem decrescente (mais recente primeiro). ✅
**Lista vazia**: `{ "activities": [] }` — tratado como sucesso pela UI.
**Tipos válidos**: `"note"`, `"call"`, `"meeting"`, `"followup"`

### Response — Errors

| Status | Code | Cenário |
|--------|------|---------|
| 401 | `UNAUTHORIZED` | Sem sessão Clerk válida |
| 404 | `NOT_FOUND` | Deal inexistente ou pertence a outro usuário |

---

## 3. GET /api/deals/:id/history — Histórico de stage

### Request

**Headers**: Clerk session cookie (automático)
**Path params**: `id` — UUID do deal

### Response — Success (200)

```json
{
  "history": [
    {
      "id": "cuid",
      "dealId": "cuid-deal",
      "fromStageId": "cuid-stage-a",
      "toStageId": "cuid-stage-b",
      "changedAt": "2026-03-25T10:00:00.000Z",
      "fromStage": { "id": "cuid-stage-a", "name": "Prospecção" },
      "toStage": { "id": "cuid-stage-b", "name": "Qualificação" }
    }
  ]
}
```

**Ordenação do backend**: `changedAt ASC` (mais antigo primeiro).
**Ordenação na UI**: A UI DEVE reverter o array para exibição decrescente (mais recente primeiro), conforme spec FR-003.
**Lista vazia**: `{ "history": [] }` — tratado como sucesso pela UI.

### Response — Errors

| Status | Code | Cenário |
|--------|------|---------|
| 401 | `UNAUTHORIZED` | Sem sessão Clerk válida |
| 404 | `NOT_FOUND` | Deal inexistente ou pertence a outro usuário |

---

## Padrão de erro (feature 007)

Todos os erros seguem o envelope padrão:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Deal not found."
  }
}
```

---

## Frontend contracts (fetch functions em `lib/pipeline/api.ts`)

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

**Nota sobre ordenação de history**: `fetchHistory` retorna os dados na ordem do backend (ASC). O componente `DealStageHistory` reverte o array (`[...history].reverse()`) antes de renderizar.
