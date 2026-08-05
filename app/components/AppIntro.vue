<script setup lang="ts">
/**
 * Title card. Shows on a first visit and again on any load more than
 * REPEAT_AFTER since the last one, so a working session isn't interrupted but
 * coming back later still gets the intro.
 * Every animated property is transform/opacity so the whole sequence stays on
 * the compositor and never triggers layout.
 */
import { AUTHOR } from '~/data/author'

const KEY = 'provision.intro.v2'
const REPEAT_AFTER = 10 * 60 * 1000

const visible = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

/** Stamped when the card is shown, not when dismissed, so the window is
 *  measured from one appearance to the next however long it stays up. */
function stamp() {
  writeJson(KEY, { at: Date.now() })
}

function dismiss() {
  if (!visible.value) return
  visible.value = false
  clearTimeout(timer)
  window.removeEventListener('keydown', onKey)
}

function onKey(event: KeyboardEvent) {
  if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') dismiss()
}

onMounted(() => {
  const { at } = readJson(KEY, { at: 0 })
  // A clock that jumped backwards shouldn't lock the card out indefinitely.
  if (at && at <= Date.now() && Date.now() - at < REPEAT_AFTER) return

  visible.value = true
  stamp()
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  timer = setTimeout(dismiss, reduced ? 1400 : 4600)
  window.addEventListener('keydown', onKey)
})

onBeforeUnmount(() => {
  clearTimeout(timer)
  window.removeEventListener('keydown', onKey)
})

// The card owns the screen while it is up, so keep the page behind it still.
watchEffect(onCleanup => {
  if (!visible.value) return
  document.documentElement.style.overflow = 'hidden'
  onCleanup(() => {
    document.documentElement.style.overflow = ''
  })
})
</script>

<template>
  <Transition name="intro">
    <div
      v-if="visible"
      class="intro fixed inset-0 z-50 grid place-items-center overflow-hidden bg-surface px-6"
      role="dialog"
      aria-modal="true"
      aria-label="About this app"
      @click="dismiss"
    >
      <div
        aria-hidden="true"
        class="pointer-events-none absolute -top-24 left-1/2 size-[26rem] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
        style="background: radial-gradient(circle, var(--c-accent-soft), transparent 70%)"
      />
      <div
        aria-hidden="true"
        class="pointer-events-none absolute -bottom-24 left-1/3 size-72 rounded-full opacity-25 blur-3xl"
        style="background: radial-gradient(circle, var(--color-brass-200), transparent 72%)"
      />

      <div class="relative w-full max-w-md text-center">
        <TheSeal :size="72" class="intro-seal mx-auto" />

        <h1
          class="intro-line mt-5 font-serif text-3xl leading-tight font-bold sm:text-4xl"
          style="--d: 0.3s"
        >
          ProVision
        </h1>

        <p class="intro-line mt-1.5 text-sm font-medium text-accent sm:text-base" style="--d: 0.42s">
          Memorize the provision like a pro!
        </p>

        <div class="ornament intro-line mt-5" style="--d: 0.58s">
          <UiIcon name="target" :size="13" />
        </div>

        <!-- Author credit: present and legible, but visually a supporting
             line under the app's own name and slogan, not the headline. -->
        <p class="stamp intro-line mt-5 text-ink-faint" style="--d: 0.7s">Made by</p>
        <p
          class="intro-line mt-1 font-serif text-lg font-semibold text-balance"
          style="--d: 0.82s"
        >
          {{ AUTHOR.name }}
        </p>

        <ul class="mt-4 flex flex-col items-center gap-2">
          <li
            v-for="(link, i) in AUTHOR.links"
            :key="link.id"
            class="intro-line w-full"
            :style="{ '--d': `${0.95 + i * 0.12}s` }"
          >
            <a
              :href="link.href"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center justify-center gap-2 rounded-xl border border-line bg-panel/70 px-4 py-2.5 text-sm font-medium text-ink-dim transition-[color,border-color,transform] duration-150 hover:-translate-y-px hover:border-line-2 hover:text-ink"
              @click.stop
            >
              <UiIcon :name="link.icon" :size="16" class="text-accent" />
              <span class="truncate">{{ link.label }}</span>
            </a>
          </li>
        </ul>

        <button
          class="intro-line mt-6 text-xs font-semibold text-accent underline-offset-4 hover:underline"
          style="--d: 1.55s"
          @click.stop="dismiss"
        >
          Enter
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
@keyframes intro-rise {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes intro-seal-in {
  from {
    opacity: 0;
    transform: scale(0.82);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.intro-line {
  animation: intro-rise 0.55s var(--ease-out-soft) both;
  animation-delay: var(--d, 0s);
}

.intro-seal {
  animation: intro-seal-in 0.7s var(--ease-out-soft) both;
}

.intro-leave-active {
  transition:
    opacity 0.45s var(--ease-out-soft),
    transform 0.45s var(--ease-out-soft);
}

.intro-leave-to {
  opacity: 0;
  transform: scale(1.02);
}

/* The global reduced-motion rule zeroes duration but not delay, which would
   hold the staged lines back past this card's shortened dismiss timer. */
@media (prefers-reduced-motion: reduce) {
  .intro-line,
  .intro-seal {
    animation-delay: 0s !important;
  }
}
</style>
