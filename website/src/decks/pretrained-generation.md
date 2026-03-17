<!-- _class: banner -->

# Pre-trained generation

![bg brightness:0.3](./assets/bg-div-historical.avif)

---

## The algorithm

![bg right:40%](./assets/bg-algorithm-generation.avif)

1. **choose** a starting word --- any bold word in the booklet
2. **look up** that word's entry to see possible next words and their thresholds
3. **roll** your d10(s) and scan the thresholds to find the next word
4. **write down** the chosen word and make it your new starting word
5. **repeat** from step 2

---

## Pre-trained: start with `see`

only one option --- no dice roll needed

<StaticPretrainedGeneration tokens={EXAMPLE_TEXT} sequence={EXAMPLE_PRETRAINED_SEQ} rolls={EXAMPLE_PRETRAINED_ROLLS} step={0} />

---

## Pre-trained: `see` &rarr; `spot`

two options (`run` and `,`) with thresholds --- roll a d10!

<StaticPretrainedGeneration tokens={EXAMPLE_TEXT} sequence={EXAMPLE_PRETRAINED_SEQ} rolls={EXAMPLE_PRETRAINED_ROLLS} step={1} />

---

## Pre-trained: `spot` &rarr; `,`

two options (`spot` and `run`) --- roll a d10!

<StaticPretrainedGeneration tokens={EXAMPLE_TEXT} sequence={EXAMPLE_PRETRAINED_SEQ} rolls={EXAMPLE_PRETRAINED_ROLLS} step={2} />

---

## Pre-trained: `,` &rarr; `run`

two options (`.` and `,`) --- roll a d10!

<StaticPretrainedGeneration tokens={EXAMPLE_TEXT} sequence={EXAMPLE_PRETRAINED_SEQ} rolls={EXAMPLE_PRETRAINED_ROLLS} step={3} />

---

## Pre-trained: `run` &rarr; `.`

only one option --- no dice roll needed

<StaticPretrainedGeneration tokens={EXAMPLE_TEXT} sequence={EXAMPLE_PRETRAINED_SEQ} rolls={EXAMPLE_PRETRAINED_ROLLS} step={4} />

---

## Pre-trained: `.` &rarr; `run`

and so on...

<StaticPretrainedGeneration tokens={EXAMPLE_TEXT} sequence={EXAMPLE_PRETRAINED_SEQ} rolls={EXAMPLE_PRETRAINED_ROLLS} step={5} />

---

<!-- _class: banner -->

# Pre-trained generation

![bg brightness:0.3](./assets/bg-div-historical.avif)

---

<!-- _class: banner -->

# Shareback

![bg brightness:0.5](./assets/bg-div-reception.avif)

---

## The _language_ of language models

![bg right:60%](./assets/bg-design-goals.avif)

- pre-training
- foundation model
