import { readFileSync } from 'node:fs'
import path from 'node:path'
import { expect, type APIRequestContext } from '@playwright/test'

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
export const PASSWORD = 'Passw0rd!123'

export interface TestUser {
  email: string
  userId: number
}

export function storageState(user: number) {
  return path.join('e2e', '.auth', `user${user}.json`)
}

export function getUsers(): TestUser[] {
  return JSON.parse(
    readFileSync(path.join(process.cwd(), 'e2e', '.auth', 'users.json'), 'utf8'),
  )
}

export async function createProject(
  request: APIRequestContext,
  overrides: Record<string, unknown> = {},
): Promise<number> {
  const name = `E2E project ${Date.now()}_${Math.random().toString(16).slice(2)}`
  const response = await request.post(`${API_URL}/projects`, {
    data: { name, project_type: 'web', tech_stack: 'react', ...overrides },
  })

  expect(response.status()).toBe(201)
  const body = await response.json()
  return body.projectID
}

export async function createPhase(
  request: APIRequestContext,
  projectId: number,
  overrides: Record<string, unknown> = {},
): Promise<number> {
  const response = await request.post(
    `${API_URL}/projects/${projectId}/phases`,
    {
      data: {
        name: 'E2E phase',
        status: 'NOT_STARTED',
        position: 1,
        ...overrides,
      },
    },
  )

  expect(response.status()).toBe(201)
  const body = await response.json()
  return body.phase.phase_id
}
