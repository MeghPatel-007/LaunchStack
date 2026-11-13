'use client'

import { useEffect, useState } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PhaseList } from '@/components/launchstack/phase-list'
import { MemberList } from '@/components/launchstack/member-list'

import { projectServices } from '@/lib/services/projectService'
import { phaseServices } from '@/lib/services/projectPhaseService'

import type { Project, ProjectStats } from '@/types/project'
import type { ProjectMember } from '@/types/projectMember'
import type { Phase } from '@/types/phase'

import { Layers, CircleDashed, LoaderCircle, CheckCircle2 } from 'lucide-react'
import { StatCard } from '@/components/launchstack/stat-card'
import { Progress } from '@/components/ui/progress'

interface ProjectOverviewClientProps {
  projectId: number
}

interface ProjectOverviewData {
  project: Project
  phases: Phase[]
  members: ProjectMember[]
  stats: ProjectStats | null
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

        const [project, phases, members, allStats] = await Promise.all([
          projectServices.getById(projectId),
          phaseServices.getAll(projectId),
          projectServices.getMembers(projectId),
          projectServices.getStats(),
        ])

        const stats =
          allStats.find((item) => item.project_id === projectId) ?? null

        if (isMounted) {
          setData({
            project,
            phases,
            members,
            stats,
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

  const { project, phases, members, stats } = data

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
      {/* Project statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Project statistics</CardTitle>
          <p className="text-muted-foreground text-sm">
            Current progress across all project phases.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard
              label="Total phases"
              value={stats?.total_phases ?? 0}
              icon={Layers}
            />

            <StatCard
              label="Not started"
              value={stats?.not_started_phases ?? 0}
              icon={CircleDashed}
            />

            <StatCard
              label="In progress"
              value={stats?.in_progress_phases ?? 0}
              icon={LoaderCircle}
            />

            <StatCard
              label="Completed"
              value={stats?.completed_phases ?? 0}
              icon={CheckCircle2}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Phase completion</span>
              <span className="font-medium">{stats?.work_done ?? 0}%</span>
            </div>

            <Progress value={stats?.work_done ?? 0} />
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
              Activity tracking will be connected after the backend endpoint is
              implemented.
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
