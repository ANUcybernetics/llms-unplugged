#!/usr/bin/env bash
# Turn a PDF the CLI printed (search sheets, cutouts, ledger pages) into what an
# overlay page draws: one PNG per page at a legible density, a thumbnail per
# page for grids, and bbox.json --- every text line's bounding box in PDF
# points, with its words --- so a pair or a row can be located on the page
# image from the PDF's own text layer rather than by eye.
#
#   pdf-assets.sh <in.pdf> <out-dir> [--skip N] [--dpi 200] [--thumb-dpi 20]
#
# --skip N drops the first N pages (a facilitator brief, say) so page images are
# numbered from the first participant page: sheet-001.png is page N+1 of the
# PDF. bbox.json records both numbers per entry.
#
# Needs poppler (pdftoppm, pdftotext, pdfinfo) and python3.
set -euo pipefail

PDF=${1:?pdf}; OUT=${2:?out-dir}; shift 2
SKIP=0; DPI=200; THUMB_DPI=20
while [ $# -gt 0 ]; do
  case $1 in
    --skip) SKIP=$2; shift 2 ;;
    --dpi) DPI=$2; shift 2 ;;
    --thumb-dpi) THUMB_DPI=$2; shift 2 ;;
    *) echo "unknown option $1" >&2; exit 1 ;;
  esac
done

N=$(pdfinfo "$PDF" | awk '/^Pages:/ {print $2}')
FIRST=$((SKIP + 1))
rm -rf "$OUT/pages" "$OUT/thumbs"; mkdir -p "$OUT/pages" "$OUT/thumbs"
# poppler prints "Syntax Error: Suspects object is wrong type" on Typst PDFs; harmless
pdftoppm -r "$DPI" -png -f "$FIRST" -l "$N" "$PDF" "$OUT/pages/p"
pdftoppm -r "$THUMB_DPI" -png -f "$FIRST" -l "$N" "$PDF" "$OUT/thumbs/p"
# pdftoppm numbers by PDF page; renumber so the first kept page is 001
for d in pages thumbs; do
  for f in "$OUT/$d"/p-*.png; do
    n=$(basename "$f" .png); n=${n#p-}; n=$((10#$n - SKIP))
    mv "$f" "$OUT/$d/sheet-$(printf %03d "$n").png"
  done
done

pdftotext -f "$FIRST" -l "$N" -bbox-layout "$PDF" "$OUT/bbox.html"
python3 - "$OUT/bbox.html" "$OUT/bbox.json" "$SKIP" <<'PY'
import html, json, re, sys
src = open(sys.argv[1]).read()
skip = int(sys.argv[3])
out = []
pages = re.findall(r'<page width="([\d.]+)" height="([\d.]+)">(.*?)</page>', src, re.S)
for pi, (w, h, body) in enumerate(pages):
    lines = []
    for x0, y0, x1, y1, inner in re.findall(
        r'<line xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">(.*?)</line>', body, re.S
    ):
        words = [html.unescape(t) for t in re.findall(r">([^<]*)</word>", inner)]
        lines.append({"bbox": [float(x0), float(y0), float(x1), float(y1)], "words": words})
    out.append({"sheet": pi + 1, "page": pi + 1 + skip, "w": float(w), "h": float(h), "lines": lines})
json.dump(out, open(sys.argv[2], "w"), ensure_ascii=False)
print(f"{len(out)} pages -> {sys.argv[2]}")
PY
rm "$OUT/bbox.html"
echo "assets from $PDF in $OUT"
