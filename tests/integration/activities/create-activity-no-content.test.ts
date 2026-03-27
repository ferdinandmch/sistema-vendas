import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createActivity } from "@/lib/activities/activity-service";

const prisma = new PrismaClient();

let testOwnerId: string;
let testDealId: string;

describe("create activity no content", () => {
  beforeAll(async () => {
    await prisma.activity.deleteMany();
    await prisma.dealStageHistory.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: { clerkUserId: "clerk_activity_nocontent", email: "activity-nocontent@test.com", name: "No Content User" },
    });
    testOwnerId = user.id;

    const stage = await prisma.pipelineStage.create({
      data: { name: "No Content Stage", position: 1, isFinal: false },
    });

    const deal = await prisma.deal.create({
      data: { companyName: "No Content Corp", stageId: stage.id, ownerId: testOwnerId },
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

  it("creates activity type note without content, persists with content=null, updates lastTouchAt", async () => {
    const activity = await createActivity(
      testDealId,
      { type: "note" },
      testOwnerId,
    );

    expect(activity.dealId).toBe(testDealId);
    expect(activity.type).toBe("note");
    expect(activity.content).toBeNull();

    const persisted = await prisma.activity.findUnique({ where: { id: activity.id } });
    expect(persisted).not.toBeNull();
    expect(persisted!.content).toBeNull();

    const deal = await prisma.deal.findUnique({ where: { id: testDealId } });
    expect(deal!.lastTouchAt).not.toBeNull();
  });
});
