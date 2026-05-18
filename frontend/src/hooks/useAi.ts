"use client"

import { useCallback, useState } from "react"

export type AIPlan = {
  milestones: string[]
  recommendation: string
  risk: "Low" | "Medium" | "High"
  source: "gemini" | "fallback"
  raw_response?: string
}

import { API_URL } from "@/lib/api"

export function useAi() {
  const [plan, setPlan] = useState<AIPlan | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generatePlan = useCallback(
    async (data: { title: string; description: string; target: string; deadline: string }) => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`${API_URL}/ai/generate-plan`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
        if (!res.ok) throw new Error("Failed to generate plan")
        const result: AIPlan = await res.json()
        setPlan(result)
        return result
      } catch (err) {
        const msg = err instanceof Error ? err.message : "AI generation failed"
        setError(msg)
        // Return fallback plan
        const fallback: AIPlan = {
          milestones: [
            `Clarify the success metric for ${data.title}`,
            "Break the work into weekly execution tasks",
            "Complete the first progress check-in",
            "Review blockers with the manager",
            "Finalize outcomes and prepare demo evidence",
          ],
          recommendation:
            "Start with the highest-impact task this week, then use each check-in to remove blockers.",
          risk: "Medium",
          source: "fallback",
        }
        setPlan(fallback)
        return fallback
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  const refineGoal = useCallback(async (rawGoal: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/ai/refine-goal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_goal: rawGoal }),
      })
      if (!res.ok) throw new Error("Failed to refine goal")
      return await res.json()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Refinement failed")
      return {
        refined_title: rawGoal.slice(0, 80),
        refined_description: `Achieve measurable progress on: ${rawGoal}`,
        suggested_target: "Define a specific quantifiable target",
        source: "fallback",
      }
    } finally {
      setLoading(false)
    }
  }, [])

  return { plan, loading, error, generatePlan, refineGoal }
}
