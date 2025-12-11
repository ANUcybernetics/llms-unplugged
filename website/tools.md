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

1. **Enter your text**: upload a `.txt` file or paste text directly
2. **Add metadata**: provide a title (required) and optionally an author
3. **Choose options**: select the n-gram size and output type
4. **Generate**: preview as SVG or download as PDF

## Output types

- **Booklet**: generates dice lookup tables for probabilistic text generation
- **Cutouts**: generates token cards for bucket training activities

<script setup>
import { onMounted, ref } from 'vue'
import TypstCompiler from './.vitepress/theme/components/TypstCompiler.vue'

const isClient = ref(false)
onMounted(() => {
  isClient.value = true
})
</script>

<TypstCompiler v-if="isClient" />
