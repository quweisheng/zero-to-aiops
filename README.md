# zero-to-aiops

> 成为一名更好的 AIOps 工程师：从运维经验出发，用可观测性、自动化、数据分析和 AI 能力解决真实生产问题。

[![Learning](https://img.shields.io/badge/learning-AIOps-2457a6?style=for-the-badge)](./docs/roadmap/)
[![Ops](https://img.shields.io/badge/base-operations-1f7a5a?style=for-the-badge)](./docs/projects/)
[![Tianjin](https://img.shields.io/badge/target-Tianjin-a64242?style=for-the-badge)](./docs/job-search/tianjin.md)

## 为什么会有这个开源知识库

我是一名 37 岁的运维工程师，想从传统运维走向 AIOps / SRE / DevOps / 智能运维方向，并争取在天津找到相关工作。

这个仓库记录我的学习路线、实验项目、面试准备、求职复盘和每周学习记录。它借鉴了 [itwanger/toBeBetterJavaer](https://github.com/itwanger/toBeBetterJavaer) 的知识库组织方式：先讲清目标，再持续沉淀路线、文章、项目和求职材料。

中文目标名：To Be Better AIOps Engineer。

## 知识库地图

- [学习路线](./docs/roadmap/README.md)：90 天入门到作品集，24 周转岗强化。
- [能力地图](./docs/roadmap/00-skill-map.md)：AIOps 工程师需要掌握什么。
- [实战项目](./docs/projects/README.md)：用项目证明能力，而不是只堆关键词。
- [面试准备](./docs/interview/README.md)：把运维经验讲成 AIOps 工程故事。
- [天津求职](./docs/job-search/tianjin.md)：岗位关键词、投递策略、简历定位。
- [学习记录](./docs/learning-records/2026-07-01-start.md)：每周复盘和公开打卡。
- [资料清单](./docs/resources.md)：优先官方文档和高可信资源。

## 90 天主线

### 第 1 阶段：把运维经验工程化

- 复盘 3 个真实故障，提炼数据、告警、定位、处理动作。
- 学 SRE 的 SLI/SLO、错误预算、toil、事件复盘。
- 产出：`docs/learning-records/` 中至少 3 篇故障案例卡。

### 第 2 阶段：把数据流跑起来

- 搭建 Prometheus + Grafana + OpenTelemetry Collector + 日志采集。
- 设计一个服务的指标、日志、链路追踪和告警。
- 产出：[可观测性实验室](./docs/projects/01-observability-lab.md)。

### 第 3 阶段：做第一个 AIOps 小项目

- 用历史指标或模拟数据做异常检测。
- 对比阈值告警和 IsolationForest 等方法。
- 产出：[指标异常检测器](./docs/projects/02-metric-anomaly-detector.md)。

### 第 4 阶段：转成求职材料

- 把项目写成 README、架构图、运行截图、复盘。
- 准备 8 个面试故事：故障、自动化、监控、性能、容量、变更、协作、风险控制。
- 产出：简历项目段、面试题库、天津岗位投递清单。

## 项目优先级

1. 可观测性实验室：证明我能采集、展示、告警。
2. 指标异常检测器：证明我能把运维数据转成可评估模型。
3. 告警降噪器：证明我理解事件关联和一线值班痛点。
4. Runbook 助手：证明我能把处理经验变成可审计自动化。

## 更新节奏

- 每周至少 1 篇学习记录。
- 每两周至少 1 次项目提交。
- 每个月复盘一次求职关键词和简历表达。
- 每个项目必须有：问题背景、架构、运行方式、样例数据、效果评估、局限性。

## 从这里开始

先读 [学习路线](./docs/roadmap/README.md)，再完成 [学习记录模板](./docs/templates/weekly-review.md)。第一周不要贪多，只做一件事：把一个真实故障写成 AIOps 案例卡。
