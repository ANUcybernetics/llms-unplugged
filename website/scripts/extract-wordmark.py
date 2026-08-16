#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = ["fonttools", "uharfbuzz"]
# ///
"""Bake the brand marks' lettering to SVG path data.

Two faces:

- the title "LLMs Unplugged" in Public Sans Bold, the ANU brand face, for the
  horizontal lockup;
- the five token labels in Monaspace Argon Bold --- the family the printed
  booklet sets its wordmark in --- for the bricks of the word mark.

Both are read from the system font directory, the same sources
subset-booklet-fonts.py builds its subsets from.

Baking to outlines rather than referencing the families by name means the SVGs
carry their own letterforms. They then render identically as an `<img>`, in
print, or dropped into a design tool --- none of which will load a font for
them. Writes scripts/wordmark-path.ts. Run from website/; only needed if the
title, the token list or either typeface changes.
"""

import json
from pathlib import Path

import uharfbuzz as hb
from fontTools.misc.transform import Transform
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

OUT = Path("scripts/wordmark-path.ts")
EM = 1000
FONT_DIR = Path.home() / ".local" / "share" / "fonts"

TITLE_FONT = FONT_DIR / "PublicSans-otf" / "PublicSans-Bold.otf"
TITLE = "LLMs Unplugged"

TOKEN_FONT = FONT_DIR / "MonaspaceArgon-static" / "MonaspaceArgon-Bold.otf"
# The five cl100k_base tokens of the title, as they read on the bricks. The
# leading space of " Un" is set as a non-breaking space so it holds its width.
TOKEN_LABELS = ["LL", "Ms", " Un", "plug", "ged"]


def bake(font_path: Path, text: str) -> tuple[str, float]:
    """Shape `text` and return its outlines and advance in EM-unit coordinates.

    Outlines land in SVG coordinates: baseline at y=0, y growing downwards, the
    first glyph starting at x=0.
    """
    font_file = TTFont(font_path)
    scale = EM / font_file["head"].unitsPerEm
    glyph_set = font_file.getGlyphSet()
    glyph_order = font_file.getGlyphOrder()

    # Shape with HarfBuzz so kerning and ligatures match a real text renderer.
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(
        hb.Font(hb.Face(hb.Blob.from_file_path(str(font_path)))),
        buf,
        {"kern": True, "liga": True},
    )

    parts: list[str] = []
    pen_x = 0
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions, strict=True):
        pen = SVGPathPen(glyph_set, ntos=lambda v: f"{v:.1f}")
        placement = Transform(scale, 0, 0, -scale, (pen_x + pos.x_offset) * scale, 0)
        glyph_set[glyph_order[info.codepoint]].draw(TransformPen(pen, placement))
        if commands := pen.getCommands():
            parts.append(commands)
        pen_x += pos.x_advance

    return "".join(parts), pen_x * scale


def cap_height(font_path: Path) -> int:
    font_file = TTFont(font_path)
    return round(font_file["OS/2"].sCapHeight * EM / font_file["head"].unitsPerEm)


for font in (TITLE_FONT, TOKEN_FONT):
    if not font.exists():
        raise SystemExit(
            f"missing source font: {font}\nInstall it, or see scripts/subset-booklet-fonts.py"
        )

title_path, title_advance = bake(TITLE_FONT, TITLE)
tokens = [(label, *bake(TOKEN_FONT, label)) for label in TOKEN_LABELS]
# Monaspace is monospaced, so every label's advance is its length times one cell.
token_cell = tokens[0][2] / len(tokens[0][0])

token_entries = "\n".join(
    f'  {{ label: {json.dumps(label)}, advance: {advance:.1f}, path: "{path}" }},'
    for label, path, advance in tokens
)

OUT.write_text(f'''// Lettering for the brand marks, baked to outlines so the SVGs carry their own
// letterforms and need no font at render time --- as an `<img>`, in print, or in
// a design tool, none of which will fetch one.
//
// Regenerate from website/ with: ./scripts/extract-wordmark.py
//
// Coordinates are in a {EM}-unit em with the baseline at y=0 and y growing
// downwards, the SVG convention.

// --- The title, in Public Sans Bold: the lockup's wordmark ---------------

/** Advance width of the whole wordmark. */
export const WORDMARK_ADVANCE = {title_advance:.1f};

/** Cap height of Public Sans. */
export const WORDMARK_CAP_HEIGHT = {cap_height(TITLE_FONT)};

/** Glyph outlines, baseline at y=0, first glyph starting at x=0. */
export const WORDMARK_PATH =
  "{title_path}";

// --- The five token labels, in Monaspace Argon Bold ----------------------
// The family the printed booklet sets its wordmark in.

/** Cap height of Monaspace Argon Bold. */
export const TOKEN_CAP_HEIGHT = {cap_height(TOKEN_FONT)};

/** Width of one monospaced cell, which sets the type size from the brick width. */
export const TOKEN_CELL_ADVANCE = {token_cell:.1f};

export interface TokenLabel {{
  label: string;
  advance: number;
  path: string;
}}

/** In title order: LL, Ms, {TOKEN_LABELS[2]}, plug, ged. */
export const TOKEN_LABELS: TokenLabel[] = [
{token_entries}
];
''')
print(f"Wrote {OUT}: title {title_advance:.1f} wide, token cell {token_cell:.1f}")
