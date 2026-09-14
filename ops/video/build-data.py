#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = [
#   "typer>=0.15",
#   "loguru>=0.7",
# ]
# ///
"""Rebuild everything a video composition draws from the repo's data.

    ops/video/build-data.py

Runs the CLI (building it first if needed), the same ledger and booklet
recipes as the root Makefile's pack target, turns the resulting PDFs into
page images with the llms-unplugged-video skill's pdf-assets.sh, and writes
it all into ops/video/_kit/generated/ --- gitignored, since it's rebuilt from
data/ and website/src/decks/examples.ts on demand. data.js is what a
composition's <script> tag loads (`window.KIT_DATA = {...}`).

Resolves the repo root from its own path, so it runs from anywhere.
"""

import json
import re
import struct
import subprocess
from pathlib import Path

import typer
from loguru import logger

ROOT = Path(__file__).resolve().parents[2]
CLI_DIR = ROOT / "cli"
CLI_BIN = CLI_DIR / "target/release/llms_unplugged"
PDF_ASSETS = ROOT / ".claude/skills/llms-unplugged-video/scripts/pdf-assets.sh"

BUILD_DIR = ROOT / "out/video/_build"
GENERATED = ROOT / "ops/video/_kit/generated"
PAGES = GENERATED / "pages"

OUTDOORS = ["beach", "storm", "kookaburra", "creek", "bush"]
PALETTE_ARG = "@cli/ledger-palette-four.json"
WALK_WORDS = ["golden", "grass", "grown", "hollow", ";"]


def run(cmd: list[str], cwd: Path) -> None:
    logger.debug(f"$ {' '.join(cmd)}  (cwd={cwd})")
    result = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(
            f"command failed ({result.returncode}): {' '.join(cmd)}\n{result.stderr}"
        )


def ensure_cli_binary() -> None:
    if CLI_BIN.exists():
        logger.info(f"cli: {CLI_BIN.relative_to(ROOT)} already built")
        return
    logger.info("cli: binary missing, running cargo build --release")
    run(["cargo", "build", "--release"], cwd=CLI_DIR)
    logger.info(f"cli: built {CLI_BIN.relative_to(ROOT)}")


def magpie_rows(ledger_json: Path) -> int:
    data = json.loads(ledger_json.read_text())
    return max(sum(len(page) for page in sheet["pages"]) for sheet in data["sheets"])


def build_ledger_sets() -> None:
    magpie_dir = BUILD_DIR / "the-magpie"
    magpie_cmd = [
        str(CLI_BIN),
        "ledger",
        "-i",
        "data/originals/the-magpie.txt",
        "--sheets",
        "5",
        "--palette",
        PALETTE_ARG,
        "--max-tokens",
        "140",
        "--max-followers",
        "4",
        "--prefill",
        "tallies",
        "--brief",
        "none",
        "--even-pages",
    ]
    run([*magpie_cmd, "--json-only", "-o", str(magpie_dir)], cwd=ROOT)
    rows = magpie_rows(magpie_dir / "ledger.json")
    run([*magpie_cmd, "--rows", str(rows), "-o", str(magpie_dir)], cwd=ROOT)
    logger.info(f"ledger: the-magpie -> {magpie_dir.relative_to(ROOT)} (rows={rows})")

    for t in OUTDOORS:
        out_dir = BUILD_DIR / f"outdoors-{t}"
        run(
            [
                str(CLI_BIN),
                "ledger",
                "-i",
                f"data/originals/outdoors-{t}.txt",
                "--sheets",
                "5",
                "--palette",
                PALETTE_ARG,
                "--max-followers",
                "4",
                "-o",
                str(out_dir),
            ],
            cwd=ROOT,
        )
        logger.info(f"ledger: outdoors-{t} -> {out_dir.relative_to(ROOT)}")

    blank_dir = BUILD_DIR / "blank"
    run(
        [
            str(CLI_BIN),
            "ledger",
            "--blank",
            "--palette",
            PALETTE_ARG,
            "--rows",
            "10",
            "--brief",
            "none",
            "-o",
            str(blank_dir),
        ],
        cwd=ROOT,
    )
    logger.info(f"ledger: blank -> {blank_dir.relative_to(ROOT)}")


def build_booklet() -> None:
    run(
        [
            "./target/release/llms_unplugged",
            "pdf",
            "-i",
            "../data/the-man-from-snowy-river.txt",
            "--target",
            "the-man-from-snowy-river-2-1",
            "--out-dir",
            "out",
        ],
        cwd=CLI_DIR,
    )
    logger.info("booklet: the-man-from-snowy-river -> cli/out/{json,pdf}")


def build_page_images() -> None:
    jobs = [
        (BUILD_DIR / "the-magpie/ledger.pdf", PAGES / "the-magpie"),
        (BUILD_DIR / "the-magpie/text.pdf", PAGES / "the-magpie-text"),
        (BUILD_DIR / "blank/ledger.pdf", PAGES / "blank"),
        *(
            (BUILD_DIR / f"outdoors-{t}/text.pdf", PAGES / f"outdoors-{t}-text")
            for t in OUTDOORS
        ),
        (CLI_DIR / "out/pdf/the-man-from-snowy-river.pdf", PAGES / "snowy-river"),
    ]
    for pdf, out_dir in jobs:
        run([str(PDF_ASSETS), str(pdf), str(out_dir), "--dpi", "150"], cwd=ROOT)
        logger.info(f"pages: {pdf.relative_to(ROOT)} -> {out_dir.relative_to(ROOT)}")


