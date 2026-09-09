export function validateId(id) {
  return (req, res, next) => {
    const numericId = Number(req.params[id])
    try {
      if (
        Number.isNaN(numericId) ||
        !Number.isInteger(numericId) ||
        numericId <= 0
      ) {
        return res.status(400).json('Invalid Id')
      }
      next()
    } catch (e) {
      next(e)
    }
  }
}

export function validateRequiredStrings(fields) {
  return (req, res, next) => {
    for (const field of fields) {
      if (
        typeof req.body[field] === 'undefined' ||
        (typeof req.body[field] !== 'string' || req.body[field].trim() === '')
      ) {
        return res.status(400).json({
          error: `${field} is required and must be a non-empty string`,
        })
      }
    }
    next()
  }
}

export function validateOptionalStrings(fields) {
  return (req, res, next) => {
    for (const field of fields) {
      if (
        typeof req.body[field] !== 'undefined' &&
        typeof req.body[field] !== 'string'
      ) {
        return res.status(400).json({
          error: `${field} must be a string if provided`,
        })
      }
    }
    next()
  }
}

export function validatePositiveInteger(fields) {
  return (req, res, next) => {
    for (const field of fields) {
      if (
        typeof req.body[field] === 'undefined' ||
        !Number.isInteger(req.body[field]) ||
        req.body[field] <= 0
      ) {
        return res.status(400).json({
          error: `${field} must be a positive integer`,
        })
      }
    }
    next()
  }
}

export function validateEmail(fields) {
  return (req, res, next) => {
    const emailFormat = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/ // regex expression
    for (const field of fields) {
      if (!emailFormat.test(req.body[field].trim())) {
        return res
          .status(400)
          .json({ error: `${field} has an invalid email format` })
      }
    }
    next()
  }
}
