# SLI / SLO / SLA

> 目标：不是背会三个缩写，而是能从用户体验出发定义 SLI，把 SLI 写成可测量的 SLO，用错误预算指导发布和稳定性工作，并用 burn rate 告警把“服务是否伤害用户”接入 Prometheus、Alertmanager 和 AIOps。

## 官方资料

优先读这些 Google SRE 官方资料：

- [Google SRE Book - Service Level Objectives](https://sre.google/sre-book/service-level-objectives/)
- [Google SRE Workbook - Implementing SLOs](https://sre.google/workbook/implementing-slos/)
- [Google SRE Workbook - Alerting on SLOs](https://sre.google/workbook/alerting-on-slos/)
- [Google SRE Workbook - Error Budget Policy](https://sre.google/workbook/error-budget-policy/)
- [Google SRE Book - Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/)
- [Google SRE Book - Embracing Risk](https://sre.google/sre-book/embracing-risk/)

说明：本文基于 Google SRE 对 SLI、SLO、SLA、错误预算和 SLO 告警的官方说明，整理成 AIOps 初学者可以落地的中文教程。

## 场景开场

凌晨 2 点，值班群里来了三条告警：

```text
CPU 92%
order-api 5xx rate 1.2%
p99 latency 3s
```

到底哪条应该叫醒人？

如果没有 SLI/SLO，团队很容易把“能采集到的指标”都当成告警依据。结果是：

- CPU 高就告警，但用户可能没受影响。
- 平均延迟正常，但 p99 已经很差。
- 错误率升高一点点，不知道是否值得打断发布。
- 每个团队对“服务还行不行”有不同口径。

SLI/SLO/SLA 的价值，是把稳定性从“感觉”和“资源指标”变成“用户体验指标 + 明确目标 + 预算决策”。

## 一句话人话版

SLI/SLO/SLA 是描述服务可靠性的三层语言：SLI 是怎么量，SLO 是量到多少算够好，SLA 是对外承诺以及没做到会有什么后果。

## 小白可能会问

- CPU、内存、磁盘能不能直接当 SLI？
- 为什么 Google SRE 说不要从能采集什么指标开始？
- SLO 为什么不能设成 100%？
- 99%、99.9%、99.99% 差别到底有多大？
- 错误预算怎么影响发布？
- burn rate 是什么？
- 为什么 SLO 告警要用多个窗口？
- 低流量服务为什么 SLO 告警容易误报？
- SLA 和 SLO 有什么实际区别？
- AIOps 异常检测为什么要对齐 SLO？

## 官方知识地图

Google SRE 的 SLO 知识可以按这张图理解：

```text
User journey
  -> What users care about
     -> availability
     -> latency
     -> correctness
     -> freshness
     -> durability
  -> SLI
     -> good events / total events
     -> latency threshold
     -> freshness threshold
     -> correctness checks
  -> SLO
     -> target
     -> window
     -> scope
     -> exclusions
     -> data source
  -> Error budget
     -> 1 - SLO
     -> release decision
     -> reliability work priority
  -> Burn-rate alerting
     -> short window
     -> long window
     -> page vs ticket
  -> AIOps
     -> SLO-centered anomaly detection
     -> alert prioritization
     -> incident impact
```

初学路线：

```text
choose user journey
  -> define good and bad events
  -> write availability SLI
  -> write latency SLI
  -> choose SLO target
  -> calculate error budget
  -> create recording rules
  -> create burn-rate alerts
  -> use budget in change decisions
```

## 三个概念

| 名词 | 全称 | 一句话理解 |
|---|---|---|
| SLI | Service Level Indicator | 衡量服务表现的指标 |
| SLO | Service Level Objective | SLI 应该达到的目标 |
| SLA | Service Level Agreement | 对外承诺，通常带业务或合同后果 |

例子：

```text
SLI: order-api 外部请求成功率
SLO: 最近 30 天成功率 >= 99.9%
SLA: 如果低于 99.9%，客户可获得服务补偿
```

最容易记错的是：

```text
SLI 是指标。
SLO 是目标。
SLA 是承诺和后果。
```

## SLI 是什么

Google SRE 对 SLI 的核心定义是：对服务水平某个方面的仔细定义的定量度量。

翻成人话：

```text
SLI = 用数字衡量用户体验。
```

常见 SLI：

| 服务类型 | SLI | 用户关心的问题 |
|---|---|---|
| HTTP API | 可用性 | 请求能不能成功 |
| HTTP API | 延迟 | 请求快不快 |
| 批处理 | 新鲜度 | 数据是否及时更新 |
| 批处理 | 覆盖率 | 应处理的数据是否处理完 |
| 存储 | 持久性 | 写入的数据以后能不能读到 |
| 搜索 | 正确性 | 返回结果是否正确 |
| 消息系统 | 消费延迟 | 消息是否及时被处理 |

重要原则：

```text
不要用所有指标当 SLI。
选择少数能代表用户体验的指标。
```

Google SRE 也提醒，用户真正关心的体验有时只能通过代理指标近似。例如客户端延迟最贴近用户，但你可能只有服务端延迟。要清楚写明测量来源。

## SLO 是什么

SLO 是 SLI 的目标。

格式：

```text
在某个时间窗口内，某个 SLI 达到某个目标。
```

示例：

```text
order-api 在任意连续 30 天内，外部用户 HTTP 请求成功率 >= 99.9%。
```

一个完整 SLO 要写清楚：

| 项目 | 示例 |
|---|---|
| 服务 | order-api |
| 用户旅程 | 外部用户下单接口 |
| SLI | HTTP 请求成功率 |
| good event | 非 5xx 响应 |
| total event | 所有外部用户请求 |
| 时间窗口 | 30 天滚动窗口 |
| 目标 | 99.9% |
| 排除项 | 健康检查、压测、维护窗口 |
| 数据来源 | Prometheus `http_requests_total` |

不完整写法：

```text
order-api 可用性 99.9%。
```

问题是没人知道：

- 哪些请求算进来？
- 4xx 算失败吗？
- 健康检查算吗？
- 时间窗口是什么？
- 数据从哪里来？
- 维护窗口是否排除？

## SLA 是什么

SLA 是面向用户或客户的服务级别协议。

判断一个目标是不是 SLA，可以问：

```text
没做到会发生什么明确后果？
```

如果没有明确补偿、赔偿、服务条款后果，那通常是 SLO，不是 SLA。

SRE 通常不单独制定 SLA，因为 SLA 涉及产品、商务、法务、客户关系。但 SRE 会帮助：

- 定义可测量的 SLI。
- 制定内部 SLO。
- 降低触发 SLA 后果的风险。

## 为什么 SLO 不该是 100%

100% 可靠性几乎不现实，也通常不经济。

原因：

- 硬件会坏。
- 网络会抖。
- 依赖会故障。
- 软件会有 bug。
- 发布和创新需要承担一定风险。

如果目标是 100%，团队会倾向于：

- 不敢发布。
- 过度设计。
- 把大量资源花在用户不一定感知到的可靠性上。
- 把所有小毛刺都当成重大事件。

SLO 的核心是权衡：

```text
足够可靠，但不过度可靠。
```

错误预算就是这个权衡的工具。

## Good Events / Total Events

最常用的 SLI 写法是：

```text
SLI = good events / total events
```

可用性：

```text
good events = 非 5xx 请求
total events = 所有外部用户请求
```

延迟：

```text
good events = 延迟 <= 500ms 的请求
total events = 所有外部用户请求
```

任务完成：

```text
good events = 30 分钟内完成的任务
total events = 应该完成的任务
```

这样写的好处：

- 清晰。
- 可计算。
- 适合错误预算。
- 适合 Prometheus recording rules。

## 不同系统的 SLI

### 请求型服务

例如 API、Web 服务：

| SLI | 定义 |
|---|---|
| 可用性 | 成功请求数 / 总请求数 |
| 延迟 | 足够快的请求数 / 总请求数 |
| 质量 | 未降级响应数 / 总响应数 |
| 吞吐 | 能否处理目标流量 |

### 数据管道

例如 ETL、报表、流处理：

| SLI | 定义 |
|---|---|
| 新鲜度 | 足够新的数据请求数 / 总请求数 |
| 覆盖率 | 成功处理的数据量 / 应处理的数据量 |
| 正确性 | 输出正确的数据量 / 总数据量 |
| 端到端延迟 | 在目标时间内完成的数据量 / 总数据量 |

### 存储系统

例如数据库、对象存储：

| SLI | 定义 |
|---|---|
| 可用性 | 成功读写请求 / 总读写请求 |
| 延迟 | 足够快的读写请求 / 总读写请求 |
| 持久性 | 可成功读回的数据 / 已写入数据 |
| 正确性 | 读到正确数据的请求 / 总请求 |

### AIOps 服务

例如告警分析 API、RAG 助手：

| SLI | 定义 |
|---|---|
| 分析可用性 | 成功生成分析结果 / 分析请求总数 |
| 分析延迟 | 目标时间内完成分析 / 分析请求总数 |
| 检索质量 | 正确 runbook 出现在 top-k / 测试问题总数 |
| 自动化安全 | 无审批高风险动作数应为 0 |

## 延迟 SLI 不要只看平均值

平均值会隐藏长尾。

例如 100 个请求：

```text
95 个请求 50ms
5 个请求 5000ms
```

平均值可能看起来还能接受，但 5% 用户体验很差。

Google SRE 推荐关注分布和百分位，例如 p95、p99。更适合 SLO 的写法是：

```text
99% 的请求在 500ms 内完成。
```

这可以转成 good / total：

```text
good events = duration <= 500ms
total events = all requests
```

比 `histogram_quantile` 更适合算错误预算，因为它直接得到比例。

## Prometheus SLI 示例

假设指标：

```text
http_requests_total{job="order-api",code="200"}
http_request_duration_seconds_bucket{job="order-api",le="0.5"}
```

### 可用性 SLI

错误率：

```text
sum(rate(http_requests_total{job="order-api",code=~"5.."}[5m]))
/
sum(rate(http_requests_total{job="order-api"}[5m]))
```

成功率：

```text
1 -
(
  sum(rate(http_requests_total{job="order-api",code=~"5.."}[5m]))
  /
  sum(rate(http_requests_total{job="order-api"}[5m]))
)
```

### 延迟 SLI

500ms 内完成的比例：

```text
sum(rate(http_request_duration_seconds_bucket{job="order-api",le="0.5"}[5m]))
/
sum(rate(http_request_duration_seconds_count{job="order-api"}[5m]))
```

注意这和 p99 不同。这个表达式直接回答：

```text
有多少比例的请求足够快？
```

## SLO 目标怎么选

不要只根据当前系统表现拍脑袋。

Google SRE 的建议包括：

- 从用户关心什么出发。
- 保持简单。
- 避免绝对目标。
- SLO 尽量少。
- 可以先宽松，再逐步收紧。
- 不要把系统当前表现直接变成目标。

例如：

```text
当前 order-api 成功率 99.98%
```

不代表 SLO 必须设成 99.98%。你还要考虑：

- 用户是否能感知差异？
- 达成更高目标要花多少成本？
- 依赖服务能否支撑？
- 团队是否还有发布速度要求？
- SLA 是否要求更高？

## 错误预算

错误预算是 SLO 允许失败的空间。

```text
错误预算 = 1 - SLO
```

如果 SLO 是 99.9%：

```text
允许错误率 = 0.1%
```

30 天内 1,000,000 个请求：

```text
允许失败请求 = 1,000,000 * 0.001 = 1,000
```

如果已经失败了 800 个请求：

```text
预算已消耗 80%
```

错误预算的作用：

| 状态 | 决策 |
|---|---|
| 预算充足 | 正常发布、实验、迭代 |
| 预算消耗快 | 降低发布风险，关注稳定性 |
| 预算快耗尽 | 暂停高风险变更 |
| 预算耗尽 | 优先修可靠性，复盘和改进 |

错误预算把稳定性讨论从“你感觉危险不危险”变成：

```text
我们还能承受多少失败？
```

## Burn Rate

burn rate 是错误预算燃烧速度。

```text
burn rate = 当前错误率 / SLO 允许错误率
```

SLO 99.9%：

```text
允许错误率 = 0.1% = 0.001
```

如果当前错误率是 1%：

```text
burn rate = 0.01 / 0.001 = 10
```

意思是：

```text
当前错误预算消耗速度是正常允许速度的 10 倍。
```

burn rate 告警比“错误率超过 1%”更通用，因为它和 SLO 目标绑定。

## 多窗口 Burn Rate 告警

Google SRE Workbook 推荐 multiwindow, multi-burn-rate 的思路。

原因：

- 短窗口能快速发现严重故障。
- 长窗口能确认问题不是瞬时毛刺。
- 多个 burn rate 能区分页级告警和工单级告警。

99.9% SLO 的常见起点：

| 严重级别 | 长窗口 | 短窗口 | Burn rate | 预算消耗 |
|---|---|---|---:|---:|
| Page | 1h | 5m | 14.4 | 约 2% |
| Page | 6h | 30m | 6 | 约 5% |
| Ticket | 3d | 6h | 1 | 约 10% |

核心判断：

```text
长窗口超过阈值 AND 短窗口也超过阈值
```

这样可以减少“问题已经恢复但长窗口还没降下来”的持续告警。

## Prometheus 记录规则

先记录错误率，而不是每条告警里重复写复杂 PromQL。

`slo-rules.yml`：

```yaml
groups:
  - name: order-api-slo
    rules:
      - record: job:slo_errors_per_request:ratio_rate5m
        expr: |
          sum(rate(http_requests_total{job="order-api",code=~"5.."}[5m]))
          /
          sum(rate(http_requests_total{job="order-api"}[5m]))

      - record: job:slo_errors_per_request:ratio_rate30m
        expr: |
          sum(rate(http_requests_total{job="order-api",code=~"5.."}[30m]))
          /
          sum(rate(http_requests_total{job="order-api"}[30m]))

      - record: job:slo_errors_per_request:ratio_rate1h
        expr: |
          sum(rate(http_requests_total{job="order-api",code=~"5.."}[1h]))
          /
          sum(rate(http_requests_total{job="order-api"}[1h]))

      - record: job:slo_errors_per_request:ratio_rate6h
        expr: |
          sum(rate(http_requests_total{job="order-api",code=~"5.."}[6h]))
          /
          sum(rate(http_requests_total{job="order-api"}[6h]))
```

## Prometheus 告警规则

99.9% SLO 的允许错误率：

```text
0.001
```

Page 告警：

```yaml
groups:
  - name: order-api-slo-alerts
    rules:
      - alert: OrderApiFastBurn
        expr: |
          (
            job:slo_errors_per_request:ratio_rate1h{job="order-api"} > (14.4 * 0.001)
            and
            job:slo_errors_per_request:ratio_rate5m{job="order-api"} > (14.4 * 0.001)
          )
          or
          (
            job:slo_errors_per_request:ratio_rate6h{job="order-api"} > (6 * 0.001)
            and
            job:slo_errors_per_request:ratio_rate30m{job="order-api"} > (6 * 0.001)
          )
        labels:
          severity: page
          service: order-api
        annotations:
          summary: "order-api is burning error budget quickly"
          description: "The order-api availability SLO is burning too fast."
```

这比“5xx > 1% 就告警”更贴近可靠性目标。

## 低流量服务的坑

低流量服务很难用同样的 burn-rate 告警。

例如 99.9% SLO、每小时只有 10 个请求：

```text
1 个失败请求 = 10% 错误率
```

这会产生极高 burn rate，但可能只是一个偶发请求失败。

处理方向：

- 使用合成流量。
- 合并多个小服务的 SLO 观察。
- 调整产品设计，让单个失败影响变小。
- 用工单而不是 page。
- 对高价值低频请求单独设计流程。

低流量不是不用 SLO，而是 SLO 告警方式要更谨慎。

## SLO 与告警治理

不是所有指标异常都应该叫醒人。

推荐优先级：

```text
用户体验 SLO 被快速消耗
  -> page
SLO 被慢速消耗
  -> ticket
资源指标异常但无用户影响
  -> dashboard / ticket
单实例问题但服务无影响
  -> automation / repair
```

CPU 90% 不是天然 page。它需要回答：

```text
是否正在伤害 SLO？
```

如果没有伤害 SLO，可以作为容量或风险信号，但不一定叫醒人。

## SLO 与 AIOps

AIOps 不应该只追求发现“任何异常”。它应该围绕 SLO 判断“哪些异常重要”。

常见用法：

| AIOps 能力 | 如何对齐 SLO |
|---|---|
| 异常检测 | 优先检测 SLI 相关指标 |
| 告警降噪 | 低影响告警降级，SLO burn 升级 |
| 根因分析 | 以 SLO 受损时间线为中心 |
| 变更关联 | 看变更后 SLI 是否恶化 |
| Runbook 推荐 | 按 SLO 类型推荐排障步骤 |
| 事故分级 | 根据预算消耗和用户影响定级 |
| 报告生成 | 总结 SLO 影响、预算消耗、恢复时间 |

错误示例：

```text
模型发现 CPU 比昨天高 20%，立即 page。
```

更好的做法：

```text
CPU 升高 + latency SLI 恶化 + error budget 快速燃烧 -> page。
```

## 入门实验：order-api SLO

目标：

```text
order-api 在任意连续 30 天内，外部用户 HTTP 请求成功率 >= 99.9%。
```

### SLI 规格

| 项目 | 内容 |
|---|---|
| 用户旅程 | 下单 API |
| good event | 非 5xx 响应 |
| total event | 外部用户请求 |
| 排除项 | 健康检查、压测、维护窗口 |
| 数据源 | Prometheus `http_requests_total` |

### SLO

```text
30 天滚动窗口内，good events / total events >= 99.9%。
```

### 错误预算

```text
允许错误率 = 0.1%
```

如果 30 天 2,000,000 请求：

```text
允许失败请求 = 2,000,000 * 0.001 = 2,000
```

### 告警

Page：

```text
1h and 5m burn rate > 14.4
or
6h and 30m burn rate > 6
```

Ticket：

```text
3d and 6h burn rate > 1
```

### README 要写清楚

```text
本服务不对 CPU 使用率直接 page。
CPU 告警只作为容量和诊断信号。
真正叫醒人的条件是 SLO 快速燃烧。
```

## 常见错误

### 直接用 CPU 当 SLI

CPU 是资源指标，不是用户体验指标。可以辅助诊断，但通常不是 SLI。

### SLO 太多

SLO 太多会没人关注。优先挑少数能代表核心用户体验的指标。

### SLO 设成 100%

这会让错误预算为 0，团队没有发布和实验空间。

### 只看平均延迟

平均值会隐藏长尾。关注百分位或“足够快请求比例”。

### 没写排除项

健康检查、压测、维护窗口是否计入，要提前写清楚。

### 只告警当前错误率

错误率不和 SLO 目标绑定。burn rate 更能表达预算消耗速度。

### 低流量服务照搬高流量规则

一个失败请求就可能触发极高错误率。需要特殊处理。

## 常用公式字典

### 可用性 SLI

```text
availability = successful_requests / total_requests
```

### 错误率

```text
error_rate = bad_events / total_events
```

### SLO

```text
SLI >= target over window
```

### 错误预算

```text
error_budget = 1 - SLO
```

### 允许失败事件

```text
allowed_bad_events = total_events * (1 - SLO)
```

### Burn Rate

```text
burn_rate = current_error_rate / allowed_error_rate
```

### 预算消耗比例

```text
budget_consumed = bad_events / allowed_bad_events
```

## 面试怎么讲

SLI、SLO、SLA 是 SRE 用来管理可靠性的核心语言。SLI 是衡量服务水平的指标，应该从用户体验出发选择，例如请求成功率、足够快请求比例、数据新鲜度、持久性，而不是直接把 CPU、内存当成用户体验。SLO 是对 SLI 的目标，比如 30 天内 99.9% 请求成功；SLA 是对外协议，通常有明确业务或合同后果。

我会用 good events / total events 定义 SLI，再写清楚窗口、范围、排除项和数据来源。SLO 不应该追求 100%，因为错误预算让团队能在可靠性和发布速度之间做决策。告警上，我会用 burn rate，尤其是多窗口多 burn rate，快速发现严重预算燃烧，同时减少瞬时毛刺误报。AIOps 的异常检测和告警降噪也应该围绕 SLO：优先处理真正伤害用户体验、消耗错误预算的异常。

## 学习检查清单

- [ ] 我能解释 SLI、SLO、SLA 的区别。
- [ ] 我能说明为什么 SLI 要从用户体验出发。
- [ ] 我能写出 good events / total events 形式的 SLI。
- [ ] 我能为 HTTP API 设计可用性 SLI。
- [ ] 我能为 HTTP API 设计延迟 SLI。
- [ ] 我能解释为什么平均延迟不够。
- [ ] 我能写完整 SLO：范围、窗口、目标、排除项、数据源。
- [ ] 我能计算错误预算。
- [ ] 我能解释错误预算如何影响发布决策。
- [ ] 我能计算 burn rate。
- [ ] 我能说明多窗口 burn-rate 告警的价值。
- [ ] 我能说明低流量服务的 SLO 告警问题。
- [ ] 我能解释 AIOps 为什么要围绕 SLO 做异常检测。

## 面试题

1. SLI、SLO、SLA 分别是什么？
2. 如何判断一个目标是 SLO 还是 SLA？
3. 为什么不应该从 CPU、内存开始设计 SLI？
4. good events / total events 如何用于可用性 SLI？
5. 延迟 SLI 为什么不建议只看平均值？
6. 什么是错误预算？
7. 为什么 SLO 不应该设成 100%？
8. 错误预算如何影响发布策略？
9. burn rate 是什么？
10. 为什么 SLO 告警要用长短窗口？
11. 低流量服务为什么容易触发误报？
12. 如何为 order-api 写一个完整 SLO？
13. 健康检查和压测流量是否应该计入 SLO？
14. AIOps 异常检测如何对齐 SLO？
15. CPU 高但 SLO 没受损，应该 page 吗？

## 学习证据

学完后，在 GitHub 留下这些证据：

- 一份 `order-api-slo.md`。
- 至少 2 个 SLI 定义：可用性和延迟。
- 一个 30 天 99.9% SLO。
- 错误预算计算示例。
- Prometheus recording rules。
- Prometheus burn-rate alert rules。
- README 解释为什么不直接用 CPU 当 page 告警。
- 一段说明：AIOps 告警优先级如何根据 SLO 和错误预算调整。
