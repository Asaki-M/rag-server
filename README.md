# RAG Server

[中文文档](#中文文档)

A TypeScript-powered Express service for Retrieval-Augmented Generation (RAG) workflows. It manages knowledge bases stored in Chroma Cloud, generates embeddings with Google Generative AI, and re-ranks search results using the LangSearch API. The project also ships with utilities for chunking raw text into documents that can be ingested into the knowledge base.

## Features
- Create, update, list, and delete Chroma-backed knowledge bases via REST APIs.
- Ingest documents, remove them, and run semantic similarity search across a collection.
- Re-rank vector search results with LangSearch (`langsearch-reranker-v1`) for higher-quality responses.
- Split large blobs of text into LangChain `Document` chunks using the recursive character splitter.
- Ready for local execution or deployment on platforms such as Vercel (server auto-start disabled when `VERCEL=1`).

## Tech Stack
- **Runtime:** Node.js + Express
- **Language:** TypeScript (compiled to `dist/` before running)
- **Vector Store:** LangChain `Chroma` client against Chroma Cloud
- **Embeddings:** Google Generative AI embeddings (`TaskType.RETRIEVAL_DOCUMENT`)
- **Reranking:** LangSearch HTTP API (`/v1/rerank`)

## Prerequisites
- Node.js 18+ (Corepack-enabled Node installations ship with pnpm support)
- pnpm 10 (automatically selected via the `packageManager` field)
- Chroma Cloud account credentials
- Google Generative AI API key and enabled embeddings model
- LangSearch API key

## Getting Started
1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Create a `.env` file in the project root and provide the required configuration (see below).
3. Build the TypeScript sources:
   ```bash
   pnpm build
   ```
4. Start the compiled server:
   ```bash
   pnpm start
   ```
   The service listens on `http://localhost:3008` by default.

For a one-off compile-and-run step you can use `pnpm dev` (runs `tsc` and starts the generated bundle once). Use `pnpm lint` to apply the configured ESLint rules.

## Environment Variables
The configuration loader is defined in `src/config/index.ts`. These variables are read at start-up:

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `PORT` | No | `3008` | HTTP port for local execution. |
| `GOOGLE_API_KEY` | Yes | — | Google Generative AI API key used for embeddings. |
| `GOOGLE_EMBEDINNG_MODEL` | No | `gemini-embedding-001` | Embedding model ID (note the intentional spelling in the variable name). |
| `CHROMA_API_KEY` | Yes | — | Chroma Cloud API key. |
| `CHROMA_TENANT` | Yes | — | Chroma Cloud tenant identifier. |
| `CHROMA_DATABASE` | Yes | — | Chroma Cloud database name. |
| `LANGSEARCH_API_KEY` | Yes (for reranking) | — | LangSearch bearer token for the `/v1/rerank` endpoint. |

> The app validates Google and Chroma credentials on boot. Missing LangSearch configuration leads to runtime errors when reranking is invoked.

## API Documentation
All REST endpoints are documented in detail in [API.md](API.md).

## Logging & Error Handling
- Use `createLogger(prefix)` (`src/utils/logger.ts`) to emit namespaced logs. The LangSearch integration logs request failures and abnormal responses before surfacing errors.
- A centralized error handler (`src/middlewares/errorHandler.ts`) maps common upstream errors (401, 429, 400) to readable JSON responses. Unknown issues default to HTTP 500 with `{"success": false, "error": "服务器内部错误"}`.

## Deployment Notes
- Compilation artifacts live in `dist/`. Deployments should run `pnpm build` and serve the compiled output via `pnpm start`.
- When the `VERCEL` environment variable equals `1`, the server does not call `app.listen`, making it compatible with Vercel’s serverless runtime. Exported `app` can be wrapped in a serverless handler.

## Useful Scripts
| Script | Description |
| --- | --- |
| `pnpm build` | Clean `dist/` and compile TypeScript. |
| `pnpm start` | Run the compiled server from `dist/index.js`. |
| `pnpm dev` | Rebuild and run once (no file watcher). |
| `pnpm lint` | Run ESLint using the shared `@antfu/eslint-config`. |

## Troubleshooting
- **Missing API keys**: Startup validation throws if Google or Chroma credentials are absent. LangSearch calls throw `LANGSEARCH_API_KEY 未配置` when the reranker is triggered without credentials.
- **Similarity search returns empty data**: Ensure the collection has been populated and, if necessary, pass a filter that matches stored metadata.
- **Rerank failures**: Logs are emitted under the `LangSearchService` prefix with the HTTP status and message body to help diagnose authentication or quota issues.

## 中文文档

一个使用 TypeScript 编写的 Express 服务，用于构建检索增强生成（RAG）工作流。该项目负责在 Chroma Cloud 中管理知识库，调用 Google Generative AI 生成嵌入，并使用 LangSearch API 对检索结果进行重排，同时提供基于 LangChain 的文本切分工具，便于将原始文本拆分为可导入知识库的文档。

### 功能特性
- 通过 REST API 创建、更新、查询和删除基于 Chroma 的知识库。
- 支持写入与删除文档，并在集合中执行语义相似度检索。
- 结合 LangSearch（`langsearch-reranker-v1`）对向量检索结果进行重排，提高答案质量。
- 使用 LangChain 递归字符分割器，将长文本切分为多个 `Document` 片段。
- 可在本地运行，也可部署到 Vercel 等平台（当 `VERCEL=1` 时不会主动监听端口）。

### 技术栈
- **运行时**：Node.js + Express
- **语言**：TypeScript（编译产物位于 `dist/`）
- **向量存储**：LangChain `Chroma` 客户端（接入 Chroma Cloud）
- **向量化服务**：Google Generative AI 嵌入模型（`TaskType.RETRIEVAL_DOCUMENT`）
- **结果重排**：LangSearch HTTP API（`/v1/rerank`）

### 环境要求
- Node.js 18+（默认启用 Corepack，可直接使用 pnpm）
- pnpm 10（由 `packageManager` 字段自动选定）
- Chroma Cloud 账号凭证
- Google Generative AI API Key 与可用的嵌入模型
- LangSearch API Key

### 快速上手
1. 安装依赖：
   ```bash
   pnpm install
   ```
2. 在项目根目录创建 `.env` 文件，并填入所需环境变量（见下方说明）。
3. 编译 TypeScript：
   ```bash
   pnpm build
   ```
4. 启动编译后的服务：
   ```bash
   pnpm start
   ```
   默认监听 `http://localhost:3008`。

临时构建并运行可使用 `pnpm dev`（运行一次 `tsc` 并执行编译产物）。代码风格检查可通过 `pnpm lint` 执行。

### 环境变量
配置项定义在 `src/config/index.ts`。启动时会读取以下环境变量：

| 变量 | 是否必填 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `PORT` | 否 | `3008` | 本地运行的 HTTP 端口 |
| `GOOGLE_API_KEY` | 是 | — | Google Generative AI 嵌入服务的 API Key |
| `GOOGLE_EMBEDINNG_MODEL` | 否 | `gemini-embedding-001` | 嵌入模型 ID（变量名保持项目中的拼写） |
| `CHROMA_API_KEY` | 是 | — | Chroma Cloud API Key |
| `CHROMA_TENANT` | 是 | — | Chroma Cloud Tenant |
| `CHROMA_DATABASE` | 是 | — | Chroma Cloud 数据库名称 |
| `LANGSEARCH_API_KEY` | 是（使用重排时） | — | LangSearch `/v1/rerank` 接口所需的 Token |

> 程序启动时会验证 Google 与 Chroma 的配置；缺少 LangSearch 配置时，在调用重排接口时会抛出 `LANGSEARCH_API_KEY 未配置` 错误。

### API 文档
完整接口说明请参阅 [API.md](API.md)。

### 日志与错误处理
- 使用 `createLogger(prefix)`（位于 `src/utils/logger.ts`）创建带前缀的日志器。LangSearch 集成在请求失败或返回异常时会输出详细日志。
- 全局错误处理中间件（`src/middlewares/errorHandler.ts`）会根据上游返回的 401、429、400 等状态码生成易读的 JSON 响应，其他错误默认为 500。

### 部署说明
- 编译结果存放于 `dist/`；部署时建议执行 `pnpm build` 后运行 `pnpm start`。
- 当环境变量 `VERCEL=1` 时，不会调用 `app.listen`，方便在 Vercel 等无状态平台上托管，可自行封装 `app` 为 Serverless 入口。

### 常用脚本
| 脚本 | 说明 |
| --- | --- |
| `pnpm build` | 清理 `dist/` 并编译 TypeScript |
| `pnpm start` | 运行编译产物 `dist/index.js` |
| `pnpm dev` | 执行一次编译并启动（无文件监听） |
| `pnpm lint` | 使用 `@antfu/eslint-config` 进行 ESLint 检查 |

### 常见问题
- **缺少 API Key**：启动时会校验 Google 与 Chroma 的配置；若未设置 LangSearch Key，在触发重排功能时会报错。
- **相似度检索无结果**：确认集合已写入文档，必要时提供匹配的筛选条件。
- **重排失败**：`LangSearchService` 前缀的日志会记录 HTTP 状态码和返回内容，便于排查认证或配额问题。
