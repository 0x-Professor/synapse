import { z } from "zod";

const API_URL = "https://models.inference.ai.azure.com/chat/completions";

export const allowedModels = ["gpt-4o-mini", "gpt-4.1-mini", "o1-mini"] as const;

export const generateSkillInputSchema = z.object({
  prompt: z.string().min(10).max(4000),
  model: z.enum(allowedModels).default("gpt-4o-mini"),
  maxTokens: z.number().int().min(128).max(2000).default(800),
  temperature: z.number().min(0).max(1).default(0.3),
  tokenMode: z.enum(["PLATFORM", "BYO"]).default("PLATFORM"),
  byokToken: z.string().optional(),
});

type GenerateSkillInput = z.infer<typeof generateSkillInputSchema>;

type GitHubModelsResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
  };
};

function resolveToken(input: GenerateSkillInput): string {
  if (input.tokenMode === "BYO" && input.byokToken) {
    return input.byokToken;
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("GITHUB_TOKEN is not configured");
  }
  return token;
}

export async function generateSkillWithGitHubModels(input: GenerateSkillInput) {
  const token = resolveToken(input);

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      model: input.model,
      messages: [
        {
          role: "system",
          content:
            "You are a precise skill author. Return a markdown skill doc with YAML frontmatter and practical steps.",
        },
        {
          role: "user",
          content: input.prompt,
        },
      ],
      max_tokens: input.maxTokens,
      temperature: input.temperature,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub Models error (${response.status}): ${text}`);
  }

  const data = (await response.json()) as GitHubModelsResponse;
  return {
    content: data.choices?.[0]?.message?.content ?? "",
    promptTokens: data.usage?.prompt_tokens ?? 0,
    completionTokens: data.usage?.completion_tokens ?? 0,
  };
}
