<script setup lang="ts">
import type { MasteryLevel } from '~/types'

const props = defineProps<{ level: MasteryLevel }>()

const TONES = ['bg-line-2', 'bg-brass-500', 'bg-accent', 'bg-good']
</script>

<template>
  <span class="inline-flex items-center gap-[3px]" :title="MASTERY_LABELS[props.level]">
    <span class="sr-only">{{ MASTERY_LABELS[props.level] }}</span>
    <i
      v-for="step in 3"
      :key="step"
      class="block size-1.5 rounded-full transition-colors"
      :class="step <= level ? TONES[level] : 'bg-line-2 opacity-45'"
    />
  </span>
</template>
