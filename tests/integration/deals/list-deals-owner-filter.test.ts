import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { listDeals } from "@/lib/deals/deal-service";

const prisma = new PrismaClient();

let ownerAId: string;
let ownerBId: string;

describe("list deals owner filter", () => {
  beforeAll(async () => {
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();

    const userA = await prisma.user.create({
      data: { clerkUserId: "clerk_owner_a", email: "owner-a@test.com", name: "Owner A" },
    });
    ownerAId = userA.id;

    const userB = await prisma.user.create({
      data: { clerkUserId: "clerk_owner_b", email: "owner-b@test.com", name: "Owner B" },
    });
    ownerBId = userB.id;

    const stage = await prisma.pipelineStage.create({
      data: { name: "Active", position: 1, isFinal: false },
    });

    await prisma.deal.createMany({
      data: [
        { companyName: "Deal A1", stageId: stage.id, ownerId: ownerAId, status: "active" },
        { companyName: "Deal A2", stageId: stage.id, ownerId: ownerAId, status: "active" },
        { companyName: "Deal B1", stageId: stage.id, ownerId: ownerBId, status: "active" },
      ],
    });
  });

  afterAll(async () => {
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it("returns only deals belonging to the specified owner", async () => {
    const dealsA = await listDeals(ownerAId);
    expect(dealsA).toHaveLength(2);
    expect(dealsA.every((d) => d.ownerId === ownerAId)).toBe(true);

    const dealsB = await listDeals(ownerBId);
    expect(dealsB).toHaveLength(1);
    expect(dealsB[0].ownerId).toBe(ownerBId);
    expect(dealsB[0].companyName).toBe("Deal B1");
  });
});
