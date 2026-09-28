#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = ["tiktoken"]
# ///
"""The data real-models shows that no other video does: generated/real-models.js.

    ops/video/beyond/_parts/build-real-models.py

Used by `real-models` only (`<script src="parts/generated/real-models.js">` →
`window.REAL_MODELS`). Everything on screen in its context, tokens and number
beats comes from here, and this fails rather than write anything the data
doesn't back:

- `samples`: three real CLI runs on Frankenstein from the same prompt, looking
  back one, two and five words (`sample -n 2|3|6`). The seeds are picked so the
  runs show the three stages the script names: nonsense, nearly prose, the
  book copied out. Each sample's `run` is the longest stretch of what it wrote
  (the prompt left out) that the book has word for word; the build fails
  unless the five-word run copies the book whole and the runs grow with the
  context.
- `page`: the book's words around the prompt (the start of chapter 5) as
  printed, each with the index into the five-word sample of the token it
  starts, where the sample copies it (else -1), so the page lights in step
  with the strip.
- `tokens`: "the magpie swooped unexpectedly" split by a real tokeniser,
  tiktoken's `o200k_base` (the GPT-4o family's encoding). `SPLIT` is the split
  the video draws; the build fails if the tokeniser splits it any other way.
- `numbers`: vocabulary and nonzero boxes for the magpie and Frankenstein from
  the CLI's `build --raw`, and whether the magpie's "dog" and "postie" rows
  are the same there.
"""

import importlib.util
import json
import subprocess
import tempfile
from pathlib import Path

import tiktoken

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
CLI = ROOT / "cli/target/release/llms_unplugged"
BOOK = ROOT / "data/frankenstein.txt"
MAGPIE = ROOT / "data/originals/the-magpie.txt"
OUT = HERE / "generated/real-models.js"

PROMPT = "a dreary night of November"
TOKENS = 20
# (n, seed): n - 1 words of context
RUNS = [(2, 1), (3, 4), (6, 1)]
PAGE_LINES = (1459, 1463)  # data/frankenstein.txt, 1-based, end exclusive

PHRASE = "the magpie swooped unexpectedly"
SPLIT = [["the"], ["mag", "pie"], ["swo", "oped"], ["unexpectedly"]]


def frankenstein_tokenise():
    """build-frankenstein.py's port of the CLI tokeniser (cli/src/text.rs)."""
    spec = importlib.util.spec_from_file_location("bf", HERE / "build-frankenstein.py")
    bf = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(bf)
    return bf


def cli(*args: str | Path) -> str:
    return subprocess.run(
        [CLI, *args], check=True, capture_output=True, text=True
    ).stdout


def longest_copied(sample: list[str], book: list[str]) -> int:
    """The longest run of `sample` that appears word for word in `book`."""
    at: dict[str, list[int]] = {}
    for i, t in enumerate(book):
        at.setdefault(t, []).append(i)
    best = 0
    for s in range(len(sample)):
        for b in at.get(sample[s], []):
            k = 0
            while (
                s + k < len(sample)
                and b + k < len(book)
                and sample[s + k] == book[b + k]
            ):
                k += 1
            best = max(best, k)
    return best


def samples(book: list[str]) -> list[dict]:
    out = []
    for n, seed in RUNS:
        args = ["sample", "-i", BOOK.relative_to(ROOT), "-n", str(n), "-p", PROMPT]
        args += ["-t", str(TOKENS), "--seed", str(seed)]
        toks = cli(*args).split()
        prompt, text = toks[: len(PROMPT.split())], toks[len(PROMPT.split()) :]
        if " ".join(prompt).lower() != PROMPT.lower() or len(text) != TOKENS:
            raise SystemExit(f"unexpected sample output for n={n}: {toks}")
        out.append(
            {
                "n": n,
                "context": n - 1,
                "seed": seed,
                "command": "llms_unplugged "
                + " ".join(f'"{a}"' if " " in str(a) else str(a) for a in args),
                "prompt": prompt,
                "text": text,
                "run": longest_copied(text, book),
            }
        )
    runs = [s["run"] for s in out]
    if runs[-1] != TOKENS:
        raise SystemExit(f"the five-word sample doesn't copy the book whole: {out[-1]}")
    if not runs[0] < runs[1] < runs[2]:
        raise SystemExit(f"copied runs don't grow with the context: {runs}")
    return out


