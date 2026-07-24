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
| 已升级开头和面试表达 | Prometheus、VictoriaMetrics、Grafana、Alertmanager、OpenTelemetry、Loki、Elasticsearch | 可观测性组已补通俗开场、人话版、小白追问和面试表达 |
| 已达到大厂面试级第一版 | Go（Golang） | 已补语言基础、并发、G-M-P、内存模型、GC、HTTP、测试诊断、AIOps 项目、故障实验、连续追问和系统设计 |
| 已升级开头和面试表达 | Linux、Git、GitHub、Markdown、VitePress、Python、Shell/PowerShell、systemd、网络基础 | 基础工具组已补通俗开场、人话版、小白追问和面试表达 |
| 已达到大厂面试级第一版 | Kubernetes、etcd、Calico、Cilium | 已补控制面一致性、API/Informer/调度、CNI 数据路径、生产设计、故障实验、连续追问和系统设计 |
| 已升级开头和面试表达 | Docker、Docker Compose、Helm、NGINX/Ingress、微服务 | 云原生组已补通俗开场、人话版、小白追问和面试表达，后续继续按大厂面试级标准升级 |
| 已达到大厂面试级第一版 | KVM 虚拟化 | 已补 KVM/QEMU/libvirt 边界、CPU/内存/网络/存储路径、迁移、HA、安全、双层实验、事故题和系统设计 |
| 已完成深讲第一版 | VMware vSphere | 虚拟化与私有云组已补 ESXi/ESX、vCenter、集群、HA、DRS、vMotion、网络、存储、生命周期、实验和排障 |
| 已完成深讲第一版 | IBM Storage | 存储与数据保护组已补产品地图、块/文件/对象/磁带基础、FlashSystem 数据路径、容量性能、多路径、复制备份、实验、排障和面试表达 |
| 已达到大厂面试级第一版 | Dell EMC VPLEX、Dell EMC VMAX、Brocade 6510 | 已补存储虚拟化与 Metro 仲裁、高端阵列 SRP/Masking/SnapVX/SRDF、FC Fabric/zoning/慢排水/EOS 迁移、双层实验、事故题和系统设计 |
| 已达到大厂面试级第一版 | IBM WebSphere | 已补 traditional ND 与 Liberty 边界、请求与配置同步路径、集群、会话、JDBC/JMS/JTA、容量、高可用、安全、升级回滚、双层实验、事故题和系统设计 |
| 已完成深讲第一版 | Ceph | 存储与数据保护组已补 RADOS、RBD/CephFS/RGW、MON/MGR/OSD、pool/PG/CRUSH、cephadm 实验、Prometheus、排障和面试表达 |
| 已完成深讲第一版 | 华为 OceanStor | 存储与数据保护组已补产品族、控制器/缓存、存储池/LUN、SAN/NAS、多路径、HyperSnap/HyperReplication/HyperMetro、实验和排障 |
| 已完成深讲第一版 | 爱数 AnyStorage | 存储与数据保护组已补 AnyStorage 7/GX/AnyBackup 边界、SAN/NAS、RAID 2.0、多路径、复制、双活、实验和排障 |
| 已升级开头和面试表达 | Ansible、Terraform、GitHub Actions、CI/CD、Runbook Automation | 自动化组已补通俗开场、人话版、小白追问和面试表达 |
| 已达到大厂面试级第一版 | IT 项目管理 / PMP | 已补 PMBOK 第八版与 2026 PMP 边界、预测/敏捷/混合交付、WBS、关键路径、EVM、RAID、变更、DevOps/SRE 治理、双层实验、事故题和系统设计 |
| 已完成深讲第一版 | 网络安全等级保护（等保 2.0） | 安全与合规组已补法律与标准地图、五级保护、五阶段实施、控制与证据闭环、入门实验、排障和面试表达 |
| 已达到大厂面试级第一版 | Apache Hadoop | 已补 Hadoop 3.5.0、HDFS/YARN/MapReduce 数据路径、QJM/RM HA、容量、安全、升级回滚、双层实验、事故题和系统设计 |
| 已达到大厂面试级第一版 | Apache Hive、Apache HBase、Apache Spark、Apache Flink | 已补 SQL/元数据、随机读写、批处理 DAG、状态流处理的内部路径、一致性、双层实验、容量、安全、事故题和系统设计 |
| 已完成存量迁移专项第一版 | Apache HAWQ | 已明确 2024 年进入 Apache Attic，补 MPP 架构、离线倾斜实验、只读排障、遗留风险和迁移切换回滚 |
| 已升级开头和面试表达 | MySQL、Oracle、PostgreSQL、Redis、Kafka、RabbitMQ、ZooKeeper、pandas、机器学习、scikit-learn、FastAPI、LLM、LangChain、LangGraph、RAG、向量数据库 | 数据与 AI 组已补通俗开场、人话版、小白追问和面试表达 |
| 已升级开头和面试表达 | SLI/SLO/SLA、告警治理、事件响应、Runbook、RCA、变更管理、AIOps 闭环 | SRE/AIOps 实践组已补通俗开场、人话版、小白追问和面试表达 |

