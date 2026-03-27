import { describe, expect, it } from "vitest";

import { createDealSchema } from "@/lib/validation/deals";

describe("create deal missing company name", () => {
  it("rejects payload without companyName", () => {
    const result = createDealSchema.safeParse({ stageId: "some-stage-id" });

    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path.join("."));
      expect(fields).toContain("companyName");
    }
  });

  it("rejects payload with empty companyName", () => {
    const result = createDealSchema.safeParse({ companyName: "", stageId: "some-stage-id" });

    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path.join("."));
      expect(fields).toContain("companyName");
    }
  });
});
