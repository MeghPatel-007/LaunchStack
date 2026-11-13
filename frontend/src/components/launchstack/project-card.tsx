import Link from 'next/link'
import { Pencil, Trash2, Eye } from 'lucide-react'

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import { AddProjectModal } from '@/components/launchstack/add-project-modal'

import type { Project as ApiProject, UpdateProjectInput } from '@/types/project'
import type { Project as MockProject } from '@/data/launchstack'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface ProjectCardProps {
  project: ApiProject | MockProject
  href: string
  onUpdateProject?: (
    projectId: number,
    data: UpdateProjectInput,
  ) => Promise<void>
  onDeleteProject?: (projectId: number) => Promise<void>
}
export function ProjectCard({
  project,
  href,
  onUpdateProject,
  onDeleteProject,
}: ProjectCardProps) {
  const projectType =
    'project_type' in project ? project.project_type : project.key
  const role = 'role' in project ? project.role : project.status
  const techStack = 'tech_stack' in project ? project.tech_stack : null
  const projectId = 'project_id' in project ? project.project_id : project.id

  const isApiProject = 'project_id' in project

  const handleUpdateProject = async (data: UpdateProjectInput) => {
    if (!onUpdateProject || !isApiProject) return

    await onUpdateProject(project.project_id, data)
  }

  return (
    <Card className="group relative h-full transition-colors hover:border-ring/40">
      <Link
        href={href}
        className="absolute inset-0 rounded-xl focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`View ${project.name}`}
      />

      <CardHeader className="relative pointer-events-none">
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

      <CardContent className="relative pointer-events-none">
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="text-muted-foreground">Tech Stack</span>
          <span className="font-medium">{techStack || 'Not specified'}</span>
        </div>
      </CardContent>

      <CardFooter className="relative justify-between">
        <span className="text-muted-foreground text-xs">
          Project {projectId}
        </span>

        <div className="pointer-events-auto flex items-center gap-2">
          {/* View */}
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label={`View ${project.name}`}
            title="View project"
          >
            <Link href={href}>
              <Eye className="size-4" />
            </Link>
          </Button>

          {/* Edit */}
          {isApiProject && onUpdateProject && (
            <AddProjectModal
              project={project}
              onUpdateProject={handleUpdateProject}
              trigger={
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label={`Edit ${project.name}`}
                  title="Edit project"
                >
                  <Pencil className="size-4" />
                </Button>
              }
            />
          )}
          {/* Delete */}
          {isApiProject && onDeleteProject && (
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Delete ${project.name}`}
                    title="Delete project"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                }
              />

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete project?</AlertDialogTitle>

                  <AlertDialogDescription>
                    Are you sure you want to delete &quot;{project.name}&quot;?
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>

                  <AlertDialogAction
                    className="bg-destructive text-white hover:bg-destructive/90"
                    onClick={() => {
                      void onDeleteProject(project.project_id)
                    }}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}
