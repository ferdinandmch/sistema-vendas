import { describe, expect, it } from "vitest";
import { z } from "zod";

import { parseAndValidate } from "@/lib/validation/request-helpers";
import { AppError } from "@/lib/validation/api-error";

const stageSchema = z.object({ name: z.string().min(1), position: z.number().int().positive() });
const dealSchema = z.object({ companyName: z.string().min(1), stageId: z.string().min(1) });

function malformedRequest(): Request {
  return new Request("http://localhost", {
    method: "POST",
    body: "not valid json{{",
    headers: { "Content-Type": "application/json" },
  });
}

describe("error format consistency across endpoints", () => {
  it("JSON malformed for stage schema throws INVALID_REQUEST with 'Invalid JSON body'", async () => {
    try {
      await parseAndValidate(malformedRequest(), stageSchema);
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe("INVALID_REQUEST");
      expect((error as AppError).message).toBe("Invalid JSON body");
      expect((error as AppError).status).toBe(400);
    }
  });

  it("JSON malformed for deal schema throws identical error shape", async () => {
    try {
      await parseAndValidate(malformedRequest(), dealSchema);
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe("INVALID_REQUEST");
      expect((error as AppError).message).toBe("Invalid JSON body");
      expect((error as AppError).status).toBe(400);
    }
  });

  it("both schemas produce identical error code, message, and status for malformed JSON", async () => {
    let stageError: AppError | null = null;
    let dealError: AppError | null = null;

    try {
      await parseAndValidate(malformedRequest(), stageSchema);
    } catch (e) {
      stageError = e as AppError;
    }

    try {
      await parseAndValidate(malformedRequest(), dealSchema);
    } catch (e) {
      dealError = e as AppError;
    }

    expect(stageError).not.toBeNull();
    expect(dealError).not.toBeNull();
    expect(stageError!.code).toBe(dealError!.code);
    expect(stageError!.message).toBe(dealError!.message);
    expect(stageError!.status).toBe(dealError!.status);
  });
});
