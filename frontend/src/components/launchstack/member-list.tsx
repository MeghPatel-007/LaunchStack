import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { ProjectMember } from '@/types/projectMember'
import type { Member as MockMember } from '@/data/launchstack'

import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

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
  onRemoveMember,
}: {
  members: (ProjectMember | MockMember)[]
  onRemoveMember?: (userId: number) => void
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
        const role = member.role
        const userId = 'user_id' in member ? member.user_id : null

        return (
          <div key={id} className="flex items-center justify-between gap-4 p-4">
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

            <div className="flex shrink-0 items-center gap-2">
              <span className="border-border bg-background inline-flex h-5 items-center rounded-full border px-2 text-xs font-medium">
                {role}
              </span>

              {role !== 'OWNER' && userId !== null && onRemoveMember && (
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        aria-label={`Remove ${displayName}`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    }
                  />

                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Remove project member?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove {displayName} from this project. They
                        will lose access to it.
                      </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onRemoveMember(userId)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Remove
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
