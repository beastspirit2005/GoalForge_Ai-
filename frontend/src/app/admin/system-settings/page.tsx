"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import RequireRole from "@/components/auth/RequireRole"
import { Shield, Key, Zap, Users, AlertTriangle, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { apiFetch } from "@/lib/api"
export default function SystemSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [impersonateUserId, setImpersonateUserId] = useState("")
  const [usersList, setUsersList] = useState<any[]>([])
  const [modelsList, setModelsList] = useState<string[]>([])

  const fetchSettings = async () => {
    try {
      const data = await apiFetch<Record<string, string>>("/admin/settings")
      setSettings(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchModels = async () => {
    try {
      const data = await apiFetch<string[]>("/admin/gemini/models")
      if (Array.isArray(data)) setModelsList(data)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchUsers = async () => {
    try {
      const data = await apiFetch<any[]>("/admin/users")
      setUsersList(data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchSettings()
    fetchUsers()
    fetchModels()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const updates = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
        is_public: false
      }))
      await apiFetch("/admin/settings", {
        method: "PUT",
        body: updates
      })
      alert("Settings saved. (Note: Ensure X-Critical-OTP is passed in production)")
    } catch (err) {
      console.error(err)
      alert("Failed to save settings.")
    } finally {
      setSaving(false)
    }
  }

  const handleImpersonate = async () => {
    if (!impersonateUserId) return
    try {
      await apiFetch<{access_token: string}>(`/admin/impersonate/${impersonateUserId}`, {
        method: "POST"
      })
      alert("Impersonation token received. Redirecting...")
      window.location.href = "/" // Force a full app reload to re-fetch user session
    } catch (err) {
      console.error(err)
      alert("Failed to impersonate.")
    }
  }

  return (
    <RequireRole roles={["super_admin"]}>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="premium-panel relative overflow-hidden rounded-2xl p-6 lg:p-8 bg-gradient-to-br from-[var(--gf-amber)]/10 to-[var(--gf-violet)]/10 border border-amber-500/20">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[var(--gf-amber)]/10 blur-3xl" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-6 w-6 text-[var(--gf-amber)]" />
                <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[var(--gf-amber)]">
                  Super Admin Console
                </p>
              </div>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                System Settings & Security
              </h1>
              <p className="mt-2 text-[14px] text-slate-500 dark:text-white/40">
                Configure global enterprise settings, manage authentication vectors, and assume identities.
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Settings Form */}
            <div className="glass-card rounded-xl p-6 space-y-6 border border-slate-200 dark:border-white/5 bg-white/50 dark:bg-[#020617]/50 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center gap-3 border-b border-slate-200 dark:border-white/5 pb-4">
                <Zap className="h-5 w-5 text-[var(--gf-violet)]" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Platform Configuration</h2>
              </div>
              
              {loading ? (
                <p className="text-slate-500 dark:text-white/40 text-sm">Loading settings...</p>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[12px] font-medium text-slate-500 dark:text-white/60 uppercase tracking-wider">Demo Mode</label>
                    <select 
                      value={settings.DEMO_MODE || "false"}
                      onChange={(e) => setSettings({...settings, DEMO_MODE: e.target.value})}
                      className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#090d16] px-3 py-2 text-sm text-slate-900 dark:text-white"
                    >
                      <option value="true">Enabled (Insecure)</option>
                      <option value="false">Disabled (Production)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[12px] font-medium text-slate-500 dark:text-white/60 uppercase tracking-wider">Default Model</label>
                    <select
                      value={settings.DEFAULT_AI_MODEL || "gemini-2.5-flash"}
                      onChange={(e) => setSettings({...settings, DEFAULT_AI_MODEL: e.target.value})}
                      className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#090d16] px-3 py-2 text-sm text-slate-900 dark:text-white"
                    >
                      {modelsList.length === 0 ? (
                        <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                      ) : (
                        modelsList.map(model => (
                          <option key={model} value={model}>{model}</option>
                        ))
                      )}
                    </select>
                  </div>
                  
                  <Button 
                    onClick={handleSave} 
                    disabled={saving}
                    className="w-full bg-[var(--gf-violet)] hover:bg-[var(--gf-violet)]/80 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? "Saving..." : "Save Configuration"}
                  </Button>
                </div>
              )}
            </div>

            {/* Impersonation Panel */}
            <div className="glass-card rounded-xl p-6 space-y-6 border border-amber-200 dark:border-amber-500/10 bg-white/50 dark:bg-[#020617]/50 shadow-2xl backdrop-blur-xl relative overflow-hidden">
              <div className="pointer-events-none absolute -right-16 -bottom-16 h-48 w-48 rounded-full bg-amber-500/5 blur-3xl" />
              <div className="relative">
                <div className="flex items-center gap-3 border-b border-slate-200 dark:border-white/5 pb-4">
                  <Users className="h-5 w-5 text-[var(--gf-amber)]" />
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Identity Impersonation</h2>
                </div>
                
                <div className="mt-4 space-y-4">
                  <div className="rounded-lg border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/5 p-3 flex gap-3 items-start">
                    <AlertTriangle className="h-4 w-4 text-rose-500 dark:text-rose-400 mt-0.5 shrink-0" />
                    <p className="text-[11px] text-rose-700 dark:text-rose-200/80 leading-relaxed">
                      <strong>Warning:</strong> Action is audited. Write operations are blocked during impersonation. Cannot impersonate other super admins.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[12px] font-medium text-slate-500 dark:text-white/60 uppercase tracking-wider">Target User</label>
                    <select 
                      value={impersonateUserId}
                      onChange={(e) => setImpersonateUserId(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#090d16] px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-amber-500/50"
                    >
                      <option value="" disabled>-- Select a User to Impersonate --</option>
                      {usersList
                        .filter(u => u.role !== "super_admin")
                        .map(u => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.role.toUpperCase()}) - {u.email}
                          </option>
                        ))}
                    </select>
                  </div>

                  <Button 
                    onClick={handleImpersonate}
                    className="w-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-500/30 border border-amber-200 dark:border-amber-500/30 transition-all"
                  >
                    <Key className="mr-2 h-4 w-4" />
                    Assume Identity
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </RequireRole>
  )
}
