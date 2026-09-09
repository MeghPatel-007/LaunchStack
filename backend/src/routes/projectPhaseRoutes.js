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
import {
  validateId,
  validateOptionalStrings,
  validatePositiveInteger,
  validateRequiredStrings,
} from '../middleware/validation.js'

const projectPhaseRouter = express.Router()

projectPhaseRouter.post(
  '/projects/:projectId/phases',
  validateId('projectId'),
  requireProjectPhaseOwner,
  validateRequiredStrings(['name', 'status']),
  validatePositiveInteger(['position']),
  validateOptionalStrings(['description']),
  createPhase,
)

projectPhaseRouter.get(
  '/projects/:projectId/phases',
  validateId('projectId'),
  requireProjectPhaseMember,
  getPhases,
)

projectPhaseRouter.get(
  '/phases/:id',
  validateId('id'),
  requirePhaseMember,
  getPhaseById,
)

projectPhaseRouter.put(
  '/phases/:id',
  validateId('id'),
  requirePhaseOwner,
  validateRequiredStrings(['name', 'status']),
  validatePositiveInteger(['position']),
  validateOptionalStrings(['description']),
  putPhaseById,
)

projectPhaseRouter.delete(
  '/phases/:id',
  validateId('id'),
  requirePhaseOwner,
  deletePhaseById,
)

export default projectPhaseRouter
