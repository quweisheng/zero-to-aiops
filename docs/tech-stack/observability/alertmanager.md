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
Prometheus rule evaluation（Prometheus 评估规则）
  -> alert pending（告警条件满足但仍等待持续时间）
  -> alert firing（告警进入触发状态）
  -> Prometheus sends alert to Alertmanager（Prometheus 发送告警给处理器）
  -> Alertmanager groups and deduplicates（处理器分组并去重）
  -> route tree chooses receiver（路由树选择接收器）
  -> silence/inhibition may suppress notification（静默或抑制可能暂缓通知）
  -> receiver integration sends email/Slack/webhook/PagerDuty（接收器通过邮件、协作平台或回调发送通知）
```

任何一环错了，最终都可能表现为“没收到告警”。

Alertmanager 的价值不是“把告警发出去”这么简单，而是把大量原始告警变成可行动、少重复、有上下文、能按团队分发的通知。

## 一句话人话版

Alertmanager 是 Prometheus 告警通知管理器：Prometheus 负责判断“哪些 alert 正在 firing”，Alertmanager 负责把这些 alert 分组、去重、按标签路由到接收器，并支持静默、抑制和通知模板，避免值班同学被重复告警淹没。

## 学习边界

入门 Alertmanager 先抓住这条主线：

```text
Prometheus alert rule（Prometheus 告警规则）
  -> alert labels / annotations（告警身份标签与说明注解）
  -> Prometheus alerting config（Prometheus 告警发送配置）
  -> Alertmanager /api/v2/alerts（告警处理器的第二版告警接口）
  -> route tree（路由树）
  -> group_by / group_wait / group_interval / repeat_interval（分组维度、首次等待、组内更新与重复通知间隔）
  -> silences（静默）
  -> inhibit_rules（抑制规则）
  -> receiver（接收器）
  -> notification template（通知模板）
  -> email / webhook / Slack / PagerDuty（邮件、HTTP回调与协作或值班通知渠道）
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
Prometheus Alerting（Prometheus 告警体系）
  -> alerting rules（告警规则）
  -> alert labels（告警标签）
  -> alert annotations（告警注解）
  -> for（条件需持续多久）
  -> keep_firing_for（条件恢复后继续保持触发的时间）
  -> Prometheus alerting config（Prometheus 告警发送配置）
  -> alertmanager target（告警处理器目标）

Alertmanager concepts（告警处理器核心概念）
  -> grouping（分组）
  -> inhibition（抑制）
  -> silences（静默）
  -> high availability（高可用）

Alertmanager configuration（告警处理器配置）
  -> global（全局默认配置）
  -> templates（模板文件）
  -> route（路由规则）
  -> receivers（接收器列表）
  -> inhibit_rules（抑制规则）
  -> time_intervals（时间区间）
  -> http_config（HTTP客户端设置）

Receiver integrations（接收渠道集成）
  -> email_config（邮件配置）
  -> webhook_config（HTTP回调配置）
  -> slack_config（Slack协作平台配置）
  -> pagerduty_config（PagerDuty值班平台配置）
  -> opsgenie_config（Opsgenie值班平台配置）
  -> msteams_config（Microsoft Teams通知配置）
  -> pushover_config（Pushover推送配置）
  -> victorops_config（VictorOps事件通知配置）
  -> sns_config（SNS通知服务配置）
  -> telegram_config（Telegram消息配置）
  -> discord_config（Discord消息配置）
  -> jira_config（Jira工单配置）

Notification templates（通知模板）
  -> Data（模板输入数据）
  -> Alert（单条告警）
  -> KV methods（键值集合操作方法）
  -> functions（函数）
  -> examples（示例）

Alertmanager API（告警处理器接口）
  -> status（状态）
  -> alerts（告警列表）
  -> alert groups（告警组）
  -> silences（静默）
  -> receivers（接收器列表）
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

## 老师带你追一条没有送达的告警

Prometheus 页面显示 Firing（触发中），手机却没响。你先把链路分开：规则满足条件、告警发送、Alertmanager 接收、路由命中、分组等待、静默或抑制判断、渠道接收、人员确认。每一步的成功都只证明这一段，不能跳过中间环节。

Labels（标签）决定告警身份和路由，Annotations（注解）补充解释和手册链接。把会变化的数值放进身份标签，可能让同一问题不断被当作新告警。Receiver（接收器）是渠道配置，Route（路由）决定哪些事件交给哪个接收器。匹配器的大小写和字段值必须与实际事件一致。

