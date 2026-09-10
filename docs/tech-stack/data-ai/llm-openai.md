# LLM / OpenAI API

> 目标：不是只会复制一次 OpenAI API 调用，而是能理解 LLM 在 AIOps 中的合理位置、Responses API 的请求/响应结构、模型选型、提示词合同、结构化输出、工具调用、Embeddings、上下文拼装、安全边界、成本控制、生产化、评估方法，并能做一个可审计、可降级、可测试的告警摘要助手。

## 官方资料

零基础先补三个前置：HTTP 是程序之间传请求和响应的协议，JSON 是可交换的结构化文本，SDK 是帮你组织请求的代码库。你需要会运行 Python、读取字典和处理异常，不需要先训练神经网络。请先做文末无密钥的契约课堂，再自行决定是否授权一次有费用的真实接口实验。

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
OpenAI API（OpenAI 模型接口）
  -> Get started（入门）
     -> Quickstart（快速开始）
     -> Models（模型）
     -> SDKs and CLI（开发工具包与命令行）
     -> Latest model guide（模型指南）
  -> Core concepts（核心概念）
     -> Text generation（文本生成）
     -> Responses API（响应接口）
     -> Structured Outputs（结构化输出）
     -> Function calling（函数调用）
     -> Tools（工具）
  -> Specialized models（专用模型）
     -> Embeddings（向量编码）
     -> Moderation（内容风险审查）
     -> Audio / image / realtime（音频、图像与实时交互）
  -> Run and scale（运行与扩容）
     -> Conversation state（会话状态）
     -> Streaming（流式输出）
     -> Background mode（后台模式）
     -> Prompt caching（提示缓存）
     -> Counting tokens（计算词元用量）
     -> Latency optimization（延迟优化）
     -> Cost optimization（成本优化）
  -> Going live（上线）
     -> Production best practices（生产最佳实践）
     -> Deployment checklist（部署检查单）
     -> Safety best practices（安全最佳实践）
     -> Rate limits（速率限制）
     -> Usage monitoring（用量监控）
```

学习路线：

```text
API key（接口密钥）
  -> install SDK（安装开发工具包）
  -> first Responses API（响应接口） call
  -> instructions and input（指令与输入）
  -> output_text（文本输出字段）
  -> model selection（模型选择）
  -> prompt contract（提示词契约）
  -> structured outputs（结构化输出）
  -> function calling（函数调用）
  -> embeddings（向量编码）
  -> AIOps context（上下文） assembly
  -> safety and production controls（安全与生产控制）
  -> evaluation（评估）
```

初学不要同时学完所有 API。AIOps 入门优先掌握：

路线图中 `first call` 是第一次接口调用，`context assembly` 是上下文组装。下文链路里的 `queries` 表示证据查询，`summary` 是摘要，`extraction` 是信息提取，`next-check suggestions` 是下一步检查建议；这些能力都不等于自动确认根因。

- 文本生成：生成摘要和建议。
- 结构化输出：让程序可靠读取模型结果。
- 函数调用：让模型请求你的程序查询数据或执行受控动作。
- Embeddings：做相似告警、相似事故、runbook 语义检索。
- 生产边界：密钥、限流、降级、审计、评估。

## LLM 在 AIOps 链路中的位置

合理位置：

```text
Prometheus / Loki / Elasticsearch / MySQL / GitHub / Kubernetes（指标、日志、搜索、事务、代码与集群证据来源）
  -> rules（规则）, queries, anomaly detection（异常检测）, retrieval（检索）
  -> structured facts（结构化事实）
  -> LLM（大语言模型） summary / explanation（解释） / extraction / next-check suggestions
  -> human review（人工复核）
  -> approved runbook（操作手册） automation（自动化）
  -> audit log（审计日志）
```

不合理位置：

```text
raw alerts and logs（日志）
  -> LLM（大语言模型） guesses root cause
  -> LLM（大语言模型） runs production command
  -> no approval（审批）
  -> no audit（审计）
```

这张反例图表示“把未经筛选的告警日志交给模型猜根因，再直接执行生产命令，而且没有审批与审计”。`no approval` 和 `no audit` 中的 `no` 是缺失，不应误读成具备这些控制。后面的查询和工具图只是功能路径，安全控制必须由应用落实。

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

长期维护时，不建议把模型散落在代码各处。更好的方式是环境变量：

```python
import os

