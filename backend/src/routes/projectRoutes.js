import express from 'express'
import {
  addMemberbyId,
  createProject,
  deleteMemberById,
  deleteProjectById,
  getProjectById,
  getProjectMembers,
  getProjects,
  getProjectStats,
  putProjectById,
} from '../controllers/projectController.js'
import {
  requireProjectMember,
  requireProjectOwner,
} from '../middleware/projectAuthorization.js'
import {
  validateId,
  validateOptionalStrings,
  validatePositiveInteger,
  validateRequiredStrings,
} from '../middleware/validation.js'

const projectRouter = express.Router()
projectRouter.post(
  '/',
  validateRequiredStrings(['name', 'project_type']),
  validateOptionalStrings(['description', 'tech_stack']),
  createProject,
)

projectRouter.get('/', getProjects)

projectRouter.get('/stats', getProjectStats)

projectRouter.get(
  '/:id',
  validateId('id'),
  requireProjectMember,
  getProjectById,
)

projectRouter.put(
  '/:id',
  validateId('id'),
  requireProjectOwner,
  validateRequiredStrings(['name', 'project_type']),
  validateOptionalStrings(['description', 'tech_stack']),
  putProjectById,
)

projectRouter.delete(
  '/:id',
  validateId('id'),
  requireProjectOwner,
  deleteProjectById,
)

projectRouter.post(
  '/:id/members',
  validateId('id'),
  requireProjectOwner,
  validatePositiveInteger(['userId']),
  addMemberbyId,
)

projectRouter.get(
  '/:id/members',
  validateId('id'),
  requireProjectMember,
  getProjectMembers,
)

projectRouter.delete(
  '/:id/members/:userId',
  validateId('id'),
  validateId('userId'),
  requireProjectOwner,
  deleteMemberById,
)
export default projectRouter
