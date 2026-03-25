import { describe, expect, it } from "vitest";

import { isPublicPath } from "@/lib/auth/route-config";

describe("authenticated return behavior", () => {
  it("keeps sign-in and sign-up routes public", () => {
    expect(isPublicPath("/sign-in")).toBe(true);
    expect(isPublicPath("/sign-up")).toBe(true);
  });
});