model = os.getenv("OPENAI_MODEL", "gpt-5.5")
```

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

Windows PowerShell：

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install openai python-dotenv pydantic
```

确认安装：

```bash
python -c "import openai; print(openai.__version__)"
```

## API Key

OpenAI API 使用 API key 认证。不要把 API key 写死在代码、README、截图、日志或 Git 提交里。

临时设置：

```bash
export OPENAI_API_KEY="你的 key"
```

PowerShell：

```powershell
$env:OPENAI_API_KEY="你的 key"
```

`.env.example`：

```text
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-5.5
```

`.gitignore`：

```text
.env
```

读取 `.env`：

```python
from dotenv import load_dotenv

load_dotenv()
```

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

运行：

```bash
python hello_openai.py
```

这段代码的链路：

```text
Python code（Python 应用代码）
  -> OpenAI SDK（OpenAI 开发工具包）
  -> POST /v1/responses（创建模型响应的接口）
  -> model（模型）
  -> response（响应） object
  -> response.output_text（响应中的文本输出字段）
```

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

常用字段：

| 字段 | 作用 | AIOps 示例 |
|---|---|---|
| `model` | 选择模型 | `gpt-5.5` 或环境变量 |
| `instructions` | 稳定规则 | 只根据事实、不编造 |
| `input` | 本次输入 | 告警、指标、日志、变更 |
| `max_output_tokens` | 限制输出长度 | 防止事故摘要过长 |
| `temperature` | 某些模型支持的采样控制 | 先核实所选模型及推理设置是否支持，不能统一套低值 |
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
if response.status != "completed" or analysis is None:
    raise RuntimeError("响应未完成或没有可用结构化结果，请检查状态与拒绝内容")
print(analysis.model_dump_json(indent=2))
```

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

表格比较的是正常完成且模型支持的输出模式。拒绝、输出预算耗尽、连接异常和不受支持的结构仍要独立处理，不能理解成所有响应无条件都是完整业务对象。结构符合模式只约束形状，不证明字段中的事实真实，也不授权字段里描述的动作。

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

这点非常重要：

```text
模型提出要调用工具。
真正执行工具的是你的代码。
```
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
        if set(args) != {"service"} or args["service"] != "order-api":
            raise ValueError("本课堂只允许查询合成的 order-api 数据")
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
    tool_choice="none",  # 本课堂只演示一轮工具查询，第二轮只生成总结
    input=input_list,
)

print(final_response.output_text)
```

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
text（文本）
  -> embedding（向量编码） vector
  -> vector database（向量数据库） search（搜索）
  -> relevant documents（相关文档）
  -> LLM（大语言模型） answer（回答） with retrieved context（上下文）
```

这就是 RAG 的基础。

## RAG 和 LLM 的关系

RAG 是 Retrieval-Augmented Generation，检索增强生成。

最小链路：

```text
user question（问题） / alert（告警）
  -> embedding（向量编码）
  -> vector search（向量搜索）
  -> retrieve（检索） runbook（操作手册） / incident（故障） docs
  -> assemble context（上下文）
  -> LLM（大语言模型） summary
  -> answer（回答） with citations（引用） / evidence（证据）
```

AIOps 场景：

```text
HighErrorRate alert（告警）
  -> search（搜索） similar incidents（相似故障）
  -> search（搜索） runbooks（操作手册）
  -> search（搜索） recent changes
  -> LLM（大语言模型） summarizes likely checks
```

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
更好的输出：

```text
候选原因：数据库连接池耗尽。
证据：日志摘要出现 database connection timeout increased；错误率和延迟同时上升。
缺失信息：没有连接池指标、数据库慢查询、实例重启信息。
置信度：0.62。
```

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
alert（告警） fingerprint
  -> Redis cache（缓存） key（键）
  -> cached LLM（大语言模型） summary
```

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
但不能直接决定：

```text
立即回滚生产版本。
```
## 生产架构

一个更稳的 AIOps LLM 服务可以这样设计：

```text
Alertmanager（告警管理器）
  -> FastAPI / webhook receiver（接口或回调接收服务）
  -> normalize（标准化） alert（告警）
  -> Redis dedup（Redis 去重）
  -> MySQL store（存储） raw event（事件）
  -> Kafka analysis topic（主题）
  -> worker（工作进程）
      -> query（查询） metrics/logs/changes/runbooks
      -> redact sensitive fields（脱敏敏感字段）
      -> call OpenAI API（调用 OpenAI 接口）
      -> validate（校验） structured output（结构化输出）
      -> store（存储） result（结果）
  -> UI / notification（页面展示或通知）
  -> human approval（人工审批）
  -> runbook（操作手册） automation（自动化）
```

