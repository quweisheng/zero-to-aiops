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
LangGraph（有状态图执行框架）
  -> Overview（总览）
     -> durable execution（可持久恢复执行）
     -> persistence（持久化）
     -> human-in-the-loop（人工参与决策）
     -> memory（记忆）
     -> streaming（流式输出）
  -> Graph API（图编程接口）
     -> state（状态）
     -> node（节点）
     -> edge（边）
     -> conditional edge（条件边）
     -> START（起点） / END（终点）
  -> Workflows and agents（工作流与智能体）
     -> fixed workflow（固定工作流）
     -> dynamic agent（动态智能体）
     -> routing（路由选择）
     -> evaluator-optimizer（评估与改进循环）
  -> Persistence（持久化）
     -> checkpoint（检查点）
     -> thread（会话执行线）
     -> resume（恢复执行）
     -> replay（重放）
  -> Memory（记忆）
     -> short-term memory（短期记忆）
     -> long-term memory（长期记忆）
  -> Interrupts（中断）
     -> pause（暂停）
     -> human approval（人工审批）
     -> resume（恢复执行）
  -> LangSmith（追踪与评估平台）
     -> tracing（追踪）
     -> evaluation（评估）
     -> debugging（调试）
```

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
alert input（告警输入）
  -> collect_metrics node（节点）
  -> collect_logs node（节点）
  -> classify_incident node（节点）
  -> choose_runbook node（节点）
  -> approval（审批） node（节点）
  -> execute_action node（节点）
  -> verify_recovery node（节点）
  -> END（终点）
```

每个节点都读同一份 state，并返回 state 的更新部分。

```text
State before node（节点执行前状态）
  -> node function（节点函数）
  -> state update（状态更新）
  -> merged new state（合并后的新状态）
  -> next edge（下一条边）
```

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

出问题怎么排查：检查条件函数所有可能返回值是否都在映射里，避免返回 `high` 但映射里只有 `approval`。

### Checkpoint

是什么：Checkpoint 是检查点，保存某次执行过程中的 state。

为什么需要：长时间运行的 agent 可能失败、重启或等待人工输入。没有 checkpoint，就只能从头再跑。

怎么工作：编译 graph 时接入 checkpointer。图在执行步骤边界保存可恢复状态，并处理任务写入；它不是每修改一个 Python 变量就立即备份整个进程。实际恢复与持久性还受保存器和执行持久性设置影响。

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
Alertmanager（告警管理器） webhook
  -> FastAPI receiver（FastAPI 请求接收服务）
  -> LangGraph app（LangGraph 图应用）
     -> Prometheus / VictoriaMetrics query（查询） node（节点）
     -> Loki / Elasticsearch log（日志） node（节点）
     -> GitHub deployment（部署） node（节点）
     -> Runbook retrieval（操作手册检索） node（节点）
     -> LLM（大语言模型） summary node（节点）
     -> human approval（人工审批） node（节点）
     -> automation（自动化） action node（节点）
     -> verification（验证） node（节点）
  -> incident（故障） record（记录）
  -> GitHub learning evidence（证据）
```

### LangGraph 在 AIOps 链路的位置

```text
metrics（指标） / logs（日志） / traces（链路追踪） / alerts（告警） / changes（变更） / runbooks（操作手册）
  -> evidence collection（证据收集）
  -> LangGraph state（状态）
  -> routing and reasoning（路由与推理）
  -> suggested action（建议操作）
  -> human approval（人工审批）
  -> automation（自动化）
  -> verification（验证）
  -> incident knowledge base（故障知识库）
```

LangGraph 不替代 Prometheus、Loki、OpenTelemetry、Ansible、GitHub Actions 或数据库。它负责把这些工具按“排障流程”编排起来。

## 安装和启动

### 准备 Python 虚拟环境

命令：

```bash
python -m venv .venv
```

目的：创建一个隔离的 Python 环境，避免污染系统 Python。

常见坑：

- Windows 上如果 `python` 找不到，先检查 Python 是否安装并加入 PATH。
- 不要把 `.venv/` 提交到 GitHub。

### 激活虚拟环境

Windows PowerShell：

```powershell
.\.venv\Scripts\Activate.ps1
```

macOS / Linux：

```bash
source .venv/bin/activate
```

预期结果：命令行前面出现 `(.venv)`。

### 安装 LangGraph

```bash
pip install -U langgraph
```

如果后续要接 OpenAI 模型，再安装：

```bash
pip install -U langchain-openai python-dotenv
```

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
alert（告警） -> metrics（指标） -> logs（日志） -> classify（分类） -> suggestion（建议） -> END（终点）
```

