import type { SidebarSection } from "astro-theme-anu/types";
import { lessonNavGroups } from "./lessons";

export async function getLessonSidebar(): Promise<SidebarSection[]> {
  const groups = await lessonNavGroups();
  return groups
    .filter((group) => group.lessons.length > 0)
    .map((group) => ({
      title: group.title,
      items: group.lessons.map((lesson) => ({
        label: lesson.data.title,
        href: `/lessons/${lesson.id}/`,
      })),
    }));
}
