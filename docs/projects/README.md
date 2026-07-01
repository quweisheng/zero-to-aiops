# 实战项目总览

项目不是越大越好，而是要能说明一个真实能力。

## 项目 1：可观测性实验室

目标：把 metrics、logs、traces 和 alerting 跑通。

- 技术：Prometheus、Grafana、OpenTelemetry Collector、一个 demo 服务。
- 简历表达：具备可观测性平台基础建设能力。
- 文档：[01-observability-lab.md](./01-observability-lab.md)

## 项目 2：指标异常检测器

目标：对历史指标做异常检测，输出异常时间段和解释。

- 技术：Python、pandas、scikit-learn、IsolationForest。
- 简历表达：能把运维指标转成可评估的数据分析任务。
- 文档：[02-metric-anomaly-detector.md](./02-metric-anomaly-detector.md)

## 项目 3：告警降噪器

目标：把重复、相关、同源告警聚合成事件。

- 技术：Python、规则引擎、时间窗口、服务拓扑。
- 简历表达：理解一线值班痛点，能降低告警疲劳。
- 文档：[03-alert-noise-reducer.md](./03-alert-noise-reducer.md)

## 项目 4：Runbook 助手

目标：根据事件类型推荐处理步骤，并保留人工确认和执行记录。

- 技术：Markdown runbook、检索、LLM 摘要、Ansible 或脚本执行。
- 简历表达：能把运维经验沉淀为安全自动化流程。

## 每个项目必须回答的问题

- 解决了什么生产问题？
- 输入数据是什么？
- 输出结果是什么？
- 如何评估效果？
- 出错时如何回滚？
- 哪些地方还不能自动化？
