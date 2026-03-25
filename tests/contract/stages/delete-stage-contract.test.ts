import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createStage, deleteStage } from "@/lib/stages/stage-service";
import { stageNotFoundError } from "@/lib/validation/api-error";

const prisma = new PrismaClient();

describe("delete stage contract", () => {
  let stageId: string;

  beforeAll(async () => {
    await prisma.pipelineStage.deleteMany();
    const stage = await createStage({
      name: "Delete Contract",
      position: 60,
      isFinal: false,
    });
    stageId = stage.id;
  });

  afterAll(async () => {
    await prisma.pipelineStage.deleteMany();
    await prisma.$disconnect();
  });

  it("deletes the stage without error", async () => {
    await expect(deleteStage(stageId)).resolves.toBeUndefined();
  });

  it("throws STAGE_NOT_FOUND for non-existent id", async () => {
    await expect(deleteStage("nonexistent-id")).rejects.toThrow(
      stageNotFoundError().message,
    );
  });
});
