/**
 * Read-aloud. Hearing a provision while reading it gives you a second route
 * back to the same memory, which is worth more than it sounds for text you
 * intend to recite.
 *
 * Wraps the browser's own speech synthesis — no network, no dependency.
 */
export function useSpeech() {
  const speaking = ref(false)

  const supported = computed(
    () => typeof window !== 'undefined' && 'speechSynthesis' in window,
  )

  function stop() {
    if (supported.value) window.speechSynthesis.cancel()
    speaking.value = false
  }

  function speak(text: string) {
    if (!supported.value) return
    stop()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.85 // legal text read at conversational speed is a blur
    utterance.onend = utterance.onerror = stop

    window.speechSynthesis.speak(utterance)
    speaking.value = true
  }

  function toggle(text: string) {
    if (speaking.value) stop()
    else speak(text)
  }

  // Leaving the page mid-sentence should not leave a voice running.
  onScopeDispose(stop)

  return { speaking, supported, speak, stop, toggle }
}
