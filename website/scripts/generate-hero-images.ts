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
const TOPICS_DIR = join(ROOT_DIR, "topics");
const OUTPUT_DIR = join(ROOT_DIR, "public/assets/images");
const EXAMPLE_IMAGES = [
  join(__dirname, "example.png"),
  join(__dirname, "example2.png"),
  join(__dirname, "example3.png"),
];

const BASE_PROMPT = `Task: create an illustrative image---with NO TEXT---for a teaching resource called LLMs Unplugged. Use these images for color & line style reference only. Do not include any pictures of computers.`;

const STATIC_PAGES: Record<string, string> = {
  index: "index.md",
  about: "about.md",
  faq: "faq.md",
  educators: "educators.md",
};

interface ImageTask {
  slug: string;
  title: string;
  description: string;
}

async function generateImage(task: ImageTask): Promise<boolean> {
  const { slug, title, description } = task;
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

async function getStaticPageTask(slug: string): Promise<ImageTask | null> {
  const file = STATIC_PAGES[slug];
  if (!file) {
    console.error(`Unknown static page: ${slug}`);
    return null;
  }

  const filePath = join(ROOT_DIR, file);
  try {
    const content = await readFile(filePath, "utf-8");
    const { data: frontmatter } = matter(content);

    const title = frontmatter.title;
    const description =
      frontmatter.description || frontmatter.hero?.tagline || null;

    if (title && description) {
      return { slug, title, description };
    } else {
      console.log(`Skipping ${file}: missing title or description`);
      return null;
    }
  } catch {
    console.log(`Skipping ${file}: file not found`);
    return null;
  }
}

async function getStaticPageTasks(): Promise<ImageTask[]> {
  const tasks: ImageTask[] = [];

  for (const slug of Object.keys(STATIC_PAGES)) {
    const task = await getStaticPageTask(slug);
    if (task) {
      tasks.push(task);
    }
  }

  return tasks;
}

async function getTopicTasks(): Promise<ImageTask[]> {
  const tasks: ImageTask[] = [];
  const files = await readdir(TOPICS_DIR);
  const mdFiles = files.filter((f) => f.endsWith(".md") && f !== "index.md");

  for (const file of mdFiles) {
    const filePath = join(TOPICS_DIR, file);
    const content = await readFile(filePath, "utf-8");
    const { data: frontmatter } = matter(content);

    if (frontmatter.title && frontmatter.description) {
      tasks.push({
        slug: file.replace(".md", ""),
        title: frontmatter.title,
        description: frontmatter.description,
      });
    } else {
      console.log(`Skipping ${file}: missing title or description`);
    }
  }

  return tasks;
}

async function getLessonTasks(): Promise<ImageTask[]> {
  const tasks: ImageTask[] = [];
  const files = await readdir(LESSONS_DIR);
  const mdFiles = files.filter((f) => f.endsWith(".md") && f !== "index.md");

  for (const file of mdFiles) {
    const filePath = join(LESSONS_DIR, file);
    const content = await readFile(filePath, "utf-8");
    const { data: frontmatter } = matter(content);

    if (frontmatter.title && frontmatter.description) {
      tasks.push({
        slug: file.replace(".md", ""),
        title: frontmatter.title,
        description: frontmatter.description,
      });
    } else {
      console.log(`Skipping ${file}: missing title or description`);
    }
  }

  return tasks;
}

async function main() {
  const args = process.argv.slice(2);
  const groupTypes = ["static", "topics", "lessons", "all"];
  const staticPageSlugs = Object.keys(STATIC_PAGES);
  const validTypes = [...groupTypes, ...staticPageSlugs];

  const requestedTypes =
    args.length === 0 || args.includes("all")
      ? ["static", "topics", "lessons"]
      : args;

  for (const arg of requestedTypes) {
    if (!validTypes.includes(arg)) {
      console.error(`Unknown type: ${arg}`);
      console.error(`Valid types: ${validTypes.join(", ")}`);
      process.exit(1);
    }
  }

  const allTasks: ImageTask[] = [];

  const requestedStaticSlugs = requestedTypes.filter((t) =>
    staticPageSlugs.includes(t),
  );

  if (requestedTypes.includes("static")) {
    console.log("=== Static Pages ===\n");
    const tasks = await getStaticPageTasks();
    console.log(`Found ${tasks.length} static pages\n`);
    allTasks.push(...tasks);
  } else if (requestedStaticSlugs.length > 0) {
    console.log("=== Static Pages ===\n");
    for (const slug of requestedStaticSlugs) {
      const task = await getStaticPageTask(slug);
      if (task) {
        allTasks.push(task);
      }
    }
    console.log(`Found ${allTasks.length} static pages\n`);
  }

  if (requestedTypes.includes("topics")) {
    console.log("=== Topics ===\n");
    const tasks = await getTopicTasks();
    console.log(`Found ${tasks.length} topics\n`);
    allTasks.push(...tasks);
  }

  if (requestedTypes.includes("lessons")) {
    console.log("=== Lessons ===\n");
    const tasks = await getLessonTasks();
    console.log(`Found ${tasks.length} lessons\n`);
    allTasks.push(...tasks);
  }

  console.log(`\nGenerating ${allTasks.length} images in parallel...\n`);

  const results = await Promise.all(allTasks.map(generateImage));
  const succeeded = results.filter(Boolean).length;
  const failed = results.length - succeeded;

  console.log(`\nDone: ${succeeded} succeeded, ${failed} failed`);

  if (failed > 0) {
    process.exit(1);
  }
}

main();
