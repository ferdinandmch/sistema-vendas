import { describe, expect, it } from "vitest";
import { z } from "zod";

import { parseAndValidate } from "@/lib/validation/request-helpers";
import { AppError } from "@/lib/validation/api-error";
import { createStageSchema } from "@/lib/validation/stages";

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("validation error details format", () => {
  it("invalid stage payload returns INVALID_REQUEST with details array", async () => {
    try {
      await parseAndValidate(jsonRequest({ name: "", position: -1, isFinal: "not-boolean" }), createStageSchema);
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe("INVALID_REQUEST");
      expect((error as AppError).message).toBe("Validation failed");
      expect((error as AppError).status).toBe(400);
      expect((error as AppError).details).toBeDefined();
      expect(Array.isArray((error as AppError).details)).toBe(true);
      expect((error as AppError).details!.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("each detail has field and message as strings", async () => {
    try {
      await parseAndValidate(jsonRequest({}), createStageSchema);
      expect.fail("Should have thrown");
    } catch (error) {
      const details = (error as AppError).details!;
      for (const detail of details) {
        expect(typeof detail.field).toBe("string");
        expect(typeof detail.message).toBe("string");
        expect(detail.message.length).toBeGreaterThan(0);
      }
    }
  });

  it("missing required fields are reported with correct field names", async () => {
    try {
      await parseAndValidate(jsonRequest({}), createStageSchema);
      expect.fail("Should have thrown");
    } catch (error) {
      const fields = (error as AppError).details!.map((d) => d.field);
      expect(fields).toContain("name");
      expect(fields).toContain("position");
      expect(fields).toContain("isFinal");
    }
  });
});
