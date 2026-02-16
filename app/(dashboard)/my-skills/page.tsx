import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import Link from "next/link";

export default async function MySkillsPage() {
  const session = await getSession();
  if (!session?.user?.id) {
    return <p>Please log in to view your skills.</p>;
  }

  const skills = await db.skill.findMany({
    where: { authorId: session.user.id },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return (
    <main>
      <h1 className="mb-4 text-2xl font-bold">My Skills</h1>
      <ul className="space-y-2">
        {skills.map((skill) => (
          <li key={skill.id} className="rounded border border-neutral-200 bg-white p-3">
            <Link href={`/skills/${skill.slug}`} className="font-semibold">
              {skill.title}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

