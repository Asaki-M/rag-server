import type { Router as ExpressRouter } from 'express'
import { Router } from 'express'

const router: ExpressRouter = Router()

// API 路由

// 根路径
router.use('/', (_req, res) => {
  res.send('Welcome to RAG Server')
})

export default router
