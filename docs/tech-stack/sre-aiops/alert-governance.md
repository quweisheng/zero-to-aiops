# 告警治理

## 官方资料

- [Google SRE Book - Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/)
- [Google SRE Book - Practical Alerting](https://sre.google/sre-book/practical-alerting/)
- [Google SRE Workbook - Alerting on SLOs](https://sre.google/workbook/alerting-on-slos/)
- [Azure Monitor alerts overview](https://learn.microsoft.com/en-us/azure/azure-monitor/alerts/alerts-overview)

> 学习说明：本篇基于 Google SRE 的监控和告警原则，结合 Prometheus / Alertmanager 的落地方式，整理成可执行的告警治理教程。

## 为什么要学

告警不是越多越安全。太多无效告警会让值班人员麻木，真正故障反而被淹没。AIOps 的很多落地价值，第一步就是治理告警质量。

## 它解决什么问题

- 减少重复、低价值和不可行动告警。
- 区分症状告警、原因告警和噪声。
- 建立告警分级、路由、抑制和静默规则。
- 让告警能对应清晰 runbook。
- 为告警聚类、降噪和自动摘要提供干净输入。

## 是什么

告警治理是把“会响的告警”治理成“值得人处理的信号”。

它解决的问题：

- 告警太多，值班人员疲劳。
- 告警重复，真正故障被噪声淹没。
- 告警不可行动，只能看不能处理。
- 告警指向原因太细，用户影响不清楚。
- 告警没有 owner，没人负责。

Google SRE 对 page 的要求非常清晰：每次 page 都应该紧急、可行动、需要人的判断，并且指向新的问题。

## 核心原理

好的告警要满足四个条件：

| 条件 | 说明 |
|---|---|
| 用户影响 | 真的影响用户或即将影响用户 |
| 紧急 | 不能等到明天处理 |
| 可行动 | 值班人员知道下一步做什么 |
| 低噪声 | 不应该频繁误报或重复报 |

告警不是“指标超过阈值就响”。告警应该是“系统需要人介入”。

## 架构

告警治理链路：

```text
metrics / logs / traces
  -> alert rules
  -> labels
  -> Alertmanager grouping
  -> routing
  -> inhibition / silence
  -> notification
  -> incident
  -> post-incident review
  -> rule improvement
```

每一层都能降噪：

- 规则层：减少无意义告警。
- 标签层：提供 owner、service、severity。
- 分组层：把同类告警合并。
- 路由层：发给正确的人。
- 抑制层：根因告警出现时抑制衍生告警。
- 复盘层：持续删除坏告警。

## 告警分级

推荐先用三类：

| 级别 | 含义 | 通知方式 |
|---|---|---|
| page | 用户正在受影响，需要立刻处理 | 电话、短信、PagerDuty、企业微信强提醒 |
| ticket | 需要处理，但可以排队 | Jira、GitHub Issue、工单 |
| info | 记录事实，不要求处理 | 日志、日报、仪表盘 |

不要把所有 warning 都发给值班人。page 应该很少但重要。

## 告警规则设计

### 优先告警症状

症状是用户看到的问题：

- 请求失败。
- 延迟升高。
- 任务积压。
- 数据不可用。

原因是内部可能因素：

- CPU 高。
- 磁盘快满。
- 数据库连接池耗尽。
- 下游超时。

告警策略：

```text
page: 优先症状告警
ticket: 重要原因告警
dashboard: 详细原因指标
```

### 四个黄金信号

Google SRE 建议用户侧服务优先关注四个黄金信号：

| 信号 | 含义 | 示例 |
|---|---|---|
| Latency | 延迟 | p95 / p99 |
| Traffic | 流量 | requests per second |
| Errors | 错误 | 5xx rate |
| Saturation | 饱和度 | CPU、内存、队列、连接池 |

### 示例告警

错误率：

```yaml
- alert: HighErrorRate
  expr: |
    sum(rate(http_requests_total{job="order-api",code=~"5.."}[5m]))
    /
    sum(rate(http_requests_total{job="order-api"}[5m]))
    > 0.05
  for: 5m
  labels:
    severity: page
    service: order-api
    owner: team-order
  annotations:
    summary: "order-api 5xx error rate is above 5%"
    runbook_url: "https://github.com/quweisheng/zero-to-aiops/tree/main/runbooks/order-api-high-error-rate.md"
```

延迟：

```yaml
- alert: HighLatency
  expr: |
    histogram_quantile(
      0.95,
      sum(rate(http_request_duration_seconds_bucket{job="order-api"}[5m])) by (le)
    ) > 1
  for: 10m
  labels:
    severity: ticket
    service: order-api
```

## Alertmanager 配置重点

分组：

```yaml
route:
  group_by: ['alertname', 'service']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  receiver: default
```

路由：

```yaml
routes:
  - matchers:
      - severity="page"
    receiver: oncall
  - matchers:
      - severity="ticket"
    receiver: ticket-system
```

抑制：

```yaml
inhibit_rules:
  - source_matchers:
      - alertname="ServiceDown"
    target_matchers:
      - severity="ticket"
    equal: ['service']
```

含义：如果服务已经 Down，就抑制同服务的一些次级 ticket 告警，避免风暴。

## 告警标签规范

每条告警至少有：

| 标签 | 示例 | 作用 |
|---|---|---|
| `service` | `order-api` | 归属服务 |
| `severity` | `page` | 通知级别 |
| `owner` | `team-order` | 责任团队 |
| `environment` | `prod` | 环境 |
| `cluster` | `tianjin-prod-1` | 集群 |

annotations 至少有：

| annotation | 作用 |
|---|---|
| `summary` | 简短说明 |
| `description` | 详细说明 |
| `runbook_url` | 处理文档 |
| `dashboard_url` | 相关仪表盘 |

## 告警治理指标

你也要监控告警系统本身。

| 指标 | 目标 |
|---|---|
| 每周 page 数 | 趋势下降 |
| 重复告警率 | 趋势下降 |
| 无行动告警数 | 趋势下降 |
| 平均确认时间 | 趋势下降 |
| 平均恢复时间 | 趋势下降 |
| 告警有 runbook 比例 | 趋势上升 |
| 告警有 owner 比例 | 100% |

可以建一个 `alert_review.csv`：

```csv
date,alertname,service,severity,fired_count,actionable,owner,decision
2026-07-01,HighErrorRate,order-api,page,3,yes,team-order,keep
2026-07-01,CPUHigh,order-api,page,40,no,team-order,downgrade_to_ticket
```

## AIOps 中的作用

告警治理是 AIOps 的输入质量控制：

```text
raw alerts
  -> governance
      -> dedup
      -> grouping
      -> routing
      -> severity normalization
  -> AIOps correlation
  -> incident
  -> runbook / automation
```

如果告警本身混乱，后面的 AI 分析也会混乱。

## 入门练习：告警体检表

目录建议：

```text
projects/alert-governance-review/
  README.md
  alert-rules.yaml
  alert-review.csv
  improved-alert-rules.yaml
```

任务：

1. 写 5 条初始告警规则。
2. 给每条规则补充 `service`、`severity`、`owner`、`runbook_url`。
3. 判断是否可行动。
4. 把噪声告警降级或删除。
5. 写出治理前后对比。

## 常见错误

### 所有告警都是 page

结果一定是疲劳。page 只留给需要立刻处理的用户影响事件。

### 只写原因告警

CPU 高不一定影响用户。用户侧错误率、延迟、可用性更适合作为 page。

### 没有 runbook

没有 runbook 的告警会让新人值班非常痛苦。

### repeat interval 太短

告警一直重复会制造噪声。重复间隔要根据故障紧急程度和响应流程设计。

## 学习检查清单

- [ ] 我能判断一个告警是否可行动。
- [ ] 我能区分症状告警和根因告警。
- [ ] 我能设计告警等级和通知渠道。
- [ ] 我能解释 grouping、silence、inhibition。
- [ ] 我能写一份告警治理清单。
- [ ] 我能用数据衡量告警治理效果。

## 面试题

1. 什么是好告警？
2. 告警太多会造成什么问题？
3. 症状告警和原因告警有什么区别？
4. 为什么每个告警最好要有 runbook？
5. 告警分级应该考虑哪些因素？
6. 如何衡量告警治理是否有效？
7. Alertmanager 如何支持告警治理？
8. AIOps 告警降噪和传统阈值告警有什么关系？

## 学习证据

学完后，在 GitHub 留下：

- 一份告警规则。
- 一份告警体检表。
- 一份改进后的告警规则。
- README 解释哪些告警保留、降级、删除，以及原因。
