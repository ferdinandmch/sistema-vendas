import { describe, expect, it } from "vitest";

import { unauthorizedError } from "@/lib/validation/api-error";

describe("protected api access", () => {
  it("uses 401 for unauthenticated protected requests", () => {
    expect(unauthorizedError().status).toBe(401);
  });
});

