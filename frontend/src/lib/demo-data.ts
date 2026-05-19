import {
  AlertTriangle,
  BarChart3,
  Brain,
  CheckCircle2,
  Clock3,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react"

export type GoalRisk = "Low" | "Medium" | "High"
export type GoalStatus = "On Track" | "Needs Review" | "At Risk" | "Completed" | "Pending Approval" | "Approved" | "Approved after Editing" | "Rejected" | "Escalated"

export type Goal = {
  id: string
  title: string
  owner: string
  department: string
  progress: number
  deadline: string
  status: GoalStatus
  risk: GoalRisk
  target: string
  recommendation: string
  milestones: {
    title: string
    due: string
    done: boolean
  }[]
}

export const demoGoals: Goal[] = [
  {
    id: "GF-101",
    title: "Launch AI onboarding playbook",
    owner: "Aarav Mehta",
    department: "People Ops",
    progress: 72,
    deadline: "28 Jun 2026",
    status: "On Track",
    risk: "Low",
    target: "Publish onboarding journey and reduce ramp time by 20%",
    recommendation:
      "Record the first three mentor sessions this week and convert repeat questions into checklist items.",
    milestones: [
      { title: "Map first-week employee journey", due: "20 May", done: true },
      { title: "Draft AI FAQ prompts", due: "28 May", done: true },
      { title: "Pilot with 6 new hires", due: "10 Jun", done: false },
      { title: "Measure ramp-time delta", due: "21 Jun", done: false },
    ],
  },
  {
    id: "GF-117",
    title: "Improve sprint delivery predictability",
    owner: "Neha Rao",
    department: "Engineering",
    progress: 46,
    deadline: "12 Jul 2026",
    status: "Needs Review",
    risk: "Medium",
    target: "Raise planned-to-done ratio from 61% to 82%",
    recommendation:
      "Split the two largest workstreams before the next planning meeting and flag dependency owners early.",
    milestones: [
      { title: "Audit spillover themes", due: "22 May", done: true },
      { title: "Create dependency board", due: "02 Jun", done: false },
      { title: "Run two planning calibration sessions", due: "20 Jun", done: false },
      { title: "Publish predictability report", due: "08 Jul", done: false },
    ],
  },
  {
    id: "GF-124",
    title: "Grow enterprise pipeline",
    owner: "Kabir Singh",
    department: "Sales",
    progress: 31,
    deadline: "30 Jun 2026",
    status: "At Risk",
    risk: "High",
    target: "Add 35 qualified enterprise opportunities",
    recommendation:
      "Prioritize accounts with active procurement signals and schedule manager review for stalled prospects.",
    milestones: [
      { title: "Refresh ICP account list", due: "18 May", done: true },
      { title: "Launch procurement-signal outreach", due: "29 May", done: false },
      { title: "Book 18 discovery calls", due: "14 Jun", done: false },
      { title: "Convert 9 opportunities", due: "27 Jun", done: false },
    ],
  },
]

export const stats = [
  {
    label: "Active goals",
    value: "24",
    change: "+6 this cycle",
    icon: Target,
    tone: "sky",
  },
  {
    label: "Completion rate",
    value: "78%",
    change: "+12% vs last month",
    icon: CheckCircle2,
    tone: "emerald",
  },
  {
    label: "AI plans generated",
    value: "41",
    change: "18 this week",
    icon: Sparkles,
    tone: "violet",
  },
  {
    label: "Risk alerts",
    value: "5",
    change: "2 need manager input",
    icon: AlertTriangle,
    tone: "amber",
  },
]

export const departmentProgress = [
  { name: "Engineering", progress: 69, goals: 8 },
  { name: "Sales", progress: 58, goals: 6 },
  { name: "People Ops", progress: 81, goals: 4 },
  { name: "Marketing", progress: 74, goals: 6 },
]

export const weeklyMomentum = [
  { week: "W1", value: 42 },
  { week: "W2", value: 49 },
  { week: "W3", value: 57 },
  { week: "W4", value: 68 },
  { week: "W5", value: 78 },
]

export const managerQueue = [
  {
    employee: "Kabir Singh",
    request: "Revise pipeline goal deadline",
    impact: "High revenue impact",
    status: "Pending",
  },
  {
    employee: "Neha Rao",
    request: "Approve dependency review milestone",
    impact: "Delivery risk reduction",
    status: "Pending",
  },
  {
    employee: "Aarav Mehta",
    request: "Close onboarding journey milestone",
    impact: "Cycle progress +8%",
    status: "Ready",
  },
]

export const aiInsights = [
  {
    title: "Highest risk driver",
    body: "Pipeline growth is behind target because discovery calls are not converting into qualified opportunities fast enough.",
    icon: AlertTriangle,
  },
  {
    title: "Next best action",
    body: "Move manager review earlier for Sales and reassign two account research tasks to reduce delay.",
    icon: Brain,
  },
  {
    title: "Positive signal",
    body: "People Ops goals show steady completion and can be used as the demo benchmark for AI milestone planning.",
    icon: TrendingUp,
  },
]

export const adminMetrics = [
  { label: "Total users", value: "128", icon: Users },
  { label: "Goals monitored", value: "312", icon: Target },
  { label: "Avg progress", value: "74%", icon: BarChart3 },
  { label: "Overdue check-ins", value: "9", icon: Clock3 },
]
