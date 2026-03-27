import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createDeal, moveDeal } from "@/lib/deals/deal-service";

const prisma = new PrismaClient();

let testOwnerId: string;
let stageAId: string;
let stageBId: string;
let dealId: string;
let originalStageUpdatedAt: Date;

describe("move deal valid", () => {
  beforeAll(async () => {
    await prisma.dealStageHistory.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: { clerkUserId: "clerk_move_valid", email: "move-valid@test.com", name: "Move Valid User" },
    });
    testOwnerId = user.id;

    const stageA = await prisma.pipelineStage.create({
      data: { name: "Initial", position: 1, isFinal: false },
    });
    stageAId = stageA.id;

    const stageB = await prisma.pipelineStage.create({
      data: { name: "Proposal", position: 2, isFinal: false },
    });
    stageBId = stageB.id;

    const deal = await createDeal({ companyName: "Move Corp", stageId: stageAId }, testOwnerId);
    dealId = deal.id;
    originalStageUpdatedAt = deal.stageUpdatedAt;
  });

  afterAll(async () => {
    await prisma.dealStageHistory.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it("moves deal to new stage, updates stageUpdatedAt, keeps status active, creates history", async () => {
    const deal = await moveDeal(dealId, stageBId, testOwnerId);

    expect(deal.stageId).toBe(stageBId);
    expect(deal.stageUpdatedAt.getTime()).toBeGreaterThanOrEqual(originalStageUpdatedAt.getTime());
    expect(deal.status).toBe("active");
    expect(deal.stage.id).toBe(stageBId);
    expect(deal.stage.name).toBe("Proposal");

    const history = await prisma.dealStageHistory.findMany({
      where: { dealId },
    });

    expect(history).toHaveLength(1);
    expect(history[0].fromStageId).toBe(stageAId);
    expect(history[0].toStageId).toBe(stageBId);
    expect(history[0].changedAt).toBeInstanceOf(Date);
  });
});
