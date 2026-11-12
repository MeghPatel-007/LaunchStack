import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { initials, type Member } from "@/data/launchstack"

export function MemberList({ members }: { members: Member[] }) {
  return (
    <div className="divide-border divide-y rounded-xl border">
      {members.map((member) => (
        <div
          key={member.id}
          className="flex items-center justify-between gap-4 p-4"
        >
          <div className="flex min-w-0 items-center gap-3">
            <Avatar>
              <AvatarFallback>{initials(member.name)}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium">{member.name}</span>
              <span className="text-muted-foreground truncate text-xs">
                {member.email}
              </span>
            </div>
          </div>
          <span className="border-border bg-background inline-flex h-5 shrink-0 items-center rounded-full border px-2 text-xs font-medium">
            {member.role}
          </span>
        </div>
      ))}
    </div>
  )
}
