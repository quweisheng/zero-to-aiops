# OpenTelemetry

> 目标：能理解 OpenTelemetry 为什么是云原生可观测性的标准工具箱，能讲清 traces、metrics、logs、context propagation、resource、semantic conventions、instrumentation、API/SDK、OTLP、Collector receiver/processor/exporter/pipeline，能写一个最小 Collector 配置并排查“应用没数据、Collector 收不到、后端看不到、trace 串不起来”。

## 官方资料

- [OpenTelemetry documentation](https://opentelemetry.io/docs/)
- [What is OpenTelemetry?](https://opentelemetry.io/docs/what-is-opentelemetry/)
- [OpenTelemetry concepts](https://opentelemetry.io/docs/concepts/)
- [Traces](https://opentelemetry.io/docs/concepts/signals/traces/)
- [Metrics](https://opentelemetry.io/docs/concepts/signals/metrics/)
- [Logs](https://opentelemetry.io/docs/concepts/signals/logs/)
- [Baggage](https://opentelemetry.io/docs/concepts/signals/baggage/)
- [Context propagation](https://opentelemetry.io/docs/concepts/context-propagation/)
- [Semantic conventions](https://opentelemetry.io/docs/concepts/semantic-conventions/)
- [OpenTelemetry specifications](https://opentelemetry.io/docs/specs/)
- [OpenTelemetry specification overview](https://opentelemetry.io/docs/specs/otel/overview/)
- [OTLP specification](https://opentelemetry.io/docs/specs/otlp/)
- [OpenTelemetry Collector](https://opentelemetry.io/docs/collector/)
- [Collector architecture](https://opentelemetry.io/docs/collector/architecture/)
- [Collector configuration](https://opentelemetry.io/docs/collector/configuration/)
- [OpenTelemetry language APIs & SDKs](https://opentelemetry.io/docs/languages/)
- [OpenTelemetry Collector GitHub](https://github.com/open-telemetry/opentelemetry-collector)

说明：本文基于 OpenTelemetry 官方文档、规范和 Collector 文档整理，是原创中文教程，不复制官方全文。OpenTelemetry 生态发展很快，spec、semantic conventions、Collector 组件状态会变化，生产请以目标版本官方文档和组件 stability 为准。

## 场景开场

你有一个 AIOps 平台：

```text
Frontend -> API Gateway -> alert-service -> model-service -> database
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Frontend -&gt; API Gateway -&gt; alert-service -&gt; model-service -&gt; database</code> | 这一行要理解这些英文词：`Frontend` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`API Gateway` 是api=应用程序接口；`alert-service` 是alert=告警，service=服务；`model-service` 是service=服务；`database` 是数据库。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


用户说“告警分析页面很慢”。你在 Prometheus 里看到 API P95 升高，在日志里看到一些 timeout，但还是很难回答：

- 是 gateway 慢，还是 alert-service 慢？
- alert-service 调 model-service 花了多久？
- model-service 是 CPU 慢，还是数据库查询慢？
- 这条用户请求对应哪些日志？
- 某个错误日志属于哪条 trace？
- 不同语言服务怎么用同一种方式采集指标、日志、trace？
- 从开源后端切到商业后端，要不要重写埋点？

OpenTelemetry 解决的是“用统一、厂商中立的方式生成、采集、处理和导出遥测数据”。它不是单一后端数据库，也不是一个 dashboard，而是一套标准、SDK、协议和 Collector。

## 一句话人话版

OpenTelemetry 是可观测性工具箱和标准：应用用 OTel API/SDK 生成 traces、metrics、logs，通过 context propagation 把请求链路串起来，用 semantic conventions 统一字段名，再通过 OTLP 和 Collector 把数据处理后发到 Prometheus、Jaeger、Tempo、Loki、Elasticsearch 或商业后端。

## 学习边界

入门 OpenTelemetry 先抓这条链：

```text
Application
  -> instrumentation
  -> OpenTelemetry API
  -> OpenTelemetry SDK
  -> spans / metrics / logs
  -> context propagation
  -> OTLP exporter
  -> OpenTelemetry Collector
     -> receiver
     -> processor
     -> exporter
  -> backend
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Application</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; instrumentation</code> | 这一行要理解这些英文词：`instrumentation` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; OpenTelemetry API</code> | 这一行要理解这些英文词：`OpenTelemetry API` 是opentelemetry=可观测性数据采集标准，api=应用程序接口。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; OpenTelemetry SDK</code> | 这一行要理解这些英文词：`OpenTelemetry SDK` 是opentelemetry=可观测性数据采集标准。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; spans / metrics / logs</code> | 这一行要理解这些英文词：`spans` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`metrics` 是指标；`logs` 是日志。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>  -&gt; context propagation</code> | 这一行要理解这些英文词：`context propagation` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 7 行 | <code>  -&gt; OTLP exporter</code> | 这一行要理解这些英文词：`OTLP exporter` 是otlp=OpenTelemetry 的数据传输协议。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 8 行 | <code>  -&gt; OpenTelemetry Collector</code> | 这一行要理解这些英文词：`OpenTelemetry Collector` 是opentelemetry=可观测性数据采集标准。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 9 行 | <code>     -&gt; receiver</code> | 这一行要理解这些英文词：`receiver` 是接收器，负责接收告警、日志、指标或追踪数据。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 10 行 | <code>     -&gt; processor</code> | 这一行要理解这些英文词：`processor` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 11 行 | <code>     -&gt; exporter</code> | 这一行要理解这些英文词：`exporter` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 12 行 | <code>  -&gt; backend</code> | 这一行要理解这些英文词：`backend` 是后端状态存储。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


必须掌握：

- OTel 是标准和工具箱，不是存储后端。
- 三大信号：traces、metrics、logs。
- Trace、Span、SpanContext、TraceID、SpanID。
- Metric instrument、data point、temporality、aggregation。
- LogRecord、trace/log correlation。
- Resource 和 attributes。
- Semantic conventions。
- Context propagation。
- Instrumentation：自动埋点和手动埋点。
- API 和 SDK 分工。
- OTLP/gRPC、OTLP/HTTP。
- Collector 的 receivers、processors、exporters、connectors、extensions、service.pipelines。
- 常用 Collector 排障命令和日志。

暂时可以先不深挖：

- 每种语言 SDK 的全部 API。
- 自定义 sampler 复杂实现。
- Collector contrib 每个组件的全部配置。
- tail sampling 的高级策略。
- metrics temporality 的后端兼容细节。
- profiles signal 的未来能力。
- OTel operator 的生产级部署细节。

## 官方知识地图

OpenTelemetry 官方文档可按这些模块读：

```text
What is OpenTelemetry
  -> OTel 是什么
  -> OTel 不是什么
  -> generation / export / collection

Concepts
  -> Signals
     -> Traces
     -> Metrics
     -> Logs
     -> Baggage
  -> Context propagation
  -> Semantic conventions
  -> Resources
  -> Instrumentation
  -> Sampling

Specification
  -> API
  -> SDK
  -> Data model
  -> Trace
  -> Metrics
  -> Logs
  -> Resource
  -> Context
  -> Propagators
  -> OTLP

Languages
  -> Java / Python / Go / JavaScript / .NET ...
  -> automatic instrumentation
  -> manual instrumentation
  -> exporters

Collector
  -> Architecture
  -> Configuration
  -> Components
     -> Receivers
     -> Processors
     -> Exporters
     -> Connectors
     -> Extensions
  -> Deployment patterns
  -> Troubleshooting
  -> Internal telemetry
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>What is OpenTelemetry</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; OTel 是什么</code> | 这一行要理解这些英文词：`OTel` 是OpenTelemetry 的缩写，表示可观测性采集标准。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; OTel 不是什么</code> | 这一行要理解这些英文词：`OTel` 是OpenTelemetry 的缩写，表示可观测性采集标准。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; generation / export / collection</code> | 这一行要理解这些英文词：`generation` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`export` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`collection` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 6 行 | <code>Concepts</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 7 行 | <code>  -&gt; Signals</code> | 这一行要理解这些英文词：`Signals` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 8 行 | <code>     -&gt; Traces</code> | 这一行要理解这些英文词：`Traces` 是链路追踪。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 9 行 | <code>     -&gt; Metrics</code> | 这一行要理解这些英文词：`Metrics` 是指标。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 10 行 | <code>     -&gt; Logs</code> | 这一行要理解这些英文词：`Logs` 是日志。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 11 行 | <code>     -&gt; Baggage</code> | 这一行要理解这些英文词：`Baggage` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 12 行 | <code>  -&gt; Context propagation</code> | 这一行要理解这些英文词：`Context propagation` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 13 行 | <code>  -&gt; Semantic conventions</code> | 这一行要理解这些英文词：`Semantic conventions` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 14 行 | <code>  -&gt; Resources</code> | 这一行要理解这些英文词：`Resources` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 15 行 | <code>  -&gt; Instrumentation</code> | 这一行要理解这些英文词：`Instrumentation` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 16 行 | <code>  -&gt; Sampling</code> | 这一行要理解这些英文词：`Sampling` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 17 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 18 行 | <code>Specification</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 19 行 | <code>  -&gt; API</code> | 这一行要理解这些英文词：`API` 是应用程序接口。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 20 行 | <code>  -&gt; SDK</code> | 这一行要理解这些英文词：`SDK` 是英文缩写或固定标识，结合本节上下文记住它代表的组件、命令或状态。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 21 行 | <code>  -&gt; Data model</code> | 这一行要理解这些英文词：`Data model` 是data=数据。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 22 行 | <code>  -&gt; Trace</code> | 这一行要理解这些英文词：`Trace` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 23 行 | <code>  -&gt; Metrics</code> | 这一行要理解这些英文词：`Metrics` 是指标。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 24 行 | <code>  -&gt; Logs</code> | 这一行要理解这些英文词：`Logs` 是日志。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 25 行 | <code>  -&gt; Resource</code> | 这一行要理解这些英文词：`Resource` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 26 行 | <code>  -&gt; Context</code> | 这一行要理解这些英文词：`Context` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 27 行 | <code>  -&gt; Propagators</code> | 这一行要理解这些英文词：`Propagators` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 28 行 | <code>  -&gt; OTLP</code> | 这一行要理解这些英文词：`OTLP` 是OpenTelemetry 的数据传输协议。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 29 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 30 行 | <code>Languages</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 31 行 | <code>  -&gt; Java / Python / Go / JavaScript / .NET ...</code> | 这一行要理解这些英文词：`Java` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`Python` 是编程语言，常用于脚本、数据分析、机器学习和 AIOps 原型；`Go` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`JavaScript` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`NET` 是英文缩写或固定标识，结合本节上下文记住它代表的组件、命令或状态。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 32 行 | <code>  -&gt; automatic instrumentation</code> | 这一行要理解这些英文词：`automatic instrumentation` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 33 行 | <code>  -&gt; manual instrumentation</code> | 这一行要理解这些英文词：`manual instrumentation` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 34 行 | <code>  -&gt; exporters</code> | 这一行要理解这些英文词：`exporters` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 35 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 36 行 | <code>Collector</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 37 行 | <code>  -&gt; Architecture</code> | 这一行要理解这些英文词：`Architecture` 是架构。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 38 行 | <code>  -&gt; Configuration</code> | 这一行要理解这些英文词：`Configuration` 是配置。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 39 行 | <code>  -&gt; Components</code> | 这一行要理解这些英文词：`Components` 是组件集合，表示系统由哪些部分组成。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 40 行 | <code>     -&gt; Receivers</code> | 这一行要理解这些英文词：`Receivers` 是接收器。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 41 行 | <code>     -&gt; Processors</code> | 这一行要理解这些英文词：`Processors` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 42 行 | <code>     -&gt; Exporters</code> | 这一行要理解这些英文词：`Exporters` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 43 行 | <code>     -&gt; Connectors</code> | 这一行要理解这些英文词：`Connectors` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 44 行 | <code>     -&gt; Extensions</code> | 这一行要理解这些英文词：`Extensions` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 45 行 | <code>  -&gt; Deployment patterns</code> | 这一行要理解这些英文词：`Deployment patterns` 是patterns=主机匹配模式。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 46 行 | <code>  -&gt; Troubleshooting</code> | 这一行要理解这些英文词：`Troubleshooting` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 47 行 | <code>  -&gt; Internal telemetry</code> | 这一行要理解这些英文词：`Internal telemetry` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


学习顺序：

```text
先懂三大信号
  -> 再懂 trace/span/context propagation
  -> 再懂 API/SDK/instrumentation
  -> 再懂 OTLP
  -> 再懂 Collector pipeline
  -> 最后接后端和 AIOps 自动化
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>先懂三大信号</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; 再懂 trace/span/context propagation</code> | 这一行要理解这些英文词：`trace` 是链路追踪，记录一次请求经过哪些服务和步骤；`span` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`context propagation` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; 再懂 API/SDK/instrumentation</code> | 这一行要理解这些英文词：`API` 是应用程序接口；`SDK` 是英文缩写或固定标识，结合本节上下文记住它代表的组件、命令或状态；`instrumentation` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; 再懂 OTLP</code> | 这一行要理解这些英文词：`OTLP` 是OpenTelemetry 的数据传输协议。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; 再懂 Collector pipeline</code> | 这一行要理解这些英文词：`Collector pipeline` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>  -&gt; 最后接后端和 AIOps 自动化</code> | 这一行要理解这些英文词：`AIOps` 是智能运维。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


## OpenTelemetry 在 AIOps 链路中的位置

OpenTelemetry 是 AIOps 的遥测采集和标准化层。

```text
应用代码
  -> OTel instrumentation
  -> OTel SDK
  -> OTLP
  -> OTel Collector
  -> Prometheus / Tempo / Jaeger / Loki / Elasticsearch / Vendor Backend
  -> Grafana / Alertmanager / AIOps 分析
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>应用代码</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; OTel instrumentation</code> | 这一行要理解这些英文词：`OTel instrumentation` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; OTel SDK</code> | 这一行要理解这些英文词：`OTel SDK` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; OTLP</code> | 这一行要理解这些英文词：`OTLP` 是OpenTelemetry 的数据传输协议。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; OTel Collector</code> | 这一行要理解这些英文词：`OTel Collector` 是OpenTelemetry Collector，负责接收、处理和转发遥测数据。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>  -&gt; Prometheus / Tempo / Jaeger / Loki / Elasticsearch / Vendor Backend</code> | 这一行要理解这些英文词：`Prometheus` 是指标监控系统；`Tempo` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`Jaeger` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`Loki` 是日志聚合和查询系统，常和 Grafana 配合使用；`Elasticsearch` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`Vendor Backend` 是backend=后端状态存储。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 7 行 | <code>  -&gt; Grafana / Alertmanager / AIOps 分析</code> | 这一行要理解这些英文词：`Grafana` 是仪表盘和可视化平台，用来展示指标、日志和告警数据；`Alertmanager` 是Prometheus 生态里的告警管理器；`AIOps` 是智能运维。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


它给 AIOps 提供：

| 能力 | 价值 |
|---|---|
| Trace | 还原一次请求跨服务路径 |
| Span attributes | 解释每一步操作的上下文 |
| Metrics | 量化延迟、错误率、吞吐、资源 |
| Logs | 保留事件细节和错误栈 |
| Context propagation | 把多个服务的数据串成同一条链 |
| Semantic conventions | 统一字段，方便查询和关联 |
| Collector | 统一接收、处理、采样、脱敏、导出 |
| Vendor-neutral | 后端可替换，应用埋点尽量不重写 |

对 AIOps 来说，OpenTelemetry 的关键不是“多一个采集器”，而是把原本分散的日志、指标、链路用共同上下文关联起来。

## OpenTelemetry 是什么

OpenTelemetry，简称 OTel，是厂商中立的可观测性框架和工具集，用于生成、导出和收集 telemetry data。

Telemetry data 包括：

- traces。
- metrics。
- logs。
- baggage。
- profiles 仍处于发展中。

OpenTelemetry 包含：

| 组成 | 作用 |
|---|---|
| Specification | 定义数据模型、API、SDK 行为和协议 |
| API | 应用和库调用的接口 |
| SDK | API 的实现，负责处理、采样、导出 |
| Instrumentation libraries | 自动或手动埋点库 |
| Semantic conventions | 统一属性命名 |
| OTLP | OpenTelemetry Protocol |
| Collector | 接收、处理、导出 telemetry 的代理/网关 |

OpenTelemetry 不是什么：

- 不是 Prometheus 的替代品。
- 不是日志数据库。
- 不是 trace UI。
- 不是告警系统。
- 不是所有后端的统一查询语言。

它更像标准化的“遥测生产线”。

## 三大信号：traces、metrics、logs

### Traces

Trace 表示一次请求或一次业务操作的完整路径。

```text
Trace: checkout request
  Span: HTTP POST /checkout
    Span: auth service call
    Span: inventory service call
    Span: payment service call
      Span: database query
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Trace: checkout request</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  Span: HTTP POST /checkout</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>    Span: auth service call</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>    Span: inventory service call</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>    Span: payment service call</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 6 行 | <code>      Span: database query</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


Trace 回答：

- 一次请求经过哪些服务？
- 哪一步最慢？
- 哪一步报错？
- 上游和下游关系是什么？

### Metrics

Metric 是可聚合的数值时间序列。

例子：

```text
http.server.request.duration
http.server.active_requests
process.runtime.memory
db.client.operation.duration
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>http.server.request.duration</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>http.server.active_requests</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>process.runtime.memory</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>db.client.operation.duration</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


Metric 回答：

- 错误率多少？
- P95 延迟多少？
- QPS 多少？
- CPU/内存趋势如何？

### Logs

Log 是离散事件记录。

例子：

```json
{
  "timestamp": "2026-07-02T10:00:00Z",
  "severity": "ERROR",
  "body": "payment request failed",
  "trace_id": "abc...",
  "span_id": "def..."
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{</code> | 对象开始，表示下面是一组键值对配置。 |
| 第 2 行 | <code>  "timestamp": "2026-07-02T10:00:00Z",</code> | 设置 `timestamp` 字段，值是 `"2026-07-02T10:00:00Z"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 3 行 | <code>  "severity": "ERROR",</code> | 设置 `severity` 字段，值是 `"ERROR"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 4 行 | <code>  "body": "payment request failed",</code> | 设置 `body` 字段，值是 `"payment request failed"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 5 行 | <code>  "trace_id": "abc...",</code> | 设置 `trace_id` 字段，值是 `"abc..."`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 6 行 | <code>  "span_id": "def..."</code> | 设置 `span_id` 字段，值是 `"def..."`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 7 行 | <code>}</code> | 对象结束，表示这一组键值对配置到这里结束。 |


Log 回答：

- 当时具体发生了什么？
- 错误栈是什么？
- 参数、用户、订单、异常细节是什么？

三者关系：

```text
Metrics 发现异常
Trace 定位慢在哪一段
Logs 解释那一段为什么失败
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Metrics 发现异常</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>Trace 定位慢在哪一段</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>Logs 解释那一段为什么失败</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


## Trace、Span、SpanContext

Trace 由多个 Span 组成。

Span 表示一次操作：

- 一次 HTTP 请求。
- 一次数据库查询。
- 一次消息发送。
- 一次函数内部关键步骤。

Span 常见字段：

| 字段 | 含义 |
|---|---|
| TraceID | 整条 trace 的 ID |
| SpanID | 当前 span 的 ID |
| ParentSpanID | 父 span ID |
| Name | 操作名 |
| StartTime | 开始时间 |
| EndTime | 结束时间 |
| Status | unset / ok / error |
| Attributes | 键值属性 |
| Events | span 内事件 |
| Links | 与其他 span 的弱关联 |

SpanContext 包含 trace 传播所需的核心信息：

```text
trace_id
span_id
trace_flags
trace_state
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>trace_id</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>span_id</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>trace_flags</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>trace_state</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


当服务 A 调服务 B 时，A 会把 context 注入 HTTP headers，B 提取后创建子 span。

## Context propagation

Context propagation 是分布式追踪能跨服务串起来的关键。

没有传播：

```text
frontend trace A
api trace B
db trace C
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>frontend trace A</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>api trace B</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>db trace C</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


每个服务各自一条 trace，无法关联。

有传播：

```text
trace_id=abc
  frontend span
  api span
  db span
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>trace_id=abc</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  frontend span</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>  api span</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>  db span</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


常见传播格式：

- W3C Trace Context：`traceparent`、`tracestate`。
- Baggage：传递业务上下文键值对。

HTTP 头示例：

```text
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


排查 trace 串不起来：

- 上游是否注入 header？
- 下游是否提取 header？
- 中间代理是否转发 header？
- 自动埋点是否覆盖 HTTP client/server？
- 异步消息是否传播 context？

## Baggage

Baggage 是随 context 传播的键值对。

例子：

```text
baggage: tenant_id=acme,plan=premium
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>baggage: tenant_id=acme,plan=premium</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


用途：

- 传递租户信息。
- 做采样决策。
- 给下游 telemetry 添加上下文。

注意：

- baggage 会跨服务传播，不能放敏感信息。
- baggage 过大影响性能和请求头大小。
- 不要滥用 baggage 代替业务参数。

## Resource

Resource 描述产生 telemetry 的实体。

例如：

```yaml
service.name: aiops-api
service.version: 1.2.3
deployment.environment: prod
k8s.namespace.name: aiops
k8s.pod.name: aiops-api-7d9f
cloud.provider: aws
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>service.name: aiops-api</code> | 设置 `service.name` 字段的值为 `aiops-api`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 2 行 | <code>service.version: 1.2.3</code> | 设置 `service.version` 字段的值为 `1.2.3`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 3 行 | <code>deployment.environment: prod</code> | 设置 `deployment.environment` 字段的值为 `prod`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>k8s.namespace.name: aiops</code> | 设置 `k8s.namespace.name` 字段的值为 `aiops`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 5 行 | <code>k8s.pod.name: aiops-api-7d9f</code> | 设置 `k8s.pod.name` 字段的值为 `aiops-api-7d9f`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 6 行 | <code>cloud.provider: aws</code> | 设置 `cloud.provider` 字段的值为 `aws`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


Resource 很重要，因为它回答：

```text
这条 span / metric / log 是谁产生的？
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>这条 span / metric / log 是谁产生的？</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


如果没有 `service.name`，后端 UI 里经常只看到 unknown service。

常见环境变量：

```bash
OTEL_SERVICE_NAME=aiops-api
OTEL_RESOURCE_ATTRIBUTES=deployment.environment=prod,service.version=1.2.3
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>OTEL_SERVICE_NAME=aiops-api</code> | 执行 `otel_service_name=aiops-api` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>OTEL_RESOURCE_ATTRIBUTES=deployment.environment=prod,service.version=1.2.3</code> | 执行 `otel_resource_attributes=deployment.environment=prod,service.version=1.2.3` 相关命令，后面的参数决定它具体操作什么对象。 |


## Attributes 和 Semantic Conventions

Attributes 是 span、metric、log 上的键值对。

Semantic conventions 定义常见属性名。

HTTP span 常见属性：

```text
http.request.method
url.path
http.response.status_code
server.address
server.port
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>http.request.method</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>url.path</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>http.response.status_code</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>server.address</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>server.port</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


数据库 span 常见属性：

```text
db.system
db.operation.name
db.namespace
server.address
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>db.system</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>db.operation.name</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>db.namespace</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>server.address</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


为什么需要语义约定？

如果每个团队都自己命名：

```text
http_status
statusCode
response.status
code
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>http_status</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>statusCode</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>response.status</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>code</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


后端就很难统一分析。Semantic conventions 让不同语言、框架、后端尽量使用同一套字段。

## Instrumentation：自动和手动

Instrumentation 是给应用加遥测的过程。

### 自动埋点

自动埋点通过 agent、库 patch、框架集成等方式自动采集常见操作。

适合：

- HTTP server/client。
- 数据库客户端。
- 消息队列。
- 常见 Web 框架。

优点：

- 改代码少。
- 快速得到基础 trace/metrics。

缺点：

- 业务语义不足。
- 可能采集过多。
- 对框架版本有要求。

### 手动埋点

开发者在关键业务逻辑里显式创建 span、metric、attributes。

例子：

```python
with tracer.start_as_current_span("aiops.analyze_alert") as span:
    span.set_attribute("alert.name", alert_name)
    span.set_attribute("aiops.model", model_name)
    result = analyze(alert)
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>with tracer.start_as_current_span("aiops.analyze_alert") as span:</code> | 上下文管理语句，常用于安全打开文件或管理连接。 |
| 第 2 行 | <code>    span.set_attribute("alert.name", alert_name)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 3 行 | <code>    span.set_attribute("aiops.model", model_name)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 4 行 | <code>    result = analyze(alert)</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |


适合：

- 关键业务步骤。
- 模型推理。
- 规则匹配。
- 告警聚合。
- 复杂异步流程。

最佳实践：自动埋点打底，手动埋点补业务语义。

## API 和 SDK

OpenTelemetry 区分 API 和 SDK。

| 层 | 作用 |
|---|---|
| API | 给应用和库调用的接口 |
| SDK | API 的具体实现，处理采样、处理器、导出器 |

为什么分开？

库作者可以依赖 OTel API，而不强迫用户使用某个 SDK 或后端。

应用启动时配置 SDK：

```text
TracerProvider
  -> Sampler
  -> SpanProcessor
  -> Exporter
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>TracerProvider</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; Sampler</code> | 这一行要理解这些英文词：`Sampler` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; SpanProcessor</code> | 这一行要理解这些英文词：`SpanProcessor` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; Exporter</code> | 这一行要理解这些英文词：`Exporter` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


库里只写：

```text
tracer.start_span(...)
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>tracer.start_span(...)</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


这样生态更解耦。

## Metrics 基础

OpenTelemetry metrics 使用 instruments 记录测量值。

常见 instrument：

| Instrument | 适合什么 |
|---|---|
| Counter | 单调递增计数，如请求数 |
| UpDownCounter | 可增可减，如队列长度 |
| Histogram | 分布，如请求耗时 |
| Gauge / ObservableGauge | 当前值，如温度、内存 |

例子：

```text
http.server.request.duration
  attributes:
    http.request.method=GET
    http.route=/api/alerts
    http.response.status_code=200
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>http.server.request.duration</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  attributes:</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>    http.request.method=GET</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>    http.route=/api/alerts</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>    http.response.status_code=200</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


指标设计要注意 cardinality：

- 不要把 user_id 放 metric attribute。
- 不要把 request_id 放 metric attribute。
- 路径要用 route 模板，不要用原始 URL。

否则 Prometheus 或后端会被高基数拖垮。

## Logs 和 trace 关联

OpenTelemetry logs 可以携带：

- timestamp。
- severity。
- body。
- attributes。
- trace_id。
- span_id。

关键价值是 log correlation：

```text
看到一条 ERROR log
  -> 点 trace_id
  -> 进入完整 trace
  -> 看到上游和下游
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>看到一条 ERROR log</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; 点 trace_id</code> | 这一行要理解这些英文词：`trace_id` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; 进入完整 trace</code> | 这一行要理解这些英文词：`trace` 是链路追踪，记录一次请求经过哪些服务和步骤。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; 看到上游和下游</code> | 这一行表示上一级主题下的子项“看到上游和下游”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |


应用日志要尽量带上 trace_id/span_id。很多语言 SDK 或日志框架集成能自动注入。

## OTLP 是什么

OTLP 是 OpenTelemetry Protocol，用于传输 telemetry data。

它定义：

- 数据编码。
- 传输方式。
- traces、metrics、logs 的传递。

常见端点：

| 协议 | 默认端口 | 常见路径 |
|---|---|---|
| OTLP/gRPC | `4317` | gRPC service |
| OTLP/HTTP | `4318` | `/v1/traces`、`/v1/metrics`、`/v1/logs` |

环境变量示例：

```bash
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317
OTEL_EXPORTER_OTLP_PROTOCOL=grpc
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317</code> | 执行 `otel_exporter_otlp_endpoint=http://otel-collector:4317` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>OTEL_EXPORTER_OTLP_PROTOCOL=grpc</code> | 执行 `otel_exporter_otlp_protocol=grpc` 相关命令，后面的参数决定它具体操作什么对象。 |


HTTP 示例：

```bash
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318
OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318</code> | 执行 `otel_exporter_otlp_endpoint=http://otel-collector:4318` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf</code> | 执行 `otel_exporter_otlp_protocol=http/protobuf` 相关命令，后面的参数决定它具体操作什么对象。 |


常见错误：

- 应用用 gRPC 发到 4318。
- 应用用 HTTP 发到 4317。
- endpoint 写了 `http://` 但 SDK 期望 TLS。
- Collector 没启用对应 receiver protocol。

## Collector 是什么

OpenTelemetry Collector 是一个可部署的遥测代理/网关。

它能：

- 接收多种 telemetry。
- 处理、过滤、批量、采样、添加属性。
- 导出到多个后端。
- 减少应用直接对接多个后端的复杂度。

部署模式：

| 模式 | 说明 |
|---|---|
| Agent | 每台机器或每个 Node 一个，靠近应用 |
| Gateway | 集中式 Collector，接收多个应用/agent 数据 |
| Sidecar | 每个 Pod 一个，较少用，成本高 |

常见组合：

```text
Application -> local/agent Collector -> gateway Collector -> backends
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Application -&gt; local/agent Collector -&gt; gateway Collector -&gt; backends</code> | 这一行要理解这些英文词：`Application` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`local` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`agent Collector` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`gateway Collector` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`backends` 是后端状态存储。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


## Collector 架构

Collector 配置由组件和 pipeline 组成。

组件类型：

| 类型 | 作用 |
|---|---|
| receivers | 接收 telemetry |
| processors | 处理 telemetry |
| exporters | 发送 telemetry 到外部 |
| connectors | 连接 pipeline，既像 exporter 又像 receiver |
| extensions | 提供扩展能力，如 health_check、pprof、zpages |

Pipeline：

```text
receivers -> processors -> exporters
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>receivers -&gt; processors -&gt; exporters</code> | 这一行要理解这些英文词：`receivers` 是接收器；`processors` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`exporters` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


官方文档强调：配置了组件还不够，必须在 `service.pipelines` 里启用。

## Collector 配置结构

最小结构：

```yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch: {}

exporters:
  debug: {}

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [debug]
    metrics:
      receivers: [otlp]
      processors: [batch]
      exporters: [debug]
    logs:
      receivers: [otlp]
      processors: [batch]
      exporters: [debug]
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>receivers:</code> | 定义 `receivers` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  otlp:</code> | 定义 `otlp` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    protocols:</code> | 定义 `protocols` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>      grpc:</code> | 定义 `grpc` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 5 行 | <code>        endpoint: 0.0.0.0:4317</code> | 设置 `endpoint` 字段的值为 `0.0.0.0:4317`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 6 行 | <code>      http:</code> | 定义 `http` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 7 行 | <code>        endpoint: 0.0.0.0:4318</code> | 设置 `endpoint` 字段的值为 `0.0.0.0:4318`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 8 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 9 行 | <code>processors:</code> | 定义 `processors` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 10 行 | <code>  batch: {}</code> | 设置 `batch` 字段的值为 `{}`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 11 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 12 行 | <code>exporters:</code> | 定义 `exporters` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 13 行 | <code>  debug: {}</code> | 设置 `debug` 字段的值为 `{}`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 14 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 15 行 | <code>service:</code> | 定义 `service` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 16 行 | <code>  pipelines:</code> | 定义 `pipelines` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 17 行 | <code>    traces:</code> | 定义 `traces` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 18 行 | <code>      receivers: [otlp]</code> | 设置 `receivers` 字段的值为 `[otlp]`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 19 行 | <code>      processors: [batch]</code> | 设置 `processors` 字段的值为 `[batch]`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 20 行 | <code>      exporters: [debug]</code> | 设置 `exporters` 字段的值为 `[debug]`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 21 行 | <code>    metrics:</code> | 定义 `metrics` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 22 行 | <code>      receivers: [otlp]</code> | 设置 `receivers` 字段的值为 `[otlp]`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 23 行 | <code>      processors: [batch]</code> | 设置 `processors` 字段的值为 `[batch]`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 24 行 | <code>      exporters: [debug]</code> | 设置 `exporters` 字段的值为 `[debug]`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 25 行 | <code>    logs:</code> | 定义 `logs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 26 行 | <code>      receivers: [otlp]</code> | 设置 `receivers` 字段的值为 `[otlp]`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 27 行 | <code>      processors: [batch]</code> | 设置 `processors` 字段的值为 `[batch]`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 28 行 | <code>      exporters: [debug]</code> | 设置 `exporters` 字段的值为 `[debug]`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


解释：

| 段 | 含义 |
|---|---|
| `receivers.otlp` | 开启 OTLP receiver |
| `processors.batch` | 批量发送，提高效率 |
| `exporters.debug` | 输出到日志，适合调试 |
| `service.pipelines.traces` | trace pipeline |
| `service.pipelines.metrics` | metric pipeline |
| `service.pipelines.logs` | log pipeline |

## Receivers

Receiver 接收数据。

常见：

| Receiver | 用途 |
|---|---|
| `otlp` | 接收 OTel SDK 通过 OTLP 发来的数据 |
| `prometheus` | 按 Prometheus scrape 配置抓指标 |
| `jaeger` | 接收 Jaeger 格式 traces |
| `zipkin` | 接收 Zipkin 格式 traces |
| `hostmetrics` | 采集主机指标 |
| `filelog` | 读取日志文件，常在 contrib distribution |

OTLP receiver 示例：

```yaml
receivers:
  otlp:
    protocols:
      grpc:
      http:
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>receivers:</code> | 定义 `receivers` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  otlp:</code> | 定义 `otlp` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    protocols:</code> | 定义 `protocols` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>      grpc:</code> | 定义 `grpc` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 5 行 | <code>      http:</code> | 定义 `http` 配置段，下面缩进的内容都属于这个配置段。 |


如果应用发数据但 Collector 没收到，先看 receiver 是否启用且端口通。

## Processors

Processor 在发送前处理数据。

常见：

| Processor | 用途 |
|---|---|
| `batch` | 批量发送 |
| `memory_limiter` | 防止 Collector 内存失控 |
| `resource` | 添加/修改 resource attributes |
| `attributes` | 添加/修改 span/log attributes |
| `filter` | 过滤 telemetry |
| `transform` | 转换 telemetry |
| `tail_sampling` | trace 尾采样，常在 contrib |

生产常见组合：

```yaml
processors:
  memory_limiter:
    check_interval: 1s
    limit_mib: 512
  batch:
    timeout: 5s
    send_batch_size: 1024
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>processors:</code> | 定义 `processors` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  memory_limiter:</code> | 定义 `memory_limiter` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    check_interval: 1s</code> | 设置 `check_interval` 字段的值为 `1s`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>    limit_mib: 512</code> | 设置 `limit_mib` 字段的值为 `512`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 5 行 | <code>  batch:</code> | 定义 `batch` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 6 行 | <code>    timeout: 5s</code> | 设置 `timeout` 字段的值为 `5s`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 7 行 | <code>    send_batch_size: 1024</code> | 设置 `send_batch_size` 字段的值为 `1024`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


建议：

- `memory_limiter` 放前面。
- `batch` 通常放后面。
- 过滤/转换规则要谨慎，避免误删关键属性。

## Exporters

Exporter 把数据发到后端。

常见：

| Exporter | 用途 |
|---|---|
| `debug` | 打印到日志，调试 |
| `otlp` | 发到另一个 Collector 或支持 OTLP 的后端 |
| `otlphttp` | 用 OTLP/HTTP 发数据 |
| `prometheus` | 暴露 metrics 给 Prometheus scrape |
| `prometheusremotewrite` | remote write 到 Prometheus 兼容后端 |
| `logging` | 旧调试 exporter，很多版本已转向 debug |

OTLP exporter：

```yaml
exporters:
  otlp:
    endpoint: tempo:4317
    tls:
      insecure: true
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>exporters:</code> | 定义 `exporters` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  otlp:</code> | 定义 `otlp` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    endpoint: tempo:4317</code> | 设置 `endpoint` 字段的值为 `tempo:4317`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>    tls:</code> | 定义 `tls` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 5 行 | <code>      insecure: true</code> | 设置 `insecure` 字段的值为 `true`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


Prometheus exporter：

```yaml
exporters:
  prometheus:
    endpoint: 0.0.0.0:9464
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>exporters:</code> | 定义 `exporters` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  prometheus:</code> | 定义 `prometheus` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    endpoint: 0.0.0.0:9464</code> | 设置 `endpoint` 字段的值为 `0.0.0.0:9464`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


注意：exporter 配了不代表会使用，必须放到 pipeline 的 exporters 列表。

## Extensions

Extensions 不直接处理 telemetry 数据流，而是提供辅助能力。

常见：

```yaml
extensions:
  health_check:
  pprof:
  zpages:

service:
  extensions: [health_check, pprof, zpages]
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>extensions:</code> | 定义 `extensions` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  health_check:</code> | 定义 `health_check` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>  pprof:</code> | 定义 `pprof` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>  zpages:</code> | 定义 `zpages` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 5 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 6 行 | <code>service:</code> | 定义 `service` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 7 行 | <code>  extensions: [health_check, pprof, zpages]</code> | 设置 `extensions` 字段的值为 `[health_check, pprof, zpages]`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


用途：

- `health_check`：健康检查。
- `pprof`：性能分析。
- `zpages`：调试页面。

排查 Collector 自身时很有用。

## Connectors

Connector 连接 pipeline。

它可以从一种信号生成另一种信号，或者在 pipelines 之间传递数据。

常见例子：

- spanmetrics connector：从 traces 生成 RED 指标。

入门阶段知道它存在即可。复杂连接器会改变数据流，要画清楚 pipeline。

## 常用环境变量

| 环境变量 | 作用 |
|---|---|
| `OTEL_SERVICE_NAME` | 设置 service.name |
| `OTEL_RESOURCE_ATTRIBUTES` | 设置 resource attributes |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OTLP endpoint |
| `OTEL_EXPORTER_OTLP_PROTOCOL` | OTLP 协议 |
| `OTEL_TRACES_EXPORTER` | trace exporter |
| `OTEL_METRICS_EXPORTER` | metric exporter |
| `OTEL_LOGS_EXPORTER` | log exporter |
| `OTEL_PROPAGATORS` | propagators |
| `OTEL_TRACES_SAMPLER` | trace sampler |
| `OTEL_TRACES_SAMPLER_ARG` | sampler 参数 |

示例：

```bash
export OTEL_SERVICE_NAME=aiops-api
export OTEL_RESOURCE_ATTRIBUTES=deployment.environment=prod,service.version=1.0.0
export OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317
export OTEL_EXPORTER_OTLP_PROTOCOL=grpc
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>export OTEL_SERVICE_NAME=aiops-api</code> | 设置 shell 环境变量，常用于配置 API Key、端口或运行参数。 |
| 第 2 行 | <code>export OTEL_RESOURCE_ATTRIBUTES=deployment.environment=prod,service.version=1.0.0</code> | 设置 shell 环境变量，常用于配置 API Key、端口或运行参数。 |
| 第 3 行 | <code>export OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317</code> | 设置 shell 环境变量，常用于配置 API Key、端口或运行参数。 |
| 第 4 行 | <code>export OTEL_EXPORTER_OTLP_PROTOCOL=grpc</code> | 设置 shell 环境变量，常用于配置 API Key、端口或运行参数。 |


## 采样 Sampling

Trace 数据量可能很大，需要采样。

常见采样：

| 类型 | 思路 |
|---|---|
| head sampling | 请求开始时决定采不采 |
| tail sampling | 请求结束后根据完整 trace 决定采不采 |
| parent-based | 跟随父 span 采样决定 |
| ratio-based | 按比例采样 |

head sampling 成本低，但无法根据最终错误决定。

tail sampling 能保留错误慢请求，但需要 Collector 或后端看到完整 trace，成本更高。

AIOps 常见策略：

- 错误 trace 全保留。
- 慢请求全保留。
- 普通请求按比例采样。
- 关键服务提高采样率。

## AIOps 入门实验

目标：启动一个 Collector，用 OTLP receiver 接收数据，用 debug exporter 打印，确认 pipeline 可用。

### 1. 写 Collector 配置

`otel-collector.yaml`：

```yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  memory_limiter:
    check_interval: 1s
    limit_mib: 256
  batch: {}

exporters:
  debug:
    verbosity: detailed

extensions:
  health_check:

service:
  extensions: [health_check]
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [debug]
    metrics:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [debug]
    logs:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [debug]
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>receivers:</code> | 定义 `receivers` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  otlp:</code> | 定义 `otlp` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    protocols:</code> | 定义 `protocols` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>      grpc:</code> | 定义 `grpc` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 5 行 | <code>        endpoint: 0.0.0.0:4317</code> | 设置 `endpoint` 字段的值为 `0.0.0.0:4317`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 6 行 | <code>      http:</code> | 定义 `http` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 7 行 | <code>        endpoint: 0.0.0.0:4318</code> | 设置 `endpoint` 字段的值为 `0.0.0.0:4318`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 8 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 9 行 | <code>processors:</code> | 定义 `processors` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 10 行 | <code>  memory_limiter:</code> | 定义 `memory_limiter` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 11 行 | <code>    check_interval: 1s</code> | 设置 `check_interval` 字段的值为 `1s`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 12 行 | <code>    limit_mib: 256</code> | 设置 `limit_mib` 字段的值为 `256`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 13 行 | <code>  batch: {}</code> | 设置 `batch` 字段的值为 `{}`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 14 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 15 行 | <code>exporters:</code> | 定义 `exporters` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 16 行 | <code>  debug:</code> | 定义 `debug` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 17 行 | <code>    verbosity: detailed</code> | 设置 `verbosity` 字段的值为 `detailed`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 18 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 19 行 | <code>extensions:</code> | 定义 `extensions` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 20 行 | <code>  health_check:</code> | 定义 `health_check` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 21 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 22 行 | <code>service:</code> | 定义 `service` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 23 行 | <code>  extensions: [health_check]</code> | 设置 `extensions` 字段的值为 `[health_check]`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 24 行 | <code>  pipelines:</code> | 定义 `pipelines` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 25 行 | <code>    traces:</code> | 定义 `traces` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 26 行 | <code>      receivers: [otlp]</code> | 设置 `receivers` 字段的值为 `[otlp]`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 27 行 | <code>      processors: [memory_limiter, batch]</code> | 设置 `processors` 字段的值为 `[memory_limiter, batch]`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 28 行 | <code>      exporters: [debug]</code> | 设置 `exporters` 字段的值为 `[debug]`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 29 行 | <code>    metrics:</code> | 定义 `metrics` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 30 行 | <code>      receivers: [otlp]</code> | 设置 `receivers` 字段的值为 `[otlp]`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 31 行 | <code>      processors: [memory_limiter, batch]</code> | 设置 `processors` 字段的值为 `[memory_limiter, batch]`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 32 行 | <code>      exporters: [debug]</code> | 设置 `exporters` 字段的值为 `[debug]`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 33 行 | <code>    logs:</code> | 定义 `logs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 34 行 | <code>      receivers: [otlp]</code> | 设置 `receivers` 字段的值为 `[otlp]`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 35 行 | <code>      processors: [memory_limiter, batch]</code> | 设置 `processors` 字段的值为 `[memory_limiter, batch]`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 36 行 | <code>      exporters: [debug]</code> | 设置 `exporters` 字段的值为 `[debug]`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


### 2. 启动 Collector

如果本机有 `otelcol`：

```bash
otelcol --config otel-collector.yaml
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>otelcol --config otel-collector.yaml</code> | 执行 `otelcol` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


Docker 示例：

```bash
docker run --rm \
  -p 4317:4317 \
  -p 4318:4318 \
  -p 13133:13133 \
  -v "$PWD/otel-collector.yaml:/etc/otelcol/config.yaml" \
  otel/opentelemetry-collector:latest
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker run --rm \</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 2 行 | <code>  -p 4317:4317 \</code> | 执行 `-p` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>  -p 4318:4318 \</code> | 执行 `-p` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 4 行 | <code>  -p 13133:13133 \</code> | 执行 `-p` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 5 行 | <code>  -v "$PWD/otel-collector.yaml:/etc/otelcol/config.yaml" \</code> | 执行 `-v` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 6 行 | <code>  otel/opentelemetry-collector:latest</code> | 执行 `otel/opentelemetry-collector:latest` 相关命令，后面的参数决定它具体操作什么对象。 |


检查健康：

```bash
curl -v http://127.0.0.1:13133/
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -v http://127.0.0.1:13133/</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |


### 3. 配置应用发送到 Collector

应用环境变量：

```bash
export OTEL_SERVICE_NAME=aiops-demo
export OTEL_RESOURCE_ATTRIBUTES=deployment.environment=local
export OTEL_EXPORTER_OTLP_ENDPOINT=http://127.0.0.1:4317
export OTEL_EXPORTER_OTLP_PROTOCOL=grpc
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>export OTEL_SERVICE_NAME=aiops-demo</code> | 设置 shell 环境变量，常用于配置 API Key、端口或运行参数。 |
| 第 2 行 | <code>export OTEL_RESOURCE_ATTRIBUTES=deployment.environment=local</code> | 设置 shell 环境变量，常用于配置 API Key、端口或运行参数。 |
| 第 3 行 | <code>export OTEL_EXPORTER_OTLP_ENDPOINT=http://127.0.0.1:4317</code> | 设置 shell 环境变量，常用于配置 API Key、端口或运行参数。 |
| 第 4 行 | <code>export OTEL_EXPORTER_OTLP_PROTOCOL=grpc</code> | 设置 shell 环境变量，常用于配置 API Key、端口或运行参数。 |


如果用 HTTP：

```bash
export OTEL_EXPORTER_OTLP_ENDPOINT=http://127.0.0.1:4318
export OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>export OTEL_EXPORTER_OTLP_ENDPOINT=http://127.0.0.1:4318</code> | 设置 shell 环境变量，常用于配置 API Key、端口或运行参数。 |
| 第 2 行 | <code>export OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf</code> | 设置 shell 环境变量，常用于配置 API Key、端口或运行参数。 |


### 4. 观察 Collector 输出

Collector 日志中应该能看到 spans、metrics 或 logs。

记录：

```text
service.name:
trace_id:
span name:
attributes:
resource attributes:
pipeline:
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>service.name:</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>trace_id:</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>span name:</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>attributes:</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>resource attributes:</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 6 行 | <code>pipeline:</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


### 5. 故意制造协议错误

把应用设置成 gRPC，但发到 4318：

```bash
OTEL_EXPORTER_OTLP_ENDPOINT=http://127.0.0.1:4318
OTEL_EXPORTER_OTLP_PROTOCOL=grpc
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>OTEL_EXPORTER_OTLP_ENDPOINT=http://127.0.0.1:4318</code> | 执行 `otel_exporter_otlp_endpoint=http://127.0.0.1:4318` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>OTEL_EXPORTER_OTLP_PROTOCOL=grpc</code> | 执行 `otel_exporter_otlp_protocol=grpc` 相关命令，后面的参数决定它具体操作什么对象。 |


观察应用和 Collector 错误。

这能帮助你记住：

```text
4317 常用 OTLP/gRPC
4318 常用 OTLP/HTTP
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>4317 常用 OTLP/gRPC</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>4318 常用 OTLP/HTTP</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


## 常用命令字典

### 查看 Collector 版本

```bash
otelcol --version
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>otelcol --version</code> | 执行 `otelcol` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


确认 distribution 和版本。

### 启动 Collector

```bash
otelcol --config otel-collector.yaml
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>otelcol --config otel-collector.yaml</code> | 执行 `otelcol` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


### 检查端口

```bash
ss -ltnp | rg "4317|4318|13133"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ss -ltnp &#124; rg "4317&#124;4318&#124;13133"</code> | 查看网络监听和连接，用来确认端口是否打开。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |


看 OTLP 和 health_check 端口是否监听。

### 测健康检查

```bash
curl -v http://127.0.0.1:13133/
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -v http://127.0.0.1:13133/</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |


### Kubernetes 查看 Collector

```bash
kubectl get pods -n observability -l app=otel-collector
kubectl logs -n observability deploy/otel-collector --tail=200
kubectl describe pod -n observability -l app=otel-collector
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>kubectl get pods -n observability -l app=otel-collector</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |
| 第 2 行 | <code>kubectl logs -n observability deploy/otel-collector --tail=200</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 3 行 | <code>kubectl describe pod -n observability -l app=otel-collector</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |


### 测 Collector Service

```bash
kubectl run curl-test -n observability --rm -it --image=curlimages/curl:8.10.1 --restart=Never -- \
  curl -v http://otel-collector:4318/
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>kubectl run curl-test -n observability --rm -it --image=curlimages/curl:8.10.1 --restart=Never -- \</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 2 行 | <code>  curl -v http://otel-collector:4318/</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |


注意：OTLP HTTP endpoint 不是普通页面，404/405 不一定代表端口不通。更重要的是应用 SDK 是否能成功 export。

## 配置字典

### receivers

| 字段 | 作用 | 常见错误 |
|---|---|---|
| `otlp.protocols.grpc` | 接收 OTLP/gRPC | 应用发 HTTP 到 gRPC 端口 |
| `otlp.protocols.http` | 接收 OTLP/HTTP | path/port 错 |
| `prometheus.config.scrape_configs` | Prometheus 风格抓指标 | job 配置错 |
| `hostmetrics.collection_interval` | 主机指标采集间隔 | 权限或路径问题 |

### processors

| 字段 | 作用 | 常见错误 |
|---|---|---|
| `memory_limiter` | 限制 Collector 内存 | limit 太低导致丢数据 |
| `batch` | 批量发送 | 未配置导致效率低 |
| `resource` | 添加 resource 属性 | 覆盖关键字段 |
| `attributes` | 修改 attributes | 误删属性 |
| `filter` | 过滤数据 | 规则写错导致无数据 |
| `tail_sampling` | 尾采样 | 内存和延迟成本高 |

### exporters

| 字段 | 作用 | 常见错误 |
|---|---|---|
| `debug` | 调试输出 | 生产开 detailed 太吵 |
| `otlp.endpoint` | OTLP/gRPC 后端 | TLS/insecure 错 |
| `otlphttp.endpoint` | OTLP/HTTP 后端 | URL path/协议错 |
| `prometheus.endpoint` | 暴露指标 | Prometheus 没 scrape |
| `prometheusremotewrite.endpoint` | remote write | 认证和队列配置错 |

### service

| 字段 | 作用 | 常见错误 |
|---|---|---|
| `service.extensions` | 启用 extensions | 配了 extension 但没启用 |
| `service.pipelines.traces` | trace pipeline | receiver/exporter 漏写 |
| `service.pipelines.metrics` | metric pipeline | signal 放错 pipeline |
| `service.pipelines.logs` | log pipeline | exporter 不支持 logs |
| `telemetry` | Collector 自身 telemetry | 没打开导致排障困难 |

## 典型故障排查表

| 现象 | 先看什么 | 常见原因 | 处理思路 |
|---|---|---|---|
| 应用启动但无 trace | SDK 配置、exporter 日志 | 没启用 instrumentation、endpoint 错 | 打开 SDK debug，检查 env |
| Collector 没收到 | receiver 端口、logs | receiver 未启用、协议错、网络不通 | 查 4317/4318 和 service.pipelines |
| Collector 收到但后端无数据 | exporter logs | exporter endpoint/TLS/auth 错 | 先用 debug exporter |
| trace 串不起来 | traceparent header | context 未传播、中间代理丢 header | 检查 client/server instrumentation |
| service 显示 unknown | resource | 缺 `service.name` | 设置 `OTEL_SERVICE_NAME` |
| metrics 爆炸 | attributes | 高基数字段 | 移除 user_id/request_id 等 |
| Collector OOM | memory、queue | 数据量大、batch/exporter 堵 | memory_limiter、batch、扩容 |
| 数据延迟高 | batch/exporter/backpressure | 后端慢、队列堆积 | 看 Collector internal telemetry |
| log 没 trace_id | logging integration | 日志框架没注入 context | 配置 log correlation |
| OTLP 报协议错误 | endpoint/protocol | gRPC/HTTP 混用 | 4317 对 gRPC，4318 对 HTTP |

## 排障流程：应用没数据

### 1. 应用是否启用 OTel

检查环境变量：

```bash
env | rg "OTEL_"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>env &#124; rg "OTEL_"</code> | 执行 `env` 相关命令，后面的参数决定它具体操作什么对象。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |


重点：

```text
OTEL_SERVICE_NAME
OTEL_EXPORTER_OTLP_ENDPOINT
OTEL_EXPORTER_OTLP_PROTOCOL
OTEL_TRACES_EXPORTER
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>OTEL_SERVICE_NAME</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>OTEL_EXPORTER_OTLP_ENDPOINT</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>OTEL_EXPORTER_OTLP_PROTOCOL</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>OTEL_TRACES_EXPORTER</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


### 2. Collector 是否可达

```bash
curl -v http://otel-collector:4318/
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -v http://otel-collector:4318/</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |


或在 Kubernetes 内：

```bash
kubectl run curl-test --rm -it --image=curlimages/curl:8.10.1 --restart=Never -- \
  curl -v http://otel-collector.observability:4318/
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>kubectl run curl-test --rm -it --image=curlimages/curl:8.10.1 --restart=Never -- \</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 2 行 | <code>  curl -v http://otel-collector.observability:4318/</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |


### 3. Collector 是否启用 receiver

看配置：

```yaml
receivers:
  otlp:
    protocols:
      grpc:
      http:
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>receivers:</code> | 定义 `receivers` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  otlp:</code> | 定义 `otlp` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    protocols:</code> | 定义 `protocols` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>      grpc:</code> | 定义 `grpc` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 5 行 | <code>      http:</code> | 定义 `http` 配置段，下面缩进的内容都属于这个配置段。 |


看 pipeline：

```yaml
service:
  pipelines:
    traces:
      receivers: [otlp]
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>service:</code> | 定义 `service` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  pipelines:</code> | 定义 `pipelines` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    traces:</code> | 定义 `traces` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>      receivers: [otlp]</code> | 设置 `receivers` 字段的值为 `[otlp]`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


### 4. 用 debug exporter 简化后端问题

先把 exporter 改成：

```yaml
exporters:
  debug:
    verbosity: detailed
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>exporters:</code> | 定义 `exporters` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  debug:</code> | 定义 `debug` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    verbosity: detailed</code> | 设置 `verbosity` 字段的值为 `detailed`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


如果 debug 能看到数据，说明应用到 Collector 没问题，后面查 exporter/backend。

## 排障流程：trace 串不起来

检查：

1. 上游 HTTP client 是否埋点？
2. 下游 HTTP server 是否埋点？
3. 请求头里是否有 `traceparent`？
4. API Gateway/NGINX/Ingress 是否转发该 header？
5. 异步消息是否注入/提取 context？
6. 是否某个服务新建 root span 而不是 child span？

临时验证：

```bash
curl -v -H "traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01" \
  http://aiops-api/health
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -v -H "traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01" \</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |
| 第 2 行 | <code>  http://aiops-api/health</code> | 执行 `http://aiops-api/health` 相关命令，后面的参数决定它具体操作什么对象。 |


看应用日志或 trace 后端是否保留同一 trace_id。

## 排障流程：后端无数据

Collector debug 有数据，但后端没有。

检查 exporter：

```yaml
exporters:
  otlp:
    endpoint: tempo:4317
    tls:
      insecure: true
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>exporters:</code> | 定义 `exporters` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  otlp:</code> | 定义 `otlp` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    endpoint: tempo:4317</code> | 设置 `endpoint` 字段的值为 `tempo:4317`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>    tls:</code> | 定义 `tls` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 5 行 | <code>      insecure: true</code> | 设置 `insecure` 字段的值为 `true`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


看 Collector logs：

```bash
kubectl logs -n observability deploy/otel-collector --tail=200
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>kubectl logs -n observability deploy/otel-collector --tail=200</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


常见：

- endpoint DNS 错。
- TLS 配置错。
- token/API key 错。
- exporter 不支持该 signal。
- 后端拒收高基数字段。
- 网络策略阻断。

## AIOps 自动化诊断脚本

```bash
#!/usr/bin/env bash
set -euo pipefail

ns="${1:-observability}"
app="${2:-otel-collector}"

echo "== collector pods =="
kubectl get pods -n "$ns" -l "app=$app" -o wide || true

echo
echo "== collector service =="
kubectl get svc -n "$ns" -l "app=$app" -o wide || true

echo
echo "== logs =="
kubectl logs -n "$ns" -l "app=$app" --tail=200 || true

echo
echo "== describe =="
kubectl describe pod -n "$ns" -l "app=$app" || true

echo
echo "== events =="
kubectl get events -n "$ns" --sort-by=.lastTimestamp || true
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>#!/usr/bin/env bash</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 2 行 | <code>set -euo pipefail</code> | 设置 shell 或工具变量，具体含义取决于当前终端环境。 |
| 第 3 行 | <em>空行</em> | 空行，用来把命令分成更容易阅读的几段。 |
| 第 4 行 | <code>ns="${1:-observability}"</code> | 执行 `ns="${1:-observability}"` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 5 行 | <code>app="${2:-otel-collector}"</code> | 执行 `app="${2:-otel-collector}"` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 6 行 | <em>空行</em> | 空行，用来把命令分成更容易阅读的几段。 |
| 第 7 行 | <code>echo "== collector pods =="</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 8 行 | <code>kubectl get pods -n "$ns" -l "app=$app" -o wide &#124;&#124; true</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |
| 第 9 行 | <em>空行</em> | 空行，用来把命令分成更容易阅读的几段。 |
| 第 10 行 | <code>echo</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 11 行 | <code>echo "== collector service =="</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 12 行 | <code>kubectl get svc -n "$ns" -l "app=$app" -o wide &#124;&#124; true</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |
| 第 13 行 | <em>空行</em> | 空行，用来把命令分成更容易阅读的几段。 |
| 第 14 行 | <code>echo</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 15 行 | <code>echo "== logs =="</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 16 行 | <code>kubectl logs -n "$ns" -l "app=$app" --tail=200 &#124;&#124; true</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |
| 第 17 行 | <em>空行</em> | 空行，用来把命令分成更容易阅读的几段。 |
| 第 18 行 | <code>echo</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 19 行 | <code>echo "== describe =="</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 20 行 | <code>kubectl describe pod -n "$ns" -l "app=$app" &#124;&#124; true</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |
| 第 21 行 | <em>空行</em> | 空行，用来把命令分成更容易阅读的几段。 |
| 第 22 行 | <code>echo</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 23 行 | <code>echo "== events =="</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 24 行 | <code>kubectl get events -n "$ns" --sort-by=.lastTimestamp &#124;&#124; true</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |


生产化前要补：

- 自动读取 Collector ConfigMap。
- 检查 pipelines 中 receiver/exporter 是否启用。
- 检查 4317/4318 Service 端口。
- 查询 Collector internal metrics。
- 检查后端连通性。

## 面试怎么讲

OpenTelemetry 是厂商中立的可观测性标准和工具集，用来生成、采集、处理和导出 traces、metrics、logs。应用通过 OTel API/SDK 和 instrumentation 产生 telemetry，通过 context propagation 把跨服务请求串成同一条 trace，通过 semantic conventions 统一属性名，再用 OTLP 发给 Collector。Collector 由 receivers、processors、exporters、connectors、extensions 和 service pipelines 组成，负责接收、批量、过滤、采样、脱敏和导出数据。排障时我会先确认应用是否启用 SDK 和正确 endpoint，再看 Collector receiver 和 pipeline 是否启用，用 debug exporter 判断数据是否进入 Collector，最后查 exporter、后端和 context propagation。

## 小白可能会问

### OpenTelemetry 是监控后端吗？

不是。它是标准、SDK、协议和 Collector。数据最终要发到 Prometheus、Tempo、Jaeger、Loki、Elasticsearch 或其他后端。

### Trace 和 metric 有什么区别？

Trace 解释一次请求经过哪里、每一步多久；metric 统计一段时间内的数值趋势，如 QPS、错误率、P95。

### 为什么 trace 串不起来？

通常是 context 没有跨服务传播，或者某个 HTTP client/server、消息队列、代理没有正确注入/提取 trace context。

### Collector 配了 receiver 为什么还是没数据？

配置组件不等于启用组件。必须把 receiver 放进 `service.pipelines` 对应信号的 pipeline。

### 4317 和 4318 有什么区别？

4317 常用于 OTLP/gRPC，4318 常用于 OTLP/HTTP。协议和端口混用会导致导出失败。

### 为什么后端显示 unknown service？

通常缺少 `service.name` resource attribute。设置 `OTEL_SERVICE_NAME`。

## 学习路线

第一阶段：信号模型

- traces。
- metrics。
- logs。
- resource。
- attributes。

第二阶段：链路追踪

- TraceID。
- SpanID。
- SpanContext。
- context propagation。
- traceparent。

第三阶段：应用埋点

- API vs SDK。
- 自动埋点。
- 手动埋点。
- semantic conventions。

第四阶段：Collector

- receiver。
- processor。
- exporter。
- extension。
- pipeline。
- debug exporter。

第五阶段：AIOps 集成

- trace/log/metric correlation。
- 错误 trace 自动保留。
- slow trace 采样。
- Collector 内部遥测告警。
- runbook 自动诊断。

## 学习检查清单

- [ ] 我能解释 OpenTelemetry 是什么，不是什么。
- [ ] 我能说出 traces、metrics、logs 分别回答什么问题。
- [ ] 我能解释 Trace、Span、TraceID、SpanID、SpanContext。
- [ ] 我能解释 context propagation 和 `traceparent`。
- [ ] 我能解释 Resource 和 `service.name`。
- [ ] 我能解释 semantic conventions 的价值。
- [ ] 我能解释自动埋点和手动埋点的区别。
- [ ] 我能解释 API 和 SDK 的分工。
- [ ] 我能解释 OTLP/gRPC 和 OTLP/HTTP。
- [ ] 我能写一个最小 Collector 配置。
- [ ] 我能解释 receiver、processor、exporter、extension、pipeline。
- [ ] 我能用 debug exporter 判断 Collector 是否收到数据。
- [ ] 我能排查 unknown service。
- [ ] 我能排查 trace 串不起来。
- [ ] 我能排查 Collector 收到但后端无数据。
- [ ] 我能把 OTel 诊断步骤写进 AIOps runbook。

## 面试题

1. OpenTelemetry 解决什么问题？
2. OpenTelemetry 和 Prometheus、Jaeger、Loki 是什么关系？
3. traces、metrics、logs 的区别是什么？
4. Trace 和 Span 是什么？
5. TraceID 和 SpanID 分别是什么？
6. Context propagation 为什么重要？
7. `traceparent` 是什么？
8. Resource 和 attributes 有什么区别？
9. `service.name` 为什么重要？
10. Semantic conventions 有什么价值？
11. 自动埋点和手动埋点分别适合什么？
12. OTel API 和 SDK 为什么分开？
13. OTLP 是什么？
14. 4317 和 4318 常见区别是什么？
15. Collector 的 receiver、processor、exporter 分别做什么？
16. 配了 receiver 但 pipeline 没引用会怎样？
17. debug exporter 有什么用？
18. trace 串不起来怎么排查？
19. metrics 高基数问题怎么避免？
20. OpenTelemetry 在 AIOps 中如何帮助根因分析？

## 学习证据

完成本篇后，建议留下这些证据：

- 一个 `otel-collector.yaml`，包含 OTLP receiver、memory_limiter、batch、debug exporter。
- 一份应用环境变量配置记录。
- 一份 Collector debug exporter 输出样例。
- 一份 traceparent 传播实验记录。
- 一份 unknown service 排障记录。
- 一个 OTel Collector 诊断脚本，能采集 Pod、Service、logs、events 和配置。
