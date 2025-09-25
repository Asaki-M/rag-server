import type { Express } from 'express'
import process from 'node:process'
import cors from 'cors'
import express from 'express'

import config, { validateConfig } from './config/index.js'
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js'
import routes from './routes/index.js'

// 创建 Express 应用
export const app: Express = express()

// 验证配置
try {
  validateConfig()
}
catch (error: any) {
  console.error('❌ 配置验证失败:', (error as Error).message)
  process.exit(1)
}

// 基础中间件
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// CORS 中间件
app.use(cors())
// 处理预检请求（OPTIONS）
app.options('*', cors())

// 路由
app.use('/api', routes)

// 404 处理
app.use(notFoundHandler)

// 错误处理中间件
app.use(errorHandler)

// 仅在本地/非 Serverless 环境启动监听
const isVercel = process.env['VERCEL'] === '1'
if (!isVercel) {
  const server = app.listen(config.port, () => {
    console.log(`📡 服务地址: http://localhost:${config.port}`)
  })

  // 优雅关闭
  process.on('SIGTERM', () => {
    console.log('💤 接收到 SIGTERM 信号，正在优雅关闭服务器...')
    server.close(() => {
      console.log('✅ 服务器已关闭')
      process.exit(0)
    })
  })

  process.on('SIGINT', () => {
    console.log('💤 接收到 SIGINT 信号，正在优雅关闭服务器...')
    server.close(() => {
      console.log('✅ 服务器已关闭')
      process.exit(0)
    })
  })
}

export default app
