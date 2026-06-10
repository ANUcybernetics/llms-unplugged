import { defineCollection } from "astro:content";
import { file, glob } from "astro/loaders";
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

const events = defineCollection({
  loader: file("src/content/events.yaml"),
  schema: z.object({
    title: z.string().default("LLMs Unplugged workshop"),
    // ISO datetime with an explicit Canberra offset (+10:00 AEST / +11:00 AEDT)
    // so the instant is unambiguous regardless of where the site is built.
    start: z.coerce.date(),
    // The session length. The end time (start + duration) is what drives the
    // auto-hide once a session is over.
    durationMinutes: z.number().int().positive().default(120),
    location: z.string().default("Innovation Space, Birch Building, ANU"),
    bookingUrl: z.url().default("https://events.humanitix.com/host/anu-cecc-school-of-cybernetics"),
  }),
});

export const collections = { lessons, news, events };
