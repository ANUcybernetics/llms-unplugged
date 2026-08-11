#!/usr/bin/env -S uv run --with fonttools --with uharfbuzz python
"""Bake the "LLMs Unplugged" wordmark to SVG path data.

Shapes the title in Public Sans Bold (the same subset the in-browser booklet
compiler uses) and writes scripts/wordmark-path.ts, which the lockup mark in
generate-logo-svgs.ts draws. Run from website/; only needed if the title or the
typeface changes.
"""

from pathlib import Path

import uharfbuzz as hb
from fontTools.misc.transform import Transform
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

FONT = Path("src/assets/fonts/PublicSans-Bold-subset.otf")
OUT = Path("scripts/wordmark-path.ts")
TEXT = "LLMs Unplugged"
EM = 1000

font_file = TTFont(FONT)
upem = font_file["head"].unitsPerEm
cap_height = round(font_file["OS/2"].sCapHeight * EM / upem)
glyph_set = font_file.getGlyphSet()
glyph_order = font_file.getGlyphOrder()

# Shape with HarfBuzz so kerning and ligatures match what a text renderer does.
face = hb.Face(hb.Blob.from_file_path(str(FONT)))
buf = hb.Buffer()
buf.add_str(TEXT)
buf.guess_segment_properties()
hb.shape(hb.Font(face), buf, {"kern": True, "liga": True})

scale = EM / upem
parts: list[str] = []
pen_x = 0
for info, pos in zip(buf.glyph_infos, buf.glyph_positions, strict=True):
    pen = SVGPathPen(glyph_set, ntos=lambda v: f"{v:.1f}")
    # Flip y so the outlines are in SVG coordinates with the baseline at y=0.
    placement = Transform(scale, 0, 0, -scale, (pen_x + pos.x_offset) * scale, 0)
    glyph_set[glyph_order[info.codepoint]].draw(TransformPen(pen, placement))
    if commands := pen.getCommands():
        parts.append(commands)
    pen_x += pos.x_advance

advance = pen_x * scale
OUT.write_text(f'''// Outlines for the "LLMs Unplugged" wordmark, set in Public Sans Bold.
//
// Baked to paths rather than referenced as a font so the lockup renders
// identically everywhere --- as an <img>, in print, on a sticker, dropped into
// Figma --- with no font to load. (title-logo.svg's Google Fonts @import does
// not work when that SVG is used as an <img>: external resources are blocked in
// that context.)
//
// Regenerate from website/ with: ./scripts/extract-wordmark.py
//
// Coordinates are in a {EM}-unit em with the baseline at y=0 and y growing
// downwards, the SVG convention.

/** Advance width of the whole wordmark, in {EM}-unit em coordinates. */
export const WORDMARK_ADVANCE = {advance:.1f};

/** Cap height of Public Sans, in {EM}-unit em coordinates. */
export const WORDMARK_CAP_HEIGHT = {cap_height};

/** Glyph outlines, baseline at y=0, first glyph starting at x=0. */
export const WORDMARK_PATH =
  "{"".join(parts)}";
''')
print(f"Wrote {OUT} ({advance:.1f} units wide, cap height {cap_height})")
