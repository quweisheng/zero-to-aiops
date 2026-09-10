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
Rancher Manager（多集群管理平台）
  -> management cluster（承载管理平台的集群）
  -> Rancher server and API（服务端与程序接口）
  -> authentication / RBAC / projects（认证/角色授权/项目）
  -> provision or import downstream clusters（创建或导入下游集群）
  -> cluster agent / node agent（集群代理/节点代理）
  -> apps / monitoring / logging / policy / backup（应用/监控/日志/策略/备份）
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
管理员 / API（程序接口）/ 自动化
  -> 负载均衡 / Ingress（入口）/ TLS（加密传输）
  -> 管理集群中的 Rancher 多副本
  -> API 聚合与控制器
  -> CRD（自定义资源）/ etcd（状态存储）中的期望状态
  -> cluster-agent（集群代理）的反向连接 / WebSocket（长连接通信）
  -> 下游 Kubernetes API
  -> namespace / workload / app（命名空间/工作负载/应用）
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
  -> management cluster CRD / Secret / ConfigMap（管理集群自定义资源、敏感配置、普通配置）写入 etcd
  -> controller / informer cache（控制器与资源通知器缓存）观察期望状态
  -> agent（代理）把动作送到 downstream apiserver（下游集群资源接口）
  -> downstream object/status（下游资源对象与实际状态）返回
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
# 续行反引号后不能加注释或空格；下列命令只渲染，不创建资源。
helm template rancher rancher-stable/rancher `
  --version $chartVersion `
  --namespace cattle-system `
  --set hostname=rancher.lab.local `
  --set replicas=3 > rancher-rendered.yaml
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

这个实验没有创建集群资源。检查并提交脱敏后的 `rancher-rendered.yaml`；若不保留，只在确认它是本轮新建文件后删除它，不删除 Helm 共享缓存。不要把真实 hostname、密码、Token 或 CA 私钥替换进公开证据。

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

## 老师带你分清三个容易混在一起的“集群”

先想象公司有三个学校，每个学校能自行上课；教育管理中心负责统一账户、资源清单和制度。Rancher 更接近管理中心，下游 Kubernetes 集群像各学校，RKE2/K3s 是建设学校时采用的不同方案。管理中心电话断了，学校未必停课，但统一审批和调度会受影响。

管理集群负责运行 Rancher 自身，其 etcd 保存 Kubernetes 和平台对象。下游集群有自己的控制面和工作负载状态。你在终端输入一条 `kubectl` 命令，必须知道当前上下文连接的是哪一套，否则可能把管理集群的 Pod 当成业务 Pod。

Context（上下文）是一组集群地址、身份和默认命名空间的选择。执行 `kubectl config current-context` 是确认去哪里操作；执行 `kubectl cluster-info` 是核对服务器；它们不是更改集群。别把包含凭据的整个 kubeconfig 当作学习截图，它相当于门禁材料。

老师会要求你先在拓扑图上标注管理集群、每个下游 API 地址类型、代理通信方向和业务入口。管理请求与订单 HTTP 请求画两种箭头：前者可能经过 Rancher，后者通常由下游自己的网关和 Service 服务。这样事故发生时，你能先确定是哪种箭头断了。

### 导入并不是把另一套集群搬进来

导入通常把授权的代理和关联资源安装到已有集群，让平台能观察和管理。原有业务仍由那套 Kubernetes 执行，节点、存储和网络不会因为出现了新入口就自动换实现。

注册 YAML 含有能建立管理关系的地址、令牌或凭据信息，应按敏感材料保护。执行前先核对当前集群、来源、目标 Rancher URL 和权限清单，导入后检查代理就绪与真实管理请求。把 YAML 执行成功看作“整套集群纳管完成”，会漏掉证书和长连接失败。

