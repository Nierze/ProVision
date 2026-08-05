<script setup lang="ts">
import type { Task } from '~/types'

const props = defineProps<{ tasks: Task[]; xp: number; scope: string }>()
defineEmits<{ again: [] }>()

const { settings } = useSettings()
const { todayXp, streak, masteryFor } = useProgress()

const scored = computed(() => props.tasks.filter(task => task.result))

const accuracy = computed(() => {
  if (!scored.value.length) return 0
  const total = scored.value.reduce((sum, task) => sum + task.result!.accuracy, 0)
  return total / scored.value.length
})

const goalMet = computed(() => todayXp.value >= settings.dailyGoal)

const headline = computed(() => {
  const percent = accuracy.value
  if (percent >= 0.95) return 'Word for word.'
  if (percent >= 0.8) return 'Close to it.'
  if (percent >= 0.5) return 'Coming along.'
  return 'Worth another pass.'
})
</script>

<template>
  <div class="mx-auto w-full max-w-2xl space-y-5 px-4 py-8">
    <div class="text-center">
      <TheSeal :size="56" class="mx-auto" />
      <h1 class="mt-3 font-serif text-3xl font-bold">{{ headline }}</h1>
      <p class="mt-1 text-sm text-ink-dim">{{ describeScope(scope) }}</p>
    </div>

    <div class="grid grid-cols-3 gap-2">
      <UiCard pad="sm" class="text-center">
        <p class="text-2xl font-bold text-accent tabular-nums">+{{ xp }}</p>
        <p class="stamp text-ink-faint">Experience</p>
      </UiCard>
      <UiCard pad="sm" class="text-center">
        <p class="text-2xl font-bold tabular-nums">{{ Math.round(accuracy * 100) }}%</p>
        <p class="stamp text-ink-faint">Accuracy</p>
      </UiCard>
      <UiCard pad="sm" class="text-center">
        <p class="text-2xl font-bold tabular-nums">{{ scored.length }}</p>
        <p class="stamp text-ink-faint">Provisions</p>
      </UiCard>
    </div>

    <UiCard>
      <div class="mb-2 flex items-baseline justify-between text-sm">
        <span class="font-semibold">Today's goal</span>
        <span class="tabular-nums" :class="goalMet ? 'text-good' : 'text-ink-dim'">
          {{ todayXp }} / {{ settings.dailyGoal }} XP
        </span>
      </div>
      <UiProgressBar :value="todayXp / settings.dailyGoal" :tone="goalMet ? 'good' : 'accent'" thick />
      <p v-if="goalMet" class="mt-2 flex items-center gap-1.5 text-sm font-medium text-good">
        <UiIcon name="flame" :size="15" />
        Goal met — {{ streak }}-day streak.
      </p>
    </UiCard>

    <section>
      <h2 class="stamp mb-2 text-ink-faint">What you covered</h2>
      <ul class="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-panel">
        <li
          v-for="(task, i) in scored"
          :key="`${task.unit.id}-${i}`"
          class="flex items-center gap-3 px-3 py-2.5"
        >
          <span class="stamp w-14 shrink-0 text-ink-faint">{{ task.unit.short }}</span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-sm font-medium">
              {{ task.unit.topic || snippet(task.unit.text, 7) }}
            </span>
            <span class="block truncate text-xs text-ink-faint">
              {{ task.unit.articleTitle }} · {{ modeInfo(task.mode).name }}
            </span>
          </span>
          <MasteryDots :level="masteryFor(task.unit.id)" />
          <span
            class="w-11 shrink-0 text-right text-sm font-semibold tabular-nums"
            :class="
              task.result!.accuracy >= 0.85
                ? 'text-good'
                : task.result!.accuracy >= 0.6
                  ? 'text-near'
                  : 'text-bad'
            "
          >
            {{ Math.round(task.result!.accuracy * 100) }}%
          </span>
        </li>
      </ul>
    </section>

    <div class="flex flex-col gap-2 sm:flex-row">
      <UiButton variant="primary" size="lg" block icon="review" @click="$emit('again')">
        Another round
      </UiButton>
      <UiButton to="/" size="lg" block>Done for now</UiButton>
    </div>
  </div>
</template>
