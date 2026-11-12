export type ProjectMember = {
  user_id: number
  username: string
  email: string
  role: "OWNER" | "MEMBER"
  created_at: string
}

export type AddProjectMemberInput = {
  userId: number
}

export type AddProjectMemberResponse = {
  msg: string
  userId: {
    user_id: number
  }
}

export type DeleteProjectMemberResponse = {
  msg: string
  userId: number
}
