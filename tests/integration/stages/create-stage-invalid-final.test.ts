import { describe, expect, it } from "vitest";

import { createStageSchema } from "@/lib/validation/stages";

describe("create stage invalid final type", () => {
  it("rejects isFinal=true without finalType", () => {
    const result = createStageSchema.safeParse({
      name: "Bad Final",
      position: 1,
      isFinal: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejects isFinal=false with finalType set", () => {
    const result = createStageSchema.safeParse({
      name: "Bad Non-Final",
      position: 2,
      isFinal: false,
      finalType: "won",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid finalType value", () => {
    const result = createStageSchema.safeParse({
      name: "Bad Type",
      position: 3,
      isFinal: true,
      finalType: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("accepts isFinal=true with valid finalType", () => {
    const result = createStageSchema.safeParse({
      name: "Good Final",
      position: 4,
      isFinal: true,
      finalType: "won",
    });
    expect(result.success).toBe(true);
  });
});
