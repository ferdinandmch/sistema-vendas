import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createDeal, moveDeal } from "@/lib/deals/deal-service";
import { AppError } from "@/lib/validation/api-error";

const prisma = new PrismaClient();

let testOwnerId: string;
let dealId: string;

describe("move deal invalid stage", () => {
  beforeAll(async () => {
    await prisma.dealStageHistory.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: { clerkUserId: "clerk_move_inv_stage", email: "inv-stage@test.com", name: "Inv Stage User" },
    });
    testOwnerId = user.id;

    const stage = await prisma.pipelineStage.create({
      data: { name: "Active Stage", position: 1, isFinal: false },
    });

    const deal = await createDeal({ companyName: "Inv Stage Corp", stageId: stage.id }, testOwnerId);
    dealId = deal.id;
  });

  afterAll(async () => {
    await prisma.dealStageHistory.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it("throws STAGE_NOT_FOUND when moving to nonexistent stage", async () => {
    try {
      await moveDeal(dealId, "nonexistent-stage-id", testOwnerId);
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe("STAGE_NOT_FOUND");
      expect((error as AppError).status).toBe(400);
    }

    const deal = await prisma.deal.findUnique({ where: { id: dealId } });
    const history = await prisma.dealStageHistory.findMany({ where: { dealId } });
    expect(history).toHaveLength(0);
    expect(deal?.stageId).not.toBe("nonexistent-stage-id");
  });
});
