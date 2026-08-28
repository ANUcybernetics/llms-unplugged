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
    // Card/badge metadata, matching what lessons carry, so a visitor can tell
    // age fit, time and materials from the index rather than the page.
    audience: z.string(),
    duration: z.string(),
    // What the activity runs on. "sheets" is the whole-room search-sheet
    // format; "dice" is the apparatus-only warm-up.
    bases: z.array(z.enum(["grid", "cutouts", "booklet", "sheets", "dice"])).min(1),
    // How road-tested the module is. tested: part of a regularly delivered
    // lesson deck; piloted: run in a room at least once; experimental: written
    // but not yet run with a group.
    status: z.enum(["tested", "piloted", "experimental"]),
    // Unlisted modules are reachable only via direct links --- hidden from the
    // sidebar and the /modules index (see src/lib/modules.ts).
    listed: z.boolean().default(true),
  }),
});

// Lessons are the deck-backed workshop journeys --- what you actually run in a
// room. Each lesson assembles modules (plus deck-only parts like icebreakers
// and wrap-ups) into a tested sequence with timings. Lessons and talks share
// one page shape. A workshop (lesson) is a room
// building its own models, table by table; a talk is a room handed a model on
// search sheets and running it together from the stage. They are separate
// collections because each renders at the URL its path implies (/lessons/,
// /talks/), which the theme's llms.txt generator relies on.
const sessionSchema = z.object({
  title: z.string(),
  description: z.string(),
  // Card/badge metadata: name the experience; duration and apparatus are
  // metadata, never part of the title.
  audience: z.string(),
  duration: z.string(),
  flavour: z.enum(["grid", "cutouts", "sheets"]),
  // The deck(s) that back this lesson, in the order they should be offered.
  decks: z.array(z.object({ slug: z.string(), label: z.string() })),
  // Module slugs this lesson runs --- drives the "Used in" box on module
  // pages as well as the module links on the lesson page itself.
  modules: z.array(z.string()).default([]),
  // Hero image basename (without the hero- prefix) from src/assets/images.
  heroImage: z.string().optional(),
  order: z.number(),
  // tested: delivered many times; early-access: run at least once, timings
  // and materials may still shift. Shown as a badge so a lesson can be
  // listed before it has had the polish of the others.
  status: z.enum(["tested", "early-access"]).default("tested"),
  // Unlisted lessons are reachable only via direct links --- hidden from the
  // /lessons index, sitemap, and search.
  listed: z.boolean().default(true),
});

const lessons = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "src/content/lessons" }),
  schema: sessionSchema,
});

const talks = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "src/content/talks" }),
  schema: sessionSchema,
});

const news = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "src/content/news" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    author: z.string(),
    // What kind of post this is, so audience pages can pull the evergreen
    // pieces (essays, reports) without the dated ones (events, build notes).
    //   event: an upcoming session or booking
    //   report: what happened at a delivery
    //   essay: an argument or guidance piece, mostly for teachers
    //   build: a change to the materials or the site
    //   announcement: news that isn't any of the above (accreditation, etc.)
    kind: z.enum(["event", "report", "essay", "build", "announcement"]),
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

// Repo-level documents published on the site without a second copy. Today
// that's the curriculum mapping (docs/curriculum-mapping.md), rendered at
// /educators/curriculum/.
const docs = defineCollection({
  loader: glob({ pattern: "curriculum-mapping.md", base: "../docs" }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    author: z.string().optional(),
  }),
});

export const collections = { modules, lessons, talks, news, events, docs };
