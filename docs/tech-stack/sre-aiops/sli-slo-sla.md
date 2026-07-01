# SLI / SLO / SLA

## 官方资料

- [Google SRE Book - Service Level Objectives](https://sre.google/sre-book/service-level-objectives/)
- [Google SRE Workbook - Implementing SLOs](https://sre.google/workbook/implementing-slos/)
- [Google SRE Workbook - Alerting on SLOs](https://sre.google/workbook/alerting-on-slos/)

> 学习说明：本篇基于 Google SRE 对 SLI、SLO、SLA、错误预算和基于 SLO 告警的官方说明，整理成 AIOps 初学者可以落地的中文教程。

## 为什么要学

SRE 的核心不是“监控越多越好”，而是用 SLI/SLO 把可靠性目标说清楚。AIOps 做异常检测和告警治理时，也必须知道哪些指标真正代表用户体验。

## 它解决什么问题

- 明确服务可靠性应该如何衡量。
- 区分用户影响指标和普通资源指标。
- 用 SLO 判断是否需要告警、限流、回滚或暂停发布。
- 用错误预算平衡稳定性和迭代速度。
- 为 AIOps 异常检测提供业务目标。

## 是什么

SLI、SLO、SLA 是稳定性管理的三件套：

| 名词 | 全称 | 一句话理解 |
|---|---|---|
| SLI | Service Level Indicator | 衡量服务表现的指标 |
| SLO | Service Level Objective | 对 SLI 设置的目标 |
| SLA | Service Level Agreement | 对外承诺，通常带违约后果 |

例子：

```text
SLI: HTTP 请求成功率
SLO: 最近 30 天 99.9% 的请求成功
SLA: 如果低于 99.9%，按合同赔偿或补偿
```

运维转 AIOps 时，SLI/SLO 是把“工具数据”变成“业务稳定性语言”的关键。

## 核心原理

Google SRE 的核心观点是：不要从“我能采集什么指标”开始，而要从“用户关心什么体验”开始。

常见用户体验：

- 请求能不能成功。
- 响应是不是足够快。
- 数据有没有丢。
- 任务有没有按时完成。
- 系统是否能承受当前流量。

对应 SLI：

| 用户体验 | SLI 示例 |
|---|---|
| 能不能用 | 可用性、成功率 |
| 快不快 | 延迟分位数，比如 p95、p99 |
| 准不准 | 正确性、数据一致性 |
| 能不能处理完 | 吞吐、队列延迟 |
| 数据是否可靠 | 持久性、丢失率 |

## 架构

SLO 管理链路：

```text
user journey
  -> SLI definition
  -> Prometheus / logs / traces measurement
  -> SLO target
  -> error budget
  -> burn rate alert
  -> incident / change decision
```

关键是闭环：

- 没有 SLI，就不知道测什么。
- 没有 SLO，就不知道多好才算够。
- 没有错误预算，就不知道什么时候应该暂停变更。
- 没有告警，就不能及时发现预算燃烧。

## SLI 设计

### 可用性 SLI

```text
good events / total events
```

HTTP 服务：

```text
成功请求数 / 总请求数
```

PromQL 示例：

```text
sum(rate(http_requests_total{job="order-api",code!~"5.."}[5m]))
/
sum(rate(http_requests_total{job="order-api"}[5m]))
```

### 延迟 SLI

不要只看平均值，优先看分位数。

```text
99% 的请求延迟 < 500ms
```

PromQL 示例：

```text
histogram_quantile(
  0.99,
  sum(rate(http_request_duration_seconds_bucket{job="order-api"}[5m])) by (le)
)
```

### 任务型 SLI

批处理、数据同步、备份任务适合：

```text
在 30 分钟内完成的任务数 / 总任务数
```

### 数据系统 SLI

数据库、对象存储、消息队列可以关注：

- 读写成功率。
- 读写延迟。
- 数据持久性。
- 消息积压时间。
- 消费延迟。

## SLO 设计

SLO 要写清楚：

| 项目 | 示例 |
|---|---|
| 指标 | HTTP 成功率 |
| 范围 | `order-api` 外部用户请求 |
| 时间窗口 | 30 天滚动窗口 |
| 目标 | 99.9% |
| 排除项 | 健康检查、压测流量、明确维护窗口 |
| 数据来源 | Prometheus |

完整写法：

```text
order-api 在任意连续 30 天内，外部用户 HTTP 请求成功率 >= 99.9%。
成功请求定义为非 5xx 响应；健康检查、压测流量、维护窗口请求不计入。
数据来源为 Prometheus 中的 http_requests_total。
```

## 错误预算

错误预算是允许失败的空间。

```text
错误预算 = 1 - SLO
```

如果 SLO 是 99.9%，错误预算是 0.1%。

在 30 天内有 1,000,000 次请求：

```text
允许失败请求 = 1,000,000 * 0.001 = 1,000
```

错误预算的意义：

- 预算充足：可以正常发布和实验。
- 预算燃烧过快：减少变更，优先可靠性。
- 预算耗尽：暂停高风险发布，先修稳定性。

## Burn Rate

Burn rate 是错误预算燃烧速度。

```text
burn rate = 当前错误率 / 允许错误率
```

SLO 99.9% 的允许错误率是 0.1%。

如果当前错误率是 1%：

```text
burn rate = 1% / 0.1% = 10
```

这意味着预算消耗速度是正常允许速度的 10 倍。

Google SRE Workbook 推荐多窗口、多 burn rate 告警思想：

```text
短窗口：快速发现严重问题
长窗口：确认问题持续存在，降低误报
```

## Prometheus 记录规则示例

请求错误率：

```yaml
groups:
  - name: order-api-slo
    rules:
      - record: job:slo_errors_per_request:ratio_rate5m
        expr: |
          sum(rate(http_requests_total{job="order-api",code=~"5.."}[5m]))
          /
          sum(rate(http_requests_total{job="order-api"}[5m]))

      - record: job:slo_errors_per_request:ratio_rate1h
        expr: |
          sum(rate(http_requests_total{job="order-api",code=~"5.."}[1h]))
          /
          sum(rate(http_requests_total{job="order-api"}[1h]))
```

告警规则：

```yaml
groups:
  - name: order-api-slo-alerts
    rules:
      - alert: OrderAPIHighErrorBudgetBurn
        expr: |
          job:slo_errors_per_request:ratio_rate1h{job="order-api"} > 14.4 * 0.001
          and
          job:slo_errors_per_request:ratio_rate5m{job="order-api"} > 14.4 * 0.001
        for: 2m
        labels:
          severity: page
        annotations:
          summary: "order-api error budget is burning too fast"
```

## AIOps 中的作用

SLI/SLO/SLA 是 AIOps 的目标层：

```text
telemetry
  -> SLI
  -> SLO
  -> error budget
  -> alert governance
  -> incident response
  -> AIOps analysis
  -> reliability decision
```

没有 SLO，AIOps 很容易变成“检测一堆异常”，但不知道哪些异常真的影响用户。

## 入门练习：为 order-api 写 SLO

目录建议：

```text
projects/slo-order-api/
  README.md
  slo.md
  prometheus-recording-rules.yaml
  prometheus-alert-rules.yaml
```

`slo.md` 必须包含：

- 服务名。
- 用户是谁。
- 用户旅程。
- SLI 定义。
- SLO 目标。
- 时间窗口。
- 数据来源。
- 排除项。
- 错误预算计算。
- 告警策略。

## 常见错误

### SLO 目标过高

99.999% 听起来厉害，但可能需要昂贵架构和高维护成本。SLO 不是越高越好，而是要符合用户需要和团队能力。

### 直接用 CPU 当 SLI

CPU 是原因信号，不是用户体验。用户更关心请求是否成功、延迟是否可接受。

### 只看平均延迟

平均值会隐藏长尾。用户体验常被 p95、p99 延迟影响。

### SLO 太多

每个服务先定义 2 到 4 个关键 SLO。太多会让团队失去焦点。

## 学习检查清单

- [ ] 我能解释 SLI、SLO、SLA 的区别。
- [ ] 我能为一个 HTTP 服务设计可用性和延迟 SLI。
- [ ] 我能用 PromQL 表达错误率或延迟 SLO。
- [ ] 我能解释错误预算。
- [ ] 我能说明为什么不应该对所有指标都告警。
- [ ] 我能把 SLO 和发布决策关联起来。

## 面试题

1. SLI、SLO、SLA 分别是什么？
2. 为什么 SLI 应该尽量贴近用户体验？
3. 错误预算有什么作用？
4. 99.9% 可用性意味着每月大约允许多少不可用时间？
5. 为什么 CPU 不是最好的用户体验 SLI？
6. SLO 违反时应该触发哪些动作？
7. 如何用 SLO 改善告警质量？
8. AIOps 异常检测为什么需要 SLO 背景？

## 学习证据

学完后，在 GitHub 留下：

- 一个服务的 `slo.md`。
- 一组 Prometheus recording rules。
- 一组 burn rate alert rules。
- 错误预算计算过程。
- README 解释 SLI、SLO、SLA 的区别。
