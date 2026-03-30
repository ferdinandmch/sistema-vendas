# Data Model: Deal Management UI Loop

**Branch**: `012-deal-ui-loop` | **Date**: 2026-03-30

## Frontend Types (já existentes em `lib/pipeline/api.ts`)

```ts
// Já existe — nenhuma alteração necessária
export type Stage = {
  id: string;
  name: string;
  position: number;
  isFinal: boolean;
  finalType: "won" | "lost" | null;
  createdAt: string;
};

export type Deal = {
  id: string;
  companyName: string;
  contactName: string | null;
  contactDetails?: string | null;
  source?: string | null;
  experiment?: string | null;
  notes?: string | null;
  icp?: boolean;
  stageId: string;
  status: DealStatus;
  nextAction: string | null;
  ownerId: string;
  createdAt: string;
  stageUpdatedAt: string;
  lastTouchAt?: string | null;
  stage: { id: string; name: string; position: number };
};

export type ActivityType = "note" | "call" | "meeting" | "followup";

export type Activity = {
  id: string;
  dealId: string;
  type: ActivityType;
  content: string | null;
  createdAt: string;
};
```

## Novos inputs de API (a adicionar em `lib/pipeline/api.ts`)

```ts
// Input para criar deal
type CreateDealPayload = {
  companyName: string;             // obrigatório
  stageId: string;                 // obrigatório
  contactName?: string;
  contactDetails?: string;
  source?: string;
  experiment?: string;
  notes?: string;
  icp?: boolean;
  nextAction?: string;
};

// Input para editar deal (todos opcionais)
type UpdateDealPayload = {
  companyName?: string;
  contactName?: string | null;
  contactDetails?: string | null;
  source?: string | null;
  experiment?: string | null;
  notes?: string | null;
  icp?: boolean;
  nextAction?: string | null;
};

// Input para registrar atividade
type CreateActivityPayload = {
  type: "note" | "call" | "meeting" | "followup";  // obrigatório
  content: string;                                   // obrigatório
};
```

## Query Keys (já existentes em `lib/query-keys.ts`)

```ts
// Sem alterações necessárias — todas as keys já existem:
dealKeys.list()           // pipeline board
dealKeys.detail(id)       // página de detalhe
activityKeys.list(dealId) // lista de atividades
stageKeys.list()          // stages para o select de criar deal
```

## Labels de UI por ActivityType

```ts
const ACTIVITY_LABELS: Record<ActivityType, string> = {
  note: "Nota",
  call: "Ligação",
  meeting: "Reunião",
  followup: "Follow-up",
};
```

## Estado do formulário de criar deal

```ts
// Modo compacto (padrão)
type DealFormCompact = {
  companyName: string;  // obrigatório
  stageId: string;      // obrigatório
};

// Modo expandido (toggle "Mais informações")
type DealFormExpanded = DealFormCompact & {
  contactName: string;
  contactDetails: string;
  source: string;
  experiment: string;
  notes: string;
  icp: boolean;
  nextAction: string;
};
```
