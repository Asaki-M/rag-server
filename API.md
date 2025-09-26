# RAG Server API 文档

## 知识库管理接口

### 1. 创建知识库

**接口地址：** `POST /api/knowledge-base`

**请求参数：**

| 参数名      | 类型   | 必填 | 说明           |
|-------------|--------|------|----------------|
| name        | string | 是   | 知识库名称     |
| description | string | 否   | 知识库描述     |

### 2. 查询所有知识库

**接口地址：** `GET /api/knowledge-base/collections`

**请求参数：** 无

### 3. 更新知识库

**接口地址：** `PUT /api/knowledge-base/:collectionName`

**路径参数：**

| 参数名         | 类型   | 必填 | 说明       |
|----------------|--------|------|------------|
| collectionName | string | 是   | 知识库名称 |

**请求参数：**

| 参数名         | 类型   | 必填 | 说明           |
|----------------|--------|------|----------------|
| newName        | string | 否   | 新的知识库名称 |
| newDescription | string | 否   | 新的知识库描述 |

### 4. 删除知识库

**接口地址：** `DELETE /api/knowledge-base/:collectionName`

**路径参数：**

| 参数名         | 类型   | 必填 | 说明       |
|----------------|--------|------|------------|
| collectionName | string | 是   | 知识库名称 |

## 文档管理接口

### 5. 添加文档到知识库

**接口地址：** `POST /api/knowledge-base/:collectionName/documents`

**路径参数：**

| 参数名         | 类型   | 必填 | 说明       |
|----------------|--------|------|------------|
| collectionName | string | 是   | 知识库名称 |

**请求参数：**

| 参数名    | 类型  | 必填 | 说明         |
|-----------|-------|------|--------------|
| documents | array | 是   | 文档数组     |

**documents 数组元素结构：**

| 参数名     | 类型   | 必填 | 说明     |
|------------|--------|------|----------|
| pageContent| string | 是   | 文档内容 |
| metadata   | object | 否   | 元数据   |

### 6. 搜索文档

**接口地址：** `POST /api/knowledge-base/:collectionName/search`

**路径参数：**

| 参数名         | 类型   | 必填 | 说明       |
|----------------|--------|------|------------|
| collectionName | string | 是   | 知识库名称 |

**请求参数：**

| 参数名 | 类型   | 必填 | 说明                     |
|--------|--------|------|--------------------------|
| query  | string | 是   | 查询文本                 |
| k      | number | 否   | 返回文档数量，默认为 5   |
| filter | object | 否   | 过滤条件                 |

### 7. 删除文档

**接口地址：** `DELETE /api/knowledge-base/:collectionName/documents`

**路径参数：**

| 参数名         | 类型   | 必填 | 说明       |
|----------------|--------|------|------------|
| collectionName | string | 是   | 知识库名称 |

**请求参数：**

| 参数名 | 类型  | 必填 | 说明           |
|--------|-------|------|----------------|
| ids    | array | 是   | 文档ID数组     |

## 文本处理接口

### 8. 分割文本

**接口地址：** `POST /api/split-text`

**请求参数：**

| 参数名       | 类型   | 必填 | 说明                                    |
|--------------|--------|------|-----------------------------------------|
| text         | string | 是   | 要分割的文本内容                        |
| chunkSize    | number | 否   | 分割块大小，默认为 100，必须是正整数    |
| chunkOverlap | number | 否   | 块重叠大小，默认为 0，必须≥0且<chunkSize |
