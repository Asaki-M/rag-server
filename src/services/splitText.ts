import { Document } from '@langchain/core/documents'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import fetch from 'node-fetch'
import config from '../config/index.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('SplitText')

interface SplitTextProps {
  text: string
  chunkSize?: number
  chunkOverlap?: number
}

interface OpenRouterChatCompletion {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
}

class SplitText {
  public async splitTextByLangchain({ text, chunkSize = 100, chunkOverlap = 0 }: SplitTextProps) {
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

  private buildSystemPrompt({ chunkSize, chunkOverlap }: { chunkSize: number, chunkOverlap: number }) {
    const maxLength = Number.isFinite(chunkSize) && chunkSize > 0 ? chunkSize : 100
    const overlap = Number.isFinite(chunkOverlap) && chunkOverlap >= 0 ? chunkOverlap : 0

    const overlapInstruction = overlap > 0
      ? `Ensure each chunk shares approximately ${overlap} trailing characters with the previous chunk to preserve context.`
      : 'Do not introduce overlap between consecutive chunks.'

    return {
      role: 'system',
      content: [
        'You are a text segmentation assistant preparing documents for retrieval augmented generation.',
        `Split the user-provided text into coherent chunks no longer than ${maxLength} characters each.`,
        overlapInstruction,
        'Keep sentences intact when possible, but never exceed the maximum length. Trim excessive whitespace and normalise line breaks inside each chunk.',
        'Respond with plain text labelled rows using the format `Chunk <number>: <content>` for every chunk in order. Do not include any additional commentary or metadata.',
      ].join('\n\n'),
    }
  }

  public async splitTextByLLM({ text, chunkSize = 100, chunkOverlap = 0 }: SplitTextProps) {
    const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions'
    if (!config.openrouter.apiKey) {
      logger.error('没有配置 OpenRouter apikey')
      throw new Error('请配置 OpenRouter 的 apikey')
    }

    try {
      const systemMessage = this.buildSystemPrompt({ chunkSize, chunkOverlap })
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.openrouter.apiKey}`,
      }

      const response = await fetch(OPENROUTER_BASE_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: config.openrouter.model,
          temperature: 0,
          messages: [
            systemMessage,
            { role: 'user', content: text },
          ],
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        logger.error('OpenRouter split request failed', response.status, errorText)
        return []
      }

      const payload = await response.json() as OpenRouterChatCompletion

      return this.extractDocumentsFromOpenRouter(payload)
    }
    catch (error) {
      logger.error('SplitText by llm failed.', error)
      return []
    }
  }

  private extractDocumentsFromOpenRouter(payload: OpenRouterChatCompletion) {
    const content = payload.choices?.[0]?.message?.content

    if (!content) {
      logger.error('OpenRouter split response missing content', payload)
      return []
    }

    return this.parseChunksFromText(content)
  }

  private parseChunksFromText(raw: string) {
    const lines = raw
      .split(/\n+/)
      .map(line => line.trim())
      .filter(line => line.length > 0)

    const chunkLines = lines.filter(line => /^Chunk\s+\d+:/i.test(line))

    if (!chunkLines.length)
      return []

    return chunkLines.map((line, index) => {
      const [, content = ''] = line.split(/:\s*/, 2)
      return new Document({
        pageContent: content,
        metadata: { index, source: 'openrouter-llm' },
      })
    })
  }
}

export default new SplitText()
