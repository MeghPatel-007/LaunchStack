import { getProjectRole } from '../db/projectMembership.js'

export async function requireProjectOwner(req, res, next) {
  const projectId = req.params.id
  const ownerUserId = req.user.user_id
  try {
    const role = await getProjectRole(ownerUserId, projectId)
    if (role !== 'OWNER') {
      return res.status(403).json('Only project owners are allowed') // forbidden/permission
    }
    next()
  } catch (e) {
    res.status(500).json({ MiddlewareError: e.message })
  }
}

export async function requireProjectMember(req, res, next) {
  const projectId = req.params.id
  const userId = req.user.user_id
  try {
    const role = await getProjectRole(userId, projectId)
    if (role === null) {
      return res.status(403).json('Non members are not allowed')
    }
    next()
  } catch (e) {
    res.status(500).json({ MiddlewareError: e.message })
  }
}