为什么不要在 webhook 里直接调模型？

- webhook 要快速返回。
- 模型调用可能慢。
- 告警风暴会拖垮服务。
- 失败需要重试和补偿。
- 结果需要持久化和审计。

更好的方式：

```text
POST /alerts（提交告警的接口）
  -> returns 202 accepted（返回请求已接受而非处理已完成）
worker（工作进程）
  -> does LLM（大语言模型） analysis
GET /alerts/{id}/analysis（查询指定告警编号的分析结果）
  -> returns result（结果）
```

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

### requirements.txt

```text
openai
python-dotenv
pydantic
```

### .gitignore

```text
.env
.venv/
__pycache__/
```

### .env.example

```text
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-5.5
```

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
    if response.status != "completed" or summary is None:
        raise RuntimeError("响应未完成、被拒绝或解析结果为空，不发布摘要")
    print(summary.model_dump_json(indent=2))


if __name__ == "__main__":
    main()
```

### 运行

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python summarize_alert.py
```

PowerShell：

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
python summarize_alert.py
```

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

更进一步可以让人工给输出打分：

```text
0 = 有害或明显错误
1 = 没帮助
2 = 有部分帮助
3 = 可直接辅助值班
```

## 常用字段和 API 字典

### OpenAI

```python
client = OpenAI()
```

创建 SDK 客户端。默认从 `OPENAI_API_KEY` 读取 key。

### responses.create

```python
client.responses.create(model=model, input="...")
```

创建一次模型响应。

### responses.parse

```python
client.responses.parse(model=model, input="...", text_format=MyModel)
```

按 Pydantic 模型解析结构化输出。

### output_text

```python
response.output_text
```

读取模型输出的文本。

### output_parsed

```python
response.output_parsed
```

读取结构化输出解析后的对象。

### embeddings.create

```python
client.embeddings.create(model="text-embedding-3-small", input="...")
```

把文本转换成向量。

### tools

```python
tools = [{
    "type": "function",
    "name": "get_recent_deploys",
    "description": "查询一个服务的近期发布记录",
    "parameters": {
        "type": "object",
        "properties": {"service": {"type": "string"}},
        "required": ["service"],
        "additionalProperties": False,
    },
    "strict": True,
}]
```

告诉模型可请求哪些工具。这是 Responses API 的函数工具定义：`parameters` 约束参数对象，`required` 要求提供服务名，`additionalProperties` 禁止额外字段，`strict` 要求按该结构输出。它只描述调用契约，没有实现查询、更没有授予生产权限；应用还要校验服务是否在当前用户获批范围内，再执行前文的工具处理逻辑。

### function_call_output

```python
{"type": "function_call_output", "call_id": item.call_id, "output": "..."}
```

把工具执行结果交回模型。

### max_output_tokens

```python
max_output_tokens=800
```

限制输出长度。

### metadata

```python
metadata={"alert_id": "a-20260702-001", "service": "order-api"}
```

给请求附加业务元数据，便于追踪。

## 命令速查

### 安装

```bash
pip install openai python-dotenv pydantic
```

### 设置 key

```bash
export OPENAI_API_KEY="你的 key"
```

PowerShell：

```powershell
$env:OPENAI_API_KEY="你的 key"
```

### 最小调用

```bash
python hello_openai.py
```

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

## 老师带你拆开一次模型请求

你把告警事实交给模型，像请同事根据现有材料写一份初步分析。任务说明告诉它要产出什么，输入证据说明我们已经知道什么，工具定义说明程序允许申请哪些外部能力。模型生成文本或调用请求之后，应用仍负责校验、授权、执行与保存结果。

学生：“结构化输出符合 JSON Schema，就一定正确吗？”老师：“结构正确只说明字段和类型符合合同，不证明数据库真的故障，也不证明引用支持结论。”拒绝、响应未完成、超时和业务校验失败也要有分支。官方 [结构化输出说明](https://developers.openai.com/api/docs/guides/structured-outputs) 是格式能力入口，业务正确性仍要应用判断。

### Token、上下文与预算课堂

Token（分词单元）是模型处理文本的计量单位，不等于一个汉字或一个英文单词。输入越长，证据越可能被截断或稀释；输出预算不足也可能得到不完整响应。先保留关键指标、时间、服务身份、变更和来源，按相关性选择上下文，而不是把整份日志无差别塞进去。

延迟可拆成排队、请求建立、模型处理与输出传输。Streaming（流式输出）让用户更早看到部分内容，不代表整个任务更早完成；最终状态、结构校验和工具结果未就绪前，不能把半截文本当成正式可执行结论。

### 工具调用课堂：建议动作与实际执行分开验证

Function calling（函数调用请求）让模型输出工具名和参数。程序根据可信注册表找到工具，校验类型与业务范围，用调用者权限执行，再把结果返回给模型。模型不能通过参数里的租户、主机或路径字段自己获得更高权限。

读工具也要限定时间范围、返回行数和敏感字段，写工具还要绑定审批与幂等键。外部变更接口超时后，结果可能未知；再次调用前先用 operation ID 查询，避免把网络重试变成重复重启或重复工单。日志中的访问凭据与原始敏感内容不应被模型上下文和追踪平台无差别保存。

### 无付费调用的契约故障实验

先用合成响应测试应用判断，不需要 API Key。保存 `llm_contract_lesson.py` 并用 Python 3 执行：

```python
def validate_report(report, known_sources):
    if report.get('status') not in {'insufficient_evidence','needs_review'}:
        raise ValueError('不允许把初步分析直接标成已确认根因')
    if not set(report.get('source_ids',[])).issubset(known_sources):
        raise ValueError('引用了本次没有提供的证据')
    if report.get('execute_change') is not False:
        raise ValueError('摘要流程没有变更执行授权')

