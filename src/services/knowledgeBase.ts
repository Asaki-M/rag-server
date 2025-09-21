import type { Document } from '@langchain/core/documents'
import { OpenAIEmbeddings } from '@langchain/openai'
import { MemoryVectorStore } from 'langchain/vectorstores/memory'
import { v4 as uuidv4 } from 'uuid'

import config from '../config/index.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('KnowledgeBaseService')

export interface KnowledgeBaseRecord {
  id: string
  name: string
  description?: string
  vectorStore: MemoryVectorStore
  createdAt: Date
  updatedAt: Date
  chunkCount: number
}

export interface CreateKnowledgeBaseParams {
  name: string
  description?: string
  documents?: Document[]
}

export interface IngestDocumentsParams {
  knowledgeBaseId: string
  documents: Document[]
}

export interface KnowledgeBaseSummary {
  id: string
  name: string
  description?: string
  chunkCount: number
  createdAt: string
  updatedAt: string
}

class KnowledgeBaseService {
  private readonly knowledgeBases = new Map<string, KnowledgeBaseRecord>()

  private readonly embeddings = new OpenAIEmbeddings({
    apiKey: config.openai.apiKey,
    model: config.openai.embeddingModel,
  })

  async createKnowledgeBase(params: CreateKnowledgeBaseParams): Promise<KnowledgeBaseSummary> {
    const { name, description, documents = [] } = params

    if (!name) {
      throw new Error('知识库名称不能为空')
    }

    const id = uuidv4()
    const now = new Date()

    const vectorStore = new MemoryVectorStore(this.embeddings)

    const record: KnowledgeBaseRecord = {
      id,
      name,
      vectorStore,
      createdAt: now,
      updatedAt: now,
      chunkCount: 0,
      ...(description ? { description } : {}),
    }

    this.knowledgeBases.set(id, record)

    if (documents.length > 0) {
      const preparedDocuments = this.prepareDocuments(documents, 0)
      await vectorStore.addDocuments(preparedDocuments)

      record.chunkCount = preparedDocuments.length
      record.updatedAt = new Date()

      logger.info(`知识库 ${id} 已写入 ${record.chunkCount} 个文本分块`)
    }

    logger.info(`知识库 ${id} 创建成功`)

    return this.toSummary(record)
  }

  async ingestDocuments(params: IngestDocumentsParams): Promise<KnowledgeBaseSummary> {
    const { knowledgeBaseId, documents } = params

    if (!documents.length) {
      throw new Error('没有可写入的文档')
    }

    const record = this.knowledgeBases.get(knowledgeBaseId)

    if (!record) {
      throw new Error(`知识库 ${knowledgeBaseId} 不存在`)
    }

    const preparedDocuments = this.prepareDocuments(documents, record.chunkCount)
    await record.vectorStore.addDocuments(preparedDocuments)

    record.chunkCount += preparedDocuments.length
    record.updatedAt = new Date()

    logger.info(`知识库 ${knowledgeBaseId} 新增 ${preparedDocuments.length} 个文本分块，总计 ${record.chunkCount}`)

    return this.toSummary(record)
  }

  getKnowledgeBase(id: string): KnowledgeBaseRecord | undefined {
    return this.knowledgeBases.get(id)
  }

  private prepareDocuments(documents: Document[], startIndex: number): Document[] {
    return documents.map((document, index) => {
      document.id = document.id ?? uuidv4()
      const metadata = { ...document.metadata }
      const currentChunkIndex = metadata['chunkIndex'] as number | undefined
      metadata['chunkIndex'] = currentChunkIndex ?? startIndex + index
      document.metadata = metadata

      return document
    })
  }

  private toSummary(record: KnowledgeBaseRecord): KnowledgeBaseSummary {
    return {
      id: record.id,
      name: record.name,
      chunkCount: record.chunkCount,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      ...(record.description ? { description: record.description } : {}),
    }
  }
}

export const knowledgeBaseService = new KnowledgeBaseService()
