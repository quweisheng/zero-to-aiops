# AIOps 技术栈总清单

这个目录记录我从 0 学 AIOps 过程中会接触到的技术栈。它不是一次性背诵清单，而是一个长期学习地图：每学一项，就补充理解、配置、实验和踩坑记录。

## 精讲写作标准

后续每个技术栈文件都会按 [技术栈精讲写作标准](./writing-standard.md) 补齐内容：官方资料、场景开场、是什么、原理、架构、配置、实验、排障、面试题和学习证据。验收深度统一提升到“大厂面试级”：既让小白能从零实验，也要能解释内部链路、生产高可用、容量、安全、升级、故障场景和连续追问。

写作目标不是“资料越全越好”，而是像有人带着学一样，把一个新手最容易卡住的地方提前讲出来：为什么要学、术语怎么理解、第一步怎么跑、坏了先查哪里、最后怎么变成 AIOps 项目证据。

第一批示范级文章：

- [Prometheus 精讲](./observability/prometheus.md)
- [Grafana 精讲](./observability/grafana.md)
- [Docker Compose 精讲](./cloud-native/docker-compose.md)
- [Kubernetes 大厂面试级精讲](./cloud-native/kubernetes.md)
- [etcd 深讲](./cloud-native/etcd.md)
- [Calico 深讲](./cloud-native/calico.md)
- [Cilium 深讲](./cloud-native/cilium.md)
- [Go（Golang）大厂面试级深讲](./foundation/golang.md)
- [Apache Hadoop 大厂面试级深讲](./data-ai/hadoop.md)
- [KVM 虚拟化大厂面试级深讲](./virtualization-private-cloud/kvm.md)

## 学习优先级

- P0：必须先学。没有它，后面的项目做不起来。
- P1：求职核心。AIOps / SRE / DevOps 岗位经常出现。
- P2：项目进阶。能让作品集更像真实生产系统。
- P3：扩展方向。等 P0-P2 有项目后再深入。

## 技术栈地图

| 类别 | 技术 | 优先级 | 学到什么程度 |
|---|---|---:|---|
| 基础工具 | Linux、systemd、网络、Git、GitHub、Markdown、VitePress、Python、Go、Shell/PowerShell | P0-P1 | 能排障、提交代码、编写脚本，并用 Go 构建并发、可观测、可诊断的云原生与 AIOps 服务 |
| 可观测性 | Prometheus、VictoriaMetrics、Alertmanager、Grafana、OpenTelemetry、Loki、Elasticsearch | P1 | 能采集指标、日志、链路，能做仪表盘和告警 |
| 云原生 | Docker、Kubernetes、etcd、Calico、Cilium、Helm、NGINX/Ingress、微服务、Rancher、Harbor、Istio、KubeSphere | P1 | 能解释容器交付、控制面一致性、Pod/Service 网络、策略、平台治理、高可用、升级和端到端排障 |
| 虚拟化与私有云 | KVM、VMware vSphere、OpenStack | P1-P2 | 能理解虚拟化与 IaaS 的计算、网络、存储、调度、高可用和端到端排障 |
| 存储与数据保护 | IBM Storage、Dell EMC VPLEX、Dell EMC VMAX、Brocade 6510、华为 OceanStor、爱数 AnyStorage、Ceph | P1-P2 | 能理解集中式与分布式存储、块/文件/对象、FC SAN、存储虚拟化、高端阵列、存储池、LUN、多路径、双活、复制、备份与存储 AIOps 排障 |
| 自动化与 CI/CD | Ansible、Terraform、GitHub Actions、GitLab、Jenkins、Nexus、CI/CD、Runbook Automation | P1-P2 | 能把提交、测试、构建、制品、部署、审批和回滚连成可审计流程 |
| 架构与方案设计 | 系统架构、可行性报告、容量、高可用、上线与回滚 | P0-P1 | 能把业务需求转成可解释、可验证、可实施的技术方案 |
| 安全与合规 | 网络安全等级保护（等保 2.0） | P1-P2 | 能理解定级、备案、建设整改、等级测评和持续运营，并用 AIOps 建立证据与整改闭环 |
| 数据与 AI | MySQL/SQL、Oracle、PostgreSQL、Redis、Kafka、RabbitMQ、ZooKeeper、Hadoop、pandas、机器学习、scikit-learn、FastAPI、LLM/OpenAI API、LangChain、LangGraph、RAG、向量数据库 | P1-P3 | 能处理运维数据、数据库、事件流、分布式协调、分布式存储与批计算和 AI 应用，做异常检测、告警降噪和智能运维助手 |
| SRE/AIOps 实践 | SLI/SLO、告警治理、事件响应、Runbook、RCA、变更管理、AIOps 闭环 | P0-P1 | 能把工具能力转成稳定性结果和面试故事 |

