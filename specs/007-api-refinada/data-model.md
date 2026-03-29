# Data Model: API Refinada

**Feature**: 007-api-refinada
**Date**: 2026-03-29

## Overview

Esta feature NAO cria, altera ou remove entidades do banco de dados. Nenhuma migracao Prisma e necessaria. O data model existente permanece intacto.

## Entidades Existentes (somente leitura)

As seguintes entidades sao lidas/manipuladas pelos endpoints que serao refatorados, mas nenhuma sofre alteracao de schema:

- **User**: id, clerkUserId, email, name
- **PipelineStage**: id, name, position, isFinal, finalType
- **Deal**: id, companyName, stageId, ownerId, status, contactName, contactDetails, source, experiment, notes, icp, nextAction, stageUpdatedAt, lastTouchAt
- **Activity**: id, dealId, type, content, createdAt
- **DealStageHistory**: id, dealId, fromStageId, toStageId, changedAt

## Novo Componente (nao persistido)

### Validation Helper — parseAndValidate()

**Tipo**: Funcao utilitaria (nao entidade de dados)
**Input**: Request (HTTP), ZodSchema<T>
**Output**: T (dados tipados) ou throw AppError

**Response Shape padrao de sucesso**:
```
{ <recurso>: dados }          // 200, 201
(corpo vazio)                  // 204
```

**Response Shape padrao de erro**:
```
{
  error: {
    code: string,              // AppErrorCode
    message: string,           // mensagem descritiva
    details?: [                // apenas para INVALID_REQUEST
      { field: string, message: string }
    ]
  }
}
```

Estes shapes ja existem no sistema — a feature apenas garante que TODOS os endpoints os seguem.
