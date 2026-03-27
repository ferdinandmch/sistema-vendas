import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createDeal } from "@/lib/deals/deal-service";

const prisma = new PrismaClient();

let testOwnerId: string;
let testStageId: string;

describe("create deal contract", () => {
  beforeAll(async () => {
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: { clerkUserId: "clerk_contract_create", email: "contract@test.com", name: "Contract User" },
    });
    testOwnerId = user.id;

    const stage = await prisma.pipelineStage.create({
      data: { name: "Cold", position: 1, isFinal: false },
    });
    testStageId = stage.id;
  });

  afterAll(async () => {
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it("returns a deal with the correct shape including stage embed", async () => {
    const deal = await createDeal(
      { companyName: "Acme Corp", stageId: testStageId, icp: true },
      testOwnerId,
    );

    expect(deal).toHaveProperty("id");
    expect(deal).toHaveProperty("companyName");
    expect(deal).toHaveProperty("stageId");
    expect(deal).toHaveProperty("status");
    expect(deal).toHaveProperty("stageUpdatedAt");
    expect(deal).toHaveProperty("ownerId");
    expect(deal).toHaveProperty("createdAt");
    expect(deal).toHaveProperty("updatedAt");
    expect(deal).toHaveProperty("stage");

    expect(typeof deal.id).toBe("string");
    expect(typeof deal.companyName).toBe("string");
    expect(typeof deal.stageId).toBe("string");
    expect(typeof deal.status).toBe("string");
    expect(deal.stageUpdatedAt).toBeInstanceOf(Date);
    expect(typeof deal.ownerId).toBe("string");

    expect(deal.stage).toHaveProperty("id");
    expect(deal.stage).toHaveProperty("name");
    expect(deal.stage).toHaveProperty("position");
    expect(typeof deal.stage.id).toBe("string");
    expect(typeof deal.stage.name).toBe("string");
    expect(typeof deal.stage.position).toBe("number");
  });
});
