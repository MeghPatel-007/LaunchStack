import jwt from 'jsonwebtoken'
import pool from '../db/pool.js'

export async function authenticate(req, res, next) {
  const token = req.cookies?.token

  if (!token) {
    return res.status(401).json({
      error: 'Authentication required',
    })
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)

    if (
      typeof payload !== 'object' ||
      payload === null ||
      !Number.isInteger(payload.user_id) ||
      payload.user_id <= 0
    ) {
      return res.status(401).json({
        error: 'Invalid token payload',
      })
    }

    const query = `
      SELECT user_id
      FROM users
      WHERE user_id = $1;
    `

    const result = await pool.query(query, [payload.user_id])

    if (result.rowCount === 0) {
      return res.status(401).json({
        error: 'User does not exist',
      })
    }

    req.user = {
      user_id: result.rows[0].user_id,
    }

    return next()
  } catch (error) {
    return res.status(401).json({
      error: 'Invalid or expired token',
    })
  }
}
