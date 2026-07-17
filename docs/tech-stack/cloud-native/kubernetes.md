# Kubernetes

> 目标：从零建立 Kubernetes 完整知识体系，不只会写 Deployment 和 Service，还能解释 API 请求、etcd 持久化、List-Watch、Informer、控制器、调度、网络、存储、弹性、安全、高可用和升级链路；能完成基础与故障注入实验，能按证据排查生产故障，并能应对大厂面试中的原理追问、故障场景题和集群设计题。

## 官方资料

- [Kubernetes Concepts](https://kubernetes.io/docs/concepts/)
- [Kubernetes Releases](https://kubernetes.io/releases/)
- [Kubernetes Components](https://kubernetes.io/docs/concepts/overview/components/)
- [Cluster Architecture](https://kubernetes.io/docs/concepts/architecture/)
- [Kubernetes API Concepts](https://kubernetes.io/docs/reference/using-api/api-concepts/)
- [Controllers](https://kubernetes.io/docs/concepts/architecture/controller/)
- [Leases](https://kubernetes.io/docs/concepts/architecture/leases/)
- [Admission Controllers](https://kubernetes.io/docs/reference/access-authn-authz/admission-controllers/)
- [Server-Side Apply](https://kubernetes.io/docs/reference/using-api/server-side-apply/)
- [Finalizers](https://kubernetes.io/docs/concepts/overview/working-with-objects/finalizers/)
- [Garbage Collection](https://kubernetes.io/docs/concepts/architecture/garbage-collection/)
- [Pods](https://kubernetes.io/docs/concepts/workloads/pods/)
- [Pod Lifecycle](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/)
- [Deployments](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
- [ReplicaSet](https://kubernetes.io/docs/concepts/workloads/controllers/replicaset/)
- [DaemonSet](https://kubernetes.io/docs/concepts/workloads/controllers/daemonset/)
- [StatefulSet](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/)
- [Jobs](https://kubernetes.io/docs/concepts/workloads/controllers/job/)
- [Service](https://kubernetes.io/docs/concepts/services-networking/service/)
- [DNS for Services and Pods](https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/)
- [Ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/)
- [ConfigMaps](https://kubernetes.io/docs/concepts/configuration/configmap/)
- [Secrets](https://kubernetes.io/docs/concepts/configuration/secret/)
- [Resource Management for Pods and Containers](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/)
- [Scheduling, Preemption and Eviction](https://kubernetes.io/docs/concepts/scheduling-eviction/)
- [Scheduling Framework](https://kubernetes.io/docs/concepts/scheduling-eviction/scheduling-framework/)
- [Pod Topology Spread Constraints](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/)
- [Pod Disruption Budgets](https://kubernetes.io/docs/concepts/workloads/pods/disruptions/)
- [Horizontal Pod Autoscaling](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)
- [Storage Classes](https://kubernetes.io/docs/concepts/storage/storage-classes/)
- [Security Checklist](https://kubernetes.io/docs/concepts/security/security-checklist/)
- [High Availability with kubeadm](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/high-availability/)
- [Operating etcd clusters for Kubernetes](https://kubernetes.io/docs/tasks/administer-cluster/configure-upgrade-etcd/)
- [Upgrading kubeadm clusters](https://kubernetes.io/docs/tasks/administer-cluster/kubeadm/kubeadm-upgrade/)
- [Debug Pods](https://kubernetes.io/docs/tasks/debug/debug-application/debug-pods/)
- [Debug Services](https://kubernetes.io/docs/tasks/debug/debug-application/debug-service/)
- [kubectl reference](https://kubernetes.io/docs/reference/kubectl/)
- [kubectl quick reference](https://kubernetes.io/docs/reference/kubectl/quick-reference/)

说明：本文是基于 Kubernetes 官方文档整理的原创中文教程，不复制官方全文。本文更新时 Kubernetes 最新 patch 为 v1.36.2，官方维护最近三个 minor 分支 v1.36、v1.35、v1.34；版本与功能状态会继续变化。真实生产环境必须先用 `kubectl version` 确认服务端版本，再阅读对应 minor 版本的官方文档、版本偏差策略和弃用说明。

## 场景开场

你把一个 Python API 做成 Docker 镜像后，第一反应可能是：

```bash
docker run -p 8000:8000 aiops-api:1.0
```

这在一台机器上能跑。但生产环境马上会出现新问题：

- 机器挂了怎么办？
- 服务需要 3 个副本怎么办？
- 新版本上线时，怎么滚动替换而不是一次全停？
- 某个容器崩了，谁负责拉起来？
- 容器 IP 变化后，其他服务怎么找到它？
- 配置怎么和镜像分开？
- 密码怎么不写进镜像？
- CPU、内存怎么限制？
- 服务是否真的 ready，怎么告诉流量入口？
- 节点资源不够时，Pod 为什么一直 Pending？
- Pod 日志、事件、重启次数在哪里看？

Kubernetes 解决的不是“怎么启动一个容器”，而是“怎么让一组容器应用在一组机器上长期保持期望状态”。AIOps 里，Kubernetes 是现代服务运行状态、发布状态、资源状态和故障证据的核心来源。

## 一句话人话版

Kubernetes 是容器编排平台：你声明“我希望系统里有几个什么样的 Pod、通过什么 Service 暴露、用什么配置、需要多少资源”，Kubernetes 控制面持续观察实际状态，并通过调度、创建、删除、重启、滚动更新等动作把实际状态拉回期望状态。

## 学习边界与面试目标

Kubernetes 很大。入门阶段先抓住这条主线：

```text
你写 YAML 声明期望状态
  -> kubectl 发给 kube-apiserver
  -> API Server 存入 etcd
  -> controller 发现状态差异
  -> scheduler 给新 Pod 选择 Node
  -> kubelet 在 Node 上启动容器
  -> Service / DNS 让其他服务找到 Pod
  -> probes / events / logs 暴露运行证据
```

基础层必须掌握：

- Cluster、Node、Namespace。
- API object 的 `apiVersion`、`kind`、`metadata`、`spec`、`status`。
- Label、selector、annotation。
- Pod 是最小调度单位。
- Deployment 管理 ReplicaSet，ReplicaSet 管理 Pod。
- Service 用稳定入口隐藏 Pod IP 变化。
- ConfigMap、Secret 把配置和镜像分开。
- requests/limits 影响调度和资源控制。
- liveness/readiness/startup probes 的区别。
- `kubectl get/describe/logs/exec/apply/delete/rollout/top/events`。
- Pending、CrashLoopBackOff、ImagePullBackOff、Service 不通的排查。

进阶面试层也必须掌握：

- 一次 `kubectl apply` 如何经过认证、鉴权、准入、校验并落入 etcd。
- `resourceVersion`、`generation`、`observedGeneration`、乐观并发和 Server-Side Apply。
- List-Watch、Reflector、Informer、本地缓存、工作队列和幂等 Reconcile。
- ownerReference、finalizer、删除时间戳和垃圾回收。
- 调度队列、Filter、Score、Bind、抢占、亲和性、污点和拓扑分布。
- PDB、HPA、VPA、Cluster Autoscaler 的职责边界和常见误区。
- Pod 优雅终止、EndpointSlice 摘流、节点 Lease、驱逐和 QoS。
- Pod 网络、Service、DNS、CNI、kube-proxy/eBPF、NetworkPolicy 的完整数据路径。
- PVC、StorageClass、CSI、动态制备、拓扑感知绑定和挂载故障链路。
- 多控制面、etcd 多数派、故障域、备份恢复、版本升级和回滚边界。
- RBAC、ServiceAccount、Pod Security、Secret 静态加密、审计与准入安全。
- API Server、etcd、scheduler、controller、kubelet、CNI 和 CSI 的关键指标与容量瓶颈。

本文不要求小白从零编写一个生产级调度器插件、CNI、CSI 或 Operator，也不展开每一行 Kubernetes 源码。边界之外的源码开发、多集群一致性和服务网格内核应在掌握本文主线后单独学习。面试通过还取决于 Linux、网络、编码、项目证据和表达训练，本文负责把 Kubernetes 知识深度与实践底座补齐。

## 官方知识地图

Kubernetes 官方文档的概念部分大致按这些模块组织：

```text
Overview
  -> Kubernetes 是什么
  -> Components
  -> Kubernetes API
  -> Working with objects

Cluster Architecture
  -> Nodes
  -> Control plane components
  -> Node components
  -> Controllers
  -> Lease
  -> Cloud Controller Manager

Containers
  -> Images
  -> Container runtime
  -> RuntimeClass

Workloads
  -> Pods
  -> Pod lifecycle
  -> Workload resources
  -> Deployment
  -> ReplicaSet
  -> StatefulSet
  -> DaemonSet
  -> Job
  -> CronJob

Services, Load Balancing, and Networking
  -> Service
  -> EndpointSlice
  -> DNS for Services and Pods
  -> Ingress
  -> NetworkPolicy
  -> Gateway API

Storage
  -> Volumes
  -> PersistentVolume
  -> PersistentVolumeClaim
  -> StorageClass

Configuration
  -> ConfigMap
  -> Secret
  -> Resource requests and limits
  -> kubeconfig

Security
  -> ServiceAccount
  -> RBAC
  -> Pod Security Standards
  -> Admission control

Scheduling, Preemption and Eviction
  -> kube-scheduler
  -> nodeSelector
  -> affinity / anti-affinity
  -> taints / tolerations
  -> priority / preemption
  -> node pressure eviction

Monitoring, Logging, and Debugging
  -> kubectl logs
  -> kubectl describe
  -> events
  -> debug pods
  -> debug services
```

学习 Kubernetes 不要从背 YAML 开始。要先知道每个对象在这张地图里的位置：

```text
Deployment 是 workload
Service 是 networking
ConfigMap / Secret 是 configuration
requests / limits 是 configuration + scheduling
Namespace / labels 是 object management
Pod status / events / logs 是 debugging 证据
```

## Kubernetes 在 AIOps 链路中的位置

在 AIOps 中，Kubernetes 是“应用运行状态控制面”。

```text
代码
  -> 镜像
  -> Kubernetes Deployment
  -> ReplicaSet
  -> Pod
  -> Container
  -> Service
  -> Ingress / Gateway / LoadBalancer
  -> 用户请求

观测
  -> kubelet / cAdvisor / metrics-server
  -> kube-state-metrics
  -> Prometheus
  -> Grafana
  -> Alertmanager
  -> Runbook 自动化
```

Kubernetes 给 AIOps 提供的证据：

| 证据 | 从哪里看 | 用途 |
|---|---|---|
| Pod 是否 Running | `kubectl get pods` | 判断实例是否存活 |
| Pod 为什么失败 | `kubectl describe pod` events | 看调度、拉镜像、探针、挂载错误 |
| 容器日志 | `kubectl logs` | 看应用错误 |
| 重启次数 | `kubectl get pods`、`describe` | 发现 CrashLoop |
| rollout 状态 | `kubectl rollout status` | 判断发布是否卡住 |
| Service 后端 | `kubectl get endpointslices` | 判断流量能否打到 Pod |
| 资源使用 | `kubectl top` | 判断 CPU/内存压力 |
| YAML 期望状态 | `kubectl get -o yaml` | 比对实际配置 |

一个好的 AIOps runbook 不应只写：

```bash
kubectl rollout restart deployment/aiops-api
```

而应先采集：

```bash
kubectl get deploy,rs,pod,svc -n aiops -o wide
kubectl describe deploy aiops-api -n aiops
kubectl describe pod -l app=aiops-api -n aiops
kubectl logs -l app=aiops-api -n aiops --tail=200
kubectl get events -n aiops --sort-by=.lastTimestamp
```

先看清楚，再决定是否恢复。

## Kubernetes 是什么

Kubernetes 是一个可移植、可扩展的开源平台，用来管理容器化工作负载和服务，并支持声明式配置和自动化。

几个关键词：

| 关键词 | 含义 |
|---|---|
| 容器化工作负载 | 应用被打包成镜像，在容器里运行 |
| 服务 | 一组 Pod 对外提供的稳定访问入口 |
| 声明式配置 | 你描述“想要什么状态”，不是一步步手写操作 |
| 自动化 | 控制器不断把实际状态拉回期望状态 |
| 可扩展 | API 可扩展，能接入 CRD、Operator、云厂商能力 |

Docker 解决的是：

```text
一个容器怎么构建、运行、隔离
```
Kubernetes 解决的是：

```text
很多容器跨多台机器怎么调度、扩缩容、滚动发布、服务发现、恢复和治理
```
## 核心思想：期望状态和控制循环

Kubernetes 的灵魂不是 Pod，也不是 YAML，而是控制循环。

你提交一个 Deployment：

```yaml
spec:
  replicas: 3
```

意思是：

```text
我希望始终有 3 个符合模板的 Pod 副本。
```

如果实际只有 2 个，Deployment controller 会创建新的 Pod。

如果实际有 4 个，它会删掉多余 Pod。

如果某个 Node 挂了，Pod 消失后，控制器会尝试在其他 Node 上补齐。

这就是：

```text
期望状态 desired state
  vs
实际状态 actual state
  -> controller reconcile
```

用人话讲：

```text
你不是告诉 Kubernetes “先创建 A，再启动 B，再检查 C”。
你告诉它 “我要最终长这样”。
Kubernetes 自己持续检查世界是否长这样，不像就修。
```

这也是 Kubernetes 排障的核心：永远同时看 `spec` 和 `status`。

| 部分 | 含义 |
|---|---|
| `spec` | 你想要什么 |
| `status` | Kubernetes 观察到现在是什么 |

## 集群、控制面、节点

Kubernetes cluster 通常由控制面和节点组成。

```text
Cluster
  -> Control Plane
     -> kube-apiserver
     -> etcd
     -> kube-scheduler
     -> kube-controller-manager
     -> cloud-controller-manager
  -> Worker Nodes
     -> kubelet
     -> kube-proxy
     -> container runtime
     -> Pods
```

控制面负责“决策和记录”：

- API 入口。
- 存储集群状态。
- 调度 Pod。
- 运行控制器。
- 与云厂商资源交互。

节点负责“实际运行”：

- 拉镜像。
- 启动容器。
- 上报状态。
- 执行 probes。
- 提供 Pod 网络和 Service 转发。

## 控制面组件

### kube-apiserver

API Server 是 Kubernetes 控制面的入口。

所有操作都通过它：

```text
kubectl
controller
scheduler
kubelet
operator
dashboard
  -> kube-apiserver
```

它负责：

- 暴露 Kubernetes API。
- 认证 Authentication。
- 授权 Authorization。
- 准入 Admission。
- 校验对象。
- 读写 etcd。

当你执行：

```bash
kubectl apply -f deployment.yaml
```

`kubectl` 不是直接找某台 Node 创建容器，而是把对象提交给 API Server。

排障提示：

- `kubectl` 连不上集群，先看 kubeconfig、网络、证书、权限。
- 对象创建被拒，可能是 schema 校验、RBAC、admission policy。

### etcd

etcd 是 Kubernetes 的一致性键值存储，用来保存集群状态。

里面有：

- Pod 对象。
- Deployment 对象。
- ConfigMap。
- Secret。
- Node 状态。
- Lease。
- 其他 API 对象。

你一般不直接操作 etcd。你通过 API Server 操作 Kubernetes API，API Server 再读写 etcd。

生产要点：

- etcd 数据非常关键，要备份。
- etcd 延迟会影响整个集群控制面。
- 不要绕过 API Server 直接改 etcd。

### kube-scheduler

scheduler 负责给没有绑定 Node 的 Pod 选择合适节点。

输入：

```text
Pending Pod
```

考虑因素：

- Node 资源是否够。
- Pod 的 requests。
- nodeSelector。
- node affinity / anti-affinity。
- taints / tolerations。
- topology spread。
- volume 约束。
- 端口冲突。
- 调度策略。

输出：

```text
把 Pod 绑定到某个 Node
```

常见现象：

```text
Pod 一直 Pending
```

很多时候不是容器启动失败，而是 scheduler 找不到合适 Node。

### kube-controller-manager

controller-manager 运行多个内置控制器。

控制器的工作模式：

```text
watch API object
  -> 比较期望状态和实际状态
  -> 发起修正动作
```

常见控制器：

| 控制器 | 做什么 |
|---|---|
| Deployment controller | 管理 Deployment rollout |
| ReplicaSet controller | 保持 Pod 副本数 |
| Node controller | 观察 Node 是否健康 |
| Job controller | 管理一次性任务完成 |
| EndpointSlice controller | 根据 Service selector 维护后端端点 |

### cloud-controller-manager

cloud-controller-manager 把 Kubernetes 和云厂商资源连接起来。

典型职责：

- 创建云负载均衡。
- 处理云磁盘。
- 同步云节点信息。
- 管理云路由。

本地集群可能没有它，托管云 Kubernetes 通常有对应实现。

## 节点组件

### kubelet

kubelet 运行在每个 Node 上，是 Node 的代理。

它负责：

- 从 API Server 看到分配给本 Node 的 Pod。
- 调用容器运行时启动容器。
- 执行 liveness/readiness/startup probes。
- 挂载 volume。
- 上报 Pod 和 Node 状态。

重要理解：

```text
控制面决定应该运行什么
kubelet 负责在本机真正运行它
```

Pod 卡在 `ContainerCreating`、探针失败、volume 挂载失败，常常和 kubelet 相关。

### container runtime

容器运行时负责真正运行容器。

常见：

- containerd。
- CRI-O。

Kubernetes 通过 CRI 和容器运行时交互。

排障时你通常先用 `kubectl`。只有 `kubectl` 证据不够时，才登录 Node 看 container runtime、kubelet 日志等。

### kube-proxy

kube-proxy 负责实现 Service 的部分网络转发规则。

它会根据 Service 和 EndpointSlice 变化，在 Node 上维护转发规则，让访问 ClusterIP 或 NodePort 的流量能到后端 Pod。

注意：

- kube-proxy 不是七层代理。
- 它通常工作在 iptables、IPVS 或其他数据平面模式。
- Service 不通时，除了应用，也要看 selector、EndpointSlice、kube-proxy、网络插件。

### CNI 网络插件

Kubernetes 规定了网络模型，但具体 Pod 网络由 CNI 插件实现。

常见插件：

- Calico。
- Cilium。
- Flannel。
- Weave Net。
- 云厂商 CNI。

Kubernetes 网络模型要求：

- Pod 之间可以直接通信，通常无需 NAT。
- Node 可以和 Pod 通信。
- Pod IP 是集群内可路由的。

具体实现依赖 CNI。

## API 对象模型

Kubernetes 里你操作的大多数东西都是 API object。

一个最小对象通常有：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: aiops-api
  namespace: aiops
spec:
  replicas: 3
```

字段解释：

| 字段 | 含义 |
|---|---|
| `apiVersion` | 使用哪个 API group/version |
| `kind` | 对象类型 |
| `metadata` | 名字、namespace、label、annotation 等元数据 |
| `spec` | 期望状态 |
| `status` | 当前观察到的状态，通常由系统写 |

新手必须养成一个习惯：

```bash
kubectl explain deployment.spec
kubectl explain pod.spec.containers
```

`kubectl explain` 会从 API Server 的 OpenAPI 信息里解释字段，比到处复制 YAML 更可靠。

## metadata：name、namespace、labels、annotations

### name

同一个 namespace 内，同类型对象名字要唯一。

```yaml
metadata:
  name: aiops-api
```

### namespace

namespace 用来在一个集群里隔离资源名称和管理边界。

```yaml
metadata:
  namespace: aiops
```

名字在 namespace 内唯一，不同 namespace 可以有同名 Deployment。

查看：

```bash
kubectl get ns
kubectl get pods -n aiops
```

### labels

label 是可查询、可选择的键值对。

```yaml
metadata:
  labels:
    app: aiops-api
    component: api
    env: prod
```

Kubernetes 很多关系靠 label selector 建立：

- Service 选择 Pod。
- Deployment selector 管理 Pod。
- `kubectl get -l` 查询对象。
- Prometheus 发现 target。

### annotations

annotation 也是键值对，但通常放非选择性的元数据。

```yaml
metadata:
  annotations:
    runbook.example.com/url: https://example.com/runbooks/aiops-api
```

适合放：

- 文档链接。
- 变更说明。
- controller 使用的配置。
- 监控采集提示。

不要用 annotation 做核心选择逻辑，选择对象用 labels。

## labels 和 selector

selector 是 Kubernetes 对象之间建立关系的关键。

Deployment 示例：

```yaml
selector:
  matchLabels:
    app: aiops-api
template:
  metadata:
    labels:
      app: aiops-api
```

Service 示例：

```yaml
selector:
  app: aiops-api
```

如果 Service selector 和 Pod labels 对不上，Service 就没有后端。

排查：

```bash
kubectl get pods -n aiops --show-labels
kubectl get svc aiops-api -n aiops -o yaml
kubectl get endpointslice -n aiops -l kubernetes.io/service-name=aiops-api
```

这是 Kubernetes 网络排障第一高频错误。

## Namespace

Namespace 用来在一个集群内划分资源范围。

常见 namespace：

| namespace | 用途 |
|---|---|
| `default` | 默认 namespace |
| `kube-system` | Kubernetes 系统组件 |
| `kube-public` | 集群公开可读资源 |
| `kube-node-lease` | Node lease 对象 |
| 自定义 | 业务环境或团队，如 `aiops`、`prod` |

namespace 能隔离：

- 同名资源。
- RBAC 权限边界。
- ResourceQuota。
- LimitRange。
- NetworkPolicy 范围。

不能隔离：

- Node。
- PersistentVolume。
- StorageClass。
- ClusterRole。
- CRD。

创建：

```bash
kubectl create namespace aiops
```

切换默认 namespace：

```bash
kubectl config set-context --current --namespace=aiops
```

## Pod 是什么

Pod 是 Kubernetes 里最小可调度计算单元。

不要把 Pod 简单理解成容器。更准确：

```text
Pod 是一个逻辑主机，里面可以有一个或多个容器，这些容器共享网络命名空间、部分存储卷，并被一起调度到同一个 Node。
```

最常见模式：

```text
一个 Pod 一个业务容器
```

多容器 Pod 适合强耦合场景：

- sidecar 日志代理。
- service mesh proxy。
- 本地辅助进程。
- init container 初始化。

不适合把无关服务硬塞一个 Pod。比如 API 和数据库通常不应该放一个 Pod，因为生命周期、扩缩容、资源需求都不同。

## Pod YAML

最小 Pod：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx
  labels:
    app: nginx
spec:
  containers:
    - name: nginx
      image: nginx:1.25
      ports:
        - containerPort: 80
```

字段解释：

| 字段 | 含义 |
|---|---|
| `spec.containers` | Pod 里的容器列表 |
| `name` | 容器名 |
| `image` | 镜像 |
| `ports.containerPort` | 容器监听端口说明 |

注意：`containerPort` 主要是声明和文档性质，真正监听还要应用进程自己绑定端口。

官方建议通常不要直接创建长期运行的裸 Pod，而是用 Deployment、StatefulSet、DaemonSet、Job 等 workload 管理 Pod。

## Pod 生命周期

Pod 常见 phase：

| Phase | 含义 |
|---|---|
| `Pending` | Pod 已被 API 接收，但还没有全部容器运行 |
| `Running` | Pod 已绑定 Node，至少一个主容器在运行或启动/重启中 |
| `Succeeded` | 所有容器成功退出，不再重启 |
| `Failed` | 所有容器退出，至少一个失败 |
| `Unknown` | 无法获取 Pod 状态，常见于 Node 通信问题 |

查看：

```bash
kubectl get pods -n aiops
kubectl describe pod <pod-name> -n aiops
```

容器状态：

| 状态 | 含义 |
|---|---|
| `Waiting` | 等待启动，如拉镜像、创建容器 |
| `Running` | 正在运行 |
| `Terminated` | 已退出 |

常见 `Waiting.reason`：

- `ImagePullBackOff`
- `ErrImagePull`
- `CrashLoopBackOff`
- `CreateContainerConfigError`
- `ContainerCreating`

排障时不要只看 `STATUS` 一列，必须看：

```bash
kubectl describe pod <pod> -n <ns>
kubectl logs <pod> -n <ns> --previous
```

## init containers、sidecar、ephemeral containers

### init containers

init container 在业务容器之前运行，必须成功完成，业务容器才会启动。

用途：

- 等待依赖。
- 初始化目录。
- 拉取配置。
- 执行迁移前检查。

示例：

```yaml
initContainers:
  - name: wait-db
    image: busybox:1.36
    command: ["sh", "-c", "until nc -z db 5432; do sleep 2; done"]
```

### sidecar containers

sidecar 和主容器一起运行，提供辅助能力。

用途：

- 日志采集。
- 代理。
- 配置热更新。
- service mesh。

### ephemeral containers

ephemeral container 用于调试正在运行的 Pod。

示例：

```bash
kubectl debug -it <pod> -n aiops --image=busybox:1.36 --target=app
```

适合原镜像没有 shell、没有诊断工具时临时进入调试。

## Probes：liveness、readiness、startup

Kubernetes 通过 probes 判断容器健康。

### livenessProbe

判断容器是否“活着”。失败后 kubelet 会重启容器。

适合：

- 进程死锁。
- 主循环卡死。
- 无法自愈的内部状态错误。

### readinessProbe

判断容器是否“可以接流量”。失败后 Pod 会从 Service endpoints 中移除，但容器不一定重启。

适合：

- 应用启动中。
- 依赖数据库暂时不可用。
- 缓存预热中。
- 准备下线前摘流量。

### startupProbe

判断慢启动应用是否已经启动完成。startupProbe 成功前，liveness/readiness 的处理会被延后。

适合：

- Java 应用启动慢。
- 模型加载慢。
- 初始化耗时长。

示例：

```yaml
livenessProbe:
  httpGet:
    path: /healthz
    port: 8000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /readyz
    port: 8000
  initialDelaySeconds: 5
  periodSeconds: 5

startupProbe:
  httpGet:
    path: /startupz
    port: 8000
  failureThreshold: 30
  periodSeconds: 2
```

常见错误：

- liveness 过于敏感，把慢请求当死锁，导致服务不断重启。
- readiness 没配，Pod 刚启动就接流量，造成 502/503。
- startup 慢但没配 startupProbe，被 liveness 提前杀掉。

## Deployment 是什么

Deployment 用来声明和管理无状态应用的滚动发布。

它管理 ReplicaSet，ReplicaSet 管理 Pod：

```text
Deployment
  -> ReplicaSet revision 1
     -> Pods
  -> ReplicaSet revision 2
     -> Pods
```

Deployment 能做：

- 创建副本。
- 滚动更新。
- 回滚。
- 扩缩容。
- 暂停和恢复发布。
- 保留历史 ReplicaSet。

最小 Deployment：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: aiops-api
  namespace: aiops
  labels:
    app: aiops-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: aiops-api
  template:
    metadata:
      labels:
        app: aiops-api
    spec:
      containers:
        - name: api
          image: nginx:1.25
          ports:
            - containerPort: 80
```

重点字段：

| 字段 | 含义 |
|---|---|
| `replicas` | 期望 Pod 副本数 |
| `selector` | Deployment 管哪些 Pod |
| `template` | Pod 模板 |
| `strategy` | 发布策略 |

`selector.matchLabels` 必须匹配 `template.metadata.labels`。一旦创建后，Deployment selector 通常不能随便改。

## ReplicaSet 是什么

ReplicaSet 的目标是维持稳定数量的 Pod 副本。

你通常不直接写 ReplicaSet，而是写 Deployment。Deployment 会自动创建和管理 ReplicaSet。

查看：

```bash
kubectl get rs -n aiops
```

发布新版本时，你会看到旧 ReplicaSet 副本数下降，新 ReplicaSet 副本数上升。

排障 rollout 时，看 ReplicaSet 能判断：

- 新版本 Pod 是否创建出来。
- 旧版本是否还在。
- 是否卡在新 ReplicaSet 无法 ready。

## RollingUpdate、rollout、rollback

Deployment 默认使用 RollingUpdate。

常见策略：

```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxUnavailable: 1
    maxSurge: 1
```

字段解释：

| 字段 | 含义 |
|---|---|
| `maxUnavailable` | 更新过程中最多多少 Pod 不可用 |
| `maxSurge` | 更新过程中最多额外创建多少 Pod |

查看发布：

```bash
kubectl rollout status deployment/aiops-api -n aiops
kubectl rollout history deployment/aiops-api -n aiops
```

回滚：

```bash
kubectl rollout undo deployment/aiops-api -n aiops
```

暂停：

```bash
kubectl rollout pause deployment/aiops-api -n aiops
```

恢复：

```bash
kubectl rollout resume deployment/aiops-api -n aiops
```

常见卡住原因：

- 新镜像拉不到。
- readinessProbe 一直失败。
- requests 太大无法调度。
- 配置错误导致 CrashLoop。
- 新版本启动慢，progress deadline 超时。

## Service 是什么

Pod 是临时的，IP 会变。Service 提供稳定访问入口。

Service 解决：

```text
一组后端 Pod 会变化，客户端不应该追踪每个 Pod IP。
```

Service 通过 selector 选择后端 Pod：

```yaml
apiVersion: v1
kind: Service
metadata:
  name: aiops-api
  namespace: aiops
spec:
  type: ClusterIP
  selector:
    app: aiops-api
  ports:
    - name: http
      port: 80
      targetPort: 80
```

字段解释：

| 字段 | 含义 |
|---|---|
| `type` | Service 类型 |
| `selector` | 选择哪些 Pod 做后端 |
| `port` | Service 暴露的端口 |
| `targetPort` | Pod 容器实际接收的端口 |
| `name` | 端口名，多个端口时很重要 |

## Service 类型

| 类型 | 含义 | 用途 |
|---|---|---|
| `ClusterIP` | 集群内虚拟 IP | 默认，服务内部访问 |
| `NodePort` | 每个 Node 打开一个端口 | 测试或特殊接入 |
| `LoadBalancer` | 让云厂商创建 LB | 云上对外暴露 |
| `ExternalName` | DNS CNAME 映射 | 引用外部服务 |
| Headless | `clusterIP: None` | StatefulSet、直接发现后端 |

新手常见链路：

```text
Pod -> ClusterIP Service -> 后端 Pods
外部用户 -> Ingress / LoadBalancer -> Service -> Pods
```

## EndpointSlice 和 Service 后端

Service selector 匹配 Pod 后，Kubernetes 会维护 EndpointSlice。

查看：

```bash
kubectl get endpointslice -n aiops
kubectl describe endpointslice -n aiops -l kubernetes.io/service-name=aiops-api
```

如果 Service 没有后端，常见原因：

- selector 写错。
- Pod labels 不匹配。
- Pod readinessProbe 失败。
- Pod 不在同 namespace。
- targetPort 和应用端口不一致。

排查 Service 不通时，一定看 EndpointSlice。

## Kubernetes DNS

Kubernetes 会为 Service 和 Pod 提供 DNS 记录。

同 namespace 访问：

```text
http://aiops-api
```

完整域名：

```text
aiops-api.aiops.svc.cluster.local
```

格式：

```text
<service>.<namespace>.svc.<cluster-domain>
```

Pod 内测试：

```bash
kubectl run dns-test -n aiops --rm -it --image=busybox:1.36 --restart=Never -- nslookup aiops-api
```

常见问题：

- Service 名写错。
- namespace 写错。
- CoreDNS 异常。
- NetworkPolicy 阻断 DNS。
- 应用把 DNS 结果永久缓存。

## Ingress 和 Gateway

Ingress 是 Kubernetes 里用于 HTTP/HTTPS 入口规则的 API 对象。

它不是 Service 类型。它描述：

```text
哪个 host/path 转到哪个 Service
```

示例：

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: aiops-api
  namespace: aiops
spec:
  rules:
    - host: aiops.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: aiops-api
                port:
                  number: 80
```

注意：

- 只创建 Ingress 对象不够，集群还需要 Ingress Controller。
- NGINX Ingress Controller 是常见实现之一。
- Gateway API 是 Ingress 的后继方向之一，能力更丰富。

Ingress 会在 NGINX/Ingress 专篇里深讲。

## ConfigMap

ConfigMap 用来存非敏感配置。

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: aiops-api-config
  namespace: aiops
data:
  APP_ENV: prod
  LOG_LEVEL: info
```

作为环境变量：

```yaml
envFrom:
  - configMapRef:
      name: aiops-api-config
```

挂载成文件：

```yaml
volumes:
  - name: config
    configMap:
      name: aiops-api-config
containers:
  - name: api
    volumeMounts:
      - name: config
        mountPath: /etc/aiops
```

注意：

- ConfigMap 不适合放密码。
- ConfigMap 单个对象大小有限制，官方文档提醒不适合存大块数据。
- 作为环境变量注入时，ConfigMap 更新不会自动改变已运行容器环境变量，需要重启 Pod。

## Secret

Secret 用来存少量敏感数据，如密码、token、key。

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: aiops-api-secret
  namespace: aiops
type: Opaque
stringData:
  DATABASE_PASSWORD: change-me
```

作为环境变量：

```yaml
env:
  - name: DATABASE_PASSWORD
    valueFrom:
      secretKeyRef:
        name: aiops-api-secret
        key: DATABASE_PASSWORD
```

重点：

- Secret 默认是 base64 编码，不等于加密。
- 生产要关注 etcd 加密、RBAC、审计、外部密钥管理。
- 不要把真实密钥提交到 Git。

## requests 和 limits

资源配置是 Kubernetes 调度和稳定性的核心。

```yaml
resources:
  requests:
    cpu: "100m"
    memory: "128Mi"
  limits:
    cpu: "500m"
    memory: "512Mi"
```

含义：

| 字段 | 含义 |
|---|---|
| `requests.cpu` | 调度时认为该容器至少需要多少 CPU |
| `requests.memory` | 调度时认为该容器至少需要多少内存 |
| `limits.cpu` | 容器最多可用 CPU，通常被限速 |
| `limits.memory` | 容器最多可用内存，超出可能 OOMKilled |

单位：

| 单位 | 含义 |
|---|---|
| `100m` CPU | 0.1 核 |
| `1` CPU | 1 核 |
| `128Mi` | 128 Mebibytes |
| `512M` | 512 Megabytes，注意和 Mi 不同 |

常见问题：

- requests 太大：Pod Pending，因为没有 Node 放得下。
- requests 太小：调度过密，运行时争抢资源。
- memory limit 太小：Pod OOMKilled。
- 没有 requests/limits：资源不可控，HPA 和调度判断也受影响。

## QoS、OOMKilled、Node pressure

Kubernetes 会根据 requests/limits 给 Pod 分 QoS。

常见 QoS：

| QoS | 条件概念 | 稳定性 |
|---|---|---|
| `Guaranteed` | 每个容器 CPU/内存 request 等于 limit | 最稳定 |
| `Burstable` | 设置了部分 request/limit 或二者不等 | 常见 |
| `BestEffort` | 没有设置 requests/limits | 最容易被驱逐 |

Pod 被 OOMKilled：

```bash
kubectl describe pod <pod> -n aiops
```

看：

```text
Last State: Terminated
Reason: OOMKilled
Exit Code: 137
```

处理：

- 看应用内存曲线。
- 调整 memory request/limit。
- 排查内存泄漏。
- 防止一次性任务加载过大数据。

## 调度：Pod 怎么选 Node

scheduler 给 Pod 选择 Node，大致是：

```text
过滤不满足条件的 Node
  -> 给可行 Node 打分
  -> 选择得分最高的 Node
  -> 绑定 Pod 到 Node
```

影响调度的常见因素：

- 资源 requests。
- nodeSelector。
- node affinity。
- pod affinity / anti-affinity。
- taints / tolerations。
- volume 所在 zone。
- topology spread constraints。
- node condition。

指定简单 nodeSelector：

```yaml
nodeSelector:
  disktype: ssd
```

给 Node 打标签：

```bash
kubectl label node node-1 disktype=ssd
```

查看 Pod 为什么 Pending：

```bash
kubectl describe pod <pod> -n aiops
```

Events 里常见：

```text
0/3 nodes are available: insufficient memory.
```

或者：

```text
node(s) had untolerated taint
```

## taints 和 tolerations

taint 是 Node 对 Pod 的“排斥标记”。

toleration 是 Pod 对 taint 的“容忍声明”。

给 Node 加 taint：

```bash
kubectl taint nodes node-1 dedicated=monitoring:NoSchedule
```

Pod 容忍：

```yaml
tolerations:
  - key: "dedicated"
    operator: "Equal"
    value: "monitoring"
    effect: "NoSchedule"
```

常见 effect：

| effect | 含义 |
|---|---|
| `NoSchedule` | 不容忍就不调度上来 |
| `PreferNoSchedule` | 尽量不调度 |
| `NoExecute` | 不容忍的已运行 Pod 也会被驱逐 |

控制面节点通常有 taint，防止普通业务 Pod 调度上去。

## Workload 对象对比

| 对象 | 适合什么 | 例子 |
|---|---|---|
| Pod | 临时测试或被控制器管理的最小单位 | 不建议长期裸跑 |
| Deployment | 无状态服务 | API、Web 服务 |
| ReplicaSet | 维持副本数 | 通常由 Deployment 管 |
| StatefulSet | 有状态服务，有稳定身份 | 数据库、Kafka、ZooKeeper |
| DaemonSet | 每个或部分 Node 跑一个 Pod | node exporter、日志 agent、CNI |
| Job | 一次性任务 | 数据迁移、批处理 |
| CronJob | 定时任务 | 定时报表、定时清理 |

新手默认：

- Web/API 用 Deployment。
- 每节点采集器用 DaemonSet。
- 一次性任务用 Job。
- 定时任务用 CronJob。
- 有状态服务慎用 StatefulSet，先理解存储和运维复杂度。

## DaemonSet

DaemonSet 确保每个符合条件的 Node 上运行一个 Pod 副本。

典型用途：

- node exporter。
- 日志采集 agent。
- 网络插件。
- 存储插件。

查看：

```bash
kubectl get daemonset -A
```

AIOps 中，很多观测组件就是 DaemonSet。

## StatefulSet

StatefulSet 用于有状态应用。

它提供：

- 稳定 Pod 名称。
- 稳定网络身份。
- 有序部署和扩缩容。
- 配合 PVC 的稳定存储。

Pod 名称示例：

```text
mysql-0
mysql-1
mysql-2
```

StatefulSet 不是“让数据库自动变简单”。数据库的备份、恢复、主从、升级、数据一致性仍然要认真设计。

## Job 和 CronJob

Job 运行到成功完成：

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: aiops-report
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: report
          image: busybox:1.36
          command: ["sh", "-c", "echo generate report"]
```

CronJob 定时创建 Job：

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: aiops-report
spec:
  schedule: "*/5 * * * *"
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: Never
          containers:
            - name: report
              image: busybox:1.36
              command: ["sh", "-c", "date && echo report"]
```

AIOps 里可用于：

- 定时巡检。
- 定时生成报表。
- 定时清理临时数据。

## Storage：Volume、PV、PVC、StorageClass

Pod 文件系统通常是临时的。Pod 重建后，容器层数据会丢。

Kubernetes 存储概念：

| 概念 | 含义 |
|---|---|
| Volume | Pod 可挂载的卷抽象 |
| PersistentVolume | 集群级持久卷资源 |
| PersistentVolumeClaim | namespace 内申请存储 |
| StorageClass | 动态创建存储的类型 |

简单 PVC：

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: data
  namespace: aiops
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
```

业务应用要问：

- 数据是否需要持久化？
- 是否允许 Pod 换 Node？
- 存储是否支持多副本？
- 备份和恢复怎么做？
- 性能和延迟是否满足？

## kubeconfig 和上下文

`kubectl` 通过 kubeconfig 找到集群、用户和 namespace。

默认路径：

```text
$HOME/.kube/config
```

查看上下文：

```bash
kubectl config get-contexts
```

切换：

```bash
kubectl config use-context <context-name>
```

查看当前：

```bash
kubectl config current-context
```

设置 namespace：

```bash
kubectl config set-context --current --namespace=aiops
```

生产事故里，最危险的错误之一是操作错集群或错 namespace。执行删除、扩缩容、回滚前先确认 context。

## RBAC、ServiceAccount 简介

Kubernetes 权限通常用 RBAC 管理。

核心对象：

| 对象 | 作用 |
|---|---|
| ServiceAccount | Pod 或程序访问 API 的身份 |
| Role | namespace 级权限规则 |
| ClusterRole | 集群级权限规则 |
| RoleBinding | 把 Role 绑定给用户/组/ServiceAccount |
| ClusterRoleBinding | 集群级绑定 |

检查权限：

```bash
kubectl auth can-i get pods -n aiops
kubectl auth can-i delete pods -n aiops
```

AIOps 自动化脚本不要使用过大的集群管理员权限。需要什么权限给什么权限。

## NetworkPolicy 简介

NetworkPolicy 用于限制 Pod 间网络访问。

注意：

- NetworkPolicy 需要网络插件支持。
- 默认没有 NetworkPolicy 时，Pod 间通常是允许通信的。
- 一旦某 Pod 被 NetworkPolicy 选中，未允许的流量会被拒绝。

常见故障：

- Service DNS 能解析。
- Pod IP 能找到。
- 但请求超时。
- 最后发现 NetworkPolicy 没放行。

排查：

```bash
kubectl get networkpolicy -n aiops
kubectl describe networkpolicy <name> -n aiops
```

## 最小 AIOps API 示例

创建 namespace：

```bash
kubectl create namespace aiops
```

Deployment：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: aiops-api
  namespace: aiops
  labels:
    app: aiops-api
spec:
  replicas: 2
  selector:
    matchLabels:
      app: aiops-api
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  template:
    metadata:
      labels:
        app: aiops-api
    spec:
      containers:
        - name: api
          image: nginx:1.25
          ports:
            - name: http
              containerPort: 80
          resources:
            requests:
              cpu: "50m"
              memory: "64Mi"
            limits:
              cpu: "200m"
              memory: "128Mi"
          readinessProbe:
            httpGet:
              path: /
              port: http
            initialDelaySeconds: 3
            periodSeconds: 5
          livenessProbe:
            httpGet:
              path: /
              port: http
            initialDelaySeconds: 30
            periodSeconds: 10
```

Service：

```yaml
apiVersion: v1
kind: Service
metadata:
  name: aiops-api
  namespace: aiops
spec:
  type: ClusterIP
  selector:
    app: aiops-api
  ports:
    - name: http
      port: 80
      targetPort: http
```

应用：

```bash
kubectl apply -f aiops-api.yaml
kubectl get deploy,rs,pod,svc -n aiops -o wide
kubectl rollout status deployment/aiops-api -n aiops
```

集群内测试：

```bash
kubectl run curl-test -n aiops --rm -it --image=curlimages/curl:8.10.1 --restart=Never -- \
  curl -v http://aiops-api/
```

## kubectl 常用命令字典

### 查看版本

```bash
kubectl version
```

看 client 和 server 版本。排查兼容性时先看它。

### 查看 API 资源

```bash
kubectl api-resources
```

看当前集群支持哪些资源、是否 namespaced、缩写是什么。

### 解释字段

```bash
kubectl explain deployment.spec.template.spec.containers
```

这是学 Kubernetes YAML 的神器。不要只靠复制模板。

### 查看对象

```bash
kubectl get pods -n aiops
kubectl get pods -n aiops -o wide
kubectl get deploy,rs,pod,svc -n aiops
```

`-o wide` 会显示更多信息，如 Node、Pod IP。

### 查看 YAML

```bash
kubectl get deploy aiops-api -n aiops -o yaml
```

看对象完整当前状态，包括 spec、status、managedFields 等。

### 描述对象

```bash
kubectl describe pod <pod-name> -n aiops
```

`describe` 会展示事件，是排查 Pending、ImagePull、Probe 失败的核心命令。

### 查看日志

```bash
kubectl logs <pod-name> -n aiops
```

多容器 Pod：

```bash
kubectl logs <pod-name> -n aiops -c api
```

上一轮崩溃容器日志：

```bash
kubectl logs <pod-name> -n aiops -c api --previous
```

按 label 查多个 Pod：

```bash
kubectl logs -l app=aiops-api -n aiops --tail=100
```

### 进入容器

```bash
kubectl exec -it <pod-name> -n aiops -- sh
```

多容器：

```bash
kubectl exec -it <pod-name> -n aiops -c api -- sh
```

注意：生产镜像可能没有 shell。可用 `kubectl debug` 临时注入调试容器。

### 应用配置

```bash
kubectl apply -f aiops-api.yaml
```

声明式应用或更新配置。

### 删除对象

```bash
kubectl delete -f aiops-api.yaml
kubectl delete pod <pod-name> -n aiops
```

删除被 Deployment 管理的 Pod 后，ReplicaSet 会再创建一个新的 Pod。这不是异常，是控制器在保持期望副本数。

### 扩缩容

```bash
kubectl scale deployment/aiops-api -n aiops --replicas=5
```

### 更新镜像

```bash
kubectl set image deployment/aiops-api api=nginx:1.26 -n aiops
```

### 查看 rollout

```bash
kubectl rollout status deployment/aiops-api -n aiops
kubectl rollout history deployment/aiops-api -n aiops
```

### 回滚

```bash
kubectl rollout undo deployment/aiops-api -n aiops
```

### 查看事件

```bash
kubectl get events -n aiops --sort-by=.lastTimestamp
```

事件会告诉你：

- 调度失败。
- 镜像拉取失败。
- 探针失败。
- volume 挂载失败。
- OOM 或驱逐线索。

### 查看资源使用

```bash
kubectl top nodes
kubectl top pods -n aiops
```

需要 metrics-server。

### 端口转发

```bash
kubectl port-forward svc/aiops-api -n aiops 8080:80
```

本机访问：

```bash
curl http://127.0.0.1:8080/
```

适合临时调试，不是生产暴露方式。

## YAML 字段字典

### Deployment

| 字段 | 含义 | 常见错误 |
|---|---|---|
| `apiVersion: apps/v1` | Deployment API 版本 | 写错版本 |
| `kind: Deployment` | 对象类型 | 大小写错 |
| `metadata.name` | Deployment 名 | 和 Service 名混淆 |
| `metadata.namespace` | 所在 namespace | apply 到错误 namespace |
| `metadata.labels` | 对象标签 | 和 Pod 模板标签混淆 |
| `spec.replicas` | 副本数 | 以为它等于容器数 |
| `spec.selector` | 管理哪些 Pod | 和 template labels 不匹配 |
| `spec.template` | Pod 模板 | 新版本变化触发 rollout |
| `spec.strategy` | 更新策略 | maxUnavailable 配太大影响可用性 |

### Pod template

| 字段 | 含义 | 常见错误 |
|---|---|---|
| `containers[].name` | 容器名 | logs/exec 指定错 |
| `containers[].image` | 镜像 | tag 不存在、私有仓库无权限 |
| `ports[].containerPort` | 容器端口说明 | 以为它会让应用监听 |
| `env` | 环境变量 | Secret/ConfigMap key 错 |
| `resources.requests` | 调度预留 | 不写导致调度和资源治理失真 |
| `resources.limits` | 运行上限 | memory 太小导致 OOMKilled |
| `readinessProbe` | 是否接流量 | 不配导致未 ready 就进 endpoints |
| `livenessProbe` | 是否重启容器 | 配太敏感导致重启风暴 |
| `volumeMounts` | 容器挂载路径 | 路径覆盖镜像内文件 |

### Service

| 字段 | 含义 | 常见错误 |
|---|---|---|
| `spec.type` | Service 类型 | 用 NodePort 当长期生产入口 |
| `spec.selector` | 选择后端 Pod | label 不匹配导致无 endpoints |
| `ports[].port` | Service 端口 | 和 targetPort 混淆 |
| `ports[].targetPort` | Pod 端口 | 应用实际不监听 |
| `ports[].name` | 端口名 | 多端口 Service 必须清晰命名 |

## AIOps 入门实验

目标：部署一个最小 Web 服务，观察 Deployment、ReplicaSet、Pod、Service、rollout、日志、事件和 Service 访问。

### 1. 创建 namespace

```bash
kubectl create namespace aiops-lab
```

### 2. 写 Deployment 和 Service

保存为 `aiops-lab.yaml`：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: aiops-web
  namespace: aiops-lab
  labels:
    app: aiops-web
spec:
  replicas: 2
  selector:
    matchLabels:
      app: aiops-web
  template:
    metadata:
      labels:
        app: aiops-web
    spec:
      containers:
        - name: web
          image: nginx:1.25
          ports:
            - name: http
              containerPort: 80
          readinessProbe:
            httpGet:
              path: /
              port: http
            initialDelaySeconds: 3
            periodSeconds: 5
          resources:
            requests:
              cpu: "50m"
              memory: "64Mi"
            limits:
              cpu: "200m"
              memory: "128Mi"
---
apiVersion: v1
kind: Service
metadata:
  name: aiops-web
  namespace: aiops-lab
spec:
  type: ClusterIP
  selector:
    app: aiops-web
  ports:
    - name: http
      port: 80
      targetPort: http
```

### 3. 应用并观察

```bash
kubectl apply -f aiops-lab.yaml
kubectl get deploy,rs,pod,svc -n aiops-lab -o wide
kubectl rollout status deployment/aiops-web -n aiops-lab
```

记录：

```text
Deployment desired replicas:
ReplicaSet name:
Pod names:
Pod IPs:
Service ClusterIP:
```

### 4. 测试 Service

```bash
kubectl run curl-test -n aiops-lab --rm -it --image=curlimages/curl:8.10.1 --restart=Never -- \
  curl -v http://aiops-web/
```

观察：

- DNS 是否解析 `aiops-web`。
- HTTP 是否返回 200。
- 请求是否能打到 Service 后端。

### 5. 制造镜像错误

改成不存在的镜像：

```yaml
image: nginx:not-exist
```

应用：

```bash
kubectl apply -f aiops-lab.yaml
kubectl get pods -n aiops-lab
kubectl describe pod <new-pod> -n aiops-lab
kubectl get events -n aiops-lab --sort-by=.lastTimestamp
```

观察：

```text
ImagePullBackOff
ErrImagePull
```

恢复镜像后：

```bash
kubectl apply -f aiops-lab.yaml
kubectl rollout status deployment/aiops-web -n aiops-lab
```

### 6. 制造 Service selector 错误

把 Service selector 改错：

```yaml
selector:
  app: wrong-name
```

检查：

```bash
kubectl get svc aiops-web -n aiops-lab -o yaml
kubectl get pods -n aiops-lab --show-labels
kubectl get endpointslice -n aiops-lab -l kubernetes.io/service-name=aiops-web
```

你会看到 Service 没有正确后端。

### 7. 清理

```bash
kubectl delete namespace aiops-lab
```

## 典型故障排查表

| 现象 | 先看什么 | 常见原因 | 处理思路 |
|---|---|---|---|
| Pod Pending | `kubectl describe pod` events | 资源不足、taint、nodeSelector、PVC 未绑定 | 看调度事件和 requests |
| ImagePullBackOff | `describe pod`、events | 镜像名错、tag 不存在、仓库认证失败 | 修镜像或 imagePullSecret |
| CrashLoopBackOff | `logs --previous`、describe | 应用启动即退出、配置错、依赖不可用 | 看上一轮日志和退出码 |
| CreateContainerConfigError | `describe pod` | ConfigMap/Secret key 不存在 | 检查引用名称和 key |
| ContainerCreating 卡住 | `describe pod` | 拉镜像慢、volume 挂载、CNI 问题 | 看 events、Node、存储、网络插件 |
| OOMKilled | `describe pod` Last State | 内存 limit 太小或泄漏 | 调整 limit，查内存曲线 |
| Readiness failed | `describe pod` events | 健康接口失败、启动慢、依赖不可用 | 看 probe 配置和应用日志 |
| Liveness 导致重启 | `describe pod`、restart count | 探针太敏感或应用卡死 | 调整探针或修应用 |
| Service 无法访问 | EndpointSlice、selector | label 不匹配、targetPort 错、readiness 失败 | 查 labels、endpoints、Pod 端口 |
| DNS 解析失败 | CoreDNS、Pod 内 nslookup | CoreDNS 异常、NetworkPolicy、域名写错 | 查 kube-system、DNS policy |
| Rollout 卡住 | `rollout status`、新 Pod | 新版本不 ready | 查新 ReplicaSet 和 Pod events |
| kubectl 无权限 | `kubectl auth can-i` | RBAC 不允许 | 补 Role/RoleBinding |

## 排障流程：Pod Pending

```bash
kubectl get pod <pod> -n <ns> -o wide
kubectl describe pod <pod> -n <ns>
kubectl get nodes
kubectl describe node <node>
```

重点看 Events：

```text
0/3 nodes are available: insufficient cpu.
0/3 nodes are available: node(s) had untolerated taint.
0/3 nodes are available: persistentvolumeclaim is not bound.
```

判断：

- requests 是否太大？
- Node 是否 Ready？
- 是否有 taint？
- nodeSelector/affinity 是否太严格？
- PVC 是否绑定？

## 排障流程：CrashLoopBackOff

```bash
kubectl get pod <pod> -n <ns>
kubectl describe pod <pod> -n <ns>
kubectl logs <pod> -n <ns> --previous
kubectl logs <pod> -n <ns>
```

重点：

- 上一轮容器日志。
- Last State。
- Exit Code。
- Reason。
- ConfigMap/Secret 是否正确。
- readiness/liveness 是否杀得太早。

常见 Exit Code：

| 退出码 | 常见含义 |
|---|---|
| `1` | 应用一般错误 |
| `126` | 命令不可执行 |
| `127` | 命令不存在 |
| `137` | 常见于 SIGKILL/OOMKilled |
| `143` | 常见于 SIGTERM |

## 排障流程：ImagePullBackOff

```bash
kubectl describe pod <pod> -n <ns>
kubectl get events -n <ns> --sort-by=.lastTimestamp
```

看错误：

- `not found`
- `pull access denied`
- `authentication required`
- `i/o timeout`

处理：

- 镜像名和 tag 是否存在。
- 私有仓库是否需要 `imagePullSecrets`。
- Node 是否能访问镜像仓库。
- 镜像仓库证书是否可信。

## 排障流程：Service 不通

```bash
kubectl get svc aiops-api -n aiops -o wide
kubectl get pods -n aiops --show-labels
kubectl get endpointslice -n aiops -l kubernetes.io/service-name=aiops-api
kubectl describe svc aiops-api -n aiops
```

如果 EndpointSlice 为空：

- selector 不匹配。
- Pod 不 ready。
- Pod 不在同 namespace。

如果 EndpointSlice 有后端，但访问不通：

```bash
kubectl exec -it <client-pod> -n aiops -- curl -v http://aiops-api/
kubectl exec -it <backend-pod> -n aiops -- ss -ltnp
```

继续看：

- targetPort 是否正确。
- 应用是否监听 `0.0.0.0`。
- NetworkPolicy 是否阻断。
- kube-proxy / CNI 是否异常。

## 排障流程：rollout 卡住

```bash
kubectl rollout status deployment/aiops-api -n aiops
kubectl get rs -n aiops
kubectl get pods -n aiops -l app=aiops-api
kubectl describe deploy aiops-api -n aiops
kubectl describe pod <new-pod> -n aiops
```

判断：

- 新 ReplicaSet 是否创建？
- 新 Pod 是否 Pending？
- 是否 ImagePullBackOff？
- 是否 readinessProbe 失败？
- 是否 CrashLoopBackOff？
- 旧 Pod 是否仍在提供服务？

回滚：

```bash
kubectl rollout undo deployment/aiops-api -n aiops
```

回滚前最好保存证据：

```bash
kubectl get deploy aiops-api -n aiops -o yaml > deploy-before-rollback.yaml
kubectl get events -n aiops --sort-by=.lastTimestamp > events-before-rollback.txt
```

## AIOps 自动化诊断脚本

下面脚本按 namespace 和 app label 收集第一现场。

```bash
#!/usr/bin/env bash
set -euo pipefail

ns="${1:-aiops}"
selector="${2:-app=aiops-api}"

echo "== context =="
kubectl config current-context

echo
echo "== objects =="
kubectl get deploy,rs,pod,svc -n "$ns" -l "$selector" -o wide || true

echo
echo "== pods describe =="
kubectl describe pod -n "$ns" -l "$selector" || true

echo
echo "== logs current =="
kubectl logs -n "$ns" -l "$selector" --tail=100 || true

echo
echo "== logs previous =="
kubectl logs -n "$ns" -l "$selector" --tail=100 --previous || true

echo
echo "== endpointslices =="
kubectl get endpointslice -n "$ns" -o wide || true

echo
echo "== events =="
kubectl get events -n "$ns" --sort-by=.lastTimestamp || true
```

生产使用前要补：

- 输出目录和时间戳。
- JSON/YAML 证据保存。
- 敏感信息脱敏。
- 只读权限 ServiceAccount。
- 多 namespace 支持。
- 与告警标签联动。

## 大厂面试进阶主线

基础题通常问“对象是什么”，进阶题会继续追问：对象怎样进入集群、哪个组件观察到变化、失败后怎样重试、状态怎样保证不被覆盖、流量和存储怎样真正到达 Pod、控制面怎样高可用。下面把这些链路连起来。

## API 请求完整链路

执行下面命令时：

```bash
kubectl apply -f deployment.yaml # 声明并提交期望状态
```

完整主线是：

```text
kubectl
  -> 读取 kubeconfig，选择集群、用户和上下文
  -> 发现 API 资源并构造 HTTP 请求
  -> kube-apiserver 认证 Authentication
  -> kube-apiserver 鉴权 Authorization
  -> Mutating Admission 修改或补全对象
  -> schema 与对象合法性校验
  -> Validating Admission 决定是否放行
  -> storage 层编码对象并写入 etcd
  -> API Server 返回对象和 resourceVersion
  -> controller / scheduler 通过 Watch 感知变化
```

### 认证、鉴权和准入不要混淆

| 阶段 | 回答的问题 | 常见实现 | 失败表现 |
|---|---|---|---|
| 认证 Authentication | 你是谁 | 客户端证书、ServiceAccount Token、OIDC | HTTP 401 |
| 鉴权 Authorization | 你能做什么 | RBAC、Webhook | HTTP 403 |
| 准入 Admission | 这个请求在集群规则下能不能进入、是否需要修改 | Pod Security、ResourceQuota、Mutating/Validating Webhook | 请求被拒、Webhook timeout |

排查顺序：

```bash
kubectl auth whoami # 查看当前身份，旧版本 kubectl 不支持时看 kubeconfig
kubectl auth can-i create deployments -n aiops # 验证当前身份是否有创建权限
kubectl auth can-i --list -n aiops # 查看 namespace 内权限摘要
kubectl get validatingwebhookconfigurations,mutatingwebhookconfigurations # 查看准入 Webhook
kubectl get events -A --sort-by=.lastTimestamp # 补充查看对象创建后的事件
```

`401` 先查凭据、证书和 Token；`403` 先查 Role、ClusterRole 和 Binding；请求卡住或提示 webhook 错误时，查 Webhook Service、Endpoints、证书、`failurePolicy` 和超时。不要一看到“创建失败”就直接给用户绑定 `cluster-admin`。

### 四个版本字段

| 字段 | 含义 | 面试要点 |
|---|---|---|
| `metadata.resourceVersion` | 对象在存储中的版本标记 | 是不透明字符串，用于并发控制和 Watch 起点，不要当整数计算 |
| `metadata.generation` | 期望状态发生重要变化后的代数 | 通常修改 `spec` 会增加，改 label 是否增加取决于资源策略 |
| `status.observedGeneration` | 控制器已经处理到的 generation | 小于 generation 表示新配置尚未被控制器完全观察或处理 |
| `metadata.managedFields` | Server-Side Apply 的字段所有权记录 | 用于判断哪个 field manager 管理哪个字段 |

查看实际对象：

```bash
kubectl get deploy aiops-api -n aiops -o jsonpath='{.metadata.resourceVersion}{"\n"}' # 看存储版本
kubectl get deploy aiops-api -n aiops -o jsonpath='{.metadata.generation}{"\n"}' # 看期望状态代数
kubectl get deploy aiops-api -n aiops -o jsonpath='{.status.observedGeneration}{"\n"}' # 看控制器已处理代数
kubectl get deploy aiops-api -n aiops -o yaml --show-managed-fields # 看字段所有者
```

Kubernetes 更新对象时依赖乐观并发：客户端带着读到的 `resourceVersion` 更新；如果对象已被别人改过，API Server 返回 `409 Conflict`，客户端重新读取、合并并重试。不能用“最后写入直接覆盖一切”的思路处理控制器状态。

## List-Watch、Informer 与控制器

### 为什么不轮询整个集群

如果每个控制器每秒都列出全部 Pod，大集群会让 API Server 和 etcd 承受大量重复读取。Kubernetes 主要使用 List-Watch：

1. `List` 取得某类对象的当前快照和 `resourceVersion`。
2. `Watch` 从这个版本继续接收 `ADDED`、`MODIFIED`、`DELETED` 等事件。
3. 网络中断后从可用版本续看；版本太旧且历史已压缩时重新 List。

可以直接观察事件流：

```bash
kubectl get pods -n aiops --watch # 持续显示 Pod 变化
kubectl get pods -n aiops --watch-only -o json # 只观察后续事件的完整对象
```

Watch 不是消息队列，也不保证客户端永远不断线。etcd 历史被压缩后，过旧版本可能得到 `410 Gone`，客户端必须重新 List 并恢复状态。

### Informer 的职责

典型客户端控制器不会自己反复手写 List-Watch，而是使用 client-go 的 Informer 体系：

```text
API Server
  -> Reflector 执行 List 和 Watch
  -> DeltaFIFO 保存待处理对象变化
  -> Informer 更新本地 Indexer/Store 缓存
  -> EventHandler 把 namespace/name 等 key 放进 WorkQueue
  -> Worker 取 key，读取缓存并执行 Reconcile
  -> 成功 Forget；失败 RateLimited 重试
```

关键点：

- Reflector 负责维持 List-Watch。
- 本地缓存减少对 API Server 的读取压力，但缓存可能短暂落后。
- 事件处理器应尽量轻，只把 key 入队，不在回调里做长耗时操作。
- WorkQueue 吸收突发事件、去重并控制重试速率。
- Reconcile 必须幂等：同一个 key 执行多次，结果仍应收敛到同一目标。
- 控制器要能处理“对象已不存在”，因为 Delete 事件与实际读取之间存在时间差。

### 控制循环的正确写法

控制器不是执行一次脚本，而是持续比较：

```text
读取期望状态 spec
  -> 读取或计算实际状态
  -> 找差异
  -> 只执行收敛所需动作
  -> 更新 status / condition
  -> 等待下一次事件或定期同步
```

生产控制器需要：幂等、超时、指数退避、限速、清晰 Condition、终态错误、可观测指标和 leader election。多副本 controller-manager 通常通过 Lease 做领导者选举，只有 Leader 执行有副作用的控制循环，其他副本待命。

## ownerReference、finalizer 与垃圾回收

### ownerReference 表示谁拥有谁

Deployment 创建 ReplicaSet，ReplicaSet 创建 Pod。子对象的 `metadata.ownerReferences` 指向所有者，垃圾回收器据此处理级联删除。

```bash
kubectl get rs -n aiops -l app=aiops-api -o jsonpath='{range .items[*]}{.metadata.name}{" owner="}{.metadata.ownerReferences[0].kind}{"/"}{.metadata.ownerReferences[0].name}{"\n"}{end}' # 查看 RS 所有者
kubectl get pod -n aiops -l app=aiops-api -o jsonpath='{range .items[*]}{.metadata.name}{" owner="}{.metadata.ownerReferences[0].kind}{"/"}{.metadata.ownerReferences[0].name}{"\n"}{end}' # 查看 Pod 所有者
```

删除传播策略：

- `Foreground`：先把所有者标记删除，等待依赖对象清理，再移除所有者。
- `Background`：先删除所有者，垃圾回收器后台清理依赖对象。
- `Orphan`：删除所有者但保留依赖对象，让它们成为孤儿对象。

### finalizer 是删除前置条件

finalizer 不是“禁止删除”。当对象带 finalizer 时，删除请求会设置 `deletionTimestamp`，对象进入 terminating 状态；对应控制器完成外部清理后移除 finalizer，API Server 才真正删除对象。

典型用途：删除云负载均衡器、释放存储、清理外部 DNS 记录。常见故障：控制器已不存在、权限不足或外部 API 失败，导致 Namespace、PVC 或自定义资源长期 Terminating。

排查：

```bash
kubectl get namespace <name> -o yaml # 看 deletionTimestamp、spec.finalizers 和 conditions
kubectl get pvc <name> -n <namespace> -o yaml # 看保护类 finalizer
kubectl get crd # 确认自定义资源定义是否还在
kubectl logs <controller-pod> -n <controller-namespace> # 查负责清理的控制器
```

生产中不要把“强删 finalizer”当第一步。先确认外部资源是否已清理、负责的控制器为何失败，并保存对象 YAML；盲删 finalizer 可能留下云盘、负载均衡器或数据残留。

## Server-Side Apply 与字段所有权

Server-Side Apply，简称 SSA，把“谁管理哪个字段”记录在 API Server。CI/CD、HPA、Operator 和人工操作可以分别管理不同字段；两个 field manager 同时声明同一字段时会产生冲突，而不是静默覆盖。

```bash
kubectl apply --server-side --field-manager=platform-ci -f deployment.yaml # 由 platform-ci 声明字段
kubectl get deploy aiops-api -n aiops -o yaml --show-managed-fields # 查看 managedFields
kubectl apply --server-side --field-manager=emergency -f hotfix.yaml # 可能因字段所有权冲突失败
```

`--force-conflicts` 会夺取字段所有权，应只在理解影响后使用。生产 GitOps 中要固定 field manager、减少 `kubectl edit` 与多套工具争抢同一字段，并把冲突视为配置治理信号。

## 静态 Pod 与控制面启动

静态 Pod 由某个节点上的 kubelet 直接读取本地 manifest 管理，不经过 Deployment、ReplicaSet 或 scheduler。kubelet 会在 API Server 中创建 mirror Pod 供查看，但修改 mirror Pod 不能改变本地静态 Pod。

kubeadm 常把控制面组件 manifest 放在：

```text
/etc/kubernetes/manifests/
  -> kube-apiserver.yaml
  -> kube-controller-manager.yaml
  -> kube-scheduler.yaml
  -> etcd.yaml（stacked etcd 拓扑）
```

排障要点：

```bash
sudo ls -l /etc/kubernetes/manifests # 确认静态 Pod 清单存在
sudo journalctl -u kubelet -n 200 --no-pager # API Server 不可用时仍能从节点看 kubelet
sudo crictl ps -a # 直接看容器运行时中的控制面容器
sudo crictl logs <container-id> # API Server 不可用时查看组件日志
```

这解释了一个常见追问：API Server 自己也是 Pod 时，谁先创建它？答案是控制平面节点上的 kubelet根据本地静态 Pod 清单启动它，不依赖 scheduler。

## 调度器内部流程

调度器只为尚未设置 `spec.nodeName` 的 Pod 选择节点，并把绑定结果写回 API Server；真正拉镜像、挂载卷和启动容器的是目标节点 kubelet。

调度框架主线：

```text
Pending Pod 进入调度队列
  -> PreFilter 预计算
  -> Filter 排除不满足条件的 Node
  -> PostFilter 在无可行节点时尝试抢占等处理
  -> PreScore / Score 给可行节点打分
  -> NormalizeScore 归一化
  -> Reserve 暂时预留资源
  -> Permit 等待或批准
  -> PreBind 准备绑定
  -> Bind 写入 Pod 与 Node 的绑定
  -> PostBind 收尾
```

### Filter 与 Score 的区别

- Filter 回答“这个节点能不能放”，例如资源不足、污点不容忍、节点亲和性不匹配。
- Score 回答“能放的节点里哪个更好”，例如资源均衡、亲和偏好、拓扑分布。
- scheduler 主要根据 `requests` 做资源调度，不按容器当下 CPU 使用率调度。
- Pod 已绑定后，scheduler 不会因为节点负载升高自动把它迁走；重新调度通常需要 Pod 被驱逐或重建。

### 常见约束的职责

| 机制 | 作用 | 硬约束/软偏好 | 常见误区 |
|---|---|---|---|
| `nodeSelector` | 按节点标签选择 | 硬约束 | 表达能力有限 |
| nodeAffinity | 节点亲和/反亲和 | required 或 preferred | 标签变更不会自动迁移已运行 Pod |
| podAffinity | 与某类 Pod 靠近 | required 或 preferred | 大集群计算成本更高 |
| podAntiAffinity | 与某类 Pod 分散 | required 或 preferred | topologyKey 与节点标签缺失会导致意外结果 |
| taint/toleration | 节点排斥与 Pod 容忍 | 通常是准入约束 | toleration 允许进入，不代表一定调度过去 |
| topologySpreadConstraints | 按 zone/hostname 等均匀分布 | DoNotSchedule 或 ScheduleAnyway | `maxSkew`、eligible domain 和 selector 容易误配 |
| PriorityClass | 决定排队和抢占优先级 | 高优先级可能抢占低优先级 | 不等于业务一定可用 |

### 一份生产导向的分布配置

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: checkout
  namespace: prod
spec:
  replicas: 6
  selector:
    matchLabels:
      app: checkout
  template:
    metadata:
      labels:
        app: checkout
    spec:
      topologySpreadConstraints:
        - maxSkew: 1 # 任意两个可调度 zone 的副本数最多相差 1
          topologyKey: topology.kubernetes.io/zone # 按可用区分布
          whenUnsatisfiable: DoNotSchedule # 不能满足时保持 Pending，不破坏硬约束
          labelSelector:
            matchLabels:
              app: checkout # 只统计同应用 Pod
        - maxSkew: 1 # 同一可用区内继续按节点分散
          topologyKey: kubernetes.io/hostname
          whenUnsatisfiable: ScheduleAnyway # 节点不足时允许调度但尽量均匀
          labelSelector:
            matchLabels:
              app: checkout
      containers:
        - name: checkout
          image: registry.example.com/checkout:1.8.0
          resources:
            requests:
              cpu: 500m
              memory: 512Mi
            limits:
              memory: 1Gi
```

排查 Pending 时，先看 `kubectl describe pod` 最后的 scheduler Events，再核对 requests、节点 allocatable、taint、affinity、PVC、端口和 topology labels，不要只看节点实时 CPU。

## PDB、优先级与抢占

PodDisruptionBudget，简称 PDB，限制自愿中断期间同时不可用的副本，例如节点 drain、集群升级和 Cluster Autoscaler 缩容。它不保护节点宕机、内核崩溃等非自愿故障，也不能替代多副本和跨故障域部署。

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: checkout
  namespace: prod
spec:
  minAvailable: 5 # 6 个副本中，自愿中断时至少保持 5 个可用
  selector:
    matchLabels:
      app: checkout
```

PDB 太严格会让 `kubectl drain`、升级或缩容长期卡住。先检查：

```bash
kubectl get pdb -A # 看 ALLOWED DISRUPTIONS
kubectl describe pdb checkout -n prod # 看 selector、期望与健康副本
kubectl get pod -n prod -l app=checkout -o wide # 看副本分布和 readiness
```

PriorityClass 解决资源竞争时谁更优先。高优先级 Pod 无法调度时，scheduler 可能提名节点并抢占较低优先级 Pod；但 PDB 只会被抢占逻辑尽量尊重，并非所有情况下都能绝对阻止非自愿影响。系统关键组件可使用高优先级，普通业务不要无节制设置极高优先级。

## HPA、VPA 与 Cluster Autoscaler

三者分别回答不同问题：

| 组件 | 调什么 | 主要输入 | 不能解决什么 |
|---|---|---|---|
| HPA | Pod 副本数 | CPU、内存、自定义/外部指标 | 单个 Pod requests 不合理、节点容量不足 |
| VPA | Pod requests/limits 建议或更新 | 历史资源使用 | 横向流量扩展、应用并发瓶颈 |
| Cluster Autoscaler | Node 数量 | 因资源约束 Pending 的 Pod、可缩节点 | CNI/PVC/亲和性错误导致的 Pending |

HPA v2 的核心比例可以简化理解为：

```text
期望副本数 = ceil(当前副本数 * 当前指标值 / 目标指标值)
```

实际还有容差、缺失指标、未就绪 Pod、稳定窗口和伸缩策略。CPU 利用率目标通常以 Pod 的 CPU `requests` 为分母；没有合理 requests，CPU HPA 就缺少可靠基准。

```bash
kubectl get hpa -A # 看当前/目标指标与期望副本
kubectl describe hpa checkout -n prod # 看 Conditions、Events 和指标错误
kubectl top pod -n prod # 依赖 metrics-server，快速对照当前资源使用
kubectl get --raw '/apis/metrics.k8s.io/v1beta1/namespaces/prod/pods' # 验证资源指标 API
```

生产组合原则：

- HPA 与 VPA 同时修改 CPU/内存时可能相互影响；常把 VPA 先用于 recommendation，或明确职责边界。
- HPA 扩出 Pod 后若节点不足，Pod Pending，再由 Cluster Autoscaler 扩 Node。
- 扩 Node 仍受云配额、NodeGroup 上限、启动耗时、DaemonSet 开销、亲和性和 PVC 拓扑约束影响。
- 伸缩指标应靠近业务瓶颈，例如队列深度、请求并发、延迟，而不只盯 CPU。

## Pod 优雅终止与流量摘除

删除一个业务 Pod 时，理想链路是：

```text
API Server 设置 deletionTimestamp
  -> EndpointSlice 控制器更新 endpoint 的 ready/terminating 状态
  -> kube-proxy、负载均衡器或数据面逐步停止发送新流量
  -> kubelet 执行 preStop（如果配置）
  -> kubelet 向容器主进程发送 SIGTERM
  -> 应用停止接新请求并完成在途请求
  -> terminationGracePeriodSeconds 到期仍未退出则 SIGKILL
  -> Pod 从节点和 API 中删除
```

这些动作是并行收敛，不是绝对严格的串行事务，因此应用必须自己处理连接排空和幂等重试。

```yaml
spec:
  terminationGracePeriodSeconds: 45 # 给应用最多 45 秒退出
  containers:
    - name: checkout
      lifecycle:
        preStop:
          exec:
            command: ["/bin/sh", "-c", "sleep 5"] # 给服务发现链路留出摘流时间
      readinessProbe:
        httpGet:
          path: /ready
          port: 8080
```

常见故障：应用不处理 SIGTERM、主进程被 shell 包住收不到信号、`preStop + 应用退出` 超过 grace period、readiness 仍返回成功、客户端长连接未排空、云负载均衡健康检查周期过长。

## Node Lease、驱逐与 QoS

kubelet周期性更新 Node 状态和 `kube-node-lease` Namespace 中的 Lease。Node Controller 根据心跳判断节点是否失联，并为不可达节点添加 taint；Pod 是否被驱逐还受到容忍时间、控制器配置和故障类型影响。

```bash
kubectl get node # 看 Ready 状态
kubectl describe node <node> # 看 Conditions、Taints、Allocated resources 和 Events
kubectl get lease -n kube-node-lease <node> -o yaml # 看 renewTime
kubectl get pod -A --field-selector spec.nodeName=<node> -o wide # 看节点上的 Pod
```

节点压力包括 MemoryPressure、DiskPressure、PIDPressure。kubelet 在达到驱逐阈值时回收资源或驱逐 Pod。QoS 类别：

- `Guaranteed`：每个容器 CPU/内存 request 等于 limit，且都设置完整。
- `Burstable`：至少有一个 request 或 limit，但不满足 Guaranteed。
- `BestEffort`：没有 CPU/内存 request 和 limit。

内存压力下 QoS 和实际超用共同影响驱逐顺序；QoS 不是“Guaranteed 永远不会被杀”。容器超过 cgroup memory limit 仍可能 OOMKilled，节点极端故障也无法保证。

## Kubernetes 网络完整路径

### Pod 创建时网络怎样就绪

```text
scheduler 绑定 Pod 到 Node
  -> kubelet 请求 CRI 创建 Pod sandbox
  -> 容器运行时调用 CNI plugin
  -> CNI 分配 Pod IP、创建网卡/路由并返回结果
  -> kubelet 启动业务容器
  -> CNI 控制面持续下发路由、隧道、策略或 eBPF 状态
```

### Service 请求怎样到 Pod

传统 kube-proxy 模式：

```text
客户端解析 Service DNS
  -> 得到 ClusterIP
  -> 节点 iptables/IPVS 规则匹配 Service
  -> 选择 EndpointSlice 中的后端 Pod IP
  -> conntrack 记录连接状态
  -> CNI 数据面把包送到本机或跨节点 Pod
```

eBPF 数据面可以在更早的内核 hook 完成 Service 负载均衡和策略处理，甚至替代 kube-proxy，但仍要从 Kubernetes Service、EndpointSlice 和策略对象同步期望状态。

分层排查：

1. DNS：`nslookup service.namespace.svc.cluster.local`。
2. Service：selector、`port`、`targetPort`。
3. EndpointSlice：是否有 ready 后端、地址和端口是否正确。
4. 应用：是否监听 Pod IP/`0.0.0.0`，readiness 是否通过。
5. NetworkPolicy：源和目标 selector、namespaceSelector、端口、DNS 放行。
6. 节点数据面：kube-proxy 或 eBPF 状态、路由、隧道、MTU、conntrack。
7. 外部入口：Ingress/Gateway、LoadBalancer 健康检查、SNAT 和安全组。

深入 CNI 时继续学习 [Calico](./calico.md) 和 [Cilium](./cilium.md)。前者重点理解 IPAM、BGP/封装和策略，后者重点理解 eBPF、身份策略和 Hubble 可观测性。

## Kubernetes 存储完整路径

动态制备与挂载主线：

```text
Pod 引用 PVC
  -> PVC 请求 StorageClass
  -> external-provisioner 调用 CSI Controller 创建存储
  -> 生成并绑定 PV
  -> external-attacher 在需要时把卷附加到目标 Node
  -> kubelet 调用 CSI NodeStage/NodePublish 挂载到 Pod
  -> Pod 才能进入 Running
```

`volumeBindingMode` 很关键：

- `Immediate`：PVC 创建后立即制备和绑定，可能在还不知道 Pod 调度位置时选错可用区。
- `WaitForFirstConsumer`：等 Pod 参与调度后再结合 node selector、affinity、taint 和拓扑制备，适合有可用区限制的块存储。

PVC/PV/POD 故障顺序：

```bash
kubectl get pvc,pv -A # 看 Pending、Bound、Released 状态
kubectl describe pvc <pvc> -n <namespace> # 看 StorageClass 和 provisioner Events
kubectl get storageclass -o yaml # 看 provisioner、reclaimPolicy、volumeBindingMode
kubectl describe pod <pod> -n <namespace> # 看 FailedScheduling、AttachVolume、MountVolume
kubectl get volumeattachment # 看 CSI attach 对象
kubectl get csidriver,csinode # 看驱动声明和节点能力
kubectl logs -n <csi-namespace> <csi-controller-pod> -c <sidecar> # 查 controller sidecar
kubectl logs -n <csi-namespace> <csi-node-pod> -c <driver> # 查目标节点插件
```

生产设计还要回答：访问模式 RWO/RWX/ROX/RWOP、快照、一致性、扩容、拓扑、回收策略、加密、备份恢复、性能上限和应用自身数据一致性。StatefulSet 提供稳定身份和卷模板，不自动让数据库获得强一致或高可用。

## Kubernetes 安全基线

安全是多层控制：

1. API 入口：强身份、短期凭据、最小 RBAC、审计日志。
2. 准入：Pod Security Admission、镜像策略、资源配额、受控 Webhook。
3. 工作负载：非 root、只读根文件系统、删除 capabilities、seccomp、禁止特权和 host namespace。
4. 网络：默认拒绝、按应用和端口最小放行、控制 egress。
5. Secret：etcd 静态加密、外部密钥系统、最小读取权限、轮换和日志脱敏。
6. 供应链：镜像签名、漏洞扫描、固定 digest、SBOM 和准入验证。
7. 节点：补丁、最小系统、运行时隔离、kubelet API 保护和主机审计。

```yaml
securityContext:
  runAsNonRoot: true # 拒绝以 root 身份启动
  seccompProfile:
    type: RuntimeDefault # 使用运行时默认系统调用过滤
containers:
  - name: app
    securityContext:
      allowPrivilegeEscalation: false # 禁止进程获得更多权限
      readOnlyRootFilesystem: true # 根文件系统只读
      capabilities:
        drop: ["ALL"] # 删除 Linux capabilities
```

`Secret` 的 base64 只是编码。要实现静态数据保护，应配置 API Server 的 encryption provider，并安全管理加密密钥；同时用 RBAC 限制 `get/list/watch secrets`，因为能创建特定工作负载的用户也可能通过挂载间接读取 Secret。

## 生产高可用架构

典型 kubeadm 高可用拓扑：

```text
kubectl / controllers / nodes
  -> API Server 负载均衡地址
  -> control-plane-1: apiserver + controller-manager + scheduler
  -> control-plane-2: apiserver + controller-manager + scheduler
  -> control-plane-3: apiserver + controller-manager + scheduler
  -> 3 或 5 个 etcd 成员形成多数派
  -> 多个 worker 分布在不同故障域
```

设计检查：

- API Server 是多活无状态入口，前面需要健康检查正确的负载均衡器。
- controller-manager 和 scheduler 多副本运行，但通过 Lease leader election 选主。
- stacked etcd 部署简单但控制面与 etcd 故障域耦合；external etcd 隔离更强，运维复杂度和节点数更高。
- etcd 必须使用低延迟可靠磁盘、独立备份、定期恢复演练和成员证书轮换。
- CoreDNS、CNI、CSI、Ingress、监控和镜像仓库也要消除单点；只有控制面多副本不等于业务高可用。
- 业务需多副本、跨 zone/host 分布、PDB、合理 probes、连接排空和下游超时重试。
- 管理面故障时，现有 Pod 可能继续运行，但新建、扩缩容、故障替换和配置变更会受影响。

### etcd 多数派计算

Raft 集群要获得 `floor(N/2)+1` 多数派：3 成员可容忍 1 个故障，5 成员可容忍 2 个故障。偶数成员不会比前一个奇数成员增加容错数，却增加通信成本。深入阅读 [etcd 精讲](./etcd.md)。

## 升级、回滚与变更控制

一次可靠升级不是直接替换二进制：

1. 阅读目标版本 release notes、弃用 API、版本偏差策略和 CNI/CSI/Ingress 兼容矩阵。
2. 备份 etcd，并在隔离环境验证快照可恢复。
3. 验证控制面、节点、证书、PDB、容量和告警健康。
4. 先升级一个非生产或 canary 集群，执行业务与平台回归。
5. 控制面通常一次跨一个 minor 版本滚动升级。
6. 逐个 drain、升级和 uncordon worker；观察错误率、延迟、Pending 和系统组件。
7. 升级 kubelet 后再按兼容策略升级 kubectl 等客户端。
8. 验证 API、DNS、Service、网络策略、存储挂载、Ingress、HPA、日志和监控。

```bash
kubectl get --raw='/readyz?verbose' # 升级前后检查 API Server 依赖
kubectl get --raw='/livez?verbose' # 检查进程活性
kubectl get node -o wide # 对照 kubelet 版本与节点状态
kubectl drain <node> --ignore-daemonsets --delete-emptydir-data # 驱逐可驱逐工作负载
kubectl uncordon <node> # 升级验证后恢复调度
```

回滚边界必须提前说清：Deployment 镜像通常可回滚；kubelet/组件包可能按官方流程降级；etcd schema、弃用 API、CRD 转换和存储格式变化不能假设可一键回滚。升级前的兼容性扫描和恢复演练比事后“强行降级”更重要。

## 容量、性能与 API 公平性

大集群瓶颈不是只看节点 CPU：

| 层 | 常见瓶颈 | 关键证据 |
|---|---|---|
| API Server | 请求并发、Webhook 延迟、大对象、LIST 风暴 | request rate/latency、inflight、429、audit、APF queue |
| etcd | fsync 延迟、backend 容量、碎片、Leader 变化 | WAL fsync、commit、db size、leader、proposal failure |
| controller | workqueue 堆积、reconcile 失败、外部 API 限速 | queue depth/latency、retries、controller logs |
| scheduler | pending queue、调度耗时、复杂 affinity | scheduling latency、unschedulable Pods、plugin duration |
| kubelet | Pod 密度、PLEG/CRI 延迟、磁盘和 PID 压力 | node conditions、runtime operations、evictions |
| 网络 | conntrack、NAT、MTU、路由规模、BPF map | drops、retransmit、conntrack/map pressure、CNI logs |
| 存储 | provision/attach/mount 延迟、IOPS、拓扑 | CSI sidecar/driver metrics、VolumeAttachment、应用 IO |

API Priority and Fairness，简称 APF，按 FlowSchema 和 PriorityLevelConfiguration 对 API 请求分类、排队和公平共享，避免低优先级 LIST 或自动化流量把关键控制请求完全挤出。出现 `429 Too Many Requests` 时，应检查客户端 QPS/burst、重试退避、分页、Watch 复用、APF 配置和慢 Webhook，而不是只扩大 API Server。

容量治理还包括：

- 用 ResourceQuota 控制 Namespace 总量，用 LimitRange 提供或约束默认 requests/limits。
- 给批任务、在线服务和平台组件分优先级，避免资源争抢无序。
- 对大列表使用分页和 selector，复用 informer，不高频全量扫描。
- 以 SLO 和故障域做容量预留，保证一个节点或一个 zone 故障后仍可接住副本。
- 在压测环境验证 Pod 数、Service/Endpoint 数、对象大小、发布并发和节点启动速率。

## 进阶故障实验：亲手观察 finalizer

这个实验故意创建一个没有控制器负责清理的测试 finalizer，只用于学习删除状态机，绝不能照搬到生产对象。

### 1. 创建对象

保存为 `finalizer-lab.yaml`：

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: finalizer-lab
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: guarded
  namespace: finalizer-lab
  finalizers:
    - learning.zero-to-aiops.example/cleanup # 故意使用无人处理的测试 finalizer
data:
  purpose: observe-deletion-state
```

```bash
kubectl apply -f finalizer-lab.yaml # 创建 Namespace 和 ConfigMap
kubectl get configmap guarded -n finalizer-lab -o yaml # 确认 finalizers 存在
```

预期：对象存在，`metadata.finalizers` 包含测试字符串。

### 2. 发起删除并观察卡住

```bash
kubectl delete configmap guarded -n finalizer-lab --wait=false # 只发请求，不等待最终删除
kubectl get configmap guarded -n finalizer-lab -o yaml # 观察 deletionTimestamp 与 finalizers
```

预期：对象仍能查到，出现 `deletionTimestamp`，因为没有控制器移除 finalizer。

### 3. 模拟清理完成

```bash
kubectl patch configmap guarded -n finalizer-lab --type=merge -p '{"metadata":{"finalizers":[]}}' # 仅在实验中移除 finalizer
kubectl get configmap guarded -n finalizer-lab # 预期 NotFound
kubectl delete namespace finalizer-lab # 清理实验 Namespace
```

如果实验不符合预期，先检查：

- 当前 context 是否是实验集群。
- 对 ConfigMap 是否有 `get/patch/delete` 权限。
- YAML 中 finalizer 是否真的写入对象。
- PowerShell 对 JSON 引号转义是否正确；必要时把 patch JSON 保存到文件再执行。

复盘时要能解释：删除请求已经被接受，`deletionTimestamp` 使对象进入删除流程；finalizer 表示外部清理尚未完成；移除最后一个 finalizer 后才真正删除。

## 生产故障场景推演

### API Server 变慢，但现有 Pod 仍在运行

1. 先确认影响面：写请求、读请求、某资源、某租户还是全局。
2. 看 `/readyz?verbose`、API 延迟、429、inflight、APF 排队和审计日志。
3. 查 etcd fsync/commit 延迟、Leader 变化、backend 容量和网络。
4. 查 Mutating/Validating Webhook 的延迟、错误和后端 Endpoints。
5. 查是否有无分页 LIST、频繁轮询、大对象或控制器重试风暴。
6. 限流或隔离异常客户端，恢复关键控制流量；不要先重启全部控制面。

### Node 变成 NotReady

1. 看 Node Conditions、Lease `renewTime`、taints 和事件时间线。
2. 登录节点检查 kubelet、container runtime、磁盘、内存、PID、网络和时间同步。
3. 区分控制面到 kubelet不通、节点到 API Server 不通、运行时故障和 CNI 故障。
4. 查看该节点 Pod 是否仍提供流量、是否被驱逐、控制器是否能在其他节点补副本。
5. 评估故障域容量、PDB 和有状态卷是否允许迁移，再决定修复、隔离或替换节点。

### Service 偶发超时

1. 用 Hubble/流日志或客户端日志确认源、目标、端口、时间和失败比例。
2. 对照 EndpointSlice，检查是否只有某个 Pod/Node/zone 失败。
3. 查 readiness 抖动、应用连接池、长连接、滚动发布和终止摘流。
4. 查 kube-proxy/eBPF、conntrack、SNAT 端口、MTU、丢包和重传。
5. 绕过 Service 直连 Pod IP 做对照，但注意直连只用于定位，不是修复方案。

### Deployment 发布卡住

1. 看 Deployment Conditions、ReplicaSet、新旧 Pod 数和 rollout events。
2. 新 Pod Pending 就查调度、配额、PVC；拉不起镜像查仓库；启动失败查日志和配置。
3. Running 但不 Ready 就查 probe、依赖、NetworkPolicy 和启动耗时。
4. 旧 Pod 退不掉就查 PDB、termination、finalizer 和连接排空。
5. 在错误预算允许范围内决定继续、暂停或回滚，并先保留新旧版本证据。

## 面试怎么讲

### 30 秒版本

Kubernetes 是声明式容器编排平台。用户通过 API 对象声明期望状态，API Server 负责统一入口并把状态持久化到 etcd，控制器通过 List-Watch 持续做状态收敛，scheduler 给未绑定 Pod 选择 Node，kubelet 通过 CRI、CNI 和 CSI 启动容器、配置网络和挂载存储。Service 与 EndpointSlice 提供稳定服务发现。生产设计上我会同时考虑跨故障域副本、PDB、弹性、最小权限、etcd 备份、滚动升级和可观测性；排障则按对象控制链、调度链、节点运行链和流量/存储链逐层用证据缩小范围。

### 3 分钟版本

Kubernetes 的核心不是“批量执行 docker run”，而是 API 驱动的声明式控制系统。`kubectl` 把对象提交给 API Server，请求经过认证、鉴权、准入和校验后存入 etcd。controller-manager 中的控制器使用 Informer 维护本地缓存，把对象 key 放入工作队列，幂等比较 `spec` 期望状态和实际状态并执行收敛。例如 Deployment 创建 ReplicaSet，ReplicaSet 再补齐 Pod。

新 Pod 还没有 `spec.nodeName` 时进入 scheduler 队列。scheduler 先用 Filter 排除资源、污点、亲和性、PVC 拓扑等不满足的节点，再用 Score 选择更合适的节点并写入 Binding。目标节点 kubelet观察到 Pod 后，通过 CRI 请求容器运行时创建 sandbox，通过 CNI 分配 IP 和配置网络，通过 CSI 完成卷挂载，再拉镜像、启动容器并执行 probes。Pod ready 后，EndpointSlice 更新，Service 数据面才能稳定把流量送给后端。

高可用不能只说三个控制面。我会让 API Server 多活、controller/scheduler 通过 Lease 选主，etcd 使用 3 或 5 个成员跨故障域并做低延迟磁盘、快照和恢复演练；业务多副本跨 zone/host 分布，配合 PDB、优雅终止、HPA 和故障容量预留。升级前检查 API 弃用、版本偏差、CNI/CSI 兼容性和 etcd 恢复，再逐控制面和节点滚动升级。

故障处理时我先确认时间线和影响面。发布问题沿 Deployment、ReplicaSet、Pod、events、logs、probes 查；Pending 沿 scheduler event、requests、taint/affinity、PVC 查；Service 不通沿 DNS、Service、EndpointSlice、应用监听、NetworkPolicy 和节点数据面查；Node NotReady 沿 Lease、kubelet、运行时、资源压力和网络查。每一步都先保存证据，再决定回滚、隔离还是修复。

## 核心面试题参考答案与连续追问

### 1. 创建一个 Pod 的完整流程是什么

参考答案：

1. 客户端从 kubeconfig 取得 API Server、身份和上下文，提交 Pod 或上层 Deployment。
2. API Server 认证、鉴权、执行 mutating/validating admission 和对象校验，把对象写入 etcd。
3. 如果创建的是 Deployment，Deployment Controller 创建 ReplicaSet，ReplicaSet Controller 创建 Pod。
4. scheduler Watch 到未绑定 Pod，经过 Filter、Score 等阶段选 Node，写入 Binding。
5. 目标 kubelet Watch 到 Pod，通过 CRI 创建 sandbox；运行时调用 CNI 配网，需要卷时调用 CSI 路径挂载。
6. 运行时拉镜像并启动容器，kubelet执行 startup/readiness/liveness probe 并回报 status。
7. Pod ready 后 EndpointSlice Controller 更新后端，Service 数据面开始转发流量。

连续追问：

- API Server 写 etcd 成功，但响应丢了怎么办？客户端不能假设失败，应重新 GET 目标对象并依赖幂等语义判断。
- scheduler 挂了会怎样？已运行 Pod 继续运行，未绑定 Pod 保持 Pending；scheduler 恢复或备用副本获得 Lease 后继续调度。
- kubelet没收到 Watch 事件怎么办？客户端机制会重连/重列，kubelet也有周期性同步，不依赖单个事件恰好送达。

### 2. Deployment 滚动更新是怎样完成的

修改 Pod template 会让 Deployment 的 generation 增加。Deployment Controller 根据新 template 创建新 ReplicaSet，按 `maxSurge` 和 `maxUnavailable` 逐步扩新缩旧。新 Pod 通过 readiness、`minReadySeconds` 后才算 available；在 `progressDeadlineSeconds` 内未推进会出现 `ProgressDeadlineExceeded` Condition，但控制器不会自动替你回滚。

连续追问：

- 只改副本数会创建新 ReplicaSet 吗？不会，因为 Pod template 没变。
- readiness 一直失败会怎样？新副本不计 available，旧副本可能按可用性约束保留，rollout 卡住。
- 回滚回的是什么？回到历史 ReplicaSet 对应的 Pod template，不会回滚数据库 schema 或外部依赖。

### 3. 为什么 Kubernetes 使用 List-Watch，而不是一直轮询

List 建立当前快照，Watch 从 `resourceVersion` 接收增量变化，能降低重复全量读取和收敛延迟。Informer 在此基础上维护本地缓存，事件处理器只把 key 入队，worker 幂等 Reconcile。Watch 会断，旧 revision 也会因历史压缩不可用，所以客户端必须支持重连、重新 List 和最终收敛。

连续追问：

- 会不会丢事件？客户端不能把正确性建立在“每个事件只处理一次”；应该以当前对象状态为准，事件只是触发 Reconcile。
- 缓存是不是强一致？不是，可能短暂滞后；需要线性一致决策时应明确从 API Server 读取并处理冲突。
- 为什么 Reconcile 必须幂等？网络重试、重复事件、进程重启都会让同一对象被多次处理。

### 4. Pod 为什么一直 Pending

先看 `kubectl describe pod` 的 scheduler Events，再分支：

- `Insufficient cpu/memory`：requests 超过可分配资源或碎片化。
- taint 不容忍、node selector/affinity 不匹配、topology spread 无法满足。
- PVC Pending、存储拓扑冲突或 volume node affinity 冲突。
- hostPort 冲突、达到 Pod 数上限、ResourceQuota 或 admission 约束。
- scheduler 不健康、调度队列拥塞或扩容器受云配额限制。

节点实时 CPU 很低也可能 Pending，因为 scheduler 看的是 requests 和 allocatable，而不是只看当前利用率。

### 5. Service 访问不通怎样排查

按层排查而不是先重启 kube-proxy：

1. 从调用方验证 DNS 名称和解析结果。
2. 检查 Service 类型、selector、`port`、`targetPort`。
3. 检查 EndpointSlice 是否有正确且 ready 的 Pod IP/端口。
4. 直连 Pod IP 和端口验证应用监听与 readiness。
5. 检查 NetworkPolicy 的 ingress/egress、namespaceSelector 和 DNS 放行。
6. 检查 kube-proxy 或 Cilium Service map、路由、MTU、conntrack 和节点差异。
7. 若只有外部失败，再看 Ingress/Gateway、LB 健康检查、安全组和 SNAT。

连续追问：ClusterIP 本身通常不是某张网卡上的真实 IP，而是由 iptables/IPVS/eBPF 等数据面规则实现的虚拟服务地址。

### 6. readiness、liveness 和 startup probe 怎样设计

- startup 只负责保护慢启动阶段；成功后退出职责。
- readiness 判断当前实例能否接新流量，失败会从 Service ready endpoints 中摘除。
- liveness 判断进程是否已无法自行恢复，失败会触发容器重启。

探针应快速、低成本、语义稳定。readiness 可以反映必要依赖，但不要把所有远程依赖都塞进 liveness，否则下游故障会触发全体重启风暴。启动慢应使用 startup probe，不要只把 liveness 初始延迟无限加大。

### 7. Pod 删除为什么会卡在 Terminating

先看 `deletionTimestamp`、finalizers、容器退出、卷卸载和节点状态：

- finalizer 对应控制器没有完成外部资源清理。
- `preStop` 或应用没有在 grace period 内退出。
- kubelet或节点失联，API 对象与节点实际状态暂时无法协调。
- CSI detach/unmount 卡住。
- Namespace 删除还可能等待 namespace 内资源和 API discovery。

强删 finalizer 或 `--force --grace-period=0` 前必须确认数据、卷和外部资源后果；强删 API 对象不保证节点上的进程已立即消失。

### 8. HPA 扩容了，为什么流量还是扛不住

可能原因：指标滞后或与瓶颈无关、CPU requests 失真、Pod 启动和 ready 太慢、节点不足导致新 Pod Pending、下游数据库先饱和、Ingress/连接池限流、热点或有状态分片无法均匀、maxReplicas 太低。要沿“指标产生 -> metrics adapter -> HPA 决策 -> Pod 调度 -> 启动 ready -> Service 接流量 -> 下游容量”检查整条闭环。

### 9. PDB 能不能保证业务永不掉副本

不能。PDB 主要约束 eviction API 触发的自愿中断，例如 drain 和部分集群运维；节点突然断电、Pod 崩溃、直接删除、控制器替换等场景不等价。PDB 还依赖健康副本和正确 selector。真正可用性需要多副本、故障域分布、容量预留、正确 probes 和应用级容错共同完成。

### 10. API Server 或 etcd 故障时集群会怎样

- API Server 全部不可用：现有容器和节点数据面通常继续运行，但查询、发布、扩缩、调度、故障补副本和控制器更新无法正常进行。
- etcd 丢失多数派：不能提交需要共识的新写入，API Server 相关请求失败或超时；不要在不理解成员状态时随意 `member remove/add`。
- 单个 API Server 失败：负载均衡应摘除，其他副本继续服务。
- controller/scheduler Leader 失败：备用副本通过 Lease 重新选主，期间收敛短暂停顿。

恢复优先级是保护数据一致性和多数派，保存日志/指标/成员状态，按经过演练的 etcd 恢复流程操作，而不是同时重启所有成员。

### 11. Calico 和 Cilium 怎么选

先按需求和现状选，不用“谁更新”做单一结论：

- Calico 常见优势是成熟的 Kubernetes NetworkPolicy、灵活 IPAM、BGP/路由与封装方案，传统网络团队容易映射到现有网络知识。
- Cilium 以 eBPF 数据面、基于身份的策略、kube-proxy replacement 和 Hubble 流可观测性见长，也更依赖内核能力与 eBPF 运维知识。
- 两者都要评估内核/发行版、云网络、性能、策略、加密、可观测性、升级、团队能力和回滚方案。

面试中应画出目标环境的数据路径并给出选择依据，而不是只背功能表。

### 12. 怎样设计一个生产级 Kubernetes 集群

答题框架：

1. 需求：租户数、业务类型、SLO、Pod/Node 规模、峰值、地域、合规和 RTO/RPO。
2. 控制面：多 API Server + LB，controller/scheduler 选主，3/5 成员 etcd、独立磁盘、备份恢复。
3. 节点池：按在线/离线/GPU/系统组件隔离，设置 taint、配额和容量缓冲。
4. 网络：Pod/Service CIDR、CNI、路由/封装、NetworkPolicy、Ingress/Gateway、DNS 和出口治理。
5. 存储：CSI、StorageClass、拓扑、访问模式、快照、备份和故障恢复。
6. 可用性：跨 zone/host、PDB、topology spread、autoscaling、优雅终止和灾备。
7. 安全：身份、最小 RBAC、Pod Security、Secret 加密、审计、镜像供应链和节点加固。
8. 可观测与 AIOps：控制面/节点/工作负载指标、日志、审计、事件、流量观测、告警和自动化 runbook。
9. 交付：GitOps、分批发布、策略即代码、版本兼容、升级窗口和回滚边界。
10. 验证：容量压测、节点/zone/控制面故障注入、etcd 恢复演练和 SLO 复盘。

回答最后要主动说权衡：例如 stacked etcd 降低复杂度但耦合故障域，跨三 zone 提高容灾但增加时延与成本，严格 PDB 提高单次维护保护却可能阻塞升级。

## 小白可能会问

### Kubernetes 和 Docker 是什么关系？

Docker 偏向单机容器构建和运行，Kubernetes 偏向多机容器编排。Kubernetes 可以运行容器，但它管理的是 Pod、Deployment、Service 等更高层对象。

### 为什么 Kubernetes 不直接管理容器，而是管理 Pod？

Pod 是 Kubernetes 的最小调度单位。一个 Pod 可以包含一个或多个紧密协作的容器，共享网络和存储上下文。这样 Kubernetes 可以把一组必须同生共死的容器作为一个整体调度。

### 为什么 Pod IP 会变？

Pod 是临时对象。重建、调度到其他 Node、滚动更新都会产生新 Pod 和新 IP。所以服务间访问不应该依赖 Pod IP，而应该用 Service。

### Deployment、ReplicaSet、Pod 谁管谁？

Deployment 管 ReplicaSet，ReplicaSet 管 Pod。你通常操作 Deployment，不直接操作 ReplicaSet。

### 为什么删除 Pod 后它又回来了？

因为 ReplicaSet 看到实际副本数少于期望副本数，就创建新的 Pod 补齐。这是控制循环的正常行为。

### Service 为什么访问不到？

最常见原因是 selector 和 Pod label 不匹配，导致没有 EndpointSlice。其次是 targetPort 错、Pod 不 ready、应用没监听正确地址、NetworkPolicy 阻断。

### CrashLoopBackOff 是 Kubernetes 的错误吗？

通常不是。它表示容器启动后反复退出，Kubernetes 按策略重启并退避。根因多在应用日志、配置、依赖或资源限制。

### readinessProbe 和 livenessProbe 最大区别是什么？

readiness 决定是否接流量；liveness 决定是否重启容器。readiness 失败不会直接重启容器，liveness 失败会。

## 学习路线

第一阶段：对象模型与本地实验

- `apiVersion`、`kind`、`metadata`、`spec`、`status`。
- Namespace、labels、selector、annotations。
- `kubectl explain`。
- 在 kind/minikube 上完成 Deployment + Service 基础实验。

第二阶段：工作负载与发布

- Pod。
- Deployment、ReplicaSet、StatefulSet、DaemonSet、Job/CronJob。
- rollout、probes、requests/limits、QoS、优雅终止。
- 亲手制造 CrashLoopBackOff、ImagePullBackOff 和 rollout 卡住。

第三阶段：服务发现、配置和持久化

- Service、EndpointSlice、DNS、Ingress/Gateway 入门。
- ConfigMap、Secret、ServiceAccount。
- PV、PVC、StorageClass、CSI 与拓扑绑定。
- NetworkPolicy 基础实验。

第四阶段：控制面原理

- API 认证、鉴权、准入、etcd 持久化。
- resourceVersion、generation、status、SSA。
- List-Watch、Informer、WorkQueue 和 Reconcile。
- ownerReference、finalizer、garbage collection。
- 静态 Pod、Lease 和 leader election。

第五阶段：调度、弹性和节点

- Filter/Score/Bind、affinity、taint、topology spread、priority/preemption。
- PDB、HPA、VPA、Cluster Autoscaler。
- Node Lease、压力驱逐、QoS 和容量预留。

第六阶段：生产排障

- Pending。
- CrashLoopBackOff。
- ImagePullBackOff。
- OOMKilled。
- Service 不通。
- rollout 卡住。
- Node NotReady、PVC 挂载失败、API Server 变慢。
- 用事件、指标、日志、审计和网络流建立时间线。

第七阶段：高可用、安全和升级

- 多控制面、etcd 多数派、备份恢复和故障域。
- RBAC、Pod Security、Secret 加密、审计和供应链。
- 版本偏差、弃用 API、CNI/CSI 兼容、滚动升级和回滚边界。
- 节点、zone、控制面和 etcd 恢复演练。

第八阶段：AIOps 集成与面试表达

- kube-state-metrics。
- metrics-server。
- Prometheus scrape。
- Kubernetes Events、审计和 CNI 流量采集。
- Kubernetes runbook 自动化。
- 发布失败自动诊断。
- 对 30 秒、3 分钟和系统设计题分别录音复盘。

## 学习检查清单

- [ ] 我能解释 Kubernetes 的期望状态和控制循环。
- [ ] 我能画出 API Server、etcd、scheduler、controller、kubelet 的关系。
- [ ] 我能解释 Pod 为什么是最小调度单位。
- [ ] 我能解释 Deployment、ReplicaSet、Pod 的层级关系。
- [ ] 我能写一个最小 Deployment。
- [ ] 我能写一个 ClusterIP Service。
- [ ] 我能解释 Service selector 如何找到 Pod。
- [ ] 我能用 EndpointSlice 判断 Service 是否有后端。
- [ ] 我能解释 ConfigMap 和 Secret 的区别。
- [ ] 我能解释 requests 和 limits 对调度和运行的影响。
- [ ] 我能解释 readiness、liveness、startup probes。
- [ ] 我能用 `kubectl describe pod` 看 events。
- [ ] 我能用 `kubectl logs --previous` 查崩溃前日志。
- [ ] 我能排查 Pending、CrashLoopBackOff、ImagePullBackOff。
- [ ] 我能用 `kubectl rollout status/history/undo` 管发布。
- [ ] 我能把 Kubernetes 诊断命令写进 AIOps runbook。
- [ ] 我能讲清一次 API 请求的认证、鉴权、准入和持久化链路。
- [ ] 我能解释 resourceVersion、generation、observedGeneration 和 managedFields。
- [ ] 我能画出 List-Watch、Informer、缓存、工作队列和 Reconcile。
- [ ] 我能解释 ownerReference、finalizer 与三种删除传播策略。
- [ ] 我能解释 scheduler 的 Filter、Score、Bind 和抢占流程。
- [ ] 我能正确区分 affinity、taint、topology spread、PDB 和 PriorityClass。
- [ ] 我能解释 HPA、VPA、Cluster Autoscaler 的闭环和相互影响。
- [ ] 我能解释 Pod 优雅终止、EndpointSlice 摘流与 SIGTERM/SIGKILL。
- [ ] 我能沿 DNS、Service、EndpointSlice、CNI 和 conntrack 排查网络。
- [ ] 我能沿 PVC、StorageClass、CSI Controller/Node 排查挂载。
- [ ] 我能解释静态 Pod、Node Lease 和 controller/scheduler 选主。
- [ ] 我能设计 3 控制面 + 3/5 etcd 的高可用架构并说明权衡。
- [ ] 我能写出升级前检查、滚动步骤、验证项和回滚边界。
- [ ] 我能说明 RBAC、Pod Security、Secret 加密和审计基线。
- [ ] 我能从 API、etcd、controller、scheduler、kubelet、CNI、CSI 指标定位瓶颈。
- [ ] 我完成过 finalizer、服务中断、发布失败等故障注入并留下复盘。
- [ ] 我能在 3 分钟内回答“一个 Pod 是怎样创建出来的”。
- [ ] 我能按需求、控制面、节点、网络、存储、安全、可观测、升级设计生产集群。

## 面试题

1. Kubernetes 解决了 Docker 单机运行的哪些问题？
2. 什么是期望状态和实际状态？
3. Kubernetes 控制循环是什么？
4. kube-apiserver、etcd、scheduler、controller-manager、kubelet 分别负责什么？
5. Pod 是什么？为什么不是直接调度容器？
6. Deployment、ReplicaSet、Pod 的关系是什么？
7. Service 为什么需要 selector？
8. Service 的 `port` 和 `targetPort` 有什么区别？
9. ClusterIP、NodePort、LoadBalancer 有什么区别？
10. EndpointSlice 为空时你会怎么排查？
11. ConfigMap 和 Secret 有什么区别？
12. Secret 默认 base64 是不是加密？
13. requests 和 limits 分别影响什么？
14. Pod Pending 常见原因有哪些？
15. CrashLoopBackOff 怎么查？
16. ImagePullBackOff 怎么查？
17. readinessProbe 和 livenessProbe 有什么区别？
18. rollout 卡住时你会看哪些对象？
19. 为什么删除 Pod 后它会自动回来？
20. Kubernetes 在 AIOps 中能提供哪些故障证据？
21. 一次 `kubectl apply` 在 API Server 内经历哪些阶段？
22. resourceVersion 与 generation 有什么区别？
23. Informer 为什么需要本地缓存和 WorkQueue？
24. Watch 返回 410 Gone 时客户端应该怎样处理？
25. 为什么控制器 Reconcile 必须幂等？
26. ownerReference 和 finalizer 分别解决什么问题？
27. Server-Side Apply 的字段冲突意味着什么？
28. kube-apiserver 自己是 Pod 时由谁启动？
29. scheduler 的 Filter 和 Score 有什么区别？
30. taint/toleration 与 node affinity 有什么区别？
31. topology spread 与 pod anti-affinity 怎样选择？
32. PDB 为什么可能阻塞 drain，它又保护不了什么？
33. HPA、VPA 和 Cluster Autoscaler 怎样协同？
34. Pod 被删除时流量摘除和进程退出是什么顺序？
35. Node NotReady 后控制面怎样判断并处理？
36. Guaranteed Pod 是否绝对不会 OOM 或被驱逐？
37. Service ClusterIP 的数据包怎样到达跨节点 Pod？
38. `WaitForFirstConsumer` 为什么能避免存储拓扑冲突？
39. Secret 的 base64、静态加密和外部 KMS 有什么区别？
40. stacked etcd 与 external etcd 如何取舍？
41. 3 成员和 5 成员 etcd 分别能容忍几个故障？
42. API Server 全部不可用时，现有 Pod 和新 Pod 分别怎样？
43. Kubernetes minor 版本升级前为什么要扫描弃用 API？
44. APF 解决什么问题，遇到 429 怎样排查？
45. 怎样设计一个跨三个可用区的生产 Kubernetes 集群？

## 学习证据

完成本篇后，建议留下这些证据：

- 一个 `aiops-lab.yaml`，包含 Deployment 和 Service。
- 一份对象关系笔记：Deployment -> ReplicaSet -> Pod -> Service -> EndpointSlice。
- 一份 `kubectl describe pod` events 解读。
- 一份 CrashLoopBackOff 或 ImagePullBackOff 模拟排障记录。
- 一份 Service selector 错误导致 endpoints 为空的排障记录。
- 一个只读的 Kubernetes 诊断脚本，用于收集 Pod、Service、events、logs。
- 一张“API 请求 -> etcd -> Informer -> Reconcile”的控制链图。
- 一张“scheduler -> kubelet -> CRI/CNI/CSI -> ready endpoint”的 Pod 创建链图。
- 一份 finalizer 卡住并恢复的实验记录。
- 一份 Pending 场景树，覆盖资源、taint、affinity、PVC 和拓扑约束。
- 一份 Service 偶发超时的分层排障 runbook。
- 一份三控制面、三 etcd、跨故障域的架构图和容量假设。
- 一份 Kubernetes 升级检查表、回滚边界和 etcd 恢复演练记录。
- 一份最小 RBAC、Pod Security、NetworkPolicy 和 Secret 加密基线。
- 一段 3 分钟“Pod 创建全流程”录音及连续追问复盘。
- 一个可提交到 GitHub 的 `kubernetes-interview-lab/`，包含 YAML、脚本、故障注入步骤、预期结果和复盘。
