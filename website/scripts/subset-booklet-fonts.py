#!/usr/bin/env python3
"""Subset the fonts the in-browser Typst export bundles.

The browser Typst compiler (typstCompiler.ts) renders booklets and cutouts, and
it can only use fonts we hand it: typst.ts ships a handful of default faces
(Libertinus Serif, New Computer Modern) and nothing else. So every other family
the templates reference has to be bundled and preloaded. This script produces
those subsets from the local system fonts:

    font: ("Libertinus Serif", "Noto Serif CJK SC")   <- Serif is a default;
    font: ("Libertinus Sans", "Noto Sans CJK SC")        Sans + CJK bundled
    font: "Monaspace Argon"                              <- wordmark, bundled
    font: "Public Sans"                                  <- brand face, bundled

Two constraints shape the output:

- Typst (and typst.ts's wasm build) parses only uncompressed sfnt fonts --- it
  silently ignores woff2 --- so every face ships as plain OTF. The Noto CJK
  faces are CID-keyed CFF; those outlines render fine uncompressed, so no glyf
  conversion is needed.
- The family name Typst matches on is name-table ID 1, so we keep the name table
  (--name-IDs='*') and assert it survives subsetting.

The Chinese faces cover the full GB2312 character set (~7,400 chars: every
common modern simplified hanzi plus full-width punctuation) and land around 2 MB
each. The Latin faces are subset to the Latin + punctuation ranges a title,
author, or the wordmark could use, and are a few tens of KB each.

Run with uv (no venv needed):

    uv run --with "fonttools[woff]" scripts/subset-booklet-fonts.py

The output OTF files are committed under src/assets/fonts/; regenerate them only
when the source fonts or coverage change.
"""

from __future__ import annotations

import subprocess
import tempfile
from dataclasses import dataclass
from pathlib import Path

from fontTools.ttLib import TTFont

FONT_DIR = Path.home() / ".local" / "share" / "fonts"
NOTO_DIR = Path("/usr/share/fonts/opentype/noto")

OUT_DIR = Path(__file__).resolve().parent.parent / "src" / "assets" / "fonts"

# Latin coverage for the title/author/wordmark faces: printable ASCII, Latin-1
# and Latin Extended-A (accented names), plus the general-punctuation block
# (curly quotes, dashes, ellipsis).
LATIN_UNICODES = "U+0020-007E,U+00A0-017F,U+2010-2044"


@dataclass(frozen=True)
class FontSpec:
    src: Path
    out_name: str
    family: str
    # A TTC needs a face index; standalone OTFs leave this None.
    font_number: int | None = None
    # Exactly one of `text` / `unicodes` selects the subset coverage.
    text: str | None = None
    unicodes: str | None = None


def gb2312_chars() -> str:
    """Every character encodable in GB2312 --- all common simplified Chinese."""
    chars: list[str] = []
    for hi in range(0xA1, 0xF8):
        for lo in range(0xA1, 0xFF):
            try:
                chars.append(bytes([hi, lo]).decode("gb2312"))
            except UnicodeDecodeError:
                continue
    # Full-width punctuation kept as its own tokens by the tokeniser, plus the
    # printable ASCII range (a few Latin glyphs render more consistently when
    # present in the CJK face too).
    extra = "。，、！？；：“”‘’（）《》〈〉【】—…·　" + "".join(
        chr(c) for c in range(0x20, 0x7F)
    )
    return "".join(chars) + extra


def sources() -> list[FontSpec]:
    cjk = gb2312_chars()
    # Face index 2 in each Noto TTC is the Simplified Chinese (SC) Regular face.
    return [
        FontSpec(
            NOTO_DIR / "NotoSerifCJK-Regular.ttc",
            "NotoSerifCJKsc-Regular-subset.otf",
            "Noto Serif CJK SC",
            font_number=2,
            text=cjk,
        ),
        FontSpec(
            NOTO_DIR / "NotoSansCJK-Regular.ttc",
            "NotoSansCJKsc-Regular-subset.otf",
            "Noto Sans CJK SC",
            font_number=2,
            text=cjk,
        ),
        FontSpec(
            FONT_DIR / "libertinus" / "LibertinusSans-Regular.otf",
            "LibertinusSans-Regular-subset.otf",
            "Libertinus Sans",
            unicodes=LATIN_UNICODES,
        ),
        FontSpec(
            FONT_DIR / "libertinus" / "LibertinusSans-Bold.otf",
            "LibertinusSans-Bold-subset.otf",
            "Libertinus Sans",
            unicodes=LATIN_UNICODES,
        ),
        FontSpec(
            FONT_DIR / "MonaspaceArgon-static" / "MonaspaceArgon-Regular.otf",
            "MonaspaceArgon-Regular-subset.otf",
            "Monaspace Argon",
            unicodes=LATIN_UNICODES,
        ),
        # The project typeface, as used on the website. The cutouts template
        # sets its instructions, footers and word mark in it, so the in-browser
        # export needs it too or the page it produces silently falls back to a
        # different face from the one the CLI prints.
        FontSpec(
            FONT_DIR / "PublicSans-otf" / "PublicSans-Regular.otf",
            "PublicSans-Regular-subset.otf",
            "Public Sans",
            unicodes=LATIN_UNICODES,
        ),
        FontSpec(
            FONT_DIR / "PublicSans-otf" / "PublicSans-Bold.otf",
            "PublicSans-Bold-subset.otf",
            "Public Sans",
            unicodes=LATIN_UNICODES,
        ),
    ]


def subset(spec: FontSpec, text_path: Path) -> None:
    out_path = OUT_DIR / spec.out_name
    # --name-IDs='*' keeps the name table (the family name Typst matches on); the
    # dropped .notdef outline saves ~800 KB per CJK face.
    args = [
        "pyftsubset",
        str(spec.src),
        f"--output-file={out_path}",
        "--layout-features=",
        "--no-hinting",
        "--desubroutinize",
        "--name-IDs=*",
    ]
    if spec.font_number is not None:
        args.append(f"--font-number={spec.font_number}")
    if spec.text is not None:
        text_path.write_text(spec.text)
        args.append(f"--text-file={text_path}")
    else:
        args.append(f"--unicodes={spec.unicodes}")

    subprocess.run(args, check=True)

    family_name = TTFont(out_path)["name"].getDebugName(1)
    assert family_name == spec.family, (
        f"family name drifted: {family_name!r} != {spec.family!r}"
    )
    size_kb = out_path.stat().st_size / 1024
    print(f"{spec.out_name}: {spec.family} ({size_kb:.0f} KB)")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        text_path = Path(tmp) / "chars.txt"
        for spec in sources():
            subset(spec, text_path)


if __name__ == "__main__":
    main()
