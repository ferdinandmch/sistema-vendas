import { UserButton } from "@clerk/nextjs";

import { requireAuthenticatedUser } from "@/lib/auth/require-auth";
import { QueryProvider } from "@/providers/QueryProvider";

export default async function PrivateLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authContext = await requireAuthenticatedUser();

  return (
    <main style={{ padding: "32px 0" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <div>
          <p style={{ margin: 0, color: "#4d6b95", textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.8rem" }}>
            Area privada
          </p>
          <h1 style={{ margin: "8px 0 0" }}>Ola, {authContext.user.name}</h1>
        </div>
        <UserButton />
      </header>
      <QueryProvider>{children}</QueryProvider>
    </main>
  );
}
