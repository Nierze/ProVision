<script setup lang="ts">
/**
 * Quiet support prompt. A native <details> so it is closed by default and costs
 * one line until someone actually wants it — the app never interrupts a drill
 * to ask for money.
 */
import { SUPPORT } from '~/data/author'

const copied = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

async function copyNumber() {
  try {
    await navigator.clipboard.writeText(SUPPORT.number)
    copied.value = true
    clearTimeout(timer)
    timer = setTimeout(() => (copied.value = false), 1600)
  } catch {
    // Clipboard blocked or unavailable. The number is on screen regardless.
  }
}

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <details class="support group rounded-[var(--radius-card)] border border-line bg-panel/60">
    <summary
      class="flex min-h-11 cursor-pointer list-none items-center gap-2 px-3 text-xs font-semibold text-ink-dim transition-colors hover:text-ink"
    >
      <UiIcon name="heart" :size="14" class="text-accent" />
      Support this project
      <UiIcon
        name="chevronDown"
        :size="14"
        class="ml-auto text-ink-faint transition-transform duration-200 group-open:rotate-180"
      />
    </summary>

    <div class="animate-rise border-t border-line px-3 py-3">
      <p class="text-xs leading-relaxed text-ink-dim">
        ProVision is free and stores nothing on a server. If it helped you, you can send
        a little something to keep it going.
      </p>

      <dl class="mt-3 space-y-2">
        <div class="flex items-baseline justify-between gap-3">
          <dt class="stamp text-ink-faint">{{ SUPPORT.wallet }} name</dt>
          <dd class="truncate text-xs font-medium">{{ SUPPORT.name }}</dd>
        </div>
        <div class="flex items-baseline justify-between gap-3">
          <dt class="stamp text-ink-faint">Number</dt>
          <dd class="font-mono text-xs font-semibold tabular-nums">{{ SUPPORT.number }}</dd>
        </div>
      </dl>

      <button
        class="mt-3 flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-line px-3 text-xs font-semibold transition-[color,border-color,transform] duration-150 hover:-translate-y-px hover:border-line-2 hover:text-ink"
        :class="copied ? 'text-good' : 'text-ink-dim'"
        @click="copyNumber"
      >
        <UiIcon :name="copied ? 'check' : 'copy'" :size="14" />
        {{ copied ? 'Number copied' : 'Copy number' }}
      </button>
    </div>
  </details>
</template>

<style scoped>
/* Safari still paints the default disclosure triangle without this. */
.support summary::-webkit-details-marker {
  display: none;
}
</style>
