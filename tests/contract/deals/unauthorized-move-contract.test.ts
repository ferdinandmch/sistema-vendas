import { describe, expect, it } from "vitest";

import { moveDeal } from "@/lib/deals/deal-service";
import { AppError } from "@/lib/validation/api-error";

describe("unauthorized move contract", () => {
  it("throws DEAL_NOT_FOUND when called with non-existent deal id", async () => {
    try {
      await moveDeal("nonexistent-id", "some-stage", "some-owner");
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe("DEAL_NOT_FOUND");
      expect((error as AppError).status).toBe(404);
    }
  });
});
