import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { canCreateSkill } from "@/lib/tier";
import { makeSlug } from "@/lib/utils";
import crypto from "node:crypto";
import { SkillStatus, SkillSource } from "@prisma/client";

const createSkillSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(300),
  content: z.string().min(20).max(100000),
  category: z.string().min(2).max(50),
  tags: z.array(z.string().min(1).max(40)).max(20).default([]),
  compatibility: z.array(z.string().min(1).max(40)).max(10).default(["claude"]),
  isPublic: z.boolean().default(true),
  status: z.nativeEnum(SkillStatus).default(SkillStatus.PUBLISHED),
});

function parsePagination(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") ?? "20")));
  return { page, pageSize };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const { page, pageSize } = parsePagination(request);

  const q = searchParams.get("q")?.trim();
  const category = searchParams.get("category")?.trim();
  const compatibility = searchParams.get("compatibility")?.trim();
  const tags = searchParams.getAll("tags");
  const sort = searchParams.get("sort") ?? "newest";

  const where = {
    isPublic: true,
    status: SkillStatus.PUBLISHED,
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { description: { contains: q, mode: "insensitive" as const } },
            { tags: { hasSome: [q.toLowerCase()] } },
          ],
        }
      : {}),
    ...(category ? { category: { equals: category, mode: "insensitive" as const } } : {}),
    ...(compatibility ? { compatibility: { has: compatibility.toLowerCase() } } : {}),
    ...(tags.length > 0 ? { tags: { hasSome: tags.map((tag) => tag.toLowerCase()) } } : {}),
  };

  const orderBy =
    sort === "popular"
      ? [{ downloads: "desc" as const }]
      : sort === "rating"
        ? [{ rating: "desc" as const }]
        : [{ createdAt: "desc" as const }];

  const [total, skills] = await Promise.all([
    db.skill.count({ where }),
    db.skill.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        category: true,
        tags: true,
        compatibility: true,
        downloads: true,
        rating: true,
        ratingCount: true,
        createdAt: true,
        author: { select: { id: true, name: true } },
      },
    }),
  ]);

  return NextResponse.json({
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
    items: skills,
  });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.isBanned) {
    return NextResponse.json({ error: "Account banned" }, { status: 403 });
  }

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (!canCreateSkill(user.tier, user.skillsCreated)) {
    return NextResponse.json(
      { error: "Trial limit reached. Upgrade to Pro for unlimited skill creation." },
      { status: 403 },
    );
  }

  const payload = await request.json();
  const parsed = createSkillSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const slugBase = makeSlug(parsed.data.title);
  const slug = `${slugBase}-${crypto.randomBytes(2).toString("hex")}`;
  const contentHash = crypto
    .createHash("sha256")
    .update(parsed.data.content)
    .digest("hex");

  const created = await db.$transaction(async (tx) => {
    const skill = await tx.skill.create({
      data: {
        slug,
        title: parsed.data.title,
        description: parsed.data.description,
        content: parsed.data.content,
        category: parsed.data.category,
        tags: parsed.data.tags.map((tag) => tag.toLowerCase()),
        compatibility: parsed.data.compatibility.map((item) => item.toLowerCase()),
        sourceType: SkillSource.USER,
        status: parsed.data.status,
        isPublic: parsed.data.isPublic,
        publishedAt: parsed.data.status === SkillStatus.PUBLISHED ? new Date() : null,
        contentHash,
        authorId: session.user.id,
      },
    });

    await tx.skillVersion.create({
      data: {
        skillId: skill.id,
        version: "1.0.0",
        content: skill.content,
        metadataJson: {
          title: skill.title,
          description: skill.description,
          tags: skill.tags,
          compatibility: skill.compatibility,
        },
        contentHash,
      },
    });

    await tx.user.update({
      where: { id: session.user.id },
      data: { skillsCreated: { increment: 1 } },
    });

    return skill;
  });

  return NextResponse.json(created, { status: 201 });
}
