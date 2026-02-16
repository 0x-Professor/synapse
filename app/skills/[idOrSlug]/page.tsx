import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import rehypeHighlight from "rehype-highlight";
import { SkillStatus } from "@prisma/client";

type Props = {
  params: Promise<{ idOrSlug: string }>;
};

export default async function SkillDetailPage({ params }: Props) {
  const { idOrSlug } = await params;

  const skill = await db.skill.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      status: SkillStatus.PUBLISHED,
      isPublic: true,
    },
    include: {
      author: { select: { name: true } },
      versions: { orderBy: { createdAt: "desc" }, take: 1 },
      reviews: { orderBy: { createdAt: "desc" }, take: 15 },
    },
  });

  if (!skill) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl space-y-8">
      <header className="rounded-xl border border-neutral-200 bg-white p-6">
        <h1 className="mb-3 text-3xl font-bold">{skill.title}</h1>
        <p className="mb-4 text-neutral-700">{skill.description}</p>
        <div className="flex flex-wrap gap-2 text-xs">
          {skill.tags.map((tag) => (
            <span key={tag} className="rounded bg-neutral-100 px-2 py-1">
              #{tag}
            </span>
          ))}
        </div>
        <p className="mt-4 text-sm text-neutral-500">
          By {skill.author.name ?? "Unknown"} · Compatible with {skill.compatibility.join(", ")}
        </p>
      </header>

      <article className="prose prose-neutral max-w-none rounded-xl border border-neutral-200 bg-white p-6">
        <ReactMarkdown rehypePlugins={[rehypeSanitize, rehypeHighlight]}>{skill.content}</ReactMarkdown>
      </article>

      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="mb-2 text-xl font-semibold">Reviews ({skill.reviews.length})</h2>
        {skill.reviews.length === 0 ? (
          <p className="text-sm text-neutral-600">No reviews yet.</p>
        ) : (
          <ul className="space-y-3">
            {skill.reviews.map((review) => (
              <li key={review.id} className="rounded-lg border border-neutral-100 p-3 text-sm">
                <div className="mb-1 font-medium">{review.rating}/5</div>
                <div className="text-neutral-700">{review.comment ?? "No comment"}</div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

