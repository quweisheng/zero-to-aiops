# Rancher 深讲

> 学习目标：从零理解 Rancher Manager、管理集群和下游 Kubernetes 集群的关系，掌握集群导入、RKE2/K3s 边界、权限、应用、监控、备份升级与常见排障，并能完成一次不接触生产集群的 Helm 渲染实验。

## 官方资料

- [Rancher Manager 文档](https://ranchermanager.docs.rancher.com/)
- [Rancher 架构](https://ranchermanager.docs.rancher.com/reference-guides/rancher-manager-architecture)
- [安装与升级](https://ranchermanager.docs.rancher.com/getting-started/installation-and-upgrade)
- [生产架构建议](https://ranchermanager.docs.rancher.com/reference-guides/rancher-manager-architecture/architecture-recommendations)
- [备份与恢复](https://ranchermanager.docs.rancher.com/how-to-guides/new-user-guides/backup-restore-and-disaster-recovery)
- [Rancher CLI](https://ranchermanager.docs.rancher.com/reference-guides/cli-with-rancher/rancher-cli)
- [Rancher 2.15.0 release](https://github.com/rancher/rancher/releases/tag/v2.15.0)
- [Rancher 版本入口](https://ranchermanager.docs.rancher.com/versions)
- [Rancher 2.15 支持矩阵](https://www.suse.com/suse-rancher/support-matrix/all-supported-versions/rancher-v2-15-0/)
- [RKE1 生命周期边界](https://ranchermanager.docs.rancher.com/reference-guides/rancher-manager-architecture/rancher-kubernetes-engine-built-in)

说明：Rancher、Kubernetes、cert-manager、RKE2/K3s 和 Helm 有明确兼容关系。安装、升级前必须按准确 Rancher 版本读取支持矩阵与发行说明，不能直接复制旧教程的镜像标签。

## 2026-08-14 版本、兼容与退役边界

| 对象 | 本文锚点 | 操作边界 |
|---|---|---|
| Rancher Manager | 2.15.0 | 先核对 2.15 支持矩阵，再选择 Kubernetes、RKE2/K3s、Helm、cert-manager、Ingress、Fleet 和 Backup Operator 的精确版本 |
| Kubernetes | 2.15 新增 1.36、移除 1.33 支持 | “上游 Kubernetes 还维护”不等于“这版 Rancher 已认证”；patch 组合也要按矩阵确认 |
| RKE2 / K3s | 当前创建集群主线 | Rancher Manager 是管理平台，RKE2/K3s 是 Kubernetes 发行版，不是同一个东西 |
| RKE1 | 2025-07-31 EOL | Rancher 2.12 及以后不再创建或管理 RKE1；旧集群应做迁移计划，不要继续套新文档 |

版本矩阵像“插头规格表”：每个组件单独看都能工作，不代表插在一起就受支持。生产升级应记录源版本、目标版本、Kubernetes patch、Chart、证书方案、身份源、扩展与回滚点。

## 官方知识地图

```text
Rancher Manager
  -> management cluster
  -> Rancher server and API
  -> authentication / RBAC / projects
  -> provision or import downstream clusters
  -> cluster agent / node agent
  -> apps, monitoring, logging, policy and backup
```

学习顺序：

```text
先分清管理集群和业务集群
  -> 再理解 agent 通信
  -> 再学用户、项目和权限
  -> 再学导入、升级、备份
  -> 最后接入监控和 AIOps
```

## 场景开场

公司有十几个 Kubernetes 集群，版本、账号入口、监控和应用安装方式各不相同。某个集群在 Rancher 页面显示 `Unavailable`，但业务 Pod 仍然正常。值班人员需要先判断：是 Rancher 管理面、agent 通道还是下游 Kubernetes 真出了问题。

## 一句话人话版

Rancher 是多 Kubernetes 集群管理平台：它在独立管理集群上运行，通过 agent 管理下游集群的权限、资源、应用和运维能力。

## 小白可能会问

- Rancher 是 Kubernetes 发行版吗？
- Rancher 挂了，下游集群会不会一起停？
- RKE2、K3s 和 Rancher Manager 有什么区别？
- 导入集群为什么要运行一段 agent YAML？
- Rancher 的 Project 与 Kubernetes Namespace 是一回事吗？

## 为什么要学

岗位明确要求 Rancher 和多集群实操。AIOps 需要把 Rancher 管理状态、下游集群健康、agent 连接、用户操作、应用版本和 Kubernetes 原生告警关联起来。

## Rancher 是什么

| 对象 | 作用 | 边界 |
|---|---|---|
| Rancher Manager | 集中管理入口与 API | 不是容器运行时 |
| management cluster | 承载 Rancher Server | 官方建议生产使用独立 HA 集群 |
| downstream cluster | 被 Rancher 管理的业务集群 | 已运行工作负载通常仍由自身控制面维持，但新变更、Webhook、策略、Fleet 和运维动作可能受影响 |
| RKE2 | 强调安全与合规的 Kubernetes 发行版 | 可被 Rancher 创建和管理 |
| K3s | 轻量 Kubernetes 发行版 | 常用于边缘、小型或管理集群 |
| agent | 建立 Rancher 与下游集群的管理通道 | 异常不等于业务数据面立即停止 |

## 它解决什么问题

- 统一创建、导入和查看多个 Kubernetes 集群。
- 统一身份认证、角色和项目级权限。
- 通过 Catalog/Apps 管理 Helm 应用。
- 提供集群监控、日志、策略和运维入口。
- 统一下游集群版本、升级和安全基线。
- 把多集群事件和资源关系提供给运维平台。

## 核心原理

### 管理集群与下游集群

**是什么**：管理集群运行 Rancher，下游集群运行真实业务。

**为什么需要**：管理平台和业务工作负载应分离故障域与资源竞争。

**怎么工作**：管理员访问 Rancher，Rancher 通过 agent 与下游 Kubernetes API 协作。

**怎么看/怎么用**：记录每个集群的 Provider、Kubernetes 版本、agent 状态和管理集群位置。

**坏了怎么查**：先验证下游 `kubectl` 是否可用，再查 Rancher、DNS/TLS、WebSocket/代理和 agent Pod。

### Cluster Agent 与 Node Agent

**是什么**：Cluster Agent 负责集群级通信，Node Agent 提供节点侧通道和兜底能力，具体部署随版本变化。

**为什么需要**：Rancher 不能假设可以直接从外部访问每个下游 API 和节点。

**怎么工作**：agent 主动建立到 Rancher Server 的受保护连接并转发管理请求与状态。

**怎么看/怎么用**：查看 `cattle-system` 中 agent Pod、日志、重启、证书和网络出口。

**坏了怎么查**：检查 Rancher URL、CA、代理、DNS、443、时间、Pod 调度和下游 API 权限。

### 用户、Role、Project 与 Namespace

**是什么**：Rancher 在 Kubernetes RBAC 上提供全局、集群、项目等管理层级；Project 可组织多个 Namespace。

**为什么需要**：不同团队不能共享集群管理员权限。

**怎么工作**：用户/组绑定 Rancher 角色，Rancher 转换并维护相应 Kubernetes 权限对象。

**怎么看/怎么用**：核对用户来源、RoleTemplate、Project、Namespace、资源配额和继承权限。

**坏了怎么查**：使用最小复现账号确认是身份源、Rancher 角色还是 Kubernetes RBAC 拒绝。

### Apps、Fleet 与配置漂移

**是什么**：Apps 通常基于 Helm；Fleet 用于多集群 GitOps 交付。

**为什么需要**：手工点页面安装会造成版本和参数不可追踪。

**怎么工作**：Chart/Git 中的期望配置被渲染并部署到目标集群，控制器持续报告状态。

**怎么看/怎么用**：记录仓库、Chart、版本、Values、目标集群、Bundle 和同步状态。

**坏了怎么查**：从 Git/Chart 拉取、渲染、权限、目标选择、Kubernetes 事件和工作负载逐层检查。

## 架构和数据流

```text
admin / API / automation
  -> load balancer / ingress / TLS
  -> Rancher replicas on management cluster
  -> Rancher API aggregation and controllers
  -> management-cluster CRD / etcd desired state
  -> cluster-agent remotedialer / WebSocket
  -> downstream Kubernetes API
  -> namespace / workload / app
```

浏览器的一次管理请求通常经过 Rancher Server、管理集群里的 CRD/控制器缓存，再通过 cluster-agent 的反向连接到下游 API。Node Agent 是节点相关和兜底路径，不是每次请求的必经跳。控制器看到的是“期望状态”，下游 API 才是“实际状态”；断线重连后需要重新同步，因此页面状态还要带采集时间。

Rancher 不应成为业务请求数据面的必经点。Rancher 故障时，已经运行的 Pod 通常继续服务，但 Rancher 安装的 admission webhook、策略、Fleet/Provisioning 控制器仍可能影响新资源和运维变更。管理面健康与业务健康必须分别探测。

## 安装与启动

官方建议生产环境先准备独立、高可用 Kubernetes 集群，再通过 Helm 安装多副本 Rancher，并在前方配置负载均衡。单 Docker 容器更适合临时验证，不应直接升级为生产架构。

交付前确认：

- Rancher 与 Kubernetes 兼容版本。
- 三节点或经评审的管理集群、负载均衡和 DNS。
- TLS 证书来源、cert-manager 兼容与续期方式。
- 出口代理、镜像仓库和离线安装策略。
- Rancher Backup Operator、备份目标和恢复演练。
- 下游集群到 Rancher FQDN 的网络连通。

## 配置详解

```yaml
hostname: rancher.lab.local # Rancher 对外 FQDN，证书与下游 agent 都依赖它
replicas: 3                 # 生产示例使用多副本，真实数量按官方架构与容量设计
ingress:
  tls:
    source: secret           # 证书由预先创建的 Kubernetes Secret 提供
```

| 配置 | 含义 | 常见坑 |
|---|---|---|
| `hostname` | 所有用户和 agent 使用的入口 | 安装后随意改名导致证书和 agent 异常 |
| `replicas` | Rancher Server 副本数 | 多副本不等于管理集群本身高可用 |
| TLS source | 证书管理方式 | CA 链不完整导致导入失败 |
| proxy/noProxy | 外部访问与内网直连 | 漏掉集群网段和内部域名 |

初始密码不要写进公开 Values 或命令历史。按目标 Chart 文档通过一次性 bootstrap Secret 或受保护的发布变量注入，首次登录后立即轮换，并保存 break-glass（紧急管理员）流程。真实 Token、注册 YAML 和 kubeconfig 都属于凭据。

## 一致性、生产高可用与容量

### Rancher 的状态到底存在哪里

```text
用户提交变更
  -> Rancher API 接受请求
  -> management cluster CRD / Secret / ConfigMap 写入 etcd
  -> controller / informer cache 观察期望状态
  -> agent 把动作送到 downstream apiserver
  -> downstream object/status 返回
  -> Rancher 页面显示最新已观察状态
```

页面的 `Active` 不是瞬时真相。要同时记录 resourceVersion、最后更新时间、agent 重连时间和下游原生对象。出现差异时先停止重复点击，避免相同动作在重连后被多次调和。

### 高可用不是把 replicas 改成 3

- 管理集群的控制面与 etcd 必须跨故障域，Rancher Server 副本设置反亲和和 PodDisruptionBudget。
- 入口负载均衡、DNS、TLS/CA、证书续期、外部身份源和镜像仓库都要有恢复设计。
- Backup Operator 的备份要放在独立故障域；备份成功只证明“文件产生”，隔离恢复成功才证明可用。
- 给每个下游保存受控的原生 kubeconfig。Rancher 入口故障时，值班人员仍要能直接验证下游 API。

### 容量从 watch 和重连风暴计算

主要压力不是网页人数，而是被管理集群数、资源对象数、watch 数、WebSocket 长连接、API 延迟、Fleet Bundle、审计量和 management etcd 大小。Rancher 或网络恢复时，大量 agent 同时重连会形成尖峰；容量测试必须包含重连风暴，而不只是稳定态浏览页面。

建议监控 Rancher API P95/P99、5xx、management etcd 延迟/容量、server CPU/内存、cluster-agent/node-agent 重启与连接错误、证书到期、Fleet Bundle 就绪率和状态新鲜度。

## 安全、升级与回滚

- 外部 OIDC/LDAP 负责日常登录，同时保留受控的本地 break-glass 管理员；定期验证而不是只在事故时想起。
- 分清 Global、Cluster、Project Role 与 Kubernetes 原生 RBAC。用 `kubectl auth can-i` 和最小复现用户验证权限，不靠管理员截图猜。
- API Token 设置最小权限、过期和轮换；审计日志要能关联用户、集群、资源和请求 ID。
- 私有 CA、代理和 `noProxy` 同时影响 server、agent、Chart 仓库和身份源；不要通过关闭 TLS 校验“修复”。
- 升级前按支持矩阵逐 minor，先做 Backup Operator 备份和隔离恢复，再核对 CRD、Webhook、Fleet、监控 Chart 与身份源。
- `helm rollback` 只能回退 Helm 管理的部分清单，不能自动逆转已迁移的 CRD/管理数据。跨数据格式边界时，真正回滚通常是恢复已验证备份。

## 命令字典

| 命令 | 作用 | 正常结果 | 常见坑 |
|---|---|---|---|
| `kubectl -n cattle-system get pods` | 查看 Rancher 与 agent Pod | Pod Ready 且重启稳定 | 只看 Running 不看 Ready/日志 |
| `kubectl -n cattle-system logs deploy/cattle-cluster-agent` | 查看集群 agent 日志 | 无持续连接或证书错误 | 在错误集群执行 |
| `helm list -n cattle-system` | 查看 Rancher Release | 版本与基线一致 | 忽略失败 Revision |
| `helm get values rancher -n cattle-system` | 查看实际 Values | 与 Git/设计一致 | 输出可能含敏感信息 |
| `rancher clusters` | 通过 CLI 查看集群 | 只显示授权对象 | Token 泄露或 Context 错误 |

## 在 AIOps 中的作用

建议采集 Rancher Server 可用性、API 延迟、agent 连接、集群状态、Kubernetes 版本、证书到期、Fleet/Apps 状态、用户操作和采集新鲜度。告警要同时附带下游原生 API 探测结果，避免把“Rancher 看不到集群”误报为“业务集群停止”。

安全自动化可以做只读清单、版本差异、证书到期、离线集群和应用漂移报告。创建/删除集群、轮换证书、强制删除 Finalizer、升级和恢复必须审批。

## 入门实验：离线渲染 Rancher Helm Chart

### 实验目标

不安装 Rancher，只下载官方稳定 Chart 并渲染 YAML，确认 hostname、Namespace 和副本数进入结果。

### 实验步骤

```powershell
helm repo add rancher-stable https://releases.rancher.com/server-charts/stable # 添加官方稳定仓库
helm repo update                                                              # 刷新 Chart 索引
$chartVersion = '2.15.0'                                                       # 固定本次学习基线
helm show chart rancher-stable/rancher --version $chartVersion                # 查看固定 Chart 元数据
helm template rancher rancher-stable/rancher `                                # 只在本地渲染，不连接集群
  --version $chartVersion `                                                   # 防止仓库更新后实验漂移
  --namespace cattle-system `                                                 # 指定 Rancher 官方常用命名空间
  --set hostname=rancher.lab.local `                                          # 写入虚构实验域名
  --set replicas=3 > rancher-rendered.yaml                                    # 保存三副本渲染结果
Select-String -Path rancher-rendered.yaml -Pattern 'rancher.lab.local|replicas: 3' # 验证关键值
```

### 验证结果

`helm template` 退出码为 0，生成的 YAML 中能找到虚构域名和副本数。这个实验只证明 Chart 可渲染，不证明生产依赖、证书和集群兼容。

### 如果没有成功

1. `helm version` 是否可用。
2. 是否能访问官方 Chart 仓库。
3. 代理和 CA 是否信任 HTTPS。
4. Chart 名称是否仍为当前官方文档所列名称。

### 清理

这个实验没有创建集群资源。检查并提交脱敏后的 `rancher-rendered.yaml`；若不需要两个下载缓存文件，可由学习者在确认路径后自行清理。不要把真实 hostname、密码、Token 或 CA 私钥替换进公开证据。

## 故障注入实验：cluster-agent 中断时业务是否还活着

仅在可丢弃的下游实验集群执行，并确保你有不经过 Rancher 的原生 kubeconfig。这个实验改变 agent 副本数，不能在生产执行。

### 前置条件与基线

1. Rancher 2.15.0 管理一个一次性下游集群。
2. 下游已有一个可验证的测试工作负载。
3. 记录 Rancher UI、直接 `kubectl` 和业务探针的基线。

```powershell
kubectl config current-context
kubectl get --raw=/readyz
kubectl -n cattle-system get deployment cattle-cluster-agent -o wide
$agentReplicas = [int](kubectl -n cattle-system get deployment cattle-cluster-agent -o jsonpath='{.spec.replicas}')
if ($agentReplicas -lt 1) { throw 'cluster-agent 基线异常，停止实验' }
kubectl -n demo get deploy,pod,service
```

### 注入、观察与恢复

```powershell
kubectl -n cattle-system scale deployment cattle-cluster-agent --replicas=0
kubectl -n cattle-system get pods -l app=cattle-cluster-agent -w
```

看到 agent Pod 消失后停止 `-w`。继续用原生 kubeconfig执行 `kubectl get --raw=/readyz` 和测试业务探针，同时观察 Rancher 页面状态、Rancher Server 日志和 node-agent 日志。页面可能在心跳超时后才显示断开；若仍可管理，记录 node-agent 兜底证据，不要为了制造“预期截图”继续破坏网络。

```powershell
kubectl -n cattle-system scale deployment cattle-cluster-agent --replicas=$agentReplicas
kubectl -n cattle-system rollout status deployment/cattle-cluster-agent --timeout=5m
kubectl -n cattle-system logs deployment/cattle-cluster-agent --since=10m
kubectl get --raw=/readyz
```

预期结论：Rancher 管理链路异常与下游 API/已运行业务是两个信号；恢复后 agent 重新连接并同步状态。若直接 API 也失败，事故已经超出 Rancher agent 范围，应转查下游控制面和网络。若 agent 无法恢复，停止实验并使用保存的副本数、事件、日志和变更时间回退。

## 生产事故题：页面全红，但业务告警没有触发

**先收证据**：同一时间窗保存 Rancher 入口探测、API 延迟、Server 日志、management etcd、cluster-agent/node-agent 日志、DNS/TLS/代理、下游原生 `/readyz`、业务 SLI 和最近变更。

**提出假设**：Rancher Server 故障、入口证书过期、remotedialer/WebSocket 被代理断开、agent 证书或时间异常、management etcd 慢，或者下游 API 真的不可用。先用原生 kubeconfig把“管理面故障”和“业务集群故障”分开。

**修复与爆炸半径**：若下游健康，冻结通过 Rancher 的高风险变更，修复入口/agent/管理集群；若 Rancher Webhook 影响新资源，还要临时评估发布冻结。不要删除 Finalizer、重装 Rancher或重新导入所有集群来掩盖症状。

**复验与回滚**：确认入口、Rancher API、agent 连接、状态新鲜度、Fleet/Apps 和至少一个真实下游变更都恢复。若升级引发问题，按备份恢复决策点处理，不能只看 `helm rollback` 显示成功。

## 系统设计题：管理 200 个下游集群

答案应覆盖独立 HA management cluster、etcd 与备份、LB/TLS、外部身份与 break-glass、RBAC/审计、私有 CA/代理、agent 长连接、重连风暴、Fleet 分批交付、API 限流、容量压测、原生 kubeconfig 逃生路径、逐 minor 升级和隔离恢复演练。追问“Rancher 挂了业务是否一定没事”时，要说明已运行数据面通常继续，但 Webhook、策略、Fleet、Provisioning 和运维变更仍可能受影响。

## 常见故障排查

### 下游集群显示 Unavailable

先用独立 kubeconfig 验证下游 API，再查 `cattle-cluster-agent`、Rancher FQDN、DNS、TLS、代理、443/WebSocket、时间和管理集群状态。

### Rancher 页面 502/503

检查负载均衡、Ingress、Service Endpoints、Rancher Pod Ready、证书、管理集群资源和后端日志。

### 用户能登录但看不到资源

检查身份源组同步、全局/集群/项目角色、Namespace 所属 Project、Kubernetes RoleBinding 和权限缓存。

### 升级后 agent 反复重启

核对支持矩阵、升级顺序、Chart Values、证书、代理、镜像拉取和 CRD/controller 日志；不要在未备份时回滚数据库对象。

### Rancher 管理集群故障

确认下游业务是否独立运行，保护现场并按 Backup Operator 的已演练流程恢复 Rancher。不能用重新安装后“重新导入”代替完整配置恢复评估。

## 面试怎么讲

Rancher Manager 运行在独立管理集群，通过 agent 管理下游 Kubernetes。它提供多集群清单、认证授权、项目、应用与 GitOps 等能力，但不进入业务请求数据面。故障时我先用原生 kubeconfig 判断下游集群是否健康，再沿 Rancher 入口、Server、agent、DNS/TLS 和 Kubernetes API 排查。生产安装使用独立 HA 集群、Helm、多副本、负载均衡和可恢复备份。

递进追问可以这样接：

- **“Rancher 挂了是否完全不影响业务？”** 已运行 Pod 通常继续，但 Webhook、Fleet、Provisioning、策略与新运维动作可能受影响；必须用业务 SLI 和下游原生 API 证明。
- **“三副本为什么还不算 HA？”** 因为 management etcd、Kubernetes 控制面、LB/TLS、DNS、身份源和备份仍可能单点。
- **“升级失败为什么不直接 helm rollback？”** CRD/管理数据可能已经迁移，Helm 只管理部分清单；要在不可逆点前停住，否则按已验证备份恢复或 forward-fix。

## 学习检查清单

- [ ] 我能分清 Rancher、RKE2、K3s 和 Kubernetes。
- [ ] 我能画出管理集群到下游集群的数据流。
- [ ] 我能解释 agent、Project、Role 和 Apps。
- [ ] 我能完成 Helm 离线渲染实验。
- [ ] 我能排查集群 Unavailable、502 和权限问题。

## 面试题

1. Rancher 管理集群和下游集群有什么区别？
2. Rancher 故障为什么不一定影响业务 Pod？
3. Cluster Agent 如何与 Rancher 通信？
4. Project 与 Namespace 是什么关系？
5. Rancher 生产架构为什么需要独立 HA 集群？
6. Rancher 升级前要检查什么？
7. 如何把 Rancher 接入 AIOps？

## 学习证据

- `labs/rancher/product-map.md`
- `labs/rancher/rancher-rendered.yaml`
- `labs/rancher/management-downstream-topology.md`
- `labs/rancher/runbook-cluster-unavailable.md`
- `labs/rancher/backup-restore-checklist.md`

公开仓库不要提交 Rancher Token、真实 URL、集群注册 YAML、kubeconfig、CA 私钥、客户名称和支持包。

## 本文边界与下一步

本文覆盖岗位所需 Rancher 主线，不展开 RKE2/K3s 内部实现和 Fleet 超大规模调优。本次更新只静态核对官方资料与 Chart 渲染命令，没有安装 Rancher、导入下游集群、阻断 agent 或执行备份恢复；2.15.0 与目标 Kubernetes patch、OS、cert-manager、Fleet、Backup Operator、身份源和私有 CA 的组合仍须按实际支持矩阵确认。下一步在隔离环境完整运行两项实验并保存证据。
