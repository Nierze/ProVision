<script setup lang="ts">
/**
 * The app's mark: a double-ring seal around a section sign, with the three
 * stars of the flag along the lower arc.
 */
withDefaults(defineProps<{ size?: number }>(), { size: 32 })

/** A five-pointed star, outer radius 2.4, centred on the origin, point up. */
const STAR =
  '0,-2.4 0.59,-0.81 2.28,-0.74 0.95,0.31 1.41,1.94 0,1 -1.41,1.94 -0.95,0.31 -2.28,-0.74 -0.59,-0.81'

const STAR_POSITIONS = [
  { x: 16.4, y: 37.2 },
  { x: 24, y: 39.4 },
  { x: 31.6, y: 37.2 },
]
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 48 48" aria-hidden="true" class="shrink-0">
    <circle cx="24" cy="24" r="22.6" fill="none" stroke="var(--color-brass-500)" stroke-width="1.1" />
    <circle cx="24" cy="24" r="19.2" fill="none" stroke="var(--c-accent)" stroke-width="0.9" opacity="0.4" />

    <text
      x="24"
      y="24"
      text-anchor="middle"
      dominant-baseline="central"
      dy="-1.5"
      fill="var(--c-accent)"
      font-family="var(--font-serif)"
      font-size="25"
      font-weight="600"
    >
      §
    </text>

    <polygon
      v-for="(star, i) in STAR_POSITIONS"
      :key="i"
      :points="STAR"
      :transform="`translate(${star.x} ${star.y}) scale(0.8)`"
      fill="var(--color-brass-500)"
    />
  </svg>
</template>
