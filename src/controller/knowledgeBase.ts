import type { NextFunction, Request, Response } from 'express'
import { Document } from '@langchain/core/documents'
import knowledgeBaseService from '../services/knowledgeBase.js'

export async function createKnowledge(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, description } = req.body

    if (typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).send({ msg: '知识库名称不能为空' })
    }

    const createSuccess = await knowledgeBaseService.createKnowledgeBase({
      name,
      description,
    })
    res.status(200).json({
      success: createSuccess,
    })
  }
  catch (error) {
    next(error)
  }
}

export async function queryKnowledgeCollections(req: Request, res: Response, next: NextFunction) {
  try {
    const collections = await knowledgeBaseService.queryKnowledgeCollections()

    res.status(200).send(collections)
  }
  catch (error) {
    next(error)
  }
}

export async function updateKnowledge(req: Request, res: Response, next: NextFunction) {
  try {
    const { collectionName } = req.params
    if (!collectionName) {
      res.status(400).send({ msg: '知识库名称不能为空' })
      return
    }
    const { newName, newDescription } = req.body
    const updateSuccess = await knowledgeBaseService.updateKnowledgeBase({
      name: collectionName,
      newName,
      newDescription,
    })
    res.status(200).json({
      success: updateSuccess,
    })
  }
  catch (error) {
    next(error)
  }
}

export async function deleteKnowledge(req: Request, res: Response, next: NextFunction) {
  try {
    const { collectionName } = req.params
    if (!collectionName) {
      res.status(400).send({ msg: '知识库名称不能为空' })
      return
    }
    const deleteSuccess = await knowledgeBaseService.deleteKnowledgeBase(collectionName)
    res.status(200).json({
      success: deleteSuccess,
    })
  }
  catch (error) {
    next(error)
  }
}

export async function addDocumentsToKnowledgeBase(req: Request, res: Response, next: NextFunction) {
  try {
    const { collectionName } = req.params
    if (!collectionName) {
      res.status(400).send({ msg: '知识库名称不能为空' })
      return
    }

    const { documents } = req.body
    if (!Array.isArray(documents) || documents.length === 0) {
      res.status(400).send({ msg: '文档内容不能为空' })
      return
    }

    const docs = documents.map(doc => new Document(doc))

    const addSuccess = await knowledgeBaseService.addDocumentsToKnowledgeBase(collectionName, docs)
    res.status(200).json({
      success: addSuccess,
    })
  }
  catch (error) {
    next(error)
  }
}

export async function searchDocuments(req: Request, res: Response, next: NextFunction) {
  try {
    const { collectionName } = req.params
    if (!collectionName) {
      res.status(400).send({ msg: '知识库名称不能为空' })
      return
    }

    const { query, k = 5, filter } = req.body
    if (!query || typeof query !== 'string') {
      res.status(400).send({ msg: '查询内容不能为空' })
      return
    }

    const documents = await knowledgeBaseService.searchSimilarDocuments(collectionName, query, k, filter)
    res.status(200).json({
      success: true,
      documents,
    })
  }
  catch (error) {
    next(error)
  }
}

export async function deleteDocuments(req: Request, res: Response, next: NextFunction) {
  try {
    const { collectionName } = req.params
    if (!collectionName) {
      res.status(400).send({ msg: '知识库名称不能为空' })
      return
    }

    const { ids } = req.body
    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).send({ msg: '文档ID列表不能为空' })
      return
    }

    const deleteSuccess = await knowledgeBaseService.deleteDocuments(collectionName, ids)
    res.status(200).json({
      success: deleteSuccess,
    })
  }
  catch (error) {
    next(error)
  }
}
