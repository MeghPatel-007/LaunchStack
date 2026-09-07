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

const projectRouter = express.Router()
// ! IMP : Route Order
projectRouter.post('/', createProject)

projectRouter.get('/', getProjects)

projectRouter.get('/stats', getProjectStats)

// * routes of ids or any parameter route should be at last
projectRouter.get('/:id', requireProjectMember, getProjectById)

projectRouter.put('/:id', requireProjectOwner, putProjectById)

projectRouter.delete('/:id', requireProjectOwner, deleteProjectById)

projectRouter.post('/:id/members', requireProjectOwner, addMemberbyId)

projectRouter.get('/:id/members', requireProjectMember, getProjectMembers)

projectRouter.delete(
  '/:id/members/:userId',
  requireProjectOwner,
  deleteMemberById,
)
// * just for testing purpose
// app.get('/test-route', (req, res, next) => {
//   const error = new Error('testing route')
//   next(error)
// })

export default projectRouter
