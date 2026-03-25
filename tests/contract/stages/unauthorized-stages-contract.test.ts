import { describe, expect, it } from "vitest";

import { errorResponse, unauthorizedError } from "@/lib/validation/api-error";

describe("unauthorized stages contract", () => {
  it("returns 401 with standardized UNAUTHORIZED envelope", async () => {
    const response = errorResponse(unauthorizedError());
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication is required for this resource.",
      },
    });
  });
});
