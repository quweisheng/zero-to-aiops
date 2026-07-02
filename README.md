# zero-to-aiops

> 成为一名更好的 AIOps 工程师：从运维经验出发，用可观测性、自动化、数据分析和 AI 能力解决真实生产问题。

[![Learning](https://img.shields.io/badge/learning-AIOps-2457a6?style=for-the-badge)](./docs/roadmap/)
[![Tech Stack](https://img.shields.io/badge/tech-stack-1f7a5a?style=for-the-badge)](./docs/tech-stack/README.md)
[![Interview](https://img.shields.io/badge/interview-ready-a64242?style=for-the-badge)](./docs/interview/README.md)

## 为什么会有这个开源知识库

我是一名 37 岁的运维工程师，想从传统运维走向 AIOps / SRE / DevOps / 智能运维方向，并争取在天津找到相关工作。

这个仓库记录我的学习路线、技术栈精讲、面试准备和公开学习沉淀。它借鉴了 [itwanger/toBeBetterJavaer](https://github.com/itwanger/toBeBetterJavaer) 的知识库组织方式：先讲清目标，再持续沉淀路线、文章和工程化证据。

中文目标名：To Be Better AIOps Engineer。

## 本地运行

这个网站现在使用 React、TypeScript 和 Vite 构建，Markdown 内容仍然保留在 `docs/` 目录。

```bash
npm install
npm run dev
npm run build
```

## 知识库地图

- [学习路线](./docs/roadmap/README.md)：从运维经验切入 AIOps 的长期路线。
- [能力地图](./docs/roadmap/00-skill-map.md)：AIOps 工程师需要掌握什么。
- [技术栈总清单](./docs/tech-stack/README.md)：学习过程中涉及的技术栈、原理、架构、配置和练习。
- [面试准备](./docs/interview/README.md)：把运维经验讲成 AIOps 工程故事。
- [资料清单](./docs/resources.md)：优先官方文档和高可信资源。
- [技术栈精讲写作标准](./docs/tech-stack/writing-standard.md)：每篇技术文章的统一写法。

## 技术栈入口

### 基础工具

- [Linux](./docs/tech-stack/foundation/linux.md)
- [Git](./docs/tech-stack/foundation/git.md)
- [GitHub](./docs/tech-stack/foundation/github.md)
- [Markdown](./docs/tech-stack/foundation/markdown.md)
- [VitePress](./docs/tech-stack/foundation/vitepress.md)
- [Python](./docs/tech-stack/foundation/python.md)
- [Shell / PowerShell](./docs/tech-stack/foundation/shell-powershell.md)
- [systemd](./docs/tech-stack/foundation/systemd.md)
- [网络基础](./docs/tech-stack/foundation/networking.md)

### 可观测性

- [Prometheus](./docs/tech-stack/observability/prometheus.md)
- [Grafana](./docs/tech-stack/observability/grafana.md)
- [OpenTelemetry](./docs/tech-stack/observability/opentelemetry.md)
- [Alertmanager](./docs/tech-stack/observability/alertmanager.md)
- [Loki](./docs/tech-stack/observability/loki.md)
- [Elasticsearch](./docs/tech-stack/observability/elasticsearch.md)

### 云原生

- [Docker](./docs/tech-stack/cloud-native/docker.md)
- [Docker Compose](./docs/tech-stack/cloud-native/docker-compose.md)
- [Kubernetes](./docs/tech-stack/cloud-native/kubernetes.md)
- [Helm](./docs/tech-stack/cloud-native/helm.md)
- [NGINX / Ingress](./docs/tech-stack/cloud-native/nginx-ingress.md)

### 自动化与 CI/CD

- [Ansible](./docs/tech-stack/automation/ansible.md)
- [Terraform](./docs/tech-stack/automation/terraform.md)
- [GitHub Actions](./docs/tech-stack/automation/github-actions.md)
- [CI/CD](./docs/tech-stack/automation/cicd.md)
- [Runbook Automation](./docs/tech-stack/automation/runbook-automation.md)

### 数据与 AI

- [MySQL / SQL](./docs/tech-stack/data-ai/mysql-sql.md)
- [Redis](./docs/tech-stack/data-ai/redis.md)
- [Kafka](./docs/tech-stack/data-ai/kafka.md)
- [pandas](./docs/tech-stack/data-ai/pandas.md)
- [scikit-learn](./docs/tech-stack/data-ai/scikit-learn.md)
- [FastAPI](./docs/tech-stack/data-ai/fastapi.md)
- [LLM / OpenAI API](./docs/tech-stack/data-ai/llm-openai.md)
- [RAG](./docs/tech-stack/data-ai/rag.md)
- [向量数据库](./docs/tech-stack/data-ai/vector-database.md)

### SRE/AIOps 实践

- [SLI / SLO / SLA](./docs/tech-stack/sre-aiops/sli-slo-sla.md)
- [告警治理](./docs/tech-stack/sre-aiops/alert-governance.md)
- [事件响应](./docs/tech-stack/sre-aiops/incident-response.md)
- [Runbook](./docs/tech-stack/sre-aiops/runbook.md)
- [RCA 根因分析](./docs/tech-stack/sre-aiops/rca.md)
- [变更管理](./docs/tech-stack/sre-aiops/change-management.md)
- [AIOps 闭环](./docs/tech-stack/sre-aiops/aiops-loop.md)

## 学习主线

第一阶段先补基础工具和 SRE/AIOps 实践，保证能记录、复盘、提交和表达稳定性问题。

第二阶段打通可观测性和云原生，把指标、日志、链路、容器和 Kubernetes 的基本链路跑起来。

第三阶段学习自动化、数据与 AI，把人工排障经验沉淀成脚本、流水线、异常检测和智能助手。


## 从这里开始

先读 [学习路线](./docs/roadmap/README.md) 和 [技术栈总清单](./docs/tech-stack/README.md)，再从 [Linux](./docs/tech-stack/foundation/linux.md)、[Git](./docs/tech-stack/foundation/git.md)、[Prometheus](./docs/tech-stack/observability/prometheus.md) 这几篇开始补基础。
