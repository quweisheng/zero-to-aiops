# 06：SRE 与 AIOps 实践技术栈

SRE/AIOps 实践不是某个软件，而是一套把稳定性目标、监控、告警、事件响应、自动化和复盘连接起来的方法。工具只是手段，最后要回答：系统是否更稳定？人是否更省力？故障是否更快发现和恢复？

## SLI / SLO / SLA

### 是什么

- SLI：Service Level Indicator，服务水平指标，例如可用性、延迟、错误率。
- SLO：Service Level Objective，服务水平目标，例如 99.9% 可用性。
- SLA：Service Level Agreement，服务水平协议，通常面向客户和合同。

### 原理

先定义用户真正关心的可靠性指标，再给出目标值。目标值不是越高越好，而是要平衡成本、用户体验和工程投入。

### 架构

```text
user journey
  -> choose SLI
  -> define SLO
  -> monitor error budget
  -> guide release / reliability work
```

### 在 AIOps 中的作用

- 判断告警是否有业务意义。
- 异常检测结果要尽量绑定 SLO 影响。
- 告警优先级可以根据 SLO 风险排序。

### 配置重点

示例：

```text
服务：订单 API
SLI：5xx 错误率
SLO：30 天内 99.9% 请求成功
告警：5 分钟错误率 > 2%，且 QPS > 100
```

### 入门练习

给一个 demo 服务定义 3 个 SLI：

- 可用性
- P95 延迟
- 错误率

再写出一个合理 SLO。

### 官方资料

