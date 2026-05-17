import { CheckCircle2, Circle } from "lucide-react"

type Props = {
  title: string
  due: string
  done?: boolean
}

export default function MilestoneCard({ title, due, done = false }: Props) {
  const Icon = done ? CheckCircle2 : Circle

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 text-card-foreground">
      <Icon className={done ? "h-5 w-5 text-emerald-600 dark:text-emerald-300" : "h-5 w-5 text-muted-foreground"} />
      <div>
        <p className="text-sm font-medium text-slate-900 dark:text-white">{title}</p>
        <p className="text-xs text-slate-600 dark:text-slate-400">Due {due}</p>
      </div>
    </div>
  )
}
