import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createDeal, moveDeal } from "@/lib/deals/deal-service";
import { listStageHistory } from "@/lib/history/history-service";

const prisma = new PrismaClient();

let testOwnerId: string;
let testDealId: string;

describe("list history contract", () => {
  beforeAll(async () => {
    await prisma.activity.deleteMany();
    await prisma.dealStageHistory.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: { clerkUserId: "clerk_history_contract", email: "history-contract@test.com", name: "History Contract User" },
    });
    testOwnerId = user.id;

    const stageA = await prisma.pipelineStage.create({
      data: { name: "Contract Stage A", position: 1, isFinal: false },
    });
    const stageB = await prisma.pipelineStage.create({
      data: { name: "Contract Stage B", position: 2, isFinal: false },
    });

    const deal = await createDeal({ companyName: "History Contract Corp", stageId: stageA.id }, testOwnerId);
    testDealId = deal.id;

    await moveDeal(testDealId, stageB.id, testOwnerId);
  });

  afterAll(async () => {
    await prisma.activity.deleteMany();
    await prisma.dealStageHistory.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it("returns history with correct shape: { id, dealId, fromStageId, toStageId, changedAt, fromStage, toStage }", async () => {
    const history = await listStageHistory(testDealId, testOwnerId);

    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThanOrEqual(1);

    const entry = history[0];
    expect(entry).toHaveProperty("id");
    expect(entry).toHaveProperty("dealId");
    expect(entry).toHaveProperty("fromStageId");
    expect(entry).toHaveProperty("toStageId");
    expect(entry).toHaveProperty("changedAt");
    expect(entry).toHaveProperty("fromStage");
    expect(entry).toHaveProperty("toStage");

    expect(typeof entry.id).toBe("string");
    expect(typeof entry.dealId).toBe("string");
    expect(typeof entry.fromStageId).toBe("string");
    expect(typeof entry.toStageId).toBe("string");
    expect(entry.changedAt).toBeInstanceOf(Date);

    expect(entry.fromStage).toHaveProperty("id");
    expect(entry.fromStage).toHaveProperty("name");
    expect(typeof entry.fromStage.id).toBe("string");
    expect(typeof entry.fromStage.name).toBe("string");

    expect(entry.toStage).toHaveProperty("id");
    expect(entry.toStage).toHaveProperty("name");
    expect(typeof entry.toStage.id).toBe("string");
    expect(typeof entry.toStage.name).toBe("string");
  });
});
