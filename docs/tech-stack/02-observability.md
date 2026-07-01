# 02：可观测性技术栈

可观测性是 AIOps 的数据入口。没有指标、日志、链路追踪和告警，后面的异常检测、告警降噪、根因分析都没有可靠输入。

## 可观测性总模型

```text
应用 / 主机 / 容器 / K8s
  -> metrics / logs / traces
  -> collectors / exporters / agents
  -> storage
  -> dashboards / alerts / analysis
  -> AIOps detection / correlation / runbook
```

## Prometheus

### 是什么

Prometheus 是开源监控和告警工具，主要用于采集、存储和查询时间序列指标。

### 原理

Prometheus 默认采用 pull 模型：服务暴露 `/metrics` HTTP 端点，Prometheus 按固定间隔抓取指标并存入本地时序数据库。查询使用 PromQL。

### 架构

```text
Targets / Exporters
  -> Prometheus scrape
  -> Time Series Database
  -> PromQL
  -> Grafana / Alert rules
  -> Alertmanager
```

核心组件：

- Prometheus Server：抓取、存储、查询指标。
- Exporter：把系统或中间件指标转换成 Prometheus 格式。
- Pushgateway：接收短生命周期任务推送的指标。
- Alertmanager：接收告警并负责分组、抑制、路由、通知。
- Service Discovery：自动发现抓取目标。

### 在 AIOps 中的作用

- 提供 CPU、内存、延迟、错误率、QPS 等基础数据。
- 为异常检测提供历史时间序列。
- 为告警治理提供原始告警规则。
- 为 SLO 提供可量化指标。

### 配置重点

最小 `prometheus.yml`：

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: "prometheus"
    static_configs:
      - targets: ["localhost:9090"]
```

常见配置项：

- `scrape_interval`：抓取周期。
- `scrape_configs`：抓取目标。
- `relabel_configs`：标签重写。
- `rule_files`：告警规则文件。
- `alerting.alertmanagers`：Alertmanager 地址。

常见端口：

- Prometheus：`9090`
- node_exporter：`9100`
- Alertmanager：`9093`

### 入门练习

1. 启动 Prometheus。
2. 抓取 Prometheus 自己的 `/metrics`。
3. 查询 `up`。
4. 写一条学习记录：Prometheus 如何知道目标是否在线？

### 官方资料

- [Prometheus overview](https://prometheus.io/docs/introduction/overview/)

## Alertmanager

### 是什么

Alertmanager 是 Prometheus 生态里的告警处理组件。

### 原理

Prometheus 规则触发后把告警发给 Alertmanager。Alertmanager 根据标签进行分组、去重、抑制、静默和路由，然后发给邮件、Webhook、IM 或值班系统。

### 架构

```text
Prometheus alert rules
  -> Alertmanager
  -> group / inhibit / silence / route
  -> receiver: email / webhook / chat / on-call
```

### 在 AIOps 中的作用

- 告警降噪的第一层。
- AIOps 事件聚合的输入。
- 把告警转成 webhook 后，可以进入自动分析或 runbook 流程。

### 配置重点

最小配置结构：

```yaml
route:
  receiver: "default"
  group_by: ["alertname", "service"]
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h

receivers:
  - name: "default"
    webhook_configs:
      - url: "http://localhost:8080/alerts"
```

关键概念：

- `group_by`：哪些标签相同就合并成一组。
- `group_wait`：等一会儿再发，避免告警风暴。
- `repeat_interval`：重复提醒间隔。
- `silence`：人工静默。
- `inhibit`：一个高级告警触发后抑制低级告警。

### 入门练习

写一个模拟告警 JSON，手工 POST 到一个本地 webhook，记录告警里哪些字段对 AIOps 有用。

## Grafana

### 是什么

Grafana 是数据可视化和告警平台，常用来展示 Prometheus、Loki、Elasticsearch 等数据。

### 原理

Grafana 连接数据源，执行查询，渲染成面板和仪表盘。Grafana Alerting 可以基于指标或日志创建告警规则。

### 架构

```text
Data sources: Prometheus / Loki / Elasticsearch
  -> Grafana query
  -> dashboard panels
  -> alert rules
  -> contact points
