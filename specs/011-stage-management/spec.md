# Feature Specification: Stage Management CRUD + Ordering

**Feature Branch**: `011-stage-management`
**Created**: 2026-03-30
**Status**: Draft
**Input**: Implementar a gestão de stages do sistema como uma feature administrativa/configurável, permitindo criar, editar, excluir com segurança e reordenar stages do pipeline, preservando consistência com deals, movimentação, histórico e regras de stages finais.

## Objective

Permitir que o usuário administre os stages do pipeline diretamente pela interface do sistema, sem depender de seed ou chamadas diretas à API. O resultado é um pipeline configurável que reflete o processo comercial real do usuário.

## Context

Até a feature 010, o pipeline existe como visualização e movimentação de deals, mas os stages são estáticos — criados apenas via seed ou API externa. Isso torna o produto dependente de configuração técnica para funcionar. Esta feature entrega a página `/settings/stages` onde o usuário cria, edita, reordena e exclui stages com segurança, desbloqueando o uso real do sistema.

Stages são **globais** (sem `ownerId`) — todos os usuários autenticados compartilham o mesmo conjunto de stages. Isso é intencional para o modelo atual single-tenant do sistema.

## Clarifications

### Session 2026-03-30

- Q: UI está dentro do escopo? → A: Sim — página `/settings/stages` com lista, criar, editar, excluir e reordenar
- Q: O que acontece com deals ao excluir um stage? → A: Bloquear exclusão se o stage tiver deals ativos, exibir erro com contagem
- Q: Stages são globais (sem ownerId) — intencional? → A: Sim, stages são globais compartilhados por todos os usuários
- Q: Mecanismo de reordenação? → A: Drag and drop com `@dnd-kit` (já instalado)
- Q: Nome único como regra de negócio? → A: Sim — bloquear duplicata com mensagem "Já existe um stage com esse nome"
- Q: `position` após exclusão? → A: Renumerar automaticamente sem gaps
- Q: Múltiplos stages won/lost? → A: Máximo 1 stage `won` e 1 `lost` — bloquear duplicata com erro
- Q: Padrão de UI para criar e editar stage? → A: Dialog modal — abre ao clicar em "Novo stage" ou no botão de editar; formulário dentro do modal

## User Scenarios & Testing

### User Story 1 - Criar stage (Priority: P1)

O usuário acessa `/settings/stages`, clica em "Novo stage", um Dialog modal abre com o formulário de criação. O usuário preenche nome e configuração de stage final, confirma, e o stage aparece imediatamente na lista e no pipeline.

**Why this priority**: Sem poder criar stages, o pipeline permanece vazio. É o desbloqueador de todo o restante do produto.

**Independent Test**: Acessar `/settings/stages` com banco vazio. Criar um stage "Prospecção". Verificar que aparece na lista e em `/pipeline`.

**Acceptance Scenarios**:

1. **Given** nenhum stage existe, **When** o usuário cria "Prospecção", **Then** o stage aparece na lista e no board do pipeline
2. **Given** já existe um stage "Prospecção", **When** o usuário tenta criar outro "Prospecção", **Then** o sistema bloqueia com "Já existe um stage com esse nome"
3. **Given** o usuário quer um stage final, **When** marca `isFinal = true` sem `finalType`, **Then** o sistema bloqueia com erro de validação
4. **Given** já existe um stage `won`, **When** o usuário tenta criar um segundo stage `won`, **Then** o sistema bloqueia com erro

---

### User Story 2 - Editar stage (Priority: P1)

O usuário clica em editar em um stage existente, um Dialog modal abre com o formulário preenchido com os dados atuais. O usuário altera o nome ou configuração de stage final, confirma, e a alteração reflete imediatamente no pipeline.

**Why this priority**: Stages criados podem precisar de ajuste de nome ou configuração sem recriar tudo.

**Independent Test**: Criar um stage "Cold". Editar para "Prospecção". Verificar que o pipeline exibe o novo nome.

**Acceptance Scenarios**:

1. **Given** existe um stage "Cold", **When** o usuário edita o nome para "Prospecção", **Then** o pipeline passa a exibir "Prospecção"
2. **Given** existe um stage não-final, **When** o usuário tenta torná-lo `won` e já existe um stage `won`, **Then** o sistema bloqueia com erro
3. **Given** o usuário edita para um nome já existente em outro stage, **Then** o sistema bloqueia com "Já existe um stage com esse nome"

