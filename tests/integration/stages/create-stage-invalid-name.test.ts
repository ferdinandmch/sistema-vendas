import { describe, expect, it } from "vitest";

import { createStageSchema } from "@/lib/validation/stages";

describe("create stage invalid name", () => {
  it("rejects empty name", () => {
    const result = createStageSchema.safeParse({
      name: "",
      position: 1,
      isFinal: false,
    });
    expect(result.success).toBe(false);
  });

  it("rejects whitespace-only name", () => {
    const result = createStageSchema.safeParse({
      name: "   ",
      position: 1,
      isFinal: false,
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid non-empty name", () => {
    const result = createStageSchema.safeParse({
      name: "Valid Stage",
      position: 1,
      isFinal: false,
    });
    expect(result.success).toBe(true);
  });
});
