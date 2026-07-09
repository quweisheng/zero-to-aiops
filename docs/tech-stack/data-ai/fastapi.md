# FastAPI

> 目标：不是只会写一个 `@app.get("/")`，而是能理解 FastAPI 的请求链路、路径操作、参数解析、Pydantic 校验、响应模型、依赖注入、异常处理、中间件、OpenAPI 文档、测试、项目拆分、部署方式，并能把 AIOps 里的告警接收、异常检测、runbook 调用、LLM 摘要封装成可被系统调用的 HTTP API。

## 官方资料

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>python detect.py --service order-api --window 5m</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


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
FastAPI
  -> First Steps
     -> FastAPI app
     -> path operation decorator
     -> path operation function
     -> automatic docs
  -> Parameters
     -> path parameters
     -> query parameters
     -> request body
     -> header / cookie
     -> validation
  -> Response
     -> return dict / list / Pydantic model
     -> response_model
     -> status_code
     -> JSON serialization
  -> Dependencies
     -> Depends
     -> shared query / auth / database session
     -> nested dependencies
  -> Error Handling
     -> HTTPException
     -> validation errors
     -> custom exception handlers
  -> Middleware
     -> request before/after hook
     -> logging
     -> timing
     -> CORS
  -> Application Structure
     -> APIRouter
     -> multiple files
     -> settings
     -> startup/lifespan
  -> Background Tasks
     -> after-response work
     -> small async follow-up
     -> queue for heavy work
  -> Testing
     -> TestClient
     -> dependency override
     -> API contract tests
  -> Deployment
     -> fastapi dev
     -> fastapi run
     -> ASGI server
     -> containers
     -> HTTPS / proxy / workers
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>FastAPI</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; First Steps</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>     -&gt; FastAPI app</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>     -&gt; path operation decorator</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>     -&gt; path operation function</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 6 行 | <code>     -&gt; automatic docs</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 7 行 | <code>  -&gt; Parameters</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 8 行 | <code>     -&gt; path parameters</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 9 行 | <code>     -&gt; query parameters</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 10 行 | <code>     -&gt; request body</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 11 行 | <code>     -&gt; header / cookie</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 12 行 | <code>     -&gt; validation</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 13 行 | <code>  -&gt; Response</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 14 行 | <code>     -&gt; return dict / list / Pydantic model</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 15 行 | <code>     -&gt; response_model</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 16 行 | <code>     -&gt; status_code</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 17 行 | <code>     -&gt; JSON serialization</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 18 行 | <code>  -&gt; Dependencies</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 19 行 | <code>     -&gt; Depends</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 20 行 | <code>     -&gt; shared query / auth / database session</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 21 行 | <code>     -&gt; nested dependencies</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 22 行 | <code>  -&gt; Error Handling</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 23 行 | <code>     -&gt; HTTPException</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 24 行 | <code>     -&gt; validation errors</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 25 行 | <code>     -&gt; custom exception handlers</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 26 行 | <code>  -&gt; Middleware</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 27 行 | <code>     -&gt; request before/after hook</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 28 行 | <code>     -&gt; logging</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 29 行 | <code>     -&gt; timing</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 30 行 | <code>     -&gt; CORS</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 31 行 | <code>  -&gt; Application Structure</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 32 行 | <code>     -&gt; APIRouter</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 33 行 | <code>     -&gt; multiple files</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 34 行 | <code>     -&gt; settings</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 35 行 | <code>     -&gt; startup/lifespan</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 36 行 | <code>  -&gt; Background Tasks</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 37 行 | <code>     -&gt; after-response work</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 38 行 | <code>     -&gt; small async follow-up</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 39 行 | <code>     -&gt; queue for heavy work</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 40 行 | <code>  -&gt; Testing</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 41 行 | <code>     -&gt; TestClient</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 42 行 | <code>     -&gt; dependency override</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 43 行 | <code>     -&gt; API contract tests</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 44 行 | <code>  -&gt; Deployment</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 45 行 | <code>     -&gt; fastapi dev</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 46 行 | <code>     -&gt; fastapi run</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 47 行 | <code>     -&gt; ASGI server</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 48 行 | <code>     -&gt; containers</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 49 行 | <code>     -&gt; HTTPS / proxy / workers</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


初学路线：

```text
first API
  -> path/query/body
  -> Pydantic model
  -> response_model
  -> HTTPException
  -> Depends
  -> APIRouter
  -> TestClient
  -> Docker / health check
  -> AIOps alert API
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>first API</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; path/query/body</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; Pydantic model</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>  -&gt; response_model</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>  -&gt; HTTPException</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 6 行 | <code>  -&gt; Depends</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 7 行 | <code>  -&gt; APIRouter</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 8 行 | <code>  -&gt; TestClient</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 9 行 | <code>  -&gt; Docker / health check</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 10 行 | <code>  -&gt; AIOps alert API</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


不要一上来就纠结微服务、网关、服务网格和复杂鉴权。先把请求怎么进来、数据怎么校验、函数怎么调用、响应怎么返回讲清楚。

## FastAPI 在 AIOps 链路中的位置

FastAPI 通常位于“系统入口层”：

```text
Alertmanager / Grafana / script / frontend / CI
  -> FastAPI
      -> validate request
      -> authenticate caller
      -> deduplicate alert with Redis
      -> store event in MySQL
      -> publish message to Kafka
      -> call pandas / scikit-learn model
      -> call LLM / RAG service
      -> trigger runbook automation
  -> JSON response
  -> OpenAPI contract
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Alertmanager / Grafana / script / frontend / CI</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; FastAPI</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>      -&gt; validate request</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>      -&gt; authenticate caller</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>      -&gt; deduplicate alert with Redis</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 6 行 | <code>      -&gt; store event in MySQL</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 7 行 | <code>      -&gt; publish message to Kafka</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 8 行 | <code>      -&gt; call pandas / scikit-learn model</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 9 行 | <code>      -&gt; call LLM / RAG service</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 10 行 | <code>      -&gt; trigger runbook automation</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 11 行 | <code>  -&gt; JSON response</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 12 行 | <code>  -&gt; OpenAPI contract</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


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
client
  -> Uvicorn
      -> ASGI
          -> Starlette
              -> FastAPI
                  -> Pydantic
                      -> your function
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>client</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; Uvicorn</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>      -&gt; ASGI</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>          -&gt; Starlette</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>              -&gt; FastAPI</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 6 行 | <code>                  -&gt; Pydantic</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 7 行 | <code>                      -&gt; your function</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


### FastAPI

FastAPI 是你直接使用的 Web API 框架。你写：

```python
from fastapi import FastAPI

app = FastAPI()


@app.get("/healthz")
async def healthz():
    return {"status": "ok"}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>from fastapi import FastAPI</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 3 行 | <code>app = FastAPI()</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 4 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 5 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 6 行 | <code>@app.get("/healthz")</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 7 行 | <code>async def healthz():</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 8 行 | <code>    return {"status": "ok"}</code> | 返回函数结果，调用方会拿到这个值继续处理。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>fastapi dev main.py</code> | 执行 `fastapi` 相关命令，后面的参数决定它具体操作什么对象。 |


或者：

```bash
uvicorn main:app --reload
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>uvicorn main:app --reload</code> | 启动 ASGI Web 服务，常用于运行 FastAPI 实验接口。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


这里的 `main:app` 含义是：

