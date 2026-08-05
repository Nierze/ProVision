/**
 * The catalogue of drills. Everything the UI knows about a mode is here, so
 * adding a sixth mode means adding one entry plus one component.
 *
 * The five were chosen to cover the four things verbatim memory actually needs:
 * recall of the exact words (Blanks, Skeleton, Recite), recall of their order
 * (Order), and recall of where the provision lives (Locate). Recognition is
 * deliberately under-served — picking the right answer from a list feels like
 * progress and isn't.
 */

import type { ModeId, Unit } from '~/types'

export interface ModeInfo {
  id: ModeId
  name: string
  /** One line, shown on the mode picker. */
  tagline: string
  /** Why it is in here — shown in the "how this works" sheet. */
  rationale: string
  /** Base experience for a perfect run. */
  xp: number
  /** 1–4. A session runs easy drills first and hard ones last. */
  demand: number
  icon: string
  /** Not every drill suits every provision. */
  suits: (unit: Unit) => boolean
}

export const MODES: ModeInfo[] = [
  {
    id: 'blanks',
    name: 'Blanks',
    tagline: 'Restore the missing words',
    rationale:
      'Cued recall. Removing words forces you to generate them rather than read them, which is what makes the text stick. Raise the percentage as the provision gets easier.',
    xp: 12,
    demand: 2,
    icon: 'blanks',
    suits: () => true,
  },
  {
    id: 'order',
    name: 'Order',
    tagline: 'Put the clauses back in sequence',
    rationale:
      'Serial recall. Legal text is memorised as a chain — each clause is the cue for the next. Shuffling the tiles trains that chain without asking you to produce every word.',
    xp: 10,
    demand: 2,
    icon: 'order',
    suits: unit => unit.wordCount >= 10,
  },
  {
    id: 'skeleton',
    name: 'Skeleton',
    tagline: 'Recite from first letters, then from nothing',
    rationale:
      'Progressive fading — the classic method for learning a passage word for word. The scaffolding thins out as you improve: full text, then initials, then the bare citation.',
    xp: 14,
    demand: 3,
    icon: 'skeleton',
    suits: () => true,
  },
  {
    id: 'recite',
    name: 'Recite',
    tagline: 'Type the whole provision from memory',
    rationale:
      'Free recall with no cues at all — the hardest test, and the one that predicts whether you can actually produce the provision under pressure. Every word you miss is shown.',
    xp: 18,
    demand: 4,
    icon: 'recite',
    suits: unit => unit.wordCount <= 70,
  },
  {
    id: 'locate',
    name: 'Locate',
    tagline: 'Name the article and section',
    rationale:
      'Knowing a rule is useless if you cannot cite it. This drills the link between the words and their address, in both directions.',
    xp: 8,
    demand: 1,
    icon: 'locate',
    // Needs siblings to distinguish between — the Preamble and Article I are
    // each just one section, so there is no address to tell it apart from.
    suits: unit => unit.articleId !== 'preamble' && unit.articleId !== 'art-1',
  },
]

const BY_ID = new Map(MODES.map(mode => [mode.id, mode]))

export function modeInfo(id: ModeId): ModeInfo {
  return BY_ID.get(id)!
}

/** Which drills make sense for this passage, easiest first. */
export function modesFor(unit: Unit): ModeInfo[] {
  return MODES.filter(mode => mode.suits(unit)).sort((a, b) => a.demand - b.demand)
}

/** Experience earned for a run. Always worth something for turning up. */
export function xpFor(id: ModeId, accuracy: number): number {
  return Math.max(3, Math.round(modeInfo(id).xp * accuracy))
}
