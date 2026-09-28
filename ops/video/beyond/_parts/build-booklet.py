#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# ///
"""The booklets the beyond videos show: generated/booklet.js and page images.

    ops/video/beyond/_parts/build-booklet.py

Used by `pretrained-generation-grid` (`<script src="parts/generated/booklet.js">`
→ `window.BOOKLET`). Runs the CLI into out/video/_build/beyond-booklet/, so it
never races build-data.py over cli/out/.

- `magpie`: The magpie's booklet as the CLI builds it (`pdf`, bigrams),
  headwords and followers lowercased like the videos' model. Its thresholds
  are checked against the dice bands of generated/magpie.js's counts (run
  build-magpie.py first), and this fails if they disagree.
- `paterson`: the room's booklet (data/the-man-from-snowy-river.txt, the
  recipe build-data.py and the Makefile use): its stats, the walk's entries
  (website/src/decks/examples.ts), every non-empty box of its grid as
  `cells` (flat [row, col, …] in the order the book first uses each word,
  so the grid reads like the room's), a sampled continuation from `;`
  (CLI `sample`, a fixed seed) and the pages the video shows.
- `pages[n]`: a page of the printed booklet: `w`, `h` in PDF points, its
  words with boxes from the PDF's own text layer (`[text, x0, y0, x1, y1]`),
  `img` (the whole page at 300 dpi) and `patches` (the entries the camera
  pushes in on: `box` is the entry, `region` the patch around it, rendered
  at 1000 dpi so a push-in to about 7x stays sharp in a 4K master).
"""

import html
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
CLI = ROOT / "cli/target/release/llms_unplugged"
BUILD = ROOT / "out/video/_build/beyond-booklet"
HERE = Path(__file__).resolve().parent
GEN = HERE / "generated"
PAGES = GEN / "booklet-pages"
MAGPIE_TXT = ROOT / "data/originals/the-magpie.txt"
PATERSON_TXT = ROOT / "data/the-man-from-snowy-river.txt"
WALK = ["sleep", "again", "I'd", "float", ";"]
SAMPLE_SEED = 28  # "; the station mob that heart in the story o'er and the roaring flooded Murray"
SAMPLE_TOKENS = 14
PAGE_DPI = 300
PATCH_DPI = 1000


def run(cmd: list[str | Path]) -> str:
    """stdout of a command; poppler's stderr noise on Typst PDFs is dropped."""
    return subprocess.run(
        [str(c) for c in cmd],
        check=True,
        capture_output=True,
        text=True,
    ).stdout


def booklet(txt: Path, out: Path, *extra: str) -> tuple[dict, Path]:
    for d in ("json", "pdf"):
        (out / d).mkdir(parents=True, exist_ok=True)
    run([CLI, "pdf", "-i", txt, "--out-dir", out, *extra])
    return json.loads(
        (out / "json" / f"{txt.stem}.json").read_text()
    ), out / "pdf" / f"{txt.stem}.pdf"


def dice_bands(counts: list[int]) -> list[int]:
    """website/src/lib/diceBands.ts: each band's last face."""
    total = sum(counts)
    faces = 10 ** len(str(total))
    cum, ends = 0, []
    for c in counts:
        cum += c
        ends.append(min(max(round(cum * faces / total), 1), faces) - 1)
    return ends


def magpie() -> dict:
    doc, _ = booklet(MAGPIE_TXT, BUILD / "magpie")
    src = (GEN / "magpie.js").read_text()
    rows = json.loads(src[src.index("{") : src.rindex("}") + 1])["rows"]
    entries = []
    for word, max_roll, *followers in doc["data"]:
        w = word.lower()
        fs = [[f.lower(), t] for f, t in followers]
        counts = dict(rows[w])
        ends = dice_bands([counts[f] for f, _ in fs])
        if (
            sorted(counts) != sorted(f for f, _ in fs)
            or ends[-1] != max_roll
            or (len(fs) > 1 and ends != [t for _, t in fs])
        ):
            raise SystemExit(
                f"magpie booklet disagrees with magpie.js for {w!r}: {fs} vs {counts}"
            )
        entries.append([w, max_roll, fs])
    return {"entries": entries, "stats": doc["metadata"]["stats"]}


def first_use_order(txt: Path, vocab: list[str]) -> list[str]:
    """The book's words in the order it first uses them. The pairs come from the
    CLI; this only orders the grid, so a close tokenisation (case-folded, quotes
    stripped) is enough, and anything it misses goes at the end."""
    by_lower: dict[str, str] = {}
    for w in vocab:
        by_lower.setdefault(w.lower(), w)
    body = txt.read_text().split("---", 2)[2].replace("’", "'").replace("‘", "'")
    order: dict[str, None] = {}
    for tok in re.findall(r"[A-Za-z']+|[.,!?;:]", body):
        w = by_lower.get(tok.strip("'").lower()) or by_lower.get(tok.lower())
        if w is not None:
            order.setdefault(w)
    missing = [w for w in vocab if w not in order]
    return [*order, *missing]


def words_bbox(pdf: Path, page: int) -> tuple[float, float, list]:
    src = run(["pdftotext", "-f", page, "-l", page, "-bbox", pdf, "-"])
    w, h = map(
        float, re.search(r'<page width="([\d.]+)" height="([\d.]+)"', src).groups()
    )
    words = [
        [html.unescape(t), *(round(float(v), 2) for v in (x0, y0, x1, y1))]
        for x0, y0, x1, y1, t in re.findall(
            r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)</word>',
            src,
        )
    ]
    return w, h, words


