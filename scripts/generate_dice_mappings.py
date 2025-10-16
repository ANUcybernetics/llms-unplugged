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


def generate_svg(d: int, groups_range: str, output_path: str, start_index: int = 1):
    """Generate the dice mappings SVG file."""

    layout = LayoutConstants()
    dice_start = start_index

    start, end = map(int, groups_range.split("-"))
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
        "  <!-- Define styles -->",
        "  <style>",
        "    .cell { fill: #2a2a2a; stroke: #fff; stroke-width: 0.5; }",
        "    .cell-numbered { fill: #be830e; stroke: #fff; stroke-width: 0.5; }",
        "    .cell-disabled { fill: #2a2a2a; stroke: #fff; stroke-width: 0.5; opacity: 0.3; }",
        "    .cell-numbered-disabled { fill: #be830e; stroke: #fff; stroke-width: 0.5; opacity: 0.3; }",
        "    .cell-dividers { stroke: #fff; stroke-width: 0.5; fill: none; }",
        "    .group-divider { stroke: #ffffff; stroke-width: 1.5; }",
        "    .row-border { fill: none; stroke: #ffffff; stroke-width: 1.5; }",
        "    .number-text { font-family: Arial, sans-serif; font-size: 10px; font-weight: 600; text-anchor: middle; fill: #fff; }",
        "    .number-text-disabled { font-family: Arial, sans-serif; font-size: 10px; font-weight: 600; text-anchor: middle; fill: #fff; opacity: 0.3; }",
        "    .label-text { font-family: Arial, sans-serif; font-size: 12px; font-weight: bold; fill: #ffffff; }",
        "    .group-label { font-family: Arial, sans-serif; font-size: 10px; text-anchor: middle; fill: #ffffff; }",
        "    .group-label-disabled { font-family: Arial, sans-serif; font-size: 10px; text-anchor: middle; fill: #ffffff; opacity: 0.3; }",
        "    .row-label { font-family: Arial, sans-serif; font-size: 14px; font-weight: 900; fill: #ffffff; }",
        "  </style>",
    ]

    max_spacing = (end - 1) * layout.group_spacing

    for row_idx, num_groups in enumerate(range(start, end + 1)):
        y_offset = layout.top_margin + row_idx * layout.row_spacing

        should_disable_rerolls = num_groups > d / 2

        if should_disable_rerolls:
            group_sizes = [1] * d
            row_spacing = 0
        else:
            group_sizes = partition_dice(d, num_groups)
            if num_groups > 1:
                row_spacing = max_spacing / (num_groups - 1)
            else:
                row_spacing = 0

        comment_text = f"  <!-- Row {num_groups}: {num_groups} groups"
        if not should_disable_rerolls and group_sizes != [d // num_groups] * num_groups:
            comment_text += f" ({'+'.join(map(str, group_sizes))})"
        comment_text += " -->"
        svg_lines.append(comment_text)

        svg_lines.append(
            f'  <g transform="translate({layout.left_margin}, {y_offset})">'
        )

        svg_lines.append(
            f'    <text x="-25" y="15" class="row-label">{num_groups}</text>'
        )

        if should_disable_rerolls:
            cell_spacing = max_spacing / (d - 1) if d > 1 else 0
            label_pos = 0.0
            for i in range(d):
                label_x = label_pos + layout.cell_width / 2
                is_disabled = i + 1 > num_groups
                label_class = "group-label" if not is_disabled else "group-label-disabled"
                svg_lines.append(
                    f'    <text x="{label_x}" y="-4" class="{label_class}">{i + 1}</text>'
                )
                label_pos += layout.cell_width
                if i < d - 1:
                    label_pos += cell_spacing
        else:
            pos = 0.0
            for group_idx, group_size in enumerate(group_sizes):
                group_width = group_size * layout.cell_width
                group_center = pos + group_width / 2
                svg_lines.append(
                    f'    <text x="{group_center}" y="-4" class="group-label">{group_idx + 1}</text>'
                )
                pos += group_width
                if group_idx < len(group_sizes) - 1:
                    pos += row_spacing

        current_pos = 0.0
        dice_value = dice_start
        numbered_cells = []
        cell_divider_positions = []
        group_borders = []

        if should_disable_rerolls:
            cell_spacing = max_spacing / (d - 1) if d > 1 else 0
            for i in range(d):
                cell_x = current_pos
                is_disabled = dice_value > num_groups
                cell_class = "cell-numbered-disabled" if is_disabled else "cell-numbered"
                svg_lines.append(
                    f'    <rect x="{cell_x}" y="0" width="{layout.cell_width}" height="{layout.row_height}" class="{cell_class}"/>'
                )
                numbered_cells.append((cell_x, dice_value, is_disabled))
                group_borders.append((cell_x, layout.cell_width))

                current_pos += layout.cell_width
                if i < d - 1:
                    current_pos += cell_spacing

                dice_value += 1
        else:
            for group_idx, group_size in enumerate(group_sizes):
                start_value = dice_value
                end_value = dice_value + group_size - 1

                group_start_x = current_pos

                first_cell_x = current_pos
                svg_lines.append(
                    f'    <rect x="{first_cell_x}" y="0" width="{layout.cell_width}" height="{layout.row_height}" class="cell-numbered"/>'
                )
                numbered_cells.append((first_cell_x, start_value, False))
                current_pos += layout.cell_width

                if group_size > 2:
                    middle_width = (group_size - 2) * layout.cell_width
                    svg_lines.append(
                        f'    <rect x="{current_pos}" y="0" width="{middle_width}" height="{layout.row_height}" class="cell"/>'
                    )
                    for i in range(group_size - 2):
                        cell_divider_positions.append(current_pos)
                        current_pos += layout.cell_width

                if group_size > 1:
                    cell_divider_positions.append(current_pos)
                    last_cell_x = current_pos
                    svg_lines.append(
                        f'    <rect x="{last_cell_x}" y="0" width="{layout.cell_width}" height="{layout.row_height}" class="cell-numbered"/>'
                    )
                    numbered_cells.append((last_cell_x, end_value, False))
                    current_pos += layout.cell_width

                group_width = group_size * layout.cell_width
                group_borders.append((group_start_x, group_width))

                if group_idx < len(group_sizes) - 1:
                    current_pos += row_spacing

                dice_value += group_size

        if cell_divider_positions:
            path_parts = [
                f"M {x},0 v{layout.row_height}" for x in cell_divider_positions
            ]
            svg_lines.append(
                f'    <path d="{" ".join(path_parts)}" class="cell-dividers"/>'
            )

        for group_x, group_w in group_borders:
            svg_lines.append(
                f'    <rect x="{group_x}" y="0" width="{group_w}" height="{layout.row_height}" class="row-border"/>'
            )

        for cell_x, value, is_disabled in numbered_cells:
            text_x = cell_x + layout.cell_width // 2
            text_class = "number-text-disabled" if is_disabled else "number-text"
            svg_lines.append(
                f'    <text x="{text_x}" y="13" class="{text_class}">{value}</text>'
            )

        svg_lines.append("  </g>")

    svg_lines.append("</svg>")
    svg_lines.append("")

    with open(output_path, "w") as f:
        f.write("\n".join(svg_lines))

    print(f"Generated SVG: {output_path}")
    print(f"Dice sides: {d}, Groups: {groups_range}, Rows: {num_rows}")


def main():
    parser = argparse.ArgumentParser(
        description="Generate dice-mappings SVG for N-gram language model visualization"
    )
    parser.add_argument(
        "-d", "--dice", type=int, required=True, help="Number of dice sides"
    )
    parser.add_argument(
        "-g",
        "--groups",
        type=str,
        required=True,
        help='Range of group partitions to show, e.g., "2-9"',
    )
    parser.add_argument(
        "-o", "--output", type=str, required=True, help="Output file path"
    )
    parser.add_argument(
        "-s",
        "--start-index",
        type=int,
        default=1,
        help="Starting index for dice face values (default: 1)",
    )

    args = parser.parse_args()

    generate_svg(args.dice, args.groups, args.output, args.start_index)


if __name__ == "__main__":
    main()
