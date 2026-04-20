<!-- _class: banner -->

# Generation

![bg brightness:0.5](./assets/bg-div-lessons.avif)

---

## The algorithm

![bg right:40%](./assets/bg-algorithm-generation.avif)

1. **choose** a starting word from your grid
2. **look** at that word's row to find all possible next words and their counts
3. **roll dice** weighted by the counts to pick the next word
4. **write down** the chosen word and make it your new starting word
5. **repeat** from step 2

---

## Generation: start with `see`

only one option --- no dice roll needed

<StaticGeneration tokens={EXAMPLE_TOKENS} vocabulary={EXAMPLE_VOCAB} sequence={EXAMPLE_GENERATION} step={0} />

---

## Generation: `see` &rarr; `spot`

two options (`run` and `,`) --- roll dice!

<StaticGeneration tokens={EXAMPLE_TOKENS} vocabulary={EXAMPLE_VOCAB} sequence={EXAMPLE_GENERATION} step={1} />

---

## Generation: `spot` &rarr; `,`

two options (`spot` and `run`) --- roll dice!

<StaticGeneration tokens={EXAMPLE_TOKENS} vocabulary={EXAMPLE_VOCAB} sequence={EXAMPLE_GENERATION} step={2} />

---

## Generation: `,` &rarr; `run`

two options (`.` and `,`) --- roll dice!

<StaticGeneration tokens={EXAMPLE_TOKENS} vocabulary={EXAMPLE_VOCAB} sequence={EXAMPLE_GENERATION} step={3} />

---

## Generation: `run` &rarr; `.`

&nbsp;

<StaticGeneration tokens={EXAMPLE_TOKENS} vocabulary={EXAMPLE_VOCAB} sequence={EXAMPLE_GENERATION} step={4} />

---

## Generation: `.` &rarr; `run`

and so on...

<StaticGeneration tokens={EXAMPLE_TOKENS} vocabulary={EXAMPLE_VOCAB} sequence={EXAMPLE_GENERATION} step={5} />

---

## Generated text

![bg right:40%](./assets/bg-generated-text.avif)

_"see spot, run."_

a new sentence --- not in the training data!

---

<!-- _class: banner -->

# Generation

![bg brightness:0.5](./assets/bg-div-lessons.avif)

---

<!-- _class: banner -->

# Shareback

![bg brightness:0.5](./assets/bg-div-reception.avif)

---

## The _language_ of language models

![bg cover left:60%](./assets/bg-shannon.avif)

- prompt
- completion/response/prediction
- context window
