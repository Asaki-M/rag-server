import type { Router as ExpressRouter } from 'express'
import { Router } from 'express'

import knowledgeBaseRouter from './knowledgeBase.js'

const router: ExpressRouter = Router()

// API 路由
router.use('/knowledge-bases', knowledgeBaseRouter)

// 根路径
router.get('/', (_req, res) => {
  res.send('Welcome to RAG Server')
})

export default router
