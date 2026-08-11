#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = ["pillow", "typer"]
# ///
"""Choose and check a sheets palette by how far apart it lands *on paper*.

generate_palette.ts selects in OKLab, which answers "how different do these
look" but not "can a printer make them". Those are different questions, and the
second one bites: sRGB's vivid blues, greens and purples sit outside CMYK, so
the press compresses them toward the gamut boundary and the gaps between them
shrink. Measured on the eight-colour palette against uncoated stock, min
pairwise ΔE fell from 0.130 on screen to 0.091 printed --- under the 0.10 the
rest of this codebase treats as "clearly distinct".

So the selection that matters happens here. The TS generator answers "what
colour does each word mean, printably on white" and dumps its surviving words
(`--dump-candidates`); this script round-trips them through a CMYK profile and
runs the same exhaustive max-min subset search on the printed positions.

The profiles are the ICC set shipped with colord (Debian: colord-data). An
office laser is not an offset press, and nobody is going to profile the one in
the building, so the default is uncoated stock: it is the closest published
reference to plain paper, and it compresses harder than coated, which makes it
the conservative choice. Checking against several is the point --- a palette
that holds up across coated, uncoated and newsprint will hold up on whatever
is in the machine on the day.

Usage:
    node generate_palette.ts --nameable --n 8 --min-white-contrast 4.5 \
        --dump-candidates > /tmp/candidates.csv
    ./check_palette_print.py /tmp/candidates.csv --n 8
    ./check_palette_print.py /tmp/candidates.csv --n 8 --check-only black,red,...
"""

import itertools
import math
from dataclasses import dataclass
from pathlib import Path

import typer
from PIL import Image, ImageCms

ICC_DIR = Path("/usr/share/color/icc/colord")
SRGB = ICC_DIR / "sRGB.icc"

# Uncoated first: it is the default, and the closest published stand-in for the
# plain A4 these sheets print on.
PROFILES = {
    "uncoated": ICC_DIR / "FOGRA47L_uncoated.icc",
    "coated": ICC_DIR / "FOGRA39L_coated.icc",
    "newsprint": ICC_DIR / "SNAP_TR002_newsprint.icc",
}

# The band the repo treats as clearly distinct at a glance; below it, two
# swatches start being told apart by reading the token rather than seeing it.
CLEARLY_DISTINCT = 0.10


@dataclass(frozen=True)
class Swatch:
    name: str
    rgb: tuple[float, float, float]
    name_cost: float


def srgb_to_oklab(r: float, g: float, b: float) -> tuple[float, float, float]:
    def lin(c: float) -> float:
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

    lr, lg, lb = lin(r), lin(g), lin(b)
    l_ = (0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb) ** (1 / 3)
    m_ = (0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb) ** (1 / 3)
    s_ = (0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb) ** (1 / 3)
    return (
        0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
        1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
        0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
    )


def print_roundtrip(
    swatches: list[Swatch], profile: Path
) -> list[tuple[float, float, float]]:
    """sRGB -> CMYK -> sRGB, i.e. what survives being put on paper.

    Relative colorimetric with black point compensation is the path a print
    driver takes by default. Perceptual was measured too and moves the answer
    by under 0.001 ΔE, so it is not worth a flag.
    """
    src = ImageCms.getOpenProfile(str(SRGB))
    dst = ImageCms.getOpenProfile(str(profile))
    image = Image.new("RGB", (len(swatches), 1))
    image.putdata([tuple(round(c * 255) for c in s.rgb) for s in swatches])
    to_cmyk = ImageCms.buildTransform(
        src,
        dst,
        "RGB",
        "CMYK",
        renderingIntent=ImageCms.Intent.RELATIVE_COLORIMETRIC,
        flags=ImageCms.Flags.BLACKPOINTCOMPENSATION,
    )
    back = ImageCms.buildTransform(
        dst,
        src,
        "CMYK",
        "RGB",
        renderingIntent=ImageCms.Intent.RELATIVE_COLORIMETRIC,
        flags=ImageCms.Flags.BLACKPOINTCOMPENSATION,
    )
    printed = ImageCms.applyTransform(ImageCms.applyTransform(image, to_cmyk), back)
    return [tuple(c / 255 for c in px) for px in printed.get_flattened_data()]


