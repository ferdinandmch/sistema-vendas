import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      upsert: vi.fn(async ({ create }: { create: { clerkUserId: string; email: string; name: string } }) => ({
        id: "user_first_login",
        ...create,
        createdAt: new Date("2026-03-24T00:00:00.000Z"),
      })),
    },
  },
}));

import { syncUser } from "@/lib/auth/sync-user";

describe("first login sync", () => {
  it("creates an internal user when none exists yet", async () => {
    const user = await syncUser({
      clerkUserId: "clerk_new",
      email: "novo@example.com",
      name: "Novo Usuario",
    });

    expect(user.id).toBe("user_first_login");
  });
});

