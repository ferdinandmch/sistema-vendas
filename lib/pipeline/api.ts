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
  updatedAt?: string;
  stageUpdatedAt: string;
  lastTouchAt?: string | null;
  stage: {
    id: string;
    name: string;
    position: number;
  };
};

export type ActivityType = "note" | "call" | "meeting" | "followup";

export type Activity = {
  id: string;
  dealId: string;
  type: ActivityType;
  content: string | null;
  createdAt: string;
};

export type StageHistoryEntry = {
  id: string;
  dealId: string;
  fromStageId: string;
  toStageId: string;
  changedAt: string;
  fromStage: {
    id: string;
    name: string;
  };
  toStage: {
    id: string;
    name: string;
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

export async function fetchDeal(id: string): Promise<Deal> {
  const res = await fetch(`/api/deals/${id}`);
  if (!res.ok) throw new Error("Failed to fetch deal");
  const data = (await res.json()) as { deal: Deal };
  return data.deal;
}

export async function fetchActivities(dealId: string): Promise<Activity[]> {
  const res = await fetch(`/api/deals/${dealId}/activities`);
  if (!res.ok) throw new Error("Failed to fetch activities");
  const data = (await res.json()) as { activities: Activity[] };
  return data.activities;
}

export async function fetchHistory(dealId: string): Promise<StageHistoryEntry[]> {
  const res = await fetch(`/api/deals/${dealId}/history`);
  if (!res.ok) throw new Error("Failed to fetch history");
  const data = (await res.json()) as { history: StageHistoryEntry[] };
  return data.history;
}

export async function moveDeal(dealId: string, toStageId: string): Promise<Deal> {
  const res = await fetch(`/api/deals/${dealId}/move`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ toStageId }),
  });
  if (!res.ok) throw new Error("Failed to move deal");
  const data = (await res.json()) as { deal: Deal };
  return data.deal;
}
