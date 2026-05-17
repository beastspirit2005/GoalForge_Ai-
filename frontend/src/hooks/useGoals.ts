"use client"

import { useCallback, useState } from "react"
import type { Goal, GoalCreatePayload, GoalUpdatePayload } from "@/types/goal"
import * as goalService from "@/services/goal.service"

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchGoals = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await goalService.getGoals()
      setGoals(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch goals")
    } finally {
      setLoading(false)
    }
  }, [])

  const create = useCallback(async (data: GoalCreatePayload) => {
    setLoading(true)
    try {
      const goal = await goalService.createGoal(data)
      setGoals((prev) => [goal, ...prev])
      return goal
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create goal")
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const update = useCallback(async (id: number, data: GoalUpdatePayload) => {
    setLoading(true)
    try {
      const goal = await goalService.updateGoal(id, data)
      setGoals((prev) => prev.map((g) => (g.id === id ? goal : g)))
      return goal
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update goal")
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const remove = useCallback(async (id: number) => {
    try {
      await goalService.deleteGoal(id)
      setGoals((prev) => prev.filter((g) => g.id !== id))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete goal")
    }
  }, [])

  const submit = useCallback(async (id: number) => {
    try {
      const goal = await goalService.submitGoal(id)
      setGoals((prev) => prev.map((g) => (g.id === id ? goal : g)))
      return goal
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit goal")
    }
  }, [])

  return { goals, loading, error, fetchGoals, create, update, remove, submit }
}
