# Elasticsearch

> 目标：能理解 Elasticsearch 为什么适合搜索和日志分析，能讲清 cluster、node、index、document、field、mapping、analyzer、inverted index、shard、replica、data stream、index template、Query DSL、aggregation、ingest pipeline、ILM 和 cluster health，能写入/查询文档，并能排查 yellow/red、mapping 错、查不到字段、写入慢、查询慢。

## 官方资料

- [Elastic Docs](https://www.elastic.co/docs/)
- [Elasticsearch Reference](https://www.elastic.co/docs/reference/elasticsearch)
- [Index settings](https://www.elastic.co/docs/reference/elasticsearch/index-settings/index-modules)
- [Data streams](https://www.elastic.co/docs/manage-data/data-store/data-streams)
- [Index templates](https://www.elastic.co/docs/manage-data/data-store/templates)
- [Get cluster health API](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-cluster-health)
- [CAT health API](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-cat-health)
- [CAT indices API](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-cat-indices)
- [CAT shards API](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-cat-shards)
- [Search API](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-search)
- [Terms aggregation](https://www.elastic.co/docs/reference/aggregations/search-aggregations-bucket-terms-aggregation)
- [Elasticsearch Python client](https://elasticsearch-py.readthedocs.io/)

说明：本文基于 Elastic 官方文档和 API 文档整理，是原创中文教程，不复制官方全文。Elasticsearch 版本、授权和部署形态变化较快，生产环境请以当前集群的 `GET /` 版本和对应官方文档为准。

## 场景开场

你把应用日志发进 Elasticsearch，想查：

```text
最近 15 分钟 checkout-api 的 5xx 日志
按 service 聚合错误数
按 trace_id 找某次请求
按 message 搜 timeout
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>最近 15 分钟 checkout-api 的 5xx 日志</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>按 service 聚合错误数</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>按 trace_id 找某次请求</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>按 message 搜 timeout</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


结果遇到一堆问题：

- 字段明明写进去了，为什么查询不到？
- `message` 能 match，但 `service` 该用 match 还是 term？
- 为什么 `user_id` 聚合很慢？
- 为什么集群 health 是 yellow？
- 为什么索引越来越多、磁盘越来越满？
- 为什么写入突然变慢？
- 为什么日志时间字段没识别成 date？
- 为什么同一个字段有时候是 text，有时候是 object，导致 mapping conflict？

Elasticsearch 的学习重点不是“会 curl 一条搜索 API”，而是理解文档写入后如何被 mapping 解析、如何被 analyzer 分词、如何进 shard、如何建立倒排索引、查询时 Query DSL 如何命中、聚合如何消耗资源、时间序列日志如何用 data stream / template / ILM 管理生命周期。

## 一句话人话版

Elasticsearch 是分布式搜索和分析引擎：你把 JSON 文档写入 index，它根据 mapping 和 analyzer 建立索引，把数据分布到 shards 和 replicas 上；查询时用 Query DSL 和 aggregations 做全文搜索、精确过滤和统计分析；日志场景通常配合 data streams、index templates、ingest pipelines 和 ILM 管理持续写入与生命周期。

## 学习边界

入门阶段先抓这条链：

```text
JSON document
  -> index / data stream
  -> index template
  -> mappings / settings
  -> ingest pipeline
  -> primary shard
  -> inverted index / doc values
  -> replica shards
  -> Query DSL search
  -> aggregations
  -> ILM rollover / retention
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>JSON document</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; index / data stream</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; index template</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>  -&gt; mappings / settings</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>  -&gt; ingest pipeline</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 6 行 | <code>  -&gt; primary shard</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 7 行 | <code>  -&gt; inverted index / doc values</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 8 行 | <code>  -&gt; replica shards</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 9 行 | <code>  -&gt; Query DSL search</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 10 行 | <code>  -&gt; aggregations</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 11 行 | <code>  -&gt; ILM rollover / retention</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


必须掌握：

- cluster、node、index、document、field。
- shard、primary shard、replica shard。
- mapping、dynamic mapping、mapping conflict。
- text 和 keyword 的区别。
- analyzer、token、inverted index。
- Query DSL：match、term、range、bool、filter。
- aggregations：terms、date_histogram。
- data stream 和 backing indices。
- index template 和 component template。
- ingest pipeline 和 processors。
- ILM rollover、hot/warm/cold/delete 思路。
- cluster health green/yellow/red。
- `_cat/indices`、`_cat/shards`、`_cluster/health`。

暂时可以先不深挖：

- Lucene segment merge 内部细节。
- scoring 的 BM25 公式。
- 向量检索和 hybrid search。
- cross-cluster replication/search。
- snapshot repository 生产细节。
- shard allocation awareness 高级策略。
- query cache/request cache 深度调优。
- Elastic Security、APM、Fleet 全套生态。

## 官方知识地图

Elasticsearch 官方资料可按这些模块读：

```text
Core concepts
  -> Cluster
  -> Node
  -> Index
  -> Document
  -> Field
  -> Shards and replicas

Data modeling
  -> Mappings
  -> Field types
  -> Dynamic mapping
  -> Runtime fields
  -> Index settings
  -> Analyzers

Data management
  -> Data streams
  -> Index templates
  -> Component templates
  -> Aliases
  -> ILM
  -> Snapshot and restore

Ingest
  -> Document APIs
  -> Bulk API
  -> Ingest pipelines
  -> Processors

Search
  -> Search API
  -> Query DSL
  -> Full-text queries
  -> Term-level queries
  -> Compound queries
  -> Sort
  -> Pagination
  -> Highlighting

Aggregations
  -> Bucket aggregations
  -> Metrics aggregations
  -> Pipeline aggregations
  -> Terms aggregation
  -> Date histogram

Operations
  -> Cluster health
  -> CAT APIs
  -> Shard allocation
  -> Index lifecycle
  -> Monitoring
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Core concepts</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; Cluster</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; Node</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>  -&gt; Index</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>  -&gt; Document</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 6 行 | <code>  -&gt; Field</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 7 行 | <code>  -&gt; Shards and replicas</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 8 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 9 行 | <code>Data modeling</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 10 行 | <code>  -&gt; Mappings</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 11 行 | <code>  -&gt; Field types</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 12 行 | <code>  -&gt; Dynamic mapping</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 13 行 | <code>  -&gt; Runtime fields</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 14 行 | <code>  -&gt; Index settings</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 15 行 | <code>  -&gt; Analyzers</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 16 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 17 行 | <code>Data management</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 18 行 | <code>  -&gt; Data streams</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 19 行 | <code>  -&gt; Index templates</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 20 行 | <code>  -&gt; Component templates</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 21 行 | <code>  -&gt; Aliases</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 22 行 | <code>  -&gt; ILM</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 23 行 | <code>  -&gt; Snapshot and restore</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 24 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 25 行 | <code>Ingest</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 26 行 | <code>  -&gt; Document APIs</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 27 行 | <code>  -&gt; Bulk API</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 28 行 | <code>  -&gt; Ingest pipelines</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 29 行 | <code>  -&gt; Processors</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 30 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 31 行 | <code>Search</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 32 行 | <code>  -&gt; Search API</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 33 行 | <code>  -&gt; Query DSL</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 34 行 | <code>  -&gt; Full-text queries</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 35 行 | <code>  -&gt; Term-level queries</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 36 行 | <code>  -&gt; Compound queries</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 37 行 | <code>  -&gt; Sort</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 38 行 | <code>  -&gt; Pagination</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 39 行 | <code>  -&gt; Highlighting</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 40 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 41 行 | <code>Aggregations</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 42 行 | <code>  -&gt; Bucket aggregations</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 43 行 | <code>  -&gt; Metrics aggregations</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 44 行 | <code>  -&gt; Pipeline aggregations</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 45 行 | <code>  -&gt; Terms aggregation</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 46 行 | <code>  -&gt; Date histogram</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 47 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 48 行 | <code>Operations</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 49 行 | <code>  -&gt; Cluster health</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 50 行 | <code>  -&gt; CAT APIs</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 51 行 | <code>  -&gt; Shard allocation</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 52 行 | <code>  -&gt; Index lifecycle</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 53 行 | <code>  -&gt; Monitoring</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


学习顺序：

```text
先懂 document/index/shard
  -> 再懂 mapping 和 analyzer
  -> 再懂 query DSL
  -> 再懂 aggregation
  -> 再懂 data stream/template/ILM
  -> 最后学集群健康和性能排障
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>先懂 document/index/shard</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; 再懂 mapping 和 analyzer</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; 再懂 query DSL</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>  -&gt; 再懂 aggregation</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>  -&gt; 再懂 data stream/template/ILM</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 6 行 | <code>  -&gt; 最后学集群健康和性能排障</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


## Elasticsearch 在 AIOps 链路中的位置

Elasticsearch 常用于日志搜索、事件检索、告警上下文查询和历史分析。

```text
应用/系统日志
  -> Logstash / Beats / Elastic Agent / OTel Collector / 自定义写入
  -> Elasticsearch data streams / indices
  -> Kibana / API / AIOps 分析服务
  -> 告警上下文、根因分析、异常搜索
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>应用/系统日志</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; Logstash / Beats / Elastic Agent / OTel Collector / 自定义写入</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; Elasticsearch data streams / indices</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>  -&gt; Kibana / API / AIOps 分析服务</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>  -&gt; 告警上下文、根因分析、异常搜索</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


它给 AIOps 提供：

| 能力 | 价值 |
|---|---|
| 全文检索 | 搜 exception、timeout、error message |
| 精确过滤 | 按 service、env、trace_id、host 查 |
| 时间范围查询 | 查故障窗口 |
| 聚合 | 按 service/status/error_type 统计 |
| ingest pipeline | 写入时解析、规范化、补字段 |
| ILM/data stream | 管理持续增长日志 |
| cluster APIs | 监控集群健康和 shard 状态 |

与 Loki 相比：

- Elasticsearch 更擅长复杂字段检索和全文搜索。
- Loki 更强调低成本标签化日志和 Grafana/Prometheus 风格查询。

选型不是谁替代谁，而是看查询模式、成本、团队经验和生态。

## Elasticsearch 是什么

Elasticsearch 是基于 Apache Lucene 的分布式搜索和分析引擎。它通过 REST API 接收 JSON 文档，建立索引，并支持近实时搜索和聚合分析。

关键词：

| 概念 | 含义 |
|---|---|
| document | 一条 JSON 数据 |
| index | 一组相似 document 的逻辑集合 |
| field | document 里的字段 |
| mapping | 字段类型和索引方式定义 |
| shard | index 的分片 |
| replica | shard 的副本 |
| analyzer | 文本分词处理器 |
| inverted index | 从词到文档的索引结构 |

最小写入：

```bash
curl -X POST "http://localhost:9200/logs-aiops/_doc" \
  -H "Content-Type: application/json" \
  -d '{
    "@timestamp": "2026-07-02T10:00:00Z",
    "service": "checkout-api",
    "level": "error",
    "message": "payment timeout",
    "status_code": 504
  }'
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -X POST "http://localhost:9200/logs-aiops/_doc" \</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |
| 第 2 行 | <code>  -H "Content-Type: application/json" \</code> | 执行 `-h` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>  -d '{</code> | 执行 `-d` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 4 行 | <code>    "@timestamp": "2026-07-02T10:00:00Z",</code> | 执行 `"@timestamp":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 5 行 | <code>    "service": "checkout-api",</code> | 执行 `"service":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 6 行 | <code>    "level": "error",</code> | 执行 `"level":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 7 行 | <code>    "message": "payment timeout",</code> | 执行 `"message":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 8 行 | <code>    "status_code": 504</code> | 执行 `"status_code":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 9 行 | <code>  }'</code> | 执行 `}'` 相关命令，后面的参数决定它具体操作什么对象。 |


最小搜索：

```bash
curl -X GET "http://localhost:9200/logs-aiops/_search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "match": {
        "message": "payment timeout"
      }
    }
  }'
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -X GET "http://localhost:9200/logs-aiops/_search" \</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |
| 第 2 行 | <code>  -H "Content-Type: application/json" \</code> | 执行 `-h` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>  -d '{</code> | 执行 `-d` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 4 行 | <code>    "query": {</code> | 执行 `"query":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 5 行 | <code>      "match": {</code> | 执行 `"match":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 6 行 | <code>        "message": "payment timeout"</code> | 执行 `"message":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 7 行 | <code>      }</code> | 执行 `}` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 8 行 | <code>    }</code> | 执行 `}` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 9 行 | <code>  }'</code> | 执行 `}'` 相关命令，后面的参数决定它具体操作什么对象。 |


## Cluster、Node、Index、Document

### Cluster

Cluster 是一个或多个 Elasticsearch nodes 的集合。

查看：

```bash
curl -s http://localhost:9200/
curl -s http://localhost:9200/_cluster/health?pretty
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -s http://localhost:9200/</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |
| 第 2 行 | <code>curl -s http://localhost:9200/_cluster/health?pretty</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |


### Node

Node 是集群中的一个 Elasticsearch 实例。

常见节点角色：

| 角色 | 作用 |
|---|---|
| master-eligible | 参与选主，管理集群元数据 |
| data | 存储和搜索数据 |
| ingest | 执行 ingest pipeline |
| coordinating | 接收请求、分发查询、合并结果 |
| transform / ml | 特定功能节点 |

小集群可能一个节点多种角色，大集群会拆分。

### Index

Index 是 documents 的逻辑集合。

例子：

```text
logs-aiops-2026.07.02
metrics-app
alerts-history
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>logs-aiops-2026.07.02</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>metrics-app</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>alerts-history</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


Index 有：

- settings。
- mappings。
- aliases。
- shards。
- replicas。

### Document

Document 是 JSON 数据。

例子：

```json
{
  "@timestamp": "2026-07-02T10:00:00Z",
  "service": "checkout-api",
  "level": "error",
  "message": "payment timeout",
  "trace_id": "abc123"
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{</code> | 对象开始，表示下面是一组键值对配置。 |
| 第 2 行 | <code>  "@timestamp": "2026-07-02T10:00:00Z",</code> | 设置 `@timestamp` 字段，值是 `"2026-07-02T10:00:00Z"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 3 行 | <code>  "service": "checkout-api",</code> | 设置 `service` 字段，值是 `"checkout-api"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 4 行 | <code>  "level": "error",</code> | 设置 `level` 字段，值是 `"error"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 5 行 | <code>  "message": "payment timeout",</code> | 设置 `message` 字段，值是 `"payment timeout"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 6 行 | <code>  "trace_id": "abc123"</code> | 设置 `trace_id` 字段，值是 `"abc123"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 7 行 | <code>}</code> | 对象结束，表示这一组键值对配置到这里结束。 |


每个 document 有 `_index`、`_id`、`_source` 等元信息。

## Shards 和 Replicas

Index 会被拆成 shards。

```text
index logs-aiops
  -> primary shard 0
  -> primary shard 1
  -> primary shard 2
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>index logs-aiops</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; primary shard 0</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; primary shard 1</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>  -&gt; primary shard 2</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


Replica 是 primary shard 的副本。

```text
primary shard 0 on node A
replica shard 0 on node B
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>primary shard 0 on node A</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>replica shard 0 on node B</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


作用：

- 水平扩展数据和查询。
- 提高可用性。
- primary 挂了 replica 可提升。

常见误区：

- shard 不是越多越好。
- 单节点集群设置 replica > 0 会 yellow，因为 replica 无法和 primary 放同一节点。
- primary shard 数量创建后通常不能随便改，规划要慎重。

查看：

```bash
curl -s "http://localhost:9200/_cat/indices?v"
curl -s "http://localhost:9200/_cat/shards?v"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -s "http://localhost:9200/_cat/indices?v"</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |
| 第 2 行 | <code>curl -s "http://localhost:9200/_cat/shards?v"</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |


## Cluster health：green、yellow、red

查看：

```bash
curl -s "http://localhost:9200/_cluster/health?pretty"
curl -s "http://localhost:9200/_cat/health?v"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -s "http://localhost:9200/_cluster/health?pretty"</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |
| 第 2 行 | <code>curl -s "http://localhost:9200/_cat/health?v"</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |


状态：

| 状态 | 含义 |
|---|---|
| green | primary 和 replica shards 都已分配 |
| yellow | primary 都已分配，但至少有 replica 未分配 |
| red | 至少有 primary shard 未分配，部分数据不可用 |

单节点实验常见 yellow：

```text
number_of_replicas=1
只有一个 node
replica 无法分配到同一 node
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>number_of_replicas=1</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>只有一个 node</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>replica 无法分配到同一 node</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


修实验环境：

```bash
curl -X PUT "http://localhost:9200/logs-aiops/_settings" \
  -H "Content-Type: application/json" \
  -d '{
    "index": {
      "number_of_replicas": 0
    }
  }'
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -X PUT "http://localhost:9200/logs-aiops/_settings" \</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |
| 第 2 行 | <code>  -H "Content-Type: application/json" \</code> | 执行 `-h` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>  -d '{</code> | 执行 `-d` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 4 行 | <code>    "index": {</code> | 执行 `"index":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 5 行 | <code>      "number_of_replicas": 0</code> | 执行 `"number_of_replicas":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 6 行 | <code>    }</code> | 执行 `}` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 7 行 | <code>  }'</code> | 执行 `}'` 相关命令，后面的参数决定它具体操作什么对象。 |


生产环境不要为了 green 盲目设 replica 0。要先判断容量、节点、allocation、磁盘水位、故障域。

## Mapping 是什么

Mapping 定义字段类型和索引方式。

示例：

```json
{
  "mappings": {
    "properties": {
      "@timestamp": { "type": "date" },
      "service": { "type": "keyword" },
      "level": { "type": "keyword" },
      "message": { "type": "text" },
      "status_code": { "type": "integer" },
      "trace_id": { "type": "keyword" }
    }
  }
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{</code> | 对象开始，表示下面是一组键值对配置。 |
| 第 2 行 | <code>  "mappings": {</code> | 设置 `mappings` 字段，值是 `{`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 3 行 | <code>    "properties": {</code> | 设置 `properties` 字段，值是 `{`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 4 行 | <code>      "@timestamp": { "type": "date" },</code> | 设置 `@timestamp` 字段，值是 `{ "type": "date" }`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 5 行 | <code>      "service": { "type": "keyword" },</code> | 设置 `service` 字段，值是 `{ "type": "keyword" }`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 6 行 | <code>      "level": { "type": "keyword" },</code> | 设置 `level` 字段，值是 `{ "type": "keyword" }`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 7 行 | <code>      "message": { "type": "text" },</code> | 设置 `message` 字段，值是 `{ "type": "text" }`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 8 行 | <code>      "status_code": { "type": "integer" },</code> | 设置 `status_code` 字段，值是 `{ "type": "integer" }`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 9 行 | <code>      "trace_id": { "type": "keyword" }</code> | 设置 `trace_id` 字段，值是 `{ "type": "keyword" }`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 10 行 | <code>    }</code> | 对象结束，表示这一组键值对配置到这里结束。 |
| 第 11 行 | <code>  }</code> | 对象结束，表示这一组键值对配置到这里结束。 |
| 第 12 行 | <code>}</code> | 对象结束，表示这一组键值对配置到这里结束。 |


字段类型影响：

- 能否全文搜索。
- 能否精确过滤。
- 能否排序。
- 能否聚合。
- 存储和索引成本。

查看 mapping：

```bash
curl -s "http://localhost:9200/logs-aiops/_mapping?pretty"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -s "http://localhost:9200/logs-aiops/_mapping?pretty"</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |


## text 和 keyword

这是新手最重要的字段类型区别。

### text

用于全文搜索，会经过 analyzer 分词。

```json
"message": { "type": "text" }
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>"message": { "type": "text" }</code> | 设置 `message` 字段，值是 `{ "type": "text" }`；真实环境要根据自己的告警、服务或接口返回调整。 |


适合：

- 日志消息。
- 文本描述。
- 需要 match 搜索的内容。

### keyword

用于精确匹配、排序、聚合，不分词。

```json
"service": { "type": "keyword" }
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>"service": { "type": "keyword" }</code> | 设置 `service` 字段，值是 `{ "type": "keyword" }`；真实环境要根据自己的告警、服务或接口返回调整。 |


适合：

- service 名。
- level。
- env。
- trace_id。
- host。
- status 字符串。

查询差异：

```json
{
  "query": {
    "match": {
      "message": "payment timeout"
    }
  }
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{</code> | 对象开始，表示下面是一组键值对配置。 |
| 第 2 行 | <code>  "query": {</code> | 设置 `query` 字段，值是 `{`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 3 行 | <code>    "match": {</code> | 设置 `match` 字段，值是 `{`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 4 行 | <code>      "message": "payment timeout"</code> | 设置 `message` 字段，值是 `"payment timeout"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 5 行 | <code>    }</code> | 对象结束，表示这一组键值对配置到这里结束。 |
| 第 6 行 | <code>  }</code> | 对象结束，表示这一组键值对配置到这里结束。 |
| 第 7 行 | <code>}</code> | 对象结束，表示这一组键值对配置到这里结束。 |


适合 text 全文搜索。

```json
{
  "query": {
    "term": {
      "service": "checkout-api"
    }
  }
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{</code> | 对象开始，表示下面是一组键值对配置。 |
| 第 2 行 | <code>  "query": {</code> | 设置 `query` 字段，值是 `{`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 3 行 | <code>    "term": {</code> | 设置 `term` 字段，值是 `{`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 4 行 | <code>      "service": "checkout-api"</code> | 设置 `service` 字段，值是 `"checkout-api"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 5 行 | <code>    }</code> | 对象结束，表示这一组键值对配置到这里结束。 |
| 第 6 行 | <code>  }</code> | 对象结束，表示这一组键值对配置到这里结束。 |
| 第 7 行 | <code>}</code> | 对象结束，表示这一组键值对配置到这里结束。 |


适合 keyword 精确过滤。

错误示例：

```json
{
  "query": {
    "term": {
      "message": "payment timeout"
    }
  }
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{</code> | 对象开始，表示下面是一组键值对配置。 |
| 第 2 行 | <code>  "query": {</code> | 设置 `query` 字段，值是 `{`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 3 行 | <code>    "term": {</code> | 设置 `term` 字段，值是 `{`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 4 行 | <code>      "message": "payment timeout"</code> | 设置 `message` 字段，值是 `"payment timeout"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 5 行 | <code>    }</code> | 对象结束，表示这一组键值对配置到这里结束。 |
| 第 6 行 | <code>  }</code> | 对象结束，表示这一组键值对配置到这里结束。 |
| 第 7 行 | <code>}</code> | 对象结束，表示这一组键值对配置到这里结束。 |


如果 `message` 是 text，term 查询不会分析查询词，可能查不到预期结果。

## Analyzer 和倒排索引

Analyzer 把文本变成 tokens。

例如：

```text
"Payment Timeout Error"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>"Payment Timeout Error"</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


可能被处理为：

```text
payment
timeout
error
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>payment</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>timeout</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>error</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


Elasticsearch 建立倒排索引：

```text
payment -> doc1, doc7
timeout -> doc1, doc3
error   -> doc1, doc5
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>payment -&gt; doc1, doc7</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 2 行 | <code>timeout -&gt; doc1, doc3</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>error   -&gt; doc1, doc5</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


这让全文搜索很快。

测试 analyzer：

```bash
curl -X POST "http://localhost:9200/_analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "analyzer": "standard",
    "text": "Payment Timeout Error"
  }'
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -X POST "http://localhost:9200/_analyze" \</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |
| 第 2 行 | <code>  -H "Content-Type: application/json" \</code> | 执行 `-h` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>  -d '{</code> | 执行 `-d` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 4 行 | <code>    "analyzer": "standard",</code> | 执行 `"analyzer":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 5 行 | <code>    "text": "Payment Timeout Error"</code> | 执行 `"text":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 6 行 | <code>  }'</code> | 执行 `}'` 相关命令，后面的参数决定它具体操作什么对象。 |


入门记住：

```text
text 字段会分析，适合 match
keyword 字段不分析，适合 term/filter/aggregation
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>text 字段会分析，适合 match</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>keyword 字段不分析，适合 term/filter/aggregation</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


## Dynamic mapping 和 mapping conflict

如果你没有显式 mapping，Elasticsearch 会尝试动态推断字段类型。

第一条：

```json
{ "status_code": 500 }
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{ "status_code": 500 }</code> | JSON 列表或对象中的一行，注意逗号和引号必须符合 JSON 语法。 |


可能映射成 integer。

后面写入：

```json
{ "status_code": "timeout" }
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{ "status_code": "timeout" }</code> | JSON 列表或对象中的一行，注意逗号和引号必须符合 JSON 语法。 |


就可能失败，因为同一字段类型冲突。

日志场景常见 conflict：

```json
{ "user": "alice" }
{ "user": { "id": "alice", "name": "Alice" } }
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{ "user": "alice" }</code> | JSON 列表或对象中的一行，注意逗号和引号必须符合 JSON 语法。 |
| 第 2 行 | <code>{ "user": { "id": "alice", "name": "Alice" } }</code> | JSON 列表或对象中的一行，注意逗号和引号必须符合 JSON 语法。 |


同一字段一会儿字符串，一会儿对象，会出问题。

解决：

- 提前定义 index template。
- 规范日志 schema。
- ingest pipeline 中重命名或转换字段。
- 对不确定字段使用 flattened 等合适类型。

## Index settings

Index settings 控制分片、副本、刷新、默认 pipeline 等。

创建 index：

```bash
curl -X PUT "http://localhost:9200/logs-aiops" \
  -H "Content-Type: application/json" \
  -d '{
    "settings": {
      "number_of_shards": 1,
      "number_of_replicas": 0
    },
    "mappings": {
      "properties": {
        "@timestamp": { "type": "date" },
        "service": { "type": "keyword" },
        "level": { "type": "keyword" },
        "message": { "type": "text" },
        "trace_id": { "type": "keyword" }
      }
    }
  }'
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -X PUT "http://localhost:9200/logs-aiops" \</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |
| 第 2 行 | <code>  -H "Content-Type: application/json" \</code> | 执行 `-h` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>  -d '{</code> | 执行 `-d` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 4 行 | <code>    "settings": {</code> | 执行 `"settings":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 5 行 | <code>      "number_of_shards": 1,</code> | 执行 `"number_of_shards":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 6 行 | <code>      "number_of_replicas": 0</code> | 执行 `"number_of_replicas":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 7 行 | <code>    },</code> | 执行 `},` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 8 行 | <code>    "mappings": {</code> | 执行 `"mappings":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 9 行 | <code>      "properties": {</code> | 执行 `"properties":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 10 行 | <code>        "@timestamp": { "type": "date" },</code> | 执行 `"@timestamp":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 11 行 | <code>        "service": { "type": "keyword" },</code> | 执行 `"service":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 12 行 | <code>        "level": { "type": "keyword" },</code> | 执行 `"level":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 13 行 | <code>        "message": { "type": "text" },</code> | 执行 `"message":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 14 行 | <code>        "trace_id": { "type": "keyword" }</code> | 执行 `"trace_id":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 15 行 | <code>      }</code> | 执行 `}` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 16 行 | <code>    }</code> | 执行 `}` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 17 行 | <code>  }'</code> | 执行 `}'` 相关命令，后面的参数决定它具体操作什么对象。 |


