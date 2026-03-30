# Data Model: Stage Management CRUD + Ordering

**Feature**: 011-stage-management
**Date**: 2026-03-30

---

## Tipos Existentes (reutilizados)

### `Stage` — já em `lib/pipeline/api.ts`

```ts
export type Stage = {
  id: string;
  name: string;
  position: number;
  isFinal: boolean;
  finalType: "won" | "lost" | null;
  createdAt: string;
};
```

Nenhuma mudança necessária no tipo — o schema já tem todos os campos.

---

## Query Keys (a adicionar em `lib/query-keys.ts`)

```ts
// Novo — separado de stageKeys para evitar invalidação cruzada acidental
export const settingsStageKeys = {
  all: ["settings", "stages"] as const,
  list: () => [...settingsStageKeys.all, "list"] as const,
};
```

**Nota**: `stageKeys.list()` continua sendo usado pelo pipeline board. `settingsStageKeys.list()` é usado pela página de settings. Após mutações, **ambos** devem ser invalidados.

---

## Fetch Functions (a adicionar em `lib/settings/api.ts`)

```ts
// Reutiliza o mesmo endpoint do pipeline board
export async function fetchSettingsStages(): Promise<Stage[]> {
  const res = await fetch("/api/stages");
  if (!res.ok) throw new Error("Failed to fetch stages");
  const data = (await res.json()) as { stages: Stage[] };
  return data.stages;
}

export async function createStage(input: {
  name: string;
  position: number;
  isFinal: boolean;
  finalType: "won" | "lost" | null;
}): Promise<Stage> {
  const res = await fetch("/api/stages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to create stage");
  const data = (await res.json()) as { stage: Stage };
  return data.stage;
}

export async function updateStage(
  id: string,
  input: {
    name?: string;
    isFinal?: boolean;
    finalType?: "won" | "lost" | null;
  }
): Promise<Stage> {
  const res = await fetch(`/api/stages/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to update stage");
  const data = (await res.json()) as { stage: Stage };
  return data.stage;
}

export async function deleteStage(id: string): Promise<void> {
  const res = await fetch(`/api/stages/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const data = (await res.json()) as { error: { code: string; message: string } };
    throw new Error(data.error.message);
  }
}

export async function reorderStages(
  stages: Array<{ id: string; position: number }>
): Promise<Stage[]> {
  const res = await fetch("/api/stages/reorder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stages }),
  });
  if (!res.ok) throw new Error("Failed to reorder stages");
  const data = (await res.json()) as { stages: Stage[] };
  return data.stages;
}
```

---

## Novos Error Codes (a adicionar em `lib/validation/api-error.ts`)

```ts
// Já existem: duplicateStageNameError, duplicateStagePositionError, stageNotFoundError
// Novos:
export function stageHasDealsError(count: number) { ... }    // code: "STAGE_HAS_DEALS"
export function duplicateFinalTypeError(type: string) { ... } // code: "DUPLICATE_FINAL_TYPE"
```

---

## Novo Schema Zod (a adicionar em `lib/validation/stages.ts`)

```ts
export const reorderStagesSchema = z.object({
  stages: z
    .array(z.object({ id: z.string().cuid(), position: z.number().int().positive() }))
    .min(1),
});

export type ReorderStagesInput = z.infer<typeof reorderStagesSchema>;
```
