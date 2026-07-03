# 技术栈拆分进度

目标：每个技术栈一个 Markdown 文件，并且每个文件都按“官方资料、是什么、原理、架构、配置、入门实验、排障、学习证据”的结构写成原创中文教程。

## 精讲示范

当前已经按 [技术栈精讲写作标准](./writing-standard.md) 完成第一批示范文章：

| 技术栈 | 文件 | 示范重点 |
|---|---|---|
| Prometheus | [prometheus.md](./observability/prometheus.md) | 指标模型、抓取配置、PromQL、告警、AIOps 数据链路 |
| Grafana | [grafana.md](./observability/grafana.md) | 数据源、dashboard、panel、变量、AIOps 值班视图 |
| Docker Compose | [docker-compose.md](./cloud-native/docker-compose.md) | 多容器实验环境、服务名网络、卷挂载、Prometheus + Grafana 实验 |

## 通俗精讲改造进度

这里跟踪的是“像有人带着学一样讲清楚”的新版表达，不只是结构完整。新版表达至少包含：场景开场、一句话人话版、小白可能会问、关键术语拆解、入门实验、排障回路、面试怎么讲、学习证据。

| 状态 | 技术栈 | 说明 |
|---|---|---|
| 已升级开头和面试表达 | Prometheus、Grafana、Alertmanager、OpenTelemetry、Loki、Elasticsearch | 可观测性组已补通俗开场、人话版、小白追问和面试表达 |
| 已升级开头和面试表达 | Linux、Git、GitHub、Markdown、VitePress、Python、Shell/PowerShell、systemd、网络基础 | 基础工具组已补通俗开场、人话版、小白追问和面试表达 |
| 已升级开头和面试表达 | Docker、Docker Compose、Kubernetes、Helm、NGINX/Ingress、微服务 | 云原生组已补通俗开场、人话版、小白追问和面试表达 |
| 已升级开头和面试表达 | Ansible、Terraform、GitHub Actions、CI/CD、Runbook Automation | 自动化组已补通俗开场、人话版、小白追问和面试表达 |
| 已升级开头和面试表达 | MySQL、Redis、Kafka、RabbitMQ、pandas、scikit-learn、FastAPI、LLM、RAG、向量数据库 | 数据与 AI 组已补通俗开场、人话版、小白追问和面试表达 |
| 已升级开头和面试表达 | SLI/SLO/SLA、告警治理、事件响应、Runbook、RCA、变更管理、AIOps 闭环 | SRE/AIOps 实践组已补通俗开场、人话版、小白追问和面试表达 |

## 深讲样板进度

这里跟踪的是更高一级的“真能从 0 学会”的深讲改造。深讲不只是通俗开头，还必须有官方知识地图、核心机制、命令/配置/API 字典、字段解释、输出解释、实验、排障和学习证据。

