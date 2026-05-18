/** Browser-local Gemini API key — never sent to or stored on the server. */

export type GeminiKeyMode = "app" | "custom"

const KEY_MODE = "gf_gemini_key_mode"
const CUSTOM_KEY = "gf_gemini_custom_key"

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
}

export function getCustomGeminiKey(): string {
  if (typeof window === "undefined") return ""
  return localStorage.getItem(CUSTOM_KEY) || ""
}

export function setCustomGeminiKey(key: string): void {
  const trimmed = key.trim()
  if (trimmed) {
    localStorage.setItem(CUSTOM_KEY, trimmed)
    localStorage.setItem(KEY_MODE, "custom")
  } else {
    localStorage.removeItem(CUSTOM_KEY)
    localStorage.setItem(KEY_MODE, "app")
  }
}

export function clearCustomGeminiKey(): void {
  localStorage.removeItem(CUSTOM_KEY)
  localStorage.setItem(KEY_MODE, "app")
}

export function hasCustomGeminiKey(): boolean {
  return getGeminiKeyMode() === "custom" && getCustomGeminiKey().length > 0
}
