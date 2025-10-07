import process from 'node:process';
import dotenv from 'dotenv';
// 加载环境变量
dotenv.config();
const config = {
    port: Number.parseInt(process.env['PORT'] ?? '3008', 10),
    google: {
        apiKey: process.env['GOOGLE_API_KEY'] ?? '',
        embeddingModel: process.env['GOOGLE_EMBEDINNG_MODEL'] ?? 'gemini-embedding-001',
    },
    chroma: {
        apiKey: process.env['CHROMA_API_KEY'] ?? '',
        tenant: process.env['CHROMA_TENANT'] ?? '',
        database: process.env['CHROMA_DATABASE'] ?? '',
    },
    langsearch: {
        apiKey: process.env['LANGSEARCH_API_KEY'] ?? '',
        model: 'langsearch-reranker-v1',
    },
};
// 验证必需的配置
export function validateConfig() {
    if (!config.google.apiKey) {
        throw new Error('GOOGLE_API_KEY 未配置');
    }
    if (!config.chroma.apiKey || !config.chroma.tenant || !config.chroma.database) {
        throw new Error('Chroma Cloud 未配置，请提供 CHROMA_API_KEY、CHROMA_TENANT、CHROMA_DATABASE');
    }
}
export default config;
//# sourceMappingURL=index.js.map