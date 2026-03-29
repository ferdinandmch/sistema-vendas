export type Stage = {
  id: string;
  name: string;
  position: number;
  isFinal: boolean;
  finalType: "won" | "lost" | null;
  createdAt: string;
};

export type DealStatus = "active" | "won" | "lost";

export type Deal = {
  id: string;
  companyName: string;
  contactName: string | null;
  stageId: string;
  status: DealStatus;
  nextAction: string | null;
  ownerId: string;
  createdAt: string;
  stageUpdatedAt: string;
  stage: {
    id: string;
    name: string;
    position: number;
  };
};

export async function fetchStages(): Promise<Stage[]> {
  const res = await fetch("/api/stages");
  if (!res.ok) throw new Error("Failed to fetch stages");
  const data = (await res.json()) as { stages: Stage[] };
  return data.stages;
}

export async function fetchDeals(): Promise<Deal[]> {
  const res = await fetch("/api/deals");
  if (!res.ok) throw new Error("Failed to fetch deals");
  const data = (await res.json()) as { deals: Deal[] };
  return data.deals;
}
