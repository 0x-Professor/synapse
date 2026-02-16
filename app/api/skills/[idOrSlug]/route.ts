import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { makeSlug } from "@/lib/utils";
import crypto from "node:crypto";
import { SkillStatus } from "@prisma/client";

const updateSkillSchema = z.object({
  title: z.string().min(3).max(120).optional(),
  description: z.string().min(10).max(300).optional(),
  content: z.string().min(20).max(100000).optional(),
  category: z.string().min(2).max(50).optional(),
  tags: z.array(z.string().min(1).max(40)).max(20).optional(),
  compatibility: z.array(z.string().min(1).max(40)).max(10).optional(),
  isPublic: z.boolean().optional(),
  status: z.nativeEnum(SkillStatus).optional(),
});

async function getSkill(idOrSlug: string) {
  return db.skill.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
    include: {
      author: {
        select: { id: true, name: true, email: true },
      },
      versions: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      reviews: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ idOrSlug: string }> },
) {
  const { idOrSlug } = await context.params;
  const skill = await getSkill(idOrSlug);

  if (!skill) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }

  if (!skill.isPublic || skill.status !== SkillStatus.PUBLISHED) {
    const session = await getSession();
    const isOwner = session?.user?.id === skill.authorId;
    const isAdmin = session?.user?.role === "ADMIN";
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return NextResponse.json(skill);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ idOrSlug: string }> },
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { idOrSlug } = await context.params;
  const existing = await getSkill(idOrSlug);

  if (!existing) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }

  const isOwner = existing.authorId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = await request.json();
  const parsed = updateSkillSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updatedData: Record<string, unknown> = {};

  if (parsed.data.title) {
    updatedData.title = parsed.data.title;
    updatedData.slug = `${makeSlug(parsed.data.title)}-${existing.id.slice(-4)}`;
  }
  if (parsed.data.description) updatedData.description = parsed.data.description;
  if (parsed.data.content) updatedData.content = parsed.data.content;
  if (parsed.data.category) updatedData.category = parsed.data.category;
  if (parsed.data.tags) updatedData.tags = parsed.data.tags.map((tag) => tag.toLowerCase());
  if (parsed.data.compatibility) {
    updatedData.compatibility = parsed.data.compatibility.map((item) => item.toLowerCase());
  }
  if (parsed.data.isPublic !== undefined) updatedData.isPublic = parsed.data.isPublic;
  if (parsed.data.status) updatedData.status = parsed.data.status;
  if (parsed.data.status === SkillStatus.PUBLISHED) updatedData.publishedAt = new Date();

  const contentForHash = parsed.data.content ?? existing.content;
  const contentHash = crypto.createHash("sha256").update(contentForHash).digest("hex");
  updatedData.contentHash = contentHash;

  const versionCount = await db.skillVersion.count({ where: { skillId: existing.id } });
  const nextVersion = `1.0.${versionCount}`;

  const updated = await db.$transaction(async (tx) => {
    const skill = await tx.skill.update({
      where: { id: existing.id },
      data: updatedData,
    });

    await tx.skillVersion.create({
      data: {
        skillId: existing.id,
        version: nextVersion,
        content: skill.content,
        metadataJson: {
          title: skill.title,
          description: skill.description,
          tags: skill.tags,
          compatibility: skill.compatibility,
          status: skill.status,
        },
        contentHash,
      },
    });

    return skill;
  });

  return NextResponse.json(updated);
}
