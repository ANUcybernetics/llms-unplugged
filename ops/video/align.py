#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = [
#   "faster-whisper>=1.1",
#   "typer>=0.15",
#   "loguru>=0.7",
#   "nvidia-cudnn-cu12; sys_platform == 'linux'",
#   "nvidia-cublas-cu12; sys_platform == 'linux'",
# ]
# ///
"""Time a video's script lines against a voice track by forced alignment.

    ops/video/align.py <slug> [--audio PATH] [--model large-v3]

The same path for the scratch track voice.py builds now and the real VO takes
later: transcribes the audio (word timestamps, faster-whisper), fuzzy-matches
the transcript's words against the script's (ops/video/<slug>/lines.json,
written by voice.py), and interpolates the handful of words that don't match.
Writes ops/video/<slug>/timing.json and captions.vtt, and copies the audio to
ops/video/<slug>/assets/voice.wav (gitignored --- that's the composition's
<audio> source). Default audio is out/video/<slug>/voice.wav, the scratch
track; point --audio at a real take once one is recorded, same script,
same output.

No `initial_prompt`/`hotwords`: priming faster-whisper with the script's own
upcoming words --- which is exactly what the scratch track is about to say ---
made it treat that text as already spoken and skip ahead, dropping the true
opening words of a line (multi-second errors, match ratio ~0.80). Plain
transcription matches this clean TTS audio closely (ratio ~0.98); real VO
takes should be checked the same way if a similar drop-off shows up.

Needs ffmpeg/ffprobe on PATH. Resolves the repo root from its own path, so it
runs from anywhere.
"""

import ctypes
import difflib
import glob
import json
import re
import shutil
import site
import subprocess
from pathlib import Path
from statistics import mean

import typer
from loguru import logger

# ctranslate2 doesn't find the pip-installed NVIDIA libraries on its own;
# preload them so a uv-managed environment works without a system CUDA
# install. Copied from .claude/skills/llms-unplugged-video/scripts/transcribe.py.
for sp in site.getsitepackages():
    for lib in sorted(glob.glob(f"{sp}/nvidia/*/lib/*.so*")):
        try:
            ctypes.CDLL(lib, mode=ctypes.RTLD_GLOBAL)
        except OSError:
            pass

from faster_whisper import WhisperModel  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]

START_PAD = 0.15
END_PAD = 0.2
EXTRAPOLATE_STEP = 0.25


def load_model(name: str) -> WhisperModel:
    try:
        return WhisperModel(name, device="cuda", compute_type="float16")
    except (RuntimeError, ValueError) as e:
        logger.warning(f"CUDA unavailable ({e.__class__.__name__}); using CPU int8")
        return WhisperModel(name, device="cpu", compute_type="int8")


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


def normalize(word: str) -> str:
    return re.sub(r"[^a-z0-9']", "", word.lower())


def build_norm_seq(words: list[str]) -> tuple[list[str], list[int]]:
    """Normalised tokens plus a map back to the original index, so words that
    normalise to nothing (stray punctuation) are excluded from matching but
    still get a slot to interpolate a time into.
    """
    norm, idx_map = [], []
    for i, w in enumerate(words):
        n = normalize(w)
        if n:
            norm.append(n)
            idx_map.append(i)
    return norm, idx_map


def align_words(
    script_words: list[str], transcript_words: list[tuple[str, float, float]]
) -> tuple[list[tuple[float, float]], float]:
    """Match ratio, plus a (start, end) per script word --- matched from the
    transcript where SequenceMatcher found one, linearly interpolated between
    the nearest matches otherwise, extrapolated by a fixed step past the ends.
    """
    script_norm, script_idx_map = build_norm_seq(script_words)
    trans_norm, trans_idx_map = build_norm_seq([w for w, _s, _e in transcript_words])

    matcher = difflib.SequenceMatcher(None, script_norm, trans_norm, autojunk=False)
    matched: dict[int, tuple[float, float]] = {}
    for block in matcher.get_matching_blocks():
        for k in range(block.size):
            script_idx = script_idx_map[block.a + k]
            trans_idx = trans_idx_map[block.b + k]
            _w, start, end = transcript_words[trans_idx]
            matched[script_idx] = (start, end)

    if not matched:
        raise RuntimeError("alignment: no script words matched the transcript at all")

    n = len(script_words)
    resolved: list[tuple[float, float] | None] = [None] * n
    for i, t in matched.items():
        resolved[i] = t

    matched_idx = sorted(matched)
    for gi in range(len(matched_idx) - 1):
        lo, hi = matched_idx[gi], matched_idx[gi + 1]
        if hi - lo <= 1:
            continue
        lo_start, lo_end = resolved[lo]
        hi_start, hi_end = resolved[hi]
        span = hi - lo
        for k in range(1, span):
            frac = k / span
            resolved[lo + k] = (
                lo_start + (hi_start - lo_start) * frac,
                lo_end + (hi_end - lo_end) * frac,
            )

    first = matched_idx[0]
    base_start, base_end = resolved[first]
    for i in range(first - 1, -1, -1):
        steps = first - i
        resolved[i] = (
            base_start - EXTRAPOLATE_STEP * steps,
            base_end - EXTRAPOLATE_STEP * steps,
        )

    last = matched_idx[-1]
    base_start, base_end = resolved[last]
    for i in range(last + 1, n):
        steps = i - last
        resolved[i] = (
            base_start + EXTRAPOLATE_STEP * steps,
            base_end + EXTRAPOLATE_STEP * steps,
        )

    match_ratio = len(matched) / len(script_norm) if script_norm else 0.0
    return resolved, match_ratio


