import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createStage } from "@/lib/stages/stage-service";

const prisma = new PrismaClient();

describe("create stage contract", () => {
  beforeAll(async () => {
    await prisma.pipelineStage.deleteMany();
  });

  afterAll(async () => {
    await prisma.pipelineStage.deleteMany();
    await prisma.$disconnect();
  });

  it("returns the created stage with correct shape", async () => {
    const stage = await createStage({
      name: "Contract Test Stage",
      position: 100,
      isFinal: false,
    });

    expect(stage).toHaveProperty("id");
    expect(stage).toHaveProperty("name", "Contract Test Stage");
    expect(stage).toHaveProperty("position", 100);
    expect(stage).toHaveProperty("isFinal", false);
    expect(stage).toHaveProperty("finalType", null);
    expect(stage).toHaveProperty("createdAt");
    expect(stage).toHaveProperty("updatedAt");
    expect(typeof stage.id).toBe("string");
    expect(stage.createdAt).toBeInstanceOf(Date);
    expect(stage.updatedAt).toBeInstanceOf(Date);
  });
});
