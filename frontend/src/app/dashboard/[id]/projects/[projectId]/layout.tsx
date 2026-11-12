import Link from "next/link"
import { notFound } from "next/navigation"

import { Progress } from "@/components/ui/progress"
import { ProjectStatusBadge } from "@/components/launchstack/status-badge"
import { MemberAvatarGroup } from "@/components/launchstack/member-avatar-group"
import {
  getProject,
  getProjectMembers,
  getProjectTasks,
} from "@/data/launchstack"

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string; projectId: string }>
}) {
  const { id, projectId } = await params
  const project = getProject(projectId)

  if (!project) notFound()

  const projectMembers = getProjectMembers(project)
  const openTasks = getProjectTasks(project.id).filter(
    (task) => task.status !== "Done"
  ).length

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-muted/30 border-b">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 md:px-6">
          <nav className="text-muted-foreground flex items-center gap-2 text-xs font-medium">
            <Link
              href={`/dashboard/${id}/projects`}
              className="hover:text-foreground"
            >
              Projects
            </Link>
            <span>/</span>
            <span className="text-foreground">{project.key}</span>
          </nav>

          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="flex flex-col gap-1.5">
              <h1 className="text-2xl font-semibold tracking-tight">
                {project.name}
              </h1>
              <p className="text-muted-foreground max-w-3xl text-sm">
                {project.description}
              </p>
            </div>
            <ProjectStatusBadge status={project.status} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <span className="text-muted-foreground text-xs font-medium">
                Progress
              </span>
              <div className="flex items-center gap-3">
                <Progress value={project.progress} className="flex-1" />
                <span className="text-sm font-medium tabular-nums">
                  {project.progress}%
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-muted-foreground text-xs font-medium">
                Team
              </span>
              <div className="flex items-center gap-2">
                <MemberAvatarGroup members={projectMembers} />
                <span className="text-muted-foreground text-xs">
                  {projectMembers.length} members
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-xs font-medium">
                Open tasks
              </span>
              <span className="text-sm font-medium tabular-nums">
                {openTasks} remaining
              </span>
            </div>
          </div>
        </div>
      </div>

      {children}
    </div>
  )
}