## 深讲样板进度

这里跟踪的是更高一级的“真能从 0 学会”的深讲改造。深讲不只是通俗开头，还必须有官方知识地图、核心机制、命令/配置/API 字典、字段解释、输出解释、实验、排障和学习证据。

| 状态 | 技术栈 | 文件 | 深讲重点 |
|---|---|---|---|
| 已完成第一版 | Linux | [linux.md](./foundation/linux.md) | 内核、用户态/内核态、系统调用、启动过程、目录结构、权限、进程、CPU、内存、磁盘、网络、日志、AIOps 必会命令字典 |
| 已完成第一版 | Git | [git.md](./foundation/git.md) | 官方 Git Book 结构、三棵树、文件状态、对象模型、HEAD、分支、合并、远程、撤销、冲突、AIOps 必会 Git 命令字典 |
| 已完成第一版 | Python | [python.md](./foundation/python.md) | 官方 Python 文档结构、解释器、虚拟环境、pip、基础类型、控制流、函数、模块、标准库、AIOps 告警日报实验、命令/API 字典 |
| 已达到大厂面试级第一版 | Go（Golang） | [golang.md](./foundation/golang.md) | Go 1.26、module/package、slice/map/interface/error、goroutine/channel/context、G-M-P、内存模型、GC、HTTP、race/pprof/trace、告警 API 和生产设计 |
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
| 已达到大厂面试级第一版 | Kubernetes | [kubernetes.md](./cloud-native/kubernetes.md) | API 请求与 SSA、List-Watch/Informer/Reconcile、调度框架、弹性、优雅终止、CNI/CSI、etcd 高可用、安全、升级、容量、故障推演和连续追问 |
| 已达到大厂面试级第一版 | etcd | [etcd.md](./cloud-native/etcd.md) | Raft、多数派、MVCC、revision、Watch、Lease、Txn、WAL/snapshot/backend、备份恢复、容量性能、Kubernetes 故障和系统设计 |
| 已达到大厂面试级第一版 | Calico | [calico.md](./cloud-native/calico.md) | CNI、Felix、IPAM/IPPool、BGP、IPIP/VXLAN、策略层级、MTU、生产拓扑、故障实验和网络排障 |
| 已达到大厂面试级第一版 | Cilium | [cilium.md](./cloud-native/cilium.md) | eBPF 程序/map、身份策略、Service 负载均衡、kube-proxy replacement、Hubble、map pressure、故障实验和网络排障 |
| 已达到大厂面试级第一版 | KVM 虚拟化 | [kvm.md](./virtualization-private-cloud/kvm.md) | KVM/QEMU/libvirt、vCPU/内存、Virtio、虚拟网络与存储、迁移、HA、容量、安全、故障实验、事故复盘和系统设计 |
| 已完成第一版 | Helm | [helm.md](./cloud-native/helm.md) | Helm 官方结构、Chart、Release、Revision、values、templates、内置对象、常用模板函数、install/upgrade/rollback、dependency、hooks、helm 命令字典、AIOps 发布诊断实验 |
| 已完成第一版 | NGINX/Ingress | [nginx-ingress.md](./cloud-native/nginx-ingress.md) | NGINX 官方结构、反向代理、server/location/upstream/proxy_pass/proxy_set_header、日志字段、timeout、Kubernetes Ingress、IngressClass、Controller、TLS、annotations、404/502/503/504 排障 |
| 已完成第一版 | 微服务 | [microservices.md](./cloud-native/microservices.md) | Spring Boot / Spring Cloud 官方知识地图、Boot 应用模型、starter/自动配置、外部化配置、Actuator、Micrometer、tracing、服务发现、OpenFeign、LoadBalancer、Gateway、Circuit Breaker、数据一致性、AIOps 观测和排障 |
| 已完成第一版 | Alertmanager | [alertmanager.md](./observability/alertmanager.md) | Prometheus Alertmanager 官方结构、alert labels/annotations、route tree、receiver、grouping、deduplication、silence、inhibition、notification template、webhook、API、amtool、AIOps 告警诊断实验 |
| 已完成第一版 | OpenTelemetry | [opentelemetry.md](./observability/opentelemetry.md) | OpenTelemetry 官方结构、traces/metrics/logs、Trace/Span/Context、resource、semantic conventions、instrumentation、API/SDK、OTLP、Collector receiver/processor/exporter/pipeline、AIOps 遥测诊断实验 |
| 已完成第一版 | Loki | [loki.md](./observability/loki.md) | Grafana Loki 官方结构、log stream、labels、cardinality、chunks、index、写入/查询路径、组件、storage schema、Alloy/Promtail EOL、LogQL、日志告警、AIOps 日志诊断实验 |
| 已完成第一版 | Elasticsearch | [elasticsearch.md](./observability/elasticsearch.md) | Elastic 官方结构、cluster/node/index/document、shards/replicas、cluster health、mapping、text vs keyword、analyzer、倒排索引、Query DSL、aggregations、data streams、templates、ingest pipeline、ILM、AIOps 搜索诊断实验 |
| 已完成第一版 | VictoriaMetrics | [victoriametrics.md](./observability/victoriametrics.md) | VictoriaMetrics 官方结构、单机版/集群版、vmagent、vmalert、MetricsQL、remote write、retention、cardinality、Grafana 查询、AIOps 长期指标实验 |
| 已完成第一版 | Ansible | [ansible.md](./automation/ansible.md) | Ansible 官方结构、control/managed node、inventory、patterns、ad hoc、modules、playbook/play/task、幂等性、variables、facts、handlers、templates、roles、collections、Vault、ansible.cfg、命令字典、AIOps 自动化实验 |
| 已完成第一版 | Terraform | [terraform.md](./automation/terraform.md) | Terraform 官方结构、HCL、terraform block、providers、resources、data sources、variables、locals、outputs、state、backend、plan/apply、dependency graph、meta-arguments、lifecycle、modules、workspaces、drift、import、命令字典、AIOps IaC 诊断实验 |
| 已完成第一版 | GitHub Actions | [github-actions.md](./automation/github-actions.md) | GitHub Actions 官方结构、event/workflow/job/runner/step/action、workflow syntax、triggers、contexts、expressions、env/vars/secrets、GITHUB_TOKEN/permissions、artifacts/cache、workflow commands、concurrency、environments、Pages 发布、AIOps runbook、命令字典、排障、安全边界 |
| 已完成第一版 | CI/CD | [cicd.md](./automation/cicd.md) | GitHub Actions 官方 CI/CD 结构、持续集成/持续交付/持续部署边界、pipeline/stage/job/step/runner/artifact/environment、CI 阶段、CD 阶段、发布策略、回滚策略、质量门禁、DORA 指标、AIOps 变更关联、命令字典和排障 |
| 已完成第一版 | Runbook Automation | [runbook-automation.md](./automation/runbook-automation.md) | AWS/Azure/Google SRE 官方结构、runbook/playbook/automation workflow 边界、触发器、输入参数、上下文补全、runbook 选择、风险分级、L0-L4 自动化、幂等和可重启、权限/审批/审计、安全护栏、LLM 边界、AIOps selector 实验、命令字典和排障 |
| 已完成第一版 | MySQL / SQL | [mysql-sql.md](./data-ai/mysql-sql.md) | MySQL 8.4 官方结构、client/server、database/table/row/column、数据类型、DDL/DML/DQL、SELECT/WHERE/GROUP BY/HAVING/JOIN/CTE、索引、EXPLAIN、事务、InnoDB、用户权限、备份、慢查询、AIOps 数据建模、命令字典和排障 |
| 已完成第一版 | Oracle Database | [oracle.md](./data-ai/oracle.md) | Oracle 官方结构、instance/database、CDB/PDB、schema、tablespace、datafile、redo、undo、archive log、optimizer、AWR、RAC、Data Guard、RMAN、慢 SQL 和表空间排障 |
| 已完成第一版 | PostgreSQL | [postgresql.md](./data-ai/postgresql.md) | PostgreSQL 官方结构、database/schema/table、MVCC、WAL、vacuum、autovacuum、EXPLAIN、B-tree/GIN 索引、JSONB、复制、备份、AIOps 事件数据建模和排障 |
| 已完成第一版 | Redis | [redis.md](./data-ai/redis.md) | Redis 官方结构、内存数据结构服务器、key/TTL、String/Hash/List/Set/Sorted Set/Stream、缓存模式、限流、分布式锁边界、RDB/AOF、内存淘汰、复制、Sentinel、Cluster、安全 ACL、INFO/SLOWLOG、AIOps 告警去重和事件流实验 |
| 已完成第一版 | Kafka | [kafka.md](./data-ai/kafka.md) | Apache Kafka 官方结构、event/record/message、topic、partition、offset、broker、producer、consumer、consumer group、replication、leader/replica/ISR、retention、log compaction、delivery semantics、Kafka Connect、Kafka Streams、配置、命令字典、AIOps 告警事件流实验 |
| 已完成第一版 | RabbitMQ | [rabbitmq.md](./data-ai/rabbitmq.md) | RabbitMQ 官方结构、producer、exchange、queue、binding、routing key、ack、prefetch、durable、dead letter、TTL、management UI、监控指标、AIOps 告警队列实验和排障 |
| 已完成第一版 | Apache ZooKeeper | [zookeeper.md](./data-ai/zookeeper.md) | ZooKeeper 3.9 官方地图、znode、Session、Watch、临时/顺序节点、Leader/Follower/Observer、Quorum、事务日志/快照、ACL、Prometheus、节点与会话实验和端到端排障 |
| 已达到大厂面试级第一版 | Apache Hadoop | [hadoop.md](./data-ai/hadoop.md) | Hadoop 3.5.0、HDFS read/write、YARN application、MapReduce shuffle、QJM/RM HA、Federation、EC、容量、安全、升级、故障实验、事故复盘和系统设计 |
| 已达到大厂面试级第一版 | Apache Hive | [hive.md](./data-ai/hive.md) | Hive 4.2.0、HiveServer2/Metastore、SQL 编译优化、Tez/YARN、分区/分桶、ORC/Parquet、ACID、双层实验、事故题和系统设计 |
| 已达到大厂面试级第一版 | Apache HBase | [hbase.md](./data-ai/hbase.md) | HBase 2.6.6、RowKey/Region、WAL/MemStore/HFile、读写路径、Compaction、热点、复制、双层实验、事故题和系统设计 |
| 已达到大厂面试级第一版 | Apache Spark | [spark.md](./data-ai/spark.md) | Spark 4.2.0、Driver/Executor、Catalyst/AQE、DAG/Stage/Task、Shuffle、Structured Streaming、双层实验、事故题和系统设计 |
| 已达到大厂面试级第一版 | Apache Flink | [flink.md](./data-ai/flink.md) | Flink 2.3.0、Event Time/Watermark、State、Checkpoint/Savepoint、反压、Exactly-once 边界、双层实验、事故题和系统设计 |
| 已完成存量迁移专项第一版 | Apache HAWQ | [hawq.md](./data-ai/hawq.md) | Apache Attic 退休边界、Master/Segment/HDFS/YARN/Interconnect、分布倾斜离线实验、只读诊断、风险隔离和迁移设计 |
| 已完成第一版 | pandas | [pandas.md](./data-ai/pandas.md) | pandas 官方用户指南结构、Series/DataFrame/Index、dtype、IO、选择过滤、缺失值、时间处理、groupby、merge/merge_asof、pivot_table、resample、rolling、category、性能边界、API 字典、AIOps 告警日报实验 |
| 已完成第一版 | 机器学习 | [machine-learning.md](./data-ai/machine-learning.md) | Google ML Crash Course 与 scikit-learn 官方主线、样本/特征/标签、监督/无监督学习、异常检测、训练/测试拆分、precision/recall、数据泄漏、AIOps 告警分类实验 |
| 已完成第一版 | scikit-learn | [scikit-learn.md](./data-ai/scikit-learn.md) | scikit-learn 官方结构、estimator API、X/y、fit/predict/transform、监督/无监督学习、异常检测、IsolationForest、特征工程、预处理、Pipeline、ColumnTransformer、训练/测试拆分、数据泄漏、模型评估、模型持久化、API 字典、AIOps 指标异常检测实验 |
| 已完成第一版 | FastAPI | [fastapi.md](./data-ai/fastapi.md) | FastAPI 官方教程结构、ASGI、Starlette、Pydantic、Uvicorn、路径操作、参数解析、请求体、响应模型、依赖注入、异常处理、中间件、CORS、OpenAPI、APIRouter、配置、测试、部署、AIOps 告警接收和分析 API 实验 |
| 已完成第一版 | LLM / OpenAI API | [llm-openai.md](./data-ai/llm-openai.md) | OpenAI 官方 API 结构、Responses API、模型选型、instructions/input、提示词合同、结构化输出、function calling、Embeddings、RAG 关系、上下文拼装、安全边界、成本/延迟/降级、评估、AIOps 告警摘要助手实验 |
| 已完成第一版 | LangChain | [langchain.md](./data-ai/langchain.md) | LangChain 官方结构、agent/model/tool/message/system prompt、structured output、memory、context engineering、RAG、LangGraph/LangSmith 边界、AIOps runbook 查询助手实验 |
| 已完成第一版 | LangGraph | [langgraph.md](./data-ai/langgraph.md) | LangGraph 官方结构、StateGraph、state、node、edge、checkpoint、memory、interrupt、human-in-the-loop、streaming、AIOps 排障流程编排实验 |
| 已完成第一版 | RAG | [rag.md](./data-ai/rag.md) | RAG 官方主线、离线入库、在线检索、chunk、metadata、embedding、向量库、关键词/向量/hybrid search、rerank、上下文拼装、prompt injection 防护、OpenAI File Search、自建 Runbook RAG 实验、检索和回答评估 |
| 已完成第一版 | 向量数据库 | [vector-database.md](./data-ai/vector-database.md) | OpenAI embeddings、Chroma、Milvus、Qdrant 官方结构、embedding、维度、距离、top-k、collection/entity/point、metadata/payload、schema、向量索引、payload index、metadata filter、hybrid search、更新删除、权限、AIOps 相似故障检索实验 |
| 已完成第一版 | SLI / SLO / SLA | [sli-slo-sla.md](./sre-aiops/sli-slo-sla.md) | Google SRE 官方结构、用户旅程、SLI/SLO/SLA 边界、good events / total events、延迟 SLI、错误预算、burn rate、多窗口告警、Prometheus recording/alerting rules、低流量服务、SLO 与 AIOps 告警治理实验 |
| 已完成第一版 | 告警治理 | [alert-governance.md](./sre-aiops/alert-governance.md) | Google SRE 监控与实用告警原则、page/ticket/info 分级、症状 vs 原因、四个黄金信号、Prometheus alerting rules、Alertmanager grouping/routing/inhibition/silence、标签规范、告警体检表、质量指标、AIOps 告警降噪输入 |
| 已完成第一版 | 事件响应 | [incident-response.md](./sre-aiops/incident-response.md) | Google SRE Emergency Response、incident 生命周期、IC/OL/CL/Scribe 角色、SEV 分级、incident 声明、时间线、缓解优先、沟通节奏、升级/交接、resolved 标准、事件数据沉淀到 AIOps |
| 已完成第一版 | Runbook | [runbook.md](./sre-aiops/runbook.md) | AWS Systems Manager Automation runbook、Google SRE 自动化原则、runbook 与 incident/postmortem 闭环、字段模板、runbook_url、检查命令和期望输出、决策树、风险/审批/验证/升级、自动化风险分级、AIOps/RAG 结合 |
| 已完成第一版 | RCA 根因分析 | [rca.md](./sre-aiops/rca.md) | Google SRE 无责复盘文化、postmortem 模板、证据输入、直接原因/促成因素/系统性缺口、5 Whys、鱼骨图文字版、行动项质量、MTTD/MTTA/MTTR、RCA 反哺告警、Runbook 和 AIOps 知识库 |
| 已完成第一版 | 变更管理 | [change-management.md](./sre-aiops/change-management.md) | Google SRE Release Engineering、可复现构建、制品追踪、策略门禁、变更分类、变更单模板、滚动/蓝绿/金丝雀/Feature Flag、错误预算门禁、验证指标、回滚计划、数据库/配置/紧急变更、AIOps 变更关联 |
| 已完成第一版 | AIOps 闭环 | [aiops-loop.md](./sre-aiops/aiops-loop.md) | Microsoft Azure Monitor AIOps / agentic operations、Google SRE 闭环、观测/检测/关联/解释/建议/行动/验证/学习分层、最小作品集架构、incident candidate 数据模型、guardrails、成熟度、效果指标 |
| 已完成第一版 | 网络安全等级保护（等保 2.0） | [mlps.md](./security-compliance/mlps.md) | 现行法律与国家标准、保护对象与五级定级、备案/整改/测评/监督检查、技术与管理控制、云场景、AIOps 持续合规、只读取证实验、证据台账、常见问题和学习证据 |
| 已完成第一版 | IBM Storage | [ibm-storage.md](./storage-data-protection/ibm-storage.md) | IBM 官方产品地图、块/文件/对象/磁带、FlashSystem/Storage Virtualize 架构、卷/池/MDisk/主机映射、双控/SAN/多路径、容量性能、快照复制备份、Storage Insights、离线健康实验和端到端排障 |
| 已完成第一版 | Dell EMC VPLEX | [dell-emc-vplex.md](./storage-data-protection/dell-emc-vplex.md) | Dell 官方 VPLEX/Metro node 边界、Storage Volume/Extent/Device/Virtual Volume、Storage View、Metro、Consistency Group、Detach Rule、Witness、系统卷、双层实验、分区事故和系统设计 |
| 已完成第一版 | Dell EMC VMAX | [dell-emc-vmax.md](./storage-data-protection/dell-emc-vmax.md) | Dell 官方 VMAX/PowerMax 代际、Engine/Director/V-Brick、SRP/TDEV、IG/PG/SG/Masking View、SLO、SnapVX、SRDF、SYMCLI、双层实验、事故题和系统设计 |
| 已完成第一版 | Brocade 6510 | [brocade-6510.md](./storage-data-protection/brocade-6510.md) | Broadcom 官方硬件与 EOS 边界、FC 登录、WWPN/FCID、zoning、FSPF、ISL、BB Credit、慢排水、MAPS、双 Fabric、离线实验、事故题和迁移设计 |
| 已完成第一版 | Ceph | [ceph.md](./storage-data-protection/ceph.md) | Ceph 官方架构、RADOS、RBD/CephFS/RGW、MON/MGR/OSD、pool/PG/CRUSH、复制与纠删码、cephadm 单机实验、Prometheus 指标、常见故障和变更安全 |
| 已完成第一版 | 华为 OceanStor | [huawei-oceanstor.md](./storage-data-protection/huawei-oceanstor.md) | 华为官方产品地图、OceanStor Dorado/混合闪存/Pacific 边界、控制器与缓存、存储池/LUN/文件系统、主机映射、多路径、快照/复制/双活、离线健康实验和 AIOps 排障 |
| 已完成第一版 | 爱数 AnyStorage | [aishu-anystorage.md](./storage-data-protection/aishu-anystorage.md) | 爱数官方产品地图、AnyStorage 7/GX/AnyBackup 边界、控制器/缓存/RAID 2.0、SAN/NAS、卷/映射/多路径、快照/复制/双活/CDP、离线健康实验和 AIOps 排障 |
| 已完成第一版 | VMware vSphere | [vsphere.md](./virtualization-private-cloud/vsphere.md) | Broadcom 官方产品与版本地图、ESXi/ESX、vCenter、清单、HA/DRS/vMotion/EVC、虚拟网络、数据存储、性能、vLCM、API、离线健康实验和 AIOps 排障 |
| 已达到大厂面试级第一版 | IBM WebSphere | [websphere.md](./middleware-application-platform/websphere.md) | IBM 官方产品与生命周期边界、traditional ND 与 Liberty、IHS/Plug-in/JVM/JDBC/JMS/JTA 请求路径、配置同步、会话与事务状态、PMI、双层实验、事故题和系统设计 |
| 已完成第一版 | 岗位缺口技术栈 | [岗位专项路线](../interview/kubernetes-platform-operations-role.md) | 补齐 Rancher、Harbor、Istio、KubeSphere、OpenStack、GitLab、Jenkins、Nexus Repository 与系统架构/技术方案设计，并按 P0/P1/P2 串成岗位项目证据 |

