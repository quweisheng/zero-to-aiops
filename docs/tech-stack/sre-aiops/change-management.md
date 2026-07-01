# 变更管理

## 官方资料

- [Google SRE Book - Release Engineering](https://sre.google/sre-book/release-engineering/)
- [Google SRE Book - Reliable Product Launches at Scale](https://sre.google/sre-book/reliable-product-launches/)
- [Google SRE Book - Example Launch Coordination Checklist](https://sre.google/sre-book/example-launch-coordination-checklist/)
- [Atlassian - Change management](https://www.atlassian.com/itsm/change-management)

> 学习说明：本篇把变更管理理解为“让发布、配置、基础设施改动可追踪、可验证、可回滚”的工程实践。

## 为什么要学

很多生产故障都和变更有关：发布、配置修改、扩容缩容、网络策略、安全组、数据库变更。变更管理能让团队知道“改了什么、谁改的、什么时候改的、如何验证、如何回滚”。

## 它解决什么问题

- 降低变更引发故障的概率。
- 让发布和配置修改有审批、验证和回滚。
- 为 incident 时间线提供变更上下文。
- 帮助 AIOps 关联“故障是否发生在变更之后”。
- 让高风险变更有灰度、监控和回退策略。

## 是什么

变更管理是对生产环境变化进行计划、评审、执行、验证和复盘的过程。

变更包括：

- 应用发布。
- 配置修改。
- 数据库变更。
- 网络策略变更。
- 扩容缩容。
- 证书更新。
- 基础设施修改。
- 告警规则修改。

很多事故不是因为系统自己坏了，而是因为变更引入了问题。因此，AIOps 必须把“最近变更”作为排障核心上下文。

## 核心原理

Google SRE 的 Release Engineering 强调：可靠服务需要可靠发布流程，构建和配置应该可复现、自动化、可重复，而不是一次性的雪花操作。

变更管理的目标：

```text
change request
  -> risk assessment
  -> review
  -> execute
  -> verify
  -> rollback if needed
  -> record
  -> learn
```

## 架构

```text
Git commit
  -> CI
  -> artifact
  -> deployment plan
  -> approval if needed
  -> canary / rollout
  -> metrics verification
  -> change record
  -> incident correlation
```

关键能力：

- 所有变更有记录。
- 所有制品可追溯。
- 所有变更可回滚。
- 高风险变更有审批。
- 变更后自动观察关键 SLO。

## 变更分类

| 类型 | 风险 | 示例 | 审批 |
|---|---|---|---|
| 标准变更 | 低 | 日常小版本发布 | 自动或轻审批 |
| 普通变更 | 中 | 配置修改、扩容 | 团队评审 |
| 紧急变更 | 高 | 故障中回滚、临时切流 | 事件指挥审批 |
| 高风险变更 | 高 | 数据库结构、网络 ACL | 多方审批 |

## 变更单模板

````md
# Change: order-api release 2026.07.01.1

## 基本信息

- 变更 ID: CHG-2026-0701-001
- 服务: order-api
- 类型: 应用发布
- 风险: 中
- 执行人:
- 审批人:
- 计划时间: 2026-07-01 09:00

## 变更内容

- 发布 order-api 版本 2026.07.01.1
- 修改数据库连接池配置

## 风险评估

- 可能影响下单请求。
- 可能导致数据库连接数变化。

## 验证计划

- 观察 5xx 错误率。
- 观察 p95 延迟。
- 观察数据库连接池使用率。
- 观察下游 payment-api 错误率。

## 回滚计划

```bash
kubectl rollout undo deployment/order-api -n prod
```

## 执行记录

| 时间 | 动作 | 结果 |
|---|---|---|
| 09:02 | 开始发布 | 成功 |
| 09:10 | 观察到错误率升高 | 触发告警 |

## 变更后结论

- 成功 / 失败 / 已回滚
- 后续事项:
````

## 发布策略

### 蓝绿发布

```text
blue: 当前生产
green: 新版本
流量从 blue 切到 green
```

优点：回滚快。

缺点：资源成本高。

### 滚动发布

```text
一批一批替换实例
```

优点：资源成本低。

缺点：新旧版本并存，要注意兼容性。

### 金丝雀发布

```text
少量流量 -> 观察 -> 扩大流量 -> 全量
```

优点：降低风险。

缺点：需要流量控制和指标验证。

## 验证指标

变更后必须观察：

| 指标 | 示例 |
|---|---|
| 可用性 | 5xx 错误率 |
| 延迟 | p95 / p99 |
| 流量 | RPS 是否异常 |
| 饱和度 | CPU、内存、连接池 |
| 业务指标 | 下单成功率、支付成功率 |
| 告警 | 是否新增告警 |

变更后观察窗口：

```text
低风险: 10 到 15 分钟
中风险: 30 分钟
高风险: 1 小时或按业务周期
```

## AIOps 中的作用

变更是根因分析的高价值信号：

```text
incident starts at 09:10
  -> look back 30 minutes
  -> change at 09:02
  -> compare metrics before and after
  -> suggest rollback or focused check
```

AIOps 系统应记录：

- 变更时间。
- 服务名。
- 版本号。
- 配置 diff。
- 执行人。
- 回滚方式。
- 变更后 SLO 状态。

## 入门练习：变更记录和事故关联

目录建议：

```text
projects/change-management-lab/
  README.md
  changes.csv
  incidents.csv
  correlate_changes.py
```

`changes.csv`：

```csv
change_id,service,change_type,version,started_at,finished_at
CHG-001,order-api,release,2026.07.01.1,2026-07-01 09:02,2026-07-01 09:05
CHG-002,payment-api,config,pool-size,2026-07-01 10:00,2026-07-01 10:03
```

`incidents.csv`：

```csv
incident_id,service,started_at,severity
INC-001,order-api,2026-07-01 09:10,SEV2
```

任务：用 pandas 找出 incident 前 30 分钟内同服务变更。

## 常见错误

### 没有回滚计划

没有回滚计划的变更不应该进入生产。

### 变更记录不完整

事故中如果找不到最近变更，排障会变慢。

### 只看发布，不看配置

很多事故来自配置、网络、证书、权限，而不是代码。

### 变更后不观察

发布成功不代表服务健康。必须看 SLO 和关键业务指标。

## 学习检查清单

- [ ] 我能解释为什么变更是故障重要来源。
- [ ] 我能写一份变更 checklist。
- [ ] 我能说明发布前、发布中、发布后要检查什么。
- [ ] 我能区分低风险和高风险变更。
- [ ] 我能写回滚计划。
- [ ] 我能把变更记录和告警时间线关联。

## 面试题

1. 变更管理解决什么问题？
2. 发布前 checklist 应该包含哪些内容？
3. 为什么每次变更都要有回滚方案？
4. 灰度发布和全量发布有什么区别？
5. 变更后应该观察哪些指标？
6. 如何判断一次故障是否可能由变更引起？
7. 数据库变更为什么风险更高？
8. AIOps 如何利用变更记录做根因分析？

## 学习证据

学完后，在 GitHub 留下：

- 一份变更单模板。
- 一份 `changes.csv`。
- 一个变更与事故关联脚本。
- README 解释发布策略、回滚计划和验证指标。
