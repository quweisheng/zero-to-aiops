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
- [Calico 3.32.1 发布](https://github.com/projectcalico/calico/releases/tag/v3.32.1)
- [Calico 兼容要求](https://docs.tigera.io/calico/latest/getting-started/kubernetes/requirements)
- [组件版本](https://docs.tigera.io/calico/latest/reference/component-versions)

截至 2026-08-14，当前稳定补丁为 Calico Open Source 3.32.1，官方 3.32 测试 Kubernetes 1.34、1.35、1.36，并要求 Linux kernel 5.10 或受支持的等价 backport。实验固定版本是为了可复现，生产部署前仍须核对托管平台、发行版、Windows 节点、安装方式和数据平面兼容矩阵。

## 官方知识地图

```text
Calico（容器网络与网络策略项目）
  -> Installation（安装）
     -> Tigera Operator（安装维护控制器）
     -> Installation / APIServer CR（安装/接口服务自定义对象）
  -> Networking（联网）
     -> CNI（容器网络接口）
     -> IPAM / IPPool / block affinity（地址管理/地址池/块归属）
     -> BGP / route reflector（路由协议/路由反射器）
     -> IP-in-IP / VXLAN / no overlay（两种封装方式/不封装）
     -> MTU / NAT outgoing（最大传输单元/出站地址转换）
  -> Data plane（实际转发数据面）
     -> Felix（节点规则执行代理）
     -> Linux routes and ACLs（路由与访问控制表）
     -> iptables or eBPF mode（传统规则或内核可编程模式）
  -> Policy（网络策略）
     -> Kubernetes NetworkPolicy（标准网络策略）
     -> Calico NetworkPolicy（Calico 扩展策略）
     -> GlobalNetworkPolicy / tiers（全局策略/策略层级）
     -> host endpoints（主机端点）
  -> Scale（规模扩展）
     -> Typha（状态分发缓存）
     -> route reflector（路由反射器）
  -> Operations（运维）
     -> component health（组件健康）/ metrics（指标）
     -> troubleshooting（排障）/ upgrades（升级）
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
IPPool（地址池）192.168.0.0/16
  -> block（地址块）192.168.0.0/26 归 node-a（节点 A）
  -> block（地址块）192.168.0.64/26 归 node-b（节点 B）
  -> Pod（容器组）从本节点 block（地址块）取 IP（网络地址）
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
Pod A（源容器组）
  -> Node A（源节点）路由表
  -> BGP（边界网关路由协议）学到目标 PodCIDR（容器组地址段）下一跳
  -> 物理网络
  -> Node B（目标节点）
  -> Pod B（目标容器组）
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
node-a（节点甲） <-> node-b（节点乙）
node-a（节点甲） <-> node-c（节点丙）
node-b（节点乙） <-> node-c（节点丙）
```

节点数增长时，邻居关系约按平方增长。路由反射器把拓扑改成：

```text
nodes（计算节点）
  -> route reflectors（路由反射器，传播路由而非集中转发业务包）
  -> other nodes / ToR routers（其他节点 / 机架顶端路由设备）
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

下面的 `'<TARGET_POD_IP>'` 是目标实验 Pod 的 IP 占位符；执行前把整个尖括号内容换成已核对的地址并保留引号。后文 `'<TARGET_IP>'` 同样需要替换为授权探测目标，不能直接照抄；引号防止 Shell 把尖括号解释成文件重定向。

```bash
kubectl get pod -o wide # 确认 Pod IP 和 Node
ip addr show # 看 cali*、tunl0 或 vxlan.calico
ip route get '<TARGET_POD_IP>' # 看内核实际选择的下一跳和接口
calicoctl get wep -A -o wide # 看 workload endpoint
tcpdump -ni any host '<TARGET_POD_IP>' # 观察明文或封装包
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
tracepath '<TARGET_IP>' # 探测路径 MTU，环境支持时使用
ping -M do -s 1400 '<TARGET_IP>' # 禁止分片测试，逐步调整大小
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
kubectl create -f https://raw.githubusercontent.com/projectcalico/calico/v3.32.1/manifests/v1_crd_projectcalico_org.yaml # 先安装 Calico CRD
kubectl create -f https://raw.githubusercontent.com/projectcalico/calico/v3.32.1/manifests/tigera-operator.yaml # 再安装 operator
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

将本节 YAML 保存为 `default-deny.yaml`，执行 `kubectl apply -f default-deny.yaml`。Ingress/Egress 在本节分别指入站/出站方向；不是要求部署网站入口控制器。

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

将本节 YAML 保存为 `allow-dns.yaml`，执行 `kubectl apply -f allow-dns.yaml`。先恢复名称解析，再验证应用连接，避免把两种失败混在一起。

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

将下面两个文档保存在同一个 `allow-web.yaml` 文件中，执行 `kubectl apply -f allow-web.yaml`。中间 `---` 表示同一 YAML 文件中的下一份资源。

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

复制 `allow-web.yaml` 留作恢复基线，再把第一份入站允许策略中的 `app: client` 故意改成 `app: cllent`，保持第二份出站策略不变，执行 `kubectl apply -f allow-web.yaml`。现象是：

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

恢复原 `allow-web.yaml` 并重新 apply，再执行基础实验的 `wget`，预期恢复。若未恢复，检查是否误改了出站策略、DNS 放行是否仍在，以及 Felix 是否收敛。复盘时记录：为什么 Service、DNS、Pod 状态都正常，仍然不能证明网络策略允许流量。

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

## 生产事故题：新发布的全局策略让多个 Namespace 断网

**现象**：策略发布后，多个应用同时出现 DNS 超时、数据库连接失败和跨节点调用失败，但 Pod 仍显示 Running。

**先固定证据**：记录精确变更时间、策略 YAML 与 Git commit、受影响 Namespace/Pod/Node、Felix/BIRD 状态、路由、EndpointSlice、DNS 探针、源到目标五元组和抓包。Pod Running 只证明进程在，不证明网络允许。

**提出假设**：selector 选大了、Tier/Order 把平台允许规则压住、Egress 未放 DNS、HostEndpoint 策略影响节点，或网络策略无关而是 BGP/隧道故障。用一个成功流和一个失败流比较实际匹配策略，不要看到策略刚发布就跳过网络证据。

**止损与爆炸半径**：冻结后续策略发布；若确认新策略导致，回退精确的 Git 变更或应用预先评审的临时 allow，而不是清空全部策略。影响面按 selector、方向、协议、端口、Namespace 和节点统计；特别检查 DNS、监控、控制面与恢复通道。

**复验与回滚门**：验证 DNS、同节点/跨节点、关键数据库、外部出口、Felix 同步和业务 SLI；观察一个策略调和窗口。若回退后仍失败，停止继续改策略，转查 BGP、隧道、MTU、conntrack 与底层网络。

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

## 老师带你分清“路怎么走”和“允不允许走”

先画一条 client 到 web 的路径。路由回答去哪里，策略回答是否允许，Service 转发回答稳定入口对应哪一个后端，DNS 回答名字对应什么地址。这四件事可以分别失败，不能看到超时就立刻归因 DNS。

假设 DNS 成功解析，直接访问目标 Pod 也成功，只有 Service 失败，重点应该转向 Service 后端与转发实现。假设同节点访问成功、跨节点失败，则优先看路由、隧道和底层网络。假设只有一个标签的调用者失败，就用允许策略做对照。这是通过改变一个条件缩小范围的排障方法。

Veth pair（虚拟网卡对）像两头相连的虚拟网线，一头在 Pod 的网络空间，一头在节点。Network namespace（网络命名空间）让 Pod 看见自己的接口和路由视图。Felix 负责把期望对象转成节点实际规则，但它不是每个包都来咨询的中央路由服务器。

### BGP 与 VXLAN 为什么不是完全同类的选择

BGP 通告“某段地址从哪个下一跳可以到达”，VXLAN 决定“数据包怎样套上外层封装跨节点传送”。前者偏控制信息，后者偏数据传输形式。具体 Calico 模式决定它们是否组合，不要把所有网络名词都当成互斥插件。

Full mesh 是节点两两建立路由邻居。10 个节点需要 45 对关系，100 个需要 4,950 对。Route reflector（路由反射器）减少这种邻接规模，但不是让全部业务数据都绕经反射器；它主要反射路由信息，数据路径仍按学到的路由转发。

Typha 则处理另一种规模问题：向很多 Felix 分发控制状态。它与路由反射器服务的对象不同，一个缓解 API 状态分发压力，一个缓解 BGP 邻居规模。面试时能区分这两种“中间层”，说明你理解控制路径，而不是只背组件名称。

### 默认拒绝之后，为什么还要同时允许两端

当客户端出站和服务端入站都被隔离时，请求需要两端分别允许。只给 web 写一条允许 client 的入站规则，不会自动解除 client 的出站限制。DNS 也是网络请求，默认拒绝出站会先把名称解析挡住。

Kubernetes NetworkPolicy 的允许规则取并集，新增另一份允许策略可能扩大访问；Calico 自定义策略有自己的顺序、动作和层级。审查时必须先确认是哪类 API，不能把标准策略按防火墙“第一条匹配”顺序阅读。

实验中的 selector 故障只改入站来源标签。老师希望你保存三个证据：真实 Pod 标签、策略匹配条件、同一请求失败/恢复结果。三者对齐后才能说根因是 selector 写错；只凭拼写看着不对，还不足以证明受影响流量确实被它控制。

## 容量与升级课堂：地址也会成为资源瓶颈

地址池总体有空余，不代表每个节点或特定池选择器都能得到地址。Block（地址块）分配可能造成碎片，节点标签可能排除可用池，清理延迟可能留下暂未回收的地址。先查池、块和端点对应关系，再考虑扩池。

迁移网络模式时，旧连接、NAT 状态、路由收敛和 MTU 都可能改变。只测新建连接成功会漏掉长连接中断，只测小包会漏掉大请求。把同节点、跨节点、DNS、Service、出站、策略拒绝和长连接都放进验证矩阵。

课堂三分钟汇报用一个失败包串起来：确定源与目标和节点，说明 CNI/IPAM 创建网络、Felix 编程规则、BGP/封装提供跨节点可达、策略决定是否允许。然后给出选型取舍和规模边界，最后展示一条精确回退的策略实验。你的结论应能解释成功流和失败流的差异。

## 策略精讲课堂：缩进不同，安全边界就不同

老师请你读一句需求：“只允许 payment 命名空间里的订单客户端访问账单服务。”这里同时限制了“哪个命名空间”和“哪类 Pod”。Kubernetes NetworkPolicy 的一个 `from` 列表项同时放 `namespaceSelector` 和 `podSelector`，表示两项同时成立；拆成两个列表项，则是任一项成立即可。这个细节能把精确放行变成跨租户放行。

```yaml
ingress:
  - from:
      - namespaceSelector: # 同一个列表项：两个条件同时满足
          matchLabels:
            kubernetes.io/metadata.name: payment
        podSelector:
          matchLabels:
            app: order-client
    ports:
      - protocol: TCP
        port: 8080
```

这只是完整 NetworkPolicy 的片段，不可单独 apply。还需要 API 版本、类型、名字、目标命名空间、目标 `podSelector` 和 `policyTypes`。命名空间选择器选的是 Namespace 对象的标签，不是 Pod 上名为 namespace 的普通标签。只写 `podSelector` 时，来源范围是该策略所在命名空间；来源与目标方向要分别分析。规则语义可继续对照 [Calico 的 Kubernetes 策略进阶教程](https://docs.tigera.io/calico/latest/network-policy/get-started/kubernetes-policy/kubernetes-policy-advanced)，但照抄其环境标签之前仍需核对本地标签。

再问权限：如果租户能随意改自己命名空间上被安全策略信任的标签，就可能影响跨命名空间策略边界。因此网络隔离还依赖 Kubernetes RBAC 和准入治理。标签不是由神秘网络硬件担保的身份，谁能创建带某标签的 Pod、谁能改 Namespace 标签，必须写进安全模型。允许业务团队维护自己服务的细规则，与允许他们改全局策略，是两种完全不同的权限。

### 用四个请求验收一条规则

一个成功请求只能证明这条路径被允许，不能证明其他路径都被拒绝。最小验收应包括：正确来源到正确端口成功；错误来源到正确端口失败；正确来源到错误端口失败；正确来源在依赖 DNS 时仍可解析目标。进一步分同节点和跨节点，避免两个 Pod 恰好落在同一节点而掩盖跨节点问题。

这里的失败必须有对照。目标端口本来就没有进程监听，连接被拒绝不能证明策略拒绝生效；先在允许条件下建立可访问基线，再改变一个条件。对默认拒绝后的 DNS，`nslookup` 失败与 TCP 请求超时是两个独立现象。DNS 正常仅证明名称可解析，后续端口仍需要精确放行。使用 BusyBox 的有限超时命令，避免课堂终端一直挂起；每次记录目标、节点、标签、时间和退出结果。

原基础实验的错误标签 Pod 还受默认出站拒绝约束，所以失败可能同时来自源出站与目标入站。若要单独验证目标入站规则，需要保持测试源出站条件与成功源一致，或先按审批添加仅到目标端口的专用出站允许；不能拿一个被两边都拦住的请求声称“已证明只有入站 selector 是原因”。恢复后仍应删除新增测试策略和测试 Pod，最后回收专用命名空间。

## 路由精讲课堂：有 BGP 邻居，不等于有可用业务路由

BGP 会话建立说明邻居之间能交换控制信息，不能证明目标 Pod 的前缀已经被正确接收、选中并装进内核转发表。排查时先记源 Pod IP、目的 Pod IP 和所在节点，再问三次：目的前缀是否被通告，源节点是否选到可用下一跳，报文是否能按该下一跳到达目标。观察的是“这条业务前缀”，不是只看总邻居状态绿色。

路由反射器减少全互联会话规模：一百个节点两两建立需要 4950 对关系，接入反射器后每个节点只维护少量控制邻居。但是反射器不是业务包的中心交换机，它主要传播路由；断掉一台反射器的业务影响与现有路由、剩余邻居和收敛行为有关。生产配置多个反射器并跨故障域，验证维护与重启后新路由能继续传播，不能只验证老连接还活着。

底层网络不知道 Pod 网段时，封装把内部 Pod 报文包进节点之间能转发的外层报文。IP-in-IP 与 VXLAN 使用不同封装，需要放行不同协议或端口；“节点 SSH 正常”并不证明隧道可通过。底层改造前先与网络团队确认地址范围、路由控制、隧道开销与抓包位置。只在两节点之间开通隧道，不代表第三节点也有同样规则，抽样验证要覆盖故障域。

MTU 是单个链路可容纳的数据包大小。假设物理路径允许 1500 字节，而隧道增加包头，内层可用空间就要减去相应开销；具体值受 IPv4/IPv6 和封装类型影响，不能把一个数字套所有环境。路径 MTU 发现依赖必要的反馈报文，反馈被拦可能形成“小请求通，大响应挂”的黑洞。验证时比较包大小、重传、两端抓包和 ICMP 反馈，不以一次 ping 断言 MTU 正确。调整 MTU 会影响新旧接口和现有连接，先小范围验证再滚动推进。

## IPAM 精讲课堂：为什么全网有空地址，单节点仍分配失败

IPAM 是 IP Address Management，即地址分配管理。IPPool 定义候选地址范围及用途，分配块把一段地址交给某节点管理，block affinity 记录块与节点的关联。你可以把地址池看成仓库、分配块看成发给各教室的整盒文具：总仓库还有空位，不代表每个教室当前都能得到合适的新盒子。

容量先数“可分配地址”，再扣掉已分配、被保留、不能用于当前节点或用途的部分。节点选择器限制了某个池在哪些节点使用；不同封装或 NAT 选项也会改变池的预期用途。仅看 CIDR 大小，不看池是否禁用、节点匹配和实际 block 分布，会漏掉局部耗尽。地址借用等具体行为随模式配置而异，按目标版本观察，不把“每个节点固定一整段永不变化”当通用模型。

还有一种问题不是没地址，而是地址冲突。Pod CIDR 与物理机、VPN 或外部服务网段重叠时，系统可能把本应去远端的包送进本地集群。设计前汇总节点网段、Pod 网段、Service 网段、专线、VPN 和未来互联范围，不能在出问题后才问网络团队。重编号涉及所有引用与运行中 Pod，不是简单改一个池配置；通常需要新池、小范围迁移、验证、排空旧地址，再按支持流程处理旧池。

## 大厂事故追问：策略发布之后只在一个节点上失败

先给出证据而非结论：同一客户端标签、同一目标端口，同节点请求成功，跨到节点乙失败；Kubernetes 策略对象已更新，但节点乙 Felix 日志出现规则同步错误。这个证据提高了“节点乙策略或数据面未收敛”的可能性，却还没有排除路由或隧道错误。下一步读取节点乙的端点、相关规则、路由与 Felix 错误时间线，同其他正常节点对比。

若只有新建 Pod 失败、旧 Pod 正常，继续区分 CNI 创建阶段、IPAM 分配和已有端点策略更新。CNI 日志是创建网络的证据，Felix 日志是持续编排数据面的证据，两者不是同一个阶段。生产取证尽量限定目标与时间窗，抓包只采必要头信息并保护业务内容，不把全节点原始流量上传公共仓库。

修复选择从小到大：回退已证实错误的策略，或者按支持流程处理局部 agent 问题；保留仍可服务的节点和恢复基线。重启全部 `calico-node` 会同时影响新端点配置和观测，不能作为第一招。故障恢复验收包括旧连接、新连接、新 Pod、同节点、跨节点和 DNS；只看 DaemonSet 全部 Ready 无法证明这些业务路径。

最后面试官问“如何让 AIOps 自动处理”。答案是先自动关联策略变更、端点标签、节点和丢包证据，生成影响范围与建议；高风险全局策略回退必须有明确版本、目标范围和审批。模型不能根据一条超时告警修改整个集群网络。把一次允许和拒绝的真实证据保存到学习仓库，才能把定义讲成可检验的工程能力。

## 主机边界课堂：一张网卡经过的流量不都属于同一种授权

现在把视角从 Pod 移到节点。节点上有 SSH、kubelet 和网络代理等本地进程，也有从物理网卡进入、转发给 Pod 的流量。前一种连接的终点是主机，后一种只是借主机转运。HostEndpoint 是 Calico 对主机网络接口的策略对象，不是“给所有 Pod 又加一层相同策略”的别名。

假设客户端访问节点上的管理端口，同时另一个请求经节点转发到业务 Pod。你要分别写出终点、经过接口、源地址和适用策略。`applyOnForward` 表示主机策略是否还作用于转发流量，默认关闭时不能凭主机本地访问测试推断转发已受保护；开启之后，主机层放行也不能覆盖工作负载层拒绝。以[官方转发策略说明](https://docs.tigera.io/calico/latest/reference/host-endpoints/forwarded)核对方向和默认行为，不把不同资源的默认拒绝混成一句话。

再问一个危险问题：先创建主机端点，再慢慢补策略，可以吗？这可能影响管理访问。Failsafe 是为避免误封管理而保留的应急放行规则，不等于企业已经完成最小权限。部署前应审查当前具体放行端口、来源和带外管理通道；不能因为有应急规则就关闭所有其他恢复手段。它与云安全组、物理防火墙共同约束路径，某层允许不代表整条路径允许。参考[主机保护说明](https://docs.tigera.io/calico/latest/network-policy/hosts/protect-hosts)。

这里不提供面向全节点的拒绝命令。教学验证采用纸面路径矩阵：准备“管理员到主机”“监控到主机”“外部入口到业务 Pod”“Pod 到外部依赖”四行，每行填写主机本地或转发、入站与出站接口、工作负载策略是否参与。基础步骤是逐行计算所有适用层都允许时的结果；故障步骤只把业务 Pod 的入站改成拒绝，预期主机规则允许也不能使请求成功；恢复该格后应回到基础结果。清理就是删除本轮矩阵副本，不删除任何主机策略。若得出不同答案，先查流量终点是否识别错误，再查是否误把一个方向的规则用到另一方向。

这份矩阵还解决团队分工问题。平台组负责 Pod 策略不意味着网络组可以忽略主机转发；安全组审批了来源地址，也不意味着应用组允许了用户操作。上线评审把每层控制、负责人和取证位置并排记录，比提交一张“网络已开通”的截图更可靠。

## 地址迁移课堂：禁用地址池，不是给现有 Pod 换地址

IPPool 的 `disabled` 控制是否继续从池里分配新地址。将旧池禁用，是阻止后续分配的一个控制点，不会把正在运行的 Pod 即时改成新地址。新池已经创建、旧池已禁用、工作负载已迁移、旧引用已清零，是四个不同状态。官方[地址池字段](https://docs.tigera.io/calico/latest/reference/resources/ippool)与[CNI 配置说明](https://docs.tigera.io/calico/latest/reference/configure-cni-plugins)分别解释分配条件和新池对重建工作负载的影响。

老师给出一个设计题：原池与新接入专线重叠，业务需要换到新网段。第一步不是删除旧池，而是列举旧地址消费者，包括 Pod、允许列表、监控目标、外部防火墙和可能保留地址的应用配置。第二步准备新池、底层路由、出口转换与安全策略，让新旧网段在迁移期间都能完成必要业务。第三步只重建一组可回退的无状态副本，观察新地址与端到端请求。第四步分批排空旧地址，达到引用清零与观察窗口后再按受支持流程收尾。

如果新建 Pod 已拿到新地址却访问不了外部，不要立即重新分配。先比较旧池与新池的出口 NAT、外部回程路由和安全许可。NAT 是地址转换，出口源地址可能变成节点地址；对端日志看到的地址因此未必是 Pod 地址。抓包记录必须写明转换前还是转换后，不能拿节点出口地址去反证 Pod 身份错误。恢复旧配置也不自动把已迁移 Pod 换回旧地址，回滚清单要同时包含工作负载重建、路由和地址许可的恢复顺序。

地址回收也应谨慎。控制面中一个分配记录看起来陈旧，不足以证明地址绝对无人使用；网络分区、节点失联或缓存滞后都可能造成观察差异。先对照节点、工作负载、端点和分配记录，再选择官方支持的检查与修复流程。直接手改分配块或抢先释放地址可能让两端同时认为自己拥有同一地址，形成间歇性故障，这不是普通的空间清理。

## 网络验收课堂：DNS 成功要问清楚由谁回答

前文 DNS 放行实验按普通集群 DNS Pod 编写。真实环境可能部署 NodeLocal DNSCache，即节点本地 DNS 缓存，应用把查询发给节点本地地址，再由缓存向上游转发。原来按 DNS Pod 标签写的策略不能不加核实地覆盖这条路径。先读取测试 Pod 的解析配置，画出实际查询目的地址、所在网络命名空间和下一跳；再结合当前模式验证策略匹配，不为方便排障直接放行所有 UDP。

还要拆开缓存命中和未命中。已有域名能解析不证明到上游解析器的路径畅通，新域名失败才可能暴露被遮住的问题；相反，错误地址已缓存在应用内时，修复网络也不会立即使它重新查询。课堂记录中同时保留解析结果、查询时间、应用连接目标和缓存有效期。超时、拒绝连接、域名不存在是不同证据，不用“网络不通”统称。

基础实验的最终验收应在同一个专用集群中保留允许和拒绝两组客户端，分别新建连接测试，并确认 DNS 放行没有顺手放宽业务访问。故障实验修复选择器后，原允许组恢复且原禁止组继续失败，才证明精确修复。清理前读取当前上下文并确认集群名确实是本轮 `calico-lab`；若同名集群或命名空间原先已存在，应换独立名称重新准备，不能把前文删除示例用于共享环境。

### 从证据到 AIOps：不要让网络模型只学到故障后的动作

训练故障知识库时，至少保存故障前配置、变更时间、受影响方向、节点范围、对照节点和恢复验证。只保留“重启后正常”会让模型把所有网络问题推荐成重启。尤其是策略传播延迟和底层丢包，它们都表现为超时，但需要的证据完全不同。自动化可以生成路径矩阵、提示缺少反向流和新连接测试，并对比变更版本；不应在证据不足时重建地址池或全局关闭策略。

面试进一步问容量，回答不要停在 Pod 总数。策略更新频率、节点数、每节点端点数、身份标签变化、路由规模和收敛延迟共同决定控制面压力。扩容压测要同时观察首次入网耗时与已有工作负载的转发稳定性，否则新建业务很慢而旧业务正常会被平均指标掩盖。把可观测延迟作为验收项，才能知道修复是在几十秒内传播，还是只修改了管理面对象。

验收还有一个经常遗漏的时间维度：策略已提交、各节点已接收、规则已编程、测试请求已发出，这四个时间点要按顺序记录。若测试发生在规则生效前，失败或成功都不能评价最终配置。面试回答中主动说明取证窗口，并给出停止等待的上限，比声称“网络策略立即生效”更准确。超过上限后保存节点差异，不让自动化无限重试；恢复后补测跨节点反向连接，防止只修通请求方向却漏掉独立反向访问的授权要求。

## 学习证据

- `kind-calico.yaml` 和安装版本记录。
- 一张 Pod 跨节点数据路径图。
- 默认拒绝、DNS 放行和应用放行策略 YAML。
- 一份 selector 写错的故障注入复盘。
- `calicoctl node status`、IPAM 和路由的脱敏记录。
- 一份 500 节点 Calico 架构设计和回滚方案。

## 本文边界与下一步

本文覆盖 Calico Open Source 3.32.1 的 Kubernetes 主线，不展开企业版全部流量分析、多集群商业能力、BIRD 源码和 eBPF 程序实现。本次没有实际创建 kind 集群，命令按 3.32.1 官方安装顺序完成静态核验；托管 Kubernetes、Windows 节点和具体内核 backport 仍需实测。下一步学习 [Kubernetes](./kubernetes.md)、[Cilium](./cilium.md)、[etcd](./etcd.md) 和 [网络基础](../foundation/networking.md)，把控制面状态、Linux 转发和策略证据串成端到端排障能力。
