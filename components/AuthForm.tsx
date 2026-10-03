"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type AuthFormProps = {
  mode: "login" | "register";
};

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const response = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        mode === "register" ? { email, password, display_name: displayName } : { email, password },
      ),
    });

    if (response.ok) {
      router.push("/library");
      return;
    }

    const body = (await response.json()) as Record<string, unknown>;
    // Django returns {field: [messages]}; show the first thing that went wrong.
    const first = Object.values(body).flat().find((value) => typeof value === "string");
    setError(typeof first === "string" ? first : "That did not work.");
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {mode === "register" ? (
        <label className="block space-y-1">
          <span className="text-sm text-muted">Name</span>
          <input
            type="text"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            className="w-full rounded border border-line bg-surface px-3 py-2"
          />
        </label>
      ) : null}

      <label className="block space-y-1">
        <span className="text-sm text-muted">Email</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded border border-line bg-surface px-3 py-2"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm text-muted">Password</span>
        <input
          type="password"
          required
          autoComplete={mode === "register" ? "new-password" : "current-password"}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded border border-line bg-surface px-3 py-2"
        />
      </label>

      {error !== null ? <p className="text-sm text-fail">{error}</p> : null}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded bg-accent px-4 py-2 font-medium text-black disabled:opacity-50"
      >
        {mode === "register" ? "Create account" : "Sign in"}
      </button>
    </form>
  );
}
