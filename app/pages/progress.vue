<script setup lang="ts">
/** Where you stand, and the few knobs worth having. */
import { ARTICLES } from '~/data/corpus'

useHead({ title: 'Progress — ProVision' })

const { settings, resetSettings } = useSettings()
const { overall, streak, todayXp, recentHistory, articleStats, resetProgress } = useProgress()

const history = computed(() => recentHistory(28))
const peak = computed(() => Math.max(settings.dailyGoal, ...history.value.map(day => day.xp)))

const ranked = computed(() =>
  ARTICLES.map(article => ({ article, stats: articleStats.value[article.id]! })).sort(
    (a, b) => b.stats.percent - a.stats.percent,
  ),
)

const confirmingReset = ref(false)

function wipe() {
  resetProgress()
  resetSettings()
  confirmingReset.value = false
}

const GOALS = [30, 60, 100, 150]
const LENGTHS = [5, 8, 12, 20]
</script>

<template>
  <div class="space-y-6">
    <header>
      <h1 class="font-serif text-2xl font-bold sm:text-3xl">Progress</h1>
      <p class="mt-1 text-sm text-ink-dim">Everything here is stored on this device only.</p>
    </header>

    <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <UiCard pad="sm" class="text-center">
        <p class="text-2xl font-bold text-accent tabular-nums">{{ overall.byHeart }}</p>
        <p class="stamp text-ink-faint">By heart</p>
      </UiCard>
      <UiCard pad="sm" class="text-center">
        <p class="text-2xl font-bold tabular-nums">{{ overall.touched }}</p>
        <p class="stamp text-ink-faint">Started</p>
      </UiCard>
      <UiCard pad="sm" class="text-center">
        <p class="text-2xl font-bold text-brass-700 tabular-nums dark:text-brass-400">
          {{ streak }}
        </p>
        <p class="stamp text-ink-faint">Day streak</p>
      </UiCard>
      <UiCard pad="sm" class="text-center">
        <p class="text-2xl font-bold tabular-nums">{{ overall.xp.toLocaleString() }}</p>
        <p class="stamp text-ink-faint">Total XP</p>
      </UiCard>
    </div>

    <!-- Four weeks of activity. -->
    <UiCard>
      <div class="mb-3 flex items-baseline justify-between">
        <h2 class="text-sm font-semibold">Last four weeks</h2>
        <span class="stamp text-ink-faint">{{ todayXp }} XP today</span>
      </div>

      <div class="flex h-24 items-end gap-[3px]">
        <div
          v-for="day in history"
          :key="day.date"
          class="group relative flex-1 rounded-t-[3px] transition-colors"
          :class="day.xp >= settings.dailyGoal ? 'bg-good' : day.xp ? 'bg-accent' : 'bg-line'"
          :style="{ height: `${Math.max(3, (day.xp / peak) * 100)}%` }"
          :title="`${day.date}: ${day.xp} XP`"
        />
      </div>
      <p class="stamp mt-2 flex justify-between text-ink-faint">
        <span>4 weeks ago</span>
        <span>Today</span>
      </p>
    </UiCard>

    <!-- Where the work has gone. -->
    <section>
      <h2 class="stamp mb-2 text-ink-faint">By article</h2>
      <ul class="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-panel">
        <li v-for="entry in ranked" :key="entry.article.id">
          <NuxtLink
            :to="`/article/${entry.article.id}`"
            class="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-panel-2"
          >
            <span class="stamp w-10 shrink-0 text-accent">{{ entry.article.numeral || '¶' }}</span>
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-medium">
                {{ entry.article.subject || entry.article.title }}
              </span>
              <UiProgressBar
                :value="entry.stats.percent"
                :tone="entry.stats.percent === 1 ? 'good' : 'accent'"
                class="mt-1.5"
              />
            </span>
            <span class="stamp w-16 shrink-0 text-right tabular-nums text-ink-faint">
              {{ entry.stats.byHeart }}/{{ entry.stats.total }}
            </span>
          </NuxtLink>
        </li>
      </ul>
    </section>

    <!-- Settings -->
    <section class="space-y-3">
      <h2 class="stamp text-ink-faint">Settings</h2>

      <UiCard>
        <p class="text-sm font-semibold">Daily goal</p>
        <p class="mb-2 text-xs text-ink-dim">Experience to earn before the streak counts.</p>
        <div class="inline-flex overflow-hidden rounded-lg border border-line">
          <button
            v-for="goal in GOALS"
            :key="goal"
            class="min-h-9 px-3.5 text-xs font-semibold transition-colors"
            :class="settings.dailyGoal === goal ? 'bg-accent text-white' : 'text-ink-dim hover:bg-panel-2'"
            @click="settings.dailyGoal = goal"
          >
            {{ goal }}
          </button>
        </div>
      </UiCard>

      <UiCard>
        <p class="text-sm font-semibold">Session length</p>
        <p class="mb-2 text-xs text-ink-dim">Provisions per drill.</p>
        <div class="inline-flex overflow-hidden rounded-lg border border-line">
          <button
            v-for="length in LENGTHS"
            :key="length"
            class="min-h-9 px-3.5 text-xs font-semibold transition-colors"
            :class="settings.sessionLength === length ? 'bg-accent text-white' : 'text-ink-dim hover:bg-panel-2'"
            @click="settings.sessionLength = length"
          >
            {{ length }}
          </button>
        </div>
      </UiCard>

      <UiCard>
        <label class="flex cursor-pointer items-start gap-3">
          <input
            v-model="settings.keyWordsFirst"
            type="checkbox"
            class="mt-0.5 size-4 accent-[var(--c-accent)]"
          />
          <span>
            <span class="block text-sm font-semibold">Remove key words first</span>
            <span class="block text-xs text-ink-dim">
              At low percentages, blank the words that carry the rule rather than the grammar.
            </span>
          </span>
        </label>

        <label class="mt-4 flex cursor-pointer items-start gap-3">
          <input
            v-model="settings.hideWordLengths"
            type="checkbox"
            class="mt-0.5 size-4 accent-[var(--c-accent)]"
          />
          <span>
            <span class="block text-sm font-semibold">Hide word lengths</span>
            <span class="block text-xs text-ink-dim">
              Equal-width blanks, so the size of the gap stops being a free clue.
            </span>
          </span>
        </label>
      </UiCard>

      <UiCard>
        <p class="text-sm font-semibold">Start over</p>
        <p class="mb-3 text-xs text-ink-dim">
          Erases every card, streak and setting on this device. There is no undo.
        </p>
        <div v-if="!confirmingReset">
          <UiButton variant="danger" size="sm" icon="trash" @click="confirmingReset = true">
            Erase all progress
          </UiButton>
        </div>
        <div v-else class="flex gap-2">
          <UiButton variant="danger" size="sm" @click="wipe">Yes, erase everything</UiButton>
          <UiButton size="sm" @click="confirmingReset = false">Cancel</UiButton>
        </div>
      </UiCard>
    </section>

    <AppAbout />
  </div>
</template>
