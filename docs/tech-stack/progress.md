# 技术栈拆分进度

目标：每个技术栈一个 Markdown 文件，并且每个文件都按“官方资料、是什么、原理、架构、配置、入门实验、排障、学习证据”的结构写成原创中文教程。

## 已完成第一批

| 分类 | 技术栈 | 文件 |
|---|---|---|
| 基础工具 | Linux | [linux.md](./foundation/linux.md) |
| 基础工具 | Git | [git.md](./foundation/git.md) |
| 基础工具 | Python | [python.md](./foundation/python.md) |
| 基础工具 | Shell / PowerShell | [shell-powershell.md](./foundation/shell-powershell.md) |
| 云原生 | Docker | [docker.md](./cloud-native/docker.md) |
| 云原生 | Docker Compose | [docker-compose.md](./cloud-native/docker-compose.md) |
| 可观测性 | Prometheus | [prometheus.md](./observability/prometheus.md) |
| 可观测性 | Grafana | [grafana.md](./observability/grafana.md) |
| 可观测性 | OpenTelemetry | [opentelemetry.md](./observability/opentelemetry.md) |

## 待继续拆分

| 分类 | 技术栈 | 目标文件 |
|---|---|---|
| 基础工具 | GitHub | `foundation/github.md` |
| 基础工具 | Markdown | `foundation/markdown.md` |
| 基础工具 | VitePress | `foundation/vitepress.md` |
| 基础工具 | systemd | `foundation/systemd.md` |
| 基础工具 | 网络基础 | `foundation/networking.md` |
| 可观测性 | Alertmanager | `observability/alertmanager.md` |
| 可观测性 | Loki | `observability/loki.md` |
| 可观测性 | Elasticsearch | `observability/elasticsearch.md` |
| 云原生 | Kubernetes | `cloud-native/kubernetes.md` |
| 云原生 | Helm | `cloud-native/helm.md` |
| 云原生 | NGINX / Ingress | `cloud-native/nginx-ingress.md` |
| 自动化 | Ansible | `automation/ansible.md` |
| 自动化 | Terraform | `automation/terraform.md` |
| 自动化 | GitHub Actions | `automation/github-actions.md` |
| 自动化 | CI/CD | `automation/cicd.md` |
| 自动化 | Runbook Automation | `automation/runbook-automation.md` |
| 数据与 AI | MySQL / SQL | `data-ai/mysql-sql.md` |
| 数据与 AI | Redis | `data-ai/redis.md` |
| 数据与 AI | Kafka | `data-ai/kafka.md` |
| 数据与 AI | pandas | `data-ai/pandas.md` |
| 数据与 AI | scikit-learn | `data-ai/scikit-learn.md` |
| 数据与 AI | FastAPI | `data-ai/fastapi.md` |
| 数据与 AI | LLM / OpenAI API | `data-ai/llm-openai.md` |
| 数据与 AI | RAG | `data-ai/rag.md` |
| 数据与 AI | 向量数据库 | `data-ai/vector-database.md` |
| SRE/AIOps | SLI / SLO / SLA | `sre-aiops/sli-slo-sla.md` |
| SRE/AIOps | 告警治理 | `sre-aiops/alert-governance.md` |
| SRE/AIOps | 事件响应 | `sre-aiops/incident-response.md` |
| SRE/AIOps | Runbook | `sre-aiops/runbook.md` |
| SRE/AIOps | RCA 根因分析 | `sre-aiops/rca.md` |
| SRE/AIOps | 变更管理 | `sre-aiops/change-management.md` |
| SRE/AIOps | AIOps 闭环 | `sre-aiops/aiops-loop.md` |

## 写作规则

- 只引用官方链接和高可信资料，不复制官方全文。
- 每篇都要能让零基础读者照着做第一个实验。
- 每篇都要说明它在 AIOps 链路中的作用。
- 每篇最后必须有“学习证据”，方便持续记录到 GitHub。
