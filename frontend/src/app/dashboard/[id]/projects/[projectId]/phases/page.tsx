import { notFound } from "next/navigation"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { PageHeader } from "@/components/launchstack/page-header"
import { PhaseList } from "@/components/launchstack/phase-list"
import { getProject, getProjectPhases } from "@/data/launchstack"

export default async function ProjectPhasesPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const project = getProject(projectId)

  if (!project) notFound()

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 md:px-6">
      <PageHeader
        eyebrow="Project"
        title="Phases"
        description="The larger stages of this project and how far each one has come."
        headingLevel="h2"
      />

      <Card>
        <CardHeader>
          <CardTitle>Roadmap</CardTitle>
        </CardHeader>
        <CardContent>
          <PhaseList items={getProjectPhases(project.id)} />
        </CardContent>
      </Card>
    </div>
  )
}
