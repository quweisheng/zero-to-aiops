# 事件响应

> 目标：不是知道“故障要处理”，而是能在告警响起后快速声明事件、分级、分配角色、建立时间线、控制沟通节奏、优先缓解用户影响、升级和交接，并把现场记录沉淀成复盘、runbook 和 AIOps 数据。

## 官方资料

优先读这些官方资料：

- [Google SRE Book - Emergency Response](https://sre.google/sre-book/emergency-response/)
- [Google SRE Book - Managing Incidents](https://sre.google/sre-book/managing-incidents/)
- [Google SRE Workbook - Incident Response](https://sre.google/workbook/incident-response/)
- [Google SRE Book - Postmortem Culture: Learning from Failure](https://sre.google/sre-book/postmortem-culture/)
- [Google SRE Book - Effective Troubleshooting](https://sre.google/sre-book/effective-troubleshooting/)
- [Google SRE Workbook - Postmortem Culture](https://sre.google/workbook/postmortem-culture/)

说明：本文基于 Google SRE 的 emergency response、incident command、incident management 和 postmortem 资料，整理成适合 AIOps 知识库落地的事件响应教程。

## 场景开场

线上故障已经发生：

```text
order-api 5xx 错误率 23%
p95 延迟 1800ms
09:02 刚发布过新版本
用户反馈无法下单
```

群里十几个人同时说话：

- 有人说先回滚。
- 有人说先看数据库。
- 有人问影响多少用户。
- 有人追问谁发布的。
- 有人贴日志。
- 有人开始解释根因。
- 没有人记录时间线。

这就是事件响应要解决的问题：不是某一条命令怎么敲，而是让人、信息、动作和沟通在高压下有序起来。

## 一句话人话版

事件响应是故障发生后的组织方法：先明确谁指挥、谁排障、谁沟通、谁记录，再围绕用户影响快速缓解，持续同步状态，最后把过程沉淀成复盘和改进项。

## 小白可能会问

- incident 和普通告警有什么区别？
- incident commander 到底负责什么？
- 为什么故障中不能所有人同时指挥？
- 为什么要先缓解，而不是先追根因？
- 时间线应该记什么？
- SEV1、SEV2、SEV3 怎么分？
- 沟通更新怎么写才不乱？
- 什么时候升级、什么时候拉更多人？
- 事件恢复后是不是就结束了？
- 事件响应材料怎么变成 AIOps 数据？

## 官方知识地图

事件响应可以按这张地图理解：

```text
Detection
  -> alert / user report / synthetic check
  -> triage
  -> incident declaration
  -> severity
  -> roles
     -> Incident Commander
     -> Operations Lead
     -> Communications Lead
     -> Scribe
     -> Subject Matter Experts
  -> incident doc
     -> status
     -> impact
     -> timeline
     -> hypotheses
     -> actions
     -> decisions
  -> mitigation
     -> rollback
     -> failover
     -> disable feature
     -> rate limit
     -> traffic shift
  -> communication
     -> internal updates
     -> stakeholder updates
     -> customer-facing updates
  -> resolution
     -> monitoring
     -> handoff
     -> postmortem
  -> learning
     -> action items
     -> runbook updates
     -> alert improvements
     -> automation
```

初学路线：

```text
declare early
  -> assign roles
  -> write status doc
  -> state impact
  -> mitigate first
  -> update every 15 minutes
  -> record decisions
  -> resolve and monitor
  -> create postmortem inputs
```

## 什么是 Incident

Incident 是正在或已经造成服务影响、需要协调响应的问题。

它不只是“有一条告警”。

| 事件 | 是否一定是 incident | 说明 |
|---|---:|---|
| CPU 高 | 不一定 | 可能无用户影响 |
| SLO 快速燃烧 | 通常是 | 已经或即将影响用户 |
| 用户无法下单 | 是 | 核心功能受损 |
| 单实例重启 | 不一定 | 服务冗余足够时可能只是噪声 |
| 数据丢失风险 | 是 | 影响严重，需要协调 |

一个简单判断：

```text
需要跨人协作、持续跟踪、沟通和记录吗？
需要 -> incident
```

## 事件响应原则

Google SRE Emergency Response 的核心提醒很朴素：事情会坏，关键是人如何回应。正确回应需要准备、训练、测试和持续改进。

事件中最重要的原则：

| 原则 | 含义 |
|---|---|
| 不慌 | 先建立秩序，不在群里乱冲 |
| 早声明 | 不确定也可以先声明 incident |
| 角色清楚 | 一个现场只能有一个 IC |
| 缓解优先 | 先降低用户影响，再深挖根因 |
| 记录事实 | 时间线和决策要实时记 |
| 沟通节奏 | 定期更新，不让信息真空 |
| 快速拉人 | 不要独自扛超出能力的问题 |
| 事后学习 | 恢复后要复盘和改进 |

## 事件生命周期

```text
detected
  -> triaged
  -> declared
  -> investigating
  -> mitigating
  -> monitoring
  -> resolved
  -> postmortem
```

| 状态 | 含义 | 关键输出 |
|---|---|---|
| detected | 发现异常 | 告警或用户反馈 |
| triaged | 初步判断 | 是否 incident、初步影响 |
| declared | 声明事件 | 级别、IC、频道、文档 |
| investigating | 调查中 | 假设、证据、负责人 |
| mitigating | 缓解中 | 回滚、限流、切流、降级 |
| monitoring | 观察恢复 | 指标回落、用户影响消失 |
| resolved | 已恢复 | 结束时间、恢复证据 |
| postmortem | 复盘中 | 时间线、根因、行动项 |

状态变化都要写时间。

## 角色分工

最小角色模型：

| 角色 | 职责 |
|---|---|
| IC Incident Commander | 总指挥，维护全局状态，分配任务，做决策 |
| OL Operations Lead | 技术排障和缓解动作负责人 |
| CL Communications Lead | 对内对外沟通、状态更新 |
| Scribe | 记录时间线、决策、命令、结果 |
| SME Subject Matter Expert | 某个系统的专家，提供支持 |

小团队可以一人兼多角，但要意识到这些职责都存在。

### IC 不应该做什么

IC 不应该陷进具体命令里。

IC 应该关注：

- 当前用户影响是什么？
- 谁在做哪件事？
- 下一步最重要动作是什么？
- 是否需要升级？
- 什么时候下一次更新？
- 是否已经有缓解方案？

如果 IC 自己低头查日志，现场很容易失去节奏。

### OL 做什么

OL 负责技术动作：

- 查 dashboard。
- 查日志。
- 查变更。
- 验证假设。
- 执行或协调回滚、切流、降级。
- 汇报结果给 IC。

### CL 做什么

CL 负责让干系人知道真实状态：

- 内部值班频道更新。
- 业务方更新。
- 客服或客户成功同步。
- 状态页内容。
- 下一次更新时间。

CL 不需要解释所有技术细节，但要准确表达影响、行动和时间。

### Scribe 做什么

Scribe 记录：

- 告警触发时间。
- incident 声明时间。
- 角色分配。
- 假设。
- 命令和动作。
- 结果。
- 决策。
- 沟通更新。
- 恢复时间。

没有时间线，复盘会变成靠记忆争论。

## 严重级别

先用简单分级：

| 级别 | 用户影响 | 响应要求 |
|---|---|---|
| SEV1 | 大面积不可用、核心链路中断、数据安全风险 | 立即响应，持续指挥和沟通 |
| SEV2 | 重要功能受影响，部分用户受损，有绕行或缓解 | 快速响应，定期更新 |
| SEV3 | 小范围影响、内部问题、无明显用户影响 | 工单处理，可排期 |

示例：

```text
SEV1: 支付不可用，超过 30% 下单失败。
SEV2: order-api 错误率升高，约 8% 用户受影响。
SEV3: 后台报表延迟 30 分钟，用户主链路无影响。
```

分级要和组织实际匹配。不要把所有故障都定 SEV1，否则 SEV1 会失去意义。

## 声明 Incident

不要等根因清楚才声明。

声明 incident 的价值：

- 建立指挥链。
- 创建统一频道。
- 创建统一文档。
- 避免多头指挥。
- 让干系人知道哪里看状态。

声明模板：

```text
声明 SEV2 incident：order-api HighErrorRate。
当前影响：约 12% 请求返回 5xx，用户下单受影响。
IC：Alice
OL：Bob
CL：Carol
Scribe：Dave
频道：#inc-20260702-order-api
文档：INC-2026-0702-001
下一次更新：09:30
```

## Incident 文档模板

`incident.md`：

```md
# Incident: order-api HighErrorRate

## 基本信息

- ID: INC-2026-0702-001
- 级别: SEV2
- 服务: order-api
- 开始时间: 2026-07-02 09:10
- 发现方式: Alertmanager OrderApiHighErrorRate
- IC:
- OL:
- CL:
- Scribe:
- 频道:
- 文档负责人:

## 当前状态

- 状态: investigating
- 用户影响:
- 影响范围:
- 当前缓解:
- 下一次更新时间:

## 时间线

| 时间 | 事件 | 负责人 | 证据 |
|---|---|---|---|
| 09:10 | OrderApiHighErrorRate 触发 | oncall | Alertmanager |
| 09:12 | 声明 SEV2 incident | IC | 频道公告 |

## 假设和验证

| 假设 | 验证方式 | 负责人 | 结果 |
|---|---|---|---|
| 最近发布导致错误率升高 | 对比发布前后日志和指标 | OL | 待确认 |

## 决策记录

| 时间 | 决策 | 决策人 | 原因 | 风险 |
|---|---|---|---|---|
| 09:25 | 准备回滚 order-api | IC | 5xx 持续升高且发布相关 | 中 |

## 缓解动作

| 动作 | 负责人 | 风险 | 审批 | 结果 |
|---|---|---|---|---|
| 回滚 order-api 到上一版本 | OL | 中 | 需要 | 待执行 |

## 沟通记录

| 时间 | 渠道 | 内容 |
|---|---|---|
| 09:15 | 内部频道 | 已声明 SEV2，正在确认发布影响 |

## 恢复标准

- 5xx 错误率回到基线。
- p95 延迟回到基线。
- SLO burn rate 恢复到可接受范围。
- 用户反馈停止增加。

## 后续事项

- [ ] 复盘 RCA
- [ ] 更新 order-api runbook
- [ ] 修复告警描述
- [ ] 补充回滚演练
```

## 时间线怎么记

时间线记录事实，不记录情绪。

要记：

- 告警触发。
- 用户反馈。
- 关键指标变化。
- 事件声明。
- 角色分配。
- 假设提出。
- 验证结果。
- 缓解动作。
- 沟通更新。
- 恢复证据。

不要只记：

```text
大家开始排查。
```
更好的写法：

```text
09:18 OL 开始对比 order-api v2026.07.02.1 与上一版本的 5xx 错误日志。
09:23 日志显示新版本在 createOrder 接口出现 database timeout，占 5xx 的 78%。
```

## 排障流程

先问四个问题：

1. 用户影响是什么？
2. 影响范围多大？
3. 从什么时候开始？
4. 那之前发生了什么变化？

推荐顺序：

```text
SLO / symptom dashboard
  -> recent changes
  -> error logs
  -> dependency status
  -> saturation
  -> rollback / failover / degrade
```

不要一开始就沉迷根因细节。事件中最重要的是降低用户影响。

## 缓解优先

事件响应里，根因分析很重要，但不是第一优先级。

优先级：

```text
protect users
  -> stabilize service
  -> preserve evidence
  -> understand root cause
  -> prevent recurrence
```

常见缓解动作：

| 动作 | 适用场景 | 风险 |
|---|---|---|
| 回滚 | 最近发布高度相关 | 可能回滚其他修复 |
| 切流 | 单区域或单集群异常 | 容量压力转移 |
| 限流 | 过载或依赖保护 | 用户请求被拒 |
| 降级 | 非核心功能拖垮核心链路 | 功能体验下降 |
| 关闭 feature flag | 新功能导致故障 | 影响新功能 |
| 扩容 | 资源不足 | 成本和启动时间 |
| 禁用自动化 | 自动化扩大影响 | 人工负担增加 |

缓解动作要记录：

- 谁决定。
- 为什么。
- 风险是什么。
- 是否审批。
- 执行时间。
- 结果如何。

## 沟通节奏

事件中没有更新，会让人默认“没人管”。

SEV1/SEV2 建议固定节奏：

| 级别 | 更新频率 |
|---|---|
| SEV1 | 5 到 15 分钟 |
| SEV2 | 15 到 30 分钟 |
| SEV3 | 视工单节奏 |

状态更新模板：

```text
[09:30] order-api SEV2 更新
当前影响：约 12% 请求返回 5xx，主要影响下单接口。
已确认：错误率从 09:10 开始升高，09:02 有一次 order-api 发布。
正在做：OL 正在准备回滚并评估风险。
下一步：09:35 前完成回滚决策。
下一次更新：09:45。
```

原则：

- 说事实，不说猜测。
- 明确影响。
- 明确正在做什么。
- 明确下一次更新时间。
- 不确定就写不确定。

## 升级和拉人

不要独自扛太久。

需要升级的信号：

- 用户影响扩大。
- 15 到 30 分钟没有进展。
- 需要高权限操作。
- 涉及多个团队。
- 怀疑数据丢失或安全风险。
- 当前值班人员不熟悉系统。
- 自动化或回滚失败。

拉人时要带上下文：

```text
需要数据库 SME 支持。
事件：INC-2026-0702-001 order-api SEV2。
问题：5xx 中 78% 是 database timeout。
已查：发布相关性高，但回滚前需要确认数据库连接数是否异常。
需要你：确认 09:00-09:30 数据库连接池和慢查询状态。
```

不要只发：

```text
快来看看数据库。
```
## 交接

长事件需要跨班交接。

交接必须写清楚：

- 当前状态。
- 用户影响。
- 已执行动作。
- 未完成动作。
- 当前假设。
- 风险点。
- 下一步。
- 联系人。

交接模板：

```text
交接给 EU on-call：
状态：monitoring，错误率已从 23% 降到 0.4%，仍高于基线。
已做：09:42 回滚 order-api 到 v2026.07.01.3。
待做：继续观察 1 小时；如果错误率再次升高，检查 payment-api 依赖。
风险：数据库连接池指标仍有轻微抖动。
文档：INC-2026-0702-001。
```

没有交接的跨时区事件，很容易重复排查或漏掉关键风险。

## 何时 Resolve

不要刚看到指标下降就立即关闭。

恢复标准要提前写清楚：

- 关键 SLI 回到可接受范围。
- 错误预算燃烧停止。
- 业务反馈恢复。
- 缓解动作完成。
- 没有新的高风险异常。
- 负责人同意进入 monitoring 或 resolved。

resolved 后还要：

- 通知干系人。
- 保留 incident 文档。
- 开始 postmortem。
- 追踪后续 action items。

## 事件响应和 RCA 的区别

| 阶段 | 目标 | 关注点 |
|---|---|---|
| 事件响应 | 恢复服务 | 用户影响、缓解、沟通 |
| RCA / 复盘 | 防止复发 | 根因、触发因素、系统性改进 |

事件中可以记录候选根因，但不要让“证明根因”阻碍缓解。

正确顺序：

```text
先让用户恢复。
再解释为什么坏。
最后改系统防止再坏。
```
## AIOps 中的作用

事件响应材料是 AIOps 的高价值数据。

可沉淀字段：

| 数据 | AIOps 用途 |
|---|---|
| 告警时间 | 事件检测训练 |
| 声明时间 | MTTA 分析 |
| 缓解时间 | MTTR 分析 |
| 服务和标签 | 告警聚类 |
| 时间线 | RCA 辅助 |
| 假设和验证 | 根因候选库 |
| 缓解动作 | runbook 推荐 |
| 沟通更新 | 自动摘要训练 |
| action items | 改进追踪 |

AIOps 可以辅助：

- 汇总告警组。
- 补全上下文。
- 推荐 runbook。
- 检索相似事故。
- 生成状态更新草稿。
- 生成 postmortem 初稿。

但高风险决策仍然要由人确认。

## 入门练习：模拟一次 SEV2

场景：

```text
09:10 order-api 5xx 错误率升到 23%
09:02 order-api 刚发布 v2026.07.02.1
p95 延迟从 120ms 升到 1800ms
日志出现 database connection timeout
```

要求：

1. 声明 SEV2。
2. 指定 IC、OL、CL、Scribe。
3. 建立 incident 文档。
4. 写 5 条时间线。
5. 写 2 个假设和验证方式。
6. 写 1 条状态更新。
7. 写 2 个缓解动作和风险。
8. 写 resolved 标准。
9. 写复盘待办。

完成后，你应该得到：

```text
INC-2026-0702-001-order-api.md
```

这就是作品集里非常有价值的 SRE/AIOps 材料。

## 常见错误

### 一开始就追根因

根因重要，但用户还在受影响时，先缓解。

### 没有人指挥

所有人都说话等于没人指挥。必须有 IC。

### IC 深入执行命令

IC 应该维护全局状态，不应该陷入单个终端。

### 没有时间线

没有时间线，复盘只能靠记忆。

### 沟通缺失

技术排障做得再好，干系人不知道进展也会焦虑。

### 过早 resolved

指标刚恢复不等于事件结束。需要观察和明确恢复标准。

### 不做复盘

恢复服务只是第一步。没有复盘，就没有组织学习。

## 常用模板字典

### 声明模板

```text
声明 {severity} incident：{service} {symptom}。
当前影响：{impact}。
IC：{name}
OL：{name}
CL：{name}
Scribe：{name}
频道：{channel}
文档：{doc}
下一次更新：{time}
```

### 状态更新模板

```text
[{time}] {service} {severity} 更新
当前影响：{impact}
已确认：{facts}
正在做：{current_actions}
下一步：{next_steps}
下一次更新：{next_update_time}
```

### 缓解决策模板

```text
决策：{action}
原因：{evidence}
风险：{risk}
审批：{approval}
回滚方案：{rollback}
负责人：{owner}
```

### 交接模板

```text
当前状态：{status}
用户影响：{impact}
已执行：{done}
待执行：{todo}
当前假设：{hypotheses}
风险：{risks}
联系人：{contacts}
文档：{doc}
```

## 面试怎么讲

事件响应是故障发生后的组织方法，核心不是立刻证明根因，而是快速建立指挥链、明确角色、记录时间线、降低用户影响并保持沟通。一般会有 Incident Commander 负责全局指挥，Operations Lead 负责技术排障和缓解，Communications Lead 负责状态更新，Scribe 负责记录事实和决策。

我会尽早声明 incident，按用户影响分 SEV，先看 SLO 和用户症状，再查最近变更、日志、依赖和资源饱和。处理过程中优先缓解，比如回滚、切流、限流、降级或关闭 feature flag，同时记录每个动作的原因、风险和结果。事件恢复后不能直接结束，要进入 monitoring、发送恢复通知，并把时间线、假设、缓解动作和遗留问题交给 postmortem、runbook 和 AIOps 知识库。

## 学习检查清单

- [ ] 我能解释 incident 和普通告警的区别。
- [ ] 我能说明为什么要尽早声明 incident。
- [ ] 我能说清 IC、OL、CL、Scribe 的职责。
- [ ] 我能设计 SEV1/SEV2/SEV3 分级。
- [ ] 我能写 incident 声明。
- [ ] 我能填写 incident 文档模板。
- [ ] 我能记录时间线、假设、决策和缓解动作。
- [ ] 我能写一条清晰状态更新。
- [ ] 我能解释为什么缓解优先于根因证明。
- [ ] 我能判断什么时候升级和拉人。
- [ ] 我能写交接模板。
- [ ] 我能说明事件响应材料如何进入 AIOps。

## 面试题

1. 什么是 incident？
2. incident 和 alert 有什么区别？
3. Incident Commander 负责什么？
4. 为什么事件中要有 Communications Lead？
5. 为什么要有 Scribe？
6. SEV1、SEV2、SEV3 如何区分？
7. 为什么要尽早声明 incident？
8. 为什么故障中先缓解而不是先追根因？
9. 时间线应该记录哪些内容？
10. 一条好的状态更新包含什么？
11. 什么时候应该升级或拉更多人？
12. 交接时必须交代哪些内容？
13. resolved 的标准是什么？
14. 事件响应和 RCA 有什么区别？
15. AIOps 如何利用 incident 文档？

## 学习证据

学完后，在 GitHub 留下这些证据：

- 一份模拟 SEV2 incident 文档。
- 一条 incident 声明消息。
- 至少 5 条时间线记录。
- 至少 2 个假设和验证结果。
- 至少 2 个缓解动作和风险说明。
- 一条状态更新。
- 一条交接记录。
- 一份 resolved 标准。
- README 说明 incident 数据如何沉淀到 AIOps 知识库。