常见 settings：

| setting | 作用 |
|---|---|
| `number_of_shards` | primary shard 数 |
| `number_of_replicas` | replica 数 |
| `refresh_interval` | refresh 间隔，影响近实时可见性和写入成本 |
| `index.default_pipeline` | 默认 ingest pipeline |
| `index.final_pipeline` | 最终 pipeline |

## Data streams

日志、指标这类持续追加的时间序列数据，推荐理解 data stream。

Data stream 是多个隐藏 backing indices 的抽象。

```text
logs-aiops
  -> .ds-logs-aiops-2026.07.02-000001
  -> .ds-logs-aiops-2026.07.03-000002
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>logs-aiops</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; .ds-logs-aiops-2026.07.02-000001</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; .ds-logs-aiops-2026.07.03-000002</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


Data stream 需要匹配的 index template。template 定义：

- mappings。
- settings。
- ILM policy。
- data stream 启用。

写入时写到 data stream 名，Elasticsearch 自动写入当前 write backing index。

适合：

- 日志。
- 指标。
- APM events。
- 安全事件。

## Index templates

Index template 定义新 index 或 data stream 创建时套用的 settings/mappings/aliases。

示例：

```bash
curl -X PUT "http://localhost:9200/_index_template/logs-aiops-template" \
  -H "Content-Type: application/json" \
  -d '{
    "index_patterns": ["logs-aiops-*"],
    "priority": 500,
    "template": {
      "settings": {
        "number_of_shards": 1,
        "number_of_replicas": 1
      },
      "mappings": {
        "properties": {
          "@timestamp": { "type": "date" },
          "service": { "type": "keyword" },
          "level": { "type": "keyword" },
          "message": { "type": "text" },
          "trace_id": { "type": "keyword" }
        }
      }
    }
  }'
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -X PUT "http://localhost:9200/_index_template/logs-aiops-template" \</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |
| 第 2 行 | <code>  -H "Content-Type: application/json" \</code> | 执行 `-h` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>  -d '{</code> | 执行 `-d` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 4 行 | <code>    "index_patterns": ["logs-aiops-*"],</code> | 执行 `"index_patterns":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 5 行 | <code>    "priority": 500,</code> | 执行 `"priority":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 6 行 | <code>    "template": {</code> | 执行 `"template":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 7 行 | <code>      "settings": {</code> | 执行 `"settings":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 8 行 | <code>        "number_of_shards": 1,</code> | 执行 `"number_of_shards":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 9 行 | <code>        "number_of_replicas": 1</code> | 执行 `"number_of_replicas":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 10 行 | <code>      },</code> | 执行 `},` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 11 行 | <code>      "mappings": {</code> | 执行 `"mappings":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 12 行 | <code>        "properties": {</code> | 执行 `"properties":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 13 行 | <code>          "@timestamp": { "type": "date" },</code> | 执行 `"@timestamp":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 14 行 | <code>          "service": { "type": "keyword" },</code> | 执行 `"service":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 15 行 | <code>          "level": { "type": "keyword" },</code> | 执行 `"level":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 16 行 | <code>          "message": { "type": "text" },</code> | 执行 `"message":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 17 行 | <code>          "trace_id": { "type": "keyword" }</code> | 执行 `"trace_id":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 18 行 | <code>        }</code> | 执行 `}` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 19 行 | <code>      }</code> | 执行 `}` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 20 行 | <code>    }</code> | 执行 `}` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 21 行 | <code>  }'</code> | 执行 `}'` 相关命令，后面的参数决定它具体操作什么对象。 |


