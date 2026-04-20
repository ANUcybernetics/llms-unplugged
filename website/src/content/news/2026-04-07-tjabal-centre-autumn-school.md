---
title: Luritja resampled
date: 2026-04-07
author: Ben Swift
description:
  Running LLMs Unplugged at the Tjabal Centre Autumn School with Luritja poet
  Matt Heffernan, using his poem Ngurrparringu as the training text
---

Last week we ran _LLMs Unplugged_ at the
[Tjabal Centre](https://www.anu.edu.au/students/contacts/tjabal-indigenous-higher-education-centre)'s
Autumn School with
[Matt Heffernan](https://redroompoetry.org/poets/matthew-heffernan/)---Luritja
poet, collaborator, and (for the morning) generous supplier of training data.
The Autumn School is part of the
[Bandalang National Indigenous Engineering Autumn School](https://eng.anu.edu.au/bandalang/programs/bandalang-national-indigenous-engineering-autumn-school/),
a week-long program that brings Aboriginal and Torres Strait Islander high
school students to ANU to explore engineering, computing, and cybernetics
alongside researchers and Indigenous knowledge holders. Instead of
the usual training texts we used Matt's poem
[_Ngurrparringu (Forgotten)_](https://redroompoetry.org/poets/matthew-heffernan/ngurrparringu-forgotten/)
in both its Luritja and English versions. Participants did what LLMs Unplugged
participants always do---counted token frequencies, sorted them into bigram
buckets, and generated new text by drawing tokens from those buckets---except
this time the new text came out in Luritja.

![Matt Heffernan looking on as an Autumn School participant works through the training activity](/assets/images/tjabal-workshop-01.avif)

_Ngurrparringu_ is about language, ancestors, country, and forgetting. Handing
it to a room of Autumn School students so they could cut it into pieces and
rearrange those pieces into new statistical remixes takes a particular kind of
generosity. Thanks Matt for being willing to share this moment---as poet,
translator, and co-teacher.

![Hands arranging Luritja word tokens: ngurra, ngayulu, tjukurrpa, warranu, nyinapa, ngayunywanpa](/assets/images/tjabal-workshop-02.avif)

Here's one of the Luritja generations that came out of a group's bigram model:

> ngurra, Warumpila, Ngayulu Tjilpirringkula ngurrakutu Yankuku. Walpa
> tjamunyatjarra yutitja kulini. Kunyi Wiyalpi ngayulu nyinarra ngurrparringu.
> Tjinguru irrititja tjilpi tjuta ngayunywanpa ngurrangka nyinangu. Walpawana
> tjilpilu warranu tjukurrpa. Wiya Watjilarritjaku. Kala tjinguru ngayulu Walpa
> kulitjaku, walpaya kulinu watjilpa wiyangku.

Matt translated it for us on-the-fly:

> Country... Warumpi, I will become an old man, towards homes going. My
> grandfather's Winds heard Clearly, Poor things, I don't stay---forgotten,
> Maybe, in the old times, old men like me Stayed on Country, the Wind, the old
> men Sung Dreamtime, Not Sad anymore, but---ok, maybe I will hear the Wind,
> Wind is lonely---No.

Every word in the Luritja comes from Matt's poem; the model has just put them in
a different order.

![English word tokens: home, return, hear, the, sung, and, to, my](/assets/images/tjabal-workshop-03.avif)

There is nothing inherently English (or any other particular language) about a
language model. The training data determines the output language. Train on
Luritja, get Luritja out. Train on a Python codebase, get something that looks
like Python. What goes in is what comes out.

Another group trained on only the English version of _Ngurrparringu_ and their
language model generated this poem:

> Clearly anymore. I don't hear the wind, listening to the old men sat on the
> wind of my people, Warumpi

Every word Matt's, but reshuffled. To close out the morning we all worked
together on one more new LLM-generated poem, this time tipping _The Cat in the
Hat_ into the training mix alongside the English poem:

> Good Fun at all if you wish we sat in the mountains, we had something to Sing
> our Tjukurrpa, Cold

"Good fun" and "all if you wish" are Seuss; "mountains" and "Tjukurrpa" are
Matt. The model samples whatever tokens are in the bucket, and if you mix the
training data and you mix the output.

The corollary is that if a language isn't in the training data, it isn't in the
outputs either. No representation in, no representation out. When people say
modern LLMs "know" English better than other languages, they mean those LLMs
were trained on orders of magnitude more English text than anything else, and
the tokenisers, evaluations and benchmarks all reflect that choice. It's a
property of what we fed them.

![Autumn School students and Ben gathered around a table covered in word tokens](/assets/images/tjabal-workshop-04.avif)

Thanks again to Matt for the time, the poem, and the translations, and to the
Tjabal Centre and the Autumn School participants for being up for something new
on a Tuesday morning. If you work with a language (or a community, or a
knowledge tradition) that's underrepresented in LLM training data and want to
try something like this, do [get in touch](/about#get-in-touch)---we'd love to
help.
