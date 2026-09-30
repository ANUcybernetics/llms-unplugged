#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# ///
"""Frankenstein's bigram counts, in reading order: generated/frankenstein.js.

    ops/video/_parts/build-frankenstein.py

Used by `training-grid` and `training-ledger` (the bigger book at machine
speed) and, later, `real-models` (49 million boxes as a heatmap). They load it
with `<script src="parts/generated/frankenstein.js">` → `window.FRANKENSTEIN`
and draw it with `frankenstein.js` beside this file.

The CLI's `build --raw` gives the counts but not the order the book meets them,
so this tokenises the text the way the CLI does (a port of `cli/src/text.rs`:
ASCII letters and apostrophes make words, the punctuation set makes its own
tokens, everything else separates, digit runs and roman numerals drop, casing
follows the corpus) and fails unless every count agrees with the CLI's.

- `tokens`: tokens in the text (84,546)
- `vocab`: the words (7,023), in the order the book first uses them: the order
  a participant's grid adds rows and columns, and a hand-filled ledger its rows
- `cellR`, `cellC`: every nonzero box (41,018), as row and column indices
  into `vocab`, in the order the book first fills them (so a ledger row's
  followers, taken in this order, are in its red-blue-green-yellow order)
- `seq`: for each pair of the text in reading order, the box it tallies
  (an index into `cellR`/`cellC`): counts, and counts so far, come from this
"""

import json
import re
import subprocess
import tempfile
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
TEXT = ROOT / "data/frankenstein.txt"
CLI = ROOT / "cli/target/release/llms_unplugged"
OUT = Path(__file__).resolve().parent / "generated/frankenstein.js"

PUNCT = set(".,!?;:")
APOSTROPHES = {"‘", "’", "′", "´", "`"}
ROMAN = set(
    "ii iii iv v vi vii viii ix x xi xii xiii xiv xv xvi xvii xviii xix xx xxi xxii "
    "xxiii xxiv xxv xxvi xxvii xxviii xxix xxx xxxi xxxii xxxiii xxxiv xxxv xxxvi "
    "xxxvii xxxviii xxxix xl xli xlii xliii xliv xlv xlvi xlvii xlviii xlix l".split()
)
ALLOW = {"i": "I", "i'm": "I'm", "i've": "I've", "i'd": "I'd", "i'll": "I'll"}
CONTRACTIONS = ("'s", "s'", "n't", "'ll", "'ve", "'re", "'d", "'m", "in'", "an'", "o'")


def body_lines(text: str) -> list[str]:
    lines = text.splitlines()
    end = next(i for i, line in enumerate(lines[1:], 1) if line.strip() == "---")
    return lines[end + 1 :]


def segments(line: str) -> list[tuple[str, str]]:
    """(kind, text) per lexical segment: word, punct or digits (text.rs)."""
    out: list[tuple[str, str]] = []
    word = digits = ""
    for ch in line:
        ch = "'" if ch in APOSTROPHES else ch
        if ch in PUNCT:
            out += [("word", word)] * bool(word) + [("digits", digits)] * bool(digits)
            word = digits = ""
            out.append(("punct", ch))
        elif (ch.isascii() and ch.isalpha()) or ch == "'":
            out += [("digits", digits)] * bool(digits)
            digits = ""
            word += ch
        elif ch.isascii() and ch.isdigit():
            out += [("word", word)] * bool(word)
            word = ""
            digits += ch
        else:
            out += [("word", word)] * bool(word) + [("digits", digits)] * bool(digits)
            word = digits = ""
    out += [("word", word)] * bool(word) + [("digits", digits)] * bool(digits)
    return out


def clean(word: str) -> str | None:
    word = word.lstrip("'")
    while word.endswith("'") and not word.lower().endswith(CONTRACTIONS):
        word = word[:-1]
    return word or None


def valid(word: str) -> bool:
    return word.lower() == "i" or word.lower() not in ROMAN


def tokenise(lines: list[str]) -> list[str]:
    segs = [s for line in lines for s in segments(line)]
    words = [w for k, t in segs if k == "word" and (w := clean(t)) and valid(w)]
    forms: dict[str, set[str]] = {}
    for w in words:
        forms.setdefault(w.lower(), set()).add(w)
    case = {
        lo: next(iter(f))
        for lo, f in forms.items()
        if len(f) == 1 and next(iter(f)) != lo
    }
    tokens = []
    for kind, text in segs:
        if kind == "punct":
            tokens.append(text)
        elif kind == "word" and (w := clean(text)) and valid(w):
            lo = w.lower()
            tokens.append(ALLOW.get(lo) or case.get(lo, lo))
    return tokens


def cli_counts() -> dict[tuple[str, str], int]:
    with tempfile.TemporaryDirectory() as tmp:
        out = Path(tmp) / "model.json"
        subprocess.run(
            [CLI, "build", "-i", TEXT, "--raw", "-o", out],
            check=True,
            capture_output=True,
        )
        rows = json.loads(out.read_text())["data"]
    counts = {}
    for context, _total, *followers in rows:
        prev = 0
        for nxt, cum in followers:
            counts[(context, nxt)] = cum - prev
            prev = cum
    return counts


def main() -> None:
    tokens = tokenise(body_lines(TEXT.read_text()))
    pairs = list(zip(tokens, tokens[1:]))
    if Counter(pairs) != cli_counts():
        raise SystemExit("Frankenstein's pair counts disagree with the CLI's")

    vocab = list(dict.fromkeys(tokens))
    idx = {w: i for i, w in enumerate(vocab)}
    cells: dict[tuple[str, str], int] = {}
    for p in pairs:
        cells.setdefault(p, len(cells))
    data = {
        "title": "Frankenstein",
        "tokens": len(tokens),
        "vocab": vocab,
        "cellR": [idx[a] for a, _ in cells],
        "cellC": [idx[b] for _, b in cells],
        "seq": [cells[p] for p in pairs],
    }
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(
        f"window.FRANKENSTEIN = {json.dumps(data, separators=(',', ':'))};\n"
    )
    n = len(vocab)
    print(
        f"{OUT.relative_to(ROOT)}: {len(tokens):,} tokens, {n:,} words, "
        f"{n * n:,} boxes, {len(cells):,} nonzero ({len(cells) / n / n:.3%})"
    )


if __name__ == "__main__":
    main()
