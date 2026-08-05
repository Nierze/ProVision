/**
 * Turns "what do you want to practise" into a queue of tasks.
 *
 * A session is described entirely by the URL — `/drill?scope=article:art-3&mode=mixed`
 * — so reloading mid-session rebuilds it instead of losing it, and any screen
 * can start a drill with a plain link.
 */

import type { MasteryLevel, ModeId, Task, Unit } from '~/types'
import { UNITS, articleById, unitById } from '~/data/corpus'

/**
 * Which drill to give a provision at each stage of knowing it. Early on the
 * job is to build the chain of clauses; later it is to produce the words
 * unaided. The first entry is the usual choice, the rest add variety.
 */
const LADDER: Record<MasteryLevel, ModeId[]> = {
  0: ['order', 'blanks', 'order'],
  1: ['blanks', 'order', 'locate'],
  2: ['skeleton', 'blanks', 'recite'],
  3: ['recite', 'skeleton', 'locate'],
}

/** How much help to withhold at each stage. */
const INTENSITY: Record<MasteryLevel, number> = { 0: 0.2, 1: 0.45, 2: 0.7, 3: 0.95 }

export interface DrillRequest {
  /** `review` | `all` | `article:<id>` | `unit:<id>` */
  scope: string
  /** A specific drill, or `mixed` to let mastery choose. */
  mode: ModeId | 'mixed'
  count: number
}

export function useDrill() {
  const progress = useProgress()

  function buildQueue(request: DrillRequest): Task[] {
    if (request.scope.startsWith('unit:')) return ladderForOneUnit(request)

    return unitsFor(request)
      .slice(0, request.count)
      .map(unit => toTask(unit, request.mode))
  }

  /** A single provision taken through several drills, easiest first. */
  function ladderForOneUnit(request: DrillRequest): Task[] {
    const unit = unitById(request.scope.slice('unit:'.length))
    if (!unit) return []

    if (request.mode !== 'mixed') return [toTask(unit, request.mode)]

    const ladder = modesFor(unit).slice(0, 4)
    return ladder.map((mode, i) => ({
      unit,
      mode: mode.id,
      intensity: 0.25 + (i / Math.max(1, ladder.length - 1)) * 0.65,
    }))
  }

  function unitsFor(request: DrillRequest): Unit[] {
    if (request.scope.startsWith('article:')) {
      const article = articleById(request.scope.slice('article:'.length))
      if (!article) return []
      return fromCurrentPlace(article.units, request.count)
    }

    if (request.scope === 'all') {
      const pool = new Map<string, Unit>()
      for (const unit of [...progress.dueUnits.value, ...sample(UNITS, request.count * 2)]) {
        pool.set(unit.id, unit)
      }
      return shuffle([...pool.values()])
    }

    // `review` — the schedule's own answer, topped up with new material so a
    // session is never empty on a quiet day.
    const due = progress.dueUnits.value
    if (due.length >= request.count) return due
    return [...due, ...progress.freshUnits.value.slice(0, request.count - due.length)]
  }

  /**
   * Read an article in order, but start where the learner actually is: at the
   * first provision that is either due or untouched.
   */
  function fromCurrentPlace(units: Unit[], count: number): Unit[] {
    const today = todayISO()
    const start = units.findIndex(unit => {
      const card = progress.cardFor(unit.id)
      return !card || card.due <= today
    })
    if (start < 0) return units.slice(0, count) // all ahead of schedule — revise from the top
    return [...units.slice(start), ...units.slice(0, start)].slice(0, count)
  }

  function toTask(unit: Unit, mode: ModeId | 'mixed'): Task {
    const level = progress.masteryFor(unit.id)
    return {
      unit,
      mode: mode === 'mixed' ? pickMode(unit, level) : usable(unit, mode),
      intensity: INTENSITY[level],
    }
  }

  function pickMode(unit: Unit, level: MasteryLevel): ModeId {
    const choices = LADDER[level].filter(id => modeInfo(id).suits(unit))
    return choices[Math.floor(Math.random() * choices.length)] ?? 'blanks'
  }

  /** Honour the learner's choice unless the provision can't support it. */
  function usable(unit: Unit, mode: ModeId): ModeId {
    return modeInfo(mode).suits(unit) ? mode : (modesFor(unit)[0]?.id ?? 'blanks')
  }

  return { buildQueue }
}

/** A human sentence for the session header. */
export function describeScope(scope: string): string {
  if (scope === 'review') return "Today's review"
  if (scope === 'all') return 'Mixed drill'
  if (scope.startsWith('article:')) {
    const article = articleById(scope.slice('article:'.length))
    return article ? `${article.title}${article.subject ? ` — ${article.subject}` : ''}` : 'Drill'
  }
  if (scope.startsWith('unit:')) {
    const unit = unitById(scope.slice('unit:'.length))
    return unit ? unit.cite : 'Drill'
  }
  return 'Drill'
}