- [Google SRE Books](https://sre.google/books/)

## 告警治理

### 是什么

告警治理是让告警变少、变准、变有行动价值的过程。

### 原理

好的告警应该指向用户影响或明确处理动作。只告诉你“CPU 高了”的告警不一定有价值；如果 CPU 高导致错误率上升或延迟变高，才更值得立即处理。

### 架构

```text
raw signals
  -> alert rules
  -> grouping / dedupe / inhibition
  -> incident event
  -> runbook
  -> review and tune
```

### 在 AIOps 中的作用

告警治理是 AIOps 最适合入门的场景。它有清晰输入和输出，能直接体现价值。

### 配置重点

每条告警都要写清：

- 为什么要告警？
- 谁处理？
- 多久处理？
- 处理步骤在哪？
- 误报如何复盘？

Prometheus 告警示例：

```yaml
groups:
  - name: demo.rules
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.02
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High 5xx error rate"
          runbook: "docs/runbooks/high-error-rate.md"
```

### 入门练习

拿 5 条你见过的告警，判断它们是否可行动：

```text
告警名：
用户影响：
处理人：
处理动作：
是否需要改造：
```

## 事件响应

### 是什么

事件响应是故障发生后的组织和技术处理流程，包括发现、分级、通知、定位、缓解、恢复、复盘。

### 原理

事件响应把混乱变成流程。严重故障时，最重要的是明确角色、保持沟通、快速缓解用户影响，而不是一群人同时乱查。

### 架构

```text
detection
  -> triage
  -> severity
  -> incident commander
  -> mitigation
  -> resolution
  -> postmortem
```

角色：

- Incident Commander：指挥协调。
- Operations Lead：技术排障。
- Communications Lead：对外/对内沟通。
- Scribe：记录时间线。

### 在 AIOps 中的作用

- AIOps 可以自动生成事件摘要。
- 可以聚合相关告警。
- 可以推荐 runbook。
- 可以生成时间线初稿。

### 配置重点

事件记录字段：

```text
事件编号：
开始时间：
发现方式：
影响范围：
严重等级：
关键时间线：
缓解动作：
根因：
后续行动：
```

### 入门练习

把一次历史故障改写成事件响应记录，重点写时间线。

## Runbook

### 是什么

Runbook 是故障处理手册。它把排查和处理步骤写清楚，让不同人能按一致方式处理。

### 原理

Runbook 把经验外化。它应该清楚说明适用场景、前置检查、执行步骤、验证方式、风险和回滚。

### 架构

```text
alert
  -> match runbook
  -> pre-checks
  -> diagnostic steps
  -> mitigation steps
  -> validation
  -> rollback
```

### 在 AIOps 中的作用

- LLM 可以基于 runbook 推荐处理步骤。
- 自动化可以执行低风险步骤。
- RAG 可以用 runbook 做知识库。

### 配置重点

Runbook 模板：

```md
# Runbook: 高错误率

## 适用场景
服务 5xx 错误率持续升高。

## 前置检查
- 最近是否发布？
- 下游依赖是否异常？
- 错误日志集中在哪个接口？

## 处理步骤
1. 查看错误率和 QPS。
2. 查看最近发布。
3. 查看错误日志。
4. 判断是否回滚。

## 风险
回滚可能影响新功能。

## 回滚
执行上一版本发布流程。
```

### 入门练习

为“磁盘满”“接口高错误率”“服务无法启动”各写一份 runbook。

## 根因分析 RCA

### 是什么

RCA 是 Root Cause Analysis，根因分析。它不是事后找人背锅，而是找出系统为什么允许故障发生，并改进系统。

### 原理

RCA 要基于证据：指标、日志、链路、变更、配置、代码、操作记录。一个故障可能有直接原因和深层原因。

### 架构

```text
incident evidence
  -> timeline
  -> contributing factors
  -> root cause hypotheses
  -> validation
  -> corrective actions
```

### 在 AIOps 中的作用

- 帮助聚合证据。
- 给出可能线索。
- 关联最近变更。
- 推荐相似历史事故。

### 配置重点

RCA 记录要包含：

- 事实，不写猜测。
- 时间线。
- 直接原因。
- 促成因素。
- 为什么监控没提前发现。
- 后续改进项。

### 入门练习

用“五个为什么”分析一次故障，但每个“为什么”都必须有证据。

## 变更管理

### 是什么

变更管理是对发布、配置修改、扩容、架构调整等生产变更进行记录、审批、执行和回滚管理。

### 原理

很多故障来自变更。只要把变更记录和告警、日志、指标放在一起，就能显著提升根因判断效率。

### 架构

```text
change request
  -> review / approval
  -> deploy / execute
  -> monitor
  -> rollback if needed
  -> change record
```

### 在 AIOps 中的作用

- 告警发生时自动提示最近变更。
- 根因分析优先检查变更窗口。
- 自动化动作要记录为变更。

### 配置重点

变更记录字段：

```text
变更时间：
服务：
版本：
执行人：
变更内容：
风险等级：
回滚方案：
关联告警：
```

### 入门练习

给 demo app 做一次“模拟发布记录”，然后制造一条错误率告警，手工关联“发布后 10 分钟错误率升高”。

## AIOps 闭环

### 是什么

AIOps 闭环是从数据到动作再到复盘的完整流程。

### 原理

AIOps 不只要发现异常，还要把异常变成事件，把事件变成建议，把建议变成安全动作，把动作效果反馈到规则和模型。

### 架构

```text
telemetry data
  -> anomaly detection
  -> alert correlation
  -> incident enrichment
  -> runbook recommendation
  -> human approval / automation
  -> verification
  -> postmortem
  -> model/rule improvement
```

### 配置重点

第一阶段闭环不要太大：

```text
Prometheus 指标
  -> 告警规则
  -> Alertmanager webhook
  -> Python 服务生成摘要
  -> 推荐 runbook
  -> 人工确认
  -> GitHub 记录复盘
```

### 入门练习

做一个最小 AIOps demo：

1. 用 CSV 模拟指标。
2. Python 检测异常。
3. 输出告警摘要。
4. 匹配 runbook。
5. 写入 Markdown 事件记录。

### 学习证据

- `projects/mini-aiops-loop/`
- `docs/runbooks/`
- `docs/incidents/`
- 项目 README：架构图、输入、输出、限制、下一步。
