import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import type { APIContext } from "astro";

export async function GET(context: APIContext) {
  const news = await getCollection("news");

  const sortedNews = news.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  return rss({
    title: "LLMs Unplugged",
    description:
      "Ready-to-use teaching resources for understanding how large language models work through hands-on activities.",
    site: context.site!,
    items: sortedNews.map((item) => ({
      title: item.data.title,
      pubDate: item.data.date,
      description: item.data.description,
      link: `/news/${item.id}/`,
      author: item.data.author,
    })),
    customData: `<language>en-AU</language><copyright>© Ben Swift, CC BY-NC-SA 4.0</copyright>`,
  });
}
