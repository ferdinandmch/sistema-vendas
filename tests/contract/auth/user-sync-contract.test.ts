import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      upsert: vi.fn(async ({ create }: { create: { id?: string; clerkUserId: string; email: string; name: string } }) => ({
        id: "user_123",
        ...create,
        createdAt: new Date("2026-03-24T00:00:00.000Z"),
      })),
    },
  },
}));

import { syncUser } from "@/lib/auth/sync-user";

describe("user sync contract", () => {
  it("returns a stable internal user for a valid Clerk identity", async () => {
    const user = await syncUser({
      clerkUserId: "clerk_123",
      email: "maria@example.com",
      name: "Maria",
    });

    expect(user.clerkUserId).toBe("clerk_123");
    expect(user.email).toBe("maria@example.com");
    expect(user.name).toBe("Maria");
  });
});

