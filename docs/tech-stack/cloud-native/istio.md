# Istio 深讲

> 学习目标：理解服务网格的数据面与控制面，能安装 Istio、配置一次灰度流量和双向 TLS，并按请求链路排查 503、配置未生效等常见故障。

## 官方资料

- [Istio 官方文档](https://istio.io/latest/docs/)
- [架构说明](https://istio.io/latest/docs/ops/deployment/architecture/)
- [流量管理](https://istio.io/latest/docs/concepts/traffic-management/)
- [安全](https://istio.io/latest/docs/concepts/security/)
- [可观测性](https://istio.io/latest/docs/concepts/observability/)
- [Istio 1.30.3 release](https://istio.io/latest/news/releases/1.30.x/announcing-1.30.3/)
- [受支持版本与 Kubernetes 兼容范围](https://istio.io/latest/docs/releases/supported-releases/)
- [数据面模式](https://istio.io/latest/docs/overview/dataplane-modes/)
- [Ambient 模式](https://istio.io/latest/docs/ambient/overview/)
- [Waypoint](https://istio.io/latest/docs/ambient/usage/waypoint/)
- [Canary 升级](https://istio.io/latest/docs/setup/upgrade/canary/)

本文以官方概念和运维文档为依据，示例用于学习，生产参数要结合版本、容量和变更窗口评审。

## 固定实验版本与兼容边界

| 对象 | 本文锚点 | 边界 |
|---|---|---|
| Istio | 1.30.3 | 本文保留的固定实验版本，不代表当前最新补丁；安装前查受支持版本与安全公告 |
| Kubernetes | Istio 1.30 支持 1.32–1.36 | 不在范围内的集群先查官方支持表，不能只看 CRD 是否能创建 |
| 控制面/数据面版本差 | 控制面最多领先数据面一个 minor；数据面不能领先控制面 | 用 revision canary 分批升级，不要原地覆盖全网格 |
| Ambient | 单集群 production-ready，但功能仍需逐项核对 | ztunnel 主要提供 L4/mTLS；HTTP 路由、L7 授权和 L7 遥测需要 waypoint |

`latest` 文档会继续变化，本文的实验与故障边界按 1.30.3 编写。升级时重新查 supported releases、feature status 和平台说明。

2026-09-08 核查时，官方 `latest` 已指向 1.31 文档。固定实验和现行生产选型要分开：新建环境应选仍受支持且完成安全修复的版本，并同时匹配 Kubernetes 与 Gateway API。官方还明确 Ambient 下 `VirtualService` 属于 Alpha（早期能力），不能与 Gateway API 路由混用；本篇的 subset 故障实验因此限定在 Sidecar 模式。参见 [受支持版本](https://istio.io/latest/docs/releases/supported-releases/)与 [Ambient 七层功能](https://istio.io/latest/docs/ambient/usage/l7-features/)。

## 官方知识地图

```text
Istio（服务网格）
  -> 安装、升级与修订版本
  -> 流量管理
  -> 身份、mTLS 与授权
  -> 指标、访问日志与链路追踪
  -> Sidecar（伴随代理）模式与 Ambient（环境式网格）模式
  -> 运维诊断
```

先学请求如何经过数据面，再学 Istiod 如何下发配置，最后学习流量、安全、观测和排障。`mTLS` 是 mutual TLS，即通信双方都验证证书；`Ambient` 是不向每个 Pod 注入 Sidecar 的网格模式。

## 场景开场

订单服务发布了 v2。你只想让 10% 请求进入新版本，异常时立刻切回 v1，同时还要知道请求在哪一跳变慢。只改 Kubernetes Service 无法表达这些细粒度规则，这正是服务网格要处理的问题。

## 一句话人话版

Istio 把服务间通信交给统一的数据面代理，再由控制面集中下发流量、安全和观测规则。

## 小白可能会问

- Kubernetes 已经有 Service，为什么还需要 Istio？
- Envoy 和 Istiod 分别做什么？
- 开启 mTLS 后为什么服务反而访问失败？
- Sidecar 与 Ambient 应该选哪一种？

## 为什么要学

岗位要求里的微服务、Kubernetes 和 Istio 是一条连续链路。Istio 能提供请求级指标、访问日志和追踪上下文，是 AIOps 做异常检测、影响面分析和根因定位的重要数据来源。

## Istio 是什么

Istio 是服务网格。服务网格不改业务代码的主要逻辑，而是在服务通信路径上增加代理和策略控制。传统 Sidecar 模式由每个工作负载旁的 Envoy 代理流量；Ambient 模式通过节点级 `ztunnel` 和可选的 `waypoint` 代理提供能力。

### Sidecar 与 Ambient 怎么选

| 维度 | Sidecar | Ambient |
|---|---|---|
| 基础路径 | 每个 Pod 一个 Envoy | 每节点 ztunnel，按需部署 waypoint |
| L4/mTLS | Sidecar 提供 | ztunnel 提供 |
| HTTP 路由/L7 授权 | Sidecar 提供 | 必须经过 waypoint |
| 资源形态 | 成本随 Pod 数增长 | L4 成本按节点，L7 成本按 waypoint 范围 |
| 接入方式 | 注入/重启 Pod | Namespace/Workload 加入 ambient，基础 L4 不要求 Sidecar 注入 |
| 迁移风险 | 注入、端口与代理资源 | waypoint 覆盖范围、功能支持与绕过边界 |

新环境可以优先评估 Ambient，但“更少 Sidecar”不等于所有 L7 功能自动存在。先列功能清单，再按 1.30 的 feature status 验证。

## 它解决什么问题

- 按权重、请求头或故障状态路由请求。
- 为服务身份签发证书并启用 mTLS。
- 用授权策略限制服务间访问。
- 统一生成请求指标、访问日志和链路追踪信息。
- 在不修改业务重试逻辑的情况下设置超时、重试和熔断，但必须避免重试风暴。

## 核心原理

### 数据面与控制面

- **是什么**：数据面实际转发请求；控制面 Istiod 计算并下发配置。
- **为什么需要**：把每个服务重复实现的通信策略集中治理。
- **怎么工作**：Kubernetes 资源变化后，Istiod 生成 xDS 配置并推送给代理；xDS 是 Envoy 的动态配置接口集合。
- **怎么看或怎么用**：用 `istioctl proxy-status` 看代理是否与 Istiod 同步，用 `istioctl proxy-config` 看实际配置。
- **坏了怎么查**：先查代理是否注入和就绪，再查 xDS 同步，最后查路由、端点和策略冲突。

### VirtualService 与 DestinationRule

- **是什么**：VirtualService 描述“请求往哪里走”，DestinationRule 描述“到达某个服务后如何分组和连接”。
- **为什么需要**：支持灰度、超时、重试、熔断和负载均衡。
- **怎么工作**：路由先选目标服务与 subset；subset 再根据标签选择 v1、v2 等工作负载。
- **怎么看或怎么用**：用 `istioctl analyze` 检查资源关系，用 `kubectl get endpointslices` 验证后端是否存在。
- **坏了怎么查**：重点核对 host、端口名、subset 标签与 Deployment 标签是否一致。

### 身份、mTLS 与授权

- **是什么**：PeerAuthentication 控制入站 mTLS，DestinationRule 可控制出站 TLS，AuthorizationPolicy 控制谁能访问谁。
- **为什么需要**：网络能连通不等于调用方可信，服务身份用于实施零信任访问。
- **怎么工作**：Istiod 为工作负载签发短期证书，代理握手后按身份和授权策略放行请求。
- **怎么看或怎么用**：检查证书、认证策略和授权策略，观察代理日志中的 TLS 或 RBAC 拒绝信息。
- **坏了怎么查**：确认两端是否都进入网格，避免一端强制 STRICT、另一端仍发送明文。

### 遥测数据

- **是什么**：代理可生成请求数、延迟、错误率、访问日志和追踪信息。
- **为什么需要**：业务故障常跨多个服务，单个 Pod 日志无法还原完整链路。
- **怎么工作**：代理观察经过它的请求，把指标暴露给 Prometheus，并把日志或追踪发送给后端。
- **怎么看或怎么用**：先看成功率、P95 延迟和流量，再按 source、destination、response code 下钻。
- **坏了怎么查**：检查采集目标、Telemetry 配置、追踪采样率和请求头传播。

## 架构和数据流

```text
客户端请求
  -> Ingress Gateway（网格入口网关）
  -> 数据面代理
  -> 目标服务
  -> 下一个数据面代理

Kubernetes 配置
  -> Istiod（管理网格配置和工作负载身份的控制面服务）
  -> xDS 配置推送
  -> 数据面代理

数据面代理
  -> 指标 / 日志 / 追踪
  -> Prometheus / 日志平台 / Trace 后端
```

两种真实请求路径要分开画：

```text
Sidecar（伴随代理）:
源应用 -> 源 Envoy（代理）-> 目标 Envoy（代理）-> 目标应用

Ambient（环境式网格）:
源应用 -> 源节点 ztunnel（四层安全隧道代理）
       -> 可选 waypoint（七层 HTTP 代理）
       -> 目标节点 ztunnel -> 目标应用
```

配置一致性链路是：Kubernetes API 中的期望资源 → Istiod 计算 xDS → Envoy/ztunnel/waypoint 接收实际配置 → Endpoint 与证书持续变化 → 请求按数据面真实状态转发。`proxy-status` 显示 `SYNCED` 只说明配置同步，不证明后端健康、路由正确、证书未过期或业务返回成功。

## 安装与启动

学习环境可用 1.30.3 的 `demo` 或 `ambient` profile；`demo` 明确不用于生产。生产环境应按容量和功能显式配置控制面、网关、ztunnel/waypoint 与升级策略。

```powershell
istioctl version # 客户端应固定为 1.30.3，并显示可连接集群中的版本
istioctl install --set profile=ambient -y # 只在一次性学习集群安装 Ambient profile
kubectl get pods -n istio-system # 检查实际安装的控制面和节点数据面是否就绪
```

## 配置详解

下面把带 `version: v1` 标签的工作负载定义为一个 subset，并将 90% 流量发往 v1、10% 发往 v2。

本节 YAML 按 Sidecar 模式讲解，L7（应用层）路由由 Envoy 执行。Ambient 学习应按对应版本的 Gateway API `HTTPRoute` 与 waypoint 文档配置，不能把下面这份 VirtualService 当作两种模式完全通用的生产方案。

```yaml
apiVersion: networking.istio.io/v1
kind: DestinationRule
metadata:
  name: order-api
spec:
  host: order-api # 必须能解析到目标 Kubernetes Service
  subsets:
    - name: v1 # 路由规则引用的版本名
      labels:
        version: v1 # 选择 Pod 上 version=v1 的工作负载
    - name: v2
      labels:
        version: v2
---
apiVersion: networking.istio.io/v1
kind: VirtualService
metadata:
  name: order-api
spec:
  hosts:
    - order-api
  http:
    - route:
        - destination:
            host: order-api
            subset: v1
          weight: 90 # 大约九成请求进入 v1
        - destination:
            host: order-api
            subset: v2
          weight: 10 # 大约一成请求进入 v2
```

## 命令 / 配置 / API 字典

| 名称 | 作用 | 常用写法 | 正常结果 | 常见坑 |
|---|---|---|---|---|
| `istioctl analyze` | 静态检查网格配置 | `istioctl analyze -A` | 没有 Error 级问题 | 通过不代表真实后端一定健康 |
| `proxy-status` | 查看 xDS 同步 | `istioctl proxy-status` | 状态为 SYNCED | 代理版本和控制面修订版本不匹配 |
| `proxy-config` | 查看代理生效配置 | `istioctl pc routes POD -n NS` | 能看到预期路由 | 只看 YAML，不看代理实际状态 |
| `PeerAuthentication` | 控制入站 mTLS | `mode: STRICT` | 网格内双向认证 | 非网格客户端会失败 |
| `AuthorizationPolicy` | 控制服务访问 | `action: ALLOW` | 只有规则允许的身份可访问 | 空 ALLOW 规则可能拒绝全部请求 |

## 在 AIOps 中的作用

Istio 提供服务拓扑、请求率、错误率、延迟和身份信息。告警平台可据此识别“某版本发布后 5xx 上升”，根因系统可把异常定位到 source、destination、version，自动化平台则可回滚 VirtualService 权重。

## 生产高可用、容量、安全与升级

### 高可用与容量

- Istiod 多副本和跨故障域只能保护控制面；ztunnel 是节点级故障域，waypoint/Ingress Gateway 需要独立副本、PDB 和反亲和。
- Root/Intermediate CA、信任域和证书轮换属于身份根。控制面活着但 CA 或时间异常，mTLS 仍可能全线失败。
- 容量分别计算 Istiod 的 xDS fan-out/config size、Sidecar 或 ztunnel 的连接/CPU/内存、waypoint 的 L7 QPS/延迟，以及网关的入口峰值。
- Telemetry 的 source/destination/response code 很有价值，但高基数标签、全量访问日志和 100% trace 会迅速增加成本。监控采样率、丢弃、延迟和数据新鲜度。

### 安全策略的四层

1. `PeerAuthentication`：工作负载之间是否要求 mTLS。
2. `RequestAuthentication`：如何验证 JWT 等最终用户凭据。
3. `AuthorizationPolicy`：哪个 workload identity 可以访问哪个动作。
4. 信任基础：trust domain、Root/Intermediate CA、Secret/SDS 与轮换。

策略 attachment（附着位置）在 Sidecar 与 waypoint 下不同。先确认流量确实经过承载策略的代理，再判断 ALLOW/DENY 是否生效；不能用“配置已创建”代替数据面验证。

### Canary 升级与回滚

安装新 revision，给少量 Namespace/Workload 切 revision tag，验证 xDS、代理镜像、Webhook、CRD、Gateway、mTLS、关键 SLI 和回退路径，再逐批迁移。控制面升级后，不要让新数据面领先旧控制面；旧 revision 只在确认没有代理依赖后删除。CRD 转换、根证书和策略语义变化可能不能靠回切标签完全回滚，因此升级前要保存清单、信任材料和流量基线。

## 入门实验：离线生成 Istio 安装清单

### 实验目标

在不修改集群的情况下用固定 1.30.3 客户端生成 Ambient profile 清单，并确认里面包含 Istiod 与 ztunnel。

### 实验步骤

1. 从[官方发布页](https://github.com/istio/istio/releases)安装与你的集群版本兼容的 `istioctl`。
2. 执行：

```powershell
istioctl version --remote=false # 必须显示 1.30.3
istioctl manifest generate --set profile=ambient | Out-File -Encoding utf8 istio-ambient.yaml # 只生成 YAML
Select-String -Path istio-ambient.yaml -Pattern 'name: istiod|name: ztunnel' # 搜索控制面与节点数据面
```

### 验证结果

`istio-ambient.yaml` 非空，搜索结果包含 `istiod` 和 `ztunnel`。这只说明固定版本客户端能渲染清单，不证明集群兼容或数据面可用。

### 如果没有成功

1. 用 `istioctl version --remote=false` 检查客户端是否可执行。
2. 确认 PowerShell 当前目录可写。
3. 若字段报错，检查是否混用了其他版本文档中的 profile 参数。
4. 生成成功但安装失败时，再查 Kubernetes 权限、CRD 和镜像拉取。

### 清理

离线生成没有创建集群资源。保留 `istio-ambient.yaml` 和 `istioctl version --remote=false` 输出作为版本证据；若文件包含环境定制的域名或证书引用，提交前先脱敏。

## 基础实验：Ambient L4、waypoint 与真实请求

仅在可丢弃的 Kubernetes 1.32–1.36 集群执行。前置条件是已解压 Istio 1.30.3 官方发行包，并在其根目录运行命令。

```powershell
istioctl version --remote=false
istioctl install --set profile=ambient --skip-confirmation
kubectl -n istio-system rollout status deployment/istiod --timeout=5m
kubectl -n istio-system rollout status daemonset/ztunnel --timeout=5m

kubectl create namespace istio-lab
kubectl label namespace istio-lab istio.io/dataplane-mode=ambient
kubectl apply -n istio-lab -f samples/bookinfo/platform/kube/bookinfo.yaml
kubectl apply -n istio-lab -f samples/sleep/sleep.yaml
kubectl -n istio-lab wait --for=condition=available deployment --all --timeout=5m

kubectl -n istio-lab exec deployment/sleep -c sleep -- `
  curl -sS -o /dev/null -w '%{http_code}' http://productpage:9080/productpage
istioctl ztunnel-config workloads
```

预期 HTTP 状态是 200，ztunnel 列表能看到实验工作负载且协议为 HBONE，即承载双向安全通信的隧道协议。这里只证明请求与配置路径；还要按下文核对同一时间窗的源、目标身份和加密遥测，才能声称实际请求使用了 mTLS，更没有证明 L7 路由。

创建 waypoint 前先执行 `kubectl get crd gateways.gateway.networking.k8s.io`。它需要 Gateway API 自定义资源；若缺少，只在这套一次性集群按 [Istio 1.30 waypoint 前置步骤](https://istio.io/v1.30/docs/ambient/usage/waypoint/)安装该文指定的 Gateway API 1.5.1 实验通道清单。已有 CRD 时先核对兼容性，不覆盖共享网关定义。然后创建并绑定 waypoint：

```powershell
istioctl waypoint apply -n istio-lab --enroll-namespace --wait
kubectl -n istio-lab get gateway,services,pods
kubectl -n istio-lab exec deployment/sleep -c sleep -- `
  curl -sS -o /dev/null -w '%{http_code}' http://productpage:9080/productpage
```

预期仍为 200，并能看到 waypoint Gateway/Pod。用指标与访问日志确认请求经过 waypoint；只看对象存在还不够。

若失败，按顺序检查集群版本、CNI、istiod/ztunnel、Namespace 标签、Service/EndpointSlice、waypoint 状态、DNS 和策略。先运行 `istioctl analyze -A`，再看实际路由与日志。

## 故障注入实验：不存在的 subset 导致 503

本实验使用 Sidecar，避免把 Ambient 的 Alpha VirtualService 行为当作稳定基础。先完成并清理上一节 Ambient 实验的 `istio-lab` Namespace；确认这是可丢弃集群，再安装 Sidecar 默认配置，并重新创建实验应用。不要给同一个 Namespace 同时打两种接入标签。

```powershell
kubectl delete namespace istio-lab --wait=true # 只回收上一节专用实验空间
istioctl install --set profile=default --skip-confirmation
kubectl create namespace istio-lab
kubectl label namespace istio-lab istio-injection=enabled
kubectl apply -n istio-lab -f samples/bookinfo/platform/kube/bookinfo.yaml
kubectl apply -n istio-lab -f samples/sleep/sleep.yaml
kubectl -n istio-lab wait --for=condition=available deployment --all --timeout=5m
kubectl -n istio-lab get pods # 预期应用 Pod 包含 istio-proxy 伴随容器
kubectl -n istio-lab exec deployment/sleep -c sleep -- `
  curl -sS -o /dev/null -w '%{http_code}' http://productpage:9080/productpage
```

基线必须为 200，且 `istioctl proxy-status` 能看到这些应用的代理，再继续。在 `istio-lab` 创建 `subset-fault.yaml`：

```yaml
apiVersion: networking.istio.io/v1
kind: DestinationRule
metadata:
  name: productpage-fault
  namespace: istio-lab
spec:
  host: productpage
  subsets:
    - name: broken
      labels:
        version: does-not-exist
---
apiVersion: networking.istio.io/v1
kind: VirtualService
metadata:
  name: productpage-fault
  namespace: istio-lab
spec:
  hosts:
    - productpage
  http:
    - route:
        - destination:
            host: productpage
            subset: broken
          weight: 100
```

注入并收集证据：

```powershell
kubectl apply -f .\subset-fault.yaml
istioctl analyze -n istio-lab
kubectl -n istio-lab get pods -l app=productpage --show-labels
kubectl -n istio-lab get endpointslice -l kubernetes.io/service-name=productpage
kubectl -n istio-lab exec deployment/sleep -c sleep -- `
  curl -sS -o /dev/null -w '%{http_code}' http://productpage:9080/productpage
```

预期请求为 503：Service 有 Endpoint，但没有 Pod 匹配 `version=does-not-exist`。`analyze` 未必能发现所有运行时标签缺口，所以必须核对数据面、Pod 标签与请求结果。

恢复与清理：

```powershell
kubectl delete -f .\subset-fault.yaml
kubectl -n istio-lab exec deployment/sleep -c sleep -- `
  curl -sS -o /dev/null -w '%{http_code}' http://productpage:9080/productpage
kubectl delete namespace istio-lab
istioctl uninstall --purge -y
```

删除故障资源后应恢复 200；确认集群只用于此次实验后再删除 Namespace 和 Istio。若恢复仍为 503，停止卸载，先保存源端与目标端 istio-proxy、Istiod 日志、路由和 Endpoint 证据。

## 生产事故题：启用 STRICT 后一半调用 503

**证据**：同一时间窗保存 source/destination/version 维度的成功率、代理访问日志、`proxy-status`、实际 cluster/route、证书、PeerAuthentication/AuthorizationPolicy、EndpointSlice、变更 revision 与 Pod 注入/ambient 标签。

**假设**：部分客户端未入网格仍发明文、旧 revision 未拿到新策略、证书/时钟异常、waypoint 绕过，或策略 selector 选中范围超出预期。用一对成功和失败实例做 trace/配置差异，不要先把 mTLS 全局关掉。

**修复与影响面**：先停止继续扩散策略，回切 canary revision/tag 或缩小策略范围；如果必须临时 PERMISSIVE，要有到期时间和监控。爆炸半径按调用身份和 Namespace 统计，而不是按“有多少 Pod Running”估算。

**复验与回滚**：验证真实请求、mTLS 遥测、授权拒绝、证书轮换和多个故障域。`SYNCED` 不是结束条件，业务 SLI 与安全目标都要恢复。

## 系统设计题：为 500 个服务选择 Sidecar 还是 Ambient

答案应覆盖 L4/L7 功能清单、waypoint 边界、资源/连接容量、Istiod xDS fan-out、网关与 waypoint HA、信任域/CA、策略 attachment、Telemetry 成本、多集群网络、revision canary、迁移顺序和回滚。追问“Ambient 为什么还要 waypoint”时，应答出 ztunnel 主要负责 L4/mTLS，HTTP 路由、L7 授权和 L7 遥测需要 waypoint。

## 常见故障排查

| 现象 | 先检查 | 处理思路 |
|---|---|---|
| 请求失败并带 UF/NR | UF 指上游连接失败，NR 指没有匹配路由 | 区分 TLS/连接与路由问题，HTTP 状态码依场景确认 |
| 配置不生效 | `analyze`、`proxy-status`、代理实际配置 | 排除冲突资源和未同步代理 |
| 开启 STRICT 后调用失败 | 两端注入状态、TLS 模式 | 让客户端进入网格或规划迁移窗口 |
| 延迟突然升高 | 重试、超时、连接池、上游健康 | 限制重试并检查失败放大效应 |
| 没有追踪数据 | 采样率、Collector、请求头传播 | 修正 Telemetry 与采集链路 |

## 面试怎么讲

Istio 的核心是控制面与数据面分离：Istiod 负责服务发现、配置和证书，代理负责实际转发。落地时我会先建立流量和错误率基线，再逐步启用灰度、mTLS 和授权策略；故障时按代理注入、xDS 同步、路由、端点、安全策略的顺序排查。

递进追问可以这样答：

- **“`SYNCED` 为什么仍可能 503？”** 它只表示代理拿到配置；subset 可能无 Endpoint、端口/标签可能错、策略或后端仍可能失败。
- **“Ambient 没有 Sidecar，怎么做 HTTP 路由？”** ztunnel 主要负责 L4/mTLS，L7 路由、授权和遥测需要 waypoint。
- **“重试为什么会放大故障？”** 每层独立重试会乘法放大 QPS；必须有 deadline、重试预算、退避和幂等边界。
- **“怎么升级？”** 新 revision canary，验证 control/data skew、Webhook、CRD、证书和 SLI，再分批切 tag，保留可验证的旧 revision 回退路径。

## 学习检查清单

- [ ] 能区分 Kubernetes Service、Istiod 和数据面代理。
- [ ] 能解释 VirtualService 与 DestinationRule 的配合关系。
- [ ] 能说明 mTLS 迁移为什么需要分阶段。
- [ ] 能生成安装清单并识别核心组件。
- [ ] 能按请求路径排查一次 503。

## 面试题

1. Istio 控制面和数据面分别负责什么？
2. VirtualService 配了 subset 后出现 503，如何排查？
3. Sidecar 与 Ambient 模式的主要差异是什么？
4. 如何避免重试把一次局部故障放大？
5. Istio 可以为 AIOps 提供哪些数据？

## 老师带你从 HTTP 学起：为什么 Service 之外还会需要网格

假设你已经有三个订单 Pod。Kubernetes Service 可以让调用方通过一个稳定名字找到它们，但“所有带测试请求头的请求去新版本”“只有付款服务能调用扣款接口”“这个错误是否来自重试”是更细的问题。先把这些具体要求写出来，才知道是否需要网格带来的代理、策略与运维成本。

HTTP 是应用交换请求和响应的协议。一次请求包括方法、路径、请求头和正文；TCP 负责有序传输字节；TLS 在连接上提供加密和身份验证。L4 指传输层，主要看到地址、端口、连接；L7 指应用层，能理解 HTTP 路径、状态码等。代理只有真正理解这一层，才谈得上按路径路由。

Sidecar 像每个工作台旁边安排的通信助手。应用发请求，流量通过拦截规则交给代理，代理按配置选择后端、建立安全连接，再交还目标应用。它不替应用完成业务事务，也不能凭空恢复没有写入的数据。如果应用自己也设置重试，代理重试与业务重试还可能相乘。

Ambient 把基础通信安全放到节点级 ztunnel；需要理解 HTTP 时，再经过 waypoint。少了每个 Pod 一份代理，并不意味着节点代理没有容量限制，也不意味着七层功能免费出现。Waypoints 可以按服务边界规划，一处过载可能影响多个服务，因此其副本、资源、扩缩容和策略范围需要单独设计。

停在这里做个检查：如果只有 ztunnel，HTTP 方法级授权应该由谁执行？答案是需要支持该功能并实际承载流量的 waypoint。若 YAML 已创建，但请求根本没有走它，配置文本就没有产生你期待的安全效果。

## 一次灰度发布的六张小纸条

我们用前面的 90/10 规则做课堂推理。第一张是 Service，告诉你稳定服务名；第二张是 Pod 标签，告诉你每个实例实际是哪一版；第三张是 DestinationRule，用 subset 名称把一组标签命名；第四张是 VirtualService，给请求选择 subset 和权重；第五张是 Istiod 计算出的代理配置；第六张是实际访问日志。

这六张纸必须互相对得上。Service 有端点，只能证明总体有后端；subset 标签写成不存在的版本，仍会形成空的目标集合。代理与控制面 `SYNCED`，只能证明它收到配置；如果收到的是错误规则，它会很一致地执行错误规则。

不要请求 10 次就断言一定有 1 次新版本。权重是统计分配目标，不是固定的每十次发牌顺序；连接复用、请求条件、采样和后端数量也会影响观测。要保存足量请求的版本计数、错误率和时延，并检查业务流量是否满足同一规则。

灰度还需要业务兼容。v2 往数据库写入 v1 不认识的新状态，即使把流量全切回 v1，也可能读取失败。路由回滚只恢复请求路径，数据库 schema（表结构）和数据语义是否能回退，需要应用变更方案负责。

### xDS 配置到底怎样“送到现场”

xDS 是一组动态配置发现协议的统称，你可以理解成代理不断向控制面订阅“最新路况和通行规则”。Listener（监听器）决定接哪类连接；Route（路由）决定匹配什么请求；Cluster（上游集群）描述目标连接集合；Endpoint（端点）给出实际后端地址。这些名称是代理内部模型，不等于一个 Kubernetes 集群。

控制面发送新配置，代理会确认接受 ACK，或因配置问题拒绝 NACK。配置同步存在传播时间，不能假设提交 YAML 的同一瞬间所有代理完全一致。检查时先运行静态分析，再看同步状态，最后查失败实例的实际路由和端点；只对照成功实例，可能漏掉少量未同步代理。

Istiod 临时不可用时，已有代理通常仍能使用已收到的配置转发，但新服务发现、策略更新和证书相关流程会逐渐受影响。因此“业务还通”不等于可无限期失去控制面。恢复判断还应包含新工作负载能否接入、配置能否更新和证书轮换能否完成。

## 超时与重试课堂：三次重试怎么变成二十七次请求

假设网关、订单服务、库存服务每层最多发起 3 次尝试。最坏情况下，库存下游可能收到 3 × 3 × 3 = 27 次访问。原本短暂变慢的数据库，被重复请求压得更慢，又触发更多重试。这就是重试风暴。

Timeout（超时）回答“最多等多久”；Deadline（截止时间）回答“整条调用还剩多少时间”；Retry budget（重试预算）限制额外尝试可以消耗多少资源。给每层都设 5 秒，不能保证整个用户请求 5 秒内结束。应把总预算分给连接、处理和允许的重试，并把剩余时间向下游传播。

幂等表示同一业务意图重复执行不会重复产生效果。查询通常较容易做到；扣款、创建工单和发短信需要业务去重键及状态记录。代理看到连接断开，不知道服务器是否已经提交扣款，因此不能把所有 POST 都无条件重试。

Connection pool（连接池）避免每次请求都重新建连接；Outlier detection（异常实例检测）可暂时避开反复失败的后端。它们不是全局业务断路器：连接池配额通常有代理或上游范围，分散在多个代理上，不能拿单代理阈值当全服务最大并发。熔断参数要结合后端容量、排队和恢复探针共同设计。

故障时同时看原始请求率、代理重试率、后端实际请求率和延迟。若用户请求没涨而后端请求翻倍，优先检查重试放大。修复应减少额外尝试、恢复依赖容量或回滚故障版本；盲目增加超时只会让更多请求排队占内存。

## 安全课堂：证书证明了谁，授权又决定了什么

mTLS 要双方验证证书，可帮助确认“这次连接来自哪个工作负载身份”，并保护传输内容。AuthorizationPolicy 再决定该身份能不能访问目标。你可以把前者理解成查证件，后者理解成查这个证件能进哪间实验室。证件有效不代表拥有所有权限。

ServiceAccount（服务账号）是工作负载身份的重要来源，Namespace（命名空间）参与身份范围。CA 是 Certificate Authority，负责签发可信证书；SDS 是 Secret Discovery Service，给代理动态提供证书等秘密。证书过期、时钟漂移、信任根不一致，都可能在业务代码没有改变时导致握手失败。

JWT 是 JSON Web Token，常承载终端用户的声明。`RequestAuthentication` 的验证和 `AuthorizationPolicy` 的访问要求要配合；仅配置验证规则，不应直接推断所有没有令牌的请求都被禁止。要分别测试缺少令牌、签名错误、有效但无权限和有效且有权限四组结果。

老师会要求你用最小范围演练 STRICT：先挑一对测试服务，确认身份和加密遥测，再扩到命名空间，最后讨论更大范围。一次性把全网格改为 STRICT，可能把尚未纳管的定时任务、探针或外部客户端全部挡住。迁移完成的证据既包括允许请求成功，也包括禁止请求确实被拒绝。

## 三分钟面试回答与课堂作业

**30 秒：**Istio 用控制面集中配置、数据面实际转发的方式治理服务通信。它提供流量分配、通信身份和遥测。引入前先明确业务需要，实施时通过小范围验证逐步开启，排障则从实际请求反查代理、端点与策略。

**3 分钟：**我会先画一条调用链，说明请求在哪个代理执行规则。Sidecar 把代理放到工作负载旁，Ambient 由节点 ztunnel 承担四层安全并按需引入七层 waypoint。控制面把服务发现和策略转成动态配置，下发接受与业务成功是不同状态，因此需要同时验证配置、端点和真实流量。

流量治理要把路由权重、版本标签、超时和重试预算联系起来；重试必须尊重业务幂等，灰度回滚也要考虑数据兼容。安全上分清工作负载 mTLS、终端用户认证和访问授权，证书根、轮换及时间同步纳入运维。生产设计分别评估控制面配置分发、网关连接、代理资源和遥测存储容量，以修订版本小批升级并保留已验证回退路径。

**递进追问：**为什么 CPU 很低仍超时？可能是连接上限、上游排队、TLS 握手、重试和依赖等待；需要端到端时延分解。为什么两个副本仍不算高可用？要看是否同节点、同可用区，以及 DNS、CA、入口和依赖是否共享单点。为什么不能把 HTTP 路径放进任意指标标签？真实路径包含订单号等动态值会制造高基数，应该使用受控路由模板并保护敏感数据。

本课的作业不是截图一个绿色 Pod，而是记录同一个请求在“无规则、正常灰度、错误 subset、恢复规则”四阶段的结果。附上版本、数据面模式、资源标签、实际代理配置和故障范围，注明哪些步骤只是文档推演、哪些已经在自己的实验集群执行。

## 路由精讲：代理内部的 Cluster 不是 Kubernetes 集群

前文六张纸把路由串了起来，现在进一步走进一个源 Sidecar。Listener 接住符合条件的连接，HTTP 连接管理逻辑识别主机和路径，Route 选择上游 Cluster，Cluster 再结合 Endpoint 和负载均衡策略选择实际地址。这里的 Cluster 是代理对一组上游连接目标的描述，不是另一个 Kubernetes 控制面。把这两个含义混淆，会导致对着集群列表寻找一个本来属于代理内部的对象。

这条路径给出了排障顺序：没有匹配路由，先查主机、端口、匹配条件与路由可见范围；路由存在但上游组没有健康端点，查 subset、标签和就绪；端点存在但无法建立连接，再查地址、端口、TLS 和网络；连接建立后响应慢，才进入应用等待与代理超时。每一步都能排除不同假设，不能把所有五百类错误归到 Pod 未就绪。

访问日志中的响应标志比状态码更细。NR 表示没有可用匹配路由，UF 表示上游连接失败，UO 表示上游溢出等连接或并发保护相关现象；具体状态与详情结合日志确认。官方[流量故障说明](https://istio.io/latest/docs/ops/common-problems/network-issues/)给出这些定位入口。它们是定位方向，不是可以直接自动执行的修复指令。

教师给出三份合成证据：甲有 NR 但后端健康；乙路由正常、subset 无端点；丙有 UF 且握手报信任失败。基础步骤是分别选路由、端点、证书证据核对。故障步骤把三份工单标题都改成“接口五百错误”，让同学重新分类；恢复步骤补回响应标志、目标地址和时间，预期重新得到三条不同路径。清理只删除这份合成工单，不在真实网格制造三重故障。

## 配置传播课堂：一次全局修改为何只影响部分请求

配置由管理面写入，再由 Istiod 观察、计算、分发，最后代理接受。各阶段存在队列与处理时间，部分代理可能暂时保留旧配置。成功请求来自旧代理还是新代理，需要记录实际工作负载和修订版本。不能把一组成功请求与另一组失败请求混合后，用平均成功率说明策略“随机生效”。

控制面应关注资源变化速率和配置分发范围。一个新服务加入可能影响许多代理，频繁更新全局规则会放大计算与传输。限定配置可见范围有助于减少不必要状态，但它也可能使某代理看不到需要的服务；性能优化后仍要跑真实调用矩阵。不能只追求代理配置更小，而把合法调用删掉。

代理 NACK 的含义是拒绝某份配置，不代表整个网格一定完全失效。排障保存拒绝原因、涉及资源类型、代理版本与控制面版本，然后看旧配置是否仍在工作。对已经成功的旧业务，先保护现状；对新接入业务，明确其可能无法获得正确配置。批量重启代理可能把“旧配置还能服务”变成“新代理完全拿不到配置”，因此不是第一步。

恢复验收必须有一个新连接和一个新配置用例。只重放旧长连接可能继续使用原状态，掩盖控制面还没恢复。与此同时，不要在恢复高峰反复重建所有 Pod：大量代理同时注册、拉配置与取证书会形成新的尖峰。分批恢复、退避与容量余量共同决定真正的恢复时间。

## 身份验收课堂：加密、认证、授权分别留下证据

HTTP 二百是应用结果，不能单独证明传输加密。Ambient 基础实验先观察工作负载是否配置 HBONE，再结合指标中的 `connection_security_policy=mutual_tls` 与预期源、目标身份，或者检查对应节点 ztunnel 的同一时间窗访问日志。按 [Istio 1.30 mTLS 验证指南](https://istio.io/v1.30/docs/ambient/usage/verify-mtls-enabled/)理解字段，不把“看见工作负载名字”当成握手证据。

源身份与目标身份通常包含信任域、命名空间和服务账号信息。相同应用名但不同服务账号不一定获得相同授权，复制标签不能替代持有相应身份。证书由平台信任根签发，平台管理员能改变哪些身份关系也属于安全边界。秘密和私钥不进入学习证据，只保留脱敏后的身份结构、有效期判断与验证结果。

加密通信存在不意味着明文客户端一定被拒绝。要证明拒绝明文，需要目标的认证策略和实际负面用例。授权又是下一层：身份有效但不在允许范围内，应被拒绝。设计四格验收表：合法身份的合法请求、合法身份的非法操作、未知身份请求、缺少必要用户凭据请求。每格写预期、实际和负责执行策略的代理，不能只测第一格。

证书轮换的验收也不只是看新证书文件存在。需要确认代理成功取到、信任链兼容、时间正确，且新连接能完成握手。旧长连接可能继续存活，新连接却因新证书失败，所以应把连接新旧分开统计。轮换应先演练重叠信任和恢复方案，不能通过永久延长证书寿命或关闭校验来消除告警。

## 授权精讲：允许策略不会覆盖显式拒绝

Istio 的授权动作不是简单按文件先后来覆盖。CUSTOM 表示交给外部授权逻辑判断，DENY 表示显式拒绝，ALLOW 表示允许集合；请求需要满足所涉及的决策边界。已有拒绝命中时，再增加一条允许不会把拒绝抵消。AUDIT 则表达审计意图，并不自行改变放行结果；真正产生日志还要相应的审计支持。使用前按[授权策略参考](https://istio.io/latest/docs/reference/config/security/authorization-policy/)核对目标版本。

一个空的允许规则集合和“有一条没有限制条件的规则”是不同状态。前者可能选中目标却没有任何允许匹配，后者可能匹配所有请求。审查时要看完整结构，不只看到 `action: ALLOW` 就判断它会放行。权限表应至少列出策略选择的目标、来源身份、端口、方法与路径，逐项预测命中结果。

七层字段还要求代理真正理解七层协议。把 HTTP 方法限制用于只能识别 TCP 的流量，需要特别注意缺失属性的处理，拒绝策略可能比预想更宽。先限定目标端口，在匹配的数据面上做正反验证，不将一个用于网页接口的规则下发给整个命名空间的数据库端口。由此可见，“标签选择正确”还不是安全策略的全部正确性。

外部授权服务自身也有容量和可用性。每个业务请求都去查询一个慢的授权后端，会把它变成共享依赖。设计时写清超时、错误时的安全行为、缓存边界和审计，不能在故障时悄悄从拒绝改为全放行。若需要临时例外，要有最小资源范围、到期时间和复验，避免事故缓解变成长期权限漏洞。

## Ambient 精讲：先确定最初访问的是 Service 还是工作负载地址

Waypoint 默认主要处理面向 Service 的流量；直接访问 Pod 地址的工作负载流量是否进入它，取决于配置的流量类型与绑定范围。这一差别由最初访问目标决定，不能因为最终落到了同一 Pod，就认为两次请求必经同一个七层代理。[一三零版本 waypoint 说明](https://istio.io/v1.30/docs/ambient/usage/waypoint/)区分了服务、工作负载、全部及不承载流量等类型。

例如监控直接抓 Pod 地址，而业务通过 Service 访问。前者可能只经过四层路径，后者进入 waypoint，因此能看到的遥测与可执行策略不同。排查“同一 Pod 为什么部分请求没有七层日志”时，先记录最初目的地址与绑定标签，再查代理是否漏采。不能用缺少七层事件直接证明网络流量绕过了所有安全控制。

入口网关、waypoint 和目标应用之间也要明确策略职责。入口负责外部接入，不自动替代网格内部授权；目标侧七层代理负责它承载的目的资源，不意味着全网每条出站流量都经过同一处。设计图给每个策略标执行点，给每条旁路标适用边界。没有对应流量证据的策略，仍应标成待验证。

从 Sidecar 迁移到 Ambient 时，先列出使用的过滤器、流量规则、授权和遥测功能，分别映射到目标模式。不是把注入标签换成环境式标签就一定等价。旧新数据面混合窗口内，需要覆盖双方调用、入口调用和非网格客户端，记录不同方向的身份与授权结果。不可映射的功能先阻断迁移决策，不能在生产边试边猜。

## 生产设计课堂：重试和异常实例剔除需要容量余量

异常实例检测可以减少向故障后端发送请求，但剔除之后流量会集中到剩余后端。如果原来四个实例已经接近容量，剔除两个可能让剩余两个也过载，随后继续被剔除。阈值与最大剔除比例、后端余量、业务降级和恢复观察应一起设计；不能单独把剔除速度调得越快越好。

用纸面模型做计算：四个实例各安全处理一百个并发任务，当前总并发三百。正常均匀分配时每个七十五；失去两个后，每个需要一百五十，超过安全范围。故障步骤只改健康实例数，不改变入口负载，预测排队与超时上升；恢复步骤先限制非关键请求或补充已就绪实例，再逐步恢复入口。清理只移除模拟表，不真的关闭半数生产副本。

流量镜像也要谨慎。它适合比较新后端行为，但影子请求仍可能写数据库、发消息或触发通知，忽略影子响应不代表没有副作用。测试后端应使用隔离数据与凭据，并控制镜像比例和容量。生产设计题中主动说明影子环境不能发送真实扣款，是比“支持镜像功能”更重要的工程答案。

最终的停止条件要可测量：新版本错误率、延迟、授权误拒绝、代理同步延迟和证书失败达到预定阈值即暂停。修复后同时复验业务与安全负例，不用恢复成功率作为放松授权的理由。本轮新增案例仅完成资料与静态推演，未执行代理重启、镜像流量、证书轮换或网格升级。

### 实验前置和回收最后核对

如果一次性集群没有 Gateway API 定义，按前述版本文档先执行 `kubectl apply --server-side -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.5.1/experimental-install.yaml`，再读取 Gateway 资源类型。此步骤会增加集群级定义，只允许用于专用课堂集群；已由其他控制器管理定义时，不执行覆盖安装。前置缺失应在创建 waypoint 之前发现，不能把“找不到资源类型”当成代理转发故障。

生成 `istio-ambient.yaml` 前确认文件不存在或使用新的独立路径。输出非空也要配合生成命令退出码，错误输出不算有效安装清单。实验应用全部来自固定发行包，记录包版本与实际镜像，不把其他版本的示例目录拼到本课中。服务账号、标签和命名空间是后续身份验证的输入，不能随意改完又期待日志完全相同。

Sidecar 故障恢复后，重点保存源端和目标端 `istio-proxy` 日志以及 Istiod 同步状态；Ambient 实验则查看相应节点 ztunnel 和 waypoint。工具选择要随当前模式改变，不能因为前一节用过节点代理就只查它。两个实验使用同名空间是为了教学简洁，必须完成上一节资源回收后才继续；共享环境中应改用各自独立空间。

如果只完成 Ambient 基础实验而不做后续故障课，仍需删除本轮 `istio-lab` 空间并核对工作负载和 waypoint 已回收。全局卸载只在确认整套 Istio 都由本课独占时使用；Gateway API 定义可能被其他组件使用，不因删除了一个网格就顺手删除。保留版本、配置、同一请求的身份与结果、恢复过程和未完成项目，才能让下一位学习者复现你的结论。

检查结论时还要区分采样不足与实际通过。连续三次成功请求只能证明那三次路径成功，不能证明低权重版本已经收到流量。先按代理日志或版本响应确认每个目标版本都有样本，再统计分版本结果。若测试请求携带固定会话、黏性策略或持续复用连接，实际分布还会受这些因素影响，不能用三次请求的比例推翻权重配置。课堂记录应同时保存配置权重、各版本实际样本数和样本时间窗。

同样，恢复后没有新错误日志，也可能是根本没有请求。验收人主动发出可识别的合成请求，确认入口、源代理、目标代理与应用都在对应时间窗留下证据，再宣布链路恢复。自动验收把“零请求”记为证据不足，而不是百分之百成功，可以避免静默故障被绿色报表掩盖。

## 学习证据

- `istio-demo.yaml` 安装渲染结果。
- 一份灰度发布的 VirtualService 与 DestinationRule。
- 一张请求成功率、P95 延迟和版本维度的仪表盘截图。
- 一份 503 或 mTLS 故障排查记录。

## 本文边界与下一步

本文覆盖入门到岗位常用的流量、安全、观测与排障主线。本次更新只静态核对官方资料和实验步骤，没有在当前电脑安装 Istio、运行 kind/minikube、创建 waypoint、注入 503 或验证 mTLS；多集群、多网络、VM、外部控制面和 1.30 feature status 仍需针对目标平台复核。生产变更必须在预生产环境完成容量、证书、策略和 revision 回滚演练。
