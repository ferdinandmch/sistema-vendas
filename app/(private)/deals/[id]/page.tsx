import Link from "next/link";

import { DealPageClient } from "@/components/deal/DealPageClient";
import { requireAuthenticatedUser } from "@/lib/auth/require-auth";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function DealPage({ params }: Props) {
  await requireAuthenticatedUser();
  const { id } = await params;

  return (
    <section>
      <div className="mb-6">
        <Link
          href="/pipeline"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Pipeline
        </Link>
      </div>
      <DealPageClient id={id} />
    </section>
  );
}
