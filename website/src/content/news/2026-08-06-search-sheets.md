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
it, and hands go up wherever there's a match. Pick one of those hands at random
and you have your next token.

Every token pair in the text was dealt to exactly one person, and the deal
spreads each context across as many people as it will go. A continuation that
happens six times puts six hands in the air; a rare one puts up two. The show of
hands is the probability distribution, without anybody counting anything. Pick
at random, though. Take whoever shouts first and you're sampling the fastest
reader instead of the text.

Nobody holds the whole model. No single sheet can continue the text on its own;
the model only exists across the whole room, and if somebody is away, some
contexts draw no hands at all.

Four sets are ready to print:
[Green Eggs and Ham](/assets/pdfs/sheets/green-eggs-and-ham.pdf) at 15 sheets,
[Peter Rabbit](/assets/pdfs/sheets/peter-rabbit.pdf) at 17,
[The Cat in the Hat](/assets/pdfs/sheets/the-cat-in-the-hat.pdf) at 30, and
[Australia](/assets/pdfs/sheets/australia.pdf) at 79. Print them single-sided
and hand out one each. The first page is the briefing for whoever is running it,
and every page after that is a different participant's sheet. Every sheet
carries the same number of token pairs, so the length of the text decides how
many sheets there are, and a set only suits a group of about that size. The
[tools page](/tools/#generate-your-own) will build a set from any text you paste
in.

Building these turned up a problem with the
[generated colour palette](/news/2026-05-24-generating-the-cutout-palette/).
Sheets set their token pairs at 16pt rather than the cutouts' 36pt, and at that
size, colours the metric called comfortably distinct kept reading as the same
colour. Max-min OKLab ΔE counts a lightness step the same as a hue step; a
scanning eye doesn't. On a small glyph, a lightness step just reads as that
colour again, darker. The generator now enforces a minimum hue separation as
well.[^numbers] Every ready-to-print PDF has been rebuilt with the result.

Calling the colour out only works if the room has a word for it. All eleven now
have one: black, red, brown, ochre, green, teal, blue, navy, violet, purple,
wine.[^naming] The key prints on the brief and again on every sheet. Call "who
has _cat_? it's a teal one" from the front and the room narrows its search
before anyone reads a token.

[^numbers]:
    The tightest pairs in the old palettes drew 79% and 85% of their distance
    from the lightness axis alone. The sheets palette is now 11 swatches under a
    20° hue floor, min ΔE 0.180 → 0.167; the cutouts keep 30 under an 8° floor,
    0.137 → 0.121. Dropping the mid-grey swatch from the sheets bought back most
    of what the hue floor cost, grey being the thing that sat in the middle of
    the a-b plane blocking the low-chroma teals and olives that now fill the
    gaps.

[^naming]:
    Names are the nearest common English colour word to each swatch, checked
    against the xkcd colour survey. Two don't take the survey's nearest word.
    Both print darker than that word suggests, so the gold is ochre rather than
    mustard and the dark magenta is wine. Not maroon, though it looks it to an
    Australian eye. Sampling a Queensland State of Origin kit puts its cloth 26°
    of hue away, and maroon itself sits ΔE 0.095 from the palette's brown,
    inside the 0.167 floor.
