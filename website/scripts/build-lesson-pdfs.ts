#!/usr/bin/env npx tsx
import { execSync } from "node:child_process";
import { readdirSync, mkdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "../..");
const lessonsDir = join(__dirname, "../lessons");
const outputDir = join(__dirname, "../public/assets/pdfs");

interface PackageJson {
  version: string;
}

const packageJson: PackageJson = JSON.parse(
  readFileSync(join(__dirname, "../package.json"), "utf-8"),
);
const version = packageJson.version;

mkdirSync(outputDir, { recursive: true });

const typFiles = readdirSync(lessonsDir).filter((f) => f.endsWith(".typ"));

console.log(`Building ${typFiles.length} lesson PDFs...`);

const pdfPaths: string[] = [];

for (const typFile of typFiles) {
  const baseName = typFile.replace(".typ", "");
  const inputPath = join(lessonsDir, typFile);
  const outputPath = join(outputDir, `${baseName}.pdf`);

  console.log(`  ${baseName}.typ → ${baseName}.pdf`);

  try {
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

console.log(`\nCombining into lessons.pdf...`);
const combinedPath = join(outputDir, "lessons.pdf");

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
