# CI/CD

> 目标：理解持续集成、持续交付、持续部署的区别，能设计一条最小流水线，并知道发布和回滚为什么是 AIOps 的关键上下文。

## 官方资料

- [GitHub Actions documentation](https://docs.github.com/actions)
- [Atlassian: Continuous delivery](https://www.atlassian.com/continuous-delivery)
- [Atlassian: Continuous integration](https://www.atlassian.com/continuous-delivery/continuous-integration)
- [Atlassian: CI vs CD vs continuous deployment](https://www.atlassian.com/continuous-delivery/principles/continuous-integration-vs-delivery-vs-deployment)

说明：本文是基于 GitHub Actions 和 Atlassian CI/CD 教程整理的原创中文教程，不复制官方全文。

## 为什么要学

AIOps 不是只处理运行时故障，也要理解故障是怎么被变更引入的。CI/CD 记录了从代码提交、测试、构建、发布到回滚的过程，是事故时间线和根因分析的重要上下文。

会 CI/CD，才能把“我改了什么、什么时候发布、发布后指标怎么变了、如何回滚”讲清楚。

## 是什么

CI/CD 是软件交付自动化实践。

- CI：Continuous Integration，持续集成。频繁合并代码并自动构建、测试。
- CD：Continuous Delivery，持续交付。代码始终处于可发布状态，发布通常需要人工确认。
- Continuous Deployment：持续部署。通过自动化把通过验证的变更自动发布到生产。

## 它解决什么问题

- 自动构建、测试和打包。
- 在变更进入主分支前发现问题。
- 标准化发布流程。
- 记录发布版本、时间、操作者和结果。
- 提供回滚入口和验证清单。
- 为 AIOps 变更关联分析提供数据。

## 核心原理

```text
git push
  -> build
  -> lint
  -> test
  -> package
  -> security scan
  -> deploy to staging
  -> approval
  -> deploy to production
  -> monitor
  -> rollback if needed
```

CI/CD 的价值是把变更流程标准化、自动化、可追踪。

## 架构

```text
Source control: GitHub
  -> CI runner
  -> artifact registry
  -> deployment target
  -> observability
  -> incident / rollback
```

核心对象：

- Source：代码仓库。
- Pipeline：流水线。
- Runner/Agent：执行任务的机器。
- Artifact：构建产物。
- Environment：dev/staging/prod。
- Approval：发布审批。
- Rollback：回滚策略。

## 最小流水线

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - run: python -m pip install -r requirements.txt
      - run: python -m pytest
```

## 发布策略

常见发布方式：

- Rolling update：滚动更新。
- Blue/green：蓝绿发布。
- Canary：金丝雀发布。
- Manual approval：人工审批后发布。
- Feature flag：功能开关。

## 回滚策略

回滚不是“出了事再想”，而是发布前就要准备。

回滚要回答：

- 回滚到哪个版本？
- 数据库变更能否回滚？
- 配置变更能否回滚？
- 回滚命令是什么？
- 谁有权限执行？
- 回滚后如何验证？

## 在 AIOps 中的作用

- 变更是故障的重要来源。
- AIOps 根因分析需要关联最近发布。
- 自动化回滚必须建立在可靠流水线之上。
- CI/CD 记录是事故时间线的重要证据。

## 入门实验

1. 给一个 Python 项目添加测试。
2. 写 GitHub Actions workflow。
3. push 后自动运行测试。
4. 故意让测试失败，观察流水线失败。
5. 修复后重新提交。

## 关键指标

- 构建成功率。
- 测试通过率。
- 部署频率。
- 变更失败率。
- 平均恢复时间。
- 从提交到发布的时间。

这些指标可以和 DORA / DevOps 效能分析关联。

## 排障清单

### 流水线失败

- 先看第一个失败 step。
- 看命令退出码。
- 本地复现同一命令。
- 检查环境变量和 secrets。

### 发布后故障

- 记录发布版本。
- 查看变更内容。
- 查看发布后指标变化。
- 判断回滚还是热修。

### 回滚失败

- 检查是否有不可逆数据库变更。
- 检查镜像或 artifact 是否还在。
- 检查配置是否被后续变更覆盖。

## 学习检查清单

- [ ] 我能解释 CI、持续交付、持续部署的区别。
- [ ] 我能画出最小流水线。
- [ ] 我能写一个基础测试 workflow。
- [ ] 我能说明 artifact、environment、approval、rollback。
- [ ] 我能解释 rolling、blue/green、canary 的区别。
- [ ] 我能写一份发布和回滚 checklist。
- [ ] 我能从流水线日志定位失败 step。
- [ ] 我能把发布记录和故障时间线关联起来。

## 面试题

1. CI、持续交付、持续部署有什么区别？
2. 一条最小流水线应该包含哪些阶段？
3. 为什么发布前必须考虑回滚？
4. 蓝绿发布和金丝雀发布有什么区别？
5. 发布后故障时如何判断回滚还是热修？
6. 变更失败率和 MTTR 为什么重要？
7. CI/CD 日志如何支持事故复盘？
8. secrets 在流水线中应该如何管理？
9. 为什么数据库变更会影响回滚策略？
10. CI/CD 和 AIOps 根因分析有什么关系？

## 学习证据

- 一个 CI workflow。
- 一篇流水线失败复盘。
- 一份发布和回滚 checklist。
