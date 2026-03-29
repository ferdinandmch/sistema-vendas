# API Response Contract: Padrao Uniforme

**Feature**: 007-api-refinada
**Date**: 2026-03-29

## Success Responses

### Leitura de recurso unico (GET /:id)

```
HTTP 200 OK
Content-Type: application/json

{ "<recurso_singular>": { ...campos } }
```

Exemplos: `{ "deal": {...} }`, `{ "stage": {...} }`, `{ "user": {...} }`

### Listagem de recursos (GET /)

```
HTTP 200 OK
Content-Type: application/json

{ "<recurso_plural>": [ ...itens ] }
```

Exemplos: `{ "deals": [...] }`, `{ "stages": [...] }`, `{ "activities": [...] }`, `{ "history": [...] }`

Lista vazia retorna array vazio: `{ "deals": [] }` — nunca erro.

### Criacao de recurso (POST)

```
HTTP 201 Created
Content-Type: application/json

{ "<recurso_singular>": { ...campos } }
```

Exemplos: `{ "deal": {...} }`, `{ "stage": {...} }`, `{ "activity": {...} }`

### Atualizacao de recurso (PUT)

```
HTTP 200 OK
Content-Type: application/json

{ "<recurso_singular>": { ...campos } }
```

### Delecao de recurso (DELETE)

```
HTTP 204 No Content
(corpo vazio)
```

## Error Responses

Todos os erros seguem formato uniforme:

```
HTTP <status>
Content-Type: application/json

{
  "error": {
    "code": "<APP_ERROR_CODE>",
    "message": "<descricao legivel>",
    "details": [                          // opcional, apenas para INVALID_REQUEST
      { "field": "<campo>", "message": "<descricao>" }
    ]
  }
}
```

### Error Codes por Status HTTP

| Status | Code | Quando |
|--------|------|--------|
| 400 | INVALID_REQUEST | JSON malformed, validacao Zod falhou, parametro invalido |
| 400 | SAME_STAGE | Deal ja esta neste stage |
| 400 | DEAL_ALREADY_CLOSED | Deal finalizado nao pode ser movido |
| 400 | INVALID_FINAL_TYPE | finalType inconsistente com isFinal |
| 401 | UNAUTHORIZED | Sem sessao autenticada |
| 404 | DEAL_NOT_FOUND | Deal inexistente ou de outro owner |
| 404 | STAGE_NOT_FOUND | Stage inexistente |
| 409 | DUPLICATE_STAGE_NAME | Nome de stage duplicado |
| 409 | DUPLICATE_STAGE_POSITION | Posicao de stage duplicada |
| 409 | STAGE_HAS_DEALS | Stage com deals associados nao pode ser deletado |
| 500 | SYNC_FAILED | Falha ao resolver contexto de usuario |

### Validation Error Detail Format

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Validation failed",
    "details": [
      { "field": "companyName", "message": "Required" },
      { "field": "stageId", "message": "Required" }
    ]
  }
}
```

Campo `details` so aparece quando `code` e `INVALID_REQUEST` e ha erros de campo especificos.

## Endpoint Matrix

| Endpoint | Method | Success Status | Response Key | Has Payload | Has Ownership |
|----------|--------|---------------|-------------|------------|--------------|
| /api/me | GET | 200 | user | No | No |
| /api/stages | GET | 200 | stages | No | No |
| /api/stages | POST | 201 | stage | Yes | No |
| /api/stages/:id | PUT | 200 | stage | Yes | No |
| /api/stages/:id | DELETE | 204 | (none) | No | No |
| /api/deals | GET | 200 | deals | No | Yes |
| /api/deals | POST | 201 | deal | Yes | Yes |
| /api/deals/:id | GET | 200 | deal | No | Yes |
| /api/deals/:id | PUT | 200 | deal | Yes | Yes |
| /api/deals/:id/move | POST | 200 | deal | Yes | Yes |
| /api/deals/:id/activities | GET | 200 | activities | No | Yes |
| /api/deals/:id/activities | POST | 201 | activity | Yes | Yes |
| /api/deals/:id/history | GET | 200 | history | No | Yes |
