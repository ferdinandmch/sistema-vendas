import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createActivity } from "@/lib/activities/activity-service";

const prisma = new PrismaClient();

let testOwnerId: string;
let testDealId: string;

describe("create activity all types", () => {
  beforeAll(async () => {
    await prisma.activity.deleteMany();
    await prisma.dealStageHistory.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: { clerkUserId: "clerk_activity_alltypes", email: "alltypes@test.com", name: "All Types User" },
    });
    testOwnerId = user.id;

    const stage = await prisma.pipelineStage.create({
      data: { name: "All Types Stage", position: 1, isFinal: false },
    });

    const deal = await prisma.deal.create({
      data: { companyName: "All Types Corp", stageId: stage.id, ownerId: testOwnerId },
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

  it("creates one activity of each type and lastTouchAt reflects the most recent", async () => {
    const types = ["note", "call", "meeting", "followup"] as const;
    const activities = [];

    for (const type of types) {
      const activity = await createActivity(
        testDealId,
        { type, content: `Activity ${type}` },
        testOwnerId,
      );
      activities.push(activity);
    }

    expect(activities).toHaveLength(4);

    const persisted = await prisma.activity.findMany({
      where: { dealId: testDealId },
      orderBy: { createdAt: "asc" },
    });
    expect(persisted).toHaveLength(4);

    const persistedTypes = persisted.map((a) => a.type);
    for (const type of types) {
      expect(persistedTypes).toContain(type);
    }

    const deal = await prisma.deal.findUnique({ where: { id: testDealId } });
    const lastActivity = activities[activities.length - 1];
    expect(deal!.lastTouchAt!.getTime()).toBe(lastActivity.createdAt.getTime());
  });
});
