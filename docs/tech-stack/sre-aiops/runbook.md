# Runbook

> 目标：不是写一篇“故障处理说明”，而是能把告警、检查、判断、动作、风险、审批、验证、升级、记录和自动化边界写成故障现场可执行的流程，并能逐步把低风险步骤变成脚本或自动化 runbook。

## 官方资料

优先读这些官方资料：

- [AWS Systems Manager - Creating your own runbooks](https://docs.aws.amazon.com/systems-manager/latest/userguide/automation-documents.html)
- [AWS Systems Manager - Authoring Automation runbooks](https://docs.aws.amazon.com/systems-manager/latest/userguide/automation-authoring-runbooks.html)
- [AWS Systems Manager Automation actions reference](https://docs.aws.amazon.com/systems-manager/latest/userguide/automation-actions.html)
- [Google SRE Book - The Evolution of Automation at Google](https://sre.google/sre-book/automation-at-google/)
- [Google SRE Book - Emergency Response](https://sre.google/sre-book/emergency-response/)
- [Google SRE Workbook - Incident Response](https://sre.google/workbook/incident-response/)

说明：本文把 runbook 当成“可执行的运维知识单元”来学。先写人工 Markdown runbook，再逐步把安全、重复、低风险的步骤自动化。

## 场景开场

同一条告警来了：

```text
OrderApiHighErrorRate
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>OrderApiHighErrorRate</code> | 这一行里的英文要这样读：`OrderApiHighErrorRate` 是高错误率告警名，通常表示某个服务的请求失败比例超过阈值。 |

老同事会这样处理：

```text
先看 Grafana 的错误率和 p95。
再看 30 分钟内有没有发布。
如果发布后开始升高，先评估回滚。
如果日志是 database timeout，看连接池和慢查询。
如果下游 payment-api 也在 5xx，拉 payment team。
回滚后观察 15 分钟。
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>先看 Grafana 的错误率和 p95。</code> | 这一行里的英文要这样读：`Grafana` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源；`p95` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 4 行 | <code>如果日志是 database timeout，看连接池和慢查询。</code> | 这一行里的英文要这样读：`database timeout` 这个英文标识可以拆开理解为：数据库名称字段，超时时间字段。 |
| 第 5 行 | <code>如果下游 payment-api 也在 5xx，拉 payment team。</code> | 这一行里的英文要这样读：`payment-api` 这个英文标识可以拆开理解为：应用程序接口；`5xx` 是HTTP 5xx 服务端错误，表示请求到达服务端但服务端处理失败；`payment team` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |

新人只看到一行红字：

```text
order-api 5xx is above 5%
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>order-api 5xx is above 5%</code> | 这一行里的英文要这样读：`order-api 5xx is above` 里的 order 表示订单业务，api 表示接口服务，合起来通常指订单接口服务。 |

Runbook 的价值，就是把老同事脑子里的处理路径写成别人也能执行、能验证、能升级、能自动化的步骤。

## 一句话人话版

Runbook 是故障处理说明书：把触发条件、影响、检查步骤、判断逻辑、安全动作、风险、审批、验证恢复和升级条件写清楚，让处理过程可重复。

## 小白可能会问

- Runbook 和普通技术文档有什么区别？
- Runbook 和 incident 文档有什么关系？
- 为什么每一步都要写验证方式？
- 为什么动作要分低风险和高风险？
- 什么样的步骤适合自动化？
- runbook_url 为什么应该放进告警？
- Runbook 怎么和 RAG、LLM、AIOps 结合？
- Runbook 长期不维护怎么办？

## 官方知识地图

Runbook 可以按这张地图理解：

```text
Runbook
  -> Metadata
     -> service
     -> owner
     -> alertname
     -> severity
     -> last_updated
  -> Trigger
     -> alert rule
     -> user report
     -> maintenance task
  -> Context
     -> user impact
     -> dashboards
     -> logs
     -> dependencies
  -> Preconditions
     -> permissions
     -> environment
     -> approvals
     -> tools
  -> Diagnosis
     -> checks
     -> commands
     -> expected output
     -> decision tree
  -> Actions
     -> safe actions
     -> risky actions
     -> approval
     -> rollback
  -> Verification
     -> SLI back to normal
     -> alerts stop
     -> user reports stop
  -> Escalation
     -> owner
     -> SME
     -> SEV upgrade
  -> Automation
     -> inputs
     -> steps
     -> actions
     -> outputs
     -> audit
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Runbook</code> | 这一行里的英文要这样读：`Runbook` 是故障处理手册。 |
| 第 2 行 | <code>  -&gt; Metadata</code> | 这一行要理解这些英文词：`Metadata` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>     -&gt; service</code> | 这一行要理解这些英文词：`service` 是服务。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>     -&gt; owner</code> | 这一行要理解这些英文词：`owner` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>     -&gt; alertname</code> | 这一行要理解这些英文词：`alertname` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>     -&gt; severity</code> | 这一行要理解这些英文词：`severity` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 7 行 | <code>     -&gt; last_updated</code> | 这一行要理解这些英文词：`last_updated` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 8 行 | <code>  -&gt; Trigger</code> | 这一行要理解这些英文词：`Trigger` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 9 行 | <code>     -&gt; alert rule</code> | 这一行要理解这些英文词：`alert rule` 是alert=告警。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 10 行 | <code>     -&gt; user report</code> | 这一行要理解这些英文词：`user report` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 11 行 | <code>     -&gt; maintenance task</code> | 这一行要理解这些英文词：`maintenance task` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 12 行 | <code>  -&gt; Context</code> | 这一行要理解这些英文词：`Context` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 13 行 | <code>     -&gt; user impact</code> | 这一行要理解这些英文词：`user impact` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 14 行 | <code>     -&gt; dashboards</code> | 这一行要理解这些英文词：`dashboards` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 15 行 | <code>     -&gt; logs</code> | 这一行要理解这些英文词：`logs` 是日志。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 16 行 | <code>     -&gt; dependencies</code> | 这一行要理解这些英文词：`dependencies` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 17 行 | <code>  -&gt; Preconditions</code> | 这一行要理解这些英文词：`Preconditions` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 18 行 | <code>     -&gt; permissions</code> | 这一行要理解这些英文词：`permissions` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 19 行 | <code>     -&gt; environment</code> | 这一行要理解这些英文词：`environment` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 20 行 | <code>     -&gt; approvals</code> | 这一行要理解这些英文词：`approvals` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 21 行 | <code>     -&gt; tools</code> | 这一行要理解这些英文词：`tools` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 22 行 | <code>  -&gt; Diagnosis</code> | 这一行要理解这些英文词：`Diagnosis` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 23 行 | <code>     -&gt; checks</code> | 这一行要理解这些英文词：`checks` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 24 行 | <code>     -&gt; commands</code> | 这一行要理解这些英文词：`commands` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 25 行 | <code>     -&gt; expected output</code> | 这一行要理解这些英文词：`expected output` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 26 行 | <code>     -&gt; decision tree</code> | 这一行要理解这些英文词：`decision tree` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 27 行 | <code>  -&gt; Actions</code> | 这一行要理解这些英文词：`Actions` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 28 行 | <code>     -&gt; safe actions</code> | 这一行要理解这些英文词：`safe actions` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 29 行 | <code>     -&gt; risky actions</code> | 这一行要理解这些英文词：`risky actions` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 30 行 | <code>     -&gt; approval</code> | 这一行要理解这些英文词：`approval` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 31 行 | <code>     -&gt; rollback</code> | 这一行要理解这些英文词：`rollback` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 32 行 | <code>  -&gt; Verification</code> | 这一行要理解这些英文词：`Verification` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 33 行 | <code>     -&gt; SLI back to normal</code> | 这一行要理解这些英文词：`SLI back to normal` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 34 行 | <code>     -&gt; alerts stop</code> | 这一行要理解这些英文词：`alerts stop` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 35 行 | <code>     -&gt; user reports stop</code> | 这一行要理解这些英文词：`user reports stop` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 36 行 | <code>  -&gt; Escalation</code> | 这一行要理解这些英文词：`Escalation` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 37 行 | <code>     -&gt; owner</code> | 这一行要理解这些英文词：`owner` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 38 行 | <code>     -&gt; SME</code> | 这一行要理解这些英文词：`SME` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 39 行 | <code>     -&gt; SEV upgrade</code> | 这一行要理解这些英文词：`SEV upgrade` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 40 行 | <code>  -&gt; Automation</code> | 这一行要理解这些英文词：`Automation` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 41 行 | <code>     -&gt; inputs</code> | 这一行要理解这些英文词：`inputs` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 42 行 | <code>     -&gt; steps</code> | 这一行要理解这些英文词：`steps` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 43 行 | <code>     -&gt; actions</code> | 这一行要理解这些英文词：`actions` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 44 行 | <code>     -&gt; outputs</code> | 这一行要理解这些英文词：`outputs` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 45 行 | <code>     -&gt; audit</code> | 这一行要理解这些英文词：`audit` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

初学路线：

```text
write markdown runbook
  -> attach to alert annotation
  -> test in a drill
  -> add commands and expected outputs
  -> add decision tree
  -> automate read-only checks
  -> automate low-risk actions
  -> require approval for high-risk actions
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>write markdown runbook</code> | 这一行里的英文要这样读：`write markdown runbook` 这个英文标识可以拆开理解为：故障处理手册。 |
| 第 2 行 | <code>  -&gt; attach to alert annotation</code> | 这一行要理解这些英文词：`attach to alert annotation` 是alert=告警。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; test in a drill</code> | 这一行要理解这些英文词：`test in a drill` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; add commands and expected outputs</code> | 这一行要理解这些英文词：`add commands and expected outputs` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; add decision tree</code> | 这一行要理解这些英文词：`add decision tree` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>  -&gt; automate read-only checks</code> | 这一行要理解这些英文词：`automate read-only checks` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 7 行 | <code>  -&gt; automate low-risk actions</code> | 这一行要理解这些英文词：`automate low-risk actions` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 8 行 | <code>  -&gt; require approval for high-risk actions</code> | 这一行要理解这些英文词：`require approval for high-risk actions` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

## Runbook 不是什么

Runbook 不是普通知识文章。

| 文档类型 | 目标 | 特点 |
|---|---|---|
| 技术文章 | 解释原理 | 可以长、可以讲背景 |
| 架构文档 | 描述系统 | 关注组件、依赖、设计 |
| Incident 文档 | 记录一次事件 | 关注时间线、决策、结果 |
| Runbook | 指导如何处理 | 关注步骤、判断、动作、验证 |

如果一篇文档只有原理，没有“现在该做什么”，它不是合格 runbook。

## Runbook 和 Incident 的关系

```text
alert
  -> runbook tells what to do
  -> incident doc records what happened
  -> postmortem improves runbook
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>alert</code> | 这一行里的英文要这样读：`alert` 是告警。 |
| 第 2 行 | <code>  -&gt; runbook tells what to do</code> | 这一行要理解这些英文词：`runbook tells what to do` 是runbook=故障处理手册。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; incident doc records what happened</code> | 这一行要理解这些英文词：`incident doc records what happened` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; postmortem improves runbook</code> | 这一行要理解这些英文词：`postmortem improves runbook` 是runbook=故障处理手册。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

Runbook 是事前准备。

Incident 文档是事中记录。

Postmortem 是事后学习。

三者形成闭环：

```text
runbook
  -> incident response
  -> postmortem action item
  -> runbook update
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>runbook</code> | 这一行里的英文要这样读：`runbook` 是故障处理手册。 |
| 第 2 行 | <code>  -&gt; incident response</code> | 这一行要理解这些英文词：`incident response` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; postmortem action item</code> | 这一行要理解这些英文词：`postmortem action item` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; runbook update</code> | 这一行要理解这些英文词：`runbook update` 是runbook=故障处理手册。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

## 好 Runbook 的标准

一份好的 runbook 应该让新人也能回答：

- 这条告警是什么意思？
- 用户影响是什么？
- 先看哪个 dashboard？
- 查哪些日志？
- 执行哪些只读命令？
- 哪些结果说明问题在哪？
- 哪些动作是安全的？
- 哪些动作需要审批？
- 做完后怎么验证？
- 什么时候升级？
- 处理记录写在哪里？

判断标准：

```text
能执行。
能验证。
能升级。
能审计。
能维护。
```
## Runbook 结构

推荐结构：

```text
metadata
  -> trigger
  -> impact
  -> prerequisites
  -> quick triage
  -> dashboards
  -> checks
  -> decision tree
  -> safe actions
  -> risky actions
  -> verification
  -> escalation
  -> record
  -> automation mapping
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>metadata</code> | 这一行里的英文要这样读：`metadata` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 2 行 | <code>  -&gt; trigger</code> | 这一行要理解这些英文词：`trigger` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; impact</code> | 这一行要理解这些英文词：`impact` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; prerequisites</code> | 这一行要理解这些英文词：`prerequisites` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; quick triage</code> | 这一行要理解这些英文词：`quick triage` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>  -&gt; dashboards</code> | 这一行要理解这些英文词：`dashboards` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 7 行 | <code>  -&gt; checks</code> | 这一行要理解这些英文词：`checks` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 8 行 | <code>  -&gt; decision tree</code> | 这一行要理解这些英文词：`decision tree` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 9 行 | <code>  -&gt; safe actions</code> | 这一行要理解这些英文词：`safe actions` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 10 行 | <code>  -&gt; risky actions</code> | 这一行要理解这些英文词：`risky actions` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 11 行 | <code>  -&gt; verification</code> | 这一行要理解这些英文词：`verification` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 12 行 | <code>  -&gt; escalation</code> | 这一行要理解这些英文词：`escalation` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 13 行 | <code>  -&gt; record</code> | 这一行要理解这些英文词：`record` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 14 行 | <code>  -&gt; automation mapping</code> | 这一行要理解这些英文词：`automation mapping` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

每一节都要短、具体、可执行。

## Markdown 模板

````md
# Runbook: order-api HighErrorRate

## 元信息

- 服务: order-api
- 告警: OrderApiHighErrorRate
- Owner: team-order
- 严重级别: page
- 最近更新: 2026-07-02
- 适用环境: prod
- 关联 SLO: order-api-availability
- 相关 dashboard: https://grafana.example.com/d/order-api

## 触发条件

5 分钟内 order-api 5xx 错误率 > 5%。

## 用户影响

用户可能无法下单，订单提交可能失败。

## 先决条件

- 已登录监控系统。
- 有只读日志权限。
- 有 Kubernetes 只读权限。
- 有发布系统查看权限。
- 生产回滚需要 IC 审批。

## 快速判断

1. 打开 order-api dashboard，确认错误率、p95 延迟、请求量。
2. 查看最近 30 分钟发布记录。
3. 查看 order-api 错误日志。
4. 查看下游 payment-api 状态。
5. 查看 MySQL 连接池和慢查询。

## 检查命令

```bash
kubectl get pods -n prod -l app=order-api
kubectl logs -n prod deploy/order-api --since=30m | tail -n 200
```

期望输出：

- Pod 不应大面积 CrashLoopBackOff。
- 错误日志中应定位主要错误类型。

## 决策树

- 如果错误从发布后开始，评估回滚。
- 如果日志主要是 database timeout，检查连接池和慢 SQL。
- 如果下游 payment-api 5xx 同时增加，升级 payment-api owner。
- 如果只有单个实例异常，摘除或重启该实例。

## 安全动作

### 查看最近发布

风险：低。

审批：不需要。

结果记录：记录发布版本、时间、负责人。

### 摘除单个异常实例

风险：低到中，取决于副本数。

审批：按团队规则。

前置条件：至少还有足够健康副本。

## 高风险动作

### 回滚

风险：中。

审批：需要 IC。

```bash
kubectl rollout undo deployment/order-api -n prod
```

回滚后验证：

- 5xx 错误率回落。
- p95 延迟回落。
- 新版本错误日志消失。

### 扩容

风险：低到中。

审批：按团队规则。

```bash
kubectl scale deployment/order-api -n prod --replicas=6
```

扩容后验证：

- Pod ready。
- 请求分布正常。
- 延迟下降。

## 验证恢复

- 5xx 错误率回到 1% 以下并持续 15 分钟。
- p95 延迟回到 300ms 以下。
- SLO burn rate 恢复到可接受范围。
- 新告警停止触发。
- 用户工单不再增加。

## 升级条件

- 10 分钟内没有明确缓解方向。
- 影响升级为 SEV1。
- 需要数据库、网络、安全团队参与。
- 回滚失败。
- 怀疑数据丢失。

## 处理记录

- 执行人:
- 执行动作:
- 执行时间:
- 结果:
- 后续事项:

## 自动化候选

| 步骤 | 风险 | 是否适合自动化 |
|---|---|---|
| 拉取 dashboard 链接 | 低 | 是 |
| 查询最近发布 | 低 | 是 |
| 查询错误日志摘要 | 低 | 是 |
| 摘除单实例 | 中 | 需要条件和审批 |
| 回滚生产 | 高 | 需要人工审批 |
````

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code># Runbook: order-api HighErrorRate</code> | 这一行里的英文要这样读：`Runbook` 是故障处理手册；`order-api HighErrorRate` 是高错误率告警名，通常表示某个服务的请求失败比例超过阈值。 |
| 第 5 行 | <code>- 服务: order-api</code> | 这一行里的英文要这样读：`order-api` 里的 order 表示订单业务，api 表示接口服务，合起来通常指订单接口服务。 |
| 第 6 行 | <code>- 告警: OrderApiHighErrorRate</code> | 这一行里的英文要这样读：`OrderApiHighErrorRate` 是高错误率告警名，通常表示某个服务的请求失败比例超过阈值。 |
| 第 7 行 | <code>- Owner: team-order</code> | `Owner` 是Owner 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，冒号后面的 `team-order` 是这个字段的示例内容或模板表达式。 |
| 第 8 行 | <code>- 严重级别: page</code> | 这一行里的英文要这样读：`page` 是需要立即通知值班人员的告警级别。 |
| 第 9 行 | <code>- 最近更新: 2026-07-02</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 10 行 | <code>- 适用环境: prod</code> | 这一行里的英文要这样读：`prod` 是生产环境。 |
| 第 11 行 | <code>- 关联 SLO: order-api-availability</code> | 这一行里的英文要这样读：`SLO` 是服务等级目标；`order-api-availability` 里的 order 表示订单业务，api 表示接口服务，合起来通常指订单接口服务。 |
| 第 12 行 | <code>- 相关 dashboard: https://grafana.example.com/d/order-api</code> | 这一行里的英文要这样读：`dashboard` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值；`https` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值；`grafana.example.com` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值；`d` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值；`order-api` 里的 order 表示订单业务，api 表示接口服务，合起来通常指订单接口服务。 |
| 第 16 行 | <code>5 分钟内 order-api 5xx 错误率 &gt; 5%。</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 26 行 | <code>- 有 Kubernetes 只读权限。</code> | 这一行里的英文要这样读：`Kubernetes` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源。 |
| 第 28 行 | <code>- 生产回滚需要 IC 审批。</code> | 这一行里的英文要这样读：`IC` 是Incident Commander，故障指挥官。 |
| 第 32 行 | <code>1. 打开 order-api dashboard，确认错误率、p95 延迟、请求量。</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 34 行 | <code>3. 查看 order-api 错误日志。</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 35 行 | <code>4. 查看下游 payment-api 状态。</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 36 行 | <code>5. 查看 MySQL 连接池和慢查询。</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 40 行 | <code>```bash</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 41 行 | <code>kubectl get pods -n prod -l app=order-api</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 42 行 | <code>kubectl logs -n prod deploy/order-api --since=30m &#124; tail -n 200</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 47 行 | <code>- Pod 不应大面积 CrashLoopBackOff。</code> | 这一行里的英文要这样读：`Pod` 是Kubernetes 里运行容器的最小调度单元；`CrashLoopBackOff` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源。 |
| 第 53 行 | <code>- 如果日志主要是 database timeout，检查连接池和慢 SQL。</code> | 这一行里的英文要这样读：`database timeout` 这个英文标识可以拆开理解为：数据库名称字段，超时时间字段；`SQL` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源。 |
| 第 54 行 | <code>- 如果下游 payment-api 5xx 同时增加，升级 payment-api owner。</code> | 这一行里的英文要这样读：`payment-api 5xx` 这个英文标识可以拆开理解为：应用程序接口，HTTP 5xx 服务端错误，表示请求到达服务端但服务端处理失败；`payment-api owner` 这个英文标识可以拆开理解为：应用程序接口。 |
| 第 81 行 | <code>审批：需要 IC。</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 83 行 | <code>```bash</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 84 行 | <code>kubectl rollout undo deployment/order-api -n prod</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 89 行 | <code>- 5xx 错误率回落。</code> | 这一行里的英文要这样读：`5xx` 是HTTP 5xx 服务端错误，表示请求到达服务端但服务端处理失败。 |
| 第 90 行 | <code>- p95 延迟回落。</code> | 这一行里的英文要这样读：`p95` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 99 行 | <code>```bash</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 100 行 | <code>kubectl scale deployment/order-api -n prod --replicas=6</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 105 行 | <code>- Pod ready。</code> | 这一行里的英文要这样读：`Pod ready` 这个英文标识可以拆开理解为：Kubernetes 里运行容器的最小调度单元。 |
| 第 111 行 | <code>- 5xx 错误率回到 1% 以下并持续 15 分钟。</code> | 这一行里的英文要这样读：`5xx` 是HTTP 5xx 服务端错误，表示请求到达服务端但服务端处理失败。 |
| 第 112 行 | <code>- p95 延迟回到 300ms 以下。</code> | 这一行里的英文要这样读：`p95` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值；`ms` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 113 行 | <code>- SLO burn rate 恢复到可接受范围。</code> | 这一行里的英文要这样读：`SLO burn rate` 这个英文标识可以拆开理解为：服务等级目标，比率。 |
| 第 120 行 | <code>- 影响升级为 SEV1。</code> | 这一行里的英文要这样读：`SEV1` 是一级故障，通常代表最高优先级。 |
| 第 127 行 | <code>- 执行人:</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 128 行 | <code>- 执行动作:</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 129 行 | <code>- 执行时间:</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 130 行 | <code>- 结果:</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 131 行 | <code>- 后续事项:</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 135 行 | <code>&#124; 步骤 &#124; 风险 &#124; 是否适合自动化 &#124;</code> | Markdown 表格行，用来对齐展示字段和说明。 |
| 第 136 行 | <code>&#124;---&#124;---&#124;---&#124;</code> | Markdown 表格行，用来对齐展示字段和说明。 |
| 第 137 行 | <code>&#124; 拉取 dashboard 链接 &#124; 低 &#124; 是 &#124;</code> | 这一行里的英文要这样读：`dashboard` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 138 行 | <code>&#124; 查询最近发布 &#124; 低 &#124; 是 &#124;</code> | Markdown 表格行，用来对齐展示字段和说明。 |
| 第 139 行 | <code>&#124; 查询错误日志摘要 &#124; 低 &#124; 是 &#124;</code> | Markdown 表格行，用来对齐展示字段和说明。 |
| 第 140 行 | <code>&#124; 摘除单实例 &#124; 中 &#124; 需要条件和审批 &#124;</code> | Markdown 表格行，用来对齐展示字段和说明。 |
| 第 141 行 | <code>&#124; 回滚生产 &#124; 高 &#124; 需要人工审批 &#124;</code> | Markdown 表格行，用来对齐展示字段和说明。 |

## Runbook 字段解释

| 字段 | 为什么需要 |
|---|---|
| 服务 | 路由和检索 |
| 告警名 | 关联 alert rule |
| Owner | 找到责任团队 |
| 严重级别 | 响应方式 |
| 最近更新 | 判断是否过期 |
| 触发条件 | 知道为什么来这里 |
| 用户影响 | 判断优先级 |
| 先决条件 | 防止执行者卡住 |
| 检查命令 | 快速定位事实 |
| 期望输出 | 知道结果怎么解释 |
| 决策树 | 避免凭感觉 |
| 风险 | 防止危险动作 |
| 审批 | 接入事件流程 |
| 验证恢复 | 防止过早结束 |
| 升级条件 | 不让新人独自硬扛 |
| 处理记录 | 进入 incident / postmortem |

## Alertmanager 中挂 Runbook

告警必须能直接跳到 runbook。

Prometheus alerting rule：

```yaml
annotations:
  summary: "order-api high error rate"
  description: "More than 5% of order-api requests are returning 5xx."
  runbook_url: "https://github.com/quweisheng/zero-to-aiops/tree/main/runbooks/order-api-high-error-rate.md"
  dashboard_url: "https://grafana.example.com/d/order-api"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>annotations:</code> | 定义 `annotations` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  summary: "order-api high error rate"</code> | `summary` 是摘要说明字段，`order-api high error rate` 是高错误率告警名，表示请求失败比例过高；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 3 行 | <code>  description: "More than 5% of order-api requests are returning 5xx."</code> | `description` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`More than 5% of order-api requests are returning 5xx.` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>  runbook_url: "https://github.com/quweisheng/zero-to-aiops/tree/main/runbooks/order-api-high-error-rate.md"</code> | `runbook_url` 是故障处理手册链接字段，`https://github.com/quweisheng/zero-to-aiops/tree/main/runbooks/order-api-high-error-rate.md` 是高错误率告警名，表示请求失败比例过高；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 5 行 | <code>  dashboard_url: "https://grafana.example.com/d/order-api"</code> | `dashboard_url` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`https://grafana.example.com/d/order-api` 表示URL 地址，表示页面、接口或文档入口；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |

如果通知里没有 runbook_url，值班人会浪费时间搜索。

## Runbook 质量检查

每份 runbook 上线前检查：

- 是否能从告警一键打开？
- 是否写了 owner？
- 是否写了适用环境？
- 是否写了用户影响？
- 是否列出只读检查？
- 是否给出期望输出？
- 是否有决策树？
- 是否区分安全动作和高风险动作？
- 是否写了审批要求？
- 是否写了验证恢复？
- 是否写了升级条件？
- 是否最近演练过？

不合格 runbook 不应该作为 page 告警的唯一处理依据。

## 从人工到自动化

AWS Systems Manager Automation runbook 的概念很适合理解自动化：runbook 由按顺序执行的 steps 组成，每个 step 围绕一个 action，前一步的输出可以作为后一步输入。

通用自动化路径：

```text
人工 Markdown runbook
  -> 只读检查脚本
  -> 参数化脚本
  -> 受控自动化
  -> 自助执行
  -> 告警触发 + 人工审批
  -> 低风险自动执行
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>人工 Markdown runbook</code> | 这一行里的英文要这样读：`Markdown runbook` 这个英文标识可以拆开理解为：故障处理手册。 |
| 第 2 行 | <code>  -&gt; 只读检查脚本</code> | 这一行表示上一级主题下的子项“只读检查脚本”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |
| 第 3 行 | <code>  -&gt; 参数化脚本</code> | 这一行表示上一级主题下的子项“参数化脚本”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |
| 第 4 行 | <code>  -&gt; 受控自动化</code> | 这一行表示上一级主题下的子项“受控自动化”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |
| 第 5 行 | <code>  -&gt; 自助执行</code> | 这一行表示上一级主题下的子项“自助执行”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |
| 第 6 行 | <code>  -&gt; 告警触发 + 人工审批</code> | 这一行表示上一级主题下的子项“告警触发 + 人工审批”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |
| 第 7 行 | <code>  -&gt; 低风险自动执行</code> | 这一行表示上一级主题下的子项“低风险自动执行”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |

不要跳过前几步直接让告警自动重启生产。

## 自动化风险分级

| 步骤 | 风险 | 自动化建议 |
|---|---:|---|
| 查询指标 | 低 | 自动 |
| 查询日志摘要 | 低 | 自动 |
| 查询最近发布 | 低 | 自动 |
| 生成状态更新草稿 | 低 | 自动，但人工发送 |
| 创建工单 | 低到中 | 可自动 |
| 扩容 | 中 | 加条件和审批 |
| 摘除实例 | 中 | 加健康检查和回滚 |
| 回滚生产 | 高 | 必须审批 |
| 删除数据 | 极高 | 不应自动 |

自动化要满足：

- 幂等。
- 可重试。
- 可回滚。
- 有超时。
- 有审计。
- 有权限边界。
- 有人工审批入口。

## Runbook 和 AIOps

Runbook 是 AIOps 的知识资产。

| AIOps 能力 | Runbook 如何参与 |
|---|---|
| 告警摘要 | 提供告警含义和用户影响 |
| Runbook 推荐 | 根据 alertname/service 检索 |
| RAG 问答 | runbook chunk 进入向量库 |
| 自动化 | 安全步骤变成执行单元 |
| 事件响应 | runbook 指导检查和缓解 |
| 复盘 | incident action item 更新 runbook |
| 新人学习 | 用真实告警学习操作路径 |

LLM 可以帮助：

- 总结 runbook。
- 根据告警推荐 runbook。
- 把长 runbook 变成步骤清单。
- 生成状态更新草稿。

但 LLM 不应该绕过审批执行高风险动作。

## 入门练习：写一个告警 Runbook

任务：为 `OrderApiHighErrorRate` 写一份 runbook。

必须包含：

1. 元信息。
2. 触发条件。
3. 用户影响。
4. 先决条件。
5. 快速判断。
6. 检查命令。
7. 决策树。
8. 安全动作。
9. 高风险动作和审批。
10. 验证恢复。
11. 升级条件。
12. 自动化候选。

再写一个只读检查脚本：

```bash
#!/usr/bin/env bash
set -euo pipefail

NAMESPACE="${1:-prod}"
APP="${2:-order-api}"

echo "== Pods =="
kubectl get pods -n "$NAMESPACE" -l app="$APP"

echo "== Recent logs =="
kubectl logs -n "$NAMESPACE" deploy/"$APP" --since=30m | tail -n 100
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>#!/usr/bin/env bash</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 2 行 | <code>set -euo pipefail</code> | 设置 shell 或工具变量，具体含义取决于当前终端环境。 |
| 第 4 行 | <code>NAMESPACE="${1:-prod}"</code> | 执行 `namespace="${1:-prod}"` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 5 行 | <code>APP="${2:-order-api}"</code> | 执行 `app="${2:-order-api}"` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 7 行 | <code>echo "== Pods =="</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 8 行 | <code>kubectl get pods -n "$NAMESPACE" -l app="$APP"</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |
| 第 10 行 | <code>echo "== Recent logs =="</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 11 行 | <code>kubectl logs -n "$NAMESPACE" deploy/"$APP" --since=30m &#124; tail -n 100</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |

这个脚本只读，适合作为自动化第一步。

## 常见错误

### 只有原理，没有步骤

Runbook 不是知识文章。必须写“下一步做什么”。

### 没有期望输出

只有命令不够，执行者还要知道结果怎么解释。

### 没有验证恢复

执行完动作不代表恢复。必须看 SLI、告警和用户反馈。

### 没有风险说明

回滚、扩容、重启、删除都要写风险和审批。

### 没有升级条件

新人可能独自卡太久。必须写什么时候拉人。

### 长期不维护

过期 runbook 比没有 runbook 更危险。

### 自动化没有权限边界

自动化必须有最小权限、审计和审批。

## 常用字段字典

### `runbook_url`

告警跳转到 runbook 的链接。

### `dashboard_url`

排障 dashboard 链接。

### `owner`

责任团队或服务负责人。

### `trigger`

Runbook 适用的触发条件。

### `preconditions`

执行前需要满足的权限、环境和工具条件。

### `safe_actions`

低风险动作，通常可以自动化或自助执行。

### `risky_actions`

需要审批或人工确认的动作。

### `verification`

执行后如何确认恢复。

### `escalation`

什么时候、找谁升级。

### `automation_id`

关联脚本、流水线、AWS SSM Automation 或内部自动化平台 ID。

## 面试怎么讲

Runbook 是故障处理的可执行手册，不是普通知识文章。好的 runbook 要从告警或任务出发，写清楚触发条件、用户影响、先决条件、检查步骤、期望输出、决策树、缓解动作、风险、审批、验证恢复和升级条件。它应该挂在告警的 `runbook_url` 上，让值班人从通知直接进入处理流程。

我会先写人工 Markdown runbook，并通过演练验证它是否真的可执行。之后把低风险、重复、只读的步骤自动化，比如查询 dashboard、最近发布、日志摘要；高风险动作如生产回滚、重启、删除数据必须保留审批、审计和回滚方案。AIOps 中，runbook 还能进入 RAG 和向量库，用于相似故障检索、告警摘要、runbook 推荐和自动化候选生成。

## 学习检查清单

- [ ] 我能解释 runbook 和普通技术文档的区别。
- [ ] 我能解释 runbook、incident、postmortem 的关系。
- [ ] 我能写一份完整告警 runbook。
- [ ] 我能把 runbook_url 挂到 Prometheus 告警。
- [ ] 我能写检查命令和期望输出。
- [ ] 我能写决策树。
- [ ] 我能区分安全动作和高风险动作。
- [ ] 我能写验证恢复标准。
- [ ] 我能写升级条件。
- [ ] 我能判断哪些步骤适合自动化。
- [ ] 我能说明自动化需要权限、审批和审计。
- [ ] 我能说明 runbook 如何进入 AIOps / RAG。

## 面试题

1. Runbook 解决什么问题？
2. Runbook 和普通文档有什么区别？
3. Runbook 和 incident 文档有什么关系？
4. 一份好的 runbook 应该包含哪些部分？
5. 为什么每条 page 告警都应该有 runbook_url？
6. 为什么命令后面要写期望输出？
7. 为什么动作要写风险和审批？
8. 什么样的 runbook 步骤适合自动化？
9. 为什么不能一开始就自动回滚生产？
10. 自动化 runbook 需要哪些安全边界？
11. Runbook 如何支持新人值班？
12. Runbook 如何进入 RAG？
13. Postmortem action item 如何更新 runbook？
14. 如何判断 runbook 是否过期？
15. AIOps 如何利用 runbook 做告警推荐？

## 学习证据

学完后，在 GitHub 留下这些证据：

- 一份 `order-api-high-error-rate.md` runbook。
- 一条带 `runbook_url` 的 Prometheus 告警规则。
- 一个只读检查脚本。
- 一张自动化候选表。
- 一份 runbook 质量检查表。
- README 解释 runbook、incident、postmortem 的闭环。
- README 说明哪些动作不能自动化，为什么。
