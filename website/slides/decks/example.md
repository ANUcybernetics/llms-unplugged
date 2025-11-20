---
theme: ../theme
title: LLMs Unplugged
info: |
  Teaching language models through hands-on activities
drawings:
  persist: false
transition: slide-left
mdc: true
---

# LLMs Unplugged

Teaching how language models work through hands-on activities

---

## What is LLMs Unplugged?

A teaching project for creating N-gram language models from scratch

- **Manual tools** for pen-and-paper activities
- **Automated tools** for generating models and materials
- **Teaching resources** including worksheets and runsheets

---

## The core workflow

```
text file → Rust CLI → model.json → Typst → PDF booklet
```

Students can generate text using:

- Physical dice
- Probability tables
- Their understanding of language patterns

---

## N-gram language models

An **N-gram** is a sequence of N tokens from a text

```javascript
const text = "the cat sat on the mat";
const bigrams = [
  ["the", "cat"],
  ["cat", "sat"],
  ["sat", "on"],
  ["on", "the"],
  ["the", "mat"],
];
```

The model learns which words follow other words

---
layout: two-cols
---

## Why unplugged?

Learning by doing helps understanding

- No black boxes
- Transparent process
- Human-scale computation

::right::

## Key concepts

- Probability distributions
- Conditional probability
- Markov chains
- Text generation

---

## Code highlighting example

```python
def generate_text(model, start_word, length=10):
    result = [start_word]
    current = start_word

    for _ in range(length - 1):
        if current in model:
            next_word = random.choices(
                list(model[current].keys()),
                weights=list(model[current].values())
            )[0]
            result.append(next_word)
            current = next_word
        else:
            break

    return ' '.join(result)
```

---
layout: center
---

## Get started

Visit **[llmsunplugged.org](https://www.llmsunplugged.org)**

Download resources and start teaching

---
layout: cover
---

# Thank you

Questions?
