# API Contracts: Stage Management

**Feature**: 011-stage-management
**Date**: 2026-03-30
**Contract type**: Consumed + Modified + New

---

## 1. GET /api/stages — Listar stages (existente, sem mudança)

**Response 200**:
```json
{ "stages": [{ "id": "cuid", "name": "Prospecção", "position": 1, "isFinal": false, "finalType": null, "createdAt": "..." }] }
```

---

## 2. POST /api/stages — Criar stage (existente + novo guard won/lost)

**Request body**:
```json
{ "name": "Won", "position": 7, "isFinal": true, "finalType": "won" }
```

**Response 201**: `{ "stage": Stage }`

**Novos erros**:
| Status | Code | Cenário |
|--------|------|---------|
| 409 | `DUPLICATE_FINAL_TYPE` | Já existe stage com `finalType: "won"` ou `"lost"` |
| 409 | `DUPLICATE_STAGE_NAME` | Já existe stage com esse nome |

---

## 3. PUT /api/stages/:id — Editar stage (existente + novo guard won/lost)

**Request body** (todos opcionais):
```json
{ "name": "Qualificação", "isFinal": false, "finalType": null }
```

**Response 200**: `{ "stage": Stage }`

**Novos erros**:
| Status | Code | Cenário |
|--------|------|---------|
| 409 | `DUPLICATE_FINAL_TYPE` | Outro stage já tem `finalType: "won"` ou `"lost"` |

---

## 4. DELETE /api/stages/:id — Excluir stage (existente + deal check + renumber)

**Response 204**: sem body

**Novos erros**:
| Status | Code | Cenário |
|--------|------|---------|
| 400 | `STAGE_HAS_DEALS` | Stage tem deals ativos — `message: "Este stage tem N deals ativos."` |

**Comportamento pós-delete**: posições dos stages restantes são renumeradas atomicamente (sem gaps).

---

## 5. POST /api/stages/reorder — Reordenar stages (NOVO)

**Request body**:
```json
{
  "stages": [
    { "id": "cuid-1", "position": 1 },
    { "id": "cuid-2", "position": 2 },
    { "id": "cuid-3", "position": 3 }
  ]
}
```

**Response 200**:
```json
{ "stages": [Stage, Stage, Stage] }
```

**Erros**:
| Status | Code | Cenário |
|--------|------|---------|
| 400 | `VALIDATION_ERROR` | Payload inválido (IDs ausentes, positions com gaps) |
| 401 | `UNAUTHORIZED` | Sem sessão Clerk |

**Comportamento**: atualiza todas as posições em `$transaction` — atômico ou nada.

---

## Padrão de erro (feature 007)

```json
{ "error": { "code": "STAGE_HAS_DEALS", "message": "Este stage tem 3 deals ativos." } }
```
