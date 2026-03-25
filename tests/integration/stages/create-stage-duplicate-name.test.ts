import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createStage } from "@/lib/stages/stage-service";
import { AppError } from "@/lib/validation/api-error";

const prisma = new PrismaClient();

describe("create stage duplicate name", () => {
  beforeAll(async () => {
    await prisma.pipelineStage.deleteMany();
    await createStage({ name: "Existing", position: 1, isFinal: false });
  });

  afterAll(async () => {
    await prisma.pipelineStage.deleteMany();
    await prisma.$disconnect();
  });

  it("rejects duplicate name with DUPLICATE_STAGE_NAME", async () => {
    try {
      await createStage({ name: "Existing", position: 2, isFinal: false });
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe("DUPLICATE_STAGE_NAME");
      expect((error as AppError).status).toBe(409);
    }
  });
});
