import express from 'express'
import {
  createPhase,
  deletePhaseById,
  getPhaseById,
  getPhases,
  putPhaseById,
} from '../src/controllers/projectPhaseController.js'

const projectPhaseRouter = express.Router()

projectPhaseRouter.post('/projects/:projectId/phases', createPhase)

projectPhaseRouter.get('/projects/:projectId/phases', getPhases)

projectPhaseRouter.get('/phases/:id', getPhaseById)

projectPhaseRouter.put('/phases/:id', putPhaseById)

projectPhaseRouter.delete('/phases/:id', deletePhaseById)

export default projectPhaseRouter
