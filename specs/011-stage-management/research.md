# Research: Stage Management CRUD + Ordering

**Feature**: 011-stage-management
**Date**: 2026-03-30

---

## Decision 1: Backend-first — ajustar gaps antes do frontend

**Decision**: Corrigir os 3 gaps do backend existente antes de construir qualquer UI.
**Rationale**: O backend já tem GET/POST/PUT/DELETE funcionais. Apenas faltam: (1) deal count check no delete, (2) won/lost uniqueness no create/update, (3) endpoint de reorder. Entregar UI sobre backend incompleto causaria bugs silenciosos.
**Alternatives considered**: Ignorar gaps e tratar no frontend — rejeitado (viola constituição: backend é fonte única de verdade).

---

## Decision 2: `$transaction` para reorder e delete+renumber

**Decision**: Usar `prisma.$transaction` tanto no reorder (atualiza N positions) quanto no delete+renumber.
**Rationale**: `position` tem constraint `@unique`. Sem transação, updates sequenciais causariam conflito de unique temporário. A transação garante atomicidade — ou tudo atualiza ou nada.
**Alternatives considered**: Update sequencial com posições temporárias (+1000) — rejeitado (frágil e desnecessário com transação).

---

## Decision 3: `POST /api/stages/reorder` como endpoint dedicado

**Decision**: Criar endpoint dedicado `POST /api/stages/reorder` recebendo array `{ id, position }[]`.
**Rationale**: N chamadas `PUT /api/stages/:id` separadas para reorder seriam N round trips e não seriam atômicas. Um endpoint dedicado processa tudo em uma transação.
**Alternatives considered**: PATCH com array em `/api/stages` — possível mas semanticamente menos claro que um endpoint dedicado.

---

## Decision 4: Direção estética — refined administrative minimalism

**Decision**: Settings page com estética minimalista administrativa — sem cards coloridos, layout de lista com linhas definidas, hierarquia tipográfica clara.
**Rationale**: O usuário está configurando o sistema, não navegando conteúdo ou explorando dados. A UI deve ser eficiente e direta. Contraste com o pipeline board (que é mais visual/kanban).
**Alternatives considered**: Mesmo estilo card do pipeline — rejeitado (settings é operação técnica, não visualização comercial).

---

## Decision 5: Dialog modal compartilhado para criar e editar

**Decision**: Um único `StageFormDialog` usado tanto para criar quanto para editar, com prop `stage?: Stage` para diferenciar o modo.
**Rationale**: Formulário idêntico nos dois casos. Componente único evita duplicação de lógica e mantém UX consistente.
**Alternatives considered**: Dois componentes separados — rejeitado (duplicação desnecessária).

---

## Decision 6: Invalidar dois query keys após mutação

**Decision**: Após qualquer mutação de stage, invalidar `settingsStageKeys.list()` E `stageKeys.list()`.
**Rationale**: `stageKeys.list()` é usado pelo pipeline board. Se o usuário cria um stage em `/settings/stages` e volta para `/pipeline`, o board deve refletir o novo stage sem reload manual.
**Alternatives considered**: Invalidar apenas `settingsStageKeys` — rejeitado (pipeline ficaria desatualizado).

---

## Decision 7: Reorder com optimistic update + rollback

**Decision**: Aplicar o mesmo padrão canônico do DnD do pipeline board (feature 009): optimistic update no `onMutate`, rollback no `onError`, invalidate no `onSettled`.
**Rationale**: Consistência com o padrão já estabelecido no projeto. Feedback visual imediato sem esperar o servidor.
**Alternatives considered**: Sem optimistic update (aguardar servidor) — rejeitado (UX ruim para drag-and-drop).

---

## Decision 8: Navegação no layout privado — link simples no header

**Decision**: Adicionar link "Stages" no header do `app/(private)/layout.tsx` ao lado do `UserButton`.
**Rationale**: O layout privado já tem header com UserButton. Adicionar um link de navegação simples é o menor change possível para satisfazer FR-010 sem redesenhar o layout.
**Alternatives considered**: Sidebar de navegação — fora de escopo desta feature; pode ser feature futura.
