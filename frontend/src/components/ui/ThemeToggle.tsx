"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <Button
        size="icon"
        variant="outline"
        aria-label="Toggle theme"
        className="border-slate-200 bg-slate-100 dark:border-white/[0.08] dark:bg-white/[0.04]"
        disabled
      />
    )
  }

  const isDark = resolvedTheme === "dark"

  return (
    <Button
      size="icon"
      variant="outline"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/50 dark:hover:bg-white/[0.07] dark:hover:text-white/80"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}
