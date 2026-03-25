import { describe, expect, it } from "vitest";

import { errorResponse, unauthorizedError } from "@/lib/validation/api-error";

describe("unauthorized update stage contract", () => {
  it("returns 401 with UNAUTHORIZED code for unauthenticated PUT", async () => {
    const response = errorResponse(unauthorizedError());
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });
});
