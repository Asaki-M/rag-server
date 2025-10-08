import type { NextFunction, Request, Response } from 'express'
import SplitTextService from '../services/splitText.js'

export async function splitText(req: Request, res: Response, next: NextFunction) {
  try {
    const { text, chunkSize, chunkOverlap, type } = req.body

    if (typeof text !== 'string' || text.trim().length === 0) {
      res.status(400).send({ msg: '文本内容不能为空' })
      return
    }

    if (chunkSize !== undefined && (typeof chunkSize !== 'number' || !Number.isInteger(chunkSize) || chunkSize <= 0)) {
      res.status(400).send({ msg: 'chunkSize 必须是正整数' })
      return
    }

    if (chunkOverlap !== undefined && (typeof chunkOverlap !== 'number' || !Number.isInteger(chunkOverlap) || chunkOverlap < 0)) {
      res.status(400).send({ msg: 'chunkOverlap 必须是大于或等于0的整数' })
      return
    }

    if (chunkSize !== undefined && chunkOverlap !== undefined && chunkOverlap >= chunkSize) {
      res.status(400).send({ msg: 'chunkOverlap 必须小于 chunkSize' })
      return
    }

    let documents = []
    if (type === 'llm') {
      documents = await SplitTextService.splitTextByLLM({ text, chunkSize, chunkOverlap })
    }
    else {
      documents = await SplitTextService.splitTextByLangchain({ text, chunkSize, chunkOverlap })
    }
    res.status(200).json(documents)
  }
  catch (error) {
    next(error)
  }
}
