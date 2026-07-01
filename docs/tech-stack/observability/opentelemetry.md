# OpenTelemetry

> 目标：理解 metrics、logs、traces 的统一采集方式，能配置 OpenTelemetry Collector 的 receiver、processor、exporter 和 pipeline。

## 官方资料

- [OpenTelemetry docs](https://opentelemetry.io/docs/)
- [OpenTelemetry Collector](https://opentelemetry.io/docs/collector/)
- [Collector configuration](https://opentelemetry.io/docs/collector/configuration/)
- [Collector architecture](https://opentelemetry.io/docs/collector/architecture/)

说明：本文是基于 OpenTelemetry 官方文档的原创中文学习教程，不复制官方全文。

## 是什么

OpenTelemetry 是开放的可观测性框架，用来生成、采集、处理和导出遥测数据。它支持三类核心信号：

- Traces：链路追踪。
- Metrics：指标。
- Logs：日志。

## 核心原理

应用通过 SDK 或自动 instrumentation 产生遥测数据，然后发送给 Collector。Collector 接收数据、处理数据、导出到后端。

```text
Application
  -> OpenTelemetry SDK / auto instrumentation
  -> OpenTelemetry Collector
       receivers
       processors
       exporters
  -> backend: Prometheus / Jaeger / Tempo / Loki / Elasticsearch
```

## Collector 架构

Collector 由四类组件组成：

- Receiver：接收数据。
- Processor：处理数据。
- Exporter：导出数据。
- Connector：连接 pipeline。

Pipeline 把三者串起来：

```text
receiver -> processor -> exporter
```

## 最小配置

```yaml
receivers:
  otlp:
    protocols:
      grpc:
      http:

processors:
  batch:

exporters:
  debug:

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [debug]
```

## 常见端口

- OTLP gRPC：`4317`
- OTLP HTTP：`4318`

## Receiver

常见 receiver：

- `otlp`：接收 OTLP 协议。
- `prometheus`：抓取 Prometheus 格式指标。
- `hostmetrics`：采集主机指标。
- `filelog`：读取日志文件。

示例：

```yaml
receivers:
  prometheus:
    config:
      scrape_configs:
        - job_name: "demo"
          static_configs:
            - targets: ["demo:8000"]
```

## Processor

常见 processor：

- `batch`：批量发送，提高效率。
- `memory_limiter`：限制内存。
- `attributes`：增删改属性。
- `filter`：过滤数据。

## Exporter

常见 exporter：

- `debug`：打印到日志，适合入门。
- `otlp`：导出到支持 OTLP 的后端。
- `prometheus`：暴露 Prometheus 可抓取指标。

## 在 AIOps 中的作用

- 统一遥测采集入口。
- 让指标、日志、链路可关联。
- 为根因分析提供上下文。
- 减少工具锁定，后端可以替换。

## 入门实验

目标：让 Collector 接收 OTLP 并打印。

1. 写 `otel-collector-config.yaml`。
2. 启动 Collector。
3. 用 demo app 或示例工具发送 trace。
4. 在 Collector 日志里看到输出。

Docker 运行示例：

```bash
docker run --rm \
  -p 4317:4317 \
  -p 4318:4318 \
  -v "$PWD/otel-collector-config.yaml:/etc/otelcol/config.yaml" \
  otel/opentelemetry-collector
```

## 排障清单

### Collector 启动失败

- YAML 缩进是否正确。
- receiver/processor/exporter 名称是否在 pipeline 中引用。
- 镜像版本是否支持该组件。

### 收不到数据

- 应用 OTLP endpoint 是否配置正确。
- gRPC/HTTP 端口是否混淆。
- Docker 网络是否可达。

### 后端无数据

- 先用 `debug` exporter 验证 Collector 是否收到数据。
- 再检查 exporter 配置。

## 学习证据

- `otel-collector-config.yaml`
- 一篇记录：receiver、processor、exporter、pipeline 分别是什么。
- 一个 demo：应用 trace 能进入 Collector。
