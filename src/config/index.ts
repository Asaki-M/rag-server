import process from 'node:process'
import dotenv from 'dotenv'

// 加载环境变量
dotenv.config()

interface Config {
  port: number
  openai: {
    apiKey: string
    embeddingModel: string
  }
}

const config: Config = {
  port: Number.parseInt(process.env['PORT'] ?? '3008', 10),
  openai: {
    apiKey: process.env['OPENAI_API_KEY'] ?? '',
    embeddingModel: process.env['OPENAI_EMBEDDING_MODEL'] ?? 'text-embedding-3-small',
  },
}

// 验证必需的配置
export function validateConfig(): void {
  if (!config.openai.apiKey) {
    throw new Error('OPENAI_API_KEY 未配置')
  }
}

export default config
