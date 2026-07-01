# 向量数据库

## 官方资料

- [Milvus Quickstart](https://milvus.io/docs/quickstart.md)
- [Milvus documentation](https://milvus.io/docs)
- [Chroma introduction](https://docs.trychroma.com/docs/overview/introduction)
- [OpenAI embeddings guide](https://developers.openai.com/api/docs/guides/embeddings)

> 学习说明：本篇以 Milvus 和 Chroma 官方文档为主，讲清楚向量数据库是什么、为什么 RAG 需要它、如何用它保存 runbook embedding 并做相似度检索。

## 为什么要学

向量数据库是 RAG 和语义检索的基础设施。AIOps 里，runbook、事故复盘、日志摘要、告警解释都可以向量化后存入向量数据库，用来做相似故障检索和知识问答。

## 它解决什么问题

- 存储文本、图片或其他对象的 embedding 向量。
- 根据语义相似度检索相关文档。
- 支持 RAG 的召回阶段。
- 帮助查找相似告警、相似事故、相似 runbook。
- 管理向量、原文 metadata 和过滤条件。

## 是什么

向量数据库是专门存储、索引和检索向量的数据库。向量通常来自 embedding 模型，用一串浮点数表示文本、图片或其他对象的语义。

在 AIOps 中，向量数据库可以用来：

- 查找相似告警。
- 查找相似事故报告。
- 查找相关 runbook。
- 支撑 RAG 问答。
- 做日志语义搜索。

普通数据库擅长精确查询：

```sql
WHERE service = 'order-api'
```

向量数据库擅长相似查询：

```text
找出和“order-api 发布后 5xx 升高”语义最相近的历史案例
```

## 核心原理

流程：

```text
text
  -> embedding model
  -> vector [0.012, -0.023, ...]
  -> vector database
      -> index
      -> similarity search
  -> top-k similar documents
```

相似度通常用：

| 方法 | 含义 |
|---|---|
| cosine similarity | 夹角相似度，常用于文本 embedding |
| dot product | 点积，归一化向量下常和 cosine 排名一致 |
| Euclidean distance | 欧氏距离 |

OpenAI embeddings 文档说明 embeddings 可以度量文本相关性，并推荐常见场景下使用余弦相似度。

## Milvus 和 Chroma

| 工具 | 特点 | 适合阶段 |
|---|---|---|
| Chroma | 上手快，本地开发方便，和 LangChain 集成简单 | 个人学习、RAG 原型 |
| Milvus | 专业向量数据库，支持 Lite、Docker、Kubernetes、gRPC/REST、多语言客户端 | 从原型到生产演进 |

建议学习顺序：

1. 先用 Chroma 做本地 RAG。
2. 再用 Milvus Lite 学集合、schema、插入、检索。
3. 最后了解 Milvus Docker / Kubernetes 部署。

## 向量数据库架构

```text
client
  -> embedding model
  -> vector database
      -> collection
      -> schema
      -> vector field
      -> metadata fields
      -> index
      -> search
  -> top-k results
```

核心概念：

| 概念 | 含义 | AIOps 例子 |
|---|---|---|
| Collection | 一组向量数据 | `aiops_runbooks` |
| Entity / Record | 一条记录 | 一个 runbook chunk |
| Vector field | 向量字段 | 文本 embedding |
| Metadata | 元数据 | 服务名、文件名、标题 |
| Index | 向量索引 | 提升检索速度 |
| Top-k | 返回最相似的 k 条 | 取前 3 条资料给 LLM |

## Chroma 快速实验

安装：

```bash
pip install chromadb openai python-dotenv
```

示例：

```python
import chromadb
from openai import OpenAI

openai_client = OpenAI()
chroma_client = chromadb.PersistentClient(path="./chroma_db")

collection = chroma_client.get_or_create_collection(name="aiops_runbooks")

texts = [
    "order-api 5xx 升高时，先检查最近发布、数据库连接池、下游 payment-api。",
    "payment-api 延迟升高时，先检查第三方支付渠道、连接池、慢查询。",
    "Redis 内存打满时，检查 used_memory、maxmemory、big key 和过期策略。",
]

embeddings = openai_client.embeddings.create(
    model="text-embedding-3-small",
    input=texts,
)

collection.add(
    ids=["doc-1", "doc-2", "doc-3"],
    documents=texts,
    embeddings=[item.embedding for item in embeddings.data],
    metadatas=[
        {"service": "order-api", "source": "order-runbook.md"},
        {"service": "payment-api", "source": "payment-runbook.md"},
        {"service": "redis", "source": "redis-runbook.md"},
    ],
)

query = "订单服务错误率升高怎么办？"
query_embedding = openai_client.embeddings.create(
    model="text-embedding-3-small",
    input=query,
).data[0].embedding

results = collection.query(
    query_embeddings=[query_embedding],
    n_results=2,
)

print(results["documents"])
print(results["metadatas"])
```

## Milvus Lite 快速实验

Milvus 官方 quickstart 使用 Milvus Lite，它包含在 `pymilvus` 中，适合本地 Python 程序入门。

安装：

```bash
pip install -U pymilvus openai python-dotenv
```

示例：

```python
from openai import OpenAI
from pymilvus import MilvusClient

openai_client = OpenAI()
client = MilvusClient("milvus_aiops.db")

collection_name = "aiops_runbooks"

if client.has_collection(collection_name):
    client.drop_collection(collection_name)

client.create_collection(
    collection_name=collection_name,
    dimension=1536,
)

texts = [
    "order-api 5xx 升高时，先检查最近发布、数据库连接池、下游 payment-api。",
    "payment-api 延迟升高时，先检查第三方支付渠道、连接池、慢查询。",
    "Redis 内存打满时，检查 used_memory、maxmemory、big key 和过期策略。",
]

vectors = openai_client.embeddings.create(
    model="text-embedding-3-small",
    input=texts,
).data

data = [
    {
        "id": i,
        "vector": vectors[i].embedding,
        "text": texts[i],
        "service": ["order-api", "payment-api", "redis"][i],
    }
    for i in range(len(texts))
]

client.insert(collection_name=collection_name, data=data)

query = "订单接口错误率很高，应该先查什么？"
query_vector = openai_client.embeddings.create(
    model="text-embedding-3-small",
    input=query,
).data[0].embedding

results = client.search(
    collection_name=collection_name,
    data=[query_vector],
    limit=2,
    output_fields=["text", "service"],
)

for hit in results[0]:
    print(hit["distance"], hit["entity"])
```

注意：`dimension=1536` 对应 `text-embedding-3-small` 的常见向量维度。换 embedding 模型时，要确认维度是否一致。

## Schema 设计

向量库不要只存向量，还要存元数据。

Runbook chunk 推荐字段：

| 字段 | 类型 | 作用 |
|---|---|---|
| `id` | string / int | 唯一 ID |
| `vector` | vector | embedding |
| `text` | string | 原文片段 |
| `source` | string | 文件路径 |
| `service` | string | 服务名 |
| `title` | string | 标题 |
| `updated_at` | datetime/string | 更新时间 |
| `doc_type` | string | runbook / rca / architecture |

好处：

- 可以按服务过滤。
- 可以输出来源。
- 可以过期重建。
- 可以做权限隔离。

## 索引

向量数据库通过索引加速相似度搜索。不同数据库支持的索引类型不同，常见有 HNSW、IVF 等。

学习阶段先理解：

- 小数据量可以先不纠结索引。
- 数据量变大后，索引影响速度、召回率和内存。
- 索引参数不是固定答案，要用真实数据测试。
- AIOps 场景通常 top-k 很小，比如 3、5、10。

## 检索策略

### 只按语义检索

```text
query: order-api 5xx 升高怎么办
top-k: 5
```

### 语义 + 元数据过滤

```text
query: 5xx 升高怎么办
filter: service = order-api
top-k: 5
```

### 混合检索

把关键词和向量检索结合：

- 关键词确保命中服务名、错误码。
- 向量检索补充语义相似。

Chroma 文档提到它支持 embedding、metadata filtering、dense / sparse / hybrid search 等检索能力。学习阶段先把 dense vector search 跑通。

## 数据更新

Runbook 会更新，向量库也要更新。

简单策略：

1. 每个 chunk 生成稳定 ID，例如 `文件路径 + 标题 + chunk序号`。
2. 文档变化后删除旧 chunk。
3. 重新切分并写入新 chunk。
4. 保留 `updated_at`。

伪代码：

```python
def reindex_document(path):
    delete_chunks_by_source(path)
    chunks = split_document(path)
    vectors = embed(chunks)
    insert_chunks(chunks, vectors)
```

## AIOps 中的作用

向量数据库在 AIOps 中通常服务于 RAG：

```text
runbook / RCA / service docs
  -> embeddings
  -> vector database
  -> similar documents
  -> LLM answer
  -> on-call engineer
```

它不替代 MySQL：

- MySQL 保存结构化事实。
- Prometheus 保存指标时间序列。
- Loki / Elasticsearch 保存日志。
- 向量数据库保存语义索引。

## 入门练习：相似故障检索

目录建议：

```text
projects/vector-incident-search/
  README.md
  incidents.jsonl
  index_chroma.py
  search.py
```

`incidents.jsonl`：

```json
{"id":"inc-001","service":"order-api","text":"发布后 order-api 5xx 升高，原因是数据库连接池配置错误。"}
{"id":"inc-002","service":"payment-api","text":"payment-api 延迟升高，原因是第三方支付渠道超时。"}
{"id":"inc-003","service":"redis","text":"Redis 内存打满，原因是告警去重 key 未设置过期时间。"}
```

要求：

1. 读取 JSONL。
2. 生成 embeddings。
3. 写入 Chroma 或 Milvus Lite。
4. 输入一个新告警，检索最相似历史事故。
5. 输出相似度、事故 ID、服务名和原文。

## 常见故障

### 向量维度不匹配

现象：插入时报 dimension mismatch。

原因：collection 创建维度和 embedding 模型输出维度不一致。

处理：

- 确认 embedding 模型。
- 重建 collection。
- 不要混用不同维度的模型。

### 检索结果不相关

排查：

- 文档是否太短或太泛。
- chunk 是否切坏。
- query 是否缺少关键上下文。
- 是否应该加 metadata filter。
- top-k 是否太小。

### 重复数据越来越多

处理：

- 使用稳定 ID。
- 更新前删除旧 source。
- 定期重建索引。

### 成本过高

处理：

- 文档入库只在变化时重新 embedding。
- 对相同文本缓存 embedding。
- 不要对同一文档反复全量入库。

## 学习检查清单

- [ ] 我能解释 embedding 和向量数据库的关系。
- [ ] 我能说明相似度检索的基本思想。
- [ ] 我能区分向量、metadata、collection/index。
- [ ] 我能把 runbook 文本写入向量库。
- [ ] 我能按服务名或标签过滤检索结果。
- [ ] 我能说明向量数据库在 RAG 中的位置。

## 面试题

1. 向量数据库解决什么问题？
2. embedding 是什么？
3. 语义检索和关键词检索有什么区别？
4. metadata 过滤为什么重要？
5. 相似度检索有哪些常见指标？
6. 向量库在 RAG 中属于哪一步？
7. 如何避免检索到无关 runbook？
8. 向量数据库如何帮助 AIOps 找相似故障？

## 学习证据

学完后，在 GitHub 留下：

- 一个向量库入库脚本。
- 一个相似故障检索脚本。
- 一份 `incidents.jsonl` 样例。
- README 解释 collection、embedding、metadata、top-k。
- 至少 3 个检索问题和结果截图。
