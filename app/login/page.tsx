"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
      callbackUrl: "/skills",
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid credentials");
      return;
    }

    router.push("/skills");
  }

  return (
    <main className="mx-auto max-w-md rounded-xl border border-neutral-200 bg-white p-6">
      <h1 className="mb-4 text-2xl font-bold">Login</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-neutral-900 px-3 py-2 text-white"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="mt-4 grid gap-2">
        <button
          onClick={() => signIn("google", { callbackUrl: "/skills" })}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2"
        >
          Continue with Google
        </button>
        <button
          onClick={() => signIn("github", { callbackUrl: "/skills" })}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2"
        >
          Continue with GitHub
        </button>
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
    </main>
  );
}

