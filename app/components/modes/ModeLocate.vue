<script setup lang="ts">
/**
 * Paired-associate recall: the words and their address, in both directions.
 * Knowing a rule without being able to cite it is only half the job.
 *
 * Distractors come from the same article wherever possible — telling §7 from
 * §8 is the discrimination that matters, not telling Article III from XIV.
 */
import type { TaskResult, Unit } from '~/types'
import { UNITS, articleById } from '~/data/corpus'

const props = defineProps<{ unit: Unit; intensity: number }>()
const emit = defineEmits<{ graded: [TaskResult] }>()

type Direction = 'whereFrom' | 'whatSays'

const direction = ref<Direction>('whereFrom')
const options = ref<Unit[]>([])
const picked = ref<Unit | null>(null)

function deal() {
  direction.value = Math.random() < 0.55 ? 'whereFrom' : 'whatSays'
  picked.value = null

  const siblings = (articleById(props.unit.articleId)?.units ?? []).filter(
    candidate => candidate.id !== props.unit.id,
  )
  const distractors = sample(siblings, 3)

  if (distractors.length < 3) {
    const elsewhere = UNITS.filter(
      candidate =>
        candidate.id !== props.unit.id && !distractors.some(d => d.id === candidate.id),
    )
    distractors.push(...sample(elsewhere, 3 - distractors.length))
  }

  options.value = shuffle([props.unit, ...distractors])
}

watch(() => props.unit.id, deal, { immediate: true })

const correct = computed(() => picked.value?.id === props.unit.id)

function choose(option: Unit) {
  if (picked.value) return
  picked.value = option

  const hit = option.id === props.unit.id
  // Recognition earns a "good" at best — it is an easier ask than producing it.
  emit('graded', { accuracy: hit ? 1 : 0, grade: hit ? 2 : 0 })
}

/** Only ever shows the article and section, never the topic — that'd give it away. */
const labelFor = (option: Unit) =>
  direction.value === 'whereFrom' ? option.cite : snippet(option.text, 16)

defineExpose({
  actionLabel: 'Choose',
  canCheck: false,
  check: () => {},
  hideAction: true,
})
</script>

<template>
  <div class="space-y-4">
    <p class="text-sm text-ink-dim">
      {{
        direction === 'whereFrom'
          ? 'Which provision is this?'
          : 'Which of these is the provision?'
      }}
    </p>

    <!-- The prompt. -->
    <ProvisionPaper v-if="direction === 'whereFrom'" :unit="unit" :show-cite="false">
      {{ unit.text }}
    </ProvisionPaper>

    <UiCard v-else pad="lg" class="text-center">
      <p class="stamp text-ink-faint">{{ unit.articleSubject || unit.articleTitle }}</p>
      <p class="mt-1 font-serif text-2xl font-semibold">{{ unit.cite }}</p>
      <p v-if="unit.topic" class="mt-1 text-sm text-ink-dim">{{ unit.topic }}</p>
    </UiCard>

    <!-- The four answers. -->
    <ul class="grid gap-2">
      <li v-for="option in options" :key="option.id">
        <button
          class="w-full rounded-xl border p-3 text-left transition-[border-color,background,transform] active:translate-y-px"
          :class="[
            !picked && 'border-line bg-panel hover:border-accent/50 hover:bg-panel-2',
            picked && option.id === unit.id && 'border-good/50 bg-good/10',
            picked && option.id === picked.id && option.id !== unit.id && 'border-bad/50 bg-bad/10',
            picked && option.id !== unit.id && option.id !== picked.id && 'border-line opacity-50',
          ]"
          :disabled="!!picked"
          @click="choose(option)"
        >
          <span
            class="block"
            :class="
              direction === 'whereFrom'
                ? 'font-serif text-base font-semibold'
                : 'font-serif text-[15px] leading-snug'
            "
          >
            {{ labelFor(option) }}
          </span>
          <span
            v-if="direction === 'whereFrom' && option.topic"
            class="mt-0.5 block text-xs text-ink-faint"
          >
            {{ option.topic }}
          </span>
        </button>
      </li>
    </ul>

    <p v-if="picked" class="animate-rise text-sm font-semibold" :class="correct ? 'text-good' : 'text-bad'">
      {{ correct ? 'Correct.' : `That was ${picked.cite}. This one is ${unit.cite}.` }}
    </p>
  </div>
</template>
