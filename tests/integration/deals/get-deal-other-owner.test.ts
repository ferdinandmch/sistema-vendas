import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createDeal, getDeal } from "@/lib/deals/deal-service";
import { AppError } from "@/lib/validation/api-error";

const prisma = new PrismaClient();

let ownerAId: string;
let ownerBId: string;
let dealAId: string;

describe("get deal other owner", () => {
  beforeAll(async () => {
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();

    const userA = await prisma.user.create({
      data: { clerkUserId: "clerk_get_owner_a", email: "get-a@test.com", name: "Owner A" },
    });
    ownerAId = userA.id;

    const userB = await prisma.user.create({
      data: { clerkUserId: "clerk_get_owner_b", email: "get-b@test.com", name: "Owner B" },
    });
    ownerBId = userB.id;

    const stage = await prisma.pipelineStage.create({
      data: { name: "Negotiation", position: 1, isFinal: false },
    });

    const dealA = await createDeal({ companyName: "A Corp", stageId: stage.id }, ownerAId);
    dealAId = dealA.id;
  });

  afterAll(async () => {
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it("throws DEAL_NOT_FOUND when accessing another owner's deal", async () => {
    try {
      await getDeal(dealAId, ownerBId);
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe("DEAL_NOT_FOUND");
    }
  });
});
