# TKE on TCE 技术栈深讲

> 学习目标：理解 TCE 私有云里的 Kubernetes 从哪里获得计算、网络、存储和镜像；能把一次 Pod 创建和一次用户请求拆成逐层证据，并完成 Service 故障实验、容量设计和升级回滚推演。

## 官方资料与版本边界

- [TKE on TCE 官方介绍](https://cloud.tencent.com/document/product/457/119577)
- [TKE 文档入口](https://cloud.tencent.com/document/product/457)
- [Kubernetes 架构](https://kubernetes.io/docs/concepts/architecture/)
- [Kubernetes Service](https://kubernetes.io/docs/concepts/services-networking/service/)
- [Kubernetes 持久卷](https://kubernetes.io/docs/concepts/storage/persistent-volumes/)
- [Kubernetes 安全检查表](https://kubernetes.io/docs/concepts/security/security-checklist/)
- [kind 快速开始](https://kind.sigs.k8s.io/docs/user/quick-start/)

TKE 是腾讯容器服务；TKE on TCE 是与 TCE 私有化环境相关的交付形态。不能将公有云最新 TKE 功能、Kubernetes 版本、网络模式、计费和控制面托管职责直接套到现场。应核对 TCE/TKE/集群/插件/操作系统/运行时/固件版本、BOM 与授权。

本文与 [Kubernetes 深讲](./kubernetes.md) 分工：后者教通用底座，本篇重点解释 TCE 云资源集成、责任边界和跨层故障。示例运行于本地 kind，不冒充 TCE 实测。

## 官方知识地图

```text
TCE 基础层：CVM -> VPC/子网 -> CLB -> CBS/CFS -> 镜像仓库
Kubernetes：API Server -> etcd -> 调度器/控制器 -> kubelet -> 容器
集成层：云控制器 -> 网络插件 -> 存储插件 -> 身份/日志/监控
业务层：Deployment -> Pod -> Service -> Ingress/Gateway -> 用户
治理层：租户/RBAC -> 配额 -> 策略 -> 升级 -> 备份 -> 容灾
```

API Server 是集群入口；etcd 是保存集群期望状态的数据库；kubelet 是节点上的执行代理。CNI 是容器网络插件接口，CSI 是容器存储插件接口；它们是接口约定，不是某个固定产品。

## 场景开场

发布一个“告警查询页”，Pod 显示 Running，但用户打不开。问题可能是容器没监听、探针没发现、Service 端口写错、没有可用后端、CLB 健康检查失败、安全组阻断，甚至云侧配额不足导致 CLB 根本没创建。

只看 Pod 重启次数，无法覆盖整条业务路径。

## 一句话人话版

TKE on TCE 是让 Kubernetes 在腾讯私有云资源上管理容器，并把云网络、云盘、负载均衡和平台治理接到一起。

## 小白常问

### TKE、Kubernetes、Docker 是什么关系？

Kubernetes 负责调度和保持期望状态；TKE 提供产品化管理与云集成；容器运行时负责真正运行容器。现代集群常使用 containerd，不能把“没有 Docker 命令”当成节点坏了。

### 两个 Pod 就算高可用吗？

如果都在同一台宿主或同一故障域，机器断电时会一起消失。还要考虑反亲和、拓扑分布、后端数据库、可用容量和入口。

### 删除 Pod 会丢数据吗？

容器可写层和临时卷通常不适合保存重要业务数据。持久卷是否保留由存储、绑定与回收策略决定；删除 PVC 可能触发云盘删除，绝不能把删 PVC 当排障第一步。

### Namespace 能彻底隔离租户吗？

Namespace 是逻辑分组。还需要 RBAC（角色权限）、配额、网络策略、工作负载安全与节点隔离；强隔离场景可能需要独立集群。

## 为什么要学与它解决的问题

AIOps 平台通常包含采集器、API、任务队列、推理和界面，负载不同、发布节奏不同。容器平台帮助统一部署、恢复、扩缩容和观测，但也引入云资源、集群插件、应用三层责任，需要能跨层排障。

## 核心概念：期望状态与控制循环

**是什么：** 你声明希望运行两个副本，控制器持续比较期望和实际。

**为什么需要：** 人不能持续盯着每个进程并手工补副本。

**怎样工作：** 请求通过认证、授权、准入检查写入集群状态；控制器创建对象，调度器选节点，kubelet 拉镜像、准备网络和卷并启动容器，状态再回报。

**怎样观察：** `kubectl get/describe` 看期望副本、实际副本、Conditions（状态条件）和 Events（事件）；资源存在不代表就绪。

**坏了怎样查：** 沿“请求是否接受 -> 对象是否创建 -> 是否调度 -> 是否启动 -> 是否 Ready -> 业务是否成功”定位，避免跳过中间证据。

## Pod 创建的内部路径

```text
提交 Deployment
  -> API 认证/授权/准入
  -> 集群状态持久化
  -> Deployment/ReplicaSet 控制器创建 Pod
  -> Scheduler 选择 Node
  -> kubelet 准备卷与网络、拉镜像、启动容器
  -> startup/readiness/liveness 探针
  -> EndpointSlice 更新可用后端
```

ReplicaSet 管副本数，Scheduler 是调度器，Node 是工作节点。EndpointSlice 保存 Service 对应后端地址及条件。

在 TCE 中，工作节点可能是 CVM 或现场支持的其他节点形态。节点创建失败可能先发生在 TCE 配额、镜像、网络或云盘层，尚未进入 Kubernetes 调度。必须用云资源 ID 和节点名建立映射。

## 核心概念：控制面与工作节点

控制面负责决策和状态，工作节点承载业务。控制面暂时不可用时，已有容器可能继续运行，但发布、调度、扩容和部分控制动作受影响；“业务还能访问”不证明控制面健康。

etcd 多数派是避免相互矛盾决策的机制。三成员通常需要两个可用才能形成多数派，但真实故障判断还涉及磁盘、网络和成员状态。不要把数据库副本数与控制面副本数混为一谈，也不要未经原厂批准操作 TKE 内部 etcd。

观察入口健康、API 延迟、错误率、控制器积压、节点心跳与实际业务。出现主备/仲裁/状态损坏问题，保留证据并按支持边界升级原厂。

## 网络路径：容器通了不等于用户通了

```text
用户 -> DNS -> CLB -> Ingress/Gateway -> Service -> EndpointSlice -> Pod
                                                    |
                                                数据库/消息/存储
```

DNS 把名称变成地址；CLB 分发入口流量；Ingress/Gateway 描述或处理应用层路由；Service 给变化的 Pod 提供稳定访问入口。实际产品实现可能省略或合并其中某层。

### Service 三个容易混淆的端口

- `port`：Service 对外提供的端口。
- `targetPort`：流量最终送往容器的端口，可以用数字或容器端口名称。
- `nodePort`：NodePort 类型在节点开放的端口，不是所有 Service 都有。

`containerPort` 只是声明信息，不会替程序自动打开监听。应用若只监听 `127.0.0.1`，来自 Pod 网络的连接可能失败。

### CNI、IPAM、路由和 MTU

CNI 插件配置 Pod 网络；IPAM 是地址分配管理。可用 IP 用尽时，CPU 空闲也不能创建 Pod。MTU 是单个链路帧能承载的数据大小；封装引入额外头部，路径 MTU 不匹配可能表现为小包通、大请求卡住。

使用时核对 Pod/Service/节点/业务网段是否重叠、每节点 Pod 上限、子网剩余地址、安全组、路由与网络策略。故障先采集事件和路径证据，不在生产随意改 CNI 配置。

## 存储路径：PVC 不等于云盘已经挂好

PVC 是应用的存储申请，PV 是集群里的存储资源，StorageClass 描述申请哪类存储，CSI 插件把申请转换为云侧创建/挂载操作。

```text
PVC -> StorageClass -> CSI 控制器 -> TCE 存储 API -> CBS/CFS
                                                         |
Pod 调度 -> CSI 节点插件 -> 挂载 -> 文件系统 -> 应用读写
```

创建、绑定、挂载、格式化和应用读写是不同阶段。常见问题包括配额不足、AZ 不匹配、旧节点未释放挂载、权限错误、文件系统满或后端延迟。

`ReadWriteOnce` 通常限制单节点读写挂载，不是简单等于“只允许一个 Pod”；同节点场景与 `ReadWriteOncePod` 的语义不同，后者还依赖版本和驱动支持。共享文件和块盘不能随意互换。

排障先看 PVC 状态、Pod 事件、CSI 日志及云盘任务，不要删 PVC、格式化设备或手工修改挂载记录来“刷新”。

## 镜像与供应链

镜像仓库保存部署制品，镜像 tag 是可变标签，digest 是内容摘要。生产发布应记录 digest、构建来源、漏洞扫描和签名验证情况。

私有云常没有公网出口，必须提前准备镜像同步、证书信任、DNS、拉取凭据和镜像架构。`ImagePullBackOff` 可能是地址、认证、证书、网络、架构或限流问题，不应先改应用代码。

离线交付还要固定 Helm Chart、Operator、CRD（自定义资源定义）和依赖镜像。只拷贝业务镜像，未准备网络/存储插件依赖，集群仍可能无法恢复。

## 状态与一致性：发布成功不是数据迁移成功

Deployment 滚动更新时新旧版本并存。数据库 Schema、API 和消息格式应至少兼容这一过渡窗口，常用“先扩展、再迁移、最后收缩”的方式。

ConfigMap/Secret 更新如何进入程序取决于挂载或环境变量方式，程序也可能只在启动读取。不能只看到配置对象更新就认为所有 Pod 都用了新值。

回滚镜像不会自动回滚数据库迁移、队列消息、外部云盘和云侧网络。发布单要分别列出可回滚状态与不可逆状态。

## 安装与启动前检查

真实 TKE on TCE 应按现场交付手册创建。开始前确认：

1. TCE/TKE/Kubernetes 支持矩阵和已交付插件。
2. 租户、区域/AZ、节点规格、配额与故障预留。
3. Pod、Service、节点、专线网段无冲突，IP 余量足够。
4. DNS、时间同步、镜像仓库、证书和访问管理就绪。
5. CSI/云控制器权限最小化，存储回收策略明确。
6. 日志、指标、审计、备份恢复与业务探针可用。

不要把互联网上的 `kubeadm init` 命令运行到交付的 TKE 管理节点。它不是产品升级或修复工具。

## 配置字段字典

| 字段 | 用途/示例 | 预期与验证 | AIOps 场景与坑 |
|---|---|---|---|
| `replicas: 2` | 希望两个副本 | 看 Ready 副本与分布 | 两副本同故障域仍会一起失效 |
| `requests.cpu: 50m` | 申请 0.05 CPU 的调度资源 | 看调度与实际使用 | request 不是固定用量 |
| `limits.memory: 128Mi` | 内存上限 | 看 OOM 与工作集 | 上限过低会被终止 |
| `readinessProbe` | 是否接受业务流量 | 看 Ready 与后端列表 | 不能只检测无关的静态页 |
| `livenessProbe` | 是否需要重启容器 | 看失败/重启原因 | 下游慢不一定应重启本服务 |
| `startupProbe` | 给慢启动留时间 | 启动成功后再进入常规探测 | 阈值过大也会掩盖启动卡死 |
| `selector` | 把 Service 与 Pod 标签关联 | 对比 labels 和后端 | 拼错标签会无后端 |
| `targetPort` | 后端监听端口 | 对比实际监听 | 写错端口时 Pod 仍可能 Ready |
| `storageClassName` | 选择存储供应方式 | PVC/PV/云盘任务 | 不同 AZ、回收策略和费用不同 |
| `topologySpreadConstraints` | 分散故障域 | 看节点/AZ 分布 | 约束太严但容量不足会 Pending |

`m` 是千分之一 CPU，`Mi` 是二进制内存单位。生产探针、资源数值必须压测后确定，本文是低负载教学配置。

## 常用只读命令

下面 `<context>`、`<namespace>` 是占位符，先换成已授权目标并核对上下文。

```text
kubectl config current-context
kubectl --context <context> get nodes -o wide
kubectl --context <context> -n <namespace> get pods,svc,pvc
kubectl --context <context> -n <namespace> describe pod <pod-name>
kubectl --context <context> -n <namespace> get endpointslices
kubectl --context <context> -n <namespace> logs <pod-name> --tail=100
```

`-n` 限定命名空间，`-o wide` 展示更多字段，`describe` 看对象详情与事件，`logs` 看容器标准输出。输出可能有地址和业务数据，脱敏后才能提交；没有日志也可能是容器尚未启动或选错容器。

## 基础实验：运行两个副本并验证 Service

### 前提与边界

本机已安装 Docker、kind、kubectl，Docker 使用 Linux 容器且可拉取镜像。kind 把 Kubernetes 节点运行在本地容器中；它不是 TCE，也不验证真实 CLB/CBS 集成。

仅创建名为 `tce-learning` 的专用实验集群。本文镜像 `nginx:1.28.0` 用于固定教学样例，不表示安全推荐版本；生产需检查漏洞、批准版本并记录 digest。

### 步骤

在仓库根目录执行：

```powershell
kind create cluster --name tce-learning
kubectl --context kind-tce-learning apply -f examples/tke-on-tce-lab/app.yaml
kubectl --context kind-tce-learning -n tce-learning rollout status deployment/incident-web --timeout=120s
kubectl --context kind-tce-learning -n tce-learning get pods,svc,endpointslices
kubectl --context kind-tce-learning -n tce-learning exec deployment/incident-web -- curl -fsS --max-time 5 http://incident-web
```

`apply` 将文件中的期望状态提交到集群；`rollout status` 等待发布完成；`exec` 在一个应用容器里发起 HTTP 请求。`curl -f` 把 HTTP 错误视为失败，`-sS` 简化进度但保留错误，`--max-time 5` 限制等待五秒。

### 预期与验证

两个 Pod Ready，Service 存在，EndpointSlice 有就绪地址，HTTP 返回 Nginx 欢迎页。记录 Service 端口 80 和 Pod 的 `http` 命名端口 80 如何对应。

失败先查 Docker 是否运行、镜像能否拉取、节点是否 Ready、事件是否显示资源不足、DNS 是否正常。不要为了实验去修改生产 kubeconfig。

## 故障注入实验：Pod 正常但 Service 不通

### 前提与步骤

基础实验已成功。将 Service 的目标端口从容器的 80 改成没有监听的 8080：

```powershell
kubectl --context kind-tce-learning apply -f examples/tke-on-tce-lab/service-broken.yaml
kubectl --context kind-tce-learning -n tce-learning get pods,svc,endpointslices
kubectl --context kind-tce-learning -n tce-learning exec deployment/incident-web -- curl -fsS --max-time 5 http://incident-web
kubectl --context kind-tce-learning -n tce-learning exec deployment/incident-web -- curl -fsS --max-time 5 http://127.0.0.1:80
```

### 预期与定位

Pod 仍 Ready，Service 请求失败，容器本机 80 端口成功。对比 EndpointSlice 和 Service，发现目标端口为 8080。证据支持“Service 映射错误”，不支持“容器崩溃”。

这说明 readiness 检测容器自身不等于端到端业务验证。TCE 中还会有 CLB、健康检查、安全组和路由，需要继续向外验证。

### 修复、验证和清理

```powershell
kubectl --context kind-tce-learning apply -f examples/tke-on-tce-lab/app.yaml
kubectl --context kind-tce-learning -n tce-learning exec deployment/incident-web -- curl -fsS --max-time 5 http://incident-web
kind delete cluster --name tce-learning
```

恢复原声明后 HTTP 再次成功。最后一行只删除本次实验集群及其数据，不可替换成生产集群名。若修复后仍失败，确认控制面已更新、后端是否 Ready、是否还有其他策略或 DNS 问题。

## TCE 专属扩展实验：云集成验收清单

在已授权测试租户中，用现场支持的方式创建一个小型应用及入口，再记录 Kubernetes 对象 UID、TCE 资源 ID、任务 ID、AZ、费用/配额、健康检查和安全规则。

分别验证：Service/Ingress 对应哪个 CLB；PVC 对应哪个云盘/文件系统；节点对应哪个 CVM/宿主；删除测试对象后哪些资源保留、哪些回收。操作前必须确认清理策略，不能在承载真实数据的 PVC 上试删除。

## 生产架构、高可用与容量

控制面 HA、节点 HA、应用多副本、数据 HA 是四件事。拓扑分散要跨真实故障域，并保证失去最大故障域后仍可承载高峰；PDB（Pod 中断预算）只能约束部分自愿中断，不能阻止机器断电。

容量至少算：Pod requests、节点可分配量、系统预留、DaemonSet 开销、IP、云盘挂载数、CLB/规则配额、镜像带宽、DNS QPS 和日志吞吐。HPA 是按指标调整副本数，节点扩容是增加节点容量，两者存在时延和上游配额限制。

GPU 工作负载还要核对驱动、设备插件、运行时、模型显存、共享策略和调度方式，不能只在 YAML 写一个 GPU 数量。

## 安全边界与升级回滚

分离平台管理员、集群管理员、应用开发者和只读观察者。限制特权容器、宿主挂载、HostNetwork、镜像来源与 Secret 读取；网络策略是否生效取决于插件支持。

升级前核对 API 弃用、版本偏差、CNI/CSI、运行时、Ingress、Operator 和业务 SDK；备份不仅包括集群对象，也包括卷数据、镜像和外部数据库。先测试集群与小节点池，再受控滚动；不要假定控制面支持跨版本降级。

业务回滚可恢复旧 Deployment 镜像，但 CRD Schema、数据迁移和云资源变更必须有独立恢复方案。必要时使用新集群迁移而不是强行降级。

## AIOps：把告警关联到真实依赖

建议关联 `cluster/namespace/workload/pod/node/cloud-resource/AZ/change`。Pod 名可能变化，长期分析应保留 workload（工作负载）与 owner（所属控制器）关系。

重点观察发布成功率、Pending 原因、容器重启、OOM、API 延迟、DNS、CNI/CSI 错误、CLB 后端、磁盘延迟和业务 P99。AI 可给出候选根因与证据链接，执行扩缩容、回滚和排空必须受权限与审批约束。

## 常见故障排查

| 现象 | 首查证据 | 典型假设 | 安全处置 |
|---|---|---|---|
| Pending | Pod 事件、节点资源/IP/约束 | requests 太大或地址耗尽 | 调整已确认约束或扩容 |
| ImagePullBackOff | 镜像名、认证、证书、网络 | 仓库不可达/凭据失效 | 修复拉取链，不盲目重建节点 |
| CrashLoopBackOff | 上次日志、退出码、配置 | 程序异常或探针误杀 | 修配置/资源并灰度 |
| PVC Pending | StorageClass、CSI、云任务 | 配额/AZ/权限 | 修申请链，不删数据 |
| LoadBalancer Pending | 云控制器日志、任务、配额 | 云入口创建失败 | 查 TCE API/网络资源 |
| Ready 但访问失败 | Service/后端/监听/CLB | 端口、规则或路径错误 | 按内到外验证 |
| 节点 NotReady | kubelet、运行时、网络、磁盘 | 节点或共同依赖 | 判断影响再隔离，保留证据 |
| 升级后异常 | API/插件版本、变更窗口 | 不兼容或配置漂移 | 按已验证路径回退/迁移 |

## 生产设计题

设计一个跨两 AZ 的 AIOps 平台：采集入口持续写入，查询 API 读数据库，推理任务可重试。回答应分别设计入口、无状态副本、数据库/消息持久化、容量预留、网络与存储拓扑、发布兼容、限流、备份和故障演练。

追问：失去一个 AZ 后剩余节点和 IP 是否足够？消息重复怎样处理？数据库恢复慢于容器恢复怎么办？若答案只有“两个副本 + HPA”，说明尚未完成系统设计。

## 事故题

升级 CSI 后多个业务挂盘失败。先确认受影响存储类/AZ/节点，保留 Pod 事件、CSI 版本、云任务、旧挂载信息和升级记录；在测试对象上验证版本/权限假设。

暂停继续升级，按厂商支持方案恢复兼容组件或迁移工作负载。禁止强制卸载仍被写入的卷、删除 PVC 或手工改内部元数据。修复后验证挂载、文件读写、业务事务和残留资源，评估数据一致性。

## 面试回答与连续追问

### 30 秒

TKE on TCE 是 Kubernetes 与 TCE 计算、网络、存储和治理能力的集成。排障要分云资源创建、集群控制循环和业务访问三条链，Pod Running 只证明其中一小步。

### 3 分钟

先画 Deployment 到 kubelet 的控制路径，再画用户经 CLB/Service 到 Pod 的数据路径，最后画 PVC 到 CSI 和云盘的存储路径。结合端口错误实验说明如何用后端、监听和请求证据定位；再讲多 AZ、容量预留、RBAC、备份与插件兼容升级。

### 追问

1. **控制面挂了业务一定停吗？** 既有业务可能继续，但新调度/变更受影响；进一步解释依赖控制面的动作。
2. **Service 有 IP 为何不通？** 检查 selector、EndpointSlice、targetPort、应用监听与网络；不能以 IP 存在为完成标准。
3. **HPA 为什么不扩？** 检查指标、目标、requests、限制与节点/IP 容量；区分副本扩容和节点扩容。
4. **多副本为何仍全停？** 共同故障域、单数据库、单入口或容量不足；追问真实拓扑分散。
5. **回滚镜像为何没恢复？** 外部数据/Schema/插件不一定可回滚；追问兼容窗口与新集群迁移。
6. **通用 K8s 知识哪些不能直接套？** TKE 产品权限、插件实现、支持版本、云 API 和原厂内部操作。

## 学习检查清单

- [ ] 能解释 TKE/TCE/Kubernetes/运行时的关系。
- [ ] 能画控制、网络、存储三条路径。
- [ ] 能解释 Service 端口和四种探针/状态之间的关系。
- [ ] 能完成基础与端口故障实验，并证明恢复。
- [ ] 能核对 TCE 云资源与 K8s 对象映射。
- [ ] 能设计跨故障域容量、权限、升级与回滚。
- [ ] 能说明本地实验不证明真实 TCE 集成有效。

## GitHub 学习证据

提交实验 YAML、脱敏输出、端口故障对照、云资源映射模板、版本矩阵、生产设计与事故复盘。不要提交 kubeconfig、Secret、Token、真实 IP/域名或客户日志。

后续深入 [Kubernetes](./kubernetes.md)、[TCE IaaS](../virtualization-private-cloud/tce-iaas.md)、[TCE 存储](../storage-data-protection/tce-storage.md)。本文训练平台/SRE 面试所需的机制与证据表达，不保证单靠阅读获得职位。
