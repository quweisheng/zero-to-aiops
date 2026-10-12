# 技术栈逐篇评测与返工记录

本轮以 2026-10-12 精讲评测标准逐篇审校。这里记录正文的具体问题、修订和第二位审校者结论；不是自动关键词评分，也不表示读者已经掌握或全部真实产品已实跑。篇幅另见[正文统计](./teaching-coverage.md)，评测方法见[写作标准](./writing-standard.md#逐篇评测返工与独立通关)。

当前 115 篇：115 篇已有本轮修订记录，115 篇当前版本通过正文交叉审校，0 篇仍待处理。文章内容变化后旧审校自动失效；版本摘要只统一 UTF-8 文件开头标记及 Windows/Linux 换行，不忽略正文修改。未审校条目不会因字数够长而自动通过。

验证类型：executed 表示确实执行了所述有限检查；syntax 只检查语法；reasoned 是正文和证据推理；unrun 是尚未运行的环境。它们不能互相替代，运行了模拟也不等于验证了真实产品或生产系统。

| 技术栈 | 当前正文评测 | 初评问题数 | 实际验证范围 |
|---|---|---:|---|
| [系统架构与技术方案设计深讲](./architecture-delivery/architecture-solution-design.md) | 交叉审校通过（正文） | 3 | reasoned / executed |
| [IT 项目管理 / PMP 深讲](./architecture-delivery/it-project-management-pmp.md) | 交叉审校通过（正文） | 2 | reasoned / executed |
| [Ansible](./automation/ansible.md) | 交叉审校通过（正文） | 4 | reasoned / unrun |
| [CI/CD](./automation/cicd.md) | 交叉审校通过（正文） | 4 | executed / reasoned / unrun |
| [GitHub Actions](./automation/github-actions.md) | 交叉审校通过（正文） | 4 | reasoned / unrun |
| [GitLab 与 GitLab CI/CD 深讲](./automation/gitlab.md) | 交叉审校通过（正文） | 4 | reasoned / unrun |
| [Jenkins 技术栈深讲](./automation/jenkins.md) | 交叉审校通过（正文） | 4 | syntax / reasoned / unrun |
| [Apache Maven 技术栈深讲](./automation/maven.md) | 交叉审校通过（正文） | 4 | executed / syntax / reasoned / unrun |
| [n8n 技术栈深讲](./automation/n8n.md) | 交叉审校通过（正文） | 4 | syntax / reasoned / unrun |
| [Nexus Repository 深讲](./automation/nexus-repository.md) | 交叉审校通过（正文） | 4 | syntax / reasoned / unrun |
| [Runbook Automation](./automation/runbook-automation.md) | 交叉审校通过（正文） | 4 | executed / syntax / reasoned / unrun |
| [SonarQube 技术栈深讲](./automation/sonarqube.md) | 交叉审校通过（正文） | 4 | syntax / reasoned / unrun |
| [Terraform](./automation/terraform.md) | 交叉审校通过（正文） | 4 | syntax / reasoned / unrun |
| [Calico 深讲](./cloud-native/calico.md) | 交叉审校通过（正文） | 4 | reasoned / unrun |
| [Cilium 深讲](./cloud-native/cilium.md) | 交叉审校通过（正文） | 3 | reasoned / unrun |
| [Docker Compose 精讲](./cloud-native/docker-compose.md) | 交叉审校通过（正文） | 3 | syntax / reasoned / unrun |
| [Docker](./cloud-native/docker.md) | 交叉审校通过（正文） | 4 | executed / syntax / reasoned / unrun |
| [etcd 深讲](./cloud-native/etcd.md) | 交叉审校通过（正文） | 4 | reasoned / syntax / unrun |
| [Harbor 深讲](./cloud-native/harbor.md) | 交叉审校通过（正文） | 3 | reasoned / syntax / unrun |
| [Helm](./cloud-native/helm.md) | 交叉审校通过（正文） | 4 | executed / reasoned / syntax / unrun |
| [Istio 深讲](./cloud-native/istio.md) | 交叉审校通过（正文） | 3 | reasoned / unrun |
| [Kubeflow 技术栈深讲](./cloud-native/kubeflow.md) | 交叉审校通过（正文） | 4 | reasoned / unrun |
| [Kubernetes](./cloud-native/kubernetes.md) | 交叉审校通过（正文） | 4 | reasoned / unrun |
| [KubeSphere 深讲](./cloud-native/kubesphere.md) | 交叉审校通过（正文） | 4 | executed / syntax / reasoned / unrun |
| [微服务深讲](./cloud-native/microservices.md) | 交叉审校通过（正文） | 4 | reasoned / unrun |
| [NGINX / Ingress / Gateway API](./cloud-native/nginx-ingress.md) | 交叉审校通过（正文） | 4 | reasoned / unrun |
| [Rancher 深讲](./cloud-native/rancher.md) | 交叉审校通过（正文） | 3 | syntax / reasoned / unrun |
| [TKE on TCE 技术栈深讲](./cloud-native/tke-on-tce.md) | 交叉审校通过（正文） | 3 | reasoned / unrun |
| [Traefik 技术栈深讲](./cloud-native/traefik.md) | 交叉审校通过（正文） | 4 | reasoned / unrun |
| [Apache ActiveMQ 技术栈深讲：Classic 与 Artemis](./data-ai/activemq.md) | 交叉审校通过（正文） | 3 | syntax / reasoned / unrun |
| [Apache Pulsar 技术栈深讲](./data-ai/apache-pulsar.md) | 交叉审校通过（正文） | 5 | reasoned |
| [Dify 技术栈深讲](./data-ai/dify.md) | 交叉审校通过（正文） | 4 | syntax / reasoned / unrun |
| [FastAPI](./data-ai/fastapi.md) | 交叉审校通过（正文） | 2 | executed / reasoned / unrun |
| [Apache Flink 深讲](./data-ai/flink.md) | 交叉审校通过（正文） | 4 | reasoned |
| [Apache Hadoop 深讲](./data-ai/hadoop.md) | 交叉审校通过（正文） | 3 | reasoned / syntax / unrun |
| [Apache HAWQ 存量运维与迁移深讲](./data-ai/hawq.md) | 交叉审校通过（正文） | 3 | executed / reasoned |
| [Apache HBase 深讲](./data-ai/hbase.md) | 交叉审校通过（正文） | 3 | reasoned |
| [Apache Hive 深讲](./data-ai/hive.md) | 交叉审校通过（正文） | 4 | reasoned |
| [Kafka](./data-ai/kafka.md) | 交叉审校通过（正文） | 4 | executed / reasoned |
| [LangChain 技术栈深讲](./data-ai/langchain.md) | 交叉审校通过（正文） | 4 | syntax / reasoned / unrun |
| [LangGraph](./data-ai/langgraph.md) | 交叉审校通过（正文） | 4 | syntax / reasoned |
| [LLM / OpenAI API](./data-ai/llm-openai.md) | 交叉审校通过（正文） | 2 | executed / reasoned / unrun |
| [机器学习](./data-ai/machine-learning.md) | 交叉审校通过（正文） | 3 | syntax / executed |
| [MongoDB 技术栈深讲](./data-ai/mongodb.md) | 交叉审校通过（正文） | 4 | reasoned |
| [MySQL / SQL](./data-ai/mysql-sql.md) | 交叉审校通过（正文） | 3 | syntax / reasoned / unrun |
| [Ollama 技术栈深讲](./data-ai/ollama.md) | 交叉审校通过（正文） | 2 | executed / reasoned / unrun |
| [Oracle Database 深讲](./data-ai/oracle.md) | 交叉审校通过（正文） | 3 | reasoned |
| [pandas](./data-ai/pandas.md) | 交叉审校通过（正文） | 3 | syntax / executed |
| [PostgreSQL 深讲](./data-ai/postgresql.md) | 交叉审校通过（正文） | 5 | reasoned |
| [PyTorch 技术栈深讲](./data-ai/pytorch.md) | 交叉审校通过（正文） | 3 | syntax / reasoned / unrun |
| [RabbitMQ 深讲](./data-ai/rabbitmq.md) | 交叉审校通过（正文） | 3 | executed / syntax / reasoned / unrun |
| [RAG](./data-ai/rag.md) | 交叉审校通过（正文） | 3 | syntax / executed / reasoned |
| [Redis](./data-ai/redis.md) | 交叉审校通过（正文） | 3 | reasoned / syntax / unrun |
| [scikit-learn](./data-ai/scikit-learn.md) | 交叉审校通过（正文） | 3 | syntax / executed / reasoned |
| [Apache Spark 深讲](./data-ai/spark.md) | 交叉审校通过（正文） | 4 | reasoned |
| [Tencent TCE 数据库、缓存、消息与数据平台技术地图](./data-ai/tce-data-middleware.md) | 交叉审校通过（正文） | 3 | executed / reasoned |
| [Tencent TDSQL-C MySQL 技术栈深讲](./data-ai/tdsql-mysql.md) | 交叉审校通过（正文） | 3 | reasoned |
| [TensorFlow 深讲](./data-ai/tensorflow.md) | 交叉审校通过（正文） | 3 | syntax / executed / reasoned |
| [Transformer 技术栈深讲](./data-ai/transformer.md) | 交叉审校通过（正文） | 3 | syntax / executed |
| [向量数据库](./data-ai/vector-database.md) | 交叉审校通过（正文） | 3 | syntax / executed / reasoned |
| [Apache ZooKeeper 深讲](./data-ai/zookeeper.md) | 交叉审校通过（正文） | 3 | executed / reasoned |
| [Git 深讲](./foundation/git.md) | 交叉审校通过（正文） | 3 | reasoned |
| [GitHub](./foundation/github.md) | 交叉审校通过（正文） | 3 | reasoned |
| [Go（Golang）深讲](./foundation/golang.md) | 交叉审校通过（正文） | 4 | executed |
| [Java 技术栈深讲](./foundation/java.md) | 交叉审校通过（正文） | 4 | executed / syntax |
| [Linux 深讲](./foundation/linux.md) | 交叉审校通过（正文） | 3 | reasoned |
| [Markdown](./foundation/markdown.md) | 交叉审校通过（正文） | 3 | reasoned |
| [网络基础](./foundation/networking.md) | 交叉审校通过（正文） | 3 | reasoned |
| [Python](./foundation/python.md) | 交叉审校通过（正文） | 3 | executed |
| [RESTful API 技术栈深讲](./foundation/restful-api.md) | 交叉审校通过（正文） | 3 | syntax |
| [Shell / PowerShell](./foundation/shell-powershell.md) | 交叉审校通过（正文） | 2 | syntax / executed |
| [systemd](./foundation/systemd.md) | 交叉审校通过（正文） | 3 | reasoned |
| [VitePress](./foundation/vitepress.md) | 交叉审校通过（正文） | 3 | reasoned |
| [Ajax 技术栈深讲](./frontend/ajax.md) | 交叉审校通过（正文） | 3 | syntax |
| [CSS 技术栈深讲](./frontend/css.md) | 交叉审校通过（正文） | 3 | reasoned |
| [HTML 技术栈深讲](./frontend/html.md) | 交叉审校通过（正文） | 3 | syntax |
| [JavaScript 技术栈深讲](./frontend/javascript.md) | 交叉审校通过（正文） | 3 | syntax / executed |
| [React 技术栈深讲](./frontend/react.md) | 交叉审校通过（正文） | 3 | syntax |
| [TypeScript 技术栈深讲](./frontend/typescript.md) | 交叉审校通过（正文） | 3 | executed |
| [Vue 技术栈深讲](./frontend/vue.md) | 交叉审校通过（正文） | 3 | syntax |
| [Apache Tomcat 技术栈深讲](./middleware-application-platform/tomcat.md) | 交叉审校通过（正文） | 3 | syntax |
| [IBM WebSphere 技术栈深讲](./middleware-application-platform/websphere.md) | 交叉审校通过（正文） | 3 | syntax |
| [Alertmanager](./observability/alertmanager.md) | 交叉审校通过（正文） | 3 | reasoned |
| [Elasticsearch](./observability/elasticsearch.md) | 交叉审校通过（正文） | 5 | reasoned |
| [Grafana 精讲](./observability/grafana.md) | 交叉审校通过（正文） | 3 | reasoned |
| [Grafana Loki](./observability/loki.md) | 交叉审校通过（正文） | 3 | reasoned |
| [OpenTelemetry](./observability/opentelemetry.md) | 交叉审校通过（正文） | 3 | reasoned |
| [Prometheus 精讲](./observability/prometheus.md) | 交叉审校通过（正文） | 3 | reasoned |
| [VictoriaMetrics](./observability/victoriametrics.md) | 交叉审校通过（正文） | 5 | reasoned |
| [Zabbix 深讲](./observability/zabbix.md) | 交叉审校通过（正文） | 5 | reasoned |
| [JumpServer 技术栈深讲](./security-compliance/jumpserver.md) | 交叉审校通过（正文） | 3 | reasoned / syntax |
| [网络安全等级保护（等保 2.0）深讲](./security-compliance/mlps.md) | 交叉审校通过（正文） | 2 | reasoned / syntax / executed |
| [AIOps 闭环](./sre-aiops/aiops-loop.md) | 交叉审校通过（正文） | 3 | reasoned / executed |
| [告警治理](./sre-aiops/alert-governance.md) | 交叉审校通过（正文） | 3 | reasoned / executed |
| [变更管理](./sre-aiops/change-management.md) | 交叉审校通过（正文） | 3 | reasoned / executed |
| [事件响应](./sre-aiops/incident-response.md) | 交叉审校通过（正文） | 3 | reasoned / executed |
| [RCA 根因分析](./sre-aiops/rca.md) | 交叉审校通过（正文） | 3 | reasoned / executed |
| [Runbook](./sre-aiops/runbook.md) | 交叉审校通过（正文） | 3 | reasoned / executed |
| [SLI / SLO / SLA](./sre-aiops/sli-slo-sla.md) | 交叉审校通过（正文） | 2 | reasoned / executed |
| [爱数 AnyStorage 深讲](./storage-data-protection/aishu-anystorage.md) | 交叉审校通过（正文） | 4 | executed / syntax / unrun |
| [Brocade 6510 光纤交换机深讲](./storage-data-protection/brocade-6510.md) | 交叉审校通过（正文） | 4 | executed / syntax / unrun |
| [Ceph 深讲](./storage-data-protection/ceph.md) | 交叉审校通过（正文） | 2 | reasoned |
| [Dell EMC VMAX 深讲](./storage-data-protection/dell-emc-vmax.md) | 交叉审校通过（正文） | 4 | executed / syntax / unrun |
| [Dell EMC VPLEX 深讲](./storage-data-protection/dell-emc-vplex.md) | 交叉审校通过（正文） | 4 | executed / syntax / unrun |
| [FastDFS 深讲](./storage-data-protection/fastdfs.md) | 交叉审校通过（正文） | 2 | executed |
| [华为 OceanStor 深讲](./storage-data-protection/huawei-oceanstor.md) | 交叉审校通过（正文） | 2 | executed |
| [IBM Storage 深讲](./storage-data-protection/ibm-storage.md) | 交叉审校通过（正文） | 5 | executed / syntax / unrun |
| [Tencent TCE 存储与数据保护技术栈深讲](./storage-data-protection/tce-storage.md) | 交叉审校通过（正文） | 2 | executed |
| [华为 FusionSphere / FusionCompute 技术栈深讲](./virtualization-private-cloud/fusionsphere.md) | 交叉审校通过（正文） | 2 | executed |
| [KVM 虚拟化深讲](./virtualization-private-cloud/kvm.md) | 交叉审校通过（正文） | 2 | reasoned |
| [OpenStack 深讲](./virtualization-private-cloud/openstack.md) | 交叉审校通过（正文） | 2 | reasoned |
| [Tencent TCE IaaS 技术栈深讲](./virtualization-private-cloud/tce-iaas.md) | 交叉审校通过（正文） | 2 | executed |
| [Tencent TCE 运营、运维与安全技术栈深讲](./virtualization-private-cloud/tce-operations-security.md) | 交叉审校通过（正文） | 2 | executed |
| [腾讯专有云 TCE 全栈技术地图](./virtualization-private-cloud/tencent-tce.md) | 交叉审校通过（正文） | 2 | executed |
| [VMware vSphere 深讲](./virtualization-private-cloud/vsphere.md) | 交叉审校通过（正文） | 2 | reasoned / executed |

## 逐篇证据

### 系统架构与技术方案设计深讲

[打开课程](./architecture-delivery/architecture-solution-design.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：课堂假设已安装Node并取得仓库，知识图未区分课程重组和官方原图。
- 初评：RTO/RPO在正式释义前使用；实验带Force且标题预检容易被当作内容验收。
- 初评：原检查单缺新容量与多故障域条件下的独立判断。
- 修订：补分层路线、准备入口和图来源边界，提前解释RTO/RPO。
- 修订：创建文件前拒绝同名路径，标题检查明确仅结构预检并补人工验收。
- 修订：新增容量、跨可用区、正常组件下业务失败、恢复约束和口述取舍五关。

**八项正文证据**

- 前置与路线：作者复评通过。开篇分层阅读与开课准备区分纸笔/Node和进阶平台前提。
- 机制与状态：作者复评通过。请求数据路径、状态与一致性解释数据库提交/响应、队列事务和幂等边界。
- 基础实验：作者复评通过。基础实验精确命令和方案文件模板包含预期、核验、失败与清理；标题脚本不承诺语义正确。
- 故障实验：作者复评通过。故障模拟包含依赖失效、容量与恢复关键路径，明确修复/验证/回退边界。
- 生产取舍：作者复评通过。容量安全余量、故障域、权限、密钥恢复、演进兼容和成本给出选项与拒绝条件。
- 递进面试：作者复评通过。30秒/3分钟与设计追问覆盖ADR、RTO/RPO、可用性和被否决方案。
- 独立通关：作者复评通过。五项新条件：900RPS/单实例180、安全失区容量、业务成功边界和每日备份反例。
- AIOps 与证据：作者复评通过。AIOps从观测/告警/自动化到受控反馈，学习证据保存决策、算例与合成边界。

**验证边界**

- reasoned：全文走读，复算6实例单故障与3可用区最坏失区容量、恢复关键路径；审查结构检查边界。；限制：真实系统压测、跨区故障和恢复未运行；纸面容量依赖题设及资源独立假设。
- executed：Node architecture合成课堂正常/故障分支实际执行，决策不同。；限制：只验证合成算术与课堂判定，不代表真实平台或生产架构验收。

第二位审校者：foundation-frontend；日期：2026-10-12。

- 全文复核。实际运行architecture正常和故障：单副本故障剩余676>=600、少副本剩余338<600，结果与正文一致；明确只是算术不证明真实平台压测/HA。
- 解释C4容器不等同Docker、稳定平均下Little定律的限制、突发峰值及数据库连接预算、RTO依赖链和RPO日志恢复边界；实验目录防覆盖与新建文件步骤闭合。
- 五关900RPS按单实例180需6副本抗单实例；三域各2不足抗域故障、各3剩余1080成立。已提交丢响应不盲补偿、日备份不能独保5分钟RPO、硬约束ADR均有具体判据。无实际压测、云资源或恢复执行。

### IT 项目管理 / PMP 深讲

[打开课程](./architecture-delivery/it-project-management-pmp.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：课程地图被称为官方但未解释多来源重组，零基础脚本保存/终端准备仍隐含。
- 初评：考纲地区时间需要重新核对，末尾检查单缺新依赖网和资源约束判据。
- 修订：明确地图出处与分层路线、文本保存/扩展名/编码前提。
- 修订：核对PMI官方第八版与考纲，更新大陆2026-12-05公告链接。
- 修订：增加五项依赖换网、资源串行、绿色未验收、挣值和授权取舍通关。

**八项正文证据**

- 前置与路线：作者复评通过。实验前置给Windows终端、路径、文件保存与范围，不要求Jira或认证。
- 机制与状态：作者复评通过。范围到验收、网络正反计算、资源约束与EVM分别解释机制和假设。
- 基础实验：作者复评通过。完整CSV/关键路径PowerShell/挣值输入，有14天/浮动/成本预期、失败与清理。
- 故障实验：作者复评通过。关键活动延时+安全范围变更有基线哈希、17天输出、评审、恢复和不抹真实历史边界。
- 生产取舍：作者复评通过。状态一致性、运营连续性、容量/权限/版本回退纳入治理而非口头完成。
- 递进面试：作者复评通过。10组指导与连续追问区分事实、权限、假设、工期和业务价值。
- 独立通关：作者复评通过。五关换B工期得到16天、单工程师资源约束17天、EVM条件预测与上线反例。
- AIOps 与证据：作者复评通过。告警、模型、知识库、安全自动化连接可验收项目范围；GitHub归档不虚构履历。

**验证边界**

- reasoned：全文走读，手算依赖与挣值；PMI/PMI中国/DORA官方网页核对版本、地区日期与五指标。；限制：课程不替代认证资格审核、真实项目履约或真实上线评审。
- executed：将正文PowerShell关键路径程序以内存CSV输入运行6项检查：正常、延期、换分支、双关键路径、非法工期及缺前置拒绝。；限制：替换Import-Csv仅验证算法；真实文件保存/读取与资源平衡工具未运行，程序不支持资源约束。

第二位审校者：foundation-frontend；日期：2026-10-12。

- 全文复核。正文关键路径PowerShell代码用内存CSV替换唯一文件读取实际执行9项：原14天、C7为17天、B6为16天，以及空、重复、未知依赖、零、负数、小数输入均拒绝。五关B浮动变化和共享资源17天与算法适用边界一致。
- PMI官方PMBOK页核实第八版六原则七绩效域，2026PMP全球/大陆实施时间分开；DORA官方五指标页核实指标名与恢复口径。CSV文件编码、拓扑顺序限制、基线保护/恢复及只读上线也需认证授权审计讲清。
- 五关EVM 20万场景CV负1万、SV负3万、CPI0.9、SPI0.75、EAC约22.22万复算成立；变更人天不等于日历延期，安全门禁、资源约束、验收与收益有答案。未执行真实项目工具、外部审批或生产变更；本次脚本执行在PowerShell7，PS5.1兼容性仅静态检查。

### Ansible

[打开课程](./automation/ansible.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：Linux/WSL 已装兼容 Ansible 是隐藏前置，首次空目录先 check mode 会缺少真实前置文件
- 初评：rescue 只打印提示可把未恢复部署按已救援推进
- 初评：证据剧本忽略失败且仅打印 stdout，读取失败与健康易混
- 初评：阈值直接 int 转换可能截断非法格式，缺专属独立通关
- 修订：补 Ubuntu 24.04 发行版安装、独占目录/配置与明确终端，重排 list-hosts/语法/正式/幂等/check 顺序
- 修订：rescue 显式保留失败，解释不可达和语法错误边界并核对官方原文
- 修订：状态/日志保留 rc、stderr，解释健康/异常/采集失败三态
- 修订：阈值先验证整数格式再查范围，新增 2200 RPS 容量及部分恢复五项通关
- 修订：交叉反馈补配置管理、应用部署、编排、资源准备与临时操作五项相邻中文解释

**八项正文证据**

- 前置与路线：作者复评通过。AIOps 入门实验：Ubuntu/WSL Bash、软件安装、config file、独占目录、本机唯一目标与系统动作片段边界。
- 机制与状态：作者复评通过。进阶带练：先看清 Ansible 的五个决定，再批量执行：目标别名、变量、模块/handler、分批及异步/委派状态边界。
- 基础实验：作者复评通过。AIOps 入门实验：完整本机 inventory/play/template、真实执行与幂等、输出验证和限定清理。
- 故障实验：作者复评通过。本地双层带练：验证参数，再修改文件；一个只改本地文件的部分失败实验：写前拒绝、状态保持、限定修复与完整再验。
- 生产取舍：作者复评通过。生产与面试：把 30 台机器的风险讲清楚；第五个决定：跨机非事务、批次/容量、秘密/锁、版本及恢复验证。
- 递进面试：作者复评通过。生产与面试及进阶带练：30 秒/3 分钟答案、幂等/批次/故障追问，新增异步未知/check/Vault 反例。
- 独立通关：作者复评通过。独立通关：报告、目标状态与业务状态分别举证：五项专属复现/预测/证据/设计/口述及失败返工，2200 RPS 小批容量判据。
- AIOps 与证据：作者复评通过。AIOps 自动化诊断脚本：采集退出码/错误、三态输出、身份/许可/互斥和健康验证，不因绿色 recap 自动重启。

**验证边界**

- reasoned：全文阅读与修订，rescue 状态核对 ansible-documentation 官方 Blocks 原文。；限制：发行版安装只记录实际版本，不承诺上游最新；未运行 Ansible。
- unrun：Ubuntu 软件安装、模板/幂等、阈值拒绝、双别名部分失败、远端 systemd 与升级未执行。；限制：当前 Windows 环境无本轮可用 Linux Ansible 控制节点，所有输出预期而非实测。

第二位审校者：systems；日期：2026-10-12。

- 全文独立复核；退回五项英文教学列表并重读相邻中文修订。基础个人目录/配置指向与两轮正式运行闭环，首次check跳过不计真实验收，模板validate与handler边界明确。
- 故障实验区分grep的0/1/2、systemctl inactive与未知、阈值小数/越界；两别名同机的部分成功、定点恢复与第二次幂等均有判据，rescue显式fail不吞未恢复失败。
- 高级层分清serial/forks/throttle、每批run_once、async提交不等于完成及清理不终止；Vault/no_log和check非无副作用、三千容量摘十台不够两千二均正确，未运行Ansible产品明确。

### CI/CD

[打开课程](./automation/cicd.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：个人实验与生产命令词典边界、Git/Node/仓库前置不完整
- 初评：最小 CI 未纳入当前项目测试，检查通过不自动成为合并门禁
- 初评：模拟事件写 success 会污染真实发布口径
- 初评：本地模拟未给 Windows/WSL 解释器选择，缺独立通关
- 修订：补个人 Fork/分支/Actions 额度与本地三道检查，说明 Rulesets 才形成必需门禁
- 修订：最小和入门 CI 增加 npm test，模拟事件显式 simulated/is_simulation
- 修订：补 Python 安装/别名/终端/独占目录并实际执行三种状态模拟
- 修订：新增审批漂移、unknown、灰度样本、采集失败和 DORA 口径五项独立通关

**八项正文证据**

- 前置与路线：作者复评通过。CI 阶段深讲及入门实验 1、本地基础与故障实验：个人仓库/权限/运行时/终端与生产命令边界。
- 机制与状态：作者复评通过。老师带练：发布系统首先是一台状态机；发布信任课堂：不可变输入、审批对象、unknown/重试、签名/证明/摘要分层。
- 基础实验：作者复评通过。本地基础与故障实验：制品通过测试后，被改过还会不会发布：完整源码、三种模式、退出码、验证与限定清理。
- 故障实验：作者复评通过。入门实验 4 与本地状态模拟：exit 42、篡改拦截、合法坏制品回滚，分别保存失败/恢复凭证。
- 生产取舍：作者复评通过。发布策略、数据迁移、并发发布和控制面灾备：容量/小样本/观测未知、数据兼容、锁/执行器隔离与恢复边界。
- 递进面试：作者复评通过。DORA 与面试、交付答辩：定义/状态/安全/灰度/数据库递进答案与 follow-up。
- 独立通关：作者复评通过。独立通关：一条绿色流水线到底证明了什么：五项专属任务、83 样本估算与 10% 失败率、答案和返工章节。
- AIOps 与证据：作者复评通过。可观测性和变更关联、金丝雀判断：事件与版本/窗口/指标关联，模拟事件不得计生产，采集未知不得自动扩流。

**验证边界**

- executed：Windows / Python 3.14.5 执行正文完整 delivery_lab 源码，normal v2/0、tamper v1/2、bad-release v1/3。；限制：纯内存状态与临时文件模拟，不是真实发布、数字签名或服务器回滚。
- reasoned：逐段全文审阅，核对当前 package.json 的 test、docs:build 和 dist 关系。；限制：本轮不重新核验 GitHub/DORA 最新产品套餐或版本。
- unrun：远端 GitHub 工作流、环境审批、真实制品晋级/灰度/数据恢复未执行。；限制：未写学习以外远端仓库或生产资源。

第二位审校者：systems；日期：2026-10-12。

- 全文复核 CI/交付/部署与同制品晋级，模拟echo明确不是真部署；SHA、摘要、审批对象和目标环境分别固定，缓存/签名/来源证明不混同。
- 本地Python三模式正常0/v2、篡改2/v1、业务失败回滚3/v1源码闭环，远端exit42仅限个人PR且新提交恢复；没有流量或观测未知不得灰度通过。
- 进阶含发布状态unknown查远端、环境锁与取消副作用、数据库expand-contract/合法新写保护、控制面灾备与5项DORA口径；灰度83样本和2/20失败率计算正确。

### GitHub Actions

[打开课程](./automation/github-actions.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：UTC 定时说明缺当前 timezone 功能及版本边界
- 初评：gh run watch 默认退出语义不能作为发布门禁
- 初评：静态站示例仍用历史框架名称且 paths 易漏 React 输入，Runbook 无需 Issue 写权限
- 初评：部分触发/锁文件排障过于绝对，缺独立通关
- 修订：补网页零依赖个人仓库路线，核对官方 timezone 示例及 GHES>=3.22 范围
- 修订：watch 增加 --exit-status 与 headSha/event/conclusion 和网页资源验收
- 修订：主构建示例去路径过滤、加 npm test/空产物报错，Pages 写权限只给 deploy，诊断只读
- 修订：修正 push 不一定默认分支与 npm ci 不应无锁绕过，新增文件/环境输出变式和 20000 请求容量通关

**八项正文证据**

- 前置与路线：作者复评通过。仓库边界后的零基础路线、基础与故障实验：个人网页仓库、默认分支、Actions 权限/额度、无 Node 元数据实验和 npm 前置区分。
- 机制与状态：作者复评通过。老师带练与平台进阶课堂：表达式/shell、job 生命周期、输出/文件通道、事件 SHA、并发槽/复用权限边界。
- 基础实验：作者复评通过。基础与故障实验：跨任务传递提交证据，再主动让验证失败：完整 workflow、三次输入、制品/提交验证与清理。
- 故障实验：作者复评通过。跨任务实验及入门实验 2：exit 42、证据收尾、新提交恢复，结合 watch 非零结论不吞失败。
- 生产取舍：作者复评通过。生产设计、平台进阶课堂与 Pages：信任域/临时 runner、OIDC/环境、容量/请求持久化、模板/执行器升级与外部副作用。
- 递进面试：作者复评通过。面试的三层表达与平台事故题：needs/页面旧版/PR 权限、merge_group/并发/模板状态的答案与追问。
- 独立通关：作者复评通过。独立通关：把事件、提交、作业和页面一一对齐：五项专属任务及答案、27.8 平均槽估算、失败返工。
- AIOps 与证据：作者复评通过。AIOps Runbook workflow 示例与生产设计：输入/窗口/run/提交上下文，placeholder 非诊断健康、去重及采集未知边界。

**验证边界**

- reasoned：全文逐段审阅，GitHub 官方源码核对 schedule timezone 与版本范围、CLI 源码核对 watch --exit-status。；限制：没有冒称工作流真实运行，也未验证所有套餐和 GHES 环境功能。
- unrun：远端三次 artifact 课堂、PR/merge queue、Pages、OIDC、runner 容量和环境审批未执行。；限制：未触发远端写操作或发布；预期需个人隔离仓库验收。

第二位审校者：systems；日期：2026-10-12。

- 全文复核事件与PR合并SHA、merge_group、输出与文件跨job边界；artifact课堂关闭/开启/关闭故障42+失败保留证据，不把文件与声明一致夸大成可信供应链。
- 核对官方timezone示例及GHES>=3.22声明，gh watch --exit-status与默认退出差异、rerun保留原提交及Pages真实验收；默认单等待槽不承诺每个请求执行。
- 权限、OIDC云信任、表达式注入、self-hosted信任域、动作运行时与项目Node分层、复用权限只收窄讲解准确；20k次/天×2分钟平均27.8槽，无远端课堂执行声明。

### GitLab 与 GitLab CI/CD 深讲

[打开课程](./automation/gitlab.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：用户电脑与 Runner 主机诊断混列，缺零安装个人项目/可用 Runner 前置
- 初评：最初 README 测试和 Linux 精确文本匹配有隐藏文件/换行要求
- 初评：下游失败默认不留下载副本，短期 artifact 易被当回滚包
- 初评：缺独立五项验收
- 修订：补网页个人项目初始化、实例/权限/额度/Runner 范围以及 verify 非执行验收
- 修订：补 README 存在、网页分支编辑、UTF-8 无 BOM/LF 格式及准确字节诊断
- 修订：verify 添加 when: always 学习制品与上传/取消/秘密边界
- 修订：新增 tags/Executor 变式、两个失败层、concurrent/limit/request_concurrency 容量、子流水线/人工状态通关

**八项正文证据**

- 前置与路线：作者复评通过。安装与启动、双层带练先准备什么：个人网页项目/README、可用 Linux 执行器、权限/额度与终端/文件格式明确。
- 机制与状态：作者复评通过。平台工程精讲、控制面补课：规则创建/依赖数据、Executor、领取并发、人工/子状态传播与外部未知。
- 基础实验：作者复评通过。双层带练：从可运行检查到可回收失败：完整规则文件/YAML、SHA/摘要、上传下载/验证与限定清理。
- 故障实验：作者复评通过。注入一次失败，然后证明门禁确实挡住了它；追加故障模拟：规则拒绝和下载副本摘要失败、不同层证据与恢复新提交。
- 生产取舍：作者复评通过。生产课堂、大厂设计追问：信任域/资源/HA、对象存储/密钥恢复、模板升级、过期发布/互斥和保留策略。
- 递进面试：作者复评通过。面试课堂与控制面补课：30 秒/3 分钟及 Runner/needs/重试/架构/覆盖事故的递进答案。
- 独立通关：作者复评通过。独立通关：同一个平台里的五种成功不能混用：五项任务与具体答案、全局4槽反例、变式/失败返工。
- AIOps 与证据：作者复评通过。在 AIOps 中的作用与生产课堂：失败阶段/队列/制品/提交/环境关联，采集/父触发不冒充目标恢复。

**验证边界**

- reasoned：全文逐段审阅，补实验入口和失败制品证据，保留已有官方规则/Runner/下游文档入口。；限制：没有更新固定产品版本或宣称平台当前最新。
- unrun：GitLab 项目、CI Lint、Runner/摘要故障、HA、人工/子流水线和灾备均未运行。；限制：当前无登录的授权测试实例，输出是待复现预期而非实测。

第二位审校者：systems；日期：2026-10-12。

- 全文复核平台创建/Runner领取/Executor环境/脚本/目标验收多层；needs依赖与artifact通道、rules创建、manual默认差异及下游状态传播都有回答和反例。
- 独立三阶段LF阈值文件与制品SHA实验、threshold50阻断上游和999篡改下游两种故障位置明确；恢复新提交、摘要、制品和清理完整，明确本轮未登录GitLab。
- concurrent4与两limit3不误加6，request_concurrency是领取并发；masked非恶意脚本防线、互斥不管外部手工、旧任务重试/unknown先查、平台备份边界齐备。

### Jenkins 技术栈深讲

[打开课程](./automation/jenkins.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：Docker context/名称/端口创建前检查只有文字、创建失败未停止
- 初评：固定历史 Core 与当前建议插件组合未明确兼容边界
- 初评：基础实验清理排在后续故障前可能破坏前置
- 初评：存储快照不等于应用一致性，缺独立掌握判据
- 修订：补官方安装/PowerShell/本机 context、先查后建与逐项退出停止
- 修订：说明插件最低 Core/依赖及版本记录，初始密码不得作为证据公开
- 修订：后续实验前保留环境，恢复实例隔离副作用并区分在线崩溃快照
- 修订：新增顶层 timeout 变式、JUnit/Queue 双故障、16核容量及恢复五项通关

**八项正文证据**

- 前置与路线：作者复评通过。安装与启动：工具官方入口、Linux Engine/本机 context/名称/卷/端口、插件组合与完整创建命令停止点。
- 机制与状态：作者复评通过。内部数据路径、状态一致性与老师带你精讲：Queue/CPS/Remoting、持久对象图、timeout 顺序、单写与外部状态。
- 基础实验：作者复评通过。基础实验：完成第一条可验证 Pipeline：完整脚本、UI创建、版本/Build/下载摘要验证及限定清理。
- 故障实验：作者复评通过。Label 不匹配故障与测试红灯实验：健康基线、Queue why、旧运行取消、新 Build 恢复、JUnit 合成状态/归档边界。
- 生产取舍：作者复评通过。容量性能、安全、高可用、备份和升级：信任域/最小权限、有效并发、单写、应用恢复点/隔离和匹配版本回退。
- 递进面试：作者复评通过。面试题与递进追问、把原有追问答完整：八类答案和深追问，结合500队列事故与300仓库架构。
- 独立通关：作者复评通过。独立通关：队列里的任务与目标上的变化分别举证：五项专属任务、4并发上限、timeout变式与返工位置。
- AIOps 与证据：作者复评通过。在 AIOps 中的作用与四层可观测性：变更/why/Agent/Build 分类、平台SLI不混业务测试、未知副作用先查目标。

**验证边界**

- syntax：9个PowerShell代码块通过Parser AST语法检查。；限制：不执行Docker、Jenkins或插件。
- reasoned：全文逐段审阅，补创建失败与插件/恢复边界，保留历史版本日期而非宣布当前最新。；限制：不替代真实平台兼容性验证。
- unrun：Docker Jenkins启动、插件、Pipeline/Label/JUnit、Agent、备份和升级未执行。；限制：无已连接 Docker daemon，示例状态均为预期。

第二位审校者：systems；日期：2026-10-12。

- 全文复核Controller/Queue/Agent/Executor/CPS与JENKINS_HOME单写，@NonCPS不搬到Agent、顶层timeout不包含分配等待、stash/制品/工作区边界明确。
- 专用容器/卷名称预检、固定历史Core与插件兼容停止、回环端口、完整两Stage摘要基线；label故障取消旧脚本新Build恢复，合成JUnit UNSTABLE与FAILURE分离，清理最后进行。
- 生产含信任域隔离/秘密掩码非沙箱、动态Pod两路径、并发CPU与内存至多4、单Job禁并发≠环境锁、快照非应用一致恢复、Core-Java-Plugin-状态匹配回退；未启动Engine如实说明。

### Apache Maven 技术栈深讲

[打开课程](./automation/maven.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：JDK安装只看java而未确认javac/jar，模板默认值影响JAR名和BOM实验
- 初评：项目目录存在仍可能继续、各步失败后可拿旧JAR或模型当证据
- 初评：PowerShell原生-D参数未统一保护，模型恢复一行成功过度推断根因
- 初评：缺独立五项通关
- 修订：补完整JDK/终端/可信项目/全局settings和MAVEN变量前置，历史版本不冒充当前推荐
- 修订：生成明确GAV/package/Java17/JUnit5.11，核对官方Quickstart1.5 BOM模板
- 修订：目录/Wrapper/verify/导出/故障/恢复逐项退出停止，摘要和完整验证分层，保留证据后清理
- 修订：新增dependencyManagement/goal变式、双层故障、20GB/8Gbps容量与发布未知五项通关

**八项正文证据**

- 前置与路线：作者复评通过。安装与启动、入门实验前置条件：完整JDK/CLI/PowerShell/目录/settings/网络与可信代码前置。
- 机制与状态：作者复评通过。九项核心原理、内部请求与数据路径、老师串讲：模型/Resolver/Reactor/goal、BOM/插件依赖、发布部分成功。
- 基础实验：作者复评通过。入门实验：完整骨架参数/Wrapper/verify/测试/JAR摘要/生效模型/离线边界和限定清理。
- 故障实验：作者复评通过。错误镜像BOM实验与确定性测试断言实验：全新缓存/首错/退出码、模型与测试分层、恢复完整verify。
- 生产取舍：作者复评通过。生产架构、容量、安全供应链、升级回滚：外围HA/不可变Release/凭据缓存信任/并行资源与状态回退。
- 递进面试：作者复评通过。面试怎么讲、十项递进问答：定义/依赖/模型/缓存/大仓架构与部分发布故障答案。
- 独立通关：作者复评通过。独立通关：绿色构建必须说清输入和证据范围：五项专属任务、nearest管理边界与8Gbps估算/返工判据。
- AIOps 与证据：作者复评通过。AIOps位置、全部流水线解析事故：Git/镜像/阶段/坐标/摘要关联，禁止无条件清缓存/绕过证书。

**验证边界**

- executed：mvn -version返回本机Maven3.9.16、Oracle JDK24、Windows11。；限制：只验证安装入口，不证明项目兼容或构建。
- syntax：43个PowerShell块通过Parser AST检查。；限制：不执行Maven插件/Java。
- reasoned：全文逐段审阅，官方maven-archetype-bundles-1.5模板核对JUnit5生成import BOM及Java参数。；限制：没有把历史Maven4预发布描述当今天的发布断言。
- unrun：项目生成、Wrapper、编译测试/离线/镜像故障、制品发布和独立重建未执行。；限制：未更改本机Maven项目/缓存或远程制品。

第二位审校者：systems；日期：2026-10-12。

- 全文复核模型/父与聚合/BOM/dependencyManagement/插件执行区别，近路径非最高版本、离线不禁止插件自己联网、effective-pom依赖模型已可建立，没有把诊断goal当万能。
- Quickstart1.5固定17/5.11.0及项目1.0-SNAPSHOT、Wrapper与每步退出停点；错镜像使用新缓存/本地9端口和项目settings，模型恢复后再clean verify，断言故障定位真实测试层；未编译边界明确。
- Release部分上传与unknown查精确摘要、不覆盖正式坐标；源码/JDK/镜像/插件/来源/缓存分权、Reactor与并行/私服容量、8Gbps与160秒算式可复核，Maven4历史RC表不冒充最新。

### n8n 技术栈深讲

[打开课程](./automation/n8n.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：独立空目录/Compose项目名/工具安装隐藏前置，查询失败可被误当空
- 初评：HTTP回环登录未说明secure-cookie默认保护差异
- 初评：启动/重启无有限ready等待或退出停止，HTTP请求无限等待
- 初评：Normalize连接/字段保留与Expression类型不够明确，缺独立通关
- 修订：补PowerShell7/Docker官方入口、当前context、专属目录/项目/卷查询与gitignore
- 修订：仅回环HTTP实验设置secure-cookie=false并对照官方默认true和生产TLS边界
- 修订：逐步错误停止、两分钟readiness和HTTP限时；新execution复验不擦除原失败
- 修订：补字段模式/连接顺序，新增发布草稿变式、Error双状态、6000积压和幂等未知五项通关
- 修订：10月12日复核官方Community license与License FAQ，替换失效链接，区分客户触发预建流程与创建/编辑/配置逻辑，不再把收费托管或客户凭据一概判禁止

**八项正文证据**

- 前置与路线：作者复评通过。安装与启动：PowerShell7/LinuxEngine/context/项目资产/空目录/密钥/精确文件与本机端口前置。
- 机制与状态：作者复评通过。八项核心概念、内部数据流、老师再走一遍：Item linking、发布/执行、DB/Redis/Runner、Wait、业务账本未知与栅栏。
- 基础实验：作者复评通过。基础实验：完整Compose/有限ready、UI各节点字段连接、两分支Test/Production、重启持久与清理。
- 故障实验：作者复评通过。Stop And Error故障与契约实验：发布注入/主error/错误处理ID、恢复新发布新事件与专属副本收回。
- 生产取舍：作者复评通过。容量、HA/灾备、安全、升级回滚：下游限流/计划边界、DB-key-binary一致恢复、schema/key回退与队列隔离限制。
- 递进面试：作者复评通过。面试题与递进追问、50万告警设计：Queue路径/幂等/健康/HA/Runner/恢复答案与架构取舍。
- 独立通关：作者复评通过。独立通关：画布、发布版、执行和业务结果逐一举证：五项专属任务、草稿变式/积压10分钟与失败返工。
- AIOps 与证据：作者复评通过。AIOps场景、业务SLI/事故：告警补全/审批/Runbook/模型假设/业务对账，平台绿色不等恢复。

**验证边界**

- syntax：17个PowerShell块通过Parser AST检查。；限制：不执行Compose/HTTP/UI。
- reasoned：全文逐段审阅，官方n8n-docs安全变量核对N8N_SECURE_COOKIE默认true/HTTPS语义。；限制：版本/权益保持历史快照，不声明现时最新或法律结论。
- unrun：Docker登录/Workflow/Test/Publish/Error/Redis/Runner/恢复均未执行。；限制：本轮没有可连接daemon，预期结果是待复现判据。

第二位审校者：systems；日期：2026-10-12。

- 全文复核Item linking/发布vs草稿/Production与Test执行、错误Workflow/Wait持久阈值/未知结果幂等及Queue数据库事实链；基础与故障均有事件ID关联及撤回。
- 按当前官方FAQ退回并重读修订：替换失效SUL链接，许可复核10-12区别8月版本快照，客户触发预建流程与客户可配置逻辑分开，不以收费/凭据来源一概判断。
- 每worker Runner连接/共享加密key/Redis在途与main单点、计划能力界限明确；30/20十分钟6000及恢复十分钟复算。没有Docker/UI/真实服务执行，不冒称业务完成。

### Nexus Repository 深讲

[打开课程](./automation/nexus-repository.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：latest 直接 run 不可固定一次学习内容，工具/内存/终端有隐藏前置
- 初评：学习账号权限创建缺步骤，上传/下载失败会继续比较旧文件
- 初评：只展示Hash不阻断不一致，凭据清理非finally
- 初评：默认容器停止时间不足数据库关闭建议，缺独立通关
- 修订：改首次pull后固定可靠RepoDigest再run，补本机context/官方安装/资源支持矩阵与失败停止
- 修订：补Raw专属角色/用户动作，上传下载限时/旧目标停止/摘要断言/ finally清理凭据
- 修订：按Sonatype官方镜像README改stop120秒，补专属角色清理
- 修订：新增来源/权限变式、两种故障、60GB/8Gbps容量与元数据/blob恢复五项通关

**八项正文证据**

- 前置与路线：作者复评通过。安装与启动、入门实验：Docker/PowerShell/context/资源/摘要/独占数据、Raw角色/用户/文件前置。
- 机制与状态：作者复评通过。老师带你把一次依赖下载拆开；协议与权限进阶：坐标/格式、缓存、group来源、元数据/blob与授权并集。
- 基础实验：作者复评通过。入门实验：上传并下载Raw制品：完整凭据处理、HTTP限时/错误停止、独立下载摘要断言及限定清理。
- 故障实验：作者复评通过。双层实验：不存在版本与本地副本改字节，状态/路径/Hash对照、重新下载与独立版本恢复。
- 生产取舍：作者复评通过。生产设计题、仓库管理员课堂：保留/候选/回收、吞吐/资源、受支持HA、数据库/blob/配置密钥匹配和升级。
- 递进面试：作者复评通过。面试课堂与协议进阶：30秒/3分钟及group写入、404、覆盖、备份/清理的递进回答。
- 独立通关：作者复评通过。独立通关：按坐标找得到，还要按摘要认得出：五项专属任务/答案，8Gbps估算、权限并集变式与返工位置。
- AIOps 与证据：作者复评通过。在AIOps中的作用、事故课堂：状态/回源/磁盘/流水线/版本关联与脱敏，不因下载失败自动清缓存/删除。

**验证边界**

- syntax：2个PowerShell代码块通过Parser AST语法检查。；限制：不执行镜像/HTTP/权限操作。
- reasoned：全文审阅，官方sonatype/docker-nexus3 README核对持久目录、镜像和数据库停止120秒建议。；限制：没有固定某个未经拉取的版本或冒称latest安全。
- unrun：Docker镜像拉取、Nexus初始化、角色/上传下载、故障/清理/恢复未运行。；限制：无已连接Docker daemon，输出是需复现预期。

第二位审校者：systems；日期：2026-10-12。

- 全文复核格式协议、hosted/proxy/group写能力不跨格式泛化，Component/Asset/blob、负缓存与多层缓存、内容选择器授权并集均有机制/反例。
- 首次latest发现后固定RepoDigest并校验、空卷/本机8081预算；Raw受限用户PUT与独立GET SHA验证，路径缺失和本地副本篡改两个故障及恢复/120秒停止/保留卷边界齐全。
- 上传超时先查路径摘要、删除与物理回收分层、DB/blob/配置/密钥一致恢复、禁止无支持双写；200×300MB=60GB/60秒约8Gbps仅数据下界，不宣称真实Nexus已运行。

### Runbook Automation

[打开课程](./automation/runbook-automation.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：推荐器有目录树无Python安装/目录/真实手册保存步骤
- 初评：同类报告覆盖历史，不检查映射手册存在或已知事件必要字段
- 初评：Actions缺根目录/默认分支前置且未知非零报告不上传
- 初评：概念云重启命令容易混入新手实验，缺独立五项通关
- 修订：补标准库/PowerShell/维护版本/空目录/UTF8文件与仅L2说明
- 修订：每次UUID新报告、已知service/severity类型契约、映射路径/手册存在检查
- 修订：补Actions精确文件/项目/默认分支、always短期报告与外部命令授权边界
- 修订：新增正常/变式输入/缺手册/旧指标/并发3影响面/未知恢复五项通关并实测推荐器

**八项正文证据**

- 前置与路线：作者复评通过。AIOps入门实验：官方Python安装/终端/空目录/精确文件、手册正文保存，无云权限隐藏依赖。
- 机制与状态：作者复评通过。执行器精讲、控制回路课堂：定义/步骤/审批/外部结果、未知/租约/栅栏、观察窗口与停止派发边界。
- 基础实验：作者复评通过。AIOps入门实验：完整输入/两手册/脚本、类型/路径/映射验证、UUID报告/退出码与安全清理。
- 故障实验：作者复评通过。本地故障实验与离线时间线实验：未知/数组/路径/缺手册阻断、正常恢复与合成旧窗口重复动作拒绝。
- 生产取舍：作者复评通过。自动化执行器精讲、控制回路课堂/安全护栏：最小身份、审批时效、互斥/容量、状态审计恢复与补偿。
- 递进面试：作者复评通过。面试递进、控制回路追问：30秒/3分钟、合法事件全网重启、模型越权、取消/锁/回滚失败答案。
- 独立通关：作者复评通过。独立通关：推荐、授权、执行和恢复分别证明：五项专属任务、五类输入判据、并发3反例与返工。
- AIOps 与证据：作者复评通过。闭环位置、LLM边界/磁盘事故：证据收集/规则建议/授权动作/业务验证与知识复盘，未知观测暂停高风险。

**验证边界**

- executed：Python3.14.5临时夹具执行完整推荐器：正常/重复0，未知/路径名1，数组/缺service/错severity类型/缺手册/越界2，共4个唯一报告。；限制：仅本地L2，不访问云/主机；临时目录自动回收。
- syntax：2个PowerShell块通过Parser AST检查，完整Python源码解析/执行通过。；限制：不检查远端Actions或平台策略。
- reasoned：全文逐段审阅合成时间线、容量/停止/幂等/审批与答案。；限制：模拟不是分布式执行器认证。
- unrun：GitHub Actions/Ansible/AWS/Azure/Kubernetes及生产锁/审批/变更/灾备未运行。；限制：没有新增远程执行或生产权限。

第二位审校者：systems；日期：2026-10-12。

- 全文复核L2推荐与执行授权分层，例子只是教学目录且不可变目标/审批版本有效期、状态unknown/幂等/租约与栅栏、补偿非时间倒流解释完整。
- Python完整推荐器限制alerts路径、对象/环境/服务/枚举、可信映射文件存在；正常/未知/目录外/缺手册各退出与UUID新报告不覆盖，故障恢复及专用清理；Actions通过env避免表达式进Shell。
- 旧窗口指标不评新动作、无数据不能当健康、只读采集预算脱敏、冲突资源锁而非手册名称；并发3首失败停止派发仍可能三台受影响，云/集群控制未实跑不夸大。

### SonarQube 技术栈深讲

[打开课程](./automation/sonarqube.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：快速体验和Compose复用9000易冲突，固定历史Server与latest Scanner混用
- 初评：上传/门禁/CE任务状态混淆，未固定Scanner与失败停止
- 初评：清理在故障前破坏环境，停止DB却预断上传成功/CE失败
- 初评：恢复只看pg_isready而无UP有限等待，缺独立通关
- 修订：补官方工具/资源/本机context/端口/专属卷前置，保留版本历史日期和兼容支持边界
- 修订：首次pull固定Scanner摘要，等待Gate并分类非零/超时/任务ID，保护Token与.scannerwork
- 修订：基础保留环境至故障结束，DB恢复有限轮询后应用UP复验与新扫描Gate证据
- 修订：新增双提交/双失败层、CE积压30分钟估算、数据库schema回退五项通关

**八项正文证据**

- 前置与路线：作者复评通过。安装与启动、基础实验：Linux Engine/PowerShell/Compose/资源/名称卷端口、历史版本与Token/完整目录文件。
- 机制与状态：作者复评通过。核心原理、老师带你读懂一次门禁：Scanner上传、CE异步计算、DB事实/Search派生、Profile/Gate/New Code与taskId归属。
- 基础实验：作者复评通过。基础实验：Compose启动、UP有限等待、固定Scanner摘要/退出、任务和Gate验证、凭据与专属资源清理。
- 故障实验：作者复评通过。故障注入实验：停止数据库：基线/单故障、接收和计算分层证据、DB轮询/UP/新任务恢复，不断言未证明报告入队。
- 生产取舍：作者复评通过。容量与性能、安全、高可用与灾备、升级与回滚：版本/授权架构、数据库恢复点、索引重建、schema边界与队列控制。
- 递进面试：作者复评通过。面试题与递进追问、事故场景：Scanner/CE、两种Quality、搜索/DB、积压/HA/升级答案和进一步追问。
- 独立通关：作者复评通过。独立通关：收到报告、计算成功和门禁通过是三件事：五项专属任务、A/B任务归属、积压估算与失败返工判据。
- AIOps 与证据：作者复评通过。日志与可观测性、事故场景：CI提交/CE任务/DB/队列关联，门禁失败不冒充业务中断、未知等待不自动放行。

**验证边界**

- syntax：13个PowerShell代码块通过Parser AST语法检查。；限制：不执行Docker/Scanner/HTTP。
- reasoned：全文逐段审阅与状态/恢复推演，未将原历史版本写成当前最新。；限制：未拉取镜像，固定摘要由读者现场取得；不承诺组合受支持。
- unrun：SonarQube/PostgreSQL、扫描/门禁、DB故障与恢复/升级未执行。；限制：Docker daemon未连接，所有产品输出是待复现预期。

第二位审校者：systems；日期：2026-10-12。

- 全文复核Scanner→Web→CE→DB/Search→Gate，按本次ceTaskId关联分析而非最新项目结果；Profile/Gate/New Code/Hotspot和覆盖率报告界限准确。
- 数据库停止实验不预设必然CE失败，有限恢复DB/UP/新任务/Gate分别举证、撤销Token先于down；只在回环课堂禁bootstrap，镜像摘要和私有网络明确。
- 6到达/4完成积压不会清空，降至2后60任务粗算30分钟；DCE支持拓扑/停集群升级/主DB派生索引及完整回滚界限清楚。本轮无Engine实跑。

### Terraform

[打开课程](./automation/terraform.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：CLI安装/终端/独立目录/backend环境参数隐藏前置
- 初评：基础命令失败可继续应用遗留plan，第二轮无差异缺严格退出验证
- 初评：基础destroy会破坏后续漂移/重命名前置
- 初评：不存在目录不可靠作为local provider故障，缺独立通关
- 修订：补Windows官方ZIP校验/PATH/CLI和只列TF变量名的前置，区分概念云命令和本地实验
- 修订：初始化/校验/计划/读取/执行加停止点与人工审阅，detailed-exitcode三态验收
- 修订：延后统一清理，审核销毁计划/地址和state，移除不确定权限路径实验
- 修订：核对local provider MkdirAll实现，新增地址迁移/空集合/故障恢复/state边界五项通关

**八项正文证据**

- 前置与路线：作者复评通过。HCL基础边界、AIOps入门实验：官方安装/真实tf文件/PowerShell/独占目录/TF环境名和registry依赖。
- 机制与状态：作者复评通过。三本账、进阶精讲与配置契约课堂：求值/unknown/依赖图、API/state、地址/锁/输入与权限边界。
- 基础实验：作者复评通过。AIOps入门实验：四个完整tf文件、锁文件/计划/真实内容/state/output与第二次退出0检查。
- 故障实验：作者复评通过。将本地文件实验补成可验收的故障课堂：内容漂移、repair计划审阅、实际文件和无差异恢复、限定销毁。
- 生产取舍：作者复评通过。生产设计课堂、状态锁/工作区与事故答辩：故障/权限state边界、限流容量/模块升级、部分失败/未知和数据恢复。
- 递进面试：作者复评通过。生产设计课堂和事故答辩：30秒/3分钟、锁/地址/半失败/数据库/超时的答案与反例追问。
- 独立通关：作者复评通过。独立通关：三本账一致，不代表执行可以无限重试：五项专属任务、moved/空集合变式、三态退出/锁与返工位置。
- AIOps 与证据：作者复评通过。AIOps链路与配置契约课堂：plan/drift/资源地址关联告警，错误查询不转空集合，差异检测不等于执行授权。

**验证边界**

- syntax：3个PowerShell代码块通过Parser AST语法检查。；限制：本机未找到Terraform，未执行HCL/provider验证。
- reasoned：全文审阅，官方terraform-provider-local源码核对创建父目录行为。；限制：没有实际执行state或资源变更。
- unrun：CLI安装、init/plan/apply、local漂移/moved/清理及云状态/恢复未执行。；限制：没有真实state或云资源变更，输出为复现目标。

第二位审校者：systems；日期：2026-10-12。

- 全文复核配置/state/真实资源三本账、依赖图/未知/null/空集合与provider/module/锁文件的区别；plan不预留事务、部分失败不会自动回滚。
- local-only文件漂移及moved实验有新目录/退出码/同计划审核/真实文件state无差异验收和限定销毁；local provider会建父目录、不假设漂移原地改，未执行云资源。
- S3概念示例未启锁、backend/provider授权独立、锁不锁控制台、workspace非账号隔离和prevent_destroy删除配置失效边界准确；check警告非硬门禁，证据及5任务有推理追问。

### Calico 深讲

[打开课程](./cloud-native/calico.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：安装隐含运行终端、kind/kubectl 安装和同名集群检查
- 初评：直接应用官方 custom-resources 同时启用未解释的 Goldmane/Whisker
- 初评：负例只说另建不同标签 Pod，缺实际输入与失败归因边界
- 初评：缺五项独立通关判据
- 修订：补 Bash/WSL、本地引擎、客户端安装入口和空目录/集群身份
- 修订：改用本地最小 Installation/APIServer，明确 VXLAN 模式不按 BGP 状态误判
- 修订：补 outsider 创建、就绪、测试、清理及 DNS/双端隔离的对照
- 修订：新增 selector 交并集、地址迁移、反射器/Typha 取舍五项通关
- 修订：按交叉反馈修正 NAT 非应用层机制，明确 Pod 地址可达模型与模式/出站地址转换边界

**八项正文证据**

- 前置与路线：作者复评通过。安装实验：kind + Calico 3.32 / 前置条件：运行终端、工具入口、实际版本、集群身份与网段检查。
- 机制与状态：作者复评通过。一个包怎样跨节点、NetworkPolicy 的隔离语义、路由精讲课堂：区分控制路由、封装、双端策略与实际数据转发。
- 基础实验：作者复评通过。安装实验与基础实验：默认拒绝和精确放行：完整本地配置及 outsider 输入，正负请求分开验收。
- 故障实验：作者复评通过。故障实验：selector 写错导致策略不放行：保留基线、单字段注入、标签/策略/请求对照、恢复与专用资源清理。
- 生产取舍：作者复评通过。生产设计题、地址迁移课堂、主机边界课堂：地址余量、故障域、MTU、管理恢复通道及受控升级矩阵。
- 递进面试：作者复评通过。核心面试题与递进追问：CNI 创建阶段、模式选择、标准策略并集、反射器和 Service 诊断均给因果答案。
- 独立通关：作者复评通过。独立通关：安全规则要有成功与拒绝的对照：五项有新条件、结果判据、反证及返工章节。
- AIOps 与证据：作者复评通过。从证据到 AIOps：不要让网络模型只学到故障后的动作：配置/节点/流量/收敛时间关联，不自动清空策略。

**验证边界**

- reasoned：全文审阅；通过 GitHub API 核对 v3.32.1 manifests/custom-resources.yaml 的 VXLAN 模式与额外 Goldmane/Whisker 定义。；限制：最小配置为静态修订，没有验证 operator 创建结果。
- unrun：kind、Calico、策略、IPAM 与 MTU 实验未运行。；限制：Docker 引擎不可连接；不证明物理网络或生产性能。

第二位审校者：systems；日期：2026-10-12。

- 全文复核退回NAT被误称应用层问题；已重读改为源/目的地址转换，并保留Pod通信、插件/封装和出站边界。
- 默认拒绝同时隔离两端，DNS与业务放行分步、selector AND/OR与标准策略并集区别正确；负例被两端拦不能单独证明入站selector，正文已提醒对照。
- CNI/IPAM/Felix路径、Typha与路由反射器不同控制规模、4950邻接、HostEndpoint本地/转发及disabled池不改旧Pod均一致；校对官方calicoctl转换策略诊断，真实集群明确未运行。

### Cilium 深讲

[打开课程](./cloud-native/cilium.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：工具与运行环境只列名称，遗漏 Hubble 独立客户端和同名集群检查
- 初评：kind podSubnet 已设置却未显式固定 Cilium IPAM 模式，读者可能混淆两套分配
- 初评：需要五项独立迁移条件与观测证据判据
- 修订：补 Bash/WSL、版本与本地引擎检查、工具官方入口、Hubble 客户端和实际节点镜像兼容边界
- 修订：安装明确 ipam.mode=kubernetes，补 Node PodCIDR 与 Pod IP 对照及保留默认 kube-proxy 的首轮边界
- 修订：新增身份不换 IP、三类故障反证、事件积压计算、主机审计与安全取舍通关
- 修订：按交叉反馈补固定app=outsider负例：名称不存在、Ready、有限请求、退出码与Hubble策略证据、修复后正负复验和精确Pod清理

**八项正文证据**

- 前置与路线：作者复评通过。安装实验：kind + Cilium 1.20.0 / 前置条件：操作系统、客户端、Hubble、空目录和内核/节点镜像依赖明确。
- 机制与状态：作者复评通过。eBPF 前置知识、Service 负载均衡数据路径与身份与策略课堂：区分 program/map、三层地址、身份和代理路径。
- 基础实验：作者复评通过。基础实验：身份策略和 Hubble：独立工作负载、默认拒绝与精确允许，新增明确 IPAM 来源与访问路径。
- 故障实验：作者复评通过。故障实验：标签改变导致身份和策略变化及实验复盘升级：定位具体 agent、有限收敛窗口、标签恢复与测试 Pod/转发清理。
- 生产取舍：作者复评通过。生产设计检查单、升级深讲、观测容量课堂：内核、map 内存、L7、升级状态与观测缺失分层。
- 递进面试：作者复评通过。核心面试题与递进追问、系统设计题：从 hook/map 到 Service、身份、观测与规模迁移的答案梯度。
- 独立通关：作者复评通过。独立通关：把网络事实与观测事实分开：五项新条件与五万事件积压判据，要求反证而非只交成功图。
- AIOps 与证据：作者复评通过。在 AIOps 中的作用和观测容量课堂：关联 drop reason、policy revision、节点与应用 trace，覆盖不足标未知。

**验证边界**

- reasoned：全文审阅；GitHub API 核对 v1.20.0 官方 kind.rst 的 ipam.mode=kubernetes；flow.proto 确认该版本包含 REDIRECTED verdict，未按旧版本印象误改。；限制：源码/文档一致不证明 CLI、内核与节点组合已运行。
- unrun：Cilium 安装、Hubble、标签策略、主机防火墙、升级及 map 压测未运行。；限制：没有可连接 Docker 引擎或支持的专用集群。

第二位审校者：systems；日期：2026-10-12。

- 全文独立复核后退回缺失永久禁止组问题；重读返修：独立outsider不改身份，先查不存在和Ready，正常client成功，禁止请求非零并核对同源时间窗policy denied。
- 修复client-broken后仍须正常组与修复组成功、outsider拒绝，再只清理本轮两Pod；非零不等于策略拒绝、FORWARDED不等于端到端成功，节点agent定位与观测丢失边界明确。
- 复核Service/Pod/Node三地址、identity传播、map容量、DNS学习、主机审计与升级回滚语义，五项独立任务覆盖反证与积压五万算术。本轮仅语法和推演，不声称运行Cilium。

### Docker Compose 精讲

[打开课程](./cloud-native/docker-compose.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：三服务实验没有空目录、子目录、终端与项目重名的实际准备步骤
- 初评：缺少独立改变宿主端口、共享 external volume、合并模型的综合验收
- 初评：诊断示例默认 getent/wget 存在，工具缺失容易被判为网络故障
- 修订：补完整目录创建、当前目录、Docker/Compose/context、端口及项目名检查
- 修订：说明依赖在镜像构建安装及宿主端口变化不改服务内部 URL
- 修订：新增技术专属五项通关和工具缺失的取证分支
- 修订：撤销截图与别人照做成功自动代表掌握的说法

**八项正文证据**

- 前置与路线：作者复评通过。AIOps 入门实验：Prometheus + Grafana + Demo App / 第 1 步：准备目录：明确 Bash/WSL、引擎、目录和端口。
- 机制与状态：作者复评通过。Compose 的内部调和路径与依赖课堂：区分插值/模型/实际对象、服务 restart 和依赖 restart，非持续调和。
- 基础实验：作者复评通过。AIOps 入门实验：Prometheus + Grafana + Demo App：三组件完整文件、启动及四层采集查询验收。
- 故障实验：作者复评通过。故障注入实验：Grafana 把 Prometheus 写成 localhost：备份、注入、日志/DNS、恢复文件与重建查询；独立通关增加工具缺失分支。
- 生产取舍：作者复评通过。实验质量课堂：可用性、观测性与清理要一起验收：单机故障域、共享卷、配额、基数、容量和默认凭据边界。
- 递进面试：作者复评通过。老师带你把实验解释成工程能力 / 五、面试从 30 秒讲到 3 分钟：解释请求链、单机 HA 及 Grafana 数据恢复反例。
- 独立通关：作者复评通过。独立通关：交付的是最终模型，不是 YAML 截图：内部端口、合并、诊断、共享卷和配置时间点五项判据。
- AIOps 与证据：作者复评通过。实验质量课堂与学习证据：区分 up 与业务错误，保存应用、Targets、表达式及 Grafana 证据链。

**验证边界**

- syntax：本篇 git diff --check 通过。；限制：不证明 Compose 模型或镜像功能实际通过。
- reasoned：全文阅读并审查相对路径、服务内部 URL、重建与恢复步骤及五项判据。；限制：历史版本行为保留其原日期，不声称更新为当前版本。
- unrun：三服务基础实验、数据源故障与合并命令未运行。；限制：本机 Docker daemon 不可连接；静态推理与真实运行分开。

第二位审校者：systems；日期：2026-10-12。

- 完整读取正文，基础三服务有创建目录、固定项目、回环发布及四层采集证据；故障源是本轮datasource文件，恢复后同式up复验，不以Running替代成功。
- 核算内部demo-app:8000不随宿主18000改变，两个不同发布端口合并后保留两条；external卷及run --rm副作用边界明确。
- 追问明确restart与依赖restart区别、变量解析与创建时配置、单机故障域；缺getent/wget按工具缺失分支，不宣称Docker运行通过。

### Docker

[打开课程](./cloud-native/docker.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：基础实验只给目录树，没有创建与进入目录、终端续行和同名容器检查
- 初评：实际健康服务及 README 向全部宿主接口发布端口，与本地学习隔离目标不一致
- 初评：末尾用能解释 demo 推断理解，缺少改变端口后的独立判据
- 初评：交叉审校发现独立题要求Health日志但基础镜像未配置HEALTHCHECK
- 修订：补本地引擎 context、Server、Bash/WSL、空目录与容器重名检查
- 修订：将健康服务实践和 README 的宿主发布限制为 127.0.0.1，同步预期端口输出
- 修订：新增独立通关五项，覆盖 APP_PORT 与转发目标错位、健康与 OOM、数据回退和 socket 权限
- 修订：撤销读懂原实验即掌握的推断
- 修订：交叉返修新增标准库HTTP/JSON/超时探针、Dockerfile HEALTHCHECK、有限等待及独立错探针故障，区分无字段/健康/运行/重启

**八项正文证据**

- 前置与路线：作者复评通过。AIOps 入门实验：容器化健康检查服务 / 第 1 步：准备目录：说明终端、引擎位置、空目录与名称冲突处理。
- 机制与状态：作者复评通过。老师带你把健康服务讲成一条完整交付链：区分镜像、运行、业务证据；健康变红，为什么容器没有自动重启说明探针不是自愈。
- 基础实验：作者复评通过。AIOps 入门实验：容器化健康检查服务：完整 app.py/healthcheck.py、Dockerfile、忽略文件、构建、发布、响应/Health有限等待及容器清理。
- 故障实验：作者复评通过。故障注入实验：看懂 OOMKilled：限制、退出码与 OOM 标记交叉取证，恢复内存预算并回收专用容器；独立通关增加监听错位反例。
- 生产取舍：作者复评通过。老师带你把健康服务讲成一条完整交付链与生产事故：覆盖数据兼容、容量、权限和宿主故障域，拒绝全局清理作修复。
- 递进面试：作者复评通过。独立通关：不看步骤，能否解释并修好新条件：定义、请求路径与 restart、镜像拉取、Docker socket 三个反例追问。
- 独立通关：作者复评通过。独立通关：不看步骤，能否解释并修好新条件：五项题均给可复核证据与答案判据，缺引擎明确不算实操通过。
- AIOps 与证据：作者复评通过。学习证据和独立通关：日志、内存限制、健康与业务信号进入告警和受人工确认的运行手册。

**验证边界**

- executed：本轮 docker version 诊断返回本机 Linux Engine 管道不存在。；限制：只证明当前引擎不可连接，不能验证容器运行。
- executed：Python3.14.5临时回环HTTP服务验证探针：200/status=ok退出0，HTTP503/错误status/不可达超时退出1。；限制：非容器运行，不验证HEALTHCHECK调度或State.Health。
- syntax：git diff --check 对本篇通过。；限制：空白检查不执行 Dockerfile、Python 或引擎 API。
- reasoned：全文逐段审阅；检查端口左右、上下文、清理范围和新增题答案。；限制：不是安全认证或读者能力认证。
- unrun：健康服务构建运行、独立错探针与 OOM 注入未运行。；限制：Docker daemon 未连接，预期输出仅为教学判据。

第二位审校者：systems；日期：2026-10-12。

- 全文独立复核后退回缺失HEALTHCHECK问题；已重读返修：标准库探针被COPY进入镜像、有限等待读取State.Health，无字段明确不是健康证据。
- 探针错误端口使用独立容器与回环18082，业务仍成功但unhealthy不会触发Engine退出重启；取证与只清理本轮容器形成闭环。
- 命名空间/cgroups/镜像层/持久化与端口路径说明一致；137不单独等于OOM、socket/privileged权限和单机故障域边界明确。本轮探针Python合成实跑不替代Docker Engine验收。

### etcd 深讲

[打开课程](./cloud-native/etcd.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：单节点安装未说明 PowerShell/context/专用卷，错误把未发布的宿主 2380 当端口冲突候选
- 初评：恢复只生成数据目录，没有启动恢复实例读回的完整步骤
- 初评：Watch 压缩故障只有恢复思路，没有新监听事件与精确键清理闭环
- 初评：事务交互末段结束和独立条件变化判据不足
- 修订：补运行位置、Docker 前置链接、专用实例/卷/目录、2379 与 2380 发布区别
- 修订：补事务第三段空行与失败分支反例
- 修订：补 Watch 新修订监听、写 four 验证及精确键回收
- 修订：按官方 3.7.1 恢复默认身份补隔离恢复容器、健康与 v3 读回、容器/卷分层清理
- 修订：新增多数派、Lease、Watch、维护与外部 fencing 五项独立通关

**八项正文证据**

- 前置与路线：作者复评通过。安装与启动：单节点学习环境：PowerShell、Linux 引擎、context、空目录及容器卷身份逐项明确。
- 机制与状态：作者复评通过。一次写请求怎样完成、MVCC、revision 和 version、租约与隔离深讲：解释多数派、版本与外部动作边界，读写与 Watch 保证分开。
- 基础实验：作者复评通过。基础实验：KV、Watch、Lease 和事务以及不停止在生成目录的恢复副本段：完整输入、观测、末段交互与读回。
- 故障实验：作者复评通过。故障实验：Watch 落后于 compact：旧修订拒绝、重新 List、下一修订事件、键清理，明确压缩历史不可撤销。
- 生产取舍：作者复评通过。生产架构检查单和运维深讲：状态探针与真实恢复验收分层：多数派维护、TLS、低延迟磁盘、配额、恢复与上层缓存边界。
- 递进面试：作者复评通过。核心面试题与递进追问、Kubernetes 控制面事故推演：从定义到共识、容量和恢复选择，包含超时未知结果反例。
- 独立通关：作者复评通过。独立通关：把一致性保证画到正确边界：五项具体条件与判据，单节点不宣称多节点容灾。
- AIOps 与证据：作者复评通过。在 AIOps 中的作用与学习证据：fsync→提案→API→控制器链，敏感快照不公开，禁止自动重启多数派。

**验证边界**

- reasoned：全文审阅；GitHub API 核对官方 v3.7.1 etcdutl/etcdutl/snapshot_command.go 默认 name=default、peer=http://localhost:2380。；限制：仅恢复参数静态匹配，未启动恢复容器。
- syntax：git diff --check 对本篇通过。；限制：未执行 PowerShell 教学脚本或检查镜像内部程序。
- unrun：etcd 单节点、Watch 压缩、Lease、恢复与 Kubernetes 多成员演练未运行。；限制：Docker daemon 不可连接，无专用 Kubernetes 集群。

第二位审校者：systems；日期：2026-10-12。

- 全文独立复核：Raft index/MVCC revision/单键version、线性读与Watch缓存、租约与外部fencing边界一致；三/四/五成员多数派复算无误。
- Watch故障保留当前修订、压缩旧历史后重新List/R+1监听four，明确compact非删当前值；恢复副本匹配default成员名并读回v3，不停在目录生成。
- endpoint health源码只读/告警不被当写入压测；单节点与Kubernetes灾备、修订回退/缓存重同步、成员降级时不可机械套先提升口诀均明确。

### Harbor 深讲

[打开课程](./cloud-native/harbor.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：离线渲染入口隐含 Helm 安装与目录准备，直接选索引最新 Chart 可能不匹配产品锚点
- 初评：Push/Pull 多步原生命令未逐步检查退出码，失败后可能继续写成功凭据
- 初评：没有五项独立通关且渲染与真实仓库环境门槛需要前置说明
- 修订：新增从零准备，明确 Windows PowerShell、Helm 安装、空目录与无需仓库的首轮路线
- 修订：按 app_version=2.15.2 筛选候选 Chart，缺候选明确停止而不是猜最新版
- 修订：为 login/pull/tag/push/pull-by-digest 加失败停止，缩短明文变量停留并说明非内存擦除
- 修订：新增别名引用、认证对照、五份保留集合与供应链口述五项通关判据

**八项正文证据**

- 前置与路线：作者复评通过。入门实验：离线渲染 Harbor Helm Chart / 从零准备：本课先不搭一整套仓库：区分客户端首轮与需管理员供给的真实实践。
- 机制与状态：作者复评通过。状态一致性：Tag、Digest、数据库和 Blob 与一次 pull 为什么先得到 401：解释引用、认证挑战及两类持久状态。
- 基础实验：作者复评通过。入门实验：离线渲染 Harbor Helm Chart和基础实验：完整 Push、Pull 与 Digest 证据链：输入、版本选择、退出码及摘要证据明确。
- 故障实验：作者复评通过。故障注入实验：错误 Robot Token及带练事故：独立配置目录认证对照、同作用域修复和 logout 收回；保留规则课堂有无删除模拟。
- 生产取舍：作者复评通过。生产高可用、容量与安全、升级与真正的回滚边界、复制与备份课堂：覆盖冷缓存、异步 RPO、DB/Blob/密钥成套恢复和 GC 预演。
- 递进面试：作者复评通过。三分钟面试回答：仓库怎样变成可靠的发布依赖与系统设计题：双站点企业制品仓库：定义、协议、扫描、恢复与设计取舍可追问。
- 独立通关：作者复评通过。独立通关：仓库里有镜像，不等于恢复时拿得到：五项具体输入、判据、反例与返工章节，缺平台不编造。
- AIOps 与证据：作者复评通过。运维状态课堂：任务完成、策略通过和可发布分别看什么：按 digest 关联构建、扫描、批准、复制与运行；学习证据限制秘密。

**验证边界**

- reasoned：全文逐段审查；官方 Helm 安装页核对 Winget 来源，复查 Chart/appVersion、失败停止及保留集合计算。；限制：Harbor 版本锚点保持历史日期，本轮未刷新所有发行信息。
- syntax：git diff --check 对本篇通过；PowerShell 原生退出码检查按流水线后的 LASTEXITCODE 设计。；限制：未执行脚本、下载 Chart 或调用真实 Registry。
- unrun：Harbor 安装、Push/Pull、扫描、复制、GC、升级与备份恢复未运行。；限制：没有授权 Harbor 实例，离线渲染本轮也未执行。

第二位审校者：systems；日期：2026-10-12。

- 全文独立复核：pull的401挑战与后续scope授权区分，顶层多架构索引与平台摘要差异不误报替换；Core元数据不被描述成每层必经数据库。
- 基础渲染按appVersion选择Chart，不声称启动；真实Push/Pull逐步检查退出码、Token不入Git，错误Token恢复使用同一隔离客户端配置。
- 保留规则或集合题得A1/A2/A3/B2/B3；复制/代理缓存与备份、标签删除与GC、DB+Blob+密钥恢复均有清晰边界。真实仓库未运行如实声明。

### Helm

[打开课程](./cloud-native/helm.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：错误声称 Helm server dry-run 可证明 admission 预检
- 初评：基础入口缺客户端安装与本地/集群路线区分，坏镜像实验直接卸载而未完整业务恢复验收
- 初评：诊断脚本直接输出 values/manifest 且吞掉失败，与生产敏感与采集完整性要求冲突
- 初评：没有独立边界输入、管理权与外部迁移通关判据
- 修订：按官方 v4.2.4 安装源码纠正 dry-run 在真正 Create 前结束，区分 kubectl 服务端 dry-run
- 修订：补 Windows 客户端入口、空目录、context、release 重名检查和 Bash/PowerShell 区别
- 修订：坏镜像后补健康修订选择、port-forward、HTTP 复验及清理
- 修订：将诊断脚本限定为合成课堂，要求生产字段白名单与采集失败标记
- 修订：新增五项独立通关，覆盖零副本/schema、revision、Hook 数据副作用、字段管理与预检边界

**八项正文证据**

- 前置与路线：作者复评通过。AIOps 入门实验 / 1. 创建 Chart：区分本地 Helm 与集群 kubectl/kubeconfig 路线，明确安装与权限范围。
- 机制与状态：作者复评通过。dry-run、debug、template、lint：纠正联机渲染与 API dryRun=All 的区别；Release 状态模型与真实回滚边界解释状态漂移。
- 基础实验：作者复评通过。AIOps 入门实验：完整两个模板、values、渲染、安装、升级；8. 先恢复，再清理补业务探针和回收验证。
- 故障实验：作者复评通过。故障注入实验：坏镜像与自动回滚：专用集群、健康基线、失败现场与真实请求恢复，数据库不随清单回退。
- 生产取舍：作者复评通过。生命周期精讲：CRD、Hook 和数据库各自留下什么及发布并发段落：覆盖迁移、发布锁、字段归属、容量和敏感记录。
- 递进面试：作者复评通过。面试深追问：发布平台该以什么作为成功条件与独立通关：定义、路径、HPA 管理权、数据库迁移及服务端预检反例。
- 独立通关：作者复评通过。独立通关：配置合同能否经受反例：五项均含输入变化、具体可观察结果、拒绝条件及返工章节。
- AIOps 与证据：作者复评通过。AIOps 自动化诊断脚本：新增秘密输出与 \|\| true 风险限制；发布记录如何成为可用的事故证据连接 revision 与观测时间线。

**验证边界**

- executed：运行本机 helm version --short，得到 v4.1.3+gc94d381。；限制：仅客户端版本，不证明文中 4.2.4 或 Kubernetes 行为运行。
- reasoned：通过 GitHub API 阅读官方 helm/helm v4.2.4 pkg/action/install.go，确认 dry-run 在 KubeClient.Create 前返回；官方安装页确认 Winget 包。；限制：源码核对不代替特定集群、准入组件与 plugin 组合回归。
- syntax：本篇 git diff --check 通过。；限制：未执行 Chart 模板。
- unrun：Chart 安装、坏镜像、回滚、Hook、SSA 与 Kubernetes 服务端预检未运行。；限制：没有连接专用 Kubernetes 实验集群。

第二位审校者：systems；日期：2026-10-12。

- 全文复核最小Chart仅两模板、Service标签和命名端口一致，schema负数失败/恢复与坏镜像history/健康修订/HTTP复验齐全，shared namespace清理和历史镜像不可取分支明确。
- 回滚产生新revision但不撤数据库/CRD/Hook/PVC副作用，default把0/false视空、properties非必填、列表整体替换和HPA字段管理权解释一致；四份配置定位链可操作。
- Helm4 SSA/rollback-on-failure与server dry-run非Kubernetes dryRun=All边界有固定源码依据，独立复核values源码分组覆盖顺序。高级发布锁、秘密输出、容量过渡及五项追问齐全；本轮未连接集群。

### Istio 深讲

[打开课程](./cloud-native/istio.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：离线第一课只说安装 istioctl，后续却引用完整发行包 samples，缺校验、目录和 PATH 步骤
- 初评：安装与 purge 前未在入口强调已有网格和实验空间冲突阻断
- 初评：缺五项独立灰度、安全、数据面和容量判据
- 修订：按官方 release asset 补 Windows x64 完整包、SHA256 比较、解压目录、临时 PATH 与样例存在性
- 修订：补真实集群前 context、cluster-info、namespace 身份与共享安装禁用边界
- 修订：新增权重非固定发牌、Service/Pod waypoint 路径、空 subset、容量剔除及授权控制面追问

**八项正文证据**

- 前置与路线：作者复评通过。入门实验：离线生成 Istio 安装清单 / 实验步骤：完整包与校验、PowerShell 路径、样例与临时 PATH；基础实验明确真实平台身份。
- 机制与状态：作者复评通过。架构和数据流、xDS 配置到底怎样送到现场、Ambient 精讲：Sidecar/ztunnel/waypoint 与 Service/Pod 流量边界明确。
- 基础实验：作者复评通过。离线生成实验与基础实验：Ambient L4、waypoint 与真实请求：输入、200、HBONE、Gateway API 前置及回收分层。
- 故障实验：作者复评通过。故障注入实验：不存在的 subset 导致 503：专用 Sidecar 基线、空标签注入、Endpoint/请求证据、精确删除恢复与失败时保留现场。
- 生产取舍：作者复评通过。生产高可用、容量、安全与升级和生产设计课堂：CA/代理故障域、重试/剔除容量、revision 与数据回滚边界。
- 递进面试：作者复评通过。三分钟面试回答与课堂作业、系统设计题及独立通关：定义、路径、授权反例、控制面失联与容量设计有答案梯度。
- 独立通关：作者复评通过。独立通关：配置同步、请求成功和安全达标要分开：五项具体变化、可观察结果与返工章节；不编造运行。
- AIOps 与证据：作者复评通过。在 AIOps 中的作用及路由精讲：版本、响应标志、代理配置与业务 SLI 关联，精确审批后回退。

**验证边界**

- reasoned：全文审阅；GitHub release API 核对 1.30.3 win-amd64 完整包与 sha256 资产，样例 sleep.yaml 的 Deployment/container 名；官方 1.30 waypoint 页面核对 Gateway API 1.5.1 实验清单。；限制：未下载或运行发行包，不证明该旧版本仍适合新生产选型。
- unrun：清单生成、安装、waypoint、503、mTLS 与网格升级未运行。；限制：本轮无专用 Kubernetes 集群；解压与 PATH 教学命令未执行。

第二位审校者：systems；日期：2026-10-12。

- 全文复核固定完整发行包含samples/sleep路径，已查1.30.3官方样例确有sleep容器与curl；离线渲染不同于安装，Ambient L4/HBONE/waypoint L7与Sidecar subset故障路线明确分开。
- 空subset仍有Service后端但请求503，删除精确两资源后同请求200，再收回独占空间；SYNCED/分析无错不推翻运行时失败，恢复失败停止purge留取双端证据。
- 认证/加密/授权分层、ALLOW不抵DENY、JWT缺失与无效分开、最初Service或Pod地址影响waypoint路径、四实例失两容量超限与三层27次重试解释一致；真实网格未运行明示。

### Kubeflow 技术栈深讲

[打开课程](./cloud-native/kubeflow.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：Python 安装与解释器选择是隐藏前置
- 初评：PowerShell 安装失败可继续编译并读取产物
- 初评：numNodes 注释把整体准入说成自动保证
- 初评：验证边界日期过时，缺编译/运行/制品/发布独立任务
- 修订：补 Python 官方安装、Windows 商店别名与声明支持范围内版本选择
- 修订：venv/pip/check/compile 增加逐项退出码及产物存在检查
- 修订：纠正 numNodes 不自动开启 gang scheduling 的机制
- 修订：更新本轮日期、保留历史证据，新增 IR、类型故障、缓存反例、GPU 卡时与五类恢复通关

**八项正文证据**

- 前置与路线：作者复评通过。基础实验 / 前置条件：Python 安装、解释器/包源/venv、支持范围与历史 3.14 观察分离。
- 机制与状态：作者复评通过。KFP、Trainer v2 与状态一致性：DSL 通道、IR/后端、参数/Artifact、numNodes 与 gang 的不同控制责任。
- 基础实验：作者复评通过。基础实验：不装集群也能编译第一条 KFP Pipeline：完整源码、解释器、lock/hash、退出码与精确清理。
- 故障实验：作者复评通过。故障注入实验：让组件类型契约不一致：独立坏文件、非零/无 YAML、声明与实际值修复及新产物。
- 生产取舍：作者复评通过。五类状态备份、GPU 队列、HA、升级回滚与 20 团队设计：恢复真正字节、负向隔离、schema/CRD/外部副作用。
- 递进面试：作者复评通过。面试回答：从 30 秒到架构追问：12 类答案与继续追问，覆盖组合版本、状态、调度及回滚。
- 独立通关：作者复评通过。独立通关：编译、训练、制品和发布是四份不同证据：五项专属任务、120 GPU 小时与并发变式、失败返工位置。
- AIOps 与证据：作者复评通过。AIOps 实战与老师带练：时间泄漏、数据版本/缓存、模型门禁、Run/Model/Artifact 谱系和受控处置。

**验证边界**

- reasoned：全文逐段审阅，保持 2026-08-14 的 KFP 实跑为历史证据，不归属本轮。；限制：本轮未重跑 pip、KFP 编译与渲染。
- unrun：KFP 本轮复跑、KCD 安装、GPU、训练/推理、HA 和灾备均未运行。；限制：历史源码/输出不证明本轮环境或真实集群能力。

第二位审校者：systems；日期：2026-10-12。

- 完整独立阅读，KCD组合版本与独立子项目/生态治理、Trainer v1/v2、Profile基础隔离非全组件强隔离边界明确，rank译为训练进程编号而非名次。
- KFP本地编译/STRING到整数故障/新文件恢复与历史实测分开，唯一目录及解析父路径/名称/链接保护清理齐全；compile只生成IR，不运行容器/GPU/backend，默认值-3预测0/normal正确。
- 五类状态分别恢复，Registry URI非权重、缓存输入须不可变版本、Katib20×2×3=120卡时与并发峰值分开；Pending按队列/Runtime/JobSet/Pod/设备证据取证，回滚不撤外部副作用。本轮未重跑历史环境明示。

### Kubernetes

[打开课程](./cloud-native/kubernetes.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：概念段写命令与真正实验容易混用
- 初评：创建集群文字出现在重名检查前且默认 kubeconfig 污染已有环境
- 初评：Service 基线 curl 没有限时/HTTP 失败判断，镜像恢复未要求业务复验
- 初评：finalizer 删除异步状态和五项独立掌握证据需补
- 修订：明确概念片段与授权操作边界
- 修订：重写 Bash/WSL 前置、先查后建与专用 kubeconfig 路线，区分单节点/HA
- 修订：补 curl -f 与有限等待、声明备份、滚动旧副本存活和恢复 Service 验证
- 修订：finalizer 恢复增加 wait delete 与 ignore-not-found 区分 API 错误
- 修订：新增 replica/template、readiness、两类故障、故障容量及幂等/Secret 越权独立通关
- 修订：交叉返修：按 1.36 官方源码修正 containerd RuntimeConfig 回退及 cgroup v1 默认拒绝/过渡开关边界，诊断骨架明确逐项退出码、未知状态和敏感日志禁发模型

**八项正文证据**

- 前置与路线：作者复评通过。AIOps 入门实验与核心思想开头：终端、工具官方入口、本机引擎、独占目录/集群/kubeconfig、重名与权限边界完整。
- 机制与状态：作者复评通过。API 请求完整链路、List-Watch/Informer、SSA、调度器及网络存储完整路径：状态并发、缓存、端点与运行责任分层。
- 基础实验：作者复评通过。AIOps 入门实验：完整 YAML、就绪/owner/端口、限时集群内 HTTP、专属资源清理与失败停点。
- 故障实验：作者复评通过。AIOps 入门实验 5/6 与进阶 finalizer 实验：错镜像、错 selector、删除状态机分轮恢复，等待最终删除而非命令返回。
- 生产取舍：作者复评通过。高可用、容量/APF、安全、升级回滚与老师推理：N+1 requests、PDB 边界、etcd 恢复及非通用降级。
- 递进面试：作者复评通过。核心面试题参考答案与连续追问：12 类全链路机制、故障、架构答案，含 unknown result/缓存/Schema。
- 独立通关：作者复评通过。独立通关：从控制循环一直解释到真实请求：五项专属任务、revision 变式、负向探针、容量计算和返工范围。
- AIOps 与证据：作者复评通过。Kubernetes 在 AIOps 链路中的位置、诊断脚本与容量表：对象/事件/日志/指标/变更关联，采集失败不等于空状态。

**验证边界**

- reasoned：全文逐段审阅，重写实验创建顺序与客户端/故障/恢复证据。；限制：保留原官方生态快照日期，没有宣布本轮最新版本。
- unrun：kind、业务故障、finalizer、CNI/CSI、HA、升级和 etcd 恢复均未运行。；限制：本机无已连接 Docker daemon/一次性集群，预期不冒称实际。

第二位审校者：systems；日期：2026-10-12。

- 全文独立复核 API/List-Watch/控制器/调度/CRI-CNI-CSI/探针端点/存储/容量/安全/升级恢复；SSA共享字段、就绪端点、PDB和拓扑分布边界未被简化成保证。
- 课堂独立kind和kubeconfig、两Pod业务基线、错误镜像与选择器故障、同请求恢复及finalizer带UID删除证据形成闭环；不把port-forward或Running当全数据路径成功。
- 退回并重读1.36运行时兼容和cgroup v1迁移边界，使用官方release-1.36支持回退而非绝对禁用说法；只读采集\|\|true明确保留逐项未知、权限、完整性与敏感证据边界。当前未运行真实集群。

### KubeSphere 深讲

[打开课程](./cloud-native/kubesphere.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：快照脚本仅写输出文件，未把原生命令失败转成明确停止，容易以空文件验收
- 初评：需要前置客户端、身份与巡检只读权限不含创建 Project 的说明
- 初评：RBAC 初轮立即清理与后文修复轮有顺序跳跃
- 初评：缺五项独立平台与原生状态、许可和扩展生命周期判据
- 修订：补 PowerShell/kubectl/授权 context 与无产品环境的基础路线
- 修订：重写快照为逐项退出码检查 Save-LabQuery，缺平台在原生四项后停止
- 修订：在清理前明确连接后文最小权限修复与回退轮，不删除后继续执行
- 修订：新增 UID、配额/GPU、RBAC 四阶段、日志查询/采集和证据新鲜度通关

**八项正文证据**

- 前置与路线：作者复评通过。入门实验：生成集群健康快照 / 实验步骤：终端、客户端、context、浏览器与 API 身份及读写授权分清。
- 机制与状态：作者复评通过。状态模型、高可用与容量及平台工程课堂：页面、API、spec/status、控制器与就绪结果分层。
- 基础实验：作者复评通过。入门实验：生成集群健康快照：退出码、范围覆盖、原生四项与平台三项、UI ConfigMap 同 UID 交叉验证及回收。
- 故障实验：作者复评通过。故障注入实验：用最小 RBAC 复现拒绝与 RBAC 故障实验的修复闭环：拒绝、最小授权、Secret 仍拒绝、撤回与清理。
- 生产取舍：作者复评通过。扩展运维课堂、扩展生命周期课堂、授权容量课堂：供应链、CRD/PVC、不可逆 schema、历史与新数据及三类容量限制。
- 递进面试：作者复评通过。三分钟面试表达：平台化的价值和代价与面试追问：扩展故障会不会影响核心资源创建：调用链、隔离、影响传播均有答案。
- 独立通关：作者复评通过。独立通关：平台入口方便，不意味着证据可以省略：五项具体输入、失败/恢复证据与答案判据，缺 License 不编造。
- AIOps 与证据：作者复评通过。故障课堂：为什么看到的是昨天的数据和独立通关：数据年龄、上下文、核心/扩展/业务四句结论及受控写动作。

**验证边界**

- executed：用无副作用的本地 cmd exit 5 验证 scriptblock 调用后 LASTEXITCODE 可被函数读取。；限制：只验证 PowerShell 退出码作用域，不调用 Kubernetes。
- syntax：PowerShell AST 解析全部 6 个代码块无语法错误。；限制：不证明权限、License、Console 或 API 运行结果。
- reasoned：全文逐段审查并重写快照失败语义、实验顺序与五项判据。；限制：产品条款保持原证据日期，本轮未激活或认证产品。
- unrun：Kubernetes/KubeSphere 快照、Console、RBAC、扩展及升级未运行。；限制：没有授权产品实例或专用集群。

第二位审校者：systems；日期：2026-10-12。

- 全文独立复核：产品patch/OSS/Edition/License分别记录，不混写开源最新版；工作空间、Namespace与真正网络隔离边界明确。
- 快照逐查询退出码和范围，ConfigMap data不是标签；RBAC实验先拒绝、最小授权且Secret仍拒绝、回退、最后清理，避免先删空间再修复。
- 扩展菜单/后端/CRD/PVC/License分层，resourceVersion非墙钟；恢复和故障题不盲删CRD/PVC，无合法平台环境明确标未验证。

### 微服务深讲

[打开课程](./cloud-native/microservices.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：Java 运行环境未区分 JDK 编译器，Initializr 固定历史版本可能已撤下
- 初评：实验目录强制覆盖及多终端相对路径易错
- 初评：熔断恢复只等 10 秒发一次请求不足以证明 CLOSED
- 初评：缺业务状态与 HTTP 200 分离的五项独立通关
- 修订：补 JDK/javac、生成服务版本撤下时暂停与完整源码边界
- 修订：禁止覆盖已有项目，统一两个窗口绝对目录与测试失败停止
- 修订：显式半开探测次数为 2，恢复后四次请求与状态复查，窗口样本不死记请求序号
- 修订：新增端口变式、降级 200、重试放大、Outbox 重复窗口与副作用通关

**八项正文证据**

- 前置与路线：作者复评通过。可复现基础实验 / 前置条件与第 1 步：JDK、端口、包源、独立目录、在线生成版本边界及完整源文件定位。
- 机制与状态：作者复评通过。核心概念五件套与业务状态课堂：自动配置、调用/发现、熔断窗口、Outbox、未知支付结果和线程/连接池边界。
- 基础实验：作者复评通过。可复现基础实验：两个服务、一次调用、三个证据面：完整 Java/YAML/POM 编辑入口，健康/业务/指标验证。
- 故障实验：作者复评通过。故障注入实验：下游 503 与熔断状态：单一故障开关、窗口证据、半开恢复与环境变量/进程清理。
- 生产取舍：作者复评通过。生产请求路径、状态与容量模型以及优雅停机课堂：deadline/重试/幂等、隔离、HA、schema 兼容及不可逆状态。
- 递进面试：作者复评通过。六、面试从定义追问到架构取舍与独立通关：模块化单体、容错机制、数据回滚各有答案边界。
- 独立通关：作者复评通过。独立通关：业务结果不能藏在 HTTP 200 后面：五类独立复现和变式、600 次尝试容量计算、失败回读位置。
- AIOps 与证据：作者复评通过。AIOps 观测设计与五、从实验读出正确的监控结论：指标/trace/版本关联，不把降级 200 当业务健康。

**验证边界**

- reasoned：全文审阅并读取 Resilience4j 官方状态/参数说明，修正恢复条件和实验前置。；限制：没有生成、编译或解析这两个项目的实际依赖。
- unrun：Spring 项目生成/构建/启动、指标与熔断故障未运行。；限制：不借文章中的预期值冒称实测。

第二位审校者：systems；日期：2026-10-12。

- 全文独立复核：概念片段与两个完整Spring项目明确分开，Initializr固定版本撤下即停步，不悄换Boot/Cloud；JDK/javac/Wrapper和三终端路径具体。
- 故障503通过四调用窗口判熔断，半开两次恢复并复验业务；降级Map可返回200，不把HTTP成功当业务成功，真正编译运行明确未执行。
- Outbox重复窗口、可靠幂等及未知支付对账、线程/连接/舱壁、停机与数据库兼容回退均有机制和反例；100×2×3=600仅为单层尝试上限。

### NGINX / Ingress / Gateway API

[打开课程](./cloud-native/nginx-ingress.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：零基础实验全部依赖已有 controller，不能从本机空环境开始
- 初评：请求路径将 EndpointSlice 画成流量设备
- 初评：CRD 覆盖命令未充分限制已有 controller 的版本所有权
- 初评：缺 URI/状态/TLS/迁移独立通关
- 修订：增加完整本机双容器 NGINX 代理配置、基线日志、暂停后端故障、恢复与精确回收
- 修订：解释主机/容器端口、conf.d 上下文及 curl 无 -f 可在 HTTP 504 时退出零
- 修订：重画 EndpointSlice 语义，限制 Gateway CRD 版本支持矩阵与空白集群条件
- 修订：新增 URI 斜杠变式、故障阶段、三团队所有权与长连接迁移判据

**八项正文证据**

- 前置与路线：作者复评通过。零基础本机实验：先看到反向代理，再故意断开后端：Windows/Docker、本机上下文、工具入口、文件与专属对象要求。
- 机制与状态：作者复评通过。学习边界、核心配置、Gateway 状态课堂：控制信息/报文、URI 改写、父关系/代次、两段 TLS 明确。
- 基础实验：作者复评通过。零基础本机实验：完整 proxy.conf、网络/容器、配置检测、请求/两端日志与失败停止。
- 故障实验：作者复评通过。零基础本机实验及后端引用故障：暂停实验后端、连接/读取证据、同探针恢复；集群条件另列。
- 生产取舍：作者复评通过。从 ingress-nginx 迁移、更新与排空课堂及日志与容量课堂：双入口、标准与实现差异、长连接、容量与回退。
- 递进面试：作者复评通过。老师带练的 30 秒、3 分钟与生产事故答案及独立通关：状态码来源、TLS/timeout/副作用有回答指导。
- 独立通关：作者复评通过。独立通关：入口配置与实际报文能否相互印证：五项独立任务、精确 URI 答案、故障差异和设计判据。
- AIOps 与证据：作者复评通过。NGINX / Ingress 在 AIOps 链路中的位置与日志容量课堂：上游尝试、状态与请求 ID、敏感信息和采集未知边界。

**验证边界**

- reasoned：全文审阅并核对 NGINX 官方 proxy_pass/timeout 模块，新增完整本机实验。；限制：尚未由容器解析该新配置或产生实际 504。
- unrun：本机双容器、Gateway、TLS、迁移与容量实验未运行。；限制：Docker daemon 未连接，也没有选定授权 Gateway controller。

第二位审校者：systems；日期：2026-10-12。

- 全文独立复核：社区ingress-nginx退役与Ingress API冻结、F5项目分开；Gateway CRD非controller，程序/规则/流量证据不混用。
- 零基础Docker代理限定新目录、回环18081及两个专用容器，pause只一个后端、读状态码/阶段日志后unpause同式复验；故障不为凑504篡改记录。
- proxy_pass斜杠URI、相邻read超时非总期限、两段TLS与可信forwarded头说明准确；Gateway父状态/代次、allowedRoutes与ReferenceGrant、长连接排空和真实控制器未验收边界完整。

### Rancher 深讲

[打开课程](./cloud-native/rancher.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：离线渲染缺 Helm 客户端与运行目录入口
- 初评：agent 故障引用不存在的 demo 工作负载和未定义业务探针，无法从零复现与清理
- 初评：缺五项独立应急路径、备份与权限判据
- 修订：补 Windows PowerShell、Helm 官方安装和独立目录，区分渲染与实际实例
- 修订：新增 rancher-probe-lab 完整无状态 Deployment/Service、原生端口转发与 curl.exe 探针，明确非真实 LB 全链路
- 修订：补恢复 agent 后专用探针清理与 controller/兜底行为边界
- 修订：新增代理 kubeconfig、三层恢复、Fleet 与管理故障五项通关

**八项正文证据**

- 前置与路线：作者复评通过。入门实验：离线渲染 Rancher Helm Chart / 实验步骤：客户端、终端、目录与平台需求分层；故障实验要求独立原生 kubeconfig。
- 机制与状态：作者复评通过。架构和数据流、身份精讲课堂、Fleet 交付精讲：管理反向通道、身份路径、期望与下游状态分层。
- 基础实验：作者复评通过。离线渲染实验与故障实验前置条件与基线：固定 Chart、完整专用探针输入、请求方法及成功判据。
- 故障实验：作者复评通过。故障注入实验：cluster-agent 中断时业务是否还活着：保留副本数、原生 API/UI/探针对照、恢复及专用 namespace 清理。
- 生产取舍：作者复评通过。一致性、生产高可用与容量、管理平台恢复精讲、平台迁移课堂：重连尖峰、唯一管理权、三层备份及当前授权复核。
- 递进面试：作者复评通过。三分钟面试回答：用两个探针解释一场事故与大厂设计题作答：定义、管理链、恢复和两百集群设计有答案。
- 独立通关：作者复评通过。独立通关：红色管理页不等于两百套业务一起停止：五项新条件与判断规则，要求路径证据而非截图。
- AIOps 与证据：作者复评通过。在 AIOps 中的作用、权限恢复课堂：管理和业务 SLI 分开，状态新鲜度、授权差异只读报告与写操作审批。

**验证边界**

- syntax：PowerShell AST 解析全部 4 个代码块无语法错误。；限制：解析不连接 API，不证明 Rancher Chart、版本与权限。
- reasoned：全文审阅并补全原缺失探针输入，区分 API port-forward 与真实业务 LB 验收。；限制：历史支持矩阵未作为本轮当前版本重报。
- unrun：Helm 渲染、Rancher 安装/导入、agent 缩容、平台恢复未运行。；限制：无授权 Rancher 与下游实验环境。

第二位审校者：systems；日期：2026-10-12。

- 全文独立复核：管理集群、下游和发行版区分，业务路径不必经Rancher；agent长连接/页面缓存与原生API证据可分别证伪。
- 故障实验限定一次性下游和独立probe namespace，保存原副本与原生kubeconfig；自动调和或node-agent兜底不扩大破坏，恢复/清理顺序完整。
- Fleet状态、配置与数据回退分离，恢复副本禁止与旧平台同时接管；备份不恢复已删除机器或自动回流旧权限，五项迁移题覆盖这些反例。

### TKE on TCE 技术栈深讲

[打开课程](./cloud-native/tke-on-tce.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：数据路径把 EndpointSlice 控制对象画成报文必经设备
- 初评：本机实验工具/仓库文件位置前置不够，PowerShell 错误后仍可能继续故障和清理
- 初评：缺三条链交叉判断的五项独立通关
- 修订：重画请求路径并解释 EndpointSlice 是转发依据不是设备
- 修订：核对两个真实 examples 文件，补 OS/工具/本机上下文/文件存在前置
- 修订：为基线、注入、局部验证、修复、清理增加退出码停止条件
- 修订：新增端口反例、云任务未知结果、AZ 容量计算和两套授权判据
- 修订：按独立交叉反馈修正通关容量口径：系统与代理已扣除，尚需突发与恢复余量，不重复扣系统

**八项正文证据**

- 前置与路线：作者复评通过。基础实验：运行两个副本并验证 Service / 前提与边界：明确 Windows PowerShell、本机引擎、工具官方入口及真实实验文件。
- 机制与状态：作者复评通过。网络路径：容器通了不等于用户通了与云集成状态课堂：EndpointSlice 控制信息、云任务异步调和、对象 UID 边界。
- 基础实验：作者复评通过。基础实验：运行两个副本并验证 Service：两个副本、命名 targetPort、HTTP 与失败停止，读取仓库实际 YAML。
- 故障实验：作者复评通过。故障注入实验：Pod 正常但 Service 不通：8080 单变量、预期失败退出、本机成功对照、修复 HTTP 后清理。
- 生产取舍：作者复评通过。容量与故障域的可复算设计题、升级交付课堂、存储拓扑精讲：AZ 预留、BOM、WFFC 与回滚状态边界。
- 递进面试：作者复评通过。面试回答与连续追问和独立通关：定义、机制、云超时未知、PVC UID、CAM/RBAC 有答案与证据要求。
- 独立通关：作者复评通过。独立通关：三条链不能互相替代：五项预测/反例/容量变式、失败返工位置与云实验未运行规则。
- AIOps 与证据：作者复评通过。AIOps：把告警关联到真实依赖和跨层事故复盘：云/集群/业务时间线及因果假设。

**验证边界**

- reasoned：全文审阅，读取 app.yaml 与 service-broken.yaml，并核对官方 EndpointSlice 控制信息模型。；限制：不以静态读 YAML 证明集群状态。
- unrun：kind 两副本、端口故障与 TCE 云集成/跨 AZ 容量均未运行。；限制：本机 Docker daemon 未连接，没有授权 TCE 测试租户。

第二位审校者：systems；日期：2026-10-12。

- 全文独立复核并退回容量口径矛盾；修复后每台已扣系统/代理，不再重复扣，失AZ36核144GiB、再维护24核96GiB的反例一致。
- 基础/故障/恢复脚本和仓库两份YAML对照：同一80入口仅targetPort变8080，Pod本机成功与Service失败分离，退出码失败即停，集群预检查及精确清理齐全。
- EndpointSlice仅控制清单非报文下一跳；云任务未知结果、PVC/CSI层次与两套授权不混写，本地单节点kind不冒充跨AZ/CLB/CBS验收。

### Traefik 技术栈深讲

[打开课程](./cloud-native/traefik.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：CRD 示例默认 force-conflicts 易被机械复制
- 初评：跨 Bash/PowerShell 示例可能直接使用 curl 别名
- 初评：恢复请求未把 HTTP 错误转为失败停止
- 初评：正文无日志断言与后文日志边界冲突，缺独立五项通关
- 修订：移除默认强占 CRD 所有权，增加冲突停止/managedFields 与管道退出码边界
- 修订：补本地 Linux 引擎、官方安装入口、终端语法及 curl.exe 约束
- 修订：修复实验 PowerShell/Bash 同探针 HTTP 非零停止，明确 Provider 收敛窗口
- 修订：删除 whoami 无日志即未到达断言，新增发现过滤/端口变式/OSS ACME/配额/逐副本故障通关

**八项正文证据**

- 前置与路线：作者复评通过。基础实验 / 前置条件：本机引擎、终端区别、端口与项目网络重名检查；Kubernetes 主线需独占集群。
- 机制与状态：作者复评通过。核心请求路径、两类配置与状态一致性：Provider/Router/Service、独立副本监听、本地运行时状态和 ACME 边界。
- 基础实验：作者复评通过。Docker Compose 完整基础配置及基础实验：完整本机绑定配置、Provider/API、Host 正负对照、日志与清理。
- 故障实验：作者复评通过。故障注入实验：错误后端端口：备份、单字段变更、API/连接拒绝证据、HTTP 恢复失败停止再清理。
- 生产取舍：作者复评通过。高可用、容量、ACME、生产发布与 Helm CRD 升级：跨区、FD/遥测、证书单写、字段所有权和兼容回退。
- 递进面试：作者复评通过。递进面试题与回答指导：12 类机制/架构/故障追问与答案，独立题进一步检查反例。
- 独立通关：作者复评通过。独立通关：动态发现不是自动正确：五项专属任务，发现消失与 9999 故障对照、本地配额及 CRD 强占禁区。
- AIOps 与证据：作者复评通过。AIOps 实战：5xx/P99、证书/配置年龄/连接、告警富化与模型事实推断分开。

**验证边界**

- reasoned：全文逐段审阅，修复命令风险与正文证据冲突；保留已有带日期官方版本来源。；限制：没有重新宣称当前最新或本轮产品实测。
- unrun：Compose、200/404/502、Chart、Gateway、ACME、压测未运行。；限制：Docker daemon 未连接，缺专用 Kubernetes 集群。

第二位审校者：systems；日期：2026-10-12。

- 全文独立复核Compose四层路由/错误Host404/端口9999连接拒绝/恢复curl-f，loopback、共享网络容器80非宿主端口、固定project查重及本轮清理均明确；后端无日志不能单独作反证。
- Gateway教学含完整whoami基线/Service8080到80/命名Gateway及allowedRoutes授权，BackendRef缺失与恢复检查conditions generation；Route挂载非ReferenceGrant、转发入口不证明公网LB/TLS边界准确。
- 独立查Traefik官方v3.7迁移证实TCPRoute v1alpha2与1.6标准通道组合陷阱，官方中间件文档证实Router后Service执行；OSS本地限流/多副本无Raft/ACME文件非分布式协调、2000×3=6000并发及五项追问成立。真实产品未运行明示。

### Apache ActiveMQ 技术栈深讲：Classic 与 Artemis

[打开课程](./data-ai/activemq.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：Windows 文档把 Unix 脚本 status/console 当成 .bat CLI 任务，start 后同窗口继续执行会卡住；dstat 默认远程 JMX 未配置
- 初评：下载解压覆盖风险、SHA-512 文件形态未验证，缺少自有目录和端口归属确认
- 初评：故障实验把正常停机当故障验证，重启沿用状态命令且未确认实例/PID/Message ID，缺少独立五项通关
- 修订：重写双终端前台启动路线，按监听和 Java 实例路径核对 PID；查询/停止明确 --pid，清理复核进程和监听
- 修订：新增自有实验目录、拒绝覆盖、校验文件唯一 128 位十六进制值；说明 6.3.0 额外协议默认注释和安全边界
- 修订：修复重启收回流程、消费等待 30 秒停止边界、合成正文不等于唯一业务事件；增加独立五项任务和下游容量变更计算

**八项正文证据**

- 前置与路线：作者复评通过。安装与启动：Windows/JDK17、双终端、路径、端口归属、自有目录与校验门槛明确
- 机制与状态：作者复评通过。加深课堂：把消息状态和业务状态分开记账：确认未知、幂等并发和状态版本分开解释；保留 Classic/Artemis 内核边界
- 基础实验：作者复评通过。基础实验：发送、浏览和消费持久消息：初始空队列、5 条基线、Browse 不消费、实际输出门槛与等待退出
- 故障实验：作者复评通过。故障注入实验：Broker 重启后恢复持久消息：明确受控停机模拟，确认旧进程退出、新 PID 与原 Message ID；不声称验证断电或 HA
- 生产取舍：作者复评通过。容量与性能、高可用、升级、回滚与迁移：流控、Store、故障域、兼容矩阵；独立任务四计算下游限制后的净追赶
- 递进面试：作者复评通过。面试题与递进追问、独立通关任务五：定义、机制、反例、证据和回退路径俱全
- 独立通关：作者复评通过。独立通关：存储、投递与业务完成分别验收：换 7 条队列、竞争消费者、确认窗口、9.27GiB 容量和五关口口述；答案可判定
- AIOps 与证据：作者复评通过。在 AIOps 中的作用、从事故证据到自动化动作：队列年龄与版本/数据库证据关联，自动扩容/死信重放受审批与下游容量限制

**验证边界**

- syntax：逐个核对 .bat 命令与 6.3.0 官方任务注册、Windows 脚本、dstat/stop/browse/consumer 源码；旧 status/console 已去除；限制：没有本地 JDK/Broker 环境执行；本机 JMX 附加仍依赖目标 JDK 与用户权限
- reasoned：复算独立任务四：162 万积压、45 分钟/135 分钟净追赶，约 9.27GiB；逐步状态推演确认丢失和幂等冲突；限制：计算假设明确，不替代磁盘/下游实测
- unrun：Classic 收发、JMX、受控停机恢复和 Artemis HA；限制：未部署实际 Broker，绝不填造 CLI 或灾备结果

第二位审校者：cloud-automation；日期：2026-10-12。

- 全文独立复核：Classic 与 Artemis、javax/Jakarta、KahaDB 与 Journal、队列竞争与 durable topic 各自契约分清；网络桥不是复制，当前 Classic 无支持的 KahaDB 复制 HA 路径有官方边界。
- Windows 专属安装目录、SHA512、当前 PID/Java 路径/loopback 监听、5 条浏览不消费与 10 条同库正常停启验证完整；不把 CLI exit0、平滑重启冒充断电持久性或 HA。
- 独立七条竞争消费、ACK 未知结果、积压净追赶/下游预算与升级取舍有证据判据；回收限本课队列/进程，无目录自动删除。未实际启动 broker，结论为正文静态复核。

### Apache Pulsar 技术栈深讲

[打开课程](./data-ai/apache-pulsar.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：容器创建、健康检查、主题订阅命令连跑，没有前置失败停止门禁
- 初评：没有明确 Windows 宿主机不需 Java、客户端运行位置与本轮未实测
- 初评：二十条相同业务键积压输入未说明不是二十个业务事实
- 初评：清理使用强制删除而无正常停止阶段
- 初评：缺少新主题、不同业务键和晚建订阅的独立任务
- 修订：启动拆为创建、日志、健康门禁与命名对象创建，失败显式停止
- 修订：补 PowerShell/Linux容器/客户端容器内运行和真实实验未实测边界
- 修订：解释相同正文不同发布与业务幂等不能由CLI证明
- 修订：清理改先正常 stop 再 rm 精确自有容器
- 修订：五项通关覆盖三业务键新主题、latest/earliest历史边界、独立审计积压、180万/30分钟恢复、双确认未知结果

**八项正文证据**

- 前置与路线：作者复评通过。“基础实验：发送、消费和看统计”明确 Windows PowerShell、Docker Linux 容器、4GiB/5GiB、端口名称卷冲突和客户端位置，启动门禁阻止未就绪继续。
- 机制与状态：作者复评通过。“写入与读取路径”“进阶推演：把消息平台的承诺拆成可验证条件”讲存储确认、订阅游标缺口、单条确认和业务事务三个边界。
- 基础实验：作者复评通过。基础实验显式 Topic/earliest订阅、生产一条、消费和stats；两本进度账补多个订阅，文末清理精确容器卷。
- 故障实验：作者复评通过。“故障注入实验：消费者停机形成积压”不启动消费者发20条，对比健康和积压、恢复ACK收敛；独立任务三增加两假设反证。
- 生产取舍：作者复评通过。“高可用与跨地域”“Bookie 故障后的两个恢复阶段”“升级与回滚”覆盖元数据、存储冗余、下游速率、Schema旧积压和执行授权。
- 递进面试：作者复评通过。“面试回答”30秒/3分钟及六追问，“生产设计题”“事故题”给顺序、热点、DB保护和跨地域边界答案。
- 独立通关：作者复评通过。“独立通关：三条发布、两本进度、一份业务事实”五题含新主题全命令、不同业务键、晚建订阅、审计恢复、净速率及确认丢失反例。
- AIOps 与证据：作者复评通过。“AIOps 可观测与容量”“消费失败怎样进入有期限的修复流程”用业务身份、消息年龄、版本和下游能力控制自动操作；学习证据脱敏且不承诺端到端恰好一次。

**验证边界**

- reasoned：全文审读476行，检查订阅起点/历史可用性/ACK三边界；独立任务180万积压、30分钟净追平复算。；限制：未运行 Pulsar 或TCE，镜像就绪、CLI固定版本、订阅统计、持久性和BookKeeper容灾未实测。

第二位审校者：cloud-automation；日期：2026-10-12。

- 全文审阅：发布确认/消费ACK/业务事务三边界、独立订阅/游标/顺序/批处理、BookKeeper冗余恢复、保留TTL压实和TCE授权边界完整；固定容器内CLI避免广告地址误用，先建earliest订阅再发送、20条积压与两订阅恢复、专属双卷清理清楚。五项独立任务包含不同业务键与180万/30分钟预算，未用CLI证明业务恰好一次。

### Dify 技术栈深讲

[打开课程](./data-ai/dify.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：Windows/WSL 文件位置与 PowerShell 克隆步骤冲突，随机密钥工具前置隐藏
- 初评：API 例子未校验占位凭据、超时、字符串 JSON 输出与业务字段
- 初评：Worker 停止实验无可检索基线，容器 Up 被过度解释为队列健康，经济型附加摘要仍可能调用模型
- 初评：缺少独立改变发布条件、检索恢复与容量通关判据
- 修订：统一 WSL/Linux 独立目录部署，新增克隆/旧密钥/绑定目录/Compose 归属及失败停止门槛
- 修订：API 用 UTF8、30秒超时与运行及输出字段断言，区分提示布尔值和审批授权
- 修订：故障实验先验证对照文档，关闭模型增强，唯一消费者停机、新文档ID与关键词复测和有限观察窗
- 修订：新增五项技术专属通关，覆盖草稿发布差异、客户端未知结果、96在途/外部配额及200分钟索引预算
- 修订：交叉反馈把Redis broker准确注释为异步任务消息中介；首页检查区分HEAD头部与GET页面身份，受控且有限重定向后验收而非把3xx直接判平台故障

**八项正文证据**

- 前置与路线：作者复评通过。安装与启动：明确 WSL 路径、工具和密钥准备，旧目录/卷不覆盖
- 机制与状态：作者复评通过。状态与一致性：区分 API/后台索引和多存储状态，不假定全局事务
- 基础实验：作者复评通过。第七步：调用 API：无模型调用验运行ID、状态、字符串JSON及业务字段
- 故障实验：作者复评通过。故障注入实验：停止 Worker，观察知识索引积压并恢复：有正常基线、新文档ID与独有词，恢复验新文档而非旧对照
- 生产取舍：作者复评通过。独立通关：画布、运行与业务结果各自验收：计算在途、模型配额、初始索引时长，审批和备份边界
- 递进面试：作者复评通过。老师带你从画布走到真正运行的系统：草稿/发布、索引、DSL备份和工具权限口述递进
- 独立通关：作者复评通过。独立通关：画布、运行与业务结果各自验收：五类任务都有独立输入与答案判据，不以节点绿色代替业务验收
- AIOps 与证据：作者复评通过。在 AIOps 中的作用：只读告警、变更审查和受控Runbook全链路

**验证边界**

- syntax：4 个 PowerShell 代码块通过系统 Parser；git diff --check 通过；限制：未运行 Docker/Dify 界面、API、Worker 或检索
- reasoned：按1.16.1段落索引和Jieba官方源码核对经济型与附加摘要路径；人工复核配额/容量计算；限制：不是生产限流、延迟或费用实测
- unrun：真实无模型工作流与 Worker 故障恢复；限制：本地缺少已部署 Dify；实验结果为明确预期

第二位审校者：cloud-automation；日期：2026-10-12。

- 全文独立复核：WSL/Linux空目录、官方固定tag、各密钥和实际Compose端口核验、Workflow输入/Template/Output的类型与UTF8客户端、runID+succeeded+输出反序列化与本次输入验证完整；Keyword知识库worker停启故障避免外部模型付费并有新canary和恢复证据。
- 机制与生产边界明确：Template文本不是已验证JSON、needs_review不是审批、worker/broker/数据库/对象/向量/插件分别失败、DSL不是完整备份、指标是建议自定义名不是内置断言；RAG检索相关性不是证据真实性。
- 退回的Redis broker误译已改为异步任务消息中介；首页状态检查已改为仅头信息后人工核受控Location，再有限跳转并验最终200和Dify身份，不把3xx或curl退出0一概判坏/健康。通关含发布/新文档/容量配额与失败证据，明确部署/UI未实跑。

### FastAPI

[打开课程](./data-ai/fastapi.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：完整实验接受负分页、空白名称及非有限数，可能在响应阶段才失败；缺五项迁移通关。
- 初评：Windows激活/JSON与测试入口隐含前置；没有对原始NaN导致错误响应二次失败的防护。
- 修订：新增分段路线、精确新目录/环境安装、失败停步和PowerShell直接调用路径，测试命令统一python -m pytest，独立复审返修requirements依赖名保留pytest而非命令。
- 修订：完整API添加查询范围、长度/空白/额外字段/非有限数合同及不回显原输入的422处理器，修共享分页依赖。
- 修订：增加五项独立通关及真实TestClient版本、警告、未运行网络/镜像的边界。

**八项正文证据**

- 前置与路线：作者复评通过。实验起步、三段路线与安装节明确目录、解释器、虚拟环境、终端及无需集群的TestClient第一步；PowerShell激活失败使用环境绝对路径。
- 机制与状态：作者复评通过。完整请求链、依赖求解与输入校验交错、进程内字典/worker、可靠任务状态及202边界均有反例。
- 基础实验：作者复评通过。完整main.py、安装、独立终端或/docs输入、健康/创建/分析/查询的具体状态和安全收回齐全。
- 故障实验：作者复评通过。非法单位与重启丢失状态两级演练，保留同ID前后证据，重新创建不冒充恢复旧数据。
- 生产取舍：作者复评通过。事件循环/线程池、连接池总预算、持久任务/Outbox/幂等、授权/代理/脱敏、发布兼容和回退有明确边界。
- 递进面试：作者复评通过。30秒与3分钟答案后追问422、202崩溃、多worker内存、阻塞SDK低CPU事故及生产设计。
- 独立通关：作者复评通过。五道专属任务含新输入422与零写入、独立状态实例、240/80连接及发布峰值96超预算、错误输出与授权反例。
- AIOps 与证据：作者复评通过。AIOps告警接收→可靠登记→分析→查询和路由模板指标、请求ID、排队年龄、GitHub脱敏证据可对应。

**验证边界**

- executed：独立venv Python3.14.5/FastAPI0.143.0/Starlette1.7.0/Pydantic2.14.1/httpx0.28.1运行正文完整API25项检查与单位错误小实验；新模块内存旧ID404。；限制：不是真实服务重启、网络/代理/多进程/持久存储/并发测试，httpx适配有弃用提示。
- reasoned：全文逐段审查，官方Query/Pydantic配置/TestClient文档核对；连接预算240、72与发布峰值96复算。；限制：未验证Python3.12镜像和组织鉴权实现，模型分析仍是规则字符串。
- unrun：实际服务器、Docker/Kubernetes、DB/消息队列、断电与HA实验。；限制：没有为本课连接真实平台，预期结果与实测范围严格分离。

第二位审校者：foundation-frontend；日期：2026-10-12。

- 全文复核。交叉发现requirements文本误含执行命令，作者已修为pytest并重读确认；实际重跑原文提取的25项合同及百分数边界，创建/查询/202后台分析、非法limit、空白/额外字段/枚举/NaN/Infinity、坏JSON/404和新模块内存丢失均符合。实测Python3.14.5/FastAPI0.143.0/Starlette1.7.0/Pydantic2.14.1/httpx0.28.1。
- Python3.11 StrEnum前置、原生隔离环境/新目录/回环监听及概念片段与主实验分开；错误处理不回显坏输入导致NaN二次序列化失败，模型/内存状态/多worker/响应过滤不冒充持久化或内容安全。BackgroundTasks、Outbox、超时未知和外部审批边界成立。
- 五关坏输入不增加状态、进程重启404、3×4×20=240超80与每worker6连接3×4×6=72扩4副本96、无权限路由/模型内存及重复动作判据具体。本次为TestClient进程内执行及新模块模拟，不是真实服务器重启、网络服务、数据库/队列、鉴权、容器或压测验收。

### Apache Flink 深讲

[打开课程](./data-ai/flink.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：固定2.3课程资料指向移动stable，后台SQL提交隐藏错误
- 初评：未交代文件目录校验、REST和Slot就绪门禁
- 初评：故障仅3次重试易耗尽，未说明FAILED不能靠启动节点恢复
- 初评：缺改变速率、到达顺序和恢复期新增输入的独立任务
- 修订：固定release-2.3官方链接，补PowerShell文件与Compose校验
- 修订：前台SQL提交保留错误和JobID，先核对REST与Slot
- 修订：课堂有限重试100、短停时限和FAILED分支，强调原Job状态与共享卷边界
- 修订：新增五项通关，含七条每秒窗口、9/12到达顺序、同Job恢复、27分钟追平、外部副作用

**八项正文证据**

- 前置与路线：作者复评通过。“入门实验：Docker Compose 运行持续 SQL Job”说明PowerShell、Docker/Compose、4GiB、两文件/目录、精确项目卷冲突和容器内SQLClient。
- 机制与状态：作者复评通过。“时间合同：乱序等待和允许迟到不是同一个参数”“检查点合同：运行态与恢复介质分别负责什么”“输出合同：更新流不是普通追加流”分开水位、恢复介质和外部提交。
- 基础实验：作者复评通过。完整compose.yaml/job.sql运行五秒Datagen与Print，新增REST/Slot门禁及前台提交；同Job、持续结果与检查点验收，限定项目清理。
- 故障实验：作者复评通过。“故障注入实验：停止 TaskManager”记录原编号、Slot、检查点，有限时间恢复，FAILED不称成功，Print非端到端事务。
- 生产取舍：作者复评通过。“状态恢复和追赶的容量预算”“安全与变更要保护状态中的业务数据”“高可用”涵盖状态/热点、故障域、代码提交权限和旧状态兼容回退。
- 递进面试：作者复评通过。“面试怎么讲”“递进面试题”“事故复盘的连续追问”有30秒/3分钟、状态、反压和业务正确性答案与追问。
- 独立通关：作者复评通过。“独立通关：运行、时间进度、恢复正确是三份证据”五题改变速率、到达顺序、失败位置和恢复期输入，提供反例与回看章节。
- AIOps 与证据：作者复评通过。“可观测性与 AIOps”按作业/算子/检查点/源/制品关联并限制自动Cancel/Rescale；GitHub证据禁止真实检查点数据。

**验证边界**

- reasoned：全文审读766行；复算432万积压、18分钟追赶、27分钟总预算，检查有限重试与后台提交分支。；限制：未启动Flink/Docker，SQLClient、Datagen/Print、检查点及实际恢复未实测。
- reasoned：核对Flink官方DockerHub包含2.3.0-scala_2.12-java17标签。；限制：标签存在不证明本机启动与连接器兼容。

第二位审校者：cloud-automation；日期：2026-10-12。

- 全文审阅：事件时间/水位/多通道空闲、状态与输入位置、Checkpoint与外部提交/UID兼容/反压边界完整；Compose卷权限与共享路径、持续SQL/原JobID短停恢复/有限重试/清理清楚；五项独立任务含到达顺序反例与恢复期间新增流量27分钟预算。另通过官方docker-library/official-images当前library/flink核对2.3.0-scala_2.12-java17标签确实存在；未执行Flink集群。

### Apache Hadoop 深讲

[打开课程](./data-ai/hadoop.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：daemon 启动返回后没有明确的进程/节点/safemode就绪门槛，下载失败会继续
- 初评：MapReduce 失败后仍可继续读旧输出，只过滤 FINISHED 状态与 _SUCCESS 容易替代本次结果验收
- 初评：故障恢复紧跟启动立即查询，未定义等待边界；没有跨块/调度/副本/外部副作用的独立通关
- 修订：给下载和启动加失败停止；补两分钟就绪门槛和本实例五类进程/节点/安全模式检查
- 修订：提交失败不继续、按本次 application ID 核对 Final-State 和输出；明确聚合日志未配置及成功标记边界
- 修订：补 DataNode 恢复收回条件和五项独立题，覆盖目标/实际副本、短文件空间、退役净带宽和 Combiner/外部副作用

**八项正文证据**

- 前置与路线：作者复评通过。安装与启动、启动单机实验集群：独立 Linux/WSL、Java17、资源、路径、工具和就绪门槛完整
- 机制与状态：作者复评通过。HDFS 核心原理、YARN 核心原理、MapReduce 核心原理：元数据/块、应用状态、shuffle/commit 五部机制与故障观察清楚
- 基础实验：作者复评通过。入门实验：HDFS 加 MapReduce WordCount：三行输入、失败停止、本次应用编号、最终结果与词频联合验收，精确清理
- 故障实验：作者复评通过。故障注入实验：停止 DataNode：单副本边界、dead延迟、受限读取、恢复 heartbeat/block report 与原文/fsck；禁止重新格式化
- 生产取舍：作者复评通过。HDFS 高可用设计、YARN 高可用与状态恢复、容量与性能、升级与回滚：QJM/RM状态、安全、灾备、finalize门槛；独立退役容量与55.6小时带宽测算
- 递进面试：作者复评通过。核心面试题参考答案与连续追问、系统设计题、独立任务五：机制、取舍、故障和算法/副作用反例齐全
- 独立通关：作者复评通过。独立通关：块、调度、计算和提交各交一份证据：新四行8词、目标副本2/实际1、独立节点故障、退役计算与平均值反例有可判定答案
- AIOps 与证据：作者复评通过。在 AIOps 中的作用、可观测性：将 path/application/queue/rack/block、指标日志审计关联，危险自动化保留审批与恢复边界

**验证边界**

- reasoned：全文核对单机路径、输入词频、失败收回和五题答案；复算退役210/300=70%、50TB/250MB/s≈55.6h、平均200/3；限制：不替代实际HDFS放置/恢复吞吐
- syntax：按3.5.0官方YARN命令核对-state查询路线，检查Bash续行与\|\|exit1、四XML完整性；限制：未在Linux启动Hadoop或跑shell脚本；release SHA512官网内容核对，不宣称本地包校验成功
- unrun：WordCount、DataNode停机/恢复、HA、Kerberos、退役与升级；限制：缺少实际Hadoop集群，本轮未产生运行截图、进程日志或生产验收

第二位审校者：cloud-automation；日期：2026-10-12。

- 全文独立复核：HDFS 元数据/数据 pipeline、heartbeat 与 block report、QJM 元数据多数派与数据副本、YARN RM/NM/AM、MapReduce spill/shuffle/commit 分层准确；Secondary NameNode 非热备、fencing 和外部副作用边界保留。
- 基础实验提供 Java17、隔离目录/配置/PID、完整四 XML、首次 format 防重、daemon 真实状态门禁、WordCount 内容/application 最终状态/_SUCCESS 多证据；DN 故障有 20 秒受限读、超时与 dead 检测延迟分开、原文恢复和限定清理。
- 独立八词复现、单 DN 目标副本2、受限失败证据、退役容量/55.6小时及平均值/推测执行题均有具体判据。Kerberos、灾备、升级 finalize、容量/故障域有边界；未运行 Hadoop daemon/HA，静态审校不冒充实测。

### Apache HAWQ 存量运维与迁移深讲

[打开课程](./data-ai/hawq.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：倾斜脚本空表、零总量、负数、非数字和重复桶可能报错不清或错误显示均衡
- 初评：脚本隐含终端当前目录且未标注输出仅合成
- 初评：缺同总量字节/查询子集反例与独立迁移预算判据
- 修订：CSV按脚本目录读取，校验表头/非负整数/唯一桶/非空非零，decimal加总，输出OFFLINE_SIMULATION_ONLY
- 修订：新增五通关：800行2.5比例、行/字节倾斜区别、四类坏输入恢复、17迁移窗口预算、Catalog/连接放大/双主口述
- 修订：实际执行脚本核心计算和输入验证的9组合成测试
- 修订：交叉核官方历史2.2取值，列式DDL改orientation=parquet，资产类别与执行片段中文同步

**八项正文证据**

- 前置与路线：作者复评通过。“官方历史资料”“入门实验：离线计算 Segment 倾斜”仅需PowerShell/编辑器、新目录与两个文件；脚本路径和运行位置明确，不安装退休服务。
- 机制与状态：作者复评通过。“一次查询的数据路径”“数据放置不等于永远绑定同一台物理机器”说明Catalog、资源、HDFS和Motion，不把模拟桶当真实固定Segment。
- 基础实验：作者复评通过。“入门实验：离线计算 Segment 倾斜”完整CSV/脚本/命令、400000/1.02判据、路径检查和限定文件清理；明确仅离线。
- 故障实验：作者复评通过。“故障注入实验：制造分布键热点”900000热点→3.6、两类假设、恢复均匀；独立任务三覆盖坏输入拒绝和复测。
- 生产取舍：作者复评通过。“迁移精讲：查询结果相同，比 SQL 能执行更难”“存量平台工作坊：从一份月报追到全部依赖”涵盖增量、类型、恢复依赖、商业支持与回退截止。
- 递进面试：作者复评通过。“面试怎么讲”“递进面试题”“面试桌面事故：某个月报突然比去年慢四倍”有定义、路径、分布取舍、迁移设计和连接放大答案。
- 独立通关：作者复评通过。“独立通关：同样总行数，为什么结论可以相反”五题变输入/字节/坏文件/窗口预算，答案含反例和回看章节。
- AIOps 与证据：作者复评通过。“可观测性与 AIOps”“本课 GitHub 学习证据”将依赖风险、查询阶段、迁移证据关联并禁止无审批start/stop或Catalog修复。

**验证边界**

- executed：从文章提取完整计算/验证脚本，只将Import-Csv输入替换为ConvertFrom-Csv合成字符串；执行基线1.02、故障3.6、独立2.5及非数字/负数/重复桶/全零/空表/错表头共9组，退出0。；限制：未测试脚本文件启动、PSScriptRoot文件读取或执行策略；没有HAWQ实例、真实分布/性能/迁移。
- reasoned：全文审读690行，复算120TB/250MB每秒约133.33小时和17个8小时窗口；保持退休项目仅离线路线。；限制：历史项目状态沿原官方资料引用，本轮未重新安装或运行历史产品。

第二位审校者：cloud-automation；日期：2026-10-12。

- 全文审阅及返修复核：历史2.2/Attic边界、虚拟与物理Segment、Motion/数据倾斜、离线CSV严格验证/同计数对照、JOIN放大和迁移全增量切换完整；orientation=column已按官方2.2改为parquet，知识图/资产例及Slice中文同步修正。五项独立任务包含2.5倾斜与120TB约133小时/17窗口可判定答案，明确离线模型不是HAWQ运行验收。

### Apache HBase 深讲

[打开课程](./data-ai/hbase.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：首次两条 put 邻接示例容易被误读为多列原子事务
- 初评：下载、构建和创建容器失败后缺少停止门禁，两个待保存文件的名称位置不够明确
- 初评：原有关联字段图缺少逐项中文含义；缺少要求预测和独立证据的技术专属考核
- 修订：补独立 Put 的部分成功边界、Docker 可用性及下载校验格式/构建/容器创建检查
- 修订：明确 Dockerfile 和 hbase-site.xml 保存位置，拒绝覆盖已有镜像标签，清理先正常停止
- 修订：解释 AIOps 字段并加入版本、桶前缀、表禁用、容量和重试语义五项独立通关判据

**八项正文证据**

- 前置与路线：作者复评通过。“下载并验证”“Dockerfile”明确 Docker、课堂目录、文件名及失败停止；开篇已有平台与资源前提。
- 机制与状态：作者复评通过。“写入路径”“一致性边界”“深入课堂：从行键的每一个字节推到恢复目标”区分 WAL、Flush、单行原子性和异步复制；常用命令旁新增两次 Put 非同一事务。
- 基础实验：作者复评通过。“入门实验：构建官方发布包单机 HBase”包含下载校验、构建、Shell 点查及 UI 验证；“版本实验：看见两个值不代表有两条业务行”验证显式时间戳。
- 故障实验：作者复评通过。“故障注入实验：禁用表”要求状态证据、恢复同一 Cell 并清理；实验不能证明真实 WAL 持久性已再次明确。
- 生产取舍：作者复评通过。“高可用与故障恢复”“容量与性能”“安全”及深入课堂覆盖底层 HA、恢复与临时空间，独立容量题保留开销边界。
- 递进面试：作者复评通过。“独立通关：一行、两个版本和一次业务事实”追问 Put/Increment 超时、Master 控制面、Scan 返回与读取范围，避免背定义。
- 独立通关：作者复评通过。“独立通关：一行、两个版本和一次业务事实”要求全新行、先预测、两版本证据、散列条件变化、禁表收回及容量计算与判据。
- AIOps 与证据：作者复评通过。“可观测性与 AIOps”解释关联维度及高基数风险，自动 Move/Split/Compaction 明确审批边界。

**验证边界**

- reasoned：逐篇全文审阅；检查版本写入、散列桶和 3.6×3/0.8=13.5 TB 容量推导。；限制：未运行真实 HBase、Docker 构建或下载发布包；课堂本地文件系统不验证生产持久性/HA。

第二位审校者：cloud-automation；日期：2026-10-12。

- 全文审阅：排序字节/确定性与随机盐、定位/WAL/MemStore/HFile/缓存合并、行级原子性与非全表快照、时间戳/TTL/删除/复制/Compaction边界完整；官方包校验与单机file://能力降级明确，禁用表和双版本故障均回收。五项独立任务能区分行/版本/事件、16桶访问取舍和13.5TB基线；未把本地存储实验当WAL与集群容灾验收。

### Apache Hive 深讲

[打开课程](./data-ai/hive.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：启动前冲突检查被放到启动后，未挡创建失败后进入同名未知对象
- 初评：IF NOT EXISTS配合追加INSERT易重复输入仍按三行验收
- 初评：故障清理强制删除且匿名卷去留未说明
- 初评：缺迟到分区、零结果与不可连接的独立区分
- 修订：冲突检查前移，容器创建失败停止
- 修订：课堂建库表不静默跳过重名，说明INSERT仅一次和追加非去重
- 修订：先核对自有容器正常停止再删匿名课堂卷
- 修订：新增五通关：两天六行、事件日/入仓日、零SQL与停机反证、555.6MB每秒和128倍文件数、元数据/整理/升级边界

**八项正文证据**

- 前置与路线：作者复评通过。“老师先带你认路”“入门实验：HiveServer2 与分区聚合”给PowerShell、Linux容器、资源和客户端位置；冲突检查和创建失败门禁已前移。
- 机制与状态：作者复评通过。“查询数据路径”“元数据与状态”“事务课堂：文件写完为什么还不能随便读”区分表描述、文件、运行态和事务可见性。
- 基础实验：作者复评通过。“SQL 与 DDL 入门”完整三行SQL，明确只插一次；入门真实容器/Beeline、聚合/分区/Location三证据及限定清理。
- 故障实验：作者复评通过。“故障注入实验：停止 HiveServer2”对比端口False/Exited与恢复原三行；独立任务三对照SQL零结果与连接失败，防补零。
- 生产取舍：作者复评通过。“生产高可用与容量设计：从二十 TB 推回时间预算”“升级与回滚”覆盖后端DB单点、扫描/重算预算、元数据库格式和权限绕过。
- 递进面试：作者复评通过。“面试怎么讲”“递进面试题”有30秒/3分钟与分区、小文件、查询阶段、元数据HA追问；生产事故题给资源等待证据。
- 独立通关：作者复评通过。“独立通关：日报为零，先问是哪一种‘没有’”五题新日期/迟到/失败位置/文件预算，有观测和反例判据及回看章节。
- AIOps 与证据：作者复评通过。“可观测性与 AIOps”“数据质量课堂：日报正确比查询成功更重要”关联查询阶段和质量门禁；自动Kill/重写需审批，证据脱敏。

**验证边界**

- reasoned：全文审读671行；复算六TB三小时555.6MB每秒，文件数128倍，检查双日期六行及迟到口径。；限制：未启动Hive，镜像/Beeline/实际分区裁剪、事务整理、元数据恢复与性能未实测。

第二位审校者：cloud-automation；日期：2026-10-12。

- 全文审阅：元数据/文件/查询/事务四状态、三种裁剪、分桶与写入布局、ACID有效Write ID与清理引用、日报迟到/质量及恢复全链完整；Docker新课堂、Beeline三行与分区/位置/计划、入口停止后原数据恢复及匿名卷清理明确。五项独立任务分别检验两天六行、事件/入仓日期、零与连接失败、555.6MB/s下限和元数据恢复边界；不把小样本耗时当性能结论。

### Kafka

[打开课程](./data-ai/kafka.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：消费组互不影响及单机只能单副本措辞混淆进度/资源和broker/主机
- 初评：Python 客户端安装缺专用解释器路线，大小保留未说明按分区
- 初评：课堂容器创建、主题/生产失败缺门禁；强制清理未正常停止
- 初评：无新主题/压实位置缺口/容量空闲的独立判据
- 修订：区分消费组进度独立与共享资源，单broker和同宿主多broker边界
- 修订：补虚拟环境路线、retention.bytes分区口径，磁盘保留更改需授权；注明ELR另核有效功能状态
- 修订：补启动就绪/主题/生产门禁，清理先正常停止
- 修订：五项独立通关覆盖新主题独立组、压实位置差、同组积压、24.192TB预算、端到端语义
- 修订：交叉反馈补Streams五项相邻中文，基础与恢复消费者15秒等待限制和失败/不足条数停止，故障发送检查退出码以区分未知结果

**八项正文证据**

- 前置与路线：作者复评通过。“一套可以照着做的独立基础与故障实验”“Python producer”提供首跑二选一、PowerShell/Docker Linux/容器内CLI和虚拟环境路线，启动检查失败即停。
- 机制与状态：作者复评通过。“把一次告警投递沿着四个位置走完”“同步副本门槛是一道可用性取舍题”“幂等生产、事务与外部工单不是同一层保证”区分确认、读可见、提交和业务；ELR条件另核。
- 基础实验：作者复评通过。独立基础实验有单分区建表、生产基线、同组消费、提交位置与lag0门禁、容器限定清理。
- 故障实验：作者复评通过。“故障注入：消费者故意保持离线”三条积压恢复原组；“离线故障课堂：为什么先提交会漏、后提交会重”模型正向实际执行且含断言。
- 生产取舍：作者复评通过。“容量、恢复与安全要算到业务终点”覆盖保留、少节点空间、下游净速率、权限、回放和功能级别不可随意降级。
- 递进面试：作者复评通过。“面试练习：三分钟沿证据解释系统”及独立通关追问副本、压实位置、Kafka事务与HTTP副作用和控制面数据面故障。
- 独立通关：作者复评通过。“独立通关：位移推进不等于工单完成”五题要求新主题三事件、两独立组、压实缺口反例、同组故障和空闲/恢复计算。
- AIOps 与证据：作者复评通过。“Kafka 在 AIOps 链路中的位置”“事故回答：位移归零，工单却缺了”关联业务ID/主题/分区/位移与工单对账，禁止reset/删记录假绿。

**验证边界**

- executed：从文章提取完整 offset_boundary.py 标准库模型执行，断言通过；实际输出 commit-first:(0,1)、commit-after:(2,1)、deduplicated:(1,1)。；限制：单线程内存模型，不是 Kafka、数据库、持久化或协议重试实测。
- reasoned：全文审读1489行；核对Kafka4.3官方Topic配置retention.bytes按分区、段清理及ELR提示；复算6.048/18.144/24.192TB和60分钟故障追平下限。；限制：未启动真实Kafka、第三方Python SDK或副本/ELR选举实验。

第二位审校者：cloud-automation；日期：2026-10-12。

- 全文独立复核：KRaft 控制元数据与分区 ISR/ELR 边界、位置差非业务完成、外部事务/幂等、段保留与压实、容量及功能级别回退均有具体解释；单副本课堂没有冒充 HA。
- 返修复核通过：Streams 五个教学名词已有中文；基线与恢复 console consumer 均加 timeout-ms 15000、非零退出即停，发送未知与条数不足不得宣称恢复，有限空闲等待不冒称整条命令硬十五秒。
- 独立通关使用新主题/新组、压实位移反例、同组恢复及净追赶容量，答案可判；只做正文/官方配置静态审校，未运行 Kafka 容器。

### LangChain 技术栈深讲

[打开课程](./data-ai/langchain.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：安装依赖激活脚本、目录存在和安装失败继续执行风险
- 初评：基础Fake最终回答预写但只验证固定字段，没有核对实际工具来源和调用ID
- 初评：故障只验审批中断，未验证拒绝/批准收回路径；历史实跑与新修改边界需区分
- 初评：无独立负向参数、幂等边界及容量通关题
- 修订：新建目录保护、明确venv解释器和依赖安装/冲突失败停止，移除递归删除示例
- 修订：工具拒绝不支持的服务；比对ToolMessage调用ID、实际来源和清单；限定步骤预算
- 修订：补同进程reject/approve续跑和执行计数终态，限制审批选项，解释respond不是拒绝
- 修订：新增五项通关和容量/状态预算，明确历史基线不能证明新增路径已运行
- 修订：交叉反馈补生产图完整短语中文、首次CMDB/RCA释义和九项分层证据问句中文；保留审批写入、可靠状态、业务实际复核的边界

**八项正文证据**

- 前置与路线：作者复评通过。Windows 固定版本安装：不用激活脚本，目录与每次安装失败均停止
- 机制与状态：作者复评通过。一次 Agent 请求的完整数据路径：分开工具请求、服务端执行、Checkpoint与最终交付
- 基础实验：作者复评通过。基础实验：无 API Key 跑通 AIOps Runbook Agent：脚本化模型边界清楚并核实际ToolMessage证据
- 故障实验：作者复评通过。故障注入实验：模型请求重启生产，但审批前执行次数必须为 0：中断后同进程拒绝/批准，计数0/1及终态有明确预期
- 生产取舍：作者复评通过。容量、性能、成本与背压：关键路径、槽时、Provider配额及检查点存储预算
- 递进面试：作者复评通过。面试题与递进追问：涵盖工具、持久状态、MCP、升级与ExactlyOnce边界
- 独立通关：作者复评通过。独立通关：工具请求、审批和业务事实不能混为一谈：五类任务包括未知服务、失效门禁和外部成功本地未知的答判
- AIOps 与证据：作者复评通过。LangChain 在 AIOps 链路中的位置：只读证据Agent接受控执行、审计、评估而非直接生产权限

**验证边界**

- syntax：12 个 Python fenced blocks AST parse；6 个 PowerShell fenced blocks Parser parse，均通过；限制：语法正确不证明SDK运行或HITL恢复可用
- reasoned：官方HITL文档核对reject/approve、同Thread Command续跑以及respond语义；复算120槽/12Worker/6.67Run每秒与921.6GB；限制：不是实际Provider、持久检查点或压测
- unrun：新增工具证据断言及同进程审批续跑；限制：当前没有固定LangChain SDK实验环境；明确区分原文历史基线记录

第二位审校者：cloud-automation；日期：2026-10-12。

- 全文独立复核：Python/venv与固定依赖前置、确定性Fake模型工具循环、ToolMessage调用ID、Pydantic最终报告及HITL approve/reject恢复实验步骤和预期明确；历史真实运行与本轮续写未运行范围分开，内存Saver未夸为跨进程持久化。
- 机制与生产层准确区分模型工具提议和可信应用授权、schema与事实、thread/context/store/trace、middleware顺序、并行Reducer、checkpoint与外部业务写；持久恢复不能提供外部exactly-once，未知结果需下游查询/稳定操作ID/审批与审计。
- 独立通关覆盖执行序列、拒绝零副作用、状态丢失、容量与模型配额、故障证据；退回的生产图完整短语中文、首次CMDB/RCA解释及九项分层英文问句已逐处修复复核，不仅检查是否出现中文。

### LangGraph

[打开课程](./data-ai/langgraph.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：前文每节点共享同份state易被误读为并行可变全局字典
- 初评：虚拟环境安装重复且PowerShell激活失败没有无策略修改路线
- 初评：基础输出仅动作字符串，结尾却笼统声称证据证明可恢复可审计
- 初评：缺运行时布尔/并行归并/存量线程兼容的独立任务
- 修订：前移Python和独立目录前置，明确状态步骤可见与归并、直接使用虚拟解释器
- 修订：说明关键词规则/动作文本非暂停或工单，结尾学习证据分层并加入中断/目标契约文件
- 修订：五项独立通关包含分类反例、reducer冲突、错误恢复值边界、状态容量与动作授权追问

**八项正文证据**

- 前置与路线：作者复评通过。“准备 Python 虚拟环境”“激活虚拟环境”明确3.11/3.12、无APIKey、专用目录及不改执行策略的解释器路线。
- 机制与状态：作者复评通过。“从零补课：图里的状态不是一份随便修改的全局变量”“把暂停和恢复变成能自己验证的实验”区分步骤状态、reducer、中断重跑和保存器。
- 基础实验：作者复评通过。“入门实验：不用大模型跑一个告警分诊图”完整StateGraph脚本/运行/预期/排错，声明输出字符串不是真实工单或审批。
- 故障实验：作者复评通过。“独立故障实验：审批的目标和执行目标不一致”有拒绝/重审批复测；中断课有批准拒绝和内存清理。新任务不承诺错误恢复值可直接替换。
- 生产取舍：作者复评通过。“审批不能只绑定一个‘同意’按钮”“生产设计：持久状态、运行配额与版本一起管理”覆盖可信审批、租户线程权限、旧worker/共享状态、容量和老线程升级。
- 递进面试：作者复评通过。“递进面试：从三十秒定义到事故设计”有定义/机制/幂等/持久化/事故的连续答案，独立口述拆四种收据。
- 独立通关：作者复评通过。“独立通关：图走完、审批通过、动作完成是三张收据”五任务给新输入与no error反例、并行归并、错误布尔、300GB/1000请求预算与授权兼容判据。
- AIOps 与证据：作者复评通过。“LangGraph 在 AIOps 链路的位置”“AIOps 用法”把取证/建议/审批/执行/验证分层，权限和外部副作用不交模型自由文本。

**验证边界**

- syntax：从全文提取5段Python代码，以AST解析全部通过；首次JSON文本管道编码失败后改为UTF8 base64传输重测成功。；限制：AST不执行框架，当前主机未安装langgraph；未运行图、中断、保存器、API或真实自动化。
- reasoned：全文审读1069行，复评状态归并、错误恢复值边界及10GB每日/300GB保留、1000次查询模型。；限制：持久化和并发协议仍需选定依赖/保存器在隔离环境实测。

第二位审校者：cloud-automation；日期：2026-10-12。

- 全文独立复核：State/Node/Edge、reducer 冲突、checkpoint/thread、interrupt 节点前缀重跑与外部副作用并非同一事务均按具体路径解释。
- 基础三节点与独立 interrupt 示例有隔离线程、批准/拒绝、暂停状态/next、四次前缀访问预期；字符串 False 拒绝及稳定审批目标合同避免拿用户输入冒充授权。
- 通关包含新输入反例、并行字段冲突、失败原线程保留、工具并发/状态容量与可信审批追问；多 worker fencing 和升级旧状态边界明确。未运行真实 SDK 或生产持久化后端。

### LLM / OpenAI API

[打开课程](./data-ai/llm-openai.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：向量计算可静默截断且接受NaN/零向量；合同对坏类型/空证据缺失败关闭。
- 初评：付费示例超时/重试/保存边界含糊，基础入口和迁移评测不足。
- 修订：补离线路线与隔离安装停步；真实调用显式超时/重试/输出与保存配置。
- 修订：强化向量、合同和终态，函数参数与授权分离；补五项通关及真实模拟验证边界。

**八项正文证据**

- 前置与路线：作者复评通过。离线优先路线、新目录与venv失败停步、Windows解释器回退；交叉返修摘要项目短路线，直接调用专属环境Python并逐次验退出码，已有环境/密钥不覆盖，填入获批密钥后才单独运行。
- 机制与状态：作者复评通过。响应终态/工具输出分层；结构不等于事实、call_id不等于幂等、向量同维度不等于同空间。
- 基础实验：作者复评通过。两份离线完整脚本及可选真实API超时/输出限额/store边界与向量输入。
- 故障实验：作者复评通过。虚构来源、写操作、拒绝/未完成、空证据与坏向量有拒绝、降级和恢复。
- 生产取舍：作者复评通过。持久队列、期限/限流、缓存租户隔离、发布兼容、数据控制与备用供应商授权。
- 递进面试：作者复评通过。30秒/3分钟答案，合法JSON误回滚事故及提示词安全/引用支持连续追问。
- 独立通关：作者复评通过。五项通关含1/0/-1向量、流终态、100在途/20并发积压240每分钟及缓存条件区别。
- AIOps 与证据：作者复评通过。告警落库→查询脱敏→候选分析→独立校验→人工→受控执行及GitHub证据。

**验证边界**

- executed：Python3.14.5执行两份离线课堂、六类坏合同、五类坏状态和十类向量；SDK3.29.0/httpx2模拟传输检查严格JSON模式与解析。；限制：MockTransport固定假密钥，无网络/模型/费用；不是语义质量或生产API验收。
- reasoned：全文审查及官方Responses流式、结构输出、函数调用、gpt-5.5模型页核对；并发/积压/词元复算。；限制：原模型示例不保证账户许可，价格/区域/配额另核对。
- unrun：真实API、模型事实评估、流网络中断、工具执行和生产队列。；限制：未获取凭据、发起付费请求或连接生产。

第二位审校者：foundation-frontend；日期：2026-10-12。

- 1896行原文及新增运行门禁逐段全文复核。独立核对官方GPT-5.5、Structured Outputs及数据控制页，保留既有型号不冒充最新；responses.parse/text_format、拒绝/未完成分支、store=False不代表零留存与来源存在不证明支持因果的边界符合。交叉发现项目短路线漏环境失败门禁，作者已改专用venv解释器、逐次失败停止与环境/密钥不覆盖，返修已重读。
- 实际重跑两份原文离线脚本、合同坏类型/空引用/越权、终态坏输入和十类向量案例，全部通过；OpenAI3.29.0/httpx2 2.13.1/Python3.14.5通过MockTransport检查store/output上限/严格schema与Pydantic解析，固定假密钥且无网络。模拟传输仅验证SDK请求构造和解析，不证明模型遵循或真实API接受所有参数。
- 五关传输/协议/结构/业务验收、不同向量空间、合法JSON错误因果、5每秒×20秒需100在途而并发20仅1每秒净积压240每分钟、120万/18万词元及20%完全不调用缓存为96万/14.4万复算成立。工具call_id不当业务幂等，动作状态未知先查询，缓存隔离租户和版本；真实API权限/费用/限额/留存/时延与模型质量均未运行。

### 机器学习

[打开课程](./data-ai/machine-learning.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：新建目录/环境未防覆盖，激活失败后可能调用错误Python；模型概率第2列假设未解释。
- 初评：示例满分未明确测试集规模与概率校准界限；恢复梯度实验缺断言。
- 初评：已有自测缺分层可判定五关。
- 修订：补新目录/明确虚拟环境解释器、安装失败停止和版本证据；显式标签顺序及事故类定位。
- 修订：区分160/112/48及36/12样本、合成满分与真实概率，补恢复断言。
- 修订：新增梯度手算、分母/阈值预测、泄漏、多低基率设计与口述通关。

**八项正文证据**

- 前置与路线：作者复评通过。“安装与启动”给个人新目录、明确venv解释器与文件准备；无GPU依赖。
- 机制与状态：作者复评通过。“机制精讲：先不用框架，亲手理解模型为什么会改变”“泛化精讲：模型为什么在历史上优秀，在明天失败”解释梯度与数据时间边界。
- 基础实验：作者复评通过。“入门实验”“预测函数、参数、损失、梯度、学习率”分别给完整分类和无依赖手算程序。
- 故障实验：作者复评通过。“可回收故障实验：发现偷偷混入的答案”及梯度发散提供检测、恢复和清理。
- 生产取舍：作者复评通过。“从实验到生产的连续设计题”“模型发布物也是需要防护的软件”覆盖特征状态、预算、安全与版本回退。
- 递进面试：作者复评通过。“面试连续追问：把选择讲成证据”“三分钟完整回答示范”解释简单基线、漂移与数据诊断。
- 独立通关：作者复评通过。“独立通关：不靠满分截图证明模型有效”有第一步1.9/4.6、TP/FP/FN、8.26%低基率与回退判据。
- AIOps 与证据：作者复评通过。“在 AIOps 中的作用”及连续设计题从指标/标签到候选、反馈、规则兜底与受控动作。

**验证边界**

- syntax：3个Python围栏AST检查通过；核对scikit-learn官方常见陷阱。；限制：本机两套Python均无scikit-learn，分类/泄漏框架实验未执行；不以文中预期满分作为运行成绩。
- executed：实际执行无依赖梯度程序，正常下降、weight≈2、0.2发散及恢复断言通过。；限制：仅单样本课堂数学实验，不是生产训练、校准或模型上线。

第二位审校者：data-observability；日期：2026-10-12。

- 全文828行独立阅读：Python新目录/独立解释器、合成160行分类及标准库单样本梯度实验齐全；预期满分非验收门槛
- 学习率发散与标签泄漏两种故障有恢复、反证与清理；时间/事故拆分、概率校准/成熟标签、单位契约与pickle加载安全明确
- 独立五题的TP/FP/FN与低基率分母、阈值集合单调不保证精确率单调、每班预算/影子发布/回滚合理；本轮未运行第三方模型

### MongoDB 技术栈深讲

[打开课程](./data-ai/mongodb.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：Compose 文件/初始化目录/资源预算和失败就绪检查在末尾才解释，首跑隐藏前置
- 初评：首轮计数未确认空集合，复制集初始化缺逐成员就绪门禁
- 初评：停主后只读取旧记录并恢复旧成员，未在降级副本条件验新写；eventId无唯一约束
- 初评：缺类型变化/仲裁者多数确认/Oplog窗口独立考核
- 修订：将文件位置/平台/资源/冲突检查前移，首轮确认数据库和空计数
- 修订：补复制集ping和initiate门禁，确认主失败不停止节点
- 修订：固定_id标识，说明未知写结果；旧成员停止期间用完整连接串验证新majority写，再恢复冗余
- 修订：加入五项独立通关与精确清理判据

**八项正文证据**

- 前置与路线：作者复评通过。“单节点学习环境”“第一步：启动并连接”明确目录/两文件/DockerLinux/资源、名称卷端口与提示符门禁；复制集独立项目。
- 机制与状态：作者复评通过。“单次写入路径”“单次读取路径”“单文档竞争之后，还要问执行发生了几次”区分写关注、日志、读路由、事务及外部动作。
- 基础实验：作者复评通过。“基础实验：CRUD、验证、TTL、索引与 explain”完整用户验证器/合法两文档/非法类型/索引/计数；先确认空课堂集合。
- 故障实验：作者复评通过。“故障注入实验：停止 Primary 并观察重新选举”以实际主身份停止，旧记录/新majority写/三成员恢复分别验收，限定项目卷清理。
- 生产取舍：作者复评通过。“容量与性能”“备份与灾备”“升级、FCV 与回滚”覆盖窗口、InitialSync、故障域、恢复和二进制/FCV不可混同。
- 递进面试：作者复评通过。“面试题与递进追问”“独立通关：匹配、确认、可见与执行分开验收”要求仲裁票/数据确认、未知写、事务回调及版本回退边界。
- 独立通关：作者复评通过。独立通关给新集合条件更新、日期类型改变、真实停主多证据、64GB窗口与恢复令牌口述判据。
- AIOps 与证据：作者复评通过。“在 AIOps 中的作用”“事故场景：Primary 正常，但接口 p99 从 40ms 升到 4s”连接变更流、Trace/扫描/缓存/复制及灰度。

**验证边界**

- reasoned：逐篇全文审读1288行，复核停主→验新写→恢复顺序、固定_id未知结果及64GB/20MB=3200秒容量。；限制：未运行 MongoDB、Compose、复制选举或Schema/TTL；固定历史标签和FCV实际支持以目标版本复测。

第二位审校者：cloud-automation；日期：2026-10-12。

- 全文独立复核：单节点认证初始化明确仅空数据卷生效，Date/TTL 背景删除不保证精确到点；三成员另用专属项目与容器 DNS，majority、读关注、oplog、PSA 及未知写结果分层准确。
- 基础插入/验证器/索引与 TTL 实验有精确验收；副本实验先识别实际主节点，停主前 majority 写、选新主后读旧数据与写新数据，恢复旧主与重选边界明确。
- 条件更新领取任务、并发竞争/版本、oplog 追赶和容量通关有可判答案；未实际运行 MongoDB/Compose，本结论为完整正文静态审校。

### MySQL / SQL

[打开课程](./data-ai/mysql-sql.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：推荐Windows用Compose却仍使用宿主mysql和Bash输入重定向，SQL文件内容来源/初始化/失败停止不完整
- 初评：事务开篇笼统保证全成全败，错误后继续COMMIT风险、状态条件和ROW_COUNT门槛不足
- 初评：慢日志GLOBAL与已有SESSION边界未说明，runbook成功率含非终态；故障表建议IFNOTEXISTS/drop或取消唯一约束易误导
- 修订：补完整Windows容器内客户端导入、三SQL文件取材范围、Docker/Compose/同名卷/端口/空表门槛及每步退出码；基础与独立数据分开
- 修订：明确InnoDB错误回滚范围、任何错误ROLLBACK；更新需status+version与ROW_COUNT验证；说明DDL部分成功状态
- 修订：补慢日志会话/权限/旧值收回和成功率分母；修复故障表危险快捷建议；独立五项涵盖NULL/JOIN基数/锁/容量/回滚
- 修订：交叉反馈清理知识图与请求架构图完整术语中文，载入数据/批处理模式/慢查询日志/备份恢复及解析器/执行器/存储引擎不再机械拆词

**八项正文证据**

- 前置与路线：作者复评通过。安装和连接、入门实验：告警分析数据库：Windows/SQL提示符、真实目录文件、客户端位置、空卷初始化和失败停止明确
- 机制与状态：作者复评通过。一次更新从连接到磁盘，经过哪些决定、MVCC、锁定读和长事务的真实边界：提交未知、三类日志、索引/锁/快照和DDL隐式提交
- 基础实验：作者复评通过。第一个AIOps数据库实验、把基础课堂跑成可核对的账本：四告警/两发布预期、时间窗口与聚合口径、文件导入和精确清理
- 故障实验：作者复评通过。双会话故障课堂：看见锁等待，而不是猜数据库死了：3秒会话超时、乙ROLLBACK/甲COMMIT、新事务与最终两行、关闭会话收回
- 生产取舍：作者复评通过。复制、高可用和备份分别解决什么问题、容量与安全：旧主/副本/备份边界、刷盘恢复、Schema兼容；独立题四1.08TB与450连接预算
- 递进面试：作者复评通过。三分钟与递进面试答案、独立任务五：小表全扫、锁范围、DDL回滚、读副本领取等反例与设计取舍
- 独立通关：作者复评通过。独立通关：查询口径、事务范围和恢复结果独立证明：4行3恢复、LEFT JOIN6行/4执行/4告警、新锁值22、容量与5个口述边界均有答案
- AIOps 与证据：作者复评通过。AIOps数据建模、AIOps常用SQL、事故与生产设计课堂：告警/事故/执行/反馈事实分工，关联不宣称因果，终态分母与模型只读取证据

**验证边界**

- syntax：PowerShell Parser解析本篇2个PowerShell代码块通过；同时复查ActiveMQ/Redis代码块；git diff --check通过；限制：只验证宿主语法，不执行容器shell/MySQL，不证明依赖就绪
- reasoned：全文逐段核对查询口径与五项独立判据：JOIN6/4/4，1.08TB，30*15=450连接；官方8.4手册核对客户端错误与long_query_time会话边界；限制：没有真实执行计划/锁/备份恢复结果
- unrun：MySQL8.4.6导入、事务/锁实验、复制与备份恢复；限制：本轮未启动数据库，示例预期需要读者运行验证

第二位审校者：cloud-automation；日期：2026-10-12。

- 全文独立复核：PowerShell宿主与容器内SQL入口分清、独立项目与空卷初始化保护、精确DDL/数据/预期计数、查询时间窗及JOIN放大解释完整；双会话锁等待、回滚、重试和清理形成可复现闭环。
- 机制层区分MVCC一致性读与当前锁定读、RR首次快照、语句错误与事务回滚、DDL隐式提交、EXPLAIN估算与ANALYZE实际执行；redo/undo/binlog、未知提交、复制故障转移栅栏及PITR恢复后新写入对账边界明确。
- 通关要求NULL/外连接证据、锁竞争最终值、容量和连接预算、生产取舍口述；知识图中load/retrieve data、batch mode、slow query log、backup and recovery及parser/optimizer/executor/storage engine API的中文解释缺口已退回修复并复核。未把静态检查当MySQL运行验收。

### Ollama 技术栈深讲

[打开课程](./data-ai/ollama.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：PowerShell默认大小写不敏感，使JSON字段与枚举合同可能误接受；done未区分正常与截断。
- 初评：性能缺字段/零时长自动变0，存在性输出MODEL_READY误把磁盘制品当就绪；缺独立迁移评测。
- 修订：补分层准备入口及下载/原生创建失败停止；JSON检查改大小写敏感并校验正常结束。
- 修订：性能函数拒绝缺失/非有限/负数/布尔，零时长不可计算；存在性改MODEL_INSTALLED并要求继续推理/质量验收。
- 修订：新增KV/N+1/流错误等五道独立通关、合成验证及实际推理未运行边界。

**八项正文证据**

- 前置与路线：作者复评通过。实验起步与原生→模型→容量路线，不需Docker/K8s；CLI/服务版本及独立目录/模型引用重名保护。
- 机制与状态：作者复评通过。磁盘Tag/Manifest/Blob、易失Runner/KV/客户端历史及调度/Prefill/Decode内部路径清楚，Cloud出域分开。
- 基础实验：作者复评通过。固定小模型Modelfile/API与结构/运行态/性能验收，明确未知字段、正常结束、回收对象与失败停步。
- 故障实验：作者复评通过。不存在tag只改引用不删数据，404取证与恢复生成；坏结构/截断/缺性能数据由合成检查器可复验。
- 生产取舍：作者复评通过。容量公式适用边界、共享服务认证/限流/隔离、模型制品备份、客户端流式契约与灰度回退具备反例。
- 递进面试：作者复评通过。10组定义→机制→故障/取舍追问及50万/天设计、升级流失败和显存超时事故有证据链。
- 独立通关：作者复评通过。五关专属变化含大小写/截断、2GiB→8GiB KV、300/分钟N+1需4副本，CPU/GPU实测与纸面分离。
- AIOps 与证据：作者复评通过。告警结构化、日志摘要、RAG与受控工具的模型层边界；指标无敏感/高基数prompt，GitHub清单可追版本。

**验证边界**

- executed：正文PowerShell结构验证器10种合成响应、性能验证器6种合成响应通过，含CRITICAL/Service/截断/坏数组与缺字段/NaN/零时长。；限制：不连接Ollama、不下载模型、不证明硬件与真实推理或模型语义质量。
- reasoned：全文审阅，官方Chat/Tags/Structured Outputs接口复核，KV2GiB/8GiB、300/分钟N+1四副本复算。；限制：当前持续更新接口不替代固定0.32.6的实现回归；没有检查所有推理后端。
- unrun：原生安装、Compose运行、模型加载/推理/404和GPU实验。；限制：本机无本课Ollama服务，API预期不是实测。

第二位审校者：foundation-frontend；日期：2026-10-12。

- 2364行全文复核。独立核对官方0.32.6 Release、Authentication、API Errors，固定提交c82ebbd与持续更新文档分开，流中错误保持初始状态码、本地API无认证和Cloud可经localhost转发边界符合来源；没有为教程自动迁移新模型。
- 实际运行正文PowerShell验证器的10种合成结构与6种性能输入，正常接受、大小写/缺额外字段/数组/截断/未完成/非法JSON及坏数值拒绝，零时长保持不可计算；KV题2GiB→8GiB、N+1四副本剩360复算成立。模型存在性不叫就绪、keep_alive不作会话、tag/digest/许可与运行态分开。
- 原生/容器路径及专用模型引用重名停止，404只改引用不删除模型，清理保留共享基础模型；生产网关/多副本/Cloud/工具权限和升级流式契约讲清。无真实Ollama或GPU环境，拉取/加载/推理/404/性能/模型质量及外部网络边界未实跑，合成验证器不能替代这些验收。

### Oracle Database 深讲

[打开课程](./data-ai/oracle.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：完整 SQL 课堂未给客户端连接及自动提交的实际操作，未提供查询表名冲突的方法
- 初评：Data Guard 延迟查询缺源端数据到达时间，旧零值和主库零行易造成假健康
- 初评：缺独立输入、普通读/锁定读变更、净追赶容量及许可边界考核
- 修订：补 SQL*Plus 无密码命令、PDB 服务名、双方关闭自动提交及 user_tables 对象归属检查
- 修订：根据 Oracle 官方字段说明加入 datum_time，明确计算时间不等于采集新鲜度、主库零行不等于零延迟
- 修订：新增五项独立通关：四行筛选、普通读与行锁、陈旧监控反证、6小时恢复基线和许可/恢复追问

**八项正文证据**

- 前置与路线：作者复评通过。“完整 SQL 课堂：从空表到可清理的锁冲突”补 SQL*Plus 连接、密码提示、同 PDB 用户、自动提交和自有表检查；无授权环境不安装生产 RAC。
- 机制与状态：作者复评通过。“核心概念”“RAC 深讲”“OGG 深讲”沿实例/文件、日志/事务、共享存储与逻辑复制解释各层职责。
- 基础实验：作者复评通过。“完整 SQL 课堂：从空表到可清理的锁冲突”完整建表、固定时间插入提交、分组二行及精确表清理，不将最初空表片段当完整实验。
- 故障实验：作者复评通过。完整 SQL 课堂给 A/B 锁定读 WAIT3、双方回滚、恢复 OPEN 与清理；新通关强调陈旧 lag 为合成证据非实际断链。
- 生产取舍：作者复评通过。“Oracle 高可用全景：先判断故障发生在哪一层”“RAC + OGG：怎么组合才是真的高可用”“把生产设计题补上容量与回退的具体问题”涵盖故障层、许可、空间、恢复链和不可直接降级。
- 递进面试：作者复评通过。“三分钟答案示范与进一步追问”“独立通关：读得到、同步了、能恢复分别举证”给 Oracle 快照、共享存储、未知提交、映射/备份的追问判据。
- 独立通关：作者复评通过。独立通关要求四行筛选、普通读/锁定读预测、锁/陈旧指标反证、144000MB净追赶和多层 HA 设计，答案可复算。
- AIOps 与证据：作者复评通过。“在 AIOps 中的位置”“Data Guard 与 Active Data Guard”新增 datum_time 新鲜度与主库零行边界，关联业务、等待、资源及变更。

**验证边界**

- reasoned：全文审读 1035 行；核对 Oracle 官方 V$DATAGUARD_STATS 的 DATUM_TIME/主库零行说明、默认 Read Committed 和语句级一致性；复算 redo2小时积压及4小时净追赶。；限制：未连接 Oracle、RAC、OGG 或 Data Guard；SQL/锁/许可/升级仍需授权隔离环境和现场版本核验。

第二位审校者：cloud-automation；日期：2026-10-12。

- 全文审阅：实例/数据库/PDB/表空间、redo/undo、RAC共享存储与Data Guard/OGG/应用连续性/备份分层、许可与现场版本边界完整；授权隔离schema完整两行SQL/WAIT3行锁/回滚原值和DDL清理，旧空表片段明确不作完整实验。五项独立任务含普通读与锁定读差异、datum_time陈旧反例、2小时故障加4小时净追赶；没有把状态和历史备份成功当业务恢复。

### pandas

[打开课程](./data-ai/pandas.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：独立日报只parse_dates无严格Schema/主键/枚举/时间边界，异常输入可能生成错误报告。
- 初评：报告先打开再to_markdown，缺tabulate会留下半份文件；CSV时区和精确验收数未说明。
- 初评：缺独立分母、条件变化与拒绝覆盖通关。
- 修订：日报补键/ID/枚举/时间/同刻发布校验，上海时间显式转UTC，守恒断言。
- 修订：先完成Markdown渲染再独占创建，说明磁盘写入仍非原子；补个人环境/文件步骤和四行期望数。
- 修订：新增五关，覆盖未来发布、空键、重复维表、坏日期、重复ID、恢复逆序、加权均值和版本发布。
- 修订：交叉返修：日报学习点对应read_csv原始字段与parse_local严格解析/上海时区/UTC；rolling说明包含当前桶、前两行缺失及预测不得混入未完成当前桶。

**八项正文证据**

- 前置与路线：作者复评通过。“安装和环境”“AIOps 入门实验：告警日报”说明新目录/venv、四文件、平台解释器及无数据库前提。
- 机制与状态：作者复评通过。“Index 课堂：pandas 会按标签对齐，不只是按位置相加”“写时复制是对象语义，不是数据库事务”解释标签/对象与状态边界。
- 基础实验：作者复评通过。“AIOps 入门实验：告警日报”完整CSV/程序与2/1/1、15/28/5、编号2、关联1/3验收。
- 故障实验：作者复评通过。“关联课堂：一次错误合并可以把告警翻十倍”“空关联键不是‘不可能匹配’”“第三站：基础实验补课——别把未来发布关联给过去告警”有断言及收回。
- 生产取舍：作者复评通过。“第五站：单机内存里的容量与恢复”“从一张表到可信批任务还差什么”覆盖分块、唯一发布、失败保留、权限与依赖回退。
- 递进面试：作者复评通过。“面试黑板题：日报变好，值班同学却更忙”“三分钟答案：如何证明这份告警日报值得信任”有分母/键基数/任务取舍答案。
- 独立通关：作者复评通过。“独立通关：行数、时间和统计分母都要守恒”含输入变更预测、三类拒绝、现存输出保护与整体19而非15均值判据。
- AIOps 与证据：作者复评通过。“pandas 在 AIOps 链路中的位置”及日报关联把指标/告警/变更转成有时间边界特征，禁止相关性直接当根因。

**验证边界**

- syntax：77个Python围栏AST检查通过；核对pandas官方read_csv和CoW指南。；限制：语法不证明所有片段能脱离上下文运行；未连SQL/Parquet。
- executed：bundled pandas3.0.1/NumPy2.3.5用StringIO注入文中CSV执行完整日报到渲染前，验证三服务统计、未恢复2、关联1/3；坏日期/重复ID/逆序恢复3例全部拒绝；改发布09:15只关联3；重复维表/未来/空键三个完整内存实验通过。；限制：bundled环境无tabulate，未执行to_markdown和真实report.md文件创建；未声称独占创建/磁盘失败/定时生产发布已实测。

第二位审校者：data-observability；日期：2026-10-12。

- 全文1546行审读：行粒度/标签对齐/size-count/多对多空键与SQL差异/CoW对象身份非事务、加权均值与不可平均分位数机制准确
- 主日报严格键/枚举/上海本地时间转UTC/时间方向/重复发布/行数守恒/渲染后独占写，重复维表/未来nearest/空键三故障闭环；交叉返修read_csv保留原时间且parse_local严格解析、rolling包含当前桶/最初两行缺失与预测排除未完成桶说明，已核对修后正文
- 独立4行金数/发布改未来/反例输入输出不覆盖/分块均值19/归属清理与原始证据保留明确；本轮未执行pandas、SQL、Parquet或生产定时报表

### PostgreSQL 深讲

[打开课程](./data-ai/postgresql.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：前面Compose骨架与后面docker run占同端口，三表目标无完整SQL且可能混跑
- 初评：一次性容器缺冲突检查和创建失败门禁，可能进入未知同名容器
- 初评：锁超时未RESET，自开事务失败分支未交代
- 初评：重复MVCC插同一无约束ID可能改变计数却沿用旧期望
- 初评：缺不同业务键、快照建立点和连接预算独立验证
- 修订：明确单一首次路线，Compose和三表转为后续作品集规划
- 修订：补Linux容器/资源/基础词、名称端口保护和退出码门禁
- 修订：锁故障解释失败事务先回滚、RESET lock_timeout收回
- 修订：复做另用100002并记录实际基线
- 修订：五通关：两键四登记、第一次快照时点、新键锁等待、450连接预算、未知提交/租约/WAL口述

**八项正文证据**

- 前置与路线：作者复评通过。“入门实验”“基础带练：从空数据库到一条可追溯告警”选一套PowerShell路线、Linux容器/资源、名称端口检查、psql容器提供、SQL提示符切换。
- 机制与状态：作者复评通过。“MVCC 不是把每行复制很多份那么简单”“WAL、检查点、复制与备份各管哪件事”“领取任务之后，责任没有随事务一起结束”分开快照、提交、清理、外部副作用。
- 基础实验：作者复评通过。基础带练含完整表/插入/冲突/条件更新，索引十万行与快照实验有输入、计划、计数及限定容器清理。
- 故障实验：作者复评通过。“故障带练：CPU 很低，为什么领取按钮仍然超时”两会话受控锁等待、C观察blockers、主动回滚复测、RESET及失败事务分支。
- 生产取舍：作者复评通过。“生产设计课堂：一万次请求如何避免变成一万个连接”“恢复课堂：备份文件存在以后，还要回答三道题”涵盖连接/内存乘法、fencing、复制延迟、PITR日志链和主版本回退。
- 递进面试：作者复评通过。“面试带练：从 30 秒到连续追问”“三分钟完整回答示范”给定义、路径、锁/vacuum/副本/外部动作的参考答案与反例。
- 独立通关：作者复评通过。“独立通关：超时、零行、旧快照都不是同一种失败”五题改变键、快照建立位置、锁对象和连接副本数，紧邻判据与回看章节。
- AIOps 与证据：作者复评通过。“AIOps 课堂：把数据库证据接入事件链”关联延迟/连接/锁/WAL/发布；学习证据保留合成SQL和查询指纹不泄露参数。

**验证边界**

- reasoned：全文审读651行；复评双路线端口冲突、快照建立时点、失败事务与450连接预算。；限制：未启动PostgreSQL，锁状态、执行计划、MVCC、复制、备份恢复与固定镜像兼容待实测。

第二位审校者：cloud-automation；日期：2026-10-12。

- 全文审阅：事件与事故/外部执行事实分工、MVCC首快照/隔离与写偏差、条件更新/唯一键/锁/租约、WAL/同步复制/备份及旧主隔离完整；独占容器、双会话有限锁超时/恢复、索引对照和快照改变条件明确。五项独立任务含重复事件、首次快照、40×15连接超额与未知提交边界，不把本地SQL模型当外部恰好一次。

### PyTorch 技术栈深讲

[打开课程](./data-ai/pytorch.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：评估阶段未拒绝空数据、NaN、标签形状与标签范围
- 初评：固定检查点临时名可能覆盖他人未完成文件
- 初评：故障程序未核对元数据特征合同，旧运行记录易误认本次验证
- 修订：评估增加输入/logits/loss/空集合同，生成数量拒绝无效类型
- 修订：独占临时检查点、同步后加载再原子替换，仅清理本次临时文件
- 修订：元数据特征单位校验、安装失败停步、归档清理与独立五关
- 修订：交叉返修：train后先验退出码再读artifacts；compile调试统一环境及新目录，明确eager不会因日志变量自动编译；FSDP2通信图加技术语境中文

**八项正文证据**

- 前置与路线：作者复评通过。安装与环境验证：隔离目录、完整UTF-8脚本与固定历史版本
- 机制与状态：作者复评通过。核心概念三：Autograd 动态计算图、核心概念七：训练模式、评估模式与梯度上下文：梯度累计、eval与inference_mode分离
- 基础实验：作者复评通过。基础实验：训练一个 AIOps 故障风险分类器：形状有限值、保存重载门禁
- 故障实验：作者复评通过。故障注入实验：NaN 在进入模型前被拒绝：合同、拒绝和可信回放
- 生产取舍：作者复评通过。保存过程也会出现半成品：独占临时文件与单发布者、持久性边界
- 递进面试：作者复评通过。从实验到生产面试：状态恢复、通信挂起与输入数据证据
- 独立通关：作者复评通过。独立通关：梯度、评估和制品分别举证：五任务和数值判据
- AIOps 与证据：作者复评通过。基础实验：训练一个 AIOps 故障风险分类器、AIOps 生产用例：合成高分不代表真实生产质量，失效回退规则/人工

**验证边界**

- syntax：交叉返修后重新解析32段Python AST、8段PowerShell围栏全部通过；限制：未安装PyTorch；AST不验证Tensor API运行行为
- reasoned：逐篇全文审读评估NaN比较、空集、形状及检查点清理路径；限制：2026-08-13旧CPU运行证据保留历史标签，不冒充当前修订重跑
- unrun：当前修订的训练/评估/故障注入/检查点重载；限制：无Torch依赖和GPU环境，须由读者按本课隔离环境实际执行

第二位审校者：cloud-automation；日期：2026-10-12。

- 完整阅读全文；复核张量视图/复制、梯度累加、Module 参数与缓冲区、BCEWithLogitsLoss、eval 与 no_grad、DataLoader 和 CPU/CUDA 依赖的机制，不把执行模式和求导控制混为一谈。
- 逐项检查训练/预测/NaN 故障注入以及 best state 的复制、有限输入输出、加载固定探针和旧制品保护；返修后训练立即检查退出码，compile 调试显式使用本课环境且说明默认 eager 实验不会自动产生编译行为。
- 核对 DDP 的 DistributedSampler/set_epoch 与全局指标边界、FSDP2 汇集分片参数及归约分散梯度、Checkpoint 和完整训练恢复、原子替换与断电/NFS/多写者边界；独立通关的梯度、批量与 16GB 状态容量题具有可计算判据。
- 文章明确区分历史真实输出、本轮静态修订和未运行环境；本次未执行 Torch 训练、torch.compile、GPU 或分布式实验，生产质量与执行权限仍需分别验收。

### RabbitMQ 深讲

[打开课程](./data-ai/rabbitmq.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：Inbox只按message_id跳过，无法区分同键不同业务内容；发布超时前未打印事件键，默认UUID难以安全沿用
- 初评：基础验收只有队列归零/日志，未验证SQLite行；崩溃发生业务前，未实际设计业务提交后Ack前的实验
- 初评：虚拟环境依赖激活，服务healthy与正常应用/资源告警界限不足；缺少独立技术通关判据
- 修订：Inbox增加规范JSON本地SHA256并拒绝业务键内容冲突；生产者发布前输出attempt标识，新增routing-key条件实验参数
- 修订：基础加入只读SQLite行验证；worker新增仅课堂crash-after-commit退出点和恢复重投/工单仍一行步骤
- 修订：补显式虚拟环境解释器、依赖失败停止与check_running/check_local_alarms；五项独立题涵盖不可路由、提交窗口、队列成员多数派、容量与回切

**八项正文证据**

- 前置与路线：作者复评通过。安装与启动、基础实验1：独占目录/项目/卷、端口、两分钟就绪与应用告警核验，Python/Pika显式解释器说明
- 机制与状态：作者复评通过。消息从发布到确认的完整数据路径、RabbitMQ4.3的状态模型、可靠性语义：路由/confirm/ack/Khepri/队列成员不同边界，Inbox摘要比较与事务解释
- 基础实验：作者复评通过。基础实验：可靠告警队列：四完整文件、创建拓扑先后、手动ack/prefetch、SQLite真实行校验与错误循环
- 故障实验：作者复评通过。故障注入实验：崩溃、重投与死信、补充故障点：本地业务提交后、确认前：提交前后两窗口、退出码2、原键重投、幂等行数、毒消息与精确项目清理
- 生产取舍：作者复评通过。生产架构设计、升级与回滚、备份与灾备：多数派成员/资源/旧主、死信保证/策略、蓝绿新站独有消息和Shovel竞争边界；独立题四13.73GiB预算
- 递进面试：作者复评通过。高频问题与追问、生产系统设计题、独立任务五：confirm/ack/mandatory、队列类型、4.3重投计数、降级限制均有答案
- 独立通关：作者复评通过。独立通关：路由、接管、事务与多数派分别过关：甲乙甲3发2工单、dev不可路由/同键冲突、提交后崩溃、5节点3成员失2、30分钟追赶与口述判据
- AIOps 与证据：作者复评通过。AIOps应用模式、事故推演、可观测性：消息年龄、下游连接/容量与发布关联，自动化审批/幂等/回滚，模型消息用对象引用

**验证边界**

- executed：提取实际worker.py回调，在内存SQLite+记录动作的通道替身运行6案例：新事件ack、合法重复ack、同键不同内容reject、坏JSON reject、bool schema reject、数据库缺表nack+stop且Inbox回滚，全部断言通过；限制：离线替身只证明Python/SQLite分支，不连接RabbitMQ，不证明代理确认、死信、重投或HA
- syntax：AST解析8个Python代码块通过；PowerShell Parser检查所有PowerShell块通过；git diff --check通过；限制：不执行真实客户端/容器/网络
- reasoned：全文重审状态与清理；复算180万积压、30分钟净追赶、三副本/.75约13.73GiB；队列3成员多数派2；限制：假设落盘大小含开销，仍需日志/故障余量实测
- unrun：RabbitMQ4.3.4实际收发、崩溃重投、DLX、资源告警、队列失去多数派和升级；限制：未启动真实Broker，本文保留未运行边界

第二位审校者：cloud-automation；日期：2026-10-12。

- 全文独立复核：固定RabbitMQ/Pika历史基线、Compose健康与本地告警前置、生产者confirm/mandatory错误停止、消费者SQLite事务Inbox、Poison DLQ与进程崩溃前后两种故障均有精确步骤、预期状态及隔离清理；不声称未运行broker实验已通过。
- 机制准确区分Khepri元数据与消息副本、Classic/Quorum/Stream状态、publisher confirm与consumer ack、已确认但未路由、requeue重复与业务幂等；至少一次DLX需策略和溢出条件，不把默认DLX或三个节点等同数据可靠三副本。
- 生产和面试层含多数派/非成员故障、投递计数版本差异、幂等冲突内容指纹、容量及追赶时间；官方upgrade矩阵独立核对3.13->4.2->4.3受版本条件约束，非任意跨代/原地降级。

### RAG

[打开课程](./data-ai/rag.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：索引存在不代表构建完成，查询模型环境变量可与旧索引混用
- 初评：向量响应没有校验位置、维度/有限值，评估来源路径与示例不一致
- 初评：零基础付费/密钥/文件步骤与独立验收不足
- 修订：入库写build_ready与模型合同，查询前拒绝不匹配/未完成
- 修订：embedding响应按index核对一一对应与数值维度，修正评估来源
- 修订：补独立目录、API费用边界及五道证据/容量/权限任务
- 修订：交叉返修：速查及前文运行入口统一专用环境，创建/安装/入库/检索检查/问答逐次失败停止；改受控.env而非密钥进历史，故障表说明提示声明不是硬安全防护

**八项正文证据**

- 前置与路线：作者复评通过。入门实验：Runbook RAG、从零补课：一次完整实验究竟要证明什么：文件/环境/API外发边界
- 机制与状态：作者复评通过。两条主链路、索引不是文件夹的自动镜像：向量模型与索引成对状态
- 基础实验：作者复评通过。基础实验与故障注入：先证明证据门禁，再连接大模型：标准库完整可复算
- 故障实验：作者复评通过。基础实验与故障注入：先证明证据门禁，再连接大模型：缺唯一授权证据拒答、恢复
- 生产取舍：作者复评通过。生产容量与故障预算课堂：容量、排队、只读降级及权限撤销
- 递进面试：作者复评通过。三分钟回答与递进追问：覆盖到生成分层，冲突来源与版本
- 独立通关：作者复评通过。独立通关：从证据门禁到真实问答：五任务/召回与完整题覆盖答案
- AIOps 与证据：作者复评通过。RAG 在 AIOps 链路中的位置、RAG 与自动化：推荐资料不越权执行

**验证边界**

- syntax：交叉返修后12段Python AST与2段PowerShell围栏重新解析通过；限制：未调用API
- executed：标准库证据门禁正常/删除唯一授权资料/恢复全部通过；限制：非向量非生成模拟；Chroma/外部embedding/Responses未执行
- reasoned：全文审读索引生命周期与当前补充完成标记路径；限制：课堂单进程标记不承诺生产事务

第二位审校者：cloud-automation；日期：2026-10-12。

- 完整阅读全文；核对资料覆盖/解析入库/召回/上下文/生成的分层路径，服务过滤与真实授权、引用属于候选与主张受到支持、同维向量与同一语义空间、build_ready 课堂标记与生产版本切换均明确区分。
- 实际执行正文标准库授权证据门禁：正常返回 pool-v1，移除唯一授权片段后证据不足，恢复后重新命中；保留的其他团队相关资料不成为越权兜底。未调用外部向量或生成接口。
- 返修后创建环境、安装、ingest/inspect/ask 速查与早期入口统一为本课虚拟环境并失败停止；真实密钥改由受控 .env 编辑，不留终端历史示例；故障表明确提示资料不可信只是辅助，不能代替工具侧授权和参数校验。
- 核对五片段、模型合同/数量门禁、候选引用检查的代码路径，以及 6.144GB 原始向量、双版本容量、并发/延迟预算、权限撤销和回退不复活旧权限的设计题；独立通关区分离线门禁实跑、付费问答未跑与事实支持仍需验证。

### Redis

[打开课程](./data-ai/redis.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：Docker 路线仅人工检查同名容器，未设置容器与Redis内存双边界；Python实例没有虚拟环境完整入口和网络超时
- 初评：去重程序 process 与 Stream XACK 的措辞容易被误解成外部业务完成；宿主裸redis-cli隐藏依赖
- 初评：原独立练习没有判据，缺少事务运行时错误、pending确认与容量变更的独立检验
- 修订：补Docker可用/同名/端口/创建失败停止与1GiB容器、256MiB maxmemory/noeviction解释
- 修订：补Python3.11/3.12虚拟环境、显式解释器与2秒超时；明确登记资格不等于建单、XACK只是消费组确认；Stream补Docker命令替换和空基线
- 修订：新增五项独立通关，覆盖NX不续期、SET清TTL、事务WRONGTYPE非回滚、两消息PEL、复制缓冲/追赶、锁和缓存状态边界

**八项正文证据**

- 前置与路线：作者复评通过。老师先带你认路、安装和连接、AIOps入门实验：告警去重器：进程/端口、Docker与Python前置、路径和显式解释器均说明
- 机制与状态：作者复评通过。机制课堂：成功返回，到底完成了哪一步：RESP/慢日志、事务、TTL与淘汰、类型和SCAN；缓存一致性/恢复/锁课堂解释状态边界
- 基础实验：作者复评通过。基础实验：亲手证明过期和类型边界：自有键零基线、NX/TTL/WRONGTYPE、核对与精确DEL；Python和Stream基础路线补依赖边界
- 故障实验：作者复评通过。故障实验：消费者拿到事件后没有确认：模拟退出、PEL、XAUTOCLAIM、ACK/XLEN分离、幂等收回，明确不运行实际worker故障
- 生产取舍：作者复评通过。生产设计题：告警去重和摘要缓存能共用一套策略吗：不同淘汰策略、回源、ACL、恢复备份与回滚；独立题四补键/缓冲/净追赶计算
- 递进面试：作者复评通过。递进面试参考答案、独立任务五：定义到WAIT/锁/旧缓存/SCAN时间线追问，答案有证据限定
- 独立通关：作者复评通过。独立通关：键的状态不是业务的结果：90秒新键、运行时错误不回滚、两条PEL确认一条、1.024GB与3.6GB预算、五种边界口述判据
- AIOps 与证据：作者复评通过。Redis在AIOps链路中的位置、事故推理题：命中率没变，重复工单却增加：去重、缓存、事件、工单事实分工和自动化权限清楚

**验证边界**

- reasoned：全文重审并复算600000*512/.6*2=1024000000字节、复制20MB/s*180=3.6GB、净10MB/s追赶360秒；逐步推演NX/TTL/EXEC/PEL；限制：没有真实Redis输出，不替代容量实测
- syntax：检查PowerShell失败门槛、显式Python解释器与redis-cli/宿主shell输入区别；限制：未安装redis-py或启动容器；命令预期需实测
- unrun：实际Redis基础、Stream接管、复制/哨兵/Cluster、持久化恢复及压测；限制：本文本轮保持未运行声明，不把模型和预期当生产验收

第二位审校者：cloud-automation；日期：2026-10-12。

- 全文独立复核：安装前置、固定7.4历史基线、独立Compose与回环端口、内存限额和清理范围明确；基础TTL/类型实验及Streams pending重领故障闭环可追踪，不把未执行Redis服务实验写成成功。
- 机制与生产层准确区分TTL逻辑到期/回收/淘汰、单命令原子与业务事务、MULTI运行期错误不回滚、SCAN非快照、异步复制/WAIT非共识、锁随机值与下游fencing；缓存旧值回填和AOF多文件恢复边界清楚。
- 独立通关含失败NX不续期、SET清TTL、MULTI部分成功、PEL与XLEN不同、单副本内存及复制积压追赶计算；答案可通过输出、证据和机制反证，不只重复学习清单。

### scikit-learn

[打开课程](./data-ai/scikit-learn.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：CSV入口未拦截时间重复、非有限值、比例单位错误
- 初评：模型及复核表重跑可覆盖旧证据，学习环境与完整文件步骤有跳跃
- 初评：缺少独立状态/阈值/数据合同通关判据
- 修订：补独立环境与完整data_contract.py，训练检测复用严格读取
- 修订：模型目录独占创建、制品xb与复核CSV mode=x拒绝覆盖
- 修订：增加估计器状态、contamination与策略阈值的五关任务

**八项正文证据**

- 前置与路线：作者复评通过。安装：解释隔离环境、UTF-8文件与失败停步
- 机制与状态：作者复评通过。Estimator API、Pipeline、IsolationForest 深讲：解释fit状态和异常分数/阈值边界
- 基础实验：作者复评通过。AIOps 入门实验：指标异常检测器：完整读取、训练、检测与拒绝覆盖
- 故障实验：作者复评通过。第二轮精讲：从一个分数追问到上线决策：增加有限值/负延迟拒绝，保存失败证据而非填补冒充成功
- 生产取舍：作者复评通过。训练集、测试集和数据泄漏、模型保存和加载、独立通关：把估计器状态与业务策略分开：数据泄漏、模型可信来源与进程/线程内存预算
- 递进面试：作者复评通过。面试题、增量学习课堂：多次 fit 不等于逐批学习：状态、泛化、LOF与增量学习追问
- 独立通关：作者复评通过。独立通关：把估计器状态与业务策略分开：五道任务给答案判据
- AIOps 与证据：作者复评通过。AIOps 入门实验：指标异常检测器：结果进入人工复核而非自动归因

**验证边界**

- syntax：40段Python AST、1段PowerShell语法通过；限制：语法检查不证明估计器运行成功
- executed：bundled pandas 3.0.1/NumPy 2.3.5实际执行data_contract，正常CSV与5类坏输入通过判据；限制：内存CSV合成数据；scikit-learn未安装，未执行fit/joblib链路
- reasoned：逐篇全文审读，核对Pipeline泄漏和IsolationForest官方API；限制：无生产流量/发布实测

第二位审校者：data-observability；日期：2026-10-12。

- 全文1297行独立审读：fit/transform/predict状态、训练折内预处理与时间/事故分组泄漏、IsolationForest原始分数/offset/阈值非概率、LOF默认与novelty边界、fit/partial_fit/warm_start差异均有机制解释
- 八行合成数据明确仅同批离群检测与可信Pipeline持久化闭环；数据合同拒绝缺列/空表/空服务/重复时间/非有限值/单位范围，独占模型目录与输出表拒覆盖，恢复列顺序/单位故障不作生产修复
- 独立五题含阈值手算1与4条、score_samples-offset关系、四进程至少800MiB模型驻留及完整包回滚；本轮实际运行原文无依赖阈值实验得normal1/overflow4/recovered1，6个完整Python代码块AST通过；第一次AST管道中文编码失败后改UTF8 Base64输入通过，不把传输编码错误当文章语法错；未安装/运行scikit-learn模型、pandas或在线服务

### Apache Spark 深讲

[打开课程](./data-ai/spark.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：SQL 示例未给临时视图的创建上下文
- 初评：首轮 overwrite 缺少未知旧输出保护，后续复跑与首次检查混用容易误判
- 初评：课堂未开放 UI 或保存事件日志，必须明确计划证据不等于运行 UI 指标
- 初评：缺少盐桶均值、合法级别但坏时间等独立考题
- 修订：补临时视图注册、会话范围及 Action 说明
- 修订：首轮输出目录门禁、立即保存退出码并读取实际 JSON，解释后续仅重跑容器段及旧输出证据
- 修订：明确短批无 UI 现场，坏行故障比较上一轮校验值；加入五项独立通关与判据

**八项正文证据**

- 前置与路线：作者复评通过。“老师先带你认路”“准备数据”交代 Windows、Docker Linux、资源、专用目录和 Python 最小前置。
- 机制与状态：作者复评通过。“一次批作业的数据路径”“执行机制加深：从一个慢 Task 找到真正瓶颈”区分 Driver 数据协调、Action、Shuffle、AQE 和外部副作用。
- 基础实验：作者复评通过。“入门实验：Docker 运行 PySpark 聚合”给出完整 CSV/脚本/容器命令、退出门禁与真实 JSON 检查；明确未提供 UI 运行证据。
- 故障实验：作者复评通过。“故障注入实验：坏数据触发作业失败”比较退出码、坏行和旧输出，恢复单行并收回专用实验目录。
- 生产取舍：作者复评通过。“集群部署与高可用”“升级与回滚”“老师带你回答这道设计题”解释资源/状态/输出兼容及恢复追平。
- 递进面试：作者复评通过。“递进面试题”“独立通关：结果对，计算和发布也一定对吗”要求计划、容量、失败重算与幂等的逐层追问。
- 独立通关：作者复评通过。“独立通关：结果对，计算和发布也一定对吗”给独立输入变更、加权均值反例、坏时间故障、内存算式和明确答案。
- AIOps 与证据：作者复评通过。“可观测性与 AIOps”关联应用/尝试/批次与版本，自动重试和资源扩张有副作用及预算边界。

**验证边界**

- reasoned：全文审查，核对五行筛选结果、200/101 加权均值和执行器 6×(8+2)=60 GiB 推导。；限制：未运行 Spark 容器、Web UI 或流处理集群；文中命令为待读者执行的隔离课堂步骤。

第二位审校者：cloud-automation；日期：2026-10-12。

- 全文审阅：逻辑/物理计划与Action、Stage/Shuffle/AQE、三类内存/溢写/重算、外部副作用与Streaming水位/检查点合同完整；本地两个线程、输入质量门禁、旧输出不证本轮成功、坏时间非零及精确恢复明确。五项独立任务有5行3严重、加权均值1.9802反例和60GiB资源基线，UI/多节点及本轮未运行边界不夸大。

### Tencent TCE 数据库、缓存、消息与数据平台技术地图

[打开课程](./data-ai/tce-data-middleware.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：仓库脚本的运行目录和内存数据结构对零基础读者仍是隐藏前置
- 初评：SQLite 示例把所有唯一冲突归类 duplicate，虽正文提醒但可运行示例仍可能吞业务冲突
- 初评：缺少相同事件不同负载、共同恢复预算和协调恢复的独立判据
- 修订：明确 Python 版本/仓库位置和字典、队列、集合不是真服务
- 修订：收窄事件冲突捕获，保存工单关联；业务键冲突回滚并分类，同事件不同工单抛契约错误
- 修订：补五项独立通关并执行仓库两模式、文中 SQLite/版本顺序实验及负向变异

**八项正文证据**

- 前置与路线：作者复评通过。“基础实验：数据库、缓存、消息和索引的职责”明确 Python 3.10、PowerShell 根目录、脚本路径与三种内存结构。
- 机制与状态：作者复评通过。“核心数据流：事务之后怎样通知其他系统”“再做一次可复算实验：重复与乱序是两道题”区分 Outbox/Inbox、去重、状态快照版本和增量事件。
- 基础实验：作者复评通过。“基础实验：数据库、缓存、消息和索引的职责”“增强带练：用 SQLite 看到事务内幂等边界”给完整可执行标准库教学与预期；两者均已本地运行。
- 故障实验：作者复评通过。“故障注入实验：重复消息”及 SQLite 中途异常回滚、业务冲突断言和版本保护移除故障有证据与恢复；无服务或持久数据。
- 生产取舍：作者复评通过。“联动容量课堂：扩一个组件，可能压垮另一个”“一次协调恢复的桌面演练”“升级与回滚”覆盖共同下游、权威恢复点和兼容迁移。
- 递进面试：作者复评通过。“面试架构题的回答升级”“把厂商能力核验变成具体交付问题”给兼容、最终一致时延、产品身份和职责追问。
- 独立通关：作者复评通过。“独立通关：重复不等于乱序，冲突不等于成功”要求正常/故障复现、不同事件与版本预测、冲突反证、3500/3000预算和协调恢复。
- AIOps 与证据：作者复评通过。“AIOps 观测与自动化边界”按事件/请求/变更贯通拓扑与断点，禁止自动删订阅清缓存切库。

**验证边界**

- executed：运行仓库 lab.py 正常及 --fault，得到 PASS/handled=1/duplicates=0或1/backlog=0；从文章直接提取两份完整标准库代码运行，SQLite 输出 retry,0,handled,duplicate,1，版本/删除断言通过。；限制：均为单进程内存教学，不是任何 TCE、SQLite 文件持久化、网络或分布式提交实测。
- executed：在内存提取代码追加同 event 不同 ticket 输入，确认 ValueError；移除版本比较后实际 AssertionError/exit=1，故障必现。；限制：未改仓库实验文件，未模拟真实并发、ACK 或进程崩溃恢复。
- reasoned：全文审阅，复算 3500>3000 QPS 与180万/(2000-1500)=3600秒。；限制：模型输入是假设值，不代表厂商容量或现场参数。

第二位审校者：cloud-automation；日期：2026-10-12。

- 全文审阅并读取仓库lab.py：BOM/授权/版本证据、字段权威/派生职责、Outbox/Inbox/CDC与重复/乱序/删除、共同恢复预算和契约升级完整；本地字典模型、SQLite事务内失败与同键冲突、版本删除反例均明确无网络/持久化边界。五项独立任务含3500>3000及3600秒净追赶，不宣称现场产品存在或跨组件恰好一次。

### Tencent TDSQL-C MySQL 技术栈深讲

[打开课程](./data-ai/tdsql-mysql.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：Docker/SQL 提示符和仓库路径等隐藏前置不足；失败后继续导入风险
- 初评：锁等待修复缺少完整 SQL，后续乐观版本例复用了已 CLOSED 的工单且没有状态约束
- 初评：清理小节出现在快照练习之前，容易提前删除；缺少独立并发判据
- 修订：增加同名/端口/SQL 路径检查及创建、就绪、导入退出门禁
- 修订：补锁等待结束和重试完整 SQL，独立新记录的版本+旧状态条件更新，说明两种约束职责
- 修订：正常停止后回收且明确最后执行；新增五项独立通关、连接预算与结果未知追问

**八项正文证据**

- 前置与路线：作者复评通过。“基础实验：事务提交与锁定读”明确 PowerShell 仓库根、Docker Linux、容器 mysql 提示符、双连接及各阶段失败门禁。
- 机制与状态：作者复评通过。“核心概念二：隔离、MVCC 与锁”“用乐观版本亲眼看到并发冲突”“可见性补课：读到旧记录未必是复制慢”分别解释锁、版本/状态条件及第一次一致性读。
- 基础实验：作者复评通过。“基础实验：事务提交与锁定读”使用已检查的仓库 init.sql，版本/状态预期明确，强调本地 InnoDB 非产品验证。
- 故障实验：作者复评通过。“故障注入：两个会话争抢同一行”“第二个故障实验：亲眼区分死锁和超时”包含锁证据、显式回滚、完整重试和零计数恢复。
- 生产取舍：作者复评通过。“托管数据库验收：向产品问对问题”“容量黑板：吞吐规格还没有变成业务容量”覆盖产品、连接、备份日志、切换和升级不可直接降级。
- 递进面试：作者复评通过。“递进追问”“三分钟完整回答示范”及独立通关要求提交未知、切换五层和同计数不同数据的追问。
- 独立通关：作者复评通过。“独立通关：版本、事务与产品边界分别验收”给出新记录、读时序变更、死锁/超时证据、450连接预算及答案判据。
- AIOps 与证据：作者复评通过。“AIOps 观测与容量性能”“一条观测记录怎样证明修复有效”把业务池等待/锁/资源/变更串联并限制权限。

**验证边界**

- reasoned：全文审阅并读取 examples/tdsql-mysql-lab/init.sql，核对其初始化 ACKED/version=2 及恢复后 version=3、乐观新记录 1→2、连接 20×22=440。；限制：未运行 MySQL 或 TDSQL，未执行切换/备份；产品内部实现按现场版本保留未知。

第二位审校者：cloud-automation；日期：2026-10-12。

- 全文审阅并读取实际init.sql：TDSQL家族/公私云/本地MySQL边界、行锁/死锁/快照与唯一键、索引日志/连接/备份/升级完整；初始化ACKED/v2、有限锁超时恢复CLOSED/v3、两行环回滚为零、乐观条件和首一致性读实验闭环。五项独立任务有800与450连接预算/每池22答案，不把本地实验当TDSQL容灾实测。

### TensorFlow 深讲

[打开课程](./data-ai/tensorflow.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：NaN概率可被比较为低风险，训练和导出缺少数值及重载验收门禁
- 初评：缺失值修复未限制缺失数量及数值范围
- 初评：虚拟环境失败停步与独立掌握证明不完整
- 修订：补安装失败停步、版本日期边界和数据生成数量校验
- 修订：训练history/权重/预测有限值与概率范围门禁，keras重载golden样本比对
- 修订：输入比例/百分比合同、最多一项缺失修复及五道独立任务
- 修订：交叉返修：预测与故障脚本统一专用venv解释器和失败停止；补预测入口与期望，Linux安装逐次门禁、设备检查退出码与Serving30秒超时

**八项正文证据**

- 前置与路线：作者复评通过。安装：独立目录、Python选择与显式环境解释
- 机制与状态：作者复评通过。自动微分、tf.function 与计算图、模型保存与交付：Eager/Graph、梯度与优化、SavedModel状态边界
- 基础实验：作者复评通过。基础实验：训练 AIOps 故障风险分类器：完整文件和导出前验收
- 故障实验：作者复评通过。故障注入实验：让输入包含 NaN：单字段修复、全缺失拒绝及回退
- 生产取舍：作者复评通过。升级、灰度与回滚：版本与预处理匹配，Serving兼容不假定
- 递进面试：作者复评通过。面试速答：训练服务偏差、分布式、恢复状态追问
- 独立通关：作者复评通过。独立通关：训练、推理、导出三种成功分别证明：五关含答案
- AIOps 与证据：作者复评通过。TensorFlow 在 AIOps 中的生产落地：评分与人工/规则回退边界

**验证边界**

- syntax：返修后重新解析19段Python AST、6段PowerShell围栏，全部通过；限制：没有加载TensorFlow执行图
- executed：NumPy实际执行6000x4生成、输入合同、单字段修复与10类负向检查；限制：TensorFlow未安装，训练/keras重载/export/Serving未执行
- reasoned：全篇核对数值门禁、batch计算、保存与恢复边界；限制：生产GPU及服务容量均未实测

第二位审校者：cloud-automation；日期：2026-10-12。

- 完整阅读全文；Tensor、Variable、GradientTape、Dataset、Eager/Graph 与训练请求路径按作用、观测和失败边界展开；Normalization 仅在训练集适配，合成独立同分布切分没有伪称生产时间序列验证。
- 逐项核对训练、predict.py 和 fault_injection.py：有限值门禁、训练期中位数与明确的拒绝条件、重载制品的固定探针和阈值均有因果说明。返修后 Windows/Linux 安装与运行显式使用本课虚拟环境，逐步失败停止，不再依赖激活或全局解释器；Serving 请求有有限超时。
- 检查“生产设计”“事故题”和独立通关：区分权重恢复与优化器恢复、Serving 候选版本与已验证兼容组合、模型/特征/阈值/运行时共同回滚、容量平均值与故障余量，以及自动化授权边界，答案能支持递进追问。
- 本次交叉审校为正文、配置与代码路径复核；未执行 TensorFlow 训练、GPU、Serving 或生产部署，不用其他文章的标准库运行结果替代这些验证。

### Transformer 技术栈深讲

[打开课程](./data-ai/transformer.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：注意力实验K/V数量不等会被zip静默截短，规则形状/有限值/因果位置边界未完整校验
- 初评：运行验收assert可被-O禁用，完整目录文件准备仍有跳跃
- 初评：缺少技术独立五关答案
- 修订：补空矩阵/形状/有限值与等长因果假设显式拒绝
- 修订：运行归一化门禁改显式异常，补标准库与框架路线边界
- 修订：增加未来V不变性、KV容量和布尔Mask迁移五关
- 修订：交叉返修：框架路线与纯Python分目录，专用venv解释器/逐次失败停止、依赖证据拒覆盖、encoder_shape.py精确运行入口；完整注释Pooling/截断/注册表/高可用/检查点术语

**八项正文证据**

- 前置与路线：作者复评通过。安装与实验环境：纯Python/框架路线分离，独立UTF-8文件步骤
- 机制与状态：作者复评通过。核心概念三：Query、Key、Value 与缩放点积注意力、核心概念四：Mask：形状和位置边界
- 基础实验：作者复评通过。基础实验：亲手算一次 Causal Self-Attention：完整程序与正常权重
- 故障实验：作者复评通过。故障注入实验：移除 Causal Mask，检测未来信息泄漏：退出2、恢复0与证据
- 生产取舍：作者复评通过。容量与性能、高可用与故障域：KV与二次分数/故障余量区分
- 递进面试：作者复评通过。高频面试题与连续追问：API Mask、状态恢复及优化边界
- 独立通关：作者复评通过。独立通关：能计算，也能找出静默错误：五任务有数值答案与返工
- AIOps 与证据：作者复评通过。Transformer 在 AIOps 中的作用：证据摘要与确定性审批执行分层

**验证边界**

- syntax：交叉返修后2段Python AST与8段PowerShell围栏重新解析通过；限制：可选Torch Shape未实跑
- executed：标准库注意力正常/故障/恢复退出码，未来V不变性及5类坏矩阵实际通过；限制：手工向量不代表语言模型、GPU或生产推理

第二位审校者：cloud-automation；日期：2026-10-12。

- 完整阅读全文；核对 Q/K/V 投影、位置与排列等变性、因果遮罩、SDPA/MHA 布尔语义差异、全遮罩数值失败，以及不等长缓存解码的绝对位置边界，没有把小矩阵程序当成训练好的模型。
- 实际执行正文 attention_lab.py 的标准库完整程序：正常路径退出 0、首行权重 [1,0,0] 与输出 [1,0]、未来权重 0；关闭因果遮罩未来权重约 0.351383、退出 2。验证范围仅是该确定性矩阵逻辑，不是 Torch/Hugging Face 或模型质量。
- 返修后可选框架路线使用独立新目录、专用虚拟环境、逐步退出码门禁与准确 encoder_shape.py 入口；路径图的 Pooling、Prompt Template、截断、模型登记/制品存储及调度等英文分支均有符合上下文的中文解释。
- 复核 Prefill/Decode/KV 生命周期、FlashAttention 的 IO 改善与计算量边界、512MiB/4GiB/16GiB 缓存计算、取消回收、单副本故障余量和整体制品回滚；五项独立通关能检出形状、有限值和静默未来泄漏，未声称真实推理平台已部署。

### 向量数据库

[打开课程](./data-ai/vector-database.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：JSONL重复ID/空输入可静默覆盖或失败，embedding响应位置和数值未校验
- 初评：查询模型与集合没有合同，缺少.env/忽略文件的完整准备
- 初评：负向实验无else失败门禁、缺独立通关
- 修订：JSONL非空字段/重复ID、响应位置/维度/有限值门禁
- 修订：显式Chroma余弦配置、构建完成与模型合同、补环境文件准备
- 修订：维度故障未触发时显式失败，新增数学/权限/容量五关
- 修订：交叉返修：更新图改新版本验收后切换/保留回退/再回收，说明内容哈希改变不会自动删旧ID；精确Chroma双平台与Milvus独立Linux环境入口、失败门禁及受控.env
- 修订：Milvus补响应index/1536维/有限数值、写入insert_count和订单筛选一条门禁；邻链官方API且保留真实客户端未运行边界

**八项正文证据**

- 前置与路线：作者复评通过。Chroma 快速实验：UTF-8目录、.env/.gitignore、隔离解释器、费用
- 机制与状态：作者复评通过。向量机制继续讲：距离、索引和业务相关性：数学近邻与业务相关分离
- 基础实验：作者复评通过。零 API 费用的基础实验与故障注入、第二个离线实验：三个分数为什么选了三个邻居：完整标准库实验
- 故障实验：作者复评通过。零 API 费用的基础实验与故障注入：维度/零向量/NaN与授权负向
- 生产取舍：作者复评通过。更新与恢复设计：删除不能只改一列名字：版本、权限、备份与部分分片边界
- 递进面试：作者复评通过。三分钟完整回答示范、面试故障题：数据库正常，但十个问题全部找错资料：递进诊断
- 独立通关：作者复评通过。独立通关：数学近邻与业务证据分别验收：五关含MRR和容量答案
- AIOps 与证据：作者复评通过。AIOps 检索设计：相似事故是候选，去重还看时间和拓扑

**验证边界**

- syntax：交叉返修后15段Python AST与2段PowerShell围栏重新解析通过；限制：未运行客户端产品
- executed：标准库向量排序、三度量赢家、4类非法向量与越权故障断言实际通过；新增Milvus原文checked_vectors抽取执行2正常与10类负向，含逆序重排/缺失重复越界位置/布尔index/维度/NaN/Inf/布尔与字符串元素，全部符合；限制：非ANN数据库/复制/持久性验证
- reasoned：官方Chroma配置文档核对余弦字段，全文核对更新删除/权限/模型成对回退；限制：Chroma/Milvus/API未安装执行

第二位审校者：cloud-automation；日期：2026-10-12。

- 完整阅读全文；复核 embedding 合同、余弦/点积/L2 排序方向、归一化前提、HNSW/IVF 近似召回、业务证据与数学近邻的区别、写确认与可查询、逻辑删除与物理回收的状态边界。
- 实际执行正文两个标准库程序：授权检索返回 public-runbook/another-topic，维度错误被拦截并恢复；三种度量分别选长向量、同方向向量和近点，归一化后点积与余弦排序一致。未实跑 Chroma、Milvus 或外部 API。
- 返修后文档更新图为新版本构建验收、切换、保留回退再回收，不再先删旧数据；说明 content_hash 变化后的 upsert 不会自动清除旧 ID。Chroma 双平台和 Milvus 独立 Linux/WSL 路线有专用环境、失败门禁与受控 .env。
- 复核 Milvus checked_vectors 的位置重排、整数 index、1536 维/有限数值检查、insert_count 与单条过滤验收，以及 61.44GB 原始容量/双版本/15分钟 RTO 取舍、MRR 分母及权限恢复边界；五项通关具有正反判据，不以单候选过滤宣称排序质量。

### Apache ZooKeeper 深讲

[打开课程](./data-ai/zookeeper.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：启动步骤没有 Docker/端口/创建/就绪失败门禁，可能将容器 ID 当可服务
- 初评：操作系统前置同时提及 Linux 但新的预检需明确 PowerShell
- 初评：离线模型同请求键不同动作仍归为 duplicate，缺契约冲突边界与独立任务
- 修订：增加名称端口及各启动阶段门禁，明确初始化失败只重试 status、Linux 单独核对端口
- 修订：模型去重记录保存动作，相同键不同动作返回 request-conflict，并说明令牌/授权/业务键三者分工
- 修订：加入 CAS 扣额、父子 Watch、Observer 多数派、模型负向故障、通知扇出和状态口述五项通关

**八项正文证据**

- 前置与路线：作者复评通过。“老师先带你认路”“Docker 单节点学习环境”解释服务节点/znode、容器 Java、资源和 PowerShell/Linux 边界，添加启动失败门禁。
- 机制与状态：作者复评通过。“写入课堂：ZAB 为什么需要排序、落盘和重新同步”“选主课堂：排队资格和下游执行资格分两层”区分多数派、本地读、会话与下游隔离。
- 基础实验：作者复评通过。“入门实验：节点、Watch 与会话”给持久/临时/顺序、两次普通监听、会话结束和精确叶节点清理。
- 故障实验：作者复评通过。“故障实验：用版本竞争证明旧写入被拒绝”真实服务步骤有版本、拒绝、重新计算与限定删除；“生产模拟”离线模型已执行正反复测。
- 生产取舍：作者复评通过。“生产设计：协调数据小，故障影响不一定小”覆盖完整复制非分片、扇出、故障域、ACL 非继承及备份升级兼容。
- 递进面试：作者复评通过。“递进面试参考答案”“事故推理：磁盘慢，为什么最后变成多套系统掉线”以会话/多数派/磁盘/下游业务证据回答。
- 独立通关：作者复评通过。“独立通关：通知、资格和执行结果分别证明”五项给独立扣额输入、子列表反例、五投票两Observer、负向模型和30000突发判据。
- AIOps 与证据：作者复评通过。“在 AIOps 中的作用”“事故推理”关联上层共同 Ensemble 与会话状态，限制成员变更/恢复/删除自动权限。

**验证边界**

- executed：从文章提取完整 Python 离线模型执行，通过同请求不同动作断言；内存变体移除旧令牌保护后 AssertionError/exit1，原版恢复再次 exit0。；限制：未运行 ZooKeeper、会话、CAS、网络、ZAB 或下游原子提交；只验证单进程顺序模型。
- reasoned：全文审读 690 行，复核 5 投票多数派 3、可失去2、10000×3=30000扇出与10秒均值。；限制：扇出与故障域为设计假设，不是集群性能实测。

第二位审校者：cloud-automation；日期：2026-10-12。

- 全文审阅：znode与服务节点、会话/连接/应用资格、普通Watch非历史日志、ZAB多数派/本地读与sync限定、ACL非继承、顺序节点结果未知与下游fencing完整；单节点CLI/CAS及离线令牌反例各有恢复/精确清理。五项独立任务检验8→5而非盲写7、五投票两观察与3万瞬时扇出；模型实际执行范围不冒充真实多节点。

### Git 深讲

[打开课程](./foundation/git.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：首次配置默认要求 code 编辑器但未交代安装条件
- 初评：入门实验标题要求5次提交但步骤只形成一次记录
- 初评：独立检查以自评和提交数量为主，缺少改变保存时点的判据
- 修订：说明编辑器可省略及Bash与PowerShell边界
- 修订：入门实验改为自己仓库的一次记录并补目录与远端权限条件
- 修订：新增三状态、改变条件、冲突证据、公共历史回退和实际加载验证通关任务

**八项正文证据**

- 前置与路线：作者复评通过。安装和首次配置、入门实验：给自己的知识库增加一次可审查记录：编辑器、Shell、目录与远端权限已明确
- 机制与状态：作者复评通过。三棵树：工作区、暂存区、本地仓库；冲突期间，暂存区不是只有一个待提交版本：说明索引与冲突阶段
- 基础实验：作者复评通过。基础与故障实验：离线练会暂存，再解决合并冲突：临时仓库可按步骤观察5/10/15
- 故障实验：作者复评通过。基础与故障实验：离线练会暂存，再解决合并冲突：人为冲突、修为25或abort、保留历史再回收
- 生产取舍：作者复评通过。生产课堂：变更可信、协作一致和故障可恢复：公共历史、LFS、备份、密钥与跨平台风险
- 递进面试：作者复评通过。面试课堂：30 秒、3 分钟和事故推理：参考答案连接对象模型与发布证据
- 独立通关：作者复评通过。独立通关：用三个状态证明自己真的理解暂存：四段任务明确预测、证据和不通过条件
- AIOps 与证据：作者复评通过。AIOps 学习仓库的 Git 工作流、独立通关：告警变更与真实加载版本分开核验

**验证边界**

- reasoned：逐篇全文阅读并核对三状态、冲突和远端层次的前后语义；限制：本轮未执行Git临时仓库操作，不宣称实际服务加载

第二位审校者：data-observability；日期：2026-10-12。

- 全文1252行审校：index快照时点、restore默认来源、diff/log两点三点差异和冲突stage边界准确；离线mktemp局部作者不改全局
- 5/10/15暂存实验、双方20/30冲突选25、abort与自有目录回收完整；公共历史回退不撤销数据库和平台状态
- 独立通关要求三证据/新20预测/冲突父关系/生产加载版本，reflog、bundle、LFS灾备限制明确；本轮未实际创建Git教学仓库

### GitHub

[打开课程](./foundation/github.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：初阶远端实验使用作者真实仓库地址，读者写权限前提不明
- 初评：最终材料固定10次提交/5个Issue/3个PR，与后文不按数量评估冲突
- 初评：缺少批准、检查、部署SHA及规则绕过的独立评分题
- 修订：明确仅自己的仓库/Fork，复制自身地址后执行远端写入
- 修订：移除固定数量掌握暗示，改为可关联问题与验证的证据
- 修订：新增失败step、新SHA复核、必需检查与绕过权限、告警关联及模拟边界通关

**八项正文证据**

- 前置与路线：作者复评通过。入门实验：把 AIOps 知识库做成 GitHub 作品集：补本人仓库、权限与地址条件
- 机制与状态：作者复评通过。Issue、PR、Release 与部署是不同对象；重复、遗漏和乱序不能靠一个绿色响应解决：对象和事件分开
- 基础实验：作者复评通过。基础实验与故障实验：看到红灯后能解释原因：全新练习仓库阈值workflow闭环
- 故障实验：作者复评通过。基础实验与故障实验：看到红灯后能解释原因：99失败、8修复、关闭PR及分支清理
- 生产取舍：作者复评通过。Fork 与自动化的信任边界、平台数据的备份与可迁移性：最小权限和平台资产边界
- 递进面试：作者复评通过。面试：30 秒、3 分钟与追问；生产设计题：让告警自动关联最近变更：连续回答
- 独立通关：作者复评通过。独立通关：把一次失败检查追到真实发布：具体SHA、step、门禁及无权限推演判据
- AIOps 与证据：作者复评通过。生产设计题：让告警自动关联最近变更：重复事件和部署生效证据约束根因候选

**验证边界**

- reasoned：全文审校工作流、鉴权、事件去重和页面验收边界；限制：本轮未创建远端仓库/PR、未运行该文章云端实验

第二位审校者：data-observability；日期：2026-10-12。

- 全文1383行审校：Git推送、PR评审/检查、部署与页面验证分层，base/head、压缩合并后部署SHA与平台备份边界清楚
- 全新个人仓库threshold5→99失败→8恢复工作流含read权限、十进制解析和具体提交日志；清理练习PR/分支不改正式仓库
- 独立题检查名称/绕过身份、新SHA、分页、重复回调及告警关联，Webhook重投非自动和短期身份信任约束明确；未创建远端资源或运行Actions

### Go（Golang）深讲

[打开课程](./foundation/golang.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：Linux安装流程移动全局旧Go目录，SHA256只有显示没有失败门禁。
- 初评：HTTP客户端LimitReader恰好1MiB会把超长响应当正常EOF；告警接口未拒绝第二JSON值与无效severity，拼接键允许冒号歧义。
- 初评：绑定失败只写日志而正常返回，可能让调用方误判成功；有界jobs不等于无界counts map有容量上限。
- 初评：需要针对异步202、429、race证据与排空协议的独立评测。
- 修订：Linux改独立用户课堂工具链，下载失败与SHA校验失败立即停止；补空目录与构建退出状态说明。
- 修订：客户端多读1字节拒绝超限，接口校验单一JSON值、服务名格式与有限severity。
- 修订：启动/Shutdown失败退出码1；明确固定readyz、启动意图日志、内存状态和counts基数的课堂边界及收回步骤。
- 修订：新增入队/处理/可靠保存五层通关任务与返工判据。
- 修订：交叉返修：补worker pool协程内for循环遗漏的闭合；原文函数提取后gofmt解析通过。

**八项正文证据**

- 前置与路线：作者复评通过。“安装 Go 1.26”“第一个 module”“前置条件与目录”交代工具链、架构、校验、shell与-race/C编译器，不动全局旧安装。
- 机制与状态：作者复评通过。“Go 内存模型与 happens-before”“G-M-P 调度模型”“老师带你把告警 API 从‘会运行’讲到‘讲得清承诺’”解释所有权、同步、入队与排空。
- 基础实验：作者复评通过。“AIOps 入门项目：告警聚合 API”完整main与测试、启动查询、校验、期望、故障回路和清理。
- 故障实验：作者复评通过。“故障实验一：制造并修复 data race”“故障实验二：有限复现 goroutine 阻塞堆积”有限注入，取证、恢复锁/close与Wait回收清楚。
- 生产取舍：作者复评通过。“生产设计检查单”“HTTP client、连接复用与泄漏”“取消不是排空，优雅退出要画出顺序”“一道容量题，练会推理而不是背参数”覆盖容量、过载、可靠状态、安全、升级交付。
- 递进面试：作者复评通过。“核心面试题参考答案与连续追问”17题含同步、调度、GC、timeout与架构选择答案，区分规范和版本实现。
- 独立通关：作者复评通过。“独立通关：把入队、处理和可靠保存分别验收”含202/最终计数、容量1的429、输入负例、race/绑定失败、300条每秒预算与口述追问。
- AIOps 与证据：作者复评通过。“Go 在 AIOps 链路中的位置”“runtime metrics 与进程指标”“学习证据”关联采集/队列/指标/trace与脱敏profile，不把课堂压力当生产。

**验证边界**

- executed：临时自有module提取文章完整main/test，用本机Go1.23.5实际go test -count=1及go vet通过；追加第二JSON值、非法severity、冒号服务名、未知字段与容量1的202/429行为测试全部通过。临时3文件目录已核对身份并移除。；限制：为使用本机已有工具链，临时go.mod设1.23.0；未验证文章1.26.0工具链门禁、-race（本机CGO_ENABLED=0）、真实监听服务/SIGTERM或Linux安装。没有下载替换Go。

第二位审校者：data-observability；日期：2026-10-12。

- 全文2126行审读；返修已读runWorkers的select→for→func三层闭合，作者gofmt语法检查，不冒充运行；module校验非锁、slice共享/typednil、GMP/Timer版本边界/协作取消准确
- 完整内存告警API1MiB/未知字段/单JSON/快照复制/202入队非持久/ready固定非容量/worker取消不drain/合法key总基数不受队列限制均明确
- 五关新2/1/重启空、容量1队列202/429/取出再入、race非数值证明/第二进程端口非零/净积压1秒及归属取消具判据；本轮未运行Go/C工具链

### Java 技术栈深讲

[打开课程](./foundation/java.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：8月版本快照仍使用当前/最新称呼，Oracle JDK21许可变化时间表述需与9月官方路线图区分。
- 初评：完整告警记录未拒绝负时长，固定1970时间未解释采集与事件时间边界。
- 初评：编译失败可能继续运行旧class；隐藏死锁进程没有错误日志，排障步骤却要求查看标准错误；只改锁顺序可能保留栅栏制造新等待。
- 初评：缺少改变阈值、旧制品身份与死锁环形证据的独立任务。
- 修订：版本表标明历史快照并根据9月15日Oracle路线图说明27版本线和21更新许可计划边界。
- 修订：补空目录/片段范围、编译退出码门禁、record构造校验、固定时间口径与JFR拒绝覆盖。
- 修订：后台死锁改为同一完整JDK工具链、独立输出错误日志、进程存活检查与精确PID回收，解释统一锁顺序后不能保留原栅栏。
- 修订：新增五层独立通关与返工标准。
- 修订：交叉返修：包/目录短路线与DeadlockFixed串讲均补javac和java逐次退出码门禁，防止编译失败后运行旧class。

**八项正文证据**

- 前置与路线：作者复评通过。“安装与环境确认”“第一个 Java 程序”“前置条件”区分PATH/JAVA_HOME、完整JDK工具、空目录与片段/完整程序。
- 机制与状态：作者复评通过。“类加载生命周期”“Java Memory Model 与 happens-before”“老师串讲：先知道程序等什么，再决定调哪一个参数”解释类加载、同步、线程池、超时与内存口径。
- 基础实验：作者复评通过。“AIOps 入门实验：告警摘要器”有完整源码、目标21编译、major65、预期统计、JFR、排错与清理；新增构造校验。
- 故障实验：作者复评通过。“故障注入实验：制造并定位 Java 死锁”确定性锁环、日志与jcmd证据、进程检查、精确PID收回和修复边界。
- 生产取舍：作者复评通过。“容器里的 Java”“Java 服务的高可用边界”“安全边界”“升级与回滚”“生产系统设计题：设计高吞吐告警处理平台”覆盖容量、状态、升级、安全与回退。
- 递进面试：作者复评通过。“核心面试题与连续追问”从定义、值传递到JMM、GC、生产设计给答案与反例，非题目清单。
- 独立通关：作者复评通过。“独立通关：输出正确还要证明运行的是本次制品”给五条新输入/边界预测/旧制品/锁环/2GiB预算及口述判据。
- AIOps 与证据：作者复评通过。“Java 在 AIOps 链路中的位置”“结构化日志、指标与 Trace”“GitHub 学习证据”连接采集、关联、受控修复和脱敏证据。

**验证边界**

- executed：Windows Oracle JDK24的JShell实际执行全文AlertDigest类（移除package声明适应REPL），输出4/2/2及服务3/1，负时长被构造器拒绝。；限制：未重新执行javac目标字节码、JFR和死锁进程；原文章JDK24历史实测记录不当作本轮全量复验。未验证25/26/27、容器和生产负载。
- syntax：文章19个PowerShell围栏经PowerShell Parser解析无错误。；限制：语法不证明JAVA_HOME权限、attach或后台进程行为。

第二位审校者：data-observability；日期：2026-10-12。

- 全文2102行审读：发行方/LTS许可/历史补丁与当前路线、class身份/初始化/JIT/JMM、Heap/native/RSS口径分层准确
- 返修已读：包目录与DeadlockFixed两路线均加编译/运行LASTEXITCODE停止门禁，避免旧class假成功；摘要/JFR/确定性死锁/去闩锁统一顺序修复及精确PID清理完整
- 独立五条手算5/2/3与>60变2、major65/旧class反证/等待环/2GiB预算/超时非撤销判据明确；本轮未重跑历史JDK24验证

### Linux 深讲

[打开课程](./foundation/linux.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：固定18765端口未预查，可能把别人的响应误作实验成功
- 初评：后续只读观察要求复用已在前文停止的PID
- 初评：缺少综合判定端口存活、进程暂停与实际内容的独立任务
- 修订：启动前检查端口占用并禁止停止未知服务；交叉反馈后补逐项工具检查、ss失败停止和mktemp失败门禁
- 修订：明确追加观察在收尾前做，已收尾则重建并取得新PID
- 修订：新增三证据、STOP/CONT预测、配额范围与df/du假设通关

**八项正文证据**

- 前置与路线：作者复评通过。基础与故障实验：用受限进程观察暂停故障和恢复：Linux/WSL、Bash、Python、curl边界明确；交叉反馈后逐项检查ss/grep等工具，ss失败停止而非当作空闲。
- 机制与状态：作者复评通过。资源边界深讲：主机没满，服务为什么已经到顶：配额、父组、PSI与持久性区分
- 基础实验：作者复评通过。基础与故障实验：用受限进程观察暂停故障和恢复：PID/监听/正文共同验收且先查占用
- 故障实验：作者复评通过。基础与故障实验：用受限进程观察暂停故障和恢复：STOP/CONT/TERM/wait限定本次进程
- 生产取舍：作者复评通过。生产推理：指标变坏以后，先排队还是先扩容：容量、安全、故障域、升级回退
- 递进面试：作者复评通过。面试课堂：用证据回答，而不是背命令：30秒、3分钟及异常案例答案
- 独立通关：作者复评通过。独立通关：端口、进程、内容三份证据要对得上：预测和不通过条件具体
- AIOps 与证据：作者复评通过。在 AIOps 中的作用、资源边界深讲：采集范围、单位与模型输入约束

**验证边界**

- reasoned：逐篇全文走读，按读者顺序复核实验前置、证据与收尾；修订后复评；限制：本轮未运行该篇Linux服务或编辑器预览，不以静态走读冒充真实环境验证

第二位审校者：data-observability；日期：2026-10-12。

- 全文1204行审校；机制覆盖用户/内核、CPU配额与放置、memory高水位/硬限、PSI、inode/FD、原子路径与持久化差异
- 返修复核：Bash/Python/ps/curl/ss/grep/mktemp逐项前置，ss单独捕获失败停止、只有成功空结果判空闲，mktemp失败停止；新增门禁本轮为静态审查，未运行Linux
- 其余STOP故障明确T非D，端口存活不证明HTTP，CONT→TERM/wait归属清理和独立新PID/正文判据完整；未执行Linux/WSL实验

### Markdown

[打开课程](./foundation/markdown.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：构建命令缺少真实项目根目录、Node/npm和锁定依赖条件
- 初评：自评复选框不能检验解析结构和渲染差异
- 初评：语法成功与网站链接/知识库权限需要独立验收题
- 修订：补项目文件、运行环境参考、npm ci及编辑器预览验证边界
- 修订：新增标题/代码块/三列表格与管道转义独立作业
- 修订：新增围栏故障收回及GitHub/本站/RAG设计判据

**八项正文证据**

- 前置与路线：作者复评通过。入门实验：写一篇可提交的学习记录：第3步补站点根目录与依赖条件
- 机制与状态：作者复评通过。解析边界课堂：为什么标点相同，文档结构却不同：列表/表格/引用/复制语义
- 基础实验：作者复评通过。可回收故障实验：亲眼看见围栏失配：先建正确标题和代码块基线
- 故障实验：作者复评通过。可回收故障实验：亲眼看见围栏失配：单一围栏故障、复原和临时文件清理
- 生产取舍：作者复评通过。生产知识库：谁是源文件，谁是发布结果：当前React链路、安全、索引与回退
- 递进面试：作者复评通过。面试递进回答：从格式到工程约束：30秒、3分钟、治理与构建误判追问
- 独立通关：作者复评通过。独立通关：让解析结构而不是截图决定答案：明确结构、复制、转义和故障判据
- AIOps 与证据：作者复评通过。从文章切片到知识回答，安全前提不能被切走：RAG来源、权限与前置保留

**验证边界**

- reasoned：逐篇全文走读，按读者顺序复核实验前置、证据与收尾；修订后复评；限制：本轮未运行该篇Linux服务或编辑器预览，不以静态走读冒充真实环境验证

第二位审校者：data-observability；日期：2026-10-12。

- 全文1441行独立审读：CommonMark/GFM/平台方言、围栏闭合、列表归属、表格缺多列与转义、引用标签首次定义机制准确
- 临时笔记围栏3→4失配故障有修复/目录正文复测/仅自有清理；当前React/marked链与历史VitePress区分，不把构建通过当结构意图正确
- 独立题以解析结构/代码复制/新管道符/跨平台与RAG风险前置为判据；不可信HTML不天然净化、版本权限撤回与整包索引回滚明确；本轮未执行渲染器

### 网络基础

[打开课程](./foundation/networking.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：分层入门实验未先说明Linux工具依赖，选择本地HTTP后后续却继续执行公网DNS/TLS步骤。
- 初评：自动化脚本用\|\| true吞掉全部失败，任务可能返回0；URL未约束协议或凭证。
- 初评：证书元数据流水线隐藏标准错误，容易误认为证书校验成功；时间探测缺少总超时。
- 修订：补齐Linux工具/联网权限前提，分开本地HTTP与真实DNS/TLS的验证范围。
- 修订：重写探测脚本：校验URL，限定http/https，拒绝内嵌凭证，限定DNS等待，汇总传输与2xx策略失败并非零退出。
- 修订：保留TLS错误并明确日期提取不等于身份验证，补请求总超时；新增分层失败与计时预算独立通关。

**八项正文证据**

- 前置与路线：作者复评通过。“AIOps 入门实验”交代Linux/Bash、工具和公网许可；“可复现本地实验：同一服务的 200、404 与连接拒绝”提供本地替代且不冒充DNS/TLS验证。
- 机制与状态：作者复评通过。“一次 HTTPS 请求到底发生了什么”及后续TCP、DNS、TLS、NAT课堂按路径和状态边界解释；累计时间与阶段增量区分。
- 基础实验：作者复评通过。“可复现本地实验：同一服务的 200、404 与连接拒绝”给定文件、双终端、状态/正文、恢复和自有文件清理。
- 故障实验：作者复评通过。同一本地实验通过停止自己的服务器对照404与连接拒绝；独立通关要求请求证据与监听证据对应、恢复复测。
- 生产取舍：作者复评通过。生产设计、重试预算、MTU/NAT/观测位置课堂覆盖超时放大、容量、安全校验及受控修复，未把单探针当全局健康。
- 递进面试：作者复评通过。“面试怎么讲”与生产事故/追问将请求路径、拒绝/超时、502/504和设计取舍连接，不只背工具。
- 独立通关：作者复评通过。“独立通关：同样是失败，必须说出失败在哪一层”使用新文件、非法协议、404与停机、累计时间新输入，有退出码和反例判据。
- AIOps 与证据：作者复评通过。“AIOps 自动化脚本示例”“观察点本身也要标明位置”“学习证据”连接探测指标、告警与证据采集，缺观测不填成功。

**验证边界**

- reasoned：全文走读并逐分支检查脚本URL验证、失败汇总、2xx策略及实验恢复逻辑；对照curl官方手册确认HTTP状态与传输退出码不同。；限制：未在Linux运行Bash探测，未联通公网目标或验证真实TLS/跨区链路。

第二位审校者：data-observability；日期：2026-10-12。

- 全文1873行独立审读：DNS/NSS/负缓存、双连接网关、TCP字节/应用提交、累计curl时间、SNI与主机名/信任链校验分层准确
- 本地HTTP200/404/停止连接拒绝/恢复明确未覆盖DNS和TLS；net_probe汇总2xx/传输/非法URL退出0/1/2，代理反证与不可信URL边界清楚
- 独立新ready-v2输入、三层重试27倍/两秒预算、缺观测非零延迟、共享出口/MTU/容量回退有技术判据；本轮未运行公网或本地服务

### Python

[打开课程](./foundation/python.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：文章先要求检查Python却缺少首次安装入口及Windows/Linux解释器选择前置。
- 初评：日报CLI直接覆盖已有输出，输入输出同路径会毁坏练习数据；负阈值较晚才失败。
- 初评：原结尾以能讲清项目暗示掌握，没有新数据、失败状态和不覆盖证据的独立判据。
- 修订：补官方安装入口、受管设备许可、系统Python保护和无第三方依赖最短路径。
- 修订：参数阶段拒绝非正阈值和相同输入输出路径；独占创建输出，明确旧报告、符号链接和非原子写入边界。
- 修订：新增五条新告警、阈值变化、坏时间、覆盖保护、共享对象与分页失败的独立通关；弱化数量式掌握承诺。
- 修订：交叉返修：学习点表与实际代码对齐为Path.open('x')及file.write，说明独占创建而不是覆盖写入。

**八项正文证据**

- 前置与路线：作者复评通过。“第一次安装时，从解释器开始”“AIOps 入门实验：告警噪声日报”给Python版本、运行目录、标准库、文件和平台差异。
- 机制与状态：作者复评通过。“名字不是盒子：共享对象为什么会污染下一次任务”“工程机制课堂：函数结束，不代表资源和任务都结束”解释绑定、生命周期、生成器、时间与取消边界。
- 基础实验：作者复评通过。“AIOps 入门实验：告警噪声日报”包含完整输入与脚本、执行和预期报告，新增拒绝覆盖与清理说明。
- 故障实验：作者复评通过。“日报故障实验：空数据不是程序崩溃，错误数据不是正常日报”有空、错形状、坏时间、退出码、修复复测及旧产物边界。
- 生产取舍：作者复评通过。“生产设计题：日报不能每天悄悄漏掉一页数据”与工程机制课堂覆盖分页水位、容量、有界并发、权限、依赖和状态兼容回滚。
- 递进面试：作者复评通过。“面试递进：把语法题接回工程”含30秒/3分钟、浅深拷贝、运行时验证、故障证据追问与事故设计。
- 独立通关：作者复评通过。“独立通关：用新输入判断脚本有没有按合同完成”改变服务分布/阈值/失败位置，要求退出码、文件不变、分页发布和口述反例。
- AIOps 与证据：作者复评通过。“Python 在 AIOps 链路中的位置”“学习证据”将告警输入、验证、聚合、产物与受控自动化衔接，不提交真实敏感数据。

**验证边界**

- executed：本机Python 3.14对文章完整日报代码做AST解析；内存执行三种聚合/阈值/空数据用例及缺时区负向用例，均通过。；限制：没有写入测试文件；CLI路径/已有文件拒绝按代码审阅，未对真实API、网络、生产容量或多平台安装验证。

第二位审校者：data-observability；日期：2026-10-12。

- 全文2033行独立审读：输入数组/必填字符串/时区校验、空观察非健康、输入输出不同路径和独占创建安全合同完整
- 返修复核：知识映射表与实现一致，Path.open('x')独占创建再write，已存报告失败不覆盖
- 可变默认参数与错形状/坏时间故障有反证修复清理，五题新5条/阈值3→4/重复保护、分页总预算/依赖状态回滚有判据；未运行完整日报脚本

### RESTful API 技术栈深讲

[打开课程](./foundation/restful-api.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：安装与终端版本只有检查命令，缺少初次准备指引；端口占用可能让客户端误测旧服务。
- 初评：真正并发测试无客户端等待上限；进程重启后的ETag计数撞值边界未明示。
- 初评：已有丰富实验/答案但缺改变幂等请求字段顺序、缓存验证与容量输入的独立判据。
- 修订：补实验起步、命令来源、PowerShell版本和无真实worker边界；启动前查监听且不停止陌生进程。
- 修订：并发fetch加AbortSignal观测超时，说明取消等待不撤销写入；解释重启计数不是持久资源验证器。
- 修订：新增幂等字段顺序、新ETag/304/428、并发证据、两区域与360MB容量预算通关。

**八项正文证据**

- 前置与路线：作者复评通过。“入门实验：运行一个可观察的 REST API”补Node/客户端工具与版本、隔离目录、端口冲突和本地监听前提。
- 机制与状态：作者复评通过。“一次请求的内部数据路径”“为什么 Node.js 单线程仍需要重新检查”解释请求路径、await竞争、条件原子提交和状态边界。
- 基础实验：作者复评通过。入门实验完整服务、客户端输入、ETag/重放与预期；无worker、内存状态与清理明确。
- 故障实验：作者复评通过。“故障注入实验：两个值班员并发修改同一告警”“故障实验：让两个请求真正竞争”有旧版本证据、恢复与真正竞争断言。
- 生产取舍：作者复评通过。“生产架构与高可用”“容量与性能”“安全边界”“生产设计题：设计 10 万 RPS 的多租户告警 API”覆盖共享状态、隔离、容量、灰度与数据回滚。
- 递进面试：作者复评通过。“面试回答”包含定义、3分钟设计和12组连续答案追问，解释幂等、条件请求、授权与超时。
- 独立通关：作者复评通过。“独立通关：旧版本、重复意图和未知结果分别处理”用字段顺序、新ETag、428、并发、容量和区域变化给明确可观察判据。
- AIOps 与证据：作者复评通过。“可观测性与 AIOps”“GitHub 学习证据”连接低基数指标、脱敏日志、Trace和受控执行，不冒充真实修复。

**验证边界**

- syntax：Node对文章所有JavaScript代码围栏做module模式语法检查，通过。；限制：没有启动HTTP实验、发送真实并发请求或验证PowerShell 7.3+报文；生产鉴权、数据库和跨区一致性未实测。

第二位审校者：data-observability；日期：2026-10-12。

- 全文2100行审读：REST约束非HTTP/JSON、方法预期效果幂等、428/412/409、CORS预检与执行未知、缓存与授权边界准确
- 标准库本机实验完整源码/PowerShell7.3前置/端口归属/ETag及重复键合同；await正文后提交前二次版本检查避免单线程异步穿插，多实例须DB条件更新
- 独立语义字段换序/同键异载荷/条件GET新旧/并发一胜一冲突/36万记录360MB及跨区幂等有判据；任务只queued无真实删除，重启v1世代碰撞与代码回滚非业务撤销明确；本轮未运行服务

### Shell / PowerShell

[打开课程](./foundation/shell-powershell.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：Bash健康采集用grep管道\|\| true把读取失败当空结果；两个版本直接覆盖旧报告，与文字边界冲突。
- 初评：初次实验未明确工具发现、练习根目录及单平台可先完成；缺少新输入的独立验收。
- 修订：Bash分类grep状态并启用noclobber；PowerShell改为NoClobber输出，明确半份报告和失败验收。
- 修订：补各平台工具检查/运行位置链接，改吞错示例为反例；新增对象布尔、管道退出、输出保护与并发触发通关。
- 修订：交叉返修：学习点改为Out-File -NoClobber与ps --sort=-pcpu加sed；PowerShell累计CPU时间不混同瞬时CPU百分比。

**八项正文证据**

- 前置与路线：作者复评通过。“AIOps 入门实验”明确Windows/Linux分支、工具发现、根目录和执行策略限制。
- 机制与状态：作者复评通过。“边界机制课堂：脚本的环境和输出也属于接口”说明重定向顺序、作用域、参数、编码与集合形状；对象不是显示文本。
- 基础实验：作者复评通过。“AIOps 入门实验”提供双版本完整脚本/运行、缺日志状态、拒绝覆盖、验收清理。
- 故障实验：作者复评通过。“一个完整的布尔返回故障实验”“不接触生产的失败实验”给安全注入、预期分支、修复和作用域收回。
- 生产取舍：作者复评通过。“脚本工程课堂：从能运行走到能放心重复运行”覆盖有界并发、总预算、幂等、权限、输出接口和清理限制。
- 递进面试：作者复评通过。“面试递进与生产场景”含30秒/3分钟及缺10台、定时任务环境、重复执行的因果追问。
- 独立通关：作者复评通过。“独立通关：别让显示结果替代返回合同”使用三条新对象、三段管道、日志三状态和报告不覆盖判据。
- AIOps 与证据：作者复评通过。“Shell / PowerShell 在 AIOps 链路中的位置”“学习证据”连接采集、结构化结果、受控恢复，公开内容须脱敏。

**验证边界**

- syntax：本机Windows PowerShell解析文章全部PowerShell围栏，无语法错误。；限制：语法通过不证明真实采集或Bash跨平台行为。
- executed：本机独立作用域复现双输出数组被当真、修正版返回Boolean false的故障与恢复。；限制：未运行生成报告或Linux Bash脚本；输出覆盖保护为静态审阅。

第二位审校者：data-observability；日期：2026-10-12。

- 全文1600行审读：Bash字节流/展开/重定向与PowerShell对象/成功输出/原生退出码区别清楚；管道失败和布尔返回两故障有局部清理
- 返修复核：知识映射表已与noclobber/Out-File -NoClobber及ps --sort=-pcpu \| sed一致，注明CPU百分比不同PowerShell累计CPU时间
- 独立新三服务/零一多结果、true\|false\|true显式exit、3类grep状态和重复保护判据完整；本轮未执行平台采集或完整两版脚本

### systemd

[打开课程](./foundation/systemd.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：系统级实验缺少可用健康目标且可能覆盖同名巡检；管理员前提和文件创建不明确。
- 初评：故障timer仍运行、恢复与回收说明太晚且不完整；set-default示例未就近说明系统模式影响。
- 初评：自动化重启片段可直接执行真实写操作，诊断脚本忽略状态的退出语义未说明。
- 修订：补Linux/systemd/sudo前提、名称冲突检查、独立回环HTTP目标与编辑器保存操作；推荐先做用户级实验。
- 修订：系统级故障先暂停timer，恢复URL并复测，显式禁用/停止/删除本次文件和HTTP目标。
- 修订：默认target变更加风险与原值回退；诊断单元名限制，自动重启改为只打印候选；新增状态/触发/就绪通关。

**八项正文证据**

- 前置与路线：作者复评通过。“AIOps 入门实验”“用户级安全实验：一条命令退出 42 时留下了什么”分清Linux/PID1、用户管理器、权限与运行位置。
- 机制与状态：作者复评通过。“systemd 如何启动服务”“依赖事务不是数据库事务”“触发机制课堂”解释job、依赖排序、cgroup、触发与业务状态边界。
- 基础实验：作者复评通过。系统级实验给出可用本地HTTP目标及日志成功证据；用户级实验以Result/ExecMainStatus验收而非running。
- 故障实验：作者复评通过。系统级故障暂停timer再换空端口，恢复复测清理；用户级exit42独立复现、恢复与精确回收。
- 生产取舍：作者复评通过。“生产设计：进程管理的边界与安全回滚”覆盖单机HA边界、重启预算、资源、权限沙箱、drop-in和制品/数据回滚。
- 递进面试：作者复评通过。“面试递进：会说命令以后再说因果”含启动关系、业务探针、系统启动图的递进答案。
- 独立通关：作者复评通过。“独立通关：退出、触发和就绪不能混成一种状态”使用exit17、新单元、未重读变化、90秒任务与停机条件，给状态和证据判据。
- AIOps 与证据：作者复评通过。“systemd 在 AIOps 链路中的位置”“AIOps 自动化脚本示例”先收证再生成候选动作，明确诊断退出不等于业务健康。

**验证边界**

- reasoned：全文走读并核对两条实验的目标、权限、命名、状态、恢复及清理链。；限制：当前Windows没有本次Linux systemd用户/系统管理器实测；未验证真实timer、cgroup、journal或启动兼容性。

第二位审校者：data-observability；日期：2026-10-12。

- 全文2386行审读：manager/client、job事务非业务事务、拉起与排序、Type启动非业务就绪、enable/daemon-reload/应用reload分层准确
- 用户级0→42→0真实路线与系统级自有HTTP/timer故障闭合，名称占用/端口/仅新对象清理；journal属性不冒充EnvironmentFile最终秘密
- 独立新17退出码、90秒每分钟与Persistent补一次、active503/inactive成功、path/socket触发和跨机协调边界完整；未执行systemd/用户总线实验

### VitePress

[打开课程](./foundation/vitepress.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：历史教学workflow仍示例Node20且发布权限覆盖构建作业；版本/权限边界没有就近说明。
- 初评：最小独立实验假定Node和新目录就绪；面试/检查单仍暗示当前仓库使用VitePress。
- 初评：缺新路径/base/产物状态的独立掌握判据。
- 修订：workflow示例改Node22并声明复现边界，发布权限收窄到deploy作业，链接官方运行时发布周期。
- 修订：补实验起步、创建目录/切换/当前位置与本地npx前提；改当前架构混淆与虚构生产经历措辞。
- 修订：新增页面/路由/base、死链与半套产物、权限和水合的独立通关。

**八项正文证据**

- 前置与路线：作者复评通过。“独立基础实验与死链故障注入”补Node/npm准备、独立目录创建和当前位置；“历史架构示例：不要覆盖当前仓库配置”限定范围。
- 机制与状态：作者复评通过。“深入课堂：不要把三个执行环境混成一台服务器”及水合/缓存/搜索章节解释构建、托管、浏览器与状态归属。
- 基础实验：作者复评通过。独立实验提供两份Markdown、固定依赖、构建与预览、点击及刷新验收、精确清理。
- 故障实验：作者复评通过。“独立基础实验与死链故障注入”改单一链接、记录非零与目标、恢复复建；“第二个生产模拟”明确纸面不是真实托管验收。
- 生产取舍：作者复评通过。“生产设计题：十万篇文档不只是‘多放几个文件’”“升级与迁移”覆盖容量、权限、缓存、制品/路径兼容和回滚。
- 递进面试：作者复评通过。“面试递进：从‘我会部署’到‘我能解释故障’”及安全手册追问含30秒/3分钟、环境与发布证据。
- 独立通关：作者复评通过。“独立通关：让页面、路由和产物三张地图闭合”改变目录/base/失败位置，要求实际URL、产物和刷新证据。
- AIOps 与证据：作者复评通过。“VitePress 在 AIOps 知识库中的位置”“搜索索引不是权限系统，也不是数据库副本”连接runbook交付、检索与受控知识使用。

**验证边界**

- reasoned：全文走读；对照VitePress v1 Getting Started确认1.6.4的目录/运行时说明，对照Node官方周期选择示例并保留版本验证边界。；限制：未安装或执行独立VitePress项目，未部署Pages；现有React站构建不能替代该产品实验。

第二位审校者：data-observability；日期：2026-10-12。

- 全文1479行独立审读：历史VitePress v1与当前React分离；源码/路由/base资源三地图、构建/托管/水合三环境职责准确
- 固定1.6.4独立新目录含两文件构建预览/死链故障/恢复清理，不误改当前站点；半套产物为清单模拟，未冒充远端原子部署实验
- 独立新queue页/base变式/真实死链与纸面混版不同判据，搜索索引非授权、public公开面、缓存旧资源与依赖整包回滚完整；本轮未安装构建或浏览器运行

### Ajax 技术栈深讲

[打开课程](./frontend/ajax.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：基础服务按完整URL匹配API，加入?mode后反而返回HTML；故障章节没有可复制的分支/超时/取消实现。
- 初评：异步readFile失败未受控，端口占用与原有服务误测缺门禁。
- 初评：未明确同源/合成延迟/自动重试的实验边界与独立判据。
- 修订：重写完整server，支持normal/error/slow/bad、方法/路由边界、受控500与绑定失败非零状态。
- 修订：完整HTML加入模式、取消、2秒时限、旧结果/旧错误资格、类型与结构校验。
- 修订：补运行时/端口/清理与模拟/真实边界；新增五层通关。

**八项正文证据**

- 前置与路线：作者复评通过。“基础实验：本地事件 API 与页面”有Node、空目录、端口归属、完整两文件。
- 机制与状态：作者复评通过。“一次 Fetch 的完整网络路径”“CORS 预检逐步拆解”区分传输、状态、读取授权与Schema。
- 基础实验：作者复评通过。“基础实验：本地事件 API 与页面”有完整同源服务/页面、200输出、检查与Ctrl+C收回。
- 故障实验：作者复评通过。“故障实验：注入 503、慢响应和过期结果”给现成模式、明确状态、恢复和模拟边界。
- 生产取舍：作者复评通过。“生产设计题：多租户事件 API 客户端”“超时预算、重试放大与背压”覆盖身份、容量、灰度与兼容回退。
- 递进面试：作者复评通过。“面试表达”“进阶老师追问：看得见响应，为什么取不到追踪号”有CORS/头过滤/重试答案。
- 独立通关：作者复评通过。“独立通关：HTTP、正文与业务结果分层验收”含2→9秒、非法结构、预检、新旧结果与5000QPS/27倍取舍。
- AIOps 与证据：作者复评通过。“AIOps 场景”“前后端可观测关联”连接六层结果、trace、证据源与受控写入。

**验证边界**

- syntax：6个JS围栏与完整HTML中的module script经Node语法检查通过。；限制：未启动本文4177服务或浏览器；Fetch/CORS/Cookie、真实取消和服务端业务写入未实测。

第二位审校者：data-observability；日期：2026-10-12。

- 全文814行独立阅读：两个完整文件、Node前置、4177归属和回环监听、Ctrl+C清理闭合
- 真实本地模式为同源503/慢响应/非法JSON形状，CORS、写幂等、自动重试明确是后续设计而非已实现
- 独立五题含9秒预算变式、旧错误资格、总尝试27倍放大以及Expose-Headers/注销刷新世代；未运行真实浏览器/API

### CSS 技术栈深讲

[打开课程](./frontend/css.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：基础实验要求三个article但没有完整替换结构，沿用HTML脚本替换表单后会querySelector空节点报错。
- 初评：file://失败与HTTP404/MIME边界未交代；缩短animation示例容易误读为完整减少动效策略。
- 初评：缺少计算值无效与层叠迁移、布局容量的独立通过判据。
- 修订：补可直接替换的三卡片main与移除旧表单脚本说明；按钮明确纯演示。
- 修订：补离线/HTTP前提、减少动效局限、强制颜色/对比度及仅个人副本回收。
- 修订：新增三视口测量、变量三结果、获胜规则、十万事件治理与口述通关。

**八项正文证据**

- 前置与路线：作者复评通过。“基础实验：自适应事件卡片”交代HTML副本、CSS文件/link与HTTP/离线区别，给完整替换结构。
- 机制与状态：作者复评通过。“进阶层一：级联不是只比较选择器分数”“进阶层三：内在尺寸与‘为什么 min-width:0 能救命’”“最后一堂机制课：变量存在，声明为什么仍然失效”解释竞争、计算阶段与布局。
- 基础实验：作者复评通过。“基础实验：自适应事件卡片”完整CSS/HTML、视口、缩放、主题预期和排错/回收。
- 故障实验：作者复评通过。“故障实验：制造横向溢出与样式覆盖失败”固定宽/匹配祖先/important注入，盒模型与获胜来源取证，恢复与回归。
- 生产取舍：作者复评通过。“进阶层八：CSS 工程治理与发布”“生产设计题：多团队仪表盘 CSS 怎样治理”“事故题：发布后弹窗被图表遮住”含资源版本、性能、主题、隔离与整包回退。
- 递进面试：作者复评通过。“面试表达”“布局进阶课堂：用测量解释，而不是不断加 !important”解释答案与测量追问。
- 独立通关：作者复评通过。“独立通关：用计算值和布局证据解释页面”规定变量蓝/紫/红、390/768/1440宽、获胜来源与治理取舍，不以截图代替因果。
- AIOps 与证据：作者复评通过。“AIOps 场景”“GitHub 学习证据清单”连接CLS/LCP/INP、发布版本、语义状态与可信结构。

**验证边界**

- reasoned：逐段核对HTML接线、CSS层叠/变量/盒模型实验条件与收回；W3C级联层规范已复核。；限制：未在真实浏览器测量布局、强制颜色、键盘/屏幕阅读器或CLS/INP；未宣称视觉回归通过。

第二位审校者：data-observability；日期：2026-10-12。

- 全文854行独立阅读，HTML前置与CSS引用/副本/移除旧表单监听完整，故障选择器明确需要app祖先
- 变量计算值失效三态、分层反转、内在尺寸、包含块与堆叠上下文机制正确；五项通关要求测量并写回源文件
- 生产侧覆盖令牌兼容迁移、原子制品、主题/放大/焦点与性能预算；未执行浏览器回归

### HTML 技术栈深讲

[打开课程](./frontend/html.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：离线表单按钮叫保存但没有后端，默认GET导航可能把合成处置文字放进URL。
- 初评：初学者文件扩展名/开发者工具入口缺失，文档生命周期把字体与业务完成混为load就绪。
- 初评：缺少表单条目改变条件、DOM修正和授权边界的独立判据。
- 修订：基础表单改为阻止默认导航、仅报告本地校验不保存；补UTF-8/扩展名/面板入口和安全回收。
- 修订：修正文档生命周期与字体/异步业务边界并链接WHATWG解析结束步骤。
- 修订：新增外观/提交数据/业务成功分层的五项通关。

**八项正文证据**

- 前置与路线：作者复评通过。“基础实验：做一个无需框架的事件页面”给空目录、扩展名、UTF-8、开发者工具入口，区分离线与HTTP。
- 机制与状态：作者复评通过。“HTML、DOM、CSSOM 与渲染路径”“进阶层三：表单是一台状态机”解释源码/树与提交、未知结果。
- 基础实验：作者复评通过。“基础实验：做一个无需框架的事件页面”有完整文件、键盘/校验预期和清理，不冒充后端保存。
- 故障实验：作者复评通过。“故障实验：故意破坏表单并形成证据链”有label/button单点注入、无障碍证据、源文件恢复与回归。
- 生产取舍：作者复评通过。“进阶层五：HTML 层的安全模型”“生产设计：事件控制台怎样不成为新的事故源”“事故场景：发布后部分用户看到旧页面”覆盖授权、缓存/资源一致、容量与回退。
- 递进面试：作者复评通过。“面试表达”“语义与交互课堂：把真实用户路径走完”给答案、结构/表单/生命周期继续追问。
- 独立通关：作者复评通过。“独立通关：外观、提交数据与业务成功要分别证明”用FormData条件、DOM修正、十万事件和布尔属性给明确判据。
- AIOps 与证据：作者复评通过。“AIOps 中 HTML 的位置”“GitHub 学习证据”连接事件/Trace/版本及脱敏键盘证据。

**验证边界**

- syntax：两段内嵌script经Node语法检查通过。WHATWG表单与解析结束原始规范已复核。；限制：未实跑浏览器原生约束校验、键盘、屏幕阅读器或真实后端；历史共享实验记录不当作本轮验收。

第二位审校者：data-observability；日期：2026-10-12。

- 全文779行独立阅读：基础实验有新目录/UTF8/浏览器/本地不保存契约；故障修复源文件而非临时DOM
- 独立通关五题覆盖FormData成功控件、布尔属性、焦点和源码/DOM差异；生产层含跨租户缓存、幂等未知结果与整包回滚
- 未执行浏览器交互；原文共享实验历史测试与读者本机验收已区分

### JavaScript 技术栈深讲

[打开课程](./frontend/javascript.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：基础实验名为可取消筛选器，实际是无网络CLI；参数缺失只抛底层错误。
- 初评：normalize只查typeof而未拒绝负数/非有限/空或重复身份；IncidentStore只在add复制，get暴露内部对象。
- 初评：两个不同ESM文件放同一代码块直接执行语法失败；故障同时注入数据与忙等不利归因。
- 修订：改名只读CLI并明确Node/文件/网络取消边界；补参数合同、有限非负数、非空唯一ID校验。
- 修订：get返回副本防内部状态被修改；拆分classifier/main两文件围栏。
- 修订：单独注入坏输入与忙等，区分Node耗时和浏览器INP；新增值/竞态/所有权五层通关。

**八项正文证据**

- 前置与路线：作者复评通过。“基础实验：只读事件筛选 CLI”“模块与依赖图”交代Node、文件名、参数及分文件/HTTP前提。
- 机制与状态：作者复评通过。“事件循环：异步代码真正怎样排队”“工程进阶课堂：时间、身份与失败传播”“深一层的课堂：把对象交给 Worker 后谁拥有它”解释绑定、任务、资格与转移。
- 基础实验：作者复评通过。“基础实验：只读事件筛选 CLI”完整输入/程序、输出/退出状态、语法与数据检查、只读回收。
- 故障实验：作者复评通过。“故障实验：制造事件循环阻塞和脏数据”“不依赖网络的完整竞态实验”单因注入、期限/错误证据、恢复与反向延迟验证。
- 生产取舍：作者复评通过。“生产设计题：事件搜索怎样避免竞态与雪崩”“安全与供应链”“事故题：重复确认事件”覆盖容量、缓存/租户、幂等、版本、安全与回滚。
- 递进面试：作者复评通过。“面试表达”“面试中的三个进一步追问”给闭包、Promise、异步边界与长期生命周期答案。
- 独立通关：作者复评通过。“独立通关：把值、异步结果与资源所有权讲到可验证”给四延迟/五坏输入、反转延迟、监听引用、Worker与副作用设计判据。
- AIOps 与证据：作者复评通过。“AIOps 场景”“GitHub 学习证据”连接合成告警规则、部分证据、Trace/版本和受控自动化。

**验证边界**

- syntax：21段js/javascript围栏以Node module语法模式检查通过；发现并拆分原先两文件混块的语法冲突。；限制：机制片段不等于可独立运行的完整页面。
- executed：Node26.8.2实际执行normalize边界0/999/1000/1001与空ID/负数/字符串/Infinity/重复ID五负例；执行全文定时器竞态示例，故障旧搜索/修复新搜索符合预期。；限制：只运行内存纯函数和定时器；未运行CLI文件读写、真实Fetch/取消、浏览器INP、Worker或持久化接口。

第二位审校者：data-observability；日期：2026-10-12。

- 全文868行独立阅读；筛选CLI校验根形状、唯一ID和有限非负数，Node忙等与浏览器INP证据明确区分
- 独立五题含阈值边界、倒置请求时序、监听器引用、缓冲转移/队列与写入幂等；机制涵盖微任务、身份/引用和Promise失败不取消
- 本轮执行原文竞态、监听器引用和四字节转移三个离线片段，输出均符合预期；未测试真实浏览器/Fetch/服务端副作用

### React 技术栈深讲

[打开课程](./frontend/react.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：核心组件只有named export且无新项目挂载路径，默认Vite入口不能直接使用；误称默认模板都有test/type-check。
- 初评：Effect failed.error与reducer failed.message不一致，缺Action定义且默认静默吞新动作。
- 初评：后段图把passive Effect固定画在paint之后，与正文边界冲突；独立通关不足。
- 修订：补安全个人Vite创建/依赖路径、默认App导出与实际脚本核对，保留本仓库主页。
- 修订：统一failed.message、补Action联合与never穷尽，说明请求ID/运行时校验边界。
- 修订：修绘制/Effect图的调度边界，新增五层快照/身份/订阅/设计通关与安全回收。

**八项正文证据**

- 前置与路线：作者复评通过。“基础实验：React 19 + TypeScript 事件看板”从空目录模板到src/App默认导出与实际脚本。
- 机制与状态：作者复评通过。“render、reconciliation 与 commit”“Effect 的生命周期与闭包”解释快照、身份与外部同步。
- 基础实验：作者复评通过。“基础实验：React 19 + TypeScript 事件看板”“完整课堂实验：同样三行为什么只加一”有完整App与明确结果。
- 故障实验：作者复评通过。“故障实验：缺 cleanup、key 错位与 hydration”“完整课堂实验：同样三行为什么只加一”给快照故障/修复和资源/身份回归，SSR缺环境不声称验证。
- 生产取舍：作者复评通过。“生产设计题：实时告警 React 控制台”“可观测性和发布”“Server Components 与 Server Actions 边界”涵盖容量、权限、兼容与回退。
- 递进面试：作者复评通过。“面试表达”“React 工程课堂：减少需要同步的状态，增加可验证的边界”含Effect、Context、错误与性能答案。
- 独立通关：作者复评通过。“独立通关：快照、身份、同步与真实业务分别验收”规定1/3、草稿重排、单有效资源、迟到错误与系统取舍。
- AIOps 与证据：作者复评通过。“AIOps 场景”“可观测性和发布”连接Profiler/业务结果/release/trace和服务端审计。

**验证边界**

- syntax：本机TypeScript6.0.3对筛选App和快照实验两份完整TSX独立strict检查通过，解析实际React类型。；限制：未运行浏览器/React组件测试、Effect资源序列、SSR/RSC或生产构建；静态检查不当运行验收。

第二位审校者：data-observability；日期：2026-10-12。

- 全文881行独立阅读：render/commit/Effect顺序及StrictMode开发检查、状态队列1与3、type/key/position身份、订阅快照与SSR请求隔离解释完整
- 独立Vite入口与两份完整App替换路径闭合，旧脚手架测试不代表新页面行为；五题覆盖新输入/队列/资源清理/容量与未知写入
- 未执行React SDK或浏览器；定时器合成竞态、真实Fetch取消、服务端幂等与生产审批边界没有混为一谈

### TypeScript 技术栈深讲

[打开课程](./frontend/typescript.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：基础实验没有独立package/安装/执行路径，要求新手自行调整模块配置且只做noEmit。
- 初评：基础Incident三字段与四字段isIncident守卫不一致，故障修复缺完整衔接。
- 初评：缺少非法调用、旧dist和运行时样本三种独立证据的评测。
- 修订：补固定6.0.3的package、安装/lockfile、NodeNext配置、build/start与失败停止。
- 修订：基础契约统一四字段，补完整守卫和unknown失败替换段。
- 修订：新增静态负例/运行时负例/运行产物的五层通关与回收边界。
- 修订：交叉复核返修：parse-sample.ts不在src include且start只跑index，改为本地6.0.3单文件ignoreConfig检查、独立新目录编译、准确Node执行与逐步失败停止；变式用新目录避免旧制品，回收只限本次文件。

**八项正文证据**

- 前置与路线：作者复评通过。“基础实验：类型安全的告警聚合器”空目录到package/lockfile/config/src完整，区分Bundler与NodeNext。
- 机制与状态：作者复评通过。“编译器做什么、不做什么”“运行时校验：静态类型的信任边界”解释类型擦除与校验。
- 基础实验：作者复评通过。“基础实验：类型安全的告警聚合器”有完整四字段程序、编译/运行预期和门禁。
- 故障实验：作者复评通过。“故障实验：用 any 和断言制造‘假安全’”“基础与故障合一的类型测试”可复现错误、拒绝与恢复。
- 生产取舍：作者复评通过。“生产系统设计：跨团队前端类型契约”“容量、性能、安全和升级”覆盖兼容、性能、安全与整套回退。
- 递进面试：作者复评通过。“面试表达”“函数类型的安全边界有例外”有类型/模块/回调机制与连续追问。
- 独立通关：作者复评通过。“独立通关：静态拒绝、运行时拒绝与实际执行三份证据”具体计数、never/负例退化、旧dist与契约设计。
- AIOps 与证据：作者复评通过。“AIOps 场景”“输入类型与领域类型应隔着一道校验门”连接模型/告警外部输入与可信边界。

**验证边界**

- executed：本地TypeScript6.0.3 Compiler API对4个完整TS程序独立strict检查通过；增加遗漏error状态产生2345，放宽批准状态产生2578；parseSample实际输出true/false/false并拒绝空服务/2/Infinity。；限制：内存虚拟源编译/执行；未在新目录npm install或真实生成dist，浏览器和跨团队发布未验证。

第二位审校者：data-observability；日期：2026-10-12。

- 全文独立审读后发现根目录parse-sample.ts不在项目include/start范围；作者已补本地6.0.3 --ignoreConfig独立检查/编译/运行，复核修订段和逐步退出码门禁通过
- 严格NodeNext主实验、未知输入守卫、noEmitOnError与旧制品拒绝、越界变式和专属输出清理完整；静态类型不冒充运行时授权
- 未执行TypeScript SDK；本轮为全文机制及命令路径审校，作者语法记录不替代真实运行

### Vue 技术栈深讲

[打开课程](./frontend/vue.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：脚手架路径/实际脚本与原测试范围未交代清，易在本仓库覆盖App或误称新组件已测试。
- 初评：旧请求故障只要求自行写mock，无完整注入/取消/回收实现。
- 初评：缺少响应连接、编译宏、浅响应和异步资格的独立判据。
- 修订：补个人空项目路线、src/App替换、npm run核对与Vitest一次运行，说明脚手架旧测试非新App验收。
- 修订：新增完整300/20ms可切guarded的竞态SFC，支持取消、资格与卸载回收并明确模拟边界。
- 修订：新增五层通关覆盖响应、key、生命周期、SSR/容量与版本。

**八项正文证据**

- 前置与路线：作者复评通过。“基础实验：Vue 3 + TypeScript 事件看板”交代独立项目/共享路线、运行时、文件与实际脚本。
- 机制与状态：作者复评通过。“响应式依赖图怎样建立”“版本边界课堂：同样写解构，为什么结果不同”解释track/trigger与3.5宏范围。
- 基础实验：作者复评通过。“基础实验：Vue 3 + TypeScript 事件看板”完整筛选App、输入/0条预期、检查与恢复。
- 故障实验：作者复评通过。“故障实验：响应丢失、竞态与 cleanup”含可运行解构及完整竞态SFC，单条件故障/修复/回收。
- 生产取舍：作者复评通过。“生产设计题：多团队 Vue 事件控制台”“SSR、hydration 与跨请求隔离”“升级、发布与回滚”覆盖状态、安全、容量与制品。
- 递进面试：作者复评通过。“面试表达”“Vue 项目答辩课堂：从一个组件走到可维护的系统”有watch/nextTick/所有权深入答案。
- 独立通关：作者复评通过。“独立通关：响应连接、异步资格和组件身份三条线”有快照/toRef、反转延迟、资源十次、SSR/宏判据。
- AIOps 与证据：作者复评通过。“AIOps 场景”“可观测性”连接实时告警缓冲、errorHandler/release/trace与受控操作。

**验证边界**

- syntax：用仓库共享实验的@vue/compiler-sfc对新增完整竞态SFC的script setup和template编译通过。；限制：未运行vue-tsc或浏览器点击/卸载；编译不等于真实竞态、网络取消、SSR或性能测试。

第二位审校者：data-observability；日期：2026-10-12。

- 全文955行独立审校：固定共享路线与独立脚手架路线分开，实际脚本/原脚手架测试不冒充新App行为测试
- 完整300/20ms合成竞态区分guarded故障/恢复与真实Fetch；清理watch/onUnmounted，KeepAlive、浅响应与3.5 props编译转换边界清楚
- 五项通关有响应触发预测、列表身份、SSR请求隔离、缓冲/旧chunk与整包回滚；未执行Vue SDK或浏览器

### Apache Tomcat 技术栈深讲

[打开课程](./middleware-application-platform/tomcat.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：固定7月补丁快照易被误当当前安全版本；安装configtest失败后命令仍可继续。
- 初评：多实例拓扑画成串联；ss子串匹配8080可能混入18080；故障文件创建与Compose归属前置不完整。
- 初评：缺少独立条件变化、连接预算和口述判据。
- 修订：标明历史版本边界、校验失败停止、前台Windows启停与Linux日志跟随不同。
- 修订：重画并列实例，精确端口过滤，补新目录/项目/端口/文件准备与故障文件操作。
- 修订：新增挂载改变Context、XML故障收回、并存JDBC预算和命名空间口述五关。

**八项正文证据**

- 前置与路线：作者复评通过。“入门实验：运行一个可观测的 Tomcat 应用”的前提检查Docker/端口/Compose归属、文件名和共用准备。
- 机制与状态：作者复评通过。“核心原理”“生产拓扑”区分请求路由、并列副本与独立状态。
- 基础实验：作者复评通过。“入门实验：运行一个可观测的 Tomcat 应用”给完整Compose/XML/JSP和响应/日志判据。
- 故障实验：作者复评通过。“故障注入实验：让 Tomcat 进程活着但应用部署失败”给覆盖、同次日志、恢复与项目级回收。
- 生产取舍：作者复评通过。“容量与性能”“安全”“升级、回滚与兼容性”覆盖队列、依赖预算、状态兼容和受控回退。
- 递进面试：作者复评通过。“面试题与递进追问”“老师带你串起来：从第一次 JSP 请求到生产发布”有机制与事故答案。
- 独立通关：作者复评通过。“独立通关：把‘容器活着’和‘应用可用’分开验收”含200/挂载路径变化/故障/90→180预算/三分钟判据。
- AIOps 与证据：作者复评通过。“在 AIOps 中的作用”连接请求、线程、依赖、日志链路与受控自动化。

**验证边界**

- syntax：14个PowerShell代码围栏用本机PowerShell解析器检查无语法错误；差异空白检查通过。；限制：未拉取固定Tomcat镜像、启动Docker/JSP或实际注入XML故障；配置语义和预期按文中边界审理，不声明生产验收。

第二位审校者：data-observability；日期：2026-10-12。

- 全文1417行审读：Coyote/Catalina/Jasper/Valve过滤器与容器层级、线程连接OSbacklog、应用类加载委派例外及JNDI池预算准确
- 完整只读ROOTJSP/本机端口与Compose归属，坏web.xml嵌套挂载故障及撤覆盖重建复测；启动完成不等Context可用/AccessLog缓冲有排查，未声称Docker实跑
- 独立请求ID/ROOT改orders/部署失败证据/三实例90并存180超过120/JavaSE javax.sql不可盲改/粘性非备份均有判据；回滚不撤数据库数据，shutdown端口=-1边界明确

### IBM WebSphere 技术栈深讲

[打开课程](./middleware-application-platform/websphere.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：产品versionInfo/historyInfo误写在Profile/bin，角色命令看似在同一Profile顺序执行。
- 初评：最小更新脚本未验证准确应用/文件和工作区干净；Liberty端口与备份防覆盖缺命令。
- 初评：缺ND状态题和本地Liberty/真实传统生产的独立通关界限。
- 修订：修正产品二进制工具路径、引用路径与按角色选命令。
- 修订：更新脚本补文件、应用清单、未保存变更门禁，说明wsadmin Jython非Python3；补Liberty准备/端口/创建失败/备份检查。
- 修订：新增六张回执、WARN/FAIL、部分节点旧版、连接预算与CU失败工作区口述五关。

**八项正文证据**

- 前置与路线：作者复评通过。“Traditional 安装边界”“入门实验：运行 Open Liberty 健康端点”区分产品/Profile、角色、终端/文件和Docker端口。
- 机制与状态：作者复评通过。“核心原理”“小白必须先懂的部署对象”区分请求/主仓库同步/发布及BLA/CU/Asset。
- 基础实验：作者复评通过。“入门实验：运行 Open Liberty 健康端点”有完整server.xml、固定摘要、Ready和health验证。
- 故障实验：作者复评通过。“故障注入实验：制造 Feature 配置错误”有备份、错误Feature证据、相同摘要恢复与清理；不冒充ND实验。
- 生产取舍：作者复评通过。“EAR 更新与部署：从发布门禁到故障闭环”“容量与性能”“升级、回滚与现代化”覆盖状态、安全、恢复审批。
- 递进面试：作者复评通过。“面试题与递进追问”“老师带你验收一次 EAR 更新：六张回执不能缺”有应用身份/事务/绑定答案。
- 独立通关：作者复评通过。“独立通关：六张发布回执与两种运行时不能混在一起”要求本地实测与ND推演分栏，含预测/故障/320与400预算/工作区口述。
- AIOps 与证据：作者复评通过。“把 EAR 发布接入 AIOps”“在 AIOps 中的作用”按stage和版本收敛关联观测，不自动删除仓库对象。

**验证边界**

- syntax：8个PowerShell围栏解析无错误；检查路径及Jython工作区前置控制流程。；限制：无授权traditional ND/IBM Java环境，未执行EAR更新、删除、同步或手工恢复；未启动Liberty容器。Jython未在wsadmin解释器运行。

第二位审校者：data-observability；日期：2026-10-12。

- 全文1888行审读：traditional ND与Liberty分离；EAR分析/Save/Sync/分发展开/逐成员运行/插件入口/业务六回执，DMgr主仓库与Node副本状态边界清楚
- 本机Liberty同摘要mpHealth→无效Feature→恢复闭环，WARN仍Ready不等Feature成功；传统CU受支持删CU再空BLA/save，raise非撤回/reset仅未提交/save超时未知，手工隔离限定两绝对路径/父级链接/非原子移动及全Cell审批
- 独立题成员版本差异/四池320并存400超240/未决XA日志非缓存/配置ZIP非业务备份具技术判据；本轮未运行Docker、ND、真实EAR或仓库修复，不混用压缩EAR与平台展开目录哈希

### Alertmanager

[打开课程](./observability/alertmanager.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：开场把 up=0 直接说成机器宕机，采集失败和主机故障的证据边界混淆
- 初评：Bash 诊断脚本用 \|\| true 吞掉 HTTP/网络错误，可能以成功退出掩盖采证不完整
- 初评：没有技术专属的独立通关任务，既有清单仍以自我声明为主
- 修订：新增开课准备，解释本机与容器地址、三终端分工及 PowerShell/Bash 差异
- 修订：纠正 up=0 证据边界；诊断脚本改为超时、HTTP 错误非零并停止
- 修订：加入五项路由、投递、故障、跨租户抑制及状态口述任务和判据
- 修订：交叉反馈修复本机变式路由三个回环地址、校验与重载及新实例事件

**八项正文证据**

- 前置与路线：作者复评通过。开课准备：先选清楚要跑哪一条实验路线，明确进程、端口、标签与操作系统
- 机制与状态：作者复评通过。路由推演：同时属于数据库团队和严重告警，该发给谁；时间实验：第一条通知为什么不是立刻发
- 基础实验：作者复评通过。AIOps 入门实验，文件名、三个进程角色、发送与接收证据完整
- 故障实验：作者复评通过。独立通关：证明告警为什么走到这个接收器，停止教学接收器后采集三段证据并恢复
- 生产取舍：作者复评通过。高可用与容量：多副本保护哪一层；升级与回滚工作坊：格式通过不代表行为相同
- 递进面试：作者复评通过。面试加练：怎样设计三团队共享的通知平台，以及独立通关口述追问
- 独立通关：作者复评通过。独立通关：证明告警为什么走到这个接收器，五项可判定任务并标明待验证边界
- AIOps 与证据：作者复评通过。Alertmanager 在 AIOps 链路中的位置；Webhook 接收端：返回成功之前要承诺什么

**验证边界**

- reasoned：全文复核通知状态、路由、抑制边界和新增任务的答案判据；限制：未运行真实 Alertmanager、Prometheus 或外部通知渠道

第二位审校者：cloud-automation；日期：2026-10-12。

- 全文审阅及返修复核：最小接收器、路由优先与continue、静默/抑制/HA/幂等边界完整；通关变式已显式用本机三个URL、校验并重启加载、新标签事件比较及恢复，首跑地址缺口已消除。未把通知设计推演作真实发送验收。

### Elasticsearch

[打开课程](./observability/elasticsearch.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：match 示例未说明默认词项或关系，容易把任一词命中误当完整短语
- 初评：故障实验只打印异常且直接修复，缺少拒绝后计数和 HTTP 状态证据
- 初评：磁盘满表格直接列删除而无保留责任和可恢复性约束
- 初评：诊断脚本未说明文件名、终端和索引尚未清理前提
- 初评：缺少新输入和反例的独立通关
- 修订：解释 match 默认组合、and 与短语边界并链接官方查询文档
- 修订：故障步骤增加失败状态和失败后计数，解释刷新前提
- 修订：磁盘处理增加保留审批、快照恢复和临时空间边界
- 修订：补全 diagnose-es.sh 保存与 Bash 运行路线
- 修订：新增五项专属通关：三种全文条件、刷新成功点、字段故障闭环、16000GB 容量保护、三类部分成功
- 修订：交叉反馈为按服务统计错误加入level:error过滤和缺失字段口径

**八项正文证据**

- 前置与路线：作者复评通过。“老师先带你认路”“安装与启动：Windows 隔离课堂”说明 Docker、2GB 容器预算、端口冲突保护与 PowerShell 运行位置；诊断另标 Bash。
- 机制与状态：作者复评通过。“再走一遍写入路径：为什么有几个不同的成功点”“分散执行、集中合并为什么影响统计答案”区分确认、搜索刷新、逐项失败与分片合并。
- 基础实验：作者复评通过。“基础实验：先写合同，再比较全文与精确查询”提供映射、写入、查询、分析器和大小写反例的完整 PowerShell 步骤及清理。
- 故障实验：作者复评通过。“故障实验：字段类型错误，不是服务宕机”新增 HTTP400、失败计数不变、映射和健康反证；同标识修复后计数二。
- 生产取舍：作者复评通过。“容量设计：不要只问有多少 GB”“生产设计题：每日两百 GB 日志，保留一个月”涵盖分片、副本故障域、快照隔离恢复、权限和升级不可原目录降级。
- 递进面试：作者复评通过。三组“面试题”与生产设计、事故题给机制、取舍和追问；“事故题：发布后错误率下降，为什么反而需要警惕”给出失败写入反例。
- 独立通关：作者复评通过。“独立通关：搜到了，是否真的回答了业务问题”五任务改变输入、刷新条件和字段错误，答案含可观测判据、反例和回看章节。
- AIOps 与证据：作者复评通过。“Elasticsearch 在 AIOps 链路中的位置”“AIOps 自动化诊断脚本”“学习证据”连接日志检索、告警上下文与脱敏脚本证据，禁止原始敏感日志公开。

**验证边界**

- reasoned：逐篇全文审读 1710 行后针对查询语义、拒绝计数、脚本运行前提和五项任务做因果复评；容量算式复算。；限制：未启动 Elasticsearch，产品 HTTP 状态、分词、刷新和 Docker 兼容由隔离环境实测确认。
- reasoned：核对 Elastic 官方 match 与 refresh 参数文档，保留固定历史教学版本边界。；限制：官方当前文档不能证明本机镜像可运行或生产版本安全维护状态。

第二位审校者：cloud-automation；日期：2026-10-12。

- 全文审阅及返修复核：字段合同、搜索/实时GET/持久性、两文档400恢复、Bulk/部分分片/桶截断、版本恢复和五项独立任务完整；Aggregations已补range+level:error过滤及缺失字段不入错误分子定义，查询与教学业务问题一致。未声称实际启动Elasticsearch。

### Grafana 精讲

[打开课程](./observability/grafana.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：操作路线分散且多次使用同名容器，首次学习容易混跑安装方式
- 初评：部分数据源 URL 示例缺少协议；后续架构和布局图仍有全英文分支
- 初评：结尾以能讲一遍作为掌握结论，缺少独立改变条件与原始证据判据
- 修订：增加开课准备与唯一首跑路线、Docker 就绪和操作系统说明
- 修订：补全数据源协议与架构、四层布局图中文解释
- 修订：新增多选插值、单位故障、容量和权限取舍五项独立通关，并撤去掌握承诺
- 修订：交叉反馈修复80查询/s为理想基线和发布图两标签中文

**八项正文证据**

- 前置与路线：作者复评通过。开课准备：先把一个数从来源追到画面，明确 Docker、端口、单行命令和首跑路线
- 机制与状态：作者复评通过。架构和数据流；变量是筛选工具，不是授权边界；单位和聚合会改变你看到的故事
- 基础实验：作者复评通过。入门实验：Prometheus 健康 Dashboard，十步完成启动、面板、导出、导入与清理
- 故障实验：作者复评通过。故障模拟：数值零点二，究竟应该显示多少；独立通关要求逐层记录单位错误并恢复
- 生产取舍：作者复评通过。查询容量课堂：每个刷新按钮背后都有工作量；多实例与恢复：复制容器并不自动复制仪表盘
- 递进面试：作者复评通过。面试课堂：30 秒与 3 分钟；独立通关三类差异故障口述
- 独立通关：作者复评通过。独立通关：这张绿色面板有没有说错话，五项专属实验和判据
- AIOps 与证据：作者复评通过。AIOps dashboard 设计方法，以用户影响到证据下钻而不是堆资源图

**验证边界**

- reasoned：逐篇全文复核；核对 Grafana 官方 Prometheus 数据源配置，手算无缓存查询率为 80 次/秒；限制：未启动真实 Grafana、Prometheus 或验证实际权限与告警

第二位审校者：cloud-automation；日期：2026-10-12。

- 全文审阅及返修复核：本机隔离网络自监控三面板、UID/变量/单位/缺失、HA配置与恢复完整；80查询/s已明确无缓存理想基线而非上下界；Annotations图已有准确中文，独立五项能检验预测、证据与设计边界。

### Grafana Loki

[打开课程](./observability/loki.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：原生二进制下载到当前目录但命令写为 loki，依赖未说明的 PATH
- 初评：对比表用通常更低概括成本，弱化了正文已有的查询与基数条件
- 初评：缺少独立改变时间/标签、格式错误及历史读路径的综合通关判据
- 修订：增加开课准备和双终端/操作系统说明，三个启动命令改为当前目录 ./loki
- 修订：成本对比改为明确工作量与条件
- 修订：新增三条日志复现、标签/窗口反例、格式错误、900 流设计与旧数据故障口述任务
- 修订：交叉反馈拆开Bash默认LogQL避免显式参数多出花括号；明确完整marker占位

**八项正文证据**

- 前置与路线：作者复评通过。开课准备：先找三条日志，再讨论整个平台，交代 Python、两个终端和当前目录启动
- 机制与状态：作者复评通过。Chunks 和 index；写入路径；查询路径；高阶精讲：把“能查日志”升级为“能运营日志平台”
- 基础实验：作者复评通过。AIOps 入门实验，当前纳秒、正文标记、三条/两条检索断言和清理完整
- 故障实验：作者复评通过。3. 故障注入：写错一个标签为何变成零条；独立通关加入时间与格式反例
- 生产取舍：作者复评通过。生产模拟：一场日志洪峰为什么会拖慢整个值班台；五、升级的难点是历史数据仍然能读
- 递进面试：作者复评通过。七、用三分钟经得住面试追问；独立通关三类失效层口述
- 独立通关：作者复评通过。独立通关：查不到日志时能否证明是哪一层，五项操作/推演与判据
- AIOps 与证据：作者复评通过。Loki 在 AIOps 链路中的位置；三、日志指标的“二”并不自动代表两个失败请求

**验证边界**

- reasoned：全文复核配置、Python 标准库客户程序与查询；核对 20*3*5*3=900 的教学流数；限制：未启动 Loki；实际写入、查询、格式故障、Schema 升级均待读者或后续演练环境验证

第二位审校者：cloud-automation；日期：2026-10-12。

- 全文审阅及返修复核：标签/流/索引/时间、3条写入与2条ERROR、WAL/副本/保留/Schema、900流与背压预算完整；Bash显式第二参数额外花括号已拆默认字符串修复，marker占位改为完整值。旧错误在Git Bash实际复现，不把模型或静态审校称为真实Loki集群测试。
- 签后增量再审：成本对比改按实际索引/扫描/对象请求核算，诊断curl添加HTTP失败与10秒超时、Bash set -e遇错停止，旁文区分采集失败与成功零结果；核对当前完整脚本后重签。

### OpenTelemetry

[打开课程](./observability/opentelemetry.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：手动埋点 Python 片段的外部变量/SDK 前置未明确，易被当独立脚本
- 初评：Linux 挂载路径仅口头要求替换，首跑完整命令缺失；环境变量赋值与导出混读
- 初评：诊断脚本吞掉所有 kubectl 错误；debug 单分支观测被说成应用到 Collector 没问题
- 修订：新增双路径课程准备，标明参考片段和完整首跑的区别
- 修订：交代手动片段依赖、跨系统环境设置，补 Bash 完整容器启动
- 修订：诊断脚本失败停止并说明空资源语义，收窄 debug 证明范围
- 修订：新增父子关系改动、路径故障、队列/采样设计与安全口述五项通关

**八项正文证据**

- 前置与路线：作者复评通过。开课准备：业务请求和遥测请求分两条线，明确 Docker、Python、终端分工和片段依赖
- 机制与状态：作者复评通过。Span 的父子关系不是按日志时间猜出来的；Collector 配置结构；第三站：指标的累计与增量，决定后端怎样算
- 基础实验：作者复评通过。AIOps 入门实验，完整 YAML、PowerShell/Bash 启动、OTLP JSON 和逐 ID 验证
- 故障实验：作者复评通过。5. 故障注入、恢复与清理；独立通关提供 trace ID 改动与 404 反例
- 生产取舍：作者复评通过。第六站：容量保护不能保证数据永远不丢；第七站：升级把字段改了，谁会受到影响
- 递进面试：作者复评通过。第八站：面试官要的是一条有证据的诊断链；独立通关双路径口述
- 独立通关：作者复评通过。独立通关：两段跨度是否真的属于同一次请求，五项带具体通过条件
- AIOps 与证据：作者复评通过。OpenTelemetry 在 AIOps 链路中的位置；采样后 RED 分母与数据新鲜度的边界

**验证边界**

- reasoned：全文复核；手算 60000/(2000-1500)=120 秒；审查完整 OTLP 客户程序与路径恢复；限制：未运行 Collector、语言 SDK、Kubernetes 或持久后端；传播和后端验收仍需真实环境

第二位审校者：cloud-automation；日期：2026-10-12。

- 全文审阅：业务上下文传播与遥测导出分两线、API/SDK/Collector后端分工、采样与队列状态、双导出/部分成功/字段升级完整；合成OTLP两跨度实验含HTTP200及partialSuccess、错误路径404恢复、父子标识核验与专属容器清理。独立任务区分真实协议与SDK传播/后端未运行边界。

### Prometheus 精讲

[打开课程](./observability/prometheus.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：高级实验 Linux 安装/启动路线只转交其他篇，缺少对应虚拟环境与宿主网关命令
- 初评：固定 2026-07-02 的范围查询易在当前课堂得到空结果；流量生成未检查传输失败
- 初评：部分后续数据流只有英文，末尾把能口述等同于已经理解
- 修订：增加开课准备、Bash 虚拟环境及 Linux host-gateway 完整启动并解释边界
- 修订：范围查询改为标准库生成最近一小时并处理错误；流量失败立即停止
- 修订：补图解中文与五项分母、重置、缺失、基数、端到端通关，删除掌握承诺

**八项正文证据**

- 前置与路线：作者复评通过。开课准备：先说清这个数字究竟在数什么；第 2 步：创建 Python demo 的操作系统命令
- 机制与状态：作者复评通过。数据模型；向量匹配：两边都查得到，为什么相除却为空；查询时钟课堂：瞬时查询为什么还能拿到稍早的样本
- 基础实验：作者复评通过。AIOps 入门实验：监控一个 demo 应用，完整文件、启动、抓取、有限流量与查询
- 故障实验：作者复评通过。第 8 步：验证规则，停止课堂程序与恢复；独立通关比较 up=0 和目标缺失
- 生产取舍：作者复评通过。远端写入与恢复：队列能缓冲，不代表永远不会丢；多集群设计题：让监控在事故中仍可用
- 递进面试：作者复评通过。面试课堂：30 秒到 3 分钟；独立通关错误率和三时钟追问
- 独立通关：作者复评通过。独立通关：这个错误率有没有正确的分母，五项可复算和可观察判据
- AIOps 与证据：作者复评通过。Prometheus 在 AIOps 链路中的位置，数据输出保留窗口、单位与缺失状态

**验证边界**

- reasoned：全文复核；核对 Docker 官方 host-gateway 用法；手算 1/1000=0.1% 与每天 57600000 样本；限制：未运行 Docker、Prometheus 或应用抓取；Linux 现场网络连通仍需按目标环境验证

第二位审校者：cloud-automation；日期：2026-10-12。

- 全文审阅：指标合同、重置、分母匹配、直方图聚合、三种时钟、缺失/零、重标记碰撞与远端恢复边界完整；固定课堂含隔离环境、Python库、Docker宿主网关、80/20已知输入、失败抓取pending/firing及恢复；独立五题有0.1%与5760万样本可判定答案。未把规则触发当通知送达。

### VictoriaMetrics

[打开课程](./observability/victoriametrics.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：remote_write 片段的配置归属和容器服务名未说明，可能当作可直接执行的完整路线
- 初评：基础查询缺少顶层 status 判断
- 初评：磁盘增长处理简写可能引导无审批缩短保留或删除碰撞标签
- 初评：vmalert 不通知未明确空结果、查询失败、通知失败三个状态
- 初评：缺少改变标签、时间和净排空条件的独立任务
- 修订：注明 remote_write 只是 prometheus.yml 顶层片段和网络名称前提，主线保持文本导入
- 修订：基础查询增加 status 成功检查
- 修订：磁盘建议补保留不可逆、安全扩容和标签身份约束
- 修订：补规则链三类失败证据与本课堂未启动通知组件边界
- 修订：新增五项通关：两实例求和、采集副本身份、二十分钟迟到、21600MB/90分钟恢复预算、三类空白口述

**八项正文证据**

- 前置与路线：作者复评通过。“老师先带你认路”“安装与启动”说明 Windows PowerShell、Docker Linux 容器、8428、内存和自有对象冲突保护；remote_write 非独立路线另有说明。
- 机制与状态：作者复评通过。“存储课堂：同一个数字为什么有不同的可信程度”“高可用课堂：复制、去重和扩容必须一起推演”解释索引、缓冲持久化、序列身份及历史不自动均衡。
- 基础实验：作者复评通过。“入门实验”提供实际文本导入、状态检查、零偏移查询和标签值验收；“清理与证据保留”限定课堂容器和卷。
- 故障实验：作者复评通过。“故障实验：补传成功，当前窗口仍然为空”固定毫秒事件与秒级评估时刻，对比两窗口、修复查询并区分迟到根因；明确非网络/集群故障。
- 生产取舍：作者复评通过。“多租户、安全与恢复课堂”“生产设计题：三地采集，一地查询，关键告警不能误报健康”涵盖租户非认证、持久队列、复制节点边界、快照恢复与升级格式兼容。
- 递进面试：作者复评通过。“面试课堂：30 秒、3 分钟和连续追问”及三组面试、旧节点满盘事故题给定义到恢复的递进答案。
- 独立通关：作者复评通过。“独立通关：同一条曲线到底代表了谁、哪个时间”改变业务实例、标签身份、迟到窗口和速率，每项有预期、反例和回看章节。
- AIOps 与证据：作者复评通过。“在 AIOps 中的作用”“空值、过旧、部分响应分别怎样进入告警”明确长期分析、新鲜度与不完整结果不能作为健康零；学习证据含查询与恢复记录。

**验证边界**

- reasoned：全文审读 837 行，复评两实例标签身份、缓冲净速率与两窗口迟到因果；数值计算复核。；限制：未启动 VictoriaMetrics、vmagent 或 vmalert；真实导入、去重、部分响应、恢复和固定版本兼容未实测。

第二位审校者：cloud-automation；日期：2026-10-12。

- 全文审阅：单机/集群入口、复制与去重、历史不自动再分布、持久队列/恢复净速率、MetricsQL边界、部分响应/租户/备份清楚；首跑回环端口/新卷、latency_offset=0和30秒默认边界、迟到样本双时间窗与清理明确。五项独立判据有可核算21600MB/90分钟答案，不冒称集群实测。

### Zabbix 深讲

[打开课程](./observability/zabbix.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：Compose 误用未受支持的 ZBX_SERVER_ACTIVE 名称，且课堂被动采集与主动设置混杂
- 初评：安装没有明确 PowerShell、Linux 容器、Compose 子命令检测
- 初评：运行时 Server 命令易被粘到宿主机；sender 失败无限重试缺少响应丢失边界
- 初评：down -v 清理未核对当前项目与数据卷
- 初评：缺少回差边界、采集停止旧值、实际样本覆盖的独立任务
- 修订：根据官方镜像变量文档改为本课关闭主动检查，并解释 ZBX_ACTIVESERVERS 与 ServerActive 映射
- 修订：补系统、运行位置、容器 localhost、Compose 检查和未实测标识
- 修订：补容器内 runtime 调用和 sender 有限重试/业务幂等边界
- 修订：清理前核对课堂目录、Compose 对象和精确数据库卷
- 修订：新增五项通关：500/501/400/300/299 回差、窗口覆盖、停自有 Agent 复测、3168000 行/17600秒预算、四层故障口述

**八项正文证据**

- 前置与路线：作者复评通过。“从零搭建实验环境”明确 Windows PowerShell、Linux 容器、4GB、端口、目录冲突、Compose 检测和两个文件的保存位置；基础操作说明 DNS 是内部服务名。
- 机制与状态：作者复评通过。“核心数据模型”“数据从采集到告警的完整路径”“状态、一致性与故障边界”说明预处理、缓存、触发恢复、配置同步和 Proxy 模式，不承诺同步串行。
- 基础实验：作者复评通过。“基础实验：从一个数字到一条恢复事件”提供写入文件、本地 key 测试、完整主机/item/trigger 菜单设置、时间与数值验收及限定清理。
- 故障实验：作者复评通过。“故障注入实验：制造高延迟并验证恢复”定义 900→100、问题恢复证据；独立任务三补停止自有 Agent、两假设、旧值反证和重新采集复测。
- 生产取舍：作者复评通过。“容量与性能规划”“生产高可用设计”“安全边界”“升级与回滚”涵盖 NVPS、共享 DB 单点、代理缓冲、权限与数据库 schema 回滚。
- 递进面试：作者复评通过。“面试速答”“生产设计题：三地 5000 台设备怎么设计”“事故题：全网 40% 主机突然不可达”有定义、内部路径、取舍、诊断和升级追问答案。
- 独立通关：作者复评通过。“独立通关：页面还绿着，数据是否仍然新鲜”五题改变阈值边界、窗口覆盖和故障位置，判据说明事件≠通知与实测/纸面边界。
- AIOps 与证据：作者复评通过。“Zabbix 在 AIOps 中的落地方式”“GitHub 学习证据”明确原始值、模型版本、特征窗口、审批/幂等/复测回写；禁止凭据设备拓扑公开。

**验证边界**

- reasoned：全文审读 1556 行；复算 220NVPS、3168000 缓冲记录和17600秒净排空，检查回差五个边界状态。；限制：未启动 Docker/Zabbix，镜像拉取、挂载、前端具体菜单与恢复事件待隔离实测。
- reasoned：核对 Zabbix 官方 Docker Hub Agent2 环境变量和7.4触发表达式文档，纠正容器参数名与主动/被动路线。；限制：官方当前镜像说明不是本机固定标签实际生效配置证明；特定历史标签仍须读取配置与日志确认。

第二位审校者：cloud-automation；日期：2026-10-12。

- 全文审阅：Agent主动/被动、模板宏/依赖项、Item到事件/动作、history/trends、Proxy三种缓冲与数据库HA边界完整；Compose与本机DNS步骤、100/900恢复、500/501/400/300/299回差、旧值采集停止证据和清理明确；独立220NVPS/3168000记录/17600秒排空可核算，未把事件当通知。

### JumpServer 技术栈深讲

[打开课程](./security-compliance/jumpserver.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：固定v4.10.18已落入后来官方Access Key泄露公告影响范围，旧安全下限不足。
- 初评：准备默认已会Linux虚拟机；grep ':22'可能误把2223计为22端口监听，apt更新失败未停止。
- 初评：原检查单不能验证授权范围扩大、协议容量和泄露后的恢复决策。
- 修订：升隔离课堂到v4.10.19-ce，标出v5已发布但本文不套用v5，核验installer发布资产、静态版本和服务组/Socket源码。
- 修订：补入口与SSH/RDP/WebSocket基础，精确ss过滤两端口并在更新失败停止。
- 修订：补用户角色/节点扩权/单区失败/录像容量/泄露轮换五关。

**八项正文证据**

- 前置与路线：作者复评通过。纸面授权先行，实际安装限定两台新隔离LinuxVM和准备入口，零基础不在Windows跑安装器。
- 机制与状态：作者复评通过。User/Asset/Account、Core到各Connector及数据库/Redis/录像/密钥恢复单位解释清晰。
- 基础实验：作者复评通过。固定安装器下载校验、初始化、六步访问审计有预期、失败链和回收顺序。
- 故障实验：作者复评通过。单资产错误端口不改真实sshd，22/2223对照、Koko日志、恢复会话与审计验证。
- 生产取舍：作者复评通过。长连接LB、共享状态HA、协议容量、Socket主机信任、凭据轮换和数据库回退边界。
- 递进面试：作者复评通过。八组递进追问与LB事故/5000资产设计有机制取舍和保留未知范围。
- 独立通关：作者复评通过。五关改变用户/节点/网区与录像数据，新容量给单位和副本定义，不许镜像回退掩盖泄露。
- AIOps 与证据：作者复评通过。访问/权限/审计事件进AIOps调查、变更和RCA，不让模型分数自动断全网；学习证据脱敏。

**验证边界**

- reasoned：全文走读；gh核对2026-10-12发布与GHSA-6rp5公告及v4.10.19安装器资产、static.env、service.sh、core.yml。；限制：固定版本只解决已核对公告的影响线，不保证无其他漏洞或所有平台兼容。
- syntax：本文10个Bash围栏经Git Bash -n语法检查通过。；限制：未运行Linux安装器、JumpServer、目标SSH或真实网络与审计；预期仍待隔离实跑。

第二位审校者：foundation-frontend；日期：2026-10-12。

- 全文复核。官方GHSA-6rp5-ff2m-qfrm核实v4修复下界4.10.19-lts及疑似泄露需轮换；固定v4安装器与v5/许可边界分开，没有把固定版当永远安全。下载安装使用新临时目录，旧安装/数据和同名目标账号存在时停止，不覆盖或改密。
- 基础SSH身份-授权-账号-连接-审计与错误端口恢复路径闭合，说明普通js-lab仍能写自身家目录不是强制只读沙箱；精确ss端口、主机名不等于资产名、存量会话撤权待实测。数据库/Redis/密钥/录像恢复单元和维护窗口数据库迁移而非零停机回滚讲清。
- 五关角色与连接分离、节点3扩5潜在扩权、单网区超时证据、录像日16.48GiB/180日2.90TiB/两完整副本5.79TiB复算通过，以及旧凭据不作安全回滚目标。无两台隔离Linux虚拟机，安装器、资产访问、故障恢复与商业功能均未实跑；本次为全文机制/命令静态审查和官方公告核对。

### 网络安全等级保护（等保 2.0）深讲

[打开课程](./security-compliance/mlps.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：采集脚本部分PowerShell命令失败后仍生成文件与哈希，需人工才能发现缺口。
- 初评：WAF/IAM等前置术语与平台命令混入零基础路线；缺技术专属独立迁移判据。
- 修订：补分层路线、准备入口和安全工具类别释义，核对修正法和现行定级/基本要求入口。
- 修订：采集函数逐项捕获终止与非终止错误，另存状态/原因，不把空文件计成功。
- 修订：增加边界变动、覆盖分母、合成采集失败、可信摘要与撤权事故五关。

**八项正文证据**

- 前置与路线：作者复评通过。从三项合成资产与文本编辑器起步，Windows取证为下一层，不要求搭集群。
- 机制与状态：作者复评通过。保护对象到控制/证据/整改及身份、网络、日志、恢复五段机制含观察与故障。
- 基础实验：作者复评通过。纸面证据表与Windows只读证据包有精确操作、预期、失败状态、隐私和清理。
- 故障实验：作者复评通过。调岗/日志迁移模拟及采集失败关卡保留原记录、修复复核、不改真实权限。
- 生产取舍：作者复评通过。共享责任、持续控制、采集平台自身HA/容量/最小权限和变更重评边界明确。
- 递进面试：作者复评通过。递进答案与生产设计/离职账号事故说明证据、反证、修复影响与回退。
- 独立通关：作者复评通过。五关按120/150源算75%/60%，哈希同改反例与权限链核验可判定。
- AIOps 与证据：作者复评通过。AIOps监控资产、漂移、日志失鲜、整改与模型权限，GitHub只公开合成/脱敏证据。

**验证边界**

- reasoned：全文走读，官方修正网络安全法第二十三/二十七条与GB/T22239/22240状态入口复核；覆盖率复算。；限制：未逐条法律审查或正式定级测评，不替代行业/属地/责任人意见。
- syntax：安全两篇合计3个PowerShell围栏解析及10个Bash围栏语法检查通过。；限制：语法不证明产品配置或真实权限有效。
- executed：正文采集函数使用模拟输出写入，正常、throw、非终止Write-Error三分支验证状态与失败原因。；限制：未采集本机安全数据，模拟文件I/O不证明真实落盘、访问控制与防篡改。

第二位审校者：foundation-frontend；日期：2026-10-12。

- 全文复核。网信办修正法全文核实第二十三条等级保护及不少于六个月网络日志、第二十七条应急义务，文章没有沿用旧条号或把自查当正式测评。五等级按侵害客体区分，云平台报告和租户责任不混淆。
- 正文Save-LabEvidence函数实际执行，用内存输出替换Out-File避免采集本机敏感信息；正常、模拟无权限、后续正常分别collected/failed/collected，失败未抹成成功。全部PowerShell段语法解析通过；目录、批次GUID、哈希清单自引用/来源真实性和脱敏再摘要边界合理。
- 五关覆盖新供应商边界、90/120=75%和90/150=60%、采集失败、同改文件清单的反例、调岗新连接/存量会话/绕过路径。未执行真实本机证据采集或正式测评，Linux/Kubernetes控制有效性亦未运行。

### AIOps 闭环

[打开课程](./sre-aiops/aiops-loop.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：场景开头列全套工具易被当作零基础必需前置。
- 初评：最小作品集实为未实现的多产品蓝图，且仅 Redis fingerprint 去重描述弱化持久正确性。
- 初评：缺技术专属新输入下的全链路通关判据。
- 修订：补初学分层路线与指标/日志/链路/模型释义、工具准备。
- 修订：蓝图明确非开箱工程，增加实际课堂入口，改为持久身份约束与事务发件箱/消费幂等边界。
- 修订：增加容量、乱序/旧手册、丢响应/模型失效和覆盖率五关。

**八项正文证据**

- 前置与路线：作者复评通过。开篇不要求先拥有所有产品；Node入口链接根目录与安装，蓝图区分实际存在的例子与待实现工程。
- 机制与状态：作者复评通过。“事件契约”“有限状态机”说明重复、乱序、跨系统缝隙、批准、租约与结果未知。
- 基础实验：作者复评通过。分类正常/泄漏课堂有精确命令、TP/FP/FN、手算与检查清理。
- 故障实验：作者复评通过。生产模拟给重复回调、资料过期/干扰文本、模型超时与业务验收失败，恢复与清理明确。
- 生产取舍：作者复评通过。容量成本、独立基础响应、租户权限、版本组合升级回退及外部副作用分开处理。
- 递进面试：作者复评通过。30秒/3分钟、队列不等于不重不丢、自评分不是概率、权限不是模型语气等递进答案。
- 独立通关：作者复评通过。独立通关要求最小切片、队列净增算术、旧证据反例和两租户可靠接收设计。
- AIOps 与证据：作者复评通过。全篇以观测到反馈主链组织，GitHub证据含真实与模拟标记、拒绝危险建议及独立验证。

**验证边界**

- reasoned：全文走读，队列吞吐与分类/覆盖率算例复算；检查蓝图与现有实验的实现边界。；限制：没有运行真实模型、队列、数据库或生产自动化，未声称运维成效。
- executed：本机 Node 正常/故障合成课堂已运行；事故证据课堂七项测试通过。；限制：只验证合成数据与内存流程，不代表真实产品、网络、持久性或生产验收。

第二位审校者：foundation-frontend；日期：2026-10-12。

- 已全文复核并执行aiops正常与时间泄漏：TP3/FP1/FN1、精确率/召回0.75，故障时间12>=10拒绝；仅检查时间分离、不假装训练模型。
- 持久接收后确认、Outbox双写缺口、租户事件身份、乱序当前状态、租约旧执行器隔离与批准内容绑定讲清机制；集成目录明确为蓝图而非现成启动工程。
- 五关容量600/分钟、20秒×并发10为30/分钟，十分钟净积压5700准确；回答60对54为90%且覆盖60%，过期引用/干扰文本/模型失效旁路与旧批准不重放均有可判定答案。真实事务、鉴权、API及队列未执行。

### 告警治理

[打开课程](./sre-aiops/alert-governance.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：离线实验未说明工具安装和仓库取得。
- 初评：分组间隔表述易被读成每个新事件独立倒计时，固定动作表格直接建议自动化。
- 初评：路由片段缺针对实际输入的接收者判据，末尾裸题无法检验跨统计单位判断。
- 修订：补可执行开课准备入口。
- 修订：修正周期通知语义和外部渠道配额边界，把机械动作改为受控自动化评估。
- 修订：在片段旁追踪 payment/page 的首命中结果，新增五项含反证与统计单位的通关。

**八项正文证据**

- 前置与路线：作者复评通过。“基础实验与故障实验”链接 Node 安装与根目录，说明不发送真实通知。
- 机制与状态：作者复评通过。“时间状态课堂”“路由合同课堂”及 Routing 片段逐层解释身份、状态、匹配顺序与去重边界。
- 基础实验：作者复评通过。四事件合成实验有正常三组、故障一组与拒绝判断，精确命令、失败检查和无资源清理。
- 故障实验：作者复评通过。分组丢租户、动态标签重置与路由四卡片含注入、复测及不触生产范围。
- 生产取舍：作者复评通过。“一万条规则如何安全演进”覆盖计算/通知容量、HA非严格一次、租户权限、版本及回退。
- 递进面试：作者复评通过。30秒、3分钟及漏报反例解释症状、风险、机制和模型建议不可直接删规则。
- 独立通关：作者复评通过。“独立通关”增加租户、时间线、路由故障、渠道容量和通知/事故两种分母判断。
- AIOps 与证据：作者复评通过。“AIOps 如何参与”及“学习证据”保留合成回放、标签规范、风险与漏报审查。

**验证边界**

- reasoned：全文走读；官方 Alertmanager configuration 经网页阅读核对 continue 首命中及 group_interval 周期语义。；限制：纸面与源码规则推理，不等于运行 Alertmanager 或投递渠道验收。
- executed：本机 Node 正常/故障合成课堂已运行；事故证据课堂七项测试通过。；限制：只验证合成数据与内存流程，不代表真实产品、网络、持久性或生产验收。

第二位审校者：foundation-frontend；日期：2026-10-12。

- 已逐段全文复核。实际执行alert正常3组与故障1组/unsafeTenantMerge=true，正文结果一致，明确不验证真实Alertmanager投递。
- 说明子路由顺序/continue、for时间而非样本数、动态标签重置身份、缺标签抑制风险；配置片段被明确限制为需接收器及租户环境校验的进阶示意。
- 五关含新增租户/级别分组的必要依赖条件、第三分钟重新计时到第六分钟触发、四类通知失效证据、限流设计及通知精确率20%/事故召回60%统计单位，判据充分。无真实渠道、HA或权限写入验证。

### 变更管理

[打开课程](./sre-aiops/change-management.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：离线实验隐藏工具和目录准备。
- 初评：变更候选伪代码引用未定义 changes，缺文件名、读取、运行与结果检查。
- 初评：原检查单不能检验时间边界、容量叠加与数据演进场景。
- 修订：接入开课准备并区分隔离集群进阶前提。
- 修订：提供完整三文件 Python 实验、时区拒绝、闭区间过滤、预期与清理。
- 修订：补独立通关的边界输入、容量/连接预算、缺数据门禁、金额迁移和未知任务追问。

**八项正文证据**

- 前置与路线：作者复评通过。开课准备与“最小启动检查”区分离线和现有集群前提、上下文权限与命名空间。
- 机制与状态：作者复评通过。“提交、执行与生效”“数据演进”解释漂移、中间状态、双写/回填风险。
- 基础实验：作者复评通过。Node 正常/故障及完整候选脚本有输入文件、精确命令、输出、失败分支与清理。
- 故障实验：作者复评通过。“被修改过的批准单”含批次漂移、超时未知、无指标三故障与停止/恢复/收回。
- 生产取舍：作者复评通过。“容量算术”“安全与制品身份”覆盖剩余容量、数据库连接、兼容、权限与不可逆回退。
- 递进面试：作者复评通过。高阶面试与独立通关有代表性灰度、哈希身份、数据库回退及因果反例答案。
- 独立通关：作者复评通过。五关要求真实保存并运行新文件、测试边界、解释共享故障和数据兼容，不靠绿色状态放行。
- AIOps 与证据：作者复评通过。AIOps关联按时间/范围/机制给候选，学习证据保留记录、兼容矩阵及课堂边界。

**验证边界**

- reasoned：全文走读、灰度与容量算例复算，三文件实验参数与清理审查。；限制：真实集群发布、数据库迁移及生产回退未运行。
- executed：本机 Node 正常/故障合成课堂已运行；事故证据课堂七项测试通过。 本文 Python 脚本 AST 与11项内存输入断言通过。；限制：只验证合成数据与内存流程，不代表真实产品、网络、持久性或生产验收。

第二位审校者：foundation-frontend；日期：2026-10-12。

- 已逐段全文复核。实际运行change正常0.001与故障0.059超额错误率，分别继续观察和停止评估，与课堂1个百分点门槛一致；继续观察未被夸大成可全量。
- 批准对象/制品/配置绑定、客户端超时不取消发布、部署修订不恢复数据库、双写/回填覆盖新值与缩容阶段讲清状态边界；只读kubectl前置和超时含义明确。
- 五关闭区间时间候选、发布再故障余500不足560、10副本连接500超450、兼容迁移与空监控停止条件答案成立。Python候选正文脚本用内存替换文件输入实际执行：正常候选、下界包含、下界前排除、缺时区拒绝四项通过；真实集群与数据迁移未运行。

### 事件响应

[打开课程](./sre-aiops/incident-response.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：基础实验依赖已安装 Node 与已下载仓库。
- 初评：内嵌 incident 模板仅写用户反馈停止增加，可能弱化正文主动业务验收要求。
- 初评：原检查单与题目缺新时间线、未知操作及并发事故下的独立判据。
- 修订：接入零基础实验准备。
- 修订：恢复模板增加代表性业务路径与历史未知请求/补偿接管。
- 修订：补五项时间口径、部分恢复、失联切流、三人双事故及恢复承诺通关。

**八项正文证据**

- 前置与路线：作者复评通过。“从零搭建响应台”讲角色与受控记录，离线实验链接 Node/目录前置。
- 机制与状态：作者复评通过。“同一句超时”与生命周期区分提交、回包、发生/采集/录入时间及恢复状态。
- 基础实验：作者复评通过。incident 正常与故障命令有4分钟发现、15分钟验收/null未知、检查与清理。
- 故障实验：作者复评通过。“回滚以后，还剩四十笔订单”给完整合成输入、数量守恒、未知补偿、恢复范围和清理。
- 生产取舍：作者复评通过。“事故平台自己不可用”讲独立依赖、应急权限、容量、交接与共同依赖动作协调。
- 递进面试：作者复评通过。30秒、3分钟、回滚未恢复及五项追问均包含答案和边界。
- 独立通关：作者复评通过。“独立通关”换时间线、地区缺流量、切流未知状态与并发事故角色分配，给判据。
- AIOps 与证据：作者复评通过。“从事故记录到 AIOps”只允许证据可追溯草稿，学习证据保留时间线与模拟标记。

**验证边界**

- reasoned：全文走读、时间差与合成订单守恒复核。；限制：没有真实通知、切流、回滚或补偿；课堂不能证明真实重大事故指挥能力。
- executed：本机 Node 正常/故障合成课堂已运行；事故证据课堂七项测试通过。；限制：只验证合成数据与内存流程，不代表真实产品、网络、持久性或生产验收。

第二位审校者：foundation-frontend；日期：2026-10-12。

- 已逐段全文复核。实际运行incident正常与故障：发现4分钟、业务恢复15分钟；缺验收为null/KEEP_INCIDENT_OPEN而非回滚完成即恢复。
- 1000笔被分成900已告知成功、60未写入、40已提交但丢响应，总数及接口10%与接受940口径闭合；补偿超时先查询任务和业务状态，不盲重试。
- 五关新增时间线发现6分钟、确认2分钟、恢复19分钟准确；无流量地区不算恢复，未知切流、三人双事故职责、紧急权限和残余影响接管有答案。纸面/合成不冒充真实事故指挥或补偿验收。

### RCA 根因分析

[打开课程](./sre-aiops/rca.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：Node离线前置缺具体下载/目录入口。
- 初评：学习证据硬性要求一个直接原因，可能诱导证据不足时编确定结论。
- 初评：已含独立交付，但缺改变权重/对照条件后的明确数值及拒绝判据。
- 修订：补实验准备入口。
- 修订：学习证据允许未定原因、反证与补采任务。
- 修订：增加分组权重、混杂、缺数据、防线验收与跨团队时间口径通关。

**八项正文证据**

- 前置与路线：作者复评通过。开篇课堂从连接等待解释概念，离线前提链接准备，机房实验明确Node22及不需要数据库。
- 机制与状态：作者复评通过。“沿一次请求”“因果推理”区分等待/执行、必要条件、反馈、触发与促成因素。
- 基础实验：作者复评通过。正常/缺因果/四行机房实验含输入、预期、手算、命令、失败保护与清理。
- 故障实验：作者复评通过。缺失机房实验拒绝全站结论；冲突批次、非法计数和重复导入测试覆盖故障分支。
- 生产取舍：作者复评通过。RCA助手设计覆盖证据版本、权限、模型失效、查询预算、影子升级回退与行动防线正反验收。
- 递进面试：作者复评通过。30秒/3分钟及因果、恢复、平均口径追问有机制与反例答案。
- 独立通关：作者复评通过。独立通关改变两机房权重后得到5%与2.75%，要求反证、未知出口与措施验收。
- AIOps 与证据：作者复评通过。事故知识库只收可追溯证据和审核结论，学习证据不强迫编造原因或生产履历。

**验证边界**

- reasoned：全文走读、四行权重与新任务计算复核，核对原因未定与业务恢复可分开管理。；限制：不连接真实监控或重现生产事故；因果课堂模型不能确认实际根因。
- executed：本机 Node 正常/故障合成课堂已运行；事故证据课堂七项测试通过。；限制：只验证合成数据与内存流程，不代表真实产品、网络、持久性或生产验收。

第二位审校者：foundation-frontend；日期：2026-10-12。

- 已全文复核，实际运行RCA课堂正常/因果证据不足与缺失机房，incident-evidence七项测试全通过；缺after/west时为INSUFFICIENT_COVERAGE而非全站好转。
- 分组前1.8%、后4.55%而组内均改善，改等权5000后5%/2.75%答案复算正确；请求/尝试/用户、采样覆盖、时钟误差、相关性与反事实边界明确。
- 五关机制反证、缺失分母、预防/检测/缓解正反测试、未知原因和MTTR起止定义均可核对。证据摘要不冒充真实性证明，模型草稿不回写权威知识，无真实生产因果复现。

### Runbook

[打开课程](./sre-aiops/runbook.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：离线工具获取和Bash进阶执行路径缺少零基础入口。
- 初评：内嵌模板只列投诉与曲线，未显式保留主动业务验证及未知结果接管。
- 初评：通用检查单缺计划漂移、回执缺失和执行器升级下的独立判据。
- 修订：链接开课准备并限定真实kubectl前提。
- 修订：模板补主动业务路径与残余任务接管，说明脚本保存、语法检查、运行参数和清理。
- 修订：补五项含交接、对象漂移、两种回执、并发预算及取消/补偿的通关。

**八项正文证据**

- 前置与路线：作者复评通过。开课准备明确Node/目录；Bash脚本要求现有隔离集群、kubectl和只读身份，不提供生产默认值。
- 机制与状态：作者复评通过。执行契约、持久执行、操作编号/对象编号、租约隔离、超时/取消/补偿分层解释。
- 基础实验：作者复评通过。内存防重课堂与lost-response模型含精确命令、写入次数/状态、预期、失败检查与清理。
- 故障实验：作者复评通过。lost-receipt/changed-plan/version-drift要求不盲重发，七项断言验证零写入或等待核对边界。
- 生产取舍：作者复评通过。一百服务平台、扩容预算、身份/权限、状态持久性、执行器升级与手册生命周期均讲适用边界。
- 递进面试：作者复评通过。30秒/3分钟与批准后换目标、无回执、重启防重、LLM资料不授予权限等连续答案。
- 独立通关：作者复评通过。独立通关要求换人执行、版本漂移、同目标不同回执、公共执行器预算与失败出口。
- AIOps 与证据：作者复评通过。手册进入AIOps检索与受控动作，提交合成计划/审批/脱敏回执，不把控制状态称业务恢复。

**验证边界**

- reasoned：全文走读，检查模板与正文验收含义一致、只读脚本的保存/运行位置及故障停止。；限制：真实AWS/Kubernetes权限、并发、落盘与网络分区未运行，JSON状态复制仅为模拟。
- executed：本机 Node 正常/故障合成课堂已运行；事故证据课堂七项测试通过。；限制：只验证合成数据与内存流程，不代表真实产品、网络、持久性或生产验收。

第二位审校者：foundation-frontend；日期：2026-10-12。

- 已全文复核，实际运行基础runbook正常1次模拟动作/重复跳过、错owner零动作，以及lost-response控制状态核对与七项状态测试均通过。
- 明确Node离线路线与Bash/kubectl需授权隔离集群；变量空值停止、上下文/命名空间显式、目标版本/容量/审批条件、命令完成与业务验收分离。
- 五关lost-response和lost-receipt相同副本但不同回执归属、陈旧计划、持久幂等、隔离令牌、取消/补偿和旧任务升级语义答案成立。只读也限制成本范围，任意shell不承诺恰好一次。真实集群及AWS执行未运行。

### SLI / SLO / SLA

[打开课程](./sre-aiops/sli-slo-sla.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：离线实验假设读者已安装 Node.js 并取得仓库，零基础运行入口不完整。
- 初评：末尾面试题仅列问题，检查单无法判定新输入与分母变化后的独立能力。
- 修订：补分层阅读路线、HTTP/API/5xx 释义及完整开课准备入口。
- 修订：用五项带数值答案、假设、反证、回退和回看小节的独立通关替代裸题列表。

**八项正文证据**

- 前置与路线：作者复评通过。开篇老师认路及“基础实验：纸笔与程序互相检查”限定本机 Node、根目录和离线范围，并链接实际安装/下载步骤。
- 机制与状态：作者复评通过。“加权课堂”“燃烧率推导”“PromQL 进阶”解释事件分母、窗口、标签与空集合边界。
- 基础实验：作者复评通过。“基础实验：纸笔与程序互相检查”有两条精确命令、期望字段、手算、目录故障与无需服务清理。
- 故障实验：作者复评通过。“分母选错”及“标签故障实验”给注入条件、对照、修复、复测与不连接生产范围。
- 生产取舍：作者复评通过。“依赖与高可用”“治理与安全”覆盖故障域、预算、策略版本及安全要求不能兑换预算。
- 递进面试：作者复评通过。“面试课堂”“面试深答”及独立通关第五关含 30 秒、3 分钟、机制与假设追问。
- 独立通关：作者复评通过。“独立通关”用 20 万交易、混入探测、空告警、低频异步与依赖乘积检验迁移能力，给出判据。
- AIOps 与证据：作者复评通过。“SLO 与 AIOps”“学习证据”把预算用于异常优先级与变更决策，保留口径和规则而非虚构经历。

**验证边界**

- reasoned：全文走读与算例复算；检查事件口径、标签、窗口及五项独立通关答案。；限制：不证明真实 Prometheus 采集、告警投递或合同履行。
- executed：本机 Node 正常/故障合成课堂已运行；事故证据课堂七项测试通过。；限制：只验证合成数据与内存流程，不代表真实产品、网络、持久性或生产验收。

第二位审校者：foundation-frontend；日期：2026-10-12。

- 已逐段全文复核。纸笔/Node路线前置闭合；实际执行slo正常与故障，0.5/10燃烧率及WITHIN_BUDGET/BUDGET_EXCEEDED与正文一致。
- 分子分母、时间/事件口径、滚动窗、异步批次、标签空集合和缺采集边界相互一致；记录规则保留job，不把空序列补成健康。
- 五关200000/120得到99.94%、200预算、60%消耗、0.6燃烧率；混入800000探测为99.988%，答案复算通过。真实Prometheus规则/通知未执行，正文明确仅数学和合成演练。

### 爱数 AnyStorage 深讲

[打开课程](./storage-data-protection/aishu-anystorage.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：脚本表头未约束，额外列可能掩盖输入错位
- 初评：创建脚本、UTF-8与子进程退出的初学者步骤不足
- 初评：克隆可挂载容易被误读为已验证独立故障域
- 初评：缺少同时覆盖阈值方向、采集错误和迁移后新写入的独立任务
- 修订：明确编辑器保存完整PS1、Windows PowerShell 5.1编码和子进程执行
- 修订：补充非空及精确表头合同，保留单位、方向、有限数值、对象覆盖等校验
- 修订：澄清克隆独立性与源故障域必须另验
- 修订：新增五关及具体退出码、阈值边界、容量安全线和GX迁移写入权威答案

**八项正文证据**

- 前置与路线：作者复评通过。入门实验：生成 AnyStorage 脱敏健康报告：独立目录、完整PS1、编码、终端和子进程入口闭合。
- 机制与状态：作者复评通过。官方知识地图与核心知识树：区分AnyStorage阵列、GX网关前后端、RAID、快照/CDP/复制与独立备份，未编造私有CLI。
- 基础实验：作者复评通过。实验步骤和预期结果：四个对象得到3 WARN/1 OK及退出码1，数值/方向/单位有数据合同。
- 故障实验：作者复评通过。补齐离线故障演练的恢复证据：池92触发2，修复四值得到0；空采集为3而非健康，并限定清理两份自有文件。
- 生产取舍：作者复评通过。独立通关：先证明剩余故障域，再决定动作：100TiB池84TiB已用、2TiB/天在3天触90安全线；GX切回必须处理目标新增写入。
- 递进面试：作者复评通过。面试分层与独立通关：从前后端路径、RAID/快照/备份边界追问到复制权威和迁移回退。
- 独立通关：作者复评通过。独立通关：先证明剩余故障域，再决定动作：五项覆盖复现、条件预测、错误证据、设计与口述，均有可核对判据。
- AIOps 与证据：作者复评通过。AnyStorage 在 AIOps 中的位置：对象拓扑、采集新鲜度、RPO/路径/容量信号与高风险动作审批边界明确。

**验证边界**

- executed：Windows PowerShell子进程执行实际正文脚本的内存CSV替身：正常1、池92为2、全OK为0、空行/NaN/101/错方向/额外表头均3，共8种。；限制：只替换Import-Csv输入为ConvertFrom-Csv，不连接AnyStorage；未验证真实路径、复制或GX切换。
- syntax：全文PowerShell代码块经PowerShell AST解析；git diff --check通过。；限制：语法通过不等于设备兼容或实际控制台验收。
- unrun：真实设备安装、快照恢复、双活与迁移未执行。；限制：缺少授权设备、对应版本许可和支持环境。

第二位审校者：data-observability；日期：2026-10-12。

- 全文925行独立审读：AnyStorage7阵列/GX前置虚拟化/AnyBackup职责分离，SAN/NAS及GX前后端路径、RAID2.0非经典RAID2、缓存/分层/QoS/快照克隆依赖/同步异步/仲裁/独立备份边界清楚；原厂公开产品页核对RAID2.0、协议与双仲裁支持，未推定私有实现
- 离线PowerShell完整四对象精确表头/身份覆盖/单位方向/有限非负及阈值次序校验，UNKNOWN3与WARN1/CRITICAL2/OK0区分；池92故障恢复70/100/0/0.2不靠抬高门槛，清理只限两自有文件
- 独立五题覆盖路径50与池90边界、坏输入、100TiB/84TiB/2TiB每天三天触90安全线、GX目标新增写入权威及源保留；本轮全文静态审查，未运行真实AnyStorage、复制、克隆、双活或设备CLI；额外独立验证原文检查器经内存CSV替身在Windows PowerShell5.1子进程跑8类输入全部通过（1/2/0/3分支），未覆盖真实文件导出/设备
- 全文共14个PowerShell代码块经本机AST独立解析通过；静态语法检查不证明厂商CLI、实际容灾或生产兼容性

### Brocade 6510 光纤交换机深讲

[打开课程](./storage-data-protection/brocade-6510.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：负数增量会绕过大于零阈值，被误当成无错误
- 初评：端口角色与设备身份不受约束
- 初评：恢复命令未在验收失败时保护备份
- 初评：需要把端口Online、主机路径与独立Fabric拆开考核
- 修订：所有错误增量仅接受非负ASCII十进制整数，拒绝NaN、负数与缺失
- 修订：校验课堂F-Port角色及非空设备身份
- 修订：恢复验收非零即停止且保留备份
- 修订：补全文件保存和当前目录前置，新增五关及credit边界、超卖、双Fabric故障域判据

**八项正文证据**

- 前置与路线：作者复评通过。前提与创建 fabric-ports.csv：Python3标准库、独立目录、UTF-8与当前工作目录均说明。
- 机制与状态：作者复评通过。核心协议与拥塞解释：FLOGI、PLOGI、PRLI、zoning、BB credit与slow drain联系到真实数据路径。
- 基础实验：作者复评通过。入门实验：离线端口健康基线：四端口覆盖、重复检查与整数增量校验，正常退出0。
- 故障实验：作者复评通过。故障注入实验及恢复：CRC/C3/loss/credit产生2，恢复0才删除备份；输入坏值为采集失败而非链路修复。
- 生产取舍：作者复评通过。双 Fabric 迁移顺序与独立通关：核对剩余故障域、迁移接线回退、16G ISL争用及已EOS设备支持边界。
- 递进面试：作者复评通过。独立通关：端口、路径和故障域三张图：从端口Online追问登录、zoning、LUN映射、主机多路径与慢排水证据。
- 独立通关：作者复评通过。独立通关：端口、路径和故障域三张图：五关含100/101 credit预测、非法输入和4:1理论争用判据。
- AIOps 与证据：作者复评通过。在 AIOps 中的作用：计数增量、端口WWN/WWPN拓扑、采集周期、变更和审批式修复关联。

**验证边界**

- executed：实际Python正文用StringIO替换文件输入执行10种：正常0、四信号故障2、恢复0、空/重复/负数/NaN/空设备拒绝，以及credit100为0、101为2。；限制：模拟CSV规则，不登录交换机，不证明真实FOS状态、Fabric或光纤故障。
- syntax：Python AST及全文PowerShell块解析通过；git diff --check通过。；限制：未执行厂商只读CLI。
- unrun：真实FOS升级、zoning及双Fabric迁移未执行。；限制：缺少授权硬件与目标版本支持矩阵。

第二位审校者：data-observability；日期：2026-10-12。

- 全文798行独立审读：FC登录/名称服务/zoning与masking、Principal非数据必经、FSPF/ISL/逐跳BB信用/慢排水上游受害者、累计计数与重置、接收错误不等坏组件机制完整；重新核对Broadcom原始EOL公告，2019通知/2023FOS EOA/2025EOS日期相符
- 四端口归一化CSV不假装四端到端路径，整数非负计数/预设覆盖/重复/角色身份检查；CRC/loss与C3/credit两候选、故障2/输入异常1/恢复0后删除备份的闭环清楚；真实zoning写命令只作识别，生产禁直接照抄
- 独立100/101信用边界、64G接入共享16G ISL名义4:1、独立Fabric逐批迁移及回接/保留窗口有可核对判据；本轮未登录交换机、改zoning、清计数、切路径或升级FOS，离线代码测试也不等于实际Fabric验收；原文Python检查器以StringIO替身独立执行基线0、故障2、恢复0、空/重复/NaN/负值/错身份1共8类全部通过，不等于厂商输出格式兼容
- 全文共14个PowerShell代码块经本机AST独立解析通过；静态语法检查不证明厂商CLI、实际容灾或生产兼容性

### Ceph 深讲

[打开课程](./storage-data-protection/ceph.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：cephadm --mount默认容器路径带源目录basename，原规范命令指向错误/mnt/osd-spec.yaml。
- 初评：下载失败可续执行旧文件，安装未失败停止；版本快照旧，缺明确五关与初学路线。
- 修订：明确宿主到/mnt挂载并对固定版本源码说明；下载/安装与逐盘OSD失败停止、旧文件拒绝。
- 修订：官方版本核对后更新20.2.4基线及未实跑声明；同名池归属防护、独立通关与前置入口。

**八项正文证据**

- 前置与路线：作者复评通过。Bash/专用可重装VM/三空盘和前置运行时，没环境先离线模型不假装部署。
- 机制与状态：作者复评通过。RADOS到pool/PG/CRUSH/OSD、MON/MGR/MDS/RGW、peering历史与缓存确认分开。
- 基础实验：作者复评通过。精确20.2.4容器与工具、显式盘规范、RBD基线与预期/路径失败/清理。
- 故障实验：作者复评通过。单实验OSD停止/恢复、副本3/min2基线和业务元数据边界，纸面版本反例。
- 生产取舍：作者复评通过。故障域/EC容量/局部满/恢复竞争、Cephx秘密、备份/升级格式、DBWAL共同依赖。
- 递进面试：作者复评通过。30秒到三分钟、生产机架容量与扩容slowops事故均有递进答案和停止边界。
- 独立通关：作者复评通过。五关多数派≠历史、两host放不下三副本、均值≠局部、元数据≠性能、共享依赖与回退。
- AIOps 与证据：作者复评通过。健康代码/拓扑/时效/升级事件进入AIOps，不执行模型建议的purge/lost/降minsize。

**验证边界**

- reasoned：全文走读并复算故障容量；官方发布页20.2.4/19.2.6及20.2.4 command_shell挂载源码核对。；限制：未下载cephadm/容器、未启动集群或写空盘、停OSD；文本预期不等于运行验证。

第二位审校者：foundation-frontend；日期：2026-10-12。

- 全文复核。官方releases和三份安全公告独立核实20.2.4/19.2.6、Cephx密钥迁移、MON秘密暴露与RGW多站升级兼容窗口；文章不以代码升级代替泄露秘密轮换。精确下载与分支包不一定同版本、容器镜像单独固定亦讲明。
- 真实单机三空盘路线显式设备、单主机保护局限、同名pool归属、每步失败停止；故障先建立size3/min_size2与clean基线，仅停一个确认OSD并立即恢复，清理只删测试RBD。MON多数与PG历史不混同，DB/WAL共同设备、缓存flush、局部full及格式回退边界成立。
- 五关故障域数量不足不能靠空间弥补、平均70%不能覆盖局部backfillfull、元数据可读不证明业务/冗余恢复等答案可判定。本次没有Linux Ceph空盘环境，bootstrap/OSD/RBD/停启/压测均未实跑，只有全文静态、算例和官方来源复核；文中对此保持明确未验证。

### Dell EMC VMAX 深讲

[打开课程](./storage-data-protection/dell-emc-vmax.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：NaN、负响应时间和路径上限缺失可能制造假健康
- 初评：expected_paths来自待检查CSV，改小基线能隐藏路径丢失
- 初评：统一接受NotConfigured会把要求复制的业务误报健康
- 初评：恢复失败仍可能清理备份；后文解析器边界与修订功能需同步
- 修订：增加独立业务/路径/复制策略台账及有限数值范围
- 修订：要求支付与订单组Synchronized，批处理NotConfigured，避免无复制冒充健康
- 修订：补齐新手文件保存与目录前置，恢复验收失败保留备份
- 修订：新增五关，明确SRP重复聚合、10TiB安全容量、SRDF数据权威及回退新增写入
- 修订：交叉返修：核对Dell附录补Nocopy取消关联的5977.810.184版本下界与fully defined前提，区分后台定义完成/主机可读/全量物理复制，不给强制绕过门禁命令

**八项正文证据**

- 前置与路线：作者复评通过。入门实验前置：Python标准库、完整脚本/CSV与独立目录；真实SYMCLI查询另需授权版本环境。
- 机制与状态：作者复评通过。供给主线与保护解释：IG/PG/SG/Masking View、TDEV/SRP、保护缓存、SnapVX、SRDF和D@RE分清职责。
- 基础实验：作者复评通过。运行与验证：独立policy检查三组归属、路径基线、复制目标和数值范围，基线为VMAX_HEALTH=OK/0。
- 故障实验：作者复评通过。故障注入实验：模拟容量、单路径和 SRDF 积压：支付组四类风险2，恢复0才清理备份，不能从共时告警直接定单根因。
- 生产取舍：作者复评通过。独立通关：供给、性能与恢复分别签收：安全余量40.96天、SRDF序列损失与目标新增写入权威，升级与软件降级分开。
- 递进面试：作者复评通过。面试分层与独立通关：从Masking View到缓存确认、复制模式和密钥/恢复边界，附机制和设计追问。
- 独立通关：作者复评通过。独立通关：供给、性能与恢复分别签收：五关包括85%/10ms边界、NotConfigured策略错误、输入负向和容量设计答案。
- AIOps 与证据：作者复评通过。AIOps及生产解析器边界：SID、SG、端口和SRP关联，明确当前缺采样新鲜度和阵列编号，不能宣称实时全阵列健康。

**验证边界**

- executed：实际Python正文用StringIO输入执行11种：基线0、支付组四故障2、恢复0、空/重复/NaN/负响应/改小期望路径/错业务均拒绝，9.99ms为0、10ms为2。；限制：仅规则和课堂台账，不执行SYMCLI、不模拟真实SRDF状态机或SnapVX恢复。
- syntax：Python AST、全部PowerShell代码块解析、git diff --check通过。；限制：未测试实际Solutions Enabler及Unisphere版本。
- unrun：真实阵列供给、SRDF切换、密钥恢复与固件升级未执行。；限制：缺少授权设备与业务恢复目标。

第二位审校者：data-observability；日期：2026-10-12。

- 全文初版737行及修后739行改段复核：VMAX各代与PowerMax边界、IG/PG/SG/MaskingView呈现、TDEV/SRP容量、受保护缓存确认、SnapVX时间点/Link/Copy依赖、SRDF模式与R1/R2非永久权威、D@RE非主机访问授权各有解释；交叉返修补HYPERMAX5977.810.184及以后/fully-defined后台定义完成才保证Nocopy目标unlink后可访问、定义不同全量复制、主机可读不等后台完成且不强制跳门禁，与Dell原厂附录逐项相符
- 离线CSV独立policy固定业务/路径期望与复制需要，拒NaN/负延迟/错组/改小路径基线；支付组四风险不强行归同因，恢复0才清理；明确SyncInProg可为批准恢复及模式语义不可套用，缺SID/采样时间不能证明全阵列实时健康
- 五关85%/10ms阈值、SRP不能跨SG重复相加、10TiB留2TiB/200GiB每天40.96天、120对110超5笔及目标130新增写入决定同步方向，覆盖扩卷不可默认缩卷回退；本轮未执行SYMCLI、实际SnapVX、SRDF或阵列升级；原文Python检查器以StringIO替身独立执行基线0、故障2、恢复0、空/重复/NaN/负值/错身份1共8类全部通过，不等于厂商输出格式兼容
- 全文共14个PowerShell代码块经本机AST独立解析通过；静态语法检查不证明厂商CLI、实际容灾或生产兼容性

### Dell EMC VPLEX 深讲

[打开课程](./storage-data-protection/dell-emc-vplex.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：通用paths>=2把8降4或4降2当成完整健康
- 初评：对象类型/所属集群及重建进度范围未校验
- 初评：恢复验证失败未显式阻止继续清理
- 初评：后文仍用最低两条教学阈值，需和新台账同步并保留故障域边界
- 修订：加入独立对象台账，严格核对类型、集群及8/8/4/4路径基线
- 修订：拒绝负路径、超基线、NaN及范围外重建进度
- 修订：补齐完整文件与当前目录前置，恢复失败停止
- 修订：改正后文旧阈值描述，新增五关覆盖可见/可写/同步、Witness边界、净重同步速度与回退

**八项正文证据**

- 前置与路线：作者复评通过。入门实验：Python3标准库、自己的空目录、CSV和完整脚本UTF-8、终端当前目录明确。
- 机制与状态：作者复评通过。核心概念：Storage Volume/Extent/Device/Virtual Volume/Storage View分层，Metro写确认、Witness与detach规则不套通用多数投票。
- 基础实验：作者复评通过。第三步：运行：四对象符合独立台账且状态、服务和重建100%后为0，路径数量不是故障域证明。
- 故障实验：作者复评通过。故障注入实验：模拟分区与单路径：分布式设备故障与元数据单路径均可见，恢复0后清理，不操作真实设备。
- 生产取舍：作者复评通过。独立通关：不能把可见、可写、已同步混成健康：1TiB重同步下限87.38分钟，600GiB积压净60GiB/小时需10小时；故障域和新写入决定回切。
- 递进面试：作者复评通过。面试课堂与独立通关：global可见不代表本地数据副本，Witness不承载业务数据，按同步、权威和真实I/O追问。
- 独立通关：作者复评通过。独立通关：不能把可见、可写、已同步混成健康：五关有基线、路径减半/99.9%预测、输入错误、分区证据和吞吐设计答案。
- AIOps 与证据：作者复评通过。生产故障排查与AIOps：主机-Fabric-Director-后端依赖、链路/同步/I/O证据同时验证，不从CSV发起强制恢复。

**验证边界**

- executed：实际Python正文用StringIO输入执行10种：正常0、分区/单路径2、恢复0，空/重复/NaN/负路径/错类型拒绝，8路径0、减至4路径2。；限制：合成CSV规则，未实际切断VPLEX链路或验证Witness决策。
- syntax：Python AST、全部PowerShell块解析及git diff --check通过。；限制：并不证明某版本VPLEX CLI兼容。
- unrun：真实Metro分区、detach、重同步及迁移回切未执行。；限制：缺少授权VPLEX、双站点与厂商操作窗口。

第二位审校者：data-observability；日期：2026-10-12。

- 全文715行独立审读：StorageVolume/Extent/Device/VirtualVolume/View、FE/BE路径、Local与Distributed、同步写穿透等后端确认但不等每笔物理介质、Global可见不等本地副本、Witness非业务第三副本且不虚构两票算法、Metadata/Logging/数据库日志职责区分；重新核对Dell6.2SP1同步一致性组及Global visibility原厂页，写穿透与远端无本地副本边界相符
- 归一化CSV明示非CLI原字段，独立台账8/8/4/4路径而非最低两条，类型/归属/有限重建范围/覆盖校验；分区与系统卷单路径故障、恢复0后收回闭环；可用与保护完整100%分开验收，不把重建当必然停业务
- 独立路径减半/99.9%、三方连通和数据权威、1TiB/200MiB秒87.38分钟乐观下限、600GiB净60GiB每小时10小时、90%迁移拒撤源及切后新写入回退有答案；本轮未运行真实VPLEX、Witness仲裁、WAN断链或厂商CLI；原文Python检查器以StringIO替身独立执行基线0、故障2、恢复0、空/重复/NaN/负值/错身份1共8类全部通过，不等于厂商输出格式兼容
- 全文共14个PowerShell代码块经本机AST独立解析通过；静态语法检查不证明厂商CLI、实际容灾或生产兼容性

### FastDFS 深讲

[打开课程](./storage-data-protection/fastdfs.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：原文实验、机制和生产边界已有较强教学内容，但独立任务缺变更副本/空闲比例、进程重启和HTTP200错误正文等换条件校准。
- 初评：首次学习缺统一准备入口，易先卡在Linux编译而未走低前置Python路线。
- 修订：补统一准备与先本地后真实服务的分层选择。
- 修订：新增320TB与共享NAS、无新写入旧时间、跨重启幂等、200登录页、迁移新写入五关。

**八项正文证据**

- 前置与路线：作者复评通过。Python3.9无第三方依赖与仓库ZIP/根目录逐步讲，Bash/Ubuntu空白VM路线单列。
- 机制与状态：作者复评通过。Tracker选址不传字节、组内异步、fileID/身份路径、事务补偿与binlog范围。
- 基础实验：作者复评通过。真实服务固定依赖、非回环Tracker/库路径/配置包含边界；本地demo完整预期/独占输出/清理。
- 故障实验：作者复评通过。故障确定性缺失/损坏、可信源修复和复测，模拟ACTIVE与真实状态清楚区分。
- 生产取舍：作者复评通过。容量分母/故障域/共享NAS/NFS错挂/安全、迁移台账与升级数据兼容回切。
- 递进面试：作者复评通过。30秒/3分钟及三组追问、70TB设计与入口偶发404事故有假设反证与最小动作。
- 独立通关：作者复评通过。五关320TB、新写入条件、持久幂等、退出/HTTP/字节/业务多层和迁移新数据。
- AIOps 与证据：作者复评通过。官方Exporter版本字段/类型/缺失负值与业务探针、拓扑审计联动，写修复需授权。

**验证边界**

- executed：本轮verify-fastdfs-doc实际本地demo/fault/175TB与非法副本数拒绝；另跑80TB三份25%得到320TB；15个Bash块语法及13本地链接检查通过。；限制：本地模拟临时副本自动清理；未编译/启动真实FastDFS、测试多节点同步或网页下载/生产NAS。

第二位审校者：foundation-frontend；日期：2026-10-12。

- 全文、lab.py与实验README完整复核。实跑demo三阶段、fault六阶段、80TB三份25%预留得320；十项参数/输出负向全部拒绝，包含NaN/无穷/零负量/零或小数副本/100%/溢出/已存在文件/父目录缺失，已有README摘要不变。临时数据清理断言成立。
- 真实Linux路线的固定依赖、非回环Tracker地址、专用账户路径、显式配置、file_id形状与cmp字节验证闭合；明确file_info/download部分错误退出0，不能靠set-e伪成功。Exporter回环与服务地址、负同步值、Gauge累计语义、NAS同容量/同故障域与路径标记均分别解释。
- 五关容量320、无新写入不以最后同步时间断言积压、进程内幂等不跨重启、退出0/HTTP200登录页不能验照片，以及迁移IP/丢挂载/切流后新写入有具体答案。真实Linux编译、双Storage复制、Nginx/HTTP、Exporter与升级迁移未实跑；本地手工复制不被当生产修复。

### 华为 OceanStor 深讲

[打开课程](./storage-data-protection/huawei-oceanstor.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：克隆逐步形成独立数据的泛化表述可能误导链接/精简克隆故障域；前置终端/扩展名与FC映射词汇隐含。
- 初评：检查表与裸题不能替代新条件判断，缺路径数量相同但故障域不同等独立通关。
- 修订：解释克隆独立性依赖具体机制/状态，补零基础离线路线/编码/扩展名和路径词汇。
- 修订：新增lower等号/缺行、8路4路故障域、稳定WWID、性能QoS和双活备份五关。

**八项正文证据**

- 前置与路线：作者复评通过。无需阵列的WindowsCSV先行，文件保存编码/目录与产品型号边界明确。
- 机制与状态：作者复评通过。主机到介质/文件服务、池LUN映射、多路径/缓存、快照复制双活及克隆边界。
- 基础实验：作者复评通过。完整四行样本与规则校验，WARN1、UNKNOWN3，预期/排障与单文件清理。
- 故障实验：作者复评通过。92容量CRITICAL2、缺行UNKNOWN3、恢复70/100全部OK0，有基线回归。
- 生产取舍：作者复评通过。双fabric故障域/容量缩减/性能QoS、权限、HyperMetro数据权威、型号升级兼容和备份。
- 递进面试：作者复评通过。生产共享池争用及路径部件事故含对照、最小动作、冗余业务验收和升级边界。
- 独立通关：作者复评通过。五关50/51阈值、数量≠域、稳定身份、78.125MiB/s与QoS、双活恢复反证。
- AIOps 与证据：作者复评通过。稳定WWN到主机owner拓扑、时效与告警、只读自动化禁止未经批数据操作。

**验证边界**

- executed：正文完整PowerShell规则用内存CSV实际运行10项：WARN/CRITICAL/OK、50/51边界、缺行、NaN、方向/阈值错与重复身份。；限制：模拟Import-Csv只验证规则，未登录OceanStor、发现真实盘、采集文件或验证故障切换/恢复。

第二位审校者：foundation-frontend；日期：2026-10-12。

- 全文复核。原文阈值脚本仅以内存CSV替换文件输入，在PS5.1实际运行十项：WARN1/CRITICAL2/OK0、路径50为2和51为1、缺行/NaN/错方向/错单位/重复均UNKNOWN3，结果符合正文；不执行阵列命令或采集本机信息。
- 产品族、WWID/WWPN/HostID、双控/多路径、数量/独立fabric、逻辑分配/物理使用/缩减率与LUN/NAS两链分开；克隆独立性按机制确认、总体异常继续只读取证而停止变更、HyperMetro权威先于强制启动讲清。
- 五关50/51边界、8剩4的不同故障域、标识不匹配禁止格式化、8KiB×10000约78.125MiB/s与QoS排队、双活仍需历史备份答案成立。真实型号许可、路径切换、性能、快照和HyperMetro未验证，文章不以离线四指标代表整台阵列。

### IBM Storage 深讲

[打开课程](./storage-data-protection/ibm-storage.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：基础实验-Force复用目录且覆盖旧CSV/报告，可能破坏已有证据
- 初评：空样本、NaN、越界占用、负事件、无时区及重复身份未校验
- 初评：仅断言CRITICAL数量，且在验证前写报告
- 初评：必保卷清单为空会真空通过COVERAGE_OK
- 初评：缺少产品线分工与恢复吞吐的独立可判定任务
- 修订：目录已存在保护性停止，报告-NoClobber且基线1/2/1全部验收后才写出
- 修订：新增完整ConvertTo-LabStorageReport函数，先验证全部输入再输出，固定时区格式、非空身份、有限非负指标、百分比、整数事件及状态映射
- 修订：漏保函数拒绝空/空名/重复必保清单
- 修订：补充终端前置、历史样本和覆盖/新鲜度限制，新增五关与2TiB恢复5.83小时、132.27KiB平均I/O等具体判据
- 修订：交叉返修：报告验证路径跟随本轮$lab而非固定旧目录；IBM产品线表各英文组件补技术语义中文，保持产品及可执行名称不变

**八项正文证据**

- 前置与路线：作者复评通过。入门实验：分析 IBM 块存储健康样本：PowerShell版本、仓库根目录、整体执行、历史时间与新目录保护明确。
- 机制与状态：作者复评通过。IBM 产品线怎么选与核心知识树：FlashSystem/Virtualize/Scale/Protect/Tape职责和MDisk/extent/卷路径相连，不混用DS8000命令。
- 基础实验：作者复评通过。实验步骤及预期结果：完整函数先验证再分级，四条报告逐行且数量1/2/1验证，写报告不覆盖旧文件。
- 故障实验：作者复评通过。离线故障实验：备份任务绿了，关键卷却漏保：正常-漏control-恢复三轮，清理只移除本轮内存函数与变量。
- 生产取舍：作者复评通过。容量、性能与恢复设计题及独立通关：2TiB/100MiB/s不满足30分钟，物理隔离、密钥、RPO/RTO和升级回退各有验收边界。
- 递进面试：作者复评通过。从升级评审继续追问：回退究竟恢复什么与独立通关：区分代码、配置、复制角色和新写入；口述数据路径及采样口径。
- 独立通关：作者复评通过。独立通关：资产覆盖、数据保护和业务恢复分别证明：五关覆盖逐行预期而非仅数量、非法输入、漏保证据、恢复设计和分层口述。
- AIOps 与证据：作者复评通过。Storage Insights 在 AIOps 中的位置：采样频率、CMDB覆盖、新鲜度、拓扑和恢复演练年龄独立于业务告警，高风险动作不直接自动执行。

**验证边界**

- executed：正文报告函数内存执行：基线1/2/1；NaN/101/-1事件/无时区/重复/未知状态/空行七种拒绝；85与10边界逐行身份通过。漏保函数正常-缺control-恢复输出及空必保拒绝通过；Windows PowerShell5.1子进程基线通过。；限制：未运行文件创建/Export-Csv路径及真实IBM设备，目录保护和-NoClobber按语义审查；不证明真实备份可恢复。
- syntax：全文PowerShell块AST解析与git diff --check通过。；限制：未执行SSH/IBM/AIX/Linux厂商与主机命令。
- unrun：真实FlashSystem/Storage Protect恢复、Insights采集、升级和故障切换未执行。；限制：缺少对应型号、代码、许可、授权设备与业务验证环境。

第二位审校者：data-observability；日期：2026-10-12。

- 全文初版838行及修后840行改段复核：IBM产品职责、FlashSystem/Virtualize MDisk/extent/池/卷映射/IOGroup、双控与双Fabric、各保护故障域、数据缩减口径与Insights新鲜度完整；交叉返修产品表8行核心英文学习项目的技术语境中文并逐行核对
- 完整报告函数先验所有输入再输出，历史时间带偏移/身份/有限范围/状态/非负整数/重复校验；1/2/1逐行金数和NoClobber、漏control后恢复及空必保清单拒绝闭环；交叉返修验证命令用Join-Path本轮$lab并明确同会话沿用，不再换目录后误读旧证据
- 独立边界85/84.9/10虽数量不变但行身份改变、漏保与任务成功非恢复证明、2TiB/100MiB秒5.83小时不满足30分钟、平均132.27KiB非每笔相同、代码/配置/数据/复制权威回退分离；本轮未执行真实IBM/Insights/备份恢复/升级；原文报告函数内存CSV在WindowsPowerShell5.1跑8类输入及逐行边界全部通过，漏保三阶段输出通过；未执行目录创建/Export-Csv文件流程
- 全文共14个PowerShell代码块经本机AST独立解析通过；静态语法检查不证明厂商CLI、实际容灾或生产兼容性

### Tencent TCE 存储与数据保护技术栈深讲

[打开课程](./storage-data-protection/tce-storage.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：哈希故障实验只检测后清理，没有恢复再验证；早期模型发布答案易暗示对象元数据跨对象原子切换。
- 初评：对象整体读写表述忽略范围读边界、仓库前置隐含，缺集合完整/恢复下界等独立通关。
- 修订：脚本补本轮源文件恢复本轮目标、再算哈希断言并同步README和课程。
- 修订：明确对象接口≠POSIX、版本发布条件更新依赖真实系统；补零基础入口与五关。

**八项正文证据**

- 前置与路线：作者复评通过。WindowsPowerShell本地实验优先，无云账号/容器前置，产品缩写职责和地图来源。
- 机制与状态：作者复评通过。块/文件/对象路径、持久化与事务、分配/写入/回收、快照控制与多卷一致性。
- 基础实验：作者复评通过。固定仓库脚本生成1MiB并复制SHA256基线，有预期/失败/精确清理。
- 故障实验：作者复评通过。确定翻转位发现不同摘要，重新复制并独立校验恢复，未知文件不递归删除。
- 生产取舍：作者复评通过。故障域/副本备份区别、性能/增长/重建、权限密钥/不可变、升级格式与回切权威。
- 递进面试：作者复评通过。AIOps存储设计、重建争用事故与逐层证据/最小动作/业务验收连续追问。
- 独立通关：作者复评通过。五关78.125→1250MiB、999/1000集合缺失、11.65小时下界、未知PUT/ETag、多卷与并发发布。
- AIOps 与证据：作者复评通过。容量/性能/备份演练年龄与稳定对象关系进入AIOps，禁止未经批准数据动作。

**验证边界**

- executed：实际执行更新后的verify.ps1：baseline=PASS、fault-injection=DETECTED、recovery=PASS，精确清理本轮两个临时文件和空目录。；限制：只验证1MiB本地随机字节；未连接TCE或验证多卷数据库、云产品、密钥与CSI实现。

第二位审校者：foundation-frontend；日期：2026-10-12。

- 全文及verify.ps1/README完整复核，实际运行Windows PowerShell5.1脚本：baseline=PASS、单比特损坏DETECTED、recovery=PASS和专用临时数据移除全部通过。清理限定新GUID目录、拒绝链接且只删两已知文件/空目录，不递归触碰旧证据。
- 块/文件/对象、挂接/客户机/文件系统、字节/集合/事务、快照请求/就绪/恢复与多卷一致性分别讲清；ETag不普遍等于MD5、唯一版本模型发布仍需条件切换、密钥与恢复依赖独立。
- 五关4KiB与64KiB对应78.125/1250MiB每秒、999/1000不能全验收、20TiB按500MiB每秒约11.65小时、超时/ETag不能断言失败及多卷/历史密钥/并发发布判据成立。未执行真实CBS/CFS/COS、CSI、快照、权限或性能恢复。

### 华为 FusionSphere / FusionCompute 技术栈深讲

[打开课程](./virtualization-private-cloud/fusionsphere.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：合成报告恢复步骤未更换输出名会触发防覆盖；共用故障样例六发现被简写，分配率易误认为利用率。
- 初评：补丁/BOM等前置术语与仓库目录隐含，知识地图未注明课程重组，缺变条件独立通关。
- 修订：补离线准备、版本与产品边界、地图来源；增加读报告/退出码和精确恢复输出。
- 修订：明确六项发现与教学阈值、分配率口径；新增资产/维护容量/管理断连/迁移身份/恢复口述五关。

**八项正文证据**

- 前置与路线：作者复评通过。先离线合成再授权取证，PowerShell与JSON样例及版本许可术语前置。
- 机制与状态：作者复评通过。VRM/CNA、任务和四层数据路径、HA/备份/容灾及双写边界分开。
- 基础实验：作者复评通过。健康样例精确命令、退出码/报告与防覆盖清理有预期和故障入口。
- 故障实验：作者复评通过。故障六项发现、证据假设、恢复新输出名与未实跑边界完整。
- 生产取舍：作者复评通过。故障域/容量/升级许可/网络存储身份/安全与原厂升级边界明确。
- 递进面试：作者复评通过。定义机制与生产迁移、管理断连、恢复验收渐进追问及答题依据。
- 独立通关：作者复评通过。五项变条件任务有判据：A重复漏B、170<180、管理断连反证、同名异路径、恢复多层验收。
- AIOps 与证据：作者复评通过。资产拓扑/指标告警与只读报告进入AIOps，GitHub证据需脱敏且区分合成。

**验证边界**

- executed：实际执行共用PowerShell合成审计，健康0/PASS无发现，故障2/DEGRADED六项发现并读回报告。；限制：只读取仓库合成JSON并写本轮独立本地报告；未连接FusionCompute/TCE或执行平台恢复。

第二位审校者：foundation-frontend；日期：2026-10-12。

- 全文复核并完整阅读共用审计/验证脚本。实际执行verify.ps1，健康0/PASS、退化2/六发现、拒绝覆盖并保持摘要、九种非法输入拒绝通过；仅清理本轮GUID目录四个明确文件，无递归删除。
- 产品全名/VRM-CNA/闭源与通用QEMU边界清楚；报告同名会拒绝，恢复使用新文件名；解释分配率不等于使用率、同数异集台账、主备可登录不等于安全接管、迁移网络和数据标识不能按名称猜。
- 五关A/A/C漏B、维护故障200扣30=170不足180、VRM不可达与业务仍活、同名异VLAN/卷身份、HA备份容灾和RPO/RTO有可反驳答案。真实FusionCompute版本/许可、安装、迁移、HA及恢复未验证。

### KVM 虚拟化深讲

[打开课程](./virtualization-private-cloud/kvm.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：pgrep短名截断及模糊匹配第一条PID易观测错误VM；安装失败未停止，同名VM仅靠人工列表判断。
- 初评：网卡实验猜第一张接口，运行/持久参数易被误加到不支持的命令；缺新条件独立通关。
- 修订：补初学分层路线和准备入口，按UUID核对PID而非自动选第一条。
- 修订：软件包失败停止、同名Domain检查失败即停；单网卡/运行态前置断言和domif-setlink参数解释。
- 修订：补稳定身份、N+1内存、双状态重启、迁移不收敛与失联接管五关。

**八项正文证据**

- 前置与路线：作者复评通过。官方分层重组说明宿主/客户机与Bash准备，Linux24.04可重装和嵌套前置明确。
- 机制与状态：作者复评通过。KVM/QEMU/libvirt边界、CPU/内存/网络/存储路径与live/config分别讲五要素。
- 基础实验：作者复评通过。云镜像摘要/overlay/virt-install/SSH有精确步骤与多层预期、失败与精确文件清理。
- 故障实验：作者复评通过。只改单实验VM网卡，不动桥/宿主链路；有基线、隔离证据、恢复与业务再连。
- 生产取舍：作者复评通过。HA仲裁fencing、N+1、迁移、持久化、安全、版本兼容和金丝雀回退有边界。
- 递进面试：作者复评通过。12组答案与追问、300VM设计和双写事故强调证据、机制、影响与恢复。
- 独立通关：作者复评通过。五关新身份/336GiB故障容量/双状态/40秒首轮非完成承诺/失联写盘反例。
- AIOps 与证据：作者复评通过。四层监控拓扑与稳定关联键、自动化分级、GitHub脱敏证据不宣称真实未跑。

**验证边界**

- reasoned：全文走读与容量/迁移算例复算；官方virsh手册核对domif-getlink/setlink的--config边界。；限制：未创建KVM宿主/VM、迁移或接管，实验预期不视为实跑。

第二位审校者：foundation-frontend；日期：2026-10-12。

- 全文复核。Ubuntu24.04硬件检查、重新登录权限组、网络、独立密钥、云镜像摘要、基础层/overlay权限到SSH验收链闭合；已有Domain查询失败会停止、同名对象/路径不覆盖，故障只改单VM链路。
- 清理先退出客户机、确认shut off、精确目录realpath/非链接、undefine成功后逐文件删盘/独立密钥，非递归rmdir拒绝未知文件；没有关闭共享网络。解释live/config、两级页表、Virtio、存储flush、pre/post-copy与fencing，不把进程活当业务健康。
- 五关稳定UUID映射、3×112=336GiB不足350、持久down重启回退、32/0.8=40秒首轮但脏页1不收敛及单写者接管判据成立。无Linux KVM环境，本次仅全文/命令静态与算例复核，未创建VM、迁移、故障注入或清理真实对象。

### OpenStack 深讲

[打开课程](./virtualization-private-cloud/openstack.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：只读查询管道只凭文件存在验收，原生命令失败可被掩盖且复跑覆盖旧证据；OS_CLOUD未恢复。
- 初评：客户端安装无停止检查、激活与真实云前置隐含，缺新条件下独立判断。
- 修订：新虚拟环境和安装失败停止，补无云模型优先、配置搜索路径、完整客户端路径与范围。
- 修订：逐次检查退出码，新随机报告目录、失败保留不完整证据、finally恢复环境变量。
- 修订：新增资源碎片/GPU、N+1、403旧文件、网络反证和失联疏散五关。

**八项正文证据**

- 前置与路线：作者复评通过。无需云账号的调度课堂优先，Python/PowerShell/目录、客户端≠云及测试权限清楚。
- 机制与状态：作者复评通过。创建异步链、Placement账本、Neutron绑定/地址、Cinder附件与文件系统五要素。
- 基础实验：作者复评通过。完整PowerShell调度模型有基线断言；真实只读快照含错误停止、预期与清理。
- 故障实验：作者复评通过。移除候选导致无满足宿主，改内存恢复；授权安全组实验区分平台/本地/外部探针。
- 生产取舍：作者复评通过。Cells/故障隔离、fencing、容量碎片/超售、升级schema与最小权限凭据生命周期。
- 递进面试：作者复评通过。30秒/3分钟机制取舍、NoValidHost/控制面事故/镜像对照含答案及追问。
- 独立通关：作者复评通过。五关改输入/约束与反证，真实未知保持未验证，不以ACTIVE或总量代替验收。
- AIOps 与证据：作者复评通过。请求ID/多对象稳定ID/范围时间分页与采集失败进入AIOps，证据脱敏。

**验证边界**

- reasoned：全文走读并核对官方客户端clouds.yaml搜索与Nova异步架构；调度/N+1算例复算。；限制：未安装客户端或连接OpenStack，命令退出与权限/网络真实效果尚待授权环境。

第二位审校者：foundation-frontend；日期：2026-10-12。

- 全文复核。正文Placement离线PowerShell实际执行，基础host-c、故障NoValidHost、恢复host-a与预期一致；云客户端独立环境/配置选择、GUID输出目录、原OS_CLOUD存在性与finally恢复及逐次退出码检查闭合。
- Placement库存/分配与实际运行、NUMA/traits、cell/AZ、Neutron端口与TCP端口、卷attach与客户机文件系统均区分；异步API接受不当作业务完成，双写者需隔离而不盲释放Allocation。
- 五关CPU/内存互补仍无合格主机、加GPU约束再次失败、单域故障余200不足210、403旧文件不能证明新查询成功，以及ACTIVE后按地址/安全规则/返回路验证有答案。真实OpenStack API、安装与故障接管未运行。

### Tencent TCE IaaS 技术栈深讲

[打开课程](./virtualization-private-cloud/tce-iaas.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：术语/仓库前置隐含，合成基础只有验证器不便保留个人证据；HTTP请求无限等待且404退出语义不清。
- 初评：未设置配额/专用规格、供应速度与RTO等换条件独立通关。
- 修订：补本地先学路线、产品缩写/交付边界和课程地图来源。
- 修订：补三轮独立报告及六项故障发现；HTTP限时保留错误，明确404不能只看退出码。
- 修订：新增规格候选、云盘三层、供应下界、意图补偿与CLB业务五关。
- 修订：独立交叉返修RPO方向：放宽意味着允许更长丢失窗口，数值越小越严格；补复制/改架构或经业务批准放宽，不能让平台HA代替数据承诺。

**八项正文证据**

- 前置与路线：作者复评通过。本地HTTP/Python/PowerShell先于云，BOM许可与产品语义前置。
- 机制与状态：作者复评通过。CVM异步意图/任务、VPC/CLB往返、CBS多层与状态补偿讲解。
- 基础实验：作者复评通过。本地HTTP200和离线地址模型、合成报告有精确步骤和可保存证据。
- 故障实验：作者复评通过。404/重叠/六发现与健康输入新输出恢复，授权云故障明确边界。
- 生产取舍：作者复评通过。故障域容量、安全、Terraformstate/计划、升级数据与镜像许可边界。
- 递进面试：作者复评通过。创建失败/单AZ设计从机制到反证、幂等与补偿答案可追问。
- 独立通关：作者复评通过。五关新约束、100/20=5分钟、不同设备/文件系统层与未知任务判据。
- AIOps 与证据：作者复评通过。请求任务资源稳定ID、业务探针与审计联动，不能混淆公有云与TCE。

**验证边界**

- executed：Python ipaddress模型实际运行包含/不重叠、故障重叠、恢复断言；共用合成审计健康0/故障2六项发现。；限制：未运行HTTP或真实TCE资源/网络/CLB/CBS；集合数学与合成报告不证明平台实现。

第二位审校者：foundation-frontend；日期：2026-10-12。

- 全文复核。实际执行原文Python网段模型，NETWORK_PLAN=OK、OVERLAP=True后恢复；执行内存任务模型得到未结束disk-b不可当垃圾、错误重试制造vm-b/vm-c，再按正文恢复两任务。共用私有云离线验证此前通过，未把模型当真实TCE。
- 产品BOM/许可/公有云接口区别、GPU配额与物理容量、CLB探测/业务路径、扩盘多层以及意图/任务/资源生命周期讲清。交叉指出RPO目标歧义后已重读返修，明确放宽是允许更长丢失窗口而非降低RPO数值。
- 五关有配额无可用规格、云盘200而文件系统100、100台按20台/分钟至少5分钟、超时先查任务不删除未终态盘、绿色CLB不证明数据库与完整业务有判据。HTTP本地实验、真实云创建/扩盘/网络/HA及Terraform未执行；仅代码模型与静态路径复核。

### Tencent TCE 运营、运维与安全技术栈深讲

[打开课程](./virtualization-private-cloud/tce-operations-security.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：基础命令后未即时读取退出码，旧报告存在可能误验；清理命令在复跑失败后可能删除旧证据。
- 初评：合成快照不检查失鲜、恢复步骤不具体；缺预算与缓冲换条件评估。
- 修订：加入即时退出码/时效边界、恢复新输出名，清理改为先核对成功生成与所有权。
- 修订：补零基础入口与CVM/TKE前置、课程地图来源；新增未知任务/预算/采集放大/缓冲/权限轮换五关。

**八项正文证据**

- 前置与路线：作者复评通过。仓库根目录/WindowsPowerShell与合成路线明确，不要求先懂容器。
- 机制与状态：作者复评通过。认证授权审计、任务受理/终态、证据时间与缓冲净流量解释。
- 基础实验：作者复评通过。合成健康0/PASS读回，缺字段/旧文件/时效与敏感证据边界。
- 故障实验：作者复评通过。合成故障2、分级影响、恢复新文件及验证器精确清理不删旧报告。
- 生产取舍：作者复评通过。观测自身HA、容量基数、身份生命周期、安全例外、备份密钥/升级回退。
- 递进面试：作者复评通过。两地设计/安全误伤事故和连续追问有机制证据与最小修复答案。
- 独立通关：作者复评通过。五关60%预算、200到1000调用、68.27/34.13分钟、未知任务与轮换正反验证。
- AIOps 与证据：作者复评通过。观测/执行身份分离、日志不授新权限、稳定脱敏ID与交接剩余风险。

**验证边界**

- executed：共用合成私有云审计实际健康0/PASS、退化2/DEGRADED六发现；容量与预算算例复算。；限制：未调用真实TCE、发放凭据或修改策略、密钥/组件；脚本不验证现场时效。

第二位审校者：foundation-frontend；日期：2026-10-12。

- 全文复核。共用private-cloud-evidence-lab实际验证健康、退化、拒绝覆盖与非法输入；本篇固定采样时间只用于演示，明确不能证明当前在线健康或真实鉴权。
- CAM角色名称与有效权限、拒绝证据与故障证据、摘要与真实性、轮询/重试放大、批准对象绑定、租约/隔离旧执行器、恢复密钥循环依赖讲清；403不一律给管理员，模型建议不直接获得执行权限。
- 五关6000资源每分钟双查询200RPS、重试五轮1000RPS、20GiB按净流量5MiB/s约68.27分钟、预算1000已用600剩400与短凭据续期未知需停止答案成立。未调用真实TCE API、验证角色撤权、轮换密钥或执行灾备；生产有效性须现场许可与双向测试。

### 腾讯专有云 TCE 全栈技术地图

[打开课程](./virtualization-private-cloud/tencent-tce.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：总览前置产品缩写集中后置，地图来源未说明；Terraform图将API调用与交付步骤混排。
- 初评：合成报告缺即时退出码与具体恢复输出，缺跨能力证据/容量/未知关系的独立通关。
- 修订：补零基础与交付证据路线、缩写职责和课程重组说明。
- 修订：重画plan/审批/apply流程并解释读取调用，补三轮报告防覆盖/六发现与阈值口径。
- 修订：新增授权能力交集、预留、漏页引用、共同故障反证与三类状态五关。

**八项正文证据**

- 前置与路线：作者复评通过。先离线关系与报告再按BOM进入专题，主要产品缩写有前置人话。
- 机制与状态：作者复评通过。三平面/创建链/业务链/意图请求任务资源和Terraform三账职责。
- 基础实验：作者复评通过。合成健康命令0读回报告、关系模型vol-c预测与前置排障。
- 故障实验：作者复评通过。degraded六项及新名恢复，漏页补齐与未知结果纸面故障区分不删盘。
- 生产取舍：作者复评通过。双AZ数据权威/隔离、容量承诺、身份安全、版本兼容/升级不可逆与许可。
- 递进面试：作者复评通过。产品边界30秒/3分钟、双区平台设计与共同网络事故含递进判断。
- 独立通关：作者复评通过。五关10→0承诺、能力证据交集、引用闭合≠健康、相关≠因果和重复状态取舍。
- AIOps 与证据：作者复评通过。稳定资源/租户/区域/时间联动日志审计拓扑，模型只提候选与批准动作。

**验证边界**

- executed：共用合成私有云脚本实跑健康0/PASS、退化2六发现，已读回报告；容量数字复算。；限制：未登录TCE或运行Provider，合成台账不探测版本/许可/真实网络与数据。

第二位审校者：foundation-frontend；日期：2026-10-12。

- 全文复核。实际执行原文关系模型，先输出vol-c引用不闭合，补入漏页后为0；共用私有云报告验证通过。没有把关系缺失变成删盘许可，也不把0异常当物理存储健康。
- 总览与专题层次明确，TCE/TCS/TStack、四份能力证据、BOM/License/版本构建、管理/控制/数据面和请求/任务/资源ID分开；Provider开发示例与生产制品、state秘密/映射及计划授权边界讲清。
- 五关100-10-20-60=10与故障预留30后0、漏页/权限/时间对照、跨产品相关性非确认根因，以及重复回调/旧站仍写/state丢失三种独立状态均有答案。未登录TCE、调用API、验证授权或双AZ恢复，全文没有用公有云能力冒充现场验收。

### VMware vSphere 深讲

[打开课程](./virtualization-private-cloud/vsphere.md)；作者复评日期：2026-10-12；当前结论：交叉审校通过（正文）。

**初评发现与返工**

- 初评：零基础实验的终端、.ps1真实扩展名和Windows5.1编码隐含，APD/PDL在释义前用于排障。
- 初评：原面试/检查表缺改变采样聚合、缺数据、维护叠加故障等条件的独立判据。
- 修订：补离线→在线课堂→授权采集分层与准备入口，解释文件编码及APD/PDL信号边界。
- 修订：新增五关，明确Ready毫秒总和/平均/热点不同、UNKNOWN与失鲜不同、维护故障预算不能关准入掩盖。

**八项正文证据**

- 前置与路线：作者复评通过。先做无需账号/许可证的本地CSV课堂，运行文件与终端前置明确。
- 机制与状态：作者复评通过。ESXi/vCenter、HA/DRS/迁移、内存回收、网络/存储数据路径与控制回执分开。
- 基础实验：作者复评通过。五行CSV和完整校验脚本有WARN/1、CRITICAL/2、OK/0、UNKNOWN/3预期与故障清理。
- 故障实验：作者复评通过。删行/坏样本拒绝、阈值异常与恢复闭环，明确不触真实vCenter。
- 生产取舍：作者复评通过。故障容量、共享存储、版本许可、权限证书、升级兼容和数据库/备份回退边界。
- 递进面试：作者复评通过。老师带练与机制答案、维护设计/迁移事故连续追问而非仅裸题。
- 独立通关：作者复评通过。五关换新值、8vCPU/20秒Ready算例、缺证据/旧数据、270不足预算与状态未知处置。
- AIOps 与证据：作者复评通过。VM/Host/Datastore拓扑和采集失鲜进入AIOps，GitHub脱敏且不混淆课堂与真实演练。

**验证边界**

- reasoned：全文走读；Broadcom Ready换算与vVols版本说明复核，容量/采样算例复算。；限制：未登录vCenter或实测迁移/HA/许可/兼容组合。
- executed：正文PowerShell规则用内存CSV运行8项：WARN/CRITICAL/OK、缺行、NaN、反方向、逆阈值、重复身份拒绝。；限制：模拟Import-Csv只证明规则分支，不证明实际文件保存/平台采集或真实指标口径。

第二位审校者：foundation-frontend；日期：2026-10-12。

- 全文复核。正文PowerShell规则在WindowsPowerShell5.1子进程用内存CSV实际执行7项：WARN1、CRITICAL2、OK0、空/NaN/反方向/重复UNKNOWN3均符合。归一Ready与原始累计单位分开；缺证据不冒充健康。
- 只读PowerCLI用NotDefault和显式Server绑定本次连接，finally不误断已有连接；4000上限明确分范围查询而非自创分页，vMotion栈/标签区别、APD/PDL、快照合并与许可/版本边界清楚。
- 五关1600/(20000×8)=1%与8%累计、维护故障剩300扣30=270不足280、缺行与失鲜分别判定、未知迁移先核对实际所有权成立。未登录vCenter、运行PowerCLI或验证HA/迁移/硬件与许可；规则执行不证明真实平台。
