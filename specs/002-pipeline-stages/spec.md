# Feature Specification: Gestao de Stages do Pipeline

**Feature Branch**: `002-pipeline-stages`
**Created**: 2026-03-25
**Status**: Draft
**Module**: Module 1 — Core Pipeline
**Input**: Implementar a gestao de stages do pipeline, incluindo estrutura base das etapas, seed inicial, listagem ordenada e suporte as operacoes necessarias para sustentar a criacao de deals e a futura UI do pipeline.

## Objective

Prover ao sistema uma estrutura de etapas (stages) do pipeline de vendas, ordenada e persistida, que sirva como base obrigatoria para a criacao de deals, definicao de colunas visuais do pipeline e identificacao de estados finais de negociacao (ganho ou perda). Sem stages, o pipeline nao existe funcionalmente.

## Context

O Fineo Pipeline opera como um motor de vendas orientado a estados (Principio III da Constituicao). Os stages representam as posicoes possiveis de um deal dentro do funil de vendas. Esta feature e o primeiro bloco estrutural do Core Pipeline (Module 1), desbloqueando:

- criacao de deals (que exigem `stage_id` valido)
- renderizacao futura das colunas do pipeline
- movimentacao entre colunas (feature futura)
- determinacao de status final do deal via stages terminais

A autenticacao (Module 0) ja esta implementada na branch `001-clerk-auth`, garantindo que todas as operacoes de stages serao protegidas por sessao autenticada.

## Clarifications

### Session 2026-03-25

- Q: Como tratar posicoes duplicadas na criacao/edicao de stages? → A: Rejeitar com erro de validacao se a posicao ja esta ocupada por outro stage
- Q: O que acontece com `final_type` quando `is_final` e alterado para `false`? → A: Backend limpa `final_type` automaticamente (define como nulo)
- Q: Nomes de stages devem ser unicos? → A: Sim, sistema rejeita criacao/edicao se ja existe outro stage com o mesmo nome

## User Scenarios & Testing

### User Story 1 — Seed inicial de stages (Priority: P1)

O sistema deve possuir um conjunto padrao de stages disponivel imediatamente apos a inicializacao do banco de dados, sem intervencao manual do usuario.

**Why this priority**: Sem stages pre-existentes, nenhuma outra operacao do pipeline e possivel. E pre-requisito de todas as features subsequentes.

**Independent Test**: Executar o seed e verificar que todos os 8 stages padrao existem no banco, ordenados por posicao, com os campos corretos.

**Acceptance Scenarios**:

1. **Given** banco de dados vazio, **When** seed e executado, **Then** os 8 stages padrao sao criados com nomes, posicoes e flags corretos
2. **Given** seed ja executado anteriormente, **When** seed e executado novamente, **Then** os stages existentes nao sao duplicados (idempotencia)

---

### User Story 2 — Listagem ordenada de stages (Priority: P1)

Um usuario autenticado pode consultar todos os stages do pipeline, recebendo-os sempre ordenados por posicao.

**Why this priority**: A listagem e necessaria para qualquer visualizacao ou operacao que dependa de stages (criacao de deals, UI do pipeline).

**Independent Test**: Fazer uma requisicao autenticada ao endpoint de listagem e verificar que a resposta contem todos os stages ordenados por `position`.

**Acceptance Scenarios**:

1. **Given** stages existem no banco, **When** usuario autenticado solicita listagem, **Then** sistema retorna todos os stages ordenados por posicao ascendente
2. **Given** nenhuma sessao autenticada, **When** listagem e solicitada, **Then** sistema retorna erro de autenticacao

---

### User Story 3 — Criacao de stage (Priority: P2)

Um usuario autenticado pode criar novos stages no pipeline, informando nome, posicao e se e um stage final (com tipo de finalizacao).

**Why this priority**: Permite personalizacao do pipeline alem dos stages padrao, mas o sistema ja funciona com o seed inicial.

**Independent Test**: Criar um stage via API autenticada e verificar que ele aparece na listagem na posicao correta.

**Acceptance Scenarios**:

1. **Given** usuario autenticado, **When** envia dados validos (nome, posicao), **Then** stage e criado e aparece na listagem
2. **Given** usuario autenticado, **When** envia dados com `is_final=true` e `final_type="won"`, **Then** stage e criado como stage final do tipo "ganho"
3. **Given** usuario autenticado, **When** envia dados com `is_final=false` e `final_type="won"`, **Then** sistema rejeita a entrada (final_type so e valido para stages finais)
4. **Given** usuario autenticado, **When** envia dados sem nome, **Then** sistema rejeita com erro de validacao

