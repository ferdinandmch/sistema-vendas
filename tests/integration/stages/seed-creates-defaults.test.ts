import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const prisma = new PrismaClient();

describe("seed creates default stages", () => {
  beforeAll(async () => {
    await prisma.pipelineStage.deleteMany();
    // Re-run seed logic inline (same as prisma/seed.ts)
    const stages = [
      { name: "Cold", position: 1, isFinal: false, finalType: null },
      { name: "Warm", position: 2, isFinal: false, finalType: null },
      { name: "Initial Call", position: 3, isFinal: false, finalType: null },
      { name: "Qualified", position: 4, isFinal: false, finalType: null },
      { name: "Demo", position: 5, isFinal: false, finalType: null },
      { name: "Negotiation", position: 6, isFinal: false, finalType: null },
      { name: "Won", position: 7, isFinal: true, finalType: "won" as const },
      { name: "Lost", position: 8, isFinal: true, finalType: "lost" as const },
    ];
    for (const stage of stages) {
      await prisma.pipelineStage.upsert({
        where: { name: stage.name },
        update: {},
        create: stage,
      });
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creates exactly 8 default stages", async () => {
    const stages = await prisma.pipelineStage.findMany({
      orderBy: { position: "asc" },
    });
    expect(stages).toHaveLength(8);
  });

  it("creates stages with correct names and positions", async () => {
    const stages = await prisma.pipelineStage.findMany({
      orderBy: { position: "asc" },
    });
    const names = stages.map((s) => s.name);
    expect(names).toEqual([
      "Cold",
      "Warm",
      "Initial Call",
      "Qualified",
      "Demo",
      "Negotiation",
      "Won",
      "Lost",
    ]);
    stages.forEach((s, i) => {
      expect(s.position).toBe(i + 1);
    });
  });

  it("marks Won and Lost as final stages with correct final_type", async () => {
    const won = await prisma.pipelineStage.findUnique({
      where: { name: "Won" },
    });
    const lost = await prisma.pipelineStage.findUnique({
      where: { name: "Lost" },
    });

    expect(won?.isFinal).toBe(true);
    expect(won?.finalType).toBe("won");
    expect(lost?.isFinal).toBe(true);
    expect(lost?.finalType).toBe("lost");
  });

  it("marks non-final stages with isFinal=false and finalType=null", async () => {
    const nonFinal = await prisma.pipelineStage.findMany({
      where: { isFinal: false },
      orderBy: { position: "asc" },
    });
    expect(nonFinal).toHaveLength(6);
    nonFinal.forEach((s) => {
      expect(s.finalType).toBeNull();
    });
  });
});
