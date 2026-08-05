# Drill modes

Each mode is one self-contained component. The session shell
(`app/pages/drill.vue`) owns the progress bar, the header and the bottom action
bar; a mode owns everything between them.

## The contract

```ts
// Props — the shell always supplies both.
defineProps<{
  unit: Unit          // the provision to drill
  intensity: number   // 0–1, how much help to withhold (from the unit's mastery)
}>()

// Emit exactly once, when the attempt has been scored.
defineEmits<{ graded: [TaskResult] }>()

// The shell drives its action button through these.
defineExpose({
  actionLabel,  // string   — what the button says, e.g. 'Check'
  canCheck,     // boolean  — is there enough input to score?
  check,        // ()=>void — score it, then emit `graded`
  hideAction,   // boolean  — true while the mode shows its own controls
})
```

Once `graded` has fired the shell swaps its button for **Continue**, so a mode
should reveal the right answer as part of scoring — corrective feedback is the
point of the exercise.

## Adding a mode

1. Add its id to `ModeId` in `app/types.ts`.
2. Add an entry to `MODES` in `app/utils/modes.ts` — name, tagline, XP, icon,
   and a `suits(unit)` predicate so it is only offered where it makes sense.
3. Add an icon path to `app/utils/icons.ts`.
4. Create `Mode<Name>.vue` here following the contract above.
5. Register it in the `COMPONENTS` map at the top of `app/pages/drill.vue`.
6. Optionally slot it into `LADDER` in `app/composables/useDrill.ts` so mixed
   sessions reach for it at the right stage of mastery.

Nothing else in the app needs to change.

## The five, and why

| Mode | Trains | Recall type |
| --- | --- | --- |
| **Blanks** | the exact words, with the sentence as a cue | cued recall |
| **Order** | the sequence of clauses | serial recall |
| **Skeleton** | the whole passage with thinning scaffolding | progressive fading |
| **Recite** | the whole passage from nothing | free recall |
| **Locate** | the link between a rule and its citation | paired-associate |

Recognition drills (pick the right answer from four) are deliberately limited to
Locate. Choosing from a list feels like progress without producing much of it —
generating the answer is what builds durable memory.
