"use client";

import { useState } from "react";

export function CodePlayground() {
  const [prompt, setPrompt] = useState("Generate a PDF summarization skill for legal docs");
  const [result, setResult] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  async function run() {
    setIsLoading(true);
    setResult("");
    try {
      const response = await fetch("/api/llm/generate-skill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          model: "gpt-4o-mini",
          maxTokens: 900,
          tokenMode: "PLATFORM",
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setResult(data.error ?? "Generation failed");
      } else {
        setResult(data.content);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-4">
      <h2 className="mb-3 text-lg font-semibold">LLM Skill Playground</h2>
      <textarea
        className="mb-3 w-full rounded-lg border border-neutral-300 p-3 text-sm"
        rows={5}
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
      />
      <button
        onClick={run}
        disabled={isLoading}
        className="rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {isLoading ? "Generating..." : "Generate"}
      </button>

      {result ? (
        <pre className="mt-4 overflow-x-auto rounded-lg bg-neutral-950 p-3 text-xs text-neutral-100">
          {result}
        </pre>
      ) : null}
    </section>
  );
}

