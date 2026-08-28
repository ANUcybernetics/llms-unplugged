---
title: The classroom request behind search sheets
date: 2026-08-24
author: Ben Swift
kind: report
description:
  Queensland teacher Samantha Ephraims tested LLMs Unplugged with primary
  students and 40 teachers, then suggested the classroom constraint that led to
  search sheets.
published: false
---

In March, Samantha Ephraims, a teacher from regional Queensland, wrote to me
with a fairly unforgiving teaching problem. Her primary classes had been cut to
half-hour lessons. She wanted a hands-on activity showing a group of six how a
language model generates text.

_LLMs Unplugged_ already had two versions of that activity. Students could
[build a bigram table](/modules/training/) and
[roll dice against its counts](/modules/generation/), or cut the text into token
pairs and sort them into buckets. Both versions fit on a table. The second
begins with substantial scissor work, a poor use of a lesson when the bell
rings after 30 minutes.

Sam tested both formats. In her own classroom she used D10 dice and
pre-generated booklets, working in groups. One model was trained on
[_The Cat in the Hat_](https://pdf.llmsunplugged.org/booklets/the-cat-in-the-hat.pdf);
the other used the much longer
[_Frankenstein_](https://pdf.llmsunplugged.org/booklets/frankenstein.pdf). The
groups generated text and shared what their models produced. She also printed
and cut the Cat in the Hat tokens, describing the cutting to me as "Eeek!" The
booklets proved easier to manage, although the loose tokens drew particular
interest from Digital Technologies teachers.

In July, Sam took the activities to
[ConASTA 73](https://asta.edu.au/conasta/), the Australian Science Teachers
Association's national conference, where she presented to 40 teachers. She put
a QR code for the _LLMs Unplugged_ website into her slides and invited the room
to explore the materials. Sam reported positive feedback, while the discussion
returned to the logistical problem she had found at school. A pile of cut-out
tokens needs time, table space and some confidence that none will disappear
under the furniture.

The teachers proposed posters: spread the shuffled token pairs across large
sheets around the room, then let students search the walls for the current
word. Sam had A1 posters in mind, an arrangement that could work in her small
lab and leave the cutting for longer sessions. "Space is always a premium,"
she wrote.

That request became the design brief for the
[search sheets](/news/2026-08-06-search-sheets/). The generator shuffles every
token pair in a text and deals them across the room. The implemented version
gives each participant one A4 sheet.[^posters] The pages can move between a
classroom, a lecture theatre and a conference room. Each person searches their
own page for the current token. Wherever it appears, a hand goes up with a
possible next token. The model's probability distribution becomes a show of
hands.

There are now four [ready-to-print sets](/tools/#search-sheets). The Cat in the
Hat comes as a
[36-sheet set](https://pdf.llmsunplugged.org/sheets/the-cat-in-the-hat.pdf) and
an [A5 version imposed two-up on A4](https://pdf.llmsunplugged.org/sheets/the-cat-in-the-hat-2up-a4.pdf).
The original poster arrangement remains available by enlarging the standard
pages when printing. The same command-line tool can deal another text into a
set sized for a particular room.

Sam is taking her revised presentation to
[QSITE's 2026 CreativITy conference](https://www.qsite.edu.au/) in September.
The Cat in the Hat token pairs can now go with her as printable sheets. They
are already shuffled and ready for a room of teachers to search. Five months
after Sam first wrote, her schedule-and-space problem is going back to a
conference as a printable tool. Thanks to Sam for doing the cutting, running
the sessions and sending back such detailed notes. If you have adapted _LLMs
Unplugged_ for your own classroom, please
[tell me what you changed](/about/#get-in-touch).

[^posters]:
    Sam's original wall-poster version and the participant-sheet version use
    the same shuffled deal. Only the placement changes: the first distributes
    the model around the walls, while the second distributes it among the
    people in the room.
