import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createDeal, moveDeal } from "@/lib/deals/deal-service";

const prisma = new PrismaClient();

let testOwnerId: string;
let stageAId: string;
let stageBId: string;
let stageCId: string;
let dealId: string;

describe("move deal history", () => {
  beforeAll(async () => {
    await prisma.dealStageHistory.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: { clerkUserId: "clerk_move_history", email: "history@test.com", name: "History User" },
    });
    testOwnerId = user.id;

    const stageA = await prisma.pipelineStage.create({
      data: { name: "Step 1", position: 1, isFinal: false },
    });
    stageAId = stageA.id;

    const stageB = await prisma.pipelineStage.create({
      data: { name: "Step 2", position: 2, isFinal: false },
    });
    stageBId = stageB.id;

    const stageC = await prisma.pipelineStage.create({
      data: { name: "Step 3", position: 3, isFinal: false },
    });
    stageCId = stageC.id;

    const deal = await createDeal({ companyName: "History Corp", stageId: stageAId }, testOwnerId);
    dealId = deal.id;
  });

  afterAll(async () => {
    await prisma.dealStageHistory.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it("creates 2 history records with correct from/to after moving twice", async () => {
    await moveDeal(dealId, stageBId, testOwnerId);
    await moveDeal(dealId, stageCId, testOwnerId);

    const history = await prisma.dealStageHistory.findMany({
      where: { dealId },
      orderBy: { changedAt: "asc" },
    });

    expect(history).toHaveLength(2);

    expect(history[0].fromStageId).toBe(stageAId);
    expect(history[0].toStageId).toBe(stageBId);

    expect(history[1].fromStageId).toBe(stageBId);
    expect(history[1].toStageId).toBe(stageCId);

    expect(history[1].changedAt.getTime()).toBeGreaterThanOrEqual(history[0].changedAt.getTime());
  });
});