```text
main.py 文件中的 app 变量
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>main.py 文件中的 app 变量</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Uvicorn 负责跑 ASGI app，FastAPI app 是一个 ASGI 应用。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


## 请求到响应的完整链路

一次请求进入 FastAPI，大致经过这些步骤：

```text
1. client sends HTTP request
2. Uvicorn receives request
3. FastAPI matches route
4. FastAPI parses path/query/header/body
5. Pydantic validates and converts data
6. Dependencies are executed
7. path operation function is called
8. function returns Python object
9. response_model filters and serializes output
10. middleware can add headers/log timing
11. JSON response is sent back
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>1. client sends HTTP request</code> | 编号步骤，表示学习或操作时应该按顺序执行。 |
| 第 2 行 | <code>2. Uvicorn receives request</code> | 编号步骤，表示学习或操作时应该按顺序执行。 |
| 第 3 行 | <code>3. FastAPI matches route</code> | 编号步骤，表示学习或操作时应该按顺序执行。 |
| 第 4 行 | <code>4. FastAPI parses path/query/header/body</code> | 编号步骤，表示学习或操作时应该按顺序执行。 |
| 第 5 行 | <code>5. Pydantic validates and converts data</code> | 编号步骤，表示学习或操作时应该按顺序执行。 |
| 第 6 行 | <code>6. Dependencies are executed</code> | 编号步骤，表示学习或操作时应该按顺序执行。 |
| 第 7 行 | <code>7. path operation function is called</code> | 编号步骤，表示学习或操作时应该按顺序执行。 |
| 第 8 行 | <code>8. function returns Python object</code> | 编号步骤，表示学习或操作时应该按顺序执行。 |
| 第 9 行 | <code>9. response_model filters and serializes output</code> | 编号步骤，表示学习或操作时应该按顺序执行。 |
| 第 10 行 | <code>10. middleware can add headers/log timing</code> | 编号步骤，表示学习或操作时应该按顺序执行。 |
| 第 11 行 | <code>11. JSON response is sent back</code> | 编号步骤，表示学习或操作时应该按顺序执行。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>python -m venv .venv</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 |
| 第 2 行 | <code>source .venv/bin/activate</code> | 执行 `source` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>python -m pip install --upgrade pip</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 4 行 | <code>pip install "fastapi[standard]"</code> | 管理 Python 依赖包，通常用于安装实验需要的库。 |


Windows PowerShell：

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install "fastapi[standard]"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>python -m venv .venv</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 |
| 第 2 行 | <code>.venv\Scripts\Activate.ps1</code> | 执行 `.venv\scripts\activate.ps1` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>python -m pip install --upgrade pip</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 4 行 | <code>pip install "fastapi[standard]"</code> | 管理 Python 依赖包，通常用于安装实验需要的库。 |


`"fastapi[standard]"` 要加引号，避免某些终端把中括号当成特殊字符。

确认安装：

```bash
python -c "import fastapi; print(fastapi.__version__)"
fastapi --help
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>python -c "import fastapi; print(fastapi.__version__)"</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 |
| 第 2 行 | <code>fastapi --help</code> | 执行 `fastapi` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


常用依赖：

```bash
pip install pytest httpx
pip install pydantic-settings
pip install redis pymysql sqlalchemy
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>pip install pytest httpx</code> | 管理 Python 依赖包，通常用于安装实验需要的库。 |
| 第 2 行 | <code>pip install pydantic-settings</code> | 管理 Python 依赖包，通常用于安装实验需要的库。 |
| 第 3 行 | <code>pip install redis pymysql sqlalchemy</code> | 管理 Python 依赖包，通常用于安装实验需要的库。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>from fastapi import FastAPI</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 3 行 | <code>app = FastAPI(title="AIOps Lab API")</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 4 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 5 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 6 行 | <code>@app.get("/")</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 7 行 | <code>async def root():</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 8 行 | <code>    return {"message": "AIOps API is running"}</code> | 返回函数结果，调用方会拿到这个值继续处理。 |


启动开发服务：

```bash
fastapi dev main.py
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>fastapi dev main.py</code> | 执行 `fastapi` 相关命令，后面的参数决定它具体操作什么对象。 |


访问：

```text
http://127.0.0.1:8000/
http://127.0.0.1:8000/docs
http://127.0.0.1:8000/redoc
http://127.0.0.1:8000/openapi.json
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>http://127.0.0.1:8000/</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>http://127.0.0.1:8000/docs</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>http://127.0.0.1:8000/redoc</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>http://127.0.0.1:8000/openapi.json</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


你应该看到：

```json
{"message":"AIOps API is running"}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{"message":"AIOps API is running"}</code> | JSON 列表或对象中的一行，注意逗号和引号必须符合 JSON 语法。 |


### 这段代码发生了什么

```python
app = FastAPI(title="AIOps Lab API")
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>app = FastAPI(title="AIOps Lab API")</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |


创建一个 FastAPI 应用对象。

```python
@app.get("/")
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>@app.get("/")</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |


注册一个路径操作：

```text
HTTP method: GET
path: /
function: root
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>HTTP method: GET</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>path: /</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>function: root</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


```python
async def root():
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>async def root():</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |


定义处理函数。客户端访问 `/` 时，FastAPI 会调用它。

```python
return {"message": "AIOps API is running"}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>return {"message": "AIOps API is running"}</code> | 返回函数结果，调用方会拿到这个值继续处理。 |


返回普通 Python 字典，FastAPI 会把它转换成 JSON 响应。

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>from fastapi import FastAPI</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 3 行 | <code>app = FastAPI()</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 4 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 5 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 6 行 | <code>@app.get("/services/{service_name}")</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 7 行 | <code>async def get_service(service_name: str):</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 8 行 | <code>    return {</code> | 返回函数结果，调用方会拿到这个值继续处理。 |
| 第 9 行 | <code>        "service": service_name,</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 10 行 | <code>        "status": "unknown",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 11 行 | <code>    }</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |


请求：

```bash
curl http://127.0.0.1:8000/services/order-api
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl http://127.0.0.1:8000/services/order-api</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |


返回：

```json
{"service":"order-api","status":"unknown"}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{"service":"order-api","status":"unknown"}</code> | JSON 列表或对象中的一行，注意逗号和引号必须符合 JSON 语法。 |


### 类型转换

如果路径参数声明为 `int`：

```python
@app.get("/alerts/{alert_id}")
async def get_alert(alert_id: int):
    return {"alert_id": alert_id}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>@app.get("/alerts/{alert_id}")</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 2 行 | <code>async def get_alert(alert_id: int):</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 3 行 | <code>    return {"alert_id": alert_id}</code> | 返回函数结果，调用方会拿到这个值继续处理。 |


访问：

```bash
curl http://127.0.0.1:8000/alerts/1001
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl http://127.0.0.1:8000/alerts/1001</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |


FastAPI 会把 `"1001"` 转成整数 `1001`。

如果访问：

```bash
curl http://127.0.0.1:8000/alerts/abc
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl http://127.0.0.1:8000/alerts/abc</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>@app.get("/alerts")</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 2 行 | <code>async def list_alerts(severity: str &#124; None = None, limit: int = 20):</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 3 行 | <code>    return {</code> | 返回函数结果，调用方会拿到这个值继续处理。 |
| 第 4 行 | <code>        "severity": severity,</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 5 行 | <code>        "limit": limit,</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 6 行 | <code>        "items": [],</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 7 行 | <code>    }</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |


请求：

```bash
curl "http://127.0.0.1:8000/alerts?severity=critical&limit=10"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl "http://127.0.0.1:8000/alerts?severity=critical&amp;limit=10"</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 这一行还包含管道或连接符，表示把多个命令串起来处理。 |


返回：

```json
{"severity":"critical","limit":10,"items":[]}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{"severity":"critical","limit":10,"items":[]}</code> | JSON 列表或对象中的一行，注意逗号和引号必须符合 JSON 语法。 |


FastAPI 的判断规则很重要：

```text
如果参数名出现在路径模板里，它是路径参数。
如果函数参数不在路径模板里，且不是请求体模型，它通常是查询参数。
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>如果参数名出现在路径模板里，它是路径参数。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>如果函数参数不在路径模板里，且不是请求体模型，它通常是查询参数。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>@app.get("/services/{service_name}/alerts")</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 2 行 | <code>async def list_service_alerts(</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 3 行 | <code>    service_name: str,</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 4 行 | <code>    severity: str &#124; None = None,</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 5 行 | <code>    limit: int = 20,</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 6 行 | <code>):</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 7 行 | <code>    return {</code> | 返回函数结果，调用方会拿到这个值继续处理。 |
| 第 8 行 | <code>        "service": service_name,</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 9 行 | <code>        "severity": severity,</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 10 行 | <code>        "limit": limit,</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 11 行 | <code>    }</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |


