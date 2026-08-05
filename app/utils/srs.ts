/**
 * Spaced repetition — the part that decides *when* you see a provision again.
 *
 * A pared-back SM-2. The research finding it rests on is simple: you remember
 * something for longer if you are asked for it just as you are about to forget
 * it, so every success pushes the next review further out, and every failure
 * pulls it back to today.
 *
 * Dates are local calendar days (YYYY-MM-DD), not timestamps — "tomorrow"
 * should mean tomorrow morning, not 24 hours from now.
 */

import type { Card, Grade, MasteryLevel } from '~/types'

const EASE_MIN = 1.3
const EASE_MAX = 2.8
const EASE_START = 2.3
const INTERVAL_MAX = 365

/** How much a grade moves the ease factor. Index = grade. */
const EASE_SHIFT = [-0.2, -0.15, 0, 0.12] as const

export function todayISO(date = new Date()): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 10)
}

export function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00`)
  date.setDate(date.getDate() + days)
  return todayISO(date)
}

export function daysBetween(from: string, to: string): number {
  const a = new Date(`${from}T00:00:00`).getTime()
  const b = new Date(`${to}T00:00:00`).getTime()
  return Math.round((b - a) / 86_400_000)
}

export function newCard(): Card {
  return {
    due: todayISO(),
    interval: 0,
    ease: EASE_START,
    reps: 0,
    lapses: 0,
    best: 0,
    seen: '',
  }
}

/** Apply a grade and return the card's next state. Never mutates the input. */
export function schedule(card: Card, grade: Grade, accuracy = 0): Card {
  const ease = clamp(card.ease + EASE_SHIFT[grade]!, EASE_MIN, EASE_MAX)
  const next: Card = {
    ...card,
    ease,
    best: Math.max(card.best, accuracy),
    seen: new Date().toISOString(),
  }

  if (grade === 0) {
    // Forgotten. Back to the start of the ladder, and due again today.
    next.reps = 0
    next.lapses = card.lapses + 1
    next.interval = 0
    next.due = todayISO()
    return next
  }

  next.reps = card.reps + 1
  next.interval = clamp(Math.round(nextInterval(card, grade, ease)), 1, INTERVAL_MAX)
  next.due = addDays(todayISO(), next.interval)
  return next
}

function nextInterval(card: Card, grade: Grade, ease: number): number {
  // The first two successes are fixed steps; after that the interval compounds.
  if (card.reps === 0) return grade === 3 ? 3 : 1
  if (card.reps === 1) return grade === 1 ? 3 : grade === 3 ? 7 : 4
  const base = Math.max(card.interval, 1) * ease
  return grade === 1 ? base * 0.6 : grade === 3 ? base * 1.3 : base
}

/** New → Learning → Solid → Mastered, read off the scheduling interval. */
export function masteryOf(card: Card | undefined): MasteryLevel {
  if (!card || !card.reps) return 0
  if (card.interval < 7) return 1
  if (card.interval < 30) return 2
  return 3
}

export const MASTERY_LABELS = ['Untouched', 'Learning', 'Solid', 'By heart'] as const

/**
 * Turn an auto-graded drill's score into a grade. Verbatim recall is
 * unforgiving on purpose — "almost right" is how misquotes are born.
 */
export function gradeFromAccuracy(accuracy: number): Grade {
  if (accuracy >= 0.98) return 3
  if (accuracy >= 0.85) return 2
  if (accuracy >= 0.6) return 1
  return 0
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
