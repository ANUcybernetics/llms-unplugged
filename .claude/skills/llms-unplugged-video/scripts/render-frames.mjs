// Render an overlay page frame by frame with headless Chrome and pipe the PNGs
// into ffmpeg. The page is a pure function of time: it exposes
//
//   window.setup(opts)        opts = { script, assets, video, bg } as file:// URLs
//                             (whichever of --script/--assets/--video/--bg were given)
//   window.renderFrame(t)     draw the frame for time t (seconds in the timeline)
//   window.seekVideo(local)   optional: seek an embedded <video> to `local` seconds
//
// and this script seeks, screenshots and encodes. See SKILL.md for the
// contract's reasoning and assets/overlay-template.html for a page that
// satisfies it.
//
//   render-frames.mjs preview <page.html> <t>...        one PNG per time into --out
//   render-frames.mjs all <page.html> --from <t> --to <t> [--workers N]
//                                                        chunks + chunks.txt into --out
//   render-frames.mjs still <page.html> <out.png>        one frame after setup (title cards)
//   render-frames.mjs chunk <page.html> <first> <count> <out.mp4>   (used by `all`)
//
// Options (all modes): --script <json> --assets <dir> --video <mp4>
//   --video-offset <s>  seconds into the timeline where the video file starts
//   --fps <n>           default 25; match the source recording
//   --origin <t>        first frame of the finished video, for snapping --from/--to
//                       to the same grid the assembly uses (default: --from)
//   --out <dir>         default out/video/render
//   --width/--height    default 1920x1080
//
// Times are mm:ss.ss, h:mm:ss.ss or plain seconds. Chrome is found the way
// astromotion finds it (ASTROMOTION_CHROME_PATH overrides), with
// ASTROMOTION_CHROME_ARGS for extra flags such as --no-sandbox. LLMSU_ROOT
// points at the llms-unplugged checkout when this runs from outside it.
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.LLMSU_ROOT || resolve(HERE, "../../../..");
const WEBSITE = resolve(ROOT, "website");
const require = createRequire(resolve(WEBSITE, "package.json"));
const puppeteer = require("puppeteer-core");
const { findChrome, chromeArgs } = await import(
  pathToFileURL(resolve(WEBSITE, "node_modules/astromotion/src/chrome.mjs")).href
);

// ---------- arguments ----------
const argv = process.argv.slice(2);
const opts = {
  fps: 25,
  width: 1920,
  height: 1080,
  workers: 6,
  videoOffset: 0,
  out: resolve(ROOT, "out/video/render"),
};
const positional = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (!a.startsWith("--")) {
    positional.push(a);
    continue;
  }
  const key = a.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  opts[key] = argv[++i];
}
for (const k of ["fps", "width", "height", "workers"]) opts[k] = parseInt(opts[k], 10);
opts.videoOffset = parseFloat(opts.videoOffset);
const [mode, pagePath, ...rest] = positional;

export function ts(s) {
  if (typeof s === "number") return s;
  const parts = String(s).split(":").map(Number);
  return parts.reduce((acc, p) => acc * 60 + p, 0);
}
const fmt = (t) => `${Math.floor(t / 60)}-${(t % 60).toFixed(2).padStart(5, "0")}`;

function usage(msg) {
  if (msg) console.error(msg);
  console.error(
    "usage: render-frames.mjs preview <page> <t>... | all <page> --from <t> --to <t> | still <page> <out.png> | chunk <page> <first> <count> <out.mp4>",
  );
  process.exit(msg ? 1 : 0);
}
if (!mode || !pagePath) usage();

// ---------- the browser ----------
async function openPage() {
  const executablePath = process.env.CHROME || findChrome();
  if (!executablePath) usage("no Chrome found: set ASTROMOTION_CHROME_PATH");
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: [
      "--disable-gpu",
      "--allow-file-access-from-files",
      "--font-render-hinting=none",
      "--hide-scrollbars",
      ...chromeArgs(),
    ],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: opts.width, height: opts.height, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => console.error("page error:", e.message));
  page.on("console", (m) => {
    if (m.type() === "error") console.error("console:", m.text());
  });
  await page.goto(pathToFileURL(resolve(pagePath)).href, { waitUntil: "load" });
  const setupOpts = {};
  for (const k of ["script", "assets", "video", "bg"])
    if (opts[k]) setupOpts[k] = pathToFileURL(resolve(opts[k])).href;
  await page.evaluate((o) => window.setup(o), setupOpts);
  await page.evaluate(() => document.fonts.ready);
  return { browser, page };
}

