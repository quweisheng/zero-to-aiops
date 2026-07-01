# 项目 1：可观测性实验室

## 背景

AIOps 的第一步不是模型，而是数据。这个项目用于证明我能从零搭建一个最小可观测闭环。

## 目标

- 一个 demo 服务暴露 HTTP 接口。
- Prometheus 采集指标。
- Grafana 展示仪表盘。
- OpenTelemetry Collector 接收 trace 或 metric。
- 至少一个告警能被触发并写入处理 runbook。

## 最小架构

```text
demo service
  | metrics
  v
Prometheus ----> Grafana dashboard
  |
  v
Alertmanager ----> runbook.md

demo service ---- traces/logs ----> OpenTelemetry Collector
```

## 学习点

- RED 指标：Rate、Errors、Duration。
- USE 指标：Utilization、Saturation、Errors。
- PromQL 基础查询。
- 告警阈值如何绑定业务影响。
- 仪表盘如何服务值班，而不是只追求好看。

## 验收

- README 里有启动命令。
- 有一张仪表盘截图。
- 有一个告警规则。
- 有一个 runbook。
- 有一篇复盘：这个实验室离生产还差什么。

## 简历表达草稿

搭建基于 Prometheus、Grafana、OpenTelemetry 的最小可观测性实验室，为 demo 服务设计延迟、错误率、吞吐量和资源类指标，并配置告警与 runbook，形成从发现到处理的闭环。
