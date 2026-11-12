import { PageHeader } from "@/components/launchstack/page-header"
import { ProjectCard } from "@/components/launchstack/project-card"
import { projects } from "@/data/launchstack"

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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            href={`${base}/projects/${project.id}`}
          />
        ))}
      </div>
    </div>
  )
}
