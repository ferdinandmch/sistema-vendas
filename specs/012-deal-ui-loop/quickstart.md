# Quickstart Validation: Deal Management UI Loop

**Branch**: `012-deal-ui-loop` | **Date**: 2026-03-30

Execute os passos abaixo após `/speckit-implement` para validar a feature completa.

---

## Pré-requisitos

1. `pnpm dev` rodando em `localhost:3000`
2. Usuário autenticado (login via Clerk)
3. Ao menos 1 stage criado em `/settings/stages` (ex: "Prospecção")

---

## Passo 1 — Criar deal a partir do pipeline (US1 — Modo compacto)

1. Acessar `/pipeline`
2. Verificar que o botão "Novo deal" aparece no header do board
3. Clicar em "Novo deal"
4. Verificar que o Dialog abre com apenas dois campos: nome da empresa + select de stage
5. Verificar que o select de stage lista os stages existentes
6. Preencher empresa: "Acme Corp", stage: "Prospecção"
7. Clicar em Salvar
8. **Esperado**: Dialog fecha; card "Acme Corp" aparece na coluna "Prospecção"

---

## Passo 2 — Criar deal com campos opcionais (US1 — Modo expandido)

1. Clicar em "Novo deal"
2. Clicar em "Mais informações"
3. Verificar que os campos opcionais aparecem (contato, fonte, notas, etc.)
4. Preencher empresa: "Beta Ltda", stage: "Prospecção", notas: "Lead quente"
5. Clicar em Salvar
6. **Esperado**: Deal "Beta Ltda" aparece no pipeline; clicar no card e verificar que as notas estão na página de detalhe

---

## Passo 3 — Validação de criação sem campos obrigatórios (US1 — Falha)

1. Clicar em "Novo deal"
2. Deixar empresa em branco, tentar salvar
3. **Esperado**: Mensagem de validação "obrigatório" sem fechar o Dialog
4. Preencher empresa mas não selecionar stage, tentar salvar
5. **Esperado**: Mensagem de validação sem fechar o Dialog

---

## Passo 4 — Estado vazio de stages (US1 — Edge case)

1. Deletar todos os stages em `/settings/stages` (mover deals antes se necessário)
2. Acessar `/pipeline` e clicar em "Novo deal"
3. **Esperado**: Dialog exibe mensagem orientativa com link para `/settings/stages`

---

## Passo 5 — Editar deal (US2)

1. Clicar em um card de deal para acessar `/deals/:id`
2. Verificar que o botão "Editar" está visível
3. Clicar em "Editar"
4. Verificar que o Dialog abre com todos os campos preenchidos com os valores atuais
5. Verificar que o campo de stage NÃO está no formulário
6. Alterar nome da empresa para "Acme Corp (Editado)" e adicionar uma nota
7. Clicar em Salvar
8. **Esperado**: Dialog fecha; página de detalhe mostra o novo nome e nota

---

## Passo 6 — Editar deal reflete no pipeline (US2)

1. Voltar para `/pipeline`
2. **Esperado**: Card do deal exibe o nome atualizado "Acme Corp (Editado)"

---

## Passo 7 — Validação de edição com empresa vazia (US2 — Falha)

1. Acessar a página de detalhe de um deal
2. Clicar em "Editar"
3. Apagar o nome da empresa, tentar salvar
4. **Esperado**: Mensagem de validação sem fechar o Dialog

---

## Passo 8 — Registrar atividade (US3)

1. Acessar a página de detalhe de um deal
2. Verificar que o formulário inline de atividade está visível no topo da lista de atividades
3. Selecionar tipo "Ligação"
4. Preencher: "Falei com o CEO. Demonstrou interesse no Enterprise."
5. Clicar em "Registrar"
6. **Esperado**: Formulário limpa; atividade aparece no topo da lista com tipo "Ligação" e o conteúdo correto

---

## Passo 9 — Registrar atividade atualiza lastTouchAt (US3)

1. Antes de registrar a atividade, anotar o valor de "Último toque" no painel esquerdo
2. Registrar uma atividade
3. **Esperado**: Campo "Último toque" é atualizado para a data/hora atual

---

## Passo 10 — Validação de atividade sem conteúdo (US3 — Falha)

1. No formulário inline de atividade, selecionar um tipo
2. Deixar o conteúdo em branco, clicar em "Registrar"
3. **Esperado**: Validação bloqueia o envio com mensagem inline

---

## Checklist final

- [ ] US1: Deal criado pela UI aparece no pipeline
- [ ] US1: Toggle "Mais informações" exibe campos opcionais
- [ ] US1: Validação bloqueia campos obrigatórios vazios
- [ ] US1: Estado vazio de stages exibe mensagem orientativa
- [ ] US2: Edição altera nome e campos no detalhe e no pipeline
- [ ] US2: Stage não está disponível no formulário de edição
- [ ] US3: Atividade inline registrada aparece imediatamente
- [ ] US3: `lastTouchAt` atualizado após atividade
- [ ] US3: Conteúdo vazio bloqueado por validação
