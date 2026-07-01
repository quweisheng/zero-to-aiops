# AIOps 技术栈总清单

这个目录记录我从 0 学 AIOps 过程中会接触到的技术栈。它不是一次性背诵清单，而是一个长期学习地图：每学一项，就补充理解、配置、实验和踩坑记录。

## 学习优先级

- P0：必须先学。没有它，后面的项目做不起来。
- P1：求职核心。AIOps / SRE / DevOps 岗位经常出现。
- P2：项目进阶。能让作品集更像真实生产系统。
- P3：扩展方向。等 P0-P2 有项目后再深入。

## 技术栈地图

| 类别 | 技术 | 优先级 | 学到什么程度 |
|---|---|---:|---|
| 基础工具 | Linux、systemd、网络、Git、GitHub、Markdown、VitePress、Python、Shell/PowerShell | P0 | 能排障、能写记录、能提交代码、能跑脚本 |
| 可观测性 | Prometheus、Alertmanager、Grafana、OpenTelemetry、Loki、Elasticsearch | P1 | 能采集指标/日志/链路、能做仪表盘和告警 |
| 云原生 | Docker、Kubernetes、Helm、NGINX/Ingress | P1 | 能容器化服务、理解 K8s 资源、能部署实验环境 |
| 自动化与 CI/CD | Ansible、Terraform、GitHub Actions | P1-P2 | 能把手工操作写成自动化，能自动构建文档/项目 |
| 数据与 AI | SQL/MySQL、Redis、Kafka、pandas、scikit-learn、FastAPI、LLM、RAG、向量数据库 | P1-P3 | 能处理运维数据、做异常检测、做智能运维助手 |
| SRE/AIOps 实践 | SLI/SLO、告警治理、事件响应、Runbook、根因分析、变更管理 | P0-P1 | 能把工具能力转成稳定性结果和面试故事 |

## 推荐学习顺序

1. [基础工具](./01-foundation.md)：先会记录、提交、跑命令、读系统状态。
2. [SRE 与 AIOps 实践](./06-sre-aiops-practices.md)：先知道为什么学这些工具。
3. [可观测性](./02-observability.md)：先把数据采集和展示跑通。
4. [云原生](./03-cloud-native.md)：把服务放进容器和 K8s。
5. [自动化与 CI/CD](./04-automation-ci.md)：把重复动作变成流程。
6. [数据与 AI](./05-data-ai.md)：用数据做异常检测、告警降噪、智能助手。

## 每个技术栈都按这个模板记录

```md
## 技术名

### 是什么
一句话定义它。

### 原理
它底层靠什么机制工作。

### 架构
它有哪些核心组件，数据怎么流动。

### 在 AIOps 中的作用
它解决 AIOps 链路里的哪一段问题。

### 配置重点
学习时必须知道哪些配置文件、端口、命令、参数。

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
  -> Python 分析异常
  -> Runbook 建议动作
  -> GitHub 记录过程
```

这条链路打通后，再补 Kubernetes、OpenTelemetry、Loki、Ansible、LLM/RAG。

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
- [pandas](https://pandas.pydata.org/docs/)
- [scikit-learn IsolationForest](https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.IsolationForest.html)
- [Google SRE Books](https://sre.google/books/)
