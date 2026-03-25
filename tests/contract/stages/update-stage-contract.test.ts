import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createStage, updateStage } from "@/lib/stages/stage-service";
import { stageNotFoundError } from "@/lib/validation/api-error";

const prisma = new PrismaClient();

describe("update stage contract", () => {
  let stageId: string;

  beforeAll(async () => {
    await prisma.pipelineStage.deleteMany();
    const stage = await createStage({
      name: "Update Contract",
      position: 50,
      isFinal: false,
    });
    stageId = stage.id;
  });

  afterAll(async () => {
    await prisma.pipelineStage.deleteMany();
    await prisma.$disconnect();
  });

  it("returns the updated stage with correct shape", async () => {
    const stage = await updateStage(stageId, { name: "Updated Contract" });

    expect(stage).toHaveProperty("id", stageId);
    expect(stage).toHaveProperty("name", "Updated Contract");
    expect(stage).toHaveProperty("position", 50);
    expect(stage).toHaveProperty("isFinal");
    expect(stage).toHaveProperty("finalType");
    expect(stage).toHaveProperty("createdAt");
    expect(stage).toHaveProperty("updatedAt");
  });

  it("throws STAGE_NOT_FOUND for non-existent id", async () => {
    await expect(
      updateStage("nonexistent-id", { name: "Ghost" }),
    ).rejects.toThrow(stageNotFoundError().message);
  });
});
