<script setup lang="ts">
withDefaults(defineProps<{ to?: string; pad?: 'sm' | 'md' | 'lg'; interactive?: boolean }>(), {
  pad: 'md',
})

const PADS = { sm: 'p-3', md: 'p-4', lg: 'p-5 sm:p-6' }

const HOVER =
  'transition-[border-color,background,transform,box-shadow] duration-200 ease-[var(--ease-out-soft)] hover:border-line-2 hover:bg-panel-2 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-16px_var(--c-accent)] active:translate-y-0'
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
