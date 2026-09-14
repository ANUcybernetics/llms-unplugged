#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = [
#   "typer>=0.15",
#   "loguru>=0.7",
#   "edge-tts>=6.1",
# ]
# ///
"""Build a scratch voice track from a video's script, so timing exists before
the real voice-over is recorded.

    ops/video/voice.py scratch <slug>
    ops/video/voice.py scratch --all

Parses ops/video/scripts/<slug>.md's `## Script` section into spoken lines,
writes ops/video/<slug>/lines.json (committed --- align.py and the composition
both read it), synthesises each line with edge-tts (cached by voice+text
hash), and assembles them into out/video/<slug>/voice.wav with
out/video/<slug>/voice-lines.json recording each line's true offset, which
align.py uses to report its own error.

Needs ffmpeg and ffprobe on PATH. Resolves the repo root from its own path, so
it runs from anywhere.
"""

import asyncio
import hashlib
import json
import re
import shutil
import subprocess
from pathlib import Path

import edge_tts
import typer
from loguru import logger

ROOT = Path(__file__).resolve().parents[2]
SCRIPTS_DIR = ROOT / "ops/video/scripts"
CACHE_DIR = ROOT / "out/video/_tts-cache"

# The eight slugs from ops/video/README.md's series table.
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

VOICE_FOR_SPEAKER = {
    "BEN": "en-AU-WilliamMultilingualNeural",
    "USHINI": "en-AU-NatashaNeural",
}

START_SILENCE = 0.5
GAP_SILENCE = 0.7
END_SILENCE = 1.0

SPEAKER_RE = re.compile(r"^\*\*(BEN|USHINI)(?:\s*\(([A-Za-z]+)\))?:\*\*\s*(.*)$", re.S)
QUOTE_STRIP = {ord(c): None for c in "‘’“”"}


def markdownize(text: str) -> str:
    """Strip the script's markdown down to what's shown on screen: `_x_`
    italics unwrapped, `**` bold markers dropped, `---` becomes an em dash with
    no surrounding spaces.
    """
    text = re.sub(r"_([^_]+)_", r"\1", text)
    text = text.replace("**", "")
    text = text.replace("---", "—")
    return text


def tts_text(caption: str) -> str:
    """What the TTS reads: the caption, with the em dash read as a pause and
    typographic quotes dropped (edge-tts otherwise voices the punctuation).
    """
    text = caption.replace("—", ", ")
    return text.translate(QUOTE_STRIP)


def parse_script(md_text: str, slug: str) -> list[dict]:
    if "## Script" not in md_text:
        raise RuntimeError(f"{slug}: no '## Script' heading in scripts/{slug}.md")
    after = md_text.split("## Script", 1)[1]
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", after) if p.strip()]
    lines = []
    for para in paragraphs:
        if para.startswith("_Visual"):
            continue
        joined = " ".join(line.strip() for line in para.splitlines())
        match = SPEAKER_RE.match(joined)
        if not match:
            raise RuntimeError(
                f"{slug}: unrecognised paragraph in script: {joined[:80]!r}"
            )
        speaker, tag, body = match.groups()
        caption = markdownize(body).strip()
        lines.append(
            {
                "i": len(lines),
                "speaker": speaker,
                "tc": tag == "TC",
                "caption": caption,
                "tts": tts_text(caption),
            }
        )
    if not lines:
        raise RuntimeError(f"{slug}: no spoken lines found under '## Script'")
    return lines


def cache_path(voice: str, text: str) -> Path:
    digest = hashlib.sha1(f"{voice}:{text}".encode()).hexdigest()
    return CACHE_DIR / f"{digest}.mp3"


async def synth_line(text: str, voice: str, out_path: Path) -> None:
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(str(out_path))


async def synth_all(slug: str, lines: list[dict]) -> list[Path]:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    paths = []
    for line in lines:
        voice = VOICE_FOR_SPEAKER[line["speaker"]]
        path = cache_path(voice, line["tts"])
        if path.exists():
            logger.debug(f"{slug}: line {line['i']} cache hit")
        else:
            logger.info(f"{slug}: synthesising line {line['i']} ({line['speaker']})")
            await synth_line(line["tts"], voice, path)
        paths.append(path)
    return paths


def probe_duration(path: Path) -> float:
    result = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(path),
        ],
        capture_output=True,
        text=True,
        check=True,
    )
    return float(result.stdout.strip())


