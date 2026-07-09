# Runbook Automation

> 目标：能把人工故障处理手册设计成可执行、可审批、可验证、可审计、可回滚的自动化流程，并知道哪些动作只能“辅助诊断”，哪些动作可以“人工确认后执行”，哪些动作才适合“自动修复”。

## 官方资料

Runbook Automation 没有一个唯一标准实现。本文主要参考 AWS、Azure、Google SRE 和 Ansible 的官方资料，抽象出通用方法：

- [AWS Systems Manager Automation](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-automation.html)
- [AWS Systems Manager: Creating your own runbooks](https://docs.aws.amazon.com/systems-manager/latest/userguide/automation-documents.html)
- [AWS Systems Manager: Authoring Automation runbooks](https://docs.aws.amazon.com/systems-manager/latest/userguide/automation-authoring-runbooks.html)
- [AWS Incident Manager: Integrating Automation runbooks](https://docs.aws.amazon.com/incident-manager/latest/userguide/runbooks.html)
- [Azure Automation documentation](https://learn.microsoft.com/en-us/azure/automation/)
- [Azure Automation runbook execution](https://learn.microsoft.com/en-us/azure/automation/automation-runbook-execution)
- [Azure Automation runbook types](https://learn.microsoft.com/en-us/azure/automation/automation-runbook-types)
- [Google SRE Incident Management Guide](https://sre.google/resources/practices-and-processes/incident-management-guide/)
- [Google SRE Book: Managing Incidents](https://sre.google/sre-book/managing-incidents/)
- [Google SRE Workbook: On-call](https://sre.google/workbook/on-call/)
- [Ansible playbooks](https://docs.ansible.com/projects/ansible/latest/playbook_guide/playbooks_intro.html)

说明：本文是基于以上资料整理的原创中文教程，不复制官方全文。

## 场景开场

告警来了：

```text
HighErrorRate
service=checkout-api
environment=production
error_rate=12%
started_at=2026-07-02T10:20:00Z
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>HighErrorRate</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>service=checkout-api</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>environment=production</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>error_rate=12%</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>started_at=2026-07-02T10:20:00Z</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


老同事可能脑子里有一套流程：

```text
先看最近是否发布
再看是所有实例都报错还是新版本实例报错
再看日志里有没有同一种异常
如果是新版本导致，先回滚
如果是下游超时，先降级或扩容
如果只是单个实例异常，先摘流量再重启
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>先看最近是否发布</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>再看是所有实例都报错还是新版本实例报错</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>再看日志里有没有同一种异常</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>如果是新版本导致，先回滚</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>如果是下游超时，先降级或扩容</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 6 行 | <code>如果只是单个实例异常，先摘流量再重启</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


新人面对同一个告警，可能只能问：“这个怎么查？”

Runbook Automation 要做的，不是一上来就让系统“自动修生产”，而是把老同事脑子里的流程拆成机器可执行、可审批、可验证的步骤。

第一步通常不是修复，而是自动收集上下文：

```text
告警详情
最近部署
相关指标
相关日志
受影响实例
下游依赖状态
可选 runbook
风险等级
下一步建议
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>告警详情</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>最近部署</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>相关指标</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>相关日志</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>受影响实例</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 6 行 | <code>下游依赖状态</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 7 行 | <code>可选 runbook</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 8 行 | <code>风险等级</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 9 行 | <code>下一步建议</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


这就是 AIOps 从“发现问题”走向“辅助处理”的桥梁。

## 一句话人话版

Runbook Automation 是把故障处理手册变成自动化工作流：事件触发后，系统按预定义步骤收集信息、判断风险、执行检查、请求审批、运行动作、验证结果、记录审计，必要时回滚或交给人工。

## 小白可能会问

- Runbook、Playbook、Automation workflow 是不是一回事？
- 为什么不能让系统自动重启所有生产服务？
- 一个 runbook 应该写哪些字段？
- 输入参数、前置检查、验证、回滚为什么必须写？
- 幂等性是什么意思？为什么 runbook 被中断后重新执行会出问题？
- 告警 labels 如何映射到 runbook？
- LLM 在 runbook automation 里能做什么，不能做什么？
- 自动化执行失败怎么办？
- 审计日志要记录什么？

## 官方知识地图

Runbook Automation 可以按这棵树理解：

```text
Runbook Automation
  -> Incident response foundation
     -> alert
     -> on-call
     -> playbook / runbook
     -> incident role
     -> communication
     -> escalation
  -> Runbook definition
     -> metadata
     -> owner
     -> trigger
     -> input parameters
     -> preconditions
     -> steps
     -> actions
     -> outputs
     -> decision rules
     -> verification
     -> rollback
     -> audit
  -> Execution engine
     -> script
     -> Ansible
     -> GitHub Actions
     -> AWS Systems Manager Automation
     -> Azure Automation
     -> Kubernetes Job
  -> Safety control
     -> risk level
     -> approval
     -> least privilege
     -> rate limit
     -> concurrency
     -> idempotency
     -> timeout
     -> dry run
  -> AIOps integration
     -> Alertmanager / CloudWatch / EventBridge
     -> Prometheus
     -> Loki / Elasticsearch
     -> deployment history
     -> incident ticket
     -> LLM summary
     -> action recommendation
  -> Evidence
     -> execution record
     -> logs
     -> parameters
     -> commands
     -> result
     -> verification
     -> rollback result
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Runbook Automation</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; Incident response foundation</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>     -&gt; alert</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>     -&gt; on-call</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>     -&gt; playbook / runbook</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 6 行 | <code>     -&gt; incident role</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 7 行 | <code>     -&gt; communication</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 8 行 | <code>     -&gt; escalation</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 9 行 | <code>  -&gt; Runbook definition</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 10 行 | <code>     -&gt; metadata</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 11 行 | <code>     -&gt; owner</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 12 行 | <code>     -&gt; trigger</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 13 行 | <code>     -&gt; input parameters</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 14 行 | <code>     -&gt; preconditions</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 15 行 | <code>     -&gt; steps</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 16 行 | <code>     -&gt; actions</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 17 行 | <code>     -&gt; outputs</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 18 行 | <code>     -&gt; decision rules</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 19 行 | <code>     -&gt; verification</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 20 行 | <code>     -&gt; rollback</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 21 行 | <code>     -&gt; audit</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 22 行 | <code>  -&gt; Execution engine</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 23 行 | <code>     -&gt; script</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 24 行 | <code>     -&gt; Ansible</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 25 行 | <code>     -&gt; GitHub Actions</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 26 行 | <code>     -&gt; AWS Systems Manager Automation</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 27 行 | <code>     -&gt; Azure Automation</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 28 行 | <code>     -&gt; Kubernetes Job</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 29 行 | <code>  -&gt; Safety control</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 30 行 | <code>     -&gt; risk level</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 31 行 | <code>     -&gt; approval</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 32 行 | <code>     -&gt; least privilege</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 33 行 | <code>     -&gt; rate limit</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 34 行 | <code>     -&gt; concurrency</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 35 行 | <code>     -&gt; idempotency</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 36 行 | <code>     -&gt; timeout</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 37 行 | <code>     -&gt; dry run</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 38 行 | <code>  -&gt; AIOps integration</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 39 行 | <code>     -&gt; Alertmanager / CloudWatch / EventBridge</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 40 行 | <code>     -&gt; Prometheus</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 41 行 | <code>     -&gt; Loki / Elasticsearch</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 42 行 | <code>     -&gt; deployment history</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 43 行 | <code>     -&gt; incident ticket</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 44 行 | <code>     -&gt; LLM summary</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 45 行 | <code>     -&gt; action recommendation</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 46 行 | <code>  -&gt; Evidence</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 47 行 | <code>     -&gt; execution record</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 48 行 | <code>     -&gt; logs</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 49 行 | <code>     -&gt; parameters</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 50 行 | <code>     -&gt; commands</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 51 行 | <code>     -&gt; result</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 52 行 | <code>     -&gt; verification</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 53 行 | <code>     -&gt; rollback result</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


最小执行链路：

```text
Alert / Event
  -> parse labels
  -> select runbook
  -> collect context
  -> run pre-checks
  -> classify risk
  -> execute safe steps or request approval
  -> verify impact
  -> record audit
  -> escalate or close
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Alert / Event</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; parse labels</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; select runbook</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>  -&gt; collect context</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>  -&gt; run pre-checks</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 6 行 | <code>  -&gt; classify risk</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 7 行 | <code>  -&gt; execute safe steps or request approval</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 8 行 | <code>  -&gt; verify impact</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 9 行 | <code>  -&gt; record audit</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 10 行 | <code>  -&gt; escalate or close</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


## Runbook Automation 在 AIOps 链路中的位置

AIOps 闭环可以这样看：

```text
Detect
  -> 告警、异常检测、SLO burn

Diagnose
  -> 指标、日志、trace、变更关联、根因候选

Decide
  -> 选择 runbook、判断风险、确认动作

Act
  -> 执行检查、重启、扩容、回滚、降级、通知

Verify
  -> 检查错误率、延迟、SLO、日志、用户影响

Learn
  -> 记录审计、复盘、更新 runbook
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Detect</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; 告警、异常检测、SLO burn</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 4 行 | <code>Diagnose</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>  -&gt; 指标、日志、trace、变更关联、根因候选</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 6 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 7 行 | <code>Decide</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 8 行 | <code>  -&gt; 选择 runbook、判断风险、确认动作</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 9 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 10 行 | <code>Act</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 11 行 | <code>  -&gt; 执行检查、重启、扩容、回滚、降级、通知</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 12 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 13 行 | <code>Verify</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 14 行 | <code>  -&gt; 检查错误率、延迟、SLO、日志、用户影响</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 15 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 16 行 | <code>Learn</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 17 行 | <code>  -&gt; 记录审计、复盘、更新 runbook</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


Runbook Automation 覆盖的是 `Decide -> Act -> Verify`，但它也依赖前面的 Detect 和 Diagnose。

没有 runbook 的 AIOps 很容易变成：

```text
模型说了一堆建议，但没人敢执行
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>模型说了一堆建议，但没人敢执行</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


有 runbook 的 AIOps 才能变成：

```text
模型或规则推荐一个经过评审的流程
流程先收集证据
低风险步骤自动执行
高风险步骤等待人工确认
执行后自动验证
所有过程可审计
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>模型或规则推荐一个经过评审的流程</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>流程先收集证据</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>低风险步骤自动执行</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>高风险步骤等待人工确认</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>执行后自动验证</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 6 行 | <code>所有过程可审计</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


## Runbook、Playbook、Automation

这些词经常混用，可以先这样区分：

| 名称 | 重点 | 例子 |
|---|---|---|
| Runbook | 针对某类操作或故障的步骤手册 | “磁盘满怎么处理” |
| Playbook | 更偏事故响应和团队协作的流程 | “P1 事故如何拉群、分工、沟通” |
| Automation workflow | 可以被机器执行的流程 | AWS Automation runbook、GitHub Actions workflow |
| Script | 某个具体动作的代码 | `collect_logs.sh` |
| Ansible playbook | 用 Ansible 描述配置/操作步骤 | 重启服务、下发配置 |

本文把 Runbook Automation 定义为：

```text
用结构化 runbook 描述故障处理流程，
再用脚本、Ansible、云厂商自动化或 CI/CD runner 执行其中一部分或全部步骤。
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>用结构化 runbook 描述故障处理流程，</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>再用脚本、Ansible、云厂商自动化或 CI/CD runner 执行其中一部分或全部步骤。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


## Runbook Automation 是什么

它不是“自动删除、自动重启、自动回滚”的代名词。

更准确地说，它是一个受控执行系统：

1. 有清晰触发条件。
2. 有输入参数。
3. 有前置检查。
4. 有风险分级。
5. 有权限边界。
6. 有可执行步骤。
7. 有人工审批点。
8. 有验证方式。
9. 有回滚或停止策略。
10. 有审计记录。

AWS Systems Manager Automation 的官方模型很典型：runbook 里有参数、步骤、动作和输出；步骤按顺序执行；每个步骤关联一个动作；动作决定输入、行为和输出。

Azure Automation 的文档也强调：一次 runbook 执行会创建一个 job；如果 runbook 被中断，可能从头开始，因此 runbook 要能支持重新运行。

这两个点非常重要：

```text
runbook automation = workflow + parameters + steps + actions + outputs + execution record
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>runbook automation = workflow + parameters + steps + actions + outputs + execution record</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


## 它解决什么问题

| 问题 | Runbook Automation 如何解决 |
|---|---|
| 新人不知道怎么处理告警 | 自动推荐 runbook 和下一步 |
| 老员工经验在脑子里 | 转成结构化步骤 |
| 每次排查都手工复制命令 | 自动收集上下文 |
| 命令执行没记录 | 保存执行日志和参数 |
| 高风险动作误执行 | 增加审批和权限边界 |
| 修复后没人验证 | 把验证写成步骤 |
| 故障后无法复盘 | 保留审计和证据 |
| 告警很多处理慢 | 低风险检查自动化 |
| 多系统联动复杂 | 统一编排 Prometheus、日志、部署记录、脚本 |

## 核心执行模型

通用模型：

```text
Trigger
  -> Input normalization
  -> Context enrichment
  -> Runbook selection
  -> Pre-check
  -> Risk classification
  -> Approval if needed
  -> Execute steps
  -> Verify
  -> Audit
  -> Escalate / rollback / close
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Trigger</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; Input normalization</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; Context enrichment</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>  -&gt; Runbook selection</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>  -&gt; Pre-check</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 6 行 | <code>  -&gt; Risk classification</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 7 行 | <code>  -&gt; Approval if needed</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 8 行 | <code>  -&gt; Execute steps</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 9 行 | <code>  -&gt; Verify</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 10 行 | <code>  -&gt; Audit</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 11 行 | <code>  -&gt; Escalate / rollback / close</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


### Trigger

触发来源：

| 来源 | 例子 |
|---|---|
| Alert | Alertmanager webhook、CloudWatch alarm |
| Event | EventBridge、GitHub deployment event |
| Manual | GitHub Actions `workflow_dispatch`、控制台按钮 |
| Schedule | 定时巡检 |
| Ticket | Incident、Issue、工单 |
| API | 外部系统调用 runbook service |

初学推荐从手动触发开始，再接告警。

原因：手动触发可控，出错风险低。

### Input normalization

不同告警系统字段不一样，要先统一。

示例输入：

```json
{
  "alertname": "HighErrorRate",
  "service": "checkout-api",
  "environment": "production",
  "severity": "critical",
  "instance": "checkout-api-7d9f",
  "started_at": "2026-07-02T10:20:00Z"
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{</code> | 对象开始，表示下面是一组键值对配置。 |
| 第 2 行 | <code>  "alertname": "HighErrorRate",</code> | 设置 `alertname` 字段，值是 `"HighErrorRate"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 3 行 | <code>  "service": "checkout-api",</code> | 设置 `service` 字段，值是 `"checkout-api"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 4 行 | <code>  "environment": "production",</code> | 设置 `environment` 字段，值是 `"production"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 5 行 | <code>  "severity": "critical",</code> | 设置 `severity` 字段，值是 `"critical"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 6 行 | <code>  "instance": "checkout-api-7d9f",</code> | 设置 `instance` 字段，值是 `"checkout-api-7d9f"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 7 行 | <code>  "started_at": "2026-07-02T10:20:00Z"</code> | 设置 `started_at` 字段，值是 `"2026-07-02T10:20:00Z"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 8 行 | <code>}</code> | 对象结束，表示这一组键值对配置到这里结束。 |


统一后 runbook 只关心标准字段：

| 字段 | 意思 |
|---|---|
| `alertname` | 告警名 |
| `service` | 服务 |
| `environment` | 环境 |
| `severity` | 严重级别 |
| `instance` | 实例 |
| `started_at` | 开始时间 |

### Context enrichment

上下文补全：

```text
alert labels
  + Prometheus 指标
  + Loki/Elasticsearch 日志
  + 最近部署
  + Kubernetes Pod 状态
  + GitHub Actions run
  + 相关历史事故
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>alert labels</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  + Prometheus 指标</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>  + Loki/Elasticsearch 日志</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>  + 最近部署</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>  + Kubernetes Pod 状态</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 6 行 | <code>  + GitHub Actions run</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 7 行 | <code>  + 相关历史事故</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


这一步通常最有价值，因为很多故障不需要立刻修，先要看清楚。

### Runbook selection

选择 runbook 的方式：

| 方式 | 适合 |
|---|---|
| alertname 精确匹配 | 初学、规则稳定 |
| labels 规则匹配 | 多服务共用 |
| service + symptom 匹配 | AIOps 场景 |
| LLM 辅助推荐 | 文档很多、描述复杂 |
| 人工选择 | 高风险事故 |

例子：

```text
alertname=HighDiskUsage
  -> runbooks/disk-high-usage.md

alertname=HighErrorRate and service=checkout-api
  -> runbooks/high-error-rate-web-service.md

alertname=KubePodCrashLooping
  -> runbooks/kubernetes-crashloop.md
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>alertname=HighDiskUsage</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; runbooks/disk-high-usage.md</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 4 行 | <code>alertname=HighErrorRate and service=checkout-api</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>  -&gt; runbooks/high-error-rate-web-service.md</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 6 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 7 行 | <code>alertname=KubePodCrashLooping</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 8 行 | <code>  -&gt; runbooks/kubernetes-crashloop.md</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


### Risk classification

每一步都要分风险：

| 等级 | 动作 | 例子 |
|---|---|---|
| Low | 可自动执行 | 读取指标、查询日志、生成摘要 |
| Medium | 可人工确认后执行 | 重启单个非核心实例、清理临时目录 |
| High | 必须审批和双人确认 | 生产回滚、扩容核心资源、执行数据库变更 |
| Forbidden | 不允许自动化 | 删除业务数据、无备份清库、绕过审计 |

风险不是固定的，要看环境。

同样是重启：

```text
重启 dev 环境测试服务 -> Low
重启 production 单个无状态实例 -> Medium
重启 production 数据库主节点 -> High 或 Forbidden
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>重启 dev 环境测试服务 -&gt; Low</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 2 行 | <code>重启 production 单个无状态实例 -&gt; Medium</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>重启 production 数据库主节点 -&gt; High 或 Forbidden</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


## 自动化分级

### L0：只记录

系统只记录事件，不做建议。

适合刚开始建设。

输出：

- 告警 JSON。
- 时间。
- 服务。
- severity。

### L1：自动摘要

系统自动收集上下文并生成摘要。

适合：

- 新人值班。
- 告警降噪。
- 事故初期。

输出：

- 最近部署。
- 当前指标。
- 错误日志 TopN。
- 受影响实例。
- 建议查看的 dashboard。

### L2：推荐 runbook

系统推荐处理手册，但不执行动作。

适合：

- runbook 已经比较完整。
- 告警标签规范。
- 团队还没有建立自动执行信任。

### L3：人工确认后执行

系统执行低到中风险动作，但必须有人确认。

例子：

- 收集完整日志包。
- 重启单个无状态 Pod。
- 清理明确安全的临时文件。
- 扩容 worker 数量。

### L4：自动执行

系统自动执行动作。

只适合满足这些条件的动作：

- 风险低。
- 幂等。
- 可验证。
- 可回滚或可停止。
- 影响范围小。
- 已经多次演练。
- 有速率限制。
- 有审计。

例子：

- 自动创建诊断报告。
- 自动重新运行失败的非生产批任务。
- 自动清理超过保留期的临时文件。
- 自动扩容低风险无状态 worker。

## Runbook 结构

一个可自动化的 runbook 不能只写“重启服务试试”。

推荐结构：

```text
title
owner
version
last_reviewed
risk_level
supported_environments
trigger
inputs
preconditions
context_to_collect
decision_rules
steps
approval_required
verification
rollback
stop_conditions
forbidden_actions
audit_fields
related_dashboards
related_docs
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>title</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>owner</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>version</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>last_reviewed</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>risk_level</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 6 行 | <code>supported_environments</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 7 行 | <code>trigger</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 8 行 | <code>inputs</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 9 行 | <code>preconditions</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 10 行 | <code>context_to_collect</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 11 行 | <code>decision_rules</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 12 行 | <code>steps</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 13 行 | <code>approval_required</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 14 行 | <code>verification</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 15 行 | <code>rollback</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 16 行 | <code>stop_conditions</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 17 行 | <code>forbidden_actions</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 18 行 | <code>audit_fields</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 19 行 | <code>related_dashboards</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 20 行 | <code>related_docs</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


示例模板：

````md
# Runbook: High Error Rate

## Metadata

- owner: sre-team
- version: 1.0
- last_reviewed: 2026-07-02
- risk_level: medium
- supported_environments: staging, production

## Trigger

- alertname: HighErrorRate
- severity: warning or critical

## Inputs

- service
- environment
- started_at
- error_rate

## Preconditions

- service label must exist
- environment must be staging or production
- caller must have incident responder role

## Context To Collect

1. Recent deployments in the last 60 minutes.
2. Error rate and latency for the service.
3. Top error logs.
4. Pod restart count.
5. Downstream dependency status.

## Decision Rules

1. If error starts within 10 minutes after deployment, prefer rollback investigation.
2. If only one instance is affected, isolate or restart that instance.
3. If all instances are affected and no deployment happened, check downstream dependencies.

## Steps

1. Generate incident summary.
2. Attach metrics and logs.
3. Recommend next action.
4. Request approval before any production-changing action.

## Verification

- error rate returns below threshold
- p95 latency returns to normal
- no new critical alerts

## Rollback

- rollback latest deployment if deployment-related
- stop automation if verification fails twice

## Forbidden Actions

- Do not delete production data.
- Do not restart all production instances at once.
- Do not run database migration automatically.
````

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code># Runbook: High Error Rate</code> | Markdown 标题行，用来组织文档层级。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 3 行 | <code>## Metadata</code> | Markdown 标题行，用来组织文档层级。 |
| 第 4 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 5 行 | <code>- owner: sre-team</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 6 行 | <code>- version: 1.0</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 7 行 | <code>- last_reviewed: 2026-07-02</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 8 行 | <code>- risk_level: medium</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 9 行 | <code>- supported_environments: staging, production</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 10 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 11 行 | <code>## Trigger</code> | Markdown 标题行，用来组织文档层级。 |
| 第 12 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 13 行 | <code>- alertname: HighErrorRate</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 14 行 | <code>- severity: warning or critical</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 15 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 16 行 | <code>## Inputs</code> | Markdown 标题行，用来组织文档层级。 |
| 第 17 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 18 行 | <code>- service</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 19 行 | <code>- environment</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 20 行 | <code>- started_at</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 21 行 | <code>- error_rate</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 22 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 23 行 | <code>## Preconditions</code> | Markdown 标题行，用来组织文档层级。 |
| 第 24 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 25 行 | <code>- service label must exist</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 26 行 | <code>- environment must be staging or production</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 27 行 | <code>- caller must have incident responder role</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 28 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 29 行 | <code>## Context To Collect</code> | Markdown 标题行，用来组织文档层级。 |
| 第 30 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 31 行 | <code>1. Recent deployments in the last 60 minutes.</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 32 行 | <code>2. Error rate and latency for the service.</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 33 行 | <code>3. Top error logs.</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 34 行 | <code>4. Pod restart count.</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 35 行 | <code>5. Downstream dependency status.</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 36 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 37 行 | <code>## Decision Rules</code> | Markdown 标题行，用来组织文档层级。 |
| 第 38 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 39 行 | <code>1. If error starts within 10 minutes after deployment, prefer rollback investigation.</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 40 行 | <code>2. If only one instance is affected, isolate or restart that instance.</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 41 行 | <code>3. If all instances are affected and no deployment happened, check downstream dependencies.</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 42 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 43 行 | <code>## Steps</code> | Markdown 标题行，用来组织文档层级。 |
| 第 44 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 45 行 | <code>1. Generate incident summary.</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 46 行 | <code>2. Attach metrics and logs.</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 47 行 | <code>3. Recommend next action.</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 48 行 | <code>4. Request approval before any production-changing action.</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 49 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 50 行 | <code>## Verification</code> | Markdown 标题行，用来组织文档层级。 |
| 第 51 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 52 行 | <code>- error rate returns below threshold</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 53 行 | <code>- p95 latency returns to normal</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 54 行 | <code>- no new critical alerts</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 55 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 56 行 | <code>## Rollback</code> | Markdown 标题行，用来组织文档层级。 |
| 第 57 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 58 行 | <code>- rollback latest deployment if deployment-related</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 59 行 | <code>- stop automation if verification fails twice</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 60 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 61 行 | <code>## Forbidden Actions</code> | Markdown 标题行，用来组织文档层级。 |
| 第 62 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 63 行 | <code>- Do not delete production data.</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 64 行 | <code>- Do not restart all production instances at once.</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 65 行 | <code>- Do not run database migration automatically.</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |


## 字段深讲

### owner

owner 是 runbook 的负责人。

没有 owner 的 runbook 会腐烂，因为没人更新。

owner 要负责：

- 定期 review。
- 故障后更新。
- 验证步骤是否还有效。
- 确认权限是否仍然合理。

### version

runbook 也要版本化。

因为一次事故执行的是当时的 runbook，不是未来修订后的 runbook。

审计记录应包含：

```text
runbook_id
runbook_version
git_commit
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>runbook_id</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>runbook_version</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>git_commit</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


### inputs

输入参数必须明确。

坏例子：

```text
处理磁盘告警
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>处理磁盘告警</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


好例子：

```text
host: node-1
mount_point: /var
usage_percent: 92
environment: production
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>host: node-1</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>mount_point: /var</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>usage_percent: 92</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>environment: production</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


### preconditions

前置条件决定能不能运行。

例子：

- 目标环境必须是 staging 或 production。
- 告警必须仍然 firing。
- 目标实例必须存在。
- 当前没有另一个同服务 runbook 在运行。
- 执行人必须有权限。

### context_to_collect

上下文收集是低风险高价值动作。

例子：

```text
Prometheus:
  - request error rate
  - p95 latency
  - CPU/memory

Logs:
  - top exceptions
  - recent error messages

Kubernetes:
  - pod status
  - restart count
  - events

GitHub:
  - recent deployments
  - commit SHA
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Prometheus:</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  - request error rate</code> | 列表项，表示一个要点、条件、文件或检查项。 |
| 第 3 行 | <code>  - p95 latency</code> | 列表项，表示一个要点、条件、文件或检查项。 |
| 第 4 行 | <code>  - CPU/memory</code> | 列表项，表示一个要点、条件、文件或检查项。 |
| 第 5 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 6 行 | <code>Logs:</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 7 行 | <code>  - top exceptions</code> | 列表项，表示一个要点、条件、文件或检查项。 |
| 第 8 行 | <code>  - recent error messages</code> | 列表项，表示一个要点、条件、文件或检查项。 |
| 第 9 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 10 行 | <code>Kubernetes:</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 11 行 | <code>  - pod status</code> | 列表项，表示一个要点、条件、文件或检查项。 |
| 第 12 行 | <code>  - restart count</code> | 列表项，表示一个要点、条件、文件或检查项。 |
| 第 13 行 | <code>  - events</code> | 列表项，表示一个要点、条件、文件或检查项。 |
| 第 14 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 15 行 | <code>GitHub:</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 16 行 | <code>  - recent deployments</code> | 列表项，表示一个要点、条件、文件或检查项。 |
| 第 17 行 | <code>  - commit SHA</code> | 列表项，表示一个要点、条件、文件或检查项。 |


### decision_rules

决策规则是 runbook 自动化的核心。

例子：

```text
if recent_deployment and error_rate_started_after_deployment:
  recommend rollback investigation
elif only_one_instance_bad:
  recommend isolate instance
elif dependency_error_in_logs:
  recommend check downstream service
else:
  escalate to human
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>if recent_deployment and error_rate_started_after_deployment:</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  recommend rollback investigation</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>elif only_one_instance_bad:</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>  recommend isolate instance</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>elif dependency_error_in_logs:</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 6 行 | <code>  recommend check downstream service</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 7 行 | <code>else:</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 8 行 | <code>  escalate to human</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


不要把所有判断都丢给 LLM。关键生产动作必须有确定规则和审批。

### verification

执行后必须验证。

验证不是“命令返回 0”。

命令返回 0 只能说明命令执行成功，不代表用户影响恢复。

更好的验证：

- 告警是否 resolved。
- 错误率是否下降。
- 延迟是否恢复。
- Pod 是否 ready。
- 日志是否不再出现同类错误。
- 用户路径是否可用。

### rollback

每个改变状态的动作都要写回滚。

如果不能回滚，要写清楚：

```text
不可自动回滚，必须升级给负责人。
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>不可自动回滚，必须升级给负责人。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


### forbidden_actions

禁止动作必须写得很明确。

例子：

- 不得删除业务数据目录。
- 不得重启数据库主节点。
- 不得在 production 自动执行 schema migration。
- 不得绕过审批。
- 不得在没有备份时执行清理。

## 执行状态

一次 runbook 执行可以叫 execution 或 job。

常见状态：

| 状态 | 意思 |
|---|---|
| queued | 已排队 |
| running | 正在执行 |
| waiting_approval | 等待审批 |
| succeeded | 成功 |
| failed | 失败 |
| timed_out | 超时 |
| cancelled | 被取消 |
| skipped | 条件不满足，跳过 |
| rolled_back | 已回滚 |
| escalated | 已升级人工处理 |

审计里要记录状态变化：

```json
{
  "execution_id": "rb-20260702-102000",
  "runbook": "high-error-rate",
  "status": "waiting_approval",
  "service": "checkout-api",
  "environment": "production",
  "created_at": "2026-07-02T10:20:00Z"
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{</code> | 对象开始，表示下面是一组键值对配置。 |
| 第 2 行 | <code>  "execution_id": "rb-20260702-102000",</code> | 设置 `execution_id` 字段，值是 `"rb-20260702-102000"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 3 行 | <code>  "runbook": "high-error-rate",</code> | 设置 `runbook` 字段，值是 `"high-error-rate"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 4 行 | <code>  "status": "waiting_approval",</code> | 设置 `status` 字段，值是 `"waiting_approval"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 5 行 | <code>  "service": "checkout-api",</code> | 设置 `service` 字段，值是 `"checkout-api"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 6 行 | <code>  "environment": "production",</code> | 设置 `environment` 字段，值是 `"production"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 7 行 | <code>  "created_at": "2026-07-02T10:20:00Z"</code> | 设置 `created_at` 字段，值是 `"2026-07-02T10:20:00Z"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 8 行 | <code>}</code> | 对象结束，表示这一组键值对配置到这里结束。 |


## 幂等性和可重启

幂等性是 runbook automation 的关键。

幂等的意思：

```text
同一个动作执行一次和执行多次，最终状态一样或可接受。
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>同一个动作执行一次和执行多次，最终状态一样或可接受。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


例子：

幂等：

```bash
mkdir -p /tmp/aiops
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>mkdir -p /tmp/aiops</code> | 创建目录，用来准备实验项目结构。 |


不幂等：

```bash
echo "new config" >> /etc/app.conf
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>echo "new config" &gt;&gt; /etc/app.conf</code> | 输出一段文本，常用于写入测试内容或验证变量。 |


第二个每执行一次就追加一行，重复执行会污染配置。

为什么重要？

- Azure Automation 文档提醒，runbook 中断后可能从头开始。
- 网络抖动会导致重试。
- 人可能误点 rerun。
- 自动化平台可能重新调度。

写 runbook 时要问：

```text
如果这一步执行到一半失败，再跑一次会怎样？
如果同一告警触发两次，会不会重复删除、重复扩容、重复重启？
如果前一步成功但记录没写入，下一次如何判断？
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>如果这一步执行到一半失败，再跑一次会怎样？</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>如果同一告警触发两次，会不会重复删除、重复扩容、重复重启？</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>如果前一步成功但记录没写入，下一次如何判断？</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


## 权限和安全边界

Runbook Automation 必须使用最小权限。

### 权限分层

| 角色 | 能做什么 |
|---|---|
| viewer | 查看 runbook 和执行记录 |
| operator | 手动触发低风险 runbook |
| approver | 批准中高风险动作 |
| automation-role | 执行自动化动作 |
| admin | 管理 runbook 和权限 |

### 服务角色

AWS Incident Manager 文档里提到 runbook service role 和 Automation AssumeRole。通用原则是：

```text
触发系统的角色
  !=
真正执行资源操作的角色
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>触发系统的角色</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  !=</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>真正执行资源操作的角色</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


这样可以把权限拆开：

- Incident system 可以启动 runbook。
- Automation role 只能执行特定动作。
- 高风险动作需要额外审批。

### secrets

secrets 不能写进 runbook 文档。

应该来自：

- GitHub Actions secrets。
- cloud secret manager。
- environment secrets。
- workload identity / OIDC。
- vault。

并且要避免打印到日志。

## 触发方式

### Alertmanager webhook

Alertmanager 可以把告警发给 runbook service。

流程：

```text
Prometheus rule fires
  -> Alertmanager
  -> webhook
  -> runbook service
  -> select runbook
  -> generate summary
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Prometheus rule fires</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; Alertmanager</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; webhook</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>  -&gt; runbook service</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>  -&gt; select runbook</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 6 行 | <code>  -&gt; generate summary</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


适合自建 AIOps 实验。

### GitHub Actions manual runbook

低成本实现方式：

```yaml
name: Runbook - collect diagnostics

on:
  workflow_dispatch:
    inputs:
      service:
        required: true
        type: string
      environment:
        required: true
        type: choice
        options:
          - staging
          - production

permissions:
  contents: read

jobs:
  collect:
    runs-on: ubuntu-latest
    steps:
      - run: echo "collect diagnostics for service"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>name: Runbook - collect diagnostics</code> | 设置 `name` 字段的值为 `Runbook - collect diagnostics`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 3 行 | <code>on:</code> | 定义 `on` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>  workflow_dispatch:</code> | 定义 `workflow_dispatch` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 5 行 | <code>    inputs:</code> | 定义 `inputs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 6 行 | <code>      service:</code> | 定义 `service` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 7 行 | <code>        required: true</code> | 设置 `required` 字段的值为 `true`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 8 行 | <code>        type: string</code> | 设置 `type` 字段的值为 `string`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 9 行 | <code>      environment:</code> | 定义 `environment` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 10 行 | <code>        required: true</code> | 设置 `required` 字段的值为 `true`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 11 行 | <code>        type: choice</code> | 设置 `type` 字段的值为 `choice`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 12 行 | <code>        options:</code> | 定义 `options` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 13 行 | <code>          - staging</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 14 行 | <code>          - production</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 15 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 16 行 | <code>permissions:</code> | 定义 `permissions` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 17 行 | <code>  contents: read</code> | 设置 `contents` 字段的值为 `read`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 18 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 19 行 | <code>jobs:</code> | 定义 `jobs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 20 行 | <code>  collect:</code> | 定义 `collect` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 21 行 | <code>    runs-on: ubuntu-latest</code> | 设置 `runs-on` 字段的值为 `ubuntu-latest`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 22 行 | <code>    steps:</code> | 定义 `steps` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 23 行 | <code>      - run: echo "collect diagnostics for service"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |


优点：

- 容易上手。
- 有日志。
- 有手动触发。
- 可接 secrets 和 environment approval。

缺点：

- 不适合复杂交互。
- 长时间任务和内网访问受限制。

### AWS Systems Manager Automation

AWS 的模型：

```text
Automation runbook
  -> parameters
  -> mainSteps
  -> actions
  -> outputs
  -> execution status
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Automation runbook</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; parameters</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; mainSteps</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>  -&gt; actions</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>  -&gt; outputs</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 6 行 | <code>  -&gt; execution status</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


适合 AWS 资源维护、部署和修复。

### Azure Automation

Azure 的模型：

```text
Runbook
  -> job
  -> worker
  -> Azure sandbox or Hybrid Runbook Worker
  -> logs
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Runbook</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; job</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; worker</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>  -&gt; Azure sandbox or Hybrid Runbook Worker</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>  -&gt; logs</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


适合 Azure 和混合环境任务。

## Runbook 引擎选择

| 引擎 | 优点 | 适合 |
|---|---|---|
| Bash/Python script | 简单直接 | 本地实验、上下文收集 |
| Ansible | 幂等、适合多主机 | 配置、服务操作、批量执行 |
| GitHub Actions | 易接 GitHub、日志清晰 | 文档、CI/CD、手动 runbook |
| AWS Systems Manager | AWS 原生、支持 runbook 和审批 | AWS 资源修复 |
| Azure Automation | Azure 原生、PowerShell/Python | Azure 和混合环境 |
| Kubernetes Job | 集群内执行 | K8s 原生诊断任务 |
| FastAPI service | 灵活可扩展 | 自建 AIOps 平台 |

初学路线：

```text
Markdown runbook
  -> Python selector
  -> GitHub Actions 手动触发
  -> Ansible 执行低风险动作
  -> Alertmanager webhook 自动触发摘要
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Markdown runbook</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; Python selector</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; GitHub Actions 手动触发</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>  -&gt; Ansible 执行低风险动作</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>  -&gt; Alertmanager webhook 自动触发摘要</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


## 示例：磁盘使用率高

把示例放在代码块里，避免 Markdown 把 runbook 内部标题当成本文标题。

````md
# Runbook: High Disk Usage

## Metadata

- owner: sre-team
- risk_level: medium
- automation_level: L3

## Trigger

- alertname: HighDiskUsage
- usage_percent > 85

## Inputs

- host
- mount_point
- usage_percent
- environment

## Preconditions

- host must be reachable
- mount_point must not be empty
- environment must not be production unless approved

## Context To Collect

```bash
df -h
df -i
du -xhd1 /var 2>/dev/null | sort -h | tail -20
journalctl --disk-usage
```

## Decision Rules

1. If inode usage is high, investigate many small files.
2. If log directory is high, check log retention.
3. If application data directory is high, escalate to service owner.

## Safe Actions

1. Compress old logs if they are outside active retention.
2. Clean known temporary directory.
3. Rotate logs if logrotate is stuck.

## Approval Required

- production cleanup
- deleting files
- expanding disk

## Forbidden Actions

- Do not delete application data.
- Do not run `rm -rf` on a variable path.
- Do not clean database directories.

## Verification

- `df -h` usage below threshold
- service health check passes
- no new disk alert after 10 minutes

## Rollback

- restore files from backup if deleted incorrectly
- stop automation and escalate if verification fails
````

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code># Runbook: High Disk Usage</code> | Markdown 标题行，用来组织文档层级。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 3 行 | <code>## Metadata</code> | Markdown 标题行，用来组织文档层级。 |
| 第 4 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 5 行 | <code>- owner: sre-team</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 6 行 | <code>- risk_level: medium</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 7 行 | <code>- automation_level: L3</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 8 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 9 行 | <code>## Trigger</code> | Markdown 标题行，用来组织文档层级。 |
| 第 10 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 11 行 | <code>- alertname: HighDiskUsage</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 12 行 | <code>- usage_percent &gt; 85</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 13 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 14 行 | <code>## Inputs</code> | Markdown 标题行，用来组织文档层级。 |
| 第 15 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 16 行 | <code>- host</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 17 行 | <code>- mount_point</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 18 行 | <code>- usage_percent</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 19 行 | <code>- environment</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 20 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 21 行 | <code>## Preconditions</code> | Markdown 标题行，用来组织文档层级。 |
| 第 22 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 23 行 | <code>- host must be reachable</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 24 行 | <code>- mount_point must not be empty</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 25 行 | <code>- environment must not be production unless approved</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 26 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 27 行 | <code>## Context To Collect</code> | Markdown 标题行，用来组织文档层级。 |
| 第 28 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 29 行 | <code>```bash</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 30 行 | <code>df -h</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 31 行 | <code>df -i</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 32 行 | <code>du -xhd1 /var 2&gt;/dev/null &#124; sort -h &#124; tail -20</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 33 行 | <code>journalctl --disk-usage</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 34 行 | <code>```</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 35 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 36 行 | <code>## Decision Rules</code> | Markdown 标题行，用来组织文档层级。 |
| 第 37 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 38 行 | <code>1. If inode usage is high, investigate many small files.</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 39 行 | <code>2. If log directory is high, check log retention.</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 40 行 | <code>3. If application data directory is high, escalate to service owner.</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 41 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 42 行 | <code>## Safe Actions</code> | Markdown 标题行，用来组织文档层级。 |
| 第 43 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 44 行 | <code>1. Compress old logs if they are outside active retention.</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 45 行 | <code>2. Clean known temporary directory.</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 46 行 | <code>3. Rotate logs if logrotate is stuck.</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 47 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 48 行 | <code>## Approval Required</code> | Markdown 标题行，用来组织文档层级。 |
| 第 49 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 50 行 | <code>- production cleanup</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 51 行 | <code>- deleting files</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 52 行 | <code>- expanding disk</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 53 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 54 行 | <code>## Forbidden Actions</code> | Markdown 标题行，用来组织文档层级。 |
| 第 55 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 56 行 | <code>- Do not delete application data.</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 57 行 | <code>- Do not run `rm -rf` on a variable path.</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 58 行 | <code>- Do not clean database directories.</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 59 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 60 行 | <code>## Verification</code> | Markdown 标题行，用来组织文档层级。 |
| 第 61 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 62 行 | <code>- `df -h` usage below threshold</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 63 行 | <code>- service health check passes</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 64 行 | <code>- no new disk alert after 10 minutes</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 65 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 66 行 | <code>## Rollback</code> | Markdown 标题行，用来组织文档层级。 |
| 第 67 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 68 行 | <code>- restore files from backup if deleted incorrectly</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 69 行 | <code>- stop automation and escalate if verification fails</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |


## 示例：高错误率

````md
# Runbook: High Error Rate

## Trigger

- alertname: HighErrorRate
- service label exists
- environment label exists

## Inputs

- service
- environment
- error_rate
- started_at

## Context To Collect

1. Recent deployments in the last 60 minutes.
2. Error rate by version.
3. Top exception messages.
4. Dependency latency and error rate.
5. Kubernetes pod restarts.

## Decision Rules

1. If error rate starts after deployment and only new version is affected, recommend rollback.
2. If all versions are affected and dependency errors appear, check downstream dependency.
3. If only one pod is affected, recommend isolating that pod.
4. If no clear signal, escalate to incident commander.

## Automated Steps

1. Generate summary.
2. Attach dashboard links.
3. Attach recent deployment list.
4. Attach top logs.

## Manual Approval Steps

1. Rollback production deployment.
2. Restart production pods.
3. Disable feature flag.

## Verification

- error rate below threshold
- p95 latency normal
- alert resolved
````

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code># Runbook: High Error Rate</code> | Markdown 标题行，用来组织文档层级。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 3 行 | <code>## Trigger</code> | Markdown 标题行，用来组织文档层级。 |
| 第 4 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 5 行 | <code>- alertname: HighErrorRate</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 6 行 | <code>- service label exists</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 7 行 | <code>- environment label exists</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 8 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 9 行 | <code>## Inputs</code> | Markdown 标题行，用来组织文档层级。 |
| 第 10 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 11 行 | <code>- service</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 12 行 | <code>- environment</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 13 行 | <code>- error_rate</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 14 行 | <code>- started_at</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 15 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 16 行 | <code>## Context To Collect</code> | Markdown 标题行，用来组织文档层级。 |
| 第 17 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 18 行 | <code>1. Recent deployments in the last 60 minutes.</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 19 行 | <code>2. Error rate by version.</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 20 行 | <code>3. Top exception messages.</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 21 行 | <code>4. Dependency latency and error rate.</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 22 行 | <code>5. Kubernetes pod restarts.</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 23 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 24 行 | <code>## Decision Rules</code> | Markdown 标题行，用来组织文档层级。 |
| 第 25 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 26 行 | <code>1. If error rate starts after deployment and only new version is affected, recommend rollback.</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 27 行 | <code>2. If all versions are affected and dependency errors appear, check downstream dependency.</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 28 行 | <code>3. If only one pod is affected, recommend isolating that pod.</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 29 行 | <code>4. If no clear signal, escalate to incident commander.</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 30 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 31 行 | <code>## Automated Steps</code> | Markdown 标题行，用来组织文档层级。 |
| 第 32 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 33 行 | <code>1. Generate summary.</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 34 行 | <code>2. Attach dashboard links.</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 35 行 | <code>3. Attach recent deployment list.</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 36 行 | <code>4. Attach top logs.</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 37 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 38 行 | <code>## Manual Approval Steps</code> | Markdown 标题行，用来组织文档层级。 |
| 第 39 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 40 行 | <code>1. Rollback production deployment.</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 41 行 | <code>2. Restart production pods.</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 42 行 | <code>3. Disable feature flag.</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 43 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 44 行 | <code>## Verification</code> | Markdown 标题行，用来组织文档层级。 |
| 第 45 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 46 行 | <code>- error rate below threshold</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 47 行 | <code>- p95 latency normal</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 48 行 | <code>- alert resolved</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |


## AIOps 入门实验

目标：做一个只推荐、不执行危险动作的 runbook selector。

目录：

```text
runbook-lab/
  alerts/
    high-disk.json
    high-error-rate.json
  runbooks/
    disk-high-usage.md
    high-error-rate.md
  runbook_selector.py
  reports/
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>runbook-lab/</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  alerts/</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>    high-disk.json</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>    high-error-rate.json</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>  runbooks/</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 6 行 | <code>    disk-high-usage.md</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 7 行 | <code>    high-error-rate.md</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 8 行 | <code>  runbook_selector.py</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 9 行 | <code>  reports/</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


### 告警样例

`alerts/high-disk.json`：

```json
{
  "alertname": "HighDiskUsage",
  "service": "node",
  "environment": "staging",
  "host": "node-1",
  "mount_point": "/var",
  "usage_percent": 91,
  "severity": "warning"
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{</code> | 对象开始，表示下面是一组键值对配置。 |
| 第 2 行 | <code>  "alertname": "HighDiskUsage",</code> | 设置 `alertname` 字段，值是 `"HighDiskUsage"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 3 行 | <code>  "service": "node",</code> | 设置 `service` 字段，值是 `"node"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 4 行 | <code>  "environment": "staging",</code> | 设置 `environment` 字段，值是 `"staging"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 5 行 | <code>  "host": "node-1",</code> | 设置 `host` 字段，值是 `"node-1"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 6 行 | <code>  "mount_point": "/var",</code> | 设置 `mount_point` 字段，值是 `"/var"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 7 行 | <code>  "usage_percent": 91,</code> | 设置 `usage_percent` 字段，值是 `91`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 8 行 | <code>  "severity": "warning"</code> | 设置 `severity` 字段，值是 `"warning"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 9 行 | <code>}</code> | 对象结束，表示这一组键值对配置到这里结束。 |


`alerts/high-error-rate.json`：

```json
{
  "alertname": "HighErrorRate",
  "service": "checkout-api",
  "environment": "production",
  "error_rate": 12.5,
  "severity": "critical"
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{</code> | 对象开始，表示下面是一组键值对配置。 |
| 第 2 行 | <code>  "alertname": "HighErrorRate",</code> | 设置 `alertname` 字段，值是 `"HighErrorRate"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 3 行 | <code>  "service": "checkout-api",</code> | 设置 `service` 字段，值是 `"checkout-api"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 4 行 | <code>  "environment": "production",</code> | 设置 `environment` 字段，值是 `"production"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 5 行 | <code>  "error_rate": 12.5,</code> | 设置 `error_rate` 字段，值是 `12.5`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 6 行 | <code>  "severity": "critical"</code> | 设置 `severity` 字段，值是 `"critical"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 7 行 | <code>}</code> | 对象结束，表示这一组键值对配置到这里结束。 |


### Selector 脚本

```python
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

RUNBOOKS = {
    "HighDiskUsage": {
        "file": "runbooks/disk-high-usage.md",
        "automation_level": "L2",
        "risk": "medium",
        "recommendation": "Collect disk context and ask for approval before cleanup.",
    },
    "HighErrorRate": {
        "file": "runbooks/high-error-rate.md",
        "automation_level": "L2",
        "risk": "high",
        "recommendation": "Collect deployment, metrics, and logs before any production action.",
    },
}


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: python runbook_selector.py alerts/high-disk.json")
        return 2

    alert_path = Path(sys.argv[1])
    alert = json.loads(alert_path.read_text(encoding="utf-8"))
    alertname = alert.get("alertname", "")
    selected = RUNBOOKS.get(alertname)

    reports_dir = Path("reports")
    reports_dir.mkdir(exist_ok=True)
    report_path = reports_dir / f"{alertname or 'unknown'}-report.md"

    now = datetime.now(timezone.utc).isoformat()

    if not selected:
        report_path.write_text(
            "\n".join(
                [
                    "# Runbook Recommendation",
                    "",
                    f"- generated_at: {now}",
                    f"- alertname: {alertname or 'unknown'}",
                    "- status: no matching runbook",
                    "",
                    "Escalate to human responder.",
                ]
            ),
            encoding="utf-8",
        )
        print(report_path)
        return 1

    lines = [
        "# Runbook Recommendation",
        "",
        f"- generated_at: {now}",
        f"- alertname: {alertname}",
        f"- service: {alert.get('service', 'unknown')}",
        f"- environment: {alert.get('environment', 'unknown')}",
        f"- severity: {alert.get('severity', 'unknown')}",
        f"- runbook: {selected['file']}",
        f"- automation_level: {selected['automation_level']}",
        f"- risk: {selected['risk']}",
        "",
        "## Recommendation",
        "",
        selected["recommendation"],
        "",
        "## Raw Alert",
        "",
        "```json",
        json.dumps(alert, ensure_ascii=False, indent=2),
        "```",
    ]

    report_path.write_text("\n".join(lines), encoding="utf-8")
    print(report_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>import json</code> | 导入 Python 模块，后面的代码会使用这个模块提供的功能。 |
| 第 2 行 | <code>import sys</code> | 导入 Python 模块，后面的代码会使用这个模块提供的功能。 |
| 第 3 行 | <code>from datetime import datetime, timezone</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 4 行 | <code>from pathlib import Path</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 5 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 6 行 | <code>RUNBOOKS = {</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 7 行 | <code>    "HighDiskUsage": {</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 8 行 | <code>        "file": "runbooks/disk-high-usage.md",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 9 行 | <code>        "automation_level": "L2",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 10 行 | <code>        "risk": "medium",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 11 行 | <code>        "recommendation": "Collect disk context and ask for approval before cleanup.",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 12 行 | <code>    },</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 13 行 | <code>    "HighErrorRate": {</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 14 行 | <code>        "file": "runbooks/high-error-rate.md",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 15 行 | <code>        "automation_level": "L2",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 16 行 | <code>        "risk": "high",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 17 行 | <code>        "recommendation": "Collect deployment, metrics, and logs before any production action.",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 18 行 | <code>    },</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 19 行 | <code>}</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 20 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 21 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 22 行 | <code>def main() -&gt; int:</code> | 定义函数，把一段可复用逻辑命名，后续可以反复调用。 |
| 第 23 行 | <code>    if len(sys.argv) != 2:</code> | 条件判断，只有条件成立时才执行下面缩进的代码。 |
| 第 24 行 | <code>        print("usage: python runbook_selector.py alerts/high-disk.json")</code> | 打印输出，用来在实验中确认变量、结果或调试信息。 |
| 第 25 行 | <code>        return 2</code> | 返回函数结果，调用方会拿到这个值继续处理。 |
| 第 26 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 27 行 | <code>    alert_path = Path(sys.argv[1])</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 28 行 | <code>    alert = json.loads(alert_path.read_text(encoding="utf-8"))</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 29 行 | <code>    alertname = alert.get("alertname", "")</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 30 行 | <code>    selected = RUNBOOKS.get(alertname)</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 31 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 32 行 | <code>    reports_dir = Path("reports")</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 33 行 | <code>    reports_dir.mkdir(exist_ok=True)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 34 行 | <code>    report_path = reports_dir / f"{alertname or 'unknown'}-report.md"</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 35 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 36 行 | <code>    now = datetime.now(timezone.utc).isoformat()</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 37 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 38 行 | <code>    if not selected:</code> | 条件判断，只有条件成立时才执行下面缩进的代码。 |
| 第 39 行 | <code>        report_path.write_text(</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 40 行 | <code>            "\n".join(</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 41 行 | <code>                [</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 42 行 | <code>                    "# Runbook Recommendation",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 43 行 | <code>                    "",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 44 行 | <code>                    f"- generated_at: {now}",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 45 行 | <code>                    f"- alertname: {alertname or 'unknown'}",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 46 行 | <code>                    "- status: no matching runbook",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 47 行 | <code>                    "",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 48 行 | <code>                    "Escalate to human responder.",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 49 行 | <code>                ]</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 50 行 | <code>            ),</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 51 行 | <code>            encoding="utf-8",</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 52 行 | <code>        )</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 53 行 | <code>        print(report_path)</code> | 打印输出，用来在实验中确认变量、结果或调试信息。 |
| 第 54 行 | <code>        return 1</code> | 返回函数结果，调用方会拿到这个值继续处理。 |
| 第 55 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 56 行 | <code>    lines = [</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 57 行 | <code>        "# Runbook Recommendation",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 58 行 | <code>        "",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 59 行 | <code>        f"- generated_at: {now}",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 60 行 | <code>        f"- alertname: {alertname}",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 61 行 | <code>        f"- service: {alert.get('service', 'unknown')}",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 62 行 | <code>        f"- environment: {alert.get('environment', 'unknown')}",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 63 行 | <code>        f"- severity: {alert.get('severity', 'unknown')}",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 64 行 | <code>        f"- runbook: {selected['file']}",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 65 行 | <code>        f"- automation_level: {selected['automation_level']}",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 66 行 | <code>        f"- risk: {selected['risk']}",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 67 行 | <code>        "",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 68 行 | <code>        "## Recommendation",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 69 行 | <code>        "",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 70 行 | <code>        selected["recommendation"],</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 71 行 | <code>        "",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 72 行 | <code>        "## Raw Alert",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 73 行 | <code>        "",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 74 行 | <code>        "```json",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 75 行 | <code>        json.dumps(alert, ensure_ascii=False, indent=2),</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 76 行 | <code>        "```",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 77 行 | <code>    ]</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 78 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 79 行 | <code>    report_path.write_text("\n".join(lines), encoding="utf-8")</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 80 行 | <code>    print(report_path)</code> | 打印输出，用来在实验中确认变量、结果或调试信息。 |
| 第 81 行 | <code>    return 0</code> | 返回函数结果，调用方会拿到这个值继续处理。 |
| 第 82 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 83 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 84 行 | <code>if __name__ == "__main__":</code> | 条件判断，只有条件成立时才执行下面缩进的代码。 |
| 第 85 行 | <code>    raise SystemExit(main())</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |


运行：

```bash
python runbook_selector.py alerts/high-disk.json
python runbook_selector.py alerts/high-error-rate.json
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>python runbook_selector.py alerts/high-disk.json</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 |
| 第 2 行 | <code>python runbook_selector.py alerts/high-error-rate.json</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 |


输出：

```text
reports/HighDiskUsage-report.md
reports/HighErrorRate-report.md
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>reports/HighDiskUsage-report.md</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>reports/HighErrorRate-report.md</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


这个实验只做到 L2：推荐 runbook，不执行动作。

这很重要，因为新手项目先要证明“选择正确、摘要清楚、风险可控”，再谈自动修复。

## GitHub Actions 手动 runbook 实验

```yaml
name: Runbook selector

on:
  workflow_dispatch:
    inputs:
      alert_file:
        description: "Alert JSON file path"
        required: true
        type: string
        default: "alerts/high-disk.json"

permissions:
  contents: read

jobs:
  recommend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"

      - run: python runbook_selector.py "${{ inputs.alert_file }}"

      - uses: actions/upload-artifact@v4
        with:
          name: runbook-report
          path: reports/*.md
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>name: Runbook selector</code> | 设置 `name` 字段的值为 `Runbook selector`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 3 行 | <code>on:</code> | 定义 `on` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>  workflow_dispatch:</code> | 定义 `workflow_dispatch` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 5 行 | <code>    inputs:</code> | 定义 `inputs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 6 行 | <code>      alert_file:</code> | 定义 `alert_file` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 7 行 | <code>        description: "Alert JSON file path"</code> | 设置 `description` 字段的值为 `"Alert JSON file path"`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 8 行 | <code>        required: true</code> | 设置 `required` 字段的值为 `true`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 9 行 | <code>        type: string</code> | 设置 `type` 字段的值为 `string`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 10 行 | <code>        default: "alerts/high-disk.json"</code> | 设置 `default` 字段的值为 `"alerts/high-disk.json"`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 11 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 12 行 | <code>permissions:</code> | 定义 `permissions` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 13 行 | <code>  contents: read</code> | 设置 `contents` 字段的值为 `read`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 14 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 15 行 | <code>jobs:</code> | 定义 `jobs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 16 行 | <code>  recommend:</code> | 定义 `recommend` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 17 行 | <code>    runs-on: ubuntu-latest</code> | 设置 `runs-on` 字段的值为 `ubuntu-latest`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 18 行 | <code>    steps:</code> | 定义 `steps` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 19 行 | <code>      - uses: actions/checkout@v4</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 20 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 21 行 | <code>      - uses: actions/setup-python@v5</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 22 行 | <code>        with:</code> | 定义 `with` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 23 行 | <code>          python-version: "3.12"</code> | 设置 `python-version` 字段的值为 `"3.12"`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 24 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 25 行 | <code>      - run: python runbook_selector.py "${{ inputs.alert_file }}"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 26 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 27 行 | <code>      - uses: actions/upload-artifact@v4</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 28 行 | <code>        with:</code> | 定义 `with` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 29 行 | <code>          name: runbook-report</code> | 设置 `name` 字段的值为 `runbook-report`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 30 行 | <code>          path: reports/*.md</code> | 设置 `path` 字段的值为 `reports/*.md`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


这个 workflow 的价值：

- 有手动触发。
- 有输入参数。
- 有执行日志。
- 有 artifact。
- 不需要生产权限。

下一步可以加 environment approval，再执行低风险动作。

## 常用命令字典

### python runbook_selector.py

```bash
python runbook_selector.py alerts/high-disk.json
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>python runbook_selector.py alerts/high-disk.json</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 |


作用：根据告警 JSON 选择 runbook 并生成报告。

### ansible-playbook --check

```bash
ansible-playbook -i inventory.ini disk-cleanup.yml --check --diff
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ansible-playbook -i inventory.ini disk-cleanup.yml --check --diff</code> | 执行 `ansible-playbook` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


作用：预演 Ansible 动作，不真正修改。

适合 L3 前置检查。

### ansible-playbook --limit

```bash
ansible-playbook -i inventory.ini restart-service.yml --limit node-1
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ansible-playbook -i inventory.ini restart-service.yml --limit node-1</code> | 执行 `ansible-playbook` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


作用：限制只对一个目标执行。

避免误操作整组主机。

### gh workflow run

```bash
gh workflow run "Runbook selector" -f alert_file=alerts/high-disk.json
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>gh workflow run "Runbook selector" -f alert_file=alerts/high-disk.json</code> | 执行 `gh` 相关命令，后面的参数决定它具体操作什么对象。 |


作用：手动触发 GitHub Actions runbook。

### gh run view --log

```bash
gh run view <run-id> --log
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>gh run view &lt;run-id&gt; --log</code> | 执行 `gh` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


作用：查看 runbook workflow 日志。

### aws ssm start-automation-execution

```bash
aws ssm start-automation-execution \
  --document-name "AWS-RestartEC2Instance" \
  --parameters "InstanceId=i-0123456789abcdef0"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>aws ssm start-automation-execution \</code> | 执行 `aws` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>  --document-name "AWS-RestartEC2Instance" \</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 3 行 | <code>  --parameters "InstanceId=i-0123456789abcdef0"</code> | 注释行，提前说明下面命令的目的或注意事项。 |


作用：启动 AWS Systems Manager Automation runbook。

真实使用时要确认 IAM、参数和环境。

### aws ssm get-automation-execution

```bash
aws ssm get-automation-execution \
  --automation-execution-id "automation-id"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>aws ssm get-automation-execution \</code> | 执行 `aws` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>  --automation-execution-id "automation-id"</code> | 注释行，提前说明下面命令的目的或注意事项。 |


作用：查看 AWS Automation 执行状态。

### az automation runbook start

```bash
az automation runbook start \
  --automation-account-name my-auto \
  --resource-group my-rg \
  --name collect-diagnostics
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>az automation runbook start \</code> | 执行 `az` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>  --automation-account-name my-auto \</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 3 行 | <code>  --resource-group my-rg \</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 4 行 | <code>  --name collect-diagnostics</code> | 注释行，提前说明下面命令的目的或注意事项。 |


作用：启动 Azure Automation runbook。

### kubectl get pods

```bash
kubectl get pods -n prod -l app=checkout-api
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>kubectl get pods -n prod -l app=checkout-api</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |


作用：收集 Kubernetes 服务实例状态。

### kubectl logs

```bash
kubectl logs -n prod deploy/checkout-api --tail=200
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>kubectl logs -n prod deploy/checkout-api --tail=200</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


作用：收集最近日志。

### kubectl rollout status

```bash
kubectl rollout status deployment/checkout-api -n prod
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>kubectl rollout status deployment/checkout-api -n prod</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |


作用：验证发布或回滚是否完成。

### systemctl status

```bash
systemctl status checkout-api --no-pager
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>systemctl status checkout-api --no-pager</code> | 管理 systemd 服务，用来启动、停止、重启或查看 Linux 服务状态。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


作用：查看 Linux 服务状态。

### journalctl

```bash
journalctl -u checkout-api -n 200 --no-pager
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>journalctl -u checkout-api -n 200 --no-pager</code> | 读取 systemd journal 日志，用来排查服务启动失败和运行错误。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


作用：查看 systemd 服务日志。

## 典型故障排查表

| 现象 | 常见原因 | 怎么查 | 怎么修 |
|---|---|---|---|
| 推荐错 runbook | alertname/labels 不规范 | 看原始告警 | 规范 labels，补匹配规则 |
| 没有匹配 runbook | runbook metadata 缺失 | 看 selector 输出 | 增加 runbook 或兜底流程 |
| 自动化动作失败 | 参数缺失 | 看 execution inputs | 增加参数校验 |
| 权限不足 | service role 权限不够 | 看 403/AccessDenied | 最小权限补授权 |
| 目标不可达 | 网络或主机问题 | ping/ssh/kubectl | 转人工或修连通 |
| 重复执行造成副作用 | 动作不幂等 | 看重复日志 | 增加状态检查和锁 |
| 清理误删风险 | 路径变量不安全 | 看命令参数 | 加白名单和禁止动作 |
| runbook 卡住 | 等待外部命令 | 看超时 | 加 timeout |
| 多个 runbook 冲突 | 并发控制缺失 | 看同服务执行记录 | 加 lock/concurrency |
| 审批绕过 | 权限模型错误 | 看审计 | 拆分触发角色和执行角色 |
| 执行成功但告警未恢复 | 缺少验证或修错方向 | 看指标 | 执行验证步骤并升级 |
| LLM 建议危险动作 | 未加安全护栏 | 看推荐内容 | LLM 只做摘要/推荐，不直接执行 |
| 审计不完整 | 没记录参数/命令/结果 | 看 execution record | 补 audit_fields |
| runbook 过期 | 服务架构变化 | 演练失败 | 设置 owner 和 review 周期 |

## 安全护栏

Runbook Automation 一定要有护栏。

### 参数白名单

危险：

```bash
rm -rf "$TARGET_DIR"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>rm -rf "$TARGET_DIR"</code> | 执行 `rm` 相关命令，后面的参数决定它具体操作什么对象。 |


更安全：

```text
只允许 TARGET_DIR 属于：
  /tmp/app-cache
  /var/log/app/archive
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>只允许 TARGET_DIR 属于：</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  /tmp/app-cache</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>  /var/log/app/archive</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


### 并发锁

同一个服务同一时间不要执行多个有状态 runbook。

```text
lock_key = service + environment + runbook_id
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>lock_key = service + environment + runbook_id</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


### 超时

每个步骤都要有 timeout。

```text
collect logs: 2 minutes
restart pod: 5 minutes
verify metrics: 10 minutes
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>collect logs: 2 minutes</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>restart pod: 5 minutes</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>verify metrics: 10 minutes</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


### dry run

能预演就先预演。

Ansible：

```bash
ansible-playbook playbook.yml --check --diff
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ansible-playbook playbook.yml --check --diff</code> | 执行 `ansible-playbook` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


Terraform：

```bash
terraform plan
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>terraform plan</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |


Kubernetes：

```bash
kubectl diff -f manifest.yaml
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>kubectl diff -f manifest.yaml</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |


### 审批

高风险动作必须审批。

审批记录至少包含：

- 谁申请。
- 谁批准。
- 批准时间。
- 输入参数。
- 目标环境。
- 风险说明。

## LLM 在 Runbook Automation 中的边界

LLM 可以做：

- 总结告警。
- 总结日志。
- 从知识库中推荐 runbook。
- 解释 runbook 步骤。
- 生成事件摘要。
- 生成复盘初稿。
- 提醒缺失字段。

LLM 不应该直接做：

- 无审批执行生产变更。
- 编造命令并直接执行。
- 绕过 runbook。
- 决定删除数据。
- 决定数据库迁移。
- 读取或输出 secrets。

更安全的模式：

```text
LLM recommends
  -> deterministic policy checks
  -> human approval if needed
  -> automation engine executes predefined action
  -> metrics verify
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>LLM recommends</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; deterministic policy checks</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; human approval if needed</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>  -&gt; automation engine executes predefined action</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>  -&gt; metrics verify</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


## Runbook 评审清单

一个 runbook 进入自动化前，要检查：

- [ ] 有 owner。
- [ ] 有版本。
- [ ] 有适用环境。
- [ ] 有输入参数。
- [ ] 有参数校验。
- [ ] 有前置条件。
- [ ] 有上下文收集步骤。
- [ ] 有明确决策规则。
- [ ] 每个动作有风险等级。
- [ ] 高风险动作需要审批。
- [ ] 改变状态的动作有验证。
- [ ] 改变状态的动作有回滚或停止策略。
- [ ] 禁止动作写清楚。
- [ ] 权限最小化。
- [ ] 有并发控制。
- [ ] 有超时。
- [ ] 有审计字段。
- [ ] 演练过。

## 面试怎么讲

可以这样讲：

Runbook Automation 是把事故处理手册转成受控自动化流程。它通常从告警、事件或人工触发开始，先标准化输入，再收集指标、日志、部署记录等上下文，根据 alert labels 或规则选择 runbook。runbook 里要定义 owner、输入参数、前置检查、步骤、动作、输出、风险等级、审批、验证、回滚和审计字段。低风险诊断步骤可以自动执行，中高风险生产动作必须人工确认，高危或不可逆动作应该禁止自动化。

在 AIOps 中，Runbook Automation 是从“检测异常”到“辅助处理”的关键环节。LLM 可以用于摘要和推荐，但真正执行应由经过评审的脚本、Ansible、GitHub Actions、AWS Systems Manager 或 Azure Automation 等引擎完成，并受权限、审批、幂等性、并发和审计控制。

## 学习检查清单

- [ ] 我能解释 runbook、playbook、automation workflow 的区别。
- [ ] 我能画出 Alert -> Context -> Runbook -> Approval -> Execute -> Verify -> Audit 链路。
- [ ] 我能写一个包含 metadata、inputs、preconditions、steps、verification、rollback 的 runbook。
- [ ] 我能说明 L0 到 L4 自动化分级。
- [ ] 我能判断哪些动作可以自动执行，哪些必须审批，哪些禁止自动化。
- [ ] 我能解释幂等性为什么重要。
- [ ] 我能解释为什么 runbook 要支持重新运行。
- [ ] 我能根据 alert JSON 选择 runbook。
- [ ] 我能生成 Markdown 事件摘要。
- [ ] 我能说清 service role、AssumeRole、最小权限的意义。
- [ ] 我能说明 LLM 在 runbook automation 中的安全边界。
- [ ] 我能设计审计字段。
- [ ] 我能把 runbook automation 放进 AIOps 闭环。

## 面试题

1. Runbook Automation 是什么？和普通脚本有什么区别？
2. Runbook 和 Playbook 有什么区别？
3. 一个可自动化 runbook 应该包含哪些字段？
4. 为什么自动化动作要有输入参数和前置检查？
5. 什么是幂等性？为什么 runbook 必须考虑幂等？
6. 为什么 runbook 被中断后重新执行可能有风险？
7. 自动化分级 L0 到 L4 分别是什么？
8. 哪些动作可以自动执行？哪些必须人工确认？
9. 为什么生产数据库操作通常不适合直接自动化？
10. 如何根据告警 labels 选择 runbook？
11. Runbook Automation 如何连接 Prometheus、Loki、GitHub deployment 和 Ansible？
12. AWS Systems Manager Automation runbook 的核心概念是什么？
13. Azure Automation runbook job 的执行模型有什么启发？
14. 审计日志应该记录哪些字段？
15. LLM 在 Runbook Automation 里能做什么，不能做什么？
16. 如何把 Runbook Automation 做成 AIOps 求职项目？

## 学习证据

学完这篇，建议留下这些证据：

1. 一个 `runbooks/disk-high-usage.md`。
2. 一个 `runbooks/high-error-rate.md`。
3. 两个模拟告警 JSON。
4. 一个 `runbook_selector.py`。
5. 两份自动生成的 Markdown 事件摘要。
6. 一个 GitHub Actions 手动触发 runbook workflow。
7. 一篇笔记：L0 到 L4 自动化分级。
8. 一篇笔记：哪些动作可以自动执行，哪些必须审批，哪些禁止自动化。
9. 一篇笔记：Runbook Automation 在 AIOps 闭环中的位置。
