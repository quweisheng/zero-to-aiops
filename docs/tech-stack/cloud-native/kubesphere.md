# KubeSphere 深讲

> 学习目标：理解 KubeSphere 与 Kubernetes 的关系，能看懂工作空间、集群、项目和扩展组件，完成一次资源巡检，并从界面问题回到 Kubernetes 原生对象排障。

## 官方资料

- [KubeSphere 4.2 文档](https://docs.kubesphere.co/v4.2.0/)
- [产品介绍](https://docs.kubesphere.co/v4.2.0/01-intro/01-introduction/)
- [安装 KubeSphere](https://docs.kubesphere.co/v4.2.0/03-installation-and-upgrade/02-install-kubesphere/)
- [扩展组件](https://docs.kubesphere.co/v4.2.0/06-extension/)
- [KubeSphere 4.2.1 公告](https://kubesphere.io/news/kubesphere-4.2.1-ga-announcement/)
- [GitHub releases](https://github.com/kubesphere/kubesphere/releases)
- [Community Edition 边界](https://docs.kubesphere.co/v4.2.0/01-intro/04-editions/01-community/)
- [Community Edition GA 与 License](https://kubesphere.io/news/kubesphere-community-edition-ga-announcement/)
- [产品生命周期策略](https://kubesphere.io/news/kubesphere-product-lifecycle-policy/)
- [4.1.x 升级到 4.2.0](https://docs.kubesphere.co/v4.2.0/03-installation-and-upgrade/03-upgrade-kubesphere/03-online-upgrade-kubephere-from-4.1.x/)
- [升级到 Community 4.2.x](https://docs.kubesphere.co/v4.2.0/03-installation-and-upgrade/03-upgrade-kubesphere/05-online-upgrade-to-community-4.2.x/)

KubeSphere 4 使用 LuBan 可扩展架构。旧版 3.x 文档中的菜单、组件和安装方式不应直接套到 4.x，操作前先确认环境版本。

## 2026-08-14 版本、Edition 与 License 边界

| 维度 | 当前可核实锚点 | 小白最容易混淆的地方 |
|---|---|---|
| 产品补丁公告 | 4.2.1 | 这是产品公告，不等于 GitHub OSS 仓库也发布了同号源码包 |
| 官方文档主路径 | 4.2.0 | 操作步骤按这套文档组织，4.2.1 patch 差异仍查公告/交付说明 |
| GitHub OSS release | 当前可见 4.1.3 | 不能把“产品 4.2.1”写成“开源仓库 4.2.1” |
| Community Edition | 需要 License activation，最多 128 vCPU、只支持 1 个 cluster | 超出 entitlement 可能进入 read-only；以当前条款和实际 License 为准 |
| Enterprise Edition | 能力、规模和支持周期由具体 Edition/合同决定 | 不把企业版多集群、SLA 或扩展能力写成社区版默认功能 |

所以看到“同样是 KubeSphere 4.2，菜单却不一样”，先查四件事：产品 patch、Edition、License 状态和已安装扩展。不要先判定安装坏了。

## 官方知识地图

```text
KubeSphere
  -> ks-core 与 Web Console
  -> 用户、工作空间、集群和项目
  -> LuBan 扩展组件
  -> Edition 允许时的多集群管理
  -> DevOps、可观测性和应用管理扩展
  -> 平台运维与升级
```

## 场景开场

公司希望通过统一界面申请命名空间、看日志和发布应用，平台团队又必须限制每个团队的权限和资源。若要管理多个 Kubernetes 集群，还必须确认所用 Edition、License 与合同确实包含多集群能力。

## 一句话人话版

KubeSphere 是建立在 Kubernetes 之上的管理平台，把集群资源、权限和可选平台能力组织到统一入口中。

## 小白可能会问

- 有了 KubeSphere，还需要会 `kubectl` 吗？
- 工作空间、项目和 Kubernetes Namespace 是什么关系？
- 为什么同一个功能在两套 KubeSphere 环境里不一样？
- 页面报错时应该先查 KubeSphere 还是 Kubernetes？

## 为什么要学

岗位把 KubeSphere 与 Rancher、Kubernetes 并列，考察的是平台化管理能力。KubeSphere 可以聚合工作负载、审计、事件和告警入口，但真正的运行状态仍落在 Kubernetes API 和扩展组件中。

## KubeSphere 是什么

KubeSphere 是 Kubernetes 之上的分布式、多租户云原生平台。`ks-core` 提供核心服务和控制台，LuBan 架构让 DevOps、可观测性等能力通过扩展组件按需安装。

## 它解决什么问题

- 为多个团队提供统一的自助式集群入口。
- 通过工作空间和角色组织多租户权限。
- 用扩展组件按需增加 DevOps、监控、日志和应用能力。
- 在 Edition 与 License 允许的范围内管理 Kubernetes 集群。
- 降低日常操作门槛，同时保留 Kubernetes 原生排障路径。

## 核心原理

### 工作空间、项目与命名空间

- **是什么**：工作空间是团队协作与授权边界；项目通常映射到 Kubernetes Namespace。
- **为什么需要**：把组织结构与集群资源隔离关联起来。
- **怎么工作**：用户先获得工作空间角色，再在项目范围内操作工作负载和配置。
- **怎么看或怎么用**：在控制台看成员和角色，同时用 `kubectl get ns`、RoleBinding 验证原生对象。
- **坏了怎么查**：先区分“资源不存在”和“当前用户没有权限”，再查角色绑定和目标集群。

### ks-core 与扩展组件

- **是什么**：ks-core 是核心平台；扩展组件提供可选功能。
- **为什么需要**：避免所有环境被迫安装一整套组件，也允许能力独立演进。
- **怎么工作**：扩展通过 LuBan 框架接入后端 API、前端页面和生命周期管理。
- **怎么看或怎么用**：记录扩展名称、版本、安装状态和依赖，不要只看菜单是否出现。
- **坏了怎么查**：检查扩展状态、相关 Namespace、Deployment、Pod、事件和日志。

### 多集群管理

- **是什么**：在具备相应 Edition/License 时，由一个平台入口管理多个成员集群；Community 4.2 不能据此推断拥有多集群能力。
- **为什么需要**：统一权限、资产视图和运维流程，同时隔离不同环境。
- **怎么工作**：主集群保存平台管理信息，成员集群运行实际工作负载并与平台通信。
- **怎么看或怎么用**：核对当前选择的集群、连接状态、版本和 API 可达性。
- **坏了怎么查**：从网络、证书、凭据、时间同步和成员集群 API Server 逐层检查。

### 平台视图与原生状态

- **是什么**：KubeSphere 页面是 Kubernetes 与扩展数据的展示和操作入口。
- **为什么需要**：页面能提高效率，但不能替代底层状态判断。
- **怎么工作**：页面调用平台或 Kubernetes API，最终创建、读取或更新原生资源。
- **怎么看或怎么用**：页面异常时，用同一资源名执行 `kubectl get/describe/logs` 做交叉验证。
- **坏了怎么查**：先判断是前端、平台 API、扩展，还是 Kubernetes 对象本身故障。

## 架构和数据流

```text
用户浏览器
  -> KubeSphere Console
  -> ks-core API / controller
  -> Kubernetes API Server
  -> CRD / ConfigMap / Secret / PVC / RBAC / 工作负载

LuBan 扩展
  -> extension controller / backend / frontend
  -> 扩展 CRD 与状态
  -> Console 菜单与 API
```

Kubernetes API 中的对象是运行状态的重要 source of truth（事实来源），但 KubeSphere 还维护用户、工作空间、扩展和 License 等平台状态。Console 菜单出现只证明前端入口存在，不证明扩展 controller、CRD、PVC 和后端 API 已 Ready；页面缓存也可能比原生状态旧。

工作空间/项目/角色与 Kubernetes Namespace/RBAC 是映射和调和关系，不是简单改名。出现权限差异时，要同时核对 KubeSphere 用户/角色、目标集群上下文、RoleBinding/ClusterRoleBinding 和实际 `SubjectAccessReview` 结果。

## 安装与启动

先确认 Edition、合法 License/交付介质、官方版本兼容矩阵和 Kubernetes 前置条件，再按对应安装入口操作。没有合法 License 或交付介质时，只能对已有环境做授权的只读审计，不能虚构“安装成功”。生产环境还要评审高可用、存储、入口、证书和备份。

```powershell
kubectl version # 确认能访问目标 Kubernetes 集群
kubectl get pods -A # 建立安装前基线，记录已有异常 Pod
kubectl get pods -n kubesphere-system # 安装后检查核心组件是否 Running
```

正常结果是客户端能连接集群，核心 Namespace 中 Pod 就绪；若 Namespace 不存在，说明尚未安装或使用了不同名称，不能直接判断平台故障。

## 状态模型、高可用与容量

### 状态怎么从页面走到 Kubernetes

```text
用户选择 workspace / cluster / project
  -> Console 调 ks-core 或扩展 API
  -> 身份与权限检查
  -> Kubernetes API 创建/读取原生对象或扩展 CRD
  -> controller 调和 desired state
  -> status / event / log 回传
  -> Console 显示最近一次观察结果
```

排障时保存页面请求时间、用户、workspace、cluster、project、对象 UID/resourceVersion 和原生 Event。重复点击“安装/升级”可能制造并发调和，先判断上一次动作是否仍在执行。

### 高可用

- Kubernetes 控制面 HA 不等于 KubeSphere HA；ks-core、Console、扩展 controller、入口、DNS/TLS 和依赖存储都要分别设计。
- 无状态组件使用多副本、反亲和和 PDB；有状态扩展的 PVC、数据库、对象存储和消息组件要有各自的备份与恢复。
- 备份应覆盖核心配置、License/Secret、扩展清单与数据，并在隔离集群验证。敏感 Secret 需加密、限制访问并按合同处理。
- 扩展升级失败时，不能只重装前端；要判断 CRD/schema、controller 与持久化数据是否仍兼容旧版本。

### 容量

Community 的 128 vCPU/单集群 License 门槛属于前置容量检查。技术容量还要算 Kubernetes 对象/watch 数、并发用户、审计量、Console/API 延迟、扩展 controller 队列、日志/指标存储和备份窗口。接近 License 限额时要提前告警，避免事故中才进入 read-only。

## 安全、扩展供应链与升级

- TLS/Ingress 保护入口；外部身份、工作空间角色和 Kubernetes RBAC共同形成租户隔离。定期用最小账号验证，而不是只审管理员配置。
- License Secret、身份源 Secret、kubeconfig、备份和扩展仓库凭据不能进公开 Git。审计要关联用户、集群、项目、资源和变更 ID。
- 扩展安装前核对来源、签名/校验、版本、依赖、CRD、权限、PVC 和网络出口。扩展等同运行在平台里的供应链代码，不能把市场按钮当安全审查。
- 4.1.2/4.1.3 → 4.2.0 的官方路径要求目标 Kubernetes 1.23–1.32，并先备份扩展、配置和数据；3.5 不能直接跳到 4.2。其他源/目标组合必须走对应文档。
- 升级顺序要包含 core、CRD、extensions 和数据 migration。回滚决策点设在不可逆 Schema/CRD 变化前；过线后通常需要恢复备份或 forward-fix，不能只换回旧镜像。

## 配置详解

下面是给应用设置资源边界的原生 Deployment 片段。即使从 KubeSphere 页面创建，最终也应能在 Kubernetes 中看到这些字段。

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-api
  namespace: demo # 项目通常对应这个 Namespace
spec:
  replicas: 2 # 期望维持两个 Pod
  selector:
    matchLabels:
      app: order-api
  template:
    metadata:
      labels:
        app: order-api
    spec:
      containers:
        - name: order-api
          image: nginx:1.27
          resources:
            requests:
              cpu: 100m # 调度时至少预留 0.1 个 CPU 核
              memory: 128Mi # 调度时至少预留 128 MiB 内存
            limits:
              memory: 256Mi # 容器内存超过限制可能被 OOMKilled
```

## 命令 / 配置 / API 字典

| 名称 | 作用 | 常用写法 | 正常结果 | 常见坑 |
|---|---|---|---|---|
| `kubectl get` | 看资源当前状态 | `kubectl get pods -n NS -o wide` | Pod 就绪并有节点/IP | 查询了错误集群或 Namespace |
| `kubectl describe` | 看事件和详细配置 | `kubectl describe pod NAME -n NS` | 能看到调度、探针、拉镜像过程 | 只截最后一行错误 |
| `kubectl auth can-i` | 验证权限 | `kubectl auth can-i get pods -n NS` | 返回 yes 或明确 no | 页面账号和 kubeconfig 身份不同 |
| 工作空间 | 组织和授权边界 | 控制台成员与角色 | 用户只见获授权资源 | 误认为它等同单一 Namespace |
| 扩展组件 | 按需增加平台能力 | 扩展市场安装 | 状态正常、页面入口可用 | 忽略版本和依赖兼容性 |

## 在 AIOps 中的作用

KubeSphere 可作为平台运维入口，把集群事件、指标、日志、流水线和权限上下文放到同一工作空间。AIOps 自动化仍应通过受控 API、GitOps 或 Runbook 执行，并记录集群、命名空间、资源和变更人，避免只保留页面截图。

## 入门实验：生成集群健康快照

### 实验目标

对一个已授权的 KubeSphere 4.2.x 环境同时生成 Kubernetes 基线和 KubeSphere 核心/扩展证据。若没有 KubeSphere 环境，只能完成前四项 Kubernetes 基线，并明确标注“未验证 KubeSphere”。

### 实验步骤

```powershell
New-Item -ItemType Directory -Force kubesphere-lab | Out-Null # 创建实验结果目录
kubectl cluster-info | Out-File -Encoding utf8 kubesphere-lab\cluster-info.txt # 保存控制面地址
kubectl get nodes -o wide | Out-File -Encoding utf8 kubesphere-lab\nodes.txt # 保存节点状态
kubectl get pods -A | Out-File -Encoding utf8 kubesphere-lab\pods.txt # 保存所有 Pod 状态
kubectl get events -A --sort-by=.lastTimestamp | Select-Object -Last 50 | Out-File -Encoding utf8 kubesphere-lab\events.txt # 保存最近事件
kubectl -n kubesphere-system get deploy,statefulset,pod,svc,ingress -o wide |
  Out-File -Encoding utf8 kubesphere-lab\kubesphere-core.txt
kubectl get crd | Select-String 'kubesphere|extensions' |
  Out-File -Encoding utf8 kubesphere-lab\kubesphere-crds.txt
kubectl api-resources --verbs=list -o name | Select-String 'kubesphere|extension' |
  Out-File -Encoding utf8 kubesphere-lab\kubesphere-api-resources.txt
```

### 验证结果

七个文本文件都存在；节点、ks-core/Console 与已安装扩展状态被如实保存，异常 Pod 和 Warning Event 被明确记录。全绿不是实验成功的唯一标准，能证明“哪个层未验证”同样是有效结果。

再从 Console 创建一个名为 `kubesphere-lab` 的一次性 Project/Namespace，并在里面创建只含 `lab=true` 的 `ui-api-proof` ConfigMap，然后用原生 API 交叉验证：

```powershell
kubectl -n kubesphere-lab get configmap ui-api-proof -o yaml |
  Out-File -Encoding utf8 kubesphere-lab\ui-api-proof.yaml
```

预期对象名、Namespace、label 和 resourceVersion 与 Console 一致。这一步证明一次真实 UI 动作落到了 Kubernetes API；完成后从 Console 删除该实验 ConfigMap 和一次性 Project/Namespace，并用 `kubectl get` 确认 NotFound。不要在业务 Namespace 做实验。

### 如果没有成功

1. 用 `kubectl config current-context` 确认当前集群。
2. 用 `kubectl auth can-i list pods -A` 检查权限。
3. 若只能访问部分 Namespace，去掉 `-A` 并指定获授权项目。
4. 页面正常但命令不通时，检查本机 kubeconfig 身份，不要混淆两套账号。
5. `kubesphere-system` 不存在时，先从官方安装记录确认实际 Namespace；不要为了让命令“变绿”自行创建同名 Namespace。
6. Console 没有 ConfigMap 菜单时，检查 Edition/扩展/权限，并改用当前文档中可创建的无状态实验对象。

## 故障注入实验：用最小 RBAC 复现“看得见页面但操作被拒绝”

只在一次性 Namespace 执行；该实验不会修改 KubeSphere 核心组件。

```powershell
kubectl create namespace ks-rbac-lab
kubectl -n ks-rbac-lab create serviceaccount limited-viewer
kubectl -n ks-rbac-lab create role config-reader --verb=get,list --resource=configmaps
kubectl -n ks-rbac-lab create rolebinding config-reader `
  --role=config-reader --serviceaccount=ks-rbac-lab:limited-viewer

$identity = 'system:serviceaccount:ks-rbac-lab:limited-viewer'
kubectl auth can-i list configmaps -n ks-rbac-lab --as=$identity
kubectl auth can-i list pods -n ks-rbac-lab --as=$identity
kubectl get pods -n ks-rbac-lab --as=$identity
```

预期：列 ConfigMap 返回 `yes`，列 Pod 返回 `no`，实际 Pod 查询得到 `Forbidden`。这说明“资源存在”和“当前身份有权看”是两个问题；KubeSphere 页面遇到 403 时也应沿用户 → 工作空间角色 → 项目 → Kubernetes RBAC 取证，而不是重启 ks-core。

恢复与清理：

```powershell
kubectl delete namespace ks-rbac-lab --wait=true
```

只删除本实验创建的 Namespace。若 Namespace 中出现不属于本实验的对象，立即停止清理并先确认操作者和上下文。

## 生产事故题：扩展菜单存在但页面持续 500

**证据**：记录产品 patch、Edition、License、扩展名/版本/状态、Console 网络请求、ks-core 与扩展 backend/controller 日志、CRD/status、Pod/PVC/Event、最近安装/升级和 Kubernetes API 健康。

**假设**：前端已加载但 backend 未 Ready、扩展依赖不兼容、CRD/schema migration 失败、RBAC 拒绝、PVC/数据库异常、License/Edition 不允许，或 Console 缓存了旧资源。用同一 API 的直接请求和原生对象逐个证伪。

**修复与爆炸半径**：冻结该扩展继续升级，保护 CRD/PVC/数据库证据；若不影响 core 和业务工作负载，限制修复范围到扩展。不要删除 CRD 或 PVC 来“重装”，这可能级联删除数据。

**复验与回滚**：验证 backend Ready、API 2xx、真实 UI 动作、原生对象、审计与告警。若跨过不可逆 schema 迁移，只能按备份恢复/forward-fix 决策，不能以菜单重新出现作为成功标准。

## 系统设计题：为多个团队建设 KubeSphere 平台

先确认 Edition/License 是否允许目标集群数和容量，再设计 ks-core/Console/扩展 HA、入口 TLS、身份/RBAC/租户隔离、扩展供应链、审计、存储备份、容量与 License 告警、升级顺序和原生 kubectl 逃生路径。追问“为什么不能只看平台界面”时，要说明 Console 是聚合视图，真实工作负载、Event、RBAC 与扩展状态仍需用 Kubernetes API 交叉验证。

## 常见故障排查

| 现象 | 先检查 | 处理思路 |
|---|---|---|
| 控制台打不开 | Ingress/Service/Pod/证书 | 从入口逐层查到 ks-core |
| 菜单或扩展消失 | 版本、扩展状态、账号权限 | 修复扩展或授权，不直接重装平台 |
| 成员集群断开 | API 可达性、证书、时间、凭据 | 恢复管理链路并验证状态同步 |
| 页面显示与命令不一致 | 当前集群、缓存、API 响应 | 以 Kubernetes API 状态为排障依据 |
| 工作负载发布失败 | Event、调度、镜像、存储、探针 | 按 Pod 生命周期逐步排查 |

## 面试怎么讲

KubeSphere 是 Kubernetes 之上的多租户平台，不替代 Kubernetes。我的排障方法是先确认用户、工作空间、集群和项目上下文，再从页面动作映射到原生对象；平台组件异常查 ks-core 或扩展，业务异常则按 Kubernetes 工作负载链路处理。

递进追问可以这样答：

- **“产品 4.2.1、文档 4.2.0、OSS 4.1.3 冲突吗？”** 它们属于产品补丁、文档主线和公开源码 release 三个渠道，必须分别记录，不能合并成一个“开源最新版”。
- **“Community 能否默认管理多个集群？”** 不能；4.2 Community 当前边界是单集群、最多 128 vCPU并需要 License，实际能力以 entitlement 为准。
- **“页面有菜单为什么功能仍坏？”** 前端入口、扩展 backend/controller、CRD、PVC 和 License 是不同层，必须验证真实 API 和原生 status。
- **“升级失败能否重装扩展？”** 先保护 CRD/PVC/数据库，判断 schema 与版本兼容；盲目删除扩展或 CRD可能级联丢数据。

## 学习检查清单

- [ ] 能解释工作空间、项目和 Namespace 的关系。
- [ ] 能区分 ks-core 与扩展组件。
- [ ] 能确认自己正在操作哪个集群。
- [ ] 能从页面资源跳回 `kubectl` 排障。
- [ ] 能生成并解读一份集群健康快照。

## 面试题

1. KubeSphere 与 Kubernetes 是替代关系吗？
2. 多租户权限应如何分层？
3. 页面正常但成员集群显示断开，如何排查？
4. KubeSphere 4 的扩展架构解决了什么问题？
5. 如何避免平台界面掩盖底层真实故障？

## 学习证据

- `kubesphere-lab/` 集群健康快照。
- 工作空间、项目与角色关系图。
- 一次扩展安装或升级记录。
- 一次从页面异常定位到 Kubernetes 事件的排障记录。

## 本文边界与下一步

本文覆盖岗位所需的平台管理与排障主线。本次更新没有获得或激活 KubeSphere License，没有安装 4.2.1、登录 Console、创建工作空间、运行扩展故障或执行升级；Community/Enterprise 条款、私有交付、合同支持和 4.2.1 patch 兼容必须由实际 entitlement 确认。没有合法环境时只能执行授权的只读审计，不能把文档步骤写成安装成功。生产安装、多集群、扩展开发和版本迁移必须查阅与目标 Edition/版本严格一致的文档并先演练备份恢复。
