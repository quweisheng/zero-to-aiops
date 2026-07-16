export const generatedDocs = [
  {
    "path": "../docs/index.md",
    "route": "/",
    "title": "To Be Better AIOps Engineer",
    "section": "开始",
    "excerpt": "这是一个面向转岗的 AIOps 学习知识库。它不追求一次性学完所有概念，而是用公开项目把能力做出来。 知识库精讲标准 这个仓库会按“像教程一样讲清楚”的方式持续扩展。写法参考了 二哥的 Java 进阶之路 那种通俗、对话感强、循序拆解的讲法..."
  },
  {
    "path": "../docs/interview/README.md",
    "route": "/interview",
    "title": "AIOps 面试准备",
    "section": "面试",
    "excerpt": "自我介绍结构 1. 我有多年运维经验，熟悉生产系统稳定性、监控告警、故障处理和自动化。 2. 我现在把经验升级到 AIOps：用可观测数据、规则/模型和自动化流程降低 MTTD、MTTR 和告警噪声。 3. 我做了几个公开项目：可观测性实验..."
  },
  {
    "path": "../docs/resources.md",
    "route": "/resources",
    "title": "资料清单",
    "section": "开始",
    "excerpt": "这里放高可信资料入口。学习时优先看官方文档、权威教材和成熟社区资料，不用一次看完，按项目需要查。 AIOps 与智能运维 Red Hat: The journey from observability to AIOps automation..."
  },
  {
    "path": "../docs/roadmap/README.md",
    "route": "/roadmap",
    "title": "AIOps 学习路线",
    "section": "路线",
    "excerpt": "这条路线按“转岗作品集”设计，不按教材目录设计。每一阶段都要产出可以放到 GitHub 的证据。 0. 起点盘点 先写清楚自己的已有能力： Linux：排障、性能、网络、系统服务。 脚本：Shell、Python、自动化任务。 监控：是否用..."
  },
  {
    "path": "../docs/roadmap/00-skill-map.md",
    "route": "/roadmap/00-skill-map",
    "title": "AIOps 工程师能力地图",
    "section": "路线",
    "excerpt": "基础运维 Linux：进程、文件系统、网络、systemd、性能分析。 网络：DNS、HTTP、TLS、负载均衡、常见故障定位。 数据库与中间件：MySQL、Redis、MQ 的基础监控和排障。 自动化：Shell、Python、Ansib..."
  },
  {
    "path": "../docs/tech-stack/README.md",
    "route": "/tech-stack",
    "title": "AIOps 技术栈总清单",
    "section": "技术栈",
    "excerpt": "这个目录记录我从 0 学 AIOps 过程中会接触到的技术栈。它不是一次性背诵清单，而是一个长期学习地图：每学一项，就补充理解、配置、实验和踩坑记录。 精讲写作标准 后续每个技术栈文件都会按 技术栈精讲写作标准 补齐内容：官方资料、场景开场..."
  },
  {
    "path": "../docs/tech-stack/automation/ansible.md",
    "route": "/tech-stack/automation/ansible",
    "title": "Ansible",
    "section": "自动化",
    "excerpt": "目标：能理解 Ansible 为什么适合配置管理和自动化运维，能讲清 control node、managed node、inventory、module、task、play、playbook、variables、facts、handler..."
  },
  {
    "path": "../docs/tech-stack/automation/cicd.md",
    "route": "/tech-stack/automation/cicd",
    "title": "CI/CD",
    "section": "自动化",
    "excerpt": "目标：能真正讲清持续集成、持续交付、持续部署的区别，能设计一条从提交到发布再到回滚的最小流水线，并能把发布记录、部署结果、告警、指标和事故复盘串成 AIOps 里的变更时间线。 官方资料 CI/CD 不是某一个厂商的单项产品，所以本文用 G..."
  },
  {
    "path": "../docs/tech-stack/automation/github-actions.md",
    "route": "/tech-stack/automation/github-actions",
    "title": "GitHub Actions",
    "section": "自动化",
    "excerpt": "目标：不是只会复制一段 .github/workflows/ .yml ，而是能解释 GitHub Actions 如何从事件触发 workflow，如何把 job 分配到 runner，如何执行 step/action，如何传递变量、产物..."
  },
  {
    "path": "../docs/tech-stack/automation/runbook-automation.md",
    "route": "/tech-stack/automation/runbook-automation",
    "title": "Runbook Automation",
    "section": "自动化",
    "excerpt": "目标：能把人工故障处理手册设计成可执行、可审批、可验证、可审计、可回滚的自动化流程，并知道哪些动作只能“辅助诊断”，哪些动作可以“人工确认后执行”，哪些动作才适合“自动修复”。 官方资料 Runbook Automation 没有一个唯一标..."
  },
  {
    "path": "../docs/tech-stack/automation/terraform.md",
    "route": "/tech-stack/automation/terraform",
    "title": "Terraform",
    "section": "自动化",
    "excerpt": "目标：能理解 Terraform 为什么是基础设施即代码工具，能讲清 configuration、provider、resource、data source、variables、outputs、state、backend、workspace..."
  },
  {
    "path": "../docs/tech-stack/cloud-native/docker.md",
    "route": "/tech-stack/cloud-native/docker",
    "title": "Docker",
    "section": "云原生",
    "excerpt": "目标：能把一个服务打包成镜像，用容器运行，并理解 Docker Engine、镜像、容器、Dockerfile、网络、卷、registry、日志和资源限制之间的关系。 官方资料 Docker overview Docker Engine D..."
  },
  {
    "path": "../docs/tech-stack/cloud-native/docker-compose.md",
    "route": "/tech-stack/cloud-native/docker-compose",
    "title": "Docker Compose 精讲",
    "section": "云原生",
    "excerpt": "学习目标：能用一个 compose.yaml 启动多容器实验环境，理解 project、service、container、network、volume、config、secret、profile、healthcheck、depends o..."
  },
  {
    "path": "../docs/tech-stack/cloud-native/helm.md",
    "route": "/tech-stack/cloud-native/helm",
    "title": "Helm",
    "section": "云原生",
    "excerpt": "目标：能理解 Helm 为什么被称为 Kubernetes 的包管理器，能讲清 Chart、Release、Values、Template、Repository、Revision、Upgrade、Rollback 的关系，能写一个最小 Ch..."
  },
  {
    "path": "../docs/tech-stack/cloud-native/kubernetes.md",
    "route": "/tech-stack/cloud-native/kubernetes",
    "title": "Kubernetes",
    "section": "云原生",
    "excerpt": "目标：能理解 Kubernetes 为什么是容器编排系统，能按官方概念地图理解控制面、节点、Pod、Deployment、Service、ConfigMap、Secret、Namespace、调度、资源、健康检查和排障，能写出最小可运行的 ..."
  },
  {
    "path": "../docs/tech-stack/cloud-native/microservices.md",
    "route": "/tech-stack/cloud-native/microservices",
    "title": "微服务深讲",
    "section": "云原生",
    "excerpt": "学习目标：不是只知道“把系统拆小”，而是能用 Spring Boot 和 Spring Cloud 的官方主线讲清一个 Java 微服务从创建、配置、暴露 API、服务调用、注册发现、网关路由、负载均衡、熔断限流、可观测性、容器化、发布、排..."
  },
  {
    "path": "../docs/tech-stack/cloud-native/nginx-ingress.md",
    "route": "/tech-stack/cloud-native/nginx-ingress",
    "title": "NGINX / Ingress",
    "section": "云原生",
    "excerpt": "目标：能理解 NGINX 反向代理和 Kubernetes Ingress 分别解决什么问题，能读懂 server 、 location 、 upstream 、 proxy pass 、 proxy set header 、timeout..."
  },
  {
    "path": "../docs/tech-stack/data-ai/fastapi.md",
    "route": "/tech-stack/data-ai/fastapi",
    "title": "FastAPI",
    "section": "数据与 AI",
    "excerpt": "目标：不是只会写一个 @app.get(\"/\") ，而是能理解 FastAPI 的请求链路、路径操作、参数解析、Pydantic 校验、响应模型、依赖注入、异常处理、中间件、OpenAPI 文档、测试、项目拆分、部署方式，并能把 AIOps..."
  },
  {
    "path": "../docs/tech-stack/data-ai/kafka.md",
    "route": "/tech-stack/data-ai/kafka",
    "title": "Kafka",
    "section": "数据与 AI",
    "excerpt": "目标：不是只会启动一个 producer/consumer，而是能理解 Kafka 为什么是分布式事件流平台，掌握 event、topic、partition、offset、broker、producer、consumer、consumer..."
  },
  {
    "path": "../docs/tech-stack/data-ai/langchain.md",
    "route": "/tech-stack/data-ai/langchain",
    "title": "LangChain",
    "section": "数据与 AI",
    "excerpt": "学习目标：能理解 LangChain 在 LLM 应用工程里的位置，能讲清 agent、model、message、tool、system prompt、structured output、memory、RAG、LangGraph、Lang..."
  },
  {
    "path": "../docs/tech-stack/data-ai/langgraph.md",
    "route": "/tech-stack/data-ai/langgraph",
    "title": "LangGraph",
    "section": "数据与 AI",
    "excerpt": "学习目标：能理解 LangGraph 为什么适合编排长期运行的 AI Agent 和 AIOps 排障流程，能讲清 StateGraph、state、node、edge、conditional edge、checkpoint、memory、..."
  },
  {
    "path": "../docs/tech-stack/data-ai/llm-openai.md",
    "route": "/tech-stack/data-ai/llm-openai",
    "title": "LLM / OpenAI API",
    "section": "数据与 AI",
    "excerpt": "目标：不是只会复制一次 OpenAI API 调用，而是能理解 LLM 在 AIOps 中的合理位置、Responses API 的请求/响应结构、模型选型、提示词合同、结构化输出、工具调用、Embeddings、上下文拼装、安全边界、成本..."
  },
  {
    "path": "../docs/tech-stack/data-ai/machine-learning.md",
    "route": "/tech-stack/data-ai/machine-learning",
    "title": "机器学习",
    "section": "数据与 AI",
    "excerpt": "学习目标：能从 0 理解机器学习为什么能用于 AIOps，能讲清样本、特征、标签、训练、预测、评估、过拟合、数据泄漏和异常检测，能用一个最小 Python 实验把运维指标变成可评估的模型结果。 官方资料 优先读这些官方资料： Google ..."
  },
  {
    "path": "../docs/tech-stack/data-ai/mysql-sql.md",
    "route": "/tech-stack/data-ai/mysql-sql",
    "title": "MySQL / SQL",
    "section": "数据与 AI",
    "excerpt": "目标：不是只会写几条 SELECT ，而是能理解 MySQL Server、数据库、表、行、列、索引、事务、锁、InnoDB、执行计划、权限、备份、慢查询和 AIOps 数据建模之间的关系，并能用 SQL 回答真实运维问题。 官方资料 优先..."
  },
  {
    "path": "../docs/tech-stack/data-ai/oracle.md",
    "route": "/tech-stack/data-ai/oracle",
    "title": "Oracle Database 深讲",
    "section": "数据与 AI",
    "excerpt": "学习目标：理解 Oracle Database 在企业核心系统中的位置，能讲清 instance、database、CDB/PDB、schema、tablespace、datafile、redo、undo、archivelog、optimi..."
  },
  {
    "path": "../docs/tech-stack/data-ai/pandas.md",
    "route": "/tech-stack/data-ai/pandas",
    "title": "pandas",
    "section": "数据与 AI",
    "excerpt": "目标：不是只会 read csv 和 groupby ，而是能理解 pandas 的 Series、DataFrame、Index、dtype、选择、过滤、缺失值、合并、分组聚合、时间序列、窗口计算、IO、性能边界，并能用它分析 AIOps..."
  },
  {
    "path": "../docs/tech-stack/data-ai/postgresql.md",
    "route": "/tech-stack/data-ai/postgresql",
    "title": "PostgreSQL 深讲",
    "section": "数据与 AI",
    "excerpt": "学习目标：理解 PostgreSQL 为什么适合做 AIOps 后端数据底座，能讲清 database、schema、table、index、MVCC、WAL、vacuum、autovacuum、EXPLAIN、extension、repl..."
  },
  {
    "path": "../docs/tech-stack/data-ai/rabbitmq.md",
    "route": "/tech-stack/data-ai/rabbitmq",
    "title": "RabbitMQ 深讲",
    "section": "数据与 AI",
    "excerpt": "学习目标：理解 RabbitMQ 为什么适合做消息队列，能讲清 producer、exchange、queue、binding、routing key、consumer、ack、prefetch、durable、dead letter、re..."
  },
  {
    "path": "../docs/tech-stack/data-ai/rag.md",
    "route": "/tech-stack/data-ai/rag",
    "title": "RAG",
    "section": "数据与 AI",
    "excerpt": "目标：不是只会用 LangChain 跑一个问答 demo，而是能理解 RAG 的离线入库、在线检索、chunk、embedding、向量库、metadata、混合检索、rerank、上下文拼装、引用、幻觉控制、prompt injecti..."
  },
  {
    "path": "../docs/tech-stack/data-ai/redis.md",
    "route": "/tech-stack/data-ai/redis",
    "title": "Redis",
    "section": "数据与 AI",
    "excerpt": "目标：不是只会 SET / GET ，而是能理解 Redis 为什么是“内存数据结构服务器”，掌握 key、TTL、String、Hash、List、Set、Sorted Set、Stream、持久化、内存淘汰、复制、Sentinel、Cl..."
  },
  {
    "path": "../docs/tech-stack/data-ai/scikit-learn.md",
    "route": "/tech-stack/data-ai/scikit-learn",
    "title": "scikit-learn",
    "section": "数据与 AI",
    "excerpt": "scikit learn 目标：不是只会复制 IsolationForest 示例，而是能理解 scikit learn 的 estimator API、 fit / predict / transform 、训练/测试拆分、预处理、Pip..."
  },
  {
    "path": "../docs/tech-stack/data-ai/vector-database.md",
    "route": "/tech-stack/data-ai/vector-database",
    "title": "向量数据库",
    "section": "数据与 AI",
    "excerpt": "目标：不是只会调用一次 similarity search ，而是能理解向量、embedding、维度、距离、collection、record、metadata/payload、schema、向量索引、标量索引、top k、过滤、hybr..."
  },
  {
    "path": "../docs/tech-stack/foundation/git.md",
    "route": "/tech-stack/foundation/git",
    "title": "Git 深讲",
    "section": "基础工具",
    "excerpt": "学习目标：理解 Git 的核心数据模型、工作区、暂存区、本地仓库、远程仓库、提交、分支、合并、冲突、回退和常用命令；能用 Git 管理 AIOps 知识库、配置文件、实验代码和学习证据。 官方资料 Git Book: What is Git..."
  },
  {
    "path": "../docs/tech-stack/foundation/github.md",
    "route": "/tech-stack/foundation/github",
    "title": "GitHub",
    "section": "基础工具",
    "excerpt": "目标：能把学习记录、项目代码、配置、实验截图和文档站托管到 GitHub，理解 repository、README、branch、Issue、Pull Request、Actions、Pages、Release、Token、SSH key、..."
  },
  {
    "path": "../docs/tech-stack/foundation/linux.md",
    "route": "/tech-stack/foundation/linux",
    "title": "Linux 深讲",
    "section": "基础工具",
    "excerpt": "学习目标：理解 Linux 操作系统如何工作，能看懂内核、用户态、进程、内存、文件系统、网络、权限和日志这些基础概念；能掌握 AIOps / SRE 入门必会命令，并能用它们定位 CPU、内存、磁盘、网络和服务问题。 官方资料 Linux ..."
  },
  {
    "path": "../docs/tech-stack/foundation/markdown.md",
    "route": "/tech-stack/foundation/markdown",
    "title": "Markdown",
    "section": "基础工具",
    "excerpt": "目标：能用 Markdown 写清楚学习笔记、README、runbook、事故复盘、配置说明、面试故事和 VitePress 文档，理解 CommonMark、GitHub Flavored Markdown、块级语法、行内语法、链接、图..."
  },
  {
    "path": "../docs/tech-stack/foundation/networking.md",
    "route": "/tech-stack/foundation/networking",
    "title": "网络基础",
    "section": "基础工具",
    "excerpt": "目标：能从零理解一次请求从域名到应用返回的完整路径，能解释 DNS、IP、端口、路由、TCP、TLS、HTTP、负载均衡分别负责什么，能使用 curl 、 dig 、 ip 、 ss 、 ping 、 traceroute 、 openss..."
  },
  {
    "path": "../docs/tech-stack/foundation/python.md",
    "route": "/tech-stack/foundation/python",
    "title": "Python",
    "section": "基础工具",
    "excerpt": "目标：能用 Python 处理运维数据、写自动化脚本、做异常检测原型、提供简单 API。 官方资料 Python Tutorial Python Language Reference Python Standard Library venv..."
  },
  {
    "path": "../docs/tech-stack/foundation/shell-powershell.md",
    "route": "/tech-stack/foundation/shell-powershell",
    "title": "Shell / PowerShell",
    "section": "基础工具",
    "excerpt": "目标：能把常用排障命令串成脚本，形成可重复、可审计、可自动化的检查流程。Linux/macOS 重点学 Bash 和常见 GNU/Linux 工具，Windows 重点学 PowerShell 和对象管道。 官方资料 GNU Bash Re..."
  },
  {
    "path": "../docs/tech-stack/foundation/systemd.md",
    "route": "/tech-stack/foundation/systemd",
    "title": "systemd",
    "section": "基础工具",
    "excerpt": "目标：能理解 systemd 为什么是 Linux 服务管理入口，能读懂 unit、service、target、timer、journal，能写一个最小服务，能用 systemctl 和 journalctl 排查服务启动失败、反复重启、..."
  },
  {
    "path": "../docs/tech-stack/foundation/vitepress.md",
    "route": "/tech-stack/foundation/vitepress",
    "title": "VitePress",
    "section": "基础工具",
    "excerpt": "目标：能把 Markdown 学习笔记构建成可访问的文档站，理解 source directory、file based routing、config、themeConfig、nav、sidebar、frontmatter、Markdown..."
  },
  {
    "path": "../docs/tech-stack/observability/alertmanager.md",
    "route": "/tech-stack/observability/alertmanager",
    "title": "Alertmanager",
    "section": "可观测性",
    "excerpt": "目标：能理解 Prometheus 告警从规则触发到通知送达的完整链路，能读懂 Alertmanager 的 route、receiver、grouping、deduplication、inhibition、silence、notifica..."
  },
  {
    "path": "../docs/tech-stack/observability/elasticsearch.md",
    "route": "/tech-stack/observability/elasticsearch",
    "title": "Elasticsearch",
    "section": "可观测性",
    "excerpt": "目标：能理解 Elasticsearch 为什么适合搜索和日志分析，能讲清 cluster、node、index、document、field、mapping、analyzer、inverted index、shard、replica、da..."
  },
  {
    "path": "../docs/tech-stack/observability/grafana.md",
    "route": "/tech-stack/observability/grafana",
    "title": "Grafana 精讲",
    "section": "可观测性",
    "excerpt": "学习目标：能启动 Grafana，连接 Prometheus 数据源，创建 dashboard，理解 data source、query、panel、visualization、field、transformation、variable、d..."
  },
  {
    "path": "../docs/tech-stack/observability/loki.md",
    "route": "/tech-stack/observability/loki",
    "title": "Grafana Loki",
    "section": "可观测性",
    "excerpt": "目标：能理解 Loki 为什么是“像 Prometheus 一样的日志系统”，能讲清 log stream、labels、chunks、index、object storage、LogQL、distributor、ingester、quer..."
  },
  {
    "path": "../docs/tech-stack/observability/opentelemetry.md",
    "route": "/tech-stack/observability/opentelemetry",
    "title": "OpenTelemetry",
    "section": "可观测性",
    "excerpt": "目标：能理解 OpenTelemetry 为什么是云原生可观测性的标准工具箱，能讲清 traces、metrics、logs、context propagation、resource、semantic conventions、instrum..."
  },
  {
    "path": "../docs/tech-stack/observability/prometheus.md",
    "route": "/tech-stack/observability/prometheus",
    "title": "Prometheus 精讲",
    "section": "可观测性",
    "excerpt": "学习目标：能启动 Prometheus，读懂 prometheus.yml ，理解数据模型、指标类型、抓取、TSDB、PromQL、recording rules、alerting rules、HTTP API 和 promtool ，并知..."
  },
  {
    "path": "../docs/tech-stack/observability/victoriametrics.md",
    "route": "/tech-stack/observability/victoriametrics",
    "title": "VictoriaMetrics",
    "section": "可观测性",
    "excerpt": "学习目标：能理解 VictoriaMetrics 为什么适合作为 Prometheus 兼容的时序数据存储，能讲清单机版、集群版、vmagent、vmalert、MetricsQL、remote write、retention、cardin..."
  },
  {
    "path": "../docs/tech-stack/progress.md",
    "route": "/tech-stack/progress",
    "title": "技术栈拆分进度",
    "section": "技术栈",
    "excerpt": "目标：每个技术栈一个 Markdown 文件，并且每个文件都按“官方资料、是什么、原理、架构、配置、入门实验、排障、学习证据”的结构写成原创中文教程。 精讲示范 当前已经按 技术栈精讲写作标准 完成第一批示范文章： 技术栈 文件 示范重点 ..."
  },
  {
    "path": "../docs/tech-stack/security-compliance/mlps.md",
    "route": "/tech-stack/security-compliance/mlps",
    "title": "网络安全等级保护（等保 2.0）深讲",
    "section": "安全与合规",
    "excerpt": "学习目标：从零理解网络安全等级保护的法律依据、五个安全保护等级、定级与备案、建设整改、等级测评和持续运营；能读懂等保三级常见技术与管理要求，建立资产、控制、证据和整改台账，并用 AIOps 方法持续发现配置漂移、日志缺口、漏洞超期和恢复能力..."
  },
  {
    "path": "../docs/tech-stack/sre-aiops/aiops-loop.md",
    "route": "/tech-stack/sre-aiops/aiops-loop",
    "title": "AIOps 闭环",
    "section": "SRE/AIOps 实践",
    "excerpt": "目标：不是把 AIOps 理解成“接一个聊天机器人”，而是能设计一条从观测、检测、关联、解释、推荐、执行、验证到学习的工程闭环；每一层都有输入、输出、工具、护栏、验证方式和反馈机制。 官方资料 优先读这些官方资料和高可信资料： Micros..."
  },
  {
    "path": "../docs/tech-stack/sre-aiops/alert-governance.md",
    "route": "/tech-stack/sre-aiops/alert-governance",
    "title": "告警治理",
    "section": "SRE/AIOps 实践",
    "excerpt": "目标：不是把 Prometheus 规则写得越多越好，而是能判断哪些告警值得叫醒人，哪些应该降级、合并、抑制、删除或自动化；能设计告警分级、标签、路由、分组、抑制、静默、runbook、质量指标和持续治理流程。 官方资料 优先读这些官方资料..."
  },
  {
    "path": "../docs/tech-stack/sre-aiops/change-management.md",
    "route": "/tech-stack/sre-aiops/change-management",
    "title": "变更管理",
    "section": "SRE/AIOps 实践",
    "excerpt": "目标：不是填一张审批表，而是能让代码、配置、基础设施、数据库、证书、告警规则等生产变更可评审、可追踪、可验证、可回滚，并能把变更事件自动纳入告警、事件响应、RCA 和 AIOps 根因候选。 官方资料 优先读这些官方资料： Google S..."
  },
  {
    "path": "../docs/tech-stack/sre-aiops/incident-response.md",
    "route": "/tech-stack/sre-aiops/incident-response",
    "title": "事件响应",
    "section": "SRE/AIOps 实践",
    "excerpt": "目标：不是知道“故障要处理”，而是能在告警响起后快速声明事件、分级、分配角色、建立时间线、控制沟通节奏、优先缓解用户影响、升级和交接，并把现场记录沉淀成复盘、runbook 和 AIOps 数据。 官方资料 优先读这些官方资料： Googl..."
  },
  {
    "path": "../docs/tech-stack/sre-aiops/rca.md",
    "route": "/tech-stack/sre-aiops/rca",
    "title": "RCA 根因分析",
    "section": "SRE/AIOps 实践",
    "excerpt": "目标：不是写一句“根因是人为失误”，而是能基于时间线、指标、日志、变更、决策和用户影响做无责复盘，区分触发因素、直接原因、促成因素和系统性缺口，产出有 owner、截止时间和验证方式的行动项，并把 RCA 反哺告警、Runbook、变更流程..."
  },
  {
    "path": "../docs/tech-stack/sre-aiops/runbook.md",
    "route": "/tech-stack/sre-aiops/runbook",
    "title": "Runbook",
    "section": "SRE/AIOps 实践",
    "excerpt": "目标：不是写一篇“故障处理说明”，而是能把告警、检查、判断、动作、风险、审批、验证、升级、记录和自动化边界写成故障现场可执行的流程，并能逐步把低风险步骤变成脚本或自动化 runbook。 官方资料 优先读这些官方资料： AWS System..."
  },
  {
    "path": "../docs/tech-stack/sre-aiops/sli-slo-sla.md",
    "route": "/tech-stack/sre-aiops/sli-slo-sla",
    "title": "SLI / SLO / SLA",
    "section": "SRE/AIOps 实践",
    "excerpt": "目标：不是背会三个缩写，而是能从用户体验出发定义 SLI，把 SLI 写成可测量的 SLO，用错误预算指导发布和稳定性工作，并用 burn rate 告警把“服务是否伤害用户”接入 Prometheus、Alertmanager 和 AIO..."
  },
  {
    "path": "../docs/tech-stack/storage-data-protection/aishu-anystorage.md",
    "route": "/tech-stack/storage-data-protection/aishu-anystorage",
    "title": "爱数 AnyStorage 深讲",
    "section": "存储与数据保护",
    "excerpt": "学习目标：从零理解 AnyStorage 7 统一存储与 AnyStorage GX 存储虚拟化网关的区别，掌握 SAN/NAS 数据路径、控制器、缓存、RAID 2.0、卷、主机映射、多路径、快照、复制、双活和 CDP；能完成一次脱敏健康..."
  },
  {
    "path": "../docs/tech-stack/storage-data-protection/ceph.md",
    "route": "/tech-stack/storage-data-protection/ceph",
    "title": "Ceph 深讲",
    "section": "存储与数据保护",
    "excerpt": "学习目标：从零理解 Ceph 分布式存储的 RADOS、MON、MGR、OSD、MDS、RGW、pool、PG、CRUSH 和 BlueStore；能区分 RBD 块存储、CephFS 文件存储和 RGW 对象存储，使用 cephadm 搭..."
  },
  {
    "path": "../docs/tech-stack/storage-data-protection/huawei-oceanstor.md",
    "route": "/tech-stack/storage-data-protection/huawei-oceanstor",
    "title": "华为 OceanStor 深讲",
    "section": "存储与数据保护",
    "excerpt": "学习目标：从零分清 OceanStor Dorado、OceanStor 混合闪存和 OceanStor Pacific，理解控制器、存储池、LUN、文件系统、主机映射、多路径、快照、远程复制和 HyperMetro；能完成一次不接触生产数..."
  },
  {
    "path": "../docs/tech-stack/storage-data-protection/ibm-storage.md",
    "route": "/tech-stack/storage-data-protection/ibm-storage",
    "title": "IBM Storage 深讲",
    "section": "存储与数据保护",
    "excerpt": "学习目标：从零理解块、文件、对象和磁带存储，能说清 IBM FlashSystem、Storage Virtualize、Storage Scale、Storage Ceph、DS8000、Cloud Object Storage、Stor..."
  },
  {
    "path": "../docs/tech-stack/writing-standard.md",
    "route": "/tech-stack/writing-standard",
    "title": "技术栈精讲写作标准",
    "section": "技术栈",
    "excerpt": "这个标准用来约束本仓库后续所有“一技术一文件”的文章。目标是写成小白能照着学、面试能拿来复盘、项目能直接引用的 AIOps 学习笔记。 参考站扫描结论 参考：二哥的 Java 进阶之路：一文让你彻底了解 Java。 这个站点值得借鉴的不是具..."
  },
  {
    "path": "../docs/templates/project-note.md",
    "route": "/templates/project-note",
    "title": "项目记录模板",
    "section": "文档",
    "excerpt": "项目名称 解决的问题 输入数据 处理流程 输出结果 运行方式 效果评估 局限性 简历表达"
  },
  {
    "path": "../docs/templates/tech-stack-deep-dive.md",
    "route": "/templates/tech-stack-deep-dive",
    "title": "技术名",
    "section": "文档",
    "excerpt": "学习目标：用一句话说明学完以后能做什么。比如：能启动服务、读懂配置、完成第一个实验、定位常见问题。 官方资料 官方入门文档 官方配置参考 说明：本文基于官方资料和个人实操整理，保留官方链接，不复制官方全文。 官方知识地图 先按官方资料拆出这..."
  },
  {
    "path": "../docs/templates/weekly-review.md",
    "route": "/templates/weekly-review",
    "title": "每周学习复盘模板",
    "section": "文档",
    "excerpt": "本周目标 本周完成 学到的关键概念 动手成果 遇到的问题 和求职的关系 这周的内容能写进简历或面试吗？如果能，写成一句话： 下周计划"
  }
] as const
