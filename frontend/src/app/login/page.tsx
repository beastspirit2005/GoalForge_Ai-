"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { BarChart3, BriefcaseBusiness, UserRound, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/useAuth"
import { isDemoAuthAllowed } from "@/lib/env"
import type { DemoRole } from "@/lib/mock-auth"

const roles = [
  {
    key: "employee" as DemoRole,
    label: "Employee",
    desc: "Create goals, track performance, earn badges.",
    icon: UserRound,
    gradient: "from-sky-500 to-indigo-500",
    border: "hover:border-sky-300/60",
    bg: "hover:bg-sky-50/40",
  },
  {
    key: "manager" as DemoRole,
    label: "Manager",
    desc: "Review teams, predictions, and approvals.",
    icon: BriefcaseBusiness,
    gradient: "from-emerald-500 to-teal-500",
    border: "hover:border-emerald-300/60",
    bg: "hover:bg-emerald-50/40",
  },
  {
    key: "admin" as DemoRole,
    label: "Admin",
    desc: "Org-wide analytics, escalations, cycles.",
    icon: BarChart3,
    gradient: "from-violet-500 to-fuchsia-500",
    border: "hover:border-violet-300/60",
    bg: "hover:bg-violet-50/40",
  },
]

export default function LoginPage() {
  const router = useRouter()
  const { login, loginWithApi, requestOtpCode, loginWithOtp } = useAuth()

  const [authMode, setAuthMode] = useState<"PASSWORD" | "OTP_EMAIL" | "OTP_CODE">("PASSWORD")
  const [email, setEmail] = useState("employee@goalforge.ai")
  const [password, setPassword] = useState("password123")
  const [otpEmail, setOtpEmail] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  const handleLogin = async (role: DemoRole) => {
    setLoading(true)
    setError("")
    try {
      const emailMap: Record<DemoRole, string> = {
        employee: "employee@goalforge.ai",
        manager: "manager@goalforge.ai",
        admin: "admin@goalforge.ai",
      }
      const path = await loginWithApi(emailMap[role], "password123")
      router.push(path)
    } catch (err: any) {
      if (err?.message?.includes("pending admin approval")) {
        setError(err.message)
      } else if (isDemoAuthAllowed()) {
        console.warn(`API login failed for role ${role}, falling back to mock:`, err)
        router.push(login(role))
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Could not reach the API. Check that the backend is deployed and DATABASE_URL is set on Vercel."
        )
      }
    } finally {
      setLoading(false)
    }
  }

  const handleApiLogin = async () => {
    setLoading(true)
    setError("")
    try {
      const path = await loginWithApi(email, password)
      router.push(path)
    } catch (err: any) {
      if (err?.message?.includes("pending admin approval")) {
        setError(err.message)
      } else if (isDemoAuthAllowed()) {
        console.warn("API login failed, falling back to mock:", err)
        let role: DemoRole = "employee"
        const lowerEmail = email.toLowerCase()
        if (lowerEmail.includes("manager")) role = "manager"
        else if (lowerEmail.includes("admin")) role = "admin"
        router.push(login(role))
      } else {
        setError(err instanceof Error ? err.message : "Sign-in failed. Please check your email and password.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRequestOtp = async () => {
    setLoading(true)
    setError("")
    setSuccessMsg("")
    try {
      const res = await requestOtpCode(otpEmail)
      setSuccessMsg(res?.message || "OTP sent to your email! Check your inbox.")
      setAuthMode("OTP_CODE")
    } catch (err: any) {
      setError(err?.message || "Failed to send OTP.")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    setLoading(true)
    setError("")
    try {
      const path = await loginWithOtp(otpEmail, otpCode)
      router.push(path)
    } catch (err: any) {
      if (err?.message?.includes("pending admin approval")) {
        setError(err.message)
      } else if (isDemoAuthAllowed()) {
        console.warn("API OTP verification failed, falling back to mock:", err)
        router.push(login("employee"))
      } else {
        setError(err instanceof Error ? err.message : "OTP verification failed.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden p-6 bg-slate-50 text-slate-800 selection:bg-indigo-500/10 selection:text-indigo-900">
      {/* Background orbs */}
      <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-indigo-500/5 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-violet-500/5 blur-[100px]" />

      <div className="relative z-10 w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-100">
        <div className="grid h-full gap-0 lg:grid-cols-[0.9fr_1.2fr]">
          {/* Left Panel: Authentication Forms */}
          <div className="flex h-full flex-col justify-center rounded-t-2xl border-r border-slate-100 bg-slate-50/50 p-8 lg:rounded-none lg:rounded-l-2xl">
            <Link href="/" className="inline-flex items-center gap-2 transition-opacity hover:opacity-80">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-650/10 border border-indigo-500/20 text-indigo-600 shadow-sm">
                <Zap className="h-4 w-4 fill-indigo-600/10" />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-600">
                GoalForge AI
              </p>
            </Link>
            <h1 className="mt-6 text-3xl font-extrabold leading-tight tracking-tight text-slate-900">
              Sign in to your workspace
            </h1>
            <p className="mt-2 text-[13px] leading-6 text-slate-500 font-medium">
              AI-powered performance intelligence for teams.
            </p>

            <div className="mt-6 space-y-3">
              {authMode === "PASSWORD" && (
                <>
                  <Input
                    className="h-10 rounded-lg border-slate-200 bg-white text-[13px] text-slate-800 placeholder:text-slate-400 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 focus-visible:ring-2"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                  />
                  <Input
                    className="h-10 rounded-lg border-slate-200 bg-white text-[13px] text-slate-800 placeholder:text-slate-400 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 focus-visible:ring-2"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    type="password"
                  />
                  {error && <p className="text-[12px] text-rose-600 font-medium">{error}</p>}
                  <Button
                    className="h-10 w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 text-[13px] font-semibold text-white shadow-md shadow-indigo-600/10 transition-all"
                    onClick={handleApiLogin}
                    disabled={loading}
                  >
                    {loading ? "Signing in..." : "Sign in"}
                  </Button>
                  <Button
                    variant="link"
                    className="h-8 w-full text-[12px] text-slate-400 hover:text-slate-600 font-semibold"
                    onClick={() => { setAuthMode("OTP_EMAIL"); setError("") }}
                  >
                    Login via Email OTP instead
                  </Button>
                </>
              )}

              {authMode === "OTP_EMAIL" && (
                <>
                  <p className="text-[12px] text-slate-550 font-medium">Enter your registered email to receive a one-time login code.</p>
                  <Input
                    className="h-10 rounded-lg border-slate-200 bg-white text-[13px] text-slate-800 placeholder:text-slate-400 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 focus-visible:ring-2"
                    value={otpEmail}
                    onChange={(e) => setOtpEmail(e.target.value)}
                    placeholder="your@email.com"
                    type="email"
                  />
                  {error && <p className="text-[12px] text-rose-600 font-medium">{error}</p>}
                  <Button
                    className="h-10 w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 text-[13px] font-semibold text-white shadow-md shadow-indigo-600/10 transition-all"
                    onClick={handleRequestOtp}
                    disabled={loading || !otpEmail}
                  >
                    {loading ? "Sending..." : "Send OTP"}
                  </Button>
                  <Button
                    variant="link"
                    className="h-8 w-full text-[12px] text-slate-400 hover:text-slate-600 font-semibold"
                    onClick={() => { setAuthMode("PASSWORD"); setError("") }}
                  >
                    Back to password login
                  </Button>
                </>
              )}

              {authMode === "OTP_CODE" && (
                <>
                  <p className="text-[12px] text-emerald-600 font-semibold">{successMsg}</p>
                  <Input
                    className="h-12 rounded-lg border-slate-200 bg-white text-center text-lg tracking-[0.4em] text-slate-800 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 focus-visible:ring-2"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="------"
                    maxLength={6}
                  />
                  {error && <p className="text-[12px] text-rose-600 font-medium">{error}</p>}
                  <Button
                    className="h-10 w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 text-[13px] font-semibold text-white shadow-md shadow-indigo-600/10 transition-all"
                    onClick={handleVerifyOtp}
                    disabled={loading || otpCode.length < 6}
                  >
                    {loading ? "Verifying..." : "Verify & Login"}
                  </Button>
                  <Button
                    variant="link"
                    className="h-8 w-full text-[12px] text-slate-400 hover:text-slate-600 font-semibold"
                    onClick={() => { setAuthMode("OTP_EMAIL"); setOtpCode(""); setError(""); setSuccessMsg("") }}
                  >
                    Resend OTP
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Right Panel: Quick-Login Demo Account Shortcuts */}
          <div className="grid gap-4 p-6 sm:grid-cols-3 lg:p-8 lg:content-center">
            <div className="col-span-full mb-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                Quick sign-in
              </p>
              <p className="mt-1 text-[12px] text-slate-500 font-medium">
                {isDemoAuthAllowed()
                  ? "Demo fallback if API is offline, or use seeded accounts when API is live."
                  : "Uses your deployed API (seeded accounts: password123)."}
              </p>
            </div>
            {roles.map((role) => {
              const Icon = role.icon
              return (
                <button
                  key={role.key}
                  className={`group rounded-xl border border-slate-200 bg-white p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${role.border} ${role.bg}`}
                  onClick={() => handleLogin(role.key)}
                >
                  <span className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${role.gradient} text-white shadow-md transition-transform duration-300 group-hover:scale-110`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="mt-4 text-[14px] font-semibold text-slate-800">{role.label}</p>
                  <p className="mt-1 text-[12px] text-slate-400 font-medium">{role.desc}</p>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
