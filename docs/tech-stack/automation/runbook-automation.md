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

老同事可能脑子里有一套流程：

```text
先看最近是否发布
再看是所有实例都报错还是新版本实例报错
再看日志里有没有同一种异常
如果是新版本导致，先回滚
如果是下游超时，先降级或扩容
如果只是单个实例异常，先摘流量再重启
```
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
Runbook Automation（操作手册自动化）
  -> Incident response foundation（事故响应基础）
     -> alert / on-call（告警／值班）
     -> playbook / runbook（协作流程／操作步骤）
     -> incident role（事故角色）
     -> communication / escalation（沟通／升级处理）
  -> Runbook definition（流程定义）
     -> metadata / owner（元数据／负责人）
     -> trigger / input parameters（触发条件／输入参数）
     -> preconditions（前置条件）
     -> steps / actions / outputs（步骤／动作／输出）
     -> decision rules（决策规则）
     -> verification / rollback / audit（验证／回滚／审计）
  -> Execution engine（执行引擎）
     -> script（脚本）
     -> Ansible（配置与任务自动化）
     -> GitHub Actions（工作流平台）
     -> AWS Systems Manager Automation（云资源自动化）
     -> Azure Automation（云与混合环境自动化）
     -> Kubernetes Job（集群批任务）
  -> Safety control（安全控制）
     -> risk level / approval（风险等级／审批）
     -> least privilege（最小权限）
     -> rate limit / concurrency（频率限制／并发限制）
     -> idempotency（重复执行不重复产生业务效果）
     -> timeout / dry run（超时／预演）
  -> AIOps integration（智能运维集成）
     -> Alertmanager / CloudWatch / EventBridge（告警与事件来源）
     -> Prometheus（指标）
     -> Loki / Elasticsearch（日志检索）
     -> deployment history（部署历史）
     -> incident ticket（事故工单）
     -> LLM summary（大语言模型摘要）
     -> action recommendation（动作建议）
  -> Evidence（证据）
     -> execution record / logs（执行记录／日志）
     -> parameters / commands（参数／命令）
     -> result / verification / rollback result（结果／验证／回滚结果）
```

最小执行链路：

```text
Alert / Event（告警／事件）
  -> parse labels（解析标签）
  -> select runbook（选择手册）
  -> collect context（收集上下文）
  -> run pre-checks（前置检查）
  -> classify risk（风险分类）
  -> execute safe steps or request approval（执行安全步骤或请求审批）
  -> verify impact（验证业务影响）
  -> record audit（保存审计）
  -> escalate or close（升级人工或关闭）
```

## Runbook Automation 在 AIOps 链路中的位置

AIOps 闭环可以这样看：

```text
Detect（检测）
  -> 告警、异常检测、SLO burn

Diagnose（诊断）
  -> 指标、日志、trace、变更关联、根因候选

Decide（决策）
  -> 选择 runbook、判断风险、确认动作

Act（行动）
  -> 执行检查、重启、扩容、回滚、降级、通知

Verify（验证）
  -> 检查错误率、延迟、SLO、日志、用户影响

Learn（学习改进）
  -> 记录审计、复盘、更新 runbook
```

Runbook Automation 覆盖的是 `Decide -> Act -> Verify`，但它也依赖前面的 Detect 和 Diagnose。

没有 runbook 的 AIOps 很容易变成：

```text
模型说了一堆建议，但没人敢执行
```
有 runbook 的 AIOps 才能变成：

```text
模型或规则推荐一个经过评审的流程
流程先收集证据
低风险步骤自动执行
高风险步骤等待人工确认
执行后自动验证
所有过程可审计
```
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
Trigger（触发器）
  -> Input normalization（输入规范化）
  -> Context enrichment（上下文补全）
  -> Runbook selection（选择操作手册）
  -> Pre-check（前置检查）
  -> Risk classification（风险分级）
  -> Approval if needed（按风险批准）
  -> Execute steps（执行步骤）
  -> Verify（验证）
  -> Audit（审计）
  -> Escalate / rollback / close（升级处理、回滚或关闭）
```

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
alertname=HighDiskUsage（磁盘高占用告警）
  -> runbooks/disk-high-usage.md（磁盘占用率高手册）

