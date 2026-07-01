# Grafana Loki

> 目标：理解 Loki 的标签索引思想，能采集日志、用 LogQL 查询错误日志，并基于日志做告警。

## 官方资料

- [Grafana Loki documentation](https://grafana.com/docs/loki/latest/)
- [Loki architecture](https://grafana.com/docs/loki/latest/get-started/architecture/)
- [Query Loki](https://grafana.com/docs/loki/latest/query/)
- [Loki alerting rules](https://grafana.com/docs/loki/latest/alert/)

说明：本文是基于 Grafana Loki 官方文档整理的原创中文教程，不复制官方全文。

## 是什么

Loki 是日志聚合系统。它和 Prometheus 思路相似，使用标签组织数据，但 Loki 主要处理日志。

## 核心原理

Loki 与 Elasticsearch 最大不同是：Loki 主要索引日志标签，不默认全文索引日志内容。日志内容压缩成 chunks 存储，查询时再过滤。

```text
Application logs
  -> agent: Promtail / Grafana Alloy / OTel Collector
  -> Loki
       labels index
       compressed chunks
  -> LogQL
  -> Grafana
```

## 架构

Loki 可以单体运行，也可以微服务运行。核心组件包括：

- Distributor：接收日志。
- Ingester：写入日志块。
- Querier：查询日志。
- Query frontend：优化查询。
- Compactor：压缩和保留策略处理。
- Store：对象存储或本地文件系统。

零基础先用单体模式理解即可。

## 标签设计

标签是 Loki 的关键。

适合做标签：

- app
- service
- env
- namespace
- pod
- host

不适合做标签：

- request_id
- user_id
- order_id
- 完整错误消息

原因：高基数标签会让索引膨胀，影响性能。

## LogQL 入门

查询某应用日志：

```text
{app="demo"}
```

包含 ERROR：

```text
{app="demo"} |= "ERROR"
```

排除 health check：

```text
{app="demo"} != "/health"
```

5 分钟错误日志速率：

```text
rate({app="demo"} |= "ERROR" [5m])
```

按 service 聚合：

```text
sum by (service) (rate({env="prod"} |= "ERROR" [5m]))
```

## 在 AIOps 中的作用

- 通过日志识别错误模式。
- 和指标一起定位问题。
- 从错误日志生成告警摘要。
- 为 RAG/runbook 推荐提供上下文。
- 检测日志量突增或突降。

## 最小本地实验

用 Docker Compose 启动 Loki 和 Grafana，然后把 demo 日志写入 Loki。

学习步骤：

1. 启动 Loki。
2. Grafana 添加 Loki 数据源。
3. 采集一份 demo app 日志。
4. 查询 `{app="demo"} |= "ERROR"`。
5. 写一个日志告警规则。

## 日志告警思路

不要只因为出现一个 ERROR 就告警，优先使用速率和持续时间：

```text
sum by (service) (rate({env="prod"} |= "ERROR" [5m])) > 1
```

含义：5 分钟窗口里错误日志速率超过阈值。

## 排障清单

### 查不到日志

- agent 是否采集到文件。
- label 是否写错。
- Grafana 时间范围是否正确。
- Loki 是否启动。

### 查询很慢

- 标签选择器是否太宽。
- 时间范围是否太大。
- 是否滥用高基数标签。

### 日志告警误报

- ERROR 是否代表真实用户影响。
- 是否需要按 service 聚合。
- 是否需要排除已知噪声。

## 学习证据

- `loki-config.yaml`
- Grafana Loki 数据源截图或说明
- 3 条 LogQL 查询记录
- 一篇记录：Loki 为什么不应该把 request_id 做标签
