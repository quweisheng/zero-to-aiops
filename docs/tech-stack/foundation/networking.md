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
  -> 响应经服务端所选路由返回（回程不保证与去程相同）
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
IETF RFC（互联网工程任务组发布的协议文档）
  -> 协议标准
  -> DNS: RFC 1034 / RFC 1035 / RFC 8499（域名系统的基础规范与术语）
  -> TCP: RFC 9293（传输控制协议规范）
  -> TLS: RFC 8446（安全传输协议规范）
  -> HTTP: RFC 9110 / RFC 9111 / RFC 9112 / RFC 9113 / RFC 9114（网页协议语义、缓存与各版本传输规范）

Linux man pages（系统手册）
  -> 本机如何使用网络
  -> ip(8): 查看和修改地址、链路、路由
  -> ip-route(8): 路由表
  -> resolv.conf(5): DNS resolver（解析器）配置
  -> getaddrinfo(3): 应用如何把名字解析成地址

工具官方文档
  -> curl: HTTP/TLS/DNS/代理/超时诊断
  -> OpenSSL s_client: TLS 证书和握手诊断

发行版和云厂商文档
  -> NetworkManager（网络管理器）、systemd-resolved（本机解析服务）
  -> 防火墙、负载均衡、VPC（虚拟私有云网络）
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
  -> DNS（域名解析）
  -> CDN（内容分发网络）/ WAF（网站应用防火墙）
  -> Load Balancer（负载均衡器）
  -> NGINX / Ingress（反向代理／集群入口）
  -> Service / Pod / VM（服务入口／容器组／虚拟机）
  -> 应用进程
  -> 数据库 / 缓存 / 队列

观测链路
  -> exporter（指标导出器）暴露指标
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
api.example.com（示例接口主机名）
  -> DNS resolver（域名解析器）
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
client（客户端） 192.168.1.20:53124
  -> server（服务端） 203.0.113.10:443
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
Load Balancer（负载均衡器）
  -> NGINX / Ingress（反向代理或集群入口）
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
.（根域）
  -> com（顶级域）
    -> example.com（注册域，此处作演示）
      -> api.example.com（接口主机名）
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
  -> 按 NSS 配置选择本机文件或解析服务
  -> 需要 DNS 时使用配置的解析器
  -> recursive resolver（递归解析器）
  -> root / TLD / authoritative（根、顶级域与权威域名服务器）
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
常见私有地址及本地回环地址（回环不是私有网段的同义词）：

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
- `ip neigh` 显示 `FAILED` 可提示邻居解析失败；`STALE` 只是邻居信息等待再次确认，单独出现是正常状态，不能据此判故障。

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
Client（客户端）                          Server（服务端）
  | -------- SYN（同步序号请求） --------------> |
  | <------ SYN + ACK（同步请求与确认） ---------- |
  | -------- ACK（确认） --------------> |
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
- 协议头较小、没有自身的连接握手；实际延迟仍取决于网络和上层协议。

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
Client（客户端）
  -> DNS（域名解析）
  -> Load Balancer（负载均衡）
  -> NGINX / Ingress（代理或集群入口）
       ├── App instance 1（选择应用实例一）
       └── App instance 2（或选择应用实例二）
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
| `time_connect` | 从请求开始到连接建立的累计时间，通常包含解析时间 |
| `time_appconnect` | 从请求开始到应用层握手完成的累计时间 |
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
| `Recv-Q` | LISTEN 行通常表示已完成握手、等待应用接受的连接数量；已建立连接行是未读取的接收字节数 |
| `Send-Q` | LISTEN 行通常表示监听队列上限；已建立连接行表示尚未确认的发送字节数 |
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

把下面单引号里的整个占位符换成刚才实际解析出的 IPv4 地址，保留引号；不要原样输入尖括号：

```bash
ip route get '<刚才实际解析到的IPv4地址>'
```

记录：

```text
dev:
via:
src:
```

### 4. TCP/HTTP 证据

