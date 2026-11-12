import { notFound } from "next/navigation"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { PageHeader } from "@/components/launchstack/page-header"
import { TaskTable } from "@/components/launchstack/task-table"
import { getProject, getProjectTasks } from "@/data/launchstack"

export default async function ProjectBacklogPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const project = getProject(projectId)

  if (!project) notFound()

  const projectTasks = getProjectTasks(project.id)

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 md:px-6">
      <PageHeader
        eyebrow="Project"
        title="Backlog"
        description="Every task in this project, ordered by status and priority."
        headingLevel="h2"
      />

      <Card>
        <CardHeader>
          <CardTitle>{projectTasks.length} tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <TaskTable tasks={projectTasks} />
        </CardContent>
      </Card>
    </div>
  )
}
