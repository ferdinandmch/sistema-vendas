import { describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ isAuthenticated: false, userId: null }),
  currentUser: vi.fn().mockResolvedValue(null),
}));

describe("unauthorized get deal contract", () => {
  it("returns 401 UNAUTHORIZED when no session is present", async () => {
    const { GET } = await import("@/app/api/deals/[id]/route");

    const request = new Request("http://localhost/api/deals/some-id", {
      method: "GET",
    });

    const response = await GET(request, { params: Promise.resolve({ id: "some-id" }) });
    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });
});
