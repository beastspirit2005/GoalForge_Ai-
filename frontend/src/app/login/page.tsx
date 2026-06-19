"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/useAuth"
import BrandLogo from "@/components/layout/BrandLogo"

export default function LoginPage() {
  const router = useRouter()
  const { loginWithApi, requestOtpCode, loginWithOtp } = useAuth()

  const [authMode, setAuthMode] = useState<"PASSWORD" | "OTP_EMAIL" | "OTP_CODE">("PASSWORD")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [otpEmail, setOtpEmail] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  const handleApiLogin = async () => {
    setLoading(true)
    setError("")
    try {
      const path = await loginWithApi(email, password)
      router.push(path)
    } catch (err: any) {
      if (err?.message?.includes("pending admin approval")) {
        setError(err.message)
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
      } else {
        setError(err instanceof Error ? err.message : "OTP verification failed.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden p-6 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 selection:bg-indigo-500/10 selection:text-indigo-900 transition-colors duration-300">
      {/* Background orbs */}
      <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-indigo-500/5 dark:bg-indigo-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-violet-500/5 dark:bg-violet-500/10 blur-[100px]" />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-slate-100 dark:shadow-none">
        <div className="flex flex-col justify-center border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 p-8 lg:p-10">
          <Link href="/" className="group transition-opacity hover:opacity-90">
            <BrandLogo size="lg" />
          </Link>
          <h1 className="mt-6 text-2xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white">
            Sign in to your workspace
          </h1>
          <p className="mt-2 text-[13px] leading-6 text-slate-500 dark:text-slate-400 font-medium">
            AI-powered performance intelligence for teams.
          </p>

          <div className="mt-8 space-y-4">
            {authMode === "PASSWORD" && (
              <>
                <Input
                  className="h-11 rounded-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-[14px] text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 focus-visible:ring-2"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                />
                <Input
                  className="h-11 rounded-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-[14px] text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 focus-visible:ring-2"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  type="password"
                />
                {error && <p className="text-[13px] text-rose-600 font-medium">{error}</p>}
                <Button
                  className="h-11 w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 text-[14px] font-semibold text-white shadow-md shadow-indigo-600/10 transition-all mt-2"
                  onClick={handleApiLogin}
                  disabled={loading || !email || !password}
                >
                  {loading ? "Signing in..." : "Sign in"}
                </Button>
                <Button
                  variant="link"
                  className="h-10 w-full text-[13px] text-slate-400 hover:text-slate-600 font-semibold mt-1"
                  onClick={() => { setAuthMode("OTP_EMAIL"); setError("") }}
                >
                  Login via Email OTP instead
                </Button>
              </>
            )}

            {authMode === "OTP_EMAIL" && (
              <>
                <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium">Enter your registered email to receive a one-time login code.</p>
                <Input
                  className="h-11 rounded-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-[14px] text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 focus-visible:ring-2"
                  value={otpEmail}
                  onChange={(e) => setOtpEmail(e.target.value)}
                  placeholder="your@email.com"
                  type="email"
                />
                {error && <p className="text-[13px] text-rose-600 font-medium">{error}</p>}
                <Button
                  className="h-11 w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 text-[14px] font-semibold text-white shadow-md shadow-indigo-600/10 transition-all mt-2"
                  onClick={handleRequestOtp}
                  disabled={loading || !otpEmail}
                >
                  {loading ? "Sending..." : "Send OTP"}
                </Button>
                <Button
                  variant="link"
                  className="h-10 w-full text-[13px] text-slate-400 hover:text-slate-600 font-semibold mt-1"
                  onClick={() => { setAuthMode("PASSWORD"); setError("") }}
                >
                  Back to password login
                </Button>
              </>
            )}

            {authMode === "OTP_CODE" && (
              <>
                <p className="text-[13px] text-emerald-600 font-semibold">{successMsg}</p>
                <Input
                  className="h-12 rounded-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-center text-xl tracking-[0.4em] text-slate-800 dark:text-white focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 focus-visible:ring-2"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="------"
                  maxLength={6}
                />
                {error && <p className="text-[13px] text-rose-600 font-medium">{error}</p>}
                <Button
                  className="h-11 w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 text-[14px] font-semibold text-white shadow-md shadow-indigo-600/10 transition-all mt-2"
                  onClick={handleVerifyOtp}
                  disabled={loading || otpCode.length < 6}
                >
                  {loading ? "Verifying..." : "Verify & Login"}
                </Button>
                <Button
                  variant="link"
                  className="h-10 w-full text-[13px] text-slate-400 hover:text-slate-600 font-semibold mt-1"
                  onClick={() => { setAuthMode("OTP_EMAIL"); setOtpCode(""); setError(""); setSuccessMsg("") }}
                >
                  Resend OTP
                </Button>
              </>
            )}
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
            <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
