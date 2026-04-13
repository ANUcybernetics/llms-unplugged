import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const lessons = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "src/content/lessons" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    topic: z.string().optional(),
    order: z.number().optional(),
    keyIdea: z.string().optional(),
  }),
});

const news = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "src/content/news" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    author: z.string(),
    published: z.boolean().default(true),
  }),
});

export const collections = { lessons, news };
