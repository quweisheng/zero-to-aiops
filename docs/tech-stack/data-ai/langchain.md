# LangChain

> 学习目标：能理解 LangChain 在 LLM 应用工程里的位置，能讲清 agent、model、message、tool、system prompt、structured output、memory、RAG、LangGraph、LangSmith 和 AIOps 安全边界，并能做一个可审计的 runbook 查询助手原型。

## 官方资料

优先读这些 LangChain 官方资料：

- [LangChain overview](https://docs.langchain.com/oss/python/langchain/overview)
- [Install LangChain](https://docs.langchain.com/oss/python/langchain/install)
- [LangChain quickstart](https://docs.langchain.com/oss/python/langchain/quickstart)
- [Agents](https://docs.langchain.com/oss/python/langchain/agents)
- [Tools](https://docs.langchain.com/oss/python/langchain/tools)
- [Structured output](https://docs.langchain.com/oss/python/langchain/structured-output)
- [Context engineering](https://docs.langchain.com/oss/python/langchain/context-engineering)
- [Short-term memory](https://docs.langchain.com/oss/python/langchain/short-term-memory)
- [RAG with LangChain](https://docs.langchain.com/oss/python/langchain/rag)
- [LangSmith RAG evaluation](https://docs.langchain.com/langsmith/evaluate-rag-tutorial)

说明：本文按 LangChain 当前 Python 官方文档整理，用 AIOps runbook、告警摘要和工具调用场景重新讲解，不复制官方全文。

## 官方知识地图

LangChain 现在可以按这张地图理解：

```text
LangChain
  -> Get started
     -> install
     -> quickstart
  -> Core components
     -> agents
     -> models
     -> messages
     -> tools
     -> structured output
     -> short-term memory
     -> streaming
  -> Middleware
     -> prompt shaping
     -> retries
     -> guardrails
     -> dynamic routing
  -> Advanced usage
     -> context engineering
     -> retrieval
     -> MCP
     -> human-in-the-loop
  -> LangGraph
     -> durable execution
     -> deterministic + agentic workflow
  -> LangSmith
     -> tracing
     -> debugging
     -> evaluation
     -> deployment observability
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>LangChain</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; Get started</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>     -&gt; install</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>     -&gt; quickstart</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>  -&gt; Core components</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 6 行 | <code>     -&gt; agents</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 7 行 | <code>     -&gt; models</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 8 行 | <code>     -&gt; messages</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 9 行 | <code>     -&gt; tools</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 10 行 | <code>     -&gt; structured output</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 11 行 | <code>     -&gt; short-term memory</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 12 行 | <code>     -&gt; streaming</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 13 行 | <code>  -&gt; Middleware</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 14 行 | <code>     -&gt; prompt shaping</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 15 行 | <code>     -&gt; retries</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 16 行 | <code>     -&gt; guardrails</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 17 行 | <code>     -&gt; dynamic routing</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 18 行 | <code>  -&gt; Advanced usage</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 19 行 | <code>     -&gt; context engineering</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 20 行 | <code>     -&gt; retrieval</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 21 行 | <code>     -&gt; MCP</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 22 行 | <code>     -&gt; human-in-the-loop</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 23 行 | <code>  -&gt; LangGraph</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 24 行 | <code>     -&gt; durable execution</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 25 行 | <code>     -&gt; deterministic + agentic workflow</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 26 行 | <code>  -&gt; LangSmith</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 27 行 | <code>     -&gt; tracing</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 28 行 | <code>     -&gt; debugging</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 29 行 | <code>     -&gt; evaluation</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 30 行 | <code>     -&gt; deployment observability</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


本文覆盖：

1. LangChain 解决什么工程问题。
2. agent、model、tool、message 和 prompt 的关系。
3. RAG、memory、structured output 在 AIOps 中怎么用。
4. 一个 runbook 查询工具实验。
5. LangChain 在生产中的安全边界和排障方法。

## 场景开场

假设值班时收到告警：

```text
HighErrorRate service=order-api severity=page
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>HighErrorRate service=order-api severity=page</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


你希望智能助手能做这些事：

1. 根据告警名查 runbook。
2. 读取最近变更或服务负责人。
3. 返回结构化的下一步检查。
4. 明确哪些动作只读，哪些动作需要人工审批。
5. 把每次工具调用、模型输入输出都留痕。

直接写一个 OpenAI API 调用也能完成一小段摘要，但一旦要接工具、记上下文、做 RAG、结构化输出、追踪和评估，工程复杂度就上来了。LangChain 的价值，是把这些 LLM 应用常见部件组织成可组合的工程框架。

## 一句话人话版

LangChain 是构建 LLM 应用的 Python 框架：它把模型、消息、提示词、工具、RAG、记忆、结构化输出和追踪串起来，让你能把大模型变成可调试、可评估、可接入业务系统的应用。

## 小白可能会问

- LangChain 和直接调用 OpenAI API 有什么区别？
- agent 到底是什么？
- tool 为什么不能让模型自己执行？
- message、system prompt、context 分别是什么？
- RAG 和 LangChain 是什么关系？
- memory 会不会把生产敏感信息记住？
- LangChain、LangGraph、LangSmith 分别负责什么？
- AIOps 里能不能让 LangChain 自动重启服务？

## 为什么要学

AIOps 里的 LLM 应用很少只有“一问一答”。真实场景通常需要：

- 读告警字段。
- 查 runbook。
- 查历史事故。
- 查最近发布。
- 调用内部 API。
- 输出固定 JSON。
- 限制高风险动作。
- 记录调用链路，方便复盘。

这些都是工程问题。LangChain 的意义不是让模型更聪明，而是让你用统一方式组织模型调用、上下文、工具和观测。

## 是什么

你可以把 LangChain 理解成 LLM 应用的“编排工具箱”。

最简单的 LLM 调用是：

```text
prompt -> model -> answer
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>prompt -&gt; model -&gt; answer</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


LangChain 关注的是更完整的应用：

```text
user alert
  -> messages
  -> system prompt
  -> model
  -> decide tool call
  -> execute tool in your code
  -> return tool result
  -> model writes structured response
  -> trace / evaluate / log
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>user alert</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; messages</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; system prompt</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>  -&gt; model</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>  -&gt; decide tool call</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 6 行 | <code>  -&gt; execute tool in your code</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 7 行 | <code>  -&gt; return tool result</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 8 行 | <code>  -&gt; model writes structured response</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 9 行 | <code>  -&gt; trace / evaluate / log</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


它不是监控系统，不是向量数据库，不是权限系统，也不是自动化执行平台。它更像连接这些系统的 LLM 应用层。

## 它解决什么问题

### 问题 1：模型调用越来越复杂

从一个 prompt 开始很简单，但很快会变成：

- 多轮消息。
- 多个模型供应商。
- 多个工具。
- 输出 JSON。
- 错误重试。
- token 控制。
- 调用链追踪。

LangChain 把这些通用结构抽出来。

### 问题 2：工具调用需要边界

模型不能真的“自己查数据库”。正确做法是：

```text
模型提出 tool call
服务端代码校验参数
服务端代码执行工具
工具结果回给模型
模型基于结果回答
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>模型提出 tool call</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>服务端代码校验参数</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>服务端代码执行工具</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>工具结果回给模型</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>模型基于结果回答</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


这样才能做权限、审计、超时和错误处理。

### 问题 3：AIOps 需要证据链

告警摘要必须能回答：

- 模型看到了哪些输入？
- 调用了哪些工具？
- 查到了哪些 runbook？
- 哪些信息缺失？
- 输出建议有没有越权？

LangSmith 这类追踪和评估工具就是为这类问题服务的。

## 核心原理

LangChain 的核心可以这样理解：

```text
Agent = Model + Harness

Harness =
  prompt
  messages
  tools
  middleware
  memory / checkpointer
  structured output
  tracing
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Agent = Model + Harness</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 3 行 | <code>Harness =</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>  prompt</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>  messages</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 6 行 | <code>  tools</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 7 行 | <code>  middleware</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 8 行 | <code>  memory / checkpointer</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 9 行 | <code>  structured output</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 10 行 | <code>  tracing</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


官方文档里 `create_agent` 是一个可配置的 agent harness。你把模型、工具和系统提示词交给它，它负责组织模型循环。

### 关键术语拆解

| 术语 | 人话解释 | AIOps 例子 |
|---|---|---|
| model | 真正生成文本或 tool call 的模型 | OpenAI、Anthropic、Google 等模型 |
| message | 对话里的输入输出单位 | 告警上下文、助手回答 |
| system prompt | 给模型的长期规则 | 只能基于证据回答，不执行高风险动作 |
| tool | 由服务端代码执行的函数 | 查 runbook、查最近发布 |
| agent | 模型在工具循环中完成任务 | 告警分析助手 |
| structured output | 固定结构的输出 | JSON：summary、risk、next_steps |
| memory | 保留会话上下文 | 同一 incident 里的多轮追问 |
| middleware | 插入 agent 过程的控制层 | guardrail、重试、动态模型选择 |
| LangGraph | 更底层的流程编排 | 确定步骤 + agent 步骤混合 |
| LangSmith | 追踪、调试、评估平台 | 看每次告警分析的工具调用 |

## 核心知识树

### Agent

是什么：agent 是模型围绕工具循环工作，直到任务完成。

为什么需要：AIOps 助手不能只生成一句话，它经常需要查资料、查系统、整理证据。

怎么工作：

```text
user message
  -> model call
  -> tool call request
  -> execute tool
  -> tool result
  -> model call
  -> final answer
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>user message</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; model call</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; tool call request</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>  -&gt; execute tool</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>  -&gt; tool result</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 6 行 | <code>  -&gt; model call</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 7 行 | <code>  -&gt; final answer</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


怎么用：用 `create_agent(model=..., tools=..., system_prompt=...)` 组合。

坏了怎么查：看模型是否选错工具、工具返回是否为空、system prompt 是否约束不清。

### Tool

是什么：tool 是模型可以请求调用的函数，但真正执行的是你的程序。

为什么需要：模型本身不知道你的 runbook、数据库、发布系统和监控 API。

怎么工作：函数签名和 docstring 告诉模型工具能做什么，模型提出调用参数，程序执行并返回结果。

怎么用：把只读查询先做成工具，比如 `search_runbook`。

坏了怎么查：看工具描述是否清楚、参数是否校验、返回结果是否过长。

### Message 和 Prompt

是什么：message 是输入输出内容，system prompt 是长期规则。

为什么需要：AIOps 输出必须受规则约束，比如不能编造、不能执行高风险动作。

怎么工作：

```text
system: 你是 AIOps 助手，只能基于证据回答
user: HighErrorRate order-api 怎么处理
tool: search_runbook(...)
assistant: 根据 runbook，先检查...
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>system: 你是 AIOps 助手，只能基于证据回答</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>user: HighErrorRate order-api 怎么处理</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>tool: search_runbook(...)</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>assistant: 根据 runbook，先检查...</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


怎么用：把角色、边界、输出格式写进 system prompt。

坏了怎么查：看 prompt 是否把“事实、猜测、动作边界”分开。

### RAG

是什么：RAG 是先检索资料，再让模型基于资料回答。

为什么需要：模型不知道你的内部服务和 runbook。

怎么工作：

```text
load docs
  -> split chunks
  -> retrieve relevant chunks
  -> model answers with context
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>load docs</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; split chunks</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; retrieve relevant chunks</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>  -&gt; model answers with context</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


怎么用：把 runbook、事故复盘、服务文档作为检索源。

坏了怎么查：先看 top-k 结果是否找对，再看模型是否忠实引用。

### Structured Output

是什么：让模型按固定结构返回结果。

为什么需要：AIOps 系统要把结果写数据库、展示页面或触发审批，不适合只收自然语言。

怎么工作：定义字段，比如 `summary`、`severity`、`evidence`、`next_steps`。

怎么用：让 agent 输出固定 schema。

坏了怎么查：看字段是否缺失、类型是否错误、模型是否把建议写进了证据字段。

### Memory

是什么：保存同一会话或同一 incident 的历史上下文。

为什么需要：值班会连续追问，不能每次都重新解释告警背景。

怎么工作：通过 thread id 和 checkpointer 保存消息状态。

怎么用：同一个 incident 使用同一个 `thread_id`。

坏了怎么查：看是否把不同用户、不同事故、不同权限的数据混在一起。

## 架构和数据流

一个 AIOps LangChain 助手可以这样设计：

```text
Alertmanager / ticket / user question
  -> normalize alert context
  -> LangChain agent
      model
      system prompt
      tools
        search_runbook
        get_recent_deployments
        query_metrics_readonly
      structured output
  -> LangSmith trace
  -> response
      summary
      evidence
      missing_info
      safe_next_steps
      actions_need_approval
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Alertmanager / ticket / user question</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; normalize alert context</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; LangChain agent</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>      model</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>      system prompt</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 6 行 | <code>      tools</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 7 行 | <code>        search_runbook</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 8 行 | <code>        get_recent_deployments</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 9 行 | <code>        query_metrics_readonly</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 10 行 | <code>      structured output</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 11 行 | <code>  -&gt; LangSmith trace</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 12 行 | <code>  -&gt; response</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 13 行 | <code>      summary</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 14 行 | <code>      evidence</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 15 行 | <code>      missing_info</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 16 行 | <code>      safe_next_steps</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 17 行 | <code>      actions_need_approval</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


生产边界：

- 只读工具可以先接入。
- 写操作、重启、回滚、扩缩容必须审批。
- tool 参数必须校验。
- tool 返回要限制长度。
- 模型输出必须有证据和不确定性说明。

## 安装与启动

```powershell
mkdir aiops-langchain-lab
cd aiops-langchain-lab
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -U langchain langchain-openai langgraph python-dotenv
python -c "import langchain; print('langchain ok')"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>mkdir aiops-langchain-lab</code> | 创建目录，用来准备实验项目结构。 |
| 第 2 行 | <code>cd aiops-langchain-lab</code> | 切换当前目录，确保后续命令在正确项目位置执行。 |
| 第 3 行 | <code>python -m venv .venv</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 |
| 第 4 行 | <code>.\.venv\Scripts\Activate.ps1</code> | 执行 `.\.venv\scripts\activate.ps1` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 5 行 | <code>pip install -U langchain langchain-openai langgraph python-dotenv</code> | 管理 Python 依赖包，通常用于安装实验需要的库。 |
| 第 6 行 | <code>python -c "import langchain; print('langchain ok')"</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 |


预期结果：

```text
langchain ok
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>langchain ok</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


如果没有 API key，也可以先运行本文实验里的本地工具部分，确认 runbook 查询函数能工作。

## 配置详解

建议用 `.env` 保存本地实验配置：

```text
OPENAI_API_KEY=sk-...
LANGCHAIN_MODEL=openai:gpt-4.1-mini
LANGSMITH_TRACING=false
LANGSMITH_API_KEY=
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>OPENAI_API_KEY=sk-...</code> | 环境变量或键值示例，等号左边是名称，右边是要配置的值。 |
| 第 2 行 | <code>LANGCHAIN_MODEL=openai:gpt-4.1-mini</code> | 环境变量或键值示例，等号左边是名称，右边是要配置的值。 |
| 第 3 行 | <code>LANGSMITH_TRACING=false</code> | 环境变量或键值示例，等号左边是名称，右边是要配置的值。 |
| 第 4 行 | <code>LANGSMITH_API_KEY=</code> | 环境变量或键值示例，等号左边是名称，右边是要配置的值。 |


| 配置项 | 含义 | 新手容易错在哪里 |
|---|---|---|
| `OPENAI_API_KEY` | 模型供应商 API key | 写进 GitHub 仓库 |
| `LANGCHAIN_MODEL` | 本地选择模型名 | 模型不存在或账号不可用 |
| `LANGSMITH_TRACING` | 是否开启追踪 | 生产没开追踪，问题难查 |
| `LANGSMITH_API_KEY` | LangSmith key | 和模型 key 混淆 |

不要把 `.env` 提交到 GitHub。只提交 `.env.example`。

## 常用命令

```powershell
python -m venv .venv
pip install -U langchain langchain-openai langgraph python-dotenv
python langchain_runbook_agent.py
pip freeze > requirements.txt
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>python -m venv .venv</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 |
| 第 2 行 | <code>pip install -U langchain langchain-openai langgraph python-dotenv</code> | 管理 Python 依赖包，通常用于安装实验需要的库。 |
| 第 3 行 | <code>python langchain_runbook_agent.py</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 |
| 第 4 行 | <code>pip freeze &gt; requirements.txt</code> | 管理 Python 依赖包，通常用于安装实验需要的库。 |


每条命令在检查什么：

| 命令 | 作用 | 正常结果 | 异常时先看 |
|---|---|---|---|
| `python -m venv .venv` | 创建虚拟环境 | 出现 `.venv` | Python 是否安装 |
| `pip install -U ...` | 安装 LangChain 依赖 | 安装成功 | 网络、Python 版本 |
| `python langchain_runbook_agent.py` | 跑实验 | 输出 runbook 建议或提示设置 key | API key、模型名、依赖 |
| `pip freeze > requirements.txt` | 固化依赖 | 生成版本清单 | 是否在虚拟环境 |

## 命令 / 配置 / API 字典

| 名称 | 作用 | 常用写法 | 关键字段 / 参数 | 正常结果 | 常见坑 |
|---|---|---|---|---|---|
| `create_agent` | 创建 agent harness | `create_agent(model=..., tools=...)` | `model`、`tools`、`system_prompt` | 可调用 agent | tool 描述太模糊 |
| `agent.invoke` | 同步调用 agent | `agent.invoke({"messages": [...]})` | messages | 返回消息状态 | 输入结构写错 |
| tool function | 给模型可调用能力 | `def search_runbook(query: str)` | 函数名、类型、docstring | 模型能选择工具 | 函数做了危险动作 |
| `system_prompt` | 约束模型行为 | `"Only answer with evidence"` | 边界和格式 | 输出更稳定 | 规则太泛 |
| `thread_id` | 区分会话 | `config={"configurable": {"thread_id": ...}}` | incident id | 多轮上下文可恢复 | 串用户、串事故 |
| tracing | 追踪调用链 | `LANGSMITH_TRACING=true` | LangSmith key | 能看到 trace | 泄露敏感输入 |

## 在 AIOps 中的作用

LangChain 位于 AIOps 的“解释层”和“应用编排层”：

```text
observability data
  -> alert candidate
  -> LangChain agent / RAG
  -> evidence-based summary
  -> safe next steps
  -> human approval
  -> runbook automation
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>observability data</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; alert candidate</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; LangChain agent / RAG</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>  -&gt; evidence-based summary</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>  -&gt; safe next steps</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 6 行 | <code>  -&gt; human approval</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 7 行 | <code>  -&gt; runbook automation</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


适合：

- 告警摘要。
- runbook 查询。
- 历史事故检索。
- 结构化排障建议。
- 只读工具查询。
- 值班问答。

不适合：

- 直接替代告警规则。
- 直接替代权限系统。
- 无审批执行重启、回滚、删除数据。
- 在没有来源时编造答案。

## 入门实验

### 实验目标

做一个最小 runbook 查询助手：

- 没有 API key 时，先验证本地 runbook 工具。
- 有 API key 时，让 LangChain agent 调用工具并返回建议。
- 输出明确区分“证据”和“下一步”。

### 实验步骤

创建 `langchain_runbook_agent.py`：

```python
import os
from textwrap import dedent

from dotenv import load_dotenv
from langchain.agents import create_agent

load_dotenv()

RUNBOOKS = {
    "HighErrorRate order-api": dedent("""
        service: order-api
        alert: HighErrorRate
        first_checks:
          - Check recent deployments in the last 30 minutes.
          - Check /metrics for http_requests_total by status.
          - Check upstream payment-api latency.
        safe_actions:
          - collect logs
          - compare dashboard before and after deployment
        risky_actions:
          - rollback
          - restart production pods
    """).strip(),
    "HighLatency payment-api": dedent("""
        service: payment-api
        alert: HighLatency
        first_checks:
          - Check database connection pool.
          - Check external payment provider latency.
          - Check p95 and p99 latency by endpoint.
        safe_actions:
          - collect traces
          - inspect slow queries
        risky_actions:
          - scale database
          - disable payment provider route
    """).strip(),
}


def search_runbook(query: str) -> str:
    """Search internal AIOps runbooks by alert name or service name."""
    query_lower = query.lower()
    matches = [
        content
        for title, content in RUNBOOKS.items()
        if any(token in title.lower() or token in content.lower() for token in query_lower.split())
    ]
    return "\n\n---\n\n".join(matches[:2]) if matches else "No matching runbook found."


question = "HighErrorRate on order-api. What should I check first?"

print("local tool result:")
print(search_runbook(question))
print()

if not os.getenv("OPENAI_API_KEY"):
    print("OPENAI_API_KEY is not set. Local tool test passed; set the key to run the agent.")
    raise SystemExit(0)

model = os.getenv("LANGCHAIN_MODEL", "openai:gpt-4.1-mini")

agent = create_agent(
    model=model,
    tools=[search_runbook],
    system_prompt=(
        "You are an AIOps assistant. Use runbook evidence before answering. "
        "Separate evidence, safe next checks, and actions that require human approval. "
        "Never execute production changes."
    ),
)

result = agent.invoke({
    "messages": [{
        "role": "user",
        "content": question,
    }]
})

print("agent answer:")
print(result["messages"][-1].content)
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>import os</code> | 导入 Python 模块，后面的代码会使用这个模块提供的功能。 |
| 第 2 行 | <code>from textwrap import dedent</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 3 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 4 行 | <code>from dotenv import load_dotenv</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 5 行 | <code>from langchain.agents import create_agent</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 6 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 7 行 | <code>load_dotenv()</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 8 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 9 行 | <code>RUNBOOKS = {</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 10 行 | <code>    "HighErrorRate order-api": dedent("""</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 11 行 | <code>        service: order-api</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 12 行 | <code>        alert: HighErrorRate</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 13 行 | <code>        first_checks:</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 14 行 | <code>          - Check recent deployments in the last 30 minutes.</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 15 行 | <code>          - Check /metrics for http_requests_total by status.</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 16 行 | <code>          - Check upstream payment-api latency.</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 17 行 | <code>        safe_actions:</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 18 行 | <code>          - collect logs</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 19 行 | <code>          - compare dashboard before and after deployment</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 20 行 | <code>        risky_actions:</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 21 行 | <code>          - rollback</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 22 行 | <code>          - restart production pods</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 23 行 | <code>    """).strip(),</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 24 行 | <code>    "HighLatency payment-api": dedent("""</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 25 行 | <code>        service: payment-api</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 26 行 | <code>        alert: HighLatency</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 27 行 | <code>        first_checks:</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 28 行 | <code>          - Check database connection pool.</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 29 行 | <code>          - Check external payment provider latency.</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 30 行 | <code>          - Check p95 and p99 latency by endpoint.</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 31 行 | <code>        safe_actions:</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 32 行 | <code>          - collect traces</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 33 行 | <code>          - inspect slow queries</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 34 行 | <code>        risky_actions:</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 35 行 | <code>          - scale database</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 36 行 | <code>          - disable payment provider route</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 37 行 | <code>    """).strip(),</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 38 行 | <code>}</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 39 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 40 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 41 行 | <code>def search_runbook(query: str) -&gt; str:</code> | 定义函数，把一段可复用逻辑命名，后续可以反复调用。 |
| 第 42 行 | <code>    """Search internal AIOps runbooks by alert name or service name."""</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 43 行 | <code>    query_lower = query.lower()</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 44 行 | <code>    matches = [</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 45 行 | <code>        content</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 46 行 | <code>        for title, content in RUNBOOKS.items()</code> | 循环处理一组数据，常用于逐条处理告警、日志或指标样本。 |
| 第 47 行 | <code>        if any(token in title.lower() or token in content.lower() for token in query_lower.split())</code> | 条件判断，只有条件成立时才执行下面缩进的代码。 |
| 第 48 行 | <code>    ]</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 49 行 | <code>    return "\n\n---\n\n".join(matches[:2]) if matches else "No matching runbook found."</code> | 返回函数结果，调用方会拿到这个值继续处理。 |
| 第 50 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 51 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 52 行 | <code>question = "HighErrorRate on order-api. What should I check first?"</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 53 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 54 行 | <code>print("local tool result:")</code> | 打印输出，用来在实验中确认变量、结果或调试信息。 |
| 第 55 行 | <code>print(search_runbook(question))</code> | 打印输出，用来在实验中确认变量、结果或调试信息。 |
| 第 56 行 | <code>print()</code> | 打印输出，用来在实验中确认变量、结果或调试信息。 |
| 第 57 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 58 行 | <code>if not os.getenv("OPENAI_API_KEY"):</code> | 条件判断，只有条件成立时才执行下面缩进的代码。 |
| 第 59 行 | <code>    print("OPENAI_API_KEY is not set. Local tool test passed; set the key to run the agent.")</code> | 打印输出，用来在实验中确认变量、结果或调试信息。 |
| 第 60 行 | <code>    raise SystemExit(0)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 61 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 62 行 | <code>model = os.getenv("LANGCHAIN_MODEL", "openai:gpt-4.1-mini")</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 63 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 64 行 | <code>agent = create_agent(</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 65 行 | <code>    model=model,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 66 行 | <code>    tools=[search_runbook],</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 67 行 | <code>    system_prompt=(</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 68 行 | <code>        "You are an AIOps assistant. Use runbook evidence before answering. "</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 69 行 | <code>        "Separate evidence, safe next checks, and actions that require human approval. "</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 70 行 | <code>        "Never execute production changes."</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 71 行 | <code>    ),</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 72 行 | <code>)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 73 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 74 行 | <code>result = agent.invoke({</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 75 行 | <code>    "messages": [{</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 76 行 | <code>        "role": "user",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 77 行 | <code>        "content": question,</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 78 行 | <code>    }]</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 79 行 | <code>})</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 80 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 81 行 | <code>print("agent answer:")</code> | 打印输出，用来在实验中确认变量、结果或调试信息。 |
| 第 82 行 | <code>print(result["messages"][-1].content)</code> | 打印输出，用来在实验中确认变量、结果或调试信息。 |


运行：

```powershell
python langchain_runbook_agent.py
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>python langchain_runbook_agent.py</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 |


### 验证结果

没有 API key 时，至少应该看到：

```text
local tool result:
service: order-api
alert: HighErrorRate
...
OPENAI_API_KEY is not set. Local tool test passed...
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>local tool result:</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>service: order-api</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>alert: HighErrorRate</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>...</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>OPENAI_API_KEY is not set. Local tool test passed...</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


有 API key 时，应该看到 agent 基于 runbook 输出：

```text
Evidence:
- order-api HighErrorRate runbook says to check recent deployments...

Safe next checks:
1. Check recent deployments in the last 30 minutes.
2. Query http_requests_total by status.

Needs approval:
- rollback
- restart production pods
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Evidence:</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>- order-api HighErrorRate runbook says to check recent deployments...</code> | 列表项，表示一个要点、条件、文件或检查项。 |
| 第 3 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 4 行 | <code>Safe next checks:</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>1. Check recent deployments in the last 30 minutes.</code> | 编号步骤，表示学习或操作时应该按顺序执行。 |
| 第 6 行 | <code>2. Query http_requests_total by status.</code> | 编号步骤，表示学习或操作时应该按顺序执行。 |
| 第 7 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 8 行 | <code>Needs approval:</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 9 行 | <code>- rollback</code> | 列表项，表示一个要点、条件、文件或检查项。 |
| 第 10 行 | <code>- restart production pods</code> | 列表项，表示一个要点、条件、文件或检查项。 |


### 如果没有成功

按顺序检查：

1. 虚拟环境是否激活。
2. 依赖是否安装成功。
3. `.env` 是否存在，`OPENAI_API_KEY` 是否写错。
4. `LANGCHAIN_MODEL` 是否是当前账号可用模型。
5. 工具函数是否有清晰 docstring。
6. 模型输出是否引用了 runbook，而不是凭空回答。

## 常见故障排查

### agent 不调用工具

- 可能原因：工具描述太模糊，问题没有触发工具意图。
- 检查方法：把工具名、docstring、用户问题打印出来。
- 解决办法：让工具描述更具体，例如“Search internal AIOps runbooks by alert name or service name”。

### 工具返回太长

- 可能原因：一次返回整篇文档。
- 检查方法：看 token 使用量和输出长度。
- 解决办法：只返回 top-k 片段、标题、来源和关键步骤。

### 输出像编的

- 可能原因：没有检索到资料，prompt 没要求基于证据回答。
- 检查方法：查看工具返回是否是 `No matching runbook found`。
- 解决办法：要求模型在证据不足时明确说缺信息。

### 多轮对话串事故

- 可能原因：thread id 使用不当。
- 检查方法：看不同 incident 是否复用了同一个会话状态。
- 解决办法：按 incident id、用户、权限域隔离 memory。

### 生产动作风险太高

- 可能原因：工具直接执行写操作。
- 检查方法：梳理工具列表，区分 read-only 和 write。
- 解决办法：高风险动作只返回审批请求，不由 agent 直接执行。

## 面试怎么讲

可以这样说：

```text
LangChain 是我构建 LLM 应用时用来组织模型、工具、消息、RAG、结构化输出和追踪的框架。在 AIOps 里，我不会让模型直接操作生产，而是把 runbook 查询、最近发布查询、指标只读查询做成受控工具，让 agent 基于这些证据生成摘要和下一步检查。真正的重启、回滚、扩缩容必须走审批、审计和 runbook automation。上线前我会用 LangSmith 或类似追踪系统观察工具调用、延迟、错误和回答质量，并准备评估集验证 RAG 和 agent 是否可靠。
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>LangChain 是我构建 LLM 应用时用来组织模型、工具、消息、RAG、结构化输出和追踪的框架。在 AIOps 里，我不会让模型直接操作生产，而是把 runbook 查询、最近发布查询、指标只读查询做成受控工具，让 agent 基于这些证据生成摘要和下一步检查。真正的重启、回滚、扩缩容必须走审批、审计和 runbook automation。上线前我会用 LangSmith 或类似追踪系统观察工具调用、延迟、错误和回答质量，并准备评估集验证 RAG 和 agent 是否可靠。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


## 学习检查清单

- [ ] 我能解释 LangChain 和直接调用 LLM API 的区别。
- [ ] 我能解释 agent = model + harness。
- [ ] 我能说明 tool 是服务端代码执行，不是模型自己执行。
- [ ] 我能写一个只读 runbook 查询工具。
- [ ] 我能说明 RAG 在 LangChain 里的位置。
- [ ] 我能解释 structured output 为什么适合 AIOps。
- [ ] 我能说明 memory 的隔离风险。
- [ ] 我能说清 LangChain、LangGraph、LangSmith 的关系。
- [ ] 我能列出生产高风险动作的审批边界。

## 面试题

1. LangChain 解决了 LLM 应用里的哪些工程问题？
2. agent、model、tool、prompt 分别是什么？
3. 为什么 tool 必须由服务端代码执行？
4. LangChain 和 LangGraph 有什么区别？
5. LangSmith 在生产化里解决什么问题？
6. RAG 和 LangChain 是什么关系？
7. AIOps runbook 查询助手需要哪些工具？
8. structured output 为什么比纯文本更适合告警系统？
9. memory 在值班助手里有什么风险？
10. 为什么不能让 LangChain agent 直接重启生产服务？

## 学习证据

学习完成后，把下面内容提交到 GitHub：

- `langchain_runbook_agent.py`：runbook 查询助手实验。
- `.env.example`：配置模板，不包含真实 key。
- `requirements.txt`：依赖版本。
- `README.md`：说明工具列表、输入输出和安全边界。
- 一张运行截图：包含本地工具结果或 agent 回答。
- 一条复盘笔记：说明哪些动作只读，哪些动作必须人工审批。
