import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { listStages, createStage, deleteStage } from "@/lib/stages/stage-service";
import { createDeal, listDeals, getDeal } from "@/lib/deals/deal-service";
import { createActivity, listActivities } from "@/lib/activities/activity-service";
import { listStageHistory } from "@/lib/history/history-service";

const prisma = new PrismaClient();

let testOwnerId: string;
let testStageId: string;
let testDealId: string;

describe("full consistency check across all endpoints", () => {
  beforeAll(async () => {
    await prisma.activity.deleteMany();
    await prisma.dealStageHistory.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: { clerkUserId: "clerk_consistency", email: "consistency@test.com", name: "Consistency User" },
    });
    testOwnerId = user.id;

    const stage = await createStage({ name: "Consistency Stage", position: 1, isFinal: false });
    testStageId = stage.id;

    const deal = await createDeal({ companyName: "Consistency Corp", stageId: testStageId }, testOwnerId);
    testDealId = deal.id;
  });

  afterAll(async () => {
    await prisma.activity.deleteMany();
    await prisma.dealStageHistory.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it("listStages returns array (wraps as { stages })", async () => {
    const stages = await listStages();
    expect(Array.isArray(stages)).toBe(true);
    expect(stages.length).toBeGreaterThanOrEqual(1);
    expect(stages[0]).toHaveProperty("id");
    expect(stages[0]).toHaveProperty("name");
  });

  it("listDeals returns array scoped by owner (wraps as { deals })", async () => {
    const deals = await listDeals(testOwnerId);
    expect(Array.isArray(deals)).toBe(true);
    expect(deals.length).toBeGreaterThanOrEqual(1);
  });

  it("listDeals returns empty array for user with no deals (BR-004)", async () => {
    const otherUser = await prisma.user.create({
      data: { clerkUserId: "clerk_empty_deals", email: "empty-deals@test.com", name: "Empty Deals User" },
    });

    const deals = await listDeals(otherUser.id);
    expect(Array.isArray(deals)).toBe(true);
    expect(deals).toHaveLength(0);
  });

  it("getDeal returns object with id and companyName (wraps as { deal })", async () => {
    const deal = await getDeal(testDealId, testOwnerId);
    expect(deal).toHaveProperty("id");
    expect(deal).toHaveProperty("companyName");
    expect(deal.id).toBe(testDealId);
  });

  it("createActivity returns object (wraps as { activity }) with 201", async () => {
    const activity = await createActivity(testDealId, { type: "note", content: "consistency test" }, testOwnerId);
    expect(activity).toHaveProperty("id");
    expect(activity).toHaveProperty("type");
    expect(activity.type).toBe("note");
  });

  it("listActivities returns array (wraps as { activities })", async () => {
    const activities = await listActivities(testDealId, testOwnerId);
    expect(Array.isArray(activities)).toBe(true);
    expect(activities.length).toBeGreaterThanOrEqual(1);
  });

  it("listStageHistory returns array (wraps as { history })", async () => {
    const history = await listStageHistory(testDealId, testOwnerId);
    expect(Array.isArray(history)).toBe(true);
  });

  it("deleteStage returns void (handler returns 204 no body)", async () => {
    const tempStage = await createStage({ name: "Temp Delete Stage", position: 99, isFinal: false });
    const result = await deleteStage(tempStage.id);
    expect(result).toBeUndefined();
  });
});
