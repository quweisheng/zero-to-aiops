# 技术栈逐篇评测与返工记录

依据仓库精讲标准逐篇审校。这里记录正文的具体问题、修订或保留理由，以及第二位审校者结论；不是自动关键词评分，也不表示读者已经掌握或全部真实产品已实跑。篇幅另见[正文统计](./teaching-coverage.md)，评测方法见[写作标准](./writing-standard.md#逐篇评测返工与独立通关)。

作者复评日期：2026-11-11。当前 115 篇：115 篇已有逐篇评测记录，115 篇当前版本通过正文交叉审校，0 篇仍待处理。文章内容变化后旧审校自动失效；版本摘要只统一 UTF-8 文件开头标记及 Windows/Linux 换行，不忽略正文修改。未审校条目不会因字数够长而自动通过。

本轮明确记录的正文处理：107 篇修订，8 篇复评后保留；未记录处理方式的条目不计入这两个数量。已有合格深度予以保留，不为追求修改数量或篇幅重复填充。

验证类型：executed 表示确实执行了所述有限检查；syntax 只检查语法；reasoned 是正文和证据推理；unrun 是尚未运行的环境。它们不能互相替代，运行了模拟也不等于验证了真实产品或生产系统。

| 技术栈 | 当前正文评测 | 初评问题数 | 实际验证范围 |
|---|---|---:|---|
| [系统架构与技术方案设计深讲](./architecture-delivery/architecture-solution-design.md) | 交叉审校通过（正文） | 1 | reasoned / executed |
| [IT 项目管理 / PMP 深讲](./architecture-delivery/it-project-management-pmp.md) | 交叉审校通过（正文） | 1 | reasoned / executed |
| [Ansible](./automation/ansible.md) | 交叉审校通过（正文） | 1 | reasoned |
| [CI/CD](./automation/cicd.md) | 交叉审校通过（正文） | 2 | reasoned / executed |
| [GitHub Actions](./automation/github-actions.md) | 交叉审校通过（正文） | 1 | reasoned |
| [GitLab 与 GitLab CI/CD 深讲](./automation/gitlab.md) | 交叉审校通过（正文） | 1 | reasoned / executed |
| [Jenkins 技术栈深讲](./automation/jenkins.md) | 交叉审校通过（正文） | 2 | reasoned / syntax / executed |
| [Apache Maven 技术栈深讲](./automation/maven.md) | 交叉审校通过（正文） | 1 | reasoned / syntax |
| [n8n 技术栈深讲](./automation/n8n.md) | 交叉审校通过（正文） | 1 | executed / syntax |
| [Nexus Repository 深讲](./automation/nexus-repository.md) | 交叉审校通过（正文） | 2 | reasoned / syntax |
| [Runbook Automation](./automation/runbook-automation.md) | 交叉审校通过（正文） | 2 | reasoned / executed / syntax |
| [SonarQube 技术栈深讲](./automation/sonarqube.md) | 交叉审校通过（正文） | 2 | reasoned / syntax |
| [Terraform](./automation/terraform.md) | 交叉审校通过（正文） | 2 | reasoned / syntax |
| [Calico 深讲](./cloud-native/calico.md) | 交叉审校通过（正文） | 4 | reasoned / executed |
| [Cilium 深讲](./cloud-native/cilium.md) | 交叉审校通过（正文） | 2 | reasoned / executed |
| [Docker Compose 精讲](./cloud-native/docker-compose.md) | 交叉审校通过（正文） | 1 | reasoned |
| [Docker](./cloud-native/docker.md) | 交叉审校通过（正文） | 2 | reasoned |
| [etcd 深讲](./cloud-native/etcd.md) | 交叉审校通过（正文） | 2 | reasoned / syntax |
| [Harbor 深讲](./cloud-native/harbor.md) | 交叉审校通过（正文） | 3 | reasoned / syntax |
| [Helm](./cloud-native/helm.md) | 交叉审校通过（正文） | 2 | reasoned / executed |
| [Istio 深讲](./cloud-native/istio.md) | 交叉审校通过（正文） | 2 | reasoned / syntax / executed |
| [Kubeflow 技术栈深讲](./cloud-native/kubeflow.md) | 交叉审校通过（正文） | 1 | executed / syntax |
| [Kubernetes](./cloud-native/kubernetes.md) | 交叉审校通过（正文） | 1 | reasoned / syntax |
| [KubeSphere 深讲](./cloud-native/kubesphere.md) | 交叉审校通过（正文） | 2 | reasoned / syntax |
| [微服务深讲](./cloud-native/microservices.md) | 交叉审校通过（正文） | 2 | reasoned / syntax / executed |
| [NGINX / Ingress / Gateway API](./cloud-native/nginx-ingress.md) | 交叉审校通过（正文） | 1 | reasoned / syntax |
| [Rancher 深讲](./cloud-native/rancher.md) | 交叉审校通过（正文） | 2 | reasoned / syntax |
| [TKE on TCE 技术栈深讲](./cloud-native/tke-on-tce.md) | 交叉审校通过（正文） | 2 | reasoned / syntax |
| [Traefik 技术栈深讲](./cloud-native/traefik.md) | 交叉审校通过（正文） | 2 | reasoned / syntax / executed |
| [Apache ActiveMQ 技术栈深讲：Classic 与 Artemis](./data-ai/activemq.md) | 交叉审校通过（正文） | 1 | reasoned / executed |
| [Apache Pulsar 技术栈深讲](./data-ai/apache-pulsar.md) | 交叉审校通过（正文） | 1 | reasoned / executed |
| [Dify 技术栈深讲](./data-ai/dify.md) | 交叉审校通过（正文） | 2 | reasoned / executed / syntax / unrun |
| [FastAPI](./data-ai/fastapi.md) | 交叉审校通过（正文） | 2 | reasoned / executed / syntax / unrun |
| [Apache Flink 深讲](./data-ai/flink.md) | 交叉审校通过（正文） | 1 | reasoned / executed |
| [Apache Hadoop 深讲](./data-ai/hadoop.md) | 交叉审校通过（正文） | 1 | reasoned / executed |
| [Apache HAWQ 存量运维与迁移深讲](./data-ai/hawq.md) | 交叉审校通过（正文） | 3 | reasoned / executed / syntax / unrun |
| [Apache HBase 深讲](./data-ai/hbase.md) | 交叉审校通过（正文） | 1 | reasoned / executed |
| [Apache Hive 深讲](./data-ai/hive.md) | 交叉审校通过（正文） | 1 | reasoned / executed |
| [Kafka](./data-ai/kafka.md) | 交叉审校通过（正文） | 1 | reasoned / executed |
| [LangChain 技术栈深讲](./data-ai/langchain.md) | 交叉审校通过（正文） | 2 | reasoned / executed / syntax / unrun |
| [LangGraph](./data-ai/langgraph.md) | 交叉审校通过（正文） | 2 | reasoned / executed / syntax / unrun |
| [LLM / OpenAI API](./data-ai/llm-openai.md) | 交叉审校通过（正文） | 2 | reasoned / executed / syntax / unrun |
| [机器学习](./data-ai/machine-learning.md) | 交叉审校通过（正文） | 2 | reasoned / executed / syntax / unrun |
| [MongoDB 技术栈深讲](./data-ai/mongodb.md) | 交叉审校通过（正文） | 1 | reasoned / executed |
| [MySQL / SQL](./data-ai/mysql-sql.md) | 交叉审校通过（正文） | 1 | reasoned / executed |
| [Ollama 技术栈深讲](./data-ai/ollama.md) | 交叉审校通过（正文） | 2 | reasoned / executed / syntax / unrun |
| [Oracle Database 深讲](./data-ai/oracle.md) | 交叉审校通过（正文） | 1 | reasoned / executed |
| [pandas](./data-ai/pandas.md) | 交叉审校通过（正文） | 2 | reasoned / executed / syntax / unrun |
| [PostgreSQL 深讲](./data-ai/postgresql.md) | 交叉审校通过（正文） | 1 | reasoned / executed |
| [PyTorch 技术栈深讲](./data-ai/pytorch.md) | 交叉审校通过（正文） | 2 | reasoned / executed / syntax / unrun |
| [RabbitMQ 深讲](./data-ai/rabbitmq.md) | 交叉审校通过（正文） | 1 | reasoned / executed |
| [RAG](./data-ai/rag.md) | 交叉审校通过（正文） | 2 | reasoned / executed / syntax / unrun |
| [Redis](./data-ai/redis.md) | 交叉审校通过（正文） | 1 | reasoned / executed |
| [scikit-learn](./data-ai/scikit-learn.md) | 交叉审校通过（正文） | 2 | reasoned / executed / syntax / unrun |
| [Apache Spark 深讲](./data-ai/spark.md) | 交叉审校通过（正文） | 1 | reasoned / executed |
| [Tencent TCE 数据库、缓存、消息与数据平台技术地图](./data-ai/tce-data-middleware.md) | 交叉审校通过（正文） | 2 | reasoned / executed / syntax / unrun |
| [Tencent TDSQL-C MySQL 技术栈深讲](./data-ai/tdsql-mysql.md) | 交叉审校通过（正文） | 1 | reasoned / executed |
| [TensorFlow 深讲](./data-ai/tensorflow.md) | 交叉审校通过（正文） | 2 | reasoned / executed / syntax / unrun |
| [Transformer 技术栈深讲](./data-ai/transformer.md) | 交叉审校通过（正文） | 2 | reasoned / executed / syntax / unrun |
| [向量数据库](./data-ai/vector-database.md) | 交叉审校通过（正文） | 2 | reasoned / executed / syntax / unrun |
| [Apache ZooKeeper 深讲](./data-ai/zookeeper.md) | 交叉审校通过（正文） | 1 | reasoned / executed |
| [Git 深讲](./foundation/git.md) | 交叉审校通过（正文） | 1 | reasoned |
| [GitHub](./foundation/github.md) | 交叉审校通过（正文） | 2 | reasoned |
| [Go（Golang）深讲](./foundation/golang.md) | 交叉审校通过（正文） | 1 | reasoned |
| [Java 技术栈深讲](./foundation/java.md) | 交叉审校通过（正文） | 1 | reasoned |
| [Linux 深讲](./foundation/linux.md) | 交叉审校通过（正文） | 2 | reasoned |
| [Markdown](./foundation/markdown.md) | 交叉审校通过（正文） | 2 | reasoned |
| [网络基础](./foundation/networking.md) | 交叉审校通过（正文） | 1 | reasoned |
| [Python](./foundation/python.md) | 交叉审校通过（正文） | 1 | reasoned |
| [RESTful API 技术栈深讲](./foundation/restful-api.md) | 交叉审校通过（正文） | 1 | reasoned |
| [Shell / PowerShell](./foundation/shell-powershell.md) | 交叉审校通过（正文） | 1 | reasoned |
| [systemd](./foundation/systemd.md) | 交叉审校通过（正文） | 2 | reasoned |
| [VitePress](./foundation/vitepress.md) | 交叉审校通过（正文） | 2 | reasoned |
| [Ajax 技术栈深讲](./frontend/ajax.md) | 交叉审校通过（正文） | 1 | reasoned |
| [CSS 技术栈深讲](./frontend/css.md) | 交叉审校通过（正文） | 1 | reasoned |
| [HTML 技术栈深讲](./frontend/html.md) | 交叉审校通过（正文） | 1 | reasoned |
| [JavaScript 技术栈深讲](./frontend/javascript.md) | 交叉审校通过（正文） | 2 | reasoned |
| [React 技术栈深讲](./frontend/react.md) | 交叉审校通过（正文） | 1 | reasoned / executed |
| [TypeScript 技术栈深讲](./frontend/typescript.md) | 交叉审校通过（正文） | 1 | reasoned / executed |
| [Vue 技术栈深讲](./frontend/vue.md) | 交叉审校通过（正文） | 1 | reasoned / executed |
| [Apache Tomcat 技术栈深讲](./middleware-application-platform/tomcat.md) | 交叉审校通过（正文） | 2 | reasoned / syntax / executed |
| [IBM WebSphere 技术栈深讲](./middleware-application-platform/websphere.md) | 交叉审校通过（正文） | 2 | reasoned / syntax / executed |
| [Alertmanager](./observability/alertmanager.md) | 交叉审校通过（正文） | 3 | reasoned / executed / syntax / unrun |
| [Elasticsearch](./observability/elasticsearch.md) | 交叉审校通过（正文） | 2 | reasoned / executed / syntax / unrun |
| [Grafana 精讲](./observability/grafana.md) | 交叉审校通过（正文） | 3 | reasoned / executed / syntax / unrun |
| [Grafana Loki](./observability/loki.md) | 交叉审校通过（正文） | 2 | reasoned / executed / syntax / unrun |
| [OpenTelemetry](./observability/opentelemetry.md) | 交叉审校通过（正文） | 2 | reasoned / executed / syntax / unrun |
| [Prometheus 精讲](./observability/prometheus.md) | 交叉审校通过（正文） | 2 | reasoned / executed / syntax / unrun |
| [VictoriaMetrics](./observability/victoriametrics.md) | 交叉审校通过（正文） | 2 | reasoned / executed / syntax / unrun |
| [Zabbix 深讲](./observability/zabbix.md) | 交叉审校通过（正文） | 2 | reasoned / executed / syntax / unrun |
| [JumpServer 技术栈深讲](./security-compliance/jumpserver.md) | 交叉审校通过（正文） | 1 | reasoned |
| [网络安全等级保护（等保 2.0）深讲](./security-compliance/mlps.md) | 交叉审校通过（正文） | 1 | reasoned / executed |
| [AIOps 闭环](./sre-aiops/aiops-loop.md) | 交叉审校通过（正文） | 1 | reasoned / executed |
| [告警治理](./sre-aiops/alert-governance.md) | 交叉审校通过（正文） | 1 | reasoned / executed |
| [变更管理](./sre-aiops/change-management.md) | 交叉审校通过（正文） | 1 | reasoned / executed |
| [事件响应](./sre-aiops/incident-response.md) | 交叉审校通过（正文） | 1 | reasoned / executed |
| [RCA 根因分析](./sre-aiops/rca.md) | 交叉审校通过（正文） | 1 | reasoned / executed |
| [Runbook](./sre-aiops/runbook.md) | 交叉审校通过（正文） | 1 | reasoned / executed |
| [SLI / SLO / SLA](./sre-aiops/sli-slo-sla.md) | 交叉审校通过（正文） | 1 | reasoned / executed |
| [爱数 AnyStorage 深讲](./storage-data-protection/aishu-anystorage.md) | 交叉审校通过（正文） | 1 | reasoned / executed |
| [Brocade 6510 光纤交换机深讲](./storage-data-protection/brocade-6510.md) | 交叉审校通过（正文） | 1 | reasoned / executed |
| [Ceph 深讲](./storage-data-protection/ceph.md) | 交叉审校通过（正文） | 1 | reasoned / executed |
| [Dell EMC VMAX 深讲](./storage-data-protection/dell-emc-vmax.md) | 交叉审校通过（正文） | 1 | reasoned / executed |
| [Dell EMC VPLEX 深讲](./storage-data-protection/dell-emc-vplex.md) | 交叉审校通过（正文） | 1 | reasoned / executed |
| [FastDFS 深讲](./storage-data-protection/fastdfs.md) | 交叉审校通过（正文） | 1 | reasoned / executed |
| [华为 OceanStor 深讲](./storage-data-protection/huawei-oceanstor.md) | 交叉审校通过（正文） | 1 | reasoned / executed |
| [IBM Storage 深讲](./storage-data-protection/ibm-storage.md) | 交叉审校通过（正文） | 1 | reasoned / executed |
| [Tencent TCE 存储与数据保护技术栈深讲](./storage-data-protection/tce-storage.md) | 交叉审校通过（正文） | 1 | reasoned / executed |
| [华为 FusionSphere / FusionCompute 技术栈深讲](./virtualization-private-cloud/fusionsphere.md) | 交叉审校通过（正文） | 1 | reasoned / executed |
| [KVM 虚拟化深讲](./virtualization-private-cloud/kvm.md) | 交叉审校通过（正文） | 1 | reasoned |
| [OpenStack 深讲](./virtualization-private-cloud/openstack.md) | 交叉审校通过（正文） | 1 | reasoned / executed |
| [Tencent TCE IaaS 技术栈深讲](./virtualization-private-cloud/tce-iaas.md) | 交叉审校通过（正文） | 1 | reasoned / executed |
| [Tencent TCE 运营、运维与安全技术栈深讲](./virtualization-private-cloud/tce-operations-security.md) | 交叉审校通过（正文） | 1 | reasoned / executed |
| [腾讯专有云 TCE 全栈技术地图](./virtualization-private-cloud/tencent-tce.md) | 交叉审校通过（正文） | 1 | reasoned / executed |
| [VMware vSphere 深讲](./virtualization-private-cloud/vsphere.md) | 交叉审校通过（正文） | 1 | reasoned / executed |

## 逐篇证据

### 系统架构与技术方案设计深讲

[打开课程](./architecture-delivery/architecture-solution-design.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：官方知识地图只有课程重组而缺原框架索引；泛用课程遗留特定岗位指代。
- 修订：补AWS六支柱中文旁注和C4四层/支持图界线，移除不明岗位来源断言，保留充分既有实验与通关。

**八项正文证据**

- 前置与路线：作者复评通过。开篇分层阅读与开课准备区分纸笔/Node和进阶平台前提。
- 机制与状态：作者复评通过。请求数据路径、状态与一致性解释数据库提交/响应、队列事务和幂等边界。
- 基础实验：作者复评通过。基础实验精确命令和方案文件模板包含预期、核验、失败与清理；标题脚本不承诺语义正确。
- 故障实验：作者复评通过。故障模拟包含依赖失效、容量与恢复关键路径，明确修复/验证/回退边界。
- 生产取舍：作者复评通过。容量安全余量、故障域、权限、密钥恢复、演进兼容和成本给出选项与拒绝条件。
- 递进面试：作者复评通过。30秒/3分钟与设计追问覆盖ADR、RTO/RPO、可用性和被否决方案。
- 独立通关：作者复评通过。既有五关容量/单区失效/业务结果/恢复约束仍足；新增官方地图要求按问题选视角。
- AIOps 与证据：作者复评通过。AIOps从观测/告警/自动化到受控反馈，学习证据保存决策、算例与合成边界。

**验证边界**

- reasoned：2026-11-11逐段阅读全文，八维复评，保留已充分的机制、双实验、生产设计和递进面试层；补AWS六支柱中文旁注和C4四层/支持图界线，移除不明岗位来源断言，保留充分既有实验与通关。；限制：不保证阅读后完全掌握或获得录用；未运行真实生产服务与外部变更。
- executed：执行architecture正常/故障，核对官方AWS与C4地图，全文复算容量及恢复关键路径。；限制：本地合成模型、纸面推理或说明中列出的脚本执行，不证明网络、持久性、真实平台或生产验收。

第二位审校者：refresh-foundation-platform；日期：2026-11-11。

- 审阅范围：完整本轮diff、双实验及独立通关的必要正文/代码上下文；不是本轮全文重复审读。
- C4容器并非Docker、动态/部署图不冒充额外抽象层；AWS六支柱有相邻中文释义。900/180需五健康、坏一实例需六，均匀三区坏一区需每区三共九。
- 实跑architecture正常/故障容量算式；核对备份/密钥故障纸面模拟与标题预检局限，未作真实压测或灾备。
- 独立执行 tmp/check-root-refresh-2026-11-11.mjs：40项检查、11段PowerShell语法与7项事故断言全部通过；证据为本地合成验证，不能代替生产验收。

### IT 项目管理 / PMP 深讲

[打开课程](./architecture-delivery/it-project-management-pmp.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：产品到运营写成串行阶段；故障实验恢复复制不停止；需验证双关键路径而非拼关键活动。
- 修订：修正生命周期并行；复制Stop；增加双分支关键路径与哈希和算法不同证据的批改。

**八项正文证据**

- 前置与路线：作者复评通过。实验前置给Windows终端、路径、文件保存与范围，不要求Jira或认证。
- 机制与状态：作者复评通过。范围到验收、网络正反计算、资源约束与EVM分别解释机制和假设。
- 基础实验：作者复评通过。完整CSV/关键路径PowerShell/挣值输入，有14天/浮动/成本预期、失败与清理。
- 故障实验：作者复评通过。关键活动延时+安全范围变更有基线哈希、17天输出、评审、恢复和不抹真实历史边界。
- 生产取舍：作者复评通过。状态一致性、运营连续性、容量/权限/版本回退纳入治理而非口头完成。
- 递进面试：作者复评通过。10组指导与连续追问区分事实、权限、假设、工期和业务价值。
- 独立通关：作者复评通过。B=C=4为两路径14天，关键活动列表不能拼成串行；一分支压缩不保证完工提前。
- AIOps 与证据：作者复评通过。告警、模型、知识库、安全自动化连接可验收项目范围；GitHub归档不虚构履历。

**验证边界**

- reasoned：2026-11-11逐段阅读全文，八维复评，保留已充分的机制、双实验、生产设计和递进面试层；修正生命周期并行；复制Stop；增加双分支关键路径与哈希和算法不同证据的批改。；限制：不保证阅读后完全掌握或获得录用；未运行真实生产服务与外部变更。
- executed：PowerShell7实际从正文抽CSV/算法保存读取，正常14、延期17、B6为16、双分支14及非法工期/依赖拒绝六组；PS围栏解析。；限制：本地合成模型、纸面推理或说明中列出的脚本执行，不证明网络、持久性、真实平台或生产验收。

第二位审校者：refresh-foundation-platform；日期：2026-11-11。

- 审阅范围：完整本轮diff、双实验及独立通关的必要正文/代码上下文；不是本轮全文重复审读。
- Copy-Item失败停止避免错误宣称恢复；B=C=4为两条并行关键路径，不能把零浮动列表串为单路径；资源冲突17天与网络14天有区别。
- 实跑提取的关键路径脚本：14/17/14/16天及零/未知前置拒绝；复算EVM与恢复哈希判据，解析PowerShell语法，不访问真实项目。
- 独立执行 tmp/check-root-refresh-2026-11-11.mjs：40项检查、11段PowerShell语法与7项事故断言全部通过；证据为本地合成验证，不能代替生产验收。

### Ansible

[打开课程](./automation/ansible.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：诊断样例将任意service_name拼进command参数；无条件忽略错误后打印含原始日志的完整证据，容易泄露并误判成功。
- 修订：补服务名格式断言、argv逐参数传递、关闭无用facts，原始输出no_log且仅打印退出码，最终assert阻断采集未知。
- 修订：增加参数附加选项反例、无Shell不等于参数安全、no_log不等于自动脱敏及本地授权查证路径。

**八项正文证据**

- 前置与路线：作者复评通过。Ubuntu/WSL控制端安装、目录/ANSIBLE_CONFIG/本地inventory和Python，区分SSH/systemd远端前提。
- 机制与状态：作者复评通过。inventory/变量/facts/模块/handler/check及serial、delegate、async、rescue讲解，零changed不等幂等。
- 基础实验：作者复评通过。本地file/template完整项目、首次/二次/check验收和阈值assert/slurp，明确无真实重启。
- 故障实验：作者复评通过。两别名独立文件的serial局部失败及只恢复lab_b，说明批任务不是事务；采集失败不再只显示绿色recap。
- 生产取舍：作者复评通过。批次/权限/Vault/控制面与执行状态、部分成功恢复、事实新鲜度和幂等边界。
- 递进面试：作者复评通过。定义到执行路径、check局限、handler/rescue/async、并发和故障追问有答案与反例。
- 独立通关：作者复评通过。独立通关以重建/变量预测/故障证据/设计/口述五项判据要求返工；新增单元名反例。
- AIOps 与证据：作者复评通过。runbook证据采集只读且保留未知、日志隐私边界，业务健康需额外验收。

**验证边界**

- reasoned：本轮全文阅读；Ansible官方command文档核对argv和非Shell参数行为。；限制：未安装/执行Ansible、SSH或systemd任务；新YAML仅人工静态检查，不声称远端通过。

第二位审校者：data-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮全部差异、相关机制上下文、基础/故障实验与独立通关；不是再次全文重审。
- 复核采集command argv和service_name格式门禁，no_log不等脱敏、仅打印rc；采集0/3与日志0是完整性而非业务健康，未知不能授权修复。
- 复核本机模板两次幂等、双别名部分失败/只修lab_b/最终收敛、容量分批与额外变量反例；本次为静态语义/安全复核，未执行Ansible或连接远端。

### CI/CD

[打开课程](./automation/cicd.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：本地交付模拟校验后再次读取文件，存在校验对象和实际使用字节不一致的教学隐患；蓝绿图中文注释不相邻。
- 初评：交叉审校发现历史完整源码执行记录可被误读为当前deployment_bytes版本。
- 修订：校验与JSON解析使用同一deployment_bytes，补检查使用时间差与批准摘要可信度的不同边界；蓝绿图就地中文解释。
- 修订：区分2026-10-12当日源码与11-11独立交叉Python3.12.14新三模式和读取后替换反例。

**八项正文证据**

- 前置与路线：作者复评通过。个人Fork/空仓库与Node项目区分，本地Python安装/空目录、两种Shell退出码。
- 机制与状态：作者复评通过。CI/持续交付/部署、制品身份、状态机和审批绑定，检查字节与可信批准分层。
- 基础实验：作者复评通过。delivery_lab完整Python源码normal模式、版本/输出/退出0、自动临时目录清理。
- 故障实验：作者复评通过。tamper拦截退出2、bad-release业务失败恢复v1退出3，另有个人PR exit42与纸面审批漂移。
- 生产取舍：作者复评通过。灰度样本/观测未知、数据库扩展收缩、同环境锁/幂等、执行器隔离与控制面灾备。
- 递进面试：作者复评通过。30秒/3分钟与绿色仍事故、超时重试、千万用户发布等追问有证据回答路径。
- 独立通关：作者复评通过。五项独立通关含审批漂移、灰度样本、DORA分母与失败证据，要求返工。
- AIOps 与证据：作者复评通过。发布事件提交/制品/环境关联错误率延迟，时间相关不能代替因果；模型无直接授权。

**验证边界**

- reasoned：本轮全文阅读，当前package.json确认docs:build是build别名。；限制：未触发GitHub CI或实际部署。
- executed：tmp/cloud-delivery-fourth-checks-2026-11-11.mjs提取本文完整Python，Python3.15本地三模式得到0/v2、2/v1、3/v1。；限制：仅内存与临时文件交付模拟，不是真实制品审批服务。
- executed：当前三模式与post-read替换由独立data审校实际执行；作者不冒认独立审校是自身实跑。；限制：本轮返工仅限明确列出的本地合成、静态和来源检查，不替代实际产品或生产验收。

第二位审校者：data-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮全部差异、相关机制上下文、基础/故障实验与独立通关；不是再次全文重审。
- 复核同一deployment_bytes校验及使用的时间差修复，摘要相等不代表批准来源可信；发现旧日期把当前源码称已执行，作者已分开2026-10-12历史与2026-11-11真实交叉实跑范围，返工后复评通过。
- 独立Python3.12.14执行normal0/v2、tamper2/v1、bad-release3/v1和读字节后替换磁盘的反例，仍只使用获验内存字节；PR故障与制品/门禁/灰度通关静态复核，未运行真实CI或部署。

### GitHub Actions

[打开课程](./automation/github-actions.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：两处元数据示例将分支引用直接拼入Shell，与后文不可信输入要求矛盾；cat命令替换吞末尾换行，完整文件契约可被多空行绕过。
- 修订：分支引用通过env再printf输出；跨Job验证改整文件cmp，补与exit42不同的坏内容变式和教师纠错。

**八项正文证据**

- 前置与路线：作者复评通过。个人空白仓库网页创建、不需要Node的元数据主线、默认分支/权限/额度；npm另需Fork完整项目。
- 机制与状态：作者复评通过。事件/工作流/任务/执行器/步骤、表达式与Shell两层、output与artifact/cache生命周期。
- 基础实验：作者复评通过。artifact-classroom完整YAML，上游生成/传输出/上传，下游先证明无文件再下载比较，保留一天与清理。
- 故障实验：作者复评通过。布尔输入exit42失败仍上传证据、恢复第三次运行；新增坏换行比较失败与无下载反例。
- 生产取舍：作者复评通过。OIDC权限/runner信任域/审批/合并队列/并发等待槽/模板升级与取消副作用分层。
- 递进面试：作者复评通过。3分钟链路与绿色页面旧、PR合并SHA、模板/runtime兼容等追问答案。
- 独立通关：作者复评通过。五项独立通关含准确run/headSHA、27.8并发容量估算与未验证范围，缺证据返工。
- AIOps 与证据：作者复评通过。手动诊断报告只记录元数据不冒充真实巡检；工作流失败分类进入受控自动化。

**验证边界**

- reasoned：本轮全文阅读，安全表达式与参数传递、整文件契约人工检查；复用首批cmp字节合同测试原理。；限制：本批未实际触发Actions、权限修改、Pages发布；未重新验证既有时区/额外队列新产品行为。

第二位审校者：root-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮全部差异及所列必要机制/实验/通关上下文，不声称再次全文重审；结合作者全文八维复评。
- 完整本轮差异、表达式/跨Job生命周期、artifact双实验、生产/面试与通关上下文复核。环境变量避免直接插入Shell，完整cmp拒绝额外换行；文件与声明一致不是独立可信来源。
- 独立执行正文cmp行的相等/额外换行/不同字节3例，GitHub官方secure-use支持中间env路线；没有触发远端工作流或修改权限。
- 本组当前84个PowerShell块独立AST通过；语法或合成测试不替代产品、业务或生产验收。

### GitLab 与 GitLab CI/CD 深讲

[打开课程](./automation/gitlab.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：validate-rule使用grep -qx只要求存在一条完整匹配行，额外threshold=999仍可通过，与单行精确字节合同不符。
- 修订：门禁改为printf生成唯一允许字节后交cmp比较整文件，解释标准输入/静默/退出码。
- 修订：新增正确行加错误行的条件变化、预期失败、恢复与错因反馈，限定只用于本课堂格式。

**八项正文证据**

- 前置与路线：作者复评通过。安装与启动、双层带练先准备什么：个人网页项目/README、可用 Linux 执行器、权限/额度与终端/文件格式明确。
- 机制与状态：作者复评通过。平台工程精讲、控制面补课：规则创建/依赖数据、Executor、领取并发、人工/子状态传播与外部未知。
- 基础实验：作者复评通过。双层带练：单行LF输入、三阶段YAML、制品下载SHA和摘要验证；完整字节合同替换仅一行匹配。
- 故障实验：作者复评通过。threshold=50失败、正确行追加threshold=999失败、下游篡改失败分开；恢复文件/提交、保留原始产物与清理边界。
- 生产取舍：作者复评通过。生产课堂、大厂设计追问：信任域/资源/HA、对象存储/密钥恢复、模板升级、过期发布/互斥和保留策略。
- 递进面试：作者复评通过。面试课堂与控制面补课：30 秒/3 分钟及 Runner/needs/重试/架构/覆盖事故的递进答案。
- 独立通关：作者复评通过。独立通关及新增重复配置题要求预测、失败阶段、整文件合同和不同应用重复值语义，不以grep搜到值判正确。
- AIOps 与证据：作者复评通过。在 AIOps 中的作用与生产课堂：失败阶段/队列/制品/提交/环境关联，采集/父触发不冒充目标恢复。

**验证边界**

- reasoned：全文阅读GitLab触发、Runner、制品、环境、信任、容量、状态传播、双层实验和通关，核对官方after_script/allow_failure说明。；限制：未登录GitLab或运行真实Runner，未验证实例许可证、标签调度和生产部署。
- executed：Git Bash验证cmp正常单行退出0，错误值/重复配置/额外空行/CRLF均退出1；旧grep对重复配置退出0，实际复现门禁漏洞。；限制：本地Shell语义验证，未运行Alpine镜像和GitLab流水线；BOM依据字节合同推理而非本轮单独实跑。

第二位审校者：root-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮差异、相关机制及实验/通关上下文，不声称再次全文重审；结合既有评测与本轮作者全文复评。
- cmp校验整份单行LF文件，grep存在正确行不等于完整配置正确；制品SHA与运行SHA验证、失败/恢复实验有明确层次。
- 独立复跑5字节输入及旧grep反例：正确、错值、重复、空行、CRLF；未运行真实Runner。

### Jenkins 技术栈深讲

[打开课程](./automation/jenkins.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：日志跟随没有退出指引；Queue API假设凭据环境变量已设置，无获取Token入口、超时和清理，空输出易被当空队列。
- 初评：交叉审校发现HTTP200但缺items或null/数组根时会被错解队列空。
- 修订：解释Ctrl+C退出日志不停止容器；补个人Token入口、Get-Credential临时输入/空值检查/HTTP错误门禁/超时/finally释放引用和撤销。
- 修订：教师反例区分401/403与可见队列为空、Base64非加密、清变量非内存擦除。
- 修订：先验HTTP200和原始单对象，items必须数组且成员必须对象；不以权限相关字段缺失补零。

**八项正文证据**

- 前置与路线：作者复评通过。Linux Engine/context/容器卷端口防复用、固定历史Core/插件兼容，UI解锁与API Token准备。
- 机制与状态：作者复评通过。Controller/Agent/Executor/Queue与CPS/durability/状态路径，timeout分配顺序。
- 基础实验：作者复评通过。固定容器、完整Pipeline、两阶段输出/下载摘要/版本插件证据与专用卷清理。
- 故障实验：作者复评通过。不存在Label排队why证据、取消旧定义/新Build恢复；JUnit UNSTABLE与skipStagesAfterUnstable。
- 生产取舍：作者复评通过。单写状态与Controller隔离、按信任域容量、匹配Core/Java/Plugin/状态备份及恢复副作用。
- 递进面试：作者复评通过。8组机制/故障/设计答案与递进，300仓库设计题、500任务升级事故。
- 独立通关：作者复评通过。五项通关含资源上限4、不同Job锁边界与恢复未授权重跑，缺证据重做。
- AIOps 与证据：作者复评通过。Queue/Controller/Agent/Build指标与变更事件、根因候选和受控Runbook。

**验证边界**

- reasoned：本轮全文阅读保留完整已有平台深度，审查新增API流程与输入/输出边界。；限制：未启动Jenkins或生成Token、运行Pipeline；旧历史版本不是当前安全推荐。
- syntax：Jenkins与Runbook共11个PowerShell块AST解析通过。；限制：语法不证明HTTP接口、凭据或插件兼容。
- executed：tmp/cloud-cross-rework-checks-2026-11-11.mjs 原文块7合成响应通过，凭据/API皆替身，不接触真实Jenkins。；限制：本轮返工仅限明确列出的本地合成、静态和来源检查，不替代实际产品或生产验收。

第二位审校者：root-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮全部差异及所列必要机制/实验/通关上下文，不声称再次全文重审；结合作者全文八维复评。
- 本轮差异、Pipeline/Queue基础与Label故障、CPS状态/生产取舍及通关复核；提出HTTP200坏形状仍空输出问题，作者返工成原文顶层、items数组与对象条目门禁后重读通过。
- 独立复跑Jenkins7合成响应：正常空/单条通过，缺items/null/顶层数组/数字条目/对象代替数组拒绝；凭据为虚构夹具，无HTTP/Jenkins/插件实跑。
- 本组当前84个PowerShell块独立AST通过；语法或合成测试不替代产品、业务或生产验收。

### Apache Maven 技术栈深讲

[打开课程](./automation/maven.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：下载摘要只要求人工核对无可执行校验，镜像故障目录可复用旧缓存，清理路径缺工作目录与链接边界。
- 修订：补SHA512整值比较、来源身份与签名区别，摘要坏格式拒绝；故障目录防复用；清理验证课程根路径、非重解析点并逐项确认。

**八项正文证据**

- 前置与路线：作者复评通过。JDK/Maven/Wrapper选择、Windows安装目录与PATH及版本前提，新增下载验证。
- 机制与状态：作者复评通过。生命周期/阶段/插件目标/依赖调解/BOM/仓库/快照与构建身份层次。
- 基础实验：作者复评通过。hello-maven完整源码测试POM、命令结果、Wrapper及制品取证。
- 故障实验：作者复评通过。单元测试失败与冷缓存错误mirror故障、同配置恢复及受限清理。
- 生产取舍：作者复评通过。多模块构建容量、私服/供应链/权限/离线依赖/版本迁移和回滚。
- 递进面试：作者复评通过。机制/取舍/事故/300仓库设计题有回答和追问。
- 独立通关：作者复评通过。独立通关与摘要伪造反例明确完整性不等可信发布。
- AIOps 与证据：作者复评通过。构建日志、测试报告、制品身份和发布变更进入运维证据链。

**验证边界**

- reasoned：全文阅读；Apache官方校验文档核对摘要与签名信任边界。；限制：未下载Maven发行包或编译项目；历史版本不当最新安全版本。
- syntax：本批Maven/n8n/microservices/Kubeflow共73个PowerShell块AST通过；git diff --check通过。；限制：只语法与格式，未模拟网络/产品运行；Kubernetes Bash人工静态检查。

第二位审校者：root-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮全部差异及所列必要机制/实验/通关上下文，不声称再次全文重审；结合作者全文八维复评。
- 本轮完整差异、摘要/安装、故障缓存/恢复/精确清理与生产通关上下文复核；摘要完整性与可信公钥签名不同，冷缓存/模型建立/完整测试分层，历史版本非安全推荐。
- 独立执行正文SHA512门禁的匹配/不匹配/错误网页/多摘要4例，均符合预期；Apache官方验证文档核对信任边界。未下载安装Maven或编译项目。
- 本组当前84个PowerShell块独立AST通过；语法或合成测试不替代产品、业务或生产验收。

### n8n 技术栈深讲

[打开课程](./automation/n8n.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：契约故障练习只要求增加校验，未给小白可填写表达式/节点连线/响应设置；HTTP拒绝与工作流失败易混。
- 修订：提供If原始类型/非空/枚举短路表达式，合法规范化与非法400分支完整UI步骤，说明有意拒绝不等ErrorWorkflow。

**八项正文证据**

- 前置与路线：作者复评通过。本机容器/卷/密钥/界面登录与历史版本边界，Webhook测试生产URL分开。
- 机制与状态：作者复评通过。节点/items/execution/webhook/凭据/队列及幂等与副作用。
- 基础实验：作者复评通过。告警输入、Normalize/If/响应完整界面与请求正例和清理。
- 故障实验：作者复评通过。StopAndError错误工作流及新增契约400反例，连接错误不混拒绝。
- 生产取舍：作者复评通过。多worker/SQL/Redis/共享加密键/任务恢复/SSRF/Token等生产边界。
- 递进面试：作者复评通过。定义/内部执行/队列重复/设计/事故题与追问。
- 独立通关：作者复评通过。独立通关要求正反例、业务状态与外部副作用证据；类型先于字符串化。
- AIOps 与证据：作者复评通过。告警富化/受控流程/人工批准，不把流程成功当业务恢复。

**验证边界**

- executed：新增表达式6个JS合成样本通过，含数组、空白、缺body、大小写；官方Respond to Webhook核对流程。；限制：没有启动n8n或操作真实UI/工作流；表达式测试不证明界面版本字段。
- syntax：本批Maven/n8n/microservices/Kubeflow共73个PowerShell块AST通过；git diff --check通过。；限制：只语法与格式，未模拟网络/产品运行；Kubernetes Bash人工静态检查。

第二位审校者：root-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮全部差异及所列必要机制/实验/通关上下文，不声称再次全文重审；结合作者全文八维复评。
- 本轮完整差异及item linking/契约副本/未知状态/通关上下文复核。校验发生在String转换前，400有意拒绝可以Execution success，不与StopAndError混淆；原始输入不授批准权。
- 独立复跑正文JS表达式6个正常/大小写空白/数组/缺字段样本；核对官方Respond-to-Webhook配置与响应行为。未操作UI、发布工作流或执行Webhook。
- 本组当前84个PowerShell块独立AST通过；语法或合成测试不替代产品、业务或生产验收。

### Nexus Repository 深讲

[打开课程](./automation/nexus-repository.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：Maven mirror片段没明确settings.xml层级，易误贴到pom。
- 初评：基础Hash比对只验证当前两份文件相同，缺先前批准摘要的独立信任反例。
- 修订：注明settings/mirrors片段及认证ID对应，链接完整Maven项目。
- 修订：增加受信release-record与源/下载同时错误仍彼此相等的反例，仅操作两份新副本，不改服务器。

**八项正文证据**

- 前置与路线：作者复评通过。安装与启动、入门实验：Docker/PowerShell/context/资源/摘要/独占数据、Raw角色/用户/文件前置。
- 机制与状态：作者复评通过。坐标→组→具体仓库→元数据/blob→客户端下载链；镜像设置层级与ID匹配明确，摘要一致不等于来源可信。
- 基础实验：作者复评通过。入门实验：上传并下载Raw制品：完整凭据处理、HTTP限时/错误停止、独立下载摘要断言及限定清理。
- 故障实验：作者复评通过。双层实验：不存在版本与本地副本改字节，状态/路径/Hash对照、重新下载与独立版本恢复。
- 生产取舍：作者复评通过。生产设计题、仓库管理员课堂：保留/候选/回收、吞吐/资源、受支持HA、数据库/blob/配置密钥匹配和升级。
- 递进面试：作者复评通过。面试课堂与协议进阶：30秒/3分钟及group写入、404、覆盖、备份/清理的递进回答。
- 独立通关：作者复评通过。五项独立通关外新增当前两份文件同时错误的反例；必须匹配故障前批准摘要，不能改摘要迁就错误文件。
- AIOps 与证据：作者复评通过。在AIOps中的作用、事故课堂：状态/回源/磁盘/流水线/版本关联与脱敏，不因下载失败自动清缓存/删除。

**验证边界**

- reasoned：本轮逐段全文阅读所有章节，保留已有原理、实验、生产与递进追问；补具体失败、安全、兼容或证据反例。；限制：无真实etcd/Calico/Cilium/Nexus/SonarQube实例运行，未执行数据库/网络/快照变更；保留历史版本边界。
- syntax：etcd/Nexus/SonarQube共29个PowerShell代码块通过AST语法解析。；限制：不证明容器、HTTP、凭据、快照和真实数据库结果；SonarQube新就绪分支本轮仅静态验证。
- reasoned：Maven官方settings参考核对mirrors层级与server标识。；限制：未执行Maven或制品上传下载。

第二位审校者：data-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮全部差异、相关机制上下文、基础/故障实验与独立通关；不是再次全文重审。
- 复核Raw受限账号上传/独立下载及先留批准摘要；两份相同错误文件不能证明原批准内容，mirror配置片段与Maven项目/发布ID分清。
- 复核404/401、下载副本篡改/恢复、精确仓库与账户清理、group来源与权限并集及带宽算术；PowerShell语法通过，未启动Nexus/上传/真实权限或摘要故障。

### Runbook Automation

[打开课程](./automation/runbook-automation.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：推荐器原样导出完整alert可能泄露额外token，未知告警名直接写Markdown可伪造链接；du管道丢弃stderr导致部分扫描假完整。
- 初评：交叉审校发现旧完整推荐器记录未注明当日版本。
- 修订：报告只输出已验证允许字段，未知名称不直接渲染，新增虚构token/链接注入反例及L2字段不等于执行授权。
- 修订：du只读示例加30秒边界、保留stderr和退出码、区分失败与完整排序。
- 修订：区分历史完整推荐器用例与本轮selector5，不追溯冒认新源码完整执行。

**八项正文证据**

- 前置与路线：作者复评通过。Python安装路径、个人空目录/alerts/runbooks/reports/精确文件，额外平台命令与Windows本地分开。
- 机制与状态：作者复评通过。推荐/授权/执行/验证分层、幂等/锁/fencing/未知/补偿、控制回路延迟。
- 基础实验：作者复评通过。完整本地selector、两事件/手册映射、UUID不覆盖、退出/报告/手册存在验收与清理。
- 故障实验：作者复评通过。未知/数组/目录外/缺手册拒绝及恢复；新报告边界输入不导出伪秘密和未知链接。
- 生产取舍：作者复评通过。迟到重复事件、目标授权复检、互斥资源/隔离代次、批次错误阈值与停止派发、审计脱敏。
- 递进面试：作者复评通过。定义/机制/事故/设计递进及合法事件全网重启反例、模型无授权、未知先对账。
- 独立通关：作者复评通过。五项独立通关含双报告、入口各退出码、旧指标/三并发最坏影响，失败返工。
- AIOps 与证据：作者复评通过。Detect→Diagnose→Decide→Act→Verify→Learn链路，推荐质量/误执行/恢复分别度量。

**验证边界**

- reasoned：本轮全文阅读、限定推荐器而非生产执行器。；限制：未运行云/Ansible/Actions或真实磁盘扫描。
- executed：本轮脚本提取Python3.15临时夹具：正常0、额外伪秘密0且未导出、未知链接1且未渲染、数组2和缺service2，5项通过；夹具自动回收。；限制：只本地合成输入；不证明路径并发安全、实际主机状态或授权。
- syntax：Jenkins与Runbook共11个PowerShell块AST解析通过。；限制：不证明平台运行。
- executed：本轮作者与root独立选择器5案例通过；无云/远程Actions/主机变更。；限制：本轮返工仅限明确列出的本地合成、静态和来源检查，不替代实际产品或生产验收。

第二位审校者：root-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮全部差异及所列必要机制/实验/通关上下文，不声称再次全文重审；结合作者全文八维复评。
- 本轮完整差异及完整本地选择器/故障、状态与控制回路/面试通关上下文复核。白名单输出不渲染未知Markdown、不导出原始token，du失败不能假完整；提出历史实跑不应追指新源码并已修订。
- 独立执行当前Python选择器5例：正常/额外虚构token退出0、未知链接1、数组/缺service2，新增报告数与无秘密/原始链接均校验；未执行主机扫描或生产动作。
- 本组当前84个PowerShell块独立AST通过；语法或合成测试不替代产品、业务或生产验收。

### SonarQube 技术栈深讲

[打开课程](./automation/sonarqube.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：Compose POSTGRES_USER=sonar实际初始化超级用户，易被误当成最小权限业务账号。
- 初评：就绪函数吞掉所有错误直到五分钟，无法区分明确401/403与暂时启动失败。
- 修订：按PostgreSQL官方镜像说明讲清初始化超级用户、pg_isready边界及实验/生产差别。
- 修订：就绪函数遇401/403停止，临时错误有限重试并保留最后脱敏类别；补HTTP200非UP和授权不会等待自愈反例。

**八项正文证据**

- 前置与路线：作者复评通过。安装与启动、基础实验：Linux Engine/PowerShell/Compose/资源/名称卷端口、历史版本与Token/完整目录文件。
- 机制与状态：作者复评通过。核心原理、老师带你读懂一次门禁：Scanner上传、CE异步计算、DB事实/Search派生、Profile/Gate/New Code与taskId归属。
- 基础实验：作者复评通过。完整Compose/源码/属性/Scanner，Wait-LabSonarUp有限等待且401/403显式停止；UP、CE、Gate分离，原始任务与提交绑定。
- 故障实验：作者复评通过。故障注入实验：停止数据库：基线/单故障、接收和计算分层证据、DB轮询/UP/新任务恢复，不断言未证明报告入队。
- 生产取舍：作者复评通过。Web/CE/Search/DB容量和DCE/单实例、数据库/索引恢复与迁移回滚；明确实验PostgreSQL超级用户不能照搬生产。
- 递进面试：作者复评通过。面试题与递进追问、事故场景：Scanner/CE、两种Quality、搜索/DB、积压/HA/升级答案和进一步追问。
- 独立通关：作者复评通过。独立通关：收到报告、计算成功和门禁通过是三件事：五项专属任务、A/B任务归属、积压估算与失败返工判据。
- AIOps 与证据：作者复评通过。日志与可观测性、事故场景：CI提交/CE任务/DB/队列关联，门禁失败不冒充业务中断、未知等待不自动放行。

**验证边界**

- reasoned：本轮逐段全文阅读所有章节，保留已有原理、实验、生产与递进追问；补具体失败、安全、兼容或证据反例。；限制：无真实etcd/Calico/Cilium/Nexus/SonarQube实例运行，未执行数据库/网络/快照变更；保留历史版本边界。
- syntax：etcd/Nexus/SonarQube共29个PowerShell代码块通过AST语法解析。；限制：不证明容器、HTTP、凭据、快照和真实数据库结果；SonarQube新就绪分支本轮仅静态验证。
- reasoned：PostgreSQL官方镜像README确认POSTGRES_USER初始化超级用户。；限制：没有创建数据库或更改角色。

第二位审校者：data-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮全部差异、相关机制上下文、基础/故障实验与独立通关；不是再次全文重审。
- 复核PostgreSQL初始化超级用户风险及pg_isready非业务权限证明；扫描报告/CE/Gate分层、TaskID关联、DB停止与恢复闭环、Token撤销后清理。
- 独立合成运行Wait-LabSonarUp：STARTING和503第三次转UP，401/403第一次停止；全部PowerShell语法通过，未执行真实HTTP/数据库/扫描器。

### Terraform

[打开课程](./automation/terraform.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：大规模删除排障把terraform init列为检查backend，易把初始化/迁移误当只读查看。
- 初评：诊断脚本普通plan不区分无差异/有差异；远程backend通常有锁及锁故障表简化过度。
- 修订：backend改为只读核对配置与CI来源，身份未知不初始化/重配；锁先核对活跃任务和后端支持。
- 修订：诊断接detailed-exitcode分支并保留退出码，明确不自动apply、前阶段失败不能当plan差异及输出敏感边界。

**八项正文证据**

- 前置与路线：作者复评通过。HCL基础边界、AIOps入门实验：官方安装/真实tf文件/PowerShell/独占目录/TF环境名和registry依赖。
- 机制与状态：作者复评通过。三本账、进阶精讲与配置契约课堂：求值/unknown/依赖图、API/state、地址/锁/输入与权限边界。
- 基础实验：作者复评通过。AIOps入门实验：四个完整tf文件、锁文件/计划/真实内容/state/output与第二次退出0检查。
- 故障实验：作者复评通过。将本地文件实验补成可验收的故障课堂：内容漂移、repair计划审阅、实际文件和无差异恢复、限定销毁。
- 生产取舍：作者复评通过。生产设计课堂、状态锁/工作区与事故答辩：故障/权限state边界、限流容量/模块升级、部分失败/未知和数据恢复。
- 递进面试：作者复评通过。生产设计课堂和事故答辩：30秒/3分钟、锁/地址/半失败/数据库/超时的答案与反例追问。
- 独立通关：作者复评通过。独立通关：三本账一致，不代表执行可以无限重试：五项专属任务、moved/空集合变式、三态退出/锁与返工位置。
- AIOps 与证据：作者复评通过。诊断脚本接plan三态0/1/2并明确无自动执行授权，脚本阶段失败不可混淆；plan原文受控，未初始化/未知仓库不扫描。

**验证边界**

- reasoned：本轮逐段全文审阅；保留已有请求/状态/生产/面试与独立通关深度，修订具体执行和证据缺口。kubectl ignore-not-found与PowerShell退出码语义核对官方参考。；限制：未连接真实Rancher/KubeSphere/TCE/Istio，未执行Terraform或变更真实state；历史版本不重报为当前推荐。
- syntax：本组五篇共24个PowerShell代码块通过AST语法检查。；限制：语法检查不证明平台、权限、渲染或资源运行。

第二位审校者：data-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮全部差异、相关机制上下文、基础/故障实验与独立通关；不是再次全文重审。
- 复核local_file四文件实验、漂移/repair/moved与限定清理；状态锁不覆盖控制台、init不是只读后端查询，plan的2不是自动执行许可。
- 独立Bash替身测试plan0/1/2分类及fmt2、validate1前置失败停止，不进入plan或apply；不等于Terraform/provider/state实际执行。

### Calico 深讲

[打开课程](./cloud-native/calico.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：固定Calico 3.32却未固定kind节点，当前kind默认1.37超出文内1.34–1.36范围。
- 初评：安装未失败停止且用默认kubeconfig，kind创建失败可能继续向原集群安装CRD。
- 初评：默认拒绝后笼统承诺wget超时，忽略DNS先被拒绝的错误类型。
- 初评：交叉审校要求版本兼容来源固定，latest链接会漂移。
- 修订：依据官方kind v0.33.0发布清单固定1.36.4节点镜像摘要。
- 修订：安装脚本失败即停、冲突阻断、独立kubeconfig、CRD就绪等待，明确子脚本环境不会继承回父终端，限定清理context。
- 修订：补DNS错误与TCP超时分层及有限五分钟安装验收。
- 修订：将兼容入口改为官方/3.32/固定页面。

**八项正文证据**

- 前置与路线：作者复评通过。Linux/WSL工具入口与独占kind，固定kind0.33.0/节点1.36.4 digest对应3.32声明兼容范围；独立kubeconfig和新终端路径说明。
- 机制与状态：作者复评通过。一个包怎样跨节点、NetworkPolicy 的隔离语义、路由精讲课堂：区分控制路由、封装、双端策略与实际数据转发。
- 基础实验：作者复评通过。完整kind/安装/策略文件，安装失败停止和名称冲突阻断，节点/组件有界验收；默认拒绝区分DNS先失败。
- 故障实验：作者复评通过。故障实验：selector 写错导致策略不放行：保留基线、单字段注入、标签/策略/请求对照、恢复与专用资源清理。
- 生产取舍：作者复评通过。生产设计题、地址迁移课堂、主机边界课堂：地址余量、故障域、MTU、管理恢复通道及受控升级矩阵。
- 递进面试：作者复评通过。核心面试题与递进追问：CNI 创建阶段、模式选择、标准策略并集、反射器和 Service 诊断均给因果答案。
- 独立通关：作者复评通过。独立通关：安全规则要有成功与拒绝的对照：五项有新条件、结果判据、反证及返工章节。
- AIOps 与证据：作者复评通过。从证据到 AIOps：不要让网络模型只学到故障后的动作：配置/节点/流量/收敛时间关联，不自动清空策略。

**验证边界**

- reasoned：本轮逐段全文阅读所有章节，保留已有原理、实验、生产与递进追问；补具体失败、安全、兼容或证据反例。；限制：无真实etcd/Calico/Cilium/Nexus/SonarQube实例运行，未执行数据库/网络/快照变更；保留历史版本边界。
- executed：安装Bash脚本语法通过；假kind/kubectl/cilium模拟正常、创建失败、名称冲突三组，失败或冲突时未调用下游安装。官方kind releases API核对v0.33.0与1.36.4完整摘要。；限制：仅Shell流程模拟，不创建集群、不下载镜像，也不证明插件/内核/节点组合在本机可用。
- executed：2026-11-11作者与data交叉审校分别经Jina读取官方固定3.32页，核对tested1.34/1.35/1.36与kernel5.10；仍非兼容实跑。；限制：本轮返工仅限明确列出的本地合成、静态和来源检查，不替代实际产品或生产验收。

第二位审校者：data-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮全部差异、相关机制上下文、基础/故障实验与独立通关；不是再次全文重审。
- 复核kind0.33.0的官方1.36.4摘要及经Jina读取的官方Calico3.32测试范围1.34–1.36；独立kubeconfig防错集群，DNS拒绝不等入站拒绝。
- 独立Bash语法与替身测试list失败/create失败/已有kubeconfig均不执行下游kubectl，正常路径继续；复核默认拒绝、DNS/双向允许、单入站selector故障及正负复验，未运行CNI或数据包。

### Cilium 深讲

[打开课程](./cloud-native/cilium.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：固定Cilium1.20但kind默认节点可超出测试范围，仅 prose 提醒无法确保第一条创建命令可复现。
- 初评：kind创建失败后安装仍可能连接旧当前集群，未使用独立kubeconfig。
- 修订：固定kind0.33.0官方1.36.4镜像摘要，安装脚本set-e及名称/kubeconfig冲突阻断。
- 修订：明确子脚本环境作用域及所有后续终端重新绑定实验配置，凭据文件不公开，清理显式context。

**八项正文证据**

- 前置与路线：作者复评通过。Linux/WSL客户端及Hubble独立安装、kind0.33.0/1.36.4官方digest、独占kubeconfig与新终端绑定，旧集群不改CNI。
- 机制与状态：作者复评通过。eBPF 前置知识、Service 负载均衡数据路径与身份与策略课堂：区分 program/map、三层地址、身份和代理路径。
- 基础实验：作者复评通过。三节点kind/Cilium安装脚本失败停止，固定IPAM与节点镜像，Hubble路径、允许组及固定禁止组分别验证；CLI成功不冒充完整实测。
- 故障实验：作者复评通过。故障实验：标签改变导致身份和策略变化及实验复盘升级：定位具体 agent、有限收敛窗口、标签恢复与测试 Pod/转发清理。
- 生产取舍：作者复评通过。生产设计检查单、升级深讲、观测容量课堂：内核、map 内存、L7、升级状态与观测缺失分层。
- 递进面试：作者复评通过。核心面试题与递进追问、系统设计题：从 hook/map 到 Service、身份、观测与规模迁移的答案梯度。
- 独立通关：作者复评通过。独立通关：把网络事实与观测事实分开：五项新条件与五万事件积压判据，要求反证而非只交成功图。
- AIOps 与证据：作者复评通过。在 AIOps 中的作用和观测容量课堂：关联 drop reason、policy revision、节点与应用 trace，覆盖不足标未知。

**验证边界**

- reasoned：本轮逐段全文阅读所有章节，保留已有原理、实验、生产与递进追问；补具体失败、安全、兼容或证据反例。；限制：无真实etcd/Calico/Cilium/Nexus/SonarQube实例运行，未执行数据库/网络/快照变更；保留历史版本边界。
- executed：安装Bash脚本语法通过；假kind/kubectl/cilium模拟正常、创建失败、名称冲突三组，失败或冲突时未调用下游安装。官方kind releases API核对v0.33.0与1.36.4完整摘要。；限制：仅Shell流程模拟，不创建集群、不下载镜像，也不证明插件/内核/节点组合在本机可用。

第二位审校者：data-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮全部差异、相关机制上下文、基础/故障实验与独立通关；不是再次全文重审。
- 复核官方1.20兼容源码1.33–1.36与kind摘要、IPAM和节点PodCIDR、父子shell配置继承；Hubble观测不等端到端，身份变化不要求IP变化。
- 独立Bash语法及安装前置失败不得下游执行；复核入站空允许集合、精确client许可、固定outsider负例、标签修复和观测缺失假设，未运行eBPF/集群。

### Docker Compose 精讲

[打开课程](./cloud-native/docker-compose.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：第一条Compose命令之前缺少Docker运行环境与Compose插件分别安装验收的零基础入口。
- 修订：新增开课章节链接Docker安装验收，并区分插件缺失、后端连通、只读渲染与实际三服务运行。

**八项正文证据**

- 前置与路线：作者复评通过。老师先帮你跨过安装这一关：Docker后端和Compose插件分别验收，终端/上下文隔离；入门实验声明路径与目录、端口和下载空间。
- 机制与状态：作者复评通过。Compose 的内部调和路径与依赖课堂：区分插值/模型/实际对象、服务 restart 和依赖 restart，非持续调和。
- 基础实验：作者复评通过。AIOps 入门实验：Prometheus + Grafana + Demo App：三组件完整文件、启动及四层采集查询验收。
- 故障实验：作者复评通过。故障注入实验：Grafana 把 Prometheus 写成 localhost：备份、注入、日志/DNS、恢复文件与重建查询；独立通关增加工具缺失分支。
- 生产取舍：作者复评通过。实验质量课堂：可用性、观测性与清理要一起验收：单机故障域、共享卷、配额、基数、容量和默认凭据边界。
- 递进面试：作者复评通过。老师带你把实验解释成工程能力 / 五、面试从 30 秒讲到 3 分钟：解释请求链、单机 HA 及 Grafana 数据恢复反例。
- 独立通关：作者复评通过。独立通关：交付的是最终模型，不是 YAML 截图：内部端口、合并、诊断、共享卷和配置时间点五项判据。
- AIOps 与证据：作者复评通过。实验质量课堂与学习证据：区分 up 与业务错误，保存应用、Targets、表达式及 Grafana 证据链。

**验证边界**

- reasoned：全文阅读Compose配置、实验、合并、变量、依赖与独立通关，核对启动条件非持续修复、restart非重新配置、卷非备份。；限制：本轮未运行三个服务、数据源故障、合并模型；CLI版本检查仅证明本机Compose v5.6.1存在。

第二位审校者：root-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮差异、相关机制及实验/通关上下文，不声称再次全文重审；结合既有评测与本轮作者全文复评。
- Docker与Compose插件安装检查闭合，纯解析与真实三服务链分层；context不是本地目录隔离；保留充分已有深度不灌水。
- 未启动Compose三服务或数据源故障；当前为本轮差异和相关实验静态复核。

### Docker

[打开课程](./cloud-native/docker.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：开头要求已经可用的容器环境，但没有从未安装到客户端与服务端验收的具体入口。
- 初评：入门实验目标承诺挂载配置，但实际步骤主要验证HTTP服务与探针。
- 修订：增加Windows WSL/Desktop与Linux Engine分流安装路径及context/Client/Server/OSType验收和失败回路。
- 修订：修正入门实验目标，区分未做的挂载与真实步骤。

**八项正文证据**

- 前置与路线：作者复评通过。电脑还没有 Docker：官方安装路径、Desktop启动、WSL集成、context/Client/Server/OSType与终端区别；正文实验有目录、命名冲突、回环端口边界。
- 机制与状态：作者复评通过。老师带你把健康服务讲成一条完整交付链：区分镜像、运行、业务证据；健康变红，为什么容器没有自动重启说明探针不是自愈。
- 基础实验：作者复评通过。AIOps 入门实验：容器化健康检查服务：完整 app.py/healthcheck.py、Dockerfile、忽略文件、构建、发布、响应/Health有限等待及容器清理。
- 故障实验：作者复评通过。故障注入实验：看懂 OOMKilled：限制、退出码与 OOM 标记交叉取证，恢复内存预算并回收专用容器；独立通关增加监听错位反例。
- 生产取舍：作者复评通过。老师带你把健康服务讲成一条完整交付链与生产事故：覆盖数据兼容、容量、权限和宿主故障域，拒绝全局清理作修复。
- 递进面试：作者复评通过。独立通关：不看步骤，能否解释并修好新条件：定义、请求路径与 restart、镜像拉取、Docker socket 三个反例追问。
- 独立通关：作者复评通过。独立通关：不看步骤，能否解释并修好新条件：五项题均给可复核证据与答案判据，缺引擎明确不算实操通过。
- AIOps 与证据：作者复评通过。学习证据和独立通关：日志、内存限制、健康与业务信号进入告警和受人工确认的运行手册。

**验证边界**

- reasoned：全文阅读 Docker 本文全部章节，核对健康/OOM实验、生命周期、重启与镜像/数据回退边界；安装入口对照Docker官方Windows页面。；限制：未安装Docker、切换后端或执行容器构建/OOM；不把历史客户端记录当当前daemon证明。

第二位审校者：root-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮差异、相关机制及实验/通关上下文，不声称再次全文重审；结合既有评测与本轮作者全文复评。
- 新Docker Desktop/WSL入口分Client/Server/context/OSType，修改目标与实际健康实验一致；探针错误端口与主服务正常两证据分开。
- 未安装/切换后端、构建镜像或运行真实容器；本次独立审查不继承旧实跑为本轮结果。

### etcd 深讲

[打开课程](./cloud-native/etcd.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：实例/卷归属只有文字核对，没有失败停止门禁；恢复容器可复用已存在命名卷。
- 初评：快照保存/检查/复制/恢复失败后代码可能继续使用旧文件或半成品。
- 修订：新增容器/卷清单读取错误与名称冲突停止、快照目标覆盖阻断。
- 修订：快照与恢复链逐步检查退出码、备份目录只读挂载；加入命名卷复用与失败半成品的教师反例。

**八项正文证据**

- 前置与路线：作者复评通过。安装与启动：单节点学习环境：PowerShell、Linux 引擎、context、空目录及容器卷身份逐项明确。
- 机制与状态：作者复评通过。一次写请求怎样完成、MVCC、revision 和 version、租约与隔离深讲：解释多数派、版本与外部动作边界，读写与 Watch 保证分开。
- 基础实验：作者复评通过。单节点教学入口阻断旧容器/卷和旧快照文件，KV/Lease/事务/Watch完整；容器创建与健康失败停止。
- 故障实验：作者复评通过。compacted Watch→重新List→下一revision→新事件；快照保存/检查/复制/恢复/读回逐步失败停止，恢复卷不复用、源快照只读。
- 生产取舍：作者复评通过。生产架构检查单和运维深讲：状态探针与真实恢复验收分层：多数派维护、TLS、低延迟磁盘、配额、恢复与上层缓存边界。
- 递进面试：作者复评通过。核心面试题与递进追问、Kubernetes 控制面事故推演：从定义到共识、容量和恢复选择，包含超时未知结果反例。
- 独立通关：作者复评通过。独立通关：把一致性保证画到正确边界：五项具体条件与判据，单节点不宣称多节点容灾。
- AIOps 与证据：作者复评通过。在 AIOps 中的作用与学习证据：fsync→提案→API→控制器链，敏感快照不公开，禁止自动重启多数派。

**验证边界**

- reasoned：本轮逐段全文阅读所有章节，保留已有原理、实验、生产与递进追问；补具体失败、安全、兼容或证据反例。；限制：无真实etcd/Calico/Cilium/Nexus/SonarQube实例运行，未执行数据库/网络/快照变更；保留历史版本边界。
- syntax：etcd/Nexus/SonarQube共29个PowerShell代码块通过AST语法解析。；限制：不证明容器、HTTP、凭据、快照和真实数据库结果；SonarQube新就绪分支本轮仅静态验证。

第二位审校者：data-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮全部差异、相关机制上下文、基础/故障实验与独立通关；不是再次全文重审。
- 复核专用容器/恢复卷/快照防复用、源快照目录只读挂载、restore默认成员与启动相符；Watch压缩→重新读R→R+1→four、恢复读回及清理闭合。
- 复核MVCC/事务、租约不等副作用撤销、多数派3失1与4失2、fencing及恢复边界；PowerShell语法通过，未启动etcd/快照/多成员恢复。

### Harbor 深讲

[打开课程](./cloud-native/harbor.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：学习证据直接列harbor-rendered.yaml，但Helm渲染可能含Secret、生成口令与私钥。
- 初评：PowerShell在repo add/update/show/template失败后仍可能继续，渲染文件存在容易被误读成成功。
- 初评：独立交叉反馈：错误凭据实验恢复步骤未在主代码保持同一--config，可能借默认缓存假通过；Force复用目录、OR文本检查和记录写入失败也有缺口。
- 修订：公开证据改为render-review.md白名单摘要，原始清单本地保存并忽略；说明base64不是脱敏。
- 修订：增加各原生命令退出码门禁，既有仓库别名先检查不强制覆盖；补文件存在不证明渲染有效反例。
- 修订：返工为新目录冲突阻断、错误凭据意外成功即停止；同一配置目录正确login/pull逐步验证并finally logout，凭据收回失败不验收。
- 修订：渲染两项文本分别强制断言并注明非完整语义验证；JSON解析/版本与摘要记录/推送输出写入加ErrorAction Stop。

**八项正文证据**

- 前置与路线：作者复评通过。入门实验：离线渲染 Harbor Helm Chart / 从零准备：本课先不搭一整套仓库：区分客户端首轮与需管理员供给的真实实践。
- 机制与状态：作者复评通过。状态一致性：Tag、Digest、数据库和 Blob 与一次 pull 为什么先得到 401：解释引用、认证挑战及两类持久状态。
- 基础实验：作者复评通过。离线Chart实验明确实例未创建，选择appVersion候选并固定Chart；repo/show/template逐步失败停止；真实Push/Pull另有授权前提。
- 故障实验：作者复评通过。错误Robot Token故障使用新独立目录，正确恢复login/pull始终同--config，退出码门禁+finally同目录logout；DNS/TLS与认证错误分离，默认缓存不能证明恢复。
- 生产取舍：作者复评通过。生产高可用、容量与安全、升级与真正的回滚边界、复制与备份课堂：覆盖冷缓存、异步 RPO、DB/Blob/密钥成套恢复和 GC 预演。
- 递进面试：作者复评通过。三分钟面试回答：仓库怎样变成可靠的发布依赖与系统设计题：双站点企业制品仓库：定义、协议、扫描、恢复与设计取舍可追问。
- 独立通关：作者复评通过。独立通关：仓库里有镜像，不等于恢复时拿得到：五项具体输入、判据、反例与返工章节，缺平台不编造。
- AIOps 与证据：作者复评通过。学习证据改为脱敏render-review.md，不公开原始rendered YAML；制品摘要串CI/部署/Pod，清理/GC必须审批。

**验证边界**

- reasoned：全文阅读身份、认证、扫描、复制、保留、GC与HA章节，核对离线渲染和真实实例验证边界；对照Helm官方敏感输出提醒。；限制：未拉取Chart、安装/登录Harbor、Push/Pull、扫描、复制或GC，PowerShell改动为静态审校。
- syntax：按独立交叉反馈返工后，Harbor全部5个PowerShell代码块AST检查通过，git diff --check通过。；限制：未真实登录Harbor，未运行认证/拉取/退出登录，静态控制流不证明真实权限。

第二位审校者：root-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮差异、相关机制及实验/通关上下文，不声称再次全文重审；结合既有评测与本轮作者全文复评。
- 初审发现故障独立config而恢复可能用默认缓存、目录复用及渲染OR弱验收；作者返工后同config login/pull/finally logout与退出码闭合，原始Secret渲染不公开。
- 独立提取恢复代码，以假Docker核对正常/login失败/pull失败/logout失败4组及统一config调用序列；没有实际认证、拉镜像或部署Harbor。

### Helm

[打开课程](./cloud-native/helm.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：values图把--set、--set-string、--set-file画成普适线性优先级，容易误解不同类型按命令行位置互相覆盖。
- 初评：诊断脚本全部\|\| true吞错且全量打印values/manifest；警告不能代替安全示例。
- 修订：改图为来源层级，明确同类右侧覆盖与不同入口不应混用同键。
- 修订：以字段缩小的只读元数据采集替换全量脚本，记录失败并最终非零退出，明确业务健康未验证、空清单与标签边界。

**八项正文证据**

- 前置与路线：作者复评通过。AIOps 入门实验 / 1. 创建 Chart：区分本地 Helm 与集群 kubectl/kubeconfig 路线，明确安装与权限范围。
- 机制与状态：作者复评通过。values覆盖优先级区分文件/同类参数/不同设值入口；发布路径、SSA、Hook、CRD及数据回滚边界完整。
- 基础实验：作者复评通过。AIOps 入门实验：完整两个模板、values、渲染、安装、升级；8. 先恢复，再清理补业务探针和回收验证。
- 故障实验：作者复评通过。故障注入实验：坏镜像与自动回滚：专用集群、健康基线、失败现场与真实请求恢复，数据库不随清单回退。
- 生产取舍：作者复评通过。生命周期精讲：CRD、Hook 和数据库各自留下什么及发布并发段落：覆盖迁移、发布锁、字段归属、容量和敏感记录。
- 递进面试：作者复评通过。面试深追问：发布平台该以什么作为成功条件与独立通关：定义、路径、HPA 管理权、数据库迁移及服务端预检反例。
- 独立通关：作者复评通过。独立通关：配置合同能否经受反例：五项均含输入变化、具体可观察结果、拒绝条件及返工章节。
- AIOps 与证据：作者复评通过。AIOps自动化诊断脚本不采集values、manifest、日志或事件原文；失败显式incomplete，成功也标business_health=not_verified。

**验证边界**

- reasoned：全文审校模板、发布链、实验、回滚、数据副作用和输入合同，核对官方helm install覆盖语义。；限制：没有Kubernetes实验集群，不验证真实发布、认证/准入、坏镜像回滚。
- executed：本机Helm v4.1.3只读版本检查；对正文Bash采集脚本注入假helm/kubectl，正常退出0，release不可读与pods读取失败均退出1。；限制：这是Git Bash函数模拟，不证明真实Helm/Kubernetes命令执行、权限、服务健康或版本迁移。

第二位审校者：root-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮差异、相关机制及实验/通关上下文，不声称再次全文重审；结合既有评测与本轮作者全文复评。
- values来源层级不误画不同set入口右侧优先；新采集器不采values/manifest，失败计数并最终非零，空标签结果不当资源不存在。
- 独立复跑mock正常/缺release/无权3分支全部符合退出码和状态；未连接真实集群或验证业务健康。

### Istio 深讲

[打开课程](./cloud-native/istio.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：curl未启-f只打印状态但不验证；恢复503后粘贴代码仍会继续删除namespace和purge。
- 初评：真实实验多数安装/创建失败仍继续，离线生成只在 prose 要求退出码。
- 修订：新增Assert-LabHttp同时验证退出码与阶段预期200/503，十次上限容纳传播并在失败时停止。
- 修订：安装/命名空间/样例/故障注入/修复/卸载加明确失败门禁，安装预览标为非直接入门入口，补HTTP状态反例。

**八项正文证据**

- 前置与路线：作者复评通过。入门实验：离线生成 Istio 安装清单 / 实验步骤：完整包与校验、PowerShell 路径、样例与临时 PATH；基础实验明确真实平台身份。
- 机制与状态：作者复评通过。架构和数据流、xDS 配置到底怎样送到现场、Ambient 精讲：Sidecar/ztunnel/waypoint 与 Service/Pod 流量边界明确。
- 基础实验：作者复评通过。官方完整包离线生成与Ambient真实实验分层，生成/安装逐项停止，Assert-LabHttp必须返回预期200但不冒充mTLS证据。
- 故障实验：作者复评通过。Sidecar空subset请求503，函数区分工具退出码与HTTP状态，精确删除后200门禁通过才清理；最多十次观察后保留现场。
- 生产取舍：作者复评通过。生产高可用、容量、安全与升级和生产设计课堂：CA/代理故障域、重试/剔除容量、revision 与数据回滚边界。
- 递进面试：作者复评通过。三分钟面试回答与课堂作业、系统设计题及独立通关：定义、路径、授权反例、控制面失联与容量设计有答案梯度。
- 独立通关：作者复评通过。独立通关：配置同步、请求成功和安全达标要分开：五项具体变化、可观察结果与返工章节；不编造运行。
- AIOps 与证据：作者复评通过。在 AIOps 中的作用及路由精讲：版本、响应标志、代理配置与业务 SLI 关联，精确审批后回退。

**验证边界**

- reasoned：本轮逐段全文审阅；保留已有请求/状态/生产/面试与独立通关深度，修订具体执行和证据缺口。kubectl ignore-not-found与PowerShell退出码语义核对官方参考。；限制：未连接真实Rancher/KubeSphere/TCE/Istio，未执行Terraform或变更真实state；历史版本不重报为当前推荐。
- syntax：本组五篇共24个PowerShell代码块通过AST语法检查。；限制：语法检查不证明平台、权限、渲染或资源运行。
- executed：从正文提取Assert-LabHttp，以假kubectl和无等待函数验证200、503、连接失败、恢复错误状态、延迟恢复五组，调用次数1/1/10/10/3均符合预期。；限制：仅PowerShell控制逻辑模拟，没有真实HTTP、Istio或Kubernetes。

第二位审校者：data-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮全部差异、相关机制上下文、基础/故障实验与独立通关；不是再次全文重审。
- 复核离线完整发行包、Ambient/waypoint前置及Sidecar空subset的200→503→200闭环，恢复失败先保留现场；HTTP状态与命令退出码不能互相替代。
- 独立执行正文Assert-LabHttp的合成即时/延迟成功、非零退出但HTTP200、持续状态错配四分支；有界重试符合合同。未创建网格或调用kubectl。

### Kubeflow 技术栈深讲

[打开课程](./cloud-native/kubeflow.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：安装循环对所有错误盲重试且默认force-conflicts；Bash依赖失败可继续；编译只搜索词未核对结构，pip freeze错误未阻断。
- 修订：改单次受限请求提交，失败非零停止，明确部分成功/CRD依赖与冲突辨别；补所有安装错误门禁；新增IR结构正反例脚本及锁文件门禁。

**八项正文证据**

- 前置与路线：作者复评通过。本地Python隔离与完整KCD分路、精确版本组合和无GPU/集群边界。
- 机制与状态：作者复评通过。Profile/KFP/Artifact/Trainer/Katib/Hub/KServe控制数据执行路径与状态。
- 基础实验：作者复评通过。完整两组件本地编译、IR名称类型任务结构验收和受限清理。
- 故障实验：作者复评通过。STRING→NUMBER_INTEGER编译故障与修复，Runtime模拟前提；新增IR负例。
- 生产取舍：作者复评通过。五类状态HA/多租户/GPU队列/成本/升级schema与恢复。
- 递进面试：作者复评通过。12组递进题及20团队设计与新任务GPU Pending事故。
- 独立通关：作者复评通过。编译/训练/制品/发布四份证据，数据泄漏/缓存/checkpoint等老师带练。
- AIOps 与证据：作者复评通过。异常检测模型生命周期、元数据/运行/对象证据关联与高风险动作审批。

**验证边界**

- executed：提取verify_ir.py用Python3.15/PyYAML6.0.3合成IR四案例通过。；限制：未安装KFP、未重编译Pipeline、未装KCD/GPU；保留历史运行记录，不冒称本轮执行。
- syntax：本批Maven/n8n/microservices/Kubeflow共73个PowerShell块AST通过；git diff --check通过。；限制：只语法与格式，未模拟网络/产品运行；Kubernetes Bash人工静态检查。

第二位审校者：root-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮全部差异及所列必要机制/实验/通关上下文，不声称再次全文重审；结合作者全文八维复评。
- 本轮完整差异、单次SSA/双本地实验/IR契约和生产面试通关上下文复核。部分提交失败非原子撤销、不默认force-conflicts；IR校验与编译/Run/模型业务四层不同。
- 独立运行正文verify_ir.py的正确/名称错误/类型错误/缺任务4个合成样本，历史编译与本轮IR测试分开。未安装KFP/KCD、提交集群或运行GPU。
- 本组当前84个PowerShell块独立AST通过；语法或合成测试不替代产品、业务或生产验收。

### Kubernetes

[打开课程](./cloud-native/kubernetes.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：kind默认节点已漂移1.37与相邻Istio/Calico/Cilium固定范围不匹配；命名空间存在仅人工检查；个别问答把无后端写成无EndpointSlice对象。
- 修订：固定官方kind0.33.0的1.36.4镜像摘要，解释固定/支持/实测区别；命名空间空值断言和基础/恢复退出门禁；纠正空端点对象语义。

**八项正文证据**

- 前置与路线：作者复评通过。Bash/WSL/本机Docker/kind/kubectl专属目录与kubeconfig、版本组合。
- 机制与状态：作者复评通过。全对象链、API/etcd/Informer/调度/网络存储/SSA/finalizer。
- 基础实验：作者复评通过。两副本Web/Service/内部请求完整YAML、基线与专属集群清理。
- 故障实验：作者复评通过。错镜像/selector及finalizer三故障分层恢复，不以port-forward替Service。
- 生产取舍：作者复评通过。HA/三故障域/etcd恢复/安全/升级/API公平性与容量。
- 递进面试：作者复评通过。45题含12组参考答案、30秒/3分钟、架构与多类事故。
- 独立通关：作者复评通过。五项通关、N+1算术/UID/观测代数/Secret间接读取与默认版本漂移反例。
- AIOps 与证据：作者复评通过。控制/执行/数据面指标日志事件Trace与只读诊断、未知状态边界。

**验证边界**

- reasoned：逐段全文阅读3490行；复用本轮已核对kind官方节点摘要，校验相邻固定组件版本组合。；限制：没有创建Kubernetes集群或执行kubectl写操作；固定组合不是实际兼容验收。
- syntax：本批Maven/n8n/microservices/Kubeflow共73个PowerShell块AST通过；git diff --check通过。；限制：只语法与格式，未模拟网络/产品运行；Kubernetes Bash人工静态检查。

第二位审校者：root-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮全部差异及所列必要机制/实验/通关上下文，不声称再次全文重审；结合作者全文八维复评。
- 本轮完整差异、专用kubeconfig/基础/镜像及selector故障、请求路径/独立通关上下文复核；固定节点配套版本而非默认漂移，空EndpointSlice对象不等可用地址。
- 独立运行正文namespace门禁的不存在/已存在/无权3分支，失败均不继续；独立读取kind0.33.0官方发布页核对1.36.4完整摘要。未创建集群或验证CNI实际兼容。
- 本组当前84个PowerShell块独立AST通过；语法或合成测试不替代产品、业务或生产验收。

### KubeSphere 深讲

[打开课程](./cloud-native/kubesphere.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：快照函数被描述为不输出秘密，但节点/事件原文可能包含内部敏感信息。
- 初评：UI验证没使用退出码门禁，RBAC实验创建失败可继续且缺同名namespace阻断。
- 修订：明确原始快照受控保存、公开白名单health-review摘要，UI查询复用Save-LabQuery。
- 修订：添加namespace预检和所有角色创建失败门禁；讲清预期Forbidden、真正创建失败与impersonate拒绝三者差别。

**八项正文证据**

- 前置与路线：作者复评通过。入门实验：生成集群健康快照 / 实验步骤：终端、客户端、context、浏览器与 API 身份及读写授权分清。
- 机制与状态：作者复评通过。状态模型、高可用与容量及平台工程课堂：页面、API、spec/status、控制器与就绪结果分层。
- 基础实验：作者复评通过。健康快照逐查询保留退出码，原始内部信息不公开；UI ConfigMap查询也进入相同门禁。
- 故障实验：作者复评通过。RBAC实验先阻断已有namespace、角色创建失败停止，预期拒绝与身份模拟权限失败分离，再最小授权、Secret仍拒绝、回退及清理。
- 生产取舍：作者复评通过。扩展运维课堂、扩展生命周期课堂、授权容量课堂：供应链、CRD/PVC、不可逆 schema、历史与新数据及三类容量限制。
- 递进面试：作者复评通过。三分钟面试表达：平台化的价值和代价与面试追问：扩展故障会不会影响核心资源创建：调用链、隔离、影响传播均有答案。
- 独立通关：作者复评通过。独立通关：平台入口方便，不意味着证据可以省略：五项具体输入、失败/恢复证据与答案判据，缺 License 不编造。
- AIOps 与证据：作者复评通过。故障课堂：为什么看到的是昨天的数据和独立通关：数据年龄、上下文、核心/扩展/业务四句结论及受控写动作。

**验证边界**

- reasoned：本轮逐段全文审阅；保留已有请求/状态/生产/面试与独立通关深度，修订具体执行和证据缺口。kubectl ignore-not-found与PowerShell退出码语义核对官方参考。；限制：未连接真实Rancher/KubeSphere/TCE/Istio，未执行Terraform或变更真实state；历史版本不重报为当前推荐。
- syntax：本组五篇共24个PowerShell代码块通过AST语法检查。；限制：语法检查不证明平台、权限、渲染或资源运行。

第二位审校者：data-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮全部差异、相关机制上下文、基础/故障实验与独立通关；不是再次全文重审。
- 复核快照函数、UI/API ConfigMap对应、只读许可不含创建权限；原始快照不得公开。RBAC创建失败和预期Forbidden区分正确。
- 复核ConfigMap可读/Pod拒绝→最小Pod授权/Secret仍拒绝→撤回闭环，身份模拟失败不是受测身份拒绝；PowerShell语法通过，未运行平台/License或API。

### 微服务深讲

[打开课程](./cloud-native/microservices.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：固定Spring Boot4.0.7依赖在线Initializr，当前元数据不再列此版；硬编码作者D盘路径；服务默认监听共享网卡，基础检查只输出未断言。
- 初评：交叉审校发现健康和订单根/字段数组会被宽松比较误放行。
- 修订：增加基于固定Maven坐标的手动POM/目录/测试类/Wrapper分支，不随Initializr漂移；个人空目录/端口预检/回环监听；HTTP与业务断言。
- 修订：原始HTTP200文本转换单对象，顶层状态与payment状态要求标量字符串、payment必须对象，补故障反例。

**八项正文证据**

- 前置与路线：作者复评通过。Java17/Maven、服务端口/目录、两个终端、手动固定工程完整入口。
- 机制与状态：作者复评通过。同步/异步、注册发现、超时重试/熔断/隔离、一致性与数据库边界。
- 基础实验：作者复评通过。双Spring服务业务接口、健康与指标；新增状态和业务值门禁。
- 故障实验：作者复评通过。支付停止与降级/恢复、多实例网络与数据库事务推演，明确本机模拟。
- 生产取舍：作者复评通过。超时预算、幂等/Outbox/Saga、可观测、部署/回滚/安全与容量。
- 递进面试：作者复评通过。支付双扣/级联故障/架构题有证据、取舍与追问。
- 独立通关：作者复评通过。HTTP200不等订单成功，独立改变条件和业务断言；降级值明确。
- AIOps 与证据：作者复评通过。Trace/日志/指标关联订单请求和变更，自动修复需授权。

**验证边界**

- reasoned：全文阅读；实时Initializr元数据确认无4.0.7，MavenCentral核对固定webmvc4.0.7坐标存在。；限制：未下载全部依赖或Java编译/启动；手工POM与源码仅静态核对。
- syntax：本批Maven/n8n/microservices/Kubeflow共73个PowerShell块AST通过；git diff --check通过。；限制：只语法与格式，未模拟网络/产品运行；Kubernetes Bash人工静态检查。
- executed：tmp/cloud-cross-rework-checks-2026-11-11.mjs 原文块7正常/根数组/字段数组/payment数组案例通过；不是Java编译或真实业务运行。；限制：本轮返工仅限明确列出的本地合成、静态和来源检查，不替代实际产品或生产验收。

第二位审校者：root-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮全部差异及所列必要机制/实验/通关上下文，不声称再次全文重审；结合作者全文八维复评。
- 本轮完整差异、手工固定POM/双服务完整源码与基础/503故障、业务状态/生产/独立通关复核。提出PowerShell集合比较误通关问题，返工顶层单对象和标量状态后复评通过。
- 独立复跑Microservices7合成HTTP体：正常通过、健康根/字段数组、订单根/状态数组、payment对象/状态数组拒绝；官方Cloud2025.1.2发布组件核对。不编译Java、不声称Spring真实运行。
- 本组当前84个PowerShell块独立AST通过；语法或合成测试不替代产品、业务或生产验收。

### NGINX / Ingress / Gateway API

[打开课程](./cloud-native/nginx-ingress.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：本地专用网络只文字防复用而Docker网络允许同名，基线curl无时间边界；暂停故障中途异常可能跳过恢复。
- 修订：补容器/网络/端口预检及查询失败门禁、有限基线请求；故障finally解除暂停、原始curl退出和HTTP码并列；修复端点未就绪语义。

**八项正文证据**

- 前置与路线：作者复评通过。本机Desktop/Linux引擎与独占目录/对象先检查；Gateway有控制器前提。
- 机制与状态：作者复评通过。NGINX上下文/路径/URI/转发头/TLS/缓冲/连接与Gateway控制数据面。
- 基础实验：作者复评通过。完整本机反代网络和配置、两层日志/请求验收/专属清理。
- 故障实验：作者复评通过。暂停后端及遗留selector/targetPort、Gateway后端引用故障恢复；新退出28与504反例。
- 生产取舍：作者复评通过。退役边界、三可用区/多租户、证书/容量/排空/迁移与回滚。
- 递进面试：作者复评通过。机制/事故/架构回答指导，支付重试与双入口升级追问。
- 独立通关：作者复评通过。五项独立通关，URI合同/两段TLS/多父条件/暂停恢复边界。
- AIOps 与证据：作者复评通过。入口上游日志/时序/配置/请求ID与未知采集，自动修复不凭状态码。

**验证边界**

- reasoned：本轮逐段全文阅读；保留已有完整生产和递进深度，仅修具体教学/安全/验收缺口。；限制：无真实NGINX/Traefik/Tomcat/Liberty/WAS实例；未部署/删除/更新任何业务对象，不继承历史实跑结果。
- syntax：四篇共29个PowerShell块AST通过，diff --check通过。；限制：只静态语法，不证明产品/API/网络。

第二位审校者：refresh-foundation-platform；日期：2026-11-11。

- 审阅范围：完整本轮diff（含独立审校返工）、作者记录与必要核心机制/完整基础故障实验/独立通关上下文；不是本轮对旧版全文重复审读。
- 本轮修订的未ready端点保留地址语义已对照Kubernetes官方EndpointSlice文档；基线容器/网络不复用、HTTP有限等待与传输码/HTTP码分离正确。
- 完整本机基础/暂停故障、遗留Ingress与Gateway双实验，以及独立五关/两段TLS/URI/排空必要上下文已审。finally在采日志失败时仍尝试unpause，失败不继续正常验收；强关终端不保证恢复的限制明确。
- 独立执行原文故障块的4组Docker/curl桩：正常、logs失败、unpause失败、pause失败；核对恢复调用次数和后续请求次数。未运行Docker/NGINX、入口迁移或Gateway集群。
- 独立测试tmp/cross-cloud-last4-checks-2026-11-11.ps1：31组行为反例和30段PowerShell AST在Windows PowerShell5.1与PowerShell7均通过；tmp/cross-cloud-last4-admin-checks-2026-11-11.mjs通过10逻辑/4成员集合/6容量断言。diff --check通过。合成验证不能替代产品实验、性能/HA或生产发布验收。

### Rancher 深讲

[打开课程](./cloud-native/rancher.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：Helm渲染命令失败可继续且原始清单被推荐为公开证据。
- 初评：agent故障前命名空间/工作负载创建没有执行门禁，可能误复用已有namespace。
- 修订：新增Helm逐命令失败停止、渲染白名单摘要与原始清单忽略。
- 修订：新增namespace查无和查错分支、创建/缩容/恢复退出码检查，副本数成功读出后才转换；加入AlreadyExists反例。

**八项正文证据**

- 前置与路线：作者复评通过。入门实验：离线渲染 Rancher Helm Chart / 实验步骤：客户端、终端、目录与平台需求分层；故障实验要求独立原生 kubeconfig。
- 机制与状态：作者复评通过。架构和数据流、身份精讲课堂、Fleet 交付精讲：管理反向通道、身份路径、期望与下游状态分层。
- 基础实验：作者复评通过。离线渲染与完整探针：固定Chart、逐步退出检查、原始清单不公开、可观察目标和安全命名空间预检。
- 故障实验：作者复评通过。cluster-agent实验先确认独占namespace、保存副本数、基线就绪与HTTP；注入和恢复失败停止，管理/API/探针结果分层。
- 生产取舍：作者复评通过。一致性、生产高可用与容量、管理平台恢复精讲、平台迁移课堂：重连尖峰、唯一管理权、三层备份及当前授权复核。
- 递进面试：作者复评通过。三分钟面试回答：用两个探针解释一场事故与大厂设计题作答：定义、管理链、恢复和两百集群设计有答案。
- 独立通关：作者复评通过。独立通关：红色管理页不等于两百套业务一起停止：五项新条件与判断规则，要求路径证据而非截图。
- AIOps 与证据：作者复评通过。在 AIOps 中的作用、权限恢复课堂：管理和业务 SLI 分开，状态新鲜度、授权差异只读报告与写操作审批。

**验证边界**

- reasoned：本轮逐段全文审阅；保留已有请求/状态/生产/面试与独立通关深度，修订具体执行和证据缺口。kubectl ignore-not-found与PowerShell退出码语义核对官方参考。；限制：未连接真实Rancher/KubeSphere/TCE/Istio，未执行Terraform或变更真实state；历史版本不重报为当前推荐。
- syntax：本组五篇共24个PowerShell代码块通过AST语法检查。；限制：语法检查不证明平台、权限、渲染或资源运行。

第二位审校者：data-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮全部差异、相关机制上下文、基础/故障实验与独立通关；不是再次全文重审。
- 复核固定Chart离线渲染、原始清单敏感字段白名单输出、原生下游kubeconfig与独占namespace；保存agent副本数、恢复及业务探针边界完整。
- 独立复核本轮命令失败门禁、node-agent兜底不扩大故障、管理/业务状态及旧备份权限恢复反例；PowerShell语法通过，未运行Helm/Rancher/agent变更。

### TKE on TCE 技术栈深讲

[打开课程](./cloud-native/tke-on-tce.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：实验硬编码作者D盘路径，不适合从零读者的实际下载目录。
- 初评：API提交后第一次HTTP与数据面传播存在时间差，缺观测过早的分支解释。
- 修订：替换为仓库目录识别与experiment-start入口、文件存在检查不可绕过。
- 修订：补最多十轮有界传播观察、Service/EndpointSlice端口对照和工具缺失/DNS/拒连分层，恢复失败保留现场；注明静态边界。

**八项正文证据**

- 前置与路线：作者复评通过。Windows PowerShell、本机Docker/工具官方入口、自己的真实仓库位置与两份实际实验文件存在检查。
- 机制与状态：作者复评通过。网络路径：容器通了不等于用户通了与云集成状态课堂：EndpointSlice 控制信息、云任务异步调和、对象 UID 边界。
- 基础实验：作者复评通过。基础实验：运行两个副本并验证 Service：两个副本、命名 targetPort、HTTP 与失败停止，读取仓库实际 YAML。
- 故障实验：作者复评通过。8080单变量故障，Pod本地80与Service对照；补异步传播观察上限及错误分层，恢复失败停在清理前。
- 生产取舍：作者复评通过。容量与故障域的可复算设计题、升级交付课堂、存储拓扑精讲：AZ 预留、BOM、WFFC 与回滚状态边界。
- 递进面试：作者复评通过。面试回答与连续追问和独立通关：定义、机制、云超时未知、PVC UID、CAM/RBAC 有答案与证据要求。
- 独立通关：作者复评通过。独立通关：三条链不能互相替代：五项预测/反例/容量变式、失败返工位置与云实验未运行规则。
- AIOps 与证据：作者复评通过。AIOps：把告警关联到真实依赖和跨层事故复盘：云/集群/业务时间线及因果假设。

**验证边界**

- reasoned：本轮逐段全文审阅；保留已有请求/状态/生产/面试与独立通关深度，修订具体执行和证据缺口。kubectl ignore-not-found与PowerShell退出码语义核对官方参考。；限制：未连接真实Rancher/KubeSphere/TCE/Istio，未执行Terraform或变更真实state；历史版本不重报为当前推荐。
- syntax：本组五篇共24个PowerShell代码块通过AST语法检查。；限制：语法检查不证明平台、权限、渲染或资源运行。

第二位审校者：data-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮全部差异、相关机制上下文、基础/故障实验与独立通关；不是再次全文重审。
- 复核仓库实验app.yaml与service-broken.yaml：命名http/监听80对照targetPort8080，恢复声明80、HTTP恢复后才删除专用kind；目录前置不依赖作者D盘。
- 控制面传播等待与curl不存在/DNS/连接拒绝分层恰当，独立通关入口port与targetPort变化、故障域CPU/内存算术成立；PowerShell语法通过，未运行kind或TCE集成。

### Traefik 技术栈深讲

[打开课程](./cloud-native/traefik.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：基础/恢复请求只人工检查状态且Provider收敛无有限机制；TLS示例默认-k绕过身份，恢复配置未验证运行时服务端口。
- 初评：交叉审校发现name可被环境/-p覆盖、同名标签检查不足。
- 修订：增加有界HTTP200/404/502精确门禁，失败区分传输与HTTP；恢复API核对唯一whoami及80端口；基线副本防覆盖；默认保留证书校验。
- 修订：新增最终项目/网络/服务身份门禁与挂载人工核对；清理前重核容器归属，未知orphan停止。

**八项正文证据**

- 前置与路线：作者复评通过。Docker/Compose与Kubernetes分路、专有项目/端口/上下文、精确版本矩阵。
- 机制与状态：作者复评通过。Provider/入口/路由/中间件/服务/后端传输，独立副本收敛和ACME状态。
- 基础实验：作者复评通过。Compose完整动态路由，API对象与真实Host正负探针、清理。
- 故障实验：作者复评通过。错误后端9999恢复80与API同探针，Gateway缺后端负例；有限等待不盲改。
- 生产取舍：作者复评通过。三可用区/证书外管/连接容量/套接字和RBAC边界/CRD升级回退。
- 递进面试：作者复评通过。12组递进题和500Route设计、部分404升级事故。
- 独立通关：作者复评通过。五关与本地限流/ACME共享文件/支付未知副作用教师反例。
- AIOps 与证据：作者复评通过。入口指标日志Trace与变更证据、告警富化和受控Runbook。

**验证边界**

- reasoned：本轮逐段全文阅读；保留已有完整生产和递进深度，仅修具体教学/安全/验收缺口。；限制：无真实NGINX/Traefik/Tomcat/Liberty/WAS实例；未部署/删除/更新任何业务对象，不继承历史实跑结果。
- syntax：四篇共29个PowerShell块AST通过，diff --check通过。；限制：只静态语法，不证明产品/API/网络。
- executed：tmp/cloud-delivery-sixth-checks-2026-11-11.ps1提取新增函数，Traefik5种HTTP/传输/收敛样本与Tomcat5种JSON/传输样本全部通过。；限制：HTTP为本地桩，无真实请求和产品运行。
- executed：tmp/cloud-cross-rework-checks-2026-11-11.mjs 4种合成身份门禁通过，真实Compose config验证原名/环境覆盖改变name两分支，无服务启动。；限制：本轮返工仅限明确列出的本地合成、静态和来源检查，不替代实际产品或生产验收。

第二位审校者：refresh-foundation-platform；日期：2026-11-11。

- 审阅范围：完整本轮diff（含独立审校返工）、作者记录与必要核心机制/完整基础故障实验/独立通关上下文；不是本轮对旧版全文重复审读。
- 交叉发现固定Compose name仍被环境变量/-p覆盖，可能使预检与清理身份不同；已交作者返工，现新增Assert-TraefikLessonProject，检查环境覆盖/最终name/网络/服务集合并要求清理前重核归属，未知orphan停止。对照Docker官方项目名优先级复核。
- 完整Compose基础/错端口恢复、可选Gateway后端引用故障和独立五关已审；运行时whoami唯一服务端口80、同Host探针、200/404/502与传输失败不混同，TLS默认保留证书验证；单次响应不能证明所有副本已收敛。
- 独立6组HTTP/传输和8组项目模型/环境覆盖/渲染失败反例通过；只在测试子进程设置并恢复合成环境变量，Docker与HTTP均为桩，未实际启动/删除项目或执行TLS网络验收。
- 独立测试tmp/cross-cloud-last4-checks-2026-11-11.ps1：31组行为反例和30段PowerShell AST在Windows PowerShell5.1与PowerShell7均通过；tmp/cross-cloud-last4-admin-checks-2026-11-11.mjs通过10逻辑/4成员集合/6容量断言。diff --check通过。合成验证不能替代产品实验、性能/HA或生产发布验收。

### Apache ActiveMQ 技术栈深讲：Classic 与 Artemis

[打开课程](./data-ai/activemq.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：QueueSize误写预取后移出，和Inflight易重复计数。
- 修订：修订Prefetch/排障/面试措辞，增加100/60、80/40及100/70集合反例与官方定义。

**八项正文证据**

- 前置与路线：作者复评通过。Java17/独立目录、下载SHA512、双终端/PID核对齐全
- 机制与状态：作者复评通过。Classic/Artemis/JMS协议边界、确认窗口与QueueSize包含关系
- 基础实验：作者复评通过。固定6.3.0五条收发Browse不消费、绑定127与已存在队列防护
- 故障实验：作者复评通过。十条持久消息正常停启比较MessageID；明确非断电/HA实测
- 生产取舍：作者复评通过。KahaDB/Journal、桥接非复制、下游净速率/HA故障域/升级API存储迁移
- 递进面试：作者复评通过。30秒3分钟与确认/幂等/Prefetch递进；Queue指标错因纠正
- 独立通关：作者复评通过。七条新队列、竞争消费者、Ack窗口与162万/45分钟/9.27GiB变式
- AIOps 与证据：作者复评通过。告警多业务独立路由、工单唯一键、DLQ审批和Runbook再授权

**验证边界**

- reasoned：逐篇完整正文审读（分段补齐截断范围），对照技术专属机制、双实验、教师反馈、独立迁移题与官方来源复核。；限制：未运行真实消息服务或 Docker 产品实验；离线模型与算术复跑结果见本条后续 executed 记录，不能扩大为生产验证。
- executed：node tmp/check-foundation-message-platform-2026-11-11.mjs：27项Python/SQLite处理与反例断言、48段PowerShell AST、14项容量/集合算术全部通过。Kafka原文位置模型、ZooKeeper原文隔离模型及删判断失败/恢复、RabbitMQ提取原文handler并模拟AMQP回调验证。；限制：Python3.15.2/PowerShell7.6.9；RabbitMQ只用内存SQLite和模拟通道/退出，不是Pika连接、进程崩溃、代理重投/死信或HA验证。未执行Docker消息产品实验，PS仅语法检查。

第二位审校者：cloud-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮差异（若有）、相关机制及基础/故障实验与独立通关；不是再次全文重审。
- Classic QueueSize含未确认总集合、Inflight是其子集，修正前后口径一致；100/60、确认20与仅派发10的三卡可排除双计。复核浏览/持久重启实验及下游业务边界。
- 独立核对Classic官方队列指标并复算状态/容量；未启动Broker或JMS，干净重启预期不写成断电耐久证明。

### Apache Pulsar 技术栈深讲

[打开课程](./data-ai/apache-pulsar.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：Key_Shared只写核对批处理，未明确禁批或按键批处理的必要条件。
- 修订：补默认混键批按首键分发的反例、禁批/KEY_BASED两选项和客户端配置归属。

**八项正文证据**

- 前置与路线：作者复评通过。DockerLinux/4GiB/独立卷/本机端口，命令均在容器内不假设主机Java
- 机制与状态：作者复评通过。broker-BookKeeper/订阅游标/ACK/保留过期/Key_Shared批处理明确
- 基础实验：作者复评通过。固定4.0.13先建topic和earliest订阅再一发一收
- 故障实验：作者复评通过。停消费者20条积压、恢复ACK收敛；两订阅独立账与纸面预算
- 生产取舍：作者复评通过。元数据/Bookie故障域、复制保护恢复、容量净速率、安全升级旧消息
- 递进面试：作者复评通过。确认未知/新消息位置与业务键、三分钟路径与订阅选择追问
- 独立通关：作者复评通过。三不同事件、新latest订阅不复活删除历史、180万/30分钟
- AIOps 与证据：作者复评通过。下游预算、审批引用非授权、DLQ修正重放与脱敏证据

**验证边界**

- reasoned：逐篇完整正文审读（分段补齐截断范围），对照技术专属机制、双实验、教师反馈、独立迁移题与官方来源复核。；限制：未运行真实消息服务或 Docker 产品实验；离线模型与算术复跑结果见本条后续 executed 记录，不能扩大为生产验证。
- executed：node tmp/check-foundation-message-platform-2026-11-11.mjs：27项Python/SQLite处理与反例断言、48段PowerShell AST、14项容量/集合算术全部通过。Kafka原文位置模型、ZooKeeper原文隔离模型及删判断失败/恢复、RabbitMQ提取原文handler并模拟AMQP回调验证。；限制：Python3.15.2/PowerShell7.6.9；RabbitMQ只用内存SQLite和模拟通道/退出，不是Pika连接、进程崩溃、代理重投/死信或HA验证。未执行Docker消息产品实验，PS仅语法检查。

第二位审校者：cloud-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮差异（若有）、相关机制及基础/故障实验与独立通关；不是再次全文重审。
- Key_Shared要求禁批或按键批，KEY_BASED属于Java客户端，默认混键批按首键的反例正确；订阅进度与业务去重、完成顺序分开。复核订阅先建、积压恢复及独立双订阅课。
- 独立核对Pulsar4.0官方批处理要求；纸面核对混键批归属和下游限制，未运行真实SDK/BookKeeper/TCE。

### Dify 技术栈深讲

[打开课程](./data-ai/dify.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：全文工作流/知识库/组件/生产深度已有覆盖；PowerShell验收大小写不敏感，未严格检查来源和额外字段。
- 初评：示例0.72 confidence容易被当作真实校准概率。
- 修订：抽出Assert-LessonAlert校验精确四字段、字段类型、大小写、来源与完整文本，运行ID和状态也收严。
- 修订：新增四类伪合格输出的教师批改和数组/错文本变式，说明confidence为虚构教学值。

**八项正文证据**

- 前置与路线：作者复评通过。应用/工作流/节点/HTTP/JSON从零、Docker资源与端口、PowerShell保存编码、密钥环境和清理。
- 机制与状态：作者复评通过。API/Worker/队列/数据库/向量库/沙箱/模型路径、工作流状态与知识检索、输入输出严格合同。
- 基础实验：作者复评通过。无模型确定性告警工作流及API请求、输出字段和验证脚本，明确真实平台与本地合同分界。
- 故障实验：作者复评通过。工作流字段/权限/依赖排查和修复，新四坏输入、额外授权字段拒绝与恢复。
- 生产取舍：作者复评通过。队列积压/模型限流/租户权限/知识库隔离、备份组合/升级回退/SSRF与沙箱边界。
- 递进面试：作者复评通过。工作流与Agent取舍、知识更新/错误召回/卡住事故、平台设计与权限审批递进追问。
- 独立通关：作者复评通过。独立工作流变式、验证拒绝、容量与故障证据；新大小写/字符串布尔值/数组包装纠错。
- AIOps 与证据：作者复评通过。告警归一化、知识辅助和受控人工审批，DSL/脱敏请求/故障记录作为GitHub证据。

**验证边界**

- reasoned：完整阅读全文；官方Dify Workflow API与Microsoft比较运算符核对返回与大小写语义。；限制：404的研究URL不作为证据。
- executed：实际PowerShell加载正文校验函数，4类错误与数组/错文本均拒绝，合法样本恢复。；限制：仅函数内存输入，不执行正文网络调用。
- syntax：全部5个PowerShell围栏Parser解析通过。；限制：解析不等于Dify部署验收。
- unrun：Docker/Dify工作流执行、模型服务、知识库与外部API未运行。；限制：未访问用户密钥或真实告警。

第二位审校者：cloud-independent-2026-11-11；日期：2026-11-11。

- 独立审本轮差异、工作流API响应门禁及JSON模板实验、故障与通关上下文；不是再次全文重审。
- workflow_run_id与status精确类型、顶层单对象、字段名/枚举大小写、额外字段和人工复核布尔值边界合理；格式合法、置信度数字和业务事实正确没有混为授权。
- 原文Assert-LessonAlert与课堂正常/四负例实际在PS7运行，另加顶层数组、错误告警文本和非字符串source均拒绝；只是合成JSON，无Dify服务/真实HTTP。

### FastAPI

[打开课程](./data-ai/fastapi.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：全文完整契约/async/生产教学已充分；早期BackgroundTasks适用列表把审计日志笼统写为适用，和后文可靠性边界冲突。
- 初评：错误响应校验已有原则但缺请求422和服务端500可复算的责任区分。
- 修订：收窄后台日志到可丢教学/尽力遥测，关键审计不能只依赖进程内任务。
- 修订：新增请求错误422、错误响应500、修复200与响应字段过滤课堂；保存历史记录并补本轮真实依赖和回归边界。

**八项正文证据**

- 前置与路线：作者复评通过。HTTP/JSON/URL/API/ASGI从零、目录/环境/终端和回环入口、内存与持久化区别。
- 机制与状态：作者复评通过。依赖/校验/handler/响应路径、Pydantic类型合同、async阻塞与线程池、进程状态和任务可靠性。
- 基础实验：作者复评通过。完整告警API请求体与响应、启动和curl/PS、健康/创建/查询/分析、字段边界和预期结果。
- 故障实验：作者复评通过。内存重启状态丢失、错误单位/非有限/额外字段拒绝、新422/500/200恢复与清理。
- 生产取舍：作者复评通过。多worker状态、数据库事务/队列、OAuth/TLS/CORS不等授权、超时重试、容量/探针/兼容升级回退。
- 递进面试：作者复评通过。高并发告警入口设计、异步却阻塞/多进程404事故、JWT/幂等/响应过滤递进追问。
- 独立通关：作者复评通过。五关契约/隔离/故障/容量/口述，新增请求与响应两种失败及边界0/缺字段变式。
- AIOps 与证据：作者复评通过。告警收集、模型服务与受控Runbook入口，批量/审计/可观测和GitHub契约测试证据。

**验证边界**

- reasoned：完整阅读全文，FastAPI官方Response Model页面核对输出校验失败为服务端错误及过滤。；限制：未运行外网API或产品发布。
- executed：Python3.12.14/FastAPI0.162.4/Starlette1.10.0/Pydantic2.14.3/httpx0.28.1 TestClient主API/合同/响应恢复全部通过；独立模块验证状态隔离。；限制：进程内请求不等于服务器重启、网络或多进程实测。
- syntax：全部53个Python块compile通过，孤立return片段用函数包装检查。；限制：非完整片段不声称独立运行。
- unrun：Uvicorn网络、Docker/Kubernetes、数据库/队列、多worker并发、生产部署未运行。；限制：本机Python3.12不等于容器镜像验证。

第二位审校者：cloud-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮差异、相关机制及基础/故障实验与独立通关；不是再次全文重审。
- 请求422与响应500责任区分，raise_server_exceptions不是生产吞异常开关；响应筛字段不等于内容脱敏，可靠审计不依赖进程后台任务。复核内存API通关和发布连接峰值。
- 独立在现有环境执行原TestClient课堂，422/500/恢复200及内部字段过滤通过；无网络服务器和持久任务。

### Apache Flink 深讲

[打开课程](./data-ai/flink.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：REST返回未直接验计算资源，提交/停/启命令失败后仍可继续观察，可能把未注入故障或新空状态作业当恢复；独立交叉发现单元素根数组可绕过整数字段校验。
- 修订：首次提交前有界读取原始HTTP响应，拒绝根数组并核对三个整数及空闲不超过总槽、限定课堂拓扑；SQL客户端及TaskManager停/启失败即停止；按交叉反馈新增数组和数量矛盾反例后复测。

**八项正文证据**

- 前置与路线：作者复评通过。流/状态/并行从零、SQL/Compose前置与2.3固定文档；合成Datagen和真实Kafka配置分开。
- 机制与状态：作者复评通过。键控状态/水位与迟到/检查点barrier/对齐和输出提交、槽共享及状态后端和存储分工。
- 基础实验：作者复评通过。完整Compose+SQL，命名卷权限初始化、只绑定本机；先资源就绪、再单次提交同Job和成功checkpoint。
- 故障实验：作者复评通过。短停TM有限重试，Job/Task/资源/检查点联合取证；原Job接续和print语义，不删状态重新截图。
- 生产取舍：作者复评通过。吞吐/净追赶、状态带宽/故障域、源和Sink预算、HA/凭据与UID/serializer升级回退。
- 递进面试：作者复评通过。低CPU与高checkpoint时延、窗口不出结果、HTTP重复、状态恢复五类递进与30秒/3分钟解释。
- 独立通关：作者复评通过。速率7窗非精确35、到达顺序变式、原Job检查点、积压432万追平27分钟和输出幂等判据。
- AIOps 与证据：作者复评通过。Job/operator/attempt/checkpoint和配置关联，业务正确/同状态历史/延迟分别验，证据脱敏。

**验证边界**

- reasoned：2026-11-11逐段全文读至EOF，核对八维与变式后定点修正，保留已充分的机制、生产、面试和独立通关讲解。；限制：不以字数或文档评测保证完全掌握/录用；真实环境、源和接收端语义仍需学习者独立验收。
- executed：真实Docker Compose配置解析；PS7语法、就绪11分支和提交/停/启成功失败替身；两个简化水位模型及27分钟/61.44秒复算；未运行Flink集群、SQL作业、checkpoint或故障恢复。；限制：本轮tmp/check-root-big-data-2026-11-11.mjs共57项，含12个PS7语法块；只有明确列出的本地配置、替身和算术检查，不能当作真实计算引擎或生产验证。

第二位审校者：cloud-independent-2026-11-11；日期：2026-11-11。

- 独立审本轮差异、完整Compose/SQL/提交/短停恢复实验、手工时间模型与通关；不是再次全文重审。
- 发现单元素根数组可经PowerShell成员枚举通过整数门禁，已反馈root并返工；现原始HTTP200文本先拒根数组、再单对象/整数/空槽不超过总槽。原Job ID、检查点延续与Print输出三类证据仍独立，不将新空状态作业称恢复。
- 独立复跑更新后root57项（12PS AST、11就绪分支、CLI成功失败替身、真实Compose解析及模型），另自写cross-flink-shape-by-cloud脚本8个正常/根数组/字段分散/字段数组/布尔/小数/矛盾槽/缺字段通过；均无HTTP或Flink服务，不证明Checkpoint/Source/Sink实跑。

### Apache Hadoop 深讲

[打开课程](./data-ai/hadoop.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：一致性段只说hflush/hsync控制边界，未教可见性与设备同步的差异及EC空操作反例；删除通常进Trash的措辞易误导默认保障。
- 修订：补接口能力/新读者可见/设备缓存与故障模型区分；加入EC no-op教师反例，修正Trash默认关闭及实际删除路径核验。

**八项正文证据**

- 前置与路线：作者复评通过。Linux/WSL独立实验机、Java17与固定3.5.0、SHA512、独占目录/端口/PID和禁止生产format
- 机制与状态：作者复评通过。HDFS读写pipeline、NameNode持久状态、YARN职责、Shuffle及hflush/hsync与EC能力边界
- 基础实验：作者复评通过。完整4XML、类路径继承、五进程健康门禁和WordCount三份状态/标记/内容互证
- 故障实验：作者复评通过。唯一DataNode停止→读超时早于dead→原目录恢复，明确单副本不能重建且不format
- 生产取舍：作者复评通过。QJM单writer与fencing、RM状态恢复、Kerberos/授权、容量/退役/升级finalize和备份
- 递进面试：作者复评通过。18题机制取舍递进、Secondary非热备、Combiner平均反例、外部副作用不由文件commit保证
- 独立通关：作者复评通过。8词变式、目标副本2不等实有、210/300TB退役边界与55.6小时、sum/count迁移
- AIOps 与证据：作者复评通过。日志湖/离线模型样本、应用/块/机架关联和只读证据自动化，危险操作人工审批

**验证边界**

- reasoned：逐篇阅读全文，核对机制、精确实验前置/恢复/清理、教师反例、迁移任务、生产和面试层；本轮新增事实对照 Hadoop 3.5.0 API/FS Shell/EC 限制或 HBase 2.6.6 官方源码与 2.6 BloomFilter 定义。；限制：未执行真实Hadoop/HBase服务；HBase官方book当前导向开发版，不用它冒充2.6.6来源。
- executed：node tmp/check-foundation-hadoop-hbase-2026-11-11.mjs：6 XML结构、19 Hadoop Bash语法、3 HBase PowerShell AST、原文SHA512解析器3组本地合成输入（正确/格式错/值错）、12容量算术、2词频答案断言通过。git diff --check通过。；限制：PowerShell7.6.9/Git Bash语法与本地合成校验文件；不是Linux软件安装、Docker构建、HBase Ruby Shell、HDFS作业、EC/WAL同步、进程故障或HA实跑。初次测试工具stdin中文编码失败，修为base64传输后全过，非正文语法缺陷。

第二位审校者：cloud-independent-2026-11-11；日期：2026-11-11。

- 独立审本轮差异、关键安装/独占路径/启动前置、完整WordCount与DataNode故障及恢复清理、独立通关；不是再次全文重审。
- 独立读取3.5.0 Syncable与EC限制官方正文：hflush新读者可见、hsync设备缓存边界、条带输出空操作均正确。不能从可见性推导掉电持久性；Trash默认保护不再想当然，单副本失联不冒称自动重建。
- 独立复跑作者Hadoop/HBase验证脚本：合计6XML、19Bash语法、3PS AST、SHA512三合成输入、12算术和2词频答案通过；不证明HDFS/YARN/MapReduce、设备断电或EC实跑。

### Apache HAWQ 存量运维与迁移深讲

[打开课程](./data-ai/hawq.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：全文遗留平台风险与迁移教学已充分；早期分布键文字仍易误解为永久物理节点映射。
- 初评：倾斜脚本拒绝坏数和重复桶，但未检查预期桶身份完整；遗漏最热桶会把3.6变成1.05绿色。
- 初评：Windows PowerShell5.1运行含中文无BOM脚本可能错误解码，编辑器保存前提缺失。
- 修订：修订分布策略与虚拟执行单元/HDFS说明，新增独立四桶清单门禁。
- 修订：增加缺失最热桶与同数量错身份变式、恢复3.6→1.02的教师批改；补UTF8BOM或pwsh7保存运行前提。

**八项正文证据**

- 前置与路线：作者复评通过。退休项目先定位存量/迁移，无需安装服务；SQL/文件系统补课、合成CSV、PowerShell版本编码与目录前提明确。
- 机制与状态：作者复评通过。Master/Catalog/虚拟Segment/QE/Slice/HDFS/YARN/Motion/PXF路径；分布策略不等永久主机、行数不等工作量。
- 基础实验：作者复评通过。完整CSV与脚本严格整数、唯一桶、非零总量和完整清单，1.02算术验收及真实产品边界。
- 故障实验：作者复评通过。热点3.6、缺桶/错桶拒绝、恢复1.02；维表连接放大纸面30→40→30并声明非SQL实跑。
- 生产取舍：作者复评通过。退休隔离与合同独立取证、只读重查询风险、元数据/文件/函数/调度备份、500TB与增量追赶、切换写入回退截止。
- 递进面试：作者复评通过。SQL整体慢5倍/月报慢4倍事故、多假设反证、500TB迁移设计和MPP/HA/兼容递进追问。
- 独立通关：作者复评通过。五任务2.5比值/字节倾斜/坏输入/120TB17窗口与净追赶/依赖恢复；新增缺测不等零及清单身份反例。
- AIOps 与证据：作者复评通过。查询证据与依赖/版本风险/迁移里程碑统一观察，不以模型自动重启旧系统，GitHub只合成脱敏模拟证据。

**验证边界**

- reasoned：完整阅读全文，web复核Apache Attic退休时间与HAWQ2.2历史架构的虚拟分配/HDFS数据路径。；限制：不把历史文档当当前新建生产建议。
- executed：PowerShell内存CSV适配执行正文计算段：正常1.02、热点3.6、缺桶/错桶/重复/零总量拒绝、恢复1.02。；限制：Import-Csv路径入口替换为内存ConvertFrom-Csv，未宣称文件路径和真实HAWQ运行。
- syntax：全部PowerShell围栏Parser解析通过；首次读取未指定UTF8导致失败后已修测试工具，并将相同编码陷阱补进正文。；限制：语法与模拟比例不验证集群调度或SQL兼容。
- unrun：真实HAWQ/HDFS/YARN/PXF、生产备份恢复和迁移均未执行。；限制：未下载或启动退役服务。

第二位审校者：cloud-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮差异、相关机制及基础/故障实验与独立通关；不是再次全文重审。
- 四桶清单独立于收到CSV，缺最忙桶不能判均衡，数量四但身份错同样拒绝；分布键不永久绑定物理Segment，退休服务学习不变成安装建议。复核公式、恢复与迁移通关。
- 独立用Import-Csv替身执行原PS计算块：均匀/热点、缺失/错ID/重复ID五组符合预期；没有连接HAWQ或执行真实CSV读取。

### Apache HBase 深讲

[打开课程](./data-ai/hbase.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：BloomFilter早段把阴性说成大概率没有，与后文正确语义矛盾；写路径缺显式Durability确认等级，可能把本地课堂成功当生产WAL保障。
- 修订：统一Bloom阴性肯定不在该候选/阳性仍须查的方向，增加三HFile与MemStore反例；补默认同步写路径、SKIP/ASYNC/SYNC/FSYNC及有效策略继承和故障模型教师反馈。

**八项正文证据**

- 前置与路线：作者复评通过。PowerShell/DockerLinux/4GiB前置、官方包校验、独占目录/标签/容器及loopback端口
- 机制与状态：作者复评通过。RowKey字节序、行/列族/版本、WAL同步等级、MemStore/HFile合并及Bloom候选边界
- 基础实验：作者复评通过。官方包+Java17镜像完整配置、表CRUD和两次put非原子，file://关闭能力检查明确限教学
- 故障实验：作者复评通过。禁表错误→状态证据→启表核对原Cell；显式时间戳逆序和恢复，两实验均有精确清理
- 生产取舍：作者复评通过。行级强一致非全表快照、区域接管/底层HA、热点/放大/容量/复制与备份、安全格式回滚
- 递进面试：作者复评通过。30秒/3分钟和超时不等未提交、Increment重试、Master与数据面、有限Scan非有限扫描
- 独立通关：作者复评通过。新行两个版本、确定盐1桶与随机16桶、3.6TB/13.5TB预算及独立口述证据
- AIOps 与证据：作者复评通过。设备/告警实体读写、热区/WAL/GC/Compaction关联、低基数指标与自动修复审批

**验证边界**

- reasoned：逐篇阅读全文，核对机制、精确实验前置/恢复/清理、教师反例、迁移任务、生产和面试层；本轮新增事实对照 Hadoop 3.5.0 API/FS Shell/EC 限制或 HBase 2.6.6 官方源码与 2.6 BloomFilter 定义。；限制：未执行真实Hadoop/HBase服务；HBase官方book当前导向开发版，不用它冒充2.6.6来源。
- executed：node tmp/check-foundation-hadoop-hbase-2026-11-11.mjs：6 XML结构、19 Hadoop Bash语法、3 HBase PowerShell AST、原文SHA512解析器3组本地合成输入（正确/格式错/值错）、12容量算术、2词频答案断言通过。git diff --check通过。；限制：PowerShell7.6.9/Git Bash语法与本地合成校验文件；不是Linux软件安装、Docker构建、HBase Ruby Shell、HDFS作业、EC/WAL同步、进程故障或HA实跑。初次测试工具stdin中文编码失败，修为base64传输后全过，非正文语法缺陷。

第二位审校者：cloud-independent-2026-11-11；日期：2026-11-11。

- 独立审本轮差异、读写与行级语义上下文、完整构建/表禁用恢复、版本实验和通关；不是再次全文重审。
- 独立读取固定2.6.6 Durability源码、HRegion日志追加→MemStore→可见性调用顺序及2.6 Bloom接口：阴性排除该候选、阳性可能误报；MemStore反例防整表不存在误推。默认继承、file://关闭能力检查与生产日志持久性区分明确。
- 独立复跑Hadoop/HBase脚本全部本地检查通过，包括原文SHA512解析器成功/格式错/值错。没有构建镜像、执行Ruby Shell、实际WAL同步或故障恢复；Bloom与掉电部分是官方机制推理，不伪称运行。

### Apache Hive 深讲

[打开课程](./data-ai/hive.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：课堂入口、停机与重启步骤缺少明确失败停止；读者可能将端口打开或同名重建当作SQL/原数据恢复。
- 修订：加入Beeline退出门禁、SELECT1分层验收、停启失败截断及三分钟调查窗口；解释原容器可写层与移除重建、初始化/升级检查的边界。

**八项正文证据**

- 前置与路线：作者复评通过。SQL/进程/端口/容器/HDFS从零解释，4.2.0历史实验与4.2.1安全修复分开，不声称生产基线。
- 机制与状态：作者复评通过。HS2/元数据/优化/Tez/YARN/文件读取链；分区分桶、列与谓词裁剪、写入标识和清理器引用分层。
- 基础实验：作者复评通过。新隔离容器三行ORC分区聚合，先SELECT1再一次建表插入；2/1计数、分区、Location三类证据。
- 故障实验：作者复评通过。停原HS2容器并核对端口/容器状态，恢复同一容器后查原3条，不以exec停机错误伪装JDBC证据。
- 生产取舍：作者复评通过。HA后端数据库、UDF代码执行、权限绕过、20TB四小时下界、统计/倾斜/小文件及schema不可逆回退。
- 递进面试：作者复评通过。定义、机制、取舍、排队事故与20TB架构答案，COUNT优化不当作全扫描实测，分区和业务日期分开。
- 独立通关：作者复评通过。第二日独立3行、迟到归属、零结果vs连不上、6TB三小时555.6MB/s和元数据恢复五关有判据。
- AIOps 与证据：作者复评通过。QueryID/queue/partition/Tez标识关联，质量门禁与业务报告结果、安全审批及脱敏证据独立。

**验证边界**

- reasoned：2026-11-11逐段全文读至EOF，核对八维与变式后定点修正，保留已充分的机制、生产、面试和独立通关讲解。；限制：不以字数或文档评测保证完全掌握/录用；真实环境、源和接收端语义仍需学习者独立验收。
- executed：官方下载与4.2.0入口源码核对；PS7原文AST与停/启/Beeline成功失败替身；6TB/三小时、文件比128复算。未运行Hive SQL/容器/Tez。；限制：本轮tmp/check-root-big-data-2026-11-11.mjs共57项，含12个PS7语法块；只有明确列出的本地配置、替身和算术检查，不能当作真实计算引擎或生产验证。

第二位审校者：cloud-independent-2026-11-11；日期：2026-11-11。

- 独立审本轮差异、SQL表/三行样本、完整基础与停止原容器故障恢复、通关题；不是再次全文重审。
- Beeline正常离开不掩盖交互SQL错误，SELECT1/端口/连接/查询四层有清楚判据；原容器恢复和同名重建分开，3分钟失败保留证据。独立读固定4.2.0入口源码，确认initOrUpgradeSchema与IS_RESUME的跳过边界。
- 独立复跑root大数据脚本57项全过，含Hive Beeline/停止/启动成功失败替身、PS AST与容量算术；不证明Hive SQL、Metastore持久化或Tez服务运行。

### Kafka

[打开课程](./data-ai/kafka.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：早期指标表把LOG-END-OFFSET写最新offset与后文下一位置矛盾；故障表直接建议reset/扩分区/改确认易被当自动修复。
- 修订：统一下一位置/Lag差值定义；将重置、扩分区、消息补偿改为证据和审批分支；固定4.3.1非最新基线。

**八项正文证据**

- 前置与路线：作者复评通过。端口公布地址/独立Docker路线与9092SDK路线分开，客户端独立venv
- 机制与状态：作者复评通过。分区日志/组提交下一位置/ISR-ELR边界/KRaft控制与数据分离
- 基础实验：作者复评通过。单分区固定镜像发1收1到lag0，检查退出码与新容器
- 故障实验：作者复评通过。同组离线3条恢复和离线offset模型0/2/1业务效果
- 生产取舍：作者复评通过。保留不等消费/分区预算/跨域副本、净速率、安全/功能级别回退
- 递进面试：作者复评通过。acks/幂等生产/Kafka事务/外部工单范围追问及事故取证
- 独立通关：作者复评通过。日志105提交100只剩2可读记录、6.048/18.144/24.192TB与追赶40分钟
- AIOps 与证据：作者复评通过。事件总线、幂等工单、下游延迟归因与受控重放

**验证边界**

- reasoned：逐篇完整正文审读（分段补齐截断范围），对照技术专属机制、双实验、教师反馈、独立迁移题与官方来源复核。；限制：未运行真实消息服务或 Docker 产品实验；离线模型与算术复跑结果见本条后续 executed 记录，不能扩大为生产验证。
- executed：node tmp/check-foundation-message-platform-2026-11-11.mjs：27项Python/SQLite处理与反例断言、48段PowerShell AST、14项容量/集合算术全部通过。Kafka原文位置模型、ZooKeeper原文隔离模型及删判断失败/恢复、RabbitMQ提取原文handler并模拟AMQP回调验证。；限制：Python3.15.2/PowerShell7.6.9；RabbitMQ只用内存SQLite和模拟通道/退出，不是Pika连接、进程崩溃、代理重投/死信或HA验证。未执行Docker消息产品实验，PS仅语法检查。

第二位审校者：cloud-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮差异（若有）、相关机制及基础/故障实验与独立通关；不是再次全文重审。
- 两个offset都为下一位置，Lag差不等于压实后记录数；reset、扩分区和确认配置不再当无风险修复。复核单组基线/故障恢复、事务可见性与外部工单边界。
- 独立运行原离线位移模型(0,1)/(2,1)/(1,1)，复算105-100与两可读记录反例；未启动Kafka或验收ELR。

### LangChain 技术栈深讲

[打开课程](./data-ai/langchain.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：全文基础/生产/面试深度充分；自定义错误middleware返回ToolMessage缺status=error，默认success会污染统计与结果合同。
- 初评：此前新增证据比对与审批续跑只静态审过，旧基线不能证明修改后行为。
- 修订：错误返回显式status=error并加异常脱敏边界；新增状态/正文/空结果/证据候选区分的教师反馈。
- 修订：实际跑基础四消息、错误服务拒绝、reject/approve两路径及状态变式；正文记录新组合与旧固定基线不同。

**八项正文证据**

- 前置与路线：作者复评通过。API/模型/SDK/工具/状态/上下文从零；独立环境、固定依赖安装和停止条件、Tracing关闭。
- 机制与状态：作者复评通过。create_agent循环、消息ID/工具参数/结果/结构校验、middleware顺序/检查点/状态与长期存储区别。
- 基础实验：作者复评通过。完整Fake模型四消息循环、ToolMessage真实来源/步骤比对、拒绝非课堂服务和清理。
- 故障实验：作者复评通过。模拟生产写审批前0，拒绝后0/批准后1和next空；新错误正文默认success被合同拒绝及恢复。
- 生产取舍：作者复评通过。多租户/服务端权限、预算/限流/工具幂等、队列与checkpoint故障域、版本演进和回退。
- 递进面试：作者复评通过。LangChain/LangGraph选型、Agent内外路径、结构化不等事实、审批与重放事故及系统设计追问。
- 独立通关：作者复评通过。新服务输入/证据错配/真实拒绝与批准计数、容量设计；新增中文错误与空结果反例。
- AIOps 与证据：作者复评通过。告警Runbook检索和证据核对到审批、Trace/Eval不等恢复成功，GitHub真实版本/范围证据。

**验证边界**

- reasoned：完整阅读全文；官方ToolMessage页面/源码与安装包核对status默认success。；限制：只修改明确失败状态，没有把错误文字当事实来源。
- executed：Python3.12.14/LangChain1.4.10/core1.7.7/LangGraph1.2.20/LangSmith0.14.17下基础与不支持服务失败、两审批分支、状态实验及中文变式通过。；限制：与文章历史固定1.3.15等不同组合；不声称重装旧组合或真实模型推理。
- syntax：13个Python围栏compile通过。；限制：PowerShell安装步骤未重跑。
- unrun：Provider/Key付费调用、LangSmith云、MCP、持久checkpoint、多副本/生产写工具未运行。；限制：Fake预写答案与内存计数不替代真实业务验收。

第二位审校者：cloud-independent-2026-11-11；日期：2026-11-11。

- 独立审本轮差异，完整无Key基础、审批故障与恢复实验、ToolMessage和通关机制；不是再次全文重审。
- ToolMessage默认success与error正文不等价已修；新课堂将工具失败、空检索和证据候选分开。Fake预写报告不冒充模型推理，批准/拒绝是同进程独立案例不冒充跨进程恢复。
- 新增ToolMessage反馈原文在本地Python3.12隔离环境实际执行；未独立重跑全部基础/审批脚本，不冒认作者执行。模型、LangSmith与外部工具均未调用。

### LangGraph

[打开课程](./data-ai/langgraph.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：全文显式图/状态/恢复/审批已有；Reducer说明缺少并行冲突与重复、矛盾证据的实操反证。
- 初评：容量段中文吉字节未显式区分十进制GB与GiB。
- 修订：新增默认字段并发InvalidUpdateError→按ID去重的归并函数→同ID异内容拒绝→恢复完整课堂。
- 修订：增加逆序合并和重复回放不变式、身份边界以及十进制容量单位。
- 修订：交叉审校指出只改共享变量会同时改变两路；返工为仅logs创建change-2副本，并同步编号/计数断言与输出，实际验证3→4→3。

**八项正文证据**

- 前置与路线：作者复评通过。Python字典/类型/函数和图的节点边、独立环境、无需模型Key、运行与清理。
- 机制与状态：作者复评通过。State/Channel/Reducer/Super-step、检查点/线程/中断恢复、并行冲突和执行不等业务恰好一次。
- 基础实验：作者复评通过。完整IncidentState路由和阈值输入/结果，图编译、调用和状态验证，真实本机框架执行。
- 故障实验：作者复评通过。ActionState拒绝越权、interrupt批准/拒绝、并行默认字段失败及去重冲突修复。
- 生产取舍：作者复评通过。持久检查点/外部副作用幂等、租户thread权限、容量/裁剪、工作流版本与在途状态兼容。
- 递进面试：作者复评通过。循环/路由/恢复/Reducer取舍、审批后重复写事故和故障域设计递进答案。
- 独立通关：作者复评通过。独立路由/恢复/容量题，新3证据与改ID4证据、重放/顺序/冲突反例有明确判据。
- AIOps 与证据：作者复评通过。指标/日志并行采证到人工审批，身份来源/时间窗口、图版本和脱敏执行记录。

**验证边界**

- reasoned：完整阅读全文，官方Graph API核对默认channel与归并规则。；限制：不把内存检查点作为持久服务证据。
- executed：Python3.12.14/LangGraph1.2.20/core1.7.7/checkpoint4.3.1执行4个完整程序：路由、权限恢复、真实interrupt续跑及并行冲突/去重/拒绝/恢复。；限制：本机框架无模型、数据库、网络工具。
- syntax：6个Python围栏compile通过。；限制：图式正确不证明生产权限安全。
- unrun：持久checkpoint、跨进程、多副本、真实模型/工具、灾备升级未运行。；限制：已关闭自动Tracing，未外发课堂输入。

第二位审校者：cloud-independent-2026-11-11；日期：2026-11-11。

- 独立审本轮差异、完整基础/目标错配/interrupt实验、归并器与通关；不是再次全文重审。
- 发现变式原说明只改共享证据编号会两路同时改变，仍为3而非4；已反馈作者，现明确只在logs复制出change-2并同步断言，指标分支不变。
- 独立重跑原文归并课堂、默认并发拒绝、冲突编号拒绝；另独立运行作者变式脚本验证原3→单分支4→恢复3。仅内存图，不验证检查点跨进程、数据库或真实工单幂等。

### LLM / OpenAI API

[打开课程](./data-ai/llm-openai.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：全文Responses工具链、安全/预算/双实验深度已有；并发工具结果顺序与call_id关联缺少可执行错配反例。
- 初评：现有response.output保留路径经当前官方核对可保留，未把旧的encrypted include假设写成缺陷。
- 修订：新增逆序完成导致zip跨服务串证据课堂，严格call_id唯一/已知/完整映射。
- 修订：补重复、未知、缺失拒绝与完成顺序不变式，区分call_id/对象id/业务幂等键及可信身份。

**八项正文证据**

- 前置与路线：作者复评通过。API/Token/模型/SDK/环境变量与费用从零，离线入门与真实付费调用分开，响应格式和工具名解释。
- 机制与状态：作者复评通过。Responses输入/输出item、工具执行回填/推理状态、流式事件与拒绝，新增关联ID不靠顺序。
- 基础实验：作者复评通过。无Key合成结构校验及可选真实请求完整输入、预期与清理；保留SDK版本边界。
- 故障实验：作者复评通过。无证据/不安全动作/错误schema拒绝，新增串证据、重复/缺少/未知ID与恢复。
- 生产取舍：作者复评通过。限流退避/超时预算/成本/上下文、服务端鉴权/日志脱敏、模型与提示版本/评测/回退。
- 递进面试：作者复评通过。结构化不等真实、工具不等权限、RAG/微调选型、故障与多租户架构的连续追问。
- 独立通关：作者复评通过。新输入与门禁反例、证据不足拒绝结论、容量设计；新增逆序完成仍同一业务关联的检验。
- AIOps 与证据：作者复评通过。告警摘要/证据检索/建议到审批执行，保留去标识样本/离线评测和调用预算证据。

**验证边界**

- reasoned：完整阅读全文，使用openai-docs与官方Responses/Function Calling/Reasoning资料核对call_id和状态。；限制：未因新页面盲目换模型；没有用户Key或付费调用。
- executed：validate_report、gate、pair_results三个本地程序通过；3类ID故障拒绝和逆序不变式通过。；限制：标准库合成结果，不验证真实模型选工具或SDK网络兼容。
- syntax：31个Python围栏compile通过。；限制：历史SDK mock记录未冒充本轮实跑。
- unrun：OpenAI真实请求、模型输出、计费限流、SDK历史固定环境和生产审批未运行。；限制：现有事实型模型配置保留原边界。

第二位审校者：cloud-independent-2026-11-11；日期：2026-11-11。

- 独立审本轮差异、真实摘要脚本的前置/输出/清理、离线终态故障、工具回路与通关；不是再次全文重审。
- 两个工具返回须以call_id配对而非列表位置、函数名或响应item id；未知/重复/缺失编号拒绝。模型调用编号与跨重试业务幂等键分离，结构化响应仍需事实复核。
- 新pair_results纯Python课堂实际运行并通过逆序、错误/重复/缺失编号分支；不导入OpenAI SDK、不读取密钥或发付费API请求，不证明模型推理。

### 机器学习

[打开课程](./data-ai/machine-learning.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：全文已有完整零基础、生产边界和三种实验，未发现需要推倒重写的深度缺口。
- 初评：独立通关指出精确率不随阈值必然增加，但缺少学生可亲手复算的反例和零分母反馈。
- 修订：新增三窗口阈值反馈程序，固定成熟标签演示0.8到0.92时精确率下降，以及无人入选时None不等于满分；增加交换标签变式与错因路径。

**八项正文证据**

- 前置与路线：作者复评通过。平均/比例/向量/矩阵/梯度从零解释，Python全新目录和环境，非GPU、无真实数据；新课无需第三方库。
- 机制与状态：作者复评通过。参数/超参数/损失/梯度学习率、批次轮次、特征/标签可用时刻、泛化与漂移、计数分母均有因果解释。
- 基础实验：作者复评通过。160行合成分类完整脚本与36/12测试类别数，解释Pipeline、classes_与概率边界；纯Python梯度实验提供可实测替代入口。
- 故障实验：作者复评通过。标签泄漏、学习率发散及新增高分误报反例可回收；预期、原因、修复和退出范围明确。
- 生产取舍：作者复评通过。在线窗口状态、成熟标签/冷启动、延迟与资源预算、可信持久化、影子灰度与模型预处理阈值匹配回滚。
- 递进面试：作者复评通过。三百服务50候选预算设计、毫秒改秒事故、分层召回/低基率与复杂模型取舍；阈值反例具备具体响应证据。
- 独立通关：作者复评通过。独立五关手算梯度、20/30/15分母、数据泄漏、8.26%低基率、口述与返工；新题允许交换标签复评。
- AIOps 与证据：作者复评通过。指标工单变更到特征/模型/人工反馈/规则兜底，模型给信号不提供执行授权，证据区分合成与生产。

**验证边界**

- reasoned：完整阅读全文；Jina核对Google官方precision/recall定义及零分母。；限制：没有真实事故分布与成熟标签评测，不保证面试结果。
- executed：专用Python3.12.14/sklearn1.9.1环境实跑四程序：分类混淆矩阵36/0/0/12；泄漏clean0.494、leaked1.0；梯度下降/发散/恢复；新三阈值精确率2/3、0、None。；限制：合成数据训练与数学演示，不是生产训练质量证据。
- syntax：本篇全部4个Python块compile通过，连同另两篇合计123块；定向diff通过。；限制：只语法的块不等于运行。
- unrun：真实历史评估、在线特征服务、影子/灰度与生产回滚均未执行。；限制：专用临时环境只运行本文合成程序，未调用生产系统。

第二位审校者：cloud-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮差异、相关机制及基础/故障实验与独立通关；不是再次全文重审。
- 阈值提升不保证精确率单调；固定分数下提醒集合只缩不增，零提醒的precision为None。复核泄漏反例、验证集选阈值及稀有事件分母，通关不以合成满分冒充生产。
- 独立运行新增三阈值原脚本，输出2/3、0、None符合预期；未训练真实业务模型。

### MongoDB 技术栈深讲

[打开课程](./data-ai/mongodb.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：健康检查grep数字1弱于退出码契约；新主预期仍写死mongo2/3，错误查询没有独立分类。
- 修订：直接CMD数组用quit与严格ok判定；停止成员和每次候选查询增加退出码/布尔格式门槛，按实际剩余成员描述选举。

**八项正文证据**

- 前置与路线：作者复评通过。BSON对象/日期/客户端、单节点与三节点独立项目/端口/卷预检、Shell和mongosh边界。
- 机制与状态：作者复评通过。文档原子/事务、WT日志检查点、oplog/选举、读偏好/关注、分片和变更流进度不混淆。
- 基础实验：作者复评通过。认证单节点合法/非法文档、索引计划、八天旧记录TTL观察和精确清理。
- 故障实验：作者复评通过。实际发现当前主后停止，剩余成员识别、旧记录与新majority写验收，恢复冗余与清理另验。
- 生产取舍：作者复评通过。容量/热集/复制窗口/分片热点、认证TLS、备份及FCV与二进制升级分别说明。
- 递进面试：作者复评通过。定义机制/majority与未知提交、索引权衡、分片设计和P99事故逐级追问。
- 独立通关：作者复评通过。单文档旧版本、BSON类型、Arbiter票与数据确认、64GB/20MBps窗口和真实故障域均可判定。
- AIOps 与证据：作者复评通过。事件/变更/知识元数据与Change Stream进度和工单幂等衔接，禁止Token进度冒充效果。

**验证边界**

- reasoned：2026-11-11分段完整读至EOF；核对八维及变化条件独立任务后定点修正，保留已充分的专属机制/实验/生产/面试。；限制：教学覆盖不代表读者已完全掌握或可保证录用；本轮没有数据库/Redis真实服务，须自行记录实际实验。
- executed：两Compose配置真实解析；ping数字1/0/字符串/缺字段/异常五分支JS模型；三种旧主、尚无主、查询失败和错误格式的原样PS模拟。；限制：tmp/check-root-databases-2026-11-11.mjs共67项含23个PowerShell7语法块；只有明确列出的本机配置/模拟/算术，不含真实SQL计划、锁、选举、持久化、HA、恢复或生产验收。

第二位审校者：cloud-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮差异（若有）、相关机制及基础/故障实验与独立通关；不是再次全文重审。
- 健康探针从grep数字改为严格ok数字1退出码；选举候选由真实被停成员推导，并拒绝查询错误/非布尔输出。复核多数确认未知、新写验收先于旧主回归、冗余另验。
- 独立执行提取ping表达式的1/0/字符串1/缺字段/异常五组JS替身；PS选举路径静态复核，无mongosh或真实选举。

### MySQL / SQL

[打开课程](./data-ai/mysql-sql.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：USER与实际授权账号未区分；Unknown database 的修复栏直接建议建库，可能掩盖错误目标。
- 修订：新增CURRENT_USER与SHOW GRANTS身份课堂，限定直接会话和定义者权限上下文；修复未知库处理边界。

**八项正文证据**

- 前置与路线：作者复评通过。客户端/服务端、表行列与唯一首跑Compose路线，隔离空库、Shell与SQL边界先讲。
- 机制与状态：作者复评通过。查询逻辑/实际路径、联合索引与锁范围、MVCC快照、redo/undo/binlog及未知提交串联。
- 基础实验：作者复评通过。四告警两发布逐项计数，Compose和SQL导入退出码与清理、固定日期预期可复现。
- 故障实验：作者复评通过。独立领取冲突及双会话三秒锁超时，显式ROLLBACK和新事务恢复；不强杀其他连接。
- 生产取舍：作者复评通过。复制确认/旧主隔离/PITR、连接/容量、安全账号、Schema扩展迁移收缩与二进制回退。
- 递进面试：作者复评通过。SQL口径、事务错误范围、小表全扫、DDL隐式提交、副本读旧值均有渐进答案。
- 独立通关：作者复评通过。五项变式包括LEFT JOIN六行/四执行/四告警、600与450连接预算、270GB数据/1.08TB三节点口径。
- AIOps 与证据：作者复评通过。告警/事故/变更/动作和反馈分表，未知及未恢复分母独立报告，证据脱敏。

**验证边界**

- reasoned：2026-11-11分段完整读至EOF；核对八维及变化条件独立任务后定点修正，保留已充分的专属机制/实验/生产/面试。；限制：教学覆盖不代表读者已完全掌握或可保证录用；本轮没有数据库/Redis真实服务，须自行记录实际实验。
- executed：Compose真实解析；容量/连接算术独立复算；身份语义对照MySQL8.4官方函数，本轮未执行SQL。；限制：tmp/check-root-databases-2026-11-11.mjs共67项含23个PowerShell7语法块；只有明确列出的本机配置/模拟/算术，不含真实SQL计划、锁、选举、持久化、HA、恢复或生产验收。

第二位审校者：cloud-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮差异（若有）、相关机制及基础/故障实验与独立通关；不是再次全文重审。
- USER与CURRENT_USER区分自报身份/直接会话实际授权账号，定义者上下文例外明确；Unknown database不再诱导未知实例补建空库。复核基础查询、双会话锁恢复、JOIN分母与容量通关。
- 独立查MySQL8.4官方身份函数并复算关键查询口径；未连接MySQL，未继承作者Compose解析为自己的运行。

### Ollama 技术栈深讲

[打开课程](./data-ai/ollama.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：全文已有本地模型部署与双实验；流式读取说明未把网络块、UTF8字符和NDJSON行分开，容易逐块直接JSON解析。
- 初评：流中200后error、缺完成事件和长度截断缺少可执行的反例判据。
- 修订：新增逐字节合流与整块同结果课堂，显式检查错误、完成原因、尾行与完成后数据。
- 修订：补四种坏流、恢复、大小和超时边界，明确只演示文本流不是完整SDK。

**八项正文证据**

- 前置与路线：作者复评通过。进程/API/模型与权重、Windows/Linux/GPU差异、目录/端口和回环边界；新实验只需Python标准库。
- 机制与状态：作者复评通过。模型加载/上下文/KV缓存/量化/并发排队/NDJSON数据路径，网络块不等记录。
- 基础实验：作者复评通过。安装、模型拉取、非流请求与性能字段、预期与清理；新增可离线复现的UTF8分片。
- 故障实验：作者复评通过。模型缺失/资源/超时/错误参数排查，新增四种流拒绝与正常恢复，不把部分输出当成功。
- 生产取舍：作者复评通过。显存与并发预算、反代认证与回环入口、版本/权重/模型许可、升级回退与可观测。
- 递进面试：作者复评通过。量化与上下文取舍、首Token与吞吐、内存不足/排队事故以及私有部署设计的递进回答。
- 独立通关：作者复评通过。专属独立通关含字段/资源/边界，新增逐字节与整块不变式、缺尾记录反例和回看机制。
- AIOps 与证据：作者复评通过。本地告警分析/RAG候选到审批，模型不等执行权限，GitHub脱敏脚本与模型版本/性能证据。

**验证边界**

- reasoned：完整阅读全文，官方Ollama streaming/errors文档复核逐行格式及200之后的流内错误。；限制：保留历史版本事实，不声称最新模型或GPU支持已验收。
- executed：新增标准库程序逐字节与整块均得到告警摘要，四类坏流被拒绝。；限制：合成字节流，不是Ollama网络调用。
- syntax：两个Python围栏compile通过。；限制：未本轮重跑旧PowerShell部署步骤。
- unrun：Ollama进程、模型下载、GPU、真实生成和生产代理均未执行。；限制：模拟不验证实际模型输出或吞吐。

第二位审校者：cloud-independent-2026-11-11；日期：2026-11-11。

- 独立审本轮差异、基础JSON/性能验收、错模型404恢复和通关；不是再次全文重审。
- 网络块非完整UTF8/NDJSON行，先按字节积累再解析；正常done_reason终态、错误中止、数据在done后与缺终态拒绝。严格要求末行换行只是本课合同，不泛化全部SDK。
- 新collect课堂在Python3.12实际运行，额外任意分块与终态后附数据反例通过；未加载Ollama/模型、未测试GPU、API或真实网络。

### Oracle Database 深讲

[打开课程](./data-ai/oracle.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：观测表和慢接口步骤把CPU列成普通等待事件，且未说明EVENT可能是最近一次等待。
- 修订：纠正CPU执行与等待区别，增加STATE/STATUS/EVENT反例、SID/SERIAL#证据与许可权限边界。

**八项正文证据**

- 前置与路线：作者复评通过。进程/内存/文件和SQL先修；无授权Oracle环境不假装部署；普通隔离PDB用户、客户端连接和配额前置。
- 机制与状态：作者复评通过。instance/database/CDB/PDB、redo/undo/SCN、RAC共享与OGG/DG数据路径、当前等待状态逐层解释。
- 基础实验：作者复评通过。两行告警固定时间/分组2、用户PDB核对、普通用户建表与清理可复现。
- 故障实验：作者复评通过。两连接FOR UPDATE WAIT3超时，回滚释放后OPEN读取；与死锁/其他超时区分。
- 生产取舍：作者复评通过。故障域矩阵含RAC/DG/OGG/AC与许可；归档净追赶、独立恢复和格式升级回退边界。
- 递进面试：作者复评通过。三分钟答案和AWR授权/实例在线/零lag/备份成功反例，说明仍欠哪些业务证据。
- 独立通关：作者复评通过。四行OPEN筛选、普通读vs锁定读、陈旧datum_time、2小时积压4小时追赶都有变化条件与判据。
- AIOps 与证据：作者复评通过。会话/SQL指纹/变更/复制/存储时间线，采证只读，RCA和HA学习证据不冒充生产。

**验证边界**

- reasoned：2026-11-11分段完整读至EOF；核对八维及变化条件独立任务后定点修正，保留已充分的专属机制/实验/生产/面试。；限制：教学覆盖不代表读者已完全掌握或可保证录用；本轮没有数据库/Redis真实服务，须自行记录实际实验。
- executed：复算redo三天5.184TB及积压144000MB/净10MBps需4小时；V$SESSION原厂字段核验。；限制：tmp/check-root-databases-2026-11-11.mjs共67项含23个PowerShell7语法块；只有明确列出的本机配置/模拟/算术，不含真实SQL计划、锁、选举、持久化、HA、恢复或生产验收。

第二位审校者：cloud-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮差异（若有）、相关机制及基础/故障实验与独立通关；不是再次全文重审。
- EVENT可能是最近等待，必须结合STATE、STATUS、时刻和阻塞关系；CPU不冒充等待事件。复核两会话锁、旧lag新鲜度、归档净追赶与许可/恢复通关。
- 独立查原厂V$SESSION确认当前/最近事件边界，纸面复核事务与容量；未连接Oracle或使用许可诊断功能。

### pandas

[打开课程](./data-ai/pandas.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：全文已有size/count机制，但早期聚合、transform和透视示例用可缺失alert_name计数却命名总告警数，可能漏计。
- 初评：默认分组空键速查建议直接fillna不够审慎；四行课堂执行sample(10)会无放回超样本报错。
- 修订：泛用计数示例改size，分组明确dropna=False披露未知身份，正式日报已严格主键非空的count保持不变。
- 修订：修正空键速查与有界抽样，新增四行计数反例及第五条双缺失变式、两种三行集合原因解释。

**八项正文证据**

- 前置与路线：作者复评通过。表结构、环境、脚本与片段、SQL占位/Parquet引擎前提，完整四文件日报与版本记录明确。
- 机制与状态：作者复评通过。Index标签对齐/CoW、dtype/缺失、merge多对多及空键、asof时间方向、window/分母/分块状态均有反例。
- 基础实验：作者复评通过。合成alerts/deployments与完整analyze脚本、严格时间/主键/枚举检查、结果预期与独占输出闭环；新计数课堂可独立运行。
- 故障实验：作者复评通过。重复负责人、空键扩张、nearest未来关联及三种日报坏输入有可回收路径；新课区分缺名称/缺服务并保留明细。
- 生产取舍：作者复评通过。内存峰值/分块可组合状态、任务互斥/输入快照/版本发布、脱敏/公式注入边界、依赖与产物回退。
- 递进面试：作者复评通过。日报恢复变好但积压增加事故，逐步行数与时区假设；新题解释count在主键已校验后何时合法。
- 独立通关：作者复评通过。4行日报复算、未来发布变式、2→拒绝→2/空键4→0+2、均值19非15、粒度口述及新计数5行变式。
- AIOps 与证据：作者复评通过。日志/告警/工单数据合同到报告与特征，缺测不补健康零、关联不是因果，合成Github证据和未知比例披露。

**验证边界**

- reasoned：完整阅读全文；Jina核对pandas官方groupby缺失键规则，并按输入行粒度复算所有新增计数。；限制：没有真实数据分析或日报发布。
- executed：五个内存课堂运行通过：标签对齐2/5、重复维表拒绝恢复2行、未来匹配1条、空键错误4接受0隔离2、新计数4/3/4/3。；限制：未执行CSV日报文件输出或外部数据库。
- syntax：本篇78个Python围栏均compile通过；定向diff通过。；限制：非独立API片段只检查语法，未顺序拼成程序。
- unrun：真实CSV读写日报、SQL/Parquet、生产调度与发布互斥未运行。；限制：不能把内存演示说成线上验收。

第二位审校者：cloud-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮差异、相关机制及基础/故障实验与独立通关；不是再次全文重审。
- size/count与分组缺失键是两类不同分母，主日报已验证非空ID所以count合理；抽样上限修复避免四行取十行失败。复核CSV时区/asof时间方向、独占报告和通关。
- 独立执行4/3/4/3及新增双空第五行变式，完整行5/有名3通过；未实际发布CSV日报。

### PostgreSQL 深讲

[打开课程](./data-ai/postgresql.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：pg_isready之后未截断失败，也未解释错误用户名和库名仍可能得到接受连接状态。
- 修订：在readiness之后新增停止门槛及psql实际身份查询，解释ON_ERROR_STOP和本地连接验证范围。

**八项正文证据**

- 前置与路线：作者复评通过。从值班台账解释三种成功，PostgreSQL17与current分开，Docker和psql/SQL入口明确。
- 机制与状态：作者复评通过。行约束/JSONB、语句与事务快照、vacuum/回卷/WAL/槽/检查点、SKIP LOCKED及租约边界。
- 基础实验：作者复评通过。新容器唯一键重复登记、条件更新、十万行索引对比与快照可见性，预期和清理明确。
- 故障实验：作者复评通过。两会话锁超时与第三会话blockers，主动回滚恢复并RESET超时，区别失败事务状态。
- 生产取舍：作者复评通过。work_mem操作数乘并发，复制旧主隔离、归档恢复时间线、权限与扩展升级及新写入回切。
- 递进面试：作者复评通过。定义到低CPU等待、vacuum不缩文件、读己之写、任务领取后的外部幂等有连续追问。
- 独立通关：作者复评通过。两个新键、变更首次快照时点、40×15超过450连接预算、WAL异常和未知结果均有判据。
- AIOps 与证据：作者复评通过。接口P99/连接池/锁/WAL/变更同轴，学习SQL计划与故障笔记和未实跑范围明确。

**验证边界**

- reasoned：2026-11-11分段完整读至EOF；核对八维及变化条件独立任务后定点修正，保留已充分的专属机制/实验/生产/面试。；限制：教学覆盖不代表读者已完全掌握或可保证录用；本轮没有数据库/Redis真实服务，须自行记录实际实验。
- executed：Compose真实解析；提取原样PowerShell，创建/就绪/身份失败均阻止进入交互SQL；100行和连接预算复算。；限制：tmp/check-root-databases-2026-11-11.mjs共67项含23个PowerShell7语法块；只有明确列出的本机配置/模拟/算术，不含真实SQL计划、锁、选举、持久化、HA、恢复或生产验收。

第二位审校者：cloud-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮差异（若有）、相关机制及基础/故障实验与独立通关；不是再次全文重审。
- pg_isready仅探测服务；新增ON_ERROR_STOP实际查询和逐步退出码门禁阻止就绪/认证失败后继续。复核课堂状态条件更新、锁超时/ROLLBACK、MVCC快照与连接预算。
- 独立核对官方pg_isready；以假Docker执行原PS的正常/创建失败/就绪失败/身份失败四分支，只有正常进入交互；无真实SQL。

### PyTorch 技术栈深讲

[打开课程](./data-ai/pytorch.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：完整读稿后发现evaluate将精确率/召回率零分母替换为1，掩盖了指标未定义；历史故障输出尚需明确日期。
- 初评：主实验已正确clone最佳参数，但读者未通过反例理解state_dict浅引用与detach不复制。
- 修订：零分母改None并说明JSON null与分母计数，澄清历史输出并补本轮当前正文CPU完整复跑范围。
- 修订：新增state_dict引用/只detach/clone快照2→3→恢复2的可运行反馈与连续更新变式。

**八项正文证据**

- 前置与路线：作者复评通过。CPU先行、隔离依赖、张量形状类型设备、模型与框架区别；GPU与分布式另列前提。
- 机制与状态：作者复评通过。视图存储/求导累积/参数Buffer/模式、Loader与Sampler、AMP/compile/SDPA、状态和浅引用因果均解释。
- 基础实验：作者复评通过。完整合成4000数据train/predict、2800/600/600、BCE/训练统计Buffer、有限值与验收后元数据、保存重载差异。
- 故障实验：作者复评通过。NaN进入模型前拒绝再可信回放；NaN评估/标签形状/空Loader均验证；新增快照误用及恢复可复现。
- 生产取舍：作者复评通过。DDP/FSDP2状态通信、发布单写者/同步边界、16GB状态估算、分布式恢复、制品供应链/灰度联合回退。
- 递进面试：作者复评通过。五亿指标评分设计与建议暴涨8倍事故，10组递进机制追问；快照与完整恢复明确区别。
- 独立通关：作者复评通过。五关数据划分/尾批/梯度-36/错误输入/256全局batch与恢复预算，新增引用与快照计数变式。
- AIOps 与证据：作者复评通过。指标窗口训练/延迟标签/候选风险到审批和回放，字段/单位/阈值联合制品，合成满分不冒充业务能力。

**验证边界**

- reasoned：完整阅读全文；gh核对PyTorch v2.13.0 Module state_dict源码浅拷贝/引用说明。；限制：版本快照保留，不宣称是部署当天最新安全版本。
- executed：新临时环境Python3.12.14/Torch2.13.0+cpu/NumPy2.5.4完整训练、文件保存重载、预测、故障拒绝回放通过，TP294/TN306/FPFN0、reloaddiff0、prob0.999119；3种评估坏输入与快照3/3/2恢复2实跑。；限制：正文通过临时模块执行，文件输出位于tmp/pytorch-refresh-r0564ja2；未启动网络服务。
- syntax：正文Python围栏均进行compile检查，定向diff通过。；限制：非独立API片段编译不代表可直接运行。
- unrun：GPU/MPS/ROCm/AMP/compile/DDP/FSDP2/DCP与生产部署未执行。；限制：CPU合成实验不能替代设备容量与真实模型评估。

第二位审校者：cloud-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮差异、相关机制及基础/故障实验与独立通关；不是再次全文重审。
- 零分母precision/recall返回None且JSON可表达null，混淆计数仍保留；state_dict浅拷贝、detach共享与clone快照分开，未将普通张量方案外推所有自定义状态。复核evaluate输入门禁与训练/重载通关。
- 独立在现有CPU环境运行文章快照原代码，引用3/快照2及恢复2通过；作者全训练回归不冒充独立复跑。

### RabbitMQ 深讲

[打开课程](./data-ai/rabbitmq.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：Confirm首定义易误导为一定成功入目标队列；Ready被称队列深度与总messages边界不清。
- 修订：澄清不可路由仍有协议confirm、mandatory return先于ack与Pika异常层；补两卡反例，澄清messages不重复加unacked。

**八项正文证据**

- 前置与路线：作者复评通过。固定Rabbit4.3.4/Pika1.4.2、新目录/项目/卷与本机监听，双终端步骤
- 机制与状态：作者复评通过。Exchange/Binding/Queue、confirm与return、消费ack/事务/4.3队列机制
- 基础实验：作者复评通过。完整producer/worker、SQLiteInbox与工单同事务、稳定内容摘要冲突检测
- 故障实验：作者复评通过。提交前/后崩溃、重复/毒消息、只读数据库验收及精确项目清理
- 生产取舍：作者复评通过。多数派队列与Khepri分开、死信保证/策略不叠加、容量与蓝绿数据回切
- 递进面试：作者复评通过。确认/路由/幂等/多数派与下游瓶颈分层递进答案
- 独立通关：作者复评通过。三发两工单、错误路由、同键不同内容冲突、5集群3成员故障与13.73GiB
- AIOps 与证据：作者复评通过。告警多队列但非物理隔离、Runbook权限重验、死信重放有界

**验证边界**

- reasoned：逐篇完整正文审读，核对技术专属机制、双实验、教师反馈、独立迁移题与验证限制。；限制：未运行真实消息服务或 Docker 产品实验；离线模型与算术复跑结果见本条后续 executed 记录，不能扩大为生产验证。
- executed：node tmp/check-foundation-message-platform-2026-11-11.mjs：27项Python/SQLite处理与反例断言、48段PowerShell AST、14项容量/集合算术全部通过。Kafka原文位置模型、ZooKeeper原文隔离模型及删判断失败/恢复、RabbitMQ提取原文handler并模拟AMQP回调验证。；限制：Python3.15.2/PowerShell7.6.9；RabbitMQ只用内存SQLite和模拟通道/退出，不是Pika连接、进程崩溃、代理重投/死信或HA验证。未执行Docker消息产品实验，PS仅语法检查。

第二位审校者：cloud-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮差异（若有）、相关机制及基础/故障实验与独立通关；不是再次全文重审。
- 不可路由仍可能confirm，mandatory的return先于ack而Pika报告UnroutableError；总messages含ready/unacked不重复相加。复核producer确认异常路径和基础/崩溃/恢复/通关。
- 独立查RabbitMQ官方确认时机，静态检查Pika脚本和故障窗口；未建立Pika连接，未独立执行作者SQLite回调测试。

### RAG

[打开课程](./data-ai/rag.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：全文的后半篇已解释重排成本与召回分母，但前半篇仍断言重排降低成本、把recall写成是否命中，存在教学矛盾。
- 初评：已有引用身份校验与支持度边界，尚缺一份逐句可批改的反例。
- 修订：修正前半篇重排成本条件，分列hit@k与recall@k。
- 修订：补充同一真实引用下三种答案的逐句批改、假设变成根因/只读变成写操作/遗漏限制三类错因，以及环境和撤权变式。

**八项正文证据**

- 前置与路线：作者复评通过。向量、片段、索引从零说明；离线标准库与付费API路径分开，专用目录环境、模型权限与外发边界明确。
- 机制与状态：作者复评通过。入库/查询双链、切分与元数据、模型空间/索引发布、召回排序上下文生成分层，修正评价分母和成本条件。
- 基础实验：作者复评通过。两合成Markdown完整输入、ingest/inspect/ask完整文件，预期五片段与订单三个；另有无API证据门禁。
- 故障实验：作者复评通过。移除唯一授权证据不越权借用团队b，恢复命中；新引用批改暴露身份正确但支持错误，清理仅教学集合。
- 生产取舍：作者复评通过。版本化原文/解析/向量/索引、删除与权限缓存、6.144GB向量下限与并发60/120、只读降级/配对回滚。
- 递进面试：作者复评通过。新手册旧答案事故分层取证，设计每日更新系统；三分钟回答与追问分清检索完整性、事实支持、授权与自动执行。
- 独立通关：作者复评通过。五关包含模型错配、片段删除、身份/支持分别检查、容量及75%证据/50%完整题复算；新增三答批改与环境变式。
- AIOps 与证据：作者复评通过。Runbook/告警/工单证据到建议，模型不获生产写权限，学习材料保存合成文档、版本与未运行边界。

**验证边界**

- reasoned：逐段完整阅读全文，IR官方定义复核分母；新支持度练习逐句对照合成原文，未新增模型API事实。；限制：人工样题不证明自动支持度模型可靠。
- executed：标准库证据门禁实跑normal evidence_only、缺失insufficient_evidence、恢复pool-v1。；限制：无向量库和真实模型调用。
- syntax：本篇12个Python块compile通过，五篇共151块/16个内存程序。；限制：外部客户端API语法通过不等于运行。
- unrun：Chroma/OpenAI完整入库问答和多租户缓存/生产发布未执行。；限制：未产生付费调用，不把本地门禁当生成质量验收。

第二位审校者：cloud-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮差异、相关机制及基础/故障实验与独立通关；不是再次全文重审。
- 引用存在与主张支持分开，逐句保留适用前提/禁止操作；重排成本为条件结论，权限撤销不能由缓存绕过。复核证据门禁、build_ready边界与通关。
- 独立运行标准库正常/缺失/恢复门禁；新支持度题作人工逐句复核，无真实模型生成或自动事实核验。

### Redis

[打开课程](./data-ai/redis.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：去重样例只有服务/名称/实例/严重度，可能跨租户合并并吞掉五分钟内恢复通知。
- 修订：指纹加入可信租户与单条通知状态；新增firing/resolved/另一租户变式，并指出同一新周期、乱序和外部效果仍未解决。

**八项正文证据**

- 前置与路线：作者复评通过。短期记事本解释键/进程/端口，Docker基线和7.4扩展命令范围，Python虚拟环境不混用。
- 机制与状态：作者复评通过。RESP与请求排队、TTL/淘汰/删除、事务不回滚、Stream PEL、缓存旧回填/租约fencing层次清楚。
- 基础实验：作者复评通过。固定容器去重程序与TTL/WRONGTYPE实验，有输入前提、预期、精确键清理和失败分支。
- 故障实验：作者复评通过。消费者领取不ACK、第二消费者新消息读取空、XAUTOCLAIM接管、XACK后PEL0但XLEN1。
- 生产取舍：作者复评通过。RSS/持久化COW/复制backlog、Sentinelquorum、Cluster槽、安全隔离和升级数据格式回退。
- 递进面试：作者复评通过。慢日志空/blocked_clients、异步复制/WAIT、旧锁持有者、旧缓存回填均有机制答案。
- 独立通关：作者复评通过。新键TTL覆盖、MULTI运行时错误不撤销、两条pending、60万键和3.6GBbacklog变式判据。
- AIOps 与证据：作者复评通过。新增恢复不被故障通知去重抑制，真实Webhook逐条状态与可信租户；模型缓存版本和工单证据职责明确。

**验证边界**

- reasoned：2026-11-11分段完整读至EOF；核对八维及变化条件独立任务后定点修正，保留已充分的专属机制/实验/生产/面试。；限制：教学覆盖不代表读者已完全掌握或可保证录用；本轮没有数据库/Redis真实服务，须自行记录实际实验。
- executed：Python3.12运行正文完整去重代码，内存替身8项验证重复/恢复/租户/字段歧义/顺序/新周期限制/连接异常；未启动Redis。；限制：tmp/check-root-databases-2026-11-11.mjs共67项含23个PowerShell7语法块；只有明确列出的本机配置/模拟/算术，不含真实SQL计划、锁、选举、持久化、HA、恢复或生产验收。

第二位审校者：cloud-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮差异（若有）、相关机制及基础/故障实验与独立通关；不是再次全文重审。
- 课堂通知键加入可信租户与单条阶段，明确不同于AM指纹且未解决新事件周期；原子登记资格不冒充消息送达。复核TTL、PEL、事务不回滚与净追赶通关。
- 独立用内存Redis替身执行原去重代码，重复/恢复/租户/新周期限制及连接异常传播通过；未运行Redis。

### scikit-learn

[打开课程](./data-ai/scikit-learn.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：完整读稿发现前半篇rolling/pct_change片段直接跨所有行计算，与后半篇服务窗口合同不一致；混合服务会串值，dropna还会掩盖历史不足。
- 初评：故障速查表仍把调contamination作为异常多少的直接修复，与后文先排数据故障原则冲突。
- 修订：窗口片段改为服务/时间排序和组内transform，明确3观测值非3分钟，保留window_ready与非有限值筛选，不覆盖原始明细。
- 修订：修订contamination速查建议与异常检测任务选择，新增四行跨服务均值错题、身份对齐和打乱输入变式。

**八项正文证据**

- 前置与路线：作者复评通过。CPU课堂、CSV/schema/train/detect顺序、片段非独立程序、虚拟环境与PowerShell不激活路径明确。
- 机制与状态：作者复评通过。估计器与转换状态、IF路径/offset、Pipeline边界、编码、组时拆分/交叉验证、增量学习和持久化安全；修复组内窗口机制。
- 基础实验：作者复评通过。八行CSV和完整数据合同/训练/检测，模型与表独占创建，明确同批检测非泛化；新增窗口四行反证可独立运行。
- 故障实验：作者复评通过。列交换、比例25、非有限/负值、阈值超预算与组串数据都有预期、拒绝/修复路径和清理。
- 生产取舍：作者复评通过。特征源/模型副本/线程预算、超时降级、可信版本包/金样本、状态偏移量、输入与模型匹配回退。
- 递进面试：作者复评通过。1000窗口服务、发布单位变化事故、Pipeline不能修业务合同、分数非概率/重要性非因果连续追问。
- 独立通关：作者复评通过。八行身份核对、score-offset、合同多故障、800MiB下限与增量接口五关；新窗口错题要求变序后相同事件结果不变。
- AIOps 与证据：作者复评通过。可用特征窗口到异常候选/人工标签，阈值非事故真值，回放仅影子不重复工单。

**验证边界**

- reasoned：完整阅读全文；web查pandas官方3.x分组rolling接口，旧文档路径404后替换为已核验有效链接。；限制：没有用旧链接或经验冒充当前API核验。
- executed：专用Python3.12.14/sklearn1.9.1实跑列合同模型：正常[1]、拒绝错序、恢复[1]；阈值1/4提醒；新分组反馈555对105/1050及缺失通过。；限制：内存合成训练与演示，不是生产预测或持久化证明。
- syntax：本篇41个Python围栏均compile通过（含明确非独立片段）；定向diff通过。；限制：变量和外部依赖完整性不由compile保证。
- unrun：八行IF完整文件读写及持久化train/detect尚未运行，在线服务未部署。；限制：不能用内存逻辑回归模型替代IF及文件闭环验收。

第二位审校者：cloud-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮差异、相关机制及基础/故障实验与独立通关；不是再次全文重审。
- 分组排序后transform按原索引对齐，三行不等于三分钟；历史不足/零前值不能填健康零。复核列合同故障、contamination与原始分数、持久化/并发预算通关。
- 独立执行四条分组反例及打乱顺序变式，555与105/1050、缺失和身份守恒通过；不等于IF完整文件闭环。

### Apache Spark 深讲

[打开课程](./data-ai/spark.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：空输入的坏行计数为零，原代码仍可覆盖旧结果；固定schema默认忽略CSV表头，窄依赖说明的观察方向不准确。
- 修订：新增非空输入拒发布、表头位置和大小写核对、FAILFAST并解释非全能数据合同；新增空表与错表头故障回归；按官方澄清窄依赖方向及SparkR弃用边界。

**八项正文证据**

- 前置与路线：作者复评通过。线程/进程/容器/三行告警起步，Python/Docker链接和Windows首跑路径齐全，local2不冒充双机器。
- 机制与状态：作者复评通过。Driver到Catalyst/DAG/任务及Shuffle/内存/重算；窄依赖从子分区回溯，状态与外部副作用分开。
- 基础实验：作者复评通过。CSV→字段校验→严重告警聚合→JSON输出，2条结果与计划验证；非空及表头门禁先于写出。
- 故障实验：作者复评通过。坏级别/坏时间/空输入/错表头失败并保留旧输出证据，修复原样本重跑，清理只在专用目录。
- 生产取舍：作者复评通过。JVM/Python/overhead容量、倾斜/AQE限制、批流隔离、checkpoint兼容、不可变输入与幂等发布。
- 递进面试：作者复评通过。多种长尾反证、加盐均值合并、扩容串行段、Driver恢复与exactly-once连续追问有答案指导。
- 独立通关：作者复评通过。五条变式order2/inventory1、均值1.9802非50.5、独立坏时间、60GiB基础预算与AQE/重放五关。
- AIOps 与证据：作者复评通过。Application/attempt/stage/batch/数据版本关联；质量与性能两套验证，不拿旧输出当本轮成功。

**验证边界**

- reasoned：2026-11-11逐段全文读至EOF，核对八维与变式后定点修正，保留已充分的机制、生产、面试和独立通关讲解。；限制：不以字数或文档评测保证完全掌握/录用；真实环境、源和接收端语义仍需学习者独立验收。
- executed：官方CSV/窄依赖/4.2.0兼容页核对；原文Python AST，literal非空guard3种本地DataFrame替身，3种独立计数模型及容量算术；未执行真实PySpark读取器、Spark运行或表头失败。；限制：本轮tmp/check-root-big-data-2026-11-11.mjs共57项，含12个PS7语法块；只有明确列出的本地配置、替身和算术检查，不能当作真实计算引擎或生产验证。

第二位审校者：cloud-independent-2026-11-11；日期：2026-11-11。

- 独立审本轮差异、完整PySpark程序与运行/坏行/空输入/错表头实验、故障清理及通关；不是再次全文重审。
- 独立读取4.2.0官方CSV与NarrowDependency：enforceSchema=false按位置/大小写校验表头、FAILFAST不是全业务合同；窄依赖从子回溯父。空输入先于overwrite拒绝，而全warning的合法空汇总应允许，旧输出不冒认本轮通过。
- 独立复跑root57项脚本，Spark原文AST与literal非空guard三Frame替身、三计数模型、均值与内存复算通过；没有执行真实Spark CSV解析器/表头失败、SQL引擎或分布式恢复。

### Tencent TCE 数据库、缓存、消息与数据平台技术地图

[打开课程](./data-ai/tce-data-middleware.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：全文有完整厂商边界、数据链和双实验；后半版本例只用事件ID集合，不像前半SQLite例会识别同ID异内容，容易把合同冲突确认为成功。
- 初评：缺少同版本反向删除与布尔假版本的教师批改。
- 修订：版本例保存ID对应合同，先校验字段/类型，再拒绝同ID异内容和同版本相反删除状态；冲突不改变记录。
- 修订：新增三种反例和版本九合法复活/业务禁止复活的变式，分开身份、版本、状态机与权限。

**八项正文证据**

- 前置与路线：作者复评通过。TCE公私云能力与BOM/授权/版本分开；数据库/缓存/消息/索引/对象职责，Python标准库无需真实平台。
- 机制与状态：作者复评通过。权威字段、Outbox/CDC、Inbox事务、缓存竞争/索引版本/重复乱序/删除事实与恢复点；修正冲突门禁。
- 基础实验：作者复评通过。仓库lab正常合成事件、SQLite本地事务完整程序和版本事件程序，精确结果与清理。
- 故障实验：作者复评通过。重复事件、事务中断、业务主键冲突、旧版本与删除回放、新三类契约冲突，恢复后duplicate保持。
- 生产取舍：作者复评通过。共同下游预算、净追赶、权威恢复点、派生重建、权限/密钥/审计、兼容演进与跨层回退数据。
- 递进面试：作者复评通过。多组件十秒一致验收、数据库消息索引不同时点恢复、缓存竞争、产品交付证据和架构取舍。
- 独立通关：作者复评通过。五关含1/0重复计数、随机ID与旧快照区别、冲突不可ACK、3500超3000与3600秒算式；新增状态合同反例。
- AIOps 与证据：作者复评通过。业务事件ID与版本证据链、积压年龄和对账、低基数指标、模型不可因组件绿灯宣告业务恢复。

**验证边界**

- reasoned：逐段完整阅读全文及仓库lab.py；本轮仅修改自定义内存合同，没有新增TCE产品能力事实。；限制：既有公开资料不替代现场BOM和版本取证。
- executed：仓库lab正常handled1/duplicates0及fault handled1/duplicates1；SQLite retry/0/handled/duplicate/1与冲突断言；版本程序3项拒绝且删除保留，移除版本检查触发AssertionError。；限制：全部内存标准库模拟，不含真实消息ACK或分布式事务。
- syntax：两个Python代码块执行通过，定向diff检查。；限制：没有产品控制台与数据库客户端检查。
- unrun：真实TCE数据库/缓存/消息/索引、部署、压测和灾备未执行。；限制：不能以本地模拟冒充厂商性能或交付验收。

第二位审校者：cloud-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮差异、相关机制及基础/故障实验与独立通关；不是再次全文重审。
- 去重键绑定合同内容、同版本相反状态及bool版本拒绝，检查早于修改去重状态；更高版本是否复活仍由业务状态机决定，单线程字典不冒充原子分布式提交。
- 独立运行新版本顺序程序，重复/旧版阻断和三冲突拒绝通过；复核Outbox/恢复预算通关，未接入真实TCE。

### Tencent TDSQL-C MySQL 技术栈深讲

[打开课程](./data-ai/tdsql-mysql.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：容器清单失败可能当作空；读取SQL与导入同管道可能漏报读取失败；命令序号说明已错位。
- 修订：预检清单退出码；SQL预读ErrorActionStop及非空校验；导入/业务查询/镜像标识逐项停止；按命令名解释验证边界。

**八项正文证据**

- 前置与路线：作者复评通过。先分TDSQL-C/其他家族/自建MySQL，TCE按BOM而非Docker安装生产；宿主/客户端/双连接前置。
- 机制与状态：作者复评通过。事务与条件状态、MVCC首次快照、锁/死锁、索引页、日志池与代理、产品兼容边界。
- 基础实验：作者复评通过。读取已核对initSQL后新容器提交ACKED2，错误停止，查询与镜像证据及收回顺序明确。
- 故障实验：作者复评通过。单行三秒等待、两行死锁环和双会话快照，回滚/再做新事务/专属表清理，受害者不固定。
- 生产取舍：作者复评通过。连接20×40预算、日志追赶、DDL窗口、HA/数据保护合同、权限和隔离备份恢复。
- 递进面试：作者复评通过。产品形态/CPU低等待/外部事务/切换验收和未知COMMIT递进到证据与原厂权限。
- 独立通关：作者复评通过。9002条件更新、首次快照变化、死锁vs超时、450连接预算每池22、恢复校验均有判据。
- AIOps 与证据：作者复评通过。事件状态与Outbox/幂等贯通采集与自动化，脱敏SQL/计划/锁/恢复证据独立记预期与实测。

**验证边界**

- reasoned：2026-11-11分段完整读至EOF；核对八维及变化条件独立任务后定点修正，保留已充分的专属机制/实验/生产/面试。；限制：教学覆盖不代表读者已完全掌握或可保证录用；本轮没有数据库/Redis真实服务，须自行记录实际实验。
- executed：原样PS块11分支模拟version/list/已有容器/空SQL/读取失败/run/ping/导入/查询/镜像失败及正常；容量和追赶复算。；限制：tmp/check-root-databases-2026-11-11.mjs共67项含23个PowerShell7语法块；只有明确列出的本机配置/模拟/算术，不含真实SQL计划、锁、选举、持久化、HA、恢复或生产验收。

第二位审校者：cloud-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮差异（若有）、相关机制及基础/故障实验与独立通关；不是再次全文重审。
- 读取SQL先失败停止/拒空，再管道导入，原生退出码覆盖列表/创建/就绪/导入/业务查询/镜像证据；本地MySQL不冒充TCE现场能力。复核锁超时、死锁及恢复通关。
- 独立对原PS块执行正常/读失败/空输入/列表失败/导入失败/查询失败六种替身分支，错误不抵达最终证据；无真实数据库。

### TensorFlow 深讲

[打开课程](./data-ai/tensorflow.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：全文已有训练/部署/恢复深度，但自算混淆矩阵和预测使用>=而Keras指标使用>，阈值相等时口径矛盾。
- 初评：预测契约未同步校验单位与比较符；指标跨批累计缺少可检验反例。
- 修订：统一严格>并写入threshold_operator，预测先校验字段/单位/阈值合同；故障输出补概率范围检查。
- 修订：新增等阈值与跨批累计/重置批改，实跑当前完整CPU训练保存重载导出预测，写明服务和GPU未运行。

**八项正文证据**

- 前置与路线：作者复评通过。张量/梯度/损失/优化器从零，CPU隔离环境、原生Windows与WSL GPU分开，输入单位与模型区别。
- 机制与状态：作者复评通过。Tape/Eager/Graph/trace、Keras层训练模式、Dataset缓存顺序、梯度与指标状态、保存格式边界；统一阈值语义。
- 基础实验：作者复评通过。6000合成数据4200/900/900、训练统计、完整train/predict、有限值门禁、保存重载容差与导出路径。
- 故障实验：作者复评通过。NaN索引1与训练中位数修复、过多缺失/负延迟/错误率8拒绝、新指标累计与重置反例；清理限定专用产物。
- 生产取舍：作者复评通过。tf.function输入签名、CPU/GPU和数据瓶颈、分布式全局batch、Checkpoint状态、Serving接口/版本合同、容量和回退。
- 递进面试：作者复评通过。每日两万服务评分架构、NaN/高分泄漏/慢推理事故与递进机制追问，不以导出成功代替服务验收。
- 独立通关：作者复评通过。五关手算梯度/步数/并行batch/坏输入/目标版本；新三样本与第二批9误报变式有明确批改。
- AIOps 与证据：作者复评通过。窗口指标与风险候选到审批、特征单位/预处理/阈值联合版本，学习证据区分真实训练与Serving空缺。

**验证边界**

- reasoned：完整阅读全文，核对TensorFlow官方Precision阈值定义。；限制：没有因新版网站就改写既有训练版本。
- executed：Python3.12.14/TF2.21.0/Keras3.15.1/NumPy2.5.4 CPU完整训练保存重载导出、预测NaN修复与3类坏输入拒绝；TP122 FP37 TN688 FN53；阈值1/.5、累计1/3、重置0。；限制：tmp/tensorflow-refresh-hjc1wgfq真实制品；没有Serving请求或GPU。
- syntax：全篇Python围栏compile通过，定向diff检查。；限制：片段语法不证明API运行。
- unrun：TensorBoard UI、Serving2.20加载、GPU/分布式、容器与生产升级回滚未跑。；限制：导出不能替代目标加载和业务测试。

第二位审校者：cloud-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮差异、相关机制及基础/故障实验与独立通关；不是再次全文重审。
- Keras严格大于阈值与手算/预测/metadata统一，先验证字段单位与比较合同再加载；按TP/FP累计而不是批精确率平均。复核训练保存重载、输出有限性和Serving候选边界。
- 独立在现有TF CPU环境运行阈值课堂，precision1/recall.5、累计1/3、重置0通过；未独立复跑训练/Serving。

### Transformer 技术栈深讲

[打开课程](./data-ai/transformer.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：全文已有充分原理、矩阵实验、生产路径和连续追问，保留长篇有效解释。
- 初评：已有Padding输出不清零的提醒，但缺少读出层如何再次犯错的具体批改与空有效集合反馈。
- 修订：新增Padding注意力屏蔽与业务汇聚两道工序的课堂，51.5/3/1.5三个结果解释输入筛选和分母，含无有效位置拒绝、改变Padding与有效位置变式。

**八项正文证据**

- 前置与路线：作者复评通过。Token/向量/位置/矩阵形状逐层解释，Python零依赖先行，框架路线独立环境且不必GPU。
- 机制与状态：作者复评通过。QKV缩放、多头/FFN/残差/归一化、三架构、标签移位、缓存绝对位置/布尔Mask/Dropout边界；新增读出分母。
- 基础实验：作者复评通过。完整attention_lab含形状/有限值/全屏蔽门禁、权重与输出预期；PyTorch随机Encoder形状验证与其边界明确。
- 故障实验：作者复评通过。去因果Mask未来权重非零退出2再恢复；新Padding汇聚反例无外部数据，空集合拒绝且有清理。
- 生产取舍：作者复评通过。KV及权重/激活分项、训练恢复状态、模型多副本故障域/准入、长短请求与Kernel证据、完整包升级回退。
- 递进面试：作者复评通过。12组定义/机制/取舍追问、长上下文遗漏且TTFT翻倍事故、企业AIOps分析服务容量设计。
- 独立通关：作者复评通过。五关手算输出/改变V/坏形状NaN/512MiB与4GiB估算/缓存对齐；新增Padding错因与1.5错误分母。
- AIOps 与证据：作者复评通过。日志分类/事故摘要/检索到受控自动化，质量不等于HTTP200，GitHub矩阵输出/容量/事故/发布清单。

**验证边界**

- reasoned：完整阅读全文；官方网页获取失败后gh读取v2.13.0 MHA源码核对key_padding_mask忽略Key语义。；限制：没有用当前2.15跳转替代2.13版本语义；无模型质量测评。
- executed：标准库基础退出0未来权重0；去遮罩退出2未来权重0.351383；新汇聚51.5/3与空有效集合拒绝实跑。；限制：手工矩阵不等于神经网络训练或真实框架执行。
- syntax：全部3个Python块compile通过；定向git diff --check通过。；限制：PyTorch随机Encoder只检查语法。
- unrun：Torch Encoder、GPU、KVCache、分布式训练、模型服务和生产回退未执行。；限制：无付费GPU或模型下载。

第二位审校者：cloud-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮差异、相关机制及基础/故障实验与独立通关；不是再次全文重审。
- Key遮罩不等于Query输出清零，平均汇聚按有效位置数，不混用MHA遮罩与业务有效布尔语义；复核随机Encoder上下文、因果故障与KV容量通关。
- 独立运行汇聚51.5/3、空集合拒绝及仅首位置变式2；手工值测试不等于Transformer训练或GPU验收。

### 向量数据库

[打开课程](./data-ai/vector-database.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：全文已详细区分精确近邻与业务相关，但评估表仍把recall@k定义成是否命中，实际混淆hit@k；只有一条expected id的示例会掩盖差别。
- 初评：缺少同一首条排名但证据完整性不同、重复片段不重复计分的可运行批改。
- 修订：修正recall@k分母，另列hit@k，precision@k说明候选不足须事先约定。
- 修订：新增验证/禁用条件双证据课堂，四指标对照、重复片段拒绝、排名与授权变式和停止高风险行动边界。

**八项正文证据**

- 前置与路线：作者复评通过。向量/维度/距离从零，零费用标准库先行；Chroma与Milvus独立目录和完整输入，Windows/WSL限制、密钥/外发/费用明确。
- 机制与状态：作者复评通过。模型空间、归一化、HNSW/IVF/量化、向量与标量索引、过滤选择性、写入可见性与版本身份；修复检索评估口径。
- 基础实验：作者复评通过。三条事故JSONL/Chroma入库查询、Milvus完整程序、模型/维度/build_ready门禁；标准库授权向量和三度量实验可独立运行。
- 故障实验：作者复评通过。维度/零/非有限、授权列表与度量方向错题，重复ID输入门禁；新评估重复候选显式失败并限定清理。
- 生产取舍：作者复评通过。原始61.44GB及双版本容量、分片副本与部分结果、版本代次/删除缓存/恢复权限、影子切换配对回滚。
- 递进面试：作者复评通过。每天十万手册设计、同维新模型找错材料事故、完整性/权限/时延联合验收；新增首条命中不等于所有条件齐全。
- 独立通关：作者复评通过。五关手算距离/MRR/容量及故障拒绝；新题改排名、重复候选、授权后重定义标注范围，具体错因与返工可检查。
- AIOps 与证据：作者复评通过。Runbook/事故索引到候选与RAG证据，历史相似不等因果，无执行条件不批准重启，学习证据区分手写向量与真实数据库。

**验证边界**

- reasoned：逐段完整阅读全文；web核对Stanford IR教材官方站的precision/recall与top-k评价，新增计分使用固定非空相关集合。；限制：没有变更OpenAI模型规格或产品部署事实。
- executed：三标准库程序实跑：授权两记录/错维拒绝/恢复1；点积余弦L2三赢家；新评估(1,.5,.5,1)到(1,1,1,1)并拒绝重复片段。；限制：没有语义模型、向量库或网络调用。
- syntax：本篇16个Python块compile通过，四篇合计139块；定向diff通过。；限制：真实客户端片段仅语法检查，不证明接口或付费服务就绪。
- unrun：Chroma/OpenAI与Milvus Lite付费/真实数据库路径、多副本HA和权限撤销仍未执行。；限制：不把离线手写向量当产品实测。

第二位审校者：cloud-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮差异、相关机制及基础/故障实验与独立通关；不是再次全文重审。
- hit/recall/precision与首条排名不能互相冒充；固定相关集合与k、拒绝重复ID的规则明确。复核授权前过滤、维度/零向量故障与匹配模型索引回滚。
- 独立运行新增评估及other/limits排名变式，(1,.5,.5,1)与倒数排名.5正确；未调用向量数据库或模型API。

### Apache ZooKeeper 深讲

[打开课程](./data-ai/zookeeper.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：全文复查未发现新的阻断缺口：已有Watch丢中间态、sync非无条件线性读、ACL不继承、旧主fencing与CAS重新计算反例。
- 修订：保留正文；不为达到改动数量增加重复章节。

**八项正文证据**

- 前置与路线：作者复评通过。3.9.5固定基线与PowerShell/Linux边界、Docker预检、两终端与znode非文件
- 机制与状态：作者复评通过。Session连接/过期、ZAB提交、普通本地读/sync、父路径顺序及ACL语义
- 基础实验：作者复评通过。znode持久/临时/顺序、一次Watch、两改仅一通知、会话关闭/叶到根清理
- 故障实验：作者复评通过。双客户端CAS拒绝旧版本再重算；离线fencing删判断应失败再恢复
- 生产取舍：作者复评通过。投票/Observer故障域、扇出、磁盘、ACL/TLS、升级日志快照与外部资格恢复
- 递进面试：作者复评通过。30秒3分钟与Session/Watch/多数派/CAS/下游旧主递进追问
- 独立通关：作者复评通过。10→8拒绝旧7后重算5；5投票+2观察只能坏2投票；扇出30000非均值
- AIOps 与证据：作者复评通过。协调依赖跨系统告警/会话与延迟证据，危险自动动作审批

**验证边界**

- reasoned：逐篇完整正文审读，核对技术专属机制、双实验、教师反馈、独立迁移题与验证限制。；限制：未运行真实消息服务或 Docker 产品实验；离线模型与算术复跑结果见本条后续 executed 记录，不能扩大为生产验证。
- executed：node tmp/check-foundation-message-platform-2026-11-11.mjs：27项Python/SQLite处理与反例断言、48段PowerShell AST、14项容量/集合算术全部通过。Kafka原文位置模型、ZooKeeper原文隔离模型及删判断失败/恢复、RabbitMQ提取原文handler并模拟AMQP回调验证。；限制：Python3.15.2/PowerShell7.6.9；RabbitMQ只用内存SQLite和模拟通道/退出，不是Pika连接、进程崩溃、代理重投/死信或HA验证。未执行Docker消息产品实验，PS仅语法检查。

第二位审校者：cloud-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮差异（若有）、相关机制及基础/故障实验与独立通关；不是再次全文重审。
- 本轮无正文diff，独立复核保留理由：Watch不是历史日志、sync非无条件最新、ACL不继承、CAS冲突重算与下游fencing均已有专属反例；复核CLI双会话/清理及通关，未见新阻断。
- 独立运行原隔离令牌模型并删除旧令牌判断得到AssertionError，原版通过；仅离线状态模型，没有ZooKeeper会话/网络分区。

### Git 深讲

[打开课程](./foundation/git.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：早期pull后冲突流程无条件add/commit，没有区分merge与rebase，会使读者停留在未完成的变基过程。
- 修订：根据git status区分两类进行中的操作，明确对应continue/abort、重复冲突和策略拒绝反例。
- 修订：增加教师纠错：冲突标记消失不等于索引已解决或整个操作结束，保留完整暂存/冲突隔离实验。

**八项正文证据**

- 前置与路线：作者复评通过。从Git/GitHub、工作区/index/提交、安装和Shell边界讲起；实验只设本地作者。
- 机制与状态：作者复评通过。对象与引用、三棵树、快进/三方合并/变基、两点三点和冲突stage解释完整。
- 基础实验：作者复评通过。临时离线仓库精确复现HEAD5/index10/working15三态，含观测和清理。
- 故障实验：作者复评通过。两个分支修改同一阈值产生UU，观察索引、业务选择25、完成合并或退出复原。
- 生产取舍：作者复评通过。公共历史、LFS/浅克隆/备份边界、密钥撤销、换行和配置回滚外部状态边界。
- 递进面试：作者复评通过。30秒/3分钟、合并无冲突非正确、轻量分支与切换IO、规则未生效多层SHA证据。
- 独立通关：作者复评通过。改20但不add预测、冲突共同祖先、公共错误告警提交设计与失败回读。
- AIOps 与证据：作者复评通过。规则/config/runbook变更审核、实际服务加载与提交/部署证据关联。

**验证边界**

- reasoned：全文审读；2026-11-11官方git-rebase确认add后continue与abort。未在真实仓库制造冲突，独立实验未本轮执行。；限制：仅核对记录中明确说明的范围，未执行的实验与生产路径不作为实测证据。

第二位审校者：root-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮差异、相关机制及实验/通关上下文，不声称再次全文重审；结合既有评测与本轮作者全文复评。
- pull恢复先按status区分merge/rebase，continue/abort匹配且不推荐hard reset；离线暂存5/10/15、合并20/30到25与证据链逻辑核对。
- 本轮未在真实仓库制造冲突、改写历史或运行完整Git练习。

### GitHub

[打开课程](./foundation/github.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：前部仍将当前知识库架构称为VitePress，只在很后位置说明React/Vite；两个示例仍使用已结束支持Node20。
- 初评：阈值实验tr删除所有换行，会把两行1和2拼成合法12，无法验证声明的一项数字输入。
- 修订：开头明确当前React/Vite与docs:build别名、历史VitePress示例边界；修订当前知识库Pages描述。
- 修订：示例Node改22并链接官方生命周期和项目engines/锁文件对齐边界。
- 修订：保留内部换行、只去末尾回车以兼容CRLF，解释末尾换行处理及多行1/2反例并加入教师纠错。

**八项正文证据**

- 前置与路线：作者复评通过。Git与平台能力分层，个人权限/额度/仓库归属先核验；当前和历史站点边界前置。
- 机制与状态：作者复评通过。base/head、审核与check、runner/job/step、事件/部署分离、webhook幂等和分页状态。
- 基础实验：作者复评通过。网页新建github-change-lab、threshold和完整只读权限workflow，SHA与具体日志验证。
- 故障实验：作者复评通过。99失败到8修复、新SHA复验、精确required checks与绕过排查；新增多行反例。
- 生产取舍：作者复评通过。供给链、pull_request_target信任、OIDC约束、外部资源备份、限流与发布多层证据。
- 递进面试：作者复评通过。30秒/3分钟及批准后新增提交、平台不可用、workflow恶意改动、部署关联设计追问。
- 独立通关：作者复评通过。重做5/99/8，排查红灯可Merge，重复/晚到部署事件推演与操作清理明确。
- AIOps 与证据：作者复评通过。告警规则来源到Issue/PR/检查/实际版本，部署事件与告警关联且回滚独立授权。

**验证边界**

- reasoned：全文审读；核对本地package.json与docs.yml实际React/Vite/Node22链路。官方Node发布页、GNU Bash命令替换文档已2026-11-11读取。未创建远端练习仓库或运行示例工作流，数字反例仅逻辑复核。；限制：仅核对记录中明确说明的范围，未执行的实验与生产路径不作为实测证据。

第二位审校者：root-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮差异、相关机制及实验/通关上下文，不声称再次全文重审；结合既有评测与本轮作者全文复评。
- 当前React/Vite与历史VitePress练习分开；工作流阈值保留内换行，不把1和2拼成12，十进制显式避免08八进制误判。
- 从正文提取Bash，5/08/99/双LF/双CRLF/单CRLF/空共7输入按预期；未创建远程仓库/运行示例Actions。

### Go（Golang）深讲

[打开课程](./foundation/golang.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：请求取消统一回408，混淆已断开/HTTP2取消与接收请求超时；select同时就绪时可能入队，缺确定的已取消前提测试。
- 修订：handler在选择前拒绝已知取消，取消分支停止工作；新增TestAlreadyCanceledDoesNotEnqueue及教师批改，说明检查后竞争、取消非回滚、Recorder状态不能作业务证据。

**八项正文证据**

- 前置与路线：作者复评通过。工具链/module/独立目录/本机端口/race C编译器与历史基线明确。
- 机制与状态：作者复评通过。值语义、内存模型、GMP、GC、所有权与本轮取消选择边界齐全。
- 基础实验：作者复评通过。标准库HTTP完整服务和测试可复现；内存202与实际处理/持久化分开。
- 故障实验：作者复评通过。共享整数race、有限20goroutine阻塞/回收，均有失败证据及恢复。
- 生产取舍：作者复评通过。队列和map基数、持久幂等、readiness、drain、版本和权限取舍清晰。
- 递进面试：作者复评通过。30秒/3分钟、运行时递进与API容量题给依据。
- 独立通关：作者复评通过。五关新输入/容量1/非法JSON/启动冲突与本轮取消反例可判分。
- AIOps 与证据：作者复评通过。告警聚合、slog、profile、指标、脱敏GitHub证据完整。

**验证边界**

- reasoned：全文2190余行逐段阅读；官方select和Request.Context复核；本地Go 1.23.5兼容模块提取正文main/test，生命周期与新增已取消测试均通过。；限制：本机只有Go1.23.5，因此测试明确将临时模块改为1.23，不冒充正文1.26.5基线；未跑race/生产服务/容器/真实负载。

第二位审校者：root-independent-2026-11-11；日期：2026-11-11。

- 本轮独立读完整diff及相关机制、完整双实验、教师批改和独立通关上下文；不是全文重复审读。独立复跑作者检查器23项全部通过。
- 取消前置检查只拒绝进入选择前已知取消；select并无文本优先级，取消和发送不原子，新增httptest不假定Recorder响应；队列/持久化/drain边界清楚。
- Go实际1.23.5兼容模块测试2个用例；非文章1.26基线、未运行race检测或真实服务压测。

### Java 技术栈深讲

[打开课程](./foundation/java.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：TicketClient.create未声明受检超时，但后续同接口调用专门catch TimeoutException，拼接后编译合同不一致。
- 修订：接口补throws TimeoutException与中文解释；增加声明/实现不抛/调用方漏处理三个预测的教师批改，区分编译契约和工单副作用。

**八项正文证据**

- 前置与路线：作者复评通过。JDK21+、JAVA_HOME/实际工具一致、独立目录和失败不跑旧class说明充分。
- 机制与状态：作者复评通过。语言/JVM/GC/JMM/类身份/线程池/取消机制和异常契约完整。
- 基础实验：作者复评通过。AlertDigest完整源码、4/2/2输出、major65、JFR路径前置与清理可复现。
- 故障实验：作者复评通过。确定性双锁故障/精确PID取证清理和完整统一锁顺序修复齐全。
- 生产取舍：作者复评通过。容器heap/native预算、库Agent认证、灰度兼容和诊断敏感性深入。
- 递进面试：作者复评通过。25类逐层追问、CPU低排队事故和告警平台设计给判断依据。
- 独立通关：作者复评通过。五条告警59/60/61阈值、旧class反例和本轮异常契约三分支可验收。
- AIOps 与证据：作者复评通过。JFR/thread dump/logs/traces串AIOps证据与GitHub脱敏交付。

**验证边界**

- reasoned：全文2113行阅读；JLS11受检异常官方复核；Oracle JDK24编译--release21运行摘要器与DeadlockFixed通过，声明+捕获通过、未声明却捕获/声明但不处理两负向编译均拒绝，共5项。；限制：本轮未重跑故意死锁/JFR或JDK25/26，原文历史实测保留为历史证据；无生产诊断。

第二位审校者：root-independent-2026-11-11；日期：2026-11-11。

- 本轮独立读完整diff及相关机制、完整双实验、教师批改和独立通关上下文；不是全文重复审读。独立复跑作者检查器23项全部通过。
- TicketClient明确throws使受检异常catch可编译；接口合同不证明远程无副作用。读摘要/死锁/固定锁实验与历史运行边界，固定版移除相反锁与栅栏，清理精确PID。
- 实际JDK24 --release21编译摘要与修复版、受检异常声明/未声明/漏处理三分支；本轮未启动故障JVM或录制JFR。

### Linux 深讲

[打开课程](./foundation/linux.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：早期swap段容易把占用存量直接解释为当前内存压力，与后文更精确解释冲突。
- 初评：iostat await没有说单位与排队/服务总时长，且未前置首报自开机累计边界，会污染短时故障推理。
- 修订：swap前置存量/速率/业务影响区分和避免swapoff风险。
- 修订：补await定义与-y三段采样、教师时间窗反例，保留既有进程暂停实验和配额/PSI高级层。

**八项正文证据**

- 前置与路线：作者复评通过。内核/发行版/用户态分层，普通用户Linux/WSL工具前检与系统管理章节分离。
- 机制与状态：作者复评通过。系统调用、状态/信号、虚拟内存、inode/fd、cgroup配额、PSI与原子替换/持久化。
- 基础实验：作者复评通过。只绑定loopback的Python临时HTTP服务，独有目录、端口检查、PID/监听/正文闭环。
- 故障实验：作者复评通过。仅STOP本次PID观察T与curl超时，CONT恢复后正文校验，CONT/TERM/wait及目录收尾。
- 生产取舍：作者复评通过。父控制组限额、故障接管余量、日志缓冲/丢弃策略、安全身份与内核升级回退。
- 递进面试：作者复评通过。30秒/3分钟与高load低CPU、主机有余量容器OOM、df/du差异的证据链。
- 独立通关：作者复评通过。暂停前预测、同PID归属、16核/2核配额设计题，明确不把暂停当D状态或生产实测。
- AIOps 与证据：作者复评通过。主机/容器范围、采样单位/累计重置与模型输入契约，告警到系统证据链。

**验证边界**

- reasoned：全文审读；2026-11-11读取sysstat iostat官方手册镜像核验await和-y/首报。未运行Linux实验、未向主机发信号，均为文档和公式审校。；限制：仅核对记录中明确说明的范围，未执行的实验与生产路径不作为实测证据。

第二位审校者：root-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮差异、相关机制及实验/通关上下文，不声称再次全文重审；结合既有评测与本轮作者全文复评。
- iostat官方核对首报累计/-y后区间及await含排队服务时间；swap存量不等于当前换页压力；暂停实验不冒充D状态。
- 未执行Linux进程暂停、设备采样或主机写入；新增为机制核对。

### Markdown

[打开课程](./foundation/markdown.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：正文提供的技术深讲缩略模板仍遗漏故障实验、生产设计和独立通关，易被读者误当现行完整写作标准。
- 初评：阶段4把构建通过单独列为证据，缺少相邻的页面可用与线上边界。
- 修订：为缩略模板链接权威标准/模板，补必要学习结果和教师返工反例，明确不按空标题验收。
- 修订：阶段4加入目录/链接/复制可用证据并区分本地构建与线上部署。

**八项正文证据**

- 前置与路线：作者复评通过。本地编辑器围栏实验不需服务器；仓库构建确认package/lock/Node/npm依赖与真实构建链路。
- 机制与状态：作者复评通过。块/行内解析、围栏、列表缩进、GFM管道、源码与路由分层清楚。
- 基础实验：作者复评通过。学习记录完整样本、独立最小结构、构建与精确Git文件；预期与实测区分。
- 故障实验：作者复评通过。四/三围栏失配→后续标题被吞→补四围栏→预览和复制复测→只清理临时笔记。
- 生产取舍：作者复评通过。源文件/HTML/索引、提交部署缓存、RAG版本权限、撤回和旧版回滚有具体路径。
- 递进面试：作者复评通过。30秒/3分钟、万篇runbook设计、构建绿页面错及模型推荐旧指令事故有推理。
- 独立通关：作者复评通过。新三列表格/管道/围栏结构判据和本轮模板反例，要求不口头补隐藏步骤的他人走读。
- AIOps 与证据：作者复评通过。runbook/复盘/实验/RAG证据不执行指令；脱敏提交且不把关键词或长度当质量。

**验证边界**

- reasoned：全文按四段读至EOF，核对围栏嵌套、模板与当前标准一致性及本地/远程证据边界。；限制：没有本轮运行编辑器预览或新建Git学习记录，也未执行例示命令；新增是教程结构及验收逻辑修订。

第二位审校者：root-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮差异、相关机制及实验/通关上下文，不声称再次全文重审；结合既有评测与本轮作者全文复评。
- 缩略模板链接正式标准并补双实验、生产/面试/通关，非靠标题验收；围栏故障用本仓库marked正常2标题、失配1、修复2实测。
- 解析器实验仅证明本地语法树；未执行编辑器交互或远程发布。

### 网络基础

[打开课程](./foundation/networking.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：HTTP408表格把网关超时列作通用解释，没有区分收齐客户端请求的等待与504等待上游响应。
- 修订：准确区分408/504等待对象，加入慢上传/快上传慢处理的技术专属反例、教师证据追问和RFC来源。
- 修订：保留已充分的累计时间拆解、SNI不等于验证、HTTP200/404/拒绝实验与独立迁移题，没有重复扩写。

**八项正文证据**

- 前置与路线：作者复评通过。从URL/地址/端口/分层开始，Bash与PowerShell分支，DNS/TLS公网实验及本地替代界限。
- 机制与状态：作者复评通过。DNS/NSS缓存、TCP流/窗口/拥塞、TLS验证、代理分段、MTU/NAT/重试与幂等。
- 基础实验：作者复评通过。本地Python双终端绑定loopback，health文件200与missing404，正文/日志验证和端口故障处理。
- 故障实验：作者复评通过。只停自己服务造成连接拒绝，重启同服务验证；脚本非法协议/非2xx退出码独立检验。
- 生产取舍：作者复评通过。跨区超时预算、共享出口连接状态、证书信任、安全探测、灰度失败实例、回退与观察点。
- 递进面试：作者复评通过。30秒/3分钟、去回程不一致、502实例分布、重复写和大响应失败递进证据。
- 独立通关：作者复评通过。ready-v2新文件/未知路径/停机三态、file协议拒绝、累计时间0.1/0.4/0.7预算推导。
- AIOps 与证据：作者复评通过。Prometheus探测、分段延迟、证书监控、缺数据不是零、有限制脚本与安全恢复衔接。

**验证边界**

- reasoned：全文审读；2026-11-11官方RFC9110核验408/504原义。未本轮运行网络实验、抓包或公网探测，未改系统网络配置。；限制：仅核对记录中明确说明的范围，未执行的实验与生产路径不作为实测证据。

第二位审校者：root-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮差异、相关机制及实验/通关上下文，不声称再次全文重审；结合既有评测与本轮作者全文复评。
- RFC9110核对408收请求与504等上游角色；本地200/404/拒绝实验与分层排障一致，状态码不能独立证明根因。
- 本轮未抓包/改网络/执行服务实验；仅文档与官方定义审校。

### Python

[打开课程](./foundation/python.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：API字典把非200笼统当错误，未在邻近教学明确204空正文、500合法JSON与200错误页的不同判据。
- 修订：改状态码条目按接口合同判定，补三张响应卡教师纠错、raise_for_status/JSON/业务三层与禁止盲重试。

**八项正文证据**

- 前置与路线：作者复评通过。Python3.11+标准库、解释器路径、空目录及命令行入口明确。
- 机制与状态：作者复评通过。对象共享、可变默认、生成器/GIL/with/时间/取消与输入合同深入。
- 基础实验：作者复评通过。完整日报函数、四条样例4/3/1计数与独占输出有验证。
- 故障实验：作者复评通过。空/错形状/无时区/恢复和可变默认故障闭环齐全。
- 生产取舍：作者复评通过。分页水位、整体预算、原子发布、敏感输出和依赖回滚均有边界。
- 递进面试：作者复评通过。30秒/3分钟与类型提示/虚拟环境/并发连续追问有答案。
- 独立通关：作者复评通过。五条新输入、阈值4、拒绝覆盖及三张HTTP响应反例需独立判断。
- AIOps 与证据：作者复评通过。告警日报接metrics/logs/API/模型，证据目录和真实验证分层。

**验证边界**

- reasoned：全文2030余行阅读；Requests官方JSON/status边界复核；Python3.15.2提取脚本实际跑正常、空、错形状、缺时区、错误级别、相同输入输出、禁止覆盖和阈值0等9项检查。；限制：未调用外部API/安装新包/执行真实定时任务；合成HTTP响应卡是推演，非真实联调。

第二位审校者：root-independent-2026-11-11；日期：2026-11-11。

- 本轮独立读完整diff及相关机制、完整双实验、教师批改和独立通关上下文；不是全文重复审读。独立复跑作者检查器23项全部通过。
- 状态码与JSON解析/业务合同区分正确；204不硬解码、500合法JSON不当成功；日报完整输入校验/独占输出/错误副本恢复和独立新输入有证据。
- 独立执行标准库日报正常/空/错形状/无时区/坏等级/同输入输出/拒覆盖/非法阈值；未访问真实API或验证生产分页。

### RESTful API 技术栈深讲

[打开课程](./foundation/restful-api.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：版本段仍称3.2.0最新和-07过期为当前工作状态；401修复建议无条件恢复旧密钥；自定义幂等合同与草案有格式/冲突码差异未明确。
- 修订：更新核验到2026-11-11：OpenAPI3.2.1已发布、示例仍固定3.2.0；Idempotency-Key -08活跃；补自定义合同/草案区别、撤权重放反例和泄露密钥不得恢复信任；修正加权限流错词。

**八项正文证据**

- 前置与路线：作者复评通过。Node20语法最低/受支持版本、PowerShell7.3、端口归属和仅本机监听明确。
- 机制与状态：作者复评通过。REST约束、缓存/条件请求/事务发件箱、请求状态与幂等边界完整。
- 基础实验：作者复评通过。标准库完整服务可本地运行，GET/304/201重放和Header均有验收。
- 故障实验：作者复评通过。412/428/真正并发竞争、恢复检查与有界fetch组成故障闭环。
- 生产取舍：作者复评通过。多租户跨区、共享幂等原子状态、安全/容量/灰度与本轮密钥撤销边界深入。
- 递进面试：作者复评通过。12类连续追问及10万RPS架构、重复任务事故给证据路线。
- 独立通关：作者复评通过。新幂等键/字段交换/变ETag、36万条360MB算式及合同反例可复核。
- AIOps 与证据：作者复评通过。自动修复API的指标日志trace审计、脱敏GitHub实验与生产界限明确。

**验证边界**

- reasoned：全文2100余行阅读；OpenAPI latest、IETF两草案和RFC9700官方复核；提取本地服务改临时端口，GET/304/428/双请求200+412/201/重放/409共7项通过，自己子进程已结束。；限制：未运行真实鉴权/网关/跨区/浏览器CORS/生产恢复；课堂自定义幂等格式明确非草案完整实现。

第二位审校者：root-independent-2026-11-11；日期：2026-11-11。

- 本轮独立读完整diff及相关机制、完整双实验、教师批改和独立通关上下文；不是全文重复审读。独立复跑作者检查器23项全部通过。
- 官方本轮独立确认OpenAPI3.2.1与幂等键-08；保留3.2.0实验基线且自定义未引号键/409不冒充草案。撤权重放仍需授权，泄露旧密钥不恢复信任。
- 实际本机临时端口GET304/缺条件428/双并发200+412/同键不同字段顺序复用/冲突409通过；未涉及真实认证、集群与数据库原子性。

### Shell / PowerShell

[打开课程](./foundation/shell-powershell.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：逐行读取示例仅while read，最后一个非空且无换行的记录会被漏掉，健康/告警采集产生静默数据缺口。
- 修订：补非空末段EOF条件，printf按数据输出，并加入有/无末尾换行反例、IFS/-r/EOF字典与读取错误边界。
- 修订：保留已充分的PowerShell多输出布尔故障、无覆盖报告、管道/异常/编码/并发和独立通关内容。

**八项正文证据**

- 前置与路线：作者复评通过。终端与解释器/工具来源区分，两OS任选、版本检查、自有练习目录和执行策略边界。
- 机制与状态：作者复评通过。展开/参数/重定向顺序/子解释器/输出流/对象枚举/退出合同讲清，补EOF末行语义。
- 基础实验：作者复评通过。Bash与PowerShell完整本地报告脚本，前检、保存/执行、预期章节、缺日志未知和NoClobber清理。
- 故障实验：作者复评通过。false管道、模拟不健康对象、函数日志污染布尔结果、恢复方式和局部作用域清理完整。
- 生产取舍：作者复评通过。输入范围、路径TOCTOU、超时并发总预算、幂等/锁/中断、密钥/编码与原子报告切换。
- 递进面试：作者复评通过。30秒/3分钟与90/100缺数据、任务环境差异、重复运行/未知副作用、WhatIf/trap边界。
- 独立通关：作者复评通过。三服务新输入及0/1/多条、true\|false\|true向外层退出传播、三类日志和原报告不覆盖验证。
- AIOps 与证据：作者复评通过。结构化采集到runbook/CI/告警，执行状态与业务状态分离、未知不可补健康。

**验证边界**

- reasoned：全文审读；官方Bash内建read EOF退出状态已2026-11-11读取。新末行示例仅语义审校，尚未运行Bash或报告脚本；未修改执行策略。；限制：仅核对记录中明确说明的范围，未执行的实验与生产路径不作为实测证据。

第二位审校者：root-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮差异、相关机制及实验/通关上下文，不声称再次全文重审；结合既有评测与本轮作者全文复评。
- EOF末段非空继续处理、IFS/-r/printf解释正确；不能把文件读错当末尾补偿。
- 提取正文循环实跑含换行、无换行、两条最后无换行、空文件4项通过；不证明全篇脚本生产运行。

### systemd

[打开课程](./foundation/systemd.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：完整Python服务示例无条件配置kill-HUP重载；后文只说未实现重载没有意义，低估默认信号会终止程序的风险。
- 初评：ExecReload介绍没有把信号成功发送与异步重载完成分开，容易假判配置生效。
- 修订：从通用Python示例移除未确认协议的ExecReload，保留注释说明。
- 修订：补SIGHUP默认终止、同步完成证据、坏配置仍保持旧服务的反例，以及教师加载版本/业务探针追问。

**八项正文证据**

- 前置与路线：作者复评通过。PID1/用户管理器前检，先用户级安全实验，再授权自有VM系统实验；文件名占用停止。
- 机制与状态：作者复评通过。unit/job/transaction、依赖与排序、Type就绪、cgroup/日志、timer补跑和path/socket非队列。
- 基础实验：作者复评通过。用户级oneshot退出0，show/journal结果与inactive解释；系统HTTP目标和timer有完整文件。
- 故障实验：作者复评通过。用户级退出42改回0、daemon-reload复验；系统停止timer再错端口，恢复及只清本次单元。
- 生产取舍：作者复评通过。重启风暴/跨主机HA边界、专用用户/硬化、资源峰值、drop-in列表重置、制品/数据回滚。
- 递进面试：作者复评通过。30秒/3分钟、启动vs业务就绪、启用与当前启动、依赖与readiness、持续网络监控边界。
- 独立通关：作者复评通过。新单元check-v2/退出17、仅改磁盘不reload对照、90秒任务/每分钟timer与补跑设计。
- AIOps 与证据：作者复评通过。show结构化采集、journal与RCA、重启限额持久审计、采集脚本不等同业务健康。

**验证边界**

- reasoned：全文审读；2026-11-11读取官方systemd.service关于异步ExecReload边界及Linux信号手册SIGHUP默认终止。未运行systemd/用户服务/信号实验，不声称系统实测。；限制：仅核对记录中明确说明的范围，未执行的实验与生产路径不作为实测证据。

第二位审校者：root-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮差异、相关机制及实验/通关上下文，不声称再次全文重审；结合既有评测与本轮作者全文复评。
- 删除通用Python的盲HUP，官方信号/ExecReload核对发送与完成分离；用户oneshot0/42与清理仍闭合，未以reset-failed作修复。
- 未运行systemd服务或向进程发信号，只做文档/官方语义检查。

### VitePress

[打开课程](./foundation/vitepress.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：FAQ将默认页面路径无条件写成无.html地址，与后文cleanUrls和托管映射边界矛盾。
- 初评：早期练习将构建成功等同不破坏文档站，证据超过构建门禁能力。
- 修订：修正源码、生成.html、cleanUrls、base四者关系，补版本固定官方来源。
- 修订：改写构建验收并加入导航进入/直接刷新反例和教师追问，保留独立死链实验及生产半产物模拟。

**八项正文证据**

- 前置与路线：作者复评通过。区分当前React仓库和独立VitePress v1实验，提供空目录、Node/npm检查与固定安装。
- 机制与状态：作者复评通过。完整讲源码/构建/托管/浏览器三个环境、文件路由、水合、搜索索引和资源缓存。
- 基础实验：作者复评通过。独立index/payment实验有确切文件、构建和预览、期望产物、直接刷新与清理。
- 故障实验：作者复评通过。不存在页面触发死链非零退出，恢复后重建；另有两版资源清单一致性纸面模拟，标注不等于实测。
- 生产取舍：作者复评通过。容量按构建内存/资源/搜索客户端下载分层；公开产物授权、SSR导入边界、锁文件和整套产物回滚。
- 递进面试：作者复评通过。30秒/3分钟及子页刷新404、CI差异、源码删除后仍泄露等递进追问。
- 独立通关：作者复评通过。queue新页面、base改变、死链恢复和授权设计迁移任务，证据与失分回读位置明确。
- AIOps 与证据：作者复评通过。告警深链、值班手册可用性、知识库检索/版本来源/自动执行安全衔接。

**验证边界**

- reasoned：全文逐段审读；2026-11-11通过Jina读取VitePress v1官方routing核验默认.html映射。未创建独立VitePress工程或运行浏览器，未验证真实托管。；限制：仅核对记录中明确说明的范围，未执行的实验与生产路径不作为实测证据。

第二位审校者：root-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮差异、相关机制及实验/通关上下文，不声称再次全文重审；结合既有评测与本轮作者全文复评。
- 官方v1路由核对默认.html、cleanUrls与托管支持分开，base前缀不省；基础固定1.6.4与死链故障/恢复步骤有目标与清理。
- 没有新装VitePress或真实托管验证；当前React站构建不冒充独立VitePress实验。

### Ajax 技术栈深讲

[打开课程](./frontend/ajax.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：SSE 段落把事件格式、EventSource 自动重连和服务端历史恢复压缩为同一句，初学者容易误以为所有 Fetch 流自动无损续传。
- 修订：拆解 SSE 格式、EventSource 接口和服务端历史保留职责，补充位点 41、历史窗口 50 到 80 的反例与教师纠错。

**八项正文证据**

- 前置与路线：作者复评通过。基础实验前置条件说明 Node、空目录、4177占用检查、server.mjs/index.html与本地监听。
- 机制与状态：作者复评通过。Request/Response、CORS、幂等键及本轮SSE分层说明请求与状态归属。
- 基础实验：作者复评通过。基础实验完整两文件，正常200、Content-Type、契约和INC-1024，Ctrl+C仅清理本进程。
- 故障实验：作者复评通过。503、8秒慢响应、bad契约和慢转正常均有模式输入、预期及恢复；同源不冒充CORS验收。
- 生产取舍：作者复评通过。缓存租户键、总预算/并发/重试、身份世代、灰度契约回滚及SSE历史过期处理有条件取舍。
- 递进面试：作者复评通过。30秒/3分钟、连续追问及跨域串租户事故提供答案和证据路线。
- 独立通关：作者复评通过。独立通关改变9秒预算、204/HTML输入、新SSE位点过期反例要求可推翻假设的证据。
- AIOps 与证据：作者复评通过。事件搜索、自动化幂等、trace关联和脱敏GitHub证据目录对应真实运维链。

**验证边界**

- reasoned：全文815行及缺失段补读，复评两级实验、竞态、错误分层和新SSE辨析；通过Jina阅读WHATWG EventSource处理及Last-Event-ID规范。；限制：未运行浏览器服务、CORS/SSE重连或生产API；纸面位点案例不代表实际交付保证。

第二位审校者：root-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮差异、相关机制及实验/通关上下文，不声称再次全文重审；结合既有评测与本轮作者全文复评。
- WHATWG核对EventSource重连及Last-Event-ID，与fetch读取事件流分开；41到50位点反例要求服务端保留和快照衔接，不承诺自动不丢。
- 共享前端typecheck与7逻辑用例通过；未运行浏览器SSE/断线/代理实验。

### CSS 技术栈深讲

[打开课程](./frontend/css.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：Core Web Vitals首次出现只列LCP/CLS/INP缩写，未明确布局变化与CLS计分、业务完成与INP的界限。
- 修订：补全三项全称与中文，新增DOM追加不必然造成CLS的教师反例及Performance证据要求。

**八项正文证据**

- 前置与路线：作者复评通过。基础实验链接HTML副本、完整styles.css/main，明确移除旧note-form脚本及file/HTTP区别。
- 机制与状态：作者复评通过。层叠、变量计算值无效、Flex自动最小尺寸、Grid和堆叠上下文给机制与观察。
- 基础实验：作者复评通过。三卡片基础含390/768/1440、深色和键盘验收与个人副本清理。
- 故障实验：作者复评通过。600px与important注入明确app祖先，恢复源文件后多状态回归；变量20px/purple/缺失有三个判据。
- 生产取舍：作者复评通过。令牌迁移、旧未分层规则、资源版本、整包回滚和设备预算；性能新增计分反例。
- 递进面试：作者复评通过。30秒/3分钟和覆盖/弹层/多人治理连续追问，事故有证据与最小恢复。
- 独立通关：作者复评通过。独立任务要求计算来源、变条件、裁剪反例和CLS位置证据，不靠截图通关。
- AIOps 与证据：作者复评通过。告警等级多通道呈现、可访问性操作安全、发布关联性能及脱敏证据目录。

**验证边界**

- reasoned：逐段全文阅读约900行并核对布局/焦点/变量/实验输入；Jina阅读web.dev CLS原始说明。；限制：未在真实浏览器执行布局/可访问性/性能测量；本轮新增反例是纸面推理。

第二位审校者：root-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮差异、相关机制及实验/通关上下文，不声称再次全文重审；结合既有评测与本轮作者全文复评。
- CLS按最严重一组非预期位移说明；追加DOM不自动计分，核对web.dev位置变化规则，未以下载或尺寸变化替代位移。
- 无真实浏览器布局/性能实测，纸面反例与共享逻辑测试不混称。

### HTML 技术栈深讲

[打开课程](./frontend/html.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：首屏链路首次出现LCP/INP无全称和作用解释，缺少业务完成慢与下一帧反馈慢的对照判据。
- 修订：原地为图中LCP/INP加中文语义，补全英文全称、TTFB与业务计时边界、两种性能反例和教师反馈。

**八项正文证据**

- 前置与路线：作者复评通过。基础实验交代现代浏览器/编辑器、UTF-8、新建目录和扩展名，不依赖隐藏服务。
- 机制与状态：作者复评通过。HTML解析、DOM/CSSOM/无障碍树、表单成功控件、属性/property、生命周期和新增性能分层。
- 基础实验：作者复评通过。完整index.html含本地校验无请求，操作预期/失败/清理完整。
- 故障实验：作者复评通过。错配label和div按钮注入→无障碍/键盘观察→源文件修复→刷新回归。
- 生产取舍：作者复评通过。多租户、服务端权限、XSS/CSP/SRI、分页、哈希制品及版本缓存回滚。
- 递进面试：作者复评通过。30秒/3分钟、五级追问、旧页面事故与控制台设计题给证据路径。
- 独立通关：作者复评通过。FormData条件变化、布尔属性、两类性能反例要求观察不同树/请求/时间点并说明反证。
- AIOps 与证据：作者复评通过。事件控制台、可访问告警、build/trace关联，证据目录强调脱敏及实际浏览器版本。

**验证边界**

- reasoned：全文约800行分段阅读并核对原生校验、隐藏/禁用边界；通过Jina阅读web.dev LCP/INP原始说明核对新性能教学。；限制：未执行真实浏览器辅助技术、性能录制或生产发布实验，题中时延为教学假设。

第二位审校者：root-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮差异、相关机制及实验/通关上下文，不声称再次全文重审；结合既有评测与本轮作者全文复评。
- LCP/INP有中文释义、加载与交互分层；下一帧反馈不等于业务请求全部完成，web.dev原始定义支持反例。
- 未录制浏览器性能/辅助技术；新增时间数字明确为教学条件。

### JavaScript 技术栈深讲

[打开课程](./frontend/javascript.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：开场把面板/SPA路由清理与真正关闭文档混写，可能误导为标签页关闭后普通计时器一定仍执行。
- 初评：移除监听专节只强调函数引用，缺少相同目标/类型/capture配对及重复监听反证。
- 修订：澄清文档仍存活的生命周期边界。
- 修订：补capture含义、目标/类型/函数/捕获值配对，给两个假设和单变量复测的教师追问。

**八项正文证据**

- 前置与路线：作者复评通过。Node版本、空目录、两个完整输入文件，CLI只读无网络；浏览器实验明确独立页面。
- 机制与状态：作者复评通过。值/绑定/闭包/原型、Promise调度、模块、内存和新capture配对解释机制与证据。
- 基础实验：作者复评通过。incident-filter输入两事件正常slowCount=1，异常输入/语法/退出码及保留证据。
- 故障实验：作者复评通过。坏字段与3秒有界忙等分开注入，竞态80/10故障与资格修复，收回步骤清楚。
- 生产取舍：作者复评通过。限并发、租户键、服务端幂等、Worker所有权及来源重放、版本资源与回滚。
- 递进面试：作者复评通过。30秒/3分钟、单线程竞态和失败副作用追问、重复确认事故。
- 独立通关：作者复评通过。0/999/1000/1001新输入、延时反转、监听引用/capture新反例要求真正反证。
- AIOps 与证据：作者复评通过。合成告警筛选、多证据源部分失败、可信信号与脱敏GitHub目录。

**验证边界**

- reasoned：全文三段阅读到EOF；新removeEventListener语义通过Jina读取MDN匹配移除规则。；限制：本轮未执行本文全部CLI/Worker/浏览器实验；并未把共享前端7项测试归为这些实验实跑。

第二位审校者：root-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮差异、相关机制及实验/通关上下文，不声称再次全文重审；结合既有评测与本轮作者全文复评。
- 关闭面板与关闭文档区分；MDN核对removeEventListener目标/类型/引用/capture匹配，passive/once不当移除匹配项。
- 新增监听反例未在浏览器执行；共享逻辑7项不冒充事件传播测试。

### React 技术栈深讲

[打开课程](./frontend/react.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：React19.2课程把普通Hook规则概括成所有use接口，不解释use(resource)可条件调用的不同边界，易在面试追问混淆。
- 修订：将稳定顺序明确限定普通状态/副作用Hook，补use读取Promise/Context、条件循环许可、组件/Hook调用范围和try/catch限制。
- 修订：加入use与useState类推错误、客户端Promise身份和受支持数据层的教师反馈。

**八项正文证据**

- 前置与路线：作者复评通过。固定共享实验/新脚手架分开，新目录存在即停、模板默认导出、真实脚本核验与备份明确。
- 机制与状态：作者复评通过。render/reconcile/commit、快照、key、Effect与新use规则明确稳定接口和内部模型边界。
- 基础实验：作者复评通过。完整App搜索与加三组件，输入data/空结果和1/3预期，关闭个人服务。
- 故障实验：作者复评通过。加三错误与修复可重现；cleanup、索引key与水合场景区分环境，SSR不可冒充客户端实跑。
- 生产取舍：作者复评通过。SSR/RSC差别、每请求状态、服务端授权、局部边界、消息容量、旧chunk/API兼容回滚。
- 递进面试：作者复评通过。30秒/3分钟、use例外、上下文/Effect/调度连续追问和API翻倍事故有参考。
- 独立通关：作者复评通过。新输入、草稿重排、旧成功与失败晚到、setup-cleanup资源计数及纸面外部store快照反例。
- AIOps 与证据：作者复评通过。告警reducer、追踪、错误隔离、审批边界及可提交源码/证据/复盘。

**验证边界**

- reasoned：全文三段阅读至EOF，Jina阅读React use与StrictMode官方说明核对新增规则。；限制：未在浏览器执行React组件、StrictMode资源、SSR/RSC或真实服务；在线新文档可能演进，本次只添加19系已有use边界。
- executed：本轮共享frontend-incident-lab类型检查成功，7项Vitest用例全部通过。；限制：未声称这些纯逻辑用例验证了React渲染/E2E/生产。

第二位审校者：root-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮差异、相关机制及实验/通关上下文，不声称再次全文重审；结合既有评测与本轮作者全文复评。
- 官方use确认条件/循环例外及组件/Hook调用边界；未将useState普通Hook规则取消，Promise稳定身份与错误边界说明正确。
- 共享typecheck与7项纯逻辑测试通过，不证明React组件/SSR/性能全部已验收。

### TypeScript 技术栈深讲

[打开课程](./frontend/typescript.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：本轮全文复核未发现需重复改写的实质缺口：固定工具链、独立单文件执行和静态/运行时/旧制品边界已有明确教学。
- 修订：保留现有正文，补记本轮全文复核结论与共享实验实际检查，不伪造新增内容或重复模板段落。

**八项正文证据**

- 前置与路线：作者复评通过。基础实验空目录、固定6.0.3、NodeNext完整package/tsconfig/src，明确本地编译器与安装失败边界。
- 机制与状态：作者复评通过。结构类型、unknown、守卫承诺、联合/never、泛型、值擦除与模块解析层次清楚。
- 基础实验：作者复评通过。告警聚合器完整可构建，正常0/1、失败停止禁止旧dist；清理范围个人目录。
- 故障实验：作者复评通过。any/fatal错误状态、unknown守卫修复、漏分支、expect-error负例都有故障/恢复/判据。
- 生产取舍：作者复评通过。契约多版本、生成器、源码映射、依赖锁、检查性能与完整组合回滚。
- 递进面试：作者复评通过。30秒/3分钟、品牌/paths/lib反例、升级白屏事故和跨团队设计给答案。
- 独立通关：作者复评通过。2/1新输入、不改输入数组、合法/缺失/非法枚举/NaN样本与旧dist验证三份证据。
- AIOps 与证据：作者复评通过。事件/审批/自动化状态，观测缺失与零值分开，GitHub证据与脱敏要求。

**验证边界**

- reasoned：全文分三段阅读至EOF，核对基础程序、配置、类型负例、解析函数独立编译路径及前后契约。；限制：未重新执行本文所有独立TypeScript文件或真实浏览器兼容场景。
- executed：2026-11-11运行 npm --prefix examples/frontend-incident-lab run typecheck 退出0，npm --prefix examples/frontend-incident-lab test 7/7通过。；限制：只覆盖已安装依赖上的共享实验类型/自动测试；不代表本文全部片段、页面视觉、网络或生产验证。

第二位审校者：root-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮差异、相关机制及实验/通关上下文，不声称再次全文重审；结合既有评测与本轮作者全文复评。
- 本轮正文保留；独立检查NodeNext完整基础程序、any/fatal故障、unknown守卫、单文件ignoreConfig路径和类型负例/独立通关，静态与运行时边界闭合。
- 共享typecheck通过；未把共享7测试声称为全文全部独立TypeScript片段实跑。

### Vue 技术栈深讲

[打开课程](./frontend/vue.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：本轮全文复核未发现需重复改写的阻断缺口；普通reactive解构与3.5宏转换、KeepAlive清理、浅响应偶然重绘等反例已充分。
- 修订：保留当前正文，记录本轮八维复核与共享实验类型/7项测试结果，不把保留描述成新扩写。

**八项正文证据**

- 前置与路线：作者复评通过。两条实验路线分开，个人新目录/Node/脚本检查/备份App，固定共享依赖有入口。
- 机制与状态：作者复评通过。SFC→依赖追踪→调度→patch，props与普通解构区分，nextTick不等于绘制或API完成。
- 基础实验：作者复评通过。完整ref/computed App，data/不存在输入预期及脚手架旧测试不能证明新增App。
- 故障实验：作者复评通过。完整guarded竞态组件300/20、解构0/3/toRef、恢复备份与停止个人服务。
- 生产取舍：作者复评通过。多租户query身份、SSR每请求store、KeepAlive停用、并发消息上限、chunk保留和制品回滚。
- 递进面试：作者复评通过。30秒/3分钟、响应/依赖/SSR连续追问，重复请求事故和多团队设计答案。
- 独立通关：作者复评通过。反转竞态延迟、shallowRef偶然渲染反例、十轮资源基线、排序草稿身份皆有判据。
- AIOps 与证据：作者复评通过。事件/审批组件与API契约，trace/release、观测与GitHub脱敏证据。

**验证边界**

- reasoned：全文分三段读到EOF，核对所有完整组件、清理、版本宏与数据权限边界。；限制：没有重新跑浏览器交互、SSR串租户、KeepAlive或生产环境；未升级Vue依赖。
- executed：本轮共享frontend-incident-lab vue-tsc类型检查成功，Vitest 7/7通过。；限制：共享单元用例不等同于Vue组件/E2E/SSR实验验证。

第二位审校者：root-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮差异、相关机制及实验/通关上下文，不声称再次全文重审；结合既有评测与本轮作者全文复评。
- 本轮正文保留；检查完整基础组件和旧慢/新快故障、cleanup及版本资格，独立通关覆盖响应/异步/身份；未要求为刷新日期改写充分内容。
- 共享vue-tsc与7项逻辑测试通过，未执行浏览器点击、SSR串租户或KeepAlive。

### Apache Tomcat 技术栈深讲

[打开课程](./middleware-application-platform/tomcat.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：Compose项目身份未固定，JSON预检管道解析失败不停止；启动/恢复缺退出门禁；HTTP只显示结果未核对JSP合同。
- 初评：交叉审校发现集合属性枚举可让分散字段的JSON数组伪通过。
- 修订：固定项目名并解释环境覆盖清理身份；原生命令/JSON/文件错误阻断；新增请求ID/UP/版本有限验证函数及假200反例。
- 修订：改取原始HTTP200文本，拒顶层数组并要求单对象及三标量字符串，补三种数组反例。

**八项正文证据**

- 前置与路线：作者复评通过。JDK/外置与容器、HOME/BASE、Windows文件/端口/项目隔离。
- 机制与状态：作者复评通过。Coyote/Catalina/Jasper/容器树/Servlet并发/类加载/连接线程与池。
- 基础实验：作者复评通过。完整ROOT JSP/XML/Compose、版本/访问日志/HTTP和JSON多证据。
- 故障实验：作者复评通过。错误web.xml嵌套挂载故障与同基线恢复，命令失败不冒充XML错误。
- 生产取舍：作者复评通过。Session复制/无状态/故障域/数据库总连接/安全/JDK规范升级回退。
- 递进面试：作者复评通过。7组主线和逐层追问、504事故与订单HA设计。
- 独立通关：作者复评通过。挂载ROOT→orders预测、请求ID校验、javax.sql反例、180连接预算。
- AIOps 与证据：作者复评通过。JMX/PMI替代边界、JVM线程GC/Trace/发布身份及低频受控采证。

**验证边界**

- reasoned：本轮逐段全文阅读；保留已有完整生产和递进深度，仅修具体教学/安全/验收缺口。；限制：无真实NGINX/Traefik/Tomcat/Liberty/WAS实例；未部署/删除/更新任何业务对象，不继承历史实跑结果。
- syntax：四篇共29个PowerShell块AST通过，diff --check通过。；限制：只静态语法，不证明产品/API/网络。
- executed：tmp/cloud-delivery-sixth-checks-2026-11-11.ps1提取新增函数，Traefik5种HTTP/传输/收敛样本与Tomcat5种JSON/传输样本全部通过。；限制：HTTP为本地桩，无真实请求和产品运行。
- executed：tmp/cloud-cross-rework-checks-2026-11-11.mjs 原文函数7合成响应通过；原sixth10回归通过，无真实HTTP。；限制：本轮返工仅限明确列出的本地合成、静态和来源检查，不替代实际产品或生产验收。

第二位审校者：refresh-foundation-platform；日期：2026-11-11。

- 审阅范围：完整本轮diff（含独立审校返工）、作者记录与必要核心机制/完整基础故障实验/独立通关上下文；不是本轮对旧版全文重复审读。
- 交叉发现JSON数组经PowerShell集合属性枚举可让分散字段误过合同；已交作者返工，现先核原始HTTP200/单对象文本，再确认status/requestId/server都是标量字符串且值相符。参考Microsoft比较操作符集合语义复核。
- 完整ROOT JSP/正常XML/Compose与错误结束标签注入、恢复和清理已审；端口与项目身份、嵌套挂载、版本与请求ID多证据连贯。独立通关中ROOT→orders路径、javax.sql不迁移、90→180连接预算与业务依赖边界成立。
- 独立8组正常/请求ID不符/三对象分散字段/字段数组/顶层数组/HTML/null/传输错误用例通过；未运行Tomcat/Jasper编译、Docker挂载或真实数据库。
- 独立测试tmp/cross-cloud-last4-checks-2026-11-11.ps1：31组行为反例和30段PowerShell AST在Windows PowerShell5.1与PowerShell7均通过；tmp/cross-cloud-last4-admin-checks-2026-11-11.mjs通过10逻辑/4成员集合/6容量断言。diff --check通过。合成验证不能替代产品实验、性能/HA或生产发布验收。

### IBM WebSphere 技术栈深讲

[打开课程](./middleware-application-platform/websphere.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：AdminApp更新后hasChanges未知或无变更会默默跳过save；全部成员核对缺目标分母示例；Liberty健康只curl状态且localhost与回环绑定不一致。
- 初评：交叉审校发现单元素健康JSON数组或status数组可伪通过。
- 修订：hasChanges三态门禁不默认成功；逐(Node,Server)目标清单解释少/错成员不补数与无跨会话锁；Liberty127.0.0.1/JSON UP/超时/文件和恢复命令门禁。
- 修订：共用Get-LessonLibertyHealth，原始HTTP200文本拒顶层数组/标量类型误用，恢复复用同一合同。

**八项正文证据**

- 前置与路线：作者复评通过。traditional授权安装与OpenLiberty本机明确分离，独占名称/端口/固定digest。
- 机制与状态：作者复评通过。Cell/DMgr/Node/配置工作区/发布六回执、JNDI/JMS/JTA/会话状态。
- 基础实验：作者复评通过。OpenLiberty完整XML/镜像/挂载/启动日志与JSON健康验收。
- 故障实验：作者复评通过。错误Feature的WARN/FAIL及恢复，传统CU仅授权末级兜底，不伪造ND实操。
- 生产取舍：作者复评通过。15类EAR故障阶段、备份/事务/集群容量/证书/升级/rollback。
- 递进面试：作者复评通过。7组递进题、3000RPS设计、连接池事故及CU安全追问。
- 独立通关：作者复评通过。五关六回执，四成员分母与未知保存、不拿Liberty替ND证据。
- AIOps 与证据：作者复评通过。部署阶段/哈希/成员/消息ID/PMI/线程/依赖关联，CU删除不自动化。

**验证边界**

- reasoned：本轮逐段全文阅读；保留已有完整生产和递进深度，仅修具体教学/安全/验收缺口。；限制：无真实NGINX/Traefik/Tomcat/Liberty/WAS实例；未部署/删除/更新任何业务对象，不继承历史实跑结果。
- syntax：四篇共29个PowerShell块AST通过，diff --check通过。；限制：只静态语法，不证明产品/API/网络。
- executed：tmp/cloud-cross-rework-checks-2026-11-11.mjs 原文函数7合成响应通过，无Liberty实例或HTTP。；限制：本轮返工仅限明确列出的本地合成、静态和来源检查，不替代实际产品或生产验收。

第二位审校者：refresh-foundation-platform；日期：2026-11-11。

- 审阅范围：完整本轮diff（含独立审校返工）、作者记录与必要核心机制/完整基础故障实验/独立通关上下文；不是本轮对旧版全文重复审读。
- 交叉发现Liberty健康数组可被误判为顶层UP；作者改为保留原始响应并验证单对象/标量status。基础和恢复复用同一函数，独立5组对象/根数组/status数组/DOWN/缺字段用例通过。
- 审阅wsadmin更新前后工作区门禁/逐成员验收、完整Liberty基础与错误Feature实验、六张回执和生产通关。hasChanges无变更/未知均停止；不会自动回滚也不是跨管理员锁，配置/事务/应用/业务恢复边界明确。
- 独立提取原文wsadmin逻辑，以Python3本地假AdminApp/AdminConfig验证10种前后状态、制品/应用缺失及update/save异常；成员集合4例、连接/线程容量6例通过。不是Jython/wsadmin兼容或WAS部署验证，未连接管理端。
- 独立测试tmp/cross-cloud-last4-checks-2026-11-11.ps1：31组行为反例和30段PowerShell AST在Windows PowerShell5.1与PowerShell7均通过；tmp/cross-cloud-last4-admin-checks-2026-11-11.mjs通过10逻辑/4成员集合/6容量断言。diff --check通过。合成验证不能替代产品实验、性能/HA或生产发布验收。

### Alertmanager

[打开课程](./observability/alertmanager.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：全文审读发现初学者下载二进制后如何按操作系统/架构启动仍含隐藏前提，Windows短命令未解释当前目录前缀。
- 初评：group_interval速查定义易被读成每条新告警独立倒计时，去重价值表将相同告警不重复通知写成绝对保证。
- 初评：静默实验提醒去重干扰但缺少silencedBy与本轮静默ID对照的具体反证方法。
- 修订：补官方获取入口、操作系统/架构、完整性核对、Python前置链接和Windows当前目录启动写法。
- 修订：修订group_interval为首次等待后的组级周期检查，去重明确重复提醒与故障重复边界。
- 修订：新增教师批改：用本轮静默编号核对status.silencedBy，解除后验证，区分入口接受、过滤和投递。

**八项正文证据**

- 前置与路线：作者复评通过。开课准备的三个终端与Bash/PowerShell区别，新增下载架构/路径前缀、版本和配置先后顺序，使二进制首跑路径明确。
- 机制与状态：作者复评通过。路由树/continue、父接收器、分组/去重、三个时间、静默与抑制状态、网络分区重复均有机制与反例。
- 基础实验：作者复评通过。本机Python接收器、完整YAML、动态时间发送脚本、API查询、恢复及专属目录清理；不向真实值班渠道发消息。
- 故障实验：作者复评通过。独立通关停接收器证明入口与投递分离；教师批改新增静默ID核对、解除复测和去重竞争解释。
- 生产取舍：作者复评通过。多租户抑制非空边界、配置/运行状态分工、多副本重复、下游幂等、配置回放、密钥与升级回退。
- 递进面试：作者复评通过。三团队通知平台设计与Firing未送达事故题包含分段取证、路由时序、模板公共标签和自动化授权追问。
- 独立通关：作者复评通过。变式路由文件与continue实操、跨租户反例、接收器停止故障、新增silencedBy具体判据；只无第二条消息不算通过。
- AIOps 与证据：作者复评通过。Webhook事件归一化、告警上下文/工单/Runbook及幂等权限连接完整；证据要求脱敏标签与投递确认。

**验证边界**

- reasoned：完整阅读本篇；GitHub CLI读取prometheus/alertmanager官方API v2定义确认alertStatus.silencedBy；复核分组计时与既有时间线一致。；限制：未运行下载、二进制或真实通知，没有外部值班消息。
- executed：telemetry.mjs alertmanager 正常/故障输出on-call/default-review，issue=false/true。；限制：仅大小写精确匹配模型，不模拟完整路由树、组调度或gossip。
- syntax：Python接收器与发送脚本均compile通过；定向diff空白检查通过。；限制：没有验证端口、下载资产或通知网络。
- unrun：真实Alertmanager的静默、投递、恢复通知及Windows二进制启动留待读者实验。；限制：没有启动或安装Alertmanager，不使用本轮静态检查冒充运行验收。

第二位审校者：cloud-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮差异、相关机制及基础/故障实验与独立通关；不是再次全文重审。
- 新增当前目录二进制入口与静默编号silencedBy对照可排除去重造成假通过；复核路由continue变式、接收器停止与恢复、仅清理自身静默。
- 静态复核Python/配置及时间线；未安装Alertmanager或发送通知。

### Elasticsearch

[打开课程](./observability/elasticsearch.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：全文审读发现聚合速查表建议使用.keyword但未明确该子字段必须已声明，与显式keyword课堂映射存在误用风险。
- 初评：Bulk已有逐项检查的理论与口述题，但缺少能亲手观察整批HTTP成功而一项失败的具体输入、断言和只修失败项闭环。
- 修订：速查表改为核对实际mapping及字段覆盖，不能机械加.keyword。
- 修订：新增两条NDJSON教师批改：随机专用标识、最终换行、errors/items/201/400断言、成功项可读、仅修失败项、清理与覆盖语义边界。

**八项正文证据**

- 前置与路线：作者复评通过。JSON/HTTP/端口/进程从零解释，4GB与2GB容器预算，PowerShell主路径和Bash备选边界、固定8.19.0及关闭认证仅回环明确。
- 机制与状态：作者复评通过。映射/倒排/docvalues、nested/flattened、写入确认/translog/refresh、分片/路由/条件版本、Bulk非事务和部分结果完整。
- 基础实验：作者复评通过。teacher-logs严格映射、one样本、match/term大小写反例与分析结果，单容器范围及清理。
- 故障实验：作者复评通过。duration_ms=slow写入拒绝与修复计数；新增Bulk201/400混合与只修失败标识，固定输入且不删索引逃避错误。
- 生产取舍：作者复评通过。热点/动态字段、容量16TB推导、分片故障域、ILM年龄、快照兼容恢复、权限/脱敏和升级回退。
- 递进面试：作者复评通过。每日200GB设计与错误率反降事故有假设/证据/止损；新课追问HTTP成功、项成功与稳定标识覆盖区别。
- 独立通关：作者复评通过。三消息match/and/phrase变式、刷新纸面边界、故障重做、容量与三种不完整结果；Bulk新课提交逐项身份和原因。
- AIOps 与证据：作者复评通过。日志证据覆盖率、桶截断/部分分片/拒绝项不直接进入全量错误率，自动化止损与脱敏学习项目完整。

**验证边界**

- reasoned：完整阅读所有段落并补读工具截断部分；Jina核对官方Bulk的NDJSON最终换行、errors/items与逐项status。；限制：当前官方接口用于说明稳定格式，真实8.19.0实例未运行。
- executed：离线telemetry elasticsearch正常/故障验证payment/Payment命中差异；新Bulk请求只运行构造段，四行JSON均解析通过且最终有换行，网络请求零次。；限制：请求构造验证不代表服务已接受或真实分词结果。
- syntax：全篇PowerShell围栏与另外两篇共26块解析通过，定向diff检查通过。；限制：Bash脚本未在Linux执行。
- unrun：真实写入、搜索、Bulk混合响应与修复后读取仍待读者隔离环境验证。；限制：Docker daemon不可用，不宣称已验收产品行为。

第二位审校者：cloud-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮差异、相关机制及基础/故障实验与独立通关；不是再次全文重审。
- Bulk201/400逐项断言、NDJSON尾换行与只修失败ID形成闭环；严格mapping允许未提供timestamp，keyword后缀不能机械追加；复核刷新、计数和不完整聚合边界。
- PowerShell AST通过，静态复核请求/响应关系；未启动Elasticsearch验证真实Bulk。

### Grafana 精讲

[打开课程](./observability/grafana.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：全文审读发现Field Options的Display name写成Prometheus图例模板{{instance}}，输入框语法混淆。
- 初评：检查器Data被统称原始响应，未交代其可能已应用Transformation，可能导致读者在错误层重复换算。
- 初评：已有单位纸面故障，但缺少同一源值、两种正确换算和重复换算反例的逐层证据任务。
- 修订：字段显示名改为${__field.labels.instance}并解释和Legend的不同语法、无标签时不能生成实例。
- 修订：检查器说明改为Query请求/响应与Data转换状态分层，给出当前官方面板检查器引用。
- 修订：新增vector(0.2)副本实验，记录源值/乘1000结果/单位显示，设置反例与恢复、版本开关不存在的替代核对路径。

**八项正文证据**

- 前置与路线：作者复评通过。开课准备说明Docker及备选路线；首跑专用网络两容器，新增实验只在自己的面板副本上操作并保留原看板。
- 机制与状态：作者复评通过。数据源/查询/数据帧/转换/显示路径及单位、变量、UID已明确；修复Display name和检查器层次错误。
- 基础实验：作者复评通过。十步Prometheus自监控看板从容器到数据源、变量、三面板、导出再导入与清理，说明不代表业务健康。
- 故障实验：作者复评通过。新增单位故障以已知vector(0.2)构建两种正确表示，再制造重复换算定位首次出错层并恢复。
- 生产取舍：作者复评通过。查询容量、共享元数据库、插件/加密配置一致、版本迁移回退、数据源授权和变量非安全边界。
- 递进面试：作者复评通过。三分钟回答Save&test、空面板、绿色误判、JSON导入及多团队设计，配官方语法纠错与反例。
- 独立通关：作者复评通过。独立多选/All插值、每秒80查询计算、单位三层证据；新课要求解释数据数值与物理量并非同一比较。
- AIOps 与证据：作者复评通过。按用户影响/流量/依赖/资源与变更引导排障，保存JSON、原响应、空值反例、修复记录及脱敏要求。

**验证边界**

- reasoned：完整阅读本篇；Jina Reader核对Grafana官方标准选项Display name和panel-inspector的Data转换与格式化语义。；限制：官网当前文档非本轮固定12.1.1界面实测，操作说明明确按版本核对开关及替代检查路径。
- executed：telemetry.mjs grafana 正常/故障各一次，确认null保留/补0对照及issue=false/true。；限制：离线数组语义模型，不是Grafana界面。
- syntax：定向git diff --check通过，新表达式按官方语义核对。；限制：本篇没有执行图表配置或导入导出。
- unrun：Grafana真实界面、查询检查器、单位副本实验、权限与通知待运行。；限制：本机Docker daemon不可用，不宣称截图或UI验收。

第二位审校者：cloud-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮差异、相关机制及基础/故障实验与独立通关；不是再次全文重审。
- 字段显示名与Legend语法分开、检查器Data转换状态和0.2秒/200毫秒对照正确；复核网络与数据源位置、导入UID、变量非授权及清理。
- 独立查询官方标准选项确认__field.labels语法；未运行Grafana界面。

### Grafana Loki

[打开课程](./observability/loki.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：全文审读后基础脚本只有正确/错误选择器，分页上限与方向虽有正文解释，但学生没有同一输入的可复现数量/方向对照。
- 初评：需要让返回条数不是事件总量的面试结论有亲手可观察的证据，并说明大规模导出的边界。
- 修订：基础Python查询函数增加limit参数，同轮三条输入追加limit=1与limit=20对照断言与预期输出。
- 修订：新增教师批改：正序INFO与倒序末条ERROR预测、服务器限制/时间边界/同时间戳例外、失败诊断与原环境清理。

**八项正文证据**

- 前置与路线：作者复评通过。独立学习目录、原生Loki3.5.0/Python、OS架构与回环端口、当前目录二进制前缀及非管理员边界明确。
- 机制与状态：作者复评通过。标签流/块/索引读写路径，WAL确认、时间和Schema、租户头非鉴权；新课区分返回limit和统计总量。
- 基础实验：作者复评通过。完整配置与Python动态纳秒标记推送三条，验证204、三条总记录/两条ERROR、上限1仍不删除其他记录。
- 故障实验：作者复评通过。错应用标签成功空响应后修复回三条，limit方向反例；异常先查ready、响应、时钟、标签并保留输入。
- 生产取舍：作者复评通过。流基数、十倍日志洪峰、队列容量、限流、对象保留及Schema历史可读性，多租户与备份恢复边界。
- 递进面试：作者复评通过。从30秒到三分钟数据路径、对象存储失效/新旧日志查询/错误率下降、标签成本取舍有因果与反例。
- 独立通关：作者复评通过。独立通关900流、改变租户/时间/状态类型；新增同轮limit/方向任务提交输入和输出，不以返回数认定全部事件。
- AIOps 与证据：作者复评通过。日志计数不等于失败请求，采集健康/解析覆盖率和trace关联进入AIOps；合成证据不含真实审计日志。

**验证边界**

- reasoned：完整阅读本篇；查Loki官方HTTP API确认query_range及forward/backward方向，新增对照保持本轮marker与时间窗口。；限制：未运行真实Loki，不把纸面900流或查询预期当吞吐/可靠性验收。
- executed：telemetry.mjs loki 正常/故障输出4事件对应1/4流，issue=false/true。；限制：离线标签组合模型，没有产生真实Loki索引。
- syntax：修改后的loki-lesson.py完整代码块compile通过；定向git diff --check通过。；限制：未发送HTTP请求，limit1/20断言尚待真实平台执行。
- unrun：原生Loki启动、Push/查询及新增方向变式待隔离平台运行。；限制：没有安装、启动或修改用户现有日志服务。

第二位审校者：cloud-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮差异、相关机制及基础/故障实验与独立通关；不是再次全文重审。
- 查询limit和方向不等于全量数量；复核同一正文marker隔离、纳秒排序、ERROR筛选、错标签及清理，新增断言未改变生产状态。
- 独立以假HTTP响应执行文章原Python，三条/两条/限制一条/错误零条/恢复三条通过；非Loki执行。

### OpenTelemetry

[打开课程](./observability/opentelemetry.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：全文审读发现memory_limiter速查表仍容易被误读成硬内存墙或直接丢数据，需和前文拒绝/重试机制对齐。
- 初评：原始OTLP脚本检查partialSuccess，但没有让新手独立区分完整接受、零拒绝警告、部分拒绝及不合理响应的可运行错题。
- 修订：memory_limiter字典强调压力拒绝与上游重试/缓冲边界。
- 修订：新增Python标准库响应判读课堂：3种HTTP200正文、越界拒绝数量反例、禁止整批重发及本跳接受不代表后端持久化。

**八项正文证据**

- 前置与路线：作者复评通过。开课准备定义业务传播与导出两条线，完整容器配置/三个终端/端口/固定发行版；新响应课无需网络或服务。
- 机制与状态：作者复评通过。API/SDK/Collector/后端分层、trace/span/resource/context、累计/增量、OTLP部分成功和队列状态有证据边界。
- 基础实验：作者复评通过。完整YAML与Python发送两段OTLP跨度、核对父子与debug输出；新纯Python判读代码可直接运行并有四行预期。
- 故障实验：作者复评通过。错误路径404恢复与不同trace ID反例；响应课堂注入拒绝数量超过发送数量并要求异常识别，不删断言造通过。
- 生产取舍：作者复评通过。尾采样归属/迟到、队列120秒容量、持久队列限制、双后端非原子、敏感属性及语义字段升级回滚。
- 递进面试：作者复评通过。三分钟两条路径与业务正常遥测缺失事故题；新增HTTP200三结论、部分拒绝禁止原请求重试及后端证据追问。
- 独立通关：作者复评通过。独立通关改变子trace ID、错误路径和迟到采样；响应判读覆盖接受/警告/拒绝/异常四种结果并指定回看小节。
- AIOps 与证据：作者复评通过。遥测合同与关联进入告警诊断/根因分析，明确采样偏差、debug非存储证明及合成字段学习证据。

**验证边界**

- reasoned：完整阅读本篇；Jina Reader查OTLP官方协议确认HTTP200 partialSuccess、拒绝数量/警告与不得重试原请求。；限制：未实现完整OTLP客户端，教学判读只接受已解析的合成成功正文。
- executed：正常/故障telemetry.mjs opentelemetry输出missingParents=0/1；新响应课堂原代码通过四行精确输出验证。；限制：纯离线模型及JSON分支，不涉及真实SDK传播、Collector或后端。
- syntax：本篇三段Python代码compile通过（包括明示非独立运行的手动埋点片段）；定向diff检查通过。；限制：语法通过不证明可运行片段的外部变量或依赖已就绪。
- unrun：Collector容器、OTLP网络、跨线程传播、持久后端查询与容量实验待运行。；限制：本机Docker daemon不可用，本轮未启动容器或接入业务系统。

第二位审校者：cloud-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮差异、相关机制及基础/故障实验与独立通关；不是再次全文重审。
- HTTP200完整/警告/部分拒绝区分，本跳成功不冒充持久化，禁止原批重发符合协议；复核父子trace关系、404恢复与debug导出范围。
- 独立执行原判读脚本四输出并核对官方OTLP规范；未启动Collector或后端。

### Prometheus 精讲

[打开课程](./observability/prometheus.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：全文审读后发现高基数速查表将删标签当成直接处理方向，与前文身份碰撞警示不够一致；指标 drop 和 labeldrop 被合并表述。
- 初评：已有无数据不等于零的说明，但没有让学生观察 NaN、空向量、零值元素及 bool 比较在告警中差异的可复现对照。
- 修订：速查表与高基数建议改为先定位来源、区别丢整条指标与删标签、删除前证明序列身份唯一。
- 修订：新增教师批改课堂：四条合成 PromQL 对照、up == bool 0 错题、补零显示约定与 NaN 边界、错因回看路径。

**八项正文证据**

- 前置与路线：作者复评通过。开课准备和 AIOps 入门实验明确 Python/Docker、端口、独立目录、Bash/PowerShell分支及备用命令择一；新增课堂沿用已启动查询页。
- 机制与状态：作者复评通过。数据模型、重标记、向量匹配、查询时钟和新教师批改说明样本身份、Counter重置、空向量/零/NaN以及过滤比较与bool比较。
- 基础实验：作者复评通过。Python完整应用、80/20有限输入、Prometheus配置和规则、Targets/查询与清理形成首跑闭环；新版合成查询不依赖新增业务指标。
- 故障实验：作者复评通过。停止本课应用观察抓取失败及pending/firing，恢复后查重置；教师批改以错误bool表达式预测误激活并回到过滤式。
- 生产取舍：作者复评通过。远端写入、双副本与去重、基数/磁盘容量、监控自身、备份及回滚均有边界；修正速查表以免删标签碰撞。
- 递进面试：作者复评通过。30秒/3分钟回答、多集群设计、图断事故、错误率分母及bool反例给出证据路径和追问答案。
- 独立通关：作者复评通过。独立通关改变实例流量与重置、零与缺失、57600000样本容量；新增四结果对照要求解释并提交原输出。
- AIOps 与证据：作者复评通过。指标合同、查询卡、采样时间与缺失处理连接异常检测/SLO/告警；学习证据不把合成模型当真实采集。

**验证边界**

- reasoned：逐段完整阅读本篇正文；通过 Jina Reader 核对官方 PromQL operators 与 alerting_rules 的比较过滤、NaN、向量存在性激活语义。；限制：未核对所有历史版本，新增语义课堂不宣称生产告警已验证。
- executed：telemetry.mjs prometheus 正常/故障各运行一次，resetAware=11，estimate=11/4，issue=false/true。；限制：离线算法模型，不是 PromQL 引擎或真实 Prometheus。
- syntax：本篇两个 Python 代码块通过 compile 语法检查；定向 git diff --check 通过。；限制：语法检查不执行网络、容器或库依赖。
- unrun：真实 Prometheus 抓取、四条 UI 查询、告警与容器实验待隔离环境运行。；限制：本机 Docker daemon 不可连接；未主动启动用户桌面服务。

第二位审校者：cloud-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮差异、相关机制及基础/故障实验与独立通关；不是再次全文重审。
- 过滤比较与bool保留元素、NaN/空/零、drop与labeldrop三组边界一致；复核基础80/20计数、停止抓取及通关分母/重置/容量，未见阻断。
- 静态语义复核；未运行PromQL引擎、容器或告警。

### VictoriaMetrics

[打开课程](./observability/victoriametrics.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：全文审读后发现迟到样本实验没有显式拒绝查询失败状态，PowerShell空输出仍有误判风险。
- 初评：正文说明即时查询评估时间，但学生缺少将原始样本时间与评估时间交叉核对的反馈题。
- 修订：两个窗口请求增加status成功检查，失败不进入空结果判读。
- 修订：新增教师批改：value评估时间不等于样本新鲜度；核对历史values时间和值、重复实验污染与三类时间证据。

**八项正文证据**

- 前置与路线：作者复评通过。回环端口8428、Docker Linux与PowerShell、容器/卷冲突检查、单机版本和远端写入网络前提已完整；新课复用固定时间变量。
- 机制与状态：作者复评通过。索引与样本、基数与更替、vmagent缓冲、MetricsQL边界、复制不补历史、去重身份及评估/样本时间有解释。
- 基础实验：作者复评通过。固定v1.122.0导入文本42、latency_offset说明、状态/标签/值检查、UI与API及课堂资源清理闭环。
- 故障实验：作者复评通过。十分钟前88样本与固定当前/历史2m窗口，新增双响应成功验证、原始样本时间对照、失败排查及非网络故障边界。
- 生产取舍：作者复评通过。读写分离、队列净排空、跨故障域复制、部分响应拒绝、保留/备份恢复、租户授权及升级回滚覆盖。
- 递进面试：作者复评通过。跨站设计、历史补传、部分响应与重复曲线追问具备机制和证据；新课要求区分查询速度与数据新鲜度。
- 独立通关：作者复评通过。独立两实例3+7、去重标签、迟到99、积压90分钟与部分响应题；新增原始values和评估time反例反馈。
- AIOps 与证据：作者复评通过。数据新鲜度、缺失/零/部分数据分别进入模型与告警，历史补传不等于自动补发；GitHub保存时间线和实际响应。

**验证边界**

- reasoned：全文逐段阅读并补读工具截断段；通过web核对VictoriaMetrics官方keyconcepts即时查询输出时间语义。；限制：官方资料核验与静态推理，不是版本环境运行。
- executed：telemetry.mjs victoriametrics正/故障输出57600000/57600000000样本每日、issue=false/true。；限制：仅标签基数算术模型，不是实际写入性能。
- syntax：本篇全部PowerShell围栏与另两篇合计26块通过Parser.ParseInput；定向diff检查通过。；限制：不执行容器、HTTP或删除卷。
- unrun：真实VM容器、导入/查询、双窗口与原始时间验收未运行。；限制：Docker daemon不可用，未主动启动用户服务。

第二位审校者：cloud-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮差异、相关机制及基础/故障实验与独立通关；不是再次全文重审。
- 区分评估时间与原样本时间；双窗口查询先验证status，重复实验须按vmEvent定位；复核毫秒导入、秒查询、缓冲、去重与净排空算例。
- PowerShell AST通过；静态复核，没有真实VM写入或查询。

### Zabbix 深讲

[打开课程](./observability/zabbix.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：全文审读发现Units字典将展示与转换合说；把基础整数毫秒项迁移到小数秒时，unsigned类型在倍率前截断的隐患未解释。
- 初评：预处理有概念介绍与风险警告，但缺少正常/缺字段/非数字和失败设零的逐步反证任务。
- 修订：修正Units字段说明，区分显示与存储转换。
- 修订：新增教师批改，以未保存表单的预处理Test all steps验证JSONPath、Numeric(float)、倍率、失败处理和原监控项保持不变；标注真实UI未运行。

**八项正文证据**

- 前置与路线：作者复评通过。Compose/Docker/Powershell、8080/10051冲突、4GB、数据库/Agent网络、当前目录与原生命令边界清楚。
- 机制与状态：作者复评通过。Host/Item/Trigger/Event/Action、history/trends、Proxy模式、宏与依赖、回差及新增类型/预处理顺序有机制和反例。
- 基础实验：作者复评通过。完整四容器配置、自定义文件100、Agent本地测试、前端主机/项/触发器、更新周期与清理。
- 故障实验：作者复评通过。900到100故障恢复事件、边界值与停Agent旧正常值；新增预处理坏输入与设置零反例，取消未保存表单收回。
- 生产取舍：作者复评通过。NVPS/缓存/数据库容量、Server与数据库分故障域、Proxy断链排空、TLS/PSK脚本权限与schema回滚。
- 递进面试：作者复评通过。三地5000台设计、40%主机不可达、数据库慢追问、告警每跳证据；新增0.6乘1000为零的类型排错。
- 独立通关：作者复评通过。独立回差五边界、窗口覆盖、采集停留、317万行与净排空、事件五追问；新测试要求逐步输入输出证据。
- AIOps 与证据：作者复评通过。统一事件标签、模型历史新鲜度/预处理错误、Webhook幂等审批回写、模板及复盘证据明确。

**验证边界**

- reasoned：全文完整阅读；Jina读取官方7.4 preprocessing与testing页面核对unsigned倍率前截断、失败处理和测试在Server执行。；限制：未验证具体前端呈现，不把测试窗口写作当实际操作。
- executed：telemetry.mjs zabbix正/故障对比600与0.6、problem=true/false。；限制：离线单位算术，不验证Zabbix类型转换。
- syntax：PowerShell围栏与另外两篇合计26块解析通过，定向diff检查通过。；限制：Compose、镜像与UI未启动。
- unrun：固定版本Zabbix部署、100/900恢复事件、unsigned截断和失败设零UI测试待隔离环境。；限制：不外发通知，不以例子宣称生产可用。

第二位审校者：cloud-independent-2026-11-11；日期：2026-11-11。

- 独立复评本轮差异、相关机制及基础/故障实验与独立通关；不是再次全文重审。
- 浮点/unsigned、倍率与显示单位分层，测试失败设零反例不保存生产项；复核基础100/900回差、旧值新鲜度与Proxy排空算例。
- 独立查Zabbix7.4官方确认unsigned倍率前截断；PowerShell AST通过，未跑UI/Server。

### JumpServer 技术栈深讲

[打开课程](./security-compliance/jumpserver.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：旧v4入口跳v5；版本表当前字样误导；wget/nc前置隐藏；个人恢复生产备份风险。
- 修订：补文档版本跳转警示与固定标签源码入口，明确旧快照；补下载/探测工具；恢复授权和合成备份隔离课堂。
- 修订：交叉审校返工：明确总两份与原始外另备两份分别为两份/三份，复算5.79TiB与8.69TiB，不再含混副本数量。

**八项正文证据**

- 前置与路线：作者复评通过。纸面授权先行，实际安装限定两台新隔离LinuxVM和准备入口，零基础不在Windows跑安装器。
- 机制与状态：作者复评通过。User/Asset/Account、Core到各Connector及数据库/Redis/录像/密钥恢复单位解释清晰。
- 基础实验：作者复评通过。固定安装器下载校验、初始化、六步访问审计有预期、失败链和回收顺序。
- 故障实验：作者复评通过。单资产错误端口不改真实sshd，22/2223对照、Koko日志、恢复会话与审计验证。
- 生产取舍：作者复评通过。长连接LB、共享状态HA、协议容量、Socket主机信任、凭据轮换和数据库回退边界。
- 递进面试：作者复评通过。八组递进追问与LB事故/5000资产设计有机制取舍和保留未知范围。
- 独立通关：作者复评通过。恢复课堂画出站依赖、识别克隆任务副作用，分清旧密钥恢复与泄露后安全轮换。
- AIOps 与证据：作者复评通过。访问/权限/审计事件进AIOps调查、变更和RCA，不让模型分数自动断全网；学习证据脱敏。

**验证边界**

- reasoned：2026-11-11逐段阅读全文，八维复评，保留已充分的机制、双实验、生产设计和递进面试层；补文档版本跳转警示与固定标签源码入口，明确旧快照；补下载/探测工具；恢复授权和合成备份隔离课堂。；限制：不保证阅读后完全掌握或获得录用；未运行真实生产服务与外部变更。
- reasoned：读取官方v4.10.19安装器配置与GHSA公告，确认旧文档入口现跳v5；全文静态核对两VM实验及工具用法。；限制：未安装JumpServer、创建两VM或运行真实SSH/审计/升级；产品实验待隔离实跑。

第二位审校者：refresh-foundation-platform；日期：2026-11-11。

- 审阅范围：完整本轮diff、双实验及独立通关的必要正文/代码上下文；不是本轮全文重复审读。
- 发现独立通关原文“另存两份”与5.79TiB仅两份总量不符，已反馈作者返工并逐字复查：原始一份加另备一份共5.79TiB，原始外另两份共8.69TiB。
- 复核SSH基础实验、错误端口注入、恢复和清理全路径及备份恢复出网限制。账号重名、精确端口和授权范围有保护；没有安装JumpServer、连接真实资产或执行凭据轮换。
- 独立执行 tmp/check-root-refresh-2026-11-11.mjs：40项检查、11段PowerShell语法与7项事故断言全部通过；证据为本地合成验证，不能代替生产验收。

### 网络安全等级保护（等保 2.0）深讲

[打开课程](./security-compliance/mlps.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：基础采集强迫三发现；目录与哈希生成失败可能非终止；管道枚举可能含生成中的清单。
- 修订：目录/枚举/哈希/导出均Stop；先固定文件再算完全部哈希后导出；按事实分类，新增风险例外不等于控制通过。

**八项正文证据**

- 前置与路线：作者复评通过。从三项合成资产与文本编辑器起步，Windows取证为下一层，不要求搭集群。
- 机制与状态：作者复评通过。保护对象到控制/证据/整改及身份、网络、日志、恢复五段机制含观察与故障。
- 基础实验：作者复评通过。纸面证据表与Windows只读证据包有精确操作、预期、失败状态、隐私和清理。
- 故障实验：作者复评通过。调岗/日志迁移模拟及采集失败关卡保留原记录、修复复核、不改真实权限。
- 生产取舍：作者复评通过。共享责任、持续控制、采集平台自身HA/容量/最小权限和变更重评边界明确。
- 递进面试：作者复评通过。递进答案与生产设计/离职账号事故说明证据、反证、修复影响与回退。
- 独立通关：作者复评通过。风险例外课堂要求到期、新入口与补偿控制证据，不能扫描绿灯等同修复、批准和正式合规。
- AIOps 与证据：作者复评通过。AIOps监控资产、漂移、日志失鲜、整改与模型权限，GitHub只公开合成/脱敏证据。

**验证边界**

- reasoned：2026-11-11逐段阅读全文，八维复评，保留已充分的机制、双实验、生产设计和递进面试层；目录/枚举/哈希/导出均Stop；先固定文件再算完全部哈希后导出；按事实分类，新增风险例外不等于控制通过。；限制：不保证阅读后完全掌握或获得录用；未运行真实生产服务与外部变更。
- executed：PowerShell7实际合成collected/failed/failed/collected与文件哈希清单无自引用；全部相关PS围栏解析；官方修正法第二十三/二十七条核对。；限制：仅合成文件与模拟采集错误；未读取本机账号/端口等安全数据或执行正式测评。

第二位审校者：refresh-foundation-platform；日期：2026-11-11。

- 审阅范围：完整本轮diff、双实验及独立通关的必要正文/代码上下文；不是本轮全文重复审读。
- 证据收集失败仍保留状态和部分文件，哈希不把失败变成功；清单生成前固定输入、哈希全部完成再导出避免自引用；例外审批不等于风险修复/正式合规。
- 独立重跑合成PowerShell采集：正常/throw/非终止错误/正常得到collected/failed/failed/collected，摘要不含自身；未采本机真实安全清单，未作正式测评。
- 独立执行 tmp/check-root-refresh-2026-11-11.mjs：40项检查、11段PowerShell语法与7项事故断言全部通过；证据为本地合成验证，不能代替生产验收。

### AIOps 闭环

[打开课程](./sre-aiops/aiops-loop.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：学习层强迫每事故改所有规则/SLO；回滚角色授权含混；迟到真实标签缺专项辨析。
- 修订：改为按证据复核保留不变可合理；审批明确；新增6已核实2猜测2待日志的两版评价训练。

**八项正文证据**

- 前置与路线：作者复评通过。开篇不要求先拥有所有产品；Node入口链接根目录与安装，蓝图区分实际存在的例子与待实现工程。
- 机制与状态：作者复评通过。“事件契约”“有限状态机”说明重复、乱序、跨系统缝隙、批准、租约与结果未知。
- 基础实验：作者复评通过。分类正常/泄漏课堂有精确命令、TP/FP/FN、手算与检查清理。
- 故障实验：作者复评通过。生产模拟给重复回调、资料过期/干扰文本、模型超时与业务验收失败，恢复与清理明确。
- 生产取舍：作者复评通过。容量成本、独立基础响应、租户权限、版本组合升级回退及外部副作用分开处理。
- 递进面试：作者复评通过。30秒/3分钟、队列不等于不重不丢、自评分不是概率、权限不是模型语气等递进答案。
- 独立通关：作者复评通过。老师批改要求标签来源/截止时间/版本及难样本选择偏差，不能自生成自评分或将未知补零。
- AIOps 与证据：作者复评通过。全篇以观测到反馈主链组织，GitHub证据含真实与模拟标记、拒绝危险建议及独立验证。

**验证边界**

- reasoned：2026-11-11逐段阅读全文，八维复评，保留已充分的机制、双实验、生产设计和递进面试层；改为按证据复核保留不变可合理；审批明确；新增6已核实2猜测2待日志的两版评价训练。；限制：不保证阅读后完全掌握或获得录用；未运行真实生产服务与外部变更。
- executed：执行aiops正常/时间泄漏模型；核对10条分类、两次评价的可知信息边界。；限制：本地合成模型、纸面推理或说明中列出的脚本执行，不证明网络、持久性、真实平台或生产验收。

第二位审校者：refresh-foundation-platform；日期：2026-11-11。

- 审阅范围：完整本轮diff、双实验及独立通关的必要正文/代码上下文；不是本轮全文重复审读。
- 六项已核实标签与四项未核实分开；迟到标签需要版本与时间边界，易核验子集存在选择偏差。600/分钟输入、30/分钟理想处理、5700十分钟积压复算。
- 实跑aiops双模式：0.75精确率/召回率和时间泄漏拒绝；未训练模型或调用外部平台。
- 独立执行 tmp/check-root-refresh-2026-11-11.mjs：40项检查、11段PowerShell语法与7项事故断言全部通过；证据为本地合成验证，不能代替生产验收。

### 告警治理

[打开课程](./sre-aiops/alert-governance.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：两份抑制配置缺env边界；磁盘耗尽示例固定ticket，面试总结缩成仅已经用户可见。
- 修订：两份配置增加env非空匹配和equal；根据响应窗口判断磁盘等级；新增跨环境、跨租户、缺标签四卡回归。

**八项正文证据**

- 前置与路线：作者复评通过。“基础实验与故障实验”链接 Node 安装与根目录，说明不发送真实通知。
- 机制与状态：作者复评通过。“时间状态课堂”“路由合同课堂”及 Routing 片段逐层解释身份、状态、匹配顺序与去重边界。
- 基础实验：作者复评通过。四事件合成实验有正常三组、故障一组与拒绝判断，精确命令、失败检查和无资源清理。
- 故障实验：作者复评通过。分组丢租户、动态标签重置与路由四卡片含注入、复测及不触生产范围。
- 生产取舍：作者复评通过。“一万条规则如何安全演进”覆盖计算/通知容量、HA非严格一次、租户权限、版本及回退。
- 递进面试：作者复评通过。30秒、3分钟及漏报反例解释症状、风险、机制和模型建议不可直接删规则。
- 独立通关：作者复评通过。四卡要求合格抑制与三个拒绝反例，解释标签隔离并不证明因果关系。
- AIOps 与证据：作者复评通过。“AIOps 如何参与”及“学习证据”保留合成回放、标签规范、风险与漏报审查。

**验证边界**

- reasoned：2026-11-11逐段阅读全文，八维复评，保留已充分的机制、双实验、生产设计和递进面试层；两份配置增加env非空匹配和equal；根据响应窗口判断磁盘等级；新增跨环境、跨租户、缺标签四卡回归。；限制：不保证阅读后完全掌握或获得录用；未运行真实生产服务与外部变更。
- executed：执行alert正常/故障及四组非空/相等条件合成断言；官方配置页复核缺失与空标签规则。；限制：本地合成模型、纸面推理或说明中列出的脚本执行，不证明网络、持久性、真实平台或生产验收。

第二位审校者：refresh-foundation-platform；日期：2026-11-11。

- 审阅范围：完整本轮diff、双实验及独立通关的必要正文/代码上下文；不是本轮全文重复审读。
- 来源/目标均要求非空env并以tenant/env/service相等限制抑制；缺失/空标签不得越界合并。正常3组、错误service-only1组、20%通知精确率与60%事故召回率口径清楚。
- 实跑alert两模式及标签边界四组断言；未部署Alertmanager或发送通知。
- 独立执行 tmp/check-root-refresh-2026-11-11.mjs：40项检查、11段PowerShell语法与7项事故断言全部通过；证据为本地合成验证，不能代替生产验收。

### 变更管理

[打开课程](./sre-aiops/change-management.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：紧急变更风险等级与审批角色过度固定；时间先后被称强候选；灰度覆盖仍需强化。
- 修订：风险与紧急程度分开，授权矩阵替代角色自动授权，增加100请求零失败与读流量不验证金额写入的批改。

**八项正文证据**

- 前置与路线：作者复评通过。开课准备与“最小启动检查”区分离线和现有集群前提、上下文权限与命名空间。
- 机制与状态：作者复评通过。“提交、执行与生效”“数据演进”解释漂移、中间状态、双写/回填风险。
- 基础实验：作者复评通过。Node 正常/故障及完整候选脚本有输入文件、精确命令、输出、失败分支与清理。
- 故障实验：作者复评通过。“被修改过的批准单”含批次漂移、超时未知、无指标三故障与停止/恢复/收回。
- 生产取舍：作者复评通过。“容量算术”“安全与制品身份”覆盖剩余容量、数据库连接、兼容、权限与不可逆回退。
- 递进面试：作者复评通过。高阶面试与独立通关有代表性灰度、哈希身份、数据库回退及因果反例答案。
- 独立通关：作者复评通过。老师批改要求样本代表性、共享风险和批准对象匹配，不将零失败放行全量。
- AIOps 与证据：作者复评通过。AIOps关联按时间/范围/机制给候选，学习证据保留记录、兼容矩阵及课堂边界。

**验证边界**

- reasoned：2026-11-11逐段阅读全文，八维复评，保留已充分的机制、双实验、生产设计和递进面试层；风险与紧急程度分开，授权矩阵替代角色自动授权，增加100请求零失败与读流量不验证金额写入的批改。；限制：不保证阅读后完全掌握或获得录用；未运行真实生产服务与外部变更。
- executed：执行change正常/故障；手工核对灰度样本覆盖与审批边界反例。；限制：本地合成模型、纸面推理或说明中列出的脚本执行，不证明网络、持久性、真实平台或生产验收。

第二位审校者：refresh-foundation-platform；日期：2026-11-11。

- 审阅范围：完整本轮diff、双实验及独立通关的必要正文/代码上下文；不是本轮全文重复审读。
- 旧组万次错10、新组百次0仍需代表性和写入验证；IC停止放量不扩张到数据库写权限。批准卡改批次、入口超时和空指标均有不同安全停止出口。
- 实跑change双模式；兼容矩阵、800到500容量和450连接预算复算，未执行发布。
- 独立执行 tmp/check-root-refresh-2026-11-11.mjs：40项检查、11段PowerShell语法与7项事故断言全部通过；证据为本地合成验证，不能代替生产验收。

### 事件响应

[打开课程](./sre-aiops/incident-response.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：练习强制事件数量；已接受但未知结果没有进一步拆数据库接受与最终业务完成的追问。
- 修订：取消凑时间线数量；增加40笔中10笔核实30笔无权查询及新探测不混原分母的交接训练。

**八项正文证据**

- 前置与路线：作者复评通过。“从零搭建响应台”讲角色与受控记录，离线实验链接 Node/目录前置。
- 机制与状态：作者复评通过。“同一句超时”与生命周期区分提交、回包、发生/采集/录入时间及恢复状态。
- 基础实验：作者复评通过。incident 正常与故障命令有4分钟发现、15分钟验收/null未知、检查与清理。
- 故障实验：作者复评通过。“回滚以后，还剩四十笔订单”给完整合成输入、数量守恒、未知补偿、恢复范围和清理。
- 生产取舍：作者复评通过。“事故平台自己不可用”讲独立依赖、应急权限、容量、交接与共同依赖动作协调。
- 递进面试：作者复评通过。30秒、3分钟、回滚未恢复及五项追问均包含答案和边界。
- 独立通关：作者复评通过。老师批改区分客户端未知、数据库已知、最终状态待查，拒绝无权限等于失败和盲重提。
- AIOps 与证据：作者复评通过。“从事故记录到 AIOps”只允许证据可追溯草稿，学习证据保留时间线与模拟标记。

**验证边界**

- reasoned：2026-11-11逐段阅读全文，八维复评，保留已充分的机制、双实验、生产设计和递进面试层；取消凑时间线数量；增加40笔中10笔核实30笔无权查询及新探测不混原分母的交接训练。；限制：不保证阅读后完全掌握或获得录用；未运行真实生产服务与外部变更。
- executed：执行incident正常/故障；复算900+60+40原集合与10/30更新不重复计数。；限制：本地合成模型、纸面推理或说明中列出的脚本执行，不证明网络、持久性、真实平台或生产验收。

第二位审校者：refresh-foundation-platform；日期：2026-11-11。

- 审阅范围：完整本轮diff、双实验及独立通关的必要正文/代码上下文；不是本轮全文重复审读。
- 原始1000请求与后续20探针分母不混合；已受理40条中10已查明、30未知不误写为失败；恢复时刻与仅缓解不同。
- 实跑incident正常/故障；纸面生产场景与独立通关检查，不连接真实事故系统。
- 独立执行 tmp/check-root-refresh-2026-11-11.mjs：40项检查、11段PowerShell语法与7项事故断言全部通过；证据为本地合成验证，不能代替生产验收。

### RCA 根因分析

[打开课程](./sre-aiops/rca.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：复盘仍强迫三促成因素四行动项，可能诱发证据不足时编结论。
- 修订：改成据实因素与恢复/补证/防线行动，增加回滚和数据库配额同时变化的混杂反例。

**八项正文证据**

- 前置与路线：作者复评通过。开篇课堂从连接等待解释概念，离线前提链接准备，机房实验明确Node22及不需要数据库。
- 机制与状态：作者复评通过。“沿一次请求”“因果推理”区分等待/执行、必要条件、反馈、触发与促成因素。
- 基础实验：作者复评通过。正常/缺因果/四行机房实验含输入、预期、手算、命令、失败保护与清理。
- 故障实验：作者复评通过。缺失机房实验拒绝全站结论；冲突批次、非法计数和重复导入测试覆盖故障分支。
- 生产取舍：作者复评通过。RCA助手设计覆盖证据版本、权限、模型失效、查询预算、影子升级回退与行动防线正反验收。
- 递进面试：作者复评通过。30秒/3分钟及因果、恢复、平均口径追问有机制与反例答案。
- 独立通关：作者复评通过。老师批改稀疏时间线允许不确定结论；迟到配额证据使仅回滚归因不成立。
- AIOps 与证据：作者复评通过。事故知识库只收可追溯证据和审核结论，学习证据不强迫编造原因或生产履历。

**验证边界**

- reasoned：2026-11-11逐段阅读全文，八维复评，保留已充分的机制、双实验、生产设计和递进面试层；改成据实因素与恢复/补证/防线行动，增加回滚和数据库配额同时变化的混杂反例。；限制：不保证阅读后完全掌握或获得录用；未运行真实生产服务与外部变更。
- executed：执行rca正常/故障及事故证据课堂七项回归；复核未知出口与安全不重现生产事故。；限制：本地合成模型、纸面推理或说明中列出的脚本执行，不证明网络、持久性、真实平台或生产验收。

第二位审校者：refresh-foundation-platform；日期：2026-11-11。

- 审阅范围：完整本轮diff、双实验及独立通关的必要正文/代码上下文；不是本轮全文重复审读。
- 09:36数据库配额改变构成回滚单因果结论的混杂因素；分层比率改善但总体1.8%升到4.55%由权重改变解释，等权复算5%到2.75%。
- 实跑rca双模式与7项事故断言中的分组、缺失、重复输入检查；不是生产因果实证。
- 独立执行 tmp/check-root-refresh-2026-11-11.mjs：40项检查、11段PowerShell语法与7项事故断言全部通过；证据为本地合成验证，不能代替生产验收。

### Runbook

[打开课程](./sre-aiops/runbook.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：地图仍以告警停止/投诉停止代替积极验收；模板将IC当自动审批人；同名重建需强化。
- 修订：地图增加观测覆盖/主动业务/残余接管；授权矩阵；新增UID改变及资源版本改变的拒绝课堂。

**八项正文证据**

- 前置与路线：作者复评通过。开课准备明确Node/目录；Bash脚本要求现有隔离集群、kubectl和只读身份，不提供生产默认值。
- 机制与状态：作者复评通过。执行契约、持久执行、操作编号/对象编号、租约隔离、超时/取消/补偿分层解释。
- 基础实验：作者复评通过。内存防重课堂与lost-response模型含精确命令、写入次数/状态、预期、失败检查与清理。
- 故障实验：作者复评通过。lost-receipt/changed-plan/version-drift要求不盲重发，七项断言验证零写入或等待核对边界。
- 生产取舍：作者复评通过。一百服务平台、扩容预算、身份/权限、状态持久性、执行器升级与手册生命周期均讲适用边界。
- 递进面试：作者复评通过。30秒/3分钟与批准后换目标、无回执、重启防重、LLM资料不授予权限等连续答案。
- 独立通关：作者复评通过。老师批改两份合成计划均先停写核对，说明UID、resourceVersion、条件写与TOCTOU边界。
- AIOps 与证据：作者复评通过。手册进入AIOps检索与受控动作，提交合成计划/审批/脱敏回执，不把控制状态称业务恢复。

**验证边界**

- reasoned：2026-11-11逐段阅读全文，八维复评，保留已充分的机制、双实验、生产设计和递进面试层；地图增加观测覆盖/主动业务/残余接管；授权矩阵；新增UID改变及资源版本改变的拒绝课堂。；限制：不保证阅读后完全掌握或获得录用；未运行真实生产服务与外部变更。
- executed：执行runbook正常/故障及事故证据课堂七项；核对新增同名对象推理，不实连集群。；限制：本地合成模型、纸面推理或说明中列出的脚本执行，不证明网络、持久性、真实平台或生产验收。

第二位审校者：refresh-foundation-platform；日期：2026-11-11。

- 审阅范围：完整本轮diff、双实验及独立通关的必要正文/代码上下文；不是本轮全文重复审读。
- UID识别生命周期、resourceVersion识别状态变化；冲突不得删除前置条件绕过。同名对象不等于原授权目标，早期读取不消除检查执行竞争。
- 实跑runbook双模式与丢响应、丢回执、批准/版本变化断言；只验证合成控制状态，不声称真实Kubernetes并发或业务恢复。
- 独立执行 tmp/check-root-refresh-2026-11-11.mjs：40项检查、11段PowerShell语法与7项事故断言全部通过；证据为本地合成验证，不能代替生产验收。

### SLI / SLO / SLA

[打开课程](./sre-aiops/sli-slo-sla.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：多目标组合缺少联合事件的明确反例，易把两个边际90%误作同时90%或独立相乘。
- 修订：增加85/5/5/5合成计数，区分联合85%、条件85/90、边际90%与80%到90%的约束范围。

**八项正文证据**

- 前置与路线：作者复评通过。开篇老师认路及“基础实验：纸笔与程序互相检查”限定本机 Node、根目录和离线范围，并链接实际安装/下载步骤。
- 机制与状态：作者复评通过。“加权课堂”“燃烧率推导”“PromQL 进阶”解释事件分母、窗口、标签与空集合边界。
- 基础实验：作者复评通过。“基础实验：纸笔与程序互相检查”有两条精确命令、期望字段、手算、目录故障与无需服务清理。
- 故障实验：作者复评通过。“分母选错”及“标签故障实验”给注入条件、对照、修复、复测与不连接生产范围。
- 生产取舍：作者复评通过。“依赖与高可用”“治理与安全”覆盖故障域、预算、策略版本及安全要求不能兑换预算。
- 递进面试：作者复评通过。“面试课堂”“面试深答”及独立通关第五关含 30 秒、3 分钟、机制与假设追问。
- 独立通关：作者复评通过。老师批改要求逐条计算成功且及时、独立性假设和分母，不靠背可用性目标。
- AIOps 与证据：作者复评通过。“SLO 与 AIOps”“学习证据”把预算用于异常优先级与变更决策，保留口径和规则而非虚构经历。

**验证边界**

- reasoned：2026-11-11逐段阅读全文，八维复评，保留已充分的机制、双实验、生产设计和递进面试层；增加85/5/5/5合成计数，区分联合85%、条件85/90、边际90%与80%到90%的约束范围。；限制：不保证阅读后完全掌握或获得录用；未运行真实生产服务与外部变更。
- executed：执行slo正常/故障两分支，并以Node断言核对新增合成分子分母。；限制：本地合成模型、纸面推理或说明中列出的脚本执行，不证明网络、持久性、真实平台或生产验收。

第二位审校者：refresh-foundation-platform；日期：2026-11-11。

- 审阅范围：完整本轮diff、双实验及独立通关的必要正文/代码上下文；不是本轮全文重复审读。
- 本轮联合成功且快85%与两项边际90%不能相乘推导；条件比例85/90与80%-90%联合边界复算一致。五关预算200、60%消耗和0.6燃烧率成立。
- 实跑slo正常/故障与独立数学断言；未运行真实Prometheus与服务流量。
- 独立执行 tmp/check-root-refresh-2026-11-11.mjs：40项检查、11段PowerShell语法与7项事故断言全部通过；证据为本地合成验证，不能代替生产验收。

### 爱数 AnyStorage 深讲

[打开课程](./storage-data-protection/aishu-anystorage.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：全文已有产品边界、严格CSV输入合同、完整故障恢复、三份能力证据与GX迁移反例，未找到需强行改写的新增教学缺口。
- 修订：保留现有专属教师引导、错因校准和移交边界；不编造未公开CLI、CDP内部机制或现场许可。

**八项正文证据**

- 前置与路线：作者复评通过。零设备Windows PowerShell离线目录、UTF8/BOM、文件创建、子进程exit说明完整。
- 机制与状态：作者复评通过。AnyStorage7/GX/AnyBackup角色和SAN/NAS、前后端映射、RAID2.0非RAID2、缓存/分层分别解释。
- 基础实验：作者复评通过。四对象CSV正常3WARN1OK退出1，检查对象覆盖/重复/方向/单位/有限数，允许安全无设备复现。
- 故障实验：作者复评通过。池92critical2，再四值70/100/0/0.2恢复OK0，空表UNKNOWN3，清理只两样例文件。
- 生产取舍：作者复评通过。GX源/目标迁移新写入、双活权威端、保留依赖、WORM不可逆风险、独立备份及故障域容量。
- 递进面试：作者复评通过。30秒产品分工、3分钟SAN/GX路径、异构迁移设计和前后端四路径不保证独立的连续追问。
- 独立通关：作者复评通过。路径50/100边界、NaN/错误方向/重复/额外表头、100TiB池84→90约3天，必须预测和反证。
- AIOps 与证据：作者复评通过。WWID/业务/owner/前后端路径/保护关系拓扑与只读自动化、脱敏GitHub工单和恢复证据。

**验证边界**

- reasoned：全文925行阅读；检查器从正文提取运行的详细结果见tmp/check-storage-refresh-2026-11-11.mjs。；限制：无AnyStorage/GX/AnyBackup设备或许可；离线规则不证明真实复制、双活、恢复或CLI兼容。
- executed：node tmp/check-storage-refresh-2026-11-11.mjs：91项本地合成CSV、字节完整性、容量算术与反例检查通过。Python 3.15.2；多数PowerShell用5.1.26100.9818，TCE完整性实验用7.6.9。；限制：TCE首次在Node子进程中的PS5.1遇Get-FileHash自动加载失败，改用PS7通过，未据此断言5.1兼容。未连接真实阵列/FC交换机/Ceph/FastDFS服务/TCE API，未验证真实故障切换与性能。

第二位审校者：root-independent-2026-11-11；日期：2026-11-11。

- 本轮独立评审针对当前diff和相关机制、实验、故障及面试上下文；除明确注明全文的文章外，不声称第二次全文重读。独立复跑存储检查脚本91项通过，证据保存在本轮tmp/storage-refresh-tests-DdibK9。
- 独立核对SAN/NAS/GX路径、型号许可边界、完整基础与故障恢复、容量/迁移/面试和换条件通关。四项健康合同先验对象/单位/方向，缺失不是健康；GX切换后新写入不能直接切回旧源。
- 独立复跑原文PowerShell检查器11类输入：基线WARN1、池92严重2、恢复0、路径50严重2、空/重复/NaN/方向/单位/101/阈值顺序UNKNOWN3。只验证本地规则，未访问爱数设备或恢复真实数据。

### Brocade 6510 光纤交换机深讲

[打开课程](./storage-data-protection/brocade-6510.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：全文已有端口不等于路径、计数增量/重置、信用等待方向、zoning集合变更与EOS逐Fabric迁移，保留充分内容。
- 修订：不新增重复段落；保留单变量光链路、路径身份和完整输入反例，版本适用性继续按原厂/OEM核对。

**八项正文证据**

- 前置与路线：作者复评通过。Python3标准库、个人空目录、CSV/脚本与当前目录明示，不需要交换机账号。
- 机制与状态：作者复评通过。FLOGI/PLOGI/PRLI、WWPN/FCID、zoning/masking、FSPF/ISL/credit逐层，管理IP不证明FC。
- 基础实验：作者复评通过。四端口合成CSV从正文可直接执行，计数非负整数、对象覆盖与重复拒绝。
- 故障实验：作者复评通过。CRC12/loss2和C3/credit900分别候选，退出2；还原备份返回0才清理，输入错退出1。
- 生产取舍：作者复评通过。独立A/B不合并、容量过订阅/信用距离、配置并发锁、许可证/备件/观察期和迁移停止条件。
- 递进面试：作者复评通过。定义机制取舍诊断层连续追问；慢排水事故含证据/反证/影响面/保护健康Fabric。
- 独立通关：作者复评通过。四端口非四路径、错卷仍在线、credit100/101、重置负计数、4:1过订阅和回接图独立任务。
- AIOps 与证据：作者复评通过。WWPN→端口→zone→目标→业务关联，采集失效单列，公开证据需去真实拓扑。

**验证边界**

- reasoned：全文798行分段阅读；本轮从正文执行CSV检查器正常、故障、输入异常和信用边界用例，见存储检查脚本。；限制：没有连接FC交换机、清计数、修改zoning、光模块更换或Fabric切换；未重新验证全部OEM支持合同。
- executed：node tmp/check-storage-refresh-2026-11-11.mjs：91项本地合成CSV、字节完整性、容量算术与反例检查通过。Python 3.15.2；多数PowerShell用5.1.26100.9818，TCE完整性实验用7.6.9。；限制：TCE首次在Node子进程中的PS5.1遇Get-FileHash自动加载失败，改用PS7通过，未据此断言5.1兼容。未连接真实阵列/FC交换机/Ceph/FastDFS服务/TCE API，未验证真实故障切换与性能。

第二位审校者：root-independent-2026-11-11；日期：2026-11-11。

- 本轮独立评审针对当前diff和相关机制、实验、故障及面试上下文；除明确注明全文的文章外，不声称第二次全文重读。独立复跑存储检查脚本91项通过，证据保存在本轮tmp/storage-refresh-tests-DdibK9。
- 独立核对完整双实验和端到端/信用/光链路/zoning/迁移/面试通关。四端口不等于四主机路径；defined与effective、zoning与masking分层；计数清零不得当负错误率，双Fabric不为凑链路合并。
- 独立运行Python原文10类输入含credit100/101边界、缺失/重复/NaN/负数/空设备。未连接FC设备、执行固件升级或真实路径隔离；EOS和型号支持不能从全系列latest推断。

### Ceph 深讲

[打开课程](./storage-data-protection/ceph.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：全文复评未发现必须改写的新增缺口；已有三副本降级、MON与数据条件、peering历史、缓存确认、DB/WAL共同依赖和换条件通关，不能因本轮更新要求重复铺写。
- 修订：保留原有技术专属教师反馈与反例；保留固定20.2.4学习基线和2026-10-12资料核对时点，不冒充本轮部署或最新版核验。

**八项正文证据**

- 前置与路线：作者复评通过。先区分Linux/空白实验机、三块确知空盘、cephadm与单机限制，安装逐步检查镜像、设备与失败停止。
- 机制与状态：作者复评通过。对象→pool/PG→CRUSH/OSD路径；MON共识不是数据副本投票，peering看有效历史，active不等于clean。
- 基础实验：作者复评通过。固定镜像单机部署、显式盘路径、pool/RBD验证与精确测试镜像清理，不给通配清盘。
- 故障实验：作者复评通过。仅隔离环境停osd.0，size3/min_size2基线先clean；再up/in与PGclean验证，不能停第二个或降低阈值。
- 生产取舍：作者复评通过。host故障域三机不能在两机恢复三份；共享DB/WAL盘故障、容量水位、恢复竞争、升级格式和Cephx边界。
- 递进面试：作者复评通过。30秒/3分钟回答、全局70%但backfillfull、扩容slow ops及升级不可直接降镜像的追问。
- 独立通关：作者复评通过。唯一版本七在失联OSD反例、空间与故障域分开、服务/冗余/性能分别验收，有迁移条件。
- AIOps 与证据：作者复评通过。healthcode→PG→acting set→OSD/主机/盘/网络与变更关联，脱敏架构、状态、容量和事故记录。

**验证边界**

- reasoned：全文943行已分段阅读；复核双实验前提/清理、容量算式与反例。仅原文规范/逻辑复评与本轮算术检查，不把旧引用当成本轮全量在线检查。；限制：未部署Ceph、未使用空盘、未停OSD、未测缓存持久性/恢复流量；文档判通过不代表生产熟练度。
- executed：node tmp/check-storage-refresh-2026-11-11.mjs：91项本地合成CSV、字节完整性、容量算术与反例检查通过。Python 3.15.2；多数PowerShell用5.1.26100.9818，TCE完整性实验用7.6.9。；限制：TCE首次在Node子进程中的PS5.1遇Get-FileHash自动加载失败，改用PS7通过，未据此断言5.1兼容。未连接真实阵列/FC交换机/Ceph/FastDFS服务/TCE API，未验证真实故障切换与性能。

第二位审校者：root-independent-2026-11-11；日期：2026-11-11。

- 本轮独立评审针对当前diff和相关机制、实验、故障及面试上下文；除明确注明全文的文章外，不声称第二次全文重读。独立复跑存储检查脚本91项通过，证据保存在本轮tmp/storage-refresh-tests-DdibK9。
- 独立审读起步/核心图、真实基础与OSD故障完整步骤、生产和独立通关相关上下文。显式空盘/隔离环境、size3/min_size2、先clean再单OSD动作，rbd info不声称真实数据I/O；清理不zap磁盘。
- 核对peering依历史权威副本而非简单数多数、host故障域三变二不能仍满足三独立域，以及共享DB/WAL依赖。仅审读与容量推理，未安装Ceph、停止OSD或验证真实恢复。

### Dell EMC VMAX 深讲

[打开课程](./storage-data-protection/dell-emc-vmax.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：只读命令把symcfg list -dir all注释为Director与端口状态，容易将控制器总览误当逐端口证明。
- 修订：将Director总览注释收窄；补-fa all -port；以所有Director在线但某端口离线反例讲清观察范围，引用Dell官方查询说明。

**八项正文证据**

- 前置与路线：作者复评通过。先说明专用硬件与代际，个人Python标准库、独立目录/UTF8，不安装SYMCLI或连接阵列。
- 机制与状态：作者复评通过。IG/PG/SG/MV、TDEV/SRP、受保护缓存、SnapVX fully-defined门槛、复制角色及本轮查询层级。
- 基础实验：作者复评通过。三SG合成CSV含业务/路径基线/保护策略/有限值，正常0并解释Synchronized只为课堂合同。
- 故障实验：作者复评通过。支付组89/14.6/4/2/SyncInProg四项2；恢复0，空表/重复/非法输入不报健康。
- 生产取舍：作者复评通过。SRP增长与回收、Nocopy版本边界、密钥模式、跨Director故障域、复制权威与扩卷不可逆。
- 递进面试：作者复评通过。30秒/3分钟及Oracle灾备设计；局部SG延迟/SRDF事故和证据对照、停止切换与回滚。
- 独立通关：作者复评通过。40.96天与45天采购、120/110/130权威迁移、NaN/保护缺失/基线改小反例和端口观察卡。
- AIOps 与证据：作者复评通过。SG/主机/前后端/复制/变更拓扑和基线、呈现审计、事故记录，标明未真阵列验证。

**验证边界**

- reasoned：全文739行阅读后修订；Dell官方symcfg与SE9.2.1 show view核对，后者语法原文正确未误改；CSV边界本轮实跑见检查脚本。；限制：未执行SYMCLI、真实SnapVX/SRDF、密钥或缓存持久性试验；官方查询语法不替代现场支持矩阵。
- executed：node tmp/check-storage-refresh-2026-11-11.mjs：91项本地合成CSV、字节完整性、容量算术与反例检查通过。Python 3.15.2；多数PowerShell用5.1.26100.9818，TCE完整性实验用7.6.9。；限制：TCE首次在Node子进程中的PS5.1遇Get-FileHash自动加载失败，改用PS7通过，未据此断言5.1兼容。未连接真实阵列/FC交换机/Ceph/FastDFS服务/TCE API，未验证真实故障切换与性能。

第二位审校者：root-independent-2026-11-11；日期：2026-11-11。

- 本轮独立评审针对当前diff和相关机制、实验、故障及面试上下文；除明确注明全文的文章外，不声称第二次全文重读。独立复跑存储检查脚本91项通过，证据保存在本轮tmp/storage-refresh-tests-DdibK9。
- 独立审读全部本轮diff及对象、命令、完整双实验、生产和通关上下文。Dell官方KB独立核实list -fa all是director列表，-port才查端口；主机I/O仍另验。IG/PG/SG、复制权威、Nocopy和备份边界清楚。
- 独立运行原文Python11类输入：基线、组合故障、空/重复/缺失、NaN/负数/错误服务/降低路径基线、未配置保护和85边界。仅CSV模型，未运行Solutions Enabler、连接阵列、验证SRDF切换。

### Dell EMC VPLEX 深讲

[打开课程](./storage-data-protection/dell-emc-vplex.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：全文已有写穿透/后端确认、global visibility非本地副本、系统卷区分、唯一权威与前后端依赖，未发现需重写缺口。
- 修订：保留既有教师推演与版本特定链接；不把两票模型或统一RTT数套到未验证GeoSynchrony。

**八项正文证据**

- 前置与路线：作者复评通过。VS2/VS6/GeoSynchrony边界、无设备PythonCSV、独立目录与脚本完整步骤。
- 机制与状态：作者复评通过。Storage Volume→Extent→Device→Virtual Volume→View；FE/BE分离、write-through非写回、Witness非数据副本。
- 基础实验：作者复评通过。四对象CSV及8/8/4/4课堂基线，类型归属/路径/有限重建值检查，正常0。
- 故障实验：作者复评通过。分布式卷分区与系统卷单路径退出2；备份还原0、空/重复退出1，完整清理范围。
- 生产取舍：作者复评通过。CG规则和第三域、前后端故障域、logging/metadata区别、迁移90%禁止撤源、增量收敛和版本恢复。
- 递进面试：作者复评通过。30秒/3分钟、WAN断联两侧要求写的事故、OracleRAC设计与Witness/need-resume追问。
- 独立通关：作者复评通过。可见/副本/可写三列、路径数量不可替代域、600/(100-40)=10h、原子权威与回切写入校准。
- AIOps 与证据：作者复评通过。FE/BE/cluster/卷/WAN/变更与主机业务证据关联，采样时点和脱敏学习证据。

**验证边界**

- reasoned：全文715行阅读；复核核心状态、双实验、算术和迁移反例；本文CSV脚本本轮提取做正负边界运行。；限制：未连接VPLEX、断WAN、改CG/恢复仲裁；合成fields不是CLI解析器，不证明真实仲裁。
- executed：node tmp/check-storage-refresh-2026-11-11.mjs：91项本地合成CSV、字节完整性、容量算术与反例检查通过。Python 3.15.2；多数PowerShell用5.1.26100.9818，TCE完整性实验用7.6.9。；限制：TCE首次在Node子进程中的PS5.1遇Get-FileHash自动加载失败，改用PS7通过，未据此断言5.1兼容。未连接真实阵列/FC交换机/Ceph/FastDFS服务/TCE API，未验证真实故障切换与性能。

第二位审校者：root-independent-2026-11-11；日期：2026-11-11。

- 本轮独立评审针对当前diff和相关机制、实验、故障及面试上下文；除明确注明全文的文章外，不声称第二次全文重读。独立复跑存储检查脚本91项通过，证据保存在本轮tmp/storage-refresh-tests-DdibK9。
- 独立核对HA/升级、完整基础与故障、分区设计、缓存/可见性/系统卷/迁移/通关。虚拟对象链、单一权威、write-through不等于物理盘每笔落盘、global visibility不等于远端副本，保护恢复与业务恢复分开。
- 独立运行Python10类输入含路径减半、仅rebuild99.9、归属错误、NaN和覆盖缺失；净收敛600/(100-40)=10小时仅模型。未连接VPLEX或验证Witness仲裁、迁移和WAN分区。

### FastDFS 深讲

[打开课程](./storage-data-protection/fastdfs.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：全文以固定V6.18.1及依赖版本讲安装，已有回环Tracker限制、工具失败退出0、Exporter负值、异步确认/幂等/错挂载反例，无需为更新重写。
- 修订：保留源码版本化课程、真实Linux未执行声明、可复现Python双实验和换条件通关；不把固定历史基线写成当前最新。

**八项正文证据**

- 前置与路线：作者复评通过。进程/端口/文件系统/副本从零讲；可先Python3.9无依赖，再独立Ubuntu学习机，账号和地址防混用。
- 机制与状态：作者复评通过。Tracker调度与字节流分离、group组内复制组间分担、file_id非授权、路径身份及异步确认窗口。
- 基础实验：作者复评通过。固定依赖编译顺序、三配置、专户、真标识上传下载cmp；本地demo展示ACK早于副本。
- 故障实验：作者复评通过。本地fault真删自有副本/翻比特、可信源先验再恢复；临时目录自动清理、证据不覆盖。
- 生产取舍：作者复评通过。175TB副本与20%分母、故障域/NAS共同依赖、保留身份和迁移引用、超时未知、权限与升级数据兼容。
- 递进面试：作者复评通过。30秒/3分钟与三组递进题、70TB设计、上午新图404教学事故给两可证伪假设。
- 独立通关：作者复评通过。80×3/0.75=320、无新写最后同步旧不等于积压、重启不保内存幂等、200登录页非照片校准。
- AIOps 与证据：作者复评通过。官方Exporter/source指标语义、四层探针、OTel业务链、低基数标签与受控只读取证。

**验证边界**

- reasoned：全文714行分段阅读并补读工具截断段；本轮demo/fault/两容量值/非法输入/证据独占创建实跑。；限制：未编译或启动FastDFS、未真实多节点同步/HTTP/NFS/Exporter；本地文件和算术不冒充生产验收。
- executed：node tmp/check-storage-refresh-2026-11-11.mjs：91项本地合成CSV、字节完整性、容量算术与反例检查通过。Python 3.15.2；多数PowerShell用5.1.26100.9818，TCE完整性实验用7.6.9。；限制：TCE首次在Node子进程中的PS5.1遇Get-FileHash自动加载失败，改用PS7通过，未据此断言5.1兼容。未连接真实阵列/FC交换机/Ceph/FastDFS服务/TCE API，未验证真实故障切换与性能。

第二位审校者：root-independent-2026-11-11；日期：2026-11-11。

- 本轮独立评审针对当前diff和相关机制、实验、故障及面试上下文；除明确注明全文的文章外，不声称第二次全文重读。独立复跑存储检查脚本91项通过，证据保存在本轮tmp/storage-refresh-tests-DdibK9。
- 独立核对核心六概念、双实验、容量/故障域/NFS/迁移、事故与换条件通关。Tracker调度与文件字节分开，组内异步ACK窗口、ACTIVE不保证文件、内存幂等不跨重启、来源不明停止覆盖。
- 独立实跑仓库demo/fault，内容缺失与翻位均检测并恢复，自有临时数据清理；175/320容量模型、非法参数和已有证据拒覆盖通过。真实字节哈希不等于真实FastDFS同步、HTTP、跨进程事务或灾备验收。

### 华为 OceanStor 深讲

[打开课程](./storage-data-protection/huawei-oceanstor.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：capacity段将allocated一律解释为卷逻辑承诺，与Dorado6.1.2官方总订阅/已分配/数据保护口径冲突，会误导容量判断。
- 修订：分开total subscribed、allocated、used，修正开场池使用字段；增加100TiB池150订阅40已分配10保护的教师账本及保护增长反例，要求版本/对象/模式/单位/时点。

**八项正文证据**

- 前置与路线：作者复评通过。WindowsPS5.1/BOM和CSV/脚本前置课，不需阵列权限；产品Dorado/Pacific/保护边界清楚。
- 机制与状态：作者复评通过。控制器/池/LUN/映射/文件/双活五要素齐全；本轮按Dorado6.1.2修正容量口径而非跨域硬译。
- 基础实验：作者复评通过。四项阈值脚本、全量输入验证、2WARN2OK退出1，方向/单位/NaN/缺行UNKNOWN3。
- 故障实验：作者复评通过。池92故障2、恢复70/3.6/100/0为0；路径50/51边界及精确两文件清理。
- 生产取舍：作者复评通过。HyperMetro数据权威/三网、快照克隆独立性、QoS资源竞争、兼容矩阵和保护条件门禁。
- 递进面试：作者复评通过。30秒/3分钟、共享池数据库竞争设计、部件恢复/冗余/业务三次验收和无强启动猜测。
- 独立通关：作者复评通过。路径域分布反例、WWID不匹配停止、78.125MiB/s算例、150%订阅不代表已用150%教师反证。
- AIOps 与证据：作者复评通过。原字段/版本/对象→归一化模型、业务/owner/端口/LUN/池/保护关系与变更，脱敏证据清单。

**验证边界**

- reasoned：全文901行阅读；2026-11-11读取华为官方Dorado6.1.2系统容量术语与浏览池信息，按其对象层和模式重写；PowerShell阈值脚本本轮离线运行。；限制：未访问Huawei设备、真实容量回收/HyperMetro/恢复；早先英文入口403，最终以可读取官方中文容量页核验。
- executed：node tmp/check-storage-refresh-2026-11-11.mjs：91项本地合成CSV、字节完整性、容量算术与反例检查通过。Python 3.15.2；多数PowerShell用5.1.26100.9818，TCE完整性实验用7.6.9。；限制：TCE首次在Node子进程中的PS5.1遇Get-FileHash自动加载失败，改用PS7通过，未据此断言5.1兼容。未连接真实阵列/FC交换机/Ceph/FastDFS服务/TCE API，未验证真实故障切换与性能。

第二位审校者：root-independent-2026-11-11；日期：2026-11-11。

- 本轮独立评审针对当前diff和相关机制、实验、故障及面试上下文；除明确注明全文的文章外，不声称第二次全文重读。独立复跑存储检查脚本91项通过，证据保存在本轮tmp/storage-refresh-tests-DdibK9。
- 独立核对全部本轮diff、块/文件/HyperMetro路径、完整样例/故障回归、设计与通关。已分配与认购/超配口径按具体界面分开，不跨型号硬译；WWPN/WWID/Host ID不互换，双控不能替路径冗余。
- 独立复跑PowerShell11类输入，基线WARN1、严重2、恢复0及输入UNKNOWN3均符合。华为所引官方容量页本次直连超时、Jina返回504，未声称本次抓取成功；未连接阵列或验证HyperMetro/恢复。

### IBM Storage 深讲

[打开课程](./storage-data-protection/ibm-storage.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：原六步写入顺序将下刷到MDisk/介质放在主机确认之前，没有区分典型镜像写缓存确认和后台destage。
- 修订：按FlashSystem9.1.2官方双活处理路径修正步骤4-6；补前台写已结束而后端继续下刷反例，限定缓存模式/保护状态/远程复制条件。

**八项正文证据**

- 前置与路线：作者复评通过。品牌多产品边界和块文件对象磁带，从零解释HBA/SAN/extent；完整PS基线块与独立不覆盖目录。
- 机制与状态：作者复评通过。volume/MDisk/IOGroup/缓存/复制分层，补主机ACK与异步destage，不将镜像缓存等同备份。
- 基础实验：作者复评通过。四行历史样例输入全量验证再输出，1OK2WARN1CRITICAL断言，NoClobber保护证据。
- 故障实验：作者复评通过。漏保orders-control内存演练COVERAGE_OK→INCOMPLETE→OK，清理函数/变量，完整恢复不覆盖生产。
- 生产取舍：作者复评通过。双fabric/容量缩减保守情景、2TiB100MiB/s恢复下限、密钥目录依赖和升级代码/数据分开回退。
- 递进面试：作者复评通过。30秒/3分钟、数据库误删/恢复设计、可启动非业务验收、升级节点停止条件。
- 独立通关：作者复评通过。行级阈值重排数量仍1/2/1反例、非法时区/NaN、必保清单空拒绝、132.27KiB和恢复时长校准。
- AIOps 与证据：作者复评通过。StorageInsights采样频率/观测盲区、卷/端口/池/复制/业务拓扑，恢复点/演练覆盖证据。

**验证边界**

- reasoned：全文840行阅读（首段工具截断后补读）；2026-11-11官方FlashSystem9.1.2缓存镜像与下刷核验。基础PS、6非法输入、重复目录保护与覆盖恢复本轮实跑。；限制：未连接IBM系统、真实缓存持久性/FlashCopy/磁带恢复/升级；历史样例日期明确不代表当前健康。
- executed：node tmp/check-storage-refresh-2026-11-11.mjs：91项本地合成CSV、字节完整性、容量算术与反例检查通过。Python 3.15.2；多数PowerShell用5.1.26100.9818，TCE完整性实验用7.6.9。；限制：TCE首次在Node子进程中的PS5.1遇Get-FileHash自动加载失败，改用PS7通过，未据此断言5.1兼容。未连接真实阵列/FC交换机/Ceph/FastDFS服务/TCE API，未验证真实故障切换与性能。

第二位审校者：root-independent-2026-11-11；日期：2026-11-11。

- 本轮独立评审针对当前diff和相关机制、实验、故障及面试上下文；除明确注明全文的文章外，不声称第二次全文重读。独立复跑存储检查脚本91项通过，证据保存在本轮tmp/storage-refresh-tests-DdibK9。
- 独立审读本轮完整diff与写路径、完整基础/漏保故障、升级/生产/面试通关。IBM FlashSystem9.1.2官方页经Jina独立读取：缓存镜像与主机确认先于异步destage，只有owner下刷；非历史备份保证。
- 独立运行PowerShell报告1OK/2WARNING/1CRITICAL、六类非法输入、已有目录拒覆盖且旧报告不变、漏保COVERAGE_OK→INCOMPLETE→OK。容量2TiB/100MiB/s约5.83h；未验证实际阵列缓存持久性、升级或数据库恢复。

### Tencent TCE 存储与数据保护技术栈深讲

[打开课程](./storage-data-protection/tce-storage.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：两处把I/O队列深度仅定义为等待处理数，混淆已提交未完成在途量、正在服务、配置值和实际达到值。
- 修订：两处改为明确观察边界的在途量；补配置32实际1、在途32含服务8反例，引用fio实际depth/同步引擎限制，不增加真实写盘压测。

**八项正文证据**

- 前置与路线：作者复评通过。完整仓库根目录与PS5.1随机文件实验，不需云/K8s；TCE BOM/CBS/CFS/COS与公有云边界。
- 机制与状态：作者复评通过。块/文件/对象路径及确认层次、snapshot控制面状态、ETag非统一MD5、I/O深度与真实等待分离。
- 基础实验：作者复评通过。现有verify.ps1生成自有1MiB文件、复制SHA256，唯一临时目录不覆盖历史材料。
- 故障实验：作者复评通过。首字节XOR必变化、检测差异、仅可信源回填、恢复相同、精确范围清理，四阶段分别断言。
- 生产取舍：作者复评通过。AZ/账号故障域、数据与密钥恢复、多卷一致点、格式升级不可随意降级、版本key+条件发布。
- 递进面试：作者复评通过。30秒/3分钟、容量60%仍慢、20TiB恢复设计及重建竞争事故，证据/影响/回滚。
- 独立通关：作者复评通过。1000缺1各自hash匹配仍失败、20TiB500MiB/s11.65h、32配置不等于32实测反例等独立练习。
- AIOps 与证据：作者复评通过。tenant/resource/AZ/backend/change关联、增长/恢复链/演练年龄与受控写操作，脱敏证据。

**验证边界**

- reasoned：全文416行阅读；fio官方I/O depth定义核对，本轮原样运行仓库PS完整性实验并检查基础/故障/恢复/清理四阶段。；限制：没有CBS/CFS/COS/CSI资源或真实TCE权限，不证明后端实现、性能/持久性/恢复目标；fio仅术语不实盘压测。
- executed：node tmp/check-storage-refresh-2026-11-11.mjs：91项本地合成CSV、字节完整性、容量算术与反例检查通过。Python 3.15.2；多数PowerShell用5.1.26100.9818，TCE完整性实验用7.6.9。；限制：TCE首次在Node子进程中的PS5.1遇Get-FileHash自动加载失败，改用PS7通过，未据此断言5.1兼容。未连接真实阵列/FC交换机/Ceph/FastDFS服务/TCE API，未验证真实故障切换与性能。

第二位审校者：root-independent-2026-11-11；日期：2026-11-11。

- 本轮独立评审针对当前diff和相关机制、实验、故障及面试上下文；除明确注明全文的文章外，不声称第二次全文重读。独立复跑存储检查脚本91项通过，证据保存在本轮tmp/storage-refresh-tests-DdibK9。
- 独立全文审读本篇及本轮diff；块/文件/对象访问、清单完整性/事务/密钥、快照异步状态和BOM支持边界明确。fio官方独立核实iodepth是在途未完成请求，设置值不等于实际深度，同步引擎通常不因调大获得并发。
- 独立PS7.6.9运行完整性脚本，baseline→翻位检测→恢复→精确临时清理通过；20TiB/500MiB/s约11.65h。未声称PS5.1本次已实跑、未调用TCE/CSI/云盘API或真实恢复压测。

### 华为 FusionSphere / FusionCompute 技术栈深讲

[打开课程](./virtualization-private-cloud/fusionsphere.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：健康报告误称逐个列出管理节点；VRM主备与计算集群浮动地址边界含混。
- 修订：修正报告实际栏目/节点观测范围及英文旁注；明确VRM主备；新增总空闲60但单机放不下50GiB的教师碎片反例。

**八项正文证据**

- 前置与路线：作者复评通过。先离线合成再授权取证，PowerShell与JSON样例及版本许可术语前置。
- 机制与状态：作者复评通过。VRM/CNA、任务和四层数据路径、HA/备份/容灾及双写边界分开。
- 基础实验：作者复评通过。健康样例精确命令、退出码/报告与防覆盖清理有预期和故障入口。
- 故障实验：作者复评通过。故障六项发现、证据假设、恢复新输出名与未实跑边界完整。
- 生产取舍：作者复评通过。故障域/容量/升级许可/网络存储身份/安全与原厂升级边界明确。
- 递进面试：作者复评通过。定义机制与生产迁移、管理断连、恢复验收渐进追问及答题依据。
- 独立通关：作者复评通过。独立通关新增三宿主各余20与单机50GiB、改变一台余量再核验其他约束，不把总量当合法落点。
- AIOps 与证据：作者复评通过。资产拓扑/指标告警与只读报告进入AIOps，GitHub证据需脱敏且区分合成。

**验证边界**

- reasoned：2026-11-11分段完整读至EOF；依据八维标准保留已充分的双实验、机制、生产与面试层，并针对真实缺口修订。；限制：全文审读与离线验证不保证个人完全掌握或录用；商业平台专属操作需要授权环境和匹配版本。
- executed：执行private-cloud-evidence-lab健康/六发现/覆盖拒绝/九类无效输入；复算60GiB总量与候选0到1。；限制：tmp/check-root-virtualization-2026-11-11.mjs共50检查含23个PS围栏语法；仅合成/本机验证，不含真实云API、账号、VM、硬件、迁移、HA或厂商验收。PowerShell实际运行7，不声称5.1已实跑。

第二位审校者：refresh-foundation-platform；日期：2026-11-11。

- 审阅范围：完整本轮diff、作者记录、检查脚本与核心机制/基础故障实验/独立通关必要上下文；不是本轮对旧版全篇重复审读。
- 确认VRM浮动地址归属与CNA集群不混同；健康报告缺管理节点行不误读为没有VRM；分配量不等于实时利用率。三宿主各余20合计60仍无50单机候选，换第三台余60仅满足本题内存条件；两级实验、恢复新输出及剩余风险自洽。
- 独立执行tmp/check-root-virtualization-2026-11-11.mjs，50项检查含23段PowerShell AST、合成规则/关系/地址/容量及本机HTTP200/404/200通过。主脚本用PowerShell7，共享verify内部子进程用5.1；无真实VM、云API、凭据、迁移或HA注入。

### KVM 虚拟化深讲

[打开课程](./virtualization-private-cloud/kvm.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：精简Ubuntu未明示curl/ssh-keygen所需包；hostnamectl注释把Domain名等同客户机名。
- 修订：安装补curl/openssh-client并讲明用途；区分Domain/客户机主机名，以MAC租约核对目标且保留SSH可信指纹检查。

**八项正文证据**

- 前置与路线：作者复评通过。官方分层重组说明宿主/客户机与Bash准备，Linux24.04可重装和嵌套前置明确。
- 机制与状态：作者复评通过。KVM/QEMU/libvirt边界、CPU/内存/网络/存储路径与live/config分别讲五要素。
- 基础实验：作者复评通过。云镜像摘要/overlay/virt-install/SSH有精确步骤与多层预期、失败与精确文件清理。
- 故障实验：作者复评通过。只改单实验VM网卡，不动桥/宿主链路；有基线、隔离证据、恢复与业务再连。
- 生产取舍：作者复评通过。HA仲裁fencing、N+1、迁移、持久化、安全、版本兼容和金丝雀回退有边界。
- 递进面试：作者复评通过。12组答案与追问、300VM设计和双写事故强调证据、机制、影响与恢复。
- 独立通关：作者复评通过。既有五关身份/336GiB/双状态/迁移与fencing充分；新增不能凭提示符名字认定目标。
- AIOps 与证据：作者复评通过。四层监控拓扑与稳定关联键、自动化分级、GitHub脱敏证据不宣称真实未跑。

**验证边界**

- reasoned：2026-11-11分段完整读至EOF；依据八维标准保留已充分的双实验、机制、生产与面试层，并针对真实缺口修订。；限制：全文审读与离线验证不保证个人完全掌握或录用；商业平台专属操作需要授权环境和匹配版本。
- reasoned：全文核对Ubuntu单机与单网卡故障前后置、安全清理和四条内部路径；安装和VM运行保持未实测。；限制：tmp/check-root-virtualization-2026-11-11.mjs共50检查含23个PS围栏语法；仅合成/本机验证，不含真实云API、账号、VM、硬件、迁移、HA或厂商验收。PowerShell实际运行7，不声称5.1已实跑。

第二位审校者：refresh-foundation-platform；日期：2026-11-11。

- 审阅范围：完整本轮diff、作者记录、检查脚本与核心机制/基础故障实验/独立通关必要上下文；不是本轮对旧版全篇重复审读。
- 安装补齐curl/openssh-client依赖，Domain名与客户机hostname不混同；MAC/lease和可信SSH指纹形成身份核对链。完整复核新建目录、镜像摘要、overlay、单网卡故障/恢复和准确清理上下文；未运行Linux/KVM创建、SSH或链路注入，不把静态审读当兼容实测。
- 独立执行tmp/check-root-virtualization-2026-11-11.mjs，50项检查含23段PowerShell AST、合成规则/关系/地址/容量及本机HTTP200/404/200通过。主脚本用PowerShell7，共享verify内部子进程用5.1；无真实VM、云API、凭据、迁移或HA注入。

### OpenStack 深讲

[打开课程](./virtualization-private-cloud/openstack.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：通用课仍残留特定岗位指代；token issue入门会打印完整令牌；NoValidHost与配额拒绝混用。
- 修订：移除未给来源岗位断言，认证命令仅显示expires；明确配额分支与调度候选/竞争证据。

**八项正文证据**

- 前置与路线：作者复评通过。无需云账号的调度课堂优先，Python/PowerShell/目录、客户端≠云及测试权限清楚。
- 机制与状态：作者复评通过。创建异步链、Placement账本、Neutron绑定/地址、Cinder附件与文件系统五要素。
- 基础实验：作者复评通过。完整PowerShell调度模型有基线断言；真实只读快照含错误停止、预期与清理。
- 故障实验：作者复评通过。移除候选导致无满足宿主，改内存恢复；授权安全组实验区分平台/本地/外部探针。
- 生产取舍：作者复评通过。Cells/故障隔离、fencing、容量碎片/超售、升级schema与最小权限凭据生命周期。
- 递进面试：作者复评通过。30秒/3分钟机制取舍、NoValidHost/控制面事故/镜像对照含答案及追问。
- 独立通关：作者复评通过。五关新约束、只读采集失败、源写者隔离仍充分；NoValidHost追问要求实际错误而非所有创建失败混称。
- AIOps 与证据：作者复评通过。请求ID/多对象稳定ID/范围时间分页与采集失败进入AIOps，证据脱敏。

**验证边界**

- reasoned：2026-11-11分段完整读至EOF；依据八维标准保留已充分的双实验、机制、生产与面试层，并针对真实缺口修订。；限制：全文审读与离线验证不保证个人完全掌握或录用；商业平台专属操作需要授权环境和匹配版本。
- executed：实际执行正文Placement基线host-c、故障无候选、恢复host-a；PS围栏AST；官方Nova调度及应用凭据机制复核。；限制：tmp/check-root-virtualization-2026-11-11.mjs共50检查含23个PS围栏语法；仅合成/本机验证，不含真实云API、账号、VM、硬件、迁移、HA或厂商验收。PowerShell实际运行7，不声称5.1已实跑。

第二位审校者：refresh-foundation-platform；日期：2026-11-11。

- 审阅范围：完整本轮diff、作者记录、检查脚本与核心机制/基础故障实验/独立通关必要上下文；不是本轮对旧版全篇重复审读。
- token只输出expires减少令牌公开风险，保存查询立即检查退出码且报告新目录；配额拒绝和NoValidHost调度无候选分支合理区分。Placement模型CPU与内存同宿主且-and，故障移除c/恢复a与容量反例成立；官方token页面本次抓取失败，不声称本次在线核实了该页。
- 独立执行tmp/check-root-virtualization-2026-11-11.mjs，50项检查含23段PowerShell AST、合成规则/关系/地址/容量及本机HTTP200/404/200通过。主脚本用PowerShell7，共享verify内部子进程用5.1；无真实VM、云API、凭据、迁移或HA注入。

### Tencent TCE IaaS 技术栈深讲

[打开课程](./virtualization-private-cloud/tce-iaas.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：CLB路径图把健康检查画成每次用户请求同步步骤；本地HTTP文件创建对零基础不够精确。
- 修订：拆开周期健康探测与按已有健康状态选后端；补精确创建healthz、失败停止及当前目录文件暴露边界。

**八项正文证据**

- 前置与路线：作者复评通过。本地HTTP/Python/PowerShell先于云，BOM许可与产品语义前置。
- 机制与状态：作者复评通过。CVM异步意图/任务、VPC/CLB往返、CBS多层与状态补偿讲解。
- 基础实验：作者复评通过。本地HTTP200和离线地址模型、合成报告有精确步骤和可保存证据。
- 故障实验：作者复评通过。404/重叠/六发现与健康输入新输出恢复，授权云故障明确边界。
- 生产取舍：作者复评通过。故障域容量、安全、Terraformstate/计划、升级数据与镜像许可边界。
- 递进面试：作者复评通过。创建失败/单AZ设计从机制到反证、幂等与补偿答案可追问。
- 独立通关：作者复评通过。五关既有云盘分层/容量/未知意图充分；新增单次业务成功不能由选中时健康担保的机制。
- AIOps 与证据：作者复评通过。请求任务资源稳定ID、业务探针与审计联动，不能混淆公有云与TCE。

**验证边界**

- reasoned：2026-11-11分段完整读至EOF；依据八维标准保留已充分的双实验、机制、生产与面试层，并针对真实缺口修订。；限制：全文审读与离线验证不保证个人完全掌握或录用；商业平台专属操作需要授权环境和匹配版本。
- executed：执行共享verify、原样Python地址规划/重叠/恢复与PowerShell重复意图模型；真实本地PythonHTTP服务动态端口验证200/404/200并停止自建进程。；限制：tmp/check-root-virtualization-2026-11-11.mjs共50检查含23个PS围栏语法；仅合成/本机验证，不含真实云API、账号、VM、硬件、迁移、HA或厂商验收。PowerShell实际运行7，不声称5.1已实跑。

第二位审校者：refresh-foundation-platform；日期：2026-11-11。

- 审阅范围：完整本轮diff、作者记录、检查脚本与核心机制/基础故障实验/独立通关必要上下文；不是本轮对旧版全篇重复审读。
- CLB探针与业务请求不串成逐请求强制探测；HTTP教学在新空目录且127.0.0.1绑定，故障是路径改变不是服务崩溃，退出码与HTTP状态分清。副作用未知先查任务、意图重复模型、IP网段重叠恢复及通关边界完整。
- 独立执行tmp/check-root-virtualization-2026-11-11.mjs，50项检查含23段PowerShell AST、合成规则/关系/地址/容量及本机HTTP200/404/200通过。主脚本用PowerShell7，共享verify内部子进程用5.1；无真实VM、云API、凭据、迁移或HA注入。

### Tencent TCE 运营、运维与安全技术栈深讲

[打开课程](./virtualization-private-cloud/tce-operations-security.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：五轮立即重试和五倍请求量混淆初次与重试；凭据轮换默认并存没区分疑似泄露。
- 修订：明确初次加五次重试共六次，同60秒1200QPS；总五次才1000；新增计划轮换与紧急吊销/已发会话验证分支。

**八项正文证据**

- 前置与路线：作者复评通过。仓库根目录/WindowsPowerShell与合成路线明确，不要求先懂容器。
- 机制与状态：作者复评通过。认证授权审计、任务受理/终态、证据时间与缓冲净流量解释。
- 基础实验：作者复评通过。合成健康0/PASS读回，缺字段/旧文件/时效与敏感证据边界。
- 故障实验：作者复评通过。合成故障2、分级影响、恢复新文件及验证器精确清理不删旧报告。
- 生产取舍：作者复评通过。观测自身HA、容量基数、身份生命周期、安全例外、备份密钥/升级回退。
- 递进面试：作者复评通过。两地设计/安全误伤事故和连续追问有机制证据与最小修复答案。
- 独立通关：作者复评通过。重试题限定全部尝试同一窗口且不等于瞬时峰值；轮换题改条件为泄露后不机械维持双凭据。
- AIOps 与证据：作者复评通过。观测/执行身份分离、日志不授新权限、稳定脱敏ID与交接剩余风险。

**验证边界**

- reasoned：2026-11-11分段完整读至EOF；依据八维标准保留已充分的双实验、机制、生产与面试层，并针对真实缺口修订。；限制：全文审读与离线验证不保证个人完全掌握或录用；商业平台专属操作需要授权环境和匹配版本。
- executed：运行共享巡检verify并断言200/1200/1000；核对CAM官方评估逻辑，紧急处置按授权而非通用承诺。；限制：tmp/check-root-virtualization-2026-11-11.mjs共50检查含23个PS围栏语法；仅合成/本机验证，不含真实云API、账号、VM、硬件、迁移、HA或厂商验收。PowerShell实际运行7，不声称5.1已实跑。

第二位审校者：refresh-foundation-platform；日期：2026-11-11。

- 审阅范围：完整本轮diff、作者记录、检查脚本与核心机制/基础故障实验/独立通关必要上下文；不是本轮对旧版全篇重复审读。
- 计划轮换与疑似泄露紧急吊销分支已区分，长期密钥与已签发会话不臆断同步撤销。每次初始+5重试=6次，全部同60秒窗口平均1200而非1000；缓冲20GiB净增5MiB/s=4096秒，与基础故障/未知输入语义一致。
- 独立执行tmp/check-root-virtualization-2026-11-11.mjs，50项检查含23段PowerShell AST、合成规则/关系/地址/容量及本机HTTP200/404/200通过。主脚本用PowerShell7，共享verify内部子进程用5.1；无真实VM、云API、凭据、迁移或HA注入。

### 腾讯专有云 TCE 全栈技术地图

[打开课程](./virtualization-private-cloud/tencent-tce.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：基础实验误称健康报告显示管理节点明细，英文报告口径需要准确解释。
- 修订：逐项对照脚本修正为输入managementNodes核对角色；补报告英文栏目、resource口径、Ready实际/期望数和PASS边界。

**八项正文证据**

- 前置与路线：作者复评通过。先离线关系与报告再按BOM进入专题，主要产品缩写有前置人话。
- 机制与状态：作者复评通过。三平面/创建链/业务链/意图请求任务资源和Terraform三账职责。
- 基础实验：作者复评通过。合成健康命令0读回报告、关系模型vol-c预测与前置排障。
- 故障实验：作者复评通过。degraded六项及新名恢复，漏页补齐与未知结果纸面故障区分不删盘。
- 生产取舍：作者复评通过。双AZ数据权威/隔离、容量承诺、身份安全、版本兼容/升级不可逆与许可。
- 递进面试：作者复评通过。产品边界30秒/3分钟、双区平台设计与共同网络事故含递进判断。
- 独立通关：作者复评通过。既有三账/双区/关系与重复请求五关充分；报告无节点行不能推断没有管理节点。
- AIOps 与证据：作者复评通过。稳定资源/租户/区域/时间联动日志审计拓扑，模型只提候选与批准动作。

**验证边界**

- reasoned：2026-11-11分段完整读至EOF；依据八维标准保留已充分的双实验、机制、生产与面试层，并针对真实缺口修订。；限制：全文审读与离线验证不保证个人完全掌握或录用；商业平台专属操作需要授权环境和匹配版本。
- executed：运行共享巡检verify；原样执行vol-c引用缺失与补入对象恢复PowerShell模型。；限制：tmp/check-root-virtualization-2026-11-11.mjs共50检查含23个PS围栏语法；仅合成/本机验证，不含真实云API、账号、VM、硬件、迁移、HA或厂商验收。PowerShell实际运行7，不声称5.1已实跑。

第二位审校者：refresh-foundation-platform；日期：2026-11-11。

- 审阅范围：完整本轮diff、作者记录、检查脚本与核心机制/基础故障实验/独立通关必要上下文；不是本轮对旧版全篇重复审读。
- 核对共享合成报告与fixture管理节点职责、实际报告字段；关系缺失vol-c只是当前样本引用不闭合，补漏页后0也不证明物理健康。请求ID不保证幂等、容量100-10-20-60=10及保护备份/数据权威边界明确。
- 独立执行tmp/check-root-virtualization-2026-11-11.mjs，50项检查含23段PowerShell AST、合成规则/关系/地址/容量及本机HTTP200/404/200通过。主脚本用PowerShell7，共享verify内部子进程用5.1；无真实VM、云API、凭据、迁移或HA注入。

### VMware vSphere 深讲

[打开课程](./virtualization-private-cloud/vsphere.md)；作者复评日期：2026-11-11；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：CSV创建错误未Stop；Ready平均数虽讲定义但欠集中等待反例；VCHA产品组合支持界线不足。
- 修订：新增Stop，补8vCPU同均值不同峰值的教师算例；链接Broadcom区分独立VVF与VCF受管vCenter的HA支持边界。

**八项正文证据**

- 前置与路线：作者复评通过。先做无需账号/许可证的本地CSV课堂，运行文件与终端前置明确。
- 机制与状态：作者复评通过。ESXi/vCenter、HA/DRS/迁移、内存回收、网络/存储数据路径与控制回执分开。
- 基础实验：作者复评通过。五行CSV和完整校验脚本有WARN/1、CRITICAL/2、OK/0、UNKNOWN/3预期与故障清理。
- 故障实验：作者复评通过。删行/坏样本拒绝、阈值异常与恢复闭环，明确不触真实vCenter。
- 生产取舍：作者复评通过。故障容量、共享存储、版本许可、权限证书、升级兼容和数据库/备份回退边界。
- 递进面试：作者复评通过。老师带练与机制答案、维护设计/迁移事故连续追问而非仅裸题。
- 独立通关：作者复评通过。1600集中与8个200平均均1%而最高8%/1%，改800后0.5%/4%；不能换算业务慢几倍。
- AIOps 与证据：作者复评通过。VM/Host/Datastore拓扑和采集失鲜进入AIOps，GitHub脱敏且不混淆课堂与真实演练。

**验证边界**

- reasoned：2026-11-11分段完整读至EOF；依据八维标准保留已充分的双实验、机制、生产与面试层，并针对真实缺口修订。；限制：全文审读与离线验证不保证个人完全掌握或录用；商业平台专属操作需要授权环境和匹配版本。
- executed：执行原样CSV规则14种正常/故障/缺失/无效/恢复输入与3组Ready断言；PS7语法；核对官方Ready、vVols与VCHA说明。；限制：tmp/check-root-virtualization-2026-11-11.mjs共50检查含23个PS围栏语法；仅合成/本机验证，不含真实云API、账号、VM、硬件、迁移、HA或厂商验收。PowerShell实际运行7，不声称5.1已实跑。

第二位审校者：refresh-foundation-platform；日期：2026-11-11。

- 审阅范围：完整本轮diff、作者记录、检查脚本与核心机制/基础故障实验/独立通关必要上下文；不是本轮对旧版全篇重复审读。
- Broadcom344909再次核对支持独立vSphere/VVF而VCF管理vCenter用vSphereHA，非远距灾备；306576确认Ready累加与按vCPU观察边界。两组总1600ms同平均1%但最大8%/1%，改800后0.5%/4%复算正确；14组CSV与恢复0/1/2/3状态验证通过。
- 独立执行tmp/check-root-virtualization-2026-11-11.mjs，50项检查含23段PowerShell AST、合成规则/关系/地址/容量及本机HTTP200/404/200通过。主脚本用PowerShell7，共享verify内部子进程用5.1；无真实VM、云API、凭据、迁移或HA注入。
