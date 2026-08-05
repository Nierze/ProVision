<script setup lang="ts">
/**
 * The one button. Renders as <button>, or as a link when given `to`.
 * Every tappable thing is at least 44px tall — the smallest target a thumb
 * hits reliably.
 */
const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
    size?: 'sm' | 'md' | 'lg'
    block?: boolean
    icon?: string
    iconAfter?: string
    to?: string
    disabled?: boolean
  }>(),
  { variant: 'secondary', size: 'md', block: false },
)

const VARIANTS = {
  primary:
    'bg-accent text-white border-transparent shadow-[0_6px_18px_-8px_var(--c-accent)] hover:brightness-110 active:brightness-95',
  secondary: 'bg-panel-2 text-ink border-line hover:bg-panel-3 hover:border-line-2',
  ghost: 'bg-transparent text-ink-dim border-transparent hover:bg-panel-2 hover:text-ink',
  danger: 'bg-transparent text-bad border-line hover:border-bad/50 hover:bg-bad/8',
} as const

const SIZES = {
  sm: 'min-h-9 px-3 text-[13px] gap-1.5 rounded-lg',
  md: 'min-h-11 px-4 text-sm gap-2 rounded-xl',
  lg: 'min-h-13 px-5 text-[15px] gap-2 rounded-xl',
} as const

const classes = computed(() => [
  'inline-flex items-center justify-center border font-semibold select-none',
  'transition-[background,border-color,filter,transform] duration-150 active:translate-y-px',
  'disabled:opacity-45 disabled:pointer-events-none',
  VARIANTS[props.variant],
  SIZES[props.size],
  props.block && 'w-full',
])
</script>

<template>
  <NuxtLink v-if="to" :to="to" :class="classes">
    <UiIcon v-if="icon" :name="icon" :size="size === 'sm' ? 16 : 18" />
    <span><slot /></span>
    <UiIcon v-if="iconAfter" :name="iconAfter" :size="size === 'sm' ? 16 : 18" />
  </NuxtLink>

  <button v-else type="button" :class="classes" :disabled="disabled">
    <UiIcon v-if="icon" :name="icon" :size="size === 'sm' ? 16 : 18" />
    <span><slot /></span>
    <UiIcon v-if="iconAfter" :name="iconAfter" :size="size === 'sm' ? 16 : 18" />
  </button>
</template>
