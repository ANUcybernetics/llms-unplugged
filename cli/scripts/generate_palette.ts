#!/usr/bin/env node
/**
 * Generate a maximally perceptually-distinct categorical colour palette
 * using Glasbey-style greedy max-min ΔE selection in OKLab.
 *
 * Algorithm:
 *   1. Sample candidate colours uniformly in sRGB, convert to OKLab, filter
 *      by lightness and chroma to exclude unprintable extremes and near-greys.
 *   2. Optionally seed the selected set with neutral anchors (black, mid-grey)
 *      so chromatic colours can't collapse onto the greyscale axis.
 *   3. Iteratively pick the candidate whose minimum OKLab ΔE to the already-
 *      selected set is largest, until N chromatic colours have been chosen.
 *
 * OKLab Euclidean ΔE is the perceptual distance: OKLab is designed to be
 * perceptually uniform, so plain Euclidean is the recommended metric (no
 * CIEDE2000 corrections needed).
 *
 * Output: each palette entry is a `(color: ..., light: <bool>)` tuple. The
 * `light` flag is set for OKLab L > LIGHT_THRESHOLD (0.65), meaning the
 * Typst renderer should pair the colour with black text/stroke rather than
 * white text and no stroke. Wider L bounds are achievable because the
 * renderer adapts; the default bounds are [0.32, 0.92]. The floor sits at
 * 0.32 (not lower) because CMYK print compresses dark chromatic colours
 * toward black — at L<0.30 a deep blue or purple reads as black on paper
 * even though OKLab ΔE looks comfortable on screen.
 *
 * `--min-white-contrast` additionally rejects any candidate whose WCAG
 * contrast ratio against white falls below the given value. Set it to 4.5 to
 * get a palette every entry of which is dark enough to read as plain text on
 * white paper — needed wherever a colour is used for the text itself at small
 * sizes, rather than only as a box fill behind white text.
 *
 * Run (requires Node 22.7+ for native .ts support; Node 24+ default-on):
 *   node cli/scripts/generate_palette.ts
 *   node cli/scripts/generate_palette.ts --n 30 --l-min 0.32 --l-max 0.92
 *   node cli/scripts/generate_palette.ts --n 12 --min-white-contrast 4.5
 */

// OKLab L threshold above which a colour is "light" — Typst pairs these
// with black text on the box and a thin black stroke on the free-standing
// word. Below the threshold, the colour reads cleanly with white text on
// the box and no stroke for the free-standing word. 0.65 is a rough
// WCAG-3:1 crossover for black-on-light vs white-on-dark.
const LIGHT_THRESHOLD = 0.65;

import { parseArgs } from "node:util";

// ---------- OKLab forward conversion (Björn Ottosson, 2020) ----------

const M1 = [
  [0.4122214708, 0.5363325363, 0.0514459929],
  [0.2119034982, 0.6806995451, 0.1073969566],
  [0.0883024619, 0.2817188376, 0.6299787005],
] as const;

const M2 = [
  [0.2104542553, 0.7936177850, -0.0040720468],
  [1.9779984951, -2.4285922050, 0.4505937099],
  [0.0259040371, 0.7827717662, -0.8086757660],
] as const;

function srgbLinearize(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function srgbToOklab(
  r: number,
  g: number,
  b: number,
): [number, number, number] {
  const lr = srgbLinearize(r);
  const lg = srgbLinearize(g);
  const lb = srgbLinearize(b);
  const l_ = Math.cbrt(M1[0][0] * lr + M1[0][1] * lg + M1[0][2] * lb);
  const m_ = Math.cbrt(M1[1][0] * lr + M1[1][1] * lg + M1[1][2] * lb);
  const s_ = Math.cbrt(M1[2][0] * lr + M1[2][1] * lg + M1[2][2] * lb);
  return [
    M2[0][0] * l_ + M2[0][1] * m_ + M2[0][2] * s_,
    M2[1][0] * l_ + M2[1][1] * m_ + M2[1][2] * s_,
    M2[2][0] * l_ + M2[2][1] * m_ + M2[2][2] * s_,
  ];
}

// ---------- seedable PRNG (Mulberry32) ----------

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
  };
}

// ---------- candidate sampling ----------

interface CandidateSet {
  lab: Float64Array; // length = count * 3; stride 3 for (L, a, b)
  count: number;
}

