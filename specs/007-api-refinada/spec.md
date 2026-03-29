# Feature Specification: API Refinada

**Feature Branch**: `007-api-refinada`
**Created**: 2026-03-29
**Status**: Draft
**Input**: User description: "Implementar a camada de API refinada do sistema, padronizando respostas, erros, contratos e comportamento dos endpoints já existentes de auth, stages, deals, move stage, activities e stage history."

## Objective

Tornar a API do sistema previsivel, consistente e confiavel para consumo pelo frontend, debugging e evolucao futura. Todos os endpoints existentes devem seguir contratos uniformes de sucesso, erro, validacao e autenticacao, eliminando inconsistencias acumuladas nas features anteriores.

## Context

O Fineo Pipeline possui 6 features implementadas (auth, stages, deals, move, activities, history) com 14 endpoints ativos. Cada feature foi desenvolvida incrementalmente, resultando em pequenas inconsistencias entre os endpoints: duplicacao de logica de parsing JSON, tratamento de erro inline vs helpers, formatacao de erros Zod manual em cada handler, e ausencia de um helper centralizado de validacao. Esta feature pertence ao Module 4 (API) da constituicao e serve como base para as features de UI que seguem (Pipeline UI, Drag & Drop, Deal Page).

## User Scenarios & Testing

### User Story 1 - Respostas de Sucesso Padronizadas (Priority: P1)

O frontend consome qualquer endpoint do sistema e recebe respostas de sucesso com estrutura previsivel: dados envelopados em propriedade nomeada, status codes corretos (200 para leitura/atualizacao, 201 para criacao, 204 para delecao), e formato JSON consistente.

**Why this priority**: O frontend precisa de previsibilidade para implementar tratamento generico de respostas. Sem isso, cada tela precisa de logica especifica por endpoint.

**Independent Test**: Chamar cada endpoint com dados validos e verificar que a resposta segue o contrato padronizado de sucesso.

**Acceptance Scenarios**:

1. **Given** um usuario autenticado, **When** chama GET em qualquer endpoint de listagem, **Then** recebe `{ <recurso_plural>: [...] }` com status 200
2. **Given** um usuario autenticado com payload valido, **When** chama POST em qualquer endpoint de criacao, **Then** recebe `{ <recurso_singular>: {...} }` com status 201
3. **Given** um usuario autenticado com payload valido, **When** chama PUT em qualquer endpoint de atualizacao, **Then** recebe `{ <recurso_singular>: {...} }` com status 200
4. **Given** um usuario autenticado, **When** chama DELETE em qualquer endpoint de delecao, **Then** recebe corpo vazio com status 204

---

### User Story 2 - Respostas de Erro Padronizadas (Priority: P1)

Quando qualquer operacao falha, o sistema retorna erro com estrutura uniforme `{ error: { code, message, details? } }` e status HTTP apropriado. O frontend pode tratar erros de forma generica sem conhecer detalhes de cada endpoint.

**Why this priority**: Erros inconsistentes forcam o frontend a implementar tratamento especifico por endpoint, aumentando complexidade e risco de bugs.

**Independent Test**: Provocar cada tipo de erro (401, 400, 404, 409, 500) em diferentes endpoints e verificar que todos seguem o mesmo formato.

**Acceptance Scenarios**:

1. **Given** um cliente sem sessao, **When** chama qualquer endpoint protegido, **Then** recebe `{ error: { code: "UNAUTHORIZED", message } }` com status 401
2. **Given** um usuario autenticado com payload invalido, **When** chama qualquer endpoint com validacao, **Then** recebe `{ error: { code: "INVALID_REQUEST", message, details: [...] } }` com status 400
3. **Given** um usuario autenticado, **When** tenta acessar recurso inexistente ou de outro usuario, **Then** recebe `{ error: { code: "<RECURSO>_NOT_FOUND", message } }` com status 404
4. **Given** um usuario autenticado, **When** tenta operacao com conflito (nome duplicado, stage com deals), **Then** recebe `{ error: { code, message } }` com status 409

---

### User Story 3 - Validacao Centralizada de Payloads (Priority: P1)

A validacao de corpo JSON e formatacao de erros Zod e feita por um helper centralizado, eliminando duplicacao de logica de parsing e mapeamento de erros em cada route handler. Cada handler delega validacao ao helper e recebe dados tipados.

