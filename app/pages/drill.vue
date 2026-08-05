<script setup lang="ts">
/**
 * The session shell. It owns the queue, the progress strip and the one button
 * at the bottom; each mode owns everything in between. See
 * `components/modes/README.md` for the contract between them.
 *
 * The whole session is described by the URL, so a reload rebuilds it rather
 * than losing it.
 */
import type { ModeId, Task, TaskResult, Unit } from '~/types'
import { articleById } from '~/data/corpus'
import ModeBlanks from '~/components/modes/ModeBlanks.vue'
import ModeLocate from '~/components/modes/ModeLocate.vue'
import ModeOrder from '~/components/modes/ModeOrder.vue'
import ModeRecite from '~/components/modes/ModeRecite.vue'
import ModeSkeleton from '~/components/modes/ModeSkeleton.vue'

definePageMeta({ layout: 'drill' })

/** Add a new mode here and in utils/modes.ts — nothing else needs to know. */
const COMPONENTS = {
  blanks: ModeBlanks,
  order: ModeOrder,
  skeleton: ModeSkeleton,
  recite: ModeRecite,
  locate: ModeLocate,
} satisfies Record<ModeId, unknown>

/** What every mode exposes to the shell. See components/modes/README.md. */
interface ModeApi {
  actionLabel: string
  canCheck: boolean
  check: () => void
  hideAction: boolean
  retry: () => void
}

const route = useRoute()
const { settings } = useSettings()
const { record } = useProgress()
const { buildQueue, taskFor } = useDrill()

const scope = computed(() => String(route.query.scope ?? 'review'))
const mode = computed(() => String(route.query.mode ?? 'mixed') as ModeId | 'mixed')
const count = computed(() => Number(route.query.n ?? settings.sessionLength))

const tasks = ref<Task[]>([])
const index = ref(0)
const graded = ref(false)
const finished = ref(false)
const sessionXp = ref(0)
const lastXp = ref(0)

const activeMode = useTemplateRef<ModeApi>('activeMode')

const task = computed(() => tasks.value[index.value])
const progressValue = computed(() =>
  tasks.value.length ? (index.value + (graded.value ? 1 : 0)) / tasks.value.length : 0,
)

function start() {
  tasks.value = buildQueue({ scope: scope.value, mode: mode.value, count: count.value })
  index.value = 0
  graded.value = false
  finished.value = false
  sessionXp.value = 0
  lastXp.value = 0
}

watch([scope, mode, count], start, { immediate: true })

/* ------------------------------------------------------------------ */
/* Advancing                                                           */
/* ------------------------------------------------------------------ */

function onGraded(result: TaskResult) {
  const current = task.value
  if (!current || graded.value) return

  // Only the first grading of a task banks XP and reschedules its card — a
  // restart is practice, not a second review, so later attempts just update
  // what's shown.
  const first = !current.result
  current.result = result
  if (first) {
    lastXp.value = record(current.unit, current.mode, result)
    sessionXp.value += lastXp.value
  }
  graded.value = true
}

function advance() {
  if (index.value + 1 >= tasks.value.length) finished.value = true
  else {
    index.value++
    graded.value = false
  }
}

/** Redo the current task from scratch instead of moving on. */
function retry() {
  if (!graded.value) return
  activeMode.value?.retry()
  graded.value = false
}

/**
 * Free navigation to another section of the same article — a deliberate
 * detour from the queue, not a graded step.
 *
 * The queue ahead is re-laid from the section picked, so Continue carries on
 * from where the learner actually is. Swapping only the current slot would
 * leave the tail pointing wherever the session had got to before the detour,
 * and Continue would jump back there. Steps already taken are left alone, and
 * the queue keeps its length, so the progress strip stays honest.
 */
function jumpToSection(unit: Unit) {
  if (!task.value || unit.id === task.value.unit.id) return

  const units = articleById(unit.articleId)?.units ?? []
  const at = units.findIndex(candidate => candidate.id === unit.id)
  const onward = at < 0 ? [unit] : units.slice(at)
  const room = tasks.value.length - index.value

  tasks.value = [
    ...tasks.value.slice(0, index.value),
    ...onward.slice(0, room).map(next => taskFor(next, mode.value)),
  ]
  graded.value = false
}

/* ------------------------------------------------------------------ */
/* The one button at the bottom                                        */
/* ------------------------------------------------------------------ */

