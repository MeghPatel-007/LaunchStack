'use client'

import { useState } from 'react'
import { EmptyState } from '@/components/launchstack/empty-state'
import type { Phase as ApiPhase } from '@/types/phase'
import type { Phase as MockPhase } from '@/data/launchstack'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PhaseModal } from '@/components/launchstack/phase-modal'
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

import type { UpdatePhaseInput } from '@/types/phase'

interface PhaseListProps {
  items: (ApiPhase | MockPhase)[]
  onEditPhase?: (phaseId: number, data: UpdatePhaseInput) => Promise<void>
  onDeletePhase?: (phaseId: number) => Promise<void>
}

function DeletePhaseDialog({
  phase,
  onDeletePhase,
}: {
  phase: ApiPhase
  onDeletePhase: (phaseId: number) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')

  const handleDelete = async () => {
    if (isDeleting) return

    setIsDeleting(true)
    setError('')

    try {
      await onDeletePhase(phase.phase_id)
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete phase.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isDeleting) return

        setOpen(nextOpen)

        if (nextOpen) setError('')
      }}
    >
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            aria-label={`Delete ${phase.name}`}
            title="Delete phase"
          >
            <Trash2 className="size-4" />
          </Button>
        }
      />

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete phase?</AlertDialogTitle>

          <AlertDialogDescription>
            Are you sure you want to delete &quot;{phase.name}&quot;? This
            action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>

          <AlertDialogAction
            className="bg-destructive text-white hover:bg-destructive/90"
            disabled={isDeleting}
            onClick={() => {
              void handleDelete()
            }}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function getStatusBadge(status: string) {
  if (status === 'NOT_STARTED' || status === 'Planned') {
    return {
      dot: 'bg-muted-foreground',
      label: status === 'NOT_STARTED' ? 'Not started' : 'Planned',
    }
  }
  if (status === 'IN_PROGRESS' || status === 'In progress') {
    return { dot: 'bg-info', label: 'In progress' }
  }
  return { dot: 'bg-success', label: 'Completed' }
}

export function PhaseList({
  items,
  onEditPhase,
  onDeletePhase,
}: PhaseListProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="No phases planned"
        description="Break the project into phases to track progress over time."
      />
    )
  }

  return (
    <ol className="relative flex flex-col gap-4 border-l pl-6">
      {items.map((phase) => {
        const id = 'phase_id' in phase ? phase.phase_id : phase.id
        const badge = getStatusBadge(phase.status)

        return (
          <li key={id} className="relative">
            <span className="bg-background border-border absolute top-1 -left-[1.9rem] size-3 rounded-full border-2" />

            <div className="flex flex-col gap-3 rounded-lg border p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <p className="font-medium">{phase.name}</p>

                  <p className="text-muted-foreground text-sm">
                    {phase.description || 'No description provided.'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="border-border bg-background inline-flex h-5 items-center gap-1.5 rounded-full border px-2 text-xs font-medium">
                    <span className={`size-1.5 rounded-full ${badge.dot}`} />
                    {badge.label}
                  </span>

                  {'phase_id' in phase && onEditPhase && (
                    <PhaseModal
                      phase={phase}
                      nextPosition={phase.position}
                      onUpdatePhase={(data) =>
                        onEditPhase(phase.phase_id, data)
                      }
                      trigger={
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          aria-label={`Edit ${phase.name}`}
                          title="Edit phase"
                        >
                          <Pencil className="size-4" />
                        </Button>
                      }
                    />
                  )}

                  {'phase_id' in phase && onDeletePhase && (
                    <DeletePhaseDialog
                      phase={phase}
                      onDeletePhase={onDeletePhase}
                    />
                  )}
                </div>
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
