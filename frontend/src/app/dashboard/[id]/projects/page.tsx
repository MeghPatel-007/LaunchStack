import { PageHeader } from '@/components/launchstack/page-header'
import { ProjectsClient } from '@/components/launchstack/projects-client'

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const base = `/dashboard/${id}`

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 md:px-6">
      <PageHeader
        eyebrow="Workspace"
        title="Projects"
        description="Every active and completed project in the workspace."
      />

      <ProjectsClient basePath={base} />
    </div>
  )
}
