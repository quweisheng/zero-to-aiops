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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>DiskUsageHigh on node-17</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Monitoring</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; metrics / logs / traces / black-box checks</code> | 这一行要理解这些英文词：`metrics` 是指标；`logs` 是日志；`traces` 是链路追踪；`black-box checks` 是黑盒检查，从用户视角探测接口、页面或端口是否可用。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; alerting rules</code> | 这一行要理解这些英文词：`alerting rules` 是告警规则，定义什么条件会触发告警。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>     -&gt; symptoms</code> | 这一行要理解这些英文词：`symptoms` 是现象。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>     -&gt; causes</code> | 这一行要理解这些英文词：`causes` 是原因。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>     -&gt; SLO burn rate</code> | 这一行要理解这些英文词：`SLO burn rate` 是SLO 消耗率，衡量错误预算被消耗得有多快。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 7 行 | <code>     -&gt; for / keep_firing_for</code> | 这一行要理解这些英文词：`for` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`keep_firing_for` 是Prometheus 告警参数，表示条件消失后告警继续保持触发多久。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 8 行 | <code>  -&gt; alert labels</code> | 这一行要理解这些英文词：`alert labels` 是告警标签，用键值对描述服务、级别、负责人等信息。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 9 行 | <code>     -&gt; service</code> | 这一行要理解这些英文词：`service` 是服务。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 10 行 | <code>     -&gt; severity</code> | 这一行要理解这些英文词：`severity` 是严重级别。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 11 行 | <code>     -&gt; owner</code> | 这一行要理解这些英文词：`owner` 是负责人。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 12 行 | <code>     -&gt; slo</code> | 这一行要理解这些英文词：`slo` 是服务等级目标。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 13 行 | <code>     -&gt; runbook_url</code> | 这一行要理解这些英文词：`runbook_url` 是runbook=故障处理手册，url=网页或接口地址。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 14 行 | <code>  -&gt; Alertmanager</code> | 这一行要理解这些英文词：`Alertmanager` 是Prometheus 生态里的告警管理器。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 15 行 | <code>     -&gt; grouping</code> | 这一行要理解这些英文词：`grouping` 是分组。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 16 行 | <code>     -&gt; routing</code> | 这一行要理解这些英文词：`routing` 是路由。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 17 行 | <code>     -&gt; inhibition</code> | 这一行要理解这些英文词：`inhibition` 是抑制规则。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 18 行 | <code>     -&gt; silence</code> | 这一行要理解这些英文词：`silence` 是静默。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 19 行 | <code>     -&gt; receivers</code> | 这一行要理解这些英文词：`receivers` 是接收器。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 20 行 | <code>  -&gt; response</code> | 这一行要理解这些英文词：`response` 是响应处理。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 21 行 | <code>     -&gt; page</code> | 这一行要理解这些英文词：`page` 是立即通知值班人员。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 22 行 | <code>     -&gt; ticket</code> | 这一行要理解这些英文词：`ticket` 是工单。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 23 行 | <code>     -&gt; info</code> | 这一行要理解这些英文词：`info` 是信息类通知。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 24 行 | <code>     -&gt; automation</code> | 这一行要理解这些英文词：`automation` 是自动化。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 25 行 | <code>  -&gt; review</code> | 这一行要理解这些英文词：`review` 是复盘或评审。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 26 行 | <code>     -&gt; noise</code> | 这一行要理解这些英文词：`noise` 是告警噪音。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 27 行 | <code>     -&gt; duplicates</code> | 这一行要理解这些英文词：`duplicates` 是重复项。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 28 行 | <code>     -&gt; flapping</code> | 这一行要理解这些英文词：`flapping` 是反复恢复又触发。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 29 行 | <code>     -&gt; missing runbooks</code> | 这一行要理解这些英文词：`missing runbooks` 是缺少处理手册，告警来了但没有明确操作步骤。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 30 行 | <code>     -&gt; bad ownership</code> | 这一行要理解这些英文词：`bad ownership` 是ownership=负责人归属。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 31 行 | <code>  -&gt; AIOps</code> | 这一行要理解这些英文词：`AIOps` 是智能运维。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 32 行 | <code>     -&gt; clustering</code> | 这一行要理解这些英文词：`clustering` 是聚类。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 33 行 | <code>     -&gt; dedup</code> | 这一行要理解这些英文词：`dedup` 是去重。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 34 行 | <code>     -&gt; enrichment</code> | 这一行要理解这些英文词：`enrichment` 是增强上下文。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 35 行 | <code>     -&gt; runbook recommendation</code> | 这一行要理解这些英文词：`runbook recommendation` 是runbook 推荐，根据告警上下文推荐处理手册。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>inventory alerts</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; classify page/ticket/info</code> | 这一行要理解这些英文词：`classify page` 是classify=分类，page=立即通知值班人员；`ticket` 是工单；`info` 是信息类通知。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; require owner and runbook</code> | 这一行要理解这些英文词：`require owner and runbook` 是要求负责人和处理手册，保证告警有人接、有步骤可查。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; prefer SLO/symptom pages</code> | 这一行要理解这些英文词：`prefer SLO` 是prefer=优先选择，slo=服务等级目标；`symptom pages` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; move cause alerts to ticket/dashboard</code> | 这一行要理解这些英文词：`move cause alerts to ticket` 是alerts=告警，ticket=工单；`dashboard` 是仪表盘，用图表集中展示指标、状态和趋势。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>  -&gt; configure Alertmanager grouping/routing/inhibition</code> | 这一行要理解这些英文词：`configure Alertmanager grouping` 是alertmanager=Prometheus 生态里的告警管理器，grouping=分组；`routing` 是路由；`inhibition` 是抑制规则。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 7 行 | <code>  -&gt; track alert quality metrics</code> | 这一行要理解这些英文词：`track alert quality metrics` 是跟踪告警质量指标，例如噪音率、重复率、误报率和响应时间。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 8 行 | <code>  -&gt; review weekly</code> | 这一行要理解这些英文词：`review weekly` 是review=复盘或评审。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>所有 page 都应该来自监控。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>但不是所有监控都应该 page。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>现在不处理，用户会明显受影响吗？</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>会 -&gt; page</code> | 这一行要理解这些英文词：`page` 是立即通知值班人员。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>不会但应该处理 -&gt; ticket</code> | 这一行要理解这些英文词：`ticket` 是工单。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>只是信息 -&gt; info</code> | 这一行要理解这些英文词：`info` 是信息类通知。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>page 优先症状告警。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>ticket 可以关注确定的原因告警。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>dashboard 保存更多原因指标。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Errors / Latency 伤害 SLO -&gt; page</code> | 这一行要理解这些英文词：`Errors` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`Latency` 是延迟；`SLO` 是服务等级目标；`page` 是立即通知值班人员。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 2 行 | <code>Traffic 异常影响业务 -&gt; page or ticket</code> | 这一行要理解这些英文词：`Traffic` 是流量；`page or ticket` 是page=立即通知值班人员，ticket=工单。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>Saturation 接近用户影响 -&gt; ticket or page</code> | 这一行要理解这些英文词：`Saturation` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`ticket or page` 是ticket=工单，page=立即通知值班人员。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>纯资源异常但无影响 -&gt; ticket / dashboard</code> | 这一行要理解这些英文词：`ticket` 是工单；`dashboard` 是仪表盘，用图表集中展示指标、状态和趋势。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>groups:</code> | 定义 `groups` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  - name: order-api-alerts</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 3 行 | <code>    rules:</code> | 定义 `rules` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>      - alert: OrderApiHighErrorRate</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 5 行 | <code>        expr: &#124;</code> | 设置 `expr` 字段的值为 `|`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 6 行 | <code>          sum(rate(http_requests_total{job="order-api",code=~"5.."}[5m]))</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 7 行 | <code>          /</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 8 行 | <code>          sum(rate(http_requests_total{job="order-api"}[5m]))</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 9 行 | <code>          &gt; 0.05</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 10 行 | <code>        for: 5m</code> | 设置 `for` 字段的值为 `5m`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 11 行 | <code>        keep_firing_for: 5m</code> | 设置 `keep_firing_for` 字段的值为 `5m`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 12 行 | <code>        labels:</code> | 定义 `labels` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 13 行 | <code>          severity: page</code> | 设置 `severity` 字段的值为 `page`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 14 行 | <code>          service: order-api</code> | 设置 `service` 字段的值为 `order-api`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 15 行 | <code>          owner: team-order</code> | 设置 `owner` 字段的值为 `team-order`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 16 行 | <code>        annotations:</code> | 定义 `annotations` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 17 行 | <code>          summary: "order-api 5xx error rate is above 5%"</code> | 设置 `summary` 字段的值为 `"order-api 5xx error rate is above 5%"`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 18 行 | <code>          description: "More than 5% of order-api requests are returning 5xx for 5 minutes."</code> | 设置 `description` 字段的值为 `"More than 5% of order-api requests are returning 5xx for 5 minutes."`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 19 行 | <code>          dashboard_url: "https://grafana.example.com/d/order-api"</code> | 设置 `dashboard_url` 字段的值为 `"https://grafana.example.com/d/order-api"`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 20 行 | <code>          runbook_url: "https://github.com/quweisheng/zero-to-aiops/tree/main/runbooks/order-api-high-error-rate.md"</code> | 设置 `runbook_url` 字段的值为 `"https://github.com/quweisheng/zero-to-aiops/tree/main/runbooks/order-api-high-error-rate.md"`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>SLO burn-rate page</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; 用户影响更明确</code> | 这一行表示上一级主题下的子项“用户影响更明确”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |
| 第 3 行 | <code>  -&gt; 跨服务口径统一</code> | 这一行表示上一级主题下的子项“跨服务口径统一”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |
| 第 4 行 | <code>  -&gt; 可和发布决策关联</code> | 这一行表示上一级主题下的子项“可和发布决策关联”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |


