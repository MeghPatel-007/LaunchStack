import { apiClient } from "@/lib/api/apiClient"

import type {
  Phase,
  CreatePhaseInput,
  UpdatePhaseInput,
  CreatePhaseResponse,
  UpdatePhaseResponse,
  DeletePhaseResponse,
} from "@/types/phase"

export const phaseServices = {
  getAll: (projectId: number) =>
    apiClient<Phase[]>(`/projects/${projectId}/phases`),

  getById: (phaseId: number) =>
    apiClient<Phase>(`/phases/${phaseId}`),

  create: (projectId: number, data: CreatePhaseInput) =>
    apiClient<CreatePhaseResponse>(
      `/projects/${projectId}/phases`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    ),

  update: (phaseId: number, data: UpdatePhaseInput) =>
    apiClient<UpdatePhaseResponse>(`/phases/${phaseId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (phaseId: number) =>
    apiClient<DeletePhaseResponse>(`/phases/${phaseId}`, {
      method: "DELETE",
    }),
}
