<script setup lang="ts">
import type { NuxtError } from '#app'

defineProps<{ error: NuxtError }>()

// Reading settings applies the saved theme — the error page renders outside the layout.
useSettings()
</script>

<template>
  <div class="grid min-h-dvh place-items-center bg-surface px-6 text-center text-ink">
    <div class="relative">
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-x-0 top-0 mx-auto size-40 rounded-full opacity-70 blur-3xl"
        style="background: radial-gradient(circle, var(--c-accent-soft), transparent 70%)"
      />
      <TheSeal :size="56" class="relative mx-auto" />
      <p class="stamp mt-4 text-ink-faint">Error {{ error.statusCode }}</p>
      <h1 class="mt-1 font-serif text-2xl font-bold">
        {{ error.statusCode === 404 ? 'No such page' : 'Something went wrong' }}
      </h1>
      <p class="mt-2 max-w-sm text-sm text-ink-dim">
        {{
          error.statusCode === 404
            ? 'That address does not match anything in the app.'
            : 'Your progress is saved on this device and is unaffected.'
        }}
      </p>
      <UiButton variant="primary" class="mt-5" icon="home" @click="clearError({ redirect: '/' })">
        Back to today
      </UiButton>
    </div>
  </div>
</template>
