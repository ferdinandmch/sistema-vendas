# Feature Specification: Pipeline Drag & Drop

**Feature Branch**: `009-pipeline-dnd`
**Created**: 2026-03-30
**Status**: Draft
**Input**: User description: "Implementar Drag & Drop no Pipeline UI para permitir mover deals entre stages visualmente, disparando a operação real já existente no backend (POST /api/deals/:id/move) sem transferir lógica crítica para o frontend."

## Objective *(mandatory)*

Permitir que o usuário mova deals entre stages diretamente no board visual do pipeline, tornando a operação de movimentação acessível sem necessidade de chamadas manuais à API. O backend permanece como única fonte de verdade: o frontend apenas dispara a operação real de move já existente e reflete o resultado.

## Context *(mandatory)*

O board do pipeline já exibe stages como colunas e deals como cards (feature 008). A operação de movimentação de deal entre stages já existe no backend (`POST /api/deals/:id/move`), com todas as regras de domínio aplicadas: ownership, stage existence, transação atômica, criação de `deal_stage_history`, e atualização de `status` em stages finais.

Até agora, mover um deal exige chamada direta à API. Essa feature fecha esse gap, tornando o board operacional para uso diário.

A constituição determina que `@dnd-kit` é a biblioteca mandatória para drag & drop. Os cards já têm `data-deal-id` preparado desde a feature 008 antecipando exatamente essa feature.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Mover deal para outro stage (Priority: P1)

O usuário arrasta um card de deal de uma coluna para outra. O sistema detecta `deal_id` e `to_stage_id`, chama o endpoint de movimentação, e o board reflete o novo estado.

**Why this priority**: É o fluxo central da feature — sem ele, nada mais faz sentido.

**Independent Test**: Criar 2 stages e 1 deal no stage A via API. Acessar `/pipeline`, arrastar o deal para o stage B. Verificar que o deal aparece na coluna B e que um registro de `deal_stage_history` foi criado.

**Acceptance Scenarios**:

1. **Given** um deal ativo no stage A, **When** o usuário o arrasta para o stage B e solta, **Then** o endpoint `POST /api/deals/:id/move` é chamado com `toStageId` do stage B e o deal aparece na coluna B após confirmação do backend.
2. **Given** a operação retorna sucesso, **When** a resposta chega, **Then** o board exibe o deal na nova coluna sem recarregar a página.
3. **Given** um deal com status `won` ou `lost`, **When** o usuário tenta arrastá-lo, **Then** o card não responde ao arraste.

---

### User Story 2 — Soltar no mesmo stage (Priority: P1)

O usuário arrasta um deal e o solta na mesma coluna de origem.

**Why this priority**: Evitar mutações desnecessárias é regra de interface e de integridade.

**Independent Test**: Arrastar um deal e soltar na mesma coluna. Verificar no Network tab que nenhuma chamada ao endpoint é feita.

**Acceptance Scenarios**:

1. **Given** um deal no stage A, **When** o usuário o arrasta e solta na mesma coluna A, **Then** nenhuma chamada ao endpoint é disparada e o board permanece idêntico.

---

### User Story 3 — Falha na movimentação (Priority: P1)

O backend rejeita a operação (ex: deal já fechado, stage inválido, erro de rede).

**Why this priority**: O board não pode ficar em estado inconsistente. Feedback de erro é requisito de qualidade, não opcional.

**Independent Test**: Simular falha de rede (DevTools offline) ao soltar um card em outra coluna. Verificar que o deal retorna à coluna original e uma mensagem de erro é exibida.

**Acceptance Scenarios**:

1. **Given** um deal sendo arrastado para outra coluna, **When** o backend retorna erro, **Then** o deal retorna à coluna original e uma mensagem de erro visível é exibida ao usuário.
2. **Given** erro exibido, **When** o usuário fecha a mensagem ou tenta nova ação, **Then** o board está no estado anterior consistente e o card está disponível para novo arraste.

---

## Edge Cases

