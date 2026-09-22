#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = ["httpx>=0.28", "typer>=0.15"]
# ///
"""Deposit a new version of the LLMs Unplugged record on Zenodo.

    mise exec -- ops/zenodo-deposit.py 1.4.9            # leaves a draft
    mise exec -- ops/zenodo-deposit.py 1.4.9 --publish  # publishes it

Uploads the two files `make archive` writes, the bundle and the source zip, as
a new version of the concept record (10.5281/zenodo.17403824, what
CITATION.cff cites). The version's metadata is `.zenodo.json` plus `version`
and today's `publication_date`. Without `--publish` it stops at a draft to
check on the Zenodo website; publishing mints a DOI and cannot be undone.

Needs ZENODO_ACCESS_TOKEN (scopes deposit:write and deposit:actions) from the
untracked mise env block.
"""

import json
import os
import time
from datetime import datetime
from pathlib import Path

import httpx
import typer

API = "https://zenodo.org/api"
CONCEPT_RECORD = "17403824"
ROOT = Path(__file__).resolve().parent.parent
ARCHIVE = ROOT / "out" / "archive"


def client() -> httpx.Client:
    token = os.environ["ZENODO_ACCESS_TOKEN"]
    return httpx.Client(
        headers={"Authorization": f"Bearer {token}"},
        timeout=httpx.Timeout(60, write=None),
    )


def upload(http: httpx.Client, bucket: str, path: Path) -> None:
    """PUT one file to the draft's bucket, streamed.

    The bucket PUT returns the odd transient 502, so retry. The filename must be
    flat: a `/` in it 404s.
    """
    for attempt in range(1, 4):
        with path.open("rb") as f:
            r = http.put(f"{bucket}/{path.name}", content=f)
        if r.status_code < 500:
            r.raise_for_status()
            print(f"uploaded {path.name} ({path.stat().st_size / 1e6:.1f} MB)")
            return
        print(f"{path.name}: HTTP {r.status_code}, attempt {attempt} of 3")
        time.sleep(10 * attempt)
    r.raise_for_status()


def main(
    version: str,
    publish: bool = typer.Option(False, help="Publish the draft (mints the DOI)."),
) -> None:
    files = [
        ARCHIVE / f"llms-unplugged-{version}.zip",
        ARCHIVE / f"llms-unplugged-{version}-source.zip",
    ]
    for path in files:
        if not path.exists():
            raise SystemExit(f"{path} is missing; run `make archive` first")

    with client() as http:
        latest = http.get(f"{API}/records/{CONCEPT_RECORD}").raise_for_status().json()
        if latest["metadata"].get("version") == version:
            raise SystemExit(f"version {version} is already published")

        # Returns the concept's open draft if one already exists.
        r = http.post(f"{API}/deposit/depositions/{latest['id']}/actions/newversion")
        draft_url = r.raise_for_status().json()["links"]["latest_draft"]
        draft = http.get(draft_url).raise_for_status().json()
        print(f"draft {draft['id']}")

        # A new version inherits the previous version's files.
        for f in draft["files"]:
            http.delete(f"{draft_url}/files/{f['id']}").raise_for_status()
        for path in files:
            upload(http, draft["links"]["bucket"], path)

        metadata = json.loads((ROOT / ".zenodo.json").read_text())
        metadata |= {
            "version": version,
            "publication_date": datetime.now().astimezone().date().isoformat(),
        }
        http.put(draft_url, json={"metadata": metadata}).raise_for_status()

        if publish:
            done = http.post(f"{draft_url}/actions/publish").raise_for_status().json()
            print(f"published {done['doi']}: {done['links']['html']}")
        else:
            print(f"draft ready to check and publish: {draft['links']['html']}")


if __name__ == "__main__":
    typer.run(main)
