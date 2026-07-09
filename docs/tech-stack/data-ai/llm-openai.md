# LLM / OpenAI API

> 目标：不是只会复制一次 OpenAI API 调用，而是能理解 LLM 在 AIOps 中的合理位置、Responses API 的请求/响应结构、模型选型、提示词合同、结构化输出、工具调用、Embeddings、上下文拼装、安全边界、成本控制、生产化、评估方法，并能做一个可审计、可降级、可测试的告警摘要助手。

## 官方资料

优先读这些 OpenAI 官方资料：

- [OpenAI API Docs](https://developers.openai.com/api/docs)
- [Quickstart](https://developers.openai.com/api/docs/quickstart)
- [Models](https://developers.openai.com/api/docs/models)
- [Latest model guide](https://developers.openai.com/api/docs/guides/latest-model)
- [Text generation](https://developers.openai.com/api/docs/guides/text)
- [Responses API reference](https://platform.openai.com/docs/api-reference/responses)
- [Structured model outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [Function calling](https://developers.openai.com/api/docs/guides/function-calling)
- [Embeddings](https://developers.openai.com/api/docs/guides/embeddings)
- [Prompt engineering](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [Production best practices](https://developers.openai.com/api/docs/guides/production-best-practices)
- [API deployment checklist](https://developers.openai.com/api/docs/guides/deployment-checklist)
- [Rate limits](https://platform.openai.com/settings/organization/limits)
- [Usage dashboard](https://platform.openai.com/usage)

说明：本文按 OpenAI 官方 API 文档路线整理，用 AIOps 场景重新讲解，不复制官方全文。模型名称和能力会随时间更新，学习时以官方 Models 和 Latest model guide 为准。

## 场景开场

一次线上告警来了：

```text
HighErrorRate
service=order-api
severity=critical
error_rate=23%
p95_latency=1800ms
recent_deploy=2026.07.01.1
logs=db connection timeout increased
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>HighErrorRate</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>service=order-api</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>severity=critical</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>error_rate=23%</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>p95_latency=1800ms</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 6 行 | <code>recent_deploy=2026.07.01.1</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 7 行 | <code>logs=db connection timeout increased</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


传统监控告诉你“有问题”。但值班工程师还想快速知道：

- 现在的现象能不能用人话总结？
- 可能和哪次变更有关？
- 先查数据库、上游服务、还是最近发布？
- 有哪些 runbook 可以参考？
- 哪些信息不足，不能下结论？
- 能不能生成一份给群里的初步通报？

LLM 的价值不是替代 Prometheus、日志系统、数据库、权限系统，也不是直接替你修生产。它更适合作为解释层和协作层：把已经查到的事实整理成可读摘要、候选原因、下一步检查、沟通文案和结构化结果。

AIOps 里用 LLM，关键不是“让模型猜”，而是“把事实和边界给清楚，让模型在约束里帮助人更快理解”。

## 一句话人话版

LLM / OpenAI API 是把大语言模型能力接入程序的方式：你把任务、上下文、工具和输出格式发给模型，模型返回文本、结构化 JSON、工具调用请求或向量表示，程序再把这些结果纳入可审计的 AIOps 流程。

## 小白可能会问

- LLM 在 AIOps 中到底解决什么问题？
- 为什么不能让模型直接替我判断根因？
- OpenAI API 和 ChatGPT 有什么区别？
- Responses API、Chat Completions API、Embeddings API 分别干什么？
- `instructions` 和 `input` 怎么分工？
- `response.output_text` 为什么能拿到文本？
- 结构化输出为什么比“请输出 JSON”可靠？
- function calling 是不是模型真的执行了函数？
- embeddings 和 RAG 是什么关系？
- 模型会不会编造日志、指标和根因？
- API key 为什么不能提交到 GitHub？
- 如何控制成本、超时、重试和降级？
- 如何评估一个告警摘要助手有没有用？

## 官方知识地图

OpenAI API 官方文档可以按这张地图理解：

```text
OpenAI API
  -> Get started
     -> Quickstart
     -> Models
     -> SDKs and CLI
     -> Latest model guide
  -> Core concepts
     -> Text generation
     -> Responses API
     -> Structured Outputs
     -> Function calling
     -> Tools
  -> Specialized models
     -> Embeddings
     -> Moderation
     -> Audio / image / realtime
  -> Run and scale
     -> Conversation state
     -> Streaming
     -> Background mode
     -> Prompt caching
     -> Counting tokens
     -> Latency optimization
     -> Cost optimization
  -> Going live
     -> Production best practices
     -> Deployment checklist
     -> Safety best practices
     -> Rate limits
     -> Usage monitoring
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>OpenAI API</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; Get started</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>     -&gt; Quickstart</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>     -&gt; Models</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>     -&gt; SDKs and CLI</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 6 行 | <code>     -&gt; Latest model guide</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 7 行 | <code>  -&gt; Core concepts</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 8 行 | <code>     -&gt; Text generation</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 9 行 | <code>     -&gt; Responses API</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 10 行 | <code>     -&gt; Structured Outputs</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 11 行 | <code>     -&gt; Function calling</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 12 行 | <code>     -&gt; Tools</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 13 行 | <code>  -&gt; Specialized models</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 14 行 | <code>     -&gt; Embeddings</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 15 行 | <code>     -&gt; Moderation</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 16 行 | <code>     -&gt; Audio / image / realtime</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 17 行 | <code>  -&gt; Run and scale</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 18 行 | <code>     -&gt; Conversation state</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 19 行 | <code>     -&gt; Streaming</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 20 行 | <code>     -&gt; Background mode</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 21 行 | <code>     -&gt; Prompt caching</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 22 行 | <code>     -&gt; Counting tokens</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 23 行 | <code>     -&gt; Latency optimization</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 24 行 | <code>     -&gt; Cost optimization</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 25 行 | <code>  -&gt; Going live</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 26 行 | <code>     -&gt; Production best practices</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 27 行 | <code>     -&gt; Deployment checklist</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 28 行 | <code>     -&gt; Safety best practices</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 29 行 | <code>     -&gt; Rate limits</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 30 行 | <code>     -&gt; Usage monitoring</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


学习路线：

```text
API key
  -> install SDK
  -> first Responses API call
  -> instructions and input
  -> output_text
  -> model selection
  -> prompt contract
  -> structured outputs
  -> function calling
  -> embeddings
  -> AIOps context assembly
  -> safety and production controls
  -> evaluation
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>API key</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; install SDK</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; first Responses API call</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>  -&gt; instructions and input</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>  -&gt; output_text</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 6 行 | <code>  -&gt; model selection</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 7 行 | <code>  -&gt; prompt contract</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 8 行 | <code>  -&gt; structured outputs</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 9 行 | <code>  -&gt; function calling</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 10 行 | <code>  -&gt; embeddings</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 11 行 | <code>  -&gt; AIOps context assembly</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 12 行 | <code>  -&gt; safety and production controls</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 13 行 | <code>  -&gt; evaluation</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


初学不要同时学完所有 API。AIOps 入门优先掌握：

- 文本生成：生成摘要和建议。
- 结构化输出：让程序可靠读取模型结果。
- 函数调用：让模型请求你的程序查询数据或执行受控动作。
- Embeddings：做相似告警、相似事故、runbook 语义检索。
- 生产边界：密钥、限流、降级、审计、评估。

## LLM 在 AIOps 链路中的位置

合理位置：

```text
Prometheus / Loki / Elasticsearch / MySQL / GitHub / Kubernetes
  -> rules, queries, anomaly detection, retrieval
  -> structured facts
  -> LLM summary / explanation / extraction / next-check suggestions
  -> human review
  -> approved runbook automation
  -> audit log
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Prometheus / Loki / Elasticsearch / MySQL / GitHub / Kubernetes</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; rules, queries, anomaly detection, retrieval</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; structured facts</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>  -&gt; LLM summary / explanation / extraction / next-check suggestions</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>  -&gt; human review</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 6 行 | <code>  -&gt; approved runbook automation</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 7 行 | <code>  -&gt; audit log</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


不合理位置：

```text
raw alerts and logs
  -> LLM guesses root cause
  -> LLM runs production command
  -> no approval
  -> no audit
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>raw alerts and logs</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; LLM guesses root cause</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; LLM runs production command</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>  -&gt; no approval</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>  -&gt; no audit</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


| 能力 | LLM 适合做吗 | 说明 |
|---|---:|---|
| 告警摘要 | 适合 | 把多源事实压缩成人话 |
| 日志摘要 | 适合 | 先做检索和聚合，再让模型解释 |
| 候选原因排序 | 可以 | 必须基于证据，不能当最终根因 |
| runbook 改写 | 适合 | 把长文档变成步骤清单 |
| 生成通报 | 适合 | 但要标出不确定信息 |
| 自动执行修复 | 高风险 | 必须有权限、规则、审批、审计 |
| 直接替代监控规则 | 不适合 | 监控规则仍是基础 |
| 直接读取所有日志 | 不适合 | 应先检索、过滤、脱敏和摘要 |
| 事故复盘辅助 | 适合 | 用于整理时间线和材料 |
| 合规判断 | 谨慎 | 需要规则、人工和审计 |

核心原则：

```text
LLM 不负责发现全部事实。
LLM 负责在给定事实上做语言理解、整理、提取和建议。
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>LLM 不负责发现全部事实。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>LLM 负责在给定事实上做语言理解、整理、提取和建议。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


## OpenAI API 和 ChatGPT 的区别

ChatGPT 是面向人的产品界面。OpenAI API 是面向程序的接口。

| 维度 | ChatGPT | OpenAI API |
|---|---|---|
| 使用者 | 人 | 程序 |
| 输入 | 对话框、文件、工具 | HTTP 请求、SDK 调用 |
| 输出 | 聊天回复 | JSON 响应、文本、结构化对象、工具调用 |
| 控制 | 人手动操作 | 代码控制、日志、限流、测试 |
| 集成 | 个人或团队工作流 | 应用、服务、自动化、数据系统 |
| AIOps 用法 | 辅助排障问答 | 嵌入告警平台、runbook、RAG、API |

学习 AIOps 工程时，要把模型调用看成“一个外部 API 依赖”，而不是神秘聊天框。

## 核心概念

### model

`model` 是你调用的模型 ID。不同模型在能力、速度、价格、上下文长度、推理能力、工具使用能力上不同。

示例：

```python
model = "gpt-5.5"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>model = "gpt-5.5"</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |


长期维护时，不建议把模型散落在代码各处。更好的方式是环境变量：

```python
import os

model = os.getenv("OPENAI_MODEL", "gpt-5.5")
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>import os</code> | 导入 Python 模块，后面的代码会使用这个模块提供的功能。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 3 行 | <code>model = os.getenv("OPENAI_MODEL", "gpt-5.5")</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |


这样迁移模型时只改配置。

### instructions

`instructions` 放稳定规则，例如：

- 你是什么角色。
- 只能根据输入事实回答。
- 不确定时必须说信息不足。
- 输出风格。
- 安全边界。

示例：

```python
instructions = """
你是一个严谨的 AIOps 值班助手。
只根据输入事实分析。
不确定时写“信息不足”。
不要编造不存在的日志、指标、变更或结论。
"""
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>instructions = """</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 2 行 | <code>你是一个严谨的 AIOps 值班助手。</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 3 行 | <code>只根据输入事实分析。</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 4 行 | <code>不确定时写“信息不足”。</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 5 行 | <code>不要编造不存在的日志、指标、变更或结论。</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 6 行 | <code>"""</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |


### input

`input` 放本次请求的具体内容，例如：

- 告警。
- 指标。
- 日志摘要。
- 最近变更。
- runbook 片段。
- 用户问题。

### output

Responses API 返回的响应里有 `output`，其中可能包含：

- 模型消息。
- 文本内容。
- 工具调用。
- 推理相关项目。

最常用的读取方式是：

```python
print(response.output_text)
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>print(response.output_text)</code> | 打印输出，用来在实验中确认变量、结果或调试信息。 |


### token

token 可以粗略理解为模型处理文本的计量单位。输入和输出都会消耗 token。

AIOps 里要特别注意：

- 原始日志可能非常长。
- 重复告警可能造成大量相同调用。
- 长 runbook 需要先切块和检索。
- 输出越长，成本和延迟越高。

### hallucination

幻觉不是“模型坏了”，而是模型可能在证据不足时生成看似合理但未被输入支持的内容。

AIOps 里降低幻觉的关键：

- 只给结构化事实。
- 明确要求“不足就说不足”。
- 使用结构化输出。
- 把证据字段和结论字段分开。
- 高风险动作必须人工确认。
- 用测试集评估输出质量。

## 安装 SDK

创建虚拟环境：

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install openai python-dotenv pydantic
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>python -m venv .venv</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 |
| 第 2 行 | <code>source .venv/bin/activate</code> | 执行 `source` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>python -m pip install --upgrade pip</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 4 行 | <code>pip install openai python-dotenv pydantic</code> | 管理 Python 依赖包，通常用于安装实验需要的库。 |


Windows PowerShell：

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install openai python-dotenv pydantic
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>python -m venv .venv</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 |
| 第 2 行 | <code>.venv\Scripts\Activate.ps1</code> | 执行 `.venv\scripts\activate.ps1` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>python -m pip install --upgrade pip</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 4 行 | <code>pip install openai python-dotenv pydantic</code> | 管理 Python 依赖包，通常用于安装实验需要的库。 |


确认安装：

```bash
python -c "import openai; print(openai.__version__)"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>python -c "import openai; print(openai.__version__)"</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 |


## API Key

OpenAI API 使用 API key 认证。不要把 API key 写死在代码、README、截图、日志或 Git 提交里。

临时设置：

```bash
export OPENAI_API_KEY="你的 key"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>export OPENAI_API_KEY="你的 key"</code> | 设置 shell 环境变量，常用于配置 API Key、端口或运行参数。 |


PowerShell：

```powershell
$env:OPENAI_API_KEY="你的 key"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>$env:OPENAI_API_KEY="你的 key"</code> | 执行 `$env:openai_api_key="你的` 相关命令，后面的参数决定它具体操作什么对象。 其中 `$` 开头的是 PowerShell 变量，用来保存临时值或配置。 |


`.env.example`：

```text
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-5.5
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>OPENAI_API_KEY=your_api_key_here</code> | 环境变量或键值示例，等号左边是名称，右边是要配置的值。 |
| 第 2 行 | <code>OPENAI_MODEL=gpt-5.5</code> | 环境变量或键值示例，等号左边是名称，右边是要配置的值。 |


`.gitignore`：

```text
.env
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>.env</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


读取 `.env`：

```python
from dotenv import load_dotenv

load_dotenv()
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>from dotenv import load_dotenv</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 3 行 | <code>load_dotenv()</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |


生产环境建议使用：

- 云平台 secret manager。
- Kubernetes Secret。
- CI/CD secret。
- 项目级 API key。
- 独立 staging / production project。

如果 key 泄露，要立刻撤销并重新生成。

## 第一个 Responses API 调用

`hello_openai.py`：

```python
import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI()
model = os.getenv("OPENAI_MODEL", "gpt-5.5")

response = client.responses.create(
    model=model,
    instructions="你是一个严谨的 AIOps 值班助手，只根据输入事实回答。",
    input=(
        "服务 order-api 的 5xx 错误率从 1% 升到 23%，"
        "p95 延迟从 120ms 升到 1800ms。请给出初步判断。"
    ),
)

print(response.output_text)
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>import os</code> | 导入 Python 模块，后面的代码会使用这个模块提供的功能。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 3 行 | <code>from dotenv import load_dotenv</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 4 行 | <code>from openai import OpenAI</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 5 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 6 行 | <code>load_dotenv()</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 7 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 8 行 | <code>client = OpenAI()</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 9 行 | <code>model = os.getenv("OPENAI_MODEL", "gpt-5.5")</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 10 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 11 行 | <code>response = client.responses.create(</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 12 行 | <code>    model=model,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 13 行 | <code>    instructions="你是一个严谨的 AIOps 值班助手，只根据输入事实回答。",</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 14 行 | <code>    input=(</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 15 行 | <code>        "服务 order-api 的 5xx 错误率从 1% 升到 23%，"</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 16 行 | <code>        "p95 延迟从 120ms 升到 1800ms。请给出初步判断。"</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 17 行 | <code>    ),</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 18 行 | <code>)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 19 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 20 行 | <code>print(response.output_text)</code> | 打印输出，用来在实验中确认变量、结果或调试信息。 |


运行：

```bash
python hello_openai.py
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>python hello_openai.py</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 |


这段代码的链路：

```text
Python code
  -> OpenAI SDK
  -> POST /v1/responses
  -> model
  -> response object
  -> response.output_text
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Python code</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; OpenAI SDK</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; POST /v1/responses</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>  -&gt; model</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>  -&gt; response object</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 6 行 | <code>  -&gt; response.output_text</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


## Responses API 请求结构

一个常见请求包含：

```python
response = client.responses.create(
    model=model,
    instructions="稳定角色和规则",
    input="本次任务和上下文",
    max_output_tokens=800,
)
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>response = client.responses.create(</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 2 行 | <code>    model=model,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 3 行 | <code>    instructions="稳定角色和规则",</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 4 行 | <code>    input="本次任务和上下文",</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 5 行 | <code>    max_output_tokens=800,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 6 行 | <code>)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |


常用字段：

| 字段 | 作用 | AIOps 示例 |
|---|---|---|
| `model` | 选择模型 | `gpt-5.5` 或环境变量 |
| `instructions` | 稳定规则 | 只根据事实、不编造 |
| `input` | 本次输入 | 告警、指标、日志、变更 |
| `max_output_tokens` | 限制输出长度 | 防止事故摘要过长 |
| `temperature` | 控制随机性 | 摘要类任务通常偏低 |
| `text` / `text_format` | 控制文本或结构化输出 | JSON schema / Pydantic |
| `tools` | 给模型可调用工具 | 查询变更、查询 runbook |
| `stream` | 流式输出 | 前端逐字展示 |
| `metadata` | 附加元数据 | `alert_id`、`service` |
| `store` | 是否保存响应 | 按数据策略决定 |

学习阶段先掌握 `model`、`instructions`、`input`、`output_text`、`text_format`。

## 模型选型

模型选型不要凭记忆。以官方 Models 和 Latest model guide 为准。

在 AIOps 中可以按任务选：

| 任务 | 关注点 | 选型思路 |
|---|---|---|
| 告警一句话摘要 | 延迟、成本 | 选速度和成本更合适的模型 |
| 复杂根因候选分析 | 推理质量 | 选更强推理模型，并做评估 |
| runbook 改写 | 指令遵循、结构化 | 选结构化输出表现好的模型 |
| 工具调用 agent | 工具选择能力 | 选工具调用能力强的模型 |
| 大量相似告警分类 | 成本、批处理 | 先规则过滤，再模型 |
| RAG 语义检索 | 向量质量 | 用 embedding 模型 |

模型配置建议：

```python
MODEL = os.getenv("OPENAI_MODEL", "gpt-5.5")
EMBEDDING_MODEL = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>MODEL = os.getenv("OPENAI_MODEL", "gpt-5.5")</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 2 行 | <code>EMBEDDING_MODEL = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |


不要在所有文件里写死模型名。模型升级应该是配置变更加评估，而不是全仓库搜索替换。

## 提示词合同

提示词不是随便写几句话。工程里的提示词应该像 API 合同一样明确。

一个 AIOps 提示词至少包含：

| 部分 | 要回答的问题 | 示例 |
|---|---|---|
| 角色 | 模型扮演谁 | AIOps 值班助手 |
| 任务 | 要产出什么 | 生成告警摘要 |
| 事实范围 | 只能用哪些信息 | 只根据输入 JSON |
| 输出格式 | 程序如何读取 | JSON / Markdown / 字段 |
| 不确定性 | 信息不足怎么办 | 写“信息不足” |
| 安全边界 | 禁止做什么 | 不给危险命令 |
| 证据要求 | 每个判断如何支撑 | 标出 evidence |

示例：

```text
你是一个严谨的 AIOps 值班助手。

任务：
基于输入 JSON，总结告警现象、候选原因和下一步检查。

规则：
1. 只能根据输入事实回答。
2. 如果证据不足，必须写“信息不足”。
3. 不要编造日志、指标、变更、服务依赖或根因。
4. 不要给出自动重启、删除数据、回滚生产等高风险命令。
5. 每个候选原因都要列出 evidence。

输出：
使用简洁中文。
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>你是一个严谨的 AIOps 值班助手。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 3 行 | <code>任务：</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>基于输入 JSON，总结告警现象、候选原因和下一步检查。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 6 行 | <code>规则：</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 7 行 | <code>1. 只能根据输入事实回答。</code> | 编号步骤，表示学习或操作时应该按顺序执行。 |
| 第 8 行 | <code>2. 如果证据不足，必须写“信息不足”。</code> | 编号步骤，表示学习或操作时应该按顺序执行。 |
| 第 9 行 | <code>3. 不要编造日志、指标、变更、服务依赖或根因。</code> | 编号步骤，表示学习或操作时应该按顺序执行。 |
| 第 10 行 | <code>4. 不要给出自动重启、删除数据、回滚生产等高风险命令。</code> | 编号步骤，表示学习或操作时应该按顺序执行。 |
| 第 11 行 | <code>5. 每个候选原因都要列出 evidence。</code> | 编号步骤，表示学习或操作时应该按顺序执行。 |
| 第 12 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 13 行 | <code>输出：</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 14 行 | <code>使用简洁中文。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


好的提示词不是越长越好。它应该稳定、可测试、可版本化。

## 上下文拼装

不要把所有原始日志一股脑塞给模型。先把事实整理成结构化上下文。

推荐结构：

```python
context = {
    "alert": {
        "id": "a-20260702-001",
        "service": "order-api",
        "name": "HighErrorRate",
        "severity": "critical",
        "started_at": "2026-07-02T09:10:00Z",
    },
    "metrics": {
        "error_rate": "23%",
        "p95_latency_ms": 1800,
        "request_rate_per_second": 700,
    },
    "logs": [
        "database connection timeout increased",
        "upstream payment-api returned 5xx",
    ],
    "changes": [
        "order-api deployed version 2026.07.02.1 at 09:02",
    ],
    "runbooks": [
        "Check database connection pool saturation",
        "Compare error rate before and after deploy",
    ],
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>context = {</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 2 行 | <code>    "alert": {</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 3 行 | <code>        "id": "a-20260702-001",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 4 行 | <code>        "service": "order-api",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 5 行 | <code>        "name": "HighErrorRate",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 6 行 | <code>        "severity": "critical",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 7 行 | <code>        "started_at": "2026-07-02T09:10:00Z",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 8 行 | <code>    },</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 9 行 | <code>    "metrics": {</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 10 行 | <code>        "error_rate": "23%",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 11 行 | <code>        "p95_latency_ms": 1800,</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 12 行 | <code>        "request_rate_per_second": 700,</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 13 行 | <code>    },</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 14 行 | <code>    "logs": [</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 15 行 | <code>        "database connection timeout increased",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 16 行 | <code>        "upstream payment-api returned 5xx",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 17 行 | <code>    ],</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 18 行 | <code>    "changes": [</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 19 行 | <code>        "order-api deployed version 2026.07.02.1 at 09:02",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 20 行 | <code>    ],</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 21 行 | <code>    "runbooks": [</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 22 行 | <code>        "Check database connection pool saturation",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 23 行 | <code>        "Compare error rate before and after deploy",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 24 行 | <code>    ],</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 25 行 | <code>}</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |


调用：

```python
import json

response = client.responses.create(
    model=model,
    instructions="你是 AIOps 值班助手。只根据 JSON 上下文分析，不要编造。",
    input=json.dumps(context, ensure_ascii=False),
    max_output_tokens=800,
)
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>import json</code> | 导入 Python 模块，后面的代码会使用这个模块提供的功能。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 3 行 | <code>response = client.responses.create(</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 4 行 | <code>    model=model,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 5 行 | <code>    instructions="你是 AIOps 值班助手。只根据 JSON 上下文分析，不要编造。",</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 6 行 | <code>    input=json.dumps(context, ensure_ascii=False),</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 7 行 | <code>    max_output_tokens=800,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 8 行 | <code>)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |


上下文治理原则：

- 先查数据，再让模型总结。
- 先脱敏，再调用外部 API。
- 先聚合，再发送日志。
- 保留时间范围。
- 保留数据来源。
- 保留“不确定”字段。
- 不把密钥、token、身份证、客户隐私发给模型。

## 结构化输出

工程里不要只依赖自由文本。AIOps API 通常需要程序继续处理模型输出，所以应该尽量使用结构化输出。

坏方式：

```text
请输出 JSON，不要输出多余内容。
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>请输出 JSON，不要输出多余内容。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


这比自由文本好一点，但不够稳。

更好的方式是用官方 Structured Outputs，让模型遵守你定义的 schema。

### Pydantic 结构化输出

```python
import json
import os

from dotenv import load_dotenv
from openai import OpenAI
from pydantic import BaseModel, Field

load_dotenv()

client = OpenAI()
model = os.getenv("OPENAI_MODEL", "gpt-5.5")


class Cause(BaseModel):
    title: str
    evidence: list[str]
    confidence: float = Field(ge=0, le=1)


class AlertAnalysis(BaseModel):
    summary: str
    severity: str
    possible_causes: list[Cause]
    next_checks: list[str]
    safe_actions: list[str]
    missing_information: list[str]


context = {
    "alert": {
        "service": "order-api",
        "name": "HighErrorRate",
        "severity": "critical",
    },
    "metrics": {
        "error_rate": "23%",
        "p95_latency_ms": 1800,
    },
    "logs": [
        "database connection timeout increased",
    ],
    "changes": [
        "order-api deployed version 2026.07.02.1 at 09:02",
    ],
}

response = client.responses.parse(
    model=model,
    instructions=(
        "你是严谨的 AIOps 值班助手。"
        "只根据输入 JSON 分析。"
        "不确定时把缺失信息写入 missing_information。"
    ),
    input=json.dumps(context, ensure_ascii=False),
    text_format=AlertAnalysis,
)

analysis = response.output_parsed
print(analysis.model_dump_json(indent=2))
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>import json</code> | 导入 Python 模块，后面的代码会使用这个模块提供的功能。 |
| 第 2 行 | <code>import os</code> | 导入 Python 模块，后面的代码会使用这个模块提供的功能。 |
| 第 3 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 4 行 | <code>from dotenv import load_dotenv</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 5 行 | <code>from openai import OpenAI</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 6 行 | <code>from pydantic import BaseModel, Field</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 7 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 8 行 | <code>load_dotenv()</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 9 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 10 行 | <code>client = OpenAI()</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 11 行 | <code>model = os.getenv("OPENAI_MODEL", "gpt-5.5")</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 12 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 13 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 14 行 | <code>class Cause(BaseModel):</code> | 定义类，用来组织一组数据和行为。 |
| 第 15 行 | <code>    title: str</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 16 行 | <code>    evidence: list[str]</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 17 行 | <code>    confidence: float = Field(ge=0, le=1)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 18 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 19 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 20 行 | <code>class AlertAnalysis(BaseModel):</code> | 定义类，用来组织一组数据和行为。 |
| 第 21 行 | <code>    summary: str</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 22 行 | <code>    severity: str</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 23 行 | <code>    possible_causes: list[Cause]</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 24 行 | <code>    next_checks: list[str]</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 25 行 | <code>    safe_actions: list[str]</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 26 行 | <code>    missing_information: list[str]</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 27 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 28 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 29 行 | <code>context = {</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 30 行 | <code>    "alert": {</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 31 行 | <code>        "service": "order-api",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 32 行 | <code>        "name": "HighErrorRate",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 33 行 | <code>        "severity": "critical",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 34 行 | <code>    },</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 35 行 | <code>    "metrics": {</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 36 行 | <code>        "error_rate": "23%",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 37 行 | <code>        "p95_latency_ms": 1800,</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 38 行 | <code>    },</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 39 行 | <code>    "logs": [</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 40 行 | <code>        "database connection timeout increased",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 41 行 | <code>    ],</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 42 行 | <code>    "changes": [</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 43 行 | <code>        "order-api deployed version 2026.07.02.1 at 09:02",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 44 行 | <code>    ],</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 45 行 | <code>}</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 46 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 47 行 | <code>response = client.responses.parse(</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 48 行 | <code>    model=model,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 49 行 | <code>    instructions=(</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 50 行 | <code>        "你是严谨的 AIOps 值班助手。"</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 51 行 | <code>        "只根据输入 JSON 分析。"</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 52 行 | <code>        "不确定时把缺失信息写入 missing_information。"</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 53 行 | <code>    ),</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 54 行 | <code>    input=json.dumps(context, ensure_ascii=False),</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 55 行 | <code>    text_format=AlertAnalysis,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 56 行 | <code>)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 57 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 58 行 | <code>analysis = response.output_parsed</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 59 行 | <code>print(analysis.model_dump_json(indent=2))</code> | 打印输出，用来在实验中确认变量、结果或调试信息。 |


结构化输出的价值：

- 字段稳定。
- 枚举和类型更可靠。
- 程序可以直接读取。
- 更容易测试。
- 更容易保存到数据库。
- 更容易给前端展示。

### 结构化输出 vs JSON mode

| 方式 | 能保证合法 JSON | 能保证 schema | 推荐度 |
|---|---:|---:|---:|
| 自由文本 | 否 | 否 | 低 |
| 提示词要求 JSON | 不稳定 | 否 | 中低 |
| JSON mode | 是 | 否 | 中 |
| Structured Outputs | 是 | 是 | 高 |

AIOps 中，只要模型输出要进入自动化流程，就优先考虑 Structured Outputs。

## Function Calling

Function calling 不是模型真的执行了你的函数。它的流程是：

```text
1. 你把可用工具的名称、描述、参数 schema 发给模型
2. 模型判断需要调用某个工具
3. 模型返回 tool call 和参数
4. 你的程序校验参数并执行函数
5. 你的程序把工具结果发回模型
6. 模型基于工具结果生成最终回答
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>1. 你把可用工具的名称、描述、参数 schema 发给模型</code> | 编号步骤，表示学习或操作时应该按顺序执行。 |
| 第 2 行 | <code>2. 模型判断需要调用某个工具</code> | 编号步骤，表示学习或操作时应该按顺序执行。 |
| 第 3 行 | <code>3. 模型返回 tool call 和参数</code> | 编号步骤，表示学习或操作时应该按顺序执行。 |
| 第 4 行 | <code>4. 你的程序校验参数并执行函数</code> | 编号步骤，表示学习或操作时应该按顺序执行。 |
| 第 5 行 | <code>5. 你的程序把工具结果发回模型</code> | 编号步骤，表示学习或操作时应该按顺序执行。 |
| 第 6 行 | <code>6. 模型基于工具结果生成最终回答</code> | 编号步骤，表示学习或操作时应该按顺序执行。 |


这点非常重要：

```text
模型提出要调用工具。
真正执行工具的是你的代码。
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>模型提出要调用工具。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>真正执行工具的是你的代码。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


### AIOps 工具调用示例

场景：用户问“order-api 最近有没有发布？和告警可能有关吗？”

你可以给模型一个工具：

```python
import json
import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI()
model = os.getenv("OPENAI_MODEL", "gpt-5.5")


def get_recent_deploys(service: str) -> list[dict]:
    # 学习示例：真实项目里这里会查 GitHub、Argo CD、数据库或变更平台。
    if service == "order-api":
        return [
            {
                "service": "order-api",
                "version": "2026.07.02.1",
                "deployed_at": "2026-07-02T09:02:00Z",
                "author": "platform-team",
            }
        ]
    return []


tools = [
    {
        "type": "function",
        "name": "get_recent_deploys",
        "description": "Get recent deploy records for a service.",
        "parameters": {
            "type": "object",
            "properties": {
                "service": {
                    "type": "string",
                    "description": "Service name, for example order-api.",
                }
            },
            "required": ["service"],
            "additionalProperties": False,
        },
        "strict": True,
    }
]

input_list = [
    {
        "role": "user",
        "content": (
            "告警：order-api 5xx 错误率升高到 23%。"
            "请检查最近发布，并给出是否可能相关的判断。"
        ),
    }
]

response = client.responses.create(
    model=model,
    instructions="你是 AIOps 值班助手。需要外部事实时先调用工具。",
    tools=tools,
    input=input_list,
)

input_list += response.output

for item in response.output:
    if item.type == "function_call" and item.name == "get_recent_deploys":
        args = json.loads(item.arguments)
        deploys = get_recent_deploys(args["service"])
        input_list.append(
            {
                "type": "function_call_output",
                "call_id": item.call_id,
                "output": json.dumps(deploys, ensure_ascii=False),
            }
        )

final_response = client.responses.create(
    model=model,
    instructions=(
        "你是 AIOps 值班助手。"
        "只能基于告警和工具返回的发布记录分析，不能把相关性当成确定根因。"
    ),
    tools=tools,
    input=input_list,
)

print(final_response.output_text)
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>import json</code> | 导入 Python 模块，后面的代码会使用这个模块提供的功能。 |
| 第 2 行 | <code>import os</code> | 导入 Python 模块，后面的代码会使用这个模块提供的功能。 |
| 第 3 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 4 行 | <code>from dotenv import load_dotenv</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 5 行 | <code>from openai import OpenAI</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 6 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 7 行 | <code>load_dotenv()</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 8 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 9 行 | <code>client = OpenAI()</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 10 行 | <code>model = os.getenv("OPENAI_MODEL", "gpt-5.5")</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 11 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 12 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 13 行 | <code>def get_recent_deploys(service: str) -&gt; list[dict]:</code> | 定义函数，把一段可复用逻辑命名，后续可以反复调用。 |
| 第 14 行 | <code>    # 学习示例：真实项目里这里会查 GitHub、Argo CD、数据库或变更平台。</code> | Python 注释行，用来解释代码目的，不会被解释器执行。 |
| 第 15 行 | <code>    if service == "order-api":</code> | 条件判断，只有条件成立时才执行下面缩进的代码。 |
| 第 16 行 | <code>        return [</code> | 返回函数结果，调用方会拿到这个值继续处理。 |
| 第 17 行 | <code>            {</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 18 行 | <code>                "service": "order-api",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 19 行 | <code>                "version": "2026.07.02.1",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 20 行 | <code>                "deployed_at": "2026-07-02T09:02:00Z",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 21 行 | <code>                "author": "platform-team",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 22 行 | <code>            }</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 23 行 | <code>        ]</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 24 行 | <code>    return []</code> | 返回函数结果，调用方会拿到这个值继续处理。 |
| 第 25 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 26 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 27 行 | <code>tools = [</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 28 行 | <code>    {</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 29 行 | <code>        "type": "function",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 30 行 | <code>        "name": "get_recent_deploys",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 31 行 | <code>        "description": "Get recent deploy records for a service.",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 32 行 | <code>        "parameters": {</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 33 行 | <code>            "type": "object",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 34 行 | <code>            "properties": {</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 35 行 | <code>                "service": {</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 36 行 | <code>                    "type": "string",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 37 行 | <code>                    "description": "Service name, for example order-api.",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 38 行 | <code>                }</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 39 行 | <code>            },</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 40 行 | <code>            "required": ["service"],</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 41 行 | <code>            "additionalProperties": False,</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 42 行 | <code>        },</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 43 行 | <code>        "strict": True,</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 44 行 | <code>    }</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 45 行 | <code>]</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 46 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 47 行 | <code>input_list = [</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 48 行 | <code>    {</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 49 行 | <code>        "role": "user",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 50 行 | <code>        "content": (</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 51 行 | <code>            "告警：order-api 5xx 错误率升高到 23%。"</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 52 行 | <code>            "请检查最近发布，并给出是否可能相关的判断。"</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 53 行 | <code>        ),</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 54 行 | <code>    }</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 55 行 | <code>]</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 56 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 57 行 | <code>response = client.responses.create(</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 58 行 | <code>    model=model,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 59 行 | <code>    instructions="你是 AIOps 值班助手。需要外部事实时先调用工具。",</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 60 行 | <code>    tools=tools,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 61 行 | <code>    input=input_list,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 62 行 | <code>)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 63 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 64 行 | <code>input_list += response.output</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 65 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 66 行 | <code>for item in response.output:</code> | 循环处理一组数据，常用于逐条处理告警、日志或指标样本。 |
| 第 67 行 | <code>    if item.type == "function_call" and item.name == "get_recent_deploys":</code> | 条件判断，只有条件成立时才执行下面缩进的代码。 |
| 第 68 行 | <code>        args = json.loads(item.arguments)</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 69 行 | <code>        deploys = get_recent_deploys(args["service"])</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 70 行 | <code>        input_list.append(</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 71 行 | <code>            {</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 72 行 | <code>                "type": "function_call_output",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 73 行 | <code>                "call_id": item.call_id,</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 74 行 | <code>                "output": json.dumps(deploys, ensure_ascii=False),</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 75 行 | <code>            }</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 76 行 | <code>        )</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 77 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 78 行 | <code>final_response = client.responses.create(</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 79 行 | <code>    model=model,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 80 行 | <code>    instructions=(</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 81 行 | <code>        "你是 AIOps 值班助手。"</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 82 行 | <code>        "只能基于告警和工具返回的发布记录分析，不能把相关性当成确定根因。"</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 83 行 | <code>    ),</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 84 行 | <code>    tools=tools,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 85 行 | <code>    input=input_list,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 86 行 | <code>)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 87 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 88 行 | <code>print(final_response.output_text)</code> | 打印输出，用来在实验中确认变量、结果或调试信息。 |


### 工具调用安全边界

工具调用能连接真实系统，所以风险更高。

按风险分级：

| 工具 | 风险 | 建议 |
|---|---:|---|
| 查询最近发布 | 低 | 可自动执行 |
| 查询日志摘要 | 低 | 可自动执行，注意脱敏 |
| 查询数据库状态 | 中 | 限定只读、限流 |
| 创建工单 | 中 | 可自动草稿，人工确认 |
| 重启服务 | 高 | 必须审批和审计 |
| 回滚生产 | 高 | 必须强规则、审批、权限 |
| 删除数据 | 极高 | 不应由模型直接触发 |

工具描述要具体，参数 schema 要严格，执行前要做服务端校验。

## Embeddings

Embedding 是把文本转换成向量。向量之间的距离可以表示文本语义相似度。

OpenAI 官方 embeddings 文档强调：embedding 常用于搜索、聚类、推荐、异常检测、多样性分析和分类。AIOps 中最常见的是搜索和相似案例检索。

示例：

```python
import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI()
embedding_model = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")

result = client.embeddings.create(
    model=embedding_model,
    input="order-api 5xx error rate is high after deployment",
)

vector = result.data[0].embedding
print(len(vector))
print(vector[:5])
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>import os</code> | 导入 Python 模块，后面的代码会使用这个模块提供的功能。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 3 行 | <code>from dotenv import load_dotenv</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 4 行 | <code>from openai import OpenAI</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 5 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 6 行 | <code>load_dotenv()</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 7 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 8 行 | <code>client = OpenAI()</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 9 行 | <code>embedding_model = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 10 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 11 行 | <code>result = client.embeddings.create(</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 12 行 | <code>    model=embedding_model,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 13 行 | <code>    input="order-api 5xx error rate is high after deployment",</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 14 行 | <code>)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 15 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 16 行 | <code>vector = result.data[0].embedding</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 17 行 | <code>print(len(vector))</code> | 打印输出，用来在实验中确认变量、结果或调试信息。 |
| 第 18 行 | <code>print(vector[:5])</code> | 打印输出，用来在实验中确认变量、结果或调试信息。 |


Embedding 在 AIOps 里的用途：

| 用途 | 输入文本 | 输出用途 |
|---|---|---|
| 相似告警 | alertname、service、labels、摘要 | 找历史相似告警 |
| 相似事故 | 事故报告、时间线、根因 | 辅助 RCA |
| runbook 搜索 | runbook 标题和步骤 | 找排障手册 |
| 知识库问答 | 文档片段 | RAG 检索 |
| 告警聚类 | 告警摘要 | 降噪和归并 |

Embedding 不直接生成答案。它通常用于：

```text
text
  -> embedding vector
  -> vector database search
  -> relevant documents
  -> LLM answer with retrieved context
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>text</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; embedding vector</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; vector database search</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>  -&gt; relevant documents</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>  -&gt; LLM answer with retrieved context</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


这就是 RAG 的基础。

## RAG 和 LLM 的关系

RAG 是 Retrieval-Augmented Generation，检索增强生成。

最小链路：

```text
user question / alert
  -> embedding
  -> vector search
  -> retrieve runbook / incident docs
  -> assemble context
  -> LLM summary
  -> answer with citations / evidence
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>user question / alert</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; embedding</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; vector search</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>  -&gt; retrieve runbook / incident docs</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>  -&gt; assemble context</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 6 行 | <code>  -&gt; LLM summary</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 7 行 | <code>  -&gt; answer with citations / evidence</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


AIOps 场景：

```text
HighErrorRate alert
  -> search similar incidents
  -> search runbooks
  -> search recent changes
  -> LLM summarizes likely checks
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>HighErrorRate alert</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; search similar incidents</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; search runbooks</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>  -&gt; search recent changes</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>  -&gt; LLM summarizes likely checks</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


注意：

- RAG 的核心不是“把文档塞给模型”，而是“检索相关证据”。
- 检索结果要带来源。
- 模型回答要引用来源或证据。
- 没检索到证据时要说没有证据。

## AIOps 上下文模板

建议把模型输入统一成一个结构，而不是每个调用随意拼字符串。

```json
{
  "task": "summarize_alert",
  "alert": {
    "id": "a-20260702-001",
    "service": "order-api",
    "name": "HighErrorRate",
    "severity": "critical",
    "started_at": "2026-07-02T09:10:00Z"
  },
  "metrics": [
    {
      "name": "5xx_error_rate",
      "value": "23%",
      "baseline": "1%",
      "window": "5m",
      "source": "prometheus"
    }
  ],
  "logs": [
    {
      "summary": "database connection timeout increased",
      "source": "loki",
      "window": "09:05-09:15"
    }
  ],
  "changes": [
    {
      "summary": "order-api deployed version 2026.07.02.1",
      "source": "github-actions",
      "time": "2026-07-02T09:02:00Z"
    }
  ],
  "retrieved_runbooks": [
    {
      "title": "Order API high error rate",
      "source": "runbooks/order-api.md",
      "excerpt": "Check database connection pool and recent deploys."
    }
  ],
  "constraints": {
    "do_not_execute_actions": true,
    "require_evidence": true,
    "language": "zh-CN"
  }
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{</code> | 对象开始，表示下面是一组键值对配置。 |
| 第 2 行 | <code>  "task": "summarize_alert",</code> | 设置 `task` 字段，值是 `"summarize_alert"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 3 行 | <code>  "alert": {</code> | 设置 `alert` 字段，值是 `{`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 4 行 | <code>    "id": "a-20260702-001",</code> | 设置 `id` 字段，值是 `"a-20260702-001"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 5 行 | <code>    "service": "order-api",</code> | 设置 `service` 字段，值是 `"order-api"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 6 行 | <code>    "name": "HighErrorRate",</code> | 设置 `name` 字段，值是 `"HighErrorRate"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 7 行 | <code>    "severity": "critical",</code> | 设置 `severity` 字段，值是 `"critical"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 8 行 | <code>    "started_at": "2026-07-02T09:10:00Z"</code> | 设置 `started_at` 字段，值是 `"2026-07-02T09:10:00Z"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 9 行 | <code>  },</code> | 当前对象或数组结束，逗号表示后面还有同级项目。 |
| 第 10 行 | <code>  "metrics": [</code> | 设置 `metrics` 字段，值是 `[`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 11 行 | <code>    {</code> | 对象开始，表示下面是一组键值对配置。 |
| 第 12 行 | <code>      "name": "5xx_error_rate",</code> | 设置 `name` 字段，值是 `"5xx_error_rate"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 13 行 | <code>      "value": "23%",</code> | 设置 `value` 字段，值是 `"23%"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 14 行 | <code>      "baseline": "1%",</code> | 设置 `baseline` 字段，值是 `"1%"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 15 行 | <code>      "window": "5m",</code> | 设置 `window` 字段，值是 `"5m"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 16 行 | <code>      "source": "prometheus"</code> | 设置 `source` 字段，值是 `"prometheus"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 17 行 | <code>    }</code> | 对象结束，表示这一组键值对配置到这里结束。 |
| 第 18 行 | <code>  ],</code> | 当前对象或数组结束，逗号表示后面还有同级项目。 |
| 第 19 行 | <code>  "logs": [</code> | 设置 `logs` 字段，值是 `[`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 20 行 | <code>    {</code> | 对象开始，表示下面是一组键值对配置。 |
| 第 21 行 | <code>      "summary": "database connection timeout increased",</code> | 设置 `summary` 字段，值是 `"database connection timeout increased"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 22 行 | <code>      "source": "loki",</code> | 设置 `source` 字段，值是 `"loki"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 23 行 | <code>      "window": "09:05-09:15"</code> | 设置 `window` 字段，值是 `"09:05-09:15"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 24 行 | <code>    }</code> | 对象结束，表示这一组键值对配置到这里结束。 |
| 第 25 行 | <code>  ],</code> | 当前对象或数组结束，逗号表示后面还有同级项目。 |
| 第 26 行 | <code>  "changes": [</code> | 设置 `changes` 字段，值是 `[`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 27 行 | <code>    {</code> | 对象开始，表示下面是一组键值对配置。 |
| 第 28 行 | <code>      "summary": "order-api deployed version 2026.07.02.1",</code> | 设置 `summary` 字段，值是 `"order-api deployed version 2026.07.02.1"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 29 行 | <code>      "source": "github-actions",</code> | 设置 `source` 字段，值是 `"github-actions"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 30 行 | <code>      "time": "2026-07-02T09:02:00Z"</code> | 设置 `time` 字段，值是 `"2026-07-02T09:02:00Z"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 31 行 | <code>    }</code> | 对象结束，表示这一组键值对配置到这里结束。 |
| 第 32 行 | <code>  ],</code> | 当前对象或数组结束，逗号表示后面还有同级项目。 |
| 第 33 行 | <code>  "retrieved_runbooks": [</code> | 设置 `retrieved_runbooks` 字段，值是 `[`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 34 行 | <code>    {</code> | 对象开始，表示下面是一组键值对配置。 |
| 第 35 行 | <code>      "title": "Order API high error rate",</code> | 设置 `title` 字段，值是 `"Order API high error rate"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 36 行 | <code>      "source": "runbooks/order-api.md",</code> | 设置 `source` 字段，值是 `"runbooks/order-api.md"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 37 行 | <code>      "excerpt": "Check database connection pool and recent deploys."</code> | 设置 `excerpt` 字段，值是 `"Check database connection pool and recent deploys."`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 38 行 | <code>    }</code> | 对象结束，表示这一组键值对配置到这里结束。 |
| 第 39 行 | <code>  ],</code> | 当前对象或数组结束，逗号表示后面还有同级项目。 |
| 第 40 行 | <code>  "constraints": {</code> | 设置 `constraints` 字段，值是 `{`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 41 行 | <code>    "do_not_execute_actions": true,</code> | 设置 `do_not_execute_actions` 字段，值是 `true`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 42 行 | <code>    "require_evidence": true,</code> | 设置 `require_evidence` 字段，值是 `true`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 43 行 | <code>    "language": "zh-CN"</code> | 设置 `language` 字段，值是 `"zh-CN"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 44 行 | <code>  }</code> | 对象结束，表示这一组键值对配置到这里结束。 |
| 第 45 行 | <code>}</code> | 对象结束，表示这一组键值对配置到这里结束。 |


这类结构让提示词更稳定，也更容易做测试。

## 告警摘要输出 schema

AIOps 中建议把输出拆成“结论”和“证据”。

推荐字段：

| 字段 | 含义 |
|---|---|
| `summary` | 一句话摘要 |
| `severity` | 模型基于输入确认的严重程度 |
| `impact` | 可能影响范围 |
| `possible_causes` | 候选原因列表 |
| `evidence` | 支撑每个候选原因的事实 |
| `next_checks` | 下一步检查 |
| `safe_actions` | 低风险动作 |
| `needs_approval_actions` | 需要审批的动作 |
| `missing_information` | 不能判断还缺什么 |
| `confidence` | 置信度，不等于正确率 |

不要让模型只输出：

```text
根因是数据库连接池耗尽。
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>根因是数据库连接池耗尽。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


更好的输出：

```text
候选原因：数据库连接池耗尽。
证据：日志摘要出现 database connection timeout increased；错误率和延迟同时上升。
缺失信息：没有连接池指标、数据库慢查询、实例重启信息。
置信度：0.62。
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>候选原因：数据库连接池耗尽。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>证据：日志摘要出现 database connection timeout increased；错误率和延迟同时上升。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>缺失信息：没有连接池指标、数据库慢查询、实例重启信息。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>置信度：0.62。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


## 成本、延迟和稳定性

工程里不能只关心“模型能不能答”。还要关心能不能稳定上线。

| 问题 | 处理方式 |
|---|---|
| 成本过高 | 限制输入、缓存重复告警、批处理、降级 |
| 延迟过高 | 缩短上下文、流式输出、异步任务、模型分层 |
| 告警风暴 | 限流、去重、采样、批量摘要 |
| API 超时 | 设置超时、有限重试、返回降级结果 |
| 模型不可用 | fallback 到规则摘要或历史模板 |
| 输出不稳定 | 结构化输出、低随机性、测试集评估 |
| token 超限 | 检索、摘要、截断、分块 |
| 泄露敏感数据 | 脱敏、过滤、权限控制 |

缓存思路：

```text
alert fingerprint
  -> Redis cache key
  -> cached LLM summary
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>alert fingerprint</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; Redis cache key</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; cached LLM summary</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


伪代码：

```python
def analyze_with_fallback(context):
    fingerprint = build_fingerprint(context)

    cached = redis_get(f"llm-summary:{fingerprint}")
    if cached:
        return cached

    try:
        result = call_openai(context)
        redis_setex(f"llm-summary:{fingerprint}", 600, result)
        return result
    except TimeoutError:
        return rule_based_summary(context, reason="llm_timeout")
    except Exception as exc:
        return rule_based_summary(context, reason=type(exc).__name__)
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>def analyze_with_fallback(context):</code> | 定义函数，把一段可复用逻辑命名，后续可以反复调用。 |
| 第 2 行 | <code>    fingerprint = build_fingerprint(context)</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 3 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 4 行 | <code>    cached = redis_get(f"llm-summary:{fingerprint}")</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 5 行 | <code>    if cached:</code> | 条件判断，只有条件成立时才执行下面缩进的代码。 |
| 第 6 行 | <code>        return cached</code> | 返回函数结果，调用方会拿到这个值继续处理。 |
| 第 7 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 8 行 | <code>    try:</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 9 行 | <code>        result = call_openai(context)</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 10 行 | <code>        redis_setex(f"llm-summary:{fingerprint}", 600, result)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 11 行 | <code>        return result</code> | 返回函数结果，调用方会拿到这个值继续处理。 |
| 第 12 行 | <code>    except TimeoutError:</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 13 行 | <code>        return rule_based_summary(context, reason="llm_timeout")</code> | 返回函数结果，调用方会拿到这个值继续处理。 |
| 第 14 行 | <code>    except Exception as exc:</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 15 行 | <code>        return rule_based_summary(context, reason=type(exc).__name__)</code> | 返回函数结果，调用方会拿到这个值继续处理。 |


不要对所有异常无限重试。重试要有次数、退避、超时和日志。

## 安全边界

LLM 接入 AIOps 时，安全边界要写进系统设计。

### 输入安全

不要发送：

- API key。
- token。
- 密码。
- 私钥。
- 用户隐私。
- 未脱敏日志。
- 内部敏感 URL。
- 合规受限数据。

要做：

- 脱敏。
- 数据最小化。
- 只发送必要窗口。
- 记录数据来源。
- 对输入做长度限制。

### 输出安全

不要让模型：

- 编造命令执行结果。
- 输出高风险命令让人直接复制。
- 绕过审批。
- 访问未授权数据。
- 把相关性说成确定根因。
- 把低置信度建议当自动动作。

### 动作安全

高风险动作必须：

- 服务端权限校验。
- 人工确认。
- 审批记录。
- 审计日志。
- 幂等设计。
- 回滚方案。
- 失败保护。

模型可以建议：

```text
建议检查最近发布和数据库连接池指标。
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>建议检查最近发布和数据库连接池指标。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


但不能直接决定：

```text
立即回滚生产版本。
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>立即回滚生产版本。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


## 生产架构

一个更稳的 AIOps LLM 服务可以这样设计：

```text
Alertmanager
  -> FastAPI / webhook receiver
  -> normalize alert
  -> Redis dedup
  -> MySQL store raw event
  -> Kafka analysis topic
  -> worker
      -> query metrics/logs/changes/runbooks
      -> redact sensitive fields
      -> call OpenAI API
      -> validate structured output
      -> store result
  -> UI / notification
  -> human approval
  -> runbook automation
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Alertmanager</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; FastAPI / webhook receiver</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; normalize alert</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>  -&gt; Redis dedup</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>  -&gt; MySQL store raw event</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 6 行 | <code>  -&gt; Kafka analysis topic</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 7 行 | <code>  -&gt; worker</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 8 行 | <code>      -&gt; query metrics/logs/changes/runbooks</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 9 行 | <code>      -&gt; redact sensitive fields</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 10 行 | <code>      -&gt; call OpenAI API</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 11 行 | <code>      -&gt; validate structured output</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 12 行 | <code>      -&gt; store result</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 13 行 | <code>  -&gt; UI / notification</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 14 行 | <code>  -&gt; human approval</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 15 行 | <code>  -&gt; runbook automation</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


为什么不要在 webhook 里直接调模型？

- webhook 要快速返回。
- 模型调用可能慢。
- 告警风暴会拖垮服务。
- 失败需要重试和补偿。
- 结果需要持久化和审计。

更好的方式：

```text
POST /alerts
  -> returns 202 accepted
worker
  -> does LLM analysis
GET /alerts/{id}/analysis
  -> returns result
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>POST /alerts</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; returns 202 accepted</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>worker</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>  -&gt; does LLM analysis</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>GET /alerts/{id}/analysis</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 6 行 | <code>  -&gt; returns result</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


## 入门实验：告警摘要助手

目录：

```text
projects/openai-alert-summarizer/
  README.md
  .env.example
  .gitignore
  requirements.txt
  sample_alert.json
  summarize_alert.py
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>projects/openai-alert-summarizer/</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  README.md</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>  .env.example</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>  .gitignore</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>  requirements.txt</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 6 行 | <code>  sample_alert.json</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 7 行 | <code>  summarize_alert.py</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


### requirements.txt

```text
openai
python-dotenv
pydantic
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>openai</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>python-dotenv</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>pydantic</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


### .gitignore

```text
.env
.venv/
__pycache__/
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>.env</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>.venv/</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>__pycache__/</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


### .env.example

```text
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-5.5
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>OPENAI_API_KEY=your_api_key_here</code> | 环境变量或键值示例，等号左边是名称，右边是要配置的值。 |
| 第 2 行 | <code>OPENAI_MODEL=gpt-5.5</code> | 环境变量或键值示例，等号左边是名称，右边是要配置的值。 |


### sample_alert.json

```json
{
  "alert": {
    "id": "a-20260702-001",
    "service": "order-api",
    "name": "HighErrorRate",
    "severity": "critical",
    "started_at": "2026-07-02T09:10:00Z"
  },
  "metrics": {
    "error_rate": "23%",
    "p95_latency_ms": 1800,
    "request_rate_per_second": 700
  },
  "logs": [
    "database connection timeout increased",
    "upstream payment-api returned 5xx"
  ],
  "changes": [
    "order-api deployed version 2026.07.02.1 at 09:02"
  ],
  "runbooks": [
    "Check database connection pool saturation",
    "Compare error rate before and after deploy"
  ]
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{</code> | 对象开始，表示下面是一组键值对配置。 |
| 第 2 行 | <code>  "alert": {</code> | 设置 `alert` 字段，值是 `{`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 3 行 | <code>    "id": "a-20260702-001",</code> | 设置 `id` 字段，值是 `"a-20260702-001"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 4 行 | <code>    "service": "order-api",</code> | 设置 `service` 字段，值是 `"order-api"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 5 行 | <code>    "name": "HighErrorRate",</code> | 设置 `name` 字段，值是 `"HighErrorRate"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 6 行 | <code>    "severity": "critical",</code> | 设置 `severity` 字段，值是 `"critical"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 7 行 | <code>    "started_at": "2026-07-02T09:10:00Z"</code> | 设置 `started_at` 字段，值是 `"2026-07-02T09:10:00Z"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 8 行 | <code>  },</code> | 当前对象或数组结束，逗号表示后面还有同级项目。 |
| 第 9 行 | <code>  "metrics": {</code> | 设置 `metrics` 字段，值是 `{`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 10 行 | <code>    "error_rate": "23%",</code> | 设置 `error_rate` 字段，值是 `"23%"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 11 行 | <code>    "p95_latency_ms": 1800,</code> | 设置 `p95_latency_ms` 字段，值是 `1800`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 12 行 | <code>    "request_rate_per_second": 700</code> | 设置 `request_rate_per_second` 字段，值是 `700`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 13 行 | <code>  },</code> | 当前对象或数组结束，逗号表示后面还有同级项目。 |
| 第 14 行 | <code>  "logs": [</code> | 设置 `logs` 字段，值是 `[`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 15 行 | <code>    "database connection timeout increased",</code> | JSON 列表或对象中的一行，注意逗号和引号必须符合 JSON 语法。 |
| 第 16 行 | <code>    "upstream payment-api returned 5xx"</code> | JSON 列表或对象中的一行，注意逗号和引号必须符合 JSON 语法。 |
| 第 17 行 | <code>  ],</code> | 当前对象或数组结束，逗号表示后面还有同级项目。 |
| 第 18 行 | <code>  "changes": [</code> | 设置 `changes` 字段，值是 `[`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 19 行 | <code>    "order-api deployed version 2026.07.02.1 at 09:02"</code> | JSON 列表或对象中的一行，注意逗号和引号必须符合 JSON 语法。 |
| 第 20 行 | <code>  ],</code> | 当前对象或数组结束，逗号表示后面还有同级项目。 |
| 第 21 行 | <code>  "runbooks": [</code> | 设置 `runbooks` 字段，值是 `[`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 22 行 | <code>    "Check database connection pool saturation",</code> | JSON 列表或对象中的一行，注意逗号和引号必须符合 JSON 语法。 |
| 第 23 行 | <code>    "Compare error rate before and after deploy"</code> | JSON 列表或对象中的一行，注意逗号和引号必须符合 JSON 语法。 |
| 第 24 行 | <code>  ]</code> | 数组结束，表示同类值或对象列表到这里结束。 |
| 第 25 行 | <code>}</code> | 对象结束，表示这一组键值对配置到这里结束。 |


### summarize_alert.py

```python
import json
import os

from dotenv import load_dotenv
from openai import OpenAI
from pydantic import BaseModel, Field


class PossibleCause(BaseModel):
    title: str
    evidence: list[str]
    confidence: float = Field(ge=0, le=1)


class AlertSummary(BaseModel):
    summary: str
    severity: str
    possible_causes: list[PossibleCause]
    next_checks: list[str]
    safe_actions: list[str]
    missing_information: list[str]


def main():
    load_dotenv()

    client = OpenAI()
    model = os.getenv("OPENAI_MODEL", "gpt-5.5")

    with open("sample_alert.json", "r", encoding="utf-8") as f:
        context = json.load(f)

    response = client.responses.parse(
        model=model,
        instructions=(
            "你是严谨的 AIOps 值班助手。"
            "只根据输入 JSON 分析。"
            "不要编造不存在的日志、指标、变更或根因。"
            "不确定时把缺失信息写入 missing_information。"
            "不要给出需要审批的生产修复命令。"
        ),
        input=json.dumps(context, ensure_ascii=False),
        text_format=AlertSummary,
    )

    summary = response.output_parsed
    print(summary.model_dump_json(indent=2))


if __name__ == "__main__":
    main()
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>import json</code> | 导入 Python 模块，后面的代码会使用这个模块提供的功能。 |
| 第 2 行 | <code>import os</code> | 导入 Python 模块，后面的代码会使用这个模块提供的功能。 |
| 第 3 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 4 行 | <code>from dotenv import load_dotenv</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 5 行 | <code>from openai import OpenAI</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 6 行 | <code>from pydantic import BaseModel, Field</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 7 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 8 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 9 行 | <code>class PossibleCause(BaseModel):</code> | 定义类，用来组织一组数据和行为。 |
| 第 10 行 | <code>    title: str</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 11 行 | <code>    evidence: list[str]</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 12 行 | <code>    confidence: float = Field(ge=0, le=1)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 13 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 14 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 15 行 | <code>class AlertSummary(BaseModel):</code> | 定义类，用来组织一组数据和行为。 |
| 第 16 行 | <code>    summary: str</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 17 行 | <code>    severity: str</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 18 行 | <code>    possible_causes: list[PossibleCause]</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 19 行 | <code>    next_checks: list[str]</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 20 行 | <code>    safe_actions: list[str]</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 21 行 | <code>    missing_information: list[str]</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 22 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 23 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 24 行 | <code>def main():</code> | 定义函数，把一段可复用逻辑命名，后续可以反复调用。 |
| 第 25 行 | <code>    load_dotenv()</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 26 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 27 行 | <code>    client = OpenAI()</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 28 行 | <code>    model = os.getenv("OPENAI_MODEL", "gpt-5.5")</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 29 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 30 行 | <code>    with open("sample_alert.json", "r", encoding="utf-8") as f:</code> | 上下文管理语句，常用于安全打开文件或管理连接。 |
| 第 31 行 | <code>        context = json.load(f)</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 32 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 33 行 | <code>    response = client.responses.parse(</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 34 行 | <code>        model=model,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 35 行 | <code>        instructions=(</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 36 行 | <code>            "你是严谨的 AIOps 值班助手。"</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 37 行 | <code>            "只根据输入 JSON 分析。"</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 38 行 | <code>            "不要编造不存在的日志、指标、变更或根因。"</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 39 行 | <code>            "不确定时把缺失信息写入 missing_information。"</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 40 行 | <code>            "不要给出需要审批的生产修复命令。"</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 41 行 | <code>        ),</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 42 行 | <code>        input=json.dumps(context, ensure_ascii=False),</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 43 行 | <code>        text_format=AlertSummary,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 44 行 | <code>    )</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 45 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 46 行 | <code>    summary = response.output_parsed</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 47 行 | <code>    print(summary.model_dump_json(indent=2))</code> | 打印输出，用来在实验中确认变量、结果或调试信息。 |
| 第 48 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 49 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 50 行 | <code>if __name__ == "__main__":</code> | 条件判断，只有条件成立时才执行下面缩进的代码。 |
| 第 51 行 | <code>    main()</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |


### 运行

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python summarize_alert.py
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>python -m venv .venv</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 |
| 第 2 行 | <code>source .venv/bin/activate</code> | 执行 `source` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>pip install -r requirements.txt</code> | 管理 Python 依赖包，通常用于安装实验需要的库。 |
| 第 4 行 | <code>cp .env.example .env</code> | 执行 `cp` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 5 行 | <code>python summarize_alert.py</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 |


PowerShell：

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
python summarize_alert.py
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>python -m venv .venv</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 |
| 第 2 行 | <code>.venv\Scripts\Activate.ps1</code> | 执行 `.venv\scripts\activate.ps1` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>pip install -r requirements.txt</code> | 管理 Python 依赖包，通常用于安装实验需要的库。 |
| 第 4 行 | <code>Copy-Item .env.example .env</code> | 执行 `copy-item` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 5 行 | <code>python summarize_alert.py</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 |


注意：把 `.env` 里的 `OPENAI_API_KEY` 改成你自己的 key，但不要提交 `.env`。

## 入门实验：相似告警向量

再做一个 embedding 小实验。

`similar_alerts.py`：

```python
import math
import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI()
embedding_model = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")


def embed(text: str) -> list[float]:
    result = client.embeddings.create(
        model=embedding_model,
        input=text,
    )
    return result.data[0].embedding


def cosine_similarity(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    return dot / (norm_a * norm_b)


query = "order-api high 5xx error rate after deployment"
history = [
    "order-api database timeout after deploy caused 5xx errors",
    "payment-api certificate expired and TLS handshake failed",
    "frontend page rendering is slow because CDN cache missed",
]

query_vector = embed(query)
history_vectors = [embed(item) for item in history]

scores = [
    (item, cosine_similarity(query_vector, vector))
    for item, vector in zip(history, history_vectors)
]

for item, score in sorted(scores, key=lambda row: row[1], reverse=True):
    print(f"{score:.3f} {item}")
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>import math</code> | 导入 Python 模块，后面的代码会使用这个模块提供的功能。 |
| 第 2 行 | <code>import os</code> | 导入 Python 模块，后面的代码会使用这个模块提供的功能。 |
| 第 3 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 4 行 | <code>from dotenv import load_dotenv</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 5 行 | <code>from openai import OpenAI</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 6 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 7 行 | <code>load_dotenv()</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 8 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 9 行 | <code>client = OpenAI()</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 10 行 | <code>embedding_model = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 11 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 12 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 13 行 | <code>def embed(text: str) -&gt; list[float]:</code> | 定义函数，把一段可复用逻辑命名，后续可以反复调用。 |
| 第 14 行 | <code>    result = client.embeddings.create(</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 15 行 | <code>        model=embedding_model,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 16 行 | <code>        input=text,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 17 行 | <code>    )</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 18 行 | <code>    return result.data[0].embedding</code> | 返回函数结果，调用方会拿到这个值继续处理。 |
| 第 19 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 20 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 21 行 | <code>def cosine_similarity(a: list[float], b: list[float]) -&gt; float:</code> | 定义函数，把一段可复用逻辑命名，后续可以反复调用。 |
| 第 22 行 | <code>    dot = sum(x * y for x, y in zip(a, b))</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 23 行 | <code>    norm_a = math.sqrt(sum(x * x for x in a))</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 24 行 | <code>    norm_b = math.sqrt(sum(y * y for y in b))</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 25 行 | <code>    return dot / (norm_a * norm_b)</code> | 返回函数结果，调用方会拿到这个值继续处理。 |
| 第 26 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 27 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 28 行 | <code>query = "order-api high 5xx error rate after deployment"</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 29 行 | <code>history = [</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 30 行 | <code>    "order-api database timeout after deploy caused 5xx errors",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 31 行 | <code>    "payment-api certificate expired and TLS handshake failed",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 32 行 | <code>    "frontend page rendering is slow because CDN cache missed",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 33 行 | <code>]</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 34 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 35 行 | <code>query_vector = embed(query)</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 36 行 | <code>history_vectors = [embed(item) for item in history]</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 37 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 38 行 | <code>scores = [</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 39 行 | <code>    (item, cosine_similarity(query_vector, vector))</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 40 行 | <code>    for item, vector in zip(history, history_vectors)</code> | 循环处理一组数据，常用于逐条处理告警、日志或指标样本。 |
| 第 41 行 | <code>]</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 42 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 43 行 | <code>for item, score in sorted(scores, key=lambda row: row[1], reverse=True):</code> | 循环处理一组数据，常用于逐条处理告警、日志或指标样本。 |
| 第 44 行 | <code>    print(f"{score:.3f} {item}")</code> | 打印输出，用来在实验中确认变量、结果或调试信息。 |


这个实验只是帮助理解 embedding。生产里不要把所有向量放内存里算，应该使用向量数据库或支持向量检索的存储。

## FastAPI 封装 LLM 服务

当脚本跑通后，可以用 FastAPI 封装成服务。

接口设计：

| 接口 | 方法 | 用途 |
|---|---|---|
| `/healthz` | GET | 健康检查 |
| `/alerts/summarize` | POST | 生成告警摘要 |
| `/alerts/similar` | POST | 查询相似告警 |

请求模型：

```python
from pydantic import BaseModel


class AlertContext(BaseModel):
    alert: dict
    metrics: dict
    logs: list[str] = []
    changes: list[str] = []
    runbooks: list[str] = []
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>from pydantic import BaseModel</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 3 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 4 行 | <code>class AlertContext(BaseModel):</code> | 定义类，用来组织一组数据和行为。 |
| 第 5 行 | <code>    alert: dict</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 6 行 | <code>    metrics: dict</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 7 行 | <code>    logs: list[str] = []</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 8 行 | <code>    changes: list[str] = []</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 9 行 | <code>    runbooks: list[str] = []</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |


返回模型可以复用 `AlertSummary`。

注意：

- API 层负责鉴权和校验。
- LLM 调用放 service 层。
- 慢任务返回 202，交给 worker。
- 输出必须持久化。
- 错误要能降级。

## 评估方法

没有评估，就不知道模型改动是变好还是变坏。

准备一个小测试集：

```text
evals/
  alert_001.json
  alert_002.json
  alert_003.json
  expected.md
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>evals/</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  alert_001.json</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>  alert_002.json</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>  alert_003.json</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>  expected.md</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


每条样本包含：

- 输入告警。
- 指标摘要。
- 日志摘要。
- 变更记录。
- 人工标注的合理摘要。
- 不应该出现的错误结论。

评估维度：

| 维度 | 问题 |
|---|---|
| 事实一致性 | 是否只根据输入事实？ |
| 幻觉控制 | 是否编造不存在的信息？ |
| 可操作性 | 下一步检查是否具体？ |
| 安全性 | 是否建议危险动作？ |
| 结构稳定 | JSON 字段是否完整？ |
| 成本 | token 和调用次数是否可控？ |
| 延迟 | 是否满足值班场景？ |
| 人工满意度 | 值班同事是否觉得有帮助？ |

最小自动检查：

```python
def test_summary_has_required_fields(summary):
    assert summary.summary
    assert summary.next_checks
    assert isinstance(summary.missing_information, list)
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>def test_summary_has_required_fields(summary):</code> | 定义函数，把一段可复用逻辑命名，后续可以反复调用。 |
| 第 2 行 | <code>    assert summary.summary</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 3 行 | <code>    assert summary.next_checks</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 4 行 | <code>    assert isinstance(summary.missing_information, list)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |


更进一步可以让人工给输出打分：

```text
0 = 有害或明显错误
1 = 没帮助
2 = 有部分帮助
3 = 可直接辅助值班
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>0 = 有害或明显错误</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>1 = 没帮助</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>2 = 有部分帮助</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>3 = 可直接辅助值班</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


## 常用字段和 API 字典

### OpenAI

```python
client = OpenAI()
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>client = OpenAI()</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |


创建 SDK 客户端。默认从 `OPENAI_API_KEY` 读取 key。

### responses.create

```python
client.responses.create(model=model, input="...")
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>client.responses.create(model=model, input="...")</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |


创建一次模型响应。

### responses.parse

```python
client.responses.parse(model=model, input="...", text_format=MyModel)
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>client.responses.parse(model=model, input="...", text_format=MyModel)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |


按 Pydantic 模型解析结构化输出。

### output_text

```python
response.output_text
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>response.output_text</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |


读取模型输出的文本。

### output_parsed

```python
response.output_parsed
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>response.output_parsed</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |


读取结构化输出解析后的对象。

### embeddings.create

```python
client.embeddings.create(model="text-embedding-3-small", input="...")
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>client.embeddings.create(model="text-embedding-3-small", input="...")</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |


把文本转换成向量。

### tools

```python
tools=[{"type": "function", "name": "get_recent_deploys", ...}]
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>tools=[{"type": "function", "name": "get_recent_deploys", ...}]</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |


告诉模型可请求哪些工具。

### function_call_output

```python
{"type": "function_call_output", "call_id": item.call_id, "output": "..."}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{"type": "function_call_output", "call_id": item.call_id, "output": "..."}</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |


把工具执行结果交回模型。

### max_output_tokens

```python
max_output_tokens=800
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>max_output_tokens=800</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |


限制输出长度。

### metadata

```python
metadata={"alert_id": "a-20260702-001", "service": "order-api"}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>metadata={"alert_id": "a-20260702-001", "service": "order-api"}</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |


给请求附加业务元数据，便于追踪。

## 命令速查

### 安装

```bash
pip install openai python-dotenv pydantic
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>pip install openai python-dotenv pydantic</code> | 管理 Python 依赖包，通常用于安装实验需要的库。 |


### 设置 key

```bash
export OPENAI_API_KEY="你的 key"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>export OPENAI_API_KEY="你的 key"</code> | 设置 shell 环境变量，常用于配置 API Key、端口或运行参数。 |


PowerShell：

```powershell
$env:OPENAI_API_KEY="你的 key"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>$env:OPENAI_API_KEY="你的 key"</code> | 执行 `$env:openai_api_key="你的` 相关命令，后面的参数决定它具体操作什么对象。 其中 `$` 开头的是 PowerShell 变量，用来保存临时值或配置。 |


### 最小调用

```bash
python hello_openai.py
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>python hello_openai.py</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 |


### curl 调用 Responses API

```bash
curl https://api.openai.com/v1/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
    "model": "gpt-5.5",
    "input": "用一句话解释 AIOps。"
  }'
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl https://api.openai.com/v1/responses \</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |
| 第 2 行 | <code>  -H "Content-Type: application/json" \</code> | 执行 `-h` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>  -H "Authorization: Bearer $OPENAI_API_KEY" \</code> | 执行 `-h` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 4 行 | <code>  -d '{</code> | 执行 `-d` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 5 行 | <code>    "model": "gpt-5.5",</code> | 执行 `"model":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 6 行 | <code>    "input": "用一句话解释 AIOps。"</code> | 执行 `"input":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 7 行 | <code>  }'</code> | 执行 `}'` 相关命令，后面的参数决定它具体操作什么对象。 |


### curl 调用 Embeddings API

```bash
curl https://api.openai.com/v1/embeddings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
    "model": "text-embedding-3-small",
    "input": "order-api high error rate"
  }'
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl https://api.openai.com/v1/embeddings \</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |
| 第 2 行 | <code>  -H "Content-Type: application/json" \</code> | 执行 `-h` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>  -H "Authorization: Bearer $OPENAI_API_KEY" \</code> | 执行 `-h` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 4 行 | <code>  -d '{</code> | 执行 `-d` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 5 行 | <code>    "model": "text-embedding-3-small",</code> | 执行 `"model":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 6 行 | <code>    "input": "order-api high error rate"</code> | 执行 `"input":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 7 行 | <code>  }'</code> | 执行 `}'` 相关命令，后面的参数决定它具体操作什么对象。 |


## 典型故障排查表

| 现象 | 常见原因 | 排查方式 |
|---|---|---|
| `OPENAI_API_KEY is not set` | 没设置环境变量 | 检查 shell 或 `.env` |
| 401 | key 无效或没传 | 检查 `Authorization` 和 key |
| 403 | 权限不足 | 检查项目、模型和组织权限 |
| 404 model not found | 模型名不可用或写错 | 查官方 Models 和账号权限 |
| 429 | 触发 rate limit | 限流、退避、减少并发 |
| 400 context length | 输入太长 | 检索、摘要、截断、分块 |
| 输出不是 JSON | 没用结构化输出 | 使用 `responses.parse` 或 schema |
| 输出编造事实 | 上下文不足或提示词弱 | 加证据约束、缺失信息字段、评估 |
| 成本过高 | 输入太长或调用太频繁 | 缓存、去重、限流、分层模型 |
| 延迟过高 | 上下文长、模型慢、串行工具多 | 缩短上下文、异步、并行查询、降级 |
| 工具误调用 | 工具描述模糊 | 收紧工具描述和参数 schema |
| 高风险建议 | 安全边界不清 | 加审批规则和输出校验 |

## AIOps 项目落地清单

- 输入数据是否脱敏？
- 是否只传必要上下文？
- 是否有 request id 和 alert id？
- 是否记录模型、版本、耗时、token、状态？
- 是否使用结构化输出？
- 是否对结构化输出做程序校验？
- 是否有超时和有限重试？
- 是否有缓存和限流？
- 是否有降级路径？
- 是否有人工确认入口？
- 是否禁止模型直接执行高风险动作？
- 是否保存审计日志？
- 是否有评估样本？
- 是否有失败样本回归测试？
- 是否能通过配置切换模型？
- 是否能解释每个候选原因的证据？

## 面试怎么讲

LLM 在 AIOps 中更适合作为解释层和协作层，而不是直接替代监控、规则、权限和审批。我的做法是先从 Prometheus、日志、变更系统、runbook 或历史事故中提取结构化事实，再调用 OpenAI Responses API 生成摘要、候选原因、下一步检查和沟通文案。模型输出尽量使用 Structured Outputs，让程序能稳定解析，并把证据、不确定信息和安全动作分开。

如果需要让模型查询外部数据，我会用 function calling，但真正执行工具的是服务端代码，必须做参数校验、权限控制和审计。对于 Embeddings，我会把 runbook、历史事故和告警摘要向量化，用于相似案例检索和 RAG。生产上还要处理 API key 安全、限流、超时、重试、缓存、降级、成本监控和评估，不能让模型直接无审批执行生产修复。

## 学习检查清单

- [ ] 我能解释 LLM 在 AIOps 中适合和不适合做什么。
- [ ] 我能安全管理 `OPENAI_API_KEY`，不把密钥提交到 Git。
- [ ] 我能安装 OpenAI Python SDK。
- [ ] 我能使用 Responses API 发起一次文本生成。
- [ ] 我能解释 `model`、`instructions`、`input`、`output_text`。
- [ ] 我能用环境变量管理模型名。
- [ ] 我能写一个 AIOps 告警分析提示词合同。
- [ ] 我能把告警、指标、日志、变更拼成结构化上下文。
- [ ] 我能用 Pydantic 做结构化输出。
- [ ] 我能解释 Structured Outputs 和普通 JSON 提示的区别。
- [ ] 我能解释 function calling 的五步流程。
- [ ] 我知道模型不直接执行函数，执行者是我的程序。
- [ ] 我能调用 embeddings API 得到向量。
- [ ] 我能说明 embeddings 和 RAG 的关系。
- [ ] 我能设计 LLM 调用的缓存、限流、降级方案。
- [ ] 我能列出 AIOps LLM 的安全边界。
- [ ] 我能设计一个小型评估集。

## 面试题

1. LLM 在 AIOps 中适合做什么，不适合做什么？
2. 为什么不能让 LLM 直接替代 Prometheus 告警规则？
3. OpenAI API 和 ChatGPT 有什么区别？
4. Responses API 的 `instructions` 和 `input` 怎么分工？
5. `response.output_text` 适合什么场景？
6. 为什么生产系统更推荐结构化输出？
7. Structured Outputs 和 JSON mode 有什么区别？
8. function calling 的执行流程是什么？
9. 模型是否真的执行了函数？为什么？
10. 工具调用如何做权限控制和审计？
11. embeddings 是什么？在 AIOps 中怎么用？
12. RAG 如何降低模型幻觉？
13. 如何拼装一条告警的 LLM 上下文？
14. 如何避免把敏感日志发送给外部 API？
15. 如何处理 429 rate limit？
16. 如何控制 LLM 调用成本？
17. 如何设计 LLM 不可用时的降级方案？
18. 如何评估一个告警摘要助手是否有用？
19. 为什么模型升级不能只改模型名？
20. 自动修复场景中，LLM 和 runbook automation 的边界在哪里？

## 学习证据

学完后，在 GitHub 留下这些证据：

- `sample_alert.json`，包含脱敏告警上下文。
- `summarize_alert.py`，使用 Responses API。
- Pydantic 结构化输出模型。
- `.env.example`，不包含真实 key。
- `.gitignore`，忽略 `.env`。
- 一个 embeddings 示例脚本。
- 一个 README，解释输入事实、提示词合同、输出字段、安全边界。
- 至少 3 条测试样本，包含成功、信息不足、危险动作拒绝。
- 一份脱敏模型输出样例。
- 一段说明：LLM 在你的 AIOps 架构中位于哪一层，不能做什么。
