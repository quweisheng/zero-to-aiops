# 网络基础

> 目标：能从零理解一次请求从域名到应用返回的完整路径，能解释 DNS、IP、端口、路由、TCP、TLS、HTTP、负载均衡分别负责什么，能使用 `curl`、`dig`、`ip`、`ss`、`ping`、`traceroute`、`openssl s_client` 排查 AIOps 常见网络问题。

## 官方资料

- [RFC 9110: HTTP Semantics](https://www.rfc-editor.org/info/rfc9110/)
- [HTTP core specifications](https://httpwg.org/specs/)
- [RFC 8446: TLS 1.3](https://datatracker.ietf.org/doc/html/rfc8446)
- [RFC 9293: Transmission Control Protocol](https://datatracker.ietf.org/doc/html/rfc9293)
- [RFC 1034: DNS concepts and facilities](https://datatracker.ietf.org/doc/html/rfc1034)
- [RFC 1035: DNS implementation and specification](https://datatracker.ietf.org/doc/html/rfc1035)
- [RFC 8499: DNS terminology](https://www.rfc-editor.org/info/rfc8499/)
- [Linux `ip(8)` manual](https://man7.org/linux/man-pages/man8/ip.8.html)
- [Linux `ip-route(8)` manual](https://man7.org/linux/man-pages/man8/ip-route.8.html)
- [Linux `resolv.conf(5)` manual](https://man7.org/linux/man-pages/man5/resolv.conf.5.html)
- [Linux `getaddrinfo(3)` manual](https://man7.org/linux/man-pages/man3/getaddrinfo.3.html)
- [curl manual](https://curl.se/docs/manpage.html)
- [OpenSSL `s_client` manual](https://docs.openssl.org/3.0/man1/openssl-s_client/)

说明：本文是基于 IETF RFC、Linux man pages、curl 和 OpenSSL 官方文档整理的原创中文教程，不复制官方全文。网络协议细节很多，本文重点服务 AIOps 入门：理解请求路径、知道每层证据在哪里、能定位常见故障。

## 场景开场

告警说：

```text
Payment API 5xx rate > 10%
```

用户说“页面打不开”。你登录服务器后，可能会连续问：

- 域名能解析吗？
- 解析到的 IP 对吗？
- 本机能路由到目标 IP 吗？
- 目标端口通吗？
- TCP 是连接拒绝还是超时？
- TLS 证书过期了吗？
- HTTP 返回 502、503、504 还是 200？
- 是客户端到网关的问题，还是网关到后端的问题？
- 是服务没监听，还是监听在了错误地址？
- 是 DNS、网络、负载均衡、应用还是证书问题？

网络基础就是把这些问题拆开。AIOps 里很多告警表面是“服务不可用”，底层可能是 DNS、端口、路由、TLS、HTTP、负载均衡、连接池、超时任何一层的问题。

## 一句话人话版

网络基础就是理解“一个请求如何找到目标、连上目标、安全传输、发送 HTTP、拿到响应”：DNS 负责把名字变成地址，IP 和路由负责把包送到目标机器，TCP 负责可靠连接，TLS 负责加密和身份校验，HTTP 负责应用层请求和响应。

## 学习边界

入门阶段要先抓这条主线：

```text
域名
  -> DNS 解析出 IP
  -> 本机路由选择网卡和网关
  -> TCP 连接目标 IP:端口
  -> TLS 校验证书并协商加密
  -> HTTP 发送请求
  -> 负载均衡转发
  -> 后端应用处理
  -> 响应按原路径返回
```

先学会这些：

- 域名、IP、端口、socket 的区别。
- DNS A、AAAA、CNAME、TTL、NXDOMAIN、SERVFAIL。
- IPv4、CIDR、网关、路由表、loopback、私有地址。
- TCP 三次握手、连接拒绝、连接超时、TIME_WAIT。
- TLS 证书、SNI、CA、过期、链路校验。
- HTTP method、URL、header、status code、timeout。
- 502、503、504 的常见含义。
- Linux 常用排障命令和输出怎么读。

暂时可以先不深挖：

- BGP、OSPF 等路由协议。
- TCP 拥塞控制算法细节。
- TLS 密码学数学细节。
- HTTP/2 帧格式、HTTP/3 QUIC 细节。
- eBPF 网络追踪。
- Kubernetes CNI 底层实现。
- 大规模云网络架构。

## 官方知识地图

网络资料很分散，建议这样读：

```text
IETF RFC
  -> 协议标准
  -> DNS: RFC 1034 / RFC 1035 / RFC 8499
  -> TCP: RFC 9293
  -> TLS: RFC 8446
  -> HTTP: RFC 9110 / RFC 9111 / RFC 9112 / RFC 9113 / RFC 9114

Linux man pages
  -> 本机如何使用网络
  -> ip(8): 查看和修改地址、链路、路由
  -> ip-route(8): 路由表
  -> resolv.conf(5): DNS resolver 配置
  -> getaddrinfo(3): 应用如何把名字解析成地址

工具官方文档
  -> curl: HTTP/TLS/DNS/代理/超时诊断
  -> OpenSSL s_client: TLS 证书和握手诊断

发行版和云厂商文档
  -> NetworkManager、systemd-resolved、防火墙、负载均衡、VPC
```

把它们连起来：

```text
RFC 解释协议是什么
Linux man page 解释系统怎么用协议
curl / openssl / ip / ss / dig 把协议状态暴露成可观察证据
AIOps 把证据变成告警、排障和自动化恢复
```

## 网络在 AIOps 链路中的位置

网络是所有观测、告警和恢复动作的底座。

```text
用户
  -> DNS
  -> CDN / WAF
  -> Load Balancer
  -> NGINX / Ingress
  -> Service / Pod / VM
  -> 应用进程
  -> 数据库 / 缓存 / 队列

观测链路
  -> exporter 暴露指标
  -> Prometheus 抓取
  -> Alertmanager 发告警
  -> Grafana 展示
  -> Runbook 自动化调用 HTTP / SSH / API
```

只要网络有问题，AIOps 自己也会受影响：

- Prometheus 抓不到 exporter。
- Grafana 查不到数据源。
- Alertmanager webhook 发不出去。
- 自动化脚本连不上主机。
- 日志采集器推送失败。
- 服务之间调用超时。

所以网络基础不是“运维可选知识”，而是 AIOps 的必备诊断语言。

## 一次请求的完整链路

以访问：

```text
https://api.example.com:443/v1/alerts?severity=critical
```

为例。

### 1. 解析 URL

客户端先拆出：

| 部分 | 值 | 含义 |
|---|---|---|
| scheme | `https` | 使用 HTTPS |
| host | `api.example.com` | 目标主机名 |
| port | `443` | 目标端口，HTTPS 默认 443 |
| path | `/v1/alerts` | 资源路径 |
| query | `severity=critical` | 查询参数 |

### 2. DNS 解析

客户端要先把 `api.example.com` 变成 IP：

```text
api.example.com
  -> DNS resolver
  -> A / AAAA 记录
  -> 203.0.113.10
```

### 3. 选择路由

本机根据目标 IP 查路由表：

```text
目标 203.0.113.10
  -> 默认路由
  -> 网关 192.168.1.1
  -> 网卡 eth0
```

### 4. 建立 TCP 连接

客户端从本地临时端口连接目标：

```text
client 192.168.1.20:53124
  -> server 203.0.113.10:443
```

TCP 通过三次握手建立连接：

```text
SYN
SYN-ACK
ACK
```

### 5. TLS 握手

因为 scheme 是 HTTPS，TCP 连接建立后还要 TLS：

```text
ClientHello (带 SNI: api.example.com)
ServerHello
Certificate
密钥协商
Finished
```

客户端会检查：

- 证书是否过期。
- 证书域名是否匹配 `api.example.com`。
- 证书链是否能被信任的 CA 验证。
- TLS 版本和加密套件是否可接受。

### 6. HTTP 请求

TLS 通道建立后，客户端发送 HTTP 请求：

```http
GET /v1/alerts?severity=critical HTTP/1.1
Host: api.example.com
User-Agent: curl/8.x
Accept: */*
```

### 7. 服务端处理并响应

服务端可能经过：

```text
Load Balancer
  -> NGINX / Ingress
  -> 后端 API
  -> 数据库 / 缓存
```

返回：

```http
HTTP/1.1 200 OK
Content-Type: application/json
```

如果任何一层失败，用户看到的都可能只是“打不开”。

## 分层模型

新手常听到 OSI 七层，但排障时更常用简化模型：

```text
应用层：HTTP、DNS、Prometheus scrape、MySQL 协议
安全层：TLS
传输层：TCP、UDP
网络层：IP、路由、ICMP
链路层：网卡、MAC、ARP、交换机
物理层：网线、光纤、无线
```

常见问题按层分类：

| 层 | 问题 | 常用工具 |
|---|---|---|
| DNS | 域名解析失败、解析错 IP | `dig`、`nslookup`、`resolvectl` |
| IP/路由 | 到不了目标网段、网关错 | `ip addr`、`ip route`、`ping`、`traceroute` |
| TCP | 端口没监听、连接拒绝、超时 | `ss`、`curl -v`、`nc` |
| TLS | 证书过期、域名不匹配、协议不兼容 | `openssl s_client`、`curl -v` |
| HTTP | 404、500、502、503、504、超时 | `curl -v`、服务日志、网关日志 |
| 负载均衡 | 后端不健康、转发错误 | LB/Ingress 状态、后端 health check |

排障原则：

```text
先证明名字能解析
再证明 IP 能到
再证明端口能连
再证明 TLS 能握手
再证明 HTTP 语义正确
最后看应用和依赖
```

## 域名、IP、端口、socket

### 域名

域名是给人看的名字：

```text
api.example.com
```

它本身不能路由。网络包最终要发往 IP 地址。

### IP

IP 是网络层地址：

```text
203.0.113.10
```
主机通过 IP 找到目标网络位置。

### 端口

端口是传输层标识，用来区分同一台机器上的不同服务：

```text
203.0.113.10:443
203.0.113.10:80
203.0.113.10:9090
```

同一个 IP 可以有多个服务监听不同端口。

### socket

socket 可以理解为一次网络通信的端点。TCP 连接通常由四元组唯一标识：

```text
源 IP、源端口、目标 IP、目标端口
```

例子：

```text
192.168.1.20:53124 -> 203.0.113.10:443
```

排查时 `ss -tanp` 看到的就是这些连接状态。

## DNS 是什么

DNS 是 Domain Name System，负责把域名映射到资源记录。

最常见用途：

```text
api.example.com -> A 记录 -> IPv4 地址
api.example.com -> AAAA 记录 -> IPv6 地址
```

DNS 是分布式、层级化系统：

```text
.
  -> com
    -> example.com
      -> api.example.com
```

常见角色：

| 角色 | 作用 |
|---|---|
| stub resolver | 本机或应用里的解析入口 |
| recursive resolver | 递归解析器，帮客户端一路问出答案 |
| root server | 根服务器，指向 TLD |
| TLD server | 顶级域服务器，如 `.com` |
| authoritative server | 权威服务器，掌握某个 zone 的记录 |

简化流程：

```text
应用调用 getaddrinfo("api.example.com")
  -> 本机 resolver
  -> /etc/hosts
  -> /etc/resolv.conf 指定的 nameserver
  -> recursive resolver
  -> root / TLD / authoritative
  -> 返回 A / AAAA
```

## DNS 记录类型

常见记录：

| 类型 | 含义 | 例子 |
|---|---|---|
| `A` | 域名到 IPv4 | `api.example.com -> 203.0.113.10` |
| `AAAA` | 域名到 IPv6 | `api.example.com -> 2001:db8::10` |
| `CNAME` | 别名 | `api.example.com -> lb.example.net` |
| `MX` | 邮件交换 | 邮件系统 |
| `NS` | 权威 DNS 服务器 | zone 委派 |
| `TXT` | 文本记录 | 域名验证、SPF |
| `SRV` | 服务发现 | 某些内部系统 |
| `PTR` | 反向解析 | IP 到名字 |

AIOps 常见问题：

- A 记录指向旧 IP。
- CNAME 链过长或中间记录错误。
- AAAA 记录存在但 IPv6 网络不可用。
- TTL 太长导致变更生效慢。
- 内外网 DNS 返回不同结果。

## TTL、缓存和解析漂移

TTL 是 Time To Live，表示 DNS 记录可缓存多久。

```text
api.example.com. 300 IN A 203.0.113.10
```

这里 `300` 表示缓存 300 秒。

TTL 影响：

- TTL 短：切换快，但解析请求更多。
- TTL 长：缓存稳定，但故障切换慢。

排障时要问：

- 你查的是哪个 DNS resolver？
- 客户端是否有本地缓存？
- 应用进程是否缓存解析结果？
- 负载均衡 DNS 是否按地域返回不同 IP？

同一域名在不同环境结果不同并不一定是错误：

```bash
dig api.example.com
dig @8.8.8.8 api.example.com
dig @1.1.1.1 api.example.com
```

企业内网常有 split-horizon DNS：内网解析到内网地址，公网解析到公网地址。

## DNS 常见错误

### NXDOMAIN

域名不存在。

可能原因：

- 域名拼错。
- 记录被删除。
- 查询了错误环境的域名。

排查：

```bash
dig no-such-name.example.com
```

### SERVFAIL

服务器无法给出有效答案。

可能原因：

- 权威服务器异常。
- DNSSEC 验证失败。
- 递归解析器故障。

### 超时

DNS 查询没有收到响应。

可能原因：

- nameserver 不通。
- 防火墙拦截 UDP/TCP 53。
- 本机 resolver 配置错误。

### 解析到错误 IP

可能原因：

- DNS 缓存未过期。
- 修改了错误 zone。
- 内外网 resolver 不同。
- `/etc/hosts` 覆盖了 DNS。

## `/etc/hosts`、`resolv.conf`、`getaddrinfo`

Linux 应用通常不会自己从零实现 DNS。很多程序会调用 `getaddrinfo()` 之类的系统接口。

常见解析输入：

```text
/etc/hosts
/etc/nsswitch.conf
/etc/resolv.conf
systemd-resolved / NetworkManager 等本地服务
```

`/etc/hosts` 示例：

```text
127.0.0.1 localhost
192.168.1.10 api.local
```

`/etc/resolv.conf` 示例：

```text
nameserver 192.168.1.1
search example.com
options timeout:2 attempts:3
```

排查：

```bash
cat /etc/hosts
cat /etc/resolv.conf
getent hosts api.example.com
```

`getent hosts` 的价值是：它更接近应用通过系统解析接口看到的结果，而 `dig` 默认更像直接问 DNS。

## IP 地址和 CIDR

IPv4 地址：

```text
192.168.1.20
```
CIDR：

```text
192.168.1.20/24
```

`/24` 表示前 24 位是网络号，对应子网掩码：

```text
255.255.255.0
```
常见私有地址：

| 范围 | 常见用途 |
|---|---|
| `10.0.0.0/8` | VPC、大型内网 |
| `172.16.0.0/12` | Docker、Kubernetes、企业网络 |
| `192.168.0.0/16` | 家庭和小型办公网络 |
| `127.0.0.0/8` | loopback，本机 |

查看本机地址：

```bash
ip addr
```

你会看到：

```text
inet 192.168.1.20/24 brd 192.168.1.255 scope global eth0
```

解释：

| 字段 | 含义 |
|---|---|
| `inet` | IPv4 地址 |
| `192.168.1.20/24` | 本机地址和子网 |
| `brd` | 广播地址 |
| `scope global` | 全局作用域 |
| `eth0` | 网卡名 |

## loopback、0.0.0.0 和监听地址

这是服务排障高频点。

### 127.0.0.1

只在本机访问：

```text
127.0.0.1
localhost
```

服务如果只监听 `127.0.0.1:8000`，外部机器访问不了。

### 0.0.0.0

监听所有 IPv4 地址：

```text
0.0.0.0:8000
```

表示本机所有网卡地址都可接受连接。

### 具体内网 IP

只监听某张网卡地址：

```text
192.168.1.20:8000
```

### 排查命令

```bash
ss -ltnp
```

示例：

```text
LISTEN 0 128 127.0.0.1:8000 0.0.0.0:* users:(("python",pid=1234,fd=3))
```

说明服务只监听本机。

如果希望外部访问，应用通常要绑定：

```text
0.0.0.0
```
例如 FastAPI：

```bash
uvicorn app:app --host 0.0.0.0 --port 8000
```

## 路由表

路由表决定“去某个 IP 应该从哪个网卡、哪个网关走”。

查看：

```bash
ip route
```

示例：

```text
default via 192.168.1.1 dev eth0
192.168.1.0/24 dev eth0 proto kernel scope link src 192.168.1.20
```

解释：

| 字段 | 含义 |
|---|---|
| `default` | 默认路由，其他规则没匹配时走这里 |
| `via 192.168.1.1` | 下一跳网关 |
| `dev eth0` | 从 eth0 发出 |
| `192.168.1.0/24` | 本地直连网段 |
| `src 192.168.1.20` | 源地址 |

查看访问某 IP 会走哪条路由：

```bash
ip route get 8.8.8.8
```

输出可能是：

```text
8.8.8.8 via 192.168.1.1 dev eth0 src 192.168.1.20
```

排查“能解析但连不上”时，`ip route get` 很有用。

## ARP 和邻居表

在同一个二层网络内，主机需要把 IP 映射到 MAC 地址。IPv4 常用 ARP，IPv6 使用邻居发现。

查看邻居表：

```bash
ip neigh
```

示例：

```text
192.168.1.1 dev eth0 lladdr aa:bb:cc:dd:ee:ff REACHABLE
```

如果网关 ARP 异常，可能表现为：

- 同网段偶发不通。
- 默认网关 ping 不通。
- `ip neigh` 显示 `FAILED`、`STALE` 等状态。

AIOps 入门阶段只需要知道：如果路由指向某个网关，但二层找不到它，包也发不出去。

## TCP 是什么

TCP 是可靠的传输层协议。应用使用它获得“像字节流一样”的连接。

TCP 负责：

- 建立连接。
- 按序传输。
- 丢包重传。
- 流量控制。
- 拥塞控制。
- 连接关闭。

TCP 不负责：

- 域名解析。
- 加密。
- HTTP 语义。
- 判断业务是否健康。

## TCP 三次握手

建立连接：

```text
Client                          Server
  | -------- SYN --------------> |
  | <------ SYN + ACK ---------- |
  | -------- ACK --------------> |
```

如果成功，连接进入 `ESTABLISHED`。

如果目标端口没有服务监听，常见结果是：

```text
Connection refused
```

如果网络路径不通或被防火墙丢包，常见结果是：

```text
Connection timed out
```

这两个要区分：

| 现象 | 更可能说明 |
|---|---|
| refused | 目标机器到了，但端口没人监听，或主动拒绝 |
| timed out | 包没到、回包没回、防火墙丢弃、路由问题 |

## TCP 状态

查看连接：

```bash
ss -tan
```

常见状态：

| 状态 | 含义 | 排障提示 |
|---|---|---|
| `LISTEN` | 服务正在监听端口 | 服务端是否有监听 |
| `SYN-SENT` | 已发 SYN，等待响应 | 目标端口或路径可能不通 |
| `SYN-RECV` | 服务端收到 SYN，等待 ACK | 可能有半连接堆积 |
| `ESTAB` | 已建立连接 | 正常连接 |
| `TIME-WAIT` | 主动关闭后等待 | 大量出现不一定是故障 |
| `CLOSE-WAIT` | 对端已关闭，本端未关闭 | 应用可能没正确关闭连接 |

查看监听端口和进程：

```bash
ss -ltnp
```

查看某端口：

```bash
ss -ltnp sport = :8000
```

查看连接到某目标：

```bash
ss -tan dst 203.0.113.10
```

## UDP 是什么

UDP 是无连接传输协议。

特点：

- 没有 TCP 三次握手。
- 不保证可靠到达。
- 不保证顺序。
- 开销小，延迟低。

常见使用：

- DNS 查询。
- NTP。
- QUIC/HTTP/3。
- 某些日志和指标协议。

DNS 常用 UDP 53，但大响应、区域传输等场景可能使用 TCP 53。

排查 UDP 比 TCP 难，因为没有连接状态。通常要看应用日志、抓包或使用协议工具。

## TLS 是什么

TLS 是加密和身份认证层。HTTPS 就是 HTTP over TLS。

TLS 解决：

- 防窃听：别人看不到明文内容。
- 防篡改：内容被改会被发现。
- 身份认证：客户端验证服务端证书是否属于目标域名。

TLS 不解决：

- 服务业务是否正常。
- DNS 是否被解析到正确地址。
- 后端是否 500。

TLS 握手中很重要的概念：

| 概念 | 含义 |
|---|---|
| certificate | 服务端证书 |
| CA | 证书颁发机构 |
| certificate chain | 从服务证书到根 CA 的链 |
| SNI | 客户端告诉服务端要访问哪个域名 |
| ALPN | 协商 HTTP/1.1、HTTP/2 等应用协议 |
| expiry | 证书过期时间 |

检查证书：

```bash
openssl s_client -connect api.example.com:443 -servername api.example.com
```

只看证书日期：

```bash
openssl s_client -connect api.example.com:443 -servername api.example.com </dev/null 2>/dev/null \
  | openssl x509 -noout -subject -issuer -dates
```

注意 `-servername`。没有 SNI 时，服务端可能返回默认证书，导致误判。

## HTTP 是什么

HTTP 是应用层协议。它定义请求和响应的语义。

请求示例：

```http
GET /health HTTP/1.1
Host: api.example.com
User-Agent: curl/8.x
Accept: */*
```

响应示例：

```http
HTTP/1.1 200 OK
Content-Type: application/json

{"status":"ok"}
```

HTTP 关键元素：

| 元素 | 含义 |
|---|---|
| method | 动作，如 GET、POST、PUT、DELETE |
| path | 资源路径 |
| query | 查询参数 |
| header | 元数据，如 Host、Authorization、Content-Type |
| body | 请求或响应主体 |
| status code | 响应状态码 |

## HTTP 状态码

常见状态码：

| 状态码 | 含义 | AIOps 排查方向 |
|---|---|---|
| 200 | 成功 | 服务至少有基本响应 |
| 301/302 | 重定向 | 检查 Location、HTTPS 跳转 |
| 400 | 请求格式错误 | 客户端参数、网关规则 |
| 401 | 未认证 | token、cookie、认证配置 |
| 403 | 无权限 | 权限、IP allowlist、WAF |
| 404 | 资源不存在 | 路由、路径、版本 |
| 408 | 请求超时 | 客户端发送太慢或网关超时 |
| 429 | 限流 | 流量突增、限流策略 |
| 500 | 服务端内部错误 | 应用异常 |
| 502 | Bad Gateway | 网关连不上后端或后端响应异常 |
| 503 | Service Unavailable | 后端不可用、维护、过载 |
| 504 | Gateway Timeout | 网关等后端超时 |

经验：

- 4xx 多数先看请求、认证、权限、路由。
- 5xx 多数先看服务端、依赖、网关和后端日志。
- 502 和 504 很适合沿链路往后查。

## 负载均衡和反向代理

生产请求很少直接到应用进程。常见链路：

```text
Client
  -> DNS
  -> Load Balancer
  -> NGINX / Ingress
  -> App instance 1
  -> App instance 2
```

负载均衡负责：

- 接收客户端连接。
- 按规则选择后端。
- 做健康检查。
- 终止 TLS 或透传 TLS。
- 设置超时。
- 做重试。
- 添加转发头。

常见转发头：

| Header | 含义 |
|---|---|
| `Host` | 原始主机名 |
| `X-Forwarded-For` | 客户端 IP 链 |
| `X-Forwarded-Proto` | 原始协议 http/https |
| `X-Request-Id` | 请求追踪 ID |

排查 502/504 时要看：

- LB/NGINX 日志。
- 后端健康检查状态。
- 后端端口是否监听。
- upstream 地址是否正确。
- 网关到后端的超时配置。
- 后端应用日志中是否收到请求。

## 常用命令字典

### curl

最重要的 HTTP/TLS 排障工具。

查看响应头：

```bash
curl -I "https://api.example.com/health"
```

详细过程：

```bash
curl -v "https://api.example.com/health"
```

显示状态码：

```bash
curl -sS -o /dev/null -w "%{http_code}\n" "https://api.example.com/health"
```

显示更多时间指标：

```bash
curl -sS -o /dev/null \
  -w "dns=%{time_namelookup} connect=%{time_connect} tls=%{time_appconnect} first_byte=%{time_starttransfer} total=%{time_total} code=%{http_code}\n" \
  "https://api.example.com/health"
```

解释：

| 指标 | 含义 |
|---|---|
| `time_namelookup` | DNS 解析耗时 |
| `time_connect` | TCP 连接建立耗时 |
| `time_appconnect` | TLS 握手完成耗时 |
| `time_starttransfer` | 首字节耗时 |
| `time_total` | 总耗时 |
| `http_code` | HTTP 状态码 |

指定 Host 头：

```bash
curl -H "Host: api.example.com" "http://203.0.113.10/health"
```

绕过 DNS，把域名解析到指定 IP：

```bash
curl --resolve "api.example.com:443:203.0.113.10" "https://api.example.com/health"
```

设置超时：

```bash
curl --connect-timeout 3 --max-time 10 "https://api.example.com/health"
```

### dig

DNS 查询工具。

查 A 记录：

```bash
dig api.example.com A
```

查 AAAA：

```bash
dig api.example.com AAAA
```

指定 DNS server：

```bash
dig @8.8.8.8 api.example.com A
```

短输出：

```bash
dig +short api.example.com
```

查看 CNAME 链：

```bash
dig api.example.com
```

关注：

| 字段 | 含义 |
|---|---|
| `status` | `NOERROR`、`NXDOMAIN`、`SERVFAIL` |
| `ANSWER SECTION` | 实际答案 |
| `AUTHORITY SECTION` | 权威信息 |
| `SERVER` | 回答你的 DNS server |
| `Query time` | 查询耗时 |

### getent

按系统解析规则查询。

```bash
getent hosts api.example.com
```

价值：更接近应用通过 libc resolver 看到的结果，会受 `/etc/hosts`、`nsswitch.conf` 等影响。

### ip addr

查看本机地址：

```bash
ip addr
```

只看某网卡：

```bash
ip addr show dev eth0
```

关注：

- 网卡是否 `UP`。
- 是否有预期 IP。
- CIDR 是否正确。
- 是否有多个地址导致源地址选择异常。

### ip route

查看路由表：

```bash
ip route
```

查看去某目标怎么走：

```bash
ip route get 203.0.113.10
```

关注：

- 默认路由是否存在。
- 目标是否走了预期网卡。
- 源地址是否正确。
- 是否存在更具体路由覆盖默认路由。

### ss

查看 socket。

监听端口：

```bash
ss -ltnp
```

所有 TCP：

```bash
ss -tan
```

按端口过滤：

```bash
ss -ltnp sport = :8000
```

关注：

- 服务是否在 `LISTEN`。
- 监听地址是 `127.0.0.1` 还是 `0.0.0.0`。
- 进程名和 PID 是否符合预期。
- 是否大量 `SYN-SENT`、`CLOSE-WAIT`、`TIME-WAIT`。

### ping

使用 ICMP 测试基本连通性：

```bash
ping -c 4 8.8.8.8
```

注意：

- ping 通不代表 TCP 端口通。
- ping 不通也不一定代表服务不通，因为 ICMP 可能被禁。
- ping 适合初步判断网络层和延迟。

### traceroute / tracepath

查看路径：

```bash
traceroute api.example.com
tracepath api.example.com
```

注意：

- 中间跳不响应不一定是故障。
- 云网络和防火墙可能隐藏路径。
- 更适合判断路径在哪一段明显中断。

### nc

测试 TCP 端口：

```bash
nc -vz api.example.com 443
```

注意：`nc` 只能证明 TCP 端口可连，不证明 TLS 和 HTTP 正常。

### openssl s_client

检查 TLS：

```bash
openssl s_client -connect api.example.com:443 -servername api.example.com
```

查看证书日期：

```bash
openssl s_client -connect api.example.com:443 -servername api.example.com </dev/null 2>/dev/null \
  | openssl x509 -noout -subject -issuer -dates
```

关注：

- certificate subject / SAN 是否包含域名。
- issuer 是否可信。
- notBefore / notAfter。
- Verify return code。
- 协商的 TLS 版本和 cipher。

## 配置和输出字典

### `/etc/resolv.conf`

```text
nameserver 192.168.1.1
search example.com
options timeout:2 attempts:3
```

| 字段 | 含义 |
|---|---|
| `nameserver` | DNS resolver 地址 |
| `search` | 搜索域 |
| `timeout` | 单次查询等待时间 |
| `attempts` | 尝试次数 |

注意：很多发行版由 NetworkManager 或 systemd-resolved 管理此文件，手工改可能被覆盖。

### `ss -ltnp` 输出

```text
State  Recv-Q Send-Q Local Address:Port Peer Address:Port Process
LISTEN 0      128    0.0.0.0:8000      0.0.0.0:*     users:(("python",pid=1234,fd=3))
```

| 字段 | 含义 |
|---|---|
| `State` | TCP 状态 |
| `Recv-Q` | 接收队列 |
| `Send-Q` | 发送队列 |
| `Local Address:Port` | 本地监听地址和端口 |
| `Peer Address:Port` | 对端地址和端口 |
| `Process` | 进程信息 |

### `curl -v` 输出

你会看到类似：

```text
* Host api.example.com:443 was resolved.
*   Trying 203.0.113.10:443...
* Connected to api.example.com (203.0.113.10) port 443
* TLSv1.3 (OUT), TLS handshake, Client hello
> GET /health HTTP/1.1
> Host: api.example.com
< HTTP/1.1 200 OK
```

逐段解释：

| 输出 | 含义 |
|---|---|
| `was resolved` | DNS 解析完成 |
| `Trying` | 开始 TCP 连接 |
| `Connected` | TCP 连接成功 |
| `TLS handshake` | TLS 握手中 |
| `>` | 请求内容 |
| `<` | 响应内容 |

### HTTP timing

`curl -w` 指标：

| 指标 | 常见问题 |
|---|---|
| DNS 慢 | resolver 慢、域名链复杂、网络到 DNS 慢 |
| connect 慢 | TCP 路径慢、防火墙、目标负载高 |
| TLS 慢 | 证书链、握手、CPU、网络延迟 |
| first byte 慢 | 后端处理慢、数据库慢、排队 |
| total 慢 | 响应体大、下载慢、网络拥塞 |

## AIOps 入门实验

目标：用一组命令把一次 HTTP 请求拆成 DNS、路由、TCP、TLS、HTTP 五段证据。

### 1. 选择目标

可以选择你的本地服务：

```text
http://127.0.0.1:8000/health
```

也可以选择一个测试域名：

```text
https://example.com/
```

### 2. DNS 证据

```bash
dig example.com A
getent hosts example.com
```

记录：

```text
DNS server:
解析结果:
TTL:
status:
```

### 3. 路由证据

把解析出的 IP 放进去：

```bash
ip route get 93.184.216.34
```

记录：

```text
dev:
via:
src:
```

### 4. TCP/HTTP 证据

```bash
curl -v --connect-timeout 3 --max-time 10 "https://example.com/" -o /tmp/network-test.out
```

记录：

```text
是否 resolved:
是否 Connected:
HTTP status:
错误信息:
```

### 5. 时间分解

```bash
curl -sS -o /dev/null \
  -w "dns=%{time_namelookup} connect=%{time_connect} tls=%{time_appconnect} first_byte=%{time_starttransfer} total=%{time_total} code=%{http_code}\n" \
  "https://example.com/"
```

记录：

```text
dns:
connect:
tls:
first_byte:
total:
code:
```

### 6. TLS 证据

```bash
openssl s_client -connect example.com:443 -servername example.com </dev/null 2>/dev/null \
  | openssl x509 -noout -subject -issuer -dates
```

记录：

```text
subject:
issuer:
notBefore:
notAfter:
```

### 7. 形成学习笔记

写一段：

```text
我访问 example.com 时，DNS 用了 __ 秒，解析到 __。
路由从 __ 网卡出去，源地址是 __。
TCP 连接耗时 __ 秒，TLS 完成耗时 __ 秒。
HTTP 返回 __。
如果某一步失败，我会优先检查 __。
```

## 典型故障排查表

| 现象 | 可能层级 | 先用命令 | 常见原因 |
|---|---|---|---|
| `Could not resolve host` | DNS | `dig`、`getent hosts` | 域名错、DNS 配置错、resolver 不通 |
| `NXDOMAIN` | DNS | `dig name` | 域名不存在、记录未创建 |
| DNS 很慢 | DNS | `curl -w time_namelookup` | resolver 慢、网络到 DNS 慢 |
| `No route to host` | IP/路由 | `ip route get` | 路由缺失、防火墙返回不可达 |
| ping 不通 | IP/ICMP | `ping`、`traceroute` | 路由、防火墙、ICMP 禁用 |
| `Connection refused` | TCP/端口 | `ss -ltnp`、`curl -v` | 端口未监听、服务挂了 |
| `Connection timed out` | TCP/网络 | `ip route get`、`traceroute` | 防火墙丢包、路由不通、目标无响应 |
| 服务只本机能访问 | 监听地址 | `ss -ltnp` | 只监听 `127.0.0.1` |
| TLS 证书错误 | TLS | `openssl s_client`、`curl -v` | 证书过期、域名不匹配、链不完整 |
| 301/302 循环 | HTTP | `curl -IL` | HTTP/HTTPS 跳转配置错误 |
| 401/403 | HTTP/认证 | `curl -v` | token、权限、WAF、allowlist |
| 404 | HTTP/路由 | `curl -v`、网关日志 | path 错、路由没配置 |
| 502 | 网关到后端 | 网关日志、`ss` | 后端没监听、连接被拒、upstream 错 |
| 503 | 服务不可用 | LB 健康检查 | 后端全不健康、过载、维护 |
| 504 | 网关等待超时 | 网关日志、应用日志 | 后端慢、数据库慢、超时太短 |
| Prometheus 抓取失败 | HTTP/TCP/DNS | `curl` scrape URL | target down、路径错、网络策略 |

## 排障流程：访问不了一个域名

假设目标：

```text
https://api.example.com/health
```

按顺序：

```bash
dig api.example.com A
getent hosts api.example.com
ip route get <resolved-ip>
curl -v --connect-timeout 3 --max-time 10 "https://api.example.com/health"
openssl s_client -connect api.example.com:443 -servername api.example.com </dev/null
```

判断：

1. DNS 是否有答案？
2. 答案是否是预期 IP？
3. 本机是否有去该 IP 的路由？
4. TCP 是否连接成功？
5. TLS 是否握手成功？
6. HTTP 状态码是什么？
7. 如果经过网关，网关日志里有没有请求？
8. 后端应用日志里有没有请求？

不要跳着查。网络问题最怕“感觉是某层”，但没有证据。

## 排障流程：502

502 通常是网关作为客户端访问后端时失败。

常见链路：

```text
Client -> NGINX -> App
```

先看客户端：

```bash
curl -v "https://api.example.com/health"
```

再看网关到后端：

```bash
curl -v "http://127.0.0.1:8000/health"
ss -ltnp sport = :8000
```

如果后端在另一台机器：

```bash
curl -v "http://10.0.1.25:8000/health"
ip route get 10.0.1.25
```

看日志：

```bash
journalctl -u nginx -n 100 --no-pager
journalctl -u aiops-api -n 100 --no-pager
```

常见根因：

- 后端进程没启动。
- 后端只监听 `127.0.0.1`，但网关从外部访问。
- upstream IP 或端口错。
- 后端连接数满。
- 后端提前关闭连接。
- 网关和后端协议不一致，例如网关用 HTTP 访问 HTTPS。

## 排障流程：504

504 通常是网关连接后端成功了，但等待响应超时。

要区分：

- 连接超时：后端端口连接不上。
- 读超时：连上了，但后端处理太慢。

检查 curl 时间：

```bash
curl -sS -o /dev/null \
  -w "connect=%{time_connect} first_byte=%{time_starttransfer} total=%{time_total} code=%{http_code}\n" \
  "https://api.example.com/slow-api"
```

如果 `connect` 很快但 `first_byte` 很慢，多半是后端处理慢或依赖慢。

继续查：

- 应用日志是否收到请求。
- 数据库查询是否慢。
- 下游 API 是否超时。
- 网关 read timeout 是否过短。
- 应用 worker 是否耗尽。

## 排障流程：Prometheus 抓不到 target

Prometheus target down 时，先拿 scrape URL 手工测。

假设 target：

```text
http://10.0.1.20:9100/metrics
```

在 Prometheus 机器上：

```bash
curl -v --connect-timeout 3 "http://10.0.1.20:9100/metrics"
```

在 target 机器上：

```bash
ss -ltnp sport = :9100
systemctl status node_exporter --no-pager
journalctl -u node_exporter -n 100 --no-pager
```

判断：

- exporter 是否运行。
- exporter 是否监听正确地址。
- Prometheus 到 target 的路由是否通。
- 防火墙或安全组是否放行。
- scrape path 是否正确。
- HTTP 返回是否是 200。

## AIOps 自动化脚本示例

这个脚本把一个 URL 拆成基础证据。

```bash
#!/usr/bin/env bash
set -euo pipefail

url="${1:-https://example.com/}"
host="$(python3 - <<'PY' "$url"
import sys
from urllib.parse import urlparse
print(urlparse(sys.argv[1]).hostname or "")
PY
)"

echo "== target =="
echo "url=$url"
echo "host=$host"

echo
echo "== dns =="
getent hosts "$host" || true

echo
echo "== curl timing =="
curl -sS -o /dev/null \
  -w "dns=%{time_namelookup} connect=%{time_connect} tls=%{time_appconnect} first_byte=%{time_starttransfer} total=%{time_total} code=%{http_code}\n" \
  --connect-timeout 3 \
  --max-time 10 \
  "$url" || true

echo
echo "== verbose last check =="
curl -v --connect-timeout 3 --max-time 10 "$url" -o /tmp/aiops-network-check.out || true
```

生产化前要补：

- JSON 输出。
- 错误分类。
- DNS server 记录。
- resolved IP 记录。
- 证书过期时间。
- trace id。
- 多地区探测。
- 告警阈值和抑制。

## 面试怎么讲

一次 HTTPS 请求通常先解析 URL，再通过 DNS 把域名解析成 IP，然后本机根据路由表选择网卡和网关，通过 TCP 三次握手连接目标 IP 和端口，再进行 TLS 握手完成证书校验和加密协商，最后发送 HTTP 请求并接收响应。排障时我会按层定位：先用 `dig` 或 `getent` 看解析，再用 `ip route get` 看路由，用 `ss` 看本机监听，用 `curl -v` 看 DNS、TCP、TLS、HTTP 的过程，用 `openssl s_client` 看证书和 SNI。遇到 502/504 会重点区分客户端到网关、网关到后端、后端到依赖是哪一段慢或失败。

## 小白可能会问

### ping 通为什么 curl 不通？

ping 用 ICMP，curl 用 TCP/TLS/HTTP。ICMP 通只说明网络层可能通，不代表目标端口监听、TLS 正常、HTTP 正常。

### curl 报 refused 和 timeout 有什么区别？

refused 通常说明目标主机可达，但端口没人监听或主动拒绝。timeout 通常说明包被丢、路由不通、防火墙丢弃或目标无响应。

### 为什么本机 curl 127.0.0.1 可以，别人访问不行？

服务可能只监听 `127.0.0.1`。外部访问需要监听 `0.0.0.0` 或具体内网 IP，并放通防火墙和安全组。

### DNS 解析对了，为什么还是访问错服务？

可能是 Host header、SNI、负载均衡规则、反向代理路由或缓存导致。HTTPS 虚拟主机尤其依赖 SNI 和 Host。

### 502 和 504 怎么区分？

502 多数是网关从后端拿到无效响应或连接失败。504 多数是网关等待后端响应超时。实际要看网关日志和 upstream 状态。

### TIME_WAIT 很多是不是故障？

不一定。TIME_WAIT 是 TCP 正常关闭的一部分。要结合连接量、端口耗尽、应用连接池和错误率判断。

## 学习路线

第一阶段：会拆请求

- URL、域名、IP、端口。
- DNS -> 路由 -> TCP -> TLS -> HTTP。
- 4xx 和 5xx 基本含义。

第二阶段：会用工具

- `curl -v`
- `curl -w`
- `dig`
- `getent hosts`
- `ip addr`
- `ip route get`
- `ss -ltnp`
- `openssl s_client`

第三阶段：会排障

- DNS 失败。
- 连接拒绝。
- 连接超时。
- TLS 证书错误。
- 502。
- 504。
- Prometheus target down。

第四阶段：接入 AIOps

- 把 curl timing 变成探测指标。
- 把 DNS 解析异常变成告警。
- 把证书过期时间变成告警。
- 把 blackbox exporter 接入 Prometheus。
- 把网关 5xx 和后端日志关联。
- 把 runbook 做成逐层证据采集。

## 学习检查清单

- [ ] 我能解释 DNS、IP、端口、TCP、TLS、HTTP 各自负责什么。
- [ ] 我能画出一次 HTTPS 请求的完整链路。
- [ ] 我能解释 A、AAAA、CNAME、TTL、NXDOMAIN、SERVFAIL。
- [ ] 我能解释 `127.0.0.1`、`0.0.0.0`、内网 IP 的区别。
- [ ] 我能使用 `ip addr` 查看本机地址。
- [ ] 我能使用 `ip route get` 判断访问目标走哪张网卡。
- [ ] 我能使用 `ss -ltnp` 判断端口是否监听。
- [ ] 我能解释 connection refused 和 timed out 的区别。
- [ ] 我能使用 `curl -v` 看 DNS、TCP、TLS、HTTP 过程。
- [ ] 我能使用 `curl -w` 拆分请求耗时。
- [ ] 我能使用 `openssl s_client` 检查证书和 SNI。
- [ ] 我能解释 502、503、504 的常见原因。
- [ ] 我能排查 Prometheus target down。
- [ ] 我能把网络排障步骤写进 AIOps runbook。

## 面试题

1. 从浏览器访问一个 HTTPS URL，中间经历哪些步骤？
2. DNS A、AAAA、CNAME、TTL 分别是什么？
3. `dig` 和 `getent hosts` 的区别是什么？
4. `127.0.0.1` 和 `0.0.0.0` 有什么区别？
5. 如何查看 Linux 机器的 IP 地址？
6. 如何查看访问某个 IP 会走哪条路由？
7. TCP 三次握手是什么？
8. connection refused 和 connection timed out 有什么区别？
9. 如何查看某个端口是否被监听？
10. TLS 证书校验主要检查什么？
11. SNI 是什么？为什么 `openssl s_client` 常要带 `-servername`？
12. HTTP 502、503、504 有什么区别？
13. 为什么 ping 通不代表服务可用？
14. Prometheus target down 时你会怎么查？
15. 如何用 curl 拆分 DNS、TCP、TLS、首字节和总耗时？
16. 为什么服务只监听 127.0.0.1 会导致外部访问失败？
17. DNS TTL 对故障切换有什么影响？
18. 大量 CLOSE-WAIT 可能说明什么？
19. 网关到后端超时时，你会看哪些日志和指标？
20. AIOps 如何把网络诊断自动化？

## 学习证据

完成本篇后，建议留下这些证据：

- 一份“访问某 URL 的 DNS、路由、TCP、TLS、HTTP 分段记录”。
- 一张自己画的请求链路图。
- 一份 `curl -w` timing 输出解释。
- 一份 502 或 504 的模拟排障笔记。
- 一个网络探测脚本，能输出 DNS 结果、HTTP 状态码和耗时分解。
