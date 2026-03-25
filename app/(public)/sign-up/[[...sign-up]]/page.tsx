import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main style={{ padding: "48px 0", display: "grid", placeItems: "center" }}>
      <SignUp path="/sign-up" signInUrl="/sign-in" forceRedirectUrl="/pipeline" />
    </main>
  );
}

