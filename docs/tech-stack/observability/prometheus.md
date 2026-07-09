# Prometheus 精讲

> 学习目标：能启动 Prometheus，读懂 `prometheus.yml`，理解数据模型、指标类型、抓取、TSDB、PromQL、recording rules、alerting rules、HTTP API 和 `promtool`，并知道它在 AIOps 数据链路里的位置。

## 官方资料

- [Prometheus Overview](https://prometheus.io/docs/introduction/overview/)
- [Data model](https://prometheus.io/docs/concepts/data_model/)
- [Metric types](https://prometheus.io/docs/concepts/metric_types/)
- [Jobs and instances](https://prometheus.io/docs/concepts/jobs_instances/)
- [Getting started](https://prometheus.io/docs/prometheus/latest/getting_started/)
- [Configuration](https://prometheus.io/docs/prometheus/latest/configuration/configuration/)
- [Recording rules](https://prometheus.io/docs/prometheus/latest/configuration/recording_rules/)
- [Alerting rules](https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/)
- [PromQL basics](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [PromQL functions](https://prometheus.io/docs/prometheus/latest/querying/functions/)
- [HTTP API](https://prometheus.io/docs/prometheus/latest/querying/api/)
- [Storage](https://prometheus.io/docs/prometheus/latest/storage/)
- [prometheus command line](https://prometheus.io/docs/prometheus/latest/command-line/prometheus/)
- [promtool command line](https://prometheus.io/docs/prometheus/latest/command-line/promtool/)
- [Metric and label naming best practices](https://prometheus.io/docs/practices/naming/)
- [Histograms and summaries best practices](https://prometheus.io/docs/practices/histograms/)

说明：本文基于 Prometheus 官方文档和 AIOps 学习场景重新组织，不复制官方全文。官方文档负责定义概念和参数边界，本文负责把它讲成一条可以从 0 学会的路径。

## 场景开场

“告警又响了，接口超时，CPU 也高。现在先看哪儿？”

如果只会登录服务器执行 `top`，你只能看到此刻谁比较忙，但很难回答这些问题：

- 这个问题是刚发生，还是已经慢慢恶化了两小时？
- 是所有实例都慢，还是只有一台实例慢？
- 是 CPU 高导致接口慢，还是请求量上涨把 CPU 打高了？
- 错误率、延迟、请求量之间有没有时间顺序？
- 问题恢复以后，能不能把过程复盘成数据证据？

Prometheus 要解决的就是这类问题。它把系统状态变成时间序列指标：每隔一段时间采一次数字，把数字和标签存起来，然后让你用 PromQL 查询、画图、告警和复盘。

## 一句话人话版

Prometheus 是一个面向指标的监控和告警系统：它定时抓取 `/metrics`，把数字按时间存成时间序列，再用 PromQL 查询和计算。

## 学习边界

这一篇重点讲 Prometheus Server 本身：

- 数据模型：metric、label、sample、time series。
- 指标类型：Counter、Gauge、Histogram、Summary。
- 抓取模型：job、instance、target、scrape interval。
- 配置文件：`global`、`scrape_configs`、`rule_files`、`alerting`。
- PromQL：选择器、向量、范围、聚合、常用函数。
- 规则：recording rules 和 alerting rules。
- 命令和 API：`prometheus` flags、`promtool`、HTTP API。
- 存储和排障：TSDB、保留时间、高基数、target DOWN。

不在这一篇深入展开：

- Grafana dashboard 设计。
- Alertmanager 分组、抑制、静默和通知。
- Kubernetes service discovery 的完整配置。
- Thanos、Cortex、Mimir、VictoriaMetrics 等长期存储方案。

这些会在后续专题里讲。这里先把 Prometheus 的地基打稳。

## 官方知识地图

Prometheus 官方文档可以按这棵树理解：

```text
Prometheus docs
  ├── Introduction
  │   └── Overview: 是什么、适合什么、不适合什么
  ├── Concepts
  │   ├── Data model: metric、label、sample、time series
  │   ├── Metric types: Counter、Gauge、Histogram、Summary
  │   └── Jobs and instances: job、instance、target
  ├── Prometheus Server
  │   ├── Getting started and installation
  │   ├── Configuration
  │   ├── Recording rules
  │   └── Alerting rules
  ├── Querying
  │   ├── PromQL basics
  │   ├── Operators
  │   ├── Functions
  │   └── HTTP API
  ├── Storage
  │   ├── local TSDB
  │   ├── retention
  │   └── remote read / write
  ├── Command Line
  │   ├── prometheus
  │   └── promtool
  ├── Instrumenting
  │   ├── client libraries
  │   ├── exporters
  │   └── exposition formats
  └── Best practices
      ├── naming
      ├── histograms and summaries
      ├── alerting
      └── recording rules
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Prometheus docs</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  ├── Introduction</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 3 行 | <code>  │   └── Overview: 是什么、适合什么、不适合什么</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 4 行 | <code>  ├── Concepts</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 5 行 | <code>  │   ├── Data model: metric、label、sample、time series</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 6 行 | <code>  │   ├── Metric types: Counter、Gauge、Histogram、Summary</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 7 行 | <code>  │   └── Jobs and instances: job、instance、target</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 8 行 | <code>  ├── Prometheus Server</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 9 行 | <code>  │   ├── Getting started and installation</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 10 行 | <code>  │   ├── Configuration</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 11 行 | <code>  │   ├── Recording rules</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 12 行 | <code>  │   └── Alerting rules</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 13 行 | <code>  ├── Querying</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 14 行 | <code>  │   ├── PromQL basics</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 15 行 | <code>  │   ├── Operators</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 16 行 | <code>  │   ├── Functions</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 17 行 | <code>  │   └── HTTP API</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 18 行 | <code>  ├── Storage</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 19 行 | <code>  │   ├── local TSDB</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 20 行 | <code>  │   ├── retention</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 21 行 | <code>  │   └── remote read / write</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 22 行 | <code>  ├── Command Line</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 23 行 | <code>  │   ├── prometheus</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 24 行 | <code>  │   └── promtool</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 25 行 | <code>  ├── Instrumenting</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 26 行 | <code>  │   ├── client libraries</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 27 行 | <code>  │   ├── exporters</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 28 行 | <code>  │   └── exposition formats</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 29 行 | <code>  └── Best practices</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 30 行 | <code>      ├── naming</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 31 行 | <code>      ├── histograms and summaries</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 32 行 | <code>      ├── alerting</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 33 行 | <code>      └── recording rules</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |


本篇按官方这条线来讲。你学完以后再去看官方文档，会知道每一块在解决什么问题，而不是迷失在参数列表里。

## Prometheus 在 AIOps 链路中的位置

```text
applications / hosts / databases / middleware
        |
        v
/metrics or exporters
        |
        v
Prometheus scrape
        |
        v
local TSDB
        |
        +--> PromQL queries
        +--> Grafana dashboards
        +--> recording rules
        +--> alerting rules
        +--> HTTP API
                 |
                 v
        Python / AIOps analysis
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>applications / hosts / databases / middleware</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>        &#124;</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>        v</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>/metrics or exporters</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>        &#124;</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 6 行 | <code>        v</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 7 行 | <code>Prometheus scrape</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 8 行 | <code>        &#124;</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 9 行 | <code>        v</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 10 行 | <code>local TSDB</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 11 行 | <code>        &#124;</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 12 行 | <code>        +--&gt; PromQL queries</code> | 这一行要理解这些英文词：`PromQL queries` 是queries=查询。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 13 行 | <code>        +--&gt; Grafana dashboards</code> | 这一行要理解这些英文词：`Grafana dashboards` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 14 行 | <code>        +--&gt; recording rules</code> | 这一行要理解这些英文词：`recording rules` 是记录规则，提前把 PromQL 计算结果保存成新指标。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 15 行 | <code>        +--&gt; alerting rules</code> | 这一行要理解这些英文词：`alerting rules` 是告警规则，定义什么条件会触发告警。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 16 行 | <code>        +--&gt; HTTP API</code> | 这一行要理解这些英文词：`HTTP API` 是http=超文本传输协议，api=应用程序接口。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 17 行 | <code>                 &#124;</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 18 行 | <code>                 v</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 19 行 | <code>        Python / AIOps analysis</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


在 AIOps 里，Prometheus 通常承担“指标数据入口”和“实时查询计算层”：

| AIOps 能力 | Prometheus 提供什么 |
|---|---|
| 异常检测 | CPU、内存、QPS、错误率、延迟等时间序列 |
| 告警治理 | 规则表达式、告警标签、持续时间、历史触发数据 |
| 根因分析 | 多指标同一时间线对比 |
| SLO | 可用性、错误率、延迟达标率计算 |
| 容量预测 | 历史使用量、增长趋势、峰谷模式 |
| 自动化修复 | 告警触发后给 runbook 提供证据 |

## Prometheus 是什么

Prometheus 是开源监控和告警系统，核心处理对象是时间序列指标。

时间序列可以理解成“一条随时间变化的数字流”：

```text
10:00:00  http_requests_total{job="api",instance="api-1:8000"} 1000
10:00:15  http_requests_total{job="api",instance="api-1:8000"} 1080
10:00:30  http_requests_total{job="api",instance="api-1:8000"} 1160
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>10:00:00  http_requests_total{job="api",instance="api-1:8000"} 1000</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>10:00:15  http_requests_total{job="api",instance="api-1:8000"} 1080</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>10:00:30  http_requests_total{job="api",instance="api-1:8000"} 1160</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


Prometheus 不适合保存日志全文，也不适合保存每一笔订单明细。它适合保存数值指标：

- 请求总数。
- 错误总数。
- 请求耗时分布。
- CPU 使用率。
- 内存使用量。
- 队列长度。
- 活跃连接数。
- 磁盘剩余空间。

一句话公式：

```text
Prometheus = 指标抓取 + 本地时序存储 + PromQL 查询 + 规则计算 + 告警发送
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Prometheus = 指标抓取 + 本地时序存储 + PromQL 查询 + 规则计算 + 告警发送</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


## Prometheus 适合什么，不适合什么

适合：

- 数值型时间序列监控。
- 微服务指标。
- 主机和容器资源指标。
- 中间件指标。
- 告警规则计算。
- 故障期间快速查询。

不适合：

- 精确账单系统。
- 保存日志全文。
- 保存链路追踪明细。
- 保存业务明细表。
- 需要永久历史的唯一存储。

Prometheus 的设计重点是可靠和可查询。它的本地单节点模式很适合故障时直接使用，但如果你要多年历史、海量多租户或跨集群全局查询，就要引入远程存储或长期存储方案。

## 架构和数据流

Prometheus 生态可以简化成：

```text
instrumented app
node exporter
database exporter
pushgateway
        |
        v
Prometheus server
  ├── service discovery
  ├── scrape manager
  ├── TSDB
  ├── PromQL engine
  ├── rule manager
  └── notification sender
        |
        +--> Grafana
        +--> Alertmanager
        +--> HTTP API clients
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>instrumented app</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>node exporter</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>database exporter</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>pushgateway</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>        &#124;</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 6 行 | <code>        v</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 7 行 | <code>Prometheus server</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 8 行 | <code>  ├── service discovery</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 9 行 | <code>  ├── scrape manager</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 10 行 | <code>  ├── TSDB</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 11 行 | <code>  ├── PromQL engine</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 12 行 | <code>  ├── rule manager</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 13 行 | <code>  └── notification sender</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 14 行 | <code>        &#124;</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 15 行 | <code>        +--&gt; Grafana</code> | 这一行要理解这些英文词：`Grafana` 是仪表盘和可视化平台，用来展示指标、日志和告警数据。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 16 行 | <code>        +--&gt; Alertmanager</code> | 这一行要理解这些英文词：`Alertmanager` 是Prometheus 生态里的告警管理器。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 17 行 | <code>        +--&gt; HTTP API clients</code> | 这一行要理解这些英文词：`HTTP API clients` 是http=超文本传输协议，api=应用程序接口。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


核心组件：

| 组件 | 是什么 | 为什么需要 |
|---|---|---|
| Prometheus server | 抓取、存储、查询、规则计算的主程序 | 指标链路核心 |
| Client library | 应用代码中暴露指标的库 | 让业务服务直接输出 `/metrics` |
| Exporter | 把已有系统状态转换成 Prometheus 指标 | Linux、MySQL、Redis 等通常不能天然输出 Prometheus 格式 |
| Pushgateway | 为短生命周期批任务临时接收指标 | 批任务结束太快，Prometheus 可能来不及抓 |
| Alertmanager | 接收 Prometheus 告警并做通知治理 | 分组、静默、抑制、路由 |
| Grafana | 可视化 dashboard 工具 | 给人看趋势和状态 |

## Pull 抓取模型

Prometheus 默认使用 pull 模型。

```text
target exposes /metrics
        ^
        |
Prometheus scrapes target every scrape_interval
        |
        v
samples written to TSDB
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>target exposes /metrics</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>        ^</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>        &#124;</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>Prometheus scrapes target every scrape_interval</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>        &#124;</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 6 行 | <code>        v</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 7 行 | <code>samples written to TSDB</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


流程：

1. 应用或 exporter 暴露 HTTP `/metrics`。
2. Prometheus 根据 `scrape_configs` 找到 targets。
3. Prometheus 按 `scrape_interval` 定时访问 targets。
4. target 返回指标文本。
5. Prometheus 解析样本，附加时间戳，写入 TSDB。
6. 用户用 PromQL 查询，或者规则引擎定期计算。

Pull 模型的好处：

- Prometheus 可以主动判断目标是否可抓取。
- `/targets` 页面能直接显示 UP/DOWN 和错误。
- 服务发现和标签处理集中在 Prometheus 侧。
- 调试时可以用浏览器或 curl 直接看目标 `/metrics`。

不足：

- Prometheus 必须能访问 target。
- 短生命周期任务可能来不及被抓，需要 Pushgateway 或别的模式。
- 跨网络边界时要处理防火墙、服务发现和认证。

## 数据模型

Prometheus 数据模型有四个基础词：metric、label、sample、time series。

### metric name

metric name 是指标名，例如：

```text
http_requests_total
process_cpu_seconds_total
node_memory_MemAvailable_bytes
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>http_requests_total</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>process_cpu_seconds_total</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>node_memory_MemAvailable_bytes</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


命名建议：

| 建议 | 例子 |
|---|---|
| 名字表达测量对象 | `http_requests_total` |
| 单位放在后缀 | `_seconds`、`_bytes`、`_total` |
| Counter 用 `_total` 结尾 | `errors_total` |
| 不把标签内容塞进指标名 | 用 label 区分 method、status、instance |

坏例子：

```text
api_get_200_requests
api_post_500_requests
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>api_get_200_requests</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>api_post_500_requests</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


好例子：

```text
http_requests_total{method="GET",status="200"}
http_requests_total{method="POST",status="500"}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>http_requests_total{method="GET",status="200"}</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>http_requests_total{method="POST",status="500"}</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


### label

label 是键值对，用于描述维度。

```text
http_requests_total{method="GET",status="200",instance="api-1:8000"}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>http_requests_total{method="GET",status="200",instance="api-1:8000"}</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


这里的标签：

| label | 含义 |
|---|---|
| `method="GET"` | HTTP 方法 |
| `status="200"` | HTTP 状态码 |
| `instance="api-1:8000"` | 被抓取实例 |

标签的力量在于查询和聚合：

```text
sum by (status) (rate(http_requests_total[5m]))
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>sum by (status) (rate(http_requests_total[5m]))</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


标签的风险是高基数。任何会无限增长或变化很快的值，都不应该放进 label：

- `user_id`
- `request_id`
- `trace_id`
- 完整 URL 参数
- error message 原文
- IP 地址明细，除非你明确知道规模

因为每一种 label 组合都会形成新的时间序列。时间序列越多，Prometheus 的内存、磁盘和查询压力越大。

### sample

sample 是一个具体时间点的值。

```text
value + timestamp
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>value + timestamp</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


例子：

```text
http_requests_total{job="api",instance="api-1:8000"} 1080 @ 10:00:15
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>http_requests_total{job="api",instance="api-1:8000"} 1080 @ 10:00:15</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


Prometheus 抓取时通常给样本附加抓取时间。你在 PromQL 里看到的曲线，就是一系列 sample 组成的。

### time series

time series 由指标名和完整 label 集合唯一确定。

```text
http_requests_total{method="GET",status="200",instance="api-1:8000"}
http_requests_total{method="GET",status="500",instance="api-1:8000"}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>http_requests_total{method="GET",status="200",instance="api-1:8000"}</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>http_requests_total{method="GET",status="500",instance="api-1:8000"}</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


这两条是不同 time series，因为 `status` 不同。

判断是否新建时间序列：

| 变化 | 是否新 time series |
|---|---|
| 样本值变化 | 否 |
| 时间戳变化 | 否 |
| label 值变化 | 是 |
| 新增 label | 是 |
| 删除 label | 是 |
| metric name 变化 | 是 |

## Jobs、Instances 和 Targets

官方文档里有三个很重要的词。

| 名词 | 含义 | 例子 |
|---|---|---|
| job | 一组同类抓取目标 | `api`、`node`、`prometheus` |
| instance | 一个具体抓取目标 | `api-1:8000`、`node-1:9100` |
| target | Prometheus 要抓的地址和标签集合 | `localhost:9090` 加上 labels |

配置：

```yaml
scrape_configs:
  - job_name: "demo-api"
    static_configs:
      - targets:
          - "demo-api-1:8000"
          - "demo-api-2:8000"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>scrape_configs:</code> | 定义 `scrape_configs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  - job_name: "demo-api"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 3 行 | <code>    static_configs:</code> | 定义 `static_configs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>      - targets:</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 5 行 | <code>          - "demo-api-1:8000"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 6 行 | <code>          - "demo-api-2:8000"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |


Prometheus 会自动加上常见标签：

```text
job="demo-api"
instance="demo-api-1:8000"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>job="demo-api"</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>instance="demo-api-1:8000"</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


查询：

```text
up{job="demo-api"}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>up{job="demo-api"}</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


如果你看到：

```text
up{job="demo-api",instance="demo-api-1:8000"} 1
up{job="demo-api",instance="demo-api-2:8000"} 0
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>up{job="demo-api",instance="demo-api-1:8000"} 1</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>up{job="demo-api",instance="demo-api-2:8000"} 0</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


意思是第一个实例抓取成功，第二个实例抓取失败。

## 指标类型

Prometheus 客户端库常见四种指标类型。

| 类型 | 一句话 | AIOps 例子 |
|---|---|---|
| Counter | 只增不减，重启可归零 | 请求总数、错误总数 |
| Gauge | 可增可减的瞬时值 | CPU、内存、队列长度 |
| Histogram | 把观测值放进桶里统计分布 | 请求耗时、响应大小 |
| Summary | 客户端侧计算分位数摘要 | 客户端延迟分位数 |

### Counter

Counter 像汽车总里程，只会增加，进程重启时可能归零。

例子：

```text
http_requests_total{method="GET",status="200"} 1027
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>http_requests_total{method="GET",status="200"} 1027</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


不要直接拿 Counter 的当前值当 QPS。要用 `rate()` 看增长速度：

```text
rate(http_requests_total[5m])
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>rate(http_requests_total[5m])</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


坏用法：

```text
current_running_requests_total
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>current_running_requests_total</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


当前正在运行的请求数会上升也会下降，应该用 Gauge。

### Gauge

Gauge 像温度计，可以升也可以降。

例子：

```text
node_memory_MemAvailable_bytes 123456789
queue_depth{queue="orders"} 42
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>node_memory_MemAvailable_bytes 123456789</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>queue_depth{queue="orders"} 42</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


适合：

- 当前 CPU 使用率。
- 当前内存使用量。
- 当前队列长度。
- 当前连接数。
- 当前 goroutine 数。

常用查询：

```text
node_memory_MemAvailable_bytes
max_over_time(queue_depth[30m])
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>node_memory_MemAvailable_bytes</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>max_over_time(queue_depth[30m])</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


### Histogram

Histogram 用桶统计一批观测值的分布。

典型指标：

```text
http_request_duration_seconds_bucket{le="0.1"} 240
http_request_duration_seconds_bucket{le="0.3"} 500
http_request_duration_seconds_bucket{le="1"} 900
http_request_duration_seconds_bucket{le="+Inf"} 1000
http_request_duration_seconds_sum 123.4
http_request_duration_seconds_count 1000
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>http_request_duration_seconds_bucket{le="0.1"} 240</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>http_request_duration_seconds_bucket{le="0.3"} 500</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>http_request_duration_seconds_bucket{le="1"} 900</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>http_request_duration_seconds_bucket{le="+Inf"} 1000</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>http_request_duration_seconds_sum 123.4</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 6 行 | <code>http_request_duration_seconds_count 1000</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


你可以把它理解成：Prometheus 不保存每一次请求耗时，而是保存“多少请求落在每个耗时桶里”。

计算 P95：

```text
histogram_quantile(
  0.95,
  sum by (le) (rate(http_request_duration_seconds_bucket[5m]))
)
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>histogram_quantile(</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  0.95,</code> | 编号步骤，表示学习或操作时应该按顺序执行。 |
| 第 3 行 | <code>  sum by (le) (rate(http_request_duration_seconds_bucket[5m]))</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>)</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


如果有多个实例，要保留 `le` 标签聚合：

```text
histogram_quantile(
  0.95,
  sum by (job, le) (rate(http_request_duration_seconds_bucket[5m]))
)
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>histogram_quantile(</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  0.95,</code> | 编号步骤，表示学习或操作时应该按顺序执行。 |
| 第 3 行 | <code>  sum by (job, le) (rate(http_request_duration_seconds_bucket[5m]))</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>)</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


### Summary

Summary 也用于耗时、响应大小这类观测值，但它在客户端侧计算分位数。

常见形态：

```text
rpc_duration_seconds{quantile="0.5"} 0.05
rpc_duration_seconds{quantile="0.9"} 0.2
rpc_duration_seconds_sum 123.4
rpc_duration_seconds_count 1000
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>rpc_duration_seconds{quantile="0.5"} 0.05</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>rpc_duration_seconds{quantile="0.9"} 0.2</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>rpc_duration_seconds_sum 123.4</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>rpc_duration_seconds_count 1000</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


初学建议：

- 想跨实例聚合 P95，优先学 Histogram。
- Summary 的客户端分位数不适合简单跨实例再聚合。

## `/metrics` 暴露格式

一个 `/metrics` 页面可能长这样：

```text
# HELP http_requests_total Total number of HTTP requests.
# TYPE http_requests_total counter
http_requests_total{method="GET",status="200"} 1027
http_requests_total{method="GET",status="500"} 12

# HELP queue_depth Current queue depth.
# TYPE queue_depth gauge
queue_depth{queue="orders"} 42
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code># HELP http_requests_total Total number of HTTP requests.</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code># TYPE http_requests_total counter</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>http_requests_total{method="GET",status="200"} 1027</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>http_requests_total{method="GET",status="500"} 12</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 6 行 | <code># HELP queue_depth Current queue depth.</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 7 行 | <code># TYPE queue_depth gauge</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 8 行 | <code>queue_depth{queue="orders"} 42</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


解释：

| 行 | 含义 |
|---|---|
| `# HELP` | 给人看的指标说明 |
| `# TYPE` | 指标类型 |
| 样本行 | 指标名、标签和值 |

排障时可以直接访问 target 的 metrics：

```bash
curl demo-api:8000/metrics
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl demo-api:8000/metrics</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |


如果这个接口不返回 Prometheus 格式，Prometheus 就抓不到有效样本。

## 安装和启动

### Docker 启动

最小启动：

```bash
docker run --rm --name prometheus -p 9090:9090 prom/prometheus:v3.5.0
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker run --rm --name prometheus -p 9090:9090 prom/prometheus:v3.5.0</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


访问：

```text
localhost:9090
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>localhost:9090</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


查看日志：

```bash
docker logs prometheus
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker logs prometheus</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |


### 使用配置文件启动

准备 `prometheus.yml`：

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: "prometheus"
    static_configs:
      - targets: ["localhost:9090"]
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>global:</code> | 定义 `global` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  scrape_interval: 15s</code> | 设置 `scrape_interval` 字段的值为 `15s`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 3 行 | <code>  evaluation_interval: 15s</code> | 设置 `evaluation_interval` 字段的值为 `15s`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 5 行 | <code>scrape_configs:</code> | 定义 `scrape_configs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 6 行 | <code>  - job_name: "prometheus"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 7 行 | <code>    static_configs:</code> | 定义 `static_configs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 8 行 | <code>      - targets: ["localhost:9090"]</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |


PowerShell：

```powershell
docker run --rm --name prometheus `
  -p 9090:9090 `
  -v ${PWD}/prometheus.yml:/etc/prometheus/prometheus.yml:ro `
  prom/prometheus:v3.5.0
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker run --rm --name prometheus `</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 2 行 | <code>  -p 9090:9090 `</code> | 执行 `-p` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>  -v ${PWD}/prometheus.yml:/etc/prometheus/prometheus.yml:ro `</code> | 执行 `-v` 相关命令，后面的参数决定它具体操作什么对象。 其中 `$` 开头的是 PowerShell 变量，用来保存临时值或配置。 |
| 第 4 行 | <code>  prom/prometheus:v3.5.0</code> | 执行 `prom/prometheus:v3.5.0` 相关命令，后面的参数决定它具体操作什么对象。 |


Linux/macOS：

```bash
docker run --rm --name prometheus \
  -p 9090:9090 \
  -v "$PWD/prometheus.yml:/etc/prometheus/prometheus.yml:ro" \
  prom/prometheus:v3.5.0
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker run --rm --name prometheus \</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 2 行 | <code>  -p 9090:9090 \</code> | 执行 `-p` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>  -v "$PWD/prometheus.yml:/etc/prometheus/prometheus.yml:ro" \</code> | 执行 `-v` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 4 行 | <code>  prom/prometheus:v3.5.0</code> | 执行 `prom/prometheus:v3.5.0` 相关命令，后面的参数决定它具体操作什么对象。 |


注意：示例版本号要按你实际使用的 Prometheus 镜像调整。不要在生产中长期依赖裸 `latest`。

## Web 页面

常用页面：

| 页面 | 用途 |
|---|---|
| `/targets` | 查看抓取目标 UP/DOWN、错误、最后抓取时间 |
| `/graph` | 执行 PromQL 查询 |
| `/alerts` | 查看告警状态 |
| `/rules` | 查看 recording rules 和 alerting rules |
| `/status/config` | 查看当前加载配置 |
| `/status/tsdb` | 查看 TSDB 基本状态和基数相关信息 |
| `/-/ready` | readiness 检查 |
| `/-/healthy` | health 检查 |

排障顺序通常是：先 `/targets`，再 PromQL。target 不 UP 时，PromQL 查不到数据只是结果，不是根因。

## 配置文件结构

Prometheus 配置文件是 YAML。

典型结构：

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "rules/*.yml"

scrape_configs:
  - job_name: "prometheus"
    static_configs:
      - targets: ["localhost:9090"]

alerting:
  alertmanagers:
    - static_configs:
        - targets: ["alertmanager:9093"]
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>global:</code> | 定义 `global` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  scrape_interval: 15s</code> | 设置 `scrape_interval` 字段的值为 `15s`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 3 行 | <code>  evaluation_interval: 15s</code> | 设置 `evaluation_interval` 字段的值为 `15s`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 5 行 | <code>rule_files:</code> | 定义 `rule_files` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 6 行 | <code>  - "rules/*.yml"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 7 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 8 行 | <code>scrape_configs:</code> | 定义 `scrape_configs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 9 行 | <code>  - job_name: "prometheus"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 10 行 | <code>    static_configs:</code> | 定义 `static_configs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 11 行 | <code>      - targets: ["localhost:9090"]</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 12 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 13 行 | <code>alerting:</code> | 定义 `alerting` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 14 行 | <code>  alertmanagers:</code> | 定义 `alertmanagers` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 15 行 | <code>    - static_configs:</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 16 行 | <code>        - targets: ["alertmanager:9093"]</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |


字段解释：

| 字段 | 是什么 | 为什么需要 | 坏了怎么查 |
|---|---|---|---|
| `global` | 全局默认配置 | 避免每个 job 重复写间隔 | `/status/config` 看实际加载 |
| `scrape_interval` | 抓取间隔 | 控制多久采一次指标 | 太大看不清波动，太小增加压力 |
| `evaluation_interval` | 规则计算间隔 | 控制告警和 recording rules 多久算一次 | 告警延迟时检查它 |
| `rule_files` | 规则文件路径 | 加载 recording 和 alerting rules | `promtool check rules` |
| `scrape_configs` | 抓取任务 | 定义抓谁、怎么抓、加什么标签 | `/targets` |
| `alerting` | Alertmanager 地址 | 告警触发后发给谁 | `/alerts` 和 Prometheus 日志 |

## `scrape_configs` 详解

一个抓取 job：

```yaml
scrape_configs:
  - job_name: "demo-api"
    scrape_interval: 10s
    scrape_timeout: 5s
    metrics_path: "/metrics"
    scheme: "http"
    static_configs:
      - targets:
          - "demo-api-1:8000"
          - "demo-api-2:8000"
        labels:
          env: "dev"
          team: "platform"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>scrape_configs:</code> | 定义 `scrape_configs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  - job_name: "demo-api"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 3 行 | <code>    scrape_interval: 10s</code> | 设置 `scrape_interval` 字段的值为 `10s`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>    scrape_timeout: 5s</code> | 设置 `scrape_timeout` 字段的值为 `5s`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 5 行 | <code>    metrics_path: "/metrics"</code> | 设置 `metrics_path` 字段的值为 `"/metrics"`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 6 行 | <code>    scheme: "http"</code> | 设置 `scheme` 字段的值为 `"http"`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 7 行 | <code>    static_configs:</code> | 定义 `static_configs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 8 行 | <code>      - targets:</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 9 行 | <code>          - "demo-api-1:8000"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 10 行 | <code>          - "demo-api-2:8000"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 11 行 | <code>        labels:</code> | 定义 `labels` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 12 行 | <code>          env: "dev"</code> | 设置 `env` 字段的值为 `"dev"`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 13 行 | <code>          team: "platform"</code> | 设置 `team` 字段的值为 `"platform"`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


字段解释：

| 字段 | 含义 |
|---|---|
| `job_name` | 抓取任务名，会成为 `job` 标签 |
| `scrape_interval` | 这个 job 的抓取间隔，覆盖 global 默认值 |
| `scrape_timeout` | 单次抓取超时时间 |
| `metrics_path` | metrics 路径，默认 `/metrics` |
| `scheme` | `http` 或 `https` |
| `static_configs` | 静态目标列表 |
| `targets` | 目标地址，格式通常是 `host:port` |
| `labels` | 给这些 targets 额外加的标签 |

坏了怎么查：

1. `/targets` 看状态。
2. 点开 target 看 Last Error。
3. 在 Prometheus 容器或同网络容器里 curl 目标地址。
4. 检查 `metrics_path`、端口、DNS、网络。
5. 用 `promtool check config prometheus.yml` 检查配置语法。

## relabel 的入门理解

relabel 是 Prometheus 在抓取前后改标签的机制。它很强，但也容易把新手绕晕。

最粗略理解：

```text
service discovery discovers many targets
        |
        v
relabel_configs selects and rewrites target labels
        |
        v
scrape target
        |
        v
metric_relabel_configs can drop or rewrite scraped metrics
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>service discovery discovers many targets</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>        &#124;</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>        v</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>relabel_configs selects and rewrites target labels</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>        &#124;</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 6 行 | <code>        v</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 7 行 | <code>scrape target</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 8 行 | <code>        &#124;</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 9 行 | <code>        v</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 10 行 | <code>metric_relabel_configs can drop or rewrite scraped metrics</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


初学先知道三个点：

| 配置 | 发生时间 | 常见用途 |
|---|---|---|
| `relabel_configs` | 抓取前，对 target 处理 | 改 `instance`、保留/丢弃 target |
| `metric_relabel_configs` | 抓取后，写入前，对样本处理 | 丢弃高基数指标或标签 |
| `__` 开头标签 | Prometheus 内部标签 | 服务发现和 relabel 阶段常见 |

例子：丢弃某个高基数标签：

```yaml
metric_relabel_configs:
  - source_labels: [pod_uid]
    regex: ".+"
    action: labeldrop
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>metric_relabel_configs:</code> | 定义 `metric_relabel_configs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  - source_labels: [pod_uid]</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 3 行 | <code>    regex: ".+"</code> | 设置 `regex` 字段的值为 `".+"`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>    action: labeldrop</code> | 设置 `action` 字段的值为 `labeldrop`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


真实生产里 relabel 很重要，但刚入门时先把 static target、job、instance、labels 理清楚。

## TSDB 和存储

Prometheus 本地存储叫 TSDB，也就是 time series database。

你可以把它理解成：

```text
scraped samples
  -> write-ahead log
  -> head block
  -> compacted blocks on disk
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>scraped samples</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; write-ahead log</code> | 这一行要理解这些英文词：`write-ahead log` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; head block</code> | 这一行要理解这些英文词：`head block` 是block=配置块。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; compacted blocks on disk</code> | 这一行要理解这些英文词：`compacted blocks on disk` 是blocks=配置块。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


你需要知道的重点：

| 概念 | 含义 |
|---|---|
| WAL | write-ahead log，用于崩溃恢复 |
| head | 最近写入、还没完全压缩成块的数据 |
| block | 一段时间范围内压缩后的数据块 |
| retention | 本地数据保留多久或保留多大 |
| cardinality | 时间序列数量，直接影响内存和磁盘 |

常见启动参数：

```bash
prometheus \
  --config.file=prometheus.yml \
  --storage.tsdb.path=data \
  --storage.tsdb.retention.time=15d
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>prometheus \</code> | 执行 `prometheus` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>  --config.file=prometheus.yml \</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 3 行 | <code>  --storage.tsdb.path=data \</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 4 行 | <code>  --storage.tsdb.retention.time=15d</code> | 注释行，提前说明下面命令的目的或注意事项。 |


Docker 中挂载数据目录：

```bash
docker volume create prometheus-data

docker run -d --name prometheus \
  -p 9090:9090 \
  -v prometheus-data:/prometheus \
  -v "$PWD/prometheus.yml:/etc/prometheus/prometheus.yml:ro" \
  prom/prometheus:v3.5.0 \
  --config.file=/etc/prometheus/prometheus.yml \
  --storage.tsdb.path=/prometheus \
  --storage.tsdb.retention.time=15d
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker volume create prometheus-data</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |
| 第 2 行 | <em>空行</em> | 空行，用来把命令分成更容易阅读的几段。 |
| 第 3 行 | <code>docker run -d --name prometheus \</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 4 行 | <code>  -p 9090:9090 \</code> | 执行 `-p` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 5 行 | <code>  -v prometheus-data:/prometheus \</code> | 执行 `-v` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 6 行 | <code>  -v "$PWD/prometheus.yml:/etc/prometheus/prometheus.yml:ro" \</code> | 执行 `-v` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 7 行 | <code>  prom/prometheus:v3.5.0 \</code> | 执行 `prom/prometheus:v3.5.0` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 8 行 | <code>  --config.file=/etc/prometheus/prometheus.yml \</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 9 行 | <code>  --storage.tsdb.path=/prometheus \</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 10 行 | <code>  --storage.tsdb.retention.time=15d</code> | 注释行，提前说明下面命令的目的或注意事项。 |


如果不挂载数据卷，容器删除后本地 TSDB 数据会丢。

## PromQL 基础

PromQL 是 Prometheus Query Language。

它不是 SQL。PromQL 的核心是对时间序列做选择、范围计算、聚合和向量运算。

## PromQL 数据类型

PromQL 常见类型：

| 类型 | 含义 | 例子 |
|---|---|---|
| instant vector | 某一时刻的一组时间序列样本 | `up` |
| range vector | 每条时间序列在一段时间内的样本集合 | `http_requests_total[5m]` |
| scalar | 单个数字 | `0.95` |
| string | 字符串，实际使用少 | `"demo"` |

新手最重要的是分清 instant vector 和 range vector。

```text
http_requests_total
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>http_requests_total</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


这是 instant vector，表示当前查询时刻每条序列的值。

```text
http_requests_total[5m]
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>http_requests_total[5m]</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


这是 range vector，表示最近 5 分钟每条序列的一组样本。`rate()` 这类函数需要 range vector。

## 选择器和标签匹配

查询所有 `up`：

```text
up
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>up</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


按 label 过滤：

```text
up{job="demo-api"}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>up{job="demo-api"}</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


匹配器：

| 写法 | 含义 |
|---|---|
| `label="value"` | 等于 |
| `label!="value"` | 不等于 |
| `label=~"regex"` | 正则匹配 |
| `label!~"regex"` | 正则不匹配 |

例子：

```text
http_requests_total{status=~"5.."}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>http_requests_total{status=~"5.."}</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


表示 status 是 500、502、503 这类 5xx。

## 聚合

按 job 聚合：

```text
sum by (job) (rate(http_requests_total[5m]))
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>sum by (job) (rate(http_requests_total[5m]))</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


去掉 instance 维度：

```text
sum without (instance) (rate(http_requests_total[5m]))
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>sum without (instance) (rate(http_requests_total[5m]))</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


常见聚合：

| 函数 | 用途 |
|---|---|
| `sum` | 求和 |
| `avg` | 平均 |
| `min` | 最小 |
| `max` | 最大 |
| `count` | 序列数量 |
| `topk` | 取前 K 个 |
| `bottomk` | 取后 K 个 |

AIOps 常用：

```text
topk(5, sum by (service) (rate(http_requests_total[5m])))
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>topk(5, sum by (service) (rate(http_requests_total[5m])))</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


意思是最近 5 分钟请求速率最高的 5 个服务。

## 常用 PromQL 字典

### `up`

| 项 | 内容 |
|---|---|
| 是什么 | Prometheus 自动生成的抓取成功指标 |
| 返回 | `1` 表示成功，`0` 表示失败 |
| 常用查询 | `up`、`up{job="demo-api"}` |
| AIOps 场景 | 判断 target 是否可抓取 |
| 常见坑 | `up=1` 只表示抓取成功，不代表业务接口一定正常 |

### `rate()`

| 项 | 内容 |
|---|---|
| 是什么 | 计算 Counter 在时间窗口内的每秒平均增长率 |
| 输入 | range vector，例如 `http_requests_total[5m]` |
| 常用查询 | `rate(http_requests_total[5m])` |
| AIOps 场景 | QPS、错误速率、网络字节速率 |
| 常见坑 | 不要对 Gauge 乱用 `rate()`；窗口太短会抖 |

### `irate()`

| 项 | 内容 |
|---|---|
| 是什么 | 使用最近两个样本计算瞬时增长率 |
| 输入 | range vector |
| 常用查询 | `irate(http_requests_total[5m])` |
| AIOps 场景 | 看短时尖峰 |
| 常见坑 | 告警通常更适合 `rate()`，`irate()` 太敏感 |

### `increase()`

| 项 | 内容 |
|---|---|
| 是什么 | 计算 Counter 在窗口内大约增加了多少 |
| 输入 | range vector |
| 常用查询 | `increase(errors_total[1h])` |
| AIOps 场景 | 最近 1 小时错误总数 |
| 常见坑 | 它不是每秒速率，和 `rate()` 语义不同 |

### `histogram_quantile()`

| 项 | 内容 |
|---|---|
| 是什么 | 根据 Histogram bucket 估算分位数 |
| 输入 | bucket 的速率或聚合 |
| 常用查询 | `histogram_quantile(0.95, sum by (le) (rate(http_request_duration_seconds_bucket[5m])))` |
| AIOps 场景 | P95、P99 延迟 |
| 常见坑 | 经典 Histogram 聚合时必须保留 `le` 标签 |

### `avg_over_time()`

| 项 | 内容 |
|---|---|
| 是什么 | 计算时间窗口内平均值 |
| 输入 | range vector |
| 常用查询 | `avg_over_time(cpu_usage[30m])` |
| AIOps 场景 | 平滑短时波动 |
| 常见坑 | 对 Counter 当前值求平均通常意义不大 |

### `max_over_time()`

| 项 | 内容 |
|---|---|
| 是什么 | 计算时间窗口内最大值 |
| 输入 | range vector |
| 常用查询 | `max_over_time(queue_depth[1h])` |
| AIOps 场景 | 看峰值、容量风险 |
| 常见坑 | 峰值不等于持续问题，要结合时间窗口 |

### `changes()`

| 项 | 内容 |
|---|---|
| 是什么 | 计算窗口内值变化次数 |
| 输入 | range vector |
| 常用查询 | `changes(up{job="demo-api"}[1h])` |
| AIOps 场景 | 判断实例是否反复抖动 |
| 常见坑 | 值频繁变化的 Gauge 会天然很高 |

### `predict_linear()`

| 项 | 内容 |
|---|---|
| 是什么 | 基于简单线性回归预测未来值 |
| 输入 | range vector 和未来秒数 |
| 常用查询 | `predict_linear(node_filesystem_free_bytes[6h], 3600 * 24)` |
| AIOps 场景 | 磁盘空间趋势预测 |
| 常见坑 | 只适合较线性的趋势，周期波动场景容易误判 |

## 常见 SRE 查询

### 请求速率

```text
sum by (job) (rate(http_requests_total[5m]))
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>sum by (job) (rate(http_requests_total[5m]))</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


### 错误率

```text
sum(rate(http_requests_total{status=~"5.."}[5m]))
/
sum(rate(http_requests_total[5m]))
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>sum(rate(http_requests_total{status=~"5.."}[5m]))</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>/</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>sum(rate(http_requests_total[5m]))</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


### 按服务错误率

```text
sum by (service) (rate(http_requests_total{status=~"5.."}[5m]))
/
sum by (service) (rate(http_requests_total[5m]))
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>sum by (service) (rate(http_requests_total{status=~"5.."}[5m]))</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>/</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>sum by (service) (rate(http_requests_total[5m]))</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


### P95 延迟

```text
histogram_quantile(
  0.95,
  sum by (service, le) (rate(http_request_duration_seconds_bucket[5m]))
)
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>histogram_quantile(</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  0.95,</code> | 编号步骤，表示学习或操作时应该按顺序执行。 |
| 第 3 行 | <code>  sum by (service, le) (rate(http_request_duration_seconds_bucket[5m]))</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>)</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


### 实例抓取失败

```text
up == 0
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>up == 0</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


### 最近 1 小时实例抖动

```text
changes(up[1h]) > 2
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>changes(up[1h]) &gt; 2</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


### 磁盘可能 24 小时内耗尽

```text
predict_linear(node_filesystem_free_bytes[6h], 24 * 3600) < 0
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>predict_linear(node_filesystem_free_bytes[6h], 24 * 3600) &lt; 0</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


## Recording Rules

Recording rules 用来把常用或昂贵的 PromQL 预先计算成新的时间序列。

为什么需要：

- Dashboard 查询更快。
- 告警表达式更简单。
- 复杂 SLO 指标可以复用。
- 降低重复查询成本。

示例 `rules/recording.yml`：

```yaml
groups:
  - name: demo-api-recording
    interval: 30s
    rules:
      - record: job:http_requests:rate5m
        expr: sum by (job) (rate(http_requests_total[5m]))
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>groups:</code> | 定义 `groups` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  - name: demo-api-recording</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 3 行 | <code>    interval: 30s</code> | 设置 `interval` 字段的值为 `30s`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>    rules:</code> | 定义 `rules` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 5 行 | <code>      - record: job:http_requests:rate5m</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 6 行 | <code>        expr: sum by (job) (rate(http_requests_total[5m]))</code> | 设置 `expr` 字段的值为 `sum by (job) (rate(http_requests_total[5m]))`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


字段解释：

| 字段 | 含义 |
|---|---|
| `groups` | 规则组列表 |
| `name` | 规则组名称 |
| `interval` | 该组规则计算间隔 |
| `record` | 新生成的指标名 |
| `expr` | PromQL 表达式 |

命名建议：

```text
level:metric:operations
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>level:metric:operations</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


例子：

```text
job:http_requests:rate5m
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>job:http_requests:rate5m</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


## Alerting Rules

Alerting rules 用来定义告警条件。

示例 `rules/alerting.yml`：

```yaml
groups:
  - name: demo-api-alerts
    rules:
      - alert: InstanceDown
        expr: up{job="demo-api"} == 0
        for: 2m
        labels:
          severity: critical
          team: platform
        annotations:
          summary: "demo-api instance is down"
          description: "Prometheus cannot scrape {{ $labels.instance }} for more than 2 minutes."
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>groups:</code> | 定义 `groups` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  - name: demo-api-alerts</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 3 行 | <code>    rules:</code> | 定义 `rules` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>      - alert: InstanceDown</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 5 行 | <code>        expr: up{job="demo-api"} == 0</code> | 设置 `expr` 字段的值为 `up{job="demo-api"} == 0`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 6 行 | <code>        for: 2m</code> | 设置 `for` 字段的值为 `2m`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 7 行 | <code>        labels:</code> | 定义 `labels` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 8 行 | <code>          severity: critical</code> | 设置 `severity` 字段的值为 `critical`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 9 行 | <code>          team: platform</code> | 设置 `team` 字段的值为 `platform`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 10 行 | <code>        annotations:</code> | 定义 `annotations` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 11 行 | <code>          summary: "demo-api instance is down"</code> | 设置 `summary` 字段的值为 `"demo-api instance is down"`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 12 行 | <code>          description: "Prometheus cannot scrape {{ $labels.instance }} for more than 2 minutes."</code> | 设置 `description` 字段的值为 `"Prometheus cannot scrape {{ $labels.instance }} for more than 2 minutes."`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


字段解释：

| 字段 | 含义 |
|---|---|
| `alert` | 告警名 |
| `expr` | 触发条件 |
| `for` | 条件持续多久后进入 firing |
| `labels` | 告警标签，用于分组、路由、筛选 |
| `annotations` | 给人看的说明 |

告警状态：

```text
inactive -> pending -> firing
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>inactive -&gt; pending -&gt; firing</code> | 这一行要理解这些英文词：`inactive` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`pending` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`firing` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


解释：

| 状态 | 含义 |
|---|---|
| inactive | 条件不成立 |
| pending | 条件成立，但还没满足 `for` 持续时间 |
| firing | 条件持续满足，告警触发 |

好的告警应该尽量关注用户影响：

- 错误率。
- 延迟。
- 可用性。
- 队列积压。
- SLO 错误预算。

不要只写一堆“CPU > 80%”。CPU 高可能是问题，也可能只是流量上涨。更好的做法是把资源指标作为诊断信息，把用户影响作为告警入口。

## Alertmanager 连接

Prometheus 负责计算告警，Alertmanager 负责处理告警通知。

```text
Prometheus alerting rule fires
        |
        v
Alertmanager
  ├── group
  ├── inhibit
  ├── silence
  └── notify
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Prometheus alerting rule fires</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>        &#124;</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>        v</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>Alertmanager</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>  ├── group</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 6 行 | <code>  ├── inhibit</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 7 行 | <code>  ├── silence</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 8 行 | <code>  └── notify</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |


Prometheus 配置：

```yaml
alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - "alertmanager:9093"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>alerting:</code> | 定义 `alerting` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  alertmanagers:</code> | 定义 `alertmanagers` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    - static_configs:</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 4 行 | <code>        - targets:</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 5 行 | <code>            - "alertmanager:9093"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |


注意：Alertmanager 的详细配置在 Alertmanager 专题里讲。这里你先记住：Prometheus 不是直接负责发飞书、邮件、短信的完整通知治理中心，它把 firing alerts 发给 Alertmanager。

## HTTP API

Prometheus 提供 HTTP API，AIOps 脚本可以通过 API 拉指标。

常用接口：

| API | 用途 |
|---|---|
| `/api/v1/query` | 瞬时查询 |
| `/api/v1/query_range` | 范围查询 |
| `/api/v1/series` | 查询时间序列 |
| `/api/v1/labels` | 查询 label 名 |
| `/api/v1/label/<label_name>/values` | 查询某个 label 的值 |
| `/api/v1/targets` | 查询 target 状态 |
| `/api/v1/rules` | 查询规则 |
| `/api/v1/alerts` | 查询告警 |

示例：瞬时查询。

```bash
curl "localhost:9090/api/v1/query?query=up"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl "localhost:9090/api/v1/query?query=up"</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |


示例：范围查询。

```bash
curl "localhost:9090/api/v1/query_range?query=up&start=2026-07-02T00:00:00Z&end=2026-07-02T01:00:00Z&step=30s"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl "localhost:9090/api/v1/query_range?query=up&amp;start=2026-07-02T00:00:00Z&amp;end=2026-07-02T01:00:00Z&amp;step=30s"</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |


API 返回通常包含：

| 字段 | 含义 |
|---|---|
| `status` | `success` 或 `error` |
| `data.resultType` | `vector`、`matrix` 等 |
| `data.result` | 查询结果 |
| `errorType` | 错误类型 |
| `error` | 错误信息 |

Python 拉取 Prometheus 数据时，要注意：

- URL 编码。
- timeout。
- 查询范围不要太大。
- step 不要太小。
- 处理 Prometheus 返回的 error。

## 命令 / 配置 / API 字典

### `prometheus --config.file`

| 项 | 内容 |
|---|---|
| 作用 | 指定 Prometheus 配置文件 |
| 示例 | `prometheus --config.file=prometheus.yml` |
| AIOps 场景 | 启动本地或服务器 Prometheus |
| 常见坑 | 容器里路径和宿主机路径不同 |

### `--web.listen-address`

| 项 | 内容 |
|---|---|
| 作用 | 指定 Web UI 和 HTTP API 监听地址 |
| 示例 | `--web.listen-address=0.0.0.0:9090` |
| AIOps 场景 | 暴露查询入口给 Grafana 或脚本 |
| 常见坑 | 监听地址不等于 Docker 端口映射，容器还要 `-p` |

### `--storage.tsdb.path`

| 项 | 内容 |
|---|---|
| 作用 | 指定本地 TSDB 数据目录 |
| 示例 | `--storage.tsdb.path=/prometheus` |
| AIOps 场景 | 持久化 Prometheus 数据 |
| 常见坑 | Docker 中不挂 volume，容器删除后数据丢失 |

### `--storage.tsdb.retention.time`

| 项 | 内容 |
|---|---|
| 作用 | 按时间保留本地数据 |
| 示例 | `--storage.tsdb.retention.time=15d` |
| AIOps 场景 | 控制本地历史窗口 |
| 常见坑 | 保留越久，磁盘压力越大；长期历史应考虑远程存储 |

### `--web.enable-lifecycle`

| 项 | 内容 |
|---|---|
| 作用 | 允许通过 HTTP 触发 reload 或 shutdown |
| 示例 | `--web.enable-lifecycle` |
| AIOps 场景 | 自动化部署配置后 reload |
| 常见坑 | 开启后要注意访问控制，不要暴露给不可信网络 |

### `promtool check config`

| 项 | 内容 |
|---|---|
| 作用 | 检查 Prometheus 配置文件语法 |
| 示例 | `promtool check config prometheus.yml` |
| AIOps 场景 | CI 中检查配置，避免坏配置上线 |
| 常见坑 | 只能证明语法和部分结构正确，不证明 target 一定可达 |

### `promtool check rules`

| 项 | 内容 |
|---|---|
| 作用 | 检查规则文件 |
| 示例 | `promtool check rules rules/alerting.yml` |
| AIOps 场景 | 防止告警规则语法错误 |
| 常见坑 | 表达式能解析，不代表告警语义合理 |

### `/targets`

| 项 | 内容 |
|---|---|
| 作用 | 查看抓取目标状态 |
| 入口 | Prometheus UI 的 `/targets` |
| 关键字段 | State、Labels、Last Scrape、Scrape Duration、Error |
| AIOps 场景 | 排查数据采集断点 |
| 常见坑 | target UP 不代表业务健康，只代表 metrics 抓取成功 |

### `/api/v1/query`

| 项 | 内容 |
|---|---|
| 作用 | HTTP API 瞬时查询 |
| 示例 | `curl "localhost:9090/api/v1/query?query=up"` |
| AIOps 场景 | Python 脚本拉当前状态 |
| 常见坑 | 查询语句要 URL 编码，复杂查询建议用 HTTP client 传 params |

### `/api/v1/query_range`

| 项 | 内容 |
|---|---|
| 作用 | HTTP API 范围查询 |
| 参数 | `query`、`start`、`end`、`step` |
| AIOps 场景 | 拉历史窗口做异常检测 |
| 常见坑 | 时间范围太大或 step 太小，会导致查询慢或超限 |

## AIOps 入门实验：监控一个 demo 应用

目标：

- 启动一个暴露 `/metrics` 的 Python demo。
- 启动 Prometheus 抓取它。
- 在 `/targets` 看到 demo 是 UP。
- 用 PromQL 查询请求数、错误率和延迟。
- 写一个 `InstanceDown` 告警规则。

### 第 1 步：准备目录

```text
prometheus-lab/
  app.py
  requirements.txt
  prometheus.yml
  rules/
    alerting.yml
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>prometheus-lab/</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  app.py</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>  requirements.txt</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>  prometheus.yml</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>  rules/</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 6 行 | <code>    alerting.yml</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


### 第 2 步：创建 Python demo

`requirements.txt`：

```text
prometheus-client==0.20.0
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>prometheus-client==0.20.0</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


`app.py`：

```python
import random
import time
from http.server import BaseHTTPRequestHandler, HTTPServer

from prometheus_client import Counter, Histogram, generate_latest


REQUESTS = Counter(
    "http_requests_total",
    "Total HTTP requests",
    ["method", "path", "status"],
)

LATENCY = Histogram(
    "http_request_duration_seconds",
    "HTTP request latency",
    ["path"],
)


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        start = time.time()

        if self.path == "/metrics":
            body = generate_latest()
            self.send_response(200)
            self.send_header("Content-Type", "text/plain; version=0.0.4")
            self.end_headers()
            self.wfile.write(body)
            return

        if self.path == "/health":
            status = 200
            body = b"ok"
        else:
            status = random.choice([200, 200, 200, 500])
            body = b"demo"

        time.sleep(random.uniform(0.01, 0.2))
        REQUESTS.labels(method="GET", path=self.path, status=str(status)).inc()
        LATENCY.labels(path=self.path).observe(time.time() - start)

        self.send_response(status)
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    HTTPServer(("0.0.0.0", 8000), Handler).serve_forever()
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>import random</code> | 导入 Python 模块，后面的代码会使用这个模块提供的功能。 |
| 第 2 行 | <code>import time</code> | 导入 Python 模块，后面的代码会使用这个模块提供的功能。 |
| 第 3 行 | <code>from http.server import BaseHTTPRequestHandler, HTTPServer</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 4 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 5 行 | <code>from prometheus_client import Counter, Histogram, generate_latest</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 6 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 7 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 8 行 | <code>REQUESTS = Counter(</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 9 行 | <code>    "http_requests_total",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 10 行 | <code>    "Total HTTP requests",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 11 行 | <code>    ["method", "path", "status"],</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 12 行 | <code>)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 13 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 14 行 | <code>LATENCY = Histogram(</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 15 行 | <code>    "http_request_duration_seconds",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 16 行 | <code>    "HTTP request latency",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 17 行 | <code>    ["path"],</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 18 行 | <code>)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 19 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 20 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 21 行 | <code>class Handler(BaseHTTPRequestHandler):</code> | 定义类，用来组织一组数据和行为。 |
| 第 22 行 | <code>    def do_GET(self):</code> | 定义函数，把一段可复用逻辑命名，后续可以反复调用。 |
| 第 23 行 | <code>        start = time.time()</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 24 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 25 行 | <code>        if self.path == "/metrics":</code> | 条件判断，只有条件成立时才执行下面缩进的代码。 |
| 第 26 行 | <code>            body = generate_latest()</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 27 行 | <code>            self.send_response(200)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 28 行 | <code>            self.send_header("Content-Type", "text/plain; version=0.0.4")</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 29 行 | <code>            self.end_headers()</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 30 行 | <code>            self.wfile.write(body)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 31 行 | <code>            return</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 32 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 33 行 | <code>        if self.path == "/health":</code> | 条件判断，只有条件成立时才执行下面缩进的代码。 |
| 第 34 行 | <code>            status = 200</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 35 行 | <code>            body = b"ok"</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 36 行 | <code>        else:</code> | 兜底分支，前面的条件都不成立时执行。 |
| 第 37 行 | <code>            status = random.choice([200, 200, 200, 500])</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 38 行 | <code>            body = b"demo"</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 39 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 40 行 | <code>        time.sleep(random.uniform(0.01, 0.2))</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 41 行 | <code>        REQUESTS.labels(method="GET", path=self.path, status=str(status)).inc()</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 42 行 | <code>        LATENCY.labels(path=self.path).observe(time.time() - start)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 43 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 44 行 | <code>        self.send_response(status)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 45 行 | <code>        self.end_headers()</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 46 行 | <code>        self.wfile.write(body)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 47 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 48 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 49 行 | <code>if __name__ == "__main__":</code> | 条件判断，只有条件成立时才执行下面缩进的代码。 |
| 第 50 行 | <code>    HTTPServer(("0.0.0.0", 8000), Handler).serve_forever()</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |


安装运行：

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python app.py
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>python -m venv .venv</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 |
| 第 2 行 | <code>.\.venv\Scripts\Activate.ps1</code> | 执行 `.\.venv\scripts\activate.ps1` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>python -m pip install -r requirements.txt</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 |
| 第 4 行 | <code>python app.py</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 |


另开一个终端访问几次：

```bash
curl localhost:8000/
curl localhost:8000/health
curl localhost:8000/metrics
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl localhost:8000/</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |
| 第 2 行 | <code>curl localhost:8000/health</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |
| 第 3 行 | <code>curl localhost:8000/metrics</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |


### 第 3 步：配置 Prometheus

如果 Prometheus 用 Docker 跑，demo 在宿主机跑，Docker Desktop 上可以用 `host.docker.internal`：

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "/etc/prometheus/rules/*.yml"

scrape_configs:
  - job_name: "prometheus"
    static_configs:
      - targets: ["localhost:9090"]

  - job_name: "demo-api"
    metrics_path: "/metrics"
    static_configs:
      - targets: ["host.docker.internal:8000"]
        labels:
          service: "demo-api"
          env: "local"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>global:</code> | 定义 `global` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  scrape_interval: 15s</code> | 设置 `scrape_interval` 字段的值为 `15s`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 3 行 | <code>  evaluation_interval: 15s</code> | 设置 `evaluation_interval` 字段的值为 `15s`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 5 行 | <code>rule_files:</code> | 定义 `rule_files` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 6 行 | <code>  - "/etc/prometheus/rules/*.yml"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 7 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 8 行 | <code>scrape_configs:</code> | 定义 `scrape_configs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 9 行 | <code>  - job_name: "prometheus"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 10 行 | <code>    static_configs:</code> | 定义 `static_configs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 11 行 | <code>      - targets: ["localhost:9090"]</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 12 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 13 行 | <code>  - job_name: "demo-api"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 14 行 | <code>    metrics_path: "/metrics"</code> | 设置 `metrics_path` 字段的值为 `"/metrics"`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 15 行 | <code>    static_configs:</code> | 定义 `static_configs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 16 行 | <code>      - targets: ["host.docker.internal:8000"]</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 17 行 | <code>        labels:</code> | 定义 `labels` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 18 行 | <code>          service: "demo-api"</code> | 设置 `service` 字段的值为 `"demo-api"`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 19 行 | <code>          env: "local"</code> | 设置 `env` 字段的值为 `"local"`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


Linux 上如果 Prometheus 和 demo 都用容器跑，建议放到同一个 Docker network，用容器名访问。这个会在 Docker Compose 篇里更完整地做。

### 第 4 步：创建告警规则

`rules/alerting.yml`：

```yaml
groups:
  - name: demo-api-alerts
    rules:
      - alert: DemoApiDown
        expr: up{job="demo-api"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "demo-api target is down"
          description: "Prometheus cannot scrape {{ $labels.instance }}."
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>groups:</code> | 定义 `groups` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  - name: demo-api-alerts</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 3 行 | <code>    rules:</code> | 定义 `rules` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>      - alert: DemoApiDown</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 5 行 | <code>        expr: up{job="demo-api"} == 0</code> | 设置 `expr` 字段的值为 `up{job="demo-api"} == 0`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 6 行 | <code>        for: 1m</code> | 设置 `for` 字段的值为 `1m`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 7 行 | <code>        labels:</code> | 定义 `labels` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 8 行 | <code>          severity: critical</code> | 设置 `severity` 字段的值为 `critical`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 9 行 | <code>        annotations:</code> | 定义 `annotations` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 10 行 | <code>          summary: "demo-api target is down"</code> | 设置 `summary` 字段的值为 `"demo-api target is down"`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 11 行 | <code>          description: "Prometheus cannot scrape {{ $labels.instance }}."</code> | 设置 `description` 字段的值为 `"Prometheus cannot scrape {{ $labels.instance }}."`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


### 第 5 步：启动 Prometheus

PowerShell：

```powershell
docker run --rm --name prometheus `
  -p 9090:9090 `
  -v ${PWD}/prometheus.yml:/etc/prometheus/prometheus.yml:ro `
  -v ${PWD}/rules:/etc/prometheus/rules:ro `
  prom/prometheus:v3.5.0 `
  --config.file=/etc/prometheus/prometheus.yml
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker run --rm --name prometheus `</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 2 行 | <code>  -p 9090:9090 `</code> | 执行 `-p` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>  -v ${PWD}/prometheus.yml:/etc/prometheus/prometheus.yml:ro `</code> | 执行 `-v` 相关命令，后面的参数决定它具体操作什么对象。 其中 `$` 开头的是 PowerShell 变量，用来保存临时值或配置。 |
| 第 4 行 | <code>  -v ${PWD}/rules:/etc/prometheus/rules:ro `</code> | 执行 `-v` 相关命令，后面的参数决定它具体操作什么对象。 其中 `$` 开头的是 PowerShell 变量，用来保存临时值或配置。 |
| 第 5 行 | <code>  prom/prometheus:v3.5.0 `</code> | 执行 `prom/prometheus:v3.5.0` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 6 行 | <code>  --config.file=/etc/prometheus/prometheus.yml</code> | 注释行，提前说明下面命令的目的或注意事项。 |


### 第 6 步：检查 targets

打开：

```text
localhost:9090/targets
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>localhost:9090/targets</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


应该看到：

- `prometheus` 是 UP。
- `demo-api` 是 UP。

如果 `demo-api` DOWN，先看 Last Error。

### 第 7 步：执行 PromQL

抓取状态：

```text
up{job="demo-api"}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>up{job="demo-api"}</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


请求速率：

```text
sum by (status) (rate(http_requests_total{job="demo-api"}[5m]))
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>sum by (status) (rate(http_requests_total{job="demo-api"}[5m]))</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


错误率：

```text
sum(rate(http_requests_total{job="demo-api",status="500"}[5m]))
/
sum(rate(http_requests_total{job="demo-api"}[5m]))
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>sum(rate(http_requests_total{job="demo-api",status="500"}[5m]))</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>/</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>sum(rate(http_requests_total{job="demo-api"}[5m]))</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


P95 延迟：

```text
histogram_quantile(
  0.95,
  sum by (le) (rate(http_request_duration_seconds_bucket{job="demo-api"}[5m]))
)
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>histogram_quantile(</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  0.95,</code> | 编号步骤，表示学习或操作时应该按顺序执行。 |
| 第 3 行 | <code>  sum by (le) (rate(http_request_duration_seconds_bucket{job="demo-api"}[5m]))</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>)</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


### 第 8 步：验证规则

打开：

```text
localhost:9090/rules
localhost:9090/alerts
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>localhost:9090/rules</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>localhost:9090/alerts</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


停止 Python demo 后，等待超过 1 分钟，`DemoApiDown` 应该从 pending 变成 firing。

## 实验排障

### `demo-api` target DOWN

检查：

```bash
docker logs prometheus
curl localhost:8000/metrics
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker logs prometheus</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |
| 第 2 行 | <code>curl localhost:8000/metrics</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |


如果 Prometheus 在容器里，demo 在宿主机上：

- Windows/macOS Docker Desktop 优先用 `host.docker.internal:8000`。
- Linux 要考虑 Docker 网络，或把 demo 也容器化。

### Prometheus 配置加载失败

检查：

```bash
promtool check config prometheus.yml
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>promtool check config prometheus.yml</code> | 执行 Prometheus 工具命令，用来检查配置文件或告警规则。 |


如果用 Docker 镜像里的 promtool：

```bash
docker run --rm -v "$PWD:/work" -w /work prom/prometheus:v3.5.0 promtool check config prometheus.yml
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker run --rm -v "$PWD:/work" -w /work prom/prometheus:v3.5.0 promtool check config prometheus.yml</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


### PromQL 查不到 demo 指标

排查：

1. `/targets` 是否 UP。
2. `curl localhost:8000/metrics` 是否有指标。
3. 指标名是否写对。
4. 是否刚启动，样本还没抓到。
5. 查询时间窗口是否太短。
6. label 是否写错，例如 `job="demo"` 和 `job="demo-api"`。

### P95 查询为空

检查：

- 是否存在 `_bucket` 指标。
- 查询时是否保留 `le` 标签。
- 最近 5 分钟是否有请求。
- Histogram 名字是否和查询一致。

## 常见故障排查表

| 现象 | 常见原因 | 检查入口 | 处理方向 |
|---|---|---|---|
| target DOWN | 地址错、网络不通、metrics 路径错、服务没启动 | `/targets` Last Error | 修地址、端口、路径、网络 |
| PromQL 无数据 | 指标不存在、label 写错、时间范围不对 | `/graph`、自动补全 | 先查裸指标名 |
| Prometheus 启动失败 | YAML 错、规则错、挂载路径错 | `docker logs`、`promtool` | 修配置和挂载 |
| 内存升高 | 高基数、target 太多、抓取太频繁 | `/status/tsdb`、日志 | 降基数、删标签、调间隔 |
| 磁盘增长快 | 保留时间长、序列多、抓取频繁 | `docker system df`、TSDB 目录 | 调 retention、清高基数 |
| 告警不触发 | 表达式无结果、`for` 未满足、规则没加载 | `/rules`、`/alerts` | 检查规则和表达式 |
| 告警误报多 | 规则太敏感、窗口太短、只看资源 | 告警历史 | 调整窗口，关注用户影响 |
| Grafana 有图但 Prometheus 查不到 | 数据源或查询范围不同 | Grafana query inspector | 对齐数据源和时间范围 |
| API 查询慢 | 范围太大、step 太小、序列太多 | Prometheus 日志 | 缩小范围，做 recording rule |

## 高基数专项

高基数是 Prometheus 新手最容易踩的大坑。

时间序列数量大致等于：

```text
metric names * label combinations
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>metric names * label combinations</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


例子：

```text
http_requests_total{
  method="GET",
  status="200",
  user_id="123456",
  request_id="abc..."
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>http_requests_total{</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  method="GET",</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>  status="200",</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>  user_id="123456",</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>  request_id="abc..."</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 6 行 | <code>}</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


如果 `user_id` 有 100 万个，`request_id` 每次请求都不同，时间序列会爆炸。

正确做法：

- 用日志或 tracing 保存 request_id。
- 用指标保存聚合维度。
- URL path 用模板，例如 `/api/users/:id`，不要用 `/api/users/123`。
- 对无用指标和标签做 metric relabel drop。
- 定期看 `/status/tsdb` 和高基数指标。

## Prometheus 和日志、链路追踪的区别

| 数据类型 | 代表工具 | 保存什么 | 适合回答 |
|---|---|---|---|
| Metrics | Prometheus | 数值时间序列 | 系统是否异常、趋势如何 |
| Logs | Loki、Elasticsearch | 离散事件文本 | 具体错误是什么 |
| Traces | Jaeger、Tempo | 请求调用链 | 慢在哪个服务或 span |

不要让 Prometheus 做所有事。AIOps 需要三类数据协同，但 Prometheus 的核心职责是指标。

## 学习路线

### 第 1 阶段：理解数据模型

- metric name。
- label。
- sample。
- time series。
- job 和 instance。

学习证据：写一篇笔记，解释 `http_requests_total{method="GET",status="200"}` 是什么。

### 第 2 阶段：跑起来

- Docker 启动 Prometheus。
- 写 `prometheus.yml`。
- 打开 `/targets`。
- 查询 `up`。

学习证据：提交 `prometheus.yml` 和 `/targets` 截图。

### 第 3 阶段：学 PromQL

- 选择器。
- label 匹配。
- `rate()`。
- `sum by`。
- `histogram_quantile()`。
- 错误率和 P95。

学习证据：整理 10 条 PromQL 查询和每条含义。

### 第 4 阶段：学规则

- recording rules。
- alerting rules。
- `for`。
- labels 和 annotations。
- `promtool check rules`。

学习证据：提交 `rules/alerting.yml` 和一次告警状态截图。

### 第 5 阶段：接入 AIOps

- HTTP API。
- Python 查询历史指标。
- 异常检测。
- SLO 计算。
- 告警降噪。

学习证据：写一个 Python 脚本调用 `/api/v1/query_range` 拉取 1 小时 QPS。

## 小白可能会问

### 我已经会看日志了，为什么还要学 Prometheus？

日志告诉你“发生了什么事件”，指标告诉你“系统状态如何随时间变化”。排查接口变慢时，日志能看到错误细节，Prometheus 能看到 QPS、错误率、P95、CPU、内存是否同时变化。两者互补。

### `/metrics` 到底是什么？

它是一个 HTTP 接口，返回 Prometheus 能解析的指标文本。应用可以通过 client library 暴露它，数据库和系统组件可以通过 exporter 暴露它。

### Counter、Gauge、Histogram 第一天先懂哪个？

先懂 Counter 和 Gauge。Counter 记录累计次数，用 `rate()` 看速度。Gauge 记录当前值，可以上升下降。Histogram 用于延迟分布，等你要看 P95/P99 时再重点学。

### Prometheus 和 Grafana 什么关系？

Prometheus 负责采集、存储和查询指标。Grafana 负责把查询结果画成 dashboard。没有 Prometheus，Grafana 没有指标数据源；没有 Grafana，Prometheus 仍然可以查询和告警，但展示体验弱。

### Prometheus 能不能长期保存所有历史？

本地 TSDB 可以保留一段时间，但 Prometheus 单节点本地存储不是为无限长期历史设计的。长期存储通常使用 remote write 或 Thanos、Cortex、Mimir、VictoriaMetrics 等方案。

## 面试怎么讲

Prometheus 是面向指标的监控和告警系统。它默认用 pull 模型定期抓取 target 的 `/metrics`，把样本按 metric name 和 labels 存成 time series，再用 PromQL 查询和规则计算。它的数据模型是多维标签模型，优点是查询和聚合灵活，风险是高基数标签会导致序列数量爆炸。排障时我会先看 `/targets` 是否 UP，再查指标名和标签，最后看 PromQL 窗口、规则和 TSDB 基数。在 AIOps 中，Prometheus 提供 CPU、QPS、错误率、延迟等历史指标，是异常检测、SLO、容量预测和告警降噪的重要输入。

## 面试题

1. Prometheus 解决什么问题？
2. Prometheus 为什么默认使用 pull 模型？
3. metric、label、sample、time series 分别是什么？
4. job、instance、target 有什么区别？
5. Counter 和 Gauge 有什么区别？
6. 为什么 Counter 要用 `rate()` 看 QPS？
7. Histogram 的 `_bucket`、`_sum`、`_count` 分别是什么？
8. Summary 和 Histogram 有什么区别？
9. 什么是高基数标签？为什么危险？
10. `scrape_interval` 和 `evaluation_interval` 分别控制什么？
11. `up` 指标代表什么？它有什么局限？
12. `rate()`、`increase()`、`irate()` 有什么区别？
13. 如何计算 HTTP 5xx 错误率？
14. 如何计算 P95 延迟？
15. recording rules 解决什么问题？
16. alerting rules 中 `for` 有什么作用？
17. Prometheus 和 Alertmanager 的边界是什么？
18. target DOWN 你会按什么顺序排查？
19. Prometheus 不适合做什么？
20. Prometheus 在 AIOps 异常检测中提供什么输入？

## 学习检查清单

- [ ] 我能解释 Prometheus 是什么，以及它适合和不适合的场景。
- [ ] 我能画出 Prometheus 抓取、存储、查询、告警的数据流。
- [ ] 我能解释 metric、label、sample、time series。
- [ ] 我能解释 job、instance、target。
- [ ] 我能区分 Counter、Gauge、Histogram、Summary。
- [ ] 我能读懂 `/metrics` 中的 HELP、TYPE 和样本行。
- [ ] 我能启动 Prometheus 并访问 `/targets`。
- [ ] 我能写一个最小 `prometheus.yml`。
- [ ] 我能解释 `scrape_interval`、`evaluation_interval`、`scrape_configs`。
- [ ] 我能用 `promtool check config` 检查配置。
- [ ] 我能用 `up`、`rate()`、`sum by`、`histogram_quantile()` 写基础 PromQL。
- [ ] 我能写一个 recording rule。
- [ ] 我能写一个 alerting rule。
- [ ] 我能用 HTTP API 查询 `up`。
- [ ] 我能排查 target DOWN、PromQL 无数据、高基数和规则不触发。
- [ ] 我能说明 Prometheus 在 AIOps 中如何支持异常检测、SLO 和告警降噪。

## 学习证据

学完这篇后，建议提交这些内容到 GitHub：

- `labs/prometheus/prometheus.yml`
- `labs/prometheus/rules/alerting.yml`
- `labs/prometheus/app.py`
- `labs/prometheus/requirements.txt`
- 一张 `/targets` 页面截图。
- 一张 `/rules` 或 `/alerts` 页面截图。
- 一篇笔记：`Prometheus 数据模型.md`
- 一篇笔记：`Counter、Gauge、Histogram、Summary 的区别.md`
- 一篇排障记录：`Prometheus target DOWN 排查.md`
- 一个 Python 脚本：调用 `/api/v1/query_range` 拉取最近 1 小时 QPS。

如果你能从 demo 的 `/metrics` 一路讲到 Prometheus target、TSDB、PromQL、告警规则和 HTTP API，就说明你已经真正理解了 Prometheus 的主干，而不是只会打开一个 dashboard。
