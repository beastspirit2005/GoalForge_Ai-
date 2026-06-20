"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Camera, Key, Moon, Sun, User as UserIcon } from "lucide-react"
import {
  getGeminiKeyMode,
  setCustomGeminiKey,
  clearCustomGeminiKey,
  setGeminiKeyMode,
  resolveCustomGeminiKey,
  syncGeminiKeyFromStorage,
  GEMINI_KEY_CHANGED_EVENT,
  type GeminiKeyMode,
} from "@/lib/gemini-storage"
import { listRoleSessionCounts } from "@/lib/chat-history"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/useAuth"
import { apiFetch, API_URL } from "@/lib/api"
import { updateDemoSession } from "@/lib/mock-auth"
import { getStoredToken } from "@/services/auth.service"

type SettingsProfile = {
  name: string
  department: string | null
  profile_picture_url?: string | null
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong."
}

export default function SettingsPage() {
  const { resolvedTheme, setTheme } = useTheme()
  const { ready, user: authUser, isApiMode } = useAuth()
  
  const [name, setName] = useState("")
  const [department, setDepartment] = useState("")
  const [profilePic, setProfilePic] = useState("")
  
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [geminiMode, setGeminiMode] = useState<GeminiKeyMode>("app")
  const [geminiKeyDraft, setGeminiKeyDraft] = useState("")
  const [showGeminiKey, setShowGeminiKey] = useState(false)
  const [aiKeyMessage, setAiKeyMessage] = useState("")

  useEffect(() => {
    const sync = () => {
      const { mode, key } = syncGeminiKeyFromStorage()
      setGeminiMode(mode)
      setGeminiKeyDraft(key)
    }
    sync()
    window.addEventListener(GEMINI_KEY_CHANGED_EVENT, sync)
    window.addEventListener("focus", sync)
    return () => {
      window.removeEventListener(GEMINI_KEY_CHANGED_EVENT, sync)
      window.removeEventListener("focus", sync)
    }
  }, [])

  useEffect(() => {
    if (!ready) {
      return
    }

    const fetchProfile = async () => {
      const token = getStoredToken()

      if (!token || !isApiMode) {
        setName(authUser?.name || "")
        setDepartment(authUser?.department || "")
        setProfilePic(authUser?.profile_picture_url || "")
        return
      }

      try {
        const res = await apiFetch<SettingsProfile>("/auth/me", { method: "GET", token })
        setName(res.name || "")
        setDepartment(res.department || "")
        setProfilePic(res.profile_picture_url || "")
      } catch (err) {
        console.error("Failed to load profile", err)
      }
    }
    fetchProfile()
  }, [authUser, isApiMode, ready])

  const handleSaveProfile = async () => {
    setIsSaving(true)
    setMessage("")
    try {
      const token = getStoredToken()
      if (!token || !isApiMode) {
        updateDemoSession({ name, department, profile_picture_url: profilePic || null })
        setMessage("Profile updated for this demo session.")
        window.location.reload()
        return
      }

      await apiFetch("/auth/me", {
        method: "PUT",
        token,
        body: { name, department, profile_picture_url: profilePic || null },
      })
      setMessage("Profile updated successfully.")
      // Reload page to reflect changes in navbar if needed
      window.location.reload()
    } catch (err: unknown) {
      setMessage(`Error: ${getErrorMessage(err)}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]

    if (!isApiMode || !getStoredToken()) {
      setMessage("Image upload needs API login. You can paste an image URL while using demo mode.")
      e.target.value = ""
      return
    }
    
    setIsSaving(true)
    setMessage("Uploading image...")
    try {
      const token = getStoredToken()
      const formData = new FormData()
      formData.append("file", file)
      
      const res = await fetch(`${API_URL}/auth/avatar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })
      
      if (!res.ok) throw new Error("Upload failed")
      const data = await res.json() as Pick<SettingsProfile, "profile_picture_url">
      setProfilePic(data.profile_picture_url || "")
      setMessage("Profile picture updated!")
      window.location.reload()
    } catch (err: unknown) {
      setMessage(`Upload error: ${getErrorMessage(err)}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="premium-panel rounded-xl p-6 text-white dark:text-white">
          <h1 className="text-2xl font-bold tracking-normal">Settings</h1>
          <p className="mt-2 text-sm opacity-80">Manage your profile, preferences, and AI features.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Section */}
          <div className="glass-card rounded-xl p-6">
            <h2 className="mb-4 text-lg font-semibold dark:text-white/90">Profile Information</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 dark:bg-white/[0.04] border border-slate-300 dark:border-white/[0.08] overflow-hidden">
                  {profilePic ? (
                    <img src={profilePic} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <UserIcon className="h-8 w-8 text-slate-400 dark:text-white/40" />
                  )}
                </div>
                <div className="flex-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-white/40">Profile Picture</label>
                  <div className="flex flex-col sm:flex-row gap-2 mt-1">
                    <Input 
                      value={profilePic}
                      onChange={(e) => setProfilePic(e.target.value)}
                      placeholder="https://example.com/avatar.png"
                      className="h-9 flex-1 dark:bg-white/[0.04] dark:border-white/[0.08]"
                    />
                    <div className="relative">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <Button variant="outline" type="button" className="h-9 w-full sm:w-auto dark:bg-white/[0.04] dark:border-white/[0.08] dark:hover:bg-white/[0.08]">
                        <Camera className="h-4 w-4 mr-2" /> Upload
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-white/40">Full Name</label>
                <Input 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 h-9 dark:bg-white/[0.04] dark:border-white/[0.08]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-white/40">Department</label>
                <Input 
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="mt-1 h-9 dark:bg-white/[0.04] dark:border-white/[0.08]"
                />
              </div>

              {message && <p className="text-xs font-medium text-emerald-500">{message}</p>}

              <Button 
                onClick={handleSaveProfile} 
                disabled={isSaving}
                className="w-full bg-[var(--gf-indigo)] hover:bg-[var(--gf-indigo)]/90 text-white"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="space-y-6">
            <div className="glass-card rounded-xl p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold dark:text-white/90">
                <Key className="h-5 w-5 text-emerald-500" />
                Gemini API key
              </h2>
              <p className="mb-4 text-xs text-slate-500 dark:text-white/40">
                Stored only in this browser. Never uploaded to GoalForge servers.
              </p>
              <div className="mb-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    clearCustomGeminiKey()
                    setGeminiMode("app")
                    setGeminiKeyDraft("")
                    setAiKeyMessage("Using the app Gemini key.")
                  }}
                  className={`flex-1 rounded-lg border py-2 text-xs font-semibold ${
                    geminiMode === "app"
                      ? "border-[var(--gf-indigo)] bg-[var(--gf-indigo)]/10 text-[var(--gf-indigo)]"
                      : "border-slate-200 dark:border-white/[0.08] text-slate-500"
                  }`}
                >
                  App key
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const key = resolveCustomGeminiKey(geminiKeyDraft)
                    if (key) {
                      setCustomGeminiKey(key)
                      setGeminiKeyDraft(key)
                      setAiKeyMessage("Your key is saved in this browser.")
                    } else {
                      setGeminiKeyMode("custom")
                      setGeminiMode("custom")
                      setAiKeyMessage("Paste your key below, then click Save in browser.")
                    }
                    setGeminiMode(getGeminiKeyMode())
                  }}
                  className={`flex-1 rounded-lg border py-2 text-xs font-semibold ${
                    geminiMode === "custom"
                      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                      : "border-slate-200 dark:border-white/[0.08] text-slate-500"
                  }`}
                >
                  My key (local)
                </button>
              </div>
              {geminiMode === "custom" && (
                <div className="space-y-2">
                  <Input
                    type={showGeminiKey ? "text" : "password"}
                    value={geminiKeyDraft}
                    onChange={(e) => setGeminiKeyDraft(e.target.value)}
                    placeholder="AIza…"
                    className="h-9 dark:border-white/[0.08] dark:bg-white/[0.04]"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={() => setShowGeminiKey(!showGeminiKey)}
                    >
                      {showGeminiKey ? "Hide" : "Show"}
                    </Button>
                    <Button
                      type="button"
                      className="h-8 flex-1 bg-emerald-600 text-xs text-white hover:bg-emerald-500"
                      onClick={() => {
                        const key = resolveCustomGeminiKey(geminiKeyDraft)
                        if (!key) {
                          setAiKeyMessage("Enter a valid Gemini API key.")
                          return
                        }
                        setCustomGeminiKey(key)
                        setGeminiKeyDraft(key)
                        setGeminiMode(getGeminiKeyMode())
                        setAiKeyMessage("API key saved in this browser only.")
                      }}
                    >
                      Save in browser
                    </Button>
                  </div>
                </div>
              )}
              {aiKeyMessage && (
                <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">{aiKeyMessage}</p>
              )}
              {authUser?.email && (
                <p className="mt-4 border-t border-slate-100 pt-3 text-[11px] text-slate-500 dark:border-white/[0.06] dark:text-white/35">
                  Saved chats:{" "}
                  {Object.entries(listRoleSessionCounts(authUser.email))
                    .map(([r, n]) => `${r} (${n})`)
                    .join(" · ")}
                </p>
              )}
            </div>

            <div className="glass-card rounded-xl p-6">
              <h2 className="mb-4 text-lg font-semibold dark:text-white/90">Appearance</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium dark:text-white/80 text-slate-800">Theme Preference</p>
                  <p className="text-xs dark:text-white/40 text-slate-500">Toggle between light and dark mode.</p>
                </div>
                <div className="flex bg-slate-100 dark:bg-white/[0.04] p-1 rounded-lg border border-slate-200 dark:border-white/[0.08]">
                  <button 
                    onClick={() => setTheme("light")}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${resolvedTheme === 'light' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700 dark:text-white/50 dark:hover:text-white/80'}`}
                  >
                    <Sun className="h-3.5 w-3.5" /> Light
                  </button>
                  <button 
                    onClick={() => setTheme("dark")}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${resolvedTheme === 'dark' ? 'bg-slate-800 shadow-sm text-white' : 'text-slate-500 hover:text-slate-700 dark:text-white/50 dark:hover:text-white/80'}`}
                  >
                    <Moon className="h-3.5 w-3.5" /> Dark
                  </button>
                </div>
              </div>
            </div>

            </div>

          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
