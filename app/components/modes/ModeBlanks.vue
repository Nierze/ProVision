<script setup lang="ts">
/**
 * Cued recall. Words are taken out of the provision and you put them back.
 * A near miss (one or two letters) is called out separately from a wrong
 * answer, because they mean different things about what you know.
 */
import type { TaskResult, Unit } from '~/types'

const props = defineProps<{ unit: Unit; intensity: number; peeking?: boolean }>()
const emit = defineEmits<{ graded: [TaskResult] }>()

const { settings } = useSettings()

type SlotState = 'idle' | 'correct' | 'near' | 'wrong'

interface Blank {
  index: number
  word: string
  value: string
  state: SlotState
  /** Letters given away. A hinted blank is only worth half. */
  hint: number
}

const RATIOS = [
  { value: 0.25, label: '25%' },
  { value: 0.5, label: '50%' },
  { value: 0.75, label: '75%' },
  { value: 1, label: 'All' },
] as const

const tokens = computed(() => tokenise(props.unit.text))
const ratio = ref(nearestRatio(0.25 + props.intensity * 0.6))
/** Every word gone, and the lead/trail punctuation and length cues gone with it. */
const blind = ref(false)
const blanks = ref<Blank[]>([])
const graded = ref(false)

const paper = useTemplateRef<HTMLElement>('paper')

const blankAt = computed(() => new Map(blanks.value.map(blank => [blank.index, blank])))
const effectiveRatio = computed(() => (blind.value ? 1 : ratio.value))
/** Lead/trail punctuation is a scaffold too — hide it while writing blind. */
const showPunctuation = computed(() => graded.value || !blind.value)

function nearestRatio(wanted: number) {
  return RATIOS.reduce((best, option) =>
    Math.abs(option.value - wanted) < Math.abs(best.value - wanted) ? option : best,
  ).value
}

function deal() {
  const chosen = pickBlanks(tokens.value, effectiveRatio.value, settings.keyWordsFirst)
  blanks.value = [...chosen]
    .sort((a, b) => a - b)
    .map(index => ({ index, word: tokens.value[index]!.word, value: '', state: 'idle', hint: 0 }))
  graded.value = false
}

watch(() => [props.unit.id, effectiveRatio.value], deal, { immediate: true })

/* ------------------------------------------------------------------ */
/* Scoring                                                             */
/* ------------------------------------------------------------------ */

const canCheck = computed(() => !graded.value && blanks.value.some(blank => blank.value.trim()))

function check() {
  if (graded.value) return

  let score = 0
  for (const blank of blanks.value) {
    blank.state = judge(blank.value, blank.word)
    if (blank.state === 'correct') score += blank.hint ? 0.5 : 1
    else if (blank.state === 'near') score += 0.5
  }

  graded.value = true
  const accuracy = blanks.value.length ? score / blanks.value.length : 0
  emit('graded', { accuracy, grade: gradeFromAccuracy(accuracy) })
}

/** Reveal one more letter of the blank you are standing on. Not while writing blind. */
function hint() {
  const blank = focused() ?? blanks.value.find(b => b.state === 'idle' && !b.value)
  if (!blank || graded.value || blind.value) return

  blank.hint = Math.min(blank.hint + 1, blank.word.length)
  blank.value = blank.word.slice(0, blank.hint)

  nextTick(() => {
    const input = inputFor(blank.index)
    input?.focus()
    input?.setSelectionRange(input.value.length, input.value.length)
  })
}

const rightCount = computed(() => blanks.value.filter(b => b.state === 'correct').length)
const nearCount = computed(() => blanks.value.filter(b => b.state === 'near').length)

/* ------------------------------------------------------------------ */
/* Moving between blanks                                               */
/* ------------------------------------------------------------------ */

const inputs = () =>
  [...(paper.value?.querySelectorAll<HTMLInputElement>('input[data-blank]') ?? [])]

const inputFor = (index: number) =>
  paper.value?.querySelector<HTMLInputElement>(`input[data-blank="${index}"]`) ?? null

function focused(): Blank | undefined {
  const active = document.activeElement as HTMLInputElement | null
  const index = active?.dataset?.blank
  return index == null ? undefined : blankAt.value.get(Number(index))
}

function step(from: EventTarget | null, direction: 1 | -1) {
  const list = inputs()
  const at = list.indexOf(from as HTMLInputElement)
  list[at + direction]?.focus()
}

