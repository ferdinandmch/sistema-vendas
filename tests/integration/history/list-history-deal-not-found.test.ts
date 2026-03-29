import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { listStageHistory } from "@/lib/history/history-service";
import { AppError } from "@/lib/validation/api-error";

const prisma = new PrismaClient();

let testOwnerId: string;

describe("list history deal not found", () => {
  beforeAll(async () => {
    await prisma.activity.deleteMany();
    await prisma.dealStageHistory.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: { clerkUserId: "clerk_hist_notfound", email: "hist-notfound@test.com", name: "Hist Not Found User" },
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

  it("throws DEAL_NOT_FOUND when querying history of nonexistent deal", async () => {
    try {
      await listStageHistory("nonexistent-deal-id", testOwnerId);
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe("DEAL_NOT_FOUND");
      expect((error as AppError).status).toBe(404);
    }
  });
});