---

### User Story 3 - Reordenar stages (Priority: P1)

O usuário arrasta um stage para cima ou para baixo na lista de `/settings/stages`. A nova ordem é salva e o pipeline reflete a sequência atualizada imediatamente.

**Why this priority**: A ordem dos stages define o fluxo visual do pipeline — é parte essencial da configuração.

**Independent Test**: Criar 3 stages. Arrastar o terceiro para a primeira posição. Verificar que o pipeline exibe na nova ordem.

**Acceptance Scenarios**:

1. **Given** existem 3 stages (pos 1, 2, 3), **When** o usuário arrasta o stage da pos 3 para pos 1, **Then** as posições são atualizadas atomicamente e o pipeline reflete a nova ordem
2. **Given** o usuário reordena, **Then** as positions são sempre sequenciais sem gaps

---

### User Story 4 - Excluir stage com segurança (Priority: P2)

O usuário tenta excluir um stage. Se o stage tiver deals ativos, o sistema bloqueia com mensagem explicativa. Se não tiver deals, o stage é removido e as posições são renumeradas.

**Why this priority**: Exclusão é necessária mas menos urgente que criar/editar. O risco de perda de dados justifica cuidado extra.

**Independent Test**: Criar stage com 2 deals. Tentar excluir — verificar bloqueio com contagem. Criar stage sem deals. Excluir — verificar que desaparece e posições renumeram.

**Acceptance Scenarios**:

1. **Given** um stage tem 2 deals ativos, **When** o usuário tenta excluir, **Then** o sistema bloqueia com "Este stage tem 2 deals ativos. Mova-os antes de excluir."
2. **Given** um stage não tem deals, **When** o usuário exclui, **Then** o stage é removido e as posições dos demais são renumeradas sequencialmente
3. **Given** o stage excluído estava na posição 2 de 4, **Then** os stages restantes ficam nas posições 1, 2, 3 (sem gaps)

---

## Edge Cases

- O que acontece se o usuário tentar excluir o único stage existente sem deals? → Permitido — o pipeline ficará vazio
- O que acontece se durante o drag de reordenação a request falhar? → Rollback visual para a ordem anterior (mesmo padrão do DnD de deals)
- O que acontece se `isFinal = true` com `finalType = null`? → Bloqueado pelo backend com erro de validação
- O que acontece se a posição sofrer race condition? → `position` tem constraint `@unique` no banco — backend retorna erro se colidir
- O que acontece se o usuário editar um stage final para não-final com deals nesse stage? → Permitido — o status dos deals não muda automaticamente

## Requirements

### Functional Requirements

- **FR-001**: O sistema DEVE exibir a lista de todos os stages em `/settings/stages` ordenada por `position`
- **FR-002**: O usuário DEVE conseguir criar um novo stage com `name` obrigatório; `position` é sugerida automaticamente como próxima disponível
- **FR-003**: O usuário DEVE conseguir editar `name`, `isFinal` e `finalType` de um stage existente
- **FR-004**: O usuário DEVE conseguir reordenar stages por drag and drop — o sistema DEVE persistir a nova ordem atomicamente
- **FR-005**: O sistema DEVE bloquear exclusão de stage que possua deals ativos, exibindo a contagem
- **FR-006**: O sistema DEVE renumerar `position` automaticamente após exclusão de um stage
- **FR-007**: O sistema DEVE bloquear criação ou edição com nome duplicado
- **FR-008**: O sistema DEVE bloquear criação de segundo stage `won` ou segundo stage `lost`
- **FR-009**: O sistema DEVE exigir `finalType` quando `isFinal = true`
- **FR-010**: A página `/settings/stages` DEVE ser acessível via link de navegação na área privada

### Key Entities

- **PipelineStage**: entidade já existente — `id`, `name`, `position`, `isFinal`, `finalType`, `createdAt`, `updatedAt`; global (sem ownerId); `name` e `position` são únicos no banco

## Business Rules