good = {'status':'needs_review','source_ids':['metric-1'],'execute_change':False}
validate_report(good, {'metric-1'})
bad = {**good,'source_ids':['invented-log']}
try:
    validate_report(bad, {'metric-1'})
except ValueError as error:
    print('DETECTED:',error)
validate_report(good, {'metric-1'})
print('PASS: 恢复后通过业务合同')
```

预期正常通过、虚构引用被发现、恢复后通过。代码只是本地业务校验，不证明模型一定不编造，也没有模拟供应商响应结构。进一步把 `execute_change` 改为 True，应该被拒绝。清理删除教学脚本即可；真实模型实验依前文执行并记录实际请求结果、版本和费用边界，不能把本地模拟说成 API 实测。

### 生产与面试课堂

发布物包括模型配置、提示词、工具结构、输出合同、检索版本和评估样本。模型名称或别名、可用能力和限额会变化，选型时核对官方文档及账户实际能力；没有用户指定的新模型迁移需求时，不为了教程自动切换既有模型。

重试有总预算、退避和停止条件；限额错误与认证错误不能用同一策略无限重试。降级可以返回已有规则与证据清单，明确暂未生成模型分析。评估同时看事实支持、引用、关键遗漏、结构、工具行为、延迟与成本，不能只看文字是否流畅。

30 秒讲模型是证据解释与结构化处理层，应用掌握权限与业务状态。3 分钟用告警摘要走输入合同、检索、生成、校验、人工决策与审计。事故题设置模型输出格式正确但引用不存在，先拦截结果、保存脱敏请求与版本，复现并修复来源校验，回归固定题集后灰度恢复。

## 老师带你把“模型回答”拆成四道验收

第一道是传输：应用是否成功拿到完整响应，还是只收到部分字节或发生超时。第二道是协议：响应处于什么状态，返回的是文本、工具调用还是拒绝。第三道是结构：字段、类型和枚举能否被程序解析。第四道才是业务：引用是否存在、数字是否一致、建议是否越权、证据是否支持结论。

学生说“返回成功状态码就写入正式事故结论”，老师会追问：输出预算不足的响应怎么办？模型拒绝怎么办？工具请求尚未执行怎么办？这些都不能用一个空字符串代替，然后标为分析完成。业务状态应明确区分待处理、处理中、待人工复核、分析可用、降级可用和失败。

`output_text` 是 SDK 为读取文本提供的方便属性，不是响应里所有信息的总和。工具调用可能存在于其他输出项目中，纯文本为空不一定意味着模型没工作。手动管理多轮上下文时保留官方要求的输出项目，不应只截取一句文本后丢弃调用标识和必要状态。

本课保留已有 `gpt-5.5` 示例，不要求为了学习切换更新型号。官方模型页列出的能力，不证明你的项目账户一定有访问权限。真实实验应核实账户许可、区域可用性和预算，并记录实际模型标识、SDK 版本及请求时间；不要把别名永远视为不可变快照。

输入输出预算也不是“最多八百个汉字”。词元与汉字没有固定一一对应，某些推理模型的输出预算还涵盖非展示部分的处理开销。限制很小可能让看似短小的任务无法完成。遇到未完成状态，先检查原因和用量，不要重复把半截内容拼成一份假装完整的结构化报告。

### 证据存在与证据支持结论是两件事

假设输入来源一是“数据库连接超时增加”，来源二是“最近有发布”。模型引用两个真实编号，仍不能推出“发布把连接池容量改小了”。缺失的证据包括配置差异、连接池使用率、数据库等待和变更影响范围。引用校验能挡住虚构编号，却不能自动完成因果论证。

设计上下文时给每条证据稳定编号、来源系统、查询窗口、采集时间、过滤条件和状态。状态至少区分查询成功且有结果、成功但为空、查询失败和未查询。否则模型可能把接口超时后的空数组解释成“没有错误日志”，从而错误排除日志支持的故障方向。

数字也要带分母和单位。错误率百分之二十三需要知道样本量、统计窗口与请求范围；延迟一千八百毫秒是哪个分位、哪个接口、哪种聚合？发布前后流量不同，指标上涨可能受混合流量影响。将这些上下文交给模型，比给它一个没有口径的漂亮数字更重要。

`confidence` 应解释为模型给出的主观评分或排序辅助，不是经过校准的发生概率。不能因为分数超过零点九，就绕过人工审批执行回滚。若要把分数用于分流，需要在独立标注数据上检验它与真实正确率的关系，并持续观察场景变化后的失准。

`safe_actions` 同样只是字段名，不是安全证明。模型把“删除缓存目录”写进这个列表，也不改变操作本身的风险。输出校验应把建议映射到允许的动作类型，无法映射的内容只能展示给人，不能通过字符串包含某个词就自动执行。

## 真实基础实验的预期、核对与清理

运行 `summarize_alert.py` 前，在一个不存在同名文件的新课堂目录放齐示例，并确认 `.env` 不会覆盖自己的已有密钥文件。使用合成数据，先检查模型权限与费用预算，再决定发起请求。这个调用会把输入发送到外部服务，不能把生产日志当作无成本、无数据边界的随手测试。

预期不是得到完全相同的中文句子，而是拿到可解析摘要，包含服务名、错误率与延迟事实，列出候选原因和缺失信息。发布时间可能相关，但不能写成已经证实的根因；也不应出现本次上下文没有的主机、告警或配置变更。把字段验证和人工事实核对分别记录。

验证先看终态与解析对象，再对照输入逐项核对数字和来源。若摘要提到连接池耗尽，检查它写的是候选还是定论；没有连接池指标时必须保留缺失信息。重复运行可能措辞不同，所以不要用整段文本完全相等作为唯一通过标准，也不要声称跑一次就证明长期稳定。

如果出现认证错误，检查密钥读取位置和所属项目，不打印密钥来调试。模型不可用时检查型号和权限；限额错误检查错误类型和账户用量，而不是无上限重试。解析为空时检查是否拒绝或未完成；网络超时先保留脱敏请求标识，不立即启动多份重复任务。

向量实验预期返回固定长度的数值数组，并能计算相似度排序；不承诺任何两句话的分数永远一样。课堂里的第一条历史描述在语义上通常更接近查询，但这是待观察的预期，不是已经运行的结果。向量相似并不证明两次事故根因一致，应继续核对服务、版本和故障证据。

清理时退出脚本、撤销本课堂不再使用的临时密钥，并删除自己的 `.env` 或继续安全保管。删除本地文件不等于远端请求及日志立即不存在；是否保存响应、保留多久、能否删除，要对照项目的数据控制和服务条款。不要在学习记录里承诺从未验证的零留存。

## 第二个离线实验：把超时、虚构证据和拒绝分开

前面的无付费课堂演示业务引用校验，这里再模拟应用终态分流。只需要 Python 三点十一以上，保存为 `response_gate_lesson.py`，执行 `python response_gate_lesson.py`。不导入 OpenAI SDK、不读取环境密钥、不访问网络，输入是教学字典而非完整供应商响应。

```python
def gate(response, sources):
    if response["status"] != "completed":
        return "degraded"
    if response.get("refusal"):
        return "needs_review"
    report = response.get("report")
    if not isinstance(report, dict):
        return "invalid"
    ids = report.get("source_ids")
    if not isinstance(ids, list) or not ids or not all(isinstance(x, str) for x in ids):
        return "invalid"
    if not set(ids).issubset(sources):
        return "invalid"
    if report.get("execute_change") is not False:
        return "invalid"
    return "needs_review"

