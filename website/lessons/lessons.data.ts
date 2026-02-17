import { createContentLoader } from "vitepress";
import { topicOrder } from "./topics";

export interface LessonData {
  url: string;
  title: string;
  description: string;
  topic: string;
  order: number;
  keyIdea: string;
  hero: string;
}

declare const data: LessonData[];
export { data };

const heroImageMap: Record<string, string> = {
  training: "grid-training",
  generation: "grid-generation",
  trigram: "grid-trigram",
};

export default createContentLoader("lessons/*.md", {
  transform(raw): LessonData[] {
    return raw
      .filter((page) => page.frontmatter.topic)
      .map((page) => {
        const slug = page.url.replace(/^\/lessons\//, "").replace(/\/$/, "");
        const heroSlug = heroImageMap[slug] ?? slug;
        return {
          url: page.url,
          title: page.frontmatter.title,
          description: page.frontmatter.description,
          topic: page.frontmatter.topic,
          order: page.frontmatter.order ?? 0,
          keyIdea: page.frontmatter.keyIdea ?? "",
          hero: `/assets/images/hero-${heroSlug}.avif`,
        };
      })
      .sort((a, b) => {
        const topicDiff = topicOrder.indexOf(a.topic) - topicOrder.indexOf(b.topic);
        if (topicDiff !== 0) return topicDiff;
        return a.order - b.order;
      });
  },
});
