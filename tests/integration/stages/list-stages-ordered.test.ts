import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { listStages } from "@/lib/stages/stage-service";

const prisma = new PrismaClient();

describe("list stages ordered", () => {
  beforeAll(async () => {
    await prisma.pipelineStage.deleteMany();
    // Insert in reverse order to test sorting
    await prisma.pipelineStage.create({
      data: { name: "Third", position: 3, isFinal: false },
    });
    await prisma.pipelineStage.create({
      data: { name: "First", position: 1, isFinal: false },
    });
    await prisma.pipelineStage.create({
      data: { name: "Second", position: 2, isFinal: false },
    });
  });

  afterAll(async () => {
    await prisma.pipelineStage.deleteMany();
    await prisma.$disconnect();
  });

  it("returns stages sorted by position ascending", async () => {
    const stages = await listStages();
    expect(stages.map((s) => s.name)).toEqual(["First", "Second", "Third"]);
    expect(stages.map((s) => s.position)).toEqual([1, 2, 3]);
  });
});