---

### User Story 4 — Edicao de stage (Priority: P2)

Um usuario autenticado pode alterar nome, posicao e flags de finalizacao de um stage existente.

**Why this priority**: Complemento natural da criacao, mas nao bloqueia funcionalidade base.

**Independent Test**: Editar um stage existente e verificar que as alteracoes sao refletidas na listagem.

**Acceptance Scenarios**:

1. **Given** stage existente, **When** usuario autenticado envia nome atualizado, **Then** stage e atualizado com o novo nome
2. **Given** stage existente nao-final, **When** usuario altera para `is_final=true` com `final_type="lost"`, **Then** stage se torna final do tipo "perda"
3. **Given** stage inexistente, **When** edicao e solicitada, **Then** sistema retorna erro de recurso nao encontrado

---

### User Story 5 — Exclusao de stage (Priority: P3)

Um usuario autenticado pode remover um stage do pipeline, desde que a exclusao nao comprometa a integridade do sistema.

**Why this priority**: Operacao menos frequente e mais arriscada; funcionalidade base opera sem ela.

**Independent Test**: Excluir um stage sem deals associados e verificar que ele desaparece da listagem.

**Acceptance Scenarios**:

1. **Given** stage sem deals associados, **When** usuario autenticado solicita exclusao, **Then** stage e removido do sistema
2. **Given** stage com deals associados (cenario futuro), **When** exclusao e solicitada, **Then** sistema rejeita com erro de integridade
3. **Given** nenhuma sessao autenticada, **When** exclusao e solicitada, **Then** sistema retorna erro de autenticacao

## Edge Cases

- Seed executado multiplas vezes: stages padrao nao devem ser duplicados
- Criacao de stage com `final_type` sem `is_final=true`: sistema deve rejeitar
- Criacao de stage com `is_final=true` sem `final_type`: sistema deve rejeitar
- Edicao de stage que alteraria `is_final` para `false` enquanto `final_type` ainda esta definido: backend DEVE limpar `final_type` automaticamente (definir como nulo)
- Exclusao de stage referenciado por deals (protecao futura): sistema deve rejeitar
- Posicoes duplicadas: sistema DEVE rejeitar com erro de validacao se a posicao ja esta ocupada por outro stage
- Nome de stage vazio ou apenas espacos: sistema deve rejeitar

## Requirements

### Functional Requirements

- **FR-001**: Sistema DEVE possuir um mecanismo de seed que cria os 8 stages padrao no banco de forma idempotente
- **FR-002**: Sistema DEVE retornar stages ordenados por `position` em toda operacao de listagem
- **FR-003**: Sistema DEVE permitir criacao de novos stages com validacao de dados obrigatorios (`name`, `position`), rejeitando posicoes ja ocupadas e nomes duplicados
- **FR-004**: Sistema DEVE validar consistencia entre `is_final` e `final_type` (final_type so e aceito quando is_final e verdadeiro, e e obrigatorio nesse caso)
- **FR-005**: Sistema DEVE permitir edicao de stages existentes com as mesmas regras de validacao da criacao; ao receber `is_final=false`, backend DEVE limpar `final_type` automaticamente
- **FR-006**: Sistema DEVE permitir exclusao de stages que nao violem integridade referencial
- **FR-007**: Todas as operacoes de stages (listagem, criacao, edicao, exclusao) DEVEM exigir sessao autenticada
- **FR-008**: Sistema DEVE rejeitar valores de `final_type` diferentes de `won` ou `lost`

### Key Entities

- **Stage**: Representa uma etapa do pipeline de vendas. Atributos principais: identificador interno, nome (unico), posicao ordinal (unica), flag de finalizacao, tipo de finalizacao (ganho/perda), data de criacao
- **Stages Padrao**: Conjunto fixo de 8 stages iniciais que definem a estrutura base do pipeline: Cold (1), Warm (2), Initial Call (3), Qualified (4), Demo (5), Negotiation (6), Won (7, final/ganho), Lost (8, final/perda)

## Business Rules

