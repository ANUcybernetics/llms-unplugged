# My First LM

Ever wanted to train your own Language Model by hand? Now you can.

## Use

Using [typst](https://typst.app/), generate the `grid.pdf` file with

    typst compile grid.typ

Rrint it out on A3 paper (or bigger, if you have access to a large format
printer).

## Instructions

After you've printed out the grid, See `instructions.typ`.

## Automatic grid generation

This is more fun if you do it yourself, but if you have a text file and you want
to generate the (bigram) LM grid for it, there's a couple of scripts in this
repo which will do it for you. Say you've got your text in a file called
`true-blue.txt`.

First, generate the "counts" file of how often words follow other words:

    uv run generate_counts.py `true-blue.txt`

Then, typeset the grid with:

    typst compile bigram-model.typ \
      --input data=true-blue.csv \
      --input title="True Blue"

The final grid will be in `bigram-model.pdf`.

## Author

Ben Swift

This work is a project of the _Cybernetic Studio_ at the
[ANU School of Cybernetics](https://cybernetics.anu.edu.au).

## Licence

CC BY-NC-SA 4.0

Fun With Dick and Jane reader: public domain (pdf downloaded from
[archive.org](https://ia800907.us.archive.org/31/items/funwithdickjane0000gray/funwithdickjane0000gray.pdf))

[Eugene Onegin translated by Babette Deutsch: public domain](https://archive.org/stream/in.ernet.dli.2015.165902/2015.165902.Eugene-Onegin-A-Novel-In-Verse_djvu.txt)
