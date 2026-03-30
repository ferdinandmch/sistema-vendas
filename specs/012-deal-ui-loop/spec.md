# Feature Specification: Deal Management UI Loop

**Feature Branch**: `012-deal-ui-loop`
**Created**: 2026-03-30
**Status**: Draft
**Input**: Feature: Completar o loop de gestão de deals — criar deal pela UI, editar deal pela UI, e registrar atividades (nota, ligação, reunião, follow-up) na página de detalhe do deal.

## Clarifications

### Session 2026-03-30

- Q: O formulário de nova atividade deve ser inline ou Dialog modal? → A: Formulário inline fixo no topo da lista de atividades — select de tipo + textarea + botão "Registrar" sempre visível
- Q: Os campos opcionais no formulário de criar deal devem ser todos visíveis ou estar atrás de um toggle? → A: Formulário compacto — apenas empresa + stage obrigatórios visíveis por padrão; botão "Mais informações" expande os campos opcionais

## Objective

Fechar o loop mínimo viável de uso do sistema: permitir que o usuário crie deals, edite suas informações e registre atividades diretamente pela interface, sem depender de chamadas diretas à API. Sem estas funcionalidades, o pipeline permanece vazio e o sistema não tem valor prático.

## Context

Até a feature 011, o Fineo tem um pipeline visual funcional, movimentação de deals por drag-and-drop, página de detalhe e gestão de stages. Porém, nenhum dado pode ser inserido pela interface — o usuário precisa chamar a API diretamente para criar qualquer deal ou atividade.

Isso torna o produto inutilizável por qualquer pessoa que não seja desenvolvedora. Esta feature entrega as três operações de escrita essenciais: criar um deal no pipeline, editar suas informações e registrar o histórico de contatos (atividades), completando o ciclo básico de trabalho de um vendedor.

## User Scenarios & Testing

### User Story 1 - Criar deal (Priority: P1)

O usuário acessa o pipeline, clica em "Novo deal", preenche o formulário com nome da empresa e seleciona o stage inicial. O deal aparece imediatamente na coluna correta do pipeline.

**Why this priority**: Sem criar deals, o pipeline fica vazio. É o desbloqueador absoluto de qualquer uso real do sistema.

**Independent Test**: Acessar `/pipeline` com o banco vazio de deals. Clicar em "Novo deal". Preencher empresa "Acme Corp" e selecionar o primeiro stage. Confirmar. Verificar que o card aparece na coluna do stage selecionado.

**Acceptance Scenarios**:

1. **Given** o pipeline está vazio, **When** o usuário cria um deal com empresa "Acme" e stage "Prospecção", **Then** o card aparece na coluna "Prospecção" imediatamente
2. **Given** o formulário está aberto, **When** o usuário tenta confirmar sem preencher o nome da empresa, **Then** o sistema bloqueia com mensagem de validação
3. **Given** o formulário está aberto, **When** o usuário tenta confirmar sem selecionar um stage, **Then** o sistema bloqueia com mensagem de validação
4. **Given** não existem stages cadastrados, **When** o usuário abre o formulário de criar deal, **Then** o sistema exibe mensagem orientativa com link para criar stages

---

### User Story 2 - Editar deal (Priority: P1)

O usuário acessa a página de detalhe de um deal e clica em "Editar". Um formulário abre com os dados atuais preenchidos. O usuário altera as informações desejadas e salva. A página reflete as mudanças imediatamente.

**Why this priority**: Informações de deals mudam ao longo do processo comercial (contato, notas, próxima ação). Sem edição, o deal fica desatualizado e perde valor como ferramenta de acompanhamento.

**Independent Test**: Criar um deal "Acme". Acessar sua página de detalhe. Clicar em "Editar". Alterar o nome para "Acme Corp" e adicionar uma nota. Salvar. Verificar que a página exibe os novos dados.

**Acceptance Scenarios**:

1. **Given** existe um deal "Acme", **When** o usuário edita o nome para "Acme Corp", **Then** a página de detalhe exibe "Acme Corp"
2. **Given** o formulário de edição está aberto, **When** o usuário apaga o nome da empresa e tenta salvar, **Then** o sistema bloqueia com mensagem de validação
3. **Given** o usuário edita e salva, **Then** o card no pipeline também reflete o novo nome
4. **Given** o formulário de edição está aberto, **When** o usuário clica em Cancelar, **Then** nenhuma alteração é feita

---

### User Story 3 - Registrar atividade (Priority: P1)

