# FastAPI

## 官方资料

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [FastAPI First Steps](https://fastapi.tiangolo.com/tutorial/first-steps/)
- [Path Parameters](https://fastapi.tiangolo.com/tutorial/path-params/)
- [Request Body](https://fastapi.tiangolo.com/tutorial/body/)
- [Background Tasks](https://fastapi.tiangolo.com/tutorial/background-tasks/)

> 学习说明：本篇按 FastAPI 官方教程从第一个接口开始，扩展到 AIOps 常见的告警接收、异常检测接口、后台任务和健康检查。

## 为什么要学

FastAPI 能把 Python 脚本变成可被调用的 HTTP 服务。AIOps 项目里，告警 webhook、异常检测 API、runbook 推荐服务、LLM 摘要服务，都可以用 FastAPI 快速实现。

## 它解决什么问题

- 把 Python 分析逻辑封装成 API。
- 接收 Alertmanager webhook 或前端请求。
- 提供健康检查、参数校验和 OpenAPI 文档。
- 让 AIOps 原型从脚本变成服务。
- 方便容器化并接入 Prometheus/Grafana。

## 是什么

FastAPI 是一个 Python Web API 框架。它适合快速构建 HTTP 接口，并自动生成 OpenAPI 文档。

AIOps 里它常用于：

- 接收 Alertmanager webhook。
- 暴露异常检测 API。
- 查询告警分析结果。
- 触发 runbook 自动化。
- 给前端或脚本提供统一入口。

## 核心原理

FastAPI 的核心是：

```text
HTTP request
  -> path operation
  -> type validation by Pydantic
  -> business logic
  -> JSON response
  -> OpenAPI docs
```

官方 first steps 中最小应用就是：

```python
from fastapi import FastAPI

app = FastAPI()


@app.get("/")
async def root():
    return {"message": "Hello World"}
```

保存为 `main.py` 后运行开发服务。

## 安装

```bash
python -m venv .venv
. .venv/bin/activate
pip install "fastapi[standard]"
```

Windows PowerShell：

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install "fastapi[standard]"
```

## 第一个 API

`main.py`：

```python
from fastapi import FastAPI

app = FastAPI(title="AIOps Lab API")


@app.get("/")
async def root():
    return {"message": "AIOps API is running"}
```

启动：

```bash
fastapi dev main.py
```

访问：

```text
http://127.0.0.1:8000/
http://127.0.0.1:8000/docs
```

`/docs` 是自动生成的 Swagger UI，学习 API 时非常方便。

## 路径参数

按服务查询状态：

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

## 查询参数

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

## 请求体

使用 Pydantic 模型定义请求体：

```python
from pydantic import BaseModel


class AlertEvent(BaseModel):
    service: str
    instance: str
    severity: str
    alert_name: str
    metric_value: float | None = None


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

FastAPI 会自动校验字段类型。如果 `metric_value` 传了字符串且不能转换为数字，会返回 422。

## 健康检查

服务必须有健康检查接口：

```python
@app.get("/healthz")
async def healthz():
    return {"status": "ok"}
```

Kubernetes 或负载均衡可以调用这个接口判断服务是否存活。

## 告警接收器

AIOps 常见入口是 Alertmanager webhook。先做一个简化版：

```python
from datetime import datetime, timezone

from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="AIOps Alert Receiver")


class AlertEvent(BaseModel):
    service: str
    instance: str
    severity: str
    alert_name: str
    starts_at: datetime | None = None
    description: str | None = None


@app.post("/webhooks/alerts")
async def receive_alert(alert: AlertEvent):
    received_at = datetime.now(timezone.utc).isoformat()
    return {
        "received_at": received_at,
        "fingerprint": f"{alert.service}:{alert.instance}:{alert.alert_name}",
        "next_action": "enqueue_for_analysis",
    }
```

## 后台任务

有些任务不应该阻塞 HTTP 请求，比如调用 LLM、写报告、发送通知。FastAPI 支持 background tasks：

```python
from fastapi import BackgroundTasks, FastAPI

app = FastAPI()


def analyze_alert(alert_id: str):
    print(f"analyzing alert {alert_id}")


@app.post("/alerts/{alert_id}/analyze")
async def analyze(alert_id: str, background_tasks: BackgroundTasks):
    background_tasks.add_task(analyze_alert, alert_id)
    return {"accepted": True, "alert_id": alert_id}
```

学习阶段可以用 BackgroundTasks，生产上更推荐把耗时任务丢给 Redis Queue、Celery、Kafka consumer 或其他任务系统。

## 配置管理

不要把数据库密码写死在代码里。使用环境变量：

```python
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    mysql_url: str = "mysql+pymysql://aiops:aiops_pwd@127.0.0.1:3306/aiops_lab"
    redis_url: str = "redis://127.0.0.1:6379/0"


settings = Settings()
```

安装：

```bash
pip install pydantic-settings
```

运行时：

```bash
MYSQL_URL="mysql+pymysql://..." fastapi dev main.py
```

## 项目结构

初学可以从单文件开始，之后拆分：

```text
projects/fastapi-aiops-api/
  app/
    main.py
    models.py
    settings.py
    routers/
      alerts.py
      health.py
    services/
      dedup.py
      anomaly.py
  tests/
    test_health.py
  README.md
```

`main.py`：

```python
from fastapi import FastAPI

from app.routers import alerts, health

app = FastAPI(title="AIOps Lab API")
app.include_router(health.router)
app.include_router(alerts.router, prefix="/alerts", tags=["alerts"])
```

## 测试

安装：

```bash
pip install pytest httpx
```

`tests/test_health.py`：

```python
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_healthz():
    response = client.get("/healthz")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
```

运行：

```bash
pytest
```

## 部署运行

开发：

```bash
fastapi dev main.py
```

生产通常使用：

```bash
fastapi run main.py
```

或显式使用 ASGI server：

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Dockerfile 示例：

```dockerfile
FROM python:3.12-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app ./app

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## AIOps 中的作用

FastAPI 是 AIOps 项目里的“接口层”：

```text
Alertmanager / script / frontend
  -> FastAPI
      -> Redis dedup
      -> Kafka publish
      -> MySQL query
      -> scikit-learn predict
      -> OpenAI summary
```

它不负责所有计算，而是把能力包装成标准 API。

## 入门练习：告警分析 API

目录建议：

```text
projects/fastapi-alert-api/
  README.md
  app/
    main.py
  tests/
    test_api.py
```

必须实现：

- `GET /healthz`
- `POST /alerts`
- `GET /alerts/{alert_id}`
- `POST /alerts/{alert_id}/analyze`
- `/docs` 可打开

可以先用内存字典保存数据：

```python
alerts = {}
```

重点是跑通 API，而不是一开始就接数据库。

## 常见故障

### 端口被占用

```bash
fastapi dev main.py --port 8001
```

### 422 错误

表示请求体和 Pydantic 模型不匹配。打开 `/docs` 看字段要求。

### ImportError

检查：

- 是否激活虚拟环境。
- 是否在项目根目录运行。
- 包路径是否正确。

### 接口卡住

不要在请求里执行长时间任务。把慢任务放到后台任务、队列或 worker。

## 学习检查清单

- [ ] 我能写一个最小 FastAPI 应用。
- [ ] 我能定义 GET 和 POST 接口。
- [ ] 我能使用 Pydantic 模型校验请求体。
- [ ] 我能运行 Uvicorn 并访问 `/docs`。
- [ ] 我能写健康检查接口。
- [ ] 我能接收一条模拟 Alertmanager webhook。

## 面试题

1. FastAPI 在 AIOps 项目中适合做什么？
2. FastAPI 和普通 Python 脚本有什么区别？
3. Pydantic 在请求处理中有什么作用？
4. `/docs` 页面来自哪里？
5. 为什么 API 服务需要健康检查？
6. 如何接收 Alertmanager webhook？
7. FastAPI 服务如何容器化？
8. 如何给 AIOps API 增加鉴权和限流？

## 学习证据

学完后，在 GitHub 留下：

- FastAPI 项目代码。
- 至少 4 个接口。
- `/docs` 截图。
- `curl` 调用示例。
- 一个 pytest 测试。
- README 解释 FastAPI 在 AIOps 架构中的位置。
