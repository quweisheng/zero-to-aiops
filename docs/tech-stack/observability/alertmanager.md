# Alertmanager

> 目标：能理解 Prometheus 告警从规则触发到通知送达的完整链路，能读懂 Alertmanager 的 route、receiver、grouping、deduplication、inhibition、silence、notification template 和 webhook，能写一个最小配置，能排查“没收到告警、告警太多、路由错、被静默/抑制、模板渲染失败”。

## 官方资料

- [Prometheus Alertmanager](https://prometheus.io/docs/alerting/latest/alertmanager/)
- [Alertmanager Configuration](https://prometheus.io/docs/alerting/latest/configuration/)
- [Notification template reference](https://prometheus.io/docs/alerting/latest/notifications/)
- [Notification template examples](https://prometheus.io/docs/alerting/latest/notification_examples/)
- [Prometheus alerting rules](https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/)
- [Prometheus configuration: alerting](https://prometheus.io/docs/prometheus/latest/configuration/configuration/#alerting)
- [Alertmanager API v2 OpenAPI](https://github.com/prometheus/alertmanager/blob/main/api/v2/openapi.yaml)
- [Alertmanager GitHub repository](https://github.com/prometheus/alertmanager)

说明：本文基于 Prometheus / Alertmanager 官方文档和 API 定义整理，是原创中文教程，不复制官方全文。Alertmanager 配置项会随版本演进，生产环境请用目标版本的 `alertmanager --version`、`alertmanager --help` 和官方配置文档核对。

## 场景开场

Prometheus 里有一条规则：

```yaml
- alert: InstanceDown
  expr: up == 0
  for: 2m
  labels:
    severity: critical
    team: platform
  annotations:
    summary: "Instance {{ $labels.instance }} is down"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>- alert: InstanceDown</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 2 行 | <code>  expr: up == 0</code> | `expr` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`up == 0` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 3 行 | <code>  for: 2m</code> | `for` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`2m` 表示持续分钟数，常用于表示故障已经持续多久；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>  labels:</code> | 定义 `labels` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 5 行 | <code>    severity: critical</code> | `severity` 是告警严重级别字段，`critical` 表示严重级别，通常表示需要优先处理；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 6 行 | <code>    team: platform</code> | `team` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`platform` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 7 行 | <code>  annotations:</code> | 定义 `annotations` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 8 行 | <code>    summary: "Instance {{ $labels.instance }} is down"</code> | `summary` 是摘要说明字段，`Instance {{ $labels.instance }} is down` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

某台机器真的挂了。Prometheus 页面里 alert 已经是 firing，但值班同学没收到通知。

新手容易只问：

```text
Prometheus 为什么没发告警？
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Prometheus 为什么没发告警？</code> | 这一行里的英文要这样读：`Prometheus` 是指标采集和告警规则评估系统。 |

但真正链路是：

```text
Prometheus rule evaluation
  -> alert pending
  -> alert firing
  -> Prometheus sends alert to Alertmanager
  -> Alertmanager groups and deduplicates
  -> route tree chooses receiver
  -> silence/inhibition may suppress notification
  -> receiver integration sends email/Slack/webhook/PagerDuty
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Prometheus rule evaluation</code> | 这一行里的英文要这样读：`Prometheus rule evaluation` 这个英文标识可以拆开理解为：指标采集和告警规则评估系统。 |
| 第 2 行 | <code>  -&gt; alert pending</code> | 这一行要理解这些英文词：`alert pending` 是alert=告警。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; alert firing</code> | 这一行要理解这些英文词：`alert firing` 是alert=告警。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; Prometheus sends alert to Alertmanager</code> | 这一行要理解这些英文词：`Prometheus sends alert to Alertmanager` 是alert=告警，alertmanager=Prometheus 生态里的告警管理器。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; Alertmanager groups and deduplicates</code> | 这一行要理解这些英文词：`Alertmanager groups and deduplicates` 是alertmanager=Prometheus 生态里的告警管理器。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>  -&gt; route tree chooses receiver</code> | 这一行要理解这些英文词：`route tree chooses receiver` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 7 行 | <code>  -&gt; silence/inhibition may suppress notification</code> | 这一行要理解这些英文词：`silence` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`inhibition may suppress notification` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 8 行 | <code>  -&gt; receiver integration sends email/Slack/webhook/PagerDuty</code> | 这一行要理解这些英文词：`receiver integration sends email` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`Slack` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`webhook` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`PagerDuty` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

任何一环错了，最终都可能表现为“没收到告警”。

Alertmanager 的价值不是“把告警发出去”这么简单，而是把大量原始告警变成可行动、少重复、有上下文、能按团队分发的通知。

## 一句话人话版

Alertmanager 是 Prometheus 告警通知管理器：Prometheus 负责判断“哪些 alert 正在 firing”，Alertmanager 负责把这些 alert 分组、去重、按标签路由到接收器，并支持静默、抑制和通知模板，避免值班同学被重复告警淹没。

## 学习边界

入门 Alertmanager 先抓住这条主线：

```text
Prometheus alert rule
  -> alert labels / annotations
  -> Prometheus alerting config
  -> Alertmanager /api/v2/alerts
  -> route tree
  -> group_by / group_wait / group_interval / repeat_interval
  -> silences
  -> inhibit_rules
  -> receiver
  -> notification template
  -> email / webhook / Slack / PagerDuty
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Prometheus alert rule</code> | 这一行里的英文要这样读：`Prometheus alert rule` 这个英文标识可以拆开理解为：指标采集和告警规则评估系统，告警。 |
| 第 2 行 | <code>  -&gt; alert labels / annotations</code> | 这一行要理解这些英文词：`alert labels` 是alert=告警；`annotations` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; Prometheus alerting config</code> | 这一行要理解这些英文词：`Prometheus alerting config` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; Alertmanager /api/v2/alerts</code> | 这一行要理解这些英文词：`Alertmanager` 是Prometheus 生态里的告警管理器；`api` 是应用程序接口；`v2` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`alerts` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; route tree</code> | 这一行要理解这些英文词：`route tree` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>  -&gt; group_by / group_wait / group_interval / repeat_interval</code> | 这一行要理解这些英文词：`group_by` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`group_wait` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`group_interval` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`repeat_interval` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 7 行 | <code>  -&gt; silences</code> | 这一行要理解这些英文词：`silences` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 8 行 | <code>  -&gt; inhibit_rules</code> | 这一行要理解这些英文词：`inhibit_rules` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 9 行 | <code>  -&gt; receiver</code> | 这一行要理解这些英文词：`receiver` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 10 行 | <code>  -&gt; notification template</code> | 这一行要理解这些英文词：`notification template` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 11 行 | <code>  -&gt; email / webhook / Slack / PagerDuty</code> | 这一行要理解这些英文词：`email` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`webhook` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`Slack` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`PagerDuty` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

第一阶段必须掌握：

- Alertmanager 和 Prometheus alerting rule 的分工。
- Alert labels 和 annotations 的区别。
- route tree 如何匹配。
- receiver 是什么。
- grouping、deduplication、repeat_interval。
- silence 和 inhibition 的区别。
- `group_wait`、`group_interval`、`repeat_interval`。
- `continue` 的作用。
- webhook payload 里有什么。
- notification template 的 `.Alerts`、`.CommonLabels`、`.CommonAnnotations`。
- `amtool check-config`。
- `/api/v2/status`、`/api/v2/alerts`、`/api/v2/silences`。

暂时可以先不深挖：

- Alertmanager 集群 gossip 协议实现。
- 高可用 mesh 内部细节。
- 各厂商通知渠道的全部字段。
- 复杂模板库工程化。
- Alertmanager 和 Grafana Alerting 的所有差异。
- Prometheus Operator 的 AlertmanagerConfig CRD 深水区。

## 官方知识地图

官方文档按这些模块组织：

```text
Prometheus Alerting
  -> alerting rules
  -> alert labels
  -> alert annotations
  -> for
  -> keep_firing_for
  -> Prometheus alerting config
  -> alertmanager target

Alertmanager concepts
  -> grouping
  -> inhibition
  -> silences
  -> high availability

Alertmanager configuration
  -> global
  -> templates
  -> route
  -> receivers
  -> inhibit_rules
  -> time_intervals
  -> http_config

Receiver integrations
  -> email_config
  -> webhook_config
  -> slack_config
  -> pagerduty_config
  -> opsgenie_config
  -> msteams_config
  -> pushover_config
  -> victorops_config
  -> sns_config
  -> telegram_config
  -> discord_config
  -> jira_config

Notification templates
  -> Data
  -> Alert
  -> KV methods
  -> functions
  -> examples

Alertmanager API
  -> status
  -> alerts
  -> alert groups
  -> silences
  -> receivers
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Prometheus Alerting</code> | 这一行里的英文要这样读：`Prometheus Alerting` 这个英文标识可以拆开理解为：指标采集和告警规则评估系统。 |
| 第 2 行 | <code>  -&gt; alerting rules</code> | 这一行要理解这些英文词：`alerting rules` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; alert labels</code> | 这一行要理解这些英文词：`alert labels` 是alert=告警。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; alert annotations</code> | 这一行要理解这些英文词：`alert annotations` 是alert=告警。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; for</code> | 这一行要理解这些英文词：`for` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>  -&gt; keep_firing_for</code> | 这一行要理解这些英文词：`keep_firing_for` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 7 行 | <code>  -&gt; Prometheus alerting config</code> | 这一行要理解这些英文词：`Prometheus alerting config` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 8 行 | <code>  -&gt; alertmanager target</code> | 这一行要理解这些英文词：`alertmanager target` 是alertmanager=Prometheus 生态里的告警管理器。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 10 行 | <code>Alertmanager concepts</code> | 这一行里的英文要这样读：`Alertmanager concepts` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 11 行 | <code>  -&gt; grouping</code> | 这一行要理解这些英文词：`grouping` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 12 行 | <code>  -&gt; inhibition</code> | 这一行要理解这些英文词：`inhibition` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 13 行 | <code>  -&gt; silences</code> | 这一行要理解这些英文词：`silences` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 14 行 | <code>  -&gt; high availability</code> | 这一行要理解这些英文词：`high availability` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 16 行 | <code>Alertmanager configuration</code> | 这一行里的英文要这样读：`Alertmanager configuration` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 17 行 | <code>  -&gt; global</code> | 这一行要理解这些英文词：`global` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 18 行 | <code>  -&gt; templates</code> | 这一行要理解这些英文词：`templates` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 19 行 | <code>  -&gt; route</code> | 这一行要理解这些英文词：`route` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 20 行 | <code>  -&gt; receivers</code> | 这一行要理解这些英文词：`receivers` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 21 行 | <code>  -&gt; inhibit_rules</code> | 这一行要理解这些英文词：`inhibit_rules` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 22 行 | <code>  -&gt; time_intervals</code> | 这一行要理解这些英文词：`time_intervals` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 23 行 | <code>  -&gt; http_config</code> | 这一行要理解这些英文词：`http_config` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 25 行 | <code>Receiver integrations</code> | 这一行里的英文要这样读：`Receiver integrations` 这个英文标识可以拆开理解为：告警接收人或接收渠道。 |
| 第 26 行 | <code>  -&gt; email_config</code> | 这一行要理解这些英文词：`email_config` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 27 行 | <code>  -&gt; webhook_config</code> | 这一行要理解这些英文词：`webhook_config` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 28 行 | <code>  -&gt; slack_config</code> | 这一行要理解这些英文词：`slack_config` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 29 行 | <code>  -&gt; pagerduty_config</code> | 这一行要理解这些英文词：`pagerduty_config` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 30 行 | <code>  -&gt; opsgenie_config</code> | 这一行要理解这些英文词：`opsgenie_config` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 31 行 | <code>  -&gt; msteams_config</code> | 这一行要理解这些英文词：`msteams_config` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 32 行 | <code>  -&gt; pushover_config</code> | 这一行要理解这些英文词：`pushover_config` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 33 行 | <code>  -&gt; victorops_config</code> | 这一行要理解这些英文词：`victorops_config` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 34 行 | <code>  -&gt; sns_config</code> | 这一行要理解这些英文词：`sns_config` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 35 行 | <code>  -&gt; telegram_config</code> | 这一行要理解这些英文词：`telegram_config` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 36 行 | <code>  -&gt; discord_config</code> | 这一行要理解这些英文词：`discord_config` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 37 行 | <code>  -&gt; jira_config</code> | 这一行要理解这些英文词：`jira_config` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 39 行 | <code>Notification templates</code> | 这一行里的英文要这样读：`Notification templates` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 40 行 | <code>  -&gt; Data</code> | 这一行要理解这些英文词：`Data` 是数据。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 41 行 | <code>  -&gt; Alert</code> | 这一行要理解这些英文词：`Alert` 是告警。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 42 行 | <code>  -&gt; KV methods</code> | 这一行要理解这些英文词：`KV methods` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 43 行 | <code>  -&gt; functions</code> | 这一行要理解这些英文词：`functions` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 44 行 | <code>  -&gt; examples</code> | 这一行要理解这些英文词：`examples` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 46 行 | <code>Alertmanager API</code> | 这一行里的英文要这样读：`Alertmanager API` 这个英文标识可以拆开理解为：应用程序接口。 |
| 第 47 行 | <code>  -&gt; status</code> | 这一行要理解这些英文词：`status` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 48 行 | <code>  -&gt; alerts</code> | 这一行要理解这些英文词：`alerts` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 49 行 | <code>  -&gt; alert groups</code> | 这一行要理解这些英文词：`alert groups` 是alert=告警。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 50 行 | <code>  -&gt; silences</code> | 这一行要理解这些英文词：`silences` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 51 行 | <code>  -&gt; receivers</code> | 这一行要理解这些英文词：`receivers` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

学习路径：

```text
先学 Prometheus 什么时候产生 firing alert
  -> 再学 alert labels 如何决定 route
  -> 再学 Alertmanager route tree
  -> 再学 grouping / inhibition / silence
  -> 再学 receiver 和 template
  -> 最后学 API 和自动化
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>先学 Prometheus 什么时候产生 firing alert</code> | 这一行里的英文要这样读：`Prometheus` 是指标采集和告警规则评估系统；`firing alert` 这个英文标识可以拆开理解为：告警正在触发的状态，告警。 |
| 第 2 行 | <code>  -&gt; 再学 alert labels 如何决定 route</code> | 这一行要理解这些英文词：`alert labels` 是alert=告警；`route` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; 再学 Alertmanager route tree</code> | 这一行要理解这些英文词：`Alertmanager route tree` 是alertmanager=Prometheus 生态里的告警管理器。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; 再学 grouping / inhibition / silence</code> | 这一行要理解这些英文词：`grouping` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`inhibition` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`silence` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; 再学 receiver 和 template</code> | 这一行要理解这些英文词：`receiver` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`template` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>  -&gt; 最后学 API 和自动化</code> | 这一行要理解这些英文词：`API` 是应用程序接口。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

不要一开始就背 Slack/email 配置字段。先学会“一个 alert 为什么会或不会通知到某个 receiver”。

## Alertmanager 在 AIOps 链路中的位置

Alertmanager 是告警治理的中枢。

```text
Exporter / App metrics
  -> Prometheus scrape
  -> PromQL alert rule
  -> Alert firing
  -> Alertmanager
  -> grouping / routing / silence / inhibition
  -> receiver
  -> 值班系统 / IM / Webhook / 自动化 Runbook
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Exporter / App metrics</code> | `Exporter / App metrics` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 2 行 | <code>  -&gt; Prometheus scrape</code> | 这一行要理解这些英文词：`Prometheus scrape` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; PromQL alert rule</code> | 这一行要理解这些英文词：`PromQL alert rule` 是alert=告警。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; Alert firing</code> | 这一行要理解这些英文词：`Alert firing` 是alert=告警。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; Alertmanager</code> | 这一行要理解这些英文词：`Alertmanager` 是Prometheus 生态里的告警管理器。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>  -&gt; grouping / routing / silence / inhibition</code> | 这一行要理解这些英文词：`grouping` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`routing` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`silence` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`inhibition` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 7 行 | <code>  -&gt; receiver</code> | 这一行要理解这些英文词：`receiver` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 8 行 | <code>  -&gt; 值班系统 / IM / Webhook / 自动化 Runbook</code> | 这一行要理解这些英文词：`IM` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`Webhook` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`Runbook` 是故障处理手册。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

它给 AIOps 提供：

| 能力 | 作用 |
|---|---|
| 分组 | 把同一故障引发的大量告警合成一条通知 |
| 路由 | 按 team、service、severity 发给不同团队 |
| 去重 | 相同告警不重复通知 |
| 重复提醒 | 故障持续时按 repeat_interval 再提醒 |
| 静默 | 维护窗口或已知问题临时不通知 |
| 抑制 | 高级别根因告警存在时，压制低级别噪音 |
| 模板 | 把告警内容变成人能看懂的通知 |
| Webhook | 接入工单、自动化、事件平台 |

AIOps 的自动化闭环经常从 Alertmanager webhook 开始：

```text
Alertmanager webhook
  -> 事件归一化
  -> 查询指标/日志/trace
  -> 生成诊断报告
  -> 创建工单或触发 runbook
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Alertmanager webhook</code> | 这一行里的英文要这样读：`Alertmanager webhook` 这个英文标识可以拆开理解为：通过 HTTP 回调接收通知的接口。 |
| 第 2 行 | <code>  -&gt; 事件归一化</code> | 这一行表示上一级主题下的子项“事件归一化”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |
| 第 3 行 | <code>  -&gt; 查询指标/日志/trace</code> | 这一行要理解这些英文词：`trace` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; 生成诊断报告</code> | 这一行表示上一级主题下的子项“生成诊断报告”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |
| 第 5 行 | <code>  -&gt; 创建工单或触发 runbook</code> | 这一行要理解这些英文词：`runbook` 是故障处理手册。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

## Alertmanager 是什么

Alertmanager 接收来自 Prometheus 或其他客户端的 alert，并处理：

- grouping。
- deduplication。
- routing。
- silencing。
- inhibition。
- notification sending。

Prometheus 只负责判断告警表达式是否满足。

```text
Prometheus:
  "up == 0 已经持续 2 分钟，所以 InstanceDown firing"

Alertmanager:
  "这个 firing alert 应该和哪些 alert 分到一组，发给谁，什么时候发，是否被静默，是否被抑制，通知内容长什么样"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Prometheus:</code> | `Prometheus` 是指标采集和告警规则评估系统，冒号表示后面要填写或列出这个字段的具体内容。 |
| 第 2 行 | <code>  "up == 0 已经持续 2 分钟，所以 InstanceDown firing"</code> | `up` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`=` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值。 |
| 第 4 行 | <code>Alertmanager:</code> | `Alertmanager` 是Alertmanager 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，冒号表示后面要填写或列出这个字段的具体内容。 |
| 第 5 行 | <code>  "这个 firing alert 应该和哪些 alert 分到一组，发给谁，什么时候发，是否被静默，是否被抑制，通知内容长什么样"</code> | 这一行里的英文要这样读：`firing alert` 这个英文标识可以拆开理解为：告警正在触发的状态，告警；`alert` 是告警。 |

这两个角色不要混淆。

## Alert 从哪里来

Alert 通常来自 Prometheus alerting rules。

规则示例：

```yaml
groups:
  - name: node.rules
    rules:
      - alert: InstanceDown
        expr: up == 0
        for: 2m
        labels:
          severity: critical
          team: platform
          service: node
        annotations:
          summary: "Instance {{ $labels.instance }} is down"
          description: "Prometheus cannot scrape {{ $labels.instance }} for more than 2 minutes."
          runbook_url: "https://example.com/runbooks/instance-down"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>groups:</code> | 定义 `groups` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  - name: node.rules</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 3 行 | <code>    rules:</code> | 定义 `rules` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>      - alert: InstanceDown</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 5 行 | <code>        expr: up == 0</code> | `expr` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`up == 0` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 6 行 | <code>        for: 2m</code> | `for` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`2m` 表示持续分钟数，常用于表示故障已经持续多久；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 7 行 | <code>        labels:</code> | 定义 `labels` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 8 行 | <code>          severity: critical</code> | `severity` 是告警严重级别字段，`critical` 表示严重级别，通常表示需要优先处理；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 9 行 | <code>          team: platform</code> | `team` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`platform` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 10 行 | <code>          service: node</code> | `service` 是服务名称字段，`node` 是具体服务名，表示这条记录属于这个服务；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 11 行 | <code>        annotations:</code> | 定义 `annotations` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 12 行 | <code>          summary: "Instance {{ $labels.instance }} is down"</code> | `summary` 是摘要说明字段，`Instance {{ $labels.instance }} is down` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 13 行 | <code>          description: "Prometheus cannot scrape {{ $labels.instance }} for more than 2 minutes."</code> | `description` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`Prometheus cannot scrape {{ $labels.instance }} for more than 2 minutes.` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 14 行 | <code>          runbook_url: "https://example.com/runbooks/instance-down"</code> | `runbook_url` 是故障处理手册链接字段，`https://example.com/runbooks/instance-down` 表示URL 地址，表示页面、接口或文档入口；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

字段：

| 字段 | 含义 |
|---|---|
| `alert` | alert name，会成为 `alertname` label |
| `expr` | PromQL 表达式 |
| `for` | 条件持续多久才 firing |
| `labels` | 参与路由、分组、去重的标签 |
| `annotations` | 展示给人的描述信息 |

当 alert firing 后，Prometheus 会把 alert 发送给 Alertmanager。

## labels 和 annotations

labels 是机器用来匹配和分组的字段。

```yaml
labels:
  severity: critical
  team: platform
  service: checkout
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>labels:</code> | 定义 `labels` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  severity: critical</code> | `severity` 是告警严重级别字段，`critical` 表示严重级别，通常表示需要优先处理；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 3 行 | <code>  team: platform</code> | `team` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`platform` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>  service: checkout</code> | `service` 是服务名称字段，`checkout` 是具体服务名，表示这条记录属于这个服务；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

annotations 是给人看的说明。

```yaml
annotations:
  summary: "Checkout API high error rate"
  description: "5xx rate is above 5% for 10 minutes."
  runbook_url: "https://example.com/runbooks/checkout-5xx"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>annotations:</code> | 定义 `annotations` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  summary: "Checkout API high error rate"</code> | `summary` 是摘要说明字段，`Checkout API high error rate` 是高错误率告警名，表示请求失败比例过高；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 3 行 | <code>  description: "5xx rate is above 5% for 10 minutes."</code> | `description` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`5xx rate is above 5% for 10 minutes.` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>  runbook_url: "https://example.com/runbooks/checkout-5xx"</code> | `runbook_url` 是故障处理手册链接字段，`https://example.com/runbooks/checkout-5xx` 表示URL 地址，表示页面、接口或文档入口；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

经验：

| 内容 | 放哪里 |
|---|---|
| `severity` | labels |
| `team` | labels |
| `service` | labels |
| `cluster` | labels |
| `env` | labels |
| 简短标题 | annotations |
| 详细说明 | annotations |
| runbook 链接 | annotations |
| dashboard 链接 | annotations |

不要把动态值放进会影响去重和分组的 labels，除非你真的希望它们成为不同告警。

危险示例：

```yaml
labels:
  current_value: "{{ $value }}"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>labels:</code> | 定义 `labels` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  current_value: "{{ $value }}"</code> | `current_value` 这个英文标识可以拆开理解为：数值字段，`{{ $value }}` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

这个值不断变化，会让 Alertmanager 认为是不同 alert，导致去重失效。

## Prometheus 如何连接 Alertmanager

Prometheus 配置：

```yaml
alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - alertmanager:9093
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>alerting:</code> | 定义 `alerting` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  alertmanagers:</code> | 定义 `alertmanagers` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    - static_configs:</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 4 行 | <code>        - targets:</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 5 行 | <code>            - alertmanager:9093</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |

Prometheus alert rule 触发后，会向配置的 Alertmanager 发送 alerts。

排查 Prometheus 到 Alertmanager：

```bash
curl -s http://prometheus:9090/api/v1/alertmanagers
curl -s http://prometheus:9090/api/v1/alerts
curl -s http://alertmanager:9093/api/v2/status
curl -s http://alertmanager:9093/api/v2/alerts
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -s http://prometheus:9090/api/v1/alertmanagers</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |
| 第 2 行 | <code>curl -s http://prometheus:9090/api/v1/alerts</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |
| 第 3 行 | <code>curl -s http://alertmanager:9093/api/v2/status</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |
| 第 4 行 | <code>curl -s http://alertmanager:9093/api/v2/alerts</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |

如果 Prometheus 页面有 firing alert，但 Alertmanager `/api/v2/alerts` 没有，优先查：

- Prometheus `alerting.alertmanagers` 配置。
- Prometheus 到 Alertmanager 网络。
- Alertmanager URL 是否正确。
- Prometheus 日志。

## Alertmanager 处理流程

一个 alert 进入 Alertmanager 后，大致流程：

```text
1. 接收 alert
2. 根据 labels 识别 alert fingerprint，做去重
3. 放入对应 group
4. 进入 route tree 匹配 receiver
5. 判断是否被 silence 匹配
6. 判断是否被 inhibit_rules 抑制
7. 等待 group_wait / group_interval
8. 用 notification template 渲染通知
9. 发送给 receiver
10. 故障持续时按 repeat_interval 再通知
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>1. 接收 alert</code> | `1. 接收 alert` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 2 行 | <code>2. 根据 labels 识别 alert fingerprint，做去重</code> | `2. 根据 labels 识别 alert fingerprint，做去重` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 3 行 | <code>3. 放入对应 group</code> | `3. 放入对应 group` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 4 行 | <code>4. 进入 route tree 匹配 receiver</code> | `4. 进入 route tree 匹配 receiver` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 5 行 | <code>5. 判断是否被 silence 匹配</code> | `5. 判断是否被 silence 匹配` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 6 行 | <code>6. 判断是否被 inhibit_rules 抑制</code> | `6. 判断是否被 inhibit_rules 抑制` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 7 行 | <code>7. 等待 group_wait / group_interval</code> | `7. 等待 group_wait / group_interval` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 8 行 | <code>8. 用 notification template 渲染通知</code> | `8. 用 notification template 渲染通知` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 9 行 | <code>9. 发送给 receiver</code> | `9. 发送给 receiver` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 10 行 | <code>10. 故障持续时按 repeat_interval 再通知</code> | `10. 故障持续时按 repeat_interval 再通知` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |

核心问题只有一个：

```text
这个 alert 最终为什么发给这个 receiver，或者为什么没发？
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>这个 alert 最终为什么发给这个 receiver，或者为什么没发？</code> | 这一行里的英文要这样读：`alert` 是告警；`receiver` 是告警接收人或接收渠道。 |

回答这个问题需要同时看：

- alert labels。
- route tree。
- grouping 参数。
- silences。
- inhibit_rules。
- receiver 配置。
- Alertmanager logs。
- 通知渠道返回结果。

## 配置文件整体结构

最小配置：

```yaml
global:
  resolve_timeout: 5m

route:
  receiver: default-webhook
  group_by: ["alertname", "cluster", "service"]
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h

receivers:
  - name: default-webhook
    webhook_configs:
      - url: http://webhook-receiver:8080/alertmanager
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>global:</code> | 定义 `global` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  resolve_timeout: 5m</code> | `resolve_timeout` 这个英文标识可以拆开理解为：超时时间字段，`5m` 表示持续分钟数，常用于表示故障已经持续多久；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>route:</code> | 定义 `route` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 5 行 | <code>  receiver: default-webhook</code> | `receiver` 是告警接收人或接收渠道，`default-webhook` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 6 行 | <code>  group_by: ["alertname", "cluster", "service"]</code> | `group_by` 是告警分组字段，`["alertname", "cluster", "service"]` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 7 行 | <code>  group_wait: 30s</code> | `group_wait` 这个英文标识可以拆开理解为：分组，`30s` 表示持续秒数，常用于配置采集间隔、超时时间或等待时间；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 8 行 | <code>  group_interval: 5m</code> | `group_interval` 这个英文标识可以拆开理解为：分组，`5m` 表示持续分钟数，常用于表示故障已经持续多久；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 9 行 | <code>  repeat_interval: 4h</code> | `repeat_interval` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`4h` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 11 行 | <code>receivers:</code> | 定义 `receivers` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 12 行 | <code>  - name: default-webhook</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 13 行 | <code>    webhook_configs:</code> | 定义 `webhook_configs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 14 行 | <code>      - url: http://webhook-receiver:8080/alertmanager</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |

完整配置常见顶层字段：

| 字段 | 作用 |
|---|---|
| `global` | 全局默认参数 |
| `templates` | 通知模板文件路径 |
| `route` | 路由树根节点 |
| `receivers` | 通知接收器列表 |
| `inhibit_rules` | 抑制规则 |
| `time_intervals` | 时间区间 |
| `mute_time_intervals` | 路由静默时间区间 |

检查配置：

```bash
amtool check-config alertmanager.yml
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>amtool check-config alertmanager.yml</code> | 执行 Alertmanager 工具命令，用来查看、静默或调试告警。 |

启动：

```bash
alertmanager --config.file=alertmanager.yml
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>alertmanager --config.file=alertmanager.yml</code> | 执行 `alertmanager` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

reload 配置：

```bash
curl -X POST http://alertmanager:9093/-/reload
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -X POST http://alertmanager:9093/-/reload</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |

或者向进程发送 SIGHUP，具体看部署方式。

## route 路由树

Alertmanager route 是一棵树。

根 route 必须有默认 receiver：

```yaml
route:
  receiver: default
  routes:
    - matchers:
        - team="platform"
      receiver: platform
    - matchers:
        - team="database"
      receiver: database
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>route:</code> | 定义 `route` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  receiver: default</code> | `receiver` 是告警接收人或接收渠道，`default` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 3 行 | <code>  routes:</code> | 定义 `routes` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>    - matchers:</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 5 行 | <code>        - team="platform"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 6 行 | <code>      receiver: platform</code> | `receiver` 是告警接收人或接收渠道，`platform` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 7 行 | <code>    - matchers:</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 8 行 | <code>        - team="database"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 9 行 | <code>      receiver: database</code> | `receiver` 是告警接收人或接收渠道，`database` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

匹配逻辑：

```text
alert 从根 route 进入
  -> 检查子 routes
  -> 第一个匹配的子 route 接管
  -> 如果没有子 route 匹配，使用当前 route 的 receiver
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>alert 从根 route 进入</code> | 这一行里的英文要这样读：`alert` 是告警；`route` 是路由规则。 |
| 第 2 行 | <code>  -&gt; 检查子 routes</code> | 这一行要理解这些英文词：`routes` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; 第一个匹配的子 route 接管</code> | 这一行要理解这些英文词：`route` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; 如果没有子 route 匹配，使用当前 route 的 receiver</code> | 这一行要理解这些英文词：`route` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`receiver` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

默认情况下，匹配到一个子 route 后不会继续匹配后面的 sibling route。若要继续匹配，使用：

```yaml
continue: true
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>continue: true</code> | `continue` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`true` 表示开启这个配置；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

这很重要。很多“为什么没有发到第二个 receiver”的问题，都和 `continue` 有关。

## matchers

现代 Alertmanager 配置使用 `matchers`。

示例：

```yaml
matchers:
  - team="platform"
  - severity=~"warning|critical"
  - env!="dev"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>matchers:</code> | 定义 `matchers` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  - team="platform"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 3 行 | <code>  - severity=~"warning&#124;critical"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 4 行 | <code>  - env!="dev"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |

常见匹配：

| 写法 | 含义 |
|---|---|
| `team="platform"` | 等于 |
| `team!="platform"` | 不等于 |
| `severity=~"warning|critical"` | 正则匹配 |
| `env!~"dev|test"` | 正则不匹配 |

新手常见错误：

- label 名写错。
- alert rule 没有打 `team` label。
- 正则写得过宽或过窄。
- 想让同一 alert 发多个 receiver，但忘了 `continue: true`。

## receiver

receiver 是通知目的地。

一个 receiver 可以包含多个 channel 配置。

Webhook 示例：

```yaml
receivers:
  - name: default-webhook
    webhook_configs:
      - url: http://webhook-receiver:8080/alertmanager
        send_resolved: true
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>receivers:</code> | 定义 `receivers` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  - name: default-webhook</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 3 行 | <code>    webhook_configs:</code> | 定义 `webhook_configs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>      - url: http://webhook-receiver:8080/alertmanager</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 5 行 | <code>        send_resolved: true</code> | `send_resolved` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`true` 表示开启这个配置；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

Email 示例：

```yaml
global:
  smtp_smarthost: smtp.example.com:587
  smtp_from: alertmanager@example.com
  smtp_auth_username: alertmanager@example.com
  smtp_auth_password: change-me

receivers:
  - name: email-platform
    email_configs:
      - to: platform-oncall@example.com
        send_resolved: true
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>global:</code> | 定义 `global` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  smtp_smarthost: smtp.example.com:587</code> | `smtp_smarthost` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`smtp.example.com:587` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 3 行 | <code>  smtp_from: alertmanager@example.com</code> | `smtp_from` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`alertmanager@example.com` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>  smtp_auth_username: alertmanager@example.com</code> | `smtp_auth_username` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`alertmanager@example.com` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 5 行 | <code>  smtp_auth_password: change-me</code> | `smtp_auth_password` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`change-me` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 7 行 | <code>receivers:</code> | 定义 `receivers` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 8 行 | <code>  - name: email-platform</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 9 行 | <code>    email_configs:</code> | 定义 `email_configs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 10 行 | <code>      - to: platform-oncall@example.com</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 11 行 | <code>        send_resolved: true</code> | `send_resolved` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`true` 表示开启这个配置；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

receiver 名称必须和 route 中引用的一致。

排查：

```bash
amtool check-config alertmanager.yml
curl -s http://alertmanager:9093/api/v2/receivers
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>amtool check-config alertmanager.yml</code> | 执行 Alertmanager 工具命令，用来查看、静默或调试告警。 |
| 第 2 行 | <code>curl -s http://alertmanager:9093/api/v2/receivers</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |

## grouping

Grouping 把相似 alert 合成一条通知。

配置：

```yaml
route:
  receiver: default
  group_by: ["alertname", "cluster", "service"]
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>route:</code> | 定义 `route` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  receiver: default</code> | `receiver` 是告警接收人或接收渠道，`default` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 3 行 | <code>  group_by: ["alertname", "cluster", "service"]</code> | `group_by` 是告警分组字段，`["alertname", "cluster", "service"]` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>  group_wait: 30s</code> | `group_wait` 这个英文标识可以拆开理解为：分组，`30s` 表示持续秒数，常用于配置采集间隔、超时时间或等待时间；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 5 行 | <code>  group_interval: 5m</code> | `group_interval` 这个英文标识可以拆开理解为：分组，`5m` 表示持续分钟数，常用于表示故障已经持续多久；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 6 行 | <code>  repeat_interval: 4h</code> | `repeat_interval` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`4h` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

### group_by

决定哪些 labels 相同的 alert 放进同一组。

```yaml
group_by: ["alertname", "cluster", "service"]
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>group_by: ["alertname", "cluster", "service"]</code> | `group_by` 是告警分组字段，`["alertname", "cluster", "service"]` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

例子：

```text
alertname=InstanceDown cluster=prod service=node instance=node-1
alertname=InstanceDown cluster=prod service=node instance=node-2
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>alertname=InstanceDown cluster=prod service=node instance=node-1</code> | `alertname` 是告警名称字段，`InstanceDown` 是具体告警名，表示触发的是哪一种告警规则；`cluster` 是集群名称字段，`prod` 表示生产环境；`service` 是服务名称字段，`node` 是具体服务名，表示这条记录属于这个服务；`instance` 是实例名称字段，`node-1` 是具体实例名，常用来定位哪台机器或哪个 Pod 出问题。 |
| 第 2 行 | <code>alertname=InstanceDown cluster=prod service=node instance=node-2</code> | `alertname` 是告警名称字段，`InstanceDown` 是具体告警名，表示触发的是哪一种告警规则；`cluster` 是集群名称字段，`prod` 表示生产环境；`service` 是服务名称字段，`node` 是具体服务名，表示这条记录属于这个服务；`instance` 是实例名称字段，`node-2` 是具体实例名，常用来定位哪台机器或哪个 Pod 出问题。 |

如果 group_by 不包含 `instance`，这两个 alert 会进同一组。

group_by 设计影响通知噪声。

| 设计 | 结果 |
|---|---|
| 太少 | 不相关告警被混在一起 |
| 太多 | 每个实例都单独通知，噪声大 |
| 合理 | 同一故障域聚合，通知可行动 |

### group_wait

第一次收到新 group 后，等多久再发。

```yaml
group_wait: 30s
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>group_wait: 30s</code> | `group_wait` 这个英文标识可以拆开理解为：分组，`30s` 表示持续秒数，常用于配置采集间隔、超时时间或等待时间；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

用途：给同一故障引发的其他 alert 一点时间进组，避免刚收到一条就发，几秒后又来一堆。

### group_interval

同一 group 已经发过通知后，若有新的 alert 加入组，至少等多久再发下一次。

```yaml
group_interval: 5m
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>group_interval: 5m</code> | `group_interval` 这个英文标识可以拆开理解为：分组，`5m` 表示持续分钟数，常用于表示故障已经持续多久；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

### repeat_interval

同一 group 没有变化但仍然 firing，多久重复提醒一次。

```yaml
repeat_interval: 4h
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>repeat_interval: 4h</code> | `repeat_interval` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`4h` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

不要把 repeat_interval 设太短，否则故障期间会刷屏。

## Deduplication 去重

Alertmanager 会根据 alert 的标签集合识别相同 alert，并避免重复通知。

核心理解：

```text
labels 决定 alert 身份
annotations 不决定 alert 身份
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>labels 决定 alert 身份</code> | 这一行里的英文要这样读：`labels` 是标签字段，用来标识告警或指标身份；`alert` 是告警。 |
| 第 2 行 | <code>annotations 不决定 alert 身份</code> | 这一行里的英文要这样读：`annotations` 是告警补充说明字段；`alert` 是告警。 |

如果 labels 每次都变，去重会失效。

错误：

```yaml
labels:
  value: "{{ $value }}"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>labels:</code> | 定义 `labels` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  value: "{{ $value }}"</code> | `value` 是数值字段，`{{ $value }}` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

正确：

```yaml
labels:
  severity: warning
annotations:
  current_value: "{{ $value }}"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>labels:</code> | 定义 `labels` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  severity: warning</code> | `severity` 是告警严重级别字段，`warning` 是告警级别，用来决定响应优先级；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 3 行 | <code>annotations:</code> | 定义 `annotations` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>  current_value: "{{ $value }}"</code> | `current_value` 这个英文标识可以拆开理解为：数值字段，`{{ $value }}` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

把动态值放 annotations，更适合展示，也不破坏去重。

## Silences 静默

Silence 是人工或自动创建的临时静默规则。

它按 matchers 匹配 alert。匹配到的 alert 不发送通知，但 alert 仍然存在。

典型场景：

- 计划维护。
- 已知故障正在处理。
- 压测期间。
- 某个 noisy alert 临时降噪。

重要区别：

```text
Silence 不会阻止 Prometheus 评估规则
Silence 不会让 alert 消失
Silence 只是阻止通知发送
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Silence 不会阻止 Prometheus 评估规则</code> | 这一行里的英文要这样读：`Silence` 是告警静默规则；`Prometheus` 是指标采集和告警规则评估系统。 |
| 第 2 行 | <code>Silence 不会让 alert 消失</code> | 这一行里的英文要这样读：`Silence` 是告警静默规则；`alert` 是告警。 |
| 第 3 行 | <code>Silence 只是阻止通知发送</code> | 这一行里的英文要这样读：`Silence` 是告警静默规则。 |

用 UI 创建最直观，也可以用 API 或 amtool。

amtool 示例：

```bash
amtool --alertmanager.url=http://alertmanager:9093 silence add \
  alertname=InstanceDown \
  team=platform \
  --duration=2h \
  --comment="maintenance window" \
  --author="oncall"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>amtool --alertmanager.url=http://alertmanager:9093 silence add \</code> | 执行 Alertmanager 工具命令，用来查看、静默或调试告警。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 2 行 | <code>  alertname=InstanceDown \</code> | 执行 `alertname=instancedown` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>  team=platform \</code> | 执行 `team=platform` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 4 行 | <code>  --duration=2h \</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 5 行 | <code>  --comment="maintenance window" \</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 6 行 | <code>  --author="oncall"</code> | 注释行，提前说明下面命令的目的或注意事项。 |

查看：

```bash
amtool --alertmanager.url=http://alertmanager:9093 silence query
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>amtool --alertmanager.url=http://alertmanager:9093 silence query</code> | 执行 Alertmanager 工具命令，用来查看、静默或调试告警。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

删除：

```bash
amtool --alertmanager.url=http://alertmanager:9093 silence expire <silence-id>
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>amtool --alertmanager.url=http://alertmanager:9093 silence expire &lt;silence-id&gt;</code> | 执行 Alertmanager 工具命令，用来查看、静默或调试告警。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

排查没通知时，必须看是否被 silence 命中。

## Inhibition 抑制

Inhibition 是自动抑制规则：当某类 source alert 存在时，抑制另一类 target alert。

典型例子：

```text
整个机房网络故障 firing
  -> 抑制这个机房里每台机器的 InstanceDown
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>整个机房网络故障 firing</code> | 这一行里的英文要这样读：`firing` 是告警正在触发的状态。 |
| 第 2 行 | <code>  -&gt; 抑制这个机房里每台机器的 InstanceDown</code> | 这一行要理解这些英文词：`InstanceDown` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

配置：

```yaml
inhibit_rules:
  - source_matchers:
      - alertname="ClusterDown"
      - severity="critical"
    target_matchers:
      - severity=~"warning|critical"
    equal: ["cluster"]
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>inhibit_rules:</code> | 定义 `inhibit_rules` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  - source_matchers:</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 3 行 | <code>      - alertname="ClusterDown"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 4 行 | <code>      - severity="critical"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 5 行 | <code>    target_matchers:</code> | 定义 `target_matchers` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 6 行 | <code>      - severity=~"warning&#124;critical"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 7 行 | <code>    equal: ["cluster"]</code> | `equal` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`["cluster"]` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

解释：

| 字段 | 含义 |
|---|---|
| `source_matchers` | 哪些 alert 作为“抑制源” |
| `target_matchers` | 哪些 alert 会被抑制 |
| `equal` | source 和 target 必须哪些 labels 相同 |

如果 `ClusterDown{cluster="prod"}` firing，那么同 cluster 的 warning/critical target 可能被抑制。

注意：

- 不要让 alert 自己抑制自己。
- equal labels 设计要谨慎。
- inhibition 只影响通知，不影响 alert 存在。
- 被抑制的 alert 在 Alertmanager UI/API 中仍可见。

## Silence 和 Inhibition 区别

| 维度 | Silence | Inhibition |
|---|---|---|
| 谁创建 | 人或自动化 | 配置文件 |
| 生命周期 | 有开始和结束时间 | 随配置长期存在 |
| 触发条件 | alert matchers | source alert + target alert |
| 典型用途 | 维护窗口、已知问题 | 根因告警抑制衍生告警 |
| 是否影响 alert 评估 | 不影响 | 不影响 |
| 是否影响通知 | 影响 | 影响 |

记法：

```text
Silence 是“我暂时不想被这个 alert 打扰”
Inhibition 是“有更重要根因 alert 时，别再通知这些派生 alert”
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Silence 是“我暂时不想被这个 alert 打扰”</code> | 这一行里的英文要这样读：`Silence` 是告警静默规则；`alert` 是告警。 |
| 第 2 行 | <code>Inhibition 是“有更重要根因 alert 时，别再通知这些派生 alert”</code> | 这一行里的英文要这样读：`Inhibition` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源；`alert` 是告警。 |

## 通知模板

Alertmanager 通知模板基于 Go template。

配置模板文件：

```yaml
templates:
  - /etc/alertmanager/templates/*.tmpl
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>templates:</code> | 定义 `templates` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  - /etc/alertmanager/templates/*.tmpl</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |

模板数据常用字段：

| 字段 | 含义 |
|---|---|
| `.Receiver` | 当前 receiver 名 |
| `.Status` | `firing` 或 `resolved` |
| `.Alerts` | alert 列表 |
| `.Alerts.Firing` | firing alerts |
| `.Alerts.Resolved` | resolved alerts |
| `.GroupLabels` | 分组 labels |
| `.CommonLabels` | 所有 alert 共有 labels |
| `.CommonAnnotations` | 所有 alert 共有 annotations |
| `.ExternalURL` | Alertmanager 外部 URL |

示例模板：

```text
{{ define "aiops.title" -}}
[{{ .Status | toUpper }}] {{ .CommonLabels.alertname }} {{ .CommonLabels.service }}
{{- end }}

{{ define "aiops.body" -}}
Receiver: {{ .Receiver }}
Status: {{ .Status }}
Group: {{ .GroupLabels.SortedPairs.Values | join "," }}

{{ range .Alerts }}
- Alert: {{ .Labels.alertname }}
  Instance: {{ .Labels.instance }}
  Severity: {{ .Labels.severity }}
  Summary: {{ .Annotations.summary }}
  Runbook: {{ .Annotations.runbook_url }}
{{ end }}
{{- end }}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{{ define "aiops.title" -}}</code> | `{{ define "aiops.title" -}}` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 2 行 | <code>[{{ .Status &#124; toUpper }}] {{ .CommonLabels.alertname }} {{ .CommonLabels.service }}</code> | `[{{ .Status | toUpper }}] {{ .CommonLabels.alertname }} {{ .CommonLabels.service }}` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 3 行 | <code>{{- end }}</code> | 这一行里的英文要这样读：`end` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 5 行 | <code>{{ define "aiops.body" -}}</code> | `{{ define "aiops.body" -}}` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 6 行 | <code>Receiver: {{ .Receiver }}</code> | `Receiver` 是告警接收人或接收渠道，冒号后面的 `{{ .Receiver }}` 是这个字段的示例内容或模板表达式。 |
| 第 7 行 | <code>Status: {{ .Status }}</code> | `Status` 是状态字段，冒号后面的 `{{ .Status }}` 是这个字段的示例内容或模板表达式。 |
| 第 8 行 | <code>Group: {{ .GroupLabels.SortedPairs.Values &#124; join "," }}</code> | `Group` 是分组，冒号后面的 `{{ .GroupLabels.SortedPairs.Values | join "," }}` 是这个字段的示例内容或模板表达式。 |
| 第 10 行 | <code>{{ range .Alerts }}</code> | `{{ range .Alerts }}` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 11 行 | <code>- Alert: {{ .Labels.alertname }}</code> | `- Alert: {{ .Labels.alertname }}` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 12 行 | <code>  Instance: {{ .Labels.instance }}</code> | `Instance` 是实例名称字段，冒号后面的 `{{ .Labels.instance }}` 是这个字段的示例内容或模板表达式。 |
| 第 13 行 | <code>  Severity: {{ .Labels.severity }}</code> | `Severity` 是告警严重级别字段，冒号后面的 `{{ .Labels.severity }}` 是这个字段的示例内容或模板表达式。 |
| 第 14 行 | <code>  Summary: {{ .Annotations.summary }}</code> | `Summary` 是摘要说明字段，冒号后面的 `{{ .Annotations.summary }}` 是这个字段的示例内容或模板表达式。 |
| 第 15 行 | <code>  Runbook: {{ .Annotations.runbook_url }}</code> | `Runbook` 是故障处理手册，冒号后面的 `{{ .Annotations.runbook_url }}` 是这个字段的示例内容或模板表达式。 |
| 第 16 行 | <code>{{ end }}</code> | 这一行里的英文要这样读：`end` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 17 行 | <code>{{- end }}</code> | 这一行里的英文要这样读：`end` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |

模板排障：

- 字段不存在时输出空值。
- `.CommonLabels` 只包含所有 alert 都相同的 label。
- 多条 alert grouped 后，不要只取第一条就以为代表全部。
- 模板错误会导致通知失败，查看 Alertmanager 日志。

## Webhook

Webhook 是 AIOps 自动化最常用 receiver。

配置：

```yaml
receivers:
  - name: aiops-webhook
    webhook_configs:
      - url: http://aiops-event-gateway:8080/api/alertmanager
        send_resolved: true
        max_alerts: 0
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>receivers:</code> | 定义 `receivers` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  - name: aiops-webhook</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 3 行 | <code>    webhook_configs:</code> | 定义 `webhook_configs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>      - url: http://aiops-event-gateway:8080/api/alertmanager</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 5 行 | <code>        send_resolved: true</code> | `send_resolved` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`true` 表示开启这个配置；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 6 行 | <code>        max_alerts: 0</code> | `max_alerts` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`0` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

Alertmanager 会发送 JSON payload。

典型字段：

```json
{
  "receiver": "aiops-webhook",
  "status": "firing",
  "alerts": [
    {
      "status": "firing",
      "labels": {
        "alertname": "InstanceDown",
        "severity": "critical",
        "team": "platform",
        "instance": "node-1:9100"
      },
      "annotations": {
        "summary": "Instance node-1:9100 is down"
      },
      "startsAt": "2026-07-02T10:00:00Z",
      "endsAt": "0001-01-01T00:00:00Z",
      "generatorURL": "http://prometheus/graph?g0.expr=up+%3D%3D+0"
    }
  ],
  "groupLabels": {
    "alertname": "InstanceDown",
    "service": "node"
  },
  "commonLabels": {
    "alertname": "InstanceDown",
    "severity": "critical",
    "team": "platform"
  },
  "commonAnnotations": {},
  "externalURL": "http://alertmanager:9093"
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{</code> | 对象开始，表示下面是一组键值对配置。 |
| 第 2 行 | <code>  "receiver": "aiops-webhook",</code> | `receiver` 是告警接收人或接收渠道，`aiops-webhook` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 3 行 | <code>  "status": "firing",</code> | `status` 是状态字段，`firing` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 4 行 | <code>  "alerts": [</code> | `alerts` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`[` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 5 行 | <code>    {</code> | 对象开始，表示下面是一组键值对配置。 |
| 第 6 行 | <code>      "status": "firing",</code> | `status` 是状态字段，`firing` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 7 行 | <code>      "labels": {</code> | `labels` 是标签字段，用来标识告警或指标身份，`{` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 8 行 | <code>        "alertname": "InstanceDown",</code> | `alertname` 是告警名称字段，`InstanceDown` 是具体告警名，表示触发的是哪一种告警规则；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 9 行 | <code>        "severity": "critical",</code> | `severity` 是告警严重级别字段，`critical` 表示严重级别，通常表示需要优先处理；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 10 行 | <code>        "team": "platform",</code> | `team` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`platform` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 11 行 | <code>        "instance": "node-1:9100"</code> | `instance` 是实例名称字段，`node-1:9100` 是具体实例名，常用来定位哪台机器或哪个 Pod 出问题；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 12 行 | <code>      },</code> | 当前对象或数组结束，逗号表示后面还有同级项目。 |
| 第 13 行 | <code>      "annotations": {</code> | `annotations` 是告警补充说明字段，`{` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 14 行 | <code>        "summary": "Instance node-1:9100 is down"</code> | `summary` 是摘要说明字段，`Instance node-1:9100 is down` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 15 行 | <code>      },</code> | 当前对象或数组结束，逗号表示后面还有同级项目。 |
| 第 16 行 | <code>      "startsAt": "2026-07-02T10:00:00Z",</code> | `startsAt` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`2026-07-02T10:00:00Z` 表示具体时间值，表示事件、告警或记录发生的时间点；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 17 行 | <code>      "endsAt": "0001-01-01T00:00:00Z",</code> | `endsAt` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`0001-01-01T00:00:00Z` 表示具体时间值，表示事件、告警或记录发生的时间点；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 18 行 | <code>      "generatorURL": "http://prometheus/graph?g0.expr=up+%3D%3D+0"</code> | `generatorURL` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`http://prometheus/graph?g0.expr=up+%3D%3D+0` 表示URL 地址，表示页面、接口或文档入口；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 19 行 | <code>    }</code> | 对象结束，表示这一组键值对配置到这里结束。 |
| 第 20 行 | <code>  ],</code> | 当前对象或数组结束，逗号表示后面还有同级项目。 |
| 第 21 行 | <code>  "groupLabels": {</code> | `groupLabels` 这个英文标识可以拆开理解为：分组，标签字段，用来标识告警或指标身份，`{` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 22 行 | <code>    "alertname": "InstanceDown",</code> | `alertname` 是告警名称字段，`InstanceDown` 是具体告警名，表示触发的是哪一种告警规则；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 23 行 | <code>    "service": "node"</code> | `service` 是服务名称字段，`node` 是具体服务名，表示这条记录属于这个服务；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 24 行 | <code>  },</code> | 当前对象或数组结束，逗号表示后面还有同级项目。 |
| 第 25 行 | <code>  "commonLabels": {</code> | `commonLabels` 这个英文标识可以拆开理解为：常见或通用内容，标签字段，用来标识告警或指标身份，`{` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 26 行 | <code>    "alertname": "InstanceDown",</code> | `alertname` 是告警名称字段，`InstanceDown` 是具体告警名，表示触发的是哪一种告警规则；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 27 行 | <code>    "severity": "critical",</code> | `severity` 是告警严重级别字段，`critical` 表示严重级别，通常表示需要优先处理；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 28 行 | <code>    "team": "platform"</code> | `team` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`platform` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 29 行 | <code>  },</code> | 当前对象或数组结束，逗号表示后面还有同级项目。 |
| 第 30 行 | <code>  "commonAnnotations": {},</code> | `commonAnnotations` 这个英文标识可以拆开理解为：常见或通用内容，告警补充说明字段，`{}` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 31 行 | <code>  "externalURL": "http://alertmanager:9093"</code> | `externalURL` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`http://alertmanager:9093` 表示URL 地址，表示页面、接口或文档入口；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 32 行 | <code>}</code> | 对象结束，表示这一组键值对配置到这里结束。 |

AIOps webhook 应该做：

- 校验 payload。
- 按 fingerprint 或 labels 去重。
- 保存原始事件。
- 查询 Prometheus/Grafana/Loki 补充上下文。
- 生成诊断摘要。
- 创建工单或触发 runbook。
- 处理 resolved 通知。

## 高可用

Alertmanager 支持集群高可用。Prometheus 可以把 alert 发送给多个 Alertmanager 实例。

基本思想：

```text
Prometheus -> Alertmanager A
           -> Alertmanager B
           -> Alertmanager C
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Prometheus -&gt; Alertmanager A</code> | 这一行要理解这些英文词：`Prometheus` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`Alertmanager A` 是alertmanager=Prometheus 生态里的告警管理器。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 2 行 | <code>           -&gt; Alertmanager B</code> | 这一行要理解这些英文词：`Alertmanager B` 是alertmanager=Prometheus 生态里的告警管理器。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>           -&gt; Alertmanager C</code> | 这一行要理解这些英文词：`Alertmanager C` 是alertmanager=Prometheus 生态里的告警管理器。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

Alertmanager 实例之间会协调通知去重，避免多个实例重复通知。

入门阶段知道：

- 生产不要单点 Alertmanager。
- Prometheus 应配置多个 Alertmanager target。
- Alertmanager 实例之间网络要通。
- HA 不等于配置可以不一致，配置要保持一致。

排查 HA 重复通知：

- 实例之间是否互通。
- cluster advertise/listen 地址是否正确。
- 是否所有实例配置一致。
- Prometheus 是否重复发送到多个互不成集群的 Alertmanager。

## amtool

`amtool` 是 Alertmanager 命令行工具。

检查配置：

```bash
amtool check-config alertmanager.yml
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>amtool check-config alertmanager.yml</code> | 执行 Alertmanager 工具命令，用来查看、静默或调试告警。 |

查询 alerts：

```bash
amtool --alertmanager.url=http://alertmanager:9093 alert query
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>amtool --alertmanager.url=http://alertmanager:9093 alert query</code> | 执行 Alertmanager 工具命令，用来查看、静默或调试告警。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

查询 silences：

```bash
amtool --alertmanager.url=http://alertmanager:9093 silence query
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>amtool --alertmanager.url=http://alertmanager:9093 silence query</code> | 执行 Alertmanager 工具命令，用来查看、静默或调试告警。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

创建 silence：

```bash
amtool --alertmanager.url=http://alertmanager:9093 silence add \
  alertname=InstanceDown team=platform \
  --duration=1h \
  --author=oncall \
  --comment="planned maintenance"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>amtool --alertmanager.url=http://alertmanager:9093 silence add \</code> | 执行 Alertmanager 工具命令，用来查看、静默或调试告警。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 2 行 | <code>  alertname=InstanceDown team=platform \</code> | 执行 `alertname=instancedown` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>  --duration=1h \</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 4 行 | <code>  --author=oncall \</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 5 行 | <code>  --comment="planned maintenance"</code> | 注释行，提前说明下面命令的目的或注意事项。 |

amtool 很适合写进 runbook，因为它比手工点 UI 更可复现。

## API 常用入口

状态：

```bash
curl -s http://alertmanager:9093/api/v2/status
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -s http://alertmanager:9093/api/v2/status</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |

alerts：

```bash
curl -s http://alertmanager:9093/api/v2/alerts
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -s http://alertmanager:9093/api/v2/alerts</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |

alert groups：

```bash
curl -s http://alertmanager:9093/api/v2/alerts/groups
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -s http://alertmanager:9093/api/v2/alerts/groups</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |

silences：

```bash
curl -s http://alertmanager:9093/api/v2/silences
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -s http://alertmanager:9093/api/v2/silences</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |

receivers：

```bash
curl -s http://alertmanager:9093/api/v2/receivers
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -s http://alertmanager:9093/api/v2/receivers</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |

自动化诊断时，可以把这些 API 的结果保存成证据。

## 配置字典

### global

| 字段 | 作用 |
|---|---|
| `resolve_timeout` | 没收到 resolved 时，多久后认为 alert resolved |
| `smtp_smarthost` | SMTP 地址 |
| `smtp_from` | 邮件发件人 |
| `smtp_auth_username` | SMTP 用户 |
| `smtp_auth_password` | SMTP 密码 |
| `slack_api_url` | Slack webhook URL |
| `http_config` | 全局 HTTP 客户端配置 |

### route

| 字段 | 作用 | 常见错误 |
|---|---|---|
| `receiver` | 默认 receiver | 根 route 没 receiver |
| `group_by` | 分组 labels | 太多导致刷屏，太少导致混杂 |
| `group_wait` | 首次通知等待 | 太短导致通知碎片化 |
| `group_interval` | 新 alert 加组后的通知间隔 | 太短刷屏 |
| `repeat_interval` | 持续 firing 重复提醒间隔 | 太短噪声大 |
| `matchers` | route 匹配条件 | label 名写错 |
| `continue` | 匹配后是否继续 sibling routes | 多 receiver 场景忘记设置 |
| `routes` | 子路由 | 顺序不合理导致被前面吞掉 |
| `mute_time_intervals` | 时间区间静默 | 时间区间配置错 |

### receiver

| 类型 | 用途 |
|---|---|
| `webhook_configs` | AIOps、工单、自动化 |
| `email_configs` | 邮件 |
| `slack_configs` | Slack |
| `pagerduty_configs` | PagerDuty |
| `opsgenie_configs` | Opsgenie |
| `msteams_configs` | Microsoft Teams |
| `telegram_configs` | Telegram |
| `discord_configs` | Discord |

### inhibit_rules

| 字段 | 作用 |
|---|---|
| `source_matchers` | 抑制源 alert |
| `target_matchers` | 被抑制 alert |
| `equal` | source 和 target 必须相等的 labels |

## 最小可运行配置

`alertmanager.yml`：

```yaml
global:
  resolve_timeout: 5m

route:
  receiver: default-webhook
  group_by: ["alertname", "cluster", "service"]
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  routes:
    - matchers:
        - severity="critical"
      receiver: critical-webhook
    - matchers:
        - team="database"
      receiver: database-webhook

receivers:
  - name: default-webhook
    webhook_configs:
      - url: http://webhook-receiver:8080/default
        send_resolved: true

  - name: critical-webhook
    webhook_configs:
      - url: http://webhook-receiver:8080/critical
        send_resolved: true

  - name: database-webhook
    webhook_configs:
      - url: http://webhook-receiver:8080/database
        send_resolved: true

inhibit_rules:
  - source_matchers:
      - alertname="ClusterDown"
      - severity="critical"
    target_matchers:
      - severity=~"warning|critical"
    equal: ["cluster"]
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>global:</code> | 定义 `global` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  resolve_timeout: 5m</code> | `resolve_timeout` 这个英文标识可以拆开理解为：超时时间字段，`5m` 表示持续分钟数，常用于表示故障已经持续多久；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>route:</code> | 定义 `route` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 5 行 | <code>  receiver: default-webhook</code> | `receiver` 是告警接收人或接收渠道，`default-webhook` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 6 行 | <code>  group_by: ["alertname", "cluster", "service"]</code> | `group_by` 是告警分组字段，`["alertname", "cluster", "service"]` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 7 行 | <code>  group_wait: 30s</code> | `group_wait` 这个英文标识可以拆开理解为：分组，`30s` 表示持续秒数，常用于配置采集间隔、超时时间或等待时间；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 8 行 | <code>  group_interval: 5m</code> | `group_interval` 这个英文标识可以拆开理解为：分组，`5m` 表示持续分钟数，常用于表示故障已经持续多久；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 9 行 | <code>  repeat_interval: 4h</code> | `repeat_interval` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`4h` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 10 行 | <code>  routes:</code> | 定义 `routes` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 11 行 | <code>    - matchers:</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 12 行 | <code>        - severity="critical"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 13 行 | <code>      receiver: critical-webhook</code> | `receiver` 是告警接收人或接收渠道，`critical-webhook` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 14 行 | <code>    - matchers:</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 15 行 | <code>        - team="database"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 16 行 | <code>      receiver: database-webhook</code> | `receiver` 是告警接收人或接收渠道，`database-webhook` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 18 行 | <code>receivers:</code> | 定义 `receivers` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 19 行 | <code>  - name: default-webhook</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 20 行 | <code>    webhook_configs:</code> | 定义 `webhook_configs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 21 行 | <code>      - url: http://webhook-receiver:8080/default</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 22 行 | <code>        send_resolved: true</code> | `send_resolved` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`true` 表示开启这个配置；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 24 行 | <code>  - name: critical-webhook</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 25 行 | <code>    webhook_configs:</code> | 定义 `webhook_configs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 26 行 | <code>      - url: http://webhook-receiver:8080/critical</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 27 行 | <code>        send_resolved: true</code> | `send_resolved` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`true` 表示开启这个配置；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 29 行 | <code>  - name: database-webhook</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 30 行 | <code>    webhook_configs:</code> | 定义 `webhook_configs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 31 行 | <code>      - url: http://webhook-receiver:8080/database</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 32 行 | <code>        send_resolved: true</code> | `send_resolved` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`true` 表示开启这个配置；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 34 行 | <code>inhibit_rules:</code> | 定义 `inhibit_rules` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 35 行 | <code>  - source_matchers:</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 36 行 | <code>      - alertname="ClusterDown"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 37 行 | <code>      - severity="critical"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 38 行 | <code>    target_matchers:</code> | 定义 `target_matchers` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 39 行 | <code>      - severity=~"warning&#124;critical"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 40 行 | <code>    equal: ["cluster"]</code> | `equal` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`["cluster"]` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

检查：

```bash
amtool check-config alertmanager.yml
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>amtool check-config alertmanager.yml</code> | 执行 Alertmanager 工具命令，用来查看、静默或调试告警。 |

## AIOps 入门实验

目标：本地启动 Alertmanager 和一个 webhook receiver，手工发送 alert，观察路由、分组、resolved 通知和 silence。

### 1. 启动 webhook receiver

用 Python 启动一个最小 receiver：

```python
from http.server import BaseHTTPRequestHandler, HTTPServer

class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(length)
        print("path=", self.path)
        print(body.decode("utf-8"))
        self.send_response(200)
        self.end_headers()

HTTPServer(("0.0.0.0", 8080), Handler).serve_forever()
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>from http.server import BaseHTTPRequestHandler, HTTPServer</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 3 行 | <code>class Handler(BaseHTTPRequestHandler):</code> | 定义类，用来组织一组数据和行为。 |
| 第 4 行 | <code>    def do_POST(self):</code> | 定义函数，把一段可复用逻辑命名，后续可以反复调用。 |
| 第 5 行 | <code>        length = int(self.headers.get("Content-Length", "0"))</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 6 行 | <code>        body = self.rfile.read(length)</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 7 行 | <code>        print("path=", self.path)</code> | 打印输出，用来在实验中确认变量、结果或调试信息。 |
| 第 8 行 | <code>        print(body.decode("utf-8"))</code> | 打印输出，用来在实验中确认变量、结果或调试信息。 |
| 第 9 行 | <code>        self.send_response(200)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 10 行 | <code>        self.end_headers()</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 12 行 | <code>HTTPServer(("0.0.0.0", 8080), Handler).serve_forever()</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |

运行：

```bash
python webhook_receiver.py
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>python webhook_receiver.py</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 |

### 2. 启动 Alertmanager

配置：

```yaml
route:
  receiver: default
  group_by: ["alertname", "service"]
  group_wait: 5s
  group_interval: 30s
  repeat_interval: 5m

receivers:
  - name: default
    webhook_configs:
      - url: http://127.0.0.1:8080/alertmanager
        send_resolved: true
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>route:</code> | 定义 `route` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  receiver: default</code> | `receiver` 是告警接收人或接收渠道，`default` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 3 行 | <code>  group_by: ["alertname", "service"]</code> | `group_by` 是告警分组字段，`["alertname", "service"]` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>  group_wait: 5s</code> | `group_wait` 这个英文标识可以拆开理解为：分组，`5s` 表示持续秒数，常用于配置采集间隔、超时时间或等待时间；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 5 行 | <code>  group_interval: 30s</code> | `group_interval` 这个英文标识可以拆开理解为：分组，`30s` 表示持续秒数，常用于配置采集间隔、超时时间或等待时间；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 6 行 | <code>  repeat_interval: 5m</code> | `repeat_interval` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`5m` 表示持续分钟数，常用于表示故障已经持续多久；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 8 行 | <code>receivers:</code> | 定义 `receivers` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 9 行 | <code>  - name: default</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 10 行 | <code>    webhook_configs:</code> | 定义 `webhook_configs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 11 行 | <code>      - url: http://127.0.0.1:8080/alertmanager</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 12 行 | <code>        send_resolved: true</code> | `send_resolved` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`true` 表示开启这个配置；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

启动：

```bash
alertmanager --config.file=alertmanager.yml
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>alertmanager --config.file=alertmanager.yml</code> | 执行 `alertmanager` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

### 3. 手工发送 firing alert

```bash
curl -X POST http://127.0.0.1:9093/api/v2/alerts \
  -H "Content-Type: application/json" \
  -d '[
    {
      "labels": {
        "alertname": "InstanceDown",
        "severity": "critical",
        "team": "platform",
        "service": "node",
        "instance": "node-1:9100"
      },
      "annotations": {
        "summary": "node-1 is down",
        "runbook_url": "https://example.com/runbooks/instance-down"
      },
      "startsAt": "2026-07-02T10:00:00Z"
    }
  ]'
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -X POST http://127.0.0.1:9093/api/v2/alerts \</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |
| 第 2 行 | <code>  -H "Content-Type: application/json" \</code> | `-H` 是 curl 的请求头参数，用来设置 Content-Type、鉴权信息或其他 HTTP 头。 |
| 第 3 行 | <code>  -d '[</code> | `-d` 是 curl 的请求体参数，用来把后面的文本作为 HTTP 请求正文发送给接口。 |
| 第 4 行 | <code>    {</code> | 执行 `{` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 5 行 | <code>      "labels": {</code> | 执行 `"labels":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 6 行 | <code>        "alertname": "InstanceDown",</code> | 执行 `"alertname":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 7 行 | <code>        "severity": "critical",</code> | 执行 `"severity":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 8 行 | <code>        "team": "platform",</code> | 执行 `"team":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 9 行 | <code>        "service": "node",</code> | 执行 `"service":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 10 行 | <code>        "instance": "node-1:9100"</code> | 执行 `"instance":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 11 行 | <code>      },</code> | 执行 `},` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 12 行 | <code>      "annotations": {</code> | 执行 `"annotations":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 13 行 | <code>        "summary": "node-1 is down",</code> | 执行 `"summary":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 14 行 | <code>        "runbook_url": "https://example.com/runbooks/instance-down"</code> | 执行 `"runbook_url":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 15 行 | <code>      },</code> | 执行 `},` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 16 行 | <code>      "startsAt": "2026-07-02T10:00:00Z"</code> | 执行 `"startsat":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 17 行 | <code>    }</code> | 执行 `}` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 18 行 | <code>  ]'</code> | 执行 `]'` 相关命令，后面的参数决定它具体操作什么对象。 |

观察：

```bash
curl -s http://127.0.0.1:9093/api/v2/alerts
curl -s http://127.0.0.1:9093/api/v2/alerts/groups
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -s http://127.0.0.1:9093/api/v2/alerts</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |
| 第 2 行 | <code>curl -s http://127.0.0.1:9093/api/v2/alerts/groups</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |

等待 `group_wait` 后，看 webhook receiver 是否收到 JSON。

### 4. 创建 silence

```bash
amtool --alertmanager.url=http://127.0.0.1:9093 silence add \
  alertname=InstanceDown service=node \
  --duration=30m \
  --author=lab \
  --comment="testing silence"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>amtool --alertmanager.url=http://127.0.0.1:9093 silence add \</code> | 执行 Alertmanager 工具命令，用来查看、静默或调试告警。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 2 行 | <code>  alertname=InstanceDown service=node \</code> | 执行 `alertname=instancedown` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>  --duration=30m \</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 4 行 | <code>  --author=lab \</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 5 行 | <code>  --comment="testing silence"</code> | 注释行，提前说明下面命令的目的或注意事项。 |

再次发送相同 alert，观察：

- Alertmanager UI/API 里 alert 仍存在。
- webhook 不再收到通知。

### 5. 形成学习证据

记录：

```text
alert labels:
route receiver:
group_by:
webhook payload:
silence matchers:
为什么 silence 后 alert 仍存在:
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>alert labels:</code> | `alert labels` 是alert labels 这个英文标识可以拆开理解为：告警，标签字段，用来标识告警或指标身份，冒号表示后面要填写或列出这个字段的具体内容。 |
| 第 2 行 | <code>route receiver:</code> | `route receiver` 是route receiver 这个英文标识可以拆开理解为：路由规则，告警接收人或接收渠道，冒号表示后面要填写或列出这个字段的具体内容。 |
| 第 3 行 | <code>group_by:</code> | `group_by` 是告警分组字段，冒号表示后面要填写或列出这个字段的具体内容。 |
| 第 4 行 | <code>webhook payload:</code> | `webhook payload` 是webhook payload 这个英文标识可以拆开理解为：通过 HTTP 回调接收通知的接口，请求或通知正文，冒号表示后面要填写或列出这个字段的具体内容。 |
| 第 5 行 | <code>silence matchers:</code> | `silence matchers` 是silence matchers 这个英文标识可以拆开理解为：告警静默规则，匹配条件，冒号表示后面要填写或列出这个字段的具体内容。 |
| 第 6 行 | <code>为什么 silence 后 alert 仍存在:</code> | 这一行里的英文要这样读：`silence` 是告警静默规则；`alert` 是告警。 |

## 典型故障排查表

| 现象 | 先看什么 | 常见原因 | 处理思路 |
|---|---|---|---|
| Prometheus firing 但 Alertmanager 没 alert | Prometheus alertmanagers API | Prometheus 没配置 AM、网络不通 | 查 Prometheus alerting 配置和日志 |
| Alertmanager 有 alert 但没通知 | silences、inhibition、route | 被静默/抑制、receiver 错 | 查 UI/API、route 和 logs |
| 告警发错团队 | alert labels、route tree | team/service label 错、route 顺序错 | 对照 matchers |
| 告警太多 | group_by、repeat_interval | 分组太细、重复提醒太频繁 | 调整 grouping |
| 同一故障多条通知 | 动态 label、group_by 太细 | labels 里放了当前值 | 动态信息放 annotations |
| 第二个 receiver 没收到 | route continue | 匹配后停止 | 需要时加 `continue: true` |
| 邮件/Slack 发送失败 | AM logs、receiver 配置 | token/SMTP/webhook 错 | 查渠道返回错误 |
| 模板渲染失败 | AM logs | 字段不存在、模板语法错 | 简化模板并测试 |
| resolved 没通知 | `send_resolved` | receiver 没开启 | 设置 `send_resolved: true` |
| silence 没生效 | silence matchers | label 不匹配、时间过期 | 查 silence query |

## 排障流程：没收到告警

按链路查：

### 1. Prometheus 是否 firing

```bash
curl -s http://prometheus:9090/api/v1/alerts
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -s http://prometheus:9090/api/v1/alerts</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |

看 alert 是否 `state=firing`。

### 2. Prometheus 是否知道 Alertmanager

```bash
curl -s http://prometheus:9090/api/v1/alertmanagers
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -s http://prometheus:9090/api/v1/alertmanagers</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |

看 active alertmanagers。

### 3. Alertmanager 是否收到 alert

```bash
curl -s http://alertmanager:9093/api/v2/alerts
curl -s http://alertmanager:9093/api/v2/alerts/groups
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -s http://alertmanager:9093/api/v2/alerts</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |
| 第 2 行 | <code>curl -s http://alertmanager:9093/api/v2/alerts/groups</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |

### 4. 是否被 silence 或 inhibition

```bash
amtool --alertmanager.url=http://alertmanager:9093 silence query
curl -s http://alertmanager:9093/api/v2/alerts
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>amtool --alertmanager.url=http://alertmanager:9093 silence query</code> | 执行 Alertmanager 工具命令，用来查看、静默或调试告警。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 2 行 | <code>curl -s http://alertmanager:9093/api/v2/alerts</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |

看 alert 状态里是否 muted、silenced、inhibited。

### 5. route 是否匹配预期 receiver

```bash
amtool check-config alertmanager.yml
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>amtool check-config alertmanager.yml</code> | 执行 Alertmanager 工具命令，用来查看、静默或调试告警。 |

人工对照 alert labels 和 route matchers。

### 6. receiver 是否发送失败

看 Alertmanager 日志：

```bash
journalctl -u alertmanager -n 200 --no-pager
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>journalctl -u alertmanager -n 200 --no-pager</code> | 读取 systemd journal 日志，用来排查服务启动失败和运行错误。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

Kubernetes：

```bash
kubectl logs -n monitoring deploy/alertmanager --tail=200
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>kubectl logs -n monitoring deploy/alertmanager --tail=200</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

## 排障流程：告警太多

先看是不是同一个故障域的多个 alert：

```bash
curl -s http://alertmanager:9093/api/v2/alerts/groups
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -s http://alertmanager:9093/api/v2/alerts/groups</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |

检查：

- `group_by` 是否包含了 `instance`、`pod` 这类高基数字段。
- alert labels 是否有动态值。
- `repeat_interval` 是否太短。
- 是否缺少 inhibition。
- Prometheus 规则是否过于敏感。

常见优化：

```yaml
group_by: ["alertname", "cluster", "service"]
repeat_interval: 4h
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>group_by: ["alertname", "cluster", "service"]</code> | `group_by` 是告警分组字段，`["alertname", "cluster", "service"]` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 2 行 | <code>repeat_interval: 4h</code> | `repeat_interval` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`4h` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

把当前值放到 annotations：

```yaml
annotations:
  current_value: "{{ $value }}"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>annotations:</code> | 定义 `annotations` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  current_value: "{{ $value }}"</code> | `current_value` 这个英文标识可以拆开理解为：数值字段，`{{ $value }}` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

不要放到 labels。

## 排障流程：路由错

收集 alert labels：

```bash
curl -s http://alertmanager:9093/api/v2/alerts
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -s http://alertmanager:9093/api/v2/alerts</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |

查看配置：

```bash
amtool check-config alertmanager.yml
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>amtool check-config alertmanager.yml</code> | 执行 Alertmanager 工具命令，用来查看、静默或调试告警。 |

检查：

- label 是否存在。
- matcher 是否拼错。
- route 顺序是否把 alert 提前匹配走了。
- 是否需要 `continue: true`。
- 子 route 是否继承了父 route 的 grouping 参数。
- receiver 名是否存在。

## AIOps 自动化诊断脚本

```bash
#!/usr/bin/env bash
set -euo pipefail

am="${1:-http://alertmanager:9093}"

echo "== status =="
curl -s "$am/api/v2/status" || true

echo
echo "== receivers =="
curl -s "$am/api/v2/receivers" || true

echo
echo "== alerts =="
curl -s "$am/api/v2/alerts" || true

echo
echo "== alert groups =="
curl -s "$am/api/v2/alerts/groups" || true

echo
echo "== silences =="
curl -s "$am/api/v2/silences" || true
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>#!/usr/bin/env bash</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 2 行 | <code>set -euo pipefail</code> | 设置 shell 或工具变量，具体含义取决于当前终端环境。 |
| 第 4 行 | <code>am="${1:-http://alertmanager:9093}"</code> | 执行 `am="${1:-http://alertmanager:9093}"` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 6 行 | <code>echo "== status =="</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 7 行 | <code>curl -s "$am/api/v2/status" &#124;&#124; true</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |
| 第 9 行 | <code>echo</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 10 行 | <code>echo "== receivers =="</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 11 行 | <code>curl -s "$am/api/v2/receivers" &#124;&#124; true</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |
| 第 13 行 | <code>echo</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 14 行 | <code>echo "== alerts =="</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 15 行 | <code>curl -s "$am/api/v2/alerts" &#124;&#124; true</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |
| 第 17 行 | <code>echo</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 18 行 | <code>echo "== alert groups =="</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 19 行 | <code>curl -s "$am/api/v2/alerts/groups" &#124;&#124; true</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |
| 第 21 行 | <code>echo</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 22 行 | <code>echo "== silences =="</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 23 行 | <code>curl -s "$am/api/v2/silences" &#124;&#124; true</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |

生产化前要补：

- JSON 格式化。
- 按 alertname/team/service 过滤。
- 自动判断 muted 状态。
- 输出 route 解释。
- 关联 Prometheus `/api/v1/alerts`。
- 保存 webhook 发送错误日志。

## 面试怎么讲

Prometheus 负责按 PromQL 规则判断 alert 是否 pending/firing，并把 firing alert 发送给 Alertmanager。Alertmanager 负责接收这些 alert，根据 labels 做去重、分组和路由，再根据 silence 和 inhibition 判断是否抑制通知，最后用 receiver 和 notification template 发送到 email、Slack、PagerDuty 或 webhook。排障时我会按链路看：Prometheus 是否 firing、是否配置了 Alertmanager、Alertmanager 是否收到 alert、route 是否匹配预期 receiver、是否被 silence/inhibition、receiver 是否发送失败，并特别检查 labels 是否设计合理，因为 labels 决定路由、分组和去重。

## 小白可能会问

### Prometheus 和 Alertmanager 谁负责判断告警？

Prometheus 负责判断规则表达式是否满足，Alertmanager 负责通知治理。

### silence 会让 Prometheus 里的告警消失吗？

不会。silence 只阻止通知，不阻止规则评估，也不让 alert 消失。

### inhibition 和 silence 有什么区别？

silence 是临时匹配规则，通常由人创建；inhibition 是配置里的自动规则，通常用于根因告警抑制派生告警。

### 为什么同一个故障发了很多条通知？

可能是 `group_by` 太细、labels 里有动态值、repeat_interval 太短，或者缺少 inhibition。

### 为什么 resolved 没通知？

receiver 需要支持并设置 `send_resolved: true`。

### 为什么 alert 发给了 default receiver？

通常是没有任何子 route 匹配，或者 matcher 写错。

## 学习路线

第一阶段：理解链路

- Prometheus alert rule。
- alert labels/annotations。
- Prometheus alerting config。
- Alertmanager 接收 alert。

第二阶段：理解通知治理

- route tree。
- receiver。
- grouping。
- deduplication。
- repeat_interval。

第三阶段：理解降噪

- silence。
- inhibition。
- route continue。
- label 设计。

第四阶段：理解模板和 API

- notification template。
- webhook payload。
- amtool。
- API v2。

第五阶段：接入 AIOps

- webhook 事件归一化。
- 告警关联指标/日志/trace。
- 自动创建工单。
- 自动生成诊断报告。
- silence/runbook 自动化。

## 学习检查清单

- [ ] 我能解释 Prometheus 和 Alertmanager 的分工。
- [ ] 我能解释 labels 和 annotations 的区别。
- [ ] 我能写一个最小 Alertmanager 配置。
- [ ] 我能解释 route tree 如何匹配。
- [ ] 我能解释 receiver 是什么。
- [ ] 我能解释 `group_by`、`group_wait`、`group_interval`、`repeat_interval`。
- [ ] 我能解释去重为什么依赖 labels。
- [ ] 我能解释 silence 和 inhibition 的区别。
- [ ] 我能写一个 inhibit_rules。
- [ ] 我能读懂 webhook payload。
- [ ] 我能写一个简单 notification template。
- [ ] 我能用 `amtool check-config` 检查配置。
- [ ] 我能用 API 查看 alerts、groups、silences、receivers。
- [ ] 我能排查“Prometheus firing 但没收到通知”。
- [ ] 我能排查“告警太多”和“路由错”。
- [ ] 我能把 Alertmanager 诊断写进 AIOps runbook。

## 面试题

1. Prometheus 和 Alertmanager 分别负责什么？
2. Alertmanager 的 grouping、deduplication、routing 是什么？
3. labels 和 annotations 有什么区别？
4. 为什么动态值不应该放 labels？
5. Alertmanager route tree 如何匹配？
6. `continue: true` 的作用是什么？
7. `group_wait`、`group_interval`、`repeat_interval` 有什么区别？
8. Silence 是什么？它会阻止 Prometheus 评估规则吗？
9. Inhibition 是什么？适合什么场景？
10. Silence 和 inhibition 有什么区别？
11. receiver 是什么？常见 receiver 有哪些？
12. `send_resolved` 是什么？
13. notification template 里的 `.CommonLabels` 是什么？
14. webhook payload 里通常有哪些字段？
15. Prometheus firing 但 Alertmanager 没收到 alert 怎么查？
16. Alertmanager 收到 alert 但没通知怎么查？
17. 告警太多怎么从 Alertmanager 配置层面降噪？
18. HA Alertmanager 为什么不会正常情况下重复通知？
19. `amtool check-config` 有什么用？
20. Alertmanager 在 AIOps 自动化闭环里扮演什么角色？

## 学习证据

完成本篇后，建议留下这些证据：

- 一个 `alertmanager.yml`，包含 route、receivers、inhibit_rules。
- 一份 Prometheus alert rule 示例，包含合理 labels 和 annotations。
- 一份 webhook receiver 收到的 Alertmanager JSON payload。
- 一份 silence 实验记录，说明 silence 后 alert 仍存在但不通知。
- 一份“没收到告警”的链路排查笔记。
- 一个 Alertmanager 诊断脚本，能采集 status、alerts、groups、silences、receivers。
