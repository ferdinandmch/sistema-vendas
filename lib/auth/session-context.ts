import type { User } from "@prisma/client";
import { auth, currentUser } from "@clerk/nextjs/server";

import { syncUser, type SyncableIdentity } from "@/lib/auth/sync-user";
import { syncFailedError, unauthorizedError } from "@/lib/validation/api-error";

export type AuthenticatedSessionContext = {
  clerkUserId: string;
  isAuthenticated: true;
  sessionStatus: string | null;
  user: User;
};

type ClerkUserPayload = Awaited<ReturnType<typeof currentUser>>;

function toSyncableIdentity(
  clerkUserId: string,
  clerkUser: ClerkUserPayload,
): SyncableIdentity {
  const email =
    clerkUser?.emailAddresses.find(
      (entry) => entry.id === clerkUser.primaryEmailAddressId,
    )?.emailAddress ?? clerkUser?.emailAddresses[0]?.emailAddress;
  const name =
    [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ").trim() ||
    clerkUser?.username ||
    email?.split("@")[0];

  if (!email || !name) {
    throw syncFailedError("Authenticated Clerk user is missing email or name.");
  }

  return {
    clerkUserId,
    email,
    name,
  };
}

export async function resolveAuthenticatedSessionContext(): Promise<AuthenticatedSessionContext> {
  const session = await auth();

  if (!session.isAuthenticated || !session.userId) {
    throw unauthorizedError();
  }

  const clerkUser = await currentUser();
  const identity = toSyncableIdentity(session.userId, clerkUser);
  const user = await syncUser(identity);

  return {
    clerkUserId: identity.clerkUserId,
    isAuthenticated: true,
    sessionStatus: session.sessionStatus ?? null,
    user,
  };
}
