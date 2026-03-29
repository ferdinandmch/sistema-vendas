# API Contracts: Pipeline UI

**Feature**: 008-pipeline-ui | **Date**: 2026-03-29

> Esta feature **não cria novos endpoints**. Consome os contratos padronizados pela feature 007.

## Endpoints consumidos

### GET /api/stages

**Autenticação**: Clerk session cookie (middleware `proxy.ts`)
**Ownership**: Todos os stages são globais (não têm owner) — retorna todos os stages do sistema

**Response 200**:
```json
{
  "stages": [
    {
      "id": "cuid",
      "name": "Prospecção",
      "position": 1,
      "isFinal": false,
      "finalType": null,
      "createdAt": "2026-03-29T00:00:00.000Z"
    }
  ]
}
```

**Response 401**: `{ "error": { "code": "UNAUTHORIZED", "message": "..." } }`

---

### GET /api/deals

**Autenticação**: Clerk session cookie (middleware `proxy.ts`)
**Ownership**: Retorna apenas deals do usuário autenticado (`ownerId` = `user.id` do domínio)

**Response 200**:
```json
{
  "deals": [
    {
      "id": "cuid",
      "name": "Empresa ABC",
      "companyName": "ABC Ltda",
      "stageId": "cuid",
      "status": "active",
      "value": 15000,
      "ownerId": "cuid",
      "contactName": null,
      "stage": { "id": "cuid", "name": "Prospecção", "position": 1 },
      "createdAt": "2026-03-29T00:00:00.000Z",
      "stageUpdatedAt": "2026-03-29T00:00:00.000Z"
    }
  ]
}
```

**Response 401**: `{ "error": { "code": "UNAUTHORIZED", "message": "..." } }`

---

## Query Functions (fetch functions para TanStack Query)

```typescript
// lib/pipeline/api.ts

async function fetchStages(): Promise<Stage[]> {
  const res = await fetch('/api/stages')
  if (!res.ok) throw new Error('Failed to fetch stages')
  const data = await res.json()
  return data.stages
}

async function fetchDeals(): Promise<Deal[]> {
  const res = await fetch('/api/deals')
  if (!res.ok) throw new Error('Failed to fetch deals')
  const data = await res.json()
  return data.deals
}
```

---

## Sem novos contratos

Nenhuma alteração nos contratos existentes. Nenhum novo endpoint. A feature 007 padronizou todos os contratos necessários.
