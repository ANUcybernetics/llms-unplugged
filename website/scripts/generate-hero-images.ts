#!/usr/bin/env npx tsx
import { exec } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import matter from "gray-matter";

const execAsync = promisify(exec);

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, "..");
const LESSONS_DIR = join(ROOT_DIR, "lessons");
const OUTPUT_DIR = join(ROOT_DIR, "public/assets/images");
const EXAMPLE_IMAGES = [
  join(__dirname, "example.png"),
  join(__dirname, "example2.png"),
  join(__dirname, "example3.png"),
];

const BASE_PROMPT = `Task: create an illustrative image---with NO TEXT---for a teaching resource called LLMs Unplugged. Use these images for color & line style reference only. Do not include any pictures of computers.`;

interface LessonInfo {
  slug: string;
  title: string;
  description: string;
}

async function getLessonInfo(slug: string): Promise<LessonInfo | null> {
  const filePath = join(LESSONS_DIR, `${slug}.md`);
  try {
    const content = await readFile(filePath, "utf-8");
    const { data: frontmatter } = matter(content);

    if (frontmatter.title && frontmatter.description) {
      return {
        slug,
        title: frontmatter.title,
        description: frontmatter.description,
      };
    } else {
      console.error(`Skipping ${slug}: missing title or description`);
      return null;
    }
  } catch {
    console.error(`Lesson not found: ${slug}`);
    return null;
  }
}

async function getAllLessonSlugs(): Promise<string[]> {
  const files = await readdir(LESSONS_DIR);
  return files
    .filter((f) => f.endsWith(".md") && f !== "index.md")
    .map((f) => f.replace(".md", ""));
}

async function generateImage(lesson: LessonInfo): Promise<boolean> {
  const { slug, title, description } = lesson;
  const outputFilename = `hero-${slug}`;
  const prompt = `${BASE_PROMPT}\n\nLesson Name: ${title}\n\nDescription: ${description}`;

  console.log(`Generating: ${outputFilename}.jpg`);
  console.log(`  Title: ${title}`);
  console.log(`  Description: ${description.slice(0, 60)}...`);

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
    await execAsync(cmd, { shell: true });
    console.log(`  ✓ Generated ${outputFilename}.jpg\n`);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`  ✗ Failed to generate ${outputFilename}.jpg`);
    console.error(`    ${message}\n`);
    return false;
  }
}

function printUsage() {
  console.log("Usage: generate-hero-images.ts [--all | slug1 slug2 ...]");
  console.log("");
  console.log("Generate hero images for lessons.");
  console.log("");
  console.log("Options:");
  console.log("  --all       Generate images for all lessons");
  console.log("  slug1 ...   Generate images for specific lessons (by slug)");
  console.log("");
  console.log("Examples:");
  console.log("  generate-hero-images.ts intro");
  console.log("  generate-hero-images.ts grid-training grid-generation");
  console.log("  generate-hero-images.ts --all");
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printUsage();
    if (args.length === 0) {
      console.log("\nAvailable lessons:");
      const slugs = await getAllLessonSlugs();
      slugs.forEach((s) => console.log(`  ${s}`));
    }
    process.exit(args.length === 0 ? 1 : 0);
  }

  const slugs = args.includes("--all") ? await getAllLessonSlugs() : args;

  const lessons: LessonInfo[] = [];
  for (const slug of slugs) {
    if (slug === "--all") continue;
    const info = await getLessonInfo(slug);
    if (info) {
      lessons.push(info);
    }
  }

  if (lessons.length === 0) {
    console.error("No valid lessons to process");
    process.exit(1);
  }

  console.log(`\nGenerating ${lessons.length} image(s)...\n`);

  const results = await Promise.all(lessons.map(generateImage));
  const succeeded = results.filter(Boolean).length;
  const failed = results.length - succeeded;

  console.log(`Done: ${succeeded} succeeded, ${failed} failed`);

  if (failed > 0) {
    process.exit(1);
  }
}

main();
