# Ajax 技术栈深讲

> 学习目标：从零理解页面怎样在不整页刷新的情况下与服务器交换数据；能使用 Fetch、AbortController、HTTP 状态、Header 和 JSON；能处理同源/CORS、Cookie/Token、缓存、超时、重试、幂等和竞态；能搭建一个本地事件 API 实验并完成超时与错误注入。

## 官方资料

- [WHATWG Fetch Standard](https://fetch.spec.whatwg.org/)
- [MDN：Fetch API](https://developer.mozilla.org/docs/Web/API/Fetch_API)
- [MDN：使用 Fetch](https://developer.mozilla.org/docs/Web/API/Fetch_API/Using_Fetch)
- [MDN：XMLHttpRequest](https://developer.mozilla.org/docs/Web/API/XMLHttpRequest)
- [MDN：CORS](https://developer.mozilla.org/docs/Web/HTTP/Guides/CORS)
- [MDN：AbortController](https://developer.mozilla.org/docs/Web/API/AbortController)
- [IETF：HTTP Semantics RFC 9110](https://www.rfc-editor.org/rfc/rfc9110)
- [IETF：Problem Details RFC 9457](https://www.rfc-editor.org/rfc/rfc9457)

Ajax 是 Asynchronous JavaScript and XML 的历史名称。现代应用更常交换 JSON，并使用 Promise 风格的 Fetch；XMLHttpRequest（XHR）仍存在于旧代码和部分进度场景。Ajax 不是一个可安装框架，也不是某种后端协议。

## 官方知识地图与边界

```text
user event / page lifecycle（用户事件与页面生命周期）
  -> JavaScript builds Request（构造请求）
  -> browser security and cache rules（浏览器安全与缓存规则）
  -> DNS（域名解析）/ TCP or QUIC（传输连接）/ TLS（加密）/ HTTP（请求响应）
  -> gateway（网关）/ authentication（认证）/ service（业务服务）/ database（数据库）
  -> HTTP Response（响应）
  -> parse stream/body（解析响应流或正文）
  -> validate payload（校验数据结构）
  -> update application state and DOM（更新应用状态和文档节点）
```

本文重点是浏览器 Fetch 主线。REST 资源设计见 [RESTful API](../foundation/restful-api.md)，JavaScript 事件循环见 [JavaScript](./javascript.md)，后端实现见 [FastAPI](../data-ai/fastapi.md)。

## 学习顺序

```text
HTTP 请求响应 -> Fetch 基础 -> 状态和内容类型
  -> 取消/超时/竞态 -> CORS/认证 -> 缓存/幂等
  -> 两级实验 -> 观测、容量、发布和事故
```

## 场景开场

搜索框输入事件号后页面一直转圈。后端日志说请求成功，浏览器却报 CORS；另一次接口返回 500，但前端仍进入“成功”分支；用户再点一次确认，后端产生重复操作。

Ajax 排障不能只问“接口通不通”。浏览器安全策略、HTTP 语义、请求生命周期和业务幂等必须一起看。

## 一句话人话版

Ajax 是页面用 JavaScript 在后台发 HTTP 请求、接收响应并局部更新界面的模式，不需要每次都重新下载整页 HTML。

## 小白先问

### Fetch 就等于 Ajax 吗

Fetch 是实现 Ajax 的现代 Web API 之一；XHR、框架客户端或服务器推送也可参与动态数据交换。Ajax 是模式，Fetch 是接口。

### 为什么 404/500 没进入 `catch`

Fetch 在收到合法 HTTP 响应时通常会兑现 Promise，即使状态是 404 或 500；你必须检查 `response.ok` 或 `response.status`。网络层失败、CORS 阻止和取消等才通常拒绝 Promise。

### CORS 是后端报错吗

CORS（Cross-Origin Resource Sharing，跨源资源共享）是浏览器执行的跨源读取规则。服务器用响应头声明允许哪些源、方法、Header 和凭据；命令行客户端不执行同样的浏览器限制。

### 取消请求会回滚服务端操作吗

不会保证。AbortController 通知客户端和支持信号的 API 停止等待/处理；服务端可能已经完成写入。写操作要用幂等和结果查询设计应对“客户端不知道结果”。

## Request、Response 与 Body

```js
const response = await fetch('/api/incidents?status=open', {
  method: 'GET',
  headers: {
    Accept: 'application/json',
    'X-Request-ID': crypto.randomUUID()
  },
  cache: 'no-store'
})

if (!response.ok) throw new Error(`HTTP ${response.status}`)
if (!response.headers.get('content-type')?.includes('application/json')) {
  throw new TypeError('expected JSON response')
}
const payload = await response.json()
```

### Fetch 五件套

- **是什么**：基于 Promise 的 Request/Response/Headers 和网络获取 API。
- **为什么需要**：统一页面对 HTTP 与流式响应的访问。
- **怎么工作**：浏览器先应用 URL、模式、凭据、缓存、重定向和 CORS 规则，再执行网络获取；Body 通常是一次消费的流。
- **怎么看/怎么用**：Network 面板看 Request Headers、响应状态、Timing、Initiator 和 Preview/Response。
- **坏了怎么查**：先区分请求没发、预检失败、网络失败、HTTP 错误、内容解析错误和业务契约错误。

读取过一次 `response.json()` 后，不能再次随意读取同一 Body；需要多读时在合适场景 clone，但大响应复制有内存成本。

## HTTP 状态与错误模型

| 范围/状态 | 人话含义 | 前端动作 | 常见误区 |
|---|---|---|---|
| 2xx | 请求被成功处理 | 校验内容和业务状态 | 200 里塞失败字符串 |
| 304 | 协商缓存仍有效 | 浏览器使用缓存表示 | 当作返回空数据 |
| 400 | 请求格式/参数错误 | 显示字段问题，不盲重试 | 当服务端故障告警 |
| 401 | 缺少/失效认证 | 走受控重新认证 | 无限刷新 Token 循环 |
| 403 | 身份已知但无权限 | 清楚显示权限边界 | 与 401 混为一谈 |
| 404 | 资源不存在或按策略隐藏 | 显示不存在/已删除 | 自动重试 |
| 409 | 当前状态冲突 | 刷新状态或合并 | 当普通网络错误 |
| 429 | 速率限制 | 尊重 Retry-After/退避 | 所有客户端同时立即重试 |
| 5xx | 服务端/网关失败 | 有限重试安全操作、显示追踪号 | 写请求无幂等地重试 |

可用 RFC 9457 Problem Details 返回机器可读错误类型、标题、状态、细节和实例标识；前端根据稳定错误码/类型处理，不解析自然语言句子。

## JSON 序列化和契约

```js
const response = await fetch('/api/acknowledgements', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/problem+json, application/json',
    'Idempotency-Key': actionId
  },
  body: JSON.stringify({ incidentId, reason })
})
```

`Content-Type` 说明发送内容是什么，`Accept` 表示希望接收什么。JSON 没有日期、BigInt 和二进制原生类型；时间应有明确格式/时区，64 位 ID 不要未经契约就当 JavaScript number，附件通常用 multipart 或专门上传流程。

浏览器拿到 JSON 后仍需运行时校验；TypeScript 类型断言不会检查网络字节。

## 超时、取消与搜索竞态

```js
let activeController

async function searchIncidents(query) {
  activeController?.abort('newer-query')
  const controller = new AbortController()
  activeController = controller
  const timer = setTimeout(() => controller.abort('timeout'), 5000)

  try {
    const url = new URL('/api/incidents', location.origin)
    url.searchParams.set('q', query)
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    if (controller !== activeController) return
    render(validateIncidents(data))
  } catch (error) {
    if (controller !== activeController) return // 旧请求连错误提示也不再有权覆盖当前界面
    if (controller.signal.aborted) {
      if (controller.signal.reason === 'timeout') showError(new Error('查询超时，请重试'))
      return
    }
    showError(error)
  } finally {
    clearTimeout(timer)
  }
}
```

防抖控制“多久发”，取消控制“旧请求还要不要”，结果资格检查控制“旧结果能否改当前状态”。三个问题不同。

## 同源策略、CORS 与凭据

origin（源）由 scheme、host、port 组成。`https://app.example.com` 与 `https://api.example.com` 是不同源。

跨源非简单请求通常先发送 OPTIONS preflight（预检），询问服务器是否允许目标源、方法和 Header。凭据请求不能使用任意源通配符；服务端应返回明确允许源并处理缓存的 `Vary: Origin`，否则共享缓存可能串策略。

```text
browser Origin header（浏览器声明请求来源）
  -> OPTIONS preflight（跨源预检）
  <- Access-Control-Allow-Origin / Methods / Headers / Credentials（允许的来源、方法、请求头与凭据）
  -> actual request with allowed credentials policy（按允许的凭据策略发送实际请求）
  <- response（响应）
  -> browser decides whether script may read it（浏览器决定脚本能否读取响应）
```

常见误区：

- 用关闭浏览器安全选项作为修复。
- 服务端返回两个 `Access-Control-Allow-Origin`。
- 前端设置本应由浏览器控制的响应头。
- Cookie 跨站时只改 CORS，不检查 SameSite、Secure、域、CSRF 和第三方 Cookie 政策。
- 把 CORS 当身份认证；允许读取不等于获得业务权限。

## 认证、CSRF 和秘密边界

Cookie 可由浏览器自动携带，需要防 CSRF（跨站请求伪造）；Bearer Token 暴露给 JavaScript 时要高度防 XSS。具体方案取决于架构和威胁模型。

永远不把服务端 API key 烘焙进前端包。前端发送的 tenant ID、role、price、approval 等字段都不可信；服务端根据可信身份重新计算权限和业务约束。

## 缓存、新鲜度与一致性

HTTP 缓存关注响应复用；业务数据新鲜度还要定义允许多旧、如何失效、是否读己之写。

- 静态哈希资源可长期 immutable；入口 HTML 通常短缓存/协商缓存。
- 私有用户数据使用正确 `Cache-Control: private/no-store`，避免共享缓存串租户。
- ETag/If-None-Match 可做协商缓存，也可配合 If-Match 做乐观并发控制。
- POST 成功后不要只改本地数字；根据契约更新缓存、重新查询或使用服务端返回的权威状态。
- Service Worker、浏览器、CDN、网关和应用缓存要画成多层，不要只说“清缓存”。

## 重试、幂等和退避

GET 通常更适合有限重试；写请求只有服务端支持稳定幂等键并能查询结果时才安全。指数退避要带随机抖动、最大次数和总时间预算，尊重 `Retry-After`。用户主动取消、400/401/403/404 通常不应自动重试。

超时是一种未知结果：请求可能没到，也可能已执行但响应丢失。生产客户端应先查幂等键对应结果，而不是生成新键再写一次。

## 流式、轮询与实时方案取舍

| 方案 | 适合 | 代价/边界 |
|---|---|---|
| 定时轮询 | 低频、实现简单 | 空请求、延迟、页面后台策略 |
| 长轮询 | 服务端等待事件 | 连接管理和重连复杂 |
| Server-Sent Events | 服务端到浏览器单向文本事件 | 单向、代理缓冲、重连续传 |
| WebSocket | 双向低延迟 | 心跳、背压、认证续期、连接容量 |
| Fetch stream | 流式响应/增量结果 | 解析、取消、代理和浏览器支持 |

不是“实时就一定 WebSocket”。先定义事件频率、方向、允许延迟、断线恢复、代理和容量。

## 可观测性与容量

一次前端请求至少能关联：release、route、operation、HTTP status、duration、retry count、cancel reason、trace ID。避免高基数或敏感标签。

看四段延迟：排队/阻塞、DNS/连接/TLS、服务器等待（TTFB）、内容下载/解析。前端超时预算必须大于内部合理链路预算，但不能无限；网关和下游应逐层留出收尾时间。

搜索等高频接口要限制输入频率、分页、并发和响应大小；批量页面用并发上限和部分失败呈现，不能 `Promise.all` 无上限打爆服务。

## 进阶层一：一次 Fetch 的完整网络路径

把“调用接口”展开，真实路径可能是：

```text
用户操作
  -> JavaScript 构造 Request
  -> 浏览器安全策略与缓存判断
  -> Service Worker（若注册且命中范围）
  -> DNS（域名解析）
  -> TCP + TLS / QUIC（传输连接加安全握手，或基于 QUIC 的安全传输）
  -> 企业代理 / CDN / WAF / 负载均衡 / API 网关
  -> 应用服务
  -> 数据库、缓存、消息等下游
  -> Response 返回并经过同样链路
  -> 浏览器 CORS 检查、解压、流读取
  -> JSON/文本解析与运行时契约验证
  -> 状态提交与渲染
```

因此 `TypeError: Failed to fetch` 不是“后端 500”的同义词。它可能是 DNS、TLS、代理、CORS、客户端取消、离线或连接中断，而且由于安全原因，JavaScript 未必能看到更细原因。Network、浏览器安全错误、网关日志和 trace 必须联合判断。

### Request 与 Response 都有流和一次消费边界

Body 通常由 ReadableStream 表示。调用 `response.json()` 会读取并消费 body；再次读取会失败。需要在多个消费者之间共享时，可以在合适大小下 `clone()`，但克隆并不消除内存和背压成本。

大响应不应先全部转文本再多次解析。使用流式处理时要设计：字符解码、消息边界、部分消息、取消、最大长度、解析错误和 UI 增量更新频率。

### HTTP 状态与业务状态分开

```text
传输是否完成
  -> HTTP status 是否符合契约
  -> Content-Type 是否正确
  -> body 是否可解析
  -> schema 是否有效
  -> 业务结果是否成功
```

200 响应可能携带错误结构；404 可能是预期“资源不存在”；202 表示已受理但后台仍处理；204 没有 body，不应无条件 `json()`；429 应结合 `Retry-After` 和总预算。前端错误模型要保留这些层次。

## 进阶层二：HTTP 方法、安全性与幂等性

HTTP 语义中的 safe 表示只读意图，idempotent 表示重复同一请求的预期效果与一次相同。它们不是“请求绝不会有任何副作用”的绝对保证。

| 方法 | 常见语义 | 默认是否幂等 | 前端设计重点 |
|---|---|---|---|
| GET | 获取资源 | 是 | 缓存、分页、新鲜度、不要写业务状态 |
| HEAD | 只取响应头 | 是 | 服务端实现需与 GET 元数据一致 |
| POST | 创建/触发处理 | 否 | 幂等键、未知结果、重复提交 |
| PUT | 用完整表示替换资源 | 是 | 版本条件、避免覆盖并发修改 |
| PATCH | 部分修改 | 取决于补丁语义 | 明确冲突与重放语义 |
| DELETE | 删除目标状态 | 是（语义上） | 软删、重复返回、审计、恢复 |

`PUT` 幂等不代表并发安全。两个客户端都基于旧版本 PUT，后到者仍可能覆盖先到者。使用 ETag/If-Match、资源 version 或业务事务实现乐观并发控制。

### 幂等键生命周期

写操作的幂等键应由客户端为一次业务意图生成并在重试中复用；服务端保存键、请求摘要、状态和结果，拒绝同键不同参数。

```text
客户端生成 operation-id
  -> POST + Idempotency-Key（创建请求携带幂等键）
  -> 服务端原子登记 processing
  -> 执行业务
  -> 保存 success/failure + response
  -> 重试同键返回同一结果或处理状态
```

要定义保存期限、跨租户隔离、并发同键、处理中查询和失败是否允许重放。按钮 disabled 不能替代服务端实现。

## 进阶层三：CORS 预检逐步拆解

同源由 scheme、host、port 三元组决定。不同路径仍同源；不同子域、协议或端口通常不同源。

跨源请求可能先发 OPTIONS 预检：

```text
浏览器
  -> OPTIONS /incidents（对事件接口发起预检）
     Origin: https://console.example（声明控制台来源）
     Access-Control-Request-Method: PATCH（预检声明后续使用局部更新方法）
     Access-Control-Request-Headers: authorization, content-type（声明后续认证头与内容类型头）
  <- Access-Control-Allow-Origin（服务端允许的来源）
     Access-Control-Allow-Methods（服务端允许的方法）
     Access-Control-Allow-Headers（服务端允许的请求头）
     Access-Control-Allow-Credentials（需要时）
  -> 实际 PATCH
```

服务端收到实际请求不等于浏览器允许脚本读取响应。CORS 是浏览器读取保护，不是服务端认证或网络防火墙。

高频故障：

- OPTIONS 被认证中间件要求登录，导致预检先 401。
- 只给实际响应加允许头，错误响应或预检缺头。
- 携带 credentials 时使用通配 `*` origin。
- 反射任意 Origin 且允许 credentials，放大跨站风险。
- CDN 未把 Origin 纳入缓存键，错误复用允许头。

修复应使用精确允许列表、完整方法/Header、正确 `Vary: Origin`，并在成功与失败状态上统一验证。

## 进阶层四：Cookie、SameSite、CSRF 与 Token

Cookie 的关键属性共同决定发送边界：

| 属性 | 作用 | 常见坑 |
|---|---|---|
| `HttpOnly` | JavaScript 不能读取 | 不代表 XSS 无法借浏览器发请求 |
| `Secure` | 只经安全连接发送 | 本地/代理 TLS 终止配置误判 |
| `SameSite` | 限制跨站上下文携带 | same-site 与 same-origin 混淆 |
| `Domain` | 决定可发送到哪些主机 | 设置过宽扩大信任边界 |
| `Path` | 限制 URL 路径匹配 | 不是安全隔离机制 |
| `Max-Age/Expires` | 生命周期 | 会话吊销与浏览器保存不一致 |

CSRF 防护可以组合 SameSite、CSRF token、Origin/Referer 校验和重新认证；具体取决于浏览器支持与架构。Bearer token 免受传统 Cookie 自动携带式 CSRF 的一部分风险，但若暴露给 JavaScript，则 XSS 可直接窃取或使用它。

不要给出“LocalStorage 一定危险、Cookie 一定安全”这种绝对答案。先画威胁模型：攻击者能执行脚本吗、能跨站诱导吗、是否需要跨子域、会话如何吊销、敏感操作是否二次确认。

## 进阶层五：缓存、验证器与多层一致性

一次 GET 可能经过 Service Worker、内存缓存、磁盘缓存、企业代理、CDN、网关和应用缓存。每层都有键、TTL 和失效机制。

### Cache-Control 关键指令

| 指令 | 人话含义 | 典型场景 |
|---|---|---|
| `max-age=N` | N 秒内可视为新鲜 | 公共静态或可缓存 API |
| `s-maxage=N` | 共享缓存的新鲜期 | CDN 与浏览器策略分离 |
| `no-cache` | 可存，但复用前必须验证 | 入口 HTML/需协商资源 |
| `no-store` | 不应存储 | 高敏或一次性响应 |
| `private` | 只能私有缓存 | 用户个性化数据 |
| `immutable` | 新鲜期内内容不会变化 | 内容哈希静态资源 |

`no-cache` 不是“不缓存”。协商验证器 `ETag`/`If-None-Match` 或 `Last-Modified`/`If-Modified-Since` 可得到 304，无需重复传输完整 body。

业务一致性还要问：确认事件后列表何时更新？缓存 key 是否含 tenant/filter/page？失败回滚如何处理？离线数据是否允许展示、怎样标记时间？HTTP 缓存不能自动回答这些问题。

## 进阶层六：超时预算、重试放大与背压

前端 5 秒超时不是下游每层都能各用 5 秒。一个合理预算需要从用户体验反推并逐层留出取消、日志和错误返回时间：

```text
用户预算 5s
  -> 浏览器与网络 0.8s
  -> 网关预算 4.0s
  -> 服务预算 3.2s
  -> 数据库/下游更短
  -> 预留错误包装和返回
```

如果浏览器、网关、服务都各自重试 3 次，最坏请求数会乘法放大。通常选择最了解幂等性和剩余预算的一层有限重试，并在全链路记录 attempt。

指数退避示例：

```text
delay = min(cap, base * 2^attempt) + random_jitter
```

还要设置总 deadline、最大尝试、可重试状态和并发上限。收到 429/503 时尊重服务端节流信号；页面隐藏或用户取消时停止无意义重试。

背压意味着消费者处理不过来时，上游不能无限推送。SSE/WebSocket/streaming UI 要限制队列、批量刷新、丢弃/合并低价值事件或请求重新同步，否则浏览器内存会持续增长。

## 进阶层七：实时方案的断线恢复

### SSE

Server-Sent Events 适合服务端到浏览器单向文本事件。生产需要：事件 ID、`Last-Event-ID` 恢复、心跳、代理禁缓冲、认证过期和全量重同步。

### WebSocket

WebSocket 建立双向长连接后，应用自己定义消息、心跳、确认、重连和版本。连接“open”不代表订阅成功；重连后要重新认证/订阅，并处理断线期间缺失事件。

### 轮询

轮询并不低级。低频事件、严格 HTTP 基础设施或简单一致性要求下，带 ETag、退避、页面可见性判断和游标的轮询更可靠。选型依据是方向、频率、允许延迟、恢复语义和容量。

## 进阶层八：前后端可观测关联

前端记录的不是“接口失败”四个字，而是一组可关联证据：

```json
{
  "operation": "incident.search",
  "route": "/incidents",
  "release": "web-20260831.1",
  "status": 503,
  "duration_ms": 1820,
  "attempt": 2,
  "outcome": "server_error",
  "trace_id": "synthetic-demo-id"
}
```

不要记录 Authorization、Cookie、完整查询词、真实事件内容和个人信息。traceparent 等追踪头是否允许跨域，要在 CORS allow headers 和后端采样策略中设计。

RUM（Real User Monitoring，真实用户监控）能看到用户侧网络和浏览器差异；服务端 trace 能看到网关与下游。两者通过 trace/request ID、release、route 和时间窗口关联，不能用用户 IP 猜同一请求。

## 进阶故障实验：预检、缓存、重试与未知结果

### 故障一：OPTIONS 被鉴权拦截

1. 本地 API 对所有方法都要求 Authorization，前端跨端口发送 PATCH。
2. 记录 OPTIONS 401 和实际 PATCH 未发送。
3. 修复预检处理并精确返回允许 Origin/Method/Header。
4. 同时验证允许与不允许的 Origin，防止“修成任意跨域”。

### 故障二：缓存键漏 tenant

1. 合成两租户响应，让缓存只按 path 保存。
2. 先访问 tenant-a，再访问 tenant-b，观察错误复用。
3. 立即停用错误共享缓存并清理合成条目。
4. 修复 key/Vary/Cache-Control；加入跨租户回归用例。

### 故障三：重试风暴

1. API 固定返回 503，三个页面客户端无退避重试。
2. 记录每秒请求数和浏览器并发。
3. 加总预算、指数退避、抖动、最大次数和 Retry-After。
4. 比较前后请求数、恢复耗时和用户提示。

### 故障四：写入完成但响应超时

1. 服务端落库后延迟返回，客户端 2 秒取消等待。
2. 用户重试，记录重复动作或同键返回。
3. 实现幂等键与 GET operation status。
4. 验证超时页面显示“结果待确认”，而不是错误宣称失败。

## 常用 Fetch 配置字典

| 字段/API | 目的 | 预期 | 常见坑 |
|---|---|---|---|
| `method` | HTTP 方法 | 与服务契约一致 | GET 携带 body |
| `headers` | 元数据与内容协商 | 类型/追踪可见 | 手工设禁用或错误 Header |
| `body` | 请求实体 | JSON.stringify/FormData 等 | 忘记类型或重复消费 |
| `credentials` | Cookie/认证携带策略 | 按同源/跨源设计 | 误以为 include 绕过 CORS |
| `mode` | 请求模式 | 通常由架构自然决定 | `no-cors` 得到不可读 opaque 响应 |
| `cache` | 浏览器缓存行为提示 | 与服务缓存头协作 | `no-store` 解决所有业务一致性 |
| `redirect` | 重定向处理 | 跳转符合认证流程 | 跨源跳转丢认证/触发 CORS |
| `signal` | 取消传播 | 页面离开/过期请求停止 | 一个 controller 误取消无关操作 |

## 基础实验：本地事件 API 与页面

优先复现实仓库的 [frontend-incident-lab](https://github.com/quweisheng/zero-to-aiops/tree/main/examples/frontend-incident-lab)：`cd examples/frontend-incident-lab`、`npm ci`，两个终端分别执行 `npm run api` 与 `npm run dev`。页面可直接切换正常、空结果、HTTP 503、4 秒慢响应和非法契约，并验证 2 秒超时、主动取消和旧请求失效；`npm test` 无需手工启动 API 即可回归 7 项。

### 前置条件

需要 Node.js 18+（内置 Fetch 不是本实验重点，主要用其 HTTP server）。创建 `server.mjs`：

```js
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'

createServer(async (request, response) => {
  if (request.url === '/api/incidents') {
    response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
    response.end(JSON.stringify([{ id: 'INC-1024', status: 'investigating' }]))
    return
  }
  const html = await readFile(new URL('./index.html', import.meta.url))
  response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
  response.end(html)
}).listen(4177, '127.0.0.1', () => console.log('http://127.0.0.1:4177'))
```

`index.html` 主体：

```html
<button id="load">加载事件</button>
<pre id="output" aria-live="polite"></pre>
<script type="module">
  const output = document.querySelector('#output')
  document.querySelector('#load').addEventListener('click', async () => {
    output.textContent = '加载中…'
    try {
      const response = await fetch('/api/incidents')
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      output.textContent = JSON.stringify(await response.json(), null, 2)
    } catch (error) {
      output.textContent = `失败：${error.message}`
    }
  })
</script>
```

运行 `node server.mjs`，打开打印地址并点击按钮。预期 Network 出现 200 JSON，页面显示 INC-1024。验证响应类型、Timing、Initiator 和无整页刷新。

### 失败先看与清理

- 连接拒绝：进程是否运行、端口是否占用。
- 页面返回但 JSON 解析失败：Network 查看实际 Content-Type 与响应体。
- 双击文件而不是 HTTP 打开：回到打印的 `http://` 地址。
- 清理按 Ctrl+C 停服务；示例只监听 127.0.0.1，不暴露外网。

## 故障实验：注入 503、慢响应和过期结果

### 注入

在 API 分支加入查询参数：`?mode=error` 返回 503；`?mode=slow` 延迟 8 秒。客户端设置 2 秒 AbortController 超时，并连续发 slow 与正常请求。

### 证据链

1. Network 记录 status/timing/canceled，页面区分 HTTP 503、取消与解析错误。
2. 证明 Fetch 的 503 不自动进入 catch，必须检查 `ok`。
3. 证明慢请求取消后正常请求结果不会被旧请求覆盖。
4. 服务端记录收到请求与结束时间，理解客户端取消不代表服务端工作自动撤销。

### 修复、回滚和复盘

恢复正常模式；保留超时、取消和结果资格检查。503 只对安全读取做有限退避，写操作不在本实验重试。Ctrl+C 清理服务。复盘记录每层证据、超时预算和用户可见状态。

## AIOps 场景

- 事件搜索使用取消、分页和数据新鲜度，避免旧结果污染处置判断。
- 并发读取指标、日志和 Trace 时显示各数据源状态，不把部分失败伪装为完整证据。
- 自动化执行 API 使用审批票据、幂等键、状态查询和审计，不依赖按钮禁用。
- 前端请求指标与后端 Trace 通过标准 trace headers/服务端响应 ID 关联，跨域暴露 Header 需明确配置。
- 网络异常检测要区分用户网络、浏览器阻止、CDN/网关、服务、数据库和契约解析。

## 生产设计题：多租户事件 API 客户端

答案应说明：身份通过安全会话获取，tenant 不信任客户端；列表分页/过滤与最大响应；缓存 private/no-store 和 tenant/权限键；读取的超时/取消/有限重试；写入的幂等键、结果查询和审批；CORS 明确允许源与凭据；错误采用稳定类型和 trace ID；指标控制基数；灰度按 release 观察错误/P95/取消率；入口和 API 契约可独立兼容回滚。

## 事故题：跨域修复后数据串租户

1. 立即停止有风险缓存/接口，保存响应头、CDN cache key、Origin、身份和审计证据。
2. 检查服务端是否只依赖请求里的 tenant，缓存键是否缺少身份/授权语义，是否错误使用通配 CORS/共享缓存。
3. 吊销暴露会话、定向清缓存并评估通知/合规流程。
4. 修复为服务端身份派生租户、私有缓存或正确 Vary/键设计，加入跨租户负向测试。
5. 从干净会话验证，不用真实敏感数据做故障注入；准备回滚与审计报告。

## 高频排障

| 现象 | 先看 | 常见原因 | 修复方向 |
|---|---|---|---|
| `Failed to fetch` | Console + Network | DNS/TLS/CORS/取消/离线 | 分层定位，不猜 500 |
| 500 进入 then | response.status/ok | Fetch 语义 | 显式状态检查 |
| OPTIONS 失败 | 预检请求响应头 | 方法/Header/Origin 未允许 | 服务端精确 CORS |
| Cookie 不带 | credentials/Cookie 属性 | SameSite/Secure/域/策略 | 按架构修会话与 CSRF |
| JSON 解析失败 | Content-Type/原始体 | HTML 错误页、空 204、代理 | 先验证类型和状态 |
| 旧数据闪回 | 请求时间线/状态版本 | 竞态 | 取消 + 资格检查 |
| 重复写 | 幂等键/审计/唯一约束 | 双击、超时重试 | 服务端幂等和结果查询 |
| 请求风暴 | QPS/重试/429 | 无防抖、无上限、同步重试 | 预算、抖动、限流/分页 |

## 面试表达

### 30 秒回答

Ajax 是页面通过 JavaScript 异步发 HTTP 请求并局部更新界面的模式，现代浏览器通常用 Fetch。生产实现必须显式检查 HTTP 状态和内容类型，处理超时、取消、竞态、CORS、认证、缓存和运行时校验；写请求还要由服务端幂等、授权和审计兜底。

### 3 分钟回答主线

画出用户事件、Fetch、浏览器策略、网络、网关、服务、响应解析和状态更新；解释 Fetch 对 HTTP 错误的语义；用预检讲同源/CORS；用搜索讲取消和竞态；用确认动作讲未知结果和幂等；最后讲缓存层、新鲜度、容量、trace 关联、灰度和契约回滚。

### 连续追问

1. **Fetch 与 XHR 区别？** Fetch 基于 Promise/流式模型更易组合，XHR 是旧事件式 API且部分进度场景仍使用。
2. **为什么 no-cors 不能修 CORS？** 它通常产生脚本不可读的 opaque 响应，不赋予跨源读取权限。
3. **取消能否回滚写入？** 不能保证，服务端幂等和状态查询必须设计。
4. **什么时候重试？** 只对被判断为暂态且操作安全/幂等的失败，在总预算内带退避和抖动重试。
5. **怎样定位慢？** 用 Resource Timing/Network 分解排队、连接、TTFB、下载，再用 trace 进入服务端链路。

## 学习检查清单

- [ ] 能解释 Ajax、Fetch、XHR、HTTP 与 JSON 的边界。
- [ ] 能检查 response.ok、状态和内容类型。
- [ ] 能实现超时、取消、竞态保护和部分失败。
- [ ] 能画同源、预检、凭据和 CSRF 边界。
- [ ] 能说明缓存、新鲜度、ETag 和幂等。
- [ ] 能通过 Network 与 trace ID 分层排障。
- [ ] 能完成本地基础/故障实验并清理。
- [ ] 能设计多租户、容量、灰度和回滚。

## 老师带你从浏览器看到服务端：成功要分几层

假设页面要查询“订单服务最近十分钟的严重告警”。我们先不写 fetch，先把合同写清：URL 是什么，允许哪些筛选，谁有权查看，响应是列表还是分页对象，没结果与查询失败怎样区分，最多等多久。接口调用只有建立在这份合同上，才能解释什么叫成功。

学生问：“后端日志写 200，页面为什么还是失败？”200 可能只说明某层返回了 HTTP 响应。它可能是登录页 HTML，可能 JSON 结构变化，也可能浏览器因为 CORS 不允许脚本读取。老师让你按网络响应、内容类型、解析、结构校验、业务结果、界面更新六层逐个确认。

### 一个无需服务端的 Fetch 语义实验

在现代浏览器任意本地测试页的控制台运行下面代码。`Response` 是浏览器提供的响应对象；这里只在内存中构造它，不向网站发送请求。

```js
async function inspectResponse(status, body) {
  const response = new Response(body, {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
  console.log('状态:', response.status, 'ok:', response.ok)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

await inspectResponse(200, '{"count":2}') // 正常得到对象
await inspectResponse(503, '{"error":"busy"}').catch((e) => console.log(e.message))
await inspectResponse(200, '<html>登录页</html>').catch((e) => console.log(e.name))
```

依次观察正常对象、`HTTP 503`、JSON 解析错误。第二次是故意注入的 HTTP 故障，第三次是状态成功但正文不符合约定。清理无需删除服务，关闭测试页即可。若运行环境不认识 Response，请用现代浏览器而不是旧 Node 环境。这个实验只验证响应处理逻辑；真正的 DNS、TLS、CORS 还需要本文本地 API 和 Network 实验。

### CORS 到底在保护哪一步

把同源策略理解成浏览器对网页脚本的读取边界：一个网页不能因为用户打开它，就任意读另一个源的私有数据。服务器可以通过 CORS 响应头授予某些读取能力，但用户身份和业务权限仍须单独检查。详情见[Fetch CORS 协议](https://fetch.spec.whatwg.org/#http-cors-protocol)。

预检失败时，真正业务请求可能根本没有发出；简单请求则可能已经发出，但脚本无权读响应。两种情况的服务端日志不同，所以“浏览器报跨域”不能直接推导“服务端没收到”。先看 OPTIONS 与实际请求是否都存在，再看每个响应头。

开发代理把浏览器请求统一送到同源入口，可简化本地联调，却不能证明生产跨源策略正确。生产域名、HTTPS、Cookie 属性和网关都不同，必须在目标拓扑上验证。`no-cors` 得到不透明响应时，你读不到 JSON，它不能用于绕过这条安全边界。

### 超时以后，该显示失败还是待确认

读取查询超时，可以告诉用户结果暂不可用并允许有限重试；写入确认超时，可能已经成功，所以更准确的状态是“结果待确认”。服务端保存操作 ID，客户端查询它的进度与结果；重复请求复用同一业务幂等键，而非每次生成新键。

两秒超时也要清理 loading 状态。把所有 `signal.aborted` 都直接 return，可能让真正超时的用户一直看到转圈。区分被新查询替代、用户主动取消、页面卸载与超时，分别定义界面和观测语义；旧请求既不能覆盖数据，也不能覆盖错误提示。

### 新鲜度与一致性，别用“刷新一下”代替设计

确认事件成功后，你希望列表立即显示已确认，这是 read-your-writes（读到自己刚写入的结果）需求。可以使用写响应中的权威对象更新缓存，或等待状态查询收敛。若列表来自延迟副本，马上重新 GET 仍可能读到旧数据，单纯刷新并不保证满足要求。

给用户显示数据更新时间和部分失败源，能帮助其判断证据是否足够新。缓存键必须包含会影响结果的筛选、租户和权限语义；退出登录时还要处理旧身份缓存。可用性提高不能以跨租户泄漏为代价。

### 面试推导：从一次请求扩大到万人同时使用

一人每两秒轮询一次是每秒约 0.5 次请求，一万人就是约 5000 次请求，还没算重试和多标签页。后台暂停、退避、ETag、游标和按需订阅都可能降低负载。选择 SSE 或 WebSocket 时还要管理长连接、恢复位点和背压，不能只说“换实时协议就更省”。

面试官问“请求慢”时，先划分浏览器排队、连接、服务等待、下载、解析和渲染；问“重复写”时，先讲未知结果和幂等记录；问“跨域失败”时，先区分预检与实际响应。三条证据路线讲清楚，再谈框架封装，才不会把问题藏进一个巨大请求拦截器。

## 进阶客户端课堂：请求结束以后，还有哪些一致性问题

### 分页不是把一个大数组随便切开

假设告警列表按最新时间排序，你正在看第一页时又进来十条告警。使用固定偏移量取第二页，可能再次看到第一页末尾的记录，也可能漏掉部分事件。Offset（偏移量）回答“跳过前多少条”，Cursor（游标）回答“从哪条排序位置继续”，两者对持续变化数据的行为不同。

老师会先问清业务目标：值班屏幕追求最新事件，审计导出追求一个确定时间点的完整集合。前者可以显示“有新事件，点击刷新”，后者更适合由服务端提供快照或固定查询窗口。游标通常应作为不透明字符串传回服务端，客户端不要自行解码修改；筛选条件、租户和排序改变后，旧游标也不应继续沿用。

去重只能解决一部分问题。把相同事件 ID 去掉可减少重复显示，却无法补回因分页变化漏掉的记录，也不能把同一事件的新版本误删。数据合并应同时考虑对象 ID、版本或更新时间，以及排序规则。AIOps 页面若把重复项减少误当成事件量下降，就可能给异常检测输入错误数据。

### 乐观更新不是先显示成功然后忘记服务器

用户确认告警后，界面可以先标记为“提交中”，甚至暂时显示预期状态以减少等待，但必须保留旧值和请求标识。成功响应到来后以服务端确认版本收敛；明确失败时恢复或提示重试；超时且结果未知时显示待确认并查询任务状态。不要把三种情况都变成“操作失败，再点一次”。

两个操作同时发生时，回滚也可能出错。第一次把级别从高改为严重，第二次又改为警告；若第一次稍后失败，无条件恢复最初的“高”会覆盖第二次已成功的“警告”。回滚动作应检查它仍对应当前待确认版本，或重新读取权威状态。这个问题与请求竞态相似，但涉及写入副作用，不能只靠取消旧 Fetch 解决。

对于批量确认，服务端可能逐项成功与失败。客户端应保留每项结果，允许只重试失败或未知的项，并用稳定幂等键约束重复执行。一个总状态为 200 的批处理响应，不意味着所有目标都成功；一个网关 504 也不证明所有目标都失败。面试时要讲清总请求状态与各业务项状态的关系。

### 流式返回时，一个网络块不等于一条完整消息

浏览器读到的字节分块由传输与缓冲决定，可能在一个汉字、一个 JSON 对象甚至一行中间断开。你不能把每个 `reader.read()` 返回值直接当成独立 JSON。正确的思路是分层：先连续解码字节，再按协议边界拼消息，最后做结构与业务校验；同时给未完成消息缓冲设置大小上限。

下面在自己的本地实验页控制台执行，不需要网络也不会修改页面，用两段字节证明这一点：

```javascript
{
  const bytes = new TextEncoder().encode('告警已恢复')
  const first = bytes.slice(0, 2) // 故意切在第一个汉字内部
  const rest = bytes.slice(2)
  const broken = new TextDecoder().decode(first) + new TextDecoder().decode(rest)
  const decoder = new TextDecoder()
  const correct = decoder.decode(first, { stream: true }) +
    decoder.decode(rest, { stream: true }) + decoder.decode()
  console.assert(broken !== '告警已恢复', '错误方法应破坏字符')
  console.assert(correct === '告警已恢复', '连续解码应恢复完整文本')
  console.log({ broken, correct })
}
```

基础预期是 `correct` 完整显示中文，故障结果 `broken` 包含替代字符。验证通过后把切分位置改成 3，再改成 4，观察只有部分边界碰巧正确；这说明不能依赖本次网络分块的幸运位置。恢复为连续解码即可，清理只需关闭实验标签页，未创建服务器或文件。若两种方法都正确，检查是否真的切开了多字节字符；若 API 不存在，核对运行环境支持，不把随机替换乱码当成修复。

SSE 还需要按事件边界处理、记录恢复游标并处理重连；WebSocket 要定义消息序号、心跳和重放窗口。浏览器内存不是无限队列，生产页面应在处理速度跟不上时合并展示、限制保留数量，或者让服务端按订阅条件减少输入。不能每来一条消息就重绘全部图表。

### 页面不可见以后，请求为什么还在增加

一个页面上十个组件各自每五秒轮询，十个标签页就是持续叠加的请求负载。切换路由后若定时器未清理，离开的页面也会继续请求。老师建议记录每次请求的触发原因：初始加载、筛选变化、定时刷新、重连还是人工重试。原因不明的重复请求，比总量本身更难修复。

页面隐藏时可按业务要求降低普通看板轮询频率，但不能把浏览器定时器当成准点后台任务。恢复可见后重新检查数据时间和权限，必要时刷新；关键告警投递应由服务端可靠通道承担，不依靠某个浏览器窗口一直存活。共享请求缓存可合并同条件读请求，但缓存键必须包含用户权限相关上下文，且退出登录或切租户时清除相应状态。

最后把这些行为纳入发布验收：快速切筛选、并发确认、隐藏再恢复页面、断网再联网、切租户、分页期间新增事件。每项都观察请求数、界面版本和业务结果。能解释这些边界，才真正从“会调用接口”走到“能维护可靠的交互系统”。

## GitHub 学习证据

```text
ajax-incident-lab/
  index.html
  server.mjs
  README.md
  evidence/
    success-network.md
    503-network.md
    timeout-and-cancel.md
  postmortem/
    stale-result-and-idempotency.md
```

使用合成数据，截图/日志遮蔽 Cookie、Authorization、内部 IP 和真实租户。README 写清端口只绑定 127.0.0.1、运行命令、预期状态和 Ctrl+C 清理方法。

## 下一步

用 [Vue](./vue.md) 或 [React](./react.md) 把请求生命周期表示为组件状态；先读 [TypeScript](./typescript.md) 可减少契约漂移，但仍要保留本篇运行时校验。
