<script setup lang="ts">
/**
 * Serial recall. The provision is cut at its clause boundaries, the tiles are
 * shuffled, and you rebuild the sentence in order.
 *
 * Tap to place, tap to take back — no dragging. Dragging is fiddly on a phone
 * and impossible with a keyboard, and this is meant to be usable on a commute.
 */
import type { TaskResult, Unit } from '~/types'

const props = defineProps<{ unit: Unit; intensity: number }>()
const emit = defineEmits<{ graded: [TaskResult] }>()

const { settings } = useSettings()

/**
 * How finely to cut the provision — the longest a tile may run, in words.
 * Smaller tiles mean more of them and fewer words of context inside each, so
 * the sequence has to come from memory rather than from reading the piece.
 */
const GRAINS = [
  { value: 14, label: 'Clauses' },
  { value: 9, label: 'Phrases' },
  { value: 5, label: 'Fragments' },
  /** Below `chunkForOrdering`'s own floor, so it gets a dedicated word splitter instead. */
  { value: 1, label: 'Words' },
] as const

// Once the learner has picked a piece size, it follows them section to
// section instead of resetting to whatever mastery would have chosen.
const grain = ref(settings.orderGrain ?? nearestGrain(14 - props.intensity * 9))

function setGrain(value: number) {
  grain.value = value
  settings.orderGrain = value
}

/** The tiles in their true order. Index doubles as the answer key. */
const chunks = computed(() =>
  grain.value === 1 ? chunkByWord(props.unit.text) : chunkForOrdering(props.unit.text, grain.value),
)

const bank = ref<number[]>([])
const tray = ref<number[]>([])
const graded = ref(false)
const announcement = ref('')

function nearestGrain(wanted: number) {
  return GRAINS.reduce((best, option) =>
    Math.abs(option.value - wanted) < Math.abs(best.value - wanted) ? option : best,
  ).value
}

function deal() {
  bank.value = shuffle(chunks.value.map((_, i) => i))
  tray.value = []
  graded.value = false
}

// A new unit or a new grain is a fresh puzzle either way, so it always deals
// (and therefore always reshuffles) rather than reusing whatever order the
// last grain happened to leave the bank in.
watch(() => [props.unit.id, grain.value], deal, { immediate: true })

/** Reshuffle the pieces still waiting, without disturbing what's already placed. */
function shuffleBank() {
  if (graded.value) return
  bank.value = shuffle(bank.value)
}

function place(id: number) {
  if (graded.value) return
  bank.value = bank.value.filter(item => item !== id)
  tray.value.push(id)
  announcement.value = `Placed. ${tray.value.length} of ${chunks.value.length}.`
}

function takeBack(position: number) {
  if (graded.value) return
  const [id] = tray.value.splice(position, 1)
  if (id !== undefined) bank.value.push(id)
  announcement.value = `Removed. ${tray.value.length} of ${chunks.value.length}.`
}

/* ------------------------------------------------------------------ */

const canCheck = computed(() => !graded.value && tray.value.length === chunks.value.length)

/** A tile is right when it sits where it belongs. */
const isRight = (position: number) => tray.value[position] === position

const rightCount = computed(() => tray.value.filter((_, i) => isRight(i)).length)
const perfect = computed(() => rightCount.value === chunks.value.length)

function check() {
  if (graded.value || !canCheck.value) return
  graded.value = true
  const accuracy = chunks.value.length ? rightCount.value / chunks.value.length : 0
  emit('graded', { accuracy, grade: gradeFromAccuracy(accuracy) })
}

defineExpose({ actionLabel: 'Check order', canCheck, check, hideAction: false, retry: deal })
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div
        class="inline-flex overflow-hidden rounded-lg border border-line"
        role="group"
        aria-label="Piece size"
      >
        <button
          v-for="option in GRAINS"
          :key="option.value"
          class="min-h-9 px-3 text-xs font-semibold transition-colors"
          :class="
            grain === option.value
              ? 'bg-accent text-white'
              : 'text-ink-dim hover:bg-panel-2 hover:text-ink'
          "
          :disabled="graded"
          @click="setGrain(option.value)"
        >
          {{ option.label }}
        </button>
      </div>

      <div class="flex items-center gap-2">
        <span class="stamp shrink-0 text-ink-faint">{{ chunks.length }} pieces</span>
        <UiButton size="sm" icon="shuffle" :disabled="graded || !bank.length" @click="shuffleBank">
          Shuffle
        </UiButton>
      </div>
    </div>

    <p class="text-sm text-ink-dim">
      Rebuild <span class="font-semibold text-ink">{{ unit.cite }}</span> by tapping the pieces in
      order.
    </p>

    <!-- The sentence you are building. -->
    <div class="paper min-h-40 px-4 py-4 sm:px-6 sm:py-5">
      <div v-if="!tray.length" class="grid min-h-28 place-items-center">
        <span class="font-serif text-[15px] text-parchment-dim italic">
          Tap a piece below to begin.
        </span>
      </div>

      <div v-else class="flex flex-wrap gap-1.5">
        <button
          v-for="(id, position) in tray"
          :key="id"
          class="rounded-lg border px-2.5 py-1.5 text-left font-serif text-[15px] leading-snug transition-colors sm:text-base"
          :class="
            graded
              ? isRight(position)
                ? 'border-mark-good/45 bg-mark-good/10 text-mark-good'
                : 'border-mark-bad/45 bg-mark-bad/10 text-mark-bad'
              : 'border-royal-600/25 bg-royal-600/8 text-parchment-ink hover:border-royal-600/50'
          "
          :disabled="graded"
          @click="takeBack(position)"
        >
          {{ chunks[id] }}
        </button>
      </div>
    </div>

    <!-- The pieces still to place. -->
    <div v-if="bank.length" class="flex flex-wrap gap-1.5">
      <button
        v-for="id in bank"
        :key="id"
        class="rounded-lg border border-line bg-panel-2 px-2.5 py-2 text-left font-serif text-[15px] leading-snug text-ink transition-[border-color,background,transform] hover:border-accent/50 hover:bg-panel-3 active:translate-y-px sm:text-base"
        @click="place(id)"
      >
        {{ chunks[id] }}
      </button>
    </div>

    <p v-if="graded" class="animate-rise text-sm font-medium">
      <span :class="perfect ? 'text-good' : 'text-ink-dim'">
        {{ rightCount }} of {{ chunks.length }} pieces in the right place.
      </span>
    </p>

    <ProvisionPaper v-if="graded && !perfect" :unit="unit" :show-cite="false" class="animate-rise">
      <span class="stamp mb-2 block text-parchment-dim">In order</span>
      {{ unit.text }}
    </ProvisionPaper>

    <p class="sr-only" aria-live="polite">{{ announcement }}</p>
  </div>
</template>
