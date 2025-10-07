import fetch from 'node-fetch';
import config from '../config/index.js';
import { createLogger } from '../utils/logger.js';
const LANGSEARCH_API_URL = 'https://api.langsearch.com/v1/rerank';
const logger = createLogger('LangSearchService');
export async function rerankByLangSearch(props) {
    const { query, documents, topN, returnDocuments = true } = props;
    if (!config.langsearch.apiKey)
        throw new Error('LANGSEARCH_API_KEY 未配置');
    const payload = {
        model: config.langsearch.model,
        query,
        top_n: topN ?? documents.length,
        return_documents: returnDocuments,
        documents,
    };
    try {
        const response = await fetch(LANGSEARCH_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.langsearch.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const errorText = await response.text();
            logger.error('LangSearch rerank 请求失败', response.status, errorText);
            return false;
        }
        const body = await response.json();
        if (body.code !== 200) {
            logger.error('LangSearch rerank 返回异常', body);
            return false;
        }
        return body.results;
    }
    catch (error) {
        logger.error('LangSearch rerank 调用出错', error);
        return false;
    }
}
//# sourceMappingURL=langSearch.js.map