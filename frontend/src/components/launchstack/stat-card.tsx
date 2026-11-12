import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string
  value: string | number
  hint?: string
  icon: LucideIcon
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-muted-foreground text-sm font-medium">{label}</p>
          <p className="text-2xl font-semibold tabular-nums">{value}</p>
          {hint && (
            <p className="text-muted-foreground text-xs">{hint}</p>
          )}
        </div>
        <div className="bg-muted text-muted-foreground rounded-lg p-2">
          <Icon className="size-4" />
        </div>
      </CardContent>
    </Card>
  )
}
