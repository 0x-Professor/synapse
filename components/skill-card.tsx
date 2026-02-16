import Link from "next/link";

type SkillCardProps = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  compatibility: string[];
  rating: number | null;
  ratingCount: number;
  downloads: number;
};

export function SkillCard(skill: SkillCardProps) {
  return (
    <article className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <span className="rounded-full bg-neutral-100 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-700">
          {skill.category}
        </span>
        <span className="text-xs text-neutral-500">{skill.downloads} downloads</span>
      </div>
      <h3 className="mb-2 text-lg font-semibold text-neutral-900">{skill.title}</h3>
      <p className="mb-3 line-clamp-3 text-sm text-neutral-700">{skill.description}</p>

      <div className="mb-3 flex flex-wrap gap-1">
        {skill.tags.slice(0, 4).map((tag) => (
          <span key={tag} className="rounded bg-neutral-100 px-2 py-1 text-xs text-neutral-700">
            #{tag}
          </span>
        ))}
      </div>

      <div className="mb-4 flex items-center justify-between text-xs text-neutral-600">
        <span>{skill.compatibility.join(", ")}</span>
        <span>
          {skill.rating ? `${skill.rating.toFixed(1)} (${skill.ratingCount})` : "No ratings yet"}
        </span>
      </div>

      <Link
        href={`/skills/${skill.slug}`}
        className="inline-flex rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white"
      >
        View skill
      </Link>
    </article>
  );
}
