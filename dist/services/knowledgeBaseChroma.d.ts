import type { Document } from '@langchain/core/documents';
import type { Collection } from 'chromadb';
import type { CreateKnowledgeCollectionParams, UpdateKnowledgeCollectionParams } from '../types/index.js';
/**
 * 知识库服务类
 * 提供知识库的创建、管理、文档添加和检索功能
 * 完全基于 ChromaDB CloudClient 实现
 */
declare class KnowledgeBaseService {
    private readonly embeddings;
    private readonly chromaClient;
    private collectionCache;
    /**
     * 构建集合名称
     * 为每个知识库生成唯一的集合名称，避免命名冲突
     * @param name 用户提供的知识库名称
     * @returns 包含 UUID 的唯一集合名称
     */
    private buildCollectionName;
    /**
     * 获取集合实例
     * 使用缓存机制提高性能，避免重复获取相同集合
     * @param collectionName 集合名称
     * @returns ChromaDB 集合实例
     */
    private getCollection;
    /**
     * 创建知识库
     * 在 ChromaDB 中创建新的集合，用于存储和检索文档向量
     * @param params 创建参数，包含名称和描述
     * @returns 创建是否成功
     */
    createKnowledgeBase(params: CreateKnowledgeCollectionParams): Promise<boolean>;
    /**
     * 查询所有知识库集合
     * 获取当前数据库中所有可用的知识库集合列表
     * @returns 集合列表数组
     */
    queryKnowledgeCollections(): Promise<Collection[]>;
    /**
     * 更新知识库信息
     * 修改已存在的知识库的名称或描述信息
     * @param params 更新参数，包含原名称和新的名称/描述
     * @returns 更新是否成功
     */
    updateKnowledgeBase(params: UpdateKnowledgeCollectionParams): Promise<boolean>;
    /**
     * 删除知识库
     * 从 ChromaDB 中永久删除指定的知识库集合及其所有文档
     * @param collectionName 要删除的集合名称
     * @returns 删除是否成功
     */
    deleteKnowledgeBase(collectionName: string): Promise<boolean>;
    /**
     * 向知识库添加文档
     * 将文档转换为向量并存储到指定的知识库集合中
     * @param collectionName 目标集合名称
     * @param documents 要添加的文档数组
     * @returns 添加是否成功
     */
    addDocumentsToKnowledgeBase(collectionName: string, documents: Document[]): Promise<boolean>;
    /**
     * 搜索相似文档
     * 根据查询文本在知识库中找到最相似的文档
     * @param collectionName 集合名称
     * @param query 查询文本
     * @param k 返回文档数量，默认 5 个
     * @param filter 可选的过滤条件
     * @returns 相似文档数组
     */
    searchSimilarDocuments(collectionName: string, query: string, k?: number, filter?: Record<string, any>): Promise<Document[]>;
    /**
     * 删除指定文档
     * 根据文档 ID 从知识库中删除特定文档
     * @param collectionName 集合名称
     * @param ids 要删除的文档 ID 数组
     * @returns 删除是否成功
     */
    deleteDocuments(collectionName: string, ids: string[]): Promise<boolean>;
    /**
     * 获取集合统计信息
     * 获取指定集合的文档数量等统计信息
     * @param collectionName 集合名称
     * @returns 集合统计信息
     */
    getCollectionStats(collectionName: string): Promise<{
        count: number;
    } | null>;
}
declare const _default: KnowledgeBaseService;
export default _default;
