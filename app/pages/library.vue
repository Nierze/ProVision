<script setup lang="ts">
/** The whole Constitution, article by article, with how far in you are. */
import { ARTICLES, TOTAL_UNITS, TOTAL_WORDS } from '~/data/corpus'

useHead({ title: 'Library — ProVision' })

const { articleStats, overall } = useProgress()

const query = ref('')

const visible = computed(() => {
  const needle = query.value.trim().toLowerCase()
  if (!needle) return ARTICLES
  return ARTICLES.filter(article =>
    `${article.title} ${article.subject} ${article.numeral}`.toLowerCase().includes(needle),
  )
})
</script>

<template>
  <div class="space-y-5">
    <header>
      <h1 class="font-serif text-2xl font-bold sm:text-3xl">The 1987 Constitution</h1>
      <p class="mt-1 text-sm text-ink-dim">
        Preamble and 18 articles · {{ TOTAL_UNITS }} provisions ·
        {{ TOTAL_WORDS.toLocaleString() }} words
      </p>
    </header>

    <UiCard pad="sm">
      <div class="mb-2 flex items-baseline justify-between text-sm">
        <span class="font-semibold">Overall</span>
        <span class="text-ink-dim tabular-nums">
          {{ overall.byHeart }} by heart · {{ overall.touched }} started
        </span>
      </div>
      <UiProgressBar :value="overall.touched / overall.total" thick />
    </UiCard>

    <label class="block">
      <span class="sr-only">Search articles</span>
      <input
        v-model="query"
        type="search"
        placeholder="Search articles…"
        class="w-full rounded-xl border border-line bg-panel px-4 py-3 text-sm outline-none transition-colors placeholder:text-ink-faint focus:border-accent/60"
      />
    </label>

    <ul class="grid gap-2 sm:grid-cols-2">
      <li v-for="article in visible" :key="article.id">
        <UiCard :to="`/article/${article.id}`" pad="sm" class="h-full">
          <div class="flex h-full items-start gap-3">
            <span
              class="grid size-11 shrink-0 place-items-center rounded-lg border border-line bg-panel-2 font-serif text-base font-bold text-accent"
            >
              {{ article.numeral || '¶' }}
            </span>

            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold">
                {{ article.subject || article.title }}
              </p>
              <p class="stamp text-ink-faint">
                {{ article.title }} · {{ article.units.length }} provisions
              </p>

              <div class="mt-2 flex items-center gap-2">
                <UiProgressBar
                  :value="articleStats[article.id]!.percent"
                  :tone="articleStats[article.id]!.percent === 1 ? 'good' : 'accent'"
                />
                <span
                  v-if="articleStats[article.id]!.due"
                  class="stamp shrink-0 rounded-full bg-accent-soft px-1.5 py-0.5 text-accent"
                >
                  {{ articleStats[article.id]!.due }} due
                </span>
              </div>
            </div>
          </div>
        </UiCard>
      </li>
    </ul>

    <p v-if="!visible.length" class="py-8 text-center text-sm text-ink-faint">
      No article matches “{{ query }}”.
    </p>
  </div>
</template>
