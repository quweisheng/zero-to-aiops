# Rancher 深讲

> 学习目标：从零理解 Rancher Manager、管理集群和下游 Kubernetes 集群的关系，掌握集群导入、RKE2/K3s 边界、权限、应用、监控、备份升级与常见排障，并能完成一次不接触生产集群的 Helm 渲染实验。

## 官方资料

- [Rancher Manager 文档](https://ranchermanager.docs.rancher.com/)
- [Rancher 架构](https://ranchermanager.docs.rancher.com/reference-guides/rancher-manager-architecture)
- [安装与升级](https://ranchermanager.docs.rancher.com/getting-started/installation-and-upgrade)
- [生产架构建议](https://ranchermanager.docs.rancher.com/reference-guides/rancher-manager-architecture/architecture-recommendations)
- [备份与恢复](https://ranchermanager.docs.rancher.com/how-to-guides/new-user-guides/backup-restore-and-disaster-recovery)
- [Rancher CLI](https://ranchermanager.docs.rancher.com/reference-guides/cli-with-rancher/rancher-cli)

说明：Rancher、Kubernetes、cert-manager、RKE2/K3s 和 Helm 有明确兼容关系。安装、升级前必须按准确 Rancher 版本读取支持矩阵与发行说明，不能直接复制旧教程的镜像标签。

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
| downstream cluster | 被 Rancher 管理的业务集群 | 管理面故障时业务通常仍由自身控制面运行 |
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
  -> Rancher API and controllers
  -> cluster agent secure connection
  -> downstream Kubernetes API
  -> namespace / workload / app
```

Rancher 不应成为业务访问链路的一部分。管理平台故障和业务数据面故障必须分别监控。

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
bootstrapPassword: ""       # 不在公开 Values 中保存真实初始密码
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
helm show chart rancher-stable/rancher                                        # 查看 Chart 名称和版本
helm template rancher rancher-stable/rancher `                                # 只在本地渲染，不连接集群
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

本文覆盖岗位所需 Rancher 主线，不展开 RKE2/K3s 内部实现和 Fleet 大规模设计。下一步在隔离实验环境完成集群导入、项目权限、应用安装、备份恢复和升级演练。
