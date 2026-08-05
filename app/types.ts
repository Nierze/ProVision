/**
 * Every shape the app passes around. Import these explicitly:
 *   import type { Unit, ModeId } from '~/types'
 */

/** The five drills. Adding a sixth: add the id here, then see modes/README. */
export type ModeId = 'blanks' | 'order' | 'skeleton' | 'recite' | 'locate'

/** A single drillable passage — the atom of study and of scheduling. */
export interface Unit {
  /** Stable across releases; it is the localStorage key for progress. */
  id: string
  articleId: string
  /** "Article III" / "Preamble" */
  articleTitle: string
  /** "Bill of Rights" */
  articleSubject: string
  /** "III", "IX-C", or "" for the Preamble */
  numeral: string
  /** "Section 2", "Section 5 (1)", "Preamble" */
  label: string
  /** "§2", "§5(1)", "¶" — the compact chip form */
  short: string
  /** "Article III, Section 2" — how a lawyer would cite it */
  cite: string
  /** Grouping heading inside an article, e.g. "State Policies". May be "". */
  subhead: string
  /** A human description of what the provision is about. May be "". */
  topic: string
  text: string
  wordCount: number
}

export interface Article {
  id: string
  /** "III", "IX-C", "" */
  numeral: string
  /** "Article III" / "Preamble" */
  title: string
  /** "Bill of Rights" */
  subject: string
  units: Unit[]
  wordCount: number
}

/** How well a unit is known. Derived from its scheduling interval. */
export type MasteryLevel = 0 | 1 | 2 | 3

/** Self-assessment, and what auto-graded drills map onto. */
export type Grade = 0 | 1 | 2 | 3 // again | hard | good | easy

/** One unit's scheduling state. Absent from storage until first studied. */
export interface Card {
  /** ISO date (YYYY-MM-DD) this unit is next due. */
  due: string
  /** Days until the next review after the last one. */
  interval: number
  /** SM-2 ease factor, 1.3–2.8. */
  ease: number
  /** Consecutive successful reviews. */
  reps: number
  lapses: number
  /** Best accuracy ever achieved, 0–1. */
  best: number
  /** ISO timestamp of the last review. */
  seen: string
}

/** What a mode reports when the learner has finished a task. */
export interface TaskResult {
  accuracy: number // 0–1
  grade: Grade
}

/** One item in a drill session's queue. */
export interface Task {
  unit: Unit
  mode: ModeId
  /**
   * 0–1. How much help to withhold, chosen from the unit's mastery. Blanks
   * reads it as "what share of words to remove"; Skeleton reads it as "how much
   * scaffolding to strip". Modes that have nothing to scale ignore it.
   */
  intensity: number
  result?: TaskResult
}
