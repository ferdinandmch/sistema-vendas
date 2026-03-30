# Research: Deal Management UI Loop

**Branch**: `012-deal-ui-loop` | **Date**: 2026-03-30

## Decision 1 — Zero backend new code

**Decision**: Não há nenhum código de backend a escrever. Todas as APIs, services, validações e schemas já existem e estão funcionais.

**Rationale**: `POST /api/deals`, `PUT /api/deals/:id`, `POST /api/deals/:id/activities` com seus respectivos services (`createDeal`, `updateDeal`, `createActivity`) foram implementados nas features 003 e 006. Os schemas Zod (`createDealSchema`, `updateDealSchema`, `createActivitySchema`) estão em `lib/validation/`.

**Alternatives considered**: Adicionar campos novos ao formulário de edição — rejeitado porque o schema de update já cobre todos os campos relevantes.

---

## Decision 2 — API functions em `lib/pipeline/api.ts`

**Decision**: Adicionar `createDeal`, `updateDeal`, `createActivity` ao arquivo existente `lib/pipeline/api.ts`, junto com as funções de fetch já presentes.

**Rationale**: O arquivo já contém `moveDeal` e os tipos `Deal`, `Activity`. Centralizar todas as funções de API de deals em um único arquivo evita fragmentação. Seguir o padrão existente: fetch → check ok → parse envelope → return typed data; erro → parse body → throw Error com message.

**Alternatives considered**: Criar `lib/deals/api.ts` separado — rejeitado por criar fragmentação desnecessária para uma codebase pequena.

---

## Decision 3 — `DealFormDialog` no PipelineBoard

**Decision**: O botão "Novo deal" fica no header do `PipelineBoard` (antes das colunas). Abre um `DealFormDialog` — Dialog com formulário compacto (empresa + stage Select) e toggle "Mais informações" para campos opcionais.

**Rationale**: O pipeline é o ponto natural de entrada para criação de deals — é onde o usuário visualiza e gerencia o funil. Adicionar o botão no board (Client Component) evita prop drilling do Server Component.

**Stage Select**: O `DealFormDialog` usa `useQuery(stageKeys.list())` internamente — o cache já está populado pelo `PipelineBoard`. Zero requests adicionais.

**Empty stages state**: Se `stages.length === 0` após o carregamento, o Dialog exibe mensagem com link para `/settings/stages` em vez do formulário.

**Alternatives considered**: Botão no header da página (layout.tsx) — rejeitado por ser genérico demais; o botão precisa invalidar `dealKeys.list()` e está no contexto do pipeline.

---

## Decision 4 — `DealEditDialog` na `DealPageClient`

**Decision**: Botão "Editar" no painel esquerdo da página de detalhe. Abre `DealEditDialog` — Dialog com TODOS os campos preenchidos com os valores atuais (empresa, contato, detalhes, fonte, experimento, notas, ICP, próxima ação). Stage NÃO é editável.

**Rationale**: Na edição, o usuário já conhece o deal e precisa alterar campos específicos — não há vantagem em esconder os campos opcionais. Exibir tudo preenchido reduz o risco de perda de dados por omissão.

**Query invalidation after edit**: Invalidar `dealKeys.detail(id)` para atualizar a página de detalhe + `dealKeys.list()` para atualizar o card no pipeline.

**Alternatives considered**: Edição inline (campos editáveis diretamente na página) — rejeitado por complexidade de UX e inconsistência com o padrão Dialog estabelecido na feature 011.

---

## Decision 5 — `ActivityForm` inline em `DealActivitiesList`

**Decision**: Formulário inline fixo no topo do painel de atividades. Select de tipo (nota/ligação/reunião/follow-up) + Textarea para conteúdo + botão "Registrar". Após submit bem-sucedido: limpar formulário + invalidar `activityKeys.list(dealId)` + invalidar `dealKeys.detail(id)` (para refletir `lastTouchAt` atualizado).

**Rationale**: UX de captura rápida — sem precisar abrir modal. O usuário termina a ligação e registra imediatamente sem interromper o fluxo. Padrão validado por Linear (comentários), Notion (notas rápidas).

**Textarea**: Usar `Textarea` do shadcn (a instalar) para conteúdo — permite notas longas sobre reuniões e ligações.

**Alternatives considered**: Dialog modal — rejeitado pelo usuário na etapa de clarificações.

---

## Decision 6 — Shadcn `Textarea` a instalar

**Decision**: Instalar `Textarea` via `pnpm dlx shadcn@latest add textarea`.

**Rationale**: Único componente shadcn não instalado que esta feature precisa. Todos os outros (Dialog, Input, Select, Label, Switch, Button, Badge, Skeleton) já estão disponíveis.

---

## Decision 7 — Invalidação de queries

| Operação | Queries a invalidar |
|----------|---------------------|
| Criar deal | `dealKeys.list()` |
| Editar deal | `dealKeys.detail(id)` + `dealKeys.list()` |
| Registrar atividade | `activityKeys.list(dealId)` + `dealKeys.detail(id)` |

**Rationale**: `dealKeys.list()` mantém o pipeline board sincronizado. `dealKeys.detail(id)` mantém a página de detalhe sincronizada. `activityKeys.list(dealId)` atualiza a lista de atividades. Sem optimistic update para criação de deal e edição (operações pontuais, não frequentes) — apenas invalidação pós-confirmação do servidor. Sem optimistic update para atividade (formulário limpa após confirmação, não precisa de rollback visual).

---

## Decision 8 — Nenhuma migração de banco

**Decision**: Zero migrações. Todas as tabelas (`Deal`, `Activity`, `PipelineStage`) e colunas necessárias já existem no schema Prisma.

**Rationale**: As features 003 e 006 já criaram e popularam essas tabelas. Esta feature é 100% frontend.
