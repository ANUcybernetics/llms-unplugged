#!/usr/bin/env npx tsx
import { exec } from "node:child_process";
import { readdir, stat, unlink } from "node:fs/promises";
import { join, dirname, extname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execAsync = promisify(exec);

const __dirname = dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = join(__dirname, "..", "public/assets/images");
const AVIF_QUALITY = 60;

async function convertToAvif(inputPath: string): Promise<boolean> {
  const ext = extname(inputPath);
  const outputPath = inputPath.replace(ext, ".avif");
  const filename = basename(inputPath);

  try {
    await execAsync(`avifenc -q ${AVIF_QUALITY} "${inputPath}" "${outputPath}"`);

    const [inputStat, outputStat] = await Promise.all([stat(inputPath), stat(outputPath)]);

    const savings = ((1 - outputStat.size / inputStat.size) * 100).toFixed(1);
    console.log(`✓ ${filename} → ${basename(outputPath)} (${savings}% smaller)`);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`✗ ${filename}: ${message}`);
    return false;
  }
}

async function main() {
  const deleteOriginals = process.argv.includes("--delete");

  console.log(`Converting images in ${IMAGES_DIR}`);
  console.log(`AVIF quality: ${AVIF_QUALITY}\n`);

  const files = await readdir(IMAGES_DIR);
  const sourceImages = files.filter((f) =>
    [".jpg", ".jpeg", ".png"].includes(extname(f).toLowerCase()),
  );

  if (sourceImages.length === 0) {
    console.log("No JPG/PNG images found to convert.");
    return;
  }

  console.log(`Found ${sourceImages.length} image(s) to convert...\n`);

  const results = await Promise.all(sourceImages.map((f) => convertToAvif(join(IMAGES_DIR, f))));

  const succeeded = results.filter(Boolean).length;
  const failed = results.length - succeeded;

  console.log(`\nDone: ${succeeded} succeeded, ${failed} failed`);

  if (deleteOriginals && succeeded > 0) {
    console.log("\nDeleting original files...");
    await Promise.all(
      sourceImages.filter((_, i) => results[i]).map((f) => unlink(join(IMAGES_DIR, f))),
    );
    console.log(`Deleted ${succeeded} original file(s)`);
  }

  if (failed > 0) {
    process.exit(1);
  }
}

main();