## 推荐学习顺序

1. [Linux](./foundation/linux.md)：先会记录、提交、跑命令、读系统状态。
2. [SLI / SLO / SLA](./sre-aiops/sli-slo-sla.md)：先知道为什么学这些工具。
3. [Prometheus](./observability/prometheus.md)：先把数据采集跑通。
4. [Docker](./cloud-native/docker.md)：把服务放进容器。
5. [Go（Golang）](./foundation/golang.md)：从语言基础深入并发、runtime、网络服务、性能诊断和 AIOps 工程实践。
6. [Kubernetes](./cloud-native/kubernetes.md)：从对象操作深入 API、控制器、调度、网络、存储、高可用和生产排障。
7. [etcd](./cloud-native/etcd.md)：理解 Kubernetes 状态存储、Raft 多数派、MVCC、Watch、备份和恢复。
8. [Calico](./cloud-native/calico.md)：理解 CNI、IPAM、BGP/封装、NetworkPolicy 和网络故障链路。
9. [Cilium](./cloud-native/cilium.md)：理解 eBPF 数据面、身份策略、Service 负载均衡和 Hubble 可观测性。
10. [KVM 虚拟化](./virtualization-private-cloud/kvm.md)：理解 KVM、QEMU、libvirt、Virtio、虚拟网络与存储、迁移、高可用和平台排障。
11. [VMware vSphere](./virtualization-private-cloud/vsphere.md)：理解虚拟机如何共享物理资源，以及集群、迁移、网络、存储和平台排障。
12. [IBM Storage](./storage-data-protection/ibm-storage.md)：理解业务数据最终如何落盘、保护、监控和恢复。
13. [Dell EMC VPLEX](./storage-data-protection/dell-emc-vplex.md)：理解异构块存储虚拟化、Metro 同步双活、Consistency Group、Detach Rule 和 Witness 仲裁。
14. [Dell EMC VMAX](./storage-data-protection/dell-emc-vmax.md)：理解高端阵列 Engine/Director、SRP/TDEV、Masking View、SnapVX、SRDF 和容量性能排障。
15. [Brocade 6510 光纤交换机](./storage-data-protection/brocade-6510.md)：理解 FC 登录、zoning、FSPF、BB Credit、慢排水、双 Fabric 和 EOS 迁移。
16. [华为 OceanStor](./storage-data-protection/huawei-oceanstor.md)：理解企业阵列的数据路径、LUN 映射、多路径、双活、复制和存储排障。
17. [爱数 AnyStorage](./storage-data-protection/aishu-anystorage.md)：理解统一 SAN/NAS、RAID 2.0、GX 虚拟化、双活、复制和存储 AIOps 排障。
18. [Ceph](./storage-data-protection/ceph.md)：理解对象如何经过 pool、PG 和 CRUSH 分布到 OSD，并学会判断集群健康。
19. [GitHub Actions](./automation/github-actions.md)：把重复动作变成流程。
20. [pandas](./data-ai/pandas.md)：用数据做异常检测、告警降噪、智能助手。
21. [机器学习](./data-ai/machine-learning.md)：理解样本、特征、标签、评估和异常检测边界。
22. [LangChain](./data-ai/langchain.md)：把 LLM、RAG、工具调用和 runbook 查询组织成应用。
23. [网络安全等级保护（等保 2.0）](./security-compliance/mlps.md)：把资产、控制、证据、整改和持续监控连成闭环。
24. [Kubernetes 平台运维岗位专项路线](../interview/kubernetes-platform-operations-role.md)：按招聘要求串联平台、交付、IaaS 和方案证据。
25. [Apache ZooKeeper](./data-ai/zookeeper.md)：理解分布式协调、会话、Watch、选主、多数派和上层依赖故障。
26. [Apache Hadoop](./data-ai/hadoop.md)：理解 HDFS、YARN、MapReduce、HA、容量、安全、升级和数据平台排障。

## 一技术一文件

当前已经拆分为独立教程的技术：

### 基础工具

