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

import { PhaseModal } from '@/components/launchstack/phase-modal'
import type { CreatePhaseInput, UpdatePhaseInput } from '@/types/phase'

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
  const [actionError, setActionError] = useState<string | null>(null)

  const handleAddPhase = async (phaseData: CreatePhaseInput) => {
    const result = await phaseServices.create(projectId, phaseData)

    setData((prev) => {
      if (!prev) return prev

      return {
        ...prev,
        phases: [...prev.phases, result.phase].sort(
          (a, b) => a.position - b.position,
        ),
      }
    })
  }
  const handleUpdatePhase = async (
    phaseId: number,
    phaseData: UpdatePhaseInput,
  ) => {
    const result = await phaseServices.update(phaseId, phaseData)

    setData((prev) => {
      if (!prev) return prev

      return {
        ...prev,
        phases: prev.phases
          .map((phase) => (phase.phase_id === phaseId ? result.phase : phase))
          .sort((a, b) => a.position - b.position),
      }
    })
  }
  const handleDeletePhase = async (phaseId: number) => {
    setActionError(null)

    // Throws on failure, so the phase stays in state and the dialog shows the error.
    await phaseServices.delete(phaseId)

    setData((prev) => {
      if (!prev) return prev

      return {
        ...prev,
        phases: prev.phases.filter((phase) => phase.phase_id !== phaseId),
      }
    })

    try {
      const allStats = await projectServices.getStats()
      const stats =
        allStats.find((item) => item.project_id === projectId) ?? null

      setData((prev) => (prev ? { ...prev, stats } : prev))
    } catch {
      // The delete already succeeded; never restore the phase over a stats failure.
      setActionError(
        'Phase deleted, but project statistics could not be refreshed.',
      )
    }
  }
  const handleAddMember = async (userId: number) => {
    await projectServices.addMember(projectId, { userId })

    const updatedMembers = await projectServices.getMembers(projectId)

    setData((prev) =>
      prev
        ? {
            ...prev,
            members: updatedMembers,
          }
        : prev,
    )
  }
  const handleRemoveMember = async (userId: number) => {
    setActionError(null)

    try {
      await projectServices.deleteMember(projectId, userId)

      setData((prev) =>
        prev
          ? {
              ...prev,
              members: prev.members.filter(
                (member) => member.user_id !== userId,
              ),
            }
          : prev,
      )
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'Failed to remove member.',
      )
    }
  }
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Phases</CardTitle>
              <p className="text-muted-foreground text-sm">
                The larger stages this project moves through.
              </p>
            </div>

            <PhaseModal
              onAddPhase={handleAddPhase}
              nextPosition={
                phases.length > 0
                  ? Math.max(...phases.map((phase) => phase.position)) + 1
                  : 1
              }
            />
          </div>
        </CardHeader>

        <CardContent>
          {actionError && (
            <p role="alert" className="text-destructive mb-4 text-sm">
              {actionError}
            </p>
          )}

          <PhaseList
            items={phases}
            onEditPhase={handleUpdatePhase}
            onDeletePhase={handleDeletePhase}
          />
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
            <MemberList members={members} onRemoveMember={handleRemoveMember} />
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
