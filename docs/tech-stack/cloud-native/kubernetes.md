# Kubernetes

> 目标：能理解 Kubernetes 为什么是容器编排系统，能按官方概念地图理解控制面、节点、Pod、Deployment、Service、ConfigMap、Secret、Namespace、调度、资源、健康检查和排障，能写出最小可运行的 Deployment + Service，并能用 `kubectl` 找到 Pod 为什么 Pending、CrashLoopBackOff、ImagePullBackOff、Service 不通。

## 官方资料

- [Kubernetes Concepts](https://kubernetes.io/docs/concepts/)
- [Kubernetes Components](https://kubernetes.io/docs/concepts/overview/components/)
- [Cluster Architecture](https://kubernetes.io/docs/concepts/architecture/)
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
- [Debug Pods](https://kubernetes.io/docs/tasks/debug/debug-application/debug-pods/)
- [Debug Services](https://kubernetes.io/docs/tasks/debug/debug-application/debug-service/)
- [kubectl reference](https://kubernetes.io/docs/reference/kubectl/)
- [kubectl quick reference](https://kubernetes.io/docs/reference/kubectl/quick-reference/)

说明：本文是基于 Kubernetes 官方文档整理的原创中文教程，不复制官方全文。Kubernetes 文档会随版本变化，本文写作时官方 quick reference 指向 Kubernetes v1.36；真实生产环境请先用 `kubectl version` 确认集群版本，再查看对应版本的官方文档。

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

## 学习边界

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

第一阶段必须掌握：

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

暂时可以先不深挖：

- 自定义控制器开发。
- CRD 和 Operator 源码。
- kube-scheduler 插件框架。
- CNI、CSI、CRI 的底层实现。
- API server admission chain 全流程。
- 大规模集群性能调优。
- 多集群、服务网格、Gateway API 深水区。

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

## 面试怎么讲

Kubernetes 是声明式容器编排平台。用户通过 API 对象声明期望状态，比如 Deployment 期望 3 个副本，Service 期望给一组 Pod 提供稳定入口。API Server 接收对象并存入 etcd，controller 持续对比期望状态和实际状态，scheduler 给新 Pod 选择 Node，kubelet 在 Node 上通过容器运行时启动容器并上报状态。排障时我会先看对象关系：Deployment 到 ReplicaSet 到 Pod，再看 Pod events、logs、previous logs、readiness/liveness、资源 requests/limits、Service selector 和 EndpointSlice，最后结合 Node、CNI、DNS、Ingress 判断链路问题。

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

第一阶段：对象模型

- `apiVersion`、`kind`、`metadata`、`spec`、`status`。
- Namespace、labels、selector、annotations。
- `kubectl explain`。

第二阶段：工作负载

- Pod。
- Deployment。
- ReplicaSet。
- rollout。
- probes。
- requests/limits。

第三阶段：服务发现和配置

- Service。
- EndpointSlice。
- DNS。
- ConfigMap。
- Secret。
- Ingress 入门。

第四阶段：排障

- Pending。
- CrashLoopBackOff。
- ImagePullBackOff。
- OOMKilled。
- Service 不通。
- rollout 卡住。

第五阶段：AIOps 集成

- kube-state-metrics。
- metrics-server。
- Prometheus scrape。
- Pod events 采集。
- Kubernetes runbook 自动化。
- 发布失败自动诊断。

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

## 学习证据

完成本篇后，建议留下这些证据：

- 一个 `aiops-lab.yaml`，包含 Deployment 和 Service。
- 一份对象关系笔记：Deployment -> ReplicaSet -> Pod -> Service -> EndpointSlice。
- 一份 `kubectl describe pod` events 解读。
- 一份 CrashLoopBackOff 或 ImagePullBackOff 模拟排障记录。
- 一份 Service selector 错误导致 endpoints 为空的排障记录。
- 一个只读的 Kubernetes 诊断脚本，用于收集 Pod、Service、events、logs。
