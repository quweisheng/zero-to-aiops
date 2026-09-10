# NGINX / Ingress / Gateway API

> 目标：能理解 NGINX 反向代理、Kubernetes Ingress 和 Gateway API 分别解决什么问题，能读懂 `server`、`location`、`upstream`、`proxy_pass`、timeout 与 access log；能维护遗留 Ingress，能为新系统选择 Gateway API 实现，并按入口到 EndpointSlice 的证据链排查 404、502、503、504 和 TLS 故障。

> **重要退役警告**：社区项目 `kubernetes/ingress-nginx` 已于 2026-03-24 结束维护，不再发布版本、修复缺陷或修复安全问题。已有实例不会自动停止，但不能再把它作为新生产集群的推荐入口。本文保留它的存量识别与排障知识，新部署主线改为 Gateway API。

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
- [ingress-nginx 退役公告](https://kubernetes.io/blog/2025/11/11/ingress-nginx-retirement/)
- [ingress-nginx 遗留文档](https://kubernetes.github.io/ingress-nginx/)
- [Gateway API](https://kubernetes.io/docs/concepts/services-networking/gateway/)
- [Gateway API v1.6.1](https://github.com/kubernetes-sigs/gateway-api/releases/tag/v1.6.1)
- [从 ingress-nginx 迁移](https://gateway-api.sigs.k8s.io/guides/getting-started/migrating-from-ingress-nginx/)
- [Ingress2Gateway 1.0](https://kubernetes.io/blog/2026/03/20/ingress2gateway-1-0-release/)
- [NGINX Ingress Controller docs](https://docs.nginx.com/nginx-ingress-controller/)

说明：本文基于 NGINX、Kubernetes 和 Gateway API 官方资料重新整理，不复制官方全文。截至 2026-08-14，NGINX OSS stable 为 1.30.4、mainline 为 1.31.3；社区 ingress-nginx 最后可见 controller-v1.15.1 且已经退役。F5 维护的 `nginx/kubernetes-ingress` 是另一个项目，不是社区 ingress-nginx 的后续版本，owner、功能、配置和许可都应分别核对。

## 先把四个名字分清

| 名称 | 它是什么 | 当前应该怎么用 |
|---|---|---|
| NGINX OSS | 通用 Web Server、反向代理和负载均衡软件 | 继续学习配置、reload、日志、连接和上游排障 |
| Ingress API | Kubernetes 中描述 HTTP/HTTPS 入口规则的 GA API | 仍可维护，但功能已冻结，行为取决于 controller |
| 社区 ingress-nginx | `kubernetes/ingress-nginx` controller | 只做遗留盘点、只读诊断和迁移，不新建生产方案 |
| Gateway API | 角色化、可扩展的下一代入口 API | 新入口主线；仍需选择并安装维护中的 controller |

Ingress API 没有因为 ingress-nginx 退役而被 Kubernetes 删除。真正退役的是一个具体 controller 项目。反过来，安装 Gateway API CRD 也不等于已经有网关：还必须有 controller 创建负载均衡器或代理，并在 `Gateway`、`HTTPRoute` 的 status 中写回结果。

## 场景开场

用户访问：

```text
https://aiops.example.com/api/alerts
```

结果报错：

```text
502 Bad Gateway
```

很多新手会直接问：“后端是不是挂了？”

但真正链路可能是：

```text
用户
  -> DNS（域名解析）
  -> 云负载均衡
  -> NGINX / Ingress Controller（代理服务器与入口控制器）
  -> Kubernetes Service（集群服务入口）
  -> EndpointSlice（后端地址集合）
  -> Pod（容器组）
  -> Container（容器）端口
  -> 应用
```

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
Client（客户端）
  -> DNS（域名解析）
  -> Load Balancer（负载均衡器）
  -> NGINX / Ingress Controller（代理或入口控制器）
  -> host 匹配
  -> path 匹配
  -> upstream / Service（后端组或服务）
  -> EndpointSlice（后端地址集合）
  -> Pod IP:targetPort（容器组地址与目标端口）
  -> Application（应用）
```

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
NGINX docs（官方文档）
  -> Beginner's Guide（入门）
  -> Admin Guide（管理）
     -> Web Server（网页服务）
     -> Reverse Proxy（反向代理）
     -> Load Balancing（负载均衡）
     -> SSL Termination（加密连接终止）
  -> Reference（模块参考）
     -> ngx_http_core_module（HTTP 核心模块）
        -> server（虚拟主机）
        -> location（路径规则）
        -> listen（监听）
        -> server_name（主机名）
        -> client_max_body_size（请求体上限）
     -> ngx_http_proxy_module（代理模块）
        -> proxy_pass（转发目标）
        -> proxy_set_header（转发请求头）
        -> proxy_connect_timeout（连接超时）
        -> proxy_read_timeout（相邻读取超时）
        -> proxy_send_timeout（相邻发送超时）
     -> ngx_http_upstream_module（后端组模块）
        -> upstream（后端组）
        -> server（组内服务器）
        -> keepalive（空闲连接复用）
     -> ngx_http_log_module（日志模块）
        -> log_format（格式）
        -> access_log（访问日志）
```

Kubernetes Ingress 官方资料按这些概念组织：

```text
Kubernetes Service（服务）
  -> selector（标签筛选）
  -> port / targetPort（服务端口与目标端口）
  -> EndpointSlice（后端地址集合）

Kubernetes Ingress（入口规则）
  -> Ingress resource（声明对象）
  -> Ingress Controller（执行控制器）
  -> IngressClass（选择控制器类别）
  -> rules（规则）
  -> host（主机名）
  -> path（路径）
  -> pathType（匹配语义）
  -> backend service（后端服务）
  -> TLS（传输加密）

ingress-nginx（基于 NGINX 的入口控制器项目）
  -> Controller installation（遗留安装识别）
  -> ConfigMap（配置对象）
  -> annotations（实现扩展注解）
  -> path matching（路径匹配）
  -> TLS（传输加密）
  -> troubleshooting（排障）
```

新手要把两张图合起来：

```text
Ingress YAML 是规则声明
Ingress Controller 持续观察入口、服务和后端地址对象
Controller（控制器）生成或更新 NGINX 配置
NGINX worker（工作进程）按虚拟主机、路径规则和转发目标处理真实流量
```

## NGINX / Ingress 在 AIOps 链路中的位置

NGINX/Ingress 是用户流量进入应用的关键入口。

```text
用户请求
  -> DNS（域名解析）
  -> CDN / WAF（内容分发网络与应用防火墙）
  -> Load Balancer（负载均衡器）
  -> NGINX / Ingress Controller（代理服务器与入口控制器）
  -> Service（服务入口）
  -> Pod（容器组）
  -> 应用
  -> 数据库 / 缓存 / 队列

观测
  -> NGINX access log / error log（访问日志与错误日志）
  -> Ingress Controller metrics（入口控制器指标）
  -> Kubernetes events（集群事件）
  -> Service / EndpointSlice 状态
  -> Pod logs（容器组日志）
```

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

而应该先采集：

```bash
kubectl get ingress,svc,endpointslice -n aiops -o wide
kubectl describe ingress aiops-api -n aiops
kubectl logs -n ingress-nginx deploy/ingress-nginx-controller --tail=200
kubectl get pod -n aiops -l app=aiops-api -o wide
kubectl describe svc aiops-api -n aiops
```

## 正向代理和反向代理

### 正向代理

正向代理代表客户端访问外部。

```text
Client（客户端）-> Forward Proxy（正向代理）-> Internet（外部网络）
```

例子：

- 公司代理上网。
- 开发机配置 HTTP proxy。

服务端看到的是代理在访问。

### 反向代理

反向代理代表服务端接收客户端请求，再转发给后端。

```text
Client（客户端）-> Reverse Proxy（反向代理）-> Backend Servers（后端服务器）
```

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
# main context：全局上下文，不是可执行指令

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

NGINX 会先根据端口和 Host 选择 server，再根据 URI 选择 location。

常见问题：

- DNS 指向了 NGINX，但 Host 没匹配任何 server。
- 默认 server 接住请求，返回默认 404。
- `server_name` 写了内网域名，用户访问公网域名。

测试 Host：

以下命令中的 `<nginx-ip>` 与后文 `<ingress-address>` 都是占位符；执行前把整个尖括号内容替换为已核对的授权入口地址，保留包住完整 URL 或参数的引号。不要照抄尖括号，也不要省略引号让 Shell 将其当成文件重定向；Host 头仍应与要验证的路由规则一致。

```bash
curl -H "Host: aiops.example.com" 'http://<nginx-ip>/'
```

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

默认负载均衡一般是轮询。

常见策略：

```nginx
upstream aiops_api {
    least_conn;
    server 10.0.1.10:8000;
    server 10.0.1.11:8000;
}
```

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

含义：

| Header | 含义 |
|---|---|
| `Host` | 本例用 `$host` 转发主机名；它并不保证保留原始 Host 头的逐字内容 |
| `X-Real-IP` | 直接客户端 IP |
| `X-Forwarded-For` | 代理链上的客户端 IP 列表 |
| `X-Forwarded-Proto` | 本例 `$scheme` 表示本 NGINX 收到连接的协议；前面还有 TLS 终止代理时，不能据此推断最初用户协议 |
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

含义：

| 指令 | 含义 | 常见对应故障 |
|---|---|---|
| `proxy_connect_timeout` | 连接 upstream 的超时 | 后端端口连不上 |
| `proxy_send_timeout` | 向 upstream 两次连续写操作之间允许等待的时间，并非整个上传总时长 | 上传/请求体发送问题 |
| `proxy_read_timeout` | 从 upstream 两次连续读操作之间允许等待的时间，并非整个响应总时长 | 后端迟迟不产出数据，常见 504 |

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

如果上传文件太大，可能返回 413。

Ingress-nginx 常用 annotation：

```yaml
nginx.ingress.kubernetes.io/proxy-body-size: "10m"
```

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

常见 error log 片段：

```text
connect() failed (111: Connection refused) while connecting to upstream
upstream timed out (110: Connection timed out) while reading response header from upstream
no live upstreams while connecting to upstream
```

这些比“用户说打不开”有营养得多。

## NGINX 配置检查和 reload

检查配置：

```bash
nginx -t
```

reload：

```bash
nginx -s reload
```

systemd 管理时：

```bash
systemctl reload nginx
systemctl status nginx --no-pager
journalctl -u nginx -n 100 --no-pager
```

修改 NGINX 配置前后，应：

```bash
nginx -t
systemctl reload nginx
curl -v -H "Host: aiops.example.com" http://127.0.0.1/
```

## Kubernetes Ingress 是什么

Ingress 是 Kubernetes 的 API 对象，用于管理进入集群的 HTTP/HTTPS 路由。

它描述：

```text
host + path（域名与路径匹配） -> Service（目标服务）
```

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

Ingress 中指定：

```yaml
spec:
  ingressClassName: nginx
```

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

命令创建：

```bash
kubectl create secret tls aiops-example-tls \
  -n aiops \
  --cert=./tls.crt \
  --key=./tls.key
```

排查证书：

```bash
openssl s_client -connect aiops.example.com:443 -servername aiops.example.com </dev/null 2>/dev/null \
  | openssl x509 -noout -subject -issuer -dates
```

常见 TLS 问题：

- Secret 不在 Ingress 同 namespace。
- Secret 名写错。
- 证书域名不匹配。
- 证书过期。
- 中间证书链不完整。
- 没带 SNI 测试导致看到默认证书。

## 遗留 ingress-nginx annotations

以下内容只用于识别和迁移已有 ingress-nginx 环境，不代表建议新装这个已退役 controller。ingress-nginx 用 annotations 扩展 Ingress 行为；迁移时必须逐项映射到 Gateway API 标准字段或目标实现扩展。

示例：

```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/proxy-read-timeout: "60"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "60"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
```

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

## 从 Ingress 到 Pod 的完整链路

请求：

```text
https://aiops.example.com/api/alerts
```

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

排障时按这个顺序查，不要跳。

## 常用命令字典

### NGINX 检查配置

```bash
nginx -t
```

看配置语法是否正确。

### NGINX reload

```bash
nginx -s reload
```

systemd：

```bash
systemctl reload nginx
```

### 查看 NGINX 状态

```bash
systemctl status nginx --no-pager
journalctl -u nginx -n 100 --no-pager
```

### 本地测 Host

```bash
curl -v -H "Host: aiops.example.com" http://127.0.0.1/
```

绕过 DNS 直接测某个入口 IP：

```bash
curl --resolve "aiops.example.com:443:203.0.113.10" https://aiops.example.com/
```

### 查看 Ingress

```bash
kubectl get ingress -n aiops
kubectl describe ingress aiops-api -n aiops
kubectl get ingress aiops-api -n aiops -o yaml
```

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

### 查看 Controller

以 ingress-nginx 为例：

```bash
kubectl get pods -n ingress-nginx -o wide
kubectl logs -n ingress-nginx deploy/ingress-nginx-controller --tail=200
```

### 查看 Service

```bash
kubectl get svc aiops-api -n aiops -o wide
kubectl describe svc aiops-api -n aiops
```

### 查看 EndpointSlice

```bash
kubectl get endpointslice -n aiops -l kubernetes.io/service-name=aiops-api
kubectl describe endpointslice -n aiops -l kubernetes.io/service-name=aiops-api
```

### 查看 Pod

```bash
kubectl get pod -n aiops -l app=aiops-api -o wide
kubectl describe pod -n aiops -l app=aiops-api
kubectl logs -n aiops -l app=aiops-api --tail=100
```

### 集群内测试 Service

```bash
kubectl run curl-test -n aiops --rm -it --image=curlimages/curl:8.10.1 --restart=Never -- \
  curl -v http://aiops-api/
```

### 测 TLS 证书

```bash
openssl s_client -connect aiops.example.com:443 -servername aiops.example.com
```

### 看 HTTP 时间分解

```bash
curl -sS -o /dev/null \
  -w "dns=%{time_namelookup} connect=%{time_connect} tls=%{time_appconnect} first_byte=%{time_starttransfer} total=%{time_total} code=%{http_code}\n" \
  https://aiops.example.com/
```

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

## 遗留 Ingress 实验：仅用于已存在的隔离环境

目标：在已经存在且允许测试的隔离 Ingress 环境中部署 Web 服务并理解入口链路。不要为本段新安装已退役的 ingress-nginx；新建实验应优先使用下方 Gateway API 部分。`aiops` 必须是专用实验命名空间，且实验前不存在同名对象。

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
          image: nginx:1.30.4
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

应用：

```bash
kubectl create namespace aiops
kubectl apply -f aiops-web.yaml
kubectl get deploy,pod,svc,endpointslice -n aiops -o wide
```

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

应用：

```bash
kubectl apply -f aiops-ingress.yaml
kubectl describe ingress aiops-web -n aiops
```

测试入口 IP：

```bash
kubectl get ingress aiops-web -n aiops
curl -v -H "Host: aiops.local" 'http://<ingress-address>/'
```

如果本地实验没有真实 DNS，可以用 `--resolve`：

```bash
curl --resolve "aiops.local:80:<ingress-address>" http://aiops.local/
```

### 3. 制造 404

把 Host 改错：

```bash
curl -v -H "Host: wrong.local" 'http://<ingress-address>/'
```

观察：

- 是否命中默认 backend。
- Ingress rules 是否有对应 host。
- controller 日志是否有请求。

### 4. 制造 503 或无 endpoints

用编辑器修改保存的 `aiops-web.yaml`，只把 Service 部分 selector 改错（不要改 Deployment），再执行 `kubectl apply -f aiops-web.yaml`：

```yaml
selector:
  app: wrong-label
```

检查：

```bash
kubectl get svc aiops-web -n aiops -o yaml
kubectl get pods -n aiops --show-labels
kubectl get endpointslice -n aiops -l kubernetes.io/service-name=aiops-web
curl -v -H "Host: aiops.local" 'http://<ingress-address>/'
```

观察 EndpointSlice 是否为空。

### 5. 制造 502

先把 Service selector 恢复为 `app: aiops-web` 并 apply，验证请求恢复 200；然后只把 Service `targetPort` 改成不存在端口，再 apply：

```yaml
targetPort: 9999
```

检查：

```bash
kubectl describe svc aiops-web -n aiops
kubectl get endpointslice -n aiops -l kubernetes.io/service-name=aiops-web
kubectl logs -n ingress-nginx deploy/ingress-nginx-controller --tail=100
```

观察 controller 日志中的 upstream 连接错误。

### 6. 形成学习证据

恢复 `targetPort: http` 并 apply，确认 EndpointSlice 与真实 HTTP 请求恢复正常。结束后只删除自己创建的对象：`kubectl delete -f aiops-ingress.yaml -f aiops-web.yaml`。如果命名空间还含其他资源，不删除整个命名空间；也不删除共用控制器。这样每次故障都是单变量、可恢复的实验。

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
curl -v -H "Host: aiops.example.com" 'http://<ingress-address>/api/alerts'
kubectl get ingress -n aiops
kubectl describe ingress aiops-api -n aiops
kubectl get ingress aiops-api -n aiops -o yaml
```

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

继续从 controller Pod 内测后端：

```bash
kubectl exec -n ingress-nginx deploy/ingress-nginx-controller -- curl -v http://aiops-api.aiops.svc.cluster.local/
```

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

看入口日志：

```bash
kubectl logs -n ingress-nginx deploy/ingress-nginx-controller --tail=200
```

看后端：

```bash
kubectl logs -n aiops -l app=aiops-api --tail=200
kubectl top pods -n aiops
```

判断：

- upstream 是否收到了请求？
- upstream_response_time 是否接近 timeout？
- 数据库或下游 API 是否慢？
- worker 是否耗尽？
- 是否应该异步化长任务？

## 排障流程：TLS

```bash
kubectl get ingress aiops-api -n aiops -o yaml
kubectl get secret aiops-example-tls -n aiops -o custom-columns=NAME:.metadata.name,TYPE:.type
openssl s_client -connect aiops.example.com:443 -servername aiops.example.com </dev/null
```

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

生产化前要补：

- 自动读取 Ingress backend Service。
- 自动解析 host/path。
- 自动 curl 入口。
- 保存 access/error log。
- 和请求 ID 关联。
- 输出 JSON 诊断报告。

## Gateway API：新入口主线

### 小白一句话

Ingress 像“应用团队把所有要求都写在一张表上”；Gateway API 把责任拆成三层：基础设施团队提供 `GatewayClass`，平台团队管理 `Gateway` 和监听端口，应用团队只维护自己的 `HTTPRoute`。

```text
GatewayClass（网关实现类别）
  -> 选择哪个 controller（控制器实现）
Gateway（网关实例）
  -> 地址、listener（监听器）、TLS、允许哪些命名空间挂路由
HTTPRoute（HTTP 路由）
  -> host、path、filter、backendRefs（主机名、路径、过滤器、后端引用）
ReferenceGrant（跨命名空间引用授权）
  -> 目标命名空间是否允许被其他命名空间引用
controller（控制器）
  -> Accepted / ResolvedRefs / Programmed（接受、引用解析、下发状态）
data plane（处理请求的数据面）
  -> Service（服务）-> EndpointSlice（后端地址）-> Pod（容器组）
```

三个 condition 是入门排障核心：

| Condition | 人话 | False 时先查什么 |
|---|---|---|
| `Accepted` | controller 是否接受这条配置 | parentRef、host、listener、冲突规则 |
| `ResolvedRefs` | Service、Secret 等引用能否找到且被授权 | 名称、端口、namespace、ReferenceGrant |
| `Programmed` | controller 是否已把期望状态下发到数据面 | controller 日志、LB 地址、代理配置与资源容量 |

condition 变绿仍不等于业务成功。还要检查 Gateway 地址、DNS、TLS、Service、EndpointSlice、Pod readiness，并从客户端发起一条真实请求。

### 基础实验：已有 Gateway controller 的一次性集群

#### 前置条件

- 一次性 Kubernetes 1.30+ 集群。
- 已选择一个仍维护且有 Gateway API conformance 报告的 controller。
- `kubectl get gatewayclass` 至少返回一个 `ACCEPTED=True` 的 class。
- 以下实验不在共享生产集群执行。

安装 Standard channel CRD；部分 controller 会代装 CRD，执行前先看它自己的安装文档：

```bash
kubectl apply --server-side -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.6.1/standard-install.yaml
kubectl get crd gateways.gateway.networking.k8s.io httproutes.gateway.networking.k8s.io
kubectl get gatewayclass
```

把 `<your-gateway-class>` 替换为上一步真实 class 名，然后保存为 `gateway-lab.yaml`：

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: gateway-lab
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
  namespace: gateway-lab
spec:
  replicas: 2
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: web
          image: nginx:1.30.4
          readinessProbe:
            httpGet:
              path: /
              port: 80
---
apiVersion: v1
kind: Service
metadata:
  name: web
  namespace: gateway-lab
spec:
  selector:
    app: web
  ports:
    - port: 80
      targetPort: 80
---
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: web-gateway
  namespace: gateway-lab
spec:
  gatewayClassName: <your-gateway-class>
  listeners:
    - name: http
      protocol: HTTP
      port: 80
---
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: web
  namespace: gateway-lab
spec:
  parentRefs:
    - name: web-gateway
  rules:
    - backendRefs:
        - name: web
          port: 80
```

执行与验证：

```bash
kubectl apply -f gateway-lab.yaml
kubectl wait -n gateway-lab --for=condition=Available deploy/web --timeout=120s
kubectl get gateway,httproute -n gateway-lab -o wide
kubectl describe gateway web-gateway -n gateway-lab
kubectl describe httproute web -n gateway-lab
kubectl get endpointslice -n gateway-lab -l kubernetes.io/service-name=web
```

预期：Gateway/Route 被接受，引用解析成功，Gateway 被编程，EndpointSlice 有两个 ready endpoint。最后按照所选 controller 的文档获取地址并 `curl`，HTTP 200 才算完整通过。

如果没有成功，先检查：GatewayClass 是否被 controller 接受、controller 是否有资源或 LoadBalancer 权限、Route 的 `parentRefs` 是否匹配 listener、Service 端口与 EndpointSlice 是否正确。

完成下面故障注入与恢复后再清理，不要现在删除实验对象：

```bash
kubectl delete -f gateway-lab.yaml
```

不要随手删除共享集群的 Gateway API CRD；其他团队的 Route 可能也依赖它。

### 故障注入：后端引用写错

仅在上面的实验环境执行：

```bash
kubectl patch httproute web -n gateway-lab --type=json \
  -p='[{"op":"replace","path":"/spec/rules/0/backendRefs/0/name","value":"web-missing"}]'
kubectl describe httproute web -n gateway-lab
```

预期：`ResolvedRefs=False`，原因接近 `BackendNotFound`；真实请求会失败或返回 controller 定义的 5xx。证据顺序是 Route condition → controller log → Service/EndpointSlice → HTTP 结果，不能一上来重启代理。

恢复并用同一探针复验：

```bash
kubectl patch httproute web -n gateway-lab --type=json \
  -p='[{"op":"replace","path":"/spec/rules/0/backendRefs/0/name","value":"web"}]'
kubectl get httproute web -n gateway-lab -o yaml
```

跨 namespace 引用还要由目标 namespace 创建 `ReferenceGrant`。它用于防止“源 namespace 擅自借用别人的 Service 或 Secret”，不是可省略的麻烦配置。

## 从 ingress-nginx 迁移，而不是原地改名

官方 `ingress2gateway` 1.0 可以转换多种 Ingress 和三十多项 ingress-nginx annotation，但“生成 YAML 成功”不代表行为等价。regex/path、rewrite、timeout、body size、snippet、认证、WebSocket、gRPC 和源 IP 都必须实测。

生产迁移顺序：

1. 导出全部 Ingress、IngressClass、annotation、Secret、外部 LB/DNS 和 controller 版本。
2. 将规则分成 Gateway 标准字段、目标实现扩展、必须重写、没有等价能力四类。
3. 新旧 controller 使用不同 LB IP 并行，禁止两个 controller 抢同一资源。
4. 对 host/path/rewrite/header/body/TLS/WebSocket/gRPC/超时和性能跑回归。
5. 小流量或测试域名切换，比较状态码、延迟、错误率和日志。
6. 切换正式 DNS/LB，保留旧入口和明确回滚时间窗。
7. 观察期结束后再下线遗留 controller；退役项目不能长期作为“临时兜底”。

### 生产事故题

题目：迁移后支付接口出现间歇性 503，但 Gateway、HTTPRoute 都显示 `Accepted=True`。怎么查？

回答主线：

1. 用同一时间窗口的客户端状态码、Gateway 访问日志、Route conditions 和发布记录确认影响范围。
2. 检查 `ResolvedRefs`、`Programmed`、Service、EndpointSlice ready 数和 Pod readiness；`Accepted` 只说明对象被接收。
3. 对比新旧入口的 host/path/rewrite/header、连接超时和上游 TLS，确认是否只有某一版本或节点失败。
4. 假设可能包括 EndpointSlice 抖动、错误 backend port、代理 reload 不一致、连接 draining 或注解迁移语义不同；逐项用证据排除。
5. 修复前评估回切旧 LB/DNS 的传播时间和退役项目安全风险；若达到停止条件，先按预案回切并保留现场证据。
6. 修复后用同一请求集、错误率和 P99 复验，不因控制台变绿就结束事故。

### 系统设计题

题目：设计一个三可用区、多团队共享的 Kubernetes 入口平台。

答案应覆盖：GatewayClass 与 controller 的所有权、每区副本和 PDB、外部 LB/DNS、Gateway/listener 委派、namespace `allowedRoutes`、ReferenceGrant、证书与 Secret 权限、连接/FD/TLS/日志容量、真实请求探针、变更审计、Gateway API conformance、版本升级和双入口回滚。多租户环境还要限制实现特有的任意配置注入，不能让应用团队通过 snippet 获得代理进程级权限。

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
16. ingress-nginx 退役是否等于 Ingress API 被删除？
17. GatewayClass、Gateway、HTTPRoute 和 ReferenceGrant 分别属于谁？
18. `Accepted=True` 为什么仍可能返回 503？
19. 如何用双入口把 ingress-nginx 迁移到 Gateway API？
20. 如何排查 Ingress 404？
21. 如何排查 Ingress 502？
22. 如何排查 Ingress 504？
23. 为什么调大 timeout 不是解决 504 的根因？
24. Ingress/NGINX/Gateway 在 AIOps 里提供哪些关键证据？

## 老师带练：把一个 502 拆成可以验证的假设

### 请求到底有几个名字

浏览器访问 `https://aiops.example.com/api/alerts` 时，先用域名解析地址，再建立连接和 TLS 握手，最后发送 HTTP 请求。SNI 是 TLS 握手里告诉服务器“我要访问哪个站点”的名称，Host 是 HTTP 层的主机信息，两者出现的时机不同。只改 Host 去访问 HTTPS IP，不一定拿到正确证书，所以前面的 `curl --resolve` 很有用：域名仍保留用于证书校验、SNI 与 Host，只替换连接地址。

TLS 是传输层安全协议；证书的 SAN 则是允许该证书代表的名称列表。不要把这里的 SAN 与存储网络 SAN 混淆。发现证书错误时先检查域名、时间、证书链和受信任根，不把 `-k` 跳过校验写成生产修复。

### 四种错误要先找“是谁返回的”

同样的 404 可能由入口默认站点返回，也可能是后端应用没有该路由。用 `$upstream_addr` 和 `$upstream_status` 判断是否转发，结合应用 request ID 核对；不能看到 404 就只改 Ingress。502 也需要确认是入口拒绝/连接失败，还是后端自己返回 502。状态码提供分类线索，不直接证明根因。

503 在无可用后端时很常见；但入口限流、自定义错误页和应用负载保护也可能产生它。504 说明网关等待超时，还要区分连接阶段与响应阶段。注意 `proxy_read_timeout` 测量相邻读取之间的间隔：持续小块输出的流式回答，整个请求可以比这个数值长得多。LLM 生成、SSE 事件流或大文件下载还要考虑缓冲、客户端中断和上游自身期限。

### 一个斜杠为什么会改变 API

考虑前缀 `location /api/`。`proxy_pass http://backend;` 没有 URI 部分，通常把原路径继续传给后端；`proxy_pass http://backend/;` 带 `/` URI，在这种普通前缀匹配下会用 `/` 替换匹配到的 `/api/`，于是 `/api/alerts` 变成 `/alerts`。这不是“写法随便选”，而是后端契约。

含正则 location、rewrite 或变量的配置另有边界，不能套用上述简化规则。迁移前做一张专用请求集：精确路径、子路径、尾斜杠、查询参数、URL 编码字符和不存在路径，分别记录入口与后端实际 URI。原始 `$request_uri` 和内部 `$uri` 不同，正好能帮助发现改写。

### 反向代理会消耗两侧连接

worker 是处理请求的工作进程，事件模型让它在大量连接等待时切换处理，不是每条连接都创建一个新进程。即便如此，前端连接、后端连接、文件描述符、TLS 握手 CPU、缓冲内存、临时文件与日志仍有容量成本。

`worker_connections` 不是简单的“用户数”。一个被代理的请求可能占前后端连接，HTTP/2 又可能在一个连接上复用多个流；长连接与大请求体会改变资源模型。要看连接数、活跃请求、TLS 握手、文件描述符与实际请求分布，不能用一个乘法承诺任意并发。

reload 时新工作进程接新配置，旧进程尽量完成已有连接。它不是把所有长连接瞬间搬过去；频繁 reload 加大量长连接需要观察旧 worker 退出与资源增长。`nginx -t` 通过只证明当前配置可解析及相关检查通过，仍要验收实际请求与错误日志。

### 为什么外部转发头不能无条件信任

客户端可以主动发送 `X-Forwarded-For`，因此把它最左边的值直接当真实用户 IP，可能让访问审计和 IP 限制被伪造。平台需要明确可信代理链、入口地址段和头覆盖规则；应用只信任来自这些受控代理的转发信息。

跨团队 Gateway 也类似：`allowedRoutes` 控制哪些路由可以挂上监听器，ReferenceGrant 控制目标命名空间是否同意跨域引用。源团队写了后端引用，不意味着目标团队授权。RBAC 决定谁能写对象，而对象引用授权决定该引用可不可以成立，两层都要设计。

### 30 秒、3 分钟与生产事故答案

**30 秒：**NGINX 是代理软件，Ingress 和 Gateway API 是声明规则，控制器把规则变成实际数据面配置。请求成功要同时满足地址、TLS、规则接受、后端引用、端点和应用响应，任一层绿色都不是整个链路绿色。

**3 分钟：**沿 DNS→连接/TLS→Host/path→后端→应用讲一次请求，用日志区分入口与上游错误；再说明配置更新异步传播、Gateway 状态、端口和权限边界。最后给出迁移回归矩阵、连接排空、观测窗口和回退条件。

**事故追问：支付 POST 超时，能自动重试到另一 Pod 吗？**先问原请求是否已经完成支付。超时只说明客户端没收到结果，不证明业务没执行。必须依靠业务幂等键、状态查询和明确的重试策略，不能用代理无限重试掩盖问题。

**设计追问：三可用区网关如何升级？**先让副本跨区、负载均衡健康检查与连接排空有效；小批更换数据面，保留配置版本和旧入口，持续比较成功率、p99、TLS、WebSocket/SSE、上传与幂等接口。PDB 只约束部分自愿中断，不替代副本与容量设计。若配置被接受却业务回归失败，按已定义的停止条件回退，而不是继续等控制台自行变好。

## 缓冲课堂：为什么后端已经输出，浏览器仍没有第一段结果

现在换一个 AIOps 场景：模型分析日志，每秒输出一段解释，后端日志显示一直在发送，浏览器却很久后一次显示全部内容。请求没有超时，接口也返回二百，问题可能在响应缓冲。Buffering 在这里是把上游响应暂存后再向慢客户端传递，不是数据库缓存，也不是把响应永久保存供下次请求复用。

NGINX 的响应缓冲可以让后端较快完成输出，把与慢客户端周旋的工作留给代理；代价是内存、可能的临时文件以及流式可见性。关闭缓冲可以更直接地转发收到的数据，但会让慢客户端更直接地影响上游读取节奏。应按接口选择，不把一个流式接口的需求扩展成全站关闭缓冲。具体指令与响应头影响见[代理模块参考](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)。

请求缓冲与响应缓冲也不同。请求缓冲处理客户端上传的正文，响应缓冲处理后端返回内容。大文件上传时先接收完整正文再转发，可以隔离慢上传对后端的影响，却消耗临时空间；流式转发减少等待，但后端更早参与且失败重试条件不同。诊断表要写明流量方向，不能看到“buffer”就统一调整一个参数。

纸面实验准备三个时间：后端产生首块、代理接到首块、客户端看见首块。基础步骤假设同步转发，三个时间接近；故障步骤在代理处加入等到多块后才发送的缓冲条件，预期后端正常而首字节可见时间增加；恢复步骤只修改这条流式路由的策略，再检查普通下载与上传仍符合预期。清理只移除时间表，本课不向生产入口发长连接或大文件压力。

真实隔离验证时，要同时测首字节、块间隔和总时长。只测总时长可能看不出用户体验差异；只看到客户端持续输出，也不能证明每一层都没有缓冲。应用框架、压缩、中间网关与浏览器都可能影响分块，按观察点逐层缩小范围。SSE 是服务器向客户端持续发送事件的 HTTP 用法，它没有让各层的超时与资源限制消失。

## 上游 TLS 课堂：浏览器的小锁只保护了哪一段

浏览器与入口之间的 HTTPS，和入口到后端之间的 HTTPS，是两次不同连接。入口终止 TLS 后可能用明文访问后端，也可能再次加密。用户看到证书正确，只证明自己连接的入口身份通过检查，不证明后端链路同样被加密和验证。

对于 NGINX 到 HTTPS 上游，必须分别理解证书校验、可信 CA、校验名称与发送 SNI。把 `proxy_pass` 改成 `https://` 不等于完成可信服务器校验；应按代理模块文档设置和验证所需信任。证书中的名称与用于连接的地址也不一定相同，后端虚拟主机需要正确的名称信息。不能用关闭校验来解决内部证书治理问题。

老师给出三个反例：入口证书正确但后端证书过期；后端证书链可信但名称不匹配；名称正确但后端需要的客户端证书缺失。基础步骤分别指出失败发生在哪条连接、由哪个进程记录。故障步骤只替换纸面证书属性，观察“浏览器证书正常”这个证据为何无法排除三种问题。恢复步骤需要正确证书、信任链或客户端身份，而不是修改业务 URI。

生产证书轮换先检查新证书与私钥匹配、域名、有效期、完整链及权限，再小范围加载并验证新连接。已有 TLS 连接不一定重新握手，所以仅保持一个长期连接观察，可能漏掉新证书错误。应使用正确域名与 SNI 建立新连接，并保留旧证书可回退条件；私钥和完整秘密对象不进入公开排障材料。

## 路由契约课堂：前缀不是所有实现都按字符串开头判断

Kubernetes 的 `Prefix` 路径匹配强调路径元素边界，例如预期 `/api` 这一层时，应分别测试 `/api`、`/api/alerts` 和 `/apix`。普通 NGINX 前缀 location、正则、Ingress 的标准匹配与实现特有重写并非同一规则。迁移时不能把“都是前缀”当作语义等价证明。

Gateway API 的 HTTPRoute 把主机、路径、请求头、过滤和后端引用组织为路由规则。先读[官方 HTTP 路由说明](https://gateway-api.sigs.k8s.io/guides/user-guides/http-routing/)，再核对所选实现的支持项。某个控制器通过基础一致性测试，不代表它支持你遗留系统全部注解、正则和认证扩展；必须逐项建立能力映射。

准备一份合成请求集：正常路径、尾斜杠、相近但不同的路径元素、带查询参数、经过编码的路径、未知主机。基础步骤在旧入口记录预期后端与实际后端 URI，故障步骤将一个重写或匹配规则迁到新入口，找出不等价用例。恢复步骤针对差异修改映射，再全量重跑请求集。清理只移除本轮测试规则与文件，保留原始验收清单，不改真实 DNS。

注意编码与规范化属于安全边界。两个入口对编码路径的解释不同，可能让认证规则检查一种路径、后端执行另一种路径。生产方案应优先简化规则、对歧义输入采取一致处理，并邀请应用与安全人员共同验证。不能只确保首页打开，就宣布所有管理接口迁移成功。

## Gateway 状态课堂：一条 Route 可能有不止一个父对象

HTTPRoute 可以关联父网关，其状态通常按父引用报告。读状态时要选定实际流量进入的那个父对象和监听器，不能只搜索任意一个 `Accepted=True` 就宣布全体成功。还应核对状态是否观察到了当前配置代次，旧状态可能仍在等待更新。状态是控制器的证据，不是所有父关系共享的全局绿灯。

`Accepted` 回答控制器是否接受附着或规则，`ResolvedRefs` 回答被引用资源是否存在并有权引用，`Programmed` 常用于网关等资源表示数据面编程进度。不是每种对象都必须暴露相同条件，检查目标资源的规范与实现。没有某条件不能随手补一个字段让它变绿，应该回到控制器能力与状态模型。

跨命名空间有两种不同关系。路由挂到别的命名空间网关，主要受监听器的允许路由范围约束；路由引用另一个命名空间的后端，则需要目标侧支持的引用授权。它们分别保护“谁能使用这个入口”和“谁能借用这个目标”。把其中一项设置成全允许并不能替代另一项，也不替代编写资源的 RBAC 权限。

生产设计题让三个团队共用一个入口时，基础设施团队维护实现类别，平台团队拥有监听器与证书，应用团队维护允许范围内的路由。目标后端团队对跨空间引用保留同意权。验收不仅测试合法路由成功，还测试未授权团队不能挂载敏感监听器、不能引用其他团队的服务或秘密。这种反向测试才能证明委派没有变成越权。

## 更新与排空课堂：reload 成功不代表所有请求已经使用新配置

NGINX 收到重新加载信号后会检查并尝试应用新配置，成功时启用新工作进程，让旧进程完成既有工作；如果应用失败，旧配置可能继续运行。按[官方进程控制说明](https://nginx.org/en/docs/control.html)理解这一过程。命令退出、配置检测和业务验证是不同证据点，不能只看终端无报错。

长连接会让旧工作进程保留更久。频繁更新与大量 WebSocket、流式请求叠加时，旧新进程、连接与内存占用可能同时存在。应观察工作进程数量和退出时间，限制变更频率，并在业务允许的范围设计排空策略。强行终止旧进程会中断请求，不应只为让进程列表整齐而操作。

Kubernetes 控制器维护的代理配置，通常应从声明资源更改，而不是直接编辑运行容器里的生成文件。临时手改可能在下一次控制器同步时消失，也可能使不同副本配置不一致。排障可以只读检查实际配置与生成日志，修复则回到拥有该配置的源对象和审批流程。确认哪个系统是配置维护者，是防止反复漂移的第一步。

回滚入口配置只影响之后的匹配和转发，不能撤销已经到达后端的请求。尤其是支付、工单创建与消息发布，入口超时后后端仍可能完成。故障恢复要结合业务幂等、结果查询和审计，不能以“网关已回滚”推断没有重复操作。新旧入口并行期间也需避免把真实写请求无保护地同时发送两遍。

## 日志与容量课堂：一行请求日志可能包含多次上游尝试

代理在特定条件下尝试另一个上游时，日志中的上游地址、状态和耗时可能记录多个值。它们需要按尝试顺序对应，不能取第一段地址和最后一段耗时拼成不存在的一次调用。客户端最终看到二百，也可能经历了一次失败后重试；只统计最终状态会掩盖后端退化与额外流量。

请求总耗时与上游耗时之间的差额也不能简单命名为“网关处理慢”。客户端上传、排队、多个上游尝试和向客户端发送响应都可能参与。先确认各字段测量起止点，再结合连接时间、首字节和应用处理时间推断。原始时间是累计或阶段值时要正确做差，不将累计连接时刻直接当成独立耗时相加。

容量估算把并发连接、活跃请求、每秒新建连接、TLS 握手、请求体大小与响应速度分开。两千个持续流式连接与两千个短请求每秒的资源形态不同。还要为配置重载、新旧进程并存、日志写入和故障域接管留余量。单次压测的最大值不应直接成为生产承诺，验收应有稳定窗口与退化门槛。

AIOps 从日志自动生成根因时，附上入口实例、配置版本、命中规则、后端尝试和业务请求标识，明确缺失字段。把用户提供的转发头当成可信身份，会污染关联与安全判断；把查询参数原样进指标标签，会造成高基数和敏感信息风险。日志保留必要信息，指标采用受控维度，两者联合使用而非相互替代。

本轮没有运行 NGINX、创建网关或执行入口迁移。新增缓冲、证书、路由和容量案例是可复核的纸面模拟，真实产品实验仍需独立环境与所选控制器支持。前文清理 `gateway-lab.yaml` 会包含命名空间，执行前必须确认该空间由本轮独占且没有新增他人资源；否则只处理明确属于本课的对象并停止命名空间删除。

### 发布停止条件：副本保护不能代替流量排空

PodDisruptionBudget 是自愿中断的可用副本约束，不是任意故障下的请求零丢失保证。它不会给已经到达后端的长任务自动续接，也不能阻止机器突然损坏。按 [Kubernetes 中断预算说明](https://kubernetes.io/docs/tasks/run-application/configure-pdb/)设置后，还要检查实际可用副本、驱逐路径、入口与应用的排空配合。三个副本若共享同一个故障节点，纸面上的副本数也无法覆盖节点失效。

纸面生产模拟准备两个入口副本和一条十分钟下载连接。基础步骤标出新请求落点、旧连接归属和后端地址；故障步骤在一分钟时要求升级旧副本，先预测直接终止会影响哪条连接。恢复方案比较等待既有工作结束、业务允许的超时终止和客户端可续传设计。预期答案不是一律等待，而是说明业务允许的中断、最长等待和资源代价。核验用一条短请求与一条长请求分别代表新旧连接，清理只移除模拟记录，不驱逐实际 Pod。

诊断脚本也有成功边界。某条采集命令为了继续收集后续证据而忽略错误，不代表那项检查通过。最终报告应将无法访问、权限不足、命令不存在和对象确实为空分开；其中任一项未知，都不能直接下结论“入口没有配置问题”。容器里没有诊断工具时优先使用批准的调试方式，不临时在生产代理安装一堆软件。恢复结论需要请求证据与关键检查完整度同时满足，而不是脚本执行到最后一行。

## 学习证据

完成本篇后，建议留下这些证据：

- 一个普通 NGINX 反向代理配置示例。
- 一个 Kubernetes Ingress 示例。
- 一份 Ingress -> Service -> EndpointSlice -> Pod 的链路图。
- 一份 404 排障记录。
- 一份 502/503 排障记录。
- 一份 504 慢请求分析记录。
- 一个 Ingress 诊断脚本，能采集 Ingress、Service、EndpointSlice、Pod、controller logs 和 events。
- 一个 Gateway API 1.6.1 实验，保存 GatewayClass、Gateway、HTTPRoute condition 与真实请求结果。
- 一份 ingress-nginx annotation 盘点、目标实现映射、双入口回归和回滚记录。
- 一份后端引用错误导致 `ResolvedRefs=False` 的故障注入复盘。

## 本文验证边界

本文已完成 NGINX、Ingress、Gateway API 与 ingress-nginx 退役事实的官方资料核验，以及 Markdown/命令静态检查；没有替读者选择具体 Gateway controller，也没有实际运行 conformance、入口迁移、TLS/性能回归或生产切流。文中的 ingress-nginx 命令只用于授权的遗留环境，任何新生产方案都必须重新核对所选实现的支持矩阵、conformance、许可、安全公告和回滚能力。
