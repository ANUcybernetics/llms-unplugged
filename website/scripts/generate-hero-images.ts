#!/usr/bin/env npx tsx
import { exec } from "node:child_process";
import { readdir, readFile, unlink } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import matter from "gray-matter";

const execAsync = promisify(exec);

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, "..");
const LESSONS_DIR = join(ROOT_DIR, "lessons");
const NEWS_DIR = join(ROOT_DIR, "news");
const OUTPUT_DIR = join(ROOT_DIR, "public/assets/images");
const EXAMPLE_IMAGES = [
  join(__dirname, "reference-intro.jpg"),
  join(__dirname, "reference-sampling.jpg"),
  join(__dirname, "reference-pretrained-generation.jpg"),
  join(__dirname, "reference-bucket-training.jpg"),
  join(__dirname, "reference-grid-trigram.jpg"),
];

const BASE_PROMPT = `Task: create an illustrative image---with NO TEXT---for a teaching resource called LLMs Unplugged. Use these images for color & line style reference only. Do not include any pictures of computers.`;

const AVIF_QUALITY = 60;

interface LessonInfo {
  slug: string;
  title: string;
  description: string;
}

async function getPageInfo(
  slug: string,
  directory: string,
): Promise<LessonInfo | null> {
  const filePath = join(directory, `${slug}.md`);
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
    console.error(`Page not found: ${slug}`);
    return null;
  }
}

async function getAllSlugs(directory: string): Promise<string[]> {
  const files = await readdir(directory);
  return files
    .filter((f) => f.endsWith(".md") && f !== "index.md")
    .map((f) => f.replace(".md", ""));
}

async function convertToAvif(jpgPath: string): Promise<boolean> {
  const avifPath = jpgPath.replace(".jpg", ".avif");

  try {
    await execAsync(`avifenc -q ${AVIF_QUALITY} "${jpgPath}" "${avifPath}"`);
    await unlink(jpgPath);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`  ✗ Failed to convert to AVIF: ${message}`);
    return false;
  }
}

async function generateImage(
  lesson: LessonInfo,
  outputPrefix = "hero-",
): Promise<boolean> {
  const { slug, title, description } = lesson;
  const outputFilename = `${outputPrefix}${slug}`;
  const jpgPath = join(OUTPUT_DIR, `${outputFilename}.jpg`);
  const prompt = `${BASE_PROMPT}\n\nLesson Name: ${title}\n\nDescription: ${description}`;

  console.log(`Generating: ${outputFilename}.avif`);
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
    const converted = await convertToAvif(jpgPath);
    if (converted) {
      console.log(`  ✓ Generated ${outputFilename}.avif\n`);
      return true;
    }
    return false;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`  ✗ Failed to generate ${outputFilename}`);
    console.error(`    ${message}\n`);
    return false;
  }
}

function printUsage() {
  console.log("Usage: generate-hero-images.ts [--all | slug1 slug2 ...]");
  console.log("");
  console.log("Generate hero images for lessons or news.");
  console.log("");
  console.log("Options:");
  console.log("  --all       Generate images for all lessons");
  console.log("  --news      Generate images for news posts");
  console.log("  slug1 ...   Generate images for specific lessons (by slug)");
  console.log("");
  console.log("Examples:");
  console.log("  generate-hero-images.ts intro");
  console.log("  generate-hero-images.ts --news 2025-11-20-website-launch");
  console.log("  generate-hero-images.ts --news --all");
  console.log("  generate-hero-images.ts grid-training grid-generation");
  console.log("  generate-hero-images.ts --all");
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printUsage();
    if (args.length === 0) {
      console.log("\nAvailable lessons:");
      const slugs = await getAllSlugs(LESSONS_DIR);
      slugs.forEach((s) => console.log(`  ${s}`));
      console.log("\nAvailable news posts:");
      const newsSlugs = await getAllSlugs(NEWS_DIR);
      newsSlugs.forEach((s) => console.log(`  ${s}`));
    }
    process.exit(args.length === 0 ? 1 : 0);
  }

  const isNews = args.includes("--news");
  const directory = isNews ? NEWS_DIR : LESSONS_DIR;
  const outputPrefix = isNews ? "hero-news-" : "hero-";

  const filteredArgs = args.filter((a) => a !== "--news");
  const slugs = filteredArgs.includes("--all")
    ? await getAllSlugs(directory)
    : filteredArgs;

  const lessons: LessonInfo[] = [];
  for (const slug of slugs) {
    if (slug === "--all") continue;
    const info = await getPageInfo(slug, directory);
    if (info) {
      lessons.push(info);
    }
  }

  if (lessons.length === 0) {
    console.error("No valid lessons to process");
    process.exit(1);
  }

  console.log(`\nGenerating ${lessons.length} image(s)...\n`);

  const results = await Promise.all(
    lessons.map((lesson) => generateImage(lesson, outputPrefix)),
  );
  const succeeded = results.filter(Boolean).length;
  const failed = results.length - succeeded;

  console.log(`Done: ${succeeded} succeeded, ${failed} failed`);

  if (failed > 0) {
    process.exit(1);
  }
}

main();
