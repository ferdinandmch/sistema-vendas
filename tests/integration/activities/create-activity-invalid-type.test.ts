import { describe, expect, it } from "vitest";

import { createActivitySchema } from "@/lib/validation/activities";

describe("create activity invalid type", () => {
  it("rejects type=email with validation error and details array", () => {
    const result = createActivitySchema.safeParse({ type: "email" });

    expect(result.success).toBe(false);
    if (!result.success) {
      const typeIssue = result.error.issues.find((i) => i.path.includes("type"));
      expect(typeIssue).toBeDefined();
      expect(typeIssue!.message).toContain("note");
    }
  });
});
