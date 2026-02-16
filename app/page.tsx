import Link from "next/link";
import { CodePlayground } from "@/components/code-playground";

export default function Home() {
  return (
    <main className="space-y-12">
      <section className="rounded-2xl bg-gradient-to-br from-cyan-700 to-blue-900 px-8 py-12 text-white">
        <h1 className="mb-4 text-4xl font-bold leading-tight md:text-5xl">
          Synapse: The Skills Marketplace for Claude, Cursor, and AI Dev Tools
        </h1>
        <p className="mb-6 max-w-2xl text-white/90">
          Browse production-ready SKILL.md workflows, build your own in the studio, and sync directly from GitHub.
        </p>
        <div className="flex gap-3">
          <Link href="/skills" className="rounded-lg bg-white px-4 py-2 font-semibold text-blue-900">
            Browse Skills
          </Link>
          <Link href="/skills/create" className="rounded-lg border border-white/50 px-4 py-2">
            Create Skill
          </Link>
        </div>
      </section>

      <CodePlayground />
    </main>
  );
}
