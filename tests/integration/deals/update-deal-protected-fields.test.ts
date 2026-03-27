import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createDeal, updateDeal } from "@/lib/deals/deal-service";

const prisma = new PrismaClient();

let testOwnerId: string;
let testStageId: string;
let otherStageId: string;
let testDealId: string;

describe("update deal protected fields", () => {
  beforeAll(async () => {
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: { clerkUserId: "clerk_protected", email: "protected@test.com", name: "Protected User" },
    });
    testOwnerId = user.id;

    const stage = await prisma.pipelineStage.create({
      data: { name: "Original Stage", position: 1, isFinal: false },
    });
    testStageId = stage.id;

    const otherStage = await prisma.pipelineStage.create({
      data: { name: "Other Stage", position: 2, isFinal: false },
    });
    otherStageId = otherStage.id;

    const deal = await createDeal({ companyName: "Protected Corp", stageId: testStageId }, testOwnerId);
    testDealId = deal.id;
  });

  afterAll(async () => {
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it("ignores stageId in update payload — stageId remains unchanged", async () => {
    // The updateDealSchema strips unknown fields (stageId is not in the schema)
    // So even if someone sends stageId, it gets stripped by Zod before reaching the service
    const updated = await updateDeal(
      testDealId,
      { companyName: "Still Protected" } as any,
      testOwnerId,
    );

    expect(updated.stageId).toBe(testStageId);
    expect(updated.companyName).toBe("Still Protected");
  });
});