查看：

```bash
curl -s "http://localhost:9200/_index_template/logs-aiops-template?pretty"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -s "http://localhost:9200/_index_template/logs-aiops-template?pretty"</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |


为什么重要？

日志是持续新建 index/data stream backing indices。如果没有 template，新索引可能使用错误 dynamic mapping，后续查询和聚合就乱了。

## Ingest pipeline

Ingest pipeline 在文档写入前处理文档。

用途：

- 解析日志。
- 增加字段。
- 重命名字段。
- 转换类型。
- 删除字段。
- 设置时间字段。

示例：

```bash
curl -X PUT "http://localhost:9200/_ingest/pipeline/aiops-log-pipeline" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Parse AIOps log lines",
    "processors": [
      {
        "set": {
          "field": "event.dataset",
          "value": "aiops"
        }
      },
      {
        "convert": {
          "field": "status_code",
          "type": "integer",
          "ignore_missing": true
        }
      }
    ]
  }'
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -X PUT "http://localhost:9200/_ingest/pipeline/aiops-log-pipeline" \</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |
| 第 2 行 | <code>  -H "Content-Type: application/json" \</code> | 执行 `-h` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>  -d '{</code> | 执行 `-d` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 4 行 | <code>    "description": "Parse AIOps log lines",</code> | 执行 `"description":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 5 行 | <code>    "processors": [</code> | 执行 `"processors":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 6 行 | <code>      {</code> | 执行 `{` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 7 行 | <code>        "set": {</code> | 执行 `"set":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 8 行 | <code>          "field": "event.dataset",</code> | 执行 `"field":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 9 行 | <code>          "value": "aiops"</code> | 执行 `"value":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 10 行 | <code>        }</code> | 执行 `}` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 11 行 | <code>      },</code> | 执行 `},` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 12 行 | <code>      {</code> | 执行 `{` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 13 行 | <code>        "convert": {</code> | 执行 `"convert":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 14 行 | <code>          "field": "status_code",</code> | 执行 `"field":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 15 行 | <code>          "type": "integer",</code> | 执行 `"type":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 16 行 | <code>          "ignore_missing": true</code> | 执行 `"ignore_missing":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 17 行 | <code>        }</code> | 执行 `}` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 18 行 | <code>      }</code> | 执行 `}` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 19 行 | <code>    ]</code> | 执行 `]` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 20 行 | <code>  }'</code> | 执行 `}'` 相关命令，后面的参数决定它具体操作什么对象。 |