def page(bf, copied: dict) -> list[dict]:
    """The page's printed words; `k` is the copied sample's token each starts."""
    lines = BOOK.read_text().splitlines()[PAGE_LINES[0] - 1 : PAGE_LINES[1] - 1]
    words = " ".join(lines).split()
    per_word = [bf.tokenise([w]) for w in words]
    # tokenised a word at a time, the corpus's casing is lost: compare lowercased
    flat = [t.lower() for ts in per_word for t in ts]
    seq = [t.lower() for t in copied["prompt"] + copied["text"]]
    start = next(i for i in range(len(flat)) if flat[i : i + len(seq)] == seq)
    out, k = [], 0
    for w, ts in zip(words, per_word):
        idx = k - start if start <= k < start + len(seq) else -1
        out.append({"w": w, "k": idx, "n": len(ts)})
        k += len(ts)
    return out


def tokens() -> list[list[str]]:
    enc = tiktoken.get_encoding("o200k_base")
    pieces = [enc.decode([i]) for i in enc.encode(PHRASE)]
    # a piece starting with a space starts a word
    words: list[list[str]] = []
    for p in pieces:
        if p.startswith(" ") or not words:
            words.append([])
        words[-1].append(p.strip())
    if words != SPLIT:
        raise SystemExit(f"o200k_base splits {PHRASE!r} as {words}, not {SPLIT}")
    return words


def counts(path: Path) -> dict:
    with tempfile.TemporaryDirectory() as tmp:
        out = Path(tmp) / "model.json"
        cli("build", "-i", path, "--raw", "-o", out)
        rows = json.loads(out.read_text())["data"]
    table = {}
    for context, _total, *followers in rows:
        prev, row = 0, {}
        for nxt, cum in followers:
            row[nxt] = cum - prev
            prev = cum
        table[context] = row
    words = len(table)
    return {
        "words": words,
        "boxes": words * words,
        "nonzero": sum(len(r) for r in table.values()),
        "rows": table,
    }


def main() -> None:
    bf = frankenstein_tokenise()
    book = bf.tokenise(bf.body_lines(BOOK.read_text()))
    runs = samples(book)
    frank, magpie = counts(BOOK), counts(MAGPIE)
    same = magpie["rows"]["dog"] == magpie["rows"]["postie"]
    if not same:
        raise SystemExit(
            f"dog and postie differ: {magpie['rows']['dog']} {magpie['rows']['postie']}"
        )
    numbers = {
        name: {k: v for k, v in c.items() if k != "rows"}
        for name, c in (("magpie", magpie), ("frankenstein", frank))
    }
    numbers["dogPostie"] = magpie["rows"]["dog"]
    data = {
        "samples": runs,
        "page": page(bf, runs[-1]),
        "tokens": {"phrase": PHRASE, "encoding": "o200k_base", "split": tokens()},
        "numbers": numbers,
    }
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(f"window.REAL_MODELS = {json.dumps(data)};\n")
    print(f"{OUT.relative_to(ROOT)}")
    for s in runs:
        print(f"  {s['command']}\n    copied run {s['run']}: {' '.join(s['text'])}")
    f = numbers["frankenstein"]
    print(
        f"  magpie {numbers['magpie']['words']} words, {numbers['magpie']['boxes']} boxes;"
        f" Frankenstein {f['words']:,} words, {f['boxes']:,} boxes, {f['nonzero']:,} nonzero"
        f" ({f['nonzero'] / f['boxes']:.3%}); dog = postie = {numbers['dogPostie']}"
    )


if __name__ == "__main__":
    main()