**Why this priority**: A duplicacao atual de parsing JSON + mapeamento Zod em cada handler e fonte de inconsistencia e dificulta manutencao. Centralizar e pre-requisito para consistencia real.

**Independent Test**: Enviar payloads invalidos para endpoints com validacao e verificar que todos retornam erros no mesmo formato, usando o helper centralizado.

**Acceptance Scenarios**:

1. **Given** um request com corpo JSON invalido (malformed), **When** o helper tenta parsear, **Then** retorna `{ error: { code: "INVALID_REQUEST", message: "Invalid JSON body" } }` com status 400
2. **Given** um request com corpo que falha validacao Zod, **When** o helper valida contra schema, **Then** retorna `{ error: { code: "INVALID_REQUEST", message: "Validation failed", details: [{ field, message }] } }` com status 400
3. **Given** um request com corpo valido, **When** o helper valida, **Then** retorna dados tipados conforme schema Zod sem erro

---

### User Story 4 - Consistencia entre Todos os Endpoints (Priority: P2)

Todos os 14 endpoints existentes seguem os mesmos padroes de autenticacao, ownership, validacao, formato de sucesso e formato de erro. Nenhum endpoint se comporta de forma diferente dos demais para o mesmo tipo de operacao.

**Why this priority**: Depende das 3 user stories anteriores estarem implementadas. E a integracao final que garante uniformidade.

**Independent Test**: Executar suite completa de testes de contrato em todos os endpoints e verificar zero inconsistencias.

**Acceptance Scenarios**:

1. **Given** todos os endpoints do sistema, **When** testados contra o contrato padrao, **Then** todos retornam sucesso e erro no formato especificado
2. **Given** o endpoint GET /api/me, **When** falha, **Then** usa helpers de erro padronizados (nao inline)
3. **Given** endpoints com validacao, **When** recebem JSON malformed, **Then** todos retornam o mesmo formato de erro via helper centralizado

## Edge Cases

- O que acontece quando o body do request e vazio em endpoints que esperam payload? Sistema retorna INVALID_REQUEST com mensagem clara
- O que acontece quando o Content-Type nao e application/json? Sistema tenta parsear e retorna INVALID_REQUEST se falhar
- Como o sistema trata erros inesperados (Prisma connection loss, runtime error)? Route handler re-throws, Next.js retorna 500 generico — esta feature nao altera esse comportamento
- O que acontece com o endpoint DELETE /api/stages/:id que retorna 204? Mantém 204 sem corpo — e o padrao correto para delecao
- Como tratar o GET /api/me que atualmente tem tratamento de erro inline? Migrar para usar helpers padronizados de erro

## Requirements

### Functional Requirements

- **FR-001**: Sistema DEVE ter um helper centralizado de parsing JSON + validacao Zod que recebe request e schema, retorna dados tipados ou lanca AppError
- **FR-002**: Todos os route handlers com payload DEVEM usar o helper centralizado de validacao ao inves de parsing manual
- **FR-003**: Todas as respostas de sucesso DEVEM seguir o envelope padrao: `{ <recurso>: dados }` para operacoes com retorno, corpo vazio para 204
- **FR-004**: Todas as respostas de erro DEVEM seguir o formato `{ error: { code, message, details? } }` via errorResponse()
- **FR-005**: O endpoint GET /api/me DEVE usar helpers padronizados de erro ao inves de construcao inline
- **FR-006**: Todos os endpoints protegidos DEVEM chamar requireAuthenticatedUser() como primeira operacao
- **FR-007**: Todos os endpoints com ownership DEVEM validar ownerId antes de leitura ou mutacao
- **FR-008**: Erros de validacao Zod DEVEM ser formatados como `details: [{ field, message }]` pelo helper centralizado

### Key Entities

- **AppError**: Classe de erro padronizada com code, message, status e details opcional. Ja existe, sem alteracoes necessarias
- **Validation Helper**: Novo helper que centraliza parsing JSON + validacao Zod + formatacao de erros

## Business Rules

