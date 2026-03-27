# Feature Specification: Gestao de Deals

**Feature Branch**: `003-deal-management`
**Created**: 2026-03-26
**Status**: Draft
**Input**: User description: "Implementar a gestao de deals do sistema, incluindo criacao, listagem, detalhe e edicao, usando stage_id valido, vinculo com usuario autenticado via owner_id e aderencia ao modelo de dados definido no documento-base."

## Objective *(mandatory)*

Estabelecer o deal como entidade central do pipeline de vendas, permitindo que
usuarios autenticados criem, listem, consultem e editem deals vinculados ao seu
contexto de ownership, com stage valido e estado inicial consistente, formando a
base operacional para futuras features de movimentacao, historico e activities.

## Context *(mandatory)*

O sistema Fineo ja possui autenticacao (001-clerk-auth) e stages do pipeline
(002-pipeline-stages). Sem deals, o pipeline e uma estrutura vazia — stages
existem mas nao possuem entidades transitando por eles. Deals sao a entidade
principal que da vida ao pipeline: representam oportunidades de venda que ocupam
posicoes nos stages e pertencem a usuarios autenticados.

Esta feature cria o nucleo operacional do sistema. Todas as features subsequentes
(movimentacao entre stages, historico, activities, board visual) dependem da
existencia de deals corretamente criados, persistidos e vinculados.

## Clarifications

### Session 2026-03-26

- Q: Qual o tipo do campo `icp`? → A: Boolean — flag sim/nao indicando se o deal encaixa no ICP.
- Q: Resposta de deals deve incluir dados do stage? → A: Sim — incluir stage basico (id, name, position) embutido na resposta do deal.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Criar um deal no pipeline (Priority: P1)

Como usuario autenticado, quero criar um novo deal informando os dados da
oportunidade e o stage inicial para que o deal fique registrado no sistema e
associado ao meu usuario.

**Why this priority**: Sem criacao de deals, o pipeline nao tem entidades para
operar. Esta e a funcionalidade fundacional.

**Independent Test**: Enviar dados validos de um deal com stage_id existente e
verificar que o deal e criado com status active, stage_updated_at definido e
owner_id correspondente ao usuario autenticado.

**Acceptance Scenarios**:

1. **Given** um usuario autenticado com stages disponiveis, **When** ele envia
   dados validos de um deal com stage_id existente, **Then** o sistema cria o
   deal com status active, stage_updated_at definido e owner_id do usuario.
2. **Given** um usuario autenticado, **When** ele envia um deal com stage_id
   inexistente, **Then** o sistema rejeita a criacao com erro especifico.
3. **Given** um usuario autenticado, **When** ele envia um deal sem company_name,
   **Then** o sistema rejeita a criacao com erro de validacao.
4. **Given** um visitante sem sessao, **When** ele tenta criar um deal, **Then**
   o sistema bloqueia a operacao com erro de autenticacao.

---

### User Story 2 - Listar meus deals (Priority: P1)

Como usuario autenticado, quero ver a lista dos meus deals para acompanhar o
estado das minhas oportunidades de venda.

**Why this priority**: Listagem e complementar a criacao — sem visualizar os
deals criados, o usuario nao consegue operar o pipeline.

**Independent Test**: Criar deals para dois usuarios distintos e verificar que
cada usuario ve apenas seus proprios deals na listagem.

**Acceptance Scenarios**:

1. **Given** um usuario autenticado com deals criados, **When** ele solicita a
   listagem, **Then** o sistema retorna apenas os deals pertencentes a ele.
2. **Given** um usuario autenticado sem deals, **When** ele solicita a listagem,
   **Then** o sistema retorna uma lista vazia.
3. **Given** um visitante sem sessao, **When** ele tenta listar deals, **Then**
   o sistema bloqueia a operacao com erro de autenticacao.

---

### User Story 3 - Consultar detalhe de um deal (Priority: P2)

Como usuario autenticado, quero acessar os detalhes completos de um deal
especifico para entender o estado atual da oportunidade.

