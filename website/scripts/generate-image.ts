#!/usr/bin/env npx tsx
// Generate a single hero-style image using nano_banana and reference images.
//
// Examples:
//   npx tsx scripts/generate-image.ts "dice-based text generation in a classroom" public/assets/images/hero-intro.avif
//   npx tsx scripts/generate-image.ts cutouts-training public/assets/images/hero-cutouts-training
//   npm run generate:image -- "grid of tokens with dice and cutouts" public/assets/images/hero-grid-training.jpg
import { exec } from "node:child_process";
import { access, mkdir, unlink } from "node:fs/promises";
import { basename, dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execAsync = promisify(exec);

const __dirname = dirname(fileURLToPath(import.meta.url));
const EXAMPLE_IMAGES = [
  join(__dirname, "reference-intro.jpg"),
  join(__dirname, "reference-sampling.jpg"),
  join(__dirname, "reference-pretrained-generation.jpg"),
  join(__dirname, "reference-cutouts-training.jpg"),
  join(__dirname, "reference-grid-trigram.jpg"),
];

const BASE_PROMPT = `Task: create an illustrative image---with NO TEXT---for a teaching resource called LLMs Unplugged. Use these images for color & line style reference only. Do not include any pictures of computers.`;

const AVIF_QUALITY = 60;

async function convertToAvif(jpgPath: string, avifPath: string): Promise<boolean> {
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

async function generateImage(promptInput: string, outputPath: string): Promise<boolean> {
  const outputExt = extname(outputPath).toLowerCase();
  const outputDir = dirname(outputPath);
  const baseName =
    outputExt === ".avif" || outputExt === ".jpg" || outputExt === ".jpeg"
      ? basename(outputPath, outputExt)
      : basename(outputPath);

  const jpgPath = join(outputDir, `${baseName}.jpg`);
  const avifPath = join(outputDir, `${baseName}.avif`);
  const finalPath =
    outputExt === ".jpg" || outputExt === ".jpeg"
      ? jpgPath
      : outputExt === ".avif"
        ? avifPath
        : `${outputPath}.avif`;

  const prompt = `${BASE_PROMPT}\n\nPrompt: ${promptInput}`;

  console.log(`Generating: ${finalPath}`);
  console.log(`  Prompt: ${promptInput.slice(0, 80)}...`);

  const inputImageArgs = EXAMPLE_IMAGES.map((img) => `--input-image "${img}"`).join(" ");

  const cmd = [
    "nano_banana",
    `"${prompt}"`,
    inputImageArgs,
    `--output-dir "${outputDir}"`,
    `--output-filename "${baseName}"`,
    "--resolution 1K",
    "--aspect-ratio 16:9",
  ].join(" ");

  try {
    await mkdir(outputDir, { recursive: true });
    await execAsync(cmd, { shell: "/bin/sh" });
    if (outputExt === ".jpg" || outputExt === ".jpeg") {
      console.log(`  ✓ Generated ${finalPath}\n`);
      return true;
    }
    const converted = await convertToAvif(jpgPath, avifPath);
    if (converted) {
      console.log(`  ✓ Generated ${finalPath}\n`);
      return true;
    }
    return false;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`  ✗ Failed to generate image`);
    console.error(`    ${message}\n`);
    return false;
  }
}

function printUsage() {
  console.log("Usage: generate-image.ts <prompt...> <outputPath>");
  console.log("");
  console.log("Generate a hero image using a prompt, base prompt, and reference images.");
  console.log("");
  console.log("Arguments:");
  console.log("  prompt...     Prompt describing the desired image");
  console.log("  outputPath    Output file path (.avif or .jpg). If no extension, .avif is used.");
  console.log("");
  console.log("Examples:");
  console.log(
    '  generate-image.ts "dice-based text generation in a classroom" public/assets/images/hero-intro.avif',
  );
  console.log("  generate-image.ts cutouts-training public/assets/images/hero-cutouts-training");
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printUsage();
    process.exit(args.length === 0 ? 1 : 0);
  }

  if (args.length < 2) {
    console.error("Error: prompt and outputPath are required.\n");
    printUsage();
    process.exit(1);
  }

  /* eslint-disable no-await-in-loop */
  for (const img of EXAMPLE_IMAGES) {
    try {
      await access(img);
    } catch {
      console.error(`Missing reference image: ${img}`);
      process.exit(1);
    }
  }
  /* eslint-enable no-await-in-loop */

  // length >= 2 checked above
  const outputPath = args.at(-1)!;
  const promptInput = args.slice(0, -1).join(" ").trim();

  if (!promptInput) {
    console.error("Error: prompt cannot be empty.\n");
    printUsage();
    process.exit(1);
  }

  const ok = await generateImage(promptInput, outputPath);
  process.exit(ok ? 0 : 1);
}

main();
