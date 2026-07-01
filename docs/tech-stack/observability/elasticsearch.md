# Elasticsearch

> 目标：理解 Elasticsearch 的 index、document、shard、node、ingest pipeline，能用它做日志检索和聚合分析。

## 官方资料

- [Elasticsearch documentation](https://www.elastic.co/docs/)
- [Clusters, nodes, and shards](https://www.elastic.co/docs/deploy-manage/distributed-architecture/clusters-nodes-shards)
- [Node roles](https://www.elastic.co/docs/deploy-manage/distributed-architecture/clusters-nodes-shards/node-roles)
- [Ingest pipelines](https://www.elastic.co/docs/manage-data/ingest/transform-enrich/ingest-pipelines)
- [Index lifecycle management](https://www.elastic.co/docs/manage-data/lifecycle/index-lifecycle-management)

说明：本文是基于 Elastic 官方文档整理的原创中文教程，不复制官方全文。

## 是什么

Elasticsearch 是分布式搜索和分析引擎，常用于日志检索、全文搜索、聚合分析和安全分析。

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

## 学习证据

- 一份 demo 日志 JSON。
- 一组查询 DSL。
- 一篇记录：Elasticsearch 和 Loki 的差异。
