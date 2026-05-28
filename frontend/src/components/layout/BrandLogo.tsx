"use client"

type BrandLogoProps = {
  size?: "sm" | "md" | "lg"
  hideSubtitle?: boolean
}

export default function BrandLogo({ size = "md", hideSubtitle = false }: BrandLogoProps) {
  const isSm = size === "sm"
  const isLg = size === "lg"

  // Dynamic dimension presets
  const containerClasses = isSm
    ? "h-8 w-8 rounded-lg"
    : isLg
    ? "h-16 w-16 rounded-2xl"
    : "h-10 w-10 rounded-xl" // md default

  const textClass = isSm
    ? "text-sm font-black tracking-tight"
    : isLg
    ? "text-3xl font-black tracking-tighter"
    : "text-lg font-black tracking-tight"

  const subtitleClass = isSm
    ? "text-[8px] tracking-[0.15em]"
    : isLg
    ? "text-[11px] tracking-[0.25em]"
    : "text-[9px] tracking-[0.2em]"

  return (
    <div className="flex items-center gap-3">
      {/* ── Dynamic Cropped Icon Container ── */}
      <div className="relative shrink-0 select-none">
        {/* Ambient Neon Backlight Glow on hover */}
        <div className={`absolute -inset-1 rounded-full bg-gradient-to-tr from-cyan-500 via-violet-600 to-amber-400 opacity-0 blur-md transition-all duration-500 group-hover:opacity-75 group-hover:blur-lg ${
          isSm ? "scale-90" : isLg ? "scale-110" : "scale-100"
        }`} />

        {/* Outer Circular Ring Border */}
        <div className={`relative overflow-hidden border border-white/10 bg-black/90 shadow-md shadow-black/40 transition-all duration-300 group-hover:border-cyan-400/50 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] ${containerClasses}`}>
          
          {/* Cropped Logo Image (Focused exactly on the gorgeous target/flames icon) */}
          <img
            src="/logo.jpg"
            alt="GoalForge AI Icon"
            className="h-full w-full object-cover scale-[1.3] transition-transform duration-500 ease-out group-hover:scale-[1.42] group-hover:rotate-3"
            style={{ 
              objectPosition: "8% 50%" 
            }}
          />

          {/* Holographic light reflection shine overlay */}
          <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 group-hover:translate-x-[100%]" />
        </div>

        {/* Cyber status beacon dot (tiny subtle glow in corner) */}
        <span className={`absolute bottom-0 right-0 flex rounded-full bg-cyan-400 ring-1 ring-black ${
          isSm ? "h-1.5 w-1.5" : isLg ? "h-3 w-3" : "h-2 w-2"
        } animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]`} />
      </div>

      {/* ── Typographic Branding ── */}
      <div className="flex flex-col justify-center select-none">
        <div className="flex items-center gap-1.5">
          {/* Main Title "GOALFORGE" */}
          <span className={`font-black tracking-wide leading-none transition-colors duration-300 ${textClass} bg-gradient-to-r from-slate-900 to-slate-800 bg-clip-text text-transparent dark:from-white dark:to-slate-200 group-hover:dark:text-cyan-100`}>
            GOALFORGE
          </span>
          
          {/* "AI" Gradient Pill Text */}
          <span className={`font-black leading-none ${textClass} bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 bg-clip-text text-transparent drop-shadow-[0_0_6px_rgba(6,182,212,0.3)]`}>
            AI
          </span>
        </div>
        
        {/* Brand Subtitle "Performance Intelligence" */}
        {!hideSubtitle && (
          <p className={`mt-0.5 font-extrabold uppercase text-slate-400/90 dark:text-white/35 transition-colors duration-300 group-hover:dark:text-cyan-400/50 ${subtitleClass}`}>
            Performance Intelligence
          </p>
        )}
      </div>
    </div>
  )
}
