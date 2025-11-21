#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const websiteDir = path.resolve(__dirname, "..");
const repoRoot = path.resolve(websiteDir, "..");
const handoutsOut = path.join(repoRoot, "handouts", "out");
const pdfTarget = path.join(websiteDir, "src", "assets", "pdfs");
const requiredPdf = "modules.pdf";

const log = (msg) => console.log(`[ensure-pdfs] ${msg}`);

const hasRequiredPdf = (dir) =>
  fs.existsSync(path.join(dir, requiredPdf));

const ensureHandoutsBuilt = () => {
  if (hasRequiredPdf(handoutsOut)) return;

  log(
    `Missing ${requiredPdf} in handouts/out; running \`make modules\` (handouts/)...`,
  );
  const result = spawnSync("make", ["modules"], {
    cwd: path.join(repoRoot, "handouts"),
    stdio: "inherit",
  });

  if (result.status !== 0) {
    throw new Error("`make modules` failed; PDFs could not be generated");
  }

  if (!hasRequiredPdf(handoutsOut)) {
    throw new Error(
      `Expected ${requiredPdf} after build but did not find it in ${handoutsOut}`,
    );
  }
};

const copyPdfs = () => {
  fs.mkdirSync(pdfTarget, { recursive: true });
  fs.cpSync(handoutsOut, pdfTarget, { recursive: true });
  log(`Copied PDFs from ${handoutsOut} to ${pdfTarget}`);
};

const ensureTargetPresent = () => {
  if (!fs.existsSync(pdfTarget)) {
    try {
      fs.symlinkSync(handoutsOut, pdfTarget, "dir");
      log(`Created symlink ${pdfTarget} -> ${handoutsOut}`);
      return;
    } catch (error) {
      log(
        `Symlink failed (${error.message}); falling back to copying PDFs instead.`,
      );
      copyPdfs();
      return;
    }
  }

  const stat = fs.lstatSync(pdfTarget);

  if (stat.isSymbolicLink()) {
    const resolved = fs.realpathSync(pdfTarget);
    if (resolved === handoutsOut) {
      log("Existing PDFs symlink is already pointing at handouts/out.");
      return;
    }

    throw new Error(
      `PDF path ${pdfTarget} is a symlink to ${resolved}; remove or update it.`,
    );
  }

  if (stat.isDirectory()) {
    if (hasRequiredPdf(pdfTarget)) {
      log("PDF directory already populated; leaving as-is.");
      return;
    }

    log(
      "PDF directory exists but missing required files; copying fresh PDFs into place.",
    );
    copyPdfs();
    return;
  }

  throw new Error(
    `${pdfTarget} exists but is not a directory or symlink; remove or rename it.`,
  );
};

const main = () => {
  if (hasRequiredPdf(pdfTarget)) {
    log("PDFs already present at src/assets/pdfs; nothing to do.");
    return;
  }

  ensureHandoutsBuilt();
  ensureTargetPresent();

  if (!hasRequiredPdf(pdfTarget)) {
    throw new Error(`Still missing ${requiredPdf} in ${pdfTarget}`);
  }
};

try {
  main();
} catch (error) {
  console.error(`[ensure-pdfs] ${error.message}`);
  process.exit(1);
}
