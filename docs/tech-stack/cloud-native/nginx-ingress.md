# NGINX / Ingress

> 目标：能理解 NGINX 反向代理和 Kubernetes Ingress 分别解决什么问题，能读懂 `server`、`location`、`upstream`、`proxy_pass`、`proxy_set_header`、timeout、access log，能写一个最小 Ingress，能排查 404、502、503、504、TLS 证书和后端 endpoints 问题。

## 官方资料

- [NGINX official documentation](https://nginx.org/en/docs/)
- [NGINX Beginner's Guide](https://nginx.org/en/docs/beginners_guide.html)
- [NGINX Admin Guide: Reverse Proxy](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)
- [NGINX Admin Guide: Load Balancer](https://docs.nginx.com/nginx/admin-guide/load-balancer/http-load-balancer/)
- [NGINX ngx_http_core_module](https://nginx.org/en/docs/http/ngx_http_core_module.html)
- [NGINX ngx_http_proxy_module](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)
- [NGINX ngx_http_upstream_module](https://nginx.org/en/docs/http/ngx_http_upstream_module.html)
- [NGINX ngx_http_log_module](https://nginx.org/en/docs/http/ngx_http_log_module.html)
- [Kubernetes Ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/)
- [Kubernetes IngressClass](https://kubernetes.io/docs/concepts/services-networking/ingress/#ingress-class)
- [Kubernetes Service](https://kubernetes.io/docs/concepts/services-networking/service/)
- [Kubernetes DNS for Services and Pods](https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/)
- [ingress-nginx documentation](https://kubernetes.github.io/ingress-nginx/)
- [ingress-nginx annotations](https://kubernetes.github.io/ingress-nginx/user-guide/nginx-configuration/annotations/)
- [NGINX Ingress Controller docs](https://docs.nginx.com/nginx-ingress-controller/)

说明：本文是基于 NGINX 官方文档、Kubernetes 官方 Ingress 文档、ingress-nginx 文档和 NGINX Ingress Controller 文档整理的原创中文教程，不复制官方全文。Ingress 是 Kubernetes API，具体行为由 Ingress Controller 实现；不同控制器的注解和细节可能不同，生产请以你集群实际安装的 controller 文档为准。

## 场景开场

用户访问：

```text
https://aiops.example.com/api/alerts
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>https://aiops.example.com/api/alerts</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


结果报错：

```text
502 Bad Gateway
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>502 Bad Gateway</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


很多新手会直接问：“后端是不是挂了？”

但真正链路可能是：

```text
用户
  -> DNS
  -> 云负载均衡
  -> NGINX / Ingress Controller
  -> Kubernetes Service
  -> EndpointSlice
  -> Pod
  -> Container 端口
  -> 应用
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>用户</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; DNS</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; 云负载均衡</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>  -&gt; NGINX / Ingress Controller</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>  -&gt; Kubernetes Service</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 6 行 | <code>  -&gt; EndpointSlice</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 7 行 | <code>  -&gt; Pod</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 8 行 | <code>  -&gt; Container 端口</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 9 行 | <code>  -&gt; 应用</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


502 可能来自：

- NGINX 找不到或连不上 upstream。
- Service selector 选不到 Pod。
- Pod 没 ready，EndpointSlice 为空。
- targetPort 写错。
- 后端只监听 `127.0.0.1`。
- 后端主动关闭连接。
- NGINX 用 HTTP 访问了 HTTPS 后端，或反过来。
- NetworkPolicy 阻断。

Ingress/NGINX 的学习重点就是：请求进来后，host/path 如何匹配，转发到哪个 upstream，upstream 里有哪些后端，连接和响应分别在哪一层失败。

## 一句话人话版

NGINX 是常用的 Web 服务器和反向代理：它接收客户端请求，根据 `server_name` 和 `location` 选择规则，再用 `proxy_pass` 转发给后端。Kubernetes Ingress 是集群里的 HTTP/HTTPS 入口规则：它描述 host/path 到 Service 的映射，真正执行规则的是 Ingress Controller，常见实现之一就是基于 NGINX。

## 学习边界

入门阶段先掌握这条链：

```text
Client
  -> DNS
  -> Load Balancer
  -> NGINX / Ingress Controller
  -> host 匹配
  -> path 匹配
  -> upstream / Service
  -> EndpointSlice
  -> Pod IP:targetPort
  -> Application
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Client</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; DNS</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; Load Balancer</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>  -&gt; NGINX / Ingress Controller</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>  -&gt; host 匹配</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 6 行 | <code>  -&gt; path 匹配</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 7 行 | <code>  -&gt; upstream / Service</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 8 行 | <code>  -&gt; EndpointSlice</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 9 行 | <code>  -&gt; Pod IP:targetPort</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 10 行 | <code>  -&gt; Application</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


必须掌握：

- 正向代理和反向代理区别。
- NGINX 配置层级：main、events、http、server、location、upstream。
- `listen`、`server_name`、`location`、`proxy_pass`。
- `proxy_set_header` 传递 Host、客户端 IP、协议。
- access log 和 error log 怎么读。
- 常见 timeout：connect、send、read。
- upstream 和负载均衡基本概念。
- Kubernetes Ingress、IngressClass、Ingress Controller 的关系。
- Ingress `rules.host`、`paths.path`、`pathType`、backend Service。
- TLS secret。
- ingress-nginx annotations 的作用边界。
- 404、502、503、504 的排查。

暂时可以先不深挖：

- NGINX 事件模型和 worker 内核优化。
- HTTP/2、HTTP/3、QUIC 细节。
- NGINX Plus 专属高级能力。
- Lua/OpenResty。
- WAF 规则引擎。
- Gateway API 完整模型。
- 多租户 Ingress 安全治理。

## 官方知识地图

NGINX 官方资料按模块组织：

```text
NGINX docs
  -> Beginner's Guide
  -> Admin Guide
     -> Web Server
     -> Reverse Proxy
     -> Load Balancing
     -> SSL Termination
  -> Reference
     -> ngx_http_core_module
        -> server
        -> location
        -> listen
        -> server_name
        -> client_max_body_size
     -> ngx_http_proxy_module
        -> proxy_pass
        -> proxy_set_header
        -> proxy_connect_timeout
        -> proxy_read_timeout
        -> proxy_send_timeout
     -> ngx_http_upstream_module
        -> upstream
        -> server
        -> keepalive
     -> ngx_http_log_module
        -> log_format
        -> access_log
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>NGINX docs</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; Beginner's Guide</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; Admin Guide</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>     -&gt; Web Server</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>     -&gt; Reverse Proxy</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 6 行 | <code>     -&gt; Load Balancing</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 7 行 | <code>     -&gt; SSL Termination</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 8 行 | <code>  -&gt; Reference</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 9 行 | <code>     -&gt; ngx_http_core_module</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 10 行 | <code>        -&gt; server</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 11 行 | <code>        -&gt; location</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 12 行 | <code>        -&gt; listen</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 13 行 | <code>        -&gt; server_name</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 14 行 | <code>        -&gt; client_max_body_size</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 15 行 | <code>     -&gt; ngx_http_proxy_module</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 16 行 | <code>        -&gt; proxy_pass</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 17 行 | <code>        -&gt; proxy_set_header</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 18 行 | <code>        -&gt; proxy_connect_timeout</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 19 行 | <code>        -&gt; proxy_read_timeout</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 20 行 | <code>        -&gt; proxy_send_timeout</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 21 行 | <code>     -&gt; ngx_http_upstream_module</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 22 行 | <code>        -&gt; upstream</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 23 行 | <code>        -&gt; server</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 24 行 | <code>        -&gt; keepalive</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 25 行 | <code>     -&gt; ngx_http_log_module</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 26 行 | <code>        -&gt; log_format</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 27 行 | <code>        -&gt; access_log</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


Kubernetes Ingress 官方资料按这些概念组织：

```text
Kubernetes Service
  -> selector
  -> port / targetPort
  -> EndpointSlice

Kubernetes Ingress
  -> Ingress resource
  -> Ingress Controller
  -> IngressClass
  -> rules
  -> host
  -> path
  -> pathType
  -> backend service
  -> TLS

ingress-nginx
  -> Controller installation
  -> ConfigMap
  -> annotations
  -> path matching
  -> TLS
  -> troubleshooting
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Kubernetes Service</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; selector</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; port / targetPort</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>  -&gt; EndpointSlice</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 6 行 | <code>Kubernetes Ingress</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 7 行 | <code>  -&gt; Ingress resource</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 8 行 | <code>  -&gt; Ingress Controller</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 9 行 | <code>  -&gt; IngressClass</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 10 行 | <code>  -&gt; rules</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 11 行 | <code>  -&gt; host</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 12 行 | <code>  -&gt; path</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 13 行 | <code>  -&gt; pathType</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 14 行 | <code>  -&gt; backend service</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 15 行 | <code>  -&gt; TLS</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 16 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 17 行 | <code>ingress-nginx</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 18 行 | <code>  -&gt; Controller installation</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 19 行 | <code>  -&gt; ConfigMap</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 20 行 | <code>  -&gt; annotations</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 21 行 | <code>  -&gt; path matching</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 22 行 | <code>  -&gt; TLS</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 23 行 | <code>  -&gt; troubleshooting</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


新手要把两张图合起来：

```text
Ingress YAML 是规则声明
Ingress Controller watch Ingress/Service/EndpointSlice
Controller 生成或更新 NGINX 配置
NGINX worker 按 server/location/proxy_pass 转发真实流量
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Ingress YAML 是规则声明</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>Ingress Controller watch Ingress/Service/EndpointSlice</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>Controller 生成或更新 NGINX 配置</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>NGINX worker 按 server/location/proxy_pass 转发真实流量</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


## NGINX / Ingress 在 AIOps 链路中的位置

NGINX/Ingress 是用户流量进入应用的关键入口。

```text
用户请求
  -> DNS
  -> CDN / WAF
  -> Load Balancer
  -> NGINX / Ingress Controller
  -> Service
  -> Pod
  -> 应用
  -> 数据库 / 缓存 / 队列

观测
  -> NGINX access log / error log
  -> Ingress Controller metrics
  -> Kubernetes events
  -> Service / EndpointSlice 状态
  -> Pod logs
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>用户请求</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; DNS</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; CDN / WAF</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>  -&gt; Load Balancer</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>  -&gt; NGINX / Ingress Controller</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 6 行 | <code>  -&gt; Service</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 7 行 | <code>  -&gt; Pod</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 8 行 | <code>  -&gt; 应用</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 9 行 | <code>  -&gt; 数据库 / 缓存 / 队列</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 10 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 11 行 | <code>观测</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 12 行 | <code>  -&gt; NGINX access log / error log</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 13 行 | <code>  -&gt; Ingress Controller metrics</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 14 行 | <code>  -&gt; Kubernetes events</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 15 行 | <code>  -&gt; Service / EndpointSlice 状态</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 16 行 | <code>  -&gt; Pod logs</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


AIOps 会从这里拿到：

| 证据 | 来源 | 用途 |
|---|---|---|
| HTTP 状态码 | access log | 发现 4xx/5xx 异常 |
| upstream 地址 | access log | 判断请求转到哪个后端 |
| upstream 响应时间 | access log | 判断后端慢还是入口慢 |
| NGINX 错误 | error log | 定位连接失败、超时、响应异常 |
| Ingress 规则 | `kubectl get ingress -o yaml` | 判断 host/path 是否匹配 |
| Service endpoints | EndpointSlice | 判断后端是否存在 |
| Pod readiness | Pod status | 判断后端是否可接流量 |

一个成熟 runbook 不应只写：

```bash
kubectl rollout restart deployment/ingress-nginx-controller -n ingress-nginx
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>kubectl rollout restart deployment/ingress-nginx-controller -n ingress-nginx</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |


而应该先采集：

```bash
kubectl get ingress,svc,endpointslice -n aiops -o wide
kubectl describe ingress aiops-api -n aiops
kubectl logs -n ingress-nginx deploy/ingress-nginx-controller --tail=200
kubectl get pod -n aiops -l app=aiops-api -o wide
kubectl describe svc aiops-api -n aiops
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>kubectl get ingress,svc,endpointslice -n aiops -o wide</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |
| 第 2 行 | <code>kubectl describe ingress aiops-api -n aiops</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |
| 第 3 行 | <code>kubectl logs -n ingress-nginx deploy/ingress-nginx-controller --tail=200</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 4 行 | <code>kubectl get pod -n aiops -l app=aiops-api -o wide</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |
| 第 5 行 | <code>kubectl describe svc aiops-api -n aiops</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |


## 正向代理和反向代理

### 正向代理

正向代理代表客户端访问外部。

```text
Client -> Forward Proxy -> Internet
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Client -&gt; Forward Proxy -&gt; Internet</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


例子：

- 公司代理上网。
- 开发机配置 HTTP proxy。

服务端看到的是代理在访问。

### 反向代理

反向代理代表服务端接收客户端请求，再转发给后端。

```text
Client -> Reverse Proxy -> Backend Servers
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Client -&gt; Reverse Proxy -&gt; Backend Servers</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


NGINX 常作为反向代理。

它能做：

- 统一入口。
- TLS 终止。
- 负载均衡。
- 路由转发。
- 静态文件。
- 压缩。
- 限流。
- 日志。
- 超时控制。

Ingress Controller 本质上就是 Kubernetes 里的反向代理控制平面和数据平面组合。

## NGINX 配置层级

NGINX 配置有层级。

```nginx
main context

events {
    # 连接事件配置
}

http {
    # HTTP 全局配置

    upstream backend {
        server 127.0.0.1:8000;
    }

    server {
        listen 80;
        server_name aiops.example.com;

        location / {
            proxy_pass http://backend;
        }
    }
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>main context</code> | NGINX 指令行，用来控制转发、头部、超时、日志或访问策略。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔 NGINX 配置块。 |
| 第 3 行 | <code>events {</code> | 配置块开始，花括号内的指令只在这个上下文中生效。 |
| 第 4 行 | <code>    # 连接事件配置</code> | NGINX 注释行，用来说明配置目的。 |
| 第 5 行 | <code>}</code> | 配置块结束，表示当前上下文配置到这里结束。 |
| 第 6 行 | <em>空行</em> | 空行，用来分隔 NGINX 配置块。 |
| 第 7 行 | <code>http {</code> | 配置块开始，花括号内的指令只在这个上下文中生效。 |
| 第 8 行 | <code>    # HTTP 全局配置</code> | NGINX 注释行，用来说明配置目的。 |
| 第 9 行 | <em>空行</em> | 空行，用来分隔 NGINX 配置块。 |
| 第 10 行 | <code>    upstream backend {</code> | 配置块开始，花括号内的指令只在这个上下文中生效。 |
| 第 11 行 | <code>        server 127.0.0.1:8000;</code> | 定义一个虚拟主机入口，通常对应一个域名或端口。 |
| 第 12 行 | <code>    }</code> | 配置块结束，表示当前上下文配置到这里结束。 |
| 第 13 行 | <em>空行</em> | 空行，用来分隔 NGINX 配置块。 |
| 第 14 行 | <code>    server {</code> | 配置块开始，花括号内的指令只在这个上下文中生效。 |
| 第 15 行 | <code>        listen 80;</code> | 声明 NGINX 监听的端口。 |
| 第 16 行 | <code>        server_name aiops.example.com;</code> | 定义一个虚拟主机入口，通常对应一个域名或端口。 |
| 第 17 行 | <em>空行</em> | 空行，用来分隔 NGINX 配置块。 |
| 第 18 行 | <code>        location / {</code> | 配置块开始，花括号内的指令只在这个上下文中生效。 |
| 第 19 行 | <code>            proxy_pass http://backend;</code> | 把请求转发到后端服务，是反向代理的核心配置。 |
| 第 20 行 | <code>        }</code> | 配置块结束，表示当前上下文配置到这里结束。 |
| 第 21 行 | <code>    }</code> | 配置块结束，表示当前上下文配置到这里结束。 |
| 第 22 行 | <code>}</code> | 配置块结束，表示当前上下文配置到这里结束。 |


常见 context：

| context | 管什么 |
|---|---|
| main | 全局配置，如 worker_processes |
| events | 事件模型和连接 |
| http | HTTP 全局配置 |
| upstream | 后端服务器组 |
| server | 虚拟主机 |
| location | URI 路径匹配规则 |

排查配置时，要知道指令能放在哪个 context。放错位置，`nginx -t` 会失败。

## server、listen、server_name

`server` 表示一个虚拟主机。

```nginx
server {
    listen 80;
    server_name aiops.example.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
    }
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>server {</code> | 配置块开始，花括号内的指令只在这个上下文中生效。 |
| 第 2 行 | <code>    listen 80;</code> | 声明 NGINX 监听的端口。 |
| 第 3 行 | <code>    server_name aiops.example.com;</code> | 定义一个虚拟主机入口，通常对应一个域名或端口。 |
| 第 4 行 | <em>空行</em> | 空行，用来分隔 NGINX 配置块。 |
| 第 5 行 | <code>    location / {</code> | 配置块开始，花括号内的指令只在这个上下文中生效。 |
| 第 6 行 | <code>        proxy_pass http://127.0.0.1:8000;</code> | 把请求转发到后端服务，是反向代理的核心配置。 |
| 第 7 行 | <code>    }</code> | 配置块结束，表示当前上下文配置到这里结束。 |
| 第 8 行 | <code>}</code> | 配置块结束，表示当前上下文配置到这里结束。 |


字段解释：

| 指令 | 含义 |
|---|---|
| `listen 80` | 监听 80 端口 |
| `server_name aiops.example.com` | 匹配 Host 头 |
| `location /` | 匹配请求路径 |
| `proxy_pass` | 转发到后端 |

请求：

```http
GET /api/alerts HTTP/1.1
Host: aiops.example.com
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>GET /api/alerts HTTP/1.1</code> | HTTP 报文示例行，用来展示请求方法、路径、头部或返回内容。 |
| 第 2 行 | <code>Host: aiops.example.com</code> | HTTP 报文示例行，用来展示请求方法、路径、头部或返回内容。 |


NGINX 会先根据端口和 Host 选择 server，再根据 URI 选择 location。

常见问题：

- DNS 指向了 NGINX，但 Host 没匹配任何 server。
- 默认 server 接住请求，返回默认 404。
- `server_name` 写了内网域名，用户访问公网域名。

测试 Host：

```bash
curl -H "Host: aiops.example.com" http://<nginx-ip>/
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -H "Host: aiops.example.com" http://&lt;nginx-ip&gt;/</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |


## location 匹配

`location` 决定不同 path 怎么处理。

常见：

```nginx
location / {
    proxy_pass http://web;
}

location /api/ {
    proxy_pass http://api;
}

location = /health {
    return 200 "ok\n";
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>location / {</code> | 配置块开始，花括号内的指令只在这个上下文中生效。 |
| 第 2 行 | <code>    proxy_pass http://web;</code> | 把请求转发到后端服务，是反向代理的核心配置。 |
| 第 3 行 | <code>}</code> | 配置块结束，表示当前上下文配置到这里结束。 |
| 第 4 行 | <em>空行</em> | 空行，用来分隔 NGINX 配置块。 |
| 第 5 行 | <code>location /api/ {</code> | 配置块开始，花括号内的指令只在这个上下文中生效。 |
| 第 6 行 | <code>    proxy_pass http://api;</code> | 把请求转发到后端服务，是反向代理的核心配置。 |
| 第 7 行 | <code>}</code> | 配置块结束，表示当前上下文配置到这里结束。 |
| 第 8 行 | <em>空行</em> | 空行，用来分隔 NGINX 配置块。 |
| 第 9 行 | <code>location = /health {</code> | 配置块开始，花括号内的指令只在这个上下文中生效。 |
| 第 10 行 | <code>    return 200 "ok\n";</code> | NGINX 指令行，用来控制转发、头部、超时、日志或访问策略。 |
| 第 11 行 | <code>}</code> | 配置块结束，表示当前上下文配置到这里结束。 |


基本理解：

| 写法 | 含义 |
|---|---|
| `location /` | 通用前缀 |
| `location /api/` | 前缀匹配 |
| `location = /health` | 精确匹配 |
| `location ~ pattern` | 区分大小写正则 |
| `location ~* pattern` | 不区分大小写正则 |

新手常见错误：

- `/api` 和 `/api/` 混淆。
- rewrite 后路径变了。
- 以为 location 顺序就是唯一规则，忽略精确、前缀、正则优先级。

排查 404 时，第一步是确认请求实际命中了哪个 server 和 location。

## upstream 和负载均衡

`upstream` 定义后端组：

```nginx
upstream aiops_api {
    server 10.0.1.10:8000;
    server 10.0.1.11:8000;
}

server {
    listen 80;
    server_name aiops.example.com;

    location / {
        proxy_pass http://aiops_api;
    }
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>upstream aiops_api {</code> | 配置块开始，花括号内的指令只在这个上下文中生效。 |
| 第 2 行 | <code>    server 10.0.1.10:8000;</code> | 定义一个虚拟主机入口，通常对应一个域名或端口。 |
| 第 3 行 | <code>    server 10.0.1.11:8000;</code> | 定义一个虚拟主机入口，通常对应一个域名或端口。 |
| 第 4 行 | <code>}</code> | 配置块结束，表示当前上下文配置到这里结束。 |
| 第 5 行 | <em>空行</em> | 空行，用来分隔 NGINX 配置块。 |
| 第 6 行 | <code>server {</code> | 配置块开始，花括号内的指令只在这个上下文中生效。 |
| 第 7 行 | <code>    listen 80;</code> | 声明 NGINX 监听的端口。 |
| 第 8 行 | <code>    server_name aiops.example.com;</code> | 定义一个虚拟主机入口，通常对应一个域名或端口。 |
| 第 9 行 | <em>空行</em> | 空行，用来分隔 NGINX 配置块。 |
| 第 10 行 | <code>    location / {</code> | 配置块开始，花括号内的指令只在这个上下文中生效。 |
| 第 11 行 | <code>        proxy_pass http://aiops_api;</code> | 把请求转发到后端服务，是反向代理的核心配置。 |
| 第 12 行 | <code>    }</code> | 配置块结束，表示当前上下文配置到这里结束。 |
| 第 13 行 | <code>}</code> | 配置块结束，表示当前上下文配置到这里结束。 |


默认负载均衡一般是轮询。

常见策略：

```nginx
upstream aiops_api {
    least_conn;
    server 10.0.1.10:8000;
    server 10.0.1.11:8000;
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>upstream aiops_api {</code> | 配置块开始，花括号内的指令只在这个上下文中生效。 |
| 第 2 行 | <code>    least_conn;</code> | NGINX 指令行，用来控制转发、头部、超时、日志或访问策略。 |
| 第 3 行 | <code>    server 10.0.1.10:8000;</code> | 定义一个虚拟主机入口，通常对应一个域名或端口。 |
| 第 4 行 | <code>    server 10.0.1.11:8000;</code> | 定义一个虚拟主机入口，通常对应一个域名或端口。 |
| 第 5 行 | <code>}</code> | 配置块结束，表示当前上下文配置到这里结束。 |


常见 upstream 问题：

- 后端 IP 错。
- 后端端口错。
- 后端服务没启动。
- 后端响应慢。
- upstream keepalive 配置不合理。
- 后端协议不匹配。

Kubernetes Ingress Controller 会根据 Service/EndpointSlice 自动维护类似 upstream 的后端列表。

## proxy_pass

`proxy_pass` 指定转发目标。

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8000/;
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>location /api/ {</code> | 配置块开始，花括号内的指令只在这个上下文中生效。 |
| 第 2 行 | <code>    proxy_pass http://127.0.0.1:8000/;</code> | 把请求转发到后端服务，是反向代理的核心配置。 |
| 第 3 行 | <code>}</code> | 配置块结束，表示当前上下文配置到这里结束。 |


它不仅决定后端地址，也可能影响转发给后端的 URI。`proxy_pass` 后面是否带 URI 部分，会影响路径替换行为。

入门建议：

- 不确定时，用 access log 记录 `$request_uri`、`$uri`、`$upstream_addr`。
- 对路径重写保持克制。
- 明确后端应用期望收到的 path。

常见错误：

```text
用户请求 /api/alerts
后端期望 /alerts
NGINX 实际转发 /api/alerts
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>用户请求 /api/alerts</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>后端期望 /alerts</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>NGINX 实际转发 /api/alerts</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


或者相反。

## proxy_set_header

反向代理转发时，要把原始请求信息传给后端。

常见配置：

```nginx
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Request-ID $request_id;
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>proxy_set_header Host $host;</code> | NGINX 指令行，用来控制转发、头部、超时、日志或访问策略。 |
| 第 2 行 | <code>proxy_set_header X-Real-IP $remote_addr;</code> | NGINX 指令行，用来控制转发、头部、超时、日志或访问策略。 |
| 第 3 行 | <code>proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;</code> | NGINX 指令行，用来控制转发、头部、超时、日志或访问策略。 |
| 第 4 行 | <code>proxy_set_header X-Forwarded-Proto $scheme;</code> | NGINX 指令行，用来控制转发、头部、超时、日志或访问策略。 |
| 第 5 行 | <code>proxy_set_header X-Request-ID $request_id;</code> | NGINX 指令行，用来控制转发、头部、超时、日志或访问策略。 |


含义：

| Header | 含义 |
|---|---|
| `Host` | 原始 host |
| `X-Real-IP` | 直接客户端 IP |
| `X-Forwarded-For` | 代理链上的客户端 IP 列表 |
| `X-Forwarded-Proto` | 原始协议 http/https |
| `X-Request-ID` | 请求 ID，便于日志关联 |

应用如果需要生成绝对 URL、判断 HTTPS、记录真实客户端 IP，就依赖这些头。

注意：如果前面还有 CDN/LB，要信任哪些 forwarded header 需要谨慎配置，避免伪造客户端 IP。

## timeout

反向代理常见 timeout：

```nginx
proxy_connect_timeout 3s;
proxy_send_timeout 30s;
proxy_read_timeout 30s;
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>proxy_connect_timeout 3s;</code> | NGINX 指令行，用来控制转发、头部、超时、日志或访问策略。 |
| 第 2 行 | <code>proxy_send_timeout 30s;</code> | NGINX 指令行，用来控制转发、头部、超时、日志或访问策略。 |
| 第 3 行 | <code>proxy_read_timeout 30s;</code> | NGINX 指令行，用来控制转发、头部、超时、日志或访问策略。 |


含义：

| 指令 | 含义 | 常见对应故障 |
|---|---|---|
| `proxy_connect_timeout` | 连接 upstream 的超时 | 后端端口连不上 |
| `proxy_send_timeout` | 向 upstream 发送请求超时 | 上传/请求体发送问题 |
| `proxy_read_timeout` | 等 upstream 响应超时 | 后端处理慢，常见 504 |

504 多数和 read timeout 有关，但不要立刻调大超时。先问：

- 后端为什么慢？
- 数据库是否慢？
- worker 是否耗尽？
- 是否有锁等待？
- 是否应该异步处理？

timeout 是保护，不是根因修复。

## 请求体大小和上传

NGINX 默认会限制请求体大小。

```nginx
client_max_body_size 10m;
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>client_max_body_size 10m;</code> | NGINX 指令行，用来控制转发、头部、超时、日志或访问策略。 |


如果上传文件太大，可能返回 413。

Ingress-nginx 常用 annotation：

```yaml
nginx.ingress.kubernetes.io/proxy-body-size: "10m"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>nginx.ingress.kubernetes.io/proxy-body-size: "10m"</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |


具体 annotation 以 controller 文档为准。

## access log 和 error log

access log 记录每个请求。

常见自定义 log_format：

```nginx
log_format main '$remote_addr - $remote_user [$time_local] '
                '"$request" $status $body_bytes_sent '
                '"$http_referer" "$http_user_agent" '
                'request_time=$request_time '
                'upstream_addr=$upstream_addr '
                'upstream_status=$upstream_status '
                'upstream_response_time=$upstream_response_time '
                'request_id=$request_id';

access_log /var/log/nginx/access.log main;
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>log_format main '$remote_addr - $remote_user [$time_local] '</code> | NGINX 指令行，用来控制转发、头部、超时、日志或访问策略。 |
| 第 2 行 | <code>                '"$request" $status $body_bytes_sent '</code> | NGINX 指令行，用来控制转发、头部、超时、日志或访问策略。 |
| 第 3 行 | <code>                '"$http_referer" "$http_user_agent" '</code> | NGINX 指令行，用来控制转发、头部、超时、日志或访问策略。 |
| 第 4 行 | <code>                'request_time=$request_time '</code> | NGINX 指令行，用来控制转发、头部、超时、日志或访问策略。 |
| 第 5 行 | <code>                'upstream_addr=$upstream_addr '</code> | NGINX 指令行，用来控制转发、头部、超时、日志或访问策略。 |
| 第 6 行 | <code>                'upstream_status=$upstream_status '</code> | NGINX 指令行，用来控制转发、头部、超时、日志或访问策略。 |
| 第 7 行 | <code>                'upstream_response_time=$upstream_response_time '</code> | NGINX 指令行，用来控制转发、头部、超时、日志或访问策略。 |
| 第 8 行 | <code>                'request_id=$request_id';</code> | NGINX 指令行，用来控制转发、头部、超时、日志或访问策略。 |
| 第 9 行 | <em>空行</em> | 空行，用来分隔 NGINX 配置块。 |
| 第 10 行 | <code>access_log /var/log/nginx/access.log main;</code> | NGINX 指令行，用来控制转发、头部、超时、日志或访问策略。 |


重要字段：

| 字段 | 含义 |
|---|---|
| `$status` | NGINX 返回给客户端的状态码 |
| `$request_time` | NGINX 处理整个请求耗时 |
| `$upstream_addr` | 后端地址 |
| `$upstream_status` | upstream 返回状态 |
| `$upstream_response_time` | upstream 响应耗时 |
| `$request_id` | 请求 ID |

error log 记录错误和诊断信息：

```nginx
error_log /var/log/nginx/error.log warn;
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>error_log /var/log/nginx/error.log warn;</code> | NGINX 指令行，用来控制转发、头部、超时、日志或访问策略。 |


常见 error log 片段：

```text
connect() failed (111: Connection refused) while connecting to upstream
upstream timed out (110: Connection timed out) while reading response header from upstream
no live upstreams while connecting to upstream
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>connect() failed (111: Connection refused) while connecting to upstream</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>upstream timed out (110: Connection timed out) while reading response header from upstream</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>no live upstreams while connecting to upstream</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


这些比“用户说打不开”有营养得多。

## NGINX 配置检查和 reload

检查配置：

```bash
nginx -t
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>nginx -t</code> | 执行 `nginx` 相关命令，后面的参数决定它具体操作什么对象。 |


reload：

```bash
nginx -s reload
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>nginx -s reload</code> | 执行 `nginx` 相关命令，后面的参数决定它具体操作什么对象。 |


systemd 管理时：

```bash
systemctl reload nginx
systemctl status nginx --no-pager
journalctl -u nginx -n 100 --no-pager
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>systemctl reload nginx</code> | 管理 systemd 服务，用来启动、停止、重启或查看 Linux 服务状态。 |
| 第 2 行 | <code>systemctl status nginx --no-pager</code> | 管理 systemd 服务，用来启动、停止、重启或查看 Linux 服务状态。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 3 行 | <code>journalctl -u nginx -n 100 --no-pager</code> | 读取 systemd journal 日志，用来排查服务启动失败和运行错误。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


修改 NGINX 配置前后，应：

```bash
nginx -t
systemctl reload nginx
curl -v -H "Host: aiops.example.com" http://127.0.0.1/
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>nginx -t</code> | 执行 `nginx` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>systemctl reload nginx</code> | 管理 systemd 服务，用来启动、停止、重启或查看 Linux 服务状态。 |
| 第 3 行 | <code>curl -v -H "Host: aiops.example.com" http://127.0.0.1/</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |


## Kubernetes Ingress 是什么

Ingress 是 Kubernetes 的 API 对象，用于管理进入集群的 HTTP/HTTPS 路由。

它描述：

```text
host + path -> Service
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>host + path -&gt; Service</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


最小示例：

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: aiops-api
  namespace: aiops
spec:
  ingressClassName: nginx
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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>apiVersion: networking.k8s.io/v1</code> | 设置 `apiVersion` 字段的值为 `networking.k8s.io/v1`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 2 行 | <code>kind: Ingress</code> | 设置 `kind` 字段的值为 `Ingress`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 3 行 | <code>metadata:</code> | 定义 `metadata` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>  name: aiops-api</code> | 设置 `name` 字段的值为 `aiops-api`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 5 行 | <code>  namespace: aiops</code> | 设置 `namespace` 字段的值为 `aiops`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 6 行 | <code>spec:</code> | 定义 `spec` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 7 行 | <code>  ingressClassName: nginx</code> | 设置 `ingressClassName` 字段的值为 `nginx`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 8 行 | <code>  rules:</code> | 定义 `rules` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 9 行 | <code>    - host: aiops.example.com</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 10 行 | <code>      http:</code> | 定义 `http` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 11 行 | <code>        paths:</code> | 定义 `paths` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 12 行 | <code>          - path: /</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 13 行 | <code>            pathType: Prefix</code> | 设置 `pathType` 字段的值为 `Prefix`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 14 行 | <code>            backend:</code> | 定义 `backend` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 15 行 | <code>              service:</code> | 定义 `service` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 16 行 | <code>                name: aiops-api</code> | 设置 `name` 字段的值为 `aiops-api`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 17 行 | <code>                port:</code> | 定义 `port` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 18 行 | <code>                  number: 80</code> | 设置 `number` 字段的值为 `80`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


注意：Ingress 本身只是规则声明。没有 Ingress Controller，规则不会真的处理流量。

## Ingress Controller 是什么

Ingress Controller 是实际执行 Ingress 规则的控制器。

它会：

- watch Ingress。
- watch Service。
- watch EndpointSlice。
- watch Secret。
- 根据规则生成代理配置。
- reload 或动态更新代理。
- 接收真实流量。

常见实现：

- ingress-nginx。
- NGINX Ingress Controller。
- Traefik。
- HAProxy Ingress。
- 云厂商 ALB/GCLB 控制器。

本文重点讲 NGINX 类控制器，但一定记住：annotations 和行为是 controller-specific，不是所有 Ingress Controller 都一样。

## IngressClass

IngressClass 用来声明某个 Ingress 应该由哪个 controller 处理。

查看：

```bash
kubectl get ingressclass
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>kubectl get ingressclass</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |


Ingress 中指定：

```yaml
spec:
  ingressClassName: nginx
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>spec:</code> | 定义 `spec` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  ingressClassName: nginx</code> | 设置 `ingressClassName` 字段的值为 `nginx`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


如果 class 不匹配：

- Ingress 可能没人处理。
- status address 不更新。
- 配置不会生效。

排查：

```bash
kubectl describe ingress aiops-api -n aiops
kubectl get ingressclass
kubectl logs -n ingress-nginx deploy/ingress-nginx-controller --tail=100
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>kubectl describe ingress aiops-api -n aiops</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |
| 第 2 行 | <code>kubectl get ingressclass</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |
| 第 3 行 | <code>kubectl logs -n ingress-nginx deploy/ingress-nginx-controller --tail=100</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


## Ingress rules、host、path、pathType

Ingress 规则：

```yaml
rules:
  - host: aiops.example.com
    http:
      paths:
        - path: /api
          pathType: Prefix
          backend:
            service:
              name: aiops-api
              port:
                number: 80
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>rules:</code> | 定义 `rules` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  - host: aiops.example.com</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 3 行 | <code>    http:</code> | 定义 `http` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>      paths:</code> | 定义 `paths` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 5 行 | <code>        - path: /api</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 6 行 | <code>          pathType: Prefix</code> | 设置 `pathType` 字段的值为 `Prefix`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 7 行 | <code>          backend:</code> | 定义 `backend` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 8 行 | <code>            service:</code> | 定义 `service` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 9 行 | <code>              name: aiops-api</code> | 设置 `name` 字段的值为 `aiops-api`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 10 行 | <code>              port:</code> | 定义 `port` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 11 行 | <code>                number: 80</code> | 设置 `number` 字段的值为 `80`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


字段：

| 字段 | 含义 |
|---|---|
| `host` | 匹配 Host 头 |
| `path` | 匹配 URL path |
| `pathType` | path 匹配类型 |
| `backend.service.name` | 转发到哪个 Service |
| `backend.service.port` | Service 端口 |

pathType：

| pathType | 含义 |
|---|---|
| `Exact` | 精确匹配 path |
| `Prefix` | 按路径前缀匹配 |
| `ImplementationSpecific` | 由 controller 自己决定 |

新手建议优先用 `Exact` 或 `Prefix`，不要一开始依赖 controller-specific 行为。

## Ingress TLS

Ingress TLS 配置：

```yaml
spec:
  tls:
    - hosts:
        - aiops.example.com
      secretName: aiops-example-tls
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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>spec:</code> | 定义 `spec` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  tls:</code> | 定义 `tls` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    - hosts:</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 4 行 | <code>        - aiops.example.com</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 5 行 | <code>      secretName: aiops-example-tls</code> | 设置 `secretName` 字段的值为 `aiops-example-tls`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 6 行 | <code>  rules:</code> | 定义 `rules` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 7 行 | <code>    - host: aiops.example.com</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 8 行 | <code>      http:</code> | 定义 `http` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 9 行 | <code>        paths:</code> | 定义 `paths` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 10 行 | <code>          - path: /</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 11 行 | <code>            pathType: Prefix</code> | 设置 `pathType` 字段的值为 `Prefix`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 12 行 | <code>            backend:</code> | 定义 `backend` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 13 行 | <code>              service:</code> | 定义 `service` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 14 行 | <code>                name: aiops-api</code> | 设置 `name` 字段的值为 `aiops-api`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 15 行 | <code>                port:</code> | 定义 `port` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 16 行 | <code>                  number: 80</code> | 设置 `number` 字段的值为 `80`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


TLS Secret 通常是：

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: aiops-example-tls
  namespace: aiops
type: kubernetes.io/tls
data:
  tls.crt: <base64>
  tls.key: <base64>
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>apiVersion: v1</code> | 设置 `apiVersion` 字段的值为 `v1`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 2 行 | <code>kind: Secret</code> | 设置 `kind` 字段的值为 `Secret`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 3 行 | <code>metadata:</code> | 定义 `metadata` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>  name: aiops-example-tls</code> | 设置 `name` 字段的值为 `aiops-example-tls`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 5 行 | <code>  namespace: aiops</code> | 设置 `namespace` 字段的值为 `aiops`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 6 行 | <code>type: kubernetes.io/tls</code> | 设置 `type` 字段的值为 `kubernetes.io/tls`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 7 行 | <code>data:</code> | 定义 `data` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 8 行 | <code>  tls.crt: &lt;base64&gt;</code> | 设置 `tls.crt` 字段的值为 `<base64>`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 9 行 | <code>  tls.key: &lt;base64&gt;</code> | 设置 `tls.key` 字段的值为 `<base64>`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


命令创建：

```bash
kubectl create secret tls aiops-example-tls \
  -n aiops \
  --cert=./tls.crt \
  --key=./tls.key
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>kubectl create secret tls aiops-example-tls \</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |
| 第 2 行 | <code>  -n aiops \</code> | 执行 `-n` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>  --cert=./tls.crt \</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 4 行 | <code>  --key=./tls.key</code> | 注释行，提前说明下面命令的目的或注意事项。 |


排查证书：

```bash
openssl s_client -connect aiops.example.com:443 -servername aiops.example.com </dev/null 2>/dev/null \
  | openssl x509 -noout -subject -issuer -dates
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>openssl s_client -connect aiops.example.com:443 -servername aiops.example.com &lt;/dev/null 2&gt;/dev/null \</code> | 检查 TLS/证书相关信息，用来排查 HTTPS 连接问题。 |
| 第 2 行 | <code>  &#124; openssl x509 -noout -subject -issuer -dates</code> | 执行 `` 相关命令，后面的参数决定它具体操作什么对象。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |


常见 TLS 问题：

- Secret 不在 Ingress 同 namespace。
- Secret 名写错。
- 证书域名不匹配。
- 证书过期。
- 中间证书链不完整。
- 没带 SNI 测试导致看到默认证书。

## ingress-nginx annotations

ingress-nginx 用 annotations 扩展 Ingress 行为。

示例：

```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/proxy-read-timeout: "60"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "60"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>metadata:</code> | 定义 `metadata` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  annotations:</code> | 定义 `annotations` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    nginx.ingress.kubernetes.io/proxy-read-timeout: "60"</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 4 行 | <code>    nginx.ingress.kubernetes.io/proxy-send-timeout: "60"</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 5 行 | <code>    nginx.ingress.kubernetes.io/proxy-body-size: "10m"</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |


常见用途：

- 超时。
- 请求体大小。
- rewrite。
- TLS redirect。
- auth。
- rate limit。
- canary。

注意：

- annotation 不是 Kubernetes Ingress 标准的一部分。
- 不同 controller annotation 不兼容。
- annotation 写错可能被忽略，或在 controller 日志中报 warning。

排查 annotation：

```bash
kubectl describe ingress aiops-api -n aiops
kubectl logs -n ingress-nginx deploy/ingress-nginx-controller --tail=200
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>kubectl describe ingress aiops-api -n aiops</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |
| 第 2 行 | <code>kubectl logs -n ingress-nginx deploy/ingress-nginx-controller --tail=200</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


## 从 Ingress 到 Pod 的完整链路

请求：

```text
https://aiops.example.com/api/alerts
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>https://aiops.example.com/api/alerts</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


链路：

```text
1. DNS 解析 aiops.example.com 到 LB 地址
2. LB 把流量转发给 ingress-nginx-controller Service
3. Ingress Controller 的 NGINX 收到请求
4. NGINX 根据 SNI/Host 匹配 aiops.example.com
5. NGINX 根据 path /api/alerts 匹配 Ingress rule
6. rule 指向 Service aiops-api:80
7. Service selector 找到 ready Pod
8. EndpointSlice 提供 Pod IP:targetPort
9. NGINX 连接 Pod IP:targetPort
10. 应用返回响应
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>1. DNS 解析 aiops.example.com 到 LB 地址</code> | 编号步骤，表示学习或操作时应该按顺序执行。 |
| 第 2 行 | <code>2. LB 把流量转发给 ingress-nginx-controller Service</code> | 编号步骤，表示学习或操作时应该按顺序执行。 |
| 第 3 行 | <code>3. Ingress Controller 的 NGINX 收到请求</code> | 编号步骤，表示学习或操作时应该按顺序执行。 |
| 第 4 行 | <code>4. NGINX 根据 SNI/Host 匹配 aiops.example.com</code> | 编号步骤，表示学习或操作时应该按顺序执行。 |
| 第 5 行 | <code>5. NGINX 根据 path /api/alerts 匹配 Ingress rule</code> | 编号步骤，表示学习或操作时应该按顺序执行。 |
| 第 6 行 | <code>6. rule 指向 Service aiops-api:80</code> | 编号步骤，表示学习或操作时应该按顺序执行。 |
| 第 7 行 | <code>7. Service selector 找到 ready Pod</code> | 编号步骤，表示学习或操作时应该按顺序执行。 |
| 第 8 行 | <code>8. EndpointSlice 提供 Pod IP:targetPort</code> | 编号步骤，表示学习或操作时应该按顺序执行。 |
| 第 9 行 | <code>9. NGINX 连接 Pod IP:targetPort</code> | 编号步骤，表示学习或操作时应该按顺序执行。 |
| 第 10 行 | <code>10. 应用返回响应</code> | 编号步骤，表示学习或操作时应该按顺序执行。 |


排障时按这个顺序查，不要跳。

## 常用命令字典

### NGINX 检查配置

```bash
nginx -t
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>nginx -t</code> | 执行 `nginx` 相关命令，后面的参数决定它具体操作什么对象。 |


看配置语法是否正确。

### NGINX reload

```bash
nginx -s reload
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>nginx -s reload</code> | 执行 `nginx` 相关命令，后面的参数决定它具体操作什么对象。 |


systemd：

```bash
systemctl reload nginx
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>systemctl reload nginx</code> | 管理 systemd 服务，用来启动、停止、重启或查看 Linux 服务状态。 |


### 查看 NGINX 状态

```bash
systemctl status nginx --no-pager
journalctl -u nginx -n 100 --no-pager
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>systemctl status nginx --no-pager</code> | 管理 systemd 服务，用来启动、停止、重启或查看 Linux 服务状态。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 2 行 | <code>journalctl -u nginx -n 100 --no-pager</code> | 读取 systemd journal 日志，用来排查服务启动失败和运行错误。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


### 本地测 Host

```bash
curl -v -H "Host: aiops.example.com" http://127.0.0.1/
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -v -H "Host: aiops.example.com" http://127.0.0.1/</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |


绕过 DNS 直接测某个入口 IP：

```bash
curl --resolve "aiops.example.com:443:203.0.113.10" https://aiops.example.com/
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl --resolve "aiops.example.com:443:203.0.113.10" https://aiops.example.com/</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


### 查看 Ingress

```bash
kubectl get ingress -n aiops
kubectl describe ingress aiops-api -n aiops
kubectl get ingress aiops-api -n aiops -o yaml
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>kubectl get ingress -n aiops</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |
| 第 2 行 | <code>kubectl describe ingress aiops-api -n aiops</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |
| 第 3 行 | <code>kubectl get ingress aiops-api -n aiops -o yaml</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |


关注：

- `ingressClassName`。
- `rules.host`。
- `paths`。
- backend service。
- TLS secret。
- events。
- address/status。

### 查看 IngressClass

```bash
kubectl get ingressclass
kubectl describe ingressclass nginx
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>kubectl get ingressclass</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |
| 第 2 行 | <code>kubectl describe ingressclass nginx</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |


### 查看 Controller

以 ingress-nginx 为例：

```bash
kubectl get pods -n ingress-nginx -o wide
kubectl logs -n ingress-nginx deploy/ingress-nginx-controller --tail=200
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>kubectl get pods -n ingress-nginx -o wide</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |
| 第 2 行 | <code>kubectl logs -n ingress-nginx deploy/ingress-nginx-controller --tail=200</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


### 查看 Service

```bash
kubectl get svc aiops-api -n aiops -o wide
kubectl describe svc aiops-api -n aiops
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>kubectl get svc aiops-api -n aiops -o wide</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |
| 第 2 行 | <code>kubectl describe svc aiops-api -n aiops</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |


### 查看 EndpointSlice

```bash
kubectl get endpointslice -n aiops -l kubernetes.io/service-name=aiops-api
kubectl describe endpointslice -n aiops -l kubernetes.io/service-name=aiops-api
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>kubectl get endpointslice -n aiops -l kubernetes.io/service-name=aiops-api</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |
| 第 2 行 | <code>kubectl describe endpointslice -n aiops -l kubernetes.io/service-name=aiops-api</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |


### 查看 Pod

```bash
kubectl get pod -n aiops -l app=aiops-api -o wide
kubectl describe pod -n aiops -l app=aiops-api
kubectl logs -n aiops -l app=aiops-api --tail=100
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>kubectl get pod -n aiops -l app=aiops-api -o wide</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |
| 第 2 行 | <code>kubectl describe pod -n aiops -l app=aiops-api</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |
| 第 3 行 | <code>kubectl logs -n aiops -l app=aiops-api --tail=100</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


### 集群内测试 Service

```bash
kubectl run curl-test -n aiops --rm -it --image=curlimages/curl:8.10.1 --restart=Never -- \
  curl -v http://aiops-api/
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>kubectl run curl-test -n aiops --rm -it --image=curlimages/curl:8.10.1 --restart=Never -- \</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 2 行 | <code>  curl -v http://aiops-api/</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |


### 测 TLS 证书

```bash
openssl s_client -connect aiops.example.com:443 -servername aiops.example.com
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>openssl s_client -connect aiops.example.com:443 -servername aiops.example.com</code> | 检查 TLS/证书相关信息，用来排查 HTTPS 连接问题。 |


### 看 HTTP 时间分解

```bash
curl -sS -o /dev/null \
  -w "dns=%{time_namelookup} connect=%{time_connect} tls=%{time_appconnect} first_byte=%{time_starttransfer} total=%{time_total} code=%{http_code}\n" \
  https://aiops.example.com/
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -sS -o /dev/null \</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |
| 第 2 行 | <code>  -w "dns=%{time_namelookup} connect=%{time_connect} tls=%{time_appconnect} first_byte=%{time_starttransfer} total=%{time_total} code=%{http_code}\n" \</code> | 执行 `-w` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>  https://aiops.example.com/</code> | 执行 `https://aiops.example.com/` 相关命令，后面的参数决定它具体操作什么对象。 |


## 配置字典

### NGINX 核心指令

| 指令 | 作用 | 常见错误 |
|---|---|---|
| `listen` | 监听端口/IP | 端口没开放、冲突 |
| `server_name` | 匹配 Host | 域名不匹配导致默认 server |
| `location` | 匹配 URI path | `/api` 和 `/api/` 混淆 |
| `proxy_pass` | 转发后端 | 路径替换、协议、端口错 |
| `proxy_set_header` | 传递请求头 | 后端拿不到真实 Host/IP/Proto |
| `proxy_connect_timeout` | 连接后端超时 | 连接失败或后端不可达 |
| `proxy_read_timeout` | 等后端响应超时 | 504 |
| `client_max_body_size` | 请求体大小限制 | 上传 413 |
| `access_log` | 请求日志 | 字段不足无法排障 |
| `error_log` | 错误日志 | log level 太低或没采集 |

### Ingress 字段

| 字段 | 作用 | 常见错误 |
|---|---|---|
| `spec.ingressClassName` | 指定 controller | class 不存在或不匹配 |
| `spec.rules[].host` | Host 匹配 | DNS/Host 不一致 |
| `paths[].path` | path 匹配 | path 写错 |
| `paths[].pathType` | 匹配语义 | 滥用 ImplementationSpecific |
| `backend.service.name` | 目标 Service | Service 名错 |
| `backend.service.port.number/name` | 目标 Service 端口 | port 和 targetPort 混淆 |
| `spec.tls[].secretName` | TLS 证书 Secret | Secret 不存在或 namespace 错 |
| annotations | controller 扩展 | 用错 controller annotation |

### 日志字段

| 字段 | 含义 | 排障用途 |
|---|---|---|
| `$status` | 返回给客户端的状态码 | 看用户看到什么 |
| `$request_time` | 总耗时 | 判断入口整体耗时 |
| `$upstream_status` | 后端状态码 | 判断后端返回什么 |
| `$upstream_addr` | 后端地址 | 看转发到哪个 Pod/IP |
| `$upstream_response_time` | 后端响应耗时 | 判断后端是否慢 |
| `$host` | Host | 看 host 是否正确 |
| `$request_uri` | 原始 URI | 看 path/query |
| `$request_id` | 请求 ID | 串联日志 |

## AIOps 入门实验

目标：部署一个 Web 服务，通过 Ingress 暴露，并制造 404/502/503 类问题理解链路。

### 1. 准备 Deployment 和 Service

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: aiops-web
  namespace: aiops
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
---
apiVersion: v1
kind: Service
metadata:
  name: aiops-web
  namespace: aiops
spec:
  selector:
    app: aiops-web
  ports:
    - name: http
      port: 80
      targetPort: http
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>apiVersion: apps/v1</code> | 设置 `apiVersion` 字段的值为 `apps/v1`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 2 行 | <code>kind: Deployment</code> | 设置 `kind` 字段的值为 `Deployment`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 3 行 | <code>metadata:</code> | 定义 `metadata` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>  name: aiops-web</code> | 设置 `name` 字段的值为 `aiops-web`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 5 行 | <code>  namespace: aiops</code> | 设置 `namespace` 字段的值为 `aiops`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 6 行 | <code>  labels:</code> | 定义 `labels` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 7 行 | <code>    app: aiops-web</code> | 设置 `app` 字段的值为 `aiops-web`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 8 行 | <code>spec:</code> | 定义 `spec` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 9 行 | <code>  replicas: 2</code> | 设置 `replicas` 字段的值为 `2`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 10 行 | <code>  selector:</code> | 定义 `selector` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 11 行 | <code>    matchLabels:</code> | 定义 `matchLabels` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 12 行 | <code>      app: aiops-web</code> | 设置 `app` 字段的值为 `aiops-web`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 13 行 | <code>  template:</code> | 定义 `template` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 14 行 | <code>    metadata:</code> | 定义 `metadata` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 15 行 | <code>      labels:</code> | 定义 `labels` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 16 行 | <code>        app: aiops-web</code> | 设置 `app` 字段的值为 `aiops-web`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 17 行 | <code>    spec:</code> | 定义 `spec` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 18 行 | <code>      containers:</code> | 定义 `containers` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 19 行 | <code>        - name: web</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 20 行 | <code>          image: nginx:1.25</code> | 设置 `image` 字段的值为 `nginx:1.25`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 21 行 | <code>          ports:</code> | 定义 `ports` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 22 行 | <code>            - name: http</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 23 行 | <code>              containerPort: 80</code> | 设置 `containerPort` 字段的值为 `80`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 24 行 | <code>          readinessProbe:</code> | 定义 `readinessProbe` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 25 行 | <code>            httpGet:</code> | 定义 `httpGet` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 26 行 | <code>              path: /</code> | 设置 `path` 字段的值为 `/`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 27 行 | <code>              port: http</code> | 设置 `port` 字段的值为 `http`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 28 行 | <code>            initialDelaySeconds: 3</code> | 设置 `initialDelaySeconds` 字段的值为 `3`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 29 行 | <code>            periodSeconds: 5</code> | 设置 `periodSeconds` 字段的值为 `5`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 30 行 | <code>---</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 31 行 | <code>apiVersion: v1</code> | 设置 `apiVersion` 字段的值为 `v1`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 32 行 | <code>kind: Service</code> | 设置 `kind` 字段的值为 `Service`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 33 行 | <code>metadata:</code> | 定义 `metadata` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 34 行 | <code>  name: aiops-web</code> | 设置 `name` 字段的值为 `aiops-web`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 35 行 | <code>  namespace: aiops</code> | 设置 `namespace` 字段的值为 `aiops`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 36 行 | <code>spec:</code> | 定义 `spec` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 37 行 | <code>  selector:</code> | 定义 `selector` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 38 行 | <code>    app: aiops-web</code> | 设置 `app` 字段的值为 `aiops-web`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 39 行 | <code>  ports:</code> | 定义 `ports` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 40 行 | <code>    - name: http</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 41 行 | <code>      port: 80</code> | 设置 `port` 字段的值为 `80`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 42 行 | <code>      targetPort: http</code> | 设置 `targetPort` 字段的值为 `http`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


应用：

```bash
kubectl create namespace aiops
kubectl apply -f aiops-web.yaml
kubectl get deploy,pod,svc,endpointslice -n aiops -o wide
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>kubectl create namespace aiops</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |
| 第 2 行 | <code>kubectl apply -f aiops-web.yaml</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |
| 第 3 行 | <code>kubectl get deploy,pod,svc,endpointslice -n aiops -o wide</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |


### 2. 创建 Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: aiops-web
  namespace: aiops
spec:
  ingressClassName: nginx
  rules:
    - host: aiops.local
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: aiops-web
                port:
                  number: 80
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>apiVersion: networking.k8s.io/v1</code> | 设置 `apiVersion` 字段的值为 `networking.k8s.io/v1`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 2 行 | <code>kind: Ingress</code> | 设置 `kind` 字段的值为 `Ingress`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 3 行 | <code>metadata:</code> | 定义 `metadata` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>  name: aiops-web</code> | 设置 `name` 字段的值为 `aiops-web`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 5 行 | <code>  namespace: aiops</code> | 设置 `namespace` 字段的值为 `aiops`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 6 行 | <code>spec:</code> | 定义 `spec` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 7 行 | <code>  ingressClassName: nginx</code> | 设置 `ingressClassName` 字段的值为 `nginx`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 8 行 | <code>  rules:</code> | 定义 `rules` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 9 行 | <code>    - host: aiops.local</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 10 行 | <code>      http:</code> | 定义 `http` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 11 行 | <code>        paths:</code> | 定义 `paths` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 12 行 | <code>          - path: /</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 13 行 | <code>            pathType: Prefix</code> | 设置 `pathType` 字段的值为 `Prefix`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 14 行 | <code>            backend:</code> | 定义 `backend` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 15 行 | <code>              service:</code> | 定义 `service` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 16 行 | <code>                name: aiops-web</code> | 设置 `name` 字段的值为 `aiops-web`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 17 行 | <code>                port:</code> | 定义 `port` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 18 行 | <code>                  number: 80</code> | 设置 `number` 字段的值为 `80`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


应用：

```bash
kubectl apply -f aiops-ingress.yaml
kubectl describe ingress aiops-web -n aiops
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>kubectl apply -f aiops-ingress.yaml</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |
| 第 2 行 | <code>kubectl describe ingress aiops-web -n aiops</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |


测试入口 IP：

```bash
kubectl get ingress aiops-web -n aiops
curl -v -H "Host: aiops.local" http://<ingress-address>/
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>kubectl get ingress aiops-web -n aiops</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |
| 第 2 行 | <code>curl -v -H "Host: aiops.local" http://&lt;ingress-address&gt;/</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |


如果本地实验没有真实 DNS，可以用 `--resolve`：

```bash
curl --resolve "aiops.local:80:<ingress-address>" http://aiops.local/
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl --resolve "aiops.local:80:&lt;ingress-address&gt;" http://aiops.local/</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


### 3. 制造 404

把 Host 改错：

```bash
curl -v -H "Host: wrong.local" http://<ingress-address>/
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -v -H "Host: wrong.local" http://&lt;ingress-address&gt;/</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |


观察：

- 是否命中默认 backend。
- Ingress rules 是否有对应 host。
- controller 日志是否有请求。

### 4. 制造 503 或无 endpoints

把 Service selector 改错：

```yaml
selector:
  app: wrong-label
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>selector:</code> | 定义 `selector` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  app: wrong-label</code> | 设置 `app` 字段的值为 `wrong-label`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


检查：

```bash
kubectl get svc aiops-web -n aiops -o yaml
kubectl get pods -n aiops --show-labels
kubectl get endpointslice -n aiops -l kubernetes.io/service-name=aiops-web
curl -v -H "Host: aiops.local" http://<ingress-address>/
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>kubectl get svc aiops-web -n aiops -o yaml</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |
| 第 2 行 | <code>kubectl get pods -n aiops --show-labels</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 3 行 | <code>kubectl get endpointslice -n aiops -l kubernetes.io/service-name=aiops-web</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |
| 第 4 行 | <code>curl -v -H "Host: aiops.local" http://&lt;ingress-address&gt;/</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |


观察 EndpointSlice 是否为空。

### 5. 制造 502

把 Service `targetPort` 改成不存在端口：

```yaml
targetPort: 9999
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>targetPort: 9999</code> | 设置 `targetPort` 字段的值为 `9999`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


检查：

```bash
kubectl describe svc aiops-web -n aiops
kubectl get endpointslice -n aiops -l kubernetes.io/service-name=aiops-web
kubectl logs -n ingress-nginx deploy/ingress-nginx-controller --tail=100
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>kubectl describe svc aiops-web -n aiops</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |
| 第 2 行 | <code>kubectl get endpointslice -n aiops -l kubernetes.io/service-name=aiops-web</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |
| 第 3 行 | <code>kubectl logs -n ingress-nginx deploy/ingress-nginx-controller --tail=100</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


观察 controller 日志中的 upstream 连接错误。

### 6. 形成学习证据

记录：

```text
Ingress host:
Ingress path:
Service name/port:
EndpointSlice addresses:
Pod labels:
404 根因:
502/503 根因:
我如何用日志证明:
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Ingress host:</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>Ingress path:</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>Service name/port:</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>EndpointSlice addresses:</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>Pod labels:</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 6 行 | <code>404 根因:</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 7 行 | <code>502/503 根因:</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 8 行 | <code>我如何用日志证明:</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


## 典型故障排查表

| 现象 | 先看什么 | 常见原因 | 处理思路 |
|---|---|---|---|
| 404 | Ingress host/path | Host 不匹配、path 不匹配、默认 backend | `describe ingress`，curl 指定 Host |
| 413 | body size | 上传超过限制 | 配 `client_max_body_size` 或 controller annotation |
| 502 | controller error log、Service/EndpointSlice | upstream 连接失败、端口错、协议错 | 查 targetPort、Pod 监听、日志 |
| 503 | EndpointSlice、Pod readiness | 无可用后端、Pod 不 ready | 查 selector、readiness、Pod 状态 |
| 504 | upstream response time、read timeout | 后端慢、依赖慢、timeout 太短 | 查后端日志和耗时 |
| TLS 证书错误 | `openssl s_client`、Secret | 证书过期、域名不匹配、Secret 错 | 查 SNI、证书链、secretName |
| Ingress 不生效 | IngressClass、controller logs | class 不匹配、controller 没装 | 查 `ingressClassName` 和 controller |
| Service 无后端 | EndpointSlice | selector/labels 不匹配 | 对比 Service selector 和 Pod labels |
| 客户端 IP 不对 | headers/log | forwarded header 未配置或信任错误 | 配 `X-Forwarded-For` 和 real IP 策略 |
| 访问慢 | access log timing | 后端慢、网络慢、入口排队 | 看 `$request_time` 和 `$upstream_response_time` |

## 排障流程：404

```bash
curl -v -H "Host: aiops.example.com" http://<ingress-address>/api/alerts
kubectl get ingress -n aiops
kubectl describe ingress aiops-api -n aiops
kubectl get ingress aiops-api -n aiops -o yaml
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -v -H "Host: aiops.example.com" http://&lt;ingress-address&gt;/api/alerts</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |
| 第 2 行 | <code>kubectl get ingress -n aiops</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |
| 第 3 行 | <code>kubectl describe ingress aiops-api -n aiops</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |
| 第 4 行 | <code>kubectl get ingress aiops-api -n aiops -o yaml</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |


判断：

1. Host 是否和 `rules.host` 一致？
2. path 是否匹配？
3. pathType 是否符合预期？
4. IngressClass 是否正确？
5. 请求是否到了正确 ingress controller？
6. 是否被默认 backend 接住？

## 排障流程：502

```bash
kubectl describe ingress aiops-api -n aiops
kubectl describe svc aiops-api -n aiops
kubectl get endpointslice -n aiops -l kubernetes.io/service-name=aiops-api
kubectl get pod -n aiops -l app=aiops-api -o wide
kubectl logs -n ingress-nginx deploy/ingress-nginx-controller --tail=200
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>kubectl describe ingress aiops-api -n aiops</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |
| 第 2 行 | <code>kubectl describe svc aiops-api -n aiops</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |
| 第 3 行 | <code>kubectl get endpointslice -n aiops -l kubernetes.io/service-name=aiops-api</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |
| 第 4 行 | <code>kubectl get pod -n aiops -l app=aiops-api -o wide</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |
| 第 5 行 | <code>kubectl logs -n ingress-nginx deploy/ingress-nginx-controller --tail=200</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


继续从 controller Pod 内测后端：

```bash
kubectl exec -n ingress-nginx deploy/ingress-nginx-controller -- curl -v http://aiops-api.aiops.svc.cluster.local/
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>kubectl exec -n ingress-nginx deploy/ingress-nginx-controller -- curl -v http://aiops-api.aiops.svc.cluster.local/</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


判断：

- Service 是否存在？
- EndpointSlice 是否有地址？
- targetPort 是否指向容器真实监听端口？
- 后端是否 ready？
- 后端协议是 HTTP 还是 HTTPS？
- NetworkPolicy 是否阻断？

## 排障流程：504

```bash
curl -sS -o /dev/null \
  -w "connect=%{time_connect} first_byte=%{time_starttransfer} total=%{time_total} code=%{http_code}\n" \
  https://aiops.example.com/api/slow
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -sS -o /dev/null \</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |
| 第 2 行 | <code>  -w "connect=%{time_connect} first_byte=%{time_starttransfer} total=%{time_total} code=%{http_code}\n" \</code> | 执行 `-w` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>  https://aiops.example.com/api/slow</code> | 执行 `https://aiops.example.com/api/slow` 相关命令，后面的参数决定它具体操作什么对象。 |


看入口日志：

```bash
kubectl logs -n ingress-nginx deploy/ingress-nginx-controller --tail=200
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>kubectl logs -n ingress-nginx deploy/ingress-nginx-controller --tail=200</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


看后端：

```bash
kubectl logs -n aiops -l app=aiops-api --tail=200
kubectl top pods -n aiops
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>kubectl logs -n aiops -l app=aiops-api --tail=200</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 2 行 | <code>kubectl top pods -n aiops</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |


判断：

- upstream 是否收到了请求？
- upstream_response_time 是否接近 timeout？
- 数据库或下游 API 是否慢？
- worker 是否耗尽？
- 是否应该异步化长任务？

## 排障流程：TLS

```bash
kubectl get ingress aiops-api -n aiops -o yaml
kubectl get secret aiops-example-tls -n aiops -o yaml
openssl s_client -connect aiops.example.com:443 -servername aiops.example.com </dev/null
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>kubectl get ingress aiops-api -n aiops -o yaml</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |
| 第 2 行 | <code>kubectl get secret aiops-example-tls -n aiops -o yaml</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |
| 第 3 行 | <code>openssl s_client -connect aiops.example.com:443 -servername aiops.example.com &lt;/dev/null</code> | 检查 TLS/证书相关信息，用来排查 HTTPS 连接问题。 |


判断：

- Ingress TLS hosts 是否包含域名？
- secretName 是否正确？
- Secret 是否在同 namespace？
- 证书 SAN 是否包含域名？
- 证书是否过期？
- 是否有中间证书链问题？

## AIOps 自动化诊断脚本

```bash
#!/usr/bin/env bash
set -euo pipefail

ns="${1:-aiops}"
ing="${2:-aiops-api}"
svc="${3:-aiops-api}"

echo "== ingress =="
kubectl get ingress "$ing" -n "$ns" -o wide || true
kubectl describe ingress "$ing" -n "$ns" || true

echo
echo "== service =="
kubectl get svc "$svc" -n "$ns" -o yaml || true

echo
echo "== endpointslices =="
kubectl get endpointslice -n "$ns" -l "kubernetes.io/service-name=$svc" -o wide || true

echo
echo "== pods =="
kubectl get pods -n "$ns" --show-labels -o wide || true

echo
echo "== ingress controller logs =="
kubectl logs -n ingress-nginx deploy/ingress-nginx-controller --tail=200 || true

echo
echo "== namespace events =="
kubectl get events -n "$ns" --sort-by=.lastTimestamp || true
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>#!/usr/bin/env bash</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 2 行 | <code>set -euo pipefail</code> | 设置 shell 或工具变量，具体含义取决于当前终端环境。 |
| 第 3 行 | <em>空行</em> | 空行，用来把命令分成更容易阅读的几段。 |
| 第 4 行 | <code>ns="${1:-aiops}"</code> | 执行 `ns="${1:-aiops}"` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 5 行 | <code>ing="${2:-aiops-api}"</code> | 执行 `ing="${2:-aiops-api}"` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 6 行 | <code>svc="${3:-aiops-api}"</code> | 执行 `svc="${3:-aiops-api}"` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 7 行 | <em>空行</em> | 空行，用来把命令分成更容易阅读的几段。 |
| 第 8 行 | <code>echo "== ingress =="</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 9 行 | <code>kubectl get ingress "$ing" -n "$ns" -o wide &#124;&#124; true</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |
| 第 10 行 | <code>kubectl describe ingress "$ing" -n "$ns" &#124;&#124; true</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |
| 第 11 行 | <em>空行</em> | 空行，用来把命令分成更容易阅读的几段。 |
| 第 12 行 | <code>echo</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 13 行 | <code>echo "== service =="</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 14 行 | <code>kubectl get svc "$svc" -n "$ns" -o yaml &#124;&#124; true</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |
| 第 15 行 | <em>空行</em> | 空行，用来把命令分成更容易阅读的几段。 |
| 第 16 行 | <code>echo</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 17 行 | <code>echo "== endpointslices =="</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 18 行 | <code>kubectl get endpointslice -n "$ns" -l "kubernetes.io/service-name=$svc" -o wide &#124;&#124; true</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |
| 第 19 行 | <em>空行</em> | 空行，用来把命令分成更容易阅读的几段。 |
| 第 20 行 | <code>echo</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 21 行 | <code>echo "== pods =="</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 22 行 | <code>kubectl get pods -n "$ns" --show-labels -o wide &#124;&#124; true</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |
| 第 23 行 | <em>空行</em> | 空行，用来把命令分成更容易阅读的几段。 |
| 第 24 行 | <code>echo</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 25 行 | <code>echo "== ingress controller logs =="</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 26 行 | <code>kubectl logs -n ingress-nginx deploy/ingress-nginx-controller --tail=200 &#124;&#124; true</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |
| 第 27 行 | <em>空行</em> | 空行，用来把命令分成更容易阅读的几段。 |
| 第 28 行 | <code>echo</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 29 行 | <code>echo "== namespace events =="</code> | 输出一段文本，常用于写入测试内容或验证变量。 |
| 第 30 行 | <code>kubectl get events -n "$ns" --sort-by=.lastTimestamp &#124;&#124; true</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |


生产化前要补：

- 自动读取 Ingress backend Service。
- 自动解析 host/path。
- 自动 curl 入口。
- 保存 access/error log。
- 和请求 ID 关联。
- 输出 JSON 诊断报告。

## 面试怎么讲

NGINX 常作为反向代理，它根据监听端口和 `server_name` 选择虚拟主机，再根据 `location` 匹配路径，用 `proxy_pass` 转发到 upstream，并通过 access log/error log 暴露状态码、upstream 地址和耗时。Kubernetes Ingress 是 HTTP/HTTPS 路由规则，声明 host/path 到 Service 的映射，但真正处理流量的是 Ingress Controller。排障时我会按链路查：DNS/LB 到 Ingress Controller，IngressClass 和 rules 是否匹配，Service selector 是否选到 Pod，EndpointSlice 是否有 ready 后端，targetPort 是否正确，Pod 是否监听，最后看 controller 日志和后端日志区分 404、502、503、504。

## 小白可能会问

### Ingress 是不是负载均衡器？

Ingress 是 Kubernetes API 规则，不是负载均衡器本身。Ingress Controller 才是真正处理流量的组件，外面通常还会有云 LoadBalancer。

### 创建 Ingress 后为什么没生效？

可能没有安装 Ingress Controller，或者 `ingressClassName` 不匹配，或者 controller 没权限/没 watch 到这个 Ingress。

### 502 和 503 有什么区别？

常见情况下，502 更像网关连后端失败或后端响应异常；503 更像当前没有可用后端或服务不可用。但具体要看 controller 实现和日志。

### 504 是不是直接调大 timeout 就行？

不是。504 表示网关等后端超时。调大 timeout 只能缓解表象，根因可能是后端慢、数据库慢、依赖慢、队列堵、worker 耗尽。

### Service 明明存在，Ingress 为什么还是不通？

Service 存在不代表有后端。要看 EndpointSlice 是否有 ready Pod 地址，以及 targetPort 是否对。

### 为什么本地 curl Service 通，外部 Ingress 不通？

可能是 host/path 规则、IngressClass、TLS、controller、LB、安全组、NetworkPolicy 或 controller 到 Service 的链路问题。要按链路逐段验证。

## 学习路线

第一阶段：NGINX 反向代理

- `server`、`listen`、`server_name`。
- `location`。
- `upstream`。
- `proxy_pass`。
- `proxy_set_header`。
- access log/error log。

第二阶段：Kubernetes Ingress

- Ingress。
- IngressClass。
- Ingress Controller。
- rules host/path/pathType。
- backend Service。
- TLS Secret。

第三阶段：排障

- 404。
- 413。
- 502。
- 503。
- 504。
- TLS 错误。
- Service 无 endpoints。

第四阶段：AIOps 集成

- 采集 Ingress Controller metrics。
- 采集 access log。
- 解析 upstream_status 和 upstream_response_time。
- 告警关联 Ingress、Service、Pod。
- 自动生成请求链路诊断报告。

## 学习检查清单

- [ ] 我能解释正向代理和反向代理的区别。
- [ ] 我能读懂 NGINX `server`、`location`、`upstream`。
- [ ] 我能解释 `proxy_pass` 做什么。
- [ ] 我能解释 `proxy_set_header Host`、`X-Forwarded-For`、`X-Forwarded-Proto`。
- [ ] 我能解释 access log 中 status、request_time、upstream_status、upstream_response_time。
- [ ] 我能用 `nginx -t` 检查配置。
- [ ] 我能解释 Kubernetes Ingress 和 Ingress Controller 的区别。
- [ ] 我能写一个最小 Ingress。
- [ ] 我能解释 `ingressClassName`。
- [ ] 我能解释 `pathType: Exact` 和 `Prefix`。
- [ ] 我能配置 Ingress TLS Secret。
- [ ] 我能用 EndpointSlice 判断 Service 是否有后端。
- [ ] 我能排查 404、502、503、504。
- [ ] 我能用 controller 日志和 Pod 日志证明根因。
- [ ] 我能把 Ingress 诊断写进 AIOps runbook。

## 面试题

1. NGINX 反向代理解决什么问题？
2. `server_name` 和 HTTP Host 有什么关系？
3. `location /api/` 和 `location = /api` 有什么区别？
4. `proxy_pass` 常见路径问题是什么？
5. 为什么反向代理要设置 `X-Forwarded-For`？
6. access log 里 `$status` 和 `$upstream_status` 有什么区别？
7. 502、503、504 常见原因分别是什么？
8. Kubernetes Ingress 是什么？
9. Ingress 和 Ingress Controller 有什么区别？
10. IngressClass 的作用是什么？
11. Ingress backend 指向的是什么资源？
12. Service selector 错误会如何影响 Ingress？
13. EndpointSlice 在排查 Ingress 中有什么用？
14. TLS Secret 必须和 Ingress 在同一个 namespace 吗？
15. ingress-nginx annotations 为什么不能随便套到其他 controller？
16. 如何排查 Ingress 404？
17. 如何排查 Ingress 502？
18. 如何排查 Ingress 504？
19. 为什么调大 timeout 不是解决 504 的根因？
20. Ingress/NGINX 在 AIOps 里提供哪些关键证据？

## 学习证据

完成本篇后，建议留下这些证据：

- 一个普通 NGINX 反向代理配置示例。
- 一个 Kubernetes Ingress 示例。
- 一份 Ingress -> Service -> EndpointSlice -> Pod 的链路图。
- 一份 404 排障记录。
- 一份 502/503 排障记录。
- 一份 504 慢请求分析记录。
- 一个 Ingress 诊断脚本，能采集 Ingress、Service、EndpointSlice、Pod、controller logs 和 events。