**Why this priority**: O detalhe e necessario para edicao e para futuras
features de movimentacao e historico, mas a listagem basica ja permite operacao
minima.

**Independent Test**: Consultar um deal existente do usuario e verificar que
todos os campos sao retornados. Tentar consultar deal de outro usuario e
verificar que o acesso e negado.

**Acceptance Scenarios**:

1. **Given** um usuario autenticado com um deal existente, **When** ele solicita
   o detalhe pelo id, **Then** o sistema retorna todos os dados do deal.
2. **Given** um usuario autenticado, **When** ele solicita detalhe de um deal que
   pertence a outro usuario, **Then** o sistema nega acesso.
3. **Given** um usuario autenticado, **When** ele solicita detalhe de um deal
   inexistente, **Then** o sistema retorna erro de not found.

---

### User Story 4 - Editar um deal (Priority: P2)

Como usuario autenticado, quero editar os dados de um deal meu para manter as
informacoes da oportunidade atualizadas.

**Why this priority**: Edicao permite corrigir e atualizar dados, mas a operacao
basica do pipeline funciona com criacao e listagem.

**Independent Test**: Editar campos de um deal existente do usuario e verificar
que as alteracoes sao persistidas. Tentar editar deal de outro usuario e
verificar que a operacao e negada.

**Acceptance Scenarios**:

1. **Given** um usuario autenticado com um deal existente, **When** ele envia
   alteracoes validas, **Then** o sistema persiste as mudancas e retorna o deal
   atualizado.
2. **Given** um usuario autenticado, **When** ele tenta editar um deal de outro
   usuario, **Then** o sistema nega a operacao.
3. **Given** um usuario autenticado, **When** ele tenta editar um deal
   inexistente, **Then** o sistema retorna erro de not found.
4. **Given** um usuario autenticado, **When** ele envia dados invalidos na
   edicao, **Then** o sistema rejeita com erro de validacao.

## Edge Cases

- O que acontece quando o usuario tenta criar um deal com um stage_id que existe
  mas pertence a um stage final (won/lost)?
  - **Decisao**: Permitido. O stage inicial do deal e uma escolha do usuario.
    Restricoes de movimentacao serao tratadas em features futuras.
- O que acontece quando o usuario tenta editar o stage_id de um deal?
  - **Decisao**: Nao permitido nesta feature. Mudanca de stage sera tratada pela
    feature de movimentacao (stage movement). O campo stage_id e read-only na
    edicao.
- Como o sistema trata um deal cujo stage foi deletado apos a criacao?
  - **Decisao**: A integridade referencial do banco impede delecao de stages com
    deals associados (STAGE_HAS_DEALS, implementado em 002).
- O que acontece quando o usuario envia campos extras nao reconhecidos no payload?
  - **Decisao**: Campos extras sao ignorados silenciosamente pela validacao Zod
    (comportamento padrao de strip).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST permitir que um usuario autenticado crie um deal com
  dados validos e stage_id referenciando um stage existente.
- **FR-002**: O sistema MUST definir status como active e stage_updated_at como
  o momento da criacao para todo novo deal.
- **FR-003**: O sistema MUST associar automaticamente o owner_id do deal ao
  usuario autenticado que o criou.
- **FR-004**: O sistema MUST retornar apenas os deals pertencentes ao usuario
  autenticado na listagem.
- **FR-005**: O sistema MUST permitir que o usuario autenticado consulte o
  detalhe completo de um deal que lhe pertence.
- **FR-006**: O sistema MUST negar acesso a deals que nao pertencem ao usuario
  autenticado (detalhe e edicao).
- **FR-007**: O sistema MUST permitir edicao parcial dos campos editaveis de um
  deal pertencente ao usuario autenticado.
- **FR-008**: O sistema MUST impedir a edicao de stage_id, owner_id, status,
  stage_updated_at e campos de controle temporal na operacao de edicao.
- **FR-009**: O sistema MUST validar que stage_id referencia um stage existente
  na criacao do deal.
