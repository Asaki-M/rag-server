import { TaskType } from '@google/generative-ai';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { CloudClient } from 'chromadb';
import { v4 as uuidv4 } from 'uuid';
import config from '../config/index.js';
import { createLogger } from '../utils/logger.js';
const logger = createLogger('KnowledgeBaseService');
/**
 * 知识库服务类
 * 提供知识库的创建、管理、文档添加和检索功能
 * 结合使用 Chroma vectorstore 和 ChromaDB CloudClient
 */
class KnowledgeBaseService {
    embeddings = new GoogleGenerativeAIEmbeddings({
        apiKey: config.google.apiKey,
        model: config.google.embeddingModel,
        taskType: TaskType.RETRIEVAL_DOCUMENT,
    });
    chromaClient = new CloudClient({
        apiKey: config.chroma.apiKey,
        tenant: config.chroma.tenant,
        database: config.chroma.database,
    });
    // Chroma vectorstore 实例缓存，避免重复创建相同的实例
    vectorstoreCache = new Map();
    /**
     * 构建集合名称
     * 为每个知识库生成唯一的集合名称，避免命名冲突
     * @param name 用户提供的知识库名称
     * @returns 包含 UUID 的唯一集合名称
     */
    buildCollectionName = (name) => {
        const id = uuidv4();
        return `${name}_${id}`;
    };
    /**
     * 获取 Chroma vectorstore 实例
     * 使用缓存机制提高性能，避免重复创建相同实例
     * @param collectionName 集合名称
     * @returns Chroma vectorstore 实例
     */
    getVectorstore(collectionName, options) {
        // 检查缓存中是否已存在该实例
        if (this.vectorstoreCache.has(collectionName)) {
            return this.vectorstoreCache.get(collectionName);
        }
        const chromaArgs = {
            chromaCloudAPIKey: config.chroma.apiKey,
            collectionName,
            clientParams: {
                host: 'api.trychroma.com',
                port: 8000,
                ssl: true,
                tenant: config.chroma.tenant,
                database: config.chroma.database,
            },
        };
        if (options?.metadata)
            chromaArgs.collectionMetadata = options.metadata;
        const vectorstore = new Chroma(this.embeddings, chromaArgs);
        // 将实例存入缓存
        this.vectorstoreCache.set(collectionName, vectorstore);
        return vectorstore;
    }
    /**
     * 创建知识库
     * 使用 LangChain Chroma vectorstore 创建新的集合，用于存储和检索文档向量
     * @param params 创建参数，包含名称和描述
     * @returns 创建是否成功
     */
    async createKnowledgeBase(params) {
        const { name, description } = params;
        const collectionName = this.buildCollectionName(name);
        const now = new Date();
        try {
            const metadata = {
                name,
                created: now.toISOString(),
                description: description ?? '',
            };
            const vectorstore = this.getVectorstore(collectionName, { metadata });
            await vectorstore.ensureCollection();
            logger.log(`${name} 知识库集合创建成功.`);
            return true;
        }
        catch (error) {
            this.vectorstoreCache.delete(collectionName);
            logger.error(`${name} 知识库集合创建失败`, error);
            return false;
        }
    }
    /**
     * 查询所有知识库集合
     * 获取当前数据库中所有可用的知识库集合列表
     * @returns 集合列表数组
     */
    async queryKnowledgeCollections() {
        try {
            return await this.chromaClient.listCollections();
        }
        catch (error) {
            logger.error('知识库集合获取失败', error);
            return [];
        }
    }
    /**
     * 更新知识库信息
     * 修改已存在的知识库的名称或描述信息
     * @param params 更新参数，包含原名称和新的名称/描述
     * @returns 更新是否成功
     */
    async updateKnowledgeBase(params) {
        const { name, newName, newDescription } = params;
        // 如果没有提供新的名称或描述，则无需更新
        if (!newName && !newDescription) {
            logger.log('没有提供新的名称或描述，无需更新。');
            return true;
        }
        try {
            // 获取现有集合
            const collection = await this.chromaClient.getCollection({ name });
            const oldMetadata = collection.metadata ?? {};
            const newMetadata = { ...oldMetadata };
            // 更新名称（如果提供）
            if (newName)
                newMetadata['name'] = newName;
            // 更新描述（如果提供）
            if (newDescription)
                newMetadata['description'] = newDescription;
            // 应用元数据更新
            await collection.modify({ metadata: newMetadata });
            // 清除该集合的缓存，确保下次获取最新信息
            this.vectorstoreCache.delete(name);
            logger.log(`${name} 知识库集合修改成功.`);
            return true;
        }
        catch (error) {
            logger.error(`${name} 知识库集合修改失败`, error);
            return false;
        }
    }
    /**
     * 删除知识库
     * 从 ChromaDB 中永久删除指定的知识库集合及其所有文档
     * @param collectionName 要删除的集合名称
     * @returns 删除是否成功
     */
    async deleteKnowledgeBase(collectionName) {
        try {
            // 从 ChromaDB 中删除集合
            await this.chromaClient.deleteCollection({ name: collectionName });
            // 清除该集合的缓存
            this.vectorstoreCache.delete(collectionName);
            logger.log(`${collectionName} 知识库集合删除成功.`);
            return true;
        }
        catch (error) {
            logger.error(`${collectionName} 知识库集合删除失败`, error);
            return false;
        }
    }
    /**
     * 向知识库添加文档
     * 将文档转换为向量并存储到指定的知识库集合中
     * @param collectionName 目标集合名称
     * @param documents 要添加的文档数组
     * @returns 添加是否成功
     */
    async addDocumentsToKnowledgeBase(collectionName, documents) {
        try {
            // 获取对应的 vectorstore 实例
            const vectorstore = this.getVectorstore(collectionName);
            // 使用 Chroma vectorstore 添加文档
            await vectorstore.addDocuments(documents);
            logger.log(`成功将文档添加到 ${collectionName} 知识库集合。`);
            return true;
        }
        catch (error) {
            logger.error(`无法将文档添加到 ${collectionName} 知识库集合。`, error);
            return false;
        }
    }
    /**
     * 搜索相似文档
     * 根据查询文本在知识库中找到最相似的文档
     * @param collectionName 集合名称
     * @param query 查询文本
     * @param k 返回文档数量，默认 5 个
     * @param filter 可选的过滤条件
     * @returns 相似文档数组
     */
    async searchSimilarDocuments(collectionName, query, k = 5, filter) {
        try {
            const vectorstore = this.getVectorstore(collectionName);
            // 使用 Chroma vectorstore 执行相似性搜索
            const results = await vectorstore.similaritySearch(query, k, filter);
            return results;
        }
        catch (error) {
            logger.error('相似文档搜索失败', error);
            return [];
        }
    }
    /**
     * 删除指定文档
     * 根据文档 ID 从知识库中删除特定文档
     * @param collectionName 集合名称
     * @param ids 要删除的文档 ID 数组
     * @returns 删除是否成功
     */
    async deleteDocuments(collectionName, ids) {
        try {
            const vectorstore = this.getVectorstore(collectionName);
            await vectorstore.delete({ ids });
            logger.log(`成功在${collectionName} 删除 ${ids.length} 个文档。`);
            return true;
        }
        catch (error) {
            logger.error(`在 ${collectionName} 删除文档失败`, error);
            return false;
        }
    }
}
export default new KnowledgeBaseService();
//# sourceMappingURL=knowledgeBase.js.map