def line_boundaries(
    lines: list[dict], word_line_of: list[int], resolved: list[tuple[float, float]]
) -> tuple[list[float], list[float]]:
    n = len(lines)
    first_idx = [None] * n
    last_idx = [None] * n
    for word_idx, li in enumerate(word_line_of):
        if first_idx[li] is None:
            first_idx[li] = word_idx
        last_idx[li] = word_idx

    raw_starts = [resolved[first_idx[i]][0] - START_PAD for i in range(n)]
    raw_ends = [resolved[last_idx[i]][1] + END_PAD for i in range(n)]

    starts, ends = [0.0] * n, [0.0] * n
    prev_end = 0.0
    for i in range(n):
        s = max(raw_starts[i], prev_end, 0.0)
        e = min(raw_ends[i], raw_starts[i + 1]) if i + 1 < n else raw_ends[i]
        e = max(e, s)
        starts[i], ends[i] = s, e
        prev_end = e
    return starts, ends


def fmt_timestamp(t: float) -> str:
    total_ms = round(t * 1000)
    h, total_ms = divmod(total_ms, 3600000)
    m, total_ms = divmod(total_ms, 60000)
    s, ms = divmod(total_ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d}.{ms:03d}"


def write_vtt(path: Path, lines: list[dict]) -> None:
    parts = ["WEBVTT\n"]
    for line in lines:
        parts.append(
            f"\n{fmt_timestamp(line['start'])} --> {fmt_timestamp(line['end'])}\n{line['caption']}\n"
        )
    path.write_text("".join(parts))


def main(
    slug: str,
    audio: Path = typer.Option(
        None, "--audio", help="voice track (default: out/video/<slug>/voice.wav)"
    ),
    model: str = typer.Option("large-v3", "--model", help="faster-whisper model name"),
) -> None:
    comp_dir = ROOT / f"ops/video/{slug}"
    lines_path = comp_dir / "lines.json"
    lines = json.loads(lines_path.read_text())

    audio_path = audio if audio is not None else ROOT / f"out/video/{slug}/voice.wav"
    if not audio_path.exists():
        raise RuntimeError(f"{slug}: no audio at {audio_path}")

    script_words: list[str] = []
    word_line_of: list[int] = []
    for line in lines:
        for w in line["tts"].split():
            script_words.append(w)
            word_line_of.append(line["i"])

    logger.info(f"{slug}: transcribing {audio_path} with {model}")
    whisper = load_model(model)
    segments, _info = whisper.transcribe(
        str(audio_path),
        language="en",
        word_timestamps=True,
        vad_filter=True,
        beam_size=5,
    )
    transcript_words: list[tuple[str, float, float]] = []
    for seg in segments:
        for w in seg.words or []:
            transcript_words.append((w.word.strip(), w.start, w.end))
    logger.info(f"{slug}: transcript has {len(transcript_words)} words")

    resolved, match_ratio = align_words(script_words, transcript_words)
    starts, ends = line_boundaries(lines, word_line_of, resolved)

    duration = probe_duration(audio_path)

    out_lines = []
    word_cursor = 0
    for i, line in enumerate(lines):
        n_words = sum(1 for li in word_line_of if li == line["i"])
        words = [
            {
                "w": script_words[word_cursor + k],
                "start": round(resolved[word_cursor + k][0], 3),
                "end": round(resolved[word_cursor + k][1], 3),
            }
            for k in range(n_words)
        ]
        word_cursor += n_words
        out_lines.append(
            {
                "i": line["i"],
                "speaker": line["speaker"],
                "tc": line["tc"],
                "caption": line["caption"],
                "start": round(starts[i], 3),
                "end": round(ends[i], 3),
                "words": words,
            }
        )

    logger.info(f"{slug}: match ratio {match_ratio:.3f}")

    voice_lines_path = ROOT / f"out/video/{slug}/voice-lines.json"
    if voice_lines_path.exists():
        expected = json.loads(voice_lines_path.read_text())
        errors = [
            abs(out_lines[e["i"]]["start"] - e["start"])
            for e in expected
            if e["i"] < len(out_lines)
        ]
        logger.info(
            f"{slug}: vs voice-lines.json --- mean start error {mean(errors):.3f}s, "
            f"max {max(errors):.3f}s over {len(errors)} lines"
        )
    else:
        logger.info(f"{slug}: no voice-lines.json to check against")

    timing = {
        "slug": slug,
        "audio": "assets/voice.wav",
        "duration": round(duration, 3),
        "lines": out_lines,
    }
    timing_path = comp_dir / "timing.json"
    timing_path.write_text(json.dumps(timing, indent=2, ensure_ascii=False) + "\n")
    logger.info(f"{slug}: wrote {timing_path.relative_to(ROOT)}")

    vtt_path = comp_dir / "captions.vtt"
    write_vtt(vtt_path, out_lines)
    logger.info(f"{slug}: wrote {vtt_path.relative_to(ROOT)}")

    assets_dir = comp_dir / "assets"
    assets_dir.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(audio_path, assets_dir / "voice.wav")
    logger.info(
        f"{slug}: copied audio to {(assets_dir / 'voice.wav').relative_to(ROOT)}"
    )


if __name__ == "__main__":
    typer.run(main)
