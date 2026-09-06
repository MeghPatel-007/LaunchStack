import jwt from 'jsonwebtoken'
export function authenticate(req, res, next) {
  const authHeaders = req.headers.authorization
  if (typeof authHeaders !== 'string' || authHeaders.trim() === '') {
    return res.status(401).json('authHeaders is empty or missing')
  }
  const [bearer, token] = authHeaders.split(' ')
  if (typeof bearer !== 'string' || bearer !== 'Bearer') {
    return res.status(401).json('bearer is empty or missing')
  }
  if (typeof token !== 'string') {
    return res.status(401).json('token is missing')
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = payload;
    next()
  } catch (e) {
    res.status(401).json({ JWTError: e.message })
  }
}
