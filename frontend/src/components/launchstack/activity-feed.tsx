import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  getMember,
  initials,
  projects,
  type Activity,
} from "@/data/launchstack"

export function ActivityItem({
  activity,
  showProject = false,
}: {
  activity: Activity
  showProject?: boolean
}) {
  const actor = getMember(activity.actorId)
  const project = projects.find((item) => item.id === activity.projectId)

  return (
    <li className="flex gap-3">
      <Avatar size="sm">
        <AvatarFallback>{initials(actor?.name ?? "Unknown")}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-sm">
          <span className="font-medium">{actor?.name ?? "Unknown member"}</span>{" "}
          <span className="text-muted-foreground">{activity.action}</span>{" "}
          <span className="font-medium">{activity.target}</span>
        </p>
        <p className="text-muted-foreground text-xs">
          {activity.at}
          {showProject && project && <> · {project.name}</>}
        </p>
      </div>
    </li>
  )
}

export function ActivityFeed({
  items,
  showProject = false,
}: {
  items: Activity[]
  showProject?: boolean
}) {
  if (items.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No activity yet. Updates will appear here.
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-4">
      {items.map((activity) => (
        <ActivityItem
          key={activity.id}
          activity={activity}
          showProject={showProject}
        />
      ))}
    </ul>
  )
}
