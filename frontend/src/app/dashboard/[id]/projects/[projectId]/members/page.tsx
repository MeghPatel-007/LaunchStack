import { notFound } from "next/navigation"

import { PageHeader } from "@/components/launchstack/page-header"
import { MemberList } from "@/components/launchstack/member-list"
import { getProject, getProjectMembers } from "@/data/launchstack"

export default async function ProjectMembersPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const project = getProject(projectId)

  if (!project) notFound()

  const projectMembers = getProjectMembers(project)

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 md:px-6">
      <PageHeader
        eyebrow="Project"
        title="Members"
        description="People with access to this project and the roles they hold."
        headingLevel="h2"
      />
      <MemberList members={projectMembers} />
    </div>
  )
}
