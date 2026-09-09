import { isParsableTime } from './isParsableTime.js'

export function validatePhase({ status, startTime, finishedTime }) {
  const validStatus = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']
  if (typeof status !== 'string' || !validStatus.includes(status)) {
    const error = new Error('Invalid Phase status')
    error.code = 'PHASE_VALIDATION'
    throw error
  }
  if (
    status === 'NOT_STARTED' &&
    (startTime !== null || finishedTime !== null)
  ) {
    const error = new Error('NOT_STARTED cannot have timestamps')
    error.code = 'PHASE_VALIDATION'
    throw error
  }
  if (
    status === 'IN_PROGRESS' &&
    (!isParsableTime(startTime) || finishedTime !== null)
  ) {
    const error = new Error(
      'IN_PROGRESS requires a valid startTime and no finished_time',
    )
    error.code = 'PHASE_VALIDATION'
    throw error
  }
  if (
    status === 'COMPLETED' &&
    (!isParsableTime(startTime) ||
      !isParsableTime(finishedTime) ||
      new Date(finishedTime) < new Date(startTime))
  ) {
    const error = new Error('Invalid startTime or finishedTime')
    error.code = 'PHASE_VALIDATION'
    throw error
  }
}