普通阈值告警：

```text
5xx > 5%
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>5xx &gt; 5%</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


SLO 告警：

```text
error_rate > burn_rate * allowed_error_rate
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>error_rate &gt; burn_rate * allowed_error_rate</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>route:</code> | 定义 `route` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  group_by: ["alertname", "service"]</code> | 设置 `group_by` 字段的值为 `["alertname", "service"]`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 3 行 | <code>  group_wait: 30s</code> | 设置 `group_wait` 字段的值为 `30s`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>  group_interval: 5m</code> | 设置 `group_interval` 字段的值为 `5m`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 5 行 | <code>  repeat_interval: 4h</code> | 设置 `repeat_interval` 字段的值为 `4h`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 6 行 | <code>  receiver: default</code> | 设置 `receiver` 字段的值为 `default`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>route:</code> | 定义 `route` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  receiver: default</code> | 设置 `receiver` 字段的值为 `default`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 3 行 | <code>  routes:</code> | 定义 `routes` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>    - matchers:</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 5 行 | <code>        - severity="page"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 6 行 | <code>      receiver: oncall</code> | 设置 `receiver` 字段的值为 `oncall`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 7 行 | <code>    - matchers:</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 8 行 | <code>        - severity="ticket"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 9 行 | <code>      receiver: ticket-system</code> | 设置 `receiver` 字段的值为 `ticket-system`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 10 行 | <code>    - matchers:</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 11 行 | <code>        - service="payment-api"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 12 行 | <code>      receiver: payment-team</code> | 设置 `receiver` 字段的值为 `payment-team`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>inhibit_rules:</code> | 定义 `inhibit_rules` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  - source_matchers:</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 3 行 | <code>      - alertname="OrderApiDown"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 4 行 | <code>    target_matchers:</code> | 定义 `target_matchers` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 5 行 | <code>      - severity="ticket"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 6 行 | <code>    equal: ["service"]</code> | 设置 `equal` 字段的值为 `["service"]`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


