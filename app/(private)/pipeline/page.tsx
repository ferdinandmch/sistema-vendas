import { PipelineBoard } from "@/components/pipeline/PipelineBoard";
import { requireAuthenticatedUser } from "@/lib/auth/require-auth";

export default async function PipelinePage() {
  await requireAuthenticatedUser();

  return (
    <section>
      <h2 className="mb-6 text-xl font-semibold">Pipeline</h2>
      <PipelineBoard />
    </section>
  );
}
