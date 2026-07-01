# Grafana Loki

> 目标：理解 Loki 的标签索引思想，能采集日志、用 LogQL 查询错误日志，并基于日志做告警。

## 官方资料

- [Grafana Loki documentation](https://grafana.com/docs/loki/latest/)
- [Loki architecture](https://grafana.com/docs/loki/latest/get-started/architecture/)
- [Query Loki](https://grafana.com/docs/loki/latest/query/)
- [Loki alerting rules](https://grafana.com/docs/loki/latest/alert/)

说明：本文是基于 Grafana Loki 官方文档整理的原创中文教程，不复制官方全文。

## 为什么要学

指标能告诉你“错误率升高了”，但日志能告诉你“具体错误是什么”。Loki 用类似 Prometheus 的标签思想管理日志，和 Grafana 结合后，很适合在同一个界面里从指标跳到相关日志。

对 AIOps 来说，日志是异常解释、故障摘要、RAG 检索和 runbook 推荐的重要上下文。Loki 的标签设计也能帮助你理解“哪些字段适合做索引，哪些字段只能做内容过滤”。

## 是什么

Loki 是日志聚合系统。它和 Prometheus 思路相似，使用标签组织数据，但 Loki 主要处理日志。

## 它解决什么问题

- 集中收集多服务、多容器、多节点日志。
- 用标签快速定位某个服务、环境、Pod 或主机日志。
- 用 LogQL 查询错误日志、统计日志速率。
- 和 Grafana dashboard 联动排障。
- 基于日志模式做告警和异常摘要。
- 避免对所有日志内容做全文索引带来的高成本。

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

## 学习检查清单

- [ ] 我能解释 Loki 和 Elasticsearch 的主要差异。
- [ ] 我能说明 Loki 为什么强调标签设计。
- [ ] 我能写基础 LogQL 查询。
- [ ] 我能区分适合做标签和不适合做标签的字段。
- [ ] 我能用 Grafana 连接 Loki 数据源。
- [ ] 我能用 `|= "ERROR"` 查询错误日志。
- [ ] 我能写一个基于日志速率的告警思路。
- [ ] 我能说明日志在 AIOps 异常解释中的价值。

## 面试题

1. Loki 是什么？主要解决什么问题？
2. Loki 和 Elasticsearch 在索引思路上有什么区别？
3. 为什么 request_id 不适合做 Loki 标签？
4. LogQL 中 `{app="demo"} |= "ERROR"` 表示什么？
5. 日志告警为什么不建议看到一个 ERROR 就报警？
6. Loki 和 Grafana 如何配合排障？
7. 查询很慢时应该检查哪些方面？
8. 日志量突增可能代表哪些问题？
9. Loki 在 AIOps RAG 或故障摘要中有什么作用？
10. 如何设计一套服务日志标签？

## 学习证据

- `loki-config.yaml`
- Grafana Loki 数据源截图或说明
- 3 条 LogQL 查询记录
- 一篇记录：Loki 为什么不应该把 request_id 做标签
