/** Direct Gemini calls from the browser — API key stays in localStorage only. */

import { normalizeGeminiKey, resolveCustomGeminiKey } from "./gemini-storage"

const GEMINI_MODEL = "gemini-pro"
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta"

function buildBuddyPrompt(query: string, context: string): string {
  return `You are 'Ai Buddy', an intelligent enterprise performance coach.
Your job is to assist employees or managers with their goals, priorities, and performance.

Context about the user's current state (goals, milestones, checkins, etc):
${context}

User Query:
${query}

Respond in a helpful, conversational, and professional tone. Keep it concise, actionable, and formatted in Markdown. Focus entirely on the user's performance and the provided context. If they ask a general question, guide it back to their goals.`
}

export async function geminiChatFromBrowser(
  query: string,
  context: string,
  apiKey?: string
): Promise<{ response: string; source: string }> {
  const key = normalizeGeminiKey(apiKey || resolveCustomGeminiKey())
  if (!key) {
    throw new Error(
      "No Gemini API key found. Open Ai Buddy settings, choose “My key”, paste your key, and click Save."
    )
  }

  const prompt = buildBuddyPrompt(query, context)
  const url = `${GEMINI_BASE}/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(key)}`

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  })

  if (!res.ok) {
    const errBody = await res.text().catch(() => "")
    let errorMessage = `Gemini API request failed (${res.status})`
    try {
      const errorData = JSON.parse(errBody) as { error?: { message?: string } }
      if (errorData.error?.message) {
        errorMessage = errorData.error.message
      }
    } catch {
      if (errBody) errorMessage = errBody.slice(0, 200)
    }
    throw new Error(errorMessage)
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }
  const text =
    data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
    "No response from Gemini."

  return { response: text, source: "gemini (your key)" }
}
