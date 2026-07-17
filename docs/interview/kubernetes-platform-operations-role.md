# Kubernetes 平台运维岗位专项路线

> 目标：针对“5 年以上 Kubernetes 运维、IaaS、容器平台、微服务、CI/CD、脚本、NGINX、架构和方案设计”岗位，按投递优先级补齐知识、实验和面试证据。

## 先说结论

这份岗位不是只招“会用 Kubernetes 命令”的人，而是在招能维护企业容器平台、打通交付链路、处理生产故障并参与架构方案的人。

仓库原有内容已经覆盖一半以上基础主线；本轮新增岗位点名但原来缺少的 Rancher、OpenStack、Harbor、Istio、KubeSphere、GitLab、Jenkins、Nexus，并补上系统架构和技术方案设计。

“5 年经验”不能通过短期学习变成真实履历，也不要伪造。你能做的是用完整项目、故障复盘、架构方案和可运行证据证明经验密度，然后优先投递对年限有弹性的团队。

## 岗位要求对照表

| 岗位要求 | 当前学习入口 | 状态 | 投递前应留下的证据 |
|---|---|---|---|
| Linux、操作系统 | [Linux](../tech-stack/foundation/linux.md) | 已有，重点复习 | 性能排查记录、systemd 服务与日志证据 |
| 计算机网络 | [网络基础](../tech-stack/foundation/networking.md) | 已有，重点复习 | DNS/TCP/TLS/路由分层排障记录 |
| Python、Shell | [Python](../tech-stack/foundation/python.md)、[Shell / PowerShell](../tech-stack/foundation/shell-powershell.md) | 已有，重点实战 | 一个只读巡检脚本和测试输出 |
| Docker、容器 | [Docker](../tech-stack/cloud-native/docker.md) | 已有，必须熟练 | 镜像构建、资源限制与故障排查 |
| Kubernetes | [Kubernetes](../tech-stack/cloud-native/kubernetes.md) | 已有，最高优先级 | 可运行集群项目、升级/故障/备份记录 |
| etcd | [etcd](../tech-stack/cloud-native/etcd.md) | 控制面必修 | 多数派、Watch、备份恢复和故障演练 |
| Kubernetes 网络 | [Calico](../tech-stack/cloud-native/calico.md)、[Cilium](../tech-stack/cloud-native/cilium.md) | 至少精通一套，能比较另一套 | 数据路径、策略、流量观测和网络故障记录 |
| Helm | [Helm](../tech-stack/cloud-native/helm.md) | 已有，必须熟练 | 自写 Chart、values 分环境和回滚记录 |
| NGINX | [NGINX / Ingress](../tech-stack/cloud-native/nginx-ingress.md) | 已有，必须熟练 | TLS、反代、限流、502/504 排障 |
| 微服务 | [微服务](../tech-stack/cloud-native/microservices.md) | 已有，结合 Istio 学 | 超时、重试、熔断和链路图 |
| Rancher | [Rancher](../tech-stack/cloud-native/rancher.md) | 本轮补齐 | 管理/下游集群设计和健康检查 |
| Harbor | [Harbor](../tech-stack/cloud-native/harbor.md) | 本轮补齐 | 镜像扫描、复制、保留和拉取排障 |
| Istio | [Istio](../tech-stack/cloud-native/istio.md) | 本轮补齐 | 90/10 灰度、mTLS 和 503 排障 |
| KubeSphere | [KubeSphere](../tech-stack/cloud-native/kubesphere.md) | 本轮补齐 | 多租户模型和平台到原生对象排障 |
| IaaS | [OpenStack](../tech-stack/virtualization-private-cloud/openstack.md)、[vSphere](../tech-stack/virtualization-private-cloud/vsphere.md) | OpenStack 本轮补齐 | 资产盘点、实例创建链路与故障复盘 |
| GitLab CI/CD | [GitLab](../tech-stack/automation/gitlab.md)、[CI/CD](../tech-stack/automation/cicd.md) | GitLab 本轮补齐 | Pipeline、Runner、Artifact 和审批 |
| Jenkins | [Jenkins](../tech-stack/automation/jenkins.md) | 本轮补齐 | Jenkinsfile、Agent 设计和失败复盘 |
| Nexus | [Nexus Repository](../tech-stack/automation/nexus-repository.md) | 本轮补齐 | hosted/proxy/group 和容量治理 |
| 架构与可行性报告 | [系统架构与技术方案设计](../tech-stack/architecture-delivery/architecture-solution-design.md) | 本轮补齐 | 可行性报告、ADR、容量、回滚演练 |
| 可观测性与 AIOps | [Prometheus](../tech-stack/observability/prometheus.md)、[Grafana](../tech-stack/observability/grafana.md)、[Loki](../tech-stack/observability/loki.md)、[OpenTelemetry](../tech-stack/observability/opentelemetry.md) | 已有，是加分项 | 指标/日志/追踪/告警关联看板 |