### 基础实验与故障实验：一个字母也会改变路由

准备 Node.js，在仓库根目录运行，不发送真实通知。

```powershell
node examples/teacher-led-reliability-lab/telemetry.mjs alertmanager
node examples/teacher-led-reliability-lab/telemetry.mjs alertmanager --fault
```

正常 `severity=critical` 命中 `on-call`（值班接收器）；故障改成 `Critical`，落入 `default-review`（默认复核接收器），输出 `issue: true`。先预测再观察 `event` 与 `receiver`。这是精确匹配的课堂模型，不模拟完整路由树，真实配置要用目标版本工具和测试接收端验证。

失败先看目录、参数和 Node。程序无外部依赖和持久资源，无须清理；保存两次输出。后文真实实验再练事件输入、路由与通知，测试消息明确标注测试用途。

### 第一课：四种时间不要混淆

规则里的 `for` 让条件持续一段时间才进入触发。`group_wait` 是新组首次通知前的等待，`group_interval` 控制组内变化再次通知的节奏，`repeat_interval` 控制持续问题重复提醒。它们不都从相同时间点开始计算，生产还需考虑规则评估周期与投递延迟。

静默是明确匹配范围和时段的暂缓通知；抑制依赖其他告警成立，例如基础设施故障时暂缓相关下游噪声。抑制匹配条件过宽会隐藏独立问题。保留负责人、到期与理由，测试正常、恢复、同名不同租户和缺失标签等样例。

### 第二课：高可用为何仍可能重复通知

