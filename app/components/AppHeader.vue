<script setup lang="ts">
const { settings, toggleTheme } = useSettings()
const { streak, todayXp } = useProgress()
const { items, isActive } = useNav()

const goalReached = computed(() => todayXp.value >= settings.dailyGoal)
</script>

<template>
  <header
    class="sticky top-0 z-30 border-b border-line bg-surface/85 backdrop-blur-md supports-[backdrop-filter]:bg-surface/70"
  >
    <div class="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
      <NuxtLink to="/" class="flex min-w-0 items-center gap-2.5">
        <TheSeal :size="30" />
        <span class="min-w-0">
          <span class="block truncate text-[15px] leading-tight font-bold tracking-tight">
            ProVision
          </span>
          <span class="stamp block text-ink-faint">1987 Constitution</span>
        </span>
      </NuxtLink>

      <nav class="ml-6 hidden items-center gap-1 md:flex">
        <NuxtLink
          v-for="item in items"
          :key="item.to"
          :to="item.to"
          class="rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-panel-2 hover:text-ink"
          :class="isActive(item.to) ? 'bg-panel-2 text-ink' : 'text-ink-dim'"
          :aria-current="isActive(item.to) ? 'page' : undefined"
        >
          {{ item.label }}
        </NuxtLink>
      </nav>

      <div class="ml-auto flex items-center gap-1.5">
        <span
          v-if="streak > 0"
          class="flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-xs font-semibold text-brass-700 dark:text-brass-400"
          :title="`${streak}-day streak`"
        >
          <UiIcon name="flame" :size="14" />
          {{ streak }}
        </span>

        <span
          class="flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors"
          :class="
            goalReached ? 'border-good/40 text-good' : 'border-line text-ink-dim'
          "
          :title="`${todayXp} of ${settings.dailyGoal} XP today`"
        >
          <UiIcon name="target" :size="14" />
          {{ todayXp }}<span class="text-ink-faint">/{{ settings.dailyGoal }}</span>
        </span>

        <button
          class="grid size-9 place-items-center rounded-lg text-ink-dim transition-colors hover:bg-panel-2 hover:text-ink"
          :aria-label="settings.theme === 'dark' ? 'Switch to light' : 'Switch to dark'"
          @click="toggleTheme"
        >
          <UiIcon :name="settings.theme === 'dark' ? 'sun' : 'moon'" :size="18" />
        </button>
      </div>
    </div>
  </header>
</template>
