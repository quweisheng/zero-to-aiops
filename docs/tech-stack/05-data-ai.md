# 05：数据与 AI 技术栈

AIOps 里的 AI 不应该从“模型名字”开始，而应该从“运维数据如何变成判断”开始。先会处理数据，再学异常检测；先会做 API，再把模型能力接到告警和 runbook 流程里。

## SQL / MySQL

### 是什么

SQL 是关系型数据库查询语言。MySQL 是常见关系型数据库，用于存储结构化业务数据、配置、事件、任务状态等。

### 原理

关系型数据库把数据存成表，表有行和列。通过索引加速查询，通过事务保证一致性，通过日志和复制支持恢复和高可用。

### 架构

```text
Client
  -> SQL parser / optimizer
  -> execution engine
  -> buffer pool
  -> storage engine: InnoDB
  -> data files / redo log / binlog
```

关键概念：

- Table：表。
- Index：索引。
- Transaction：事务。
- InnoDB：常用存储引擎。
- Binlog：复制和恢复常用日志。
- Slow query log：慢查询日志。

### 在 AIOps 中的作用

- 存储告警、事件、runbook 执行记录。
- 分析慢 SQL、连接数、锁等待。
- 从业务数据验证故障影响。
- 把发布记录、变更记录存成可查询数据。

### 配置重点

常见配置方向：

- 连接数：`max_connections`
- 缓冲池：`innodb_buffer_pool_size`
- 慢查询：`slow_query_log`、`long_query_time`
- 字符集：`utf8mb4`
- 复制：binlog 相关配置

基础 SQL：

```sql
select count(*) from alerts where status = 'firing';
select service, count(*) from alerts group by service;
select * from incidents order by started_at desc limit 10;
```

### 入门练习

设计三张表：`alerts`、`incidents`、`runbook_executions`，并写 5 条查询语句。

### 官方资料

