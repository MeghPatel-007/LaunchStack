import { notFound } from 'next/navigation'

import { ProjectOverviewClient } from '@/components/launchstack/project-overview-client'

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ id: string; projectId: string }>
}) {
  const { id, projectId } = await params

  const parsedProjectId = Number(projectId)

  if (!Number.isInteger(parsedProjectId) || parsedProjectId <= 0) {
    notFound()
  }

  return <ProjectOverviewClient projectId={parsedProjectId} />
}