- **BR-001**: A feature NAO altera regras de negocio existentes — apenas padroniza a forma como sao expostas pela API
- **BR-002**: Todos os error codes existentes DEVEM ser mantidos — nenhum codigo novo e criado, nenhum existente e removido
- **BR-003**: Ownership enforcement DEVE permanecer identico — esta feature apenas garante uniformidade no padrao
- **BR-004**: Listas vazias DEVEM continuar retornando array vazio com status 200, nunca como erro
- **BR-005**: A ordem de operacoes em cada handler DEVE ser: autenticacao → parsing/validacao → logica de negocio → resposta
- **BR-006**: Nenhum endpoint novo e criado — apenas endpoints existentes sao refinados

## Flows

### Primary Flow — Requisicao com Sucesso

1. Cliente envia request para endpoint protegido
2. Handler chama requireAuthenticatedUser() para autenticacao
3. Se endpoint tem payload: handler chama helper centralizado com request e schema Zod
4. Helper parseia JSON, valida contra schema, retorna dados tipados
5. Handler executa logica de negocio via service layer
6. Handler retorna resposta padronizada de sucesso com status code correto

### Failure Flow — Erro de Validacao

1. Cliente envia request com payload invalido
2. Handler chama requireAuthenticatedUser() para autenticacao
3. Handler chama helper centralizado com request e schema Zod
4. Helper detecta JSON malformed ou falha de validacao Zod
5. Helper lanca AppError com code INVALID_REQUEST e details formatados
6. Handler catch captura AppError e retorna via errorResponse()

### Failure Flow — Erro de Autenticacao

1. Cliente envia request sem sessao valida
2. Handler chama requireAuthenticatedUser()
3. Funcao lanca unauthorizedError()
4. Handler catch captura AppError e retorna via errorResponse() com status 401

### Failure Flow — Erro de Dominio

1. Cliente envia request valido para operacao com restricao de dominio
2. Handler executa autenticacao e validacao com sucesso
3. Service layer detecta violacao (deal nao encontrado, stage duplicado, deal fechado)
4. Service lanca AppError especifico (dealNotFoundError, sameStageError, etc.)
5. Handler catch captura AppError e retorna via errorResponse() com status apropriado

## Dependencies

- **Technical Dependencies**: Next.js App Router (route handlers), Zod (validation schemas), Prisma (ORM)
- **Data Dependencies**: Nenhuma migracao necessaria — feature puramente de refatoracao de handlers
- **Auth Dependencies**: Clerk via requireAuthenticatedUser(), session-context.ts

## Skills Used

- `next-best-practices`: Padroes de route handlers no App Router, async params, error handling
- `postgresql-code-review`: Revisao das queries Prisma nos handlers durante refatoracao
- `update-docs`: Atualizacao de CLAUDE.md apos conclusao

## Success Criteria

### Measurable Outcomes

- **SC-001**: 100% dos endpoints retornam respostas de sucesso no formato padrao envelopado
- **SC-002**: 100% dos endpoints retornam erros no formato `{ error: { code, message, details? } }` via errorResponse()
- **SC-003**: 0 linhas de parsing JSON manual duplicado nos route handlers — todo parsing via helper centralizado
- **SC-004**: 100% dos testes existentes continuam passando apos refatoracao (zero regressao)
- **SC-005**: Nenhuma regra de negocio alterada — apenas a camada de exposicao da API

## Validation Criteria

- **VC-001**: Testes de contrato verificam formato de sucesso de cada endpoint
- **VC-002**: Testes de contrato verificam formato de erro de cada endpoint (401, 400, 404, 409)
- **VC-003**: Testes de integracao existentes (111) continuam passando sem alteracao
- **VC-004**: Code review confirma que nenhum handler faz parsing JSON manual — todos usam helper
- **VC-005**: Code review confirma que GET /api/me usa helpers padronizados de erro

## Assumptions

- Os 14 endpoints listados no escopo sao todos os endpoints existentes no sistema
- O formato de erro `{ error: { code, message, details? } }` ja em uso e o formato definitivo — nao sera alterado
- O helper centralizado de validacao sera um modulo utilitario, nao um middleware Next.js
- A classe AppError e as funcoes factory de erro existentes sao suficientes — nenhuma nova e necessaria
- Testes existentes cobrem o comportamento atual; refatoracao nao deve quebra-los
