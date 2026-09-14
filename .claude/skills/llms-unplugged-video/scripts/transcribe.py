# /// script
# requires-python = ">=3.12"
# dependencies = [
#   "faster-whisper>=1.1",
#   "typer>=0.15",
#   "nvidia-cudnn-cu12; sys_platform == 'linux'",
#   "nvidia-cublas-cu12; sys_platform == 'linux'",
# ]
# ///
"""Word-timestamped transcript of a recording, for authoring a video timeline.

    uv run transcribe.py <audio.wav> <transcript.json> [--model large-v3] [--language en]

Feed it 16 kHz mono (see references/ffmpeg.md). Writes one segment per line
of speech with a `words` list carrying start/end/probability, and prints the
segments as it goes so a long recording shows progress. Uses CUDA when
available, otherwise the CPU in int8 --- slower, but the same output.
"""

import ctypes
import glob
import json
import site
import sys
import time
from pathlib import Path

import typer

# ctranslate2 doesn't find the pip-installed NVIDIA libraries on its own; preload
# them so a uv-managed environment works without a system CUDA install.
for sp in site.getsitepackages():
    for lib in sorted(glob.glob(f"{sp}/nvidia/*/lib/*.so*")):
        try:
            ctypes.CDLL(lib, mode=ctypes.RTLD_GLOBAL)
        except OSError:
            pass

from faster_whisper import WhisperModel  # noqa: E402


def load_model(name: str) -> WhisperModel:
    try:
        return WhisperModel(name, device="cuda", compute_type="float16")
    except (RuntimeError, ValueError) as e:
        print(
            f"CUDA unavailable ({e.__class__.__name__}); using CPU int8",
            file=sys.stderr,
        )
        return WhisperModel(name, device="cpu", compute_type="int8")


def main(
    audio: Path,
    out: Path,
    model: str = "large-v3",
    language: str = "en",
) -> None:
    t0 = time.time()
    m = load_model(model)
    segments, _info = m.transcribe(
        str(audio),
        language=language,
        word_timestamps=True,
        vad_filter=True,
        beam_size=5,
    )
    segs = []
    for s in segments:
        segs.append(
            {
                "start": s.start,
                "end": s.end,
                "text": s.text,
                "words": [
                    {"start": w.start, "end": w.end, "word": w.word, "p": w.probability}
                    for w in (s.words or [])
                ],
            }
        )
        print(f"[{s.start:8.2f} -> {s.end:8.2f}] {s.text}", flush=True)
    out.write_text(json.dumps(segs, ensure_ascii=False, indent=1))
    print(f"wrote {out} in {time.time() - t0:.0f}s", file=sys.stderr)


if __name__ == "__main__":
    typer.run(main)
