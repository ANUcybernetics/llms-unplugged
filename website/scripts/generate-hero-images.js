#!/usr/bin/env node
/**
 * Generate hero images for the website using nano_banana.
 *
 * Usage:
 *   node generate-hero-images.js           # all (static, topics, lessons)
 *   node generate-hero-images.js static    # index, about, news, contact, faq
 *   node generate-hero-images.js topics    # from _data/topics.json
 *   node generate-hero-images.js lessons   # from lessons/*.md
 *   node generate-hero-images.js static topics  # combine types
 *
 * Data sources:
 *   - static: title/description from page frontmatter
 *   - topics: id/title/description from src/_data/topics.json
 *   - lessons: title/description from src/lessons/*.md frontmatter
 *
 * Output: src/assets/images/hero-{slug}.jpg (1K, 16:9)
 */
import { execSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";

const SCRIPTS_DIR = import.meta.dirname;
const SRC_DIR = join(SCRIPTS_DIR, "../src");
const LESSONS_DIR = join(SRC_DIR, "lessons");
const DATA_DIR = join(SRC_DIR, "_data");
const OUTPUT_DIR = join(SRC_DIR, "assets/images");
const EXAMPLE_IMAGES = [
  join(SCRIPTS_DIR, "example.png"),
  join(SCRIPTS_DIR, "example2.png"),
  join(SCRIPTS_DIR, "example3.png"),
];

const BASE_PROMPT = `create an illustrative image---with NO TEXT---for a teaching resource called LLMs Unplugged.`;

const STATIC_PAGES = [
  { file: "index.md", slug: "index" },
  { file: "about.md", slug: "about" },
  { file: "news.njk", slug: "news" },
  { file: "contact.md", slug: "contact" },
  { file: "faq.md", slug: "faq" },
];

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function generateImage(slug, title, description) {
  const outputFilename = `hero-${slug}`;
  const prompt = `${BASE_PROMPT} Title: ${title}, Description: ${description}`;

  console.log(`Generating: ${outputFilename}.jpg`);
  console.log(`  Title: ${title}`);
  console.log(`  Description: ${description}`);

  const inputImageArgs = EXAMPLE_IMAGES.map(
    (img) => `--input-image "${img}"`,
  ).join(" ");

  const cmd = [
    "nano_banana",
    `"${prompt}"`,
    inputImageArgs,
    `--output-dir "${OUTPUT_DIR}"`,
    `--output-filename "${outputFilename}"`,
    "--resolution 1K",
    "--aspect-ratio 16:9",
  ].join(" ");

  try {
    execSync(cmd, { stdio: "inherit", shell: true });
    console.log(`  ✓ Generated ${outputFilename}.jpg\n`);
    return true;
  } catch (error) {
    console.error(`  ✗ Failed to generate ${outputFilename}.jpg`);
    console.error(`    ${error.message}\n`);
    return false;
  }
}

function generateStaticPageImages() {
  console.log("=== Static Pages ===\n");

  for (const page of STATIC_PAGES) {
    const filePath = join(SRC_DIR, page.file);
    const content = readFileSync(filePath, "utf-8");
    const { data: frontmatter } = matter(content);

    const { title, description } = frontmatter;
    if (!title || !description) {
      console.log(`Skipping ${page.file}: missing title or description`);
      continue;
    }

    generateImage(page.slug, title, description);
  }
}

function generateTopicImages() {
  console.log("=== Topics ===\n");

  const topicsPath = join(DATA_DIR, "topics.json");
  const topics = JSON.parse(readFileSync(topicsPath, "utf-8"));

  console.log(`Found ${topics.length} topics\n`);

  for (const topic of topics) {
    generateImage(topic.id, topic.title, topic.description);
  }
}

function generateLessonImages() {
  console.log("=== Lessons ===\n");

  const lessonFiles = readdirSync(LESSONS_DIR).filter((f) => f.endsWith(".md"));

  console.log(`Found ${lessonFiles.length} lessons\n`);

  for (const file of lessonFiles) {
    const filePath = join(LESSONS_DIR, file);
    const content = readFileSync(filePath, "utf-8");
    const { data: frontmatter } = matter(content);

    const { title, description } = frontmatter;
    if (!title || !description) {
      console.log(`Skipping ${file}: missing title or description`);
      continue;
    }

    const slug = slugify(title);
    generateImage(slug, title, description);
  }
}

function main() {
  const args = process.argv.slice(2);
  const validTypes = ["static", "topics", "lessons", "all"];

  if (args.length === 0 || args.includes("all")) {
    generateStaticPageImages();
    generateTopicImages();
    generateLessonImages();
  } else {
    for (const arg of args) {
      if (!validTypes.includes(arg)) {
        console.error(`Unknown type: ${arg}`);
        console.error(`Valid types: ${validTypes.join(", ")}`);
        process.exit(1);
      }

      if (arg === "static") generateStaticPageImages();
      if (arg === "topics") generateTopicImages();
      if (arg === "lessons") generateLessonImages();
    }
  }
}

main();
