import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createDeal, moveDeal } from "@/lib/deals/deal-service";
import { AppError } from "@/lib/validation/api-error";

const prisma = new PrismaClient();

let testOwnerId: string;
let activeStageId: string;
let anotherStageId: string;
let wonStageId: string;
let dealId: string;

describe("move deal already closed", () => {
  beforeAll(async () => {
    await prisma.dealStageHistory.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: { clerkUserId: "clerk_already_closed", email: "already-closed@test.com", name: "Already Closed User" },
    });
    testOwnerId = user.id;

    const activeStage = await prisma.pipelineStage.create({
      data: { name: "Active", position: 1, isFinal: false },
    });
    activeStageId = activeStage.id;

    const anotherStage = await prisma.pipelineStage.create({
      data: { name: "Another", position: 2, isFinal: false },
    });
    anotherStageId = anotherStage.id;

    const wonStage = await prisma.pipelineStage.create({
      data: { name: "Won", position: 3, isFinal: true, finalType: "won" },
    });
    wonStageId = wonStage.id;

    const deal = await createDeal({ companyName: "Closed Corp", stageId: activeStageId }, testOwnerId);
    dealId = deal.id;

    // Close the deal by moving to won stage
    await moveDeal(dealId, wonStageId, testOwnerId);
  });

  afterAll(async () => {
    await prisma.dealStageHistory.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it("throws DEAL_ALREADY_CLOSED when trying to move a won deal", async () => {
    try {
      await moveDeal(dealId, anotherStageId, testOwnerId);
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe("DEAL_ALREADY_CLOSED");
      expect((error as AppError).status).toBe(400);
    }

    const deal = await prisma.deal.findUnique({ where: { id: dealId } });
    expect(deal?.stageId).toBe(wonStageId);
    expect(deal?.status).toBe("won");

    // Only 1 history record (from the initial move to won), no additional
    const history = await prisma.dealStageHistory.findMany({ where: { dealId } });
    expect(history).toHaveLength(1);
  });
});
