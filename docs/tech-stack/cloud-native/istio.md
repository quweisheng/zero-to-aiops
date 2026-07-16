# Istio 深讲

> 学习目标：理解服务网格的数据面与控制面，能安装 Istio、配置一次灰度流量和双向 TLS，并按请求链路排查 503、配置未生效等常见故障。

## 官方资料

- [Istio 官方文档](https://istio.io/latest/docs/)
- [架构说明](https://istio.io/latest/docs/ops/deployment/architecture/)
- [流量管理](https://istio.io/latest/docs/concepts/traffic-management/)
- [安全](https://istio.io/latest/docs/concepts/security/)
- [可观测性](https://istio.io/latest/docs/concepts/observability/)

本文以官方概念和运维文档为依据，示例用于学习，生产参数要结合版本、容量和变更窗口评审。

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

## 安装与启动

学习环境可用 `istioctl` 安装 `demo` profile；生产环境应选择经过评审的 profile、网关拓扑和升级策略。

```powershell
istioctl version # 查看客户端以及可连接集群中的 Istio 版本
istioctl install --set profile=demo -y # 安装学习配置；正常会提示组件安装成功
kubectl get pods -n istio-system # 检查 istiod 与网关 Pod 是否 Running
```

## 配置详解

下面把带 `version: v1` 标签的工作负载定义为一个 subset，并将 90% 流量发往 v1、10% 发往 v2。

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

## 入门实验：离线生成 Istio 安装清单

### 实验目标

在不修改集群的情况下生成 demo profile 清单，并确认里面包含 Istiod。

### 实验步骤

1. 从[官方发布页](https://github.com/istio/istio/releases)安装与你的集群版本兼容的 `istioctl`。
2. 执行：

```powershell
istioctl manifest generate --set profile=demo | Out-File -Encoding utf8 istio-demo.yaml # 只生成 YAML，不安装
Select-String -Path istio-demo.yaml -Pattern 'name: istiod' # 搜索控制面 Deployment 名称
```

### 验证结果

`istio-demo.yaml` 非空，搜索结果至少包含 `name: istiod`。这说明客户端可读取 profile 并渲染资源。

### 如果没有成功

1. 用 `istioctl version --remote=false` 检查客户端是否可执行。
2. 确认 PowerShell 当前目录可写。
3. 若字段报错，检查是否混用了其他版本文档中的 profile 参数。
4. 生成成功但安装失败时，再查 Kubernetes 权限、CRD 和镜像拉取。

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

本文覆盖入门到岗位常用的流量、安全、观测与排障主线。生产多集群、Ambient 深度设计、证书体系和大规模性能调优，应继续阅读对应版本的官方运维指南，并在预生产环境演练。