alertname=HighErrorRate and service=checkout-api（结算接口高错误率条件）
  -> runbooks/high-error-rate-web-service.md（结算接口错误率高手册）

alertname=KubePodCrashLooping（容器反复崩溃告警）
  -> runbooks/kubernetes-crashloop.md（容器反复退出手册）
```

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

### inputs

输入参数必须明确。

坏例子：

```text
处理磁盘告警
```
好例子：

```text
host: node-1
mount_point: /var
usage_percent: 92
environment: production
```

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
  - commit（提交对象） SHA
```

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

## 幂等性和可重启

幂等性是 runbook automation 的关键。

幂等的意思：

```text
同一个动作执行一次和执行多次，最终状态一样或可接受。
```
例子：

幂等：

```bash
mkdir -p /tmp/aiops
```

不幂等：

```bash
echo "new config" >> /etc/app.conf
```

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
Prometheus rule fires（监控规则触发）
  -> Alertmanager（告警管理器）
  -> webhook（事件回调）
  -> runbook service（操作手册服务）
  -> select runbook（选择手册）
  -> generate summary（生成摘要）
```

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
Automation runbook（自动化文档）
  -> parameters（参数）
  -> mainSteps（主要步骤）
  -> actions（动作）
  -> outputs（输出）
  -> execution status（执行状态）
```

适合 AWS 资源维护、部署和修复。

### Azure Automation

Azure 的模型：

```text
Runbook（操作手册）
  -> job（作业）
  -> worker（工作者）
  -> Azure sandbox or Hybrid Runbook Worker（云沙箱或混合执行器）
  -> logs（日志）
```

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
Markdown runbook（文档形式的操作手册）
  -> Python selector（手册选择程序）
  -> GitHub Actions 手动触发
  -> Ansible 执行低风险动作
  -> Alertmanager webhook 自动触发摘要
