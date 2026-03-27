import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { listDeals } from "@/lib/deals/deal-service";

const prisma = new PrismaClient();

let testOwnerId: string;

describe("list deals contract", () => {
  beforeAll(async () => {
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: { clerkUserId: "clerk_list_contract", email: "list-contract@test.com", name: "List User" },
    });
    testOwnerId = user.id;

    const stage = await prisma.pipelineStage.create({
      data: { name: "Cold", position: 1, isFinal: false },
    });

    await prisma.deal.create({
      data: {
        companyName: "Acme Corp",
        stageId: stage.id,
        ownerId: testOwnerId,
        status: "active",
        icp: true,
      },
    });
  });

  afterAll(async () => {
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it("returns an array of deals with correct shape including stage embed", async () => {
    const deals = await listDeals(testOwnerId);

    expect(Array.isArray(deals)).toBe(true);
    expect(deals.length).toBeGreaterThan(0);

    const deal = deals[0];
    expect(deal).toHaveProperty("id");
    expect(deal).toHaveProperty("companyName");
    expect(deal).toHaveProperty("stageId");
    expect(deal).toHaveProperty("status");
    expect(deal).toHaveProperty("ownerId");
    expect(deal).toHaveProperty("stage");

    expect(deal.stage).toHaveProperty("id");
    expect(deal.stage).toHaveProperty("name");
    expect(deal.stage).toHaveProperty("position");
  });
});
