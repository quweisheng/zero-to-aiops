# Runbook

## 官方资料

- [AWS Systems Manager - Creating your own runbooks](https://docs.aws.amazon.com/systems-manager/latest/userguide/automation-documents.html)
- [AWS Systems Manager - Authoring Automation runbooks](https://docs.aws.amazon.com/systems-manager/latest/userguide/automation-authoring-runbooks.html)
- [Google SRE Book - The Evolution of Automation at Google](https://sre.google/sre-book/automation-at-google/)
- [Atlassian - DevOps runbook template](https://www.atlassian.com/software/confluence/templates/devops-runbook)

> 学习说明：本篇把 runbook 当成“可执行的运维知识单元”来学。先写人工 runbook，再逐步把安全、重复、低风险的步骤自动化。

## 为什么要学

Runbook 是把个人经验变成团队能力的工具。没有 runbook，值班只能依赖熟人经验；有了 runbook，告警才能对应明确检查、处理、验证和回滚步骤。

## 它解决什么问题

- 固化常见故障处理步骤。
- 降低新人值班风险。
- 把告警和处理动作关联起来。
- 为自动化执行提供结构化流程。
- 为事故复盘提供检查和决策依据。

## 是什么

Runbook 是一份可执行的操作手册，用来指导工程师处理常见告警、故障、变更和维护任务。

好的 runbook 应该让新人也能回答：

- 这个告警是什么意思？
- 先看哪个仪表盘？
- 执行哪些检查命令？
- 什么情况下升级？
- 哪些动作危险，需要审批？
- 处理完如何验证恢复？

AWS Systems Manager 的 Automation runbook 把 runbook 定义为一组按顺序执行的动作和参数。学习阶段可以先写 Markdown runbook，再逐步变成脚本或自动化文档。

## 核心原理

Runbook 的核心是把专家经验标准化：

```text
alert or task
  -> diagnosis steps
  -> decision points
  -> safe actions
  -> verification
  -> escalation
  -> record result
```

它不是知识文章，而是操作流程。每一步都要能执行、能验证。

## Runbook 架构

一份完整 runbook：

```text
metadata
  -> trigger
  -> impact
  -> prerequisites
  -> dashboards
  -> checks
  -> decision tree
  -> actions
  -> rollback
  -> verification
  -> escalation
  -> post-action record
```

## Markdown 模板

````md
# Runbook: order-api HighErrorRate

## 元信息

- 服务: order-api
- 告警: HighErrorRate
- Owner: team-order
- 严重级别: page
- 最近更新: 2026-07-01
- 适用环境: prod

## 触发条件

5 分钟内 order-api 5xx 错误率 > 5%。

## 用户影响

用户可能无法下单，或者订单提交失败。

## 先决条件

- 已登录监控系统。
- 有只读日志权限。
- 有发布系统查看权限。
- 生产变更动作需要 IC 审批。

## 快速判断

1. 打开 Grafana order-api dashboard。
2. 查看错误率、p95 延迟、请求量。
3. 查看最近 30 分钟发布记录。
4. 查看 order-api 错误日志。
5. 查看下游 payment-api 和 MySQL 状态。

## 检查命令

```bash
kubectl get pods -n prod -l app=order-api
kubectl logs -n prod deploy/order-api --since=30m | tail -n 200
```

## 决策树

- 如果错误从发布后开始，评估回滚。
- 如果数据库连接错误增加，检查连接池和慢 SQL。
- 如果下游 payment-api 5xx 增加，升级 payment-api owner。
- 如果只有单个实例异常，摘除或重启该实例。

## 缓解动作

### 回滚

风险：中。

需要审批：是。

```bash
kubectl rollout undo deployment/order-api -n prod
```

### 扩容

风险：低。

需要审批：按团队规则。

```bash
kubectl scale deployment/order-api -n prod --replicas=6
```

## 验证恢复

- 5xx 错误率回到 1% 以下。
- p95 延迟回到 300ms 以下。
- 新告警停止触发。
- 用户工单不再增加。

## 升级条件

- 10 分钟内没有明确缓解方向。
- 影响超过 SEV2。
- 需要数据库、网络、安全团队参与。

## 处理记录

- 执行人:
- 执行动作:
- 结果:
- 后续事项:
````

## 配置重点

Runbook 不是孤立文档，要和告警、仪表盘、权限、自动化连接。

| 配置 | 作用 |
|---|---|
| `runbook_url` | 告警直接链接到 runbook |
| `dashboard_url` | 快速打开仪表盘 |
| `owner` | 找到责任团队 |
| `service` | 关联服务 |
| `severity` | 判断响应级别 |
| `automation_id` | 关联自动化任务 |

Prometheus 告警中配置：

```yaml
annotations:
  summary: "order-api high error rate"
  runbook_url: "https://github.com/quweisheng/zero-to-aiops/tree/main/runbooks/order-api-high-error-rate.md"
  dashboard_url: "https://grafana.example.com/d/order-api"
```

## 从人工到自动化

自动化顺序：

```text
人工文档
  -> 命令脚本
  -> 参数化脚本
  -> 受控自动化
  -> 自助执行
  -> 事件触发但需审批
```

不要一开始就让告警自动重启生产服务。先把只读检查自动化，再把低风险动作自动化。

适合自动化：

- 收集诊断信息。
- 查询最近发布。
- 拉取日志摘要。
- 生成初步报告。
- 检查依赖状态。

谨慎自动化：

- 重启服务。
- 回滚发布。
- 扩容缩容。
- 切流量。

禁止无审批自动化：

- 删除数据。
- 修改权限。
- 清理数据库。
- 关闭安全策略。

## AIOps 中的作用

Runbook 是 AIOps 的行动知识库：

```text
alert
  -> AIOps correlation
  -> retrieve relevant runbook
  -> suggest checks
  -> execute safe diagnostics
  -> human-approved action
  -> record result
```

如果没有 runbook，LLM 只能给通用建议；有 runbook，AIOps 才能基于你的环境给出可执行建议。

## 入门练习：写一个告警 Runbook

目录建议：

```text
runbooks/
  order-api-high-error-rate.md
projects/runbook-lab/
  README.md
  collect_order_api_diagnostics.sh
```

要求：

1. 写一个 `order-api-high-error-rate.md`。
2. 包含触发条件、影响、检查步骤、决策树、缓解动作、验证。
3. 写一个只读诊断脚本。
4. README 说明哪些步骤适合自动化，哪些必须人工审批。

诊断脚本示例：

```bash
#!/usr/bin/env bash
set -euo pipefail

namespace="${1:-prod}"
app="${2:-order-api}"

kubectl get pods -n "$namespace" -l "app=$app"
kubectl top pods -n "$namespace" -l "app=$app" || true
kubectl logs -n "$namespace" "deploy/$app" --since=30m | tail -n 200
```

## 常见错误

### Runbook 只有原理，没有步骤

Runbook 必须能执行。背景知识可以放后面。

### 没有验证恢复

执行动作后必须有验证标准，否则不知道是否真的恢复。

### 没有风险说明

回滚、重启、扩容都有风险，要写清楚审批要求。

### 长期不维护

系统变了，runbook 也要变。每次 incident 之后都要检查 runbook 是否需要更新。

## 学习检查清单

- [ ] 我能写出适用场景、输入参数、前置检查。
- [ ] 我能区分建议动作、禁止动作和高风险动作。
- [ ] 我能为每个动作写验证方式。
- [ ] 我能写回滚步骤。
- [ ] 我能把 runbook 和告警标签关联。
- [ ] 我能判断 runbook 哪些步骤适合自动化。

## 面试题

1. Runbook 是什么？
2. 一个好的 runbook 应该包含哪些部分？
3. 为什么 runbook 必须写验证和回滚？
4. 如何避免 runbook 过期？
5. 哪些 runbook 步骤适合自动化？
6. 告警和 runbook 应该如何关联？
7. Runbook 和 SOP 有什么区别？
8. Runbook 如何支撑 AIOps 自动化闭环？

## 学习证据

学完后，在 GitHub 留下：

- 一份完整 runbook。
- 一个只读诊断脚本。
- 一份告警规则，包含 `runbook_url`。
- README 解释人工步骤和自动化步骤的边界。
