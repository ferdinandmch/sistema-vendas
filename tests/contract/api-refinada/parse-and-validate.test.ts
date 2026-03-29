import { describe, expect, it } from "vitest";
import { z } from "zod";

import { parseAndValidate } from "@/lib/validation/request-helpers";
import { AppError } from "@/lib/validation/api-error";

const testSchema = z.object({
  name: z.string().min(1, "Name is required"),
  value: z.number().positive("Value must be positive"),
});

function mockRequest(body: unknown, validJson = true): Request {
  if (!validJson) {
    return new Request("http://localhost", {
      method: "POST",
      body: "invalid json{{",
      headers: { "Content-Type": "application/json" },
    });
  }
  return new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("parseAndValidate", () => {
  it("returns typed data for valid JSON and valid schema", async () => {
    const request = mockRequest({ name: "Test", value: 42 });
    const result = await parseAndValidate(request, testSchema);

    expect(result).toEqual({ name: "Test", value: 42 });
  });

  it("throws INVALID_REQUEST with 'Invalid JSON body' for malformed JSON", async () => {
    const request = mockRequest(null, false);

    try {
      await parseAndValidate(request, testSchema);
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe("INVALID_REQUEST");
      expect((error as AppError).message).toBe("Invalid JSON body");
      expect((error as AppError).status).toBe(400);
    }
  });

  it("throws INVALID_REQUEST with 'Validation failed' and details for invalid schema", async () => {
    const request = mockRequest({ name: "", value: -5 });

    try {
      await parseAndValidate(request, testSchema);
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe("INVALID_REQUEST");
      expect((error as AppError).message).toBe("Validation failed");
      expect((error as AppError).status).toBe(400);
      expect((error as AppError).details).toBeDefined();
      expect((error as AppError).details!.length).toBeGreaterThanOrEqual(2);

      const fields = (error as AppError).details!.map((d) => d.field);
      expect(fields).toContain("name");
      expect(fields).toContain("value");

      for (const detail of (error as AppError).details!) {
        expect(typeof detail.field).toBe("string");
        expect(typeof detail.message).toBe("string");
        expect(detail.message.length).toBeGreaterThan(0);
      }
    }
  });

  it("throws INVALID_REQUEST for missing required fields", async () => {
    const request = mockRequest({});

    try {
      await parseAndValidate(request, testSchema);
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe("INVALID_REQUEST");
      expect((error as AppError).details).toBeDefined();
    }
  });
});
