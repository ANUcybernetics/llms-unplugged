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
 * `--min-hue-sep` bans candidates within the given hue angle of an already
 * selected colour. Max-min ΔE alone does not give a palette you can scan,
 * because OKLab Euclidean distance counts a lightness step the same as a hue
 * step and visual search does not: two colours a comfortable ΔE apart but
 * separated mostly along L read as "that colour, darker" on a small glyph. The
 * unconstrained palettes bear this out — the tightest pairs were 79% and 85%
 * lightness — and they leave big hue holes while stacking three colours within
 * 5° of each other. A hue floor spends the ΔE budget on the axis that pops out.
 * It trades away min ΔE, so it has a ceiling: n colours cannot all be more than
 * 360/n apart, and the search runs out of candidates well before that bound.
 *
 * `--no-grey` seeds with black alone. The mid-grey anchor sits at the centre of
 * the a-b plane, so under a contrast floor it blocks exactly the low-chroma
 * darks — teal, olive — that a hue floor wants to reach. Dropping it costs one
 * swatch and buys back most of the ΔE the hue floor spends.
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
  minHueSep: number,
): { indices: number[]; history: number[] } {
  const { lab, count } = cs;
  const dists = new Float64Array(count).fill(Infinity);

  // Candidates ruled out by the hue floor. Kept separate from `dists` so the
  // reported per-step ΔE stays a true distance rather than a sentinel.
  const banned = new Uint8Array(count);
  const hueAt = (i: number): number =>
    ((Math.atan2(lab[i * 3 + 2], lab[i * 3 + 1]) * 180) / Math.PI + 360) % 360;
  const banNearHue = (h: number): void => {
    if (minHueSep <= 0) return;
    for (let i = 0; i < count; i++) {
      const raw = Math.abs(hueAt(i) - h);
      if (Math.min(raw, 360 - raw) < minHueSep) banned[i] = 1;
    }
  };

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
    banNearHue(hueAt(bestIdx));
    updateDists(lab[bestIdx * 3], lab[bestIdx * 3 + 1], lab[bestIdx * 3 + 2]);
  }

  while (indices.length < n) {
    let bestIdx = -1;
    let bestDist = -Infinity;
    for (let i = 0; i < count; i++) {
      if (!banned[i] && dists[i] > bestDist) { bestDist = dists[i]; bestIdx = i; }
    }
    // The hue floor can exhaust the candidate set: n colours cannot all be
    // more than 360/n degrees apart, and the printable gamut runs out sooner
    // than that. Fail loudly rather than emitting a short palette.
    if (bestIdx < 0) {
      throw new Error(
        `--min-hue-sep ${minHueSep} leaves no candidate for colour ` +
          `${indices.length + 1} of ${n}: every remaining colour is within ` +
          `${minHueSep}deg of one already chosen. Lower it or ask for fewer colours.`,
      );
    }
    indices.push(bestIdx);
    history.push(bestDist);
    banNearHue(hueAt(bestIdx));
    updateDists(lab[bestIdx * 3], lab[bestIdx * 3 + 1], lab[bestIdx * 3 + 2]);
  }

  return { indices, history };
}

// ---------- nameable selection ----------

// Centroids from the xkcd colour survey (Munroe 2010, ~200k respondents naming
// sRGB swatches free-form) --- the most widely-agreed English colour-naming
// data there is, and the same source the palettes in cutout-common.typ were
// hand-checked against. These are the survey's centroid for each word, i.e.
// the colour people mean when they say it.
const SURVEY_CENTROIDS: Readonly<Record<string, string>> = {
  black: "#000000",
  grey: "#929591",
  red: "#e50000",
  orange: "#f97306",
  brown: "#653700",
  olive: "#6e750e",
  green: "#15b01a",
  teal: "#029386",
  blue: "#0343df",
  navy: "#01153e",
  purple: "#7e1e9c",
  magenta: "#c20078",
  pink: "#ff81c0",
  maroon: "#650021",
  violet: "#9a0eea",
  turquoise: "#06c2ac",
  yellow: "#ffff14",
  mustard: "#ceb301",
  tan: "#d1b26f",
  lime: "#aaff32",
};

function hexToSrgb(hex: string): [number, number, number] {
  const v = parseInt(hex.slice(1), 16);
  return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255];
}

function hexToOklab(hex: string): Triple {
  return srgbToOklab(...hexToSrgb(hex));
}

function deltaE(p: Triple, q: Triple): number {
  return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
}

interface NamedSwatch {
  name: string;
  lab: Triple;
  /** OKLab ΔE from the survey centroid: how much the word is being stretched. */
  nameCost: number;
}

