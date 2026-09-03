#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = ["typer>=0.15"]
# ///
"""Size a ledger set for a room by sweeping `--max-tokens`.

A ledger set for a classroom is bounded by its counters. With balls in eight
colours, no prefix may run past two rows (eight followers at four columns),
and the largest tally count on any one follower is how many balls of one
colour a single draw can need per group. Both numbers fall as the text is cut
shorter, and neither is obvious from the text itself, so this runs the `ledger`
subcommand across a range of token budgets and prints one row per budget:

    budget  tokens  prefixes  widest  rows  colours  max_count  max_row

`widest` is the most followers any prefix has, `rows` how many ledger rows
that prefix takes at the column count, `colours` how many counter colours the
set needs (rows times columns, capped at the palettes in use), `max_count` the
largest single tally, and `max_row` the most tallies on one prefix, which is
how many balls of one group colour the bucket finale can ask a group for.

The sweep stops at the first budget the text is shorter than, printing that
row as the whole text.

Usage:
  ops/ledger-sweep.py data/green-eggs-and-ham.txt
  ops/ledger-sweep.py data/one.txt --start 60 --stop 200 --step 20
  ops/ledger-sweep.py data/*.txt --start 60 --stop 100 --step 20
"""

from __future__ import annotations

import json
import subprocess
import tempfile
from pathlib import Path
from typing import Annotated

import typer

REPO = Path(__file__).resolve().parent.parent
DEFAULT_CLI = REPO / "cli" / "target" / "release" / "llms_unplugged"

app = typer.Typer(add_completion=False)


def ledger_json(cli: Path, corpus: Path, budget: int | None, columns: int) -> dict:
    """Run the ledger subcommand JSON-only and return ledger.json."""
    with tempfile.TemporaryDirectory() as out:
        cmd = [
            str(cli),
            "ledger",
            "-i",
            str(corpus),
            "--json-only",
            "--columns",
            str(columns),
            "-o",
            out,
        ]
        if budget is not None:
            cmd += ["--max-tokens", str(budget)]
        subprocess.run(cmd, check=True, capture_output=True)
        return json.loads((Path(out) / "ledger.json").read_text())


def stats(data: dict, columns: int, palettes: int) -> dict:
    entries = [e for sheet in data["sheets"] for page in sheet["pages"] for e in page]
    widest = max((len(e["followers"]) for e in entries), default=0)
    rows = max(1, -(-widest // columns))
    return {
        "tokens": data["metadata"]["total_tokens"],
        "prefixes": len(entries),
        "widest": widest,
        "rows": rows,
        "colours": min(rows, palettes) * columns,
        "max_count": max(
            (f["count"] for e in entries for f in e["followers"]), default=0
        ),
        "max_row": max(
            (sum(f["count"] for f in e["followers"]) for e in entries), default=0
        ),
        # Absent when the budget was not needed: the text was shorter.
        "cut": "max_tokens" in data["metadata"],
    }


COLUMNS = (
    "budget",
    "tokens",
    "prefixes",
    "widest",
    "rows",
    "colours",
    "max_count",
    "max_row",
)


def print_row(cells: list[str]) -> None:
    print("  ".join(c.rjust(len(h)) for c, h in zip(cells, COLUMNS, strict=True)))


@app.command()
def sweep(
    corpora: Annotated[
        list[Path], typer.Argument(help="Corpus text file(s), one sweep each")
    ],
    start: Annotated[int, typer.Option(help="First token budget")] = 100,
    stop: Annotated[int, typer.Option(help="Last token budget (inclusive)")] = 400,
    step: Annotated[int, typer.Option(help="Budget step")] = 50,
    columns: Annotated[int, typer.Option(help="Follower cells per row")] = 4,
    palettes: Annotated[int, typer.Option(help="Palettes the sheets cycle (1-3)")] = 3,
    cli: Annotated[
        Path, typer.Option(help="Path to the llms_unplugged binary")
    ] = DEFAULT_CLI,
) -> None:
    """Print ledger sizing numbers for each corpus across a range of budgets."""
    if not cli.exists():
        raise typer.BadParameter(
            f"{cli} not built --- run `cargo build --release` in cli/"
        )
    for corpus in corpora:
        print(corpus)
        print_row(list(COLUMNS))
        for budget in range(start, stop + 1, step):
            s = stats(ledger_json(cli, corpus, budget, columns), columns, palettes)
            label = str(budget) if s["cut"] else "full"
            print_row([label] + [str(s[k]) for k in COLUMNS[1:]])
            if not s["cut"]:
                break
        else:
            s = stats(ledger_json(cli, corpus, None, columns), columns, palettes)
            print_row(["full"] + [str(s[k]) for k in COLUMNS[1:]])
        print()


if __name__ == "__main__":
    app()
