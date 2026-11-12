
export type ProjectRole = 'OWNER' | 'MEMBER'

export type ProjectType = 'web' | 'mobile' | 'api' | 'design'

export type Project = {
  project_id: number
  name: string
  description: string | null
  project_type: string
  tech_stack: string | null
  role: ProjectRole
}

export type CreateProjectInput = {
  name: string
  description: string | null
  project_type: ProjectType
  tech_stack: string
}

export type UpdateProjectInput = {
  name: string
  description: string | null
  project_type: ProjectType
  tech_stack: string
}

export type CreateProjectResponse = {
  msg: string
  projectID: number
}

export type UpdateProjectResponse = {
  msg: string
  project_id: number
}

export type ProjectStats = {
  project_id: number
  name: string
  project_type: string
  total_phases: number
  not_started_phases: number
  in_progress_phases: number
  completed_phases: number
  work_done: number
}

export type DeleteProjectResponse = string
