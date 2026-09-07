export function isParsableTime(value) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value))
}
