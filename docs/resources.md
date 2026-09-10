# 资料清单

这里放高可信资料入口。学习时优先看官方文档、权威教材和成熟社区资料，不用一次看完，按项目需要查。

## 老师带你读英文官方文档

先带着一个问题去读，例如“程序重启后数据还在吗”。在目录找到 Persistence（持久化：进程结束后怎样保留数据）或 Storage（存储），看适用版本、默认值、参数说明和失败条件，再回到本地实验验证。全文翻译容易淹没重点；问题、版本、机制、参数、验证这五项更适合做笔记。

| 官方模块 | 中文注释 | 应当带走什么 |
|---|---|---|
| Overview / Introduction | 总览与介绍 | 用途、边界和它位于系统哪一层 |
| Getting started / Tutorial | 快速开始与教程 | 一条能运行的最短路径和前置条件 |
| Concepts / Architecture | 概念与架构 | 对象、责任、状态和数据路径 |
| Reference / Configuration | 接口参考与配置 | 参数类型、单位、默认值、约束和返回值 |
| Operations / Troubleshooting | 运行维护与故障排查 | 健康证据、错误解释和修复顺序 |
| Security / Hardening | 安全与加固 | 身份、权限、加密和默认暴露面 |
| Upgrade / Migration | 升级与迁移 | 兼容性变化、数据格式和退出方法 |
| Release notes / Changelog | 发行说明与变更记录 | 这一版本改变了什么，旧教程是否还适用 |

你先找自己使用的版本再复制命令。`latest` 表示会变化的最新入口，LTS 是 Long-Term Support（长期支持），Deprecated 表示已不建议继续采用但未必立即删除，Removed 表示已经移除。不要把搜索结果日期当软件版本，也不要因为旧博客能安装就判断当前受支持。

读完一节，写下三个句子：它解决什么问题、我怎样观察它、失败时先看哪条证据。然后做一次最小实验。若没有设备或商业授权，用本仓库注明边界的模拟练习；在学习证据里明确哪些结论来自文档，哪些来自实际执行。下面的官方英文产品名保留原名，旁边的中文说明帮助你选择阅读入口。

## AIOps 与智能运维

