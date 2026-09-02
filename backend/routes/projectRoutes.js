import express from 'express'
import {
  createProject,
  deleteProjectById,
  getProjectById,
  getProjects,
  getProjectStats,
  putProjectById,
} from '../src/controllers/projectController.js'

const projectRouter = express.Router()
// ! IMP : Route Order
projectRouter.post('/', createProject)

projectRouter.get('/', getProjects)

projectRouter.get('/stats', getProjectStats)

// * routes of ids or any parameter route should be at last
projectRouter.get('/:id', getProjectById)

projectRouter.put('/:id', putProjectById)

projectRouter.delete('/:id', deleteProjectById)

// * just for testing purpose
// app.get('/test-route', (req, res, next) => {
//   const error = new Error('testing route')
//   next(error)
// })

export default projectRouter
