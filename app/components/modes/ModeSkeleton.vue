<script setup lang="ts">
/**
 * Progressive fading — the method people actually use to learn a passage word
 * for word. The scaffolding comes away in three stages: the full text, then
 * first letters only, then nothing but the citation.
 *
 * Grading is honest self-assessment. No machine can tell whether you said it
 * out loud correctly, and pretending otherwise would make the schedule lie.
 */
import type { Grade, TaskResult, Unit } from '~/types'

const props = defineProps<{ unit: Unit; intensity: number; peeking?: boolean }>()
const emit = defineEmits<{ graded: [TaskResult] }>()

type Stage = 'read' | 'initials' | 'blind'

const STAGES = [
  { id: 'read', label: 'Read', hint: 'Read it through twice, out loud if you can.' },
  { id: 'initials', label: 'Initials', hint: 'Every word is down to its first letter. Recite the rest.' },
  { id: 'blind', label: 'Blind', hint: 'Nothing but the citation. Recite the whole provision.' },
] as const

/** Self-assessment, and the accuracy each answer implies for the schedule. */
const VERDICTS = [
  { grade: 0, label: 'Again', note: 'Lost it', accuracy: 0.2, tone: 'text-bad border-bad/40' },
  { grade: 1, label: 'Hard', note: 'Halting', accuracy: 0.65, tone: 'text-near border-near/40' },
  { grade: 2, label: 'Good', note: 'Got it', accuracy: 0.9, tone: 'text-good border-good/40' },
  { grade: 3, label: 'Easy', note: 'Word perfect', accuracy: 1, tone: 'text-accent border-accent/40' },
] as const

const stage = ref<Stage>(props.intensity < 0.4 ? 'read' : props.intensity < 0.78 ? 'initials' : 'blind')
const revealed = ref(false)
const graded = ref(false)

const tokens = computed(() => tokenise(props.unit.text))
const { supported: canSpeak, speaking, toggle: toggleSpeech, stop: stopSpeech } = useSpeech()

watch(
  () => props.unit.id,
  () => {
    revealed.value = false
    graded.value = false
    stopSpeech()
  },
)

const currentHint = computed(() => STAGES.find(s => s.id === stage.value)!.hint)

/** Roughly how wide the hidden word was — a legitimate memory cue. */
const widthFor = (word: string) => `${Math.max(0.8, word.length * 0.42)}em`

function reveal() {
  revealed.value = true
  stopSpeech()
}

function selfGrade(grade: Grade, accuracy: number) {
  if (graded.value) return
  graded.value = true
  emit('graded', { accuracy, grade })
}

function retry() {
  revealed.value = false
  graded.value = false
  stopSpeech()
}

defineExpose({
  actionLabel: 'Reveal',
  canCheck: computed(() => !revealed.value),
  check: reveal,
  // Once revealed the learner grades themselves, so the shell's button steps aside.
  hideAction: computed(() => revealed.value && !graded.value),
  retry,
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="inline-flex overflow-hidden rounded-lg border border-line" role="group" aria-label="Scaffolding">
        <button
          v-for="option in STAGES"
          :key="option.id"
          class="min-h-9 px-3 text-xs font-semibold transition-colors"
          :class="
            stage === option.id
              ? 'bg-accent text-white'
              : 'text-ink-dim hover:bg-panel-2 hover:text-ink'
          "
          :disabled="revealed"
          @click="stage = option.id"
        >
          {{ option.label }}
        </button>
      </div>

      <UiButton
        v-if="canSpeak"
        size="sm"
        icon="speaker"
        :variant="speaking ? 'primary' : 'secondary'"
        @click="toggleSpeech(unit.text)"
      >
        {{ speaking ? 'Stop' : 'Listen' }}
      </UiButton>
    </div>

    <p class="text-sm text-ink-dim">{{ revealed ? 'How did that go?' : currentHint }}</p>

    <!-- Before the reveal: the passage at the chosen level of scaffolding. -->
    <ProvisionPaper v-if="!revealed" :unit="unit" :loose="!peeking && stage === 'initials'">
      <!-- A peek collapses whatever scaffolding is in force back to the full text. -->
      <template v-if="peeking || stage === 'read'">{{ unit.text }}</template>

      <template v-else-if="stage === 'initials'">
        <span v-for="(token, i) in tokens" :key="i" class="inline-block whitespace-nowrap">
          <span>{{ token.lead }}</span>
          <span
            class="inline-block border-b border-parchment-dim/40 text-center font-semibold text-royal-700"
            :style="{ minWidth: widthFor(token.word) }"
            >{{ initialsOf(token.word) }}</span
          >
          <span>{{ token.trail }}</span>
          {{ ' ' }}
        </span>
      </template>

      <template v-else>
        <span class="block py-6 text-center font-serif text-parchment-dim italic">
          Recite {{ unit.cite }} from memory.
        </span>
      </template>
    </ProvisionPaper>

    <!-- After: the real thing, to check yourself against. -->
    <ProvisionPaper v-else :unit="unit" class="animate-rise">{{ unit.text }}</ProvisionPaper>

    <div v-if="revealed && !graded" class="animate-rise grid grid-cols-2 gap-2 sm:grid-cols-4">
      <button
        v-for="verdict in VERDICTS"
        :key="verdict.grade"
        class="flex min-h-16 flex-col items-center justify-center rounded-xl border bg-panel transition-[background,transform] hover:bg-panel-2 active:translate-y-px"
        :class="verdict.tone"
        @click="selfGrade(verdict.grade, verdict.accuracy)"
      >
        <span class="text-sm font-bold">{{ verdict.label }}</span>
        <span class="text-[11px] text-ink-faint">{{ verdict.note }}</span>
      </button>
    </div>
  </div>
</template>
