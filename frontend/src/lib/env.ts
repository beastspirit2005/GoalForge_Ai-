/** True when demo/mock login fallback is allowed (local dev only by default). */
export function isDemoAuthAllowed(): boolean {
  if (process.env.NEXT_PUBLIC_ALLOW_DEMO_AUTH === "true") return true
  if (process.env.NEXT_PUBLIC_ALLOW_DEMO_AUTH === "false") return false
  return process.env.NODE_ENV === "development"
}

export function isVercelDeployment(): boolean {
  return Boolean(process.env.VERCEL || process.env.NEXT_PUBLIC_VERCEL_URL)
}