- [Red Hat: The journey from observability to AIOps automation](https://www.redhat.com/en/topics/automation/observability-to-aiops-automation)
  AIOps、可观测性、事件驱动自动化的整体框架。
- [SREWorks](https://sreworks.cn/)
  中文开源智能运维平台参考，覆盖 DataOps、AIOps、多云管理和运维应用。

## SRE

- [Google SRE Books](https://sre.google/books/)
  SRE（站点可靠性工程）原始教材和实践手册，重点看 SLO（服务级别目标）、toil（重复、手工且缺少持久改进价值的运维劳作）、monitoring（监测）和 incident response（事故响应）。
- [Google Cloud SRE](https://cloud.google.com/sre)
  用于理解 SRE 的岗位、实践和组织落地。

## 基础工具

- [Git Book](https://git-scm.com/book/en/v2/Getting-Started-What-is-Git%3F)
  Git 的快照、分支、提交和远程协作。
- [GitHub README docs](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes)
  仓库首页和项目介绍写法。
- [Markdown Guide](https://www.markdownguide.org/basic-syntax/)
  Markdown 基础语法。
- [VitePress](https://vitepress.dev/)
  把 Markdown 构建成文档站。
- [Python venv](https://docs.python.org/3/library/venv.html)
  Python 虚拟环境和依赖隔离。
- [systemd](https://systemd.io/)
  Linux 服务管理。

## 可观测性

- [OpenTelemetry](https://opentelemetry.io/docs/)
  统一遥测标准，重点看 metrics（指标）、logs（日志）、traces（链路）和 Collector（遥测接收、处理与转发程序）。
- [Prometheus overview](https://prometheus.io/docs/introduction/overview/)
  指标采集、查询和告警基础。
- [VictoriaMetrics quick start](https://docs.victoriametrics.com/victoriametrics/quick-start/)
  Prometheus 兼容时序存储、长期指标保存和 Grafana 查询后端入门。
- [VictoriaMetrics vmagent](https://docs.victoriametrics.com/victoriametrics/vmagent/)
  指标采集、relabel、过滤和 remote write 转发参考。
- [Grafana documentation](https://grafana.com/docs/)
  仪表盘、告警、日志和可观测性平台实践。
- [Grafana Loki](https://grafana.com/docs/loki/latest/)
  日志聚合和 LogQL。
- [Elastic: clusters, nodes, shards](https://www.elastic.co/docs/deploy-manage/distributed-architecture/clusters-nodes-shards)
  Elasticsearch 集群、节点、分片和日志检索架构。

## 云原生

- [Docker overview](https://docs.docker.com/get-started/docker-overview/)
  容器、镜像、Docker daemon、registry 和 Docker Desktop 入门。
- [Kubernetes overview](https://kubernetes.io/docs/concepts/overview/)
  容器编排、自动恢复、扩缩容和发布策略。
- [Kubernetes components](https://kubernetes.io/docs/concepts/overview/components/)
  控制平面、节点组件和集群架构。
- [Helm charts](https://helm.sh/docs/topics/charts/)
  Kubernetes 包管理和 Chart 结构。
- [NGINX reverse proxy](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)
  反向代理、负载均衡和网关排障基础。
- [Spring Boot documentation](https://docs.spring.io/spring-boot/index.html)
  Java 微服务单体应用启动、配置、Actuator、指标、链路追踪和生产化能力。
- [Spring Cloud documentation](https://docs.spring.io/spring-cloud/docs/current/reference/html/)
  分布式配置、服务发现、网关、负载均衡、服务调用、熔断和消息等微服务模式。
- [microservices.io](https://microservices.io/patterns/microservices.html)
  微服务架构模式、服务边界、数据一致性和可靠性模式参考。
- [CNCF Landscape](https://landscape.cncf.io/)
  了解云原生生态，不要试图一次学完。

## 自动化与 CI/CD

- [Ansible documentation](https://docs.ansible.com/projects/ansible/latest/index.html)
  运维自动化、配置管理和 playbook。
- [Terraform documentation](https://developer.hashicorp.com/terraform/docs)
  基础设施即代码、provider、state、plan/apply。
- [GitHub Actions](https://docs.github.com/actions)
  CI/CD workflow、job、runner 和自动文档构建。

## 数据分析与异常检测

- [pandas documentation](https://pandas.pydata.org/docs/)
  CSV、DataFrame、时间序列、分组聚合和窗口计算。
- [Google Machine Learning Crash Course](https://developers.google.com/machine-learning/crash-course)
  机器学习基础、分类、回归、聚类和评估入门。
- [Google ML classification metrics](https://developers.google.com/machine-learning/crash-course/classification/accuracy-precision-recall)
  accuracy、precision、recall 等分类指标解释。
- [scikit-learn outlier detection](https://scikit-learn.org/stable/modules/outlier_detection.html)
  novelty detection 和 outlier detection 的区别。
- [scikit-learn IsolationForest](https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.IsolationForest.html)
  第一个异常检测项目的模型参考。
- [FastAPI documentation](https://fastapi.tiangolo.com/)
  构建告警 webhook、异常检测 API 和 runbook 推荐服务。

## 数据库与事件流

- [MySQL Reference Manual](https://dev.mysql.com/doc/refman/8.4/en/)
  关系型数据、索引、事务、复制和慢查询。
- [Oracle Database Documentation](https://docs.oracle.com/en/database/)
  企业核心数据库、SQL、性能调优、备份恢复和高可用参考。
- [PostgreSQL Documentation](https://www.postgresql.org/docs/current/)
  开源关系型数据库、事务、索引、MVCC、WAL、监控和备份。
- [Redis documentation](https://redis.io/docs/latest/)
  缓存、数据结构、Stream、持久化和慢命令。
- [Kafka documentation](https://kafka.apache.org/documentation/)
  topic、partition、broker、consumer group 和事件流。
- [RabbitMQ documentation](https://www.rabbitmq.com/docs)
  exchange、queue、binding、ack、死信和消息队列排障。

## LLM 与 RAG

- [OpenAI API documentation](https://platform.openai.com/docs/)
  LLM、结构化输出、embedding 和工具调用能力入口。
- [OpenAI embeddings guide](https://platform.openai.com/docs/guides/embeddings)
  文本向量化和相似度检索。
- [LangChain overview](https://docs.langchain.com/oss/python/langchain/overview)
  agent、model、tools、prompt、middleware 和 LangSmith 入口。
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview)
  有状态 agent、持久执行、人工介入和 AIOps 流程编排入口。
- [LangGraph persistence](https://docs.langchain.com/oss/python/langgraph/persistence)
  checkpoint、短期记忆、长期记忆和中断恢复参考。
- [LangChain agents](https://docs.langchain.com/oss/python/langchain/agents)
  agent loop、工具调用、结构化输出和会话状态。
- [LangChain RAG tutorial](https://docs.langchain.com/oss/python/langchain/rag)
  检索增强生成的学习参考。
- [Milvus documentation](https://milvus.io/docs)
  向量数据库和相似度检索。
- [Chroma documentation](https://docs.trychroma.com/)
  轻量向量数据库入门。

## 求职信号

- [Indeed 中国：运维开发工程师](https://cn.indeed.com/q-%E8%BF%90%E7%BB%B4%E5%BC%80%E5%8F%91%E5%B7%A5%E7%A8%8B%E5%B8%88-%E8%81%8C%E4%BD%8D.html)
  用来观察岗位关键词，不能当作永久岗位列表。
- Boss 直聘、猎聘、智联、LinkedIn、公司官网。
  用来交叉验证天津、北京混合、远程岗位。
