import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createDeal } from "@/lib/deals/deal-service";

const prisma = new PrismaClient();

let testOwnerId: string;
let testStageId: string;

describe("create deal valid", () => {
  beforeAll(async () => {
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: { clerkUserId: "clerk_valid_create", email: "valid@test.com", name: "Valid User" },
    });
    testOwnerId = user.id;

    const stage = await prisma.pipelineStage.create({
      data: { name: "Prospecting", position: 1, isFinal: false },
    });
    testStageId = stage.id;
  });

  afterAll(async () => {
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it("creates a deal with status=active, stageUpdatedAt set, correct ownerId, lastTouchAt=null, and stage embed", async () => {
    const deal = await createDeal(
      { companyName: "Acme Corp", stageId: testStageId, icp: true, contactName: "John" },
      testOwnerId,
    );

    expect(deal.status).toBe("active");
    expect(deal.stageUpdatedAt).toBeInstanceOf(Date);
    expect(deal.ownerId).toBe(testOwnerId);
    expect(deal.lastTouchAt).toBeNull();
    expect(deal.companyName).toBe("Acme Corp");
    expect(deal.icp).toBe(true);
    expect(deal.contactName).toBe("John");
    expect(deal.stage).toBeDefined();
    expect(deal.stage.id).toBe(testStageId);
    expect(deal.stage.name).toBe("Prospecting");
    expect(deal.stage.position).toBe(1);
  });
});
