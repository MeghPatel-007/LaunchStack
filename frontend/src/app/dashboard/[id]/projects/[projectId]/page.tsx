import { notFound } from "next/navigation"
import {
  CheckSquare,
  ListTodo,
  Loader,
  Eye,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { StatCard } from "@/components/launchstack/stat-card"
import { PhaseList } from "@/components/launchstack/phase-list"
import { MemberList } from "@/components/launchstack/member-list"
import { ActivityFeed } from "@/components/launchstack/activity-feed"
import {
  getProject,
  getProjectActivities,
  getProjectMembers,
  getProjectPhases,
  getProjectTasks,
} from "@/data/launchstack"

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const project = getProject(projectId)

  if (!project) notFound()

  const projectTasks = getProjectTasks(project.id)
  const projectPhases = getProjectPhases(project.id)
  const projectMembers = getProjectMembers(project)
  const projectActivities = getProjectActivities(project.id)
  const done = projectTasks.filter((task) => task.status === "Done").length

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 md:px-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Open tasks"
          value={projectTasks.length - done}
          hint="Not completed yet"
          icon={ListTodo}
        />
        <StatCard
          label="In progress"
          value={
            projectTasks.filter((task) => task.status === "In progress").length
          }
          hint="Being worked on"
          icon={Loader}
        />
        <StatCard
          label="In review"
          value={
            projectTasks.filter((task) => task.status === "In review").length
          }
          hint="Waiting on feedback"
          icon={Eye}
        />
        <StatCard
          label="Completed"
          value={done}
          hint="Tasks marked done"
          icon={CheckSquare}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Phases</CardTitle>
          <p className="text-muted-foreground text-sm">
            The larger stages this project moves through.
          </p>
        </CardHeader>
        <CardContent>
          <PhaseList items={projectPhases} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Project team</CardTitle>
            <p className="text-muted-foreground text-sm">
              Everyone contributing to this project.
            </p>
          </CardHeader>
          <CardContent>
            <MemberList members={projectMembers} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <p className="text-muted-foreground text-sm">
              Latest updates from this project.
            </p>
          </CardHeader>
          <CardContent>
            <ActivityFeed items={projectActivities} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
