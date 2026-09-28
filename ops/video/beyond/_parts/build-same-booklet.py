#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# ///
"""The magpie as a printed booklet: generated/same-booklet.js and its pages.

    ops/video/beyond/_parts/build-same-booklet.py

Used by `same-algorithm` (the booklet quarter of the four kits). The kit's
booklet is The Man from Snowy River; this is the magpie's own, printed by the
CLI's `pdf` subcommand as a room would print it, then turned into page images
and text-line boxes by ops/video/pdf-assets.sh.

- `generated/same-booklet/pages/sheet-00N.png`: page N of the booklet, 150 dpi
- `generated/same-booklet.js` → `window.SAME_BOOKLET`: `pages` (`w`, `h` in
  image px, `lines` with each text line's `bbox` in image px and its `words`)
"""

import json
import struct
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
CLI = ROOT / "cli/target/release/llms_unplugged"
TEXT = ROOT / "data/originals/the-magpie.txt"
BUILD = ROOT / "out/video/_build/same-booklet"
HERE = Path(__file__).resolve().parent
PAGES = HERE / "generated/same-booklet"
OUT = HERE / "generated/same-booklet.js"
DPI = 150


def png_size(path: Path) -> tuple[int, int]:
    header = path.read_bytes()[:24]
    if header[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError(f"not a PNG: {path}")
    return struct.unpack(">II", header[16:24])


def main() -> None:
    (BUILD / "json").mkdir(parents=True, exist_ok=True)
    (BUILD / "pdf").mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [str(CLI), "pdf", "-i", str(TEXT), "--out-dir", str(BUILD)], check=True
    )
    subprocess.run(
        [
            str(ROOT / "ops/video/pdf-assets.sh"),
            str(BUILD / "pdf/the-magpie.pdf"),
            str(PAGES),
            "--dpi",
            str(DPI),
        ],
        check=True,
    )
    bbox = json.loads((PAGES / "bbox.json").read_text())
    pages = []
    for p in bbox:
        w, h = png_size(PAGES / f"pages/sheet-{p['sheet']:03d}.png")
        k = w / p["w"]
        lines = [
            {"bbox": [round(v * k, 1) for v in line["bbox"]], "words": line["words"]}
            for line in p["lines"]
        ]
        pages.append({"w": w, "h": h, "lines": lines})
    OUT.write_text(f"window.SAME_BOOKLET = {json.dumps({'pages': pages})};\n")
    print(f"{len(pages)} pages -> {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
