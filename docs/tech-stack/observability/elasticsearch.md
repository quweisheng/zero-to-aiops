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
JSON document（JSON文档记录）
  -> index / data stream（索引或数据流）
  -> index template（索引模板）
  -> mappings / settings（字段映射与索引设置）
  -> ingest pipeline（写入处理流水线）
  -> primary shard（主分片）
  -> inverted index / doc values（倒排索引与列式字段值）
  -> replica shards（副本分片）
  -> Query DSL search（使用领域查询语言搜索）
  -> aggregations（聚合统计）
  -> ILM rollover / retention（索引生命周期滚动与保留）
```

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
Core concepts（核心概念）
  -> Cluster（集群）
  -> Node（节点）
  -> Index（索引）
  -> Document（文档）
  -> Field（字段）
  -> Shards and replicas（分片与副本）

Data modeling（数据建模）
  -> Mappings（字段映射）
  -> Field types（字段类型）
  -> Dynamic mapping（动态映射）
  -> Runtime fields（查询时计算字段）
  -> Index settings（索引设置）
  -> Analyzers（文本分析器）

Data management（数据管理）
  -> Data streams（数据流）
  -> Index templates（索引模板）
  -> Component templates（组件模板）
  -> Aliases（别名）
  -> ILM（索引生命周期管理）
  -> Snapshot and restore（快照与恢复）

Ingest（数据写入）
  -> Document APIs（文档接口）
  -> Bulk API（批量接口）
  -> Ingest pipelines（写入流水线）
  -> Processors（处理器）

Search（搜索）
  -> Search API（搜索接口）
  -> Query DSL（查询领域语言）
  -> Full-text queries（全文查询）
  -> Term-level queries（词项级查询）
  -> Compound queries（组合查询）
  -> Sort（排序）
  -> Pagination（分页）
  -> Highlighting（高亮）

Aggregations（聚合统计）
  -> Bucket aggregations（分桶聚合）
  -> Metrics aggregations（指标聚合）
  -> Pipeline aggregations（流水线聚合）
  -> Terms aggregation（按词项分组聚合）
  -> Date histogram（日期直方图）

Operations（运行维护）
  -> Cluster health（集群健康）
  -> CAT APIs（便于查看的表格类接口）
  -> Shard allocation（分片分配）
  -> Index lifecycle（索引生命周期）
  -> Monitoring（监控）
```

学习顺序：

```text
先懂 document/index/shard
  -> 再懂 mapping 和 analyzer
  -> 再懂 query DSL
  -> 再懂 aggregation
  -> 再懂 data stream/template/ILM
  -> 最后学集群健康和性能排障
```

## 老师带你理解“写进去了，为什么搜不到”

我们写入一条日志 `Payment Timeout`。程序显示成功，你用同样大小写搜索却可能找不到。先分清 Document（文档：一条 JSON 记录）、Field（字段：记录中的一项）、Mapping（映射：字段如何解释）、Analyzer（分析器：文本如何拆分和规范化）。搜索结果取决于字段语义与查询方式，不只是屏幕上看见的字符串。

`text` 常用于全文检索，内容会经过分析；`keyword` 常用于精确值和聚合。假设分析结果是 `payment`、`timeout`，词项级查询直接找 `Payment` 可能不匹配；全文查询通常会按其规则处理输入。实际分析器可配置，先看目标索引映射与分析结果，不把本例拆分规则当所有语言的通用算法。

### 基础实验与故障实验：先观察索引中的词

准备 Node.js，在仓库根目录执行纯数据演练：

```powershell
node examples/teacher-led-reliability-lab/telemetry.mjs elasticsearch
node examples/teacher-led-reliability-lab/telemetry.mjs elasticsearch --fault
```

正常查 `payment` 命中，故障查 `Payment` 不命中，`analyzedTokens` 列出课堂索引词，`issue` 表示设定故障。这个脚本不启动 Elasticsearch，仅帮助理解词项与原文的区别。后文真实实验用映射、写入和搜索验证。失败先查目录、参数和 Node；无资源要清理，保留输出与推理。

### 第二课：确认写入、持久化与可搜索是不同阶段

请求经过协调与主分片，复制按集群设置参与确认；搜索可见性还涉及 Refresh（刷新可搜索视图）。不要把频繁强制刷新当默认修复，写入吞吐会受影响。故障时区分响应是否确认、目标索引是否正确、查询窗口与映射是否匹配，再查刷新与分片状态。

