#!/usr/bin/env npx tsx
// Export an astromotion deck to PDF.
//
// Pipeline: astro build -> astro preview -> decktape (generic plugin, key-driven
// navigation) -> Ghostscript compression. This wraps the same decktape command
// astromotion's own deck-pdf.mjs uses, but hardens the two things that bite on
// macOS:
//
//   1. decktape pulls in `puppeteer`, whose postinstall downloads a pinned
//      Chrome-for-Testing build. That download fails hard (and silently, under
//      npx) if the puppeteer cache holds a half-written entry. We set
//      PUPPETEER_SKIP_DOWNLOAD and drive a Chrome we locate ourselves instead.
//   2. The raw decktape PDF rasterises every slide, so a deck with full-bleed
//      backgrounds lands at 100 MB+. Ghostscript's /ebook preset cuts that to a
//      few MB with no visible loss at presentation scale.
//
// Usage: pnpm run pdf <slug> [output.pdf]
//   DECK_PDF_CHROME   override the Chrome/Chromium binary decktape drives
//   DECK_PDF_PORT     preview server port (default 4321)
//   --no-compress     skip Ghostscript and keep the raw decktape PDF
import { spawn, spawnSync } from "node:child_process";
import { existsSync, renameSync, unlinkSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const websiteDir = join(__dirname, "..");

const args = process.argv.slice(2);
const compress = !args.includes("--no-compress");
const positional = args.filter((a) => !a.startsWith("--"));
const slug = positional[0];
const output = resolve(positional[1] ?? `${slug}.pdf`);

if (!slug) {
  console.error("Usage: pnpm run pdf <slug> [output.pdf] [--no-compress]");
  process.exit(1);
}

const port = process.env.DECK_PDF_PORT ?? "4321";
const url = `http://localhost:${port}/decks/${slug}/`;

// decktape needs a real browser. Prefer an explicit override, then the usual
// macOS and Linux install locations. We pass this via --chrome-path so
// puppeteer never has to find (or download) one itself.
function findChrome(): string {
  const candidates = [
    process.env.DECK_PDF_CHROME,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/snap/bin/chromium",
  ].filter((c): c is string => Boolean(c));
  const found = candidates.find((c) => existsSync(c));
  if (!found) {
    console.error(
      "Could not find Chrome. Install Google Chrome or set DECK_PDF_CHROME to a browser binary.",
    );
    process.exit(1);
  }
  return found;
}

function run(command: string, cmdArgs: string[], env = process.env): void {
  const result = spawnSync(command, cmdArgs, {
    stdio: "inherit",
    cwd: websiteDir,
    env,
  });
  if (result.status !== 0) {
    console.error(`\n✗ ${command} failed (exit ${result.status})`);
    process.exit(result.status ?? 1);
  }
}

// decktape occasionally dies mid-capture with "Attempted to use detached
// Frame" --- a timing bug in its progress-bar code, not a problem with the
// deck. It's intermittent, so just retry the whole capture a few times.
function runWithRetry(
  command: string,
  cmdArgs: string[],
  attempts: number,
  env = process.env,
): void {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const result = spawnSync(command, cmdArgs, {
      stdio: "inherit",
      cwd: websiteDir,
      env,
    });
    if (result.status === 0) return;
    console.warn(
      `⚠ decktape attempt ${attempt}/${attempts} failed (exit ${result.status})` +
        (attempt < attempts ? " --- retrying" : ""),
    );
  }
  console.error(`\n✗ decktape failed after ${attempts} attempts`);
  process.exit(1);
}

async function waitForServer(target: string): Promise<void> {
  // Polling the server is inherently sequential --- each probe waits on the last.
  /* eslint-disable no-await-in-loop */
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(target);
      if (res.ok) return;
    } catch {
      // server not up yet
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  /* eslint-enable no-await-in-loop */
  console.error(`✗ Preview server never became ready at ${target}`);
  process.exit(1);
}

const chromePath = findChrome();

console.log(`Building site...`);
run("pnpm", ["exec", "astro", "build"]);

// `detached` puts the preview in its own process group so we can signal the
// whole tree on exit; `stdio: "ignore"` stops an undrained pipe filling during
// the long decktape run and wedging the script.
console.log(`Starting preview server on port ${port}...`);
const server = spawn("pnpm", ["exec", "astro", "preview", "--port", port], {
  stdio: "ignore",
  detached: true,
  cwd: websiteDir,
  env: { ...process.env, ASTRO_DISABLE_DEV_TOOLBAR: "true" },
});

const killServer = () => {
  try {
    if (server.pid) process.kill(-server.pid, "SIGTERM");
  } catch {
    // already gone
  }
};
process.on("exit", killServer);

await waitForServer(url);

// If we're compressing, decktape writes a raw file we hand to Ghostscript; the
// user only ever sees `output`.
const rawOutput = compress ? `${output}.raw.pdf` : output;

console.log(`Capturing slides with decktape...`);
runWithRetry(
  "npx",
  [
    "--yes",
    "decktape@3.16.1",
    "generic",
    // `=` form throughout: decktape's parser otherwise reads a flag-like value
    // as the next option and bails.
    "--key=ArrowRight",
    "--max-slides=500",
    "--size=1280x720",
    "--load-pause=5000",
    "--pause=2500",
    `--chrome-path=${chromePath}`,
    url,
    rawOutput,
  ],
  3,
  // Skip puppeteer's Chrome download entirely --- we supply --chrome-path.
  { ...process.env, PUPPETEER_SKIP_DOWNLOAD: "1" },
);

killServer();

if (compress) {
  const hasGhostscript = spawnSync("gs", ["--version"], { stdio: "ignore" }).status === 0;
  if (hasGhostscript) {
    console.log(`Compressing with Ghostscript...`);
    run("gs", [
      "-sDEVICE=pdfwrite",
      "-dCompatibilityLevel=1.4",
      "-dPDFSETTINGS=/ebook",
      "-dNOPAUSE",
      "-dQUIET",
      "-dBATCH",
      `-sOutputFile=${output}`,
      rawOutput,
    ]);
    unlinkSync(rawOutput);
  } else {
    console.warn("⚠ Ghostscript not found; keeping the uncompressed PDF.");
    renameSync(rawOutput, output);
  }
}

console.log(`\n✓ Wrote ${output}`);
process.exit(0);
