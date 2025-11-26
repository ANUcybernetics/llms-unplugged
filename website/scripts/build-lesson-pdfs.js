#!/usr/bin/env node
import { execSync } from "child_process";
import { readdirSync, mkdirSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "../..");
const lessonsDir = join(__dirname, "../src/lessons");
const outputDir = join(__dirname, "../src/assets/pdfs");

const packageJson = JSON.parse(
  readFileSync(join(__dirname, "../package.json"), "utf-8"),
);
const version = packageJson.version;

mkdirSync(outputDir, { recursive: true });

const typFiles = readdirSync(lessonsDir).filter((f) => f.endsWith(".typ"));

console.log(`Building ${typFiles.length} lesson PDFs...`);

const pdfPaths = [];

for (const typFile of typFiles) {
  const baseName = typFile.replace(".typ", "");
  const inputPath = join(lessonsDir, typFile);
  const outputPath = join(outputDir, `${baseName}.pdf`);

  console.log(`  ${baseName}.typ → ${baseName}.pdf`);

  try {
    // SOURCE_DATE_EPOCH=0 ensures reproducible builds (no timestamp metadata)
    execSync(
      `SOURCE_DATE_EPOCH=0 typst compile --root "${projectRoot}" --input version="v${version}" "${inputPath}" "${outputPath}"`,
      { stdio: "inherit" },
    );
    pdfPaths.push(outputPath);
  } catch {
    console.error(`  Failed to compile ${typFile}`);
    process.exit(1);
  }
}

// Combine all lesson PDFs into lessons.pdf
// --deterministic-id ensures reproducible builds
const combinedPath = join(outputDir, "lessons.pdf");
console.log(`\nCombining into lessons.pdf...`);

try {
  execSync(
    `qpdf --deterministic-id --empty --pages ${pdfPaths.join(" ")} -- "${combinedPath}"`,
    { stdio: "inherit" },
  );
} catch {
  console.error(`  Failed to create combined PDF`);
  process.exit(1);
}

console.log(`\nDone. PDFs written to ${outputDir}`);
