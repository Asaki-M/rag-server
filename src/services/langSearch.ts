import fetch from 'node-fetch'

import config from '../config/index.js'
import { createLogger } from '../utils/logger.js'

const LANGSEARCH_API_URL = 'https://api.langsearch.com/v1/rerank'
const logger = createLogger('LangSearchService')

interface RerankByLangSearchProps {
  query: string
  documents: Array<string>
  topN?: number
  returnDocuments?: boolean
}

interface LangSearchDocument {
  text: string
}

interface LangSearchRerankResult {
  index: number
  relevance_score: number
  document?: LangSearchDocument
}

interface LangSearchRerankResponse {
  code: number
  log_id: string
  msg: string | null
  model: string
  results: LangSearchRerankResult[]
}

export async function rerankByLangSearch(props: RerankByLangSearchProps): Promise<LangSearchRerankResult[] | boolean> {
  const { query, documents, topN, returnDocuments = true } = props

  if (!config.langsearch.apiKey)
    throw new Error('LANGSEARCH_API_KEY 未配置')

  const payload = {
    model: config.langsearch.model,
    query,
    top_n: topN ?? documents.length,
    return_documents: returnDocuments,
    documents,
  }

  try {
    const response = await fetch(LANGSEARCH_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.langsearch.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      logger.error('LangSearch rerank 请求失败', response.status, errorText)
      return false
    }

    const body = await response.json() as LangSearchRerankResponse

    if (body.code !== 200) {
      logger.error('LangSearch rerank 返回异常', body)
      return false
    }

    return body.results
  }
  catch (error) {
    logger.error('LangSearch rerank 调用出错', error)
    return false
  }
}
