#!/usr/bin/env -S uv run
# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///

import argparse
from dataclasses import dataclass


@dataclass
class LayoutConstants:
    cell_width: int = 20
    row_height: int = 20
    row_spacing: int = 40
    left_margin: int = 50
    top_margin: int = 10
    group_spacing: int = 4
    color_numbered: str = "#be830e"
    color_cell: str = "#2a2a2a"


def partition_dice(d: int, n: int) -> list[int]:
    """
    Partition d dice values into n groups as evenly as possible.
    Uses ceiling division for first (d % n) groups, floor for the rest.

    Example: partition_dice(20, 3) -> [7, 7, 6]
    """
    base_size = d // n
    remainder = d % n

    sizes = []
    for i in range(n):
        if i < remainder:
            sizes.append(base_size + 1)
        else:
            sizes.append(base_size)

    return sizes


def generate_svg(d: int, groups_range: str, output_path: str):
    """Generate the dice mappings SVG file."""

    layout = LayoutConstants()

    start, end = map(int, groups_range.split('-'))
    num_rows = end - start + 1

    total_width = d * layout.cell_width + (end - 1) * layout.group_spacing
    last_row_y = layout.top_margin + (num_rows - 1) * layout.row_spacing

    viewbox_x = layout.left_margin - 26
    viewbox_y = -6
    viewbox_width = total_width + 28
    viewbox_height = last_row_y + layout.row_height + 26

    svg_lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{viewbox_x} {viewbox_y} {viewbox_width} {viewbox_height}" width="{viewbox_width}" height="{viewbox_height}">',
        '  <!-- Define styles -->',
        '  <style>',
        '    .cell { fill: #2a2a2a; stroke: #fff; stroke-width: 0.5; }',
        '    .cell-numbered { fill: #be830e; stroke: #fff; stroke-width: 0.5; }',
        '    .cell-dividers { stroke: #fff; stroke-width: 0.5; fill: none; }',
        '    .group-divider { stroke: #ffffff; stroke-width: 1.5; }',
        '    .row-border { fill: none; stroke: #ffffff; stroke-width: 1.5; }',
        '    .number-text { font-family: Arial, sans-serif; font-size: 10px; font-weight: 600; text-anchor: middle; fill: #fff; }',
        '    .label-text { font-family: Arial, sans-serif; font-size: 12px; font-weight: bold; fill: #ffffff; }',
        '    .group-label { font-family: Arial, sans-serif; font-size: 10px; text-anchor: middle; fill: #ffffff; }',
        '    .row-label { font-family: Arial, sans-serif; font-size: 14px; font-weight: 900; fill: #ffffff; }',
        '  </style>',
    ]

    max_spacing = (end - 1) * layout.group_spacing

    for row_idx, num_groups in enumerate(range(start, end + 1)):
        y_offset = layout.top_margin + row_idx * layout.row_spacing

        group_sizes = partition_dice(d, num_groups)

        if num_groups > 1:
            row_spacing = max_spacing / (num_groups - 1)
        else:
            row_spacing = 0

        comment_text = f"  <!-- Row {num_groups}: {num_groups} groups"
        if group_sizes != [d // num_groups] * num_groups:
            comment_text += f" ({'+'.join(map(str, group_sizes))})"
        comment_text += " -->"
        svg_lines.append(comment_text)

        svg_lines.append(f'  <g transform="translate({layout.left_margin}, {y_offset})">')

        svg_lines.append(f'    <text x="-25" y="15" class="row-label">{num_groups}</text>')

        pos = 0
        for group_idx, group_size in enumerate(group_sizes):
            group_width = group_size * layout.cell_width
            group_center = int(pos + group_width / 2)
            svg_lines.append(f'    <text x="{group_center}" y="-4" class="group-label">{group_idx + 1}</text>')
            pos += group_width
            if group_idx < len(group_sizes) - 1:
                pos += row_spacing

        current_pos = 0
        dice_value = 1
        numbered_cells = []
        cell_divider_positions = []
        group_borders = []

        for group_idx, group_size in enumerate(group_sizes):
            start_value = dice_value
            end_value = dice_value + group_size - 1

            group_start_x = int(current_pos)

            first_cell_x = int(current_pos)
            svg_lines.append(f'    <rect x="{first_cell_x}" y="0" width="{layout.cell_width}" height="{layout.row_height}" class="cell-numbered"/>')
            numbered_cells.append((first_cell_x, start_value))
            current_pos += layout.cell_width

            if group_size > 2:
                middle_width = (group_size - 2) * layout.cell_width
                svg_lines.append(f'    <rect x="{int(current_pos)}" y="0" width="{middle_width}" height="{layout.row_height}" class="cell"/>')
                for i in range(group_size - 2):
                    cell_divider_positions.append(int(current_pos))
                    current_pos += layout.cell_width

            if group_size > 1:
                cell_divider_positions.append(int(current_pos))
                last_cell_x = int(current_pos)
                svg_lines.append(f'    <rect x="{last_cell_x}" y="0" width="{layout.cell_width}" height="{layout.row_height}" class="cell-numbered"/>')
                numbered_cells.append((last_cell_x, end_value))
                current_pos += layout.cell_width

            group_width = group_size * layout.cell_width
            group_borders.append((group_start_x, group_width))

            if group_idx < len(group_sizes) - 1:
                current_pos += row_spacing

            dice_value += group_size

        if cell_divider_positions:
            path_parts = [f"M {x},0 v{layout.row_height}" for x in cell_divider_positions]
            svg_lines.append(f'    <path d="{" ".join(path_parts)}" class="cell-dividers"/>')

        for group_x, group_w in group_borders:
            svg_lines.append(f'    <rect x="{group_x}" y="0" width="{group_w}" height="{layout.row_height}" class="row-border"/>')

        for cell_x, value in numbered_cells:
            text_x = cell_x + layout.cell_width // 2
            svg_lines.append(f'    <text x="{text_x}" y="13" class="number-text">{value}</text>')

        svg_lines.append('  </g>')

    svg_lines.append('</svg>')
    svg_lines.append('')

    with open(output_path, 'w') as f:
        f.write('\n'.join(svg_lines))

    print(f"Generated SVG: {output_path}")
    print(f"Dice sides: {d}, Groups: {groups_range}, Rows: {num_rows}")


def main():
    parser = argparse.ArgumentParser(
        description="Generate dice-mappings SVG for N-gram language model visualization"
    )
    parser.add_argument(
        '-d', '--dice',
        type=int,
        required=True,
        help='Number of dice sides'
    )
    parser.add_argument(
        '-g', '--groups',
        type=str,
        required=True,
        help='Range of group partitions to show, e.g., "2-9"'
    )
    parser.add_argument(
        '-o', '--output',
        type=str,
        required=True,
        help='Output file path'
    )

    args = parser.parse_args()

    generate_svg(args.dice, args.groups, args.output)


if __name__ == '__main__':
    main()