- [Linux](./foundation/linux.md)
- [Git](./foundation/git.md)
- [GitHub](./foundation/github.md)
- [Markdown](./foundation/markdown.md)
- [VitePress](./foundation/vitepress.md)
- [Python](./foundation/python.md)
- [Go / Golang](./foundation/golang.md)
- [Shell / PowerShell](./foundation/shell-powershell.md)
- [systemd](./foundation/systemd.md)
- [网络基础](./foundation/networking.md)

### 云原生

- [Docker](./cloud-native/docker.md)
- [Docker Compose](./cloud-native/docker-compose.md)
- [Kubernetes](./cloud-native/kubernetes.md)
- [etcd](./cloud-native/etcd.md)
- [Calico](./cloud-native/calico.md)
- [Cilium](./cloud-native/cilium.md)
- [Helm](./cloud-native/helm.md)
- [NGINX / Ingress](./cloud-native/nginx-ingress.md)
- [微服务](./cloud-native/microservices.md)
- [Rancher](./cloud-native/rancher.md)
- [Harbor](./cloud-native/harbor.md)
- [Istio](./cloud-native/istio.md)
- [KubeSphere](./cloud-native/kubesphere.md)

### 虚拟化与私有云

- [KVM 虚拟化](./virtualization-private-cloud/kvm.md)
- [VMware vSphere](./virtualization-private-cloud/vsphere.md)
- [OpenStack](./virtualization-private-cloud/openstack.md)

### 存储与数据保护

- [IBM Storage](./storage-data-protection/ibm-storage.md)
- [Dell EMC VPLEX](./storage-data-protection/dell-emc-vplex.md)
- [Dell EMC VMAX](./storage-data-protection/dell-emc-vmax.md)
- [Brocade 6510 光纤交换机](./storage-data-protection/brocade-6510.md)
- [Ceph](./storage-data-protection/ceph.md)
- [华为 OceanStor](./storage-data-protection/huawei-oceanstor.md)
- [爱数 AnyStorage](./storage-data-protection/aishu-anystorage.md)

### 可观测性

- [Prometheus](./observability/prometheus.md)
- [VictoriaMetrics](./observability/victoriametrics.md)
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
- [GitLab 与 GitLab CI/CD](./automation/gitlab.md)
- [Jenkins](./automation/jenkins.md)
- [Nexus Repository](./automation/nexus-repository.md)

### 架构与方案设计

- [系统架构与技术方案设计](./architecture-delivery/architecture-solution-design.md)

### 安全与合规

- [网络安全等级保护（等保 2.0）](./security-compliance/mlps.md)

### 数据与 AI

- [MySQL / SQL](./data-ai/mysql-sql.md)
- [Oracle Database](./data-ai/oracle.md)
- [PostgreSQL](./data-ai/postgresql.md)
- [Redis](./data-ai/redis.md)
- [Kafka](./data-ai/kafka.md)
- [RabbitMQ](./data-ai/rabbitmq.md)
- [Apache ZooKeeper](./data-ai/zookeeper.md)
- [Apache Hadoop](./data-ai/hadoop.md)
- [pandas](./data-ai/pandas.md)
- [机器学习](./data-ai/machine-learning.md)
- [scikit-learn](./data-ai/scikit-learn.md)
- [FastAPI](./data-ai/fastapi.md)
- [LLM / OpenAI API](./data-ai/llm-openai.md)
- [LangChain](./data-ai/langchain.md)
- [LangGraph](./data-ai/langgraph.md)
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
  -> VictoriaMetrics 长期指标
  -> Grafana 仪表盘
  -> Alertmanager 告警
  -> Python / pandas 分析
  -> 机器学习建模
  -> scikit-learn 异常检测
  -> FastAPI 暴露接口
  -> LangChain / LangGraph / LLM / RAG 生成排障建议
  -> GitHub 记录过程
