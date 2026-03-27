import { describe, expect, it } from "vitest";

import { moveDealSchema } from "@/lib/validation/deals";

describe("move deal missing payload", () => {
  it("rejects empty object", () => {
    const result = moveDealSchema.safeParse({});
    expect(result.success).toBe(false);

    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path.join("."));
      expect(fields).toContain("toStageId");
    }
  });

  it("rejects empty string for toStageId", () => {
    const result = moveDealSchema.safeParse({ toStageId: "" });
    expect(result.success).toBe(false);
  });

  it("accepts valid toStageId", () => {
    const result = moveDealSchema.safeParse({ toStageId: "some-stage-id" });
    expect(result.success).toBe(true);
  });
});
