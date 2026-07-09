# 告警治理

> 目标：不是把 Prometheus 规则写得越多越好，而是能判断哪些告警值得叫醒人，哪些应该降级、合并、抑制、删除或自动化；能设计告警分级、标签、路由、分组、抑制、静默、runbook、质量指标和持续治理流程。

## 官方资料

优先读这些官方资料：

- [Google SRE Book - Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/)
- [Google SRE Book - Practical Alerting](https://sre.google/sre-book/practical-alerting/)
- [Google SRE Workbook - Alerting on SLOs](https://sre.google/workbook/alerting-on-slos/)
- [Google SRE Book - Being On-Call](https://sre.google/sre-book/being-on-call/)
- [Prometheus Alerting rules](https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/)
- [Prometheus Alertmanager configuration](https://prometheus.io/docs/alerting/latest/configuration/)
- [Prometheus Alerting best practices](https://prometheus.io/docs/practices/alerting/)

说明：本文基于 Google SRE 的监控和告警原则，结合 Prometheus / Alertmanager 官方能力，整理成可执行的告警治理教程。

## 场景开场

凌晨 3 点，手机响了：

```text
DiskUsageHigh on node-17
```

你打开告警，发现：

- 昨天已经响过。
- 磁盘还有 18%。
- 服务没有用户影响。
- 没有 runbook。
- 告警发给了错误团队。
- 过 10 分钟又响一次。

这不是“监控很完善”，这是告警债务。

告警太多不会让系统更安全，只会让人更麻木。真正好的告警应该少、准、可行动，并且在该叫醒人的时候才叫醒人。

## 一句话人话版

告警治理是把“会响的规则”治理成“值得人处理的信号”：每条告警都要有用户影响、紧急性、行动路径、负责人、来源证据和持续改进机制。

## 小白可能会问

- 为什么告警不是越多越好？
- page、ticket、info 有什么区别？
- 症状告警和原因告警怎么取舍？
- CPU 高到底要不要叫醒人？
- 什么叫可行动告警？
- Alertmanager 的 grouping、routing、inhibition、silence 分别干什么？
- 告警标签应该怎么设计？
- runbook_url 为什么是必填项？
- 告警风暴怎么治理？
- AIOps 告警降噪应该从哪里开始？

## 官方知识地图

告警治理可以按这张地图理解：

```text
Monitoring
  -> metrics / logs / traces / black-box checks
  -> alerting rules
     -> symptoms
     -> causes
     -> SLO burn rate
     -> for / keep_firing_for
  -> alert labels
     -> service
     -> severity
     -> owner
     -> slo
     -> runbook_url
  -> Alertmanager
     -> grouping
     -> routing
     -> inhibition
     -> silence
     -> receivers
  -> response
     -> page
     -> ticket
     -> info
     -> automation
  -> review
     -> noise
     -> duplicates
     -> flapping
     -> missing runbooks
     -> bad ownership
  -> AIOps
     -> clustering
     -> dedup
     -> enrichment
     -> runbook recommendation
```

初学路线：

```text
inventory alerts
  -> classify page/ticket/info
  -> require owner and runbook
  -> prefer SLO/symptom pages
  -> move cause alerts to ticket/dashboard
  -> configure Alertmanager grouping/routing/inhibition
  -> track alert quality metrics
  -> review weekly
```

## 告警不是监控

监控系统有很多用途：

- 趋势分析。
- 容量规划。
- dashboard。
- 事故排查。
- 业务分析。
- 告警。

告警只是其中一部分。

Google SRE 对 page 的要求很强：告警不应该因为“有点奇怪”就打扰人。page 应该代表一个紧急、可行动、正在或即将用户可见的问题。

所以：

```text
所有 page 都应该来自监控。
但不是所有监控都应该 page。
```

## 好告警的四个条件

每条 page 级告警都要过四个问题：

| 问题 | 解释 |
|---|---|
| 是否用户可见？ | 正在影响或即将影响用户体验 |
| 是否紧急？ | 不能等到工作时间 |
| 是否可行动？ | 值班人员知道下一步做什么 |
| 是否需要人的判断？ | 如果只是固定动作，应该自动化或降级 |

如果一条告警可以被长期忽略，它就不该是 page。

如果一条告警每次都是执行同一个机械动作，它应该进入自动化。

如果一条告警没有明确处理人、runbook 和下一步，它应该先治理再升级。

## Page / Ticket / Info

推荐先用三类，不要一开始搞十几个等级。

| 等级 | 含义 | 通知方式 | 示例 |
|---|---|---|---|
| page | 需要立即人工介入 | 电话、短信、强提醒 | SLO 快速燃烧、核心链路不可用 |
| ticket | 需要处理但可排队 | 工单、Issue | 磁盘 7 天后可能满、错误预算慢速消耗 |
| info | 记录事实或给上下文 | 日报、日志、dashboard | 发布完成、自动扩容成功 |

不要把所有 `warning` 都发给值班人。

判断口诀：

```text
现在不处理，用户会明显受影响吗？
会 -> page
不会但应该处理 -> ticket
只是信息 -> info
```

## 症状 vs 原因

Google SRE 强调区分 what 和 why：

- 症状：用户看到什么坏了。
- 原因：系统内部为什么坏。

示例：

| 症状 | 可能原因 |
|---|---|
| HTTP 5xx 上升 | 数据库连接失败、发布 bug、下游超时 |
| 响应变慢 | CPU 饱和、锁竞争、数据库慢查询 |
| 数据延迟 | 消费者积压、Kafka broker 异常、批任务失败 |

告警策略：

```text
page 优先症状告警。
ticket 可以关注确定的原因告警。
dashboard 保存更多原因指标。
```

为什么？

因为一个原因可能不影响用户，一个症状才说明服务真的在坏。

CPU 95% 可能只是批任务高峰；但 5xx、SLO burn、用户请求超时更接近用户体验。

## 四个黄金信号

Google SRE 推荐用户侧服务优先关注四个黄金信号：

| 信号 | 含义 | 常见指标 |
|---|---|---|
| Latency | 请求耗时 | p95、p99、足够快请求比例 |
| Traffic | 流量 | RPS、QPS、消息吞吐 |
| Errors | 错误 | 5xx、失败率、错误预算燃烧 |
| Saturation | 饱和度 | CPU、内存、队列、连接池、磁盘 |

告警优先级：

```text
Errors / Latency 伤害 SLO -> page
Traffic 异常影响业务 -> page or ticket
Saturation 接近用户影响 -> ticket or page
纯资源异常但无影响 -> ticket / dashboard
```

## Alert Rule 设计

Prometheus alerting rule 的核心字段：

| 字段 | 作用 |
|---|---|
| `alert` | 告警名 |
| `expr` | PromQL 条件 |
| `for` | 持续多久才 firing |
| `keep_firing_for` | 条件恢复后继续保持 firing 多久 |
| `labels` | 路由和分组用标签 |
| `annotations` | 人看的描述、runbook、dashboard |

示例：

```yaml
groups:
  - name: order-api-alerts
    rules:
      - alert: OrderApiHighErrorRate
        expr: |
          sum(rate(http_requests_total{job="order-api",code=~"5.."}[5m]))
          /
          sum(rate(http_requests_total{job="order-api"}[5m]))
          > 0.05
        for: 5m
        keep_firing_for: 5m
        labels:
          severity: page
          service: order-api
          owner: team-order
        annotations:
          summary: "order-api 5xx error rate is above 5%"
          description: "More than 5% of order-api requests are returning 5xx for 5 minutes."
          dashboard_url: "https://grafana.example.com/d/order-api"
          runbook_url: "https://github.com/quweisheng/zero-to-aiops/tree/main/runbooks/order-api-high-error-rate.md"
```

注意：

- `labels` 用于机器路由和分组。
- `annotations` 用于人理解和处理。
- `for` 可以减少瞬时毛刺。
- `keep_firing_for` 可以减少抖动恢复。

## SLO 告警优先

如果已经有 SLO，page 应优先围绕错误预算燃烧。

```text
SLO burn-rate page
  -> 用户影响更明确
  -> 跨服务口径统一
  -> 可和发布决策关联
```

普通阈值告警：

```text
5xx > 5%
```

SLO 告警：

```text
error_rate > burn_rate * allowed_error_rate
```

两者差别：

| 方式 | 问题 |
|---|---|
| 固定阈值 | 不同 SLO 的服务难统一 |
| SLO burn rate | 直接表达预算消耗速度 |

page 规则建议：

- SLO 快速燃烧。
- 核心用户路径不可用。
- 数据丢失或强一致性破坏。
- 自动化无法恢复且影响扩大。

ticket 规则建议：

- SLO 慢速燃烧。
- 容量将在未来几天耗尽。
- 单点风险。
- runbook 缺失。
- 告警质量问题。

## Alertmanager 核心能力

Prometheus 负责判断条件是否满足。Alertmanager 负责通知治理。

Prometheus 官方文档也强调，Prometheus alerting rules 不是完整通知系统；Alertmanager 负责分组、限流、静默、抑制和通知路由。

### Grouping

把同类告警合并，避免告警风暴。

```yaml
route:
  group_by: ["alertname", "service"]
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  receiver: default
```

字段含义：

| 字段 | 作用 |
|---|---|
| `group_by` | 哪些标签相同就合成一组 |
| `group_wait` | 第一条告警到来后等多久再发 |
| `group_interval` | 同组新增告警多久后再发 |
| `repeat_interval` | 同一组持续 firing 多久重复通知 |

经验：

- `group_by` 太细，会通知过多。
- `group_by` 太粗，会丢上下文。
- `repeat_interval` 太短，会制造疲劳。

### Routing

按标签把告警发给正确团队。

```yaml
route:
  receiver: default
  routes:
    - matchers:
        - severity="page"
      receiver: oncall
    - matchers:
        - severity="ticket"
      receiver: ticket-system
    - matchers:
        - service="payment-api"
      receiver: payment-team
```

路由依赖标签质量。没有 `service`、`owner`、`severity`，路由只能靠猜。

### Inhibition

当一个更高层告警已经 firing 时，抑制低层衍生告警。

```yaml
inhibit_rules:
  - source_matchers:
      - alertname="OrderApiDown"
    target_matchers:
      - severity="ticket"
    equal: ["service"]
```

含义：

```text
如果 order-api 已经 Down，
同 service 的 ticket 级告警先别再打扰。
```

注意：抑制不是隐藏问题，而是减少重复通知。排障时 dashboard 里仍然应该能看到底层指标。

### Silence

Silence 是临时静默。

适合：

- 计划维护。
- 已知故障处理中。
- 测试告警规则。

不适合：

- 永久掩盖坏规则。
- 代替修复。
- 没有 owner 的长期静默。

每个 silence 应该有：

- 原因。
- 创建人。
- 过期时间。
- 关联工单或变更。

## 标签规范

每条告警至少应该有：

| 标签 | 示例 | 用途 |
|---|---|---|
| `alertname` | `OrderApiHighErrorRate` | 告警名 |
| `severity` | `page` / `ticket` / `info` | 分级 |
| `service` | `order-api` | 服务路由 |
| `owner` | `team-order` | 责任团队 |
| `env` | `prod` | 环境 |
| `slo` | `order-api-availability` | 关联 SLO |

annotations 至少应该有：

| annotation | 示例 | 用途 |
|---|---|---|
| `summary` | 简短标题 | 通知标题 |
| `description` | 具体说明 | 人读 |
| `runbook_url` | runbook 链接 | 下一步 |
| `dashboard_url` | Grafana 链接 | 证据 |
| `query` | PromQL 或查询说明 | 复查 |

没有 owner 和 runbook 的 page，是债务。

## 告警命名规范

推荐：

```text
Service + Symptom
```

例如：

```text
OrderApiHighErrorRate
OrderApiLatencySLOBurn
PaymentApiDependencyFailures
KafkaConsumerLagGrowing
```

不推荐：

```text
High
Error
CPUWarning
SomethingWrong
```

告警名应该让人在通知列表中一眼知道：

- 哪个服务。
- 什么症状。
- 大概严重性。

## 告警体检表

治理告警时，对每条 page 填这张表：

| 问题 | 答案 |
|---|---|
| 过去 30 天触发几次？ | |
| 有几次是真事故？ | |
| 是否用户可见？ | |
| 是否紧急？ | |
| 是否可行动？ | |
| 是否有 owner？ | |
| 是否有 runbook？ | |
| 是否能自动化？ | |
| 是否和其他告警重复？ | |
| 是否应该降级为 ticket？ | |
| 是否应该删除？ | |

处理决策：

| 情况 | 动作 |
|---|---|
| 频繁误报 | 改规则或删除 |
| 重复告警 | grouping / inhibition |
| 不紧急 | 降级 ticket |
| 不可行动 | 补 runbook 或删除 |
| 固定机械处理 | 自动化 |
| 用户影响明确 | 保留 page，补上下文 |

## 告警质量指标

告警治理要有指标，不然会变成口号。

| 指标 | 含义 |
|---|---|
| pages per on-call shift | 每班 page 数 |
| alerts per incident | 每次事故多少告警 |
| actionable alert ratio | 可行动告警比例 |
| false positive ratio | 误报比例 |
| duplicate alert ratio | 重复告警比例 |
| flapping alert count | 抖动告警数 |
| alerts without owner | 无 owner 告警数 |
| alerts without runbook | 无 runbook 告警数 |
| MTTA | 平均确认时间 |
| MTTR | 平均恢复时间 |
| alert review backlog | 待治理告警数量 |

最小目标：

```text
所有 page 必须有 owner 和 runbook。
每周复盘 top noisy alerts。
```

## 告警风暴治理

告警风暴常见原因：

- 一个故障触发很多症状和原因告警。
- 每个实例都发一条。
- grouping 太细。
- repeat_interval 太短。
- 没有 inhibition。
- 下游故障导致上游全部报警。

处理顺序：

1. 先确认有没有用户影响。
2. 找到最高层症状告警。
3. 对实例级告警做聚合。
4. 用 inhibition 抑制衍生告警。
5. 调整 group_by。
6. 调整 repeat_interval。
7. 在复盘中删除或降级噪声规则。

不要在事故中临时乱删规则。先 silence，事后治理。

## AIOps 如何参与告警治理

AIOps 不是一上来就“自动根因分析”。更现实的切入点：

| 能力 | 输入 | 输出 |
|---|---|---|
| 告警去重 | alert labels、fingerprint、时间窗口 | 合并重复告警 |
| 告警聚类 | 服务、拓扑、时间、文本 | 事故候选组 |
| 上下文补全 | 指标、日志、变更、runbook | enrich alert |
| 相似事故检索 | 告警摘要、embedding | 历史案例 |
| 告警摘要 | 一组告警 | 人话摘要 |
| 噪声评分 | 历史触发、确认、关闭 | 治理优先级 |
| runbook 推荐 | alertname、service、symptom | runbook 链接 |

AIOps 需要干净的输入。没有标签规范、owner、runbook、SLO 的告警，很难做出可靠的降噪和自动化。

## 入门实验：告警体检表

准备一个 CSV：

```csv
alertname,service,severity,count_30d,true_incidents,has_owner,has_runbook,action
HighCPU,order-api,page,42,0,true,false,
OrderApiHighErrorRate,order-api,page,3,3,true,true,
DiskWillFill,node,ticket,12,2,true,true,
PaymentApiLatencyHigh,payment-api,page,8,4,true,false,
```

目标：

1. 找出没有 runbook 的 page。
2. 找出 30 天触发很多但真事故很少的 page。
3. 找出应该降级为 ticket 的告警。
4. 为每条 page 补 owner 和 runbook。
5. 写一份治理建议。

示例判断：

| 告警 | 判断 |
|---|---|
| `HighCPU` | 42 次触发、0 次事故，降级 ticket 或改成 SLO 相关告警 |
| `OrderApiHighErrorRate` | 保留 page，确认 runbook 完整 |
| `DiskWillFill` | 保留 ticket，不 page |
| `PaymentApiLatencyHigh` | 保留或改 SLO burn-rate，并补 runbook |

## 常见错误

### 所有告警都是 page

这会快速制造疲劳。page 只给紧急且可行动的问题。

### 只写原因告警

CPU、磁盘、连接池都是原因或风险信号。page 应优先症状和 SLO。

### 没有 runbook

没有 runbook 的告警会让新人值班时无从下手。

### 标签随意写

`team`、`owner`、`service` 混用会让路由和聚类失效。

### repeat_interval 太短

重复通知会制造疲劳。持续故障应该在事故流程里跟踪，不靠不停响铃。

### 永久 silence

长期 silence 只是把债务藏起来。应该修规则或修系统。

### AIOps 直接自动处理所有告警

先治理标签、分级、runbook 和 SLO，再谈自动化。

## 常用配置字典

### `for`

```yaml
for: 5m
```

条件持续满足 5 分钟才触发 firing，减少瞬时毛刺。

### `keep_firing_for`

```yaml
keep_firing_for: 5m
```

条件恢复后继续保持 firing 一段时间，减少抖动。

### `labels`

```yaml
labels:
  severity: page
  service: order-api
```

机器处理字段，用于路由、分组、抑制。

### `annotations`

```yaml
annotations:
  summary: "order-api 5xx is high"
  runbook_url: "https://example.com/runbooks/order-api"
```

人读字段，用于说明和处理。

### `group_by`

```yaml
group_by: ["alertname", "service"]
```

按哪些标签合并告警。

### `repeat_interval`

```yaml
repeat_interval: 4h
```

同一组持续 firing 多久重复通知。

### `inhibit_rules`

```yaml
inhibit_rules:
  - source_matchers:
      - alertname="OrderApiDown"
    target_matchers:
      - severity="ticket"
    equal: ["service"]
```

高层告警出现时抑制低层衍生告警。

## 面试怎么讲

告警治理的核心是把噪声变成信号。好的 page 必须紧急、可行动、用户可见，并且需要人的判断。Google SRE 强调 page 很昂贵，如果告警可以被忽略、不能行动、只是有点异常，或者只是机械处理，就不应该叫醒人。

我会优先围绕 SLO 和用户症状做 page，把原因类告警放到 ticket 或 dashboard。落地上，Prometheus 负责规则判断，Alertmanager 负责 grouping、routing、inhibition、silence 和通知。每条告警都要有规范标签，比如 severity、service、owner、slo，以及 annotations 里的 runbook_url 和 dashboard_url。治理时要追踪 pages per shift、误报率、重复率、flapping、无 owner、无 runbook 等指标，并在事故复盘后持续删除、降级、合并或自动化坏告警。AIOps 的告警聚类、降噪和摘要，应该建立在这些规范化告警数据上。

## 学习检查清单

- [ ] 我能解释监控和告警的区别。
- [ ] 我能判断 page、ticket、info 的区别。
- [ ] 我能用四个问题评估一条 page 是否合理。
- [ ] 我能区分症状告警和原因告警。
- [ ] 我能解释四个黄金信号。
- [ ] 我能写一条 Prometheus alerting rule。
- [ ] 我能说明 `for` 和 `keep_firing_for` 的作用。
- [ ] 我能设计告警 labels 和 annotations。
- [ ] 我能解释 Alertmanager grouping、routing、inhibition、silence。
- [ ] 我能设计一张告警体检表。
- [ ] 我能列出告警质量指标。
- [ ] 我能说明 AIOps 告警降噪需要哪些输入。

## 面试题

1. 为什么告警不是越多越好？
2. 什么样的告警才应该 page？
3. page、ticket、info 有什么区别？
4. 症状告警和原因告警有什么区别？
5. 为什么 page 优先选择症状或 SLO 告警？
6. Google SRE 的四个黄金信号是什么？
7. Prometheus alerting rule 的 `for` 有什么作用？
8. `labels` 和 `annotations` 有什么区别？
9. Alertmanager 的 grouping 解决什么问题？
10. routing 依赖哪些标签？
11. inhibition 和 silence 有什么区别？
12. repeat_interval 太短会导致什么问题？
13. 为什么每条 page 都需要 runbook？
14. 如何治理一个 30 天触发 100 次但没有事故的告警？
15. AIOps 如何做告警降噪？
16. 没有标签规范时，AIOps 告警聚类会遇到什么问题？

## 学习证据

学完后，在 GitHub 留下这些证据：

- 一份告警体检表 CSV。
- 至少 5 条告警治理结论：保留、降级、删除、合并、自动化。
- 一份 Prometheus alerting rule 示例。
- 一份 Alertmanager grouping/routing/inhibition 示例。
- 一份告警标签规范。
- 一份 runbook_url 必填规则。
- README 说明 page、ticket、info 的使用标准。
- README 说明 AIOps 降噪依赖哪些告警字段。
