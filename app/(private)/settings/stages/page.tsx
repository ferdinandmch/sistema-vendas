import type { Metadata } from "next";

import { requireAuthenticatedUser } from "@/lib/auth/require-auth";
import { StagesPageClient } from "@/components/settings/StagesPageClient";

export const metadata: Metadata = {
  title: "Stages | Fineo",
};

export default async function StagesPage() {
  await requireAuthenticatedUser();

  return (
    <div style={{ maxWidth: "720px" }}>
      <StagesPageClient />
    </div>
  );
}
