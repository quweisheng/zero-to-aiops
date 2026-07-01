# RCA 根因分析

## 官方资料

- [Google SRE Book - Postmortem Culture: Learning from Failure](https://sre.google/sre-book/postmortem-culture/)
- [Google SRE Book - Example Postmortem](https://sre.google/sre-book/example-postmortem/)
- [Google SRE Workbook - Incident Response](https://sre.google/workbook/incident-response/)
- [Google SRE Book - Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/)

> 学习说明：本篇基于 Google SRE 的无责复盘文化，强调 RCA 不是追责，而是找到系统性改进点。

## 为什么要学

RCA 的目标不是找人背锅，而是找出系统为什么允许故障发生，并推动改进。AIOps 做根因分析时，也必须建立在证据、时间线、变更、指标和日志之上。

## 它解决什么问题

- 把“感觉原因”变成证据链。
- 识别直接原因、促成因素和系统性问题。
- 形成可执行改进行动项。
- 为相似故障检测和知识库积累材料。
- 帮助团队从故障中学习。

## 是什么

RCA 是 Root Cause Analysis，根因分析。它用于在事故恢复后，系统性分析为什么事故发生、为什么没有更早发现、为什么缓解不够快，以及如何降低再次发生概率。

RCA 的目的：

- 学习。
- 改进系统。
- 改进监控。
- 改进流程。
- 改进 runbook。
- 减少重复事故。

RCA 不是找人背锅。

## 核心原理

Google SRE 强调 postmortem 是学习机会，而不是惩罚。真正的根因往往不止一个：

```text
触发因素
  + 系统缺陷
  + 监控缺口
  + 流程缺口
  + 自动化缺口
  + 文档缺口
  -> incident
```

不要停在“某人操作错了”。要继续问：

- 为什么系统允许这个操作造成事故？
- 为什么没有提前发现？
- 为什么没有自动保护？
- 为什么 runbook 没有覆盖？
- 为什么变更流程没有拦住？

## 架构

RCA 文档结构：

```text
summary
  -> impact
  -> timeline
  -> detection
  -> response
  -> contributing factors
  -> root causes
  -> what went well
  -> what went poorly
  -> action items
  -> owners and due dates
```

## Postmortem 模板

```md
# Postmortem: order-api HighErrorRate

## 摘要

2026-07-01 09:10 至 09:35，order-api 5xx 错误率升高，导致部分用户下单失败。

## 影响

- 影响服务: order-api
- 影响用户: 约 12% 下单请求失败
- 影响时长: 25 分钟
- SEV: SEV2

## 时间线

| 时间 | 事件 |
|---|---|
| 09:02 | order-api 发布版本 2026.07.01.1 |
| 09:10 | HighErrorRate 告警触发 |
| 09:12 | 声明 SEV2 |
| 09:20 | 确认新版本数据库连接池配置异常 |
| 09:25 | 执行回滚 |
| 09:35 | 错误率恢复 |

## 检测

- 如何发现: Alertmanager HighErrorRate
- 是否及时: 是，5 分钟内发现
- 缺口: 告警描述缺少最近发布链接

## 响应

- IC:
- OL:
- CL:
- 缓解动作: 回滚 order-api
- 有效性: 回滚后错误率恢复

## 根因

直接原因：
- 新版本数据库连接池 max connections 配置错误。

促成因素：
- 发布前没有配置校验。
- 灰度阶段流量太小，没有暴露连接池问题。
- Runbook 没有“检查最近发布配置 diff”的步骤。

## 做得好的地方

- 错误率告警及时触发。
- 团队快速声明 SEV2。
- 回滚流程可用。

## 做得不好的地方

- 告警没有自动关联发布记录。
- 配置校验缺失。
- 灰度验证不充分。

## 行动项

| 行动项 | 类型 | Owner | 截止时间 |
|---|---|---|---|
| 为连接池配置增加 CI 校验 | prevention | team-order | 2026-07-08 |
| 告警通知增加最近发布链接 | detection | platform | 2026-07-10 |
| 更新 order-api runbook | response | team-order | 2026-07-05 |
```

## 分析方法

### 5 Whys

问题：为什么 order-api 5xx 升高？

```text
1. 因为数据库连接失败。
2. 为什么连接失败？连接池耗尽。
3. 为什么连接池耗尽？新版本 max connections 配置过低。
4. 为什么配置过低还能发布？CI 没有配置范围校验。
5. 为什么没有校验？配置校验规则没有纳入发布流程。
```

行动项不应该是“开发以后小心”，而是“配置范围校验进入 CI”。

### 鱼骨图文字版

```text
人员: 新人不熟悉连接池配置
流程: 发布前没有配置校验
工具: CI 未检查配置范围
监控: 告警没有关联发布信息
架构: 灰度流量不足以暴露连接池问题
文档: runbook 缺少配置 diff 检查
```

## 行动项分类

好的 RCA 必须产出行动项。

| 类型 | 目标 | 示例 |
|---|---|---|
| prevention | 防止再次发生 | CI 配置校验 |
| detection | 更早发现 | 增加 SLO burn alert |
| mitigation | 更快缓解 | 一键回滚脚本 |
| documentation | 改进知识 | 更新 runbook |
| training | 提升能力 | 事件响应演练 |

行动项必须有 owner 和截止时间。

## AIOps 中的作用

RCA 是 AIOps 的反馈层：

```text
incident
  -> postmortem
  -> root causes
  -> action items
  -> updated rules / runbooks / models
  -> fewer repeat incidents
```

可以用 AI 辅助整理时间线、聚类相似事故、生成复盘初稿，但最终结论必须由人确认。

## 入门练习：写一次无责复盘

目录建议：

```text
projects/rca-postmortem/
  README.md
  postmortem-order-api.md
  action-items.csv
```

场景使用前面的 order-api 事故。

要求：

- 写清楚影响。
- 写时间线。
- 写直接原因和促成因素。
- 至少 5 个行动项。
- 每个行动项都有 owner、类型、截止时间。

## 常见错误

### 把根因写成“人为失误”

人为失误只是现象。继续问系统为什么允许错误造成影响。

### 没有行动项

没有行动项的复盘只是故事。

### 行动项没有 owner

没人负责就不会完成。

### 只关注技术，不关注发现和响应

RCA 要同时分析 detection、response、mitigation。

## 学习检查清单

- [ ] 我能写清事故影响和时间线。
- [ ] 我能区分直接原因和根本原因。
- [ ] 我能用 5 Whys 或因果链分析问题。
- [ ] 我能避免把 RCA 写成责备个人。
- [ ] 我能写出有 owner 和 deadline 的行动项。
- [ ] 我能把 RCA 材料变成 AIOps 知识库输入。

## 面试题

1. RCA 的目的是什么？
2. 根因分析为什么不能只停留在“某人操作错了”？
3. 5 Whys 方法怎么用？
4. 直接原因和根本原因有什么区别？
5. 什么是无责复盘？
6. 行动项应该如何写才可落地？
7. RCA 如何帮助减少重复事故？
8. AIOps 根因分析需要哪些数据证据？

## 学习证据

学完后，在 GitHub 留下：

- 一份 postmortem。
- 一份行动项表。
- 一段 5 Whys 分析。
- README 说明什么是无责复盘。
