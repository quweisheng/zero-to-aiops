# Ollama 技术栈深讲

> 学习目标：从零理解 Ollama、模型与推理服务的边界，能在 Windows 或 Linux 上完成第一个本地模型实验，读懂模型拉取、加载、推理和卸载路径，使用 REST API 接入 AIOps，并能分析显存、并发、安全、升级与生产故障。

## 核验日期、版本与学习边界

本文在 **2026-08-07** 核验官方资料。

- Ollama 当前最新稳定版是 [`v0.32.6`](https://github.com/ollama/ollama/releases/tag/v0.32.6)，发布时间为 2026-08-04。
- Ollama 程序采用 [MIT License](https://github.com/ollama/ollama/blob/main/LICENSE)。这只说明 Ollama 程序本身的许可，不代表所有模型都采用 MIT。
- 模型权重、训练数据、输出用途和商用限制由各模型自己的许可证决定。上线前必须在模型页面或 `ollama show` 结果中单独核验。
- `v0.32.6` 调整了 OpenAI 兼容接口的流式响应格式，并暂时移除了实验性图像生成功能。升级不能只看版本号，还要回归调用方对流式 chunk（分块）的解析。
- Ollama 的版本更新很快，官方文档主线也可能先于读者本机版本变化。本文涉及版本的结论都以核验日期为快照，实际操作前先执行 `ollama --version`。

### 本轮验证边界

当前写作环境中没有安装 Ollama，Docker 客户端存在但 Docker Engine 未启动。因此：

- 本文的 PowerShell、REST API、Modelfile 和故障注入步骤按官方接口整理，可由读者复现；
- 本轮没有声称已在本机下载 `gemma3:270m`、完成真实推理或验证 GPU 加速；
- 文章中的“预期结果”用于告诉读者成功时应该观察什么，不是假装本轮已经获得该结果；
- 仓库构建、链接、代码块、JSON、移动端页面和线上搜索会在发布前真实验证。

## 官方资料

### 总入口与版本

- [Ollama 官方文档](https://docs.ollama.com/)
- [Quickstart](https://docs.ollama.com/quickstart)
- [Ollama 官方 GitHub 仓库](https://github.com/ollama/ollama)
- [`v0.32.6` Release](https://github.com/ollama/ollama/releases/tag/v0.32.6)
- [`v0.32.6` 固定源码提交](https://github.com/ollama/ollama/tree/c82ebbd5bfb9ec7d94d3894e9023db0fb224ff50)
- [`v0.32.6` 请求路由源码](https://github.com/ollama/ollama/blob/c82ebbd5bfb9ec7d94d3894e9023db0fb224ff50/server/routes.go)
- [`v0.32.6` 调度器源码](https://github.com/ollama/ollama/blob/c82ebbd5bfb9ec7d94d3894e9023db0fb224ff50/server/sched.go)
- [`v0.32.6` 环境配置源码](https://github.com/ollama/ollama/blob/c82ebbd5bfb9ec7d94d3894e9023db0fb224ff50/envconfig/config.go)
- [MIT License](https://github.com/ollama/ollama/blob/main/LICENSE)

### 安装、硬件与排障

- [Windows 安装与路径](https://docs.ollama.com/windows)
- [Linux 安装与 systemd](https://docs.ollama.com/linux)
- [Docker 部署](https://docs.ollama.com/docker)
- [GPU 与硬件支持](https://docs.ollama.com/gpu)
- [上下文长度](https://docs.ollama.com/context-length)
- [FAQ 与服务环境变量](https://docs.ollama.com/faq)
- [Troubleshooting](https://docs.ollama.com/troubleshooting)

### 模型与接口

- [CLI Reference](https://docs.ollama.com/cli)
- [Modelfile Reference](https://docs.ollama.com/modelfile)
- [导入模型](https://docs.ollama.com/import)
- [REST API Introduction](https://docs.ollama.com/api/introduction)
- [Chat API](https://docs.ollama.com/api/chat)
- [Generate API](https://docs.ollama.com/api/generate)
- [Embed API](https://docs.ollama.com/api/embed)
- [API 错误语义](https://docs.ollama.com/api/errors)
- [OpenAI API 兼容层](https://docs.ollama.com/api/openai-compatibility)

### 能力与安全边界

- [Streaming](https://docs.ollama.com/capabilities/streaming)
- [Structured Outputs](https://docs.ollama.com/capabilities/structured-outputs)
- [Tool Calling](https://docs.ollama.com/capabilities/tool-calling)
- [Embeddings](https://docs.ollama.com/capabilities/embeddings)
- [Authentication](https://docs.ollama.com/api/authentication)
- [Cloud 与 Local-only 模式](https://docs.ollama.com/cloud)

说明：本文重新组织官方资料用于中文 AIOps 学习，不复制或逐段翻译官方正文。

## 官方知识地图

Ollama 官方资料可以拆成六层：

```text
安装与平台
  -> Windows / macOS / Linux / Docker / GPU

模型生命周期
  -> pull / list / show / create / copy / rm
  -> manifest / blob / tag / digest / Modelfile

推理能力
  -> generate / chat / streaming / thinking
  -> structured output / tool calling / vision / embedding

服务运行
  -> HTTP Server / Scheduler / Runner
  -> load / queue / parallel / keep_alive / unload

生产治理
  -> context / RAM / VRAM / disk / latency
  -> bind address / authentication / proxy / cloud boundary

运维闭环
  -> version / logs / ps / duration fields / errors
  -> capacity / rollout / rollback / incident response
```

本文按下面的顺序学习：

1. 先分清 Ollama、模型、客户端和 AI 应用。
2. 再理解模型文件、标签、Modelfile 与拉取路径。
3. 再跟踪一次 Chat 请求如何进入调度器、加载 Runner 并流式返回。
4. 再学习上下文、KV Cache、量化、显存与并发。
5. 然后用 Windows + REST API 跑一个结构化告警分类实验。
6. 最后处理模型不存在故障、生产容量、安全、升级、事故和面试追问。

## 建议学习路线

### 第一天：会安装、会拉取、会调用

- 能解释 Ollama 不是模型本身。
- 能运行 `ollama --version`、`ollama pull`、`ollama list`、`ollama run` 和 `ollama ps`。
- 能调用 `/api/chat` 并分清流式与非流式响应。
- 能确认模型到底运行在 CPU、GPU，还是 CPU/GPU 混合状态。

### 第一周：懂模型和请求路径

- 能解释 tag、digest、manifest、blob 和 Modelfile。
- 能画出 Pull、Chat、Embedding 三条数据路径。
- 能解释 Prefill、Decode、KV Cache、`num_ctx` 和 `keep_alive`。
- 能从日志、HTTP 状态、`ollama ps` 和响应时长字段定位问题。

### 生产与面试层：能做取舍和事故收敛

- 能按模型文件、KV Cache、上下文与并发估算 RAM/VRAM。
- 能说明 Ollama 单实例的状态和高可用边界。
- 能为共享服务增加 TLS、身份认证、配额、审计和工具审批。
- 能设计模型版本灰度、API 兼容回归、回滚与证据保留。
- 能说明什么时候选 Ollama，什么时候应该选择面向大规模推理的服务框架或云 API。

## 场景开场：告警摘要助手为什么凌晨突然慢了

团队把一个告警摘要助手接到了本地 Ollama：白天测试很顺，敏感日志也不用发送到外部 API。

凌晨发生故障后，监控系统同时送来几十条告警。第一个请求等了很久，后续请求继续排队，有些调用方开始超时重试。值班同学只知道“模型很慢”，却回答不了下面的问题：

- 模型文件已经下载，为什么第一次请求仍然很慢？
- `ollama list` 能看到模型，为什么 `ollama ps` 看不到？
- 8 GiB 显存能下载 20 GiB 模型，是否就代表能用 GPU 跑？
- 上下文从 4K 调到 64K，为什么显存突然不够？
- 增加并发为什么吞吐没上去，反而让所有请求一起变慢？
- 服务只是一条 HTTP API，为什么直接监听 `0.0.0.0` 会成为严重安全问题？

这些问题说明：会执行 `ollama run` 只是起点。AIOps 工程师还需要理解模型制品、调度、内存状态、请求背压和安全边界。

## 一句话人话版

**Ollama 是把模型拉到本机、加载进 CPU/GPU 内存，并通过命令行或 HTTP API 提供推理能力的模型运行与管理服务。**

## 小白最容易问的十二个问题

### Ollama 是大模型吗

不是。Ollama 是运行和管理模型的软件；`gemma3`、`qwen3` 等才是模型。可以把 Ollama 理解成“模型运行时加本地服务”，把模型理解成“要被加载和执行的权重与配置”。

### Ollama 是训练框架吗

它的主线是模型获取、导入、定制配置和推理，不是 TensorFlow 或 PyTorch 那样的通用训练框架。`Modelfile` 也不等于重新训练权重。

### 开源模型就一定能在我的电脑上运行吗

不能。开放权重只回答“能否获得权重”，不回答“机器是否放得下”。要同时检查模型文件大小、量化、RAM、VRAM、上下文、并发和磁盘空间。

### Ollama 使用 MIT，模型也都能商用吗

不能这样推断。Ollama 程序的 MIT 许可和模型许可证是两份不同合同。每个模型都要单独核验许可、用途、地域和再分发限制。

### `pull`、`run` 和 `serve` 有什么区别

- `pull` 把模型制品下载到本地；
- `run` 确保模型存在、加载模型并进入交互推理；
- `serve` 启动 Ollama HTTP 服务。桌面应用通常已经在后台启动服务，不必重复开第二个实例。

### `list` 和 `ps` 为什么结果不同

`ollama list` 看磁盘上已经安装的模型；`ollama ps` 看当前加载在 RAM/VRAM 中、可继续处理请求的模型。磁盘状态和运行内存状态不是一回事。

### 模型文件只有 4 GiB，为什么 4 GiB 显存仍然不够

运行时不仅需要权重，还需要 KV Cache、计算缓冲区、运行时开销，有时还会保留多条并行上下文。模型文件大小只能当作容量下界之一。

### 上下文窗口越大越好吗

不一定。更大的上下文允许模型看到更多 Token，但会增加 KV Cache、Prefill 延迟和输入成本，也可能让无关日志干扰答案。应按任务证据设定，而不是把滑块拉满。

### 为什么 API 默认一段一段返回 JSON

REST API 默认开启 Streaming（流式返回）。每个 NDJSON 对象是一块增量内容，最后一块才有 `done: true` 和统计信息。若客户端只会解析一个完整 JSON，应显式设置 `"stream": false`。

### Ollama 会保存聊天记录吗

不要把它当成聊天数据库。`/api/chat` 的 `messages` 通常由客户端在下一次请求中重新提交；业务会话、审计和长期记忆应由上层应用管理。

### 本地 API 需要 API Key 吗

官方说明访问 `http://localhost:11434` 的本地 API 不需要认证。正因为如此，默认回环监听很重要；如果暴露到网络，必须在外层补 TLS、认证、授权、限流和审计。

### Ollama 和 Dify、LangChain、vLLM 是同一类工具吗

不是完全同一层。Ollama偏模型运行和本地 API；Dify、LangChain偏 AI 应用与工作流；vLLM 等框架更偏大规模、高吞吐模型服务。它们可以组合，也可能在同一层做选型。

## 为什么 AIOps 工程师要学 Ollama

### 敏感运维数据可以留在受控边界

日志、告警、CMDB、变更记录可能包含主机名、账号、拓扑和业务信息。本地推理能减少数据发送到外部服务的范围，但前提是没有误用 Cloud 模型或 Web Search，并且主机、磁盘和接口本身受控。

### 可以快速验证模型是否适合运维任务

在采购 GPU 集群或云 API 预算前，可以用 Ollama 快速验证告警分类、日志摘要、Runbook 问答、Embedding 和结构化输出的效果。

### 它把模型机制变成可观察的服务问题

`load_duration`、`prompt_eval_count`、`eval_count`、`ollama ps`、日志和 HTTP 错误把“模型感觉慢”拆成冷加载、Prefill、Decode、排队、CPU 回退等可验证假设。

### 它适合做 AIOps 学习环境和小型受控服务

Ollama 安装门槛低、API 清晰、模型管理集中，适合个人实验、内网原型和低到中等负载服务。对于严格多租户、跨节点调度或大吞吐场景，还需要外部平台能力或换用更适合的服务框架。

## Ollama 到底是什么

从不同视角看，Ollama 同时包含几种角色：

| 视角 | 它扮演的角色 | 不应误解成什么 |
|---|---|---|
| 用户 | 本地模型命令行和桌面应用 | 模型本身 |
| 应用 | 监听 `11434` 的 HTTP 推理 API | 完整 AI 应用平台 |
| 运维 | 模型下载、存储、加载、卸载和调度服务 | 自带高可用集群的控制面 |
| 模型工程 | Modelfile、GGUF/Safetensors 导入与量化入口 | 通用训练平台 |
| AIOps | 告警、日志、知识与模型之间的推理执行层 | 可以未经审批直接执行生产命令的自动修复系统 |

## 它解决什么问题

### 模型安装方式碎片化

不同模型可能需要不同运行库、模板和参数。Ollama 把常用模型打包成可以通过名称和标签拉取的制品。

### 本地推理接入成本高

上层系统不必直接处理底层推理引擎细节，可以通过 CLI、原生 REST API或部分 OpenAI 兼容 API 调用。

### 模型的磁盘态和运行态难管理

Ollama 提供 `list`、`show`、`ps`、`stop`、`rm` 等操作，让磁盘模型、加载模型和到期时间可观察。

### 模型定制缺少可复现入口

Modelfile 能声明基础模型、系统提示、模板、参数和适配器，使同一套运行行为可以保存到 Git。

### 小型本地 AI 应用缺少统一服务

告警助手、RAG、代码工具和自动化工作流可以共享一套 HTTP 模型接口，而不是每个应用单独嵌入底层推理库。

## 核心概念一：Ollama Client、Server 与模型

### 是什么

- Client（客户端）包括 `ollama` CLI、桌面应用、curl、Python SDK、JavaScript SDK或第三方应用。
- Server（服务端）监听 HTTP 请求，管理模型、调度 Runner 并返回推理结果。
- Model（模型）包含权重、配置、模板、参数、许可证等制品。

### 为什么需要

把调用方和模型运行解耦后，多个应用可以使用同一个接口，模型加载与 GPU 管理也不必散落在每个业务进程中。

### 怎么工作

```text
CLI / AIOps App / SDK
  -> HTTP Request
  -> Ollama Server :11434
  -> Scheduler
  -> Runner + Model
  -> CPU / GPU inference
  -> streamed chunks or one JSON response
```

Scheduler 是调度器，负责为请求寻找或加载合适的 Runner。Runner 是实际调用模型后端完成推理的运行进程或执行单元。

### 怎么用或观察

```powershell
ollama --version # 看客户端和本机 Ollama 版本
Invoke-RestMethod http://localhost:11434/api/version # 看当前 HTTP 服务版本
```

两个版本证据都要保留：PATH 中可能残留旧 CLI，也可能连到了另一台 Ollama Server。

### 坏了怎么查

1. `Get-Command ollama` 确认实际执行文件。
2. `Get-NetTCPConnection -LocalPort 11434` 确认端口监听。
3. 调用 `/api/version` 区分“CLI 存在”和“Server 可用”。
4. 查看 Windows `server.log`、Linux `journalctl -u ollama` 或容器日志。

## 核心概念二：Model Reference、Tag、Digest、Manifest 与 Blob

### 是什么

- Model Reference（模型引用）通常写成 `name:tag`，例如 `gemma3:270m`。
- Tag（标签）是便于人记忆的版本入口；省略时通常使用 `latest`。
- Digest（摘要）是内容的哈希标识，用于识别实际制品内容。
- Manifest（清单）描述一个模型由哪些层和元数据组成。
- Blob（二进制大对象）保存权重、模板、参数、许可证等按内容寻址的数据。

这是根据 `v0.32.6` 固定源码和官方 Create/Modelfile 接口整理的结构视图，不是承诺内部磁盘布局永远不变。日常管理应使用 CLI 或 API，不直接改 Manifest/Blob 文件。

### 为什么需要

一个模型不只是单个权重文件。清单把多个内容层组合成可拉取、可复用、可检查的模型制品；摘要让运维人员能记录“实际用了哪份内容”。

### 怎么工作

```text
gemma3:270m
  -> resolve registry + repository + tag
  -> fetch manifest
  -> compare local blob digests
  -> download missing blobs
  -> verify content
  -> write local manifest
  -> model appears in ollama list
```

多个模型可能复用相同 Blob，因此不要绕过 Ollama 直接删除 `blobs` 目录。手工删除可能破坏其他模型引用。

### 怎么用或观察

```powershell
ollama pull gemma3:270m # 拉取明确标签，实验快照中约 292 MB
ollama list # 查看 NAME、ID、SIZE 和更新时间
ollama show gemma3:270m # 查看模型详情、能力、参数和许可证信息
```

记录 `name:tag` 还不够，发布证据中还应保存 `ollama list` 或 `/api/tags` 返回的 digest。

### 坏了怎么查

- `manifest unknown`：模型名或 tag 不存在，先在官方模型库核对。
- 拉取中断：检查代理、DNS、磁盘剩余空间和服务日志，再重新 `pull`。
- 已下载但 `list` 不显示：确认 `OLLAMA_MODELS` 和启动 Ollama 的用户是否一致。
- 磁盘异常增长：先用 `ollama list` 盘点，再用 `ollama rm <model>` 管理，不直接批量删除 Blob。

## 核心概念三：Modelfile

### 是什么

Modelfile 是 Ollama 的模型构建说明文件，可以声明基础模型、运行参数、系统消息、提示模板、许可证、消息示例和 Adapter（适配器）。

### 为什么需要

如果系统提示、温度和上下文只写在某个人的命令历史中，就无法审计和复现。Modelfile 可以把这些运行约定版本化。

### 怎么工作

```text
Modelfile
  -> FROM chooses base model or local weights
  -> PARAMETER defines runtime defaults
  -> SYSTEM / TEMPLATE defines prompt behavior
  -> ADAPTER optionally attaches an adapter
  -> ollama create builds a new local model reference
```

`ollama create` 主要是在组合现有权重与配置。它不等于重新训练基础模型，也不会自动提升知识准确率。

### 怎么用或观察

```dockerfile
FROM gemma3:270m
PARAMETER temperature 0
PARAMETER num_ctx 4096
SYSTEM 你是 AIOps 告警分类助手。只根据输入证据回答，不编造不存在的主机、指标或根因。
```

保存为 `Modelfile` 后：

```powershell
ollama create aiops-triage:v1 -f .\Modelfile # 创建可复现的本地模型引用
ollama show --modelfile aiops-triage:v1 # 反查生效后的 Modelfile
```

### 坏了怎么查

- `FROM` 找不到：先 `ollama list`，再核对名称和标签。
- 参数不生效：用 `ollama show --modelfile` 查看最终定义，并检查 API 的 `options` 是否覆盖默认值。
- 输出格式仍漂移：结构化输出要用 `format` / JSON Schema，不能只靠 SYSTEM 里一句“请返回 JSON”。
- 模型行为变了：比对基础模型 digest、Modelfile 提交和 Ollama 版本。

## 核心概念四：Generate、Chat 与会话状态

### 是什么

- `/api/generate` 面向单个 prompt（提示）生成文本。
- `/api/chat` 面向 `messages` 数组，消息角色包括 system、user、assistant 和 tool。
- 两者都是推理入口，不是持久化会话数据库。

### 为什么需要

一次性文本补全和多轮对话的数据合同不同。把它们区分开，才能正确管理上下文、审计和重试。

### 怎么工作

Chat 请求会把消息列表交给模型模板，转换成 Token 后执行 Prefill 和 Decode。下一轮对话通常要由客户端再次发送需要保留的历史消息。

```text
client conversation store
  -> messages[]
  -> /api/chat
  -> prompt template
  -> tokenize
  -> prefill + decode
  -> assistant message
  -> client appends response to its own history
```

### 怎么用或观察

```powershell
$body = @{
  model = 'gemma3:270m'
  messages = @(
    @{ role = 'system'; content = '你是 AIOps 助手，只总结输入证据。' }
    @{ role = 'user'; content = 'order-api 的 5xx 在 10 分钟内从 1% 升到 18%。' }
  )
  stream = $false
} | ConvertTo-Json -Depth 6

Invoke-RestMethod `
  -Uri 'http://localhost:11434/api/chat' `
  -Method Post `
  -ContentType 'application/json' `
  -Body $body
```

### 坏了怎么查

- 模型“忘记上一轮”：检查客户端是否重新提交历史消息。
- 历史越聊越慢：统计 Token，裁剪或总结旧消息，不要无限追加。
- 角色错乱：检查 `role`、消息顺序和模型模板。
- 重试导致工具重复执行：推理重试和生产动作必须分层，工具执行层要有幂等键和审批。

## 核心概念五：Streaming、NDJSON 与完成状态

### 是什么

Streaming 是边生成边返回。Ollama 原生 REST API 默认流式输出，多块响应使用 NDJSON（Newline Delimited JSON，每行一个 JSON 对象）。

### 为什么需要

模型完整回答可能要几秒甚至几分钟。流式输出能降低用户看到首字的等待时间，也便于取消长请求。

### 怎么工作

```text
HTTP response starts
  -> chunk 1: partial content, done=false
  -> chunk 2: partial content, done=false
  -> ...
  -> final chunk: done=true + duration/token statistics
```

若中途出错，HTTP 响应可能已经是 200，错误会作为后续 NDJSON 对象的 `error` 字段出现。因此客户端不能只检查最初状态码。

### 怎么用或观察

- 想逐字展示：保留 `stream: true`，逐行解析并累积 content、thinking 和 tool_calls。
- 想让 PowerShell 初学实验更简单：设置 `stream: false`，一次读取完整 JSON。
- 流结束时：必须确认 `done: true`，再读取统计字段。

### 坏了怎么查

- 客户端报“多个 JSON 粘在一起”：它把 NDJSON 当作单个 JSON；关闭流或逐行解析。
- 页面只显示最后一小块：客户端没有累积增量 content。
- 工具调用缺参数：流式 tool_calls 可能分块到达，要按官方 SDK模式累积完整结构。
- 状态码 200 但回答中断：继续检查流中的 `error` 对象和服务日志。

## 核心概念六：Scheduler、Runner、Load、Keep Alive 与 Unload

### 是什么

- Scheduler（调度器）决定请求使用哪个已加载模型，或何时加载、排队和卸载模型。
- Runner（运行器）承接真正的模型推理。
- Load 是把权重和运行所需状态放入 RAM/VRAM。
- `keep_alive` 控制请求完成后模型继续留在内存多久。
- Unload 是释放运行内存；不会删除磁盘上的模型。

### 为什么需要

模型可能占用数 GiB 到数百 GiB 内存，不能像普通小配置文件一样每次请求都瞬间打开。复用已加载模型能降低冷启动延迟，但会持续占用资源。

### 怎么工作

```text
request arrives
  -> validate model reference and capabilities
  -> look for compatible loaded runner
  -> enough memory?
       -> yes: reuse or load runner
       -> no: queue, wait for idle model to unload, or reject
  -> execute inference
  -> keep runner until keep_alive expires
  -> unload and free RAM / VRAM
```

默认保留时间在官方 FAQ 中为 5 分钟。单次 API 请求中的 `keep_alive` 会覆盖服务级 `OLLAMA_KEEP_ALIVE`。

### 怎么用或观察

```powershell
ollama ps # 看当前加载模型、占用、PROCESSOR、上下文和到期时间
ollama stop gemma3:270m # 让指定模型卸载，释放运行内存
```

API 预热：

```powershell
$preload = @{ model = 'gemma3:270m'; keep_alive = -1 } | ConvertTo-Json
Invoke-RestMethod -Uri 'http://localhost:11434/api/generate' -Method Post -ContentType 'application/json' -Body $preload
```

API 立即卸载：

```powershell
$unload = @{ model = 'gemma3:270m'; keep_alive = 0 } | ConvertTo-Json
Invoke-RestMethod -Uri 'http://localhost:11434/api/generate' -Method Post -ContentType 'application/json' -Body $unload
```

### 坏了怎么查

- 首次请求慢、后续快：比较 `load_duration`，通常是冷加载，不要先猜模型退化。
- `ps` 一直为空：请求可能未成功完成加载，或 `keep_alive: 0` 立即卸载。
- GPU 显存长期不释放：检查 `keep_alive`、是否还有请求，以及 `ollama ps` 的 `UNTIL`。
- 切换模型卡很久：检查当前已加载模型是否占满内存、队列是否等待卸载。

## 核心概念七：Token、Context、Prefill、Decode 与 KV Cache

### 是什么

- Token 是模型处理文本的离散编号，不一定等于一个汉字或一个英文单词。
- Context（上下文）是一次推理可以看到的 Token 范围。
- Prefill 是先处理输入 Token，建立当前上下文状态。
- Decode 是逐步生成输出 Token。
- KV Cache 保存已处理 Token 的注意力 Key/Value，避免每生成一个新 Token 都重算全部历史。

### 为什么需要

没有这些概念，就会把“长输入慢”“输出慢”“模型加载慢”和“排队慢”混为同一种延迟，也无法解释上下文为什么吃显存。

### 怎么工作

```text
messages / prompt
  -> tokenizer
  -> input tokens
  -> prefill builds KV Cache
  -> decode next token
  -> append its K/V to cache
  -> repeat until stop condition
```

### 怎么用或观察

最终响应常见字段：

| 字段 | 人话解释 | 怎么形成判断 |
|---|---|---|
| `prompt_eval_count` | 输入处理了多少 Token | 输入是否异常膨胀 |
| `prompt_eval_duration` | Prefill 花了多久 | 计算输入 Token/s |
| `eval_count` | 生成了多少 Token | 回答长度是否异常 |
| `eval_duration` | Decode 花了多久 | 计算输出 Token/s |
| `load_duration` | 加载模型花了多久 | 识别冷启动 |
| `total_duration` | 服务端总耗时 | 和客户端端到端耗时对比 |

近似吞吐计算：

```text
Prompt tokens/s = prompt_eval_count / (prompt_eval_duration / 1e9)
Output tokens/s = eval_count / (eval_duration / 1e9)
```

Duration 使用纳秒，`1e9` 代表 10 亿纳秒等于 1 秒。

### 关于默认上下文的文档差异

核验日期时，官方 FAQ 仍用 `4096` 说明默认上下文；较新的[上下文长度专页](https://docs.ollama.com/context-length)则给出按 VRAM 分层的自动默认值：

| VRAM | 专页给出的默认上下文 |
|---|---:|
| 少于 24 GiB | 4K |
| 24–48 GiB | 32K |
| 大于等于 48 GiB | 256K |

`v0.32.6` 固定版本的 `envconfig` 源码也把未显式设置表示为自动值，并在帮助文本中给出同一组 4K/32K/256K 分层。生产环境不要依靠“我记得默认是几”：应显式配置目标 `num_ctx`，并用 `ollama ps` 或 `/api/ps` 的 `context_length` 验证实际分配值。

### 坏了怎么查

- 长日志被截断：检查模型最大上下文、服务默认、Modelfile `num_ctx` 和 API `options.num_ctx`。
- 显存突然上升：检查上下文、并行数、KV Cache 类型和同时加载模型数。
- 首 Token 很慢：分开看 `load_duration` 与 `prompt_eval_duration`。
- 输出越来越慢：检查 CPU 回退、热降频、并发竞争和上下文增长。

## 核心概念八：权重量化、KV Cache 量化与 GPU Offload

### 是什么

- Weight Quantization（权重量化）用更少位数表示模型权重，减少磁盘和内存占用。
- KV Cache Quantization（KV Cache 量化）减少上下文缓存占用。
- GPU Offload 表示有多少模型计算层和状态放在 GPU，剩余部分可能在 CPU/RAM。

### 为什么需要

消费级 GPU 的显存有限。量化能让更多模型或更长上下文放得下，但可能牺牲精度或速度；CPU/GPU 混合能让模型勉强运行，却未必满足延迟目标。

### 怎么工作

模型运行内存至少要考虑：

```text
运行内存
  ~= 权重
   + KV Cache
   + 计算缓冲区
   + 运行时与驱动开销
   + 并发请求额外状态
```

权重的粗略理论下界：

```text
权重字节 ~= 参数量 × 每参数位数 / 8
```

但 GGUF 文件还有元数据和混合精度层，运行时还有额外开销，因此优先使用模型页面文件大小与真实 `ollama ps` 观测，不把公式当容量承诺。

KV Cache 的结构性估算：

```text
KV bytes ~= 2 × layers × context tokens × KV heads × head dimension × bytes per value × parallel sequences
```

这里的 `2` 代表 Key 和 Value。使用 GQA/MQA 的模型会减少 KV Head 数，所以不能只按模型总参数量估算 Cache。

### 怎么用或观察

```powershell
nvidia-smi # 看 GPU、驱动、显存和当前进程
ollama ps # 看模型是 100% GPU、100% CPU 还是 CPU/GPU 混合
ollama show gemma3:270m # 看参数量、量化级别和模型信息
```

官方支持的全局 KV Cache 类型包括：

| `OLLAMA_KV_CACHE_TYPE` | 大致内存取舍 | 质量边界 |
|---|---|---|
| `f16` | 基线，内存最高 | 默认精度 |
| `q8_0` | 约为 f16 的一半 | 通常损失很小，但要实测任务 |
| `q4_0` | 约为 f16 的四分之一 | 质量损失可能更明显 |

KV Cache 量化需要 Flash Attention 支持。`OLLAMA_FLASH_ATTENTION=1` 可强制尝试启用，但后端或设备不支持时仍要以日志和实际运行状态为准。

### 坏了怎么查

- 模型意外跑在 CPU：先查驱动和 `nvidia-smi`，再看 Ollama 日志里的 GPU Discovery。
- `CUDA out of memory`：减小模型、上下文、并行数或同时加载模型数，再考虑量化。
- CPU/GPU 混合但很慢：模型虽然“能跑”，却可能跨 PCIe 搬运并受 CPU 限制；重新评估模型大小。
- KV Cache 量化后答案异常：回到 f16 建立基线，再对 q8_0/q4_0 做固定数据集评估。

## 核心概念九：并发、队列与背压

### 是什么

- `OLLAMA_MAX_LOADED_MODELS` 控制最多同时加载多少模型，前提是内存放得下。
- `OLLAMA_NUM_PARALLEL` 控制每个模型并行处理请求的上限。
- `OLLAMA_MAX_QUEUE` 控制调度忙碌时最多排队多少请求；超出后会拒绝。
- Backpressure（背压）表示下游处理不过来时，上游必须等待、降级或被拒绝，而不是无限堆积。

### 为什么需要

模型推理是高成本任务。无限接收请求会把延迟、内存和超时一起放大，最终形成“调用方重试 -> 队列更长 -> 更多超时”的重试风暴。

### 怎么工作

官方 FAQ 描述了两层并发：

1. 内存足够时可以同时加载多个模型。
2. 单个已加载模型在资源允许时可以并行处理多条请求。

如果新模型无法装入内存，请求会等待旧模型空闲并卸载。并行请求会增加上下文内存，不能把并行数当作免费吞吐开关。

```text
incoming requests
  -> admission / queue
  -> choose model
  -> loaded and parallel slot available?
       -> yes: execute
       -> no: wait
  -> queue full?
       -> reject overload
```

### 怎么用或观察

官方 FAQ 在核验日期给出的常见默认值包括：

- `OLLAMA_NUM_PARALLEL=1`；
- `OLLAMA_MAX_QUEUE=512`；
- `OLLAMA_MAX_LOADED_MODELS` 通常为 GPU 数量的 3 倍，CPU 推理通常为 3，但仍受可用内存约束。

这些默认值会随平台和版本变化，生产配置要显式记录并压测。

### 坏了怎么查

- 503 或过载：查队列、到达率、单请求耗时和调用方重试策略。
- 并发调高后 OOM：并行上下文放大了 KV Cache；降低并发或上下文。
- 延迟呈阶梯增长：可能在排队，记录 queue wait 或在网关测量“进入 Ollama 前”的等待。
- 多模型来回切换慢：减少同机模型种类、预热关键模型或按模型拆分节点。

## 核心概念十：Structured Output、Embedding 与 Tool Calling

### 是什么

- Structured Output（结构化输出）用 JSON 或 JSON Schema约束模型返回结构。
- Embedding（向量嵌入）把文本变成数值向量，用于语义检索和 RAG。
- Tool Calling（工具调用）让模型提出结构化的函数调用意图，由上层应用决定是否执行。

### 为什么需要

AIOps 系统需要可验证的字段，而不是只展示一段自然语言。告警路由需要 `severity`，RAG 需要向量，自动化需要明确的工具名和参数。

### 怎么工作

```text
Structured Output
  prompt + JSON Schema -> constrained generation -> validate JSON

Embedding
  text -> embedding model -> normalized vector -> vector database / similarity

Tool Calling
  messages + tool schemas -> model emits tool_calls
  -> application validates + authorizes + executes
  -> tool result appended to messages
  -> model produces final answer
```

模型只是在输出“建议调用哪个工具”。真正执行命令的是上层应用，权限、审批、幂等和审计也必须在上层实现。

### 怎么用或观察

- 告警分类：`format` 传入 JSON Schema，返回后再次做 JSON Schema或类型校验。
- Runbook 检索：对文档与问题使用同一 Embedding 模型。
- 自动修复：只向模型暴露允许的只读工具；高风险动作进入人工审批。

### 坏了怎么查

- JSON 合法但业务值错误：Schema 只约束结构，仍需枚举、范围和业务规则校验。
- 向量检索变差：检查入库与查询是否使用同一模型、维度和归一化方式。
- 工具参数危险：按 allowlist、类型、范围和目标资产二次验证，不信任模型输出。
- 重试重复执行：工具调用使用业务幂等键，把“模型重试”与“动作重试”分开。

## 架构与内部数据流

## 最小本地架构

```text
PowerShell / Browser App / Python
            |
            | HTTP localhost:11434
            v
      Ollama Server
        |       |
        |       +-> model store on disk
        v
     Scheduler
        |
        v
      Runner
        |
        +-> RAM
        +-> GPU VRAM
```

默认回环地址只允许本机访问，适合个人实验。它不是生产认证机制，但能减少意外暴露面。

## 模型 Pull 路径

```text
ollama pull name:tag
  -> resolve registry reference
  -> fetch manifest
  -> compare content digests
  -> download missing blobs
  -> verify and persist blobs
  -> persist local manifest
  -> model appears in /api/tags and ollama list
```

关键状态：

- Registry 保存远端模型制品；
- 本地磁盘保存下载后的 Manifest 与 Blob；
- Pull 完成不代表模型已加载到 RAM/VRAM；
- Tag 是名称入口，Digest 更接近实际内容证据。

## 一次本地 Chat 请求路径

```text
1. Client sends POST /api/chat
2. Server parses model, messages, format, options and keep_alive
3. Server resolves the local model manifest
4. Scheduler reuses a runner or requests a model load
5. Runtime selects CPU/GPU backend and allocates memory
6. Template turns messages into model input
7. Tokenizer produces input tokens
8. Prefill processes input and builds KV Cache
9. Decode generates output tokens
10. Server streams chunks or returns one JSON object
11. Final response contains token and duration statistics
12. Runner remains loaded until keep_alive expires
```

## 一次 Embedding 路径

```text
alert / runbook text
  -> POST /api/embed
  -> embedding-capable model
  -> tokenize + forward pass
  -> L2-normalized vector
  -> application stores vector + metadata
  -> later query vector searches similar incidents
```

Embedding 不是把原文自动保存进 Ollama。原文、向量、权限、版本和删除策略都由上层系统与向量数据库管理。

## Cloud 模型路径

```text
local client
  -> local Ollama API
  -> cloud model reference detected
  -> authenticated request to ollama.com
  -> remote inference
  -> response returns through local API
```

“请求发给 localhost”不一定等于“推理完全留在本机”。使用 Cloud 模型或 Web Search 时会越过本地边界。若环境要求严格本地，可设置 `OLLAMA_NO_CLOUD=1` 或 `~/.ollama/server.json` 中的 `disable_ollama_cloud`，重启后还要从日志验证。

## 状态、一致性与恢复模型

| 状态 | 保存在哪里 | 持久性 | 故障后的含义 |
|---|---|---|---|
| Ollama 程序版本 | 安装目录 | 持久 | 决定 API 和运行行为 |
| 模型 Manifest / Blob | 模型目录 | 持久 | 磁盘损坏或目录错误会导致模型不可用 |
| Tag 到内容的映射 | 本地 Manifest / 远端 Registry | 可变化 | 同名 tag 后续可能指向新内容 |
| Modelfile | Git 与本地模型定义 | 应持久化 | 不保存源文件会失去可复现性 |
| 已加载模型 | RAM / VRAM | 易失 | 进程重启后需要重新加载 |
| KV Cache | RAM / VRAM | 易失 | 请求或 Runner 结束后不能当持久会话恢复 |
| 对话历史 | 上层客户端/数据库 | Ollama 不代管 | 客户端不提交就不会自动记住 |
| 工具执行结果 | 工具系统/业务库 | 由业务决定 | 必须自己做幂等、审计和补偿 |

### 需要记住的四个一致性边界

1. `latest` 是可变标签，不是不可变发布版本。
2. 模型生成是概率计算；同样输入也不应默认字节级一致。
3. 流式请求中断后不能从最后一个 Token 当作事务继续，通常要重新发起并处理重复输出。
4. 模型提出的工具调用和工具真实执行是两个系统，不能假设原子提交。

## Ollama 与相邻技术怎么选

| 方案 | 更适合 | 不优先选择的情况 |
|---|---|---|
| Ollama | 本地学习、桌面集成、内网原型、低到中等负载模型 API | 严格多租户、跨节点调度、大规模吞吐和成熟集群治理 |
| llama.cpp | 需要更直接控制底层 GGUF 推理参数或嵌入式集成 | 希望统一模型拉取、桌面体验和简单 API |
| vLLM 等推理服务 | GPU 服务集群、高吞吐、连续批处理与平台化服务 | 单机小白实验或资源很小的桌面环境 |
| 云模型 API | 不想维护 GPU、需要托管容量和强模型能力 | 数据不能离开边界、网络不可靠或成本不可接受 |
| Dify / LangChain | 构建工作流、RAG、Agent 与业务应用 | 只需要运行模型本身 |

选型不要问“谁最强”，而要问：模型是否支持、硬件是否放得下、延迟与吞吐目标是什么、数据能否出域、是否需要多租户、团队是否能维护 GPU 服务。

## 安装与启动

## 路线一：Windows 原生安装，适合第一次学习

### 前置检查

官方 Windows 文档在核验日期要求 Windows 10 22H2 或更高版本。GPU 支持还取决于显卡型号和驱动：

```powershell
Get-ComputerInfo | Select-Object WindowsProductName, WindowsVersion, OsBuildNumber
nvidia-smi # NVIDIA 用户检查驱动、GPU 型号和显存；没有 NVIDIA GPU 可跳过
Get-PSDrive -Name C # 模型可能占用数百 MB 到数百 GB，先看磁盘空间
```

Windows 页面仍列出较低的 NVIDIA 驱动最低要求，而当前 GPU 支持页对 NVIDIA 列出 Compute Capability 5.0+ 和 531+ 驱动。遇到文档门槛差异时，生产准备采用更严格的当前 GPU 支持页，并以日志中的实际 GPU Discovery 为准。

### 安装

1. 打开 [Ollama Download](https://ollama.com/download)。
2. 下载官方 `OllamaSetup.exe`。
3. 核对下载来源后运行安装程序。
4. 安装完成后关闭并重新打开 PowerShell，让 PATH 刷新。

官方安装程序按用户安装，通常不需要管理员权限。桌面应用会在后台运行，并把本地 API 提供在 `http://localhost:11434`。

### 验证安装与服务

```powershell
Get-Command ollama # 正常应显示 ollama.exe 的实际路径
ollama --version # 正常应显示本机版本
Invoke-RestMethod http://localhost:11434/api/version # 正常应返回 version 字段
```

如果 CLI 存在但 API 失败，说明“程序装好了”和“Server 正在监听”不是一回事。先从开始菜单启动 Ollama，再查日志与端口。

### 拉取小模型

本文基础实验使用官方模型库中的 `gemma3:270m`。核验日期时页面显示其下载大小约 292 MB、模型上下文上限 32K。它用于降低第一次实验的下载和硬件门槛，不代表它的回答质量适合生产根因分析。

```powershell
ollama pull gemma3:270m # 下载明确的小模型标签
ollama list # 正常应看到 gemma3:270m、SIZE 和 ID/digest
ollama show gemma3:270m # 查看模型能力、参数、模板和许可证
```

### 第一次交互

```powershell
ollama run gemma3:270m
```

进入交互后输入：

```text
只根据下面证据写一句摘要：order-api 的 HTTP 5xx 比例从 1% 升到 18%，同一时间刚完成版本发布。
```

回答内容可能变化。实验成功标准不是“必须给出某一句话”，而是：模型能生成响应、进程没有报错，并能通过 `ollama ps` 观察运行位置。

```powershell
ollama ps # 查看 PROCESSOR、CONTEXT 和 UNTIL
```

在交互界面使用 `/bye` 退出。退出聊天不一定立即卸载模型，`UNTIL` 表示预计保留到何时。

## 路线二：Linux 服务安装

官方快速安装命令是：

```bash
curl -fsSL https://ollama.com/install.sh | sh # 从官方地址下载并执行安装脚本
```

生产环境不应盲目执行远程脚本。先下载、审查、固定发布版本，并在测试节点验证，再进入变更窗口。

```bash
sudo systemctl status ollama --no-pager # 确认服务是否 active
curl http://localhost:11434/api/version # 验证 HTTP 服务
journalctl -u ollama --no-pager --follow # 持续查看服务日志
```

通过 systemd 配置环境变量：

```bash
sudo systemctl edit ollama.service
```

示例 override：

```ini
[Service]
Environment="OLLAMA_HOST=127.0.0.1:11434"
Environment="OLLAMA_NO_CLOUD=1"
Environment="OLLAMA_NUM_PARALLEL=1"
Environment="OLLAMA_MAX_QUEUE=64"
```

保存后：

```bash
sudo systemctl daemon-reload # 让 systemd 重新读取单元配置
sudo systemctl restart ollama # 重启服务使环境变量生效
sudo systemctl show ollama --property=Environment # 查看 systemd 记录的环境变量
```

不要把 API Key 直接写进可被普通用户读取的命令历史或配置仓库。

## 路线三：固定版本 Docker Compose

下面的 Compose 固定 Ollama `0.32.6`，只把宿主机 `127.0.0.1:11434` 映射到容器，默认使用 CPU 路径。GPU 容器还需要 NVIDIA Container Toolkit、WSL2 或对应设备映射，先按官方 Docker 文档完成运行时验证。

```yaml
services:
  ollama:
    image: ollama/ollama:0.32.6 # 固定经过验证的服务版本，不使用会漂移的 latest
    container_name: ollama-lab
    ports:
      - "127.0.0.1:11434:11434" # 只让本机访问；不要直接映射到所有网卡
    environment:
      OLLAMA_HOST: "0.0.0.0:11434" # 容器内监听所有接口，宿主机映射仍限制为回环地址
      OLLAMA_NO_CLOUD: "1" # 实验要求本地推理时关闭 Cloud 和 Web Search 能力
      OLLAMA_KEEP_ALIVE: "5m" # 请求后保留模型 5 分钟，兼顾冷启动与内存释放
      OLLAMA_NUM_PARALLEL: "1" # 先用单并发建立容量基线
      OLLAMA_MAX_QUEUE: "64" # 给队列明确上限，避免无限堆积
    volumes:
      - ollama_models:/root/.ollama # 持久化模型与 Ollama 数据
    healthcheck:
      test: ["CMD", "ollama", "list"] # CLI 能连接本容器 Server 才算基础健康
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 30s
    restart: unless-stopped

volumes:
  ollama_models:
```

先做静态解析：

```powershell
docker compose config # 正常应输出合并后的 Compose，不能有字段或缩进错误
```

Docker Engine 可用时再启动：

```powershell
docker compose up -d # 启动 Ollama 服务
docker compose ps # 等待 health 状态正常
docker compose logs --tail 100 ollama # 查看版本、监听地址和硬件发现日志
docker compose exec ollama ollama pull gemma3:270m # 模型不包含在服务镜像中，需要单独拉取
```

清理实验容器时分两级：

```powershell
docker compose down # 删除容器和网络，保留 ollama_models 卷中的模型
```

只有确认不再需要已下载模型时，才执行 `docker compose down -v`。`-v` 会删除命名卷，属于数据删除操作。

### 本文对 Compose 的实际验证

本轮 Docker Engine 未启动，因此没有执行容器、健康检查或模型推理。发布前会把上面的 YAML 原样提取并交给 `docker compose config` 做静态解析；静态成功只能证明 Compose 结构有效，不能证明 GPU、镜像下载或模型推理成功。

## Windows 环境变量怎么生效

桌面应用不是当前 PowerShell 的子进程，只设置 `$env:...` 后继续使用已运行的托盘应用，环境变量通常不会自动进入旧进程。

正确思路：

1. 从任务栏托盘退出正在运行的 Ollama。
2. 在“编辑账户的环境变量”中设置需要的变量，或在同一个 PowerShell 会话中设置后从该会话启动 Ollama 应用。
3. 重新启动 Ollama。
4. 查看日志、API 和行为验证，不要只相信设置页面。

临时调试示例：

```powershell
$env:OLLAMA_DEBUG = '1'
& 'ollama app.exe' # 仅在该可执行文件可从 PATH 找到时使用
```

官方 Troubleshooting 页面给出这一调试方式。调试结束后关闭应用并清理临时环境，避免长期输出过量日志。

## 配置字段字典

| 配置 | 作用 | 常见写法 | 如何验证 | 常见坑 |
|---|---|---|---|---|
| `OLLAMA_HOST` | 设置 Server 监听地址 | `127.0.0.1:11434`、`0.0.0.0:11434` | 查端口和 `/api/version` | `0.0.0.0` 会扩大暴露面，本地 API 又没有内置认证 |
| `OLLAMA_MODELS` | 修改模型存储目录 | `D:\OllamaModels` | `ollama list` 与磁盘目录 | 服务用户没有读写权限，或不同用户指向不同目录 |
| `OLLAMA_CONTEXT_LENGTH` | 设置服务默认上下文 | `4096`、`8192` | `ollama ps` 的 CONTEXT | 上下文放大会增加 KV Cache 与 Prefill 延迟 |
| `OLLAMA_KEEP_ALIVE` | 控制模型保留时长 | `5m`、`0`、`-1` | `ollama ps` 的 UNTIL | 永久保留会长期占用显存；API `keep_alive` 可覆盖 |
| `OLLAMA_MAX_LOADED_MODELS` | 限制同时加载模型数 | `1`、`2` | `/api/ps` 和负载测试 | 配得高不代表内存放得下 |
| `OLLAMA_NUM_PARALLEL` | 单模型并行请求上限 | `1`、`2` | 并发压测与显存曲线 | 并行会放大上下文内存，不是免费吞吐 |
| `OLLAMA_MAX_QUEUE` | 调度队列上限 | `64`、`128` | 过载测试与错误计数 | 队列过大只会把拒绝变成长时间超时 |
| `OLLAMA_ORIGINS` | 增加允许的浏览器跨域 Origin | 明确列出业务 Origin | 浏览器 CORS 测试 | CORS 不是身份认证，`*` 会扩大风险 |
| `OLLAMA_NO_CLOUD` | 禁用 Cloud 与 Web Search | `1` | 重启后检查日志 | 只设置不重启，旧进程仍可能沿用旧配置 |
| `OLLAMA_FLASH_ATTENTION` | 控制 Flash Attention | `1` 或 `0` | 服务日志与内存压测 | 设备/后端未必支持，强制值不是成功证据 |
| `OLLAMA_KV_CACHE_TYPE` | 设置全局 KV Cache 精度 | `f16`、`q8_0`、`q4_0` | 固定用例质量与内存对比 | 是全局配置；量化可能影响质量 |
| `OLLAMA_DEBUG` | 打开更多调试日志 | `1` | 日志出现更详细诊断 | 长期开启增加日志量，可能暴露环境细节 |
| `CUDA_VISIBLE_DEVICES` | 选择 NVIDIA GPU | GPU UUID 优于易变序号 | `nvidia-smi -L` 与日志 | 设备编号顺序可能变化 |

### 参数覆盖顺序要实测

模型运行参数可能来自多层：

```text
service environment default
  -> model / Modelfile default
  -> request options or keep_alive override
```

不要只看某一份配置。使用 `ollama show --modelfile`、实际请求体、`ollama ps` 和响应统计共同确认最终行为。

## 常用 CLI 命令字典

| 命令 | 作用 | 常用写法 | 正常结果 | AIOps 场景 | 常见坑 |
|---|---|---|---|---|---|
| `ollama --version` | 查看程序版本 | `ollama --version` | 输出版本号 | 升级前后证据 | PATH 可能指向旧 CLI |
| `ollama serve` | 启动 HTTP Server | `ollama serve` | 日志显示监听地址 | 服务器或独立 CLI 部署 | 桌面应用已运行时会端口冲突 |
| `ollama pull` | 拉取模型 | `ollama pull gemma3:270m` | 各层下载并校验完成 | 准备固定模型 | tag 拼错、磁盘不足、代理问题 |
| `ollama list` | 查看磁盘模型 | `ollama list` | NAME、ID、SIZE | 模型资产盘点 | 不代表模型已在内存中 |
| `ollama show` | 查看模型详情 | `ollama show gemma3:270m` | 能力、参数、模板、许可证 | 上线评审 | 只看名称不看 digest 与许可 |
| `ollama run` | 加载并交互推理 | `ollama run gemma3:270m` | 出现输入提示并生成回答 | 快速验证 | 首次可能先拉取，掩盖依赖准备步骤 |
| `ollama ps` | 查看运行模型 | `ollama ps` | PROCESSOR、CONTEXT、UNTIL | GPU/上下文检查 | 空列表不代表磁盘没有模型 |
| `ollama stop` | 卸载模型 | `ollama stop gemma3:270m` | 模型从 `ps` 消失 | 释放显存 | 不会删除磁盘模型 |
| `ollama create` | 从 Modelfile 创建模型引用 | `ollama create aiops-triage:v1 -f .\Modelfile` | 创建成功 | 固化提示与参数 | 不是重新训练 |
| `ollama cp` | 复制模型引用 | `ollama cp source target` | 出现新名称 | 灰度命名 | 复制名称不等于生成独立权重 |
| `ollama rm` | 删除本地模型引用 | `ollama rm model:tag` | 模型从 list 消失 | 回收磁盘 | 删除前要盘点依赖与回滚需求 |

## REST API 字典

本地基础 URL 默认为 `http://localhost:11434/api`。

| 方法与路径 | 作用 | 关键字段 | 正常结果 | 常见坑 |
|---|---|---|---|---|
| `GET /api/version` | 获取 Server 版本 | 无 | `version` | CLI 版本不一定等于 Server 版本 |
| `GET /api/tags` | 列出磁盘模型 | 无 | models、size、digest、details | 不是运行态列表 |
| `GET /api/ps` | 列出已加载模型 | 无 | size、size_vram、context_length、expires_at | 空列表可能只是已卸载 |
| `POST /api/show` | 查看模型详情 | `model`、`verbose` | 配置、能力、参数、许可 | 大字段要控制日志与展示 |
| `POST /api/pull` | 拉取模型 | `model`、`stream` | 拉取进度或完成状态 | 流式进度要逐行解析 |
| `POST /api/generate` | 按 prompt 生成 | `model`、`prompt`、`format`、`options` | response、done、统计 | 默认流式 |
| `POST /api/chat` | 按 messages 对话 | `model`、`messages`、`tools`、`format` | message、done、统计 | 历史由客户端维护 |
| `POST /api/embed` | 生成向量 | `model`、`input`、`truncate` | embeddings 与统计 | 入库和查询模型必须一致 |
| `POST /api/create` | 创建模型 | `model`、`from`、`parameters` 等 | status | 大任务可能流式返回进度 |
| `DELETE /api/delete` | 删除模型 | `model` | 成功状态 | 属于数据删除，生产需审批 |

## Chat 请求字段字典

| 字段 | 作用 | 常见写法 | 正常结果 | 常见坑 |
|---|---|---|---|---|
| `model` | 选择模型 | `gemma3:270m` | 能解析本地模型 | 省略 tag 会使用可漂移的默认标签 |
| `messages` | 提交对话历史 | `[{role, content}]` | 模型看到所需上下文 | 无限追加导致 Token 和延迟膨胀 |
| `stream` | 控制是否流式 | `false` 适合初学 | 单个完整 JSON | 默认 REST 是 true |
| `format` | 约束 JSON/Schema | JSON Schema 对象 | content 可解析 | 结构正确不代表事实正确 |
| `tools` | 声明可调用工具 | 函数名称、说明、参数 Schema | `tool_calls` | 模型输出不能直接绕过授权执行 |
| `think` | 控制支持模型的 thinking | `false` 或支持的级别 | thinking 与 content 分离 | 模型不支持会报错或忽略，按文档验证 |
| `keep_alive` | 覆盖模型保留时间 | `5m`、`0`、`-1` | `ps` 到期时间变化 | 长期 `-1` 会占住显存 |
| `options` | 覆盖运行参数 | `temperature`、`num_ctx` | 本次请求按参数运行 | 过大上下文可能 OOM |

## 一份非流式响应怎么读

下面是结构示意，不是本文实际运行输出：

```json
{
  "model": "gemma3:270m",
  "created_at": "2026-08-07T00:00:00Z",
  "message": {
    "role": "assistant",
    "content": "告警摘要示例"
  },
  "done": true,
  "done_reason": "stop",
  "total_duration": 1500000000,
  "load_duration": 200000000,
  "prompt_eval_count": 42,
  "prompt_eval_duration": 300000000,
  "eval_count": 20,
  "eval_duration": 900000000
}
```

先看 `done` 和 `done_reason`，再分解加载、输入评估和输出生成。客户端端到端耗时减去服务端 `total_duration` 后的差值，可能来自网络、网关、序列化或客户端排队。

## OpenAI 兼容接口的边界

Ollama 提供 `/v1/chat/completions`、`/v1/responses` 等部分 OpenAI API 兼容能力，方便已有 SDK 切换 `base_url`。

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:11434/v1/",
    api_key="ollama",  # SDK 要求提供；本地 Ollama 会忽略这个值
)

response = client.chat.completions.create(
    model="gemma3:270m",
    messages=[{"role": "user", "content": "用一句话总结 CPU 告警"}],
)
print(response.choices[0].message.content)
```

兼容不等于完全等价：

- 只对官方列出的兼容端点和字段做承诺；
- 模型能力、错误对象、流式 chunk 和 usage 细节可能不同；
- `v0.32.6` 就调整了 OpenAI 流式 wire format；
- 升级前必须用真实 SDK 和解析器做契约回归。

## Ollama 在 AIOps 链路中的位置

```text
metrics / logs / traces / alerts / changes
                  |
                  v
        normalize + redact + authorize
                  |
                  v
             Ollama API
        /chat   /embed   tool_calls
           |      |          |
           v      v          v
       summary   RAG    approved runbook
           |      |          |
           +------+----------+
                  |
                  v
        ticket / dashboard / audit
```

Ollama 位于“模型推理执行层”，它不会自动完成采集、清洗、权限、知识入库、动作审批和效果评估。

## 场景一：告警结构化分类

输入告警的服务、指标、阈值、变更窗口和证据，让模型按 JSON Schema 返回：

- 影响服务；
- 严重级别候选；
- 一句话摘要；
- 仅基于证据的根因候选；
- 下一步只读检查。

模型输出只是建议。严重级别和自动升级仍应由确定性规则兜底。

## 场景二：日志与事件摘要

先在 Ollama 外完成脱敏、时间排序、采样和长度限制，再让模型总结。不要把数百 MB 原始日志直接塞进上下文，也不要让模型猜缺失的时间段。

## 场景三：Runbook RAG

使用 `/api/embed` 把 Runbook 切片转成向量，查询时找回最相关片段，再把片段连同来源交给 Chat 模型。入库与查询必须使用同一个 Embedding 模型，并记录模型 digest 和维度。

## 场景四：受控工具调用

模型可以提出 `get_pod_logs`、`query_metrics` 等只读工具调用。上层应用验证资产范围和参数后执行，再把结果传回模型。`restart_service`、`delete_pod` 等写操作默认不直接开放，必须进入审批和幂等执行器。

## 场景五：事故复盘与知识沉淀

将已经脱敏、人工确认的时间线、指标和处置记录交给模型生成复盘草稿。事实、根因、影响和行动项必须由责任人复核，不能把流畅文本当作证据。

## 基础实验：构建一个本地告警分类模型入口

## 实验目标

完成下面的可验证闭环：

```text
安装 Ollama
  -> 拉取固定小模型
  -> 保存 Modelfile
  -> 创建 aiops-triage:v1
  -> 调用 /api/chat
  -> 验证 JSON 结构
  -> 观察运行位置与时长
  -> 保存脱敏证据
```

## 实验边界

- 只在个人学习机或隔离测试机操作。
- 使用合成告警，不发送真实主机名、IP、账号、Token 或客户数据。
- `gemma3:270m` 是为了跑通流程，不用于证明生产质量。
- 模型输出存在不确定性；成功标准是接口、Schema 和观察链路跑通。
- 开始前确认至少有约 1 GiB 可用磁盘，给模型、临时文件和日志留余量。

## 前置条件

```powershell
ollama --version
Invoke-RestMethod http://localhost:11434/api/version
```

若任一命令失败，先回到“安装与启动”，不要继续把后面的错误当模型问题。

## 第一步：拉取并盘点模型

```powershell
ollama pull gemma3:270m
ollama list
ollama show gemma3:270m
```

预期结果：

- Pull 完成且没有校验错误；
- `ollama list` 出现 `gemma3:270m`；
- `show` 能看到模型详情、参数或许可证信息。

把 `ollama list` 的 NAME、ID/digest、SIZE 和 `ollama --version` 记入实验笔记。

## 第二步：创建实验目录和 Modelfile

```powershell
New-Item -ItemType Directory -Force .\ollama-aiops-lab | Out-Null
Set-Location .\ollama-aiops-lab
```

创建 `Modelfile`：

```dockerfile
FROM gemma3:270m
PARAMETER temperature 0
PARAMETER num_ctx 4096
SYSTEM 你是 AIOps 告警分类助手。只使用输入中的事实。缺少证据时明确写“证据不足”，不得编造主机、指标、变更或根因。
```

创建模型引用：

```powershell
ollama create aiops-triage:v1 -f .\Modelfile
ollama show --modelfile aiops-triage:v1
```

预期结果：创建成功，反查结果包含基础模型、temperature、num_ctx 和 SYSTEM 约束。

## 第三步：发送结构化告警请求

在 PowerShell 中执行：

```powershell
$schema = @{
  type = 'object'
  properties = @{
    service = @{ type = 'string' }
    severity = @{ type = 'string'; enum = @('critical', 'warning', 'info') }
    summary = @{ type = 'string' }
    suspected_causes = @{ type = 'array'; items = @{ type = 'string' } }
    next_checks = @{ type = 'array'; items = @{ type = 'string' } }
  }
  required = @('service', 'severity', 'summary', 'suspected_causes', 'next_checks')
  additionalProperties = $false
}

$request = @{
  model = 'aiops-triage:v1'
  stream = $false
  format = $schema
  messages = @(
    @{
      role = 'user'
      content = @'
时间：2026-08-07 02:15:00
服务：order-api
证据：HTTP 5xx 比例在 10 分钟内从 1% 上升到 18%；02:10 完成版本发布；CPU 42%；数据库连接池使用率 96%。
要求：只基于证据分类和给出只读检查，不执行任何操作。
'@
    }
  )
  options = @{
    temperature = 0
    num_ctx = 4096
  }
  keep_alive = '5m'
} | ConvertTo-Json -Depth 10

$response = Invoke-RestMethod `
  -Uri 'http://localhost:11434/api/chat' `
  -Method Post `
  -ContentType 'application/json' `
  -Body $request

$response.message.content
```

预期结果：`message.content` 是一个 JSON 字符串，包含五个要求的字段。模型对 severity 和原因的具体选择可能变化，不能把示例语义当成固定断言。

## 第四步：验证返回结构

```powershell
$result = $response.message.content | ConvertFrom-Json
$required = @('service', 'severity', 'summary', 'suspected_causes', 'next_checks')

foreach ($field in $required) {
  if ($result.PSObject.Properties.Name -notcontains $field) {
    throw "Missing required field: $field"
  }
}

if ($result.severity -notin @('critical', 'warning', 'info')) {
  throw "Unexpected severity: $($result.severity)"
}

Write-Output "SCHEMA_OK service=$($result.service) severity=$($result.severity)"
```

预期输出包含 `SCHEMA_OK`。这个断言只证明结构和枚举通过，还要人工检查内容是否忠于证据。

## 第五步：计算性能证据

```powershell
$promptSeconds = $response.prompt_eval_duration / 1e9
$evalSeconds = $response.eval_duration / 1e9

$promptTps = if ($promptSeconds -gt 0) {
  [Math]::Round($response.prompt_eval_count / $promptSeconds, 2)
} else { 0 }

$outputTps = if ($evalSeconds -gt 0) {
  [Math]::Round($response.eval_count / $evalSeconds, 2)
} else { 0 }

[PSCustomObject]@{
  LoadMs = [Math]::Round($response.load_duration / 1e6, 2)
  TotalMs = [Math]::Round($response.total_duration / 1e6, 2)
  PromptTokensPerSecond = $promptTps
  OutputTokensPerSecond = $outputTps
}
```

再观察运行态：

```powershell
ollama ps
nvidia-smi # 仅 NVIDIA 环境
```

验证问题：

1. 模型是否 100% GPU、100% CPU 或混合运行？
2. 实际 CONTEXT 是多少？
3. 第一次和第二次请求的 `load_duration` 是否明显不同？
4. 客户端总耗时是否远高于服务端 `total_duration`？

## 第六步：保存脱敏学习证据

```powershell
ollama --version | Out-File .\ollama-version.txt -Encoding utf8
ollama list | Out-File .\model-inventory.txt -Encoding utf8
ollama ps | Out-File .\runtime-state.txt -Encoding utf8
$response | ConvertTo-Json -Depth 10 | Out-File .\response-redacted.json -Encoding utf8
$result | ConvertTo-Json -Depth 10 | Out-File .\triage-result.json -Encoding utf8
```

提交前打开文件检查：不能包含真实告警、账号、API Key、内部 IP 或未授权模型文件。

## 第七步：清理或保留实验

如果准备继续下面的 404 故障实验，先保留 `aiops-triage:v1`。全部实验结束后，如要释放运行内存但保留模型证据：

```powershell
ollama stop aiops-triage:v1 # 只卸载运行态，不删除磁盘模型
Set-Location .. # 离开实验目录，避免后续命令误作用于当前目录
```

只有确认可以依靠 `Modelfile` 重建时，才删除自定义模型引用：

```powershell
ollama rm aiops-triage:v1 # 删除自定义模型引用；基础 gemma3:270m 仍保留
```

若连基础模型也不再需要，再单独确认后执行 `ollama rm gemma3:270m`。不要直接删除整个 `.ollama\models` 目录；Blob 可能被其他模型引用。

## 基础实验成功标准

- [ ] CLI 与 `/api/version` 都可用。
- [ ] `ollama list` 能看到固定模型和 digest。
- [ ] `aiops-triage:v1` 可由 Modelfile 重建。
- [ ] `/api/chat` 返回 `done: true`。
- [ ] `message.content` 能解析为 JSON。
- [ ] 必填字段和 severity 枚举通过验证。
- [ ] 能观察 CPU/GPU、上下文和保留时间。
- [ ] 能区分 Load、Prefill 和 Decode 耗时。

## 如果基础实验没有成功，先查这些

### `ollama` 不是命令

1. 关闭并重新打开终端。
2. `Get-Command ollama -All` 检查 PATH。
3. 确认安装目录存在。
4. 不要从未知网站下载同名可执行文件。

### 连接 `localhost:11434` 失败

```powershell
Get-NetTCPConnection -LocalPort 11434 -ErrorAction SilentlyContinue
Get-Content "$env:LOCALAPPDATA\Ollama\server.log" -Tail 100
```

先确认桌面应用或 `ollama serve` 是否启动，再检查端口冲突和安全软件。

### Pull 很慢或失败

- 看磁盘空间；
- 检查 DNS、HTTPS 出口和企业代理；
- 官方建议拉取模型使用 `HTTPS_PROXY`，错误设置 `HTTP_PROXY` 可能干扰本地客户端连接；
- 查看日志中的 Registry、TLS、校验或权限错误；
- 不要通过关闭证书验证来“修好”生产环境。

### 模型运行但没有用 GPU

1. `nvidia-smi` 是否能看到显卡和驱动？
2. GPU 是否在官方支持表？
3. 日志中 GPU Discovery 发现了什么？
4. `ollama ps` 的 PROCESSOR 是什么？
5. 模型和上下文是否超过显存，导致部分 CPU Offload？

### JSON 无法解析

- 确认 `stream = $false`；
- 解析的是 `$response.message.content`，不是整个响应对象；
- `format` 应是 Schema 对象，不只是在 prompt 中写“返回 JSON”；
- 查看 HTTP 错误和模型是否支持所需能力。

## 故障注入实验：发布配置引用了不存在的模型标签

这个实验模拟一种常见生产故障：应用配置写了一个错误或未预热的模型 tag，发布后所有请求都失败。

### 实验边界与回滚

- 只访问本地实验 Ollama。
- 不删除、停止或覆盖已有模型。
- 使用故意不存在的 `aiops-triage:missing`。
- 回滚就是把配置恢复为已经验证的 `aiops-triage:v1`。

### 一、建立基线

```powershell
ollama list
```

确认 `aiops-triage:v1` 存在，`aiops-triage:missing` 不存在。

### 二、注入故障

```powershell
$badRequest = @{
  model = 'aiops-triage:missing'
  stream = $false
  messages = @(
    @{ role = 'user'; content = '总结这条合成告警。' }
  )
} | ConvertTo-Json -Depth 6

try {
  Invoke-RestMethod `
    -Uri 'http://localhost:11434/api/chat' `
    -Method Post `
    -ContentType 'application/json' `
    -Body $badRequest `
    -ErrorAction Stop
  throw 'Expected request to fail, but it succeeded.'
} catch {
  $status = [int]$_.Exception.Response.StatusCode
  Write-Output "EXPECTED_FAILURE status=$status"
  Write-Output $_.ErrorDetails.Message
}
```

### 三、预期现象

- HTTP 状态通常为 `404 Not Found`；
- 错误 JSON 包含 `error` 字段，指出模型不存在；
- `ollama list` 仍没有错误 tag；
- 正确模型没有被删除或修改。

官方错误文档把模型不存在列为 404 场景。若实际版本返回不同状态，记录真实状态、Ollama 版本和错误体，不要为了匹配文章篡改证据。

### 四、证据与假设

按顺序收集：

```powershell
ollama --version
ollama list
Invoke-RestMethod http://localhost:11434/api/version
Get-Content "$env:LOCALAPPDATA\Ollama\server.log" -Tail 100
```

形成假设：

```text
服务端口正常 + 正确模型存在 + 错误模型返回 404
  -> Ollama Server 整体可用
  -> 故障集中在发布配置的 model reference
```

### 五、验证与修复

```powershell
$goodRequest = @{
  model = 'aiops-triage:v1'
  stream = $false
  messages = @(
    @{ role = 'user'; content = '只回复：model-reference-ok' }
  )
} | ConvertTo-Json -Depth 6

$recovered = Invoke-RestMethod `
  -Uri 'http://localhost:11434/api/chat' `
  -Method Post `
  -ContentType 'application/json' `
  -Body $goodRequest

if (-not $recovered.done) {
  throw 'Recovery request did not finish.'
}

Write-Output 'RECOVERY_OK'
```

恢复成功标准：正确 tag 返回完成响应，日志不再出现对应 404。

### 六、清理

这个故障没有创建额外模型，无需删除数据。保留一份脱敏故障记录：

```text
现象：新版本全部 404
证据：Server 健康，错误 tag 不在 ollama list
假设：应用 model reference 配置错误
验证：切回已核验 tag 后成功
修复：回滚配置；发布门禁增加 model existence check
影响面：只影响引用该 tag 的调用方
后续：保存 Ollama 版本、模型 tag + digest、Modelfile commit
```

### 七、把故障变成发布门禁

发布前至少检查：

```powershell
$models = (Invoke-RestMethod http://localhost:11434/api/tags).models
$target = $models | Where-Object { $_.name -eq 'aiops-triage:v1' }

if (-not $target) {
  throw 'Required model aiops-triage:v1 is not installed.'
}

Write-Output "MODEL_READY digest=$($target.digest)"
```

这比等业务请求报 404 后再排障更可靠。

## 生产架构：从单机实验到共享 AIOps 推理服务

## 单机实验架构

```text
one user
  -> localhost Ollama
  -> one machine CPU/GPU
  -> local model directory
```

优点是简单、数据边界清楚。缺点是单进程、单主机、单磁盘和单 GPU 都可能成为故障点。

## 团队共享架构

```text
AIOps applications
        |
        v
API Gateway / Ingress
  - TLS
  - identity and authorization
  - request size / rate limit
  - timeout / retry budget
  - audit and redaction
        |
        v
model-aware routing / admission control
        |
        +--------+--------+
        |                 |
        v                 v
Ollama replica A      Ollama replica B
GPU node A            GPU node B
tested models         tested models
        |                 |
        +--------+--------+
                 |
                 v
external metrics / logs / traces / evaluation store
```

这是生产设计建议，不是 Ollama 内置集群功能。Ollama 单实例没有自动提供跨节点模型复制、全局队列、租户配额、领导者选举和流式请求接续。

## 请求路径中的超时与重试

至少区分四层：

1. 网关排队超时；
2. Ollama 调度等待；
3. 模型 Prefill/Decode 超时；
4. 上层工具执行超时。

生成请求中途失败后自动重试，可能产生两段不同回答。若回答触发工具，重试还可能重复产生动作。因此：

- 读请求可以有限重试并带总预算；
- 流已向用户输出后，重试需要明确标记新回答；
- 写工具必须使用幂等键、状态机和审批；
- 不允许每层代理都独立重试多次。

## 容量与性能规划

## 四类容量先分开

| 资源 | 主要占用 | 先看什么 |
|---|---|---|
| 磁盘 | 模型 Blob、Manifest、临时下载、日志 | 模型页面 SIZE、模型目录、剩余空间 |
| RAM | CPU 权重、GPU Offload 剩余层、缓冲区 | 系统可用内存、进程 Working Set |
| VRAM | GPU 权重、KV Cache、计算缓冲区 | `nvidia-smi`、`ollama ps` |
| 网络 | 模型拉取、Cloud 模型、远程客户端流 | Registry 带宽、出站策略、网关流量 |

## 容量规划步骤

1. 固定 Ollama 版本、模型 tag、digest 和量化。
2. 从单并发、短上下文建立基线。
3. 记录模型加载后的 RAM、VRAM 和 `ollama ps`。
4. 分别增加输入长度、输出长度和并发，不同时改变多个变量。
5. 记录 OOM、CPU Offload、吞吐和 P95/P99 延迟。
6. 给驱动、系统和突发请求留安全余量，不把显存用到 100%。
7. 按模型拆分节点，避免热点模型与低频大模型互相驱逐。

## 性能指标

- Availability：成功完成请求比例；
- TTFT（Time To First Token）：从接收请求到第一块内容的时间；
- End-to-end latency：客户端总耗时；
- Load latency：`load_duration`；
- Prompt throughput：输入 Token/s；
- Decode throughput：输出 Token/s；
- Queue wait：进入执行前等待时间；
- Queue rejection：过载拒绝数量；
- GPU utilization、VRAM、功耗与温度；
- CPU、RAM、磁盘和网络；
- 按模型、版本、上下文桶和调用方分组的错误率。

TTFT 不等于 `load_duration`。它还包含路由、排队、模板、Tokenize 和 Prefill，应由客户端或网关单独测量。

## 高可用与故障域

### 单实例故障域

- Ollama 进程退出；
- GPU 驱动或设备故障；
- 模型磁盘损坏或空间不足；
- 单主机网络与电源故障；
- 错误版本或模型更新；
- 长请求占满执行能力。

### 多副本原则

- 至少跨 GPU、主机和电源故障域；
- 每个副本预先拉取并验证目标模型；
- 网关只把请求发给已经预热且能力匹配的副本；
- 模型清单由外部发布系统统一，不能靠手工登录每台机器；
- 调用方携带完整必要消息，减少对某一副本的隐式会话依赖；
- 中途断开的生成请求不能无缝迁移到另一副本，要向用户明确失败或重试。

### 健康检查分层

```text
Liveness
  -> process and /api/version respond

Readiness
  -> target model exists
  -> required capability matches
  -> resource headroom is sufficient
  -> optional small controlled inference succeeds

Business health
  -> fixed evaluation cases meet schema, latency and quality thresholds
```

只检查 `11434` 返回 200，无法证明目标模型存在、GPU 正常或回答质量合格。

## 安全边界

## 本地 API 无内置认证

官方 Authentication 页面明确说明，本地 `http://localhost:11434` 不需要认证。安全基线：

- 个人实验保持 `127.0.0.1`；
- 共享服务通过网关暴露，不直接把 Ollama 端口放到办公网或公网；
- 网关提供 TLS、身份认证、按模型授权、租户配额、请求体限制和审计；
- 网络策略只允许受信应用访问后端端口。

`OLLAMA_ORIGINS` 只控制浏览器跨域，不验证调用者身份。允许 `*` 不能替代登录和授权。

## 模型供应链

- Ollama 程序固定版本并核验官方来源；
- 模型记录 Registry、名称、tag、digest、SIZE、量化和许可证；
- 不把 `latest` 直接作为生产不可变版本；
- Modelfile、评估集和发布清单进入 Git；
- 新模型先做安全扫描、能力评估和隔离灰度；
- 不从未知网盘直接导入权重或适配器。

## Prompt Injection 与工具安全

日志、工单和网页都是不可信输入。攻击者可以在文本里写“忽略规则并执行删除命令”。防护要放在模型外：

1. 把证据和系统指令分隔并标记来源；
2. 工具 allowlist 和参数 Schema；
3. 资产范围、账号权限和命令规则二次校验；
4. 写操作人工审批；
5. 幂等键、超时、回滚和审计；
6. 对模型输出做敏感信息与危险动作检测。

## 本地与 Cloud 边界

- 本地模型推理时，官方声明 Ollama 不会看到本地 prompt 与回答；
- Cloud 模型会把请求交给 Ollama Cloud 处理；
- Web Search 也意味着外部访问；
- 严格离线环境设置 `OLLAMA_NO_CLOUD=1` 并从网络策略与日志双重验证；
- 不能仅凭 URL 是 localhost 就断言数据从未出机。

## 可观测性

## 官方可直接获得的证据

### 日志

| 平台 | 位置或命令 |
|---|---|
| Windows | `%LOCALAPPDATA%\Ollama\server.log` 与轮转日志 |
| Linux systemd | `journalctl -u ollama --no-pager --follow` |
| Docker | `docker logs <container>` 或 `docker compose logs ollama` |
| 手工 `serve` | 当前终端标准输出/错误 |

### API 与 CLI

- `/api/version`：服务版本；
- `/api/tags`：磁盘模型与 digest；
- `/api/ps`：运行模型、VRAM、上下文和到期时间；
- 最终响应：Load、Prompt Eval、Eval 和 Total Duration；
- HTTP 状态和流内 `error`：请求失败证据。

### 系统指标

- Windows Task Manager / Performance Monitor；
- `nvidia-smi`；
- Linux CPU、RAM、磁盘、网络和驱动日志；
- 容器 CPU、内存、重启和存储指标。

## 指标采集建议

核验日期时，官方核心文档没有把一个内置 Prometheus `/metrics` 端点作为标准运维接口。生产可以在网关或调用 SDK 处采集：

- request_total；
- completed_total；
- error_total by status/model；
- time_to_first_token_seconds；
- total_duration_seconds；
- prompt_tokens_total 与 output_tokens_total；
- load_duration_seconds；
- queue_wait_seconds；
- in_flight_requests；
- model_digest 与 server_version 作为受控信息标签。

不要把完整 prompt、回答或高基数 request_id 塞进指标标签。敏感内容只进入受控日志或审计库，并设置保留期。

## 常见故障排查矩阵

| 现象 | 优先证据 | 常见假设 | 修复方向 |
|---|---|---|---|
| API 连接失败 | 端口、`/api/version`、server.log | 服务未启动、端口冲突 | 启动服务、修正监听、处理冲突 |
| 模型 404 | `/api/tags`、发布配置 | tag 错误、未拉取 | 回滚引用或先拉取验证 |
| Pull 失败 | 磁盘、DNS、TLS、代理、日志 | 空间不足或出口异常 | 扩容、修复 HTTPS 代理和证书 |
| 第一次请求慢 | `load_duration`、`ps` | 冷加载 | 预热、合理 keep_alive |
| 长输入慢 | prompt Token 与 duration | Prefill 成本、上下文过大 | 裁剪、分块、检索、摘要 |
| 输出慢 | eval Token/s、GPU/CPU | CPU 回退、资源争用 | 选小模型、修驱动、减少并发 |
| OOM | VRAM/RAM、context、parallel | 权重 + KV + 并发超限 | 减模型/上下文/并行、量化 |
| 503/超时 | 到达率、队列、P95/P99 | 过载、重试风暴 | 背压、限流、降级、扩容 |
| JSON 解析失败 | stream、Content-Type、原始响应 | NDJSON 当单 JSON | 逐块解析或 `stream:false` |
| 工具重复执行 | request/idempotency/audit | 重试无幂等 | 动作状态机和幂等键 |
| 升级后 SDK 异常 | 版本、契约测试、流式 chunk | 兼容格式变化 | 回滚、适配解析器、灰度 |

## 备份、恢复与灾备

### 应优先版本化的内容

- Modelfile；
- 模型发布清单：名称、tag、digest、SIZE、许可证；
- 服务环境变量模板；
- 网关、认证、限流和网络策略；
- 固定评估数据与预期 Schema；
- 运行和故障记录。

### 模型 Blob 怎么处理

模型文件往往很大。灾备策略可以选择：

1. 依赖可信 Registry 重新 Pull，并保存准确清单；
2. 在许可允许时维护内部镜像或离线制品库；
3. 对低带宽隔离环境备份完整模型目录，并定期做恢复演练。

不能只复制一个看起来最大的权重文件。Manifest、模板、参数、许可证和其他层也属于模型定义。

### 恢复顺序

```text
restore Ollama version
  -> restore configuration and network boundary
  -> restore or pull tested model artifacts
  -> verify tag + digest + license
  -> preload model
  -> run schema and quality smoke tests
  -> enable traffic gradually
```

## 升级与回滚

## 升级前清单

```powershell
ollama --version
ollama list
ollama ps
Invoke-RestMethod http://localhost:11434/api/version
```

同时保存：

- 旧安装包或容器 digest；
- Modelfile commit；
- 模型 tag + digest；
- 原生 API 与 OpenAI 兼容 API 契约测试；
- 流式、结构化输出、工具调用、Embedding 的固定回归用例；
- 延迟、吞吐、显存和质量基线。

## 灰度步骤

1. 在非生产节点安装新版本。
2. 拉取与生产一致的模型 digest。
3. 跑 API 字段、流式 chunk、错误码和取消请求测试。
4. 跑固定 AIOps 数据集，比较 Schema、事实性、延迟和资源。
5. 只放少量真实脱敏流量。
6. 观察稳定窗口后逐步扩大。
7. 保留旧节点，直到回滚窗口结束。

## 回滚触发条件

- 关键 API 字段或流式解析不兼容；
- OOM、崩溃或 CPU 回退显著上升；
- P95/P99 超过 SLO；
- 固定评估集质量下降；
- 模型或功能在新版本不可用；
- 安全边界或数据路径不符合预期。

`v0.32.6` 暂时移除实验性图像生成，就是“新版本不保证所有实验功能继续存在”的真实提醒。生产不要在没有回归和回滚包的情况下依赖实验功能。

## 生产设计题：每天 50 万条告警怎样接 Ollama

### 先算负载，不直接报 GPU 数量

50 万条/天的平均到达率约为：

```text
500000 / 86400 ~= 5.8 requests/s
```

但事故流量可能在几分钟内达到平均值的几十倍。还要知道：

- 每条输入 Token；
- 目标输出 Token；
- 模型和量化；
- 单 GPU Prefill/Decode 吞吐；
- 峰值系数；
- 允许的 P95 延迟；
- 失败后的重试与降级；
- 哪些告警需要模型，哪些规则就能处理。

### 推荐链路

```text
Alert stream
  -> deduplicate / correlate / redact
  -> priority queue
  -> deterministic rules handle easy cases
  -> model gateway with quota and timeout
  -> Ollama pools split by model
  -> schema validation
  -> ticket / dashboard
  -> human approval before write action
```

### 关键取舍

- 先降噪再推理，比给每条原始告警调用模型更省资源；
- 小模型做分类，大模型只处理复杂事件；
- 交互请求和离线摘要分队列，避免批任务拖死值班请求；
- 过载时降级到规则摘要，而不是无限排队；
- 每个输出保留模型版本、digest、prompt template、证据引用和耗时。

## 事故场景：升级后流式告警摘要大量失败

### 现象

- Ollama 进程和 `/api/version` 正常；
- 非流式请求成功；
- 使用 OpenAI SDK 的流式调用方大量报解析错误；
- 发布刚从旧版本升级到 `v0.32.6`。

### 收集证据

1. 对比新旧 Server 版本和容器/安装包。
2. 保存一条脱敏原始流式响应，不只保存客户端异常。
3. 比较 chunk 中 `role`、`finish_reason` 和 usage 的出现位置。
4. 核对 Release Notes。
5. 检查是否只有某个 SDK/解析器失败。
6. 比较非流式与原生 `/api/chat`。

### 形成假设

```text
Server 健康
  + 非流式成功
  + 只有 OpenAI 流式解析失败
  + 升级版本调整 wire format
  -> 首要假设是客户端契约不兼容，不是 GPU 故障
```

### 验证

- 用已知兼容 SDK 复现；
- 在灰度环境回放固定流式请求；
- 临时切换 `stream:false` 判断业务是否恢复；
- 把旧版本副本接入少量请求做对照。

### 修复与回滚

- 短期：调用方降级非流式，或把流量切回旧副本；
- 正式：升级 SDK/解析器，按新 chunk 合同累积角色、结束原因和 usage；
- 回归：覆盖正常结束、长度截断、工具调用、usage 和流中错误；
- 保留旧版本直到所有调用方通过。

### 影响面与复盘

影响面只应包括使用对应兼容接口和流式解析器的应用，不要直接宣布“所有 Ollama 推理都坏了”。后续发布门禁加入真实 wire-format 契约测试，而不是只检查 HTTP 200。

## 面试怎么讲

## 30 秒回答

```text
Ollama 是模型运行和本地服务工具，不是模型本身。它把模型以 tag、manifest 和 blob 管理在磁盘上，请求进入 Server 后由 Scheduler 复用或加载 Runner，再在 CPU/GPU 上完成 Prefill 和 Decode，并通过原生 REST 或兼容 API 返回。生产上我会重点控制模型与许可版本、显存和 KV Cache、上下文与并发、无内置本地鉴权的网络风险，以及冷启动、排队、流式错误和升级回滚。
```

## 3 分钟回答

```text
我会从四层解释 Ollama。第一层是模型制品：程序本身采用 MIT，但每个模型有独立许可；生产记录 tag、digest、量化、大小和 Modelfile。第二层是请求路径：Chat 或 Generate 请求进入 HTTP Server，解析模型和参数，由 Scheduler 找到或加载 Runner，完成 Tokenize、Prefill、KV Cache 和逐 Token Decode，最后流式或一次性返回。第三层是容量：模型文件只是下界，运行还要计算权重、KV Cache、缓冲区和并发上下文，使用 ollama ps、nvidia-smi 与 duration 字段建立实测基线。第四层是生产治理：本地 API 默认无认证，所以共享服务必须放在带 TLS、认证、限流和审计的网关后；Ollama 单实例也不等于高可用集群，需要外部做副本、模型分发、流量和评估。故障时我先按端口、模型是否存在、加载位置、队列、Prefill/Decode 和客户端契约收集证据，再决定预热、减小上下文、限流、回滚模型或回滚 Ollama 版本。
```

## 递进面试题与参考答案

### 第一问：Ollama 和模型是什么关系

参考答案：Ollama 是运行时、模型管理和 HTTP 服务；模型是权重、配置、模板与许可证等制品。安装 Ollama 不等于已经下载模型，下载模型也不等于已加载到 GPU。

追问：`ollama list` 和 `ollama ps` 分别证明什么？

回答要点：前者证明磁盘模型存在，后者证明运行内存中有加载模型，并显示处理器、上下文和到期状态。

### 第二问：一次 `/api/chat` 请求怎么走

参考答案：解析请求和模型引用，读取本地模型定义，Scheduler 复用或加载 Runner，套用模板、Tokenize、Prefill 建 KV Cache、Decode 生成，再返回流式 chunk 或完整 JSON，并按 keep_alive 保留模型。

追问：第一条慢、第二条快怎样证明是冷启动？

回答要点：比较 `load_duration`、`ollama ps` 和端到端 TTFT，而不是只看总耗时。

### 第三问：为什么上下文和并发会吃显存

参考答案：除权重外，每条并行序列都要维护随上下文增长的 KV Cache 和计算缓冲。并行数乘以上下文会放大内存，因此模型能单请求运行不代表能多并发运行。

追问：怎么优化？

回答要点：减上下文、裁剪输入、用 RAG、降低并行和同时加载模型数、选择更小或量化模型、评估 KV Cache 量化和 Flash Attention，并以质量与延迟实测决策。

### 第四问：流式响应为什么不能只检查 HTTP 200

参考答案：响应头发出后可能在中途失败，错误会作为 NDJSON 的 `error` 对象出现，初始状态码不能再改。客户端必须消费到完成标志或错误，并正确累积 content、thinking 和 tool_calls。

追问：重试有什么风险？

回答要点：可能重复输出或形成不同答案；若关联工具还会重复动作，所以要有总重试预算、幂等键和动作状态机。

### 第五问：本地部署为什么仍有数据泄露风险

参考答案：API 暴露、日志、磁盘、浏览器跨域、恶意 prompt、Cloud 模型和工具执行都可能越过预期边界。localhost 不代表所有路径都本地，需关闭不需要的 Cloud、限制网络、认证授权、脱敏和审计。

追问：`OLLAMA_ORIGINS=*` 能解决认证吗？

回答要点：不能。CORS 只控制浏览器是否允许跨域请求，不验证调用者身份。

### 第六问：Ollama 程序 MIT 是否代表模型可商用

参考答案：不代表。软件许可与模型许可独立，需要核对模型页、`ollama show`、上游许可证和业务用途。

追问：怎样留下审计证据？

回答要点：保存模型 tag、digest、SIZE、许可证快照、Modelfile commit、评估和批准记录。

### 第七问：Ollama 怎样做高可用

参考答案：Ollama 本身不是一个自带跨节点控制面的 HA 集群。生产需要外部网关、多个 GPU 节点副本、模型清单分发、预热、健康检查、容量路由和故障转移。

追问：正在流式生成的请求能无缝漂移吗？

回答要点：通常不能。Runner 的 KV Cache 是本机易失状态，断开后要失败或重新生成，并处理重复与差异。

### 第八问：怎样判断该选 Ollama 还是 vLLM/云 API

参考答案：按模型支持、吞吐、并发、硬件、运维能力、数据边界和成本选择。Ollama 适合本地和小型服务；大规模 GPU 服务通常需要更强的批处理、分布式与多租户平台；云 API 适合减少自建运维但要接受数据和成本边界。

### 第九问：生产升级为什么要测流式 wire format

参考答案：兼容接口不只是 URL 和状态码，还包括 chunk 顺序、结束原因、usage 和错误对象。`v0.32.6` 的 Release Notes 就包含 OpenAI 流式格式调整。

追问：回滚要准备什么？

回答要点：旧二进制/镜像、模型清单与 digest、配置、Modelfile、SDK 契约测试、灰度节点和流量切回方案。

### 第十问：怎样把模型输出接入自动修复

参考答案：模型只做建议或工具意图，外部系统完成参数验证、资产授权、审批、幂等执行、结果验证和回滚。默认先开放只读工具，写操作按风险分级。

追问：如何证明修复有效？

回答要点：动作前后采集同一 SLI、检查业务恢复、评估影响面，并保留审计记录；“命令执行成功”不等于“业务恢复”。

## 事故复盘题

题目：Ollama 服务仍返回 200，但告警助手答案逐渐变慢并开始超时，GPU 显存接近满载。你怎么排查？

答题框架：

1. 先冻结高风险变更，记录 Ollama、模型和调用方版本。
2. 按模型统计到达率、输入/输出 Token、并发和错误。
3. 对比分解后的 Load、Prompt Eval、Eval、Queue Wait 和客户端总耗时。
4. 用 `ollama ps` 查模型数量、上下文、处理器和保留时间。
5. 用 GPU/RAM 指标判断权重、KV Cache、并发或 CPU Offload。
6. 验证近期是否提高 `num_ctx`、`NUM_PARALLEL` 或增加新模型。
7. 先限流、降级、减上下文或切回旧配置恢复服务。
8. 在隔离环境复现单变量变化，确定根因。
9. 评估受影响调用方、丢弃/超时请求和重复重试。
10. 补容量门禁、峰值压测、重试预算和回滚自动化。

## 学习检查清单

### 基础层

- [ ] 我能解释 Ollama 和模型不是一回事。
- [ ] 我能区分 `pull`、`run`、`serve`、`list` 和 `ps`。
- [ ] 我能拉取明确 tag 并记录 digest 与许可证。
- [ ] 我能使用 Modelfile 固化系统提示和参数。
- [ ] 我能调用 `/api/chat` 并处理 `stream:false`。
- [ ] 我能验证结构化输出，而不是只看自然语言。
- [ ] 我能从日志、端口和错误 JSON 定位基础故障。

### 机制层

- [ ] 我能画出 Server、Scheduler、Runner、CPU/GPU 的请求路径。
- [ ] 我能解释 Manifest、Blob、Tag 和 Digest。
- [ ] 我能解释 Prefill、Decode 和 KV Cache。
- [ ] 我能区分磁盘模型、已加载模型、会话历史和工具状态。
- [ ] 我能解释 Streaming 中途错误为什么可能仍从 200 开始。

### 生产层

- [ ] 我能按权重、KV Cache、缓冲和并发估算容量。
- [ ] 我能解释上下文、并行、吞吐和延迟的取舍。
- [ ] 我能为共享 API 设计 TLS、认证、授权、限流和审计。
- [ ] 我能说明 Ollama 单实例的高可用边界。
- [ ] 我能设计模型预热、过载降级和调用方重试预算。
- [ ] 我能完成 Ollama 与模型的灰度、回滚和契约测试。
- [ ] 我能把工具调用放进审批、幂等和回滚链路。

## GitHub 学习证据

建议目录：

```text
ollama-aiops-lab/
  README.md
  Modelfile
  compose.yaml
  requests/
    triage-request-redacted.json
    bad-model-request.json
  evidence/
    ollama-version.txt
    model-inventory.txt
    runtime-state.txt
    response-redacted.json
    performance-baseline.md
  incidents/
    missing-model-tag.md
  architecture/
    production-design.md
```

`README.md` 至少说明：

1. 核验日期与 Ollama 版本；
2. 模型 tag、digest、SIZE、量化和许可证；
3. 硬件、驱动、RAM/VRAM 与上下文；
4. 实验步骤和真实结果；
5. 本轮哪些步骤没有运行；
6. 故障证据、假设、验证、修复和清理；
7. 安全边界与敏感信息清理；
8. 下一次升级的回滚条件。

不要提交：

- 模型 Blob 或大权重文件；
- API Key、私钥或浏览器登录状态；
- 未脱敏的日志、告警、工单和提示词；
- 只截一张“回答成功”但没有版本、digest、硬件与验证过程的截图。

## 学习边界与下一步

本文完成的是“从零运行、理解机制、做 AIOps 接入、排障和生产设计”的主线，不会把所有模型、所有推理后端和每一种 GPU 组合穷举完。

下一步可以继续：

1. 学 [Transformer](./transformer.md)，理解模型内部的 Attention、Mask、Prefill 与 KV Cache。
2. 学 [LLM / OpenAI API](./llm-openai.md)，理解应用接口、结构化输出、评估和成本。
3. 学 [RAG](./rag.md) 与 [向量数据库](./vector-database.md)，构建 Runbook 检索。
4. 学 [Dify](./dify.md) 或 [LangChain](./langchain.md)，把 Ollama 接入 AI 应用。
5. 学 [n8n](../automation/n8n.md) 与 [Runbook Automation](../automation/runbook-automation.md)，把建议接入受控流程。
6. 对高吞吐生产服务继续研究 vLLM、Kubernetes GPU 调度、模型网关和系统化评估。

读完本文不等于已经具备大模型平台岗位的全部能力。Linux、网络、Python、容器、GPU、模型评估、系统设计、生产项目和沟通仍需分别练习。

## 核心事实来源索引

- 版本与变更：[`v0.32.6` Release](https://github.com/ollama/ollama/releases/tag/v0.32.6)
- 内部请求与调度：[`routes.go`](https://github.com/ollama/ollama/blob/c82ebbd5bfb9ec7d94d3894e9023db0fb224ff50/server/routes.go)、[`sched.go`](https://github.com/ollama/ollama/blob/c82ebbd5bfb9ec7d94d3894e9023db0fb224ff50/server/sched.go)
- 默认配置与上下文自动值：[`envconfig/config.go`](https://github.com/ollama/ollama/blob/c82ebbd5bfb9ec7d94d3894e9023db0fb224ff50/envconfig/config.go)
- 程序许可：[Ollama LICENSE](https://github.com/ollama/ollama/blob/main/LICENSE)
- 本地 API 与 Cloud 认证：[Authentication](https://docs.ollama.com/api/authentication)
- API 默认地址和版本边界：[API Introduction](https://docs.ollama.com/api/introduction)
- Chat 字段与统计：[Chat API](https://docs.ollama.com/api/chat)
- 流式状态与错误：[Streaming](https://docs.ollama.com/capabilities/streaming)、[API Errors](https://docs.ollama.com/api/errors)
- 模型保留、并发、队列、GPU 与 KV Cache：[FAQ](https://docs.ollama.com/faq)
- 上下文自动配置：[Context length](https://docs.ollama.com/context-length)
- 模型运行状态：[`/api/ps`](https://docs.ollama.com/api/ps)
- Modelfile：[Modelfile Reference](https://docs.ollama.com/modelfile)
- 硬件与 GPU：[Hardware support](https://docs.ollama.com/gpu)
- Windows 路径与要求：[Windows](https://docs.ollama.com/windows)
- 容器运行：[Docker](https://docs.ollama.com/docker)
- 日志与 GPU 排障：[Troubleshooting](https://docs.ollama.com/troubleshooting)
- 结构化输出：[Structured Outputs](https://docs.ollama.com/capabilities/structured-outputs)
- 工具调用：[Tool Calling](https://docs.ollama.com/capabilities/tool-calling)
- Embedding：[Embeddings](https://docs.ollama.com/capabilities/embeddings)
- 实验模型：[gemma3:270m](https://ollama.com/library/gemma3:270m)
