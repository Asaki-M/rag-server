import { Document } from '@langchain/core/documents'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('SplitText')

interface SplitTextProps {
  text: string
  chunkSize?: number
  chunkOverlap?: number
}

export async function SplitTextByLangchain({ text, chunkSize = 100, chunkOverlap = 0 }: SplitTextProps) {
  try {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap,
    })
    return await splitter.splitDocuments([
      new Document({ pageContent: text }),
    ])
  }
  catch (error) {
    logger.error('Split Failed. ', error)
    return []
  }
}
