
'use client'

import { useEffect, useState } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PhaseList } from '@/components/launchstack/phase-list'
import { MemberList } from '@/components/launchstack/member-list'

import { projectServices } from '@/lib/services/projectService'
import { phaseServices } from '@/lib/services/projectPhaseService'

import type { Project } from '@/types/project'
import type { ProjectMember } from '@/types/projectMember'
import type { Phase } from '@/types/phase'

interface ProjectOverviewClientProps {
  projectId: number
}

interface ProjectOverviewData {
  project: Project
  phases: Phase[]
  members: ProjectMember[]
}

export function ProjectOverviewClient({
  projectId,
}: ProjectOverviewClientProps) {
  const [data, setData] = useState<ProjectOverviewData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const fetchProjectOverview = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const [project, phases, members] = await Promise.all([
          projectServices.getById(projectId),
          phaseServices.getAll(projectId),
          projectServices.getMembers(projectId),
        ])

        if (isMounted) {
          setData({
            project,
            phases,
            members,
          })
        }
      } catch (error) {
        if (isMounted) {
          setError(
            error instanceof Error
              ? error.message
              : 'Failed to load project overview.',
          )
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchProjectOverview()

    return () => {
      isMounted = false
    }
  }, [projectId])

  if (isLoading) {
    return (
      <p className="text-muted-foreground py-8 text-center">
        Loading project overview...
      </p>
    )
  }

  if (error) {
    return (
      <p role="alert" className="text-destructive py-8 text-center">
        {error}
      </p>
    )
  }

  if (!data) {
    return (
      <p className="text-muted-foreground py-8 text-center">
        Project not found.
      </p>
    )
  }

  const { project, phases, members } = data

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 md:px-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>{project.name}</CardTitle>

            <span className="rounded-md border px-2 py-1 text-xs font-medium">
              {project.role}
            </span>
          </div>

          <p className="text-muted-foreground text-sm">
            {project.description || 'No description provided.'}
          </p>
        </CardHeader>

        <CardContent className="flex flex-wrap gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Type: </span>
            {project.project_type}
          </div>

          <div>
            <span className="text-muted-foreground">Tech stack: </span>
            {project.tech_stack || 'Not specified'}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Phases</CardTitle>
          <p className="text-muted-foreground text-sm">
            The larger stages this project moves through.
          </p>
        </CardHeader>

        <CardContent>
          <PhaseList items={phases} />
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
            <MemberList members={members} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <p className="text-muted-foreground text-sm">
              Activity tracking will be connected after the backend endpoint
              is implemented.
            </p>
          </CardHeader>

          <CardContent>
            <p className="text-muted-foreground text-sm">
              No activity data available yet.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
