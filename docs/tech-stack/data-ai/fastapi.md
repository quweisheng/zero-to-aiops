# FastAPI

> 目标：不是只会写一个 `@app.get("/")`，而是能理解 FastAPI 的请求链路、路径操作、参数解析、Pydantic 校验、响应模型、依赖注入、异常处理、中间件、OpenAPI 文档、测试、项目拆分、部署方式，并能把 AIOps 里的告警接收、异常检测、runbook 调用、LLM 摘要封装成可被系统调用的 HTTP API。

## 官方资料

先认清今天的工具：Python 是运行代码的解释器，虚拟环境是给本课单独放依赖的目录，HTTP 请求包含方法、路径、请求头和可选正文。JSON 是传输结构化数据的文本格式，不是数据库。本课使用 Python 3.11 或 3.12；前者是后文 `StrEnum` 的最低要求。只需补读 [Python](../foundation/python.md) 的函数、字典、类型注解和虚拟环境部分。

在新建且不含业务文件的 `fastapi-classroom` 目录工作，预留本机 8000 端口。不要把各节同名路由全部粘进一个文件：前面的短片段分别演示概念，完整基础实验以“入门实验：告警分析 API”的 `main.py` 为准。第一次运行依赖解析成功后保存实际依赖锁定清单；文中的无版本安装只是发现环境的入口，不是可直接复用的生产发布清单。

