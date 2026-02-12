import { createContentLoader } from "vitepress";

export interface NewsItem {
  url: string;
  title: string;
  description: string;
  hero: string;
  date: string;
  dateLabel: string;
}

declare const data: NewsItem[];
export { data };

function parseDateFromSlug(slug: string): string | null {
  const match = slug.match(/^(\d{4})-(\d{2})-(\d{2})-/);
  if (!match) return null;
  return `${match[1]}-${match[2]}-${match[3]}`;
}

function formatDateLabel(dateIso: string): string {
  const date = new Date(`${dateIso}T00:00:00Z`);
  if (Number.isNaN(date.valueOf())) return dateIso;
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default createContentLoader("news/*.md", {
  transform(raw): NewsItem[] {
    return raw
      .filter((page) => page.url !== "/news/")
      .map((page) => {
        const slug = page.url.replace(/^\/news\//, "").replace(/\/$/, "");
        const dateIso =
          parseDateFromSlug(slug) ??
          (typeof page.frontmatter.date === "string"
            ? page.frontmatter.date
            : "");
        return {
          url: page.url,
          title: page.frontmatter.title ?? slug,
          description: page.frontmatter.description ?? "",
          hero: `/assets/images/hero-news-${slug}.avif`,
          date: dateIso,
          dateLabel: dateIso ? formatDateLabel(dateIso) : "",
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  },
});
