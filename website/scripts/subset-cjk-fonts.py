#!/usr/bin/env python3
"""Subset the system Noto CJK SC fonts for the in-browser PDF export.

The browser Typst compiler (typstCompiler.ts) needs Chinese glyphs to render
booklets and cutouts. The full Noto CJK fonts are ~20 MB each, so we self-subset
the *system* Noto Serif/Sans CJK SC faces, keeping the correct family names the
Typst templates reference:

    font: ("Libertinus Serif", "Noto Serif CJK SC")
    font: ("Libertinus Sans", "Noto Sans CJK SC")

Two constraints shape the output format:

- Typst (and typst.ts's wasm build) parses only uncompressed sfnt fonts --- it
  silently ignores woff2, so the fonts must ship as plain OTF. The fontsource
  CDN woff2 builds would not work even setting their broken name tables aside.
- The Noto CJK faces are CID-keyed CFF; those outlines render correctly once
  the font reaches Typst uncompressed, so no glyf conversion is needed.

Coverage is the full GB2312 character set (~7,400 chars: every common modern
simplified hanzi plus full-width punctuation), which renders essentially any
modern Chinese text a workshop would paste in. Only the Regular weight is subset
--- Typst faux-bolds the title face, the only place bold CJK would appear. Each
face lands around 2 MB as uncompressed CFF OTF.

Run with uv (no venv needed):

    uv run --with "fonttools[woff]" scripts/subset-cjk-fonts.py

The output OTF files are committed under src/assets/fonts/; regenerate them only
when the source fonts or coverage change.
"""

from __future__ import annotations

import subprocess
import tempfile
from pathlib import Path

from fontTools.ttLib import TTFont

# Face index 2 in each TTC is the Simplified Chinese (SC) Regular instance.
SOURCES = [
    (
        Path("/usr/share/fonts/opentype/noto/NotoSerifCJK-Regular.ttc"),
        2,
        "NotoSerifCJKsc-Regular-subset.otf",
        "Noto Serif CJK SC",
    ),
    (
        Path("/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"),
        2,
        "NotoSansCJKsc-Regular-subset.otf",
        "Noto Sans CJK SC",
    ),
]

OUT_DIR = Path(__file__).resolve().parent.parent / "src" / "assets" / "fonts"

# Extra full-width punctuation kept as its own tokens by the tokeniser, plus the
# printable ASCII range (Latin fallback still lives in the Libertinus faces, but
# a few Latin glyphs render more consistently when present in the CJK face too).
EXTRA = "。，、！？；：“”‘’（）《》〈〉【】—…·　" + "".join(
    chr(c) for c in range(0x20, 0x7F)
)


def gb2312_chars() -> str:
    """Every character encodable in GB2312 --- all common simplified Chinese."""
    chars: list[str] = []
    for hi in range(0xA1, 0xF8):
        for lo in range(0xA1, 0xFF):
            try:
                chars.append(bytes([hi, lo]).decode("gb2312"))
            except UnicodeDecodeError:
                continue
    return "".join(chars)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    text = gb2312_chars() + EXTRA

    with tempfile.TemporaryDirectory() as tmp:
        text_path = Path(tmp) / "chars.txt"
        text_path.write_text(text)

        for src, font_number, out_name, family in SOURCES:
            out_path = OUT_DIR / out_name

            # Subset the SC face to an uncompressed CFF OTF. --name-IDs='*' keeps
            # the name table (the family name Typst matches on); dropping the
            # default .notdef outline saves ~800 KB per face.
            subprocess.run(
                [
                    "pyftsubset",
                    str(src),
                    f"--font-number={font_number}",
                    f"--text-file={text_path}",
                    f"--output-file={out_path}",
                    "--layout-features=",
                    "--no-hinting",
                    "--desubroutinize",
                    "--name-IDs=*",
                ],
                check=True,
            )

            family_name = TTFont(out_path)["name"].getDebugName(1)
            assert family_name == family, (
                f"family name drifted: {family_name!r} != {family!r}"
            )
            size_kb = out_path.stat().st_size / 1024
            print(f"{out_name}: {family} ({size_kb:.0f} KB)")


if __name__ == "__main__":
    main()
