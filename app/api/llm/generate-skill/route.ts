import { NextRequest, NextResponse } from "next/server";
import { generateSkillInputSchema, generateSkillWithGitHubModels } from "@/lib/llm/githubModelsProvider";
import { getSession } from "@/lib/session";
import { enforceRateLimit, rateLimiters } from "@/lib/rate-limit";
import { db } from "@/lib/db";

function getIp(request: NextRequest) {
  const xff = request.headers.get("x-forwarded-for");
  return xff?.split(",")[0]?.trim() ?? "unknown";
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getIp(request);

  const [ipLimit, userLimit] = await Promise.all([
    enforceRateLimit(rateLimiters.llmPerIp, `llm:ip:${ip}`),
    enforceRateLimit(rateLimiters.llmPerUser, `llm:user:${session.user.id}`),
  ]);

  if (!ipLimit.success || !userLimit.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const payload = await request.json();
  const parsed = generateSkillInputSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await generateSkillWithGitHubModels(parsed.data);

  await db.usageLog.create({
    data: {
      userId: session.user.id,
      endpoint: "/api/llm/generate-skill",
      model: parsed.data.model,
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
    },
  });

  return NextResponse.json(result);
}
