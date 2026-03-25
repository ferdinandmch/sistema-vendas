import { describe, expect, it } from "vitest";

import { isPublicPath } from "@/lib/auth/route-config";

describe("private route redirect behavior", () => {
  it("treats pipeline routes as private", () => {
    expect(isPublicPath("/pipeline")).toBe(false);
  });
});

