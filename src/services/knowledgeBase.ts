import type { Document } from '@langchain/core/documents'
import type { Collection } from 'chromadb'
import type { CreateKnowledgeCollectionParams, UpdateKnowledgeCollectionParams } from '../types/index.js'
import { TaskType } from '@google/generative-ai'
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai'
import { CloudClient } from 'chromadb'

import { v4 as uuidv4 } from 'uuid'
import config from '../config/index.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('KnowledgeBaseService')
class KnowledgeBaseService {
  private readonly embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: config.google.apiKey,
    model: config.google.embeddingModel,
    taskType: TaskType.RETRIEVAL_DOCUMENT,
  })

  private readonly chromaClient = new CloudClient({
    apiKey: config.chroma.apiKey,
    tenant: config.chroma.tenant,
    database: config.chroma.database,
  })

  private buildCollectionName = (name: string): string => {
    const id = uuidv4()
    return `${name}_${id}`
  }

  async createKnowledgeBase(params: CreateKnowledgeCollectionParams): Promise<boolean> {
    const { name, description } = params

    const now = new Date()

    try {
      await this.chromaClient.createCollection({
        name: this.buildCollectionName(name),
        metadata: {
          name,
          created: now.toString(),
          description: description ?? '',
        },
        embeddingFunction: {
          generate: async (texts: string[]) => {
            return this.embeddings.embedDocuments(texts)
          },
        },
      })
      logger.log(`${name} 知识库集合创建成功.`)
      return true
    }
    catch (error) {
      logger.error(`${name} 知识库集合创建失败`, error)
      return false
    }
  }

  async queryKnowledgeCollections(): Promise<Collection[]> {
    try {
      return await this.chromaClient.listCollections()
    }
    catch (error) {
      logger.error('知识库集合获取失败', error)
      return []
    }
  }

  async updateKnowledgeBase(params: UpdateKnowledgeCollectionParams): Promise<boolean> {
    const { name, newName, newDescription } = params

    if (!newName && !newDescription) {
      logger.log('没有提供新的名称或描述，无需更新。')
      return true
    }

    try {
      const collection = await this.chromaClient.getCollection({ name })
      const oldMetadata = collection.metadata ?? {}
      const newMetadata: Record<string, any> = { ...oldMetadata }

      if (newName)
        newMetadata['name'] = newName

      if (newDescription)
        newMetadata['description'] = newDescription

      await collection.modify({ metadata: newMetadata })

      logger.log(`${name} 知识库集合修改成功.`)
      return true
    }
    catch (error) {
      logger.error(`${name} 知识库集合修改失败`, error)
      return false
    }
  }

  async deleteKnowledgeBase(collectionName: string): Promise<boolean> {
    try {
      await this.chromaClient.deleteCollection({ name: collectionName })
      logger.log(`${collectionName} 知识库集合删除成功.`)
      return true
    }
    catch (error) {
      logger.error(`${collectionName} 知识库集合删除失败`, error)
      return false
    }
  }

  async addDocumentsToKnowledgeBase(collectionName: string, documents: Document[]): Promise<boolean> {
    try {
      const collection = await this.chromaClient.getCollection({
        name: collectionName,
        embeddingFunction: {
          generate: async (texts: string[]) => {
            return this.embeddings.embedDocuments(texts)
          },
        },
      })
      await collection.add({
        ids: documents.map(() => uuidv4()),
        metadatas: documents.map((doc) => {
          if (Object.keys(doc.metadata).length === 0) {
            return {
              ...doc.metadata,
              createdAt: new Date().toISOString(),
            }
          }
          return doc.metadata
        }),
        documents: documents.map(doc => doc.pageContent),
      })
      logger.log(`成功将文档添加到 ${collectionName} 知识库集合。`)
      return true
    }
    catch (error) {
      logger.error(`无法将文档添加到 ${collectionName} 知识库集合。`, error)
      return false
    }
  }
}

export default new KnowledgeBaseService()
