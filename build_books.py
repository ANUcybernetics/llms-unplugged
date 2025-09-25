#!/usr/bin/env python3
"""Build n-gram books from text files based on filename pattern.

Usage: build_books.py <target> <input_file>
Target format: name-n-books-papersize
Example: frankenstein-3-2-a4 (trigrams, 2 books, A4 paper)
"""

import sys
import subprocess
import json
import os
from pathlib import Path


def parse_target(target):
    """Parse target filename into components."""
    parts = target.rsplit('-', 3)
    if len(parts) < 4:
        raise ValueError(f"Invalid target format: {target}")

    name = '-'.join(parts[:-3])
    n = int(parts[-3])
    books = int(parts[-2])
    paper_size = parts[-1].replace('.stamp', '').replace('.pdf', '')

    return name, n, books, paper_size


def get_columns(paper_size):
    """Get number of columns based on paper size."""
    return 4 if paper_size == 'a4' else 3


def build_books(target, input_file):
    """Build n-gram books from input file."""
    out_dir = Path('out')
    out_dir.mkdir(exist_ok=True)

    # Parse target
    name, n, books, paper_size = parse_target(target)
    columns = get_columns(paper_size)

    # Build the n-gram model
    tool = './target/release/my_first_lm'
    base_output = f"{name}-{n}-{books}"

    if books == 1:
        # Single book - output directly to model.json
        cmd = [tool, '--n', str(n), input_file, '-o', 'model.json']
        print(f"Running: {' '.join(cmd)}")
        subprocess.run(cmd, check=True)

        # Generate PDF
        output_pdf = out_dir / f"{base_output}-{paper_size}.pdf"
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
                output_pdf = out_dir / f"{base_output}-{paper_size}-book{i}.pdf"
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

        print(f"Created {books} books for {base_output}-{paper_size}")


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