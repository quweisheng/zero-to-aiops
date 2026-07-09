# RCA 根因分析

> 目标：不是写一句“根因是人为失误”，而是能基于时间线、指标、日志、变更、决策和用户影响做无责复盘，区分触发因素、直接原因、促成因素和系统性缺口，产出有 owner、截止时间和验证方式的行动项，并把 RCA 反哺告警、Runbook、变更流程和 AIOps 知识库。

## 官方资料

优先读这些 Google SRE 官方资料：

- [Google SRE Book - Postmortem Culture: Learning from Failure](https://sre.google/sre-book/postmortem-culture/)
- [Google SRE Book - Example Postmortem](https://sre.google/sre-book/example-postmortem/)
- [Google SRE Workbook - Postmortem Culture](https://sre.google/workbook/postmortem-culture/)
- [Google SRE Book - Effective Troubleshooting](https://sre.google/sre-book/effective-troubleshooting/)
- [Google SRE Workbook - Incident Response](https://sre.google/workbook/incident-response/)
- [Google SRE Book - Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/)

说明：本文基于 Google SRE 的无责复盘文化和 postmortem 模板，强调 RCA 不是追责，而是找到系统性改进点。

## 场景开场

故障恢复了。

大家终于能喘口气，但如果只在群里说一句：

```text
原因是某个同学配置写错了，下次注意。
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>原因是某个同学配置写错了，下次注意。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


下个月很可能还会再熬一次夜。

RCA 真正要回答的不是“谁犯错了”，而是：

- 系统为什么允许这个错误造成用户影响？
- 为什么发布前没发现？
- 为什么监控没有更早发现？
- 为什么缓解不够快？
- 为什么 runbook 没覆盖？
- 下次怎样让同类问题更难发生、更容易发现、更快恢复？

## 一句话人话版

RCA 是故障后的证据化学习：用时间线、影响、监控、日志、变更和现场决策，找到系统性改进点，而不是找人背锅。

## 小白可能会问

- RCA 和 postmortem 是一回事吗？
- 根因是不是必须只有一个？
- 为什么不能把根因写成“人为失误”？
- 5 Whys 怎么用，什么时候会误导？
- 促成因素和直接原因有什么区别？
- 行动项怎么写才不是空话？
- 什么样的故障必须做 postmortem？
- RCA 怎么反哺 AIOps？

## 官方知识地图

Google SRE 的 postmortem 文化可以按这张地图理解：

```text
Incident
  -> service restored
  -> collect evidence
     -> timeline
     -> metrics
     -> logs
     -> deploys
     -> decisions
     -> communications
  -> postmortem
     -> summary
     -> impact
     -> detection
     -> response
     -> timeline
     -> root causes
     -> contributing factors
     -> what went well
     -> what went poorly
     -> where we got lucky
     -> action items
  -> learning
     -> monitoring improvement
     -> runbook update
     -> CI/CD guardrail
     -> automation
     -> training
     -> architecture change
  -> AIOps feedback
     -> root cause taxonomy
     -> historical incident retrieval
     -> alert enrichment
     -> runbook recommendation
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Incident</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; service restored</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; collect evidence</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>     -&gt; timeline</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>     -&gt; metrics</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 6 行 | <code>     -&gt; logs</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 7 行 | <code>     -&gt; deploys</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 8 行 | <code>     -&gt; decisions</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 9 行 | <code>     -&gt; communications</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 10 行 | <code>  -&gt; postmortem</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 11 行 | <code>     -&gt; summary</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 12 行 | <code>     -&gt; impact</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 13 行 | <code>     -&gt; detection</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 14 行 | <code>     -&gt; response</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 15 行 | <code>     -&gt; timeline</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 16 行 | <code>     -&gt; root causes</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 17 行 | <code>     -&gt; contributing factors</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 18 行 | <code>     -&gt; what went well</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 19 行 | <code>     -&gt; what went poorly</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 20 行 | <code>     -&gt; where we got lucky</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 21 行 | <code>     -&gt; action items</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 22 行 | <code>  -&gt; learning</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 23 行 | <code>     -&gt; monitoring improvement</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 24 行 | <code>     -&gt; runbook update</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 25 行 | <code>     -&gt; CI/CD guardrail</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 26 行 | <code>     -&gt; automation</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 27 行 | <code>     -&gt; training</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 28 行 | <code>     -&gt; architecture change</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 29 行 | <code>  -&gt; AIOps feedback</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 30 行 | <code>     -&gt; root cause taxonomy</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 31 行 | <code>     -&gt; historical incident retrieval</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 32 行 | <code>     -&gt; alert enrichment</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 33 行 | <code>     -&gt; runbook recommendation</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


初学路线：

```text
start from incident timeline
  -> write impact
  -> calculate detection and recovery times
  -> identify direct cause
  -> list contributing factors
  -> ask why defenses failed
  -> write action items
  -> assign owner and due date
  -> verify completion
  -> update runbook and alerts
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>start from incident timeline</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; write impact</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; calculate detection and recovery times</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>  -&gt; identify direct cause</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>  -&gt; list contributing factors</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 6 行 | <code>  -&gt; ask why defenses failed</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 7 行 | <code>  -&gt; write action items</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 8 行 | <code>  -&gt; assign owner and due date</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 9 行 | <code>  -&gt; verify completion</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 10 行 | <code>  -&gt; update runbook and alerts</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


## RCA、Postmortem、复盘

这些词常混用，但重点不同：

| 名词 | 重点 |
|---|---|
| RCA | 分析为什么发生 |
| Postmortem | 记录事故、影响、响应、原因和行动项 |
| 复盘 | 团队学习和改进讨论 |

好的 postmortem 包含 RCA，但不止 RCA。

它还包括：

- 用户影响。
- 检测方式。
- 响应过程。
- 做得好的地方。
- 做得不好的地方。
- 行动项。

## 无责复盘

Google SRE 强调 postmortem 应该是学习文化的一部分，而不是惩罚工具。

无责不是没有责任。

无责的意思是：

```text
不把复杂系统故障简化成某个人的问题。
把注意力放在系统为什么允许错误扩大。
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>不把复杂系统故障简化成某个人的问题。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>把注意力放在系统为什么允许错误扩大。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


坏写法：

```text
根因：开发人员配置错误。
行动项：以后小心。
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>根因：开发人员配置错误。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>行动项：以后小心。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


好写法：

```text
直接原因：新版本连接池 max connections 配置过低。
促成因素：
- CI 没有配置范围校验。
- 灰度流量不足，没有暴露连接池耗尽。
- 告警没有关联最近发布。
- Runbook 没有配置 diff 检查步骤。
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>直接原因：新版本连接池 max connections 配置过低。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>促成因素：</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>- CI 没有配置范围校验。</code> | 列表项，表示一个要点、条件、文件或检查项。 |
| 第 4 行 | <code>- 灰度流量不足，没有暴露连接池耗尽。</code> | 列表项，表示一个要点、条件、文件或检查项。 |
| 第 5 行 | <code>- 告警没有关联最近发布。</code> | 列表项，表示一个要点、条件、文件或检查项。 |
| 第 6 行 | <code>- Runbook 没有配置 diff 检查步骤。</code> | 列表项，表示一个要点、条件、文件或检查项。 |


## 什么时候必须写 Postmortem

不是每个小问题都要写长文档，但这些情况应该写：

- SEV1 / SEV2。
- 用户明显受影响。
- SLO 错误预算消耗显著。
- 数据丢失或安全风险。
- 恢复时间超出预期。
- 告警没发现，用户先发现。
- 重复发生的问题。
- 响应过程混乱。
- 需要跨团队行动项。

轻量事件可以写 mini-postmortem，但不能完全不沉淀。

## RCA 的输入

不要凭记忆写 RCA。先收集证据。

| 输入 | 用途 |
|---|---|
| 告警 | 发现时间、触发条件 |
| SLO / SLI | 用户影响和预算消耗 |
| 指标 | 错误率、延迟、流量、饱和度 |
| 日志 | 错误类型、异常堆栈 |
| traces | 请求路径和依赖 |
| 发布记录 | 最近变更 |
| 配置 diff | 变更细节 |
| incident 时间线 | 响应过程 |
| 沟通记录 | 状态更新和决策 |
| runbook 使用记录 | 文档是否有效 |
| 工单和用户反馈 | 用户影响 |

RCA 的质量上限取决于证据质量。

## Postmortem 模板

````md
# Postmortem: order-api HighErrorRate

## 摘要

2026-07-02 09:10 至 09:42，order-api 5xx 错误率升高，导致部分用户下单失败。团队在 09:12 声明 SEV2，09:35 回滚新版本，09:42 指标恢复。

## 影响

- 影响服务: order-api
- 影响用户: 约 12% 下单请求失败
- 影响时长: 32 分钟
- SEV: SEV2
- SLO 影响: 消耗 30 天错误预算约 3.2%

## 检测

- 发现方式: Alertmanager OrderApiHighErrorRate
- 告警触发时间: 09:10
- Incident 声明时间: 09:12
- 检测是否及时: 是
- 检测缺口: 告警没有自动关联最近发布链接

## 响应

- IC:
- OL:
- CL:
- Scribe:
- 缓解动作: 回滚 order-api 到上一版本
- 恢复时间: 09:42
- 响应缺口: Runbook 缺少“检查配置 diff”步骤

## 时间线

| 时间 | 事件 | 证据 |
|---|---|---|
| 09:02 | order-api 发布 v2026.07.02.1 | GitHub Actions |
| 09:10 | HighErrorRate 告警触发 | Alertmanager |
| 09:12 | 声明 SEV2 incident | Incident channel |
| 09:20 | 日志显示 database timeout 占 5xx 的 78% | Loki |
| 09:25 | 确认连接池配置低于基线 | Config diff |
| 09:35 | 执行回滚 | Deployment event |
| 09:42 | 错误率恢复到基线 | Prometheus |

## 直接原因

新版本将 order-api 数据库连接池 max connections 配置从 100 降到 20，在生产流量下连接池耗尽，导致请求出现 database timeout 和 5xx。

## 促成因素

- CI 没有校验连接池配置范围。
- 灰度阶段流量太小，没有暴露连接池耗尽。
- 告警通知没有展示最近发布。
- Runbook 没有配置 diff 检查步骤。

## 做得好的地方

- SLO 相关告警及时触发。
- 团队 2 分钟内声明 SEV2。
- 回滚流程可用。

## 做得不好的地方

- 没有发布前配置校验。
- Runbook 不完整。
- 灰度验证没有覆盖真实峰值。

## Where we got lucky

- 故障发生在工作时间。
- 回滚没有触发数据迁移兼容问题。

## 行动项

| 行动项 | 类型 | Owner | 截止时间 | 验证方式 |
|---|---|---|---|---|
| 在 CI 中增加连接池配置范围校验 | prevention | team-order | 2026-07-09 | 错误配置 PR 被拦截 |
| 告警通知增加最近发布链接 | detection | platform | 2026-07-10 | 告警消息包含 deploy_url |
| 更新 order-api HighErrorRate runbook | response | team-order | 2026-07-05 | 演练通过 |
| 灰度增加高峰流量回放检查 | prevention | platform | 2026-07-20 | 发布检查报告包含连接池指标 |
````

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code># Postmortem: order-api HighErrorRate</code> | Markdown 标题行，用来组织文档层级。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 3 行 | <code>## 摘要</code> | Markdown 标题行，用来组织文档层级。 |
| 第 4 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 5 行 | <code>2026-07-02 09:10 至 09:42，order-api 5xx 错误率升高，导致部分用户下单失败。团队在 09:12 声明 SEV2，09:35 回滚新版本，09:42 指标恢复。</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 6 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 7 行 | <code>## 影响</code> | Markdown 标题行，用来组织文档层级。 |
| 第 8 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 9 行 | <code>- 影响服务: order-api</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 10 行 | <code>- 影响用户: 约 12% 下单请求失败</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 11 行 | <code>- 影响时长: 32 分钟</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 12 行 | <code>- SEV: SEV2</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 13 行 | <code>- SLO 影响: 消耗 30 天错误预算约 3.2%</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 14 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 15 行 | <code>## 检测</code> | Markdown 标题行，用来组织文档层级。 |
| 第 16 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 17 行 | <code>- 发现方式: Alertmanager OrderApiHighErrorRate</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 18 行 | <code>- 告警触发时间: 09:10</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 19 行 | <code>- Incident 声明时间: 09:12</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 20 行 | <code>- 检测是否及时: 是</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 21 行 | <code>- 检测缺口: 告警没有自动关联最近发布链接</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 22 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 23 行 | <code>## 响应</code> | Markdown 标题行，用来组织文档层级。 |
| 第 24 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 25 行 | <code>- IC:</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 26 行 | <code>- OL:</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 27 行 | <code>- CL:</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 28 行 | <code>- Scribe:</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 29 行 | <code>- 缓解动作: 回滚 order-api 到上一版本</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 30 行 | <code>- 恢复时间: 09:42</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 31 行 | <code>- 响应缺口: Runbook 缺少“检查配置 diff”步骤</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 32 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 33 行 | <code>## 时间线</code> | Markdown 标题行，用来组织文档层级。 |
| 第 34 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 35 行 | <code>&#124; 时间 &#124; 事件 &#124; 证据 &#124;</code> | Markdown 表格行，用来对齐展示字段和说明。 |
| 第 36 行 | <code>&#124;---&#124;---&#124;---&#124;</code> | Markdown 表格行，用来对齐展示字段和说明。 |
| 第 37 行 | <code>&#124; 09:02 &#124; order-api 发布 v2026.07.02.1 &#124; GitHub Actions &#124;</code> | Markdown 表格行，用来对齐展示字段和说明。 |
| 第 38 行 | <code>&#124; 09:10 &#124; HighErrorRate 告警触发 &#124; Alertmanager &#124;</code> | Markdown 表格行，用来对齐展示字段和说明。 |
| 第 39 行 | <code>&#124; 09:12 &#124; 声明 SEV2 incident &#124; Incident channel &#124;</code> | Markdown 表格行，用来对齐展示字段和说明。 |
| 第 40 行 | <code>&#124; 09:20 &#124; 日志显示 database timeout 占 5xx 的 78% &#124; Loki &#124;</code> | Markdown 表格行，用来对齐展示字段和说明。 |
| 第 41 行 | <code>&#124; 09:25 &#124; 确认连接池配置低于基线 &#124; Config diff &#124;</code> | Markdown 表格行，用来对齐展示字段和说明。 |
| 第 42 行 | <code>&#124; 09:35 &#124; 执行回滚 &#124; Deployment event &#124;</code> | Markdown 表格行，用来对齐展示字段和说明。 |
| 第 43 行 | <code>&#124; 09:42 &#124; 错误率恢复到基线 &#124; Prometheus &#124;</code> | Markdown 表格行，用来对齐展示字段和说明。 |
| 第 44 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 45 行 | <code>## 直接原因</code> | Markdown 标题行，用来组织文档层级。 |
| 第 46 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 47 行 | <code>新版本将 order-api 数据库连接池 max connections 配置从 100 降到 20，在生产流量下连接池耗尽，导致请求出现 database timeout 和 5xx。</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 48 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 49 行 | <code>## 促成因素</code> | Markdown 标题行，用来组织文档层级。 |
| 第 50 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 51 行 | <code>- CI 没有校验连接池配置范围。</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 52 行 | <code>- 灰度阶段流量太小，没有暴露连接池耗尽。</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 53 行 | <code>- 告警通知没有展示最近发布。</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 54 行 | <code>- Runbook 没有配置 diff 检查步骤。</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 55 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 56 行 | <code>## 做得好的地方</code> | Markdown 标题行，用来组织文档层级。 |
| 第 57 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 58 行 | <code>- SLO 相关告警及时触发。</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 59 行 | <code>- 团队 2 分钟内声明 SEV2。</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 60 行 | <code>- 回滚流程可用。</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 61 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 62 行 | <code>## 做得不好的地方</code> | Markdown 标题行，用来组织文档层级。 |
| 第 63 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 64 行 | <code>- 没有发布前配置校验。</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 65 行 | <code>- Runbook 不完整。</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 66 行 | <code>- 灰度验证没有覆盖真实峰值。</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 67 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 68 行 | <code>## Where we got lucky</code> | Markdown 标题行，用来组织文档层级。 |
| 第 69 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 70 行 | <code>- 故障发生在工作时间。</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 71 行 | <code>- 回滚没有触发数据迁移兼容问题。</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 72 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 73 行 | <code>## 行动项</code> | Markdown 标题行，用来组织文档层级。 |
| 第 74 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 75 行 | <code>&#124; 行动项 &#124; 类型 &#124; Owner &#124; 截止时间 &#124; 验证方式 &#124;</code> | Markdown 表格行，用来对齐展示字段和说明。 |
| 第 76 行 | <code>&#124;---&#124;---&#124;---&#124;---&#124;---&#124;</code> | Markdown 表格行，用来对齐展示字段和说明。 |
| 第 77 行 | <code>&#124; 在 CI 中增加连接池配置范围校验 &#124; prevention &#124; team-order &#124; 2026-07-09 &#124; 错误配置 PR 被拦截 &#124;</code> | Markdown 表格行，用来对齐展示字段和说明。 |
| 第 78 行 | <code>&#124; 告警通知增加最近发布链接 &#124; detection &#124; platform &#124; 2026-07-10 &#124; 告警消息包含 deploy_url &#124;</code> | Markdown 表格行，用来对齐展示字段和说明。 |
| 第 79 行 | <code>&#124; 更新 order-api HighErrorRate runbook &#124; response &#124; team-order &#124; 2026-07-05 &#124; 演练通过 &#124;</code> | Markdown 表格行，用来对齐展示字段和说明。 |
| 第 80 行 | <code>&#124; 灰度增加高峰流量回放检查 &#124; prevention &#124; platform &#124; 2026-07-20 &#124; 发布检查报告包含连接池指标 &#124;</code> | Markdown 表格行，用来对齐展示字段和说明。 |


## 根因不是唯一一个

复杂系统事故通常不是单一原因，而是多个防线同时失效。

可以分层：

| 层级 | 示例 |
|---|---|
| 触发因素 | 新版本发布 |
| 直接原因 | 连接池配置过低 |
| 促成因素 | CI 未校验、灰度不足 |
| 检测缺口 | 告警缺少发布上下文 |
| 响应缺口 | Runbook 缺配置 diff 检查 |
| 系统性问题 | 配置变更缺少自动化护栏 |

不要为了文档简洁，把这些都压成“开发配置错误”。

## 5 Whys

5 Whys 是有用工具，但不要机械使用。

示例：

```text
问题：为什么 order-api 5xx 升高？
1. 因为请求出现 database timeout。
2. 为什么 timeout？连接池耗尽。
3. 为什么连接池耗尽？新版本 max connections 配置过低。
4. 为什么配置过低还能发布？CI 没有配置范围校验。
5. 为什么没有校验？配置项没有 owner 和策略基线。
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>问题：为什么 order-api 5xx 升高？</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>1. 因为请求出现 database timeout。</code> | 编号步骤，表示学习或操作时应该按顺序执行。 |
| 第 3 行 | <code>2. 为什么 timeout？连接池耗尽。</code> | 编号步骤，表示学习或操作时应该按顺序执行。 |
| 第 4 行 | <code>3. 为什么连接池耗尽？新版本 max connections 配置过低。</code> | 编号步骤，表示学习或操作时应该按顺序执行。 |
| 第 5 行 | <code>4. 为什么配置过低还能发布？CI 没有配置范围校验。</code> | 编号步骤，表示学习或操作时应该按顺序执行。 |
| 第 6 行 | <code>5. 为什么没有校验？配置项没有 owner 和策略基线。</code> | 编号步骤，表示学习或操作时应该按顺序执行。 |


行动项：

```text
给连接池配置建立 owner、范围基线和 CI 校验。
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>给连接池配置建立 owner、范围基线和 CI 校验。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


注意：

- 5 Whys 不一定正好 5 层。
- 可能有多个分支。
- 不要停在人为错误。
- 每个 why 都要有证据。

## 鱼骨图文字版

可以按维度展开促成因素：

```text
人员: 新人不熟悉连接池配置风险
流程: 发布前没有配置校验
工具: CI 未检查配置范围
监控: 告警没有关联发布信息
架构: 灰度流量不足以暴露连接池耗尽
文档: Runbook 缺少配置 diff 检查
权限: 回滚审批路径清楚，未造成延迟
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>人员: 新人不熟悉连接池配置风险</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>流程: 发布前没有配置校验</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>工具: CI 未检查配置范围</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>监控: 告警没有关联发布信息</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>架构: 灰度流量不足以暴露连接池耗尽</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 6 行 | <code>文档: Runbook 缺少配置 diff 检查</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 7 行 | <code>权限: 回滚审批路径清楚，未造成延迟</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


这能帮助团队看到系统性问题，而不是只盯一个技术点。

## 行动项质量

好的行动项必须具体、可验证、有 owner、有截止时间。

坏行动项：

```text
以后发布前仔细检查。
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>以后发布前仔细检查。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


好行动项：

```text
在 CI 中增加连接池 max connections 范围校验，低于 80 时阻止合并。
Owner: team-order
截止时间: 2026-07-09
验证方式: 提交错误配置 PR，CI 必须失败。
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>在 CI 中增加连接池 max connections 范围校验，低于 80 时阻止合并。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>Owner: team-order</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>截止时间: 2026-07-09</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>验证方式: 提交错误配置 PR，CI 必须失败。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


行动项字段：

| 字段 | 说明 |
|---|---|
| 描述 | 具体要做什么 |
| 类型 | prevention / detection / mitigation / documentation / training |
| Owner | 单一负责人 |
| 截止时间 | 明确日期 |
| 验证方式 | 如何证明完成 |
| 状态 | open / done / dropped |

## 行动项分类

| 类型 | 目标 | 示例 |
|---|---|---|
| prevention | 防止再次发生 | CI 配置校验 |
| detection | 更早发现 | 增加 SLO burn alert |
| mitigation | 更快缓解 | 一键回滚脚本 |
| documentation | 改进知识 | 更新 runbook |
| automation | 减少人工 | 自动关联发布记录 |
| training | 提升能力 | 事件响应演练 |
| architecture | 改系统设计 | 隔离连接池配置 |

行动项不要全堆在 prevention。检测和缓解同样重要。

## 度量指标

RCA 可以沉淀这些指标：

| 指标 | 含义 |
|---|---|
| MTTD | 从故障开始到检测 |
| MTTA | 从检测到确认 |
| MTTR | 从检测到恢复 |
| time to declare | 从检测到声明 incident |
| time to mitigate | 从检测到缓解生效 |
| error budget consumed | 消耗的错误预算 |
| action item completion rate | 行动项完成率 |
| repeat incident rate | 重复事故比例 |

这些指标能帮助 AIOps 和 SRE 评估体系是否在进步。

## RCA 与 AIOps

RCA 是 AIOps 的反馈层。

```text
incident
  -> postmortem
  -> root cause taxonomy
  -> action items
  -> updated alerts / runbooks / automation
  -> fewer repeat incidents
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>incident</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; postmortem</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; root cause taxonomy</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>  -&gt; action items</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>  -&gt; updated alerts / runbooks / automation</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 6 行 | <code>  -&gt; fewer repeat incidents</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


可抽取的数据：

| 字段 | 用途 |
|---|---|
| incident_id | 关联事件 |
| service | 服务维度 |
| root_cause_type | 根因分类 |
| trigger | 触发因素 |
| contributing_factors | 促成因素 |
| detection_gap | 检测缺口 |
| response_gap | 响应缺口 |
| mitigation | 缓解动作 |
| action_items | 后续改进 |
| evidence_links | 证据链接 |

AIOps 应用：

- 相似事故检索。
- 根因候选推荐。
- 告警自动补上下文。
- Runbook 推荐。
- Postmortem 草稿生成。
- 重复事故识别。

但模型不能替代证据。RCA 必须回到时间线和事实。

## 入门练习：无责复盘

用这个场景写一份 postmortem：

```text
09:02 order-api 发布新版本。
09:10 5xx 错误率升高到 23%。
09:12 声明 SEV2。
09:20 日志显示 database timeout。
09:25 确认连接池配置错误。
09:35 回滚。
09:42 恢复。
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>09:02 order-api 发布新版本。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>09:10 5xx 错误率升高到 23%。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>09:12 声明 SEV2。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>09:20 日志显示 database timeout。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>09:25 确认连接池配置错误。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 6 行 | <code>09:35 回滚。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 7 行 | <code>09:42 恢复。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


必须包含：

1. 摘要。
2. 用户影响。
3. 检测和响应。
4. 时间线。
5. 直接原因。
6. 至少 3 个促成因素。
7. 做得好的地方。
8. 做得不好的地方。
9. Where we got lucky。
10. 至少 4 个行动项，每个有 owner、截止时间、验证方式。

## 常见错误

### 把根因写成“人为失误”

这会阻止系统学习。继续问系统为什么允许这个错误造成事故。

### 没有证据

RCA 必须基于时间线、指标、日志、变更和决策记录。

### 只有直接原因

直接原因不等于全部根因。要写促成因素和系统性缺口。

### 没有行动项

没有行动项的 RCA 只是事故故事。

### 行动项没有 owner

没有 owner 和截止时间，行动项很容易消失。

### 行动项不可验证

“提高意识”不可验证。CI 校验、告警增强、runbook 更新可验证。

### 只关注技术，不关注检测和响应

为什么没早点发现、为什么恢复慢，同样重要。

## 常用字段字典

### direct cause

直接导致故障表现的原因。

### contributing factor

让故障更容易发生、更难发现或更难恢复的因素。

### detection gap

检测缺口，例如没有告警、告警太慢、告警缺上下文。

### response gap

响应缺口，例如没有 runbook、角色混乱、回滚慢。

### action item

可执行改进项，必须有 owner、截止时间、验证方式。

### MTTD

Mean Time To Detect，平均检测时间。

### MTTR

Mean Time To Resolve / Recover，平均恢复时间。

### blameless

无责，不把复杂系统问题简化成个人问题。

## 面试怎么讲

RCA 的目标不是追责，而是从事故中学习并减少重复事故。我会先收集证据：告警、SLO 影响、指标、日志、发布记录、配置 diff、incident 时间线和沟通记录。然后在 postmortem 中写清楚摘要、影响、检测、响应、时间线、直接原因、促成因素、做得好的地方、做得不好的地方和行动项。

我不会把根因写成“人为失误”。更好的分析是继续追问系统为什么允许这个错误发生、为什么没提前发现、为什么缓解不够快。行动项必须具体、可验证、有 owner 和截止时间，比如“在 CI 中增加连接池配置范围校验”。AIOps 中，RCA 是反馈层，可以沉淀根因分类、相似事故、检测缺口、runbook 更新和自动化候选，但所有结论都必须回到证据。

## 学习检查清单

- [ ] 我能解释 RCA、postmortem、复盘的关系。
- [ ] 我能说明无责复盘的意义。
- [ ] 我能列出 RCA 需要的证据。
- [ ] 我能写 incident 摘要和影响。
- [ ] 我能写时间线。
- [ ] 我能区分直接原因和促成因素。
- [ ] 我能用 5 Whys 找到系统性缺口。
- [ ] 我能写高质量行动项。
- [ ] 我能给行动项分 owner、截止时间、验证方式。
- [ ] 我能解释 MTTD、MTTA、MTTR。
- [ ] 我能说明 RCA 如何反哺 runbook、告警和 AIOps。

## 面试题

1. RCA 的目标是什么？
2. 为什么 RCA 不是追责？
3. Postmortem 应该包含哪些部分？
4. 为什么不能把根因写成“人为失误”？
5. 直接原因和促成因素有什么区别？
6. 5 Whys 怎么用？
7. 5 Whys 有什么风险？
8. 什么样的行动项是高质量行动项？
9. MTTD、MTTA、MTTR 分别是什么？
10. 为什么检测缺口和响应缺口也要写进 RCA？
11. RCA 如何更新 runbook？
12. RCA 如何改进告警？
13. RCA 如何成为 AIOps 知识库数据？
14. 如何识别重复事故？
15. 如何衡量行动项是否真的完成？

## 学习证据

学完后，在 GitHub 留下这些证据：

- 一份完整 postmortem 文档。
- 一条证据化时间线。
- 至少 1 个直接原因。
- 至少 3 个促成因素。
- 至少 4 个行动项。
- 每个行动项都有 owner、截止时间、验证方式。
- 一份根因分类表。
- README 说明这次 RCA 如何更新告警、runbook 和 AIOps 数据。
