import { Progress } from "@/components/ui/progress"
import { EmptyState } from "@/components/launchstack/empty-state"
import type { Phase, PhaseStatus } from "@/data/launchstack"

const phaseDotStyles: Record<PhaseStatus, string> = {
  Planned: "bg-muted-foreground",
  "In progress": "bg-info",
  Completed: "bg-success",
}

export function PhaseList({ items }: { items: Phase[] }) {
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
      {items.map((phase) => (
        <li key={phase.id} className="relative">
          <span className="bg-background border-border absolute top-1 -left-[1.9rem] size-3 rounded-full border-2" />
          <div className="flex flex-col gap-3 rounded-lg border p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex flex-col gap-0.5">
                <p className="font-medium">{phase.name}</p>
                <p className="text-muted-foreground text-sm">
                  {phase.description}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="border-border bg-background inline-flex h-5 items-center gap-1.5 rounded-full border px-2 text-xs font-medium">
                  <span
                    className={`size-1.5 rounded-full ${phaseDotStyles[phase.status]}`}
                  />
                  {phase.status}
                </span>
                <span className="text-muted-foreground text-xs">
                  {phase.taskCount} tasks
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="text-muted-foreground flex items-center justify-between text-xs">
                <span>
                  {phase.startDate} – {phase.endDate}
                </span>
                <span className="tabular-nums">{phase.progress}%</span>
              </div>
              <Progress value={phase.progress} />
            </div>
          </div>
        </li>
      ))}
    </ol>
  )
}