含义：

```text
如果 order-api 已经 Down，
同 service 的 ticket 级告警先别再打扰。
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>如果 order-api 已经 Down，</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>同 service 的 ticket 级告警先别再打扰。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Service + Symptom</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


例如：

```text
OrderApiHighErrorRate
OrderApiLatencySLOBurn
PaymentApiDependencyFailures
KafkaConsumerLagGrowing
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>OrderApiHighErrorRate</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>OrderApiLatencySLOBurn</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>PaymentApiDependencyFailures</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>KafkaConsumerLagGrowing</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


不推荐：

```text
High
Error
CPUWarning
SomethingWrong
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>High</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>Error</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>CPUWarning</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>SomethingWrong</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>所有 page 必须有 owner 和 runbook。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>每周复盘 top noisy alerts。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>alertname,service,severity,count_30d,true_incidents,has_owner,has_runbook,action</code> | CSV 数据行，逗号分隔的每一列代表一个字段。 |
| 第 2 行 | <code>HighCPU,order-api,page,42,0,true,false,</code> | CSV 数据行，逗号分隔的每一列代表一个字段。 |
| 第 3 行 | <code>OrderApiHighErrorRate,order-api,page,3,3,true,true,</code> | CSV 数据行，逗号分隔的每一列代表一个字段。 |
| 第 4 行 | <code>DiskWillFill,node,ticket,12,2,true,true,</code> | CSV 数据行，逗号分隔的每一列代表一个字段。 |
| 第 5 行 | <code>PaymentApiLatencyHigh,payment-api,page,8,4,true,false,</code> | CSV 数据行，逗号分隔的每一列代表一个字段。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>for: 5m</code> | 设置 `for` 字段的值为 `5m`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


条件持续满足 5 分钟才触发 firing，减少瞬时毛刺。

### `keep_firing_for`

```yaml
keep_firing_for: 5m
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>keep_firing_for: 5m</code> | 设置 `keep_firing_for` 字段的值为 `5m`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


