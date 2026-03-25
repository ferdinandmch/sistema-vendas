import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      upsert: vi.fn(async ({ where, update }: { where: { clerkUserId: string }; update: { email: string; name: string } }) => ({
        id: "user_existing",
        clerkUserId: where.clerkUserId,
        email: update.email,
        name: update.name,
        createdAt: new Date("2026-03-24T00:00:00.000Z"),
      })),
    },
  },
}));

import { syncUser } from "@/lib/auth/sync-user";

describe("existing user reuse", () => {
  it("reuses the same canonical clerk user id", async () => {
    const user = await syncUser({
      clerkUserId: "clerk_existing",
      email: "existente@example.com",
      name: "Existente",
    });

    expect(user.id).toBe("user_existing");
    expect(user.clerkUserId).toBe("clerk_existing");
  });
});
