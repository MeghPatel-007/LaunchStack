import express from 'express'
import {
  createPhase,
  deletePhaseById,
  getPhaseById,
  getPhases,
  putPhaseById,
} from '../controllers/projectPhaseController.js'
import {
  requirePhaseMember,
  requirePhaseOwner,
  requireProjectPhaseMember,
  requireProjectPhaseOwner,
} from '../middleware/projectPhasesAuthorization.js'

const projectPhaseRouter = express.Router()

projectPhaseRouter.post(
  '/projects/:projectId/phases',
  requireProjectPhaseOwner,
  createPhase,
)

projectPhaseRouter.get(
  '/projects/:projectId/phases',
  requireProjectPhaseMember,
  getPhases,
)

projectPhaseRouter.get('/phases/:id', requirePhaseMember, getPhaseById)

projectPhaseRouter.put('/phases/:id', requirePhaseOwner, putPhaseById)

projectPhaseRouter.delete('/phases/:id', requirePhaseOwner, deletePhaseById)

export default projectPhaseRouter