适合：

- 新手学习。
- 稳定 runbook。
- 安全要求高的自动化。
- 面试展示。

### 动态 Agent

动态 agent 会根据模型判断选择工具和下一步：

```text
alert（告警） -> LLM（大语言模型） decides tool（工具） -> tool（工具） result（结果） -> LLM（大语言模型） decides next step -> ...
```

上图的 `decides tool` 是选择工具，`decides next step` 是判断下一步；箭头表示控制流程，不表示模型拥有工具权限。工具执行仍应经过确定性的参数检查、授权和资源限制。

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

这个实验不调用真实 Prometheus，也不调用 LLM。先把 graph 的骨架跑通，避免新手被 API Key、网络和模型费用卡住。

### 第 1 步：创建目录

```bash
mkdir aiops-langgraph-lab
cd aiops-langgraph-lab
```

### 第 2 步：创建虚拟环境并安装

```bash
python -m venv .venv
```

Windows PowerShell：

```powershell
.\.venv\Scripts\Activate.ps1
```

macOS / Linux：

```bash
source .venv/bin/activate
```

安装：

```bash
pip install -U langgraph
```

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

### 第 4 步：运行

```bash
python incident_triage.py
```

### 预期输出

输出大致应该包含：

```text
'service': 'order-api'
'risk': 'high'
'next_action': 'needs_human_approval'
'runbook': '检查最近发布、错误率、下游支付接口、数据库连接池。'
```

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
classify_risk（判断风险）
  -> high risk（高风险） -> approval_required（必须审批）
  -> low risk（低风险） -> create_ticket（创建工单）
```

思路：

```python
def route_by_risk(state: IncidentState) -> str:
    if state["risk"] == "high":
        return "approval"
    return "ticket"
```

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

## 老师带你把排障流程变成一份可恢复的工作记录

State（状态）是这次排障已经知道什么，Node（节点）完成一个步骤并返回状态更新，Edge（边）决定接下来走哪一步。图不是为了把几行代码画得漂亮，而是让等待审批、失败重试、并行取证和恢复位置变得明确。

学生：“节点运行到一半崩溃了，是从下一行接着吗？”老师：“不要把持久执行理解成把 Python 进程每个指令都保存。”运行时依赖检查点、节点或任务边界恢复；节点可能重跑，其中的外部副作用需要幂等或适当拆分。官方 [持久化说明](https://docs.langchain.com/oss/python/langgraph/persistence) 应配合实际版本阅读。

### 状态合并为什么需要 reducer

两个并行节点都写 `evidence`，你要的是覆盖、追加，还是按证据 ID 合并？Reducer（状态归并函数）把规则明确下来。无条件追加可能在重试或重复输入时产生两份相同证据；覆盖可能丢掉另一路结果。状态字段应有所有者、类型、合并方式和版本，不是任意大字典。

`thread_id` 是查找一条持久流程状态的身份，不是显示标题。不同租户共享同一个值可能读到错误状态；同一流程多个并发请求也需要冲突策略。长期记忆与本次检查点不同，保存位置、权限、保留周期及删除方式要分别设计。

### 审批课堂：同意必须对应具体动作

Interrupt（中断等待）让流程停下来接收输入，但“用户说过同意”不能授权之后任意变化的目标和参数。审批记录应绑定工具名、目标范围、关键参数、风险与有效时间。状态变化后拟执行动作不同，需要重新匹配审批内容；执行前仍由服务端做身份和业务校验。

外部接口已经接受变更，节点在记录结果前崩溃，恢复后可能再次请求。使用稳定 operation ID（操作编号）、查询已有结果和幂等执行平台，让重试返回原结果。检查点保证流程可恢复，不自动保证数据库之外只发生一次副作用。

### 带练：观察暂停、恢复与重复风险

先运行前文不依赖大模型的基础图，记录每个节点前后状态与最终分类。扩展前文中断示例时，再配置检查点与 `thread_id`，提供批准与拒绝两种输入，验证拒绝路径不进入执行节点。用相同流程身份读取状态，确认恢复位置符合预期；不要用一个新 ID 冒充恢复。

故障练习仅将执行节点替换成打印合成 operation ID 的模拟函数，在它之后故意抛一次异常，再恢复，观察哪些节点重跑。预期能够解释重跑边界，并用记录过的 operation ID 抑制模拟重复。该内存去重演示不具备跨进程持久保证；真实部署需持久状态和外部幂等。结束清理本课线程与教学数据库范围，不删除其他线程检查点。

### 高可用、升级与面试课堂

多个无状态 worker 可以接续工作，但前提是共享可靠检查点、清晰的任务领取与并发控制。节点外部查询设超时，循环设步骤上限，队列设容量，避免一个证据不足的流程无限调用模型。监控节点耗时、失败、等待审批年龄、恢复次数、状态体积和业务完成结果。

升级改字段、节点名、归并规则或状态序列化，都可能影响已暂停流程。先让新版本能读旧状态，在测试里恢复真实形状的脱敏检查点，必要时保留旧运行环境处理存量流程，再收缩兼容代码。回滚也要验证新写入状态是否可被旧版读懂。

30 秒讲有状态图和可恢复步骤；3 分钟用告警取证、分类、审批、执行和验证串起状态、边与检查点。追问“为什么还需要幂等”：运行时恢复与外部事务不在同一原子边界。事故题设为审批后服务目标已变化，正确处置是停止执行、重新验证参数和权限，不能仅因流程已经过审批节点就继续。

## 独立故障实验：审批的目标和执行目标不一致

前提是在本篇 Python 虚拟环境安装 LangGraph。下面不调用模型或真实运维工具，只把执行记入列表。保存为 `approval_contract_lesson.py`，运行 `python approval_contract_lesson.py`。它测试图中的执行前校验，不实现真实审批系统，也不验证持久检查点恢复。

```python
from typing import TypedDict
from langgraph.graph import StateGraph, START, END

