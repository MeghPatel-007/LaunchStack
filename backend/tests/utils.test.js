import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isParsableTime } from '../src/utils/isParsableTime.js'
import { validatePhase } from '../src/utils/phaseValidation.js'

test('isParsableTime accepts parseable strings only', () => {
  assert.equal(isParsableTime('2026-01-01'), true)
  assert.equal(isParsableTime('2026-01-01T10:00:00Z'), true)
  assert.equal(isParsableTime('not-a-date'), false)
  assert.equal(isParsableTime(''), false)
  assert.equal(isParsableTime(0), false)
  assert.equal(isParsableTime(Date.now()), false)
  assert.equal(isParsableTime(new Date()), false)
  assert.equal(isParsableTime(null), false)
  assert.equal(isParsableTime(undefined), false)
})

test('validatePhase accepts consistent status and timestamps', () => {
  assert.doesNotThrow(() =>
    validatePhase({
      status: 'NOT_STARTED',
      startTime: null,
      finishedTime: null,
    }),
  )
  assert.doesNotThrow(() =>
    validatePhase({
      status: 'IN_PROGRESS',
      startTime: '2026-01-01',
      finishedTime: null,
    }),
  )
  assert.doesNotThrow(() =>
    validatePhase({
      status: 'COMPLETED',
      startTime: '2026-01-01',
      finishedTime: '2026-01-02',
    }),
  )
})

test('validatePhase rejects inconsistent status and timestamps', () => {
  const cases = [
    [{ status: 'UNKNOWN', startTime: null, finishedTime: null }, 'Invalid Phase status'],
    [{ status: null, startTime: null, finishedTime: null }, 'Invalid Phase status'],
    [{ status: 'NOT_STARTED', startTime: '2026-01-01', finishedTime: null }, 'NOT_STARTED cannot have timestamps'],
    [
      { status: 'IN_PROGRESS', startTime: null, finishedTime: null },
      'IN_PROGRESS requires a valid startTime and no finished_time',
    ],
    [
      { status: 'COMPLETED', startTime: '2026-01-02', finishedTime: '2026-01-01' },
      'Invalid startTime or finishedTime',
    ],
  ]

  for (const [input, message] of cases) {
    assert.throws(
      () => validatePhase(input),
      (error) => error.code === 'PHASE_VALIDATION' && error.message === message,
    )
  }
})
