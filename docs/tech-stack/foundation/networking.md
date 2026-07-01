# 网络基础

> 目标：理解 DNS、TCP、TLS、HTTP、端口、负载均衡的基本链路，能用常用命令定位“访问不了、超时、502、证书错误”等问题。

## 官方资料

- [MDN: Overview of HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview)
- [MDN: HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP)
- [Cloudflare: What is DNS?](https://www.cloudflare.com/learning/dns/what-is-dns/)
- [Cloudflare Learning Center](https://www.cloudflare.com/learning/)

说明：本文是基于 MDN 和 Cloudflare 学习资料整理的原创中文教程，不复制官方全文。

## 是什么

网络基础是运维和 AIOps 排障的核心地基。一次请求从浏览器到后端服务，通常会经过 DNS、TCP、TLS、HTTP、负载均衡、反向代理、应用服务、数据库或缓存。

## 请求链路

```text
Client
  -> DNS lookup
  -> TCP connection
  -> TLS handshake
  -> HTTP request
  -> Load Balancer / NGINX / Ingress
  -> Application
  -> Database / Cache / MQ
  -> HTTP response
```

## DNS

DNS 把域名解析成 IP。

常用命令：

```bash
dig example.com
nslookup example.com
```

排障关注：

- 域名是否解析。
- 解析到哪个 IP。
- TTL 多久。
- 内外网 DNS 是否不同。

## TCP

TCP 提供可靠连接。常见问题是连接不上、连接超时、连接被拒绝。

常用命令：

```bash
ss -tulnp
telnet example.com 443
nc -vz example.com 443
```

关注：

- 端口是否监听。
- 防火墙是否阻断。
- 服务是否只监听 localhost。
- 连接数是否异常。

## TLS

TLS 用来加密通信，也负责证书校验。

常见问题：

- 证书过期。
- 域名和证书不匹配。
- 中间证书缺失。
- 客户端不信任 CA。

检查：

```bash
openssl s_client -connect example.com:443 -servername example.com
```

## HTTP

HTTP 是应用层协议，客户端发送 request，服务端返回 response。

常用命令：

```bash
curl -v https://example.com
curl -I https://example.com
curl -X POST http://localhost:8080/api -H "Content-Type: application/json" -d "{}"
```

常见状态码：

- 200：成功。
- 301/302：重定向。
- 400：请求错误。
- 401/403：认证或权限问题。
- 404：资源不存在或路由不匹配。
- 500：服务端错误。
- 502：网关收到无效响应。
- 503：服务不可用。
- 504：网关等待上游超时。

## 负载均衡

负载均衡把流量分发给多个后端。

```text
Client
  -> Load Balancer
  -> backend-1
  -> backend-2
  -> backend-3
```

关注：

- 健康检查。
- 后端权重。
- 超时时间。
- 连接池。
- 会话保持。

## 在 AIOps 中的作用

- 链路追踪就是把请求路径记录下来。
- 网络故障会反映为延迟、错误率、超时、连接失败。
- AIOps 根因分析要判断是 DNS、网络、代理、应用还是依赖问题。
- NGINX/Ingress 日志能提供状态码、耗时、上游地址。

## 入门实验

1. 用 `dig` 查询一个域名。
2. 用 `curl -v` 访问一个 HTTPS 网站。
3. 记录 DNS、TCP、TLS、HTTP 状态码。
4. 用 `curl -I` 查看响应头。
5. 写一篇学习记录：一次 HTTP 请求经过哪些阶段。

## 排障清单

### 访问不了

1. DNS 是否解析。
2. IP 是否能连通。
3. 端口是否开放。
4. TLS 是否正常。
5. HTTP 状态码是什么。
6. 反向代理和后端日志是否有错误。

### 502

- 代理能否连到后端。
- 后端进程是否存在。
- 后端端口是否正确。
- upstream 是否配置错。

### 504

- 后端是否慢。
- 数据库或下游是否慢。
- 代理超时是否过短。
- 应用线程/连接池是否耗尽。

## 学习证据

- 一篇 `curl -v` 请求链路分析。
- 一张 DNS -> TCP -> TLS -> HTTP 流程图。
- 一份 502/504 排障清单。
