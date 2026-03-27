import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createActivity } from "@/lib/activities/activity-service";
import { AppError } from "@/lib/validation/api-error";

const prisma = new PrismaClient();

let testOwnerId: string;
let testDealId: string;

describe("create activity touch atomicity", () => {
  beforeAll(async () => {
    await prisma.activity.deleteMany();
    await prisma.dealStageHistory.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: { clerkUserId: "clerk_activity_atomicity", email: "atomicity@test.com", name: "Atomicity User" },
    });
    testOwnerId = user.id;

    const stage = await prisma.pipelineStage.create({
      data: { name: "Atomicity Stage", position: 1, isFinal: false },
    });

    const deal = await prisma.deal.create({
      data: { companyName: "Atomicity Corp", stageId: stage.id, ownerId: testOwnerId },
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

  it("creates activity and updates lastTouchAt in the same operation", async () => {
    const activity = await createActivity(
      testDealId,
      { type: "meeting", content: "Kickoff meeting" },
      testOwnerId,
    );

    const deal = await prisma.deal.findUnique({ where: { id: testDealId } });
    expect(deal!.lastTouchAt).not.toBeNull();
    expect(deal!.lastTouchAt!.getTime()).toBe(activity.createdAt.getTime());
  });

  it("does not create activity when deal does not exist (atomicity validation)", async () => {
    const activitiesBefore = await prisma.activity.count();

    try {
      await createActivity(
        "nonexistent-deal-id",
        { type: "note", content: "Should not be created" },
        testOwnerId,
      );
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe("DEAL_NOT_FOUND");
    }

    const activitiesAfter = await prisma.activity.count();
    expect(activitiesAfter).toBe(activitiesBefore);
  });
});
