import type { Document } from '@langchain/core/documents'
import type { CreateKnowledgeCollectionParams, UpdateKnowledgeCollectionParams } from '../types/index.js'
import { TaskType } from '@google/generative-ai'
import { Chroma } from '@langchain/community/vectorstores/chroma'
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai'
import { CloudClient } from 'chromadb'
import { v4 as uuidv4 } from 'uuid'

import config from '../config/index.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('KnowledgeBaseService')

/**
 * 知识库服务类
 * 提供知识库的创建、管理、文档添加和检索功能
 * 基于 LangChain 和 ChromaDB 实现向量存储和相似性搜索
 */
class KnowledgeBaseService {
  // Google 嵌入模型实例，用于将文本转换为向量
  private readonly embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: config.google.apiKey,
    model: config.google.embeddingModel,
    taskType: TaskType.RETRIEVAL_DOCUMENT, // 设置为文档检索任务类型
  })

  // ChromaDB 云客户端，用于直接操作集合
  private readonly chromaClient = new CloudClient({
    apiKey: config.chroma.apiKey,
    tenant: config.chroma.tenant,
    database: config.chroma.database,
  })

  // 向量存储缓存，避免重复创建相同的向量存储实例
  private vectorStoreCache = new Map<string, Chroma>()

  /**
   * 构建集合名称
   * 为每个知识库生成唯一的集合名称，避免命名冲突
   * @param name 用户提供的知识库名称
   * @returns 包含 UUID 的唯一集合名称
   */
  private buildCollectionName = (name: string): string => {
    const id = uuidv4()
    return `${name}_${id}`
  }

  /**
   * 获取向量存储实例
   * 使用缓存机制提高性能，避免重复创建相同集合的向量存储
   * @param collectionName 集合名称
   * @returns LangChain Chroma 向量存储实例
   */
  private async getVectorStore(collectionName: string): Promise<Chroma> {
    // 检查缓存中是否已存在该集合的向量存储
    if (this.vectorStoreCache.has(collectionName)) {
      return this.vectorStoreCache.get(collectionName)!
    }

    // 创建新的 LangChain Chroma 向量存储实例
    const vectorStore = new Chroma(this.embeddings, {
      collectionName,
      chromaCloudAPIKey: config.chroma.apiKey,
    })

    // 将实例存入缓存
    this.vectorStoreCache.set(collectionName, vectorStore)
    return vectorStore
  }

  /**
   * 创建知识库
   * 在 ChromaDB 中创建新的集合，用于存储和检索文档向量
   * @param params 创建参数，包含名称和描述
   * @returns 创建是否成功
   */
  async createKnowledgeBase(params: CreateKnowledgeCollectionParams): Promise<boolean> {
    const { name, description } = params
    const collectionName = this.buildCollectionName(name)
    const now = new Date()

    try {
      // 使用 ChromaDB 客户端创建集合，提供更好的控制
      await this.chromaClient.createCollection({
        name: collectionName,
        metadata: {
          name, // 用户提供的知识库名称
          created: now.toISOString(), // 创建时间
          description: description ?? '', // 知识库描述
        },
        embeddingFunction: {
          // 定义嵌入函数，将文本转换为向量
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

  /**
   * 查询所有知识库集合
   * 获取当前数据库中所有可用的知识库集合列表
   * @returns 集合列表数组
   */
  async queryKnowledgeCollections(): Promise<any[]> {
    try {
      return await this.chromaClient.listCollections()
    }
    catch (error) {
      logger.error('知识库集合获取失败', error)
      return []
    }
  }

  /**
   * 更新知识库信息
   * 修改已存在的知识库的名称或描述信息
   * @param params 更新参数，包含原名称和新的名称/描述
   * @returns 更新是否成功
   */
  async updateKnowledgeBase(params: UpdateKnowledgeCollectionParams): Promise<boolean> {
    const { name, newName, newDescription } = params

    // 如果没有提供新的名称或描述，则无需更新
    if (!newName && !newDescription) {
      logger.log('没有提供新的名称或描述，无需更新。')
      return true
    }

    try {
      // 获取现有集合
      const collection = await this.chromaClient.getCollection({ name })
      const oldMetadata = collection.metadata ?? {}
      const newMetadata: Record<string, any> = { ...oldMetadata }

      // 更新名称（如果提供）
      if (newName)
        newMetadata['name'] = newName

      // 更新描述（如果提供）
      if (newDescription)
        newMetadata['description'] = newDescription

      // 应用元数据更新
      await collection.modify({ metadata: newMetadata })

      // 清除该集合的缓存，确保下次获取最新信息
      this.vectorStoreCache.delete(name)

      logger.log(`${name} 知识库集合修改成功.`)
      return true
    }
    catch (error) {
      logger.error(`${name} 知识库集合修改失败`, error)
      return false
    }
  }

  /**
   * 删除知识库
   * 从 ChromaDB 中永久删除指定的知识库集合及其所有文档
   * @param collectionName 要删除的集合名称
   * @returns 删除是否成功
   */
  async deleteKnowledgeBase(collectionName: string): Promise<boolean> {
    try {
      // 从 ChromaDB 中删除集合
      await this.chromaClient.deleteCollection({ name: collectionName })

      // 清除该集合的缓存
      this.vectorStoreCache.delete(collectionName)

      logger.log(`${collectionName} 知识库集合删除成功.`)
      return true
    }
    catch (error) {
      logger.error(`${collectionName} 知识库集合删除失败`, error)
      return false
    }
  }

  /**
   * 向知识库添加文档
   * 将文档转换为向量并存储到指定的知识库集合中
   * @param collectionName 目标集合名称
   * @param documents 要添加的文档数组
   * @returns 添加是否成功
   */
  async addDocumentsToKnowledgeBase(collectionName: string, documents: Document[]): Promise<boolean> {
    try {
      // 获取对应的向量存储实例
      const vectorStore = await this.getVectorStore(collectionName)

      // 预处理文档，确保每个文档都有适当的元数据
      const processedDocuments = documents.map(doc => ({
        ...doc,
        metadata: Object.keys(doc.metadata).length === 0
          ? {
              ...doc.metadata,
              createdAt: new Date().toISOString(), // 添加创建时间
            }
          : doc.metadata,
      }))

      // 为每个文档生成唯一标识符
      const ids = documents.map(() => uuidv4())

      // 使用 LangChain 的 addDocuments 方法添加文档
      // 这会自动处理文档的向量化和存储
      await vectorStore.addDocuments(processedDocuments, { ids })

      logger.log(`成功将文档添加到 ${collectionName} 知识库集合。`)
      return true
    }
    catch (error) {
      logger.error(`无法将文档添加到 ${collectionName} 知识库集合。`, error)
      return false
    }
  }

  // ========== 新增方法：利用 LangChain 向量存储的高级功能 ==========

  /**
   * 搜索相似文档
   * 根据查询文本在知识库中找到最相似的文档
   * @param collectionName 集合名称
   * @param query 查询文本
   * @param k 返回文档数量，默认 5 个
   * @param filter 可选的过滤条件
   * @returns 相似文档数组
   */
  async searchSimilarDocuments(collectionName: string, query: string, k: number = 5, filter?: Record<string, any>): Promise<Document[]> {
    try {
      const vectorStore = await this.getVectorStore(collectionName)
      // 使用向量相似性搜索找到最相关的文档
      return await vectorStore.similaritySearch(query, k, filter)
    }
    catch (error) {
      logger.error('相似文档搜索失败', error)
      return []
    }
  }

  /**
   * 搜索相似文档（带相似度分数）
   * 不仅返回相似文档，还包含每个文档的相似度分数
   * @param collectionName 集合名称
   * @param query 查询文本
   * @param k 返回文档数量，默认 5 个
   * @param filter 可选的过滤条件
   * @returns 包含文档和相似度分数的数组
   */
  async searchSimilarDocumentsWithScore(collectionName: string, query: string, k: number = 5, filter?: Record<string, any>): Promise<[Document, number][]> {
    try {
      const vectorStore = await this.getVectorStore(collectionName)
      // 返回文档及其相似度分数，便于判断相关性强度
      return await vectorStore.similaritySearchWithScore(query, k, filter)
    }
    catch (error) {
      logger.error('带分数的相似文档搜索失败', error)
      return []
    }
  }

  /**
   * 删除指定文档
   * 根据文档 ID 从知识库中删除特定文档
   * @param collectionName 集合名称
   * @param ids 要删除的文档 ID 数组
   * @returns 删除是否成功
   */
  async deleteDocuments(collectionName: string, ids: string[]): Promise<boolean> {
    try {
      const vectorStore = await this.getVectorStore(collectionName)
      // 根据 ID 删除指定文档
      await vectorStore.delete({ ids })

      logger.log(`成功从 ${collectionName} 删除 ${ids.length} 个文档。`)
      return true
    }
    catch (error) {
      logger.error(`从 ${collectionName} 删除文档失败`, error)
      return false
    }
  }

  /**
   * 获取检索器
   * 创建一个 LangChain 检索器，可用于 RAG（检索增强生成）应用
   * @param collectionName 集合名称
   * @param k 检索文档数量，默认 5 个
   * @param filter 可选的过滤条件
   * @returns LangChain 检索器实例
   */
  async getRetriever(collectionName: string, k: number = 5, filter?: any) {
    const vectorStore = await this.getVectorStore(collectionName)
    const options: any = { k }
    if (filter) {
      options.filter = filter
    }
    // 返回检索器，可以直接用于 LangChain 的链式操作
    return vectorStore.asRetriever(options)
  }
}

export default new KnowledgeBaseService()
