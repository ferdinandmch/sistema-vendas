import { describe, expect, it } from "vitest";

import { updateDealSchema } from "@/lib/validation/deals";

describe("update deal invalid data", () => {
  it("rejects empty companyName", () => {
    const result = updateDealSchema.safeParse({ companyName: "" });

    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path.join("."));
      expect(fields).toContain("companyName");
    }
  });

  it("accepts payload with no fields (empty partial update)", () => {
    const result = updateDealSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});