多个 Alertmanager 通过 Gossip（成员间传播状态的协议）共享静默和通知记录，Prometheus 应按官方方式把告警交给集群成员。网络分区时可能出现重复通知，这是优先保持通知可用的设计取舍。不要承诺外部通知严格“恰好一次”，参见 [官方高可用说明](https://prometheus.io/docs/alerting/latest/high_availability/)。

生产关注成员连通、通知失败、队列、渠道限流、模板错误与配置一致性。Webhook（HTTP 回调接收端）应处理重试和重复，且验证来源、保护令牌。规则和模板升级先回放脱敏样例，保存旧配置并验证恢复事件；仅配置加载成功不证明消息最终送达。

### 面试课堂：30 秒与 3 分钟

30 秒：“Alertmanager 对已触发告警做路由、分组、去重、抑制和通知。我会逐段核对事件标签、规则状态、等待策略与渠道响应。”

3 分钟沿未送达案例解释状态与时间，再谈多副本重复和接收端幂等。追问：“Firing 但没短信？”查接收、路由、抑制、静默、等待与渠道。“两条相同告警为何重复？”检查身份标签、通知日志和网络分区。“静默是否修复故障？”只改变通知行为。

设计题：三团队多级告警如何安排匹配与兜底路由。事故题：模板字段为空使消息失败，保存事件和模板版本，验证最小模板后恢复。GitHub 学习证据包含测试事件、路由图、正常/故障输出和投递验证。

## 深入课堂：把“告警触发了”拆成可检查的状态

### 指标规则与通知调度是两份工作

同学，Prometheus 等规则评估器根据指标计算条件，Alertmanager 接收告警并组织通知。它不是负责抓取所有指标的数据库，也不是一般意义的业务故障根因分析引擎。两边都可能配置正确，但中间网络、标签和时间状态仍可能让你收不到期望消息。

一条排障路径应从规则表达式的当前结果开始，再看是否满足持续时间、是否实际发送、接收端是否看到对应标签、路由匹配到哪个接收者、是否被静默或抑制、通知端是否接受。每一步只解释一个状态，避免因为某张页面上出现红色就跳过中间证据。

通知端接受也不等于人已经收到并阅读。邮件服务器接收后仍可能延迟或被过滤，Webhook 下游也可能先排队。关键值班链路需要端到端测试与接收确认；原始告警、通知发送和事故认领最好分开记录。

### Labels 与 Annotations：身份和说明别混用

Labels（标签）参与告警身份、路由、分组与匹配；Annotations（注释）更适合放解释、当前值、面板链接和操作手册。把每次变化的数值塞进标签，可能让同一问题不断变成新身份，影响去重与通知连续性。

例如实例 CPU 从 91% 到 92%，若把这个值放在说明里，告警仍然围绕同一个对象；若作为身份标签的一部分，就可能形成另一个标签集合。你应根据身份稳定性选择字段位置，不要看到页面能显示就认为设计合理。

标签合同还决定责任分配。服务名、环境、团队和严重程度的大小写或取值变化，都可能让规则不再匹配原路由。变更生产者标签时，同时回归接收者和抑制规则；缺少必要标签的告警应进入可见的兜底流程，不能悄悄消失。

### 三个等待时间分别在等什么

`group_wait` 是新分组首次发送前的等待，用来给相关告警一点聚合时间；`group_interval` 控制已通知分组后续变化的检查与通知节奏；`repeat_interval` 控制没有新变化时再次提醒的间隔。三个名字都带 interval 或 wait，但不是可以任意互换的超时。

课堂举例：同一服务三条相关告警先后到达，短暂等待能合成一条通知；如果等待太久，用户影响已经扩大而值班人员仍不知道。先写业务允许的发现与通知延迟，再选择聚合等待。精确行为与约束按当前版本配置参考验证，不要只凭本段类比替换生产参数。

抖动问题也可能来自源端规则状态反复切换，而不是通知器重复发送错误。比较告警开始、结束时间和标签集合，再看通知日志。否则你可能把 repeat_interval 改得很长，却没有解决真正的状态抖动，还延迟了必要提醒。

### 抑制规则要证明它没有跨过边界

当同一个目标既有 warning 又有 critical，通常希望高级别通知覆盖较低级别噪声；但覆盖关系需要限定环境、服务、实例或其他故障域。不能让 A 租户的严重问题压住 B 租户的警告，只因为它们碰巧同名。

写规则后用三组事件验证：应该被抑制的同目标事件、不应该被抑制的跨目标事件、缺少关键标签的事件。关注 `equal` 等匹配条件的实际语义，并核对缺失标签时的行为。测试样本要包含边界情况，不能只放一个“肯定成功”的例子。

静默则适合有明确时间和范围的维护。提交前列出预计匹配的告警，核对结束时间，保留原因和负责人。故障发生后需要临时静默风暴时，也要继续通过其他途径保持用户影响可见；静默通知不等于解决事故。

### 高可用要接受重复的可能性，并保护下游

多实例部署涉及告警接收、集群通信和通知状态协调。网络分区或节点失败时，系统更倾向保障通知可达，不能把分布式去重理解成所有故障下绝对只发一次。官方建议规则评估器向所有相关 Alertmanager 实例发送告警，设计时应理解这种链路而不是把通知入口简单当成任意负载均衡目标。见 [官方高可用说明](https://prometheus.io/docs/alerting/latest/high_availability/)。

如果 Webhook 接入自动工单或自动化，接收方必须考虑重复消息、乱序和超时重试。创建工单可用稳定关联标识防重，执行修复还要另行验证权限、目标、版本与动作前置条件。收到 critical 告警不等于获准重启所有服务。

备份关注配置、模板和需要持久保存的运行状态；恢复后验证不仅是进程启动，还包括正确路由、有效静默状态、通知链路和权限。集群副本能覆盖部分节点故障，不会替代错误配置回退和历史恢复策略。

### 面试推演：一条告警为什么没人接到

场景一，规则显示满足条件但尚未到持续时间，属于源端状态；场景二，告警已到 Alertmanager 却路由到旧团队，属于标签与路由合同；场景三，发送成功但下游排队失败，属于通知链路。相同用户现象有不同原因，扩容不能同时解释或解决它们。

请按时间线记录每段证据，选择最小修复，并用带唯一标识的合成告警验证完整链路。实验不要向真实值班人员制造未经约定的紧急消息，使用专用测试接收者。学习证据保存脱敏标签、匹配推导、测试结果和回滚记录，面试时说明未覆盖的网络分区与真实通道边界。

## Alertmanager 在 AIOps 链路中的位置

Alertmanager 是告警治理的中枢。

```text
Exporter / App metrics（指标导出器或应用指标）
  -> Prometheus scrape（Prometheus周期抓取）
  -> PromQL alert rule（指标查询告警规则）
  -> Alert firing（告警进入触发状态）
  -> Alertmanager（告警处理器）
  -> grouping / routing / silence / inhibition（分组、路由、静默与抑制）
  -> receiver（接收器）
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
Alertmanager webhook（告警处理器的HTTP回调）
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
Prometheus -> Alertmanager A（Prometheus向告警处理器A发送）
           -> Alertmanager B（告警处理器B）
           -> Alertmanager C（告警处理器C）
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
