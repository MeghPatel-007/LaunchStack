import pool from "../db/pool.js"
export async function requireProjectOwner(req, res, next) {
  const projectId = req.params.id
  const ownerUserId = req.user.user_id
  try {
    const ownershipCheck = `
        select role
        from project_members
        where user_id = $1
        and project_id = $2
        `
    const ownershipCheckResult = await pool.query(ownershipCheck, [
      ownerUserId,
      projectId,
    ])
    if (
      ownershipCheckResult.rowCount === 0 ||
      ownershipCheckResult.rows[0].role !== 'OWNER'
    ) {
      return res.status(403).json('Only project owners are allowed') // forbidden/permission
    }
    next()
  } catch (e) {
    res.status(500).json({ MiddlewareError: e.message })
  }
}
