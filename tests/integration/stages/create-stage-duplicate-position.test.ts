import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createStage } from "@/lib/stages/stage-service";
import { AppError } from "@/lib/validation/api-error";

const prisma = new PrismaClient();

describe("create stage duplicate position", () => {
  beforeAll(async () => {
    await prisma.pipelineStage.deleteMany();
    await createStage({ name: "Position One", position: 1, isFinal: false });
  });

  afterAll(async () => {
    await prisma.pipelineStage.deleteMany();
    await prisma.$disconnect();
  });

  it("rejects duplicate position with DUPLICATE_STAGE_POSITION", async () => {
    try {
      await createStage({
        name: "Another Stage",
        position: 1,
        isFinal: false,
      });
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe("DUPLICATE_STAGE_POSITION");
      expect((error as AppError).status).toBe(409);
    }
  });
});
