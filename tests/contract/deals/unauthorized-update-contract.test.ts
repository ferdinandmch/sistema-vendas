import { describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ isAuthenticated: false, userId: null }),
  currentUser: vi.fn().mockResolvedValue(null),
}));

describe("unauthorized update deal contract", () => {
  it("returns 401 UNAUTHORIZED when no session is present", async () => {
    const { PUT } = await import("@/app/api/deals/[id]/route");

    const request = new Request("http://localhost/api/deals/some-id", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyName: "Hack" }),
    });

    const response = await PUT(request, { params: Promise.resolve({ id: "some-id" }) });
    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });
});