- **BR-001**: Toda operação de criação, edição, exclusão e reordenação DEVE ser executada pelo backend — o frontend nunca muta estado local sem confirmação da API
- **BR-002**: `name` é obrigatório e único entre todos os stages
- **BR-003**: `position` é obrigatória, única e sempre sequencial sem gaps após qualquer operação
- **BR-004**: `isFinal = true` exige `finalType` não-nulo (`won` ou `lost`)
- **BR-005**: Máximo 1 stage com `finalType = "won"` e 1 com `finalType = "lost"` no sistema
- **BR-006**: Stage com deals ativos NÃO pode ser excluído
- **BR-007**: Reordenação DEVE ser atômica — ou todos os `position` são atualizados ou nenhum
- **BR-008**: Toda operação exige usuário autenticado

## Flows

### Primary Flow — Criar stage

1. Usuário acessa `/settings/stages` (autenticação verificada)
2. Clica em "Novo stage"
3. Preenche `name` e opcionalmente `isFinal`/`finalType`
4. Sistema sugere a próxima `position` disponível
5. `POST /api/stages` com payload validado pelo backend
6. Stage persiste no banco
7. Lista atualiza via TanStack Query invalidation

### Primary Flow — Reordenar

1. Usuário arrasta stage para nova posição
2. Optimistic update reordena visualmente
3. `POST /api/stages/reorder` com array de `{ id, position }` ordenado
4. Backend atualiza todos os stages em transação atômica
5. Query invalidada — lista reflete ordem persistida
6. Se falhar: rollback visual para ordem anterior

### Failure Flow — Exclusão bloqueada

1. Usuário clica em excluir stage
2. `DELETE /api/stages/:id`
3. Backend consulta contagem de deals no stage
4. Se `count > 0`: retorna `400` com `{ error: { code: "STAGE_HAS_DEALS", message: "Este stage tem N deals ativos." } }`
5. UI exibe mensagem de erro inline — sem fechar o diálogo

## Dependencies

- **Technical Dependencies**: Next.js 16 App Router, TanStack Query v5, shadcn/ui, `@dnd-kit/core` + `@dnd-kit/utilities`, Clerk v7
- **Data Dependencies**: Tabela `PipelineStage` já existente; API de stages já implementada (GET, POST, PUT, DELETE); novo endpoint `POST /api/stages/reorder` a ser criado
- **Auth Dependencies**: `requireAuthenticatedUser()` em todas as rotas — padrão já estabelecido

## Skills Used

- `shadcn-ui`: componentes de UI (Card, Dialog, Form, Input, Button, Badge, Switch) — Dialog para criar/editar
- `web-design-guidelines`: layout e UX da página de settings
- `next-best-practices`: Server Component para rota, Client Components para interação
- `tanstack-query-best-practices`: invalidação de queries após mutações, optimistic update no reorder
- `clerk`: proteção da rota de settings

## Success Criteria

### Measurable Outcomes

- **SC-001**: Usuário consegue criar um stage pela UI sem usar a API diretamente
- **SC-002**: Usuário consegue reordenar stages por drag and drop e o pipeline reflete a nova ordem imediatamente
- **SC-003**: Tentativa de excluir stage com deals é bloqueada com mensagem clara antes de qualquer dano
- **SC-004**: Pipeline deixa de depender de seed ou configuração técnica para ter stages

## Validation Criteria

- **VC-001**: Criar stage pela UI → aparece no pipeline board
- **VC-002**: Editar nome do stage → pipeline exibe novo nome
- **VC-003**: Reordenar → `/api/stages` retorna nova ordem; pipeline reflete
- **VC-004**: Tentar excluir stage com deals → bloqueio com contagem correta
- **VC-005**: Excluir stage sem deals → posições renumeradas sequencialmente
- **VC-006**: Criar segundo stage `won` → bloqueado com erro
- **VC-007**: Acessar `/settings/stages` sem autenticação → redirecionado para login

## Assumptions

- Stages são globais — todos os usuários autenticados compartilham o mesmo pipeline
- O endpoint `POST /api/stages/reorder` será criado como parte desta feature (não existe ainda)
- A navegação para `/settings/stages` será adicionada no layout da área privada
- Não haverá migração de deals durante exclusão — responsabilidade do usuário mover os deals antes