function onKeydown(event: KeyboardEvent) {
  const input = event.target as HTMLInputElement

  if (event.key === ' ') {
    event.preventDefault()
    step(input, 1)
    return
  }
  if (event.key === 'Enter') {
    event.preventDefault()
    const list = inputs()
    if (list.indexOf(input) === list.length - 1) check()
    else step(input, 1)
    return
  }
  // Nothing left to delete here — hop back and keep deleting from there.
  if (event.key === 'Backspace' && !input.value) {
    const list = inputs()
    const prev = list[list.indexOf(input) - 1]
    if (prev) {
      event.preventDefault()
      prev.focus()
      prev.setSelectionRange(prev.value.length, prev.value.length)
    }
    return
  }
  // Arrows only leave the field once the caret is already at the edge.
  if (event.key === 'ArrowLeft' && input.selectionStart === 0) {
    event.preventDefault()
    step(input, -1)
  }
  if (event.key === 'ArrowRight' && input.selectionEnd === input.value.length) {
    event.preventDefault()
    step(input, 1)
  }
}

const widthFor = (blank: Blank) =>
  `${settings.hideWordLengths || blind.value ? 7 : Math.max(blank.word.length, 3) + 1}ch`

/** Same blanks, cleared, so a poor attempt can be tried again. */
function retry() {
  for (const blank of blanks.value) {
    blank.value = ''
    blank.state = 'idle'
    blank.hint = 0
  }
  graded.value = false
}

defineExpose({ actionLabel: 'Check', canCheck, check, hideAction: false, retry })
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="flex flex-wrap items-center gap-2">
        <div class="inline-flex overflow-hidden rounded-lg border border-line" role="group" aria-label="Words removed">
          <button
            v-for="option in RATIOS"
            :key="option.value"
            class="min-h-9 px-3 text-xs font-semibold transition-colors"
            :class="
              !blind && ratio === option.value
                ? 'bg-accent text-white'
                : 'text-ink-dim hover:bg-panel-2 hover:text-ink'
            "
            :disabled="graded"
            @click="ratio = option.value; blind = false"
          >
            {{ option.label }}
          </button>
        </div>

        <button
          class="min-h-9 rounded-lg border px-3 text-xs font-semibold transition-colors"
          :class="
            blind
              ? 'border-accent bg-accent text-white'
              : 'border-line text-ink-dim hover:bg-panel-2 hover:text-ink'
          "
          :disabled="graded"
          :aria-pressed="blind"
          @click="blind = !blind"
        >
          Blind
        </button>
      </div>

      <div class="flex gap-2">
        <UiButton size="sm" icon="shuffle" :disabled="graded" @click="deal">New blanks</UiButton>
        <UiButton size="sm" icon="hint" :disabled="graded || blind" @click="hint">Hint</UiButton>
      </div>
    </div>

    <div ref="paper">
      <ProvisionPaper :unit="unit" loose>
        <template v-for="(token, i) in tokens" :key="i">
          <span v-if="blankAt.get(i)" class="relative inline-block whitespace-nowrap">
            <!-- Sits above the blank rather than replacing it, so a peek costs
                 neither what you have typed nor where the caret was. -->
            <span
              v-if="peeking && !graded"
              class="pointer-events-none absolute inset-x-0 bottom-full text-center text-[0.72em] leading-tight font-semibold text-royal-700"
              >{{ token.word }}</span
            >

            <template v-if="token.lead && showPunctuation">{{ token.lead }}</template>

            <!-- Solved words settle back into the sentence as plain text. -->
            <span
              v-if="graded && blankAt.get(i)!.state === 'correct'"
              class="animate-settle font-semibold text-royal-700"
            >{{ token.word }}</span>

            <span v-else-if="graded" class="inline-flex flex-col items-center leading-none">
              <s class="text-[0.8em] text-mark-bad opacity-70">{{
                blankAt.get(i)!.value || '—'
              }}</s>
              <span
                class="font-semibold"
                :class="blankAt.get(i)!.state === 'near' ? 'text-mark-near' : 'text-royal-700'"
                >{{ token.word }}</span
              >
            </span>

            <input
              v-else
              :data-blank="i"
              :value="blankAt.get(i)!.value"
              type="text"
              autocomplete="off"
              autocapitalize="off"
              spellcheck="false"
              aria-label="missing word"
              class="border-0 border-b-[1.5px] border-parchment-dim bg-transparent px-[0.1em] text-center text-royal-700 caret-royal-700 outline-none transition-colors focus:border-royal-600 focus:bg-royal-600/8"
              :style="{ width: widthFor(blankAt.get(i)!) }"
              @input="blankAt.get(i)!.value = ($event.target as HTMLInputElement).value"
              @keydown="onKeydown"
            />

            <template v-if="token.trail && showPunctuation">{{ token.trail }}</template>
          </span>

          <template v-else>{{ token.lead + token.word + token.trail }}</template>
          {{ ' ' }}
        </template>
      </ProvisionPaper>
    </div>

    <p v-if="graded" class="animate-rise text-sm font-medium">
      <span :class="rightCount === blanks.length ? 'text-good' : 'text-ink-dim'">
        {{ rightCount }} of {{ blanks.length }} restored<span v-if="nearCount">
          · {{ nearCount }} off by a letter or two</span
        >.
      </span>
    </p>
  </div>
</template>
