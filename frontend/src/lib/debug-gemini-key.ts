import { getGeminiKeyMode, getCustomGeminiKey, hasCustomGeminiKey } from "./gemini-storage"

export function debugGeminiKeyConfig() {
  const mode = getGeminiKeyMode()
  const customKey = getCustomGeminiKey()
  const hasKey = hasCustomGeminiKey()
  
  const rawMode = localStorage.getItem("gf_gemini_key_mode")
  const rawKey = localStorage.getItem("gf_gemini_custom_key")
  
  return {
    mode,
    hasKey,
    keyLength: customKey.length,
    rawMode,
    rawKeyLength: rawKey?.length || 0
  }
}

if (typeof window !== "undefined") {
  (window as any).debugGeminiKey = debugGeminiKeyConfig
}