条件恢复后继续保持 firing 一段时间，减少抖动。

### `labels`

```yaml
labels:
  severity: page
  service: order-api
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>labels:</code> | 定义 `labels` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  severity: page</code> | 设置 `severity` 字段的值为 `page`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 3 行 | <code>  service: order-api</code> | 设置 `service` 字段的值为 `order-api`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


机器处理字段，用于路由、分组、抑制。

### `annotations`

```yaml
annotations:
  summary: "order-api 5xx is high"
  runbook_url: "https://example.com/runbooks/order-api"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>annotations:</code> | 定义 `annotations` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  summary: "order-api 5xx is high"</code> | 设置 `summary` 字段的值为 `"order-api 5xx is high"`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 3 行 | <code>  runbook_url: "https://example.com/runbooks/order-api"</code> | 设置 `runbook_url` 字段的值为 `"https://example.com/runbooks/order-api"`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


人读字段，用于说明和处理。

### `group_by`

```yaml
group_by: ["alertname", "service"]
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>group_by: ["alertname", "service"]</code> | 设置 `group_by` 字段的值为 `["alertname", "service"]`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


按哪些标签合并告警。

### `repeat_interval`

```yaml
repeat_interval: 4h
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>repeat_interval: 4h</code> | 设置 `repeat_interval` 字段的值为 `4h`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>inhibit_rules:</code> | 定义 `inhibit_rules` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  - source_matchers:</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 3 行 | <code>      - alertname="OrderApiDown"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 4 行 | <code>    target_matchers:</code> | 定义 `target_matchers` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 5 行 | <code>      - severity="ticket"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 6 行 | <code>    equal: ["service"]</code> | 设置 `equal` 字段的值为 `["service"]`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


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
