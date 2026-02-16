import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { enforceRateLimit, rateLimiters } from "@/lib/rate-limit";
import { syncComposioSkills } from "@/lib/github/sync";

function getIp(request: NextRequest) {
  const xff = request.headers.get("x-forwarded-for");
  return xff?.split(",")[0]?.trim() ?? "unknown";
}

async function handleSync(request: NextRequest) {
  const session = await getSession();

  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const isCron = cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (!isCron && session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const limit = await enforceRateLimit(rateLimiters.syncPerIp, `sync:${getIp(request)}`);
  if (!limit.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const result = await syncComposioSkills();
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  return handleSync(request);
}

export async function GET(request: NextRequest) {
  return handleSync(request);
}

