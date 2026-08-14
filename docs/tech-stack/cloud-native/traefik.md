# Traefik 技术栈深讲

> 学习目标：从零理解 Traefik Proxy 如何发现 Docker、Kubernetes 和文件中的路由配置，能沿着 `EntryPoint -> Router -> Middleware -> Service -> Backend` 解释一次请求，能完成 Docker Compose 与 Kubernetes Gateway API 的最小配置，能排查 404、502、503、504、TLS、Provider 和配置更新故障，并能回答生产高可用、容量、安全、升级回滚和 AIOps 系统设计追问。

> 版本快照：本文在 2026-08-14 核验 Traefik Proxy `v3.7.10`、官方 Helm Chart `v41.2.0` 和 Gateway API `v1.6.1`。生产环境不要使用浮动的 `latest`；先看当前受支持 minor、最新 patch、安全公告和迁移指南，再固定镜像 digest 或精确版本。

## 官方资料

- [Traefik Proxy 官方文档](https://doc.traefik.io/traefik/)
- [Traefik Proxy GitHub 仓库](https://github.com/traefik/traefik)
- [Traefik Proxy v3.7.10 release](https://github.com/traefik/traefik/releases/tag/v3.7.10)
- [Traefik Proxy v3.7.10 SECURITY.md](https://raw.githubusercontent.com/traefik/traefik/v3.7.10/SECURITY.md)
- [版本支持与发布策略](https://doc.traefik.io/traefik/deprecation/releases/)
- [安装配置与路由配置边界](https://doc.traefik.io/traefik/reference/install-configuration/boot-environment/)
- [Provider 总览](https://doc.traefik.io/traefik/providers/overview/)
- [EntryPoint](https://doc.traefik.io/traefik/routing/entrypoints/)
- [HTTP Router 与规则优先级](https://doc.traefik.io/traefik/routing/routers/)
- [HTTP Middleware](https://doc.traefik.io/traefik/middlewares/overview/)
- [HTTP Service](https://doc.traefik.io/traefik/routing/services/)
- [Docker Provider](https://doc.traefik.io/traefik/reference/install-configuration/providers/docker/)
- [Kubernetes Ingress Provider](https://doc.traefik.io/traefik/reference/install-configuration/providers/kubernetes/kubernetes-ingress/)
- [Kubernetes CRD Provider](https://doc.traefik.io/traefik/reference/install-configuration/providers/kubernetes/kubernetes-crd/)
- [Kubernetes Gateway API Provider](https://doc.traefik.io/traefik/reference/install-configuration/providers/kubernetes/kubernetes-gateway/)
- [Traefik Helm Chart](https://github.com/traefik/traefik-helm-chart)
- [Traefik Helm Chart v41.2.0](https://github.com/traefik/traefik-helm-chart/releases/tag/v41.2.0)
- [ACME Certificate Resolver](https://doc.traefik.io/traefik/reference/install-configuration/tls/certificate-resolvers/acme/)
- [API 与 Dashboard](https://doc.traefik.io/traefik/reference/install-configuration/api-dashboard/)
- [日志、访问日志、指标与链路总览](https://doc.traefik.io/traefik/observability/overview/)
- [健康检查 `/ping`](https://doc.traefik.io/traefik/reference/install-configuration/observability/healthcheck/)
- [Traefik v2 到 v3 迁移](https://doc.traefik.io/traefik/migrate/v2-to-v3/)
- [Traefik v3 minor 迁移清单](https://doc.traefik.io/traefik/migrate/v3/)
- [Kubernetes Gateway API 官方文档](https://gateway-api.sigs.k8s.io/)
- [Gateway API v1.6.1 release](https://github.com/kubernetes-sigs/gateway-api/releases/tag/v1.6.1)

说明：Traefik Proxy 开源仓库使用 MIT 许可证；官方 Helm Chart 使用 Apache-2.0。Traefik Hub、Traefik Enterprise 或合同中的商业功能不能因为名字相近就算作 OSS 能力，选型时必须分别核对产品文档、许可证和订阅范围。

## 先把版本与产品边界说清楚

| 对象 | 本文快照 | 初学者要记住什么 |
|---|---|---|
| Traefik Proxy OSS | `v3.7.10` | 开源反向代理与负载均衡器，MIT；生产固定最新受支持 patch |
| 官方 Helm Chart | `v41.2.0` | Chart 版本不等于 Proxy 版本；此版本默认 Proxy `v3.7.10` |
| Gateway API | `v1.6.1` | Kubernetes 路由 API 的版本，不是 Traefik 版本；CRD 要单独安装或升级 |
| 支持周期 | 官方表格与实际补丁发布在快照日未完全同步 | 不编造固定 LTS/EOL；部署当天重查 Releases、目标标签 `SECURITY.md` 与合同 |
| Traefik Hub / Enterprise | 商业产品或商业能力 | 许可证、分布式能力、API 管理能力另行核对，不混写进 OSS |

Traefik 按语义化版本发布，但快照日存在官方口径不同步：`v3.7.10` 已是 latest stable，目标标签内的支持表仍滞后，同时官方还在旧分支发布安全补丁。因此本文不承诺某个 minor 固定支持多少年。升级时不能只看大版本：`3.6 -> 3.7` 要读 v3 minor 迁移清单，`3.7.1 -> 3.7.10` 也要看安全修复、CRD 变化和 Chart release notes。

## 场景开场

你有三个服务：

- `alerts`：告警 API。
- `grafana`：仪表盘。
- `runbook`：自动化处置页面。

希望用户这样访问：

```text
https://aiops.example.com/api/alerts  -> alerts
https://aiops.example.com/grafana     -> grafana
https://runbook.example.com/          -> runbook
```

传统方式可能要手工维护代理配置、后端 IP，再执行 reload。容器重建后 IP 改了，配置就容易过期。Traefik 的思路是：

```text
Docker labels / Kubernetes resources / files
  -> Provider 发现配置变化
  -> Traefik 生成路由配置
  -> Router 按 Host、Path 等规则匹配
  -> Middleware 做认证、限流、改写等处理
  -> Service 选择一个健康 Backend
```

它解决的是“动态环境中的入口发现与转发”，不是替应用修数据库，也不是安装后自动懂业务。Host、Path、端口、TLS、权限和容量仍然要明确设计。

## 一句话人话版

Traefik 是一个会监听容器平台变化的反向代理：它在固定入口接收流量，按路由规则挑中服务，按顺序执行中间件，再把请求转发到真正的应用实例。

## 小白最先会问

### Traefik 是不是 Kubernetes 自带的？

不是。Kubernetes 提供 Ingress、Gateway API、Service 等 API，Traefik 是实现这些入口规则的一个 controller 和数据面代理。只创建 `HTTPRoute` 而没有安装支持它的 controller，请求不会自动转发。

### Traefik 和 NGINX 有什么区别？

两者都能反向代理。Traefik 的突出特点是 Provider：它能监听 Docker、Kubernetes 等 API，把 labels、Ingress、CRD、Gateway API 资源转换成路由。NGINX 也能进入云原生入口，但具体配置模型、扩展、reload 和 controller 行为不同，不能把注解或术语直接互换。

### Traefik 是不是完整 API 管理平台？

Traefik Proxy OSS 提供路由、TLS 和多种中间件，但“开发者门户、API 产品、完整治理、分布式配额”等商业 API 管理能力不能默认存在。先区分 Proxy、Hub、Enterprise，再做功能和许可证对照。

### 为什么改完 label 不用手工 reload？

Docker Provider 默认监听 Docker events；Kubernetes Provider watch API 对象；File Provider 可以 watch 文件变化。Provider 收到变化后提交新的路由配置。入口端口、Provider 开关等安装配置仍需要重启，不是所有字段都能热更新。

### Dashboard 绿色是不是业务正常？

不是。Dashboard 只能帮助确认 Traefik 看到了哪些 Router、Middleware 和 Service。真实 DNS、负载均衡器、网络、后端端口、业务依赖仍要用真实请求、指标、日志和 trace 验证。

## 学习边界

本文完整覆盖从入门到生产主线：

- Traefik Proxy、Hub、Enterprise 和 Helm Chart 的边界。
- 安装配置与路由配置。
- EntryPoint、Provider、Router、Middleware、Service、ServersTransport。
- HTTP、TCP、UDP 与 TLS 的基本数据路径。
- File、Docker、Kubernetes Ingress、CRD 和 Gateway API Provider。
- Docker Compose 基础实验和错误后端端口故障注入。
- Kubernetes Helm、Gateway API、状态条件和升级顺序。
- HA、一致性、ACME、容量、性能、安全、可观测性、升级与回滚。
- 404、502、503、504、证书和配置未生效排障。
- AIOps 证据链、事故题、系统设计题和递进面试追问。

本文不会假装覆盖所有商业插件、所有云厂商 LB、所有 Gateway API 扩展和每一种认证协议。遇到实现特有能力时，应回到固定版本的官方 reference、conformance report 和 release notes。

## 官方知识地图

```text
Traefik Proxy
  -> Install configuration（旧称 static configuration）
     -> entryPoints
     -> providers
     -> API / dashboard
     -> logs / access logs / metrics / tracing
     -> certificateResolvers
  -> Routing configuration（旧称 dynamic configuration）
     -> HTTP
        -> routers
        -> middlewares
        -> services
        -> serversTransports
     -> TCP
        -> routers
        -> middlewares
        -> services
        -> serversTransports
     -> UDP
        -> routers
        -> services
     -> TLS
        -> certificates
        -> options
        -> stores
  -> Providers
     -> file
     -> docker / swarm
     -> kubernetesIngress
     -> kubernetesCRD
     -> kubernetesGateway
     -> other catalogs and orchestrators
```

新手先只记住这条主链：

```text
Client
  -> EntryPoint
  -> Router rule
  -> Middleware chain
  -> Service load balancer
  -> Backend application
```

控制面则是另一条链：

```text
Docker event / Kubernetes watch / file change
  -> Provider
  -> routing configuration
  -> validation and runtime update
  -> routers/services visible in API and logs
```

排障时不要把两条链混在一起。第一条回答“请求在哪一跳失败”，第二条回答“Traefik 为什么没有生成预期路由”。

## Traefik 在 AIOps 链路中的位置

```text
用户请求
  -> DNS / CDN / WAF / external load balancer
  -> Traefik
     -> access log
     -> process log
     -> Prometheus metrics
     -> OpenTelemetry trace
  -> application
  -> database / cache / queue

配置变化
  -> Git / CI / Docker / Kubernetes API
  -> Traefik Provider
  -> route update
  -> change event and health evidence
```

| AIOps 能力 | Traefik 能提供的证据 | 不能单独证明什么 |
|---|---|---|
| 指标 | 请求数、状态码、耗时、连接、入口/路由/服务标签 | 后端数据库为什么慢 |
| 日志 | Router、Service、下游地址、状态码、处理时间 | 没采集到的应用内部异常 |
| Trace | 入口 span 与下游传播 | 未接入 tracing 的完整调用链 |
| 告警 | 5xx、P99、证书、实例存活、配置异常 | 根因已经确认 |
| 自动化 | 汇总 Router/Service/API/Kubernetes 状态并执行受控 Runbook | 可以无审批随意改生产路由 |
| RCA | 把配置变更、发布、流量错误与后端健康对齐 | 仅凭一个状态码直接定责 |

## Traefik 是什么、解决什么问题

Traefik Proxy 是用 Go 编写的云原生应用代理。它同时扮演两个角色：

1. 控制面客户端：连接 Docker、Kubernetes 或文件等 Provider，发现路由和后端。
2. 数据面代理：监听端口、终止或透传 TLS、匹配规则、执行中间件并转发流量。

它主要解决：

- 容器实例 IP 和端口变化快，手工 upstream 容易过期。
- 多个服务需要共用 80/443，并按 Host、Path 等条件分流。
- TLS、重定向、认证、限流、重试和 Header 处理需要统一入口。
- 入口需要指标、日志、trace 和动态配置可见性。

它不直接解决：

- 应用无响应、SQL 慢、消息积压等业务内部问题。
- DNS、外部负载均衡、安全组和跨网网络全部配置。
- Kubernetes Service、Pod readiness 和 NetworkPolicy 的正确性。
- 全局身份平台、密钥平台、WAF、完整 API 生命周期治理。

## 两类配置：安装配置与路由配置

官方当前把旧称 `static configuration` 的部分叫 **Install Configuration**，把旧称 `dynamic configuration` 的部分叫 **Routing Configuration**。看到旧文章时要能对应上。

| 配置类型 | 典型内容 | 变化后是否需要重启 |
|---|---|---|
| 安装配置 | EntryPoint、Provider、API、日志、指标、证书解析器 | 通常需要重启 Traefik |
| 路由配置 | Router、Middleware、Service、TLS options | Provider 可动态更新，不要求手工 reload |

安装配置可用 YAML/TOML 文件、CLI 参数、环境变量或 Helm values。官方明确提醒：同一实例应选择一种主要方式，不要混合多种方式后靠猜测判断优先级。

最小安装配置：

```yaml
# traefik.yml：安装配置
entryPoints:
  web:
    address: ":80"
  websecure:
    address: ":443"

providers:
  file:
    directory: /etc/traefik/dynamic
    watch: true

api:
  dashboard: true

log:
  level: INFO

accessLog:
  format: json
```

最小路由配置：

```yaml
# dynamic/app.yml：路由配置
http:
  routers:
    alerts:
      entryPoints:
        - web
      rule: "Host(`aiops.example.com`) && PathPrefix(`/api/alerts`)"
      middlewares:
        - security-headers
      service: alerts

  middlewares:
    security-headers:
      headers:
        contentTypeNosniff: true

  services:
    alerts:
      loadBalancer:
        servers:
          - url: "http://alerts:8080"
```

如果你把 `entryPoints.web.address` 放进动态文件，Traefik 不会因此打开端口；如果把 Router 写进安装文件的错误位置，也不会自动变成路由。先分清两类配置，再查语法。

## 核心请求路径

一次 HTTP 请求可以拆成九步：

1. 客户端把域名解析到外部 LB 或 Traefik 地址。
2. TCP 连接进入一个 EntryPoint，例如 `websecure=:443`。
3. 如果是 TLS，Traefik先根据 SNI 和 TLS 配置选择证书、终止连接或走 TCP passthrough。
4. HTTP Router 根据 Host、Path、Method、Header、Query、ClientIP 等 matcher 匹配。
5. 多条 Router 同时匹配时，根据显式 `priority` 或规则默认优先级选路。
6. Router 级 Middleware 按声明顺序执行。
7. Service 级 Middleware 再执行；它对所有进入该 Service 的请求生效。
8. Service 的负载均衡器选择一个 Backend，ServersTransport 决定到后端的连接/TLS方式。
9. 响应反向经过中间件并返回客户端，访问日志、指标和 trace 记录结果。

```text
Client
  -> :443 EntryPoint
  -> TLS/SNI
  -> Router: Host + Path
  -> Router Middleware 1
  -> Router Middleware 2
  -> Service Middleware
  -> Service load balancer
  -> ServersTransport
  -> Backend IP:port
```

任何一层都可能返回错误。看到 404 先查 Router 匹配，看到 502 再重点查 Backend 地址、端口、协议与连接，不要一上来重启所有 Pod。

## EntryPoint：流量从哪个门进来

### 它是什么

EntryPoint 是 Traefik 监听的网络入口，常见为 `web=:80`、`websecure=:443`、`metrics=:9100`。

### 为什么需要

操作系统先按 IP、端口和协议接收连接，Router 才能继续按 HTTP 规则分流。没有监听端口，后面写再多 Router 也没有流量。

### 怎么工作

EntryPoint 属于安装配置。它可以设置监听地址、TCP 生命周期、HTTP 超时、可信转发头、Proxy Protocol、默认中间件、TLS 和可观测性。

### 怎么使用和观察

```yaml
entryPoints:
  web:
    address: ":80"
  websecure:
    address: ":443"
    http:
      tls: {}
```

观察入口是否存在：

```bash
traefik version
ss -lntp
curl -v http://127.0.0.1/
```

容器中还要同时核对容器监听、Docker `ports` 或 Kubernetes Service `port/targetPort`，不能只看进程内部的 `:80`。

### 坏了怎么查

- `connection refused`：进程未监听、容器没映射、Service targetPort 错或防火墙拒绝。
- `timeout`：安全组、LB、路由、NetworkPolicy 或回程路径。
- 启动报 `address already in use`：同一 Pod/主机已有进程占端口。
- 客户端 IP 错：检查外部 LB、`forwardedHeaders.trustedIPs` 或 `proxyProtocol.trustedIPs`，不要直接打开 insecure trust。

## Provider：路由配置从哪里来

### 它是什么

Provider 是配置发现适配器。它把 Docker labels、Kubernetes API 资源、文件或服务目录转换为 Traefik 的 Router、Middleware 和 Service。

### 为什么需要

容器地址不断变化，手工维护后端列表会产生漂移。Provider 让“平台中的声明”成为路由来源。

### 怎么工作

- Docker Provider 读取 Docker API 并默认 watch events。
- Kubernetes Provider 使用 list/watch 读取对象和状态。
- File Provider 读取 YAML/TOML，并可 watch 文件变化。
- 多个 Provider 的对象进入同一运行时，但对象名带 Provider namespace。

全局 `providers.providersThrottleDuration` 默认会在一次配置更新后做短暂节流；Kubernetes Provider 还可设置自己的 `throttleDuration`。这能合并事件风暴，也意味着“刚改完立刻看”的瞬间可能尚未收敛。

不要把“动态更新”误解为“任何错误都会自动保留上一版”。无效的认证或路由配置可能让相关 Router 不再挂载，从外部表现为 404。每次变更都要检查 reload 指标、错误日志、API 对象和真实请求。

### 怎么使用和观察

```yaml
providers:
  docker:
    exposedByDefault: false
    watch: true
  file:
    directory: /etc/traefik/dynamic
    watch: true
```

观察点：

```text
process log
  -> Starting provider
  -> Provider connection established
  -> Configuration received
  -> error while parsing / skipping container or resource

API / dashboard
  -> Routers
  -> Services
  -> Middlewares
  -> Errors
```

### 坏了怎么查

- Docker socket 不存在或权限不足。
- Kubernetes ServiceAccount/RBAC 没有 list/watch 权限。
- `namespaces`、label selector、IngressClass 把对象过滤掉。
- `exposedByDefault=false` 但忘记 `traefik.enable=true`。
- File Provider 监听的是错误目录，或原地写文件产生短暂半成品。
- 多 Provider 对象引用缺少 `@provider`，引用到了错误命名空间。

## Router：哪些请求归谁

### 它是什么

Router 是匹配和转发决策：在指定 EntryPoint 上，用规则判断请求是否属于它，然后调用 Middleware 并选择 Service。

### 为什么需要

80/443 要承载很多应用，需要用域名、路径、方法、Header 等条件区分。

### 怎么工作

常见 matcher：

- ``Host(`example.com`)``：匹配域名。
- `Path(`/api`)`：精确路径。
- `PathPrefix(`/api`)`：路径前缀。
- `Method(`POST`)`：HTTP 方法。
- `Header(`X-Tenant`, `blue`)`：Header。
- `ClientIP(`10.0.0.0/8`)`：客户端地址；不等于自动信任任意 `X-Forwarded-For`。

规则使用反引号或转义双引号，不接受单引号作为 Go string literal。多条规则同时匹配时，建议为关键重叠路由显式设置 `priority`；否则默认按规则长度计算优先级，重构字符串可能改变结果。

### 怎么使用和观察

```yaml
http:
  routers:
    alerts-v1:
      entryPoints:
        - websecure
      rule: "Host(`aiops.example.com`) && PathPrefix(`/api/v1/alerts`)"
      priority: 100
      middlewares:
        - auth
        - rate-limit
      service: alerts
      tls: {}
```

用完全相同的 Host、Path、协议和方法复现：

```bash
curl -vk --resolve aiops.example.com:443:127.0.0.1 \
  https://aiops.example.com/api/v1/alerts
```

### 坏了怎么查

- 404：请求没有匹配 Router，或 Provider 没生成 Router。
- 命中错误服务：规则重叠和 priority。
- HTTP 正常、HTTPS 404：Router 没绑定 `websecure` 或 TLS Router。
- 域名正确仍不命中：实际 Host 带错、端口/代理改写或使用了 IP 请求。
- Dashboard 有 Router 但状态错误：展开详情看 Service、Middleware 和错误信息。

## Middleware：转发前后做什么

### 它是什么

Middleware 是请求/响应处理单元，例如重定向、StripPrefix、AddPrefix、Headers、BasicAuth、ForwardAuth、RateLimit、Retry、CircuitBreaker、Compress、Buffering。

### 为什么需要

跨服务的通用入口策略不应每个应用重复实现。

### 怎么工作

Router Middleware 按声明顺序运行；Service Middleware 在 Router Middleware 之后运行。顺序会改变语义：先认证再限流、先 StripPrefix 再转发，与反过来不是一回事。

### 怎么使用和观察

```yaml
http:
  middlewares:
    api-chain:
      chain:
        middlewares:
          - secure-headers
          - api-limit

    secure-headers:
      headers:
        contentTypeNosniff: true
        frameDeny: true

    api-limit:
      rateLimit:
        average: 100
        burst: 50
```

观察 401/403/429、响应 Header、Middleware 指标与 trace；不要只看后端日志，因为请求可能根本没到后端。

### 坏了怎么查

- 401/403：认证或白名单中间件，而非应用一定拒绝。
- 429：RateLimit；多副本时先确认计数是不是实例本地语义，不能直接当全局租户配额。
- 404：StripPrefix/ReplacePath 后后端路径不再存在。
- 内存/磁盘升高：Buffering、压缩、大请求体或慢客户端。
- 重试放大故障：非幂等请求、重试次数和下游超时预算设计错误。

## Service：最终转到哪些后端

### 它是什么

Traefik Service 是逻辑后端，可以是服务器负载均衡、加权服务、镜像、故障转移等。它不是 Kubernetes Service 的同义词；Kubernetes Provider 会把 Kubernetes 对象转换成 Traefik 的运行时 Service。

### 为什么需要

Router 只回答“这是什么请求”，Service 才回答“有哪些后端、怎么选、如何检查健康”。

### 怎么工作

```yaml
http:
  services:
    alerts:
      loadBalancer:
        passHostHeader: true
        healthCheck:
          path: /health/ready
          interval: 10s
          timeout: 2s
        servers:
          - url: http://alerts-1:8080
          - url: http://alerts-2:8080
```

健康检查是每个 Traefik 实例对每个后端发出的探测。副本数、Service 数、后端数和 interval 相乘，就是探测压力。

### 怎么使用和观察

在 Dashboard/API 中看 Service 的 servers；用访问日志确认实际下游；从 Traefik 所在网络命名空间直连后端。

```bash
curl -v http://alerts-1:8080/health/ready
```

Kubernetes 中继续查：

```bash
kubectl get service,endpointslice,pod -n aiops -o wide
kubectl describe service alerts -n aiops
```

### 坏了怎么查

- 502：地址/端口错、连接拒绝、HTTP/HTTPS 协议错、后端 TLS 校验失败。
- 503：没有可用 server、全部健康检查失败或 Kubernetes 没有 ready endpoint。
- 504：连接或响应超过代理预算；不能只调大 timeout，要找下游慢点。
- 负载不均：长连接、sticky cookie、后端容量差异或外层 LB 分配。

## ServersTransport：Traefik 如何连接后端

ServersTransport 控制 Traefik 到 Backend 的连接行为，尤其是后端 HTTPS：SNI `serverName`、受信 CA、客户端证书、连接池、转发超时等。

```yaml
http:
  serversTransports:
    internal-mtls:
      serverName: alerts.internal.example.com
      rootCAs:
        - /certs/internal-ca.pem
      certificates:
        - certFile: /certs/traefik-client.crt
          keyFile: /certs/traefik-client.key

  services:
    alerts:
      loadBalancer:
        serversTransport: internal-mtls
        servers:
          - url: https://alerts:8443
```

生产不要用 `insecureSkipVerify=true` 掩盖证书问题。应核对后端证书 SAN、SNI、CA 链、时间、证书用途和密钥权限。

## Provider namespace：`name@provider` 是什么

多个 Provider 可以都有名为 `auth` 的 Middleware。Traefik 用 `@provider` 区分来源：

```text
auth@file
auth@docker
auth@kubernetescrd
api@internal
prometheus@internal
```

同一 Provider 内通常可省略后缀；跨 Provider 引用时要写清。`api@internal` 是 Traefik 内部生成的 Service，不是名为 `api` 的 Docker 容器。

排障时同时记录对象名和 Provider。只说“auth 中间件存在”没有意义，还要说是 `auth@file` 还是 `auth@kubernetescrd`。

## HTTP、TCP、UDP 与 TLS 路径

Traefik 不只代理 HTTP。

| 协议路径 | Router 常见规则 | Middleware/Service 特点 | 典型场景 |
|---|---|---|---|
| HTTP | Host、Path、Method、Header | HTTP 中间件、HTTP Service | Web、REST API、gRPC over HTTP/2 |
| TCP | `HostSNI`、`ClientIP` 等 | TCP 中间件、TCP Service | TLS passthrough、数据库、MQTT |
| UDP | EntryPoint 关联 | UDP Service；无 HTTP 语义 | DNS、部分实时协议 |

同一个 EntryPoint 同时有 TCP 与 HTTP Router 时，先按 TCP Router 判断；没有匹配的 TCP Router，才进入 HTTP Router。TLS passthrough 表示 Traefik 不解密业务流量，只按 SNI 等 L4/L5 信息转发，因此无法执行需要读取 HTTP Header/Path 的中间件。

```text
:443 EntryPoint
  -> TCP router HostSNI match?
     -> yes + passthrough -> TLS backend
     -> no -> Traefik terminates TLS / HTTP routing
            -> Host + Path router
            -> HTTP middleware
            -> HTTP service
```

故障判断：

- 证书由 Traefik 返回：TLS termination 路径。
- 证书由后端返回：可能是 passthrough。
- `HostSNI(*)` TCP Router 抢占：HTTP Router 可能永远收不到流量。
- UDP 没有 TCP 式连接，健康和超时语义不同，不能照搬 HTTP 状态码排障。

## File Provider：最容易看懂的配置来源

File Provider 适合学习概念、连接非容器后端、保存 TLS options 和复用 Middleware。

安装配置：

```yaml
providers:
  file:
    directory: /etc/traefik/dynamic
    watch: true
```

使用目录时，不要再同时设置单文件 `filename`。在 Docker、Kubernetes ConfigMap 或网络文件系统中，底层文件通知可能有边界；某些编辑器用“临时文件 + rename”替换文件，单文件 bind mount 可能失去后续通知。优先挂载并监听父目录，提交完整文件后观察 Traefik 日志和 API 是否接收了新配置。

生产配置变更至少保存：

- Git commit 和审批。
- 变更前后渲染结果。
- Traefik 配置接收日志。
- Router/Service API 快照。
- 真实请求回归和回滚证据。

## Docker Provider：用 labels 发现路由

### 工作路径

```text
docker compose up / Docker API change
  -> Docker event
  -> Traefik Docker Provider
  -> inspect container labels, network and exposed ports
  -> build Router / Middleware / Service
  -> connect to container IP:port over shared network
```

### 推荐的安装配置

```yaml
providers:
  docker:
    endpoint: unix:///var/run/docker.sock
    exposedByDefault: false
    watch: true
    network: traefik-proxy
```

官方默认 `exposedByDefault=true`，学习生产安全时建议主动改成 `false`，再只为需要发布的容器添加 `traefik.enable=true`。

### 最小 labels 字典

```yaml
services:
  alerts:
    image: example/alerts:1.0.0
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.alerts.entrypoints=web"
      - "traefik.http.routers.alerts.rule=Host(`alerts.localhost`)"
      - "traefik.http.routers.alerts.service=alerts"
      - "traefik.http.services.alerts.loadbalancer.server.port=8080"
```

字段怎么读：

| Label | 作用 | 常见坑 |
|---|---|---|
| `traefik.enable=true` | 允许 Provider 暴露此容器 | `exposedByDefault=false` 时忘写会完全没有 Router |
| `routers.alerts.entrypoints=web` | 绑定入口 | 名字必须与安装配置一致 |
| `routers.alerts.rule=...` | 匹配 Host/Path | Compose/YAML/反引号转义写错 |
| `routers.alerts.service=alerts` | 显式指向 Service | 多 Service 时引用错名 |
| `services.alerts.loadbalancer.server.port=8080` | 容器内部监听端口 | 不是宿主机映射端口；写错常见 502 |
| `traefik.docker.network=...` | 指定连接容器所用网络 | Traefik 不在该网络或同名网络实际带 project 前缀 |

Traefik 通常连接容器网络 IP 和容器内部端口，不是 `127.0.0.1:宿主机映射端口`。容器暴露多个端口时应显式设置 server port，避免自动选择不符合预期。

### Docker socket 是高权限边界

挂载 `/var/run/docker.sock` 让 Traefik 能读取容器元数据，但 Docker API 本身是高权限控制面。即使卷标记 `:ro`，也不等于 API 只读，因为 socket 调用不是普通文件写入。

兼容性还要进入升级清单：从 Traefik `v3.6.16` 起，Docker Provider 要求 Docker API `v1.40+`，对应 Docker Engine 19.03 及以后。旧 Engine 即使容器还能启动，也可能无法让 Provider 正常工作。

生产可选措施：

- 使用只放行必要 Docker API 的 socket proxy，并限制网络来源。
- 使用受保护的 SSH/TLS Docker endpoint。
- 把 Traefik 和不可信工作负载隔离。
- `exposedByDefault=false` 加 constraints，缩小发现范围。
- 不把密码、Token 等明文放在 labels；有权限读取 Docker metadata 的主体能看到 labels。

## Kubernetes 有四条常见路由主线

Traefik 在 Kubernetes 中不是只有一种 YAML。

| Provider | 主要资源 | 适合什么 | 边界 |
|---|---|---|---|
| `kubernetesIngress` | 标准 `Ingress` | 维护普通 Ingress | Ingress API 功能已冻结，扩展依赖 annotation |
| `kubernetesIngressNGINX` | Ingress + 部分 ingress-nginx annotations | 从已退役社区 ingress-nginx 迁移 | 不是原 ingress-nginx 二进制，annotation 兼容不是 100% 行为等价 |
| `kubernetesCRD` | `IngressRoute`、`Middleware`、`TraefikService` 等 | 使用 Traefik 特有功能 | CRD 与 RBAC 必须随版本升级；可移植性较弱 |
| `kubernetesGateway` | `GatewayClass`、`Gateway`、`HTTPRoute` 等 | 新的标准化入口与多角色治理 | 要先安装 Gateway API CRD，并核对 conformance/扩展支持 |

新平台优先评估 Gateway API；需要 Traefik 特有能力时再评估 CRD。存量 Ingress 不必一夜重写，但要建立迁移、回归和回滚计划。

### Kubernetes Provider 如何调和

```text
Kubernetes API
  -> list/watch Gateway, Route, Service, EndpointSlice, Secret ...
  -> Traefik Provider filters by class/namespace/selector
  -> derive runtime Router and Service
  -> update route status where the API defines status
  -> proxy traffic to Service/Pod path
```

这不是把 Kubernetes YAML 原样交给代理。Provider 会选择对象、解析引用、读取 Service/EndpointSlice/Secret，再生成内部配置。RBAC 缺一项、class 不匹配、跨 namespace 未授权，都可能让对象存在但不生效。

### Kubernetes 支持范围

Traefik Provider 文档说明至少支持 Kubernetes 最新三个 minor。本文快照对应 Kubernetes 1.34、1.35、1.36，但这是根据 2026-08-14 版本窗口作出的推导；官方 Chart v41 同时给出 Kubernetes Server `>=1.25`、Helm `>=3.9` 的安装下限。下限不代表旧 minor 仍处于完整测试窗口，部署当天要同时核对 Proxy、Chart、Kubernetes、Gateway API/Traefik CRD 和云厂商矩阵。

## Kubernetes Ingress Provider

最小 Ingress：

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: alerts
  namespace: aiops
spec:
  ingressClassName: traefik
  rules:
    - host: alerts.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: alerts
                port:
                  number: 8080
```

排障顺序：

```bash
kubectl get ingressclass
kubectl describe ingress alerts -n aiops
kubectl get service,endpointslice,pod -n aiops -o wide
kubectl logs -n traefik deploy/traefik --since=10m
```

Ingress 的 `backend.resource` 形式不被 Traefik Kubernetes Ingress Provider 支持；应引用 `backend.service`。annotation 属于具体实现，不要把 ingress-nginx annotation 原样复制到标准 Traefik Provider 并假设有效。

## Kubernetes CRD Provider

CRD 主线把 Traefik 概念直接表达成 Kubernetes 资源：

```yaml
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: security-headers
  namespace: aiops
spec:
  headers:
    contentTypeNosniff: true
    frameDeny: true
---
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: alerts
  namespace: aiops
spec:
  entryPoints:
    - websecure
  routes:
    - match: Host(`alerts.example.com`) && PathPrefix(`/`)
      kind: Rule
      middlewares:
        - name: security-headers
      services:
        - name: alerts
          port: 8080
  tls: {}
```

重要安全默认值：

- `allowCrossNamespace=false`：默认不允许 IngressRoute 随意引用别的 namespace 资源。
- `allowExternalNameServices=false`：默认不随意把路由指向外部 DNS 名称。
- namespace、label selector 和 IngressClass 应限制 Provider 观察范围。
- 升级 Traefik 前先升级匹配版本的 CRD 和 RBAC；Helm 不会自动替你升级已有 CRD。

`allowEmptyServices` 会影响无 endpoint 时的外部行为。CRD Provider 中启用后可保留空 Service 并返回 503；未启用时资源可能不生成预期 Service，从外部看成 404。排障不能只背状态码，要看 API 中是否存在 Router/Service。

## Kubernetes Gateway API Provider

### 四个核心对象

```text
GatewayClass
  -> 谁实现网关，平台级

Gateway
  -> 在哪里监听、哪些 listener，基础设施团队

HTTPRoute / GRPCRoute / TLSRoute / TCPRoute
  -> 什么流量到哪个 Backend，应用团队

ReferenceGrant
  -> 目标 namespace 是否同意被跨 namespace 引用
```

Traefik 的 `GatewayClass.spec.controllerName` 为：

```yaml
spec:
  controllerName: traefik.io/gateway-controller
```

本文快照中 Traefik `v3.7.10` 已把 Gateway API 依赖更新到 `v1.6.1`。Standard 与 Experimental channel 要分开：例如 Experimental 资源需显式安装对应 CRD，并启用 `experimentalChannel`，不能看到类型名就默认可用。

### v3.7.10 与 Gateway API v1.6.1 的真实陷阱

这是版本组合问题，不是普通 YAML 拼写问题：

1. Gateway API 1.6 把 TCPRoute 提升到了 Standard。
2. Traefik v3.7 仍以 `v1alpha2` 监听 TCPRoute。
3. v1.6.1 的 standard CRD 不提供 Traefik 此时需要的该版本。
4. 如果只安装 `standard-install.yaml`，却设置 `experimentalChannel=true`，Gateway Provider 可能一直无法完成启动。
5. Traefik 进程、`/ping` 和其他 Provider 仍可能正常，因此容易出现“Pod 全绿，Gateway Route 全没了”。

处理分支：

| 真实需求 | 配置选择 | 还要验证什么 |
|---|---|---|
| 不使用 TCPRoute/Experimental 资源 | 保持 `experimentalChannel=false` | HTTPRoute/GRPCRoute 等所需 CRD 与 conditions |
| 确实需要 Traefik v3.7 的 TCPRoute | 安装 v1.6.1 `experimental-install.yaml` 并开启 channel | TCPRoute CRD `served` versions、RBAC、Provider 路由 |
| 暂不升级 Gateway API CRD | 保留已验证的兼容 v1.5.x 组合 | 支持/安全技术债和后续迁移窗口 |

不能把“未来升级某个尚未正式发布的 Traefik 版本”当当前修复。应先核对 `kubectl get crd tcproutes.gateway.networking.k8s.io -o yaml`、实际 Helm values、每个 Traefik Pod 的 Provider 日志、Gateway/Route conditions 和 API rawdata。

### 最小 HTTPRoute

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: alerts
  namespace: aiops
spec:
  parentRefs:
    - name: traefik-gateway
      namespace: traefik
  hostnames:
    - alerts.example.com
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /
      backendRefs:
        - name: alerts
          port: 8080
```

真正的验证不是 `kubectl apply` 成功，而是 status conditions 和真实请求：

```bash
kubectl get gatewayclass,gateway -A
kubectl get httproute alerts -n aiops -o yaml
kubectl describe httproute alerts -n aiops
```

重点条件：

- Route 的 `Accepted=True`：Route 被 listener 接受。
- Route 的 `ResolvedRefs=True`：Backend、Secret 等引用可解析并获授权。
- Gateway 的 `Programmed=True`：实现已把 Gateway 配置下发到数据面；仍不等于每个 Backend 健康。

`Accepted=True` 不证明 Backend 有 ready endpoint，也不证明 DNS/LB 已通。跨 namespace Backend/Secret 引用应使用 Gateway API 的 `ReferenceGrant`，不要靠打开 Traefik 全局跨租户权限绕过所有权。

## 安装方式怎么选

| 方式 | 适合 | 主要证据 | 生产注意 |
|---|---|---|---|
| 二进制/系统服务 | VM、裸机、传统环境 | 配置文件、systemd、监听端口 | 用户权限、文件权限、升级替换、日志轮转 |
| Docker/Compose | 学习、单机、小规模 | Compose、labels、Docker network | socket 权限、单机故障域、数据卷 |
| Kubernetes Helm | 集群生产主线 | values、CRD、Deployment、Service、Gateway | Chart/Proxy 双版本、RBAC、PDB、反亲和、CRD 升级 |

基础学习从 Compose 最直观；生产 Kubernetes 用官方 Helm Chart，并把 `values.yaml`、CRD 版本、Gateway API 版本、镜像 digest 和回滚版本一起纳入 Git。

## Docker Compose 完整基础配置

下面只用于本机学习。Dashboard 使用 `api.insecure=true`，但端口严格绑定 `127.0.0.1`；生产禁止照抄 insecure 模式。

```yaml
name: traefik-lab

services:
  traefik:
    image: traefik:v3.7.10
    command:
      - "--entrypoints.web.address=:80"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--api.dashboard=true"
      - "--api.insecure=true"
      - "--ping=true"
      - "--accesslog=true"
      - "--accesslog.format=json"
      - "--log.level=INFO"
      - "--metrics.prometheus=true"
    ports:
      - "127.0.0.1:8088:80"
      - "127.0.0.1:8080:8080"
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock:ro"
    networks:
      - proxy

  whoami:
    image: traefik/whoami:v1.12.0
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.whoami.entrypoints=web"
      - "traefik.http.routers.whoami.rule=Host(`whoami.localhost`)"
      - "traefik.http.routers.whoami.service=whoami"
      - "traefik.http.services.whoami.loadbalancer.server.port=80"
    networks:
      - proxy

networks:
  proxy:
    name: traefik-lab-proxy
```

为什么同时显式写 Router 和 Service：这样新手能看见每一层的名字与端口；依赖自动默认规则虽然更短，却会隐藏排障信息。

## Kubernetes Helm 安装主线

前置：可丢弃或已获授权的 Kubernetes 集群、`kubectl`、Helm、可用 LoadBalancer/NodePort 方案。

### 1. 安装 Gateway API 标准 CRD

```bash
kubectl apply -f \
  https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.6.1/standard-install.yaml
```

### 2. 添加官方 Chart 仓库并检查版本

```bash
helm repo add traefik https://traefik.github.io/charts
helm repo update
helm search repo traefik/traefik --versions | head
helm show chart traefik/traefik --version 41.2.0
```

### 3. 保存最小 `values.yaml`

```yaml
deployment:
  replicas: 2

providers:
  kubernetesIngress:
    enabled: false
  kubernetesCRD:
    enabled: true
    allowCrossNamespace: false
  kubernetesGateway:
    enabled: true
    experimentalChannel: false

gateway:
  enabled: true

log:
  level: INFO

accessLog:
  enabled: true
  format: json

metrics:
  prometheus: {}

podDisruptionBudget:
  enabled: true
  minAvailable: 1
```

这只是教学起点，不是生产完整 values。生产还要按集群能力补 requests/limits、拓扑分散、反亲和、Service annotations、NetworkPolicy、TLS Secret、监控抓取和安全上下文。

### 4. 安装并核对

```bash
helm upgrade --install traefik traefik/traefik \
  --namespace traefik \
  --create-namespace \
  --version 41.2.0 \
  --values values.yaml \
  --wait \
  --timeout 10m

helm list -n traefik
kubectl get deploy,pod,service,gatewayclass,gateway -n traefik
kubectl rollout status deploy/traefik -n traefik --timeout=5m
```

`--wait` 成功只证明 Helm 观察的资源达到条件，不证明每个域名、Route、证书和业务接口成功。必须继续检查 status 和真实流量。

## 常用命令字典

### 版本与安装配置

```bash
traefik version
traefik --configFile=/etc/traefik/traefik.yml
```

- 目的：确认二进制版本与明确配置文件。
- 预期：版本与变更单一致，启动日志显示正确配置来源。
- 坑：容器镜像 tag、实际 digest、Chart appVersion 不是一回事。

### Docker Compose 静态检查

```bash
docker compose config --quiet
docker compose config
```

- 目的：解析 YAML、变量和合并后的最终配置。
- 预期：quiet 返回 0；完整输出能看到 labels。
- 坑：通过只证明 Compose 语法，不证明 Traefik rule、后端端口或 Docker daemon 正常。

### 启动、状态与日志

```bash
docker compose up -d
docker compose ps
docker compose logs traefik --since 10m
```

- 目的：启动实验、看容器状态、读 Provider/路由日志。
- 预期：Traefik 和 whoami 都运行，日志出现 Docker Provider 连接。
- 坑：容器 `running` 不等于 Router 命中或后端健康。

### Dashboard/API

```bash
curl http://127.0.0.1:8080/api/overview
curl http://127.0.0.1:8080/api/http/routers
curl http://127.0.0.1:8080/api/http/services
curl http://127.0.0.1:8080/api/rawdata
```

- 目的：检查运行时对象和配置错误。
- 预期：能找到预期 Router、Service 和 Provider。
- 坑：`api.insecure` 仅限绑定 loopback 的本机实验；生产应用安全 Router + TLS + 认证 + 网络限制。

### 精确模拟 Host

```bash
curl -v -H "Host: whoami.localhost" http://127.0.0.1:8088/
```

- 目的：绕过本地 DNS，验证 Router rule。
- 预期：状态 200，响应显示 whoami 容器信息。
- 坑：PowerShell 中要使用 `curl.exe` 才是原生 curl；`curl` 可能是别名。

### Kubernetes 对象链

```bash
kubectl get gatewayclass,gateway,httproute -A
kubectl get service,endpointslice,pod -A -o wide
kubectl logs -n traefik deploy/traefik --since=10m
kubectl events -n traefik --types=Warning
```

- 目的：把 Route status、Backend endpoint、Traefik 日志和事件串起来。
- 预期：conditions 正常、EndpointSlice 有 ready 地址、日志无解析/RBAC错误。
- 坑：只看 `kubectl get pod` 的 Running。

### 清理实验

```bash
docker compose down --remove-orphans
helm uninstall traefik -n traefik
```

Gateway API CRD、Traefik CRD 和 namespace 可能被其他实验共用，删除前先盘点 owner 和引用，不能把清理命令机械扩展成集群级删除。

## TLS 与证书：四件事不要混

| 概念 | 回答的问题 | 常见证据 |
|---|---|---|
| TLS termination | 谁解密客户端连接 | 客户端看到的证书、Traefik Router TLS 配置 |
| TLS passthrough | Traefik 是否不解密直接转发 | TCP Router `tls.passthrough`、后端证书 |
| Backend TLS | Traefik 到后端是否再次使用 TLS | Service URL、ServersTransport、后端握手日志 |
| ACME | 证书如何自动签发和续期 | Certificate Resolver、challenge、`acme.json`、CA 日志 |

### ACME 的三个 challenge

- HTTP-01：CA 从公网访问域名的 80 端口；DNS 必须指向此 Traefik，外层不得截断 challenge。
- TLS-ALPN-01：CA 访问 443，Traefik处理特殊 TLS-ALPN challenge。
- DNS-01：通过 DNS Provider 创建 TXT 记录；支持通配符，但 DNS API 凭据是高敏感 Secret。

最小 HTTP-01 安装配置：

```yaml
entryPoints:
  web:
    address: ":80"
  websecure:
    address: ":443"

certificatesResolvers:
  letsencrypt:
    acme:
      email: ops@example.com
      storage: /data/acme.json
      httpChallenge:
        entryPoint: web
```

Router 引用解析器：

```yaml
http:
  routers:
    alerts:
      entryPoints:
        - websecure
      rule: "Host(`alerts.example.com`)"
      service: alerts
      tls:
        certResolver: letsencrypt
```

### ACME 状态和多副本红线

Traefik Proxy OSS 默认把 ACME 账号与证书写进 `acme.json`。它不是多副本一致性数据库，不能把多个 Pod 指向一个普通共享文件后假设获得安全分布式续期。

官方给出的边界是：

- 需要 Kubernetes 中的 Let’s Encrypt HA，可使用 cert-manager 一类证书 controller，把证书写入 Kubernetes Secret，再由多个 Traefik 副本读取。
- 官方 ACME 文档也指向带分布式 Let’s Encrypt 能力的商业方案；是否可用要核对当前产品和许可证。
- 单实例文件方案要持久化、备份、限制权限，并避免多个写者。

推荐 Kubernetes 路径：

```text
cert-manager
  -> ACME order/challenge
  -> Kubernetes TLS Secret
  -> Gateway listener / Ingress / IngressRoute references Secret
  -> all Traefik replicas read the same declared certificate
```

### ACME 排障顺序

1. 域名 A/AAAA/CNAME 是否指向正确入口。
2. 公网 80/443 是否真的到达当前 Traefik。
3. Router 是否启用 TLS 并引用正确 resolver。
4. challenge 类型与端口/DNS API 是否匹配。
5. CA 是否触发 rate limit；先用 staging 环境测试。
6. `acme.json` 是否可写、持久化、权限合适，Pod 是否频繁重建。
7. Traefik 时间、DNS、出口代理和 CA 证书链是否正常。
8. 修复后用 `openssl s_client` 和真实域名检查证书链、SAN、有效期，不只看日志“renewed”。

```bash
openssl s_client -connect alerts.example.com:443 \
  -servername alerts.example.com -showcerts </dev/null
```

## 状态、一致性与高可用

### Traefik Proxy 是“无中心数据库”，不是“没有状态”

大多数路由真相来自 Docker/Kubernetes/File Provider，每个 Traefik 副本在本地构建运行时配置。它们之间没有 Raft，也不通过一个 Traefik leader 复制 Router。

“副本可能短暂不一致”是根据官方 Provider 独立监听、动态更新和节流机制得出的工程推论，不是官方承诺的跨副本事务模型；生产必须逐 Pod 用日志、指标、API 和真实探针验证。

```text
Kubernetes API / Docker API / Git-managed files
  -> replica A watches and builds local runtime
  -> replica B watches and builds local runtime
  -> replica C watches and builds local runtime

external LB
  -> distributes client connections across A/B/C
```

所以生产一致性应这样理解：

- 声明源是共同真相，但各副本收到 watch event、完成解析和生效存在短暂时间差。
- `providersThrottleDuration` 和 Provider throttle 会主动合并高频事件。
- 安装配置来自各 Pod 的 args/values；滚动发布期间新旧版本可能并存。
- active connection、健康检查结果、连接池、断路器或本地限流状态属于实例运行时，不能自动当全局状态。
- ACME 文件、插件缓存等仍是实际状态，必须单独设计。

### 高可用最小设计

```text
two or more zones
  -> external load balancer
  -> 3 Traefik replicas
     -> topology spread / anti-affinity
     -> PodDisruptionBudget
     -> requests / limits
     -> readiness / liveness
  -> shared declarative providers
  -> centralized logs / metrics / traces
  -> external certificate controller
```

必须验证：

- 外部 LB 能探测并摘除终止中的实例。
- Traefik graceful shutdown、LB deregistration 和 Pod termination grace 对齐。
- PDB 不会在只有两个副本时阻塞必要升级，也不会允许维护一次清空入口。
- 多可用区的 Service、CNI、LB 和 DNS 真正有跨区路径。
- 每个副本都加载相同 Router/Service 数；对配置 hash 或 API 摘要做只读比较。
- 一个副本失败、一个节点维护、一个可用区隔离时，容量仍能承载目标流量。

### `/ping` 的边界

`/ping` 返回 200 说明 Traefik 进程能处理这个内部 handler。优雅终止期间默认可返回 503，便于 LB 摘除。但它不验证：

- Kubernetes API/Docker Provider 当前可用。
- Router 已收敛。
- 证书有效。
- Backend 健康。
- 真实用户 Host/Path 能成功。

因此探针分层：

```text
liveness  -> /ping，进程是否卡死
readiness -> /ping + 启动/终止状态，是否接新连接
synthetic -> 真实域名、TLS、Router、Middleware、Backend 的业务探针
```

## 容量与性能

### 先算并发，不只看 RPS

近似公式：

```text
in-flight requests ≈ requests per second × average response time
```

如果 2,000 RPS、平均 0.2 秒，平均在途约 400；如果下游变慢到 3 秒，同样流量会变成约 6,000 个在途请求。慢下游会把连接、内存、文件描述符和 goroutine 一起推高。

容量模型至少包括：

- 峰值 RPS、并发连接、连接建立率。
- TLS handshake/秒和证书算法。
- 请求/响应体大小与总带宽。
- P50/P95/P99 下游延迟。
- WebSocket、SSE、gRPC streaming 等长连接数和持续时间。
- Router/Middleware 数量、规则复杂度、ForwardAuth/压缩/重试成本。
- Provider 对象数、Kubernetes API QPS/burst 和配置变更率。
- access log、metrics label 与 trace 采样产生的 CPU、网络和存储量。

### 文件描述符粗略理解

一条代理请求常同时占用客户端连接和后端连接；Keep-Alive 与连接池能复用，但长连接会长期占用。粗略规划时应把：

```text
client sockets
+ backend sockets
+ listening sockets
+ provider/API connections
+ log and certificate files
+ safety margin
```

都放进 FD 预算，再用压测和进程指标校准，不能把公式当保证值。

### 扩容前先找瓶颈

| 现象 | 先看 | 可能动作 |
|---|---|---|
| CPU 高、TLS handshake 高 | CPU profile、TLS 指标、连接复用 | 增副本、连接复用、证书算法/终止层评估 |
| 内存高 | 大 body、Buffering、长连接、trace/log queue | 限制 body/header、减少缓冲、修下游慢点 |
| P99 高但 CPU 低 | 后端延迟、连接池、DNS、网络丢包 | 优化下游、超时预算、连接池和网络 |
| 配置更新慢 | Provider event、API QPS、throttle、对象数量 | 限制 watch 范围、调 QPS/burst、减少事件风暴 |
| 5xx 随副本增加而增加 | 副本配置/Secret/网络差异 | 对比每副本配置和探针，不盲目再扩容 |

性能调优必须有基线、压测流量模型、停止条件和回滚。只把 timeout 调大，通常是把失败等待得更久。

## 超时、重试和断路器

超时要形成从外到内逐层收紧的预算：

```text
client deadline
  > external LB timeout
    > Traefik total/backend budget
      > application dependency timeout
```

真实产品的字段分布在 EntryPoint transport、ServersTransport、ForwardAuth、health check 等位置，应按固定版本 reference 配置，不要创造一个不存在的“global request timeout”。

重试原则：

- GET/HEAD 等幂等请求较容易安全重试。
- POST 只有在业务有幂等键、去重和明确语义时才可自动重试。
- 每层都重试会乘法放大流量；应指定唯一主要重试层和总预算。
- Retry/CircuitBreaker 是保护手段，不是修复后端慢或容量不足。
- 多副本本地断路器看到的是各自样本，状态不等于全局一致。

## 安全边界

### 1. Dashboard/API

生产不要启用 `api.insecure=true` 并暴露 8080。安全路径是：

```text
dedicated secure router
  -> TLS
  -> authentication/authorization middleware
  -> IP or network restriction
  -> api@internal
```

同时在云 LB、安全组、NetworkPolicy 和管理网限制来源。Dashboard 包含路由、服务名、后端和错误信息，本身就是敏感资产地图。

### 2. 真实客户端 IP

只有明确列出的上游 LB/CDN 地址才可进入：

```yaml
entryPoints:
  websecure:
    address: ":443"
    forwardedHeaders:
      trustedIPs:
        - 10.20.0.0/16
```

不要为了“拿到真实 IP”打开 `forwardedHeaders.insecure=true`。否则客户端可伪造 `X-Forwarded-For`，污染审计、IP allowlist 和限流键。使用 Proxy Protocol 时也要配置可信来源，并确保外层 LB 确实发送相同版本。

### 3. Provider 最小权限

- Docker endpoint 是高权限控制面，使用隔离代理、TLS、网络 ACL 和最小 API。
- Kubernetes 用专用 ServiceAccount、最小 RBAC、namespace/selector/class 过滤。
- `allowCrossNamespace` 默认关闭；Gateway API 用 `allowedRoutes` 和 `ReferenceGrant` 表达所有权。
- File Provider 配置目录只允许交付进程写，Traefik 运行用户只读。

### 4. TLS 与 Secret

- 最低 TLS 版本和 cipher policy 按组织基线设置。
- 私钥放 Secret/受控文件，不放 labels、Git 明文或日志。
- 后端 HTTPS 使用受信 CA 和正确 SNI，不用 `insecureSkipVerify`。
- DNS-01 凭据限制到需要的 zone/record 权限并轮换。
- 监控证书剩余天数、续期失败与默认自签证书误用。

### 5. Middleware 与插件

- ForwardAuth 地址、超时、Header 白名单和失败策略属于认证边界。
- BasicAuth hash 仍是敏感配置；labels/annotations 可被平台读者看到。
- 插件运行在代理请求路径，必须固定 module/version、审计源码和依赖、验证发布者与供应链，并准备插件不可下载或启动失败的回滚。
- 任意 Header、rewrite、跨 namespace 和外部服务引用都要受策略控制，避免租户越权。

### 6. 请求资源限制

合理设置 Header 大小、读取/空闲超时、并发、请求体和速率限制，防止慢连接、大 Header、大 body、压缩或 Buffering 耗尽资源。限制值要基于业务最大合法请求，并对误杀提供可观测证据。

## 可观测性四件套

### 进程日志

回答：Traefik 自己是否启动、Provider 是否连接、配置是否解析、证书是否签发。

生产建议 JSON，统一时间、实例、版本和变更标签。DEBUG 会包含大量配置细节，只在受控时间窗启用，防止成本和敏感信息扩散。

### Access Log

回答：哪一个客户端用什么 Host/Path，命中了什么 Router/Service，下游是谁，状态码与耗时是多少。

建议字段维度：

```text
timestamp
request host / method / path
entrypoint
router name
service name
backend address
status code
request duration
downstream/upstream timing
retry count
trace id
```

Header 默认策略和自定义字段要审计，Authorization、Cookie、Token、个人信息不得直接进入集中日志。

### Metrics

Prometheus 常用方向：

- EntryPoint 请求量、状态码、持续时间。
- Router 请求量和错误率。
- Service 请求量、状态码、持续时间、open connections。
- TLS 证书相关指标。
- 进程 CPU、内存、GC、FD 与重启。

Router/Service labels 可能产生高基数。路由名若含动态租户、随机环境或版本号，时序数量会膨胀；上线前估算 `replica × entrypoint × router × service × status/method` 组合。

### Tracing

Traefik 可通过 OpenTelemetry 等方式输出 trace。`minimal` 适合常规开销，`detailed` 会为更多中间件产生 span，排障更细但成本更高。

Trace 必须继续传播到应用才有端到端价值。只有入口 span 时，只能证明“Traefik 花了多久和下游调用多久”，不能直接知道应用内部哪个 SQL 慢。

### 一条可执行告警

不要只写“Traefik 5xx > 0”。更实用的告警包含：

```text
condition:
  5xx ratio > 2% for 5m
and:
  request volume > 100/min
group by:
  cluster, entrypoint, router, service
attach:
  dashboard, logs query, recent deployment, route status, endpoint count
runbook:
  compare 404/502/503/504 evidence paths
```

这样既避免低流量噪声，也能直接进入排障。

## 生产发布、升级与回滚

### 发布前盘点

```bash
traefik version
helm list -n traefik
helm get values traefik -n traefik -a
helm get manifest traefik -n traefik
kubectl get crd | grep -E 'traefik|gateway.networking.k8s.io'
kubectl get gatewayclass,gateway,httproute -A
kubectl get ingress,ingressroute -A
```

保存镜像 digest、Chart version、Traefik CRD/Gateway API CRD、values、插件、证书、Provider 和全部路由数量。没有基线就无法证明升级改变了什么。

### 推荐顺序

1. 阅读 Traefik Proxy 当前 minor migration、目标 patch release 和安全公告。
2. 阅读 Helm Chart release notes；Chart major 表示可能有不兼容变化。
3. 在一次性环境安装目标 Gateway API CRD、Traefik CRD 和 Chart。
4. 用 server-side dry-run/模板渲染检查 Kubernetes 对象与字段。
5. 先升级 CRD。Helm 默认不会升级已安装 CRD，不能只跑 `helm upgrade`。
6. 小批/金丝雀升级 Traefik，保留旧版本实例和明确停止阈值。
7. 回归 Host、Path、rewrite、认证、TLS、WebSocket、gRPC、大 body、超时、客户端 IP 和性能。
8. 比较新旧实例 Router/Service 数、5xx、P99、CPU、内存、证书和日志。
9. 达到停止阈值立即回滚镜像/Chart，并评估 CRD 向后兼容，不能默认 CRD 自动回滚。
10. 观察窗结束后再清理 deprecated 配置和旧版本。

### Helm CRD 升级示例

```bash
helm repo update
helm show crds traefik/traefik --version 41.2.0 \
  | kubectl apply --server-side --force-conflicts -f -

helm upgrade traefik traefik/traefik \
  --namespace traefik \
  --version 41.2.0 \
  --values values.yaml \
  --wait \
  --timeout 10m
```

`--force-conflicts` 会接管 CRD 字段所有权，必须先在测试环境查看 server-side dry-run 和 managedFields；不要在不清楚 CRD owner 的共享集群机械执行。

### v2 到 v3

官方迁移主线是先改安装配置，再逐步迁移路由语法和动态资源。关键动作：

- 先在测试实例使用 v3，读取 error/deprecation 日志。
- 必要时短期使用 v2 rule syntax 兼容开关，不把它当永久方案。
- 滚动升级并实时观察入口错误，准备回滚。
- 逐个迁移 Docker labels、Ingress/CRD 和 Router 语法。
- 全部完成后移除兼容开关。

v3 不等于“改镜像 tag 就结束”。过期 CRD API group、移除字段、rule syntax、metrics、tracing 和 Provider 行为都要逐项盘点。

## 基础实验：用 Docker Compose 跑通第一条动态路由

### 实验目标

亲眼验证这条链：

```text
compose labels
  -> Docker Provider
  -> whoami Router
  -> whoami Service
  -> whoami container:80
  -> HTTP 200
```

### 前置条件

- Docker Engine 或 Docker Desktop daemon 正常。
- `docker compose version` 可执行。
- 本机 `127.0.0.1:8080` 和 `127.0.0.1:8088` 未被占用。
- 能拉取 `traefik:v3.7.10` 与 `traefik/whoami:v1.12.0`。
- 只在自己的电脑或授权实验机执行。

先检查：

```powershell
docker version
docker compose version
Get-NetTCPConnection -LocalPort 8080,8088 -ErrorAction SilentlyContinue
```

Linux 可用：

```bash
docker version
docker compose version
ss -lntp | grep -E ':8080|:8088' || true
```

### 第 1 步：创建实验目录

PowerShell：

```powershell
New-Item -ItemType Directory -Force traefik-lab
Set-Location traefik-lab
```

Bash：

```bash
mkdir -p traefik-lab
cd traefik-lab
```

把上文“Docker Compose 完整基础配置”保存为 `compose.yaml`。不要把生产 Docker socket、域名或密码复制进这个公开实验。

### 第 2 步：只做静态检查

```bash
docker compose config --quiet
docker compose config
```

预期：

- 第一条命令退出码为 0。
- 渲染结果含 `traefik:v3.7.10`、`traefik/whoami:v1.12.0`。
- whoami labels 中的 Router rule 仍是 ``Host(`whoami.localhost`)``。
- 两个服务都在 `traefik-lab-proxy` 网络。

如果失败先查：YAML 缩进、引号、反引号、Docker Compose 版本和环境变量替换。静态检查通过不代表 daemon 与路由已成功。

### 第 3 步：拉取并启动

```bash
docker compose pull
docker compose up -d
docker compose ps
```

预期：Traefik 与 whoami 都是运行状态。首次拉取耗时取决于网络。

### 第 4 步：验证进程、Provider 与运行时对象

```bash
curl http://127.0.0.1:8080/ping
curl http://127.0.0.1:8080/api/overview
curl http://127.0.0.1:8080/api/http/routers
curl http://127.0.0.1:8080/api/http/services
```

预期：

- `/ping` 返回 `OK`。
- Router 列表中能找到类似 `whoami@docker`。
- Service 列表中能找到类似 `whoami@docker`。

名称可能包含 Provider 后缀；以 API 实际返回为准，不用截图猜。

### 第 5 步：发出与 Router 完全一致的请求

PowerShell：

```powershell
curl.exe -v -H "Host: whoami.localhost" http://127.0.0.1:8088/
```

Bash：

```bash
curl -v -H 'Host: whoami.localhost' http://127.0.0.1:8088/
```

预期：HTTP 200，响应正文包含 whoami 看到的 Host、IP、Header 等信息。

再故意使用不匹配的 Host：

```bash
curl -i -H 'Host: wrong.localhost' http://127.0.0.1:8088/
```

预期：404。这个 404 是“没有 Router rule 匹配”的教学结果，不是 whoami 挂了。

### 第 6 步：用日志闭环

```bash
docker compose logs traefik --since 5m
```

检查：

- Docker Provider 已连接。
- 正确 Host 请求为 200，错误 Host 请求为 404。
- 日志时间、Router/Service、客户端和持续时间是否足够支持排障。

### 验收标准

- [ ] Compose 静态检查返回 0。
- [ ] `/ping` 返回 `OK`。
- [ ] API 中存在 `whoami@docker` Router 和 Service。
- [ ] 正确 Host 返回 200。
- [ ] 错误 Host 返回 404。
- [ ] 能用日志解释两次请求为什么不同。

### 如果没有成功，先查这些

1. `docker version` 是否同时显示 Client 和 Server；只有 Client 表示 daemon 未运行。
2. 8080/8088 是否被占用。
3. `docker compose ps` 是否有 exited/restarting。
4. `docker compose logs traefik` 是否显示 socket 权限或 Provider 连接错误。
5. `docker compose config` 中 label 是否被 shell/YAML 改坏。
6. Traefik 与 whoami 是否在同一 network。
7. Service port 是否为容器内部 `80`。
8. 请求是否真的带 `Host: whoami.localhost`。

### 清理

```bash
docker compose down --remove-orphans
```

确认只会删除当前 Compose project 的容器和网络；本实验没有声明持久卷。镜像缓存仍保留，是否删除由使用者自行决定。

## 故障注入实验：把后端端口写错，制造可恢复的 502

### 实验目标

学会区分：

```text
404 -> 没有 Router 匹配
502 -> Router 和 Service 已存在，但连接 Backend 失败
```

### 前置条件与安全边界

- 基础实验已经返回 200。
- 只在 `traefik-lab` 一次性项目操作。
- 先保存当前 `compose.yaml`；不改其他 Docker project。
- 故障持续时间控制在 10 分钟内。

### 第 1 步：保存可回滚版本

PowerShell：

```powershell
Copy-Item compose.yaml compose.good.yaml
```

Bash：

```bash
cp compose.yaml compose.good.yaml
```

### 第 2 步：只改一个字段

把：

```yaml
- "traefik.http.services.whoami.loadbalancer.server.port=80"
```

改为：

```yaml
- "traefik.http.services.whoami.loadbalancer.server.port=9999"
```

先验证变更范围：

```bash
docker compose config --quiet
docker compose config
```

### 第 3 步：让 Docker 产生配置事件

```bash
docker compose up -d --force-recreate whoami
docker compose ps
```

Traefik 的 Docker Provider 会发现新 labels，不需要手工 reload。

### 第 4 步：复现并采证

```bash
curl -i -H 'Host: whoami.localhost' http://127.0.0.1:8088/
curl http://127.0.0.1:8080/api/http/services
docker compose logs traefik --since 3m
docker compose logs whoami --since 3m
```

预期：

- Router 仍存在，说明 Host rule 不是主要问题。
- Service 指向容器的 9999 端口。
- 请求常见返回 502。
- Traefik 日志出现连接后端失败、connection refused 或等价错误。
- whoami 没收到这次业务请求，因为失败发生在到达应用之前。

### 第 5 步：形成假设并验证

证据链：

```text
same Host request
  -> Router exists
  -> Service exists
  -> backend URL/port is 9999
  -> Traefik connection error
  -> whoami has no request log
  -> hypothesis: wrong backend port
```

这比“看到 502 就重启 whoami”更可靠。

### 第 6 步：回滚并用同一探针复验

PowerShell：

```powershell
Copy-Item -Force compose.good.yaml compose.yaml
docker compose up -d --force-recreate whoami
curl.exe -i -H "Host: whoami.localhost" http://127.0.0.1:8088/
```

Bash：

```bash
cp compose.good.yaml compose.yaml
docker compose up -d --force-recreate whoami
curl -i -H 'Host: whoami.localhost' http://127.0.0.1:8088/
```

预期：同一请求恢复 200；API 中 Service 回到端口 80；新日志不再出现 9999 连接失败。

### 第 7 步：清理

```bash
docker compose down --remove-orphans
```

删除本地 `compose.good.yaml` 前确认 `compose.yaml` 已恢复。如果要把实验作为 GitHub 证据，应保留脱敏后的配置、命令输出和复盘，而不是保留错误运行环境。

## 可选 Kubernetes 故障模拟：BackendRef 不存在

在可丢弃且已经安装 Traefik Gateway API Provider 的集群中，把 HTTPRoute 的 backend 改成不存在的 Service：

```bash
kubectl patch httproute alerts -n aiops --type=json \
  -p='[{"op":"replace","path":"/spec/rules/0/backendRefs/0/name","value":"alerts-missing"}]'

kubectl get httproute alerts -n aiops -o yaml
kubectl describe httproute alerts -n aiops
```

预期重点不是死背外部状态码，而是看到 `ResolvedRefs=False` 及接近 `BackendNotFound` 的原因。然后核对 Traefik 日志、Service/EndpointSlice 和真实请求。

恢复：

```bash
kubectl patch httproute alerts -n aiops --type=json \
  -p='[{"op":"replace","path":"/spec/rules/0/backendRefs/0/name","value":"alerts"}]'
```

再次确认 `ResolvedRefs=True`、Backend 有 ready endpoint、真实请求恢复。不要在生产 namespace 直接做故障注入。

## 常见故障矩阵

| 现象 | 首要假设 | 关键证据 | 常见修复 |
|---|---|---|---|
| 连接拒绝 | EntryPoint/端口映射/LB target 错 | 监听端口、Service targetPort、Pod log | 修监听或映射，不先改 Router |
| 404 | 无 Router 匹配或对象未生成 | API Router、Host/Path/entryPoint、Provider log | 修 rule/class/selector/Provider |
| 401/403 | 认证、授权、IP allowlist | Middleware、ForwardAuth log、可信客户端 IP | 修策略或身份链，不绕过认证 |
| 429 | RateLimit/InFlightReq | Middleware、请求键、实例维度 | 调容量/限流策略，防止重试风暴 |
| 502 | 后端连接/协议/TLS失败 | Service server、Traefik error、直连测试 | 修 IP/port/scheme/CA/SNI |
| 503 | 无可用后端或全部不健康 | EndpointSlice、health check、API Service | 恢复 ready endpoint/健康检查 |
| 504 | 下游超出时间预算 | access log duration、trace、应用依赖 | 修慢点并重设端到端 deadline |
| 默认自签证书 | Router 未选到业务证书 | SNI、TLS Router、Secret/resolver | 修 Host/SNI/Secret/ACME |
| 改配置不生效 | Provider 没看到或被过滤 | event、throttle、RBAC、selector/class | 修发现范围/权限/语法 |
| 某些副本才失败 | 配置/Secret/网络/版本不一致 | 按 Pod 探测和 API 对比 | 恢复一致部署，逐副本复验 |
| 客户端 IP 全是 LB | forwarded header/Proxy Protocol | 原始包、Header、trustedIPs | 只信任明确 LB CIDR |
| CPU/内存突增 | 流量、TLS、日志、缓冲、下游慢 | RPS、并发、P99、profile、FD | 限制资源、修慢点、合理扩容 |

## 404 排障：先证明 Router 是否存在

```text
1. 客户端实际请求的 scheme/host/path/method 是什么？
2. 请求到达哪个 EntryPoint？
3. API 中有没有目标 Router？
4. Router rule、priority、TLS、entryPoints 是否匹配？
5. Provider 是否过滤了对象？
6. Kubernetes Route/Ingress condition/class 是否正确？
7. 修复后用同一请求复验。
```

404 还可能来自后端应用。区分方法：访问日志中的 Router/Service 和后端日志。如果 Traefik 已命中 Service 且应用收到请求，404 更可能是应用路由；如果没有 Router 名，先查 Traefik 匹配。

## 502 排障：连接到了哪里

```text
Router exists
  -> Service exists
  -> selected backend IP:port/scheme
  -> DNS resolution
  -> TCP connect
  -> TLS handshake if HTTPS
  -> HTTP response parsing
```

检查：

```bash
curl http://127.0.0.1:8080/api/http/services
docker compose logs traefik --since 10m
kubectl get service,endpointslice,pod -A -o wide
```

在 Traefik 相同网络命名空间测试后端最有价值。从管理员电脑能访问后端，不代表 Traefik Pod 能访问。

## 503 排障：有没有可用 Backend

重点：

- Kubernetes Service selector 是否选中 Pod。
- EndpointSlice 是否有 `ready: true` 地址。
- readiness probe 是否失败。
- Traefik active health check 是否把所有 server 标为 down。
- `allowEmptyServices` 是否改变了 404/503 表象。
- 正在滚动发布时 maxUnavailable、readiness 和 termination 是否造成空窗。

不要为了消除 503 直接关闭 readiness。那会把未就绪实例放进流量，可能从显式 503 变成隐蔽的数据错误。

## 504 排障：谁花了时间

对齐同一 Trace/Request ID：

```text
client total
  -> external LB duration
  -> Traefik request duration
  -> backend connect duration
  -> backend response duration
  -> application spans
     -> DB/cache/queue dependency
```

假设可能是连接建立慢、应用线程池满、SQL 慢、依赖超时、GC、网络丢包或下游重试。只有证据显示合法请求确实需要更长时间，才调整 timeout；否则只是扩大资源占用和用户等待。

## TLS/ACME 排障

```bash
dig +short alerts.example.com
curl -vk https://alerts.example.com/
openssl s_client -connect alerts.example.com:443 \
  -servername alerts.example.com -showcerts </dev/null
```

对齐：DNS -> LB -> EntryPoint -> SNI -> Router -> TLS store/Secret/resolver -> 证书链。常见错误包括 AAAA 指向旧入口、Router 没启用 TLS、Secret namespace/引用错误、默认自签证书、后端 TLS SNI 错和 ACME rate limit。

## Provider/配置未生效排障

### Docker

```bash
docker inspect <container>
docker network inspect traefik-lab-proxy
docker compose logs traefik --since 10m
```

核对 labels 最终值、`traefik.enable`、network、container port、socket endpoint 和 constraints。

### Kubernetes

```bash
kubectl auth can-i list httproutes.gateway.networking.k8s.io \
  --as=system:serviceaccount:traefik:traefik -A
kubectl auth can-i watch endpointslices.discovery.k8s.io \
  --as=system:serviceaccount:traefik:traefik -A
kubectl get gatewayclass,gateway,httproute -A
kubectl logs -n traefik deploy/traefik --since=10m
```

核对 RBAC、namespace、selector、IngressClass/GatewayClass、ReferenceGrant、CRD 版本和 throttle。不要通过给 ServiceAccount `cluster-admin` 来“验证权限问题”；用 `kubectl auth can-i` 精确找缺口。

## 一份证据优先的排障 Runbook

### 1. 定义窗口和影响面

- 首次失败时间、最后成功时间、持续/间歇。
- 哪些域名、路径、租户、区域、Traefik 副本受影响。
- 状态码、错误正文、请求 ID、客户端网络。

### 2. 保存只读快照

```bash
traefik version
curl http://127.0.0.1:8080/api/rawdata
kubectl get gatewayclass,gateway,httproute,ingress -A -o yaml
kubectl get service,endpointslice,pod -A -o wide
kubectl logs -n traefik deploy/traefik --since=30m
```

生产 API 不应临时公开；应在授权管理通道 port-forward 或 Pod 内采集，输出脱敏后存入事故目录。

### 3. 按状态码形成多个假设

不要只写一个根因。为每个假设列出“支持证据、反证、下一条无损检查”。

### 4. 选择最小修复

优先恢复错误路由、端口、Secret、Endpoint 或回滚最近变更。修复前评估影响面、回滚路径和在途连接。

### 5. 用同一探针复验

修复前后使用相同 scheme/Host/Path/Header/body，从相同网络位置发请求，并比较状态码、延迟、日志、指标和 trace。

### 6. 观察并沉淀

观察至少覆盖一个典型流量周期；把配置门禁、告警、合成探针或 Runbook 自动化加入整改，不以“页面绿了”结束。

## AIOps 实战：把 Traefik 变成入口证据源

### 1. 5xx 比例

```promql
sum by (service) (
  rate(traefik_service_requests_total{code=~"5.."}[5m])
)
/
clamp_min(
  sum by (service) (
    rate(traefik_service_requests_total[5m])
  ),
  0.001
)
```

用途：找哪个 Traefik Service 的 5xx 占比上升。应再加最小请求量条件，防止 1 个请求失败就 100% 告警。

### 2. Service P99

```promql
histogram_quantile(
  0.99,
  sum by (le, service) (
    rate(traefik_service_request_duration_seconds_bucket[5m])
  )
)
```

用途：比较入口观察到的 Service 尾延迟。Histogram bucket 与聚合维度决定精度；不要把不同 SLA、不同集群的 Service 不加区分地合并。

### 3. 配置最后成功时间

```promql
time() - traefik_config_last_reload_success
```

用途：检测很久没有成功加载配置。单独告警会对“长期无变更的稳定系统”误报，应结合 `traefik_config_reloads_total` 变化、发布事件和失败日志。

### 4. 证书剩余天数

```promql
(traefik_tls_certs_not_after - time()) / 86400
```

用途：建立 30/14/7 天多级预警。先核对该 metric 的每条 series 对应什么证书，避免 default certificate 或重复副本造成误判。

### 5. 开放连接异常

```promql
sum by (entrypoint, protocol) (traefik_open_connections)
```

用途：发现 WebSocket/SSE 增长、慢客户端、下游慢导致的连接堆积。与 RPS、P99、CPU、FD、网络带宽一起看。

### 6. 告警自动富化

当某个 `service` 5xx 告警触发，自动化流程只读采集：

```text
alert labels
  -> cluster / entrypoint / router / service
  -> recent deployment and Git commit
  -> Traefik API object and errors
  -> Gateway/HTTPRoute or Ingress status
  -> Service/EndpointSlice/Pod readiness
  -> matching access/error logs
  -> trace samples
  -> candidate hypotheses
  -> human-approved repair runbook
```

自动化输出应该区分“事实、推断、待验证”。例如：

```text
事实：alerts@kubernetes service 在 10:02 起 502 上升。
事实：同一时间发布把 targetPort 从 8080 改成 8081。
事实：Pod 仍监听 8080，Traefik 连接 8081 被拒绝。
推断：端口变更是高概率根因。
待验证：回滚 targetPort 后同一探针是否恢复。
```

### 7. 异常检测边界

模型可学习每个 Router/Service 的时段性 RPS、5xx、P99、响应体和连接基线，但要防止：

- 发布、营销、演练造成合法分布漂移。
- 路由改名导致时序断裂。
- 高基数标签把一个服务拆成大量稀疏序列。
- 只有入口指标却把数据库根因硬归给 Traefik。
- 自动处置没有停止条件、审批和回滚。

## 生产系统设计题：三可用区共享入口平台

### 题目

设计一个三可用区 Kubernetes 入口平台，供 30 个团队、500 个 Route 使用，要求 TLS、租户隔离、可观测、滚动升级和单区故障不中断。

### 回答框架

```text
DNS / global traffic
  -> regional external LB
  -> Traefik Gateway replicas across 3 zones
     -> GatewayClass owned by platform team
     -> Gateway/listeners owned by infrastructure team
     -> HTTPRoute owned by application namespaces
     -> allowedRoutes + ReferenceGrant
  -> Kubernetes Service / EndpointSlice / Pods

certificate controller
  -> namespace TLS Secrets

observability
  -> Prometheus + central logs + OTLP traces + synthetic probes
```

必须讲清：

1. **所有权**：平台管 GatewayClass，基础设施管 Gateway/listener，应用团队管 HTTPRoute；跨 namespace 由 ReferenceGrant 授权。
2. **HA**：至少三副本跨区、topology spread、PDB、外部 LB 健康检查、终止 draining；做 N-1 区容量验证。
3. **证书**：使用证书 controller 管 Secret，避免多个 OSS Pod 共享 ACME 文件。
4. **容量**：按 RPS、并发、长连接、TLS、带宽、Provider 对象数和遥测成本压测；设置 requests/limits 和 HPA 信号。
5. **安全**：Dashboard 管理网、最小 RBAC、NetworkPolicy、可信 forwarded headers、TLS policy、Secret 和插件供应链。
6. **可观测**：按 cluster/entrypoint/router/service 统一指标、JSON access log、OTLP trace、Route condition 和配置版本。
7. **变更**：GitOps/CI 校验、Gateway API conformance、金丝雀、停止阈值、旧实例保留、CRD 向后兼容与回滚。
8. **租户治理**：route 数、Host 所有权、禁止危险跨 namespace/任意插件、资源配额与高基数预算。
9. **灾难恢复**：保存 values/CRD/Gateway/Route/Secret 恢复流程；在备用集群实际演练 DNS/LB 切换。

### 继续追问

**为什么不是两个副本？**

两个副本可以容忍一个进程失败，但维护、分区、PDB 和突发容量余量更紧。三副本跨区仍不是自动满足业务 SLA，必须做 N-1 容量与外层 LB 验证。

**HPA 用 CPU 就够吗？**

不够。TLS/压缩可能 CPU 驱动，但长连接可能 FD/内存先满，下游慢可能并发和 P99先涨。应组合 CPU、连接、请求率/延迟和业务容量，并防止扩容造成 Provider/API 与 health-check 放大。

**如何证明租户 A 不能引用租户 B 的 Secret？**

看 `allowedRoutes`、namespace selector、ReferenceGrant、Traefik Provider 跨 namespace 设置和 RBAC；再做负向准入测试，保存被拒绝的 condition/策略证据。

## 生产事故题：升级后只有一部分请求 404

### 现象

Traefik `3.6 -> 3.7` 滚动升级后，约 30% 请求返回 404；其余 70% 正常。Pod 都是 Running，Dashboard 总览看起来正常。

### 证据优先回答

1. 固定失败请求的 Host、Path、协议、Header、时间和 Request ID，确认 404 是 Traefik 还是应用返回。
2. 从外部 LB 或 access log 找到处理失败请求的 Traefik Pod，按 Pod 分组 404 比例。
3. 比较新旧 Pod 的镜像 digest、args、values checksum、Provider 连接日志和 `/api/rawdata` Router 摘要。
4. 检查规则语法、priority、CRD 字段、Provider class/selector、Gateway status 与跨 namespace 引用是否只在新版本被拒绝。
5. 假设包括：新旧规则解析差异、某些 Pod 未加载配置、CRD 未先升级、Secret/RBAC/网络只在部分节点异常、外层 LB 仍送到旧 entrypoint。
6. 如果错误与新版本 Pod 强相关且达到停止阈值，暂停 rollout，保留日志/API 快照，回滚到已知版本。
7. 回滚后用同一请求集验证每个 Pod、总 404 比例和 P99；不能只看 Deployment Available。
8. 在一次性环境复现并修正 CRD/规则/升级门禁，再重新金丝雀。

### 影响面与回滚

- 回滚镜像/Chart前确认目标旧版本能读取当前 CRD。
- 不删除新 CRD 字段和事故证据。
- 评估长连接终止、证书、Gateway status 和外部 LB draining。
- 观察期覆盖所有路由类型，不只验证首页。

## 面试怎么讲

### 30 秒版本

Traefik 是云原生反向代理和负载均衡器。它通过 Docker、Kubernetes、File 等 Provider 发现路由配置，在 EntryPoint 接收流量，由 Router 按 Host/Path 匹配，按顺序执行 Middleware，再由 Service 选择 Backend。排障时我会分开检查控制面配置发现链和数据面请求链，用 API、Provider 日志、access log、Route condition、EndpointSlice 和真实请求区分 404、502、503、504。

### 3 分钟版本

我会先区分安装配置和路由配置：EntryPoint、Provider、日志、指标和证书解析器属于安装配置，通常需重启；Router、Middleware、Service 和 TLS options 来自 Provider，可动态更新。数据路径是 EntryPoint 到 Router、Middleware、Service、ServersTransport、Backend；控制路径是 Docker event 或 Kubernetes list/watch 到 Provider，再生成运行时配置。生产上多个 Traefik 副本各自观察同一声明源，没有副本间一致性协议，所以要做配置收敛对比、外层 LB、跨区副本、PDB 和 N-1 容量。OSS ACME 文件不应由多个 Pod 共享写，Kubernetes 可用 cert-manager 管 TLS Secret。安全上重点保护 Dashboard/API、Docker socket、Kubernetes RBAC、跨 namespace、可信转发头、后端 TLS 和插件供应链。升级时先读 minor migration，先升级 CRD，再金丝雀 Proxy/Chart，用真实 Host/Path/TLS/长连接回归，并保留回滚。

## 递进面试题与回答指导

### 1. Traefik 为什么适合动态环境？

回答主线：Provider 连接平台 API、监听变化、把平台声明转换成运行时 Router/Service，因此不用手工维护易漂移的后端 IP。

追问：Provider 不可用会怎样？

回答要点：区分已加载运行时与后续变更；采集 Provider 连接/配置更新日志、最后成功 reload 指标、每副本对象快照和真实流量。不能未经版本验证就保证所有错误都会永久保留旧配置。

### 2. EntryPoint、Router、Middleware、Service 分别是什么？

回答主线：EntryPoint 是端口，Router 是匹配决策，Middleware 是处理链，Service 是后端集合与选择。

追问：502 应该先查哪个？

回答要点：先证明 Router/Service 已命中，再查 Service server、网络、端口、scheme、ServersTransport/TLS 和后端日志；502 通常比 404 更接近后端连接层。

### 3. 安装配置和路由配置有什么区别？

回答主线：前者决定 Traefik 怎么启动并连接 Provider，通常需重启；后者描述 Router/Middleware/Service，由 Provider 动态更新。

追问：为什么改 EntryPoint 没热更新？

回答要点：它决定监听 socket 和进程启动环境，不属于动态路由对象。

### 4. Traefik 多副本如何一致？

回答主线：副本独立 watch 同一声明源并构建本地运行时，没有 Traefik 副本间 Raft；会有事件传播/节流/滚动版本造成的收敛窗口。

追问：如何发现某个副本配置落后？

回答要点：按 Pod 比较版本、配置源日志、最后成功 reload、Router/Service 清单摘要和同一 Host 探针；外层 LB access log 要能定位实例。

### 5. Traefik OSS 多副本如何做 Let’s Encrypt？

回答主线：不要让多个 Pod 共享写 `acme.json`；Kubernetes 用 cert-manager 等 controller 写 TLS Secret，或核对商业分布式能力。

追问：为什么共享 RWX 文件不够？

回答要点：文件共享不等于分布式锁、事务与 ACME 操作协调；还会有并发写、rate limit 和损坏风险。

### 6. 404、502、503、504 怎么区分？

回答主线：404 先查 Router；502 查到后端连接/协议；503 查可用后端/健康；504 查时间预算和慢依赖。状态码是线索，不是单独根因。

追问：404 一定来自 Traefik 吗？

回答要点：不一定；用 access log 的 Router/Service、响应 Header、后端日志和 trace 区分。

### 7. Gateway API 与 IngressRoute 怎么选？

回答主线：Gateway API 更标准、角色化、便于跨实现治理；IngressRoute 暴露 Traefik 特有能力。用 conformance、功能差距、可移植性和团队所有权选择。

追问：`Accepted=True` 为什么还能 503？

回答要点：Accepted 只表示 Route 被 listener 接受；还要看 ResolvedRefs、Programmed、Service、EndpointSlice、readiness 和真实数据面。

### 8. 如何保护真实客户端 IP？

回答主线：只信任明确 LB/CDN CIDR 的 forwarded headers 或 Proxy Protocol；不要全局 insecure trust。

追问：错信任有什么后果？

回答要点：攻击者伪造 XFF，绕过 IP allowlist/限流或污染审计。

### 9. 为什么 `docker.sock:ro` 仍然危险？

回答主线：`:ro` 是文件系统挂载属性，Unix socket API 调用不是普通文件写入；持有 Docker API 通道仍接近宿主控制面权限。

追问：怎么减小权限？

回答要点：socket proxy、只放行必要 API、网络 ACL/TLS、隔离 Traefik、constraints、`exposedByDefault=false`。

### 10. 如何做无损升级？

回答主线：固定版本、读 migration、先 CRD、金丝雀、真实协议回归、监控停止阈值、graceful shutdown/LB draining、可回滚旧版本。

追问：为什么 Helm rollback 不一定完整？

回答要点：CRD、外部 Gateway API CRD、Secret/证书和外部 LB/DNS 不一定跟随 release 原子回滚；要单独评估向后兼容和恢复步骤。

### 11. 如何做容量规划？

回答主线：RPS × latency 得并发起点，再加连接、TLS、带宽、长连接、middleware、Provider 对象和遥测成本，用 N-1 压测校准。

追问：CPU 不高为什么仍 504？

回答要点：后端慢、连接池、网络、FD、带宽或长连接可能先成为瓶颈，入口 CPU 低不代表下游健康。

### 12. Traefik 如何接入 AIOps？

回答主线：指标检测错误/延迟/连接/证书，access log定位 Router/Service/Backend，trace 对齐下游，配置与发布事件用于关联，Runbook 只读富化后再受控修复。

追问：为什么不能看到 502 就自动重启后端？

回答要点：502 可能是端口、协议、TLS、网络、配置或真实后端故障；盲重启会扩大影响并丢失证据。

## 学习路线

第一阶段：跑通路径

- EntryPoint、Router、Service。
- Docker Provider 与 labels。
- 正确 Host 200、错误 Host 404。
- 错端口 502 与恢复。

第二阶段：掌握策略

- Middleware 顺序。
- TLS termination/passthrough。
- ServersTransport 和后端 TLS。
- access log、metrics、trace。

第三阶段：进入 Kubernetes

- Ingress、IngressRoute、Gateway API 的边界。
- GatewayClass/Gateway/HTTPRoute/ReferenceGrant。
- Service/EndpointSlice/readiness。
- Helm、CRD、RBAC 和滚动升级。

第四阶段：生产设计

- 跨区 HA、容量、安全、证书、租户治理。
- 变更门禁、金丝雀、回滚、合成探针。
- AIOps 告警富化、异常检测和证据 Runbook。

## 学习检查清单

- [ ] 我能解释 Traefik Proxy 与 Hub/Enterprise 的边界。
- [ ] 我能解释 Proxy 版本、Helm Chart 版本、Gateway API 版本不是同一个编号。
- [ ] 我能区分安装配置和路由配置。
- [ ] 我能画出 EntryPoint -> Router -> Middleware -> Service -> Backend。
- [ ] 我能解释 Docker/Kubernetes/File Provider 如何发现配置。
- [ ] 我能读懂 Host、PathPrefix、priority 和 Provider namespace。
- [ ] 我能解释 Router 与 Service Middleware 的顺序。
- [ ] 我能解释 ServersTransport 与后端 TLS。
- [ ] 我能写一个 `exposedByDefault=false` 的 Docker 配置。
- [ ] 我能说明 Docker socket 为什么是高权限边界。
- [ ] 我能区分 Ingress、Ingress NGINX migration Provider、IngressRoute 与 Gateway API。
- [ ] 我能读懂 Accepted、ResolvedRefs 与 Programmed 的证据边界。
- [ ] 我能解释多副本配置收敛，而不是声称有副本间 Raft。
- [ ] 我能说明 OSS `acme.json` 为什么不适合多写者。
- [ ] 我能按证据排查 404、502、503、504。
- [ ] 我能用同一探针验证修复前后。
- [ ] 我能设计 Dashboard/API、RBAC、跨 namespace 和 forwarded header 安全边界。
- [ ] 我能按 RPS、延迟、连接、TLS、带宽和长连接估算容量。
- [ ] 我能说明先升级 CRD、再升级 Chart/Proxy 的原因。
- [ ] 我能设计跨可用区入口、停止阈值和回滚。
- [ ] 我能把 Traefik 指标、日志、trace、变更和 Route 状态接进 AIOps Runbook。

## GitHub 学习证据

建议在个人实验仓库保存：

```text
traefik-lab/
  README.md
  compose.yaml
  evidence/
    versions.txt
    compose-config.txt
    routers.json
    services.json
    success-200.txt
    no-router-404.txt
    wrong-port-502.txt
    recovery-200.txt
    traefik-log-sanitized.txt
    incident-review.md
  kubernetes/
    values.yaml
    gateway.yaml
    httproute.yaml
    route-status-sanitized.yaml
  monitoring/
    prometheus-rules.yaml
    dashboard.json
```

提交前：

- 删除域名、IP、Token、BasicAuth hash、Cookie、Authorization、证书私钥和 Docker/Kubernetes 凭据。
- 记录镜像 tag + digest、Chart/Gateway API 版本和执行日期。
- 清楚标注哪些实验真实执行、哪些只是设计。
- 保存失败、假设、证据、修复、回滚和同探针复验，而不只截一张绿色 Dashboard。

## 本文验证边界

本文已核对 Traefik Proxy `v3.7.10`、官方 Helm Chart `v41.2.0`、Gateway API `v1.6.1`、MIT/Apache-2.0 许可证边界、Provider、路由、ACME、可观测性、版本支持和迁移官方资料，并完成 Markdown 与配置的静态检查。

当前编写环境检测到 Docker Client `29.7.2`、Docker Compose `v5.3.1`、kubectl `v1.36.1`、Helm `v4.1.3`；Docker daemon 未运行，`kind` 未安装，也没有连接用户的 Kubernetes 集群。因此本文没有声称真实拉取镜像、启动 Traefik、完成 200/404/502 故障注入、签发证书、安装 Chart、压测、升级或生产 HA 演练。文中“预期”必须由读者在授权的一次性环境按同一探针实际验证，再作为 GitHub 运行证据。

阅读本文能建立 Traefik 的完整学习与面试主线，但不能代替 Linux/网络、Docker/Kubernetes、TLS、Gateway API、性能测试、生产变更经验和系统设计训练。
