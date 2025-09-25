import type { Router as ExpressRouter } from 'express'
import { Router } from 'express'

import knowledgeBaseRouter from './knowledgeBase.js'
import splitTextRouter from './splitText.js'

const router: ExpressRouter = Router()

// API 路由
router.use('/knowledge-base', knowledgeBaseRouter)
router.use('/split-text', splitTextRouter)

// 根路径
router.get('/', (_req, res) => {
  res.send('Welcome to RAG Server')
})

export default router