def min_pair(labs: list, names: list[str]) -> tuple[float, str, str]:
    return min(
        (math.dist(labs[i], labs[j]), names[i], names[j])
        for i, j in itertools.combinations(range(len(labs)), 2)
    )


def best_subset(
    swatches: list[Swatch], printed: list, n: int
) -> tuple[list[int], float]:
    """Exhaustive max-min over printed positions, ties broken on name cost.

    Same search generate_palette.ts runs, on different coordinates. A dozen
    words choose eight, so enumerating is instant and returns the optimum.
    """
    best: tuple[float, float, tuple[int, ...]] = (-math.inf, math.inf, ())
    for combo in itertools.combinations(range(len(swatches)), n):
        worst = min(
            math.dist(printed[i], printed[j])
            for i, j in itertools.combinations(combo, 2)
        )
        cost = sum(swatches[i].name_cost for i in combo)
        if worst > best[0] or (worst == best[0] and cost < best[1]):
            best = (worst, cost, combo)
    return list(best[2]), best[0]


def report(swatches: list[Swatch], chosen: list[int], profile_name: str) -> float:
    picked = [swatches[i] for i in chosen]
    printed = print_roundtrip(picked, PROFILES[profile_name])
    names = [s.name for s in picked]
    screen_labs = [srgb_to_oklab(*s.rgb) for s in picked]
    print_labs = [srgb_to_oklab(*c) for c in printed]

    on_screen = min_pair(screen_labs, names)
    on_paper = min_pair(print_labs, names)
    flag = "" if on_paper[0] >= CLEARLY_DISTINCT else "  <- under 0.10"
    print(f"\n  {profile_name}:")
    print(f"    min ΔE on screen {on_screen[0]:.4f}  ({on_screen[1]}/{on_screen[2]})")
    print(
        f"    min ΔE printed   {on_paper[0]:.4f}  ({on_paper[1]}/{on_paper[2]}){flag}"
    )
    tightest = sorted(
        (math.dist(print_labs[i], print_labs[j]), names[i], names[j])
        for i, j in itertools.combinations(range(len(names)), 2)
    )[:3]
    for delta, first, second in tightest:
        print(f"      {first:<9} / {second:<9} ΔE {delta:.4f}")
    return on_paper[0]


def main(
    candidates: Path = typer.Argument(
        ..., help="CSV from generate_palette.ts --dump-candidates"
    ),
    n: int = typer.Option(8, help="How many colours to choose"),
    profile: str = typer.Option("uncoated", help=f"One of {', '.join(PROFILES)}"),
    check_only: str = typer.Option(
        "", help="Comma-separated words to measure instead of searching"
    ),
) -> None:
    swatches = []
    for line in candidates.read_text().strip().splitlines():
        name, hex_value, cost = line.split(",")
        value = int(hex_value.lstrip("#"), 16)
        swatches.append(
            Swatch(
                name,
                (
                    ((value >> 16) & 255) / 255,
                    ((value >> 8) & 255) / 255,
                    (value & 255) / 255,
                ),
                float(cost),
            )
        )

    if check_only:
        wanted = [w.strip() for w in check_only.split(",")]
        by_name = {s.name: i for i, s in enumerate(swatches)}
        missing = [w for w in wanted if w not in by_name]
        if missing:
            raise typer.BadParameter(f"not in the candidate list: {', '.join(missing)}")
        chosen = [by_name[w] for w in wanted]
        print(f"Measuring {', '.join(wanted)}")
    else:
        printed = [
            srgb_to_oklab(*c) for c in print_roundtrip(swatches, PROFILES[profile])
        ]
        chosen, delta = best_subset(swatches, printed, n)
        print(
            f"Best {n} of {len(swatches)} on {profile} stock: "
            f"{', '.join(swatches[i].name for i in chosen)}  (printed ΔE {delta:.4f})"
        )

    # Always report across every profile: the palette ships to whatever printer
    # is free that morning, so the number that matters is the worst of them.
    worst = min(report(swatches, chosen, name) for name in PROFILES)
    print(f"\n  worst case across profiles: ΔE {worst:.4f}")
    if worst < CLEARLY_DISTINCT:
        print("  (under 0.10 --- these two are told apart by reading, not seeing)")


if __name__ == "__main__":
    typer.run(main)