## 精讲批次进度

| 批次 | 范围 | 状态 | 说明 |
|---|---|---|---|
| 0 | Prometheus、Grafana、Docker Compose | 已完成 | 第一批示范级文章 |
| 1 | Linux、Git、GitHub、Markdown、VitePress、Python、Shell/PowerShell、systemd、网络基础 | 深讲第一版已完成 | 已补齐官方知识地图、核心机制、命令/配置/API 字典、实验、排障和学习证据 |
| 2 | Docker、Kubernetes、Helm、NGINX/Ingress、微服务 | 深讲第一版已完成 | 已补齐官方知识地图、核心机制、命令/配置/API 字典、实验、排障和学习证据 |
| 3 | Alertmanager、OpenTelemetry、Loki、Elasticsearch、VictoriaMetrics | 深讲第一版已完成 | 已补齐官方知识地图、核心机制、命令/配置/API 字典、实验、排障和学习证据 |
| 4 | Ansible、Terraform、GitHub Actions、CI/CD、Runbook Automation | 深讲第一版已完成 | 已补齐官方知识地图、核心机制、命令/配置/API 字典、实验、排障和学习证据 |
| 5 | MySQL、Oracle、PostgreSQL、Redis、Kafka、RabbitMQ、pandas、机器学习、scikit-learn、FastAPI、LLM、LangChain、LangGraph、RAG、向量数据库 | 深讲第一版已完成 | 已补齐官方知识地图、核心机制、命令/配置/API 字典、实验、排障和学习证据 |
| 6 | SLI/SLO/SLA、告警治理、事件响应、Runbook、RCA、变更管理、AIOps 闭环 | 深讲第一版已完成 | 已补齐官方知识地图、机制、命令/API 字典、实验、排障和学习证据 |
| 7 | 网络安全等级保护（等保 2.0） | 深讲第一版已完成 | 新增安全与合规分类，补齐现行依据、实施流程、控制与证据闭环、实验、排障和学习证据 |
| 8 | IBM Storage | 深讲第一版已完成 | 新增存储与数据保护分类，补齐产品边界、核心架构、命令字典、指标、实验、排障和学习证据 |
| 9 | Ceph | 深讲第一版已完成 | 补齐分布式存储数据路径、核心 daemon、PG/CRUSH、部署实验、指标、排障、升级和学习证据 |
| 10 | 华为 OceanStor | 深讲第一版已完成 | 补齐集中式存储产品边界、SAN/NAS 数据路径、池/LUN/映射、多路径、数据保护、双活、指标、实验、排障和学习证据 |
| 11 | 爱数 AnyStorage | 深讲第一版已完成 | 补齐统一存储与 GX 边界、SAN/NAS 数据路径、RAID 2.0、卷/映射/多路径、复制、双活、CDP、指标、实验、排障和学习证据 |
| 12 | VMware vSphere | 深讲第一版已完成 | 新增虚拟化与私有云分类，补齐计算/网络/存储数据路径、HA/DRS/vMotion、性能、生命周期、API、实验、排障和学习证据 |
| 13 | Kubernetes 平台运维岗位缺口 | 深讲第一版已完成 | 新增 8 个岗位点名技术栈、系统架构与技术方案设计教程，以及 30 天岗位专项学习路线 |
| 14 | Apache ZooKeeper | 深讲第一版已完成 | 补齐分布式协调数据模型、会话与 Watch、选主和多数派、存储安全、监控、实验、排障和 Kafka 版本边界 |
| 15 | Kubernetes、etcd、Calico、Cilium | 大厂面试级第一版已完成 | 重构 Kubernetes 原理与生产面试主线，新增 etcd 一致性和两套主流 CNI 的架构、实验、排障与系统设计 |
| 16 | Go（Golang） | 大厂面试级第一版已完成 | 新增 Go 1.26 语言、并发、runtime、内存、HTTP、测试、安全、性能诊断、AIOps 项目、故障实验与面试主线 |
| 17 | Apache Hadoop | 大厂面试级第一版已完成 | 新增 Hadoop 3.5.0、HDFS/YARN/MapReduce 内部链路、HA、容量、安全、升级回滚、故障注入、事故复盘和系统设计 |
| 18 | KVM 虚拟化 | 大厂面试级第一版已完成 | 新增 KVM/QEMU/libvirt、Virtio、网络存储数据路径、迁移、HA、容量、安全、双层实验、事故复盘和系统设计 |
| 19 | Dell EMC VPLEX、Dell EMC VMAX、Brocade 6510 | 大厂面试级第一版已完成 | 新增 VPLEX Metro 仲裁、VMAX 高端阵列与复制、Brocade FC Fabric 与 EOS 迁移，补齐双层实验、事故复盘和生产系统设计 |
| 20 | IBM WebSphere | 大厂面试级第一版已完成 | 新增中间件与应用平台分类，补齐 traditional ND 与 Liberty、请求与管理路径、集群和状态、容量安全、双层实验、事故复盘和生产系统设计 |
| 21 | Apache Hive、Apache HBase、Apache Spark、Apache Flink、Apache HAWQ | 大厂面试级与存量迁移专项第一版已完成 | 补齐 Hadoop 生态 SQL、随机读写、批流计算与遗留 MPP 迁移，覆盖双层实验、生产排障、事故题和系统设计 |
| 22 | IT 项目管理 / PMP | 大厂面试级第一版已完成 | 新增项目交付与 PMP 主线，覆盖 PMBOK 第八版、预测/敏捷/混合交付、关键路径、EVM、风险变更、DevOps/SRE 治理、双层实验、事故题和系统设计 |

