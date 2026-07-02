# AIOps 技术栈总清单

这个目录记录我从 0 学 AIOps 过程中会接触到的技术栈。它不是一次性背诵清单，而是一个长期学习地图：每学一项，就补充理解、配置、实验和踩坑记录。

## 精讲写作标准

后续每个技术栈文件都会按 [技术栈精讲写作标准](./writing-standard.md) 补齐内容：官方资料、场景开场、是什么、原理、架构、配置、实验、排障、面试题和学习证据。

写作目标不是“资料越全越好”，而是像有人带着学一样，把一个新手最容易卡住的地方提前讲出来：为什么要学、术语怎么理解、第一步怎么跑、坏了先查哪里、最后怎么变成 AIOps 项目证据。

第一批示范级文章：

- [Prometheus 精讲](./observability/prometheus.md)
- [Grafana 精讲](./observability/grafana.md)
- [Docker Compose 精讲](./cloud-native/docker-compose.md)

## 学习优先级

- P0：必须先学。没有它，后面的项目做不起来。
- P1：求职核心。AIOps / SRE / DevOps 岗位经常出现。
- P2：项目进阶。能让作品集更像真实生产系统。
- P3：扩展方向。等 P0-P2 有项目后再深入。

## 技术栈地图

| 类别 | 技术 | 优先级 | 学到什么程度 |
|---|---|---:|---|
| 基础工具 | Linux、systemd、网络、Git、GitHub、Markdown、VitePress、Python、Shell/PowerShell | P0 | 能排障、能写记录、能提交代码、能跑脚本 |
| 可观测性 | Prometheus、Alertmanager、Grafana、OpenTelemetry、Loki、Elasticsearch | P1 | 能采集指标、日志、链路，能做仪表盘和告警 |
| 云原生 | Docker、Kubernetes、Helm、NGINX/Ingress | P1 | 能容器化服务，理解 K8s 资源，能部署实验环境 |
| 自动化与 CI/CD | Ansible、Terraform、GitHub Actions、CI/CD、Runbook Automation | P1-P2 | 能把手工操作写成自动化流程，能自动构建文档和项目 |
| 数据与 AI | MySQL/SQL、Redis、Kafka、pandas、scikit-learn、FastAPI、LLM/OpenAI API、RAG、向量数据库 | P1-P3 | 能处理运维数据，做异常检测、告警降噪和智能运维助手 |
| SRE/AIOps 实践 | SLI/SLO、告警治理、事件响应、Runbook、RCA、变更管理、AIOps 闭环 | P0-P1 | 能把工具能力转成稳定性结果和面试故事 |

## 推荐学习顺序

1. [Linux](./foundation/linux.md)：先会记录、提交、跑命令、读系统状态。
2. [SLI / SLO / SLA](./sre-aiops/sli-slo-sla.md)：先知道为什么学这些工具。
3. [Prometheus](./observability/prometheus.md)：先把数据采集跑通。
4. [Docker](./cloud-native/docker.md)：把服务放进容器。
5. [GitHub Actions](./automation/github-actions.md)：把重复动作变成流程。
6. [pandas](./data-ai/pandas.md)：用数据做异常检测、告警降噪、智能助手。

## 一技术一文件

当前已经拆分为独立教程的技术：

### 基础工具

- [Linux](./foundation/linux.md)
- [Git](./foundation/git.md)
- [GitHub](./foundation/github.md)
- [Markdown](./foundation/markdown.md)
- [VitePress](./foundation/vitepress.md)
- [Python](./foundation/python.md)
- [Shell / PowerShell](./foundation/shell-powershell.md)
- [systemd](./foundation/systemd.md)
- [网络基础](./foundation/networking.md)

### 云原生

- [Docker](./cloud-native/docker.md)
- [Docker Compose](./cloud-native/docker-compose.md)
- [Kubernetes](./cloud-native/kubernetes.md)
- [Helm](./cloud-native/helm.md)
- [NGINX / Ingress](./cloud-native/nginx-ingress.md)

### 可观测性

- [Prometheus](./observability/prometheus.md)
- [Grafana](./observability/grafana.md)
- [OpenTelemetry](./observability/opentelemetry.md)
- [Alertmanager](./observability/alertmanager.md)
- [Loki](./observability/loki.md)
- [Elasticsearch](./observability/elasticsearch.md)

### 自动化

