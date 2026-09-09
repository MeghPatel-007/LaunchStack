import pool from '../db/pool.js'
import { getProjectRole } from '../db/projectMembership.js'

export async function projectChecker(projectId) {
  const projectCheck = `
    select project_id
    from projects
    where project_id = $1;
  `

  const projectCheckResult = await pool.query(projectCheck, [projectId])

  return projectCheckResult.rowCount > 0
}

export async function requireProjectOwner(req, res, next) {
  const projectId = req.params.id
  const ownerUserId = req.user.user_id
  try {
    if (!(await projectChecker(projectId))) {
      return res.status(404).json('Project doesnot exist')
    }
    const role = await getProjectRole(ownerUserId, projectId)
    if (role !== 'OWNER') {
      return res.status(403).json('Only project owners are allowed') // forbidden/permission
    }
    next()
  } catch (e) {
    next(e)
  }
}

export async function requireProjectMember(req, res, next) {
  const projectId = req.params.id
  const userId = req.user.user_id
  try {
    if (!(await projectChecker(projectId))) {
      return res.status(404).json('Project doesnot exist')
    }
    const role = await getProjectRole(userId, projectId)
    if (role === null) {
      return res.status(403).json('Non members are not allowed')
    }

    next()
    next()
  } catch (e) {
    next(e)
  }
}
