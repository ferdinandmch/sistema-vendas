import { describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ isAuthenticated: false, userId: null }),
  currentUser: vi.fn().mockResolvedValue(null),
}));

describe("unauthorized list deals contract", () => {
  it("returns 401 UNAUTHORIZED when no session is present", async () => {
    const { GET } = await import("@/app/api/deals/route");

    const response = await GET();
    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });
});
