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
[Green Eggs and Ham](https://pdf.llmsunplugged.org/sheets/green-eggs-and-ham.pdf) at 15 sheets,
[Peter Rabbit](https://pdf.llmsunplugged.org/sheets/peter-rabbit.pdf) at 17,
[The Cat in the Hat](https://pdf.llmsunplugged.org/sheets/the-cat-in-the-hat.pdf) at 36
([A5 sheets two-up on A4](https://pdf.llmsunplugged.org/sheets/the-cat-in-the-hat-2up-a4.pdf)), and
[Australia](https://pdf.llmsunplugged.org/sheets/australia.pdf) at 79. Print them single-sided
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
colour again, darker.

Fixing it meant asking a different question. A free search for maximally
distinct colours gets named afterwards, by hand, which is how the palette ended
up needing words like _ochre_ and _wine_ --- chosen because they were the
nearest available, not because a room would reach for them. But the name is the
whole point: "who has _cat_? it's a green one" only works if the room agrees on
which swatch _green_ means. So the words come first now. Every swatch is pinned
to a colour word's centroid in the xkcd colour survey --- a couple of hundred
thousand people naming colours free-form, which is the best evidence there is
for what a colour word means --- and the search picks the words whose printable
colours sit furthest apart.

That lands on eight: black, grey, red, brown, green, blue, purple, magenta. Six
print at their survey centroid exactly; only grey and green move, and only far
enough to stay legible on paper.[^numbers] The cutouts use the same eight now.
Thirty colours at 36pt was more than anyone can hold at once, and a colour
nobody can name is a filter nobody can call out.

Eight is close to the ceiling, too. The obvious ninth is orange, and a printable
orange sits ΔE 0.074--0.101 from red once it has been through a CMYK profile ---
you can have orange or red, not both. Green and turquoise collide the same way,
as do magenta and pink.

The key prints on the brief, on both the sheets and the cutouts. Call "who has
_cat_? it's a green one" from the front and the room narrows its search before
anyone reads a token.

[^numbers]:
    Grey moves ΔE 0.037 from its survey centroid and green 0.050, far enough to
    clear 3.5:1 contrast against white. That one number governs both ways a
    swatch gets used, contrast being symmetric: a token set as coloured text on
    the page, and white text on a colour-filled box. The eight sit 0.151 apart
    at worst on screen and 0.102 once round-tripped through a CMYK profile. The
    second figure is the one that matters and it can't be derived from the
    first --- sRGB's vivid blues, greens and purples fall outside CMYK, so the
    press compresses them toward the gamut boundary and the gaps shrink.
    Measured against FOGRA47L uncoated, FOGRA39L coated and SNAP newsprint.
