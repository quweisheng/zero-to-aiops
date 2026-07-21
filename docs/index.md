# To Be Better AIOps Engineer

这是一个面向转岗的 AIOps 学习知识库。它不追求一次性学完所有概念，而是用公开项目把能力做出来。

## 知识库精讲标准

这个仓库会按“像教程一样讲清楚”的方式持续扩展。写法参考了 [二哥的 Java 进阶之路](https://javabetter.cn/overview/what-is-java.html) 那种通俗、对话感强、循序拆解的讲法，但内容会围绕 AIOps 重新组织，不照搬人设、段子和原文。

每个技术栈文件都尽量回答：为什么学、是什么、原理是什么、架构是什么、如何配置、如何做实验、出问题怎么查、面试怎么讲、学习证据怎么提交到 GitHub。

后续所有技术栈文章都会参考 [技术栈精讲写作标准](./tech-stack/writing-standard.md) 继续补充，重点不是堆资料，而是让一个运维小白能跟着做、能复盘、能把学习过程沉淀到 GitHub。

## 当前目标

- 从运维经验出发，补齐 SRE、可观测性、Kubernetes、Python 数据分析和自动化能力。
- 把生产问题转成数据、告警、自动化、复盘和智能排障方案。
- 围绕 AIOps / SRE / DevOps / 智能运维岗位准备简历和面试。

## 技术栈入口

### 基础工具

- [Linux](./tech-stack/foundation/linux.md)
- [Git](./tech-stack/foundation/git.md)
- [GitHub](./tech-stack/foundation/github.md)
- [Markdown](./tech-stack/foundation/markdown.md)
- [VitePress](./tech-stack/foundation/vitepress.md)
- [Python](./tech-stack/foundation/python.md)
- [Go / Golang](./tech-stack/foundation/golang.md)
- [Shell / PowerShell](./tech-stack/foundation/shell-powershell.md)
- [systemd](./tech-stack/foundation/systemd.md)
- [网络基础](./tech-stack/foundation/networking.md)

### 可观测性

- [Prometheus](./tech-stack/observability/prometheus.md)
- [VictoriaMetrics](./tech-stack/observability/victoriametrics.md)
- [Grafana](./tech-stack/observability/grafana.md)
- [OpenTelemetry](./tech-stack/observability/opentelemetry.md)
- [Alertmanager](./tech-stack/observability/alertmanager.md)
- [Loki](./tech-stack/observability/loki.md)
- [Elasticsearch](./tech-stack/observability/elasticsearch.md)

### 云原生

- [Docker](./tech-stack/cloud-native/docker.md)
- [Docker Compose](./tech-stack/cloud-native/docker-compose.md)
- [Kubernetes](./tech-stack/cloud-native/kubernetes.md)
- [Helm](./tech-stack/cloud-native/helm.md)
- [NGINX / Ingress](./tech-stack/cloud-native/nginx-ingress.md)
- [微服务](./tech-stack/cloud-native/microservices.md)
- [Rancher](./tech-stack/cloud-native/rancher.md)
- [Harbor](./tech-stack/cloud-native/harbor.md)
- [Istio](./tech-stack/cloud-native/istio.md)
- [KubeSphere](./tech-stack/cloud-native/kubesphere.md)

### 虚拟化与私有云

- [KVM 虚拟化](./tech-stack/virtualization-private-cloud/kvm.md)
- [VMware vSphere](./tech-stack/virtualization-private-cloud/vsphere.md)
- [OpenStack](./tech-stack/virtualization-private-cloud/openstack.md)

### 存储与数据保护

- [IBM Storage](./tech-stack/storage-data-protection/ibm-storage.md)
- [Dell EMC VPLEX](./tech-stack/storage-data-protection/dell-emc-vplex.md)
- [Dell EMC VMAX](./tech-stack/storage-data-protection/dell-emc-vmax.md)
- [Brocade 6510 光纤交换机](./tech-stack/storage-data-protection/brocade-6510.md)
- [Ceph](./tech-stack/storage-data-protection/ceph.md)
- [华为 OceanStor](./tech-stack/storage-data-protection/huawei-oceanstor.md)
- [爱数 AnyStorage](./tech-stack/storage-data-protection/aishu-anystorage.md)

### 自动化与 CI/CD

- [Ansible](./tech-stack/automation/ansible.md)
- [Terraform](./tech-stack/automation/terraform.md)
- [GitHub Actions](./tech-stack/automation/github-actions.md)
- [CI/CD](./tech-stack/automation/cicd.md)
- [Runbook Automation](./tech-stack/automation/runbook-automation.md)
- [GitLab 与 GitLab CI/CD](./tech-stack/automation/gitlab.md)
- [Jenkins](./tech-stack/automation/jenkins.md)
- [Nexus Repository](./tech-stack/automation/nexus-repository.md)

### 架构与方案设计

- [系统架构与技术方案设计](./tech-stack/architecture-delivery/architecture-solution-design.md)

### 安全与合规

- [网络安全等级保护（等保 2.0）](./tech-stack/security-compliance/mlps.md)

### 数据与 AI

- [MySQL / SQL](./tech-stack/data-ai/mysql-sql.md)
- [Oracle Database](./tech-stack/data-ai/oracle.md)
- [PostgreSQL](./tech-stack/data-ai/postgresql.md)
- [Redis](./tech-stack/data-ai/redis.md)
- [Kafka](./tech-stack/data-ai/kafka.md)
- [RabbitMQ](./tech-stack/data-ai/rabbitmq.md)
- [Apache ZooKeeper](./tech-stack/data-ai/zookeeper.md)
- [Apache Hadoop](./tech-stack/data-ai/hadoop.md)
- [pandas](./tech-stack/data-ai/pandas.md)
- [机器学习](./tech-stack/data-ai/machine-learning.md)
- [scikit-learn](./tech-stack/data-ai/scikit-learn.md)
- [FastAPI](./tech-stack/data-ai/fastapi.md)
- [LLM / OpenAI API](./tech-stack/data-ai/llm-openai.md)
- [LangChain](./tech-stack/data-ai/langchain.md)
- [LangGraph](./tech-stack/data-ai/langgraph.md)
- [RAG](./tech-stack/data-ai/rag.md)
- [向量数据库](./tech-stack/data-ai/vector-database.md)

### SRE/AIOps 实践

- [SLI / SLO / SLA](./tech-stack/sre-aiops/sli-slo-sla.md)
- [告警治理](./tech-stack/sre-aiops/alert-governance.md)
- [事件响应](./tech-stack/sre-aiops/incident-response.md)
- [Runbook](./tech-stack/sre-aiops/runbook.md)
- [RCA 根因分析](./tech-stack/sre-aiops/rca.md)
- [变更管理](./tech-stack/sre-aiops/change-management.md)
- [AIOps 闭环](./tech-stack/sre-aiops/aiops-loop.md)

## 推荐阅读顺序

1. [学习路线](./roadmap/README.md)
2. [能力地图](./roadmap/00-skill-map.md)
3. [AIOps 技术栈总清单](./tech-stack/README.md)
4. [Linux](./tech-stack/foundation/linux.md)
5. [Git](./tech-stack/foundation/git.md)
6. [Prometheus](./tech-stack/observability/prometheus.md)
7. [KVM 虚拟化](./tech-stack/virtualization-private-cloud/kvm.md)
8. [VMware vSphere](./tech-stack/virtualization-private-cloud/vsphere.md)
9. [IBM Storage](./tech-stack/storage-data-protection/ibm-storage.md)
10. [Dell EMC VPLEX](./tech-stack/storage-data-protection/dell-emc-vplex.md)
11. [Dell EMC VMAX](./tech-stack/storage-data-protection/dell-emc-vmax.md)
12. [Brocade 6510 光纤交换机](./tech-stack/storage-data-protection/brocade-6510.md)
13. [Ceph](./tech-stack/storage-data-protection/ceph.md)
14. [华为 OceanStor](./tech-stack/storage-data-protection/huawei-oceanstor.md)
15. [爱数 AnyStorage](./tech-stack/storage-data-protection/aishu-anystorage.md)
16. [网络安全等级保护（等保 2.0）](./tech-stack/security-compliance/mlps.md)
17. [Kubernetes 平台运维岗位专项路线](./interview/kubernetes-platform-operations-role.md)