async function renderFrame(page, t) {
  await page.evaluate(
    async (t, off) => {
      if (window.seekVideo) await window.seekVideo(t - off);
      await window.renderFrame(t);
    },
    t,
    opts.videoOffset,
  );
  return page.screenshot({ type: "png", captureBeyondViewport: false });
}

// section boundaries snapped to the frame grid that starts at --origin
function section() {
  if (!opts.from || !opts.to) usage("all/chunk need --from and --to");
  const origin = ts(opts.origin ?? opts.from);
  const snap = (t) => origin + Math.round((ts(t) - origin) * opts.fps) / opts.fps;
  const sec0 = snap(opts.from),
    sec1 = snap(opts.to);
  return { sec0, sec1, nFrames: Math.round((sec1 - sec0) * opts.fps) };
}

// ---------- modes ----------
if (mode === "still") {
  const [out] = rest;
  if (!out) usage("still needs an output path");
  const { browser, page } = await openPage();
  if (opts.at !== undefined) await page.evaluate((t) => window.renderFrame(t), ts(opts.at));
  writeFileSync(out, await page.screenshot({ type: "png" }));
  await browser.close();
  console.log("wrote", out);
} else if (mode === "preview") {
  if (rest.length === 0) usage("preview needs at least one time");
  const { browser, page } = await openPage();
  mkdirSync(opts.out, { recursive: true });
  for (const arg of rest) {
    const t = ts(arg);
    const f = resolve(opts.out, `preview-${fmt(t)}.png`);
    writeFileSync(f, await renderFrame(page, t));
    console.log("wrote", f);
  }
  await browser.close();
} else if (mode === "chunk") {
  const first = parseInt(rest[0], 10),
    count = parseInt(rest[1], 10),
    out = rest[2];
  const { sec0 } = section();
  const { browser, page } = await openPage();
  const ff = spawn(
    "ffmpeg",
    [
      "-y",
      "-loglevel",
      "error",
      "-f",
      "image2pipe",
      "-framerate",
      String(opts.fps),
      "-i",
      "-",
      "-c:v",
      "libx264",
      "-preset",
      "fast",
      "-crf",
      "14",
      "-pix_fmt",
      "yuv420p",
      "-g",
      String(opts.fps),
      out,
    ],
    { stdio: ["pipe", "inherit", "inherit"] },
  );
  const t0 = Date.now();
  for (let i = 0; i < count; i++) {
    const t = sec0 + (first + i + 0.5) / opts.fps; // sample each frame at its midpoint
    const png = await renderFrame(page, t);
    if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once("drain", r));
    if (i % 250 === 0)
      console.log(`${out}: ${i}/${count} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on("close", r));
  await browser.close();
  console.log(`${out}: done ${count} frames in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
} else if (mode === "all") {
  const { sec0, sec1, nFrames } = section();
  const dir = resolve(opts.out, "chunks");
  mkdirSync(dir, { recursive: true });
  const per = Math.ceil(nFrames / opts.workers);
  const passthrough = argv.filter(
    (a, i) =>
      (a.startsWith("--") && a !== "--workers") ||
      (i > 0 && argv[i - 1].startsWith("--") && argv[i - 1] !== "--workers"),
  );
  const jobs = [],
    list = [];
  for (let w = 0; w * per < nFrames; w++) {
    const first = w * per,
      count = Math.min(per, nFrames - first);
    const out = resolve(dir, `chunk-${String(w).padStart(2, "0")}.mp4`);
    list.push(`file '${out}'`);
    jobs.push(
      new Promise((res, rej) => {
        const p = spawn(
          process.execPath,
          [
            fileURLToPath(import.meta.url),
            "chunk",
            pagePath,
            String(first),
            String(count),
            out,
            ...passthrough,
          ],
          { stdio: "inherit" },
        );
        p.on("close", (c) => (c === 0 ? res() : rej(new Error(`chunk ${w} failed`))));
      }),
    );
  }
  await Promise.all(jobs);
  writeFileSync(resolve(dir, "chunks.txt"), list.join("\n") + "\n");
  console.log(
    `rendered ${nFrames} frames (${sec0.toFixed(2)} -> ${sec1.toFixed(2)} s, ${(nFrames / opts.fps).toFixed(1)}s) into ${jobs.length} chunks under ${dir}`,
  );
} else {
  usage(`unknown mode ${mode}`);
}
