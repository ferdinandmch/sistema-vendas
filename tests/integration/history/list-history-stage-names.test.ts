import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createDeal, moveDeal } from "@/lib/deals/deal-service";
import { listStageHistory } from "@/lib/history/history-service";

const prisma = new PrismaClient();

let testOwnerId: string;
let testDealId: string;

describe("list history stage names", () => {
  beforeAll(async () => {
    await prisma.activity.deleteMany();
    await prisma.dealStageHistory.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: { clerkUserId: "clerk_history_names", email: "history-names@test.com", name: "History Names User" },
    });
    testOwnerId = user.id;

    const stageA = await prisma.pipelineStage.create({
      data: { name: "Prospecting", position: 1, isFinal: false },
    });
    const stageB = await prisma.pipelineStage.create({
      data: { name: "Proposal", position: 2, isFinal: false },
    });

    const deal = await createDeal({ companyName: "History Names Corp", stageId: stageA.id }, testOwnerId);
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

  it("each record includes fromStage.name and toStage.name as non-empty strings", async () => {
    const history = await listStageHistory(testDealId, testOwnerId);

    expect(history).toHaveLength(1);

    const entry = history[0];
    expect(typeof entry.fromStage.name).toBe("string");
    expect(entry.fromStage.name.length).toBeGreaterThan(0);
    expect(entry.fromStage.name).toBe("Prospecting");

    expect(typeof entry.toStage.name).toBe("string");
    expect(entry.toStage.name.length).toBeGreaterThan(0);
    expect(entry.toStage.name).toBe("Proposal");
  });
});
