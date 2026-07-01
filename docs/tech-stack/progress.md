# 技术栈拆分进度

目标：每个技术栈一个 Markdown 文件，并且每个文件都按“官方资料、是什么、原理、架构、配置、入门实验、排障、学习证据”的结构写成原创中文教程。

## 精讲示范

当前已经按 [技术栈精讲写作标准](./writing-standard.md) 完成第一批示范文章：

| 技术栈 | 文件 | 示范重点 |
|---|---|---|
| Prometheus | [prometheus.md](./observability/prometheus.md) | 指标模型、抓取配置、PromQL、告警、AIOps 数据链路 |
| Grafana | [grafana.md](./observability/grafana.md) | 数据源、dashboard、panel、变量、AIOps 值班视图 |
| Docker Compose | [docker-compose.md](./cloud-native/docker-compose.md) | 多容器实验环境、服务名网络、卷挂载、Prometheus + Grafana 实验 |

## 精讲批次进度

| 批次 | 范围 | 状态 | 说明 |
|---|---|---|---|
| 0 | Prometheus、Grafana、Docker Compose | 已完成 | 第一批示范级文章 |
| 1 | Linux、Git、GitHub、Markdown、VitePress、Python、Shell/PowerShell、systemd、网络基础 | 已完成 | 已补齐为什么学、解决问题、检查清单、面试题 |
| 2 | Docker、Kubernetes、Helm、NGINX/Ingress | 待改造 | 云原生核心 |
| 3 | Alertmanager、OpenTelemetry、Loki、Elasticsearch | 待改造 | 可观测性补齐 |
| 4 | Ansible、Terraform、GitHub Actions、CI/CD、Runbook Automation | 待改造 | 自动化与交付 |
| 5 | MySQL、Redis、Kafka、pandas、scikit-learn、FastAPI、LLM、RAG、向量数据库 | 待改造 | 数据与 AI |
| 6 | SLI/SLO/SLA、告警治理、事件响应、Runbook、RCA、变更管理、AIOps 闭环 | 待改造 | SRE/AIOps 方法论 |

## 已完成

| 分类 | 技术栈 | 文件 |
|---|---|---|
| 基础工具 | Linux | [linux.md](./foundation/linux.md) |
| 基础工具 | Git | [git.md](./foundation/git.md) |
| 基础工具 | GitHub | [github.md](./foundation/github.md) |
| 基础工具 | Markdown | [markdown.md](./foundation/markdown.md) |
| 基础工具 | VitePress | [vitepress.md](./foundation/vitepress.md) |
| 基础工具 | Python | [python.md](./foundation/python.md) |
| 基础工具 | Shell / PowerShell | [shell-powershell.md](./foundation/shell-powershell.md) |
| 基础工具 | systemd | [systemd.md](./foundation/systemd.md) |
| 基础工具 | 网络基础 | [networking.md](./foundation/networking.md) |
| 云原生 | Docker | [docker.md](./cloud-native/docker.md) |
| 云原生 | Docker Compose | [docker-compose.md](./cloud-native/docker-compose.md) |
| 云原生 | Kubernetes | [kubernetes.md](./cloud-native/kubernetes.md) |
| 云原生 | Helm | [helm.md](./cloud-native/helm.md) |
| 云原生 | NGINX / Ingress | [nginx-ingress.md](./cloud-native/nginx-ingress.md) |
| 可观测性 | Prometheus | [prometheus.md](./observability/prometheus.md) |
| 可观测性 | Grafana | [grafana.md](./observability/grafana.md) |
| 可观测性 | OpenTelemetry | [opentelemetry.md](./observability/opentelemetry.md) |
| 可观测性 | Alertmanager | [alertmanager.md](./observability/alertmanager.md) |
| 可观测性 | Loki | [loki.md](./observability/loki.md) |
| 可观测性 | Elasticsearch | [elasticsearch.md](./observability/elasticsearch.md) |
| 自动化 | Ansible | [ansible.md](./automation/ansible.md) |
| 自动化 | Terraform | [terraform.md](./automation/terraform.md) |
| 自动化 | GitHub Actions | [github-actions.md](./automation/github-actions.md) |
| 自动化 | CI/CD | [cicd.md](./automation/cicd.md) |
| 自动化 | Runbook Automation | [runbook-automation.md](./automation/runbook-automation.md) |
| 数据与 AI | MySQL / SQL | [mysql-sql.md](./data-ai/mysql-sql.md) |
| 数据与 AI | Redis | [redis.md](./data-ai/redis.md) |
| 数据与 AI | Kafka | [kafka.md](./data-ai/kafka.md) |
| 数据与 AI | pandas | [pandas.md](./data-ai/pandas.md) |
| 数据与 AI | scikit-learn | [scikit-learn.md](./data-ai/scikit-learn.md) |
| 数据与 AI | FastAPI | [fastapi.md](./data-ai/fastapi.md) |
| 数据与 AI | LLM / OpenAI API | [llm-openai.md](./data-ai/llm-openai.md) |
| 数据与 AI | RAG | [rag.md](./data-ai/rag.md) |
| 数据与 AI | 向量数据库 | [vector-database.md](./data-ai/vector-database.md) |
| SRE/AIOps | SLI / SLO / SLA | [sli-slo-sla.md](./sre-aiops/sli-slo-sla.md) |
| SRE/AIOps | 告警治理 | [alert-governance.md](./sre-aiops/alert-governance.md) |
| SRE/AIOps | 事件响应 | [incident-response.md](./sre-aiops/incident-response.md) |
| SRE/AIOps | Runbook | [runbook.md](./sre-aiops/runbook.md) |
| SRE/AIOps | RCA 根因分析 | [rca.md](./sre-aiops/rca.md) |
| SRE/AIOps | 变更管理 | [change-management.md](./sre-aiops/change-management.md) |
| SRE/AIOps | AIOps 闭环 | [aiops-loop.md](./sre-aiops/aiops-loop.md) |

## 待继续拆分

当前技术栈清单已经全部拆分完成。后续如果学习中新增技术，比如 VictoriaMetrics、Thanos、ClickHouse、Airflow、Flink、LangGraph、Argo CD，再继续按“一技术一文件”追加。

## 写作规则

- 只引用官方链接和高可信资料，不复制官方全文。
- 每篇都要能让零基础读者照着做第一个实验。
- 每篇都要说明它在 AIOps 链路中的作用。
- 每篇最后必须有“学习证据”，方便持续记录到 GitHub。
