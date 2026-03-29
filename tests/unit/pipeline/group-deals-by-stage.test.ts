import { describe, expect, it } from "vitest";

import { groupDealsByStage } from "@/lib/pipeline/group-deals";
import type { Deal } from "@/lib/pipeline/api";

const makeStage = (id: string, position: number) => ({
  id,
  name: `Stage ${id}`,
  position,
});

const makeDeal = (id: string, stageId: string): Deal => ({
  id,
  companyName: `Company ${id}`,
  contactName: null,
  stageId,
  status: "active",
  nextAction: null,
  ownerId: "owner-1",
  createdAt: new Date().toISOString(),
  stageUpdatedAt: new Date().toISOString(),
  stage: makeStage(stageId, 1),
});

describe("groupDealsByStage", () => {
  it("groups deals correctly by stageId", () => {
    const deals = [
      makeDeal("d1", "stage-a"),
      makeDeal("d2", "stage-a"),
      makeDeal("d3", "stage-b"),
    ];

    const result = groupDealsByStage(deals);

    expect(result["stage-a"]).toHaveLength(2);
    expect(result["stage-b"]).toHaveLength(1);
    expect(result["stage-a"].map((d) => d.id)).toEqual(["d1", "d2"]);
  });

  it("deal with unknown stageId appears in result but is absent when board iterates known stages (BR-005)", () => {
    const deals = [
      makeDeal("d1", "stage-known"),
      makeDeal("d2", "stage-unknown"),
    ];
    const knownStages = ["stage-known"];

    const result = groupDealsByStage(deals);

    // The grouping record has the orphan key, but when the board iterates
    // known stages only, it never accesses the orphan key
    const visibleDeals = knownStages.flatMap((id) => result[id] ?? []);
    expect(visibleDeals).toHaveLength(1);
    expect(visibleDeals[0].id).toBe("d1");
  });

  it("returns empty object for empty deals array", () => {
    expect(groupDealsByStage([])).toEqual({});
  });

  it("groups single deal into its stage bucket", () => {
    const deals = [makeDeal("d1", "stage-a")];
    const result = groupDealsByStage(deals);

    expect(result["stage-a"]).toHaveLength(1);
    expect(result["stage-a"][0].id).toBe("d1");
  });
});
