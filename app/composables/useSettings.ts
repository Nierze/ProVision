/**
 * User preferences. One shared reactive object, written back to localStorage on
 * every change — there is no "save" button anywhere in the app.
 */

const KEY = 'provision.settings.v1'

export interface Settings {
  theme: 'dark' | 'light'
  /** Blank the words that carry the rule before the grammatical glue. */
  keyWordsFirst: boolean
  /** Equal-width blanks, so word length stops being a free clue. */
  hideWordLengths: boolean
  /** Provisions per session. */
  sessionLength: number
  /** Experience to earn each day. */
  dailyGoal: number
}

const DEFAULTS: Settings = {
  theme: 'dark',
  keyWordsFirst: true,
  hideWordLengths: false,
  sessionLength: 8,
  dailyGoal: 60,
}

const settings = reactive<Settings>(readJson(KEY, DEFAULTS))

/**
 * Detached scope: these watchers belong to the module, not to whichever
 * component happened to call useSettings() first, so they keep running after
 * that component unmounts.
 */
let started = false

export function useSettings() {
  if (!started && typeof window !== 'undefined') {
    started = true
    effectScope(true).run(() => {
      watch(settings, value => writeJson(KEY, value), { deep: true })
      watch(() => settings.theme, applyTheme, { immediate: true })
    })
  }

  return {
    settings,
    toggleTheme: () => {
      settings.theme = settings.theme === 'dark' ? 'light' : 'dark'
    },
    resetSettings: () => Object.assign(settings, DEFAULTS),
  }
}

function applyTheme(theme: Settings['theme']) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'dark' ? '#1a1424' : '#f6f1fb')
}
