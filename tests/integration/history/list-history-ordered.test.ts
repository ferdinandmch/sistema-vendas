import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createDeal, moveDeal } from "@/lib/deals/deal-service";
import { listStageHistory } from "@/lib/history/history-service";

const prisma = new PrismaClient();

let testOwnerId: string;
let testDealId: string;
let stageAId: string;
let stageBId: string;
let stageCId: string;

describe("list history ordered", () => {
  beforeAll(async () => {
    await prisma.activity.deleteMany();
    await prisma.dealStageHistory.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: { clerkUserId: "clerk_history_ordered", email: "history-ordered@test.com", name: "History Ordered User" },
    });
    testOwnerId = user.id;

    const stageA = await prisma.pipelineStage.create({
      data: { name: "Ordered A", position: 1, isFinal: false },
    });
    stageAId = stageA.id;

    const stageB = await prisma.pipelineStage.create({
      data: { name: "Ordered B", position: 2, isFinal: false },
    });
    stageBId = stageB.id;

    const stageC = await prisma.pipelineStage.create({
      data: { name: "Ordered C", position: 3, isFinal: false },
    });
    stageCId = stageC.id;

    const deal = await createDeal({ companyName: "History Ordered Corp", stageId: stageAId }, testOwnerId);
    testDealId = deal.id;

    await moveDeal(testDealId, stageBId, testOwnerId);
    await moveDeal(testDealId, stageCId, testOwnerId);
  });

  afterAll(async () => {
    await prisma.activity.deleteMany();
    await prisma.dealStageHistory.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it("returns 2 history records ordered by changedAt ASC with correct from/to stages", async () => {
    const history = await listStageHistory(testDealId, testOwnerId);

    expect(history).toHaveLength(2);

    // First move: A → B
    expect(history[0].fromStageId).toBe(stageAId);
    expect(history[0].toStageId).toBe(stageBId);
    expect(history[0].fromStage.name).toBe("Ordered A");
    expect(history[0].toStage.name).toBe("Ordered B");

    // Second move: B → C
    expect(history[1].fromStageId).toBe(stageBId);
    expect(history[1].toStageId).toBe(stageCId);
    expect(history[1].fromStage.name).toBe("Ordered B");
    expect(history[1].toStage.name).toBe("Ordered C");

    // ASC ordering
    expect(history[0].changedAt.getTime()).toBeLessThanOrEqual(
      history[1].changedAt.getTime(),
    );
  });
});