normal = {"status": "completed", "report": {
    "source_ids": ["metric-1"], "execute_change": False}}
cases = [
    ("normal", normal, "needs_review"),
    ("incomplete", {**normal, "status": "incomplete"}, "degraded"),
    ("refusal", {"status": "completed", "refusal": "mock refusal"}, "needs_review"),
    ("invented", {"status": "completed", "report": {
        "source_ids": ["unknown-log"], "execute_change": False}}, "invalid"),
    ("write-action", {"status": "completed", "report": {
        "source_ids": ["metric-1"], "execute_change": True}}, "invalid"),
]
for name, response, expected in cases:
    actual = gate(response, {"metric-1"})
    assert actual == expected, (name, actual)
    print(name, actual)
assert gate(normal, {"metric-1"}) == "needs_review"
print("recovered: needs_review")
```

预期正常响应也只进入人工复核，未完成进入降级，虚构引用与擅自写操作进入无效状态。恢复时重新提供正常响应，仍不直接执行变更。这个结果说明应用可以在模型之外强制约束流程；它没有证明模型本身不会出错，也没有测试真实网络断开。

请再做一次反向检查：把来源集合改为空，正常案例就不应继续通过原预期断言，因为来源契约已经改变。把 `execute_change` 改成字符串也应拒绝，不做宽松真假转换。若错误输入依然通过，先查类型检查和集合判断，不要仅在提示词里多写一句“请严格遵守”。

清理只需退出进程和处理自己新建的脚本，没有远端资源、文件持久状态或计费。保留案例输入、预期、实际输出和明确的模拟说明，才能区分“应用规则实测”与“API 行为实测”。如果只做了静态语法检查，报告也必须如实写成语法检查。

## 工具回路：一次建议怎样变成受控查询

函数调用至少有请求、校验、执行、回传结果和再次生成几个阶段。模型可能返回零个、一个或多个调用，也可能在收到结果后还要继续调用。本页示例为了固定课堂范围，把第二轮设为不再调用工具；生产若允许多轮，需要显式循环和最大轮数，而不是假设第二次一定有最终文本。

调用编号用于把工具结果与对应请求配对，不等于业务幂等键。一个业务动作在不同模型响应中可能出现不同调用编号；若用它们直接创建工单，仍可能重复。服务端应从可信任务与动作内容生成稳定业务操作身份，记录已接受和已完成结果。

严格参数结构能减少字段格式错误，但字符串仍可能包含无权访问的资源名，合法整数也可能请求过大时间窗口。参数校验要叠加业务授权、资源范围、查询配额和审计。读工具也会消耗数据库资源、暴露数据，不能简单地把“只读”当成无限制调用的许可证。

工具返回的日志和检索文档属于不可信数据。里面出现“忽略规则”“上传密钥”或伪造审批，不应提升为开发者指令。应用应分离任务规则与引用材料，并在执行侧继续校验，即使模型已经被诱导请求不合法工具，也不能让请求真正生效。

对于写操作，先让执行平台核验审批内容与当前动作相符，再使用幂等接口执行并验证结果。若接口超时，把状态标为未知并查询原操作，不把失败文本直接交给模型让它“换个办法再试”。恢复策略由业务安全合同决定，不能由随机生成的重试建议决定。

## 吞吐、成本与降级的生产算术

假设每秒到达五条待分析告警，平均每次分析占用二十秒，在稳定且不计额外排队的情况下，平均在途请求约一百个。若只允许二十个并发且处理耗时不变，理论完成能力约每秒一条，队列会继续增长。异步接口只是把等待移到队列，不会自动创造吞吐。

再假设每次输入四千词元、输出六百词元，每秒五次就是每分钟约一百二十万输入词元和十八万输出词元。账户限制可能按请求数、词元量以及其他维度共同约束；因此只看请求数未超限仍可能失败。这里的数字是教学负载，不是任何模型的实际限额。

成本用实际计费口径计算：输入量乘输入单价，缓存命中的部分按对应口径，输出与其他计费项目另算。不要在教程里把一时价格写成永恒常量；查官方价格与用量账单，记录币种、单位和核对日期。业务更应关注每条有效摘要成本，而不是只有每次成功请求成本。

重试会放大告警风暴。需要总期限、有限次数、退避和抖动，并协调 SDK 内置重试与任务系统重试，避免两层各重试多次形成乘法。认证错误通常需要修复配置，不应反复调用；额度耗尽也不会因为毫秒级重试而恢复。保留失败分类，才知道何时该停止。

降级应返回原始规则结论、证据摘要和“模型分析暂不可用”的标识，不能返回旧摘要却显示为最新分析。缓存键必须考虑租户、权限范围、证据窗口、提示词版本、模型及输出合同；只按服务名缓存，会把不同时间或不同权限的事故材料混在一起。

模型供应商的高可用不能由你在应用里启动第二个进程实现。你能控制的是任务持久化、幂等处理、超时隔离、限流和经过评估的备用路线。更换供应商可能改变数据所在地、能力、格式和合规边界，需要明确授权与评估，不是故障时偷偷发送同一批敏感日志的理由。

## 数据控制、升级回退和事故回答

`store` 用于响应保存行为，不等价于控制所有服务端日志或获得零数据留存资格。对敏感场景，应核对组织的实际数据控制、端点能力及留存要求。以 [OpenAI 数据控制说明](https://developers.openai.com/api/docs/guides/your-data) 为入口，不从一个布尔参数推导出未经证实的合规结论。

发布单元至少包括模型配置、提示词、工具结构、上下文筛选、输出模式和校验器。单独改提示词也会改变业务行为，应该进入版本和回归流程。模型切换时先使用固定脱敏样本做离线比较，再影子运行、不执行动作，最后按限定流量灰度，设置可解释的回退阈值。

回退不是只把模型名改回去。如果新版本输出增加了字段、改变了严重程度分流或生成了外部工单，旧代码可能不能读取新记录，已经发生的动作也不会自动撤销。设计兼容读取、稳定任务编号和结果版本，回退后继续对账，必要时暂停自动化而保留只读分析。

三十秒答案：我把 LLM 用在 AIOps 的证据解释与结构化提取层，先查询、脱敏和整理上下文，再生成候选分析。应用独立检查响应状态、结构与事实引用，权限、审批和执行仍由确定性系统掌握。模型不可用时保留规则与证据，不让告警处理完全依赖生成服务。

三分钟答案第一段讲数据路径：告警入口落库并入队，工作进程按时间窗口查询指标、日志、变更和手册，形成带来源的上下文。模型返回结构化候选原因与缺失信息。校验器检查数字和引用，人工复核再决定行动，所有版本和状态可以追溯。

第二段讲机制与取舍：结构化输出改善机器可读性，不保证事实；函数调用是模型提出请求，应用负责授权执行；向量检索提高找到相关材料的机会，不证明根因。上下文越多不一定更好，要平衡证据完整、噪声、成本和延迟；状态未完成时不能发布半成品。

第三段讲生产验证：用固定案例覆盖正常、缺证据、冲突证据、提示注入、工具越权和模型不可用，分别衡量事实支持、关键遗漏、拒绝正确性、延迟和成本。上线有队列、限流、有限重试、降级与版本回退，评估结果和业务结果一起决定是否扩大流量。

事故题“JSON 完全合法却自动回滚错服务”应先阻断执行路径，核对真实受影响资源并按既有恢复方案处置，再检查身份来源、工具参数、审批绑定和输出校验。根因不能简单归为模型幻觉；若不可信的服务名能越过授权，应用本身存在必须修复的安全边界。

追问“增加提示词能否保证安全”，答案是提示词只能降低某些错误概率，不能替代执行层授权。追问“引用都存在为什么仍误判”，答案是存在性与支持关系不同，还要检查时间对齐、指标口径和反证。设计题最终应交出一条可审计的决策链，而不是一句“我用了更强的模型”。

## 本课 GitHub 学习证据

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
