import type { User } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { syncFailedError } from "@/lib/validation/api-error";

export type SyncableIdentity = {
  clerkUserId: string;
  email: string;
  name: string;
};

export async function syncUser(identity: SyncableIdentity): Promise<User> {
  if (!identity.clerkUserId || !identity.email || !identity.name) {
    throw syncFailedError("Authenticated identity is missing required user fields.");
  }

  return prisma.user.upsert({
    where: { clerkUserId: identity.clerkUserId },
    update: {
      email: identity.email,
      name: identity.name,
    },
    create: {
      clerkUserId: identity.clerkUserId,
      email: identity.email,
      name: identity.name,
    },
  });
}