```bash
curl -v --connect-timeout 3 --max-time 10 "https://example.com/" -o /dev/null
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
ip route get '<resolved-ip>' # 将整个占位符替换为已核对的解析地址，保留单引号
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
Client（客户端） -> NGINX（反向代理） -> App（应用）
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

504 表示网关没有及时得到上游响应，可能发生在连接或等待响应阶段；不能仅靠状态码就断定连接已经成功。

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

这个脚本把一个 URL 拆成基础证据。仅对自己获准探测的测试地址运行，不传入含口令、令牌或业务参数的 URL；它会打印地址与详细响应头。它不是接收任意外部 URL 的公开探测服务。

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
curl -v --connect-timeout 3 --max-time 10 "$url" -o /dev/null || true
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

## 老师带你从“网络不通”推导到可验证的故障位置

假设浏览器访问支付接口超时，监控又显示“网关正常”。别急着争论谁对谁错。先画两条独立连接：浏览器到网关、网关到支付服务。若网关终止 TLS（解密并作为新的客户端转发），它们不是同一个 TCP 连接。浏览器成功握手只证明第一段；第二段可能在解析、连接、应用排队或数据库调用中失败。

图中的 Client/Server 是客户端/服务端，SYN 是发起同步序号的连接请求，ACK 是确认；ClientHello/ServerHello 是 TLS 双方开始协商的信息，Certificate 是证书，Finished 是验证握手完整性的结束消息。现代 TLS 可能有恢复会话等不同流程，图展示主干而非逐字报文时序。HTTP/3 使用 QUIC（运行在 UDP 上的安全传输协议），不能把“HTTP 必经 TCP”当成没有例外的定律。

### DNS 成功为什么仍可能访问错服务

解析成功只说明某条解析路径返回了记录。`dig` 直接问 DNS，应用可能先按 NSS（Name Service Switch，名称服务选择规则）查本机文件，也可能使用自己的解析器、代理或缓存。系统并不固定“先 resolver 再 hosts”；具体顺序要看 `/etc/nsswitch.conf`，`systemd-resolved` 等服务也可能在中间。调查时先确认客户端进程实际使用什么，而不是只看你终端的一次查询。

TTL 是缓存允许保留多久，不是“改完 DNS 最晚多少秒所有连接都切换”的全球承诺。已有连接可能继续复用旧地址，应用可能缓存，递归服务还有负缓存等行为；故障切换要测实际客户端。向公共 DNS 查询企业内部域名还可能泄露内部命名，排障应使用批准的解析器，不把内部服务名随手发到公网。

### 先会读时间，再谈优化

在一次新建、无代理、无重定向的简单 HTTPS 连接中，假设 curl 显示 `namelookup=0.020`、`connect=0.050`、`appconnect=0.100`、`starttransfer=0.400`、`total=0.450`。它们大多是从开始时刻累计的时间点，不是五段可以相加的独立耗时。近似推算：解析 20 毫秒，连接阶段 30 毫秒，TLS 阶段 50 毫秒，首字节前后续等待 300 毫秒，响应体接收 50 毫秒。

这 300 毫秒仍不是纯粹的数据库时间，还包括请求传输、服务排队、网关、应用及下游。复用连接、代理、重定向和协议变化也会改变解释；要结合 `remote_ip`（实际对端地址）、协议、连接是否复用以及请求追踪。优化应先确定是哪段慢，再查该段指标，不要看到 `total` 大就调 TCP 参数。[curl 时间字段](https://curl.se/docs/manpage.html#-w)

### 可复现本地实验：同一服务的 200、404 与连接拒绝

前提：Python 3、curl 可用，两个终端，有一个新建空目录 `network-classroom`。全程仅绑定本机 `127.0.0.1`，不改防火墙或 DNS，不把生产日志放进被服务的目录。用编辑器创建 `health.txt`，内容 `ok`。

第一个终端进入该目录执行：

```bash
python -m http.server 18080 --bind 127.0.0.1
```

Linux 若只有 `python3` 命令就替换解释器名。第二个终端执行；Windows PowerShell 中将 `curl` 写成 `curl.exe`：

```bash
curl --noproxy '*' --connect-timeout 2 --max-time 3 -i http://127.0.0.1:18080/health.txt
curl --noproxy '*' --connect-timeout 2 --max-time 3 -i http://127.0.0.1:18080/missing.txt
```

预期第一条 `200` 且正文 `ok`，第二条 `404`。两次都建立了 TCP，也都收到 HTTP 响应；404 不属于“端口不通”。`--noproxy '*'` 仅让此次请求不走代理，避免系统代理干扰本机实验，不需要关闭机器的代理服务。

现在做故障注入：在第一个终端按 Ctrl+C 停止自己启动的服务器，再执行第一条 curl。预期连接失败，常见为 `Connection refused`；若仍返回 200，先核对端口是否被另一个进程使用，不能直接杀掉未知进程。重启同一条 Python 命令，验证恢复 200。Linux 可用 `ss -ltnp 'sport = :18080'` 对照监听从有到无再到有。

清理：再次 Ctrl+C，确认本实验监听消失；仅删除自己创建的 `health.txt` 和空实验目录，或保留它们作证据。不需要任何系统级清理。失败回路：Python 报端口占用就选另一个未用端口并同步修改请求；200 没有 `ok` 查工作目录和文件；连接走代理查命令是否确实用了 `--noproxy`；本课没有 TLS，不能用这个实验声称证书校验已通过。

### TLS 校验不是只看“证书没过期”

证书要同时满足有效期、域名身份、可信链等条件。SNI（Server Name Indication，服务端名称指示）告诉对方你想访问哪个域名，不等于客户端已经验证证书匹配该域名。`openssl s_client -servername` 只解决发送 SNI；需要明确验证时加 `-verify_hostname`，失败即停止可用 `-verify_return_error`，并指定适用的信任根。OpenSSL 的调试连接默认行为不能不加区分地当成浏览器验收。[OpenSSL s_client](https://docs.openssl.org/3.0/man1/openssl-s_client/)

`curl -k` 会跳过重要证书校验，最多用于隔离原因的临时对照，不是生产修复。若确因私有 CA 未信任，应按组织流程分发正确的 CA；若域名不匹配，检查访问名、代理证书和负载均衡配置。抓包和 `curl -v` 也可能含 Authorization（授权头）、Cookie（会话数据），提交日志前必须脱敏。

### 生产设计和事故推演

设计一个跨可用区的告警 API：先明确入口、后端、DNS 和证书责任，再定义健康检查、超时预算、连接复用、限流与降级。客户端总截止时间要留出网络和处理余量，网关重试次数要有限；三层各重试三次会放大后端压力，不能把“重试更多”当成高可用。

容量估算要看同时占用的连接数，而不仅是每秒请求数。稳定状态下可用“平均并发约等于吞吐量乘平均耗时”做第一轮估计；尾延迟升高时连接和线程可能先耗尽。监控连接池等待、活动连接、监听队列、重传、请求错误率和分段延迟。`TIME_WAIT` 多可能是正常短连接负载，是否有端口耗尽需要进一步证据；不先修改内核回收参数掩盖应用没有复用连接的问题。

事故题：“发布后 10% 请求 502”。先按后端实例、版本、区域分组，看是否只落到新实例；比对 readiness（是否可接流量）和进程启动先后，检查网关 upstream（上游）地址与请求日志。若证实仅新实例未准备好，可在审批范围内暂停发布、从流量中摘除有问题实例，验证错误率下降，再修启动与就绪条件。把“新版本相关”当假设，通过实例分布和日志验证，别直接宣判网络设备故障。

### 面试答案的递进层次

30 秒：沿解析、路由、连接、TLS、HTTP 与依赖拆路径，并区分每一层证据能证明什么。3 分钟：进一步解释代理把连接切成多段，DNS/连接缓存影响观察，curl 时间是累计值，HTTP 错误码不能独立确定根因。追问“去程通回程不通怎么办”，答源/目的地址、回程路由、NAT（地址转换）和有状态防火墙，说明需要双方证据；追问“丢包一定降低吞吐吗”，讨论重传、往返时延、拥塞控制和应用量级，不凭一个 ping 丢包百分比推断所有业务。

## 机制加深课堂：连接建立以后，数据仍可能走不动

### TCP 的可靠，是字节流可靠，不是业务事务可靠

老师让你预测一个操作：客户端发送“确认告警”，服务端已经写入数据库，但返回结果时连接断了。客户端看到超时，能不能说操作失败？不能。TCP 的确认主要说明传输层收到了相应字节，不证明应用已经解析、授权、提交和返回；反过来，响应没收到也不证明服务端没执行。网络层和业务层之间有一个必须由应用协议处理的不确定窗口。

TCP 还不保留应用发送调用的边界。发送两次数据，接收方可能一次读到，也可能分多次读到；“粘包”不是 TCP 随机破坏数据，而是应用错误地把字节流当消息队列。协议需要长度、分隔符或明确帧格式，并正确处理半份输入。排查日志采集器偶发解析错误时，先确认是否按完整消息组装，再讨论网络丢包。[TCP 规范](https://www.rfc-editor.org/rfc/rfc9293.html)

面试追问“已经收到确认为何文件还没落盘”，应说明传输确认、应用确认和持久化确认是三种边界。监控探针成功收到二百状态也只说明服务返回了该状态，还要核对响应内容与业务条件。若自动化把网络超时直接转成重复执行，可能对真实系统造成重复操作，这不是增加超时时间就能彻底解决的问题。

### 流量控制与拥塞控制保护的对象不同

流量控制防止发送方压垮接收方，接收窗口表达接收端还能接受多少数据。拥塞控制则根据网络状况调整发送节奏，避免把路径塞满。一个是“对方来不及收”，一个是“路上承受不了”，虽然都可能让吞吐下降，却需要不同证据。不能看到速度低就统一归为带宽不足。

例如服务端进程忙于长时间计算，不读取 socket，接收缓冲可能逐渐占满；发送端即使拥有空闲带宽，也必须等待窗口恢复。这里该检查应用线程、处理队列和读写节奏，而不是给交换机扩容。另一种情况是路径丢包和往返时延增加，发送方减少在途数据，吞吐下降；应检查重传、路径与设备，而不急着增大应用线程池。

在途数据预算也影响长距离传输。用带宽乘往返时间，可以估算为了填满路径大致需要多少未确认数据；这是容量估算，不是指导你直接把所有内核缓冲调到该数。高并发下每条连接的缓冲会合计消耗大量内存，还要考虑接收端处理能力、协议实现和最大允许队列。调整前做隔离负载验证，并保留原值与恢复条件。

### 小请求成功，大响应卡住：路径最大报文的问题

MTU 是某段链路允许的最大传输单元。隧道和封装会额外占用空间，使可承载的内部报文尺寸变小；路径中最小的有效限制决定大报文能否顺利通过。一个小探测包成功，不足以证明所有尺寸的业务数据可用。因此健康接口返回几十字节正常，下载几兆报告失败，并不矛盾。

路径 MTU 发现依赖相关反馈，IPv6 中路由器不会像传统 IPv4 分片那样替源端分片；源端需要据反馈调整包大小。如果必要反馈被丢弃，可能出现大报文持续重传的黑洞现象。判断必须结合抓包大小、重传位置、隧道配置和双方证据，而不是只根据“下载失败”就宣布 MTU 错误。[IPv6 路径 MTU 发现](https://www.rfc-editor.org/rfc/rfc8201.html)

受控验证可以比较相同路径上的小响应与大响应，并使用获准的工具查看路径信息。抓包需要最小范围、限定时长和隐私保护；未获授权不要在业务网络广泛采集。修复应定位错误链路或反馈策略，不能为了让一次测试通过就全网降低 MTU。修改后还要复测长连接、不同区域和经过隧道的流量，并按变更记录准备回退。

### DNS 的空答案，也可能被缓存

解析失败不是只有超时。不存在的名字和存在但没有某种记录是不同语义：例如域名有 IPv4 记录但没有 IPv6 记录，不应一概写成域名不存在。返回状态、答案区与权威信息应一起读。只使用简短输出看见空白，会丢失区分这些情况的必要信息。

负缓存会保存某些“不存在”的结果，所以刚创建的记录也可能在部分客户端暂时仍被认为不存在。负缓存期限由相应 DNS 规则和权威信息决定，并不是新加记录上写一个很短的正向 TTL 就能立即清除旧否定答案。先记录回答你的解析器、查询类型和时间，再比较批准范围内的权威与递归路径。[DNS 负缓存规范](https://www.rfc-editor.org/rfc/rfc2308.html)

这也解释了切换方案必须提前设计。计划降低 TTL，要给旧缓存自然过期留下时间；故障已经发生后才改成很短，不能让客户端忘掉已经缓存的旧答案。现有长连接继续复用旧后端，又是另一层状态。可用性设计应把解析更新、连接重建、实例排空和客户端重试一起考虑，不能把 DNS 切换写成一个瞬间完成的开关。

### NAT 与连接跟踪让“同一目标”出现不同资源瓶颈

NAT 将内部地址和端口映射成另一组地址和端口，网关需要维护相应状态，才能把回包送回正确连接。大量实例通过同一个出口访问同一目标时，可能受出口端口或连接跟踪容量限制，即使各实例的处理器和内存都很空闲。这个瓶颈属于共享出口，不能只在应用机器上统计连接数。

空闲连接还可能被中间设备提前移除状态。客户端连接池认为连接可复用，下一次发送却遭遇重置或超时，于是表现为“空闲一段时间后的第一笔请求失败”。检查客户端空闲回收、网关空闲超时和重用策略，验证错误是否集中在这一条件。保活可以帮助发现连接状态，但不能替代应用超时，也不能让失效连接永远可靠。

高可用出口设计除了多节点，还要说明连接状态是否共享、切换时哪些既有连接会中断、新连接如何建立。状态复制也有延迟与容量成本。对 AIOps 平台，日志补发和探针同时恢复可能形成连接峰值，应限制重连速率并加入随机退避。仅凭出口还有带宽余量，不能排除状态表或端口瓶颈。

### 重试前先回答：重复一次会不会改变结果

HTTP 中幂等指同样请求重复执行的预期服务端效果与执行一次相同，不表示响应字节、日志数量或执行耗时相同。读取通常更容易安全重试，创建任务或执行恢复操作需要业务层明确去重规则。方法名是语义契约，实际接口仍必须遵守它，不能因为请求写成删除方法就假定所有后端副作用都正确。[HTTP 幂等语义](https://www.rfc-editor.org/rfc/rfc9110.html#section-9.2.2)

假设客户端、网关和应用各允许总计三次尝试，最坏情况下可能把一次用户意图扩成二十七次下游尝试。这个教学算例用来提醒重试预算应跨层设计，不是声称所有实现都会产生这个精确次数。设置总截止时间、可重试错误类型、指数退避和抖动，并区分“未发送”“可能已执行”和“明确失败”。未知结果的写操作优先查询状态或使用稳定操作编号。

容量与超时也互相影响：把等待时间从三秒提高到三十秒，若吞吐不变且请求一直占资源，平均在途数量可能增长一个数量级。提高超时也许减少表面超时，却同时拖垮连接池。应先确认慢在哪里、是否需要异步任务和状态查询，再调整时间预算。响应恢复后观察队列是否排空，不只看新请求是否成功。

### 独立事故推演：只在远端大文件下载时失败

给你四条课堂证据：本机健康请求成功，远端小请求成功，远端大响应重传明显增加，同一时间应用日志没有处理异常。第一轮假设应包含路径尺寸限制、丢包与代理响应限制，而不是把数据库慢排第一。下一步比较失败尺寸边界、路径是否经过新隧道、代理限制和双方网络证据；仍不能凭四条信息确定唯一根因。

如果隔离测试证明新隧道的有效 MTU 与配置不符，在授权变更窗口修正这一处并验证大、小请求及其他区域，不同时修改重试、证书和线程数量。若假设被否定，恢复测试参数并继续检查代理与接收端。学习证据应该包含被排除的假设和原因，体现你如何缩小问题，而不是事后只写一句“网络问题已解决”。

### 观察点本身也要标明位置

最后别漏掉探针的位置。浏览器、网关节点、应用容器和监控服务器看到的 DNS、路由、代理及证书信任库可能不同。一次本机检查成功，只能作为该观察点的证据；跨区域故障需要选择受影响区域的代表性探针。把探针位置、目标名、实际对端地址、时间和超时设置写进记录，避免把不同条件的结果直接相减。探针自身失联时，应区分“目标失败”和“没有拿到观测”，缺数据不能自动填成成功或零延迟。

## 学习证据

完成本篇后，建议留下这些证据：

- 一份“访问某 URL 的 DNS、路由、TCP、TLS、HTTP 分段记录”。
- 一张自己画的请求链路图。
- 一份 `curl -w` timing 输出解释。
- 一份 502 或 504 的模拟排障笔记。
- 一个网络探测脚本，能输出 DNS 结果、HTTP 状态码和耗时分解。
