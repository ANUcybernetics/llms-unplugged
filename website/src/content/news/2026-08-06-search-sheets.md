---
title: Search sheets for group text generation
date: 2026-08-06
author: Ben Swift
kind: build
description:
  Search sheets let a group generate text together, using one printed page per
  participant. Four ready-to-print sets are on the tools page.
---

The [search sheets](/tools/#search-sheets) are the cutouts activity with the
cutting taken out, for groups to use together. The CLI shuffles a corpus and
deals it round-robin into one page per participant, so no two sheets are the
same. You call out the last token written on the board, everyone scans their own
sheet for it, and hands go up wherever there's a match. Pick one of those hands
at random and you have your next token.

Every token pair in the text is printed on exactly one sheet. The CLI spreads
each context across as many sheets as possible, so common continuations tend to
get more hands than rare ones. Picking a hand at random approximates sampling
from the model's probability distribution. Take whoever shouts first and you're
sampling the fastest reader instead of the text.

Each participant holds part of the model on their sheet. If someone is absent,
the group loses access to the token pairs on that page.

Four sets are ready to print:
[Green Eggs and Ham](https://pdf.llmsunplugged.org/sheets/green-eggs-and-ham.pdf)
at 15 sheets,
[Peter Rabbit](https://pdf.llmsunplugged.org/sheets/peter-rabbit.pdf) at 17,
[The Cat in the Hat](https://pdf.llmsunplugged.org/sheets/the-cat-in-the-hat.pdf)
at 36
([A5 sheets two-up on A4](https://pdf.llmsunplugged.org/sheets/the-cat-in-the-hat-2up-a4.pdf)),
and [Australia](https://pdf.llmsunplugged.org/sheets/australia.pdf) at 79. Print
them single-sided and hand out one each. The first page is the briefing for
whoever is running it, and every page after that is a different participant's
sheet. Every sheet carries the same number of token pairs, so the length of the
text decides how many sheets there are, and a set only suits a group of about
that size. The [tools page](/tools/#generate-your-own) will build a set from any
text you paste in.

Building these turned up a problem with the
[generated colour palette](/news/2026-05-24-generating-the-cutout-palette/). The
sheets use 16pt type for token pairs, compared with 36pt on the cutouts. At that
size, I struggled to distinguish colours that were well separated by the OKLab
ΔE metric. The palette included several shades of the same hue, which were hard
to tell apart when scanning small text.

I changed the search to start with colour names from the xkcd colour survey,
then select colours that stayed distinguishable in print. Previously, I'd named
the colours after generating the palette, ending up with names like _ochre_ and
_wine_. Those were the closest names I could find, but teachers and students
might call them something else. If a teacher says "who has _cat_? it's a green
one", everyone needs to know which colour they mean.

Each candidate swatch now starts at the centroid for a colour name in the
survey, which collected people's free-form names for colours. The search selects
eight: black, grey, red, brown, green, blue, purple, magenta. Six print at their
survey centroid exactly; grey and green move just far enough to stay legible on
paper.[^numbers]

The cutouts now use the same eight colours, so teachers can use the printed key
to call out a colour alongside a word.

Eight is close to the ceiling, too. The obvious ninth is orange, and a printable
orange sits ΔE 0.074--0.101 from red once it has been through a CMYK profile ---
you can have orange or red, not both. Green and turquoise collide the same way,
as do magenta and pink.

The key is printed on the brief for both the sheets and the cutouts. Students
can use it to narrow their search before reading the tokens.

[^numbers]:
    Grey moves ΔE 0.037 from its survey centroid and green 0.050, far enough to
    clear 3.5:1 contrast against white. That one number governs both ways a
    swatch gets used, contrast being symmetric: a token set as coloured text on
    the page, and white text on a colour-filled box. The eight sit 0.151 apart
    at worst on screen and 0.102 once round-tripped through a CMYK profile. The
    second figure is the one that matters and it can't be derived from the first
    --- sRGB's vivid blues, greens and purples fall outside CMYK, so the press
    compresses them toward the gamut boundary and the gaps shrink. Measured
    against FOGRA47L uncoated, FOGRA39L coated and SNAP newsprint.
