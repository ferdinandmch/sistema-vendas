import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createActivity, listActivities } from "@/lib/activities/activity-service";

const prisma = new PrismaClient();

let testOwnerId: string;
let testDealId: string;

describe("list activities contract", () => {
  beforeAll(async () => {
    await prisma.activity.deleteMany();
    await prisma.dealStageHistory.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: { clerkUserId: "clerk_list_contract", email: "list-contract@test.com", name: "List Contract User" },
    });
    testOwnerId = user.id;

    const stage = await prisma.pipelineStage.create({
      data: { name: "List Contract Stage", position: 1, isFinal: false },
    });

    const deal = await prisma.deal.create({
      data: { companyName: "List Contract Corp", stageId: stage.id, ownerId: testOwnerId },
    });
    testDealId = deal.id;

    await createActivity(testDealId, { type: "note", content: "First note" }, testOwnerId);
  });

  afterAll(async () => {
    await prisma.activity.deleteMany();
    await prisma.dealStageHistory.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it("returns array of activities with correct shape: { id, dealId, type, content, createdAt }", async () => {
    const activities = await listActivities(testDealId, testOwnerId);

    expect(Array.isArray(activities)).toBe(true);
    expect(activities.length).toBeGreaterThanOrEqual(1);

    const activity = activities[0];
    expect(activity).toHaveProperty("id");
    expect(activity).toHaveProperty("dealId");
    expect(activity).toHaveProperty("type");
    expect(activity).toHaveProperty("content");
    expect(activity).toHaveProperty("createdAt");

    expect(typeof activity.id).toBe("string");
    expect(typeof activity.dealId).toBe("string");
    expect(typeof activity.type).toBe("string");
    expect(activity.createdAt).toBeInstanceOf(Date);
  });
});
