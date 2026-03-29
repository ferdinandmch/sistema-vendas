import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createDeal, moveDeal } from "@/lib/deals/deal-service";
import { listStageHistory } from "@/lib/history/history-service";

const prisma = new PrismaClient();

let testOwnerId: string;
let testDealId: string;

describe("list history finalized deal", () => {
  beforeAll(async () => {
    await prisma.activity.deleteMany();
    await prisma.dealStageHistory.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: { clerkUserId: "clerk_history_finalized", email: "history-finalized@test.com", name: "History Finalized User" },
    });
    testOwnerId = user.id;

    const stageA = await prisma.pipelineStage.create({
      data: { name: "Finalized Stage A", position: 1, isFinal: false },
    });
    const stageWon = await prisma.pipelineStage.create({
      data: { name: "Won Final", position: 2, isFinal: true, finalType: "won" },
    });

    const deal = await createDeal({ companyName: "Finalized Corp", stageId: stageA.id }, testOwnerId);
    testDealId = deal.id;

    await moveDeal(testDealId, stageWon.id, testOwnerId);
  });

  afterAll(async () => {
    await prisma.activity.deleteMany();
    await prisma.dealStageHistory.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it("returns history for deal with status=won, deal status unchanged", async () => {
    const history = await listStageHistory(testDealId, testOwnerId);

    expect(history).toHaveLength(1);
    expect(history[0].toStage.name).toBe("Won Final");

    const deal = await prisma.deal.findUnique({ where: { id: testDealId } });
    expect(deal!.status).toBe("won");
  });
});
