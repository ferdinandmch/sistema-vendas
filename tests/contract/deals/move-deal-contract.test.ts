import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createDeal, moveDeal } from "@/lib/deals/deal-service";

const prisma = new PrismaClient();

let testOwnerId: string;
let stageAId: string;
let stageBId: string;
let dealId: string;

describe("move deal contract", () => {
  beforeAll(async () => {
    await prisma.dealStageHistory.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: { clerkUserId: "clerk_move_contract", email: "move-contract@test.com", name: "Move Contract User" },
    });
    testOwnerId = user.id;

    const stageA = await prisma.pipelineStage.create({
      data: { name: "Stage A", position: 1, isFinal: false },
    });
    stageAId = stageA.id;

    const stageB = await prisma.pipelineStage.create({
      data: { name: "Stage B", position: 2, isFinal: false },
    });
    stageBId = stageB.id;

    const deal = await createDeal({ companyName: "Contract Corp", stageId: stageAId }, testOwnerId);
    dealId = deal.id;
  });

  afterAll(async () => {
    await prisma.dealStageHistory.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it("returns a deal with the correct shape including stage embed after move", async () => {
    const deal = await moveDeal(dealId, stageBId, testOwnerId);

    expect(deal).toHaveProperty("id");
    expect(deal).toHaveProperty("companyName");
    expect(deal).toHaveProperty("stageId");
    expect(deal).toHaveProperty("status");
    expect(deal).toHaveProperty("stageUpdatedAt");
    expect(deal).toHaveProperty("ownerId");
    expect(deal).toHaveProperty("createdAt");
    expect(deal).toHaveProperty("updatedAt");
    expect(deal).toHaveProperty("stage");

    expect(deal.stageId).toBe(stageBId);
    expect(deal.stageUpdatedAt).toBeInstanceOf(Date);

    expect(deal.stage).toHaveProperty("id");
    expect(deal.stage).toHaveProperty("name");
    expect(deal.stage).toHaveProperty("position");
    expect(typeof deal.stage.id).toBe("string");
    expect(typeof deal.stage.name).toBe("string");
    expect(typeof deal.stage.position).toBe("number");
  });
});
