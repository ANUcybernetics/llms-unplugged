#!/usr/bin/env node
import { execSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { join, basename } from "node:path";
import matter from "gray-matter";

const SCRIPTS_DIR = import.meta.dirname;
const LESSONS_DIR = join(SCRIPTS_DIR, "../src/lessons");
const OUTPUT_DIR = join(SCRIPTS_DIR, "../src/assets/images");
const EXAMPLE_IMAGES = [
  join(SCRIPTS_DIR, "example.png"),
  join(SCRIPTS_DIR, "example2.png"),
  join(SCRIPTS_DIR, "example3.png"),
];

const BASE_PROMPT = `create an illustrative image---with NO TEXT---for a teaching resource called LLMs Unplugged.`;

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function generateHeroImages() {
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
    } catch (error) {
      console.error(`  ✗ Failed to generate ${outputFilename}.jpg`);
      console.error(`    ${error.message}\n`);
    }
  }
}

generateHeroImages();
