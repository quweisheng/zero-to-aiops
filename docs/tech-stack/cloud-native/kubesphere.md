# KubeSphere 深讲

> 学习目标：理解 KubeSphere 与 Kubernetes 的关系，能看懂工作空间、集群、项目和扩展组件，完成一次资源巡检，并从界面问题回到 Kubernetes 原生对象排障。

## 官方资料

- [KubeSphere 4.2 文档](https://docs.kubesphere.co/v4.2.0/)
- [产品介绍](https://docs.kubesphere.co/v4.2.0/01-intro/01-introduction/)
- [安装 KubeSphere](https://docs.kubesphere.co/v4.2.0/02-quickstart/)
- [扩展组件](https://docs.kubesphere.co/v4.2.0/06-extension/)

KubeSphere 4 使用 LuBan 可扩展架构。旧版 3.x 文档中的菜单、组件和安装方式不应直接套到 4.x，操作前先确认环境版本。

## 官方知识地图

```text
KubeSphere
  -> ks-core 与 Web Console
  -> 用户、工作空间、集群和项目
  -> LuBan 扩展组件
  -> 多集群管理
  -> DevOps、可观测性和应用管理扩展
  -> 平台运维与升级
```

## 场景开场

公司有多个 Kubernetes 集群。研发希望通过统一界面申请命名空间、看日志和发布应用，平台团队又必须限制每个团队的权限和资源。KubeSphere 提供的正是这层多租户平台体验。

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
- 管理一个或多个 Kubernetes 集群。
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

- **是什么**：一个平台入口管理多个成员集群。
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
  -> ks-core / 扩展 API
  -> Kubernetes API Server
  -> 工作负载与集群资源

成员集群状态
  -> 平台管理链路
  -> 统一资源与权限视图
```

## 安装与启动

先确认官方版本兼容矩阵和 Kubernetes 前置条件，再按当前版本 Quickstart 安装。生产环境还要评审高可用、存储、入口、证书和备份。

```powershell
kubectl version # 确认能访问目标 Kubernetes 集群
kubectl get pods -A # 建立安装前基线，记录已有异常 Pod
kubectl get pods -n kubesphere-system # 安装后检查核心组件是否 Running
```

正常结果是客户端能连接集群，核心 Namespace 中 Pod 就绪；若 Namespace 不存在，说明尚未安装或使用了不同名称，不能直接判断平台故障。

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

不用依赖具体扩展，生成一份 KubeSphere 所管理 Kubernetes 集群的基础健康证据。

### 实验步骤

```powershell
New-Item -ItemType Directory -Force kubesphere-lab | Out-Null # 创建实验结果目录
kubectl cluster-info | Out-File -Encoding utf8 kubesphere-lab\cluster-info.txt # 保存控制面地址
kubectl get nodes -o wide | Out-File -Encoding utf8 kubesphere-lab\nodes.txt # 保存节点状态
kubectl get pods -A | Out-File -Encoding utf8 kubesphere-lab\pods.txt # 保存所有 Pod 状态
kubectl get events -A --sort-by=.lastTimestamp | Select-Object -Last 50 | Out-File -Encoding utf8 kubesphere-lab\events.txt # 保存最近事件
```

### 验证结果

四个文本文件都存在，节点状态为 Ready，异常 Pod 和 Warning 事件已被明确记录。全绿不是实验成功的唯一标准，能如实保存异常同样是有效结果。

### 如果没有成功

1. 用 `kubectl config current-context` 确认当前集群。
2. 用 `kubectl auth can-i list pods -A` 检查权限。
3. 若只能访问部分 Namespace，去掉 `-A` 并指定获授权项目。
4. 页面正常但命令不通时，检查本机 kubeconfig 身份，不要混淆两套账号。

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

本文覆盖岗位所需的平台管理与排障主线。生产安装、多集群高可用、扩展开发和版本迁移要继续查阅与你环境严格一致的官方版本文档，并先完成备份和回滚演练。
