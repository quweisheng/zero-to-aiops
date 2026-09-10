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
KubeSphere（容器平台管理层）
  -> ks-core（平台核心）与 Web Console（网页控制台）
  -> 用户、工作空间、集群和项目
  -> LuBan（鲁班扩展框架）与扩展组件
  -> Edition（产品版本类型）允许时的多集群管理
  -> DevOps（开发与运维协作）、可观测性和应用管理扩展
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
  -> KubeSphere Console（平台控制台）
  -> ks-core API / controller（核心接口服务与控制器）
  -> Kubernetes API Server（集群资源接口服务）
  -> CRD / ConfigMap / Secret / PVC / RBAC / 工作负载

LuBan 扩展
  -> extension controller / backend / frontend（扩展组件的控制器、后端与前端）
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
用户选择 workspace / cluster / project（工作空间、集群、项目）
  -> Console 调 ks-core 或扩展 API
  -> 身份与权限检查
  -> Kubernetes API 创建/读取原生对象或扩展 CRD
  -> controller（控制器）调和 desired state（期望状态）
  -> status / event / log（状态、事件、日志）回传
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
if (Test-Path -LiteralPath kubesphere-lab) { throw '实验目录已存在，请改用新的独立目录后重做本课路径' }
New-Item -ItemType Directory kubesphere-lab | Out-Null # 创建本轮独立结果目录
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

再从 Console 创建一个名为 `kubesphere-lab` 的一次性 Project/Namespace，并在里面创建数据字段为 `lab: "true"` 的 `ui-api-proof` ConfigMap，然后用原生 API 交叉验证。此处是 ConfigMap 的数据，不是标签；同名项目已存在时停止并使用独立实验名称：

```powershell
kubectl -n kubesphere-lab get configmap ui-api-proof -o yaml |
  Out-File -Encoding utf8 kubesphere-lab\ui-api-proof.yaml
```

预期对象名、Namespace、`data.lab` 和资源版本与 Console 对同一对象的最新查询一致。这一步证明一次真实 UI 动作落到了 Kubernetes API；完成后从 Console 删除该实验 ConfigMap 和一次性 Project/Namespace，并用 `kubectl get` 确认 NotFound。不要在业务 Namespace 做实验。

### 如果没有成功

1. 用 `kubectl config current-context` 确认当前集群。
2. 用 `kubectl auth can-i list pods -A` 检查权限。
3. 若只能访问部分 Namespace，去掉 `-A` 并指定获授权项目。
4. 页面正常但命令不通时，检查本机 kubeconfig 身份，不要混淆两套账号。
5. `kubesphere-system` 不存在时，先从官方安装记录确认实际 Namespace；不要为了让命令“变绿”自行创建同名 Namespace。
6. Console 没有 ConfigMap 菜单时，检查 Edition/扩展/权限，并改用当前文档中可创建的无状态实验对象。

## 故障注入实验：用最小 RBAC 复现“看得见页面但操作被拒绝”

只在一次性 Namespace 执行；该实验不会修改 KubeSphere 核心组件。执行者须有创建该实验角色和身份模拟（impersonate）的授权；`--as` 不是普通用户绕过权限的方法，缺少模拟权限时会先被拒绝，此时停止并请平台管理员提供隔离实验身份。

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

## 老师带你从一个页面动作走到底层

我们先不背所有菜单。假设老师请你在自己的实验项目里，把 `order-api` 的副本数从 1 改成 2。你点击保存，页面出现成功提示，接下来应该验收什么？先确认平台接受变更，再确认 Kubernetes 里 Deployment 的期望副本数是 2，最后确认两个 Pod 就绪，而且 Service 能把请求送给它们。

Deployment 是“请维持某个版本和数量”的声明，ReplicaSet 是维持数量的控制对象，Pod 是实际运行容器的单元，Service 是稳定访问入口。平台页面把这些对象整理成容易使用的表单，但调度不足、镜像拉取失败、探针失败等问题仍由底层状态呈现。

```text
页面填写 replicas（期望副本数）
  -> 平台身份与权限检查
  -> Kubernetes API（资源接口）保存 Deployment
  -> controller（控制器）推动副本创建
  -> scheduler（调度器）选择节点
  -> kubelet（节点执行者）启动容器
  -> readiness（就绪检查）通过
  -> Service（服务入口）使用可用后端
```

