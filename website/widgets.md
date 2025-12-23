---
title: Widgets
description: Interactive demonstrations of language model concepts
---

# Widgets

These widgets demonstrate key concepts from the lessons. Each one lets you step
through the algorithm at your own pace, seeing exactly how language models train
and generate text.

<script setup>
import { onMounted, ref } from 'vue'
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

## Training (grid method)

Build a bigram language model by counting word pairs on a grid. Used in the
[Training](/lessons/training) lesson.

<TrainingWidget v-if="isClient" />

## Training (bucket method)

Build a bigram language model using physical buckets that collect tokens. An
alternative visualisation used in the [Training](/lessons/training) lesson.

<BucketTrainingWidget v-if="isClient" />

## Generation (grid method)

Generate text from your grid model using dice rolls. Used in the
[Generation](/lessons/generation) lesson.

<GenerationWidget v-if="isClient" />

## Generation (bucket method)

Generate text by randomly picking tokens from buckets. Used in the
[Generation](/lessons/generation) lesson.

<BucketGenerationWidget v-if="isClient" />

## Pre-trained generation

Generate text from a pre-trained booklet model with weighted sampling. Used in
the [Pre-trained Model Generation](/lessons/pretrained-generation) lesson.

<PretrainedGenerationWidget v-if="isClient" />
