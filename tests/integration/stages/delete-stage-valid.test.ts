import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  createStage,
  deleteStage,
  listStages,
} from "@/lib/stages/stage-service";

const prisma = new PrismaClient();

describe("delete stage valid", () => {
  let stageId: string;

  beforeAll(async () => {
    await prisma.pipelineStage.deleteMany();
    const stage = await createStage({
      name: "To Delete",
      position: 1,
      isFinal: false,
    });
    stageId = stage.id;
  });

  afterAll(async () => {
    await prisma.pipelineStage.deleteMany();
    await prisma.$disconnect();
  });

  it("deletes the stage and it no longer appears in list", async () => {
    await deleteStage(stageId);
    const stages = await listStages();
    const ids = stages.map((s) => s.id);
    expect(ids).not.toContain(stageId);
  });
});
