#!/usr/bin/env python3
"""Build n-gram books from text files based on filename pattern.

Usage: build_books.py <target> <input_file>
Target format: name-n-books
Example: frankenstein-3-2 (trigrams, 2 books)
"""

import sys
import subprocess
import json
import os
from pathlib import Path


def parse_target(target):
    """Parse target filename into components."""
    parts = target.rsplit('-', 2)
    if len(parts) < 3:
        raise ValueError(f"Invalid target format: {target}")

    name = '-'.join(parts[:-2])
    n = int(parts[-2])
    books = int(parts[-1])

    return name, n, books


def build_books(target, input_file):
    """Build n-gram books from input file."""
    out_dir = Path('out')
    out_dir.mkdir(exist_ok=True)

    # Parse target
    name, n, books = parse_target(target)

    # Hardcode paper size and columns
    paper_size = 'a4'
    columns = 4

    # Build the n-gram model
    tool = './target/release/my_first_lm'
    base_output = f"{name}-{n}-{books}"

    if books == 1:
        # Single book - output directly to model.json
        cmd = [tool, '--n', str(n), input_file, '-o', 'model.json']
        print(f"Running: {' '.join(cmd)}")
        subprocess.run(cmd, check=True)

        # Generate PDF
        output_pdf = out_dir / f"{base_output}.pdf"
        typst_cmd = [
            'typst', 'compile',
            '--input', f'paper_size={paper_size}',
            '--input', f'columns={columns}',
            'book.typ', str(output_pdf)
        ]
        print(f"Generating: {output_pdf}")
        subprocess.run(typst_cmd, check=True)

        # Show page count
        try:
            result = subprocess.run(
                ['pdfinfo', str(output_pdf)],
                capture_output=True, text=True, check=True
            )
            for line in result.stdout.split('\n'):
                if 'Pages:' in line:
                    print(f"Pages in {output_pdf}: {line.split()[1]}")
        except subprocess.CalledProcessError:
            pass

        # Clean up
        Path('model.json').unlink(missing_ok=True)

    else:
        # Multiple books - use -b flag
        json_base = out_dir / f"{base_output}.json"
        cmd = [tool, '--n', str(n), '-b', str(books), input_file, '-o', str(json_base)]
        print(f"Running: {' '.join(cmd)}")
        subprocess.run(cmd, check=True)

        # Generate each book
        for i in range(1, books + 1):
            book_json = out_dir / f"{base_output}_book_{i}.json"
            if book_json.exists():
                # Copy to model.json
                subprocess.run(['cp', str(book_json), 'model.json'], check=True)

                # Generate PDF
                output_pdf = out_dir / f"{base_output}-book{i}.pdf"
                typst_cmd = [
                    'typst', 'compile',
                    '--input', f'paper_size={paper_size}',
                    '--input', f'columns={columns}',
                    'book.typ', str(output_pdf)
                ]
                print(f"Generating: {output_pdf}")
                subprocess.run(typst_cmd, check=True)

                # Show page count
                try:
                    result = subprocess.run(
                        ['pdfinfo', str(output_pdf)],
                        capture_output=True, text=True, check=True
                    )
                    for line in result.stdout.split('\n'):
                        if 'Pages:' in line:
                            print(f"Pages in {output_pdf}: {line.split()[1]}")
                except subprocess.CalledProcessError:
                    pass

                # Clean up
                Path('model.json').unlink(missing_ok=True)
                book_json.unlink(missing_ok=True)

        print(f"Created {books} books for {base_output}")


if __name__ == '__main__':
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(1)

    target = sys.argv[1]
    input_file = sys.argv[2]

    try:
        build_books(target, input_file)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)