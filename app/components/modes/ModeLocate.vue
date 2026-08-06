<script setup lang="ts">
/**
 * Paired-associate recall in one direction only: here are the words, name the
 * address. Knowing a rule without being able to cite it is only half the job.
 *
 * The reverse — showing a citation and picking its text out of a list — was
 * dropped deliberately. It is a much easier ask, and reading four provisions
 * to find the familiar one trains recognition rather than recall.
 *
 * Distractors come from the same article wherever possible — telling §7 from
 * §8 is the discrimination that matters, not telling Article III from XIV.
 */
import type { TaskResult, Unit } from '~/types'
import { UNITS, articleById } from '~/data/corpus'

const props = defineProps<{ unit: Unit; intensity: number }>()
const emit = defineEmits<{ graded: [TaskResult] }>()

const options = ref<Unit[]>([])
const picked = ref<Unit | null>(null)

function deal() {
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

/**
 * The options carry bare citations so they don't name the answer, which leaves
 * a wrong pick saying nothing on its own — "Section 27" teaches you nothing
 * about what you mistook this for. Name it once the answer is in.
 *
 * Only a fifth of the Constitution has a curated topic, so everywhere else the
 * provision's own opening words stand in as its name.
 */
const verdict = computed(() => {
  const wrong = picked.value
  if (!wrong) return ''
  if (correct.value) return 'Correct.'
  const named = wrong.topic || snippet(wrong.text, 9)
  const stop = /[.…!?]$/.test(named) ? '' : '.'
  return `That was ${wrong.cite} — ${named}${stop} This one is ${props.unit.cite}.`
})

function choose(option: Unit) {
  if (picked.value) return
  picked.value = option

  const hit = option.id === props.unit.id
  // Recognition earns a "good" at best — it is an easier ask than producing it.
  emit('graded', { accuracy: hit ? 1 : 0, grade: hit ? 2 : 0 })
}

/** Same question, same options — just clear the pick so it can be answered again. */
function retry() {
  picked.value = null
}

defineExpose({
  actionLabel: 'Choose',
  canCheck: false,
  check: () => {},
  hideAction: true,
  retry,
})
</script>

<template>
  <div class="space-y-4">
    <p class="text-sm text-ink-dim">Which provision is this?</p>

    <!-- The words. The answer is its address. -->
    <ProvisionPaper :unit="unit" :show-cite="false">
      {{ unit.text }}
    </ProvisionPaper>

    <!-- The four answers. -->
    <ul class="grid grid-cols-1 gap-2">
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
          <span class="block font-serif text-base font-semibold">{{ option.cite }}</span>
        </button>
      </li>
    </ul>

    <p v-if="picked" class="animate-rise text-sm font-semibold" :class="correct ? 'text-good' : 'text-bad'">
      {{ verdict }}
    </p>
  </div>
</template>
