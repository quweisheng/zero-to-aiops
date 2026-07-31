# Dify 技术栈深讲

> 学习目标：从零理解 Dify 的应用、工作流、知识库、模型与插件体系，能用 Docker Compose 启动自托管环境，发布并调用第一个 Workflow API，能解释一次 AIOps 请求和一次知识索引任务经过哪些组件，并能按证据排查队列积压、检索失真、模型超时和升级故障。

## 版本与学习边界

本文在 2026 年 7 月 31 日核验，基线是 [Dify 1.16.1](https://github.com/langgenius/dify/releases/tag/1.16.1)。

版本边界必须先说清：

- Dify 迭代很快，应用类型、节点名称、环境变量和默认依赖可能随版本变化。
- 本文以 Community 自托管版和官方 Docker Compose 为主，不把 Dify Cloud、Premium 或企业版专有能力写成社区版承诺。
- Dify 的许可证是带附加条件的 Apache License 2.0 修改版，不应只写成“Apache 2.0”。多租户服务和前端标识存在额外限制，商业部署前必须阅读仓库当前的 [LICENSE](https://github.com/langgenius/dify/blob/1.16.1/LICENSE)。
- 本文讲 Dify 平台本身，不代替 [LLM / OpenAI API](./llm-openai.md)、[RAG](./rag.md)、[向量数据库](./vector-database.md)、[LangChain](./langchain.md)、[Docker Compose](../cloud-native/docker-compose.md) 和 [RESTful API](../foundation/restful-api.md) 的专项学习。
- 文章中的生产容量数字都是设计方法，不是所有公司的固定参数。真实值必须通过自己的模型、知识库、节点和并发压测得到。

## 官方资料

- [Dify 官方文档](https://docs.dify.ai/)
- [Dify GitHub 仓库](https://github.com/langgenius/dify)
- [Dify Releases](https://github.com/langgenius/dify/releases)
- [Docker Compose 部署](https://docs.dify.ai/en/self-host/deploy/quick-start/docker-compose)
- [环境变量参考](https://docs.dify.ai/en/self-host/deploy/configuration/environments)
- [Workflow 与 Chatflow](https://docs.dify.ai/en/self-host/use-dify/build/workflow-chatflow)
- [节点目录](https://docs.dify.ai/en/self-host/use-dify/nodes/user-input)
- [知识库](https://docs.dify.ai/en/self-host/use-dify/knowledge/readme)
- [索引与检索设置](https://docs.dify.ai/en/self-host/use-dify/knowledge/create-knowledge/setting-indexing-methods)
- [发布应用](https://docs.dify.ai/en/self-host/use-dify/publish/README)
- [监控日志](https://docs.dify.ai/en/self-host/use-dify/monitor/logs)
- [API 入门](https://docs.dify.ai/en/api-reference/guides/get-started)
- [Workflow API](https://docs.dify.ai/en/api-reference/guides/workflow)
- [插件开发](https://docs.dify.ai/en/develop-plugin/getting-started/introduction)
- [安全公告](https://github.com/langgenius/dify/security/advisories)

说明：本文基于官方文档、官方 Compose 配置、官方源码仓库和发布记录重新组织，保留链接，不复制官方全文。遇到界面或参数不同，先确认自己的 Dify 版本，再查对应 tag 的文档和 `.env.example`。

## 官方知识地图

官方资料可以拆成六条主线：

```text
Dify
  -> Build
     -> Basic Apps
     -> Workflow / Chatflow
     -> Agent
     -> nodes / variables / error handling
  -> Knowledge
     -> datasource
     -> parse / clean / chunk
     -> embedding / index
     -> retrieve / rerank
  -> Integrations
     -> model providers
     -> tools
     -> plugins
  -> Publish
     -> Web App
     -> REST API
     -> embed
     -> MCP Server
  -> Monitor
     -> dashboard
     -> logs / feedback
     -> tracing integrations
  -> Self-host
     -> Docker Compose
     -> environment variables
     -> storage / migration
     -> troubleshooting
```

本文按下面的运维主线学习：

```text
先跑通一个无模型 Workflow
  -> 理解节点、变量和发布
  -> 接入模型、工具和知识库
  -> 追踪同步请求与异步索引路径
  -> 掌握数据库、Redis、向量库和对象存储状态
  -> 做容量、安全、高可用和升级设计
  -> 注入 Worker 故障并恢复
  -> 形成 AIOps 项目和面试证据
```

## 建议学习路线

### 第一天：会用

- 能区分 Workflow、Chatflow、Agent 和普通聊天应用。
- 能在画布上连接 User Input、Template、Output 三个节点。
- 能测试、发布并通过 API 调用应用。
- 能从运行历史看到每个节点的输入、输出、耗时和错误。

### 第一周：懂机制

- 能画出在线调用和知识索引两条数据路径。
- 能解释 PostgreSQL、Redis、Worker、向量库、对象存储、Sandbox 与 Plugin Daemon 的职责。
- 能区分模型错误、工作流错误、检索错误和平台故障。
- 能处理 API Key、SSE、用户身份、超时和重试。

### 生产与面试层：能设计、能排障

- 能设计高可用、容量保护、备份、升级和回滚。
- 能处理知识索引积压、模型限流、向量检索失真、数据库连接耗尽和插件异常。
- 能给 AIOps 自动化动作增加只读优先、审批、幂等、审计与回滚护栏。
- 能解释 Dify 与 LangChain、自研平台、RAG、模型 API 的边界和取舍。

## 场景开场：告警助手回答得很快，却给出了旧 Runbook

凌晨两点，数据库连接池告警触发。值班员把告警贴给内部助手，助手很快给出“重启应用”的建议。

问题是：当天刚更新的 Runbook 明确要求先检查数据库连接数，禁止直接重启。Dify 页面里能看到新文件，助手却一直引用旧步骤。

这不是一句“模型幻觉”就能解释的问题。你至少要问：

- 新文件是否已经完成解析、切分和索引？
- Worker 是否消费了索引任务？
- 文档使用的是哪个 Embedding 模型？
- 查询是否走到了正确的知识库？
- 检索返回了哪些 Chunk，分数和元数据是什么？
- 发布中的应用是否仍引用旧版本知识配置？
- 最终回答是否忠实于检索证据？

Dify 的价值，是把这些步骤做成可编排、可发布、可观察的应用；运维人员的价值，是知道每一层保存什么状态、哪里会坏、如何证明。

## 一句话人话版

Dify 是一个把模型、知识、工具和流程组装成可发布 AI 应用的平台，并提供界面、API、运行记录和自托管能力。

## 小白最容易问的十个问题

### Dify 是一个大模型吗

不是。Dify 是应用平台，模型通常来自外部模型服务或本地推理服务。没有可用的模型提供方，LLM 节点就不能正常生成。

### Dify 和 ChatGPT 是一回事吗

不是。ChatGPT 是面向用户的产品；Dify 用来构建自己的 AI 应用，可以连接不同模型、知识库和工具。

### Dify 和 LangChain 有什么区别

LangChain 更像代码库和运行时组件；Dify 提供可视化编排、应用发布、团队空间、日志和自托管平台。复杂深度定制更适合代码框架，快速交付和可视化治理更适合 Dify，两者也可以组合。

### Dify 自带模型吗

不能把“平台能选择模型”理解成“自托管后免费获得模型算力”。模型能力仍需要配置模型提供方、API Key 或可访问的本地推理端点。

### Workflow 和 Chatflow 有什么区别

Workflow 一次输入、执行、输出，适合批处理或自动化；Chatflow 带会话上下文，每条消息都会触发流程，适合交互式助手。

### Agent 和 Workflow 有什么区别

Workflow 的路径主要由人预先画好；Agent 会让模型在运行时决定调用哪些工具和何时结束。Agent 更灵活，也更难预测和控制。

### 知识库上传完成就能检索吗

不一定。上传之后还有解析、清洗、切分、Embedding 和写入索引等异步阶段，要看到索引完成并通过 Test Retrieval 验证。

### Redis 只是缓存吗

不是。在默认自托管架构里，Redis 还参与 Celery 任务队列、运行时协调等路径。Redis 故障可能让索引和后台任务停滞。

### 停掉 Dify 会不会丢工作流

是否丢失取决于持久化数据是否还在。工作流、账号和运行状态主要在数据库，文件在对象或本地存储，向量在向量库。删除卷或只恢复其中一部分都会产生不一致。

### 可视化编排是不是不用懂代码和运维

不是。画布降低了开发门槛，但生产环境仍需要理解 API、网络、数据库、队列、模型、权限、成本、可观测性和故障恢复。

## 为什么要学

Dify 对 AIOps 的价值不是“让 AI 自动修一切”，而是提供一层应用编排和治理入口：

- 把告警、日志、指标、变更、CMDB 和 Runbook 接到同一个流程。
- 把自然语言分析与确定性规则、API 调用、人审节点组合起来。
- 把知识检索的 Chunk、模型调用、节点耗时和结果留成证据。
- 把内部助手发布成 Web App 或后端 API。
- 让平台团队统一管理模型、凭据、应用版本和运行记录。

学习它还能训练这些通用能力：

- 设计异步任务和最终一致性。
- 分析多存储系统的数据边界。
- 处理外部模型的超时、限流和成本。
- 为 AI 自动化建立最小权限、审批、审计和回滚。

## Dify 到底是什么

Dify 是面向生成式 AI 应用的开发与运行平台。它把下面几类能力放到一个工作区里：

- 应用：Chatbot、Text Generator、Workflow、Chatflow、Agent 等。
- 模型：聊天、Embedding、Rerank、语音等模型提供方。
- 工作流：用节点和边表达输入、分支、循环、工具、模型和输出。
- 知识：文档导入、切分、索引、检索和元数据管理。
- 插件：扩展模型、工具、数据源、Agent 策略、触发器和 Endpoint。
- 发布：Web App、REST API、嵌入和其他集成入口。
- 监控：运行历史、会话日志、Token、延迟、错误、反馈与外部追踪。
- 自托管：用多个容器部署 API、Web、Worker、数据库、Redis、向量库和安全隔离组件。

Dify 不负责替你保证：

- 模型回答一定正确。
- 外部 API 一定可用。
- RAG 一定召回正确文档。
- 多个存储之间天然强一致。
- AI 自动操作天然安全。
- 默认 Compose 直接满足大型生产高可用。

## 它解决什么问题

### AI 应用工程重复

如果每个团队都重复编写聊天 UI、SSE、模型适配、知识索引、日志、API 鉴权和管理后台，交付很慢。Dify提供了统一平台。

### 模型调用缺少确定性流程

只给模型一段 Prompt，容易漏步骤。Workflow 用条件、变量、工具和错误处理把关键步骤固定下来。

### 知识与应用脱节

文档上传、Chunk、Embedding、检索、Rerank、Prompt 拼装和答案验证需要一条完整链路。Dify 把它们放进一个可观察流程。

### 试验难以发布和治理

一个 Prompt Demo 不等于生产服务。Dify 补了应用 API、用户标识、运行历史、版本和团队空间，但生产容量与安全仍需平台工程补齐。

## 核心原理

## 核心概念一：Workspace、App 与发布版本

### 是什么

Workspace 是团队资源边界，App 是一套可运行的 AI 应用配置。发布把编辑中的配置变成用户或 API 可调用的版本。

### 为什么需要

如果编辑画布的每次修改立即影响线上用户，测试一个 Prompt 就可能造成生产事故。工作区、应用和发布边界让研发与运行状态分开。

### 怎么工作

```text
workspace
  -> model credentials / plugins / members
  -> app draft
     -> nodes / prompts / variables / knowledge references
  -> test run
  -> publish
  -> Web App / API consumers
```

草稿和已发布版本不是同一个概念。修改后必须重新发布，调用方才会使用新配置。

### 怎么用或观察

- 在 Studio 创建应用。
- Test Run 验证草稿。
- 发布后记录版本、发布时间和变更说明。
- 从运行日志确认请求实际用了哪个应用和工作流版本。
- 把 DSL 导出到 Git，保留评审和回滚证据。

### 坏了怎么查

看到“页面已经改了但 API 结果没变”时，先查：

1. 是否只改了草稿，没有发布。
2. 调用的 API Key 是否属于另一个 App。
3. URL 是否指向另一套环境。
4. 线上运行记录的 Workflow 版本是否正确。
5. 缓存、网关或调用方是否复用了旧响应。

## 核心概念二：Workflow、Chatflow 与节点

### 是什么

Workflow 是一次性有向执行图；Chatflow 在执行图上增加会话交互。节点负责输入、模型、知识检索、代码、工具、条件、循环、人工确认和输出等单项工作。

### 为什么需要

模型擅长不确定性理解，规则和 API 擅长确定性处理。把它们拆成节点，可以让关键判断可测试、可重试、可观察。

### 怎么工作

```text
User Input / Trigger
  -> validate
  -> IF/ELSE
  -> Knowledge Retrieval
  -> LLM
  -> Tool / HTTP Request
  -> Human Input
  -> Output / Answer
```

Workflow 通常从 User Input 或 Trigger 开始，可以用 Output 返回结果。Chatflow 从用户输入开始，并用 Answer 节点生成对话响应。

### 怎么用或观察

- 给节点和变量使用业务含义明确的名称。
- 对关键节点单独 Test Run。
- 在 Run History 查看节点输入、输出、耗时、Token 和错误。
- 为外部调用设置超时、错误分支和降级结果。
- 对写操作增加 Human Input 或审批工具。

### 坏了怎么查

1. 在运行历史定位第一个失败节点，不要只看最终错误。
2. 检查上游变量类型和值是否符合节点输入。
3. 检查失败策略是停止、默认值、错误分支还是重试。
4. 检查循环次数、并行度和最大执行时间。
5. 检查模型、工具或 HTTP 节点的外部依赖。

## 核心概念三：Model Provider、Tool 与 Plugin

### 是什么

- Model Provider 把聊天、Embedding、Rerank、语音等模型接入 Dify。
- Tool 是可被节点或 Agent 调用的外部能力。
- Plugin 是扩展包装，可以提供模型、工具、数据源、Agent 策略、触发器或 Endpoint。
- Plugin Daemon 是自托管架构里运行和管理插件的重要服务。

### 为什么需要

平台核心不可能内置所有模型和外部系统。插件体系把变化快、权限不同的能力从核心服务中分离。

### 怎么工作

```text
Workflow / Agent
  -> Dify API
  -> Plugin Daemon
  -> installed plugin runtime
  -> model / tool / datasource / external API
  -> result
  -> workflow node
```

Agent Strategy 决定“怎样选择和调用工具”，Tool 负责“执行一个具体能力”，两者不能混为一谈。

### 怎么用或观察

- 在 Workspace 的 Model Providers 配置模型凭据。
- 在 Plugins 检查安装版本、权限和来源。
- 先在独立节点测试模型或工具，再放入复杂流程。
- 查看 `plugin_daemon` 日志和插件自己的结构化日志。
- 生产使用签名插件，并固定版本和来源。

### 坏了怎么查

1. 模型凭据是否有效，Endpoint 是否可达。
2. Plugin Daemon 是否健康。
3. 插件版本是否兼容当前 Dify。
4. 外部 API 是否超时、限流或证书失败。
5. 插件是否请求了不必要的网络、文件或凭据权限。

## 核心概念四：Knowledge 与 RAG

### 是什么

Knowledge 是 Dify 的知识管理与检索能力。RAG 是先检索证据，再把证据交给模型生成回答的模式。

### 为什么需要

模型参数里的知识可能过时，也不知道公司的 Runbook、CMDB 和事故记录。检索可以在不重新训练模型的情况下提供当前私有证据。

### 怎么工作

离线索引路径：

```text
file / text / datasource
  -> upload
  -> parse
  -> clean
  -> split into chunks
  -> embedding model
  -> vector index
  -> indexing completed
```

在线检索路径：

```text
user query
  -> query embedding
  -> vector / full-text / hybrid retrieval
  -> metadata filter
  -> optional rerank
  -> top-k chunks
  -> prompt context
  -> LLM answer with evidence
```

高质量索引使用 Embedding，把 Chunk 变成向量。检索策略可以是向量、全文或混合检索。向量相近只表示语义相似，不等于答案一定正确。

官方还区分高质量索引和经济索引：

- 高质量索引使用 Embedding，支持向量、全文和混合检索，语义能力更强但会产生模型与向量存储成本。
- 经济索引使用倒排索引，更接近关键词匹配，成本较低。
- 高质量知识库创建后不能直接切换为经济索引；变更索引方式要先确认迁移或重建路径。

### 怎么用或观察

- 先设计文档边界、Chunk 大小、重叠和元数据。
- 上传后等待索引状态完成。
- 用 Test Retrieval 保存问题、命中 Chunk、分数和预期答案。
- 给知识检索节点显式配置知识库、Top K、阈值和元数据过滤。
- 更新文档后做回归问题集，不只看一个样例。

### 坏了怎么查

1. 索引状态是否停在 waiting、parsing、splitting 或 indexing。
2. Worker 和 Redis 是否正常。
3. Embedding Provider 是否可用、是否限流。
4. 向量库是否可写，维度是否与模型匹配。
5. 查询是否选错知识库、过滤条件或发布版本。
6. Chunk 是否太碎、太长或缺少标题上下文。
7. 检索命中正确但回答错误时，再检查 Prompt 和模型忠实度。

## 核心概念五：App API、SSE 与 End User

### 是什么

发布后的应用可以通过 REST API 调用。`response_mode` 可以使用阻塞 JSON，或使用 Server-Sent Events（SSE，服务器持续向客户端推送事件）流式返回。

### 为什么需要

企业应用通常不会让用户直接进入 Dify 控制台，而是由自己的后端调用 Dify API，并接入权限、审计和业务界面。

### 怎么工作

```text
business backend
  -> Authorization: Bearer app-api-key
  -> POST /v1/workflows/run
  -> Dify executes workflow
  -> blocking JSON
     or
  -> text/event-stream
```

每次调用还要带稳定的 `user`，用于区分终端用户和限定相关数据访问范围。这个值由调用方定义，不等于 Dify 管理员账号。

### 怎么用或观察

- API Key 只保存在后端或密钥系统。
- 阻塞模式适合短任务；流式模式适合长时间生成和即时反馈。
- 记录 `task_id`、`workflow_run_id`、HTTP 状态、总耗时和调用方请求 ID。
- 客户端要处理 SSE 断线、重复事件、结束事件和错误事件。

### 坏了怎么查

1. 401：Key 缺失、错误或属于另一个应用。
2. 404：Base URL 或路由错误。
3. 400：输入字段、类型或文件参数不符合应用契约。
4. SSE 中断：检查代理缓冲、读超时、连接上限和客户端解析。
5. 200 但业务失败：检查响应体里的运行状态和节点错误，不要只看 HTTP。

## 核心概念六：API、Worker、Beat 与 Redis 队列

### 是什么

- `api` 处理控制台和应用 API。
- `worker` 消费 Celery 后台任务，例如知识索引等异步工作。
- `worker_beat` 负责周期任务调度。
- Redis 可以作为 Celery Broker（任务中转队列），也承担缓存和部分运行时协调。

### 为什么需要

解析大文件、生成 Embedding、发送邮件和清理日志不应长期阻塞 HTTP 请求。异步队列让前台快速受理，后台慢慢处理。

### 怎么工作

```text
API accepts job
  -> write job state
  -> enqueue message to Redis
  -> Worker consumes
  -> call parser / embedding / vector store
  -> update progress and final state
```

这条链路通常是最终一致：API 返回“已受理”时，不代表向量已经可检索。

### 怎么用或观察

- `docker compose ps` 检查服务状态。
- `docker compose logs worker` 看任务消费。
- 观察等待任务数、最老任务年龄、成功率、重试率和耗时。
- Worker 可以按队列和负载扩容。
- Beat 应避免多个调度器同时产生重复周期任务。

### 坏了怎么查

1. Redis 连接是否正常。
2. Worker 是否启动、是否订阅正确队列。
3. 队列是否积压，最老任务多久。
4. 任务是在重试还是永久失败。
5. 下游模型、向量库、对象存储是否拖慢 Worker。

## 核心概念七：Code、Sandbox 与 SSRF Proxy

### 是什么

Code 节点可以执行受限 Python 或 JavaScript；Sandbox 提供隔离执行环境。SSRF Proxy 用于限制服务端请求伪造风险，防止任意 URL 访问内部敏感网络。

### 为什么需要

允许工作流执行代码或访问 URL 会扩大攻击面。没有隔离、超时、网络边界和资源限制，Prompt 或用户输入可能被转化成危险动作。

### 怎么工作

```text
workflow Code node
  -> sandbox service
  -> limited runtime
  -> result

HTTP / tool outbound request
  -> SSRF proxy policy
  -> allowed external target
```

### 怎么用或观察

- 代码节点只做纯计算和格式转换。
- 不在代码里硬编码密钥。
- 对 HTTP 目标使用域名白名单、超时和响应大小限制。
- 查看 `sandbox`、`ssrf_proxy` 和 `agent_ssrf_proxy` 日志。
- 把危险写操作放到受控工具中，而不是任意代码节点。

### 坏了怎么查

1. Sandbox API Key 和内部地址是否匹配。
2. 代码是否超时、超内存或使用了不支持的库。
3. SSRF 代理是否阻止了目标地址。
4. DNS、TLS、代理和防火墙是否正常。
5. 不要为了“先跑通”直接关闭所有安全控制。

## 核心概念八：运行日志、Trace 与评估

### 是什么

运行日志记录输入、输出、节点、模型、Token、延迟和错误。Trace 把一次请求跨节点和外部服务的时间关系串起来。评估则判断答案质量，而不仅是接口成功。

### 为什么需要

AI 应用可能技术上 200 成功、业务上却回答错误。只看容器健康不能证明检索质量和回答质量。

### 怎么工作

```text
request
  -> application log
  -> workflow run
  -> node execution
  -> model / retrieval / tool spans
  -> feedback / evaluation dataset
```

### 怎么用或观察

- 在应用 Logs 查看真实调用，不把 Test Run 当生产流量。
- 开启结构化平台日志并进入集中日志系统。
- 接入官方支持的 Langfuse、LangSmith、Phoenix、Arize、Opik 或 OpenTelemetry 目标时，先做数据脱敏。
- 建立固定问题集，记录召回、引用、正确性、延迟和成本。

### 坏了怎么查

1. 先用请求 ID 或 `workflow_run_id` 找到一次完整运行。
2. 定位最慢或第一个失败节点。
3. 比较模型延迟、检索延迟、工具延迟和排队时间。
4. 检查日志是否因为保留策略被清理。
5. 检查追踪采样、Exporter、网络和敏感数据策略。

## Agent 与 New Agent 的生产边界

截至本文版本，经典 Agent 与 New Agent 不是同一个运行边界：

- 经典 Agent 主要让模型通过 Function Calling 或 ReAct 循环选择工具。
- New Agent 仍是 Beta 能力，可以执行命令、安装软件并读写文件，风险明显高于普通文本 Workflow。
- Community 版 New Agent 的运行时不能当作不受信任用户或工作负载之间的强安全隔离边界。

生产使用时：

1. 先限制可用工具、最大步骤、时间、成本和出站网络。
2. 替换所有 Agent Backend 与 Sandbox 的开发默认密钥。
3. 对不可信代码使用独立主机、集群、容器或虚拟机级隔离。
4. 使用短期最小权限凭据，不把宿主机和生产管理凭据挂入运行环境。
5. 同时检查 `agent_backend`、`local_sandbox` 和 `agent_ssrf_proxy`，不要只看最终聊天错误。

即使 Agent 能执行命令，也不能绕过业务审批、参数白名单、审计、结果验证和回滚。

## 架构和数据流

## 官方 Docker Compose 组件

Dify 1.16.1 官方快速部署会启动七个核心服务：

| 服务 | 作用 | 典型故障表现 |
|---|---|---|
| `api` | 后端 API、应用与控制台逻辑 | 页面/API 5xx、鉴权或数据库错误 |
| `api_websocket` | 工作流实时协作 WebSocket | 多人编辑不同步、连接频繁断开 |
| `worker` | Celery 后台任务消费 | 知识索引、邮件等异步任务积压 |
| `worker_beat` | 周期任务调度 | 清理、定时任务未触发或重复 |
| `web` | 控制台和发布应用前端 | 页面空白、静态资源或 API 地址错误 |
| `plugin_daemon` | 插件安装与调用运行边界 | 模型、工具、插件调用失败 |
| `agent_backend` | 新 Agent 的后端能力 | Agent 运行失败或相关 API 异常 |

默认还包括 PostgreSQL、Redis、Nginx、Weaviate、Sandbox、Local Sandbox、两个 SSRF Proxy 等依赖，以及一次性权限初始化任务。

默认依赖只是学习起点，不等于生产必须使用同一数据库、向量库或存储实现。

## 在线 Workflow 请求路径

```text
client / business backend
  -> Load Balancer / Nginx
  -> api
     -> authenticate App API Key
     -> load published app and workflow from database
     -> create workflow run state
     -> execute graph
        -> Knowledge Retrieval
           -> vector store
        -> LLM / Rerank
           -> model provider plugin
           -> external or local model endpoint
        -> Code
           -> sandbox
        -> Tool / HTTP
           -> plugin daemon / SSRF proxy
     -> persist logs and outputs
  -> blocking JSON or SSE events
  -> client
```

排障时必须回答“慢在哪里”：

- 网关排队或连接建立。
- API 读取配置和数据库连接。
- Workflow 引擎调度。
- 知识检索。
- 模型首 Token 和总生成。
- 工具调用。
- SSE 代理缓冲或客户端消费。

## 知识索引路径

```text
user uploads document
  -> api stores metadata and original file
  -> task enters Redis broker
  -> worker consumes task
  -> parser extracts content
  -> cleaner and splitter create chunks
  -> embedding provider creates vectors
  -> vector store writes index
  -> database updates indexing status
  -> knowledge becomes retrievable
```

上传成功、任务入队、向量写入和状态完成是不同的阶段。只恢复数据库而没有恢复对象存储和向量数据，页面可能看得到文档记录，却无法正确预览或检索。

## 状态与一致性

| 状态 | 常见保存位置 | 一致性重点 |
|---|---|---|
| 账号、Workspace、App、Workflow、运行记录 | PostgreSQL 或受支持关系库 | 主要业务元数据，升级涉及 Schema |
| 异步任务与运行时协调 | Redis | Broker 故障会积压，重试可能产生重复副作用 |
| 文档原文件、上传文件、工具产物 | 本地卷或对象存储 | 必须与数据库引用一起备份恢复 |
| Chunk 向量与索引 | Weaviate 或其他向量库 | 与 Embedding 模型、维度和文档版本关联 |
| 插件安装与运行数据 | Plugin Daemon 及其存储 | 版本、签名、凭据与工作区隔离 |
| 模型结果 | 外部模型提供方与 Dify 日志 | 不可假设确定性，受限流、模型升级影响 |

从官方组件分工可以推断：跨数据库、对象存储、向量库和外部模型时，不能默认存在一个覆盖所有组件的全局 ACID 事务。这是架构推论，不是官方的一致性承诺。生产设计要接受并治理最终一致：

- 每个异步任务有稳定 ID。
- 重试写操作必须幂等。
- 记录当前阶段与最后错误。
- 提供重建索引和补偿任务。
- 恢复后做业务级一致性校验。

## 安装与启动

## 前置条件

官方最低硬件要求是：

- CPU 至少 2 核。
- 内存至少 4 GiB。

Windows 使用 WSL 2 和 Docker Desktop。官方提醒把 Linux 容器使用的源码与绑定数据放在 Linux 文件系统中，避免 Windows 文件系统带来的性能和权限问题。Docker Compose 需要 2.24.0 或更高版本。

先检查：

```powershell
docker version
docker compose version
git --version
```

预期结果：三条命令都能输出版本，Docker Engine 状态为可连接。

## 固定版本部署

学习和生产都不要无意中追随 `main`。本文基线：

```powershell
git clone --branch 1.16.1 --depth 1 https://github.com/langgenius/dify.git
Set-Location .\dify\docker
Copy-Item .env.example .env
docker compose up -d
docker compose ps
```

预期结果：

- 核心和依赖容器为 `Up` 或 `healthy`。
- `init_permissions` 运行完成后退出属于正常现象。
- 打开 `http://localhost/install` 可以初始化管理员。

首次启动前至少修改：

```dotenv
SECRET_KEY=<用 openssl rand -base64 42 生成>
INIT_PASSWORD=<只用于保护首次安装页的临时强密码>
DB_PASSWORD=<新的数据库强密码>
REDIS_PASSWORD=<新的 Redis 强密码>
SANDBOX_API_KEY=<新的随机值>
PLUGIN_DAEMON_KEY=<新的随机值>
```

不要把真实 `.env`、模型 API Key、应用 API Key 提交到 GitHub。

## 启动后的最小检查

```powershell
docker compose ps
docker compose logs --tail 100 api
docker compose logs --tail 100 worker
docker compose logs --tail 100 plugin_daemon
Invoke-WebRequest http://localhost -UseBasicParsing
```

验证：

- 首页 HTTP 状态为 200。
- API 日志没有持续数据库迁移或连接错误。
- Worker 没有持续重连 Redis。
- Plugin Daemon 没有持续鉴权或存储错误。

如果失败，先检查：

1. Docker 分配内存是否足够。
2. 80、443、5001 等端口是否冲突。
3. `.env` 是否从当前版本的 `.env.example` 复制。
4. 数据卷权限是否正常。
5. 数据库、Redis、向量库是否健康。

## 配置详解

## URL 与反向代理

| 配置 | 用途 | 生产提示 |
|---|---|---|
| `CONSOLE_API_URL` | 浏览器访问控制台后端的公开地址 | OAuth 回调和安全 Cookie 依赖正确 HTTPS 地址 |
| `SERVER_CONSOLE_API_URL` | Web 容器访问 API 的内部地址 | 默认走容器网络，不要误填公网回环 |
| `CONSOLE_WEB_URL` | 控制台公开地址 | 邮件邀请和重置链接依赖它 |
| `SERVICE_API_URL` | 控制台展示给开发者的应用 API Base URL | 多域名环境要显式设置 |
| `APP_API_URL` | 已发布 Web App 使用的后端地址 | 反向代理拆域时重点检查 |
| `APP_WEB_URL` | 已发布 Web App 地址 | Human Input 表单链接依赖它 |
| `TRIGGER_URL` | Webhook 和集成 Trigger 的公开回调地址 | 必须能被外部系统访问 |
| `FILES_URL` | 文件预览和下载的公开地址 | 错误会导致图片、附件和模型文件访问失败 |
| `INTERNAL_FILES_URL` | 容器内部访问文件的地址 | 解决内部服务无法回源公网域名的问题 |

反向代理需要特别处理：

- SSE 不能被长时间缓冲。
- WebSocket 路径要转发 `Upgrade` 与 `Connection`。
- 读超时要覆盖最长允许执行时间。
- 上传大小要覆盖知识文档上限。
- TLS 终止后要正确传递 Host 和协议头。

## 服务与安全配置

| 配置 | 用途 | 常见坑 |
|---|---|---|
| `SECRET_KEY` | Cookie、JWT、文件签名和 OAuth 凭据加密 | 上线后随意更换会让会话和已加密凭据失效 |
| `INIT_PASSWORD` | 保护首次 `/install` 管理员初始化 | 留空并直接暴露公网可能被抢先初始化 |
| `LOG_LEVEL` | 日志最低级别 | 长期开 DEBUG 会增加噪声和泄露风险 |
| `LOG_OUTPUT_FORMAT` | 文本或 JSON 日志 | 生产建议 JSON 进入日志平台 |
| `ENABLE_REQUEST_LOGGING` | 记录请求摘要 | DEBUG 下可能包含请求/响应体，先评估敏感信息 |
| `MIGRATION_ENABLED` | 容器启动时执行数据库迁移 | 多副本同时迁移风险大，生产应设计单独迁移 Job |
| `APP_MAX_EXECUTION_TIME` | 应用最大执行时间 | 只加大超时会放大资源占用 |
| `APP_MAX_ACTIVE_REQUESTS` | 每应用并发上限 | 默认无限不代表生产应该无限 |
| `SERVER_WORKER_AMOUNT` | API Gunicorn Worker 数 | 要与 CPU、数据库连接池一起预算 |
| `CELERY_WORKER_AMOUNT` | 后台 Worker 并发 | 盲目增加可能打爆模型、数据库或向量库 |
| `VECTOR_STORE` | 向量库实现 | 切换时需要数据迁移或重建索引 |
| `STORAGE_TYPE` | 文件存储实现 | 多副本不能依赖只存在某台机器的本地文件 |

## 模型配置

模型提供方至少要分开管理：

- Chat/Completion：生成回答或结构化结果。
- Embedding：把文本或图片转换成向量。
- Rerank：对候选 Chunk 再排序。
- Speech-to-Text / Text-to-Speech：语音能力。
- Moderation：内容审核。

生产配置要记录：

- Provider 和模型 ID。
- Endpoint 与区域。
- 上下文窗口、输出 Token 上限。
- 每分钟请求数和 Token 限额。
- 超时、重试、降级模型。
- 数据是否离开企业边界。
- 模型升级和回归评估日期。

## 常用命令字典

| 命令 | 目的 | 正常结果 | 异常时先看 |
|---|---|---|---|
| `docker compose ps` | 查看服务状态 | 核心服务 Up/healthy | 退出码、健康检查和依赖 |
| `docker compose logs --tail 200 api` | 查看 API 日志 | 请求和启动无持续 ERROR | DB、Redis、配置、迁移 |
| `docker compose logs --tail 200 worker` | 查看异步任务 | 能消费任务，无重试风暴 | Broker、模型、向量库 |
| `docker compose logs --tail 200 plugin_daemon` | 查看插件服务 | 插件注册与调用正常 | Key、签名、网络、版本 |
| `docker compose logs --tail 200 sandbox` | 查看代码执行 | 调用正常，无超时 | API Key、资源、代码限制 |
| `docker compose config --quiet` | 校验 Compose 展开结果 | 无输出且退出码 0 | `.env`、profiles、语法 |
| `docker compose stop worker` | 停止后台任务消费 | Worker 变为 Exited | 只用于隔离实验或维护 |
| `docker compose start worker` | 恢复后台任务消费 | Worker Up | 日志和 Redis 连接 |
| `docker compose pull` | 拉取配置中的镜像 | 镜像下载成功 | Registry、代理、磁盘 |
| `docker compose down` | 停止并移除容器网络 | 数据卷默认保留 | 不要随意加 `-v` |

危险边界：

- `docker compose down -v` 会删除 Compose 管理的卷，可能永久清除数据库、Redis、向量和文件数据。
- 不要在没有备份和恢复演练时执行。
- 生产排障不要为了“快速恢复”同时删除多个状态存储。

## App API 字典

| 接口或字段 | 作用 | 常用写法 | 关键点 |
|---|---|---|---|
| `GET /v1/info` | 验证 API Key 并读取 App 信息 | Bearer App Key | Key 必须在服务端 |
| `POST /v1/workflows/run` | 运行 Workflow | JSON Body | `inputs`、`user` 必填 |
| `POST /v1/chat-messages` | 调用 Chatflow/聊天类应用 | blocking 或 streaming | 对话还涉及 `conversation_id` |
| `inputs` | 工作流输入对象 | `{"alert_text":"..."}` | Key 和类型与 User Input 一致 |
| `user` | 终端用户稳定标识 | `oncall-001` | 同一用户要保持一致，不放敏感明文 |
| `response_mode` | 响应方式 | `blocking` / `streaming` | SSE 要处理断线与结束事件 |
| `task_id` | 运行中的任务 ID | 用于停止任务 | 不等于持久运行记录 ID |
| `workflow_run_id` | 持久的 Workflow 运行记录 ID | 用于查询和关联日志 | 应写入调用方日志 |

PowerShell 调用模板：

```powershell
$headers = @{
  Authorization = "Bearer $env:DIFY_APP_API_KEY"
  "Content-Type" = "application/json"
}

$body = @{
  inputs = @{
    alert_text = "payment-api p99 latency is 2.8s"
  }
  response_mode = "blocking"
  user = "aiops-lab-user"
} | ConvertTo-Json -Depth 5

Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost/v1/workflows/run" `
  -Headers $headers `
  -Body $body
```

安全提示：环境变量只是学习环境的便捷方式。生产使用密钥管理系统，限制读取权限，定期轮换并审计调用。

## 在 AIOps 中的作用

## 场景一：只读告警分析助手

```text
Alertmanager / ticket
  -> normalize fields
  -> query metrics read-only
  -> retrieve runbook and recent incidents
  -> LLM produces structured hypothesis
  -> output
     evidence
     missing information
     ranked hypotheses
     safe next checks
```

第一版只接只读工具。没有证据时明确返回“不足以判断”，而不是编造根因。

## 场景二：变更风险审查

输入变更单、服务依赖、历史事故和 SLO：

```text
change request
  -> validate required fields
  -> retrieve similar changes
  -> query current SLO and error budget
  -> classify risk
  -> human approval
  -> return checklist
```

Dify 可以编排审查，但最终发布权限仍在 CI/CD 和审批系统，不把集群管理员凭据交给模型。

## 场景三：Runbook 建议到受控执行

成熟度应分层：

```text
L0 仅检索证据
  -> L1 生成建议
  -> L2 生成待审批操作单
  -> L3 执行白名单、幂等、可回滚动作
  -> L4 在严格 SLO 和审计下自动闭环
```

每次写操作需要：

- 明确目标、环境和爆炸半径。
- 参数 Schema 校验。
- 最小权限服务账号。
- 幂等键或任务 ID。
- 人工审批或策略门禁。
- 执行前后验证。
- 超时、取消和回滚。
- 完整审计记录。

## AIOps 数据契约示例

模型自由文本不适合作为自动化输入。让 Workflow 输出稳定结构：

```json
{
  "incident_id": "INC-20260731-001",
  "summary": "payment-api latency increased",
  "evidence": [
    {
      "source": "prometheus",
      "query": "histogram_quantile(...)",
      "observation": "p99 reached 2.8s"
    }
  ],
  "hypotheses": [
    {
      "name": "database connection pool saturation",
      "confidence": 0.72,
      "verification": "check active and waiting connections"
    }
  ],
  "safe_next_steps": [
    "inspect database pool metrics"
  ],
  "actions_need_approval": []
}
```

消费者必须再次做 JSON Schema 校验，不能因为输出来自 Dify 就默认可信。

## 入门实验：不用模型跑通第一个 AIOps Workflow

## 实验目标

建立一个“告警标准化”Workflow：

```text
User Input
  -> Template
  -> Output
```

它不调用大模型，因此不需要模型 API Key。实验完成后，你能通过界面和 API 输入一条告警，得到结构化结果。

## 前置条件

- 本地 Dify 1.16.1 已按前文启动。
- 已初始化管理员并登录。
- 实验环境不存放真实生产告警和密钥。

## 第一步：创建 Workflow

1. 进入 Studio。
2. 选择 Create from Blank。
3. 选择 Workflow。
4. 名称填写 `aiops-alert-normalizer-lab`。
5. 进入画布。

预期结果：画布出现 User Input 起始节点。

## 第二步：定义输入

在 User Input 节点添加：

| Label | Variable Name | Type | Required |
|---|---|---|---|
| Alert Text | `alert_text` | Paragraph | Yes |
| Severity | `severity` | Select | Yes |

Severity 的选项：

- `warning`
- `critical`

变量名是 API 契约。发布后改名会让旧调用方报输入错误，因此生产变更要做兼容评审。

## 第三步：添加 Template 节点

连接 User Input 到 Template，模板填写：

```jinja2
{
  "source": "dify-lab",
  "severity": "{{ severity }}",
  "alert_text": {{ alert_text | tojson }},
  "needs_human_review": true
}
```

把模板中的 `severity` 和 `alert_text` 通过变量选择器绑定到 User Input 的对应变量。

如果当前版本不支持 `tojson` 过滤器，改用纯文本结果：

```jinja2
source=dify-lab
severity={{ severity }}
alert_text={{ alert_text }}
needs_human_review=true
```

不要为了实验在 Code 节点里自行拼接不可信 JSON。

## 第四步：添加 Output 节点

1. 连接 Template 到 Output。
2. 添加输出变量 `normalized_alert`。
3. 值选择 Template 节点的输出。

完整路径应为：

```text
User Input -> Template -> Output
```

## 第五步：Test Run

输入：

```text
Alert Text: payment-api p99 latency is 2.8s
Severity: critical
```

预期结果包含：

```text
source=dify-lab
severity=critical
payment-api p99 latency is 2.8s
needs_human_review=true
```

验证方法：

- Workflow 状态是 Succeeded。
- 三个节点均执行成功。
- Output 中存在 `normalized_alert`。
- Run History 能看到这次测试的节点输入和输出。

## 第六步：发布和创建 API Key

1. 点击 Publish。
2. 打开应用的 API Access。
3. 创建一个 App API Key。
4. 只把 Key 保存到本机环境变量：

```powershell
$env:DIFY_APP_API_KEY = "<你的 App API Key>"
```

不要截图或提交包含完整 Key 的页面。

## 第七步：调用 API

```powershell
$headers = @{
  Authorization = "Bearer $env:DIFY_APP_API_KEY"
  "Content-Type" = "application/json"
}

$body = @{
  inputs = @{
    alert_text = "payment-api p99 latency is 2.8s"
    severity = "critical"
  }
  response_mode = "blocking"
  user = "aiops-lab-user"
} | ConvertTo-Json -Depth 5

$result = Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost/v1/workflows/run" `
  -Headers $headers `
  -Body $body

$result | ConvertTo-Json -Depth 10
```

预期结果：

- HTTP 200。
- 有 `workflow_run_id`。
- `data.status` 为成功状态。
- 输出中包含 `normalized_alert`。

## 第八步：保存学习证据

保存：

- Workflow DSL，删除所有凭据。
- 画布截图。
- API 请求模板，把 Key 改成环境变量占位符。
- 脱敏响应。
- 一页实验记录，写明版本、输入、预期、实际和问题。

## 如果没有成功，先查这些

### 页面打不开

```powershell
docker compose ps
docker compose logs --tail 100 nginx
docker compose logs --tail 100 web
docker compose logs --tail 100 api
```

### API 返回 401

- 环境变量是否真的有值。
- Key 是否来自当前 App。
- Header 是否是 `Authorization: Bearer ...`。
- 是否误用了 Knowledge API Key。

### API 返回输入错误

- `inputs` Key 是否与 User Input 的 Variable Name 完全一致。
- Select 的值是否属于选项。
- 是否在修改后重新发布。

### Template 节点失败

- 变量绑定是否存在。
- 当前版本支持哪些 Jinja 过滤器。
- 先把模板缩减为一行纯文本，确认变量本身可用。

### HTTP 200 但结果不对

- 检查 `data.status`。
- 用 `workflow_run_id` 找运行详情。
- 检查 Output 是否选中了 Template 输出。
- 确认 API 调用的是已发布版本。

## 实验清理

- 删除或吊销实验 API Key。
- 保留脱敏 DSL 和实验记录。
- 不再需要应用时删除实验 App。
- 如果还要继续做故障实验，不要关闭 Compose。

## 故障注入实验：停止 Worker，观察知识索引积压并恢复

## 实验目标

主动停止后台 Worker，上传一份无敏感信息的实验文档，观察索引任务不能完成；然后从状态、日志和服务健康形成假设，恢复 Worker 并验证索引完成。

链路：

```text
upload accepted
  -> Redis queue
  -X-> Worker stopped
  -> indexing does not complete
```

## 实验边界

- 只在本地专用实验环境执行。
- 不在生产环境停止共享 Worker。
- 文档只包含虚构 Runbook。
- 不删除卷，不执行 `docker compose down -v`。

## 第一步：准备实验文档

创建 `payment-api-runbook.txt`：

```text
Service: payment-api
Alert: high latency
First check: inspect database connection pool active and waiting connections.
Do not restart the application before collecting connection-pool evidence.
Owner: payments-oncall
```

这份文件可以作为 GitHub 学习证据，不包含生产地址和密钥。

## 第二步：确认基线

```powershell
docker compose ps worker redis db_postgres
docker compose logs --tail 50 worker
```

预期：

- Worker、Redis、PostgreSQL 正常运行。
- Worker 日志没有持续连接错误。

## 第三步：停止 Worker

```powershell
docker compose stop worker
docker compose ps worker
```

预期：Worker 显示 Exited 或 Stopped，API 页面仍然可以打开。

## 第四步：创建知识库并上传文档

1. 进入 Knowledge。
2. 创建 `aiops-worker-fault-lab`。
3. 上传 `payment-api-runbook.txt`。
4. 选择默认切分设置。
5. 开始处理。

预期现象：

- 上传请求可能成功。
- 文档处理状态停在等待或处理中，不能进入 completed。
- 具体阶段文字可能随版本变化，以“索引未完成”为判断标准。

## 第五步：收集证据

```powershell
docker compose ps
docker compose logs --tail 100 api
docker compose logs --tail 100 worker
docker compose logs --tail 100 redis
```

证据表：

| 证据 | 观察 | 推论 |
|---|---|---|
| API 可访问 | 页面和上传请求正常 | 前台 API 不是主要故障 |
| Worker 停止 | `docker compose ps` 显示不运行 | 没有消费者处理后台任务 |
| 文档未完成 | 状态长时间不前进 | 异步任务路径受阻 |
| Redis 正常 | Broker 容器仍运行 | 任务可能已入队等待消费 |

假设：上传元数据已被 API 接受，但知识索引依赖 Worker，停止消费者后任务无法完成。

## 第六步：恢复 Worker

```powershell
docker compose start worker
docker compose logs --tail 200 -f worker
```

看到任务开始处理后按 `Ctrl+C` 退出日志跟随，不会停止容器。

预期：

- Worker 恢复连接 Redis。
- 任务经过解析、切分、Embedding 和索引。
- 文档最终变为已完成。

## 第七步：验证检索

在 Test Retrieval 输入：

```text
payment-api 高延迟首先检查什么？
```

预期命中包含下面含义的 Chunk：

```text
先检查数据库连接池 active 和 waiting connections，
收集证据前不要重启应用。
```

如果 Worker 已恢复但仍失败，继续分层：

1. Worker 是否消费到了该任务。
2. Embedding 模型凭据和额度是否正常。
3. 向量库是否健康。
4. 文档解析是否得到非空文本。
5. 数据库状态是否记录了明确错误。

## 第八步：清理

1. 删除实验知识库。
2. 删除本地虚构文档，或保留为脱敏学习证据。
3. 确认 Worker 仍在运行：

```powershell
docker compose ps worker
```

4. 如果整个 Dify 实验结束：

```powershell
docker compose down
```

该命令默认保留命名卷。需要删除卷时必须先确认这是纯实验环境且数据不再需要。

## 故障实验复盘

你应该能回答：

- 为什么页面健康不代表知识索引健康？
- 为什么上传成功不等于可检索？
- 哪个组件生产任务，哪个组件消费任务？
- Redis 正常但 Worker 停止时会发生什么？
- 恢复后如何证明数据链路真正完成？
- 如何为队列积压设计告警？

## 生产排障手册

## 先建立时间线

收集：

- 首次异常时间和时区。
- 受影响的 App、Workspace、API Key 范围和用户范围。
- 最近发布的 Workflow、模型、插件、知识库和基础设施变更。
- 请求 ID、`workflow_run_id`、节点 ID。
- Dify 版本和镜像摘要。
- 错误是否持续、间歇或只影响某种输入。

## 分层证据顺序

| 层 | 先看什么 | 证明什么 |
|---|---|---|
| 客户端 | 状态码、SSE、超时、请求 ID | 请求是否正确发出和完整接收 |
| 网关 | 4xx/5xx、连接、超时、缓冲 | 流量是否到达 Dify |
| API | 请求日志、Trace ID、DB/Redis 错误 | 平台入口是否正常 |
| Workflow | 运行状态、首个失败节点、变量 | 编排逻辑是否正确 |
| Worker | 队列、任务年龄、重试和异常 | 异步任务是否处理 |
| 模型/插件 | 延迟、限流、配额、版本 | 外部能力是否异常 |
| 数据 | DB、对象存储、向量库 | 状态是否完整一致 |
| 业务质量 | 检索 Chunk、引用、评估集 | 结果是否正确而非仅成功 |

## 常见故障

### 502 或 504

可能原因：

- API 容器不可达。
- 模型或工具调用超过网关读超时。
- SSE 被代理缓冲。
- API Worker 被长任务占满。

检查：

```powershell
docker compose ps
docker compose logs --tail 200 nginx
docker compose logs --tail 200 api
```

修复思路：先定位慢层，再调整超时或并发；不要只把所有超时无限加大。

### 知识索引一直等待

检查顺序：

1. `worker` 是否运行。
2. Redis Broker 是否可达。
3. Worker 日志是否显示 Embedding 限流。
4. 向量库是否只读、磁盘满或连接失败。
5. 文档解析是否失败。

### 检索不到新文档

- 索引是否 completed。
- Test Retrieval 是否能命中。
- 应用是否选中了该知识库。
- 发布版本是否更新。
- Metadata Filter 是否排除了文档。
- Embedding 模型或向量维度是否改变。

### 模型节点 429

- 检查 Provider 配额和速率限制。
- 按 `Retry-After` 或供应商规则退避。
- 限制 App 并发和 Workflow 并行。
- 对可重试的只读生成做抖动退避。
- 不对有副作用的 Tool 节点盲目重跑整条 Workflow。

### Plugin Daemon 调用失败

- 插件是否安装成功、签名是否有效。
- Daemon Key 是否一致。
- 插件版本是否兼容。
- 容器是否能访问 Marketplace、模型或工具端点。
- 是否被 SSRF 或网络策略阻止。

### 文件预览失败

- `FILES_URL` 与 `INTERNAL_FILES_URL` 是否正确。
- 签名 URL 是否过期。
- 对象存储权限、CORS、TLS 和 DNS 是否正常。
- `SECRET_KEY` 是否被变更。

### 多人编辑不同步

- `api_websocket` 是否健康。
- 公网 WebSocket URL 是否正确。
- 代理是否转发 Upgrade。
- 多副本是否按官方要求处理会话粘滞。
- Redis 协作事件是否可用。

### 数据库连接耗尽

- API 和 Worker 总连接池是否超过数据库容量。
- 新增副本是否同时放大连接数。
- 慢查询和长事务是否占连接。
- 先限制并发和恢复服务，再调整池与数据库上限。

## 生产架构与高可用

一个可讨论的企业自托管架构：

```text
users / business services
  -> WAF / Load Balancer
  -> Nginx or Ingress
     -> web replicas
     -> api replicas
     -> api_websocket replicas
  -> worker pools
     -> general queue
     -> indexing queue
     -> latency-sensitive queue
  -> one controlled scheduler
  -> plugin daemon pool
  -> sandbox / SSRF proxy

state
  -> HA relational database
  -> HA Redis
  -> durable object storage
  -> production vector database

external
  -> model gateways
  -> tools / CMDB / metrics / ticket systems
  -> log / metric / trace platform
```

## 单点与扩展

- Web 和 API 可以水平扩展，但迁移任务不能让每个副本随意并发执行。
- WebSocket 多副本需要正确的负载均衡和会话处理。
- Worker 可扩容，但要按下游容量限制总并发。
- `worker_beat` 保持单一调度来源，避免重复周期任务。
- 本地文件存储不适合多节点，使用共享对象存储。
- PostgreSQL、Redis 和向量库必须分别设计高可用与备份。
- 外部模型不是“平台外就不用管”，要纳入 SLO、配额和降级。

## 容量与性能

## 建立容量模型

在线请求粗略拆分：

```text
total latency
  = gateway queue
  + API overhead
  + workflow scheduling
  + retrieval
  + model time-to-first-token
  + model generation
  + tool calls
  + output transfer
```

吞吐受最慢且限额最小的一层约束。

至少监控：

- App 并发与拒绝数。
- Workflow 成功率、p50/p95/p99 和执行中数量。
- 每节点耗时和错误率。
- 模型请求、首 Token、总延迟、Token、429 和成本。
- Worker 队列长度、最老任务年龄、重试和失败。
- 数据库连接池、慢查询、锁、CPU、磁盘和存储增长。
- Redis 内存、连接、命令延迟、驱逐和持久化状态。
- 向量检索延迟、写入失败、索引大小。
- SSE/WebSocket 活跃连接和断连。
- 对象存储容量、请求错误和延迟。

## 容量保护

- 为每个 App 设置并发上限。
- 为每种外部 Provider 设置速率限制。
- 为 Workflow 设置最大运行时间、循环次数和节点超时。
- 将大规模索引与在线请求隔离。
- 为长文档限制大小、页数和 Chunk 数。
- 为日志设置保留期，避免数据库无限增长。
- 对非关键功能使用降级模型或无模型路径。
- 在过载时快速拒绝，而不是让所有请求一起超时。

## 性能排查不要只看模型

模型常常最慢，但不是唯一瓶颈：

- Chunk 过多导致 Rerank 输入巨大。
- Tool 节点串行调用多个慢 API。
- 循环节点放大模型调用次数。
- DB 连接不足造成 API 排队。
- SSE 被代理缓冲，看起来像模型没有输出。
- Worker 与在线 API 争抢数据库或向量库资源。

## 安全边界

## 身份与权限

- Workspace 成员按职责分配角色。
- App API Key 与 Knowledge API Key 分开。
- Knowledge Key 可能覆盖创建者可见的多个知识库，风险通常更大。
- 业务后端验证终端用户身份，不能只信客户端传入的 `user`。
- 管理控制台不直接暴露公网，至少放在 SSO、VPN、零信任或访问网关后。

## 密钥与凭据

- Key 进入专用密钥管理系统。
- 不放前端、不写 Workflow 文本、不进入截图。
- 日志、Trace 和错误消息做脱敏。
- 轮换前明确 `SECRET_KEY` 的特殊影响。
- 插件凭据按 Workspace 和最小权限管理。
- 自托管插件签名校验默认应保持开启；关闭校验只适合受控开发环境，不能作为生产排障常规手段。

## Prompt Injection 与工具安全

知识文档和用户输入都可能包含恶意指令。

防护思路：

- 把检索内容标记为“不可信数据”，而不是系统指令。
- 工具参数使用 Schema 和白名单。
- 只读工具优先。
- 写操作需要审批和二次校验。
- 限制 Agent 最大步数、成本和可用工具。
- 不让模型直接拼接 Shell、SQL 或 Kubernetes 管理命令执行。
- 输出给下游前做结构化校验和策略检查。

## 网络与隔离

- 保留 Sandbox 和 SSRF Proxy。
- 对插件和工具做出口白名单。
- 内部数据库、云元数据地址和管理 API 不应被任意 HTTP 节点访问。
- 外部模型通信使用 TLS。
- 网络策略把前端、API、Worker、数据层和执行层分区。

## 数据与隐私

- 明确哪些 Prompt、文档和日志会发送给外部模型。
- 对生产日志、告警和工单做脱敏。
- 设置 Workflow 日志保留期；官方文档指出默认可能长期保留。
- 删除用户数据时要覆盖数据库、文件、向量和第三方追踪系统。
- 备份也属于敏感数据，必须加密和限制访问。

## 许可证边界

部署前由法务或授权负责人核验当前 LICENSE：

- 是否把 Dify 源码用于多租户服务。
- 是否涉及多个 Workspace 对应外部租户。
- 是否修改或移除前端 LOGO 与版权信息。
- 是否需要商业许可。

技术人员不能用“仓库公开”推导出“所有商业用法都无限制”。

## 备份、恢复与灾备

## 备份对象

至少覆盖：

- 关系数据库。
- 对象或本地文件存储。
- 向量数据库。
- 插件持久化数据与安装清单。
- `.env` 的安全备份和密钥引用。
- Workflow DSL、模型配置清单和版本记录。
- 反向代理、DNS、证书和网络策略。

Redis 是否作为必须恢复的持久状态，要按当前部署的 Broker、缓存和运行任务语义决定。即使不恢复队列，也要有失败任务重放和业务对账方案。

## 一致恢复顺序

```text
freeze writes
  -> record recovery point
  -> restore database
  -> restore object storage
  -> restore vector store or rebuild index
  -> restore plugin state
  -> start dependencies
  -> run migrations once
  -> start API and Workers
  -> verify business invariants
```

业务校验不能只看容器：

- App 和 Workflow 是否存在。
- API Key 是否仍有效。
- 文档是否能预览。
- Test Retrieval 是否命中预期 Chunk。
- Workflow API 是否成功。
- 插件和模型凭据是否可用。

## RPO 与 RTO

- RPO（恢复点目标）：最多允许丢多少时间的数据。
- RTO（恢复时间目标）：多长时间内恢复服务。

知识向量可以重建，不代表恢复成本为零。百万级文档重新 Embedding 会耗时、耗费 API 配额，也可能因模型版本变化产生不同向量。

## 升级与回滚

## 升级前

1. 阅读目标版本 Release Notes 和安全公告。
2. 对比当前 `.env` 与目标版本 `.env.example` 及 `docker/envs`。
3. 备份数据库、文件、向量和插件状态。
4. 导出关键 Workflow DSL。
5. 在预生产恢复备份并演练升级。
6. 跑固定 API、RAG、插件和 SSE 回归集。
7. 记录旧镜像摘要、当前 Schema 版本和回滚条件。

## 升级中

- 固定镜像 tag 或 digest。
- 先处理数据库迁移，并保证只执行一次。
- 分批启动 API 和 Worker。
- 不让旧 Worker 消费新版本不兼容任务。
- 观察错误率、队列、数据库、向量库和模型调用。

## 回滚边界

镜像回滚不等于数据库回滚。Schema 迁移可能不向后兼容。

可靠方案：

```text
application rollback
  + compatible database schema
  + storage version compatibility
  + plugin compatibility
  + queued task compatibility
```

如果目标版本已写入不可逆数据，可能必须恢复整个一致备份，而不是只把镜像 tag 改回去。

## 可观测性与 AIOps

## 平台指标

建议通过容器、数据库、Redis、向量库、网关和自建 Exporter 形成统一指标：

- `dify_workflow_runs_total{app,status}`
- `dify_workflow_duration_seconds`
- `dify_node_duration_seconds{node_type}`
- `dify_model_requests_total{provider,model,status}`
- `dify_model_tokens_total{provider,model,direction}`
- `dify_worker_queue_oldest_seconds{queue}`
- `dify_knowledge_index_jobs_total{status}`
- `dify_retrieval_duration_seconds{knowledge}`
- `dify_tool_calls_total{tool,status}`
- `dify_sse_connections`

这些名字是推荐的自建语义，不代表 Dify 默认就导出同名指标。

## 日志

平台日志至少包含：

- 时间、环境、服务、版本。
- Trace ID、请求 ID、Workflow Run ID。
- Workspace/App 的非敏感标识。
- 节点类型、状态、耗时。
- Provider、模型、HTTP 状态和错误类型。
- 不记录完整 API Key、密码和未经脱敏的 Prompt。

官方环境变量支持 JSON 日志格式，便于进入 Loki、Elasticsearch 或其他日志平台。

## Trace

Trace 要连接：

```text
business request id
  -> gateway trace
  -> Dify workflow run
  -> retrieval
  -> model
  -> tool
  -> downstream system
```

接入外部 LLM Observability 平台前，检查采样、保留、数据出境、Prompt 脱敏和权限。

## 告警

高价值告警：

- Workflow 失败率超过 SLO。
- p95/p99 延迟持续恶化。
- Worker 最老任务年龄超过目标。
- 索引失败或积压持续增长。
- 模型 429、5xx 或超时激增。
- 数据库连接池接近耗尽。
- Redis 内存、驱逐或连接异常。
- 向量库写入或查询错误。
- 对象存储失败。
- Plugin Daemon 不可用。

告警要指向 Runbook，并包含 App、环境、版本、变更、请求/运行 ID 和第一条检查命令。

## 事故案例：新 Runbook 已上传，助手仍返回旧操作

## 现象

- Knowledge 页面看得到新文件。
- Chatflow 正常返回 200。
- 回答仍建议直接重启。
- 新 Runbook 已明确禁止无证据重启。

## 证据

收集：

- 文档索引状态和最后更新时间。
- Test Retrieval 的命中 Chunk、分数和元数据。
- 线上 Workflow Run 的知识检索节点输出。
- Worker 在上传时间附近的日志。
- Embedding Provider 的状态和限流。
- 应用发布版本和知识节点配置。
- 最近知识库、模型、Chunk 策略变更。

## 假设

按证据排序：

1. 文档上传成功但索引任务失败。
2. 线上发布版本仍引用旧知识库。
3. Metadata Filter 排除了新文档。
4. Chunk 缺少标题上下文，查询没有召回。
5. 检索已正确，但 Prompt 没要求基于证据回答。
6. 模型忽略证据并生成了旧经验。

## 验证

- 如果 Test Retrieval 不命中，问题在索引或检索层。
- 如果 Test Retrieval 命中但线上节点不命中，检查应用配置和发布版本。
- 如果节点命中但最终回答错误，检查 Prompt、上下文顺序和模型忠实度。
- 对相同问题保存旧版与新版完整 Trace，逐层比较。

## 缓解

- 临时下线危险自动化动作。
- 在回答前增加“引用当前 Runbook”校验。
- 把高风险建议改为需要人工确认。
- 必要时回退到经过验证的旧知识快照和应用版本。

## 修复

- 修复 Worker、Embedding 或向量写入故障并重新索引。
- 修正知识库引用、Filter 或 Chunk 策略。
- 发布新 Workflow 版本。
- 跑固定回归问题集。
- 在输出中展示证据来源和更新时间。

## 爆炸半径

确认：

- 只影响一个文档，还是整个知识库。
- 只影响一个 App，还是所有引用该知识库的应用。
- 是否已有自动化动作依据错误答案执行。
- 错误答案和敏感内容是否已进入第三方 Trace。

## 回滚

- 回退应用发布版本。
- 切回已验证知识库快照。
- 禁用写工具，只保留只读查询。
- 无法保证检索正确时返回明确降级信息。

## 复盘改进

- 知识更新完成标准加入 Test Retrieval 回归。
- 监控索引任务最老年龄和失败率。
- 记录知识版本到 Workflow Run。
- 高风险建议必须引用证据并人工审批。
- 用事故问题扩充评估集。

## 生产系统设计题：设计企业 AIOps Copilot

## 需求澄清

先问：

- 是一个企业内部 Workspace，还是对外多租户服务？
- QPS、并发、日活、文档量、日新增量是多少？
- 哪些数据能发给外部模型？
- 是否允许执行变更？
- 可用性、延迟、RPO、RTO 和预算是多少？
- 是否需要中文、图片、表格和多模态检索？
- 失败时允许怎样降级？

多租户业务还必须先确认 Dify 当前许可证和商业授权。

## 一个可讨论的设计

```text
internal portal
  -> enterprise identity / RBAC
  -> AIOps gateway
     -> input validation
     -> tenant and user mapping
     -> rate limit / idempotency / audit
  -> Dify Workflow API
     -> intent classify
     -> read-only observability tools
     -> change and CMDB tools
     -> versioned Runbook knowledge
     -> structured diagnosis
     -> human approval for write actions
  -> execution platform
     -> approved runbook
     -> result verification
     -> rollback

platform
  -> HA API / Worker
  -> HA database / Redis / vector store / object storage
  -> model gateway
  -> metrics / logs / traces / evaluations
```

## 关键取舍

### Dify 直连业务系统还是增加 Gateway

企业场景建议增加 Gateway：

- 统一身份和租户映射。
- 隐藏 Dify API Key。
- 限流、审计和幂等。
- 对工具参数做二次策略校验。
- Dify 升级时保持业务契约稳定。

### Agent 还是 Workflow

- 关键步骤固定、合规要求高：Workflow 优先。
- 开放探索、工具选择变化大：受限 Agent。
- 高风险动作：Agent 只能建议，执行交给审批后的确定性系统。

### 自建模型还是外部模型

比较：

- 数据边界。
- 延迟与吞吐。
- GPU 容量。
- 模型质量。
- 每 Token 成本。
- 运维复杂度。
- Provider 锁定和降级能力。

### 单知识库还是按域拆分

按权限、更新频率、文档类型和责任人拆分更容易治理。一个巨大知识库容易造成权限、检索噪声和重建成本问题。

## 发布与回滚

- Workflow DSL 进入 Git。
- Prompt、模型、知识、插件变化关联变更单。
- 预生产跑黄金问题集。
- 小流量灰度并观察质量、延迟和成本。
- 保留旧 App 版本、知识快照和模型配置。
- 达到错误率或质量阈值自动停止灰度。

## Dify 与相邻技术怎么选

| 技术 | 更适合 | 不擅长 |
|---|---|---|
| Dify | 可视化编排、快速发布、团队治理、RAG 应用 | 极深的运行时定制和底层算法控制 |
| LangChain | 用代码组合模型、工具和 RAG | 开箱即用的完整团队平台 |
| LangGraph | 长运行、有状态、可恢复的 Agent 图 | 非技术用户快速搭建完整平台 |
| 自研平台 | 特殊安全、规模、协议和治理要求 | 前期成本、迭代速度和维护复杂度 |
| 直接模型 API | 简单、单一、低依赖调用 | 工作流、知识、日志和发布治理 |
| Kubernetes | 调度和运行容器化服务 | 不负责 AI 应用语义编排 |

选择标准不是“哪个最火”，而是：

- 业务复杂度。
- 开发团队能力。
- 可视化协作需求。
- 安全合规。
- 定制深度。
- 规模和性能。
- 锁定成本。
- 运维成熟度。

## 面试回答

## 30 秒回答：什么是 Dify

Dify 是一个生成式 AI 应用开发与运行平台，把模型提供方、可视化 Workflow/Chatflow、Agent、知识库 RAG、插件、Web App、REST API 和运行日志整合起来。自托管时它不是单体程序，而是 API、Web、Worker、Plugin Daemon、数据库、Redis、向量库、对象存储和 Sandbox 等组件共同工作。在 AIOps 中我会先把它用于只读证据检索和结构化诊断，再通过审批、幂等和审计逐步接入自动化。

## 3 分钟回答：如何把 Dify 用到生产 AIOps

我会先从业务链路而不是画布开始。入口由企业网关完成身份、限流、审计和 Dify Key 保护；Dify Workflow 负责意图分类、指标/日志/CMDB 只读查询、Runbook 检索和结构化假设；任何写动作都经过参数校验、策略门禁和人工审批，再交给确定性 Runbook 平台执行。

架构上，API 和 Worker 分开扩缩，关系数据库保存主要元数据，Redis 承担任务 Broker 和协调，文件进对象存储，Chunk 向量进向量库。我要监控 Workflow 成功率和 p99、模型 429 和 Token、Worker 最老任务年龄、检索延迟、数据库连接、Redis 和向量库健康。升级前会备份数据库、文件、向量和插件状态，导出 DSL，在预生产跑 API、RAG、SSE 和工具回归。回滚不能只换镜像，还要考虑 Schema、插件和队列任务兼容。

质量上，我会维护黄金问题集，保存期望 Chunk 和答案要点。HTTP 200 只能证明调用完成，不能证明检索和答案正确。

## 高频问题与连续追问

### 1. Dify 是模型还是框架

回答要点：

- 它是 AI 应用平台，不是模型。
- 通过 Provider 接入模型，通过 Workflow、Knowledge 和 Plugin 组成应用。
- 同时提供开发界面和运行服务。

追问：没有模型 Key 能做什么？

可以运行 Template、条件、变量等不依赖模型的节点；LLM、Embedding 和 Rerank 能力需要可用 Provider。

### 2. Workflow 和 Chatflow 的区别

回答要点：

- Workflow 一次执行，适合自动化和批处理。
- Chatflow 每条消息触发流程并带会话交互。
- 起止节点和状态语义不同。

追问：告警日报选哪个？

通常 Workflow；如果用户要持续追问同一事故上下文，再考虑 Chatflow。

### 3. Dify 为什么需要 Redis 和 Worker

回答要点：

- API 不适合同步执行所有重任务。
- Redis 作为 Broker 等运行时组件。
- Worker 处理索引等异步任务。
- 因此上传成功与索引完成是不同状态。

追问：Worker 重试会有什么风险？

外部写操作可能重复，需要任务 ID、幂等键、状态机和补偿。

### 4. 一次 RAG 请求经过什么

回答要点：

1. 查询进入 Workflow。
2. 生成查询向量。
3. 向量/全文/混合检索。
4. Metadata Filter 和可选 Rerank。
5. Top K Chunk 进入 Prompt。
6. 模型生成。
7. 记录检索和模型运行。

追问：召回正确但回答错误怎么办？

转向 Prompt、上下文顺序、模型忠实度、结构化输出和答案评估，不再继续调向量库。

### 5. Dify 如何做高可用

回答要点：

- 无状态 Web/API 多副本。
- WebSocket 处理连接和会话粘滞。
- Worker 分池扩容，Beat 单一调度。
- HA 数据库、Redis、对象存储和向量库。
- 模型 Provider 多路与降级。
- 一致备份和恢复演练。

追问：为什么默认 Compose 不等于生产 HA？

它主要是快速启动，许多依赖仍是单实例或本地卷，没有跨节点故障转移、容量和恢复保证。

### 6. Dify 如何保证一致性

回答要点：

- 多存储和外部模型之间没有全局事务。
- 通过任务状态、幂等、重试、补偿、重建索引和对账实现最终一致。
- 恢复要同时验证 DB、文件、向量和插件。

追问：向量库丢了怎么办？

如果原文件、Chunk 配置、Embedding 模型版本和元数据完整，可以重建；要评估时间、配额、成本和模型版本变化。

### 7. 如何排查 Workflow 很慢

回答要点：

- 用 Run ID 找完整 Trace。
- 拆网关、排队、检索、模型、工具和传输。
- 看首 Token 与总生成时间。
- 检查循环和并行放大。
- 结合 p95/p99 和最近变更。

追问：直接加 API 副本有用吗？

只有瓶颈在 API 才有用；模型限流、DB 连接、工具 API 或 Worker 队列瓶颈可能被副本放大。

### 8. 如何保护工具调用

回答要点：

- 最小权限、只读优先。
- Schema 和白名单。
- 限流、超时和最大步数。
- 写操作审批。
- 幂等、验证、审计和回滚。
- 防 Prompt Injection。

追问：为什么不能直接给 Agent Kubernetes 管理员权限？

模型输出不确定，输入可能被注入；管理员权限会把一次错误决策扩大到整个集群。

### 9. 如何升级和回滚 Dify

回答要点：

- 固定版本，读 Release Notes。
- 比较环境变量。
- 备份 DB、文件、向量和插件。
- 预生产恢复和回归。
- 单独迁移，分批启动。
- 回滚同时考虑 Schema 和任务兼容。

追问：只保留旧镜像够吗？

不够。数据库迁移和数据格式可能已改变，旧镜像未必能读取新 Schema。

### 10. Dify 与 LangChain 怎么选

回答要点：

- Dify 强在平台、可视化、发布和治理。
- LangChain 强在代码级定制。
- 可以由业务通过 Dify 快速交付，复杂工具或服务用代码实现后接入。

追问：什么时候不选 Dify？

对极低延迟、极高吞吐、深度定制运行时、特殊合规隔离或已有成熟自研平台的场景，要评估直接代码实现。

### 11. HTTP 200 为什么不代表 AI 应用成功

回答要点：

- Workflow 内部可能返回失败状态。
- 检索可能为空或命中错误。
- 模型可能生成错误内容。
- 工具可能返回业务失败。
- 需要技术 SLO 和质量评估双重验证。

追问：质量怎么自动化？

维护版本化评估集，分别测检索命中、引用、答案要点、幻觉、安全、延迟和成本，并设置发布门禁。

### 12. Dify 许可证有什么工程影响

回答要点：

- 当前许可证是带附加条件的 Apache 2.0 修改版。
- 多租户服务和前端标识可能触发限制。
- 架构设计前要确认 Workspace 与租户关系和商业授权。

追问：开源仓库能否直接做 SaaS？

不能只凭“源码公开”下结论，必须按当前 LICENSE 和书面授权判断。

## 事故复盘题

题目：知识索引全部 completed，但生产回答仍引用三个月前 Runbook，你怎么处理？

回答框架：

1. 先禁用危险写操作，缩小爆炸半径。
2. 用相同问题在 Test Retrieval 与线上 Run 中比较 Chunk。
3. 核对知识库、文档版本、发布版本和 Metadata Filter。
4. 检查检索命中后 Prompt 是否使用证据。
5. 比较最近 Embedding、Rerank、Chunk、模型和 Workflow 变更。
6. 回退到验证过的应用与知识快照。
7. 补黄金问题集、知识版本标记和上线门禁。

面试官继续追问时，要说出证据、假设验证、缓解、修复、爆炸半径和回滚，不要只说“重新建索引”。

## 学习检查清单

## 入门层

- [ ] 我能解释 Dify 不是大模型。
- [ ] 我能区分 Workflow、Chatflow 和 Agent。
- [ ] 我能创建 User Input、Template、Output 工作流。
- [ ] 我能测试、发布并通过 API 调用。
- [ ] 我知道 API Key 只能保存在后端。

## 实战层

- [ ] 我能画出在线请求和知识索引路径。
- [ ] 我能解释 API、Worker、Redis、数据库、向量库和对象存储。
- [ ] 我能用 Run ID 定位第一个失败节点。
- [ ] 我能判断检索错还是生成错。
- [ ] 我能完成 Worker 故障注入和恢复。
- [ ] 我能设计 Prompt、工具和数据安全护栏。

## 大厂面试层

- [ ] 我能解释多存储状态和最终一致。
- [ ] 我能设计高可用和容量保护。
- [ ] 我能给出完整备份、升级和回滚方案。
- [ ] 我能分析模型、队列、数据库和检索瓶颈。
- [ ] 我能回答 Dify 与 LangChain、自研平台的取舍。
- [ ] 我能说明当前许可证边界。
- [ ] 我能用事故证据而不是猜测根因。

## GitHub 学习证据

建议仓库：

```text
dify-aiops-lab/
  README.md
  docs/
    architecture.md
    request-path.md
    indexing-path.md
    security-boundary.md
    incident-worker-stopped.md
  workflow/
    aiops-alert-normalizer.yml
  api/
    invoke-workflow.ps1
    sample-response.redacted.json
  knowledge/
    payment-api-runbook.txt
    retrieval-cases.csv
  observability/
    metrics.md
    log-fields.md
    alerts.md
  screenshots/
    workflow-canvas.png
    workflow-run.png
    worker-fault.png
    retrieval-result.png
```

提交前检查：

- DSL 不含模型和工具凭据。
- PowerShell 使用环境变量读取 Key。
- 响应中的用户、文档和 URL 已脱敏。
- 截图不含完整 API Key。
- 事故记录包含时间线、证据、假设、验证、修复和预防。
- README 写明 Dify 版本、实验边界、启动、验证和清理。

一个合格的学习证据不是“我会 Dify”，而是别人能按你的 README 复现实验，看到预期结果，并理解失败时先查哪里。

## 学完之后

继续学习：

1. [LLM / OpenAI API](./llm-openai.md)：理解模型、结构化输出、工具调用、成本和限流。
2. [RAG](./rag.md)：深入 Chunk、检索、Rerank、评估和 Prompt Injection。
3. [向量数据库](./vector-database.md)：理解索引、距离、过滤、容量和恢复。
4. [LangChain](./langchain.md) 与 [LangGraph](./langgraph.md)：补代码级编排和状态图。
5. [Docker Compose](../cloud-native/docker-compose.md) 与 [Kubernetes](../cloud-native/kubernetes.md)：把自托管平台运行到可靠基础设施上。
6. [AIOps 闭环](../sre-aiops/aiops-loop.md)：把建议、审批、执行、验证和学习连成安全闭环。

本文能帮助你达到 Dify 从入门到生产讨论的第一版深度，但不能保证面试结果。编码、Linux、网络、数据库、容器、系统设计、真实项目和沟通表达仍需单独训练。