// The printable swatch for each word: the feasible candidate closest to the
// survey's centroid for it. A word whose centroid is already printable barely
// moves; one that isn't (yellow, at 1.1:1 against white) gets dragged until it
// is, and `nameCost` records how far --- which is the number that decides
// whether the word still fits what came out.
function nearestFeasible(
  cs: CandidateSet,
  centroid: Triple,
  centroidIsFeasible: boolean,
): { lab: Triple; nameCost: number } {
  // A word whose survey colour already prints is not an optimisation problem:
  // print the survey colour. Going to the nearest sampled point instead would
  // charge black a name cost of 0.06 purely because a random sampler never
  // lands on #000000.
  if (centroidIsFeasible) return { lab: centroid, nameCost: 0 };

  let best: Triple = [0, 0, 0];
  let bestD = Infinity;
  for (let i = 0; i < cs.count; i++) {
    const cand: Triple = [cs.lab[i * 3], cs.lab[i * 3 + 1], cs.lab[i * 3 + 2]];
    const d = deltaE(cand, centroid);
    if (d < bestD) {
      bestD = d;
      best = cand;
    }
  }
  return { lab: best, nameCost: bestD };
}

// Exhaustive max-min over the named swatches. Nameability is a hard filter
// applied before this runs, so the search itself only maximises distinctness;
// total name cost breaks ties, which keeps the plainer word when two subsets
// separate equally well. n is single digits and the term list is a couple of
// dozen, so the binomial is small enough to enumerate --- no greedy needed,
// and unlike the greedy path this actually returns the optimum.
function bestNamedSubset(
  swatches: readonly NamedSwatch[],
  n: number,
  minHueSep: number,
): { chosen: NamedSwatch[]; minDelta: number } {
  if (swatches.length < n) {
    throw new Error(
      `only ${swatches.length} words survive the nameability filter, ` +
        `need ${n}: raise --max-name-cost or add terms`,
    );
  }
  const combo: number[] = [];
  let best: NamedSwatch[] = [];
  let bestMin = -Infinity;
  let bestCost = Infinity;

  // A near-neutral has no hue worth separating, so the floor does not apply to
  // it --- black and grey would otherwise each veto a whole hue sector chosen
  // by the arctangent of their rounding error.
  const NEUTRAL_CHROMA = 0.03;
  const chromaOf = (s: NamedSwatch): number => Math.hypot(s.lab[1], s.lab[2]);
  const hueOf = (s: NamedSwatch): number =>
    (((Math.atan2(s.lab[2], s.lab[1]) * 180) / Math.PI) + 360) % 360;

  const evaluate = (): void => {
    let minD = Infinity;
    for (let i = 0; i < combo.length; i++) {
      for (let j = i + 1; j < combo.length; j++) {
        const a = swatches[combo[i]];
        const b = swatches[combo[j]];
        // The hue floor is what stops the search returning navy/blue/violet
        // and calling it a spread: those three sit ΔE 0.25 apart, almost all
        // of it lightness, and read as one colour at three brightnesses when
        // you are scanning a page for it.
        if (
          minHueSep > 0 &&
          chromaOf(a) >= NEUTRAL_CHROMA &&
          chromaOf(b) >= NEUTRAL_CHROMA
        ) {
          const raw = Math.abs(hueOf(a) - hueOf(b));
          if (Math.min(raw, 360 - raw) < minHueSep) return;
        }
        const d = deltaE(a.lab, b.lab);
        if (d < minD) minD = d;
      }
    }
    const cost = combo.reduce((sum, i) => sum + swatches[i].nameCost, 0);
    if (minD > bestMin || (minD === bestMin && cost < bestCost)) {
      bestMin = minD;
      bestCost = cost;
      best = combo.map((i) => swatches[i]);
    }
  };

  const recurse = (start: number): void => {
    if (combo.length === n) {
      evaluate();
      return;
    }
    // Prune: not enough words left to finish a subset.
    for (let i = start; i <= swatches.length - (n - combo.length); i++) {
      combo.push(i);
      recurse(i + 1);
      combo.pop();
    }
  };
  recurse(0);

  if (best.length === 0) {
    throw new Error(
      `no subset of ${n} words is ${minHueSep}deg apart in hue: lower ` +
        `--min-hue-sep, raise --max-name-cost to admit more words, or ask ` +
        `for fewer colours`,
    );
  }
  return { chosen: best, minDelta: bestMin };
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
    "no-grey": { type: "boolean", default: false },
    "min-white-contrast": { type: "string", default: "0" },
    "min-hue-sep": { type: "string", default: "0" },
    nameable: { type: "boolean", default: false },
    "max-name-cost": { type: "string", default: "0.12" },
    terms: { type: "string" },
    "dump-candidates": { type: "boolean", default: false },
  },
});

