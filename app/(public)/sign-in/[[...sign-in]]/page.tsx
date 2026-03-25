import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main style={{ padding: "48px 0", display: "grid", placeItems: "center" }}>
      <SignIn path="/sign-in" signUpUrl="/sign-up" forceRedirectUrl="/pipeline" />
    </main>
  );
}

