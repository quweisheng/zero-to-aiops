# Cilium 深讲

> 学习目标：从零理解 CNI、eBPF、Cilium agent、endpoint、security identity、BPF program/map、Service 负载均衡、NetworkPolicy、Hubble 和 kube-proxy replacement，能搭建学习集群、观察一次允许和拒绝流量，能排查 endpoint、路由、策略、BPF map、conntrack 和 MTU 故障，并能完成生产选型与大厂面试连续追问。

## 官方资料

- [Cilium 文档](https://docs.cilium.io/en/stable/)
- [快速安装](https://docs.cilium.io/en/stable/gettingstarted/k8s-install-default/)
- [kind 安装](https://docs.cilium.io/en/stable/installation/kind/)
- [eBPF 介绍](https://docs.cilium.io/en/stable/reference-guides/bpf/)
- [路由模式](https://docs.cilium.io/en/stable/network/concepts/routing/)
- [Kubernetes 网络策略](https://docs.cilium.io/en/stable/security/policy/kubernetes/)
- [Cilium NetworkPolicy](https://docs.cilium.io/en/stable/security/policy/)
- [kube-proxy replacement](https://docs.cilium.io/en/stable/network/kubernetes/kubeproxy-free/)
- [Hubble](https://docs.cilium.io/en/stable/observability/hubble/)
- [监控指标](https://docs.cilium.io/en/stable/observability/metrics/)
- [故障排查](https://docs.cilium.io/en/stable/operations/troubleshooting/)
- [性能调优](https://docs.cilium.io/en/stable/operations/performance/tuning/)
- [Cilium 1.20.0 发布](https://github.com/cilium/cilium/releases/tag/v1.20.0)
- [1.20 Kubernetes 兼容范围](https://raw.githubusercontent.com/cilium/cilium/v1.20.0/Documentation/network/kubernetes/requirements.rst)
- [升级指南](https://docs.cilium.io/en/latest/operations/upgrade/)

本文以 Cilium 1.20.0 固定版本资料为主。截至 2026-08-14，该版本保证/e2e 测试的 Kubernetes 范围为 1.33–1.36，Linux kernel 至少 5.10 或发行版等价 backport。动态 `stable` 文档快照可能短暂落后于 release；生产升级前仍须核对 Kubernetes、内核、发行版、Cilium CLI、Helm Chart 和数据平面功能矩阵。

### 1.20 升级红线

- 官方只测试相邻 minor 的升级与回滚，先把当前 minor 升到最新 patch，再进入 1.20。
- 1.20 已移除弃用的 Envoy Go extensions/proxylib；旧 Kafka-aware 以及 `kafka`、`l7`、`l7proto` 规则必须先清理。
- HTTP、Ingress、Gateway 等 L7 流量会经过 Envoy；DNS/FQDN policy 使用 DNS proxy 路径，二者不能混写成同一个代理链。
- 通过用户态代理的 L7/Ingress/Gateway 连接在升级时可能需要断开重连，不能承诺完全无损。
- Gateway API、kube-proxy replacement、ClusterMesh、BGP 和云 CNI chaining 都会扩大变更面，生产窗口一次只改一个主要变量。

## 官方知识地图

```text
Cilium（容器网络、安全和观测方案）
  -> CNI（容器网络接口）与 IPAM（IP 地址分配管理）
  -> eBPF data plane（内核可编程数据面）
     -> programs（处理逻辑）/ maps（共享状态表）
     -> endpoint / identity（工作负载端点/安全身份）
     -> service load balancing（服务负载均衡）
     -> connection tracking（连接跟踪）
  -> Routing（路由）
     -> VXLAN / Geneve（隧道封装协议）
     -> native routing（原生路由）
     -> BGP control plane（路由通告控制面）
  -> Policy（访问策略）
     -> Kubernetes NetworkPolicy（标准网络策略）
     -> CiliumNetworkPolicy（命名空间级扩展策略）
     -> CiliumClusterwideNetworkPolicy（集群级扩展策略）
     -> L3 / L4 / L7 / DNS（网络层/传输层/应用层/名称解析）
  -> kube-proxy replacement（替换 Service 转发实现）
  -> Hubble（流量观测）
     -> flow events（网络流事件）/ Relay（聚合）/ UI（界面）/ metrics（指标）
  -> Operations（运行维护）
     -> status / connectivity test（状态/连通性测试）
     -> sysdump（诊断包）/ BPF map pressure（状态表容量压力）
     -> upgrades and rollback（升级与回滚）
```

## 场景开场

一个 Service 偶发超时，应用日志只留下“connection reset”。传统检查里 Pod、Service、EndpointSlice 都正常，Node 之间也能 ping。此时只看 Kubernetes 对象无法回答：这个包是在源端策略被拒绝、Service 翻译时丢失、跨节点隧道中断、目标端返回 RST，还是 conntrack map 已满？

Cilium 把 eBPF 数据面和 Hubble 流量事件结合起来，可以让平台工程师看到“谁以什么身份访问谁、走了哪个端口、在哪个节点、最终是 FORWARDED 还是 DROPPED”。但要真正用好它，仍必须理解 Linux 网络、BPF hook、map 容量和路由模式。

## 一句话人话版

Cilium 用 eBPF 在 Linux 内核中完成 Pod 网络、Service 转发和身份策略，并用 Hubble 把实际流量路径和丢包原因变成可查询证据。

## 小白可能会问

- eBPF 是不是一个一直运行在内核里的脚本？
- Cilium 有了以后还需要 kube-proxy 吗？
- Cilium policy 为什么不用 IP，而用 identity？
- Hubble 能看到流量，是否等于能看到全部业务内容？
- BPF map 满了为什么会影响新连接？
- Calico 和 Cilium 是互相替换，还是可以一起用？

## 为什么要学

云原生平台越来越多地使用 eBPF 做网络、可观测和安全。大厂平台岗位通常会追问：

- eBPF 程序在哪里执行，怎样与用户态 agent 协作。
- Service ClusterIP 在 kube-proxy replacement 下怎样转发。
- security identity 如何由 labels 得到，为什么减少对 IP 的依赖。
- VXLAN/Geneve 和 native routing 怎么选。
- Hubble 看到 DROPPED 后怎样定位到 policy 或 datapath。
- BPF map、conntrack、内核版本和内存容量如何设计。
- 从 kube-proxy 迁移到 replacement 怎样回滚。

## Cilium 是什么

Cilium 是基于 eBPF 的 Kubernetes 网络、网络安全和可观测方案。它可以提供：

- CNI 和多种 IPAM。
- Pod 路由与 Overlay/原生路由。
- Kubernetes Service 负载均衡。
- L3/L4 网络策略，以及按配置启用的 DNS/L7 策略。
- 可选的 kube-proxy replacement。
- Hubble 流量观测、指标和服务依赖图。
- Cluster Mesh、BGP、Gateway API 等进阶能力。

Cilium 不是“装完就自动理解业务”的 APM。Hubble 能观察网络流和部分协议元数据；业务 trace、日志和语义仍需要 OpenTelemetry、应用埋点和日志系统。

## eBPF 前置知识

eBPF 是 extended Berkeley Packet Filter。内核在加载程序前会验证安全约束，再把程序挂载到特定 hook。网络包经过 hook 时执行程序，程序可以查询或更新 BPF map，并决定转发、修改、重定向或丢弃。

```text
用户态 cilium-agent（节点网络代理）
  -> 根据 Kubernetes 对象生成期望状态
  -> 加载 / 更新 eBPF programs（内核可编程处理逻辑）
  -> 写 BPF maps（供程序查询的映射表）

网络包
  -> tc / XDP / cgroup / socket hook（流量控制、早期收包、控制组、套接字等挂钩点）
  -> eBPF program（内核中受校验的程序）
  -> 查询 identity / policy / service / conntrack maps（身份、策略、服务、连接跟踪映射表）
  -> forward / redirect / drop（转发、重定向、丢弃）
```

### Program 和 Map

| 概念 | 人话解释 | 常见问题 |
|---|---|---|
| BPF program | 在特定内核 hook 执行的受验证程序 | 加载失败、内核不支持 |
| BPF map | 内核与用户态共享的键值状态 | 容量、内存、压力和 GC |
| pinned map | 固定在 bpffs 路径，可跨进程访问 | bpffs 未挂载、残留状态 |
| tail call | 从一个 BPF 程序跳到另一个 | map/程序槽位和复杂度 |
| verifier | 加载前检查程序安全和可终止性 | verifier reject 日志 |

eBPF 不代表“完全绕过内核网络栈”。它是在内核提供的 hook 上可编程地处理数据，具体路径取决于 Cilium 模式和功能。

## 核心组件

### cilium-agent

- 是什么：每个节点一个 DaemonSet Pod。
- 为什么需要：把 Kubernetes/CRD 状态翻译成该节点的 eBPF 数据面。
- 怎么工作：管理 endpoint、identity、policy、route、Service 和 BPF map。
- 怎么看：`cilium status`、`cilium-dbg status`、agent 日志和指标。
- 坏了怎么查：Kubernetes 连接、endpoint regeneration、BPF load、map pressure、内核日志。

### cilium-operator

运行集群级控制逻辑，例如按 IPAM 模式分配地址范围、管理 identity 和节点状态、执行垃圾回收等。它不直接为每个包做转发。

生产要为 operator 配置多个副本和 leader election，确认当前模式下哪些任务在 Leader 执行。

### Cilium CNI

Pod sandbox 创建时，CNI 插件为 network namespace 配置接口和地址，并通知 agent 建立 endpoint。CNI 成功不代表 endpoint policy 已完成全部 regeneration；要看 endpoint 是否进入 ready。

### Cilium Endpoint

Endpoint 是 Cilium 对一个本地工作负载网络端点的表示，包含 Pod、IP、identity、policy revision 和状态。

```bash
kubectl -n kube-system exec ds/cilium -- cilium-dbg endpoint list # 查看 endpoint ID、identity、状态和 policy
```

状态长期停在 `regenerating` 或 `not-ready` 时，看 agent 日志、policy 复杂度、编译/加载错误和 map 容量。

### Envoy

HTTP 七层策略或 Gateway/Ingress 等能力可能使用 Envoy 代理；DNS/FQDN 策略使用 DNS proxy 路径。本文 1.20 基线已移除旧 Kafka-aware/proxylib 能力，不能照搬旧 Kafka 规则。L3/L4 eBPF 转发与 L7 proxy 是不同路径；确认代理日志和流量重定向证据，不仅凭一个可修改的 HTTP 响应头判断。

### Hubble、Relay 和 UI

- Hubble server 嵌入 cilium-agent，读取本节点流事件。
- Hubble Relay 聚合多节点流。
- Hubble CLI 查询流。
- Hubble UI 展示服务依赖和流量。

Hubble ring buffer 有容量，长时间后旧事件会被覆盖。它适合实时/近期网络证据，不是无限保留的审计仓库。

## Security Identity：策略为什么不绑 Pod IP

Cilium 从安全相关 labels 计算 identity。同一组相关标签的 endpoint 可以共享 identity；策略主要匹配 identity，而不是不断变化的 Pod IP。

```text
Pod labels（容器组标签）
  -> Cilium 计算 security identity（安全身份）
  -> endpoint（网络端点）绑定 identity（身份编号）
  -> policy（策略）编译为身份到身份的规则
  -> 包携带或关联源 identity（身份）
  -> 目标节点按 identity（身份）执行策略
```

好处：Pod 重建和 IP 变化时，只要身份标签不变，策略意图保持稳定。

风险：

- 把高基数、频繁变化的标签纳入身份会增加 identity 和 policy 更新。
- selector 写错会让 endpoint 获得意外策略。
- identity 传播落后或分配异常会导致临时策略不一致，需要看 policy revision 和 endpoint 状态。

## 同节点 Pod 到 Pod

```text
Pod A（源容器组）
  -> veth / endpoint eBPF（虚拟网卡对及端点上的内核程序）
  -> 查源 identity、policy、conntrack（身份、策略、连接跟踪）
  -> 本节点目标 endpoint（网络端点）
  -> 目标 policy（入站策略）
  -> Pod B（目标容器组）
```

同节点路径通常不需要经过物理网卡或 Overlay，但仍受策略、Service 翻译和 endpoint 状态影响。

## 跨节点 Pod 到 Pod

### 封装模式

Cilium 默认可使用 VXLAN 或 Geneve 隧道：

```text
Pod A packet（源 Pod 发出的数据包）
  -> source-node eBPF policy（源节点内核中的策略处理）
  -> VXLAN/Geneve encapsulation（加上隧道外层包头）
  -> underlay routes by Node IP（底层网络按节点地址转发）
  -> target-node decapsulation（目标节点拆除外层包头）
  -> target policy（目标侧策略处理）
  -> Pod B（目标工作负载）
```

底层必须允许 Node 间流量和对应 UDP 端口。Cilium 文档中的常见端口是 VXLAN 8472/UDP、Geneve 6081/UDP，实际以部署值为准。

### Native routing

原生路由不封装跨节点包，底层网络必须能路由所有 PodCIDR。可以依赖云路由、节点路由或 BGP 控制平面。

```yaml
routingMode: native
ipv4NativeRoutingCIDR: 10.0.0.0/8
```

优点是少一层封装；代价是对底层路由和故障域要求更高。不要只因为“性能更好”切换，先验证网络团队能维护 Pod 路由。

## IPAM 模式

Cilium 可按环境使用 Kubernetes host-scope、cluster-pool、云 ENI/Azure 等 IPAM。不同模式决定 IP 从哪里来、谁分配、Pod 地址是否是云网络原生地址。

选择问题：

- 地址池与 Node/Service/VPN 是否冲突。
- 每节点预分配多少地址。
- 节点扩容时能否快速取得地址。
- 云网卡/子网配额是否成为瓶颈。
- Pod IP 是否需要被底层网络原生路由。

排障先用：

```bash
cilium status --verbose # 查看 IPAM 和组件摘要
kubectl get ciliumnodes -o yaml # cluster-pool 或云 IPAM 下查看节点地址状态
kubectl -n kube-system logs deploy/cilium-operator # 查看集群级分配错误
```

## Service 负载均衡数据路径

传统 kube-proxy 会把 Service/EndpointSlice 编程成 iptables、IPVS 或 nftables 规则。Cilium 可以用 eBPF map 保存 Service 前端和 backend，并在内核 hook 选择目标。

```text
客户端访问 ClusterIP:port（服务虚拟地址与端口）
  -> eBPF service lookup（内核程序查询服务）
  -> service map（服务映射表）找到 frontend（前端虚拟地址和端口）
  -> backend map（后端映射表）选择 Pod IP:port（容器组地址和端口）
  -> conntrack / affinity（连接跟踪、会话亲和）记录
  -> 转发到本地或远端 backend（后端实例）
```

排障：

```bash
kubectl get svc,endpointslice -A # 先确认 Kubernetes 期望状态
kubectl -n kube-system exec ds/cilium -- cilium-dbg service list # 看 Cilium 实际 Service map
kubectl -n kube-system exec ds/cilium -- cilium-dbg bpf lb list # 深入查看 LB map，命令随版本核对
```

如果 EndpointSlice 正确但 Cilium service map 缺失，问题在控制面同步或 agent；如果 map 有条目但包被 drop，要继续看 policy、conntrack 和路由。

## kube-proxy replacement

设置 `kubeProxyReplacement=true` 后，Cilium 可以承担 ClusterIP、NodePort、ExternalIP、LoadBalancer、HostPort 等 Service 转发能力，具体支持和加速方式取决于内核和配置。

迁移前必须回答：

1. 当前 kube-proxy 模式和规则规模是多少？
2. 内核是否满足 socket LB、XDP、DSR 等目标能力？
3. NodePort、externalTrafficPolicy、healthCheckNodePort 是否验证？
4. 与云负载均衡、hostNetwork、服务网格是否兼容？
5. 出问题时如何恢复 kube-proxy，是否保留配置和镜像？

不要在同一 Service 上让两套实现以未验证方式竞争。

## Policy 能力

### Kubernetes NetworkPolicy

Cilium 实现标准 `networking.k8s.io/v1` NetworkPolicy，语义是被策略选择后按 Ingress/Egress 方向隔离，允许规则取并集。

### CiliumNetworkPolicy

CNP 是 namespace 级自定义策略，可按 identity、CIDR、entity、FQDN 和 L7 规则表达更丰富意图。

### CiliumClusterwideNetworkPolicy

CCNP 是集群级策略，适合平台基线和跨 namespace 控制。错误的集群级策略可能影响控制面、DNS和监控，必须在测试环境和可回滚通道中发布。

### L3、L4、L7

```text
L3：源/目标身份或 CIDR
L4：TCP/UDP + port
L7：HTTP method/path、DNS name 等协议语义
```

L7 policy 通常需要流量重定向到 Envoy，增加代理资源、延迟和故障面。只在确有需求且有容量基线时启用。

## Hubble：从结果反推路径

```bash
hubble status # 确认 Relay/Server 可用和流缓冲状态
hubble observe --namespace production --verdict DROPPED # 看被拒流量
hubble observe --from-pod production/client --to-pod production/api -f # 跟踪指定端点
hubble observe --protocol http --http-status 5+ # 观察 HTTP 5xx，需具备 L7 可见性
```

常见 verdict：

| verdict | 说明 | 下一步 |
|---|---|---|
| `FORWARDED` | Cilium 数据面允许并转发 | 查目标应用和回包 |
| `DROPPED` | 数据面丢弃 | 看 drop reason、policy 和 endpoint |
| `AUDIT` | 审计模式命中 | 评估转为强制策略影响 |
| `REDIRECTED` | 进入代理 | 查 Envoy 和 L7 policy |

Hubble 没事件不等于没流量：Pod 可能未被 Cilium 管理、Relay 范围错误、事件缓冲覆盖或采样/事件配置不同。

## BPF map、conntrack 和容量

常见 map 保存：

- endpoint 和 identity。
- policy。
- Service frontend/backend。
- conntrack。
- NAT、neighbor、tunnel 等状态。

map 有固定或动态上限，并消耗内核内存。高连接数、大量 Service/backend、复杂 policy selector 都会增加压力。

`CT: Map insertion failed` 常表示 conntrack map 无法插入新连接。处理顺序：

1. 看 `cilium_bpf_map_pressure` 等指标定位节点和 map。
2. 查连接创建速率、超时和 GC 是否异常。
3. 查是否有流量攻击、重试风暴或连接泄漏。
4. 评估调 GC 间隔或 map 上限的 CPU/内存代价。
5. 扩大 map 是最后手段，不是代替根因分析。

## 安装实验：kind + Cilium 1.20.0

### 前置条件

- Docker、kind、kubectl、Helm 和 Cilium CLI。
- Linux 或支持 Cilium 所需内核能力的 Docker 虚拟机。
- PodCIDR、ServiceCIDR 不与本机/VPN 重叠。

创建 `kind-cilium.yaml`：

```yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
  - role: control-plane
  - role: worker
  - role: worker
networking:
  disableDefaultCNI: true # 节点先保持 NotReady，等待 Cilium 接管
  podSubnet: 10.10.0.0/16
  serviceSubnet: 10.11.0.0/16
```

安装：

```bash
kind create cluster --name cilium-lab --config kind-cilium.yaml # 创建无默认 CNI 的三节点集群
cilium install --version 1.20.0 # 使用 Cilium CLI 安装本文固定版本
cilium status --wait # 等 agent、operator 和 endpoint 健康
cilium connectivity test # 运行官方连通性和策略测试
kubectl get nodes -o wide # 节点应为 Ready
```

启用 Hubble Relay/UI：

```bash
cilium hubble enable --ui # 开启 Hubble Relay 和 UI
cilium status --wait # 确认 Hubble 状态正常
cilium hubble port-forward # 在独立终端保持运行，给本机 CLI 提供 Relay 入口
```

在另一个终端执行 `hubble status`，应连接到转发的 Relay。仅安装 Relay 不会自动让本机 CLI 获得访问路径；实验结束按 Ctrl+C 关闭转发。

如果失败，先看：

1. `cilium status --verbose` 的第一个失败组件。
2. `kubectl -n kube-system get pod -l k8s-app=cilium -o wide`。
3. `kubectl -n kube-system logs ds/cilium --tail=200`。
4. `cilium sysdump` 收集证据后再重装。
5. Docker 虚拟机的内核、bpffs、cgroup v2 和 inotify 限制。

## 基础实验：身份策略和 Hubble

### 创建工作负载

```bash
kubectl create namespace cilium-lab
kubectl -n cilium-lab create deployment web --image=nginx:1.27-alpine
kubectl -n cilium-lab expose deployment web --port=80
kubectl -n cilium-lab create deployment client --image=busybox:1.36 -- sleep 3600
kubectl -n cilium-lab rollout status deployment/web
kubectl -n cilium-lab rollout status deployment/client
kubectl -n cilium-lab exec deploy/client -- wget -qO- --timeout=3 http://web # 初始应成功
```

### 默认拒绝 Ingress

把下面 YAML 保存成 `deny-web.yaml`，再执行 `kubectl apply -f deny-web.yaml`。`Ingress` 在这里是入站方向，不是网站入口资源。

```yaml
apiVersion: cilium.io/v2
kind: CiliumNetworkPolicy
metadata:
  name: web-default-deny
  namespace: cilium-lab
spec:
  endpointSelector:
    matchLabels:
      app: web
  ingress: [] # 选中 web 且不允许任何入站来源
```

应用后访问应超时。观察：

```bash
hubble observe --namespace cilium-lab --verdict DROPPED --last 20 # 应看到 policy denied 等丢包原因
```

### 允许 client 访问 web:80

把下面 YAML 保存成 `allow-client.yaml`，再执行 `kubectl apply -f allow-client.yaml`。两份允许策略按支持的策略语义共同求值，应用前先核对 Namespace 和 selector。

```yaml
apiVersion: cilium.io/v2
kind: CiliumNetworkPolicy
metadata:
  name: allow-client-web
  namespace: cilium-lab
spec:
  endpointSelector:
    matchLabels:
      app: web
  ingress:
    - fromEndpoints:
        - matchLabels:
            app: client
      toPorts:
        - ports:
            - port: "80"
              protocol: TCP
```

再次访问应成功，Hubble verdict 变为 FORWARDED。用 `cilium-dbg endpoint list` 对照 client/web 的 identity。

## 故障实验：标签改变导致身份和策略变化

先创建一个标签不匹配的独立测试 Pod：

```bash
kubectl -n cilium-lab run client-broken --image=busybox:1.36 --labels=app=client-broken -- sleep 3600 # 创建独立 Pod
kubectl -n cilium-lab wait --for=condition=Ready pod/client-broken --timeout=120s # 等待测试 Pod 就绪
kubectl -n cilium-lab exec pod/client-broken -- wget -qO- --timeout=3 http://web # 预期失败，因为身份不匹配
```

这个 Pod 不受 Deployment 管理，因此标签不会被控制器创建的新副本干扰。实验前后用 `kubectl get pod --show-labels` 确认实际标签。

排查：

```bash
kubectl -n cilium-lab get pod --show-labels # 看 Kubernetes 标签
kubectl -n kube-system exec ds/cilium -- cilium-dbg endpoint list # 看 identity 是否变化
kubectl -n kube-system exec ds/cilium -- cilium-dbg policy get # 看节点策略 revision
hubble observe --namespace cilium-lab --verdict DROPPED --last 20 # 看具体丢弃原因
```

恢复：

```bash
kubectl -n cilium-lab label pod client-broken app=client --overwrite # 修正标签，触发安全身份更新
kubectl -n cilium-lab exec pod/client-broken -- wget -qO- --timeout=3 http://web # 预期恢复
```

复盘重点：策略匹配的是身份标签，不是 Deployment 名称或你主观认为的“这个 Pod 属于 client”。

## 命令字典

| 命令 | 作用 | 正常结果 | 异常先看 |
|---|---|---|---|
| `cilium status --verbose` | 集群级健康摘要 | agent/operator/Hubble OK | 首个失败组件 |
| `cilium connectivity test` | 端到端功能测试 | 测试通过 | 失败场景对应日志 |
| `cilium sysdump` | 收集诊断包 | 生成压缩文件 | 分享前脱敏 |
| `cilium-dbg status` | 单节点 agent 细节 | Controllers healthy | Kubernetes、BPF、IPAM |
| `cilium-dbg endpoint list` | endpoint/identity 状态 | ready | regeneration 和 policy revision |
| `cilium-dbg service list` | Service map | 与 EndpointSlice 对应 | 控制面同步 |
| `cilium-dbg policy get` | 当前策略 | revision 收敛 | selector 和 regeneration |
| `cilium-dbg monitor --type drop` | 实时看数据面 drop | 显示原因 | 生产注意输出量 |
| `cilium-dbg bpf map list` | 看 BPF map | 容量和条目合理 | pressure、内存和 GC |
| `hubble observe` | 查询流事件 | 有源/目标/verdict | Relay、过滤条件和缓冲 |

具体 debug 子命令在不同版本可能变化，先执行 `--help` 并以当前版本文档为准。

## 在 AIOps 中的作用

Cilium/Hubble 可以把 Kubernetes 标签、identity、Node、Service 和实际网络流关联起来：

```text
告警：checkout -> payment 超时
  -> Hubble 查源/目标流
  -> verdict DROPPED / FORWARDED（处置结果：丢弃或转发）
  -> endpoint identity 和 policy revision（端点身份和策略修订号）
  -> Service map / backend（服务映射表及后端）
  -> Node route / tunnel / conntrack map（节点路由、隧道、连接跟踪映射表）
  -> 应用日志和 trace（链路追踪）
```

重点监控方向：

| 信号 | 说明 |
|---|---|
| agent/operator ready | 控制组件是否健康 |
| endpoint regeneration | 策略或数据面收敛延迟 |
| drop reason | policy、CT、路由等丢包原因 |
| `cilium_bpf_map_pressure` | map 接近容量 |
| conntrack GC | 新连接与回收压力 |
| Hubble flows/s 和 lost events | 观测容量是否足够 |
| policy revision | 节点是否收敛到最新策略 |
| IPAM available/used | 地址容量 |
| clustermesh readiness | 多集群连接状态 |

Hubble metrics 和 Cilium 自身 metrics 目的不同：前者描述工作负载网络行为，后者描述 Cilium 组件和数据面健康。

## 常见故障排查

### 节点 NotReady，Cilium agent 起不来

- 检查内核、cgroup、bpffs、权限和 Helm 值。
- 看 agent init/container 日志和宿主机 `dmesg`。
- kind/Docker Desktop 场景检查虚拟机内核能力和资源限制。

### Endpoint 长期 not-ready/regenerating

- 看 endpoint list 的状态和 policy revision。
- 查 agent 日志中的 BPF 编译/加载和 map 错误。
- 检查策略复杂度、identity 数和 CPU。

### Service 有 backend 但不通

- 对照 EndpointSlice 与 `cilium-dbg service list`。
- 看 Hubble verdict 和 drop reason。
- 查 service/backend map、conntrack 和路由。
- kube-proxy replacement 场景检查 NodePort/DSR 配置。

### `CT: Map insertion failed`

- 定位哪个 Node 和哪个 map pressure 高。
- 查连接创建速率、重试风暴和 GC 指标。
- 评估 map 扩容的内存成本，先处理异常流量。

### Hubble 看不到流量

- 确认 Pod 由 Cilium 管理。
- 确认 agent Hubble、Relay 和 CLI 连接。
- 放宽 namespace/pod/verdict 过滤条件。
- 检查事件缓冲覆盖或 lost events。

### L7 policy 后出现 503

- 确认流量已 REDIRECTED 到 Envoy。
- 看 agent/Envoy 日志和 proxy port。
- 检查 backend、HTTP 规则和证书。
- 区分 Envoy 生成的 503 与应用返回的 503。

### 跨节点通断不稳定

- 确认 routing mode 和隧道端口。
- 查 MTU、Node IP、底层丢包和回程路由。
- 对比同节点与跨节点路径，抓包缩小范围。

## 生产设计检查单

### 内核和宿主机

- 明确最低内核和发行版支持。
- bpffs、cgroup v2、sysctl 和内核模块满足要求。
- 评估 BPF/JIT、内核内存和 map 上限。
- 节点镜像升级不能悄悄改变关键内核能力。

### 网络和 IPAM

- 选择 tunneling 或 native routing 的依据可解释。
- PodCIDR/ServiceCIDR 与现有网络不重叠。
- MTU 包含全部封装和加密开销。
- IPAM 与云子网/ENI 配额有容量告警。

### Service 和策略

- 是否替换 kube-proxy经过专门验证。
- 默认拒绝、DNS、控制面和监控流量有基线策略。
- L7 policy 的 Envoy 资源和故障面经过压测。
- Clusterwide policy 有审批、审计和快速回滚。

### 可观测性和容量

- Hubble Relay 高可用、事件容量和导出策略。
- BPF map pressure、conntrack、drop 和 endpoint regeneration 告警。
- `cilium sysdump` 有脱敏和留存流程。
- 大规模 Service、backend、identity 和 policy 经过压测。

### 升级和回滚

- 阅读目标版本升级说明和兼容矩阵。
- 先测试集群，再小批节点滚动。
- 验证现有连接、新连接、Service、policy、DNS、NodePort 和 Hubble。
- kube-proxy replacement 迁移保留恢复 kube-proxy 的方案。
- CRD、Helm values、CiliumNode 和策略都要备份。

## 生产事故题

题目：发布一条集群级策略后，只有部分节点上的新连接失败，旧连接大多正常，Hubble 显示部分节点 `CT: Map insertion failed`，你怎么处理？

回答框架：

1. 暂停策略继续发布和自动扩容，限定受影响节点/namespace/Service。
2. 保存 Hubble flow、drop reason、endpoint policy revision、map pressure、agent 日志和节点资源。
3. 区分策略本身拒绝与 conntrack map 插入失败。
4. 查新连接速率、重试风暴、map 上限和 GC，比较健康节点。
5. 必要时回滚策略降低流量放大，隔离节点并按容量方案调整。
6. 验证新旧连接、map pressure、lost events 和业务 SLI。
7. 复盘策略压测、map 容量基线、重试预算和分批发布门禁。

## 面试怎么讲

### 30 秒回答

Cilium 是基于 eBPF 的 Kubernetes CNI、Service、网络策略和可观测方案。agent 监听 Kubernetes 对象，把 endpoint、identity、policy 和 Service 状态写入 BPF program/map；包在内核 hook 上完成策略和转发。Hubble 从数据面事件提供流量 verdict 和 drop reason。生产重点是内核兼容、路由/IPAM、BPF map 容量、策略复杂度、Hubble 容量和 kube-proxy replacement 回滚。

### 3 分钟回答

先讲控制面与数据面：operator 做集群级控制，agent 每节点管理 endpoint 和 eBPF；程序在 tc、XDP、cgroup/socket 等 hook 处理包，map 保存 Service、identity、policy 和 conntrack。再讲路径：Pod 访问 Service 时先查 BPF LB map 选 backend，再按 identity 执行策略，跨节点走隧道或原生路由。然后讲可观测：Hubble server 在 agent 内，Relay 聚合多节点 flow，能区分 FORWARDED、DROPPED 和 REDIRECTED。最后讲生产取舍：eBPF 不是免费性能，map 消耗内存，L7 引入 Envoy，kube-proxy replacement 需要完整兼容测试和回滚。

## 核心面试题与递进追问

### 1. eBPF program 和 map 有什么区别？

参考答案：program 是在 hook 上执行的逻辑；map 是内核与用户态共享的状态。agent 更新 map 可以改变 Service backend 或 policy，而不必为每条状态都重新编译程序。

追问：map 满了会怎样？

回答要点：插入失败会影响新 Service/backend、policy 或 conntrack 状态，具体取决于 map；应通过 pressure 和 drop reason 定位，评估 GC、流量和容量，不能盲目统一放大。

### 2. Cilium 为什么使用 identity？

参考答案：Pod IP 会变化，labels 表达工作负载身份。Cilium把安全标签映射为 identity，策略匹配 identity，使 Pod 重建后安全意图保持。

追问：标签越多越好吗？

回答要点：高基数和频繁变化标签会增加 identity、策略计算和分发压力，只应把安全相关标签纳入策略。

### 3. kube-proxy replacement 替换了什么？

参考答案：用 eBPF 实现 Kubernetes Service 的 ClusterIP、NodePort 等转发，不再依赖 kube-proxy 编程的传统规则。它不替代 CoreDNS、Ingress 或应用负载均衡全部能力。

### 4. Hubble 显示 FORWARDED，为什么请求仍超时？

参考答案：FORWARDED 只说明观察点的数据面允许并转发，目标应用可能没监听、回程被丢、上层协议超时或后续节点失败。要继续看反向流、TCP flags、目标日志和 trace。

### 5. tunneling 和 native routing 怎么选？

参考答案：tunneling 对底层要求低但有封装/MTU成本；native routing 路径更直接，但底层必须路由 PodCIDR。选择取决于云网络、路由能力、规模、性能和团队排障能力。

### 6. Calico 与 Cilium 怎么选？

参考答案：Calico 的 BGP/IPAM、多数据平面和策略治理成熟；Cilium 以 eBPF Service/Policy 和 Hubble 可观测见长。需要用真实内核、网络、策略规模、Service 数、运维工具和迁移风险做 PoC，不按营销标签决定。

## 系统设计题

设计一个 1000 节点、20 万 Pod、需要默认拒绝和实时流量观测的 Cilium 集群：

- 内核/节点镜像标准。
- IPAM 和地址容量。
- routing mode、MTU 和 BGP/底层路由。
- kube-proxy replacement 与 Service/backend map 大小。
- identity、policy 和 L7 proxy 规模。
- Hubble Relay、metrics、flow export 和数据保留。
- agent/operator 高可用和资源 requests。
- BPF map 内存预算、conntrack 和 GC。
- 分批升级、兼容测试和回滚。
- 故障注入与 SLO 验收。

## 学习检查清单

- [ ] 能解释 eBPF program、hook、verifier 和 map。
- [ ] 能画出 cilium-agent 到内核数据面的关系。
- [ ] 能解释 endpoint 和 security identity。
- [ ] 能画出 Pod、Service 和跨节点数据路径。
- [ ] 能比较 tunneling 与 native routing。
- [ ] 能解释 kube-proxy replacement 的边界。
- [ ] 能使用 Hubble 判断 FORWARDED、DROPPED 和 REDIRECTED。
- [ ] 能完成默认拒绝、精确放行和标签故障实验。
- [ ] 能排查 endpoint、Service map、policy、CT map 和 MTU。
- [ ] 能设计内核、IPAM、容量、观测、升级和回滚方案。

## 清理实验

```bash
kubectl delete namespace cilium-lab # 清理策略和工作负载
kind delete cluster --name cilium-lab # 删除学习集群
```

## 老师带你追一个包：先分清决定、状态和证据

我们从 client 访问 web 开始。Kubernetes 告诉 Cilium 哪些 Pod 和 Service 存在；agent 把所需信息变成节点里的程序和状态表；包经过内核挂点时，程序读取表，决定选择后端、放行或丢弃。控制器不必为每个包去问 Kubernetes API，否则控制面会成为流量瓶颈。

Hook（挂点）是内核允许执行某类扩展逻辑的位置，Program（程序）是执行规则，Map（映射表）保存可更新状态。可以把程序理解成查票规则，把 map 理解成当前票务和座位数据。规则相同，状态表不同，包的结果就可能不同。

因此 Kubernetes EndpointSlice 正确不证明每台节点的 Service map 已同步。发生局部故障时，要找到实际源节点和目标节点，再观察那两台的 agent。`kubectl exec ds/cilium` 可能选择某一个 DaemonSet Pod，不保证就是出问题的节点；先用 `kubectl -n kube-system get pods -l k8s-app=cilium -o wide` 定位，再指定具体 Pod 查询。

### 身份标签为什么会改变安全结果

Pod 名、Deployment 名和安全标签是三个概念。策略选择的是标签表达的身份，名字看起来像 client 不代表符合 `app: client`。标签故障实验的价值正是让你观察身份变化、策略修订与流量结果之间的联系。

Identity（安全身份）减少了 IP 频繁变化对策略的影响，但身份分配和传播仍需要时间。修改标签后立即请求可能看到短暂过渡状态，所以要同时记录 endpoint ready、policy revision 和结果，而不是只请求一次下结论。

标签也不是越多越好。每次发布都给安全身份加入随机构建号，会制造更多身份与策略变化。区分用于业务检索的标签和真正参与授权的标签，能减少控制面更新与内核状态压力。

### 观测到了放行，为何业务还失败

Hubble 的 FORWARDED 是某个观测点的结论，说明这一处允许继续走。下一个节点、目标进程、返回路径或应用协议仍可能失败。你要继续看双向流、连接标志、目标监听和应用日志。

DROPPED 也需要原因：policy denied 指向策略，CT 插入失败指向连接跟踪状态，路由问题指向到达路径。把所有丢包都归类成安全组，会导致错误修复。Ring buffer（环形缓冲）满后旧事件可能被覆盖，收集不到证据要同时检查观测丢失，不能当作没有流量。

## 容量与迁移课堂：eBPF 不等于无限容量

每个 Service 后端、身份和连接状态都要占内存。高新建连接率、长超时或异常重试会让 conntrack（连接跟踪）表增长。先查连接生命周期与回收，再评估 map 上限；扩表消耗更多节点内核内存，不是没有代价的万能开关。

封装路由让底层只需认识节点地址，但需要额外包头和合适 MTU；原生路由减少封装，却要求底层知道 Pod 网段。选择时同时评估网络团队的路由控制、云平台限制和故障排查工具，不用一条性能宣传代替设计。

替换 kube-proxy 是一次 Service 数据面变更。至少验证 ClusterIP、NodePort、外部流量、源地址保留、长连接、DNS 和云负载均衡健康检查，并记录恢复原实现的条件。只验证 Pod 互相 ping 成功，会漏掉最关键的 Service 行为。

面试三分钟回答中，把 client→Service→后端的路径讲清，再用默认拒绝与精确放行实验解释 identity。追问 map 满时，给出节点定位、pressure、连接速率、回收和内存预算；追问 Hubble 无流时，先说明覆盖范围与丢失，再讨论应用。最终交作业要有配置、节点对应、允许/拒绝/恢复三份证据。

## 进阶课堂：从一条 Service 请求拆出三个地址

老师让你访问 `http://web`，请先写出三个不同地址：DNS 返回的 Service ClusterIP、被选中的后端 Pod IP、承载后端的 Node IP。域名不是第四台服务器，ClusterIP 也不一定对应真实网卡上监听的进程；它是服务入口标识，由数据面把访问转换或重定向给后端。封装模式再使用 Node IP 运送跨节点流量。

不同 Cilium 功能与内核挂钩位置可能在套接字或报文处理阶段完成服务选择，因此不能假设抓包一定能看到一份原始 ClusterIP 报文再看到一份 DNAT 报文。抓包位置决定你能看见哪个阶段：应用命名空间、主机 veth、隧道接口、物理网卡代表不同观测点。先说明模式和观测点，再解释没有看见某地址的意义，不用一张截图推翻整个服务机制。

连接跟踪保存已经建立的流与所选后端等状态。新建连接可以选择新后端，已建立连接则通常需要维持原有对应关系，不能在半条 TCP 流中随便换一台不认识该连接的服务器。后端下线时，新连接的选择与旧连接是否还能排空，是两个验收项目。长连接、HTTP/2 多路复用和连接池可能让流量长期停留在少数实例，不能只按请求数量想象“每个请求都会重新均衡”。

查服务故障时，先对照 EndpointSlice 中就绪地址，再查看实际源节点的 Service map 和后端；如果直达 Pod 成功而 ClusterIP 失败，优先验证服务转发状态，但仍记录策略与返回路径。直接访问 Pod 不完全等价于通过服务入口，源地址和处理位置可能不同，所以它是定位用对照，不是最终修复方案。

## 身份与策略课堂：允许到达 IP，不等于允许所有业务动作

L3 是网络地址层，L4 是 TCP/UDP 端口层，L7 是 HTTP 等应用协议层。只允许到 `web:80` 表示放行这个端口，不会自动区分读取订单和删除订单。需要 HTTP 方法或路径级限制时，可以评估支持的 L7 规则，但它依赖协议识别与代理处理，增加 CPU、内存、延迟和故障环节。

加密又带来边界：端到端 TLS 把 HTTP 内容放进密文，普通网络观测不能凭空读取 URL 或正文。要做内容级检查，需设计受支持的 TLS 终止或检查机制，并承担证书、信任、性能和隐私责任。eBPF 在内核执行不意味着它绕过密码学，也不意味着所有流量都经 Envoy。先画谁加密、谁解密、谁检查，再讨论能观察到什么。

网络身份标签也不替代业务鉴权。`app=client` 被允许访问服务，只说明这类工作负载能建立某类通信，不说明请求中的用户有权访问某张订单。业务仍需验证用户、租户、操作和数据范围。反过来，业务有鉴权也不能替代网络最小权限：被攻陷的 Pod 不应能够随意访问数据库管理端口。

策略允许与拒绝要按所用资源类型理解。Kubernetes NetworkPolicy 主要表达允许集合，Cilium 扩展策略还可能包含显式拒绝等能力；不要把前者“所有允许求并集”的口诀无条件套到扩展拒绝规则。生产落地先确认精确版本与策略类型，再在隔离命名空间跑正向和反向用例。参考 [Cilium 策略概览](https://docs.cilium.io/en/stable/security/policy/index.html)，现场版本差异不能被 `stable` 页面覆盖掉。

## DNS 与外部依赖课堂：域名策略怎么知道今天的地址

外部告警 API 可能今天解析到地址甲、明天解析到地址乙，手工写死 IP 会变成运维负担。`toFQDNs` 的 FQDN 意思是完整域名。Cilium 的相关机制通过受控 DNS 观测学习域名对应的 IP，再把策略许可关联到这些地址；它不是把每一个业务包里的目的 IP 自动反查为可信域名。DNS 请求要能走到正确的代理/解析路径，缓存与有效期也影响结果。

把故障拆开：应用是否真正发起了 DNS 查询，查询有没有被允许，响应有没有到达，agent 的域名缓存是否学到了地址，对应策略是否更新，新连接使用的是不是这个地址。直接使用硬编码 IP、独立的加密 DNS 通道或应用自己的长期缓存，可能与原设计的观测链不一致。不能看到“解析器正常”就宣布域名策略正常。

缓存 TTL 是 Time To Live（生存时间），表示记录在一定时间范围内仍可使用；它不是永远可靠的授权证明。地址可能复用，同一个托管 IP 也可能承载多个域名。只按 DNS 学到的 IP 放行，不自动获得 HTTP 主机名和用户级授权。域名白名单应尽量精确，结合应用 TLS 验证和业务鉴权，不把一个宽泛通配域名当成数据防泄漏体系。具体缓存、最小 TTL 和连接保留行为请对照目标版本的 [L3 域名策略](https://docs.cilium.io/en/stable/security/policy/layer3/) 与 [L7 DNS 规则](https://docs.cilium.io/en/stable/security/policy/layer7/)。

## 实验复盘升级：让“标签修好了”成为有证据的结论

继续前文 `client-broken` 实验，不另建生产资源。基础前提是默认拒绝与精确允许均存在，正常 `client` 仍能访问 `web`，故障 Pod 已 Ready。先执行 `kubectl -n cilium-lab get pods -o wide --show-labels` 保存身份与落点，再用 `kubectl -n kube-system get pods -l k8s-app=cilium -o wide` 找到源和目标节点各自的 agent Pod。接下来将命令中的 agent 名替换成真实观测值，不使用随机选择的 DaemonSet Pod冒充目标节点。

```bash
kubectl -n kube-system exec <目标节点的-cilium-pod> -- cilium-dbg endpoint list
kubectl -n kube-system exec <目标节点的-cilium-pod> -- cilium-dbg policy get
hubble observe --namespace cilium-lab --last 20
```

尖括号只是待替换说明，不可以原样执行。`endpoint list` 查看本节点端点及身份，`policy get` 查看节点接收的策略状态，Hubble 观察近期流。记录源/目标、协议、时间与 verdict（处理结论），不只截一行含 `DROPPED` 的历史事件。先发起一次带三秒超时的新请求，再在同一时间窗观察；旧事件不能说明刚修改后的结果。

修复标签之后允许状态传播和端点再生成，有限次数重试，例如每两秒观察一次、最多三十秒。若仍失败，不继续反复改标签：检查实际标签、正确节点、端点是否就绪、策略是否加载、DNS 是否可用，以及 Hubble 自身是否丢失事件。恢复必须满足正常客户端和修复客户端都能请求成功；随后删除独立 `client-broken` Pod，完成全部实验再删除专用 `cilium-lab` 命名空间，停止 Hubble 的端口转发终端。只清理本实验创建的对象。

## 容量与事故推理：每秒请求不多，为什么连接表会满

假设一个采集器每秒新建一千条短连接，而连接跟踪状态平均保留六十秒，粗略会累积约六万条活跃或待清理状态；这只是解释趋势，实际表结构、协议状态和清理行为按版本确认。若改成连接复用，业务请求数不变，连接新建与状态增长却可能显著下降。因此调容量先区分 QPS（每秒请求数）、CPS（每秒新建连接数）、同时连接数和状态保留时间。

BPF map 使用内核内存，扩大会占更多资源；部分 map 的实现和淘汰行为不同，不能把某一张表的经验套到全部映射。看见插入失败时保存具体 map、当前容量、失败速率、节点内存、流量模式与最近配置。若根因是客户端无节制重连，单纯扩表可能只把事故推迟；若容量基线不足，变更应评估内存与重启要求，再在小范围实施。不要为了清表而全节点重启，旧连接和取证都会受到影响。

设计三百节点平台时，先选择路由/IPAM、地址空间和故障域，再考虑身份规模、策略更新频率、Service 后端数量、连接表和 Hubble 事件量。给每个 Pod 加一个唯一安全标签可能扩大身份与策略状态，业务可观测标签也未必适合全部进入安全身份；选择哪些标签应经过支持的配置与安全评审。指标维度同样要治理，不能把每个连接五元组永久当指标标签。

最后回答生产取舍：我会先在隔离集群验证内核和功能矩阵，再用相同业务路径对比允许/拒绝、新旧连接、节点故障与升级收敛。迁移回滚不仅是 Helm 退一个版本，还涉及 kube-proxy 模式、BPF 状态、IPAM、CRD 和正在运行的连接。AIOps 首先自动整理证据与影响面；是否改网络基础层由经过审批的运行手册决定，不由模型根据性能宣传直接切换模式。

## 学习证据

- `kind-cilium.yaml` 和安装版本记录。
- 一张 eBPF Service + policy 数据路径图。
- CNP 默认拒绝和精确放行 YAML。
- Hubble FORWARDED/DROPPED 脱敏记录。
- 一份 identity 标签变化故障复盘。
- 一份 BPF map/conntrack 容量估算。
- 一份 kube-proxy replacement 迁移与回滚方案。

## 本文边界与下一步

本文覆盖 Cilium 1.20.0 的 Kubernetes 主线，不展开 verifier 指令级证明、所有 helper、XDP 驱动实现、Cluster Mesh 和 Gateway API 全部高级配置。本次没有实际运行 1.20 集群；云 CNI chaining、kube-proxy-free、ClusterMesh、BGP 与 Gateway 组合仍需在目标平台实测。下一步结合 [Kubernetes](./kubernetes.md)、[Calico](./calico.md)、[etcd](./etcd.md)、[网络基础](../foundation/networking.md) 和 [OpenTelemetry](../observability/opentelemetry.md)，把控制面、网络数据面和应用链路证据合并分析。