| 状态 | 技术栈 | 文件 | 深讲重点 |
|---|---|---|---|
| 已完成第一版 | Linux | [linux.md](./foundation/linux.md) | 内核、用户态/内核态、系统调用、启动过程、目录结构、权限、进程、CPU、内存、磁盘、网络、日志、AIOps 必会命令字典 |
| 已完成第一版 | Git | [git.md](./foundation/git.md) | 官方 Git Book 结构、三棵树、文件状态、对象模型、HEAD、分支、合并、远程、撤销、冲突、AIOps 必会 Git 命令字典 |
| 已完成第一版 | Python | [python.md](./foundation/python.md) | 官方 Python 文档结构、解释器、虚拟环境、pip、基础类型、控制流、函数、模块、标准库、AIOps 告警日报实验、命令/API 字典 |
| 已完成第一版 | Docker | [docker.md](./cloud-native/docker.md) | Docker 官方结构、Engine 架构、镜像和容器、Dockerfile 指令、build context、网络、存储、日志、资源限制、安全边界、AIOps 容器化实验、命令字典 |
| 已完成第一版 | Prometheus | [prometheus.md](./observability/prometheus.md) | Prometheus 官方结构、数据模型、指标类型、jobs/instances、抓取配置、TSDB、PromQL、recording/alerting rules、HTTP API、promtool、AIOps 指标实验 |
| 已完成第一版 | Grafana | [grafana.md](./observability/grafana.md) | Grafana 官方结构、数据源、Prometheus 查询、dashboard/panel/field/variable/transformation、provisioning、alerting、HTTP API、AIOps 值班 dashboard 实验 |
| 已完成第一版 | Docker Compose | [docker-compose.md](./cloud-native/docker-compose.md) | Compose 官方应用模型、project/service/network/volume/config/secret、Compose 文件字段、healthcheck、profiles、CLI 命令字典、Prometheus + Grafana + demo app 实验 |
| 已完成第一版 | GitHub | [github.md](./foundation/github.md) | GitHub 官方结构、repository、README、GitHub Flow、Issues、Pull Requests、Actions、Pages、认证、Secrets、安全、AIOps 作品集实验 |
| 已完成第一版 | Markdown | [markdown.md](./foundation/markdown.md) | CommonMark、GitHub Flavored Markdown、块级/行内语法、表格、任务列表、链接、图片、代码块、Frontmatter、AIOps 文档模板、排障字典 |
| 已完成第一版 | VitePress | [vitepress.md](./foundation/vitepress.md) | VitePress v1 官方结构、source directory、文件路由、config、themeConfig、nav/sidebar、Markdown 扩展、base、构建、GitHub Pages 部署、排障 |
| 已完成第一版 | Shell/PowerShell | [shell-powershell.md](./foundation/shell-powershell.md) | Bash / GNU 工具和 PowerShell 官方结构、命令执行模型、文本管道 vs 对象管道、变量、环境变量、引号、通配符、重定向、退出码、脚本、执行策略、常用命令对照、AIOps 健康检查实验 |
| 已完成第一版 | systemd | [systemd.md](./foundation/systemd.md) | systemd 官方结构、PID 1、unit、service、target、timer、journal、systemctl、journalctl、依赖/排序、重启策略、开机自启、AIOps 健康检查 timer 实验、排障流程 |
| 已完成第一版 | 网络基础 | [networking.md](./foundation/networking.md) | IETF RFC 知识地图、DNS、IP/CIDR、路由、ARP、TCP、UDP、TLS、HTTP、负载均衡、curl/dig/ip/ss/openssl 命令字典、AIOps 分层网络诊断实验 |
| 已完成第一版 | Kubernetes | [kubernetes.md](./cloud-native/kubernetes.md) | Kubernetes 官方概念地图、控制面、节点、API 对象模型、Pod、Deployment、ReplicaSet、Service、EndpointSlice、DNS、ConfigMap、Secret、requests/limits、调度、kubectl 字典、AIOps 排障实验 |
| 已完成第一版 | Helm | [helm.md](./cloud-native/helm.md) | Helm 官方结构、Chart、Release、Revision、values、templates、内置对象、常用模板函数、install/upgrade/rollback、dependency、hooks、helm 命令字典、AIOps 发布诊断实验 |
| 已完成第一版 | NGINX/Ingress | [nginx-ingress.md](./cloud-native/nginx-ingress.md) | NGINX 官方结构、反向代理、server/location/upstream/proxy_pass/proxy_set_header、日志字段、timeout、Kubernetes Ingress、IngressClass、Controller、TLS、annotations、404/502/503/504 排障 |
| 已完成第一版 | 微服务 | [microservices.md](./cloud-native/microservices.md) | 服务边界、API、服务发现、配置、容错、数据一致性、异步消息、Kubernetes 发布、OpenTelemetry 链路、AIOps 服务拓扑和故障传播排障 |
| 已完成第一版 | Alertmanager | [alertmanager.md](./observability/alertmanager.md) | Prometheus Alertmanager 官方结构、alert labels/annotations、route tree、receiver、grouping、deduplication、silence、inhibition、notification template、webhook、API、amtool、AIOps 告警诊断实验 |
| 已完成第一版 | OpenTelemetry | [opentelemetry.md](./observability/opentelemetry.md) | OpenTelemetry 官方结构、traces/metrics/logs、Trace/Span/Context、resource、semantic conventions、instrumentation、API/SDK、OTLP、Collector receiver/processor/exporter/pipeline、AIOps 遥测诊断实验 |
| 已完成第一版 | Loki | [loki.md](./observability/loki.md) | Grafana Loki 官方结构、log stream、labels、cardinality、chunks、index、写入/查询路径、组件、storage schema、Alloy/Promtail EOL、LogQL、日志告警、AIOps 日志诊断实验 |
| 已完成第一版 | Elasticsearch | [elasticsearch.md](./observability/elasticsearch.md) | Elastic 官方结构、cluster/node/index/document、shards/replicas、cluster health、mapping、text vs keyword、analyzer、倒排索引、Query DSL、aggregations、data streams、templates、ingest pipeline、ILM、AIOps 搜索诊断实验 |
| 已完成第一版 | Ansible | [ansible.md](./automation/ansible.md) | Ansible 官方结构、control/managed node、inventory、patterns、ad hoc、modules、playbook/play/task、幂等性、variables、facts、handlers、templates、roles、collections、Vault、ansible.cfg、命令字典、AIOps 自动化实验 |
| 已完成第一版 | Terraform | [terraform.md](./automation/terraform.md) | Terraform 官方结构、HCL、terraform block、providers、resources、data sources、variables、locals、outputs、state、backend、plan/apply、dependency graph、meta-arguments、lifecycle、modules、workspaces、drift、import、命令字典、AIOps IaC 诊断实验 |
| 已完成第一版 | GitHub Actions | [github-actions.md](./automation/github-actions.md) | GitHub Actions 官方结构、event/workflow/job/runner/step/action、workflow syntax、triggers、contexts、expressions、env/vars/secrets、GITHUB_TOKEN/permissions、artifacts/cache、workflow commands、concurrency、environments、Pages 发布、AIOps runbook、命令字典、排障、安全边界 |
| 已完成第一版 | CI/CD | [cicd.md](./automation/cicd.md) | GitHub Actions 官方 CI/CD 结构、持续集成/持续交付/持续部署边界、pipeline/stage/job/step/runner/artifact/environment、CI 阶段、CD 阶段、发布策略、回滚策略、质量门禁、DORA 指标、AIOps 变更关联、命令字典和排障 |
| 已完成第一版 | Runbook Automation | [runbook-automation.md](./automation/runbook-automation.md) | AWS/Azure/Google SRE 官方结构、runbook/playbook/automation workflow 边界、触发器、输入参数、上下文补全、runbook 选择、风险分级、L0-L4 自动化、幂等和可重启、权限/审批/审计、安全护栏、LLM 边界、AIOps selector 实验、命令字典和排障 |
| 已完成第一版 | MySQL / SQL | [mysql-sql.md](./data-ai/mysql-sql.md) | MySQL 8.4 官方结构、client/server、database/table/row/column、数据类型、DDL/DML/DQL、SELECT/WHERE/GROUP BY/HAVING/JOIN/CTE、索引、EXPLAIN、事务、InnoDB、用户权限、备份、慢查询、AIOps 数据建模、命令字典和排障 |
| 已完成第一版 | Redis | [redis.md](./data-ai/redis.md) | Redis 官方结构、内存数据结构服务器、key/TTL、String/Hash/List/Set/Sorted Set/Stream、缓存模式、限流、分布式锁边界、RDB/AOF、内存淘汰、复制、Sentinel、Cluster、安全 ACL、INFO/SLOWLOG、AIOps 告警去重和事件流实验 |
| 已完成第一版 | Kafka | [kafka.md](./data-ai/kafka.md) | Apache Kafka 官方结构、event/record/message、topic、partition、offset、broker、producer、consumer、consumer group、replication、leader/replica/ISR、retention、log compaction、delivery semantics、Kafka Connect、Kafka Streams、配置、命令字典、AIOps 告警事件流实验 |
| 已完成第一版 | RabbitMQ | [rabbitmq.md](./data-ai/rabbitmq.md) | RabbitMQ 官方结构、producer、exchange、queue、binding、routing key、ack、prefetch、durable、dead letter、TTL、management UI、监控指标、AIOps 告警队列实验和排障 |
| 已完成第一版 | pandas | [pandas.md](./data-ai/pandas.md) | pandas 官方用户指南结构、Series/DataFrame/Index、dtype、IO、选择过滤、缺失值、时间处理、groupby、merge/merge_asof、pivot_table、resample、rolling、category、性能边界、API 字典、AIOps 告警日报实验 |
| 已完成第一版 | scikit-learn | [scikit-learn.md](./data-ai/scikit-learn.md) | scikit-learn 官方结构、estimator API、X/y、fit/predict/transform、监督/无监督学习、异常检测、IsolationForest、特征工程、预处理、Pipeline、ColumnTransformer、训练/测试拆分、数据泄漏、模型评估、模型持久化、API 字典、AIOps 指标异常检测实验 |
| 已完成第一版 | FastAPI | [fastapi.md](./data-ai/fastapi.md) | FastAPI 官方教程结构、ASGI、Starlette、Pydantic、Uvicorn、路径操作、参数解析、请求体、响应模型、依赖注入、异常处理、中间件、CORS、OpenAPI、APIRouter、配置、测试、部署、AIOps 告警接收和分析 API 实验 |
| 已完成第一版 | LLM / OpenAI API | [llm-openai.md](./data-ai/llm-openai.md) | OpenAI 官方 API 结构、Responses API、模型选型、instructions/input、提示词合同、结构化输出、function calling、Embeddings、RAG 关系、上下文拼装、安全边界、成本/延迟/降级、评估、AIOps 告警摘要助手实验 |
| 已完成第一版 | RAG | [rag.md](./data-ai/rag.md) | RAG 官方主线、离线入库、在线检索、chunk、metadata、embedding、向量库、关键词/向量/hybrid search、rerank、上下文拼装、prompt injection 防护、OpenAI File Search、自建 Runbook RAG 实验、检索和回答评估 |
| 已完成第一版 | 向量数据库 | [vector-database.md](./data-ai/vector-database.md) | OpenAI embeddings、Chroma、Milvus、Qdrant 官方结构、embedding、维度、距离、top-k、collection/entity/point、metadata/payload、schema、向量索引、payload index、metadata filter、hybrid search、更新删除、权限、AIOps 相似故障检索实验 |
| 已完成第一版 | SLI / SLO / SLA | [sli-slo-sla.md](./sre-aiops/sli-slo-sla.md) | Google SRE 官方结构、用户旅程、SLI/SLO/SLA 边界、good events / total events、延迟 SLI、错误预算、burn rate、多窗口告警、Prometheus recording/alerting rules、低流量服务、SLO 与 AIOps 告警治理实验 |
| 已完成第一版 | 告警治理 | [alert-governance.md](./sre-aiops/alert-governance.md) | Google SRE 监控与实用告警原则、page/ticket/info 分级、症状 vs 原因、四个黄金信号、Prometheus alerting rules、Alertmanager grouping/routing/inhibition/silence、标签规范、告警体检表、质量指标、AIOps 告警降噪输入 |
| 已完成第一版 | 事件响应 | [incident-response.md](./sre-aiops/incident-response.md) | Google SRE Emergency Response、incident 生命周期、IC/OL/CL/Scribe 角色、SEV 分级、incident 声明、时间线、缓解优先、沟通节奏、升级/交接、resolved 标准、事件数据沉淀到 AIOps |
| 已完成第一版 | Runbook | [runbook.md](./sre-aiops/runbook.md) | AWS Systems Manager Automation runbook、Google SRE 自动化原则、runbook 与 incident/postmortem 闭环、字段模板、runbook_url、检查命令和期望输出、决策树、风险/审批/验证/升级、自动化风险分级、AIOps/RAG 结合 |
| 已完成第一版 | RCA 根因分析 | [rca.md](./sre-aiops/rca.md) | Google SRE 无责复盘文化、postmortem 模板、证据输入、直接原因/促成因素/系统性缺口、5 Whys、鱼骨图文字版、行动项质量、MTTD/MTTA/MTTR、RCA 反哺告警、Runbook 和 AIOps 知识库 |
| 已完成第一版 | 变更管理 | [change-management.md](./sre-aiops/change-management.md) | Google SRE Release Engineering、可复现构建、制品追踪、策略门禁、变更分类、变更单模板、滚动/蓝绿/金丝雀/Feature Flag、错误预算门禁、验证指标、回滚计划、数据库/配置/紧急变更、AIOps 变更关联 |
| 已完成第一版 | AIOps 闭环 | [aiops-loop.md](./sre-aiops/aiops-loop.md) | Microsoft Azure Monitor AIOps / agentic operations、Google SRE 闭环、观测/检测/关联/解释/建议/行动/验证/学习分层、最小作品集架构、incident candidate 数据模型、guardrails、成熟度、效果指标 |

