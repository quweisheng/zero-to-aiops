# LLM / OpenAI API

## 官方资料

- [OpenAI API quickstart](https://developers.openai.com/api/docs/quickstart)
- [OpenAI text generation and prompting](https://developers.openai.com/api/docs/guides/text)
- [OpenAI embeddings guide](https://developers.openai.com/api/docs/guides/embeddings)
- [OpenAI API reference](https://developers.openai.com/api/docs/api-reference)

> 学习说明：本篇只参考 OpenAI 官方文档路线，重点学习 API key、Responses API、提示词、结构化输出、工具调用思路、embeddings，以及它们在 AIOps 中如何落地。

## 为什么要学

LLM 能把告警、日志、变更和 runbook 变成人更容易理解的摘要和建议。对运维转 AIOps 来说，LLM 的价值不是“自动替你判断一切”，而是作为解释层、总结层和交互层，提高排障效率。

## 它解决什么问题

- 把多源上下文生成事故摘要。
- 把 PromQL、SQL、日志查询结果翻译成人话。
- 根据 runbook 生成排障建议。
- 生成结构化 JSON 供自动化系统继续处理。
- 通过 embeddings 支持语义检索和 RAG。

## 是什么

LLM 是大语言模型，OpenAI API 是把模型能力接入程序的一种方式。AIOps 里 LLM 不应该直接替代监控系统，而应该作为“分析、总结、解释、生成建议”的助手。

典型用途：

- 把告警、日志、变更整理成事故摘要。
- 根据 runbook 生成排障步骤。
- 把 PromQL、SQL、日志查询结果翻译成人话。
- 对重复告警做归因候选。
- 给值班工程师生成初步沟通文案。

## 核心原理

最小调用流程：

```text
your code
  -> OpenAI SDK
  -> Responses API
      -> model
      -> input
      -> instructions
      -> tools optional
  -> response.output_text
```

一个好的 AIOps LLM 调用由四部分组成：

| 部分 | 说明 | 示例 |
|---|---|---|
| 角色 | 让模型知道身份 | 你是 AIOps 值班助手 |
| 上下文 | 提供事实 | 告警、指标、日志、变更 |
| 任务 | 明确要产出什么 | 生成排障摘要 |
| 约束 | 限制格式和边界 | 不确定时说不知道，不编造 |

## API Key

不要把 API key 写入代码或 GitHub。

设置环境变量：

```bash
export OPENAI_API_KEY="你的 key"
```

Windows PowerShell：

```powershell
$env:OPENAI_API_KEY="你的 key"
```

长期保存可以使用系统环境变量或 `.env`，但 `.env` 必须加入 `.gitignore`。

`.gitignore`：

```text
.env
```

## 安装 SDK

```bash
python -m venv .venv
. .venv/bin/activate
pip install openai python-dotenv
```

Windows PowerShell：

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install openai python-dotenv
```

## 第一个 Responses API 调用

官方 quickstart 使用 Responses API。下面是 AIOps 版本的最小调用：

```python
from openai import OpenAI

client = OpenAI()

response = client.responses.create(
    model="gpt-5.5",
    instructions="你是一个严谨的 AIOps 值班助手，只根据输入事实回答。",
    input="服务 order-api 的 5xx 错误率从 1% 升到 23%，p95 延迟从 120ms 升到 1800ms。请给出初步判断。",
)

print(response.output_text)
```

说明：

- `model` 使用你账号可用且官方文档推荐的模型。为了长期维护，也可以改成环境变量。
- `instructions` 放稳定角色和规则。
- `input` 放本次请求的事实。
- `response.output_text` 是最常见的文本输出读取方式。

更稳的模型配置：

```python
import os
from openai import OpenAI

client = OpenAI()
model = os.getenv("OPENAI_MODEL", "gpt-5.5")

response = client.responses.create(
    model=model,
    instructions="你是一个严谨的 AIOps 值班助手。",
    input="请解释什么是告警降噪。",
)

print(response.output_text)
```

## 提示词模板

AIOps 告警分析提示词：

```text
你是一个 AIOps 值班助手。

要求：
1. 只根据输入事实分析。
2. 不确定时明确写“信息不足”。
3. 输出包含：现象、可能原因、建议检查、建议动作、需要补充的信息。
4. 不要编造不存在的日志、指标或变更。

输入：
- 告警：{alert}
- 指标：{metrics}
- 日志摘要：{logs}
- 最近变更：{changes}
```

Python 拼装：

```python
prompt = f"""
你是一个 AIOps 值班助手。

要求：
1. 只根据输入事实分析。
2. 不确定时明确写“信息不足”。
3. 输出包含：现象、可能原因、建议检查、建议动作、需要补充的信息。
4. 不要编造不存在的日志、指标或变更。

输入：
- 告警：{alert}
- 指标：{metrics}
- 日志摘要：{logs}
- 最近变更：{changes}
"""
```

## 结构化输出思路

工程里不要只依赖自由文本。你可以要求模型输出 JSON，方便程序继续处理。

提示词约束：

```text
请只输出 JSON，不要输出 Markdown。字段包括：
- summary: 字符串
- severity: info/warning/critical
- possible_causes: 字符串数组
- next_checks: 字符串数组
- confidence: 0 到 1 的数字
```

调用：

```python
response = client.responses.create(
    model=model,
    instructions="你是 AIOps 值班助手。输出必须是合法 JSON。",
    input=prompt,
)

print(response.output_text)
```

生产中要对 JSON 做解析和校验，不能假设模型永远输出完美格式。

## Embeddings

Embedding 是把文本转换成向量。向量之间的距离可以表示语义相似度。

AIOps 中 embeddings 的用途：

- 相似告警检索。
- 相似故障案例检索。
- runbook 语义搜索。
- 把历史事故报告接入 RAG。

官方 embeddings 文档给出的核心模式是：把输入文本和 embedding 模型名发送到 embeddings API。

示例：

```python
from openai import OpenAI

client = OpenAI()

result = client.embeddings.create(
    model="text-embedding-3-small",
    input="order-api 5xx error rate is high after deployment",
)

vector = result.data[0].embedding
print(len(vector))
print(vector[:5])
```

向量不能直接给人读，但可以保存到向量数据库做相似度检索。

## AIOps 上下文拼装

不要把所有日志原文一股脑塞给模型。先整理事实。

推荐结构：

```python
context = {
    "alert": {
        "service": "order-api",
        "name": "HighErrorRate",
        "severity": "critical",
        "started_at": "2026-07-01T09:10:00Z",
    },
    "metrics": {
        "error_rate": "23%",
        "p95_latency_ms": 1800,
        "request_rate": 700,
    },
    "logs": [
        "database connection timeout increased",
        "upstream payment-api returned 5xx",
    ],
    "changes": [
        "order-api deployed version 2026.07.01.1 at 09:02",
    ],
}
```

再让模型基于上下文分析：

```python
import json

response = client.responses.create(
    model=model,
    instructions="你是 AIOps 值班助手。只根据 JSON 上下文分析，不要编造。",
    input=json.dumps(context, ensure_ascii=False),
)
```

## 安全边界

LLM 在 AIOps 中必须有边界：

- 不把密钥、token、用户隐私、内部敏感信息发给外部 API。
- 不让模型直接执行危险命令。
- 不让模型绕过审批做重启、扩容、回滚。
- 对模型建议保持人工确认。
- 所有输入和输出要记录审计。
- 不确定时让模型说“不确定”，不要强行给结论。

## 成本和稳定性

工程中要考虑：

| 项目 | 建议 |
|---|---|
| 超时 | 给 API 调用设置超时 |
| 重试 | 只对可重试错误做有限重试 |
| 缓存 | 相同告警摘要可缓存到 Redis |
| 限流 | 告警风暴时保护 API 调用量 |
| 降级 | LLM 不可用时返回规则分析 |
| 日志 | 记录 request id、耗时、模型、结果 |

伪代码：

```python
def analyze_with_fallback(context):
    cached = get_from_cache(context)
    if cached:
        return cached

    try:
        result = call_openai(context)
        save_to_cache(context, result)
        return result
    except Exception as exc:
        return rule_based_summary(context, error=str(exc))
```

## AIOps 中的作用

LLM 的合理位置：

```text
observability data
  -> rules / anomaly detection
  -> structured facts
  -> LLM summary and reasoning assistant
  -> human review
  -> runbook action with approval
```

不要让 LLM 直接替代监控、数据库、权限系统和审批流程。它更适合做“解释层”和“协作层”。

## 入门练习：告警摘要助手

目录建议：

```text
projects/openai-alert-summarizer/
  README.md
  summarize_alert.py
  sample_alert.json
  .env.example
```

`.env.example`：

```text
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-5.5
```

`sample_alert.json`：

```json
{
  "alert": {
    "service": "order-api",
    "name": "HighErrorRate",
    "severity": "critical"
  },
  "metrics": {
    "error_rate": "23%",
    "p95_latency_ms": 1800
  },
  "logs": [
    "database connection timeout increased"
  ],
  "changes": [
    "deployed version 2026.07.01.1 at 09:02"
  ]
}
```

`summarize_alert.py`：

```python
import json
import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI()
model = os.getenv("OPENAI_MODEL", "gpt-5.5")

with open("sample_alert.json", "r", encoding="utf-8") as f:
    context = json.load(f)

response = client.responses.create(
    model=model,
    instructions=(
        "你是 AIOps 值班助手。只根据输入 JSON 分析。"
        "输出包含：现象、可能原因、建议检查、建议动作、信息不足。"
    ),
    input=json.dumps(context, ensure_ascii=False),
)

print(response.output_text)
```

运行：

```bash
cp .env.example .env
python summarize_alert.py
```

记得不要提交真实 `.env`。

## 常见故障

### 没有 API key

```text
OPENAI_API_KEY is not set
```

处理：

```bash
export OPENAI_API_KEY="你的 key"
```

Windows PowerShell：

```powershell
$env:OPENAI_API_KEY="你的 key"
```

### 模型不可用

如果模型名对你的账号不可用：

- 到官方文档确认当前推荐模型。
- 到控制台确认账号权限。
- 使用环境变量切换模型。

### 输出不稳定

处理方向：

- 提示词更具体。
- 输入结构化。
- 要求“不确定就说信息不足”。
- 输出 JSON 后做程序校验。

### 成本过高

处理方向：

- 不传无关日志。
- 先用规则筛选。
- 缓存重复告警。
- 告警风暴时限流。

## 学习检查清单

- [ ] 我能安全管理 API key，不提交到 GitHub。
- [ ] 我能发起一次最小 OpenAI API 调用。
- [ ] 我能写清楚 system/developer/user 指令的边界。
- [ ] 我能让模型输出结构化 JSON。
- [ ] 我能解释 embeddings 的用途。
- [ ] 我能设计一个告警摘要 prompt。

## 面试题

1. LLM 在 AIOps 中适合做什么，不适合做什么？
2. 为什么不能让 LLM 直接无审批执行生产修复？
3. API key 应该如何管理？
4. 什么是结构化输出？为什么重要？
5. embeddings 和普通文本生成有什么区别？
6. 如何降低告警摘要的幻觉风险？
7. LLM 如何结合 runbook automation？
8. 如何评估一个 AIOps LLM 助手是否有用？

## 学习证据

学完后，在 GitHub 留下：

- `sample_alert.json`。
- `summarize_alert.py`。
- `.env.example`，不要提交真实 `.env`。
- 一份模型输出样例，可脱敏后放入 `README.md`。
- README 解释：输入事实、提示词、输出字段、安全边界。
