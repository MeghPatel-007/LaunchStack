import { execFileSync } from 'node:child_process'
import path from 'node:path'

export default function globalTeardown() {
  execFileSync(
    'node',
    ['--env-file=../.env.test', 'tests/e2e-data.mjs', 'cleanup'],
    { cwd: path.resolve(process.cwd(), '../backend'), stdio: 'inherit' },
  )
}
