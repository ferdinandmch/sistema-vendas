import { describe, expect, it } from "vitest";

import type { AuthenticatedSessionContext } from "@/lib/auth/session-context";

describe("authenticated context contract", () => {
  it("matches the expected backend auth shape", () => {
    const example: AuthenticatedSessionContext = {
      clerkUserId: "clerk_123",
      isAuthenticated: true,
      sessionStatus: "active",
      user: {
        id: "user_123",
        clerkUserId: "clerk_123",
        email: "maria@example.com",
        name: "Maria",
        createdAt: new Date("2026-03-24T00:00:00.000Z"),
      },
    };

    expect(example.isAuthenticated).toBe(true);
    expect(example.user.clerkUserId).toBe(example.clerkUserId);
  });
});

