#!/usr/bin/env python3
"""Build n-gram books from text files based on filename pattern.

Usage: build_books.py <target> <input_file> [--json-only | --pdf-only]
Target format: name-n-books
Example: frankenstein-3-2 (trigrams, 2 books)
"""

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
    out_dir.mkdir(exist_ok=True)

    # Parse target
    name, n, books = parse_target(target)

    # Hardcode paper size and columns
    paper_size = "a4"
    columns = 4

    # Build the n-gram model
    tool = "./target/release/my_first_lm"
    base_output = f"{name}-{n}-{books}"

    if books == 1:
        # Single book - output to unique JSON in out/
        json_file = out_dir / f"{base_output}.json"

        # Generate JSON if needed
        if mode in ["both", "json-only"]:
            if not json_file.exists():
                cmd = [tool, "--n", str(n), input_file, "-o", str(json_file)]
                print(f"Running: {' '.join(cmd)}")
                subprocess.run(cmd, check=True)
            else:
                print(f"JSON already exists: {json_file}")

        # Generate PDF if needed
        output_pdf = out_dir / f"{base_output}.pdf"
        if mode in ["both", "pdf-only"]:
            # Determine subtitle based on n value
            if n == 1:
                subtitle = "a unigram language model"
            elif n == 2:
                subtitle = "a bigram language model"
            elif n == 3:
                subtitle = "a trigram language model"
            else:
                subtitle = f"a {n}-gram language model"

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
                    ["pdfinfo", str(output_pdf)], capture_output=True, text=True, check=True
                )
                for line in result.stdout.split("\n"):
                    if "Pages:" in line:
                        print(f"Pages in {output_pdf}: {line.split()[1]}")
            except subprocess.CalledProcessError:
                pass

    else:
        # Multiple books - use -b flag
        json_base = out_dir / f"{base_output}.json"

        # Generate JSONs if needed
        if mode in ["both", "json-only"]:
            # Check if all book JSONs exist
            all_exist = all(
                (out_dir / f"{base_output}_book_{i}.json").exists()
                for i in range(1, books + 1)
            )
            if not all_exist:
                cmd = [tool, "--n", str(n), "-b", str(books), input_file, "-o", str(json_base)]
                print(f"Running: {' '.join(cmd)}")
                subprocess.run(cmd, check=True)
            else:
                print(f"All JSON files already exist for {base_output}")

        # Generate PDFs if needed
        if mode in ["both", "pdf-only"]:
            for i in range(1, books + 1):
                book_json = out_dir / f"{base_output}_book_{i}.json"
                if book_json.exists():
                    # Generate PDF directly from book JSON
                    output_pdf = out_dir / f"{base_output}-book{i}.pdf"
                    # Determine subtitle based on n value
                    if n == 1:
                        subtitle = "a unigram language model"
                    elif n == 2:
                        subtitle = "a bigram language model"
                    elif n == 3:
                        subtitle = "a trigram language model"
                    else:
                        subtitle = f"a {n}-gram language model"

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
