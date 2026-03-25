import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const prisma = new PrismaClient();

const DEFAULT_STAGES = [
  { name: "Cold", position: 1, isFinal: false, finalType: null },
  { name: "Warm", position: 2, isFinal: false, finalType: null },
  { name: "Initial Call", position: 3, isFinal: false, finalType: null },
  { name: "Qualified", position: 4, isFinal: false, finalType: null },
  { name: "Demo", position: 5, isFinal: false, finalType: null },
  { name: "Negotiation", position: 6, isFinal: false, finalType: null },
  { name: "Won", position: 7, isFinal: true, finalType: "won" as const },
  { name: "Lost", position: 8, isFinal: true, finalType: "lost" as const },
];

async function runSeed() {
  for (const stage of DEFAULT_STAGES) {
    await prisma.pipelineStage.upsert({
      where: { name: stage.name },
      update: {},
      create: stage,
    });
  }
}

describe("seed idempotency", () => {
  beforeAll(async () => {
    await prisma.pipelineStage.deleteMany();
    await runSeed();
    await runSeed();
    await runSeed();
  }, 30000);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("produces exactly 8 stages after multiple seed runs", async () => {
    const stages = await prisma.pipelineStage.findMany();
    expect(stages).toHaveLength(8);
  });

  it("does not create duplicate entries", async () => {
    const names = await prisma.pipelineStage.findMany({
      select: { name: true },
    });
    const uniqueNames = new Set(names.map((s) => s.name));
    expect(uniqueNames.size).toBe(8);
  });
});