代理主动建立通道能适应一些无法直接入站访问的环境，但仍依赖 DNS、TLS、代理配置、网络出口和下游 API。WebSocket 是支持持续双向交换的连接机制，某些负载均衡空闲超时或代理设置会让它周期性断开；此时普通首页请求可能一直正常。

## 多租户课堂：项目、配额和网络隔离怎么配合

Rancher Project 可以组织多个 Namespace，方便把团队权限和管理政策落到一组资源。它不是把 Kubernetes Namespace 改了个名字。把一个 Namespace 移入项目可能影响继承的权限或约束，应该当作权限变更审查。

RBAC 是 Role-Based Access Control，即把允许的动作分配给角色，再绑定给身份。`get`、`list`、`create`、`delete` 是不同动作，能列出 Pod 不应自动获得读取所有 Secret 的权限。人员账号、流水线机器账号和紧急管理员分开，才能解释审计中是谁做的变更。

资源配额限制申请总量，网络策略限制流量，存储权限限制数据访问。只把团队分成不同 Project，不能证明它们已经达到业务要求的隔离强度。验收需设计正向和反向案例：团队 A 能读自己的日志，但不能读取团队 B 的敏感配置，允许的业务调用成功，禁止的连接确实失败。

## Fleet 课堂：为什么页面改回去又被改回来了

GitOps 是把期望配置放到 Git，由控制器持续对照实际状态进行交付。Fleet 将仓库内容组织为 Bundle（交付集合），再按目标选择规则分发到集群。你在页面临时改副本数，如果 Git 仍要求旧值，下次调和可能改回去。

先分清“代码里的期望”“管理控制器最后一次同步”“下游实际对象”。同步成功不等于应用已经可用；渲染失败、镜像失败、存储失败和就绪失败是不同阶段。故障时按仓库版本、目标标签、渲染、授权、下游事件与探针依次定位。

两百个集群不能同一时间承受未知变更。先选少量试点，再按地域、租户或业务重要性分批，每批设健康门槛和停止条件。标签选择器如果过宽，会让一次试验触达所有集群，所以目标集合预览本身就是发布检查的一部分。

老师再问你：Git 回滚了，数据库会自动回到旧结构吗？不会。配置回退与数据恢复属于不同问题。涉及数据库迁移的应用仍需要单独的兼容、备份和恢复计划，Fleet 不能替应用判断旧代码是否读得懂新数据。

## 备份恢复课堂：文件存在只是第一步

Rancher 平台状态、管理集群状态和下游业务数据的备份范围不同。Backup Operator 的作用边界要按版本文档确认，不能看见一次 Rancher 备份成功，就声称下游所有数据库已备份。

恢复演练应使用隔离环境，按既定方案准备版本、证书和目标存储。先验证恢复后的平台对象、身份与配置，再验证与测试下游的管理关系，最后验证一次可回收的真实变更。不能让恢复副本意外同时控制生产下游，造成两套控制器竞争。

RPO 是允许丢失的平台配置时间，RTO 是允许平台管理能力中断多久。如果最近一天添加了十个集群，但备份是一周前的，就要评估管理关系和授权缺口。恢复目标不仅是登录页打开，还包括 agent 状态新鲜、权限正确、Fleet 停止/恢复策略可控。

## 三分钟面试回答：用两个探针解释一场事故

**30 秒：**Rancher 运行在管理集群，通过代理管理下游 Kubernetes。我会分别探测管理入口、下游原生 API 和业务请求；平台看不到集群时，先确认影响范围，再检查代理长连接、证书和管理集群。

**3 分钟：**一次管理变更先进入 Rancher 的认证授权与资源控制，再通过代理落到下游 API，控制器观察实际状态并回报页面。这里存在异步传播和缓存，因此必须带上上下文、资源版本与观察时间。导入只建立管理关系，业务生命周期仍由下游控制面负责，但平台 Webhook、GitOps 和新发布动作可能受管理面故障影响。

