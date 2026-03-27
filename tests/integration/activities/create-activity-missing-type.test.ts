import { describe, expect, it } from "vitest";

import { createActivitySchema } from "@/lib/validation/activities";

describe("create activity missing type", () => {
  it("rejects body without type field with validation error", () => {
    const result = createActivitySchema.safeParse({ content: "Some note" });

    expect(result.success).toBe(false);
    if (!result.success) {
      const typeIssue = result.error.issues.find((i) => i.path.includes("type"));
      expect(typeIssue).toBeDefined();
      expect(typeIssue!.message).toBe("Activity type is required");
    }
  });
});