```

## 示例：磁盘使用率高

把示例放在代码块里，避免 Markdown 把 runbook 内部标题当成本文标题。

````md
# Runbook: High Disk Usage（磁盘占用率高处置手册）

## Metadata（元数据）

- owner: sre-team（负责人）
- risk_level: medium（中风险，具体动作需再分级）
- automation_level: L3（需要审批的自动化）

## Trigger（触发条件）

- alertname: HighDiskUsage
- usage_percent > 85（示意阈值，生产按容量目标另定）

## Inputs（输入参数）

- host（目标主机标识）
- mount_point（挂载点）
- usage_percent（占用百分比）
- environment（环境）

## Preconditions（前置条件）

- 主机必须可达，且对应本次批准的资源 ID。
- 挂载点不能为空，必须明确对应文件系统。
- 生产环境必须经过适用审批；只读采集也需权限和负载预算。

## Context To Collect（采集上下文）

```bash
df -h
df -i
du -xhd1 /var 2>/dev/null | sort -h | tail -20
journalctl --disk-usage
```

## Decision Rules（决策规则）

1. inode 使用率高时，检查是否有大量小文件，不只看字节容量。
2. 日志目录占用高时，核对保留策略、活动写入者与轮转状态。
3. 业务数据目录占用高时，交给服务所有者确认，不自行删除。

## Candidate Actions（候选动作，逐项评估并批准后才能执行）

1. 在保留要求、备份和临时空间均满足后，评估压缩已归档日志。
2. 仅对已明确授权的临时文件清单执行清理；路径含“tmp”不等于可删除。
3. 确认轮转故障后，按应用支持方式修复，不盲目强制轮转。

## Approval Required（需要批准）

- 生产清理。
- 删除文件。
- 扩容磁盘及相关费用、维护窗口。

## Forbidden Actions（禁止动作）

- 不删除未经授权的业务数据。
- 不对未经解析和范围验证的变量路径执行递归删除。
- 不自行清理数据库数据目录。

## Verification（验证）

- `df -h` 显示字节容量满足目标；inode 告警另用对应指标验证。
- 服务健康检查与日志采集通过。
- 在已定义观察窗口内确认告警恢复；十分钟只能是实验示例，不是统一标准。

## Rollback（恢复与停止）

- 错删恢复依赖真实可用备份，删除并不天然可回滚。
- 验证失败时停止自动化，保留现场并升级负责人。
````

## 示例：高错误率

````md
# Runbook: High Error Rate（接口错误率高处置手册）

## Trigger（触发条件）

- alertname: HighErrorRate
- service（服务）标签存在且对应受控资产。
- environment（环境）标签存在且通过允许值检查。

## Inputs（输入参数）

- service（服务标识）
- environment（环境）
- error_rate（错误率，需明确百分比或比值单位）
- started_at（带时区的发生时间）

## Context To Collect（采集上下文）

1. 最近六十分钟的发布，具体时间窗按事故调整。
2. 按版本拆分的错误率和请求样本量。
3. 脱敏后的主要异常类别。
4. 下游依赖延迟与错误率。
5. Kubernetes 容器组重启和事件。

## Decision Rules（决策规则）

1. 发布后才出现错误且仅新版本受影响，形成回滚候选假设，继续验证兼容与数据风险。
2. 所有版本受影响且出现依赖错误，优先检查下游。
3. 只有一个容器组异常，评估隔离它后的容量，再提出隔离建议。
4. 信号不足时升级事故负责人，不自动补造根因。

## Automated Steps（允许的只读自动步骤）

1. 生成脱敏摘要。
2. 附适用仪表盘链接。
3. 附最近部署清单和提交标识。
4. 附有大小与时间限制的日志摘要。

## Manual Approval Steps（需人工批准的变更）

1. 回滚生产部署，先验证数据与版本兼容。
2. 重启生产实例，限制影响范围。
3. 关闭功能开关，确认业务影响和恢复路径。

## Verification（验证）

- 错误率低于目标且有足够请求样本。
- p95 延迟恢复到批准的基线或目标。
- 告警恢复，并确认不是采集缺失造成的假正常。
````

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

    base = Path(__file__).resolve().parent
    allowed_dir = (base / "alerts").resolve()
    alert_path = (base / sys.argv[1]).resolve()
    if not alert_path.is_relative_to(allowed_dir) or alert_path.suffix != ".json":
        print("input must be a JSON file inside the lab alerts directory")
        return 2
    try:
        alert = json.loads(alert_path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as error:
        print(f"cannot load alert: {error}")
        return 2
    if not isinstance(alert, dict):
        print("alert must be an object")
        return 2
    alertname = alert.get("alertname")
    if not isinstance(alertname, str) or not alertname.strip():
        print("alertname must be a non-empty string")
        return 2
    if alert.get("environment") not in {"staging", "production"}:
        print("environment must be staging or production")
        return 2
    selected = RUNBOOKS.get(alertname)

    reports_dir = base / "reports"
    reports_dir.mkdir(exist_ok=True)
    safe_name = alertname if selected else "unknown"
    report_path = reports_dir / f"{safe_name}-report.md"

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

运行：

```bash
python runbook_selector.py alerts/high-disk.json
python runbook_selector.py alerts/high-error-rate.json
```

输出：

```text
reports/HighDiskUsage-report.md
reports/HighErrorRate-report.md
```

上面表示报告相对位置；当前脚本打印的是解析后的绝对路径，前面会带你的实验目录。这个实验只做到 L2：推荐 runbook，不执行动作。

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

      - name: Select from validated input
        env:
          ALERT_FILE: ${{ inputs.alert_file }}
        run: python runbook_selector.py "$ALERT_FILE"

      - uses: actions/upload-artifact@v4
        with:
          name: runbook-report
          path: reports/*.md
```

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

作用：根据告警 JSON 选择 runbook 并生成报告。

### ansible-playbook --check

```bash
ansible-playbook -i inventory.ini disk-cleanup.yml --check --diff
```

作用：请求 Ansible 检查模式；具体模块是否支持、是否跳过、是否在任务里显式关闭检查模式都要审查，不能无条件承诺整份 playbook 绝不修改。`--diff` 还可能暴露敏感配置。

适合 L3 前置检查。

### ansible-playbook --limit

```bash
ansible-playbook -i inventory.ini restart-service.yml --limit node-1
```

作用：限制只对一个目标执行。

避免误操作整组主机。

### gh workflow run

