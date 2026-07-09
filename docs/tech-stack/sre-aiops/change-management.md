# 变更管理

> 目标：不是填一张审批表，而是能让代码、配置、基础设施、数据库、证书、告警规则等生产变更可评审、可追踪、可验证、可回滚，并能把变更事件自动纳入告警、事件响应、RCA 和 AIOps 根因候选。

## 官方资料

优先读这些官方资料：

- [Google SRE Book - Release Engineering](https://sre.google/sre-book/release-engineering/)
- [Google SRE Book - Reliable Product Launches at Scale](https://sre.google/sre-book/reliable-product-launches/)
- [Google SRE Book - Example Launch Coordination Checklist](https://sre.google/sre-book/example-launch-coordination-checklist/)
- [Google SRE Book - Service Level Objectives](https://sre.google/sre-book/service-level-objectives/)
- [Google SRE Book - Embracing Risk](https://sre.google/sre-book/embracing-risk/)
- [Google SRE Workbook - Error Budget Policy](https://sre.google/workbook/error-budget-policy/)

说明：本文把变更管理理解为“让生产改动可追踪、可验证、可回滚”的工程实践，不是单纯审批流程。

## 场景开场

服务突然 5xx 升高。

一个成熟的值班同事第一反应通常不是立刻猜数据库，也不是立刻重启服务，而是问：

```text
最近有没有变更？
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>最近有没有变更？</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


变更可能是：

- 代码发布。
- 配置修改。
- 数据库迁移。
- 网络策略。
- 扩容缩容。
- 证书更新。
- feature flag。
- 告警规则调整。
- 依赖服务升级。

很多事故不是系统无缘无故坏掉，而是某个变更把系统推到了新状态。变更管理的价值，就是让团队知道“谁在什么时候改了什么，风险是什么，怎么验证，怎么回滚，出了问题能不能快速关联”。

## 一句话人话版

变更管理是生产改动的安全流程：让每次修改都有记录、评审、风险分级、验证计划、回滚计划和事后观察，出事时能快速判断它是不是嫌疑人。

## 小白可能会问

- 什么算变更？是不是只有代码发布？
- 为什么发布成功不等于服务健康？
- 标准变更、普通变更、紧急变更怎么区分？
- 为什么配置变更也要走流程？
- 什么是可回滚变更？
- 蓝绿、滚动、金丝雀有什么区别？
- 错误预算怎么影响发布？
- AIOps 怎么关联“故障发生前 30 分钟的变更”？

## 官方知识地图

变更管理可以按这张地图理解：

```text
Change
  -> request
     -> what changes
     -> why
     -> owner
     -> planned window
  -> risk assessment
     -> user impact
     -> blast radius
     -> reversibility
     -> dependency
     -> data migration
  -> review / gates
     -> code review
     -> tests
     -> security
     -> SLO / error budget
     -> approval
  -> release engineering
     -> reproducible build
     -> artifact
     -> version
     -> config snapshot
     -> deployment plan
  -> rollout
     -> canary
     -> rolling
     -> blue-green
     -> feature flag
  -> verification
     -> SLI / SLO
     -> errors
     -> latency
     -> traffic
     -> saturation
     -> business metrics
  -> rollback / roll-forward
  -> record
     -> timeline
     -> result
     -> incident link
  -> AIOps correlation
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Change</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; request</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>     -&gt; what changes</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>     -&gt; why</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>     -&gt; owner</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 6 行 | <code>     -&gt; planned window</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 7 行 | <code>  -&gt; risk assessment</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 8 行 | <code>     -&gt; user impact</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 9 行 | <code>     -&gt; blast radius</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 10 行 | <code>     -&gt; reversibility</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 11 行 | <code>     -&gt; dependency</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 12 行 | <code>     -&gt; data migration</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 13 行 | <code>  -&gt; review / gates</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 14 行 | <code>     -&gt; code review</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 15 行 | <code>     -&gt; tests</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 16 行 | <code>     -&gt; security</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 17 行 | <code>     -&gt; SLO / error budget</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 18 行 | <code>     -&gt; approval</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 19 行 | <code>  -&gt; release engineering</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 20 行 | <code>     -&gt; reproducible build</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 21 行 | <code>     -&gt; artifact</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 22 行 | <code>     -&gt; version</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 23 行 | <code>     -&gt; config snapshot</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 24 行 | <code>     -&gt; deployment plan</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 25 行 | <code>  -&gt; rollout</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 26 行 | <code>     -&gt; canary</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 27 行 | <code>     -&gt; rolling</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 28 行 | <code>     -&gt; blue-green</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 29 行 | <code>     -&gt; feature flag</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 30 行 | <code>  -&gt; verification</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 31 行 | <code>     -&gt; SLI / SLO</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 32 行 | <code>     -&gt; errors</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 33 行 | <code>     -&gt; latency</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 34 行 | <code>     -&gt; traffic</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 35 行 | <code>     -&gt; saturation</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 36 行 | <code>     -&gt; business metrics</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 37 行 | <code>  -&gt; rollback / roll-forward</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 38 行 | <code>  -&gt; record</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 39 行 | <code>     -&gt; timeline</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 40 行 | <code>     -&gt; result</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 41 行 | <code>     -&gt; incident link</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 42 行 | <code>  -&gt; AIOps correlation</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


初学路线：

```text
write change record
  -> classify risk
  -> define verification metrics
  -> define rollback plan
  -> deploy with canary / rolling
  -> observe SLO
  -> record result
  -> link to incident if failed
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>write change record</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; classify risk</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; define verification metrics</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>  -&gt; define rollback plan</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>  -&gt; deploy with canary / rolling</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 6 行 | <code>  -&gt; observe SLO</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 7 行 | <code>  -&gt; record result</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 8 行 | <code>  -&gt; link to incident if failed</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


## 变更不只是代码发布

生产变更包括：

| 类型 | 示例 | 风险 |
|---|---|---|
| 应用发布 | order-api v2026.07.02.1 | bug、兼容性 |
| 配置变更 | 连接池、超时、feature flag | 行为变化 |
| 数据库变更 | schema migration、索引 | 锁表、回滚困难 |
| 基础设施 | Kubernetes、节点、负载均衡 | 可用性影响 |
| 网络 | Ingress、DNS、安全组 | 流量中断 |
| 安全 | 证书、密钥、权限 | 认证失败 |
| 告警 | 阈值、路由、静默 | 漏报或噪声 |
| 自动化 | runbook 脚本、修复动作 | 扩大影响 |

AIOps 排障时，“最近变更”必须包含这些类型，而不是只查 Git commit。

## Release Engineering 核心原则

Google SRE Release Engineering 强调：可靠服务需要可靠发布过程。

对普通团队最重要的原则：

| 原则 | 含义 |
|---|---|
| 可复现构建 | 同一代码和配置能构建出同一制品 |
| 自动化 | 构建、测试、发布尽量自动执行 |
| 可追溯 | 制品、配置、发布记录能追到 commit |
| 策略强制 | 评审、测试、审批、权限由工具保证 |
| 渐进发布 | 按风险从小范围扩大 |
| 可回滚 | 发现问题能快速恢复 |

不要让生产发布变成：

```text
某人在某台机器手动改了一些东西。
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>某人在某台机器手动改了一些东西。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


那是事故材料，不是发布工程。

## 变更分类

简单分四类：

| 类型 | 风险 | 示例 | 审批 |
|---|---:|---|---|
| 标准变更 | 低 | 日常小版本、文档、低风险配置 | 自动或轻审批 |
| 普通变更 | 中 | 应用发布、连接池调整、扩容 | 团队评审 |
| 高风险变更 | 高 | 数据库 schema、网络 ACL、权限策略 | 多方审批 |
| 紧急变更 | 高 | 故障中回滚、临时切流 | IC 审批，事后补记录 |

风险判断维度：

- 用户影响范围。
- 是否可回滚。
- 是否涉及数据。
- 是否跨团队。
- 是否影响核心链路。
- 是否有充分测试。
- 是否在高峰期。
- 当前错误预算是否充足。

## 变更单模板

````md
# Change: order-api release 2026.07.02.1

## 基本信息

- 变更 ID: CHG-2026-0702-001
- 服务: order-api
- 类型: 应用发布
- 风险: 中
- 执行人:
- 审批人:
- 计划时间: 2026-07-02 09:00
- 关联 PR:
- 关联制品:
- 关联 SLO: order-api-availability

## 变更内容

- 发布 order-api 版本 2026.07.02.1。
- 修改数据库连接池配置。

## 变更原因

- 修复订单状态同步问题。
- 优化数据库连接池参数。

## 风险评估

- 可能影响下单请求。
- 可能导致数据库连接数变化。
- 回滚可恢复代码和配置，但需观察连接池恢复。

## 前置检查

- [ ] CI 通过。
- [ ] 单元测试通过。
- [ ] 集成测试通过。
- [ ] 配置 diff 已评审。
- [ ] 当前错误预算充足。
- [ ] 回滚命令已确认。

## 验证计划

- 观察 5xx 错误率。
- 观察 p95 / p99 延迟。
- 观察数据库连接池使用率。
- 观察下单成功率。
- 观察 payment-api 依赖错误率。

## 回滚计划

```bash
kubectl rollout undo deployment/order-api -n prod
```

回滚风险：
- 如果有数据库 migration，必须先确认兼容性。

## 执行记录

| 时间 | 动作 | 结果 | 证据 |
|---|---|---|---|
| 09:02 | 开始发布 | 成功 | deploy log |
| 09:10 | 观察到错误率升高 | 触发告警 | Alertmanager |

## 变更后观察

| 指标 | 期望 | 实际 |
|---|---|---|
| 5xx 错误率 | 不高于基线 | |
| p95 延迟 | 不高于 300ms | |
| 下单成功率 | 不低于 99.9% | |

## 结论

- 成功 / 失败 / 已回滚
- 是否关联 incident:
- 后续事项:
````

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code># Change: order-api release 2026.07.02.1</code> | Markdown 标题行，用来组织文档层级。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 3 行 | <code>## 基本信息</code> | Markdown 标题行，用来组织文档层级。 |
| 第 4 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 5 行 | <code>- 变更 ID: CHG-2026-0702-001</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 6 行 | <code>- 服务: order-api</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 7 行 | <code>- 类型: 应用发布</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 8 行 | <code>- 风险: 中</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 9 行 | <code>- 执行人:</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 10 行 | <code>- 审批人:</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 11 行 | <code>- 计划时间: 2026-07-02 09:00</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 12 行 | <code>- 关联 PR:</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 13 行 | <code>- 关联制品:</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 14 行 | <code>- 关联 SLO: order-api-availability</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 15 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 16 行 | <code>## 变更内容</code> | Markdown 标题行，用来组织文档层级。 |
| 第 17 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 18 行 | <code>- 发布 order-api 版本 2026.07.02.1。</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 19 行 | <code>- 修改数据库连接池配置。</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 20 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 21 行 | <code>## 变更原因</code> | Markdown 标题行，用来组织文档层级。 |
| 第 22 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 23 行 | <code>- 修复订单状态同步问题。</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 24 行 | <code>- 优化数据库连接池参数。</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 25 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 26 行 | <code>## 风险评估</code> | Markdown 标题行，用来组织文档层级。 |
| 第 27 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 28 行 | <code>- 可能影响下单请求。</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 29 行 | <code>- 可能导致数据库连接数变化。</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 30 行 | <code>- 回滚可恢复代码和配置，但需观察连接池恢复。</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 31 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 32 行 | <code>## 前置检查</code> | Markdown 标题行，用来组织文档层级。 |
| 第 33 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 34 行 | <code>- [ ] CI 通过。</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 35 行 | <code>- [ ] 单元测试通过。</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 36 行 | <code>- [ ] 集成测试通过。</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 37 行 | <code>- [ ] 配置 diff 已评审。</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 38 行 | <code>- [ ] 当前错误预算充足。</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 39 行 | <code>- [ ] 回滚命令已确认。</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 40 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 41 行 | <code>## 验证计划</code> | Markdown 标题行，用来组织文档层级。 |
| 第 42 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 43 行 | <code>- 观察 5xx 错误率。</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 44 行 | <code>- 观察 p95 / p99 延迟。</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 45 行 | <code>- 观察数据库连接池使用率。</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 46 行 | <code>- 观察下单成功率。</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 47 行 | <code>- 观察 payment-api 依赖错误率。</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 48 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 49 行 | <code>## 回滚计划</code> | Markdown 标题行，用来组织文档层级。 |
| 第 50 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 51 行 | <code>```bash</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 52 行 | <code>kubectl rollout undo deployment/order-api -n prod</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 53 行 | <code>```</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 54 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 55 行 | <code>回滚风险：</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 56 行 | <code>- 如果有数据库 migration，必须先确认兼容性。</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 57 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 58 行 | <code>## 执行记录</code> | Markdown 标题行，用来组织文档层级。 |
| 第 59 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 60 行 | <code>&#124; 时间 &#124; 动作 &#124; 结果 &#124; 证据 &#124;</code> | Markdown 表格行，用来对齐展示字段和说明。 |
| 第 61 行 | <code>&#124;---&#124;---&#124;---&#124;---&#124;</code> | Markdown 表格行，用来对齐展示字段和说明。 |
| 第 62 行 | <code>&#124; 09:02 &#124; 开始发布 &#124; 成功 &#124; deploy log &#124;</code> | Markdown 表格行，用来对齐展示字段和说明。 |
| 第 63 行 | <code>&#124; 09:10 &#124; 观察到错误率升高 &#124; 触发告警 &#124; Alertmanager &#124;</code> | Markdown 表格行，用来对齐展示字段和说明。 |
| 第 64 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 65 行 | <code>## 变更后观察</code> | Markdown 标题行，用来组织文档层级。 |
| 第 66 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 67 行 | <code>&#124; 指标 &#124; 期望 &#124; 实际 &#124;</code> | Markdown 表格行，用来对齐展示字段和说明。 |
| 第 68 行 | <code>&#124;---&#124;---&#124;---&#124;</code> | Markdown 表格行，用来对齐展示字段和说明。 |
| 第 69 行 | <code>&#124; 5xx 错误率 &#124; 不高于基线 &#124; &#124;</code> | Markdown 表格行，用来对齐展示字段和说明。 |
| 第 70 行 | <code>&#124; p95 延迟 &#124; 不高于 300ms &#124; &#124;</code> | Markdown 表格行，用来对齐展示字段和说明。 |
| 第 71 行 | <code>&#124; 下单成功率 &#124; 不低于 99.9% &#124; &#124;</code> | Markdown 表格行，用来对齐展示字段和说明。 |
| 第 72 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 73 行 | <code>## 结论</code> | Markdown 标题行，用来组织文档层级。 |
| 第 74 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 75 行 | <code>- 成功 / 失败 / 已回滚</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 76 行 | <code>- 是否关联 incident:</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 77 行 | <code>- 后续事项:</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |


## 发布成功不等于变更成功

CI/CD 显示成功，只代表流水线执行完。

还要看：

- 用户请求是否成功。
- 延迟是否恶化。
- SLO 是否燃烧。
- 业务指标是否异常。
- 下游依赖是否被打爆。
- 告警是否新增。
- 日志是否出现新错误。

变更成功的定义：

```text
发布完成 + 验证指标正常 + 观察窗口通过 + 无用户影响
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>发布完成 + 验证指标正常 + 观察窗口通过 + 无用户影响</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


## 发布策略

### 滚动发布

```text
一批一批替换实例。
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>一批一批替换实例。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


优点：

- 资源成本低。
- Kubernetes 默认容易支持。

风险：

- 新旧版本并存。
- 需要兼容数据库和接口。
- 问题可能逐步扩大。

### 蓝绿发布

```text
blue: 当前生产
green: 新版本
流量从 blue 切到 green
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>blue: 当前生产</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>green: 新版本</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>流量从 blue 切到 green</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


优点：

- 切换和回滚快。
- 新旧环境隔离清楚。

风险：

- 资源成本高。
- 数据状态要兼容。

### 金丝雀发布

```text
少量流量 -> 观察 -> 扩大流量 -> 全量
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>少量流量 -&gt; 观察 -&gt; 扩大流量 -&gt; 全量</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


优点：

- 控制爆炸半径。
- 适合高风险变更。

风险：

- 需要流量治理。
- 需要足够的指标和样本量。
- 低流量服务可能看不出问题。

### Feature Flag

```text
代码已发布，但功能开关控制是否启用。
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>代码已发布，但功能开关控制是否启用。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


优点：

- 可以快速关闭功能。
- 支持小范围用户启用。

风险：

- flag 组合复杂。
- 旧 flag 不清理会成为债务。

## 变更门禁

常见门禁：

| 门禁 | 目的 |
|---|---|
| code review | 防止明显错误 |
| CI test | 防止构建和测试失败 |
| security scan | 防止安全风险 |
| config validation | 防止配置越界 |
| migration check | 防止数据库不可逆 |
| error budget check | 防止预算耗尽还发布 |
| approval | 高风险变更人工确认 |
| canary analysis | 自动观察关键指标 |

错误预算门禁示例：

```text
如果 order-api 30 天错误预算已消耗 > 80%，禁止普通功能发布，只允许可靠性修复。
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>如果 order-api 30 天错误预算已消耗 &gt; 80%，禁止普通功能发布，只允许可靠性修复。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


这把 SLO 和发布决策连接起来。

## 验证指标

变更后至少看：

| 类型 | 指标 |
|---|---|
| 可用性 | 5xx 错误率、成功率 |
| 延迟 | p95、p99、足够快请求比例 |
| 流量 | RPS、队列输入输出 |
| 饱和度 | CPU、内存、连接池、队列深度 |
| 业务 | 下单成功率、支付成功率 |
| 日志 | 新错误、异常堆栈 |
| 依赖 | 下游 5xx、数据库慢查询 |
| 告警 | 新增 page/ticket |

观察窗口：

| 风险 | 建议观察 |
|---|---|
| 低风险 | 10 到 15 分钟 |
| 中风险 | 30 分钟 |
| 高风险 | 1 小时或完整业务周期 |

## 回滚计划

没有回滚计划的变更，不应该轻易进生产。

回滚计划要写：

- 回滚命令。
- 回滚负责人。
- 回滚触发条件。
- 回滚风险。
- 数据是否兼容。
- 回滚后验证。
- 如果回滚失败怎么办。

示例触发条件：

```text
发布后 15 分钟内：
- 5xx 错误率超过 2%，或
- p95 延迟超过基线 2 倍，或
- order-api SLO burn rate 超过 6，或
- 下单成功率低于 99%
则评估回滚。
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>发布后 15 分钟内：</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>- 5xx 错误率超过 2%，或</code> | 列表项，表示一个要点、条件、文件或检查项。 |
| 第 3 行 | <code>- p95 延迟超过基线 2 倍，或</code> | 列表项，表示一个要点、条件、文件或检查项。 |
| 第 4 行 | <code>- order-api SLO burn rate 超过 6，或</code> | 列表项，表示一个要点、条件、文件或检查项。 |
| 第 5 行 | <code>- 下单成功率低于 99%</code> | 列表项，表示一个要点、条件、文件或检查项。 |
| 第 6 行 | <code>则评估回滚。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


## 数据库变更特别处理

数据库变更通常比代码发布更难回滚。

建议：

- expand / contract 模式。
- 先兼容旧代码和新代码。
- 先加字段，后读写，最后删除旧字段。
- 大表变更避开高峰。
- 迁移脚本可暂停、可重试。
- 变更前备份。
- 回滚路径写清楚。

危险信号：

- 删除字段。
- 改字段类型。
- 长事务。
- 大表加索引。
- 不可逆数据迁移。

## 配置变更特别处理

Google SRE Release Engineering 特别强调配置管理，因为配置变更也是不稳定来源。

配置变更要做到：

- 进版本控制。
- code review。
- 有 diff。
- 有 owner。
- 有范围校验。
- 有默认值。
- 能回滚。
- 能关联到发布或变更单。

不要在生产控制台里随手改配置却没有记录。

## 紧急变更

紧急变更通常发生在 incident 中，例如回滚、切流、临时禁用功能。

原则：

- 可以先做必要审批简化。
- 必须由 IC 或授权人决策。
- 必须记录原因、动作、时间、执行人。
- 事后补完整变更记录。
- 进入 postmortem。

紧急不等于无记录。

## AIOps 中的作用

变更是 RCA 和 AIOps 的高价值信号。

```text
incident starts at 09:10
  -> look back 30 minutes
  -> change at 09:02
  -> compare metrics before and after
  -> add change as root cause candidate
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>incident starts at 09:10</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; look back 30 minutes</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; change at 09:02</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>  -&gt; compare metrics before and after</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>  -&gt; add change as root cause candidate</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


AIOps 可以做：

- 变更时间线自动补全。
- 告警消息关联最近发布。
- 变更后自动观察 SLO。
- 检测发布后指标异常。
- 相似变更事故检索。
- 变更风险评分。
- 错误预算门禁建议。
- RCA 中生成变更关联证据。

但注意：

```text
变更发生在故障前，不等于它一定是根因。
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>变更发生在故障前，不等于它一定是根因。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


它只是强候选，需要指标、日志、diff 和实验验证。

## 入门练习：变更记录和事故关联

准备 `changes.jsonl`：

```json
{"id":"CHG-001","service":"order-api","type":"release","time":"2026-07-02T09:02:00Z","version":"2026.07.02.1","owner":"team-order"}
{"id":"CHG-002","service":"payment-api","type":"config","time":"2026-07-02T08:20:00Z","summary":"increase timeout","owner":"payment-team"}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{"id":"CHG-001","service":"order-api","type":"release","time":"2026-07-02T09:02:00Z","version":"2026.07.02.1","owner":"team-order"}</code> | JSON 列表或对象中的一行，注意逗号和引号必须符合 JSON 语法。 |
| 第 2 行 | <code>{"id":"CHG-002","service":"payment-api","type":"config","time":"2026-07-02T08:20:00Z","summary":"increase timeout","owner":"payment-team"}</code> | JSON 列表或对象中的一行，注意逗号和引号必须符合 JSON 语法。 |


准备 incident：

```json
{"id":"INC-001","service":"order-api","start_time":"2026-07-02T09:10:00Z","symptom":"5xx error rate increased"}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{"id":"INC-001","service":"order-api","start_time":"2026-07-02T09:10:00Z","symptom":"5xx error rate increased"}</code> | JSON 列表或对象中的一行，注意逗号和引号必须符合 JSON 语法。 |


任务：

1. 查找 incident 前 60 分钟内同 service 变更。
2. 输出候选变更。
3. 写出需要验证的指标。
4. 写出回滚触发条件。

伪代码：

```python
from datetime import datetime, timedelta, timezone

incident_time = datetime.fromisoformat("2026-07-02T09:10:00+00:00")
window_start = incident_time - timedelta(minutes=60)

for change in changes:
    change_time = datetime.fromisoformat(change["time"].replace("Z", "+00:00"))
    if change["service"] == "order-api" and window_start <= change_time <= incident_time:
        print(change)
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>from datetime import datetime, timedelta, timezone</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 3 行 | <code>incident_time = datetime.fromisoformat("2026-07-02T09:10:00+00:00")</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 4 行 | <code>window_start = incident_time - timedelta(minutes=60)</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 5 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 6 行 | <code>for change in changes:</code> | 循环处理一组数据，常用于逐条处理告警、日志或指标样本。 |
| 第 7 行 | <code>    change_time = datetime.fromisoformat(change["time"].replace("Z", "+00:00"))</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 8 行 | <code>    if change["service"] == "order-api" and window_start &lt;= change_time &lt;= incident_time:</code> | 条件判断，只有条件成立时才执行下面缩进的代码。 |
| 第 9 行 | <code>        print(change)</code> | 打印输出，用来在实验中确认变量、结果或调试信息。 |


## 常见错误

### 没有回滚计划

发布前必须知道怎么撤回。

### 发布成功就结束

发布成功不代表服务健康，必须观察 SLO 和业务指标。

### 只记录代码发布

配置、数据库、网络、证书、告警规则都是变更。

### 变更记录不完整

没有 owner、时间、版本、diff、回滚计划，就很难用于排障。

### 高风险变更无审批

数据库、网络、安全、权限类变更必须更严格。

### 错误预算耗尽还发功能

预算耗尽时应该优先可靠性修复。

### 紧急变更不补记录

故障中可先处理，但事后必须补完整记录。

## 常用字段字典

### change_id

变更唯一 ID。

### service

受影响服务。

### artifact

发布制品，例如镜像 digest、包版本。

### commit / PR

代码来源。

### config_diff

配置变更差异。

### risk

低、中、高风险。

### verification_plan

变更后观察什么指标。

### rollback_plan

如何撤回。

### blast_radius

潜在影响范围。

### observation_window

变更后观察窗口。

## 面试怎么讲

变更管理的核心不是审批表，而是让生产改动可追踪、可验证、可回滚。变更包括代码发布、配置、数据库、网络、安全、扩容、告警规则等。Google SRE 的 release engineering 强调可靠服务需要可靠发布过程：构建可复现、制品可追溯、流程自动化、策略可强制、发布渐进、回滚明确。

我会为每个变更记录 owner、服务、风险、时间、制品、commit、配置 diff、验证计划和回滚计划。发布后不只看流水线是否成功，还要看 SLO、错误率、延迟、流量、饱和度和业务指标。高风险变更要有审批、灰度或金丝雀，错误预算不足时限制普通功能发布。AIOps 中，变更是根因候选和告警补充上下文，但“变更发生在前”不等于一定是根因，还要用指标和日志验证。

## 学习检查清单

- [ ] 我能说出哪些内容算生产变更。
- [ ] 我能解释发布成功和变更成功的区别。
- [ ] 我能写一份变更单。
- [ ] 我能做变更风险评估。
- [ ] 我能写验证计划。
- [ ] 我能写回滚计划。
- [ ] 我能解释滚动、蓝绿、金丝雀发布。
- [ ] 我能说明错误预算如何影响发布。
- [ ] 我能解释数据库变更为什么特殊。
- [ ] 我能解释配置变更为什么要进版本控制。
- [ ] 我能把变更记录和 incident 时间线关联。
- [ ] 我能说明 AIOps 如何使用变更数据。

## 面试题

1. 什么算生产变更？
2. 变更管理解决什么问题？
3. Google SRE Release Engineering 强调哪些原则？
4. 为什么发布成功不等于变更成功？
5. 标准变更、普通变更、紧急变更、高风险变更怎么区分？
6. 蓝绿、滚动、金丝雀发布有什么区别？
7. 什么是 blast radius？
8. 变更后应该观察哪些指标？
9. 为什么每个变更都要有回滚计划？
10. 数据库变更为什么要特别谨慎？
11. 配置变更为什么也是事故来源？
12. 错误预算如何影响发布策略？
13. 紧急变更如何记录？
14. AIOps 如何把变更和故障关联？
15. 为什么“故障前有变更”不等于“变更就是根因”？

## 学习证据

学完后，在 GitHub 留下这些证据：

- 一份 `CHG-2026-0702-001.md` 变更单。
- 一份变更风险评估。
- 一份验证指标清单。
- 一份回滚计划。
- 一份 `changes.jsonl` 样例。
- 一个变更和 incident 关联脚本。
- README 说明错误预算如何影响发布。
- README 说明变更数据如何进入 AIOps 根因候选。
