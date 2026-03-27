import { describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ isAuthenticated: false, userId: null }),
  currentUser: vi.fn().mockResolvedValue(null),
}));

describe("unauthorized create activity contract", () => {
  it("returns 401 UNAUTHORIZED when no session is present", async () => {
    const { POST } = await import("@/app/api/deals/[id]/activities/route");

    const request = new Request("http://localhost/api/deals/fake-id/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "note", content: "Test" }),
    });

    const context = { params: Promise.resolve({ id: "fake-id" }) };

    const response = await POST(request, context);
    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });
});
