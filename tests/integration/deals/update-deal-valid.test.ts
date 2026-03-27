import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createDeal, updateDeal } from "@/lib/deals/deal-service";

const prisma = new PrismaClient();

let testOwnerId: string;
let testStageId: string;
let testDealId: string;

describe("update deal valid", () => {
  beforeAll(async () => {
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: { clerkUserId: "clerk_update_valid", email: "update-valid@test.com", name: "Update Valid" },
    });
    testOwnerId = user.id;

    const stage = await prisma.pipelineStage.create({
      data: { name: "Demo", position: 1, isFinal: false },
    });
    testStageId = stage.id;

    const deal = await createDeal({ companyName: "Before Corp", stageId: testStageId }, testOwnerId);
    testDealId = deal.id;
  });

  afterAll(async () => {
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it("updates companyName and persists the change", async () => {
    const updated = await updateDeal(testDealId, { companyName: "After Corp" }, testOwnerId);

    expect(updated.companyName).toBe("After Corp");
    expect(updated.id).toBe(testDealId);
    expect(updated.stageId).toBe(testStageId);

    const persisted = await prisma.deal.findUnique({ where: { id: testDealId } });
    expect(persisted?.companyName).toBe("After Corp");
  });
});
