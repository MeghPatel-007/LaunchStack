import Link from "next/link"
import {
  CheckSquare,
  FolderKanban,
  Layers,
  ListTodo,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { PageHeader } from "@/components/launchstack/page-header"
import { StatCard } from "@/components/launchstack/stat-card"
import { ProjectCard } from "@/components/launchstack/project-card"
import { ActivityFeed } from "@/components/launchstack/activity-feed"
import { TaskStatusBadge } from "@/components/launchstack/status-badge"
import {
  activities,
  projects,
  tasks,
} from "@/data/launchstack"

export default async function DashboardHome({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const base = `/dashboard/${id}`

  const activeProjects = projects.filter(
    (project) =>
      project.status === "In progress" || project.status === "In review"
  )
  const myTasks = tasks.filter(
    (task) => task.assigneeId === "m1" && task.status !== "Done"
  )
  const completedTasks = tasks.filter((task) => task.status === "Done")

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 md:px-6">
      <PageHeader
        eyebrow="Workspace"
        title="Workspace overview"
        description="Track project health, see what needs attention and pick up your next task."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total projects"
          value={projects.length}
          hint="Across the workspace"
          icon={FolderKanban}
        />
        <StatCard
          label="Active projects"
          value={activeProjects.length}
          hint="In progress or review"
          icon={Layers}
        />
        <StatCard
          label="Assigned to me"
          value={myTasks.length}
          hint="Open tasks"
          icon={ListTodo}
        />
        <StatCard
          label="Completed work"
          value={completedTasks.length}
          hint="Tasks marked done"
          icon={CheckSquare}
        />
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Recent projects</h2>
            <p className="text-muted-foreground text-sm">
              Pick up where the team left off.
            </p>
          </div>
          <Link
            href={`${base}/projects`}
            className="text-muted-foreground hover:text-foreground text-sm font-medium"
          >
            View all
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.slice(0, 3).map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              href={`${base}/projects/${project.id}`}
            />
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>My work</CardTitle>
            <p className="text-muted-foreground text-sm">
              Open tasks assigned to you.
            </p>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col">
              {myTasks.map((task) => (
                <li
                  key={task.id}
                  className="border-border flex items-center justify-between gap-3 border-b py-3 last:border-0 last:pb-0 first:pt-0"
                >
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-sm font-medium">
                      {task.title}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {projects.find((project) => project.id === task.projectId)
                        ?.name ?? "Project"}{" "}
                      · Due {task.dueDate}
                    </span>
                  </div>
                  <TaskStatusBadge status={task.status} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <p className="text-muted-foreground text-sm">
              Latest updates from the workspace.
            </p>
          </CardHeader>
          <CardContent>
            <ActivityFeed items={activities.slice(0, 5)} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
