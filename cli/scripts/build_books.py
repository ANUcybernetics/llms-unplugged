#!/usr/bin/env python3
"""
Automated N-gram booklet builder.

This script automates the pipeline for generating N-gram model booklets from
text files. It handles the full workflow: running the Rust tool to generate
N-gram statistics, then using Typst to compile those statistics into printable
PDF booklets.

The script uses a target naming pattern to determine output configuration:
  Target format: name-n-books
  Example: frankenstein-3-2 means trigrams split across 2 books

This is useful for batch processing multiple texts or configurations. For large
trigram models, splitting across multiple books keeps each volume manageable.

Usage:
    build_books.py <target> <input_file> [--json-only | --pdf-only]

Examples:
    build_books.py frankenstein-2-1 data/frankenstein.txt
    build_books.py onegin-3-4 data/onegin.txt --json-only

The script creates output in out/json/ and out/pdf/ directories.
"""

import json
import subprocess
import sys
from pathlib import Path


def parse_target(target):
    """Parse target filename into components."""
    parts = target.rsplit("-", 2)
    if len(parts) < 3:
        raise ValueError(f"Invalid target format: {target}")

    name = "-".join(parts[:-2])
    n = int(parts[-2])
    books = int(parts[-1])

    return name, n, books


def build_books(target, input_file, mode="both"):
    """Build n-gram books from input file.

    mode: "both", "json-only", or "pdf-only"
    """
    out_dir = Path("out")
    json_dir = out_dir / "json"
    pdf_dir = out_dir / "pdf"
    json_dir.mkdir(parents=True, exist_ok=True)
    pdf_dir.mkdir(parents=True, exist_ok=True)

    # Parse target
    name, n, books = parse_target(target)

    # Hardcode paper size and columns
    paper_size = "a4"
    columns = 4

    # Build the n-gram model
    tool = "./target/release/llms_unplugged"
    base_output = f"{name}-{n}-{books}"

    if books == 1:
        # Single book - output to unique JSON in out/json/
        json_file = json_dir / f"{base_output}.json"

        # Generate JSON if needed
        if mode in ["both", "json-only"]:
            if not json_file.exists():
                cmd = [tool, "--n", str(n), input_file, "-o", str(json_file)]
                print(f"Running: {' '.join(cmd)}")
                subprocess.run(cmd, check=True)
            else:
                print(f"JSON already exists: {json_file}")

        # Generate PDF if needed
        output_pdf = pdf_dir / f"{base_output}.pdf"
        if mode in ["both", "pdf-only"]:
            # Read subtitle from JSON metadata
            with open(json_file, "r") as f:
                json_data = json.load(f)
            subtitle = json_data.get("metadata", {}).get(
                "subtitle", f"A {n}-gram language model"
            )

            typst_cmd = [
                "typst",
                "compile",
                "--input",
                f"paper_size={paper_size}",
                "--input",
                f"columns={columns}",
                "--input",
                f"json_path={json_file}",
                "--input",
                f"subtitle={subtitle}",
                "book.typ",
                str(output_pdf),
            ]
            print(f"Generating: {output_pdf}")
            subprocess.run(typst_cmd, check=True)

            # Show page count
            try:
                result = subprocess.run(
                    ["pdfinfo", str(output_pdf)],
                    capture_output=True,
                    text=True,
                    check=True,
                )
                for line in result.stdout.split("\n"):
                    if "Pages:" in line:
                        print(f"Pages in {output_pdf}: {line.split()[1]}")
            except subprocess.CalledProcessError:
                pass

    else:
        # Multiple books - use -b flag
        json_base = json_dir / f"{base_output}.json"

        # Generate JSONs if needed
        if mode in ["both", "json-only"]:
            # Check if all book JSONs exist
            all_exist = all(
                (json_dir / f"{base_output}_book_{i}.json").exists()
                for i in range(1, books + 1)
            )
            if not all_exist:
                cmd = [
                    tool,
                    "--n",
                    str(n),
                    "-b",
                    str(books),
                    input_file,
                    "-o",
                    str(json_base),
                ]
                print(f"Running: {' '.join(cmd)}")
                subprocess.run(cmd, check=True)
            else:
                print(f"All JSON files already exist for {base_output}")

        # Generate PDFs if needed
        if mode in ["both", "pdf-only"]:
            for i in range(1, books + 1):
                book_json = json_dir / f"{base_output}_book_{i}.json"
                if book_json.exists():
                    # Generate PDF directly from book JSON
                    output_pdf = pdf_dir / f"{base_output}-book{i}.pdf"
                    # Read subtitle from JSON metadata
                    with open(book_json, "r") as f:
                        json_data = json.load(f)
                    subtitle = json_data.get("metadata", {}).get(
                        "subtitle", f"A {n}-gram language model"
                    )

                    typst_cmd = [
                        "typst",
                        "compile",
                        "--input",
                        f"paper_size={paper_size}",
                        "--input",
                        f"columns={columns}",
                        "--input",
                        f"json_path={book_json}",
                        "--input",
                        f"subtitle={subtitle}",
                        "book.typ",
                        str(output_pdf),
                    ]
                    print(f"Generating: {output_pdf}")
                    subprocess.run(typst_cmd, check=True)

                    # Show page count
                    try:
                        result = subprocess.run(
                            ["pdfinfo", str(output_pdf)],
                            capture_output=True,
                            text=True,
                            check=True,
                        )
                        for line in result.stdout.split("\n"):
                            if "Pages:" in line:
                                print(f"Pages in {output_pdf}: {line.split()[1]}")
                    except subprocess.CalledProcessError:
                        pass

            print(f"Created {books} books for {base_output}")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)

    target = sys.argv[1]
    input_file = sys.argv[2]
    mode = "both"

    if len(sys.argv) > 3:
        if sys.argv[3] == "--json-only":
            mode = "json-only"
        elif sys.argv[3] == "--pdf-only":
            mode = "pdf-only"

    try:
        build_books(target, input_file, mode)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
