import { describe, expect, it } from "vitest";

import { listStages } from "@/lib/stages/stage-service";

describe("list stages contract", () => {
  it("returns an array of stages with the correct shape", async () => {
    const stages = await listStages();

    expect(Array.isArray(stages)).toBe(true);

    if (stages.length > 0) {
      const stage = stages[0];
      expect(stage).toHaveProperty("id");
      expect(stage).toHaveProperty("name");
      expect(stage).toHaveProperty("position");
      expect(stage).toHaveProperty("isFinal");
      expect(stage).toHaveProperty("finalType");
      expect(stage).toHaveProperty("createdAt");
      expect(stage).toHaveProperty("updatedAt");

      expect(typeof stage.id).toBe("string");
      expect(typeof stage.name).toBe("string");
      expect(typeof stage.position).toBe("number");
      expect(typeof stage.isFinal).toBe("boolean");
    }
  });

  it("returns stages ordered by position ascending", async () => {
    const stages = await listStages();

    for (let i = 1; i < stages.length; i++) {
      expect(stages[i].position).toBeGreaterThan(stages[i - 1].position);
    }
  });
});
