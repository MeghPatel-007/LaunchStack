'use client'

import { useEffect, useState } from 'react'

import { ProjectCard } from '@/components/launchstack/project-card'
import { AddProjectModal } from '@/components/launchstack/add-project-modal'
import { projectServices } from '@/lib/services/projectService'
import type { Project, CreateProjectInput } from '@/types/project'

interface ProjectsClientProps {
  basePath: string
}

export function ProjectsClient({ basePath }: ProjectsClientProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch projects when the component mounts.
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setError(null)

        const data = await projectServices.getAll()
        setProjects(data)
      } catch (error) {
        setError(
          error instanceof Error ? error.message : 'Failed to fetch projects.',
        )
      } finally {
        setIsLoading(false)
      }
    }

    fetchProjects()
  }, [])

  // Create a project and refresh the list.
  const handleAddProject = async (data: CreateProjectInput) => {
    await projectServices.create(data)

    const updatedProjects = await projectServices.getAll()
    setProjects(updatedProjects)
  }

  if (isLoading) {
    return <p className="text-muted-foreground">Loading projects...</p>
  }

  if (error) {
    return <p className="text-destructive">{error}</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <AddProjectModal onAddProject={handleAddProject} />
      </div>

      {projects.length === 0 ? (
        <p className="text-muted-foreground">
          No projects found. Create your first project.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.project_id}
              project={project}
              href={`${basePath}/projects/${project.project_id}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
