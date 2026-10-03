import Link from "next/link";

import AuthForm from "@/components/AuthForm";

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-sm px-6 py-20">
      <h1 className="mb-1 text-2xl font-semibold">BooKademy</h1>
      <p className="mb-8 text-sm text-muted">Sign in to pick up where you left off.</p>
      <AuthForm mode="login" />
      <p className="mt-6 text-sm text-muted">
        No account yet?{" "}
        <Link href="/register" className="text-accent underline">
          Create one
        </Link>
      </p>
    </main>
  );
}
