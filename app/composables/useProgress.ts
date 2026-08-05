/**
 * What the learner has done, and what the schedule says they should do next.
 *
 * One shared reactive object persisted to localStorage. Nothing leaves the
 * device.
 */

import type { Article, Card, MasteryLevel, ModeId, TaskResult, Unit } from '~/types'
import { ARTICLES, UNITS } from '~/data/corpus'

const KEY = 'provision.progress.v1'

interface ProgressState {
  /** unit id -> scheduling state. A missing key means "never studied". */
  cards: Record<string, Card>
  xp: number
  /** ISO date -> experience earned that day. Drives the streak and the chart. */
  history: Record<string, number>
}

const DEFAULTS: ProgressState = { cards: {}, xp: 0, history: {} }

const state = reactive<ProgressState>(readJson(KEY, DEFAULTS))

/** Detached, so persistence outlives the component that first asked for it. */
let started = false

export function useProgress() {
  if (!started && typeof window !== 'undefined') {
    started = true
    effectScope(true).run(() => {
      watch(state, value => writeJson(KEY, value), { deep: true })
    })
  }

  /* ---------------------------------------------------------------------- */
  /* Reading                                                                 */
  /* ---------------------------------------------------------------------- */

  const cardFor = (unitId: string): Card | undefined => state.cards[unitId]
  const masteryFor = (unitId: string): MasteryLevel => masteryOf(state.cards[unitId])

  /** Everything the schedule wants today, most overdue first. */
  const dueUnits = computed<Unit[]>(() => {
    const today = todayISO()
    return UNITS.filter(unit => {
      const card = state.cards[unit.id]
      return card && card.due <= today
    }).sort((a, b) => state.cards[a.id]!.due.localeCompare(state.cards[b.id]!.due))
  })

  /** Never studied, in the order they appear in the Constitution. */
  const freshUnits = computed<Unit[]>(() => UNITS.filter(unit => !state.cards[unit.id]))

  const todayXp = computed(() => state.history[todayISO()] ?? 0)

  /** Consecutive days with at least some study. Today is not yet required. */
  const streak = computed(() => {
    let day = todayISO()
    if (!state.history[day]) day = addDays(day, -1)
    let count = 0
    while (state.history[day]) {
      count++
      day = addDays(day, -1)
    }
    return count
  })

  const overall = computed(() => {
    let touched = 0
    let byHeart = 0
    for (const unit of UNITS) {
      const level = masteryOf(state.cards[unit.id])
      if (level > 0) touched++
      if (level === 3) byHeart++
    }
    return {
      total: UNITS.length,
      touched,
      byHeart,
      due: dueUnits.value.length,
      xp: state.xp,
    }
  })

  /** Progress for one article, for the library and article pages. */
  function statsFor(article: Article) {
    let touched = 0
    let byHeart = 0
    let due = 0
    const today = todayISO()

    for (const unit of article.units) {
      const card = state.cards[unit.id]
      const level = masteryOf(card)
      if (level > 0) touched++
      if (level === 3) byHeart++
      if (card && card.due <= today) due++
    }

    return {
      total: article.units.length,
      touched,
      byHeart,
      due,
      /** 0–1, weighted so "by heart" counts fully and "learning" counts partly. */
      percent: article.units.length
        ? article.units.reduce((sum, u) => sum + masteryOf(state.cards[u.id]) / 3, 0) /
          article.units.length
        : 0,
    }
  }

  const articleStats = computed(() => {
    const out: Record<string, ReturnType<typeof statsFor>> = {}
    for (const article of ARTICLES) out[article.id] = statsFor(article)
    return out
  })

  /** Experience per day for the last `days` days, oldest first. */
  function recentHistory(days = 30) {
    const out: { date: string; xp: number }[] = []
    for (let i = days - 1; i >= 0; i--) {
      const date = addDays(todayISO(), -i)
      out.push({ date, xp: state.history[date] ?? 0 })
    }
    return out
  }

  /* ---------------------------------------------------------------------- */
  /* Writing                                                                 */
  /* ---------------------------------------------------------------------- */

  /** Log one finished drill: reschedule the card and bank the experience. */
  function record(unit: Unit, mode: ModeId, result: TaskResult): number {
    const card = state.cards[unit.id] ?? newCard()
    state.cards[unit.id] = schedule(card, result.grade, result.accuracy)

    const earned = xpFor(mode, result.accuracy)
    const today = todayISO()
    state.xp += earned
    state.history[today] = (state.history[today] ?? 0) + earned
    return earned
  }

  function resetProgress() {
    state.cards = {}
    state.xp = 0
    state.history = {}
  }

  return {
    state: readonly(state),
    cardFor,
    masteryFor,
    dueUnits,
    freshUnits,
    todayXp,
    streak,
    overall,
    statsFor,
    articleStats,
    recentHistory,
    record,
    resetProgress,
  }
}