## 精讲批次进度

| 批次 | 范围 | 状态 | 说明 |
|---|---|---|---|
| 0 | Prometheus、Grafana、Docker Compose | 已完成 | 第一批示范级文章 |
| 1 | Linux、Git、GitHub、Markdown、VitePress、Python、Shell/PowerShell、systemd、网络基础 | 深讲第一版已完成 | 已补齐官方知识地图、核心机制、命令/配置/API 字典、实验、排障和学习证据 |
| 2 | Docker、Kubernetes、Helm、NGINX/Ingress、微服务 | 深讲第一版已完成 | 已补齐官方知识地图、核心机制、命令/配置/API 字典、实验、排障和学习证据 |
| 3 | Alertmanager、OpenTelemetry、Loki、Elasticsearch | 深讲第一版已完成 | 已补齐官方知识地图、核心机制、命令/配置/API 字典、实验、排障和学习证据 |
| 4 | Ansible、Terraform、GitHub Actions、CI/CD、Runbook Automation | 深讲第一版已完成 | 已补齐官方知识地图、核心机制、命令/配置/API 字典、实验、排障和学习证据 |
| 5 | MySQL、Redis、Kafka、RabbitMQ、pandas、scikit-learn、FastAPI、LLM、RAG、向量数据库 | 深讲第一版已完成 | 已补齐官方知识地图、核心机制、命令/配置/API 字典、实验、排障和学习证据 |
| 6 | SLI/SLO/SLA、告警治理、事件响应、Runbook、RCA、变更管理、AIOps 闭环 | 深讲第一版已完成 | 已补齐官方知识地图、机制、命令/API 字典、实验、排障和学习证据 |

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
| 云原生 | 微服务 | [microservices.md](./cloud-native/microservices.md) |
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
| 数据与 AI | RabbitMQ | [rabbitmq.md](./data-ai/rabbitmq.md) |
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