当页面显示“已保存”，只说明前面的某些步骤完成。你可以用 `kubectl -n demo get deployment order-api` 看 DESIRED/CURRENT/AVAILABLE 相关状态，用 `kubectl -n demo get pods -o wide` 看实际 Pod 与节点。这里的 `demo` 是实验项目，使用前必须确认你的真实实验 Namespace。

如果只有一个 Pod，先看 Deployment 条件和事件；如果第二个 Pod Pending（等待调度），看资源、亲和性和存储；如果 Running 但没 Ready（就绪），看探针与应用日志。这条路径帮助你把“页面不好用”拆成可验证的问题。

### 工作空间到底隔离了什么

Workspace（工作空间）负责组织团队、角色和项目，Namespace（命名空间）给 Kubernetes 对象提供命名和部分资源边界。它们不自动形成完整网络隔离：两个不同项目的 Pod 能否互访，还要看 NetworkPolicy（网络策略）、网络插件和具体安全设计。

ResourceQuota（资源配额）限制项目能申请多少资源，LimitRange（默认资源范围）帮助为容器设置边界。`requests` 是调度时申请的资源，`limits` 是运行约束，二者并不等于当前用量。团队配额用完，即使集群总体很空，也可能无法继续创建 Pod。

老师会给你两个账号做验收：项目开发者能创建本项目应用，观察者只能查看允许的资源。分别用页面和同身份的 API 验证。管理员可以看见，不证明开发者可以；另一个 kubeconfig 返回 `yes`，也不证明浏览器账号得到相同授权。

完整租户设计至少包含组织权限、资源额度、网络连通、存储权限、镜像权限和审计。每一项都给一对允许/拒绝案例。例如允许订单项目读取自己的配置，但不允许读取另一个项目的 Secret（敏感配置对象）。测试拒绝是否真实发生，与测试成功同样重要。

### 扩展安装像装进平台的一套服务

扩展可能包含前端页面、后端 API、CRD（自定义资源类型）、控制器和持久化存储。菜单出现只是前端部分就绪，实际控制器可能还在拉镜像，数据库可能尚未迁移，PVC（存储申请）也可能没有绑定。

所以安装前先读依赖、权限与存储要求，安装后按“对象定义、控制器、数据存储、后端请求、用户页面”逐层验收。需要集群级权限的扩展可以影响其他项目，升级窗口不能只邀请使用这个菜单的用户，还要通知平台维护者。

卸载尤其要先问数据保留语义。删除 CRD 可能连带删除这类自定义对象，删除 PVC 也可能触发后端卷回收。看不见菜单不等于数据已经安全归档，点击卸载前保存扩展清单、配置、备份位置和恢复验证记录。

