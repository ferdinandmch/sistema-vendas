import { requireAuthenticatedUser } from "@/lib/auth/require-auth";

export default async function PipelinePage() {
  const authContext = await requireAuthenticatedUser();

  return (
    <section
      style={{
        background: "#ffffff",
        borderRadius: "20px",
        padding: "24px",
        boxShadow: "0 20px 60px rgba(16, 33, 58, 0.08)",
      }}
    >
      <h2 style={{ marginTop: 0 }}>Pipeline protegido</h2>
      <p>
        Usuario de dominio resolvido com sucesso. Esta pagina usa apenas contexto
        autenticado server-side.
      </p>
      <dl style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: "12px" }}>
        <dt>user.id</dt>
        <dd>{authContext.user.id}</dd>
        <dt>clerk_user_id</dt>
        <dd>{authContext.clerkUserId}</dd>
        <dt>email</dt>
        <dd>{authContext.user.email}</dd>
      </dl>
    </section>
  );
}

