import Link from "next/link";

const cardStyle = {
  background: "#ffffff",
  borderRadius: "20px",
  padding: "24px",
  boxShadow: "0 20px 60px rgba(16, 33, 58, 0.08)",
};

export default function HomePage() {
  return (
    <main style={{ padding: "64px 0" }}>
      <section style={cardStyle}>
        <p style={{ margin: 0, fontSize: "0.9rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#4d6b95" }}>
          Fineo
        </p>
        <h1 style={{ marginBottom: "12px", fontSize: "3rem" }}>Pipeline de Vendas</h1>
        <p style={{ marginTop: 0, fontSize: "1.1rem", lineHeight: 1.6, maxWidth: "60ch" }}>
          Camada inicial de autenticacao preparada para bloquear acesso anonimo,
          sincronizar usuarios com o banco e servir de base para ownership futuro.
        </p>
        <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
          <Link href="/sign-in" style={{ ...buttonStyle, background: "#10213a", color: "#ffffff" }}>
            Entrar
          </Link>
          <Link href="/pipeline" style={{ ...buttonStyle, background: "#dfe8f5", color: "#10213a" }}>
            Abrir area privada
          </Link>
        </div>
      </section>
    </main>
  );
}

const buttonStyle = {
  padding: "12px 18px",
  borderRadius: "999px",
  fontWeight: 600,
};

