import { EmptyState } from '@/components/launchstack/empty-state'
import type { Phase as ApiPhase } from '@/types/phase'
import type { Phase as MockPhase } from '@/data/launchstack'

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

function formatDate(value: string | null | undefined) {
  if (!value) return null

  return new Date(value).toLocaleDateString()
}

export function PhaseList({ items }: { items: (ApiPhase | MockPhase)[] }) {
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
        const startTime =
          'start_time' in phase
            ? phase.start_time
            : 'startDate' in phase
              ? phase.startDate
              : null
        const finishedTime =
          'finished_time' in phase
            ? phase.finished_time
            : 'endDate' in phase
              ? phase.endDate
              : null
        const position =
          'position' in phase
            ? phase.position
            : 'progress' in phase
              ? `${phase.progress}%`
              : null

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

                <span className="border-border bg-background inline-flex h-5 items-center gap-1.5 rounded-full border px-2 text-xs font-medium">
                  <span className={`size-1.5 rounded-full ${badge.dot}`} />
                  {badge.label}
                </span>
              </div>

              <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
                {startTime && <span>Started: {formatDate(startTime)}</span>}

                {finishedTime && (
                  <span>Finished: {formatDate(finishedTime)}</span>
                )}

                {position !== null && <span>Position: {position}</span>}
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
