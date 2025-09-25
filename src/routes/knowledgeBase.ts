import type { Router as ExpressRouter } from 'express'
import { Router } from 'express'

import {
  addDocumentsToKnowledgeBase,
  createKnowledge,
  deleteKnowledge,
  queryKnowledgeCollections,
  updateKnowledge,
} from '../controller/knowledgeBase.js'

const knowledgeBaseRouter: ExpressRouter = Router()

knowledgeBaseRouter.post('/', createKnowledge)
knowledgeBaseRouter.get('/collections', queryKnowledgeCollections)
knowledgeBaseRouter.put('/:collectionName', updateKnowledge)
knowledgeBaseRouter.delete('/:collectionName', deleteKnowledge)
knowledgeBaseRouter.post('/:collectionName/documents', addDocumentsToKnowledgeBase)

export default knowledgeBaseRouter
