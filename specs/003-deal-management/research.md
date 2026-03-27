# Research: 003-deal-management

**Branch**: `003-deal-management` | **Date**: 2026-03-26

## R1: owner_id Resolution Pattern

**Decision**: Usar `requireAuthenticatedUser()` que retorna
`AuthenticatedSessionContext` com `user: User`. O `user.id` (cuid) e o
`owner_id` para todas as operacoes de deals.

**Rationale**: Padrao ja implementado em 001-clerk-auth. O user.id e o
identificador interno do sistema (nao o clerkUserId). Todas as entidades de
dominio referenciam users.id como owner.

**Alternatives considered**:
- Usar clerkUserId diretamente: rejeitado — violaria a separacao entre
  identidade externa e interna do sistema.

## R2: Prisma Include para Stage em Respostas

**Decision**: Usar `include: { stage: { select: { id: true, name: true, position: true } } }`
nas queries de listagem e detalhe de deals.

**Rationale**: FR-013 da spec exige dados basicos do stage embutidos na resposta.
Prisma include resolve isso numa unica query SQL (JOIN) sem N+1 problem.

**Alternatives considered**:
- Retornar apenas stage_id e resolver no frontend: rejeitado — exige chamada
  extra, viola clarificacao da spec.
- Include todos os campos do stage: rejeitado — desnecessario, stage tem
  campos internos (isFinal, finalType) que nao sao relevantes para listagem
  de deals.

## R3: Ownership Enforcement Pattern

**Decision**: Filtrar por `ownerId` em TODAS as queries de deals. Para detalhe
e edicao, usar `findFirst({ where: { id, ownerId } })` em vez de buscar por id
e depois validar ownership separadamente.

**Rationale**: Padrao mais seguro — se o deal nao pertence ao usuario, retorna
DEAL_NOT_FOUND (404) sem revelar existencia. Segue padrao de seguranca da spec
(edge case: ownership incorreto = not found).

**Alternatives considered**:
- Buscar por id e depois verificar ownership com 403: rejeitado — revela
  existencia de deals de outros usuarios.

## R4: Stage Validation na Criacao

**Decision**: Verificar existencia do stage_id via `prisma.pipelineStage.findUnique()`
antes de criar o deal. Se inexistente, lancar `stageNotFoundError()` (ja existente
em api-error.ts).

**Rationale**: Reutiliza error code existente (STAGE_NOT_FOUND). A FK no banco
tambem protege, mas a validacao explicita no service permite mensagem de erro
clara antes de tentar o insert.

**Alternatives considered**:
- Confiar apenas na FK constraint do banco: rejeitado — mensagem de erro
  Prisma P2003 nao e user-friendly.

## R5: DealStatus como Enum

**Decision**: Criar enum `DealStatus` no Prisma com valor `active`. Preparado
para extensao futura (archived, won, lost) sem migracao breaking.

**Rationale**: Usar enum garante type safety no TypeScript e constraint no banco.
Mesmo com apenas um valor agora, e o padrao correto para campos de lifecycle.

**Alternatives considered**:
- String livre: rejeitado — permite valores invalidos, viola Principio V.
- Boolean isActive: rejeitado — nao suporta multiplos status futuros.

## R6: Campos Editaveis vs Protegidos

**Decision**: O `updateDealSchema` (Zod) aceita APENAS campos editaveis:
company_name, contact_name, contact_details, source, experiment, notes, icp,
next_action. Campos protegidos (stage_id, owner_id, status, stage_updated_at,
last_touch_at, created_at, updated_at) nao existem no schema.

**Rationale**: Zod strip (padrao) ignora campos extras silenciosamente. O schema
define a whitelist de campos permitidos. Nao ha necessidade de rejeitar
explicitamente campos protegidos — eles simplesmente nao sao aceitos.

**Alternatives considered**:
- Validar e rejeitar campos protegidos explicitamente: rejeitado — adiciona
  complexidade sem beneficio de seguranca (campos ja sao ignorados).

## R7: Indice Composto owner_id

**Decision**: Criar indice no campo `owner_id` da tabela deals para otimizar
queries de listagem filtradas por owner.

**Rationale**: Toda listagem de deals filtra por owner_id. Sem indice, a query
faz full table scan conforme o volume cresce. postgresql-optimization best
practice.

**Alternatives considered**:
- Indice composto (owner_id, stage_id): premature — stage_id filter nao e
  usado na listagem nesta feature. Pode ser adicionado quando necessario.
