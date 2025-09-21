import type { NextFunction, Request, Response } from 'express'

import { knowledgeBaseService } from '../services/knowledgeBase.js'
import { createLogger } from '../utils/logger.js'
import { SplitTextByLangchain } from './splitText.js'

const logger = createLogger('KnowledgeBaseController')

function parseOptionalNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined
  }

  const numericValue = typeof value === 'number' ? value : Number(value)

  if (Number.isNaN(numericValue) || numericValue < 0) {
    return undefined
  }

  return numericValue
}

export async function createKnowledgeBaseHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, description, text } = req.body as Record<string, unknown>

    if (typeof name !== 'string' || name.trim().length === 0) {
      throw new Error('知识库名称不能为空')
    }

    if (typeof text !== 'string' || text.trim().length === 0) {
      throw new Error('待处理文本不能为空')
    }

    const chunkSize = parseOptionalNumber(req.body?.chunkSize)
    const chunkOverlap = parseOptionalNumber(req.body?.chunkOverlap)

    if (chunkSize !== undefined && chunkSize <= 0) {
      throw new Error('chunkSize 必须大于 0')
    }

    if (chunkOverlap !== undefined && chunkOverlap < 0) {
      throw new Error('chunkOverlap 不能小于 0')
    }

    if (chunkSize !== undefined && chunkOverlap !== undefined && chunkOverlap >= chunkSize) {
      throw new Error('chunkOverlap 必须小于 chunkSize')
    }

    const splitParams = {
      text,
      ...(chunkSize !== undefined ? { chunkSize } : {}),
      ...(chunkOverlap !== undefined ? { chunkOverlap } : {}),
    }

    const documents = await SplitTextByLangchain(splitParams)

    if (!documents.length) {
      throw new Error('文本分割失败，未生成任何分块')
    }

    const trimmedDescription = typeof description === 'string' ? description.trim() : undefined

    const knowledgeBase = await knowledgeBaseService.createKnowledgeBase({
      name: name.trim(),
      ...(trimmedDescription ? { description: trimmedDescription } : {}),
      documents,
    })

    logger.info(`知识库 ${knowledgeBase.id} 创建成功，分块数量: ${knowledgeBase.chunkCount}`)

    res.status(201).json({
      success: true,
      data: {
        knowledgeBase,
        chunks: documents.map(document => ({
          id: document.id,
          content: document.pageContent,
          metadata: document.metadata,
        })),
      },
    })
  }
  catch (error) {
    next(error)
  }
}

export async function ingestKnowledgeBaseDocumentsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { knowledgeBaseId } = req.params
    const { text } = req.body as Record<string, unknown>

    if (typeof knowledgeBaseId !== 'string' || knowledgeBaseId.trim().length === 0) {
      throw new Error('知识库 ID 无效')
    }

    if (typeof text !== 'string' || text.trim().length === 0) {
      throw new Error('待处理文本不能为空')
    }

    const chunkSize = parseOptionalNumber(req.body?.chunkSize)
    const chunkOverlap = parseOptionalNumber(req.body?.chunkOverlap)

    if (chunkSize !== undefined && chunkSize <= 0) {
      throw new Error('chunkSize 必须大于 0')
    }

    if (chunkOverlap !== undefined && chunkOverlap < 0) {
      throw new Error('chunkOverlap 不能小于 0')
    }

    if (chunkSize !== undefined && chunkOverlap !== undefined && chunkOverlap >= chunkSize) {
      throw new Error('chunkOverlap 必须小于 chunkSize')
    }

    const splitParams = {
      text,
      ...(chunkSize !== undefined ? { chunkSize } : {}),
      ...(chunkOverlap !== undefined ? { chunkOverlap } : {}),
    }

    const documents = await SplitTextByLangchain(splitParams)

    if (!documents.length) {
      throw new Error('文本分割失败，未生成任何分块')
    }

    const knowledgeBase = await knowledgeBaseService.ingestDocuments({
      knowledgeBaseId: knowledgeBaseId.trim(),
      documents,
    })

    logger.info(`知识库 ${knowledgeBase.id} 新增 ${documents.length} 个分块，总计 ${knowledgeBase.chunkCount}`)

    res.status(200).json({
      success: true,
      data: {
        knowledgeBase,
        chunks: documents.map(document => ({
          id: document.id,
          content: document.pageContent,
          metadata: document.metadata,
        })),
      },
    })
  }
  catch (error) {
    next(error)
  }
}
