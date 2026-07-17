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

本文以 Cilium 1.19 stable 文档为主，实验固定到官方 quick install 当前给出的 1.19.5。生产升级前必须核对 Kubernetes、Linux 内核、发行版、Cilium CLI、Helm Chart 和数据平面功能矩阵。

## 官方知识地图

```text
Cilium
  -> CNI and IPAM
  -> eBPF data plane
     -> programs
     -> maps
     -> endpoint / identity
     -> service load balancing
     -> connection tracking
  -> Routing
     -> VXLAN / Geneve
     -> native routing
     -> BGP control plane
  -> Policy
     -> Kubernetes NetworkPolicy
     -> CiliumNetworkPolicy
     -> CiliumClusterwideNetworkPolicy
     -> L3 / L4 / L7 / DNS
  -> kube-proxy replacement
  -> Hubble
     -> flow events
     -> Relay / UI
     -> metrics
  -> Operations
     -> status / connectivity test
     -> sysdump
     -> BPF map pressure
     -> upgrades and rollback
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
用户态 cilium-agent
  -> 根据 Kubernetes 对象生成期望状态
  -> 加载 / 更新 eBPF programs
  -> 写 BPF maps

网络包
  -> tc / XDP / cgroup / socket hook
  -> eBPF program
  -> 查询 identity / policy / service / conntrack maps
  -> forward / redirect / drop
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

需要 L7 HTTP、Kafka、DNS 重定向或 Gateway/Ingress 等能力时，Cilium 可使用 Envoy 代理。L3/L4 eBPF 转发与 L7 proxy 是不同路径，看到 `server: envoy` 或 proxy port 才说明流量进入代理。

### Hubble、Relay 和 UI

- Hubble server 嵌入 cilium-agent，读取本节点流事件。
- Hubble Relay 聚合多节点流。
- Hubble CLI 查询流。
- Hubble UI 展示服务依赖和流量。

Hubble ring buffer 有容量，长时间后旧事件会被覆盖。它适合实时/近期网络证据，不是无限保留的审计仓库。

## Security Identity：策略为什么不绑 Pod IP

Cilium 从安全相关 labels 计算 identity。同一组相关标签的 endpoint 可以共享 identity；策略主要匹配 identity，而不是不断变化的 Pod IP。

```text
Pod labels
  -> Cilium 计算 security identity
  -> endpoint 绑定 identity
  -> policy 编译为 identity 到 identity 的规则
  -> 包携带或关联源 identity
  -> 目标节点按 identity 执行策略
```

好处：Pod 重建和 IP 变化时，只要身份标签不变，策略意图保持稳定。

风险：

- 把高基数、频繁变化的标签纳入身份会增加 identity 和 policy 更新。
- selector 写错会让 endpoint 获得意外策略。
- identity 传播落后或分配异常会导致临时策略不一致，需要看 policy revision 和 endpoint 状态。

## 同节点 Pod 到 Pod

```text
Pod A
  -> veth / endpoint eBPF
  -> 查源 identity、policy、conntrack
  -> 本节点目标 endpoint
  -> 目标 policy
  -> Pod B
```

同节点路径通常不需要经过物理网卡或 Overlay，但仍受策略、Service 翻译和 endpoint 状态影响。

## 跨节点 Pod 到 Pod

### 封装模式

Cilium 默认可使用 VXLAN 或 Geneve 隧道：

```text
Pod A packet
  -> source-node eBPF policy
  -> VXLAN/Geneve encapsulation
  -> underlay routes by Node IP
  -> target-node decapsulation
  -> target policy
  -> Pod B
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
客户端访问 ClusterIP:port
  -> eBPF service lookup
  -> service map 找到 frontend
  -> backend map 选择 Pod IP:port
  -> conntrack / affinity 记录
  -> 转发到本地或远端 backend
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

## 安装实验：kind + Cilium 1.19.5

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
cilium install --version 1.19.5 # 使用 Cilium CLI 安装官方 quick install 当前固定版本
cilium status --wait # 等 agent、operator 和 endpoint 健康
cilium connectivity test # 运行官方连通性和策略测试
kubectl get nodes -o wide # 节点应为 Ready
```

启用 Hubble Relay/UI：

```bash
cilium hubble enable --ui # 开启 Hubble Relay 和 UI
cilium status --wait # 确认 Hubble 状态正常
hubble status # CLI 能连接 Relay
```

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
  -> verdict DROPPED / FORWARDED
  -> endpoint identity 和 policy revision
  -> Service map / backend
  -> Node route / tunnel / conntrack map
  -> 应用日志和 trace
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

## 学习证据

- `kind-cilium.yaml` 和安装版本记录。
- 一张 eBPF Service + policy 数据路径图。
- CNP 默认拒绝和精确放行 YAML。
- Hubble FORWARDED/DROPPED 脱敏记录。
- 一份 identity 标签变化故障复盘。
- 一份 BPF map/conntrack 容量估算。
- 一份 kube-proxy replacement 迁移与回滚方案。

## 本文边界与下一步

本文覆盖 Cilium 1.19 的 Kubernetes 主线，不展开 verifier 指令级证明、所有 helper、XDP 驱动实现、Cluster Mesh 和 Gateway API 全部高级配置。下一步结合 [Kubernetes](./kubernetes.md)、[Calico](./calico.md)、[etcd](./etcd.md)、[网络基础](../foundation/networking.md) 和 [OpenTelemetry](../observability/opentelemetry.md)，把控制面、网络数据面和应用链路证据合并分析。
