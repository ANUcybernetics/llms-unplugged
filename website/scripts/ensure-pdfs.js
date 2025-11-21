#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const websiteDir = path.resolve(__dirname, "..");
const repoRoot = path.resolve(websiteDir, "..");
const handoutsDir = path.join(repoRoot, "handouts");
const handoutsOut = path.join(handoutsDir, "out");
const pdfTarget = path.join(websiteDir, "src", "assets", "pdfs");
const requiredPdf = "modules.pdf";

const log = (msg) => console.log(`[ensure-pdfs] ${msg}`);
const warn = (msg) => console.warn(`[ensure-pdfs] ⚠️  ${msg}`);

const hasRequiredPdf = (dir) => fs.existsSync(path.join(dir, requiredPdf));

const buildModules = () => {
  log("Building modules.pdf...");
  const result = spawnSync("make", ["modules"], {
    cwd: handoutsDir,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    throw new Error("`make modules` failed");
  }

  if (!hasRequiredPdf(handoutsOut)) {
    throw new Error(`Expected ${requiredPdf} after build but not found`);
  }
};

const copyPdf = () => {
  const src = path.join(handoutsOut, requiredPdf);
  const dest = path.join(pdfTarget, requiredPdf);
  fs.mkdirSync(pdfTarget, { recursive: true });
  fs.copyFileSync(src, dest);
  log(`Copied ${requiredPdf} to ${pdfTarget}`);
};

const checkGitStatus = () => {
  const result = spawnSync(
    "git",
    ["diff", "--quiet", "--", path.join(pdfTarget, requiredPdf)],
    { cwd: repoRoot },
  );
  return result.status === 0;
};

const main = () => {
  // Always rebuild to check for changes
  buildModules();

  const targetPdf = path.join(pdfTarget, requiredPdf);
  const sourcePdf = path.join(handoutsOut, requiredPdf);

  if (!fs.existsSync(targetPdf)) {
    copyPdf();
    warn(`${requiredPdf} was missing - please commit the new PDF`);
    return;
  }

  // Compare file contents
  const sourceContent = fs.readFileSync(sourcePdf);
  const targetContent = fs.readFileSync(targetPdf);

  if (!sourceContent.equals(targetContent)) {
    copyPdf();
    warn(`${requiredPdf} has changed - please commit the updated PDF`);
    return;
  }

  log(`${requiredPdf} is up to date`);
};

try {
  main();
} catch (error) {
  console.error(`[ensure-pdfs] ${error.message}`);
  process.exit(1);
}