- O que acontece se o usuário arrastar enquanto uma mutação anterior do mesmo deal ainda está em curso? O card deve estar bloqueado durante mutação pendente.
- O que acontece se o stage de destino não existir mais (deletado em outra aba)? O backend rejeita com erro e o board reverte.
- O que acontece com deals com status `won` ou `lost`? Não devem ser arrastáveis — esses deals estão fechados.
- O que acontece se a conexão cair durante o drag? O board reverte ao estado anterior ao drop.
- O que acontece ao arrastar para a mesma coluna? Nenhuma ação é disparada — reordenação intra-coluna está fora de escopo.
- O que acontece se o backend rejeita por ownership (deal de outro usuário)? Erro retornado, board reverte.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Usuários DEVEM poder arrastar cards de deal entre colunas do board usando um handle dedicado (ícone de grip) visível no card — o card inteiro não é a área de drag, preservando a área do card para interação de click em features futuras.
- **FR-002**: Ao soltar um card em uma coluna diferente, o sistema DEVE chamar `POST /api/deals/:id/move` com o `toStageId` correto.
- **FR-003**: Ao soltar um card na mesma coluna de origem, nenhuma chamada ao endpoint DEVE ser disparada.
- **FR-004**: O board DEVE exibir feedback visual claro durante o arraste: card em estado de dragging e coluna de destino com highlight.
- **FR-005**: Em caso de falha do backend, o board DEVE retornar ao estado anterior e exibir mensagem de erro ao usuário.
- **FR-006**: Cards de deals com status `won` ou `lost` NÃO DEVEM ser arrastáveis.
- **FR-007**: Durante uma mutação pendente do deal, o card envolvido DEVE estar visualmente indisponível para novo arraste.
- **FR-008**: O board DEVE refletir o novo estado após confirmação do backend, via invalidação da query de deals.
- **FR-009**: A feature NÃO DEVE criar lógica de domínio nova no frontend — toda validação ocorre no backend.
- **FR-010**: O drag & drop DEVE funcionar com teclado (acessibilidade nativa do `@dnd-kit`).

### Key Entities *(include if feature involves data)*

- **Deal**: entidade já existente. O drag usa `deal.id` e `deal.stageId` (origem). O `data-deal-id` já está presente nos cards. O card expõe um handle dedicado (ícone de grip) como única área de ativação do drag.
- **Stage**: entidade já existente. A coluna é a drop zone — seu `stage.id` é o `toStageId` enviado ao backend.

## Business Rules *(mandatory)*

- **BR-001**: A movimentação real do deal DEVE ocorrer exclusivamente via backend. O frontend não altera o estado do deal diretamente como fonte de verdade.
- **BR-002**: Mover para o mesmo stage NÃO DEVE gerar chamada ao endpoint nem criar `deal_stage_history`.
- **BR-003**: Todas as regras já implementadas de movimentação (ownership, stage existence, transação atômica, criação de histórico, atualização de status) DEVEM ser respeitadas — o frontend apenas dispara o endpoint existente.
- **BR-004**: Deals com status `won` ou `lost` NÃO DEVEM ser arrastáveis na UI.
- **BR-005**: Qualquer falha do backend DEVE prevalecer sobre o estado visual temporário — o board retorna ao estado anterior.
- **BR-006**: O board inteiro NÃO DEVE ser bloqueado durante uma mutação — apenas o card sendo movido fica indisponível para novo arraste.

## Flows *(mandatory)*

### Primary Flow — Movimentação bem-sucedida

1. Usuário clica e arrasta pelo handle dedicado do card (`drag start`) — card recebe estilo visual de "arrastando" (opacidade reduzida).
2. Usuário passa o card sobre outra coluna — a coluna de destino recebe highlight visual de drop zone ativa.
3. Usuário solta o card (`drag end`) — UI identifica `deal.id` e `stage.id` da coluna de destino.
4. Se `toStageId === deal.stageId`, nenhuma ação é disparada (BR-002).
5. Se `toStageId !== deal.stageId`, `POST /api/deals/:id/move` é chamado com `{ toStageId }`.
6. Backend valida ownership, stage, executa transação atômica, cria `deal_stage_history`.
7. Backend retorna deal atualizado com HTTP 200.
8. A query de deals é invalidada — o board recarrega e exibe o deal na nova coluna.

### Failure / Edge Flow — Falha na movimentação

