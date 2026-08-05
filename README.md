# ProVision

Learn the 1987 Philippine Constitution by heart. Five recall drills over the
full text — Preamble and all eighteen articles — scheduled so each provision
comes back just before you would have forgotten it.

Nuxt 4 · Tailwind CSS 4 · TypeScript. No backend, no accounts: everything a
learner does is kept in their own browser.

---

## Running it

Requires Node 20.19+ (or 22.12+).

```bash
npm install
npm run dev          # http://localhost:3000
```

```bash
npm run generate     # static site in .output/public — deploy anywhere
npm run typecheck
```

---

## How it is put together

```
app/
├── data/
│   ├── constitution.json   307 sections, generated (see "Updating the text")
│   ├── corpus.ts           JSON -> Article[] / Unit[]: ids, citations, splitting
│   └── topics.ts           optional plain-language labels per section
├── types.ts                every shape the app passes around
├── utils/                  auto-imported, no Vue inside
│   ├── text.ts             tokenising, blanking, clause-chunking, recall diffing
│   ├── srs.ts              the scheduler
│   ├── modes.ts            the catalogue of drills
│   ├── icons.ts            SVG path data
│   └── storage.ts          localStorage without the sharp edges
├── composables/            auto-imported, shared reactive state
│   ├── useProgress.ts      cards, XP, streak, per-article stats
│   ├── useSettings.ts      preferences + theme
│   ├── useDrill.ts         builds a session queue from a URL
│   ├── useSpeech.ts        read-aloud
│   └── useNav.ts           nav targets and active-state matching
├── components/
│   ├── modes/              one component per drill — see modes/README.md
│   └── ui/                 UiButton, UiCard, UiIcon, UiProgressBar, MasteryDots
└── pages/
    ├── index.vue           today: what's due, the daily goal, where you left off
    ├── library.vue         all 22 parts with progress
    ├── article/[id].vue    read an article, drill it, expand any provision
    ├── drill.vue           the session shell
    └── progress.vue        stats, settings, and how the app works
```

**The unit is the atom.** A `Unit` is one drillable passage: usually a section,
but long sections are split at their own numbered subparagraphs — and only then
at sentence boundaries — so nothing over ~115 words is ever asked for in one
piece. 307 sections become 455 units. Progress, scheduling and XP all key off
`unit.id`.

**A session is a URL.** `/drill?scope=article:art-3&mode=mixed&n=8`. Reloading
mid-session rebuilds it rather than losing it, and any screen can start a drill
with a plain link. `scope` is `review`, `all`, `article:<id>` or `unit:<id>`.

**Modes are independent.** The shell owns the progress bar and the one button at
the bottom; a mode owns everything between. The contract is four things a mode
exposes — see [`app/components/modes/README.md`](app/components/modes/README.md).

---

## The five drills

| Mode | What you do | What it trains |
| --- | --- | --- |
| **Blanks** | put removed words back | cued recall, 25–100% removed |
| **Order** | tap shuffled clauses into sequence | serial recall — the chain of clauses |
| **Skeleton** | recite from first letters, then from nothing | progressive fading |
| **Recite** | type the whole provision from memory | free recall, word-by-word diff |
| **Locate** | name the article and section | the rule ↔ citation link |

A **mixed** session picks the drill from how well you already know each
provision: ordering and blanks while it is new, skeleton once it is solid,
recitation once it is nearly there. That ladder lives in `LADDER` in
`app/composables/useDrill.ts`.

## Scheduling

A pared-back SM-2 in `app/utils/srs.ts`. Each provision carries an interval and
an ease factor; success multiplies the interval, failure sends it back to today.
Objective drills grade themselves from accuracy; Skeleton asks you, because no
machine can tell whether you said it correctly out loud.

Mastery shown in the UI is read off the interval: **Learning** under a week,
**Solid** under a month, **By heart** beyond that.

---

## Extending it

**Adding a drill mode** — five small steps, listed in
[`app/components/modes/README.md`](app/components/modes/README.md). Nothing
outside those files needs to change.

**Labelling more provisions** — `app/data/topics.ts` maps
`<articleId>:<section>` to a plain-language description. Anything unlabelled
falls back to a snippet of its own text, so you can fill this in a few lines at
a time. Article II, III and VIII are done.

**Changing the look** — every colour is a token in
`app/assets/css/main.css`. Brand scales (`royal`, `brass`, `parchment`) are
fixed; semantic tokens (`surface`, `panel`, `ink`, `accent`, `line`) flip
between light and dark. Components only ever use the semantic ones, so
re-theming means editing two blocks.

**Adjusting how text is split** — `MAX_WORDS` and `SPLIT_ABOVE` at the top of
`app/data/corpus.ts`.

### Updating the text

`app/data/constitution.json` is generated, not hand-edited:

```bash
curl -A "Mozilla/5.0" -o consti.html https://lawphil.net/consti/cons1987.html
python3 tools/parse-lawphil.py          # writes constitution.json
mv constitution.json app/data/
```

The parser handles the source's quirks: `<ol><li>` subparagraph numbering,
Article IX splitting into IX-A through IX-D with its own section numbering,
Article II's implicit "Principles" heading, and the signatory block that runs on
from Article XVIII §27.

Text was checked against the corpus in the original prototype: 61 overlapping
provisions, all matching except two the prototype had truncated (Article VI §5
and §7) and one capitalisation.

---

## Notes

- **Source.** Constitutional text from
  [The LawPhil Project](https://lawphil.net/consti/cons1987.html) (Arellano Law
  Foundation), CC BY-NC 4.0. Verify anything you intend to quote against the
  official text.
- **Storage.** Progress lives in `localStorage` under `provision.progress.v1`
  and `provision.settings.v1`. Clearing site data erases it; there is no sync.
- **Rendering.** `ssr: false` — the app is client-only, which is why
  `localStorage` can be read directly with no hydration dance.
- The original single-file prototype is kept at `legacy/prototype.html`.
