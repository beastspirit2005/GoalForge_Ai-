/** True when demo/mock login fallback is allowed (local dev only by default). */
export function isDemoAuthAllowed(): boolean {
  if (process.env.NEXT_PUBLIC_ALLOW_DEMO_AUTH === "true") return true
  if (process.env.NEXT_PUBLIC_ALLOW_DEMO_AUTH === "false") return false
  
  // By default, allow demo auth if running locally OR if deployed to Vercel (since Vercel deployments typically lack the backend Postgres DB)
  return process.env.NODE_ENV === "development" || isVercelDeployment()
}

export function isVercelDeployment(): boolean {
  return Boolean(process.env.VERCEL || process.env.NEXT_PUBLIC_VERCEL_URL)
}
