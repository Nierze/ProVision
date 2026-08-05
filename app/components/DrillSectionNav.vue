<script setup lang="ts">
/**
 * Lets a learner move between sections of the current article mid-drill —
 * previous/next, or jump straight to one from the list. Purely a detour: the
 * shell swaps the current queue slot for whatever section is picked here.
 */
import type { Unit } from '~/types'
import { articleById } from '~/data/corpus'

const props = defineProps<{
  unit: Unit
  /** Locate quizzes the section number itself, so the nav can't give it away. */
  hideNumber?: boolean
}>()
const emit = defineEmits<{ select: [Unit] }>()

const { masteryFor, cardFor } = useProgress()

const article = computed(() => articleById(props.unit.articleId))
const units = computed(() => article.value?.units ?? [])
const position = computed(() => units.value.findIndex(u => u.id === props.unit.id))

/** `unit.label` falls back to "Section N" when there's no topic — as much a giveaway as `short`. */
const currentLabel = computed(() => props.unit.topic || (props.hideNumber ? 'This section' : props.unit.label))

const hasPrev = computed(() => position.value > 0)
const hasNext = computed(() => position.value >= 0 && position.value < units.value.length - 1)

const open = ref(false)
const rootEl = useTemplateRef<HTMLDivElement>('root')

function toggle() {
  open.value = !open.value
}

function close() {
  open.value = false
}

function pick(unit: Unit) {
  close()
  if (unit.id !== props.unit.id) emit('select', unit)
}

function prev() {
  if (hasPrev.value) emit('select', units.value[position.value - 1]!)
}

function next() {
  if (hasNext.value) emit('select', units.value[position.value + 1]!)
}

function onDocClick(event: MouseEvent) {
  if (!(event.target as HTMLElement).closest('.section-nav')) close()
}

const isDue = (unit: Unit) => {
  const card = cardFor(unit.id)
  return Boolean(card && card.due <= todayISO())
}

watch(open, async value => {
  if (!value) return
  await nextTick()
  rootEl.value?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'center' })
})

onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
</script>

<template>
  <div ref="root" class="section-nav relative border-t border-line">
    <div class="mx-auto flex max-w-3xl items-center gap-1 px-2 py-1.5">
      <button
        type="button"
        class="grid size-9 shrink-0 place-items-center rounded-lg text-ink-faint transition-colors hover:bg-panel-2 hover:text-ink disabled:pointer-events-none disabled:opacity-30"
        aria-label="Previous section"
        :disabled="!hasPrev"
        @click="prev"
      >
        <UiIcon name="arrowLeft" :size="16" />
      </button>

      <button
        type="button"
        class="flex min-h-9 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 text-center transition-colors hover:bg-panel-2"
        :aria-expanded="open"
        @click="toggle"
      >
        <span v-if="!hideNumber" class="stamp shrink-0 text-accent">{{ unit.short }}</span>
        <span class="min-w-0 truncate text-xs font-medium text-ink-dim">
          {{ currentLabel }}
        </span>
        <UiIcon
          name="chevronDown"
          :size="13"
          class="shrink-0 text-ink-faint transition-transform duration-200"
          :class="open && 'rotate-180'"
        />
      </button>

      <button
        type="button"
        class="grid size-9 shrink-0 place-items-center rounded-lg text-ink-faint transition-colors hover:bg-panel-2 hover:text-ink disabled:pointer-events-none disabled:opacity-30"
        aria-label="Next section"
        :disabled="!hasNext"
        @click="next"
      >
        <UiIcon name="arrowRight" :size="16" />
      </button>
    </div>

    <div
      v-if="open"
      class="animate-rise absolute inset-x-0 top-full z-30 border-b border-line bg-panel shadow-[0_16px_36px_-20px_var(--c-accent)]"
    >
      <p class="stamp mx-auto max-w-3xl px-4 pt-3 text-ink-faint">
        {{ article?.title }}{{ article?.subject ? ` — ${article.subject}` : '' }}
      </p>
      <ul class="no-scrollbar mx-auto max-h-72 max-w-3xl overflow-y-auto p-2">
        <li v-for="u in units" :key="u.id">
          <button
            type="button"
            class="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors"
            :class="u.id === unit.id ? 'bg-accent-soft' : 'hover:bg-panel-2'"
            :data-active="u.id === unit.id"
            @click="pick(u)"
          >
            <span
              v-if="!hideNumber"
              class="stamp w-11 shrink-0 text-center"
              :class="u.id === unit.id ? 'text-accent' : 'text-ink-faint'"
            >
              {{ u.short }}
            </span>
            <span class="min-w-0 flex-1 truncate text-xs" :class="u.id === unit.id ? 'font-semibold' : 'text-ink-dim'">
              {{ u.topic || snippet(u.text, 7) }}
            </span>
            <span v-if="isDue(u)" class="stamp shrink-0 rounded-full bg-accent-soft px-1.5 py-0.5 text-accent">
              Due
            </span>
            <MasteryDots :level="masteryFor(u.id)" />
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>
