import { apiClient } from "@/lib/api/apiClient"

import type {
  Project,
  ProjectStats,
  CreateProjectInput,
  CreateProjectResponse,
  UpdateProjectInput,
  UpdateProjectResponse,
  DeleteProjectResponse,
} from "@/types/project"

import type {
  ProjectMember,
  AddProjectMemberInput,
  AddProjectMemberResponse,
  DeleteProjectMemberResponse,
} from "@/types/projectMember"

export const projectServices = {
  getAll: (type?: string) =>
    apiClient<Project[]>("/projects", {
      params: type ? { type } : undefined,
    }),

  getById: (projectId: number) =>
    apiClient<Project>(`/projects/${projectId}`),

  create: (data: CreateProjectInput) =>
    apiClient<CreateProjectResponse>("/projects", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (projectId: number, data: UpdateProjectInput) =>
    apiClient<UpdateProjectResponse>(`/projects/${projectId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (projectId: number) =>
    apiClient<DeleteProjectResponse>(`/projects/${projectId}`, {
      method: "DELETE",
    }),

  getStats: () =>
    apiClient<ProjectStats[]>("/projects/stats"),

  getMembers: (projectId: number) =>
    apiClient<ProjectMember[]>(`/projects/${projectId}/members`),

  addMember: (projectId: number, data: AddProjectMemberInput) =>
    apiClient<AddProjectMemberResponse>(
      `/projects/${projectId}/members`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    ),

  deleteMember: (projectId: number, userId: number) =>
    apiClient<DeleteProjectMemberResponse>(
      `/projects/${projectId}/members/${userId}`,
      {
        method: "DELETE",
      },
    ),
}
