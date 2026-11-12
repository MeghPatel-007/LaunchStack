import { notFound } from "next/navigation"

import { Card, CardContent } from "@/components/ui/card"
import { PageHeader } from "@/components/launchstack/page-header"
import { ActivityFeed } from "@/components/launchstack/activity-feed"
import { getProject, getProjectActivities } from "@/data/launchstack"

export default async function ProjectActivityPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const project = getProject(projectId)

  if (!project) notFound()

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 md:px-6">
      <PageHeader
        eyebrow="Project"
        title="Activity"
        description="What changed in this project, most recent first."
        headingLevel="h2"
      />

      <Card>
        <CardContent>
          <ActivityFeed items={getProjectActivities(project.id)} />
        </CardContent>
      </Card>
    </div>
  )
}
