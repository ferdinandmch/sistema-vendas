import { describe, expect, it } from "vitest";

import { deleteStage } from "@/lib/stages/stage-service";
import { AppError } from "@/lib/validation/api-error";

describe("delete stage not found", () => {
  it("throws STAGE_NOT_FOUND for non-existent id", async () => {
    try {
      await deleteStage("nonexistent-id");
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe("STAGE_NOT_FOUND");
      expect((error as AppError).status).toBe(404);
    }
  });
});
