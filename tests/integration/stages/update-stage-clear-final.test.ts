import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createStage, updateStage } from "@/lib/stages/stage-service";

const prisma = new PrismaClient();

describe("update stage clear final", () => {
  let finalStageId: string;

  beforeAll(async () => {
    await prisma.pipelineStage.deleteMany();
    const stage = await createStage({
      name: "Was Final",
      position: 1,
      isFinal: true,
      finalType: "won",
    });
    finalStageId = stage.id;
  });

  afterAll(async () => {
    await prisma.pipelineStage.deleteMany();
    await prisma.$disconnect();
  });

  it("auto-clears finalType when isFinal changes to false", async () => {
    const updated = await updateStage(finalStageId, { isFinal: false });
    expect(updated.isFinal).toBe(false);
    expect(updated.finalType).toBeNull();
  });
});
