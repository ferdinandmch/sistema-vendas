import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createDeal, moveDeal } from "@/lib/deals/deal-service";
import { AppError } from "@/lib/validation/api-error";

const prisma = new PrismaClient();

let testOwnerId: string;
let stageId: string;
let dealId: string;

describe("move deal same stage", () => {
  beforeAll(async () => {
    await prisma.dealStageHistory.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: { clerkUserId: "clerk_move_same", email: "same@test.com", name: "Same Stage User" },
    });
    testOwnerId = user.id;

    const stage = await prisma.pipelineStage.create({
      data: { name: "Current Stage", position: 1, isFinal: false },
    });
    stageId = stage.id;

    const deal = await createDeal({ companyName: "Same Corp", stageId }, testOwnerId);
    dealId = deal.id;
  });

  afterAll(async () => {
    await prisma.dealStageHistory.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it("throws SAME_STAGE when moving to current stage and creates no history", async () => {
    try {
      await moveDeal(dealId, stageId, testOwnerId);
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe("SAME_STAGE");
      expect((error as AppError).status).toBe(400);
    }

    const history = await prisma.dealStageHistory.findMany({ where: { dealId } });
    expect(history).toHaveLength(0);
  });
});
