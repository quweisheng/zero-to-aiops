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
user event / page lifecycle
  -> JavaScript builds Request
  -> browser security and cache rules
  -> DNS / TCP or QUIC / TLS / HTTP
  -> gateway / authentication / service / database
  -> HTTP Response
  -> parse stream/body
  -> validate payload
  -> update application state and DOM
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
    if (controller.signal.aborted) return
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
browser Origin header
  -> OPTIONS preflight
  <- Access-Control-Allow-Origin / Methods / Headers / Credentials
  -> actual request with allowed credentials policy
  <- response
  -> browser decides whether script may read it
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
