import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { listStageHistory } from "@/lib/history/history-service";

const prisma = new PrismaClient();

let testOwnerId: string;
let testDealId: string;

describe("list history empty", () => {
  beforeAll(async () => {
    await prisma.activity.deleteMany();
    await prisma.dealStageHistory.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: { clerkUserId: "clerk_history_empty", email: "history-empty@test.com", name: "History Empty User" },
    });
    testOwnerId = user.id;

    const stage = await prisma.pipelineStage.create({
      data: { name: "Empty Stage", position: 1, isFinal: false },
    });

    const deal = await prisma.deal.create({
      data: { companyName: "History Empty Corp", stageId: stage.id, ownerId: testOwnerId },
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

  it("returns empty array for deal with no stage movements", async () => {
    const history = await listStageHistory(testDealId, testOwnerId);

    expect(Array.isArray(history)).toBe(true);
    expect(history).toHaveLength(0);
  });
});