```bash
gh workflow run "Runbook selector" -f alert_file=alerts/high-disk.json
```

作用：手动触发 GitHub Actions runbook。

### gh run view --log

```bash
gh run view <run-id> --log
```

作用：查看 runbook workflow 日志。

### aws ssm start-automation-execution

```bash
aws ssm start-automation-execution \
  --document-name "AWS-RestartEC2Instance" \
  --parameters "InstanceId=i-0123456789abcdef0"
```

作用：启动 AWS Systems Manager Automation runbook。

真实使用时要确认 IAM、参数和环境。

### aws ssm get-automation-execution

```bash
aws ssm get-automation-execution \
  --automation-execution-id "automation-id"
```

作用：查看 AWS Automation 执行状态。

### az automation runbook start

```bash
az automation runbook start \
  --automation-account-name my-auto \
  --resource-group my-rg \
  --name collect-diagnostics
```

作用：启动 Azure Automation runbook。

### kubectl get pods

```bash
kubectl get pods -n prod -l app=checkout-api
```

作用：收集 Kubernetes 服务实例状态。

### kubectl logs

```bash
kubectl logs -n prod deploy/checkout-api --tail=200
```

作用：收集最近日志。

### kubectl rollout status

```bash
kubectl rollout status deployment/checkout-api -n prod
```

作用：验证发布或回滚是否完成。

### systemctl status

```bash
systemctl status checkout-api --no-pager
```

作用：查看 Linux 服务状态。

### journalctl

```bash
journalctl -u checkout-api -n 200 --no-pager
```

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

更安全：

```text
只允许 TARGET_DIR 属于：
  /tmp/app-cache
  /var/log/app/archive
```

### 并发锁

同一个服务同一时间不要执行多个有状态 runbook。

```text
lock_key = service + environment + runbook_id
```

### 超时

每个步骤都要有 timeout。

```text
collect logs: 2 minutes
restart pod: 5 minutes
verify metrics: 10 minutes
```

### dry run

能预演就先预演。

Ansible：

```bash
ansible-playbook playbook.yml --check --diff
```

Terraform：

```bash
terraform plan
```

Kubernetes：

```bash
kubectl diff -f manifest.yaml
```

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
LLM recommends（语言模型给出建议）
  -> deterministic policy checks（确定性策略检查）
  -> human approval if needed（按风险人工批准）
  -> automation engine executes predefined action（自动化引擎执行预定义动作）
  -> metrics verify（指标验证）