这里：

- `service_name` 是路径参数。
- `severity` 是查询参数。
- `limit` 是查询参数。

### 默认值和必填

有默认值：

```python
limit: int = 20
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>limit: int = 20</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |


代表可选。

默认值是 `None`：

```python
severity: str | None = None
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>severity: str &#124; None = None</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |


代表可选，并且没传时是 `None`。

没有默认值：

```python
team: str
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>team: str</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |


代表必填查询参数。

```python
@app.get("/alerts/search")
async def search_alerts(team: str, limit: int = 20):
    return {"team": team, "limit": limit}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>@app.get("/alerts/search")</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 2 行 | <code>async def search_alerts(team: str, limit: int = 20):</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 3 行 | <code>    return {"team": team, "limit": limit}</code> | 返回函数结果，调用方会拿到这个值继续处理。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>from datetime import datetime</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 3 行 | <code>from pydantic import BaseModel, Field</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 4 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 5 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 6 行 | <code>class AlertEvent(BaseModel):</code> | 定义类，用来组织一组数据和行为。 |
| 第 7 行 | <code>    service: str = Field(min_length=1)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 8 行 | <code>    instance: str</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 9 行 | <code>    severity: str</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 10 行 | <code>    alert_name: str</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 11 行 | <code>    metric_value: float &#124; None = None</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 12 行 | <code>    starts_at: datetime &#124; None = None</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |


接口：

```python
@app.post("/alerts")
async def receive_alert(alert: AlertEvent):
    return {
        "received": True,
        "alert": alert,
    }
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>@app.post("/alerts")</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 2 行 | <code>async def receive_alert(alert: AlertEvent):</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 3 行 | <code>    return {</code> | 返回函数结果，调用方会拿到这个值继续处理。 |
| 第 4 行 | <code>        "received": True,</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 5 行 | <code>        "alert": alert,</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 6 行 | <code>    }</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |


请求：

```bash
curl -X POST http://127.0.0.1:8000/alerts \
  -H "Content-Type: application/json" \
  -d '{"service":"order-api","instance":"10.0.1.11","severity":"critical","alert_name":"HighErrorRate","metric_value":0.23}'
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -X POST http://127.0.0.1:8000/alerts \</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |
| 第 2 行 | <code>  -H "Content-Type: application/json" \</code> | 执行 `-h` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>  -d '{"service":"order-api","instance":"10.0.1.11","severity":"critical","alert_name":"HighErrorRate","metric_value":0.23}'</code> | 执行 `-d` 相关命令，后面的参数决定它具体操作什么对象。 |


FastAPI 会做几件事：

```text
JSON body
  -> Pydantic model
  -> type conversion
  -> validation
  -> Python object
  -> your function
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>JSON body</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; Pydantic model</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; type conversion</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>  -&gt; validation</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>  -&gt; Python object</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 6 行 | <code>  -&gt; your function</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>from typing import Annotated</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 3 行 | <code>from fastapi import Header</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 4 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 5 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 6 行 | <code>@app.get("/whoami")</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 7 行 | <code>async def whoami(</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 8 行 | <code>    user_agent: Annotated[str &#124; None, Header()] = None,</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 9 行 | <code>    x_request_id: Annotated[str &#124; None, Header(alias="X-Request-ID")] = None,</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 10 行 | <code>):</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 11 行 | <code>    return {</code> | 返回函数结果，调用方会拿到这个值继续处理。 |
| 第 12 行 | <code>        "user_agent": user_agent,</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 13 行 | <code>        "request_id": x_request_id,</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 14 行 | <code>    }</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |


请求：

```bash
curl http://127.0.0.1:8000/whoami \
  -H "X-Request-ID: demo-001"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl http://127.0.0.1:8000/whoami \</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |
| 第 2 行 | <code>  -H "X-Request-ID: demo-001"</code> | 执行 `-h` 相关命令，后面的参数决定它具体操作什么对象。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>from pydantic import BaseModel</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 3 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 4 行 | <code>class AlertResponse(BaseModel):</code> | 定义类，用来组织一组数据和行为。 |
| 第 5 行 | <code>    id: str</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 6 行 | <code>    service: str</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 7 行 | <code>    severity: str</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 8 行 | <code>    status: str</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 9 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 10 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 11 行 | <code>@app.get("/alerts/{alert_id}", response_model=AlertResponse)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 12 行 | <code>async def get_alert(alert_id: str):</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 13 行 | <code>    return {</code> | 返回函数结果，调用方会拿到这个值继续处理。 |
| 第 14 行 | <code>        "id": alert_id,</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 15 行 | <code>        "service": "order-api",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 16 行 | <code>        "severity": "critical",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 17 行 | <code>        "status": "open",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 18 行 | <code>        "internal_note": "do not expose",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 19 行 | <code>    }</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>from fastapi import status</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 3 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 4 行 | <code>@app.post("/alerts", status_code=status.HTTP_202_ACCEPTED)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 5 行 | <code>async def receive_alert(alert: AlertEvent):</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 6 行 | <code>    return {"accepted": True}</code> | 返回函数结果，调用方会拿到这个值继续处理。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>return {"ok": False, "message": "not found"}</code> | 返回函数结果，调用方会拿到这个值继续处理。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>from fastapi import HTTPException</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 3 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 4 行 | <code>alerts = {"a-1": {"id": "a-1", "service": "order-api"}}</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 5 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 6 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 7 行 | <code>@app.get("/alerts/{alert_id}")</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 8 行 | <code>async def get_alert(alert_id: str):</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 9 行 | <code>    if alert_id not in alerts:</code> | 条件判断，只有条件成立时才执行下面缩进的代码。 |
| 第 10 行 | <code>        raise HTTPException(status_code=404, detail="Alert not found")</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 11 行 | <code>    return alerts[alert_id]</code> | 返回函数结果，调用方会拿到这个值继续处理。 |


请求不存在的告警：

