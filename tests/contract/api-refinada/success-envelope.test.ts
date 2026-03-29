import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createStage, listStages, updateStage, deleteStage } from "@/lib/stages/stage-service";
import { createDeal, listDeals } from "@/lib/deals/deal-service";

const prisma = new PrismaClient();

let testOwnerId: string;
let testStageId: string;

describe("success envelope contract", () => {
  beforeAll(async () => {
    await prisma.activity.deleteMany();
    await prisma.dealStageHistory.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: { clerkUserId: "clerk_envelope_test", email: "envelope@test.com", name: "Envelope User" },
    });
    testOwnerId = user.id;
  });

  afterAll(async () => {
    await prisma.activity.deleteMany();
    await prisma.dealStageHistory.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it("createStage returns object with id, name, position, isFinal (wraps as { stage })", async () => {
    const stage = await createStage({ name: "Envelope Stage", position: 1, isFinal: false });
    testStageId = stage.id;

    expect(stage).toHaveProperty("id");
    expect(stage).toHaveProperty("name");
    expect(stage).toHaveProperty("position");
    expect(stage).toHaveProperty("isFinal");
    expect(typeof stage.id).toBe("string");
  });

  it("listStages returns array (wraps as { stages })", async () => {
    const stages = await listStages();

    expect(Array.isArray(stages)).toBe(true);
    expect(stages.length).toBeGreaterThanOrEqual(1);
    expect(stages[0]).toHaveProperty("id");
    expect(stages[0]).toHaveProperty("name");
  });

  it("updateStage returns object with updated fields (wraps as { stage })", async () => {
    const stage = await updateStage(testStageId, { name: "Updated Envelope Stage" });

    expect(stage).toHaveProperty("id");
    expect(stage.name).toBe("Updated Envelope Stage");
  });

  it("createDeal returns object with id, companyName, stageId, ownerId (wraps as { deal })", async () => {
    const deal = await createDeal({ companyName: "Envelope Corp", stageId: testStageId }, testOwnerId);

    expect(deal).toHaveProperty("id");
    expect(deal).toHaveProperty("companyName");
    expect(deal).toHaveProperty("stageId");
    expect(deal).toHaveProperty("ownerId");
    expect(deal.ownerId).toBe(testOwnerId);
  });

  it("listDeals returns array scoped by owner (wraps as { deals })", async () => {
    const deals = await listDeals(testOwnerId);

    expect(Array.isArray(deals)).toBe(true);
    expect(deals.length).toBeGreaterThanOrEqual(1);
    expect(deals[0]).toHaveProperty("id");
    expect(deals[0]).toHaveProperty("companyName");
  });

  it("deleteStage returns void (handler returns 204 no body)", async () => {
    // Create a stage to delete (no deals attached)
    const stageToDelete = await createStage({ name: "Delete Me Stage", position: 99, isFinal: false });

    const result = await deleteStage(stageToDelete.id);

    expect(result).toBeUndefined();
  });
});
