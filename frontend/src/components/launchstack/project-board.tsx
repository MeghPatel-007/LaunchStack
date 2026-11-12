"use client"

import dynamic from "next/dynamic"
import type { Task } from "@/data/launchstack"

// dnd-kit generates ids during render, so the board is client-only to keep SSR
// markup stable. Interaction stays off: the presentational columns render no
// drag handles.
const ProjectBoardInner = dynamic(
  () =>
    import("@/components/launchstack/project-board-inner").then(
      (module) => module.ProjectBoardInner
    ),
  {
    ssr: false,
    loading: () => (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="bg-muted/30 h-48 animate-pulse rounded-xl border"
          />
        ))}
      </div>
    ),
  }
)

export function ProjectBoard({ tasks }: { tasks: Task[] }) {
  return <ProjectBoardInner tasks={tasks} />
}
