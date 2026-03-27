import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createDeal, getDeal, updateDeal } from "@/lib/deals/deal-service";
import { AppError } from "@/lib/validation/api-error";

const prisma = new PrismaClient();

let testOwnerId: string;
let testStageId: string;
let testDealId: string;

describe("update deal contract", () => {
  beforeAll(async () => {
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: { clerkUserId: "clerk_update_contract", email: "update-contract@test.com", name: "Update User" },
    });
    testOwnerId = user.id;

    const stage = await prisma.pipelineStage.create({
      data: { name: "Closing", position: 1, isFinal: false },
    });
    testStageId = stage.id;

    const deal = await createDeal({ companyName: "Original Corp", stageId: testStageId }, testOwnerId);
    testDealId = deal.id;
  });

  afterAll(async () => {
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it("returns an updated deal with correct shape including stage embed", async () => {
    const deal = await updateDeal(testDealId, { companyName: "Updated Corp" }, testOwnerId);

    expect(deal).toHaveProperty("id");
    expect(deal).toHaveProperty("companyName");
    expect(deal).toHaveProperty("stage");
    expect(deal.companyName).toBe("Updated Corp");
    expect(deal.stage).toHaveProperty("id");
    expect(deal.stage).toHaveProperty("name");
    expect(deal.stage).toHaveProperty("position");
  });

  it("throws DEAL_NOT_FOUND for non-existent deal", async () => {
    try {
      await updateDeal("nonexistent-id", { companyName: "Ghost" }, testOwnerId);
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe("DEAL_NOT_FOUND");
    }
  });
});