```

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

## 老师带练：为什么“推荐正确”距离“允许执行”还差很多

看一条具体业务链：支付服务错误率升高，系统推荐“摘除一台异常实例并重启”。推荐合理，不代表现在就可以重启。你还要知道这个实例是不是唯一健康实例、它是否承载有状态任务、目标标签有没有过期、审批覆盖的是哪一台、操作是否已经执行过。Runbook 的难点不在于把几条命令顺序写下来，而在于这些判断发生在不同时间，系统状态会变。

前面的流程图中 Trigger 是触发，Input normalization 是统一输入格式，Context enrichment 是补齐上下文，Pre-check 是前置检查，Risk classification 是风险判定，Audit 是审计。闭环里的 Detect、Diagnose、Decide、Act、Verify、Learn 分别是发现、诊断、决策、行动、验证、学习。不要把所有步骤都叫“自动修复”：收集证据、提出建议和改变生产是三种权限完全不同的行为。

### 定义文件与执行记录：菜谱不能代替做菜过程

runbook 定义说“应该怎么做”，execution（一次执行）记录“这次做到了哪一步”。同一份手册可执行很多次；每次输入、目标、批准人、程序版本和观测结果不同。数据库中至少分开保存手册版本、执行实例、步骤尝试和审批记录，不能只更新一行“最后一次成功”。

每个步骤最好有明确输入、输出和后置条件。比如“摘流量”输入是不可变的实例标识、环境和期望当前版本；输出是流量配置变更编号；后置条件是这个实例不再接收新请求。后置条件验证失败时，不能直接进入重启。调用 API 返回 200 只是接口层结果，要继续验证调度或负载均衡实际生效。

### 结果未知：自动化最容易被忽略的状态

假设执行器发出“创建工单”，工单系统创建成功，但返回途中网络断开。执行器看到超时，不能判断“工单没创建”。这叫结果未知。若立即重试，可能出现两张相同工单；若直接标记成功，又可能根本没创建。

设计方法是先生成业务幂等键，例如“事件指纹 + 操作类型 + 目标 ID”，由目标系统去重或查询该键对应的结果。执行器恢复后先对账，再继续。锁只能防止同时执行，不防止锁释放后重复事件再次执行；重试次数限制只能控制次数，不提供幂等语义。把三者说清楚，才算理解自动化可靠性。

对于多个 runbook 同时修改同一服务，锁键应覆盖冲突资源，不能盲目把 `runbook_id` 放进唯一键后就认为安全：扩容手册和回滚手册名称不同，仍可能冲突。租约锁（过一段时间自动到期）还要防止旧执行器暂停后恢复继续写入；高风险系统可用 fencing token（递增执行代次）让目标拒绝旧执行者。没有这种能力时，流程必须更保守地人工接管。

### 审批不能只批准“一个按钮”

可审计的审批应绑定具体 runbook 版本、目标集合、参数、制品摘要、风险说明和有效期。审批后有人把目标从一台改成十台，原批准不能继续使用。等待审批期间告警可能已恢复，实例也可能被替换，所以在执行前重新检查目标与前置条件。这个二次检查不是重复劳动，而是防止“检查时安全，执行时已变”的时间差。

触发者、审批者、执行身份和平台管理员要分开建模。仅允许一个人点开始，不代表此人应该获得数据库管理密码。执行角色只拥有指定资源和动作的权限，短期身份优于长期大权限凭据。`service role` 是服务执行身份，`AssumeRole` 是在授权条件下临时扮演角色，OIDC（开放身份连接）可用工作负载声明换取短期身份；它们都不是把秘密写进文档。

### 本地故障实验：异常输入必须停在推荐器入口

前提：Python 3.9 或更高版本（使用 `Path.is_relative_to`），已按前文建立独立 `runbook-lab` 目录。将两个示例手册保存到 `runbooks/` 对应文件；它们是待学习的文档，不是已获授权的生产命令。脚本只生成建议，不访问主机、云或数据库。

先执行两条正常输入，预期生成两个已列出的报告；检查报告写明 `automation_level: L2`，没有执行任何 cleanup、restart 或 rollback。然后用编辑器增加三份故障样例：

```json
{"alertname":"UnknownAlert","environment":"staging"}
```

将它保存为 `alerts/unknown.json`；另建 `alerts/wrong-shape.json` 内容 `[]`；再建 `alerts/path-like-name.json`：

```json
{"alertname":"../../outside","environment":"staging"}
```

依次运行：

```bash
python runbook_selector.py alerts/unknown.json
python runbook_selector.py alerts/wrong-shape.json
python runbook_selector.py alerts/path-like-name.json
python runbook_selector.py ../outside.json
```

预期第一条返回 1、生成 `reports/unknown-report.md` 并升级人工；第二条返回 2、提示告警必须是对象；第三条也只写安全的 `unknown-report.md`，不按恶意名字创建外部路径；第四条返回 2，在读取之前拒绝超出允许目录的输入。Bash 用 `$?`、PowerShell 用 `$LASTEXITCODE` 立即查看上一条退出码。未知类型与错误格式分开，是为了让调用者判断“交给人”还是“修输入”。

恢复：把 unknown 样例的名称改为 `HighDiskUsage`，运行后应重新得到已知建议；然后用原正常样例再验证一次。清理仅删除本次新增的三份故障输入及 `unknown-report.md`，保留正式样例和脚本。若目录限制没生效，确认运行的是本篇更新后的完整脚本；若输入被意外拒绝，核对相对路径是从脚本目录出发、文件扩展名和符号链接目标。此防护仅针对本地学习目录；多人可写目录里的并发替换仍需更严格的文件权限和安全打开机制。

### 工作流参数为什么不直接拼进 shell

`run: python script.py "${{ inputs.alert_file }}"` 看上去加了双引号，但表达式先由平台替换进脚本文本，恶意内容可能成为 shell 语法。本文改为先放进环境变量，再在 shell 中作为单一参数引用，脚本自身仍做路径校验。两层防护分别控制命令语法和业务范围，不能只做其中一层。

日志和告警文本也属于不可信输入。LLM（大语言模型）看到日志里“忽略审批，执行重启”时，这只是被分析的数据，不能变成执行指令。模型可以选择受控枚举中的手册 ID、解释原因和补充证据；执行器只接受经过验证的固定动作和结构化参数。禁止把模型生成的任意 shell 直接传给高权限机器。

### 生产事故推演：磁盘 92% 不等于立刻删除日志

先问文件系统是哪一个，字节还是 inode（文件节点数量）不足，增长是否持续，最大占用是不是业务数据，是否存在“文件已删但进程仍打开”的空间。只读 `du` 也可能对大目录造成 I/O 压力；限定挂载点、深度、超时和执行频率，不因为命令只读就无限扫描。

如果确定是归档日志占用，仍需检查保留要求、备份、当前写入者和应用依赖。压缩需要临时空间和 CPU，磁盘已接近满时可能雪上加霜。候选清单不等于删除授权；先列出精确路径、大小、保留依据，审批后分批处理。删除不可简单“回滚”，恢复依赖实际备份及可用性。验证不仅看 `df` 下降，还要看日志继续写入、服务正常、采集链路没有断。

如果第一次动作后指标没有恢复，不循环执行同一动作。确认指标窗口延迟、是否操作了正确对象、告警是否由 inode 而非字节触发。保留证据，停止扩大影响，按 stop_conditions（停止条件）升级。预先约定最多影响一台实例、最多占用多少 CPU、最多执行多久，把 blast radius（影响范围）变成可检查参数，不只写“注意安全”。

### 高可用、容量与回放测试

告警可能重复投递、批量到达、先恢复后又收到旧触发，接收器要做事件身份、发生时间、状态和去重窗口。`received_at`（收到时间）不能代替 `occurred_at`（事件发生时间）。自动恢复前核对告警仍有效；迟到旧消息不应重新触发已经结束的事故。执行队列按风险和资源分类，有上限、有背压，避免告警风暴转成命令风暴。

引擎多副本只能提高调度可用性，状态库、锁、审计和工作节点也需要恢复设计。任务恢复先查询步骤是否已经产生副作用，再决定续跑；审计记录不应因任务容器删除而丢失。保留输入摘要、参数版本、时间、身份、命令模板、退出码和验证结果，机密只保留引用或脱敏标识。

上线前准备回放数据集：正常告警、未知告警、重复告警、已恢复告警、权限不足、外部超时、执行器中断、验证失败。先 shadow mode（影子模式，只计算不变更），把推荐与人工决策对照；再逐步开放低风险动作。衡量目标不是“自动执行占比越高越好”，而是正确建议率、误执行率、人工接管率、恢复时间和审计完整性。

### 面试递进：定义、机制、故障和架构

30 秒：Runbook Automation 是把操作知识变成有参数、权限、审批、状态、验证和审计的受控流程，不是告警一来就执行重启。

3 分钟：用磁盘或支付故障说明输入归一、证据采集、风险判定、执行与验证；再讲重复投递、结果未知、审批有效期和中断恢复。追问“有锁为什么仍重复操作”，解释并发互斥不等于跨时间幂等；追问“LLM 推荐错了怎么办”，说明确定性策略、权限、固定动作目录和人工边界；追问“自动回滚失败怎么办”，说明停止条件、实际状态对账、保留现场和升级负责人，而不是继续扩大重试次数。面试展示真实实验即可，不把本文模拟写成自己的生产经历。

## 自动化执行器精讲：把动作变成可恢复的状态转换

### 每一步至少记住输入、意图和结果

老师带你设计“采集诊断包”这一个动作。执行前记录目标资源的不可变 ID、事故 ID、手册版本、脱敏参数和执行请求标识；执行中记录开始时间与步骤状态；结束后保存输出位置、摘要、退出码和验证结果。输出路径不是永远有效的证据，还需要保留周期与访问权限。只有一行“执行成功”，未来无法判断在哪台机器、用哪一版脚本收集了什么。

步骤状态可以分为待执行、执行中、成功、明确失败和结果未知。明确失败表示知道操作没有达到目标；结果未知表示执行器失联、超时或响应丢失，无法确定外部动作是否生效。把未知强行归到失败，会诱导系统无条件重做；把未知归到成功，则可能掩盖未完成工作。恢复逻辑必须先查询实际资源，再决定下一步。

如果动作本身能够接收幂等标识，重复请求可以返回同一操作结果。若外部系统不支持，编排器应设计可识别的资源命名、查询与校验路径，并明确仍存在的窗口。不能因为本地表里有唯一键，就宣称任意外部命令都实现了恰好执行一次。

### 租约过期以后，旧执行者可能还活着

一个任务取得十分钟锁，随后网络隔离。调度器认为锁到期，派新工作者继续；旧工作者其实仍在机器上运行。现在两个执行者都可能修改同一对象。延长租约只能降低概率，不能从逻辑上消除这种情况。

Fencing token（隔离代次）是一种把“哪一代执行者仍有效”交给受控资源检查的办法：新执行者拿到更高代次，目标拒绝旧代次写入。但前提是目标或执行网关真的校验该代次；只在日志里写一个数字没有隔离效果。若远端命令无法接受这种控制，高风险步骤就需要更保守的人工恢复与单点执行边界，而不是假装分布式锁已经万能。

### 补偿不是时间倒流

部署旧版本、重新挂载卷、恢复旧配置，可以是补偿动作，但每一种都有前置条件。比如你已发送通知，补偿通常是发送更正通知，而不是让接收者忘记原消息；你已删除未备份文件，就不存在简单的反向命令。设计手册时先把动作分为可直接撤销、可补偿、不可逆，再决定允许的自动化等级。

补偿也可能失败，因此要记录其自身状态、错误与影响面。不要在失败分支里递归调用同一个修复流程，直到系统越来越混乱。一次主要动作失败后，最多执行哪些补偿、什么情况下停止、谁负责接管，都应写成明确规则。值班者看到的应是“当前资源状态与下一安全动作”，而不是一堆互相覆盖的绿色与红色记录。

### 只读采集也需要预算与脱敏

读取全部日志可能占用磁盘、网络与敏感数据处理预算；对大目录递归统计也可能产生明显 I/O。给采集步骤设置时间窗、文件数量、单文件字节上限和总输出上限；先取摘要，再按证据需要扩大。不要把“只读”理解为无成本或不涉及隐私。

错误消息、工单文本和日志正文都可能含访问令牌、个人信息或恶意提示。进入模型之前先脱敏和裁剪，执行器只接受固定结构与白名单动作。保留原始敏感证据时使用受控位置，公共学习仓库仅存虚构样本、脱敏结构和可复现步骤。审批者需要知道模型依据了哪些证据，但不必看到所有秘密明文。

### 影子运行怎样证明建议真的有价值

影子模式只计算建议，不执行生产动作。选定一段代表性告警数据，记录当时可见的证据，按时间顺序回放，而不是让模型提前看到未来恢复结论。对照人工标注，分析误建议、漏建议、升级人工和证据不足四种情况。把所有无法判断样本剔除，会人为抬高正确率。

开放低风险自动化前，应定义明确的收益与停止门槛：减少多少重复诊断时间，是否误操作，输出是否完整，失败能否安全接管。生产数据分布与历史样本不同，持续观察仍然必要；当新的告警类型或外部 API 版本出现，先退回建议或人工路径，不让旧规则未经验证继续执行。

### 面试追问：如何防止一个合法事件触发全网重启

第一层检查事件身份和来源，防伪造与重复；第二层验证目标集合，限制单次最多影响多少资源并核对故障域；第三层检查动作白名单、审批和时效；第四层按资源互斥与容量预算调度；第五层执行后验证并在失败时停止扩批。各层有不同证据，不能只回答“加个审批”。

再追问“审批通过后机器换了怎么办”，应回答执行前按不可变资源 ID 重核，目标变化使原批准失效。追问“监控平台也故障怎么办”，应回答观测缺失不能被当作健康，高风险自动恢复暂停并保留人工接管路径。能讲出这些拒绝条件，才说明你设计的是受控自动化，而不是一条能把事故放大的快捷通道。

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