// WCAG relative luminance, used for the --min-white-contrast filter. OKLab L
// is perceptual lightness, which is not the same quantity as the luminance
// WCAG contrast is computed from — a saturated green and a saturated blue at
// equal OKLab L differ by several stops of contrast ratio.
function relativeLuminance(r: number, g: number, b: number): number {
  const lr = srgbLinearize(r);
  const lg = srgbLinearize(g);
  const lb = srgbLinearize(b);
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

function contrastWithWhite(luminance: number): number {
  return 1.05 / (luminance + 0.05);
}

function sampleCandidates(
  nSamples: number,
  lMin: number,
  lMax: number,
  cMin: number,
  minWhiteContrast: number,
  rng: () => number,
): CandidateSet {
  const buf = new Float64Array(nSamples * 3);
  let kept = 0;
  for (let i = 0; i < nSamples; i++) {
    const [sr, sg, sb] = [rng(), rng(), rng()];
    const [L, a, b] = srgbToOklab(sr, sg, sb);
    const C = Math.hypot(a, b);
    const contrast = contrastWithWhite(relativeLuminance(sr, sg, sb));
    if (L >= lMin && L <= lMax && C >= cMin && contrast >= minWhiteContrast) {
      buf[kept * 3] = L;
      buf[kept * 3 + 1] = a;
      buf[kept * 3 + 2] = b;
      kept++;
    }
  }
  return { lab: buf.subarray(0, kept * 3), count: kept };
}

// ---------- greedy max-min selection ----------

type Triple = readonly [number, number, number];

function greedyMaxMin(
  cs: CandidateSet,
  n: number,
  seeds: readonly Triple[],
): { indices: number[]; history: number[] } {
  const { lab, count } = cs;
  const dists = new Float64Array(count).fill(Infinity);

  const updateDists = (sL: number, sa: number, sb: number): void => {
    for (let i = 0; i < count; i++) {
      const dL = lab[i * 3] - sL;
      const da = lab[i * 3 + 1] - sa;
      const db = lab[i * 3 + 2] - sb;
      const d = Math.sqrt(dL * dL + da * da + db * db);
      if (d < dists[i]) dists[i] = d;
    }
  };

  const indices: number[] = [];
  const history: number[] = [];

  if (seeds.length > 0) {
    for (const [sL, sa, sb] of seeds) updateDists(sL, sa, sb);
  } else {
    // No seeds: bootstrap with the point furthest from the candidate centroid.
    let mL = 0, ma = 0, mb = 0;
    for (let i = 0; i < count; i++) {
      mL += lab[i * 3];
      ma += lab[i * 3 + 1];
      mb += lab[i * 3 + 2];
    }
    mL /= count; ma /= count; mb /= count;
    let bestIdx = 0;
    let bestDist = -Infinity;
    for (let i = 0; i < count; i++) {
      const dL = lab[i * 3] - mL;
      const da = lab[i * 3 + 1] - ma;
      const db = lab[i * 3 + 2] - mb;
      const d = Math.sqrt(dL * dL + da * da + db * db);
      if (d > bestDist) { bestDist = d; bestIdx = i; }
    }
    indices.push(bestIdx);
    history.push(Infinity);
    updateDists(lab[bestIdx * 3], lab[bestIdx * 3 + 1], lab[bestIdx * 3 + 2]);
  }

  while (indices.length < n) {
    let bestIdx = 0;
    let bestDist = -Infinity;
    for (let i = 0; i < count; i++) {
      if (dists[i] > bestDist) { bestDist = dists[i]; bestIdx = i; }
    }
    indices.push(bestIdx);
    history.push(bestDist);
    updateDists(lab[bestIdx * 3], lab[bestIdx * 3 + 1], lab[bestIdx * 3 + 2]);
  }

  return { indices, history };
}

// ---------- CLI ----------

const { values } = parseArgs({
  options: {
    n: { type: "string", default: "28" },
    "l-min": { type: "string", default: "0.32" },
    "l-max": { type: "string", default: "0.92" },
    "c-min": { type: "string", default: "0.05" },
    candidates: { type: "string", default: "200000" },
    seed: { type: "string", default: "42" },
    "no-neutrals": { type: "boolean", default: false },
    "min-white-contrast": { type: "string", default: "0" },
  },
});

const n = parseInt(values.n!, 10);
const lMin = parseFloat(values["l-min"]!);
const lMax = parseFloat(values["l-max"]!);
const cMin = parseFloat(values["c-min"]!);
const nCandidates = parseInt(values.candidates!, 10);
const seed = parseInt(values.seed!, 10);
const noNeutrals = values["no-neutrals"]!;
const minWhiteContrast = parseFloat(values["min-white-contrast"]!);

const rng = mulberry32(seed);

process.stderr.write(`# Sampling ${nCandidates} sRGB points...\n`);
const cs = sampleCandidates(nCandidates, lMin, lMax, cMin, minWhiteContrast, rng);
process.stderr.write(
  `# Kept ${cs.count} candidates after L∈[${lMin},${lMax}], chroma ≥ ${cMin}` +
    (minWhiteContrast > 0
      ? `, contrast vs white ≥ ${minWhiteContrast}\n`
      : "\n"),
);

// OKLab lightness of the mid-grey anchor. For a neutral the OKLab transform
// collapses to L = cbrt(linear value) — the rows of M1 sum to 1, so l=m=s=v —
// which is how GREY_L is converted back to an sRGB byte for the emitted
// palette below. Emitting the seeded grey rather than a hand-picked one
// matters: the greedy search keeps chromatic colours away from the seed, so a
// printed grey that sits somewhere else has no such guarantee.
const GREY_L = 0.55;

const seeds: readonly Triple[] = noNeutrals
  ? []
  : [
      [0.0, 0.0, 0.0], // pure black
      [GREY_L, 0.0, 0.0], // mid grey
    ];

function srgbGamma(v: number): number {
  return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
}

const greyByte = Math.round(srgbGamma(GREY_L ** 3) * 255);

const { indices, history } = greedyMaxMin(cs, n, seeds);

interface LCH { L: number; C: number; h: number; }
const lch: LCH[] = indices.map((i): LCH => {
  const L = cs.lab[i * 3];
  const a = cs.lab[i * 3 + 1];
  const b = cs.lab[i * 3 + 2];
  return {
    L,
    C: Math.hypot(a, b),
    h: (((Math.atan2(b, a) * 180) / Math.PI) + 360) % 360,
  };
});

// Stderr: per-step history so you can see where ΔE crosses out of "clearly
// distinct" and pick a sensible cutoff.
process.stderr.write("\n# Min OKLab ΔE when each colour was added:\n");
process.stderr.write(
  "#   (monotonically decreasing; ≥0.15 generous, ≥0.10 clearly distinct,\n",
);
process.stderr.write("#    ≥0.05 just-noticeable, <0.05 risky)\n");
for (let i = 0; i < history.length; i++) {
  const d = history[i];
  const { L, C, h } = lch[i];
  const marker = d >= 0.1 ? "  " : d >= 0.05 ? " ◇" : " ✗";
  const dStr = isFinite(d) ? `ΔE=${d.toFixed(4)}` : "(first)   ";
  process.stderr.write(
    `#  ${String(i + 1).padStart(2)}: ${dStr}${marker}  ` +
      `oklch(${(L * 100).toFixed(1)}%, ${C.toFixed(3)}, ${Math.round(h)}deg)\n`,
  );
}
const minDelta = history[history.length - 1];
process.stderr.write(`\n# Final min pairwise ΔE = ${minDelta.toFixed(4)}\n`);

// Stdout: Typst palette, sorted by hue for readability.
const sorted = [...lch].sort((a, b) => a.h - b.h);

process.stdout.write(
  "// Algorithmically generated palette: Glasbey-style greedy max-min OKLab\n",
);
process.stdout.write(
  `// ΔE. N=${n} chromatic colours, min pairwise ΔE = ${minDelta.toFixed(3)}.\n`,
);
process.stdout.write(
  `// Each entry is (color, light) — light: true means OKLab L > ${LIGHT_THRESHOLD}\n`,
);
process.stdout.write(
  "// and the Typst renderer should use black text on the box and a thin\n",
);
process.stdout.write(
  "// black stroke on the free-standing word (vs white text / no stroke).\n",
);
if (!noNeutrals) {
  process.stdout.write(
    "// Black + mid-grey neutrals seed the search so chromatic colours\n",
  );
  process.stdout.write("// can't collapse onto the greyscale axis.\n");
}
process.stdout.write(
  `// Regenerate with: node cli/scripts/generate_palette.ts --n ${n} --l-min ${lMin} --l-max ${lMax}` +
    (minWhiteContrast > 0
      ? ` --min-white-contrast ${minWhiteContrast}\n`
      : "\n"),
);
process.stdout.write("#let palette = (\n");
if (!noNeutrals) {
  process.stdout.write("  // Neutrals (always dark enough for white text)\n");
  process.stdout.write("  (color: luma(0), light: false), // black\n");
  process.stdout.write(
    `  (color: luma(${greyByte}), light: false), // mid grey (OKLab L=${GREY_L})\n`,
  );
  process.stdout.write("\n");
  process.stdout.write("  // Chromatic (sorted by hue)\n");
}
for (const { L, C, h } of sorted) {
  const light = L > LIGHT_THRESHOLD;
  process.stdout.write(
    `  (color: oklch(${(L * 100).toFixed(1)}%, ${C.toFixed(3)}, ${Math.round(h)}deg), light: ${light}),\n`,
  );
}
process.stdout.write(")\n");
