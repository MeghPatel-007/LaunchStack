import { notFound } from "next/navigation"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { PageHeader } from "@/components/launchstack/page-header"
import { ProjectStatusBadge } from "@/components/launchstack/status-badge"
import {
  getProject,
  getProjectMembers,
  getProjectTasks,
} from "@/data/launchstack"

export default async function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const project = getProject(projectId)

  if (!project) notFound()

  const projectMembers = getProjectMembers(project)
  const projectTasks = getProjectTasks(project.id)

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 md:px-6">
      <PageHeader
        eyebrow="Project"
        title="Project settings"
        description="Project details for this preview. Editing will be enabled once the connection layer is ready."
        headingLevel="h2"
      />

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>
            Read-only preview of the project configuration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground text-xs font-medium">
                Project name
              </dt>
              <dd className="text-sm font-medium">{project.name}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground text-xs font-medium">
                Project key
              </dt>
              <dd className="text-sm font-medium">{project.key}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground text-xs font-medium">
                Status
              </dt>
              <dd>
                <ProjectStatusBadge status={project.status} />
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground text-xs font-medium">
                Visibility
              </dt>
              <dd className="text-sm font-medium">Workspace</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground text-xs font-medium">
                Members
              </dt>
              <dd className="text-sm font-medium">{projectMembers.length}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground text-xs font-medium">
                Tasks
              </dt>
              <dd className="text-sm font-medium">{projectTasks.length}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}
