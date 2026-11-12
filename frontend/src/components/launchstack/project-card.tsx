import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ProjectStatusBadge } from "@/components/launchstack/status-badge"
import { MemberAvatarGroup } from "@/components/launchstack/member-avatar-group"
import {
  getProjectMembers,
  type Project,
} from "@/data/launchstack"

export function ProjectCard({
  project,
  href,
}: {
  project: Project
  href: string
}) {
  const projectMembers = getProjectMembers(project)

  return (
    <Link href={href} className="group block rounded-xl focus-visible:ring-2 focus-visible:ring-ring">
      <Card className="h-full transition-colors group-hover:border-ring/40">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                {project.key}
              </p>
              <CardTitle className="truncate">{project.name}</CardTitle>
            </div>
            <ProjectStatusBadge status={project.status} />
          </div>
          <p className="text-muted-foreground line-clamp-2 text-sm">
            {project.description}
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <div className="text-muted-foreground flex items-center justify-between text-xs">
            <span>Progress</span>
            <span className="tabular-nums">{project.progress}%</span>
          </div>
          <Progress value={project.progress} />
        </CardContent>
        <CardFooter className="justify-between">
          <MemberAvatarGroup members={projectMembers} />
          <span className="text-muted-foreground text-xs">
            Updated {project.updatedAt}
          </span>
        </CardFooter>
      </Card>
    </Link>
  )
}