## 学习优先级

### P0：投递前必须能讲清和动手

1. Linux、网络、Shell/Python：能按 CPU、内存、磁盘、网络、进程、日志顺序排障。
2. Docker、Kubernetes、etcd、Calico/Cilium、Helm：能解释控制面与网络数据路径，能部署、升级、回滚并处理 Pending、控制面、存储和网络故障。
3. NGINX / Ingress：能处理域名、TLS、反向代理、负载均衡、502、503、504。
4. Harbor：能解释镜像从构建到部署的完整链路。
5. GitLab CI/CD 或 Jenkins：至少一套能真正运行，另一套能解释调度模型和差异。
6. 架构方案：能拿出一份自己的 Kubernetes 平台方案，而不是背产品定义。

### P1：岗位点名，进入面试前补齐

1. Rancher 与 KubeSphere：理解多集群、多租户、权限和平台排障。
2. Istio：掌握灰度、超时/重试、mTLS、授权和服务指标。
3. OpenStack：掌握 Keystone、Nova、Neutron、Glance、Cinder、Placement 的请求链路。
4. Nexus：掌握 hosted、proxy、group、权限、清理与备份。

### P2：建立差异化优势

1. Prometheus、Grafana、Loki、OpenTelemetry 与 Alertmanager。
2. Ansible、Terraform、Runbook Automation。
3. Ceph、vSphere 与企业存储。
4. SLI/SLO、容量管理、变更治理和故障复盘。

## 30 天冲刺路线

| 时间 | 主线 | 当天必须产出 |
|---|---|---|
| 第 1-4 天 | Linux、网络、Shell/Python | 一份主机与网络巡检脚本，一次真实排障记录 |
| 第 5-10 天 | Docker、Kubernetes、etcd、Calico/Cilium、Helm、NGINX | 一个三服务应用、Chart、网络策略、控制面/网络排障、升级与回滚记录 |
| 第 11-13 天 | Harbor | 私有镜像推拉、扫描/保留策略和 ImagePullBackOff 复盘 |
| 第 14-16 天 | Rancher、KubeSphere | 管理模型对比、集群健康快照和权限说明 |
| 第 17-19 天 | Istio | 灰度路由、mTLS、请求指标和 503 排障 |
| 第 20-22 天 | GitLab、Jenkins、Nexus | 从提交到制品的完整流水线和失败重试证据 |
| 第 23-25 天 | OpenStack、vSphere、Ceph | IaaS 创建链路、资源与故障域关系图 |
| 第 26-28 天 | 可观测性与 AIOps | 指标、日志、追踪、告警和变更关联看板 |
| 第 29-30 天 | 方案与模拟面试 | 可行性报告、ADR、容量表、上线回滚 Runbook |

如果每天时间有限，不要同时铺开所有产品。先做 P0 项目的闭环，再按面试日期补 P1。

## 推荐综合项目

做一个“企业 Kubernetes 应用交付与可观测平台”，把零散知识串成一条证据链：