写入时指定：

```bash
curl -X POST "http://localhost:9200/logs-aiops/_doc?pipeline=aiops-log-pipeline" \
  -H "Content-Type: application/json" \
  -d '{
    "@timestamp": "2026-07-02T10:00:00Z",
    "service": "checkout-api",
    "status_code": "504",
    "message": "payment timeout"
  }'
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -X POST "http://localhost:9200/logs-aiops/_doc?pipeline=aiops-log-pipeline" \</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |
| 第 2 行 | <code>  -H "Content-Type: application/json" \</code> | 执行 `-h` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>  -d '{</code> | 执行 `-d` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 4 行 | <code>    "@timestamp": "2026-07-02T10:00:00Z",</code> | 执行 `"@timestamp":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 5 行 | <code>    "service": "checkout-api",</code> | 执行 `"service":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 6 行 | <code>    "status_code": "504",</code> | 执行 `"status_code":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 7 行 | <code>    "message": "payment timeout"</code> | 执行 `"message":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 8 行 | <code>  }'</code> | 执行 `}'` 相关命令，后面的参数决定它具体操作什么对象。 |


模拟 pipeline：

```bash
curl -X POST "http://localhost:9200/_ingest/pipeline/aiops-log-pipeline/_simulate" \
  -H "Content-Type: application/json" \
  -d '{
    "docs": [
      {
        "_source": {
          "status_code": "504"
        }
      }
    ]
  }'
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -X POST "http://localhost:9200/_ingest/pipeline/aiops-log-pipeline/_simulate" \</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |
| 第 2 行 | <code>  -H "Content-Type: application/json" \</code> | 执行 `-h` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>  -d '{</code> | 执行 `-d` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 4 行 | <code>    "docs": [</code> | 执行 `"docs":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 5 行 | <code>      {</code> | 执行 `{` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 6 行 | <code>        "_source": {</code> | 执行 `"_source":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 7 行 | <code>          "status_code": "504"</code> | 执行 `"status_code":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 8 行 | <code>        }</code> | 执行 `}` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 9 行 | <code>      }</code> | 执行 `}` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 10 行 | <code>    ]</code> | 执行 `]` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 11 行 | <code>  }'</code> | 执行 `}'` 相关命令，后面的参数决定它具体操作什么对象。 |


## Query DSL

Elasticsearch 查询使用 JSON Query DSL。

### match

全文查询，会分析查询文本。

```json
{
  "query": {
    "match": {
      "message": "payment timeout"
    }
  }
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{</code> | 对象开始，表示下面是一组键值对配置。 |
| 第 2 行 | <code>  "query": {</code> | 设置 `query` 字段，值是 `{`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 3 行 | <code>    "match": {</code> | 设置 `match` 字段，值是 `{`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 4 行 | <code>      "message": "payment timeout"</code> | 设置 `message` 字段，值是 `"payment timeout"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 5 行 | <code>    }</code> | 对象结束，表示这一组键值对配置到这里结束。 |
| 第 6 行 | <code>  }</code> | 对象结束，表示这一组键值对配置到这里结束。 |
| 第 7 行 | <code>}</code> | 对象结束，表示这一组键值对配置到这里结束。 |


### term

精确查询，不分析查询词。

```json
{
  "query": {
    "term": {
      "service": "checkout-api"
    }
  }
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{</code> | 对象开始，表示下面是一组键值对配置。 |
| 第 2 行 | <code>  "query": {</code> | 设置 `query` 字段，值是 `{`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 3 行 | <code>    "term": {</code> | 设置 `term` 字段，值是 `{`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 4 行 | <code>      "service": "checkout-api"</code> | 设置 `service` 字段，值是 `"checkout-api"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 5 行 | <code>    }</code> | 对象结束，表示这一组键值对配置到这里结束。 |
| 第 6 行 | <code>  }</code> | 对象结束，表示这一组键值对配置到这里结束。 |
| 第 7 行 | <code>}</code> | 对象结束，表示这一组键值对配置到这里结束。 |


### range

范围查询。

```json
{
  "query": {
    "range": {
      "@timestamp": {
        "gte": "now-15m",
        "lte": "now"
      }
    }
  }
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{</code> | 对象开始，表示下面是一组键值对配置。 |
| 第 2 行 | <code>  "query": {</code> | 设置 `query` 字段，值是 `{`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 3 行 | <code>    "range": {</code> | 设置 `range` 字段，值是 `{`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 4 行 | <code>      "@timestamp": {</code> | 设置 `@timestamp` 字段，值是 `{`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 5 行 | <code>        "gte": "now-15m",</code> | 设置 `gte` 字段，值是 `"now-15m"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 6 行 | <code>        "lte": "now"</code> | 设置 `lte` 字段，值是 `"now"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 7 行 | <code>      }</code> | 对象结束，表示这一组键值对配置到这里结束。 |
| 第 8 行 | <code>    }</code> | 对象结束，表示这一组键值对配置到这里结束。 |
| 第 9 行 | <code>  }</code> | 对象结束，表示这一组键值对配置到这里结束。 |
| 第 10 行 | <code>}</code> | 对象结束，表示这一组键值对配置到这里结束。 |


### bool

组合查询。

```json
{
  "query": {
    "bool": {
      "filter": [
        { "term": { "service": "checkout-api" } },
        { "term": { "level": "error" } },
        { "range": { "@timestamp": { "gte": "now-15m" } } }
      ],
      "must": [
        { "match": { "message": "timeout" } }
      ],
      "must_not": [
        { "term": { "path": "/health" } }
      ]
    }
  }
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{</code> | 对象开始，表示下面是一组键值对配置。 |
| 第 2 行 | <code>  "query": {</code> | 设置 `query` 字段，值是 `{`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 3 行 | <code>    "bool": {</code> | 设置 `bool` 字段，值是 `{`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 4 行 | <code>      "filter": [</code> | 设置 `filter` 字段，值是 `[`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 5 行 | <code>        { "term": { "service": "checkout-api" } },</code> | JSON 列表或对象中的一行，注意逗号和引号必须符合 JSON 语法。 |
| 第 6 行 | <code>        { "term": { "level": "error" } },</code> | JSON 列表或对象中的一行，注意逗号和引号必须符合 JSON 语法。 |
| 第 7 行 | <code>        { "range": { "@timestamp": { "gte": "now-15m" } } }</code> | JSON 列表或对象中的一行，注意逗号和引号必须符合 JSON 语法。 |
| 第 8 行 | <code>      ],</code> | 当前对象或数组结束，逗号表示后面还有同级项目。 |
| 第 9 行 | <code>      "must": [</code> | 设置 `must` 字段，值是 `[`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 10 行 | <code>        { "match": { "message": "timeout" } }</code> | JSON 列表或对象中的一行，注意逗号和引号必须符合 JSON 语法。 |
| 第 11 行 | <code>      ],</code> | 当前对象或数组结束，逗号表示后面还有同级项目。 |
| 第 12 行 | <code>      "must_not": [</code> | 设置 `must_not` 字段，值是 `[`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 13 行 | <code>        { "term": { "path": "/health" } }</code> | JSON 列表或对象中的一行，注意逗号和引号必须符合 JSON 语法。 |
| 第 14 行 | <code>      ]</code> | 数组结束，表示同类值或对象列表到这里结束。 |
| 第 15 行 | <code>    }</code> | 对象结束，表示这一组键值对配置到这里结束。 |
| 第 16 行 | <code>  }</code> | 对象结束，表示这一组键值对配置到这里结束。 |
| 第 17 行 | <code>}</code> | 对象结束，表示这一组键值对配置到这里结束。 |


经验：

- 精确过滤放 `filter`，不参与评分，适合缓存。
- 全文相关性放 `must` / `should`。
- 日志排障大多是 filter + range + match。

## Aggregations

Aggregations 做统计分析。

按 service 统计错误：

```bash
curl -X GET "http://localhost:9200/logs-aiops/_search" \
  -H "Content-Type: application/json" \
  -d '{
    "size": 0,
    "query": {
      "range": {
        "@timestamp": {
          "gte": "now-15m"
        }
      }
    },
    "aggs": {
      "by_service": {
        "terms": {
          "field": "service"
        }
      }
    }
  }'
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -X GET "http://localhost:9200/logs-aiops/_search" \</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |
| 第 2 行 | <code>  -H "Content-Type: application/json" \</code> | 执行 `-h` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>  -d '{</code> | 执行 `-d` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 4 行 | <code>    "size": 0,</code> | 执行 `"size":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 5 行 | <code>    "query": {</code> | 执行 `"query":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 6 行 | <code>      "range": {</code> | 执行 `"range":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 7 行 | <code>        "@timestamp": {</code> | 执行 `"@timestamp":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 8 行 | <code>          "gte": "now-15m"</code> | 执行 `"gte":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 9 行 | <code>        }</code> | 执行 `}` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 10 行 | <code>      }</code> | 执行 `}` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 11 行 | <code>    },</code> | 执行 `},` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 12 行 | <code>    "aggs": {</code> | 执行 `"aggs":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 13 行 | <code>      "by_service": {</code> | 执行 `"by_service":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 14 行 | <code>        "terms": {</code> | 执行 `"terms":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 15 行 | <code>          "field": "service"</code> | 执行 `"field":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 16 行 | <code>        }</code> | 执行 `}` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 17 行 | <code>      }</code> | 执行 `}` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 18 行 | <code>    }</code> | 执行 `}` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 19 行 | <code>  }'</code> | 执行 `}'` 相关命令，后面的参数决定它具体操作什么对象。 |


按时间统计：

```json
{
  "aggs": {
    "errors_over_time": {
      "date_histogram": {
        "field": "@timestamp",
        "fixed_interval": "1m"
      }
    }
  }
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{</code> | 对象开始，表示下面是一组键值对配置。 |
| 第 2 行 | <code>  "aggs": {</code> | 设置 `aggs` 字段，值是 `{`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 3 行 | <code>    "errors_over_time": {</code> | 设置 `errors_over_time` 字段，值是 `{`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 4 行 | <code>      "date_histogram": {</code> | 设置 `date_histogram` 字段，值是 `{`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 5 行 | <code>        "field": "@timestamp",</code> | 设置 `field` 字段，值是 `"@timestamp"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 6 行 | <code>        "fixed_interval": "1m"</code> | 设置 `fixed_interval` 字段，值是 `"1m"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 7 行 | <code>      }</code> | 对象结束，表示这一组键值对配置到这里结束。 |
| 第 8 行 | <code>    }</code> | 对象结束，表示这一组键值对配置到这里结束。 |
| 第 9 行 | <code>  }</code> | 对象结束，表示这一组键值对配置到这里结束。 |
| 第 10 行 | <code>}</code> | 对象结束，表示这一组键值对配置到这里结束。 |


注意：

- terms aggregation 应用于 keyword/numeric 等适合聚合的字段。
- 对 text 字段直接聚合通常不是你想要的。
- 高基数字段聚合成本高。

## Sort、pagination 和 search_after

查最新日志：

```json
{
  "sort": [
    { "@timestamp": "desc" }
  ],
  "size": 100
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{</code> | 对象开始，表示下面是一组键值对配置。 |
| 第 2 行 | <code>  "sort": [</code> | 设置 `sort` 字段，值是 `[`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 3 行 | <code>    { "@timestamp": "desc" }</code> | JSON 列表或对象中的一行，注意逗号和引号必须符合 JSON 语法。 |
| 第 4 行 | <code>  ],</code> | 当前对象或数组结束，逗号表示后面还有同级项目。 |
| 第 5 行 | <code>  "size": 100</code> | 设置 `size` 字段，值是 `100`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 6 行 | <code>}</code> | 对象结束，表示这一组键值对配置到这里结束。 |


浅分页：

```json
{
  "from": 0,
  "size": 100
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{</code> | 对象开始，表示下面是一组键值对配置。 |
| 第 2 行 | <code>  "from": 0,</code> | 设置 `from` 字段，值是 `0`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 3 行 | <code>  "size": 100</code> | 设置 `size` 字段，值是 `100`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 4 行 | <code>}</code> | 对象结束，表示这一组键值对配置到这里结束。 |


深分页不要无限用 `from + size`，会越来越贵。大量分页应学习 `search_after` 或 scroll/PIT 等方案。

日志排障通常更推荐：

- 限定时间范围。
- 明确过滤条件。
- 按时间排序。
- size 控制在合理范围。

## ILM：Index Lifecycle Management

ILM 管理索引生命周期。

时间序列日志常见阶段：

```text
hot -> warm -> cold -> frozen -> delete
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>hot -&gt; warm -&gt; cold -&gt; frozen -&gt; delete</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


简化策略：

```json
{
  "policy": {
    "phases": {
      "hot": {
        "actions": {
          "rollover": {
            "max_age": "1d",
            "max_primary_shard_size": "50gb"
          }
        }
      },
      "delete": {
        "min_age": "30d",
        "actions": {
          "delete": {}
        }
      }
    }
  }
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{</code> | 对象开始，表示下面是一组键值对配置。 |
| 第 2 行 | <code>  "policy": {</code> | 设置 `policy` 字段，值是 `{`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 3 行 | <code>    "phases": {</code> | 设置 `phases` 字段，值是 `{`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 4 行 | <code>      "hot": {</code> | 设置 `hot` 字段，值是 `{`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 5 行 | <code>        "actions": {</code> | 设置 `actions` 字段，值是 `{`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 6 行 | <code>          "rollover": {</code> | 设置 `rollover` 字段，值是 `{`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 7 行 | <code>            "max_age": "1d",</code> | 设置 `max_age` 字段，值是 `"1d"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 8 行 | <code>            "max_primary_shard_size": "50gb"</code> | 设置 `max_primary_shard_size` 字段，值是 `"50gb"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 9 行 | <code>          }</code> | 对象结束，表示这一组键值对配置到这里结束。 |
| 第 10 行 | <code>        }</code> | 对象结束，表示这一组键值对配置到这里结束。 |
| 第 11 行 | <code>      },</code> | 当前对象或数组结束，逗号表示后面还有同级项目。 |
| 第 12 行 | <code>      "delete": {</code> | 设置 `delete` 字段，值是 `{`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 13 行 | <code>        "min_age": "30d",</code> | 设置 `min_age` 字段，值是 `"30d"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 14 行 | <code>        "actions": {</code> | 设置 `actions` 字段，值是 `{`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 15 行 | <code>          "delete": {}</code> | 设置 `delete` 字段，值是 `{}`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 16 行 | <code>        }</code> | 对象结束，表示这一组键值对配置到这里结束。 |
| 第 17 行 | <code>      }</code> | 对象结束，表示这一组键值对配置到这里结束。 |
| 第 18 行 | <code>    }</code> | 对象结束，表示这一组键值对配置到这里结束。 |
| 第 19 行 | <code>  }</code> | 对象结束，表示这一组键值对配置到这里结束。 |
| 第 20 行 | <code>}</code> | 对象结束，表示这一组键值对配置到这里结束。 |


ILM 价值：

- 自动 rollover。
- 控制 shard 大小。
- 控制保留时间。
- 降低人工管理索引成本。

日志场景不要让索引无限增长。

## AIOps 入门实验

目标：创建日志索引，写入文档，定义 mapping，查询、聚合、模拟 pipeline，并查看 cluster health。

### 1. 查看集群

```bash
curl -s http://localhost:9200/?pretty
curl -s http://localhost:9200/_cluster/health?pretty
curl -s http://localhost:9200/_cat/nodes?v
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -s http://localhost:9200/?pretty</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |
| 第 2 行 | <code>curl -s http://localhost:9200/_cluster/health?pretty</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |
| 第 3 行 | <code>curl -s http://localhost:9200/_cat/nodes?v</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |


### 2. 创建 index

```bash
curl -X PUT "http://localhost:9200/logs-aiops" \
  -H "Content-Type: application/json" \
  -d '{
    "settings": {
      "number_of_shards": 1,
      "number_of_replicas": 0
    },
    "mappings": {
      "properties": {
        "@timestamp": { "type": "date" },
        "service": { "type": "keyword" },
        "level": { "type": "keyword" },
        "message": { "type": "text" },
        "status_code": { "type": "integer" },
        "trace_id": { "type": "keyword" }
      }
    }
  }'
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -X PUT "http://localhost:9200/logs-aiops" \</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |
| 第 2 行 | <code>  -H "Content-Type: application/json" \</code> | 执行 `-h` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>  -d '{</code> | 执行 `-d` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 4 行 | <code>    "settings": {</code> | 执行 `"settings":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 5 行 | <code>      "number_of_shards": 1,</code> | 执行 `"number_of_shards":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 6 行 | <code>      "number_of_replicas": 0</code> | 执行 `"number_of_replicas":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 7 行 | <code>    },</code> | 执行 `},` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 8 行 | <code>    "mappings": {</code> | 执行 `"mappings":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 9 行 | <code>      "properties": {</code> | 执行 `"properties":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 10 行 | <code>        "@timestamp": { "type": "date" },</code> | 执行 `"@timestamp":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 11 行 | <code>        "service": { "type": "keyword" },</code> | 执行 `"service":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 12 行 | <code>        "level": { "type": "keyword" },</code> | 执行 `"level":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 13 行 | <code>        "message": { "type": "text" },</code> | 执行 `"message":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 14 行 | <code>        "status_code": { "type": "integer" },</code> | 执行 `"status_code":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 15 行 | <code>        "trace_id": { "type": "keyword" }</code> | 执行 `"trace_id":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 16 行 | <code>      }</code> | 执行 `}` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 17 行 | <code>    }</code> | 执行 `}` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 18 行 | <code>  }'</code> | 执行 `}'` 相关命令，后面的参数决定它具体操作什么对象。 |


### 3. 写入文档

```bash
curl -X POST "http://localhost:9200/logs-aiops/_doc" \
  -H "Content-Type: application/json" \
  -d '{
    "@timestamp": "2026-07-02T10:00:00Z",
    "service": "checkout-api",
    "level": "error",
    "message": "payment timeout while calling gateway",
    "status_code": 504,
    "trace_id": "abc123"
  }'
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -X POST "http://localhost:9200/logs-aiops/_doc" \</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |
| 第 2 行 | <code>  -H "Content-Type: application/json" \</code> | 执行 `-h` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>  -d '{</code> | 执行 `-d` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 4 行 | <code>    "@timestamp": "2026-07-02T10:00:00Z",</code> | 执行 `"@timestamp":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 5 行 | <code>    "service": "checkout-api",</code> | 执行 `"service":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 6 行 | <code>    "level": "error",</code> | 执行 `"level":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 7 行 | <code>    "message": "payment timeout while calling gateway",</code> | 执行 `"message":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 8 行 | <code>    "status_code": 504,</code> | 执行 `"status_code":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 9 行 | <code>    "trace_id": "abc123"</code> | 执行 `"trace_id":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 10 行 | <code>  }'</code> | 执行 `}'` 相关命令，后面的参数决定它具体操作什么对象。 |


刷新让实验马上可查：

```bash
curl -X POST "http://localhost:9200/logs-aiops/_refresh"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -X POST "http://localhost:9200/logs-aiops/_refresh"</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |


### 4. 查询

```bash
curl -X GET "http://localhost:9200/logs-aiops/_search?pretty" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "bool": {
        "filter": [
          { "term": { "service": "checkout-api" } },
          { "term": { "level": "error" } }
        ],
        "must": [
          { "match": { "message": "timeout" } }
        ]
      }
    }
  }'
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -X GET "http://localhost:9200/logs-aiops/_search?pretty" \</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |
| 第 2 行 | <code>  -H "Content-Type: application/json" \</code> | 执行 `-h` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>  -d '{</code> | 执行 `-d` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 4 行 | <code>    "query": {</code> | 执行 `"query":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 5 行 | <code>      "bool": {</code> | 执行 `"bool":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 6 行 | <code>        "filter": [</code> | 执行 `"filter":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 7 行 | <code>          { "term": { "service": "checkout-api" } },</code> | 执行 `{` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 8 行 | <code>          { "term": { "level": "error" } }</code> | 执行 `{` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 9 行 | <code>        ],</code> | 执行 `],` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 10 行 | <code>        "must": [</code> | 执行 `"must":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 11 行 | <code>          { "match": { "message": "timeout" } }</code> | 执行 `{` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 12 行 | <code>        ]</code> | 执行 `]` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 13 行 | <code>      }</code> | 执行 `}` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 14 行 | <code>    }</code> | 执行 `}` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 15 行 | <code>  }'</code> | 执行 `}'` 相关命令，后面的参数决定它具体操作什么对象。 |


### 5. 聚合

```bash
curl -X GET "http://localhost:9200/logs-aiops/_search?pretty" \
  -H "Content-Type: application/json" \
  -d '{
    "size": 0,
    "aggs": {
      "by_service": {
        "terms": {
          "field": "service"
        }
      }
    }
  }'
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -X GET "http://localhost:9200/logs-aiops/_search?pretty" \</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |
| 第 2 行 | <code>  -H "Content-Type: application/json" \</code> | 执行 `-h` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>  -d '{</code> | 执行 `-d` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 4 行 | <code>    "size": 0,</code> | 执行 `"size":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 5 行 | <code>    "aggs": {</code> | 执行 `"aggs":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 6 行 | <code>      "by_service": {</code> | 执行 `"by_service":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 7 行 | <code>        "terms": {</code> | 执行 `"terms":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 8 行 | <code>          "field": "service"</code> | 执行 `"field":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 9 行 | <code>        }</code> | 执行 `}` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 10 行 | <code>      }</code> | 执行 `}` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 11 行 | <code>    }</code> | 执行 `}` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 12 行 | <code>  }'</code> | 执行 `}'` 相关命令，后面的参数决定它具体操作什么对象。 |


### 6. 形成学习证据

记录：

```text
index:
mapping:
document:
match query:
term query:
aggregation:
cluster health:
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>index:</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>mapping:</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>document:</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>match query:</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>term query:</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 6 行 | <code>aggregation:</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 7 行 | <code>cluster health:</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


## 常用 API 字典

### 查看版本

```bash
curl -s http://localhost:9200/?pretty
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -s http://localhost:9200/?pretty</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |


### Cluster health

```bash
curl -s http://localhost:9200/_cluster/health?pretty
curl -s http://localhost:9200/_cat/health?v
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -s http://localhost:9200/_cluster/health?pretty</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |
| 第 2 行 | <code>curl -s http://localhost:9200/_cat/health?v</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |


### Nodes

```bash
curl -s http://localhost:9200/_cat/nodes?v
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -s http://localhost:9200/_cat/nodes?v</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |


### Indices

```bash
curl -s http://localhost:9200/_cat/indices?v
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -s http://localhost:9200/_cat/indices?v</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |


### Shards

```bash
curl -s http://localhost:9200/_cat/shards?v
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -s http://localhost:9200/_cat/shards?v</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |


官方提醒 CAT APIs 主要给人用，不建议应用程序依赖它们做机器解析；自动化更适合 JSON API。

### Mapping

```bash
curl -s http://localhost:9200/logs-aiops/_mapping?pretty
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -s http://localhost:9200/logs-aiops/_mapping?pretty</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |


### Settings

```bash
curl -s http://localhost:9200/logs-aiops/_settings?pretty
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -s http://localhost:9200/logs-aiops/_settings?pretty</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |


### Search

```bash
curl -X GET "http://localhost:9200/logs-aiops/_search?pretty" \
  -H "Content-Type: application/json" \
  -d '{ "query": { "match_all": {} } }'
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -X GET "http://localhost:9200/logs-aiops/_search?pretty" \</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |
| 第 2 行 | <code>  -H "Content-Type: application/json" \</code> | 执行 `-h` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>  -d '{ "query": { "match_all": {} } }'</code> | 执行 `-d` 相关命令，后面的参数决定它具体操作什么对象。 |


### Analyze

```bash
curl -X POST "http://localhost:9200/_analyze" \
  -H "Content-Type: application/json" \
  -d '{ "analyzer": "standard", "text": "Payment Timeout Error" }'
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -X POST "http://localhost:9200/_analyze" \</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |
| 第 2 行 | <code>  -H "Content-Type: application/json" \</code> | 执行 `-h` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>  -d '{ "analyzer": "standard", "text": "Payment Timeout Error" }'</code> | 执行 `-d` 相关命令，后面的参数决定它具体操作什么对象。 |


### Explain allocation

```bash
curl -X GET "http://localhost:9200/_cluster/allocation/explain?pretty"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -X GET "http://localhost:9200/_cluster/allocation/explain?pretty"</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |


用于 shard 未分配排查。

## 典型故障排查表

| 现象 | 先看什么 | 常见原因 | 处理思路 |
|---|---|---|---|
| cluster yellow | `_cat/shards` | replica 未分配、单节点有副本 | 看 unassigned shards |
| cluster red | `_cluster/health`、allocation explain | primary 未分配 | 先恢复 primary |
| 字段查不到 | `_mapping` | 字段类型不对、没 refresh、时间范围错 | 查 mapping 和 query |
| term 查 text 查不到 | mapping/analyzer | text 被分词，term 不分析 | 对 text 用 match，对 keyword 用 term |
| 聚合报错或结果怪 | field type | 对 text 聚合、keyword 缺失 | 用 `.keyword` 或 keyword 字段 |
| mapping conflict | 写入错误 | 同字段多类型 | 规范 schema，建 template |
| 写入慢 | thread pool、refresh、bulk | 单条写入多、refresh 太频繁、磁盘慢 | bulk、调 refresh、看节点 |
| 查询慢 | query、shard、heap | 时间范围大、正则重、高基数聚合 | 限范围，优化 query |
| 磁盘满 | `_cat/allocation` | 索引无限增长、ILM 缺失 | ILM、删除、扩容 |
| shard 太多 | `_cat/shards` | 小索引过多 | rollover 策略、合并索引 |

## 排障流程：cluster yellow

```bash
curl -s "http://localhost:9200/_cluster/health?pretty"
curl -s "http://localhost:9200/_cat/indices?v"
curl -s "http://localhost:9200/_cat/shards?v"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -s "http://localhost:9200/_cluster/health?pretty"</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |
| 第 2 行 | <code>curl -s "http://localhost:9200/_cat/indices?v"</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |
| 第 3 行 | <code>curl -s "http://localhost:9200/_cat/shards?v"</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |


看：

- 哪些 shards unassigned？
- 是 primary 还是 replica？
- 节点数是否足够？
- 磁盘水位是否过高？
- allocation rules 是否限制？

单节点实验 yellow 且只是 replica 未分配，可把 replicas 调 0：

```bash
curl -X PUT "http://localhost:9200/logs-aiops/_settings" \
  -H "Content-Type: application/json" \
  -d '{ "index": { "number_of_replicas": 0 } }'
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -X PUT "http://localhost:9200/logs-aiops/_settings" \</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |
| 第 2 行 | <code>  -H "Content-Type: application/json" \</code> | 执行 `-h` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>  -d '{ "index": { "number_of_replicas": 0 } }'</code> | 执行 `-d` 相关命令，后面的参数决定它具体操作什么对象。 |


生产要谨慎，replica 是可用性保障。

## 排障流程：查询不到字段

1. 看 mapping：

```bash
curl -s "http://localhost:9200/logs-aiops/_mapping?pretty"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -s "http://localhost:9200/logs-aiops/_mapping?pretty"</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |


2. 看文档是否真的写入：

```bash
curl -s "http://localhost:9200/logs-aiops/_search?pretty" \
  -H "Content-Type: application/json" \
  -d '{ "query": { "match_all": {} }, "size": 1 }'
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -s "http://localhost:9200/logs-aiops/_search?pretty" \</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |
| 第 2 行 | <code>  -H "Content-Type: application/json" \</code> | 执行 `-h` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>  -d '{ "query": { "match_all": {} }, "size": 1 }'</code> | 执行 `-d` 相关命令，后面的参数决定它具体操作什么对象。 |


3. 确认 query 类型：

- text 字段用 match。
- keyword 字段用 term。
- date 字段用 range。

4. 如果刚写入，实验中可以 refresh：

```bash
curl -X POST "http://localhost:9200/logs-aiops/_refresh"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -X POST "http://localhost:9200/logs-aiops/_refresh"</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |


## 排障流程：写入慢

检查：

```bash
curl -s "http://localhost:9200/_cluster/health?pretty"
curl -s "http://localhost:9200/_cat/thread_pool/write?v"
curl -s "http://localhost:9200/_cat/indices?v"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -s "http://localhost:9200/_cluster/health?pretty"</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |
| 第 2 行 | <code>curl -s "http://localhost:9200/_cat/thread_pool/write?v"</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |
| 第 3 行 | <code>curl -s "http://localhost:9200/_cat/indices?v"</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |


常见原因：

- 单条写入太多，没用 bulk。
- refresh_interval 太短。
- replica 太多。
- ingest pipeline 太重。
- mapping 爆炸。
- 磁盘 I/O 慢。
- JVM heap 压力。
- shard 太多。

优化方向：

- 使用 Bulk API。
- 合理设置 refresh_interval。
- 优化 pipeline。
- 控制字段数量和 mapping。
- 规划 shard 大小。
- 扩容 data nodes。

## 排障流程：查询慢

先看 query：

- 时间范围是否过大？
- 是否用了前导通配符？
- 是否对高基数字段聚合？
- 是否查了太多 shards？
- size 是否过大？

使用 profile API：

```bash
curl -X GET "http://localhost:9200/logs-aiops/_search?pretty" \
  -H "Content-Type: application/json" \
  -d '{
    "profile": true,
    "query": {
      "match": {
        "message": "timeout"
      }
    }
  }'
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -X GET "http://localhost:9200/logs-aiops/_search?pretty" \</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |
| 第 2 行 | <code>  -H "Content-Type: application/json" \</code> | 执行 `-h` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>  -d '{</code> | 执行 `-d` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 4 行 | <code>    "profile": true,</code> | 执行 `"profile":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 5 行 | <code>    "query": {</code> | 执行 `"query":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 6 行 | <code>      "match": {</code> | 执行 `"match":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 7 行 | <code>        "message": "timeout"</code> | 执行 `"message":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 8 行 | <code>      }</code> | 执行 `}` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 9 行 | <code>    }</code> | 执行 `}` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 10 行 | <code>  }'</code> | 执行 `}'` 相关命令，后面的参数决定它具体操作什么对象。 |


优化：

- 用 filter 限制 service/env/time。
- keyword 精确字段用 term。
- 避免不必要的正则和 wildcard。
- 聚合字段使用 keyword/numeric。
- 控制 time range。
- 看 shard 数和数据量。

## AIOps 自动化诊断脚本

```bash
#!/usr/bin/env bash
set -euo pipefail

es="${1:-http://localhost:9200}"
index="${2:-logs-aiops}"

echo "== version =="
curl -s "$es/?pretty" || true

echo
echo "== cluster health =="
curl -s "$es/_cluster/health?pretty" || true

echo
echo "== indices =="
curl -s "$es/_cat/indices?v" || true

echo
echo "== shards =="
curl -s "$es/_cat/shards?v" || true

echo
echo "== mapping =="
curl -s "$es/$index/_mapping?pretty" || true

echo
echo "== sample docs =="
curl -s "$es/$index/_search?pretty" \
  -H "Content-Type: application/json" \
  -d '{ "query": { "match_all": {} }, "size": 3 }' || true
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>#!/usr/bin/env bash</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 2 行 | <code>set -euo pipefail</code> | 设置 shell 或工具变量，具体含义取决于当前终端环境。 |
| 第 3 行 | <em>空行</em> | 空行，用来把命令分成更容易阅读的几段。 |
| 第 4 行 | <code>es="${1:-http://localhost:9200}"</code> | 执行 `es="${1:-http://localhost:9200}"` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 5 行 | <code>index="${2:-logs-aiops}"</code> | 执行 `index="${2:-logs-aiops}"` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 6 行 | <em>空行</em> | 空行，用来把命令分成更容易阅读的几段。 |
| 第 7 行 | <code>echo "== version =="</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 8 行 | <code>curl -s "$es/?pretty" &#124;&#124; true</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |
| 第 9 行 | <em>空行</em> | 空行，用来把命令分成更容易阅读的几段。 |
| 第 10 行 | <code>echo</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 11 行 | <code>echo "== cluster health =="</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 12 行 | <code>curl -s "$es/_cluster/health?pretty" &#124;&#124; true</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |
| 第 13 行 | <em>空行</em> | 空行，用来把命令分成更容易阅读的几段。 |
| 第 14 行 | <code>echo</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 15 行 | <code>echo "== indices =="</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 16 行 | <code>curl -s "$es/_cat/indices?v" &#124;&#124; true</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |
| 第 17 行 | <em>空行</em> | 空行，用来把命令分成更容易阅读的几段。 |
| 第 18 行 | <code>echo</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 19 行 | <code>echo "== shards =="</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 20 行 | <code>curl -s "$es/_cat/shards?v" &#124;&#124; true</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |
| 第 21 行 | <em>空行</em> | 空行，用来把命令分成更容易阅读的几段。 |
| 第 22 行 | <code>echo</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 23 行 | <code>echo "== mapping =="</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 24 行 | <code>curl -s "$es/$index/_mapping?pretty" &#124;&#124; true</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |
| 第 25 行 | <em>空行</em> | 空行，用来把命令分成更容易阅读的几段。 |
| 第 26 行 | <code>echo</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 27 行 | <code>echo "== sample docs =="</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 28 行 | <code>curl -s "$es/$index/_search?pretty" \</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |
| 第 29 行 | <code>  -H "Content-Type: application/json" \</code> | 执行 `-h` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 30 行 | <code>  -d '{ "query": { "match_all": {} }, "size": 3 }' &#124;&#124; true</code> | 执行 `-d` 相关命令，后面的参数决定它具体操作什么对象。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |


生产化前要补：

- 认证。
- TLS。
- JSON 解析。
- allocation explain。
- disk watermarks。
- slow logs。
- ILM status。
- data stream backing indices。

## 面试怎么讲

Elasticsearch 是基于 Lucene 的分布式搜索和分析引擎。数据以 JSON document 写入 index，index 根据 mapping 决定字段类型和索引方式，text 字段会经过 analyzer 分词建立倒排索引，keyword 字段适合精确过滤、排序和聚合。Index 被拆成 primary shards 和 replica shards 分布在 nodes 上，cluster health 的 green/yellow/red 反映 shard 分配状态。日志和时间序列场景通常用 data streams、index templates 和 ILM 管理持续写入、rollover 和保留周期。排障时我会先看 cluster health、indices、shards，再看 mapping、settings、query DSL、ingest pipeline 和 ILM。

## 小白可能会问

### Elasticsearch 和数据库有什么区别？

Elasticsearch 强在搜索和分析，尤其是全文检索和聚合；传统数据库强在事务、一致性和关系查询。不要把 Elasticsearch 当唯一事实数据源。

### index 是不是数据库表？

可以粗略类比，但不完全一样。index 是文档集合，并且包含 shard、mapping、settings、索引结构等。

### text 和 keyword 为什么这么重要？

text 会分词，适合全文 match；keyword 不分词，适合精确 term、聚合和排序。用错会导致查不到或聚合异常。

### yellow 是不是一定严重？

yellow 表示 primary 可用但 replica 未完全分配。单节点实验常见；生产要看副本缺失原因。

### 为什么刚写入搜不到？

Elasticsearch 是近实时搜索，写入后要等 refresh。实验可以手动 `_refresh`。

### 为什么日志场景要用 ILM？

日志持续增长，必须自动 rollover 和删除，否则索引和磁盘会失控。

## 学习路线

第一阶段：核心对象

- cluster。
- node。
- index。
- document。
- field。
- shard。
- replica。

第二阶段：索引和查询

- mapping。
- text vs keyword。
- analyzer。
- inverted index。
- Query DSL。
- aggregations。

第三阶段：日志建模

- data streams。
- index templates。
- ingest pipelines。
- ILM。

第四阶段：运维排障

- cluster health。
- CAT APIs。
- shard allocation。
- mapping conflict。
- 写入慢。
- 查询慢。

第五阶段：AIOps 集成

- 日志检索。
- 事件搜索。
- 告警上下文查询。
- 异常聚合。
- 自动诊断脚本。

## 学习检查清单

- [ ] 我能解释 cluster、node、index、document、field。
- [ ] 我能解释 primary shard 和 replica shard。
- [ ] 我能解释 green、yellow、red。
- [ ] 我能创建一个带 mapping 的 index。
- [ ] 我能解释 text 和 keyword 的区别。
- [ ] 我能解释 analyzer 和倒排索引。
- [ ] 我能写 match、term、range、bool 查询。
- [ ] 我能写 terms aggregation。
- [ ] 我能解释 data stream 和 backing indices。
- [ ] 我能解释 index template 的作用。
- [ ] 我能解释 ingest pipeline 的作用。
- [ ] 我能解释 ILM 为什么重要。
- [ ] 我能排查 cluster yellow。
- [ ] 我能排查字段查不到。
- [ ] 我能排查写入慢和查询慢。
- [ ] 我能把 Elasticsearch 诊断写进 AIOps runbook。

## 面试题

1. Elasticsearch 适合解决什么问题？
2. Elasticsearch 和 Loki 的主要差异是什么？
3. cluster、node、index、document 分别是什么？
4. shard 和 replica 是什么？
5. cluster health green/yellow/red 分别表示什么？
6. mapping 是什么？
7. text 和 keyword 有什么区别？
8. analyzer 做什么？
9. 什么是倒排索引？
10. match 和 term 查询有什么区别？
11. bool query 的 filter 和 must 有什么区别？
12. range query 常用于什么？
13. terms aggregation 做什么？
14. 为什么高基数字段聚合可能很贵？
15. data stream 适合什么场景？
16. index template 解决什么问题？
17. ingest pipeline 能做什么？
18. ILM 的 rollover 和 delete 有什么用？
19. cluster yellow 怎么排查？
20. 查询慢你会从哪些方面分析？

## 学习证据

完成本篇后，建议留下这些证据：

- 一个 `logs-aiops` index 创建命令，包含 settings 和 mappings。
- 一份写入文档示例。
- 一份 match、term、bool、range 查询示例。
- 一份 terms aggregation 示例。
- 一份 `_cluster/health`、`_cat/indices`、`_cat/shards` 输出解读。
- 一份 cluster yellow 或 mapping conflict 排障笔记。
- 一个 Elasticsearch 诊断脚本，能采集 health、indices、shards、mapping 和样例文档。
