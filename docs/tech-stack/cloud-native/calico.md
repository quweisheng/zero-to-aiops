# Calico 深讲

> 学习目标：从零理解 Kubernetes 网络模型、CNI、Calico IPAM、Felix、BGP、IP-in-IP、VXLAN、NetworkPolicy、GlobalNetworkPolicy、Typha 和路由反射器，能搭建 Calico 学习集群、完成默认拒绝与精确放行实验，能沿 Pod 网卡、路由、隧道、BGP、策略和 DNS 链路排查故障，并能完成生产网络选型和大厂面试连续追问。

## 官方资料

- [Calico Open Source 文档](https://docs.tigera.io/calico/latest/about/)
- [Kubernetes 快速入门](https://docs.tigera.io/calico/latest/getting-started/kubernetes/quickstart)
- [组件架构](https://docs.tigera.io/calico/latest/reference/architecture/overview)
- [选择网络模式](https://docs.tigera.io/calico/latest/networking/determine-best-networking)
- [配置 BGP](https://docs.tigera.io/calico/latest/networking/configuring/bgp)
- [IPPool 资源](https://docs.tigera.io/calico/latest/reference/resources/ippool)
- [Kubernetes NetworkPolicy](https://docs.tigera.io/calico/latest/network-policy/get-started/kubernetes-policy/)
- [Calico NetworkPolicy](https://docs.tigera.io/calico/latest/reference/resources/networkpolicy)
- [默认拒绝策略](https://docs.tigera.io/calico/latest/network-policy/get-started/kubernetes-default-deny)
- [故障排查命令](https://docs.tigera.io/calico/latest/operations/troubleshoot/commands)
- [Calico 指标](https://docs.tigera.io/calico/latest/operations/monitor/monitor-component-metrics)

截至 2026-07-17，官方 latest 文档标识 Calico Open Source 3.32。实验固定版本是为了可复现，生产部署前必须重新核对 Kubernetes 版本、Linux 内核、安装方式和数据平面兼容矩阵。

## 官方知识地图

```text
Calico
  -> Installation
     -> Tigera Operator
     -> Installation / APIServer CR
  -> Networking
     -> CNI
     -> IPAM / IPPool / block affinity
     -> BGP / route reflector
     -> IP-in-IP / VXLAN / no overlay
     -> MTU / NAT outgoing
  -> Data plane
     -> Felix
     -> Linux routes and ACLs
     -> iptables or eBPF mode
  -> Policy
     -> Kubernetes NetworkPolicy
     -> Calico NetworkPolicy
     -> GlobalNetworkPolicy / tiers
     -> host endpoints
  -> Scale
     -> Typha
     -> route reflector
  -> Operations
     -> component health
     -> metrics
     -> troubleshooting
     -> upgrades
```

## 场景开场

一个新 Pod 已经是 `Running`，但访问另一个 Node 上的 Service 一直超时。应用日志没有报错，Service 也有 EndpointSlice。有人准备重启 kube-proxy，有人怀疑 CoreDNS，还有人说“把 NetworkPolicy 全删了试试”。

如果集群使用 Calico，问题可能出在完全不同的层：Pod 没拿到地址、Felix 没把路由写进内核、BGP 邻居断开、VXLAN 端口被防火墙拦截、MTU 导致大包丢失，或者策略 selector 没匹配到预期工作负载。

Calico 排障的关键不是背组件名，而是能画出一个包从源 Pod 到目标 Pod 的路径，并逐段找证据。

## 一句话人话版

Calico 给 Pod 分配地址、把跨节点路由写进网络，并用标签驱动的策略决定哪些工作负载可以互相通信。

## 小白可能会问

- Kubernetes 已经有 Service，为什么还要 CNI？
- Calico 是网络插件还是安全产品？
- BGP、IP-in-IP、VXLAN 是三选一吗？
- 没写 NetworkPolicy 时为什么默认全通？
- `calico-node` Running 为什么 Pod 网络仍可能不通？
- Calico 和 Cilium 到底该怎么选？

## 为什么要学

Kubernetes 只规定网络模型和 CNI 接口，不负责为所有环境实现具体 Pod 网络。Calico 是常见的 Kubernetes 网络和网络策略实现，平台岗位会考：

- Pod IP 从哪里来，冲突或耗尽怎么查。
- 跨 Node 包怎样到达，什么时候封装，什么时候路由。
- BGP full mesh 为什么到规模后要 route reflector。
- NetworkPolicy 的隔离语义、方向和 selector。
- MTU、conntrack、NAT 和防火墙如何影响数据路径。
- CNI 故障为什么会让 Pod 卡在 `ContainerCreating`。

## Calico 是什么

Calico 是面向 Kubernetes、云、虚拟机和裸金属环境的网络、网络安全和可观测平台。开源版常见能力包括：

- CNI：在 Pod 创建和删除时配置网络。
- IPAM：从 IPPool 中分配和回收 Pod IP。
- 路由：通过 BGP、隧道或底层网络实现跨节点可达。
- Policy：执行 Kubernetes 和 Calico 网络策略。
- 节点网络保护：通过 HostEndpoint 管理主机接口策略。

它不是 Service DNS，也不是 Ingress Controller。Service 负责稳定服务入口，CoreDNS 负责名字解析，Calico 主要负责“包能否从这里走到那里，以及是否被允许”。

## Kubernetes 网络前置知识

Kubernetes 网络模型通常要求：

1. 每个 Pod 有自己的 IP。
2. Pod 之间在不做应用层 NAT 的前提下可通信。
3. Node 能与 Pod 通信。
4. Pod 看到的自身 IP 与其他 Pod 看到的一致。

CNI 是 Container Network Interface。kubelet 通过容器运行时触发 CNI 插件，为 Pod network namespace 配置接口、IP、路由和必要规则。

```text
Pod sandbox 创建
  -> 容器运行时调用 Calico CNI
  -> Calico IPAM 分配 IP
  -> 创建 veth pair
  -> 一端进入 Pod namespace
  -> 一端留在 Node
  -> 写路由 / policy
  -> 返回网络配置
  -> Pod 进入 Running
```

如果 CNI ADD 失败，容器可能还没真正进入可用网络状态，`kubectl logs` 也未必有应用日志。先看 Pod events、kubelet 和 CNI 日志。

## 核心组件

### Tigera Operator

- 是什么：管理 Calico 安装和升级的 Operator。
- 为什么需要：把 DaemonSet、Deployment、CRD 和配置收敛成声明式资源。
- 怎么工作：监听 `Installation` 等自定义资源，创建并维护实际组件。
- 怎么看：`kubectl get tigerastatus`、查看 operator 日志。
- 坏了怎么查：CRD 是否存在、Installation 状态、镜像拉取、权限和版本兼容。

### calico/node

`calico/node` 通常以 DaemonSet 跑在每个节点，承载 Felix 和按网络模式需要的路由组件。

坏了的影响：新 Pod 网络配置失败、策略不更新、路由不收敛，但已有内核规则可能让部分旧连接暂时继续工作。

### Felix

- 是什么：每个节点上的 Calico 数据面 agent。
- 为什么需要：把 API 中的 endpoint、IPPool 和 policy 变成 Linux 内核中的接口、路由和 ACL。
- 怎么工作：监听 datastore 更新，计算本节点期望数据面并编程内核。
- 怎么看：Felix 日志、Prometheus 指标、`ip route`、规则或 eBPF 状态。
- 坏了怎么查：datastore 连接、resync、内核编程错误、接口和规则数量。

### calico-kube-controllers

它在 Kubernetes 对象和 Calico 数据模型之间做控制循环，例如同步 Node、回收工作负载 endpoint 和管理 IPAM 相关状态。不要把它和 kube-controller-manager 混为一谈。

### Typha

- 是什么：位于 datastore 与大量 Felix 客户端之间的代理和缓存层。
- 为什么需要：每个节点都直接 List-Watch API 会放大控制面连接和事件扇出。
- 怎么工作：Typha 复用上游连接、缓存和去重更新，再分发给多个 Felix。
- 什么时候用：官方架构说明指出，100+ 节点规模中 Typha 对降低 datastore 和 Felix 压力很重要。
- 坏了怎么查：Typha 副本、连接数、Felix 到 Typha 的连接和 API Server 压力。

### BIRD、confd 和路由反射器

在 BGP 数据平面中，BIRD 负责 BGP 路由协议，confd 根据 datastore 状态生成 BIRD 配置。路由反射器用于减少大规模节点 full mesh 的邻居数量。

不同版本和数据平面模式的组件会变化，排障前先确认当前安装实际启用了什么，不要套用旧架构图。

## IPAM、IPPool 和 block affinity

IPAM 是 IP Address Management，地址管理。Calico 从 IPPool 为 Pod 分配 IP，并通常把地址按 block 划给节点，减少每次分配都访问全局状态的开销。

```text
IPPool 192.168.0.0/16
  -> block 192.168.0.0/26 归 node-a
  -> block 192.168.0.64/26 归 node-b
  -> Pod 从本节点 block 取 IP
```

关键对象：

| 对象/字段 | 作用 | 常见风险 |
|---|---|---|
| `IPPool.cidr` | Pod 地址池 | 与宿主机、VPN、ServiceCIDR 冲突 |
| `blockSize` | 每个分配块大小 | 太大浪费，太小增加 block 数 |
| `natOutgoing` | Pod 出集群时是否 SNAT | 回程路由或源地址审计不符合预期 |
| `ipipMode` | IP-in-IP 使用范围 | 防火墙未放通协议 4 |
| `vxlanMode` | VXLAN 使用范围 | UDP 4789、MTU 或硬件卸载问题 |
| `nodeSelector` | 哪些节点使用该池 | 节点标签变化导致无可用池 |

### IP 地址耗尽怎么查

1. 看 Pod events 是否出现 IPAM 分配失败。
2. `calicoctl get ippool -o wide` 看池和模式。
3. `calicoctl ipam show --show-blocks` 看 block 和使用量。
4. 检查是否存在已删除工作负载残留 handle。
5. 扩池前确认 CIDR 不与现有网络重叠，并评估路由和防火墙。

## 三类跨节点网络模式

### 无 Overlay 的 BGP 路由

```text
Pod A
  -> Node A 路由表
  -> BGP 学到目标 PodCIDR 下一跳
  -> 物理网络
  -> Node B
  -> Pod B
```

优点：没有额外隧道头，路径清晰，Pod 地址可成为底层网络中的可路由地址。

要求：底层网络必须知道 PodCIDR 路由，或节点/ToR 之间建立适当 BGP。云网络不允许 BGP 时不能硬套。

### IP-in-IP

把原始 IP 包封装进另一个 IP 包。常用于底层网络不知道 PodCIDR 的环境。

优点：部署要求相对低。代价：封装开销、MTU 下降，且底层网络必须允许 IP protocol 4。

### VXLAN

把二层帧封装进 UDP，Calico 常用 UDP 4789。底层只需 Node IP 可达，不需要理解 PodCIDR。

优点：跨不同网络环境更容易。代价：UDP 封装、MTU 和排障复杂度。

### CrossSubnet

同子网节点走原生路由，跨子网时才封装，减少不必要开销。但前提是节点子网识别和路由设计正确。

## BGP：节点如何交换 Pod 路由

BGP 是 Border Gateway Protocol，边界网关协议。可以把每个 Calico 节点理解成一台发布本节点 Pod 网段的路由器。

小集群 full mesh：

```text
node-a <-> node-b
node-a <-> node-c
node-b <-> node-c
```

节点数增长时，邻居关系约按平方增长。路由反射器把拓扑改成：

```text
nodes
  -> route reflectors
  -> other nodes / ToR routers
```

### BGP 不通怎么查

```bash
calicoctl node status # 查看 BGP peer 是否 Established
calicoctl get bgppeer -o wide # 查看显式邻居
calicoctl get bgpconfiguration default -o yaml # 查看 AS 和 mesh 设置
ip route # 确认目标 Pod 网段路由是否进入内核
```

常见根因：179/TCP 被拦、错误 AS、地址选择错误、route reflector 配置缺失、关闭 node-to-node mesh 后没有替代邻居。

## 一个包怎样跨节点

以 VXLAN 模式为例：

```text
源 Pod eth0
  -> veth 对端 cali*
  -> Felix 编程的 policy
  -> Node 路由查找
  -> VXLAN 封装
  -> 底层网络按 Node IP 转发
  -> 目标 Node 解封装
  -> 目标 Node policy
  -> 目标 cali* 接口
  -> 目标 Pod eth0
```

逐段证据：

```bash
kubectl get pod -o wide # 确认 Pod IP 和 Node
ip addr show # 看 cali*、tunl0 或 vxlan.calico
ip route get <TARGET_POD_IP> # 看内核实际选择的下一跳和接口
calicoctl get wep -A -o wide # 看 workload endpoint
tcpdump -ni any host <TARGET_POD_IP> # 观察明文或封装包
```

抓包要注意敏感数据，生产执行前确认权限、范围、时长和文件清理。

## MTU：小包通、大包不通

Overlay 会增加包头。如果 Pod MTU 没减去封装开销，超过底层 MTU 的包可能分片或被丢弃，常表现为：

- ping 小包正常，HTTPS 或镜像拉取卡住。
- 同节点通信正常，跨节点异常。
- 某些云网络或 VPN 路径才失败。

排查：

```bash
ip link show # 看 Pod veth、隧道和物理网卡 MTU
tracepath <TARGET_IP> # 探测路径 MTU，环境支持时使用
ping -M do -s 1400 <TARGET_IP> # 禁止分片测试，逐步调整大小
```

修改 MTU 前先确认底层、Overlay、WireGuard 和云网络的全部开销，避免只改 Pod 端。

## NetworkPolicy 的隔离语义

Kubernetes 默认没有策略选择 Pod 时，该 Pod 对相应方向通常是允许的。一旦有 NetworkPolicy 在某方向选择它，该方向进入隔离，只允许所有适用策略规则的并集。

```text
没有 policy 选中 Pod
  -> 默认允许

Ingress policy 选中 Pod
  -> 该 Pod ingress 被隔离
  -> 只允许规则并集

Egress policy 选中 Pod
  -> 该 Pod egress 被隔离
  -> DNS 也可能被一起阻断
```

策略是 additive，不是按 YAML 顺序“第一条命中就结束”。Calico 自定义策略还提供 order、GlobalNetworkPolicy 和 tiers 等更强治理能力，要区分 Kubernetes API 和 Calico API 的语义。

## Kubernetes Policy 与 Calico Policy

| 能力 | Kubernetes NetworkPolicy | Calico NetworkPolicy / GlobalNetworkPolicy |
|---|---|---|
| 范围 | namespace 内 | namespace 或全局 |
| selector | Pod/Namespace selector | Calico selector 表达式更丰富 |
| 规则顺序 | 允许规则并集 | 支持 order、action 和 tiers |
| 主机接口 | 不覆盖 | HostEndpoint 可覆盖 |
| 动作 | Allow 语义 | 可按版本支持 Allow/Deny/Log/Pass |
| 跨团队治理 | 能力较基础 | Global policy 和 tier 更适合平台治理 |

生产策略建议：

1. 先盘点真实流量和 DNS、监控、镜像、时间同步等基础依赖。
2. 在测试环境先默认拒绝，再逐项放行。
3. 平台、安全、应用策略分层管理。
4. 变更保留回滚清单，避免一条全局拒绝切断控制面。

## eBPF 数据平面边界

Calico 可以按版本和环境选择基于 Linux 规则的传统数据平面或 eBPF 数据平面。eBPF 模式可提供不同的转发和策略实现，并可能替代 kube-proxy 的部分能力。

不要把“启用 eBPF”理解成自动更快。上线前要验证：

- 内核和发行版支持。
- Service、NodePort、DSR、host network 等行为。
- 监控和排障工具变化。
- 与现有 kube-proxy、云 CNI、服务网格和安全代理的兼容性。
- 回滚路径是否经过演练。

## 安装实验：kind + Calico 3.32

### 前置条件

- Docker Engine 或 Docker Desktop。
- `kind`、`kubectl`。
- `calicoctl`。请先按[官方安装说明](https://docs.tigera.io/calico/latest/operations/calicoctl/install)安装与集群版本一致的客户端；它用于查看 IPPool、IPAM、BGP 和 Calico 策略资源。
- 至少 4 CPU、8 GB 可用内存更稳妥。
- PodCIDR `192.168.0.0/16` 不与本机 VPN 或局域网冲突。

创建 `kind-calico.yaml`：

```yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
  - role: control-plane
  - role: worker
  - role: worker
networking:
  disableDefaultCNI: true  # 先不安装 kindnet，让 Calico 接管 CNI
  podSubnet: 192.168.0.0/16 # 必须与后面的 Calico IPPool 一致且不与本地网络冲突
```

启动：

```bash
kind create cluster --name calico-lab --config kind-calico.yaml # 节点暂时 NotReady 是正常现象
kubectl create -f https://raw.githubusercontent.com/projectcalico/calico/v3.32.1/manifests/tigera-operator.yaml # 安装 operator 和 CRD
kubectl create -f https://raw.githubusercontent.com/projectcalico/calico/v3.32.1/manifests/custom-resources.yaml # 创建默认 Installation 和 IPPool
watch kubectl get tigerastatus # 等 apiserver、calico 等状态 Available=True
kubectl get nodes -o wide # Calico 就绪后节点应变为 Ready
```

如果没有成功：

1. `kubectl get pods -A -o wide` 看哪个组件未启动。
2. `kubectl describe tigerastatus calico` 看 operator 状态。
3. `kubectl logs -n tigera-operator deploy/tigera-operator` 看渲染失败原因。
4. PodCIDR 是否与本地网络冲突。
5. Docker 虚拟机是否有足够资源。

## 基础实验：默认拒绝和精确放行

### 创建应用

```bash
kubectl create namespace policy-lab
kubectl -n policy-lab create deployment web --image=nginx:1.27-alpine
kubectl -n policy-lab expose deployment web --port=80
kubectl -n policy-lab create deployment client --image=busybox:1.36 -- sleep 3600
kubectl -n policy-lab rollout status deployment/web
kubectl -n policy-lab rollout status deployment/client
kubectl -n policy-lab exec deploy/client -- wget -qO- --timeout=3 http://web # 应返回 NGINX 页面
```

### 默认拒绝 Ingress 和 Egress

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny
  namespace: policy-lab
spec:
  podSelector: {}  # 选中 namespace 内所有 Pod
  policyTypes:
    - Ingress      # 隔离入方向
    - Egress       # 隔离出方向，包括 DNS
```

应用后再次 `wget`，预期超时。这是策略生效，不是 Service 消失。

### 放行 DNS

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-dns
  namespace: policy-lab
spec:
  podSelector: {}
  policyTypes:
    - Egress
  egress:
    - to:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: kube-system
          podSelector:
            matchLabels:
              k8s-app: kube-dns
      ports:
        - protocol: UDP
          port: 53
        - protocol: TCP
          port: 53
```

不同发行版的 DNS Pod 标签可能不同，先执行 `kubectl -n kube-system get pod --show-labels` 确认。

### 只允许 client 访问 web

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-client-to-web
  namespace: policy-lab
spec:
  podSelector:
    matchLabels:
      app: web
  policyTypes:
    - Ingress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: client
      ports:
        - protocol: TCP
          port: 80
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-client-egress-web
  namespace: policy-lab
spec:
  podSelector:
    matchLabels:
      app: client
  policyTypes:
    - Egress
  egress:
    - to:
        - podSelector:
            matchLabels:
              app: web
      ports:
        - protocol: TCP
          port: 80
```

应用后，`client` 应重新访问成功。再创建一个不同标签的 Pod，它不应访问 web。

## 故障实验：selector 写错导致策略不放行

把允许策略中的 `app: client` 故意改成 `app: cllent`。现象是：

- Pod Running。
- Service 有 EndpointSlice。
- DNS 可能正常。
- TCP 访问仍超时。

排查：

```bash
kubectl -n policy-lab get pod --show-labels # 确认真实标签
kubectl -n policy-lab describe networkpolicy allow-client-to-web # 看 selector 和端口
calicoctl get wep -n policy-lab -o wide # 看 endpoint 标签和 IP
calicoctl get networkpolicy -n policy-lab -o yaml # 看 Calico 实际接收的策略
```

修正 selector 后重新验证。复盘时记录：为什么 Service、DNS、Pod 状态都正常，仍然不能证明网络策略允许流量。

## 常用命令字典

| 命令 | 作用 | 正常结果 | 异常先看 |
|---|---|---|---|
| `kubectl get tigerastatus` | 看 operator 汇总状态 | Available=True | operator 和对应组件日志 |
| `kubectl get pods -n calico-system -o wide` | 看 Calico 组件分布 | 每节点一个 calico-node | DaemonSet events、Node |
| `calicoctl get nodes -o wide` | 看 Calico Node | 与 K8s Node 对应 | 名称和地址自动检测 |
| `calicoctl get ippool -o wide` | 看地址池和封装模式 | 有可用池 | CIDR、disabled、selector |
| `calicoctl ipam show --show-blocks` | 看地址使用 | block 分配合理 | 耗尽和残留 handle |
| `calicoctl node status` | 看 BGP 邻居 | Established | 179/TCP、AS、peer IP |
| `calicoctl get wep -A -o wide` | 看工作负载端点 | Pod/IP/Node 对应 | CNI 和 endpoint 同步 |
| `calicoctl get gnp -o wide` | 看全局策略 | order/selector 可解释 | 高优先级 Deny |
| `ip route get <pod-ip>` | 看内核转发决策 | 指向正确接口/下一跳 | 路由缺失或黑洞 |
| `tcpdump -ni any` | 看包到达哪一段 | 请求和响应成对 | 单向流、封装、防火墙 |

## 在 AIOps 中的作用

Calico 为 AIOps 提供四类证据：

- **组件健康**：Felix、Typha、operator、kube-controllers 的可用性。
- **网络状态**：IPAM 使用率、BGP session、路由、endpoint 数。
- **策略状态**：策略数量、selector、数据面编程错误、拒绝流量。
- **关联拓扑**：Pod -> Node -> IPPool -> tunnel/BGP peer -> 目标 Pod。

重点指标方向：

| 指标方向 | 告警意义 |
|---|---|
| Felix dataplane failure | 内核规则或路由编程失败 |
| Felix resync | datastore 重连或大规模重同步 |
| active local endpoints | 与节点 Pod 数对比发现不同步 |
| IPAM allocations | 地址池接近耗尽 |
| BGP session state | 跨节点路由可能中断 |
| Typha connections | 大规模节点与 Typha 容量 |
| policy rule/drop telemetry | 策略误拦和攻击面 |

指标名按版本和启用组件变化，接入时从实际 `/metrics` 建立基线。

## 常见故障排查

### Pod 卡在 ContainerCreating

- 检查 events 中 `FailedCreatePodSandBox`。
- 看 kubelet、容器运行时和 Calico CNI 日志。
- 检查 IPPool、IPAM、CNI 配置文件和 API 连接。

### 同节点通，跨节点不通

- 判断 BGP、IP-in-IP 或 VXLAN 模式。
- 检查目标 Pod 路由和隧道接口。
- 检查 179/TCP、protocol 4 或 4789/UDP。
- 对比 Node IP 自动检测是否选错网卡。

### 小包通，大包不通

- 检查物理、Pod 和隧道 MTU。
- 检查 PMTU ICMP 是否被拦。
- 检查 WireGuard、云网络或 VPN 额外开销。

### Service 有 endpoint 但访问超时

- 先用 Pod IP 绕过 Service 测试。
- 查 NetworkPolicy 和 GlobalNetworkPolicy。
- 查 kube-proxy/eBPF Service 数据面。
- 抓包区分请求没到还是响应回不来。

### DNS 被默认拒绝

- 检查 Egress policy 是否放行 UDP/TCP 53。
- 确认 kube-dns Pod 实际标签和 namespace。
- 不要把 DNS 超时误判成 Service 路由故障。

### BGP 邻居反复断开

- 检查 TCP 179、AS、peer 地址、BIRD 日志。
- 检查节点 CPU、网络抖动和 route reflector 容量。
- 变更 mesh 前确认替代 peer 已就绪。

### IPAM 耗尽

- 看 IPPool、block、节点数量和 Pod 峰值。
- 清理残留前先确认工作负载真的不存在。
- 扩池要同步评估底层路由、NAT 和安全策略。

## 生产设计题

为 500 节点、三个可用区的自建 Kubernetes 集群设计 Calico：

回答至少覆盖：

- PodCIDR、ServiceCIDR、宿主机和办公 VPN 的冲突检查。
- 选择 BGP、VXLAN、IP-in-IP 或 CrossSubnet 的理由。
- 节点 full mesh 是否需要 route reflector。
- Typha 副本、反亲和和容量。
- IPPool 分区、blockSize、扩容余量和回收。
- MTU 和底层网络端口。
- 默认拒绝、平台/安全/应用 policy 分层。
- 监控、流量证据和故障演练。
- operator 升级、数据平面滚动和回滚。

## 面试怎么讲

### 30 秒回答

Calico 是 Kubernetes 常用 CNI 和网络策略实现。CNI 在 Pod 创建时配置接口和 IP，IPAM 从 IPPool 分配地址，Felix 把 endpoint、路由和 policy 编程到 Linux 数据面；跨节点可以用 BGP 原生路由、IP-in-IP 或 VXLAN。排障我会先确定 Pod IP、Node 和数据平面模式，再沿接口、路由、隧道/BGP、策略和 DNS 逐段验证。

### 3 分钟回答

先讲组件：operator 管安装，calico/node 跑在每个节点，Felix 负责数据面，kube-controllers 做对象同步，大规模用 Typha 降低 API 压力，BGP 模式还会有 BIRD 和 route reflector。再讲包路径：源 Pod 从 veth 出来，经过策略，按内核路由进入原生网络或隧道，目标节点解封装并再次执行策略。最后讲生产取舍：Overlay 易部署但有封装和 MTU 成本；BGP 路由性能和可观测性好，但要求底层支持。策略上线要先观测、分层、默认拒绝并保留回滚，不能直接下全局 Deny。

## 核心面试题与递进追问

### 1. CNI 在什么时候被调用？

参考答案：kubelet 通过容器运行时创建 Pod sandbox，运行时按 CNI 配置调用插件 ADD；插件分配 IP、配置 network namespace、veth 和路由。删除 Pod 时调用 DEL 回收资源。

追问：CNI 失败时为什么 Pod 不是 CrashLoopBackOff？

回答要点：应用容器可能尚未成功创建，失败发生在 sandbox 网络阶段，通常表现为 `FailedCreatePodSandBox` 和 `ContainerCreating`。

### 2. BGP 和 VXLAN 怎么选？

参考答案：底层可路由 PodCIDR并允许 BGP 时可用原生路由；底层只保证 Node IP 可达时 VXLAN 更容易部署。选择要比较封装开销、MTU、网络团队能力、云限制和排障成本。

### 3. NetworkPolicy 是按顺序覆盖吗？

参考答案：Kubernetes NetworkPolicy 是 additive，选中 Pod 后该方向允许规则取并集，没有显式 Deny 顺序。Calico 自定义策略有 order、action 和 tier，需要区分 API 语义。

### 4. 为什么路由反射器能提升规模？

参考答案：full mesh 每个节点与大量节点建 BGP 邻居，连接和路由更新按平方增长。route reflector 集中反射路由，减少每节点邻居数；但反射器本身要高可用和容量设计。

### 5. Pod 能解析 Service 但连接超时，怎么查？

参考答案：DNS 成功只证明名字解析。继续看 Service/EndpointSlice、直接访问 Pod IP、源/目标 NetworkPolicy、Service 数据面、跨节点路由/隧道、目标监听和回程路径。

### 6. Calico 和 Cilium 的核心差异？

参考答案：两者都能提供 CNI 和 policy。Calico 强项包括成熟的 BGP/IPAM/多数据平面和策略体系；Cilium 以 eBPF、身份策略、Service 加速和 Hubble 可观测为核心。不能只按“谁更快”选，要看内核、底层网络、团队能力、功能、规模、迁移和排障体系。

## 学习检查清单

- [ ] 能解释 Kubernetes 网络模型和 CNI 调用时机。
- [ ] 能画出 Calico 跨节点包路径。
- [ ] 能解释 Felix、IPAM、Typha、BIRD 和 route reflector。
- [ ] 能比较 BGP、IP-in-IP、VXLAN 和 CrossSubnet。
- [ ] 能解释 IPPool、block affinity 和地址耗尽。
- [ ] 能解释 Kubernetes policy 的隔离和并集语义。
- [ ] 能区分 Kubernetes、Calico 和 GlobalNetworkPolicy。
- [ ] 能完成默认拒绝和精确放行实验。
- [ ] 能排查 CNI sandbox、BGP、MTU、DNS 和 policy 故障。
- [ ] 能给出大规模集群的网络、容量、安全和升级方案。

## 清理实验

```bash
kubectl delete namespace policy-lab # 删除策略实验资源
kind delete cluster --name calico-lab # 删除整个学习集群
```

## 学习证据

- `kind-calico.yaml` 和安装版本记录。
- 一张 Pod 跨节点数据路径图。
- 默认拒绝、DNS 放行和应用放行策略 YAML。
- 一份 selector 写错的故障注入复盘。
- `calicoctl node status`、IPAM 和路由的脱敏记录。
- 一份 500 节点 Calico 架构设计和回滚方案。

## 本文边界与下一步

本文覆盖 Calico Open Source 3.32 的 Kubernetes 主线，不展开企业版全部流量分析、多集群商业能力、BIRD 源码和 eBPF 程序实现。下一步学习 [Kubernetes](./kubernetes.md)、[Cilium](./cilium.md)、[etcd](./etcd.md) 和 [网络基础](../foundation/networking.md)，把控制面状态、Linux 转发和策略证据串成端到端排障能力。