- **BR-001**: Stages DEVEM ser a base estrutural do pipeline; nenhum deal pode existir sem um `stage_id` valido referenciando um stage existente
- **BR-002**: Stages finais (`is_final=true`) DEVEM obrigatoriamente ter `final_type` definido como `won` ou `lost`, determinando o desfecho do deal
- **BR-003**: Stages nao-finais DEVEM ter `final_type` nulo; o sistema nao aceita `final_type` para stages que nao sao finais
- **BR-004**: A posicao (`position`) define a ordem visual e logica das colunas do pipeline; a listagem DEVE respeitar essa ordenacao
- **BR-005**: O seed DEVE ser idempotente — executa-lo multiplas vezes nao cria duplicatas
- **BR-006**: Stages com deals associados (cenario futuro) NAO PODEM ser excluidos; a exclusao e protegida por integridade referencial
- **BR-007**: Todas as validacoes de entrada DEVEM ocorrer no backend, nunca dependendo exclusivamente do frontend
- **BR-008**: O nome do stage DEVE ser unico no sistema; criacao ou edicao com nome ja existente DEVE ser rejeitada
- **BR-009**: A posicao do stage DEVE ser unica no sistema; criacao ou edicao com posicao ja ocupada DEVE ser rejeitada
- **BR-010**: Ao alterar `is_final` para `false`, o backend DEVE limpar `final_type` automaticamente (definir como nulo)

## Flows

### Primary Flow — Listagem de stages

1. Usuario autenticado solicita listagem de stages
2. Backend valida sessao autenticada
3. Backend consulta stages ordenados por `position`
4. Backend retorna lista completa de stages ao solicitante

### Primary Flow — Criacao de stage

1. Usuario autenticado envia dados do novo stage (nome, posicao, is_final, final_type)
2. Backend valida sessao autenticada
3. Backend valida entrada conforme regras (nome obrigatorio, posicao obrigatoria, consistencia is_final/final_type)
4. Backend persiste o novo stage
5. Backend retorna o stage criado

### Failure / Edge Flow — Autenticacao

1. Requisicao sem sessao autenticada chega ao backend
2. Backend identifica ausencia de autenticacao
3. Backend retorna erro padronizado de autenticacao (sem expor detalhes internos)

### Failure / Edge Flow — Validacao

1. Usuario autenticado envia dados invalidos (ex: final_type sem is_final, nome vazio)
2. Backend valida entrada e identifica violacao
3. Backend retorna erro padronizado de validacao com detalhes dos campos invalidos

## Dependencies

- **Technical Dependencies**: Autenticacao (Module 0 — branch 001-clerk-auth concluida), sistema de validacao centralizada existente
- **Data Dependencies**: Modelo de usuario ja existente, necessidade de novo modelo Stage na base de dados
- **Auth Dependencies**: Clerk para autenticacao, user sync para contexto de sessao, middleware de protecao de rotas

## Skills Used

- `next-best-practices`: Padroes de Route Handlers e data patterns para garantir que a spec nao conflite com as melhores praticas do Next.js App Router (ex: separacao entre reads e mutations, uso correto de APIs)

## Success Criteria

### Measurable Outcomes

- **SC-001**: 100% dos 8 stages padrao sao criados pelo seed em banco vazio
- **SC-002**: Listagem retorna stages na ordem correta por posicao em 100% das requisicoes
- **SC-003**: 100% das tentativas de criacao/edicao com dados invalidos sao rejeitadas com erro de validacao
- **SC-004**: 100% das requisicoes sem autenticacao sao bloqueadas
- **SC-005**: Seed executado N vezes resulta exatamente nos mesmos 8 stages (zero duplicatas)

## Validation Criteria

- **VC-001**: Verificar que toda logica de CRUD de stages e executada pelo backend, sem mutacoes diretas pelo frontend (Principio I)
- **VC-002**: Verificar que stages sao persistidos corretamente e que o seed e idempotente (Principio II)
- **VC-003**: Verificar que todas as operacoes exigem sessao autenticada e que requisicoes nao autenticadas recebem erro padronizado (Principio IV)
- **VC-004**: Verificar que entradas sao validadas no backend com schemas centralizados e que erros seguem formato padrao (Principio V)

## Assumptions

- O sistema tera um unico pipeline por enquanto (sem multi-tenancy de pipelines)
- Stages sao compartilhados entre todos os usuarios do sistema
- A exclusao de stages com deals sera protegida quando deals forem implementados; por ora, exclusao e livre
- O seed e executado como parte do setup inicial do banco (via script ou comando)
- A posicao e um inteiro positivo; reordenacao visual e responsabilidade de feature futura