```text
GitLab 提交
  -> Jenkins 或 GitLab Runner 执行测试
  -> 构建镜像并推送 Harbor
  -> Helm 部署到 Kubernetes
  -> NGINX Ingress 提供入口
  -> Istio 做 90/10 灰度和 mTLS
  -> Prometheus / Loki / OpenTelemetry 采集信号
  -> Grafana 展示，Alertmanager 告警
  -> Runbook 诊断并支持人工确认回滚
```

Rancher 或 KubeSphere 用来展示平台管理，底层节点可来自 vSphere 或 OpenStack。不要为了把所有名词放进项目而同时部署两套管理平台；选一套实操，另一套做架构与运维对比即可。

## 项目验收标准

- 一条提交能触发测试、构建、制品入库和测试环境部署。
- 镜像使用不可变版本或 digest，能追溯到 Commit 和流水线。
- Helm 升级失败时能回滚到上一版本。
- 灰度流量权重可验证，错误率升高时有停止条件。
- Dashboard 能看到请求率、错误率、P95 延迟和资源信号。
- 告警能关联版本、集群、命名空间、服务和最近变更。
- 至少人为制造三类故障并留下发现、定位、恢复和改进证据。
- 架构方案包含 SLO、RTO、RPO、容量、高可用、安全、成本和回滚。

## 面试准备重点

每个技术栈都按四个层次准备，不要只背定义：

1. **架构**：组件、职责、请求或数据流。
2. **操作**：部署、配置、升级、回滚和日常巡检。
3. **故障**：真实现象、排查顺序、证据和最终根因。
4. **取舍**：为什么选它，替代方案是什么，代价是什么。

至少准备以下故事：

- 一次 Kubernetes 发布或升级。
- 一次跨网络、存储或镜像链路的故障。
- 一次 CI/CD 失败定位与流程改进。
- 一次容量或高可用方案设计。
- 一次与业务沟通后调整技术方案的经历。

真实经历不足时，可以明确说“这是我的实验项目”，不要伪装成生产事故。面试官更看重你是否理解边界、证据和风险。

## 简历与 GitHub 证据

项目描述采用“规模 + 责任 + 动作 + 结果 + 证据”：

```text
为 3 节点 Kubernetes 实验平台设计镜像与发布链路；使用 Harbor 保存不可变镜像、Helm 管理版本、Istio 执行 90/10 灰度；为错误率和 P95 延迟设置验证门槛，并完成失败自动停止与人工回滚演练。证据见架构图、流水线、Chart、Dashboard 和故障复盘。
```

避免写“精通 Kubernetes、熟悉所有中间件”这类无法验证的描述。把仓库链接指向具体项目目录，并在 README 顶部放架构图、启动步骤、验证结果和故障记录。

## 投递判断

满足下面条件即可开始投递，不必等所有文章读完：

- P0 中至少完成一个端到端项目。
- 能独立讲清 Kubernetes 核心对象、网络、存储、调度和排障。
- GitLab/Jenkins 至少一套实操，Harbor/Nexus 能解释制品链路。
- Rancher/KubeSphere 至少一套实操，另一套能讲边界。
- 有一份可行性报告和两次以上故障复盘。
- 对自己没做过的生产规模和功能明确说边界。

若招聘方把“5 年 Kubernetes 生产经验”作为硬性门槛，命中率可能仍然受限；可以同时投递容器平台运维、DevOps、云平台运维和中级 SRE 岗位，扩大面试反馈样本，再据反馈调整学习优先级。

## 最终检查清单

- [ ] 我能用 3 分钟介绍综合项目和架构取舍。
- [ ] 我能从用户请求一路讲到 Ingress、Service、Pod、存储和外部依赖。
- [ ] 我能现场写一个安全的 Shell/Python 只读巡检脚本。
- [ ] 我能解释 GitLab/Jenkins、Harbor/Nexus 各自边界。
- [ ] 我能给出 SLO、RTO、RPO、容量和回滚条件。
- [ ] 我准备了真实且可验证的成功、失败和复盘证据。
