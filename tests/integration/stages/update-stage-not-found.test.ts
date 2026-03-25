import { describe, expect, it } from "vitest";

import { updateStage } from "@/lib/stages/stage-service";
import { AppError } from "@/lib/validation/api-error";

describe("update stage not found", () => {
  it("throws STAGE_NOT_FOUND for non-existent id", async () => {
    try {
      await updateStage("nonexistent-id", { name: "Ghost" });
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe("STAGE_NOT_FOUND");
      expect((error as AppError).status).toBe(404);
    }
  });
});
