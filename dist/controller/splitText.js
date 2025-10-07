import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { createLogger } from '../utils/logger.js';
const logger = createLogger('SplitText');
async function splitTextByLangchain({ text, chunkSize = 100, chunkOverlap = 0 }) {
    try {
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize,
            chunkOverlap,
        });
        return await splitter.splitDocuments([
            new Document({ pageContent: text }),
        ]);
    }
    catch (error) {
        logger.error('Split Failed. ', error);
        return [];
    }
}
export async function splitText(req, res, next) {
    try {
        const { text, chunkSize, chunkOverlap } = req.body;
        if (typeof text !== 'string' || text.trim().length === 0) {
            res.status(400).send({ msg: '文本内容不能为空' });
            return;
        }
        if (chunkSize !== undefined && (typeof chunkSize !== 'number' || !Number.isInteger(chunkSize) || chunkSize <= 0)) {
            res.status(400).send({ msg: 'chunkSize 必须是正整数' });
            return;
        }
        if (chunkOverlap !== undefined && (typeof chunkOverlap !== 'number' || !Number.isInteger(chunkOverlap) || chunkOverlap < 0)) {
            res.status(400).send({ msg: 'chunkOverlap 必须是大于或等于0的整数' });
            return;
        }
        if (chunkSize !== undefined && chunkOverlap !== undefined && chunkOverlap >= chunkSize) {
            res.status(400).send({ msg: 'chunkOverlap 必须小于 chunkSize' });
            return;
        }
        const documents = await splitTextByLangchain({ text, chunkSize, chunkOverlap });
        res.status(200).json(documents);
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=splitText.js.map