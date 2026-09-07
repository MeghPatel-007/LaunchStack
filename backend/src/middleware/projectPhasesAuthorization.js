import {
  getProjectIdFromPhase,
  getProjectRole,
} from '../db/projectMembership.js'

export async function requirePhaseOwner(req, res, next) {
  const ownerUserId = req.user.user_id
  const phaseId = req.params.id
  try {
    const projectId = await getProjectIdFromPhase(phaseId)
    if (projectId === null) {
      return res.status(404).json('Phase does not exist')
    }
    const role = await getProjectRole(ownerUserId, projectId)
    if (role !== 'OWNER') {
      return res.status(403).json('Only project owners are allowed') // forbidden/permission
    }
    next()
  } catch (e) {
    res.status(500).json({ MiddlewareError: e.message })
  }
}

export async function requirePhaseMember(req, res, next) {
  const userId = req.user.user_id
  const phaseId = req.params.id
  try {
    const projectId = await getProjectIdFromPhase(phaseId)
    if (projectId === null) {
      return res.status(404).json('Phase does not exist')
    }
    const role = await getProjectRole(userId, projectId)
    if (role === null) {
      return res.status(403).json('Non members are not allowed')
    }
    next()
  } catch (e) {
    res.status(500).json({ MiddlewareError: e.message })
  }
}

export async function requireProjectPhaseOwner(req, res, next) {
  const projectId = req.params.projectId
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

export async function requireProjectPhaseMember(req, res, next) {
  const projectId = req.params.projectId
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
