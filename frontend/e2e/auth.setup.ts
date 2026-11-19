import { execFileSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { expect, test } from '@playwright/test'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
const PASSWORD = 'Passw0rd!123'
const USER_COUNT = 3
const AUTH_DIR = path.join(process.cwd(), 'e2e', '.auth')
const USERS_FILE = path.join(AUTH_DIR, 'users.json')

test('seed test users and capture authenticated storage states', async ({
  request,
}) => {
  mkdirSync(AUTH_DIR, { recursive: true })

  const stamp = Date.now()
  const emails = Array.from(
    { length: USER_COUNT },
    (_, index) => `e2e_suite_${stamp}_${index + 1}@example.com`,
  )

  execFileSync(
    'node',
    [
      '--env-file=../.env.test',
      'tests/e2e-data.mjs',
      'seed',
      JSON.stringify({ emails, outputPath: USERS_FILE }),
    ],
    { cwd: path.resolve(process.cwd(), '../backend'), stdio: 'inherit' },
  )

  const { readFileSync } = await import('node:fs')
  const users = JSON.parse(readFileSync(USERS_FILE, 'utf8'))

  for (const [index, user] of users.entries()) {
    const response = await request.post(`${API_URL}/auth/login`, {
      data: { email: user.email, password: PASSWORD },
    })
    expect(response.status()).toBe(200)

    await request.storageState({
      path: path.join(AUTH_DIR, `user${index + 1}.json`),
    })
  }
})
