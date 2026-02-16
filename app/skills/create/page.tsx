"use client";

import { useState } from "react";
import { SkillEditor } from "@/components/skill-editor";
import { useRouter } from "next/navigation";

export default function CreateSkillPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("productivity");
  const [tags, setTags] = useState("automation,coding");
  const [content, setContent] = useState("---\ntitle: \"My Skill\"\ndescription: \"...\"\n---\n\n# Instructions");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function submit() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        category,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        compatibility: ["claude", "cursor"],
        content,
        isPublic: true,
        status: "PUBLISHED",
      }),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(typeof data.error === "string" ? data.error : "Failed to create skill");
      return;
    }

    router.push(`/skills/${data.slug ?? data.id}`);
  }

  return (
    <main className="space-y-4">
      <h1 className="text-3xl font-bold">Skill Creation Studio</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Skill title"
          className="rounded-lg border border-neutral-300 px-3 py-2"
        />
        <input
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Short description"
          className="rounded-lg border border-neutral-300 px-3 py-2"
        />
        <input
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          placeholder="Category"
          className="rounded-lg border border-neutral-300 px-3 py-2"
        />
        <input
          value={tags}
          onChange={(event) => setTags(event.target.value)}
          placeholder="tags,comma,separated"
          className="rounded-lg border border-neutral-300 px-3 py-2"
        />
      </div>

      <SkillEditor value={content} onChange={setContent} />

      <button
        onClick={submit}
        disabled={loading}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-white"
      >
        {loading ? "Publishing..." : "Publish skill"}
      </button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </main>
  );
}
