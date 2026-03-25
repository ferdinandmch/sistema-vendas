import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createStage, updateStage } from "@/lib/stages/stage-service";

const prisma = new PrismaClient();

describe("update stage valid", () => {
  let stageId: string;

  beforeAll(async () => {
    await prisma.pipelineStage.deleteMany();
    const stage = await createStage({
      name: "Original",
      position: 1,
      isFinal: false,
    });
    stageId = stage.id;
  });

  afterAll(async () => {
    await prisma.pipelineStage.deleteMany();
    await prisma.$disconnect();
  });

  it("updates the stage name", async () => {
    const updated = await updateStage(stageId, { name: "Renamed" });
    expect(updated.name).toBe("Renamed");
    expect(updated.position).toBe(1);
  });
});
