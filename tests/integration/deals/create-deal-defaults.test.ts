import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createDeal } from "@/lib/deals/deal-service";

const prisma = new PrismaClient();

let testOwnerId: string;
let testStageId: string;

describe("create deal defaults", () => {
  beforeAll(async () => {
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: { clerkUserId: "clerk_defaults", email: "defaults@test.com", name: "Defaults User" },
    });
    testOwnerId = user.id;

    const stage = await prisma.pipelineStage.create({
      data: { name: "Initial", position: 1, isFinal: false },
    });
    testStageId = stage.id;
  });

  afterAll(async () => {
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it("creates a deal with default values when optional fields are omitted", async () => {
    const deal = await createDeal(
      { companyName: "Minimal Corp", stageId: testStageId },
      testOwnerId,
    );

    expect(deal.icp).toBe(false);
    expect(deal.contactName).toBeNull();
    expect(deal.contactDetails).toBeNull();
    expect(deal.source).toBeNull();
    expect(deal.experiment).toBeNull();
    expect(deal.notes).toBeNull();
    expect(deal.nextAction).toBeNull();
    expect(deal.lastTouchAt).toBeNull();
    expect(deal.status).toBe("active");
  });
});
