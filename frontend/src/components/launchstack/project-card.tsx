import Link from 'next/link'

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import type { Project as ApiProject } from '@/types/project'
import type { Project as MockProject } from '@/data/launchstack'

export function ProjectCard({
  project,
  href,
}: {
  project: ApiProject | MockProject
  href: string
}) {
  const projectType =
    'project_type' in project ? project.project_type : project.key
  const role = 'role' in project ? project.role : project.status
  const techStack = 'tech_stack' in project ? project.tech_stack : null
  const projectId = 'project_id' in project ? project.project_id : project.id

  return (
    <Link
      href={href}
      className="group block rounded-xl focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card className="h-full transition-colors group-hover:border-ring/40">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                {projectType}
              </p>

              <CardTitle className="truncate">{project.name}</CardTitle>
            </div>

            <span className="shrink-0 rounded-md border px-2 py-1 text-xs font-medium">
              {role}
            </span>
          </div>

          <p className="text-muted-foreground line-clamp-2 text-sm">
            {project.description || 'No description provided.'}
          </p>
        </CardHeader>

        <CardContent>
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="text-muted-foreground">Tech Stack</span>
            <span className="font-medium">
              {techStack || 'Not specified'}
            </span>
          </div>
        </CardContent>

        <CardFooter className="justify-between">
          <span className="text-muted-foreground text-xs">
            Project {projectId}
          </span>

          <span className="text-muted-foreground text-xs transition-colors group-hover:text-foreground">
            View project →
          </span>
        </CardFooter>
      </Card>
    </Link>
  )
}
