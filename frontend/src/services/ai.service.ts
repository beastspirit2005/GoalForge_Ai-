export type GeneratePlanPayload = {
  title: string
  description: string
  target: string
  deadline: string
  provider?: string
  model?: string | null
}

export type GeneratePlanResponse = {
  milestones: string[]
  recommendation: string
  risk: "Low" | "Medium" | "High"
  source: "gemini" | "fallback"
  raw_response?: string
}

import { API_URL } from "@/lib/api"

export function createLocalGoalPlan(payload: GeneratePlanPayload): GeneratePlanResponse {
  const title = payload.title.trim() || "this goal"
  const target = payload.target.trim() || "the target metric"

  return {
    milestones: [
      `Confirm the baseline and success metric for ${title}`,
      `Identify the highest-impact workstream for ${target}`,
      "Run the first execution sprint and capture progress evidence",
      "Review blockers with the manager and adjust scope",
      "Summarize outcomes and prepare the final check-in",
    ],
    recommendation:
      "Start with the smallest measurable slice, review progress every week, and escalate blockers early so the goal does not wait until deadline week.",
    risk: payload.deadline ? "Medium" : "High",
    source: "fallback",
    raw_response: "Generated locally without an external AI API key.",
  }
}

export async function generateGoalPlan(
  payload: GeneratePlanPayload
): Promise<GeneratePlanResponse> {
  try {
    const response = await fetch(`${API_URL}/ai/generate-plan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      return createLocalGoalPlan(payload)
    }

    return response.json()
  } catch {
    return createLocalGoalPlan(payload)
  }
}