class ActionState(TypedDict):
    target: str
    approved_target: str
    done: bool

executions = []

def authorize(state: ActionState):
    if state['target'] != state['approved_target']:
        raise ValueError('审批目标已过期，必须重新确认')
    return {}

def execute_mock(state: ActionState):
    executions.append(state['target'])  # 只记教学列表，不执行外部操作
    return {'done': True}

builder = StateGraph(ActionState)
builder.add_node('authorize', authorize)
builder.add_node('execute_mock', execute_mock)
builder.add_edge(START, 'authorize')
builder.add_edge('authorize', 'execute_mock')
builder.add_edge('execute_mock', END)
app = builder.compile()

normal = app.invoke({'target': 'lab-a', 'approved_target': 'lab-a', 'done': False})
assert normal['done'] and executions == ['lab-a']
try:
    app.invoke({'target': 'lab-b', 'approved_target': 'lab-a', 'done': False})
except ValueError as error:
    print('DETECTED:', error)
assert executions == ['lab-a']

# 恢复方式：针对新目标重新取得教学审批，发起新运行
recovered = app.invoke({'target': 'lab-b', 'approved_target': 'lab-b', 'done': False})
assert recovered['done'] and executions == ['lab-a', 'lab-b']
print('recovered:', executions)
```

预期正常只记录 `lab-a`；目标改成 `lab-b` 但仍拿旧审批时被拒绝，列表没有增加；针对新目标重新确认后才增加 `lab-b`。如果错误目标仍执行，检查校验节点是否位于执行节点之前、是否有绕过它的边，以及执行函数是否被其他入口直接调用。清理退出进程即可，列表随内存释放，没有生产资源和后台会话。

现实系统不能信任调用方自己提交 `approved_target`。它应是服务端从可信审批记录读取的字段，绑定操作者、工具、目标、参数、有效时间与风险。示例把二者都放输入，只为了故意构造不一致。恢复时必须重新取得审批，不能通过人工改审批数据库让旧批准“看起来匹配”。

再追问检查点：这段代码没有配置保存器，所以进程退出就没有运行历史；加 InMemorySaver 也只是在当前进程内保存，并不等于多实例持久化。生产选择可靠保存器、隔离线程身份、状态迁移和权限策略，还需要针对进程中断、检查点不可用与重复任务做单独验证。

## 从零补课：图里的状态不是一份随便修改的全局变量

学习前先理解 Python 函数的输入和返回值、字典的键，以及异常会中断当前调用。类型声明帮助编辑器和检查器发现错误，但 `TypedDict` 本身不是运行时校验器。面对外部告警时，还需要在入口检查字段类型、长度、租户身份和必填信息，不能因为写了类型注解就信任输入。

本课按公开图接口和中断接口讲解，建议在独立 Python 三点十一或三点十二虚拟环境安装后记录精确依赖版本，再做实验。前面的升级安装命令用于新课堂环境，不应在已有生产虚拟环境中盲目运行。保存器通常来自独立集成包，其安装、数据库迁移和运行权限要另查对应说明。

把一次事故的状态想成有版本的工作记录，比把它叫作“共享内存”更准确。节点获得本步骤可见的状态，返回更新；运行时依据每个字段的归并规则形成下一步骤可见的状态。不要依赖某个节点原地修改列表后，另一个并行节点立刻看到这个改动。

并行步骤尤其需要这个区分。两个取证节点可以在同一轮分别查指标和日志，但它们不应相互等待对方正在修改的字典。下一轮汇总时，才依据明确的合并规则整合结果。如果两个节点都写一个默认覆盖字段，可能触发并发更新错误，而不是框架替你猜哪一份正确。

Reducer 在本领域是状态归并函数，不是分布式批处理里的归约执行进程。它规定旧值和本轮更新怎样形成新值。证据集合适合按稳定证据编号去重合并；计数器的累加适合可加的增量；最终审批结论通常不适合任意节点追加或覆盖。字段语义决定算法，不能所有列表都套简单拼接。

观察问题时先看原始节点更新，再看归并后的状态。日志节点没有返回证据，属于取证问题；返回了却被另一节点覆盖，属于状态契约问题；证据存在但条件边看错字段，则属于路由问题。三个故障可能都表现为“模型没看到日志”，但修复位置完全不同。

## 把暂停和恢复变成能自己验证的实验

前面的基础分诊脚本只是输出“需要审批”这个字符串，没有真正暂停，也没有等待任何人。下面独立实验补上实际的中断接口。前提是已在课堂虚拟环境安装 LangGraph；不安装模型接入包，不设置 API 密钥，不连接数据库和真实运维接口。

保存为 `interrupt_lesson.py`，运行 `python interrupt_lesson.py`。先预测：批准节点恢复时，其顶部的计数器会不会再次加一？被拒绝的流程能不能到达模拟动作？代码特意只让动作返回文本，避免把课堂批准误当成生产授权。

```python
from typing import TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.types import Command, interrupt

