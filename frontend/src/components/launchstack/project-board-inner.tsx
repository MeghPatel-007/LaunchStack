"use client"

import { CalendarDays } from "lucide-react"
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame"
import {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanColumnContent,
  KanbanItem,
} from "@/components/reui/kanban"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { TaskPriorityBadge } from "@/components/launchstack/status-badge"
import {
  getMember,
  initials,
  type Task,
  type TaskStatus,
} from "@/data/launchstack"

const columns: {
  id: TaskStatus
  label: string
  description: string
}[] = [
  { id: "Backlog", label: "Backlog", description: "Ideas waiting to be scoped" },
  { id: "To do", label: "To do", description: "Ready for the next cycle" },
  {
    id: "In progress",
    label: "In progress",
    description: "Work currently underway",
  },
  { id: "In review", label: "In review", description: "Waiting on feedback" },
  { id: "Done", label: "Done", description: "Completed this cycle" },
]

function BoardCard({ task }: { task: Task }) {
  const assignee = getMember(task.assigneeId)

  return (
    <KanbanItem value={task.id}>
      <Frame variant="ghost" spacing="xs" className="p-0">
        <FramePanel className="space-y-3 p-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm leading-snug font-medium">{task.title}</p>
            <TaskPriorityBadge priority={task.priority} />
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5">
              <Avatar size="sm" className="size-5">
                <AvatarFallback className="text-[10px]">
                  {initials(assignee?.name ?? "?")}
                </AvatarFallback>
              </Avatar>
              <span className="text-muted-foreground truncate text-xs">
                {assignee?.name ?? "Unassigned"}
              </span>
            </div>
            <span className="text-muted-foreground flex shrink-0 items-center gap-1 text-xs">
              <CalendarDays className="size-3" />
              {task.dueDate}
            </span>
          </div>
        </FramePanel>
      </Frame>
    </KanbanItem>
  )
}

export function ProjectBoardInner({ tasks }: { tasks: Task[] }) {
  const board: Record<string, Task[]> = Object.fromEntries(
    columns.map((column) => [
      column.id,
      tasks.filter((task) => task.status === column.id),
    ])
  )

  return (
    <Kanban value={board} onValueChange={() => {}} getItemValue={(task) => task.id}>
      <KanbanBoard className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {columns.map((column) => {
          const columnTasks = board[column.id]

          return (
            <KanbanColumn key={column.id} value={column.id}>
              <Frame stacked spacing="sm" className="h-full">
                <FrameHeader>
                  <div className="flex items-center justify-between">
                    <FrameTitle>{column.label}</FrameTitle>
                    <Badge variant="outline">{columnTasks.length}</Badge>
                  </div>
                  <FrameDescription className="text-xs">
                    {column.description}
                  </FrameDescription>
                </FrameHeader>
                <KanbanColumnContent
                  value={column.id}
                  className="flex min-h-24 flex-col gap-2 p-0.5"
                >
                  {columnTasks.length > 0 ? (
                    columnTasks.map((task) => (
                      <BoardCard key={task.id} task={task} />
                    ))
                  ) : (
                    <p className="text-muted-foreground rounded-md border border-dashed p-4 text-center text-xs">
                      No tasks
                    </p>
                  )}
                </KanbanColumnContent>
              </Frame>
            </KanbanColumn>
          )
        })}
      </KanbanBoard>
    </Kanban>
  )
}
