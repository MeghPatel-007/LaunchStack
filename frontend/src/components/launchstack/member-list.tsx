import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { ProjectMember } from '@/types/projectMember'
import type { Member as MockMember } from '@/data/launchstack'

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function MemberList({
  members,
}: {
  members: (ProjectMember | MockMember)[]
}) {
  if (members.length === 0) {
    return (
      <p className="text-muted-foreground py-4 text-sm">
        No members found for this project.
      </p>
    )
  }

  return (
    <div className="divide-border divide-y rounded-xl border">
      {members.map((member) => {
        const id = 'user_id' in member ? member.user_id : member.id
        const displayName = 'username' in member ? member.username : member.name

        return (
          <div
            key={id}
            className="flex items-center justify-between gap-4 p-4"
          >
            <div className="flex min-w-0 items-center gap-3">
              <Avatar>
                <AvatarFallback>{initials(displayName)}</AvatarFallback>
              </Avatar>

              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium">
                  {displayName}
                </span>

                <span className="text-muted-foreground truncate text-xs">
                  {member.email}
                </span>
              </div>
            </div>

            <span className="border-border bg-background inline-flex h-5 shrink-0 items-center rounded-full border px-2 text-xs font-medium">
              {member.role}
            </span>
          </div>
        )
      })}
    </div>
  )
}
