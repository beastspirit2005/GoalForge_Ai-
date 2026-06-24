"use client"

import { useRef, useState, useEffect } from "react"
import { Brain, CalendarDays, Loader2, Plus, Send, Target } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import MilestoneCard from "@/components/ai/MilestoneCard"
import RecommendationBox from "@/components/ai/RecommendationBox"
import GoalStatusBadge from "@/components/goals/GoalStatusBadge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { addLocalDemoGoal } from "@/lib/local-demo-goals"
import { generateGoalPlan, createLocalGoalPlan, type GeneratePlanResponse } from "@/services/ai.service"
import { createGoal, generateGoalPlan as generateStoredGoalPlan } from "@/services/goal.service"
import { getStoredToken } from "@/services/auth.service"
import { useAuth } from "@/hooks/useAuth"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"


const generatedMilestones = [
  { title: "Clarify measurable outcome and success metric", due: "Week 1" },
  { title: "Break work into owner-based execution tasks", due: "Week 2" },
  { title: "Run first progress check-in and update risk", due: "Week 3" },
  { title: "Review blockers with manager and adjust scope", due: "Week 4" },
  { title: "Finalize result summary and demo evidence", due: "Final week" },
]

export default function GoalForm() {
  const router = useRouter()
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const taskId = searchParams.get("task_id")
  const taskTitle = searchParams.get("task_title")
  const isSavingRef = useRef(false)
  const [generated, setGenerated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [plan, setPlan] = useState<GeneratePlanResponse | null>(null)
  const [aiProvider, setAiProvider] = useState("gemini")
  const [aiModel, setAiModel] = useState("gemini-2.5-flash")
  const [ollamaModels, setOllamaModels] = useState<string[]>([])

  useEffect(() => {
    if (aiProvider === "ollama") {
      fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/ai/models`)
        .then(res => res.json())
        .then(data => {
          if (data && data.models && data.models.length > 0) {
            setOllamaModels(data.models)
            if (!data.models.includes(aiModel)) {
              setAiModel(data.models[0])
            }
          } else {
            setOllamaModels(["llama3:8b", "mistral:latest", "qwen3.6:latest"])
          }
        })
        .catch(err => {
          console.warn("Could not fetch Ollama models from backend", err)
          setOllamaModels(["llama3:8b", "mistral:latest", "qwen3.6:latest"])
        })
    }
  }, [aiProvider])

  const [form, setForm] = useState({
    title: "Increase product activation rate",
    deadline: "2026-06-30",
    description:
      "Improve new user activation by identifying drop-off points and running experiments across onboarding.",
    target: "Move activation from 42% to 60%",
  })

  const handleGenerate = async () => {
    setLoading(true)
    setError("")
    setMessage("")

    const response = await generateGoalPlan({
      ...form,
      provider: aiProvider,
      model: aiModel
    })
    setPlan(response)
    setGenerated(true)
    if (response.source === "fallback") {
      setError("Using local AI fallback. No external API key needed.")
    }
    setLoading(false)
  }

  const handleAddGoal = async () => {
    if (isSavingRef.current) return // Prevent duplicate/triple click submissions
    isSavingRef.current = true
    setSaving(true)
    setError("")
    setMessage("")

    try {
      const activePlan = plan ?? createLocalGoalPlan(form)

      if (!plan) {
        setPlan(activePlan)
        setGenerated(true)
      }

      // 1. Always write to the local session storage so the goal shows up immediately 
      // in the employee dashboard and manager approvals queue with a valid, matching goalId.
      addLocalDemoGoal({
        ...form,
        plan: activePlan,
        ownerName: user?.name || undefined,
        ownerDept: user?.department || undefined,
      })

      // 2. Asynchronously sync to backend database if a session token is active
      const token = getStoredToken()
      if (token) {
        try {
          const goal = await createGoal({
            title: form.title,
            description: form.description,
            target: form.target,
            deadline: form.deadline,
            weightage: 25,
            task_id: taskId ? parseInt(taskId) : undefined,
          })
          await generateStoredGoalPlan(goal.id, aiProvider, aiModel)
        } catch (apiErr) {
          console.warn("Backend database sync bypassed: API server is offline.", apiErr)
        }
      }

      setMessage("Goal successfully created!")
      router.push("/employee/goals")
    } catch (err) {
      console.error("Failed to create goal locally", err)
      setError("Failed to create goal in this session.")
    } finally {
      isSavingRef.current = false
      setSaving(false)
    }
  }

  const visibleMilestones =
    plan?.milestones.map((title, index) => ({
      title,
      due: generatedMilestones[index]?.due ?? `Week ${index + 1}`,
    })) ?? generatedMilestones

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_440px]">
      <Card className="product-surface rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-950">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-sky-100 text-sky-700">
              <Target className="h-5 w-5" />
            </span>
            Create an AI-powered goal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {taskId && taskTitle && (
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-3 mb-4">
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Creating goal under task</p>
              <p className="text-sm text-emerald-900 dark:text-emerald-200 font-medium mt-1">{taskTitle}</p>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Goal title
              <Input
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({ ...current, title: event.target.value }))
                }
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Deadline
              <Input
                value={form.deadline}
                type="date"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    deadline: event.target.value,
                  }))
                }
              />
            </label>
          </div>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            Description
            <Textarea
              className="min-h-28"
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            Target metric
            <Input
              value={form.target}
              onChange={(event) =>
                setForm((current) => ({ ...current, target: event.target.value }))
              }
            />
          </label>
          {/* AI Settings */}
          <div className="grid gap-4 sm:grid-cols-2 p-3 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] rounded-lg">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">AI Provider</span>
              <Select value={aiProvider} onValueChange={(val) => {
                setAiProvider(val)
                if (val === "ollama") {
                  setAiModel(ollamaModels[0] || "llama3:8b")
                } else {
                  setAiModel("gemini-2.5-flash")
                }
              }}>
                <SelectTrigger className="h-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs">
                  <SelectValue placeholder="Select AI Provider" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs">
                  <SelectItem value="gemini">Gemini (Cloud)</SelectItem>
                  <SelectItem value="ollama">Ollama (Local)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">AI Model</span>
              {aiProvider === "ollama" ? (
                <Select value={aiModel} onValueChange={setAiModel}>
                  <SelectTrigger className="h-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs">
                    <SelectValue placeholder="Select Ollama Model" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs">
                    {ollamaModels.length > 0 ? (
                      ollamaModels.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="llama3:8b">llama3:8b</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              ) : (
                <Select value={aiModel} onValueChange={setAiModel}>
                  <SelectTrigger className="h-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs">
                    <SelectValue placeholder="Select Gemini Model" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs">
                    <SelectItem value="gemini-2.5-flash">gemini-2.5-flash</SelectItem>
                    <SelectItem value="gemini-2.5-pro">gemini-2.5-pro</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              className="h-11 gap-2 bg-slate-950 text-white text-sm shadow-lg shadow-slate-200 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              disabled={loading || saving}
              onClick={handleGenerate}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Brain className="h-4 w-4" />
              )}
              {loading ? "Generating..." : "Generate AI plan"}
            </Button>
            <Button
              className="h-11 gap-2 text-sm"
              disabled={loading || saving || !form.title.trim()}
              onClick={handleAddGoal}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {saving ? "Adding..." : "Add goal"}
            </Button>
          </div>
          {error ? <p className="text-sm text-amber-700">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="product-surface rounded-xl p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
              <CalendarDays className="h-4 w-4 text-sky-600" />
              Generated plan preview
            </div>
            {plan ? <GoalStatusBadge risk={plan.risk} /> : null}
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {plan?.source?.includes("ollama")
              ? `Generated by local Ollama (${plan.source.split("(")[1]?.replace(")", "") || "model"}) via backend.`
              : plan?.source === "gemini"
              ? "Generated by Gemini through the FastAPI backend."
              : "Generated locally with the built-in fallback. No API key is required."}
          </p>
        </div>

        {generated ? (
          <>
            <div className="space-y-3">
              {visibleMilestones.map((milestone) => (
                <MilestoneCard
                  key={milestone.title}
                  title={milestone.title}
                  due={milestone.due}
                />
              ))}
            </div>
            <RecommendationBox
              text={
                plan?.recommendation ??
                "Start with the onboarding drop-off segment that has the highest user volume, then run two experiments before changing the full journey."
              }
            />
          </>
        ) : (
          <div className="grid min-h-72 place-items-center rounded-xl border border-dashed border-slate-300 bg-white/70 p-6 text-center shadow-inner">
            <div>
              <Send className="mx-auto h-8 w-8 text-slate-400" />
              <p className="mt-3 text-sm font-medium text-slate-700">
                Click generate to create milestones and AI guidance.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
