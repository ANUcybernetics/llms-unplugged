---
title: The classroom request behind search sheets
date: 2026-09-17
author: Ben Swift
kind: report
description:
  Queensland teacher Samantha Ephraims ran LLMs Unplugged with primary students
  and 40 teachers, and the space problem she hit became search sheets.
published: true
---

In March, Samantha Ephraims, a teacher from regional Queensland, wrote asking
for a hands-on activity that showed a group of about six how a language model
generates text. Her lessons ran for 25 minutes. That is tight for either version
of the core activity. Students can [build a bigram table](/modules/training/)
and [roll dice against its counts](/modules/generation/), or cut a text into
token pairs and draw them from buckets, where the cutting alone takes a good
part of a lesson.

Sam tried both. In her own classroom, groups worked from pre-generated booklets
and D10 dice, one model trained on
[_The Cat in the Hat_](https://pdf.llmsunplugged.org/booklets/the-cat-in-the-hat.pdf)
and one on the much longer
[_Frankenstein_](https://pdf.llmsunplugged.org/booklets/frankenstein.pdf), then
compared what their models wrote. She also printed and cut out the Cat in the
Hat tokens ("Eeek!"). The booklets were easier to manage with groups.

She then presented the activities to 40 teachers at
[ConASTA](https://asta.edu.au/conasta/), the Australian Science Teachers
Association's national conference, and put a QR code for this website on her
slides. The tech teachers were keen on the tokens, but participants struggled to
see how to fit the activity into their teaching spaces. A pile of paper slips
needs time, table space and some confidence that none will end up under the
furniture. The group suggested posters instead, with the token pairs jumbled and
stuck around the walls, and Sam pictured A1 sheets in her own small lab. "Space
is always a premium," she wrote.

[Search sheets](/modules/search-sheets/) came out of that suggestion. Each set
shuffles every token pair in a text and deals them across a stack of A4 pages.
Print the pages large and put them on the walls, and you have Sam's posters.
Alternatively, hand out one page per person so everyone holds part of the model.
Someone reads out the last word on the board, and everyone with that word on
their sheet puts a hand up. Whoever gets picked reads out the word that follows
it. Common continuations get more hands than rare ones, so picking a hand at
random samples from something close to the model's probability
distribution.[^hands]

Four sets are ready to print from the [tools page](/tools/#search-sheets),
ranging from 15 sheets for _Green Eggs and Ham_ to 79 for a Simple English
Wikipedia article on Australia. The Cat in the Hat set Sam asked for has
[36 sheets](https://pdf.llmsunplugged.org/sheets/the-cat-in-the-hat.pdf), and
also comes as
[A5 sheets printed two-up on A4](https://pdf.llmsunplugged.org/sheets/the-cat-in-the-hat-2up-a4.pdf).
The first page of every set is a brief for whoever is running it. The
[talks](/talks/) use the same sheets, and each comes as a single download with
slides, presenter notes, sheets and brief (here's
[the pack for the 15-minute talk](https://pdf.llmsunplugged.org/packs/demystifying-large-language-models.zip)).

Thanks to Sam for doing the cutting, running the sessions and writing up such
detailed notes. If you have adapted _LLMs Unplugged_ for your own classroom,
[tell me what you changed](/about/#get-in-touch).

[^hands]:
    Someone holding three matches for the word still only gets one hand, so very
    common words come up a little less often than they should. Dealing the pairs
    out spreads each word across as many sheets as possible, which keeps that
    rare.
