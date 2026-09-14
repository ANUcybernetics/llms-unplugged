#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = ["typer>=0.15", "boto3>=1.35"]
# ///
"""Check, render, review and publish the explainer video compositions.

    ops/video/video.py check <slug>              # sync data-duration from timing.json, npm run check
    ops/video/video.py render <slug>             # 1080p25 draft -> out/video/<slug>/<slug>-draft.mp4
    ops/video/video.py render <slug> --final     # 4K50 master  -> out/video/<slug>/<slug>.mp4 (+ portrait for the overview)
    ops/video/video.py stills <slug>             # a still at every line start and midpoint, plus contact sheets
    ops/video/video.py upload <slug>             # renders, captions and the voice track -> bucket video/<slug>/
    ops/video/video.py all [--final]             # check + render every slug

A composition's length is the voice track's: every command first rewrites the
`data-duration` attributes in index.html (and compositions/portrait.html) from
timing.json, so re-recording a line and re-running align.py needs no edit
here. The bucket credentials are the ones ops/bucket-sync.py uses.
"""

import importlib.util
import json
import math
import os
import re
import subprocess
import sys
from pathlib import Path

import typer

ROOT = Path(__file__).resolve().parents[2]
VIDEO = ROOT / "ops" / "video"
OUT = ROOT / "out" / "video"
SLUGS = [
    "overview",
    "training-grid",
    "generation-grid",
    "pretrained-generation",
    "agentic-ai",
    "generation-ledger",
    "training-ledger",
    "one-story-all-together",
]
ENV = {**os.environ, "HYPERFRAMES_NO_TELEMETRY": "1"}
CONTENT_TYPES = {
    ".mp4": "video/mp4",
    ".vtt": "text/vtt; charset=utf-8",
    ".wav": "audio/wav",
}

app = typer.Typer(add_completion=False, no_args_is_help=True)


def project(slug: str) -> Path:
    d = VIDEO / slug
    if not (d / "index.html").is_file():
        sys.exit(f"no composition at {d}")
    return d


def timing(slug: str) -> dict:
    return json.loads((project(slug) / "timing.json").read_text())


def sync_duration(slug: str) -> float:
    """Write timing.json's duration (rounded up to 2 dp) into every data-duration."""
    dur = math.ceil(timing(slug)["duration"] * 100) / 100
    for name in ("index.html", "compositions/portrait.html"):
        p = project(slug) / name
        if not p.is_file():
            continue
        src = p.read_text()
        new = re.sub(r'data-duration="[0-9.]+"', f'data-duration="{dur:.2f}"', src)
        if new != src:
            p.write_text(new)
            print(f"{name}: data-duration -> {dur:.2f}")
    return dur


def npm(slug: str, *args: str) -> None:
    subprocess.run(["npm", "run", *args], cwd=project(slug), env=ENV, check=True)


@app.command()
def check(slug: str) -> None:
    """Sync the duration and run the HyperFrames check."""
    sync_duration(slug)
    npm(slug, "check")


@app.command()
def render(slug: str, final: bool = False) -> None:
    """Render a 1080p25 draft, or with --final the 4K50 master(s)."""
    sync_duration(slug)
    out = OUT / slug
    out.mkdir(parents=True, exist_ok=True)
    if final:
        npm(
            slug,
            "render",
            "--",
            "--resolution",
            "landscape-4k",
            "--fps",
            "50",
            "--quality",
            "delivery",
            "--quiet",
            "--output",
            str(out / f"{slug}.mp4"),
        )
        if (project(slug) / "compositions" / "portrait.html").is_file():
            npm(
                slug,
                "render",
                "--",
                "--composition",
                "compositions/portrait.html",
                "--resolution",
                "portrait-4k",
                "--fps",
                "50",
                "--quality",
                "delivery",
                "--quiet",
                "--output",
                str(out / f"{slug}-portrait.mp4"),
            )
    else:
        npm(
            slug,
            "render",
            "--",
            "--quality",
            "draft",
            "--fps",
            "25",
            "--quiet",
            "--output",
            str(out / f"{slug}-draft.mp4"),
        )
        if (project(slug) / "compositions" / "portrait.html").is_file():
            npm(
                slug,
                "render",
                "--",
                "--composition",
                "compositions/portrait.html",
                "--quality",
                "draft",
                "--fps",
                "25",
                "--quiet",
                "--output",
                str(out / f"{slug}-portrait-draft.mp4"),
            )
    vtt = project(slug) / "captions.vtt"
    (out / f"{slug}.vtt").write_text(vtt.read_text())
    print(f"rendered into {out}")


@app.command()
def stills(slug: str, video: str | None = None) -> None:
    """A still at every line start and midpoint, and contact sheets of them."""
    src = Path(video) if video else OUT / slug / f"{slug}-draft.mp4"
    if not src.is_file():
        sys.exit(f"render first: {src} is missing")
    out = OUT / slug / "stills"
    out.mkdir(parents=True, exist_ok=True)
    times: list[float] = []
    for line in timing(slug)["lines"]:
        times += [line["start"] + 0.3, (line["start"] + line["end"]) / 2]
    frames = []
    for t in times:
        f = out / f"{t:07.2f}.png"
        subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-loglevel",
                "error",
                "-ss",
                f"{t:.2f}",
                "-i",
                str(src),
                "-frames:v",
                "1",
                "-vf",
                "scale=960:-1",
                str(f),
            ],
            check=True,
        )
        frames.append(f)
    for i in range(0, len(frames), 8):
        sheet = out / f"sheet-{i // 8 + 1}.png"
        subprocess.run(
            [
                "montage",
                *map(str, frames[i : i + 8]),
                "-tile",
                "2x4",
                "-geometry",
                "960x540+4+4",
                str(sheet),
            ],
            check=True,
        )
        print(sheet)


@app.command()
def upload(slug: str) -> None:
    """Upload the renders, captions and voice track under video/<slug>/ in the bucket."""
    spec = importlib.util.spec_from_file_location(
        "bucket_sync", ROOT / "ops" / "bucket-sync.py"
    )
    bucket_sync = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(bucket_sync)
    s3, bucket = bucket_sync.client(), bucket_sync.bucket_name()
    out = OUT / slug
    files = [
        p
        for p in sorted(out.glob(f"{slug}*"))
        if p.suffix in CONTENT_TYPES and "draft" not in p.name
    ]
    files += [p for p in [out / "voice.wav"] if p.is_file()]
    if not files:
        sys.exit(f"nothing to upload under {out}; render --final first")
    for p in files:
        key = f"video/{slug}/{p.name}"
        s3.upload_file(
            str(p),
            bucket,
            key,
            ExtraArgs={
                "ContentType": CONTENT_TYPES[p.suffix],
                "CacheControl": "public, max-age=86400",
            },
        )
        print(key)


@app.command("all")
def all_(final: bool = False) -> None:
    """Check and render every video."""
    for slug in SLUGS:
        check(slug)
        render(slug, final=final)


if __name__ == "__main__":
    app()
