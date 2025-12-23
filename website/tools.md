---
title: Tools
description: Generate N-gram model booklets in your browser
---

# Tools

Generate N-gram language model materials directly in your browser. Upload a text
file or paste text, choose your options, and download a PDF---no server
required. Then print it out and use in any of the _LLMs Unplugged_ activities
that requires a pre-trained langauge model.

::: info Example booklets

Don't want to generate your own? Download ready-to-print booklets:

- [Green Eggs and Ham](/assets/pdfs/booklets/green-eggs-and-ham.pdf) (Dr Seuss,
  5 pages)
- [The Cat in the Hat](/assets/pdfs/booklets/the-cat-in-the-hat.pdf) (Dr Seuss,
  7 pages)
- [Beatles Lyrics](/assets/pdfs/booklets/beatles.pdf) (35 pages)
- [A Christmas Carol](/assets/pdfs/booklets/a-christmas-carol.pdf) (Dickens, 52
  pages)
- [Frankenstein](/assets/pdfs/booklets/frankenstein.pdf) (Shelley, 101 pages)
- [Collected Hemingway](/assets/pdfs/booklets/collected-hemingway.pdf) (379
  pages)

:::

## How to use

1. **Enter your text**: upload a file or paste text directly
2. **Add metadata**: provide a title (required) and optionally an author
3. **Choose options**: select the n-gram size and output type
4. **Generate**: preview as SVG or download as PDF

## Supported file formats

- `.txt` --- plain text files
- `.md` --- markdown files (treated as plain text)
- `.docx` --- Microsoft Word documents (text extracted, formatting ignored)
- `.pdf` --- PDF documents (best-effort text extraction; scanned/image-based
  PDFs won't work)

## Output types

- **Booklet**: generates dice lookup tables for probabilistic text generation,
  as used in the [Pre-trained Model Generation](/lessons/pretrained-generation)
  lesson
- **Cutouts**: generates token cards for the [Training](/lessons/training)
  lesson (bucket method)

<script setup>
import { onMounted, ref } from 'vue'
import TypstCompiler from './.vitepress/theme/components/TypstCompiler.vue'

const isClient = ref(false)
onMounted(() => {
  isClient.value = true
})
</script>

## PDF generator

::: warning Experimental

This is an experimental feature. The compiler and processing modules are loaded
from CDN on first use, which may take a moment. Your text is processed entirely
in your browser and is never sent to any server.

:::

<TypstCompiler v-if="isClient" />
