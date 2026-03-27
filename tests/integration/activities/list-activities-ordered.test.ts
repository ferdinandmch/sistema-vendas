import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createActivity, listActivities } from "@/lib/activities/activity-service";

const prisma = new PrismaClient();

let testOwnerId: string;
let testDealId: string;

describe("list activities ordered", () => {
  beforeAll(async () => {
    await prisma.activity.deleteMany();
    await prisma.dealStageHistory.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: { clerkUserId: "clerk_list_ordered", email: "list-ordered@test.com", name: "List Ordered User" },
    });
    testOwnerId = user.id;

    const stage = await prisma.pipelineStage.create({
      data: { name: "List Ordered Stage", position: 1, isFinal: false },
    });

    const deal = await prisma.deal.create({
      data: { companyName: "List Ordered Corp", stageId: stage.id, ownerId: testOwnerId },
    });
    testDealId = deal.id;

    await createActivity(testDealId, { type: "note", content: "First" }, testOwnerId);
    await createActivity(testDealId, { type: "call", content: "Second" }, testOwnerId);
    await createActivity(testDealId, { type: "meeting", content: "Third" }, testOwnerId);
  });

  afterAll(async () => {
    await prisma.activity.deleteMany();
    await prisma.dealStageHistory.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it("returns 3 activities ordered by createdAt desc (most recent first)", async () => {
    const activities = await listActivities(testDealId, testOwnerId);

    expect(activities).toHaveLength(3);

    for (let i = 0; i < activities.length - 1; i++) {
      expect(activities[i].createdAt.getTime()).toBeGreaterThanOrEqual(
        activities[i + 1].createdAt.getTime(),
      );
    }

    expect(activities[0].content).toBe("Third");
    expect(activities[2].content).toBe("First");
  });
});
