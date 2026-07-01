# RAG

## 官方资料

- [LangChain RAG tutorial](https://docs.langchain.com/oss/python/langchain/rag)
- [OpenAI embeddings guide](https://developers.openai.com/api/docs/guides/embeddings)
- [Chroma docs](https://docs.trychroma.com/docs/overview/introduction)
- [Milvus quickstart](https://milvus.io/docs/quickstart.md)

> 学习说明：本篇把官方 RAG 教程的“加载文档、切分、向量化、检索、生成”主线，改造成 AIOps runbook / 故障案例问答助手。

## 为什么要学

LLM 如果只靠模型自身记忆，容易编造内部系统细节。RAG 让模型先检索你的 runbook、事故复盘、服务说明和历史工单，再基于检索结果回答问题，更适合企业知识库和 AIOps 助手。

## 它解决什么问题

- 让 LLM 基于内部文档回答。
- 从大量 runbook 和故障案例中找相似内容。
- 降低凭空猜测的概率。
- 给回答附带可追溯上下文。
- 支持值班问答、故障摘要和新人成长。

## 是什么

RAG 是 Retrieval Augmented Generation，中文常叫“检索增强生成”。它的核心思想是：回答问题前，先从你的知识库里检索相关资料，再把资料和问题一起交给 LLM。

在 AIOps 中，RAG 适合解决：

- 值班同事忘了某个服务的 runbook。
- 历史事故报告很多，人工搜索慢。
- 新人不知道相似故障以前怎么处理。
- LLM 需要基于内部文档回答，而不是凭空猜。

## 核心原理

RAG 分两条链路。

### 离线入库链路

```text
runbook markdown / incident reports / wiki pages
  -> document loader
  -> text splitter
  -> embedding model
  -> vector database
```

### 在线问答链路

```text
user question
  -> embedding
  -> vector search
  -> top-k relevant chunks
  -> prompt with context
  -> LLM answer
  -> citations / source links
```

RAG 的关键不是“用了大模型”，而是“回答必须贴着可检索的资料”。

## 架构

```text
docs/
  runbooks/
  incidents/
  service-notes/
    -> ingestion script
      -> chunks
      -> embeddings
      -> vector db
        -> retriever
          -> LLM
            -> answer with sources
```

AIOps RAG 的资料源可以是：

- Runbook。
- 故障复盘 RCA。
- 服务架构说明。
- 变更规范。
- 值班手册。
- 常见错误码说明。

## 安装

下面用 LangChain + Chroma + OpenAI 做最小练习：

```bash
python -m venv .venv
. .venv/bin/activate
pip install langchain langchain-openai langchain-chroma chromadb python-dotenv
```

Windows PowerShell：

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install langchain langchain-openai langchain-chroma chromadb python-dotenv
```

设置 API key：

```bash
export OPENAI_API_KEY="你的 key"
```

## 准备文档

目录：

```text
projects/rag-runbook-assistant/
  docs/
    order-api-runbook.md
    payment-api-runbook.md
  ingest.py
  ask.py
  README.md
```

`docs/order-api-runbook.md`：

```md
# order-api Runbook

## HighErrorRate

现象：order-api 5xx 错误率超过 10%。

优先检查：
1. 最近 30 分钟是否有发布。
2. 数据库连接池是否耗尽。
3. payment-api 是否有 5xx。
4. p95 延迟是否同时升高。

建议动作：
1. 如果刚发布，优先评估回滚。
2. 如果数据库连接池耗尽，检查慢 SQL 和连接数。
3. 如果下游 payment-api 异常，联系支付服务负责人。
```

## 文档切分

切分的原因：LLM 和 embedding 都不适合一次处理无限长文档。把文档拆成 chunk，检索时只取相关片段。

常见参数：

| 参数 | 含义 | 建议 |
|---|---|---|
| `chunk_size` | 每块文本长度 | runbook 可从 500 到 1000 试起 |
| `chunk_overlap` | 块之间重叠 | 50 到 150，避免上下文断裂 |
| metadata | 来源信息 | 必须保存文件名、标题、服务名 |

## 入库脚本

`ingest.py`：

```python
from pathlib import Path

from dotenv import load_dotenv
from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_openai import OpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

load_dotenv()

docs = []
for path in Path("docs").glob("*.md"):
    text = path.read_text(encoding="utf-8")
    docs.append(Document(page_content=text, metadata={"source": str(path)}))

splitter = RecursiveCharacterTextSplitter(
    chunk_size=800,
    chunk_overlap=120,
)
chunks = splitter.split_documents(docs)

embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

vectorstore = Chroma(
    collection_name="aiops_runbooks",
    embedding_function=embeddings,
    persist_directory="./chroma_db",
)

vectorstore.add_documents(chunks)

print(f"indexed {len(chunks)} chunks")
```

运行：

```bash
python ingest.py
```

## 问答脚本

`ask.py`：

```python
import os

from dotenv import load_dotenv
from langchain_chroma import Chroma
from langchain_openai import ChatOpenAI, OpenAIEmbeddings

load_dotenv()

question = "order-api 5xx 错误率升高时应该先检查什么？"

embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
vectorstore = Chroma(
    collection_name="aiops_runbooks",
    embedding_function=embeddings,
    persist_directory="./chroma_db",
)

docs = vectorstore.similarity_search(question, k=3)

context = "\n\n".join(
    f"来源：{doc.metadata.get('source')}\n内容：{doc.page_content}"
    for doc in docs
)

prompt = f"""
你是 AIOps 值班助手。请只根据下面资料回答问题。
如果资料不足，请回答“资料不足”。

问题：
{question}

资料：
{context}
"""

model = ChatOpenAI(model=os.getenv("OPENAI_MODEL", "gpt-5.5"))
answer = model.invoke(prompt)

print(answer.content)
print("\n来源：")
for doc in docs:
    print("-", doc.metadata.get("source"))
```

运行：

```bash
python ask.py
```

## 检索质量

RAG 的效果首先看检索，不是先怪模型。

检查方法：

```python
docs = vectorstore.similarity_search("数据库连接池耗尽怎么办", k=5)
for doc in docs:
    print(doc.metadata)
    print(doc.page_content[:200])
    print("-" * 40)
```

如果检索不到正确文档：

- 文档太少。
- 文档没有关键术语。
- chunk 太大或太小。
- metadata 不够。
- 问题和文档语言不一致。
- embedding 模型或向量库配置有问题。

## 提示词约束

AIOps RAG 的回答必须保守：

```text
你是 AIOps 值班助手。
要求：
1. 只根据提供的资料回答。
2. 不要编造资料里没有的命令、服务名、负责人。
3. 每条建议后写出依据来源。
4. 如果资料不足，明确写“资料不足”，并列出需要补充的资料。
5. 不要自动建议危险操作，例如删除数据、重启集群、回滚生产，除非资料明确要求且需要人工审批。
```

## RAG 与普通 LLM 的区别

| 方式 | 优点 | 风险 |
|---|---|---|
| 普通 LLM | 快速总结、泛化强 | 容易不知道内部事实 |
| RAG | 可基于内部文档回答 | 依赖文档质量和检索质量 |
| 规则系统 | 稳定可控 | 覆盖范围有限 |

AIOps 中通常三者结合：

```text
规则兜底
  + RAG 提供内部知识
  + LLM 负责组织语言和推理辅助
```

## AIOps 中的作用

RAG 是 AIOps 的“知识连接层”：

```text
runbook / RCA / architecture docs
  -> vector database
  -> query by alert context
  -> LLM answer with sources
  -> on-call engineer review
```

它帮助新人和一线值班快速找到“公司自己的答案”。

## 入门练习：Runbook 问答助手

要求：

1. 准备 2 个服务 runbook。
2. 编写 `ingest.py` 入库。
3. 编写 `ask.py` 提问。
4. 输出回答和来源文件。
5. README 记录 3 个问题和回答截图。

建议问题：

```text
order-api 错误率升高先看什么？
payment-api 延迟高可能是什么原因？
如果最近刚发布，处理顺序是什么？
```

## 常见故障

### 找不到模块

检查安装：

```bash
pip install langchain langchain-openai langchain-chroma chromadb
```

### 没有 API key

```bash
export OPENAI_API_KEY="你的 key"
```

### 检索结果为空

确认：

- `ingest.py` 已运行。
- `persist_directory` 一致。
- collection name 一致。
- `docs/` 里确实有 md 文件。

### 回答编造

处理：

- 提示词加“只根据资料回答”。
- 输出来源。
- 如果资料不足，要求明确说明。
- 对回答做人工 review。

## 学习检查清单

- [ ] 我能解释 RAG 的离线入库和在线检索链路。
- [ ] 我能切分 Markdown runbook。
- [ ] 我能生成 embedding 并写入向量库。
- [ ] 我能根据问题检索相似文档片段。
- [ ] 我能把检索片段和问题一起交给 LLM。
- [ ] 我能说明 RAG 不能完全消除幻觉。

## 面试题

1. RAG 解决了 LLM 的什么问题？
2. RAG 的离线链路和在线链路分别是什么？
3. chunk size 过大或过小会有什么影响？
4. embeddings 在 RAG 中的作用是什么？
5. 向量检索和关键词检索有什么区别？
6. 为什么回答需要引用检索到的上下文？
7. 如何评估 RAG 回答质量？
8. RAG 如何用于 AIOps runbook 助手？

## 学习证据

学完后，在 GitHub 留下：

- 2 到 3 篇 runbook 文档。
- `ingest.py` 和 `ask.py`。
- 3 个问题的回答结果。
- README 解释 RAG 的离线入库和在线检索链路。
- 说明当前系统的限制。
