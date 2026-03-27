import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createActivity } from "@/lib/activities/activity-service";

const prisma = new PrismaClient();

let testOwnerId: string;
let testDealId: string;

describe("create activity finalized deal", () => {
  beforeAll(async () => {
    await prisma.activity.deleteMany();
    await prisma.dealStageHistory.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: { clerkUserId: "clerk_activity_finalized", email: "finalized@test.com", name: "Finalized User" },
    });
    testOwnerId = user.id;

    const stage = await prisma.pipelineStage.create({
      data: { name: "Won Stage", position: 1, isFinal: true, finalType: "won" },
    });

    const deal = await prisma.deal.create({
      data: {
        companyName: "Won Corp",
        stageId: stage.id,
        ownerId: testOwnerId,
        status: "won",
      },
    });
    testDealId = deal.id;
  });

  afterAll(async () => {
    await prisma.activity.deleteMany();
    await prisma.dealStageHistory.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it("creates activity on deal with status=won (201 success), deal.status remains won", async () => {
    const activity = await createActivity(
      testDealId,
      { type: "note", content: "Post-win follow-up" },
      testOwnerId,
    );

    expect(activity.dealId).toBe(testDealId);
    expect(activity.type).toBe("note");

    const deal = await prisma.deal.findUnique({ where: { id: testDealId } });
    expect(deal!.status).toBe("won");
    expect(deal!.lastTouchAt).not.toBeNull();
  });
});
