export const stageKeys = {
  all: ["stages"] as const,
  list: () => [...stageKeys.all, "list"] as const,
};

export const dealKeys = {
  all: ["deals"] as const,
  list: () => [...dealKeys.all, "list"] as const,
};
