import Link from "next/link";

import AuthForm from "@/components/AuthForm";

export default function RegisterPage() {
  return (
    <main className="mx-auto max-w-sm px-6 py-20">
      <h1 className="mb-1 text-2xl font-semibold">Create an account</h1>
      <p className="mb-8 text-sm text-muted">Upload a PDF and start practising it.</p>
      <AuthForm mode="register" />
      <p className="mt-6 text-sm text-muted">
        Already have one?{" "}
        <Link href="/login" className="text-accent underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}