def render(
    pdf: Path, page: int, dpi: int, out: Path, crop: list[float] | None = None
) -> None:
    args = ["pdftoppm", "-r", dpi, "-png", "-singlefile", "-f", page, "-l", page]
    if crop:
        k = dpi / 72
        x, y, w, h = crop
        args += [
            "-x",
            round(x * k),
            "-y",
            round(y * k),
            "-W",
            round(w * k),
            "-H",
            round(h * k),
        ]
    run([*args, pdf, out.with_suffix("")])


def overlaps(a: list, b: list) -> bool:
    return a[2] < b[4] and b[2] < a[4]


def entry_words(words: list, head: str) -> list | None:
    """The printed entry for `head`: its bold headword followed on the same line
    by its dice diamonds (or, for a single-follower entry, by that follower),
    then the follower lines under it that start with a threshold, within its
    column (126pt wide). pdftotext orders words across the page's columns, so
    this goes by position."""
    for h in (w for w in words if w[0] == head):
        after = sorted(
            (w for w in words if overlaps(w, h) and 0 < w[1] - h[3] < 12),
            key=lambda w: w[1],
        )
        if not after or not (after[0][0].startswith("♦") or head == "float"):
            continue
        band = [w for w in words if h[1] - 2 <= w[1] < h[1] + 120 and w[2] >= h[2] - 2]
        lines: list[list] = []
        mid = lambda w: (w[2] + w[4]) / 2
        for w in sorted(band, key=lambda w: (round(mid(w)), w[1])):
            if lines and abs(mid(w) - mid(lines[-1][0])) < 5:
                lines[-1].append(w)
            else:
                lines.append([w])
        out = lines[0]
        for line in lines[1:]:
            if not re.match(r"\d+\|", line[0][0]):
                break
            out += line
        return out
    return None


def entry_box(ws: list, pad: float = 8) -> list[float]:
    x0, y0 = min(w[1] for w in ws), min(w[2] for w in ws)
    x1, y1 = max(w[3] for w in ws), max(w[4] for w in ws)
    return [
        round(v, 2) for v in (x0 - pad, y0 - pad, x1 - x0 + 2 * pad, y1 - y0 + 2 * pad)
    ]


def paterson() -> dict:
    doc, pdf = booklet(
        PATERSON_TXT, BUILD / "paterson", "--target", "the-man-from-snowy-river-2-1"
    )
    data = doc["data"]
    by_word = {e[0]: e for e in data}
    vocab = [e[0] for e in data]
    order = first_use_order(PATERSON_TXT, vocab)
    idx = {w: i for i, w in enumerate(order)}
    cells = [v for w, _, *fs in data for f, _ in fs for v in (idx[w], idx[f])]
    stats = doc["metadata"]["stats"]
    sample = run(
        [
            CLI,
            "sample",
            "-i",
            PATERSON_TXT,
            "-p",
            ";",
            "-t",
            SAMPLE_TOKENS,
            "--seed",
            SAMPLE_SEED,
        ]
    ).split()

    # which page each walk entry is printed on: its headword followed by its
    # dice diamonds (or, for a single-follower entry like float, by that follower)
    n_pages = int(re.search(r"Pages:\s+(\d+)", run(["pdfinfo", pdf]))[1])
    page_of: dict[str, int] = {}
    boxes: dict[int, tuple] = {}
    for p in range(1, n_pages + 1):
        boxes[p] = words_bbox(pdf, p)
        for word in WALK[:-1]:
            if word not in page_of and entry_words(boxes[p][2], word):
                page_of[word] = p
    # the opening spread: the page before sleep's and sleep's own
    shown = sorted({1, page_of["sleep"] - 1, *page_of.values()})
    PAGES.mkdir(parents=True, exist_ok=True)
    pages = {}
    for p in shown:
        w, h, ws = boxes[p]
        img = PAGES / f"page-{p:03d}.png"
        render(pdf, p, PAGE_DPI, img)
        patches = []
        for word, wp in page_of.items():
            if wp != p:
                continue
            box = entry_box(entry_words(ws, word))
            cx, cy = box[0] + box[2] / 2, box[1] + box[3] / 2
            x0, y0 = max(0, cx - 150), max(0, cy - 75)
            region = [
                round(v, 2)
                for v in (x0, y0, min(w, cx + 150) - x0, min(h, cy + 75) - y0)
            ]
            patch = PAGES / f"page-{p:03d}-{re.sub(r'[^a-z]', '', word.lower())}.png"
            render(pdf, p, PATCH_DPI, patch, region)
            patches.append(
                {
                    "entry": word,
                    "img": str(patch.relative_to(HERE)),
                    "box": box,
                    "region": region,
                }
            )
        pages[p] = {
            "w": w,
            "h": h,
            "img": str(img.relative_to(HERE)),
            "words": ws,
            "patches": patches,
        }

    return {
        "title": doc["metadata"]["title"],
        "stats": {
            "words": stats["unique_tokens"],
            "boxes": stats["unique_tokens"] ** 2,
            "nonEmpty": len(cells) // 2,
            "tokens": stats["total_tokens"],
        },
        "walk": {
            w: {"maxRoll": by_word[w][1], "followers": by_word[w][2:]} for w in WALK
        },
        "pageOf": page_of,
        "cells": cells,
        "sample": {"seed": SAMPLE_SEED, "tokens": sample},
        "pages": pages,
    }


def main() -> None:
    out = {"magpie": magpie(), "paterson": paterson()}
    (GEN / "booklet.js").write_text(
        f"window.BOOKLET = {json.dumps(out, ensure_ascii=False)};\n"
    )
    s = out["paterson"]["stats"]
    print(
        f"booklet.js: magpie {len(out['magpie']['entries'])} entries; paterson {s['words']} words, "
        f"{s['boxes']:,} boxes, {s['nonEmpty']:,} non-empty, pages {out['paterson']['pageOf']}"
    )


if __name__ == "__main__":
    main()
