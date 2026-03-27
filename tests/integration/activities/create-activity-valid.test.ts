import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createActivity } from "@/lib/activities/activity-service";

const prisma = new PrismaClient();

let testOwnerId: string;
let testDealId: string;

describe("create activity valid", () => {
  beforeAll(async () => {
    await prisma.activity.deleteMany();
    await prisma.dealStageHistory.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: { clerkUserId: "clerk_activity_valid", email: "activity-valid@test.com", name: "Activity Valid User" },
    });
    testOwnerId = user.id;

    const stage = await prisma.pipelineStage.create({
      data: { name: "Valid Stage", position: 1, isFinal: false },
    });

    const deal = await prisma.deal.create({
      data: { companyName: "Valid Corp", stageId: stage.id, ownerId: testOwnerId },
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

  it("creates activity type call with content, persists it, and updates deal.lastTouchAt", async () => {
    const activity = await createActivity(
      testDealId,
      { type: "call", content: "Discussed pricing" },
      testOwnerId,
    );

    expect(activity.dealId).toBe(testDealId);
    expect(activity.type).toBe("call");
    expect(activity.content).toBe("Discussed pricing");
    expect(activity.createdAt).toBeInstanceOf(Date);

    const persisted = await prisma.activity.findUnique({ where: { id: activity.id } });
    expect(persisted).not.toBeNull();
    expect(persisted!.type).toBe("call");
    expect(persisted!.content).toBe("Discussed pricing");

    const deal = await prisma.deal.findUnique({ where: { id: testDealId } });
    expect(deal!.lastTouchAt).not.toBeNull();
    expect(deal!.lastTouchAt!.getTime()).toBeGreaterThanOrEqual(activity.createdAt.getTime());
  });
});
