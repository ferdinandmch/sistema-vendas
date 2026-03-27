# Quickstart Validation: Movimentacao de Deal entre Stages

**Branch**: `004-stage-movement` | **Date**: 2026-03-27

## Prerequisites

- Servidor rodando (`pnpm dev`)
- Usuario autenticado com sessao valida
- Pelo menos 2 stages nao-finais e 1 stage final (won) existentes
- Pelo menos 1 deal criado no primeiro stage

## Validation Steps

### 1. Mover deal para outro stage (sucesso)

```
POST /api/deals/{deal_id}/move
Body: { "toStageId": "{stage_2_id}" }
```

**Esperado**: 200 com deal atualizado. stageId = stage_2_id.
stageUpdatedAt atualizado. status = active. Stage embed presente.

### 2. Verificar historico criado

Consultar banco: `deal_stage_history` deve ter 1 registro com
deal_id, from_stage_id = stage_1_id, to_stage_id = stage_2_id, changed_at.

### 3. Mover deal para stage final (won)

```
POST /api/deals/{deal_id}/move
Body: { "toStageId": "{won_stage_id}" }
```

**Esperado**: 200 com deal atualizado. status = won. stageId = won_stage_id.
stageUpdatedAt atualizado. Historico criado com from_stage_id = stage_2_id.

### 4. Tentar mover deal finalizado

```
POST /api/deals/{deal_id}/move
Body: { "toStageId": "{stage_1_id}" }
```

**Esperado**: 400 com error.code = DEAL_ALREADY_CLOSED.

### 5. Tentar mover para o mesmo stage (com outro deal ativo)

```
POST /api/deals/{active_deal_id}/move
Body: { "toStageId": "{current_stage_id}" }
```

**Esperado**: 400 com error.code = SAME_STAGE.

### 6. Tentar mover para stage inexistente

```
POST /api/deals/{deal_id}/move
Body: { "toStageId": "nonexistent-id" }
```

**Esperado**: 400 com error.code = STAGE_NOT_FOUND.

### 7. Tentar mover deal de outro usuario

```
POST /api/deals/{other_user_deal_id}/move
Body: { "toStageId": "{stage_2_id}" }
```

**Esperado**: 404 com error.code = DEAL_NOT_FOUND.

### 8. Tentar mover deal inexistente

```
POST /api/deals/nonexistent-id/move
Body: { "toStageId": "{stage_2_id}" }
```

**Esperado**: 404 com error.code = DEAL_NOT_FOUND.

### 9. Tentar mover sem autenticacao

```
POST /api/deals/{deal_id}/move (sem sessao)
Body: { "toStageId": "{stage_2_id}" }
```

**Esperado**: 401 com error.code = UNAUTHORIZED.

### 10. Tentar mover sem toStageId

```
POST /api/deals/{deal_id}/move
Body: {}
```

**Esperado**: 400 com error.code = INVALID_REQUEST e details array.

### 11. Mover deal para stage final (lost)

```
POST /api/deals/{another_deal_id}/move
Body: { "toStageId": "{lost_stage_id}" }
```

**Esperado**: 200 com deal atualizado. status = lost.

### 12. Verificar multiplos historicos

Consultar banco: deal movido nos steps 1 e 3 deve ter 2 registros em
deal_stage_history, ordenados por changed_at.

### 13. Verificar transacionalidade

Simular falha no insert de historico (ex: FK invalida). Verificar que
deal.stage_id NAO foi atualizado — transacao revertida completamente.
