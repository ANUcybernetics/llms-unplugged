# Unplugged in the age of AI --- what you need

A twenty-minute talk for 20 to 100 people. A talk, not a workshop: the only
thing the audience does is hold a sheet and put a hand up.

## search-sheets.pdf

37 A4 pages --- the brief, then 36 sheets of token pairs dealt from _The Cat in
the Hat_. Page 1 is the brief and carries the worked example; keep it on the
lectern. Pages 2 onwards are the handout, one sheet per attendee.

Print single-sided. For a room larger than 36, deal your own set at whatever
count you need:

```
llms_unplugged sheets -i data/the-cat-in-the-hat.txt -n 2 --sheets <count>
```

Don't hand the sheets out early. They get read, and the "nobody here is holding
a story" beat depends on the shuffle.

## slides.pdf

The deck. The numbers on the "between us we have the whole book" and scale
slides are for _The Cat in the Hat_ at n=2; if you swap the corpus, rebuild
them with `llms_unplugged build` and read the metadata block.

## presenter-guide.pdf

Every slide followed by its own speaker-notes page. Read it once before you
deliver and take it to the lectern.

## Also needed, not in this pack

- a projector, and the deck's annotation layer (shift-W on the board slide) for
  the generated text --- or a whiteboard
- a scribe, if you'd rather not write and talk at the same time

## More

The talk entry, with the running order and the rest of the preparation:
<https://www.llmsunplugged.org/talks/unplugged-in-the-age-of-ai/>

Rebuild this pack with `make pack-unplugged-in-the-age-of-ai` in the
llms-unplugged repo.
