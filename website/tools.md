---
title: Tools
description: Generate N-gram model booklets in your browser
---

# Tools

Generate N-gram model booklets directly in your browser using
[typst.ts](https://github.com/Myriad-Dreamin/typst.ts).

::: warning Experimental

This is an experimental feature. The compiler and fonts are loaded from CDN on
page load, which may take a moment on first use.

:::

<script setup>
import { onMounted, ref } from 'vue'
import TypstCompiler from './.vitepress/theme/components/TypstCompiler.vue'

const isClient = ref(false)
onMounted(() => {
  isClient.value = true
})
</script>

<TypstCompiler v-if="isClient" />
