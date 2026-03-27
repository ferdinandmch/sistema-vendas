import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createActivity } from "@/lib/activities/activity-service";
import { AppError } from "@/lib/validation/api-error";

const prisma = new PrismaClient();

let ownerAId: string;
let ownerBId: string;
let dealId: string;

describe("create activity other owner", () => {
  beforeAll(async () => {
    await prisma.activity.deleteMany();
    await prisma.dealStageHistory.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();

    const userA = await prisma.user.create({
      data: { clerkUserId: "clerk_act_owner_a", email: "act-owner-a@test.com", name: "Owner A" },
    });
    ownerAId = userA.id;

    const userB = await prisma.user.create({
      data: { clerkUserId: "clerk_act_owner_b", email: "act-owner-b@test.com", name: "Owner B" },
    });
    ownerBId = userB.id;

    const stage = await prisma.pipelineStage.create({
      data: { name: "Owner Test Stage", position: 1, isFinal: false },
    });

    const deal = await prisma.deal.create({
      data: { companyName: "Owner A Corp", stageId: stage.id, ownerId: ownerAId },
    });
    dealId = deal.id;
  });

  afterAll(async () => {
    await prisma.activity.deleteMany();
    await prisma.dealStageHistory.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it("throws DEAL_NOT_FOUND when Owner B tries to create activity on Owner A's deal", async () => {
    const dealBefore = await prisma.deal.findUnique({ where: { id: dealId } });

    try {
      await createActivity(dealId, { type: "note", content: "Unauthorized" }, ownerBId);
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe("DEAL_NOT_FOUND");
      expect((error as AppError).status).toBe(404);
    }

    const activities = await prisma.activity.findMany({ where: { dealId } });
    expect(activities).toHaveLength(0);

    const dealAfter = await prisma.deal.findUnique({ where: { id: dealId } });
    expect(dealAfter!.lastTouchAt).toEqual(dealBefore!.lastTouchAt);
  });
});
