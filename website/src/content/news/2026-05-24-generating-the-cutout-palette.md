---
title: Generating the cutout palette
date: 2026-05-24
author: Ben Swift
published: false
description: The cutout palette is now algorithmically generated, with 30 perceptually
  distinct colours instead of 14 hand-picked ones.
---

The cutouts variant of the [Training lesson](/lessons/training) leans hard on
colour as a fast filter. Every word has its own colour, repeated wherever the
word appears, so your eye can scan "what's the colour of the word I just
wrote?" before you read any text. The colour does the first pass; the word
confirms.

Until last month the palette held eight colours, hand-picked in OKLCH at a
fixed lightness so white text would read on every coloured box. Eight is not
many. _Green Eggs and Ham_ has about sixty unique tokens trying to share
eight buckets, which works out to seven or eight words sharing each colour.
Plenty of colour collisions, plenty of moments where you have to slow down
and re-read.

I bumped it to 14 (still hand-tuned, two lightness levels) and that helped,
but really this is a solved problem and I was reinventing it badly.

The new palette is algorithmically generated using
[Glasbey-style](https://en.wikipedia.org/wiki/Glasbey_palette) greedy
max-min selection in OKLab. The algorithm samples 200,000 candidate colours
uniformly from the sRGB gamut, converts them to OKLab (which is perceptually
uniform by design, so plain Euclidean distance corresponds to perceived
difference), then iteratively picks the candidate that's furthest from every
colour already chosen. Black and mid-grey are seeded as anchors so the
algorithm can't accidentally allocate "chromatic" colours that drift into
greyscale.

The result is 30 swatches with a minimum pairwise OKLab ΔE of 0.137. That
sits comfortably above the 0.10 "clearly distinct" floor, with headroom for
the perceptual loss you get from CMYK conversion, paper colour, and ambient
lighting. Print eats some of your distinguishability budget, and not always
in proportion to OKLab distance.

A first pass let candidates roam from L=0.20 upwards and gave a slightly
tighter min ΔE of 0.145. It also produced a dark blue at L≈0.275 that came
out of the printer looking like black. CMYK reaches saturated deep blue by
leaning hard on the K plate, so a small ink-balance shift collapses the
colour onto pure black; the seeded black anchor protects against collisions
in OKLab, not in CMYK. Raising the L floor to 0.32 trims four near-black
candidates, costs about 0.008 of min ΔE, and leaves no chromatic entry
close enough to merge with K in print.

Each palette entry is tagged as "light" or "dark" based on its OKLab L. The
Typst renderer pairs light entries with black text on the coloured box and a
thin black stroke on the free-standing word; dark entries get white text and
no stroke. That adaptive treatment is what lets the palette extend up to
L≈0.92, where the very light pastels live. Without it, every fill would
have to be dark enough for white text to read on, capping the usable
lightness range and so the achievable colour count.

The palette isn't colour-vision-deficiency safe. CVD-safe palettes max out
around 8-12 distinct colours, which would undo the whole exercise. If
you're working with a CVD-affected student, the
[grid version](/lessons/training) of the lesson uses no colour at all and
reaches the same understanding.

The script lives in the repo at `cli/scripts/generate_palette.ts`: pure
TypeScript, Node 22.7+ native, no `tsx` or `npm install` required. The Typst
file that produces the cutouts has the resulting OKLCH triples pasted in
directly, with a comment pointing at the script for regeneration. Different
N or different lightness bounds, one line regenerates the palette.

The [tools page](/tools#cutouts) has the four ready-to-print PDFs (_Green
Eggs and Ham_ and _The Cat in the Hat_, each in bigram and trigram), all
freshly built with the new palette. If you've used the cutouts before,
you'll notice the difference straight away. If you haven't, the
[previous post](/news/2026-05-07-cutouts-glow-up) explains the activity.
