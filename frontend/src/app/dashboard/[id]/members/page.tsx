import { PageHeader } from "@/components/launchstack/page-header"
import { MemberList } from "@/components/launchstack/member-list"
import { members } from "@/data/launchstack"

export default function MembersPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 md:px-6">
      <PageHeader
        eyebrow="Workspace"
        title="Members"
        description="People with access to this workspace and the work they own."
      />
      <MemberList members={members} />
    </div>
  )
}
