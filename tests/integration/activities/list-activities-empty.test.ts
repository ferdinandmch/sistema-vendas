import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { listActivities } from "@/lib/activities/activity-service";

const prisma = new PrismaClient();

let testOwnerId: string;
let testDealId: string;

describe("list activities empty", () => {
  beforeAll(async () => {
    await prisma.activity.deleteMany();
    await prisma.dealStageHistory.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: { clerkUserId: "clerk_list_empty", email: "list-empty@test.com", name: "List Empty User" },
    });
    testOwnerId = user.id;

    const stage = await prisma.pipelineStage.create({
      data: { name: "List Empty Stage", position: 1, isFinal: false },
    });

    const deal = await prisma.deal.create({
      data: { companyName: "List Empty Corp", stageId: stage.id, ownerId: testOwnerId },
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

  it("returns empty array for deal with no activities", async () => {
    const activities = await listActivities(testDealId, testOwnerId);

    expect(Array.isArray(activities)).toBe(true);
    expect(activities).toHaveLength(0);
  });
});