```

这条链路打通后，再补 Kubernetes、OpenTelemetry、Loki、Ansible、Kafka、向量数据库和更完整的 SRE 流程。

## 官方资料入口

- [Git](https://git-scm.com/book/en/v2/Getting-Started-What-is-Git%3F)
- [GitHub README](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes)
- [VitePress](https://vitepress.dev/)
- [Python venv](https://docs.python.org/3/library/venv.html)
- [Go](https://go.dev/doc/)
- [Docker](https://docs.docker.com/get-started/docker-overview/)
- [Kubernetes](https://kubernetes.io/docs/concepts/overview/)
- [etcd](https://etcd.io/docs/)
- [Calico](https://docs.tigera.io/calico/latest/about/)
- [Cilium](https://docs.cilium.io/en/stable/)
- [Rancher](https://ranchermanager.docs.rancher.com/)
- [Harbor](https://goharbor.io/docs/)
- [Istio](https://istio.io/latest/docs/)
- [KubeSphere](https://docs.kubesphere.co/v4.2.0/)
- [OpenStack](https://docs.openstack.org/)
- [KVM](https://www.kernel.org/doc/html/latest/virt/kvm/index.html)
- [QEMU](https://www.qemu.org/docs/master/)
- [libvirt](https://libvirt.org/docs.html)
- [GitLab CI/CD](https://docs.gitlab.com/ci/)
- [Jenkins](https://www.jenkins.io/doc/)
- [Nexus Repository](https://help.sonatype.com/en/sonatype-nexus-repository.html)
- [Spring Boot](https://docs.spring.io/spring-boot/index.html)
- [Spring Cloud](https://docs.spring.io/spring-cloud/docs/current/reference/html/)
- [Prometheus](https://prometheus.io/docs/introduction/overview/)
- [VictoriaMetrics](https://docs.victoriametrics.com/victoriametrics/quick-start/)
- [Grafana](https://grafana.com/docs/)
- [OpenTelemetry](https://opentelemetry.io/docs/)
- [VMware vSphere](https://techdocs.broadcom.com/us/en/vmware-cis/vsphere/vsphere/9-0.html)
- [IBM Storage](https://www.ibm.com/solutions/storage)
- [Dell VPLEX](https://www.dell.com/support/product-details/en-us/product/vplex-vs6/resources/manuals)
- [Dell VMAX All Flash](https://www.dell.com/support/product-details/en-us/product/vmax-all-flash/resources/manuals)
- [Broadcom Brocade 6510 Data Sheet](https://docs.broadcom.com/doc/12379855)
- [Ceph](https://docs.ceph.com/en/latest/)
- [华为 OceanStor](https://e.huawei.com/cn/products/storage)
- [爱数 AnyStorage](https://www.aishu.cn/cn/anystorage)
- [Ansible](https://docs.ansible.com/projects/ansible/latest/index.html)
- [Terraform](https://developer.hashicorp.com/terraform/docs)
- [GitHub Actions](https://docs.github.com/actions)
- [中华人民共和国网络安全法](https://www.cac.gov.cn/2025-12/29/c_1768735112911946.htm)
- [国家标准全文公开系统：网络安全等级保护](https://openstd.samr.gov.cn/bzgk/std/std_list?p.p1=0&p.p2=%E7%BD%91%E7%BB%9C%E5%AE%89%E5%85%A8%E7%AD%89%E7%BA%A7%E4%BF%9D%E6%8A%A4&p.p90=circulation_date&p.p91=desc)
- [MySQL](https://dev.mysql.com/doc/refman/8.4/en/tutorial.html)
- [Oracle Database](https://docs.oracle.com/en/database/)
- [PostgreSQL](https://www.postgresql.org/docs/current/)
- [Redis](https://redis.io/docs/latest/)
- [Apache Kafka](https://kafka.apache.org/documentation/)
- [RabbitMQ](https://www.rabbitmq.com/docs)
- [Apache ZooKeeper](https://zookeeper.apache.org/doc/current/)
- [Apache Hadoop](https://hadoop.apache.org/docs/current/)
- [Microservices.io](https://microservices.io/patterns/microservices.html)
- [pandas](https://pandas.pydata.org/docs/)
- [Google Machine Learning Crash Course](https://developers.google.com/machine-learning/crash-course)
- [scikit-learn](https://scikit-learn.org/stable/user_guide.html)
- [FastAPI](https://fastapi.tiangolo.com/)
- [OpenAI API](https://developers.openai.com/api/docs/quickstart)
- [LangChain](https://docs.langchain.com/oss/python/langchain/overview)
- [LangGraph](https://docs.langchain.com/oss/python/langgraph/overview)
- [LangChain RAG](https://docs.langchain.com/oss/python/langchain/rag)
- [Milvus](https://milvus.io/docs)
- [Chroma](https://docs.trychroma.com/docs/overview/introduction)
- [Google SRE Books](https://sre.google/books/)
- [Microsoft Learn - AIOps and agentic operations](https://learn.microsoft.com/en-us/azure/azure-monitor/aiops/aiops-and-agentic-operations)
