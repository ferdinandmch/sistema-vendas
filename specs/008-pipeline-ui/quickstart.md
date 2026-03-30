# Quickstart: Pipeline UI

**Feature**: 008-pipeline-ui | **Date**: 2026-03-29

## Pré-requisitos

- Features 001–007 implementadas e em produção
- Branch `008-pipeline-ui` ativa
- `.env.local` configurado com `DATABASE_URL` e variáveis Clerk

---

## Passos de setup (executar uma vez)

### 1. Instalar dependências de UI

```bash
pnpm add tailwindcss postcss autoprefixer
pnpm add @tanstack/react-query
```

### 2. Configurar Tailwind CSS

```bash
pnpm dlx tailwindcss init -p
```

Editar `tailwind.config.ts`:
```typescript
import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './providers/**/*.{ts,tsx}',
  ],
  theme: { extend: {} },
  plugins: [],
} satisfies Config
```

### 3. Inicializar shadcn/ui

```bash
pnpm dlx shadcn@latest init
```

Responder ao wizard:
- Style: Default
- Base color: Slate
- CSS variables: Yes

### 4. Instalar componentes shadcn necessários

```bash
pnpm dlx shadcn@latest add card
pnpm dlx shadcn@latest add badge
pnpm dlx shadcn@latest add skeleton
```

---

## Validação da feature (10 passos)

### Passo 1 — Setup de UI instalado

```bash
pnpm run build
```
Esperado: build sem erros com Tailwind CSS configurado.

### Passo 2 — QueryProvider ativo

Acessar qualquer rota em `(private)`. Verificar no console que não há erro de "QueryClientProvider not found".

### Passo 3 — Página do pipeline autenticada

Acessar `/pipeline` sem sessão Clerk ativa. Esperado: redirecionamento para login (sem renderização do board).

### Passo 4 — Board carrega stages como colunas

Acessar `/pipeline` autenticado com stages cadastrados. Verificar que N colunas aparecem correspondendo aos N stages.

### Passo 5 — Ordem das colunas respeita position

Reordenar stages via `PUT /api/stages/:id` (alterando `position`). Recarregar `/pipeline`. Verificar que a ordem das colunas reflete a nova ordem de `position`.

### Passo 6 — Deals aparecem na coluna correta

Verificar que cada deal aparece na coluna do seu `stage_id`. Mover um deal via `POST /api/deals/:id/move`. Recarregar a página. Verificar que o deal aparece na nova coluna.

### Passo 7 — Card exibe os 4 campos obrigatórios

Inspecionar visualmente um DealCard. Deve exibir: `name`, `company_name`, `status` (como Badge), `value`.

### Passo 8 — Estado vazio funcional

Acessar `/pipeline` com stages mas sem deals. Verificar que colunas são renderizadas com indicação de estado vazio (sem erro, sem quebra de layout).

### Passo 9 — Estado de loading visível

Simular latência (Chrome DevTools → Network → Slow 3G). Acessar `/pipeline`. Verificar que BoardSkeleton aparece antes do board real.

### Passo 10 — Board com 0 stages

Acessar `/pipeline` sem stages cadastrados. Verificar que o board exibe mensagem orientativa (não tela em branco e não erro de runtime).

---

## Comandos úteis

```bash
# Rodar testes
pnpm test

# Dev server
pnpm dev

# Verificar lint
pnpm run lint

# Seed de dados de teste
pnpm dlx prisma db seed
```