Shard（分片）将索引数据拆开，Replica（副本）提高部分故障下可用性并参与读取。分片太多会增加管理开销，太少又限制某些扩展方式，按数据规模、增长和查询负载设计。集群黄色通常与副本分配有关，红色意味着至少某些主分片不可用；具体影响要定位索引，不能看到颜色就删除数据。

### 第三课：日志平台的容量和恢复

写入预算取决于文档数、大小、字段数、分析、复制与存储。动态字段失控会扩大映射，批量写入还要逐项检查失败，不能只看请求级状态。查询要限制时间与范围、选择合适字段、正确处理分页；高开销聚合和深分页可能拖慢集群。

生命周期管理安排滚动索引和保留，快照提供历史恢复；副本不会替代快照。升级前核对版本、插件、索引兼容和客户端行为，在隔离环境验证快照恢复与典型查询。为写入与查询分配不同最小权限，日志脱敏并限制跨租户访问。

### 面试课堂：30 秒与 3 分钟

30 秒：“Elasticsearch 把文档按映射与分析规则组织成可搜索索引，分片承担数据和查询。排障先区分写入、可见性、字段语义与分片分配。”

3 分钟用一条日志讲写入、分析、主副本与搜索，再说明 `text` 和 `keyword` 的取舍。追问：“写入成功搜索为空？”检查索引、刷新、时间与查询类型。“分片越多越快？”解释并发收益和协调成本。“有副本为何备份？”复制不能提供所有历史恢复能力。

设计题：每日增长的多租户日志如何滚动、保留、限制和恢复。事故题：新日志引入大量动态字段，先看映射变化和逐项写入失败，再回退生产者或模板并评估既有数据。GitHub 保存映射、实验、真实查询和恢复说明。

## 进阶课堂：把搜索系统的内部账本讲明白

### 从零认识“索引”：同一个词为什么有两种意思

同学，你会在文章里反复看到 index。作为资源名，它表示一组文档及其映射、设置；作为数据结构，它表示为了加速查找而建立的辅助组织。可以把前者想成一本登记册，把后者想成册后的检索目录。它们有关联，但不是同一层概念。

假设有三条日志，分别包含“支付超时”“支付成功”“库存超时”。如果每次查询都从头看三条原文，数据越多越慢。倒排索引换一个方向，先记“支付出现在哪些文档”“超时出现在哪些文档”，查询时再找候选集合。实际中文分词由分析器决定，这里的两个词是人为划定的课堂词项，不暗示默认分析器会按这个方式处理中文。

倒排索引适合从词找文档；聚合需要按文档读取字段值，通常利用另一种按列组织的结构 Doc values（文档值）。这解释了为什么“全文能搜到”不代表“这个字段适合直接做分组统计”。你遇到字段不适合聚合时，应检查映射和预期语义，不能仅为消除报错就打开高内存成本的选项。

映射因此不是写完便忘的配置。它像数据合同：时间是什么格式，耗时用整数还是小数，状态码用于计算还是精确匹配，消息用于全文搜索还是保留原样。上线前准备几条正常和异常样本验证合同。生产者把 `duration_ms` 从数值改成带单位字符串时，需要同时调整合同、转换和查询，而不是要求接收端“自动理解”。

### 再走一遍写入路径：为什么有几个不同的成功点

客户端发送文档后，协调节点根据路由找到主分片，主分片完成处理，再按相关配置与副本交互。节点还需要维护恢复用的事务日志 Translog，以及用于查询的索引结构。这里没有一个万能的“保存完成”：请求确认、崩溃恢复保证、搜索可见性，是你必须分别说明的三个问题。