- **FR-010**: O sistema MUST exigir company_name como campo obrigatorio na
  criacao do deal.
- **FR-011**: Todas as operacoes de deals MUST exigir autenticacao. Requisicoes
  sem sessao valida devem receber erro de autenticacao padronizado.
- **FR-012**: Deals MUST NOT ser fisicamente deletados. Nenhuma operacao de
  exclusao sera disponibilizada nesta feature.
- **FR-013**: As respostas de listagem e detalhe de deals MUST incluir os dados
  basicos do stage associado (id, nome, posicao) embutidos na resposta.

### Key Entities *(include if feature involves data)*

- **Deal**: Oportunidade de venda que transita pelo pipeline. Possui dados de
  contato, vinculo com stage atual, proprietario (owner), status de lifecycle
  e timestamps de controle.
  - Campos centrais: company_name, contact_name, contact_details, source,
    experiment, notes, icp (boolean), next_action
  - Campos de estado: stage_id, stage_updated_at, status, last_touch_at
  - Campos de controle: owner_id, created_at, updated_at
  - Resposta: listagem e detalhe incluem stage basico (id, name, position)
    embutido na resposta, evitando chamada extra do frontend.

- **PipelineStage** (existente): Stage do pipeline que define a posicao do deal.
  Relacionamento: um stage pode ter muitos deals.

- **User** (existente): Usuario autenticado do sistema. Relacionamento: um
  usuario pode ter muitos deals (owner_id).

## Business Rules *(mandatory)*

- **BR-001**: Todo deal MUST ter um owner_id correspondente ao usuario
  autenticado que o criou. O owner_id e definido pelo backend, nunca pelo
  frontend.
- **BR-002**: Todo deal MUST iniciar com status active. O status nao e editavel
  pelo usuario nesta feature.
- **BR-003**: Todo deal MUST ter stage_updated_at definido automaticamente na
  criacao. Este campo registra quando o deal entrou no stage atual.
- **BR-004**: O campo stage_id MUST referenciar um PipelineStage existente. A
  criacao MUST falhar se o stage_id for invalido.
- **BR-005**: Toda query e mutacao de deals MUST aplicar filtro de owner_id para
  garantir que usuarios so acessem seus proprios deals.
- **BR-006**: Deals MUST NOT ser fisicamente deletados. O controle de lifecycle
  sera feito por status em features futuras.
- **BR-007**: O campo stage_id MUST NOT ser alteravel via edicao. Mudanca de
  stage sera tratada pela feature de movimentacao.
- **BR-008**: Campos de controle (owner_id, status, stage_updated_at,
  created_at, updated_at) MUST NOT ser alteraveis via edicao pelo usuario.
- **BR-009**: company_name MUST ser obrigatorio e nao-vazio na criacao.
- **BR-010**: last_touch_at MUST ser null na criacao. Este campo sera gerenciado
  por features futuras de activities.

## Flows *(mandatory)*

### Primary Flow — Criacao de Deal

1. Usuario autenticado envia dados do deal com stage_id valido.
2. Backend valida autenticacao e extrai owner_id do contexto.
3. Backend valida payload com schema Zod centralizado.
4. Backend valida existencia do stage_id no banco.
5. Backend cria o deal com status=active, stage_updated_at=now, owner_id do
   contexto e last_touch_at=null.
6. Backend retorna o deal criado com todos os campos.

### Primary Flow — Listagem de Deals

1. Usuario autenticado solicita listagem de deals.
2. Backend valida autenticacao e extrai owner_id do contexto.
3. Backend consulta deals filtrados por owner_id.
4. Backend retorna lista de deals do usuario.

### Primary Flow — Detalhe de Deal

1. Usuario autenticado solicita um deal por id.
2. Backend valida autenticacao e extrai owner_id do contexto.
3. Backend busca o deal por id com filtro de owner_id.
4. Se encontrado, retorna os dados completos. Se nao, retorna not found.

### Primary Flow — Edicao de Deal

