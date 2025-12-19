---
title: Tools
description: Generate N-gram model PDFs in your browser
---

# Tools

Generate N-gram language model materials directly in your browser. Upload a text
file or paste text, choose your options, and download a PDF---no server
required.

::: warning Experimental

This is an experimental feature. The compiler and processing modules are loaded
from CDN on first use, which may take a moment. Your text is processed entirely
in your browser and is never sent to any server.

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
import TrainingWidget from './.vitepress/theme/components/TrainingWidget.vue'
import BucketTrainingWidget from './.vitepress/theme/components/BucketTrainingWidget.vue'
import GenerationWidget from './.vitepress/theme/components/GenerationWidget.vue'
import BucketGenerationWidget from './.vitepress/theme/components/BucketGenerationWidget.vue'
import PretrainedGenerationWidget from './.vitepress/theme/components/PretrainedGenerationWidget.vue'

const isClient = ref(false)
onMounted(() => {
  isClient.value = true
})
</script>

## PDF generator

<TypstCompiler v-if="isClient" />

---

## Interactive widgets

These widgets demonstrate key concepts from the lessons. Each one lets you step
through the algorithm at your own pace, seeing exactly how language models train
and generate text.

### Training (grid method)

Build a bigram language model by counting word pairs on a grid. Used in the
[Training](/lessons/training) lesson.

<TrainingWidget v-if="isClient" />

### Training (bucket method)

Build a bigram language model using physical buckets that collect tokens. An
alternative visualisation used in the [Training](/lessons/training) lesson.

<BucketTrainingWidget v-if="isClient" />

### Generation (grid method)

Generate text from your grid model using dice rolls. Used in the
[Generation](/lessons/generation) lesson.

<GenerationWidget v-if="isClient" />

### Generation (bucket method)

Generate text by randomly picking tokens from buckets. Used in the
[Generation](/lessons/generation) lesson.

<BucketGenerationWidget v-if="isClient" />

### Pre-trained generation

Generate text from a pre-trained booklet model with weighted sampling. Used in
the [Pre-trained Model Generation](/lessons/pretrained-generation) lesson.

<PretrainedGenerationWidget v-if="isClient" />