- [Ansible](./automation/ansible.md)
- [Terraform](./automation/terraform.md)
- [GitHub Actions](./automation/github-actions.md)
- [CI/CD](./automation/cicd.md)
- [Runbook Automation](./automation/runbook-automation.md)

### 数据与 AI

- [MySQL / SQL](./data-ai/mysql-sql.md)
- [Redis](./data-ai/redis.md)
- [Kafka](./data-ai/kafka.md)
- [pandas](./data-ai/pandas.md)
- [scikit-learn](./data-ai/scikit-learn.md)
- [FastAPI](./data-ai/fastapi.md)
- [LLM / OpenAI API](./data-ai/llm-openai.md)
- [RAG](./data-ai/rag.md)
- [向量数据库](./data-ai/vector-database.md)

### SRE/AIOps 实践

- [SLI / SLO / SLA](./sre-aiops/sli-slo-sla.md)
- [告警治理](./sre-aiops/alert-governance.md)
- [事件响应](./sre-aiops/incident-response.md)
- [Runbook](./sre-aiops/runbook.md)
- [RCA 根因分析](./sre-aiops/rca.md)
- [变更管理](./sre-aiops/change-management.md)
- [AIOps 闭环](./sre-aiops/aiops-loop.md)

完整拆分进度见：[技术栈拆分进度](./progress.md)。

## 每个技术栈都按这个模板记录

```md
## 技术名

### 场景开场
用真实运维场景引入，不直接背定义。

### 一句话人话版
先用一句白话讲清楚它接收什么、处理什么、输出什么。

### 小白可能会问
把读者可能卡住的 2 到 4 个问题先抛出来。

### 官方资料
列出官网教程和参考文档。

### 是什么
一句话定义它。

### 原理
它底层靠什么机制工作。

### 架构
它有哪些核心组件，数据怎么流动。

### 在 AIOps 中的作用
它解决 AIOps 链路里的哪一段问题。

### 配置重点
必须知道哪些配置文件、端口、命令、参数。

### 入门练习
做一个能提交到 GitHub 的小实验。

### 学习证据
学完后在 GitHub 留下什么。
```

## 不要平均用力

AIOps 的第一阶段不是“所有技术都懂一点”，而是先打通一条小闭环：

```text
Linux 服务
  -> Prometheus 指标
  -> Grafana 仪表盘
  -> Alertmanager 告警
  -> Python / pandas 分析
  -> scikit-learn 异常检测
  -> FastAPI 暴露接口
  -> LLM / RAG 生成排障建议
  -> GitHub 记录过程
```

这条链路打通后，再补 Kubernetes、OpenTelemetry、Loki、Ansible、Kafka、向量数据库和更完整的 SRE 流程。

## 官方资料入口

- [Git](https://git-scm.com/book/en/v2/Getting-Started-What-is-Git%3F)
- [GitHub README](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes)
- [VitePress](https://vitepress.dev/)
- [Python venv](https://docs.python.org/3/library/venv.html)
- [Docker](https://docs.docker.com/get-started/docker-overview/)
- [Kubernetes](https://kubernetes.io/docs/concepts/overview/)
- [Prometheus](https://prometheus.io/docs/introduction/overview/)
- [Grafana](https://grafana.com/docs/)
- [OpenTelemetry](https://opentelemetry.io/docs/)
- [Ansible](https://docs.ansible.com/projects/ansible/latest/index.html)
- [Terraform](https://developer.hashicorp.com/terraform/docs)
- [GitHub Actions](https://docs.github.com/actions)
- [MySQL](https://dev.mysql.com/doc/refman/8.4/en/tutorial.html)
- [Redis](https://redis.io/docs/latest/)
- [Apache Kafka](https://kafka.apache.org/documentation/)
- [pandas](https://pandas.pydata.org/docs/)
- [scikit-learn](https://scikit-learn.org/stable/user_guide.html)
- [FastAPI](https://fastapi.tiangolo.com/)
- [OpenAI API](https://developers.openai.com/api/docs/quickstart)
- [LangChain RAG](https://docs.langchain.com/oss/python/langchain/rag)
- [Milvus](https://milvus.io/docs)
- [Chroma](https://docs.trychroma.com/docs/overview/introduction)
- [Google SRE Books](https://sre.google/books/)
- [Microsoft Learn - AIOps and agentic operations](https://learn.microsoft.com/en-us/azure/azure-monitor/aiops/aiops-and-agentic-operations)