1. Usuario autenticado envia alteracoes para um deal existente.
2. Backend valida autenticacao e extrai owner_id do contexto.
3. Backend valida payload com schema Zod centralizado (campos editaveis apenas).
4. Backend busca o deal por id com filtro de owner_id.
5. Se encontrado, persiste alteracoes e retorna deal atualizado. Se nao, retorna
   not found.

### Failure / Edge Flow

1. Requisicao sem sessao valida: bloqueada com erro UNAUTHORIZED (401).
2. Payload invalido: rejeitado com erro INVALID_REQUEST (400) e campo details.
3. stage_id inexistente na criacao: rejeitado com erro STAGE_NOT_FOUND (400).
4. Deal nao encontrado (id invalido ou ownership incorreto): erro
   DEAL_NOT_FOUND (404).
5. Tentativa de editar campo protegido: campo ignorado pela validacao Zod
   (schema aceita apenas campos editaveis).

## Dependencies *(mandatory)*

- **Technical Dependencies**: Next.js App Router, Prisma, Zod para validacao,
  servicos existentes de autenticacao e stages.
- **Data Dependencies**: Tabela users (001-clerk-auth), tabela pipeline_stages
  (002-pipeline-stages), nova tabela deals.
- **Auth Dependencies**: Clerk para sessao, require-auth para contexto
  autenticado, sync-user para garantir registro interno do usuario.

## Skills Used *(mandatory)*

- `next-best-practices`: Aplicar padroes de Route Handlers, validacao
  centralizada e data patterns para a API de deals.
- `postgresql-code-review`: Revisar modelo de dados, indices, foreign keys e
  integridade referencial da tabela de deals.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos deals criados possuem owner_id correspondente ao usuario
  autenticado, status active e stage_updated_at definido.
- **SC-002**: 100% das listagens retornam exclusivamente deals do usuario
  autenticado, sem vazamento de dados entre usuarios.
- **SC-003**: 100% das tentativas de acesso a deals de outros usuarios sao
  bloqueadas antes de retornar dados.
- **SC-004**: 100% das tentativas de criacao com stage_id invalido sao rejeitadas
  com erro especifico.
- **SC-005**: 100% das operacoes de deals sem sessao valida recebem erro de
  autenticacao padronizado.
- **SC-006**: Usuarios autenticados conseguem criar, listar, consultar e editar
  deals em fluxo completo sem erros para dados validos.

## Validation Criteria *(mandatory)*

- **VC-001**: Validar que deals criados possuem owner_id, status=active e
  stage_updated_at corretos (Principio I — backend source of truth).
- **VC-002**: Validar que a listagem e o detalhe aplicam filtro de owner_id
  em toda consulta (Principio IV — ownership security).
- **VC-003**: Validar que stage_id referencia um stage existente e que a
  integridade referencial e mantida (Principio IV — transactional consistency).
- **VC-004**: Validar que todas as rotas exigem autenticacao e retornam erros
  padronizados (Principio V — contract discipline).
- **VC-005**: Validar que campos protegidos (stage_id, owner_id, status,
  stage_updated_at) nao sao alteraveis via edicao (Principio I — backend
  source of truth).
- **VC-006**: Validar que deals nao sao fisicamente deletados em nenhuma
  operacao (Principio II — mandatory persistence).

## Assumptions

- O modelo de dados do deal segue os campos definidos pelo usuario: company_name,
  contact_name, contact_details, source, experiment, notes, icp (boolean),
  next_action, stage_id, stage_updated_at, status, last_touch_at, owner_id.
- O campo status aceita apenas o valor active nesta feature. Valores adicionais
  (archived, won, lost) serao definidos em features futuras de lifecycle.
- O campo last_touch_at inicia como null e sera gerenciado por features futuras
  de activities.
- A listagem nao requer filtros avancados, paginacao ou ordenacao especifica
  nesta feature. Esses refinamentos serao tratados em features futuras.
- O relacionamento Deal -> PipelineStage e obrigatorio (stage_id nao nullable).
- O relacionamento Deal -> User e obrigatorio (owner_id nao nullable).
