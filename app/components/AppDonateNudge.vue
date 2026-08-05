<script setup lang="ts">
/**
 * Friendly post-completion donate banner. Triggered by useDonateNudge().notify()
 * from completion screens, rate-limited there to once per 30 minutes — this
 * component only renders what it's told to.
 */
import { SUPPORT } from '~/data/author'

const { visible, dismiss } = useDonateNudge()

const expanded = ref(false)
const copied = ref(false)
let copiedTimer: ReturnType<typeof setTimeout> | undefined

async function copyNumber() {
  try {
    await navigator.clipboard.writeText(SUPPORT.number)
    copied.value = true
    clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => (copied.value = false), 1600)
  } catch {
    // Clipboard blocked or unavailable. The number is on screen regardless.
  }
}

function close() {
  expanded.value = false
  dismiss()
}

watch(visible, value => {
  if (!value) expanded.value = false
})

onBeforeUnmount(() => clearTimeout(copiedTimer))
</script>

<template>
  <Transition name="nudge">
    <div
      v-if="visible"
      class="safe-b fixed inset-x-4 bottom-[4.5rem] z-40 mx-auto max-w-sm md:inset-x-auto md:right-5 md:bottom-5"
      role="status"
    >
      <div class="overflow-hidden rounded-[var(--radius-card)] border border-line bg-panel shadow-[0_16px_36px_-20px_var(--c-accent)]">
        <div class="flex items-start gap-3 p-3.5">
          <span
            class="grid size-9 shrink-0 place-items-center rounded-lg text-sm font-extrabold text-white"
            style="background: #0072ff"
            aria-hidden="true"
          >
            G
          </span>

          <div class="min-w-0 flex-1 pt-0.5">
            <p class="text-sm font-semibold">Enjoying ProVision?</p>
            <p class="mt-0.5 text-xs leading-relaxed text-ink-dim">
              A small tip via <span class="font-semibold" style="color: #0072ff">GCash</span> helps
              keep it free and growing.
            </p>

            <div v-if="!expanded" class="mt-2.5 flex items-center gap-3">
              <button
                class="text-xs font-semibold text-accent hover:underline"
                @click="expanded = true"
              >
                Send via GCash
              </button>
              <button class="text-xs font-medium text-ink-faint hover:text-ink-dim" @click="close">
                Not now
              </button>
            </div>
          </div>

          <button
            class="grid size-6 shrink-0 place-items-center rounded-md text-ink-faint transition-colors hover:bg-panel-2 hover:text-ink"
            aria-label="Dismiss"
            @click="close"
          >
            <UiIcon name="close" :size="13" />
          </button>
        </div>

        <div v-if="expanded" class="animate-rise border-t border-line px-3.5 pt-3 pb-3.5">
          <dl class="space-y-1.5">
            <div class="flex items-baseline justify-between gap-3">
              <dt class="stamp text-ink-faint">GCash name</dt>
              <dd class="truncate text-xs font-medium">{{ SUPPORT.name }}</dd>
            </div>
            <div class="flex items-baseline justify-between gap-3">
              <dt class="stamp text-ink-faint">Number</dt>
              <dd class="font-mono text-xs font-semibold tabular-nums">{{ SUPPORT.number }}</dd>
            </div>
          </dl>

          <button
            class="mt-2.5 flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-line px-3 text-xs font-semibold transition-[color,border-color,transform] duration-150 hover:-translate-y-px hover:border-line-2 hover:text-ink"
            :class="copied ? 'text-good' : 'text-ink-dim'"
            @click="copyNumber"
          >
            <UiIcon :name="copied ? 'check' : 'copy'" :size="14" />
            {{ copied ? 'Number copied' : 'Copy number' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.nudge-enter-active {
  transition:
    opacity 0.35s var(--ease-out-soft),
    transform 0.35s var(--ease-out-soft);
}
.nudge-leave-active {
  transition:
    opacity 0.25s var(--ease-out-soft),
    transform 0.25s var(--ease-out-soft);
}
.nudge-enter-from,
.nudge-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
