
export type PhaseStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "COMPLETED"

export type Phase = {
  phase_id: number
  project_id: number
  name: string
  description: string | null
  status: PhaseStatus
  position: number
  start_time: string | null
  finished_time: string | null
  created_at: string
  updated_at: string
}

export type CreatePhaseInput = {
  name: string
  description: string | null
  status: PhaseStatus
  position: number
  start_time: string | null
  finished_time: string | null
}

export type UpdatePhaseInput = CreatePhaseInput

export type CreatePhaseResponse = {
  msg: string
  phase: Phase
}

export type UpdatePhaseResponse = {
  msg: string
  phase: Phase
}

export type DeletePhaseResponse = string
