#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# ///
"""The kookaburra, for the overview's tools beat: generated/overview.js and pages.

    ops/video/beyond/_parts/build-overview.py

Used by `overview` ("paste in any text you like, and out come the grids, the
sheets and the booklets for it"): a text other than the magpie, pasted in, and
its own materials. The ledger sheets come from the kit (KIT_DATA.ledger
["outdoors-kookaburra"]); this adds the text, its tokens (for the grid) and
its booklet, printed by the CLI's `pdf` subcommand as a room would print it,
then turned into page images and text-line boxes by ops/video/pdf-assets.sh.

- `generated/overview/pages/sheet-00N.png`: page N of the booklet, 150 dpi
- `generated/overview.js` → `window.OVERVIEW`: `text` (the story as written),
  `words` (its tokens, lowercased), `vocab` (first-use order), `pages` (`w`,
  `h` in image px, `lines` with each text line's `bbox` in image px and its
  `words`)
"""

import json
import re
import struct
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
CLI = ROOT / "cli/target/release/llms_unplugged"
TEXT = ROOT / "data/originals/outdoors-kookaburra.txt"
BUILD = ROOT / "out/video/_build/overview"
HERE = Path(__file__).resolve().parent
PAGES = HERE / "generated/overview"
OUT = HERE / "generated/overview.js"
DPI = 150
PUNCT = ".,!?;:"


def png_size(path: Path) -> tuple[int, int]:
    header = path.read_bytes()[:24]
    if header[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError(f"not a PNG: {path}")
    return struct.unpack(">II", header[16:24])


def main() -> None:
    body = TEXT.read_text().split("---", 2)[2].strip()
    tokens = re.findall(rf"[^\s{re.escape(PUNCT)}]+|[{re.escape(PUNCT)}]", body)
    words = [t.lower() for t in tokens]
    (BUILD / "json").mkdir(parents=True, exist_ok=True)
    (BUILD / "pdf").mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [str(CLI), "pdf", "-i", str(TEXT), "--out-dir", str(BUILD)], check=True
    )
    pdf = next((BUILD / "pdf").glob("*.pdf"))
    subprocess.run(
        [
            str(ROOT / "ops/video/pdf-assets.sh"),
            str(pdf),
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
    data = {
        "text": body,
        "words": words,
        "vocab": list(dict.fromkeys(words)),
        "pages": pages,
    }
    OUT.write_text(f"window.OVERVIEW = {json.dumps(data)};\n")
    print(f"{len(pages)} pages, {len(words)} tokens -> {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
