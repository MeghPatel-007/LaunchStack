import { notFound } from "next/navigation"

import { PageHeader } from "@/components/launchstack/page-header"
import { ProjectBoard } from "@/components/launchstack/project-board"
import { getProject, getProjectTasks } from "@/data/launchstack"

export default async function ProjectBoardPage({
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
        title="Board"
        description="The current flow of work across the board."
        headingLevel="h2"
      />
      <ProjectBoard tasks={projectTasks} />
    </div>
  )
}
