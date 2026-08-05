<script setup lang="ts">
/**
 * First-visit title card. Shows once per device, then never again.
 * Every animated property is transform/opacity so the whole sequence stays on
 * the compositor and never triggers layout.
 */
import { AUTHOR } from '~/data/author'

const KEY = 'provision.intro.v1'

const visible = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

function dismiss() {
  if (!visible.value) return
  visible.value = false
  clearTimeout(timer)
  window.removeEventListener('keydown', onKey)
  writeJson(KEY, { seen: true })
}

function onKey(event: KeyboardEvent) {
  if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') dismiss()
}

onMounted(() => {
  if (readJson(KEY, { seen: false }).seen) return

  visible.value = true
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

        <p class="stamp intro-line mt-6 text-ink-faint" style="--d: 0.35s">Made by</p>

        <h1
          class="intro-line mt-1.5 font-serif text-[26px] leading-tight font-bold text-balance sm:text-3xl"
          style="--d: 0.5s"
        >
          {{ AUTHOR.name }}
        </h1>

        <div class="ornament intro-line mt-5" style="--d: 0.7s">
          <UiIcon name="target" :size="13" />
        </div>

        <ul class="mt-5 flex flex-col items-center gap-2">
          <li
            v-for="(link, i) in AUTHOR.links"
            :key="link.id"
            class="intro-line w-full"
            :style="{ '--d': `${0.85 + i * 0.12}s` }"
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

        <p class="intro-line mt-7 text-xs text-ink-faint" style="--d: 1.3s">
          ProVision — learn the 1987 Constitution
        </p>

        <button
          class="intro-line mt-3 text-xs font-semibold text-accent underline-offset-4 hover:underline"
          style="--d: 1.45s"
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
