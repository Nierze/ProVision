<script setup lang="ts">
/**
 * Free recall — no cues at all. The hardest drill, and the only one that tells
 * you whether you can actually produce the provision rather than recognise it.
 *
 * What you type is lined up against the real text word by word, so a single
 * dropped word doesn't throw everything after it out of alignment.
 */
import type { TaskResult, Unit } from '~/types'

const props = defineProps<{ unit: Unit; intensity: number; peeking?: boolean }>()
const emit = defineEmits<{ graded: [TaskResult] }>()

const typed = ref('')
const graded = ref(false)
const box = useTemplateRef<HTMLTextAreaElement>('box')

watch(
  () => props.unit.id,
  () => {
    typed.value = ''
    graded.value = false
  },
)

const outcome = computed(() => compareRecitation(props.unit.text, typed.value))
const missed = computed(() => outcome.value.marks.filter(mark => !mark.ok).length)
const percent = computed(() => Math.round(outcome.value.accuracy * 100))

const canCheck = computed(() => !graded.value && typed.value.trim().length > 0)

function check() {
  if (!canCheck.value) return
  graded.value = true
  emit('graded', {
    accuracy: outcome.value.accuracy,
    grade: gradeFromAccuracy(outcome.value.accuracy),
  })
}

function retry() {
  typed.value = ''
  graded.value = false
  nextTick(() => box.value?.focus())
}

/** Grow with the text rather than making the learner scroll a small box. */
function autoGrow() {
  const element = box.value
  if (!element) return
  element.style.height = 'auto'
  element.style.height = `${Math.min(element.scrollHeight, 420)}px`
}

defineExpose({ actionLabel: 'Check recall', canCheck, check, hideAction: false, retry })
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
      <h2 class="font-serif text-xl font-semibold">{{ unit.cite }}</h2>
      <span class="stamp text-ink-faint">{{ unit.wordCount }} words</span>
    </div>
    <p v-if="unit.topic && !graded" class="text-sm text-ink-dim">On: {{ unit.topic }}</p>

    <!-- Above the box, not in place of it: the textarea keeps its text and the caret. -->
    <ProvisionPaper v-if="peeking && !graded" :unit="unit" class="animate-rise">
      {{ unit.text }}
    </ProvisionPaper>

    <textarea
      v-if="!graded"
      ref="box"
      v-model="typed"
      rows="6"
      autocapitalize="sentences"
      spellcheck="false"
      placeholder="Type the provision from memory. Punctuation is not marked."
      class="w-full resize-none rounded-[var(--radius-card)] border border-line bg-panel p-4 font-serif text-[16px] leading-relaxed text-ink transition-colors outline-none placeholder:text-ink-faint focus:border-accent/60"
      @input="autoGrow"
    />

    <template v-else>
      <div class="flex items-center gap-3">
        <span
          class="text-2xl font-bold tabular-nums"
          :class="percent >= 85 ? 'text-good' : percent >= 60 ? 'text-near' : 'text-bad'"
          >{{ percent }}%</span
        >
        <span class="text-sm text-ink-dim">
          {{ missed === 0 ? 'Word perfect.' : `${missed} word${missed === 1 ? '' : 's'} missed.` }}
        </span>
      </div>

      <!-- The real text, with everything you failed to produce called out. -->
      <ProvisionPaper :unit="unit" class="animate-rise">
        <template v-for="(mark, i) in outcome.marks" :key="i">
          <span
            :class="
              mark.ok
                ? ''
                : 'rounded-[3px] bg-mark-bad/12 font-semibold text-mark-bad underline decoration-mark-bad/40 underline-offset-4'
            "
            >{{ mark.token.lead + mark.token.word + mark.token.trail }}</span
          >{{ ' ' }}
        </template>
      </ProvisionPaper>

      <details class="rounded-[var(--radius-card)] border border-line bg-panel-2 p-3">
        <summary class="cursor-pointer text-sm font-semibold text-ink-dim">
          What you wrote
        </summary>
        <p class="mt-2 font-serif text-[15px] leading-relaxed text-ink-dim">{{ typed }}</p>
      </details>
    </template>
  </div>
</template>
