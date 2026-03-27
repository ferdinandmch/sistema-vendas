import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { listDeals } from "@/lib/deals/deal-service";

const prisma = new PrismaClient();

let testOwnerId: string;

describe("list deals empty", () => {
  beforeAll(async () => {
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: { clerkUserId: "clerk_empty_list", email: "empty@test.com", name: "Empty User" },
    });
    testOwnerId = user.id;
  });

  afterAll(async () => {
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it("returns an empty array when the owner has no deals", async () => {
    const deals = await listDeals(testOwnerId);
    expect(Array.isArray(deals)).toBe(true);
    expect(deals).toHaveLength(0);
  });
});
