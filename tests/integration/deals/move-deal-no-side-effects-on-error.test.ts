import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createDeal, moveDeal } from "@/lib/deals/deal-service";
import { AppError } from "@/lib/validation/api-error";

const prisma = new PrismaClient();

let testOwnerId: string;
let stageAId: string;
let stageBId: string;
let finalStageId: string;
let activeDealId: string;
let closedDealId: string;

describe("move deal no side effects on error", () => {
  beforeAll(async () => {
    await prisma.dealStageHistory.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: { clerkUserId: "clerk_no_side_fx", email: "no-side-fx@test.com", name: "No Side FX User" },
    });
    testOwnerId = user.id;

    const stageA = await prisma.pipelineStage.create({
      data: { name: "Stage A", position: 1, isFinal: false },
    });
    stageAId = stageA.id;

    const stageB = await prisma.pipelineStage.create({
      data: { name: "Stage B", position: 2, isFinal: false },
    });
    stageBId = stageB.id;

    const finalStage = await prisma.pipelineStage.create({
      data: { name: "Won Stage", position: 3, isFinal: true, finalType: "won" },
    });
    finalStageId = finalStage.id;

    const activeDeal = await createDeal({ companyName: "Active Corp", stageId: stageAId }, testOwnerId);
    activeDealId = activeDeal.id;

    const dealToClose = await createDeal({ companyName: "Closed Corp", stageId: stageBId }, testOwnerId);
    closedDealId = dealToClose.id;

    // Move dealToClose to final stage so it becomes won
    await moveDeal(closedDealId, finalStageId, testOwnerId);
  });

  afterAll(async () => {
    await prisma.dealStageHistory.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it("SAME_STAGE error leaves deal unchanged and creates no history", async () => {
    try {
      await moveDeal(activeDealId, stageAId, testOwnerId);
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe("SAME_STAGE");
    }

    const deal = await prisma.deal.findUnique({ where: { id: activeDealId } });
    expect(deal?.stageId).toBe(stageAId);
    expect(deal?.status).toBe("active");

    const history = await prisma.dealStageHistory.findMany({ where: { dealId: activeDealId } });
    expect(history).toHaveLength(0);
  });

  it("DEAL_ALREADY_CLOSED error leaves deal unchanged and creates no additional history", async () => {
    const historyBefore = await prisma.dealStageHistory.findMany({ where: { dealId: closedDealId } });
    const countBefore = historyBefore.length;

    try {
      await moveDeal(closedDealId, stageAId, testOwnerId);
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe("DEAL_ALREADY_CLOSED");
    }

    const deal = await prisma.deal.findUnique({ where: { id: closedDealId } });
    expect(deal?.stageId).toBe(finalStageId);
    expect(deal?.status).toBe("won");

    const historyAfter = await prisma.dealStageHistory.findMany({ where: { dealId: closedDealId } });
    expect(historyAfter).toHaveLength(countBefore);
  });
});