- [MySQL Reference Manual](https://dev.mysql.com/doc/refman/8.4/en/)

## Redis

### 是什么

Redis 是内存数据存储系统，常用作缓存、计数器、队列、分布式锁和实时状态存储。

### 原理

Redis 把数据主要存放在内存中，支持字符串、哈希、列表、集合、有序集合、Stream 等结构。可通过 RDB 和 AOF 做持久化。

### 架构

```text
Client
  -> Redis command
  -> in-memory data structures
  -> persistence: RDB / AOF
  -> replication / sentinel / cluster
```

### 在 AIOps 中的作用

- 存储短期告警状态。
- 做限流和去重。
- 保存任务队列。
- 用 Stream 接收事件流。
- 分析缓存命中率、慢命令、内存使用。

### 配置重点

常见配置方向：

- `maxmemory`：最大内存。
- `maxmemory-policy`：淘汰策略。
- `appendonly`：AOF。
- `save`：RDB 快照。
- `slowlog-log-slower-than`：慢命令阈值。

常用命令：

```bash
redis-cli ping
redis-cli info memory
redis-cli slowlog get 10
redis-cli xadd alerts * service api severity critical
```

### 入门练习

用 Redis Stream 模拟告警流，写入 10 条告警，再读取并按服务统计数量。

### 官方资料

- [Redis documentation](https://redis.io/docs/latest/)
- [Redis data types](https://redis.io/docs/latest/develop/data-types/)

## Kafka

### 是什么

Kafka 是分布式事件流平台，用于高吞吐、可持久化的消息和事件处理。

### 原理

Kafka 把消息写入 topic。Topic 被分成 partition，partition 分布在 broker 上。Producer 写消息，Consumer 按 consumer group 消费。Offset 记录消费位置。

### 架构

```text
Producer
  -> topic partitions
  -> Kafka brokers
  -> consumer groups
  -> stream processing / storage / alerts
```

关键概念：

- Topic：消息主题。
- Partition：分区，提高并行度。
- Broker：Kafka 节点。
- Producer：生产者。
- Consumer group：消费者组。
- Offset：消费位置。

### 在 AIOps 中的作用

- 接收大规模日志、告警、事件。
- 做实时事件流处理。
- 解耦采集、分析和通知。
- 为告警降噪、事件关联提供数据管道。

### 配置重点

常见配置方向：

- `retention.ms`：消息保留时间。
- `num.partitions`：分区数量。
- `replication.factor`：副本数。
- `acks`：生产者确认策略。
- `group.id`：消费者组。

### 入门练习

创建 `alerts` topic，写入模拟告警，再写一个消费者读取并按 `service` 聚合。

### 官方资料

- [Kafka documentation](https://kafka.apache.org/documentation/)
- [Kafka design](https://kafka.apache.org/documentation/#design)

## pandas

### 是什么

pandas 是 Python 数据分析库，核心数据结构是 DataFrame。它非常适合处理 CSV、表格、时间序列和日志统计结果。

### 原理

pandas 把二维数据组织成 DataFrame，通过列式操作、索引、分组、聚合、窗口函数来处理数据。

### 架构

```text
CSV / JSON / SQL
  -> pandas DataFrame
  -> clean / transform / groupby / rolling
  -> charts / model features / output CSV
```

### 在 AIOps 中的作用

- 读取 Prometheus 导出的指标数据。
- 处理告警 CSV。
- 按服务、时间窗口聚合日志。
- 给异常检测模型构造特征。

### 配置重点

```python
import pandas as pd

df = pd.read_csv("metrics.csv")
df["timestamp"] = pd.to_datetime(df["timestamp"])
df = df.set_index("timestamp")
df["latency_ma"] = df["latency_p95"].rolling("5min").mean()
```

常用能力：

- `read_csv`
- `to_datetime`
- `groupby`
- `rolling`
- `resample`
- `merge`
- `fillna`

### 入门练习

准备一个 CSV：

```csv
timestamp,service,qps,error_rate,latency_p95
2026-07-01 10:00:00,api,100,0.01,120
2026-07-01 10:01:00,api,95,0.02,130
```

用 pandas 计算每 5 分钟平均错误率和最大延迟。

### 官方资料

- [pandas documentation](https://pandas.pydata.org/docs/)
- [pandas getting started](https://pandas.pydata.org/docs/getting_started/index.html)

## scikit-learn

### 是什么

scikit-learn 是 Python 机器学习库，提供分类、回归、聚类、降维、异常检测、模型评估等能力。

### 原理

scikit-learn 使用统一 API：`fit` 训练模型，`predict` 预测结果，`score` 或其他指标评估效果。异常检测算法会根据数据分布识别离群点。

### 架构

```text
raw ops data
  -> feature engineering
  -> train / fit model
  -> predict anomaly
  -> evaluate false positives / false negatives
  -> alert recommendation
```

### 在 AIOps 中的作用

- 指标异常检测。
- 日志特征聚类。
- 告警分类。
- 预测容量趋势。

### 配置重点

IsolationForest 示例：

```python
import pandas as pd
from sklearn.ensemble import IsolationForest

df = pd.read_csv("metrics.csv")
features = df[["qps", "error_rate", "latency_p95"]]

model = IsolationForest(contamination=0.05, random_state=42)
df["anomaly"] = model.fit_predict(features)

anomalies = df[df["anomaly"] == -1]
print(anomalies)
```

关键参数：

- `contamination`：预期异常比例。
- `random_state`：保证实验可复现。
- 特征缩放：不同量纲可能影响模型效果。

### 入门练习

对服务指标 CSV 做异常检测，把异常点输出成 Markdown 表格。

### 学习证据

- `projects/metric-anomaly-detector/`
- 一篇记录：固定阈值和 IsolationForest 的优缺点。

### 官方资料

- [scikit-learn outlier detection](https://scikit-learn.org/stable/modules/outlier_detection.html)
- [IsolationForest](https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.IsolationForest.html)

## FastAPI

### 是什么

FastAPI 是 Python Web API 框架，适合快速构建 HTTP API。

### 原理

FastAPI 基于 ASGI，使用 Python 类型提示自动进行请求参数校验和文档生成。运行时常配合 Uvicorn。

### 架构

```text
HTTP client
  -> Uvicorn ASGI server
  -> FastAPI routes
  -> service logic
  -> model / database / external APIs
```

### 在 AIOps 中的作用

- 暴露异常检测 API。
- 接收 Alertmanager webhook。
- 做 runbook 推荐服务。
- 给前端或自动化系统提供统一接口。

### 配置重点

最小服务：

```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "ok"}
```

运行：

```bash
uvicorn app:app --reload --port 8000
```

### 入门练习

写一个 `/analyze` 接口，接收告警 JSON，返回建议 runbook 名称。

### 官方资料

- [FastAPI documentation](https://fastapi.tiangolo.com/)

## LLM

### 是什么

LLM 是大语言模型，可以理解和生成文本。AIOps 中常用于告警摘要、日志解释、runbook 推荐、事故复盘初稿、自然语言查询。

### 原理

LLM 根据输入上下文预测输出文本。工程上通常通过 API 调用模型，并用提示词、结构化输出、工具调用和检索增强来约束结果。

### 架构

```text
alert / logs / metrics summary
  -> prompt construction
  -> LLM API
  -> structured output
  -> human review / runbook suggestion
```

### 在 AIOps 中的作用

- 把多条告警总结成一段人能快速理解的话。
- 根据错误日志推荐排查步骤。
- 把事故复盘整理成初稿。
- 根据 runbook 知识库回答值班问题。

### 配置重点

LLM 进入生产运维流程时必须注意：

- 不让模型直接执行高风险动作。
- 输出必须结构化，方便系统校验。
- 关键建议需要附证据。
- 涉及敏感日志要脱敏。
- 所有建议都要有人工确认和审计。

### 入门练习

把 5 条告警文本输入模型，让模型输出：

```json
{
  "summary": "一句话摘要",
  "possible_causes": ["原因1", "原因2"],
  "recommended_runbook": "runbook 名称",
  "risk_level": "low|medium|high"
}
```

### 官方资料

- [OpenAI API documentation](https://platform.openai.com/docs/)

## RAG

### 是什么

RAG 是 Retrieval-Augmented Generation，检索增强生成。它先从知识库检索相关资料，再让模型基于这些资料回答。

### 原理

文档被切分成 chunks，转换成向量，存入向量数据库。提问时把问题也转成向量，检索相似 chunks，作为上下文给 LLM。

### 架构

```text
runbooks / docs / incident reviews
  -> chunking
  -> embeddings
  -> vector database
  -> retrieve relevant chunks
  -> LLM answer with citations
```

### 在 AIOps 中的作用

- 运维知识库问答。
- 告警自动匹配 runbook。
- 值班助手。
- 事故复盘查询。

### 配置重点

- 文档切分大小。
- embedding 模型。
- 向量数据库。
- top_k 检索数量。
- 回答必须引用来源。
- 低置信度时拒绝回答或要求人工确认。

### 入门练习

把 3 篇 runbook 做成 RAG 知识库，输入一条告警，让系统找出最相关 runbook。

### 官方资料

- [OpenAI embeddings guide](https://platform.openai.com/docs/guides/embeddings)
- [LangChain RAG tutorials](https://python.langchain.com/docs/tutorials/rag/)

## 向量数据库

### 是什么

向量数据库用于存储和检索向量。向量可以表示文本、图片、日志模板、告警描述等对象的语义特征。

### 原理

系统把文本转换为高维向量，查询时计算向量相似度，返回最接近的结果。常见索引包括 HNSW、IVF 等。

### 架构

```text
documents
  -> embedding vectors
  -> vector index
  -> similarity search
  -> retrieved context
```

### 在 AIOps 中的作用

- 根据告警描述检索相似历史事故。
- 根据日志错误检索 runbook。
- 给 RAG 提供检索能力。

### 配置重点

- collection / table 设计。
- metadata 字段，例如 service、env、source、updated_at。
- 向量维度要和 embedding 模型一致。
- 检索结果需要过滤环境和服务，避免错误建议。

### 入门练习

先用轻量方案，例如 Chroma 或 Milvus Lite，存 10 条 runbook 片段并做相似检索。

### 官方资料

- [Milvus documentation](https://milvus.io/docs)
- [Chroma documentation](https://docs.trychroma.com/)
