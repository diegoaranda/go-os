import { CalendarDays } from "lucide-react"
import { StatusBadge, PriorityBadge } from "@/components/status-badge"
import type { Task } from "@/lib/types"

export function TaskRow({
  task,
  areaName,
  projectName,
}: {
  task: Task
  areaName?: (id?: string | null) => string
  projectName: (id?: string | null) => string
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1.5">
        <p className="text-sm font-medium leading-snug">{task.title}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {task.areaId ? (
            <span className="font-medium text-foreground/70">
              {areaName ? areaName(task.areaId) : task.areaId}
            </span>
          ) : null}
          <span className="font-medium text-foreground/70">
            {projectName(task.projectId)}
          </span>
          <span className="flex items-center gap-1">
            <CalendarDays className="size-3" />
            {task.due}
          </span>
          <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide">
            {task.source}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <PriorityBadge priority={task.priority} />
        <StatusBadge status={task.status} />
      </div>
    </div>
  )
}