const actionLabel = computed(() => activeMode.value?.actionLabel ?? 'Check')
const canCheck = computed(() => Boolean(activeMode.value?.canCheck))
const hideAction = computed(() => Boolean(activeMode.value?.hideAction))
const isLast = computed(() => index.value + 1 >= tasks.value.length)

function onAction() {
  if (graded.value) advance()
  else activeMode.value?.check()
}

/** Enter carries you forward on a keyboard; ⌘/Ctrl+Enter checks from anywhere. */
function onKeydown(event: KeyboardEvent) {
  if (finished.value) return
  const typing = /^(INPUT|TEXTAREA)$/.test((event.target as HTMLElement)?.tagName ?? '')

  if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
    event.preventDefault()
    onAction()
    return
  }
  if (event.key === 'Enter' && graded.value && !typing) {
    event.preventDefault()
    advance()
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <DrillSummary
    v-if="finished"
    :tasks="tasks"
    :xp="sessionXp"
    :scope="scope"
    @again="start"
  />

  <template v-else-if="task">
    <!-- Progress strip -->
    <header class="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur-md">
      <div class="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
        <NuxtLink
          to="/"
          class="grid size-9 shrink-0 place-items-center rounded-lg text-ink-faint transition-colors hover:bg-panel-2 hover:text-ink"
          aria-label="Leave this session"
        >
          <UiIcon name="close" :size="19" />
        </NuxtLink>

        <UiProgressBar :value="progressValue" thick />

        <span class="stamp shrink-0 tabular-nums text-ink-faint">
          {{ index + 1 }}/{{ tasks.length }}
        </span>
      </div>

      <DrillSectionNav
        :unit="task.unit"
        :hide-number="task.mode === 'locate'"
        @select="jumpToSection"
      />
    </header>

    <!-- The drill itself -->
    <main class="mx-auto w-full max-w-3xl flex-1 px-4 pt-4 pb-40">
      <div class="mb-3 flex items-center gap-2">
        <span class="flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-accent">
          <UiIcon :name="modeInfo(task.mode).icon" :size="14" />
          <span class="stamp">{{ modeInfo(task.mode).name }}</span>
        </span>
        <span class="truncate text-xs text-ink-faint">{{ modeInfo(task.mode).tagline }}</span>
      </div>

      <component
        :is="COMPONENTS[task.mode]"
        :key="`${index}-${task.unit.id}`"
        ref="activeMode"
        :unit="task.unit"
        :intensity="task.intensity"
        @graded="onGraded"
      />
    </main>

    <!-- Action bar -->
    <footer
      class="safe-b fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 backdrop-blur-md"
    >
      <div class="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
        <span
          v-if="graded"
          class="animate-rise stamp shrink-0 text-good"
          aria-live="polite"
        >
          +{{ lastXp }} XP
        </span>

        <template v-if="!hideAction || graded">
          <UiButton
            v-if="graded"
            variant="secondary"
            size="lg"
            icon="review"
            aria-label="Restart this task"
            @click="retry"
          >
            Restart
          </UiButton>

          <UiButton
            variant="primary"
            size="lg"
            block
            :disabled="!graded && !canCheck"
            :icon-after="graded ? (isLast ? undefined : 'arrowRight') : undefined"
            @click="onAction"
          >
            {{ graded ? (isLast ? 'See results' : 'Continue') : actionLabel }}
          </UiButton>
        </template>

        <!-- Locate grades on tap; Skeleton asks you to grade yourself. -->
        <p v-else class="flex-1 text-center text-sm text-ink-faint">
          Pick an option above to continue
        </p>
      </div>
    </footer>
  </template>

  <!-- Nothing to do: an empty scope, or everything already ahead of schedule. -->
  <div v-else class="mx-auto grid max-w-md flex-1 place-items-center px-4 text-center">
    <div>
      <TheSeal :size="52" class="mx-auto" />
      <h1 class="mt-3 font-serif text-2xl font-bold">Nothing due</h1>
      <p class="mt-1 text-sm text-ink-dim">
        The schedule has nothing waiting. Pick an article and read ahead.
      </p>
      <UiButton to="/library" variant="primary" class="mt-4" icon="library">
        Open the library
      </UiButton>
    </div>
  </div>
</template>