2026-09-08 复核的[社区版说明](https://docs.kubesphere.co/v4.2.0/01-intro/04-editions/01-community/)仍应与自己的授权记录共同使用。Edition 是产品类型，License 是实际授权，Extension 是已经安装的能力；三者分别决定能买什么、获准用什么、现在运行什么。

## 故障课堂：为什么看到的是昨天的数据

平台常用缓存与 watch（持续观察资源变化）降低反复查询成本。某次连接断开后，页面仍可能展示最后一次成功读取的列表。你看到的每条状态都应该有采集时间；没有更新时间的绿色图标，只能证明曾经观察正常。

先在浏览器开发者工具里看同一操作的请求是否返回成功，再查资源名称、集群、项目和时间。随后从原生 API 获取对象 `metadata.resourceVersion` 与 `status`。`resourceVersion` 用来识别某次资源版本，不能当作全系统通用时间戳，也不应自行比较不同资源的业务先后。

如果 API 返回新状态、页面仍旧，检查前端刷新和平台缓存；如果平台 API 已旧、原生 API 新，检查平台控制器连接与权限；如果原生 API 也旧，检查变更是否真的被接受。这个顺序比反复重启控制台更能保护证据。

在 AIOps 里可以把“数据年龄”做成指标：现在时间减去最近成功采集时间。平台入口、Kubernetes 控制面、业务探针分别报警，避免一个平台断线生成几十个“应用宕机”假告警。自动诊断报告附上账号范围、集群上下文、原生对象状态和数据新鲜度。

## 三分钟面试表达：平台化的价值和代价

**30 秒：**KubeSphere 把 Kubernetes 资源、团队权限和可选扩展组织成平台入口。我会从用户、工作空间、集群、项目四个上下文定位操作，再用原生对象确认期望状态是否落实，平台可用和业务可用分别验收。

**3 分钟：**我会用一次应用扩容解释平台价值：用户提交表单，平台完成身份和权限检查，最终写入 Kubernetes 对象，控制器、调度器和节点逐步完成执行。页面提示、资源状态和业务探针不是同一个验收点。多租户除了角色还需要配额、网络、存储和供应链边界，使用最小账号做正反两类测试。

扩展架构允许按需建设监控、日志和交付能力，但引入额外的控制器、CRD、数据存储和升级兼容成本。因此生产方案要同时考虑 ks-core、入口与扩展的高可用，保留原生 API 排障通道；备份恢复要覆盖平台状态与扩展数据，跨 schema 迁移后不能只回退容器镜像。

连续追问时补充：配额没有满为什么仍 Pending，要去看节点资源与调度约束；平台三副本为什么仍登录失败，要查身份源、DNS、入口证书和管理集群；“能安装”为什么不等于“能用”，要区分许可证、组件状态和真实业务操作。你的回答应带一次亲自完成的 RBAC 拒绝实验与恢复证据。

## 平台工程课堂：给开发者一个表单，后台要兑现哪些承诺

老师假设你为研发团队提供一个“创建告警服务”按钮。表单至少要收集镜像、服务端口、健康路径、资源需求、配置来源和数据是否持久化。字段少不一定更易用：省略了数据库依赖或持久化路径，平台可能成功创建一个重启就丢数据的服务。好的平台把危险选项变成有解释的受控选择，而不是把 Kubernetes 的所有 YAML 字段机械复制成网页。

模板默认值也是生产决策。默认没有 requests 会影响调度与配额，默认把全部配置做成公开 ConfigMap 会泄漏秘密，默认所有服务开放外网会扩大攻击面。每个默认值都应能解释“适合谁、不适合谁、怎样改、改后怎么验证”。对学习者而言，先选一个无状态 HTTP 服务理解流程，再添加数据库、存储和证书，学习成本才不会一次堆在一起。

我们把一次创建分成三个合同。输入合同描述镜像格式、资源范围和所需权限；运行合同描述就绪、持久化、网络连通和数据归属；交付合同描述谁负责升级、如何取证和怎样回滚。页面成功提示通常只覆盖其中很小一段，因此平台文档必须让使用者知道下一步去哪里看。

### 为什么对象已经存在，平台仍显示处理中

自定义控制器通常不断比较 spec（期望）与 status（观察结果），执行操作后再更新状态。API 已保存 CR（自定义对象）时，控制器可能还没处理；控制器已创建 Deployment 时，Pod 可能仍在排队。`generation` 表示期望配置版本，某些控制器用 `observedGeneration` 表示处理到哪一版，但不是所有 CR 都采用同样字段。先看这个扩展的定义，不凭字段名猜测。

处理中超过预期时，依次检查控制器是否存活、是否有权限读取对象、是否遇到依赖错误、子资源是否被创建、状态更新是否失败。删除再创建会丢掉时间线，且可能制造重复外部资源。遇到 finalizer（终结保护标记）时，更要先确认控制器在等待清理什么。它可能保护外部卷或资源，强行移除让界面消失，却把外部资源变成无人管理。

## 租户隔离课堂：角色、配额和网络要做三次验收

先把“读权限”拆细：读应用状态、读日志、进入容器、读 Secret 是不同能力。日志可能包含用户数据，容器终端可能读到挂载凭据，创建 Pod 的人还可能让 Pod 挂载其服务账号可使用的秘密。因此安全设计不是给一个叫 viewer 的角色就完事，而是按实际动作和资源验证。

配额限制申请总量，不提供节点级资源保证。一个项目有剩余配额，但指定 GPU 节点全部满了，Pod 仍 Pending；另一个项目当前实际 CPU 用得少，却已经用 requests 申请完配额，也可能被拒绝。排障要同时看 ResourceQuota、Pod requests、节点 allocatable（可分配资源）、调度事件和亲和性。把配额直接调大只解决额度限制，不能创造节点资源。

网络隔离要由支持策略的数据面真正执行。Namespace 的名字像不同教室，墙是否隔音还要看具体网络政策。访问测试需要允许和拒绝两个方向，并验证 DNS、镜像仓库、日志出口等基础依赖，否则“零信任”可能变成所有新应用都无法启动。平台工作空间管理员与集群网络管理员的职责应分开，谁能改全局标签和策略必须审计。

### RBAC 故障实验的修复闭环

前文只读角色实验看到 `Forbidden` 后，如果希望模拟“批准增加 Pod 查看权限”，在删除 `ks-rbac-lab` 之前执行以下最小变更。执行前仍须确认当前上下文和身份模拟权限：

```powershell
kubectl -n ks-rbac-lab create role pod-reader --verb=get,list --resource=pods
kubectl -n ks-rbac-lab create rolebinding pod-reader --role=pod-reader --serviceaccount=ks-rbac-lab:limited-viewer
kubectl auth can-i list pods -n ks-rbac-lab --as=$identity
kubectl get pods -n ks-rbac-lab --as=$identity
kubectl auth can-i get secrets -n ks-rbac-lab --as=$identity
```

预期 Pod 列表权限变为 `yes`，实际查询成功，即使返回“没有资源”也不再是 `Forbidden`；读取 Secret 仍应为 `no`。这比直接绑定 cluster-admin 更准确地体现修复范围。若 Secret 变成 yes，检查该身份是否另有角色绑定，不能宣称本实验已经实现最小权限。

回退新增权限时，删除本实验的 `pod-reader` RoleBinding 和 Role，再查 Pod 列表权限应恢复 `no`；全部完成后删除 `ks-rbac-lab` 命名空间。若前文已经清理，请先重新执行其创建步骤，不在同名业务空间补对象。保存拒绝、授权成功、敏感权限仍拒绝、回退这四个结果，就得到完整可回收闭环。

## 扩展运维课堂：安装按钮背后的供应链与数据生命周期

扩展包可能同时带来前端、镜像、Chart、CRD、权限和后台任务。安装来源可信仅是第一关，还需要记录包版本、镜像摘要、权限范围、兼容 Kubernetes、存储需求和升级说明。平台能显示“可安装”，不证明你的离线仓库已有全部镜像，也不证明 License 覆盖相应功能。

离线环境按依赖闭包准备材料：核心组件、扩展依赖、安装 Hook 所用镜像、运行时拉取地址、证书链和所需许可证。闭包的意思是“它依赖的东西，其依赖也一起准备好”。只镜像同步了主 Pod，初始化 Job 仍访问公网，就可能停在安装阶段。验证应在确实不能访问公网的隔离测试环境中执行，不用联网成功代替离线交付成功。

扩展数据备份要明确什么被保留。监控扩展可能有时间序列数据，日志扩展有索引与原始日志，流水线扩展有凭据和任务记录。备份平台 Kubernetes 对象不自动包含它们的持久卷内容。恢复先验证版本与数据格式兼容，再验证查询结果、时间范围和权限；不要仅看 Pod 已 Running。

升级回滚的关键不是按钮位置，而是不可逆点。若扩展升级改变了数据库 schema 或 CRD 存储版本，旧控制器可能无法解释新状态。变更前确定备份恢复时点、停写要求、转换过程和失败处理；备份必须在隔离环境真正恢复过，才有资格作为回滚手段。升级后要复验既有对象和新建对象，两者可能走不同的兼容路径。

## 容量与事故课堂：大平台为什么不能只看节点 CPU

平台负载包括用户请求、资源列表、watch 连接、指标聚合、日志查询、扩展任务与身份验证。把每个页面自动刷新改得很快，会增加 API 和后端查询压力；把所有命名空间全量拉取到前端，也会放大内存与授权过滤成本。容量压测要覆盖对象数、用户并发、查询时间范围以及故障恢复后的集中重连，而非只打开首页十次。

观察“列表慢”时分解耗时：浏览器到入口、平台鉴权、Kubernetes 查询、聚合转换、后端指标查询与前端渲染。某个大时间范围日志查询慢，不代表创建 Deployment 的 API 也慢。先用同账号、同条件、同时间窗对比，再选择分页、查询限制、后端容量或具体缺陷修复，不能盲目把 ks-core 副本翻倍。

事故场景：升级扩展后旧应用正常，新应用创建一直转圈。先保护现有服务，暂停新的扩展发布；查询请求返回状态、准入 webhook、CRD 与控制器日志，确认是否是新对象在校验或创建阶段被阻断。如果 webhook 不可达，failurePolicy（失败处理策略）决定 API 是拒绝还是忽略，不能为恢复表单随手全局改成忽略，否则可能绕过安全检查。修复要有影响面、审批和恢复原策略的验收。

面试最后追问“平台价值是什么”，可以回答：平台把重复的基础设施步骤变成可审计、自助、有限权限的标准路径，同时保留底层证据和逃生通道。它不是隐藏 Kubernetes 错误的皮肤。学习证据应能从一个页面动作追到 API、对象、控制器、运行结果与审计，证明你理解这份交付合同。

## 扩展生命周期课堂：停用、卸载和数据删除必须分别回答

先把菜单中的两个动词分开。停用表示暂不使用一个已安装扩展，之后可以重新启用；卸载则进入移除扩展的生命周期。官方分别提供[停用扩展](https://docs.kubesphere.co/v4.2.0/06-extension-management/02-manage-extensions/04-disable-extensions/)和[卸载扩展](https://docs.kubesphere.co/v4.2.0/06-extension-management/05-uninstall-extensions/)说明，配置了集群代理的扩展卸载还有先后顺序。不要从中文按钮的日常含义推断所有后端资源都会怎样变化。

为什么需要这一区分？运维可能只是想暂时隐藏或停止使用一个有问题的功能，却误触整个扩展卸载。扩展关联的控制器、代理、凭据、自定义对象和持久数据可能分布在不同范围；界面消失只能说明入口变化。卸载前逐项问“是否还在、谁负责清理、怎样保留、如何恢复”，并查该扩展自己的说明。核心平台不能替每一个扩展统一承诺保留数据库。

课堂采用不执行卸载的依赖表实验。准备日志扩展的五行合成对象：控制台入口、后端查询服务、采集代理、数据索引、存储卷。基础步骤填写每行职责与依赖，确认查询服务依赖已有数据，而采集代理产生新数据。故障步骤把查询服务标记不可用，预测旧数据不一定丢失、采集可能仍在继续；如果把存储卷误删，影响就升级成数据恢复。恢复步骤先恢复查询路径，再检查最新采集时间和历史查询范围。清理仅删除纸面副本，不对真实扩展、卷或索引操作。

验证时要求学生用两个查询回答：“历史数据还能读吗”“新数据还在进入吗”。其中一个成功不能代替另一个。若历史可读、新数据停止，优先查采集与写入链；若新数据存在、旧时间段缺失，查保留与恢复范围。AIOps 应把两类故障分开归因，而不是看到日志菜单报错就删除扩展重装。

## 授权容量课堂：许可证、配额与资源不足是三张不同的账

许可证是产品使用许可，项目配额是平台分给团队的资源预算，节点可分配容量是当前实际能落地的资源。它们单位有时都出现 CPU，但含义和计算口径不同。请求因许可受限、因配额不足、因调度无位置而失败，需要三种证据和三个不同责任人，不能统一解释为“机器不够”。

按官方[许可查看入口](https://docs.kubesphere.co/v4.2.0/04-platform-management/05-platform-settings/02-license/01-view-license-information/)由具有平台设置权限的人员核对核心及扩展许可。记录范围、容量、期限和证据日期，不把激活材料导出到公共文档。不同扩展可能有独立许可，平台核心已激活并不自动证明所有市场功能都在授权内。

再做一题：项目还可申请八核，目标节点合计也有八核，但平台许可已达到现场核算上限，可以直接加节点吗？答案不是根据页面截图猜测。先核实产品版本的许可计量方式和合同，确认扩容后是否仍被允许；再核实配额与节点分布。反过来，许可充足也不能制造 GPU 节点或满足本地盘亲和性。把限制点分别记录，才能避免采购了授权却没有解决调度瓶颈。

生产台账应区分已安装、已授权、已分配、实际使用、故障预留和未来增长。增长评审至少包含扩展存储与采集负载，不只统计用户工作负载。比如新增日志分析能力会增加写入、索引、查询、备份和保留空间，核心平台 CPU 很低也不能说明日志后端还有容量。许可告警和技术容量告警可以关联，但应使用不同的说明与处置入口。

## 故障证据课堂：导出了七个文件，为什么还不能宣布巡检成功

PowerShell 中输出文件存在不证明前面的外部命令成功。权限不足或连接失败时，文件可能为空，错误也可能出现在另一个输出通道；因此前文每个查询后都要检查命令退出码和终端错误，并把失败项记入清单。不能把空列表自动解释成“没有异常”。本轮未连接真实平台，这条规则是在审查实验可复现性时补充的验证要求。

健康快照还需要范围说明。全局权限可以看全部命名空间，项目权限只能看自己的范围；两人导出的数量不同不一定是谁操作错了。记录账号角色、上下文、筛选、采集起止时间与未授权范围，不记录令牌本身。事件也有保留周期，较久以前的故障事件不存在，不代表故障没发生，应结合持久日志与审计。

基础实验验收可以分为四格：文件生成、查询成功、范围覆盖、内容判读。四格都说明白后，再给出核心和扩展的健康结论。若平台界面与原生对象不一致，先确保双方观察的是同一个 UID。UID 是对象的唯一标识，同名对象删除重建后会变化；只按名字匹配可能把旧事件关联到新对象。资源版本用于并发与观察位置，不能把它当成人类时间戳。

本地结果目录收尾也要有边界。保留已脱敏证据，删除原始敏感输出前确认团队留存要求；若无需保存，只逐一处理本轮创建的八个文件，再移除空目录，不递归清空共享实验根目录。健康快照不需要读取 Secret 的内容，不要为了“完整”额外导出全部秘密。

## 面试追问：扩展故障会不会影响核心资源创建

回答要先画依赖，而不是直接说“插件坏了不影响”。如果扩展只是独立查询入口，故障可能局限于该功能；若扩展注册了准入回调、提供共享身份或承担必需存储能力，影响会沿依赖传播。需要查看实际部署与版本，不凭市场分类判断故障域。

处置时先用一个已经获准的无状态测试对象区分读取、创建和更新是否受影响，再查失败请求对应的 API 状态和回调记录。高权限管理员成功也不能代表普通项目身份成功，至少用相同授权范围复验。修复优先恢复失效依赖或回退已证实的错误配置；绕过安全回调需要单独审批、严格范围与到期恢复，不是平台页面卡顿的默认操作。

独立作业请把一次创建请求画到最终就绪状态，并在每个箭头标出可观察证据与超时后的下一项检查。最后给出“核心健康、扩展退化、业务是否受影响、证据新鲜度”四句结论。它比一个绿色总分更适合值班交接，也更能体现平台工程师理解了每层承诺的边界。

### 告警处理练习：让一次错误有稳定身份

页面报错时生成记录，至少包含动作、目标对象、用户范围、请求时间和返回状态；重试时沿用同一事故编号，但不要把不同的创建请求编号混为一个。接口已经成功而页面等待超时，优先查询目标对象，确认是否已创建后再决定下一步。反复点击可能制造多个不同对象，即使每一个单独创建都完全正常。

老师会故意给出两个同名但不同项目的截图，要求你说明哪一条原生查询能够区分它们。答案必须带集群和命名空间，必要时再带对象 UID。这个小练习检验的是操作边界，不是记忆命令长度。自动化若无法确定目标身份，应停止写操作，只输出缺少的信息；禁止把“可能是这个项目”当成执行删除或扩容的充分依据。

权限复验还可以使用 SubjectAccessReview，即向集群询问某身份是否允许某动作的授权检查。它不是实际执行该动作，授权通过后仍须检查资源与运行结果，避免把权限验证误写成业务实验成功。

## 学习证据

- `kubesphere-lab/` 集群健康快照。
- 工作空间、项目与角色关系图。
- 一次扩展安装或升级记录。
- 一次从页面异常定位到 Kubernetes 事件的排障记录。

## 本文边界与下一步

本文覆盖岗位所需的平台管理与排障主线。本次更新没有获得或激活 KubeSphere License，没有安装 4.2.1、登录 Console、创建工作空间、运行扩展故障或执行升级；Community/Enterprise 条款、私有交付、合同支持和 4.2.1 patch 兼容必须由实际 entitlement 确认。没有合法环境时只能执行授权的只读审计，不能把文档步骤写成安装成功。生产安装、多集群、扩展开发和版本迁移必须查阅与目标 Edition/版本严格一致的文档并先演练备份恢复。
