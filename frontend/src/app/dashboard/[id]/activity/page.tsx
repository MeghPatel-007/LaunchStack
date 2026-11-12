import { Card, CardContent } from "@/components/ui/card"
import { PageHeader } from "@/components/launchstack/page-header"
import { ActivityFeed } from "@/components/launchstack/activity-feed"
import { activities } from "@/data/launchstack"

export default function ActivityPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 md:px-6">
      <PageHeader
        eyebrow="Workspace"
        title="Activity"
        description="A chronological view of changes across every project."
      />
      <Card>
        <CardContent>
          <ActivityFeed items={activities} showProject />
        </CardContent>
      </Card>
    </div>
  )
}
