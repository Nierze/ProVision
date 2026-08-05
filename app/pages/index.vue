<script setup lang="ts">
/** Today: one obvious thing to do, then the ways to do something else. */
import { ARTICLES, TOTAL_UNITS } from '~/data/corpus'
import { AUTHOR } from '~/data/author'

useHead({ title: 'Today — ProVision' })

const { settings } = useSettings()
const { overall, todayXp, streak, articleStats, freshUnits } = useProgress()

const goalProgress = computed(() => todayXp.value / settings.dailyGoal)
const goalMet = computed(() => goalProgress.value >= 1)

/** The article you are furthest into but haven't finished. */
const inProgress = computed(() =>
  ARTICLES.map(article => ({ article, stats: articleStats.value[article.id]! }))
    .filter(entry => entry.stats.touched > 0 && entry.stats.percent < 1)
    .sort((a, b) => b.stats.percent - a.stats.percent)
    .slice(0, 3),
)

const nextUp = computed(() => freshUnits.value[0])

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
})
</script>

<template>
  <div class="space-y-6">
    <!-- The one thing to do now -->
    <section
      class="engraved animate-rise relative overflow-hidden rounded-[var(--radius-page)] border border-line bg-panel p-5 sm:p-6"
    >
      <div
        aria-hidden="true"
        class="pointer-events-none absolute -top-20 -right-16 size-64 rounded-full opacity-70 blur-3xl"
        style="background: radial-gradient(circle, var(--c-accent-soft), transparent 70%)"
      />
      <div
        aria-hidden="true"
        class="pointer-events-none absolute -bottom-20 -left-10 size-48 rounded-full opacity-30 blur-3xl"
        style="background: radial-gradient(circle, var(--color-brass-200), transparent 72%)"
      />

      <div class="relative">
        <p class="stamp text-ink-faint">{{ greeting }}</p>
        <h1 class="mt-1 font-serif text-2xl font-bold sm:text-3xl">
          {{ overall.due ? `${overall.due} provisions due` : 'Nothing overdue' }}
        </h1>
        <p class="mt-1 max-w-md text-sm text-ink-dim">
          {{
            overall.due
              ? 'These are the ones you are about to forget. Ten minutes now is worth an hour later.'
              : 'The schedule is clear. Learn something new, or drill what you already know.'
          }}
        </p>

        <div class="mt-4 flex flex-col gap-2 sm:flex-row">
          <UiButton
            to="/drill?scope=review&mode=mixed"
            variant="primary"
            size="lg"
            icon="review"
            class="sm:min-w-52"
          >
            {{ overall.due ? 'Start review' : 'Study something new' }}
          </UiButton>
          <UiButton to="/drill?scope=all&mode=mixed" size="lg" icon="shuffle">
            Mixed drill
          </UiButton>
        </div>

        <!-- Today's standing, folded in rather than given its own card. -->
        <div class="mt-5 border-t border-line pt-4">
          <div class="mb-2 flex items-baseline justify-between gap-3">
            <span class="flex items-center gap-1.5 text-xs font-semibold text-ink-dim">
              <UiIcon name="target" :size="14" :class="goalMet ? 'text-good' : 'text-accent'" />
              Daily goal
            </span>
            <span
              class="text-xs font-medium tabular-nums"
              :class="goalMet ? 'text-good' : 'text-ink-dim'"
            >
              {{ todayXp }} / {{ settings.dailyGoal }} XP
            </span>
          </div>
          <UiProgressBar :value="goalProgress" :tone="goalMet ? 'good' : 'accent'" thick />
          <p
            v-if="streak"
            class="mt-2 flex items-center gap-1.5 text-xs font-medium text-brass-700 dark:text-brass-400"
          >
            <UiIcon name="flame" :size="13" />
            {{ streak }} day{{ streak === 1 ? '' : 's' }} in a row
          </p>
        </div>
      </div>
    </section>

    <!-- Pick a drill -->
    <section class="animate-rise" style="animation-delay: 0.06s">
      <h2 class="stamp mb-2 text-ink-faint">Practise a particular way</h2>
      <ul class="grid gap-2 sm:grid-cols-2">
        <li v-for="drill in MODES" :key="drill.id">
          <UiCard :to="`/drill?scope=review&mode=${drill.id}`" pad="sm" class="group h-full">
            <div class="flex items-start gap-3">
              <span
                class="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent transition-transform duration-200 ease-[var(--ease-out-soft)] group-hover:scale-110"
              >
                <UiIcon :name="drill.icon" :size="18" />
              </span>
              <span class="min-w-0">
                <span class="block text-sm font-semibold">{{ drill.name }}</span>
                <span class="block text-xs text-ink-dim">{{ drill.tagline }}</span>
              </span>
            </div>
          </UiCard>
        </li>
      </ul>
    </section>

    <!-- Carry on -->
    <section v-if="inProgress.length" class="animate-rise" style="animation-delay: 0.12s">
      <h2 class="stamp mb-2 text-ink-faint">Carry on with</h2>
      <ul class="space-y-2">
        <li v-for="entry in inProgress" :key="entry.article.id">
          <UiCard :to="`/article/${entry.article.id}`" pad="sm">
            <div class="flex items-center gap-3">
              <span class="stamp w-11 shrink-0 text-center text-accent">
                {{ entry.article.numeral || '¶' }}
              </span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm font-semibold">
                  {{ entry.article.subject || entry.article.title }}
                </span>
                <UiProgressBar :value="entry.stats.percent" class="mt-1.5" />
              </span>
              <span class="stamp shrink-0 tabular-nums text-ink-faint">
                {{ Math.round(entry.stats.percent * 100) }}%
              </span>
            </div>
          </UiCard>
        </li>
      </ul>
    </section>

    <!-- Cold start -->
    <UiCard v-else-if="nextUp" pad="lg" class="animate-rise" style="animation-delay: 0.12s">
      <p class="stamp text-ink-faint">Start here</p>
      <h2 class="mt-1 font-serif text-xl font-semibold">{{ nextUp.cite }}</h2>
      <p class="mt-1 line-clamp-2 text-sm text-ink-dim">{{ snippet(nextUp.text, 22) }}</p>
      <UiButton
        :to="`/drill?scope=unit:${nextUp.id}&mode=mixed`"
        variant="primary"
        class="mt-3"
        icon-after="arrowRight"
      >
        Learn this provision
      </UiButton>
    </UiCard>

    <footer class="space-y-2 pt-2 text-center">
      <p class="text-xs text-ink-faint">
        {{ overall.touched }} of {{ TOTAL_UNITS }} provisions started ·
        {{ overall.byHeart }} known by heart
      </p>
      <p class="text-xs text-ink-faint">
        Made by
        <a
          :href="AUTHOR.links[0].href"
          target="_blank"
          rel="noopener noreferrer"
          class="font-medium text-ink-dim underline-offset-2 transition-colors hover:text-accent hover:underline"
        >
          {{ AUTHOR.name }}
        </a>
      </p>
    </footer>
  </div>
</template>