def png_size(path: Path) -> tuple[int, int]:
    header = path.read_bytes()[:33]
    if header[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError(f"not a PNG: {path}")
    width, height = struct.unpack(">II", header[16:24])
    return width, height


def read_pages() -> dict:
    keys = [
        "the-magpie",
        "the-magpie-text",
        "blank",
        *(f"outdoors-{t}-text" for t in OUTDOORS),
        "snowy-river",
    ]
    pages = {}
    for key in keys:
        bbox = json.loads((PAGES / key / "bbox.json").read_text())
        width, height = png_size(PAGES / key / "pages/sheet-001.png")
        pages[key] = {"bbox": bbox, "imgW": width, "imgH": height}
    logger.info(f"pages: read bbox + image size for {len(pages)} sets")
    return pages


def read_ledger() -> dict:
    keys = ["the-magpie", *(f"outdoors-{t}" for t in OUTDOORS), "blank"]
    ledger = {
        key: json.loads((BUILD_DIR / key / "ledger.json").read_text()) for key in keys
    }
    logger.info(f"ledger: read ledger.json for {len(ledger)} sets")
    return ledger


def find_booklet_page(bbox: list[dict], word: str, single_follower: bool) -> int:
    """The line whose first word is the headword. A single-follower entry is a
    certain (no-roll) case and prints bare, `word` then its follower on the
    next line; every other entry prints a dice diamond after the headword on
    the same line. That distinction is what tells the two apart --- both can
    otherwise start a bbox line with the bare word.
    """
    for page in bbox:
        for line in page["lines"]:
            words = line["words"]
            if not words or words[0] != word:
                continue
            if single_follower and len(words) == 1:
                return page["sheet"]
            if not single_follower and len(words) > 1:
                return page["sheet"]
    raise RuntimeError(f"booklet: no header line found for {word!r}")


def read_booklet() -> dict:
    doc = json.loads((CLI_DIR / "out/json/the-man-from-snowy-river.json").read_text())
    meta = doc["metadata"]
    by_word = {entry[0]: entry for entry in doc["data"]}

    wanted = set(WALK_WORDS)
    for word in WALK_WORDS:
        entry = by_word.get(word)
        if entry is None:
            raise RuntimeError(f"booklet: walk word {word!r} has no entry")
        wanted.update(follower for follower, _threshold in entry[2:])

    entries = {}
    for word in wanted:
        entry = by_word.get(word)
        if entry is None:
            logger.warning(f"booklet: no entry for follower word {word!r}, skipping")
            continue
        entries[word] = {
            "maxRoll": entry[1],
            "followers": [[follower, threshold] for follower, threshold in entry[2:]],
        }

    bbox = json.loads((PAGES / "snowy-river/bbox.json").read_text())
    page_of = {}
    for word in WALK_WORDS:
        single = len(entries[word]["followers"]) == 1
        page_of[word] = find_booklet_page(bbox, word, single)

    logger.info(f"booklet: {len(entries)} entries, pageOf={page_of}")
    return {
        "title": meta["title"],
        "author": meta["author"],
        "stats": meta["stats"],
        "entries": entries,
        "pageOf": page_of,
    }


GRID_CONSTANTS = {
    "tokens": "EXAMPLE_TOKENS",
    "vocab": "EXAMPLE_VOCAB",
    "generation": "EXAMPLE_GENERATION",
    "rolls": "EXAMPLE_GENERATION_ROLLS",
    "pretrainedSeq": "EXAMPLE_PRETRAINED_SEQ",
    "pretrainedRolls": "EXAMPLE_PRETRAINED_ROLLS",
}


def read_grid() -> dict:
    text = (ROOT / "website/src/decks/examples.ts").read_text()
    grid = {}
    for key, const in GRID_CONSTANTS.items():
        match = re.search(rf'export const {const} = "([^"]*)"', text)
        if not match:
            raise RuntimeError(
                f"grid: {const} not found in website/src/decks/examples.ts"
            )
        grid[key] = match.group(1)
    logger.info(f"grid: read {len(grid)} constants from examples.ts")
    return grid


def read_palette(ledger: dict) -> list[dict]:
    palette = ledger["the-magpie"]["palette"]
    logger.info(f"palette: {len(palette)} colours from the-magpie ledger.json")
    return palette


def write_data_js(
    ledger: dict, pages: dict, booklet: dict, grid: dict, palette: list[dict]
) -> None:
    payload = {
        "ledger": ledger,
        "pages": pages,
        "booklet": booklet,
        "grid": grid,
        "palette": palette,
    }
    GENERATED.mkdir(parents=True, exist_ok=True)
    out_path = GENERATED / "data.js"
    out_path.write_text(f"window.KIT_DATA = {json.dumps(payload, indent=2)};\n")
    logger.info(
        f"data.js: wrote {out_path.relative_to(ROOT)} ({out_path.stat().st_size} bytes)"
    )


def main() -> None:
    ensure_cli_binary()
    build_ledger_sets()
    build_booklet()
    build_page_images()

    ledger = read_ledger()
    pages = read_pages()
    booklet = read_booklet()
    grid = read_grid()
    palette = read_palette(ledger)

    write_data_js(ledger, pages, booklet, grid, palette)


if __name__ == "__main__":
    typer.run(main)
