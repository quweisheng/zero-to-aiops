# Elasticsearch

> 目标：理解 Elasticsearch 的 index、document、shard、node、ingest pipeline，能用它做日志检索和聚合分析。

## 官方资料

- [Elasticsearch documentation](https://www.elastic.co/docs/)
- [Clusters, nodes, and shards](https://www.elastic.co/docs/deploy-manage/distributed-architecture/clusters-nodes-shards)
- [Node roles](https://www.elastic.co/docs/deploy-manage/distributed-architecture/clusters-nodes-shards/node-roles)
- [Ingest pipelines](https://www.elastic.co/docs/manage-data/ingest/transform-enrich/ingest-pipelines)
- [Index lifecycle management](https://www.elastic.co/docs/manage-data/lifecycle/index-lifecycle-management)

说明：本文是基于 Elastic 官方文档整理的原创中文教程，不复制官方全文。

## 为什么要学

运维排障离不开日志检索。Elasticsearch 能把大量 JSON 文档写入索引，并支持全文搜索、字段过滤和聚合分析。很多公司仍然使用 ELK/Elastic Stack 或 OpenSearch 做日志平台、安全分析和故障检索。

对 AIOps 来说，Elasticsearch 可以作为日志证据库和检索后端，为故障复盘、异常解释、RAG 检索和日志模式分析提供数据。

## 是什么

Elasticsearch 是分布式搜索和分析引擎，常用于日志检索、全文搜索、聚合分析和安全分析。

## 它解决什么问题

- 快速检索大量日志和 JSON 文档。
- 按服务、级别、时间、字段做过滤。
- 用聚合统计错误数量、Top 服务、Top 异常。
- 通过 mapping 管理字段类型。
- 用 ingest pipeline 在写入前解析和 enrich 数据。
- 用 ILM 管理日志索引生命周期和保留期。

## 核心原理

数据以 document 形式写入 index。Index 被拆成 shard，shard 分布在不同 node 上。每个 shard 底层是 Lucene 索引，通过倒排索引实现高效搜索。

```text
Document
  -> Index
  -> Primary shards / Replica shards
  -> Nodes
  -> Cluster
  -> Search / Aggregation
```

## 架构概念

- Cluster：集群。
- Node：节点。
- Index：索引，类似一类文档集合。
- Document：文档，JSON 对象。
- Shard：分片。
- Replica：副本。
- Mapping：字段类型定义。
- Ingest pipeline：写入前处理流程。
- ILM：索引生命周期管理。

## 节点角色

常见角色：

- master-eligible：参与主节点选举。
- data：存储数据。
- ingest：执行 ingest pipeline。
- coordinating：协调查询请求。

小实验可以单节点；生产中角色要规划。

## 写入文档

```bash
curl -X POST "http://localhost:9200/logs-demo/_doc" \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": "2026-07-01T10:00:00Z",
    "service": "order-api",
    "level": "ERROR",
    "message": "database connection timeout"
  }'
```

## 查询

查全部：

```bash
curl "http://localhost:9200/logs-demo/_search"
```

按字段查询：

```json
{
  "query": {
    "match": {
      "message": "timeout"
    }
  }
}
```

按服务和级别过滤：

```json
{
  "query": {
    "bool": {
      "filter": [
        { "term": { "service": "order-api" } },
        { "term": { "level": "ERROR" } }
      ]
    }
  }
}
```

聚合：

```json
{
  "size": 0,
  "aggs": {
    "by_service": {
      "terms": {
        "field": "service.keyword"
      }
    }
  }
}
```

## Ingest Pipeline

Ingest pipeline 在文档写入前处理数据，例如解析字段、增加字段、重命名字段。

```json
{
  "processors": [
    {
      "set": {
        "field": "env",
        "value": "dev"
      }
    }
  ]
}
```

## ILM

日志是典型时间序列数据，需要生命周期管理：

- rollover：索引太大或太久时切新索引。
- warm/cold：老数据降级存储。
- delete：超过保留期删除。

## 在 AIOps 中的作用

- 快速检索错误日志。
- 按服务、级别、时间聚合错误。
- 做日志字段分析。
- 为事故复盘提供证据。
- 与 Kibana/Elastic 生态做可视化和告警。

## 入门实验

1. 启动单节点 Elasticsearch。
2. 写入 10 条 demo 日志。
3. 查询 ERROR 日志。
4. 按 service 聚合。
5. 写一篇记录：index、document、shard 的关系。

## 排障清单

### 集群 yellow

通常是副本无法分配。单节点环境有 replica 时常见。

### 查询不到字段

- mapping 是否正确。
- text 字段和 keyword 字段是否混用。
- 时间范围是否正确。

### 写入太慢

- ingest pipeline 是否过重。
- shard 数是否不合理。
- 磁盘和 JVM heap 是否不足。

## 学习检查清单

- [ ] 我能解释 index、document、shard、replica、node、cluster。
- [ ] 我能写入一条 demo JSON 文档。
- [ ] 我能写一个基础 `_search` 查询。
- [ ] 我能用 bool/filter 查询服务和日志级别。
- [ ] 我能用 terms aggregation 做按服务聚合。
- [ ] 我能解释 text 和 keyword 字段的区别。
- [ ] 我能说明 ingest pipeline 和 ILM 的作用。
- [ ] 我能比较 Elasticsearch 和 Loki 的适用场景。

## 面试题

1. Elasticsearch 适合解决什么问题？
2. index、document、shard、replica 分别是什么？
3. 为什么 shard 数不能随便设置很多？
4. text 和 keyword 字段有什么区别？
5. 倒排索引为什么适合搜索？
6. ingest pipeline 在日志写入前能做什么？
7. ILM 为什么对日志平台重要？
8. 集群 yellow 通常代表什么？
9. Elasticsearch 和 Loki 在日志场景中如何选择？
10. Elasticsearch 如何支持 AIOps 故障复盘和 RAG 检索？

## 学习证据

- 一份 demo 日志 JSON。
- 一组查询 DSL。
- 一篇记录：Elasticsearch 和 Loki 的差异。
