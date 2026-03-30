# Quickstart: Stage Management

**Feature**: 011-stage-management
**Date**: 2026-03-30

---

## Prerequisites

- Sistema rodando em desenvolvimento (`pnpm dev`)
- Usuário autenticado via Clerk
- Banco limpo ou com stages existentes do seed

---

## Validation Steps

### Step 1 — Acessar a página de settings

1. Fazer login no sistema
2. Clicar no link "Stages" no header da área privada

✅ Verify: URL muda para `/settings/stages`; lista de stages exibida (ou estado vazio)

---

### Step 2 — Criar um stage simples

1. Clicar em "Novo stage"
2. Preencher nome: "Prospecção"
3. Clicar em "Salvar"

✅ Verify: Stage aparece na lista; acessar `/pipeline` e confirmar nova coluna "Prospecção"

---

### Step 3 — Criar stage final (won)

1. Clicar em "Novo stage"
2. Nome: "Ganho"
3. Ativar switch "Stage final"
4. Selecionar tipo: "won"
5. Salvar

✅ Verify: Badge "Final: won" aparece na linha do stage

---

### Step 4 — Bloquear segundo stage won

1. Clicar em "Novo stage"
2. Nome: "Fechado"
3. Ativar "Stage final" → tipo "won"
4. Salvar

✅ Verify: Erro exibido — não é possível criar segundo stage `won`

---

### Step 5 — Editar stage

1. Clicar em "Editar" em "Prospecção"
2. Alterar nome para "Qualificação"
3. Salvar

✅ Verify: Lista reflete "Qualificação"; pipeline board exibe novo nome

---

### Step 6 — Bloquear nome duplicado

1. Tentar criar stage com nome "Qualificação"

✅ Verify: Erro "Já existe um stage com esse nome"

---

### Step 7 — Reordenar stages

1. Com 3+ stages, arrastar o último para a primeira posição

✅ Verify: Lista reordena visualmente; recarregar página e confirmar que a ordem persiste; `/pipeline` exibe colunas na nova ordem

---

### Step 8 — Excluir stage sem deals

1. Criar stage "Temporário" (sem deals)
2. Clicar em excluir

✅ Verify: Stage removido; posições renumeradas sequencialmente

---

### Step 9 — Bloquear exclusão de stage com deals

1. Criar stage "Com Deals"
2. Criar um deal nesse stage via API: `POST /api/deals { "companyName": "X", "stageId": "<id>" }`
3. Tentar excluir "Com Deals"

✅ Verify: Erro inline "Este stage tem 1 deal ativo. Mova-o antes de excluir."

---

### Step 10 — Verificar acesso sem autenticação

1. Fazer logout
2. Acessar `/settings/stages` diretamente

✅ Verify: Clerk redireciona para `/sign-in`
