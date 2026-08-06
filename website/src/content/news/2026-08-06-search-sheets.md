---
title: The whole room holds the model
date: 2026-08-06
author: Ben Swift
description:
  Search sheets are the cutouts activity with the cutting taken out, sized for a
  room rather than a table. Four ready-to-print sets are on the tools page.
---

The [search sheets](/tools/#search-sheets) are the cutouts activity with the
cutting taken out, and they scale to a room. The CLI shuffles a corpus and deals
it round-robin into one page per participant, so no two sheets are the same. You
call out the last token written on the board, everyone scans their own sheet for
it, and hands go up wherever there is a match. Pick one of those hands at random
and you have your next token.

The useful part is what the hands do without being told. Every token pair in the
text was dealt to exactly one person, and the deal spreads each context across
as many people as it will go. A continuation that happens six times puts six
hands in the air; a rare one puts up two. Nobody in the room has been taught
weighted sampling, and the room performs it anyway. Pick at random rather than
taking whoever shouts first, though, or you are sampling the fastest reader
instead of the text.

The other part is that nobody holds the model. No single sheet can continue the
text on its own. The model exists only across the whole room, and if somebody is
away, some contexts draw no hands at all. That is not a metaphor for distributed
parameters: for the twenty minutes it runs, it is literally where the model is.

Four sets are ready to print, in
[Green Eggs and Ham](/assets/pdfs/sheets/green-eggs-and-ham-24.pdf),
[Peter Rabbit](/assets/pdfs/sheets/peter-rabbit-24.pdf) and
[The Cat in the Hat](/assets/pdfs/sheets/the-cat-in-the-hat-24.pdf) for 24
people, and [Australia](/assets/pdfs/sheets/australia-40.pdf) for 40. Print them
single-sided and hand out one each. The first page is the briefing for whoever
is running it, and every page after that is a different participant's sheet.
Each set is sized for a group, because a missing sheet takes its share of the
model with it. The [tools page](/tools/#generate-your-own) will build a set from
any text you paste in.

Building these turned up a problem with the
[generated colour palette](/news/2026-05-24-generating-the-cutout-palette/).
Sheets set their token pairs at 16pt rather than the cutouts' 36pt, and at that
size, colours the metric called comfortably distinct kept reading as the same
colour. Max-min OKLab ΔE counts a lightness step the same as a hue step, and a
scanning eye does not: on a small glyph, a lightness step reads as that colour
again, darker. The generator now enforces a minimum hue separation as
well.[^numbers] Every ready-to-print PDF has been rebuilt with the result.

[^numbers]:
    The tightest pairs in the old palettes drew 79% and 85% of their distance
    from the lightness axis alone. The sheets palette is now 11 swatches under a
    20° hue floor, min ΔE 0.180 → 0.167; the cutouts keep 30 under an 8° floor,
    0.137 → 0.121. Dropping the mid-grey swatch from the sheets bought back most
    of what the hue floor cost, grey being the thing that sat in the middle of
    the a-b plane blocking the low-chroma teals and olives that now fill the
    gaps.
