import { defineCollection } from "astro:content";
import { file, glob } from "astro/loaders";
import { z } from "astro/zod";
import { TOPIC_KEYS } from "./lib/topics";

const modules = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "src/content/modules" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    topic: z.enum(TOPIC_KEYS),
    order: z.number(),
    keyIdea: z.string().optional(),
    // Unlisted modules are reachable only via direct links --- hidden from the
    // sidebar and the /modules index (see src/lib/modules.ts).
    listed: z.boolean().default(true),
  }),
});

// Lessons are the deck-backed workshop journeys --- what you actually run in a
// room. Each lesson assembles modules (plus deck-only parts like icebreakers
// and wrap-ups) into a tested sequence with timings.
const lessons = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "src/content/lessons" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    // Card/badge metadata: name the experience; duration and apparatus are
    // metadata, never part of the title.
    audience: z.string(),
    duration: z.string(),
    flavour: z.enum(["grid", "cutouts"]),
    // The deck(s) that back this lesson, in the order they should be offered.
    decks: z.array(z.object({ slug: z.string(), label: z.string() })),
    // Module slugs this lesson runs --- drives the "Used in" box on module
    // pages as well as the module links on the lesson page itself.
    modules: z.array(z.string()).default([]),
    // Hero image basename (without the hero- prefix) from src/assets/images.
    heroImage: z.string().optional(),
    order: z.number(),
    // Unlisted lessons are reachable only via direct links --- hidden from the
    // /lessons index, sitemap, and search.
    listed: z.boolean().default(true),
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

export const collections = { modules, lessons, news, events };