## 已完成

| 分类 | 技术栈 | 文件 |
|---|---|---|
| 基础工具 | Linux | [linux.md](./foundation/linux.md) |
| 基础工具 | Git | [git.md](./foundation/git.md) |
| 基础工具 | GitHub | [github.md](./foundation/github.md) |
| 基础工具 | Markdown | [markdown.md](./foundation/markdown.md) |
| 基础工具 | VitePress | [vitepress.md](./foundation/vitepress.md) |
| 基础工具 | Python | [python.md](./foundation/python.md) |
| 基础工具 | Go（Golang） | [golang.md](./foundation/golang.md) |
| 基础工具 | Shell / PowerShell | [shell-powershell.md](./foundation/shell-powershell.md) |
| 基础工具 | systemd | [systemd.md](./foundation/systemd.md) |
| 基础工具 | 网络基础 | [networking.md](./foundation/networking.md) |
| 云原生 | Docker | [docker.md](./cloud-native/docker.md) |
| 云原生 | Docker Compose | [docker-compose.md](./cloud-native/docker-compose.md) |
| 云原生 | Kubernetes | [kubernetes.md](./cloud-native/kubernetes.md) |
| 云原生 | etcd | [etcd.md](./cloud-native/etcd.md) |
| 云原生 | Calico | [calico.md](./cloud-native/calico.md) |
| 云原生 | Cilium | [cilium.md](./cloud-native/cilium.md) |
| 云原生 | Helm | [helm.md](./cloud-native/helm.md) |
| 云原生 | NGINX / Ingress | [nginx-ingress.md](./cloud-native/nginx-ingress.md) |
| 云原生 | 微服务 | [microservices.md](./cloud-native/microservices.md) |
| 云原生 | Rancher | [rancher.md](./cloud-native/rancher.md) |
| 云原生 | Harbor | [harbor.md](./cloud-native/harbor.md) |
| 云原生 | Istio | [istio.md](./cloud-native/istio.md) |
| 云原生 | KubeSphere | [kubesphere.md](./cloud-native/kubesphere.md) |
| 虚拟化与私有云 | VMware vSphere | [vsphere.md](./virtualization-private-cloud/vsphere.md) |
| 虚拟化与私有云 | OpenStack | [openstack.md](./virtualization-private-cloud/openstack.md) |
| 虚拟化与私有云 | KVM 虚拟化 | [kvm.md](./virtualization-private-cloud/kvm.md) |
| 存储与数据保护 | IBM Storage | [ibm-storage.md](./storage-data-protection/ibm-storage.md) |
| 存储与数据保护 | Dell EMC VPLEX | [dell-emc-vplex.md](./storage-data-protection/dell-emc-vplex.md) |
| 存储与数据保护 | Dell EMC VMAX | [dell-emc-vmax.md](./storage-data-protection/dell-emc-vmax.md) |
| 存储与数据保护 | Brocade 6510 | [brocade-6510.md](./storage-data-protection/brocade-6510.md) |
| 存储与数据保护 | Ceph | [ceph.md](./storage-data-protection/ceph.md) |
| 存储与数据保护 | 华为 OceanStor | [huawei-oceanstor.md](./storage-data-protection/huawei-oceanstor.md) |
| 存储与数据保护 | 爱数 AnyStorage | [aishu-anystorage.md](./storage-data-protection/aishu-anystorage.md) |
| 中间件与应用平台 | IBM WebSphere | [websphere.md](./middleware-application-platform/websphere.md) |
| 可观测性 | Prometheus | [prometheus.md](./observability/prometheus.md) |
| 可观测性 | Grafana | [grafana.md](./observability/grafana.md) |
| 可观测性 | OpenTelemetry | [opentelemetry.md](./observability/opentelemetry.md) |
| 可观测性 | Alertmanager | [alertmanager.md](./observability/alertmanager.md) |
| 可观测性 | Loki | [loki.md](./observability/loki.md) |
| 可观测性 | Elasticsearch | [elasticsearch.md](./observability/elasticsearch.md) |
| 可观测性 | VictoriaMetrics | [victoriametrics.md](./observability/victoriametrics.md) |
| 自动化 | Ansible | [ansible.md](./automation/ansible.md) |
| 自动化 | Terraform | [terraform.md](./automation/terraform.md) |
| 自动化 | GitHub Actions | [github-actions.md](./automation/github-actions.md) |
| 自动化 | CI/CD | [cicd.md](./automation/cicd.md) |
| 自动化 | Runbook Automation | [runbook-automation.md](./automation/runbook-automation.md) |
| 自动化 | GitLab 与 GitLab CI/CD | [gitlab.md](./automation/gitlab.md) |
| 自动化 | Jenkins | [jenkins.md](./automation/jenkins.md) |
| 自动化 | Nexus Repository | [nexus-repository.md](./automation/nexus-repository.md) |
| 架构与方案设计 | 系统架构与技术方案设计 | [architecture-solution-design.md](./architecture-delivery/architecture-solution-design.md) |
| 架构与方案设计 | IT 项目管理 / PMP | [it-project-management-pmp.md](./architecture-delivery/it-project-management-pmp.md) |
| 安全与合规 | 网络安全等级保护（等保 2.0） | [mlps.md](./security-compliance/mlps.md) |
| 数据与 AI | MySQL / SQL | [mysql-sql.md](./data-ai/mysql-sql.md) |
| 数据与 AI | Oracle Database | [oracle.md](./data-ai/oracle.md) |
| 数据与 AI | PostgreSQL | [postgresql.md](./data-ai/postgresql.md) |
| 数据与 AI | Redis | [redis.md](./data-ai/redis.md) |
| 数据与 AI | Kafka | [kafka.md](./data-ai/kafka.md) |
| 数据与 AI | RabbitMQ | [rabbitmq.md](./data-ai/rabbitmq.md) |
| 数据与 AI | Apache ZooKeeper | [zookeeper.md](./data-ai/zookeeper.md) |
| 数据与 AI | Apache Hadoop | [hadoop.md](./data-ai/hadoop.md) |
| 数据与 AI | Apache Hive | [hive.md](./data-ai/hive.md) |
| 数据与 AI | Apache HBase | [hbase.md](./data-ai/hbase.md) |
| 数据与 AI | Apache Spark | [spark.md](./data-ai/spark.md) |
| 数据与 AI | Apache Flink | [flink.md](./data-ai/flink.md) |
| 数据与 AI | Apache HAWQ（已退休） | [hawq.md](./data-ai/hawq.md) |
| 数据与 AI | pandas | [pandas.md](./data-ai/pandas.md) |
| 数据与 AI | 机器学习 | [machine-learning.md](./data-ai/machine-learning.md) |
| 数据与 AI | scikit-learn | [scikit-learn.md](./data-ai/scikit-learn.md) |
| 数据与 AI | FastAPI | [fastapi.md](./data-ai/fastapi.md) |
| 数据与 AI | LLM / OpenAI API | [llm-openai.md](./data-ai/llm-openai.md) |
| 数据与 AI | LangChain | [langchain.md](./data-ai/langchain.md) |
| 数据与 AI | LangGraph | [langgraph.md](./data-ai/langgraph.md) |
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

当前技术栈清单已经全部拆分完成。后续如果学习中新增技术，比如 Thanos、ClickHouse、Airflow、Argo CD，再继续按“一技术一文件”追加。

## 写作规则

- 只引用官方链接和高可信资料，不复制官方全文。
- 每篇都要能让零基础读者照着做第一个实验。
- 每篇都要说明它在 AIOps 链路中的作用。
- 每篇最后必须有“学习证据”，方便持续记录到 GitHub。