```

### 在 AIOps 中的作用

- 给人看：故障时快速判断系统状态。
- 给项目展示：你的 GitHub 项目可以截图展示仪表盘。
- 给告警治理提供可视化入口。

### 配置重点

- Data source：配置 Prometheus/Loki/Elasticsearch 地址。
- Dashboard：组织面板。
- Variables：按服务、实例、环境筛选。
- Alerting：规则、联系人、通知策略。

### 入门练习

做一个 “服务健康仪表盘”：

- QPS
- 错误率
- P95 延迟
- CPU
- 内存
- 最近告警数

### 官方资料

- [Grafana documentation](https://grafana.com/docs/)
- [Grafana Alerting](https://grafana.com/docs/grafana/latest/alerting/)

## OpenTelemetry

### 是什么

OpenTelemetry 是开放的可观测性框架和标准，用于生成、采集、处理和导出 traces、metrics、logs 等遥测数据。

### 原理

应用通过 SDK 或自动 instrumentation 产生遥测数据；OpenTelemetry Collector 接收数据，经过 processors 处理，再 export 到 Prometheus、Jaeger、Tempo、Loki、Elastic 等后端。

### 架构

```text
Application
  -> OTel SDK / auto-instrumentation
  -> OTel Collector receivers
  -> processors
  -> exporters
  -> observability backend
```

Collector pipeline：

```yaml
receivers:
  otlp:
    protocols:
      grpc:
      http:

processors:
  batch:

exporters:
  logging:

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [logging]
```

### 在 AIOps 中的作用

- 统一采集 metrics、logs、traces。
- 让链路追踪和日志、指标关联起来。
- 为根因分析提供调用链上下文。
- 避免工具锁定，后端可以更换。

### 配置重点

- Receiver：接收什么协议的数据，如 OTLP、Prometheus。
- Processor：批量、过滤、添加属性、采样。
- Exporter：导出到哪里。
- Pipeline：把 receiver、processor、exporter 串起来。

常见端口：

- OTLP gRPC：`4317`
- OTLP HTTP：`4318`

### 入门练习

启动 Collector，让它接收 OTLP 数据并打印到日志。先理解 pipeline，不急着接复杂后端。

### 官方资料

- [OpenTelemetry docs](https://opentelemetry.io/docs/)
- [OpenTelemetry Collector](https://opentelemetry.io/docs/collector/)
- [Collector architecture](https://opentelemetry.io/docs/collector/architecture/)

## Grafana Loki

### 是什么

Loki 是 Grafana 生态里的日志聚合系统。它更关注标签索引，不像 Elasticsearch 那样默认全文索引所有内容。

### 原理

日志通过 Promtail、Grafana Alloy 或其他采集器进入 Loki。Loki 根据标签组织日志流，日志内容压缩存储，查询使用 LogQL。

### 架构

```text
Application logs
  -> log agent
  -> Loki
  -> LogQL
  -> Grafana dashboard / alert
```

### 在 AIOps 中的作用

- 分析错误日志模式。
- 做日志量突增/突降告警。
- 与 Prometheus 指标一起定位问题。
- 为告警摘要和 runbook 推荐提供原始上下文。

### 配置重点

- 标签不要太多，否则会导致高基数问题。
- 日志内容适合保留原文，查询时再过滤。
- 常见查询：

```text
{app="demo"} |= "ERROR"
rate({app="demo"}[5m])
```

### 官方资料

- [Grafana Loki docs](https://grafana.com/docs/loki/latest/)
- [Loki alerting rules](https://grafana.com/docs/loki/latest/alert/)

## Elasticsearch

### 是什么

Elasticsearch 是分布式搜索和分析引擎，常用于日志检索、全文搜索和安全分析。

### 原理

数据写入 index，index 被拆成 shard，shard 分布在不同 node 上。每个 shard 是一个 Lucene 索引。通过倒排索引实现高效搜索。

### 架构

```text
Log / document
  -> ingest pipeline
  -> index
  -> primary shards / replica shards
  -> nodes
  -> search / aggregation
```

### 在 AIOps 中的作用

- 日志检索和聚合。
- 错误模式分析。
- 大规模日志查询。
- 可与 Kibana/Elastic ML 做异常检测。

### 配置重点

- Index：逻辑数据集合。
- Shard：物理分片。
- Replica：副本，提高可用性和查询能力。
- Node roles：master、data、ingest 等。
- Ingest pipeline：写入前处理和丰富文档。

### 入门练习

导入一份应用日志，按 `level`、`service`、`timestamp` 查询错误数，写一篇“日志字段设计”学习记录。

### 官方资料

- [Elastic: clusters, nodes, shards](https://www.elastic.co/docs/deploy-manage/distributed-architecture/clusters-nodes-shards)
- [Elastic node roles](https://www.elastic.co/docs/deploy-manage/distributed-architecture/clusters-nodes-shards/node-roles)
