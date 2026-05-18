"use client"

if (typeof window !== "undefined") {
  try {
    const testKey = "__ls_test__"
    window.localStorage.setItem(testKey, testKey)
    window.localStorage.removeItem(testKey)
  } catch (e) {
    console.warn("localStorage is blocked or threw an error. Applying in-memory fallback polyfill.")
    const memoryStorage: Record<string, string> = {}
    const mockStorage = {
      getItem: (key: string) => memoryStorage[key] || null,
      setItem: (key: string, value: string) => {
        memoryStorage[key] = String(value)
      },
      removeItem: (key: string) => {
        delete memoryStorage[key]
      },
      clear: () => {
        for (const key in memoryStorage) {
          delete memoryStorage[key]
        }
      },
      key: (index: number) => Object.keys(memoryStorage)[index] || null,
      get length() {
        return Object.keys(memoryStorage).length
      },
    }
    try {
      Object.defineProperty(window, "localStorage", {
        value: mockStorage,
        configurable: true,
        writable: true,
      })
    } catch (err) {
      console.error("Failed to redefine window.localStorage:", err)
    }
  }
}

export function LocalStoragePolyfill() {
  return null
}
