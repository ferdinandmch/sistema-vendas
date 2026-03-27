import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { getDeal } from "@/lib/deals/deal-service";
import { AppError } from "@/lib/validation/api-error";

const prisma = new PrismaClient();

let testOwnerId: string;

describe("get deal not found", () => {
  beforeAll(async () => {
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: { clerkUserId: "clerk_get_notfound", email: "notfound@test.com", name: "NotFound User" },
    });
    testOwnerId = user.id;
  });

  afterAll(async () => {
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it("throws DEAL_NOT_FOUND for non-existent deal id", async () => {
    try {
      await getDeal("nonexistent-deal-id", testOwnerId);
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe("DEAL_NOT_FOUND");
      expect((error as AppError).status).toBe(404);
    }
  });
});
