"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { BarChart3, BriefcaseBusiness, UserRound, Zap, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { apiFetch } from "@/lib/api"
import BrandLogo from "@/components/layout/BrandLogo"

const roles = [
  {
    key: "employee",
    label: "Employee",
    desc: "Create goals, track performance, earn badges.",
    icon: UserRound,
    gradient: "from-sky-500 to-indigo-500",
    border: "border-sky-200",
    bg: "bg-sky-50/40",
  },
  {
    key: "manager",
    label: "Manager",
    desc: "Review teams, predictions, and approvals.",
    icon: BriefcaseBusiness,
    gradient: "from-emerald-500 to-teal-500",
    border: "border-emerald-200",
    bg: "bg-emerald-50/40",
  },
  {
    key: "admin",
    label: "Admin",
    desc: "Org-wide analytics, escalations, cycles.",
    icon: BarChart3,
    gradient: "from-violet-500 to-fuchsia-500",
    border: "border-violet-200",
    bg: "bg-violet-50/40",
  },
]

export default function SignupPage() {
  const router = useRouter()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("employee")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSignup = async () => {
    setLoading(true)
    setError("")
    
    try {
      await apiFetch("/auth/register", {
        method: "POST",
        body: { name, email, password, role },
      })
      
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign-up failed.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden p-6 bg-slate-50 text-slate-800 selection:bg-indigo-500/10 selection:text-indigo-900">
      {/* Background orbs */}
      <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-indigo-500/5 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-violet-500/5 blur-[100px]" />

      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-100">
        <div className="flex flex-col justify-center bg-slate-50/50 p-8">
          <Link href="/" className="group transition-opacity hover:opacity-90">
            <BrandLogo />
          </Link>
          <h1 className="mt-6 text-3xl font-extrabold leading-tight tracking-tight text-slate-900">
            Create your account
          </h1>
          <p className="mt-2 text-[13px] leading-6 text-slate-500 font-medium">
            Join your team&apos;s GoalForge workspace.
          </p>

          {success ? (
            <div className="mt-8 flex flex-col items-center justify-center text-center p-6 border border-emerald-200 bg-emerald-50 rounded-xl">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-4" />
              <h2 className="text-lg font-bold text-slate-900">Registration Successful</h2>
              <p className="text-sm text-slate-600 mt-2 mb-6">
                Your account has been created and is pending admin approval. You will receive an email once it is approved.
              </p>
              <Button
                asChild
                className="h-10 px-8 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-[13px] font-semibold text-white shadow-md shadow-indigo-600/10 transition-all"
              >
                <Link href="/login">Return to Sign In</Link>
              </Button>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <Input
                className="h-10 rounded-lg border-slate-200 bg-white text-[13px] text-slate-800 placeholder:text-slate-400 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 focus-visible:ring-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
              />
              <Input
                className="h-10 rounded-lg border-slate-200 bg-white text-[13px] text-slate-800 placeholder:text-slate-400 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 focus-visible:ring-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                type="email"
              />
              <Input
                className="h-10 rounded-lg border-slate-200 bg-white text-[13px] text-slate-800 placeholder:text-slate-400 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 focus-visible:ring-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                type="password"
              />
              
              <div className="pt-2">
                <p className="text-[12px] font-semibold text-slate-700 mb-2">Select your role</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {roles.map((r) => {
                    const Icon = r.icon
                    const isSelected = role === r.key
                    return (
                      <button
                        key={r.key}
                        className={`group relative flex flex-col items-center justify-center rounded-xl border p-4 transition-all duration-300 ${
                          isSelected ? `${r.border} ${r.bg} ring-2 ring-indigo-500/50` : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                        onClick={() => setRole(r.key)}
                      >
                        <span className={`grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br ${r.gradient} text-white shadow-sm`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <p className="mt-2 text-[12px] font-bold text-slate-800">{r.label}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {error && <p className="text-[12px] text-rose-600 font-medium pt-2">{error}</p>}
              
              <Button
                className="h-10 w-full mt-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-[13px] font-semibold text-white shadow-md shadow-indigo-600/10 transition-all"
                onClick={handleSignup}
                disabled={loading || !name || !email || !password}
              >
                {loading ? "Creating account..." : "Sign Up"}
              </Button>
              
              <p className="text-center text-[12px] text-slate-500 font-medium pt-2">
                Already have an account?{" "}
                <Link href="/login" className="text-indigo-600 font-semibold hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