class ReviewState(TypedDict):
    target: str
    approved: bool
    outcome: str

visits = []

def review(state: ReviewState):
    visits.append(state["target"])  # 故意展示恢复时节点前半段重跑
    approved = interrupt({"target": state["target"], "operation": "mock-check"})
    if type(approved) is not bool:
        raise ValueError("课堂恢复值必须是布尔值")
    return {"approved": approved}

def mock_action(state: ReviewState):
    return {"outcome": "mocked:" + state["target"]}

def rejected(state: ReviewState):
    return {"outcome": "rejected"}

builder = StateGraph(ReviewState)
builder.add_node("review", review)
builder.add_node("mock_action", mock_action)
builder.add_node("rejected", rejected)
builder.add_edge(START, "review")
builder.add_conditional_edges(
    "review", lambda state: "yes" if state["approved"] else "no",
    {"yes": "mock_action", "no": "rejected"},
)
builder.add_edge("mock_action", END)
builder.add_edge("rejected", END)
app = builder.compile(checkpointer=InMemorySaver())

for thread, decision, expected in [
    ("lesson-approve", True, "mocked:lab-service"),
    ("lesson-deny", False, "rejected"),
]:
    config = {"configurable": {"thread_id": thread}}
    paused = app.invoke(
        {"target": "lab-service", "approved": False, "outcome": ""}, config
    )
    assert paused.get("__interrupt__")
    assert app.get_state(config).next == ("review",)
    result = app.invoke(Command(resume=decision), config)
    assert result["outcome"] == expected
    assert app.get_state(config).next == ()
    print(thread, result["outcome"])

