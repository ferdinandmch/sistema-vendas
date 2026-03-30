# Quickstart: Deal Page

**Feature**: 010-deal-page
**Date**: 2026-03-30

---

## Prerequisites

- Features 008 + 009 implementadas e rodando
- Pelo menos 1 stage e 1 deal ativo criados via API
- Para validação completa: deal com activities e com histórico de stage (mover entre stages via DnD ou API)

---

## Validation Steps

### Step 1 — Criar dados de teste via API

```bash
# Criar 2 stages
POST /api/stages { "name": "Prospecção", "position": 1 }
POST /api/stages { "name": "Qualificação", "position": 2 }

# Criar 1 deal com campos opcionais preenchidos
POST /api/deals {
  "companyName": "Empresa Teste",
  "contactName": "João Silva",
  "notes": "Cliente interessado",
  "nextAction": "Enviar proposta",
  "stageId": "<id-do-stage-1>"
}

# Criar activities para o deal
POST /api/deals/:id/activities { "type": "call", "content": "Ligação inicial" }
POST /api/deals/:id/activities { "type": "note", "content": "Cliente confirma interesse" }

# Mover deal para o segundo stage (via API ou DnD)
POST /api/deals/:id/move { "toStageId": "<id-do-stage-2>" }
```

✅ Verify: Deal, activities e histórico existem no banco

---

### Step 2 — Navegar do board para a Deal Page

1. Acessar `/pipeline`
2. Verificar que o deal card exibe um cursor de pointer ao passar o mouse (exceto no grip handle)
3. Clicar no card (fora do grip handle)

✅ Verify:
- URL muda para `/deals/:id`
- Página exibe o nome da empresa no topo
- Sem reload de página completa

---

### Step 3 — Verificar layout dois painéis

1. Acessar `/deals/:id` de um deal com dados completos

✅ Verify:
- Painel esquerdo visível com dados do deal
- Painel direito visível com duas seções (activities acima, histórico abaixo)
- Em telas largas, os dois painéis aparecem lado a lado

---

### Step 4 — Verificar dados principais do deal (painel esquerdo)

✅ Verify:
- Nome da empresa exibido em destaque
- Nome do contato exibido (se preenchido)
- Status exibido como badge (active/won/lost com cores distintas)
- Stage atual exibido
- Próxima ação exibida (se preenchida)
- Notas exibidas (se preenchidas)
- Data de criação exibida

---

### Step 5 — Verificar activities (painel direito, topo)

✅ Verify:
- Lista de activities exibida em ordem decrescente (mais recente primeiro)
- Cada activity mostra: tipo (nota/ligação/reunião/follow-up), conteúdo e data
- Seção tem título claro distinto do histórico

---

### Step 6 — Verificar histórico de stage (painel direito, baixo)

✅ Verify:
- Lista de movimentações exibida em ordem decrescente (mais recente primeiro)
- Cada entrada mostra: stage de origem → stage de destino + data
- Seção tem título claro distinto das activities

---

### Step 7 — Deal sem activities e sem histórico

1. Criar um deal novo sem mover de stage e sem activities

✅ Verify:
- Seção de activities exibe mensagem de estado vazio
- Seção de histórico exibe mensagem de estado vazio
- Página permanece funcional e sem erros

---

### Step 8 — Deal com campos opcionais vazios

1. Criar um deal com apenas `companyName` e `stageId`
2. Acessar sua Deal Page

✅ Verify:
- Página não quebra por campos nulos
- Campos ausentes não exibem linhas vazias ou "null"
- Layout permanece organizado

---

### Step 9 — Erro de ownership

1. Tentar acessar `/deals/:id` de um deal criado por outro usuário (ou ID inválido)

✅ Verify:
- Página exibe estado de erro "deal não encontrado"
- Há link ou botão para retornar ao board

---

### Step 10 — Verificar acesso direto à URL

1. Copiar a URL `/deals/:id` de um deal válido
2. Abrir em nova aba sem passar pelo board

✅ Verify:
- Página carrega corretamente com todos os dados
- Autenticação é verificada (Clerk redireciona para login se não autenticado)
