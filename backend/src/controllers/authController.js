import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import pool from '../db/pool.js'

export async function registration(req, res) {
  const { username, email, password } = req.body
  const emailFormat = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/ // regex expression
  try {
    if (typeof username !== 'string' || username.trim() === '') {
      return res.status(400).json('Username is empty or missing')
    }
    if (typeof email !== 'string' || email.trim() === '') {
      return res.status(400).json('Email is empty or missing')
    }
    if (typeof password !== 'string' || password.trim() === '') {
      return res.status(400).json('password is empty or missing')
    }
    if (!emailFormat.test(email.trim())) {
      return res.status(400).json('Invalid Email Format')
    }
    const validEmail = email.toLowerCase().trim()
    const emailCheck = await pool.query(
      `
        select email
        from users
        where email = $1
        `,
      [validEmail],
    )
    if (emailCheck.rowCount > 0) {
      return res.status(400).json('Email already exists')
    }
    const passwordHash = await bcrypt.hash(password, 10)
    const query = `
        insert into users(username,email,password_hash)
        values ($1,$2,$3)
        returning user_id
        `
    const result = await pool.query(query, [username, validEmail, passwordHash])
    res.status(200).json({
      msg: 'User is created successfully',
      userId: result.rows[0],
    })
  } catch (e) {
    next(e)
  }
}

export async function login(req, res) {
  const { email, password } = req.body
  const emailFormat = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/ // regex expression
  try {
    if (typeof email !== 'string' || email.trim() === '') {
      return res.status(400).json('Email is empty or missing')
    }
    if (typeof password !== 'string' || password.trim() === '') {
      return res.status(400).json('password is empty or missing')
    }
    if (!emailFormat.test(email.trim())) {
      return res.status(400).json('Invalid Email Format')
    }
    const validEmail = email.toLowerCase().trim()
    const result = await pool.query(
      `
        select user_id,password_hash,email
        from users
        where email = $1
        `,
      [validEmail],
    )
    if (
      result.rowCount === 0 ||
      !(await bcrypt.compare(password, result.rows[0].password_hash))
    ) {
      return res.status(401).json('Invalid email or password')
    }
    const payload = { user_id: result.rows[0].user_id }
    const options = { expiresIn: '24h' }
    const secret = process.env.JWT_SECRET
    const token = jwt.sign(payload, secret, options)
    res.status(200).json({
      msg: 'User can login successfully',
      token: token,
      userId: result.rows[0].user_id,
    })
  } catch (e) {
    next(e)
  }
}
