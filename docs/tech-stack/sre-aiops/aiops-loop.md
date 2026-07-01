# AIOps 闭环

## 官方资料

- [Microsoft Learn - AIOps and agentic operations in Azure Monitor](https://learn.microsoft.com/en-us/azure/azure-monitor/aiops/aiops-and-agentic-operations)
- [Microsoft Learn - Azure Copilot Observability Agent](https://learn.microsoft.com/en-us/azure/azure-monitor/aiops/observability-agent-overview)
- [IBM - What is AIOps?](https://www.ibm.com/think/topics/aiops)
- [Red Hat - What is AIOps?](https://www.redhat.com/en/topics/ai/what-is-aiops)
- [Google SRE Book](https://sre.google/sre-book/table-of-contents/)

> 学习说明：本篇把前面所有技术串成一个 AIOps 闭环。它不是某个单品工具，而是一条从观测、检测、关联、解释、行动到复盘学习的工程链路。

## 是什么

AIOps 是 AI for IT Operations，用 AI、机器学习、数据分析和自动化来增强 IT 运维。IBM 和 Red Hat 都强调它的目标是让 IT 运营更高效，帮助团队处理复杂性、减少手工工作、加速事件响应。

但对初学者来说，不要把 AIOps 想成“买一个平台”。先把它拆成闭环：

```text
observe
  -> detect
  -> correlate
  -> explain
  -> recommend
  -> act with guardrails
  -> learn
```

## 核心原理

AIOps 的核心不是“AI 自动修一切”，而是把运维数据变成可行动洞察：

| 阶段 | 输入 | 输出 |
|---|---|---|
| 观测 | 指标、日志、链路、事件、变更 | 可查询的数据 |
| 检测 | SLO、规则、异常检测 | 异常或告警 |
| 关联 | 服务拓扑、时间窗口、相似事件 | 事件候选 |
| 解释 | 上下文、历史案例、runbook | 原因候选和证据 |
| 建议 | runbook、策略、模型 | 下一步检查和缓解建议 |
| 行动 | 自动化、审批、权限 | 受控执行 |
| 学习 | RCA、反馈、行动项 | 更新规则、模型、runbook |

Microsoft Learn 对 Azure Monitor 的 AIOps / agentic operations 描述也强调：检测、分析、调查、解释、指导后续行动是一个连接起来的工作流。

## 架构

一个适合个人作品集的 AIOps 闭环：

```text
Linux / Docker service
  -> Prometheus metrics
  -> Grafana dashboard
  -> Alertmanager alert
  -> FastAPI webhook
  -> Redis dedup
  -> MySQL incident store
  -> pandas analysis
  -> scikit-learn anomaly detection
  -> RAG runbook retrieval
  -> OpenAI summary
  -> human approval
  -> Ansible / script action
  -> RCA updates rules and runbooks
```

这个闭环覆盖了你前面学的技术栈。

## 数据层

需要收集：

| 数据 | 工具 | 用途 |
|---|---|---|
| 指标 | Prometheus | SLI、异常检测 |
| 日志 | Loki / Elasticsearch | 错误证据 |
| 链路 | OpenTelemetry | 依赖和延迟 |
| 告警 | Alertmanager | 事件入口 |
| 变更 | GitHub Actions / CI/CD | 根因上下文 |
| Runbook | Markdown / GitHub | 处理知识 |
| RCA | Markdown / MySQL | 学习反馈 |

数据质量决定 AIOps 上限。

## 检测层

先规则，再模型：

```text
SLO burn rate alert
  + static threshold
  + anomaly detection
  -> incident candidate
```

不要一开始就完全依赖机器学习。规则可解释，模型做补充。

示例：

- Prometheus 检测 5xx 错误率。
- scikit-learn 检测延迟模式异常。
- pandas 统计过去 1 小时告警是否明显高于历史。

## 关联层

关联问题：

- 这些告警是不是同一个事故？
- 是否和某次变更有关？
- 是否来自同一个服务或同一个下游？
- 是否和历史事故相似？

简单关联规则：

```text
同一 service
  + 10 分钟时间窗口
  + 相同 dependency
  + 相同 recent change
  -> group as one incident candidate
```

## 解释层

解释必须带证据：

```text
结论: order-api 错误率升高可能与 09:02 发布有关。
证据:
- 09:02 发生 CHG-001 发布。
- 09:10 错误率从 1% 升至 23%。
- 日志出现 database connection timeout。
- order-api runbook 指出该现象需要检查连接池配置。
```

LLM 的职责是组织证据和提出下一步，不是凭空断言。

## 行动层

行动必须有护栏：

| 动作 | 自动化级别 |
|---|---|
| 收集日志 | 可自动 |
| 查询最近变更 | 可自动 |
| 生成摘要 | 可自动 |
| 创建工单 | 可自动或半自动 |
| 扩容 | 建议人工审批 |
| 回滚 | 必须按团队规则审批 |
| 删除数据 | 不应自动 |

Microsoft 的 Observability Agent 文档也强调 controlled-autonomy，即自动关联和调查可以增强效率，但人仍控制决策和动作。

## 学习层

每次 incident 后更新：

- 告警规则。
- runbook。
- RCA。
- 相似案例库。
- 异常检测特征。
- 自动化脚本。
- 权限和审批规则。

这才叫闭环。如果只做检测，没有复盘学习，就不是完整 AIOps。

## 最小作品集项目

项目名：

```text
zero-to-aiops-lab
```

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
```

目标：

1. 启动一个模拟服务。
2. Prometheus 采集指标。
3. Grafana 展示四个黄金信号。
4. Alertmanager 触发告警。
5. FastAPI 接收告警 webhook。
6. Redis 做去重。
7. MySQL 保存 incident。
8. pandas 生成日报。
9. scikit-learn 标记异常。
10. RAG 检索 runbook。
11. OpenAI 生成排障摘要。
12. 人工确认动作。
13. RCA 更新学习记录。

## AIOps 成熟度

| 阶段 | 能力 |
|---|---|
| L0 手工运维 | 人看监控、手工排障 |
| L1 可观测 | 指标、日志、链路、告警齐全 |
| L2 规则治理 | SLO、告警分级、runbook |
| L3 数据分析 | pandas、SQL、异常检测 |
| L4 智能辅助 | LLM 摘要、RAG 检索、相似事故 |
| L5 受控自动化 | 人工审批下自动执行 |
| L6 闭环学习 | RCA 反哺规则、模型、runbook |

你当前学习路线应该先到 L4，再谨慎进入 L5。

## 入门练习：画出自己的 AIOps 闭环

目录建议：

```text
projects/aiops-loop-design/
  README.md
  architecture.md
  data-flow.md
  guardrails.md
```

要求：

- 写出你的观测数据来源。
- 写出告警如何进入系统。
- 写出如何去重和关联。
- 写出如何检索 runbook。
- 写出哪些动作可自动、哪些必须审批。
- 写出 RCA 如何回写到知识库。

## 常见错误

### 把 AIOps 当成聊天机器人

聊天只是交互方式。核心是数据、流程、护栏、反馈。

### 没有 SLO

没有 SLO，就不知道异常是否真的重要。

### 自动化没有审批

生产动作必须有权限和审批边界。

### 没有复盘学习

没有 RCA 和行动项，系统不会变聪明。

## 学习证据

学完后，在 GitHub 留下：

- 一张 AIOps 架构图或文字数据流。
- 一份最小闭环项目说明。
- 一份 guardrails 文档。
- 一次模拟告警从触发到 RCA 的完整记录。

