import { MAX_GOALS, MIN_WEIGHTAGE, TARGET_WEIGHTAGE } from "./constants"

export type ValidationError = string | null

export function validateGoalTitle(title: string): ValidationError {
  if (!title.trim()) return "Title is required"
  if (title.length < 3) return "Title must be at least 3 characters"
  if (title.length > 255) return "Title must be under 255 characters"
  return null
}

export function validateWeightage(
  weightage: number,
  currentTotal: number,
  excludeWeightage: number = 0,
): ValidationError {
  if (weightage < MIN_WEIGHTAGE) return `Minimum weightage is ${MIN_WEIGHTAGE}%`
  if (weightage > 100) return "Maximum weightage is 100%"

  const projected = currentTotal - excludeWeightage + weightage
  if (projected > TARGET_WEIGHTAGE) {
    const available = TARGET_WEIGHTAGE - (currentTotal - excludeWeightage)
    return `Total weightage would exceed 100%. Available: ${available.toFixed(1)}%`
  }
  return null
}

export function validateGoalCount(currentCount: number): ValidationError {
  if (currentCount >= MAX_GOALS) return `Maximum ${MAX_GOALS} goals allowed`
  return null
}

export function validateDeadline(deadline: string): ValidationError {
  if (!deadline) return null // optional
  const d = new Date(deadline)
  if (isNaN(d.getTime())) return "Invalid date"
  if (d < new Date()) return "Deadline cannot be in the past"
  return null
}
