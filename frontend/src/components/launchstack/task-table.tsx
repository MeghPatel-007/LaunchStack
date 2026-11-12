import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  TaskPriorityBadge,
  TaskStatusBadge,
} from "@/components/launchstack/status-badge"
import { EmptyState } from "@/components/launchstack/empty-state"
import {
  getMember,
  initials,
  projects,
  type Task,
} from "@/data/launchstack"

export function TaskTable({
  tasks,
  showProject = false,
}: {
  tasks: Task[]
  showProject?: boolean
}) {
  if (tasks.length === 0) {
    return (
      <EmptyState
        title="No tasks yet"
        description="Tasks added to this project will appear here."
      />
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Task</TableHead>
          {showProject && <TableHead>Project</TableHead>}
          <TableHead>Status</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Assignee</TableHead>
          <TableHead className="text-right">Due</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => {
          const assignee = getMember(task.assigneeId)
          const project = projects.find((item) => item.id === task.projectId)

          return (
            <TableRow key={task.id}>
              <TableCell>
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">{task.title}</span>
                  <span className="text-muted-foreground text-xs">
                    {task.id}
                  </span>
                </div>
              </TableCell>
              {showProject && (
                <TableCell className="text-muted-foreground">
                  {project?.name ?? "—"}
                </TableCell>
              )}
              <TableCell>
                <TaskStatusBadge status={task.status} />
              </TableCell>
              <TableCell>
                <TaskPriorityBadge priority={task.priority} />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar size="sm">
                    <AvatarFallback>
                      {initials(assignee?.name ?? "?")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{assignee?.name ?? "Unassigned"}</span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground text-right text-sm">
                {task.dueDate}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
