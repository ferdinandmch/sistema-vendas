import type { Stage } from "@/lib/pipeline/api";

export async function fetchSettingsStages(): Promise<Stage[]> {
  const res = await fetch("/api/stages");
  if (!res.ok) throw new Error("Failed to fetch stages");
  const data = (await res.json()) as { stages: Stage[] };
  return data.stages;
}

export async function createSettingsStage(input: {
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
  if (!res.ok) {
    const data = (await res.json()) as { error: { code: string; message: string } };
    throw new Error(data.error.message);
  }
  const data = (await res.json()) as { stage: Stage };
  return data.stage;
}

export async function updateSettingsStage(
  id: string,
  input: {
    name?: string;
    isFinal?: boolean;
    finalType?: "won" | "lost" | null;
  },
): Promise<Stage> {
  const res = await fetch(`/api/stages/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const data = (await res.json()) as { error: { code: string; message: string } };
    throw new Error(data.error.message);
  }
  const data = (await res.json()) as { stage: Stage };
  return data.stage;
}

export async function deleteSettingsStage(id: string): Promise<void> {
  const res = await fetch(`/api/stages/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const data = (await res.json()) as { error: { code: string; message: string } };
    throw new Error(data.error.message);
  }
}

export async function reorderSettingsStages(
  stages: Array<{ id: string; position: number }>,
): Promise<Stage[]> {
  const res = await fetch("/api/stages/reorder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stages }),
  });
  if (!res.ok) {
    const data = (await res.json()) as { error: { code: string; message: string } };
    throw new Error(data.error.message);
  }
  const data = (await res.json()) as { stages: Stage[] };
  return data.stages;
}
