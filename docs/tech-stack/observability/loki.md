# Grafana Loki

> 目标：能理解 Loki 为什么是“像 Prometheus 一样的日志系统”，能讲清 log stream、labels、chunks、index、object storage、LogQL、distributor、ingester、querier、query frontend、compactor、ruler，能设计低基数标签，能写基础查询，并能排查“查不到日志、查询慢、标签爆炸、日志告警误报”。

## 官方资料

- [Grafana Loki documentation](https://grafana.com/docs/loki/latest/)
- [Loki architecture](https://grafana.com/docs/loki/latest/get-started/architecture/)
- [Loki components](https://grafana.com/docs/loki/latest/get-started/components/)
- [Understand labels](https://grafana.com/docs/loki/latest/get-started/labels/)
- [Cardinality](https://grafana.com/docs/loki/latest/get-started/labels/cardinality/)
- [Query Loki](https://grafana.com/docs/loki/latest/query/)
- [LogQL](https://grafana.com/docs/loki/latest/query/)
- [Loki configuration parameters](https://grafana.com/docs/loki/latest/configure/)
- [Loki storage](https://grafana.com/docs/loki/latest/configure/storage/)
- [Storage schema](https://grafana.com/docs/loki/latest/operations/storage/schema/)
- [Consistent hash rings](https://grafana.com/docs/loki/latest/get-started/hash-rings/)
- [Promtail agent](https://grafana.com/docs/loki/latest/send-data/promtail/)
- [Grafana Alloy documentation](https://grafana.com/docs/alloy/latest/)
- [Loki GitHub repository](https://github.com/grafana/loki)

说明：本文基于 Grafana Loki 官方文档整理，是原创中文教程，不复制官方全文。特别注意：Promtail 官方页面说明 Promtail 已在 2026-03-02 EOL，商业支持已结束，未来功能开发转到 Grafana Alloy。本文仍会解释 Promtail 的历史位置，但新项目应优先学习 Grafana Alloy 或其他受支持的日志采集方式。

## 场景开场

告警说：

```text
checkout-api 5xx rate > 5%
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>checkout-api 5xx rate &gt; 5%</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


你想查日志：

```text
最近 15 分钟 checkout-api 的 ERROR 日志有哪些？
这些错误是否集中在某个 pod、namespace、cluster？
某条日志能不能跳到对应 trace？
能不能从日志里提取 status_code，按 5xx 统计？
为什么我一查 user_id 就非常慢？
为什么把 request_id 放 label 后 Loki 卡了？
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>最近 15 分钟 checkout-api 的 ERROR 日志有哪些？</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>这些错误是否集中在某个 pod、namespace、cluster？</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>某条日志能不能跳到对应 trace？</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>能不能从日志里提取 status_code，按 5xx 统计？</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>为什么我一查 user_id 就非常慢？</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 6 行 | <code>为什么把 request_id 放 label 后 Loki 卡了？</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


传统全文索引日志系统会把日志内容大量索引。Loki 的设计不同：它主要索引 labels，日志内容压缩成 chunks 存储。查询时先用 label 找到日志流和 chunk，再在 chunk 里过滤内容。

这带来一个关键学习点：

```text
Loki 的核心不是“所有字段都建索引”
而是“用少量低基数 labels 快速定位日志流，再用 LogQL 过滤日志内容”
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Loki 的核心不是“所有字段都建索引”</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>而是“用少量低基数 labels 快速定位日志流，再用 LogQL 过滤日志内容”</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


## 一句话人话版

Loki 是 Grafana 的日志聚合系统：它像 Prometheus 一样用 labels 组织数据，但存的是日志；它只索引少量标签，不索引全文内容，所以成本低、和指标标签体系一致，但标签设计错误，尤其高基数标签，会严重影响性能和成本。

## 学习边界

入门 Loki 先抓这条链：

```text
应用写日志
  -> Grafana Alloy / supported client 采集
  -> 添加 labels
  -> push 到 Loki distributor
  -> ingester 按 stream 写入 chunks
  -> index 记录 labels 到 chunks 的映射
  -> object storage 保存 chunks
  -> Grafana 用 LogQL 查询
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>应用写日志</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; Grafana Alloy / supported client 采集</code> | 这一行要理解这些英文词：`Grafana Alloy` 是Grafana 的可观测数据采集代理，可以接收、处理并转发遥测数据；`supported client` 是client=客户端。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; 添加 labels</code> | 这一行要理解这些英文词：`labels` 是标签。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; push 到 Loki distributor</code> | 这一行要理解这些英文词：`push` 是推送，把本地提交上传到远程仓库；`Loki distributor` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; ingester 按 stream 写入 chunks</code> | 这一行要理解这些英文词：`ingester` 是摄取组件，负责接收并写入日志、指标或追踪数据；`stream` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`chunks` 是多个数据分块。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>  -&gt; index 记录 labels 到 chunks 的映射</code> | 这一行要理解这些英文词：`index` 是索引或目录；`labels` 是标签；`chunks` 是多个数据分块。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 7 行 | <code>  -&gt; object storage 保存 chunks</code> | 这一行要理解这些英文词：`object storage` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`chunks` 是多个数据分块。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 8 行 | <code>  -&gt; Grafana 用 LogQL 查询</code> | 这一行要理解这些英文词：`Grafana` 是仪表盘和可视化平台，用来展示指标、日志和告警数据；`LogQL` 是Loki 的日志查询语言。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


第一阶段必须掌握：

- Loki 和 Elasticsearch 的设计差异。
- log stream 是什么。
- labels 是什么，为什么必须低基数。
- chunks 和 index 的关系。
- LogQL 的 log query、filter、parser、metric query。
- `{label="value"}` 选择器。
- `|=`, `!=`, `|~`, `!~`。
- `| json`, `| logfmt`, `| pattern`。
- `count_over_time`、`rate`。
- distributor、ingester、querier、query frontend、compactor、ruler。
- 单体、simple scalable、microservices 部署模式。
- Grafana 查询和日志告警。
- 查不到日志、查询慢、高基数、时间范围错误怎么排查。

暂时可以先不深挖：

- Loki 内部 chunk 编码细节。
- TSDB index 内部实现。
- 大规模多租户调优。
- shuffle sharding。
- query scheduler 复杂容量规划。
- ruler 远程规则存储。
- Bloom filters 细节。
- Grafana Alloy River 语言完整语法。

## 官方知识地图

Loki 官方资料可按这些模块读：

```text
Get started
  -> What is Loki
  -> Architecture
  -> Components
  -> Deployment modes
  -> Labels
  -> Cardinality
  -> Query Loki

Send data
  -> Grafana Alloy
  -> OpenTelemetry Collector
  -> Docker driver
  -> Kubernetes integrations
  -> Promtail historical docs

Query
  -> LogQL
  -> Log queries
  -> Metric queries
  -> Parsers
  -> Pattern match filters
  -> Template functions

Configure
  -> server
  -> common
  -> schema_config
  -> storage_config
  -> limits_config
  -> ruler
  -> compactor
  -> query_range

Operations
  -> Storage
  -> Schema
  -> Retention
  -> Recording rules
  -> Alerting rules
  -> Troubleshooting
  -> Scaling
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Get started</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; What is Loki</code> | 这一行要理解这些英文词：`What is Loki` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; Architecture</code> | 这一行要理解这些英文词：`Architecture` 是架构。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; Components</code> | 这一行要理解这些英文词：`Components` 是组件集合，表示系统由哪些部分组成。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; Deployment modes</code> | 这一行要理解这些英文词：`Deployment modes` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>  -&gt; Labels</code> | 这一行要理解这些英文词：`Labels` 是标签。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 7 行 | <code>  -&gt; Cardinality</code> | 这一行要理解这些英文词：`Cardinality` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 8 行 | <code>  -&gt; Query Loki</code> | 这一行要理解这些英文词：`Query Loki` 是query=查询。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 9 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 10 行 | <code>Send data</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 11 行 | <code>  -&gt; Grafana Alloy</code> | 这一行要理解这些英文词：`Grafana Alloy` 是Grafana 的可观测数据采集代理，可以接收、处理并转发遥测数据。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 12 行 | <code>  -&gt; OpenTelemetry Collector</code> | 这一行要理解这些英文词：`OpenTelemetry Collector` 是opentelemetry=可观测性数据采集标准。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 13 行 | <code>  -&gt; Docker driver</code> | 这一行要理解这些英文词：`Docker driver` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 14 行 | <code>  -&gt; Kubernetes integrations</code> | 这一行要理解这些英文词：`Kubernetes integrations` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 15 行 | <code>  -&gt; Promtail historical docs</code> | 这一行要理解这些英文词：`Promtail historical docs` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 16 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 17 行 | <code>Query</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 18 行 | <code>  -&gt; LogQL</code> | 这一行要理解这些英文词：`LogQL` 是Loki 的日志查询语言。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 19 行 | <code>  -&gt; Log queries</code> | 这一行要理解这些英文词：`Log queries` 是queries=查询。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 20 行 | <code>  -&gt; Metric queries</code> | 这一行要理解这些英文词：`Metric queries` 是queries=查询。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 21 行 | <code>  -&gt; Parsers</code> | 这一行要理解这些英文词：`Parsers` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 22 行 | <code>  -&gt; Pattern match filters</code> | 这一行要理解这些英文词：`Pattern match filters` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 23 行 | <code>  -&gt; Template functions</code> | 这一行要理解这些英文词：`Template functions` 是functions=函数。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 24 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 25 行 | <code>Configure</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 26 行 | <code>  -&gt; server</code> | 这一行要理解这些英文词：`server` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 27 行 | <code>  -&gt; common</code> | 这一行要理解这些英文词：`common` 是常见。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 28 行 | <code>  -&gt; schema_config</code> | 这一行要理解这些英文词：`schema_config` 是config=配置。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 29 行 | <code>  -&gt; storage_config</code> | 这一行要理解这些英文词：`storage_config` 是config=配置。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 30 行 | <code>  -&gt; limits_config</code> | 这一行要理解这些英文词：`limits_config` 是config=配置。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 31 行 | <code>  -&gt; ruler</code> | 这一行要理解这些英文词：`ruler` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 32 行 | <code>  -&gt; compactor</code> | 这一行要理解这些英文词：`compactor` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 33 行 | <code>  -&gt; query_range</code> | 这一行要理解这些英文词：`query_range` 是query=查询。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 34 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 35 行 | <code>Operations</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 36 行 | <code>  -&gt; Storage</code> | 这一行要理解这些英文词：`Storage` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 37 行 | <code>  -&gt; Schema</code> | 这一行要理解这些英文词：`Schema` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 38 行 | <code>  -&gt; Retention</code> | 这一行要理解这些英文词：`Retention` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 39 行 | <code>  -&gt; Recording rules</code> | 这一行要理解这些英文词：`Recording rules` 是记录规则，提前把 PromQL 计算结果保存成新指标。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 40 行 | <code>  -&gt; Alerting rules</code> | 这一行要理解这些英文词：`Alerting rules` 是告警规则，定义什么条件会触发告警。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 41 行 | <code>  -&gt; Troubleshooting</code> | 这一行要理解这些英文词：`Troubleshooting` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 42 行 | <code>  -&gt; Scaling</code> | 这一行要理解这些英文词：`Scaling` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


学习顺序：

```text
先懂 Loki 只索引 labels
  -> 再懂 log stream 和 cardinality
  -> 再懂写入路径 distributor/ingester/chunks
  -> 再懂查询路径 query frontend/querier/store
  -> 再懂 LogQL
  -> 最后学部署、告警、调优
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>先懂 Loki 只索引 labels</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; 再懂 log stream 和 cardinality</code> | 这一行要理解这些英文词：`log stream` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`cardinality` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; 再懂写入路径 distributor/ingester/chunks</code> | 这一行要理解这些英文词：`distributor` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`ingester` 是摄取组件，负责接收并写入日志、指标或追踪数据；`chunks` 是多个数据分块。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; 再懂查询路径 query frontend/querier/store</code> | 这一行要理解这些英文词：`query frontend` 是query=查询；`querier` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`store` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; 再懂 LogQL</code> | 这一行要理解这些英文词：`LogQL` 是Loki 的日志查询语言。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>  -&gt; 最后学部署、告警、调优</code> | 这一行表示上一级主题下的子项“最后学部署、告警、调优”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |


## Loki 在 AIOps 链路中的位置

Loki 是 AIOps 的日志检索和日志指标化层。

```text
应用 / 系统 / Kubernetes
  -> stdout / files / journald
  -> Grafana Alloy / OTel Collector / supported client
  -> Loki
  -> Grafana Explore / Dashboards
  -> LogQL alerts
  -> Alertmanager
  -> AIOps 诊断
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>应用 / 系统 / Kubernetes</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; stdout / files / journald</code> | 这一行要理解这些英文词：`stdout` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`files` 是文件；`journald` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; Grafana Alloy / OTel Collector / supported client</code> | 这一行要理解这些英文词：`Grafana Alloy` 是Grafana 的可观测数据采集代理，可以接收、处理并转发遥测数据；`OTel Collector` 是OpenTelemetry Collector，负责接收、处理和转发遥测数据；`supported client` 是client=客户端。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; Loki</code> | 这一行要理解这些英文词：`Loki` 是日志聚合和查询系统，常和 Grafana 配合使用。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; Grafana Explore / Dashboards</code> | 这一行要理解这些英文词：`Grafana Explore` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`Dashboards` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>  -&gt; LogQL alerts</code> | 这一行要理解这些英文词：`LogQL alerts` 是alerts=告警。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 7 行 | <code>  -&gt; Alertmanager</code> | 这一行要理解这些英文词：`Alertmanager` 是Prometheus 生态里的告警管理器。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 8 行 | <code>  -&gt; AIOps 诊断</code> | 这一行要理解这些英文词：`AIOps` 是智能运维。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


Loki 给 AIOps 提供：

| 能力 | 价值 |
|---|---|
| 标签化日志检索 | 按 cluster/namespace/service/pod 快速过滤 |
| 日志内容过滤 | 快速看 ERROR、timeout、exception |
| 结构化解析 | 从 JSON/logfmt 日志提取字段 |
| 日志转指标 | 用 LogQL 统计错误数、错误率 |
| trace 关联 | 通过 trace_id 跳到 Tempo/trace 后端 |
| 告警 | 基于日志模式触发告警 |
| 低成本存储 | 大量日志用 object storage 保存 chunks |

在 AIOps runbook 里，Loki 常用于回答：

```text
告警发生前后，服务有没有集中报错？
错误是否集中在某个版本、Pod、节点、租户？
这条 trace 对应哪些日志？
日志里是否出现同一个异常栈？
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>告警发生前后，服务有没有集中报错？</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>错误是否集中在某个版本、Pod、节点、租户？</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>这条 trace 对应哪些日志？</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>日志里是否出现同一个异常栈？</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


## Loki 是什么

Loki 是一个水平可扩展、高可用、多租户日志聚合系统，设计灵感来自 Prometheus。

最核心设计：

```text
Loki 不索引日志全文内容
Loki 索引 labels
日志内容压缩后放 chunks
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Loki 不索引日志全文内容</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>Loki 索引 labels</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>日志内容压缩后放 chunks</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


这和 Elasticsearch 很不一样。

| 维度 | Loki | Elasticsearch |
|---|---|---|
| 索引策略 | 主要索引 labels | 倒排索引大量字段/全文 |
| 查询方式 | 先 label 选 stream，再过滤内容 | 字段/全文检索强 |
| 成本 | 通常更低 | 索引成本更高 |
| 最适合 | 云原生日志、和指标标签关联 | 复杂全文搜索、字段检索 |
| 风险 | label 高基数会很痛 | mapping/index 管理复杂 |

Loki 不是“廉价版 Elasticsearch”。它是不同设计取舍。用 Loki 必须接受一个原则：

```text
标签少而稳，内容用 LogQL 过滤。
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>标签少而稳，内容用 LogQL 过滤。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


## Log stream

Log stream 是 Loki 的基本日志组织单位。

一个 stream 由一组 labels 唯一确定。

例如：

```text
{cluster="prod", namespace="aiops", app="checkout-api", pod="checkout-api-7d9f"}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{cluster="prod", namespace="aiops", app="checkout-api", pod="checkout-api-7d9f"}</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


所有 labels 完全相同的日志属于同一个 stream。

如果 pod label 不同，就是不同 stream。

如果你把 request_id 放进 label：

```text
{app="checkout-api", request_id="abc"}
{app="checkout-api", request_id="def"}
{app="checkout-api", request_id="ghi"}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{app="checkout-api", request_id="abc"}</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>{app="checkout-api", request_id="def"}</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>{app="checkout-api", request_id="ghi"}</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


每个请求都可能变成新 stream。Loki 会创建大量小 stream、小 chunks、小索引项，性能和成本都会变差。

## Labels

Labels 是 Loki 查询入口。

好 labels：

```text
cluster
namespace
app
container
job
env
level
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>cluster</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>namespace</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>app</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>container</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>job</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 6 行 | <code>env</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 7 行 | <code>level</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


坏 labels：

```text
request_id
trace_id
user_id
order_id
ip
timestamp
pod_uid
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>request_id</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>trace_id</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>user_id</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>order_id</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>ip</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 6 行 | <code>timestamp</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 7 行 | <code>pod_uid</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


官方文档明确强调高基数 labels 会显著影响 Loki 性能和成本。Loki 默认也限制 index labels 数量。

原则：

```text
低基数字段做 label
高基数字段留在日志内容或 structured metadata
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>低基数字段做 label</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>高基数字段留在日志内容或 structured metadata</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


低基数：

```text
env=prod/staging/dev
level=info/warn/error
namespace=aiops/platform/default
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>env=prod/staging/dev</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>level=info/warn/error</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>namespace=aiops/platform/default</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


高基数：

```text
user_id=千万用户
trace_id=每个请求不同
timestamp=每行不同
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>user_id=千万用户</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>trace_id=每个请求不同</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>timestamp=每行不同</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


## Chunks 和 index

Loki 存储时：

```text
log stream
  -> append log entries
  -> buffer in ingester
  -> compress into chunks
  -> store chunks in object storage/filesystem
  -> index records label -> chunk references
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>log stream</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; append log entries</code> | 这一行要理解这些英文词：`append log entries` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; buffer in ingester</code> | 这一行要理解这些英文词：`buffer in ingester` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; compress into chunks</code> | 这一行要理解这些英文词：`compress into chunks` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; store chunks in object storage/filesystem</code> | 这一行要理解这些英文词：`store chunks in object storage` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`filesystem` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>  -&gt; index records label -&gt; chunk references</code> | 这一行要理解这些英文词：`index records label` 是index=索引或目录；`chunk references` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


查询时：

```text
LogQL label selector
  -> 查 index 找到相关 chunks
  -> 读取 chunks
  -> 在 chunk 内容里执行过滤和解析
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>LogQL label selector</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; 查 index 找到相关 chunks</code> | 这一行要理解这些英文词：`index` 是索引或目录；`chunks` 是多个数据分块。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; 读取 chunks</code> | 这一行要理解这些英文词：`chunks` 是多个数据分块。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; 在 chunk 内容里执行过滤和解析</code> | 这一行要理解这些英文词：`chunk` 是数据分块，把长文本或大数据拆成较小片段。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


这解释了为什么查询必须先写 label selector：

```text
{app="checkout-api"} |= "ERROR"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{app="checkout-api"} &#124;= "ERROR"</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


如果 label selector 太宽：

```text
{namespace=~".+"} |= "ERROR"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{namespace=~".+"} &#124;= "ERROR"</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


Loki 需要扫描很多 stream/chunks，查询会慢。

## 写入路径

Loki 写入路径：

```text
Client / Agent
  -> distributor
  -> hash ring
  -> ingester
  -> chunks
  -> object storage
  -> index
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Client / Agent</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; distributor</code> | 这一行要理解这些英文词：`distributor` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; hash ring</code> | 这一行要理解这些英文词：`hash ring` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; ingester</code> | 这一行要理解这些英文词：`ingester` 是摄取组件，负责接收并写入日志、指标或追踪数据。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; chunks</code> | 这一行要理解这些英文词：`chunks` 是多个数据分块。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>  -&gt; object storage</code> | 这一行要理解这些英文词：`object storage` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 7 行 | <code>  -&gt; index</code> | 这一行要理解这些英文词：`index` 是索引或目录。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


### distributor

接收写入请求，校验租户、labels、limits，然后把日志分发给 ingesters。

### ingester

维护内存中的 active streams，把日志写进 chunks，达到条件后 flush 到存储。

### object storage

保存 chunks 和索引相关数据。生产常用 S3、GCS、Azure Blob 或兼容对象存储。

本地实验可用 filesystem。

## 查询路径

查询路径：

```text
Grafana / logcli
  -> query frontend
  -> query scheduler
  -> querier
  -> ingesters for recent in-memory data
  -> object storage for persisted chunks
  -> result
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Grafana / logcli</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; query frontend</code> | 这一行要理解这些英文词：`query frontend` 是query=查询。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; query scheduler</code> | 这一行要理解这些英文词：`query scheduler` 是query=查询。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; querier</code> | 这一行要理解这些英文词：`querier` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; ingesters for recent in-memory data</code> | 这一行要理解这些英文词：`ingesters for recent in-memory data` 是data=数据。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>  -&gt; object storage for persisted chunks</code> | 这一行要理解这些英文词：`object storage for persisted chunks` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 7 行 | <code>  -&gt; result</code> | 这一行要理解这些英文词：`result` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


### query frontend

接收查询，做拆分、缓存、排队等。

### querier

真正执行查询，从 ingester 和存储读取数据。

### query scheduler

调度查询任务，避免大查询拖垮 querier。

查询慢时，不要只看 Grafana，要看：

- 时间范围是否太大。
- label selector 是否太宽。
- 是否用了高成本正则。
- querier/query-frontend 是否资源不足。
- object storage 是否慢。
- ingester 是否压力大。

## 组件

Loki 是模块化系统，可单体运行，也可拆成多个组件。

常见组件：

| 组件 | 作用 |
|---|---|
| distributor | 接收写入并分发 |
| ingester | 写入 chunks，保存近期数据 |
| querier | 执行查询 |
| query-frontend | 查询拆分、缓存、排队 |
| query-scheduler | 调度查询 |
| compactor | 压缩索引、处理保留策略 |
| ruler | 执行 LogQL 规则和告警 |
| index-gateway | 查询索引网关，常用于大规模部署 |
| gateway | 入口代理，常用于 Helm 部署 |

部署模式：

| 模式 | 说明 |
|---|---|
| single binary | 所有组件一个进程，适合本地和小规模 |
| simple scalable | read/write/backend 三类目标，适合中等规模 |
| microservices | 组件拆开独立扩缩，适合大规模 |

入门先用 single binary 理解概念，再学习 simple scalable。

## Hash ring

Loki 一些组件使用一致性哈希 ring 来分配数据和协调实例。

需要接入 ring 的组件包括：

- distributors。
- ingesters。
- query schedulers。
- compactors。
- rulers。

入门理解：

```text
ring 决定某个 stream 应该由哪些 ingester 负责
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ring 决定某个 stream 应该由哪些 ingester 负责</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


如果 ring 异常，可能出现：

- 写入失败。
- ingester 找不到。
- 数据复制异常。
- 查询近期日志不完整。

## Storage schema

Loki 使用 `schema_config` 定义存储 schema。

schema 是按时间段生效的：

```yaml
schema_config:
  configs:
    - from: 2024-01-01
      store: tsdb
      object_store: filesystem
      schema: v13
      index:
        prefix: index_
        period: 24h
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>schema_config:</code> | 定义 `schema_config` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  configs:</code> | 定义 `configs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    - from: 2024-01-01</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 4 行 | <code>      store: tsdb</code> | 设置 `store` 字段的值为 `tsdb`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 5 行 | <code>      object_store: filesystem</code> | 设置 `object_store` 字段的值为 `filesystem`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 6 行 | <code>      schema: v13</code> | 设置 `schema` 字段的值为 `v13`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 7 行 | <code>      index:</code> | 定义 `index` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 8 行 | <code>        prefix: index_</code> | 设置 `prefix` 字段的值为 `index_`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 9 行 | <code>        period: 24h</code> | 设置 `period` 字段的值为 `24h`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


字段：

| 字段 | 含义 |
|---|---|
| `from` | schema 生效开始日期 |
| `store` | 索引存储类型 |
| `object_store` | chunks/index 数据对象存储 |
| `schema` | schema 版本 |
| `index.prefix` | index 前缀 |
| `index.period` | index 周期 |

注意：schema 不是随便改的。生产变更前要看官方迁移文档和版本要求。

## 最小本地配置

本地实验配置示例：

```yaml
auth_enabled: false

server:
  http_listen_port: 3100

common:
  path_prefix: /tmp/loki
  storage:
    filesystem:
      chunks_directory: /tmp/loki/chunks
      rules_directory: /tmp/loki/rules
  replication_factor: 1
  ring:
    kvstore:
      store: inmemory

schema_config:
  configs:
    - from: 2024-01-01
      store: tsdb
      object_store: filesystem
      schema: v13
      index:
        prefix: index_
        period: 24h

ruler:
  alertmanager_url: http://localhost:9093
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>auth_enabled: false</code> | 设置 `auth_enabled` 字段的值为 `false`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 3 行 | <code>server:</code> | 定义 `server` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>  http_listen_port: 3100</code> | 设置 `http_listen_port` 字段的值为 `3100`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 5 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 6 行 | <code>common:</code> | 定义 `common` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 7 行 | <code>  path_prefix: /tmp/loki</code> | 设置 `path_prefix` 字段的值为 `/tmp/loki`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 8 行 | <code>  storage:</code> | 定义 `storage` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 9 行 | <code>    filesystem:</code> | 定义 `filesystem` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 10 行 | <code>      chunks_directory: /tmp/loki/chunks</code> | 设置 `chunks_directory` 字段的值为 `/tmp/loki/chunks`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 11 行 | <code>      rules_directory: /tmp/loki/rules</code> | 设置 `rules_directory` 字段的值为 `/tmp/loki/rules`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 12 行 | <code>  replication_factor: 1</code> | 设置 `replication_factor` 字段的值为 `1`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 13 行 | <code>  ring:</code> | 定义 `ring` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 14 行 | <code>    kvstore:</code> | 定义 `kvstore` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 15 行 | <code>      store: inmemory</code> | 设置 `store` 字段的值为 `inmemory`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 16 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 17 行 | <code>schema_config:</code> | 定义 `schema_config` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 18 行 | <code>  configs:</code> | 定义 `configs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 19 行 | <code>    - from: 2024-01-01</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 20 行 | <code>      store: tsdb</code> | 设置 `store` 字段的值为 `tsdb`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 21 行 | <code>      object_store: filesystem</code> | 设置 `object_store` 字段的值为 `filesystem`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 22 行 | <code>      schema: v13</code> | 设置 `schema` 字段的值为 `v13`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 23 行 | <code>      index:</code> | 定义 `index` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 24 行 | <code>        prefix: index_</code> | 设置 `prefix` 字段的值为 `index_`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 25 行 | <code>        period: 24h</code> | 设置 `period` 字段的值为 `24h`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 26 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 27 行 | <code>ruler:</code> | 定义 `ruler` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 28 行 | <code>  alertmanager_url: http://localhost:9093</code> | 设置 `alertmanager_url` 字段的值为 `http://localhost:9093`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


启动：

```bash
loki -config.file=loki-local.yaml
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>loki -config.file=loki-local.yaml</code> | 执行 `loki` 相关命令，后面的参数决定它具体操作什么对象。 |


健康检查：

```bash
curl -v http://127.0.0.1:3100/ready
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -v http://127.0.0.1:3100/ready</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |


## 采集端：Alloy、OTel Collector、Promtail

### Grafana Alloy

截至 2026-07-02，新项目应优先学习 Grafana Alloy。Alloy 是 Grafana 的 OpenTelemetry Collector distribution，可以采集 logs、metrics、traces，并把日志发送到 Loki。

它替代了历史上的 Promtail 路线。

### OpenTelemetry Collector

OTel Collector 也可以参与日志采集和转发，尤其适合统一遥测管道。

### Promtail

Promtail 曾是 Loki 常见日志采集 agent，负责：

- 发现目标。
- tail 日志文件。
- 添加 labels。
- 维护 positions。
- 发送到 Loki。

但 Promtail 已于 2026-03-02 EOL。现有系统需要迁移，新系统不要再把 Promtail 当长期方案。

## LogQL 基础

LogQL 是 Loki 查询语言。

一条最简单查询：

```text
{app="checkout-api"}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{app="checkout-api"}</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


含义：选择 label `app=checkout-api` 的所有日志流。

加内容过滤：

```text
{app="checkout-api"} |= "ERROR"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{app="checkout-api"} &#124;= "ERROR"</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


常见过滤：

| 写法 | 含义 |
|---|---|
| `|= "ERROR"` | 包含字符串 |
| `!= "healthcheck"` | 不包含字符串 |
| `|~ "5\\d\\d"` | 正则匹配 |
| `!~ "debug|trace"` | 正则不匹配 |

注意：先用 labels 缩小范围，再做内容过滤。

## LogQL parser

JSON 日志：

```text
{app="checkout-api"} | json | status_code >= 500
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{app="checkout-api"} &#124; json &#124; status_code &gt;= 500</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


logfmt 日志：

```text
{app="checkout-api"} | logfmt | level="error"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{app="checkout-api"} &#124; logfmt &#124; level="error"</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


pattern：

```text
{app="nginx"} | pattern `<ip> - - [<time>] "<method> <path> <_>" <status> <size>`
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{app="nginx"} &#124; pattern `&lt;ip&gt; - - [&lt;time&gt;] "&lt;method&gt; &lt;path&gt; &lt;_&gt;" &lt;status&gt; &lt;size&gt;`</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


line_format：

```text
{app="checkout-api"} | json | line_format "{{.status_code}} {{.path}} {{.msg}}"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{app="checkout-api"} &#124; json &#124; line_format "{{.status_code}} {{.path}} {{.msg}}"</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


label_format：

```text
{app="checkout-api"} | json | label_format status="{{.status_code}}"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{app="checkout-api"} &#124; json &#124; label_format status="{{.status_code}}"</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


谨慎：把高基数字段临时提取为查询时标签可以用于分析，但不要把它们作为 Loki index labels 长期写入。

## LogQL metric queries

从日志生成指标：

统计 5 分钟内 ERROR 行数：

```text
count_over_time({app="checkout-api"} |= "ERROR" [5m])
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>count_over_time({app="checkout-api"} &#124;= "ERROR" [5m])</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


按 pod 聚合：

```text
sum by (pod) (
  count_over_time({app="checkout-api"} |= "ERROR" [5m])
)
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>sum by (pod) (</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  count_over_time({app="checkout-api"} &#124;= "ERROR" [5m])</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>)</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


计算错误速率：

```text
sum by (app) (
  rate({app="checkout-api"} |= "ERROR" [5m])
)
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>sum by (app) (</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  rate({app="checkout-api"} &#124;= "ERROR" [5m])</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>)</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


解析 JSON 状态码后统计 5xx：

```text
sum by (app) (
  count_over_time({app="checkout-api"} | json | status_code >= 500 [5m])
)
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>sum by (app) (</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  count_over_time({app="checkout-api"} &#124; json &#124; status_code &gt;= 500 [5m])</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>)</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


这些查询可用于 Grafana 面板或 Loki ruler 告警。

## 日志告警

Loki ruler 可以基于 LogQL 产生告警，并发送到 Alertmanager。

示例：

```yaml
groups:
  - name: checkout-logs
    rules:
      - alert: CheckoutErrorLogsHigh
        expr: |
          sum by (app) (
            count_over_time({app="checkout-api"} |= "ERROR" [5m])
          ) > 20
        for: 10m
        labels:
          severity: warning
          team: platform
        annotations:
          summary: "checkout-api has too many ERROR logs"
          runbook_url: "https://example.com/runbooks/checkout-error-logs"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>groups:</code> | 定义 `groups` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  - name: checkout-logs</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 3 行 | <code>    rules:</code> | 定义 `rules` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>      - alert: CheckoutErrorLogsHigh</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 5 行 | <code>        expr: &#124;</code> | 设置 `expr` 字段的值为 `|`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 6 行 | <code>          sum by (app) (</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 7 行 | <code>            count_over_time({app="checkout-api"} &#124;= "ERROR" [5m])</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 8 行 | <code>          ) &gt; 20</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 9 行 | <code>        for: 10m</code> | 设置 `for` 字段的值为 `10m`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 10 行 | <code>        labels:</code> | 定义 `labels` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 11 行 | <code>          severity: warning</code> | 设置 `severity` 字段的值为 `warning`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 12 行 | <code>          team: platform</code> | 设置 `team` 字段的值为 `platform`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 13 行 | <code>        annotations:</code> | 定义 `annotations` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 14 行 | <code>          summary: "checkout-api has too many ERROR logs"</code> | 设置 `summary` 字段的值为 `"checkout-api has too many ERROR logs"`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 15 行 | <code>          runbook_url: "https://example.com/runbooks/checkout-error-logs"</code> | 设置 `runbook_url` 字段的值为 `"https://example.com/runbooks/checkout-error-logs"`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


日志告警要谨慎：

- 日志格式变动会影响告警。
- ERROR 不一定等于用户影响。
- 采样/丢日志会影响准确性。
- 要避免每条错误日志触发一条告警。

## 多租户

Loki 支持多租户。HTTP 请求中通常通过 tenant header 区分。

常见 header：

```text
X-Scope-OrgID
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>X-Scope-OrgID</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


本地实验常禁用：

```yaml
auth_enabled: false
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>auth_enabled: false</code> | 设置 `auth_enabled` 字段的值为 `false`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


生产多租户要设计：

- tenant 边界。
- 认证授权。
- per-tenant limits。
- retention。
- 查询隔离。

## Retention 和 compactor

日志不能无限存。

Loki 使用 compactor 等机制处理压缩和保留策略。

设计 retention 时要问：

- 业务日志保留多久？
- 审计日志保留多久？
- debug 日志是否更短？
- 不同租户是否不同？
- 删除是否满足合规要求？

不要等对象存储爆了再讨论 retention。

## 常用命令字典

### 启动 Loki

```bash
loki -config.file=loki-local.yaml
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>loki -config.file=loki-local.yaml</code> | 执行 `loki` 相关命令，后面的参数决定它具体操作什么对象。 |


### 检查 ready

```bash
curl -v http://127.0.0.1:3100/ready
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -v http://127.0.0.1:3100/ready</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |


### 查询 labels

```bash
curl -s "http://127.0.0.1:3100/loki/api/v1/labels"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -s "http://127.0.0.1:3100/loki/api/v1/labels"</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |


### 查询某 label 的值

```bash
curl -s "http://127.0.0.1:3100/loki/api/v1/label/app/values"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -s "http://127.0.0.1:3100/loki/api/v1/label/app/values"</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |


### 即时查询

```bash
curl -G "http://127.0.0.1:3100/loki/api/v1/query" \
  --data-urlencode 'query={app="checkout-api"}'
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -G "http://127.0.0.1:3100/loki/api/v1/query" \</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |
| 第 2 行 | <code>  --data-urlencode 'query={app="checkout-api"}'</code> | 注释行，提前说明下面命令的目的或注意事项。 |


### 范围查询

```bash
curl -G "http://127.0.0.1:3100/loki/api/v1/query_range" \
  --data-urlencode 'query={app="checkout-api"} |= "ERROR"' \
  --data-urlencode 'limit=100'
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -G "http://127.0.0.1:3100/loki/api/v1/query_range" \</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |
| 第 2 行 | <code>  --data-urlencode 'query={app="checkout-api"} &#124;= "ERROR"' \</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 3 行 | <code>  --data-urlencode 'limit=100'</code> | 注释行，提前说明下面命令的目的或注意事项。 |


### Grafana Explore 查询

在 Grafana 里选择 Loki datasource，输入：

```text
{namespace="aiops", app="checkout-api"} |= "ERROR"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{namespace="aiops", app="checkout-api"} &#124;= "ERROR"</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


### Kubernetes 查看 Loki

```bash
kubectl get pods -n observability -l app.kubernetes.io/name=loki
kubectl logs -n observability -l app.kubernetes.io/name=loki --tail=200
kubectl get svc -n observability
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>kubectl get pods -n observability -l app.kubernetes.io/name=loki</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |
| 第 2 行 | <code>kubectl logs -n observability -l app.kubernetes.io/name=loki --tail=200</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 3 行 | <code>kubectl get svc -n observability</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |


## 配置字典

### server

| 字段 | 作用 |
|---|---|
| `http_listen_port` | HTTP API 端口，常见 3100 |
| `grpc_listen_port` | gRPC 端口 |

### common

| 字段 | 作用 |
|---|---|
| `path_prefix` | 本地路径前缀 |
| `storage` | 通用存储配置 |
| `replication_factor` | 复制因子 |
| `ring` | ring 配置 |

### schema_config

| 字段 | 作用 |
|---|---|
| `from` | schema 生效日期 |
| `store` | 索引存储 |
| `object_store` | 对象存储 |
| `schema` | schema 版本 |
| `index.period` | 索引周期 |

### storage_config

| 字段 | 作用 |
|---|---|
| `filesystem` | 本地文件系统存储 |
| `aws` | S3 存储 |
| `gcs` | Google Cloud Storage |
| `azure` | Azure Blob |

### limits_config

| 字段 | 作用 |
|---|---|
| `retention_period` | 保留周期 |
| `ingestion_rate_mb` | 写入速率限制 |
| `max_label_names_per_series` | 每个 stream label 数限制 |
| `reject_old_samples` | 是否拒绝旧样本 |
| `max_query_length` | 查询时间范围限制 |

## AIOps 入门实验

目标：启动本地 Loki，写入几条带 label 的日志，用 LogQL 查询和统计。

### 1. 启动 Loki

保存 `loki-local.yaml`，使用上面的最小配置。

启动：

```bash
loki -config.file=loki-local.yaml
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>loki -config.file=loki-local.yaml</code> | 执行 `loki` 相关命令，后面的参数决定它具体操作什么对象。 |


检查：

```bash
curl -v http://127.0.0.1:3100/ready
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -v http://127.0.0.1:3100/ready</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |


### 2. 手工写入日志

Loki push API 示例：

```bash
curl -X POST "http://127.0.0.1:3100/loki/api/v1/push" \
  -H "Content-Type: application/json" \
  -d '{
    "streams": [
      {
        "stream": {
          "app": "checkout-api",
          "env": "lab",
          "level": "error"
        },
        "values": [
          [ "1893456000000000000", "ERROR payment timeout trace_id=abc123 status_code=504" ]
        ]
      }
    ]
  }'
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -X POST "http://127.0.0.1:3100/loki/api/v1/push" \</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |
| 第 2 行 | <code>  -H "Content-Type: application/json" \</code> | 执行 `-h` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>  -d '{</code> | 执行 `-d` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 4 行 | <code>    "streams": [</code> | 执行 `"streams":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 5 行 | <code>      {</code> | 执行 `{` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 6 行 | <code>        "stream": {</code> | 执行 `"stream":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 7 行 | <code>          "app": "checkout-api",</code> | 执行 `"app":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 8 行 | <code>          "env": "lab",</code> | 执行 `"env":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 9 行 | <code>          "level": "error"</code> | 执行 `"level":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 10 行 | <code>        },</code> | 执行 `},` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 11 行 | <code>        "values": [</code> | 执行 `"values":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 12 行 | <code>          [ "1893456000000000000", "ERROR payment timeout trace_id=abc123 status_code=504" ]</code> | 执行 `[` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 13 行 | <code>        ]</code> | 执行 `]` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 14 行 | <code>      }</code> | 执行 `}` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 15 行 | <code>    ]</code> | 执行 `]` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 16 行 | <code>  }'</code> | 执行 `}'` 相关命令，后面的参数决定它具体操作什么对象。 |


时间戳是纳秒。实验时请替换成当前时间的纳秒时间戳，否则查询时间范围可能查不到。

PowerShell 获取纳秒时间戳可以用：

```powershell
[int64](([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()) * 1000000)
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>[int64](([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()) * 1000000)</code> | 执行 `[int64](([datetimeoffset]::utcnow.tounixtimemilliseconds())` 相关命令，后面的参数决定它具体操作什么对象。 |


### 3. 查询日志

```bash
curl -G "http://127.0.0.1:3100/loki/api/v1/query_range" \
  --data-urlencode 'query={app="checkout-api"} |= "ERROR"' \
  --data-urlencode 'limit=20'
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -G "http://127.0.0.1:3100/loki/api/v1/query_range" \</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |
| 第 2 行 | <code>  --data-urlencode 'query={app="checkout-api"} &#124;= "ERROR"' \</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 3 行 | <code>  --data-urlencode 'limit=20'</code> | 注释行，提前说明下面命令的目的或注意事项。 |


### 4. LogQL 指标化

```text
count_over_time({app="checkout-api"} |= "ERROR" [5m])
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>count_over_time({app="checkout-api"} &#124;= "ERROR" [5m])</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


在 Grafana Explore 里执行，观察结果。

### 5. 形成学习证据

记录：

```text
labels:
为什么这些 labels 是低基数:
查询语句:
错误日志内容:
count_over_time 结果:
如果查不到，我检查了哪些时间范围和 labels:
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>labels:</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>为什么这些 labels 是低基数:</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>查询语句:</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>错误日志内容:</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>count_over_time 结果:</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 6 行 | <code>如果查不到，我检查了哪些时间范围和 labels:</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


## 典型故障排查表

| 现象 | 先看什么 | 常见原因 | 处理思路 |
|---|---|---|---|
| 查不到日志 | 时间范围、labels | 时间戳不在范围、label 错、tenant 错 | 查 labels API 和 query_range |
| Grafana 无数据源 | datasource 配置 | URL/tenant/auth 错 | 测 `/ready` 和 datasource |
| 日志写入失败 | Loki logs、client logs | label 太多、时间太旧、限流 | 查 limits_config |
| 查询很慢 | LogQL selector | selector 太宽、时间太长、正则重 | 缩小 labels 和时间范围 |
| Loki 内存高 | streams/cardinality | 高基数 labels | 移除 request_id/user_id 等 labels |
| chunks 很碎 | stream 太多 | 高基数导致小 chunks | 调整 label 设计 |
| 告警误报 | LogQL rule | 日志格式变、ERROR 语义不稳 | 改解析和阈值 |
| 近期日志不完整 | ingester | ingester 异常、ring 问题 | 查 ingester/ring |
| 历史日志查不到 | storage/schema | 对象存储/schema/retention | 查 storage_config 和 compactor |
| Promtail 配置过时 | Promtail EOL | 仍使用 Promtail | 迁移 Alloy |

## 排障流程：查不到日志

### 1. 确认 Loki ready

```bash
curl -v http://loki:3100/ready
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -v http://loki:3100/ready</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |


### 2. 查 label 是否存在

```bash
curl -s "http://loki:3100/loki/api/v1/labels"
curl -s "http://loki:3100/loki/api/v1/label/app/values"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -s "http://loki:3100/loki/api/v1/labels"</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |
| 第 2 行 | <code>curl -s "http://loki:3100/loki/api/v1/label/app/values"</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |


### 3. 缩小查询

先查最宽的低基数 label：

```text
{app="checkout-api"}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{app="checkout-api"}</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


再加过滤：

```text
{app="checkout-api"} |= "ERROR"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{app="checkout-api"} &#124;= "ERROR"</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


### 4. 检查时间范围

Grafana Explore 默认时间范围可能太短。扩大到最近 6 小时或 24 小时。

如果手工 push，确认 timestamp 是当前纳秒时间戳。

### 5. 检查 tenant

多租户环境确认 `X-Scope-OrgID` 或 Grafana datasource tenant 设置。

## 排障流程：查询很慢

看查询：

```text
{namespace=~".+"} |~ ".*error.*"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{namespace=~".+"} &#124;~ ".*error.*"</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


问题：

- selector 太宽。
- 时间范围可能太大。
- 正则太重。
- 没有先用 labels 缩小。

优化：

```text
{namespace="aiops", app="checkout-api"} |= "ERROR"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{namespace="aiops", app="checkout-api"} &#124;= "ERROR"</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


再逐步加 parser：

```text
{namespace="aiops", app="checkout-api"} | json | level="error"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{namespace="aiops", app="checkout-api"} &#124; json &#124; level="error"</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


原则：

```text
先 label 过滤，再内容过滤，再解析，再聚合。
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>先 label 过滤，再内容过滤，再解析，再聚合。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


## 排障流程：高基数

症状：

- Loki 内存上升。
- ingester 压力高。
- 查询慢。
- chunks 很碎。
- index 增长快。

检查 labels：

```bash
curl -s "http://loki:3100/loki/api/v1/labels"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -s "http://loki:3100/loki/api/v1/labels"</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |


找危险 label：

```text
request_id
trace_id
user_id
pod_uid
ip
timestamp
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>request_id</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>trace_id</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>user_id</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>pod_uid</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>ip</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 6 行 | <code>timestamp</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


处理：

- 从 index labels 移除高基数字段。
- 保留在日志正文或 structured metadata。
- 用 LogQL parser 查询时提取。
- 对需要关联 trace 的日志，把 trace_id 放正文或结构化字段，不做 Loki label。

## AIOps 自动化诊断脚本

```bash
#!/usr/bin/env bash
set -euo pipefail

loki="${1:-http://loki:3100}"
query="${2:-{app=\"checkout-api\"}}"

echo "== ready =="
curl -s "$loki/ready" || true

echo
echo "== labels =="
curl -s "$loki/loki/api/v1/labels" || true

echo
echo "== query =="
curl -G "$loki/loki/api/v1/query_range" \
  --data-urlencode "query=$query" \
  --data-urlencode "limit=20" || true
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>#!/usr/bin/env bash</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 2 行 | <code>set -euo pipefail</code> | 设置 shell 或工具变量，具体含义取决于当前终端环境。 |
| 第 3 行 | <em>空行</em> | 空行，用来把命令分成更容易阅读的几段。 |
| 第 4 行 | <code>loki="${1:-http://loki:3100}"</code> | 执行 `loki="${1:-http://loki:3100}"` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 5 行 | <code>query="${2:-{app=\"checkout-api\"}}"</code> | 执行 `query="${2:-{app=\"checkout-api\"}}"` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 6 行 | <em>空行</em> | 空行，用来把命令分成更容易阅读的几段。 |
| 第 7 行 | <code>echo "== ready =="</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 8 行 | <code>curl -s "$loki/ready" &#124;&#124; true</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |
| 第 9 行 | <em>空行</em> | 空行，用来把命令分成更容易阅读的几段。 |
| 第 10 行 | <code>echo</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 11 行 | <code>echo "== labels =="</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 12 行 | <code>curl -s "$loki/loki/api/v1/labels" &#124;&#124; true</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |
| 第 13 行 | <em>空行</em> | 空行，用来把命令分成更容易阅读的几段。 |
| 第 14 行 | <code>echo</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 15 行 | <code>echo "== query =="</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 16 行 | <code>curl -G "$loki/loki/api/v1/query_range" \</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |
| 第 17 行 | <code>  --data-urlencode "query=$query" \</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 18 行 | <code>  --data-urlencode "limit=20" &#124;&#124; true</code> | 注释行，提前说明下面命令的目的或注意事项。 |


生产化前要补：

- tenant header。
- 自动检查时间范围。
- 查询 label cardinality。
- 采集 Loki 组件 logs。
- 保存 Grafana explore URL。
- 和 Alertmanager alert labels 联动生成 LogQL。

## 面试怎么讲

Loki 是受 Prometheus 启发的日志聚合系统。它和全文索引日志系统不同，Loki 主要索引 labels，不索引日志全文内容；日志内容按 stream 压缩成 chunks 存储到对象存储或本地文件系统。查询时先用 LogQL 的 label selector 找到相关 stream 和 chunks，再对日志内容做字符串、正则、JSON/logfmt/pattern 解析和聚合。Loki 的性能高度依赖标签设计，低基数标签能快速定位日志流，高基数标签如 request_id、user_id、trace_id 会造成大量 stream 和小 chunks，显著降低性能并增加成本。排障时我会先看时间范围、labels、tenant、写入客户端、Loki ready、组件日志，再分析 LogQL 是否过宽。

## 小白可能会问

### Loki 会索引日志全文吗？

不会像 Elasticsearch 那样索引全文。Loki 主要索引 labels，日志内容压缩成 chunks，查询时再过滤内容。

### 为什么不能把 trace_id 放 label？

trace_id 通常每个请求不同，是高基数字段。放 label 会创建大量 stream，影响性能和成本。可以放日志内容或 structured metadata，用查询时解析。

### labels 越多越好吗？

不是。Loki 标签要少而稳定。标签越多、基数越高，stream 越多，系统越难跑。

### 查不到日志第一步看什么？

先看时间范围和 label 是否存在。很多“查不到”是时间范围太窄、label 名不对、tenant 不对。

### Promtail 还能新项目使用吗？

不建议。Promtail 已在 2026-03-02 EOL，新项目应优先使用 Grafana Alloy 或其他受支持客户端。

## 学习路线

第一阶段：模型

- log stream。
- labels。
- chunks。
- index。
- cardinality。

第二阶段：查询

- label selector。
- line filters。
- parsers。
- metric queries。
- Grafana Explore。

第三阶段：架构

- distributor。
- ingester。
- querier。
- query frontend。
- compactor。
- ruler。

第四阶段：采集

- Grafana Alloy。
- OTel Collector。
- Kubernetes logs。
- Promtail 历史迁移。

第五阶段：AIOps

- 日志告警。
- 告警 label 转 LogQL。
- trace_id 日志关联。
- 错误模式聚合。
- 自动诊断报告。

## 学习检查清单

- [ ] 我能解释 Loki 和 Elasticsearch 的核心差异。
- [ ] 我能解释 Loki 为什么主要索引 labels。
- [ ] 我能解释 log stream 是什么。
- [ ] 我能说出哪些 label 是低基数，哪些是高基数。
- [ ] 我能解释 chunks 和 index 的关系。
- [ ] 我能写基础 LogQL label selector。
- [ ] 我能使用 `|=`、`!=`、`|~`、`!~`。
- [ ] 我能使用 `| json`、`| logfmt`、`| pattern`。
- [ ] 我能写 `count_over_time` 和 `rate` 查询。
- [ ] 我能解释 distributor、ingester、querier、query frontend。
- [ ] 我能解释 compactor 和 ruler 的作用。
- [ ] 我知道 Promtail 已 EOL，知道应学习 Alloy。
- [ ] 我能排查查不到日志。
- [ ] 我能排查查询慢。
- [ ] 我能识别高基数 label 问题。
- [ ] 我能把 Loki 查询写进 AIOps runbook。

## 面试题

1. Loki 解决什么问题？
2. Loki 和 Elasticsearch 最大设计差异是什么？
3. Loki 为什么不适合把 request_id 做 label？
4. 什么是 log stream？
5. labels、chunks、index 的关系是什么？
6. Loki 写入路径经过哪些组件？
7. Loki 查询路径经过哪些组件？
8. distributor 和 ingester 分别做什么？
9. query frontend 和 querier 分别做什么？
10. compactor 做什么？
11. ruler 做什么？
12. LogQL `{app="api"} |= "ERROR"` 是什么意思？
13. `| json` 和 `| logfmt` 用来做什么？
14. 如何从日志生成指标？
15. 查询很慢你会怎么优化 LogQL？
16. 查不到日志你会怎么排查？
17. 什么是高基数？它为什么伤害 Loki？
18. Promtail 当前状态是什么？新项目应该用什么？
19. Loki 如何和 Alertmanager 结合？
20. Loki 在 AIOps 根因分析中有什么价值？

## 学习证据

完成本篇后，建议留下这些证据：

- 一个 `loki-local.yaml` 本地配置。
- 一份手工 push 日志的 API 示例。
- 一份 LogQL 查询笔记，包含 label selector、line filter、parser、metric query。
- 一份高基数 label 反例说明。
- 一份“查不到日志”的排障记录。
- 一个 Loki 诊断脚本，能检查 ready、labels、query_range 和 tenant。
