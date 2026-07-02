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

某台机器真的挂了。Prometheus 页面里 alert 已经是 firing，但值班同学没收到通知。

新手容易只问：

```text
Prometheus 为什么没发告警？
```

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

学习路径：

```text
先学 Prometheus 什么时候产生 firing alert
  -> 再学 alert labels 如何决定 route
  -> 再学 Alertmanager route tree
  -> 再学 grouping / inhibition / silence
  -> 再学 receiver 和 template
  -> 最后学 API 和自动化
```

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

annotations 是给人看的说明。

```yaml
annotations:
  summary: "Checkout API high error rate"
  description: "5xx rate is above 5% for 10 minutes."
  runbook_url: "https://example.com/runbooks/checkout-5xx"
```

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

Prometheus alert rule 触发后，会向配置的 Alertmanager 发送 alerts。

排查 Prometheus 到 Alertmanager：

```bash
curl -s http://prometheus:9090/api/v1/alertmanagers
curl -s http://prometheus:9090/api/v1/alerts
curl -s http://alertmanager:9093/api/v2/status
curl -s http://alertmanager:9093/api/v2/alerts
```

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

核心问题只有一个：

```text
这个 alert 最终为什么发给这个 receiver，或者为什么没发？
```

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

启动：

```bash
alertmanager --config.file=alertmanager.yml
```

reload 配置：

```bash
curl -X POST http://alertmanager:9093/-/reload
```

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

匹配逻辑：

```text
alert 从根 route 进入
  -> 检查子 routes
  -> 第一个匹配的子 route 接管
  -> 如果没有子 route 匹配，使用当前 route 的 receiver
```

默认情况下，匹配到一个子 route 后不会继续匹配后面的 sibling route。若要继续匹配，使用：

```yaml
continue: true
```

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

receiver 名称必须和 route 中引用的一致。

排查：

```bash
amtool check-config alertmanager.yml
curl -s http://alertmanager:9093/api/v2/receivers
```

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

### group_by

决定哪些 labels 相同的 alert 放进同一组。

```yaml
group_by: ["alertname", "cluster", "service"]
```

例子：

```text
alertname=InstanceDown cluster=prod service=node instance=node-1
alertname=InstanceDown cluster=prod service=node instance=node-2
```

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

用途：给同一故障引发的其他 alert 一点时间进组，避免刚收到一条就发，几秒后又来一堆。

### group_interval

同一 group 已经发过通知后，若有新的 alert 加入组，至少等多久再发下一次。

```yaml
group_interval: 5m
```

### repeat_interval

同一 group 没有变化但仍然 firing，多久重复提醒一次。

```yaml
repeat_interval: 4h
```

不要把 repeat_interval 设太短，否则故障期间会刷屏。

## Deduplication 去重

Alertmanager 会根据 alert 的标签集合识别相同 alert，并避免重复通知。

核心理解：

```text
labels 决定 alert 身份
annotations 不决定 alert 身份
```

如果 labels 每次都变，去重会失效。

错误：

```yaml
labels:
  value: "{{ $value }}"
```

正确：

```yaml
labels:
  severity: warning
annotations:
  current_value: "{{ $value }}"
```

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

查看：

```bash
amtool --alertmanager.url=http://alertmanager:9093 silence query
```

删除：

```bash
amtool --alertmanager.url=http://alertmanager:9093 silence expire <silence-id>
```

排查没通知时，必须看是否被 silence 命中。

## Inhibition 抑制

Inhibition 是自动抑制规则：当某类 source alert 存在时，抑制另一类 target alert。

典型例子：

```text
整个机房网络故障 firing
  -> 抑制这个机房里每台机器的 InstanceDown
```

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

## 通知模板

Alertmanager 通知模板基于 Go template。

配置模板文件：

```yaml
templates:
  - /etc/alertmanager/templates/*.tmpl
```

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

查询 alerts：

```bash
amtool --alertmanager.url=http://alertmanager:9093 alert query
```

查询 silences：

```bash
amtool --alertmanager.url=http://alertmanager:9093 silence query
```

创建 silence：

```bash
amtool --alertmanager.url=http://alertmanager:9093 silence add \
  alertname=InstanceDown team=platform \
  --duration=1h \
  --author=oncall \
  --comment="planned maintenance"
```

amtool 很适合写进 runbook，因为它比手工点 UI 更可复现。

## API 常用入口

状态：

```bash
curl -s http://alertmanager:9093/api/v2/status
```

alerts：

```bash
curl -s http://alertmanager:9093/api/v2/alerts
```

alert groups：

```bash
curl -s http://alertmanager:9093/api/v2/alerts/groups
```

silences：

```bash
curl -s http://alertmanager:9093/api/v2/silences
```

receivers：

```bash
curl -s http://alertmanager:9093/api/v2/receivers
```

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

检查：

```bash
amtool check-config alertmanager.yml
```

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

运行：

```bash
python webhook_receiver.py
```

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

启动：

```bash
alertmanager --config.file=alertmanager.yml
```

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

观察：

```bash
curl -s http://127.0.0.1:9093/api/v2/alerts
curl -s http://127.0.0.1:9093/api/v2/alerts/groups
```

等待 `group_wait` 后，看 webhook receiver 是否收到 JSON。

### 4. 创建 silence

```bash
amtool --alertmanager.url=http://127.0.0.1:9093 silence add \
  alertname=InstanceDown service=node \
  --duration=30m \
  --author=lab \
  --comment="testing silence"
```

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

看 alert 是否 `state=firing`。

### 2. Prometheus 是否知道 Alertmanager

```bash
curl -s http://prometheus:9090/api/v1/alertmanagers
```

看 active alertmanagers。

### 3. Alertmanager 是否收到 alert

```bash
curl -s http://alertmanager:9093/api/v2/alerts
curl -s http://alertmanager:9093/api/v2/alerts/groups
```

### 4. 是否被 silence 或 inhibition

```bash
amtool --alertmanager.url=http://alertmanager:9093 silence query
curl -s http://alertmanager:9093/api/v2/alerts
```

看 alert 状态里是否 muted、silenced、inhibited。

### 5. route 是否匹配预期 receiver

```bash
amtool check-config alertmanager.yml
```

人工对照 alert labels 和 route matchers。

### 6. receiver 是否发送失败

看 Alertmanager 日志：

```bash
journalctl -u alertmanager -n 200 --no-pager
```

Kubernetes：

```bash
kubectl logs -n monitoring deploy/alertmanager --tail=200
```

## 排障流程：告警太多

先看是不是同一个故障域的多个 alert：

```bash
curl -s http://alertmanager:9093/api/v2/alerts/groups
```

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

把当前值放到 annotations：

```yaml
annotations:
  current_value: "{{ $value }}"
```

不要放到 labels。

## 排障流程：路由错

收集 alert labels：

```bash
curl -s http://alertmanager:9093/api/v2/alerts
```

查看配置：

```bash
amtool check-config alertmanager.yml
```

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
