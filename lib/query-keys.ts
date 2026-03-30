export const stageKeys = {
  all: ["stages"] as const,
  list: () => [...stageKeys.all, "list"] as const,
};

export const dealKeys = {
  all: ["deals"] as const,
  list: () => [...dealKeys.all, "list"] as const,
  detail: (id: string) => [...dealKeys.all, "detail", id] as const,
};

export const activityKeys = {
  all: ["activities"] as const,
  list: (dealId: string) => [...activityKeys.all, "list", dealId] as const,
};

export const historyKeys = {
  all: ["history"] as const,
  list: (dealId: string) => [...historyKeys.all, "list", dealId] as const,
};