生产设计需要独立管理故障域、入口和证书冗余、最小权限、原生 kubeconfig 应急通道、分批 GitOps 交付及可验证备份。容量不仅看网页人数，还看集群与对象数量、持续观察、长连接和恢复时的重连尖峰。升级前匹配支持矩阵，并明确 Helm 清单回退和平台数据恢复的边界。

追问“原生 API 也不通怎么办”，就从管理故障假设转向下游控制面、网络和凭据；“为什么不重新导入”，要解释重新导入可能掩盖已有身份、策略和管理状态缺失；“怎么证明恢复”，要同时验证管理链路、状态同步和业务探针，附上一条实验变更的审计。

## 身份精讲课堂：登录、代理和集群权限是三次不同检查

老师让你用公司统一账号登录 Rancher。登录成功说明身份提供方和 Rancher 接受了这份身份，不表示你自动拥有两百个集群的权限。平台会把用户或组关联到全局、集群、项目等角色，再把获准的操作落实到对应目标。身份源组名称变化、成员关系过期或授权范围变化，都可能表现为“昨天能看，今天看不到”。

OIDC 是 OpenID Connect，一种常见身份联合协议；外部身份提供方签发声明，平台验证发行者、接收对象、签名与有效期，并根据约定的组字段建立权限映射。具体 Rancher 身份驱动的支持方式以版本文档为准。组字段不是任意可信字符串，必须明确谁能维护、哪些组映射高权限，防止把全部已登录用户错误映射成管理员。

代理访问下游与直接访问下游可能使用不同的地址和认证路径。一个从 Rancher 下载的 kubeconfig 不一定就是“平台故障时独立可用”的应急材料；先检查它的服务器地址是否仍经 Rancher 代理，以及凭据是否依赖平台。真正的应急通道要在隔离演练中证明管理入口不可用时仍能直达获准的下游 API，同时有保管、短期授权、使用审计和轮换。

安全并不意味着永远不给应急权限，而是把 break-glass（打破常规流程的紧急访问）设计成受控例外。材料按秘密存储，使用需要事故编号和双人核对，结束后撤销临时授权并补审计。不能为了方便给每个开发者一份永久下游管理员 kubeconfig，那会绕过平台辛苦建立的边界。

## 代理通信精讲：为什么网页正常却每五分钟断一次集群

普通网页请求可以几百毫秒结束，agent 的管理通道却要长期存在。反向代理或防火墙的空闲连接时限、TLS 中间设备、WebSocket 升级处理和代理环境变量都可能影响它。排障先把断连时间画成序列：是否接近固定周期，是否集中在某条出口，是否只有经过某个代理的集群受影响。周期性是线索，不是根因证明。

证据应在两端对齐：Rancher Server 的连接日志、下游 cluster-agent 的重连/证书日志、入口访问与错误日志、DNS 结果和时间同步。看到 `x509` 先分析证书链与名称，看到连接关闭再看负载均衡与中间路径，不把所有情况都称作 WebSocket 被拦。日志含注册凭据或内部 URL 时先脱敏，再进入团队工单。

管理通道恢复后也有追赶成本。两百个集群同时重连，会产生身份验证、资源同步和 watch 重建；如果每个集群有一万对象，瞬时重列总量可能很大。API 限流和退避不是错误，而是保护机制。扩容 Rancher Pod 不一定解除 management etcd、下游 API 或外部身份源的瓶颈，压测应覆盖重连风暴，不只测稳定状态。

前文 agent 缩到零的实验如果被平台控制器恢复了，记录这个调和行为即可，不继续删除控制器或阻断生产网络以凑出红色截图。实验目的在于区分管理面与业务面信号，不是证明任何版本都必定按同一方式断开。恢复时核对原副本数、Pod Ready、连接日志与资源新鲜度；只恢复 Pod 数量还不算闭环。

## Fleet 交付精讲：三层状态如何帮你定位一次失败

