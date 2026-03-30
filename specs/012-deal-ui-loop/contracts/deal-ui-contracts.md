# API Contracts: Deal Management UI Loop

**Branch**: `012-deal-ui-loop` | **Date**: 2026-03-30

> Todos os endpoints já existem e estão funcionais. Esta feature apenas os consume da UI.

---

## POST /api/deals — Criar deal

**Usado por**: `DealFormDialog` ao confirmar criação

**Request**:
```json
{
  "companyName": "Acme Corp",
  "stageId": "stage-uuid",
  "contactName": "João Silva",
  "contactDetails": "joao@acme.com",
  "source": "LinkedIn",
  "experiment": null,
  "notes": "Demonstrou interesse no produto Enterprise",
  "icp": true,
  "nextAction": "Enviar proposta"
}
```
*Campos obrigatórios: `companyName`, `stageId`. Demais opcionais.*

**Response 201**:
```json
{
  "deal": {
    "id": "deal-uuid",
    "companyName": "Acme Corp",
    "stageId": "stage-uuid",
    "status": "active",
    "ownerId": "user-uuid",
    "stage": { "id": "stage-uuid", "name": "Prospecção", "position": 1 },
    "createdAt": "2026-03-30T...",
    "stageUpdatedAt": "2026-03-30T...",
    "lastTouchAt": null
  }
}
```

**Erros**:
| Status | Code | Cenário |
|--------|------|---------|
| 400 | INVALID_REQUEST | companyName vazio ou stageId ausente |
| 400 | STAGE_NOT_FOUND | stageId não existe |
| 401 | UNAUTHORIZED | usuário não autenticado |

---

## PUT /api/deals/:id — Editar deal

**Usado por**: `DealEditDialog` ao salvar edição

**Request** (todos os campos opcionais):
```json
{
  "companyName": "Acme Corp Updated",
  "contactName": "Maria Silva",
  "contactDetails": "maria@acme.com",
  "notes": "Reunião realizada, seguindo para proposta",
  "icp": true,
  "nextAction": "Apresentar proposta na sexta"
}
```

**Response 200**:
```json
{
  "deal": {
    "id": "deal-uuid",
    "companyName": "Acme Corp Updated",
    "stage": { "id": "stage-uuid", "name": "Qualificação", "position": 2 }
  }
}
```

**Erros**:
| Status | Code | Cenário |
|--------|------|---------|
| 400 | INVALID_REQUEST | companyName enviado mas vazio |
| 401 | UNAUTHORIZED | usuário não autenticado |
| 404 | DEAL_NOT_FOUND | deal não existe ou não pertence ao usuário |

---

## POST /api/deals/:id/activities — Registrar atividade

**Usado por**: `ActivityForm` ao clicar "Registrar"

**Request**:
```json
{
  "type": "call",
  "content": "Falei com o CEO por 30 minutos. Demonstrou interesse no plano Enterprise."
}
```
*`type` obrigatório: `note | call | meeting | followup`. `content` obrigatório.*

**Response 201**:
```json
{
  "activity": {
    "id": "activity-uuid",
    "dealId": "deal-uuid",
    "type": "call",
    "content": "Falei com o CEO por 30 minutos...",
    "createdAt": "2026-03-30T..."
  }
}
```

**Side effect**: `deal.lastTouchAt` é atualizado atomicamente no mesmo servidor.

**Erros**:
| Status | Code | Cenário |
|--------|------|---------|
| 400 | INVALID_REQUEST | type inválido ou content vazio |
| 401 | UNAUTHORIZED | usuário não autenticado |
| 404 | DEAL_NOT_FOUND | deal não existe ou não pertence ao usuário |