const n = parseInt(values.n!, 10);
const lMin = parseFloat(values["l-min"]!);
const lMax = parseFloat(values["l-max"]!);
const cMin = parseFloat(values["c-min"]!);
const nCandidates = parseInt(values.candidates!, 10);
const seed = parseInt(values.seed!, 10);
const noNeutrals = values["no-neutrals"]!;
const noGrey = values["no-grey"]!;
const minWhiteContrast = parseFloat(values["min-white-contrast"]!);
const minHueSep = parseFloat(values["min-hue-sep"]!);
const nameable = values.nameable!;
const maxNameCost = parseFloat(values["max-name-cost"]!);

const rng = mulberry32(seed);

// In nameable mode the words pin where each swatch lands, so the L and chroma
// windows have nothing to do: they would only stop a word reaching the colour
// it means. Black and grey are the obvious casualties of a chroma floor, but
// so is any dark word --- maroon and navy both sit under the usual L floor.
// The white-contrast floor stays, because that one is about the paper.
const effectiveLMin = nameable ? 0 : lMin;
const effectiveLMax = nameable ? 1 : lMax;
const effectiveCMin = nameable ? 0 : cMin;

process.stderr.write(`# Sampling ${nCandidates} sRGB points...\n`);
const cs = sampleCandidates(
  nCandidates,
  effectiveLMin,
  effectiveLMax,
  effectiveCMin,
  minWhiteContrast,
  rng,
);
process.stderr.write(
  `# Kept ${cs.count} candidates after L∈[${effectiveLMin},${effectiveLMax}], ` +
    `chroma ≥ ${effectiveCMin}` +
    (minWhiteContrast > 0
      ? `, contrast vs white ≥ ${minWhiteContrast}\n`
      : "\n"),
);

if (nameable) {
  const terms = values.terms
    ? values.terms.split(",").map((t) => t.trim())
    : Object.keys(SURVEY_CENTROIDS);

  const all: NamedSwatch[] = terms.map((name) => {
    const centroid = SURVEY_CENTROIDS[name];
    if (!centroid) {
      throw new Error(
        `no survey centroid for "${name}" --- known words: ` +
          Object.keys(SURVEY_CENTROIDS).join(", "),
      );
    }
    const feasible =
      contrastWithWhite(relativeLuminance(...hexToSrgb(centroid))) >=
      minWhiteContrast;
    const { lab, nameCost } = nearestFeasible(
      cs,
      hexToOklab(centroid),
      feasible,
    );
    return { name, lab, nameCost };
  });

  process.stderr.write(
    "\n# How far each word has to stretch to become printable (OKLab ΔE from\n" +
      "# its survey centroid). A word over the cost ceiling is one the printed\n" +
      "# swatch no longer looks like, so it is dropped rather than renamed:\n",
  );
  for (const s of [...all].sort((a, b) => a.nameCost - b.nameCost)) {
    const verdict = s.nameCost <= maxNameCost ? "  keep" : "  DROP";
    process.stderr.write(
      `#  ${s.name.padEnd(10)} ΔE=${s.nameCost.toFixed(4)}${verdict}\n`,
    );
  }

  const survivors = all.filter((s) => s.nameCost <= maxNameCost);

  // Hand the surviving words to check_palette_print.py, which re-measures them
  // through a CMYK profile and picks the subset that survives the press. This
  // script cannot do that itself: the round trip needs an ICC transform, and
  // the distances that matter are the printed ones, not these.
  if (values["dump-candidates"]) {
    for (const s of survivors) {
      const [L, a, b] = s.lab;
      // Back to sRGB via OKLab's inverse, so the consumer needs no colour code.
      const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
      const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
      const q = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
      const rgb = [
        4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * q,
        -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * q,
        -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * q,
      ].map((v) => Math.round(srgbGamma(Math.max(0, Math.min(1, v))) * 255));
      process.stdout.write(
        `${s.name},#${rgb.map((v) => v.toString(16).padStart(2, "0")).join("")},` +
          `${s.nameCost.toFixed(4)}\n`,
      );
    }
    process.exit(0);
  }
  const { chosen, minDelta } = bestNamedSubset(survivors, n, minHueSep);

  const withHue = chosen
    .map((s) => ({
      ...s,
      L: s.lab[0],
      C: Math.hypot(s.lab[1], s.lab[2]),
      h: (((Math.atan2(s.lab[2], s.lab[1]) * 180) / Math.PI) + 360) % 360,
    }))
    .sort((a, b) => a.h - b.h);

  process.stderr.write(
    `\n# Chosen ${n} of ${survivors.length} nameable words, ` +
      `min pairwise ΔE = ${minDelta.toFixed(4)}\n`,
  );

  // The tightest pairs, so it is obvious which two words are carrying the risk
  // and whether the gap between them is hue (fine) or lightness (not).
  const pairs = chosen
    .flatMap((a, i) =>
      chosen.slice(i + 1).map((b) => {
        const dL = Math.abs(a.lab[0] - b.lab[0]);
        return { a, b, d: deltaE(a.lab, b.lab), lShare: dL / deltaE(a.lab, b.lab) };
      }),
    )
    .sort((p, q) => p.d - q.d);
  process.stderr.write("# Tightest pairs (share of the gap that is lightness):\n");
  for (const p of pairs.slice(0, 5)) {
    process.stderr.write(
      `#   ${p.a.name.padEnd(8)} / ${p.b.name.padEnd(8)} ` +
        `ΔE=${p.d.toFixed(4)}  L-share ${(p.lShare * 100).toFixed(0)}%\n`,
    );
  }

  process.stdout.write(
    "// Algorithmically generated palette: exhaustive max-min OKLab ΔE over\n" +
      "// colours pinned to English colour words, so every swatch is both far\n" +
      "// from the others and recognisable as the word used to call it out.\n" +
      `// N=${n}, min pairwise ΔE = ${minDelta.toFixed(3)}, worst name ΔE = ` +
      `${Math.max(...chosen.map((s) => s.nameCost)).toFixed(3)}.\n` +
      "// Regenerate with: node cli/scripts/generate_palette.ts --nameable " +
      `--n ${n} --min-white-contrast ${minWhiteContrast} ` +
      `--max-name-cost ${maxNameCost}\n`,
  );
  process.stdout.write("#let palette = (\n");
  process.stdout.write("  colors: (\n");
  for (const s of withHue) {
    const light = s.L > LIGHT_THRESHOLD;
    const swatch = s.C < 0.002
      ? `luma(${Math.round(srgbGamma(s.L ** 3) * 255)})`
      : `oklch(${(s.L * 100).toFixed(1)}%, ${s.C.toFixed(3)}, ${Math.round(s.h)}deg)`;
    process.stdout.write(
      `    (color: ${swatch}, light: ${light}, name: "${s.name}"), ` +
        `// name ΔE ${s.nameCost.toFixed(3)}\n`,
    );
  }
  process.stdout.write("  ),\n)\n");
  process.exit(0);
}

