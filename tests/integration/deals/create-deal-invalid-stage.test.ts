import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createDeal } from "@/lib/deals/deal-service";
import { AppError } from "@/lib/validation/api-error";

const prisma = new PrismaClient();

let testOwnerId: string;

describe("create deal invalid stage", () => {
  beforeAll(async () => {
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: { clerkUserId: "clerk_invalid_stage", email: "invalid-stage@test.com", name: "Stage User" },
    });
    testOwnerId = user.id;
  });

  afterAll(async () => {
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it("throws STAGE_NOT_FOUND when stageId does not exist", async () => {
    await expect(
      createDeal(
        { companyName: "Test Corp", stageId: "nonexistent-stage-id" },
        testOwnerId,
      ),
    ).rejects.toThrow(AppError);

    try {
      await createDeal(
        { companyName: "Test Corp", stageId: "nonexistent-stage-id" },
        testOwnerId,
      );
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe("STAGE_NOT_FOUND");
      expect((error as AppError).status).toBe(400);
    }
  });
});
