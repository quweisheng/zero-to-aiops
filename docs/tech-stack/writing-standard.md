# 技术栈精讲写作标准

这个标准用来约束本仓库后续所有“一技术一文件”的文章。目标是写成小白能照着学、面试能拿来复盘、项目能直接引用的 AIOps 学习笔记。

## 文章不是资料搬运

每篇文章都必须基于官方文档和实际学习场景重新组织。可以引用官方链接，可以引用少量配置片段，但不能复制官方全文，也不能把官网内容逐段翻译。

写作时优先回答三个问题：

1. 这个技术为什么和 AIOps 有关？
2. 一个运维小白学它，第一天应该掌握什么？
3. 学完以后能留下什么证据放到 GitHub？

## 固定结构

每个技术栈文件至少包含这些部分：

| 部分 | 目的 |
|---|---|
| 学习目标 | 告诉读者学完能做什么 |
| 官方资料 | 给出官网入口，避免资料来源混乱 |
| 为什么要学 | 连接运维、SRE、AIOps 和求职 |
| 是什么 | 用大白话讲定义 |
| 解决什么问题 | 解释它出现的原因 |
| 核心原理 | 讲机制，不只讲命令 |
| 架构和数据流 | 说明组件关系 |
| 安装与启动 | 让读者能跑起来 |
| 配置详解 | 解释配置项为什么这么写 |
| 常用命令或查询 | 给出入门必会命令 |
| AIOps 场景 | 说明它在指标、日志、告警、自动化、AI 中的位置 |
| 入门实验 | 给出可复现的小实验 |
| 常见故障排查 | 写现象、原因、检查、解决 |
| 学习检查清单 | 帮读者确认自己学会了什么 |
| 面试题 | 把知识转成表达能力 |
| 学习证据 | 指导读者把成果提交到 GitHub |

## 讲解颗粒度

不要只写：

```text
Prometheus 是监控系统，可以采集指标。
```

要写成：

```text
Prometheus 负责周期性访问目标服务的 /metrics 接口，把返回的数值样本保存为时间序列。每条时间序列由指标名和标签唯一确定，所以同一个 http_requests_total 指标可以按 method、status、instance 区分不同维度。
```

讲解要覆盖“定义、为什么、怎么工作、怎么配置、怎么验证、坏了怎么查”。

## 小白友好规则

- 第一次出现英文缩写时，要解释全称和作用。
- 第一次出现配置字段时，要解释字段含义。
- 命令后面要写预期结果。
- 不假设读者已经懂 Kubernetes、Python、机器学习。
- 能画数据流就用文字图说明。

## AIOps 关联规则

每篇文章必须明确它属于 AIOps 链路的哪一段：

- 数据采集：Prometheus、OpenTelemetry、Loki、Filebeat。
- 数据存储：Elasticsearch、ClickHouse、VictoriaMetrics、MySQL。
- 数据展示：Grafana。
- 告警治理：Alertmanager、Grafana Alerting。
- 自动化执行：Ansible、Runbook Automation、GitHub Actions。
- 智能分析：pandas、scikit-learn、LLM、RAG。
- 稳定性方法：SLI、SLO、RCA、事件响应、变更管理。

## 学习证据规则

每学完一个技术，至少提交一种证据：

- 配置文件：如 `prometheus.yml`、`compose.yaml`、dashboard JSON。
- 截图：如 targets 页面、Grafana dashboard、构建成功页面。
- 笔记：如“Counter 和 Gauge 的区别”。
- 排障记录：如“为什么容器里不能访问 localhost:9090”。
- 小项目：如“用 Prometheus + Grafana 监控一个 FastAPI demo”。

## 示例文章

当前第一批示范文章：

- [Prometheus 精讲](./observability/prometheus.md)
- [Grafana 精讲](./observability/grafana.md)
- [Docker Compose 精讲](./cloud-native/docker-compose.md)

后续扩展其他技术栈时，以这三篇作为质量标准。

