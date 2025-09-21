import type { Router as ExpressRouter } from 'express'
import { Router } from 'express'

import {
  createKnowledgeBaseHandler,
  ingestKnowledgeBaseDocumentsHandler,
} from '../controller/knowledgeBase.js'

const knowledgeBaseRouter: ExpressRouter = Router()

knowledgeBaseRouter.post('/', createKnowledgeBaseHandler)
knowledgeBaseRouter.post('/:knowledgeBaseId/documents', ingestKnowledgeBaseDocumentsHandler)

export default knowledgeBaseRouter
