import { resolveAuthenticatedSessionContext } from "@/lib/auth/session-context";

export async function requireAuthenticatedUser() {
  return resolveAuthenticatedSessionContext();
}

