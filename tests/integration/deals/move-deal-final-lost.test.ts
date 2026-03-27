import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createDeal, moveDeal } from "@/lib/deals/deal-service";

const prisma = new PrismaClient();

let testOwnerId: string;
let activeStageId: string;
let lostStageId: string;
let dealId: string;

describe("move deal final lost", () => {
  beforeAll(async () => {
    await prisma.dealStageHistory.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: { clerkUserId: "clerk_final_lost", email: "final-lost@test.com", name: "Final Lost User" },
    });
    testOwnerId = user.id;

    const activeStage = await prisma.pipelineStage.create({
      data: { name: "Proposal", position: 1, isFinal: false },
    });
    activeStageId = activeStage.id;

    const lostStage = await prisma.pipelineStage.create({
      data: { name: "Closed Lost", position: 2, isFinal: true, finalType: "lost" },
    });
    lostStageId = lostStage.id;

    const deal = await createDeal({ companyName: "Lost Corp", stageId: activeStageId }, testOwnerId);
    dealId = deal.id;
  });

  afterAll(async () => {
    await prisma.dealStageHistory.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it("moves deal to final stage with finalType=lost, sets status to lost, creates history", async () => {
    const deal = await moveDeal(dealId, lostStageId, testOwnerId);

    expect(deal.stageId).toBe(lostStageId);
    expect(deal.status).toBe("lost");
    expect(deal.stage.id).toBe(lostStageId);
    expect(deal.stage.name).toBe("Closed Lost");

    const history = await prisma.dealStageHistory.findMany({ where: { dealId } });
    expect(history).toHaveLength(1);
    expect(history[0].fromStageId).toBe(activeStageId);
    expect(history[0].toStageId).toBe(lostStageId);
  });
});