先看 GitRepo 这一类仓库同步对象对应的提交和路径，再看 Bundle（准备分发的资源集合），最后看目标集群上的 BundleDeployment（对某个目标的交付状态）。这些名字帮助定位“取代码、生成集合、目标执行”三种阶段，实际对象与字段按 Fleet 版本确认。源码已经合并，不证明管理端拉到了新提交；Bundle 生成了，不证明每个目标都执行成功。

目标选择尤其危险。用集群标签匹配生产区域时，新建集群一旦满足标签也可能自动进入交付范围；修改标签因此可能等价于新增生产部署。评审应列出本次匹配集合和新增/移出差异。灰度不只是配置一个小副本数，而是先控制哪些集群收到变更，再在每个集群控制应用流量，并对每批建立自动停止条件。

漂移处理要与应急变更协调。事故中临时把副本从十改成二十，GitOps 可能又改回十；如果未经说明停掉全部调和，又会失去其他安全配置更新。运行手册应提供限定目标、限定时间的暂停或例外机制，并明确谁负责把临时决策回写 Git。恢复调和前先预览差异，不能让一份旧期望把刚修好的数据或权限覆盖掉。

配置回退不等于业务副作用回退。Job 发出的消息、数据库迁移、外部云资源创建需要各自的幂等与补偿。交付平台应记录外部任务编号、变更版本和已完成阶段，不能只留一个 Bundle 状态。面试回答“Git 是唯一真相”时要加边界：它保存受版本控制的期望配置，并不是数据库内容、运行中事务和所有实际状态的替代物。

## 管理平台恢复精讲：备份的边界要逐层签字

把备份清单分成三层：Rancher 管理对象和相关秘密、承载 Rancher 的 Kubernetes 控制面与基础设施、下游每个业务自己的数据。不同备份工具覆盖不同层，重叠也不代表自动一致。比如平台配置恢复到昨天，而外部身份组今天已撤权，恢复后必须复核授权，不能把旧权限作为“数据恢复正确”的证明。

隔离恢复环境首先限制对生产下游的访问，避免恢复副本通过仍有效的凭据再次接管目标。接着准备受支持版本、证书、域名、存储和备份，按官方恢复流程操作。先验证平台对象，再用专用测试下游验证代理、权限与一次可回收变更；证据充分后才讨论接入生产。恢复过程中产生的新注册材料同样按秘密管理。

RTO 要包括发现故障、获取审批、准备环境、下载备份、恢复数据、验证身份、重建通道与业务管理验收，不只是恢复 Job 的执行时长。RPO 要说明可能丢失哪些新集群、权限变更与交付配置。若只能接受十分钟管理配置损失，而备份每天一次，就需要调整流程与目标，不能靠三副本弥补备份间隔。

版本升级必须检查 Rancher 与管理/下游 Kubernetes、agent、Fleet、webhook、cert-manager、Backup Operator 等组合。不是所有组件都能独立跳到最新。先确定支持的逐版本路径和不可逆数据迁移点，再安排试点与批次。升级失败时旧镜像能否读取新管理对象，需要官方支持与演练证据，不能凭 Helm history 中有旧 revision 就承诺秒回滚。

## 大厂设计题作答：管理两百集群的最小可靠架构

我会先问集群分布、网络可达性、对象数量、用户与自动化并发、下游发行版和管理中断容忍度。管理集群独立故障域部署，入口、DNS、TLS 和身份源有冗余，持久状态按恢复目标保护。下游保留受控原生操作路径，不把平台界面当作唯一生命线。数据面业务 SLI 与管理面 SLI 分开，避免统一平台断线引发两百个“业务宕机”的错误结论。

交付采用目标集合预览、试点、分批和业务验收，角色按团队范围限制，读取日志与敏感配置分别审查。容量覆盖稳定连接、资源变更和集中重连，监控请求延迟、错误、队列、watch 新鲜度、etcd 和节点资源。备份定期在隔离环境恢复，验证身份与测试下游管理操作；升级设置停止点，任何临时绕过有到期时间和恢复责任人。

