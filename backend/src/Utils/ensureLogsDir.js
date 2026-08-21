import { promises as fs } from 'node:fs'
import path from 'node:path'

export async function ensureLogsDir() {
  try {
    await fs.access(path.resolve('./logs'))
    console.log('Logs dir exists')
  } catch (e) {
    if (e.code === 'ENOENT') {
      console.log('Logs dir does not exists')
      console.log('Making one ...')
      try {
        await fs.mkdir(path.resolve('./logs'))
        console.log('Logs dir is made')
      } catch (e) {
        console.error(`${e.code} : ${e.message}`)
        throw e
      }
    } else {
      console.error(`${e.code} : ${e.message}`)
      throw e
    }
  }
  return
}
