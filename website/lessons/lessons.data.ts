import { createContentLoader } from "vitepress";
import { topicOrder } from "./topics";

export interface LessonData {
  url: string;
  title: string;
  description: string;
  topic: string;
  order: number;
  keyIdea: string;
  dependsOn: string[];
  hero: string;
}

declare const data: LessonData[];
export { data };

export default createContentLoader("lessons/*.md", {
  transform(raw): LessonData[] {
    return raw
      .filter((page) => page.frontmatter.topic)
      .map((page) => {
        const slug = page.url.replace(/^\/lessons\//, "").replace(/\/$/, "");
        return {
          url: page.url,
          title: page.frontmatter.title,
          description: page.frontmatter.description,
          topic: page.frontmatter.topic,
          order: page.frontmatter.order ?? 0,
          keyIdea: page.frontmatter.keyIdea ?? "",
          dependsOn: page.frontmatter.dependsOn ?? [],
          hero: `/assets/images/hero-${slug}.jpg`,
        };
      })
      .sort((a, b) => {
        const topicDiff =
          topicOrder.indexOf(a.topic) - topicOrder.indexOf(b.topic);
        if (topicDiff !== 0) return topicDiff;
        return a.order - b.order;
      });
  },
});
