import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createActivity } from "@/lib/activities/activity-service";

const prisma = new PrismaClient();

let testOwnerId: string;
let testDealId: string;

describe("create activity contract", () => {
  beforeAll(async () => {
    await prisma.activity.deleteMany();
    await prisma.dealStageHistory.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: { clerkUserId: "clerk_activity_contract", email: "activity-contract@test.com", name: "Activity Contract User" },
    });
    testOwnerId = user.id;

    const stage = await prisma.pipelineStage.create({
      data: { name: "Contract Stage", position: 1, isFinal: false },
    });

    const deal = await prisma.deal.create({
      data: { companyName: "Contract Corp", stageId: stage.id, ownerId: testOwnerId },
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

  it("returns an activity with the correct shape: { id, dealId, type, content, createdAt }", async () => {
    const activity = await createActivity(
      testDealId,
      { type: "call", content: "Discussed proposal" },
      testOwnerId,
    );

    expect(activity).toHaveProperty("id");
    expect(activity).toHaveProperty("dealId");
    expect(activity).toHaveProperty("type");
    expect(activity).toHaveProperty("content");
    expect(activity).toHaveProperty("createdAt");

    expect(typeof activity.id).toBe("string");
    expect(typeof activity.dealId).toBe("string");
    expect(typeof activity.type).toBe("string");
    expect(typeof activity.content).toBe("string");
    expect(activity.createdAt).toBeInstanceOf(Date);
  });
});
