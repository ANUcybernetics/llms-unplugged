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

    budget  tokens  prefixes  widest  rows  colours  max_count  max_row  dead

`widest` is the most followers any prefix has, `rows` how many ledger rows
that prefix takes at the column count, `max_count` the largest single tally,
and `max_row` the most tallies on one prefix, which is how many counters of
one group colour a group can be asked for at once.

`colours` is how many counter colours the room actually needs: the strips are
coloured by column and the palette cycles down each page a rowful at a time,
so a page long enough to come back round uses every colour in the palette
whether or not any single prefix is wide enough to need them. Capping
followers narrows a row, not a page --- print with a shorter --palette to
narrow the room.

`dead` counts the contexts a group can draw but has no row for --- almost
always the text's last token, when the budget leaves it appearing nowhere
else. A group that reaches one stalls with nothing to look up, so a budget
with a non-zero `dead` is the wrong budget however good its other numbers
are. It moves with the cut rather than with the text, so neighbouring
budgets are usually fine.

The sweep stops at the first budget the text is shorter than, printing that
row as the whole text.

Pass the room's palette through with `--palette` exactly as the `ledger`
subcommand takes it (inline JSON or @file), so the colour count is the one
that room has.

Usage:
  ops/ledger-sweep.py data/green-eggs-and-ham.txt
  ops/ledger-sweep.py data/one.txt --start 60 --stop 200 --step 20
  ops/ledger-sweep.py data/*.txt --palette @cli/ledger-palette-four.json
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


def ledger_json(
    cli: Path,
    corpus: Path,
    budget: int | None,
    columns: int,
    palette: str | None,
    max_followers: int | None,
) -> dict:
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
        if palette is not None:
            cmd += ["--palette", palette]
        if budget is not None:
            cmd += ["--max-tokens", str(budget)]
        if max_followers is not None:
            cmd += ["--max-followers", str(max_followers)]
        done = subprocess.run(cmd, capture_output=True, text=True, check=False)
        if done.returncode != 0:
            # A budget the set cannot be built at (an entry taller than a
            # page, say) is a fact about that budget, not a reason to abandon
            # the sweep --- print it in place and carry on to the next.
            raise LedgerFailed(done.stderr.strip().splitlines()[-1])
        return json.loads((Path(out) / "ledger.json").read_text())


class LedgerFailed(Exception):
    """The ledger subcommand refused a budget; the message says why."""


def dead_ends(entries: list[dict]) -> list[str]:
    """Contexts reachable as a continuation that have no row of their own.

    The successor of (prefix, follower) is the prefix shifted along by one
    with the follower appended, which for bigrams is just the follower.
    """
    contexts = {tuple(e["prefix"]) for e in entries}
    out = set()
    for e in entries:
        for f in e["followers"]:
            nxt = tuple(e["prefix"][1:]) + (f["text"],)
            if nxt not in contexts:
                out.add(" ".join(nxt))
    return sorted(out)


def colours_used(data: dict, columns: int) -> int:
    """Counter colours any strip in the set takes.

    The palette cycles down a page by physical row, so this counts the row
    positions the pages actually reach rather than the rows one prefix needs.
    """
    cycles = max(1, len(data["palette"]) // columns)
    reached = set()
    for sheet in data["sheets"]:
        for page in sheet["pages"]:
            row = 0
            for e in page:
                for r in range(max(1, -(-len(e["followers"]) // columns))):
                    reached.add((row + r) % cycles)
                row += max(1, -(-len(e["followers"]) // columns))
    return len(reached) * columns


def stats(data: dict, columns: int) -> dict:
    entries = [e for sheet in data["sheets"] for page in sheet["pages"] for e in page]
    widest = max((len(e["followers"]) for e in entries), default=0)
    rows = max(1, -(-widest // columns))
    return {
        "tokens": data["metadata"]["total_tokens"],
        "prefixes": len(entries),
        "widest": widest,
        "rows": rows,
        "colours": colours_used(data, columns),
        "max_count": max(
            (f["count"] for e in entries for f in e["followers"]), default=0
        ),
        "max_row": max(
            (sum(f["count"] for f in e["followers"]) for e in entries), default=0
        ),
        "dead": len(dead_ends(entries)),
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
    "dead",
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
    palette: Annotated[
        str | None,
        typer.Option(help="Counter colours as the ledger subcommand takes them"),
    ] = None,
    max_followers: Annotated[
        int | None,
        typer.Option(help="Cap followers per prefix, as the ledger subcommand does"),
    ] = None,
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
            try:
                data = ledger_json(cli, corpus, budget, columns, palette, max_followers)
            except LedgerFailed as failed:
                print(f"{budget:>6}  {failed}")
                continue
            s = stats(data, columns)
            label = str(budget) if s["cut"] else "full"
            print_row([label] + [str(s[k]) for k in COLUMNS[1:]])
            if not s["cut"]:
                break
        else:
            try:
                data = ledger_json(cli, corpus, None, columns, palette, max_followers)
            except LedgerFailed as failed:
                print(f"{'full':>6}  {failed}")
            else:
                print_row(
                    ["full"] + [str(stats(data, columns)[k]) for k in COLUMNS[1:]]
                )
        print()


if __name__ == "__main__":
    app()