O usuário está na página de detalhe de um deal e registra uma atividade (nota, ligação, reunião ou follow-up). A atividade aparece imediatamente na lista de atividades do deal.

**Why this priority**: O registro de atividades é o núcleo do uso diário do sistema — é como o vendedor documenta o histórico de contato. Sem isso, o deal é apenas um nome sem contexto.

**Independent Test**: Acessar a página de detalhe de um deal. Clicar em "Nova atividade". Selecionar tipo "Ligação" e escrever "Falei com o CEO, demonstrou interesse". Confirmar. Verificar que a atividade aparece na lista com tipo e conteúdo corretos.

**Acceptance Scenarios**:

1. **Given** um deal sem atividades, **When** o usuário registra uma nota "Primeiro contato feito", **Then** a atividade aparece na lista com tipo "nota" e o texto correto
2. **Given** o formulário de atividade está aberto, **When** o usuário tenta confirmar sem conteúdo, **Then** o sistema bloqueia com mensagem de validação
3. **Given** o usuário registra uma atividade, **Then** a lista de atividades atualiza imediatamente sem recarregar a página
4. **Given** o formulário está aberto, **When** o usuário seleciona tipo "Reunião" e preenche o conteúdo, **Then** a atividade é registrada com o tipo correto

---

## Edge Cases

- O que acontece se não há stages cadastrados ao tentar criar um deal? → Exibir mensagem "Crie ao menos um stage antes de adicionar deals" com link para `/settings/stages`
- O que acontece se a criação ou edição de deal falhar no servidor? → Exibir erro inline sem fechar o formulário
- O que acontece se o registro de atividade falhar no servidor? → Exibir erro inline sem limpar o formulário
- O que acontece se o usuário tentar registrar atividade sem conteúdo? → Bloqueado por validação antes de enviar ao servidor
- O que acontece se o deal não pertence ao usuário autenticado? → Operação bloqueada pelo servidor com erro de autorização
- O que acontece ao editar um deal: o stage pode ser alterado? → Não — a mudança de stage é exclusiva do drag-and-drop no pipeline

## Requirements

### Functional Requirements

- **FR-001**: O usuário DEVE conseguir criar um novo deal a partir do pipeline, informando nome da empresa (obrigatório) e stage inicial (obrigatório)
- **FR-002**: O formulário de criação de deal DEVE ter modo compacto (apenas empresa + stage) e expandido — o botão "Mais informações" revela os campos opcionais: nome do contato, detalhes do contato, fonte, experimento, notas, próxima ação e indicador de ICP
- **FR-003**: O usuário DEVE conseguir editar as informações de um deal a partir da sua página de detalhe, exceto o stage (que é alterado exclusivamente por drag-and-drop)
- **FR-004**: O sistema DEVE persistir todas as alterações de deal no servidor antes de refletir na UI
- **FR-005**: O usuário DEVE conseguir registrar uma atividade em um deal selecionando o tipo (nota, ligação, reunião, follow-up) e informando o conteúdo
- **FR-006**: A lista de atividades DEVE atualizar imediatamente após o registro de uma nova atividade
- **FR-007**: O pipeline DEVE refletir imediatamente qualquer alteração de nome de deal após edição
- **FR-008**: O sistema DEVE bloquear a criação de deal sem nome de empresa ou sem stage selecionado
- **FR-009**: O sistema DEVE exibir a lista de stages disponíveis para seleção ao criar um deal
- **FR-010**: O sistema DEVE exibir mensagem orientativa quando não há stages cadastrados ao tentar criar um deal

### Key Entities

- **Deal**: Negociação comercial com empresa, contato, notas e status. Pertence a um usuário. Requer um stage.
- **Activity**: Registro de contato ou ação relacionada a um deal. Tipos: nota, ligação, reunião, follow-up. Pertence ao deal e ao usuário.
- **Stage**: Etapa do pipeline. Necessária para criar e visualizar deals.

## Business Rules

- **BR-001**: Toda criação e edição de deal DEVE ser confirmada pelo servidor antes de refletir na UI
- **BR-002**: Toda atividade registrada DEVE ser persistida no servidor — nenhum estado local sem confirmação
- **BR-003**: Apenas o dono do deal DEVE conseguir editá-lo ou registrar atividades nele
- **BR-004**: O nome da empresa é obrigatório para criar e para salvar edições de um deal
- **BR-005**: O stage é obrigatório ao criar um deal — não é possível criar um deal sem stage
- **BR-006**: O tipo da atividade é obrigatório e deve ser um dos quatro tipos suportados: nota, ligação, reunião, follow-up
- **BR-007**: O conteúdo da atividade é obrigatório — não é possível registrar uma atividade vazia

