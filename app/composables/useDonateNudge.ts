/**
 * A friendly, rate-limited nudge to donate. Any completion screen can call
 * notify() — it only actually surfaces the banner once per COOLDOWN, so
 * finishing three drills in five minutes doesn't turn into three prompts.
 */

const KEY = 'provision.donate-nudge.v1'
const COOLDOWN = 30 * 60 * 1000

const visible = ref(false)

export function useDonateNudge() {
  return {
    visible,
    notify() {
      if (typeof window === 'undefined') return
      const { at } = readJson(KEY, { at: 0 })
      const now = Date.now()
      // A clock that jumped backwards shouldn't lock the nudge out indefinitely.
      if (at && at <= now && now - at < COOLDOWN) return
      writeJson(KEY, { at: now })
      visible.value = true
    },
    dismiss() {
      visible.value = false
    },
  }
}
