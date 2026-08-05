/**
 * Text handling shared by the drills. Nothing here knows about Vue — these are
 * plain functions you can reason about (and unit-test) on their own.
 */

export interface Token {
  /** Punctuation attached before the word, e.g. the "(" in "(1)". */
  lead: string
  word: string
  /** Punctuation attached after, e.g. the "," in "people,". */
  trail: string
}

/* -------------------------------------------------------------------------- */
/* Comparing what a learner typed against the text                             */
/* -------------------------------------------------------------------------- */

/** Case, accents and punctuation removed, so "Twenty-four" === "twenty four". */
export function normalise(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip combining accents
    .replace(/[^a-z0-9]/g, '')
}

/** Levenshtein distance, abandoned early — we only need "wrong" vs "nearly". */
export function editDistance(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 2) return 9
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const row = [i]
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(
        previous[j]! + 1,
        row[j - 1]! + 1,
        previous[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
    }
    previous = row
  }
  return previous[b.length]!
}

/** "correct" | "near" | "wrong" for one answer against one word. */
export function judge(typed: string, truth: string): 'correct' | 'near' | 'wrong' {
  const a = normalise(typed)
  const b = normalise(truth)
  if (!a) return 'wrong'
  if (a === b) return 'correct'
  if (b.length >= 4 && editDistance(a, b) <= (b.length >= 8 ? 2 : 1)) return 'near'
  return 'wrong'
}

/* -------------------------------------------------------------------------- */
/* Splitting text up                                                           */
/* -------------------------------------------------------------------------- */

const WORD_SHAPE = /^([^\p{L}\p{N}]*)(.*?)([^\p{L}\p{N}]*)$/u

export function tokenise(text: string): Token[] {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map(chunk => {
      const match = chunk.match(WORD_SHAPE)!
      return { lead: match[1]!, word: match[2]!, trail: match[3]! }
    })
}

const words = (text: string) => text.split(/\s+/).filter(Boolean)

/**
 * Cut a provision into the tiles the Order drill shuffles.
 *
 * Clause boundaries are the natural seams — they are where the drafters
 * themselves paused — so we break after commas, semicolons and colons, then
 * even the tiles out so no one tile is a lone word.
 */
export function chunkForOrdering(text: string, max = 7, min = 3): string[] {
  let parts = splitAfterPunctuation(text)

  while (parts.length > max) parts = mergeSmallestPair(parts)
  while (parts.length < min && parts.some(p => words(p).length >= 4)) {
    parts = splitLongest(parts)
  }
  return parts
}

function splitAfterPunctuation(text: string): string[] {
  const out: string[] = []
  let current: string[] = []

  for (const word of words(text)) {
    current.push(word)
    if (/[,;:]$/.test(word) && current.length >= 3) {
      out.push(current.join(' '))
      current = []
    }
  }
  if (current.length) {
    // Never leave a stub at the end — fold it into the tile before it.
    if (current.length < 3 && out.length) out[out.length - 1] += ' ' + current.join(' ')
    else out.push(current.join(' '))
  }
  return out.length ? out : [text]
}

function mergeSmallestPair(parts: string[]): string[] {
  let at = 0
  let smallest = Infinity
  for (let i = 0; i < parts.length - 1; i++) {
    const size = words(parts[i]!).length + words(parts[i + 1]!).length
    if (size < smallest) {
      smallest = size
      at = i
    }
  }
  return [...parts.slice(0, at), `${parts[at]} ${parts[at + 1]}`, ...parts.slice(at + 2)]
}

function splitLongest(parts: string[]): string[] {
  let at = 0
  for (let i = 1; i < parts.length; i++) {
    if (words(parts[i]!).length > words(parts[at]!).length) at = i
  }
  const list = words(parts[at]!)
  const half = Math.ceil(list.length / 2)
  return [
    ...parts.slice(0, at),
    list.slice(0, half).join(' '),
    list.slice(half).join(' '),
    ...parts.slice(at + 1),
  ]
}

