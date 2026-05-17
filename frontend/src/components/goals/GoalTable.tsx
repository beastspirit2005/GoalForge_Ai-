import GoalStatusBadge from "@/components/goals/GoalStatusBadge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Goal } from "@/lib/demo-data"

type Props = {
  goals: Goal[]
}

export default function GoalTable({ goals }: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-white/[0.06]">
          <TableHead className="text-white/35">Goal</TableHead>
          <TableHead className="text-white/35">Owner</TableHead>
          <TableHead className="text-white/35">Progress</TableHead>
          <TableHead className="text-white/35">Status</TableHead>
          <TableHead className="text-white/35">Deadline</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {goals.map((goal) => (
          <TableRow key={goal.id} className="border-white/[0.04] hover:bg-white/[0.03]">
            <TableCell className="font-medium text-white/80">{goal.title}</TableCell>
            <TableCell className="text-white/50">{goal.owner}</TableCell>
            <TableCell className="text-white/60">{goal.progress}%</TableCell>
            <TableCell>
              <GoalStatusBadge status={goal.status} />
            </TableCell>
            <TableCell className="text-white/40">{goal.deadline}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
