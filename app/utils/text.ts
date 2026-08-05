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

/** Shortest tile worth placing. Below this it is a stub, not a piece of sense. */
const MIN_TILE = 3

/**
 * Where a run may be cut when punctuation offers nothing, best seam first.
 * Statutory prose runs forty words without a comma, so these carry the weight:
 * the cut lands before the word, where a reader would draw breath anyway.
 */
const SEAMS = [
  /^(and|or|nor|but)$/i,
  /^(which|who|whom|whose|that|when|where|while|unless|until|although|though|because|if|provided|except|subject)$/i,
  /^(shall|may|must|will|is|are|was|were|be|has|have|had)$/i,
  /^(of|in|on|to|for|by|with|from|upon|under|over|into|within|without|after|before|during|through|against|between|among|as|at)$/i,
]

const PAUSE = /[,;:]["')\]]?$/
const STOP = /[.?!]["')\]]?$/
const bare = (word: string) => word.replace(/[^A-Za-z'’-]/g, '')

/**
 * Cut a provision into the tiles the Order drill shuffles.
 *
 * Punctuation gives the first seams — it is where the drafters themselves
 * paused. But a sentence of legal prose will happily run past fifty words
 * without one, and a fifty-word tile is not a puzzle, it is a wall of text.
 * So length has the final say: anything still over `maxWords` is cut again at
 * the best grammatical seam near its middle, and short tiles are filled back
 * out to just under the limit. Lower `maxWords` for finer, harder tiles.
 */
export function chunkForOrdering(text: string, maxWords = 9, min = 3): string[] {
  let parts = splitAfterPunctuation(text).flatMap(part => breakUpLong(part, maxWords))

  // Fuller tiles read better, so pull the small ones back together — but never
  // past the length limit, and never down to fewer tiles than the drill needs.
  for (;;) {
    if (parts.length <= min) break
    const merged = mergeSmallestPair(parts, maxWords)
    if (!merged) break
    parts = merged
  }

  parts = absorbStubs(parts)

  // A short provision would rather be two honest tiles than three that cut
  // "Supreme Court" down the middle, so only split what can spare the words.
  while (parts.length < min && parts.some(p => words(p).length >= MIN_TILE * 2)) {
    parts = splitLongest(parts)
  }
  return parts
}

function splitAfterPunctuation(text: string): string[] {
  const out: string[] = []
  let current: string[] = []

  for (const word of words(text)) {
    current.push(word)
    // A full stop is as real a seam as a comma — "P." and "No." are not.
    const seam = PAUSE.test(word) || (STOP.test(word) && bare(word).length > 2)
    if (seam && current.length >= MIN_TILE) {
      out.push(current.join(' '))
      current = []
    }
  }
  if (current.length) out.push(current.join(' '))
  return out.length ? out : [text]
}

/** Halve a run at its best seam until every piece is within the limit. */
function breakUpLong(part: string, maxWords: number): string[] {
  const list = words(part)
  if (list.length <= maxWords) return [part]

  const at = bestCut(list)
  return [
    ...breakUpLong(list.slice(0, at).join(' '), maxWords),
    ...breakUpLong(list.slice(at).join(' '), maxWords),
  ]
}

/**
 * The cut nearest the middle, preferring the strongest seam. A good seam a few
 * words off-centre beats an arbitrary cut dead on it, so rank costs more than
 * distance — but only up to a point, or a lone "and" would drag every cut to
 * the edge of the run.
 */
function bestCut(list: string[]): number {
  const middle = list.length / 2
  const edge = Math.min(MIN_TILE, Math.floor(list.length / 2))
  let best = Math.round(middle)
  let cost = Infinity

  for (let i = edge; i <= list.length - edge; i++) {
    const rank = seamRank(list[i - 1]!, list[i]!)
    const here = rank * 4 + Math.abs(i - middle)
    if (here < cost) {
      cost = here
      best = i
    }
  }
  return best
}

function seamRank(before: string, at: string): number {
  if (PAUSE.test(before) || STOP.test(before)) return 0
  const hit = SEAMS.findIndex(seam => seam.test(bare(at)))
  return hit < 0 ? SEAMS.length + 1 : hit + 1
}

/** Merge the smallest adjacent pair that still fits. Null when none can. */
function mergeSmallestPair(parts: string[], maxWords: number): string[] | null {
  let at = -1
  let smallest = Infinity
  for (let i = 0; i < parts.length - 1; i++) {
    const size = words(parts[i]!).length + words(parts[i + 1]!).length
    if (size <= maxWords && size < smallest) {
      smallest = size
      at = i
    }
  }
  if (at < 0) return null
  return [...parts.slice(0, at), `${parts[at]} ${parts[at + 1]}`, ...parts.slice(at + 2)]
}

/**
 * A stub with no room left in either neighbour still has to go somewhere. Two
 * words over the limit is a fairer trade than a tile reading "of the".
 */
function absorbStubs(parts: string[]): string[] {
  if (parts.length < 2) return parts
  const out = [...parts]

  for (let i = 0; i < out.length && out.length > 1; ) {
    if (words(out[i]!).length >= MIN_TILE) {
      i++
      continue
    }
    const before = i > 0 ? words(out[i - 1]!).length : Infinity
    const after = i < out.length - 1 ? words(out[i + 1]!).length : Infinity
    const at = before <= after ? i - 1 : i
    out.splice(at, 2, `${out[at]} ${out[at + 1]}`)
    i = Math.max(0, at)
  }
  return out
}

function splitLongest(parts: string[]): string[] {
  let at = 0
  for (let i = 1; i < parts.length; i++) {
    if (words(parts[i]!).length > words(parts[at]!).length) at = i
  }
  const list = words(parts[at]!)
  const cut = bestCut(list)
  return [
    ...parts.slice(0, at),
    list.slice(0, cut).join(' '),
    list.slice(cut).join(' '),
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
