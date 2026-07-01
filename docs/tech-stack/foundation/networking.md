# 网络基础

> 目标：理解 DNS、TCP、TLS、HTTP、端口、负载均衡的基本链路，能用常用命令定位“访问不了、超时、502、证书错误”等问题。

## 官方资料

- [MDN: Overview of HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview)
- [MDN: HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP)
- [Cloudflare: What is DNS?](https://www.cloudflare.com/learning/dns/what-is-dns/)
- [Cloudflare Learning Center](https://www.cloudflare.com/learning/)

说明：本文是基于 MDN 和 Cloudflare 学习资料整理的原创中文教程，不复制官方全文。

## 为什么要学

很多线上故障表面看是“服务挂了”，实际可能是 DNS 解析错、端口没开、TLS 证书异常、代理连不上后端、负载均衡健康检查失败或下游超时。AIOps 要做根因分析，必须先懂一次请求经过哪些网络阶段。

网络基础能让你把“访问不了”拆成可验证的检查点，而不是只盯着应用日志。

## 是什么

网络基础是运维和 AIOps 排障的核心地基。一次请求从浏览器到后端服务，通常会经过 DNS、TCP、TLS、HTTP、负载均衡、反向代理、应用服务、数据库或缓存。

## 它解决什么问题

- 判断域名是否解析正确。
- 判断端口是否监听、网络是否连通。
- 判断 TLS 证书是否有效。
- 判断 HTTP 状态码和响应头是否符合预期。
- 判断 502、503、504 是代理、应用还是下游问题。
- 帮助链路追踪和日志分析定位请求在哪一段失败。

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

## 学习检查清单

- [ ] 我能画出 DNS -> TCP -> TLS -> HTTP 的请求链路。
- [ ] 我能用 `dig` 或 `nslookup` 检查域名解析。
- [ ] 我能用 `ss`、`nc`、`telnet` 检查端口连通性。
- [ ] 我能用 `curl -v` 看请求过程和响应头。
- [ ] 我能解释 502、503、504 的常见区别。
- [ ] 我能说出负载均衡健康检查的作用。
- [ ] 我能把网络排障步骤写成清单。
- [ ] 我能把一次请求链路分析提交到 GitHub。

## 面试题

1. 一次 HTTP 请求从客户端到服务端通常经过哪些阶段？
2. DNS 解析失败会表现成什么现象？
3. 连接超时和连接被拒绝有什么区别？
4. TLS 证书错误常见原因有哪些？
5. `curl -v` 能帮你看到哪些信息？
6. 502、503、504 分别通常指向什么问题？
7. 负载均衡健康检查为什么重要？
8. 如果只有部分用户访问失败，你会怎么排查？
9. 网络指标如何进入 AIOps 根因分析？
10. 如何把一次 502 故障写成可复用 runbook？

## 学习证据

- 一篇 `curl -v` 请求链路分析。
- 一张 DNS -> TCP -> TLS -> HTTP 流程图。
- 一份 502/504 排障清单。
