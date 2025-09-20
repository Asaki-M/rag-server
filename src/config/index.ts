import process from 'node:process'
import dotenv from 'dotenv'

// 加载环境变量
dotenv.config()

interface Config {
  port: number
}

const config: Config = {
  port: Number.parseInt(process.env['PORT'] ?? '3008', 10),
}

// 验证必需的配置
export function validateConfig(): void {
}

export default config
