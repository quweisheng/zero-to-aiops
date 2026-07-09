# LangGraph

> 学习目标：能理解 LangGraph 为什么适合编排长期运行的 AI Agent 和 AIOps 排障流程，能讲清 StateGraph、state、node、edge、conditional edge、checkpoint、memory、interrupt、human-in-the-loop、streaming 和 LangSmith 的边界，并能跑通一个不依赖大模型 API 的最小事故分诊流程。

## 官方资料

优先读这些 LangGraph 官方资料：

- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview)
- [LangGraph quickstart](https://docs.langchain.com/oss/python/langgraph/quickstart)
- [LangGraph graph API](https://docs.langchain.com/oss/python/langgraph/graph-api)
- [LangGraph workflows and agents](https://docs.langchain.com/oss/python/langgraph/workflows-agents)
- [LangGraph persistence](https://docs.langchain.com/oss/python/langgraph/persistence)
- [LangGraph memory](https://docs.langchain.com/oss/python/langgraph/add-memory)
- [LangGraph interrupts](https://docs.langchain.com/oss/python/langgraph/interrupts)

说明：本文按 LangGraph 官方主线整理，用 AIOps 告警分诊、runbook 选择、人工审批和排障自动化场景重新讲解，不复制官方全文。

## 官方知识地图

LangGraph 官方资料可以按这张地图理解：

```text
LangGraph
  -> Overview
     -> durable execution
     -> persistence
     -> human-in-the-loop
     -> memory
     -> streaming
  -> Graph API
     -> state
     -> node
     -> edge
     -> conditional edge
     -> START / END
  -> Workflows and agents
     -> fixed workflow
     -> dynamic agent
     -> routing
     -> evaluator-optimizer
  -> Persistence
     -> checkpoint
     -> thread
     -> resume
     -> replay
  -> Memory
     -> short-term memory
     -> long-term memory
  -> Interrupts
     -> pause
     -> human approval
     -> resume
  -> LangSmith
     -> tracing
     -> evaluation
     -> debugging
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>LangGraph</code> | 这一行里的英文要这样读：`LangGraph` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源。 |
| 第 2 行 | <code>  -&gt; Overview</code> | 这一行要理解这些英文词：`Overview` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>     -&gt; durable execution</code> | 这一行要理解这些英文词：`durable execution` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>     -&gt; persistence</code> | 这一行要理解这些英文词：`persistence` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>     -&gt; human-in-the-loop</code> | 这一行要理解这些英文词：`human-in-the-loop` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>     -&gt; memory</code> | 这一行要理解这些英文词：`memory` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 7 行 | <code>     -&gt; streaming</code> | 这一行要理解这些英文词：`streaming` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 8 行 | <code>  -&gt; Graph API</code> | 这一行要理解这些英文词：`Graph API` 是api=应用程序接口。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 9 行 | <code>     -&gt; state</code> | 这一行要理解这些英文词：`state` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 10 行 | <code>     -&gt; node</code> | 这一行要理解这些英文词：`node` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 11 行 | <code>     -&gt; edge</code> | 这一行要理解这些英文词：`edge` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 12 行 | <code>     -&gt; conditional edge</code> | 这一行要理解这些英文词：`conditional edge` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 13 行 | <code>     -&gt; START / END</code> | 这一行要理解这些英文词：`START` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`END` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 14 行 | <code>  -&gt; Workflows and agents</code> | 这一行要理解这些英文词：`Workflows and agents` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 15 行 | <code>     -&gt; fixed workflow</code> | 这一行要理解这些英文词：`fixed workflow` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 16 行 | <code>     -&gt; dynamic agent</code> | 这一行要理解这些英文词：`dynamic agent` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 17 行 | <code>     -&gt; routing</code> | 这一行要理解这些英文词：`routing` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 18 行 | <code>     -&gt; evaluator-optimizer</code> | 这一行要理解这些英文词：`evaluator-optimizer` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 19 行 | <code>  -&gt; Persistence</code> | 这一行要理解这些英文词：`Persistence` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 20 行 | <code>     -&gt; checkpoint</code> | 这一行要理解这些英文词：`checkpoint` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 21 行 | <code>     -&gt; thread</code> | 这一行要理解这些英文词：`thread` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 22 行 | <code>     -&gt; resume</code> | 这一行要理解这些英文词：`resume` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 23 行 | <code>     -&gt; replay</code> | 这一行要理解这些英文词：`replay` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 24 行 | <code>  -&gt; Memory</code> | 这一行要理解这些英文词：`Memory` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 25 行 | <code>     -&gt; short-term memory</code> | 这一行要理解这些英文词：`short-term memory` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 26 行 | <code>     -&gt; long-term memory</code> | 这一行要理解这些英文词：`long-term memory` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 27 行 | <code>  -&gt; Interrupts</code> | 这一行要理解这些英文词：`Interrupts` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 28 行 | <code>     -&gt; pause</code> | 这一行要理解这些英文词：`pause` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 29 行 | <code>     -&gt; human approval</code> | 这一行要理解这些英文词：`human approval` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 30 行 | <code>     -&gt; resume</code> | 这一行要理解这些英文词：`resume` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 31 行 | <code>  -&gt; LangSmith</code> | 这一行要理解这些英文词：`LangSmith` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 32 行 | <code>     -&gt; tracing</code> | 这一行要理解这些英文词：`tracing` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 33 行 | <code>     -&gt; evaluation</code> | 这一行要理解这些英文词：`evaluation` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 34 行 | <code>     -&gt; debugging</code> | 这一行要理解这些英文词：`debugging` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

如果你是零基础，阅读顺序建议是：

1. 先读 overview，知道 LangGraph 解决什么问题。
2. 再读 graph API，掌握 state、node、edge 这三个最小概念。
3. 然后读 workflows and agents，理解固定流程和动态 agent 的区别。
4. 接着读 persistence 和 interrupts，因为 AIOps 自动化最怕“跑到一半丢状态”和“危险动作没审批”。
5. 最后把 LangSmith 当作观测和评估入口，不要一开始就把所有平台能力都混在一起。

## 场景开场

假设凌晨 2 点，`order-api` 错误率突然升高。

传统脚本可以做固定检查：

- 查 Prometheus 错误率。
- 查 Loki 日志。
- 查最近发布记录。
- 查 runbook。

但真实事故不会永远按固定顺序走：

- 如果是发布后 5 分钟内出问题，优先看变更。
- 如果错误集中在某个下游接口，优先查依赖。
- 如果 runbook 建议重启服务，要先人工审批。
- 如果脚本执行一半网络断了，希望恢复后能从中间继续。
- 如果大模型给了建议，希望能看到它为什么这么判断。

这时候只用一个普通 Python 脚本会越来越乱：`if`、`else`、重试、状态保存、人工确认、日志追踪都缠在一起。

LangGraph 的价值就是把“排障步骤、判断分支、状态记录、人工审批和恢复执行”组织成一个可读、可追踪、可恢复的图。

## 一句话人话版

LangGraph 是一个把 AI Agent 或自动化流程拆成节点和连线的编排框架：每个节点做一步事，所有节点共享一份状态，流程可以分支、暂停、恢复，并适合接入 AIOps 排障自动化。

## 小白可能会问

### LangGraph 和 LangChain 是什么关系？

LangChain 更偏 LLM 应用组件和 agent 基础能力，比如模型、消息、工具、结构化输出、RAG。LangGraph 更偏流程编排和运行时，适合把多步 agent、人工审批、状态持久化、恢复执行组织起来。

### 它是不是只能做大模型？

不是。LangGraph 可以编排普通 Python 函数，也可以编排调用 Prometheus、Loki、GitHub、Ansible、数据库和 LLM 的步骤。大模型只是其中一种节点能力。

### 为什么不用普通脚本？

简单一次性任务用普通脚本就够了。LangGraph 更适合步骤多、有分支、需要保存状态、需要人工审批、需要恢复执行、需要追踪每一步结果的流程。

### 学 AIOps 为什么要学 LangGraph？

AIOps 不只是“问大模型一个问题”，还要把指标、日志、告警、runbook、审批、自动化动作和验证闭环串起来。LangGraph 正好适合表达这种有状态、多步骤、有风险控制的流程。

## 为什么要学

AIOps 的难点不是让大模型会聊天，而是让它在生产排障里可靠工作：

- 告警进来后，要先收集证据。
- 证据不足时，要继续查询指标、日志、链路、变更。
- 做危险动作前，要停下来等人批准。
- 自动化执行失败后，要能知道失败在哪一步。
- 流程恢复后，要能接着上次状态继续。
- 最后要沉淀事故时间线、runbook 改进和模型评估数据。

这些能力都需要“流程状态”和“执行轨迹”。LangGraph 给了一个适合 AI Agent 的工程化骨架。

## 是什么

LangGraph 是 LangChain 生态里的有状态 agent 编排框架。它把工作流建模成 graph，也就是图。

图里有三类最重要的东西：

- state：当前流程共享的数据快照。
- node：处理 state 的函数，也就是一步工作。
- edge：决定下一步去哪个 node 的连线。

你可以把它想成一个更适合 AI Agent 的流程图引擎：既能走固定流程，也能根据状态动态分支，还能保存中间状态。

## 解决什么问题

### 问题 1：多步排障流程容易散

普通脚本写到后面会变成大量函数互相调用。新手很难看清：

- 从哪里开始？
- 每一步输入是什么？
- 每一步输出是什么？
- 哪些分支会执行？
- 哪里需要人工确认？

LangGraph 用 node 和 edge 把流程显式画出来。

### 问题 2：AI Agent 容易不可控

大模型 agent 如果只靠提示词决定下一步，可能会重复调用工具、跳过检查、直接执行危险动作。

LangGraph 可以把关键步骤固定住：

- 先收集指标。
- 再查日志。
- 再查变更。
- 再生成建议。
- 危险动作必须进入人工审批节点。

### 问题 3：长流程需要恢复

事故排障可能运行几分钟到几十分钟，中间可能失败、重试、人工等待。LangGraph 的 persistence 和 checkpoint 能保存状态，方便恢复和继续执行。

### 问题 4：AIOps 需要可观测

排障系统自己也要可观测。你要知道每个节点输入输出、耗时、错误、模型回答和人工修改。LangGraph 可以和 LangSmith 配合做 tracing 和调试。

## 核心原理

LangGraph 的核心不是“神奇 AI”，而是“有状态图执行”。

```text
alert input
  -> collect_metrics node
  -> collect_logs node
  -> classify_incident node
  -> choose_runbook node
  -> approval node
  -> execute_action node
  -> verify_recovery node
  -> END
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>alert input</code> | 这一行里的英文要这样读：`alert input` 这个英文标识可以拆开理解为：告警。 |
| 第 2 行 | <code>  -&gt; collect_metrics node</code> | 这一行要理解这些英文词：`collect_metrics node` 是metrics=指标。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; collect_logs node</code> | 这一行要理解这些英文词：`collect_logs node` 是logs=日志。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; classify_incident node</code> | 这一行要理解这些英文词：`classify_incident node` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; choose_runbook node</code> | 这一行要理解这些英文词：`choose_runbook node` 是runbook=故障处理手册。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>  -&gt; approval node</code> | 这一行要理解这些英文词：`approval node` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 7 行 | <code>  -&gt; execute_action node</code> | 这一行要理解这些英文词：`execute_action node` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 8 行 | <code>  -&gt; verify_recovery node</code> | 这一行要理解这些英文词：`verify_recovery node` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 9 行 | <code>  -&gt; END</code> | 这一行要理解这些英文词：`END` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

每个节点都读同一份 state，并返回 state 的更新部分。

```text
State before node
  -> node function
  -> state update
  -> merged new state
  -> next edge
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>State before node</code> | 这一行里的英文要这样读：`State before node` 这个英文标识可以拆开理解为：节点。 |
| 第 2 行 | <code>  -&gt; node function</code> | 这一行要理解这些英文词：`node function` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; state update</code> | 这一行要理解这些英文词：`state update` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; merged new state</code> | 这一行要理解这些英文词：`merged new state` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; next edge</code> | 这一行要理解这些英文词：`next edge` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

这样做有几个好处：

- 输入输出清楚。
- 流程分支清楚。
- 中间状态能保存。
- 某一步失败时能定位。
- 人工审批可以插在图中间。

## 核心概念逐个拆解

### Graph

是什么：Graph 是图，表示整个流程。它包含节点、连线和状态结构。

为什么需要：AIOps 排障流程通常不是一条直线，而是有分支、有循环、有人工审批。图比一串函数调用更容易表达这种结构。

怎么工作：你先创建 `StateGraph`，再把 node 和 edge 加进去，最后 `compile()` 成可运行对象。

怎么使用或观察：看代码里的 `add_node()`、`add_edge()`、`add_conditional_edges()`，就能知道流程如何流动。

出问题怎么排查：如果流程没走到预期节点，先检查 edge 是否连错、条件函数是否返回了不存在的分支名、state 字段是否缺失。

### State

是什么：State 是流程共享的数据。它可以理解成“事故处理单的当前状态”。

为什么需要：排障流程里的每一步都要共享上下文，比如告警名、指标结果、日志摘要、风险等级、runbook 建议。

怎么工作：节点函数接收当前 state，返回一个字典更新。LangGraph 把更新合并回 state。

怎么使用或观察：用 `TypedDict` 或 Pydantic 模型定义字段。运行时打印 `app.invoke()` 的返回结果，就能看到最终 state。

出问题怎么排查：如果节点拿不到字段，检查初始输入是否包含必填字段，节点返回的 key 是否拼错，字段类型是否和预期一致。

### Node

是什么：Node 是节点，也就是流程中的一步。技术上通常是一个 Python 函数。

为什么需要：把复杂排障拆成小步骤，每一步只负责一件事，比如查指标、查日志、分类、审批、执行。

怎么工作：节点接收 state，执行逻辑，然后返回 state 更新。

怎么使用或观察：用 `builder.add_node("collect_metrics", collect_metrics)` 注册节点。节点名要稳定、清晰，方便日志和 tracing。

出问题怎么排查：如果节点报错，先单独调用这个函数，把模拟 state 传进去，看返回值是否是字典、是否包含后续步骤需要的字段。

### Edge

是什么：Edge 是连线，表示一个节点执行完后去哪里。

为什么需要：没有 edge，节点只是散落的函数。edge 把步骤组织成流程。

怎么工作：固定 edge 用 `add_edge("a", "b")`。条件 edge 用一个函数根据 state 返回分支名。

怎么使用或观察：固定排障步骤用普通 edge；按风险等级、告警类型、是否需要审批分流时用 conditional edge。

出问题怎么排查：如果流程提前结束或走错方向，检查 `START`、`END`、edge 起点终点和条件返回值。

### START 和 END

是什么：`START` 是图的入口，`END` 是图的结束点。

为什么需要：它们让流程边界明确：从哪里开始，到哪里结束。

怎么工作：你用 `add_edge(START, "first_node")` 指定第一步，用 `add_edge("last_node", END)` 指定结束。

怎么使用或观察：看 `START` 后面连的是不是你真正想先执行的节点。

出问题怎么排查：如果运行后没有执行节点，先检查是否忘了从 `START` 连到第一个节点。

### Conditional Edge

是什么：Conditional edge 是条件分支连线。

为什么需要：AIOps 流程常常要根据状态分流，比如低风险只生成建议，高风险必须人工审批。

怎么工作：条件函数读取 state，返回一个分支名；LangGraph 根据分支名跳到对应节点。

怎么使用或观察：

```python
def route_by_risk(state):
    if state["risk"] == "high":
        return "approval"
    return "suggestion"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>def route_by_risk(state):</code> | 定义函数，把一段可复用逻辑命名，后续可以反复调用。 |
| 第 2 行 | <code>    if state["risk"] == "high":</code> | 条件判断，只有条件成立时才执行下面缩进的代码。 |
| 第 3 行 | <code>        return "approval"</code> | 返回函数结果，调用方会拿到这个值继续处理。 |
| 第 4 行 | <code>    return "suggestion"</code> | 返回函数结果，调用方会拿到这个值继续处理。 |

出问题怎么排查：检查条件函数所有可能返回值是否都在映射里，避免返回 `high` 但映射里只有 `approval`。

### Checkpoint

是什么：Checkpoint 是检查点，保存某次执行过程中的 state。

为什么需要：长时间运行的 agent 可能失败、重启或等待人工输入。没有 checkpoint，就只能从头再跑。

怎么工作：编译 graph 时接入 checkpointer。每次状态变化时，LangGraph 可以保存线程级状态。

怎么使用或观察：学习时可用内存 checkpointer；生产中要考虑数据库或持久化存储。

出问题怎么排查：如果恢复不了，检查 thread id 是否一致、checkpointer 是否真的启用、存储是否可写、schema 是否升级导致旧状态不兼容。

### Memory

是什么：Memory 是记忆。短期记忆通常跟一次会话或一个 thread 绑定，长期记忆用于跨会话保存信息。

为什么需要：AIOps 助手要记住当前事故上下文，也可能要记住服务画像、常见故障、团队偏好和历史处置结果。

怎么工作：短期记忆常通过 state 和 checkpoint 保存；长期记忆通过 store 保存可复用信息。

怎么使用或观察：看同一个 thread 下多轮调用是否能读取前面的上下文。

出问题怎么排查：如果“记不住”，检查是否用了同一个 thread id；如果“记太多”，检查是否把无关日志、敏感信息或过期状态写进长期记忆。

### Interrupt

是什么：Interrupt 是中断，表示流程暂停并等待外部输入。

为什么需要：AIOps 里有些动作不能让 agent 自动做，比如重启生产服务、扩容、回滚、修改限流策略。这些动作需要人工审批。

怎么工作：节点中触发 interrupt 后，图保存状态并暂停；外部系统提交人工结果后，再恢复执行。

怎么使用或观察：把 interrupt 放在危险动作前，而不是动作后。

出问题怎么排查：如果暂停后无法继续，检查恢复调用是否带了正确 thread id，人工输入格式是否符合节点预期。

### Human-in-the-loop

是什么：Human-in-the-loop 是人在流程中参与判断、审批或修改状态。

为什么需要：生产系统有风险边界。AI 可以建议，但高风险动作必须让人确认。

怎么工作：LangGraph 通过 interrupt、state 修改和恢复执行支持人在关键节点介入。

怎么使用或观察：审批节点应该记录审批人、审批时间、审批理由和最终动作。

出问题怎么排查：如果流程绕过审批，检查条件分支；如果审批结果没生效，检查人工输入是否写回 state。

### Streaming

是什么：Streaming 是流式输出执行过程或中间结果。

为什么需要：排障流程可能很长，值班同学不能等十分钟才看到结果。流式输出可以边查边展示。

怎么工作：应用运行时把节点事件、模型 token 或状态更新逐步返回给调用方。

怎么使用或观察：前端可以显示“正在查指标”“正在查日志”“等待审批”等状态。

出问题怎么排查：如果前端没有进度，检查调用方是否使用 stream 接口，后端是否把事件转发给 UI。

## 架构和数据流

### 最小架构

```text
Alertmanager webhook
  -> FastAPI receiver
  -> LangGraph app
     -> Prometheus / VictoriaMetrics query node
     -> Loki / Elasticsearch log node
     -> GitHub deployment node
     -> Runbook retrieval node
     -> LLM summary node
     -> human approval node
     -> automation action node
     -> verification node
  -> incident record
  -> GitHub learning evidence
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Alertmanager webhook</code> | 这一行里的英文要这样读：`Alertmanager webhook` 这个英文标识可以拆开理解为：通过 HTTP 回调接收通知的接口。 |
| 第 2 行 | <code>  -&gt; FastAPI receiver</code> | 这一行要理解这些英文词：`FastAPI receiver` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; LangGraph app</code> | 这一行要理解这些英文词：`LangGraph app` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>     -&gt; Prometheus / VictoriaMetrics query node</code> | 这一行要理解这些英文词：`Prometheus` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`VictoriaMetrics query node` 是query=查询。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>     -&gt; Loki / Elasticsearch log node</code> | 这一行要理解这些英文词：`Loki` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`Elasticsearch log node` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>     -&gt; GitHub deployment node</code> | 这一行要理解这些英文词：`GitHub deployment node` 是github=代码托管平台。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 7 行 | <code>     -&gt; Runbook retrieval node</code> | 这一行要理解这些英文词：`Runbook retrieval node` 是runbook=故障处理手册。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 8 行 | <code>     -&gt; LLM summary node</code> | 这一行要理解这些英文词：`LLM summary node` 是llm=大语言模型。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 9 行 | <code>     -&gt; human approval node</code> | 这一行要理解这些英文词：`human approval node` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 10 行 | <code>     -&gt; automation action node</code> | 这一行要理解这些英文词：`automation action node` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 11 行 | <code>     -&gt; verification node</code> | 这一行要理解这些英文词：`verification node` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 12 行 | <code>  -&gt; incident record</code> | 这一行要理解这些英文词：`incident record` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 13 行 | <code>  -&gt; GitHub learning evidence</code> | 这一行要理解这些英文词：`GitHub learning evidence` 是github=代码托管平台。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

### LangGraph 在 AIOps 链路的位置

```text
metrics / logs / traces / alerts / changes / runbooks
  -> evidence collection
  -> LangGraph state
  -> routing and reasoning
  -> suggested action
  -> human approval
  -> automation
  -> verification
  -> incident knowledge base
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>metrics / logs / traces / alerts / changes / runbooks</code> | `metrics / logs / traces / alerts / changes / runbooks` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 2 行 | <code>  -&gt; evidence collection</code> | 这一行要理解这些英文词：`evidence collection` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; LangGraph state</code> | 这一行要理解这些英文词：`LangGraph state` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; routing and reasoning</code> | 这一行要理解这些英文词：`routing and reasoning` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; suggested action</code> | 这一行要理解这些英文词：`suggested action` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>  -&gt; human approval</code> | 这一行要理解这些英文词：`human approval` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 7 行 | <code>  -&gt; automation</code> | 这一行要理解这些英文词：`automation` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 8 行 | <code>  -&gt; verification</code> | 这一行要理解这些英文词：`verification` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 9 行 | <code>  -&gt; incident knowledge base</code> | 这一行要理解这些英文词：`incident knowledge base` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

LangGraph 不替代 Prometheus、Loki、OpenTelemetry、Ansible、GitHub Actions 或数据库。它负责把这些工具按“排障流程”编排起来。

## 安装和启动

### 准备 Python 虚拟环境

命令：

```bash
python -m venv .venv
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>python -m venv .venv</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 |

目的：创建一个隔离的 Python 环境，避免污染系统 Python。

常见坑：

- Windows 上如果 `python` 找不到，先检查 Python 是否安装并加入 PATH。
- 不要把 `.venv/` 提交到 GitHub。

### 激活虚拟环境

Windows PowerShell：

```powershell
.\.venv\Scripts\Activate.ps1
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>.\.venv\Scripts\Activate.ps1</code> | 执行 `.\.venv\scripts\activate.ps1` 相关命令，后面的参数决定它具体操作什么对象。 |

macOS / Linux：

```bash
source .venv/bin/activate
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>source .venv/bin/activate</code> | 执行 `source` 相关命令，后面的参数决定它具体操作什么对象。 |

预期结果：命令行前面出现 `(.venv)`。

### 安装 LangGraph

```bash
pip install -U langgraph
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>pip install -U langgraph</code> | 管理 Python 依赖包，通常用于安装实验需要的库。 |

如果后续要接 OpenAI 模型，再安装：

```bash
pip install -U langchain-openai python-dotenv
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>pip install -U langchain-openai python-dotenv</code> | 管理 Python 依赖包，通常用于安装实验需要的库。 |

本文的第一个实验不需要 API Key，只用普通 Python 函数跑通 graph。

## 配置解释

LangGraph 本身不是一个必须先启动的数据库或服务。你在 Python 代码里配置 graph。

常见配置点：

| 配置点 | 作用 | 新手理解 | AIOps 场景 | 常见坑 |
|---|---|---|---|---|
| state schema | 定义流程共享字段 | 事故单有哪些字段 | alert、risk、runbook、evidence | 字段名拼错 |
| node name | 标识一步动作 | 流程图里的方框名 | `collect_metrics` | 名字不清晰，排障难 |
| edge | 定义下一步 | 流程图里的箭头 | 查完指标再查日志 | 忘记连 START |
| conditional edge | 定义分支 | 根据状态选择路线 | 高风险进审批 | 返回值不在映射里 |
| checkpointer | 保存状态 | 中途能恢复 | 等人工审批后继续 | thread id 不一致 |
| store | 长期记忆 | 保存跨会话知识 | 服务画像、历史处置 | 保存敏感信息 |
| interrupt | 暂停等待外部输入 | 等人批准 | 重启、回滚、扩容前审批 | 危险动作前忘加 |

## 常用 API 字典

| API | 目的 | 常用写法 | 关键字段 | 预期结果 | AIOps 场景 | 常见坑 |
|---|---|---|---|---|---|---|
| `StateGraph` | 创建图 | `StateGraph(IncidentState)` | state schema | 得到 builder | 定义排障流程 | schema 过松导致字段混乱 |
| `add_node` | 添加节点 | `add_node("classify", classify)` | 节点名、函数 | 图中出现一个步骤 | 分类告警 | 函数不返回 dict |
| `add_edge` | 添加固定连线 | `add_edge("a", "b")` | 起点、终点 | a 后执行 b | 固定检查顺序 | 忘记连接 `START` |
| `add_conditional_edges` | 添加条件分支 | 传入路由函数和映射 | route function | 按 state 分流 | 高风险审批 | 返回值和映射不匹配 |
| `compile` | 编译图 | `builder.compile()` | checkpointer 可选 | 得到可运行 app | 发布工作流 | 编译前漏节点 |
| `invoke` | 执行一次 | `app.invoke(input)` | 初始 state | 返回最终 state | 处理一条告警 | 输入缺字段 |
| `stream` | 流式执行 | `app.stream(input)` | stream mode | 逐步看到事件 | 前端展示进度 | 调用方没消费事件 |
| `interrupt` | 暂停流程 | 节点内调用 | JSON 可序列化值 | 等外部恢复 | 人工审批 | 没有持久化状态 |

## 固定流程和动态 Agent 的区别

### 固定流程

固定流程是步骤提前写好的：

```text
alert -> metrics -> logs -> classify -> suggestion -> END
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>alert -&gt; metrics -&gt; logs -&gt; classify -&gt; suggestion -&gt; END</code> | 这一行要理解这些英文词：`alert` 是告警；`metrics` 是指标；`logs` 是日志；`classify` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`suggestion` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`END` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

适合：

- 新手学习。
- 稳定 runbook。
- 安全要求高的自动化。
- 面试展示。

### 动态 Agent

动态 agent 会根据模型判断选择工具和下一步：

```text
alert -> LLM decides tool -> tool result -> LLM decides next step -> ...
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>alert -&gt; LLM decides tool -&gt; tool result -&gt; LLM decides next step -&gt; ...</code> | 这一行要理解这些英文词：`alert` 是告警；`LLM decides tool` 是llm=大语言模型；`tool result` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`LLM decides next step` 是llm=大语言模型。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

适合：

- 问题类型变化大。
- 需要探索证据。
- 工具很多，路线不固定。

但生产里不要一上来就完全动态。AIOps 更建议先用固定流程保证边界，再在某些节点里让 LLM 做摘要、分类或建议。

## AIOps 用法

LangGraph 可以接入 AIOps 的这些环节：

| AIOps 环节 | LangGraph 作用 | 示例 |
|---|---|---|
| metrics | 编排 Prometheus / VictoriaMetrics 查询 | 查询错误率、延迟、QPS |
| logs | 编排 Loki / Elasticsearch 查询 | 拉取最近 10 分钟错误日志 |
| traces | 编排 OpenTelemetry Trace 查询 | 找慢链路和异常 span |
| alerts | 接收 Alertmanager webhook 后分流 | 高风险和低风险走不同流程 |
| automation | 编排 Ansible / GitHub Actions / API | 自动扩容、刷新缓存、生成工单 |
| anomaly detection | 调用模型或规则节点 | 对指标窗口做异常评分 |
| root-cause analysis | 聚合证据并生成 RCA 草稿 | 变更、日志、指标交叉分析 |
| runbooks | 根据告警选择步骤 | 选择服务对应 runbook |
| knowledge bases | 把结果写入知识库 | 事故总结、学习证据 |

## 入门实验：不用大模型跑一个告警分诊图

### 实验目标

用 LangGraph 跑通一个最小 AIOps 事故分诊流程：

```text
输入告警
  -> 匹配 runbook
  -> 判断风险
  -> 选择下一步动作
  -> 输出最终状态
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 2 行 | <code>  -&gt; 匹配 runbook</code> | 这一行要理解这些英文词：`runbook` 是故障处理手册。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; 判断风险</code> | 这一行表示上一级主题下的子项“判断风险”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |
| 第 4 行 | <code>  -&gt; 选择下一步动作</code> | 这一行表示上一级主题下的子项“选择下一步动作”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |
| 第 5 行 | <code>  -&gt; 输出最终状态</code> | 这一行表示上一级主题下的子项“输出最终状态”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |

这个实验不调用真实 Prometheus，也不调用 LLM。先把 graph 的骨架跑通，避免新手被 API Key、网络和模型费用卡住。

### 第 1 步：创建目录

```bash
mkdir aiops-langgraph-lab
cd aiops-langgraph-lab
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>mkdir aiops-langgraph-lab</code> | 创建目录，用来准备实验项目结构。 |
| 第 2 行 | <code>cd aiops-langgraph-lab</code> | 切换当前目录，确保后续命令在正确项目位置执行。 |

### 第 2 步：创建虚拟环境并安装

```bash
python -m venv .venv
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>python -m venv .venv</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 |

Windows PowerShell：

```powershell
.\.venv\Scripts\Activate.ps1
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>.\.venv\Scripts\Activate.ps1</code> | 执行 `.\.venv\scripts\activate.ps1` 相关命令，后面的参数决定它具体操作什么对象。 |

macOS / Linux：

```bash
source .venv/bin/activate
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>source .venv/bin/activate</code> | 执行 `source` 相关命令，后面的参数决定它具体操作什么对象。 |

安装：

```bash
pip install -U langgraph
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>pip install -U langgraph</code> | 管理 Python 依赖包，通常用于安装实验需要的库。 |

### 第 3 步：创建 `incident_triage.py`

```python
from typing_extensions import TypedDict

from langgraph.graph import END, START, StateGraph


class IncidentState(TypedDict):
    alert: str
    service: str
    runbook: str
    risk: str
    next_action: str
    explanation: str


def load_runbook(state: IncidentState) -> dict:
    service = state["service"]
    if service == "order-api":
        return {
            "runbook": "检查最近发布、错误率、下游支付接口、数据库连接池。"
        }
    return {
        "runbook": "先检查服务健康、错误日志、依赖状态和最近变更。"
    }


def classify_risk(state: IncidentState) -> dict:
    alert = state["alert"].lower()
    if "high" in alert or "error" in alert:
        return {"risk": "high"}
    return {"risk": "low"}


def choose_action(state: IncidentState) -> dict:
    if state["risk"] == "high":
        return {
            "next_action": "needs_human_approval",
            "explanation": "这是高风险告警。先收集证据，再让值班同学确认是否回滚或扩容。"
        }

    return {
        "next_action": "create_ticket",
        "explanation": "这是低风险告警。先创建工单，继续观察趋势。"
    }


builder = StateGraph(IncidentState)
builder.add_node("load_runbook", load_runbook)
builder.add_node("classify_risk", classify_risk)
builder.add_node("choose_action", choose_action)

builder.add_edge(START, "load_runbook")
builder.add_edge("load_runbook", "classify_risk")
builder.add_edge("classify_risk", "choose_action")
builder.add_edge("choose_action", END)

app = builder.compile()

result = app.invoke(
    {
        "alert": "HighErrorRate: order-api error rate is above 5%",
        "service": "order-api",
        "runbook": "",
        "risk": "",
        "next_action": "",
        "explanation": "",
    }
)

print(result)
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>from typing_extensions import TypedDict</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 3 行 | <code>from langgraph.graph import END, START, StateGraph</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 6 行 | <code>class IncidentState(TypedDict):</code> | 定义类，用来组织一组数据和行为。 |
| 第 7 行 | <code>    alert: str</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 8 行 | <code>    service: str</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 9 行 | <code>    runbook: str</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 10 行 | <code>    risk: str</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 11 行 | <code>    next_action: str</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 12 行 | <code>    explanation: str</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 15 行 | <code>def load_runbook(state: IncidentState) -&gt; dict:</code> | 定义函数，把一段可复用逻辑命名，后续可以反复调用。 |
| 第 16 行 | <code>    service = state["service"]</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 17 行 | <code>    if service == "order-api":</code> | 条件判断，只有条件成立时才执行下面缩进的代码。 |
| 第 18 行 | <code>        return {</code> | 返回函数结果，调用方会拿到这个值继续处理。 |
| 第 19 行 | <code>            "runbook": "检查最近发布、错误率、下游支付接口、数据库连接池。"</code> | `runbook` 是故障处理手册，`检查最近发布、错误率、下游支付接口、数据库连接池。` 是这个字段的中文取值，已经直接说明了含义；这是 Python 字典里的一个键值对。 |
| 第 20 行 | <code>        }</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 21 行 | <code>    return {</code> | 返回函数结果，调用方会拿到这个值继续处理。 |
| 第 22 行 | <code>        "runbook": "先检查服务健康、错误日志、依赖状态和最近变更。"</code> | `runbook` 是故障处理手册，`先检查服务健康、错误日志、依赖状态和最近变更。` 是这个字段的中文取值，已经直接说明了含义；这是 Python 字典里的一个键值对。 |
| 第 23 行 | <code>    }</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 26 行 | <code>def classify_risk(state: IncidentState) -&gt; dict:</code> | 定义函数，把一段可复用逻辑命名，后续可以反复调用。 |
| 第 27 行 | <code>    alert = state["alert"].lower()</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 28 行 | <code>    if "high" in alert or "error" in alert:</code> | 条件判断，只有条件成立时才执行下面缩进的代码。 |
| 第 29 行 | <code>        return {"risk": "high"}</code> | 返回函数结果，调用方会拿到这个值继续处理。 |
| 第 30 行 | <code>    return {"risk": "low"}</code> | 返回函数结果，调用方会拿到这个值继续处理。 |
| 第 33 行 | <code>def choose_action(state: IncidentState) -&gt; dict:</code> | 定义函数，把一段可复用逻辑命名，后续可以反复调用。 |
| 第 34 行 | <code>    if state["risk"] == "high":</code> | 条件判断，只有条件成立时才执行下面缩进的代码。 |
| 第 35 行 | <code>        return {</code> | 返回函数结果，调用方会拿到这个值继续处理。 |
| 第 36 行 | <code>            "next_action": "needs_human_approval",</code> | `next_action` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`needs_human_approval` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；这是 Python 字典里的一个键值对。 |
| 第 37 行 | <code>            "explanation": "这是高风险告警。先收集证据，再让值班同学确认是否回滚或扩容。"</code> | `explanation` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`这是高风险告警。先收集证据，再让值班同学确认是否回滚或扩容。` 是这个字段的中文取值，已经直接说明了含义；这是 Python 字典里的一个键值对。 |
| 第 38 行 | <code>        }</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 40 行 | <code>    return {</code> | 返回函数结果，调用方会拿到这个值继续处理。 |
| 第 41 行 | <code>        "next_action": "create_ticket",</code> | `next_action` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`create_ticket` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；这是 Python 字典里的一个键值对。 |
| 第 42 行 | <code>        "explanation": "这是低风险告警。先创建工单，继续观察趋势。"</code> | `explanation` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`这是低风险告警。先创建工单，继续观察趋势。` 是这个字段的中文取值，已经直接说明了含义；这是 Python 字典里的一个键值对。 |
| 第 43 行 | <code>    }</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 46 行 | <code>builder = StateGraph(IncidentState)</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 47 行 | <code>builder.add_node("load_runbook", load_runbook)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 48 行 | <code>builder.add_node("classify_risk", classify_risk)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 49 行 | <code>builder.add_node("choose_action", choose_action)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 51 行 | <code>builder.add_edge(START, "load_runbook")</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 52 行 | <code>builder.add_edge("load_runbook", "classify_risk")</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 53 行 | <code>builder.add_edge("classify_risk", "choose_action")</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 54 行 | <code>builder.add_edge("choose_action", END)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 56 行 | <code>app = builder.compile()</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 58 行 | <code>result = app.invoke(</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 59 行 | <code>    {</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 60 行 | <code>        "alert": "HighErrorRate: order-api error rate is above 5%",</code> | `alert` 是告警，`HighErrorRate: order-api error rate is above 5%` 是高错误率告警名，表示请求失败比例过高；这是 Python 字典里的一个键值对。 |
| 第 61 行 | <code>        "service": "order-api",</code> | `service` 是服务名称字段，`order-api` 是具体服务名，表示这条记录属于这个服务；这是 Python 字典里的一个键值对。 |
| 第 62 行 | <code>        "runbook": "",</code> | `runbook` 是故障处理手册，`` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；这是 Python 字典里的一个键值对。 |
| 第 63 行 | <code>        "risk": "",</code> | `risk` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；这是 Python 字典里的一个键值对。 |
| 第 64 行 | <code>        "next_action": "",</code> | `next_action` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；这是 Python 字典里的一个键值对。 |
| 第 65 行 | <code>        "explanation": "",</code> | `explanation` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；这是 Python 字典里的一个键值对。 |
| 第 66 行 | <code>    }</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 67 行 | <code>)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 69 行 | <code>print(result)</code> | 打印输出，用来在实验中确认变量、结果或调试信息。 |

### 第 4 步：运行

```bash
python incident_triage.py
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>python incident_triage.py</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 |

### 预期输出

输出大致应该包含：

```text
'service': 'order-api'
'risk': 'high'
'next_action': 'needs_human_approval'
'runbook': '检查最近发布、错误率、下游支付接口、数据库连接池。'
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>'service': 'order-api'</code> | 这一行里的英文要这样读：`service` 是服务名称字段；`order-api` 里的 order 表示订单业务，api 表示接口服务，合起来通常指订单接口服务。 |
| 第 2 行 | <code>'risk': 'high'</code> | 这一行里的英文要这样读：`risk` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值；`high` 是高。 |
| 第 3 行 | <code>'next_action': 'needs_human_approval'</code> | 这一行里的英文要这样读：`next_action` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值；`needs_human_approval` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 4 行 | <code>'runbook': '检查最近发布、错误率、下游支付接口、数据库连接池。'</code> | 这一行里的英文要这样读：`runbook` 是故障处理手册。 |

字段解释：

| 字段 | 含义 | AIOps 解释 |
|---|---|---|
| `alert` | 输入告警 | 来自 Alertmanager、监控平台或工单 |
| `service` | 受影响服务 | 用来选择 runbook 和负责人 |
| `runbook` | 排障步骤 | 后续可来自 Markdown、数据库或 RAG |
| `risk` | 风险等级 | 决定是否需要人工审批 |
| `next_action` | 下一步动作 | 创建工单、人工审批、自动化动作 |
| `explanation` | 判断说明 | 给值班同学看的解释 |

### 验证方法

你要确认三件事：

1. 程序没有报错。
2. 输出里有 `runbook`。
3. 输出里 `risk` 是 `high`，`next_action` 是 `needs_human_approval`。

### 如果没有成功，先检查这些

| 现象 | 可能原因 | 检查方法 | 修复 |
|---|---|---|---|
| `ModuleNotFoundError: No module named 'langgraph'` | 没安装或虚拟环境没激活 | `pip show langgraph` | 激活 `.venv` 后重新安装 |
| `KeyError: 'service'` | 初始 state 缺字段 | 看 `app.invoke()` 输入 | 补上 `service` |
| 输出没有 `runbook` | 节点没执行或 key 拼错 | 给 `load_runbook` 加 `print(state)` | 检查 edge 和返回字段 |
| 风险总是 low | 判断条件太简单 | 打印 `alert.lower()` | 调整关键词规则 |
| 流程没有结束 | edge 连错 | 检查是否连到 `END` | 补 `builder.add_edge("choose_action", END)` |

## 进阶实验：加入条件分支

当你确认固定流程能跑后，再把 `classify_risk` 后面的路径改成分支：

```text
classify_risk
  -> high risk -> approval_required
  -> low risk -> create_ticket
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>classify_risk</code> | 这一行里的英文要这样读：`classify_risk` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 2 行 | <code>  -&gt; high risk -&gt; approval_required</code> | 这一行要理解这些英文词：`high risk` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`approval_required` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; low risk -&gt; create_ticket</code> | 这一行要理解这些英文词：`low risk` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`create_ticket` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

思路：

```python
def route_by_risk(state: IncidentState) -> str:
    if state["risk"] == "high":
        return "approval"
    return "ticket"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>def route_by_risk(state: IncidentState) -&gt; str:</code> | 定义函数，把一段可复用逻辑命名，后续可以反复调用。 |
| 第 2 行 | <code>    if state["risk"] == "high":</code> | 条件判断，只有条件成立时才执行下面缩进的代码。 |
| 第 3 行 | <code>        return "approval"</code> | 返回函数结果，调用方会拿到这个值继续处理。 |
| 第 4 行 | <code>    return "ticket"</code> | 返回函数结果，调用方会拿到这个值继续处理。 |

这一步的学习重点不是代码多复杂，而是理解“风险不同，流程不同”。

## 生产化思路

学习实验跑通后，可以按这个方向演进：

1. 把 `alert` 输入改成 Alertmanager webhook。
2. 增加 Prometheus 或 VictoriaMetrics 查询节点。
3. 增加 Loki 或 Elasticsearch 日志查询节点。
4. 增加 GitHub Actions 最近部署查询节点。
5. 增加 RAG runbook 检索节点。
6. 增加 LLM 摘要节点。
7. 对高风险动作加 interrupt 和人工审批。
8. 把最终状态写入 MySQL、PostgreSQL 或 Markdown 事故记录。
9. 用 LangSmith 或日志系统追踪每个节点耗时和输出。

## 常见排障

### 流程走错分支

可能原因：

- 条件函数返回值和映射不一致。
- state 里的风险字段没有更新。
- 判断逻辑过于简单。

排查：

1. 打印条件函数收到的 state。
2. 打印条件函数返回值。
3. 检查 `add_conditional_edges()` 的映射。

### 节点输出被覆盖

可能原因：

- 多个节点写同一个字段。
- 字段语义不清晰。
- state schema 太随意。

排查：

1. 给字段起更明确的名字，比如 `metrics_summary`、`logs_summary`。
2. 每个节点只更新自己负责的字段。
3. 在节点返回前打印更新内容。

### Agent 一直循环

可能原因：

- 条件边没有结束条件。
- LLM 节点总是选择继续调用工具。
- 没有限制最大步骤数。

排查：

1. 给循环加最大次数。
2. 把循环原因写入 state。
3. 低风险场景优先走固定流程，不要一开始就完全动态。

### 人工审批后无法恢复

可能原因：

- 没配置 checkpointer。
- thread id 不一致。
- 恢复时输入格式不对。

排查：

1. 确认编译 graph 时用了 checkpointer。
2. 确认暂停和恢复使用同一个 thread id。
3. 确认人工输入是 JSON 可序列化数据。

### 模型回答看起来合理但证据不足

可能原因：

- LLM 节点没有拿到真实指标或日志。
- prompt 没要求引用证据。
- RAG 检索结果质量差。

排查：

1. 在 state 里保留 `evidence` 字段。
2. 要求每个建议都引用指标、日志、变更或 runbook。
3. 对“无证据的建议”降级为人工确认。

## 命令和操作字典

| 操作 | 目的 | 常用写法 | 预期结果 | AIOps 场景 | 常见坑 |
|---|---|---|---|---|---|
| 创建虚拟环境 | 隔离依赖 | `python -m venv .venv` | 生成 `.venv` | 项目实验环境 | 把 `.venv` 提交 |
| 安装 LangGraph | 引入框架 | `pip install -U langgraph` | 可 import | 本地排障流程实验 | 没激活虚拟环境 |
| 运行脚本 | 执行 graph | `python incident_triage.py` | 输出最终 state | 模拟告警处理 | 当前目录不对 |
| 查看包版本 | 确认依赖 | `pip show langgraph` | 显示版本信息 | 排查导入失败 | 多 Python 环境混用 |
| 保存证据 | 形成作品集 | 提交 `.py`、README、运行截图 | GitHub 可复盘 | 面试展示 | 只提交空文档 |

## 面试怎么讲

可以这样说：

> 我会把 LangGraph 放在 AIOps 智能排障的编排层。告警进来以后，它不是直接让大模型自由发挥，而是按图执行：先收集 Prometheus 或 VictoriaMetrics 指标，再查日志、变更和 runbook，然后根据风险等级分支。低风险可以生成工单或建议，高风险动作必须进入人工审批。LangGraph 的 state 负责保存上下文，node 负责每一步动作，edge 负责流程流转，checkpoint 支持中断后恢复。这样比单纯 prompt 更可控，也更适合生产排障。

## 学习检查清单

- [ ] 我能解释 LangGraph 和 LangChain 的区别。
- [ ] 我能说清 state、node、edge 各自是什么。
- [ ] 我能写出一个最小 StateGraph。
- [ ] 我能解释为什么 AIOps 需要 checkpoint。
- [ ] 我能说清哪些动作必须 human-in-the-loop。
- [ ] 我能把 Prometheus、Loki、runbook、LLM 放进同一条流程。
- [ ] 我能排查节点不执行、分支走错、状态缺字段的问题。
- [ ] 我能把实验代码、运行截图和排障记录提交到 GitHub。

## 面试题

1. LangGraph 解决了 LangChain agent 的哪些工程化问题？
2. StateGraph 里的 state、node、edge 分别是什么？
3. 什么场景适合固定 workflow，什么场景适合动态 agent？
4. AIOps 中为什么高风险动作需要 human-in-the-loop？
5. checkpoint 和 memory 有什么区别？
6. 条件分支走错时你会怎么排查？
7. LangGraph 如何和 Prometheus、Loki、GitHub Actions、RAG 结合？
8. 如何防止 LLM Agent 在生产排障中越权执行？
9. 如果流程执行到一半失败，你希望系统保存哪些信息？
10. 你会如何评价一个 LangGraph 排障助手是否真的有效？

## 学习证据

学完以后，在 GitHub 提交这些内容：

```text
aiops-langgraph-lab/
  README.md
  incident_triage.py
  screenshots/
    run-result.png
  notes/
    langgraph-state-node-edge.md
    troubleshooting.md
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>aiops-langgraph-lab/</code> | `aiops-langgraph-lab/` 是目录示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 2 行 | <code>  README.md</code> | `README.md` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 3 行 | <code>  incident_triage.py</code> | `incident_triage.py` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 4 行 | <code>  screenshots/</code> | `screenshots/` 是目录示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 5 行 | <code>    run-result.png</code> | `run-result.png` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 6 行 | <code>  notes/</code> | `notes/` 是目录示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 7 行 | <code>    langgraph-state-node-edge.md</code> | `langgraph-state-node-edge.md` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 8 行 | <code>    troubleshooting.md</code> | `troubleshooting.md` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |

`README.md` 建议记录：

- 为什么选择 LangGraph。
- 你的 graph 流程图。
- 每个 state 字段的含义。
- 运行命令。
- 运行输出截图。
- 你遇到的错误和修复过程。
- 下一步如何接入 Prometheus、Loki、runbook 和人工审批。

这份证据能证明你不是只会说“AI Agent”，而是真的能把 AIOps 排障流程拆成可运行、可恢复、可审计的工程结构。
