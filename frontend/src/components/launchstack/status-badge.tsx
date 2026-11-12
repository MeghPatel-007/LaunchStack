import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type {
  ProjectStatus,
  TaskPriority,
  TaskStatus,
} from "@/data/launchstack"

const projectStatusStyles: Record<ProjectStatus, string> = {
  Planning: "border-border bg-muted text-muted-foreground",
  "In progress": "border-info/25 bg-info/10 text-info",
  "In review": "border-warning/25 bg-warning/10 text-warning",
  Completed: "border-success/25 bg-success/10 text-success",
  Archived: "border-border bg-muted text-muted-foreground",
}

const taskStatusStyles: Record<TaskStatus, string> = {
  Backlog: "border-border bg-muted text-muted-foreground",
  "To do": "border-border bg-secondary text-secondary-foreground",
  "In progress": "border-info/25 bg-info/10 text-info",
  "In review": "border-warning/25 bg-warning/10 text-warning",
  Done: "border-success/25 bg-success/10 text-success",
}

const priorityStyles: Record<TaskPriority, string> = {
  Critical: "border-destructive/25 bg-destructive/10 text-destructive",
  High: "border-warning/25 bg-warning/10 text-warning",
  Medium: "border-info/25 bg-info/10 text-info",
  Low: "border-border bg-muted text-muted-foreground",
}

function StatusBadge({
  className,
  children,
}: {
  className: string
  children: React.ReactNode
}) {
  return (
    <Badge variant="outline" className={cn("font-medium", className)}>
      {children}
    </Badge>
  )
}

export function ProjectStatusBadge({
  status,
  className,
}: {
  status: ProjectStatus
  className?: string
}) {
  return (
    <StatusBadge className={cn(projectStatusStyles[status], className)}>
      {status}
    </StatusBadge>
  )
}

export function TaskStatusBadge({
  status,
  className,
}: {
  status: TaskStatus
  className?: string
}) {
  return (
    <StatusBadge className={cn(taskStatusStyles[status], className)}>
      {status}
    </StatusBadge>
  )
}

export function TaskPriorityBadge({
  priority,
  className,
}: {
  priority: TaskPriority
  className?: string
}) {
  return (
    <StatusBadge className={cn(priorityStyles[priority], className)}>
      {priority}
    </StatusBadge>
  )
}
