#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# ///
"""The magpie as the beyond videos' model: generated/magpie.js.

    ops/video/beyond/_parts/build-magpie.py

Every beyond video that walks The magpie loads it (`<script
src="parts/generated/magpie.js">` → `window.MAGPIE`). The videos lowercase
everything, so the CLI's "Here", "Down" and "Swoop" merge into their rows;
the counts are checked against the CLI's ledger.json (run
ops/video/build-data.py first), merged the same way, and this fails if they
disagree.

- `tokens`: the book's tokens as written; `words`: the same, lowercased
- `vocab`: lowercased words in the order the book first uses them (the grid's
  row and column order)
- `rows[w]`: `[[next, count], …]` in the order the row first meets each next
  word (the ledger's red, blue, green, yellow order)
"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
TEXT = ROOT / "data/originals/the-magpie.txt"
LEDGER = ROOT / "out/video/_build/the-magpie/ledger.json"
OUT = Path(__file__).resolve().parent / "generated/magpie.js"
PUNCT = ".,!?;:"


def tokenise(text: str) -> list[str]:
    body = text.split("---", 2)[2]
    return re.findall(rf"[^\s{re.escape(PUNCT)}]+|[{re.escape(PUNCT)}]", body)


def main() -> None:
    tokens = tokenise(TEXT.read_text())
    words = [t.lower() for t in tokens]
    vocab = list(dict.fromkeys(words))
    rows: dict[str, dict[str, int]] = {}
    for a, b in zip(words, words[1:]):
        row = rows.setdefault(a, {})
        row[b] = row.get(b, 0) + 1

    cli: dict[str, dict[str, int]] = {}
    for sheet in json.loads(LEDGER.read_text())["sheets"]:
        for entry in (e for page in sheet["pages"] for e in page):
            row = cli.setdefault(entry["prefix"][0].lower(), {})
            for f in entry["followers"]:
                row[f["text"].lower()] = row.get(f["text"].lower(), 0) + f["count"]
    if cli != rows:
        raise SystemExit(f"magpie counts disagree with the CLI ledger:\n{rows}\n{cli}")

    data = {
        "tokens": tokens,
        "words": words,
        "vocab": vocab,
        "rows": {w: list(r.items()) for w, r in rows.items()},
    }
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(f"window.MAGPIE = {json.dumps(data)};\n")
    print(f"{OUT.relative_to(ROOT)}: {len(tokens)} tokens, {len(vocab)} words")


if __name__ == "__main__":
    main()
