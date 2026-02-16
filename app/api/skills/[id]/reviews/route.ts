import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const skill = await db.skill.findUnique({ where: { id } });
  if (!skill) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }

  const payload = await request.json();
  const parsed = reviewSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await db.review.upsert({
    where: {
      skillId_userId: {
        skillId: id,
        userId: session.user.id,
      },
    },
    update: {
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    },
    create: {
      skillId: id,
      userId: session.user.id,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    },
  });

  const aggregate = await db.review.aggregate({
    where: { skillId: id },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await db.skill.update({
    where: { id },
    data: {
      rating: aggregate._avg.rating ?? null,
      ratingCount: aggregate._count.rating,
    },
  });

  return NextResponse.json({ ok: true });
}

