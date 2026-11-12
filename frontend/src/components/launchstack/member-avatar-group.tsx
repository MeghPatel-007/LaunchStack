import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "@/components/ui/avatar"
import { initials, type Member } from "@/data/launchstack"

export function MemberAvatarGroup({
  members,
  max = 3,
}: {
  members: Member[]
  max?: number
}) {
  const visible = members.slice(0, max)
  const extra = members.length - visible.length

  return (
    <AvatarGroup>
      {visible.map((member) => (
        <Avatar key={member.id} size="sm" title={member.name}>
          <AvatarFallback>{initials(member.name)}</AvatarFallback>
        </Avatar>
      ))}
      {extra > 0 && (
        <AvatarGroupCount className="text-xs">+{extra}</AvatarGroupCount>
      )}
    </AvatarGroup>
  )
}