```bash
curl http://127.0.0.1:8000/alerts/not-exist
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl http://127.0.0.1:8000/alerts/not-exist</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |


返回：

```json
{"detail":"Alert not found"}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{"detail":"Alert not found"}</code> | JSON 列表或对象中的一行，注意逗号和引号必须符合 JSON 语法。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>from typing import Annotated</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 3 行 | <code>from fastapi import Depends, Header, HTTPException</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 4 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 5 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 6 行 | <code>async def verify_api_key(</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 7 行 | <code>    x_api_key: Annotated[str &#124; None, Header(alias="X-API-Key")] = None,</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 8 行 | <code>):</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 9 行 | <code>    if x_api_key != "dev-secret":</code> | 条件判断，只有条件成立时才执行下面缩进的代码。 |
| 第 10 行 | <code>        raise HTTPException(status_code=401, detail="Invalid API key")</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 11 行 | <code>    return x_api_key</code> | 返回函数结果，调用方会拿到这个值继续处理。 |
| 第 12 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 13 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 14 行 | <code>@app.post("/runbooks/{runbook_name}/execute")</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 15 行 | <code>async def execute_runbook(</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 16 行 | <code>    runbook_name: str,</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 17 行 | <code>    api_key: Annotated[str, Depends(verify_api_key)],</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 18 行 | <code>):</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 19 行 | <code>    return {"runbook": runbook_name, "accepted": True}</code> | 返回函数结果，调用方会拿到这个值继续处理。 |


调用：

```bash
curl -X POST http://127.0.0.1:8000/runbooks/restart-service/execute \
  -H "X-API-Key: dev-secret"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -X POST http://127.0.0.1:8000/runbooks/restart-service/execute \</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |
| 第 2 行 | <code>  -H "X-API-Key: dev-secret"</code> | 执行 `-h` 相关命令，后面的参数决定它具体操作什么对象。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>from typing import Annotated</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 3 行 | <code>from fastapi import Depends</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 4 行 | <code>from pydantic import BaseModel</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 5 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 6 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 7 行 | <code>class PageParams(BaseModel):</code> | 定义类，用来组织一组数据和行为。 |
| 第 8 行 | <code>    offset: int = 0</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 9 行 | <code>    limit: int = 20</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 10 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 11 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 12 行 | <code>async def get_page_params(offset: int = 0, limit: int = 20) -&gt; PageParams:</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 13 行 | <code>    if limit &gt; 100:</code> | 条件判断，只有条件成立时才执行下面缩进的代码。 |
| 第 14 行 | <code>        limit = 100</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 15 行 | <code>    return PageParams(offset=offset, limit=limit)</code> | 返回函数结果，调用方会拿到这个值继续处理。 |
| 第 16 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 17 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 18 行 | <code>@app.get("/alerts")</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 19 行 | <code>async def list_alerts(page: Annotated[PageParams, Depends(get_page_params)]):</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 20 行 | <code>    return {"offset": page.offset, "limit": page.limit, "items": []}</code> | 返回函数结果，调用方会拿到这个值继续处理。 |


依赖的意义不是炫技，而是把重复逻辑集中起来，避免每个接口都复制一遍。

## async 和 sync

FastAPI 同时支持：

```python
@app.get("/sync")
def sync_endpoint():
    return {"mode": "sync"}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>@app.get("/sync")</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 2 行 | <code>def sync_endpoint():</code> | 定义函数，把一段可复用逻辑命名，后续可以反复调用。 |
| 第 3 行 | <code>    return {"mode": "sync"}</code> | 返回函数结果，调用方会拿到这个值继续处理。 |


和：

```python
@app.get("/async")
async def async_endpoint():
    return {"mode": "async"}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>@app.get("/async")</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 2 行 | <code>async def async_endpoint():</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 3 行 | <code>    return {"mode": "async"}</code> | 返回函数结果，调用方会拿到这个值继续处理。 |


简单判断：

| 场景 | 建议 |
|---|---|
| 调用 async 数据库客户端 | `async def` |
| 调用 async HTTP 客户端 | `async def` |
| 普通 CPU 计算 | `def` 或独立任务 |
| 调用阻塞 SDK | `def` 或放线程/任务队列 |
| 长时间模型训练 | 不要放在请求里 |

`async` 不是魔法。它适合大量等待 I/O 的场景，比如等数据库、等网络、等外部 API。它不适合让 CPU 密集任务自动变快。

AIOps 中常见错误：

```python
@app.post("/train")
async def train_model():
    train_large_model_for_30_minutes()
    return {"ok": True}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>@app.post("/train")</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 2 行 | <code>async def train_model():</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 3 行 | <code>    train_large_model_for_30_minutes()</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 4 行 | <code>    return {"ok": True}</code> | 返回函数结果，调用方会拿到这个值继续处理。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>from fastapi import BackgroundTasks, FastAPI, status</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 3 行 | <code>app = FastAPI()</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 4 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 5 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 6 行 | <code>def write_audit_log(alert_id: str, action: str):</code> | 定义函数，把一段可复用逻辑命名，后续可以反复调用。 |
| 第 7 行 | <code>    print(f"audit alert_id={alert_id} action={action}")</code> | 打印输出，用来在实验中确认变量、结果或调试信息。 |
| 第 8 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 9 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 10 行 | <code>@app.post("/alerts/{alert_id}/ack", status_code=status.HTTP_202_ACCEPTED)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 11 行 | <code>async def ack_alert(alert_id: str, background_tasks: BackgroundTasks):</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 12 行 | <code>    background_tasks.add_task(write_audit_log, alert_id, "ack")</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 13 行 | <code>    return {"accepted": True, "alert_id": alert_id}</code> | 返回函数结果，调用方会拿到这个值继续处理。 |


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
FastAPI receives request
  -> stores request metadata
  -> publishes job to Kafka / Redis / queue
  -> returns 202
worker consumes job
  -> runs analysis
  -> stores result
client polls result API
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>FastAPI receives request</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; stores request metadata</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; publishes job to Kafka / Redis / queue</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>  -&gt; returns 202</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>worker consumes job</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 6 行 | <code>  -&gt; runs analysis</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 7 行 | <code>  -&gt; stores result</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 8 行 | <code>client polls result API</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>import time</code> | 导入 Python 模块，后面的代码会使用这个模块提供的功能。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 3 行 | <code>from fastapi import FastAPI, Request</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 4 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 5 行 | <code>app = FastAPI()</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 6 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 7 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 8 行 | <code>@app.middleware("http")</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 9 行 | <code>async def add_process_time_header(request: Request, call_next):</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 10 行 | <code>    started = time.perf_counter()</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 11 行 | <code>    response = await call_next(request)</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 12 行 | <code>    elapsed = time.perf_counter() - started</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 13 行 | <code>    response.headers["X-Process-Time"] = f"{elapsed:.6f}"</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 14 行 | <code>    return response</code> | 返回函数结果，调用方会拿到这个值继续处理。 |


访问任意接口时，响应 header 会增加：

```text
X-Process-Time: 0.001234
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>X-Process-Time: 0.001234</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>from fastapi import FastAPI</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 2 行 | <code>from fastapi.middleware.cors import CORSMiddleware</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 3 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 4 行 | <code>app = FastAPI()</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 5 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 6 行 | <code>app.add_middleware(</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 7 行 | <code>    CORSMiddleware,</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 8 行 | <code>    allow_origins=["http://localhost:5173"],</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 9 行 | <code>    allow_credentials=True,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 10 行 | <code>    allow_methods=["*"],</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 11 行 | <code>    allow_headers=["*"],</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 12 行 | <code>)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |


不要在生产里随手写：

```python
allow_origins=["*"]
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>allow_origins=["*"]</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |


尤其是带凭证、Cookie、内部运维 API、修复动作 API 时。AIOps API 往往有高权限，CORS 配置必须收紧。

## OpenAPI 和自动文档

FastAPI 会自动生成 OpenAPI schema。

默认入口：

```text
/docs
/redoc
/openapi.json
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>/docs</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>/redoc</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>/openapi.json</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>@app.post(</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 2 行 | <code>    "/alerts",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 3 行 | <code>    response_model=AlertResponse,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 4 行 | <code>    status_code=202,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 5 行 | <code>    tags=["alerts"],</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 6 行 | <code>    summary="Receive an alert event",</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 7 行 | <code>)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 8 行 | <code>async def receive_alert(alert: AlertEvent):</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 9 行 | <code>    return AlertResponse(</code> | 返回函数结果，调用方会拿到这个值继续处理。 |
| 第 10 行 | <code>        id="a-1",</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 11 行 | <code>        service=alert.service,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 12 行 | <code>        severity=alert.severity,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 13 行 | <code>        status="queued",</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 14 行 | <code>    )</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |


对 AIOps 团队来说，OpenAPI 有三个价值：

- 前端、脚本、平台团队可以按文档联调。
- API 变更可以被 code review 看见。
- 后续能生成 SDK 或做契约测试。

## 项目结构

初学可以单文件：

```text
main.py
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>main.py</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>projects/fastapi-aiops-api/</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  README.md</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>  requirements.txt</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>  app/</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>    __init__.py</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 6 行 | <code>    main.py</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 7 行 | <code>    settings.py</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 8 行 | <code>    models/</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 9 行 | <code>      __init__.py</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 10 行 | <code>      alerts.py</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 11 行 | <code>    routers/</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 12 行 | <code>      __init__.py</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 13 行 | <code>      health.py</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 14 行 | <code>      alerts.py</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 15 行 | <code>      runbooks.py</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 16 行 | <code>    services/</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 17 行 | <code>      __init__.py</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 18 行 | <code>      dedup.py</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 19 行 | <code>      analysis.py</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 20 行 | <code>      runbook_executor.py</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 21 行 | <code>  tests/</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 22 行 | <code>    test_health.py</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 23 行 | <code>    test_alerts.py</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>from fastapi import FastAPI</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 3 行 | <code>from app.routers import alerts, health, runbooks</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 4 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 5 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 6 行 | <code>def create_app() -&gt; FastAPI:</code> | 定义函数，把一段可复用逻辑命名，后续可以反复调用。 |
| 第 7 行 | <code>    app = FastAPI(title="AIOps Lab API")</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 8 行 | <code>    app.include_router(health.router, tags=["health"])</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 9 行 | <code>    app.include_router(alerts.router, prefix="/alerts", tags=["alerts"])</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 10 行 | <code>    app.include_router(runbooks.router, prefix="/runbooks", tags=["runbooks"])</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 11 行 | <code>    return app</code> | 返回函数结果，调用方会拿到这个值继续处理。 |
| 第 12 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 13 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 14 行 | <code>app = create_app()</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |


### routers/health.py

```python
from fastapi import APIRouter

router = APIRouter()


@router.get("/healthz")
async def healthz():
    return {"status": "ok"}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>from fastapi import APIRouter</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 3 行 | <code>router = APIRouter()</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 4 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 5 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 6 行 | <code>@router.get("/healthz")</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 7 行 | <code>async def healthz():</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 8 行 | <code>    return {"status": "ok"}</code> | 返回函数结果，调用方会拿到这个值继续处理。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>from fastapi import APIRouter, status</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 3 行 | <code>from app.models.alerts import AlertEvent, AlertResponse</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 4 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 5 行 | <code>router = APIRouter()</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 6 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 7 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 8 行 | <code>@router.post("", response_model=AlertResponse, status_code=status.HTTP_202_ACCEPTED)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 9 行 | <code>async def receive_alert(alert: AlertEvent):</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 10 行 | <code>    return AlertResponse(</code> | 返回函数结果，调用方会拿到这个值继续处理。 |
| 第 11 行 | <code>        id=f"{alert.service}:{alert.instance}:{alert.alert_name}",</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 12 行 | <code>        service=alert.service,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 13 行 | <code>        severity=alert.severity,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 14 行 | <code>        status="queued",</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 15 行 | <code>    )</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>from datetime import datetime</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 3 行 | <code>from pydantic import BaseModel, Field</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 4 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 5 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 6 行 | <code>class AlertEvent(BaseModel):</code> | 定义类，用来组织一组数据和行为。 |
| 第 7 行 | <code>    service: str = Field(min_length=1)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 8 行 | <code>    instance: str = Field(min_length=1)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 9 行 | <code>    severity: str = Field(pattern="^(info&#124;warning&#124;critical)$")</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 10 行 | <code>    alert_name: str = Field(min_length=1)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 11 行 | <code>    starts_at: datetime &#124; None = None</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 12 行 | <code>    description: str &#124; None = None</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 13 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 14 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 15 行 | <code>class AlertResponse(BaseModel):</code> | 定义类，用来组织一组数据和行为。 |
| 第 16 行 | <code>    id: str</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 17 行 | <code>    service: str</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 18 行 | <code>    severity: str</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 19 行 | <code>    status: str</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>pip install pydantic-settings</code> | 管理 Python 依赖包，通常用于安装实验需要的库。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>from functools import lru_cache</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 3 行 | <code>from pydantic_settings import BaseSettings, SettingsConfigDict</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 4 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 5 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 6 行 | <code>class Settings(BaseSettings):</code> | 定义类，用来组织一组数据和行为。 |
| 第 7 行 | <code>    app_name: str = "AIOps Lab API"</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 8 行 | <code>    environment: str = "dev"</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 9 行 | <code>    mysql_url: str = "mysql+pymysql://aiops:aiops_pwd@127.0.0.1:3306/aiops_lab"</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 10 行 | <code>    redis_url: str = "redis://127.0.0.1:6379/0"</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 11 行 | <code>    api_key: str = "dev-secret"</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 12 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 13 行 | <code>    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 14 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 15 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 16 行 | <code>@lru_cache</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 17 行 | <code>def get_settings() -&gt; Settings:</code> | 定义函数，把一段可复用逻辑命名，后续可以反复调用。 |
| 第 18 行 | <code>    return Settings()</code> | 返回函数结果，调用方会拿到这个值继续处理。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>from typing import Annotated</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 3 行 | <code>from fastapi import Depends</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 4 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 5 行 | <code>from app.settings import Settings, get_settings</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 6 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 7 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 8 行 | <code>@app.get("/config-preview")</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 9 行 | <code>async def config_preview(settings: Annotated[Settings, Depends(get_settings)]):</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 10 行 | <code>    return {</code> | 返回函数结果，调用方会拿到这个值继续处理。 |
| 第 11 行 | <code>        "app_name": settings.app_name,</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 12 行 | <code>        "environment": settings.environment,</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 13 行 | <code>    }</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |


`.env` 示例：

```text
APP_NAME=AIOps Lab API
ENVIRONMENT=dev
MYSQL_URL=mysql+pymysql://aiops:aiops_pwd@127.0.0.1:3306/aiops_lab
REDIS_URL=redis://127.0.0.1:6379/0
API_KEY=dev-secret
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>APP_NAME=AIOps Lab API</code> | 环境变量或键值示例，等号左边是名称，右边是要配置的值。 |
| 第 2 行 | <code>ENVIRONMENT=dev</code> | 环境变量或键值示例，等号左边是名称，右边是要配置的值。 |
| 第 3 行 | <code>MYSQL_URL=mysql+pymysql://aiops:aiops_pwd@127.0.0.1:3306/aiops_lab</code> | 环境变量或键值示例，等号左边是名称，右边是要配置的值。 |
| 第 4 行 | <code>REDIS_URL=redis://127.0.0.1:6379/0</code> | 环境变量或键值示例，等号左边是名称，右边是要配置的值。 |
| 第 5 行 | <code>API_KEY=dev-secret</code> | 环境变量或键值示例，等号左边是名称，右边是要配置的值。 |


注意：`.env` 不要提交真实密钥。

## 健康检查

AIOps 服务必须有健康检查。

最小版：

```python
@app.get("/healthz")
async def healthz():
    return {"status": "ok"}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>@app.get("/healthz")</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 2 行 | <code>async def healthz():</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 3 行 | <code>    return {"status": "ok"}</code> | 返回函数结果，调用方会拿到这个值继续处理。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>from pydantic import BaseModel</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 3 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 4 行 | <code>class HealthResponse(BaseModel):</code> | 定义类，用来组织一组数据和行为。 |
| 第 5 行 | <code>    status: str</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 6 行 | <code>    version: str</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 7 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 8 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 9 行 | <code>@app.get("/healthz", response_model=HealthResponse)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 10 行 | <code>async def healthz():</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 11 行 | <code>    return HealthResponse(status="ok", version="0.1.0")</code> | 返回函数结果，调用方会拿到这个值继续处理。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>from datetime import datetime, timezone</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 3 行 | <code>from fastapi import FastAPI, status</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 4 行 | <code>from pydantic import BaseModel</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 5 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 6 行 | <code>app = FastAPI(title="AIOps Alert Receiver")</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 7 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 8 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 9 行 | <code>class AlertLabels(BaseModel):</code> | 定义类，用来组织一组数据和行为。 |
| 第 10 行 | <code>    alertname: str</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 11 行 | <code>    service: str &#124; None = None</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 12 行 | <code>    severity: str &#124; None = None</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 13 行 | <code>    instance: str &#124; None = None</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 14 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 15 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 16 行 | <code>class AlertAnnotation(BaseModel):</code> | 定义类，用来组织一组数据和行为。 |
| 第 17 行 | <code>    summary: str &#124; None = None</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 18 行 | <code>    description: str &#124; None = None</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 19 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 20 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 21 行 | <code>class AlertItem(BaseModel):</code> | 定义类，用来组织一组数据和行为。 |
| 第 22 行 | <code>    status: str</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 23 行 | <code>    labels: AlertLabels</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 24 行 | <code>    annotations: AlertAnnotation = AlertAnnotation()</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 25 行 | <code>    startsAt: datetime &#124; None = None</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 26 行 | <code>    endsAt: datetime &#124; None = None</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 27 行 | <code>    fingerprint: str &#124; None = None</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 28 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 29 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 30 行 | <code>class AlertmanagerWebhook(BaseModel):</code> | 定义类，用来组织一组数据和行为。 |
| 第 31 行 | <code>    receiver: str &#124; None = None</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 32 行 | <code>    status: str</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 33 行 | <code>    alerts: list[AlertItem]</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 34 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 35 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 36 行 | <code>@app.post("/webhooks/alertmanager", status_code=status.HTTP_202_ACCEPTED)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 37 行 | <code>async def receive_alertmanager(payload: AlertmanagerWebhook):</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 38 行 | <code>    received_at = datetime.now(timezone.utc).isoformat()</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 39 行 | <code>    return {</code> | 返回函数结果，调用方会拿到这个值继续处理。 |
| 第 40 行 | <code>        "received_at": received_at,</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 41 行 | <code>        "alert_count": len(payload.alerts),</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 42 行 | <code>        "next_action": "enqueue_for_analysis",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 43 行 | <code>    }</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |


模拟请求：

```bash
curl -X POST http://127.0.0.1:8000/webhooks/alertmanager \
  -H "Content-Type: application/json" \
  -d '{"status":"firing","alerts":[{"status":"firing","labels":{"alertname":"HighErrorRate","service":"order-api","severity":"critical","instance":"10.0.1.11"},"annotations":{"summary":"High error rate"}}]}'
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -X POST http://127.0.0.1:8000/webhooks/alertmanager \</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |
| 第 2 行 | <code>  -H "Content-Type: application/json" \</code> | 执行 `-h` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>  -d '{"status":"firing","alerts":[{"status":"firing","labels":{"alertname":"HighErrorRate","service":"order-api","severity":"critical","instance":"10.0.1.11"},"annotations":{"summary":"High error rate"}}]}'</code> | 执行 `-d` 相关命令，后面的参数决定它具体操作什么对象。 |


这个接口现在只是接收和校验。真实系统里下一步通常是：

```text
receive webhook
  -> validate
  -> normalize labels
  -> generate fingerprint
  -> deduplicate with Redis
  -> store raw event
  -> enqueue analysis job
  -> return 202
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>receive webhook</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; validate</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; normalize labels</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>  -&gt; generate fingerprint</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>  -&gt; deduplicate with Redis</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 6 行 | <code>  -&gt; store raw event</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 7 行 | <code>  -&gt; enqueue analysis job</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 8 行 | <code>  -&gt; return 202</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


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
received
  -> queued
  -> analyzing
  -> completed
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>received</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; queued</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; analyzing</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>  -&gt; completed</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


或：

```text
received
  -> queued
  -> failed
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>received</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; queued</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; failed</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>from datetime import datetime, timezone</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 2 行 | <code>from enum import StrEnum</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 3 行 | <code>from uuid import uuid4</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 4 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 5 行 | <code>from fastapi import BackgroundTasks, FastAPI, HTTPException, status</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 6 行 | <code>from pydantic import BaseModel, Field</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 7 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 8 行 | <code>app = FastAPI(title="AIOps Alert API")</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 9 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 10 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 11 行 | <code>class Severity(StrEnum):</code> | 定义类，用来组织一组数据和行为。 |
| 第 12 行 | <code>    info = "info"</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 13 行 | <code>    warning = "warning"</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 14 行 | <code>    critical = "critical"</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 15 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 16 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 17 行 | <code>class AlertCreate(BaseModel):</code> | 定义类，用来组织一组数据和行为。 |
| 第 18 行 | <code>    service: str = Field(min_length=1)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 19 行 | <code>    instance: str = Field(min_length=1)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 20 行 | <code>    severity: Severity</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 21 行 | <code>    alert_name: str = Field(min_length=1)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 22 行 | <code>    description: str &#124; None = None</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 23 行 | <code>    metric_value: float &#124; None = None</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 24 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 25 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 26 行 | <code>class AlertRead(BaseModel):</code> | 定义类，用来组织一组数据和行为。 |
| 第 27 行 | <code>    id: str</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 28 行 | <code>    service: str</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 29 行 | <code>    instance: str</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 30 行 | <code>    severity: Severity</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 31 行 | <code>    alert_name: str</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 32 行 | <code>    status: str</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 33 行 | <code>    created_at: datetime</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 34 行 | <code>    description: str &#124; None = None</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 35 行 | <code>    metric_value: float &#124; None = None</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 36 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 37 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 38 行 | <code>class AnalysisRead(BaseModel):</code> | 定义类，用来组织一组数据和行为。 |
| 第 39 行 | <code>    alert_id: str</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 40 行 | <code>    status: str</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 41 行 | <code>    summary: str &#124; None = None</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 42 行 | <code>    suggested_action: str &#124; None = None</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 43 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 44 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 45 行 | <code>alerts: dict[str, AlertRead] = {}</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 46 行 | <code>analysis_results: dict[str, AnalysisRead] = {}</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 47 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 48 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 49 行 | <code>@app.get("/healthz")</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 50 行 | <code>async def healthz():</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 51 行 | <code>    return {"status": "ok"}</code> | 返回函数结果，调用方会拿到这个值继续处理。 |
| 第 52 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 53 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 54 行 | <code>@app.post("/alerts", response_model=AlertRead, status_code=status.HTTP_201_CREATED)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 55 行 | <code>async def create_alert(alert: AlertCreate):</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 56 行 | <code>    alert_id = str(uuid4())</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 57 行 | <code>    item = AlertRead(</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 58 行 | <code>        id=alert_id,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 59 行 | <code>        service=alert.service,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 60 行 | <code>        instance=alert.instance,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 61 行 | <code>        severity=alert.severity,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 62 行 | <code>        alert_name=alert.alert_name,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 63 行 | <code>        status="received",</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 64 行 | <code>        created_at=datetime.now(timezone.utc),</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 65 行 | <code>        description=alert.description,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 66 行 | <code>        metric_value=alert.metric_value,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 67 行 | <code>    )</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 68 行 | <code>    alerts[alert_id] = item</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 69 行 | <code>    return item</code> | 返回函数结果，调用方会拿到这个值继续处理。 |
| 第 70 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 71 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 72 行 | <code>@app.get("/alerts", response_model=list[AlertRead])</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 73 行 | <code>async def list_alerts(severity: Severity &#124; None = None, limit: int = 20):</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 74 行 | <code>    items = list(alerts.values())</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 75 行 | <code>    if severity:</code> | 条件判断，只有条件成立时才执行下面缩进的代码。 |
| 第 76 行 | <code>        items = [item for item in items if item.severity == severity]</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 77 行 | <code>    return items[:limit]</code> | 返回函数结果，调用方会拿到这个值继续处理。 |
| 第 78 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 79 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 80 行 | <code>@app.get("/alerts/{alert_id}", response_model=AlertRead)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 81 行 | <code>async def get_alert(alert_id: str):</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 82 行 | <code>    if alert_id not in alerts:</code> | 条件判断，只有条件成立时才执行下面缩进的代码。 |
| 第 83 行 | <code>        raise HTTPException(status_code=404, detail="Alert not found")</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 84 行 | <code>    return alerts[alert_id]</code> | 返回函数结果，调用方会拿到这个值继续处理。 |
| 第 85 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 86 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 87 行 | <code>def analyze_alert(alert_id: str):</code> | 定义函数，把一段可复用逻辑命名，后续可以反复调用。 |
| 第 88 行 | <code>    alert = alerts[alert_id]</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 89 行 | <code>    if alert.severity == Severity.critical:</code> | 条件判断，只有条件成立时才执行下面缩进的代码。 |
| 第 90 行 | <code>        summary = f"{alert.service} has a critical alert: {alert.alert_name}"</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 91 行 | <code>        suggested_action = "Check recent deploys, error rate, and pod restarts."</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 92 行 | <code>    else:</code> | 兜底分支，前面的条件都不成立时执行。 |
| 第 93 行 | <code>        summary = f"{alert.service} has a non-critical alert: {alert.alert_name}"</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 94 行 | <code>        suggested_action = "Watch trend and compare with baseline."</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 95 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 96 行 | <code>    analysis_results[alert_id] = AnalysisRead(</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 97 行 | <code>        alert_id=alert_id,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 98 行 | <code>        status="completed",</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 99 行 | <code>        summary=summary,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 100 行 | <code>        suggested_action=suggested_action,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 101 行 | <code>    )</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 102 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 103 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 104 行 | <code>@app.post(</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 105 行 | <code>    "/alerts/{alert_id}/analysis",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 106 行 | <code>    response_model=AnalysisRead,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 107 行 | <code>    status_code=status.HTTP_202_ACCEPTED,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 108 行 | <code>)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 109 行 | <code>async def start_analysis(alert_id: str, background_tasks: BackgroundTasks):</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 110 行 | <code>    if alert_id not in alerts:</code> | 条件判断，只有条件成立时才执行下面缩进的代码。 |
| 第 111 行 | <code>        raise HTTPException(status_code=404, detail="Alert not found")</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 112 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 113 行 | <code>    analysis_results[alert_id] = AnalysisRead(alert_id=alert_id, status="queued")</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 114 行 | <code>    background_tasks.add_task(analyze_alert, alert_id)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 115 行 | <code>    return analysis_results[alert_id]</code> | 返回函数结果，调用方会拿到这个值继续处理。 |
| 第 116 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 117 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 118 行 | <code>@app.get("/alerts/{alert_id}/analysis", response_model=AnalysisRead)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 119 行 | <code>async def get_analysis(alert_id: str):</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 120 行 | <code>    if alert_id not in alerts:</code> | 条件判断，只有条件成立时才执行下面缩进的代码。 |
| 第 121 行 | <code>        raise HTTPException(status_code=404, detail="Alert not found")</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 122 行 | <code>    if alert_id not in analysis_results:</code> | 条件判断，只有条件成立时才执行下面缩进的代码。 |
| 第 123 行 | <code>        raise HTTPException(status_code=404, detail="Analysis not found")</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 124 行 | <code>    return analysis_results[alert_id]</code> | 返回函数结果，调用方会拿到这个值继续处理。 |


### 运行

```bash
fastapi dev main.py
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>fastapi dev main.py</code> | 执行 `fastapi` 相关命令，后面的参数决定它具体操作什么对象。 |


### 创建告警

```bash
curl -X POST http://127.0.0.1:8000/alerts \
  -H "Content-Type: application/json" \
  -d '{"service":"order-api","instance":"10.0.1.11","severity":"critical","alert_name":"HighErrorRate","metric_value":0.23}'
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -X POST http://127.0.0.1:8000/alerts \</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |
| 第 2 行 | <code>  -H "Content-Type: application/json" \</code> | 执行 `-h` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>  -d '{"service":"order-api","instance":"10.0.1.11","severity":"critical","alert_name":"HighErrorRate","metric_value":0.23}'</code> | 执行 `-d` 相关命令，后面的参数决定它具体操作什么对象。 |


### 触发分析

把返回的 `id` 替换到命令里：

```bash
curl -X POST http://127.0.0.1:8000/alerts/ALERT_ID/analysis
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -X POST http://127.0.0.1:8000/alerts/ALERT_ID/analysis</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |


### 查询分析

```bash
curl http://127.0.0.1:8000/alerts/ALERT_ID/analysis
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl http://127.0.0.1:8000/alerts/ALERT_ID/analysis</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>pip install pytest httpx</code> | 管理 Python 依赖包，通常用于安装实验需要的库。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>from fastapi.testclient import TestClient</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 3 行 | <code>from main import app</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 4 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 5 行 | <code>client = TestClient(app)</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 6 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 7 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 8 行 | <code>def test_healthz():</code> | 定义函数，把一段可复用逻辑命名，后续可以反复调用。 |
| 第 9 行 | <code>    response = client.get("/healthz")</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 10 行 | <code>    assert response.status_code == 200</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 11 行 | <code>    assert response.json()["status"] == "ok"</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>from fastapi.testclient import TestClient</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 3 行 | <code>from main import app</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 4 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 5 行 | <code>client = TestClient(app)</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 6 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 7 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 8 行 | <code>def test_create_alert():</code> | 定义函数，把一段可复用逻辑命名，后续可以反复调用。 |
| 第 9 行 | <code>    response = client.post(</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 10 行 | <code>        "/alerts",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 11 行 | <code>        json={</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 12 行 | <code>            "service": "order-api",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 13 行 | <code>            "instance": "10.0.1.11",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 14 行 | <code>            "severity": "critical",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 15 行 | <code>            "alert_name": "HighErrorRate",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 16 行 | <code>            "metric_value": 0.23,</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 17 行 | <code>        },</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 18 行 | <code>    )</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 19 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 20 行 | <code>    assert response.status_code == 201</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 21 行 | <code>    data = response.json()</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 22 行 | <code>    assert data["service"] == "order-api"</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 23 行 | <code>    assert data["status"] == "received"</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 24 行 | <code>    assert "id" in data</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 25 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 26 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 27 行 | <code>def test_invalid_severity_returns_422():</code> | 定义函数，把一段可复用逻辑命名，后续可以反复调用。 |
| 第 28 行 | <code>    response = client.post(</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 29 行 | <code>        "/alerts",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 30 行 | <code>        json={</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 31 行 | <code>            "service": "order-api",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 32 行 | <code>            "instance": "10.0.1.11",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 33 行 | <code>            "severity": "urgent",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 34 行 | <code>            "alert_name": "HighErrorRate",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 35 行 | <code>        },</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 36 行 | <code>    )</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 37 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 38 行 | <code>    assert response.status_code == 422</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |


运行：

```bash
pytest
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>pytest</code> | 执行 `pytest` 相关命令，后面的参数决定它具体操作什么对象。 |


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
router
  -> parse HTTP request
  -> call service
service
  -> business logic
  -> call repository / client / model
repository
  -> MySQL / Redis / Kafka / file
model code
  -> pandas / scikit-learn / LLM
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>router</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; parse HTTP request</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; call service</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>service</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>  -&gt; business logic</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 6 行 | <code>  -&gt; call repository / client / model</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 7 行 | <code>repository</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 8 行 | <code>  -&gt; MySQL / Redis / Kafka / file</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 9 行 | <code>model code</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 10 行 | <code>  -&gt; pandas / scikit-learn / LLM</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


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
FastAPI request
  -> load features
  -> call model.predict
  -> return score / label / explanation
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>FastAPI request</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; load features</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; call model.predict</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>  -&gt; return score / label / explanation</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>fastapi dev main.py</code> | 执行 `fastapi` 相关命令，后面的参数决定它具体操作什么对象。 |


生产运行可以使用：

```bash
fastapi run main.py
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>fastapi run main.py</code> | 执行 `fastapi` 相关命令，后面的参数决定它具体操作什么对象。 |


也可以显式使用 Uvicorn：

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>uvicorn app.main:app --host 0.0.0.0 --port 8000</code> | 启动 ASGI Web 服务，常用于运行 FastAPI 实验接口。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


开发时常用自动重载：

```bash
uvicorn app.main:app --reload
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>uvicorn app.main:app --reload</code> | 启动 ASGI Web 服务，常用于运行 FastAPI 实验接口。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


生产环境不要依赖 `--reload`。

### requirements.txt

```text
fastapi[standard]
pydantic-settings
pytest
httpx
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>fastapi[standard]</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>pydantic-settings</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>pytest</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>httpx</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>FROM python:3.12-slim</code> | 指定基础镜像，后续镜像会在它的基础上继续构建。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔 Dockerfile 的不同构建阶段或逻辑段。 |
| 第 3 行 | <code>WORKDIR /app</code> | 设置容器内工作目录，后续命令默认在这个目录执行。 |
| 第 4 行 | <em>空行</em> | 空行，用来分隔 Dockerfile 的不同构建阶段或逻辑段。 |
| 第 5 行 | <code>COPY requirements.txt .</code> | 把宿主机项目文件复制进镜像。 |
| 第 6 行 | <code>RUN pip install --no-cache-dir -r requirements.txt</code> | 在构建镜像时执行命令，常用于安装依赖或准备文件。 |
| 第 7 行 | <em>空行</em> | 空行，用来分隔 Dockerfile 的不同构建阶段或逻辑段。 |
| 第 8 行 | <code>COPY app ./app</code> | 把宿主机项目文件复制进镜像。 |
| 第 9 行 | <em>空行</em> | 空行，用来分隔 Dockerfile 的不同构建阶段或逻辑段。 |
| 第 10 行 | <code>EXPOSE 8000</code> | 声明容器应用监听的端口，方便读者知道服务入口。 |
| 第 11 行 | <em>空行</em> | 空行，用来分隔 Dockerfile 的不同构建阶段或逻辑段。 |
| 第 12 行 | <code>CMD ["fastapi", "run", "app/main.py", "--host", "0.0.0.0", "--port", "8000"]</code> | 设置容器启动时默认执行的命令。 |


### docker compose

```yaml
services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      ENVIRONMENT: dev
      API_KEY: dev-secret
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>services:</code> | 定义 `services` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  api:</code> | 定义 `api` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    build: .</code> | 设置 `build` 字段的值为 `.`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>    ports:</code> | 定义 `ports` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 5 行 | <code>      - "8000:8000"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 6 行 | <code>    environment:</code> | 定义 `environment` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 7 行 | <code>      ENVIRONMENT: dev</code> | 设置 `ENVIRONMENT` 字段的值为 `dev`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 8 行 | <code>      API_KEY: dev-secret</code> | 设置 `API_KEY` 字段的值为 `dev-secret`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>livenessProbe:</code> | 定义 `livenessProbe` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  httpGet:</code> | 定义 `httpGet` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    path: /healthz</code> | 设置 `path` 字段的值为 `/healthz`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>    port: 8000</code> | 设置 `port` 字段的值为 `8000`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 5 行 | <code>  initialDelaySeconds: 10</code> | 设置 `initialDelaySeconds` 字段的值为 `10`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 6 行 | <code>  periodSeconds: 10</code> | 设置 `periodSeconds` 字段的值为 `10`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 7 行 | <code>readinessProbe:</code> | 定义 `readinessProbe` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 8 行 | <code>  httpGet:</code> | 定义 `httpGet` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 9 行 | <code>    path: /healthz</code> | 设置 `path` 字段的值为 `/healthz`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 10 行 | <code>    port: 8000</code> | 设置 `port` 字段的值为 `8000`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 11 行 | <code>  initialDelaySeconds: 5</code> | 设置 `initialDelaySeconds` 字段的值为 `5`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 12 行 | <code>  periodSeconds: 5</code> | 设置 `periodSeconds` 字段的值为 `5`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>level=info method=POST path=/alerts status=201 elapsed_ms=12 request_id=req-001 alert_id=a-1</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


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
POST /alerts
  -> Redis dedup
  -> MySQL insert
  -> Kafka publish
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>POST /alerts</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; Redis dedup</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; MySQL insert</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>  -&gt; Kafka publish</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>from typing import Annotated</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 3 行 | <code>from fastapi import Depends, Header, HTTPException</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 4 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 5 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 6 行 | <code>async def require_api_key(</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 7 行 | <code>    x_api_key: Annotated[str &#124; None, Header(alias="X-API-Key")] = None,</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 8 行 | <code>):</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 9 行 | <code>    if x_api_key != "dev-secret":</code> | 条件判断，只有条件成立时才执行下面缩进的代码。 |
| 第 10 行 | <code>        raise HTTPException(status_code=401, detail="Invalid API key")</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>app = FastAPI(title="AIOps Lab API")</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |


创建应用对象。

### app.get / app.post

```python
@app.get("/healthz")
@app.post("/alerts")
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>@app.get("/healthz")</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 2 行 | <code>@app.post("/alerts")</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |


注册路径操作。

### APIRouter

```python
router = APIRouter()
app.include_router(router, prefix="/alerts", tags=["alerts"])
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>router = APIRouter()</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 2 行 | <code>app.include_router(router, prefix="/alerts", tags=["alerts"])</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |


用于多文件拆分和模块化路由。

### BaseModel

```python
class AlertEvent(BaseModel):
    service: str
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>class AlertEvent(BaseModel):</code> | 定义类，用来组织一组数据和行为。 |
| 第 2 行 | <code>    service: str</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |


定义请求或响应数据模型。

### Field

```python
service: str = Field(min_length=1)
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>service: str = Field(min_length=1)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |


声明字段校验、默认值和文档信息。

### HTTPException

```python
raise HTTPException(status_code=404, detail="Alert not found")
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>raise HTTPException(status_code=404, detail="Alert not found")</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |


返回标准 HTTP 错误。

### Depends

```python
settings: Annotated[Settings, Depends(get_settings)]
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>settings: Annotated[Settings, Depends(get_settings)]</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |


声明依赖，让 FastAPI 调用并传入结果。

### Header

```python
x_api_key: Annotated[str | None, Header(alias="X-API-Key")] = None
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>x_api_key: Annotated[str &#124; None, Header(alias="X-API-Key")] = None</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |


读取请求 header。

### BackgroundTasks

```python
background_tasks.add_task(analyze_alert, alert_id)
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>background_tasks.add_task(analyze_alert, alert_id)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |


响应返回后执行轻量任务。

### status

```python
status_code=status.HTTP_202_ACCEPTED
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>status_code=status.HTTP_202_ACCEPTED</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |


使用可读常量代替裸数字。

### TestClient

```python
client = TestClient(app)
response = client.get("/healthz")
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>client = TestClient(app)</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 2 行 | <code>response = client.get("/healthz")</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |


测试 API。

## 命令速查

### 创建环境

```bash
python -m venv .venv
source .venv/bin/activate
pip install "fastapi[standard]"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>python -m venv .venv</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 |
| 第 2 行 | <code>source .venv/bin/activate</code> | 执行 `source` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>pip install "fastapi[standard]"</code> | 管理 Python 依赖包，通常用于安装实验需要的库。 |


PowerShell：

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install "fastapi[standard]"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>python -m venv .venv</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 |
| 第 2 行 | <code>.venv\Scripts\Activate.ps1</code> | 执行 `.venv\scripts\activate.ps1` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>pip install "fastapi[standard]"</code> | 管理 Python 依赖包，通常用于安装实验需要的库。 |


### 开发运行

```bash
fastapi dev main.py
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>fastapi dev main.py</code> | 执行 `fastapi` 相关命令，后面的参数决定它具体操作什么对象。 |


### 指定端口

```bash
fastapi dev main.py --port 8001
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>fastapi dev main.py --port 8001</code> | 执行 `fastapi` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


### Uvicorn 运行

```bash
uvicorn main:app --reload
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>uvicorn main:app --reload</code> | 启动 ASGI Web 服务，常用于运行 FastAPI 实验接口。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 2 行 | <code>uvicorn app.main:app --host 0.0.0.0 --port 8000</code> | 启动 ASGI Web 服务，常用于运行 FastAPI 实验接口。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


### 生产运行

```bash
fastapi run app/main.py --host 0.0.0.0 --port 8000
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>fastapi run app/main.py --host 0.0.0.0 --port 8000</code> | 执行 `fastapi` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


### 测试

```bash
pytest
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>pytest</code> | 执行 `pytest` 相关命令，后面的参数决定它具体操作什么对象。 |


### 查看 OpenAPI

```bash
curl http://127.0.0.1:8000/openapi.json
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl http://127.0.0.1:8000/openapi.json</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |


### 调用健康检查

```bash
curl http://127.0.0.1:8000/healthz
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl http://127.0.0.1:8000/healthz</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |


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

## 学习证据

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