assert len(visits) == 4
print("review visits:", len(visits))
```

预期前两行分别是批准后的模拟结果和拒绝，最后是审批节点访问四次。两个流程各首次执行一次、恢复时又从节点开头执行一次。这个观察直接说明：中断恢复不是把 Python 解释器停在某一行，再让它继续下一行；中断前的代码必须能够面对重跑。

`Command` 是恢复运行所携带的控制消息，`resume` 是交还给中断调用的输入。它不等于向服务端提交一份可信审批凭证。本实验将布尔值直接传入，是为了观察运行时机制；真实服务应先认证审批者、验证签名或可信审批记录，再决定允许提交哪个恢复值。

`get_state` 读取这个线程当前检查点快照，`next` 是待执行节点列表；它让你在恢复前后观察位置。`InMemorySaver` 表示内存保存器，这里同一个进程中的两次调用能找到同一状态；退出脚本再启动，并不会自动恢复上一次进程。请把这一边界写进实验报告。

若看不到中断，检查是否真的调用了带保存器编译的图，是否使用相同线程配置，以及是否错误捕获了中断用于通知运行时的特殊异常。不要在整个节点外层放一个什么都吞的异常捕获，然后返回“已完成”；它可能把暂停变成错误的正常结束。

若批准后走到拒绝路径，核对传的是布尔值而非字符串。字符串内容即使是“假”，也可能被简单真假判断当成真，因此代码用精确类型校验。若访问次数不同，检查是否增加了重试、重复启动或改动中断顺序；不要把额外的真实重跑隐去。

清理时退出脚本即可释放这两条内存线程，没有后台服务或持久数据库；只删除自己创建的课堂脚本或保留脱敏证据，不执行数据库整库清空。前面的基础实验也同样可以退出后清理新课堂文件，虚拟环境是否保留由你决定，不要删共享 Python 安装目录。

## 审批不能只绑定一个“同意”按钮

假设人看到的是“检查测试服务”，等待十分钟后，图里的目标被修改成生产服务。旧批准即使仍为真，也不应授权新动作。审批至少绑定流程身份、操作者、工具名、资源标识、参数摘要、环境、风险等级与有效期限；执行前重新比较这些字段，不只检查有没有经过审批节点。

对于长时间等待的事故，还应核对证据新鲜度。批准时错误率已经恢复，原先建议的回滚可能反而造成第二次故障。恢复运行时重新取证并评估动作前置条件，可以把过期批准转为需要重新确认。批准不能自动消除“目标已经变化”这个事实。

检查点存储也不是权限系统。知道 `thread_id` 的调用方，不应因此能够读取或继续别人的事故。服务端需要建立租户、用户、角色和线程的授权关系，所有读取、恢复、修改状态、导出轨迹的入口都检查它。随机线程编号可以降低猜中概率，却不能替代访问控制。

外部动作应经过独立执行网关，只接受允许的动作和结构化参数。模型生成的工具名、日志中夹带的指令、检索文档里出现的命令都属于数据，不应成为绕过网关的授权。最危险的设计是把任意字符串直接交给带生产凭证的命令执行器。

幂等记录还要区分“已接受、进行中、成功、失败、结果未知”。执行接口超时但目标系统可能已完成时，恢复节点先查询稳定操作编号，不应直接重发。把所有异常都改成失败再重试，会把未知结果误当作安全重试机会；这种事故不是多加一个检查点就能解决。

## 生产设计：持久状态、运行配额与版本一起管理

高可用图服务可以有多个执行实例，但检查点共享不等于已经解决任务重复领取。需要明确同一线程并发运行的策略、队列可见性、租约与失效后的接管，以及外部执行端的幂等性。旧执行者在网络恢复后继续写入时，不能与新执行者同时对同一资源生效。

保存器不可用时，安全策略通常应阻止新的危险动作继续推进，保留可重试的任务和明确错误；不能静默切回内存保存器假装服务正常。否则进程重启以后失去审批与执行记录，恢复时无法判断动作是否已经发生。具体失败策略要按只读取证与外部变更分别设计。

容量从活跃流程数、每步状态大小、每流程步骤数和保留时间估算。假设每天一万次流程，每次二十份平均五十千字节的完整状态，粗略就是每天十吉字节的状态写入量，三十天三百吉字节。保存器可能使用不同写入结构，这只是容量推导练习，必须用实际存储统计校准。

状态不应塞入所有原始日志。保存脱敏证据摘要、内容哈希、来源位置和查询时间窗口，把大对象放到有权限和生命周期控制的存储中。否则每轮复制大量日志不仅耗空间，还增加模型输入成本、恢复时间和泄露面。摘要变小之后仍须保留可追溯证据，不能只留模型结论。

并行取证也要设预算。十个节点各查十分钟全量日志，遇到一百条同时告警就可能产生千次重查询。应按租户和工具限制并发，给请求设置期限，并在状态中明确超时、空结果和查询成功的区别。返回空列表不该同时表示“没有异常”和“接口调用失败”。

观测时把业务时间与执行时间分开。等待审批两小时不是模型推理两小时；排队一分钟不是工具执行一分钟。分别记录队列等待、节点执行、重试退避、人工等待、恢复耗时、检查点失败和最终结果，才知道应该扩容、优化查询还是调整值班流程。

图的升级需要关照暂停中的老流程。节点改名会影响下一步定位，字段重命名会影响读取，归并函数改变可能让重放结果不同，中断次序改变会影响恢复值对应关系。不能只用一个从起点跑通的新输入，就宣布所有存量线程兼容。

安全升级路线是固定图版本与状态版本，先验证老形状检查点在新版本下如何恢复，必要时保留旧版本执行器处理存量线程。对不可兼容的流程进行明确迁移或人工终止并重建，而不是直接修改数据库让它越过失败节点。回退同样要测试旧版本能否理解新写入状态。

## 递进面试：从三十秒定义到事故设计

三十秒答案：LangGraph 把多步骤流程表示为状态、节点和边，支持分支、检查点以及人工中断恢复。我把它用于 AIOps 取证和建议编排，不把它当作授权系统或外部事务管理器。可靠自动化还依赖可信审批、持久幂等、资源限制和执行后验证。

三分钟答案第一段讲输入和状态：告警入口验证租户和字段，生成稳定流程身份；指标、日志和变更节点返回结构化证据，按明确归并规则形成状态。证据不足走补查或人工路径，而不是要求模型强行猜根因。状态保留来源与时间窗口，让结论可追溯。

第二段讲暂停恢复：保存器保存执行边界，中断把拟执行动作交给人。恢复使用同一线程，但节点前半段可能重跑，所以读操作要可重复，外部写入要有稳定操作编号并查询已有结果。批准必须绑定动作参数，目标变化或证据过期时重新核验。

第三段讲生产能力：多实例需要可靠检查点和同线程并发控制；工具调用有超时、并发、成本和循环步数限制；升级验证老线程恢复，失败时保留旧执行器。最终用取证完整率、建议被采纳率、错误动作阻断率与业务恢复结果评价系统，不只看模型输出流畅不流畅。

追问“加保存器就持久执行了吗”，回答要拆成保存器存储是否可靠、当前执行持久性设置、节点重放边界以及外部副作用。再追问“审批接口可以直接传线程编号和真吗”，应指出租户授权、审批身份和动作摘要缺失，布尔值只是运行时输入，不是安全证明。

事故题是恢复后重复创建两张工单。先比对图运行编号、线程身份、节点重试、操作编号和工单接口日志，确定是重复入口还是恢复重跑。修复先停止相关写入或转只读，核对已创建结果，再补持久幂等；不能批量删除所有疑似重复工单而不核对人工修改和关联流程。

机制细节请对照 [官方中断规则](https://docs.langchain.com/oss/python/langgraph/interrupts) 与 [持久化说明](https://docs.langchain.com/oss/python/langgraph/persistence)。本课实际中断代码是可运行课堂步骤；是否在你的依赖版本运行成功，需要保留本机结果，不能用静态阅读代替运行证据。

## 本课 GitHub 学习证据

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

`README.md` 建议记录：

- 为什么选择 LangGraph。
- 你的 graph 流程图。
- 每个 state 字段的含义。
- 运行命令。
- 运行输出截图。
- 你遇到的错误和修复过程。
- 下一步如何接入 Prometheus、Loki、runbook 和人工审批。

这份证据能证明你不是只会说“AI Agent”，而是真的能把 AIOps 排障流程拆成可运行、可恢复、可审计的工程结构。