## Flows

### Primary Flow — Criar deal

1. Usuário acessa o pipeline (`/pipeline`)
2. Clica em "Novo deal"
3. Formulário modal abre em modo compacto: apenas empresa (Input) + stage (Select)
4. Opcionalmente, clica em "Mais informações" para expandir e preencher campos adicionais
5. Confirma — servidor persiste o deal
6. Modal fecha, deal aparece na coluna do stage selecionado imediatamente

### Primary Flow — Editar deal

1. Usuário acessa a página de detalhe de um deal
2. Clica em "Editar"
3. Formulário modal abre com todos os campos preenchidos com os valores atuais
4. Usuário altera o que desejar
5. Confirma — servidor persiste as alterações
6. Modal fecha, página de detalhe e pipeline atualizam com os novos dados

### Primary Flow — Registrar atividade

1. Usuário está na página de detalhe de um deal
2. O formulário inline está sempre visível no topo da lista de atividades — sem precisar abrir um modal
3. Seleciona o tipo no select e preenche o conteúdo na textarea
4. Clica em "Registrar" — servidor persiste a atividade
5. Formulário é limpo, atividade aparece no topo da lista imediatamente

### Failure Flow — Criar deal sem stages

1. Usuário clica em "Novo deal"
2. Sistema verifica que não há stages cadastrados
3. Exibe mensagem: "Crie ao menos um stage antes de adicionar deals" com link para `/settings/stages`
4. Formulário não é exibido

### Failure Flow — Validação de formulário

1. Usuário tenta confirmar formulário com campos obrigatórios vazios
2. Sistema exibe mensagem de validação inline
3. Formulário permanece aberto com dados preenchidos

## Dependencies

- **Technical Dependencies**: shadcn/ui, TanStack Query v5, lucide-react, Clerk v7, Next.js App Router
- **Data Dependencies**: Tabelas `Deal`, `Activity` e `PipelineStage` já existentes; APIs de deals (GET, POST, PUT) e activities (GET, POST) já implementadas; zero migrações necessárias
- **Auth Dependencies**: `requireAuthenticatedUser()` no backend — deals são scoped por `ownerId`

## Skills Used

- `shadcn-ui`: Dialog, Select, Input, Textarea para os formulários
- `frontend-design`: coerência estética com o restante do sistema
- `next-best-practices`: Server Components para rotas, Client Components para formulários
- `tanstack-query-best-practices`: invalidação de queries após mutações
- `clerk`: proteção de dados por usuário (ownerId scoping)
- `web-design-guidelines`: UX de formulários, feedback visual de erro e estados de carregamento

## Success Criteria

### Measurable Outcomes

- **SC-001**: Usuário consegue criar um deal completo pela UI em menos de 60 segundos
- **SC-002**: Usuário consegue registrar uma atividade em menos de 30 segundos
- **SC-003**: Pipeline deixa de depender de chamadas diretas à API para ter dados
- **SC-004**: Ciclo completo de uso (criar deal → mover entre stages → registrar atividade) é realizável 100% pela interface

## Validation Criteria

- **VC-001**: Criar deal pela UI → aparece no pipeline board no stage correto
- **VC-002**: Editar nome do deal → pipeline e página de detalhe refletem o novo nome
- **VC-003**: Registrar atividade → aparece na lista de atividades do deal imediatamente
- **VC-004**: Tentar criar deal sem empresa ou sem stage → bloqueado com mensagem clara
- **VC-005**: Tentar criar deal sem stages cadastrados → mensagem orientativa com link para `/settings/stages`
- **VC-006**: Tentar registrar atividade sem conteúdo → bloqueado por validação
- **VC-007**: Editar deal de outro usuário → bloqueado pelo servidor (não deve aparecer na interface, mas a API rejeita)

## Assumptions

- O formulário de criação de deal abre como Dialog modal no pipeline — modo compacto com toggle "Mais informações" para campos opcionais
- O formulário de edição de deal abre como Dialog modal na página de detalhe
- O formulário de nova atividade é inline, fixo no topo da lista de atividades — sem Dialog
- A mudança de stage é feita exclusivamente por drag-and-drop — o formulário de edição não expõe o campo de stage
- Não há paginação de atividades nesta feature — todas exibidas em lista (volume esperado baixo por deal)
- Nenhuma migração de banco de dados é necessária — todas as tabelas e APIs já existem
