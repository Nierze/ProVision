<script setup lang="ts">
/** One article: read it, see where you stand, drill it. */
import type { Unit } from '~/types'
import { articleById } from '~/data/corpus'

const route = useRoute()
const article = computed(() => articleById(String(route.params.id)))

useHead(() => ({
  title: article.value ? `${article.value.title} — ProVision` : 'Not found — ProVision',
}))

const { statsFor, masteryFor, cardFor } = useProgress()
const { supported: canSpeak, speaking, toggle: toggleSpeech } = useSpeech()

const stats = computed(() => (article.value ? statsFor(article.value) : null))
const open = ref<string | null>(null)

/** Sub-headings such as "State Policies" only exist in some articles. */
const groups = computed(() => {
  const out: { subhead: string; units: Unit[] }[] = []
  for (const unit of article.value?.units ?? []) {
    const last = out.at(-1)
    if (last && last.subhead === unit.subhead) last.units.push(unit)
    else out.push({ subhead: unit.subhead, units: [unit] })
  }
  return out
})

const dueOn = (unit: Unit) => {
  const card = cardFor(unit.id)
  if (!card) return ''
  const days = daysBetween(todayISO(), card.due)
  if (days <= 0) return 'Due now'
  if (days === 1) return 'Tomorrow'
  if (days < 30) return `In ${days} days`
  return `In ${Math.round(days / 30)} months`
}
</script>

<template>
  <div v-if="article" class="space-y-5">
    <header>
      <NuxtLink
        to="/library"
        class="stamp inline-flex items-center gap-1 text-ink-faint transition-colors hover:text-ink"
      >
        <UiIcon name="arrowLeft" :size="14" /> Library
      </NuxtLink>

      <div class="mt-2 flex items-start gap-3">
        <span
          class="grid size-14 shrink-0 place-items-center rounded-xl border border-line bg-panel-2 font-serif text-xl font-bold text-accent"
        >
          {{ article.numeral || '¶' }}
        </span>
        <div class="min-w-0">
          <h1 class="font-serif text-2xl leading-tight font-bold sm:text-3xl">
            {{ article.subject || article.title }}
          </h1>
          <p class="stamp mt-1 text-ink-faint">
            {{ article.title }} · {{ article.units.length }} provisions ·
            {{ article.wordCount.toLocaleString() }} words
          </p>
        </div>
      </div>

      <div v-if="stats" class="mt-4 flex items-center gap-3">
        <UiProgressBar :value="stats.percent" :tone="stats.percent === 1 ? 'good' : 'accent'" thick />
        <span class="stamp shrink-0 tabular-nums text-ink-faint">
          {{ Math.round(stats.percent * 100) }}%
        </span>
      </div>
    </header>

    <div class="flex flex-col gap-2 sm:flex-row">
      <UiButton
        :to="`/drill?scope=article:${article.id}&mode=mixed`"
        variant="primary"
        size="lg"
        icon="review"
        class="sm:min-w-52"
      >
        Drill this article
      </UiButton>
      <UiButton
        v-if="canSpeak"
        size="lg"
        icon="speaker"
        @click="toggleSpeech(article.units.map(u => u.text).join(' '))"
      >
        {{ speaking ? 'Stop reading' : 'Read aloud' }}
      </UiButton>
    </div>

    <!-- Pick a single drill for the whole article. -->
    <div class="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
      <NuxtLink
        v-for="drill in MODES"
        :key="drill.id"
        :to="`/drill?scope=article:${article.id}&mode=${drill.id}`"
        class="flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-panel px-3 py-2 text-xs font-semibold text-ink-dim transition-colors hover:border-accent/50 hover:text-ink"
      >
        <UiIcon :name="drill.icon" :size="14" />
        {{ drill.name }}
      </NuxtLink>
    </div>

    <!-- The provisions themselves. -->
    <section v-for="group in groups" :key="group.subhead || 'main'">
      <h2 v-if="group.subhead" class="ornament stamp my-4">{{ group.subhead }}</h2>

      <ul class="space-y-2">
        <li v-for="unit in group.units" :key="unit.id">
          <UiCard pad="sm">
            <button
              class="flex w-full items-center gap-3 text-left"
              :aria-expanded="open === unit.id"
              @click="open = open === unit.id ? null : unit.id"
            >
              <span class="stamp w-12 shrink-0 text-accent">{{ unit.short }}</span>

              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm font-medium">
                  {{ unit.topic || snippet(unit.text, 8) }}
                </span>
                <span class="stamp block text-ink-faint">
                  {{ unit.wordCount }} words{{ dueOn(unit) ? ` · ${dueOn(unit)}` : '' }}
                </span>
              </span>

              <MasteryDots :level="masteryFor(unit.id)" />
              <UiIcon
                name="chevronDown"
                :size="16"
                class="shrink-0 text-ink-faint transition-transform"
                :class="open === unit.id && 'rotate-180'"
              />
            </button>

            <div v-if="open === unit.id" class="animate-rise mt-3 space-y-3">
              <ProvisionPaper :unit="unit" :show-cite="false">{{ unit.text }}</ProvisionPaper>
              <div class="flex flex-wrap gap-2">
                <UiButton
                  :to="`/drill?scope=unit:${unit.id}&mode=mixed`"
                  variant="primary"
                  size="sm"
                  icon-after="arrowRight"
                >
                  Learn this
                </UiButton>
                <UiButton
                  v-if="canSpeak"
                  size="sm"
                  icon="speaker"
                  @click="toggleSpeech(unit.text)"
                >
                  Listen
                </UiButton>
              </div>
            </div>
          </UiCard>
        </li>
      </ul>
    </section>
  </div>

  <div v-else class="grid place-items-center py-20 text-center">
    <div>
      <h1 class="font-serif text-2xl font-bold">No such article</h1>
      <UiButton to="/library" variant="primary" class="mt-4">Back to the library</UiButton>
    </div>
  </div>
</template>
