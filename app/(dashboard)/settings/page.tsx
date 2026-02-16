import { getSession } from "@/lib/session";

export default async function SettingsPage() {
  const session = await getSession();

  return (
    <main className="max-w-2xl rounded-xl border border-neutral-200 bg-white p-6">
      <h1 className="mb-4 text-2xl font-bold">Settings</h1>
      <p className="text-sm text-neutral-700">Signed in as: {session?.user?.email ?? "Guest"}</p>
      <p className="mt-2 text-sm text-neutral-700">Tier: {session?.user?.tier ?? "TRIAL"}</p>
      <p className="mt-2 text-sm text-neutral-700">Role: {session?.user?.role ?? "USER"}</p>
    </main>
  );
}
