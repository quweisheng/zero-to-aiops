# AIOps 闭环

> 目标：不是把 AIOps 理解成“接一个聊天机器人”，而是能设计一条从观测、检测、关联、解释、推荐、执行、验证到学习的工程闭环；每一层都有输入、输出、工具、护栏、验证方式和反馈机制。

## 官方资料

优先读这些官方资料和高可信资料：

- [Microsoft Learn - AIOps and agentic operations in Azure Monitor](https://learn.microsoft.com/en-us/azure/azure-monitor/aiops/aiops-and-agentic-operations)
- [Microsoft Learn - Azure Copilot Observability Agent](https://learn.microsoft.com/en-us/azure/azure-monitor/aiops/observability-agent-overview)
- [Google SRE Book](https://sre.google/sre-book/table-of-contents/)
- [Google SRE Book - Service Level Objectives](https://sre.google/sre-book/service-level-objectives/)
- [Google SRE Book - Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/)
- [Google SRE Book - Emergency Response](https://sre.google/sre-book/emergency-response/)
- [Google SRE Book - Postmortem Culture](https://sre.google/sre-book/postmortem-culture/)
- [IBM - What is AIOps?](https://www.ibm.com/think/topics/aiops)
- [Red Hat - What is AIOps?](https://www.redhat.com/en/topics/ai/what-is-aiops)

说明：本文把前面所有技术串成一个 AIOps 闭环。它不是某个单品工具，而是一条从观测、检测、关联、解释、行动到复盘学习的工程链路。

## 场景开场

你已经有：

- Prometheus。
- Grafana。
- Alertmanager。
- Loki / Elasticsearch。
- OpenTelemetry。
- FastAPI。
- MySQL / Redis / Kafka。
- pandas / scikit-learn。
- OpenAI API / RAG / 向量数据库。
- Ansible / Terraform / CI/CD / Runbook Automation。
- SLI/SLO、告警治理、事件响应、RCA、变更管理。

那是不是就有 AIOps 了？

不一定。

如果这些能力只是散落在各处，它们只是工具。AIOps 的关键是闭环：

```text
数据能采到。
异常能发现。
上下文能关联。
解释能给证据。
动作有护栏。
结果能验证。
复盘能反哺。
```
少一环，就容易变成孤立 demo。

## 一句话人话版

AIOps 闭环是把运维数据变成受控行动的链路：观测、检测、关联、解释、推荐、执行、验证、学习，每一步都有证据和边界。

## 小白可能会问

- AIOps 是不是等于大模型运维助手？
- AIOps 和 SRE 是什么关系？
- 异常检测、告警降噪、根因分析、自动化修复怎么串起来？
- 哪些动作可以自动执行，哪些必须审批？
- 为什么没有 SLO 就很难做 AIOps？
- LLM 在闭环里到底做什么？
- RAG 和向量数据库在哪一层？
- 怎么证明 AIOps 项目真的改善了运维效率？
- 一个能放到 GitHub 的 AIOps 项目应该长什么样？

## 官方知识地图

AIOps 闭环可以按这张地图理解：

```text
Observe
  -> metrics
  -> logs
  -> traces
  -> events
  -> changes
  -> topology
Detect
  -> SLO burn-rate alerts
  -> static thresholds
  -> anomaly detection
  -> forecasting
Correlate
  -> alert grouping
  -> service topology
  -> time window
  -> recent changes
  -> similar incidents
Explain
  -> evidence
  -> logs
  -> metrics
  -> runbooks
  -> RCA history
  -> LLM summary
Recommend
  -> next checks
  -> runbook steps
  -> safe actions
  -> approval-needed actions
Act
  -> create ticket
  -> collect diagnostics
  -> run read-only checks
  -> execute approved automation
Verify
  -> SLI back to normal
  -> alerts stop
  -> business metrics recover
Learn
  -> postmortem
  -> action items
  -> updated alerts
  -> updated runbooks
  -> updated features/models
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Observe</code> | 这一行里的英文要这样读：`Observe` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源。 |
| 第 2 行 | <code>  -&gt; metrics</code> | 这一行要理解这些英文词：`metrics` 是指标。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; logs</code> | 这一行要理解这些英文词：`logs` 是日志。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; traces</code> | 这一行要理解这些英文词：`traces` 是链路追踪。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; events</code> | 这一行要理解这些英文词：`events` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>  -&gt; changes</code> | 这一行要理解这些英文词：`changes` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 7 行 | <code>  -&gt; topology</code> | 这一行要理解这些英文词：`topology` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 8 行 | <code>Detect</code> | 这一行里的英文要这样读：`Detect` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源。 |
| 第 9 行 | <code>  -&gt; SLO burn-rate alerts</code> | 这一行要理解这些英文词：`SLO burn-rate alerts` 是slo=服务等级目标。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 10 行 | <code>  -&gt; static thresholds</code> | 这一行要理解这些英文词：`static thresholds` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 11 行 | <code>  -&gt; anomaly detection</code> | 这一行要理解这些英文词：`anomaly detection` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 12 行 | <code>  -&gt; forecasting</code> | 这一行要理解这些英文词：`forecasting` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 13 行 | <code>Correlate</code> | 这一行里的英文要这样读：`Correlate` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源。 |
| 第 14 行 | <code>  -&gt; alert grouping</code> | 这一行要理解这些英文词：`alert grouping` 是alert=告警。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 15 行 | <code>  -&gt; service topology</code> | 这一行要理解这些英文词：`service topology` 是service=服务。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 16 行 | <code>  -&gt; time window</code> | 这一行要理解这些英文词：`time window` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 17 行 | <code>  -&gt; recent changes</code> | 这一行要理解这些英文词：`recent changes` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 18 行 | <code>  -&gt; similar incidents</code> | 这一行要理解这些英文词：`similar incidents` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 19 行 | <code>Explain</code> | 这一行里的英文要这样读：`Explain` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源。 |
| 第 20 行 | <code>  -&gt; evidence</code> | 这一行要理解这些英文词：`evidence` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 21 行 | <code>  -&gt; logs</code> | 这一行要理解这些英文词：`logs` 是日志。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 22 行 | <code>  -&gt; metrics</code> | 这一行要理解这些英文词：`metrics` 是指标。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 23 行 | <code>  -&gt; runbooks</code> | 这一行要理解这些英文词：`runbooks` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 24 行 | <code>  -&gt; RCA history</code> | 这一行要理解这些英文词：`RCA history` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 25 行 | <code>  -&gt; LLM summary</code> | 这一行要理解这些英文词：`LLM summary` 是llm=大语言模型。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 26 行 | <code>Recommend</code> | 这一行里的英文要这样读：`Recommend` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源。 |
| 第 27 行 | <code>  -&gt; next checks</code> | 这一行要理解这些英文词：`next checks` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 28 行 | <code>  -&gt; runbook steps</code> | 这一行要理解这些英文词：`runbook steps` 是runbook=故障处理手册。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 29 行 | <code>  -&gt; safe actions</code> | 这一行要理解这些英文词：`safe actions` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 30 行 | <code>  -&gt; approval-needed actions</code> | 这一行要理解这些英文词：`approval-needed actions` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 31 行 | <code>Act</code> | 这一行里的英文要这样读：`Act` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源。 |
| 第 32 行 | <code>  -&gt; create ticket</code> | 这一行要理解这些英文词：`create ticket` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 33 行 | <code>  -&gt; collect diagnostics</code> | 这一行要理解这些英文词：`collect diagnostics` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 34 行 | <code>  -&gt; run read-only checks</code> | 这一行要理解这些英文词：`run read-only checks` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 35 行 | <code>  -&gt; execute approved automation</code> | 这一行要理解这些英文词：`execute approved automation` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 36 行 | <code>Verify</code> | 这一行里的英文要这样读：`Verify` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源。 |
| 第 37 行 | <code>  -&gt; SLI back to normal</code> | 这一行要理解这些英文词：`SLI back to normal` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 38 行 | <code>  -&gt; alerts stop</code> | 这一行要理解这些英文词：`alerts stop` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 39 行 | <code>  -&gt; business metrics recover</code> | 这一行要理解这些英文词：`business metrics recover` 是metrics=指标。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 40 行 | <code>Learn</code> | 这一行里的英文要这样读：`Learn` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源。 |
| 第 41 行 | <code>  -&gt; postmortem</code> | 这一行要理解这些英文词：`postmortem` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 42 行 | <code>  -&gt; action items</code> | 这一行要理解这些英文词：`action items` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 43 行 | <code>  -&gt; updated alerts</code> | 这一行要理解这些英文词：`updated alerts` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 44 行 | <code>  -&gt; updated runbooks</code> | 这一行要理解这些英文词：`updated runbooks` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 45 行 | <code>  -&gt; updated features/models</code> | 这一行要理解这些英文词：`updated features` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`models` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

Microsoft Azure Monitor 的 AIOps / agentic operations 资料也强调：现代运维智能不只是发现异常，还包括跨信号调查、解释发生了什么、说明证据、指导下一步行动。这个思路和 SRE 闭环天然契合。

## AIOps 不是聊天机器人

聊天界面只是交互方式。

真正的 AIOps 需要：

- 数据。
- 规则。
- 模型。
- 上下文。
- 流程。
- 权限。
- 审批。
- 审计。
- 验证。
- 反馈。

坏架构：

```text
raw logs
  -> LLM
  -> "root cause is database"
  -> auto restart production
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>raw logs</code> | 这一行里的英文要这样读：`raw logs` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 2 行 | <code>  -&gt; LLM</code> | 这一行要理解这些英文词：`LLM` 是大语言模型。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; "root cause is database"</code> | 这一行要理解这些英文词：`root cause is database` 是database=数据库。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; auto restart production</code> | 这一行要理解这些英文词：`auto restart production` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

好架构：

```text
alert
  -> SLO impact
  -> recent changes
  -> logs / metrics / traces
  -> runbook retrieval
  -> LLM summary with evidence
  -> human approval
  -> controlled automation
  -> verify SLI
  -> postmortem updates knowledge
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>alert</code> | 这一行里的英文要这样读：`alert` 是告警。 |
| 第 2 行 | <code>  -&gt; SLO impact</code> | 这一行要理解这些英文词：`SLO impact` 是slo=服务等级目标。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; recent changes</code> | 这一行要理解这些英文词：`recent changes` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; logs / metrics / traces</code> | 这一行要理解这些英文词：`logs` 是日志；`metrics` 是指标；`traces` 是链路追踪。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; runbook retrieval</code> | 这一行要理解这些英文词：`runbook retrieval` 是runbook=故障处理手册。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>  -&gt; LLM summary with evidence</code> | 这一行要理解这些英文词：`LLM summary with evidence` 是llm=大语言模型。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 7 行 | <code>  -&gt; human approval</code> | 这一行要理解这些英文词：`human approval` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 8 行 | <code>  -&gt; controlled automation</code> | 这一行要理解这些英文词：`controlled automation` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 9 行 | <code>  -&gt; verify SLI</code> | 这一行要理解这些英文词：`verify SLI` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 10 行 | <code>  -&gt; postmortem updates knowledge</code> | 这一行要理解这些英文词：`postmortem updates knowledge` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

## 闭环总架构

一个适合个人作品集的 AIOps 闭环：

```text
Demo service
  -> Prometheus metrics
  -> Grafana dashboard
  -> Alertmanager alert
  -> FastAPI webhook receiver
  -> Redis dedup
  -> MySQL incident store
  -> Kafka event stream
  -> pandas feature table
  -> scikit-learn anomaly signal
  -> vector database runbook retrieval
  -> OpenAI summary
  -> human approval
  -> Ansible / script action
  -> Prometheus verifies recovery
  -> RCA updates runbook and rules
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Demo service</code> | 这一行里的英文要这样读：`Demo service` 这个英文标识可以拆开理解为：服务名称字段。 |
| 第 2 行 | <code>  -&gt; Prometheus metrics</code> | 这一行要理解这些英文词：`Prometheus metrics` 是metrics=指标。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; Grafana dashboard</code> | 这一行要理解这些英文词：`Grafana dashboard` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; Alertmanager alert</code> | 这一行要理解这些英文词：`Alertmanager alert` 是alertmanager=Prometheus 生态里的告警管理器，alert=告警。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; FastAPI webhook receiver</code> | 这一行要理解这些英文词：`FastAPI webhook receiver` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>  -&gt; Redis dedup</code> | 这一行要理解这些英文词：`Redis dedup` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 7 行 | <code>  -&gt; MySQL incident store</code> | 这一行要理解这些英文词：`MySQL incident store` 是mysql=MySQL 数据库或客户端命令。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 8 行 | <code>  -&gt; Kafka event stream</code> | 这一行要理解这些英文词：`Kafka event stream` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 9 行 | <code>  -&gt; pandas feature table</code> | 这一行要理解这些英文词：`pandas feature table` 是table=表。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 10 行 | <code>  -&gt; scikit-learn anomaly signal</code> | 这一行要理解这些英文词：`scikit-learn anomaly signal` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 11 行 | <code>  -&gt; vector database runbook retrieval</code> | 这一行要理解这些英文词：`vector database runbook retrieval` 是database=数据库，runbook=故障处理手册。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 12 行 | <code>  -&gt; OpenAI summary</code> | 这一行要理解这些英文词：`OpenAI summary` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 13 行 | <code>  -&gt; human approval</code> | 这一行要理解这些英文词：`human approval` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 14 行 | <code>  -&gt; Ansible / script action</code> | 这一行要理解这些英文词：`Ansible` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`script action` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 15 行 | <code>  -&gt; Prometheus verifies recovery</code> | 这一行要理解这些英文词：`Prometheus verifies recovery` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 16 行 | <code>  -&gt; RCA updates runbook and rules</code> | 这一行要理解这些英文词：`RCA updates runbook and rules` 是runbook=故障处理手册。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

这条链路把本知识库的技术栈串起来了。

## 分层输入输出

| 层 | 输入 | 输出 | 代表技术 |
|---|---|---|---|
| 数据层 | 指标、日志、链路、告警、变更 | 可查询数据 | Prometheus、Loki、OpenTelemetry、MySQL |
| 检测层 | SLI、规则、特征 | 告警、异常分数 | Alertmanager、scikit-learn |
| 关联层 | 告警、拓扑、变更、时间窗口 | incident candidate | Redis、Kafka、MySQL |
| 解释层 | 上下文、runbook、历史事故 | 证据化摘要 | RAG、OpenAI API |
| 建议层 | runbook、策略、风险等级 | 下一步检查和动作 | LLM、规则引擎 |
| 行动层 | 审批后的动作 | 自动化执行结果 | Ansible、脚本、CI/CD |
| 验证层 | SLI、告警、业务指标 | 恢复判断 | Prometheus、Grafana |
| 学习层 | RCA、行动项、反馈 | 更新规则/模型/文档 | Markdown、GitHub、向量库 |

每一层都应该有清晰边界。不要让 LLM 同时承担所有角色。

## 数据层

数据层决定 AIOps 上限。

需要收集：

| 数据 | 工具 | 用途 |
|---|---|---|
| 指标 | Prometheus | SLI、SLO、异常检测 |
| 日志 | Loki / Elasticsearch | 错误证据 |
| 链路 | OpenTelemetry | 依赖和延迟路径 |
| 告警 | Alertmanager | 事件入口 |
| 变更 | GitHub Actions / CI/CD | 根因候选 |
| Runbook | Markdown / GitHub | 处理知识 |
| RCA | Markdown / MySQL | 学习反馈 |
| 拓扑 | Kubernetes / CMDB | 依赖关系 |

最低数据质量要求：

- 有 service 标签。
- 有 owner。
- 有环境 env。
- 有时间戳。
- 有 request id / trace id。
- 告警能关联 runbook_url。
- 变更能关联 commit、artifact、service。

没有这些字段，后面的聚类、RAG、根因分析都会变弱。

## 检测层

检测层不应该只靠机器学习。

推荐顺序：

```text
SLO burn-rate alert
  + static thresholds
  + anomaly detection
  + forecast
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>SLO burn-rate alert</code> | 这一行里的英文要这样读：`SLO burn-rate alert` 这个英文标识可以拆开理解为：服务等级目标，比率，告警。 |
| 第 2 行 | <code>  + static thresholds</code> | 这一行里的英文要这样读：`static thresholds` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 3 行 | <code>  + anomaly detection</code> | 这一行里的英文要这样读：`anomaly detection` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 4 行 | <code>  + forecast</code> | 这一行里的英文要这样读：`forecast` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |

各自职责：

| 方法 | 优点 | 风险 |
|---|---|---|
| SLO 告警 | 贴近用户影响 | 需要定义好 SLI |
| 静态阈值 | 简单可解释 | 不适应周期变化 |
| 异常检测 | 发现模式偏离 | 可能误报 |
| 预测 | 提前发现容量问题 | 依赖历史数据 |

初学项目中：

- Prometheus 负责 SLO 和阈值。
- pandas 负责统计和特征。
- scikit-learn 负责异常分数。
- Alertmanager 负责通知入口。

## 关联层

关联层回答：

```text
这些告警是不是同一个事故？
最近有没有相关变更？
和历史哪次事故相似？
是否来自同一个下游依赖？
```
最小关联规则：

```text
same service
  + same 10-minute window
  + same dependency
  + same recent change
  -> incident candidate
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>same service</code> | 这一行里的英文要这样读：`same service` 这个英文标识可以拆开理解为：服务名称字段。 |
| 第 2 行 | <code>  + same 10-minute window</code> | 这一行里的英文要这样读：`same` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值；`minute window` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 3 行 | <code>  + same dependency</code> | 这一行里的英文要这样读：`same dependency` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 4 行 | <code>  + same recent change</code> | 这一行里的英文要这样读：`same recent change` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 5 行 | <code>  -&gt; incident candidate</code> | 这一行要理解这些英文词：`incident candidate` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

数据模型：

```json
{
  "incident_candidate_id": "ic-20260702-001",
  "service": "order-api",
  "start_time": "2026-07-02T09:10:00Z",
  "alerts": ["OrderApiHighErrorRate", "OrderApiHighLatency"],
  "recent_changes": ["CHG-2026-0702-001"],
  "suspected_dependencies": ["mysql", "payment-api"],
  "slo_impact": {
    "availability_burn_rate": 14.4
  }
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{</code> | 对象开始，表示下面是一组键值对配置。 |
| 第 2 行 | <code>  "incident_candidate_id": "ic-20260702-001",</code> | `incident_candidate_id` 这个英文标识可以拆开理解为：线上故障或事件，`ic-20260702-001` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 3 行 | <code>  "service": "order-api",</code> | `service` 是服务名称字段，`order-api` 是具体服务名，表示这条记录属于这个服务；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 4 行 | <code>  "start_time": "2026-07-02T09:10:00Z",</code> | `start_time` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`2026-07-02T09:10:00Z` 表示具体时间值，表示事件、告警或记录发生的时间点；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 5 行 | <code>  "alerts": ["OrderApiHighErrorRate", "OrderApiHighLatency"],</code> | `alerts` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`["OrderApiHighErrorRate", "OrderApiHighLatency"]` 是高错误率告警名，表示请求失败比例过高；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 6 行 | <code>  "recent_changes": ["CHG-2026-0702-001"],</code> | `recent_changes` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`["CHG-2026-0702-001"]` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 7 行 | <code>  "suspected_dependencies": ["mysql", "payment-api"],</code> | `suspected_dependencies` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`["mysql", "payment-api"]` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 8 行 | <code>  "slo_impact": {</code> | `slo_impact` 这个英文标识可以拆开理解为：服务等级目标，`{` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 9 行 | <code>    "availability_burn_rate": 14.4</code> | `availability_burn_rate` 这个英文标识可以拆开理解为：比率，`14.4` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 10 行 | <code>  }</code> | 对象结束，表示这一组键值对配置到这里结束。 |
| 第 11 行 | <code>}</code> | 对象结束，表示这一组键值对配置到这里结束。 |

关联不是定根因，只是组织上下文。

## 解释层

解释层必须带证据。

坏输出：

```text
根因是数据库。
```
好输出：

```text
候选原因：数据库连接池配置异常。
证据：
1. 09:02 有 order-api 发布 CHG-2026-0702-001。
2. 09:10 5xx 错误率从 1% 升到 23%。
3. Loki 日志显示 database connection timeout 占 5xx 的 78%。
4. Runbook 指出该现象需要检查连接池和最近配置 diff。
缺失信息：
- 当前没有数据库连接池 active 指标。
- 当前没有慢查询统计。
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 3 行 | <code>1. 09:02 有 order-api 发布 CHG-2026-0702-001。</code> | `1. 09:02 有 order-api 发布 CHG-2026-0702-001。` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 4 行 | <code>2. 09:10 5xx 错误率从 1% 升到 23%。</code> | `2. 09:10 5xx 错误率从 1% 升到 23%。` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 5 行 | <code>3. Loki 日志显示 database connection timeout 占 5xx 的 78%。</code> | `3. Loki 日志显示 database connection timeout 占 5xx 的 78%。` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 6 行 | <code>4. Runbook 指出该现象需要检查连接池和最近配置 diff。</code> | `4. Runbook 指出该现象需要检查连接池和最近配置 diff。` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 8 行 | <code>- 当前没有数据库连接池 active 指标。</code> | 这一行里的英文要这样读：`active` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |

LLM 适合做：

- 摘要。
- 证据组织。
- 缺失信息列举。
- runbook 步骤改写。
- 状态更新草稿。

LLM 不适合做：

- 无证据定根因。
- 绕过审批执行动作。
- 访问无权限数据。
- 替代 SLO 和监控规则。

## 建议层

建议层输出“下一步”。

建议应该分级：

| 类型 | 示例 |
|---|---|
| next_checks | 检查最近发布、数据库连接池、下游 payment-api |
| safe_actions | 拉取日志摘要、创建工单、通知 owner |
| approval_required_actions | 回滚、扩容、摘除实例 |
| forbidden_actions | 删除数据、绕过权限、无审批重启核心服务 |

结构化输出示例：

```json
{
  "summary": "order-api 5xx 和延迟升高，时间上接近一次发布。",
  "possible_causes": [
    {
      "title": "发布引入数据库连接池配置问题",
      "evidence": ["CHG-2026-0702-001", "database timeout logs"],
      "confidence": 0.68
    }
  ],
  "next_checks": ["检查连接池 active 指标", "对比配置 diff"],
  "safe_actions": ["创建 incident 文档", "生成状态更新草稿"],
  "approval_required_actions": ["回滚 order-api"],
  "missing_information": ["数据库慢查询统计"]
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{</code> | 对象开始，表示下面是一组键值对配置。 |
| 第 2 行 | <code>  "summary": "order-api 5xx 和延迟升高，时间上接近一次发布。",</code> | `summary` 是摘要说明字段，`order-api 5xx 和延迟升高，时间上接近一次发布。` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 3 行 | <code>  "possible_causes": [</code> | `possible_causes` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`[` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 4 行 | <code>    {</code> | 对象开始，表示下面是一组键值对配置。 |
| 第 5 行 | <code>      "title": "发布引入数据库连接池配置问题",</code> | `title` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`发布引入数据库连接池配置问题` 是这个字段的中文取值，已经直接说明了含义；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 6 行 | <code>      "evidence": ["CHG-2026-0702-001", "database timeout logs"],</code> | `evidence` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`["CHG-2026-0702-001", "database timeout logs"]` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 7 行 | <code>      "confidence": 0.68</code> | `confidence` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`0.68` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 8 行 | <code>    }</code> | 对象结束，表示这一组键值对配置到这里结束。 |
| 第 9 行 | <code>  ],</code> | 当前对象或数组结束，逗号表示后面还有同级项目。 |
| 第 10 行 | <code>  "next_checks": ["检查连接池 active 指标", "对比配置 diff"],</code> | `next_checks` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`["检查连接池 active 指标", "对比配置 diff"]` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 11 行 | <code>  "safe_actions": ["创建 incident 文档", "生成状态更新草稿"],</code> | `safe_actions` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`["创建 incident 文档", "生成状态更新草稿"]` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 12 行 | <code>  "approval_required_actions": ["回滚 order-api"],</code> | `approval_required_actions` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`["回滚 order-api"]` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 13 行 | <code>  "missing_information": ["数据库慢查询统计"]</code> | `missing_information` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`["数据库慢查询统计"]` 是这个字段的中文取值，已经直接说明了含义；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 14 行 | <code>}</code> | 对象结束，表示这一组键值对配置到这里结束。 |

## 行动层

行动层必须有护栏。

| 动作 | 自动化级别 |
|---|---|
| 收集日志 | 可自动 |
| 查询最近变更 | 可自动 |
| 检索 runbook | 可自动 |
| 生成摘要 | 可自动 |
| 创建工单 | 可自动或半自动 |
| 发送客户通知 | 人工确认 |
| 扩容 | 审批后自动 |
| 回滚 | IC 审批后执行 |
| 删除数据 | 禁止自动 |

护栏：

- 权限最小化。
- 审批。
- 审计。
- 幂等。
- 超时。
- 回滚。
- 执行前后验证。
- 高风险动作人工确认。

## 验证层

执行动作后必须验证。

验证问题：

- SLI 是否恢复？
- 错误预算是否停止燃烧？
- 告警是否停止 firing？
- 用户工单是否停止增加？
- 日志是否停止出现关键错误？
- 业务指标是否恢复？
- 变更或自动化是否产生新问题？

恢复标准示例：

```text
order-api 5xx < 1% 持续 15 分钟。
p95 延迟 < 300ms 持续 15 分钟。
SLO burn rate < 1。
无新增用户投诉。
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>order-api 5xx &lt; 1% 持续 15 分钟。</code> | 这一行里的英文要这样读：`order-api 5xx` 里的 order 表示订单业务，api 表示接口服务，合起来通常指订单接口服务。 |
| 第 2 行 | <code>p95 延迟 &lt; 300ms 持续 15 分钟。</code> | 这一行里的英文要这样读：`p95` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值；`ms` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 3 行 | <code>SLO burn rate &lt; 1。</code> | 这一行里的英文要这样读：`SLO burn rate` 这个英文标识可以拆开理解为：服务等级目标，比率。 |

没有验证层，自动化只是“执行了动作”，不是“解决了问题”。

## 学习层

学习层让系统变聪明。

每次 incident 后更新：

- 告警规则。
- SLO。
- runbook。
- RCA。
- 变更门禁。
- 自动化脚本。
- RAG 知识库。
- 异常检测特征。
- 权限和审批规则。

闭环公式：

```text
incident -> postmortem -> action items -> updated system -> fewer repeat incidents
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>incident -&gt; postmortem -&gt; action items -&gt; updated system -&gt; fewer repeat incidents</code> | 这一行要理解这些英文词：`incident` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`postmortem` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`action items` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`updated system` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`fewer repeat incidents` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

如果没有 RCA 和行动项，AIOps 只是一次性分析，不是闭环。

## 最小作品集项目

项目名：

```text
zero-to-aiops-lab
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>zero-to-aiops-lab</code> | 这一行里的英文要这样读：`zero-to-aiops-lab` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |

目录：

```text
projects/zero-to-aiops-lab/
  README.md
  docker-compose.yaml
  app/
  prometheus/
  grafana/
  alertmanager/
  api/
  analysis/
  runbooks/
  incidents/
  rca/
  changes/
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>projects/zero-to-aiops-lab/</code> | `projects/zero-to-aiops-lab/` 是目录示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 2 行 | <code>  README.md</code> | `README.md` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 3 行 | <code>  docker-compose.yaml</code> | `docker-compose.yaml` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 4 行 | <code>  app/</code> | `app/` 是目录示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 5 行 | <code>  prometheus/</code> | `prometheus/` 是目录示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 6 行 | <code>  grafana/</code> | `grafana/` 是目录示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 7 行 | <code>  alertmanager/</code> | `alertmanager/` 是目录示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 8 行 | <code>  api/</code> | `api/` 是目录示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 9 行 | <code>  analysis/</code> | `analysis/` 是目录示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 10 行 | <code>  runbooks/</code> | `runbooks/` 是目录示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 11 行 | <code>  incidents/</code> | `incidents/` 是目录示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 12 行 | <code>  rca/</code> | `rca/` 是目录示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 13 行 | <code>  changes/</code> | `changes/` 是目录示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |

目标链路：

1. 启动一个模拟 `order-api`。
2. Prometheus 采集 `http_requests_total` 和延迟直方图。
3. Grafana 展示四个黄金信号。
4. Alertmanager 触发 `OrderApiHighErrorRate`。
5. FastAPI 接收 webhook。
6. Redis 基于 fingerprint 去重。
7. MySQL 保存 incident candidate。
8. Kafka 发布 `alert.received` 事件。
9. pandas 生成 1 小时告警统计。
10. scikit-learn 给异常分数。
11. RAG 检索 `order-api` runbook。
12. OpenAI 生成证据化摘要。
13. 人工审批回滚建议。
14. Ansible 或脚本执行只读检查。
15. Prometheus 验证恢复。
16. RCA 更新 runbook 和告警规则。

## 最小数据模型

### alert_event

```json
{
  "alert_id": "a-001",
  "alertname": "OrderApiHighErrorRate",
  "service": "order-api",
  "severity": "page",
  "starts_at": "2026-07-02T09:10:00Z",
  "labels": {
    "env": "prod",
    "owner": "team-order"
  },
  "annotations": {
    "runbook_url": "runbooks/order-api-high-error-rate.md"
  }
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{</code> | 对象开始，表示下面是一组键值对配置。 |
| 第 2 行 | <code>  "alert_id": "a-001",</code> | `alert_id` 这个英文标识可以拆开理解为：告警，`a-001` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 3 行 | <code>  "alertname": "OrderApiHighErrorRate",</code> | `alertname` 是告警名称字段，`OrderApiHighErrorRate` 是高错误率告警名，表示请求失败比例过高；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 4 行 | <code>  "service": "order-api",</code> | `service` 是服务名称字段，`order-api` 是具体服务名，表示这条记录属于这个服务；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 5 行 | <code>  "severity": "page",</code> | `severity` 是告警严重级别字段，`page` 表示需要立即通知值班人员的告警级别；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 6 行 | <code>  "starts_at": "2026-07-02T09:10:00Z",</code> | `starts_at` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`2026-07-02T09:10:00Z` 表示具体时间值，表示事件、告警或记录发生的时间点；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 7 行 | <code>  "labels": {</code> | `labels` 是标签字段，用来标识告警或指标身份，`{` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 8 行 | <code>    "env": "prod",</code> | `env` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`prod` 表示生产环境；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 9 行 | <code>    "owner": "team-order"</code> | `owner` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`team-order` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 10 行 | <code>  },</code> | 当前对象或数组结束，逗号表示后面还有同级项目。 |
| 第 11 行 | <code>  "annotations": {</code> | `annotations` 是告警补充说明字段，`{` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 12 行 | <code>    "runbook_url": "runbooks/order-api-high-error-rate.md"</code> | `runbook_url` 是故障处理手册链接字段，`runbooks/order-api-high-error-rate.md` 是高错误率告警名，表示请求失败比例过高；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 13 行 | <code>  }</code> | 对象结束，表示这一组键值对配置到这里结束。 |
| 第 14 行 | <code>}</code> | 对象结束，表示这一组键值对配置到这里结束。 |

### incident_candidate

```json
{
  "incident_id": "inc-001",
  "service": "order-api",
  "status": "investigating",
  "alerts": ["a-001"],
  "recent_changes": ["CHG-001"],
  "slo_impact": {
    "burn_rate": 14.4
  }
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{</code> | 对象开始，表示下面是一组键值对配置。 |
| 第 2 行 | <code>  "incident_id": "inc-001",</code> | `incident_id` 这个英文标识可以拆开理解为：线上故障或事件，`inc-001` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 3 行 | <code>  "service": "order-api",</code> | `service` 是服务名称字段，`order-api` 是具体服务名，表示这条记录属于这个服务；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 4 行 | <code>  "status": "investigating",</code> | `status` 是状态字段，`investigating` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 5 行 | <code>  "alerts": ["a-001"],</code> | `alerts` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`["a-001"]` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 6 行 | <code>  "recent_changes": ["CHG-001"],</code> | `recent_changes` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`["CHG-001"]` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 7 行 | <code>  "slo_impact": {</code> | `slo_impact` 这个英文标识可以拆开理解为：服务等级目标，`{` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 8 行 | <code>    "burn_rate": 14.4</code> | `burn_rate` 这个英文标识可以拆开理解为：比率，`14.4` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 9 行 | <code>  }</code> | 对象结束，表示这一组键值对配置到这里结束。 |
| 第 10 行 | <code>}</code> | 对象结束，表示这一组键值对配置到这里结束。 |

### aiops_analysis

```json
{
  "incident_id": "inc-001",
  "summary": "order-api 5xx increased after a recent release.",
  "possible_causes": [],
  "next_checks": [],
  "safe_actions": [],
  "approval_required_actions": [],
  "sources": []
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{</code> | 对象开始，表示下面是一组键值对配置。 |
| 第 2 行 | <code>  "incident_id": "inc-001",</code> | `incident_id` 这个英文标识可以拆开理解为：线上故障或事件，`inc-001` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 3 行 | <code>  "summary": "order-api 5xx increased after a recent release.",</code> | `summary` 是摘要说明字段，`order-api 5xx increased after a recent release.` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 4 行 | <code>  "possible_causes": [],</code> | `possible_causes` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`[]` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 5 行 | <code>  "next_checks": [],</code> | `next_checks` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`[]` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 6 行 | <code>  "safe_actions": [],</code> | `safe_actions` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`[]` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 7 行 | <code>  "approval_required_actions": [],</code> | `approval_required_actions` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`[]` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 8 行 | <code>  "sources": []</code> | `sources` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`[]` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 9 行 | <code>}</code> | 对象结束，表示这一组键值对配置到这里结束。 |

结构化数据越清楚，LLM 和自动化越安全。

## AIOps 成熟度

| 阶段 | 能力 | 目标 |
|---|---|---|
| L0 手工运维 | 人看监控、手工排障 | 知道问题在哪里 |
| L1 可观测 | 指标、日志、链路、告警齐全 | 看得见 |
| L2 规则治理 | SLO、告警分级、runbook | 少而准 |
| L3 数据分析 | pandas、SQL、异常检测 | 找模式 |
| L4 智能辅助 | LLM 摘要、RAG 检索、相似事故 | 辅助人 |
| L5 受控自动化 | 审批下自动执行 | 减少 toil |
| L6 闭环学习 | RCA 反哺规则、模型、runbook | 持续变好 |

建议学习路线：

```text
先做到 L2。
再做 L3。
再做 L4。
谨慎进入 L5。
最后追求 L6。
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>先做到 L2。</code> | 这一行里的英文要这样读：`L2` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源。 |
| 第 2 行 | <code>再做 L3。</code> | 这一行里的英文要这样读：`L3` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源。 |
| 第 3 行 | <code>再做 L4。</code> | 这一行里的英文要这样读：`L4` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源。 |
| 第 4 行 | <code>谨慎进入 L5。</code> | 这一行里的英文要这样读：`L5` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源。 |
| 第 5 行 | <code>最后追求 L6。</code> | 这一行里的英文要这样读：`L6` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源。 |

不要从“全自动修复”开始。

## 衡量 AIOps 是否有效

不要只展示“模型能回答”。

要看结果：

| 指标 | 说明 |
|---|---|
| MTTA | 告警到确认时间 |
| MTTR | 告警到恢复时间 |
| pages per shift | 值班每班 page 数 |
| duplicate alert ratio | 重复告警比例 |
| actionable alert ratio | 可行动告警比例 |
| runbook coverage | page 告警有 runbook 的比例 |
| change correlation coverage | incident 能关联变更的比例 |
| RCA action completion | 复盘行动项完成率 |
| repeat incident rate | 重复事故比例 |
| automation success rate | 自动化成功率 |
| human override rate | 人工否决模型建议比例 |

一个好的 AIOps 项目应该能说明：

```text
它让告警更少了吗？
让定位更快了吗？
让恢复更快了吗？
让重复事故更少了吗？
```
## Guardrails

AIOps 必须有护栏文档。

至少写清楚：

- 数据脱敏规则。
- 权限边界。
- 模型可访问数据范围。
- 哪些动作可自动。
- 哪些动作必须审批。
- 哪些动作禁止自动。
- 审计日志字段。
- 回滚方案。
- 人工 override。
- 失败降级。

示例：

```text
禁止 LLM 直接执行生产回滚。
LLM 只能生成建议。
回滚必须由 IC 审批，并由自动化平台记录执行人、时间、参数和结果。
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>禁止 LLM 直接执行生产回滚。</code> | 这一行里的英文要这样读：`LLM` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源。 |
| 第 2 行 | <code>LLM 只能生成建议。</code> | 这一行里的英文要这样读：`LLM` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源。 |
| 第 3 行 | <code>回滚必须由 IC 审批，并由自动化平台记录执行人、时间、参数和结果。</code> | 这一行里的英文要这样读：`IC` 是Incident Commander，故障指挥官。 |

## 常见失败模式

### 把 AIOps 当成聊天机器人

聊天只是入口。核心是数据、流程、护栏、验证和学习。

### 没有 SLO

没有 SLO，就不知道异常是否真的重要。

### 数据标签混乱

没有 service、owner、env，告警聚类和路由会很弱。

### 没有变更上下文

很多事故和变更有关。没有变更数据，RCA 会慢。

### 直接自动修复

没有审批、验证、回滚的自动化很危险。

### 没有验证恢复

执行动作不等于恢复服务。

### 没有复盘学习

没有 RCA 和行动项，系统不会变聪明。

### 模型输出无证据

没有证据的“根因”只是猜测。

## 入门练习：画出自己的 AIOps 闭环

目录：

```text
projects/aiops-loop-design/
  README.md
  architecture.md
  data-flow.md
  guardrails.md
  incident-example.md
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>projects/aiops-loop-design/</code> | `projects/aiops-loop-design/` 是目录示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 2 行 | <code>  README.md</code> | `README.md` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 3 行 | <code>  architecture.md</code> | `architecture.md` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 4 行 | <code>  data-flow.md</code> | `data-flow.md` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 5 行 | <code>  guardrails.md</code> | `guardrails.md` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 6 行 | <code>  incident-example.md</code> | `incident-example.md` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |

`architecture.md` 必须写：

- 观测数据来源。
- 告警如何进入系统。
- 如何去重和关联。
- 如何关联最近变更。
- 如何检索 runbook。
- LLM 生成什么。
- 哪些动作可自动。
- 哪些动作必须审批。
- 如何验证恢复。
- RCA 如何回写知识库。

`guardrails.md` 必须写：

- 自动动作白名单。
- 审批动作清单。
- 禁止动作清单。
- 审计字段。
- 降级方案。

## 常用对象字典

### alert

告警事件，是 AIOps 闭环入口之一。

### incident candidate

由多个告警、变更、拓扑和时间窗口关联出的事件候选。

### evidence

支持结论的证据，例如指标、日志、变更、runbook、RCA。

### recommendation

下一步检查或动作建议。

### guardrail

安全护栏，例如审批、权限、回滚、审计。

### feedback

人工确认、RCA、行动项、模型评估结果。

## 面试怎么讲

AIOps 不是单个工具，而是一条从观测到行动再到学习的工程闭环。它先收集指标、日志、链路、告警、变更、runbook 和 RCA；再通过 SLO、规则和异常检测发现问题；随后把告警、拓扑、时间窗口和最近变更关联成 incident candidate；再用 RAG、历史事故和 LLM 生成带证据的摘要、候选原因和下一步建议；最后在权限、审批、审计和回滚护栏下执行动作，并用 SLI/SLO 验证恢复。

我会特别强调边界：LLM 适合总结、解释、检索、生成建议和状态更新草稿，不应该无审批执行高风险生产动作。真正的闭环来自学习层，每次 incident 和 RCA 都要更新告警规则、runbook、变更门禁、异常检测特征和知识库，这样系统才会越用越好。

## 学习检查清单

- [ ] 我能画出 AIOps 从观测到学习的闭环。
- [ ] 我能说明每一层的输入和输出。
- [ ] 我能区分检测、关联、解释、建议、行动、验证、学习。
- [ ] 我能说明 SLO 在 AIOps 中的作用。
- [ ] 我能说明 LLM 的安全边界。
- [ ] 我能设计最小 AIOps 项目切片。
- [ ] 我能写 incident candidate 数据模型。
- [ ] 我能写 guardrails 文档。
- [ ] 我能说明如何验证自动化动作是否成功。
- [ ] 我能说明 RCA 如何反哺知识库。
- [ ] 我能列出衡量 AIOps 有效性的指标。

## 面试题

1. AIOps 闭环包含哪些阶段？
2. 为什么 AIOps 不能等同于机器学习模型？
3. 为什么 AIOps 不能等同于聊天机器人？
4. 指标、日志、链路、告警、变更分别提供什么信息？
5. 告警降噪和根因分析有什么区别？
6. RAG 在 AIOps 中属于哪一层？
7. LLM 在 AIOps 中适合做什么？
8. 自动化修复为什么需要审批、验证和回滚？
9. 什么是 incident candidate？
10. 如何证明 AIOps 项目真的改善了运维效率？
11. RCA 如何让 AIOps 形成闭环？
12. 一个从 0 到 1 的 AIOps 作品集应该包含什么？

## 学习证据

学完后，在 GitHub 留下这些证据：

- 一张 AIOps 架构图或文字数据流。
- 一份最小闭环项目说明。
- 一份 `guardrails.md`。
- 一个 `incident-example.md`。
- 一个 alert -> incident candidate -> analysis 的数据样例。
- 一次模拟告警从触发到 RCA 的完整记录。
- README 说明如何衡量这个 AIOps 闭环是否有效。
