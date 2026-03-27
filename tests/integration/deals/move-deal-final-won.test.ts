import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createDeal, moveDeal } from "@/lib/deals/deal-service";

const prisma = new PrismaClient();

let testOwnerId: string;
let activeStageId: string;
let wonStageId: string;
let dealId: string;

describe("move deal final won", () => {
  beforeAll(async () => {
    await prisma.dealStageHistory.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: { clerkUserId: "clerk_final_won", email: "final-won@test.com", name: "Final Won User" },
    });
    testOwnerId = user.id;

    const activeStage = await prisma.pipelineStage.create({
      data: { name: "Negotiation", position: 1, isFinal: false },
    });
    activeStageId = activeStage.id;

    const wonStage = await prisma.pipelineStage.create({
      data: { name: "Closed Won", position: 2, isFinal: true, finalType: "won" },
    });
    wonStageId = wonStage.id;

    const deal = await createDeal({ companyName: "Won Corp", stageId: activeStageId }, testOwnerId);
    dealId = deal.id;
  });

  afterAll(async () => {
    await prisma.dealStageHistory.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it("moves deal to final stage with finalType=won, sets status to won, creates history", async () => {
    const deal = await moveDeal(dealId, wonStageId, testOwnerId);

    expect(deal.stageId).toBe(wonStageId);
    expect(deal.status).toBe("won");
    expect(deal.stage.id).toBe(wonStageId);
    expect(deal.stage.name).toBe("Closed Won");

    const history = await prisma.dealStageHistory.findMany({ where: { dealId } });
    expect(history).toHaveLength(1);
    expect(history[0].fromStageId).toBe(activeStageId);
    expect(history[0].toStageId).toBe(wonStageId);
  });
});
