import crypto from "node:crypto";
import matter from "gray-matter";
import { db } from "@/lib/db";
import { makeSlug } from "@/lib/utils";
import { SkillSource, SkillStatus, SyncStatus } from "@prisma/client";

const REPO = "ComposioHQ/awesome-claude-skills";
const DEFAULT_BRANCH = "master";

type GitTreeNode = {
  path: string;
  type: string;
};

type SkillDocument = {
  sourcePath: string;
  sourceSha: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  compatibility: string[];
  content: string;
};

function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function inferCategory(path: string): string {
  if (path.includes("automation")) return "automation";
  if (path.includes("security")) return "security";
  if (path.includes("data")) return "data";
  return "general";
}

function normalizeSkill(path: string, content: string, sha: string): SkillDocument {
  const parsed = matter(content);
  const fm = parsed.data as Record<string, unknown>;
  const titleFromMeta = typeof fm.title === "string" ? fm.title : undefined;
  const nameFromMeta = typeof fm.name === "string" ? fm.name : undefined;
  const title = titleFromMeta ?? nameFromMeta ?? path.replace("/SKILL.md", "");

  const description =
    typeof fm.description === "string"
      ? fm.description
      : `Imported from ${REPO}:${path}`;

  const category =
    typeof fm.category === "string" ? fm.category : inferCategory(path.toLowerCase());

  const tags = Array.isArray(fm.tags)
    ? fm.tags.map((tag) => String(tag).toLowerCase())
    : [category, "claude-skill"];

  return {
    sourcePath: path,
    sourceSha: sha,
    title,
    description,
    category,
    tags,
    compatibility: ["claude"],
    content: parsed.content.trim(),
  };
}

async function githubJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "synapse-sync-bot",
      Accept: "application/vnd.github+json",
      ...(process.env.GITHUB_TOKEN
        ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
        : {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`GitHub request failed (${response.status}) for ${url}`);
  }

  return (await response.json()) as T;
}

async function githubText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "synapse-sync-bot",
      ...(process.env.GITHUB_TOKEN
        ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
        : {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`GitHub raw request failed (${response.status}) for ${url}`);
  }

  return response.text();
}

export async function syncComposioSkills() {
  const job = await db.skillSyncJob.create({
    data: {
      repo: REPO,
      status: SyncStatus.RUNNING,
      startedAt: new Date(),
    },
  });

  try {
    const ref = await githubJson<{ object: { url: string; sha: string } }>(
      `https://api.github.com/repos/${REPO}/git/ref/heads/${DEFAULT_BRANCH}`,
    );

    const commit = await githubJson<{ tree: { url: string }; sha: string }>(ref.object.url);
    const tree = await githubJson<{ tree: GitTreeNode[] }>(`${commit.tree.url}?recursive=1`);

    const skillPaths = tree.tree
      .filter((node) => node.type === "blob" && /(^|\/)SKILL\.md$/.test(node.path))
      .map((node) => node.path);

    let importedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    const touched = new Set<string>();

    for (const path of skillPaths) {
      try {
        const rawUrl = `https://raw.githubusercontent.com/${REPO}/${DEFAULT_BRANCH}/${path}`;
        const rawContent = await githubText(rawUrl);
        const normalized = normalizeSkill(path, rawContent, commit.sha);
        const contentHash = sha256(normalized.content);
        const slugBase = makeSlug(normalized.title);
        const stableSlug = slugBase || makeSlug(path.replace("/SKILL.md", ""));

        const existing = await db.skill.findUnique({
          where: {
            sourceRepo_sourcePath: {
              sourceRepo: REPO,
              sourcePath: path,
            },
          },
        });

        if (!existing) {
          await db.skill.create({
            data: {
              slug: `${stableSlug}-${crypto.randomBytes(3).toString("hex")}`,
              title: normalized.title,
              description: normalized.description,
              content: normalized.content,
              category: normalized.category,
              tags: normalized.tags,
              compatibility: normalized.compatibility,
              sourceType: SkillSource.GITHUB_SYNC,
              sourceRepo: REPO,
              sourcePath: path,
              sourceSha: normalized.sourceSha,
              contentHash,
              githubUrl: `https://github.com/${REPO}/blob/${DEFAULT_BRANCH}/${path}`,
              status: SkillStatus.PUBLISHED,
              publishedAt: new Date(),
              authorId: await getSystemAuthorId(),
            },
          });
          importedCount += 1;
        } else if (existing.contentHash !== contentHash) {
          await db.skill.update({
            where: { id: existing.id },
            data: {
              title: normalized.title,
              description: normalized.description,
              content: normalized.content,
              category: normalized.category,
              tags: normalized.tags,
              compatibility: normalized.compatibility,
              sourceSha: normalized.sourceSha,
              contentHash,
              status: SkillStatus.PUBLISHED,
            },
          });
          updatedCount += 1;
        }

        touched.add(path);
      } catch {
        errorCount += 1;
      }
    }

    await db.skill.updateMany({
      where: {
        sourceRepo: REPO,
        sourceType: SkillSource.GITHUB_SYNC,
        sourcePath: { notIn: Array.from(touched) },
      },
      data: {
        status: SkillStatus.ARCHIVED,
      },
    });

    await db.skillSyncJob.update({
      where: { id: job.id },
      data: {
        status: SyncStatus.SUCCESS,
        finishedAt: new Date(),
        importedCount,
        updatedCount,
        errorCount,
      },
    });

    return { jobId: job.id, importedCount, updatedCount, errorCount, scanned: skillPaths.length };
  } catch (error) {
    await db.skillSyncJob.update({
      where: { id: job.id },
      data: {
        status: SyncStatus.FAILED,
        finishedAt: new Date(),
        log: error instanceof Error ? error.message : "Unknown sync error",
      },
    });
    throw error;
  }
}

async function getSystemAuthorId(): Promise<string> {
  const email = process.env.SYSTEM_AUTHOR_EMAIL ?? "sync-bot@synapse.local";
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return existing.id;
  }

  const created = await db.user.create({
    data: {
      email,
      name: "Synapse Sync Bot",
      role: "ADMIN",
      tier: "ENTERPRISE",
    },
  });

  return created.id;
}

