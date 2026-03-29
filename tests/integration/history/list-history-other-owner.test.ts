import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createDeal, moveDeal } from "@/lib/deals/deal-service";
import { listStageHistory } from "@/lib/history/history-service";
import { AppError } from "@/lib/validation/api-error";

const prisma = new PrismaClient();

let ownerAId: string;
let ownerBId: string;
let dealId: string;

describe("list history other owner", () => {
  beforeAll(async () => {
    await prisma.activity.deleteMany();
    await prisma.dealStageHistory.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();

    const userA = await prisma.user.create({
      data: { clerkUserId: "clerk_hist_owner_a", email: "hist-owner-a@test.com", name: "Hist Owner A" },
    });
    ownerAId = userA.id;

    const userB = await prisma.user.create({
      data: { clerkUserId: "clerk_hist_owner_b", email: "hist-owner-b@test.com", name: "Hist Owner B" },
    });
    ownerBId = userB.id;

    const stageA = await prisma.pipelineStage.create({
      data: { name: "Hist Owner Stage A", position: 1, isFinal: false },
    });
    const stageB = await prisma.pipelineStage.create({
      data: { name: "Hist Owner Stage B", position: 2, isFinal: false },
    });

    const deal = await createDeal({ companyName: "Hist Owner A Corp", stageId: stageA.id }, ownerAId);
    dealId = deal.id;

    await moveDeal(dealId, stageB.id, ownerAId);
  });

  afterAll(async () => {
    await prisma.activity.deleteMany();
    await prisma.dealStageHistory.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it("throws DEAL_NOT_FOUND when Owner B tries to list Owner A's deal history", async () => {
    try {
      await listStageHistory(dealId, ownerBId);
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe("DEAL_NOT_FOUND");
      expect((error as AppError).status).toBe(404);
    }
  });
});
