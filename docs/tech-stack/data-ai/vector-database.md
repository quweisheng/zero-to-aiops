# 向量数据库

> 目标：不是只会调用一次 `similarity_search`，而是能理解向量、embedding、维度、距离、collection、record、metadata/payload、schema、向量索引、标量索引、top-k、过滤、hybrid search、更新删除、权限、评估和 AIOps 相似故障检索落地。

## 官方资料

优先读这些官方资料：

- [OpenAI Embeddings](https://developers.openai.com/api/docs/guides/embeddings)
- [OpenAI Retrieval](https://developers.openai.com/api/docs/guides/retrieval)
- [Chroma Introduction](https://docs.trychroma.com/docs/overview/introduction)
- [Milvus Quickstart](https://milvus.io/docs/quickstart.md)
- [Milvus Schema Explained](https://milvus.io/docs/schema.md)
- [Milvus Index Vector Fields](https://milvus.io/docs/index-vector-fields.md)
- [Qdrant Vectors](https://qdrant.tech/documentation/manage-data/vectors/)
- [Qdrant Indexing](https://qdrant.tech/documentation/manage-data/indexing/)
- [Qdrant Filtering](https://qdrant.tech/documentation/search/filtering/)
- [Qdrant Hybrid Queries](https://qdrant.tech/documentation/search/hybrid-queries/)

说明：本文以 OpenAI embeddings、Chroma、Milvus、Qdrant 官方资料为主，讲清楚“向量数据库”这一类系统的共同概念，并用 AIOps 相似故障检索重新组织。

## 场景开场

你有三条历史事故：

```text
inc-001: 发布后 order-api 5xx 升高，原因是数据库连接池配置错误。
inc-002: payment-api 延迟升高，原因是第三方支付渠道超时。
inc-003: Redis 内存打满，原因是告警去重 key 没有过期时间。
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>inc-001: 发布后 order-api 5xx 升高，原因是数据库连接池配置错误。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>inc-002: payment-api 延迟升高，原因是第三方支付渠道超时。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>inc-003: Redis 内存打满，原因是告警去重 key 没有过期时间。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


今天来了一个新告警：

```text
订单接口发布后错误率明显升高，并伴随数据库连接超时。
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>订单接口发布后错误率明显升高，并伴随数据库连接超时。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


普通关键词搜索可能搜不到，因为：

- 历史写的是 `order-api`，新告警写的是“订单接口”。
- 历史写的是 `5xx`，新告警写的是“错误率”。
- 历史写的是“连接池配置错误”，新告警写的是“数据库连接超时”。

向量数据库要解决的问题就是：即使关键词不完全一样，也能找到语义相近的历史材料。

## 一句话人话版

向量数据库是语义检索仓库：它保存文本 embedding 向量和 metadata，让你能按“意思相近”而不是“关键词完全一样”查找 runbook、事故复盘、日志摘要和历史告警。

## 小白可能会问

- embedding 到底是什么？
- 向量维度为什么必须一致？
- 向量数据库和 MySQL 有什么区别？
- collection、record、metadata、payload 分别是什么？
- 为什么 RAG 通常需要向量数据库？
- cosine、dot product、L2 distance 有什么区别？
- top-k 是什么？
- HNSW、IVF 这类索引解决什么问题？
- metadata filter 为什么这么重要？
- 向量检索和关键词检索怎么结合？
- 文档更新后，向量库怎么更新？
- 如何评估相似故障检索好不好？
- 向量数据库会不会泄露内部文档权限？

## 官方知识地图

向量数据库可以按这张地图理解：

```text
Vector Database
  -> Input representation
     -> text
     -> embedding model
     -> vector dimension
     -> dense vector
     -> sparse vector
  -> Data model
     -> collection
     -> record / entity / point
     -> id
     -> vector field
     -> payload / metadata / scalar fields
     -> source text
  -> Indexing
     -> vector index
     -> payload / scalar index
     -> HNSW / IVF / other ANN indexes
     -> metric type
  -> Search
     -> vector search
     -> top-k
     -> metadata filtering
     -> hybrid search
     -> rerank
  -> Operations
     -> insert / upsert
     -> delete
     -> update metadata
     -> reindex
     -> backup
     -> migration
  -> AIOps
     -> similar incidents
     -> runbook retrieval
     -> alert dedup explanation
     -> RAG recall layer
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Vector Database</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; Input representation</code> | 这一行要理解这些英文词：`Input representation` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>     -&gt; text</code> | 这一行要理解这些英文词：`text` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>     -&gt; embedding model</code> | 这一行要理解这些英文词：`embedding model` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>     -&gt; vector dimension</code> | 这一行要理解这些英文词：`vector dimension` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>     -&gt; dense vector</code> | 这一行要理解这些英文词：`dense vector` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 7 行 | <code>     -&gt; sparse vector</code> | 这一行要理解这些英文词：`sparse vector` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 8 行 | <code>  -&gt; Data model</code> | 这一行要理解这些英文词：`Data model` 是data=数据。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 9 行 | <code>     -&gt; collection</code> | 这一行要理解这些英文词：`collection` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 10 行 | <code>     -&gt; record / entity / point</code> | 这一行要理解这些英文词：`record` 是记录，表示数据库、日志或事件中的一条数据；`entity` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`point` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 11 行 | <code>     -&gt; id</code> | 这一行要理解这些英文词：`id` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 12 行 | <code>     -&gt; vector field</code> | 这一行要理解这些英文词：`vector field` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 13 行 | <code>     -&gt; payload / metadata / scalar fields</code> | 这一行要理解这些英文词：`payload` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`metadata` 是元数据，用来描述数据的数据，例如来源、服务名、标签；`scalar fields` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 14 行 | <code>     -&gt; source text</code> | 这一行要理解这些英文词：`source text` 是source=来源。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 15 行 | <code>  -&gt; Indexing</code> | 这一行要理解这些英文词：`Indexing` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 16 行 | <code>     -&gt; vector index</code> | 这一行要理解这些英文词：`vector index` 是index=索引或目录。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 17 行 | <code>     -&gt; payload / scalar index</code> | 这一行要理解这些英文词：`payload` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`scalar index` 是index=索引或目录。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 18 行 | <code>     -&gt; HNSW / IVF / other ANN indexes</code> | 这一行要理解这些英文词：`HNSW` 是英文缩写或固定标识，结合本节上下文记住它代表的组件、命令或状态；`IVF` 是英文缩写或固定标识，结合本节上下文记住它代表的组件、命令或状态；`other ANN indexes` 是indexes=索引。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 19 行 | <code>     -&gt; metric type</code> | 这一行要理解这些英文词：`metric type` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 20 行 | <code>  -&gt; Search</code> | 这一行要理解这些英文词：`Search` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 21 行 | <code>     -&gt; vector search</code> | 这一行要理解这些英文词：`vector search` 是向量检索，用相似度搜索相近文本、事件或知识片段。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 22 行 | <code>     -&gt; top-k</code> | 这一行要理解这些英文词：`top-k` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 23 行 | <code>     -&gt; metadata filtering</code> | 这一行要理解这些英文词：`metadata filtering` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 24 行 | <code>     -&gt; hybrid search</code> | 这一行要理解这些英文词：`hybrid search` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 25 行 | <code>     -&gt; rerank</code> | 这一行要理解这些英文词：`rerank` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 26 行 | <code>  -&gt; Operations</code> | 这一行要理解这些英文词：`Operations` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 27 行 | <code>     -&gt; insert / upsert</code> | 这一行要理解这些英文词：`insert` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`upsert` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 28 行 | <code>     -&gt; delete</code> | 这一行要理解这些英文词：`delete` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 29 行 | <code>     -&gt; update metadata</code> | 这一行要理解这些英文词：`update metadata` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 30 行 | <code>     -&gt; reindex</code> | 这一行要理解这些英文词：`reindex` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 31 行 | <code>     -&gt; backup</code> | 这一行要理解这些英文词：`backup` 是备份，把数据复制出来以便故障后恢复。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 32 行 | <code>     -&gt; migration</code> | 这一行要理解这些英文词：`migration` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 33 行 | <code>  -&gt; AIOps</code> | 这一行要理解这些英文词：`AIOps` 是智能运维。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 34 行 | <code>     -&gt; similar incidents</code> | 这一行要理解这些英文词：`similar incidents` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 35 行 | <code>     -&gt; runbook retrieval</code> | 这一行要理解这些英文词：`runbook retrieval` 是runbook=故障处理手册。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 36 行 | <code>     -&gt; alert dedup explanation</code> | 这一行要理解这些英文词：`alert dedup explanation` 是alert=告警，dedup=去重。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 37 行 | <code>     -&gt; RAG recall layer</code> | 这一行要理解这些英文词：`RAG recall layer` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


初学路线：

```text
OpenAI embeddings
  -> Chroma local collection
  -> insert incident records
  -> query by new alert
  -> metadata filter by service
  -> Milvus Lite collection
  -> schema and dimension
  -> evaluate top-k
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>OpenAI embeddings</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; Chroma local collection</code> | 这一行要理解这些英文词：`Chroma local collection` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; insert incident records</code> | 这一行要理解这些英文词：`insert incident records` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; query by new alert</code> | 这一行要理解这些英文词：`query by new alert` 是query=查询，alert=告警。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; metadata filter by service</code> | 这一行要理解这些英文词：`metadata filter by service` 是service=服务。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>  -&gt; Milvus Lite collection</code> | 这一行要理解这些英文词：`Milvus Lite collection` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 7 行 | <code>  -&gt; schema and dimension</code> | 这一行要理解这些英文词：`schema and dimension` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 8 行 | <code>  -&gt; evaluate top-k</code> | 这一行要理解这些英文词：`evaluate top-k` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


## 向量数据库在 AIOps 链路中的位置

```text
runbooks / incidents / service docs / alert summaries
  -> chunk
  -> embedding
  -> vector database
  -> retrieve similar records
  -> LLM / RAG answer
  -> on-call engineer
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>runbooks / incidents / service docs / alert summaries</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; chunk</code> | 这一行要理解这些英文词：`chunk` 是数据分块，把长文本或大数据拆成较小片段。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; embedding</code> | 这一行要理解这些英文词：`embedding` 是向量表示，把文本转换成模型可计算的数字向量。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; vector database</code> | 这一行要理解这些英文词：`vector database` 是database=数据库。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; retrieve similar records</code> | 这一行要理解这些英文词：`retrieve similar records` 是retrieve=检索。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>  -&gt; LLM / RAG answer</code> | 这一行要理解这些英文词：`LLM` 是大语言模型；`RAG answer` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 7 行 | <code>  -&gt; on-call engineer</code> | 这一行要理解这些英文词：`on-call engineer` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


它不替代其他数据库：

| 系统 | 擅长保存 | 查询方式 |
|---|---|---|
| MySQL | 告警表、工单、配置、分析结果 | SQL 精确查询 |
| Redis | 短期状态、去重、缓存、限流 | key / TTL / data structure |
| Kafka | 事件流 | topic / partition / consumer |
| Prometheus | 指标时间序列 | PromQL |
| Loki / Elasticsearch | 日志和文本搜索 | label / query / full-text |
| 向量数据库 | embedding 和语义索引 | similarity search |

一句话：

```text
结构化事实进 MySQL。
短期状态进 Redis。
事件流进 Kafka。
语义相似检索进向量数据库。
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>结构化事实进 MySQL。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>短期状态进 Redis。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>事件流进 Kafka。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>语义相似检索进向量数据库。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


## embedding 深讲

Embedding 是把文本变成一串浮点数。

```text
"order-api 5xx after deploy"
  -> [0.012, -0.083, 0.451, ...]
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>"order-api 5xx after deploy"</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; [0.012, -0.083, 0.451, ...]</code> | 这一行表示上一级主题下的子项“0.012, -0.083, 0.451”，重点理解这个子项本身，不要把箭头当成知识点。 |


这串数字不是给人读的，而是给算法比较相似度的。

OpenAI embeddings 文档说明，embedding 可以用于搜索、聚类、推荐、异常检测、分类等任务。AIOps 中最常见的是：

- 相似告警检索。
- 相似事故检索。
- runbook 检索。
- RAG 召回。
- 日志摘要聚类。

## 向量维度

每个 embedding 模型会输出固定维度的向量。

例如：

```text
text-embedding-3-small -> 默认 1536 维
text-embedding-3-large -> 默认 3072 维
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>text-embedding-3-small -&gt; 默认 1536 维</code> | 这一行要理解这些英文词：`text-embedding-3-small` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 2 行 | <code>text-embedding-3-large -&gt; 默认 3072 维</code> | 这一行要理解这些英文词：`text-embedding-3-large` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


维度必须和 collection 的向量字段一致。

错误示例：

```text
collection dimension = 1536
insert vector dimension = 3072
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>collection dimension = 1536</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>insert vector dimension = 3072</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


结果通常是 dimension mismatch。

如果你换 embedding 模型，不能直接把不同维度的向量混在同一个向量字段里。常见做法：

- 新建 collection。
- 双写新旧 embedding 一段时间。
- 回填历史数据。
- 切查询流量。
- 删除旧索引。

## 距离和相似度

向量检索本质是“找距离最近的向量”。

常见指标：

| 指标 | 名称 | 直觉 | 常见场景 |
|---|---|---|---|
| cosine | 余弦相似度 | 比较方向是否接近 | 文本 embedding |
| dot product | 点积 | 方向和长度综合 | 归一化向量时接近 cosine |
| L2 / Euclidean | 欧氏距离 | 空间距离 | 图像、通用向量 |

注意不同数据库返回的 `score` 或 `distance` 含义可能不同：

- 有的分数越大越相似。
- 有的距离越小越相似。
- 有的叫 `distance`，有的叫 `score`。

不要只看字段名，要看具体数据库文档。

## Top-k

Top-k 是返回最相似的 k 条结果。

```text
query: order-api error rate after deploy
k = 3
return top 3 similar incidents
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>query: order-api error rate after deploy</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>k = 3</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>return top 3 similar incidents</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


k 太小：

- 可能漏掉正确资料。

k 太大：

- 带入无关资料。
- LLM 上下文变长。
- 成本和延迟升高。

AIOps RAG 常从 `k=3`、`k=5`、`k=10` 试起，用评估集决定。

## 数据模型

不同产品叫法不同：

| 概念 | Chroma | Milvus | Qdrant | 通用理解 |
|---|---|---|---|---|
| 数据集合 | collection | collection | collection | 一组向量记录 |
| 一条记录 | document + metadata | entity | point | 一个 chunk 或对象 |
| 元数据 | metadata | scalar field | payload | 过滤和展示字段 |
| 向量 | embedding | vector field | vector | embedding 数组 |
| 主键 | id | primary key | point id | 唯一标识 |

AIOps runbook chunk 可以这样建模：

```json
{
  "id": "runbook-order-api-HighErrorRate-0",
  "text": "order-api 5xx 升高时，先检查最近发布、数据库连接池、下游 payment-api。",
  "vector": [0.012, -0.083],
  "metadata": {
    "source": "docs/runbooks/order-api.md",
    "service": "order-api",
    "section": "HighErrorRate",
    "doc_type": "runbook",
    "updated_at": "2026-07-02"
  }
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{</code> | 对象开始，表示下面是一组键值对配置。 |
| 第 2 行 | <code>  "id": "runbook-order-api-HighErrorRate-0",</code> | 设置 `id` 字段，值是 `"runbook-order-api-HighErrorRate-0"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 3 行 | <code>  "text": "order-api 5xx 升高时，先检查最近发布、数据库连接池、下游 payment-api。",</code> | 设置 `text` 字段，值是 `"order-api 5xx 升高时，先检查最近发布、数据库连接池、下游 payment-api。"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 4 行 | <code>  "vector": [0.012, -0.083],</code> | 设置 `vector` 字段，值是 `[0.012, -0.083]`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 5 行 | <code>  "metadata": {</code> | 设置 `metadata` 字段，值是 `{`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 6 行 | <code>    "source": "docs/runbooks/order-api.md",</code> | 设置 `source` 字段，值是 `"docs/runbooks/order-api.md"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 7 行 | <code>    "service": "order-api",</code> | 设置 `service` 字段，值是 `"order-api"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 8 行 | <code>    "section": "HighErrorRate",</code> | 设置 `section` 字段，值是 `"HighErrorRate"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 9 行 | <code>    "doc_type": "runbook",</code> | 设置 `doc_type` 字段，值是 `"runbook"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 10 行 | <code>    "updated_at": "2026-07-02"</code> | 设置 `updated_at` 字段，值是 `"2026-07-02"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 11 行 | <code>  }</code> | 对象结束，表示这一组键值对配置到这里结束。 |
| 第 12 行 | <code>}</code> | 对象结束，表示这一组键值对配置到这里结束。 |


## Metadata / Payload

向量相似度只负责“语义像不像”。metadata 负责“这个结果能不能用”。

常见 metadata：

| 字段 | 示例 | 用途 |
|---|---|---|
| `source` | `docs/runbooks/order-api.md` | 引用来源 |
| `service` | `order-api` | 按服务过滤 |
| `section` | `HighErrorRate` | 定位章节 |
| `doc_type` | `runbook` | 区分 runbook / incident |
| `severity` | `critical` | 按严重级别过滤 |
| `owner` | `platform-team` | 找负责人 |
| `updated_at` | `2026-07-02` | 判断新旧 |
| `visibility` | `internal` | 权限控制 |

为什么重要？

```text
query: 5xx 错误率升高
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>query: 5xx 错误率升高</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


如果不加过滤，可能检索到 `payment-api`、`frontend`、`order-api` 混在一起。

更稳的检索：

```text
query: 5xx 错误率升高
filter: service = order-api
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>query: 5xx 错误率升高</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>filter: service = order-api</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


## Schema 设计

向量数据库也要设计 schema。

一个 AIOps incident collection 可以这样设计：

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | string / int | 唯一 ID |
| `vector` | vector | embedding |
| `text` | string | 原文摘要或 chunk |
| `incident_id` | string | 事故编号 |
| `service` | string | 服务名 |
| `severity` | string | 严重级别 |
| `root_cause_type` | string | 根因类型 |
| `started_at` | datetime/string | 事故开始时间 |
| `source` | string | 来源文件 |
| `doc_type` | string | incident / runbook / note |

设计原则：

- 会过滤的字段要放 metadata / scalar / payload。
- 会展示的来源字段要保存。
- 不要只存向量。
- 不要把敏感原文无脑写入向量库。
- 主键要稳定，方便更新和删除。
- embedding 模型和维度要记录。

## 索引

小数据可以暴力扫描所有向量。数据多了就需要索引。

向量索引用来加速相似度搜索。常见类型包括 HNSW、IVF 等。不同数据库支持不同索引和参数。

你需要理解三个权衡：

| 目标 | 代价 |
|---|---|
| 更快搜索 | 可能占更多内存 |
| 更高召回 | 可能更慢 |
| 更低成本 | 可能牺牲召回或延迟 |

除了向量索引，还要关注 metadata / payload / scalar index。

例如 Qdrant 文档强调：只有向量索引不够，过滤字段也需要 payload index，否则带过滤的查询可能拖慢。

AIOps 常见过滤字段：

- `service`
- `doc_type`
- `severity`
- `owner`
- `updated_at`
- `visibility`

这些字段如果用于高频过滤，就应该考虑建索引。

## 精确检索和近似检索

向量搜索有两类：

| 类型 | 说明 | 适用 |
|---|---|---|
| exact search | 精确算所有距离 | 小数据、评估基准 |
| approximate nearest neighbor | 近似最近邻 | 大数据、低延迟 |

ANN 索引不一定返回数学上绝对最近的结果，但速度更快。

所以生产上要评估：

- recall@k。
- p95 查询延迟。
- 内存占用。
- 索引构建时间。
- 写入吞吐。

## 检索策略

### 纯向量检索

```text
query -> embedding -> vector search -> top-k
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>query -&gt; embedding -&gt; vector search -&gt; top-k</code> | 这一行要理解这些英文词：`query` 是查询；`embedding` 是向量表示，把文本转换成模型可计算的数字向量；`vector search` 是向量检索，用相似度搜索相近文本、事件或知识片段；`top-k` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


适合语义相似。

### 向量 + metadata filter

```text
query -> embedding -> vector search where service = order-api
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>query -&gt; embedding -&gt; vector search where service = order-api</code> | 这一行要理解这些英文词：`query` 是查询；`embedding` 是向量表示，把文本转换成模型可计算的数字向量；`vector search where service` 是service=服务；`order-api` 是order=订单服务或订单业务域，api=应用程序接口。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


适合 AIOps 大多数场景。

### 关键词检索

```text
search exact terms: HighErrorRate, ORA-00020, HTTP 502
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>search exact terms: HighErrorRate, ORA-00020, HTTP 502</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


适合错误码、服务名、函数名、配置项。

### Hybrid Search

hybrid search 结合 dense vector 和 sparse / keyword 信号。

适合：

- 服务名必须精确。
- 错误码必须精确。
- 用户问题又带自然语言。

例如：

```text
order-api 502 after deployment
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>order-api 502 after deployment</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


这里同时需要：

- `order-api` 精确命中。
- `502` 精确命中。
- `after deployment` 语义理解。

Qdrant hybrid queries 文档里展示了 dense 和 sparse 结果融合的思路，例如 RRF。OpenAI Retrieval 也支持语义和关键词混合思想。学习阶段先跑通向量检索，进阶后再做 hybrid。

## 数据更新

文档会变化，向量库也必须同步。

常见策略：

```text
source file changed
  -> delete chunks by source
  -> re-split document
  -> embed new chunks
  -> upsert new records
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>source file changed</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; delete chunks by source</code> | 这一行要理解这些英文词：`delete chunks by source` 是source=来源。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; re-split document</code> | 这一行要理解这些英文词：`re-split document` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; embed new chunks</code> | 这一行要理解这些英文词：`embed new chunks` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; upsert new records</code> | 这一行要理解这些英文词：`upsert new records` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


稳定 ID 设计：

```text
{doc_type}:{source}:{section}:{chunk_index}:{content_hash}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{doc_type}:{source}:{section}:{chunk_index}:{content_hash}</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


如果不用稳定 ID，重复入库会导致：

- 同一文档出现多份。
- 检索结果重复。
- 成本上升。
- 旧答案污染新答案。

## 删除和过期

向量库经常忘记删除旧数据。

要处理：

- 文档删除后，对应 chunk 删除。
- runbook 迁移后，旧路径删除。
- 过期事故资料标记为 archived。
- 权限变化后更新 visibility。
- embedding 模型升级后删除旧 collection。

不要只追加，不清理。

## 权限和隔离

向量库里保存的是文档片段。原始文档的权限不一定自动继承。

风险：

- A 团队看到了 B 团队事故复盘。
- 普通用户检索到安全文档。
- 离职员工仍可通过缓存结果看到旧数据。
- LLM 回答泄露了无权限来源。

基本做法：

```text
user
  -> allowed services / teams / visibility
  -> metadata filter
  -> retrieve only authorized records
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>user</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; allowed services / teams / visibility</code> | 这一行要理解这些英文词：`allowed services` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`teams` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`visibility` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; metadata filter</code> | 这一行要理解这些英文词：`metadata filter` 是元数据过滤，按标签、服务名、时间等字段筛选数据。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; retrieve only authorized records</code> | 这一行要理解这些英文词：`retrieve only authorized records` 是retrieve=检索。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


示例 metadata：

```json
{
  "service": "order-api",
  "team": "platform-team",
  "visibility": "internal",
  "allowed_groups": "platform,oncall"
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{</code> | 对象开始，表示下面是一组键值对配置。 |
| 第 2 行 | <code>  "service": "order-api",</code> | 设置 `service` 字段，值是 `"order-api"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 3 行 | <code>  "team": "platform-team",</code> | 设置 `team` 字段，值是 `"platform-team"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 4 行 | <code>  "visibility": "internal",</code> | 设置 `visibility` 字段，值是 `"internal"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 5 行 | <code>  "allowed_groups": "platform,oncall"</code> | 设置 `allowed_groups` 字段，值是 `"platform,oncall"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 6 行 | <code>}</code> | 对象结束，表示这一组键值对配置到这里结束。 |


权限过滤必须在检索前做，不能只在生成答案后隐藏来源。

## Chroma 快速实验

Chroma 适合本地学习和 RAG 原型。

目录：

```text
projects/vector-incident-search/
  .env.example
  .gitignore
  requirements.txt
  incidents.jsonl
  index_chroma.py
  search_chroma.py
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>projects/vector-incident-search/</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  .env.example</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>  .gitignore</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>  requirements.txt</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>  incidents.jsonl</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 6 行 | <code>  index_chroma.py</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 7 行 | <code>  search_chroma.py</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


### requirements.txt

```text
chromadb
openai
python-dotenv
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>chromadb</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>openai</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>python-dotenv</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


### incidents.jsonl

```json
{"id":"inc-001","service":"order-api","severity":"critical","text":"发布后 order-api 5xx 升高，原因是数据库连接池配置错误。"}
{"id":"inc-002","service":"payment-api","severity":"warning","text":"payment-api 延迟升高，原因是第三方支付渠道超时。"}
{"id":"inc-003","service":"redis","severity":"critical","text":"Redis 内存打满，原因是告警去重 key 未设置过期时间。"}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{"id":"inc-001","service":"order-api","severity":"critical","text":"发布后 order-api 5xx 升高，原因是数据库连接池配置错误。"}</code> | JSON 列表或对象中的一行，注意逗号和引号必须符合 JSON 语法。 |
| 第 2 行 | <code>{"id":"inc-002","service":"payment-api","severity":"warning","text":"payment-api 延迟升高，原因是第三方支付渠道超时。"}</code> | JSON 列表或对象中的一行，注意逗号和引号必须符合 JSON 语法。 |
| 第 3 行 | <code>{"id":"inc-003","service":"redis","severity":"critical","text":"Redis 内存打满，原因是告警去重 key 未设置过期时间。"}</code> | JSON 列表或对象中的一行，注意逗号和引号必须符合 JSON 语法。 |


### index_chroma.py

```python
import json
import os

import chromadb
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

openai_client = OpenAI()
embedding_model = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")

chroma_client = chromadb.PersistentClient(path="./chroma_db")
collection = chroma_client.get_or_create_collection(name="aiops_incidents")

ids = []
documents = []
metadatas = []

with open("incidents.jsonl", "r", encoding="utf-8") as f:
    for line in f:
        item = json.loads(line)
        ids.append(item["id"])
        documents.append(item["text"])
        metadatas.append(
            {
                "service": item["service"],
                "severity": item["severity"],
                "source": "incidents.jsonl",
            }
        )

embedding_response = openai_client.embeddings.create(
    model=embedding_model,
    input=documents,
)
embeddings = [item.embedding for item in embedding_response.data]

collection.upsert(
    ids=ids,
    documents=documents,
    metadatas=metadatas,
    embeddings=embeddings,
)

print(f"indexed {len(ids)} incidents")
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>import json</code> | 导入 Python 模块，后面的代码会使用这个模块提供的功能。 |
| 第 2 行 | <code>import os</code> | 导入 Python 模块，后面的代码会使用这个模块提供的功能。 |
| 第 3 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 4 行 | <code>import chromadb</code> | 导入 Python 模块，后面的代码会使用这个模块提供的功能。 |
| 第 5 行 | <code>from dotenv import load_dotenv</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 6 行 | <code>from openai import OpenAI</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 7 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 8 行 | <code>load_dotenv()</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 9 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 10 行 | <code>openai_client = OpenAI()</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 11 行 | <code>embedding_model = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 12 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 13 行 | <code>chroma_client = chromadb.PersistentClient(path="./chroma_db")</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 14 行 | <code>collection = chroma_client.get_or_create_collection(name="aiops_incidents")</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 15 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 16 行 | <code>ids = []</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 17 行 | <code>documents = []</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 18 行 | <code>metadatas = []</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 19 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 20 行 | <code>with open("incidents.jsonl", "r", encoding="utf-8") as f:</code> | 上下文管理语句，常用于安全打开文件或管理连接。 |
| 第 21 行 | <code>    for line in f:</code> | 循环处理一组数据，常用于逐条处理告警、日志或指标样本。 |
| 第 22 行 | <code>        item = json.loads(line)</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 23 行 | <code>        ids.append(item["id"])</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 24 行 | <code>        documents.append(item["text"])</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 25 行 | <code>        metadatas.append(</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 26 行 | <code>            {</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 27 行 | <code>                "service": item["service"],</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 28 行 | <code>                "severity": item["severity"],</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 29 行 | <code>                "source": "incidents.jsonl",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 30 行 | <code>            }</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 31 行 | <code>        )</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 32 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 33 行 | <code>embedding_response = openai_client.embeddings.create(</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 34 行 | <code>    model=embedding_model,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 35 行 | <code>    input=documents,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 36 行 | <code>)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 37 行 | <code>embeddings = [item.embedding for item in embedding_response.data]</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 38 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 39 行 | <code>collection.upsert(</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 40 行 | <code>    ids=ids,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 41 行 | <code>    documents=documents,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 42 行 | <code>    metadatas=metadatas,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 43 行 | <code>    embeddings=embeddings,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 44 行 | <code>)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 45 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 46 行 | <code>print(f"indexed {len(ids)} incidents")</code> | 打印输出，用来在实验中确认变量、结果或调试信息。 |


### search_chroma.py

```python
import os

import chromadb
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

openai_client = OpenAI()
embedding_model = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")

chroma_client = chromadb.PersistentClient(path="./chroma_db")
collection = chroma_client.get_or_create_collection(name="aiops_incidents")

query = "订单接口发布后错误率升高，并伴随数据库连接超时。"

query_vector = openai_client.embeddings.create(
    model=embedding_model,
    input=query,
).data[0].embedding

results = collection.query(
    query_embeddings=[query_vector],
    n_results=3,
    where={"service": "order-api"},
    include=["documents", "metadatas", "distances"],
)

for doc, metadata, distance in zip(
    results["documents"][0],
    results["metadatas"][0],
    results["distances"][0],
):
    print("distance:", distance)
    print("metadata:", metadata)
    print("document:", doc)
    print("-" * 60)
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>import os</code> | 导入 Python 模块，后面的代码会使用这个模块提供的功能。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 3 行 | <code>import chromadb</code> | 导入 Python 模块，后面的代码会使用这个模块提供的功能。 |
| 第 4 行 | <code>from dotenv import load_dotenv</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 5 行 | <code>from openai import OpenAI</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 6 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 7 行 | <code>load_dotenv()</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 8 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 9 行 | <code>openai_client = OpenAI()</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 10 行 | <code>embedding_model = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 11 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 12 行 | <code>chroma_client = chromadb.PersistentClient(path="./chroma_db")</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 13 行 | <code>collection = chroma_client.get_or_create_collection(name="aiops_incidents")</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 14 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 15 行 | <code>query = "订单接口发布后错误率升高，并伴随数据库连接超时。"</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 16 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 17 行 | <code>query_vector = openai_client.embeddings.create(</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 18 行 | <code>    model=embedding_model,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 19 行 | <code>    input=query,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 20 行 | <code>).data[0].embedding</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 21 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 22 行 | <code>results = collection.query(</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 23 行 | <code>    query_embeddings=[query_vector],</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 24 行 | <code>    n_results=3,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 25 行 | <code>    where={"service": "order-api"},</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 26 行 | <code>    include=["documents", "metadatas", "distances"],</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 27 行 | <code>)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 28 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 29 行 | <code>for doc, metadata, distance in zip(</code> | 循环处理一组数据，常用于逐条处理告警、日志或指标样本。 |
| 第 30 行 | <code>    results["documents"][0],</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 31 行 | <code>    results["metadatas"][0],</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 32 行 | <code>    results["distances"][0],</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 33 行 | <code>):</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 34 行 | <code>    print("distance:", distance)</code> | 打印输出，用来在实验中确认变量、结果或调试信息。 |
| 第 35 行 | <code>    print("metadata:", metadata)</code> | 打印输出，用来在实验中确认变量、结果或调试信息。 |
| 第 36 行 | <code>    print("document:", doc)</code> | 打印输出，用来在实验中确认变量、结果或调试信息。 |
| 第 37 行 | <code>    print("-" * 60)</code> | 打印输出，用来在实验中确认变量、结果或调试信息。 |


运行：

```bash
python index_chroma.py
python search_chroma.py
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>python index_chroma.py</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 |
| 第 2 行 | <code>python search_chroma.py</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 |


## Milvus Lite 快速实验

Milvus Lite 适合用本地文件快速学习 Milvus API。生产可以迁移到 Docker / Kubernetes / managed Milvus，客户端概念基本一致。

安装：

```bash
pip install -U pymilvus openai python-dotenv
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>pip install -U pymilvus openai python-dotenv</code> | 管理 Python 依赖包，通常用于安装实验需要的库。 |


`milvus_lite_demo.py`：

```python
import os

from dotenv import load_dotenv
from openai import OpenAI
from pymilvus import MilvusClient

load_dotenv()

openai_client = OpenAI()
embedding_model = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")

client = MilvusClient("milvus_aiops.db")
collection_name = "aiops_incidents"

if client.has_collection(collection_name):
    client.drop_collection(collection_name)

client.create_collection(
    collection_name=collection_name,
    dimension=1536,
)

texts = [
    "发布后 order-api 5xx 升高，原因是数据库连接池配置错误。",
    "payment-api 延迟升高，原因是第三方支付渠道超时。",
    "Redis 内存打满，原因是告警去重 key 未设置过期时间。",
]

embedding_response = openai_client.embeddings.create(
    model=embedding_model,
    input=texts,
)
vectors = [item.embedding for item in embedding_response.data]

services = ["order-api", "payment-api", "redis"]
data = [
    {
        "id": index,
        "vector": vectors[index],
        "text": texts[index],
        "service": services[index],
    }
    for index in range(len(texts))
]

client.insert(collection_name=collection_name, data=data)

query = "订单服务发布后错误率升高，还出现数据库连接超时。"
query_vector = openai_client.embeddings.create(
    model=embedding_model,
    input=query,
).data[0].embedding

results = client.search(
    collection_name=collection_name,
    data=[query_vector],
    filter="service == 'order-api'",
    limit=2,
    output_fields=["text", "service"],
)

for hit in results[0]:
    print(hit["distance"], hit["entity"])
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>import os</code> | 导入 Python 模块，后面的代码会使用这个模块提供的功能。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 3 行 | <code>from dotenv import load_dotenv</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 4 行 | <code>from openai import OpenAI</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 5 行 | <code>from pymilvus import MilvusClient</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 6 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 7 行 | <code>load_dotenv()</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 8 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 9 行 | <code>openai_client = OpenAI()</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 10 行 | <code>embedding_model = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 11 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 12 行 | <code>client = MilvusClient("milvus_aiops.db")</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 13 行 | <code>collection_name = "aiops_incidents"</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 14 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 15 行 | <code>if client.has_collection(collection_name):</code> | 条件判断，只有条件成立时才执行下面缩进的代码。 |
| 第 16 行 | <code>    client.drop_collection(collection_name)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 17 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 18 行 | <code>client.create_collection(</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 19 行 | <code>    collection_name=collection_name,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 20 行 | <code>    dimension=1536,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 21 行 | <code>)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 22 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 23 行 | <code>texts = [</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 24 行 | <code>    "发布后 order-api 5xx 升高，原因是数据库连接池配置错误。",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 25 行 | <code>    "payment-api 延迟升高，原因是第三方支付渠道超时。",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 26 行 | <code>    "Redis 内存打满，原因是告警去重 key 未设置过期时间。",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 27 行 | <code>]</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 28 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 29 行 | <code>embedding_response = openai_client.embeddings.create(</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 30 行 | <code>    model=embedding_model,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 31 行 | <code>    input=texts,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 32 行 | <code>)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 33 行 | <code>vectors = [item.embedding for item in embedding_response.data]</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 34 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 35 行 | <code>services = ["order-api", "payment-api", "redis"]</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 36 行 | <code>data = [</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 37 行 | <code>    {</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 38 行 | <code>        "id": index,</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 39 行 | <code>        "vector": vectors[index],</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 40 行 | <code>        "text": texts[index],</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 41 行 | <code>        "service": services[index],</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 42 行 | <code>    }</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 43 行 | <code>    for index in range(len(texts))</code> | 循环处理一组数据，常用于逐条处理告警、日志或指标样本。 |
| 第 44 行 | <code>]</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 45 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 46 行 | <code>client.insert(collection_name=collection_name, data=data)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 47 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 48 行 | <code>query = "订单服务发布后错误率升高，还出现数据库连接超时。"</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 49 行 | <code>query_vector = openai_client.embeddings.create(</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 50 行 | <code>    model=embedding_model,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 51 行 | <code>    input=query,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 52 行 | <code>).data[0].embedding</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 53 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 54 行 | <code>results = client.search(</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 55 行 | <code>    collection_name=collection_name,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 56 行 | <code>    data=[query_vector],</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 57 行 | <code>    filter="service == 'order-api'",</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 58 行 | <code>    limit=2,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 59 行 | <code>    output_fields=["text", "service"],</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 60 行 | <code>)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 61 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 62 行 | <code>for hit in results[0]:</code> | 循环处理一组数据，常用于逐条处理告警、日志或指标样本。 |
| 第 63 行 | <code>    print(hit["distance"], hit["entity"])</code> | 打印输出，用来在实验中确认变量、结果或调试信息。 |


注意：

- `dimension=1536` 对应 `text-embedding-3-small` 默认维度。
- 换 embedding 模型时要确认维度。
- Milvus Quickstart 中默认 metric type 是 cosine。
- 过滤字段在大数据量下也要考虑索引。

## Chroma、Milvus、Qdrant 怎么选

| 工具 | 适合 | 特点 |
|---|---|---|
| Chroma | 本地原型、学习、轻量 RAG | 简单、上手快、Python 友好 |
| Milvus | 大规模向量检索、生产部署 | schema、索引、部署形态完整 |
| Qdrant | 向量 + payload filter、hybrid search、服务化部署 | payload、过滤、hybrid 查询能力清晰 |
| OpenAI vector stores / File Search | 快速托管知识库 | 少维护底层检索，自定义程度较低 |

选型问题：

- 数据量多大？
- 是否需要私有化？
- 是否需要多租户和权限？
- 是否需要 hybrid search？
- 是否需要严格 schema？
- 是否已有 Kubernetes 运维能力？
- 是否要托管服务降低运维？
- 是否能接受外部平台保存文件和向量？

学习时别先纠结最终选型。先把概念跑通。

## AIOps 检索设计

### 相似事故检索

输入：

```text
新告警摘要 + 指标变化 + 最近变更
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>新告警摘要 + 指标变化 + 最近变更</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


检索：

```text
doc_type = incident
service = order-api
top-k = 5
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>doc_type = incident</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>service = order-api</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>top-k = 5</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


输出：

```text
历史事故 ID、相似度、服务、根因、处置动作、来源链接
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>历史事故 ID、相似度、服务、根因、处置动作、来源链接</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


### Runbook 检索

输入：

```text
alertname + service + symptom
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>alertname + service + symptom</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


过滤：

```text
doc_type = runbook
service = order-api
visibility in allowed_groups
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>doc_type = runbook</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>service = order-api</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>visibility in allowed_groups</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


输出：

```text
章节、检查步骤、安全动作、需要审批动作
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>章节、检查步骤、安全动作、需要审批动作</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


### 告警降噪

向量库可以辅助发现相似告警描述：

```text
HighErrorRate order-api
5xx increased after deploy
database timeout errors
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>HighErrorRate order-api</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>5xx increased after deploy</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>database timeout errors</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


但告警去重的最终逻辑不能只靠向量相似度，还要结合：

- labels。
- fingerprint。
- 时间窗口。
- 拓扑依赖。
- 服务名。
- 实例名。

## 评估向量检索

准备测试集：

```json
[
  {
    "query": "订单服务发布后错误率升高，数据库连接超时",
    "expected_ids": ["inc-001"],
    "filter": {"service": "order-api"}
  }
]
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>[</code> | 数组开始，表示下面会列出多个同类值或对象。 |
| 第 2 行 | <code>  {</code> | 对象开始，表示下面是一组键值对配置。 |
| 第 3 行 | <code>    "query": "订单服务发布后错误率升高，数据库连接超时",</code> | 设置 `query` 字段，值是 `"订单服务发布后错误率升高，数据库连接超时"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 4 行 | <code>    "expected_ids": ["inc-001"],</code> | 设置 `expected_ids` 字段，值是 `["inc-001"]`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 5 行 | <code>    "filter": {"service": "order-api"}</code> | 设置 `filter` 字段，值是 `{"service": "order-api"}`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 6 行 | <code>  }</code> | 对象结束，表示这一组键值对配置到这里结束。 |
| 第 7 行 | <code>]</code> | 数组结束，表示同类值或对象列表到这里结束。 |


指标：

| 指标 | 含义 |
|---|---|
| recall@k | 正确结果是否在前 k 个里 |
| precision@k | 前 k 个结果有多少相关 |
| MRR | 第一个正确结果排第几 |
| p95 latency | 查询延迟 |
| index build time | 索引构建耗时 |
| storage size | 存储成本 |

不要只看“肉眼感觉不错”。至少要有一组固定问题，每次改 chunk、模型、索引、filter 后都跑一遍。

## 运维和成本

向量数据库上线后要监控：

- collection 数量。
- record 数量。
- embedding 模型和维度。
- 索引状态。
- 查询 QPS。
- p50 / p95 / p99 延迟。
- top-k 分布。
- 空结果比例。
- filter 使用情况。
- 存储大小。
- 入库失败数量。
- 删除失败数量。

成本来源：

- embedding API 调用。
- 向量存储。
- 索引内存。
- 查询计算。
- 备份。
- 托管服务费用。

降低成本：

- 文档不变就不重复 embedding。
- 对 chunk 做 hash。
- 使用稳定 ID 和 upsert。
- 定期清理过期数据。
- 对查询结果做短期缓存。
- 只保存必要 metadata。
- 不把原始长日志全量入库。

## 典型故障排查表

| 现象 | 常见原因 | 排查方式 |
|---|---|---|
| dimension mismatch | collection 维度和 embedding 模型不一致 | 检查模型和 collection dimension |
| 检索结果不相关 | 文本太短、chunk 错、缺过滤 | 打印 top-k 和 metadata |
| 结果来自错误服务 | 没有 service filter | 增加 metadata filter |
| 重复结果很多 | 重复入库 | 使用稳定 ID 和 upsert |
| 旧文档仍被检索 | 删除/更新没同步 | 按 source 删除旧 chunk |
| 查询很慢 | 向量索引或 payload index 不合适 | 检查索引和过滤字段 |
| 内存过高 | 索引参数或数据量过大 | 调整索引、分片、量化 |
| 空结果过多 | query 太短或过滤太严 | 放宽 filter，检查 embedding |
| 权限泄露 | 检索前没按权限过滤 | 加 visibility / group filter |
| 成本高 | 重复 embedding 或 top-k 太大 | 缓存、去重、限制 top-k |

## 常用 API 字典

### OpenAI embeddings.create

```python
client.embeddings.create(model="text-embedding-3-small", input=texts)
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>client.embeddings.create(model="text-embedding-3-small", input=texts)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |


生成文本 embedding。

### Chroma PersistentClient

```python
chromadb.PersistentClient(path="./chroma_db")
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>chromadb.PersistentClient(path="./chroma_db")</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |


创建本地持久化客户端。

### Chroma collection.upsert

```python
collection.upsert(ids=ids, documents=docs, metadatas=metadatas, embeddings=embeddings)
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>collection.upsert(ids=ids, documents=docs, metadatas=metadatas, embeddings=embeddings)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |


写入或更新记录。

### Chroma collection.query

```python
collection.query(query_embeddings=[query_vector], n_results=3, where={"service": "order-api"})
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>collection.query(query_embeddings=[query_vector], n_results=3, where={"service": "order-api"})</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |


向量检索并按 metadata 过滤。

### MilvusClient

```python
client = MilvusClient("milvus_aiops.db")
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>client = MilvusClient("milvus_aiops.db")</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |


创建 Milvus Lite 本地客户端。

### create_collection

```python
client.create_collection(collection_name="aiops_incidents", dimension=1536)
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>client.create_collection(collection_name="aiops_incidents", dimension=1536)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |


创建 collection。

### insert

```python
client.insert(collection_name="aiops_incidents", data=data)
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>client.insert(collection_name="aiops_incidents", data=data)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |


插入数据。

### search

```python
client.search(collection_name="aiops_incidents", data=[query_vector], limit=3)
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>client.search(collection_name="aiops_incidents", data=[query_vector], limit=3)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |


向量搜索。

### filter

```python
filter="service == 'order-api'"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>filter="service == 'order-api'"</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |


Milvus 搜索中的标量过滤表达式。

## 命令速查

### 安装 Chroma 实验依赖

```bash
pip install chromadb openai python-dotenv
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>pip install chromadb openai python-dotenv</code> | 管理 Python 依赖包，通常用于安装实验需要的库。 |


### 安装 Milvus Lite 实验依赖

```bash
pip install -U pymilvus openai python-dotenv
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>pip install -U pymilvus openai python-dotenv</code> | 管理 Python 依赖包，通常用于安装实验需要的库。 |


### 设置 API key

```bash
export OPENAI_API_KEY="你的 key"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>export OPENAI_API_KEY="你的 key"</code> | 设置 shell 环境变量，常用于配置 API Key、端口或运行参数。 |


PowerShell：

```powershell
$env:OPENAI_API_KEY="你的 key"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>$env:OPENAI_API_KEY="你的 key"</code> | 执行 `$env:openai_api_key="你的` 相关命令，后面的参数决定它具体操作什么对象。 其中 `$` 开头的是 PowerShell 变量，用来保存临时值或配置。 |


### 运行 Chroma 入库

```bash
python index_chroma.py
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>python index_chroma.py</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 |


### 运行 Chroma 检索

```bash
python search_chroma.py
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>python search_chroma.py</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 |


### 运行 Milvus Lite demo

```bash
python milvus_lite_demo.py
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>python milvus_lite_demo.py</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 |


### 删除本地 Chroma 数据

```bash
rm -rf chroma_db
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>rm -rf chroma_db</code> | 执行 `rm` 相关命令，后面的参数决定它具体操作什么对象。 |


PowerShell：

```powershell
Remove-Item -Recurse -Force .\chroma_db
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Remove-Item -Recurse -Force .\chroma_db</code> | PowerShell 删除文件或目录，执行前要确认路径正确。 |


### 删除 Milvus Lite 文件

```bash
rm -f milvus_aiops.db
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>rm -f milvus_aiops.db</code> | 执行 `rm` 相关命令，后面的参数决定它具体操作什么对象。 |


PowerShell：

```powershell
Remove-Item -Force .\milvus_aiops.db
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Remove-Item -Force .\milvus_aiops.db</code> | PowerShell 删除文件或目录，执行前要确认路径正确。 |


## 面试怎么讲

向量数据库用于存储和检索 embedding 向量。它把文本、图片或其他对象通过 embedding 模型转换成固定维度向量，再用 cosine、dot product 或 L2 等距离指标做 top-k 相似度搜索。AIOps 中我会把 runbook、历史事故、服务文档和告警摘要切成 chunk，保存向量、原文和 metadata，用向量检索找相似资料，再交给 RAG 或 LLM 生成带来源的回答。

设计时我会重点关注向量维度一致、schema、metadata 过滤、向量索引、payload / scalar index、稳定 ID、更新删除、权限过滤、评估和成本。向量数据库不是 MySQL 的替代品，它更像语义索引层；结构化事实仍然应该进 MySQL，短期状态进 Redis，事件流进 Kafka。

## 学习检查清单

- [ ] 我能解释 embedding 和向量数据库的关系。
- [ ] 我能说明向量维度为什么必须一致。
- [ ] 我能区分 collection、record/entity/point、vector、metadata/payload。
- [ ] 我能解释 cosine、dot product、L2 的基本区别。
- [ ] 我能说明 top-k 的作用和取值影响。
- [ ] 我能设计 AIOps incident 的 metadata 字段。
- [ ] 我能用 Chroma 写入和检索相似事故。
- [ ] 我能用 Milvus Lite 创建 collection、插入和搜索。
- [ ] 我能解释 metadata filter 为什么重要。
- [ ] 我能说明 hybrid search 的价值。
- [ ] 我能设计文档更新和删除策略。
- [ ] 我能说明向量库在 RAG 中的位置。
- [ ] 我能列出向量检索的评估指标。
- [ ] 我能说明权限过滤为什么必须在检索前做。

## 面试题

1. 向量数据库解决什么问题？
2. embedding 是什么？
3. 为什么同一个 collection 里向量维度必须一致？
4. 向量数据库和 MySQL 有什么区别？
5. collection、entity、point、metadata、payload 分别是什么？
6. cosine similarity、dot product、L2 distance 有什么区别？
7. top-k 如何影响召回、成本和答案质量？
8. 为什么 AIOps 检索必须保存 service、source、section？
9. metadata filter 解决什么问题？
10. vector index 和 payload index 分别加速什么？
11. HNSW / IVF 这类索引为什么存在？
12. 近似最近邻为什么可能牺牲一点召回？
13. hybrid search 为什么适合错误码和服务名场景？
14. 文档更新后如何同步向量库？
15. 如何避免重复入库？
16. 如何做 embedding 模型迁移？
17. 如何评估相似事故检索质量？
18. 如何避免向量库权限泄露？
19. 向量数据库在 RAG 中属于哪一层？
20. Chroma、Milvus、Qdrant、OpenAI File Search 怎么选择？

## 学习证据

学完后，在 GitHub 留下这些证据：

- `incidents.jsonl`，包含至少 3 条脱敏历史事故。
- `index_chroma.py`，能生成 embedding 并写入 Chroma。
- `search_chroma.py`，能按新告警检索相似事故。
- 一个 Milvus Lite demo。
- README 解释 collection、vector、metadata、top-k、filter。
- 至少 5 个查询问题和 top-k 结果。
- 一份检索评估表，记录 expected id、actual top-k、是否命中。
- 一份设计说明：向量库和 MySQL、Redis、Kafka、RAG 的边界。
- 一份安全说明：权限过滤、敏感数据、删除和过期策略。