如果面试官问“管理平台故障是否应立即重建全部下游”，我的答案是否定的：先证实下游 API 和业务仍正常，保护现有集群，修复真正失效的管理链。重新创建会改变身份、网络与数据，影响面远大于一条 agent 通道。成熟运维的能力，是把一个很大的红色页面拆成最小可证伪问题，并用最小范围修复闭环。

## 恢复推演课堂：平台对象回来了，消失的机器会回来吗

先读清一个经常被误解的承诺：Rancher Backup 主要保护所在管理集群中被资源集合选中的对象，不会顺便连接每个下游备份业务数据。恢复一个描述下游集群的管理对象，也不等于重新生成已删除的机器和注册关系。官方[备份恢复使用边界](https://ranchermanager.docs.rancher.com/how-to-guides/new-user-guides/backup-restore-and-disaster-recovery/back-up-restore-usage-guide)明确区分管理资源、下游资源与删除后的外部结果。

这里的 ResourceSet 是备份要收集哪些资源的选择规则。它回答“收什么”，不是“这些对象关联的全部外部数据都已收齐”。例如对象里写着一个外部存储地址，备份对象通常只得到这个地址与相应配置，不得到该存储里的所有字节。新增扩展或自定义秘密后，应重新核对选择范围；不能因为过去恢复过一次，就认为今天新增的对象仍然受保护。

老师给一份事故材料：昨天备份成功，今天误删下游集群，随后恢复了昨天的 Rancher 备份。请分别预测管理清单、下游机器、代理注册、业务磁盘四项结果。没有下游和基础设施证据时，四项都不能直接写“已恢复”。删除动作可能已经触发外部清理，恢复描述信息无法倒转这些副作用。这也解释了为什么不应该把“先删除再恢复”当成普通故障注入方式。

可回收的课堂替代是纸面资源账本。基础步骤：建立管理记录甲、下游机器乙、业务卷丙三行，写出各自备份负责人和恢复入口。故障步骤：标记管理记录丢失，但乙、丙仍在，要求学生提出只恢复管理层的方案；第二种故障再标记乙已删除，观察原方案为何不够。恢复步骤是补齐机器重建、注册关系与业务挂载的独立证据，而不是伪造一次成功截图。清理只移除合成账本，不删除任何集群或磁盘。

验证答案的标准是因果链完整：每个实际恢复动作必须有对应的状态来源和授权，每个外部结果必须重新检查。若答案只写“还原 YAML”，追问旧凭据是否仍有效、节点身份是否一致、磁盘是否存在、工作负载是否能重新调度。这样即使没有商业测试环境，也能练习恢复边界，而不会把危险删除包装成学习捷径。

## 平台迁移课堂：为什么旧平台不能一直与新平台并行接管

迁移不是升级的别名。它把同一套平台状态移到新的承载环境，应该先保持版本与必要身份条件稳定，再单独规划后续升级。官方[迁移流程](https://ranchermanager.docs.rancher.com/how-to-guides/new-user-guides/backup-restore-and-disaster-recovery/migrate-rancher-to-new-cluster)要求保留原服务器域名等条件；不能为了测试方便改个域名，就假设全部下游会自动找到新入口。

域名相同又带来另一层问题：旧、新入口在切换窗口可能被不同客户端解析到。DNS 缓存、长连接和入口负载均衡的存量连接使“记录已改”与“所有代理已切过去”不同步。迁移验收应按下游清单记录每个代理连接去向、最近同步时间和目标管理实例，直到覆盖约定范围。仅从一个浏览器打开新登录页，无法证明两百个下游都完成切换。

双活在这里不能随口理解为双重安全。如果两份恢复自同一备份的控制器都仍可管理同一批下游，旧期望与新期望可能竞争，审计归属也变得模糊。演练阶段新环境先与生产下游隔离，正式切换按官方流程停用旧控制路径，再开放新路径；回退时同样明确哪一方拥有管理权。保留旧备份有助恢复，不意味着保留旧控制器持续工作。

用状态表推演四步：旧平台管理、新平台隔离恢复、旧平台停止接管并切换入口、新平台逐项验收。故障若发生在第二步，可以放弃测试副本，旧平台继续工作；若发生在第四步，要先明确新平台是否已经发出变更，再决定回退入口与状态。不能把两种情形都写成“改回 DNS 即可”，因为新变更可能已经落实到下游。

## 权限恢复课堂：备份中的旧管理员不一定还应该是管理员

备份提供历史状态，授权表达当前组织决策，两者不天然一致。一个人员昨天还有项目权限，今天已离职；恢复昨天的角色绑定后，必须用当前身份名册与撤权记录重新核对。安全验收不仅检查该读的资源能读，还要检查离职账号、过期令牌和跨团队访问继续被拒绝。

可以准备三个虚构测试身份：只读查看者、项目维护者、无权限用户。基础步骤先记录各自允许和禁止的动作；恢复演练后重复相同矩阵，预期业务权限不意外扩大。故障步骤在纸面把无权限用户加入高权限组，要求指出审计、身份源和角色映射中的哪条证据会暴露差异；修复后再次验证拒绝。不要使用真实管理员令牌来模拟普通用户，否则所有检查都可能得到误导性的允许结果。

这类测试适合 AIOps 自动生成报告，但不适合自动授予管理员。模型可以提示“恢复配置比当前授权基线多了一个绑定”，让责任人判定是合法补充还是历史权限回流。审计应记录判断、变更编号和复验结果，避免把恢复窗口变成长期授权例外。

前文离线渲染前请使用本轮独立目录，并确认 `rancher-rendered.yaml` 尚不存在，防止输出重定向覆盖学习者已有文件。渲染会访问仓库或缓存，但不代表缓存全部属于本实验；无需猜测或删除 Helm 共享缓存。本文没有实际运行渲染、迁移或恢复，新增矩阵均为纸面推演边界。

### 交接检查：谁拥有最终决定权

迁移或恢复交接时，写清当前唯一有效的平台入口、负责值班的人、仍未重连的下游、已暂停的交付任务和下一次复查时间。原始故障已经缓解，但仍有失联集群时，结论应是“部分恢复”，不能用总览页多数绿色掩盖遗漏。对每个未恢复对象给出业务影响和受控原生访问方式，避免下一班再次执行全局修复。

回滚资料还应记录备份时刻之后发生的合法变更。否则恢复成功后，人们可能把新建项目消失、权限退回和应用版本变化误判为第二场事故。恢复方案应明确如何补录这些变化、由谁审批以及如何避免把原故障配置重新引入。能够解释这些时间差，才算真正理解管理平台状态恢复，而不是只会点恢复按钮。

## 学习证据

- `labs/rancher/product-map.md`
- `labs/rancher/rancher-rendered.yaml`
- `labs/rancher/management-downstream-topology.md`
- `labs/rancher/runbook-cluster-unavailable.md`
- `labs/rancher/backup-restore-checklist.md`

公开仓库不要提交 Rancher Token、真实 URL、集群注册 YAML、kubeconfig、CA 私钥、客户名称和支持包。

## 本文边界与下一步

本文覆盖岗位所需 Rancher 主线，不展开 RKE2/K3s 内部实现和 Fleet 超大规模调优。本次更新只静态核对官方资料与 Chart 渲染命令，没有安装 Rancher、导入下游集群、阻断 agent 或执行备份恢复；2.15.0 与目标 Kubernetes patch、OS、cert-manager、Fleet、Backup Operator、身份源和私有 CA 的组合仍须按实际支持矩阵确认。下一步在隔离环境完整运行两项实验并保存证据。
