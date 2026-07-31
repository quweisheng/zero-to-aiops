# RESTful API 技术栈深讲

> 学习目标：从零理解 REST、HTTP 与 API 契约的边界；能设计资源、URI、方法、状态码、错误体、分页、缓存、并发控制、幂等、鉴权、限流和版本演进；能看懂一次请求在网关、服务、缓存与数据库之间的完整路径；能运行一个只依赖 Node.js 标准库的实验，亲手验证 `ETag`、`If-Match`、`428`、`412` 和幂等键；能在生产故障中用指标、日志和链路证据定位问题；能回答大型企业平台、SRE、DevOps 与 AIOps 岗位的连续追问。

## 版本与学习边界

本文核验日期为 **2026-07-31**，采用以下边界：

- REST 的定义以 Roy Fielding 博士论文第 5 章为根基。
- HTTP 语义以 RFC 9110 为主，缓存以 RFC 9111 为主。
- URI、JSON、PATCH、Web Linking 和 Problem Details 分别参考对应 RFC。
- OpenAPI 以 **3.2.0** 为当前最新发布规范，同时提醒企业存量项目仍常见 3.0.x 和 3.1.x。
- OAuth 2.0 安全建议参考 2025 年发布的 RFC 9700。
- API 安全风险参考 OWASP API Security Top 10 2023。
- `Idempotency-Key` 的 `-07` Internet-Draft 截至核验日已经过期，且尚未成为正式 RFC；工程中可以采用相关思路，但必须把格式、保存时长、冲突和重放语义写进自己的契约。
- 统一 `RateLimit` 响应头截至核验日仍是 IETF 工作草案；`429 Too Many Requests` 和 `Retry-After` 已有正式 RFC 依据。

本文讲的是“面向 HTTP API 的 REST 架构、契约与生产治理”，不是某一种编程语言或 Web 框架教程：

- 想用 Python 实现接口，继续学习 [FastAPI](../data-ai/fastapi.md)。
- 想理解服务拆分、注册发现、熔断和分布式事务，继续学习 [微服务](../cloud-native/microservices.md)。
- 想理解 DNS、TCP、TLS 和 HTTP 请求如何到达服务，先学习 [网络基础](./networking.md)。

REST 很大，本文不展开 HTTP/2 帧、HTTP/3 QUIC、OAuth 授权服务器实现、密码学算法和 API 网关源码；但会把从入门到生产设计与面试所需的主线讲完整。

## 官方资料

