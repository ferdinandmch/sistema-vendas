import { describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ isAuthenticated: false, userId: null }),
  currentUser: vi.fn().mockResolvedValue(null),
}));

describe("unauthorized create deal contract", () => {
  it("returns 401 UNAUTHORIZED when no session is present", async () => {
    const { POST } = await import("@/app/api/deals/route");

    const request = new Request("http://localhost/api/deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyName: "Test", stageId: "fake" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });
});
