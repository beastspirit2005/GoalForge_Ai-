import { Sparkles } from "lucide-react"

type Props = {
  text: string
}

export default function RecommendationBox({ text }: Props) {
  return (
    <div className="rounded-lg border border-violet-200 bg-violet-50 p-4 text-violet-950 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-100">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Sparkles className="h-4 w-4 text-violet-700 dark:text-violet-200" />
        AI recommendation
      </div>
      <p className="mt-2 text-sm leading-6 text-violet-900 dark:text-violet-100/80">{text}</p>
    </div>
  )
}
