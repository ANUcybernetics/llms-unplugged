import { getCollection } from "astro:content";
import type { SidebarSection } from "astro-theme-anu/types";
import { EXTENSIONS, FUNDAMENTALS, type LessonSlug } from "./sidebar";

export async function getLessonSidebar(): Promise<SidebarSection[]> {
  const lessons = await getCollection("lessons");
  const titleBySlug = new Map(lessons.map((l) => [l.id, l.data.title]));

  const buildItems = (slugs: readonly LessonSlug[]) =>
    slugs.map((slug) => {
      const title = titleBySlug.get(slug);
      if (!title) {
        throw new Error(
          `Sidebar references unknown lesson slug '${slug}'. Update src/lib/sidebar.ts or add the lesson file.`,
        );
      }
      return { label: title, href: `/lessons/${slug}/` };
    });

  return [
    { title: "Fundamentals", items: buildItems(FUNDAMENTALS) },
    { title: "Extensions", items: buildItems(EXTENSIONS) },
  ];
}
