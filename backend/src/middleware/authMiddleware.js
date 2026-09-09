import jwt from 'jsonwebtoken'
import pool from '../db/pool.js'
export async function authenticate(req, res, next) {
  const authHeaders = req.headers.authorization
  if (typeof authHeaders !== 'string' || authHeaders.trim() === '') {
    return res.status(401).json('authHeaders is empty or missing')
  }
  const parts = authHeaders.split(' ')
  if (parts.length != 2) {
    return res.status(401).json('authHeader is invalid')
  }
  const [bearer, token] = parts
  if (typeof bearer !== 'string' || bearer !== 'Bearer') {
    return res.status(401).json('bearer is empty or missing')
  }
  if (typeof token !== 'string') {
    return res.status(401).json('token is missing')
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    if (
      payload.user_id === undefined ||
      !Number.isInteger(payload.user_id) ||
      payload.user_id <= 0
    ) {
      return res.status(401).json({ error: 'Invalid User id' })
    }
    const payloadCheck = `
    select user_id from users
    where user_id = $1;
    `
    const payloadCheckResult = await pool.query(payloadCheck, [payload.user_id])
    if (payloadCheckResult.rowCount === 0) {
      return res.status(401).json({ error: 'User does not exist' })
    }
    req.user = payload
    next()
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}
