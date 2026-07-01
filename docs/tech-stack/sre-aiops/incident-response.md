# 事件响应

## 官方资料

- [Google SRE Book - Managing Incidents](https://sre.google/sre-book/managing-incidents/)
- [Google SRE Workbook - Incident Response](https://sre.google/workbook/incident-response/)
- [Google SRE Book - Emergency Response](https://sre.google/sre-book/emergency-response/)
- [Atlassian - Major incident management](https://www.atlassian.com/incident-management/itsm/major-incident-management)

> 学习说明：本篇基于 Google SRE 的 incident command 思路，整理成一个适合个人学习和作品集展示的事件响应流程。

## 为什么要学

故障发生时，技术能力只是一部分。谁指挥、谁沟通、谁排查、谁记录、什么时候升级、什么时候回滚，都决定恢复速度。事件响应是把混乱变成有序行动的方法。

## 它解决什么问题

- 明确 incident commander、沟通人、排障人的职责。
- 建立故障分级和升级机制。
- 在故障中持续记录时间线和决策。
- 帮助团队快速恢复服务，而不是争论责任。
- 为事后复盘和 AIOps 数据沉淀提供材料。

## 是什么

事件响应是故障发生后，团队如何组织人、信息、动作和沟通，尽快降低用户影响，并留下可复盘记录。

事件响应不是单纯“技术排障”。它同时包括：

- 判断是否为 incident。
- 指定负责人。
- 组织排障。
- 对外和对内沟通。
- 记录时间线。
- 缓解影响。
- 恢复服务。
- 复盘改进。

## 核心原理

Google SRE Workbook 总结事件响应的基本原则：

- 清晰指挥链。
- 明确定义角色。
- 持续记录调试和缓解过程。
- 尽早声明 incident。

事件响应的目标不是“一开始就找到根因”，而是先控制局面。

```text
detect
  -> declare incident
  -> assign roles
  -> mitigate
  -> communicate
  -> resolve
  -> postmortem
```

## 角色

最小角色模型：

| 角色 | 职责 |
|---|---|
| IC Incident Commander | 总指挥，维护全局状态，分配任务，控制节奏 |
| OL Operations Lead | 负责技术排障和缓解动作 |
| CL Communications Lead | 负责对内对外沟通和状态更新 |
| Scribe | 记录时间线、决策、命令、结果 |

个人学习时可以一人扮演多个角色，但文档里要写清楚“如果是团队场景，角色如何拆分”。

## 严重级别

简单分级：

| 级别 | 用户影响 | 响应要求 |
|---|---|---|
| SEV1 | 大面积不可用、核心链路中断 | 立即响应，持续沟通 |
| SEV2 | 重要功能受影响，有绕行方案 | 快速响应，定期更新 |
| SEV3 | 小范围影响或内部问题 | 工单处理 |

示例：

```text
SEV1: 支付不可用，超过 30% 用户下单失败
SEV2: order-api p95 延迟超过 2s，部分用户受影响
SEV3: 非核心后台任务延迟，用户无感知
```

## 事件状态

| 状态 | 含义 |
|---|---|
| detected | 发现异常 |
| declared | 声明事件 |
| investigating | 调查中 |
| mitigating | 缓解中 |
| monitoring | 观察恢复 |
| resolved | 已恢复 |
| postmortem | 复盘中 |

状态变化要记录时间。

## 事件响应模板

`incident.md`：

```md
# Incident: order-api HighErrorRate

## 基本信息

- ID: INC-2026-0701-001
- 级别: SEV2
- 服务: order-api
- 开始时间: 2026-07-01 09:10
- 发现方式: Alertmanager HighErrorRate
- IC:
- OL:
- CL:

## 当前状态

- 状态: investigating
- 用户影响:
- 临时缓解:
- 下一次更新时间:

## 时间线

| 时间 | 事件 | 负责人 |
|---|---|---|
| 09:10 | Alertmanager 触发 HighErrorRate | oncall |
| 09:12 | 声明 SEV2 incident | IC |

## 假设和验证

| 假设 | 验证方式 | 结果 |
|---|---|---|
| 最近发布导致错误率升高 | 检查 CI/CD 发布记录 | 待确认 |

## 缓解动作

| 动作 | 风险 | 审批 | 结果 |
|---|---|---|---|
| 回滚 order-api | 中 | 需要 | 待执行 |

## 后续事项

- [ ] 补充 runbook
- [ ] 修复告警描述
- [ ] 复盘 RCA
```

## 排障流程

先问四个问题：

1. 用户影响是什么？
2. 影响范围多大？
3. 从什么时候开始？
4. 之前发生了什么变化？

检查顺序：

```text
告警
  -> 仪表盘
  -> 最近变更
  -> 日志
  -> 下游依赖
  -> 资源饱和
  -> 缓解动作
```

不要在没有证据时无限猜根因。

## 沟通节奏

SEV1/SEV2 必须定期更新。

状态更新模板：

```text
[09:30] order-api SEV2 更新
当前影响：约 12% 请求返回 5xx。
已确认：错误率从 09:10 开始升高，09:02 有一次发布。
正在做：OL 正在对比新旧版本错误日志，准备回滚评估。
下一次更新：09:45。
```

原则：

- 说事实，不说猜测。
- 说明下一步。
- 说明下一次更新时间。
- 不确定就写不确定。

## 缓解优先

事件中先恢复服务，再深入根因。

常见缓解动作：

- 回滚发布。
- 扩容。
- 降级非核心功能。
- 切换流量。
- 临时限流。
- 清理明显异常配置。

危险动作必须审批：

- 删除数据。
- 重建数据库。
- 大范围重启。
- 修改网络 ACL。
- 关闭安全策略。

## AIOps 中的作用

事件响应是 AIOps 的执行场景：

```text
alert
  -> AIOps correlation
  -> incident candidate
  -> IC / OL / CL workflow
  -> runbook recommendations
  -> action with approval
  -> postmortem feedback
```

AIOps 可以辅助发现、归并、总结、推荐，但不应该让自动化绕过事件指挥和审批。

## 入门练习：模拟一次 SEV2

目录建议：

```text
projects/incident-response-drill/
  README.md
  incident.md
  timeline.md
  status-updates.md
  postmortem.md
```

场景：

```text
order-api 在 09:10 后 5xx 错误率从 1% 升到 23%，p95 延迟从 120ms 升到 1800ms。
09:02 有一次发布。
```

你要写：

- 是否声明 incident。
- 级别判断。
- 角色分配。
- 时间线。
- 3 次状态更新。
- 缓解动作。
- 复盘事项。

## 常见错误

### 一开始就追根因

根因分析重要，但事件中先缓解用户影响。

### 没有人指挥

多人同时操作会制造混乱。必须有 IC。

### 没有时间线

没有时间线，复盘会变成回忆和争论。

### 沟通缺失

用户和业务方不知道你在处理，就会升级焦虑。

## 学习检查清单

- [ ] 我能解释事件响应的角色分工。
- [ ] 我能写一份 incident timeline。
- [ ] 我能区分检测、响应、缓解、恢复、复盘。
- [ ] 我能说明为什么故障中需要统一指挥。
- [ ] 我能设计升级和沟通规则。
- [ ] 我能把一次故障处理记录转成复盘材料。

## 面试题

1. 事件响应的目标是什么？
2. incident commander 负责什么？
3. 故障中为什么要有专人沟通？
4. 缓解和根治有什么区别？
5. 什么时候应该回滚？
6. 时间线为什么重要？
7. 如何判断 incident 严重等级？
8. AIOps 能在事件响应中提供哪些帮助？

## 学习证据

学完后，在 GitHub 留下：

- 一份 incident 模板。
- 一次模拟事件记录。
- 三条状态更新。
- 一个复盘文档。
- README 总结你如何做 IC、OL、CL。
