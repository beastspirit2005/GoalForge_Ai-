/** Browser-local Gemini API key — never persisted on the server. */

export type GeminiKeyMode = "app" | "custom"

const KEY_MODE = "gf_gemini_key_mode"
const CUSTOM_KEY = "gf_gemini_custom_key"
export const GEMINI_KEY_CHANGED_EVENT = "gf-gemini-key-changed"

export function normalizeGeminiKey(raw: string): string {
  return raw.trim().replace(/^["']+|["']+$/g, "")
}

export function getGeminiKeyMode(): GeminiKeyMode {
  if (typeof window === "undefined") return "app"
  const mode = localStorage.getItem(KEY_MODE)
  return mode === "custom" ? "custom" : "app"
}

export function setGeminiKeyMode(mode: GeminiKeyMode): void {
  localStorage.setItem(KEY_MODE, mode)
  if (mode === "app") {
    localStorage.removeItem(CUSTOM_KEY)
  }
  notifyKeyChanged()
}

export function getCustomGeminiKey(): string {
  if (typeof window === "undefined") return ""
  const stored = localStorage.getItem(CUSTOM_KEY)
  return stored ? normalizeGeminiKey(stored) : ""
}

/** Saved key, or a non-empty draft from the input field. */
export function resolveCustomGeminiKey(draft = ""): string {
  const fromStorage = getCustomGeminiKey()
  if (fromStorage) return fromStorage
  const fromDraft = normalizeGeminiKey(draft)
  return fromDraft
}

export function setCustomGeminiKey(key: string): void {
  const trimmed = normalizeGeminiKey(key)
  if (trimmed) {
    localStorage.setItem(CUSTOM_KEY, trimmed)
    localStorage.setItem(KEY_MODE, "custom")
  } else {
    localStorage.removeItem(CUSTOM_KEY)
    localStorage.setItem(KEY_MODE, "app")
  }
  notifyKeyChanged()
}

export function clearCustomGeminiKey(): void {
  localStorage.removeItem(CUSTOM_KEY)
  localStorage.setItem(KEY_MODE, "app")
  notifyKeyChanged()
}

export function hasCustomGeminiKey(draft = ""): boolean {
  return getGeminiKeyMode() === "custom" && resolveCustomGeminiKey(draft).length > 0
}

export function notifyKeyChanged(): void {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event(GEMINI_KEY_CHANGED_EVENT))
}

export function syncGeminiKeyFromStorage(): {
  mode: GeminiKeyMode
  key: string
} {
  return {
    mode: getGeminiKeyMode(),
    key: getCustomGeminiKey(),
  }
}
