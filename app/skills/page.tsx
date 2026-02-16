import { db } from "@/lib/db";
import { SkillCard } from "@/components/skill-card";
import { SkillStatus } from "@prisma/client";

type Props = {
  searchParams: Promise<{ q?: string; category?: string; compatibility?: string; page?: string }>;
};

export default async function SkillsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? "1"));
  const pageSize = 24;

  const where = {
    status: SkillStatus.PUBLISHED,
    isPublic: true,
    ...(params.q
      ? {
          OR: [
            { title: { contains: params.q, mode: "insensitive" as const } },
            { description: { contains: params.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(params.category
      ? { category: { equals: params.category, mode: "insensitive" as const } }
      : {}),
    ...(params.compatibility
      ? { compatibility: { has: params.compatibility.toLowerCase() } }
      : {}),
  };

  const [total, skills] = await Promise.all([
    db.skill.count({ where }),
    db.skill.findMany({
      where,
      orderBy: [{ rating: "desc" }, { downloads: "desc" }, { createdAt: "desc" }],
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
        rating: true,
        ratingCount: true,
        downloads: true,
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <main>
      <h1 className="mb-4 text-3xl font-bold">Explore Skills</h1>
      <p className="mb-8 text-sm text-neutral-600">
        {total} skills indexed from GitHub and community creators.
      </p>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {skills.map((skill) => (
          <SkillCard key={skill.id} {...skill} />
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between text-sm">
        <span>
          Page {page} of {totalPages}
        </span>
      </div>
    </main>
  );
}