- [Fielding Dissertation Chapter 5: REST](https://ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm)
- [RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html)
- [RFC 9111: HTTP Caching](https://www.rfc-editor.org/rfc/rfc9111.html)
- [RFC 3986: URI Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986.html)
- [RFC 8259: JSON](https://www.rfc-editor.org/rfc/rfc8259.html)
- [RFC 5789: PATCH Method](https://www.rfc-editor.org/rfc/rfc5789.html)
- [RFC 6585: 428 与 429 等附加状态码](https://www.rfc-editor.org/rfc/rfc6585.html)
- [RFC 8288: Web Linking](https://www.rfc-editor.org/rfc/rfc8288.html)
- [RFC 9457: Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc9457.html)
- [RFC 8594: Sunset Header](https://www.rfc-editor.org/rfc/rfc8594.html)
- [RFC 9745: Deprecation Header](https://www.rfc-editor.org/rfc/rfc9745.html)
- [RFC 9700: OAuth 2.0 Security Best Current Practice](https://www.rfc-editor.org/rfc/rfc9700.html)
- [OpenAPI Specification 3.2.0](https://spec.openapis.org/oas/v3.2.0.html)
- [WHATWG Fetch Standard: CORS protocol](https://fetch.spec.whatwg.org/#http-cors-protocol)
- [OWASP API Security Top 10 2023](https://owasp.org/API-Security/editions/2023/en/0x11-t10/)
- [W3C Trace Context](https://www.w3.org/TR/trace-context/)
- [IETF Idempotency-Key 工作草案](https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/)
- [IETF RateLimit header fields 工作草案](https://datatracker.ietf.org/doc/draft-ietf-httpapi-ratelimit-headers/)

说明：本文依据一手规范重新组织成 AIOps 学习教程，不复制官方长段落。RFC 说明协议语义，Fielding 论文说明 REST 架构约束，OpenAPI 说明如何描述接口；三者不能互相替代。

## 官方知识地图

```text
Fielding REST
  -> Client-Server
  -> Stateless
  -> Cache
  -> Uniform Interface
       -> Resource identification
       -> Manipulation through representations
       -> Self-descriptive messages
       -> Hypermedia as the engine of application state
  -> Layered System
  -> Code-on-Demand (optional)

HTTP Semantics
  -> URI + Method + Header + Representation
  -> Safe / Idempotent / Cacheable
  -> Status Code
  -> Content Negotiation
  -> Conditional Request

API Contract
  -> OpenAPI
  -> JSON Schema
  -> Problem Details
  -> Compatibility / Deprecation / Sunset

Production Governance
  -> Authentication + Authorization
  -> Rate Limit + Quota + Backpressure
  -> Timeout + Retry + Idempotency
  -> Metrics + Logs + Traces + Audit
  -> Deployment + Rollback + Incident Response
```

第一次看到英文缩写时先这样理解：

- **REST**：Representational State Transfer，表述性状态转移，是一组分布式超媒体系统的架构约束。
- **API**：Application Programming Interface，应用程序接口，是系统对外提供能力的约定。
- **HTTP**：Hypertext Transfer Protocol，超文本传输协议，是请求与响应的应用层协议。
- **URI**：Uniform Resource Identifier，统一资源标识符，用来标识资源。
- **JSON**：JavaScript Object Notation，一种常用的数据交换格式；REST 并不限定只能用 JSON。
- **HATEOAS**：Hypermedia as the Engine of Application State，客户端通过响应中的链接发现下一步可执行动作。
- **OpenAPI**：描述 HTTP API 的机器可读规范，可用于文档、校验、代码生成与契约测试。

## 建议学习路线

```text
先懂请求与响应
  -> 再懂资源、URI、表示
  -> 再懂方法、状态码、Header
  -> 再懂缓存、条件请求、幂等
  -> 再懂错误、分页、异步任务
  -> 再懂 OpenAPI 与兼容性
  -> 再懂安全、容量、高可用
  -> 最后用可观测证据处理生产故障
```

学习时不要从“背状态码大全”开始。先追踪一笔真实业务请求，理解它要操作哪个资源、允许什么动作、成功与失败分别如何表达，再记协议语义。

## 场景开场：告警自动修复为什么执行了两次

凌晨 02:10，AIOps 平台检测到磁盘使用率超过 90%，调用自动修复 API：

```http
POST /api/v1/remediation-jobs
Content-Type: application/json

{"alertId":"a-100","action":"clear-temp"}
```

服务已经创建任务并开始清理，但响应经过网关时连接中断。调用方没有收到结果，于是自动重试。第二次请求又创建了一个任务，两个任务同时删除临时文件，最终一个任务误删了另一个任务刚生成的诊断包。

事故表面是“网络抖动”，真正的设计问题是：

- `POST` 默认不具备幂等语义，重试可能重复产生副作用。
- 调用方没有稳定的操作标识。
- 服务端没有幂等记录与相同请求校验。
- 日志里没有请求 ID、幂等键、任务 ID 的关联。
- 指标只统计成功率，没有统计重复创建和重放。
- Runbook 只写“失败就重试”，没写哪些方法可以重试、退避多久、如何确认结果。

RESTful API 学习的价值，不是把路径写得“像名词”，而是让客户端、网关、服务和运维人员对请求语义达成一致。

## 一句话人话版

RESTful API 就是：**把业务对象当成资源，用稳定 URI 标识它们，用 HTTP 方法表达动作，用状态码和响应体表达结果，并让每条消息具备足够清楚、可缓存、可重试、可观测和可演进的语义。**

## 小白最容易问的十个问题

### REST 是协议吗

不是。REST 是一种架构风格，HTTP 是协议。HTTP 很适合实现 REST，但“使用 HTTP”不等于“满足 REST 约束”。

### RESTful API 就是 JSON API 吗

不是。JSON 只是表示格式。一个资源可以有 JSON、HTML、CSV 或图片等不同表示，客户端可通过内容协商选择。

### URL 里只能放名词，不能放动词吗

“资源 URI 尽量表示对象，动作放进方法语义”是好习惯，但不是 REST 的完整定义。遇到确实是一等业务概念的命令，可以建模成任务资源，例如创建 `/remediation-jobs`，而不是假装所有动作都只是数据库 CRUD。

### 无状态是不是服务端不能保存任何数据

不是。无状态约束指每个请求携带完成该次交互所需的信息，服务端不依赖“上一次请求的隐含会话上下文”。数据库、缓存、任务状态和授权数据当然仍可存在。

### 使用 Cookie 就一定不 REST 吗

不一定。关键是服务端是否依赖不可见的会话上下文来解释请求。Cookie 只是传递信息的方式；但浏览器 Cookie 会带来 CSRF 等安全问题，需要单独治理。

### PUT 和 PATCH 有什么区别

通常把 PUT 理解为用提交的表示创建或替换目标资源，把 PATCH 理解为提交一组局部修改。PUT 具有幂等语义；PATCH 本身不保证幂等，具体补丁格式和业务操作决定重复执行的结果。

### DELETE 调两次为什么可能第一次 204、第二次 404

幂等要求重复请求的“预期效果”与执行一次相同，不要求每次响应码完全相同。资源最终都处于不存在状态，所以 DELETE 可以是幂等的。

### 200、201、202、204 怎么选

- `200 OK`：成功，并返回响应表示。
- `201 Created`：新资源已创建，通常带 `Location`。
- `202 Accepted`：只表示已接收，尚未保证任务完成。
- `204 No Content`：成功，但没有响应内容。

### 401 和 403 怎么选

- `401 Unauthorized` 实际表示缺少或无法接受认证凭据，通常应带 `WWW-Authenticate`。
- `403 Forbidden` 表示服务器理解请求，但拒绝授权。

为了避免泄露资源是否存在，某些系统会对无权查看的对象返回 `404`；这必须成为统一的安全策略，不能由接口随意决定。

### REST 和 OpenAPI 是一回事吗

不是。OpenAPI 能描述路径、方法、参数、响应和安全方案，但一份语法正确的 OpenAPI 文档仍可能描述一个语义混乱、非 REST 的 HTTP API。

## 为什么要学

在 AIOps、SRE 和平台工程中，API 是系统之间的“自动化接口”：

```text
Prometheus / Zabbix 告警
  -> Alertmanager / 事件平台
  -> AIOps 决策服务
  -> Runbook API
  -> Kubernetes / 云平台 / CMDB / ITSM
  -> 执行结果回写
  -> 指标、日志、链路和审计
```

如果 API 语义含糊，会直接造成：

- 告警风暴中重复创建工单或重复执行修复。
- 超时后不知道请求“未执行”还是“已执行但响应丢失”。
- 缓存返回过期配置，自动化对错误目标执行。
- 并发修改互相覆盖，告警确认状态被回滚。
- 客户端把所有失败都当成 `500`，无法决定重试还是人工介入。
- 没有稳定契约，服务升级后调用方批量故障。
- 缺少请求关联标识，指标、日志和链路无法拼成证据。

## REST 到底是什么

REST 是 Fielding 为 Web 架构总结的一组约束。它追求的是可扩展、松耦合、可见、可缓存和能够经过多层中间组件的分布式系统，不是“路径命名口诀”。

### REST 六项约束

| 约束 | 它是什么 | 为什么需要 | 怎么工作 | 如何观察与使用 | 坏了怎么查 |
|---|---|---|---|---|---|
| Client-Server | 客户端与服务端职责分离 | 允许两边独立演进 | 通过统一接口交互 | 看调用契约和依赖方向 | 查是否把 UI、数据库细节泄漏进公共契约 |
| Stateless | 每次请求可独立理解 | 提升可见性、扩缩容和故障切换能力 | 请求携带认证与操作上下文 | 任意健康实例都能处理请求 | 查粘性会话、实例本地状态、重试后状态丢失 |
| Cache | 响应明确是否可复用 | 降低延迟与后端负载 | 新鲜度、验证器和缓存键决定复用 | 看 `Cache-Control`、`ETag`、`Vary`、`Age` | 查错误缓存键、过期策略、认证响应泄露 |
| Uniform Interface | 所有组件理解同一套交互语义 | 降低耦合，让中间层可工作 | 资源、表示、自描述消息和超媒体 | 看 URI、方法、媒体类型、链接和条件头 | 查“所有请求都 POST”“200 包错误”等语义破坏 |
| Layered System | 客户端不必知道直接连接的是哪一层 | 支持网关、代理、缓存和负载均衡 | 每层按消息语义处理或转发 | 看 `Via`、转发头、网关日志和链路 | 分层比较客户端、网关、服务端证据 |
| Code-on-Demand | 可选地向客户端下发可执行代码 | 扩展客户端能力 | 浏览器脚本是典型例子 | Web API 常由前端脚本消费 | 安全审查脚本来源、完整性和 CSP |

### 统一接口的四个子约束

#### 资源标识

- **是什么**：URI 标识概念资源，例如一个告警、一组任务或当前用户。
- **为什么**：调用方需要稳定地引用同一业务概念。
- **怎么工作**：`/api/v1/alerts/a-100` 标识告警，不暴露它存在哪张表、哪个分片。
- **怎么用**：资源路径尽量稳定、可预测，不把数据库表名和内部主键实现直接当公共承诺。
- **坏了怎么查**：检查同一资源是否被多个不一致 URI 标识、资源移动后是否有兼容策略。

#### 通过表示操纵资源

- **是什么**：客户端发送或接收资源的某种表示，而不是远程操作服务端内存对象。
- **为什么**：隐藏实现，使客户端与存储模型解耦。
- **怎么工作**：JSON 中的告警字段是资源在某个时刻的一种表示。
- **怎么用**：用 `Content-Type` 说明发送格式，用 `Accept` 说明期望格式。
- **坏了怎么查**：检查媒体类型、字符编码、字段缺失、序列化精度和兼容性。

#### 自描述消息

- **是什么**：消息自身携带足够语义，让接收者和中间层知道如何处理。
- **为什么**：网关、缓存和客户端不应依赖口头约定猜测结果。
- **怎么工作**：方法、状态码、Header、媒体类型和正文共同描述一次交互。
- **怎么用**：不要用 `200 OK` 包裹 `{code: 500}`；代理只看 HTTP 状态会误判。
- **坏了怎么查**：对比线上的真实报文与 OpenAPI 契约，检查代理是否改写状态和 Header。

#### 超媒体驱动应用状态

- **是什么**：响应提供客户端下一步可走的链接或动作。
- **为什么**：客户端不必把所有 URI 模板硬编码。
- **怎么工作**：任务响应可返回 `self`、`cancel`、`result` 链接。
- **怎么用**：可以在正文 `_links` 或 RFC 8288 `Link` Header 中表达关系。
- **坏了怎么查**：检查链接是否受版本和权限控制、是否指向错误环境。

严格来说，忽略超媒体会削弱 REST 的统一接口约束。工程面试中可以坦诚说明：很多所谓“REST API”实际是资源导向的 HTTP JSON API，并未完整实现 HATEOAS。

## 资源、URI 与表示

### 资源不是数据库行

资源是“可被标识的概念目标”：

```text
/alerts/a-100              -> 一条告警
/alerts/a-100/timeline     -> 这条告警的时间线
/remediation-jobs/j-900    -> 一次修复任务
/me                        -> 当前认证主体对应的用户资源
/reports/daily/2026-07-31  -> 某日的报告
```

一个资源可以由数据库多表、缓存、对象存储或实时计算共同生成。API 不应承诺内部存储布局。

使用 JSON 时也要记住 RFC 8259 的互操作边界：开放系统交换使用 UTF-8，对象成员名应保持唯一；超出常见语言精确整数范围的 ID 更适合用字符串承载。字段含义、必填性和兼容规则仍由 API 契约定义。

### URI 设计原则

| 原则 | 推荐 | 避免 | 原因 |
|---|---|---|---|
| 用资源表达业务概念 | `/alerts/{id}` | `/getAlert?id=...` | 方法已经表达读取 |
| 集合与单项分开 | `/alerts`、`/alerts/a-100` | `/alertList` | 关系更清楚 |
| 层级只表达稳定从属 | `/alerts/a-100/comments` | 六七层深路径 | 深路径耦合强、难演进 |
| 查询参数表达筛选 | `/alerts?severity=critical` | `/alerts/severity/critical` | 筛选不是新的固定资源层级 |
| URI 不暴露敏感信息 | 使用不可猜标识并做授权 | 邮箱、Token 放路径 | URI 常进入日志、历史和监控 |
| 不依赖大小写差异 | 统一小写路径 | `/Alerts` 与 `/alerts` 并存 | 降低客户端和代理歧义 |

RFC 3986 定义 URI 通用语法，但不规定你的业务路径必须用复数名词。路径风格要在组织内一致，并写进 API 设计规范。

### 表示与内容协商

请求示例：

```http
GET /api/v1/alerts/a-100 HTTP/1.1
Host: api.example.com
Accept: application/json
Accept-Language: zh-CN
```

响应示例：

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Content-Language: zh-CN
Vary: Accept, Accept-Language

{"id":"a-100","summary":"磁盘使用率过高","status":"open"}
```

关键区别：

- `Content-Type`：本次消息正文实际是什么格式。
- `Accept`：客户端希望收到什么格式。
- `Content-Encoding`：正文是否经过 gzip、br 等内容编码。
- `Accept-Encoding`：客户端能接受哪些编码。
- `Vary`：缓存选择响应时还要把哪些请求头纳入缓存键。
- `415 Unsupported Media Type`：服务端不支持客户端提交的正文格式。
- `406 Not Acceptable`：服务端无法提供客户端要求的响应表示。

## HTTP 方法：安全、幂等与可缓存

### 三个词先分清

- **安全（safe）**：客户端请求该方法的目的应是只读，不要求服务端完全没有日志、计费等附带行为。
- **幂等（idempotent）**：同一请求执行一次或多次，对服务端产生的预期效果相同。
- **可缓存（cacheable）**：响应是否允许被缓存和复用，由方法语义、状态、缓存指令与具体实现共同决定。

| 方法 | 常见用途 | 安全 | 幂等 | 常见成功响应 | 重试提示 |
|---|---|---:|---:|---|---|
| GET | 获取资源表示 | 是 | 是 | 200、206、304 | 网络失败时通常可重试，但仍要限制次数 |
| HEAD | 只取响应元数据 | 是 | 是 | 200、304 | 与 GET 类似 |
| POST | 创建下级资源、提交命令 | 否 | 否 | 200、201、202 | 需幂等键或结果查询机制 |
| PUT | 创建或替换目标资源 | 否 | 是 | 200、201、204 | 仍需考虑并发条件和超时歧义 |
| PATCH | 局部修改 | 否 | 不保证 | 200、204 | 取决于补丁语义，常配条件请求 |
| DELETE | 删除目标资源 | 否 | 是 | 200、202、204 | 可重试，但响应可能变成 404 |
| OPTIONS | 查询通信选项、CORS 预检 | 是 | 是 | 200、204 | 浏览器常自动发起 |

安全和幂等是规范语义，也是客户端、代理和重试组件的共同假设。若服务端让 `GET /delete?id=1` 真正删除数据，就破坏了安全方法语义，预取、爬虫和缓存都可能触发事故。

### POST 如何安全重试

常见做法：

1. 客户端为一次业务操作生成唯一键。
2. 首次请求携带 `Idempotency-Key`。
3. 服务端以“调用主体 + 接口 + 键”为作用域保存请求指纹和结果。
4. 同键同请求重放时返回已保存结果，不重复副作用。
5. 同键不同请求体时拒绝并返回明确冲突。
6. 记录过期时间；业务处理时间可能超过保存时间时不能过早清理。

注意：截至本文核验日，`Idempotency-Key` 的 `-07` Internet-Draft 已经过期，且没有成为正式 RFC。支付、工单和自动修复平台仍可采用这一行业惯例，但必须在 OpenAPI 和服务策略中明确：

- 键格式和最大长度。
- 作用域是租户、用户还是全局。
- 保存多久。
- 同键不同载荷返回什么。
- 进行中的请求如何响应。
- 是否重放原状态码、Header 和正文。
- 失败结果是否保存。

## 状态码不是“成功 200，失败 500”

### 高频状态码字典

| 状态码 | 含义 | AIOps 场景 | 常见误用 |
|---:|---|---|---|
| 200 | 请求成功 | 查询告警、修改后返回新表示 | 用 200 包住业务错误 |
| 201 | 已创建资源 | 创建修复任务 | 不返回 `Location` 或资源标识 |
| 202 | 已接收，尚未完成 | 提交异步诊断任务 | 把它当成任务已成功完成 |
| 204 | 成功且无正文 | 删除静默规则 | 仍返回 JSON 正文 |
| 304 | 条件 GET 可复用缓存 | 告警字典未变化 | 当成普通重定向 |
| 400 | 请求语法或通用校验失败 | JSON 无法解析 | 所有客户端错误都塞 400 |
| 401 | 认证凭据缺失或不可接受 | Token 过期 | 与 403 混用 |
| 403 | 已识别但无权执行 | 值班员无权执行高危 Runbook | 用它表示资源不存在而无统一策略 |
| 404 | 找不到目标资源 | 告警 ID 不存在 | 用 200 + null |
| 409 | 当前资源状态发生冲突 | 已关闭告警不能再次确认 | 与条件请求失败混为一谈 |
| 410 | 资源已明确永久消失 | 旧版接口已下线 | 对普通暂时不存在资源使用 |
| 412 | 请求条件不成立 | `If-Match` 对应版本已过期 | 返回 409 丢失协议语义 |
| 415 | 不支持请求媒体类型 | 只收 JSON 却提交 XML | 当成字段校验失败 |
| 422 | 内容语法正确但语义无法处理 | `severity=super-high` 不在枚举中 | 与 JSON 解析错误混用 |
| 428 | 要求条件请求 | 修改必须携带 `If-Match` | 不说明如何修复 |
| 429 | 请求过多 | 自动化触发超过配额 | 不返回等待提示、不区分租户 |
| 500 | 服务端意外错误 | 未处理异常 | 把依赖超时全部算 500 |
| 502 | 网关收到无效上游响应 | 网关到服务异常 | 与应用自身 500 混淆 |
| 503 | 服务暂时不可用 | 过载保护、维护 | 永久错误也让客户端重试 |
| 504 | 网关等待上游超时 | 网关超时小于服务处理时间 | 认为后端一定没有执行 |

状态码只描述 HTTP 层结果。业务还需要稳定错误类型和可行动信息。

## 用 RFC 9457 统一错误体

推荐媒体类型：

```http
HTTP/1.1 412 Precondition Failed
Content-Type: application/problem+json

{
  "type": "https://api.example.com/problems/stale-version",
  "title": "资源版本已变化",
  "status": 412,
  "detail": "提交的 ETag 已过期，请重新读取后再修改。",
  "instance": "/api/v1/alerts/a-100",
  "requestId": "req-7f32"
}
```

核心成员：

| 字段 | 用途 | 设计提示 |
|---|---|---|
| `type` | 稳定标识问题类型 | 最好能指向可读文档；客户端按它分支 |
| `title` | 简短、稳定的人类可读标题 | 不要塞动态堆栈 |
| `status` | 原始 HTTP 状态码 | 实际 HTTP 状态仍必须正确 |
| `detail` | 针对此次发生的问题说明 | 不泄露 SQL、Token、内部路径 |
| `instance` | 标识本次问题实例 | 可用 URI，不应包含秘密 |
| 扩展字段 | 例如 `requestId`、字段错误 | 命名稳定并写入契约 |

不要让客户端解析自然语言 `detail` 来决定业务流程；应使用稳定的 `type`、错误代码或结构化扩展字段。

## 条件请求：防止“最后写入者覆盖”

### ETag 是什么

- **是什么**：服务端为某个资源表示生成的验证器。
- **为什么**：缓存可以验证内容是否变化，并发写入可以判断客户端看到的是否仍是当前版本。
- **怎么工作**：读取返回 `ETag`；客户端后续用 `If-None-Match` 或 `If-Match` 携带它。
- **怎么用**：GET 缓存验证常用 `If-None-Match`；修改防覆盖常用强 `ETag` + `If-Match`。
- **坏了怎么查**：看 ETag 是否随有效内容版本变化、不同表示是否错误共用、网关是否删除 Header。

### 缓存验证

```http
GET /api/v1/alerts/a-100
If-None-Match: "v7"
```

如果仍是同一表示：

```http
HTTP/1.1 304 Not Modified
ETag: "v7"
```

### 乐观并发控制

```http
PATCH /api/v1/alerts/a-100
Content-Type: application/json
If-Match: "v7"

{"status":"acknowledged"}
```

若服务端当前已是 `"v8"`，返回：

```http
HTTP/1.1 412 Precondition Failed
Content-Type: application/problem+json
```

RFC 6585 的 `428 Precondition Required` 可用于告诉客户端：“这个修改接口必须带条件头”。这样能防止客户端忘带 `If-Match` 后直接覆盖别人。

### 409、412、428 的边界

- `428`：服务端策略要求条件请求，但客户端没带所需条件。
- `412`：客户端带了条件，但条件求值为假。
- `409`：请求与资源当前业务状态冲突，未必是 HTTP 条件头问题。

## 缓存：性能工具，也是数据正确性边界

### Cache-Control 常用指令

| 指令 | 人话解释 | 常见场景 | 易错点 |
|---|---|---|---|
| `max-age=60` | 私有或共享缓存可认为响应 60 秒新鲜 | 公开字典 | 要评估 60 秒旧数据影响 |
| `s-maxage=30` | 共享缓存使用 30 秒新鲜期 | CDN/API 网关 | 不控制浏览器私有缓存 |
| `private` | 只允许私有缓存保存 | 用户个性化响应 | 不等于加密 |
| `public` | 明确允许共享缓存 | 公共静态资源 | 带敏感数据时危险 |
| `no-cache` | 可以存，但复用前必须验证 | 需要 ETag 的动态资源 | 它不是“禁止存储” |
| `no-store` | 不应存储请求或响应 | Token、极敏感数据 | 不能代替传输加密 |
| `must-revalidate` | 过期后必须验证，不能随意使用旧响应 | 配置和权限数据 | 离线容错需求要单独设计 |
| `stale-while-revalidate` | 可短暂用旧响应并后台验证 | 读多写少页面 | 对高风险控制面数据慎用 |

### 缓存键必须包含差异维度

如果响应因 `Accept-Encoding`、`Accept-Language` 或 `Origin` 不同而变化，服务端应正确返回 `Vary`。否则共享缓存可能把一个用户或来源的表示给另一个用户。

缓存排障证据：

```text
客户端响应头
  -> Cache-Control / Age / ETag / Vary / Via
  -> CDN 或网关命中状态
  -> 源站访问日志是否收到请求
  -> 缓存键包含哪些 Header 和 Query
  -> 清除缓存前先评估流量回源冲击
```

## 集合接口：分页、过滤、排序和搜索

HTTP/REST 没有规定唯一分页格式，组织必须形成一致契约。

### Offset 分页

```http
GET /api/v1/alerts?limit=50&offset=100
```

优点是简单、可跳页；缺点是深翻页可能越来越慢，并发新增或删除会造成重复或漏读。

### Cursor 分页

```http
GET /api/v1/alerts?limit=50&cursor=eyJpZCI6ImEtMTAwIn0
```

优点是更适合大数据集和持续变化的列表；缺点是不适合任意跳页，游标必须签名或校验，不能泄露敏感内部信息。

响应可以在正文或 `Link` Header 中给下一页：

```http
Link: </api/v1/alerts?limit=50&cursor=next-token>; rel="next"
```

设计时明确：

- 默认与最大页大小。
- 稳定排序字段和相同值时的二级排序。
- Cursor 有效期、作用域和篡改防护。
- 过滤字段、运算符、时区和空值语义。
- 未知过滤参数是忽略还是报错。
- 总数是精确、近似还是不返回。
- 大结果集是否转异步导出任务。

## 批量与异步任务

### 批量操作

批量请求要明确：

- 整批原子成功，还是每项独立结果。
- 最大条数和请求体大小。
- 部分成功如何表示。
- 重试是整批还是失败子集。
- 幂等键作用于整批还是每一项。
- 审计记录能否追到单项。

不要为了少几次 HTTP 请求，就让一个无限大批量接口拖垮服务。

### 长任务使用 202 + 任务资源

```http
POST /api/v1/diagnostic-jobs
Idempotency-Key: 52ae...
Content-Type: application/json

{"target":"host-17","profile":"full"}
```

```http
HTTP/1.1 202 Accepted
Location: /api/v1/diagnostic-jobs/j-900
Retry-After: 5

{
  "id": "j-900",
  "status": "queued",
  "links": {
    "self": "/api/v1/diagnostic-jobs/j-900",
    "cancel": "/api/v1/diagnostic-jobs/j-900/cancellation"
  }
}
```

`202` 只表示服务接收了请求，不保证任务最终成功。任务资源需要清晰状态机：

```text
queued -> running -> succeeded
                  -> failed
                  -> cancelling -> cancelled
```

还要定义：

- 重复提交和取消是否幂等。
- 状态保留多久。
- 结果在哪里下载。
- 任务已接收但消息未入队如何恢复。
- Worker 崩溃后的租约、超时和重新领取。
- Webhook 至少一次投递时消费者如何去重。

## OpenAPI：让契约机器可读

OpenAPI 可描述路径、操作、参数、请求体、响应、回调、Webhook 和安全方案。它常用于：

- 生成交互文档。
- 在 CI 中做语法与规则校验。
- 生成客户端或服务端骨架。
- 做 Mock 与契约测试。
- 检测破坏性变更。
- 生成 API 清单并接入安全扫描。

`openapi` 字段表示这份文档遵循的 OpenAPI 规范版本，`info.version` 表示你的 API 产品或描述版本；两者不能混为一谈。

最小示例：

```yaml
openapi: 3.2.0
info:
  title: AIOps Alert API
  version: 1.0.0
paths:
  /api/v1/alerts/{alertId}:
    get:
      operationId: getAlert
      parameters:
        - name: alertId
          in: path
          required: true
          schema:
            type: string
      responses:
        "200":
          description: 找到告警
          headers:
            ETag:
              description: 当前表示的强验证器
              schema:
                type: string
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Alert"
        "404":
          $ref: "#/components/responses/NotFound"
components:
  schemas:
    Alert:
      type: object
      required: [id, status, severity]
      properties:
        id:
          type: string
        status:
          type: string
          enum: [open, acknowledged, closed]
        severity:
          type: string
          enum: [warning, high, critical]
  responses:
    NotFound:
      description: 资源不存在
      content:
        application/problem+json:
          schema:
            type: object
```

### 契约评审不只看语法

评审清单：

- `operationId` 是否稳定唯一。
- 所有状态码和错误体是否定义。
- 必填、枚举、格式、长度和数值边界是否明确。
- 分页、排序、过滤是否一致。
- 鉴权方案和权限要求是否写清。
- 幂等、超时和重试语义是否写清。
- 示例是否可能泄露真实 Token、手机号或内网地址。
- 新版本是否删除字段、收窄枚举或改变可空性。
- 生成器是否正确支持 OpenAPI 3.2；若工具链只支持 3.1，不要盲目升级文档版本。

## 版本、兼容、弃用与下线

HTTP 没有规定唯一 API 版本策略。常见方案：

| 方案 | 示例 | 优点 | 代价 |
|---|---|---|---|
| URI 版本 | `/api/v1/alerts` | 直观，网关路由方便 | URI 长期带版本，迁移成本明显 |
| 媒体类型版本 | `Accept: application/vnd.example.v2+json` | 资源 URI 稳定 | 调试和缓存配置更复杂 |
| Header 版本 | `API-Version: 2026-07-31` | 可按日期演进 | 自定义约定，客户端和代理需支持 |
| 兼容演进 | 同 URI 添加可选字段 | 调用方迁移平滑 | 必须严格控制语义兼容 |

常见破坏性变更：

- 删除或重命名字段。
- 把可选字段改为必填。
- 收窄允许值或新增客户端无法处理的枚举。
- 改变数字单位、时区或精度。
- 修改默认排序、分页或过滤语义。
- 把同步成功改成异步而不改变契约。
- 改变错误类型、状态码和重试语义。

发布新版本时：

1. 先从访问日志和 API 清单识别真实消费者。
2. 发布迁移指南、时间表和兼容窗口。
3. 用契约差异工具在 CI 阻止意外破坏。
4. 用 RFC 9745 `Deprecation` 表达弃用时间。
5. 可用 RFC 8594 `Sunset` 表达预计停止响应时间。
6. 提供 `Link: ...; rel="deprecation"` 指向迁移说明。
7. 监控旧版本流量下降，不要只等口头确认。
8. 下线前准备一键恢复旧路由或兼容适配层。

弃用不会自动改变资源行为；`Sunset` 也不是强制客户端迁移的魔法。组织仍要沟通、观测、演练和回滚。

## 一次请求的内部数据路径

```text
Client
  -> DNS / TLS
  -> CDN / WAF
  -> API Gateway
       -> authentication
       -> authorization policy
       -> request validation
       -> quota / rate limit
       -> routing
  -> Load Balancer
  -> Service Instance
       -> deserialize
       -> business validation
       -> authorization on target object
       -> idempotency lookup
       -> transaction / outbox
  -> Database / Cache / Queue
  -> response serialization
  -> Gateway / Cache
  -> Client

Observability side path
  -> metrics
  -> structured logs
  -> distributed traces
  -> audit events
```

排障时沿路径逐层问：

1. 客户端实际发了什么，不要只看调用代码。
2. DNS、TLS、代理是否正常。
3. 网关是否拒绝、改写或超时。
4. 请求是否到达正确版本和实例。
5. 服务在哪一步耗时或失败。
6. 下游数据库、缓存、队列是否成功。
7. 响应是否在返回途中丢失。
8. 客户端是否因超时重试造成第二次副作用。

## 状态、一致性、事务和重试

### REST 无状态不等于业务无状态

REST 的无状态交互只表示服务端不依赖前一次请求的隐含上下文。业务仍可能有：

- 告警状态机。
- 任务执行状态。
- 数据库事务。
- 幂等记录。
- OAuth Token 和授权策略。
- 分布式锁、租约或消息偏移量。

服务实例可以无会话，但数据库和队列仍是共享状态依赖。因此“把 Pod 扩到 10 个”不自动带来高可用。

### 超时不等于失败

客户端超时只说明它没有及时收到响应，可能出现三种情况：

```text
请求未到达服务
请求已到达但尚未完成
请求已完成但响应在途中丢失
```

所以写操作必须设计：

- 幂等键。
- 操作状态查询。
- 有界超时。
- 指数退避和随机抖动。
- 最大重试次数与总时间预算。
- 哪些状态可以重试。
- 熔断、并发限制和人工接管。

### 数据库与消息的一致性

创建任务常同时需要“写数据库 + 发消息”。如果两步没有原子边界：

- 数据库成功、消息失败：任务永远排队。
- 消息成功、数据库失败：Worker 找不到任务。

常见解决思路是本地事务内同时写业务记录与 Outbox 事件，再由可靠发布器发送消息。消费者仍应按至少一次投递假设做幂等。

## 生产架构与高可用

```text
Global DNS / Traffic Manager
  -> Region A
       -> WAF / API Gateway cluster
       -> Load Balancer
       -> stateless API instances
       -> distributed idempotency store
       -> database HA
       -> queue cluster
  -> Region B
       -> warm standby or active

Control Plane
  -> OpenAPI registry
  -> policy and route configuration
  -> secrets / keys
  -> deployment and rollback

Observability
  -> metrics / logs / traces / audit
  -> SLO and alerting
```

高可用设计必须回答：

- 网关、服务、数据库、缓存、队列分别能坏几个节点。
- 幂等记录是否跨实例、跨区域一致。
- 全局流量切换时 DNS TTL 和连接存量如何处理。
- 多区域写入冲突采用强一致、单主还是业务合并。
- 降级时哪些读接口可用旧数据，哪些写操作必须拒绝。
- 配置中心或鉴权服务不可用时是 fail-open 还是 fail-closed。
- 恢复后如何处理积压、重复投递和顺序变化。
- RTO（恢复时间目标）和 RPO（恢复点目标）分别是多少。

REST 的无状态约束有利于横向扩容和故障切换，但不会替你解决数据库复制、消息可靠性、跨区一致性和容量保护。

## 容量与性能

### 先建立预算

假设接口目标为每秒 10,000 个请求，峰值系数 3，目标 p99 为 300 ms：

```text
峰值 RPS = 日常 RPS × 峰值系数
并发请求数约等于 峰值 RPS × 平均响应秒数
后端连接需求 ≠ API 实例数 × 最大连接池盲目相乘
```

Little's Law 的直觉是：到达率固定时，响应越慢，在途请求越多。依赖慢会先占满连接、线程或事件循环，再形成排队和超时风暴。

### 容量手段

- 分页和最大结果数，防止无界查询。
- 请求体、Header、上传文件和批量条数限制。
- 连接池、线程池、队列和并发上限。
- 超时分层：客户端总预算 > 网关 > 服务下游调用，但要预留返回时间。
- 只对可安全重试的请求进行有界重试。
- 读缓存和条件请求降低重复传输。
- 压缩大文本响应，但小响应压缩可能得不偿失。
- 限流按租户、用户、Token、IP、接口或成本加权。
- 过载时快速返回 `429` 或 `503`，而不是把所有请求拖到超时。
- 大导出转异步任务，生成后放对象存储。

### 限流语义

正式可依赖的基础是：

- `429 Too Many Requests`。
- 可选 `Retry-After` 指示等待时间。

截至核验日，IETF 正在推进统一 `RateLimit` Header，但仍是工作草案。生产中若使用某套限流 Header，要把字段语义与网关实现版本写入契约，不要宣称它已经是正式 RFC。

客户端收到限流后应：

1. 读取 `Retry-After` 或服务约定。
2. 指数退避并加入随机抖动。
3. 避免所有实例在同一秒恢复。
4. 受总时间预算和重试上限约束。
5. 对高优先级与低优先级流量隔离。

## 安全边界

### 认证与授权不是一回事

- **认证**回答“你是谁”。
- **授权**回答“你能对这个具体对象做什么”。

通过 Token 认证后，仍必须在对象级、字段级和功能级做授权。不能只检查“已登录”。

### OAuth 2.0 使用提示

OAuth 2.0 是授权框架，不是 REST 的组成部分，也不是登录协议本身。OpenID Connect 在 OAuth 2.0 之上补充身份层。

依据 RFC 9700 的方向，生产系统应重点关注：

- 使用端到端 TLS。
- 授权码流程使用 PKCE，公共客户端必须使用。
- 避免隐式授权等已不推荐模式。
- 精确校验重定向 URI。
- 限制 Token 的受众、权限范围和有效期。
- 保护刷新 Token，并考虑轮换或发送者约束。
- 网关必须清理来自外部的不可信转发 Header。

### OWASP API Security 风险如何落地

| 风险方向 | API 设计与运维控制 |
|---|---|
| 对象级授权失效 | 每次按 `tenant + subject + object + action` 校验，不信任客户端传入归属 |
| 认证失效 | 安全 Token 流程、密钥轮换、短有效期、重放防护 |
| 对象属性级授权失效 | 请求和响应都做字段白名单，防止批量赋值与敏感字段外泄 |
| 资源消耗不受限 | 限流、并发、页大小、体积、超时、成本预算 |
| 功能级授权失效 | 管理接口与普通接口分别授权，不只隐藏菜单 |
| 敏感业务流无限制 | 对自动修复、邀请、兑换等流程做业务配额与风控 |
| SSRF | Webhook/回调地址白名单、DNS/IP 再校验、阻断云元数据地址 |
| 安全配置错误 | 默认拒绝、最小 CORS、关闭调试、统一安全 Header |
| API 清单管理不当 | OpenAPI 清单、版本所有者、弃用和影子接口发现 |
| 不安全消费第三方 API | 校验第三方响应、限制重定向和体积、超时隔离 |

### CORS 与 CSRF

CORS 是浏览器对“响应能否被跨源脚本读取”的协议，不是服务端鉴权，也不能阻止服务器收到请求。

要点：

- `Access-Control-Allow-Origin: *` 不能与凭据模式随意组合。
- 根据白名单回显 Origin 时要返回正确 `Vary: Origin`。
- 非简单请求可能先发 `OPTIONS` 预检。
- 命令行客户端不受浏览器 CORS 限制。
- 使用 Cookie 认证的写操作还要防 CSRF，例如 SameSite、CSRF Token 和 Origin 校验。
- 使用 Bearer Token 也要防 XSS 窃取 Token，不能把 CORS 当万能防线。

### 敏感数据

- Token、密码和密钥不得出现在 URI。
- 日志对认证头、Cookie、身份证号和手机号脱敏。
- 错误体不返回堆栈、SQL 和内部文件路径。
- 审计记录谁在何时对哪个对象执行了什么，且防篡改和受控访问。
- OpenAPI 示例使用虚构数据，不复制生产报文中的秘密。

## 可观测性与 AIOps

### 指标

按低基数维度统计：

- 请求率：`http_server_request_count`。
- 错误率：按路由模板、方法、状态类别统计。
- 延迟：p50、p95、p99 直方图。
- 在途请求和队列长度。
- 限流、超时、重试、熔断次数。
- 幂等命中、同键冲突、进行中重复请求。
- 缓存命中、验证、回源和淘汰。
- 依赖调用延迟、错误和连接池等待。

不要把原始 URI、用户 ID、请求 ID 放进指标标签，否则会制造高基数并拖垮指标系统。使用 `/alerts/{alertId}` 这样的路由模板。

### 日志

结构化日志建议字段：

```json
{
  "timestamp": "2026-07-31T02:10:03.125Z",
  "level": "INFO",
  "request_id": "req-7f32",
  "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736",
  "method": "POST",
  "route": "/api/v1/remediation-jobs",
  "status": 201,
  "duration_ms": 83,
  "tenant": "ops-team-a",
  "idempotency_key_hash": "sha256:...",
  "job_id": "j-900",
  "replayed": false
}
```

记录哈希或受控标识，不要直接记录秘密和完整请求体。

### 链路

W3C Trace Context 使用 `traceparent` 和可选 `tracestate` 在服务间传播链路上下文。网关、服务和消息消费者要保持关联，但必须：

- 校验 Header 格式和长度。
- 不把外部采样决定当授权依据。
- 跨信任边界时评估是否重建或过滤上下文。
- 异步消息中保存 trace link 或父子关系。

### AIOps 闭环

```text
HTTP 指标发现 5xx 与 p99 异常
  -> 日志按 route + request_id 聚合错误类型
  -> Trace 找到慢在网关、服务还是数据库
  -> 变更记录关联最新发布
  -> 规则或模型判断异常范围
  -> Runbook 做只读诊断
  -> 人工批准后限流、回滚或扩容
  -> 验证 SLI 恢复
  -> RCA 沉淀到知识库
```

自动修复 API 自身必须有幂等、权限、审计、停止条件和回滚，不能因为叫“AIOps”就跳过工程护栏。

## Header 与契约字段字典

| 名称 | 作用 | 关键点 | AIOps 示例 | 常见坑 |
|---|---|---|---|---|
| `Accept` | 声明期望响应格式 | 可带多个媒体类型和权重 | 请求 JSON 告警 | 服务无视后返回错误格式 |
| `Content-Type` | 声明本次正文格式 | 请求与响应分别设置 | `application/problem+json` | 只看扩展名、不校验媒体类型 |
| `Authorization` | 携带认证凭据 | 日志必须脱敏 | Bearer access token | Token 放 URI |
| `Location` | 指向新资源或其他位置 | `201`/`202` 常用 | 新任务状态 URI | 返回不可访问内网地址 |
| `ETag` | 表示验证器 | 强弱验证器语义不同 | 告警版本 | 所有用户响应共用错误 ETag |
| `If-Match` | 仅当前验证器匹配才执行 | 防止并发覆盖 | 确认告警 | 网关删除 Header |
| `If-None-Match` | 不匹配才返回完整表示 | 缓存验证、条件创建 | 字典缓存 | 与 `If-Match` 混淆 |
| `Cache-Control` | 控制存储和复用 | `no-cache` 不等于 `no-store` | CMDB 字典 | 私有响应被共享缓存 |
| `Vary` | 扩展缓存键 | 与内容协商/CORS 相关 | 按语言或 Origin | 漏维度造成串数据 |
| `Retry-After` | 建议多久后再试 | 秒数或 HTTP 日期 | 429/503/202 | 客户端无上限地等待或齐步重试 |
| `WWW-Authenticate` | 描述认证挑战 | `401` 响应应考虑 | Token 失效 | 只返 401 不告诉客户端方案 |
| `Link` | 表达资源关系 | 使用注册或 URI relation | 下一页、弃用文档 | 拼接错误环境 URL |
| `Deprecation` | 表达弃用时点 | RFC 9745 | 旧版 API | 把弃用误当立即下线 |
| `Sunset` | 表达预计停止响应时点 | RFC 8594 | v1 下线 | 无迁移路径 |
| `traceparent` | 传播链路上下文 | W3C 格式 | 串起网关与服务 | 当作安全凭据 |
| `Idempotency-Key` | 工程上标识一次写操作 | `-07` 草案已过期且尚非 RFC | 创建修复任务 | 不校验同键不同载荷 |

## curl 与 PowerShell 请求字典

### 查看完整响应头

```powershell
curl.exe -i http://127.0.0.1:18080/api/v1/alerts/a-100
```

用途：同时看状态行、Header 和正文。`-i` 会把响应头包含在输出里。

### 只看详细网络过程

```powershell
curl.exe -v http://127.0.0.1:18080/api/v1/alerts/a-100
```

用途：观察连接、请求头和响应头。详细输出可能包含认证信息，生产排障记录必须脱敏。

### 发送 JSON

```powershell
curl.exe -i -X POST `
  -H "Content-Type: application/json" `
  -H "Idempotency-Key: lab-job-001" `
  --data "{\"alertId\":\"a-100\",\"action\":\"collect-diagnostics\"}" `
  http://127.0.0.1:18080/api/v1/remediation-jobs
```

PowerShell 里的反引号表示续行，反引号后不要再放空格。

### 使用 PowerShell 读取 Header

```powershell
$response = Invoke-WebRequest -Uri "http://127.0.0.1:18080/api/v1/alerts/a-100"
$response.StatusCode
$response.Headers.ETag
$response.Content
```

用途：把状态、Header 和正文保存成对象，适合自动化验证。

## 入门实验：运行一个可观察的 REST API

这个实验不安装第三方包，只需 Node.js 20 或更高版本。它用于学习协议语义，不是生产框架示例；服务只监听本机、没有真实鉴权，禁止直接暴露到公网。

### 前置条件

```powershell
node --version
```

预期看到 `v20` 或更高版本。

### 第一步：创建实验目录

```powershell
New-Item -ItemType Directory -Force restful-api-lab | Out-Null
Set-Location restful-api-lab
```

### 第二步：创建 `rest-api-lab.mjs`

```javascript
import { createHash, randomUUID } from 'node:crypto'
import { createServer } from 'node:http'

const alerts = new Map([
  ['a-100', {
    id: 'a-100',
    severity: 'critical',
    status: 'open',
    version: 1
  }]
])

const idempotencyRecords = new Map()

function json(res, status, body, headers = {}) {
  const payload = JSON.stringify(body, null, 2)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    ...headers
  })
  res.end(payload)
}

function problem(res, status, type, title, detail, requestId, headers = {}) {
  json(res, status, {
    type: `http://127.0.0.1:18080/problems/${type}`,
    title,
    status,
    detail,
    requestId
  }, {
    'Content-Type': 'application/problem+json; charset=utf-8',
    ...headers
  })
}

async function readJson(req) {
  const chunks = []
  let size = 0

  for await (const chunk of req) {
    size += chunk.length
    if (size > 16 * 1024) {
      throw new Error('body-too-large')
    }
    chunks.push(chunk)
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
  } catch {
    throw new Error('invalid-json')
  }
}

function fingerprint(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex')
}

function etag(alert) {
  return `"v${alert.version}"`
}

const server = createServer(async (req, res) => {
  const requestId = req.headers['x-request-id'] || randomUUID()
  const startedAt = performance.now()

  res.setHeader('X-Request-Id', requestId)
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
  res.setHeader('Vary', 'Origin')

  res.on('finish', () => {
    console.log(JSON.stringify({
      requestId,
      method: req.method,
      path: req.url,
      status: res.statusCode,
      durationMs: Math.round(performance.now() - startedAt)
    }))
  })

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
      'Access-Control-Allow-Headers':
        'Content-Type, If-Match, Idempotency-Key, X-Request-Id',
      'Access-Control-Max-Age': '600'
    })
    return res.end()
  }

  if (req.method === 'GET' && req.url === '/healthz') {
    return json(res, 200, { status: 'ok' }, {
      'Cache-Control': 'no-store'
    })
  }

  if (req.method === 'GET' && req.url === '/api/v1/alerts/a-100') {
    const alert = alerts.get('a-100')
    const currentEtag = etag(alert)

    if (req.headers['if-none-match'] === currentEtag) {
      res.writeHead(304, {
        ETag: currentEtag,
        'Cache-Control': 'private, max-age=0, must-revalidate'
      })
      return res.end()
    }

    return json(res, 200, alert, {
      ETag: currentEtag,
      'Cache-Control': 'private, max-age=0, must-revalidate'
    })
  }

  if (req.method === 'PATCH' && req.url === '/api/v1/alerts/a-100') {
    const alert = alerts.get('a-100')
    const ifMatch = req.headers['if-match']

    if (!ifMatch) {
      return problem(
        res,
        428,
        'precondition-required',
        '必须提供资源版本',
        '请先 GET 资源，再把响应 ETag 放入 If-Match。',
        requestId
      )
    }

    if (ifMatch !== etag(alert)) {
      return problem(
        res,
        412,
        'stale-version',
        '资源版本已变化',
        `提交版本 ${ifMatch}，当前版本 ${etag(alert)}。`,
        requestId,
        { ETag: etag(alert) }
      )
    }

    let patch
    try {
      patch = await readJson(req)
    } catch (error) {
      const tooLarge = error.message === 'body-too-large'
      return problem(
        res,
        tooLarge ? 413 : 400,
        tooLarge ? 'body-too-large' : 'invalid-json',
        tooLarge ? '请求体过大' : 'JSON 无法解析',
        '请检查请求体和 Content-Type。',
        requestId
      )
    }

    const allowedStatus = ['open', 'acknowledged', 'closed']
    const allowedSeverity = ['warning', 'high', 'critical']

    if (
      (patch.status && !allowedStatus.includes(patch.status)) ||
      (patch.severity && !allowedSeverity.includes(patch.severity))
    ) {
      return problem(
        res,
        422,
        'invalid-field',
        '字段值无法处理',
        'status 或 severity 不在允许枚举中。',
        requestId
      )
    }

    if (patch.status) alert.status = patch.status
    if (patch.severity) alert.severity = patch.severity
    alert.version += 1

    return json(res, 200, alert, {
      ETag: etag(alert),
      'Cache-Control': 'no-store'
    })
  }

  if (req.method === 'POST' && req.url === '/api/v1/remediation-jobs') {
    const key = req.headers['idempotency-key']
    if (!key) {
      return problem(
        res,
        400,
        'idempotency-key-required',
        '缺少幂等键',
        '创建修复任务必须提供 Idempotency-Key。',
        requestId
      )
    }

    let input
    try {
      input = await readJson(req)
    } catch {
      return problem(
        res,
        400,
        'invalid-json',
        'JSON 无法解析',
        '请提交合法 JSON。',
        requestId
      )
    }

    const requestFingerprint = fingerprint(input)
    const existing = idempotencyRecords.get(key)

    if (existing && existing.fingerprint !== requestFingerprint) {
      return problem(
        res,
        409,
        'idempotency-conflict',
        '幂等键已用于不同请求',
        '请为新的业务操作生成新的 Idempotency-Key。',
        requestId
      )
    }

    if (existing) {
      return json(res, existing.status, existing.body, {
        Location: `/api/v1/remediation-jobs/${existing.body.id}`,
        'Idempotency-Replayed': 'true',
        'Cache-Control': 'no-store'
      })
    }

    const job = {
      id: `j-${randomUUID().slice(0, 8)}`,
      alertId: input.alertId,
      action: input.action,
      status: 'queued'
    }

    idempotencyRecords.set(key, {
      fingerprint: requestFingerprint,
      status: 201,
      body: job
    })

    return json(res, 201, job, {
      Location: `/api/v1/remediation-jobs/${job.id}`,
      'Idempotency-Replayed': 'false',
      'Cache-Control': 'no-store'
    })
  }

  return problem(
    res,
    404,
    'not-found',
    '资源不存在',
    `${req.method} ${req.url} 没有对应资源。`,
    requestId
  )
})

server.listen(18080, '127.0.0.1', () => {
  console.log('REST API lab: http://127.0.0.1:18080')
})
```

### 第三步：启动

```powershell
node .\rest-api-lab.mjs
```

预期输出：

```text
REST API lab: http://127.0.0.1:18080
```

保持这个窗口运行，另开一个 PowerShell 窗口执行后续命令。

### 第四步：验证资源、状态码和 ETag

```powershell
$alert = Invoke-WebRequest `
  -Uri "http://127.0.0.1:18080/api/v1/alerts/a-100"

$alert.StatusCode
$alert.Headers.ETag
$alert.Content
```

预期：

- 状态码为 `200`。
- `ETag` 为 `"v1"`。
- 正文包含 `a-100`、`critical`、`open` 和 `version: 1`。

再做条件 GET：

```powershell
curl.exe -i `
  -H 'If-None-Match: "v1"' `
  http://127.0.0.1:18080/api/v1/alerts/a-100
```

预期状态为 `304 Not Modified`，没有完整 JSON 正文。

### 第五步：验证幂等重放

首次创建：

```powershell
$body = @{
  alertId = "a-100"
  action = "collect-diagnostics"
} | ConvertTo-Json -Compress

$first = Invoke-WebRequest `
  -Method Post `
  -Uri "http://127.0.0.1:18080/api/v1/remediation-jobs" `
  -Headers @{ "Idempotency-Key" = "lab-job-001" } `
  -ContentType "application/json" `
  -Body $body

$first.StatusCode
$first.Headers["Idempotency-Replayed"]
$first.Content
```

预期：

- 状态码为 `201`。
- `Idempotency-Replayed` 为 `false`。
- 记住正文中的任务 ID。

原样再发一次：

```powershell
$second = Invoke-WebRequest `
  -Method Post `
  -Uri "http://127.0.0.1:18080/api/v1/remediation-jobs" `
  -Headers @{ "Idempotency-Key" = "lab-job-001" } `
  -ContentType "application/json" `
  -Body $body

$second.StatusCode
$second.Headers["Idempotency-Replayed"]
$second.Content
```

预期：

- 仍返回首次保存的 `201` 和同一个任务 ID。
- `Idempotency-Replayed` 为 `true`。
- 服务没有创建第二个任务。

验证同键不同请求被拒绝：

```powershell
$differentBody = @{
  alertId = "a-100"
  action = "clear-temp"
} | ConvertTo-Json -Compress

try {
  Invoke-WebRequest `
    -Method Post `
    -Uri "http://127.0.0.1:18080/api/v1/remediation-jobs" `
    -Headers @{ "Idempotency-Key" = "lab-job-001" } `
    -ContentType "application/json" `
    -Body $differentBody
} catch {
  $_.Exception.Response.StatusCode.value__
}
```

预期状态码为 `409`。

### 验证方法

你已经验证了：

- URI 标识资源。
- 方法表达读取、创建和修改。
- 状态码表达 HTTP 结果。
- `Content-Type` 表达消息格式。
- `ETag` 与 `If-None-Match` 支持缓存验证。
- 幂等键让一次业务操作可识别地重放。
- 同键不同请求被拒绝，避免悄悄复用错误结果。
- 服务日志用请求 ID 关联每次调用。

### 如果没有成功，先查这些

1. `node --version` 是否至少为 20。
2. 启动窗口是否仍在运行。
3. 地址是否是 `127.0.0.1:18080`。
4. 端口是否被其他程序占用：

```powershell
Get-NetTCPConnection -LocalPort 18080 -ErrorAction SilentlyContinue
```

5. PowerShell 续行反引号后是否误加空格。
6. 是否把 `curl.exe` 写成了 PowerShell 的 `curl` 别名。
7. 修改代码后是否重启了 Node 进程。

## 故障注入实验：两个值班员并发修改同一告警

这个实验模拟“值班员 A 与自动化 B 同时读取 v1，B 先修改，A 随后用旧版本覆盖”的生产问题。

### 前置条件

- 入门实验服务仍在运行。
- 如果已经修改过告警，先按清理步骤重启服务，使版本回到 `"v1"`。

### 第一步：两个客户端读取同一版本

```powershell
$clientA = Invoke-WebRequest `
  -Uri "http://127.0.0.1:18080/api/v1/alerts/a-100"

$clientB = Invoke-WebRequest `
  -Uri "http://127.0.0.1:18080/api/v1/alerts/a-100"

$etagA = $clientA.Headers.ETag
$etagB = $clientB.Headers.ETag

"A=$etagA B=$etagB"
```

预期两者都是 `"v1"`。

### 第二步：客户端 B 先修改

```powershell
$updateB = Invoke-WebRequest `
  -Method Patch `
  -Uri "http://127.0.0.1:18080/api/v1/alerts/a-100" `
  -Headers @{ "If-Match" = $etagB } `
  -ContentType "application/json" `
  -Body '{"severity":"high"}'

$updateB.StatusCode
$updateB.Headers.ETag
$updateB.Content
```

预期：

- 状态码 `200`。
- 新 ETag 为 `"v2"`。
- `severity` 已变为 `high`。

### 第三步：客户端 A 用旧版本修改

```powershell
try {
  Invoke-WebRequest `
    -Method Patch `
    -Uri "http://127.0.0.1:18080/api/v1/alerts/a-100" `
    -Headers @{ "If-Match" = $etagA } `
    -ContentType "application/json" `
    -Body '{"status":"acknowledged"}'
} catch {
  $response = $_.Exception.Response
  $response.StatusCode.value__
  $response.Headers.ETag
}
```

预期：

- 状态码为 `412`。
- 响应 ETag 为 `"v2"`。
- A 的旧请求没有覆盖 B 的修改。

### 第四步：重新读取后再决定

```powershell
$fresh = Invoke-WebRequest `
  -Uri "http://127.0.0.1:18080/api/v1/alerts/a-100"

$fresh.Content
$freshEtag = $fresh.Headers.ETag

$retryA = Invoke-WebRequest `
  -Method Patch `
  -Uri "http://127.0.0.1:18080/api/v1/alerts/a-100" `
  -Headers @{ "If-Match" = $freshEtag } `
  -ContentType "application/json" `
  -Body '{"status":"acknowledged"}'

$retryA.Headers.ETag
$retryA.Content
```

预期最终：

- `severity` 保持 `high`。
- `status` 变为 `acknowledged`。
- ETag 变为 `"v3"`。

### 生产含义

不能在收到 `412` 后无脑把旧请求换一个新 ETag 重发。正确做法是：

1. 重新读取当前资源。
2. 判断原操作是否仍然合理。
3. 合并不冲突字段，或提示人工处理。
4. 使用新 ETag 提交。
5. 记录冲突率，若突然升高要检查自动化竞争或 UI 行为变化。

### 故障实验排障

- 得到 `428`：说明没传 `If-Match`。
- 仍得到 `200`：检查两次是否真的使用同一个旧 ETag；确认服务已重启到 v1。
- PowerShell 只显示异常摘要：从 `Exception.Response` 读取状态和 Header，或改用 `curl.exe -i`。
- ETag 外层引号丢失：不要手工拼版本，直接使用上一次响应的 Header 值。

### 清理

在服务窗口按 `Ctrl+C`，返回上级目录后删除实验目录：

```powershell
Set-Location ..
Remove-Item -LiteralPath .\restful-api-lab -Recurse -Force
```

只删除自己刚创建的 `restful-api-lab`，不要对不确定路径执行递归删除。

## 生产排障手册

### 先建立时间线

```text
何时开始
  -> 哪些路由、租户、区域和版本受影响
  -> 最近发布、配置、证书、网关策略是否变化
  -> 请求率、错误率、延迟先后如何变化
  -> 回滚或限流后哪些指标恢复
```

### 分层证据表

| 现象 | 先看什么 | 可能假设 | 如何验证 | 修复与回滚 |
|---|---|---|---|---|
| 401 激增 | Token 过期、时钟、密钥 ID | 密钥轮换不一致 | 比较网关和鉴权服务日志 | 恢复旧密钥并延长双密钥窗口 |
| 403 集中某租户 | 对象/功能授权策略 | 策略发布错误 | 对比策略版本和审计决策 | 回滚策略，不全局放开 |
| 404 只在一部分实例 | 路由版本、缓存、数据复制 | 灰度实例路径不一致 | 按实例和版本聚合日志 | 摘除异常实例 |
| 409/412 激增 | ETag、并发来源 | 自动化与人工竞争 | 按资源与调用方统计冲突 | 暂停冲突自动化，修订合并策略 |
| 429 激增 | 租户、路由、成本权重 | 重试风暴或额度过小 | 查请求率、重试次数、客户端版本 | 限制重试、分优先级，不盲目扩额度 |
| 502 | 网关上游连接 | 实例崩溃或协议错误 | 网关 upstream 日志、实例重启 | 摘流/回滚 |
| 503 | 过载、维护、依赖不可用 | 保护机制触发 | 看饱和度、队列、依赖 | 降级、限流、扩容；保留回退开关 |
| 504 | 各层超时和下游慢调用 | 超时预算倒置 | Trace 分段耗时 | 优化慢点，不只把超时调大 |
| p99 高但平均正常 | 少量慢查询或热点键 | 长尾、GC、连接池等待 | 直方图、Trace、慢查询 | 隔离热点、索引或容量治理 |
| 重复任务 | 幂等命中和网络超时 | 幂等记录未共享/过期 | 按键哈希关联请求与任务 | 停止重复 Worker，修复存储作用域 |
| 旧数据 | `Age`、ETag、Vary、源站日志 | 缓存键或失效错误 | 绕过缓存对比源站 | 精确清键，防止全量回源 |

### 不要一上来做的事

- 不要先重启所有实例，证据会丢失且可能扩大冲击。
- 不要把所有超时同时调大，排队会更严重。
- 不要全局关闭认证、授权或 WAF。
- 不要清空所有缓存而不评估回源容量。
- 不要让客户端无限重试。
- 不要用单个请求成功证明系统恢复；必须看一段时间的 SLI。

## 事故案例：幂等记录只存在单机内存

### 现象

告警平台显示创建修复任务 API 成功率 99.9%，但同一告警偶尔出现两条任务。重复率在扩容后明显升高。

### 证据

- 两条请求有相同幂等键。
- 请求分别到达两个服务实例。
- 每个实例自己的日志都显示“首次创建”。
- 幂等记录保存在进程内 Map。
- 负载均衡没有粘性，扩容后实例数量增加。
- 数据库里出现两个不同任务 ID。

### 假设

幂等键实现只在单实例内有效；同一键落到不同实例时都会创建任务。

### 验证

在测试环境固定向同一实例重放，只创建一次；交替向两个实例重放，创建两次。证据支持假设。

### 修复

1. 暂停高风险自动修复入口，只保留只读诊断。
2. 识别重复运行任务，按业务安全性人工决定取消。
3. 将幂等记录放入具有原子“首次写入”能力的共享存储。
4. 幂等记录与业务创建尽可能放进同一事务边界，或设计可恢复状态机。
5. 同键不同请求指纹返回冲突。
6. 增加幂等命中、冲突、进行中和存储失败指标。

### 爆炸半径

按调用方、租户、接口、幂等保存时间和扩容时间段统计，不能假设只有已发现的一个告警受影响。

### 回滚

保留旧版本读接口；新幂等存储异常时对高风险写操作 fail-closed，并可回滚到上一稳定版本，不回到“无幂等直接执行”。

### 复盘改进

- 架构评审新增“幂等状态是否跨实例”检查。
- 压测新增跨实例重放与响应丢失场景。
- 发布门禁新增契约和故障注入测试。
- Runbook 明确超时后先查任务状态，再决定重试。

## 生产设计题：设计 10 万 RPS 的多租户告警 API

### 需求澄清

先问：

- 10 万 RPS 是平均、峰值还是读写总和。
- 读写比例、响应体大小、热点租户和热点告警比例。
- 强一致要求在哪些操作上存在。
- 延迟 SLO、可用性 SLO、RTO、RPO。
- 数据保留、合规、地域和租户隔离要求。
- 是否需要全局写、多区域读和离线导出。

### 一个可讨论的设计

```text
Client
  -> Global traffic management
  -> Regional WAF / Gateway
       -> tenant auth
       -> weighted quota
       -> request validation
  -> stateless Alert API
       -> read cache
       -> partitioned alert store
       -> idempotency store
       -> transactional outbox
  -> event stream
       -> notification
       -> automation
       -> analytics

Observability
  -> RED metrics by route/status/region
  -> structured logs with request and trace ID
  -> distributed tracing with sampling
  -> audit stream
```

### 核心取舍

- 读多写少的告警详情可用缓存和条件 GET，但权限与租户必须进入缓存隔离设计。
- 创建和状态变更按租户/资源分片，避免一个热点租户拖垮全部。
- 告警确认使用 ETag 防覆盖；自动修复创建使用共享幂等存储。
- 写数据库与发布事件使用 Outbox，消费者做幂等。
- 全局多写会增加冲突与一致性成本；如果业务允许，可采用区域归属单写。
- 低优先级历史查询与高优先级告警写入分池、分队列和分配额。
- 采样不能丢掉所有错误 Trace；错误和高延迟请求应提高保留概率。

### 容量保护

- 每租户和每接口加权限流。
- 页大小、查询时间范围和导出规模设上限。
- 写入队列与连接池有界。
- 依赖慢时快速失败或降级，不让线程无限等待。
- 重试预算按整条调用链控制，避免每层重试放大。
- 压测包含热点、依赖慢、实例退出、区域切换和重试风暴。

### 发布与回滚

- OpenAPI 差异检查阻止意外破坏。
- 新旧版本并行，按租户灰度。
- 观测状态码、延迟、冲突率和业务结果，不只看 Pod 健康。
- 数据变更使用先扩展、后迁移、再收缩。
- 回滚前确认新版本写入的数据旧版本能否读取。

## REST、RPC、gRPC、GraphQL 与事件的选择

| 风格 | 适合 | 优点 | 代价 |
|---|---|---|---|
| RESTful HTTP API | 面向资源的外部/内部接口 | Web 生态成熟、语义和缓存丰富 | 复杂工作流可能需要额外建模 |
| RPC | 明确命令和过程调用 | 动作表达直接 | 容易把内部方法耦合给调用方 |
| gRPC | 内部低延迟、强类型调用 | Protobuf、流式、高效代码生成 | 浏览器和人工调试门槛更高 |
| GraphQL | 客户端需要灵活组合数据 | 减少过取/欠取，统一图模型 | 查询成本、缓存、授权和 N+1 治理更复杂 |
| 事件/消息 | 异步解耦、广播和削峰 | 生产者消费者时空解耦 | 最终一致、重复、顺序和追踪更难 |

选择不是站队。大型系统通常组合使用：

```text
外部资源 API
  -> 内部 gRPC
  -> 数据变更发布事件
  -> 长任务暴露 REST 状态资源
```

面试时要从调用方、延迟、耦合、一致性、可观测性和团队工具链解释选择。

## 面试回答

### 30 秒回答：什么是 REST

REST 是一组面向分布式超媒体系统的架构约束，包括客户端服务端分离、无状态、可缓存、统一接口、分层系统和可选的按需代码。工程里常用 HTTP 实现：URI 标识资源，方法表达操作语义，表示承载状态，状态码和 Header 让消息自描述。REST 不等于 JSON over HTTP，也不只是 URL 用名词。

### 3 分钟回答：如何设计生产级 RESTful API

我会先从业务资源和状态机建模，再定义 URI、方法、状态码和 Problem Details 错误契约；读接口考虑缓存与 ETag，写接口考虑 `If-Match` 防并发覆盖，非幂等操作考虑幂等键和结果查询。集合接口定义稳定排序、分页和过滤，长任务用 `202 + 任务资源`。契约用 OpenAPI 管理并在 CI 检测破坏性变更。生产上通过 OAuth 或其他机制认证，并做对象级授权、限流、超时、重试预算和敏感信息治理。架构层面评估网关、服务、数据库、队列和幂等存储的高可用。最后用按路由模板的指标、结构化日志、Trace 和审计形成排障证据，并准备灰度、弃用和回滚。

### 高频问题与连续追问

#### 1. REST 与 HTTP 的关系

回答主线：REST 是架构风格，HTTP 是协议；HTTP 提供资源、方法、表示、缓存和条件请求等机制，适合承载 REST。

追问：HTTP API 满足哪些条件才更接近 REST？

继续回答：不只路径资源化，还要满足无状态、缓存、自描述消息、分层和统一接口；严格 REST 还包含超媒体驱动状态。

#### 2. 幂等是什么，POST 怎么重试

回答主线：幂等是重复同一请求与执行一次的预期效果相同。POST 默认非幂等，可通过业务操作 ID 或幂等键、共享原子记录、请求指纹和结果重放实现安全重试。

追问：服务成功但保存幂等结果失败怎么办？

继续回答：幂等记录与业务副作用必须设计一致性边界，可用同库事务、唯一约束、状态机或 Outbox；不能把两步随意分开。

#### 3. PUT 与 PATCH

回答主线：PUT 对目标资源做创建或替换，具有幂等语义；PATCH 提交局部修改，是否幂等取决于补丁操作。

追问：`{"counter":1}` 是把计数器设为 1 还是加 1？

继续回答：契约必须明确。设值可以幂等，加一不是；对非幂等补丁要使用操作 ID、幂等键或专门命令资源。

#### 4. 如何避免并发覆盖

回答主线：GET 返回强 ETag，修改必须携带 `If-Match`；缺失返回 428，版本不匹配返回 412，客户端重新读取并合并。

追问：为什么不用数据库悲观锁？

继续回答：HTTP 交互跨网络且可能长时间停留，不能跨用户思考时间持有数据库锁；乐观并发更适合读多冲突少场景。高冲突业务再评估串行化或命令队列。

#### 5. 202 表示什么

回答主线：只表示请求已接受处理，不代表已完成。应返回可查询的任务资源和状态机。

追问：任务消息没入队却已返回 202 怎么办？

继续回答：数据库任务记录与 Outbox 同事务提交，由发布器可靠投递；监控 queued 超时并可重放。

#### 6. 401、403、404 的区别

回答主线：401 是认证凭据问题，403 是拒绝授权，404 是目标不存在。安全上可统一隐藏无权资源，但策略必须一致并可审计。

追问：401 为什么要有 `WWW-Authenticate`？

继续回答：它描述适用的认证挑战，让客户端知道需要哪种凭据，而不是只猜“登录失败”。

#### 7. `no-cache` 和 `no-store`

回答主线：`no-cache` 允许存储，但复用前要向源站验证；`no-store` 表示不应存储。

追问：为什么带 Authorization 的响应也要显式设计缓存？

继续回答：个性化和敏感响应若被共享缓存错误复用会跨用户泄露，需要 private/no-store、正确缓存键和网关策略。

#### 8. 429 后客户端如何处理

回答主线：读取 `Retry-After`，采用有上限的指数退避和随机抖动，遵守总时间预算，不对不可幂等写操作盲目重试。

追问：为什么只增加额度可能更糟？

继续回答：若根因是依赖变慢或重试风暴，放大流量会耗尽下游，使排队和超时继续恶化。

#### 9. 如何做 API 兼容升级

回答主线：优先兼容添加，OpenAPI 差异门禁，识别消费者，灰度双跑，用 Deprecation/Sunset 和迁移文档管理下线。

追问：新增枚举值算兼容吗？

继续回答：对只接受已知值并在未知值崩溃的客户端可能是破坏性变更，所以要按真实消费者行为评估。

#### 10. 如何排查 504

回答主线：先确认是哪一层生成 504，用 Trace 和各层日志拆分 DNS/TLS、网关排队、服务处理、连接池等待和数据库耗时；再检查超时预算与重试放大。

追问：能不能先把超时从 3 秒改成 30 秒？

继续回答：只有确认正常操作确实需要更长预算且容量可承受才调整；盲目增大可能让在途请求、连接和线程堆积。

#### 11. REST 如何支持高可用

回答主线：无状态交互利于实例横向扩展，但高可用仍依赖网关、服务、幂等存储、数据库、缓存和队列逐层设计。

追问：多区域下幂等键放哪里？

继续回答：取决于写入归属和一致性要求。可按租户固定写区域，或使用全局一致存储；如果采用最终一致复制，必须承认切换窗口的重复风险并补偿。

#### 12. OpenAPI 有什么局限

回答主线：它能描述接口结构和部分语义，但无法自动保证业务幂等、授权正确、容量合理或真正满足 REST；仍需设计评审、契约测试、故障实验和运行观测。

## 学习检查清单

### 入门层

- [ ] 能说清 REST 是架构风格，不是协议。
- [ ] 能区分资源、URI 和表示。
- [ ] 能解释 GET、POST、PUT、PATCH、DELETE 的语义。
- [ ] 能区分安全、幂等和可缓存。
- [ ] 能正确选择 200、201、202、204、400、401、403、404、409、412、422、428、429、500、502、503、504。
- [ ] 能用 `application/problem+json` 设计稳定错误体。
- [ ] 能运行本文入门实验。

### 实战层

- [ ] 能用 ETag 和条件请求防止并发覆盖。
- [ ] 能为非幂等写操作设计幂等记录。
- [ ] 能设计 offset/cursor 分页和稳定排序。
- [ ] 能设计异步任务资源与状态机。
- [ ] 能读写一份基础 OpenAPI 契约。
- [ ] 能解释 CORS 不是鉴权。
- [ ] 能用指标、日志和 Trace 排查 4xx、5xx 与长尾延迟。

### 大厂面试层

- [ ] 能解释 REST 六项约束和统一接口四个子约束。
- [ ] 能解释无状态与业务状态、数据库状态的边界。
- [ ] 能分析超时歧义、重试放大和跨实例幂等。
- [ ] 能设计网关、服务、数据库、缓存、队列的高可用。
- [ ] 能做容量预算、限流、背压、降级和热点隔离。
- [ ] 能设计对象级授权、敏感数据、审计和第三方 API 安全。
- [ ] 能设计兼容演进、弃用、灰度和回滚。
- [ ] 能完成本文事故题和 10 万 RPS 系统设计。

## GitHub 学习证据

建议提交以下目录：

```text
restful-api-learning/
  README.md
  openapi.yaml
  rest-api-lab.mjs
  tests/
    contract-notes.md
  evidence/
    01-get-etag.txt
    02-idempotency-replay.txt
    03-stale-etag-412.txt
    04-troubleshooting.md
    05-architecture.md
```

`README.md` 写清：

- 学习目标和官方资料。
- 如何启动与停止实验。
- 资源、方法、状态码和 Header 设计。
- 基础实验预期结果。
- 并发冲突故障注入过程。
- 你遇到的错误、证据、假设、验证和修复。
- 生产架构、容量、安全和回滚取舍。

可作为作品集的证据：

- 一份经过校验的 OpenAPI 文件。
- `curl.exe -i` 或 PowerShell 输出，敏感信息已脱敏。
- ETag 从 v1 到 v3 的实验记录。
- 相同幂等键重放得到同一任务 ID 的证据。
- 412 冲突的故障记录和正确合并方案。
- 一张请求数据路径和生产高可用架构图。
- 一份不夸大生产经验的事故分析。

不要提交真实 Token、Cookie、内网地址、客户数据和生产请求体。

## 学完之后

建议按下面顺序继续：

1. [网络基础](./networking.md)：补齐 DNS、TCP、TLS 与 HTTP 请求路径。
2. [FastAPI](../data-ai/fastapi.md)：用 Python 框架实现、校验和发布 API。
3. [微服务](../cloud-native/microservices.md)：学习服务发现、网关、熔断和分布式一致性。
4. [OpenTelemetry](../observability/opentelemetry.md)：把请求变成可关联的指标、日志和 Trace。
5. [Runbook Automation](../automation/runbook-automation.md)：为高风险自动化加入幂等、审批、审计和回滚。
6. [SLI / SLO / SLA](../sre-aiops/sli-slo-sla.md)：用接口可用性、延迟和正确性定义服务目标。

本文达到的是 RESTful HTTP API 从零到生产设计与大型企业面试的第一版主线，不代表只读一篇文章就能获得岗位。还需要继续练习网络、Linux、编程、数据库、分布式系统、系统设计、真实项目复盘和沟通表达。
