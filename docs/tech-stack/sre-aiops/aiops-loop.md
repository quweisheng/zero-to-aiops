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

如果没有 RCA 和行动项，AIOps 只是一次性分析，不是闭环。

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
  changes/
```

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
