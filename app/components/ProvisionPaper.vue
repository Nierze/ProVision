<script setup lang="ts">
import type { Unit } from '~/types'

/**
 * The sheet a provision is printed on. Always parchment, in either theme —
 * the page you are reading shouldn't change colour under you.
 */
withDefaults(
  defineProps<{
    unit: Unit
    /** Extra leading, for drills that put inputs inside the text. */
    loose?: boolean
    showCite?: boolean
  }>(),
  { showCite: true },
)
</script>

<template>
  <article class="paper paper-ruled px-5 py-5 sm:px-8 sm:py-7">
    <header v-if="showCite" class="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 pl-4">
      <span
        class="stamp rounded bg-royal-600/10 px-2 py-1 text-royal-800"
        style="letter-spacing: 0.06em"
      >
        {{ unit.label }}
      </span>
      <span class="stamp text-[10px] text-parchment-dim">
        {{ unit.articleTitle }}{{ unit.articleSubject ? ` · ${unit.articleSubject}` : '' }}
      </span>
    </header>

    <div
      class="pl-4 font-serif text-[17px] sm:text-[18.5px]"
      :class="loose ? 'leading-[2.5]' : 'leading-[1.85]'"
    >
      <slot>{{ unit.text }}</slot>
    </div>
  </article>
</template>