1. Usuário solta o card em outra coluna.
2. `POST /api/deals/:id/move` é chamado.
3. Backend retorna erro (4xx ou 5xx).
4. O board retorna ao estado anterior (deal permanece na coluna original).
5. Uma mensagem de erro visível e não-bloqueante é exibida ao usuário.
6. O card fica disponível para novo arraste.

## Dependencies *(mandatory)*

- **Technical Dependencies**: `@dnd-kit/core`, `@dnd-kit/utilities` (a instalar); shadcn `toast` via sonner (a instalar); TanStack Query `useMutation`; Next.js App Router.
- **Data Dependencies**: Endpoint `POST /api/deals/:id/move` já existente (feature 004). Query `GET /api/deals` já existente (feature 008). `data-deal-id` já presente nos cards (feature 008).
- **Auth Dependencies**: Clerk auth já implementado. O endpoint de move já exige autenticação e `owner_id` scoping. Nenhum novo middleware necessário.

## Skills Used *(mandatory)*

- `shadcn-ui`: Instalação de `toast` (sonner) para feedback de erro não-bloqueante; `Card` existente como base do draggable.
- `web-design-guidelines`: Feedback visual de arraste, highlight de drop zone, acessibilidade da interação de drag.
- `tanstack-query-best-practices`: `useMutation` com `onSettled` invalidando a query de deals (`mut-invalidate-queries`); `onError` para rollback visual (`mut-rollback-context`); `isPending` para estado de loading (`mut-loading-states`).
- `next-best-practices`: DnD context e mutation exclusivamente em Client Components; `page.tsx` permanece Server Component sem alteração.
- `clerk`: Operação de move já é protegida — nenhuma nova lógica de auth necessária nesta feature.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um deal pode ser movido entre colunas do board sem interação direta com a API.
- **SC-002**: Após movimentação bem-sucedida, o board reflete o novo estado sem recarregar a página.
- **SC-003**: Uma falha do backend nunca deixa o board em estado visual inconsistente — o deal sempre retorna à coluna original.
- **SC-004**: Soltar um deal na mesma coluna não gera nenhuma chamada ao backend (verificável no Network tab).
- **SC-005**: Deals com status `won` ou `lost` não respondem ao arraste.
- **SC-006**: A acessibilidade por teclado funciona para a operação de movimentação.

## Validation Criteria *(mandatory)*

- **VC-001**: Drag de um deal para outra coluna dispara exatamente uma chamada a `POST /api/deals/:id/move` com o `toStageId` correto — verificável no Network tab.
- **VC-002**: Após movimentação, `GET /api/deals` retorna o deal com o novo `stageId` e um registro em `deal_stage_history` foi criado — verificável via API.
- **VC-003**: Tentativa de mover deal de outro usuário retorna 403/404 do backend e o board reverte — ownership enforcement verificado.
- **VC-004**: Soltar na mesma coluna: zero chamadas ao endpoint no Network tab.
- **VC-005**: Simular erro de rede (DevTools offline ao soltar): deal retorna à coluna original e toast de erro é exibido.
- **VC-006**: Deal com `status: "won"` ou `"lost"`: card não inicia drag ao ser clicado/arrastado.

## Clarifications

### Session 2026-03-30

- Q: O drag nos cards é ativado pelo card inteiro ou por um handle dedicado? → A: Handle dedicado — apenas uma área específica do card (ícone de grip) ativa o drag, preservando o card para interação de click na feature 010.

## Assumptions

- O usuário está autenticado — Clerk auth já está em vigor em todas as rotas privadas.
- `@dnd-kit` é a única biblioteca de DnD aceita pela constituição.
- shadcn `toast` (sonner) será instalado nesta feature para exibir erros de movimentação.
- Reordenação de deals dentro da mesma coluna está fora de escopo.
- Reordenação de stages está fora de escopo.
- O drag é ativado exclusivamente via handle dedicado (ícone de grip) no card — o restante do card fica livre para click em features futuras (feature 010).
- A movimentação usa **otimista com overlay**: o card se move imediatamente para a coluna de destino com opacidade reduzida (estado "pendente") até o backend confirmar. Se o backend retornar erro, o card reverte à coluna original e um toast de erro é exibido. Isso torna a dependência do backend visível sem introduzir latência perceptível.
