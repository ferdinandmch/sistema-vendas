import { describe, expect, it } from "vitest";

import { parseAndValidate } from "@/lib/validation/request-helpers";
import { AppError } from "@/lib/validation/api-error";
import { createDealSchema, moveDealSchema } from "@/lib/validation/deals";
import { createActivitySchema } from "@/lib/validation/activities";

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

async function captureValidationError(body: unknown, schema: Parameters<typeof parseAndValidate>[1]): Promise<AppError> {
  try {
    await parseAndValidate(jsonRequest(body), schema);
    throw new Error("Should have thrown");
  } catch (error) {
    if (error instanceof AppError) return error;
    throw error;
  }
}

describe("zod error format consistency cross-endpoint", () => {
  it("all schemas return INVALID_REQUEST with 'Validation failed' and details array", async () => {
    const dealError = await captureValidationError({}, createDealSchema);
    const moveError = await captureValidationError({}, moveDealSchema);
    const activityError = await captureValidationError({}, createActivitySchema);

    for (const error of [dealError, moveError, activityError]) {
      expect(error.code).toBe("INVALID_REQUEST");
      expect(error.message).toBe("Validation failed");
      expect(error.status).toBe(400);
      expect(Array.isArray(error.details)).toBe(true);
      expect(error.details!.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("all details follow { field, message } shape", async () => {
    const dealError = await captureValidationError({}, createDealSchema);
    const moveError = await captureValidationError({}, moveDealSchema);
    const activityError = await captureValidationError({}, createActivitySchema);

    for (const error of [dealError, moveError, activityError]) {
      for (const detail of error.details!) {
        expect(typeof detail.field).toBe("string");
        expect(typeof detail.message).toBe("string");
        expect(detail.message.length).toBeGreaterThan(0);
      }
    }
  });

  it("deal schema reports companyName and stageId as required", async () => {
    const error = await captureValidationError({}, createDealSchema);
    const fields = error.details!.map((d) => d.field);
    expect(fields).toContain("companyName");
    expect(fields).toContain("stageId");
  });

  it("move schema reports toStageId as required", async () => {
    const error = await captureValidationError({}, moveDealSchema);
    const fields = error.details!.map((d) => d.field);
    expect(fields).toContain("toStageId");
  });

  it("activity schema reports type as required", async () => {
    const error = await captureValidationError({}, createActivitySchema);
    const fields = error.details!.map((d) => d.field);
    expect(fields).toContain("type");
  });
});
