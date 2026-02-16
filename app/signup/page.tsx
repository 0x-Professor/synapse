"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      setLoading(false);
      setError(typeof data.error === "string" ? data.error : "Signup failed");
      return;
    }

    await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    setLoading(false);
    router.push("/skills");
  }

  return (
    <main className="mx-auto max-w-md rounded-xl border border-neutral-200 bg-white p-6">
      <h1 className="mb-4 text-2xl font-bold">Create account</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2"
        />
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
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
    </main>
  );
}

