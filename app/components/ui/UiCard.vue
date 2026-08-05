<script setup lang="ts">
withDefaults(defineProps<{ to?: string; pad?: 'sm' | 'md' | 'lg'; interactive?: boolean }>(), {
  pad: 'md',
})

const PADS = { sm: 'p-3', md: 'p-4', lg: 'p-5 sm:p-6' }

const HOVER =
  'transition-[border-color,background,transform] duration-150 hover:border-line-2 hover:bg-panel-2 active:translate-y-px'
</script>

<template>
  <NuxtLink
    v-if="to"
    :to="to"
    class="block rounded-[var(--radius-card)] border border-line bg-panel"
    :class="[PADS[pad], HOVER]"
  >
    <slot />
  </NuxtLink>

  <div
    v-else
    class="rounded-[var(--radius-card)] border border-line bg-panel"
    :class="[PADS[pad], interactive && HOVER]"
  >
    <slot />
  </div>
</template>
