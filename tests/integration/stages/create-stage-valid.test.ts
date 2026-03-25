import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createStage, listStages } from "@/lib/stages/stage-service";

const prisma = new PrismaClient();

describe("create stage valid", () => {
  beforeAll(async () => {
    await prisma.pipelineStage.deleteMany();
  });

  afterAll(async () => {
    await prisma.pipelineStage.deleteMany();
    await prisma.$disconnect();
  });

  it("creates a non-final stage and returns it", async () => {
    const stage = await createStage({
      name: "Discovery",
      position: 1,
      isFinal: false,
    });

    expect(stage.name).toBe("Discovery");
    expect(stage.position).toBe(1);
    expect(stage.isFinal).toBe(false);
    expect(stage.finalType).toBeNull();
  });

  it("creates a final stage with finalType", async () => {
    const stage = await createStage({
      name: "Closed Won",
      position: 2,
      isFinal: true,
      finalType: "won",
    });

    expect(stage.isFinal).toBe(true);
    expect(stage.finalType).toBe("won");
  });

  it("created stages appear in list", async () => {
    const stages = await listStages();
    const names = stages.map((s) => s.name);
    expect(names).toContain("Discovery");
    expect(names).toContain("Closed Won");
  });
});
