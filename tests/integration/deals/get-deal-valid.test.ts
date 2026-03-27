import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createDeal, getDeal } from "@/lib/deals/deal-service";

const prisma = new PrismaClient();

let testOwnerId: string;
let testStageId: string;
let testDealId: string;

describe("get deal valid", () => {
  beforeAll(async () => {
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: { clerkUserId: "clerk_get_valid", email: "get-valid@test.com", name: "Get Valid User" },
    });
    testOwnerId = user.id;

    const stage = await prisma.pipelineStage.create({
      data: { name: "Hot", position: 1, isFinal: false },
    });
    testStageId = stage.id;

    const deal = await createDeal(
      { companyName: "Valid Corp", stageId: testStageId, icp: true, contactName: "Jane" },
      testOwnerId,
    );
    testDealId = deal.id;
  });

  afterAll(async () => {
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it("returns all fields of the deal including stage embed", async () => {
    const deal = await getDeal(testDealId, testOwnerId);

    expect(deal.id).toBe(testDealId);
    expect(deal.companyName).toBe("Valid Corp");
    expect(deal.ownerId).toBe(testOwnerId);
    expect(deal.stageId).toBe(testStageId);
    expect(deal.status).toBe("active");
    expect(deal.icp).toBe(true);
    expect(deal.contactName).toBe("Jane");
    expect(deal.stage.id).toBe(testStageId);
    expect(deal.stage.name).toBe("Hot");
    expect(deal.stage.position).toBe(1);
  });
});