/** "natural-born" -> "n-b". Keeps hyphens and apostrophes as landmarks. */
export function initialsOf(word: string): string {
  return word
    .split(/([-–'’])/)
    .map((piece, i) => (i % 2 ? piece : piece.charAt(0)))
    .join('')
}

/* -------------------------------------------------------------------------- */
/* Choosing which words to hide                                                */
/* -------------------------------------------------------------------------- */

/**
 * Grammatical glue. When "key words first" is on these are blanked last, so a
 * low percentage hides the words that actually carry the rule.
 */
const GLUE = new Set(
  (
    'a an the and or of to in on at by for from with as is are was were be been being ' +
    'it its their his her he she this that these those such which who whom what not no ' +
    'nor any all other others there then than so if but upon into within without under ' +
    'over after before out up down more most less least each every both same shall may'
  ).split(' '),
)

const weightOf = (token: Token) =>
  GLUE.has(token.word.toLowerCase()) ? 0 : token.word.length > 6 ? 2 : 1

/**
 * Pick indices to blank out. Returns a Set so callers stay stateless.
 * `(1)` style paragraph markers are never hidden — they are scaffolding.
 */
export function pickBlanks(tokens: Token[], ratio: number, keyWordsFirst: boolean): Set<number> {
  const candidates = tokens
    .map((token, index) => ({ token, index }))
    .filter(({ token }) => token.word.length > 0 && !/^\(\d+\)$/.test(token.lead + token.word + token.trail))

  const pool = shuffle(candidates.slice())
  if (keyWordsFirst && ratio < 1) {
    // Stable sort, so the shuffle survives inside ties.
    pool.sort((a, b) => weightOf(b.token) - weightOf(a.token))
  }

  const count = Math.max(1, Math.round(pool.length * ratio))
  return new Set(pool.slice(0, count).map(entry => entry.index))
}

/* -------------------------------------------------------------------------- */
/* Grading a whole recitation                                                  */
/* -------------------------------------------------------------------------- */

export interface RecitationMark {
  token: Token
  ok: boolean
}

/**
 * Line up what was typed against the real text and mark every word that made
 * it. Uses a longest-common-subsequence walk, so a single missing word doesn't
 * throw everything after it out of alignment.
 */
export function compareRecitation(
  expected: string,
  typed: string,
): { marks: RecitationMark[]; accuracy: number } {
  const tokens = tokenise(expected)
  const truth = tokens.map(t => normalise(t.word)).filter(Boolean)
  const attempt = tokenise(typed).map(t => normalise(t.word)).filter(Boolean)

  const matched = longestCommonSubsequence(truth, attempt)

  // Walk the marks back onto the original tokens, skipping punctuation-only ones.
  let cursor = 0
  const marks = tokens.map(token => ({
    token,
    ok: normalise(token.word) ? matched[cursor++]! : true,
  }))

  const hits = matched.filter(Boolean).length
  const accuracy = truth.length ? hits / Math.max(truth.length, attempt.length) : 0
  return { marks, accuracy }
}

/** For each item in `a`, did it appear in the best alignment with `b`? */
function longestCommonSubsequence(a: string[], b: string[]): boolean[] {
  const n = a.length
  const m = b.length
  const width = m + 1
  const table = new Uint16Array((n + 1) * width)

  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      table[i * width + j] =
        a[i] === b[j]
          ? table[(i + 1) * width + j + 1]! + 1
          : Math.max(table[(i + 1) * width + j]!, table[i * width + j + 1]!)
    }
  }

  const out = Array<boolean>(n).fill(false)
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      out[i] = true
      i++
      j++
    } else if (table[(i + 1) * width + j]! >= table[i * width + j + 1]!) {
      i++
    } else {
      j++
    }
  }
  return out
}

/* -------------------------------------------------------------------------- */
/* Small helpers                                                               */
/* -------------------------------------------------------------------------- */

/** Fisher–Yates, in place. */
export function shuffle<T>(list: T[]): T[] {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[list[i], list[j]] = [list[j]!, list[i]!]
  }
  return list
}

export function sample<T>(list: readonly T[], count: number): T[] {
  return shuffle(list.slice()).slice(0, count)
}

export function snippet(text: string, wordCount = 9): string {
  const list = words(text)
  return list.length <= wordCount ? text : list.slice(0, wordCount).join(' ') + '…'
}
