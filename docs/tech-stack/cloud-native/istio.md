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

## 2026-08-14 版本与兼容边界

| 对象 | 本文锚点 | 边界 |
|---|---|---|
| Istio | 1.30.3 | 使用 1.30 当前 patch，安全修复不能停在旧 patch |
| Kubernetes | Istio 1.30 支持 1.32–1.36 | 不在范围内的集群先查官方支持表，不能只看 CRD 是否能创建 |
| 控制面/数据面版本差 | 控制面最多领先数据面一个 minor；数据面不能领先控制面 | 用 revision canary 分批升级，不要原地覆盖全网格 |
| Ambient | 单集群 production-ready，但功能仍需逐项核对 | ztunnel 主要提供 L4/mTLS；HTTP 路由、L7 授权和 L7 遥测需要 waypoint |

`latest` 文档会继续变化，本文的实验与故障边界按 1.30.3 编写。升级时重新查 supported releases、feature status 和平台说明。

## 官方知识地图

```text
Istio
  -> 安装、升级与修订版本
  -> 流量管理
  -> 身份、mTLS 与授权
  -> 指标、访问日志与链路追踪
  -> Sidecar 模式与 Ambient 模式
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
  -> Ingress Gateway
  -> 数据面代理
  -> 目标服务
  -> 下一个数据面代理

Kubernetes 配置
  -> Istiod
  -> xDS 配置推送
  -> 数据面代理

数据面代理
  -> 指标 / 日志 / 追踪
  -> Prometheus / 日志平台 / Trace 后端
```

两种真实请求路径要分开画：

```text
Sidecar:
source app -> source Envoy -> destination Envoy -> destination app

Ambient:
source app -> source-node ztunnel -> optional waypoint(Envoy/L7)
           -> destination-node ztunnel -> destination app
```

配置一致性链路是：Kubernetes API 中的期望资源 → Istiod 计算 xDS → Envoy/ztunnel/waypoint 接收实际配置 → Endpoint 与证书持续变化 → 请求按数据面真实状态转发。`proxy-status` 显示 `SYNCED` 只说明配置同步，不证明后端健康、路由正确、证书未过期或业务返回成功。

## 安装与启动

学习环境可用 1.30.3 的 `demo` 或 `ambient` profile；`demo` 明确不用于生产。生产环境应按容量和功能显式配置控制面、网关、ztunnel/waypoint 与升级策略。

```powershell
istioctl version # 客户端应固定为 1.30.3，并显示可连接集群中的版本
istioctl install --set profile=ambient -y # 只在一次性学习集群安装 Ambient profile
kubectl get pods -n istio-system # 检查 istiod 与网关 Pod 是否 Running
```

## 配置详解

下面把带 `version: v1` 标签的工作负载定义为一个 subset，并将 90% 流量发往 v1、10% 发往 v2。

在 Sidecar 模式，这类 L7 路由由 Sidecar Envoy 执行；在 Ambient 模式，目标服务必须纳入 waypoint，否则不要声称这条 HTTP 规则已经执行。

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

预期 HTTP 状态是 200，ztunnel 列表能看到实验工作负载。此时已验证 Ambient L4/mTLS 数据面，但还没有证明 L7 路由。

创建并绑定 waypoint：

```powershell
istioctl waypoint apply -n istio-lab --enroll-namespace --wait
kubectl -n istio-lab get gateway,services,pods
kubectl -n istio-lab exec deployment/sleep -c sleep -- `
  curl -sS -o /dev/null -w '%{http_code}' http://productpage:9080/productpage
```

预期仍为 200，并能看到 waypoint Gateway/Pod。用指标与访问日志确认请求经过 waypoint；只看对象存在还不够。

若失败，按顺序检查集群版本、CNI、istiod/ztunnel、Namespace 标签、Service/EndpointSlice、waypoint 状态、DNS 和策略。先运行 `istioctl analyze -A`，再看实际路由与日志。

## 故障注入实验：不存在的 subset 导致 503

在 `istio-lab` 创建 `subset-fault.yaml`：

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

删除故障资源后应恢复 200；确认集群只用于此次实验后再删除 Namespace 和 Istio。若恢复仍为 503，停止卸载，先保存 waypoint/ztunnel/istiod 日志、路由和 Endpoint 证据。

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
| 503 UF/NR | 端点、subset 标签、路由 | 修正服务端口、标签或路由目标 |
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

## 学习证据

- `istio-demo.yaml` 安装渲染结果。
- 一份灰度发布的 VirtualService 与 DestinationRule。
- 一张请求成功率、P95 延迟和版本维度的仪表盘截图。
- 一份 503 或 mTLS 故障排查记录。

## 本文边界与下一步

本文覆盖入门到岗位常用的流量、安全、观测与排障主线。本次更新只静态核对官方资料和实验步骤，没有在当前电脑安装 Istio、运行 kind/minikube、创建 waypoint、注入 503 或验证 mTLS；多集群、多网络、VM、外部控制面和 1.30 feature status 仍需针对目标平台复核。生产变更必须在预生产环境完成容量、证书、策略和 revision 回滚演练。