优先读这些官方资料：

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Tutorial - User Guide](https://fastapi.tiangolo.com/tutorial/)
- [First Steps](https://fastapi.tiangolo.com/tutorial/first-steps/)
- [Path Parameters](https://fastapi.tiangolo.com/tutorial/path-params/)
- [Query Parameters](https://fastapi.tiangolo.com/tutorial/query-params/)
- [Request Body](https://fastapi.tiangolo.com/tutorial/body/)
- [Response Model - Return Type](https://fastapi.tiangolo.com/tutorial/response-model/)
- [Dependencies](https://fastapi.tiangolo.com/tutorial/dependencies/)
- [Handling Errors](https://fastapi.tiangolo.com/tutorial/handling-errors/)
- [Middleware](https://fastapi.tiangolo.com/tutorial/middleware/)
- [CORS](https://fastapi.tiangolo.com/tutorial/cors/)
- [Background Tasks](https://fastapi.tiangolo.com/tutorial/background-tasks/)
- [Bigger Applications - Multiple Files](https://fastapi.tiangolo.com/tutorial/bigger-applications/)
- [Testing](https://fastapi.tiangolo.com/tutorial/testing/)
- [Settings and Environment Variables](https://fastapi.tiangolo.com/advanced/settings/)
- [Deployment](https://fastapi.tiangolo.com/deployment/)
- [Starlette Documentation](https://www.starlette.io/)
- [Pydantic Documentation](https://docs.pydantic.dev/latest/)
- [Uvicorn Documentation](https://www.uvicorn.org/)

说明：本文按 FastAPI 官方教程主线整理，用 AIOps 场景重新讲解，不复制官方全文。

## 场景开场

你已经写了一个异常检测脚本：

```bash
python detect.py --service order-api --window 5m
```

本地能跑，结果也看起来不错。但一进入 AIOps 系统，问题马上出现：

- Alertmanager 怎么把告警发给这个脚本？
- 前端怎么查询某条告警的分析结果？
- GitHub Actions 或 Ansible 怎么触发 runbook？
- LLM 摘要服务怎么被别的系统调用？
- Kubernetes 怎么判断这个服务还活着？
- Prometheus 怎么知道接口慢不慢、错误多不多？

脚本适合验证想法，API 服务适合被系统调用。

FastAPI 的价值，就是把 Python 能力包装成标准 HTTP API。你写 Python 函数、类型注解和数据模型，它负责路由、参数解析、请求体验证、响应序列化、错误响应、交互式 API 文档和测试入口。

在 AIOps 项目里，FastAPI 常常是“算法能力”和“工程系统”之间的接口层。

## 一句话人话版

FastAPI 是一个用 Python 类型注解构建 HTTP API 的 Web 框架：你把请求、响应和业务逻辑写成 Python 代码，它帮你校验数据、调用函数、返回 JSON，并自动生成 OpenAPI 接口文档。

## 小白可能会问

- FastAPI 和普通 Python 脚本有什么区别？
- FastAPI、Starlette、Pydantic、Uvicorn 分别是什么？
- `@app.get()` 里的 `get` 是什么意思？
- 路径参数、查询参数、请求体怎么区分？
- 为什么请求体要写 Pydantic 模型？
- 422 错误为什么经常出现？
- `response_model` 有什么用？
- `Depends` 为什么叫依赖注入？
- `async def` 一定比 `def` 快吗？
- 后台任务能不能直接跑大模型推理？
- `/docs` 是怎么自动生成的？
- 生产部署为什么不能只执行 `fastapi dev`？
- AIOps API 为什么必须有健康检查、鉴权、日志和测试？

## 官方知识地图

FastAPI 官方文档可以按这张地图理解：

```text
FastAPI（Python 接口框架）
  -> First Steps（第一步）
     -> FastAPI app（FastAPI 应用实例）
     -> path operation decorator（路径操作装饰器）
     -> path operation function（路径处理函数）
     -> automatic docs（自动生成接口文档）
  -> Parameters（参数）
     -> path parameters（路径参数）
     -> query parameters（查询参数）
     -> request body（请求体）
     -> header（请求头） / cookie（浏览器状态字段）
     -> validation（验证）
  -> Response（响应）
     -> return dict（返回字典） / list（列表） / Pydantic model（Pydantic 数据校验模型）
     -> response_model（响应数据模型）
     -> status_code（响应状态码）
     -> JSON serialization（转换为 JSON）
  -> Dependencies（依赖项）
     -> Depends（依赖注入声明）
     -> shared query（共享查询参数） / auth（身份鉴别） / database session（数据库会话）
     -> nested dependencies（嵌套依赖）
  -> Error Handling（错误处理）
     -> HTTPException（HTTP 异常）
     -> validation errors（数据校验错误）
     -> custom exception handlers（自定义异常处理器）
  -> Middleware（中间件）
     -> request before/after hook（请求前后处理钩子）
     -> logging（记录日志）
     -> timing（计时）
     -> CORS（跨域资源共享）
  -> Application Structure（应用结构）
     -> APIRouter（路由分组器）
     -> multiple files（多文件组织）
     -> settings（设置）
     -> startup/lifespan（启动与生命周期）
  -> Background Tasks（后台任务）
     -> after-response work（返回响应后的任务）
     -> small async follow-up（轻量异步后续任务）
     -> queue for heavy work（用队列承接重任务）
  -> Testing（测试）
     -> TestClient（测试客户端）
     -> dependency override（替换测试依赖）
     -> API contract tests（接口契约测试）
  -> Deployment（部署）
     -> fastapi dev（开发模式启动命令）
     -> fastapi run（生产模式启动命令）
     -> ASGI server（异步服务器接口实现）
     -> containers（容器）
     -> HTTPS（加密 HTTP） / proxy（代理） / workers（工作进程）
```

初学路线：

```text
first API（第一个接口）
  -> path/query/body（路径、查询与请求体）
  -> Pydantic model（Pydantic 数据校验模型）
  -> response_model（响应数据模型）
  -> HTTPException（HTTP 异常）
  -> Depends（依赖注入声明）
  -> APIRouter（路由分组器）
  -> TestClient（测试客户端）
  -> Docker（容器运行工具） / health check（健康检查）
  -> AIOps alert API（智能运维告警接口）
```

不要一上来就纠结微服务、网关、服务网格和复杂鉴权。先把请求怎么进来、数据怎么校验、函数怎么调用、响应怎么返回讲清楚。

## FastAPI 在 AIOps 链路中的位置

FastAPI 通常位于“系统入口层”：

```text
Alertmanager（告警管理器） / Grafana（可视化面板工具） / script（脚本） / frontend（前端） / CI（持续集成）
  -> FastAPI（Python 接口框架）
      -> validate request（校验请求）
      -> authenticate caller（鉴别调用者身份）
      -> deduplicate alert with Redis（用 Redis 去重告警）
      -> store event in MySQL（把事件存入 MySQL）
      -> publish message to Kafka（把消息写入 Kafka）
      -> call pandas / scikit-learn model（模型）
      -> call LLM（大语言模型） / RAG（检索增强生成） service（服务）
      -> trigger runbook automation（触发操作手册自动化）
  -> JSON response（JSON 响应）
  -> OpenAPI contract（OpenAPI 接口约定）
```

它不应该承担所有职责。

| 能力 | FastAPI 适合做吗 | 说明 |
|---|---:|---|
| 接收 webhook | 适合 | Alertmanager、GitHub、CI 回调都可以 |
| 参数校验 | 适合 | Pydantic 模型非常适合 |
| 返回 JSON API | 适合 | 默认体验就是 API |
| 自动生成接口文档 | 适合 | OpenAPI、Swagger UI、ReDoc |
| 轻量后台动作 | 适合 | 例如写日志、发送简单通知 |
| 长时间模型训练 | 不适合直接做 | 应交给任务队列、训练任务或离线平台 |
| 高吞吐消息消费 | 不适合独自做 | 通常交给 Kafka consumer |
| 数据持久化 | FastAPI 负责调用 | 真正存储在 MySQL、Redis、对象存储 |
| 告警判断逻辑 | 可以封装 | 但规则、模型、证据要独立可测试 |

## FastAPI、Starlette、Pydantic、Uvicorn

初学 FastAPI 时，最容易混在一起的是这四个名字。

```text
client（客户端）
  -> Uvicorn（ASGI 服务器）
      -> ASGI（异步服务器网关接口）
          -> Starlette（底层异步 Web 框架）
              -> FastAPI（Python 接口框架）
                  -> Pydantic（数据模型与校验库）
                      -> your function（你编写的处理函数）
```

### FastAPI

FastAPI 是你直接使用的 Web API 框架。你写：

```python
from fastapi import FastAPI

app = FastAPI()


@app.get("/healthz")
async def healthz():
    return {"status": "ok"}
```

它把 URL、HTTP 方法、函数、类型注解、请求体模型、响应模型组织起来。

### Starlette

Starlette 是底层 ASGI Web 工具包。FastAPI 使用 Starlette 处理很多 Web 层能力，比如路由、中间件、请求、响应、WebSocket、背景任务、测试客户端等。

你日常不一定直接写 Starlette，但理解它能帮你知道 FastAPI 为什么有 `Request`、`Response`、`Middleware`、`BackgroundTasks` 这些概念。

### Pydantic

Pydantic 是数据校验和序列化工具。FastAPI 用它处理：

- 请求体 JSON 到 Python 对象的转换。
- 字段类型校验。
- 默认值。
- 嵌套模型。
- 响应模型。
- OpenAPI schema。

你写的 `BaseModel` 不是“只是为了好看”，它是 API 合同的一部分。

### Uvicorn

Uvicorn 是 ASGI server。它负责监听端口、接收 HTTP 请求，并把请求交给 FastAPI 应用。

开发时你可能执行：

```bash
fastapi dev main.py
```

或者：

```bash
uvicorn main:app --reload
```

这里的 `main:app` 含义是：

```text
main.py 文件中的 app 变量
```

## ASGI 是什么

ASGI 可以先理解为 Python Web 服务和服务器之间的协议。

传统同步 Web 应用常见 WSGI。现代 Python 异步 Web 应用常见 ASGI。FastAPI 基于 ASGI，所以它能自然支持：

- async / await。
- HTTP API。
- WebSocket。
- 后台任务。
- 中间件。
- 生命周期事件。

你不需要一开始就背 ASGI 细节，只要记住一条：

```text
Uvicorn 负责跑 ASGI app，FastAPI app 是一个 ASGI 应用。
```

## 请求到响应的完整链路

一次请求进入 FastAPI，大致经过这些步骤：

```text
Client（客户端）发出请求
  -> Uvicorn（服务器）接收请求
  -> Middleware（中间件）进入处理链
  -> Route（路由）匹配路径与方法
  -> Dependencies / Validation（求解依赖并校验相关输入）
  -> Handler（处理函数）执行业务
  -> Response model（响应模型）校验与过滤输出
  -> Middleware（中间件）处理返回路径
  -> Response（响应）发送给客户端
```

箭头是简化的调用路径，不是内部所有操作的严格调度表。依赖自身也有需要解析和校验的参数，所以不能假定全部校验总在全部依赖之前完成；不应在普通依赖里放不可撤销的业务副作用。

把这条链路想清楚，很多问题会变简单：

- 404：路由没匹配。
- 405：路径存在，但 HTTP 方法不对。
- 422：路由匹配了，但参数或请求体校验失败。
- 500：函数内部出错，或者外部依赖出错。
- 响应少字段：可能被 `response_model` 过滤了。

## 安装

建议先创建虚拟环境：

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install "fastapi[standard]"
```

Windows PowerShell：

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install "fastapi[standard]"
```

`"fastapi[standard]"` 要加引号，避免某些终端把中括号当成特殊字符。

确认安装：

```bash
python -c "import fastapi; print(fastapi.__version__)"
fastapi --help
```

常用依赖：

```bash
pip install pytest httpx
pip install pydantic-settings
pip install redis pymysql sqlalchemy
```

学习阶段不必一次装完。先让最小 API 跑起来，再按需要增加。

## 第一个 API

创建 `main.py`：

```python
from fastapi import FastAPI

app = FastAPI(title="AIOps Lab API")


@app.get("/")
async def root():
    return {"message": "AIOps API is running"}
```

启动开发服务：

```bash
fastapi dev main.py
```

访问：

```text
http://127.0.0.1:8000/
http://127.0.0.1:8000/docs
http://127.0.0.1:8000/redoc
http://127.0.0.1:8000/openapi.json
```

你应该看到：

```json
{"message":"AIOps API is running"}
```

### 这段代码发生了什么

```python
app = FastAPI(title="AIOps Lab API")
```

创建一个 FastAPI 应用对象。

`@app.get("/")` 是完整示例中的装饰器行，必须放在函数定义上方，不能单独运行。它注册一个路径操作：

```text
HTTP method: GET
path: /
function: root
```

`async def root():` 是函数定义的开头，下面必须跟缩进的函数体。客户端访问 `/` 时，FastAPI 会调用完整示例中的这个处理函数。

`return {"message": "AIOps API is running"}` 写在上述函数体内，不能独立放到文件顶层。它返回普通 Python 字典，FastAPI 会把它转换成 JSON 响应。

## Path Operation

官方文档把 `@app.get("/items/{item_id}")` 这类东西叫 path operation。

拆开看：

| 部分 | 含义 |
|---|---|
| path | URL 路径，例如 `/alerts/{alert_id}` |
| operation | HTTP 方法，例如 GET、POST、PUT、DELETE |
| decorator | `@app.get(...)` 这行装饰器 |
| function | 被调用的 Python 函数 |

常见 HTTP 方法：

| 方法 | 常见含义 | AIOps 示例 |
|---|---|---|
| GET | 查询资源 | 查询告警、查询分析结果 |
| POST | 创建资源或触发动作 | 接收告警、触发分析 |
| PUT | 整体更新资源 | 更新 runbook 配置 |
| PATCH | 局部更新资源 | 修改告警状态 |
| DELETE | 删除资源 | 删除实验数据 |

学习阶段最常用的是 GET 和 POST。

## 路径参数

路径参数写在 URL 模板里：

```python
from fastapi import FastAPI

app = FastAPI()


@app.get("/services/{service_name}")
async def get_service(service_name: str):
    return {
        "service": service_name,
        "status": "unknown",
    }
```

请求：

```bash
curl http://127.0.0.1:8000/services/order-api
```

返回：

```json
{"service":"order-api","status":"unknown"}
```

### 类型转换

如果路径参数声明为 `int`：

```python
@app.get("/alerts/{alert_id}")
async def get_alert(alert_id: int):
    return {"alert_id": alert_id}
```

访问：

```bash
curl http://127.0.0.1:8000/alerts/1001
```

FastAPI 会把 `"1001"` 转成整数 `1001`。

如果访问：

```bash
curl http://127.0.0.1:8000/alerts/abc
```

会得到 422，因为 `abc` 不能转换成整数。

## 查询参数

查询参数是 URL 中 `?` 后面的键值对。

```python
@app.get("/alerts")
async def list_alerts(severity: str | None = None, limit: int = 20):
    return {
        "severity": severity,
        "limit": limit,
        "items": [],
    }
```

请求：

```bash
curl "http://127.0.0.1:8000/alerts?severity=critical&limit=10"
```

返回：

```json
{"severity":"critical","limit":10,"items":[]}
```

FastAPI 的判断规则很重要：

```text
如果参数名出现在路径模板里，它是路径参数。
如果函数参数不在路径模板里，且不是请求体模型，它通常是查询参数。
```
示例：

```python
@app.get("/services/{service_name}/alerts")
async def list_service_alerts(
    service_name: str,
    severity: str | None = None,
    limit: int = 20,
):
    return {
        "service": service_name,
        "severity": severity,
        "limit": limit,
    }
```

这里：

- `service_name` 是路径参数。
- `severity` 是查询参数。
- `limit` 是查询参数。

### 默认值和必填

有默认值：

```python
limit: int = 20
```

代表可选。

默认值是 `None`：

```python
severity: str | None = None
```

代表可选，并且没传时是 `None`。

没有默认值：

```python
team: str
```

代表必填查询参数。

```python
@app.get("/alerts/search")
async def search_alerts(team: str, limit: int = 20):
    return {"team": team, "limit": limit}
```

访问 `/alerts/search` 会 422，因为缺少 `team`。

## 请求体

POST 请求常常需要 JSON 请求体。FastAPI 用 Pydantic 模型定义请求体。

```python
from datetime import datetime

from pydantic import BaseModel, Field


class AlertEvent(BaseModel):
    service: str = Field(min_length=1)
    instance: str
    severity: str
    alert_name: str
    metric_value: float | None = None
    starts_at: datetime | None = None
```

接口：

```python
@app.post("/alerts")
async def receive_alert(alert: AlertEvent):
    return {
        "received": True,
        "alert": alert,
    }
```

请求：

```bash
curl -X POST http://127.0.0.1:8000/alerts \
  -H "Content-Type: application/json" \
  -d '{"service":"order-api","instance":"10.0.1.11","severity":"critical","alert_name":"HighErrorRate","metric_value":0.23}'
```

FastAPI 会做几件事：

```text
JSON body（JSON 请求体）
  -> Pydantic model（Pydantic 数据校验模型）
  -> type conversion（类型转换）
  -> validation（验证）
  -> Python object（Python 对象）
  -> your function（你编写的处理函数）
```

如果 `metric_value` 传成不能转换为数字的字符串，就会返回 422。

### 请求体模型不是数据库模型

初学者常把所有模型都叫“model”，容易混乱。

| 模型 | 用途 |
|---|---|
| Request model | 描述客户端传进来的数据 |
| Response model | 描述服务返回给客户端的数据 |
| Database model | 描述数据库表结构或 ORM 实体 |
| ML model | 机器学习模型 |

AIOps API 里，建议把这些模型分清楚。请求模型不一定等于数据库表，响应模型也不一定暴露全部字段。

## Header 和 Cookie 参数

Header 常用于传 API key、trace id、调用方信息。

```python
from typing import Annotated

from fastapi import Header


@app.get("/whoami")
async def whoami(
    user_agent: Annotated[str | None, Header()] = None,
    x_request_id: Annotated[str | None, Header(alias="X-Request-ID")] = None,
):
    return {
        "user_agent": user_agent,
        "request_id": x_request_id,
    }
```

请求：

```bash
curl http://127.0.0.1:8000/whoami \
  -H "X-Request-ID: demo-001"
```

Cookie 参数也类似，只是 AIOps 后端 API 入门阶段用得少。

## 响应模型

`response_model` 用来声明响应结构。

```python
from pydantic import BaseModel


class AlertResponse(BaseModel):
    id: str
    service: str
    severity: str
    status: str


@app.get("/alerts/{alert_id}", response_model=AlertResponse)
async def get_alert(alert_id: str):
    return {
        "id": alert_id,
        "service": "order-api",
        "severity": "critical",
        "status": "open",
        "internal_note": "do not expose",
    }
```

客户端看到的响应不会包含 `internal_note`。

`response_model` 的价值：

- 生成 OpenAPI 响应 schema。
- 过滤不该暴露的内部字段。
- 帮你发现返回结构不符合合同的问题。
- 让前端、脚本、测试都可以依赖稳定响应。

在 AIOps 中，响应模型尤其重要。不要把内部错误堆栈、数据库字段、密钥、token、用户隐私直接返回给客户端。

## 状态码

状态码是 API 合同的一部分。

```python
from fastapi import status


@app.post("/alerts", status_code=status.HTTP_202_ACCEPTED)
async def receive_alert(alert: AlertEvent):
    return {"accepted": True}
```

常见状态码：

| 状态码 | 含义 | AIOps 示例 |
|---:|---|---|
| 200 | 成功 | 查询告警成功 |
| 201 | 已创建 | 创建 runbook 配置 |
| 202 | 已接受 | 告警已接收，后台分析稍后执行 |
| 400 | 请求不合理 | 参数组合不合法 |
| 401 | 未认证 | 缺少 API key |
| 403 | 无权限 | 调用方不能执行修复动作 |
| 404 | 不存在 | 告警 ID 不存在 |
| 409 | 冲突 | 重复创建同一条规则 |
| 422 | 校验失败 | 请求体字段类型不对 |
| 500 | 服务内部错误 | 未处理异常 |
| 503 | 服务不可用 | 下游数据库或模型服务不可用 |

## 异常处理

不要用普通返回值伪装错误：

```python
return {"ok": False, "message": "not found"}
```

更清晰的做法是抛出 `HTTPException`：

```python
from fastapi import HTTPException


alerts = {"a-1": {"id": "a-1", "service": "order-api"}}


@app.get("/alerts/{alert_id}")
async def get_alert(alert_id: str):
    if alert_id not in alerts:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alerts[alert_id]
```

请求不存在的告警：

```bash
curl http://127.0.0.1:8000/alerts/not-exist
```

返回：

```json
{"detail":"Alert not found"}
```

### AIOps 错误设计

对外 API 的错误要稳定、可读、可观测。

建议至少包含：

| 字段 | 示例 |
|---|---|
| `detail` | `"Alert not found"` |
| `request_id` | `"req-20260702-001"` |
| `error_code` | `"ALERT_NOT_FOUND"` |
| `retryable` | `false` |

学习阶段可以先用 `HTTPException`。生产阶段再考虑统一异常处理器。

## 依赖注入

依赖注入听起来抽象，其实就是把多个接口都会用到的逻辑提出来，让 FastAPI 帮你调用。

常见依赖：

- 读取分页参数。
- 校验 API key。
- 获取数据库连接。
- 获取当前用户。
- 创建 trace id。
- 检查调用方权限。

### 校验 API key

```python
from typing import Annotated

from fastapi import Depends, Header, HTTPException


async def verify_api_key(
    x_api_key: Annotated[str | None, Header(alias="X-API-Key")] = None,
):
    if x_api_key != "dev-secret":
        raise HTTPException(status_code=401, detail="Invalid API key")
    return x_api_key


@app.post("/runbooks/{runbook_name}/execute")
async def execute_runbook(
    runbook_name: str,
    api_key: Annotated[str, Depends(verify_api_key)],
):
    return {"runbook": runbook_name, "accepted": True}
```

调用：

```bash
curl -X POST http://127.0.0.1:8000/runbooks/restart-service/execute \
  -H "X-API-Key: dev-secret"
```

### 共享分页参数

```python
from typing import Annotated

from fastapi import Depends
from pydantic import BaseModel


class PageParams(BaseModel):
    offset: int = 0
    limit: int = 20


async def get_page_params(offset: int = 0, limit: int = 20) -> PageParams:
    if limit > 100:
        limit = 100
    return PageParams(offset=offset, limit=limit)


@app.get("/alerts")
async def list_alerts(page: Annotated[PageParams, Depends(get_page_params)]):
    return {"offset": page.offset, "limit": page.limit, "items": []}
```

依赖的意义不是炫技，而是把重复逻辑集中起来，避免每个接口都复制一遍。

## async 和 sync

FastAPI 同时支持：

```python
@app.get("/sync")
def sync_endpoint():
    return {"mode": "sync"}
```

和：

```python
@app.get("/async")
async def async_endpoint():
    return {"mode": "async"}
```

简单判断：

| 场景 | 建议 |
|---|---|
| 调用 async 数据库客户端 | `async def` |
| 调用 async HTTP 客户端 | `async def` |
| 普通 CPU 计算 | `def` 或独立任务 |
| 调用阻塞 SDK | `def` 或放线程/任务队列 |
| 长时间模型训练 | 不要放在请求里 |

`async` 不是魔法。它适合大量等待 I/O 的场景，比如等数据库、等网络、等外部 API。它不适合让 CPU 密集任务自动变快。

表里的普通计算只指短小计算。纯 Python 密集计算放在线程池不保证多核加速，长期任务应独立进程或计算服务；框架只自动调度它负责调用的路径函数和依赖，你在异步函数里直接调用普通辅助函数不会自动被挪到线程池。[官方并发说明](https://fastapi.tiangolo.com/async/#very-technical-details)。

AIOps 中常见错误：

```python
@app.post("/train")
async def train_model():
    train_large_model_for_30_minutes()
    return {"ok": True}
```

这会让请求长时间挂住。更好的做法是：

- 接收请求。
- 返回 `202 Accepted`。
- 把任务丢进队列。
- 后台 worker 执行训练或分析。
- 用另一个接口查询任务状态。

## 后台任务

FastAPI 的 `BackgroundTasks` 可以让小任务在响应返回后执行。

```python
from fastapi import BackgroundTasks, FastAPI, status

app = FastAPI()


def write_audit_log(alert_id: str, action: str):
    print(f"audit alert_id={alert_id} action={action}")


@app.post("/alerts/{alert_id}/ack", status_code=status.HTTP_202_ACCEPTED)
async def ack_alert(alert_id: str, background_tasks: BackgroundTasks):
    background_tasks.add_task(write_audit_log, alert_id, "ack")
    return {"accepted": True, "alert_id": alert_id}
```

适合：

- 写审计日志。
- 发送轻量通知。
- 触发一个很短的小动作。

不适合：

- 大模型推理。
- 批量训练。
- 长时间数据清洗。
- 需要跨机器可靠执行的任务。
- 任务失败必须重试的流程。

对于 AIOps，生产上更常见：

```text
FastAPI receives request（请求）
  -> stores request（请求） metadata（元数据）
  -> publishes job to Kafka / Redis / queue（把任务写入消息或任务队列）
  -> returns 202（返回已接受任务状态）
worker consumes（工作进程消费任务） job
  -> runs analysis（执行分析）
  -> stores result（结果）
client（客户端） polls result（结果） API
```

## 中间件

中间件可以在每个请求前后执行逻辑。

常见用途：

- 打日志。
- 计算耗时。
- 加响应头。
- 统一 request id。
- CORS。
- gzip。
- tracing。

示例：记录请求耗时。

```python
import time

from fastapi import FastAPI, Request

app = FastAPI()


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    started = time.perf_counter()
    response = await call_next(request)
    elapsed = time.perf_counter() - started
    response.headers["X-Process-Time"] = f"{elapsed:.6f}"
    return response
```

访问任意接口时，响应 header 会增加：

```text
X-Process-Time: 0.001234
```

中间件要轻。不要在中间件里做慢查询、大计算或复杂业务判断。

## CORS

如果前端页面和 API 不在同一个 origin，浏览器会触发 CORS 规则。

开发阶段示例：

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

不要在生产里随手写：

```python
allow_origins=["*"]
```

尤其是带凭证、Cookie、内部运维 API、修复动作 API 时。AIOps API 往往有高权限，CORS 配置必须收紧。

## OpenAPI 和自动文档

FastAPI 会自动生成 OpenAPI schema。

默认入口：

```text
/docs
/redoc
/openapi.json
```

这些不是“附赠玩具”，而是 API 合同。

它们来自：

- 路径。
- HTTP 方法。
- 函数参数。
- Pydantic 请求模型。
- Pydantic 响应模型。
- 状态码。
- tag、summary、description。

示例：

```python
@app.post(
    "/alerts",
    response_model=AlertResponse,
    status_code=202,
    tags=["alerts"],
    summary="Receive an alert event",
)
async def receive_alert(alert: AlertEvent):
    return AlertResponse(
        id="a-1",
        service=alert.service,
        severity=alert.severity,
        status="queued",
    )
```

对 AIOps 团队来说，OpenAPI 有三个价值：

- 前端、脚本、平台团队可以按文档联调。
- API 变更可以被 code review 看见。
- 后续能生成 SDK 或做契约测试。

## 项目结构

初学可以单文件：

```text
main.py
```

一旦接口超过 5 到 8 个，就建议拆分。

推荐结构：

```text
projects/fastapi-aiops-api/
  README.md
  requirements.txt
  app/
    __init__.py
    main.py
    settings.py
    models/
      __init__.py
      alerts.py
    routers/
      __init__.py
      health.py
      alerts.py
      runbooks.py
    services/
      __init__.py
      dedup.py
      analysis.py
      runbook_executor.py
  tests/
    test_health.py
    test_alerts.py
```

### main.py

```python
from fastapi import FastAPI

from app.routers import alerts, health, runbooks


def create_app() -> FastAPI:
    app = FastAPI(title="AIOps Lab API")
    app.include_router(health.router, tags=["health"])
    app.include_router(alerts.router, prefix="/alerts", tags=["alerts"])
    app.include_router(runbooks.router, prefix="/runbooks", tags=["runbooks"])
    return app


app = create_app()
```

### routers/health.py

```python
from fastapi import APIRouter

router = APIRouter()


@router.get("/healthz")
async def healthz():
    return {"status": "ok"}
```

### routers/alerts.py

```python
from fastapi import APIRouter, status

from app.models.alerts import AlertEvent, AlertResponse

router = APIRouter()


@router.post("", response_model=AlertResponse, status_code=status.HTTP_202_ACCEPTED)
async def receive_alert(alert: AlertEvent):
    return AlertResponse(
        id=f"{alert.service}:{alert.instance}:{alert.alert_name}",
        service=alert.service,
        severity=alert.severity,
        status="queued",
    )
```

### models/alerts.py

```python
from datetime import datetime

from pydantic import BaseModel, Field


class AlertEvent(BaseModel):
    service: str = Field(min_length=1)
    instance: str = Field(min_length=1)
    severity: str = Field(pattern="^(info|warning|critical)$")
    alert_name: str = Field(min_length=1)
    starts_at: datetime | None = None
    description: str | None = None


class AlertResponse(BaseModel):
    id: str
    service: str
    severity: str
    status: str
```

拆分的原则：

| 目录 | 放什么 |
|---|---|
| `routers/` | HTTP 路由和接口定义 |
| `models/` | 请求/响应 Pydantic 模型 |
| `services/` | 业务逻辑，例如去重、分析、调用 runbook |
| `settings.py` | 配置读取 |
| `tests/` | API 测试 |

不要把所有业务逻辑都堆在 router 函数里。router 应该薄一点，服务逻辑应该可单独测试。

## 配置管理

不要把数据库密码、API key、环境差异写死在代码里。

安装：

```bash
pip install pydantic-settings
```

`app/settings.py`：

```python
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "AIOps Lab API"
    environment: str = "dev"
    mysql_url: str = "mysql+pymysql://aiops:aiops_pwd@127.0.0.1:3306/aiops_lab"
    redis_url: str = "redis://127.0.0.1:6379/0"
    api_key: str = "dev-secret"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


@lru_cache
def get_settings() -> Settings:
    return Settings()
```

使用：

```python
from typing import Annotated

from fastapi import Depends

from app.settings import Settings, get_settings


@app.get("/config-preview")
async def config_preview(settings: Annotated[Settings, Depends(get_settings)]):
    return {
        "app_name": settings.app_name,
        "environment": settings.environment,
    }
```

`.env` 示例：

```text
APP_NAME=AIOps Lab API
ENVIRONMENT=dev
MYSQL_URL=mysql+pymysql://aiops:aiops_pwd@127.0.0.1:3306/aiops_lab
REDIS_URL=redis://127.0.0.1:6379/0
API_KEY=dev-secret
```

注意：`.env` 不要提交真实密钥。

## 健康检查

AIOps 服务必须有健康检查。

最小版：

```python
@app.get("/healthz")
async def healthz():
    return {"status": "ok"}
```

更实用的版本：

```python
from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    version: str


@app.get("/healthz", response_model=HealthResponse)
async def healthz():
    return HealthResponse(status="ok", version="0.1.0")
```

健康检查分层：

| 接口 | 含义 | 是否检查下游 |
|---|---|---|
| `/livez` | 进程是否活着 | 通常不查数据库 |
| `/readyz` | 是否能接流量 | 可以查关键依赖 |
| `/healthz` | 通用健康入口 | 学习阶段可只做它 |

Kubernetes、负载均衡、监控系统会调用这些接口判断服务状态。

不要让健康检查太重。每秒调用一次的健康检查，如果里面查一堆慢 SQL，会把服务自己拖垮。

## Alertmanager Webhook 接收器

AIOps 常见入口是 Alertmanager webhook。

学习阶段可以先定义简化模型：

```python
from datetime import datetime, timezone

from fastapi import FastAPI, status
from pydantic import BaseModel

app = FastAPI(title="AIOps Alert Receiver")


class AlertLabels(BaseModel):
    alertname: str
    service: str | None = None
    severity: str | None = None
    instance: str | None = None


class AlertAnnotation(BaseModel):
    summary: str | None = None
    description: str | None = None


class AlertItem(BaseModel):
    status: str
    labels: AlertLabels
    annotations: AlertAnnotation = AlertAnnotation()
    startsAt: datetime | None = None
    endsAt: datetime | None = None
    fingerprint: str | None = None


class AlertmanagerWebhook(BaseModel):
    receiver: str | None = None
    status: str
    alerts: list[AlertItem]


@app.post("/webhooks/alertmanager", status_code=status.HTTP_202_ACCEPTED)
async def receive_alertmanager(payload: AlertmanagerWebhook):
    received_at = datetime.now(timezone.utc).isoformat()
    return {
        "received_at": received_at,
        "alert_count": len(payload.alerts),
        "next_action": "enqueue_for_analysis",
    }
```

模拟请求：

```bash
curl -X POST http://127.0.0.1:8000/webhooks/alertmanager \
  -H "Content-Type: application/json" \
  -d '{"status":"firing","alerts":[{"status":"firing","labels":{"alertname":"HighErrorRate","service":"order-api","severity":"critical","instance":"10.0.1.11"},"annotations":{"summary":"High error rate"}}]}'
```

这个接口现在只是接收和校验。真实系统里下一步通常是：

```text
receive webhook（接收回调请求）
  -> validate（校验）
  -> normalize（标准化） labels
  -> generate fingerprint（生成稳定事件指纹）
  -> deduplicate with Redis（使用 Redis 去重）
  -> store（存储） raw event（事件）
  -> enqueue analysis job（把分析任务入队）
  -> return 202（返回已接受状态）
```

不要在 webhook 请求里直接做长时间根因分析。Alertmanager 希望 webhook 接收方尽快响应。

## AIOps API 设计示例

一个最小但像样的 AIOps API 可以这样设计：

| 接口 | 方法 | 用途 |
|---|---|---|
| `/healthz` | GET | 健康检查 |
| `/alerts` | POST | 接收规范化告警 |
| `/alerts` | GET | 查询告警列表 |
| `/alerts/{alert_id}` | GET | 查询单条告警 |
| `/alerts/{alert_id}/analysis` | POST | 触发分析 |
| `/alerts/{alert_id}/analysis` | GET | 查询分析结果 |
| `/runbooks/{name}/execute` | POST | 触发 runbook |

状态流：

```text
received（已接收）
  -> queued（已排队）
  -> analyzing（分析中）
  -> completed（已完成）
```

或：

```text
received（已接收）
  -> queued（已排队）
  -> failed（已失败）
```

响应要让调用方知道“现在处于哪一步”，不要只返回一句 `ok`。

## 入门实验：告警分析 API

先做一个纯内存版本，重点是 API 合同，不是数据库。

### main.py

```python
from datetime import datetime, timezone
from enum import StrEnum
from uuid import uuid4

from fastapi import BackgroundTasks, FastAPI, HTTPException, status
from pydantic import BaseModel, Field

app = FastAPI(title="AIOps Alert API")


class Severity(StrEnum):
    info = "info"
    warning = "warning"
    critical = "critical"


class AlertCreate(BaseModel):
    service: str = Field(min_length=1)
    instance: str = Field(min_length=1)
    severity: Severity
    alert_name: str = Field(min_length=1)
    description: str | None = None
    metric_value: float | None = None


class AlertRead(BaseModel):
    id: str
    service: str
    instance: str
    severity: Severity
    alert_name: str
    status: str
    created_at: datetime
    description: str | None = None
    metric_value: float | None = None


class AnalysisRead(BaseModel):
    alert_id: str
    status: str
    summary: str | None = None
    suggested_action: str | None = None


alerts: dict[str, AlertRead] = {}
analysis_results: dict[str, AnalysisRead] = {}


@app.get("/healthz")
async def healthz():
    return {"status": "ok"}


@app.post("/alerts", response_model=AlertRead, status_code=status.HTTP_201_CREATED)
async def create_alert(alert: AlertCreate):
    alert_id = str(uuid4())
    item = AlertRead(
        id=alert_id,
        service=alert.service,
        instance=alert.instance,
        severity=alert.severity,
        alert_name=alert.alert_name,
        status="received",
        created_at=datetime.now(timezone.utc),
        description=alert.description,
        metric_value=alert.metric_value,
    )
    alerts[alert_id] = item
    return item


@app.get("/alerts", response_model=list[AlertRead])
async def list_alerts(severity: Severity | None = None, limit: int = 20):
    items = list(alerts.values())
    if severity:
        items = [item for item in items if item.severity == severity]
    return items[:limit]


@app.get("/alerts/{alert_id}", response_model=AlertRead)
async def get_alert(alert_id: str):
    if alert_id not in alerts:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alerts[alert_id]


def analyze_alert(alert_id: str):
    alert = alerts[alert_id]
    if alert.severity == Severity.critical:
        summary = f"{alert.service} has a critical alert: {alert.alert_name}"
        suggested_action = "Check recent deploys, error rate, and pod restarts."
    else:
        summary = f"{alert.service} has a non-critical alert: {alert.alert_name}"
        suggested_action = "Watch trend and compare with baseline."

    analysis_results[alert_id] = AnalysisRead(
        alert_id=alert_id,
        status="completed",
        summary=summary,
        suggested_action=suggested_action,
    )


@app.post(
    "/alerts/{alert_id}/analysis",
    response_model=AnalysisRead,
    status_code=status.HTTP_202_ACCEPTED,
)
async def start_analysis(alert_id: str, background_tasks: BackgroundTasks):
    if alert_id not in alerts:
        raise HTTPException(status_code=404, detail="Alert not found")

    analysis_results[alert_id] = AnalysisRead(alert_id=alert_id, status="queued")
    background_tasks.add_task(analyze_alert, alert_id)
    return analysis_results[alert_id]


@app.get("/alerts/{alert_id}/analysis", response_model=AnalysisRead)
async def get_analysis(alert_id: str):
    if alert_id not in alerts:
        raise HTTPException(status_code=404, detail="Alert not found")
    if alert_id not in analysis_results:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return analysis_results[alert_id]
```

### 运行

```bash
fastapi dev main.py
```

### 创建告警

```bash
curl -X POST http://127.0.0.1:8000/alerts \
  -H "Content-Type: application/json" \
  -d '{"service":"order-api","instance":"10.0.1.11","severity":"critical","alert_name":"HighErrorRate","metric_value":0.23}'
```

### 触发分析

把返回的 `id` 替换到命令里：

```bash
curl -X POST http://127.0.0.1:8000/alerts/ALERT_ID/analysis
```

### 查询分析

```bash
curl http://127.0.0.1:8000/alerts/ALERT_ID/analysis
```

这个实验的价值：

- GET / POST 都有了。
- 路径参数、查询参数、请求体都用到了。
- 请求模型、响应模型都用到了。
- 404、422、202、201 都能看到。
- `/docs` 可以交互式调试。
- 后续很容易替换成 MySQL、Redis、Kafka、scikit-learn、LLM。

## 测试

安装：

```bash
pip install pytest httpx
```

`tests/test_health.py`：

```python
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_healthz():
    response = client.get("/healthz")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
```

`tests/test_alerts.py`：

```python
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_create_alert():
    response = client.post(
        "/alerts",
        json={
            "service": "order-api",
            "instance": "10.0.1.11",
            "severity": "critical",
            "alert_name": "HighErrorRate",
            "metric_value": 0.23,
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["service"] == "order-api"
    assert data["status"] == "received"
    assert "id" in data


def test_invalid_severity_returns_422():
    response = client.post(
        "/alerts",
        json={
            "service": "order-api",
            "instance": "10.0.1.11",
            "severity": "urgent",
            "alert_name": "HighErrorRate",
        },
    )

    assert response.status_code == 422
```

运行：

```bash
pytest
```

API 测试不要只测成功路径。AIOps 后端至少要测：

- 健康检查。
- 创建成功。
- 查询成功。
- 不存在资源返回 404。
- 请求体缺字段返回 422。
- 非法枚举值返回 422。
- 未鉴权返回 401。
- 后台分析接口返回 202。

## 数据库、Redis、Kafka 和模型边界

FastAPI 是接口层，不是数据层、缓存层、消息层、模型层。

典型边界：

```text
router（路由层）
  -> parse（解析） HTTP request（HTTP 请求）
  -> call service（服务）
service（服务）
  -> business logic（业务逻辑）
  -> call repository（数据访问层） / client（客户端） / model（模型）
repository（数据访问层）
  -> MySQL / Redis / Kafka / file（文件）
model code（模型代码）
  -> pandas / scikit-learn / LLM（大语言模型）
```

### MySQL

适合保存：

- 告警事件。
- 分析结果。
- runbook 执行记录。
- 用户确认反馈。
- 规则配置。

### Redis

适合：

- 告警去重。
- 短期状态缓存。
- 分布式锁。
- 限流计数。
- 任务队列后端。

### Kafka

适合：

- 告警事件流。
- 分析任务流。
- 结果通知流。
- 多系统解耦。

### scikit-learn / LLM

适合封装成服务逻辑：

```text
FastAPI request（请求）
  -> load features（加载特征）
  -> call model.predict（调用模型预测方法）
  -> return score（分数） / label（标签） / explanation（解释）
```

但要注意：

- 模型加载不要每个请求都重新加载。
- 慢推理要考虑队列和异步任务。
- 模型版本要记录。
- 输出要有置信度、证据和人工确认入口。

## 部署运行

开发环境：

```bash
fastapi dev main.py
```

生产运行可以使用：

```bash
fastapi run main.py
```

也可以显式使用 Uvicorn：

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

开发时常用自动重载：

```bash
uvicorn app.main:app --reload
```

生产环境不要依赖 `--reload`。

### requirements.txt

```text
fastapi[standard]
pydantic-settings
pytest
httpx
```

### Dockerfile

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

EXPOSE 8000

CMD ["fastapi", "run", "app/main.py", "--host", "0.0.0.0", "--port", "8000"]
```

### docker compose

```yaml
services:
  api:
    build: .
    ports:
      - "127.0.0.1:8000:8000"
    environment:
      ENVIRONMENT: dev
      API_KEY: dev-secret
```

### Kubernetes 健康检查示例

```yaml
livenessProbe:
  httpGet:
    path: /healthz
    port: 8000
  initialDelaySeconds: 10
  periodSeconds: 10
readinessProbe:
  httpGet:
    path: /healthz
    port: 8000
  initialDelaySeconds: 5
  periodSeconds: 5
```

学习阶段可以这样写。生产阶段通常会把 `/livez` 和 `/readyz` 分开。

## 可观测性

AIOps API 自己也要被观测。

至少记录：

- 请求方法。
- 路径。
- 状态码。
- 耗时。
- request id。
- 调用方。
- 关键业务 ID，例如 `alert_id`。

日志示例：

```text
level=info method=POST path=/alerts status=201 elapsed_ms=12 request_id=req-001 alert_id=a-1
```

指标示例：

| 指标 | 含义 |
|---|---|
| `http_requests_total` | 请求总数 |
| `http_request_duration_seconds` | 请求耗时 |
| `http_requests_in_progress` | 进行中的请求 |
| `aiops_alerts_received_total` | 接收告警数 |
| `aiops_analysis_jobs_total` | 分析任务数 |
| `aiops_analysis_failures_total` | 分析失败数 |

追踪示例：

```text
POST /alerts（提交告警的接口）
  -> Redis dedup（Redis 去重）
  -> MySQL insert（插入）
  -> Kafka publish（发布）
```

FastAPI 不是只负责“被调用”，它自己也要给 SRE 留证据。

## 安全基础

AIOps API 往往可以触发修复动作，所以安全不能后补。

入门阶段至少做到：

- 内部 API 也要有认证。
- 修复动作接口要有权限控制。
- 不在响应里返回密钥、token、堆栈。
- 不把真实密钥提交到 Git。
- 限制 CORS。
- 记录审计日志。
- 高风险接口加人工确认或审批。

简单 API key 适合学习：

```python
from typing import Annotated

from fastapi import Depends, Header, HTTPException


async def require_api_key(
    x_api_key: Annotated[str | None, Header(alias="X-API-Key")] = None,
):
    if x_api_key != "dev-secret":
        raise HTTPException(status_code=401, detail="Invalid API key")
```

生产上要根据组织情况使用：

- OAuth2 / OIDC。
- JWT。
- mTLS。
- API gateway。
- 权限系统。
- 审计系统。

不要让“自动修复接口”裸奔在公网。

## 常用 API 字典

### FastAPI

```python
app = FastAPI(title="AIOps Lab API")
```

创建应用对象。

### app.get / app.post

`@app.get("/healthz")` 和 `@app.post("/alerts")` 分别注册 GET 健康检查与 POST 告警提交操作。这是两个装饰器的写法示意：通常分别放在各自处理函数上方，不是把这两行单独保存成可运行文件。

### APIRouter

```python
router = APIRouter()
app.include_router(router, prefix="/alerts", tags=["alerts"])
```

用于多文件拆分和模块化路由。

### BaseModel

```python
class AlertEvent(BaseModel):
    service: str
```

定义请求或响应数据模型。

### Field

```python
service: str = Field(min_length=1)
```

声明字段校验、默认值和文档信息。

### HTTPException

```python
raise HTTPException(status_code=404, detail="Alert not found")
```

返回标准 HTTP 错误。

### Depends

```python
settings: Annotated[Settings, Depends(get_settings)]
```

声明依赖，让 FastAPI 调用并传入结果。

### Header

```python
x_api_key: Annotated[str | None, Header(alias="X-API-Key")] = None
```

读取请求 header。

### BackgroundTasks

```python
background_tasks.add_task(analyze_alert, alert_id)
```

响应返回后执行轻量任务。

### status

```python
status_code=status.HTTP_202_ACCEPTED
```

使用可读常量代替裸数字。

### TestClient

```python
client = TestClient(app)
response = client.get("/healthz")
```

测试 API。

## 命令速查

### 创建环境

```bash
python -m venv .venv
source .venv/bin/activate
pip install "fastapi[standard]"
```

PowerShell：

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install "fastapi[standard]"
```

### 开发运行

```bash
fastapi dev main.py
```

### 指定端口

```bash
fastapi dev main.py --port 8001
```

### Uvicorn 运行

```bash
uvicorn main:app --reload
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 生产运行

```bash
fastapi run app/main.py --host 0.0.0.0 --port 8000
```

### 测试

```bash
pytest
```

### 查看 OpenAPI

```bash
curl http://127.0.0.1:8000/openapi.json
```

### 调用健康检查

```bash
curl http://127.0.0.1:8000/healthz
```

## 典型故障排查表

| 现象 | 常见原因 | 排查方式 |
|---|---|---|
| `ModuleNotFoundError: fastapi` | 没装依赖或没激活虚拟环境 | `python -m pip show fastapi` |
| `command not found: fastapi` | CLI 不在当前环境 | 激活 `.venv` 后重试 |
| 端口被占用 | 8000 已被其他进程占用 | 换 `--port 8001` |
| 404 | 路径写错 | 打开 `/docs` 看真实路径 |
| 405 | HTTP 方法不对 | GET/POST 是否用错 |
| 422 | 参数或请求体校验失败 | 看响应 `detail` 和 `/docs` |
| 500 | 代码内部异常 | 看服务日志 |
| 响应字段缺失 | `response_model` 过滤 | 检查响应模型 |
| 前端跨域失败 | CORS 未配置或 origin 不匹配 | 检查浏览器控制台和 CORS 配置 |
| 接口卡住 | 请求里执行慢任务 | 改成后台任务或队列 |
| Docker 内访问不到 | host 绑定 127.0.0.1 | 用 `--host 0.0.0.0` |
| Kubernetes 探针失败 | path 或 port 不对 | 检查 probe 配置和服务日志 |

## AIOps 项目落地清单

设计一个 AIOps FastAPI 服务时，至少确认这些问题：

- 服务入口是什么：webhook、前端、脚本、CI 还是内部系统？
- 请求模型是什么：字段、类型、必填、默认值、枚举值。
- 响应模型是什么：哪些字段能暴露，哪些不能暴露。
- 错误状态码怎么设计：404、409、422、503 等。
- 慢任务怎么处理：后台任务、队列还是离线任务。
- 数据存在哪里：MySQL、Redis、对象存储还是日志系统。
- 是否需要去重：告警 fingerprint 怎么生成。
- 是否需要鉴权：API key、JWT、网关、mTLS。
- 是否需要审计：谁触发了什么动作。
- 是否有健康检查：Kubernetes 和监控能不能判断状态。
- 是否有测试：成功、失败、鉴权、校验、边界值。
- 是否有 OpenAPI 文档：前后端和运维脚本能不能联调。
- 是否可观测：日志、指标、trace 是否足够定位问题。

## 面试怎么讲

FastAPI 是一个基于 Python 类型注解的现代 Web API 框架，底层依赖 Starlette 处理 Web 能力，依赖 Pydantic 做数据校验和序列化，通常由 Uvicorn 这类 ASGI server 运行。

在 AIOps 项目中，我会把 FastAPI 放在接口层：接收 Alertmanager webhook、暴露异常检测接口、查询分析结果、触发 runbook 自动化，并提供 OpenAPI 文档、请求校验、响应模型、健康检查和测试。对于耗时分析任务，我不会在请求里直接阻塞执行，而是返回 `202 Accepted`，把任务交给后台任务或 Kafka、Redis 队列，再通过查询接口返回结果。

我会特别注意 API 合同和生产边界：用 Pydantic 区分请求模型和响应模型，用 `HTTPException` 返回明确状态码，用 `Depends` 统一鉴权和公共依赖，用 `APIRouter` 拆分模块，用 `TestClient` 做接口测试，并为服务接入日志、指标、健康检查和配置管理。

## 学习检查清单

- [ ] 我能解释 FastAPI、Starlette、Pydantic、Uvicorn 的关系。
- [ ] 我能写一个最小 FastAPI 应用。
- [ ] 我能区分路径参数、查询参数、请求体、header。
- [ ] 我能用 Pydantic 模型定义请求体。
- [ ] 我能用 `response_model` 控制响应结构。
- [ ] 我能解释 404、405、422、500 的区别。
- [ ] 我能用 `HTTPException` 返回明确错误。
- [ ] 我能用 `Depends` 写一个 API key 校验依赖。
- [ ] 我能写 `/healthz` 健康检查。
- [ ] 我能接收一条模拟 Alertmanager webhook。
- [ ] 我能用 `BackgroundTasks` 做轻量后台动作。
- [ ] 我知道慢任务应该交给队列或 worker。
- [ ] 我能用 `APIRouter` 拆分项目结构。
- [ ] 我能用 `TestClient` 写 API 测试。
- [ ] 我能运行 `fastapi dev` 和 `uvicorn`。
- [ ] 我能说明 FastAPI 在 AIOps 架构中的位置和边界。

## 面试题

1. FastAPI 适合在 AIOps 项目里承担什么角色？
2. FastAPI、Starlette、Pydantic、Uvicorn 分别负责什么？
3. 什么是 ASGI？为什么 FastAPI 和 Uvicorn 经常一起出现？
4. `@app.get("/alerts/{alert_id}")` 里的 path operation 如何理解？
5. FastAPI 如何区分路径参数和查询参数？
6. 请求体为什么要用 Pydantic 模型？
7. 422 错误通常代表什么？
8. `response_model` 有什么价值？
9. `HTTPException` 和普通 `return {"ok": false}` 有什么区别？
10. `Depends` 适合抽取哪些公共逻辑？
11. `async def` 适合什么场景？什么场景不适合？
12. 为什么慢任务不应该阻塞 HTTP 请求？
13. `BackgroundTasks` 和 Kafka / Celery / Redis Queue 的边界是什么？
14. AIOps API 为什么必须有健康检查？
15. 如何给 FastAPI 服务写测试？
16. 生产部署时为什么不能只用开发模式？
17. 如何设计一个 Alertmanager webhook 接收接口？
18. 如何避免 API 返回内部敏感字段？
19. FastAPI 服务如何接入日志、指标和 trace？
20. 如果一个自动修复 API 要上线，你会如何设计鉴权和审计？

## 老师带你跟踪一次告警 HTTP 请求

请求先经过服务器与网络入口，Uvicorn（ASGI 服务器）把它交给应用，FastAPI 按路径与方法选择处理函数，Pydantic（数据校验库）把输入检查成 Python 对象，业务函数再访问数据库或队列，最后按响应模型返回结果。HTTP（超文本传输协议）是一种请求与响应约定，框架不会自动知道哪位用户有权处理哪台主机。

路径参数像门牌号，查询参数像本次查询条件，请求体像需要登记的表单。`422` 通常说明内容不满足声明的数据结构，`401/403` 涉及身份或权限，`500` 是服务处理异常；诊断先看状态、请求 ID 与校验字段，不能把所有非 200 都归为“接口挂了”。

### async 课堂：会等与会算不是一种忙

`await` 允许程序在等待支持异步的操作时让出执行机会，并不会让 CPU 密集计算自动并行。把阻塞 `requests`、`time.sleep` 或大规模模型推理直接塞进 `async def`，可能堵住事件循环，连健康检查都迟迟返回。普通 `def` 路径由框架按相应线程池机制处理，也仍受线程数与下游容量限制。

学生：“开十个 worker 就能十倍快？”老师：“先算每个进程要加载的模型、连接池和缓存。”多个 worker 通常各有进程内内存，不共享你写的全局字典；内存去重在多进程下可能失效，大模型也可能被重复加载到显存。持久任务状态与限流必须放在适当的共享系统里。

### 不启动服务器也能做的基础与故障实验

前提安装 `fastapi` 与 `httpx`。保存 `api_contract_lesson.py`，运行 `python api_contract_lesson.py`。TestClient（测试客户端）在本进程调用应用，不访问公网：

```python
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import BaseModel, Field

app = FastAPI()
class Alert(BaseModel):
    service: str = Field(min_length=1, max_length=80)
    error_rate: float = Field(ge=0, le=1)

@app.post('/lesson/alerts')
def accept(alert: Alert):
    return {'accepted':True, 'service':alert.service}

with TestClient(app) as client:
    good = client.post('/lesson/alerts', json={'service':'order','error_rate':0.2})
    bad = client.post('/lesson/alerts', json={'service':'order','error_rate':20})
    assert good.status_code == 200
    assert bad.status_code == 422
    assert bad.json()['detail'][0]['loc'][-1] == 'error_rate'
    print('PASS: 正常输入接受，百分数单位错误被拦截')
```

故障是故意把 20% 写成数值 20；恢复为 0.2 后通过。失败先看安装解释器、字段类型和错误路径，清理删除教学脚本即可。这个例子只验证输入契约，没有认证、持久化或真实任务，不能据此宣布接口已可用于生产。

### 接受任务与完成任务的状态区别

`202 Accepted` 表示已接受处理，不表示后台任务已成功。生产返回任务 ID 前，应保证任务已经可靠保存或进入明确的队列边界；BackgroundTasks（响应后任务）依赖当前进程生命周期，不适合需要长期可恢复的关键自动修复任务。

数据库事务与消息发布之间使用 Outbox 等可恢复机制，任务处理使用幂等键和状态机。接口重试要返回同一业务任务或其状态，不能每次新建。超时还需传播总预算与取消意图，下游不支持取消时记录结果未知，避免重复副作用。

### 面试和生产设计课堂

30 秒讲请求校验、依赖和响应契约；3 分钟用告警接收经过鉴权、规范化、持久任务、异步处理和结果查询，说明 `async` 的 I/O 边界。追问扩副本为什么内存涨：每进程模型与连接池成本；追问重启为什么任务丢：进程内状态不是持久队列。

事故题设置同步慢调用阻塞事件循环，证据看并发下健康检查延迟、事件循环滞后、下游耗时与 CPU；修复选择正确异步客户端、线程隔离或任务队列，再验证并发与超时。升级需兼容 Pydantic、请求响应结构、数据库迁移和代理配置，保留 OpenAPI（接口描述）快照与消费者契约测试。

## 从接口样例走向可解释的生产服务

### 数据校验为什么不是权限校验

假设调用者传入服务名、目标机器、动作名称和审批编号，类型全正确。Pydantic 可以判断字符串长度、枚举值和数值范围，却不知道这个人是否有权重启那台机器，也不知道审批是否已经过期。输入结构合法只是进入业务校验的条件，不是执行授权。

认证回答“你是谁”，授权回答“这个身份对这个对象能做什么”。目标对象通常要先从可信目录解析，再结合租户和角色判断权限。不能直接相信正文中的租户名，也不能因为调用者能读取一条告警就允许执行告警附带的操作。自动修复入口尤其需要把只读查询和写操作权限分开。

字符串字段也不天然安全。空白字符串可以满足最小长度一，额外字段可能被默认忽略，数字字符串可能被转换成数值。严格模式、额外字段策略、规范化规则应根据接口合同选择。运维目标标识最好来自受控清单，不能把用户提供的字符串拼成命令或文件路径。

做一个口头预测：接口声明错误率为零到一，客户端发来百分数二十，应该猜它想表达百分之二十吗？不应该。拒绝并给出字段级错误能暴露上游单位问题，自动纠正可能把真正越界的数据藏起来。前文故障实验正是让读者看到“有意义的拒绝”本身是正确行为。

输出合同同样重要。响应模型可以筛掉未声明字段，但不是完整的数据泄漏防护：若你把密钥放进已声明的字符串说明字段，模型仍会返回。日志也要脱敏，不能只保证响应安全而把整个请求头、认证令牌与业务正文写入共享日志平台。

### 请求依赖应该怎样创建和释放资源

数据库会话可以通过带 `yield` 的依赖获取和释放，业务函数在明确事务中使用它。连接池则通常属于应用生命周期，不能每个请求重新建立整套连接池。二者像借用一辆车与创建一个车队的区别，资源生存期不同。

`lifespan` 是应用启动与退出的边界，适合建立客户端池、加载只读模型和关闭资源。每个工作进程都会有自己的启动过程，因此加载一次指每进程一次，不是整个集群永远一次。若模型占两 GiB，四个独立进程可能需要接近四份模型内存，还没计算解释器和请求缓冲。[生命周期官方说明](https://fastapi.tiangolo.com/advanced/events/)。

带 `yield` 的依赖清理时机存在框架版本与依赖作用域差异。不要把数据库会话对象传给响应之后才运行的任务，假定它仍然有效。后台任务应该接收稳定标识，再在自己的执行边界创建资源；流式响应也要确认资源确实存活到最后一次读取，而不是依赖偶然的清理顺序。

资源泄漏怎样找？先看活跃请求下降后连接是否回落、连接池等待是否持续、错误路径是否绕过释放，再检查取消和超时。所有请求结束后仍残留大量占用，不能仅通过加连接数解决。加大池子可能把本机等待转移为数据库过载。

### 并发的关键是在哪里等待

事件循环像一个调度员，协程在可等待的网络操作处交回控制权，调度员才能服务其他请求。阻塞库在同一线程里等待时不会自动交回控制权，轻量健康接口也可能被连带拖慢。判断是否阻塞，要看调用链实际使用的库，而不是只看最外层函数名字带不带异步。

普通同步路径会使用框架的线程池，能隔离一部分阻塞等待，但线程池有上限。假设慢接口占满了共享线程额度，其他同步依赖也可能排队。无限调大线程数会增加内存、调度与下游连接负担，正确选择是缩短等待、使用合适客户端并设置并发预算。

请求每秒进入一百次，平均停留一秒，稳定情况下约有一百个请求同时在途；平均停留变成十秒，则约一千个在途请求。这里使用的是稳态平均关系，不是尾延迟容量保证。请求体、响应体、连接和跟踪上下文会随在途数量占用内存，排队越长也越容易触发客户端重试。

取消同样不是撤销。客户端断开不代表数据库写入或外部操作一定停止，已经发送的写请求可能继续完成。接口超时后要返回可查询的业务标识或记录结果未知，不能自动声明没有副作用。把取消意图、执行超时和最终结果分别记录，才能避免重试造成重复操作。

### 慢任务为什么需要持久状态机

把一个函数放进 `BackgroundTasks` 可以在响应之后运行，却没有自动得到持久队列、跨机器调度、崩溃恢复或可靠重试。必须审计的业务记录不能只依赖进程退出前打印成功。示例中的日志输出用于教学观察，正式审计应进入具备可靠性要求的受控存储。

可靠任务至少要区分已登记、待领取、执行中、成功、已确认失败和结果未知。已登记说明任务被可靠记录，执行中说明某个执行者持有当前执行权；结果未知用于外部系统可能已执行但没有返回证据的情形。不要把所有超时都塞进失败状态后立即重跑。

接口接收请求时用幂等键查找原任务，并核对请求摘要是否一致。相同键、相同内容返回原任务；相同键、不同内容应明确冲突。只用内存字典会在多进程和重启后失效，正式实现需要数据库唯一约束或等价的原子裁决，而不是“先查询、再插入”的两次无保护操作。

写任务表和发消息之间仍有崩溃窗口。事务发件箱把任务与待发送记录放进同一事务，后台发布器重复发送时由消费端处理幂等。它使遗漏可以恢复，但不把整个系统变成一笔全局事务。查询接口应显示真实状态和更新时间，不因为消息已经发出就标为完成。

### 基础实验的完整验收和清理

使用前文完整内存版 `main.py`，在新建课堂目录内完成依赖安装。首次启动前检查本机八千端口没有其他程序占用；启动命令仅绑定回环地址。另开终端或浏览器调用健康检查，再创建告警，保存返回编号，触发分析并查询结果。不要把示例占位编号原样放进地址。

验收应分别得到健康检查成功、创建返回二〇一、分析接受返回二〇二、查询包含对应告警编号和完成状态。完成的是基于严重程度的规则拼接，不是真正机器学习，也没有实际根因诊断。若任务很快，首次查询就完成是正常的；不能要求一定观察到每个短暂状态。

再传未知严重程度，预期四二二；查询不存在的编号，预期四〇四。前者证明输入合同拒绝坏数据，后者证明资源不存在被清楚表达。若全部返回二〇〇，检查是否运行了较早片段，而不是本节完整代码；重复路由或错误工作目录会让你看到另一套应用。

实验结束在启动服务的终端按 Ctrl+C，等退出完成后再关闭终端。内存告警和分析结果会消失，这是设计限制，不是数据库恢复失败。保留代码、实际依赖版本和脱敏响应即可；如果要删除课堂目录，先确认绝对路径与内容确实属于本课，不删除其他项目的虚拟环境或文件。

### 故障实验：进程重启后为什么查不到任务

本实验只作用于刚才的内存版服务，不连接外部数据库或队列。第一步创建一条新告警，把编号记录在笔记，查询确认返回二〇〇。第二步在服务终端正常停止，再以相同命令启动相同文件。第三步查询刚才编号，预期四〇四，而健康检查仍然二〇〇。

故障是状态随进程退出而丢失，证据不是日志里的重启字样，而是同一个编号在重启前后查询不同。修复教学状态的方法是重新创建合成告警；这不等于恢复旧任务。生产修复方向才是把任务与结果转移到持久共享系统，并增加恢复验证。

如果重启后旧编号仍存在，先确认进程真正退出、端口没有被另一实例接管，以及你是否已经把示例改成了外部数据库版。不要为了符合预期去删除真实数据。清理仍是停止课堂进程，保存这两个响应和时间线；没有需要清空的远程任务或表。

进阶反例是两个进程各有一份字典。某次创建由甲处理，下一次查询由乙处理，就可能间歇性四〇四。这里不要求读者盲目开多进程制造不稳定现象，而是先画两份内存归属，再说明为什么扩大副本数会暴露原本被单进程掩盖的状态设计问题。

### 生产高可用与容量设计题

题目是为告警接收服务设计两副本部署，平时每秒二百次请求、故障峰值每秒一千次，每次请求可能包含多条告警，分析持续数秒到数分钟。回答先拆接收和分析：接收端校验、认证并可靠登记任务，分析端按资源预算异步执行，结果查询不依赖某个接收进程内存。

副本跨独立故障域，入口只把流量交给准备就绪的实例。关闭就绪后先等待在途请求排空，再终止旧进程；超出终止预算的任务必须由持久执行协议接管。启动模型慢时使用适当启动等待，不能用激进存活探测造成反复重启。

容量分别看请求字节、并发连接、验证与序列化成本、任务入队速率、执行耗时和结果保留。每秒一千个请求不等于一千条告警，批请求可能放大十倍甚至更多。应限制正文大小、数组长度、字段长度与分页范围，再用有代表性的分布做隔离压测。

如果每个进程连接池上限二十，三副本各四进程，理论数据库连接上限可达二百四十。数据库只给服务八十连接时，这个部署参数组合已经冲突。线程数、工作进程数与连接池不能分别按照单机经验调到最大，而要共用一份下游预算。

三项取舍要说出条件：同步短查询减少队列复杂度，但不能承接长任务；多进程隔离故障并利用多核，但会复制模型和连接池；响应模型加强合同，但不能替代授权和敏感字段治理。能解释代价才是设计答案，不是把组件名字写满架构图。

### 安全入口、代理与可观测性

CORS 是浏览器是否允许网页读取跨来源响应的规则，不是服务端身份校验。脚本客户端不受这套浏览器限制，所以收紧来源列表不能替代认证。使用浏览器自动附带的凭据时还需分析跨站请求伪造风险，不能把所有安全问题都归为跨域。

代理转发的原始地址、协议和主机头只能信任明确的代理来源。否则外部客户端可能伪造来源地址影响审计或限制规则。生产入口的加密、证书轮换、请求大小限制、连接超时与应用的总时间预算要协调；代理超时短于合理处理时间会让调用方看到失败而后端继续工作。

指标使用路由模板作为标签，例如带参数占位符的告警路径，而不是每个告警编号的完整地址。完整编号进入受控日志或追踪字段，高基数标签会让监控系统本身难以承受。接口耗时还应拆出连接池等待、数据库调用、队列提交与序列化，不把一切归到模型慢。

中间件在得到响应对象后记录的耗时不一定覆盖流式响应发送完整正文的时间，也不包含所有响应后任务。若用户反馈下载慢或流式生成中断，应观察首字节、总传输、连接取消与后端生成分别花了多久。一个快速返回响应头的请求不等于用户已收到完整结果。

### 升级回退要同时保护代码和合同

保存 Python、FastAPI、Starlette、Pydantic、服务器和 HTTP 客户端的实际版本，升级时先跑输入输出合同测试。字段是否允许空值、数字是否转换、日期如何序列化、额外字段怎样处理，都可能影响既有调用方。比较 OpenAPI 差异有帮助，但不能代替真实请求样本回放。

数据库迁移优先采用兼容过渡：先增加旧代码可忽略的字段，新代码同时兼容旧数据，确认旧版本退出后再考虑删除。回退代码不能自动撤销破坏性表结构修改。任务消息也有结构版本，旧执行器必须能理解新版本期间产生的积压，否则回退只会让失败更快暴露。

发布验收既看接口成功率，也看新任务是否持续完成、排队年龄是否增长、重复任务是否出现、数据库连接是否恢复稳定。出现异常时先冻结扩大范围，保存请求编号与版本，再回退小批实例对照。没有证据前不要通过删缓存、清任务表或重启全部实例“碰运气”。

### 有答案的递进面试训练

三十秒回答：FastAPI 把 Python 函数和类型模型变成 HTTP 接口，负责路由、输入校验、依赖组织与响应合同。在 AIOps 中它适合接告警和查询任务，不替代持久消息、数据库或执行审批；长任务可靠登记后异步处理，并提供可追踪的结果。

三分钟回答：我先说明服务器接请求、框架匹配路由、求解依赖并校验输入，再调用业务层完成受控写入。响应模型约束可见字段，异常状态码区分输入错误、权限和服务故障。异步主要改善等待时的并发，不能把阻塞计算自动变快；工作进程各有内存和资源池。

随后我会用重启实验说明状态必须有明确归属：全局字典只存在当前进程，可靠任务需要持久登记、幂等键、执行状态与恢复协议。最后把接收时延、排队年龄、执行结果和下游等待串进证据链，说明副本、容量、安全、升级与回退如何共同保证服务，而不只展示文档页面能打开。

追问一：四二二是不是服务故障？答案要分调用合同和服务可用性。单次非法参数被拒绝是正确行为；发布后同一调用方大量四二二，可能是合同不兼容，应按版本和字段聚类。不能把所有四二二算成健康，也不能全部当数据库错误。

追问二：返回二〇二后进程退出怎么办？若只有进程后台任务，不能承诺恢复；若任务已可靠登记，由持久队列与执行状态协议接管。继续追问外部动作结果未知，要先查询原操作、核对幂等契约或人工协调，不能用通用重试装饰器掩盖副作用。

事故题：发布后健康检查和查询一起变慢，处理器 CPU 并不高。先检查事件循环滞后、同步阻塞调用、线程池和连接池等待，再关联新版本。若证据指向异步路径内调用阻塞 SDK，修复为合适异步客户端或受控隔离；验证要包含并发健康请求、超时、取消和下游负载，单请求变快不足以结案。

## 本课 GitHub 学习证据

学完后，在 GitHub 留下这些证据：

- 一个 FastAPI AIOps API 项目。
- `GET /healthz` 接口。
- `POST /alerts` 接口。
- `GET /alerts/{alert_id}` 接口。
- `POST /alerts/{alert_id}/analysis` 接口。
- 至少 2 个 Pydantic 请求/响应模型。
- 一个 API key 依赖示例。
- 一个后台任务或任务队列说明。
- 至少 3 个 pytest API 测试。
- `/docs` 截图。
- `curl` 调用示例。
- README 解释 FastAPI 在 AIOps 架构中的位置、边界和部署方式。