默认的请求级事务日志持久策略，会在相关事务日志完成持久化后再报告成功；异步策略则改变崩溃时的风险窗口。Refresh（刷新）处理搜索可见性，Flush（刷写与事务日志维护）处理另一层生命周期。不要因中文都叫“刷新”就混成一个操作。参数与部署形态以 [Translog 官方说明](https://www.elastic.co/docs/reference/elasticsearch/index-settings/translog) 为准。

如果业务流程确实要求“写完接着搜”，可以评估请求的 `refresh=wait_for`：等待相应刷新，而不是每条都主动制造一个小刷新。它也会增加等待，不能无限提高调用频率。先确定业务是否真需要立即搜索，是否可按文档标识直接读取，再做吞吐与延迟取舍。参见 [refresh 参数说明](https://www.elastic.co/docs/reference/elasticsearch/rest-apis/refresh-parameter)。

现在请你解释：写入日志返回成功，仪表盘仍没有结果，要按什么顺序检查？先查实际索引或别名，再查事件时间、时区、租户、字段类型与过滤条件，最后结合分片和刷新证据定位。若直接反复提交，可能产生重复日志，反而污染错误率和 AIOps 训练集。

### Bulk 批量写入：整车到了，不代表每个包裹都签收

Bulk API 把多项写入放在一个请求里，减少网络往返。它的每个项目仍有自己的处理结果，所以请求返回正常并不证明所有文档都成功。采集程序要检查顶层 `errors` 和每项结果，区分格式不合法、权限问题、并发冲突和暂时拒绝。具体格式见 [Bulk 官方接口](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-bulk)。

假设 100 条里 97 条成功、2 条字段类型冲突、1 条暂时拒绝。合理处理不是把 100 条无限重发：先记录成功项；类型冲突进入受控隔离区，保留脱敏样例等待修订；暂时失败按退避策略有限重试。退避表示失败后逐步延长等待，抖动表示给等待加少量随机变化，避免所有采集器同一瞬间再次冲击后端。

选择稳定文档标识能帮助重试去重，但要明确语义：同一标识用覆盖方式写入，会把旧内容替换；自动生成不同标识可能保留重复事件。审计日志是否允许覆盖、纠错事件如何追加，都应先定业务合同。不能只为了去重省事，改变证据的完整性要求。

### 两位同学同时修改：版本条件为什么不能省

小王和小李都读取同一条配置摘要。小王把负责人改为甲，小李稍后拿旧文档修改备注并整体提交，可能覆盖小王的更新。这叫 Lost update（丢失更新）：请求都成功了，但较早的正确修改消失了。

乐观并发控制的思路是“我只在对象仍是刚才那个版本时修改”。Elasticsearch 可用 `if_seq_no` 与 `if_primary_term` 表达条件，它们对应操作序号和主分片任期相关信息，不要自行猜一个数字。先读到版本信息，再带条件提交；冲突时重新读取并决定合并或拒绝。见 [乐观并发控制](https://www.elastic.co/docs/reference/elasticsearch/rest-apis/optimistic-concurrency-control)。

课堂练习不需要生产数据：在笔记中写原值、两次读取、第一次提交、第二次带旧条件提交四行，推导第二次为什么应拒绝。进阶追问是“自动重试是否一定正确”：若业务是覆盖备注，合并规则与累加计数不同，必须先定义操作语义。并发工具不能代替业务规则。

### 容量设计：不要只问有多少 GB

同样一天 100 GB 日志，少量大文档与大量小文档的负担不同；固定十个字段与不断增加动态字段的负担不同；只查最近一小时与全量多维聚合的负担也不同。容量评估要同时记录文档速率、大小分布、字段增长、分片数量、保留、副本和查询形态，再留故障与恢复余量。

分片多会增加索引管理和查询协调开销。新增节点也不等于某个热点写入立即平均分散。先观察数据和请求是否集中到少数分片，检查路由设计与热点租户；再选择滚动索引、调整下一代索引布局或迁移方案。改变已有索引结构常涉及重建与数据搬迁，需要双读校验和切换回退，不是改一行注释就结束。

恢复验收也不能只看集群变绿。至少验证代表性时间范围可搜索、文档数与约定校验一致、权限未放宽、写入仍可持续、面板与告警引用正确索引。备份目录存在只证明有文件；恢复到隔离环境并完成这些核对，才为恢复能力提供证据。

## Elasticsearch 在 AIOps 链路中的位置

Elasticsearch 常用于日志搜索、事件检索、告警上下文查询和历史分析。

```text
应用/系统日志
  -> Logstash / Beats / Elastic Agent / OTel Collector / 自定义写入
  -> Elasticsearch data streams / indices（日志数据流或索引）
  -> Kibana / API / AIOps 分析服务
  -> 告警上下文、根因分析、异常搜索
```

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

## Cluster、Node、Index、Document

### Cluster

Cluster 是一个或多个 Elasticsearch nodes 的集合。

查看：

```bash
curl -s http://localhost:9200/
curl -s http://localhost:9200/_cluster/health?pretty
```

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

每个 document 有 `_index`、`_id`、`_source` 等元信息。

## Shards 和 Replicas

Index 会被拆成 shards。

```text
index logs-aiops（名为logs-aiops的索引）
  -> primary shard 0（编号0的主分片）
  -> primary shard 1（编号1的主分片）
  -> primary shard 2（编号2的主分片）
```

Replica 是 primary shard 的副本。

```text
primary shard 0 on node A
replica shard 0 on node B
```

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

## Cluster health：green、yellow、red

查看：

```bash
curl -s "http://localhost:9200/_cluster/health?pretty"
curl -s "http://localhost:9200/_cat/health?v"
```

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

## text 和 keyword

这是新手最重要的字段类型区别。

### text

用于全文搜索，会经过 analyzer 分词。

```json
"message": { "type": "text" }
```

适合：

- 日志消息。
- 文本描述。
- 需要 match 搜索的内容。

### keyword

用于精确匹配、排序、聚合，不分词。

```json
"service": { "type": "keyword" }
```

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

如果 `message` 是 text，term 查询不会分析查询词，可能查不到预期结果。

## Analyzer 和倒排索引

Analyzer 把文本变成 tokens。

例如：

```text
"Payment Timeout Error"
```

可能被处理为：

```text
payment
timeout
error
```

Elasticsearch 建立倒排索引：

```text
payment -> doc1, doc7（词payment指向文档1和7）
timeout -> doc1, doc3（词timeout指向文档1和3）
error   -> doc1, doc5（词error指向文档1和5）
```

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

入门记住：

```text
text 字段会分析，适合 match
keyword 字段不分析，适合 term/filter/aggregation
```

## Dynamic mapping 和 mapping conflict

如果你没有显式 mapping，Elasticsearch 会尝试动态推断字段类型。

第一条：

```json
{ "status_code": 500 }
```

可能映射成 integer。

后面写入：

```json
{ "status_code": "timeout" }
```

就可能失败，因为同一字段类型冲突。

日志场景常见 conflict：

```json
{ "user": "alice" }
{ "user": { "id": "alice", "name": "Alice" } }
```

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
logs-aiops（日志数据流名称）
  -> .ds-logs-aiops-2026.07.02-000001（第一个日期后备索引示例）
  -> .ds-logs-aiops-2026.07.03-000002（第二个日期后备索引示例）
```

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

查看：

```bash
curl -s "http://localhost:9200/_index_template/logs-aiops-template?pretty"
```

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

浅分页：

```json
{
  "from": 0,
  "size": 100
}
```

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
hot -> warm -> cold -> frozen -> delete（热、温、冷、冻结到删除的生命周期阶段）
```

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

刷新让实验马上可查：

```bash
curl -X POST "http://localhost:9200/logs-aiops/_refresh"
```

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

## 常用 API 字典

### 查看版本

```bash
curl -s http://localhost:9200/?pretty
```

### Cluster health

```bash
curl -s http://localhost:9200/_cluster/health?pretty
curl -s http://localhost:9200/_cat/health?v
```

### Nodes

```bash
curl -s http://localhost:9200/_cat/nodes?v
```

### Indices

```bash
curl -s http://localhost:9200/_cat/indices?v
```

### Shards

```bash
curl -s http://localhost:9200/_cat/shards?v
```

官方提醒 CAT APIs 主要给人用，不建议应用程序依赖它们做机器解析；自动化更适合 JSON API。

### Mapping

```bash
curl -s http://localhost:9200/logs-aiops/_mapping?pretty
```

### Settings

```bash
curl -s http://localhost:9200/logs-aiops/_settings?pretty
```

### Search

```bash
curl -X GET "http://localhost:9200/logs-aiops/_search?pretty" \
  -H "Content-Type: application/json" \
  -d '{ "query": { "match_all": {} } }'
```

### Analyze

```bash
curl -X POST "http://localhost:9200/_analyze" \
  -H "Content-Type: application/json" \
  -d '{ "analyzer": "standard", "text": "Payment Timeout Error" }'
```

### Explain allocation

```bash
curl -X GET "http://localhost:9200/_cluster/allocation/explain?pretty"
```

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

生产要谨慎，replica 是可用性保障。

## 排障流程：查询不到字段

1. 看 mapping：

```bash
curl -s "http://localhost:9200/logs-aiops/_mapping?pretty"
```

2. 看文档是否真的写入：

```bash
curl -s "http://localhost:9200/logs-aiops/_search?pretty" \
  -H "Content-Type: application/json" \
  -d '{ "query": { "match_all": {} }, "size": 1 }'
```

3. 确认 query 类型：

- text 字段用 match。
- keyword 字段用 term。
- date 字段用 range。

4. 如果刚写入，实验中可以 refresh：

```bash
curl -X POST "http://localhost:9200/logs-aiops/_refresh"
```

## 排障流程：写入慢

检查：

```bash
curl -s "http://localhost:9200/_cluster/health?pretty"
curl -s "http://localhost:9200/_cat/thread_pool/write?v"
curl -s "http://localhost:9200/_cat/indices?v"
```

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