def make_silence(path: Path, duration: float) -> None:
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-v",
            "error",
            "-f",
            "lavfi",
            "-i",
            "anullsrc=r=48000:cl=mono",
            "-t",
            str(duration),
            "-ar",
            "48000",
            "-ac",
            "1",
            "-sample_fmt",
            "s16",
            str(path),
        ],
        check=True,
    )


def convert_line(mp3: Path, wav: Path) -> None:
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-v",
            "error",
            "-i",
            str(mp3),
            "-ar",
            "48000",
            "-ac",
            "1",
            "-sample_fmt",
            "s16",
            str(wav),
        ],
        check=True,
    )


def concat_wavs(pieces: list[Path], out_path: Path) -> None:
    cmd = ["ffmpeg", "-y", "-v", "error"]
    for piece in pieces:
        cmd += ["-i", str(piece)]
    n = len(pieces)
    graph = "".join(f"[{i}:a]" for i in range(n)) + f"concat=n={n}:v=0:a=1[out]"
    cmd += [
        "-filter_complex",
        graph,
        "-map",
        "[out]",
        "-ar",
        "48000",
        "-ac",
        "1",
        "-sample_fmt",
        "s16",
        str(out_path),
    ]
    subprocess.run(cmd, check=True)


def build_scratch(slug: str) -> float:
    script_path = SCRIPTS_DIR / f"{slug}.md"
    lines = parse_script(script_path.read_text(), slug)

    comp_dir = ROOT / f"ops/video/{slug}"
    comp_dir.mkdir(parents=True, exist_ok=True)
    lines_json = comp_dir / "lines.json"
    lines_json.write_text(json.dumps(lines, indent=2, ensure_ascii=False) + "\n")
    logger.info(f"{slug}: wrote {lines_json.relative_to(ROOT)} ({len(lines)} lines)")

    mp3_paths = asyncio.run(synth_all(slug, lines))

    work_dir = ROOT / f"out/video/{slug}"
    work_dir.mkdir(parents=True, exist_ok=True)
    pieces_dir = work_dir / "_pieces"
    pieces_dir.mkdir(parents=True, exist_ok=True)
    try:
        line_wavs = []
        durations = []
        for line, mp3 in zip(lines, mp3_paths):
            wav = pieces_dir / f"line-{line['i']:03d}.wav"
            convert_line(mp3, wav)
            durations.append(probe_duration(wav))
            line_wavs.append(wav)

        start_silence = pieces_dir / "silence-start.wav"
        gap_silence = pieces_dir / "silence-gap.wav"
        end_silence = pieces_dir / "silence-end.wav"
        make_silence(start_silence, START_SILENCE)
        make_silence(gap_silence, GAP_SILENCE)
        make_silence(end_silence, END_SILENCE)

        pieces = [start_silence]
        offsets = []
        t = START_SILENCE
        for idx, (wav, dur) in enumerate(zip(line_wavs, durations)):
            pieces.append(wav)
            offsets.append(
                {"i": lines[idx]["i"], "start": round(t, 3), "end": round(t + dur, 3)}
            )
            t += dur
            if idx != len(line_wavs) - 1:
                pieces.append(gap_silence)
                t += GAP_SILENCE
        pieces.append(end_silence)

        voice_wav = work_dir / "voice.wav"
        concat_wavs(pieces, voice_wav)
    finally:
        shutil.rmtree(pieces_dir, ignore_errors=True)

    voice_lines_json = work_dir / "voice-lines.json"
    voice_lines_json.write_text(json.dumps(offsets, indent=2) + "\n")

    total = probe_duration(voice_wav)
    logger.info(f"{slug}: {voice_wav.relative_to(ROOT)} = {total:.2f}s")
    return total


app = typer.Typer()


# A no-op callback stops Typer collapsing a single-command app into a bare
# `voice.py <slug>` CLI --- keeps `scratch` as an explicit subcommand so a
# sibling command (a future `voice.py record`, say) can join it later.
@app.callback()
def cli() -> None:
    pass


@app.command()
def scratch(
    slug: str = typer.Argument(None, help="video slug, e.g. training-grid"),
    all_: bool = typer.Option(False, "--all", help="build every slug in the series"),
) -> None:
    if all_ and slug is not None:
        raise typer.BadParameter("pass either a slug or --all, not both")
    targets = SLUGS if all_ else [slug] if slug else None
    if not targets:
        raise typer.BadParameter("pass a slug or --all")

    durations = {}
    for target in targets:
        durations[target] = build_scratch(target)

    for target, duration in durations.items():
        logger.info(f"{target}: {duration:.2f}s")


if __name__ == "__main__":
    app()
