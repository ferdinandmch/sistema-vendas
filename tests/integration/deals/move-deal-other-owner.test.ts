import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createDeal, moveDeal } from "@/lib/deals/deal-service";
import { AppError } from "@/lib/validation/api-error";

const prisma = new PrismaClient();

let ownerAId: string;
let ownerBId: string;
let stageAId: string;
let stageBId: string;
let dealId: string;

describe("move deal other owner", () => {
  beforeAll(async () => {
    await prisma.dealStageHistory.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();

    const userA = await prisma.user.create({
      data: { clerkUserId: "clerk_owner_a", email: "owner-a@test.com", name: "Owner A" },
    });
    ownerAId = userA.id;

    const userB = await prisma.user.create({
      data: { clerkUserId: "clerk_owner_b", email: "owner-b@test.com", name: "Owner B" },
    });
    ownerBId = userB.id;

    const stageA = await prisma.pipelineStage.create({
      data: { name: "Stage A", position: 1, isFinal: false },
    });
    stageAId = stageA.id;

    const stageB = await prisma.pipelineStage.create({
      data: { name: "Stage B", position: 2, isFinal: false },
    });
    stageBId = stageB.id;

    // Deal belongs to Owner A
    const deal = await createDeal({ companyName: "Owner A Corp", stageId: stageAId }, ownerAId);
    dealId = deal.id;
  });

  afterAll(async () => {
    await prisma.dealStageHistory.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it("throws DEAL_NOT_FOUND when Owner B tries to move Owner A's deal", async () => {
    try {
      await moveDeal(dealId, stageBId, ownerBId);
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe("DEAL_NOT_FOUND");
      expect((error as AppError).status).toBe(404);
    }

    // Deal unchanged
    const deal = await prisma.deal.findUnique({ where: { id: dealId } });
    expect(deal?.stageId).toBe(stageAId);
    expect(deal?.status).toBe("active");

    const history = await prisma.dealStageHistory.findMany({ where: { dealId } });
    expect(history).toHaveLength(0);
  });
});