// OKLab lightness of the mid-grey anchor. For a neutral the OKLab transform
// collapses to L = cbrt(linear value) — the rows of M1 sum to 1, so l=m=s=v —
// which is how GREY_L is converted back to an sRGB byte for the emitted
// palette below. Emitting the seeded grey rather than a hand-picked one
// matters: the greedy search keeps chromatic colours away from the seed, so a
// printed grey that sits somewhere else has no such guarantee.
const GREY_L = 0.55;

const seeds: readonly Triple[] = noNeutrals
  ? []
  : noGrey
    ? [[0.0, 0.0, 0.0]] // black only
    : [
        [0.0, 0.0, 0.0], // pure black
        [GREY_L, 0.0, 0.0], // mid grey
      ];

function srgbGamma(v: number): number {
  return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
}

const greyByte = Math.round(srgbGamma(GREY_L ** 3) * 255);

const { indices, history } = greedyMaxMin(cs, n, seeds, minHueSep);

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
    noGrey
      ? "// A black neutral seeds the search so chromatic colours\n"
      : "// Black + mid-grey neutrals seed the search so chromatic colours\n",
  );
  process.stdout.write("// can't collapse onto the greyscale axis.\n");
}
if (minHueSep > 0) {
  process.stdout.write(
    `// Chromatic entries are at least ${minHueSep}deg apart in hue, so the\n`,
  );
  process.stdout.write(
    "// palette separates on the axis that pops out at a glance rather than\n",
  );
  process.stdout.write("// spending its ΔE budget on lightness.\n");
}
process.stdout.write(
  `// Regenerate with: node cli/scripts/generate_palette.ts --n ${n} --l-min ${lMin} --l-max ${lMax}` +
    (minWhiteContrast > 0 ? ` --min-white-contrast ${minWhiteContrast}` : "") +
    (minHueSep > 0 ? ` --min-hue-sep ${minHueSep}` : "") +
    (noGrey ? " --no-grey" : "") +
    "\n",
);
process.stdout.write("#let palette = (\n");
if (!noNeutrals) {
  process.stdout.write(
    noGrey
      ? "  // Neutral (always dark enough for white text)\n"
      : "  // Neutrals (always dark enough for white text)\n",
  );
  process.stdout.write("  (color: luma(0), light: false), // black\n");
  if (!noGrey) {
    process.stdout.write(
      `  (color: luma(${greyByte}), light: false), // mid grey (OKLab L=${GREY_L})\n`,
    );
  }
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
