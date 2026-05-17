"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { BarChart3, BriefcaseBusiness, UserRound, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/useAuth"
import type { DemoRole } from "@/lib/mock-auth"

const roles = [
  {
    key: "employee" as DemoRole,
    label: "Employee",
    desc: "Create goals, track performance, earn badges.",
    icon: UserRound,
    gradient: "from-sky-500 to-[var(--gf-indigo)]",
    border: "hover:border-sky-500/30",
    bg: "hover:bg-sky-500/5",
  },
  {
    key: "manager" as DemoRole,
    label: "Manager",
    desc: "Review teams, predictions, and approvals.",
    icon: BriefcaseBusiness,
    gradient: "from-emerald-500 to-[var(--gf-cyan)]",
    border: "hover:border-emerald-500/30",
    bg: "hover:bg-emerald-500/5",
  },
  {
    key: "admin" as DemoRole,
    label: "Admin",
    desc: "Org-wide analytics, escalations, cycles.",
    icon: BarChart3,
    gradient: "from-violet-500 to-[var(--gf-violet)]",
    border: "hover:border-violet-500/30",
    bg: "hover:bg-violet-500/5",
  },
]

export default function LoginPage() {
  const router = useRouter()
  const { login, loginWithApi, requestOtpCode, loginWithOtp } = useAuth()

  const [authMode, setAuthMode] = useState<"PASSWORD" | "OTP_PHONE" | "OTP_CODE">("PASSWORD")
  const [email, setEmail] = useState("employee@goalforge.ai")
  const [password, setPassword] = useState("password123")
  const [phoneNumber, setPhoneNumber] = useState("+1234567890")
  const [otpCode, setOtpCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  const handleLogin = (role: DemoRole) => {
    const path = login(role)
    router.push(path)
  }

  const handleApiLogin = async () => {
    setLoading(true)
    setError("")
    try {
      const path = await loginWithApi(email, password)
      router.push(path)
    } catch (err: any) {
      setError(err?.message || "Login failed.")
    } finally {
      setLoading(false)
    }
  }

  const handleRequestOtp = async () => {
    setLoading(true)
    setError("")
    setSuccessMsg("")
    try {
      await requestOtpCode(phoneNumber)
      setSuccessMsg("OTP sent! Check console.")
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
      const path = await loginWithOtp(phoneNumber, otpCode)
      router.push(path)
    } catch (err: any) {
      setError(err?.message || "Invalid OTP.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed-dark relative grid min-h-screen place-items-center overflow-hidden p-6"
         style={{ background: "oklch(0.11 0.015 270)" }}>
      {/* Background orbs */}
      <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-[var(--gf-indigo)]/8 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[var(--gf-violet)]/6 blur-[100px]" />

      <div className="relative z-10 w-full max-w-5xl overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] shadow-[0_40px_120px_rgba(0,0,0,0.5)] backdrop-blur-xl">
        <div className="grid h-full gap-0 lg:grid-cols-[0.9fr_1.2fr]">
          {/* Left Panel: Authentication Forms */}
          <div className="flex h-full flex-col justify-center rounded-t-2xl border-r border-white/[0.06] bg-[var(--gf-surface)] p-8 lg:rounded-none lg:rounded-l-2xl">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-[var(--gf-indigo)] to-[var(--gf-violet)] shadow-lg shadow-[var(--gf-indigo)]/20">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--gf-indigo)]">
                GoalForge AI
              </p>
            </div>
            <h1 className="mt-6 text-3xl font-bold leading-tight tracking-tight text-white/90">
              Sign in to your workspace
            </h1>
            <p className="mt-2 text-[13px] leading-6 text-white/35">
              AI-powered performance intelligence for teams.
            </p>

            <div className="mt-6 space-y-3">
              {authMode === "PASSWORD" && (
                <>
                  <Input
                    className="h-10 rounded-lg border-white/[0.08] bg-white/[0.04] text-[13px] text-white/80 placeholder:text-white/20 focus:border-[var(--gf-indigo)]/30"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                  />
                  <Input
                    className="h-10 rounded-lg border-white/[0.08] bg-white/[0.04] text-[13px] text-white/80 placeholder:text-white/20 focus:border-[var(--gf-indigo)]/30"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    type="password"
                  />
                  {error && <p className="text-[12px] text-rose-400">{error}</p>}
                  <Button
                    className="h-10 w-full rounded-lg bg-gradient-to-r from-[var(--gf-indigo)] to-[var(--gf-violet)] text-[13px] font-semibold text-white shadow-lg shadow-[var(--gf-indigo)]/20"
                    onClick={handleApiLogin}
                    disabled={loading}
                  >
                    {loading ? "Signing in..." : "Sign in"}
                  </Button>
                  <Button
                    variant="link"
                    className="h-8 w-full text-[12px] text-white/30 hover:text-white/60"
                    onClick={() => { setAuthMode("OTP_PHONE"); setError("") }}
                  >
                    Login via OTP instead
                  </Button>
                </>
              )}

              {authMode === "OTP_PHONE" && (
                <>
                  <p className="text-[12px] text-white/35">Enter your phone number to receive a one-time code.</p>
                  <Input
                    className="h-10 rounded-lg border-white/[0.08] bg-white/[0.04] text-[13px] text-white/80 placeholder:text-white/20"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Phone Number"
                  />
                  {error && <p className="text-[12px] text-rose-400">{error}</p>}
                  <Button
                    className="h-10 w-full rounded-lg bg-gradient-to-r from-[var(--gf-indigo)] to-[var(--gf-violet)] text-[13px] font-semibold text-white"
                    onClick={handleRequestOtp}
                    disabled={loading || !phoneNumber}
                  >
                    {loading ? "Sending..." : "Send OTP"}
                  </Button>
                  <Button
                    variant="link"
                    className="h-8 w-full text-[12px] text-white/30 hover:text-white/60"
                    onClick={() => { setAuthMode("PASSWORD"); setError("") }}
                  >
                    Back to password login
                  </Button>
                </>
              )}

              {authMode === "OTP_CODE" && (
                <>
                  <p className="text-[12px] text-[var(--gf-cyan)]">{successMsg}</p>
                  <Input
                    className="h-12 rounded-lg border-white/[0.08] bg-white/[0.04] text-center text-lg tracking-[0.4em] text-white/80"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="------"
                    maxLength={6}
                  />
                  {error && <p className="text-[12px] text-rose-400">{error}</p>}
                  <Button
                    className="h-10 w-full rounded-lg bg-gradient-to-r from-[var(--gf-indigo)] to-[var(--gf-violet)] text-[13px] font-semibold text-white"
                    onClick={handleVerifyOtp}
                    disabled={loading || otpCode.length < 6}
                  >
                    {loading ? "Verifying..." : "Verify & Login"}
                  </Button>
                  <Button
                    variant="link"
                    className="h-8 w-full text-[12px] text-white/30 hover:text-white/60"
                    onClick={() => { setAuthMode("OTP_PHONE"); setOtpCode(""); setError(""); setSuccessMsg("") }}
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
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/25">
                Quick demo access
              </p>
              <p className="mt-1 text-[12px] text-white/40">
                Click a role to instantly explore the platform
              </p>
            </div>
            {roles.map((role) => {
              const Icon = role.icon
              return (
                <button
                  key={role.key}
                  className={`group rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 text-left transition-all duration-300 hover:-translate-y-1 ${role.border} ${role.bg}`}
                  onClick={() => handleLogin(role.key)}
                >
                  <span className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${role.gradient} text-white shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="mt-4 text-[14px] font-semibold text-white/85">{role.label}</p>
                  <p className="mt-1 text-[12px] text-white/30">{role.desc}</p>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
