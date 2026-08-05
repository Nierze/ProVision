<script setup lang="ts">
withDefaults(defineProps<{ value: number; tone?: 'accent' | 'good' | 'brass'; thick?: boolean }>(), {
  tone: 'accent',
})

const TONES = {
  accent: 'bg-accent',
  good: 'bg-good',
  brass: 'bg-brass-500',
}
</script>

<template>
  <div
    class="w-full overflow-hidden rounded-full bg-line"
    :class="thick ? 'h-2' : 'h-1.5'"
    role="progressbar"
    :aria-valuenow="Math.round(value * 100)"
    aria-valuemin="0"
    aria-valuemax="100"
  >
    <div
      class="h-full rounded-full transition-[width] duration-500 ease-[var(--ease-out-soft)]"
      :class="TONES[tone]"
      :style="{ width: `${Math.min(100, Math.max(0, value * 100))}%` }"
    />
  </div>
</template>
