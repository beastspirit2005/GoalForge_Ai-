/** Debug utility to check Gemini key configuration */

import { getGeminiKeyMode, getCustomGeminiKey, hasCustomGeminiKey } from "./gemini-storage"

export function debugGeminiKeyConfig() {
  console.group("🔍 Gemini Key Debug Info")
  
  const mode = getGeminiKeyMode()
  const customKey = getCustomGeminiKey()
  const hasKey = hasCustomGeminiKey()
  
  console.log("Key Mode:", mode)
  console.log("Has Custom Key:", hasKey)
  console.log("Custom Key Length:", customKey.length)
  console.log("Custom Key Preview:", customKey ? `${customKey.substring(0, 15)}...` : "NONE")
  
  // Check localStorage directly
  const rawMode = localStorage.getItem("gf_gemini_key_mode")
  const rawKey = localStorage.getItem("gf_gemini_custom_key")
  
  console.log("Raw localStorage mode:", rawMode)
  console.log("Raw localStorage key length:", rawKey?.length || 0)
  
  console.groupEnd()
  
  return { mode, hasKey, keyLength: customKey.length }
}

// Make it available globally for easy debugging
if (typeof window !== "undefined") {
  (window as any).debugGeminiKey = debugGeminiKeyConfig
}

// Made with Bob
